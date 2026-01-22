/**
 * Utilidades de validación para clientes
 * Aplica el principio de Responsabilidad Única (SRP)
 */

export const ClientValidators = {
  /**
   * Valida los datos básicos de un cliente
   */
  validateBasicData: (data) => {
    const errors = [];

    if (!data.firstName?.trim()) {
      errors.push('El nombre es requerido');
    }

    if (!data.lastName?.trim()) {
      errors.push('El apellido es requerido');
    }

    if (!data.email?.trim()) {
      errors.push('El email es requerido');
    }

    if (data.email && !ClientValidators.validateEmail(data.email)) {
      errors.push('El email no tiene un formato válido');
    }

    return errors;
  },

  /**
   * Valida el formato del email
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valida el formato del teléfono
   */
  validatePhone: (phone) => {
    if (!phone) return true; // Teléfono es opcional

    // Permitir solo números, espacios, paréntesis, guiones y puntos
    const phoneRegex = /^[\d\s\-\(\)\.]+$/;
    return phoneRegex.test(phone);
  },

  /**
   * Valida las preferencias del cliente
   */
  validatePreferences: (preferences) => {
    if (!preferences) return true;

    if (!Array.isArray(preferences)) {
      return false;
    }

    // Validar que cada preferencia sea un string no vacío
    return preferences.every(pref => typeof pref === 'string' && pref.trim().length > 0);
  },

  /**
   * Valida los filtros de búsqueda
   */
  validateFilters: (filters) => {
    const errors = [];

    if (filters.search && filters.search.length < 2) {
      errors.push('La búsqueda debe tener al menos 2 caracteres');
    }

    return errors;
  },

  /**
   * Sanitiza los datos del formulario
   */
  sanitizeFormData: (data) => {
    return {
      ...data,
      firstName: data.firstName?.trim() || '',
      lastName: data.lastName?.trim() || '',
      email: data.email?.trim().toLowerCase() || '',
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      preferences: data.preferences || []
    };
  }
};