import React, { useState } from 'react';
import { X, Save, DollarSign } from 'lucide-react';
import type { Payment, Order } from '../types/database';

interface PaymentFormProps {
  order: Order;
  clientId: string;
  payment?: Payment | null;
  onClose: () => void;
  onSave: (paymentData: Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ order, clientId, payment, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    amount: payment?.amount || '',
    payment_date: payment?.payment_date.split('T')[0] || new Date().toISOString().split('T')[0],
    payment_method: payment?.payment_method || 'cash',
    reference_number: payment?.reference_number || '',
    notes: payment?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave({
        order_id: order.id,
        client_id: clientId,
        amount: Number(formData.amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number,
        notes: formData.notes,
      } as any);
      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {payment ? 'Edit Payment' : 'Record Payment'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 bg-primary-50 border-b border-primary-200">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-primary-600 mr-2" />
            <div>
              <p className="text-sm text-primary-600 font-medium">Order: {order.title}</p>
              <p className="text-xs text-primary-700">Total Amount: ${order.total_amount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value === '' ? '' : e.target.value }))}
                  min="0"
                  step="0.01"
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                id="payment_date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="reference_number" className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Transaction ref, check number, etc."
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Additional notes about this payment"
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
                  {payment ? 'Update Payment' : 'Record Payment'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
