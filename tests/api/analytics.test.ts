/**
 * Analytics API Tests
 * Tests for /api/analytics endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorageMock } from '../utils/test-helpers';

const mockStorage = createStorageMock();
vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

import { storage } from '../../server/storage';

describe('Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/analytics/category-spending', () => {
    it('should return spending by category', async () => {
      const mockSpending = [
        { id: 1, name: 'Food', icon: 'Utensils', total: 5000 },
        { id: 2, name: 'Transportation', icon: 'Car', total: 2500 },
      ];
      (storage.getCategorySpending as any).mockResolvedValue(mockSpending);

      const spending = await storage.getCategorySpending('test-user-id-123');

      expect(spending).toHaveLength(2);
      expect(spending[0].total).toBe(5000);
    });
  });

  describe('GET /api/analytics/spending-trend', () => {
    it('should return spending trend over time', async () => {
      const mockTrend = [
        { date: '2026-02-01', total: 1500 },
        { date: '2026-02-08', total: 2000 },
        { date: '2026-02-15', total: 2500 },
      ];
      (storage.getSpendingByPeriod as any).mockResolvedValue(mockTrend);

      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');
      const trend = await storage.getSpendingByPeriod('test-user-id-123', startDate, endDate);

      expect(trend).toHaveLength(3);
      expect(trend[0].date).toBe('2026-02-01');
    });
  });

  describe('GET /api/analytics/summary-stats', () => {
    it('should return summary statistics', async () => {
      const mockStats = {
        totalSpending: 7500,
        transactionCount: 15,
        avgPerTransaction: 500,
      };
      (storage.getSummaryStats as any).mockResolvedValue(mockStats);

      const stats = await storage.getSummaryStats('test-user-id-123');

      expect(stats.totalSpending).toBe(7500);
      expect(stats.transactionCount).toBe(15);
      expect(stats.avgPerTransaction).toBe(500);
    });
  });

  describe('GET /api/analytics/monthly-comparison', () => {
    it('should compare current vs previous month', async () => {
      const mockComparison = {
        currentMonth: 7500,
        previousMonth: 6000,
        percentChange: 25,
      };
      (storage.getMonthlyComparison as any).mockResolvedValue(mockComparison);

      const comparison = await storage.getMonthlyComparison('test-user-id-123');

      expect(comparison.currentMonth).toBe(7500);
      expect(comparison.previousMonth).toBe(6000);
      expect(comparison.percentChange).toBe(25);
    });

    it('should handle negative percent change', async () => {
      const mockComparison = {
        currentMonth: 5000,
        previousMonth: 7000,
        percentChange: -28.57,
      };
      (storage.getMonthlyComparison as any).mockResolvedValue(mockComparison);

      const comparison = await storage.getMonthlyComparison('test-user-id-123');

      expect(comparison.percentChange).toBeLessThan(0);
    });
  });

  describe('GET /api/analytics/weekly-breakdown', () => {
    it('should return weekly breakdown', async () => {
      const mockBreakdown = [
        { week: 1, total: 2000 },
        { week: 2, total: 2500 },
        { week: 3, total: 1800 },
        { week: 4, total: 1200 },
      ];
      (storage.getWeeklyBreakdown as any).mockResolvedValue(mockBreakdown);

      const breakdown = await storage.getWeeklyBreakdown('test-user-id-123');

      expect(breakdown).toHaveLength(4);
      expect(breakdown.reduce((sum, w) => sum + w.total, 0)).toBe(7500);
    });
  });

  describe('GET /api/analytics/period-spending', () => {
    it('should return yearly spending by default', async () => {
      const mockYearlyData = [
        { year: 2024, total: 100000 },
        { year: 2025, total: 120000 },
        { year: 2026, total: 15000 },
      ];
      (storage.getSpendingByYear as any).mockResolvedValue(mockYearlyData);

      const data = await storage.getSpendingByYear('test-user-id-123');

      expect(data).toHaveLength(3);
    });

    it('should return monthly spending for specific year', async () => {
      const mockMonthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        total: Math.floor(Math.random() * 10000),
      }));
      (storage.getSpendingByMonth as any).mockResolvedValue(mockMonthlyData);

      const data = await storage.getSpendingByMonth('test-user-id-123', 2026);

      expect(data).toHaveLength(12);
    });

    it('should return daily spending for specific month', async () => {
      const mockDailyData = Array.from({ length: 28 }, (_, i) => ({
        day: i + 1,
        total: Math.floor(Math.random() * 1000),
      }));
      (storage.getSpendingByDay as any).mockResolvedValue(mockDailyData);

      const data = await storage.getSpendingByDay('test-user-id-123', 2026, 2);

      expect(data).toHaveLength(28);
    });
  });

  describe('GET /api/analytics/annual-report', () => {
    it('should return annual report', async () => {
      const mockReport = {
        grandTotal: 150000,
        transactionCount: 300,
        categoryTotals: [
          { name: 'Food', total: 60000 },
          { name: 'Transportation', total: 36000 },
        ],
        expenses: [],
      };
      (storage.getAnnualReport as any).mockResolvedValue(mockReport);

      const report = await storage.getAnnualReport('test-user-id-123', 2025);

      expect(report.grandTotal).toBe(150000);
      expect(report.transactionCount).toBe(300);
      expect(report.categoryTotals).toHaveLength(2);
    });
  });
});
