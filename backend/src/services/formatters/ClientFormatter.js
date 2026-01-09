/**
 * Formateador de datos para clientes
 * Aplica el principio de Responsabilidad Única (SRP)
 */
class ClientFormatter {
  /**
   * Formatea una fila de base de datos en objeto de cliente
   * @param {Object} row - Fila de la base de datos
   * @returns {Object} Objeto de cliente formateado
   */
  formatClientRow(row) {
    let preferences = null;
    if (row.preferences) {
      try {
        preferences = JSON.parse(row.preferences);
      } catch (e) {
        console.warn('Error parsing preferences:', e);
        preferences = null;
      }
    }

    return {
      id: row.id,
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      email: row.email || '',
      phone: row.phone || null,
      address: row.address || null,
      preferences,
      agentId: row.agentId,
      agent: row.agent_id ? {
        id: row.agent_id,
        name: row.agent_name,
        email: row.agent_email
      } : undefined,
      transactionCount: row.transaction_count || 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  /**
   * Formatea múltiples filas de clientes
   * @param {Array} rows - Array de filas de base de datos
   * @returns {Array} Array de clientes formateadas
   */
  formatClients(rows) {
    return rows.map(row => this.formatClientRow(row));
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
      propertyId: row.propertyId,
      agentId: row.agentId,
      property: row.property_id ? {
        id: row.property_id,
        title: row.property_title,
        address: row.property_address,
        price: row.property_price
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
   * Formatea estadísticas de clientes
   * @param {number} totalClients - Total de clientes
   * @param {number} activeClients - Clientes con transacciones activas
   * @returns {Object} Estadísticas formateadas
   */
  formatStats(totalClients, activeClients) {
    return {
      totalClients,
      activeClients,
      inactiveClients: totalClients - activeClients
    };
  }
}

module.exports = ClientFormatter;