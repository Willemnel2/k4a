export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string;
          address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone: string;
          address: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          title: string;
          description: string;
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          order_date: string;
          installation_date: string;
          lead_time_days: number;
          total_amount: number;
          notes: string;
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          title: string;
          description: string;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          order_date: string;
          installation_date: string;
          lead_time_days: number;
          total_amount: number;
          notes?: string;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          title?: string;
          description?: string;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          order_date?: string;
          installation_date?: string;
          lead_time_days?: number;
          total_amount?: number;
          notes?: string;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  order_date: string;
  installation_date: string;
  lead_time_days: number;
  total_amount: number;
  notes: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface UserProfile {
  id: string;
  email?: string;
  role?: 'admin' | 'manager' | 'user';
  full_name?: string;
}