import { eq } from "drizzle-orm";
import { db } from "./db";
import { type User, type InsertUser, type TestItem, type InsertTestItem, users, testItems } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllTestItems(): Promise<TestItem[]>;
  getTestItem(id: number): Promise<TestItem | undefined>;
  createTestItem(item: InsertTestItem): Promise<TestItem>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllTestItems(): Promise<TestItem[]> {
    return await db.select().from(testItems);
  }

  async getTestItem(id: number): Promise<TestItem | undefined> {
    const result = await db.select().from(testItems).where(eq(testItems.id, id)).limit(1);
    return result[0];
  }

  async createTestItem(item: InsertTestItem): Promise<TestItem> {
    const result = await db.insert(testItems).values(item).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
