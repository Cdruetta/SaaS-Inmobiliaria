/**
 * Servicio de validación para clientes
 * Aplica el principio de Responsabilidad Única (SRP)
 */
class ClientValidator {
  /**
   * Valida los datos para crear un cliente
   * @param {Object} clientData - Datos del cliente
   * @throws {Error} Si la validación falla
   */
  validateCreate(clientData) {
    const requiredFields = ['firstName', 'lastName', 'email'];
    const missingFields = requiredFields.filter(field => !clientData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }

    this.validateEmail(clientData.email);
  }

  /**
   * Valida el email
   * @param {string} email - Email a validar
   * @throws {Error} Si el email no es válido
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('El email no tiene un formato válido');
    }
  }

  /**
   * Valida y sanitiza los datos de entrada
   * @param {Object} clientData - Datos a sanitizar
   * @returns {Object} Datos sanitizados
   */
  sanitize(clientData) {
    return {
      firstName: clientData.firstName?.trim(),
      lastName: clientData.lastName?.trim(),
      email: clientData.email?.toLowerCase().trim(),
      phone: clientData.phone?.trim(),
      address: clientData.address?.trim(),
      preferences: clientData.preferences || null
    };
  }
}

module.exports = ClientValidator;