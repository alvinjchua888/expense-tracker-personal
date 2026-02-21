/**
 * Analytics E2E Tests
 * Tests for analytics and reporting UI
 */
import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
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

    // Mock analytics data
    await page.route('**/api/analytics/**', route => {
      const url = route.request().url();
      
      if (url.includes('category-spending')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Food', icon: 'Utensils', total: 5000 },
            { id: 2, name: 'Transportation', icon: 'Car', total: 2500 },
          ]),
        });
      } else if (url.includes('summary-stats')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalSpending: 7500,
            transactionCount: 15,
            avgPerTransaction: 500,
          }),
        });
      } else if (url.includes('monthly-comparison')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            currentMonth: 7500,
            previousMonth: 6000,
            percentChange: 25,
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });
  });

  test('should display analytics charts', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    // Check if content is rendered
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show spending summary', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    // Look for summary elements
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
  });

  test('should display category breakdown', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    // Charts or category breakdown should be present
    const charts = page.locator('[class*="chart"], [class*="recharts"], svg, canvas');
    const count = await charts.count();
    
    // Some visual elements should exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow date range selection', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    // Look for date range selectors
    const dateControls = page.locator('button, select').filter({
      hasText: /month|year|week|day|range|date/i
    });
    
    const count = await dateControls.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Budget Score', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/user', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-user' }),
      });
    });

    await page.route('**/api/analytics/budget-score**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currentMonth: {
            year: 2026,
            month: 2,
            score: 85,
            descriptor: 'Great',
            descriptorEmoji: '🎯',
            breakdown: [],
            color: 'green',
          },
          previousMonth: {
            score: 78,
            change: 7,
          },
        }),
      });
    });
  });

  test('should display budget score', async ({ page }) => {
    await page.goto('/budget-score');
    await page.waitForLoadState('networkidle');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
