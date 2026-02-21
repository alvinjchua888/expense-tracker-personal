import {
  type User, type UpsertUser,
  type Category, type InsertCategory,
  type Expense, type InsertExpense,
  type Budget, type InsertBudget,
  type RecurringExpense, type InsertRecurringExpense,
  type DigestPreferences, type InsertDigestPreferences,
  type SavingsGoal, type InsertSavingsGoal,
  type GoalContribution, type InsertGoalContribution,
  type UserStreak,
  type UserBadge,
  users, categories, expenses, budgets, recurringExpenses, digestPreferences, savingsGoals,
  goalContributions, userStreaks, userBadges
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, lte, and, sql, or, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

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
  getSpendingByYear(userId: string): Promise<{ period: string; total: number; count: number }[]>;
  getSpendingByMonth(userId: string, year: number): Promise<{ period: string; total: number; count: number }[]>;
  getSpendingByDay(userId: string, year: number, month: number): Promise<{ period: string; total: number; count: number }[]>;
  getAnnualReport(userId: string, year: number): Promise<{ expenses: any[]; categoryTotals: { name: string; total: number }[]; grandTotal: number; transactionCount: number }>;
  
  // Savings Goals
  getSavingsGoals(userId: string): Promise<SavingsGoal[]>;
  getSavingsGoal(id: number, userId: string): Promise<SavingsGoal | undefined>;
  createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal(id: number, userId: string, data: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined>;
  deleteSavingsGoal(id: number, userId: string): Promise<void>;
  countSavingsGoals(userId: string): Promise<number>;

  // Goal Contributions (Story 2-2)
  getGoalContributions(goalId: number, userId: string): Promise<GoalContribution[]>;
  createGoalContribution(data: InsertGoalContribution, userId: string): Promise<GoalContribution>;
  deleteGoalContribution(id: number, goalId: number, userId: string): Promise<void>;

  // Streaks (Story 5-1)
  getUserStreak(userId: string): Promise<UserStreak | undefined>;
  updateUserStreak(userId: string): Promise<UserStreak>;

  // Badges (Story 5-2)
  getUserBadges(userId: string): Promise<UserBadge[]>;
  checkAndUnlockBadges(userId: string): Promise<string[]>;
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

  async getExpenses(userId: string, filters?: { startDate?: Date; endDate?: Date; categoryId?: number; limit?: number; offset?: number; search?: string }): Promise<Expense[]> {
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
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(expenses.merchant, searchPattern),
          ilike(expenses.description, searchPattern),
        )!
      );
    }

    let query = db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date));

    if (filters?.limit) {
      query = query.limit(filters.limit) as typeof query;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as typeof query;
    }

    return query;
  }

  async countExpenses(userId: string, filters?: { startDate?: Date; endDate?: Date; categoryId?: number; search?: string }): Promise<number> {
    const conditions = [eq(expenses.userId, userId)];

    if (filters?.startDate) conditions.push(gte(expenses.date, filters.startDate));
    if (filters?.endDate) conditions.push(lte(expenses.date, filters.endDate));
    if (filters?.categoryId) conditions.push(eq(expenses.categoryId, filters.categoryId));
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(expenses.merchant, searchPattern),
          ilike(expenses.description, searchPattern),
        )!
      );
    }

    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(expenses)
      .where(and(...conditions));

    return Number(result.count);
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

  async getExpensesWithCategory(userId: string, filters?: { startDate?: Date; endDate?: Date; categoryId?: number }): Promise<{ id: number; amount: number; currency: string; description: string | null; merchant: string; categoryName: string; date: Date; hasReceipt: boolean | null }[]> {
    const conditions = [eq(expenses.userId, userId)];
    if (filters?.startDate) conditions.push(gte(expenses.date, filters.startDate));
    if (filters?.endDate) conditions.push(lte(expenses.date, filters.endDate));
    if (filters?.categoryId) conditions.push(eq(expenses.categoryId, filters.categoryId));

    const result = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        currency: expenses.currency,
        description: expenses.description,
        merchant: expenses.merchant,
        categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
        date: expenses.date,
        hasReceipt: expenses.hasReceipt,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(expenses.date));

    return result;
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
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonthNum = prevDate.getMonth() + 1;

    const [currentResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`EXTRACT(YEAR FROM ${expenses.date}) = ${currentYear}`,
        sql`EXTRACT(MONTH FROM ${expenses.date}) = ${currentMonthNum}`
      ));
    
    const [previousResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`EXTRACT(YEAR FROM ${expenses.date}) = ${prevYear}`,
        sql`EXTRACT(MONTH FROM ${expenses.date}) = ${prevMonthNum}`
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

  async getSpendingByYear(userId: string): Promise<{ period: string; total: number; count: number }[]> {
    const result = await db
      .select({
        period: sql<string>`EXTRACT(YEAR FROM ${expenses.date})::text`,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .groupBy(sql`EXTRACT(YEAR FROM ${expenses.date})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${expenses.date})`);
    return result.map(r => ({ period: String(r.period), total: Number(r.total), count: Number(r.count) }));
  }

  async getSpendingByMonth(userId: string, year: number): Promise<{ period: string; total: number; count: number }[]> {
    const startDate = new Date(year, 0, 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const result = await db
      .select({
        monthIndex: sql<number>`EXTRACT(MONTH FROM ${expenses.date})`,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`EXTRACT(YEAR FROM ${expenses.date}) = ${year}`
      ))
      .groupBy(sql`EXTRACT(MONTH FROM ${expenses.date})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${expenses.date})`);

    return monthNames.map((name, index) => {
      const found = result.find(r => Number(r.monthIndex) === index + 1);
      return { period: name, total: found ? Number(found.total) : 0, count: found ? Number(found.count) : 0 };
    });
  }

  async getSpendingByDay(userId: string, year: number, month: number): Promise<{ period: string; total: number; count: number }[]> {
    const daysInMonth = new Date(year, month, 0).getDate();

    const result = await db
      .select({
        day: sql<number>`EXTRACT(DAY FROM ${expenses.date})`,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`EXTRACT(YEAR FROM ${expenses.date}) = ${year}`,
        sql`EXTRACT(MONTH FROM ${expenses.date}) = ${month}`
      ))
      .groupBy(sql`EXTRACT(DAY FROM ${expenses.date})`)
      .orderBy(sql`EXTRACT(DAY FROM ${expenses.date})`);

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const found = result.find(r => Number(r.day) === day);
      return { period: String(day), total: found ? Number(found.total) : 0, count: found ? Number(found.count) : 0 };
    });
  }

  async getAnnualReport(userId: string, year: number): Promise<{ expenses: any[]; categoryTotals: { name: string; total: number }[]; grandTotal: number; transactionCount: number }> {
    const yearFilter = sql`EXTRACT(YEAR FROM ${expenses.date}) = ${year}`;

    const expenseList = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        description: expenses.description,
        date: expenses.date,
        categoryName: categories.name,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(
        eq(expenses.userId, userId),
        yearFilter
      ))
      .orderBy(desc(expenses.date));

    const categoryTotals = await db
      .select({
        name: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(
        eq(expenses.userId, userId),
        sql`EXTRACT(YEAR FROM ${expenses.date}) = ${year}`
      ))
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(${expenses.amount})`));

    const grandTotal = expenseList.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      expenses: expenseList.map(e => ({
        ...e,
        amount: Number(e.amount),
        categoryName: e.categoryName || 'Uncategorized',
      })),
      categoryTotals: categoryTotals.map(c => ({ name: c.name, total: Number(c.total) })),
      grandTotal,
      transactionCount: expenseList.length,
    };
  }

  // Budget methods
  async getBudgets(userId: string): Promise<Budget[]> {
    return db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [created] = await db.insert(budgets).values(budget).returning();
    return created;
  }

  async updateBudget(id: number, userId: string, data: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [updated] = await db.update(budgets).set(data).where(and(eq(budgets.id, id), eq(budgets.userId, userId))).returning();
    return updated || undefined;
  }

  async deleteBudget(id: number, userId: string): Promise<void> {
    await db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
  }

  async getBudgetProgress(userId: string): Promise<{ budgetId: number; categoryId: number; categoryName: string; monthlyLimit: number; spent: number }[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const result = await db
      .select({
        budgetId: budgets.id,
        categoryId: budgets.categoryId,
        categoryName: categories.name,
        monthlyLimit: budgets.monthlyLimit,
        spent: sql<number>`COALESCE((
          SELECT SUM(${expenses.amount})
          FROM ${expenses}
          WHERE ${expenses.userId} = ${userId}
            AND ${expenses.categoryId} = ${budgets.categoryId}
            AND EXTRACT(YEAR FROM ${expenses.date}) = ${currentYear}
            AND EXTRACT(MONTH FROM ${expenses.date}) = ${currentMonth}
        ), 0)`,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.userId, userId));

    return result.map(r => ({
      budgetId: r.budgetId,
      categoryId: r.categoryId,
      categoryName: r.categoryName || "Unknown",
      monthlyLimit: Number(r.monthlyLimit),
      spent: Number(r.spent),
    }));
  }

  // Recurring expense methods
  async getRecurringExpenses(userId: string): Promise<RecurringExpense[]> {
    return db.select().from(recurringExpenses).where(eq(recurringExpenses.userId, userId)).orderBy(desc(recurringExpenses.createdAt));
  }

  async createRecurringExpense(data: InsertRecurringExpense): Promise<RecurringExpense> {
    const [created] = await db.insert(recurringExpenses).values(data).returning();
    return created;
  }

  async updateRecurringExpense(id: number, userId: string, data: Partial<InsertRecurringExpense>): Promise<RecurringExpense | undefined> {
    const [updated] = await db.update(recurringExpenses).set(data).where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId))).returning();
    return updated || undefined;
  }

  async deleteRecurringExpense(id: number, userId: string): Promise<void> {
    await db.delete(recurringExpenses).where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId)));
  }

  async generateDueRecurringExpenses(userId: string): Promise<number> {
    const active = await db.select().from(recurringExpenses)
      .where(and(eq(recurringExpenses.userId, userId), eq(recurringExpenses.isActive, true)));

    let generated = 0;
    const now = new Date();

    for (const rec of active) {
      if (rec.endDate && rec.endDate < now) continue;

      let lastDate = rec.lastGeneratedDate || new Date(rec.startDate.getTime() - 1);
      const toGenerate: Date[] = [];

      let nextDate = this.getNextOccurrence(rec.startDate, rec.frequency, lastDate);
      while (nextDate <= now && toGenerate.length < 100) {
        toGenerate.push(nextDate);
        nextDate = this.getNextOccurrence(rec.startDate, rec.frequency, nextDate);
      }

      for (const date of toGenerate) {
        await db.insert(expenses).values({
          userId: rec.userId,
          amount: rec.amount,
          currency: rec.currency,
          merchant: rec.merchant,
          description: rec.description ? `${rec.description} (recurring)` : "Recurring expense",
          categoryId: rec.categoryId,
          date,
          hasReceipt: false,
        });
        generated++;
      }

      if (toGenerate.length > 0) {
        await db.update(recurringExpenses)
          .set({ lastGeneratedDate: toGenerate[toGenerate.length - 1] })
          .where(eq(recurringExpenses.id, rec.id));
      }
    }

    return generated;
  }

  private getNextOccurrence(startDate: Date, frequency: string, afterDate: Date): Date {
    const next = new Date(afterDate);
    switch (frequency) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  // Digest preferences methods
  async getDigestPreferences(userId: string): Promise<DigestPreferences | undefined> {
    const [prefs] = await db.select().from(digestPreferences).where(eq(digestPreferences.userId, userId));
    return prefs || undefined;
  }

  async upsertDigestPreferences(userId: string, data: Partial<InsertDigestPreferences>): Promise<DigestPreferences> {
    const [result] = await db
      .insert(digestPreferences)
      .values({ ...data, userId })
      .onConflictDoUpdate({
        target: digestPreferences.userId,
        set: { ...data },
      })
      .returning();
    return result;
  }

  async getTopMerchants(userId: string, limit: number = 5): Promise<{ merchant: string; count: number; total: number }[]> {
    const result = await db
      .select({
        merchant: expenses.merchant,
        count: sql<number>`COUNT(*)`,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .groupBy(expenses.merchant)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);

    return result.map(r => ({
      merchant: r.merchant,
      count: Number(r.count),
      total: Number(r.total),
    }));
  }

  // Local auth methods
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createLocalUser(data: { username: string; password: string; email?: string; firstName?: string; lastName?: string }): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const id = randomUUID();
    const [user] = await db.insert(users).values({
      id,
      username: data.username,
      passwordHash,
      authMethod: "local",
      email: data.email || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
    }).returning();
    return user;
  }

  async generateDigestContent(userId: string, options?: { includeCategories?: boolean; includeBudgetAlerts?: boolean; includeTopMerchants?: boolean }): Promise<{
    summary: { totalSpending: number; avgPerDay: number; transactionCount: number; highestExpense: number };
    trend: { currentMonth: number; previousMonth: number; percentChange: number };
    categories: { name: string; total: number }[];
    budgetAlerts: { categoryName: string; spent: number; monthlyLimit: number; percentage: number }[];
    topMerchants: { merchant: string; count: number; total: number }[];
    generatedAt: string;
  }> {
    const includeCategories = options?.includeCategories !== false;
    const includeBudgetAlerts = options?.includeBudgetAlerts !== false;
    const includeTopMerchants = options?.includeTopMerchants !== false;

    const [summary, trend] = await Promise.all([
      this.getSummaryStats(userId),
      this.getMonthlyComparison(userId),
    ]);

    let categoriesData: { name: string; total: number }[] = [];
    if (includeCategories) {
      const spending = await this.getCategorySpending(userId);
      categoriesData = spending.filter(c => c.total > 0).slice(0, 5).map(c => ({ name: c.name, total: Number(c.total) }));
    }

    let budgetAlerts: { categoryName: string; spent: number; monthlyLimit: number; percentage: number }[] = [];
    if (includeBudgetAlerts) {
      const progress = await this.getBudgetProgress(userId);
      budgetAlerts = progress
        .map(b => ({ categoryName: b.categoryName, spent: b.spent, monthlyLimit: b.monthlyLimit, percentage: b.monthlyLimit > 0 ? Math.round((b.spent / b.monthlyLimit) * 100) : 0 }))
        .filter(b => b.percentage >= 80)
        .sort((a, b) => b.percentage - a.percentage);
    }

    let topMerchants: { merchant: string; count: number; total: number }[] = [];
    if (includeTopMerchants) {
      topMerchants = await this.getTopMerchants(userId, 5);
    }

    return {
      summary: {
        totalSpending: summary.totalSpending,
        avgPerDay: summary.avgPerDay,
        transactionCount: summary.transactionCount,
        highestExpense: summary.highestExpense,
      },
      trend: {
        currentMonth: trend.currentMonth,
        previousMonth: trend.previousMonth,
        percentChange: trend.percentChange,
      },
      categories: categoriesData,
      budgetAlerts,
      topMerchants,
      generatedAt: new Date().toISOString(),
    };
  }

  // Savings Goals methods
  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    return db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId)).orderBy(desc(savingsGoals.createdAt));
  }

  async getSavingsGoal(id: number, userId: string): Promise<SavingsGoal | undefined> {
    const [goal] = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
    return goal || undefined;
  }

  async createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [created] = await db.insert(savingsGoals).values(goal).returning();
    return created;
  }

  async updateSavingsGoal(id: number, userId: string, data: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined> {
    const [updated] = await db.update(savingsGoals).set(data).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId))).returning();
    return updated || undefined;
  }

  async deleteSavingsGoal(id: number, userId: string): Promise<void> {
    await db.delete(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
  }

  async countSavingsGoals(userId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`COUNT(*)` }).from(savingsGoals).where(eq(savingsGoals.userId, userId));
    return Number(result.count);
  }

  // Goal Contributions (Story 2-2)
  async getGoalContributions(goalId: number, userId: string): Promise<GoalContribution[]> {
    // Verify ownership first
    const goal = await this.getSavingsGoal(goalId, userId);
    if (!goal) return [];
    return db.select().from(goalContributions)
      .where(eq(goalContributions.goalId, goalId))
      .orderBy(desc(goalContributions.createdAt));
  }

  async createGoalContribution(data: InsertGoalContribution, userId: string): Promise<GoalContribution> {
    const goal = await this.getSavingsGoal(data.goalId, userId);
    if (!goal) throw new Error("Goal not found");
    const [contribution] = await db.insert(goalContributions).values(data).returning();
    // Update currentAmount on the goal
    await db.update(savingsGoals)
      .set({ currentAmount: sql`${savingsGoals.currentAmount} + ${data.amount}` })
      .where(eq(savingsGoals.id, data.goalId));
    return contribution;
  }

  async deleteGoalContribution(id: number, goalId: number, userId: string): Promise<void> {
    const goal = await this.getSavingsGoal(goalId, userId);
    if (!goal) throw new Error("Goal not found");
    const [contrib] = await db.select().from(goalContributions)
      .where(and(eq(goalContributions.id, id), eq(goalContributions.goalId, goalId)));
    if (!contrib) return;
    await db.delete(goalContributions).where(eq(goalContributions.id, id));
    // Subtract amount from currentAmount (floor at 0)
    await db.update(savingsGoals)
      .set({ currentAmount: sql`GREATEST(0, ${savingsGoals.currentAmount} - ${contrib.amount})` })
      .where(eq(savingsGoals.id, goalId));
  }

  // Streak methods (Story 5-1)
  async getUserStreak(userId: string): Promise<UserStreak | undefined> {
    const [streak] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));
    return streak || undefined;
  }

  async updateUserStreak(userId: string): Promise<UserStreak> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const existing = await this.getUserStreak(userId);

    if (!existing) {
      const [created] = await db.insert(userStreaks).values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastExpenseDate: today,
        streakFreezesUsed: 0,
      }).returning();
      return created;
    }

    const lastDate = existing.lastExpenseDate ? new Date(existing.lastExpenseDate) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    // Already logged today
    if (lastDate && lastDate.getTime() === today.getTime()) {
      return existing;
    }

    let newStreak = existing.currentStreak;
    // Consecutive day (yesterday)
    if (lastDate && lastDate.getTime() === yesterday.getTime()) {
      newStreak = existing.currentStreak + 1;
    } else if (!lastDate) {
      newStreak = 1;
    } else {
      // Streak broken — check if freeze available
      const dayGap = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayGap === 2 && existing.streakFreezesUsed < 1) {
        // Use a freeze
        newStreak = existing.currentStreak + 1;
        await db.update(userStreaks).set({
          streakFreezesUsed: existing.streakFreezesUsed + 1,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, existing.longestStreak),
          lastExpenseDate: today,
          updatedAt: new Date(),
        }).where(eq(userStreaks.userId, userId));
        const [updated] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));
        return updated;
      }
      newStreak = 1;
    }

    const [updated] = await db.update(userStreaks).set({
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, existing.longestStreak),
      lastExpenseDate: today,
      updatedAt: new Date(),
    }).where(eq(userStreaks.userId, userId)).returning();
    return updated;
  }

  // Badge methods (Story 5-2)
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.unlockedAt));
  }

  async checkAndUnlockBadges(userId: string): Promise<string[]> {
    const existing = await this.getUserBadges(userId);
    const existingKeys = new Set(existing.map(b => b.badgeKey));
    const newBadges: string[] = [];

    const [expenseCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(expenses).where(eq(expenses.userId, userId));
    const totalExpenses = Number(expenseCount.count);

    const [receiptCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(expenses)
      .where(and(eq(expenses.userId, userId), eq(expenses.hasReceipt, true)));
    const totalReceipts = Number(receiptCount.count);

    const goalCount = await this.countSavingsGoals(userId);
    const streak = await this.getUserStreak(userId);
    const budgetsData = await this.getBudgets(userId);

    const badgeChecks: { key: string; condition: boolean }[] = [
      { key: "first_expense", condition: totalExpenses >= 1 },
      { key: "ten_expenses", condition: totalExpenses >= 10 },
      { key: "fifty_expenses", condition: totalExpenses >= 50 },
      { key: "receipt_rookie", condition: totalReceipts >= 1 },
      { key: "scanner_pro", condition: totalReceipts >= 50 },
      { key: "week_warrior", condition: (streak?.currentStreak || 0) >= 7 },
      { key: "month_master", condition: (streak?.currentStreak || 0) >= 30 },
      { key: "streak_100", condition: (streak?.longestStreak || 0) >= 100 },
      { key: "streak_365", condition: (streak?.longestStreak || 0) >= 365 },
      { key: "goal_setter", condition: goalCount >= 1 },
      { key: "budget_boss", condition: budgetsData.length >= 1 },
    ];

    for (const { key, condition } of badgeChecks) {
      if (condition && !existingKeys.has(key)) {
        try {
          await db.insert(userBadges).values({ userId, badgeKey: key }).onConflictDoNothing();
          newBadges.push(key);
        } catch {}
      }
    }

    return newBadges;
  }
}

export const storage = new DatabaseStorage();
