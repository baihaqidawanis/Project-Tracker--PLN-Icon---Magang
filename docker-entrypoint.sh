#!/bin/sh
set -e

echo "Pushing database schema..."
npx prisma db push --accept-data-loss

echo "Seeding database..."
npx prisma db seed || echo "Seed skipped (may already exist)"

echo "Starting Next.js application..."
exec node server.js
