# PLN Icon Plus - Partnership Project Tracker

Modern web application for tracking partnership projects with comprehensive CRUD operations, file management, and analytics.

## 🚀 Quick Deploy (For DevOps)

**Deploy in 3 commands:**

### Linux/Mac:

```bash
cp .env.production.example .env  # Edit values
./deploy-production.sh           # Deploy
```

### Windows:

```powershell
Copy-Item .env.production.example .env  # Edit values
.\deploy-production.ps1                  # Deploy
```

**📖 Full Guide:** See [QUICKSTART.md](./QUICKSTART.md)

---

## ✨ Features

- 📊 Multi-tab project tracking (Partnership, Page, PKR Opex, Master)
- 📈 Real-time analytics with pivot tables
- 📁 File upload with S3/MinIO storage
- 👥 User authentication & authorization
- 🎨 Dark mode support
- 📱 Responsive design
- 🔄 Undo/Redo functionality
- 📊 Export to Excel
- 🔍 Advanced filtering & sorting

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Storage:** MinIO (S3-compatible)
- **Auth:** NextAuth.js
- **Testing:** Playwright (37 E2E tests)

---

## 📦 Architecture

```
┌─────────────────┐
│   Next.js App   │  ← Port 3000
└────────┬────────┘
         │
    ┌────┴─────┬──────────┐
    ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌────────┐
│Postgres│ │MinIO │ │ Redis  │
│  :5432 │ │ :9000│ │ (opt)  │
└────────┘ └──────┘ └────────┘
```

---

## 🧪 Testing

**37 E2E Tests** covering:

- ✅ Authentication (login, logout, sessions)
- ✅ CRUD operations (all tabs)
- ✅ File upload/download
- ✅ Navigation & UI
- ✅ Text input validation

```bash
# Run all tests
pnpm playwright test

# Run specific test
pnpm playwright test auth

# UI mode
pnpm test:ui
```

**All tests pass ✅** (verified Feb 2026)

---

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Setup database
npx prisma migrate dev
npx prisma generate

# Seed admin user
npx tsx prisma/seed-user.ts

# Run dev server
pnpm dev

# Build for production
pnpm build

# Start production
pnpm start
```

**Default Admin:** admin123@plniconplus.com / admin123

---

## 📂 Project Structure

```
plnprojecttracker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── lib/              # Utilities
│   └── types/            # TypeScript types
├── prisma/               # Database schema & migrations
├── tests/                # E2E tests (Playwright)
├── public/               # Static files
├── docker-compose.yml    # Docker orchestration
├── Dockerfile           # Production Docker image
└── DEPLOYMENT.md        # Detailed deployment guide
```

---

## 🌐 Deployment Options

### Option 1: Docker (Recommended)

✅ **Fastest** - Use deployment scripts above

### Option 2: Vercel

```bash
vercel --prod
```

**Note:** Requires external PostgreSQL & MinIO

### Option 3: Manual

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps

---

## 📊 Environment Variables

See [.env.production.example](./.env.production.example) for full list.

**Required:**

- `DATABASE_URL` - PostgreSQL connection
- `AUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Application URL
- `S3_*` - MinIO/S3 credentials

---

## 📝 License

Proprietary - PLN Icon Plus © 2026

---

## 👥 Support

- **Documentation:** See `docs/` folder
- **Deployment:** [QUICKSTART.md](./QUICKSTART.md)
- **Detailed Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Ready to deploy?** → See [QUICKSTART.md](./QUICKSTART.md)
