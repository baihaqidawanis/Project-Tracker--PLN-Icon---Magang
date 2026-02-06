# 📊 PLN Icon Plus - Project Tracker

A comprehensive project tracking and reporting dashboard tailored for PLN Icon Plus workflows. Features real-time collaboration, pivot reporting, and specialized tracking modules.

## 🌟 Key Features
- **Project Board**: Multi-view project tracking (List, KPI, Status).
- **Pivot Report**: Dynamic data aggregation and pivoting.
- **Partnership Management**: Specialized workflow tracking with drag-and-drop.
- **Daily Progress**: Granular progress tracking.
- **Role-based Access**: Admin and User roles (NextAuth.js).
- **File Management**: Integrated with MinIO/S3 for evidence uploads.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL (Local or Docker)
- pnpm (recommended) or npm

### Installation

1.  **Clone Repository**
    ```bash
    git clone <repo_url>
    cd plnprojecttracker
    ```

2.  **Install Dependencies**
    ```bash
    pnpm install
    # or
    npm install
    ```

3.  **Setup Environment**
    Copy `.env.example` to `.env` and configure your database credentials.

4.  **Database Setup**
    ```bash
    # Push schema to DB
    npx prisma db push
    
    # Seed Master Data
    npm run seed
    
    # Create Admin User
    node scripts/create-admin.js admin@plniconplus.com admin123 "Admin Dev"
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access at `http://localhost:3000`

---

## 🐳 Deployment (Docker)

For production deployment instructions, please refer to [DEPLOYMENT.md](DEPLOYMENT.md).

Quick command:
```bash
docker compose up -d --build
```

---

## 🧪 Testing

We use **Playwright** for End-to-End testing.

```bash
# Run all tests
npm run test

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts
```

*Ensure your local database has the test user (`admin@plniconplus.com`) seeded before running tests.*

---

## 📁 Project Structure

- `/app` - Next.js App Router pages and API routes.
- `/components` - Reusable UI components.
- `/prisma` - Database schema and seed scripts.
- `/scripts` - Utility scripts (create-admin, etc).
- `/tests` - E2E tests.

---

**PLN Icon Plus IT Team** © 2026
