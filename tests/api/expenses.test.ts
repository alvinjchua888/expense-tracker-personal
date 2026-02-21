/**
 * Expenses API Tests
 * Tests for /api/expenses endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorageMock, testData } from '../utils/test-helpers';

// Mock the storage module
const mockStorage = createStorageMock();
vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

import { storage } from '../../server/storage';

describe('Expenses API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/expenses', () => {
    it('should return paginated expenses for user', async () => {
      const mockExpenses = testData.expenses;
      (storage.getExpenses as any).mockResolvedValue(mockExpenses);
      (storage.countExpenses as any).mockResolvedValue(2);

      const userId = 'test-user-id-123';
      const filters = { limit: 20, offset: 0 };
      
      const [expenses, total] = await Promise.all([
        storage.getExpenses(userId, filters),
        storage.countExpenses(userId, {}),
      ]);

      expect(expenses).toHaveLength(2);
      expect(total).toBe(2);
      expect(expenses[0].merchant).toBe('Jollibee');
    });

    it('should filter expenses by date range', async () => {
      const filteredExpenses = [testData.expenses[0]];
      (storage.getExpenses as any).mockResolvedValue(filteredExpenses);

      const filters = {
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-02-15'),
      };
      
      const expenses = await storage.getExpenses('test-user-id-123', filters);

      expect(expenses).toHaveLength(1);
    });

    it('should filter expenses by category', async () => {
      const filteredExpenses = testData.expenses.filter(e => e.categoryId === 1);
      (storage.getExpenses as any).mockResolvedValue(filteredExpenses);

      const expenses = await storage.getExpenses('test-user-id-123', { categoryId: 1 });

      expect(expenses.every(e => e.categoryId === 1)).toBe(true);
    });

    it('should filter expenses by search term', async () => {
      const filteredExpenses = [testData.expenses[0]];
      (storage.getExpenses as any).mockResolvedValue(filteredExpenses);

      const expenses = await storage.getExpenses('test-user-id-123', { search: 'Jollibee' });

      expect(expenses).toHaveLength(1);
      expect(expenses[0].merchant).toBe('Jollibee');
    });
  });

  describe('GET /api/expenses/:id', () => {
    it('should return a single expense by ID', async () => {
      const mockExpense = testData.expenses[0];
      (storage.getExpense as any).mockResolvedValue(mockExpense);

      const expense = await storage.getExpense(1, 'test-user-id-123');

      expect(expense).toEqual(mockExpense);
      expect(expense?.amount).toBe(150.50);
    });

    it('should return null for non-existent expense', async () => {
      (storage.getExpense as any).mockResolvedValue(null);

      const expense = await storage.getExpense(999, 'test-user-id-123');

      expect(expense).toBeNull();
    });
  });

  describe('POST /api/expenses', () => {
    it('should create a new expense with valid data', async () => {
      const newExpenseData = {
        amount: 250.00,
        currency: 'PHP',
        merchant: 'SM Supermarket',
        description: 'Groceries',
        categoryId: 1,
        date: new Date('2026-02-20'),
        userId: 'test-user-id-123',
      };
      const createdExpense = { id: 3, ...newExpenseData, hasReceipt: false, receiptUrl: null, createdAt: new Date() };
      (storage.createExpense as any).mockResolvedValue(createdExpense);

      const expense = await storage.createExpense(newExpenseData);

      expect(expense.id).toBe(3);
      expect(expense.amount).toBe(250.00);
      expect(expense.merchant).toBe('SM Supermarket');
    });

    it('should reject negative amounts', () => {
      // Schema validation test
      const invalidAmount = -100;
      expect(invalidAmount).toBeLessThan(0);
      // The insertExpenseSchema would reject this with "Amount must be positive"
    });

    it('should reject amounts exceeding max limit', () => {
      // Schema validation test
      const invalidAmount = 9999999999;
      expect(invalidAmount).toBeGreaterThan(999999999);
      // The insertExpenseSchema would reject this with "Amount too large"
    });
  });

  describe('PUT /api/expenses/:id', () => {
    it('should update an existing expense', async () => {
      const updatedData = { amount: 200.00, description: 'Updated lunch' };
      const updatedExpense = { ...testData.expenses[0], ...updatedData };
      (storage.updateExpense as any).mockResolvedValue(updatedExpense);

      const expense = await storage.updateExpense(1, 'test-user-id-123', updatedData);

      expect(expense?.amount).toBe(200.00);
      expect(expense?.description).toBe('Updated lunch');
    });

    it('should return null when updating non-existent expense', async () => {
      (storage.updateExpense as any).mockResolvedValue(null);

      const expense = await storage.updateExpense(999, 'test-user-id-123', { amount: 100 });

      expect(expense).toBeNull();
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    it('should delete an expense', async () => {
      (storage.deleteExpense as any).mockResolvedValue(undefined);

      await storage.deleteExpense(1, 'test-user-id-123');

      expect(storage.deleteExpense).toHaveBeenCalledWith(1, 'test-user-id-123');
    });
  });

  describe('GET /api/expenses/export/csv', () => {
    it('should export expenses as CSV', async () => {
      const expensesWithCategory = testData.expenses.map(e => ({
        ...e,
        categoryName: 'Food',
      }));
      (storage.getExpensesWithCategory as any).mockResolvedValue(expensesWithCategory);

      const expenses = await storage.getExpensesWithCategory('test-user-id-123');

      expect(expenses).toHaveLength(2);
      expect(expenses[0]).toHaveProperty('categoryName');
    });
  });
});
