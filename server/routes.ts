import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertExpenseSchema } from "@shared/schema";
import { z } from "zod";
import { openai } from "./replit_integrations/image/client";
import { setupAuth, isAuthenticated } from "./replitAuth";

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
      const filters: { startDate?: Date; endDate?: Date; categoryId?: number } = {};
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.categoryId) {
        filters.categoryId = parseInt(req.query.categoryId as string);
      }
      
      const expenses = await storage.getExpenses(userId, Object.keys(filters).length > 0 ? filters : undefined);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch expenses" });
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
      const { year, email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email address is required" });
      }
      if (!year) {
        return res.status(400).json({ error: "Year is required" });
      }

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

  app.post("/api/ai/recommendations", isAuthenticated, async (req: any, res: Response) => {
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

  app.post("/api/receipt/scan", isAuthenticated, async (req: Request, res: Response) => {
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

  return httpServer;
}
