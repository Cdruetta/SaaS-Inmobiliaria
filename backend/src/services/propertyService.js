const { PrismaClient } = require('@prisma/client');

class PropertyService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAllProperties(filters = {}, userId = null) {
    const {
      type,
      status,
      minPrice,
      maxPrice,
      city,
      search,
      page = 1,
      limit = 10
    } = filters;

    // Build where clause for Prisma
    const where = {};

    // Filter by ownerId if not ADMIN
    if (userId) {
      where.ownerId = userId;
    }

    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get properties with owner and transaction count
    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
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
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      this.prisma.property.count({ where })
    ]);

    // Format the response
    const formattedProperties = properties.map(p => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : [],
      images: p.images ? JSON.parse(p.images) : [],
      transactionCount: p._count.transactions
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
    // Build where clause (if userId is null, it's admin and can see all properties)
    const where = userId ? { id, ownerId: userId } : { id };

    const property = await this.prisma.property.findFirst({
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
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    if (!property) {
      throw new Error('Propiedad no encontrada');
    }

    // Format the response
    return {
      ...property,
      features: property.features ? JSON.parse(property.features) : [],
      images: property.images ? JSON.parse(property.images) : [],
      transactionCount: property._count.transactions,
      transactions: property.transactions.map(t => ({
        ...t,
        client: t.client
      }))
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

    // Create property using Prisma
    const property = await this.prisma.property.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        type,
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
        },
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    return {
      ...property,
      features: property.features ? JSON.parse(property.features) : [],
      images: property.images ? JSON.parse(property.images) : [],
      transactionCount: property._count.transactions
    };
  }

  async updateProperty(id, propertyData, userId) {
    // First check if property exists and user owns it
    const whereClause = userId ? { id, ownerId: userId } : { id };
    const existingProperty = await this.prisma.property.findFirst({
      where: whereClause,
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
      }
    });

    if (!existingProperty) {
      throw new Error('Propiedad no encontrada o no tienes permiso para modificarla');
    }

    // Format the existing property for consistency
    const formattedExistingProperty = {
      ...existingProperty,
      features: existingProperty.features ? JSON.parse(existingProperty.features) : [],
      images: existingProperty.images ? JSON.parse(existingProperty.images) : [],
      transactionCount: existingProperty._count.transactions
    };

    // Build update data
    const updateData = {};

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

    // Only add fields that are provided (not undefined)
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (address !== undefined) updateData.address = address.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (zipCode !== undefined) updateData.zipCode = zipCode?.trim();
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms ? parseInt(bedrooms) : null;
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms ? parseFloat(bathrooms) : null;
    if (area !== undefined) updateData.area = area ? parseFloat(area) : null;
    if (yearBuilt !== undefined) updateData.yearBuilt = yearBuilt ? parseInt(yearBuilt) : null;
    if (features !== undefined) updateData.features = features ? JSON.stringify(features) : null;
    if (images !== undefined) updateData.images = images ? JSON.stringify(images) : null;

    // If no fields to update, return existing property
    if (Object.keys(updateData).length === 0) {
      return formattedExistingProperty;
    }

    // Update the property
    const updatedProperty = await this.prisma.property.update({
      where: {
        id
      },
      data: updateData,
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
      }
    });

    // Format the response
    return {
      ...updatedProperty,
      features: updatedProperty.features ? JSON.parse(updatedProperty.features) : [],
      images: updatedProperty.images ? JSON.parse(updatedProperty.images) : [],
      transactionCount: updatedProperty._count.transactions
    };
  }

  async deleteProperty(id, userId) {
    // Build where clause for checking ownership
    const whereClause = userId ? { id, ownerId: userId } : { id };

    // First check if property exists and user owns it (if not admin)
    const property = await this.prisma.property.findFirst({
      where: whereClause
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

    // Delete the property
    await this.prisma.property.delete({
      where: {
        id
      }
    });

    return { message: 'Propiedad eliminada exitosamente' };
  }

  async getPropertyStats(userId = null) {
    try {
      // Build where clause for Prisma
      const where = {};
      if (userId) {
        where.ownerId = userId;
      }

      // Get total count
      const totalProperties = await this.prisma.property.count({
        where
      });

      // Get total value
      const totalValueResult = await this.prisma.property.aggregate({
        _sum: {
          price: true
        },
        where
      });
      const totalValue = totalValueResult._sum.price || 0;

      // Get stats by status
      const statusStats = await this.prisma.property.groupBy({
        by: ['status'],
        _count: {
          id: true
        },
        _sum: {
          price: true
        },
        where
      });

      // Get stats by type
      const typeStats = await this.prisma.property.groupBy({
        by: ['type'],
        _count: {
          id: true
        },
        _sum: {
          price: true
        },
        where
      });

      return {
        totalProperties,
        totalValue,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = { count: stat._count.id, value: stat._sum.price || 0 };
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, stat) => {
          acc[stat.type] = { count: stat._count.id, value: stat._sum.price || 0 };
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
  async close() {
    await this.prisma.$disconnect();
  }
}

module.exports = new PropertyService();