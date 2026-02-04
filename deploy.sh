#!/bin/bash

# PLN Icon Plus Project Tracker - Deployment Script
# This script automates deployment to production server

set -e

echo "🚀 PLN Icon Plus Project Tracker - Production Deployment"
echo "========================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.production.example..."
    cp .env.production.example .env
    echo "✅ Please edit .env file with production values before continuing"
    echo "   Required:"
    echo "   - DB_PASSWORD (strong password)"
    echo "   - AUTH_SECRET (generate with: openssl rand -base64 32)"
    echo "   - NEXTAUTH_URL (your production URL)"
    exit 1
fi

echo "📦 Pulling latest code..."
git pull origin master || echo "⚠️  Git pull failed. Continuing with local code..."

echo "🛠️  Building Docker images..."
docker-compose build --no-cache

echo "🗄️  Starting services..."
docker-compose down
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "📊 Running database migrations..."
docker-compose exec app npx prisma migrate deploy

echo "👤 Seeding initial users..."
docker-compose exec app npx tsx prisma/seed-user.ts || echo "ℹ️  Users already exist"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📍 Application: http://localhost:3000"
echo "📍 pgAdmin: http://localhost:5050 (optional)"
echo ""
echo "🔐 Default Login:"
echo "   Email: admin123@plniconplus.com"
echo "   Password: 123"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f app"
echo "   Stop services: docker-compose down"
echo "   Restart: docker-compose restart app"
echo "   Database backup: docker-compose exec postgres pg_dump -U plnuser plnprojecttracker > backup.sql"
echo ""
