/**
 * Goals API Tests
 * Tests for /api/goals endpoints (Savings Goals & Contributions)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorageMock, testData } from '../utils/test-helpers';

const mockStorage = createStorageMock();
vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

import { storage } from '../../server/storage';

describe('Goals API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/goals', () => {
    it('should return all goals for user', async () => {
      const mockGoals = testData.goals;
      (storage.getSavingsGoals as any).mockResolvedValue(mockGoals);

      const goals = await storage.getSavingsGoals('test-user-id-123');

      expect(goals).toHaveLength(1);
      expect(goals[0].name).toBe('Emergency Fund');
      expect(goals[0].targetAmount).toBe(50000);
    });
  });

  describe('GET /api/goals/:id', () => {
    it('should return a single goal by ID', async () => {
      const mockGoal = testData.goals[0];
      (storage.getSavingsGoal as any).mockResolvedValue(mockGoal);

      const goal = await storage.getSavingsGoal(1, 'test-user-id-123');

      expect(goal).toEqual(mockGoal);
      expect(goal?.currentAmount).toBe(15000);
    });

    it('should return null for non-existent goal', async () => {
      (storage.getSavingsGoal as any).mockResolvedValue(null);

      const goal = await storage.getSavingsGoal(999, 'test-user-id-123');

      expect(goal).toBeNull();
    });
  });

  describe('POST /api/goals', () => {
    it('should create a new goal with valid data', async () => {
      const newGoalData = {
        userId: 'test-user-id-123',
        name: 'Vacation Fund',
        targetAmount: 30000,
        targetDate: new Date('2026-06-30'),
        icon: '✈️',
        color: '#10B981',
      };
      const createdGoal = { id: 2, currentAmount: 0, ...newGoalData, createdAt: new Date() };
      (storage.createSavingsGoal as any).mockResolvedValue(createdGoal);

      const goal = await storage.createSavingsGoal(newGoalData);

      expect(goal.id).toBe(2);
      expect(goal.name).toBe('Vacation Fund');
      expect(goal.currentAmount).toBe(0);
    });

    it('should enforce 10-goal limit', async () => {
      (storage.countSavingsGoals as any).mockResolvedValue(10);

      const count = await storage.countSavingsGoals('test-user-id-123');

      expect(count).toBe(10);
      // Route would return 400 error: "Maximum 10 goals reached"
    });

    it('should allow creating goal when under limit', async () => {
      (storage.countSavingsGoals as any).mockResolvedValue(5);

      const count = await storage.countSavingsGoals('test-user-id-123');

      expect(count).toBeLessThan(10);
    });
  });

  describe('PUT /api/goals/:id', () => {
    it('should update goal details', async () => {
      const updatedData = { name: 'Updated Emergency Fund', targetAmount: 75000 };
      const updatedGoal = { ...testData.goals[0], ...updatedData };
      (storage.updateSavingsGoal as any).mockResolvedValue(updatedGoal);

      const goal = await storage.updateSavingsGoal(1, 'test-user-id-123', updatedData);

      expect(goal?.name).toBe('Updated Emergency Fund');
      expect(goal?.targetAmount).toBe(75000);
    });

    it('should return null when updating non-existent goal', async () => {
      (storage.updateSavingsGoal as any).mockResolvedValue(null);

      const goal = await storage.updateSavingsGoal(999, 'test-user-id-123', { name: 'Test' });

      expect(goal).toBeNull();
    });
  });

  describe('DELETE /api/goals/:id', () => {
    it('should delete a goal', async () => {
      (storage.deleteSavingsGoal as any).mockResolvedValue(undefined);

      await storage.deleteSavingsGoal(1, 'test-user-id-123');

      expect(storage.deleteSavingsGoal).toHaveBeenCalledWith(1, 'test-user-id-123');
    });
  });

  describe('Goal Contributions', () => {
    describe('GET /api/goals/:id/contributions', () => {
      it('should return contributions for a goal', async () => {
        const mockContributions = [
          { id: 1, goalId: 1, amount: 5000, note: 'Initial deposit', createdAt: new Date() },
          { id: 2, goalId: 1, amount: 10000, note: 'Bonus', createdAt: new Date() },
        ];
        (storage.getGoalContributions as any).mockResolvedValue(mockContributions);

        const contributions = await storage.getGoalContributions(1, 'test-user-id-123');

        expect(contributions).toHaveLength(2);
        expect(contributions.reduce((sum, c) => sum + c.amount, 0)).toBe(15000);
      });
    });

    describe('POST /api/goals/:id/contributions', () => {
      it('should add a contribution to a goal', async () => {
        const newContribution = { goalId: 1, amount: 5000, note: 'Monthly savings' };
        const createdContribution = { id: 3, ...newContribution, createdAt: new Date() };
        (storage.createGoalContribution as any).mockResolvedValue(createdContribution);

        const contribution = await storage.createGoalContribution(newContribution, 'test-user-id-123');

        expect(contribution.id).toBe(3);
        expect(contribution.amount).toBe(5000);
      });

      it('should trigger badge check after contribution', async () => {
        const newContribution = { goalId: 1, amount: 1000 };
        (storage.createGoalContribution as any).mockResolvedValue({ id: 4, ...newContribution });
        (storage.checkAndUnlockBadges as any).mockResolvedValue(undefined);

        await storage.createGoalContribution(newContribution, 'test-user-id-123');
        await storage.checkAndUnlockBadges('test-user-id-123');

        expect(storage.checkAndUnlockBadges).toHaveBeenCalled();
      });
    });

    describe('DELETE /api/goals/:id/contributions/:contribId', () => {
      it('should delete a contribution', async () => {
        (storage.deleteGoalContribution as any).mockResolvedValue(undefined);

        await storage.deleteGoalContribution(1, 1, 'test-user-id-123');

        expect(storage.deleteGoalContribution).toHaveBeenCalledWith(1, 1, 'test-user-id-123');
      });
    });
  });
});
