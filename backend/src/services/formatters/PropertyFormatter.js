/**
 * Formateador de datos para propiedades
 * Aplica el principio de Responsabilidad Única (SRP)
 */
class PropertyFormatter {
  /**
   * Formatea una fila de base de datos en objeto de propiedad
   * @param {Object} row - Fila de la base de datos
   * @returns {Object} Objeto de propiedad formateado
   */
  formatPropertyRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      price: row.price,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zipCode,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      area: row.area,
      yearBuilt: row.yearBuilt,
      features: row.features ? JSON.parse(row.features) : [],
      images: row.images ? JSON.parse(row.images) : [],
      ownerId: row.ownerId,
      owner: row.owner_id ? {
        id: row.owner_id,
        name: row.owner_name,
        email: row.owner_email
      } : undefined,
      transactionCount: row.transaction_count || 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  /**
   * Formatea múltiples filas de propiedades
   * @param {Array} rows - Array de filas de base de datos
   * @returns {Array} Array de propiedades formateadas
   */
  formatProperties(rows) {
    return rows.map(row => this.formatPropertyRow(row));
  }

  /**
   * Formatea una transacción
   * @param {Object} row - Fila de transacción de la base de datos
   * @returns {Object} Objeto de transacción formateado
   */
  formatTransactionRow(row) {
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      amount: row.amount,
      commission: row.commission,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      clientId: row.clientId,
      agentId: row.agentId,
      client: row.client_firstName ? {
        firstName: row.client_firstName,
        lastName: row.client_lastName,
        email: row.client_email
      } : undefined
    };
  }

  /**
   * Formatea múltiples transacciones
   * @param {Array} rows - Array de filas de transacciones
   * @returns {Array} Array de transacciones formateadas
   */
  formatTransactions(rows) {
    return rows.map(row => this.formatTransactionRow(row));
  }

  /**
   * Formatea estadísticas de propiedades
   * @param {Array} statusRows - Filas de estadísticas por estado
   * @param {Array} typeRows - Filas de estadísticas por tipo
   * @param {number} totalProperties - Total de propiedades
   * @param {number} totalValue - Valor total
   * @returns {Object} Estadísticas formateadas
   */
  formatStats(statusRows, typeRows, totalProperties, totalValue) {
    return {
      totalProperties,
      totalValue: totalValue || 0,
      byStatus: statusRows.reduce((acc, row) => {
        acc[row.status] = { count: row.count, value: row.value || 0 };
        return acc;
      }, {}),
      byType: typeRows.reduce((acc, row) => {
        acc[row.type] = { count: row.count, value: row.value || 0 };
        return acc;
      }, {})
    };
  }
}

module.exports = PropertyFormatter;