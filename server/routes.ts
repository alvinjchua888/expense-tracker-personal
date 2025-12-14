import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertExpenseSchema } from "@shared/schema";
import { z } from "zod";
import { openai } from "./replit_integrations/image/client";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Categories CRUD
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const parsed = insertCategorySchema.safeParse(req.body);
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

  app.put("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const parsed = insertCategorySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid category data", details: parsed.error.errors });
      }
      const category = await storage.updateCategory(id, parsed.data);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Expenses CRUD
  app.get("/api/expenses", async (req: Request, res: Response) => {
    try {
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
      
      const expenses = await storage.getExpenses(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid expense ID" });
      }
      const expense = await storage.getExpense(id);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const data = {
        ...req.body,
        date: new Date(req.body.date),
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

  app.put("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid expense ID" });
      }
      const data = {
        ...req.body,
        ...(req.body.date && { date: new Date(req.body.date) }),
      };
      const parsed = insertExpenseSchema.partial().safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid expense data", details: parsed.error.errors });
      }
      const expense = await storage.updateExpense(id, parsed.data);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid expense ID" });
      }
      await storage.deleteExpense(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/category-spending", async (req: Request, res: Response) => {
    try {
      const spending = await storage.getCategorySpending();
      res.json(spending);
    } catch (error) {
      console.error("Error fetching category spending:", error);
      res.status(500).json({ error: "Failed to fetch category spending" });
    }
  });

  app.get("/api/analytics/spending-trend", async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string)
        : new Date();
      
      const trend = await storage.getSpendingByPeriod(startDate, endDate);
      res.json(trend);
    } catch (error) {
      console.error("Error fetching spending trend:", error);
      res.status(500).json({ error: "Failed to fetch spending trend" });
    }
  });

  // Receipt scanning with OpenAI Vision
  const receiptScanSchema = z.object({
    image: z.string(), // base64 encoded image
  });

  app.post("/api/receipt/scan", async (req: Request, res: Response) => {
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

      // Parse the JSON response
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
