import { Link } from 'react-router-dom';
import { Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { ClientFormatters } from '../services/clientFormatters';

/**
 * Componente para mostrar la lista de clientes
 * Aplica el principio de Responsabilidad Única (SRP)
 */
const ClientList = ({ clients, onDeleteClient }) => {
  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="mx-auto h-12 w-12 text-gray-400" />
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
            <Mail className="h-5 w-5 mr-2" />
            Agregar Cliente
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {clients.map((client) => (
        <li key={client.id} className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              {/* Avatar */}
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-medium text-lg ${ClientFormatters.getAvatarColor(client.firstName || '', client.lastName || '')}`}>
                {ClientFormatters.formatInitials(client.firstName || '', client.lastName || '')}
              </div>

              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {ClientFormatters.formatFullName(client.firstName || '', client.lastName || '')}
                    </h4>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Mail className="h-4 w-4 mr-1" />
                      {client.email}
                    </div>

                    {/* Información adicional */}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      {client.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {ClientFormatters.formatPhone(client.phone)}
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {client.address}
                        </div>
                      )}
                      {client.transactionCount > 0 && (
                        <span className="text-blue-600 font-medium">
                          {client.transactionCount} transacción{client.transactionCount !== 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center space-x-2 ml-4">
              <Link
                to={`/clients/${client.id}/edit`}
                className="text-indigo-600 hover:text-indigo-900 p-2"
              >
                <Edit className="h-5 w-5" />
              </Link>
              <button
                onClick={() => onDeleteClient(client.id)}
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

export default ClientList;