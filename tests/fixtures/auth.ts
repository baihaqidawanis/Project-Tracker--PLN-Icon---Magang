import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login', { waitUntil: 'networkidle' });

  // Wait for page compilation to finish
  await page.waitForTimeout(2000);

  await page.locator('input[type="email"]').fill('admin@plniconplus.com');
  await page.locator('input[type="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();

  // Wait for redirect and page load
  await page.waitForURL('/', { timeout: 45000 });
  await page.waitForLoadState('networkidle', { timeout: 45000 });

  // Ensure page is loaded
  await page.locator('h1:has-text("PLN Icon Plus")').waitFor({ state: 'visible', timeout: 15000 });
}

export async function logout(page: Page) {
  const logoutBtn = page.locator('button').filter({ hasText: 'Logout' });
  await logoutBtn.click();
  await page.waitForTimeout(2000);
}
