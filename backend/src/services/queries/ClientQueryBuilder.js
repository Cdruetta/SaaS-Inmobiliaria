/**
 * Constructor de queries para clientes
 * Aplica el principio de Responsabilidad Única (SRP)
 */
class ClientQueryBuilder {
  /**
   * Construye la consulta y parámetros para obtener todos los clientes
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
      whereConditions.push('c.agentId = ?');
      params.push(agentId);
    }

    // Aplicar filtros
    const filterMappings = {
      search: '(c.firstName LIKE ? OR c.lastName LIKE ? OR c.email LIKE ?)'
    };

    if (filters.search) {
      whereConditions.push(filterMappings.search);
      const searchParam = `%${filters.search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM clients c ${whereClause}`;

    // Query principal con paginación
    const dataQuery = `
      SELECT
        c.*,
        u.id as agent_id,
        u.name as agent_name,
        u.email as agent_email,
        COUNT(t.id) as transaction_count
      FROM clients c
      LEFT JOIN users u ON c.agentId = u.id
      LEFT JOIN transactions t ON c.id = t.clientId
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    return {
      countQuery,
      dataQuery,
      params,
      countParams: params.slice(0, -2) // Excluir limit y offset para count
    };
  }

  /**
   * Construye la consulta para obtener un cliente por ID
   * @param {string} id - ID del cliente
   * @param {string|null} agentId - ID del agente (null para admin)
   * @returns {Object} Objeto con query y parámetros
   */
  buildGetByIdQuery(id, agentId) {
    let query = `
      SELECT
        c.*,
        u.id as agent_id,
        u.name as agent_name,
        u.email as agent_email
      FROM clients c
      LEFT JOIN users u ON c.agentId = u.id
      WHERE c.id = ?
    `;

    let params = [id];

    if (agentId) {
      query += ' AND c.agentId = ?';
      params.push(agentId);
    }

    return { query, params };
  }

  /**
   * Construye la consulta para crear un cliente
   * @param {Object} clientData - Datos del cliente
   * @returns {Object} Objeto con query y parámetros
   */
  buildCreateQuery(clientData) {
    const {
      id, firstName, lastName, email, phone, address, preferences, agentId, createdAt, updatedAt
    } = clientData;

    const query = `
      INSERT INTO clients (
        id, firstName, lastName, email, phone, address, preferences, agentId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id, firstName, lastName, email, phone, address, preferences, agentId, createdAt, updatedAt
    ];

    return { query, params };
  }

  /**
   * Construye la consulta para actualizar un cliente
   * @param {string} id - ID del cliente
   * @param {Object} updates - Campos a actualizar
   * @returns {Object} Objeto con query y parámetros
   */
  buildUpdateQuery(id, updates) {
    const updateFields = [];
    const params = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'updatedAt') {
        updateFields.push('updatedAt = ?');
        params.push(value);
      } else {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    params.push(id);

    const query = `
      UPDATE clients
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    return { query, params };
  }

  /**
   * Construye la consulta para verificar si existe un cliente con email
   * @param {string} email - Email del cliente
   * @param {string} agentId - ID del agente
   * @returns {Object} Objeto con query y parámetros
   */
  buildCheckExistingQuery(email, agentId) {
    const query = 'SELECT id FROM clients WHERE email = ? AND agentId = ?';
    return { query, params: [email.toLowerCase().trim(), agentId] };
  }

  /**
   * Construye la consulta para obtener transacciones de un cliente
   * @param {string} clientId - ID del cliente
   * @returns {Object} Objeto con query y parámetros
   */
  buildGetTransactionsQuery(clientId) {
    const query = `
      SELECT
        t.*,
        p.id as property_id,
        p.title as property_title,
        p.address as property_address,
        p.price as property_price
      FROM transactions t
      LEFT JOIN properties p ON t.propertyId = p.id
      WHERE t.clientId = ?
      ORDER BY t.createdAt DESC
    `;

    return { query, params: [clientId] };
  }

  /**
   * Construye la consulta para obtener estadísticas de clientes
   * @param {string|null} agentId - ID del agente (null para admin)
   * @returns {Object} Objeto con query y parámetros
   */
  buildStatsQuery(agentId) {
    const whereClause = agentId ? 'WHERE agentId = ?' : '';
    const params = agentId ? [agentId] : [];

    const queries = {
      totalClients: `SELECT COUNT(*) as count FROM clients ${whereClause}`,
      activeClients: `
        SELECT COUNT(DISTINCT c.id) as count
        FROM clients c
        INNER JOIN transactions t ON c.id = t.clientId
        ${whereClause ? whereClause.replace('WHERE', 'WHERE c.agentId = ? AND') : 'WHERE'} t.status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
      `
    };

    return { queries, params };
  }

  /**
   * Construye la consulta para verificar transacciones activas de un cliente
   * @param {string} clientId - ID del cliente
   * @returns {Object} Objeto con query y parámetros
   */
  buildCheckActiveTransactionsQuery(clientId) {
    const query = `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE clientId = ? AND status IN ('PENDING', 'IN_PROGRESS')
    `;

    return { query, params: [clientId] };
  }
}

module.exports = ClientQueryBuilder;