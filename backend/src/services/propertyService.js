const SQLiteDatabase = require('../repositories/implementations/SQLiteDatabase');
const PropertyValidator = require('./validation/PropertyValidator');
const PropertyQueryBuilder = require('./queries/PropertyQueryBuilder');
const PropertyFormatter = require('./formatters/PropertyFormatter');

class PropertyService {
  constructor(database = null) {
    // Dependency Injection - aplica DIP
    this.db = database || new SQLiteDatabase();
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

      // Usar el query builder para construir la consulta
      const { countQuery, dataQuery, params, countParams } = this.queryBuilder.buildGetAllQuery(
        filters,
        userId,
        pagination
      );

      // Ejecutar consultas
      const { total } = this.db.get(countQuery, countParams);
      const rows = this.db.all(dataQuery, params);

      // Formatear respuesta
      const properties = this.formatter.formatProperties(rows);

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
      // Construir y ejecutar query de propiedad
      const { query: propertyQuery, params: propertyParams } = this.queryBuilder.buildGetByIdQuery(id, userId);
      const propertyRow = this.db.get(propertyQuery, propertyParams);

      if (!propertyRow) {
        throw new Error('Propiedad no encontrada');
      }

      // Obtener transacciones
      const { query: transactionsQuery, params: transactionsParams } = this.queryBuilder.buildGetTransactionsQuery(id);
      const transactionRows = this.db.all(transactionsQuery, transactionsParams);

      // Formatear respuesta
      const property = this.formatter.formatPropertyRow(propertyRow);
      const transactions = this.formatter.formatTransactions(transactionRows);

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

      // Crear propiedad
      const { query, params } = this.queryBuilder.buildCreateQuery(propertyToInsert);
      this.db.run(query, params);

      // Obtener propiedad creada con información del owner
      const { query: selectQuery, params: selectParams } = this.queryBuilder.buildGetByIdQuery(propertyId, null);
      const row = this.db.get(selectQuery, selectParams);

      // Formatear respuesta
      return this.formatter.formatPropertyRow({ ...row, transaction_count: 0 });
    } catch (error) {
      console.error('Error in createProperty:', error);
      throw error;
    }
  }

  async updateProperty(id, propertyData, userId) {
    try {
      // Verificar que la propiedad existe y el usuario tiene permisos
      const { query: checkQuery, params: checkParams } = this.queryBuilder.buildGetByIdQuery(id, userId);
      const existingRow = this.db.get(checkQuery, checkParams);

      if (!existingRow) {
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
        return this.formatter.formatPropertyRow(existingRow);
      }

      // Agregar timestamp de actualización
      updates.updatedAt = new Date().toISOString();

      // Actualizar propiedad
      const { query: updateQuery, params: updateParams } = this.queryBuilder.buildUpdateQuery(id, updates);
      this.db.run(updateQuery, updateParams);

      // Obtener propiedad actualizada
      const { query: selectQuery, params: selectParams } = this.queryBuilder.buildGetByIdQuery(id, null);
      const updatedRow = this.db.get(selectQuery, selectParams);

      return this.formatter.formatPropertyRow(updatedRow);
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
      const { queries, params } = this.queryBuilder.buildStatsQuery(userId);

      // Ejecutar consultas
      const totalProperties = this.db.get(queries.totalProperties, params).count;
      const totalValueResult = this.db.get(queries.totalValue, params);
      const totalValue = totalValueResult.sum || 0;
      const statusRows = this.db.all(queries.byStatus, params);
      const typeRows = this.db.all(queries.byType, params);

      // Formatear respuesta
      return this.formatter.formatStats(statusRows, typeRows, totalProperties, totalValue);
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