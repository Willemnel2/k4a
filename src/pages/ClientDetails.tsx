import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Package, DollarSign, Plus, Trash2, Calendar, CreditCard } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PaymentForm from '../components/PaymentForm';
import type { Payment, Order } from '../types/database';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clients, orders } = useData();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const client = clients.find(c => c.id === id);
  const clientOrders = orders.filter(o => o.client_id === id);

  const fetchPayments = useCallback(async () => {
    if (!user || !id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const isAdmin = user.role === 'admin';

      let query = supabase
        .from('payments')
        .select('*')
        .eq('client_id', id);

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleAddPayment = (order: Order) => {
    setSelectedOrder(order);
    setSelectedPayment(null);
    setShowPaymentForm(true);
  };

  const handleSavePayment = async (paymentData: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('payments')
        .insert([{ ...paymentData, user_id: user.id }]);

      if (error) throw error;
      await fetchPayments();
    } catch (error) {
      console.error('Error saving payment:', error);
      throw error;
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;
      await fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const getOrderPayments = (orderId: string) => {
    return payments.filter(p => p.order_id === orderId);
  };

  const getTotalPaid = (orderId: string) => {
    return getOrderPayments(orderId).reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const getBalance = (order: Order) => {
    return order.total_amount - getTotalPaid(order.id);
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Client not found</p>
          <button
            onClick={() => navigate('/clients')}
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/clients')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-1">Client Details & Payment History</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <Mail className="w-5 h-5 text-primary-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{client.email}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Phone className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{client.phone}</p>
            </div>
          </div>
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium text-gray-900">{client.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Orders & Payments</h2>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : clientOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No orders found for this client</p>
          </div>
        ) : (
          <div className="space-y-6">
            {clientOrders.map((order) => {
              const orderPayments = getOrderPayments(order.id);
              const totalPaid = getTotalPaid(order.id);
              const balance = getBalance(order);
              const isPaidInFull = balance <= 0;

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className={`p-6 ${isPaidInFull ? 'bg-green-50 border-b border-green-200' : 'bg-gray-50 border-b border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{order.title}</h3>
                          <span className={`ml-3 inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'in_progress' ? 'bg-primary-100 text-blue-800' :
                            order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{order.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Installation: {new Date(order.installation_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">${order.total_amount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-white">
                        <p className="text-xs text-gray-600 mb-1">Total Paid</p>
                        <p className="text-lg font-bold text-green-600">${totalPaid.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white">
                        <p className="text-xs text-gray-600 mb-1">Balance Due</p>
                        <p className={`text-lg font-bold ${isPaidInFull ? 'text-green-600' : 'text-red-600'}`}>
                          ${balance.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white">
                        <p className="text-xs text-gray-600 mb-1">Payments</p>
                        <p className="text-lg font-bold text-gray-900">{orderPayments.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-primary-600" />
                        Payment History
                      </h4>
                      <button
                        onClick={() => handleAddPayment(order)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold flex items-center transition-colors duration-200"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment
                      </button>
                    </div>

                    {orderPayments.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No payments recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orderPayments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <span className="font-semibold text-gray-900">${Number(payment.amount).toLocaleString()}</span>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className="text-sm text-gray-600 capitalize">{payment.payment_method.replace('_', ' ')}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                                {payment.reference_number && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span>Ref: {payment.reference_number}</span>
                                  </>
                                )}
                              </div>
                              {payment.notes && (
                                <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPaymentForm && selectedOrder && (
        <PaymentForm
          order={selectedOrder}
          clientId={client.id}
          payment={selectedPayment}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedOrder(null);
            setSelectedPayment(null);
          }}
          onSave={handleSavePayment}
        />
      )}
    </div>
  );
};

export default ClientDetails;
