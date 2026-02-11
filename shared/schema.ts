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
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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

export * from "./models/chat";
