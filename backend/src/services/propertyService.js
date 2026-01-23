const { PrismaClient } = require('@prisma/client');
const PropertyValidator = require('./validation/PropertyValidator');
const PropertyQueryBuilder = require('./queries/PropertyQueryBuilder');
const PropertyFormatter = require('./formatters/PropertyFormatter');

class PropertyService {
  constructor(database = null) {
    // Usar solo Prisma Client - más simple y directo
    this.prisma = new PrismaClient();
    this.validator = new PropertyValidator();
    this.queryBuilder = new PropertyQueryBuilder();
    this.formatter = new PropertyFormatter();
  }

  async getAllProperties(filters = {}, userId = null) {
    try {
      const pagination = {
        page: parseInt(filters.page) || 1,
        limit: parseInt(filters.limit) || 10
      };

      // Construir where clause con Prisma
      let whereClause = {};
      if (userId) {
        whereClause.ownerId = userId;
      }

      // Aplicar filtros
      if (filters.search) {
        whereClause.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { address: { contains: filters.search, mode: 'insensitive' } },
          { city: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.type) {
        whereClause.type = filters.type;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.minPrice || filters.maxPrice) {
        whereClause.price = {};
        if (filters.minPrice) whereClause.price.gte = parseFloat(filters.minPrice);
        if (filters.maxPrice) whereClause.price.lte = parseFloat(filters.maxPrice);
      }

      // Ejecutar consultas con Prisma
      const [total, propertiesData] = await Promise.all([
        this.prisma.property.count({ where: whereClause }),
        this.prisma.property.findMany({
          where: whereClause,
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            }
          },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
          orderBy: { createdAt: 'desc' }
        })
      ]);

      // Formatear respuesta
      const properties = this.formatter.formatProperties(propertiesData);

    return {
        properties,
      pagination: {
          page: pagination.page,
          limit: pagination.limit,
        total,
          pages: Math.ceil(total / pagination.limit)
      }
    };
    } catch (error) {
      console.error('Error in getAllProperties:', error);
      throw error;
    }
  }

  async getPropertyById(id, userId = null) {
    try {
      // Usar Prisma para obtener propiedad con transacciones
      const propertyData = await this.prisma.property.findFirst({
        where: {
          id: id,
          ...(userId && { ownerId: userId })
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          transactions: {
            include: {
              client: {
                select: { id: true, firstName: true, lastName: true }
              },
              agent: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

    if (!propertyData) {
      throw new Error('Propiedad no encontrada');
    }

      // Los datos ya incluyen transacciones

      // Formatear respuesta
      const property = this.formatter.formatPropertyRow(propertyData);
      const transactions = this.formatter.formatTransactions(propertyData.transactions);

    return {
        ...property,
      transactionCount: transactions.length,
        transactions
    };
    } catch (error) {
      console.error('Error in getPropertyById:', error);
      throw error;
    }
  }

  async createProperty(propertyData, ownerId) {
    try {
      // Validar datos
      this.validator.validateCreate(propertyData);

      // Generar ID y timestamps
    const { v4: uuidv4 } = require('uuid');
    const now = new Date().toISOString();
    const propertyId = uuidv4();

      // Sanitizar datos
      const sanitizedData = this.validator.sanitize(propertyData);

      // Preparar datos para inserción
      const propertyToInsert = {
        ...sanitizedData,
        id: propertyId,
      ownerId,
        createdAt: now,
        updatedAt: now,
        features: JSON.stringify(sanitizedData.features),
        images: JSON.stringify(sanitizedData.images)
      };

      // Crear propiedad con Prisma
      const propertyData = {
        id: propertyId,
        title: sanitizedData.title,
        description: sanitizedData.description,
        type: sanitizedData.type,
        status: sanitizedData.status,
        price: sanitizedData.price,
        address: sanitizedData.address,
        city: sanitizedData.city,
        state: sanitizedData.state,
        zipCode: sanitizedData.zipCode,
        bedrooms: sanitizedData.bedrooms,
        bathrooms: sanitizedData.bathrooms,
        area: sanitizedData.area,
        yearBuilt: sanitizedData.yearBuilt,
        features: sanitizedData.features,
        images: sanitizedData.images,
        ownerId: ownerId
      };

      const createdProperty = await this.prisma.property.create({
        data: propertyData,
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Formatear respuesta
      return this.formatter.formatPropertyRow({ ...createdProperty, transaction_count: 0 });
    } catch (error) {
      console.error('Error in createProperty:', error);
      throw error;
    }
  }

  async updateProperty(id, propertyData, userId) {
    try {
      // Verificar que la propiedad existe y el usuario tiene permisos
      const existingProperty = await this.prisma.property.findFirst({
        where: {
          id: id,
          ...(userId && { ownerId: userId })
        }
      });

    if (!existingProperty) {
      throw new Error('Propiedad no encontrada o no tienes permiso para modificarla');
    }

      // Validar datos si se proporcionan
      if (propertyData.price !== undefined) {
        this.validator.validatePrice(propertyData.price);
    }
      if (propertyData.type !== undefined) {
        this.validator.validateType(propertyData.type);
    }
      if (propertyData.status !== undefined) {
        this.validator.validateStatus(propertyData.status);
    }

      // Preparar campos a actualizar
      const updates = {};
      const fieldsToUpdate = [
        'title', 'description', 'type', 'status', 'price',
        'address', 'city', 'state', 'zipCode', 'bedrooms',
        'bathrooms', 'area', 'yearBuilt', 'features', 'images'
      ];

      fieldsToUpdate.forEach(field => {
        if (propertyData[field] !== undefined) {
          if (field === 'title' || field === 'description' || field === 'address' ||
              field === 'city' || field === 'state' || field === 'zipCode') {
            updates[field] = propertyData[field]?.trim() || null;
          } else if (field === 'price') {
            updates[field] = parseFloat(propertyData[field]);
          } else if (field === 'bedrooms' || field === 'yearBuilt') {
            updates[field] = propertyData[field] ? parseInt(propertyData[field]) : null;
          } else if (field === 'bathrooms' || field === 'area') {
            updates[field] = propertyData[field] ? parseFloat(propertyData[field]) : null;
          } else if (field === 'features' || field === 'images') {
            updates[field] = JSON.stringify(propertyData[field] || []);
          } else {
            updates[field] = propertyData[field];
    }
        }
      });

      if (Object.keys(updates).length === 0) {
        return this.formatter.formatPropertyRow(existingProperty);
    }

      // Actualizar propiedad con Prisma
      const updatedProperty = await this.prisma.property.update({
        where: { id: id },
        data: updates,
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return this.formatter.formatPropertyRow(updatedProperty);
    } catch (error) {
      console.error('Error in updateProperty:', error);
      throw error;
    }
  }


  async deleteProperty(id, userId) {
    // First check if property exists and user owns it (if not admin)
    let checkQuery = 'SELECT id FROM properties WHERE id = ?';
    let checkParams = [id];

    if (userId) {
      checkQuery += ' AND ownerId = ?';
      checkParams.push(userId);
    }

    // Check if property exists and user has permission
    const property = await this.prisma.property.findFirst({
      where: {
        id: id,
        ...(userId && { ownerId: userId })
      }
    });

    if (!property) {
      throw new Error('Propiedad no encontrada o no tienes permiso para eliminarla');
    }

    // Check if property has active transactions
    const activeTransactionsCount = await this.prisma.transaction.count({
      where: {
        propertyId: id,
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      }
    });

    if (activeTransactionsCount > 0) {
      throw new Error('No se puede eliminar una propiedad con transacciones activas');
    }

    // Delete the property using Prisma
    await this.prisma.property.delete({
      where: { id: id }
    });

    return { message: 'Propiedad eliminada exitosamente' };
  }

  async getPropertyStats(userId = null) {
    try {
      let whereClause = {};
      if (userId) {
        whereClause.ownerId = userId;
      }

      // Usar Prisma para estadísticas
      const [totalProperties, totalValueResult, statusStats, typeStats] = await Promise.all([
        this.prisma.property.count({ where: whereClause }),
        this.prisma.property.aggregate({
          where: whereClause,
          _sum: { price: true }
        }),
        this.prisma.property.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        }),
        this.prisma.property.groupBy({
          by: ['type'],
          where: whereClause,
          _count: { type: true }
        })
      ]);

      const totalValue = totalValueResult._sum.price || 0;

      // Formatear respuesta
      return this.formatter.formatStats(
        statusStats.map(s => ({ status: s.status, count: s._count.status })),
        typeStats.map(t => ({ type: t.type, count: t._count.type })),
        totalProperties,
        totalValue
      );
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
  async close() {
    await this.prisma.$disconnect();
  }
}

module.exports = new PropertyService();