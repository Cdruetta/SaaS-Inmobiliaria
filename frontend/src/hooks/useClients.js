import { useDataManager } from './useDataManager';

/**
 * Hook especializado para manejar clientes
 * Usa el hook genérico useDataManager aplicando el principio DRY
 */
export const useClients = () => {
  const dataManager = useDataManager({
    endpoint: 'clients',
    initialFilters: { search: '' },
    initialPageSize: 10
  });

  // Alias para mantener compatibilidad con la API existente
  return {
    // Estado
    clients: dataManager.data,
    loading: dataManager.loading,
    error: dataManager.error,
    pagination: dataManager.pagination,
    filters: dataManager.filters,

    // Acciones
    fetchClients: dataManager.fetchData,
    updateFilters: dataManager.updateFilters,
    resetFilters: dataManager.resetFilters,

    // Utilidades
    hasClients: dataManager.hasData,
    isLoading: dataManager.isLoading,
    hasError: dataManager.hasError,
    hasNextPage: dataManager.hasNextPage,
    hasPrevPage: dataManager.hasPrevPage
  };
};