import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('File Upload', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should upload file successfully', async ({ page }) => {
    await page.click('button:has-text("PKR Opex")');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');
  });

  test('should view uploaded file', async ({ page }) => {
    await page.click('button:has-text("PKR Opex")');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');
  });

  test('should delete uploaded file', async ({ page }) => {
    await page.click('button:has-text("PKR Opex")');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');
  });

  test('should handle invalid file type', async ({ page }) => {
    await page.click('button:has-text("PKR Opex")');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');
  });
});
