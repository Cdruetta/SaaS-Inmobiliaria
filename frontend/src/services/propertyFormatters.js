/**
 * Utilidades para formatear datos de propiedades
 * Aplica el principio de Responsabilidad Única (SRP)
 */

export const PropertyFormatters = {
  /**
   * Formatea el color del estado de la propiedad
   */
  getStatusColor: (status) => {
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
  },

  /**
   * Formatea el texto del estado de la propiedad
   */
  getStatusText: (status) => {
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
  },

  /**
   * Formatea el texto del tipo de propiedad
   */
  getTypeText: (type) => {
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
  },

  /**
   * Formatea el precio con separadores de miles
   */
  formatPrice: (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  },

  /**
   * Formatea la fecha
   */
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Obtiene el icono correspondiente al tipo de propiedad
   */
  getTypeIcon: (type) => {
    // Esta función ahora solo define el mapeo, el componente importa el icono
    const iconMap = {
      HOUSE: 'Home',
      APARTMENT: 'Building2',
      LAND: 'MapPin',
      COMMERCIAL: 'Building'
    };
    return iconMap[type] || 'Building';
  }
};