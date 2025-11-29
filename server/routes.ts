import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTestItemSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/test-items", async (_req, res) => {
    try {
      const items = await storage.getAllTestItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch test items" });
    }
  });

  app.get("/api/test-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getTestItem(id);
      if (!item) {
        return res.status(404).json({ error: "Test item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch test item" });
    }
  });

  app.post("/api/test-items", async (req, res) => {
    try {
      const data = insertTestItemSchema.parse(req.body);
      const item = await storage.createTestItem(data);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid test item data" });
    }
  });

  app.post("/api/seed", async (_req, res) => {
    try {
      const testData = [
        {
          title: "Первая тестовая запись",
          description: "Это первая запись в тестовой таблице",
        },
        {
          title: "Вторая тестовая запись",
          description: "Это вторая запись с описанием",
        },
        {
          title: "Третья запись",
          description: "Ещё одна тестовая запись для проверки",
        },
        {
          title: "Запись без описания",
          description: null,
        },
        {
          title: "Последняя тестовая запись",
          description: "Финальная запись в тестовом наборе данных",
        },
      ];

      const items = [];
      for (const data of testData) {
        const item = await storage.createTestItem(data);
        items.push(item);
      }

      res.json({ message: `Created ${items.length} test items`, items });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ error: "Failed to seed database", details: error instanceof Error ? error.message : String(error) });
    }
  });

  return httpServer;
}
