/**
 * Test utilities and mocks for API testing
 */
import { vi } from 'vitest';
import type { Request, Response } from 'express';

// Mock authenticated user
export const mockUser = {
  claims: {
    sub: 'test-user-id-123',
  },
};

// Create mock request with authentication
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    user: mockUser,
    body: {},
    params: {},
    query: {},
    ...overrides,
  };
}

// Create mock response
export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res;
}

// Sample test data
export const testData = {
  categories: [
    { id: 1, name: 'Food', icon: 'Utensils', userId: 'test-user-id-123', createdAt: new Date() },
    { id: 2, name: 'Transportation', icon: 'Car', userId: 'test-user-id-123', createdAt: new Date() },
    { id: 3, name: 'Shopping', icon: 'ShoppingBag', userId: 'test-user-id-123', createdAt: new Date() },
  ],
  expenses: [
    {
      id: 1,
      amount: 150.50,
      currency: 'PHP',
      merchant: 'Jollibee',
      description: 'Lunch',
      categoryId: 1,
      date: new Date('2026-02-15'),
      hasReceipt: false,
      receiptUrl: null,
      userId: 'test-user-id-123',
      createdAt: new Date(),
    },
    {
      id: 2,
      amount: 500.00,
      currency: 'PHP',
      merchant: 'Grab',
      description: 'Ride to office',
      categoryId: 2,
      date: new Date('2026-02-16'),
      hasReceipt: false,
      receiptUrl: null,
      userId: 'test-user-id-123',
      createdAt: new Date(),
    },
  ],
  budgets: [
    { id: 1, userId: 'test-user-id-123', categoryId: 1, monthlyLimit: 5000, createdAt: new Date() },
    { id: 2, userId: 'test-user-id-123', categoryId: 2, monthlyLimit: 3000, createdAt: new Date() },
  ],
  goals: [
    {
      id: 1,
      userId: 'test-user-id-123',
      name: 'Emergency Fund',
      targetAmount: 50000,
      currentAmount: 15000,
      targetDate: new Date('2026-12-31'),
      icon: '🎯',
      color: '#3B82F6',
      linkedCategoryId: null,
      createdAt: new Date(),
    },
  ],
  recurringExpenses: [
    {
      id: 1,
      userId: 'test-user-id-123',
      amount: 1500,
      currency: 'PHP',
      merchant: 'Netflix',
      description: 'Monthly subscription',
      categoryId: 3,
      frequency: 'monthly',
      startDate: new Date('2026-01-01'),
      endDate: null,
      lastGeneratedDate: null,
      isActive: true,
      createdAt: new Date(),
    },
  ],
  streak: {
    id: 1,
    userId: 'test-user-id-123',
    currentStreak: 5,
    longestStreak: 10,
    lastExpenseDate: new Date('2026-02-20'),
    streakFreezesUsed: 0,
    updatedAt: new Date(),
  },
  badges: [
    { id: 1, userId: 'test-user-id-123', badgeKey: 'first_expense', unlockedAt: new Date() },
    { id: 2, userId: 'test-user-id-123', badgeKey: 'streak_7', unlockedAt: new Date() },
  ],
};

// Storage mock factory
export function createStorageMock() {
  return {
    // User
    getUser: vi.fn().mockResolvedValue({ id: 'test-user-id-123', firstName: 'Test', lastName: 'User' }),
    upsertUser: vi.fn(),
    
    // Categories
    getCategories: vi.fn().mockResolvedValue(testData.categories),
    getCategory: vi.fn().mockImplementation((id: number) => 
      Promise.resolve(testData.categories.find(c => c.id === id) || null)
    ),
    createCategory: vi.fn().mockImplementation((data) => 
      Promise.resolve({ id: 4, ...data, createdAt: new Date() })
    ),
    updateCategory: vi.fn().mockImplementation((id: number, _userId: string, data) => 
      Promise.resolve({ ...testData.categories[0], ...data })
    ),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
    
    // Expenses
    getExpenses: vi.fn().mockResolvedValue(testData.expenses),
    getExpense: vi.fn().mockImplementation((id: number) => 
      Promise.resolve(testData.expenses.find(e => e.id === id) || null)
    ),
    createExpense: vi.fn().mockImplementation((data) => 
      Promise.resolve({ id: 3, ...data, createdAt: new Date() })
    ),
    updateExpense: vi.fn().mockImplementation((id: number, _userId: string, data) => 
      Promise.resolve({ ...testData.expenses[0], ...data })
    ),
    deleteExpense: vi.fn().mockResolvedValue(undefined),
    countExpenses: vi.fn().mockResolvedValue(2),
    getExpensesWithCategory: vi.fn().mockResolvedValue(testData.expenses.map(e => ({
      ...e,
      categoryName: testData.categories.find(c => c.id === e.categoryId)?.name || 'Unknown',
    }))),
    
    // Analytics
    getCategorySpending: vi.fn().mockResolvedValue([
      { id: 1, name: 'Food', icon: 'Utensils', total: 5000 },
      { id: 2, name: 'Transportation', icon: 'Car', total: 2500 },
    ]),
    getSpendingByPeriod: vi.fn().mockResolvedValue([
      { date: '2026-02-01', total: 1500 },
      { date: '2026-02-15', total: 2000 },
    ]),
    getSummaryStats: vi.fn().mockResolvedValue({
      totalSpending: 7500,
      transactionCount: 15,
      avgPerTransaction: 500,
    }),
    getMonthlyComparison: vi.fn().mockResolvedValue({
      currentMonth: 7500,
      previousMonth: 6000,
      percentChange: 25,
    }),
    getWeeklyBreakdown: vi.fn().mockResolvedValue([
      { week: 1, total: 2000 },
      { week: 2, total: 2500 },
    ]),
    getSpendingByDay: vi.fn().mockResolvedValue([]),
    getSpendingByMonth: vi.fn().mockResolvedValue([]),
    getSpendingByYear: vi.fn().mockResolvedValue([]),
    getAnnualReport: vi.fn().mockResolvedValue({
      grandTotal: 50000,
      transactionCount: 100,
      categoryTotals: [],
      expenses: [],
    }),
    
    // Budgets
    getBudgets: vi.fn().mockResolvedValue(testData.budgets),
    createBudget: vi.fn().mockImplementation((data) => 
      Promise.resolve({ id: 3, ...data, createdAt: new Date() })
    ),
    updateBudget: vi.fn().mockImplementation((id: number, _userId: string, data) => 
      Promise.resolve({ ...testData.budgets[0], ...data })
    ),
    deleteBudget: vi.fn().mockResolvedValue(undefined),
    getBudgetProgress: vi.fn().mockResolvedValue([
      { categoryId: 1, categoryName: 'Food', monthlyLimit: 5000, spent: 3000, remaining: 2000, percentage: 60 },
    ]),
    
    // Goals
    getSavingsGoals: vi.fn().mockResolvedValue(testData.goals),
    getSavingsGoal: vi.fn().mockImplementation((id: number) => 
      Promise.resolve(testData.goals.find(g => g.id === id) || null)
    ),
    createSavingsGoal: vi.fn().mockImplementation((data) => 
      Promise.resolve({ id: 2, currentAmount: 0, ...data, createdAt: new Date() })
    ),
    updateSavingsGoal: vi.fn().mockImplementation((id: number, _userId: string, data) => 
      Promise.resolve({ ...testData.goals[0], ...data })
    ),
    deleteSavingsGoal: vi.fn().mockResolvedValue(undefined),
    countSavingsGoals: vi.fn().mockResolvedValue(1),
    
    // Goal Contributions
    getGoalContributions: vi.fn().mockResolvedValue([
      { id: 1, goalId: 1, amount: 5000, note: 'Initial deposit', createdAt: new Date() },
    ]),
    createGoalContribution: vi.fn().mockImplementation((data) => 
      Promise.resolve({ id: 2, ...data, createdAt: new Date() })
    ),
    deleteGoalContribution: vi.fn().mockResolvedValue(undefined),
    
    // Recurring Expenses
    getRecurringExpenses: vi.fn().mockResolvedValue(testData.recurringExpenses),
    createRecurringExpense: vi.fn().mockImplementation((data) => 
      Promise.resolve({ id: 2, ...data, createdAt: new Date() })
    ),
    updateRecurringExpense: vi.fn().mockImplementation((id: number, _userId: string, data) => 
      Promise.resolve({ ...testData.recurringExpenses[0], ...data })
    ),
    deleteRecurringExpense: vi.fn().mockResolvedValue(undefined),
    generateDueRecurringExpenses: vi.fn().mockResolvedValue(0),
    
    // Digest
    getDigestPreferences: vi.fn().mockResolvedValue({
      enabled: true,
      frequency: 'weekly',
      includeCategories: true,
      includeBudgetAlerts: true,
      includeTopMerchants: true,
      email: 'test@example.com',
    }),
    upsertDigestPreferences: vi.fn().mockImplementation((userId, data) => 
      Promise.resolve({ userId, ...data })
    ),
    generateDigestContent: vi.fn().mockResolvedValue({
      summary: { totalSpending: 7500, transactionCount: 15, avgPerDay: 250, highestExpense: 1500 },
      trend: { currentMonth: 7500, previousMonth: 6000, percentChange: 25 },
      categories: [{ name: 'Food', total: 5000 }],
      budgetAlerts: [],
      topMerchants: [{ merchant: 'Jollibee', count: 5, total: 1500 }],
    }),
    
    // Streaks
    getUserStreak: vi.fn().mockResolvedValue(testData.streak),
    updateUserStreak: vi.fn().mockResolvedValue(undefined),
    
    // Badges
    getUserBadges: vi.fn().mockResolvedValue(testData.badges),
    checkAndUnlockBadges: vi.fn().mockResolvedValue(undefined),
    
    // Monthly Scores
    saveMonthlyScore: vi.fn().mockResolvedValue(undefined),
    getMonthlyScore: vi.fn().mockResolvedValue({ score: 85, year: 2026, month: 1 }),
    getMonthlyScoreHistory: vi.fn().mockResolvedValue([]),
  };
}
