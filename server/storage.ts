import { supabaseAdmin } from "./supabase";
import { type User, type InsertUser, type TestItem, type InsertTestItem } from "@shared/schema";

type SupabaseTestItem = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
};

function mapTestItem(item: SupabaseTestItem): TestItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    createdAt: new Date(item.created_at),
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllTestItems(): Promise<TestItem[]>;
  getTestItem(id: number): Promise<TestItem | undefined>;
  createTestItem(item: InsertTestItem): Promise<TestItem>;
}

export class SupabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as User;
  }

  async getAllTestItems(): Promise<TestItem[]> {
    const { data, error } = await supabaseAdmin
      .from('test_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return (data || []).map(mapTestItem);
  }

  async getTestItem(id: number): Promise<TestItem | undefined> {
    const { data, error } = await supabaseAdmin
      .from('test_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return mapTestItem(data);
  }

  async createTestItem(item: InsertTestItem): Promise<TestItem> {
    const { data, error } = await supabaseAdmin
      .from('test_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return mapTestItem(data);
  }
}

export const storage = new SupabaseStorage();
