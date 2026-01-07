import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Edit, Trash2, Building, Building2, Home, MapPin, DollarSign } from 'lucide-react';

const Properties = () => {
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
    listingType: '',
    minPrice: '',
    maxPrice: '',
    city: '',
    search: '' // Agregamos un campo de búsqueda general
  });

  const fetchProperties = useCallback(async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Agregamos los filtros a los parámetros de la URL
      for (const key in currentFilters) {
        if (currentFilters[key] !== '') { // Solo agregar si el valor no está vacío
          params.append(key, currentFilters[key].toString());
        }
      }

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
  }, [pagination.limit, filters]); // Agregamos filters a las dependencias

  useEffect(() => {
    fetchProperties(1, filters); // Cargar propiedades al montar o cuando los filtros cambien
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProperties, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties(1, filters); // Reiniciar a la primera página con los filtros actuales
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      return;
    }

    try {
      await api.delete(`/properties/${id}`);
      fetchProperties(pagination.page, filters); // Recargar la página actual con los filtros actuales
    } catch (error) {
      console.error('Error deleting property:', error);
      setError('Error al eliminar la propiedad');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SOLD':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'RENTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Disponible';
      case 'SOLD':
        return 'Vendida';
      case 'RENTED':
        return 'Alquilada';
      case 'PENDING':
        return 'En proceso';
      default:
        return status;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'HOUSE':
        return 'Casa';
      case 'APARTMENT':
        return 'Departamento';
      case 'LAND':
        return 'Terreno';
      case 'COMMERCIAL':
        return 'Comercial';
      default:
        return type;
    }
  };

  const getTransactionType = (property) => {
    if (property.listingType === 'RENT') {
      return 'Alquiler';
    } else if (property.listingType === 'SALE') {
      return 'Venta';
    } else if (property.listingType === 'SOLD') {
      return 'Ya vendida';
    } else if (property.listingType === 'RENTED_OUT') {
      return 'Ya alquilada';
    } else {
      // Fallback to status-based logic for backward compatibility
      switch (property.status) {
        case 'RENTED':
          return 'Alquiler';
        default:
          return 'Venta';
      }
    }
  };

  const getPropertyStatusLabel = (property) => {
    // Lógica principal basada en listingType
    if (property.listingType === 'SOLD') {
      return { text: 'Ya vendida', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (property.listingType === 'RENTED_OUT') {
      return { text: 'Ya alquilada', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    } else if (property.listingType === 'SALE' && property.status === 'AVAILABLE') {
      return { text: 'Disponible para venta', color: 'bg-green-100 text-green-800 border-green-200' };
    } else if (property.listingType === 'RENT' && property.status === 'AVAILABLE') {
      return { text: 'Disponible para alquiler', color: 'bg-green-100 text-green-800 border-green-200' };
    } else if (property.listingType === 'SALE' && property.status === 'PENDING') {
      return { text: 'En proceso de venta', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else if (property.listingType === 'RENT' && property.status === 'PENDING') {
      return { text: 'En proceso de alquiler', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    }

    // Fallback para casos no contemplados
    return { text: getStatusText(property.status), color: getStatusColor(property.status) };
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'HOUSE':
        return <Home className="h-6 w-6 text-gray-600" />;
      case 'APARTMENT':
        return <Building2 className="h-6 w-6 text-gray-600" />;
      case 'LAND':
        return <MapPin className="h-6 w-6 text-gray-600" />;
      case 'COMMERCIAL':
        return <Building className="h-6 w-6 text-gray-600" />;
      default:
        return <Building className="h-6 w-6 text-gray-600" />;
    }
  };

  if (loading && properties.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Propiedades</h1>
          <p className="mt-2 text-gray-600">
            Gestiona todas tus propiedades inmobiliarias
          </p>
        </div>
        <Link
          to="/properties/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Agregar Propiedad
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos</option>
              <option value="HOUSE">Casa</option>
              <option value="APARTMENT">Departamento</option>
              <option value="LAND">Terreno</option>
              <option value="COMMERCIAL">Comercial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="SOLD">Vendida</option>
              <option value="RENTED">Alquilada</option>
              <option value="PENDING">Pendiente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Publicación
            </label>
            <select
              name="listingType"
              value={filters.listingType}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos</option>
              <option value="SALE">Venta</option>
              <option value="RENT">Alquiler</option>
              <option value="SOLD">Ya vendida</option>
              <option value="RENTED_OUT">Ya alquilada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Mínimo
            </label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Máximo
            </label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="Sin límite"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad
            </label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="Buscar por ciudad"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Lista de propiedades */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay propiedades
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando tu primera propiedad.
            </p>
            <div className="mt-6">
              <Link
                to="/properties/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Propiedad
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {properties.map((property) => (
              <li key={property.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getTypeIcon(property.type)}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {property.title}
                          </h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.address}, {property.city}, {property.state}
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-gray-600">
                              {getTypeText(property.type)}
                            </span>
                            {(() => {
                              const statusInfo = getPropertyStatusLabel(property);
                              return (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                  {statusInfo.text}
                                </span>
                              );
                            })()}
                            {property.bedrooms && (
                              <span className="text-sm text-gray-600">
                                {property.bedrooms} hab
                              </span>
                            )}
                            {property.bathrooms && (
                              <span className="text-sm text-gray-600">
                                {property.bathrooms} baños
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-lg font-semibold text-gray-900">
                            <DollarSign className="h-5 w-5 mr-1" />
                            {property.price.toLocaleString()}
                          </div>
                          {property.currency && (
                            <div className="text-sm text-gray-500 mt-1">
                              {property.currency === 'USD' ? 'USD' : 'ARS'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/properties/${property.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 p-2"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDeleteProperty(property.id)}
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
              onClick={() => fetchProperties(pagination.page - 1, filters)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => fetchProperties(pagination.page + 1, filters)}
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
                  onClick={() => fetchProperties(pagination.page - 1, filters)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  ‹
                </button>
                {/* Números de página simplificados */}
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchProperties(pageNum, filters)}
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
                  onClick={() => fetchProperties(pagination.page + 1, filters)}
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

export default Properties;
