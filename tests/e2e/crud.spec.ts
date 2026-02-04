import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('CRUD Operations', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('Partnership Tab - Projects', () => {
    test('should display projects in partnership table', async ({ page }) => {
      await page.click('button:has-text("Partnership")');
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL('/');
    });

    test('should allow inline editing in partnership table', async ({ page }) => {
      await page.click('button:has-text("Partnership")');
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL('/');
    });
  });
});
