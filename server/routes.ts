import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertExpenseSchema, insertBudgetSchema, insertRecurringExpenseSchema, insertDigestPreferencesSchema, insertSavingsGoalSchema, insertGoalContributionSchema } from "@shared/schema";
import { z } from "zod";
import { openai } from "./replit_integrations/image/client";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiLimiter } from "./rateLimit";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/categories", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const userId = req.user.claims.sub;
      const category = await storage.getCategory(id, userId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertCategorySchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid category data", details: parsed.error.errors });
      }
      const category = await storage.createCategory(parsed.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const userId = req.user.claims.sub;
      const parsed = insertCategorySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid category data", details: parsed.error.errors });
      }
      const category = await storage.updateCategory(id, userId, parsed.data);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const userId = req.user.claims.sub;
      await storage.deleteCategory(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  app.get("/api/expenses", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const filters: { startDate?: Date; endDate?: Date; categoryId?: number; limit?: number; offset?: number; search?: string } = {};

      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.categoryId) filters.categoryId = parseInt(req.query.categoryId as string);
      if (req.query.search) filters.search = (req.query.search as string).trim();

      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      filters.limit = limit;
      filters.offset = offset;

      const [expensesList, total] = await Promise.all([
        storage.getExpenses(userId, filters),
        storage.countExpenses(userId, { startDate: filters.startDate, endDate: filters.endDate, categoryId: filters.categoryId, search: filters.search }),
      ]);

      res.json({ data: expensesList, total, limit, offset });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/export/csv", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const filters: { startDate?: Date; endDate?: Date; categoryId?: number } = {};
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.categoryId) filters.categoryId = parseInt(req.query.categoryId as string);

      const expensesData = await storage.getExpensesWithCategory(userId, Object.keys(filters).length > 0 ? filters : undefined);

      const escapeCsv = (val: string) => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const headers = ["Date", "Merchant", "Category", "Description", "Amount", "Currency"];
      const rows = expensesData.map(e => [
        new Date(e.date).toISOString().split("T")[0],
        escapeCsv(e.merchant),
        escapeCsv(e.categoryName),
        escapeCsv(e.description || ""),
        e.amount.toFixed(2),
        e.currency,
      ].join(","));

      const csv = [headers.join(","), ...rows].join("\n");
      const dateStr = new Date().toISOString().split("T")[0];

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="expenses-${dateStr}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Error exporting expenses:", error);
      res.status(500).json({ error: "Failed to export expenses" });
    }
  });

  app.get("/api/expenses/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid expense ID" });
      }
      const userId = req.user.claims.sub;
      const expense = await storage.getExpense(id, userId);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const data = {
        ...req.body,
        date: new Date(req.body.date),
        userId,
      };
      const parsed = insertExpenseSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid expense data", details: parsed.error.errors });
      }
      const expense = await storage.createExpense(parsed.data);
      // Update streak and check badges (fire-and-forget, don't block response)
      storage.updateUserStreak(userId).catch(() => {});
      storage.checkAndUnlockBadges(userId).catch(() => {});
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid expense ID" });
      }
      const userId = req.user.claims.sub;
      const data = {
        ...req.body,
        ...(req.body.date && { date: new Date(req.body.date) }),
      };
      const parsed = insertExpenseSchema.partial().safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid expense data", details: parsed.error.errors });
      }
      const expense = await storage.updateExpense(id, userId, parsed.data);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid expense ID" });
      }
      const userId = req.user.claims.sub;
      await storage.deleteExpense(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  app.get("/api/analytics/category-spending", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const spending = await storage.getCategorySpending(userId);
      res.json(spending);
    } catch (error) {
      console.error("Error fetching category spending:", error);
      res.status(500).json({ error: "Failed to fetch category spending" });
    }
  });

  app.get("/api/analytics/spending-trend", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string)
        : new Date();
      
      const trend = await storage.getSpendingByPeriod(userId, startDate, endDate);
      res.json(trend);
    } catch (error) {
      console.error("Error fetching spending trend:", error);
      res.status(500).json({ error: "Failed to fetch spending trend" });
    }
  });

  app.get("/api/analytics/summary-stats", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getSummaryStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching summary stats:", error);
      res.status(500).json({ error: "Failed to fetch summary stats" });
    }
  });

  app.get("/api/analytics/monthly-comparison", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const comparison = await storage.getMonthlyComparison(userId);
      res.json(comparison);
    } catch (error) {
      console.error("Error fetching monthly comparison:", error);
      res.status(500).json({ error: "Failed to fetch monthly comparison" });
    }
  });

  app.get("/api/analytics/weekly-breakdown", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const breakdown = await storage.getWeeklyBreakdown(userId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching weekly breakdown:", error);
      res.status(500).json({ error: "Failed to fetch weekly breakdown" });
    }
  });

  app.get("/api/analytics/period-spending", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const view = req.query.view as string || "year";
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;

      let data;
      if (view === "day" && year && month) {
        data = await storage.getSpendingByDay(userId, year, month);
      } else if (view === "month" && year) {
        data = await storage.getSpendingByMonth(userId, year);
      } else {
        data = await storage.getSpendingByYear(userId);
      }

      res.json(data);
    } catch (error) {
      console.error("Error fetching period spending:", error);
      res.status(500).json({ error: "Failed to fetch period spending" });
    }
  });

  app.get("/api/analytics/annual-report", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const report = await storage.getAnnualReport(userId, year);
      res.json(report);
    } catch (error) {
      console.error("Error fetching annual report:", error);
      res.status(500).json({ error: "Failed to fetch annual report" });
    }
  });

  app.post("/api/analytics/email-report", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const emailReportSchema = z.object({
        email: z.string().email("Invalid email address"),
        year: z.number().int().min(2000).max(2100),
      });
      const parsed = emailReportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      const { year, email } = parsed.data;

      const user = await storage.getUser(userId);
      const report = await storage.getAnnualReport(userId, year);

      const currencySymbol = "PHP";
      let reportText = `Annual Expense Report - ${year}\n`;
      reportText += `${"=".repeat(50)}\n\n`;
      reportText += `Prepared for: ${user?.firstName || ''} ${user?.lastName || ''}\n`;
      reportText += `Total Spending: ${currencySymbol} ${report.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      reportText += `Total Transactions: ${report.transactionCount}\n\n`;

      reportText += `Spending by Category\n`;
      reportText += `${"-".repeat(40)}\n`;
      report.categoryTotals.forEach(cat => {
        const pct = report.grandTotal > 0 ? ((cat.total / report.grandTotal) * 100).toFixed(1) : '0.0';
        reportText += `${cat.name.padEnd(20)} ${currencySymbol} ${cat.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12)} (${pct}%)\n`;
      });

      reportText += `\nRecent Transactions (showing up to 50)\n`;
      reportText += `${"-".repeat(60)}\n`;
      report.expenses.slice(0, 50).forEach(exp => {
        const date = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        reportText += `${date.padEnd(10)} ${(exp.categoryName || 'Uncategorized').padEnd(15)} ${currencySymbol} ${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12)}  ${exp.description || ''}\n`;
      });

      if (report.expenses.length > 50) {
        reportText += `\n... and ${report.expenses.length - 50} more transactions\n`;
      }

      const mailtoSubject = encodeURIComponent(`Annual Expense Report - ${year}`);
      const mailtoBody = encodeURIComponent(reportText);

      res.json({
        success: true,
        report: reportText,
        mailto: `mailto:${email}?subject=${mailtoSubject}&body=${mailtoBody}`,
      });
    } catch (error) {
      console.error("Error generating email report:", error);
      res.status(500).json({ error: "Failed to generate email report" });
    }
  });

  const receiptScanSchema = z.object({
    image: z.string(),
  });

  app.post("/api/ai/recommendations", isAuthenticated, aiLimiter, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const expenses = await storage.getExpenses(userId);
      const categories = await storage.getCategories(userId);
      
      if (expenses.length === 0) {
        return res.json({
          analysis: "No expenses recorded yet. Start tracking your expenses to get personalized recommendations.",
          recommendations: [
            "Start by adding your daily expenses to build spending history",
            "Create categories that match your spending habits",
            "Set up a budget for each category to track your progress"
          ]
        });
      }

      const categoryMap = new Map(categories.map(c => [c.id, c.name]));
      const expenseSummary = expenses.map(e => ({
        amount: e.amount,
        currency: e.currency || "PHP",
        category: e.categoryId ? categoryMap.get(e.categoryId) || "Uncategorized" : "Uncategorized",
        date: e.date,
        description: e.description
      }));

      const totalByCategory: Record<string, number> = {};
      const totalByMonth: Record<string, number> = {};
      let grandTotal = 0;

      expenseSummary.forEach(e => {
        const amount = parseFloat(String(e.amount));
        grandTotal += amount;
        totalByCategory[e.category] = (totalByCategory[e.category] || 0) + amount;
        const month = new Date(e.date).toISOString().slice(0, 7);
        totalByMonth[month] = (totalByMonth[month] || 0) + amount;
      });

      const prompt = `You are a personal finance advisor. Analyze the following spending data and provide:
1. A brief analysis of spending trends (2-3 sentences)
2. Exactly 3 specific, actionable recommendations to reduce spending

User's expense data:
- Total expenses: ${grandTotal.toFixed(2)} PHP
- Number of transactions: ${expenses.length}
- Spending by category: ${JSON.stringify(totalByCategory)}
- Monthly spending: ${JSON.stringify(totalByMonth)}
- Recent expenses: ${JSON.stringify(expenseSummary.slice(0, 10))}

Respond in JSON format:
{
  "analysis": "Your spending analysis here",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Only respond with valid JSON, no additional text.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ error: "Failed to generate recommendations" });
      }

      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();

      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ error: "Failed to parse AI response" });
      }

      let recommendations;
      try {
        recommendations = JSON.parse(jsonMatch[0]);
      } catch {
        return res.status(500).json({ error: "Failed to parse AI response JSON" });
      }

      if (!recommendations.analysis || typeof recommendations.analysis !== "string") {
        recommendations.analysis = "Unable to generate analysis at this time.";
      }
      if (!Array.isArray(recommendations.recommendations) || recommendations.recommendations.length === 0) {
        recommendations.recommendations = [
          "Review your largest expense categories for savings opportunities",
          "Consider setting a monthly budget for discretionary spending",
          "Track expenses daily to identify spending patterns"
        ];
      }

      res.json(recommendations);
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  app.post("/api/receipt/scan", isAuthenticated, aiLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = receiptScanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { image } = parsed.data;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt image and extract the following information in JSON format:
{
  "merchant": "store/restaurant name",
  "amount": total amount as a number,
  "date": "YYYY-MM-DD format if visible, otherwise null",
  "items": ["list of items if visible"],
  "suggestedCategory": "one of: Food, Transportation, Shopping, Entertainment, Utilities, Healthcare, Other"
}

Only respond with valid JSON, no additional text.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ error: "Failed to parse receipt" });
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ error: "Failed to parse receipt response" });
      }

      const receiptData = JSON.parse(jsonMatch[0]);
      res.json(receiptData);
    } catch (error) {
      console.error("Error scanning receipt:", error);
      res.status(500).json({ error: "Failed to scan receipt" });
    }
  });

  const rateCache: { rates: Record<string, number>; base: string; timestamp: number } = {
    rates: {},
    base: "PHP",
    timestamp: 0,
  };
  const CACHE_DURATION = 60 * 60 * 1000;

  app.get("/api/exchange-rates", async (_req: any, res: Response) => {
    try {
      const now = Date.now();
      if (rateCache.timestamp > 0 && (now - rateCache.timestamp) < CACHE_DURATION && Object.keys(rateCache.rates).length > 0) {
        return res.json({ base: rateCache.base, rates: rateCache.rates, cached: true });
      }

      const response = await fetch("https://api.frankfurter.dev/v1/latest?base=PHP");
      if (!response.ok) {
        if (Object.keys(rateCache.rates).length > 0) {
          return res.json({ base: rateCache.base, rates: rateCache.rates, cached: true });
        }
        throw new Error("Failed to fetch exchange rates");
      }

      const data = await response.json();
      rateCache.rates = { PHP: 1, ...data.rates };
      rateCache.base = "PHP";
      rateCache.timestamp = now;

      res.json({ base: "PHP", rates: rateCache.rates });
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      if (Object.keys(rateCache.rates).length > 0) {
        return res.json({ base: rateCache.base, rates: rateCache.rates, cached: true });
      }
      const fallbackRates: Record<string, number> = {
        PHP: 1, USD: 0.0175, EUR: 0.0161, GBP: 0.0138,
        JPY: 2.62, CAD: 0.0245, AUD: 0.0272, CHF: 0.0155,
        CNY: 0.127, INR: 1.47, MXN: 0.356,
      };
      res.json({ base: "PHP", rates: fallbackRates, fallback: true });
    }
  });

  // Budget endpoints
  app.get("/api/budgets", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const budgetsList = await storage.getBudgets(userId);
      res.json(budgetsList);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });

  app.get("/api/budgets/progress", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getBudgetProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching budget progress:", error);
      res.status(500).json({ error: "Failed to fetch budget progress" });
    }
  });

  app.post("/api/budgets", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertBudgetSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid budget data", details: parsed.error.errors });
      }
      const budget = await storage.createBudget(parsed.data);
      res.status(201).json(budget);
    } catch (error: any) {
      if (error?.code === "23505") {
        return res.status(400).json({ error: "A budget already exists for this category" });
      }
      console.error("Error creating budget:", error);
      res.status(500).json({ error: "Failed to create budget" });
    }
  });

  app.put("/api/budgets/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid budget ID" });
      const userId = req.user.claims.sub;
      const budget = await storage.updateBudget(id, userId, req.body);
      if (!budget) return res.status(404).json({ error: "Budget not found" });
      res.json(budget);
    } catch (error) {
      console.error("Error updating budget:", error);
      res.status(500).json({ error: "Failed to update budget" });
    }
  });

  app.delete("/api/budgets/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid budget ID" });
      const userId = req.user.claims.sub;
      await storage.deleteBudget(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ error: "Failed to delete budget" });
    }
  });

  // Recurring expense endpoints
  app.get("/api/recurring-expenses", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const list = await storage.getRecurringExpenses(userId);
      res.json(list);
    } catch (error) {
      console.error("Error fetching recurring expenses:", error);
      res.status(500).json({ error: "Failed to fetch recurring expenses" });
    }
  });

  app.post("/api/recurring-expenses", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const data = { ...req.body, userId, startDate: new Date(req.body.startDate), endDate: req.body.endDate ? new Date(req.body.endDate) : null };
      const parsed = insertRecurringExpenseSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid recurring expense data", details: parsed.error.errors });
      }
      const created = await storage.createRecurringExpense(parsed.data);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating recurring expense:", error);
      res.status(500).json({ error: "Failed to create recurring expense" });
    }
  });

  app.put("/api/recurring-expenses/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const userId = req.user.claims.sub;
      const updated = await storage.updateRecurringExpense(id, userId, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating recurring expense:", error);
      res.status(500).json({ error: "Failed to update recurring expense" });
    }
  });

  app.delete("/api/recurring-expenses/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const userId = req.user.claims.sub;
      await storage.deleteRecurringExpense(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting recurring expense:", error);
      res.status(500).json({ error: "Failed to delete recurring expense" });
    }
  });

  app.post("/api/recurring-expenses/generate", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.generateDueRecurringExpenses(userId);
      res.json({ generated: count });
    } catch (error) {
      console.error("Error generating recurring expenses:", error);
      res.status(500).json({ error: "Failed to generate recurring expenses" });
    }
  });

  // Digest endpoints
  app.get("/api/digest/preferences", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const prefs = await storage.getDigestPreferences(userId);
      res.json(prefs || {
        enabled: false,
        frequency: "weekly",
        includeCategories: true,
        includeBudgetAlerts: true,
        includeTopMerchants: true,
        email: null,
      });
    } catch (error) {
      console.error("Error fetching digest preferences:", error);
      res.status(500).json({ error: "Failed to fetch digest preferences" });
    }
  });

  app.put("/api/digest/preferences", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertDigestPreferencesSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid digest preferences", details: parsed.error.errors });
      }
      const prefs = await storage.upsertDigestPreferences(userId, parsed.data);
      res.json(prefs);
    } catch (error) {
      console.error("Error updating digest preferences:", error);
      res.status(500).json({ error: "Failed to update digest preferences" });
    }
  });

  app.post("/api/digest/preview", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const options = req.body || {};
      const content = await storage.generateDigestContent(userId, {
        includeCategories: options.includeCategories !== false,
        includeBudgetAlerts: options.includeBudgetAlerts !== false,
        includeTopMerchants: options.includeTopMerchants !== false,
      });
      res.json(content);
    } catch (error) {
      console.error("Error generating digest preview:", error);
      res.status(500).json({ error: "Failed to generate digest preview" });
    }
  });

  app.post("/api/digest/send", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { email } = req.body;
      if (!email || !z.string().email().safeParse(email).success) {
        return res.status(400).json({ error: "Valid email address is required" });
      }

      const prefs = await storage.getDigestPreferences(userId);
      const content = await storage.generateDigestContent(userId, {
        includeCategories: prefs?.includeCategories !== false,
        includeBudgetAlerts: prefs?.includeBudgetAlerts !== false,
        includeTopMerchants: prefs?.includeTopMerchants !== false,
      });

      const user = await storage.getUser(userId);
      const frequency = prefs?.frequency || "weekly";
      const now = new Date();

      let digestText = `Your ${frequency === "daily" ? "Daily" : "Weekly"} Spending Digest\n`;
      digestText += `${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n`;
      digestText += `${"=".repeat(50)}\n\n`;

      // Summary
      digestText += `SPENDING SUMMARY\n`;
      digestText += `${"-".repeat(30)}\n`;
      digestText += `Total spent: PHP ${content.summary.totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      digestText += `Transactions: ${content.summary.transactionCount}\n`;
      digestText += `Average per day: PHP ${content.summary.avgPerDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      digestText += `Highest expense: PHP ${content.summary.highestExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;

      // Trend
      const trendArrow = content.trend.percentChange >= 0 ? "UP" : "DOWN";
      const trendPct = Math.abs(content.trend.percentChange).toFixed(1);
      digestText += `MONTHLY TREND\n`;
      digestText += `${"-".repeat(30)}\n`;
      digestText += `This month: PHP ${content.trend.currentMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      digestText += `Last month: PHP ${content.trend.previousMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      digestText += `Change: ${trendArrow} ${trendPct}%\n\n`;

      // Categories
      if (content.categories.length > 0) {
        digestText += `TOP CATEGORIES\n`;
        digestText += `${"-".repeat(30)}\n`;
        const catTotal = content.categories.reduce((s, c) => s + c.total, 0);
        content.categories.forEach(c => {
          const pct = catTotal > 0 ? ((c.total / catTotal) * 100).toFixed(1) : "0.0";
          digestText += `${c.name.padEnd(20)} PHP ${c.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12)} (${pct}%)\n`;
        });
        digestText += `\n`;
      }

      // Budget alerts
      if (content.budgetAlerts.length > 0) {
        digestText += `BUDGET ALERTS\n`;
        digestText += `${"-".repeat(30)}\n`;
        content.budgetAlerts.forEach(b => {
          const icon = b.percentage >= 100 ? "[OVER]" : "[WARN]";
          digestText += `${icon} ${b.categoryName}: PHP ${b.spent.toLocaleString(undefined, { minimumFractionDigits: 2 })} / PHP ${b.monthlyLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${b.percentage}%)\n`;
        });
        digestText += `\n`;
      }

      // Top merchants
      if (content.topMerchants.length > 0) {
        digestText += `TOP MERCHANTS\n`;
        digestText += `${"-".repeat(30)}\n`;
        content.topMerchants.forEach(m => {
          digestText += `${m.merchant.padEnd(20)} ${m.count} transactions, PHP ${m.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        });
        digestText += `\n`;
      }

      digestText += `---\nGenerated by ExpenseTracker\n`;

      const subject = encodeURIComponent(`Your ${frequency === "daily" ? "Daily" : "Weekly"} Spending Digest - ${now.toLocaleDateString()}`);
      const body = encodeURIComponent(digestText);

      // Update lastSentAt
      await storage.upsertDigestPreferences(userId, { lastSentAt: now } as any);

      res.json({
        success: true,
        digest: digestText,
        mailto: `mailto:${email}?subject=${subject}&body=${body}`,
      });
    } catch (error) {
      console.error("Error sending digest:", error);
      res.status(500).json({ error: "Failed to send digest" });
    }
  });

  // Savings Goals endpoints
  app.get("/api/goals", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getSavingsGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid goal ID" });
      const userId = req.user.claims.sub;
      const goal = await storage.getSavingsGoal(id, userId);
      if (!goal) return res.status(404).json({ error: "Goal not found" });
      res.json(goal);
    } catch (error) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check 10-goal limit
      const count = await storage.countSavingsGoals(userId);
      if (count >= 10) {
        return res.status(400).json({ error: "Maximum 10 goals reached" });
      }
      
      const data = {
        ...req.body,
        targetDate: new Date(req.body.targetDate),
        userId,
      };
      const parsed = insertSavingsGoalSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid goal data", details: parsed.error.errors });
      }
      const goal = await storage.createSavingsGoal(parsed.data);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.put("/api/goals/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid goal ID" });
      const userId = req.user.claims.sub;
      const data = {
        ...req.body,
        ...(req.body.targetDate && { targetDate: new Date(req.body.targetDate) }),
      };
      const goal = await storage.updateSavingsGoal(id, userId, data);
      if (!goal) return res.status(404).json({ error: "Goal not found" });
      res.json(goal);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid goal ID" });
      const userId = req.user.claims.sub;
      await storage.deleteSavingsGoal(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Goal Contributions (Story 2-2)
  app.get("/api/goals/:id/contributions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const goalId = parseInt(req.params.id);
      if (isNaN(goalId)) return res.status(400).json({ error: "Invalid goal ID" });
      const userId = req.user.claims.sub;
      const contributions = await storage.getGoalContributions(goalId, userId);
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ error: "Failed to fetch contributions" });
    }
  });

  app.post("/api/goals/:id/contributions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const goalId = parseInt(req.params.id);
      if (isNaN(goalId)) return res.status(400).json({ error: "Invalid goal ID" });
      const userId = req.user.claims.sub;
      const parsed = insertGoalContributionSchema.safeParse({ ...req.body, goalId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid contribution data", details: parsed.error.errors });
      }
      const contribution = await storage.createGoalContribution(parsed.data, userId);
      // Check badges after contribution
      await storage.checkAndUnlockBadges(userId);
      res.status(201).json(contribution);
    } catch (error: any) {
      if (error?.message === "Goal not found") return res.status(404).json({ error: "Goal not found" });
      console.error("Error creating contribution:", error);
      res.status(500).json({ error: "Failed to create contribution" });
    }
  });

  app.delete("/api/goals/:id/contributions/:contribId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const goalId = parseInt(req.params.id);
      const contribId = parseInt(req.params.contribId);
      if (isNaN(goalId) || isNaN(contribId)) return res.status(400).json({ error: "Invalid ID" });
      const userId = req.user.claims.sub;
      await storage.deleteGoalContribution(contribId, goalId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contribution:", error);
      res.status(500).json({ error: "Failed to delete contribution" });
    }
  });

  // Streak endpoints (Story 5-1)
  app.get("/api/streak", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getUserStreak(userId);
      res.json(streak || { currentStreak: 0, longestStreak: 0, lastExpenseDate: null, streakFreezesUsed: 0 });
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ error: "Failed to fetch streak" });
    }
  });

  // Badge endpoints (Story 5-2)
  app.get("/api/badges", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Natural Language Expense Parsing (Story 1-1)
  app.post("/api/expenses/parse-natural", isAuthenticated, aiLimiter, async (req: any, res: Response) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Text is required" });
      }
      const userId = req.user.claims.sub;
      const categories = await storage.getCategories(userId);
      const categoryList = categories.map(c => `${c.id}:${c.name}`).join(", ");

      const prompt = `Parse the following expense description and extract structured data.
Today's date is ${new Date().toISOString().split("T")[0]}.
Available categories: ${categoryList}

Text: "${text.trim()}"

Respond ONLY with a JSON object (no markdown) with these fields:
- amount: number (required, the expense amount)
- merchant: string (required, who/where the expense was at)
- description: string or null (optional details)
- categoryId: number or null (best matching category ID from the list, or null)
- date: string (ISO date YYYY-MM-DD, default to today if not mentioned)
- currency: string (3-letter code, default "PHP")
- confidence: number (0-100, how confident you are in the parse)

If you cannot find an amount, set confidence to 0 and amount to 0.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0,
      });

      const content = response.choices[0]?.message?.content || "{}";
      let parsed: any = {};
      try {
        parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
      } catch {
        return res.status(422).json({ error: "Could not parse the text. Please try being more specific." });
      }

      if (!parsed.amount || parsed.confidence < 40) {
        return res.status(422).json({ error: "Could not extract expense details. Try: 'Spent $45 at Starbucks on coffee'" });
      }

      res.json({
        amount: Number(parsed.amount),
        merchant: String(parsed.merchant || "Unknown"),
        description: parsed.description || null,
        categoryId: parsed.categoryId ? Number(parsed.categoryId) : null,
        date: parsed.date || new Date().toISOString().split("T")[0],
        currency: parsed.currency || "PHP",
        confidence: Number(parsed.confidence),
      });
    } catch (error) {
      console.error("Error parsing natural language:", error);
      res.status(500).json({ error: "Failed to parse expense" });
    }
  });

  // Expense Query Chat (Story 1-3)
  app.post("/api/chat/expense-query", isAuthenticated, aiLimiter, async (req: any, res: Response) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }
      const userId = req.user.claims.sub;

      const [summary, monthlyComparison, categorySpending] = await Promise.all([
        storage.getSummaryStats(userId),
        storage.getMonthlyComparison(userId),
        storage.getCategorySpending(userId),
      ]);

      const topCategories = categorySpending
        .filter(c => c.total > 0)
        .slice(0, 8)
        .map(c => `${c.name}: ₱${c.total.toFixed(2)}`)
        .join(", ");

      const contextStr = `User's expense summary:
- Total spending (all time): ₱${summary.totalSpending.toFixed(2)}
- This month: ₱${monthlyComparison.currentMonth.toFixed(2)}
- Last month: ₱${monthlyComparison.previousMonth.toFixed(2)} (${monthlyComparison.percentChange > 0 ? "+" : ""}${monthlyComparison.percentChange.toFixed(1)}% change)
- Transaction count: ${summary.transactionCount}
- Average per transaction: ₱${summary.avgPerTransaction.toFixed(2)}
- Top categories: ${topCategories || "No data yet"}
Today's date: ${new Date().toISOString().split("T")[0]}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful personal finance assistant for an expense tracker app. Answer the user's questions about their spending using the provided context. Be concise, helpful, and specific with numbers. If the user asks about something not in the context, say you don't have enough data. Never make up numbers.`,
          },
          { role: "user", content: `Context:\n${contextStr}\n\nUser question: ${message.trim()}` },
        ],
        max_tokens: 400,
        temperature: 0.3,
      });

      const reply = response.choices[0]?.message?.content || "I couldn't process your question. Please try again.";
      res.json({ reply });
    } catch (error) {
      console.error("Error processing chat query:", error);
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  return httpServer;
}
