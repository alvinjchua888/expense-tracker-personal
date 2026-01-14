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
  
  getExpenses(userId: string, filters?: { startDate?: Date; endDate?: Date; categoryId?: number; page?: number; limit?: number }): Promise<{ expenses: Expense[]; total: number }>;
  getExpense(id: number, userId: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, userId: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number, userId: string): Promise<void>;
  deleteExpenses(ids: number[], userId: string): Promise<number>;
  
  getCategorySpending(userId: string): Promise<{ categoryId: number; name: string; total: number }[]>;
  getSpendingByPeriod(userId: string, startDate: Date, endDate: Date): Promise<{ date: string; total: number }[]>;
  getMonthlyComparison(userId: string): Promise<{ month: string; thisYear: number; lastYear: number }[]>;
  getMerchantSpending(userId: string, startDate: Date, endDate: Date, limit: number): Promise<{ merchant: string; total: number; count: number }[]>;
  getDayOfWeekSpending(userId: string, startDate: Date, endDate: Date): Promise<{ day: string; average: number; total: number }[]>;
  getSpendingForecast(userId: string): Promise<{ period: string; actual: number | null; forecast: number }[]>;
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

  async getExpenses(userId: string, filters?: { startDate?: Date; endDate?: Date; categoryId?: number; page?: number; limit?: number }): Promise<{ expenses: Expense[]; total: number }> {
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

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(expenses)
      .where(and(...conditions));
    const total = Number(countResult[0]?.count) || 0;

    let query = db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date));

    if (filters?.limit) {
      const page = filters.page || 1;
      const offset = (page - 1) * filters.limit;
      query = query.limit(filters.limit).offset(offset) as typeof query;
    }

    const expensesList = await query;
    return { expenses: expensesList, total };
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

  async deleteExpenses(ids: number[], userId: string): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await db
      .delete(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`${expenses.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`
      ))
      .returning();
    return result.length;
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

  async getMonthlyComparison(userId: string): Promise<{ month: string; thisYear: number; lastYear: number }[]> {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const result = await db
      .select({
        month: sql<number>`EXTRACT(MONTH FROM ${expenses.date})`,
        year: sql<number>`EXTRACT(YEAR FROM ${expenses.date})`,
        total: sql<number>`SUM(${expenses.amount})`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`EXTRACT(YEAR FROM ${expenses.date}) IN (${currentYear}, ${lastYear})`
      ))
      .groupBy(sql`EXTRACT(MONTH FROM ${expenses.date})`, sql`EXTRACT(YEAR FROM ${expenses.date})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${expenses.date})`);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: { month: string; thisYear: number; lastYear: number }[] = monthNames.map((name) => ({
      month: name,
      thisYear: 0,
      lastYear: 0,
    }));

    for (const row of result) {
      const monthIndex = Number(row.month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        if (Number(row.year) === currentYear) {
          monthlyData[monthIndex].thisYear = Number(row.total) || 0;
        } else if (Number(row.year) === lastYear) {
          monthlyData[monthIndex].lastYear = Number(row.total) || 0;
        }
      }
    }

    return monthlyData;
  }

  async getMerchantSpending(userId: string, startDate: Date, endDate: Date, limit: number): Promise<{ merchant: string; total: number; count: number }[]> {
    const result = await db
      .select({
        merchant: expenses.merchant,
        total: sql<number>`SUM(${expenses.amount})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      ))
      .groupBy(expenses.merchant)
      .orderBy(desc(sql`SUM(${expenses.amount})`))
      .limit(limit);

    return result.map(row => ({
      merchant: row.merchant,
      total: Number(row.total) || 0,
      count: Number(row.count) || 0,
    }));
  }

  async getDayOfWeekSpending(userId: string, startDate: Date, endDate: Date): Promise<{ day: string; average: number; total: number }[]> {
    const result = await db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${expenses.date})`,
        total: sql<number>`SUM(${expenses.amount})`,
        count: sql<number>`COUNT(DISTINCT DATE(${expenses.date}))`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      ))
      .groupBy(sql`EXTRACT(DOW FROM ${expenses.date})`)
      .orderBy(sql`EXTRACT(DOW FROM ${expenses.date})`);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayData: { day: string; average: number; total: number }[] = dayNames.map((name) => ({
      day: name,
      average: 0,
      total: 0,
    }));

    for (const row of result) {
      const dayIndex = Number(row.dayOfWeek);
      if (dayIndex >= 0 && dayIndex < 7) {
        const total = Number(row.total) || 0;
        const count = Number(row.count) || 1;
        dayData[dayIndex].total = total;
        dayData[dayIndex].average = Math.round((total / count) * 100) / 100;
      }
    }

    return dayData;
  }

  async getSpendingForecast(userId: string): Promise<{ period: string; actual: number | null; forecast: number }[]> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const historicalData = await this.getSpendingByPeriod(userId, thirtyDaysAgo, today);

    const totalSpending = historicalData.reduce((sum, day) => sum + (Number(day.total) || 0), 0);
    const daysWithData = historicalData.length || 1;
    const avgDailySpending = totalSpending / daysWithData;

    const result: { period: string; actual: number | null; forecast: number }[] = [];

    const weeklyActual: { [key: string]: number } = {};
    for (const day of historicalData) {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyActual[weekKey] = (weeklyActual[weekKey] || 0) + (Number(day.total) || 0);
    }

    const sortedWeeks = Object.keys(weeklyActual).sort();
    for (const week of sortedWeeks) {
      const weekDate = new Date(week);
      const weekLabel = `Week of ${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      result.push({
        period: weekLabel,
        actual: weeklyActual[week],
        forecast: Math.round(avgDailySpending * 7 * 100) / 100,
      });
    }

    for (let i = 1; i <= 4; i++) {
      const futureWeek = new Date(today);
      futureWeek.setDate(today.getDate() + (i * 7));
      const weekLabel = `Week of ${futureWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      result.push({
        period: weekLabel,
        actual: null,
        forecast: Math.round(avgDailySpending * 7 * 100) / 100,
      });
    }

    return result;
  }
}

export const storage = new DatabaseStorage();
