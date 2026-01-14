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
      const filters: { startDate?: Date; endDate?: Date; categoryId?: number; page?: number; limit?: number } = {};

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.categoryId) {
        filters.categoryId = parseInt(req.query.categoryId as string);
      }
      if (req.query.page) {
        filters.page = parseInt(req.query.page as string);
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string);
      }

      const result = await storage.getExpenses(userId, Object.keys(filters).length > 0 ? filters : undefined);

      if (filters.page && filters.limit) {
        res.json({
          expenses: result.expenses,
          total: result.total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(result.total / filters.limit),
        });
      } else {
        res.json(result.expenses);
      }
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

  app.post("/api/expenses/bulk-delete", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid expense IDs" });
      }

      const numericIds = ids.map((id: string | number) => parseInt(id.toString())).filter((id: number) => !isNaN(id));
      const deletedCount = await storage.deleteExpenses(numericIds, userId);

      res.json({ deleted: deletedCount });
    } catch (error) {
      console.error("Error bulk deleting expenses:", error);
      res.status(500).json({ error: "Failed to bulk delete expenses" });
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

  app.get("/api/analytics/merchant-spending", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const spending = await storage.getMerchantSpending(userId, startDate, endDate, limit);
      res.json(spending);
    } catch (error) {
      console.error("Error fetching merchant spending:", error);
      res.status(500).json({ error: "Failed to fetch merchant spending" });
    }
  });

  app.get("/api/analytics/day-of-week-spending", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const spending = await storage.getDayOfWeekSpending(userId, startDate, endDate);
      res.json(spending);
    } catch (error) {
      console.error("Error fetching day of week spending:", error);
      res.status(500).json({ error: "Failed to fetch day of week spending" });
    }
  });

  app.get("/api/analytics/spending-forecast", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const forecast = await storage.getSpendingForecast(userId);
      res.json(forecast);
    } catch (error) {
      console.error("Error fetching spending forecast:", error);
      res.status(500).json({ error: "Failed to fetch spending forecast" });
    }
  });

  const receiptScanSchema = z.object({
    image: z.string(),
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
