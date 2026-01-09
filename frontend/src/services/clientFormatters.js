/**
 * Utilidades para formatear datos de clientes
 * Aplica el principio de Responsabilidad Única (SRP)
 */

export const ClientFormatters = {
  /**
   * Formatea el nombre completo del cliente
   */
  formatFullName: (firstName, lastName) => {
    return `${firstName} ${lastName}`.trim();
  },

  /**
   * Formatea las iniciales del cliente
   */
  formatInitials: (firstName, lastName) => {
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return `${first}${last}` || '?';
  },

  /**
   * Formatea el teléfono con un formato legible
   */
  formatPhone: (phone) => {
    if (!phone) return '';

    // Remover todos los caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '');

    // Formato argentino básico (sin validación compleja)
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return phone; // Retornar como está si no cumple el formato
  },

  /**
   * Formatea las preferencias del cliente
   */
  formatPreferences: (preferences) => {
    if (!preferences || !Array.isArray(preferences)) {
      return 'Sin preferencias especificadas';
    }

    return preferences.join(', ');
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
   * Obtiene el color del avatar basado en el nombre
   */
  getAvatarColor: (firstName = '', lastName = '') => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];

    const name = `${firstName}${lastName}`.toLowerCase();
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

    return colors[index];
  }
};