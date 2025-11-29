import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseAdmin } from "./supabase";
import { insertTestItemSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/init-db", async (_req, res) => {
    try {
      const { error } = await supabaseAdmin.rpc('init_tables', {});
      
      if (error) {
        const createTablesSql = `
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS test_items (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        `;
        
        res.json({ 
          message: "Please run this SQL in Supabase Dashboard SQL Editor",
          sql: createTablesSql,
          note: "Tables need to be created manually in Supabase Dashboard"
        });
        return;
      }
      
      res.json({ message: "Tables initialized successfully" });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/test-items", async (_req, res) => {
    try {
      const items = await storage.getAllTestItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching test items:", error);
      res.status(500).json({ 
        error: "Failed to fetch test items", 
        details: error instanceof Error ? error.message : String(error) 
      });
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
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: "Invalid test item data" });
      } else {
        console.error("Error creating test item:", error);
        res.status(500).json({ 
          error: "Failed to create test item", 
          details: error instanceof Error ? error.message : String(error) 
        });
      }
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
