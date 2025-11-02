import React, { useState } from 'react';
import { Plus, Search, Calendar, DollarSign, Edit, Trash2, Filter, Package } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import OrderForm from '../components/OrderForm';

const Orders = () => {
  const { orders, loading, deleteOrder } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(id);
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-primary-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage all your orders</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first order to get started'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Create Your First Order
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Order</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Client</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Installation Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Amount</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div>
                        <h3 className="font-medium text-gray-900">{order.title}</h3>
                        <p className="text-sm text-gray-600">{order.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{order.client?.name}</p>
                        <p className="text-sm text-gray-600">{order.client?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(order.installation_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-gray-900 font-medium">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                        {order.total_amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showForm && (
        <OrderForm
          order={editingOrder}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Orders;