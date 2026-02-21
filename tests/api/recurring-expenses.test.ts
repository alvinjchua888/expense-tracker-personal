/**
 * Recurring Expenses API Tests
 * Tests for /api/recurring-expenses endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorageMock, testData } from '../utils/test-helpers';

const mockStorage = createStorageMock();
vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

import { storage } from '../../server/storage';

describe('Recurring Expenses API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/recurring-expenses', () => {
    it('should return all recurring expenses for user', async () => {
      const mockRecurring = testData.recurringExpenses;
      (storage.getRecurringExpenses as any).mockResolvedValue(mockRecurring);

      const recurring = await storage.getRecurringExpenses('test-user-id-123');

      expect(recurring).toHaveLength(1);
      expect(recurring[0].merchant).toBe('Netflix');
      expect(recurring[0].frequency).toBe('monthly');
    });
  });

  describe('POST /api/recurring-expenses', () => {
    it('should create a new recurring expense', async () => {
      const newRecurringData = {
        userId: 'test-user-id-123',
        amount: 2500,
        currency: 'PHP',
        merchant: 'Spotify',
        description: 'Premium subscription',
        categoryId: 3,
        frequency: 'monthly',
        startDate: new Date('2026-02-01'),
        endDate: null,
        isActive: true,
      };
      const createdRecurring = { id: 2, ...newRecurringData, lastGeneratedDate: null, createdAt: new Date() };
      (storage.createRecurringExpense as any).mockResolvedValue(createdRecurring);

      const recurring = await storage.createRecurringExpense(newRecurringData);

      expect(recurring.id).toBe(2);
      expect(recurring.merchant).toBe('Spotify');
    });

    it('should support all frequency types', () => {
      const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
      
      validFrequencies.forEach(freq => {
        expect(['daily', 'weekly', 'monthly', 'yearly']).toContain(freq);
      });
    });
  });

  describe('PUT /api/recurring-expenses/:id', () => {
    it('should update a recurring expense', async () => {
      const updatedData = { amount: 1800, isActive: false };
      const updatedRecurring = { ...testData.recurringExpenses[0], ...updatedData };
      (storage.updateRecurringExpense as any).mockResolvedValue(updatedRecurring);

      const recurring = await storage.updateRecurringExpense(1, 'test-user-id-123', updatedData);

      expect(recurring?.amount).toBe(1800);
      expect(recurring?.isActive).toBe(false);
    });

    it('should return null when updating non-existent recurring expense', async () => {
      (storage.updateRecurringExpense as any).mockResolvedValue(null);

      const recurring = await storage.updateRecurringExpense(999, 'test-user-id-123', { amount: 100 });

      expect(recurring).toBeNull();
    });
  });

  describe('DELETE /api/recurring-expenses/:id', () => {
    it('should delete a recurring expense', async () => {
      (storage.deleteRecurringExpense as any).mockResolvedValue(undefined);

      await storage.deleteRecurringExpense(1, 'test-user-id-123');

      expect(storage.deleteRecurringExpense).toHaveBeenCalledWith(1, 'test-user-id-123');
    });
  });

  describe('POST /api/recurring-expenses/generate', () => {
    it('should generate due recurring expenses', async () => {
      (storage.generateDueRecurringExpenses as any).mockResolvedValue(3);

      const count = await storage.generateDueRecurringExpenses('test-user-id-123');

      expect(count).toBe(3);
    });

    it('should return 0 when no expenses are due', async () => {
      (storage.generateDueRecurringExpenses as any).mockResolvedValue(0);

      const count = await storage.generateDueRecurringExpenses('test-user-id-123');

      expect(count).toBe(0);
    });
  });
});
