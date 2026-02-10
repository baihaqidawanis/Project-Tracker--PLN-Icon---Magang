#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx prisma db seed || echo "Seed skipped (may already exist)"

echo "Starting Next.js application..."
exec node server.js
