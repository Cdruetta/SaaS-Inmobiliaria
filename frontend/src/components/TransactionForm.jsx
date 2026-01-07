import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const TransactionForm = ({ transactionId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    type: 'SALE',
    amount: '',
    commission: '',
    notes: '',
    propertyId: '',
    clientId: '',
    status: 'PENDING'
  });

  // Cargar datos existentes y listas
  useEffect(() => {
    loadData();
    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  const loadData = async () => {
    try {
      // Cargar propiedades disponibles
      const propertiesRes = await api.get('/properties');
      setProperties(propertiesRes.data.properties);

      // Cargar clientes disponibles
      const clientsRes = await api.get('/clients');
      setClients(clientsRes.data.clients);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/transactions/${transactionId}`);
      const transaction = response.data;

      // Guardar datos originales para comparación
      setOriginalData(transaction);

      // Llenar formulario con datos existentes
      setFormData({
        type: transaction.type || 'SALE',
        amount: transaction.amount || '',
        commission: transaction.commission || '',
        notes: transaction.notes || '',
        propertyId: transaction.propertyId || '',
        clientId: transaction.clientId || '',
        status: transaction.status || 'PENDING'
      });
    } catch (error) {
      console.error('Error cargando transacción:', error);
      toast.error('Error al cargar la transacción');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para determinar qué campos cambiaron
  const getChangedFields = () => {
    const changes = {};

    Object.keys(formData).forEach(key => {
      const currentValue = formData[key];
      const originalValue = originalData ? originalData[key] : '';

      // Convertir valores para comparación consistente
      const normalizedCurrent = currentValue === '' ? null : currentValue;
      const normalizedOriginal = originalValue === '' || originalValue === undefined ? null : originalValue;

      // Solo incluir si el valor cambió
      if (normalizedCurrent !== normalizedOriginal) {
        // Para campos vacíos, enviar null en lugar de string vacío
        changes[key] = normalizedCurrent === '' ? null : currentValue;
      }
    });

    return changes;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Validaciones básicas
      if (!formData.propertyId || !formData.clientId || !formData.amount) {
        toast.error('Propiedad, cliente y monto son obligatorios');
        return;
      }

      let response;
      if (transactionId) {
        // Actualizar transacción existente - solo enviar campos modificados
        const changedFields = getChangedFields();

        // Si no hay cambios, no enviar nada
        if (Object.keys(changedFields).length === 0) {
          toast.info('No se detectaron cambios');
          return;
        }

        console.log('Campos que se van a actualizar:', changedFields);
        response = await api.put(`/transactions/${transactionId}`, changedFields);
      } else {
        // Crear nueva transacción - enviar todos los campos requeridos
        const transactionData = {
          type: formData.type,
          amount: parseFloat(formData.amount),
          commission: formData.commission ? parseFloat(formData.commission) : null,
          notes: formData.notes.trim() || null,
          propertyId: formData.propertyId,
          clientId: formData.clientId
        };

        response = await api.post('/transactions', transactionData);
      }

      if (onSuccess) {
        onSuccess(response.data.transaction);
      }

      toast.success(transactionId ? 'Transacción actualizada exitosamente' : 'Transacción creada exitosamente');

    } catch (error) {
      console.error('Error guardando transacción:', error);
      toast.error(error.response?.data?.error || 'Error al guardar la transacción');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando transacción...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {transactionId ? 'Editar Transacción' : 'Nueva Transacción'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Propiedad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Propiedad *
          </label>
          <select
            value={formData.propertyId}
            onChange={(e) => handleChange('propertyId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar propiedad</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.title} - {property.address} (${property.price.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente *
          </label>
          <select
            value={formData.clientId}
            onChange={(e) => handleChange('clientId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar cliente</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName} - {client.email}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo y Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="SALE">Venta</option>
              <option value="RENTAL">Alquiler</option>
            </select>
          </div>

          {transactionId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PENDING">Pendiente</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
          )}
        </div>

        {/* Monto y Comisión */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comisión
            </label>
            <input
              type="number"
              value={formData.commission}
              onChange={(e) => handleChange('commission', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detalles adicionales de la transacción..."
          />
        </div>

        {/* Información de cambios (solo en modo edición) */}
        {transactionId && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              💡 <strong>Solo se actualizarán los campos modificados.</strong>
              <br />
              Los campos vacíos se mantendrán sin cambios.
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : (transactionId ? 'Actualizar Transacción' : 'Crear Transacción')}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
      </div>
    </div>
  );
};

export default TransactionForm;
