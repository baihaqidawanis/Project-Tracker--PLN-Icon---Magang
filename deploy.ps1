# PLN Icon Plus Project Tracker - Deployment Script (Windows PowerShell)
# This script automates deployment to production server

Write-Host "🚀 PLN Icon Plus Project Tracker - Production Deployment" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker-compose is not installed. Please install docker-compose first." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (!(Test-Path .env)) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "📝 Creating .env from .env.production.example..." -ForegroundColor Yellow
    Copy-Item .env.production.example .env
    Write-Host "✅ Please edit .env file with production values before continuing" -ForegroundColor Green
    Write-Host "   Required:" -ForegroundColor Yellow
    Write-Host "   - DB_PASSWORD (strong password)"
    Write-Host "   - AUTH_SECRET (generate with PowerShell or online tool)"
    Write-Host "   - NEXTAUTH_URL (your production URL)"
    exit 1
}

Write-Host "📦 Pulling latest code..." -ForegroundColor Cyan
git pull origin master 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Git pull failed. Continuing with local code..." -ForegroundColor Yellow
}

Write-Host "🛠️  Building Docker images..." -ForegroundColor Cyan
docker-compose build --no-cache

Write-Host "🗄️  Starting services..." -ForegroundColor Cyan
docker-compose down
docker-compose up -d

Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host "📊 Running database migrations..." -ForegroundColor Cyan
docker-compose exec app npx prisma migrate deploy

Write-Host "👤 Seeding initial users..." -ForegroundColor Cyan
docker-compose exec app npx tsx prisma/seed-user.ts 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ℹ️  Users already exist" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Application: http://localhost:3000" -ForegroundColor Green
Write-Host "📍 pgAdmin: http://localhost:5050 (optional)" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 Default Login:" -ForegroundColor Cyan
Write-Host "   Email: admin123@plniconplus.com"
Write-Host "   Password: 123"
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose logs -f app"
Write-Host "   Stop services: docker-compose down"
Write-Host "   Restart: docker-compose restart app"
Write-Host "   Database backup: docker-compose exec postgres pg_dump -U plnuser plnprojecttracker > backup.sql"
Write-Host ""
