import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, real, timestamp, boolean, jsonb, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"),
  authMethod: varchar("auth_method").default("oidc").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const registerUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50).transform(s => s.trim().toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  firstName: z.string().max(100).transform(s => s.trim()).optional().or(z.literal("")),
  lastName: z.string().max(100).transform(s => s.trim()).optional().or(z.literal("")),
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("Shopping"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less").transform(s => s.trim()),
  icon: z.string().min(1).max(50).default("Shopping"),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "MXN", "PHP"] as const;
export type Currency = typeof CURRENCIES[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "Fr",
  CNY: "¥",
  INR: "₹",
  MXN: "$",
  PHP: "₱",
};

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  amount: real("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("PHP"),
  description: text("description"),
  merchant: text("merchant").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  date: timestamp("date").notNull(),
  hasReceipt: boolean("has_receipt").default(false),
  receiptUrl: text("receipt_url"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.number().positive("Amount must be positive").finite("Amount must be finite").max(999999999, "Amount too large"),
  merchant: z.string().min(1, "Merchant is required").max(200, "Merchant must be 200 characters or less").transform(s => s.trim()),
  description: z.string().max(1000, "Description must be 1000 characters or less").transform(s => s.trim()).nullable().optional(),
  currency: z.enum(CURRENCIES).default("PHP"),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  monthlyLimit: real("monthly_limit").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [unique("budgets_user_category_unique").on(table.userId, table.categoryId)]);

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
}).extend({
  monthlyLimit: z.number().positive("Budget must be positive").finite().max(999999999),
});

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export const recurringExpenses = pgTable("recurring_expenses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: real("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("PHP"),
  merchant: text("merchant").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  frequency: text("frequency").notNull(), // daily, weekly, monthly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  lastGeneratedDate: timestamp("last_generated_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertRecurringExpenseSchema = createInsertSchema(recurringExpenses).omit({
  id: true,
  createdAt: true,
  lastGeneratedDate: true,
}).extend({
  amount: z.number().positive("Amount must be positive").finite().max(999999999),
  merchant: z.string().min(1).max(200).transform(s => s.trim()),
  description: z.string().max(1000).transform(s => s.trim()).nullable().optional(),
  currency: z.enum(CURRENCIES).default("PHP"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
});

export type InsertRecurringExpense = z.infer<typeof insertRecurringExpenseSchema>;
export type RecurringExpense = typeof recurringExpenses.$inferSelect;

export const digestPreferences = pgTable("digest_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  frequency: text("frequency").notNull().default("weekly"), // "daily" | "weekly"
  includeCategories: boolean("include_categories").default(true).notNull(),
  includeBudgetAlerts: boolean("include_budget_alerts").default(true).notNull(),
  includeTopMerchants: boolean("include_top_merchants").default(true).notNull(),
  email: varchar("email"),
  lastSentAt: timestamp("last_sent_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [unique("digest_preferences_user_unique").on(table.userId)]);

export const insertDigestPreferencesSchema = createInsertSchema(digestPreferences).omit({
  id: true,
  createdAt: true,
  lastSentAt: true,
}).extend({
  frequency: z.enum(["daily", "weekly"]).default("weekly"),
  email: z.string().email("Invalid email address").nullable().optional(),
  enabled: z.boolean().default(false),
  includeCategories: z.boolean().default(true),
  includeBudgetAlerts: z.boolean().default(true),
  includeTopMerchants: z.boolean().default(true),
});

export type InsertDigestPreferences = z.infer<typeof insertDigestPreferencesSchema>;
export type DigestPreferences = typeof digestPreferences.$inferSelect;

// Savings Goals table for tracking financial objectives
export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").default(0).notNull(),
  targetDate: timestamp("target_date").notNull(),
  icon: varchar("icon", { length: 50 }).default("🎯"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  linkedCategoryId: integer("linked_category_id").references(() => categories.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({
  id: true,
  createdAt: true,
  currentAmount: true,
}).extend({
  targetAmount: z.number().positive("Target must be positive").finite().max(999999999, "Amount too large"),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less").transform(s => s.trim()),
  icon: z.string().max(50).default("🎯").optional(),
  color: z.string().max(7).default("#3B82F6").optional(),
  linkedCategoryId: z.number().int().positive().nullable().optional(),
});

export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SavingsGoal = typeof savingsGoals.$inferSelect;

// Goal Contributions table (Story 2-2)
export const goalContributions = pgTable("goal_contributions", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => savingsGoals.id, { onDelete: "cascade" }).notNull(),
  amount: real("amount").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertGoalContributionSchema = createInsertSchema(goalContributions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.number().positive("Amount must be positive").finite().max(999999999),
  note: z.string().max(500).nullable().optional(),
});

export type InsertGoalContribution = z.infer<typeof insertGoalContributionSchema>;
export type GoalContribution = typeof goalContributions.$inferSelect;

// User Streaks table (Story 5-1)
export const userStreaks = pgTable("user_streaks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastExpenseDate: timestamp("last_expense_date"),
  streakFreezesUsed: integer("streak_freezes_used").default(0).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [unique("user_streaks_user_unique").on(table.userId)]);

export type UserStreak = typeof userStreaks.$inferSelect;

// User Badges table (Story 5-2)
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  badgeKey: varchar("badge_key", { length: 50 }).notNull(),
  unlockedAt: timestamp("unlocked_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [unique("user_badge_unique").on(table.userId, table.badgeKey)]);

export type UserBadge = typeof userBadges.$inferSelect;

// Monthly Budget Scores table (Story 5-3)
export const monthlyScores = pgTable("monthly_scores", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  score: real("score").notNull(),
  breakdown: jsonb("breakdown").notNull(), // Array of category scores
  calculatedAt: timestamp("calculated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [unique("monthly_scores_user_month_unique").on(table.userId, table.year, table.month)]);

export const insertMonthlyScoreSchema = createInsertSchema(monthlyScores).omit({
  id: true,
  calculatedAt: true,
}).extend({
  score: z.number().min(0).max(100),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export type InsertMonthlyScore = z.infer<typeof insertMonthlyScoreSchema>;
export type MonthlyScore = typeof monthlyScores.$inferSelect;

// Budget Score breakdown type for JSONB storage
export interface CategoryScoreBreakdown {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  budget: number;
  spent: number;
  score: number;
  weight: number;
}

export * from "./models/chat";
