import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

/**
 * Hook genérico y reutilizable para manejar datos con filtros, paginación y operaciones CRUD
 * Aplica el principio de Responsabilidad Única (SRP) y Open/Closed (OCP)
 *
 * @param {Object} config - Configuración del hook
 * @param {string} config.endpoint - Endpoint base de la API
 * @param {Object} config.initialFilters - Filtros iniciales
 * @param {number} config.initialPageSize - Tamaño de página inicial
 */
export const useDataManager = ({
  endpoint,
  initialFilters = {},
  initialPageSize = 10
}) => {
  // Estado principal
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialPageSize,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState(initialFilters);

  // Estado de operaciones CRUD
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState('');

  // Computed values
  const hasData = data.length > 0;
  const isLoading = loading;
  const hasError = error !== '';
  const hasNextPage = pagination.page < pagination.pages;
  const hasPrevPage = pagination.page > 1;

  // Fetch data con filtros y paginación
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Agregar filtros activos
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/${endpoint}?${params}`);

      setData(response.data[endpoint] || response.data.clients || response.data.properties || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: pagination.limit,
        total: 0,
        pages: 0
      });
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      setError(`Error al cargar los ${endpoint}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, pagination.limit, filters]);

  // Update filters and refetch
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Generic CRUD operations
  const createItem = useCallback(async (itemData) => {
    setOperationLoading(true);
    setOperationError('');

    try {
      const response = await api.post(`/${endpoint}`, itemData);
      // Refetch data to include the new item
      await fetchData(pagination.page);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || `Error al crear el ${endpoint.slice(0, -1)}`;
      setOperationError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setOperationLoading(false);
    }
  }, [endpoint, fetchData, pagination.page]);

  const updateItem = useCallback(async (id, itemData) => {
    setOperationLoading(true);
    setOperationError('');

    try {
      const response = await api.put(`/${endpoint}/${id}`, itemData);
      // Update local data
      setData(prev => prev.map(item => item.id === id ? { ...item, ...itemData } : item));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || `Error al actualizar el ${endpoint.slice(0, -1)}`;
      setOperationError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setOperationLoading(false);
    }
  }, [endpoint]);

  const deleteItem = useCallback(async (id) => {
    setOperationLoading(true);
    setOperationError('');

    try {
      const response = await api.delete(`/${endpoint}/${id}`);
      // Remove from local data
      setData(prev => prev.filter(item => item.id !== id));
      // Adjust pagination if necessary
      if (data.length === 1 && pagination.page > 1) {
        await fetchData(pagination.page - 1);
      } else {
        await fetchData(pagination.page);
      }
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || `Error al eliminar el ${endpoint.slice(0, -1)}`;
      setOperationError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setOperationLoading(false);
    }
  }, [endpoint, fetchData, pagination.page, data.length]);

  // Pagination helpers
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.pages) {
      fetchData(page);
    }
  }, [fetchData, pagination.pages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(pagination.page + 1);
    }
  }, [goToPage, hasNextPage, pagination.page]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      goToPage(pagination.page - 1);
    }
  }, [goToPage, hasPrevPage, pagination.page]);

  // Clear errors
  const clearError = useCallback(() => setError(''), []);
  const clearOperationError = useCallback(() => setOperationError(''), []);

  // Load initial data
  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  return {
    // Data state
    data,
    loading,
    error,
    pagination,
    filters,

    // Operation state
    operationLoading,
    operationError,

    // Computed values
    hasData,
    isLoading,
    hasError,
    hasNextPage,
    hasPrevPage,

    // Data operations
    fetchData,
    updateFilters,
    resetFilters,

    // CRUD operations
    createItem,
    updateItem,
    deleteItem,

    // Pagination
    goToPage,
    nextPage,
    prevPage,

    // Utilities
    clearError,
    clearOperationError
  };
};