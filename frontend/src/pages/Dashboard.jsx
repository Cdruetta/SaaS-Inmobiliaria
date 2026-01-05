import { useState, useEffect } from 'react';
import api from '../services/api';
import { Building, Users, TrendingUp, DollarSign, FileText, Plus } from 'lucide-react';

const Dashboard = () => {
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

        // Inicializar stats con valores por defecto
        const defaultStats = {
          totalProperties: 0,
          totalClients: 0,
          totalTransactions: 0,
          totalValue: 0
        };

        // Obtener estadísticas de propiedades (con manejo de error individual)
        try {
          const propertiesResponse = await api.get('/properties/stats');
          if (propertiesResponse.data?.stats) {
            defaultStats.totalProperties = propertiesResponse.data.stats.totalProperties || 0;
          }
        } catch (error) {
          console.warn('Error obteniendo estadísticas de propiedades:', error);
        }

        // Obtener estadísticas de clientes (con manejo de error individual)
        try {
          const clientsResponse = await api.get('/clients/stats');
          if (clientsResponse.data?.stats) {
            defaultStats.totalClients = clientsResponse.data.stats.totalClients || 0;
          }
        } catch (error) {
          console.warn('Error obteniendo estadísticas de clientes:', error);
        }

        // Obtener estadísticas de transacciones (con manejo de error individual)
        try {
          const transactionsResponse = await api.get('/transactions/stats');
          if (transactionsResponse.data?.stats) {
            defaultStats.totalTransactions = transactionsResponse.data.stats.totalTransactions || 0;
            defaultStats.totalValue = transactionsResponse.data.stats.totalValue || 0;
          }
        } catch (error) {
          console.warn('Error obteniendo estadísticas de transacciones:', error);
        }

        setStats(defaultStats);
      } catch (error) {
        console.error('Error general al cargar estadísticas:', error);
        setError('Error al cargar algunas estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      name: 'Total Propiedades',
      value: stats.totalProperties,
      icon: Building,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Clientes',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      name: 'Transacciones',
      value: stats.totalTransactions,
      icon: FileText,
      color: 'bg-yellow-500'
    },
    {
      name: 'Valor Total',
      value: `$${(stats.totalValue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Bienvenido a tu panel de control inmobiliario
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de acciones rápidas */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/properties/new"
            className="relative block w-full bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Agregar Propiedad
                </h3>
                <p className="text-gray-500">
                  Agregar una nueva propiedad al sistema
                </p>
              </div>
            </div>
          </a>

          <a
            href="/clients"
            className="relative block w-full bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Gestionar Clientes
                </h3>
                <p className="text-gray-500">
                  Ver y administrar tus clientes
                </p>
              </div>
            </div>
          </a>

          <a
            href="/properties"
            className="relative block w-full bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Ver Propiedades
                </h3>
                <p className="text-gray-500">
                  Explorar todas las propiedades
                </p>
              </div>
            </div>
          </a>

          <a
            href="/transactions/new"
            className="relative block w-full bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Nueva Transacción
                </h3>
                <p className="text-gray-500">
                  Registrar una nueva transacción
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
