import React from 'react';
import { Package, DollarSign, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { orders, payments, loading, getUserName, getTotalPaid, getOutstandingAmount } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOutstanding = orders.reduce((sum, order) => sum + getOutstandingAmount(order.id), 0);
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;

  const overdue = orders.filter(order => {
    const installDate = new Date(order.installation_date);
    const today = new Date();
    return installDate < today && order.status !== 'completed';
  });

  // Calculate monthly sales per user
  const getMonthlySalesPerUser = () => {
    const monthlyData: Record<string, Record<string, number>> = {};

    orders.forEach(order => {
      const date = new Date(order.order_date);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const userId = order.user_id;

      if (!monthlyData[userId]) {
        monthlyData[userId] = {};
      }
      if (!monthlyData[userId][yearMonth]) {
        monthlyData[userId][yearMonth] = 0;
      }
      monthlyData[userId][yearMonth] += order.total_amount;
    });

    return monthlyData;
  };

  const monthlySalesData = getMonthlySalesPerUser();

  // Get outstanding orders
  const outstandingOrders = orders
    .map(order => ({
      ...order,
      totalPaid: getTotalPaid(order.id),
      outstanding: getOutstandingAmount(order.id),
    }))
    .filter(order => order.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);

  const stats = [
    {
      label: 'Active Orders',
      value: activeOrders,
      icon: Package,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Outstanding',
      value: `$${totalOutstanding.toLocaleString()}`,
      icon: AlertCircle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard {isAdmin && <span className="text-blue-600 text-lg">(Admin View)</span>}
        </h1>
        <p className="text-gray-600 mt-2">{isAdmin ? 'System-wide financial overview' : 'Your financial overview'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Monthly Sales Per User (Admin Only) */}
      {isAdmin && Object.keys(monthlySalesData).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Monthly Sales Per User</h2>
          </div>

          <div className="space-y-4">
            {Object.entries(monthlySalesData)
              .map(([userId, months]) => {
                const monthsArray = Object.entries(months)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 6);

                return (
                  <div key={userId} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{getUserName(userId)}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {monthsArray.map(([month, sales]) => (
                        <div key={`${userId}-${month}`} className="bg-blue-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1">
                            {new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                          </p>
                          <p className="text-lg font-bold text-blue-600">${(sales).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
              .sort((a, b) => {
                const aTotal = Object.values(monthlySalesData[a.key as unknown as string]).reduce((s: any, v: any) => s + v, 0);
                const bTotal = Object.values(monthlySalesData[b.key as unknown as string]).reduce((s: any, v: any) => s + v, 0);
                return bTotal - aTotal;
              })}
          </div>
        </div>
      )}

      {/* Amounts Outstanding */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Amounts Outstanding</h2>
        </div>

        {outstandingOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No outstanding orders</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Order</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                  {isAdmin && <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>}
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Paid</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {outstandingOrders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{order.title}</td>
                    <td className="py-3 px-4 text-gray-600">{order.client?.name}</td>
                    {isAdmin && <td className="py-3 px-4 text-gray-600">{getUserName(order.user_id)}</td>}
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">${order.total_amount.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-green-600 font-medium">${order.totalPaid.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 font-bold">
                      <span className={order.outstanding > order.total_amount * 0.5 ? 'text-red-600' : 'text-orange-600'}>
                        ${order.outstanding.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {outstandingOrders.length > 10 && (
              <div className="text-center py-4 text-gray-600 text-sm">
                +{outstandingOrders.length - 10} more outstanding orders
              </div>
            )}
          </div>
        )}
      </div>

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