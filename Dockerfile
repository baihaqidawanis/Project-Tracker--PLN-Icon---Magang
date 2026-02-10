# Multi-stage build for production-ready Next.js app

# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy package files and install ALL dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Set environment to production
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV DOCKER_BUILD true

# Generate Prisma Client
RUN pnpm prisma generate

# Build Next.js app
RUN pnpm run build

# Stage 2: Runner (Production)
FROM node:20-slim AS runner
WORKDIR /app

# Install OpenSSL for Prisma runtime and dos2unix for line endings
RUN apt-get update -y && apt-get install -y openssl dos2unix && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy ALL node_modules from builder (includes Prisma client)
COPY --from=builder /app/node_modules ./node_modules

# Fix line endings for migration files (Critical for Windows hosts)
RUN find ./prisma -type f -name "*.sql" -exec dos2unix {} +

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN dos2unix /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

# Set proper permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD ["node", "server.js"]
