import { 
  type User, type UpsertUser,
  type Category, type InsertCategory,
  type Expense, type InsertExpense,
  users, categories, expenses 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getCategories(userId: string): Promise<Category[]>;
  getCategory(id: number, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, userId: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number, userId: string): Promise<void>;
  
  getExpenses(userId: string, filters?: { startDate?: Date; endDate?: Date; categoryId?: number }): Promise<Expense[]>;
  getExpense(id: number, userId: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, userId: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number, userId: string): Promise<void>;
  
  getCategorySpending(userId: string): Promise<{ categoryId: number; name: string; total: number }[]>;
  getSpendingByPeriod(userId: string, startDate: Date, endDate: Date): Promise<{ date: string; total: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getCategories(userId: string): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.userId, userId)).orderBy(categories.name);
  }

  async getCategory(id: number, userId: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: number, userId: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(and(eq(categories.id, id), eq(categories.userId, userId))).returning();
    return updated || undefined;
  }

  async deleteCategory(id: number, userId: string): Promise<void> {
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  }

  async getExpenses(userId: string, filters?: { startDate?: Date; endDate?: Date; categoryId?: number }): Promise<Expense[]> {
    const conditions = [eq(expenses.userId, userId)];
    
    if (filters?.startDate) {
      conditions.push(gte(expenses.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(expenses.date, filters.endDate));
    }
    if (filters?.categoryId) {
      conditions.push(eq(expenses.categoryId, filters.categoryId));
    }
    
    return db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date));
  }

  async getExpense(id: number, userId: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return expense || undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(expense).returning();
    return created;
  }

  async updateExpense(id: number, userId: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(expense).where(and(eq(expenses.id, id), eq(expenses.userId, userId))).returning();
    return updated || undefined;
  }

  async deleteExpense(id: number, userId: string): Promise<void> {
    await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
  }

  async getCategorySpending(userId: string): Promise<{ categoryId: number; name: string; total: number }[]> {
    const result = await db
      .select({
        categoryId: categories.id,
        name: categories.name,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(categories)
      .leftJoin(expenses, and(eq(categories.id, expenses.categoryId), eq(expenses.userId, userId)))
      .where(eq(categories.userId, userId))
      .groupBy(categories.id, categories.name)
      .orderBy(desc(sql`SUM(${expenses.amount})`));
    
    return result;
  }

  async getSpendingByPeriod(userId: string, startDate: Date, endDate: Date): Promise<{ date: string; total: number }[]> {
    const result = await db
      .select({
        date: sql<string>`DATE(${expenses.date})`,
        total: sql<number>`SUM(${expenses.amount})`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate), 
        lte(expenses.date, endDate)
      ))
      .groupBy(sql`DATE(${expenses.date})`)
      .orderBy(sql`DATE(${expenses.date})`);
    
    return result;
  }
}

export const storage = new DatabaseStorage();
