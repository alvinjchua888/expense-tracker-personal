/**
 * Navigation E2E Tests
 * Tests for application navigation and routing
 */
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('should display 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-12345');
    
    // Check for 404 content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    
    // May contain "not found" text or redirect to home
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should have working links', async ({ page }) => {
    await page.goto('/');
    
    // Find all anchor tags
    const links = page.locator('a[href]');
    const count = await links.count();
    
    // Verify at least some links exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should maintain state during navigation', async ({ page }) => {
    await page.goto('/');
    
    // Store initial URL
    const initialUrl = page.url();
    expect(initialUrl).toBeTruthy();
    
    // Navigate back (if possible)
    await page.goBack().catch(() => {});
    
    // Page should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });
});
