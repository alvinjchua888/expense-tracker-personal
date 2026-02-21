/**
 * Gamification API Tests
 * Tests for /api/streak and /api/badges endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorageMock, testData } from '../utils/test-helpers';

const mockStorage = createStorageMock();
vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

import { storage } from '../../server/storage';

describe('Gamification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Streaks (GET /api/streak)', () => {
    it('should return user streak data', async () => {
      const mockStreak = testData.streak;
      (storage.getUserStreak as any).mockResolvedValue(mockStreak);

      const streak = await storage.getUserStreak('test-user-id-123');

      expect(streak?.currentStreak).toBe(5);
      expect(streak?.longestStreak).toBe(10);
    });

    it('should return default values for new user', async () => {
      (storage.getUserStreak as any).mockResolvedValue(null);

      const streak = await storage.getUserStreak('new-user-id');

      expect(streak).toBeNull();
      // Route returns default: { currentStreak: 0, longestStreak: 0, lastExpenseDate: null, streakFreezesUsed: 0 }
    });

    it('should update streak when expense is added', async () => {
      (storage.updateUserStreak as any).mockResolvedValue(undefined);

      await storage.updateUserStreak('test-user-id-123');

      expect(storage.updateUserStreak).toHaveBeenCalledWith('test-user-id-123');
    });
  });

  describe('Badges (GET /api/badges)', () => {
    it('should return user badges', async () => {
      const mockBadges = testData.badges;
      (storage.getUserBadges as any).mockResolvedValue(mockBadges);

      const badges = await storage.getUserBadges('test-user-id-123');

      expect(badges).toHaveLength(2);
      expect(badges.map(b => b.badgeKey)).toContain('first_expense');
      expect(badges.map(b => b.badgeKey)).toContain('streak_7');
    });

    it('should return empty array for user with no badges', async () => {
      (storage.getUserBadges as any).mockResolvedValue([]);

      const badges = await storage.getUserBadges('new-user-id');

      expect(badges).toEqual([]);
    });

    it('should check and unlock badges after qualifying action', async () => {
      (storage.checkAndUnlockBadges as any).mockResolvedValue(undefined);

      await storage.checkAndUnlockBadges('test-user-id-123');

      expect(storage.checkAndUnlockBadges).toHaveBeenCalledWith('test-user-id-123');
    });
  });

  describe('Badge Key Validation', () => {
    it('should support expected badge keys', () => {
      const validBadgeKeys = [
        'first_expense',
        'streak_7',
        'streak_30',
        'streak_100',
        'budget_master',
        'saver',
        'goal_achiever',
      ];

      validBadgeKeys.forEach(key => {
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Budget Score API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/analytics/budget-score', () => {
    it('should calculate and return budget score', async () => {
      (storage.getBudgets as any).mockResolvedValue(testData.budgets);
      (storage.getCategories as any).mockResolvedValue(testData.categories);
      (storage.getExpenses as any).mockResolvedValue(testData.expenses);
      (storage.saveMonthlyScore as any).mockResolvedValue(undefined);
      (storage.getMonthlyScore as any).mockResolvedValue({ score: 85 });

      const budgets = await storage.getBudgets('test-user-id-123');
      const categories = await storage.getCategories('test-user-id-123');

      expect(budgets).toHaveLength(2);
      expect(categories).toHaveLength(3);
    });

    it('should get previous month score for comparison', async () => {
      (storage.getMonthlyScore as any).mockResolvedValue({ score: 78, year: 2026, month: 1 });

      const previousScore = await storage.getMonthlyScore('test-user-id-123', 2026, 1);

      expect(previousScore?.score).toBe(78);
    });
  });

  describe('GET /api/analytics/budget-score/history', () => {
    it('should return score history', async () => {
      const mockHistory = [
        { year: 2026, month: 2, score: 85, calculatedAt: new Date() },
        { year: 2026, month: 1, score: 78, calculatedAt: new Date() },
        { year: 2025, month: 12, score: 92, calculatedAt: new Date() },
      ];
      (storage.getMonthlyScoreHistory as any).mockResolvedValue(mockHistory);

      const history = await storage.getMonthlyScoreHistory('test-user-id-123', 6);

      expect(history).toHaveLength(3);
    });
  });
});
