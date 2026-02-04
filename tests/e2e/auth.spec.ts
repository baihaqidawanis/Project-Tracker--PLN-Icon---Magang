import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout } from '../fixtures/auth';

test.describe('Authentication', () => {
  
  test('should redirect unauthenticated user to login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin123@plniconplus.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL('/');
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    await loginAsAdmin(page);
    await page.click('button:has-text("Logout")');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/login');
  });

  test('should maintain session after page reload', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL('/');
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL('/');
  });

  test('should land on Pivot tab by default after login', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL('/');
  });
});
