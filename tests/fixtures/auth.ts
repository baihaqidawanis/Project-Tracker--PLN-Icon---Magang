import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('admin123@plniconplus.com');
  await page.locator('input[type="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000); // Increase timeout for hydration
}

export async function logout(page: Page) {
  await page.click('button:has-text("Logout")');
  await page.waitForTimeout(2000);
}
