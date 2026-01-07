const Database = require('better-sqlite3');
const path = require('path');

class PropertyService {
  constructor() {
    this.db = new Database(path.join(__dirname, '../../dev.db'));
  }

  async getAllProperties(filters = {}, userId = null) {
    const {
      type,
      status,
      listingType,
      minPrice,
      maxPrice,
      city,
      search,
      page = 1,
      limit = 10
    } = filters;

    // Build SQL query dynamically
    let whereConditions = [];
    let params = [];

    // Filter by ownerId if not ADMIN
    if (userId) {
      whereConditions.push('p.ownerId = ?');
      params.push(userId);
    }

    if (type) {
      whereConditions.push('p.type = ?');
      params.push(type);
    }
    if (status) {
      whereConditions.push('p.status = ?');
      params.push(status);
    }
    if (listingType) {
      whereConditions.push('p.listingType = ?');
      params.push(listingType);
    }
    if (city) {
      whereConditions.push('p.city LIKE ?');
      params.push(`%${city}%`);
    }
    if (minPrice) {
      whereConditions.push('p.price >= ?');
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      whereConditions.push('p.price <= ?');
      params.push(parseFloat(maxPrice));
    }
    if (search) {
      whereConditions.push('(p.title LIKE ? OR p.address LIKE ? OR p.city LIKE ? OR p.state LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM properties p
      ${whereClause}
    `;
    const { total } = this.db.prepare(countQuery).get(...params);

    // Get properties with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const propertiesQuery = `
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

    params.push(parseInt(limit), offset);
    const rows = this.db.prepare(propertiesQuery).all(...params);

    // Format the response
    const formattedProperties = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      price: row.price,
      currency: row.currency,
      listingType: row.listingType,
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
      owner: {
        id: row.owner_id,
        name: row.owner_name,
        email: row.owner_email
      },
      transactionCount: row.transaction_count,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    return {
      properties: formattedProperties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  async getPropertyById(id, userId = null) {
    // Build query (if userId is null, it's admin and can see all properties)
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

    const propertyRow = this.db.prepare(query).get(...params);

    if (!propertyRow) {
      throw new Error('Propiedad no encontrada');
    }

    // Get transactions for this property
    const transactionsQuery = `
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

    const transactionRows = this.db.prepare(transactionsQuery).all(id);

    // Format transactions
    const transactions = transactionRows.map(t => ({
      id: t.id,
      type: t.type,
      status: t.status,
      amount: t.amount,
      commission: t.commission,
      notes: t.notes,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      clientId: t.clientId,
      agentId: t.agentId,
      client: {
        firstName: t.client_firstName,
        lastName: t.client_lastName,
        email: t.client_email
      }
    }));

    // Format the response
    return {
      id: propertyRow.id,
      title: propertyRow.title,
      description: propertyRow.description,
      type: propertyRow.type,
      status: propertyRow.status,
      price: propertyRow.price,
      currency: propertyRow.currency,
      listingType: propertyRow.listingType,
      address: propertyRow.address,
      city: propertyRow.city,
      state: propertyRow.state,
      zipCode: propertyRow.zipCode,
      bedrooms: propertyRow.bedrooms,
      bathrooms: propertyRow.bathrooms,
      area: propertyRow.area,
      yearBuilt: propertyRow.yearBuilt,
      features: propertyRow.features ? JSON.parse(propertyRow.features) : [],
      images: propertyRow.images ? JSON.parse(propertyRow.images) : [],
      ownerId: propertyRow.ownerId,
      owner: {
        id: propertyRow.owner_id,
        name: propertyRow.owner_name,
        email: propertyRow.owner_email
      },
      transactionCount: transactions.length,
      transactions: transactions,
      createdAt: propertyRow.createdAt,
      updatedAt: propertyRow.updatedAt
    };
  }

  async createProperty(propertyData, ownerId) {
    const {
      title,
      description,
      type,
      price,
      currency,
      address,
      city,
      state,
      zipCode,
      bedrooms,
      bathrooms,
      area,
      yearBuilt,
      features,
      images,
      listingType
    } = propertyData;

    // Validation
    if (!title || !type || !price || !address || !city || !state) {
      throw new Error('Campos requeridos faltantes');
    }

    const { v4: uuidv4 } = require('uuid');
    const now = new Date().toISOString();
    const propertyId = uuidv4();

    // Create property using better-sqlite3
    const insertStmt = this.db.prepare(`
      INSERT INTO properties (
        id, title, description, type, status, price, currency, listingType,
        address, city, state, zipCode, bedrooms, bathrooms, area, yearBuilt,
        features, images, ownerId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      propertyId,
      title.trim(),
      description?.trim() || null,
      type,
      'AVAILABLE', // default status
      parseFloat(price),
      currency || 'USD',
      listingType || 'SALE',
      address.trim(),
      city.trim(),
      state.trim(),
      zipCode?.trim() || null,
      bedrooms ? parseInt(bedrooms) : null,
      bathrooms ? parseFloat(bathrooms) : null,
      area ? parseFloat(area) : null,
      yearBuilt ? parseInt(yearBuilt) : null,
      features ? JSON.stringify(features) : null,
      images ? JSON.stringify(images) : null,
      ownerId,
      now,
      now
    );

    // Get the created property with owner info
    const selectStmt = this.db.prepare(`
      SELECT
        p.*,
        u.id as owner_id,
        u.name as owner_name,
        u.email as owner_email,
        0 as transaction_count
      FROM properties p
      LEFT JOIN users u ON p.ownerId = u.id
      WHERE p.id = ?
    `);

    const row = selectStmt.get(propertyId);

    // Format the response
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      price: row.price,
      currency: row.currency,
      listingType: row.listingType,
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
      owner: {
        id: row.owner_id,
        name: row.owner_name,
        email: row.owner_email
      },
      transactionCount: row.transaction_count,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async updateProperty(id, propertyData, userId) {
    // First check if property exists and user owns it
    let checkQuery = 'SELECT * FROM properties WHERE id = ?';
    let checkParams = [id];

    if (userId) {
      checkQuery += ' AND ownerId = ?';
      checkParams.push(userId);
    }

    const existingRow = this.db.prepare(checkQuery).get(...checkParams);

    if (!existingRow) {
      throw new Error('Propiedad no encontrada o no tienes permiso para modificarla');
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];

    const {
      title,
      description,
      type,
      status,
      price,
      currency,
      address,
      city,
      state,
      zipCode,
      bedrooms,
      bathrooms,
      area,
      yearBuilt,
      features,
      images,
      listingType
    } = propertyData;

    // Only add fields that are provided (not undefined)
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(title.trim());
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description?.trim() || null);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateParams.push(type);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }
    if (price !== undefined) {
      updateFields.push('price = ?');
      updateParams.push(parseFloat(price));
    }
    if (currency !== undefined) {
      updateFields.push('currency = ?');
      updateParams.push(currency);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateParams.push(address.trim());
    }
    if (city !== undefined) {
      updateFields.push('city = ?');
      updateParams.push(city.trim());
    }
    if (state !== undefined) {
      updateFields.push('state = ?');
      updateParams.push(state.trim());
    }
    if (zipCode !== undefined) {
      updateFields.push('zipCode = ?');
      updateParams.push(zipCode?.trim() || null);
    }
    if (bedrooms !== undefined) {
      updateFields.push('bedrooms = ?');
      updateParams.push(bedrooms ? parseInt(bedrooms) : null);
    }
    if (bathrooms !== undefined) {
      updateFields.push('bathrooms = ?');
      updateParams.push(bathrooms ? parseFloat(bathrooms) : null);
    }
    if (area !== undefined) {
      updateFields.push('area = ?');
      updateParams.push(area ? parseFloat(area) : null);
    }
    if (yearBuilt !== undefined) {
      updateFields.push('yearBuilt = ?');
      updateParams.push(yearBuilt ? parseInt(yearBuilt) : null);
    }
    if (features !== undefined) {
      updateFields.push('features = ?');
      updateParams.push(features ? JSON.stringify(features) : null);
    }
    if (images !== undefined) {
      updateFields.push('images = ?');
      updateParams.push(images ? JSON.stringify(images) : null);
    }
    if (listingType !== undefined) {
      updateFields.push('listingType = ?');
      updateParams.push(listingType);
    }

    // If no fields to update, return existing property formatted
    if (updateFields.length === 0) {
      return this.formatPropertyRow(existingRow);
    }

    // Add updatedAt and id to params
    updateFields.push('updatedAt = ?');
    updateParams.push(new Date().toISOString());
    updateParams.push(id);

    // Update the property
    const updateQuery = `
      UPDATE properties
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    this.db.prepare(updateQuery).run(...updateParams);

    // Get the updated property
    const selectStmt = this.db.prepare(`
      SELECT
        p.*,
        u.id as owner_id,
        u.name as owner_name,
        u.email as owner_email,
        COUNT(t.id) as transaction_count
      FROM properties p
      LEFT JOIN users u ON p.ownerId = u.id
      LEFT JOIN transactions t ON p.id = t.propertyId
      WHERE p.id = ?
      GROUP BY p.id
    `);

    const row = selectStmt.get(id);
    return this.formatPropertyRow(row);
  }

  // Helper method to format property row
  formatPropertyRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      price: row.price,
      currency: row.currency,
      listingType: row.listingType,
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
      owner: {
        id: row.owner_id,
        name: row.owner_name,
        email: row.owner_email
      },
      transactionCount: row.transaction_count || 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async deleteProperty(id, userId) {
    // First check if property exists and user owns it (if not admin)
    let checkQuery = 'SELECT id FROM properties WHERE id = ?';
    let checkParams = [id];

    if (userId) {
      checkQuery += ' AND ownerId = ?';
      checkParams.push(userId);
    }

    const property = this.db.prepare(checkQuery).get(...checkParams);

    if (!property) {
      throw new Error('Propiedad no encontrada o no tienes permiso para eliminarla');
    }

    // Check if property has active transactions
    const activeTransactionsCount = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE propertyId = ? AND status IN ('PENDING', 'IN_PROGRESS')
    `).get(id).count;

    if (activeTransactionsCount > 0) {
      throw new Error('No se puede eliminar una propiedad con transacciones activas');
    }

    // Delete the property
    this.db.prepare('DELETE FROM properties WHERE id = ?').run(id);

    return { message: 'Propiedad eliminada exitosamente' };
  }

  async getPropertyStats(userId = null) {
    try {
      // Build where clause for SQL
      const whereClause = userId ? 'WHERE ownerId = ?' : '';
      const whereParams = userId ? [userId] : [];

      // Get total count
      const totalProperties = this.db.prepare(`SELECT COUNT(*) as count FROM properties ${whereClause}`).get(...whereParams).count;

      // Get total value
      const totalValue = this.db.prepare(`SELECT SUM(price) as sum FROM properties ${whereClause}`).get(...whereParams).sum || 0;

      // Get stats by status
      const statusQuery = `
        SELECT status, COUNT(*) as count, SUM(price) as value
        FROM properties
        ${whereClause}
        GROUP BY status
      `;
      const statusRows = this.db.prepare(statusQuery).all(...whereParams);

      // Get stats by type
      const typeQuery = `
        SELECT type, COUNT(*) as count, SUM(price) as value
        FROM properties
        ${whereClause}
        GROUP BY type
      `;
      const typeRows = this.db.prepare(typeQuery).all(...whereParams);

      return {
        totalProperties,
        totalValue,
        byStatus: statusRows.reduce((acc, row) => {
          acc[row.status] = { count: row.count, value: row.value || 0 };
          return acc;
        }, {}),
        byType: typeRows.reduce((acc, row) => {
          acc[row.type] = { count: row.count, value: row.value || 0 };
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error in getPropertyStats:', error);
      return {
        totalProperties: 0,
        totalValue: 0,
        byStatus: {},
        byType: {}
      };
    }
  }

  // Close database connection
  close() {
    // better-sqlite3 closes automatically when the process ends
    // but we can explicitly close if needed
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new PropertyService();