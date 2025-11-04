import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Calendar, Settings, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-primary-700 to-primary-800 shadow-lg">
      <div className="p-6 border-b border-primary-600">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-white rounded-lg p-2 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary-700" />
          </div>
          <h1 className="text-xl font-bold text-white">K4A Orders</h1>
        </div>
      </div>

      <div className="px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-accent-500 text-white shadow-md'
                  : 'text-primary-100 hover:bg-primary-600 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-4 right-4">
        <button
          onClick={signOut}
          className="flex items-center w-full px-4 py-3 text-primary-100 hover:bg-primary-600 hover:text-white rounded-lg transition-all duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;