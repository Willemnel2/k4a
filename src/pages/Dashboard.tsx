import React from 'react';
import { Users, Package, Calendar, DollarSign, TrendingUp, Clock, Shield } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { clients, orders, loading, getUserName } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const upcomingOrders = orders.filter(order => {
    const installDate = new Date(order.installation_date);
    const today = new Date();
    const daysDiff = Math.ceil((installDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 7;
  });

  const overdue = orders.filter(order => {
    const installDate = new Date(order.installation_date);
    const today = new Date();
    return installDate < today && order.status !== 'completed';
  });

  // Admin-specific stats
  const uniqueUsers = isAdmin ? new Set(orders.map(order => order.user_id)).size : 0;

  // Group data by user for admin view
  const userStats = isAdmin ? (() => {
    const stats: Record<string, {
      userId: string;
      orders: typeof orders;
      clients: typeof clients;
      revenue: number;
    }> = {};

    orders.forEach(order => {
      if (!stats[order.user_id]) {
        stats[order.user_id] = {
          userId: order.user_id,
          orders: [],
          clients: [],
          revenue: 0
        };
      }
      stats[order.user_id].orders.push(order);
      stats[order.user_id].revenue += order.total_amount;
    });

    clients.forEach(client => {
      if (!stats[client.user_id]) {
        stats[client.user_id] = {
          userId: client.user_id,
          orders: [],
          clients: [],
          revenue: 0
        };
      }
      if (!stats[client.user_id].clients.find(c => c.id === client.id)) {
        stats[client.user_id].clients.push(client);
      }
    });

    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  })() : [];

  const stats = [
    {
      label: 'Total Clients',
      value: clients.length,
      icon: Users,
      color: 'bg-primary-500',
      textColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      label: 'Active Orders',
      value: orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length,
      icon: Package,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'This Week',
      value: upcomingOrders.length,
      icon: Calendar,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  // Add admin-specific stats
  if (isAdmin) {
    stats.push({
      label: 'Total Users',
      value: uniqueUsers,
      icon: Shield,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard {isAdmin && <span className="text-indigo-600 text-lg">(Admin View)</span>}
        </h1>
        <p className="text-gray-600 mt-2">{isAdmin ? 'System-wide overview of all business operations' : 'Overview of your business operations'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin: User Breakdown or Regular User Stats */}
      {isAdmin ? (
        <div className="space-y-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">User Breakdown</h2>
          </div>

          {userStats.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No user data available yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {userStats.map((stat) => (
                <div key={stat.userId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{getUserName(stat.userId)}</h3>
                        <p className="text-sm text-gray-500">{stat.orders.length} orders, {stat.clients.length} clients</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${stat.revenue.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Clients */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Users className="w-4 h-4 mr-2 text-primary-600" />
                        Clients ({stat.clients.length})
                      </h4>
                      {stat.clients.length === 0 ? (
                        <p className="text-sm text-gray-500">No clients</p>
                      ) : (
                        <div className="space-y-2">
                          {stat.clients.slice(0, 3).map((client) => (
                            <div key={client.id} className="text-sm">
                              <p className="font-medium text-gray-900">{client.name}</p>
                              <p className="text-gray-600">{client.email}</p>
                            </div>
                          ))}
                          {stat.clients.length > 3 && (
                            <p className="text-xs text-gray-500 font-medium">+{stat.clients.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Orders */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2 text-green-600" />
                        Orders ({stat.orders.length})
                      </h4>
                      {stat.orders.length === 0 ? (
                        <p className="text-sm text-gray-500">No orders</p>
                      ) : (
                        <div className="space-y-2">
                          {stat.orders.slice(0, 3).map((order) => (
                            <div key={order.id} className="text-sm">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900">{order.title}</p>
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'in_progress' ? 'bg-primary-100 text-blue-800' :
                                  order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-gray-600">${order.total_amount.toLocaleString()}</p>
                            </div>
                          ))}
                          {stat.orders.length > 3 && (
                            <p className="text-xs text-gray-500 font-medium">+{stat.orders.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Installations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Clock className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Installations</h2>
            </div>

            {upcomingOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No installations scheduled for this week</p>
            ) : (
              <div className="space-y-4">
                {upcomingOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{order.title}</h3>
                      <p className="text-sm text-gray-600">{order.client?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(order.installation_date).toLocaleDateString()}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        order.status === 'in_progress' ? 'bg-primary-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            </div>

            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{order.title}</h3>
                      <p className="text-sm text-gray-600">{order.client?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${order.total_amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
            <h3 className="text-lg font-semibold text-red-900">Overdue Installations</h3>
          </div>
          <div className="space-y-2">
            {overdue.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700">{order.title} - {order.client?.name}</span>
                <span className="text-red-600 font-medium">
                  Due: {new Date(order.installation_date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;