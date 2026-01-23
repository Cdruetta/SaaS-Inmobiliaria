import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Save, DollarSign, Building, User } from 'lucide-react';

const TransactionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    type: 'SALE',
    amount: '',
    commission: '',
    notes: '',
    propertyId: '',
    clientId: ''
  });

  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties();
    fetchClients();
    if (isEditing && id) {
      fetchTransaction();
    }
  }, [id, isEditing]);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/api/properties?limit=100');
      setProperties(response.data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients?limit=100');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/transactions/${id}`);
      const transaction = response.data.transaction;

      setFormData({
        type: transaction.type || 'SALE',
        amount: transaction.amount?.toString() || '',
        commission: transaction.commission?.toString() || '',
        notes: transaction.notes || '',
        propertyId: transaction.propertyId || '',
        clientId: transaction.clientId || ''
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setError('Error al cargar la transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.type) {
      setError('El tipo de transacción es requerido');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('El monto debe ser mayor a 0');
      return false;
    }
    if (!formData.propertyId) {
      setError('Debe seleccionar una propiedad');
      return false;
    }
    if (!formData.clientId) {
      setError('Debe seleccionar un cliente');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        commission: formData.commission ? parseFloat(formData.commission) : undefined
      };

      if (isEditing) {
        await api.put(`/api/transactions/${id}`, submitData);
      } else {
        await api.post('/api/transactions', submitData);
      }

      navigate('/transactions');
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError(error.response?.data?.error || 'Error al guardar la transacción');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
      <div className="mb-8">
        <button
          onClick={() => navigate('/transactions')}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a Transacciones
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEditing ? 'Modifica la información de la transacción' : 'Registra una nueva transacción inmobiliaria'}
        </p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Tipo de transacción */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Transacción *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="SALE">Venta</option>
                  <option value="RENTAL">Alquiler</option>
                  <option value="LEASE">Arrendamiento</option>
                </select>
              </div>

              {/* Monto */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Monto *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Comisión */}
              <div>
                <label htmlFor="commission" className="block text-sm font-medium text-gray-700 mb-1">
                  Comisión (opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="commission"
                    name="commission"
                    value={formData.commission}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Propiedad */}
              <div>
                <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Propiedad *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="propertyId"
                    name="propertyId"
                    value={formData.propertyId}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Seleccionar propiedad...</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title} - {property.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cliente */}
              <div className="sm:col-span-2">
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="clientId"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notas */}
              <div className="sm:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Notas adicionales sobre la transacción..."
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Guardando...' : 'Guardar Transacción'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default TransactionForm;
