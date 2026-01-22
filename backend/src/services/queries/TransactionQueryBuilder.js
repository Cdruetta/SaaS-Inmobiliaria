/**
 * Constructor de queries para transacciones
 * Aplica el principio de Responsabilidad Única (SRP)
 */
class TransactionQueryBuilder {
  /**
   * Construye la consulta y parámetros para obtener todas las transacciones
   * @param {Object} filters - Filtros aplicados
   * @param {string|null} agentId - ID del agente (null para admin)
   * @param {Object} pagination - Configuración de paginación
   * @returns {Object} Objeto con query y parámetros
   */
  buildGetAllQuery(filters, agentId, pagination) {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    // Filter by agentId if not ADMIN
    if (agentId) {
      whereConditions.push('t.agentId = ?');
      params.push(agentId);
    }

    // Aplicar filtros
    const filterMappings = {
      search: '(t.type LIKE ? OR p.title LIKE ?)',
      type: 't.type = ?',
      status: 't.status = ?'
    };

    Object.keys(filterMappings).forEach(filterKey => {
      if (filters[filterKey]) {
        if (filterKey === 'search') {
          whereConditions.push(filterMappings.search);
          const searchParam = `%${filters.search}%`;
          params.push(searchParam, searchParam);
        } else {
          whereConditions.push(filterMappings[filterKey]);
          params.push(filters[filterKey]);
        }
      }
    });

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      LEFT JOIN properties p ON t.propertyId = p.id
      ${whereClause}
    `;

    // Query principal con paginación
    const dataQuery = `
      SELECT
        t.*,
        p.title as property_title,
        p.address as property_address,
        p.price as property_price,
        u.name as agent_name,
        u.email as agent_email,
        c.firstName as client_firstName,
        c.lastName as client_lastName,
        c.email as client_email
      FROM transactions t
      LEFT JOIN properties p ON t.propertyId = p.id
      LEFT JOIN users u ON t.agentId = u.id
      LEFT JOIN clients c ON t.clientId = c.id
      ${whereClause}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    return { countQuery, dataQuery, params: params.slice(0, -2), countParams: params.slice(0, -2) };
  }

  /**
   * Construye consulta para estadísticas de transacciones
   * @param {string|null} agentId - ID del agente (null para admin)
   * @returns {Object} Objeto con queries y parámetros
   */
  buildStatsQuery(agentId) {
    const whereClause = agentId ? 'WHERE agentId = ?' : '';
    const params = agentId ? [agentId] : [];

    return {
      totalTransactions: `SELECT COUNT(*) as count FROM transactions ${whereClause}`,
      totalAmount: `SELECT SUM(amount) as sum FROM transactions ${whereClause}`,
      byStatus: `SELECT status, COUNT(*) as count FROM transactions ${whereClause} GROUP BY status`,
      byType: `SELECT type, COUNT(*) as count FROM transactions ${whereClause} GROUP BY type`,
      params
    };
  }

  /**
   * Construye consulta para obtener transacción por ID
   * @param {string} id - ID de la transacción
   * @param {string|null} agentId - ID del agente
   * @returns {Object} Objeto con query y parámetros
   */
  buildGetByIdQuery(id, agentId) {
    let whereClause = 't.id = ?';
    let params = [id];

    if (agentId) {
      whereClause += ' AND t.agentId = ?';
      params.push(agentId);
    }

    const query = `
      SELECT
        t.*,
        p.title as property_title,
        p.address as property_address,
        p.price as property_price,
        u.name as agent_name,
        u.email as agent_email,
        c.firstName as client_firstName,
        c.lastName as client_lastName,
        c.email as client_email
      FROM transactions t
      LEFT JOIN properties p ON t.propertyId = p.id
      LEFT JOIN users u ON t.agentId = u.id
      LEFT JOIN clients c ON t.clientId = c.id
      WHERE ${whereClause}
    `;

    return { query, params };
  }

  /**
   * Construye consulta para crear transacción
   * @param {Object} transactionData - Datos de la transacción
   * @returns {Object} Objeto con query y parámetros
   */
  buildCreateQuery(transactionData) {
    const fields = Object.keys(transactionData);
    const placeholders = fields.map(() => '?').join(', ');
    const query = `INSERT INTO transactions (${fields.join(', ')}) VALUES (${placeholders})`;

    return {
      query,
      params: fields.map(field => {
        const value = transactionData[field];
        return field === 'preferences' && typeof value === 'object' ? JSON.stringify(value) : value;
      })
    };
  }

  /**
   * Construye consulta para actualizar transacción
   * @param {string} id - ID de la transacción
   * @param {Object} updates - Campos a actualizar
   * @returns {Object} Objeto con query y parámetros
   */
  buildUpdateQuery(id, updates) {
    const fields = Object.keys(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE transactions SET ${setClause}, updatedAt = ? WHERE id = ?`;

    const params = fields.map(field => {
      const value = updates[field];
      return field === 'preferences' && typeof value === 'object' ? JSON.stringify(value) : value;
    });
    params.push(new Date().toISOString(), id);

    return { query, params };
  }
}

module.exports = TransactionQueryBuilder;