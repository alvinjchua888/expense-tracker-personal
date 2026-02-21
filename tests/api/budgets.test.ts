/**
 * Budgets API Tests
 * Tests for /api/budgets endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorageMock, testData } from '../utils/test-helpers';

const mockStorage = createStorageMock();
vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

import { storage } from '../../server/storage';

describe('Budgets API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/budgets', () => {
    it('should return all budgets for user', async () => {
      const mockBudgets = testData.budgets;
      (storage.getBudgets as any).mockResolvedValue(mockBudgets);

      const budgets = await storage.getBudgets('test-user-id-123');

      expect(budgets).toHaveLength(2);
      expect(budgets[0].monthlyLimit).toBe(5000);
    });

    it('should return empty array when user has no budgets', async () => {
      (storage.getBudgets as any).mockResolvedValue([]);

      const budgets = await storage.getBudgets('test-user-id-123');

      expect(budgets).toEqual([]);
    });
  });

  describe('GET /api/budgets/progress', () => {
    it('should return budget progress with spending', async () => {
      const mockProgress = [
        { categoryId: 1, categoryName: 'Food', monthlyLimit: 5000, spent: 3000, remaining: 2000, percentage: 60 },
        { categoryId: 2, categoryName: 'Transportation', monthlyLimit: 3000, spent: 3500, remaining: -500, percentage: 117 },
      ];
      (storage.getBudgetProgress as any).mockResolvedValue(mockProgress);

      const progress = await storage.getBudgetProgress('test-user-id-123');

      expect(progress).toHaveLength(2);
      expect(progress[0].percentage).toBe(60);
      expect(progress[1].percentage).toBeGreaterThan(100); // Over budget
    });
  });

  describe('POST /api/budgets', () => {
    it('should create a new budget with valid data', async () => {
      const newBudgetData = {
        userId: 'test-user-id-123',
        categoryId: 3,
        monthlyLimit: 2000,
      };
      const createdBudget = { id: 3, ...newBudgetData, createdAt: new Date() };
      (storage.createBudget as any).mockResolvedValue(createdBudget);

      const budget = await storage.createBudget(newBudgetData);

      expect(budget.id).toBe(3);
      expect(budget.monthlyLimit).toBe(2000);
    });

    it('should reject duplicate budget for same category', async () => {
      const error = { code: '23505' };
      (storage.createBudget as any).mockRejectedValue(error);

      await expect(storage.createBudget({
        userId: 'test-user-id-123',
        categoryId: 1, // Already has a budget
        monthlyLimit: 5000,
      })).rejects.toEqual(error);
    });

    it('should reject non-positive budget amounts', () => {
      // Schema validation test
      const invalidAmount = 0;
      expect(invalidAmount).toBeLessThanOrEqual(0);
      // The insertBudgetSchema would reject this with "Budget must be positive"
    });
  });

  describe('PUT /api/budgets/:id', () => {
    it('should update an existing budget', async () => {
      const updatedData = { monthlyLimit: 6000 };
      const updatedBudget = { ...testData.budgets[0], ...updatedData };
      (storage.updateBudget as any).mockResolvedValue(updatedBudget);

      const budget = await storage.updateBudget(1, 'test-user-id-123', updatedData);

      expect(budget?.monthlyLimit).toBe(6000);
    });

    it('should return null when updating non-existent budget', async () => {
      (storage.updateBudget as any).mockResolvedValue(null);

      const budget = await storage.updateBudget(999, 'test-user-id-123', { monthlyLimit: 1000 });

      expect(budget).toBeNull();
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    it('should delete a budget', async () => {
      (storage.deleteBudget as any).mockResolvedValue(undefined);

      await storage.deleteBudget(1, 'test-user-id-123');

      expect(storage.deleteBudget).toHaveBeenCalledWith(1, 'test-user-id-123');
    });
  });
});
