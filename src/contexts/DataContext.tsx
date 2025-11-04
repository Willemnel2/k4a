import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Client, Order, UserProfile, Payment } from '../types/database';

interface DataContextType {
  clients: Client[];
  orders: Order[];
  payments: Payment[];
  users: UserProfile[];
  loading: boolean;
  clientsLoading: boolean;
  ordersLoading: boolean;
  refreshData: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client'>) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  getTotalPaid: (orderId: string) => number;
  getOutstandingAmount: (orderId: string) => number;
  getUserName: (userId: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const refreshInProgress = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const refreshData = useCallback(async () => {
    if (!userRef.current || !isSupabaseConfigured || !supabase) return;
    if (refreshInProgress.current) return;

    try {
      refreshInProgress.current = true;
      setLoading(true);

      const isAdmin = userRef.current.role === 'admin';

      // Fetch clients
      setClientsLoading(true);
      let clientsQuery = supabase
        .from('clients')
        .select('*');

      if (!isAdmin) {
        clientsQuery = clientsQuery.eq('user_id', userRef.current.id);
      }

      const { data: clientsData, error: clientsError } = await clientsQuery
        .order('name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);
      setClientsLoading(false);

      // Fetch orders with client information
      setOrdersLoading(true);
      let ordersQuery = supabase
        .from('orders')
        .select(`
          *,
          client:clients(*)
        `);

      if (!isAdmin) {
        ordersQuery = ordersQuery.eq('user_id', userRef.current.id);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery
        .order('installation_date');

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
      setOrdersLoading(false);

      // Fetch payments
      let paymentsQuery = supabase
        .from('payments')
        .select('*');

      if (!isAdmin) {
        paymentsQuery = paymentsQuery.eq('user_id', userRef.current.id);
      }

      const { data: paymentsData, error: paymentsError } = await paymentsQuery
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Fetch all users if admin
      if (isAdmin) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .order('full_name');

        if (usersError) throw usersError;
        setUsers(usersData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setClientsLoading(false);
      setOrdersLoading(false);
    } finally {
      setLoading(false);
      refreshInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user?.id, refreshData]);

  const addClient = async (clientData: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !isSupabaseConfigured || !supabase) return;

    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...clientData, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;

    // Optimistically update the clients list
    setClients(prev => [...prev, data]);
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const { error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    // Optimistically update the clients list
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Optimistically update the clients list
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .insert([{ ...orderData, user_id: user.id }])
      .select(`
        *,
        client:clients(*)
      `)
      .single();

    if (error) throw error;

    // Optimistically update the orders list
    setOrders(prev => [...prev, data]);
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const { error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    // Optimistically update the orders list
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Optimistically update the orders list
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;

    setPayments(prev => [data, ...prev]);
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    const { error } = await supabase
      .from('payments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePayment = async (id: string) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const getTotalPaid = (orderId: string): number => {
    return payments
      .filter(p => p.order_id === orderId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getOutstandingAmount = (orderId: string): number => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return 0;
    const totalPaid = getTotalPaid(orderId);
    return Math.max(0, order.total_amount - totalPaid);
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
      payments,
      users,
      loading,
      clientsLoading,
      ordersLoading,
      refreshData,
      addClient,
      updateClient,
      deleteClient,
      addOrder,
      updateOrder,
      deleteOrder,
      addPayment,
      updatePayment,
      deletePayment,
      getTotalPaid,
      getOutstandingAmount,
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