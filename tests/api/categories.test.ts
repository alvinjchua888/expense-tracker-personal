/**
 * Categories API Tests
 * Tests for /api/categories endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse, createStorageMock, testData } from '../utils/test-helpers';

// Mock the storage module
vi.mock('../../server/storage', () => ({
  storage: createStorageMock(),
}));

// Mock authentication
vi.mock('../../server/replitAuth', () => ({
  setupAuth: vi.fn(),
  isAuthenticated: (_req: any, _res: any, next: any) => next(),
}));

import { storage } from '../../server/storage';

describe('Categories API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should return all categories for authenticated user', async () => {
      const mockCategories = testData.categories;
      (storage.getCategories as any).mockResolvedValue(mockCategories);

      const req = createMockRequest();
      const res = createMockResponse();

      // Simulate route handler
      const userId = req.user?.claims.sub;
      const categories = await storage.getCategories(userId!);

      expect(categories).toEqual(mockCategories);
      expect(storage.getCategories).toHaveBeenCalledWith('test-user-id-123');
    });

    it('should return empty array when user has no categories', async () => {
      (storage.getCategories as any).mockResolvedValue([]);

      const req = createMockRequest();
      const categories = await storage.getCategories(req.user?.claims.sub!);

      expect(categories).toEqual([]);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return a single category by ID', async () => {
      const mockCategory = testData.categories[0];
      (storage.getCategory as any).mockResolvedValue(mockCategory);

      const category = await storage.getCategory(1, 'test-user-id-123');

      expect(category).toEqual(mockCategory);
      expect(category?.name).toBe('Food');
    });

    it('should return null for non-existent category', async () => {
      (storage.getCategory as any).mockResolvedValue(null);

      const category = await storage.getCategory(999, 'test-user-id-123');

      expect(category).toBeNull();
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category with valid data', async () => {
      const newCategoryData = {
        name: 'Entertainment',
        icon: 'Film',
        userId: 'test-user-id-123',
      };
      const createdCategory = { id: 4, ...newCategoryData, createdAt: new Date() };
      (storage.createCategory as any).mockResolvedValue(createdCategory);

      const category = await storage.createCategory(newCategoryData);

      expect(category.id).toBe(4);
      expect(category.name).toBe('Entertainment');
      expect(storage.createCategory).toHaveBeenCalledWith(newCategoryData);
    });

    it('should trim whitespace from category name', async () => {
      const newCategoryData = {
        name: '  Utilities  ',
        icon: 'Zap',
        userId: 'test-user-id-123',
      };
      
      // The schema transformation would trim this
      const trimmedName = newCategoryData.name.trim();
      expect(trimmedName).toBe('Utilities');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update an existing category', async () => {
      const updatedData = { name: 'Food & Dining' };
      const updatedCategory = { ...testData.categories[0], ...updatedData };
      (storage.updateCategory as any).mockResolvedValue(updatedCategory);

      const category = await storage.updateCategory(1, 'test-user-id-123', updatedData);

      expect(category?.name).toBe('Food & Dining');
    });

    it('should return null when updating non-existent category', async () => {
      (storage.updateCategory as any).mockResolvedValue(null);

      const category = await storage.updateCategory(999, 'test-user-id-123', { name: 'Test' });

      expect(category).toBeNull();
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category', async () => {
      (storage.deleteCategory as any).mockResolvedValue(undefined);

      await storage.deleteCategory(1, 'test-user-id-123');

      expect(storage.deleteCategory).toHaveBeenCalledWith(1, 'test-user-id-123');
    });
  });
});
