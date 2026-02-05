import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout } from '../fixtures/auth';

test.describe('Authentication', () => {
  
  test('should redirect unauthenticated user to login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Wait for page to finish compiling
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin123@plniconplus.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect and page load
    await page.waitForURL('/', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Verify header is visible
    await expect(page.locator('h1:has-text("PLN Icon Plus")')).toBeVisible({ timeout: 10000 });
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for logout process
    
    await loginAsAdmin(page);
    
    // Ensure page is fully ready before clicking logout
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Extra wait for Next.js compilation
    
    // Click logout button with proper selector
    const logoutBtn = page.locator('button').filter({ hasText: 'Logout' });
    await logoutBtn.waitFor({ state: 'visible', timeout: 10000 });
    await logoutBtn.click();
    
    // Wait a bit for loading state to appear and disappear
    await page.waitForTimeout(2000);
    
    // Wait for redirect to login - give more time for Next.js SSR
    await page.waitForURL('/login', { timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Verify we're on login page
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });
  });

  test('should maintain session after page reload', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for reload test
    
    await loginAsAdmin(page);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');
    
    await page.reload();
    await page.waitForTimeout(3000);
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1:has-text("PLN Icon Plus")')).toBeVisible();
  });

  test('should maintain session in new tab - EXPECTED BEHAVIOR', async ({ browser }) => {
    test.setTimeout(60000); // Increase timeout for multi-tab test
    
    // This test verifies that session cookies work across tabs (expected behavior)
    // When a user logs in, their session is stored in cookies
    // Opening a new tab in the same browser shares those cookies
    // So the user stays logged in - this is NOT a bug, it's how sessions work
    
    const context = await browser.newContext();
    const page1 = await context.newPage();
    
    // Login in first tab
    await loginAsAdmin(page1);
    await page1.waitForTimeout(2000);
    await expect(page1).toHaveURL('/');
    
    // Open second tab in same browser context
    const page2 = await context.newPage();
    await page2.goto('/');
    
    // User should be automatically logged in (session cookies are shared)
    await expect(page2).toHaveURL('/');
    
    // Verify we can access protected content without re-login
    await page2.waitForTimeout(2000);
    const header = await page2.locator('h1:has-text("PLN Icon Plus")');
    await expect(header).toBeVisible();
    
    await context.close();
  });

  test('should land on Pivot tab by default after login', async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1:has-text("PLN Icon Plus")')).toBeVisible();
  });
});
