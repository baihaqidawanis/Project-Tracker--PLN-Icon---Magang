# 🚀 PLN Icon Plus Project Tracker - DevOps Deployment Guide

This guide covers the deployment, configuration, and maintenance of the Project Tracker application using Docker.

## 📋 Prerequisites

- **Docker** & **Docker Compose** installed.
- **Git** installed.
- **Port 3000** (App), **9000/9001** (MinIO) available.
- Minimum **2GB RAM** recommended.

---

## 🛠️ Quick Deployment (Production)

### 1. Clone & Configure
```bash
git clone <repository_url> plnprojecttracker
cd plnprojecttracker
cp .env.production.example .env
nano .env  # Configure secrets (see below)
```

**Required `.env` values to change:**
| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `DB_PASSWORD` | Database password | Use a strong random password |
| `AUTH_SECRET` | NextAuth session encryption key | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL (e.g. `https://tracker.plniconplus.com`) | Your domain |
| `MINIO_ROOT_PASSWORD` | MinIO admin password | Use a strong random password |

### 2. Build & Start Containers
```bash
docker compose up -d --build
```

Wait ~30 seconds for all containers to become healthy. Check status with:
```bash
docker compose ps
```

### 3. ⚠️ Create Admin User (MANDATORY - Manual Step)

> **IMPORTANT:** There are NO default users. The first admin user MUST be created manually after deployment. Only authorized personnel should perform this step — this user will have full access to the application.

**Using curl (Linux/Mac):**
```bash
curl -X POST http://localhost:3000/api/setup \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin", "email": "admin@pln.co.id", "password": "CHANGE_THIS_STRONG_PASSWORD"}'
```

**Using PowerShell (Windows):**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/setup" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name": "Admin", "email": "admin@pln.co.id", "password": "CHANGE_THIS_STRONG_PASSWORD"}'
```

**Notes:**
- Replace `admin@pln.co.id` and password with actual credentials.
- This endpoint **automatically disables itself** after the first user is created.
- Password is securely hashed with bcrypt before storage.
- **Do NOT share the admin password in chat or documentation.**

### 4. Verify Access
- **App**: http://localhost:3000 (Login with the admin credentials you just created)
- **MinIO Console**: http://localhost:9001 (User/Pass from `.env`)

---

## 🔄 Updates & Maintenance

### Deploy New Version
```bash
git pull origin master
docker compose up -d --build
```
*Note: Database data persists in docker volumes. No data loss on rebuild.*

### Backup Database
```bash
# Linux/Mac
docker exec plnprojecttracker-db pg_dump -U plnuser plnprojecttracker > backup_$(date +%Y%m%d).sql

# Windows PowerShell
docker exec plnprojecttracker-db pg_dump -U plnuser plnprojecttracker > "backup_$(Get-Date -Format yyyyMMdd).sql"
```

### Restore Database
```bash
cat backup_file.sql | docker exec -i plnprojecttracker-db psql -U plnuser -d plnprojecttracker
```

---

## 🔐 Security Checklist (DevOps)

- [ ] **Change all default passwords** in `.env` (`DB_PASSWORD`, `MINIO_ROOT_PASSWORD`, `AUTH_SECRET`)
- [ ] **Set `NEXTAUTH_URL`** to production domain (e.g. `https://tracker.plniconplus.com`)
- [ ] **HTTPS**: Configure Reverse Proxy (Nginx/Traefik) for SSL termination
- [ ] **Firewall**: Restrict ports 9000/9001 (MinIO) to internal network only
- [ ] **Admin user**: Created with a strong password via `/api/setup`

---

## ⚠️ Troubleshooting

**App restarts repeatedly?**
Check logs: `docker compose logs -f app`
*Usually due to database connection timeout or missing `.env` variables.*

**Login fails?**
Ensure you created an admin user via `POST /api/setup` (see Step 3 above). The endpoint returns `400` if a user already exists.

**File upload fails?**
Check MinIO connection. Ensure `S3_ENDPOINT` in `.env` matches the internal docker network alias (`http://minio:9000`).

**Database access from host?**
PostgreSQL is not exposed externally for security. Use:
```bash
docker compose exec postgres psql -U plnuser -d plnprojecttracker
```
