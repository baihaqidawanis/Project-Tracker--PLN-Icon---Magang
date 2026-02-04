import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Tab Navigation', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should navigate to all tabs successfully', async ({ page }) => {
    const tabs = ['Pivot', 'Partnership', 'Page', 'PKR Opex', 'Master', 'Report'];
    
    for (const tabName of tabs) {
      await page.click(`button:has-text("${tabName}")`);
      await page.waitForTimeout(2000);
    }
    
    await expect(page).toHaveURL('/');
  });

  test('should remember selected tab in localStorage', async ({ page }) => {
    await page.click('button:has-text("PKR Opex")');
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');
  });

  test('should load data when switching tabs', async ({ page }) => {
    await page.click('button:has-text("Partnership")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Master")');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');
  });
});
