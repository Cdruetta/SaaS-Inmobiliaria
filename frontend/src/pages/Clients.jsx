import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Edit, Trash2, User, Mail, Phone, MapPin } from 'lucide-react';

const Clients = () => {
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
    search: '',
    page: 1,
    limit: 10
  });

  const fetchClients = useCallback(async (page = 1, searchTerm = '') => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (searchTerm) {
        params.append('search', searchTerm);
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
  }, []);

  // Solo ejecutar una vez al montar
  useEffect(() => {
    let mounted = true;
    
    const loadClients = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: '1',
          limit: '10',
        });

        const response = await api.get(`/clients?${params}`);
        
        if (mounted) {
          setClients(response.data.clients || []);
          setPagination(response.data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        if (mounted) {
          setError('Error al cargar los clientes');
          setClients([]);
          setLoading(false);
        }
      }
    };

    loadClients();

    return () => {
      mounted = false;
    };
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchClients(1, filters.search);
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      return;
    }

    try {
      await api.delete(`/clients/${id}`);
      fetchClients(pagination.page, filters.search);
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Error al eliminar el cliente');
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="mt-2 text-gray-600">
            Administra todos tus clientes inmobiliarios
          </p>
        </div>
        <Link
          to="/clients/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Agregar Cliente
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar clientes
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar por nombre, apellido o email..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Lista de clientes */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {clients.length === 0 && !loading ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay clientes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando tu primer cliente.
            </p>
            <div className="mt-6">
              <Link
                to="/clients/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Cliente
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {clients.map((client) => (
              <li key={client.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {client.firstName} {client.lastName}
                          </h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Mail className="h-4 w-4 mr-1" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Phone className="h-4 w-4 mr-1" />
                              {client.phone}
                            </div>
                          )}
                          {client.address && (
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {client.address}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-gray-600">
                              {client.transactionCount || 0} transacciones
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/clients/${client.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 p-2"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-red-600 hover:text-red-900 p-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => fetchClients(pagination.page - 1, filters.search)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => fetchClients(pagination.page + 1, filters.search)}
              disabled={pagination.page === pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{pagination.total}</span>{' '}
                resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => fetchClients(pagination.page - 1, filters.search)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  ‹
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchClients(pageNum, filters.search)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchClients(pagination.page + 1, filters.search)}
                  disabled={pagination.page === pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Siguiente</span>
                  ›
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
