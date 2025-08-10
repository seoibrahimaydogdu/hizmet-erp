import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  plan: string;
  satisfaction_score: number;
  total_tickets: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  performance_score: number;
  total_resolved: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  customer_id: string;
  agent_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  satisfaction_rating?: number;
  customers?: Customer;
  agents?: Agent;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  user_id?: string;
  created_at: string;
}

export interface SystemLog {
  id: string;
  action: string;
  user_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger_type: string;
  conditions: any;
  actions: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}