import { useDataManager } from './useDataManager';

/**
 * Hook especializado para manejar propiedades
 * Usa el hook genérico useDataManager aplicando el principio DRY
 */
export const useProperties = () => {
  const dataManager = useDataManager({
    endpoint: 'properties',
    initialFilters: {
      type: '',
      status: '',
      minPrice: '',
      maxPrice: '',
      city: '',
      search: ''
    },
    initialPageSize: 10
  });

  // Alias para mantener compatibilidad con la API existente
  return {
    // Estado
    properties: dataManager.data,
    loading: dataManager.loading,
    error: dataManager.error,
    pagination: dataManager.pagination,
    filters: dataManager.filters,

    // Acciones
    fetchProperties: dataManager.fetchData,
    updateFilters: dataManager.updateFilters,
    resetFilters: dataManager.resetFilters,

    // Utilidades
    hasProperties: dataManager.hasData,
    isLoading: dataManager.isLoading,
    hasError: dataManager.hasError,
    hasNextPage: dataManager.hasNextPage,
    hasPrevPage: dataManager.hasPrevPage
  };
};