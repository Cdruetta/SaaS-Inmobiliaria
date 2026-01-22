import { useState } from 'react';
import api from '../services/api';

/**
 * Hook personalizado para operaciones CRUD de propiedades
 * Aplica el principio de Responsabilidad Única (SRP)
 */
export const usePropertyOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createProperty = async (propertyData) => {
    setLoading(true);
    setError(''); // Limpiar error antes de la operación

    try {
      const response = await api.post('/properties', propertyData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al crear la propiedad';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProperty = async (id, propertyData) => {
    setLoading(true);
    setError(''); // Limpiar error antes de la operación

    try {
      const response = await api.put(`/properties/${id}`, propertyData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar la propiedad';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id) => {
    setLoading(true);
    setError(''); // Limpiar error antes de la operación

    try {
      const response = await api.delete(`/properties/${id}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al eliminar la propiedad';
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
    createProperty,
    updateProperty,
    deleteProperty,

    // Utilidades
    clearError,
    hasError: error !== ''
  };
};