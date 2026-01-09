/**
 * Utilidades de validación para propiedades
 * Aplica el principio de Responsabilidad Única (SRP)
 */

export const PropertyValidators = {
  /**
   * Valida los datos básicos de una propiedad
   */
  validateBasicData: (data) => {
    const errors = [];

    if (!data.title?.trim()) {
      errors.push('El título es requerido');
    }

    if (!data.address?.trim()) {
      errors.push('La dirección es requerida');
    }

    if (!data.city?.trim()) {
      errors.push('La ciudad es requerida');
    }

    if (!data.state?.trim()) {
      errors.push('El estado/provincia es requerido');
    }

    if (!data.price || data.price <= 0) {
      errors.push('El precio debe ser un número positivo');
    }

    return errors;
  },

  /**
   * Valida el tipo de propiedad
   */
  validateType: (type) => {
    const validTypes = ['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL'];
    return validTypes.includes(type);
  },

  /**
   * Valida el estado de la propiedad
   */
  validateStatus: (status) => {
    const validStatuses = ['AVAILABLE', 'SOLD', 'RENTED', 'PENDING'];
    return validStatuses.includes(status);
  },

  /**
   * Valida los filtros de búsqueda
   */
  validateFilters: (filters) => {
    const errors = [];

    if (filters.minPrice && filters.maxPrice) {
      if (parseFloat(filters.minPrice) > parseFloat(filters.maxPrice)) {
        errors.push('El precio mínimo no puede ser mayor al precio máximo');
      }
    }

    if (filters.minPrice && parseFloat(filters.minPrice) < 0) {
      errors.push('El precio mínimo no puede ser negativo');
    }

    if (filters.maxPrice && parseFloat(filters.maxPrice) < 0) {
      errors.push('El precio máximo no puede ser negativo');
    }

    return errors;
  },

  /**
   * Sanitiza los datos del formulario
   */
  sanitizeFormData: (data) => {
    return {
      ...data,
      title: data.title?.trim(),
      description: data.description?.trim(),
      address: data.address?.trim(),
      city: data.city?.trim(),
      state: data.state?.trim(),
      zipCode: data.zipCode?.trim(),
      price: data.price ? parseFloat(data.price) : '',
      bedrooms: data.bedrooms ? parseInt(data.bedrooms) : '',
      bathrooms: data.bathrooms ? parseFloat(data.bathrooms) : '',
      area: data.area ? parseFloat(data.area) : '',
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt) : ''
    };
  }
};