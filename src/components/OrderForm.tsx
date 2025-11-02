import React, { useState, useEffect } from 'react';
import { X, Save, Calculator } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Order, Client } from '../types/database';

interface OrderFormProps {
  order?: Order | null;
  initialDate?: Date | null;
  onClose: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ order, initialDate, onClose }) => {
  const { clients, clientsLoading, addOrder, updateOrder } = useData();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    status: 'pending' as const,
    order_date: new Date().toISOString().split('T')[0],
    lead_time_days: 14,
    total_amount: '' as any,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setFormData({
        title: order.title,
        description: order.description,
        client_id: order.client_id,
        status: order.status,
        order_date: order.order_date.split('T')[0],
        lead_time_days: order.lead_time_days,
        total_amount: order.total_amount,
        notes: order.notes,
      });
    } else if (initialDate) {
      const orderDate = new Date();
      const installDate = new Date(initialDate);
      const leadTime = Math.max(1, Math.ceil((installDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      setFormData(prev => ({
        ...prev,
        lead_time_days: leadTime,
      }));
    }
  }, [order, initialDate]);

  const calculateInstallationDate = () => {
    const orderDate = new Date(formData.order_date);
    const installDate = new Date(orderDate);
    installDate.setDate(installDate.getDate() + formData.lead_time_days);
    return installDate.toISOString().split('T')[0];
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.client_id) newErrors.client_id = 'Client is required';
    if (formData.total_amount <= 0) newErrors.total_amount = 'Amount must be greater than 0';
    if (formData.lead_time_days < 1) newErrors.lead_time_days = 'Lead time must be at least 1 day';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    try {
      const orderData = {
        ...formData,
        installation_date: calculateInstallationDate(),
        reminder_sent: false,
      };

      if (order) {
        await updateOrder(order.id, orderData);
      } else {
        await addOrder(orderData);
      }
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save order. Please try again.';
      setError(errorMessage);
      console.error('Error saving order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {order ? 'Edit Order' : 'Create New Order'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="p-6 pt-3 pb-0">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Order Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Kitchen Cabinet Installation"
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
                Client * {clientsLoading && <span className="text-gray-500 text-xs">(loading...)</span>}
              </label>
              <select
                id="client_id"
                value={formData.client_id}
                onChange={(e) => handleInputChange('client_id', e.target.value)}
                disabled={clientsLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.client_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {clientsLoading ? 'Loading clients...' : 'Select a client'}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.client_id && <p className="text-red-600 text-sm mt-1">{errors.client_id}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Detailed description of the work to be done"
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="order_date" className="block text-sm font-medium text-gray-700 mb-2">
                Order Date *
              </label>
              <input
                type="date"
                id="order_date"
                value={formData.order_date}
                onChange={(e) => handleInputChange('order_date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="lead_time_days" className="block text-sm font-medium text-gray-700 mb-2">
                Lead Time (Days) *
              </label>
              <input
                type="number"
                id="lead_time_days"
                value={formData.lead_time_days}
                onChange={(e) => handleInputChange('lead_time_days', Number(e.target.value))}
                min="1"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                  errors.lead_time_days ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.lead_time_days && <p className="text-red-600 text-sm mt-1">{errors.lead_time_days}</p>}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-2">
              Total Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="total_amount"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                step="0.01"
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                  errors.total_amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.total_amount && <p className="text-red-600 text-sm mt-1">{errors.total_amount}</p>}
          </div>

          {/* Installation Date Preview */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calculator className="w-5 h-5 text-primary-600 mr-2" />
              <h3 className="font-medium text-blue-900">Installation Date Preview</h3>
            </div>
            <p className="text-primary-700">
              Based on the order date and lead time, installation is scheduled for:{' '}
              <span className="font-semibold">
                {new Date(calculateInstallationDate()).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Any special instructions or notes"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {order ? 'Update Order' : 'Create Order'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;