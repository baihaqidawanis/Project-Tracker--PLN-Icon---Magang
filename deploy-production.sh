#!/bin/bash

# PLN Project Tracker - Production Deployment Script
# Usage: ./deploy-production.sh

set -e  # Exit on error

echo "🚀 PLN Project Tracker - Production Deployment"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file from .env.production.example"
    exit 1
fi

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"

# Pull latest code (if git repo)
if [ -d .git ]; then
    echo -e "${YELLOW}📥 Pulling latest code...${NC}"
    git pull origin main || git pull origin master
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down

# Remove old images (optional, uncomment to save space)
# echo -e "${YELLOW}🗑️  Removing old images...${NC}"
# docker image prune -f

# Build new images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose build --no-cache

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}📊 Running database migrations...${NC}"
docker-compose exec -T app npx prisma migrate deploy

# Create default admin user (if needed)
echo -e "${YELLOW}👤 Creating default admin user...${NC}"
docker-compose exec -T app npx tsx prisma/seed-user.ts || echo "User already exists"

# Show running containers
echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📊 Running Services:"
docker-compose ps

echo ""
echo "🔗 Access URLs:"
echo "   - Application: http://localhost:3000"
echo "   - MinIO Console: http://localhost:9001"
echo "   - pgAdmin: http://localhost:5050 (run with --profile admin)"
echo ""
echo "📝 Logs:"
echo "   - View logs: docker-compose logs -f"
echo "   - View app logs: docker-compose logs -f app"
echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
