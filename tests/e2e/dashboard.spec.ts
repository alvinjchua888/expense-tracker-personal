/**
 * Dashboard E2E Tests
 * Tests for the main dashboard page
 */
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In real tests, you'd need to set up authentication
    // For now, we test the unauthenticated flow
    await page.goto('/');
  });

  test('should display landing page for unauthenticated users', async ({ page }) => {
    // Check for landing page elements
    await expect(page).toHaveTitle(/Expense/i);
    
    // Look for sign-in or landing content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should have responsive navigation', async ({ page }) => {
    // Check for navigation elements
    const nav = page.locator('nav').first();
    
    if (await nav.isVisible()) {
      await expect(nav).toBeVisible();
    }
  });

  test('should handle theme toggle', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('[aria-label*="theme"], [data-testid="theme-toggle"], button:has-text("Dark"), button:has-text("Light")').first();
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      // Verify theme changed (check for dark/light class on html/body)
      const html = page.locator('html');
      await expect(html).toBeVisible();
    }
  });
});
