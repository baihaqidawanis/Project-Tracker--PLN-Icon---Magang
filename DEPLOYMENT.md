# 🚀 PLN Icon Plus Project Tracker - DevOps Deployment Guide

This guide covers the deployment, configuration, and maintenance of the Project Tracker application using Docker.

## 📋 Prerequisites

- **Docker** & **Docker Compose** installed.
- **Git** installed.
- **Port 3000** (App), **5432** (DB), **9000/9001** (MinIO) available.
- Minimum **2GB RAM** recommended.

---

## 🛠️ Quick Deployment (Production)

### 1. Clone & Configure
```bash
git clone <repository_url> plnprojecttracker
cd plnprojecttracker
cp .env.production.example .env
nano .env  # Configure secrets (AUTH_SECRET, DB_PASSWORD, etc.)
```

### 2. Build & Start Containers
Run with `--build` to ensure the latest code is used.
```bash
docker compose up -d --build --force-recreate
```

### 3. Initialize Data (Mandatory)
Wait ~30 seconds for containers to be healthy, then run:

```bash
# 1. Seed Master Data (Branches, Statuses, etc.) - CRITICAL
docker exec plnprojecttracker-app node prisma/seed.js

# 2. Create Initial Admin User
# Usage: node scripts/create-admin.js <email> <password> <name>
docker exec plnprojecttracker-app node scripts/create-admin.js admin@plniconplus.com admin123 "Admin System"
```

### 4. Verify Access
- **App**: http://localhost:3000 (Login with created admin)
- **MinIO Console**: http://localhost:9001 (User/Pass from .env)

---

## 🔄 Updates & Maintenance

### Deploy New Version
```bash
git pull origin master
docker compose down
docker compose up -d --build
```
*Note: Database data persists in docker volumes.*

### Backup Database
```bash
# Dump SQL to host
docker exec plnprojecttracker-db pg_dump -U plnuser plnprojecttracker > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
cat backup_file.sql | docker exec -i plnprojecttracker-db psql -U plnuser -d plnprojecttracker
```

---

## 🔐 Security Checklist (DevOps)

1.  [ ] **Change Default Passwords** in `.env`:
    *   `DB_PASSWORD`
    *   `MINIO_ROOT_PASSWORD`
    *   `AUTH_SECRET` (Generate with `openssl rand -base64 32`)
2.  [ ] **HTTPS**: Configure Reverse Proxy (Nginx/Traefik) for SSL termination.
3.  [ ] **Firewall**: Restrict ports 5432 and 9000/9001 to internal network only.

## ⚠️ Troubleshooting

**App restarts repeatedly?**
Check logs: `docker compose logs -f app`
*Usually due to database connection timeout or missing .env variables.*

**Login fails?**
Ensure you ran the `create-admin.js` script inside the container. Manual insert is prone to hashing errors.

**File upload fails?**
Check MinIO connection. Ensure `S3_ENDPOINT` in `.env` matches the internal docker network alias (`http://minio:9000`).
