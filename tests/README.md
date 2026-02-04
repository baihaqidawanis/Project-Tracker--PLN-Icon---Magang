# E2E Testing dengan Playwright

Setup dan guide untuk testing E2E project tracker.

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Install Playwright browsers:**
   ```bash
   pnpm exec playwright install
   ```

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Tests with UI Mode (Interactive)

```bash
pnpm test:ui
```

### Run Tests in Headed Mode (See Browser)

```bash
pnpm test:headed
```

### Run Specific Test File

```bash
pnpm exec playwright test auth.spec.ts
```

### View Test Report

```bash
pnpm test:report
```

## Test Structure

```
tests/
├── e2e/                    # E2E test files
│   ├── auth.spec.ts        # Authentication tests
│   ├── navigation.spec.ts  # Tab navigation tests
│   ├── crud.spec.ts        # CRUD operations tests
│   └── file-upload.spec.ts # File upload/delete tests
└── fixtures/               # Test helpers and data
    ├── auth.ts             # Auth helper functions
    └── test-data.ts        # Test data fixtures
```

## Test Coverage

### Authentication Tests

- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Logout functionality
- ✅ Session persistence
- ✅ Redirect to login for unauthenticated users
- ✅ Default landing on Pivot tab

### Navigation Tests

- ✅ Navigate to all tabs (Pivot, Partnership, Page, PKR Opex, Master, Report)
- ✅ Tab state persistence in localStorage
- ✅ Data loading on tab switch

### CRUD Tests

- ✅ Create new project
- ✅ Edit existing project
- ✅ Delete single project
- ✅ Bulk select with checkboxes
- ✅ Bulk delete with confirmation

### File Upload Tests

- ✅ Upload file to MinIO
- ✅ View uploaded file
- ✅ Delete uploaded file
- ✅ Invalid file type handling

## Writing New Tests

Example test structure:

```typescript
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../fixtures/auth";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should do something", async ({ page }) => {
    // Arrange
    await page.goto("/some-page");

    // Act
    await page.click("button");

    // Assert
    await expect(page.locator("text=Success")).toBeVisible();
  });
});
```

## Best Practices

1. **Use descriptive test names** - Clearly state what is being tested
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Use fixtures** - Reuse common setup logic (e.g., loginAsAdmin)
4. **Wait for elements** - Use `waitForSelector` or `waitForTimeout` when needed
5. **Clean state** - Each test should be independent
6. **Test both happy and error paths** - Success and failure scenarios

## CI/CD Integration

In CI environment, tests will:

- Run in headless mode
- Retry failed tests 2 times
- Generate HTML report
- Run on single worker (sequential)

## Debugging

### Debug Specific Test

```bash
pnpm exec playwright test auth.spec.ts --debug
```

### View Trace

```bash
pnpm exec playwright show-trace trace.zip
```

### Screenshots and Videos

- Screenshots saved on failure: `test-results/`
- Videos saved on failure: `test-results/`
- Traces saved on retry: `test-results/`

## Configuration

Configuration file: `playwright.config.ts`

Key settings:

- Timeout: 30 seconds per test
- Retries: 2 on CI, 0 locally
- Base URL: http://localhost:3000
- Browsers: Chromium (default), Firefox, Safari (optional)
- Auto-start dev server before tests

## Troubleshooting

**Dev server not starting:**

- Ensure port 3000 is available
- Check `.env` file exists
- Verify Docker is running (for MinIO, PostgreSQL)

**Tests failing randomly:**

- Increase timeout values
- Add explicit waits for async operations
- Check database state between tests

**Authentication issues:**

- Verify user exists in database
- Check NextAuth configuration
- Clear browser cookies between tests
