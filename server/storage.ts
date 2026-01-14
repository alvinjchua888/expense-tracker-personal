import { 
  type User, type UpsertUser,
  type Category, type InsertCategory,
  type Expense, type InsertExpense,
  users, categories, expenses 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
  { name: "Groceries", icon: "ShoppingCart" },
  { name: "Food", icon: "Utensils" },
  { name: "Transport", icon: "Car" },
  { name: "Housing", icon: "Home" },
  { name: "Utilities", icon: "Zap" },
  { name: "Entertainment", icon: "Film" },
  { name: "Health", icon: "Heart" },
  { name: "Education", icon: "GraduationCap" },
  { name: "Travel", icon: "Plane" },
  { name: "Other", icon: "MoreHorizontal" },
];

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  seedDefaultCategories(userId: string): Promise<void>;
  
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
  getSummaryStats(userId: string): Promise<{ totalSpending: number; avgPerDay: number; highestExpense: number; transactionCount: number; avgPerTransaction: number }>;
  getMonthlyComparison(userId: string): Promise<{ currentMonth: number; previousMonth: number; percentChange: number }>;
  getWeeklyBreakdown(userId: string): Promise<{ dayOfWeek: string; total: number }[]>;
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

  async seedDefaultCategories(userId: string): Promise<void> {
    const existingCategories = await this.getCategories(userId);
    if (existingCategories.length === 0) {
      const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
        name: cat.name,
        icon: cat.icon,
        userId,
      }));
      await db.insert(categories).values(categoriesToInsert);
    }
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

  async getSummaryStats(userId: string): Promise<{ totalSpending: number; avgPerDay: number; highestExpense: number; transactionCount: number; avgPerTransaction: number }> {
    const result = await db
      .select({
        totalSpending: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        highestExpense: sql<number>`COALESCE(MAX(${expenses.amount}), 0)`,
        transactionCount: sql<number>`COUNT(*)`,
        avgPerTransaction: sql<number>`COALESCE(AVG(${expenses.amount}), 0)`,
        distinctDays: sql<number>`COUNT(DISTINCT DATE(${expenses.date}))`,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId));
    
    const stats = result[0];
    const avgPerDay = stats.distinctDays > 0 ? stats.totalSpending / stats.distinctDays : 0;
    
    return {
      totalSpending: Number(stats.totalSpending),
      avgPerDay: Number(avgPerDay),
      highestExpense: Number(stats.highestExpense),
      transactionCount: Number(stats.transactionCount),
      avgPerTransaction: Number(stats.avgPerTransaction),
    };
  }

  async getMonthlyComparison(userId: string): Promise<{ currentMonth: number; previousMonth: number; percentChange: number }> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [currentResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId), 
        gte(expenses.date, currentMonthStart),
        lte(expenses.date, nextMonthStart)
      ));
    
    const [previousResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, previousMonthStart),
        lte(expenses.date, previousMonthEnd)
      ));

    const currentMonth = Number(currentResult?.total || 0);
    const previousMonth = Number(previousResult?.total || 0);
    const percentChange = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

    return { currentMonth, previousMonth, percentChange };
  }

  async getWeeklyBreakdown(userId: string): Promise<{ dayOfWeek: string; total: number }[]> {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const result = await db
      .select({
        dayIndex: sql<number>`EXTRACT(DOW FROM ${expenses.date})`,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .groupBy(sql`EXTRACT(DOW FROM ${expenses.date})`)
      .orderBy(sql`EXTRACT(DOW FROM ${expenses.date})`);

    const breakdown = dayNames.map((day, index) => {
      const found = result.find(r => Number(r.dayIndex) === index);
      return { dayOfWeek: day, total: found ? Number(found.total) : 0 };
    });

    return breakdown;
  }
}

export const storage = new DatabaseStorage();
