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
    ```

3.  **Setup Environment**
    Copy `.env.example` to `.env` and configure your database credentials.

4.  **Database Setup**
    ```bash
    # Push schema to DB
    npx prisma db push

    # Seed Master Data
    npx prisma db seed
    ```

5.  **Run Development Server**
    ```bash
    pnpm dev
    ```
    Access at `http://localhost:3000`

6.  **Create Admin User**

    After the dev server is running, create the first admin user:
    ```bash
    curl -X POST http://localhost:3000/api/setup \
      -H "Content-Type: application/json" \
      -d '{"name": "Admin", "email": "admin@pln.co.id", "password": "yourpassword"}'
    ```
    > ⚠️ Only administrators should have access to this endpoint. The endpoint is disabled once a user exists.

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
npx playwright test

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts
```

*Ensure your local database has the test user (`admin@pln.co.id` / `123`) seeded before running tests via the `/api/setup` endpoint.*

---

## 📁 Project Structure

- `/app` - Next.js App Router pages and API routes.
- `/app/components` - Reusable UI components.
- `/prisma` - Database schema and seed scripts.
- `/tests` - E2E tests (Playwright).

---

**PLN Icon Plus IT Team** © 2026
