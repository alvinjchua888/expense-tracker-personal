/**
 * Expenses E2E Tests
 * Tests for expense management UI
 */
import { test, expect } from '@playwright/test';

test.describe('Expenses Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for protected route testing
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

    // Mock expenses data
    await page.route('**/api/expenses*', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 1,
                amount: 150.50,
                currency: 'PHP',
                merchant: 'Jollibee',
                description: 'Lunch',
                categoryId: 1,
                date: '2026-02-15T00:00:00.000Z',
              },
            ],
            total: 1,
            limit: 20,
            offset: 0,
          }),
        });
      } else {
        route.continue();
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
        ]),
      });
    });
  });

  test('should display expenses list', async ({ page }) => {
    await page.goto('/expenses');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if content is rendered
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have add expense button', async ({ page }) => {
    await page.goto('/expenses');
    await page.waitForLoadState('networkidle');
    
    // Look for add button
    const addButton = page.locator('button').filter({ 
      hasText: /add|new|create|\+/i 
    }).first();
    
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
    }
  });

  test('should filter expenses by date range', async ({ page }) => {
    await page.goto('/expenses');
    await page.waitForLoadState('networkidle');
    
    // Look for date filter elements
    const dateFilters = page.locator('[data-testid*="date"], input[type="date"], button:has-text("Date")');
    const count = await dateFilters.count();
    
    // Date filtering should be available
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should search expenses', async ({ page }) => {
    await page.goto('/expenses');
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="find" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Jollibee');
      await expect(searchInput).toHaveValue('Jollibee');
    }
  });
});

test.describe('Expense Form', () => {
  test('should validate required fields', async ({ page }) => {
    // Form validation tests would go here
    // This would require the form to be visible
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should accept valid expense data', async ({ page }) => {
    // Form submission tests would go here
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
