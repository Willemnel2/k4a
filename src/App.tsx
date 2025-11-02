import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { isSupabaseConfigured } from './lib/supabase';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Orders from './pages/Orders';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0 2.21 1.79 4 4 4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect to Supabase</h1>
          <p className="text-gray-600 mb-6">
            To use this application, you need to connect to a Supabase database. 
            Click the "Connect to Supabase" button in the top right corner to get started.
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Once connected, you'll be able to manage clients, orders, and track your business operations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="ml-64 p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetails />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;