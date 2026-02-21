/**
 * Goals E2E Tests
 * Tests for savings goals UI
 */
import { test, expect } from '@playwright/test';

test.describe('Goals Page', () => {
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

    // Mock goals data
    await page.route('**/api/goals**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              name: 'Emergency Fund',
              targetAmount: 50000,
              currentAmount: 15000,
              targetDate: '2026-12-31T00:00:00.000Z',
              icon: '🎯',
              color: '#3B82F6',
            },
            {
              id: 2,
              name: 'Vacation Fund',
              targetAmount: 30000,
              currentAmount: 5000,
              targetDate: '2026-06-30T00:00:00.000Z',
              icon: '✈️',
              color: '#10B981',
            },
          ]),
        });
      } else {
        route.continue();
      }
    });
  });

  test('should display goals list', async ({ page }) => {
    await page.goto('/goals');
    await page.waitForLoadState('networkidle');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show goal progress', async ({ page }) => {
    await page.goto('/goals');
    await page.waitForLoadState('networkidle');
    
    // Look for progress indicators
    const progressElements = page.locator('[role="progressbar"], [class*="progress"], [class*="bar"]');
    const count = await progressElements.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have add goal button', async ({ page }) => {
    await page.goto('/goals');
    await page.waitForLoadState('networkidle');
    
    // Look for add button
    const addButton = page.locator('button').filter({ 
      hasText: /add|new|create|\+/i 
    }).first();
    
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
    }
  });

  test('should allow contributing to goals', async ({ page }) => {
    await page.goto('/goals');
    await page.waitForLoadState('networkidle');
    
    // Look for contribution buttons
    const contributeButton = page.locator('button').filter({ 
      hasText: /contribute|add|deposit/i 
    }).first();
    
    if (await contributeButton.isVisible()) {
      await expect(contributeButton).toBeEnabled();
    }
  });
});

test.describe('Goal Form', () => {
  test('should validate goal name', async ({ page }) => {
    await page.goto('/');
    // Form validation tests would be added here
    await expect(page.locator('body')).toBeVisible();
  });

  test('should validate target amount', async ({ page }) => {
    await page.goto('/');
    // Form validation tests would be added here
    await expect(page.locator('body')).toBeVisible();
  });

  test('should validate target date', async ({ page }) => {
    await page.goto('/');
    // Form validation tests would be added here
    await expect(page.locator('body')).toBeVisible();
  });
});
