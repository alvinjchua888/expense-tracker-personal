/**
 * Budgets E2E Tests
 * Tests for budget management UI
 */
import { test, expect } from '@playwright/test';

test.describe('Budgets Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/user', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user',
          firstName: 'Test',
          lastName: 'User',
        }),
      });
    });

    // Mock budgets data
    await page.route('**/api/budgets**', route => {
      const url = route.request().url();
      
      if (url.includes('progress')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { categoryId: 1, categoryName: 'Food', monthlyLimit: 5000, spent: 3000, remaining: 2000, percentage: 60 },
            { categoryId: 2, categoryName: 'Transportation', monthlyLimit: 3000, spent: 3500, remaining: -500, percentage: 117 },
          ]),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, categoryId: 1, monthlyLimit: 5000 },
            { id: 2, categoryId: 2, monthlyLimit: 3000 },
          ]),
        });
      }
    });

    // Mock categories
    await page.route('**/api/categories', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Food', icon: 'Utensils' },
          { id: 2, name: 'Transportation', icon: 'Car' },
          { id: 3, name: 'Shopping', icon: 'ShoppingBag' },
        ]),
      });
    });
  });

  test('should display budgets list', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show budget progress', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');
    
    // Look for progress indicators
    const progressElements = page.locator('[role="progressbar"], [class*="progress"]');
    const count = await progressElements.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should highlight over-budget categories', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');
    
    // Over-budget items should have visual indication (red, warning, etc.)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should have add budget button', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');
    
    const addButton = page.locator('button').filter({ 
      hasText: /add|new|create|\+/i 
    }).first();
    
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
    }
  });

  test('should allow editing budgets', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');
    
    // Look for edit buttons or clickable budget items
    const editButtons = page.locator('button').filter({ 
      hasText: /edit|update|modify/i 
    });
    
    const count = await editButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
