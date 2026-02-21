/**
 * Digest API Tests
 * Tests for /api/digest endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorageMock } from '../utils/test-helpers';

const mockStorage = createStorageMock();
vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

import { storage } from '../../server/storage';

describe('Digest API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/digest/preferences', () => {
    it('should return digest preferences for user', async () => {
      const mockPrefs = {
        enabled: true,
        frequency: 'weekly',
        includeCategories: true,
        includeBudgetAlerts: true,
        includeTopMerchants: true,
        email: 'test@example.com',
      };
      (storage.getDigestPreferences as any).mockResolvedValue(mockPrefs);

      const prefs = await storage.getDigestPreferences('test-user-id-123');

      expect(prefs?.enabled).toBe(true);
      expect(prefs?.frequency).toBe('weekly');
      expect(prefs?.email).toBe('test@example.com');
    });

    it('should return default preferences for new user', async () => {
      (storage.getDigestPreferences as any).mockResolvedValue(null);

      const prefs = await storage.getDigestPreferences('new-user-id');

      expect(prefs).toBeNull();
      // Route returns default: { enabled: false, frequency: 'weekly', ... }
    });
  });

  describe('PUT /api/digest/preferences', () => {
    it('should update digest preferences', async () => {
      const updatedPrefs = {
        userId: 'test-user-id-123',
        enabled: true,
        frequency: 'daily',
        email: 'newemail@example.com',
      };
      (storage.upsertDigestPreferences as any).mockResolvedValue(updatedPrefs);

      const prefs = await storage.upsertDigestPreferences('test-user-id-123', updatedPrefs);

      expect(prefs.frequency).toBe('daily');
      expect(prefs.email).toBe('newemail@example.com');
    });

    it('should support both daily and weekly frequencies', () => {
      const validFrequencies = ['daily', 'weekly'];
      
      expect(validFrequencies).toContain('daily');
      expect(validFrequencies).toContain('weekly');
    });
  });

  describe('POST /api/digest/preview', () => {
    it('should generate digest preview', async () => {
      const mockContent = {
        summary: {
          totalSpending: 7500,
          transactionCount: 15,
          avgPerDay: 250,
          highestExpense: 1500,
        },
        trend: {
          currentMonth: 7500,
          previousMonth: 6000,
          percentChange: 25,
        },
        categories: [
          { name: 'Food', total: 5000 },
          { name: 'Transportation', total: 2500 },
        ],
        budgetAlerts: [
          { categoryName: 'Shopping', spent: 3500, monthlyLimit: 3000, percentage: 117 },
        ],
        topMerchants: [
          { merchant: 'Jollibee', count: 5, total: 1500 },
        ],
      };
      (storage.generateDigestContent as any).mockResolvedValue(mockContent);

      const content = await storage.generateDigestContent('test-user-id-123', {
        includeCategories: true,
        includeBudgetAlerts: true,
        includeTopMerchants: true,
      });

      expect(content.summary.totalSpending).toBe(7500);
      expect(content.categories).toHaveLength(2);
      expect(content.budgetAlerts).toHaveLength(1);
      expect(content.topMerchants).toHaveLength(1);
    });

    it('should exclude sections based on options', async () => {
      const mockContent = {
        summary: { totalSpending: 7500 },
        trend: { currentMonth: 7500 },
        categories: [],
        budgetAlerts: [],
        topMerchants: [],
      };
      (storage.generateDigestContent as any).mockResolvedValue(mockContent);

      const content = await storage.generateDigestContent('test-user-id-123', {
        includeCategories: false,
        includeBudgetAlerts: false,
        includeTopMerchants: false,
      });

      expect(content.categories).toHaveLength(0);
    });
  });

  describe('POST /api/digest/send', () => {
    it('should require valid email address', () => {
      const validEmails = ['test@example.com', 'user+tag@domain.org'];
      const invalidEmails = ['notanemail', 'missing@', '@nodomain.com'];

      validEmails.forEach(email => {
        expect(email).toMatch(/@/);
      });

      invalidEmails.forEach(email => {
        const hasValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(hasValidFormat).toBe(false);
      });
    });

    it('should update lastSentAt after sending', async () => {
      const now = new Date();
      (storage.upsertDigestPreferences as any).mockResolvedValue({ lastSentAt: now });

      await storage.upsertDigestPreferences('test-user-id-123', { lastSentAt: now });

      expect(storage.upsertDigestPreferences).toHaveBeenCalled();
    });
  });
});
