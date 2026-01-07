// Utilidades para manejar el status de las propiedades

export const getPropertyStatusText = (status) => {
  switch (status) {
    case 'AVAILABLE':
      return 'Disponible';
    case 'SOLD':
      return 'En venta';
    case 'RENTED':
      return 'Alquilada';
    case 'PENDING':
      return 'Pendiente';
    default:
      return status;
  }
};

export const getPropertyStatusColor = (status) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800';
    case 'SOLD':
      return 'bg-red-100 text-red-800';
    case 'RENTED':
      return 'bg-blue-100 text-blue-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPropertyStatusColorInline = (status) => {
  switch (status) {
    case 'AVAILABLE':
      return 'text-green-600 bg-green-100';
    case 'SOLD':
      return 'text-red-600 bg-red-100';
    case 'RENTED':
      return 'text-blue-600 bg-blue-100';
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};
