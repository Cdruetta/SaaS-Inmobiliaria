import { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * Hook para estadísticas del dashboard
 * Obtiene métricas consolidadas de un solo endpoint
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalClients: 0,
    totalTransactions: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/api/dashboard/stats');
        console.log('Dashboard stats response:', response.data); 

        setStats(response.data.stats);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        setError('Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};