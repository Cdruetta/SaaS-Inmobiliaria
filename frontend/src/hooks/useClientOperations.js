import { useState } from 'react';
import api from '../services/api';

/**
 * Hook personalizado para operaciones CRUD de clientes
 * Aplica el principio de Responsabilidad Única (SRP)
 */
export const useClientOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createClient = async (clientData) => {
    setLoading(true);
    setError(''); // Limpiar error antes de la operación

    try {
      const response = await api.post('/clients', clientData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al crear el cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (id, clientData) => {
    setLoading(true);
    setError(''); // Limpiar error antes de la operación

    try {
      const response = await api.put(`/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar el cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id) => {
    setLoading(true);
    setError(''); // Limpiar error antes de la operación

    try {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al eliminar el cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError('');

  return {
    // Estado
    loading,
    error,

    // Operaciones CRUD
    createClient,
    updateClient,
    deleteClient,

    // Utilidades
    clearError,
    hasError: error !== ''
  };
};