const Database = require('better-sqlite3');

class PropertyService {
  constructor() {
    this.db = new Database('./dev.db');
    // Crear tabla si no existe
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        type TEXT,
        status TEXT DEFAULT 'AVAILABLE',
        price REAL,
        address TEXT,
        city TEXT,
        state TEXT,
        zipCode TEXT,
        bedrooms INTEGER,
        bathrooms REAL,
        area REAL,
        yearBuilt INTEGER,
        features TEXT,
        images TEXT,
        ownerId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Get all properties with filters
  async getAllProperties(filters = {}, userId = null) {
    const {
      type,
      status,
      minPrice,
      maxPrice,
      city,
      state,
      bedrooms,
      bathrooms,
      page = 1,
      limit = 10
    } = filters;

    const where = {};

    // If userId provided, only show properties owned by this user (unless admin)
    if (userId) {
      where.ownerId = userId;
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) };
    if (bathrooms) where.bathrooms = { gte: parseFloat(bathrooms) };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              transactions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.property.count({ where })
    ]);

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

  // Get property by ID
  async getPropertyById(id, userId = null) {
    const where = { id };

    // If userId provided, ensure user owns the property (unless admin)
    if (userId) {
      where.ownerId = userId;
    }

    const property = await prisma.property.findFirst({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transactions: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!property) {
      throw new Error('Propiedad no encontrada');
    }

    return property;
  }

  // Create new property
  async createProperty(propertyData, ownerId) {
    const {
      title,
      description,
      type,
      price,
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

    const property = await prisma.property.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        type,
        status: 'AVAILABLE',
        price: parseFloat(price),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode?.trim(),
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseFloat(bathrooms) : null,
        area: area ? parseFloat(area) : null,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        features: features ? JSON.stringify(features) : null,
        images: images ? JSON.stringify(images) : null,
        ownerId
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return property;
  }

  // Update property
  async updateProperty(id, propertyData, userId) {
    // First check if property exists and user owns it
    await this.getPropertyById(id, userId);

    const {
      title,
      description,
      type,
      status,
      price,
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

    const property = await prisma.property.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(type && { type }),
        ...(status && { status }),
        ...(price && { price: parseFloat(price) }),
        ...(address && { address: address.trim() }),
        ...(city && { city: city.trim() }),
        ...(state && { state: state.trim() }),
        ...(zipCode !== undefined && { zipCode: zipCode?.trim() }),
        ...(bedrooms !== undefined && { bedrooms: bedrooms ? parseInt(bedrooms) : null }),
        ...(bathrooms !== undefined && { bathrooms: bathrooms ? parseFloat(bathrooms) : null }),
        ...(area !== undefined && { area: area ? parseFloat(area) : null }),
        ...(yearBuilt !== undefined && { yearBuilt: yearBuilt ? parseInt(yearBuilt) : null }),
        ...(features !== undefined && { features: features ? JSON.stringify(features) : null }),
        ...(images !== undefined && { images: images ? JSON.stringify(images) : null })
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return property;
  }

  // Delete property
  async deleteProperty(id, userId) {
    // First check if property exists and user owns it
    await this.getPropertyById(id, userId);

    // Check if property has active transactions
    const activeTransactions = await prisma.transaction.count({
      where: {
        propertyId: id,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    if (activeTransactions > 0) {
      throw new Error('No se puede eliminar una propiedad con transacciones activas');
    }

    await prisma.property.delete({
      where: { id }
    });

    return { message: 'Propiedad eliminada exitosamente' };
  }

  // Get property statistics
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
