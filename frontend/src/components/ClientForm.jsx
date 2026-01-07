import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const ClientForm = ({ clientId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  // Cargar datos existentes si es edición
  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clients/${clientId}`);
      const client = response.data.client;

      // Guardar datos originales para comparación
      setOriginalData(client);

      // Llenar formulario con datos existentes
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || ''
      });
    } catch (error) {
      console.error('Error cargando cliente:', error);
      toast.error('Error al cargar el cliente');
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
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
        toast.error('Nombre, apellido y email son obligatorios');
        return;
      }

      let response;
      if (clientId) {
        // Actualizar cliente existente - solo enviar campos modificados
        const changedFields = getChangedFields();

        // Si no hay cambios, no enviar nada
        if (Object.keys(changedFields).length === 0) {
          toast.info('No se detectaron cambios');
          return;
        }

        console.log('Campos que se van a actualizar:', changedFields);
        response = await api.put(`/clients/${clientId}`, changedFields);
      } else {
        // Crear nuevo cliente - enviar todos los campos
        response = await api.post('/clients', {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null
        });
      }

      if (onSuccess) {
        onSuccess(response.data.client);
      }

      toast.success(clientId ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente');

    } catch (error) {
      console.error('Error guardando cliente:', error);
      toast.error(error.response?.data?.error || 'Error al guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando cliente...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {clientId ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
        </div>


        <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Apellido del cliente"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="cliente@email.com"
            required
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+54 11 1234-5678"
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Dirección completa del cliente"
          />
        </div>

        {/* Información de cambios (solo en modo edición) */}
        {clientId && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              💡 <strong>Solo se actualizarán los campos modificados.</strong>
              <br />
              Los campos vacíos se mantendrán sin cambios.
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {saving ? 'Guardando...' : (clientId ? 'Actualizar Cliente' : 'Crear Cliente')}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default ClientForm;
