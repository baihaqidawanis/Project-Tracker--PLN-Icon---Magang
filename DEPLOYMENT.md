# 🚀 PLN Icon Plus Project Tracker - Deployment Guide

## 📋 Prerequisites

### Server Requirements

- **OS:** Ubuntu 20.04+ / CentOS 7+ / Debian 11+ (or Windows Server with Docker)
- **RAM:** Minimum 2GB (4GB recommended)
- **Storage:** 10GB available space
- **Docker:** Version 20.10+
- **Docker Compose:** Version 2.0+
- **Git:** For code deployment

### Network Requirements

- **Port 3000:** Application (can be changed in .env)
- **Port 5432:** PostgreSQL database
- **Port 5050:** pgAdmin (optional)
- **Domain:** Optional, for production URL

---

## 🎯 Deployment Steps

### 1. Install Docker (if not already installed)

**For Ubuntu/Debian:**

```bash
# Update package index
sudo apt-get update

# Install dependencies
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
```

**For Windows Server:**

- Install Docker Desktop for Windows from https://www.docker.com/products/docker-desktop

### 2. Clone Repository

```bash
# Navigate to deployment directory
cd /opt  # or your preferred directory

# Clone repository
git clone <YOUR_REPOSITORY_URL> plnprojecttracker
cd plnprojecttracker
```

### 3. Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env

# Edit environment file
nano .env  # or use vim, vi, etc.
```

**Required Configuration:**

```env
# Strong database password
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# Generate AUTH_SECRET (run this command)
# openssl rand -base64 32
AUTH_SECRET=YOUR_GENERATED_SECRET_HERE

# Production URL
NEXTAUTH_URL=https://your-domain.plniconplus.com
# or http://SERVER_IP:3000 if no domain

# MinIO/S3 Storage Configuration
S3_ENDPOINT=http://minio:9000  # Internal Docker network endpoint
S3_ACCESS_KEY=minioadmin        # Change in production!
S3_SECRET_KEY=YOUR_MINIO_SECRET # Change in production!
S3_BUCKET_NAME=plnprojecttracker
S3_REGION=us-east-1
S3_USE_SSL=false                # Set to true with HTTPS in production

# For AWS S3 (production alternative):
# S3_ENDPOINT=                  # Leave empty for AWS S3
# S3_ACCESS_KEY=YOUR_AWS_KEY
# S3_SECRET_KEY=YOUR_AWS_SECRET
# S3_BUCKET_NAME=plnprojecttracker-prod
# S3_REGION=ap-southeast-1
# S3_USE_SSL=true
```

### 4. Run Deployment Script

**For Linux:**

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**For Windows:**

```powershell
# Run PowerShell as Administrator
.\deploy.ps1
```

### 5. Verify Deployment

```bash
# Check running containers (should see: app, postgres, minio)
docker-compose ps

# View application logs
docker-compose logs -f app

# Access application
# Browser: http://SERVER_IP:3000
```

**Default Login:**

- Email: `admin123@plniconplus.com`
- Password: `123`

**Access MinIO Console (File Storage):**

- URL: `http://SERVER_IP:9001`
- Username: `minioadmin` (change in production!)
- Password: `minioadmin123` (change in production!)

---

## 🗄️ MinIO Object Storage

The application uses MinIO for S3-compatible object storage (file uploads like evidence documents, etc.).

### Access MinIO Console

1. Open browser: `http://localhost:9001` (development) or `http://SERVER_IP:9001` (production)
2. Login with credentials from `.env` (MINIO_ROOT_USER / MINIO_ROOT_PASSWORD)
3. Bucket `plnprojecttracker` is created automatically on first upload

### Production S3 Alternative

To use AWS S3 instead of MinIO in production:

1. Create S3 bucket in AWS console
2. Create IAM user with S3 access
3. Update `.env`:
   ```env
   S3_ENDPOINT=           # Empty for AWS S3
   S3_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
   S3_SECRET_KEY=YOUR_AWS_SECRET_KEY
   S3_BUCKET_NAME=plnprojecttracker-prod
   S3_REGION=ap-southeast-1
   S3_USE_SSL=true
   ```
4. Remove MinIO service from `docker-compose.yml` (optional)

---

## 🔧 Production Configuration

### Enable HTTPS (Recommended)

**Option 1: Using Nginx Reverse Proxy**

1. Install Nginx:

```bash
sudo apt-get install nginx
```

2. Create Nginx config:

```bash
sudo nano /etc/nginx/sites-available/plnprojecttracker
```

```nginx
server {
    listen 80;
    server_name your-domain.plniconplus.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Enable site and install SSL:

```bash
sudo ln -s /etc/nginx/sites-available/plnprojecttracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install Certbot for free SSL
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.plniconplus.com
```

**Option 2: Using Traefik (in docker-compose)**

- Contact DevOps team for Traefik configuration

### Database Backup

**Manual Backup:**

```bash
# Create backup
docker-compose exec postgres pg_dump -U plnuser plnprojecttracker > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup_20260204.sql | docker-compose exec -T postgres psql -U plnuser plnprojecttracker
```

**Automated Daily Backup (Cron):**

```bash
# Edit crontab
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * cd /opt/plnprojecttracker && docker-compose exec postgres pg_dump -U plnuser plnprojecttracker > /opt/backups/plndb_$(date +\%Y\%m\%d).sql
```

---

## 📊 Monitoring & Maintenance

### View Logs

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# All services
docker-compose logs -f
```

### Restart Services

```bash
# Restart app only
docker-compose restart app

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Start all services
docker-compose up -d
```

### Update Application

```bash
# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose up -d --build
```

### Database Management

Access pgAdmin (if enabled):

- URL: http://SERVER_IP:5050
- Email: admin@plniconplus.com (from .env)
- Password: (from .env PGADMIN_PASSWORD)

Add server in pgAdmin:

- Host: postgres
- Port: 5432
- Database: plnprojecttracker
- Username: plnuser
- Password: (from .env DB_PASSWORD)

---

## 🔐 Security Checklist

- [ ] Change default admin password after first login
- [ ] Use strong DB_PASSWORD (minimum 16 characters, mixed case, numbers, symbols)
- [ ] Generate unique AUTH_SECRET
- [ ] Enable HTTPS in production
- [ ] Configure firewall (allow only ports 80, 443, 22)
- [ ] Setup automated backups
- [ ] Keep Docker and system updated
- [ ] Review user access regularly
- [ ] Monitor logs for suspicious activity

---

## 🆘 Troubleshooting

### Application won't start

```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs app

# Check if port 3000 is in use
sudo lsof -i :3000  # Linux
netstat -ano | findstr :3000  # Windows
```

### Database connection failed

```bash
# Check if database is running
docker-compose ps postgres

# Test database connection
docker-compose exec postgres psql -U plnuser -d plnprojecttracker -c "SELECT 1;"

# Check DATABASE_URL in .env
docker-compose exec app printenv DATABASE_URL
```

### Out of memory

```bash
# Check container resource usage
docker stats

# Increase server RAM or add swap
# For Ubuntu:
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📞 Support

For deployment issues or questions:

1. Check logs: `docker-compose logs -f`
2. Review this documentation
3. Contact IT Support team at PLN Icon Plus

---

## 🔄 Rollback Procedure

If deployment fails:

```bash
# Stop current deployment
docker-compose down

# Rollback to previous version
git checkout <previous-commit-hash>

# Restore database backup
cat backup_YYYYMMDD.sql | docker-compose exec -T postgres psql -U plnuser plnprojecttracker

# Rebuild and start
docker-compose up -d --build
```

---

**Deployment Guide Version:** 1.0
**Last Updated:** February 4, 2026
**Maintained by:** PLN Icon Plus IT Team
