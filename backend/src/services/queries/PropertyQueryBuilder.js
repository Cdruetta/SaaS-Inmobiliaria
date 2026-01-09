/**
 * Constructor de queries para propiedades
 * Aplica el principio de Responsabilidad Única (SRP)
 */
class PropertyQueryBuilder {
  /**
   * Construye la consulta y parámetros para obtener todas las propiedades
   * @param {Object} filters - Filtros aplicados
   * @param {string|null} userId - ID del usuario (null para admin)
   * @param {Object} pagination - Configuración de paginación
   * @returns {Object} Objeto con query y parámetros
   */
  buildGetAllQuery(filters, userId, pagination) {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    // Filter by ownerId if not ADMIN
    if (userId) {
      whereConditions.push('p.ownerId = ?');
      params.push(userId);
    }

    // Aplicar filtros
    const filterMappings = {
      type: 'p.type = ?',
      status: 'p.status = ?',
      city: 'p.city LIKE ?',
      minPrice: 'p.price >= ?',
      maxPrice: 'p.price <= ?',
      search: '(p.title LIKE ? OR p.address LIKE ? OR p.city LIKE ? OR p.state LIKE ?)'
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value && filterMappings[key]) {
        if (key === 'city') {
          whereConditions.push(filterMappings[key]);
          params.push(`%${value}%`);
        } else if (key === 'minPrice' || key === 'maxPrice') {
          whereConditions.push(filterMappings[key]);
          params.push(parseFloat(value));
        } else if (key === 'search') {
          whereConditions.push(filterMappings[key]);
          const searchParam = `%${value}%`;
          params.push(searchParam, searchParam, searchParam, searchParam);
        } else {
          whereConditions.push(filterMappings[key]);
          params.push(value);
        }
      }
    });

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM properties p ${whereClause}`;

    // Query principal con paginación
    const dataQuery = `
      SELECT
        p.*,
        u.id as owner_id,
        u.name as owner_name,
        u.email as owner_email,
        COUNT(t.id) as transaction_count
      FROM properties p
      LEFT JOIN users u ON p.ownerId = u.id
      LEFT JOIN transactions t ON p.id = t.propertyId
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.createdAt DESC
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
   * Construye la consulta para obtener una propiedad por ID
   * @param {string} id - ID de la propiedad
   * @param {string|null} userId - ID del usuario (null para admin)
   * @returns {Object} Objeto con query y parámetros
   */
  buildGetByIdQuery(id, userId) {
    let query = `
      SELECT
        p.*,
        u.id as owner_id,
        u.name as owner_name,
        u.email as owner_email
      FROM properties p
      LEFT JOIN users u ON p.ownerId = u.id
      WHERE p.id = ?
    `;

    let params = [id];

    if (userId) {
      query += ' AND p.ownerId = ?';
      params.push(userId);
    }

    return { query, params };
  }

  /**
   * Construye la consulta para crear una propiedad
   * @param {Object} propertyData - Datos de la propiedad
   * @returns {Object} Objeto con query y parámetros
   */
  buildCreateQuery(propertyData) {
    const {
      id, title, description, type, status, price,
      address, city, state, zipCode, bedrooms, bathrooms, area, yearBuilt,
      features, images, ownerId, createdAt, updatedAt
    } = propertyData;

    const query = `
      INSERT INTO properties (
        id, title, description, type, status, price,
        address, city, state, zipCode, bedrooms, bathrooms, area, yearBuilt,
        features, images, ownerId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id, title, description, type, status, price,
      address, city, state, zipCode, bedrooms, bathrooms, area, yearBuilt,
      features, images, ownerId, createdAt, updatedAt
    ];

    return { query, params };
  }

  /**
   * Construye la consulta para actualizar una propiedad
   * @param {string} id - ID de la propiedad
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
      UPDATE properties
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    return { query, params };
  }

  /**
   * Construye la consulta para obtener transacciones de una propiedad
   * @param {string} propertyId - ID de la propiedad
   * @returns {Object} Objeto con query y parámetros
   */
  buildGetTransactionsQuery(propertyId) {
    const query = `
      SELECT
        t.*,
        c.firstName as client_firstName,
        c.lastName as client_lastName,
        c.email as client_email
      FROM transactions t
      LEFT JOIN clients c ON t.clientId = c.id
      WHERE t.propertyId = ?
      ORDER BY t.createdAt DESC
    `;

    return { query, params: [propertyId] };
  }

  /**
   * Construye la consulta para obtener estadísticas de propiedades
   * @param {string|null} userId - ID del usuario (null para admin)
   * @returns {Object} Objeto con query y parámetros
   */
  buildStatsQuery(userId) {
    const whereClause = userId ? 'WHERE ownerId = ?' : '';
    const params = userId ? [userId] : [];

    const queries = {
      totalProperties: `SELECT COUNT(*) as count FROM properties ${whereClause}`,
      totalValue: `SELECT SUM(price) as sum FROM properties ${whereClause}`,
      byStatus: `
        SELECT status, COUNT(*) as count, SUM(price) as value
        FROM properties
        ${whereClause}
        GROUP BY status
      `,
      byType: `
        SELECT type, COUNT(*) as count, SUM(price) as value
        FROM properties
        ${whereClause}
        GROUP BY type
      `
    };

    return { queries, params };
  }
}

module.exports = PropertyQueryBuilder;