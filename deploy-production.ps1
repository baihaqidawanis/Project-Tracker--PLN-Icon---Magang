# PLN Project Tracker - Production Deployment Script (Windows)
# Usage: .\deploy-production.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 PLN Project Tracker - Production Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-Not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file from .env.production.example" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    exit 1
}

# Check Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

# Pull latest code (if git repo)
if (Test-Path .git) {
    Write-Host "📥 Pulling latest code..." -ForegroundColor Yellow
    git pull origin main
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build new images
Write-Host "🔨 Building Docker images..." -ForegroundColor Yellow
docker-compose build --no-cache

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run database migrations
Write-Host "📊 Running database migrations..." -ForegroundColor Yellow
docker-compose exec -T app npx prisma migrate deploy

# Create default admin user
Write-Host "👤 Creating default admin user..." -ForegroundColor Yellow
docker-compose exec -T app npx tsx prisma/seed-user.ts

# Show running containers
Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Running Services:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🔗 Access URLs:" -ForegroundColor Cyan
Write-Host "   - Application: http://localhost:3000"
Write-Host "   - MinIO Console: http://localhost:9001"
Write-Host "   - pgAdmin: http://localhost:5050 (run with --profile admin)"
Write-Host ""
Write-Host "📝 Logs:" -ForegroundColor Cyan
Write-Host "   - View logs: docker-compose logs -f"
Write-Host "   - View app logs: docker-compose logs -f app"
Write-Host ""
Write-Host "🎉 Deployment successful!" -ForegroundColor Green
