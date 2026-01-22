/**
 * Formateador de datos para transacciones
 * Aplica el principio de Responsabilidad Única (SRP)
 */
class TransactionFormatter {
  /**
   * Formatea una fila de base de datos en objeto de transacción
   * @param {Object} row - Fila de la base de datos
   * @returns {Object} Objeto de transacción formateado
   */
  formatTransactionRow(row) {
    let preferences = null;
    if (row.preferences) {
      try {
        preferences = JSON.parse(row.preferences);
      } catch (e) {
        console.warn('Error parsing transaction preferences:', e);
        preferences = null;
      }
    }

    return {
      id: row.id,
      type: row.type,
      status: row.status,
      amount: parseFloat(row.amount),
      commission: row.commission ? parseFloat(row.commission) : 0,
      notes: row.notes,
      propertyId: row.propertyId,
      clientId: row.clientId,
      agentId: row.agentId,
      preferences,
      agent: row.agent_name ? {
        name: row.agent_name,
        email: row.agent_email
      } : undefined,
      client: row.client_firstName ? {
        firstName: row.client_firstName,
        lastName: row.client_lastName,
        email: row.client_email
      } : undefined,
      property: row.property_title ? {
        title: row.property_title,
        address: row.property_address,
        price: row.property_price
      } : undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  /**
   * Formatea múltiples filas de transacciones
   * @param {Array} rows - Array de filas de base de datos
   * @returns {Array} Array de transacciones formateadas
   */
  formatTransactions(rows) {
    return rows.map(row => this.formatTransactionRow(row));
  }

  /**
   * Formatea estadísticas de transacciones
   * @param {Array} statusRows - Filas agrupadas por estado
   * @param {Array} typeRows - Filas agrupadas por tipo
   * @param {number} totalTransactions - Total de transacciones
   * @param {number} totalAmount - Monto total
   * @returns {Object} Estadísticas formateadas
   */
  formatStats(statusRows, typeRows, totalTransactions, totalAmount) {
    const byStatus = {};
    statusRows.forEach(row => {
      byStatus[row.status] = row.count;
    });

    const byType = {};
    typeRows.forEach(row => {
      byType[row.type] = row.count;
    });

    return {
      totalTransactions,
      totalAmount,
      byStatus,
      byType
    };
  }

  /**
   * Formatea estadísticas para dashboard
   * @param {number} totalTransactions - Total de transacciones
   * @param {number} totalAmount - Monto total
   * @returns {Object} Estadísticas formateadas para dashboard
   */
  formatDashboardStats(totalTransactions, totalAmount) {
    return {
      totalTransactions,
      totalAmount,
      averageTransaction: totalTransactions > 0 ? totalAmount / totalTransactions : 0
    };
  }
}

module.exports = TransactionFormatter;