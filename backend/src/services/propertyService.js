const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

class PropertyService {
  constructor() {
    this.db = new Database('./dev.db');
    this.db.pragma('journal_mode = WAL');

    // Crear tabla si no existe
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'AVAILABLE',
        price REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zipCode TEXT,
        bedrooms INTEGER,
        bathrooms REAL,
        area REAL,
        yearBuilt INTEGER,
        features TEXT,
        images TEXT,
        ownerId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        propertyId TEXT NOT NULL,
        clientId TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        amount REAL NOT NULL,
        transactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
      );
    `);

    // Add currency column if it doesn't exist
    const columnInfo = this.db.prepare("PRAGMA table_info(properties)").all();
    const hasCurrencyColumn = columnInfo.some(info => info.name === 'currency');
    if (!hasCurrencyColumn) {
      this.db.exec("ALTER TABLE properties ADD COLUMN currency TEXT DEFAULT 'USD'");
    }
  }

  async getAllProperties(filters = {}, userId = null) {
    const {
      type,
      status,
      minPrice,
      maxPrice,
      city,
      search, // Usamos 'search' en lugar de 'state' para el campo de búsqueda general
      page = 1,
      limit = 10
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // Filter by ownerId if not ADMIN
    if (userId) {
      whereClause += ' AND p.ownerId = ?';
      params.push(userId);
    }

    if (type) {
      whereClause += ' AND p.type = ?';
      params.push(type);
    }
    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }
    if (city) {
      whereClause += ' AND LOWER(p.city) LIKE LOWER(?)';
      params.push(`%${city}%`);
    }
    if (search) { // General search for title, address, city, state
      whereClause += ' AND (LOWER(p.title) LIKE LOWER(?) OR LOWER(p.address) LIKE LOWER(?) OR LOWER(p.city) LIKE LOWER(?) OR LOWER(p.state) LIKE LOWER(?))';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (minPrice) {
      whereClause += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      whereClause += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    const skip = (page - 1) * limit;

    const propertiesStmt = this.db.prepare(`
      SELECT
        p.*,
        u.name as ownerName,
        u.email as ownerEmail,
        COUNT(t.id) as transactionCount
      FROM properties p
      LEFT JOIN users u ON p.ownerId = u.id
      LEFT JOIN transactions t ON p.id = t.propertyId
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `);
    const properties = propertiesStmt.all(...params, limit, skip).map(p => ({
      ...p,
      owner: { id: p.ownerId, name: p.ownerName, email: p.ownerEmail },
      transactionCount: p.transactionCount,
      features: p.features ? JSON.parse(p.features) : [],
      images: p.images ? JSON.parse(p.images) : [],
      price: parseFloat(p.price),
      currency: p.currency, // Incluimos la moneda
      bedrooms: p.bedrooms ? parseInt(p.bedrooms) : null,
      bathrooms: p.bathrooms ? parseFloat(p.bathrooms) : null,
      area: p.area ? parseFloat(p.area) : null,
      yearBuilt: p.yearBuilt ? parseInt(p.yearBuilt) : null,
    }));

    const totalStmt = this.db.prepare(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM properties p
      LEFT JOIN users u ON p.ownerId = u.id
      ${whereClause}
    `);
    const totalResult = totalStmt.get(...params);
    const total = totalResult.count;

    return {
      properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getPropertyById(id, userId = null) {
    let whereClause = 'WHERE p.id = ?';
    const params = [id];

    if (userId) {
      whereClause += ' AND p.ownerId = ?';
      params.push(userId);
    }

    const propertyStmt = this.db.prepare(`
      SELECT
        p.*,
        u.name as ownerName,
        u.email as ownerEmail
      FROM properties p
      LEFT JOIN users u ON p.ownerId = u.id
      ${whereClause}
    `);
    const property = propertyStmt.get(...params);

    if (!property) {
      throw new Error('Propiedad no encontrada');
    }

    const transactionsStmt = this.db.prepare(`
      SELECT
        t.*,
        c.firstName as clientFirstName,
        c.lastName as clientLastName,
        c.email as clientEmail
      FROM transactions t
      LEFT JOIN clients c ON t.clientId = c.id
      WHERE t.propertyId = ?
    `);
    const transactions = transactionsStmt.all(id).map(t => ({
      ...t,
      client: { id: t.clientId, firstName: t.clientFirstName, lastName: t.clientLastName, email: t.clientEmail },
      amount: parseFloat(t.amount),
    }));


    return {
      ...property,
      owner: { id: property.ownerId, name: property.ownerName, email: property.ownerEmail },
      transactions: transactions,
      features: property.features ? JSON.parse(property.features) : [],
      images: property.images ? JSON.parse(property.images) : [],
      price: parseFloat(property.price),
      currency: property.currency, // Incluimos la moneda
      bedrooms: property.bedrooms ? parseInt(property.bedrooms) : null,
      bathrooms: property.bathrooms ? parseFloat(property.bathrooms) : null,
      area: property.area ? parseFloat(property.area) : null,
      yearBuilt: property.yearBuilt ? parseInt(property.yearBuilt) : null,
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
      images
    } = propertyData;

    // Validation
    if (!title || !type || !price || !address || !city || !state) {
      throw new Error('Campos requeridos faltantes');
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO properties (
        id, title, description, type, status, price, currency, address, city, state, zipCode,
        bedrooms, bathrooms, area, yearBuilt, features, images, ownerId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, title.trim(), description?.trim(), type, 'AVAILABLE', parseFloat(price), currency,
      address.trim(), city.trim(), state.trim(), zipCode?.trim(),
      bedrooms ? parseInt(bedrooms) : null, bathrooms ? parseFloat(bathrooms) : null,
      area ? parseFloat(area) : null, yearBuilt ? parseInt(yearBuilt) : null,
      features ? JSON.stringify(features) : null, images ? JSON.stringify(images) : null,
      ownerId, now, now
    );

    return this.getPropertyById(id, ownerId); // Retrieve the full property with owner info
  }

  async updateProperty(id, propertyData, userId) {
    // First check if property exists and user owns it
    const existingProperty = await this.getPropertyById(id, userId);

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
      images
    } = propertyData;

    const now = new Date().toISOString();
    let setClauses = [];
    const params = [];

    if (title !== undefined) { setClauses.push('title = ?'); params.push(title.trim()); }
    if (description !== undefined) { setClauses.push('description = ?'); params.push(description?.trim()); }
    if (type !== undefined) { setClauses.push('type = ?'); params.push(type); }
    if (status !== undefined) { setClauses.push('status = ?'); params.push(status); }
    if (price !== undefined) { setClauses.push('price = ?'); params.push(parseFloat(price)); }
    if (currency !== undefined) { setClauses.push('currency = ?'); params.push(currency); }
    if (address !== undefined) { setClauses.push('address = ?'); params.push(address.trim()); }
    if (city !== undefined) { setClauses.push('city = ?'); params.push(city.trim()); }
    if (state !== undefined) { setClauses.push('state = ?'); params.push(state.trim()); }
    if (zipCode !== undefined) { setClauses.push('zipCode = ?'); params.push(zipCode?.trim()); }
    if (bedrooms !== undefined) { setClauses.push('bedrooms = ?'); params.push(bedrooms ? parseInt(bedrooms) : null); }
    if (bathrooms !== undefined) { setClauses.push('bathrooms = ?'); params.push(bathrooms ? parseFloat(bathrooms) : null); }
    if (area !== undefined) { setClauses.push('area = ?'); params.push(area ? parseFloat(area) : null); }
    if (yearBuilt !== undefined) { setClauses.push('yearBuilt = ?'); params.push(yearBuilt ? parseInt(yearBuilt) : null); }
    if (features !== undefined) { setClauses.push('features = ?'); params.push(features ? JSON.stringify(features) : null); }
    if (images !== undefined) { setClauses.push('images = ?'); params.push(images ? JSON.stringify(images) : null); }

    setClauses.push('updatedAt = ?');
    params.push(now);

    if (setClauses.length === 0) {
      return existingProperty; // No changes to apply
    }

    const stmt = this.db.prepare(`
      UPDATE properties
      SET ${setClauses.join(', ')}
      WHERE id = ? AND ownerId = ?
    `);
    stmt.run(...params, id, userId);

    return this.getPropertyById(id, userId);
  }

  async deleteProperty(id, userId) {
    // First check if property exists and user owns it
    await this.getPropertyById(id, userId);

    // Check if property has active transactions
    const activeTransactionsStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE propertyId = ? AND status IN ('PENDING', 'IN_PROGRESS')
    `);
    const activeTransactionsResult = activeTransactionsStmt.get(id);

    if (activeTransactionsResult.count > 0) {
      throw new Error('No se puede eliminar una propiedad con transacciones activas');
    }

    const stmt = this.db.prepare('DELETE FROM properties WHERE id = ? AND ownerId = ?');
    const result = stmt.run(id, userId);

    if (result.changes === 0) {
      throw new Error('Propiedad no encontrada o no tienes permiso para eliminarla');
    }

    return { message: 'Propiedad eliminada exitosamente' };
  }

  async getPropertyStats(userId = null) {
    try {
      let whereClause = '';
      const params = [];

      if (userId) {
        whereClause = 'WHERE ownerId = ?';
        params.push(userId);
      }

      // Get total count
      const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM properties ${whereClause}`);
      const countResult = countStmt.get(...params);
      const totalProperties = countResult.count;

      // Get total value
      const valueStmt = this.db.prepare(`SELECT SUM(price) as total FROM properties ${whereClause}`);
      const valueResult = valueStmt.get(...params);
      const totalValue = valueResult.total || 0;

      // Get stats by status
      const statusStmt = this.db.prepare(`
        SELECT status, COUNT(*) as count, SUM(price) as value
        FROM properties ${whereClause}
        GROUP BY status
      `);
      const statusStats = statusStmt.all(...params);

      // Get stats by type
      const typeStmt = this.db.prepare(`
        SELECT type, COUNT(*) as count, SUM(price) as value
        FROM properties ${whereClause}
        GROUP BY type
      `);
      const typeStats = typeStmt.all(...params);

      return {
        totalProperties,
        totalValue,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = { count: stat.count, value: stat.value || 0 };
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, stat) => {
          acc[stat.type] = { count: stat.count, value: stat.value || 0 };
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
    this.db.close();
  }
}

module.exports = new PropertyService();