import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Hook personalizado para manejar propiedades
 * Aplica el principio de Responsabilidad Única (SRP)
 */
export const useProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    city: '',
    search: ''
  });

  const fetchProperties = useCallback(async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Agregar filtros a los parámetros
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/properties?${params}`);
      setProperties(response.data.properties || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      });
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Error al cargar las propiedades');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      type: '',
      status: '',
      minPrice: '',
      maxPrice: '',
      city: '',
      search: ''
    });
  }, []);

  // Efecto para cargar propiedades cuando cambian los filtros
  useEffect(() => {
    fetchProperties(1, filters);
  }, [fetchProperties, filters]);

  return {
    // Estado
    properties,
    loading,
    error,
    pagination,
    filters,

    // Acciones
    fetchProperties,
    updateFilters,
    resetFilters,

    // Utilidades
    hasProperties: properties.length > 0,
    isLoading: loading,
    hasError: error !== '',
    hasNextPage: pagination.page < pagination.pages,
    hasPrevPage: pagination.page > 1
  };
};