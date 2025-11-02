import React, { useState } from 'react';
import { Plus, Search, Mail, Phone, MapPin, Edit, Trash2, Users, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import ClientForm from '../components/ClientForm';

const Clients = () => {
  const navigate = useNavigate();
  const { clients, loading, deleteClient } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(id);
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClient(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-2">Manage your client information</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first client'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Add Your First Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                    title="View Details & Payments"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-sm">{client.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-sm">{client.phone}</span>
                </div>
                <div className="flex items-start text-gray-600">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                  <span className="text-sm">{client.address}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Added {new Date(client.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Form Modal */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Clients;