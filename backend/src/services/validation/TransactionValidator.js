/**
 * Servicio de validación para transacciones
 * Aplica el principio de Responsabilidad Única (SRP)
 */
class TransactionValidator {
  /**
   * Valida los datos para crear una transacción
   * @param {Object} transactionData - Datos de la transacción
   * @throws {Error} Si la validación falla
   */
  validateCreate(transactionData) {
    const requiredFields = ['type', 'amount', 'agentId'];
    const missingFields = requiredFields.filter(field => !transactionData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }

    this.validateAmount(transactionData.amount);
    this.validateType(transactionData.type);

    if (transactionData.status) {
      this.validateStatus(transactionData.status);
    }
  }

  /**
   * Valida el tipo de transacción
   * @param {string} type - Tipo de transacción
   * @throws {Error} Si el tipo no es válido
   */
  validateType(type) {
    const validTypes = ['SALE', 'RENTAL', 'LEASE'];
    if (!validTypes.includes(type)) {
      throw new Error('Tipo de transacción inválido. Debe ser SALE, RENTAL o LEASE');
    }
  }

  /**
   * Valida el estado de la transacción
   * @param {string} status - Estado de la transacción
   * @throws {Error} Si el estado no es válido
   */
  validateStatus(status) {
    const validStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Estado de transacción inválido. Debe ser PENDING, COMPLETED o CANCELLED');
    }
  }

  /**
   * Valida el monto
   * @param {number} amount - Monto de la transacción
   * @throws {Error} Si el monto no es válido
   */
  validateAmount(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('El monto debe ser un número positivo');
    }

    if (amount > 999999999) {
      throw new Error('El monto no puede ser mayor a 999,999,999');
    }
  }

  /**
   * Valida y sanitiza los datos de entrada
   * @param {Object} transactionData - Datos a sanitizar
   * @returns {Object} Datos sanitizados
   */
  sanitize(transactionData) {
    return {
      type: transactionData.type,
      status: transactionData.status || 'PENDING',
      amount: parseFloat(transactionData.amount),
      commission: transactionData.commission ? parseFloat(transactionData.commission) : 0,
      notes: transactionData.notes?.trim() || null,
      propertyId: transactionData.propertyId || null,
      clientId: transactionData.clientId || null,
      preferences: transactionData.preferences || null
    };
  }
}

module.exports = TransactionValidator;