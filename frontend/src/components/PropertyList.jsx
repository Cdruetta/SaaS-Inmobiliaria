import { Link } from 'react-router-dom';
import { Edit, Trash2, DollarSign, MapPin } from 'lucide-react';
import { PropertyFormatters } from '../services/propertyFormatters';

/**
 * Componente para mostrar la lista de propiedades
 * Aplica el principio de Responsabilidad Única (SRP)
 */
const PropertyList = ({ properties, onDeleteProperty }) => {
  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
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
            <DollarSign className="h-5 w-5 mr-2" />
            Agregar Propiedad
          </Link>
        </div>
      </div>
    );
  }

  // Función helper para obtener el icono del tipo
  const getTypeIcon = (type) => {
    const iconName = PropertyFormatters.getTypeIcon(type);
    const iconProps = { className: "h-6 w-6 text-gray-600" };

    // Importamos dinámicamente los iconos (en un caso real usaríamos un switch o un mapa)
    const iconMap = {
      'Home': () => import('lucide-react').then(m => m.Home),
      'Building2': () => import('lucide-react').then(m => m.Building2),
      'MapPin': () => import('lucide-react').then(m => m.MapPin),
      'Building': () => import('lucide-react').then(m => m.Building)
    };

    // Para este ejemplo, usaremos un switch simple
    switch (iconName) {
      case 'Home':
        return <span className="h-6 w-6 bg-gray-600 rounded text-white text-xs flex items-center justify-center">🏠</span>;
      case 'Building2':
        return <span className="h-6 w-6 bg-gray-600 rounded text-white text-xs flex items-center justify-center">🏢</span>;
      case 'MapPin':
        return <span className="h-6 w-6 bg-gray-600 rounded text-white text-xs flex items-center justify-center">📍</span>;
      case 'Building':
      default:
        return <span className="h-6 w-6 bg-gray-600 rounded text-white text-xs flex items-center justify-center">🏗️</span>;
    }
  };

  return (
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
                        {PropertyFormatters.getTypeText(property.type)}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${PropertyFormatters.getStatusColor(property.status)}`}>
                        {PropertyFormatters.getStatusText(property.status)}
                      </span>
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
                onClick={() => onDeleteProperty(property.id)}
                className="text-red-600 hover:text-red-900 p-2"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default PropertyList;