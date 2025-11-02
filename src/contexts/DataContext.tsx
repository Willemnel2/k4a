import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Client, Order, UserProfile } from '../types/database';

interface DataContextType {
  clients: Client[];
  orders: Order[];
  users: UserProfile[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client'>) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getUserName: (userId: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    if (!user || !isSupabaseConfigured || !supabase) return;

    try {
      setLoading(true);
      
      const isAdmin = user.role === 'admin';
      
      // Fetch clients
      let clientsQuery = supabase
        .from('clients')
        .select('*');
      
      if (!isAdmin) {
        clientsQuery = clientsQuery.eq('user_id', user.id);
      }
      
      const { data: clientsData, error: clientsError } = await clientsQuery
        .order('name');

      if (clientsError) throw clientsError;

      // Fetch orders with client information
      let ordersQuery = supabase
        .from('orders')
        .select(`
          *,
          client:clients(*)
        `);
      
      if (!isAdmin) {
        ordersQuery = ordersQuery.eq('user_id', user.id);
      }
      
      const { data: ordersData, error: ordersError } = await ordersQuery
        .order('installation_date');

      if (ordersError) throw ordersError;

      // Fetch all users if admin
      if (isAdmin) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .order('full_name');

        if (usersError) throw usersError;
        setUsers(usersData || []);
      }

      setClients(clientsData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  const addClient = async (clientData: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !isSupabaseConfigured || !supabase) return;

    const { error } = await supabase
      .from('clients')
      .insert([{ ...clientData, user_id: user.id }]);

    if (error) throw error;
    await refreshData();
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const { error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await refreshData();
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await refreshData();
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('orders')
      .insert([{ ...orderData, user_id: user.id }]);

    if (error) throw error;
    await refreshData();
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const { error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await refreshData();
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await refreshData();
  };

  const getUserName = (userId: string): string => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser && foundUser.full_name) {
      return foundUser.full_name;
    }
    return userId.slice(0, 8) + '...';
  };

  return (
    <DataContext.Provider value={{
      clients,
      orders,
      users,
      loading,
      refreshData,
      addClient,
      updateClient,
      deleteClient,
      addOrder,
      updateOrder,
      deleteOrder,
      getUserName,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}