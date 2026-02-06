# Production Setup Guide for DevOps

## Database Initialization

After deploying with Docker Compose, the database will be created with schema and master data, but **NO ADMIN USER**.

## Creating First Admin User

DevOps must manually create the first admin user with a secure password.

### Step 1: Generate Password Hash

Run this command on the server to generate bcrypt hash:

```bash
docker exec plnprojecttracker-app node -e "console.log(require('bcryptjs').hashSync('YOUR_SECURE_PASSWORD', 10))"
```

Example output: `$2a$10$abc123xyz...` (copy this hash)

### Step 2: Insert into Database

```bash
docker exec -it plnprojecttracker-db psql -U plnuser -d plnprojecttracker
```

Then run this SQL (replace the hash with output from Step 1):

```sql
INSERT INTO "User" (id, email, name, password, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@plniconplus.com',
  'PLN Icon Admin',
  '$2a$10$YOUR_HASH_FROM_STEP_1',
  NOW(),
  NOW()
);
```

Exit with `\q`

### One-Liner Alternative (Easier)

```bash
# Generate hash and show command to copy-paste
HASH=$(docker exec plnprojecttracker-app node -e "console.log(require('bcryptjs').hashSync('YourPassword123', 10))")
echo "Run this SQL:"
echo "INSERT INTO \"User\" (id, email, name, password, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'admin@plniconplus.com', 'Admin', '$HASH', NOW(), NOW());"
```

## Security Checklist

- [ ] Change all default passwords in `.env` file:
  - `DB_PASSWORD` (PostgreSQL)
  - `MINIO_ROOT_PASSWORD` (MinIO)
  - `AUTH_SECRET` (NextAuth)
  - `PGADMIN_PASSWORD` (if using pgAdmin)

- [ ] Create admin user with **strong password** (NOT "123")

- [ ] Setup SSL/HTTPS with reverse proxy (Nginx/Caddy)

- [ ] Configure firewall (only allow ports 80/443 from internet)

- [ ] Setup automated backups for PostgreSQL

- [ ] Enable monitoring and logging

## Master Data

The seed process will automatically create:

- ✅ Master PIC
- ✅ Master Branch
- ✅ Master Status
- ✅ Master Prioritas
- ✅ Master Kode
- ✅ Master BnP
- ✅ Master SO
- ✅ Master Activity Type

These are required for the application to function properly.

## Post-Deployment Verification

1. Check all containers are running:

   ```bash
   docker compose ps
   ```

2. Verify database connection:

   ```bash
   docker exec plnprojecttracker-app npx prisma db pull
   ```

3. Check application logs:

   ```bash
   docker compose logs -f app
   ```

4. Test login with admin user created above

5. Verify file upload works (MinIO accessible)

## Support

For issues, contact the development team or refer to [DEPLOYMENT.md](DEPLOYMENT.md).
