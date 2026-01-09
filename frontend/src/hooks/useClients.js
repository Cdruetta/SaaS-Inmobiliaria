import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Hook personalizado para manejar clientes
 * Aplica el principio de Responsabilidad Única (SRP)
 */
export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: ''
  });

  const fetchClients = useCallback(async (page = 1, searchFilter = '') => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Agregar filtros a los parámetros
      if (searchFilter) {
        params.append('search', searchFilter);
      }

      const response = await api.get(`/clients?${params}`);
      setClients(response.data.clients || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Error al cargar los clientes');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: ''
    });
  }, []);

  // Efecto para cargar clientes al montar
  useEffect(() => {
    fetchClients(1, filters.search);
  }, []); // Solo al montar

  return {
    // Estado
    clients,
    loading,
    error,
    pagination,
    filters,

    // Acciones
    fetchClients,
    updateFilters,
    resetFilters,

    // Utilidades
    hasClients: clients.length > 0,
    isLoading: loading,
    hasError: error !== '',
    hasNextPage: pagination.page < pagination.pages,
    hasPrevPage: pagination.page > 1
  };
};