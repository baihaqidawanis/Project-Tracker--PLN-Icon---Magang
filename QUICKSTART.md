# 🚀 Quick Deploy Guide for DevOps

## For DevOps Team - Deployment in 3 Steps

### Prerequisites

- Docker & Docker Compose installed
- Server with min 2GB RAM, 10GB storage
- Ports 3000, 5432, 9000, 9001 available

---

## 🎯 Deploy Steps

### **Linux/Mac:**

```bash
# 1. Setup environment
cp .env.production.example .env
nano .env  # Edit required values

# 2. Run deployment script
chmod +x deploy-production.sh
./deploy-production.sh

# Done! App running on http://localhost:3000
```

### **Windows:**

```powershell
# 1. Setup environment
Copy-Item .env.production.example .env
notepad .env  # Edit required values

# 2. Run deployment script
.\deploy-production.ps1

# Done! App running on http://localhost:3000
```

---

## ⚙️ What Gets Deployed

The deployment script automatically:

1. ✅ Builds Docker images (Next.js app)
2. ✅ Starts PostgreSQL database
3. ✅ Starts MinIO S3 storage
4. ✅ Runs database migrations
5. ✅ Creates default admin user
6. ✅ Starts the application

---

## 🔐 Important Environment Variables

**MUST CHANGE** before deployment:

```env
# Generate with: openssl rand -base64 32
AUTH_SECRET=xxxxx

# Strong database password
DB_PASSWORD=xxxxx

# MinIO storage password
S3_SECRET_KEY=xxxxx
MINIO_ROOT_PASSWORD=xxxxx

# Production URL
NEXTAUTH_URL=http://your-server-ip:3000
```

---

## 📊 Service Access

After deployment:

- **Application:** http://localhost:3000
- **MinIO Console:** http://localhost:9001
- **Database:** localhost:5432

Default credentials:

- **Admin User:** admin123@plniconplus.com / admin123
- **MinIO:** minioadmin / (check S3_SECRET_KEY in .env)

---

## 🛠️ Management Commands

```bash
# View logs
docker-compose logs -f

# View app logs only
docker-compose logs -f app

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Update to latest code
git pull
./deploy-production.sh
```

---

## 🔄 Update/Redeploy

```bash
# Pull latest code
git pull

# Rebuild and restart
./deploy-production.sh
```

---

## 🆘 Troubleshooting

### App not starting?

```bash
# Check logs
docker-compose logs app

# Check if database is ready
docker-compose ps
```

### Database connection error?

```bash
# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Port already in use?

```bash
# Change port in docker-compose.yml
# Find: "3000:3000"
# Change to: "8080:3000" (example)
```

---

## 📞 Support

Check full documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)

For issues, contact development team.
