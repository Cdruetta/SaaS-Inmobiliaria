import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, saveRedirectPath } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    type: 'HOUSE', // Default type
    status: 'AVAILABLE', // Default status
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Debes iniciar sesión para crear o editar propiedades');
      const currentPath = id ? `/properties/${id}/edit` : '/properties/new';
      saveRedirectPath(currentPath);
      navigate('/login');
      return;
    }
  }, [user, authLoading, navigate, id, saveRedirectPath]);

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      const fetchProperty = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/properties/${id}`);
          const property = response.data.property;
          setFormData({
            title: property.title || '',
            description: property.description || '',
            address: property.address || '',
            city: property.city || '',
            state: property.state || '',
            zipCode: property.zipCode || '',
            price: property.price || '',
            bedrooms: property.bedrooms || '',
            bathrooms: property.bathrooms || '',
            area: property.area || '',
            type: property.type || 'HOUSE',
            status: property.status || 'AVAILABLE'
          });
        } catch (err) {
          setError('Error al cargar la propiedad.');
          toast.error('Error al cargar la propiedad.');
        } finally {
          setLoading(false);
        }
      };
      fetchProperty();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await api.put(`/properties/${id}`, formData);
        toast.success('Propiedad actualizada exitosamente!');
      } else {
        await api.post('/properties', formData);
        toast.success('Propiedad creada exitosamente!');
      }
      navigate('/properties');
    } catch (err) {
      let errorMessage = 'Error al guardar la propiedad.';

      if (err.response?.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        navigate('/login');
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesión para acceder a esta página.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white shadow-md rounded-lg p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {isEditing ? 'Editar Propiedad' : 'Agregar Nueva Propiedad'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Precio
            </label>
              <input
                type="number"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              name="description"
              id="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Dirección
            </label>
            <input
              type="text"
              name="address"
              id="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              Ciudad
            </label>
            <input
              type="text"
              name="city"
              id="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              Provincia/Estado
            </label>
            <input
              type="text"
              name="state"
              id="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
              Código Postal
            </label>
            <input
              type="text"
              name="zipCode"
              id="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
              Habitaciones
            </label>
            <input
              type="number"
              name="bedrooms"
              id="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
              Baños
            </label>
            <input
              type="number"
              name="bathrooms"
              id="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-700">
              Tamaño de terreno (sq ft)
            </label>
            <input
              type="number"
              name="area"
              id="area"
              value={formData.area}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Tipo de Propiedad
            </label>
            <select
              name="type"
              id="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="HOUSE">Casa</option>
              <option value="APARTMENT">Departamento</option>
              <option value="LAND">Terreno</option>
              <option value="COMMERCIAL">Comercial</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Estado de la Propiedad
            </label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="AVAILABLE">Disponible</option>
              <option value="SOLD">Vendida</option>
              <option value="RENTED">Alquilada</option>
              <option value="PENDING">Pendiente</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/properties')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Propiedad' : 'Crear Propiedad')}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default PropertyForm;
