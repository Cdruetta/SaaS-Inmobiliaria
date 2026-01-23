const { PrismaClient } = require('@prisma/client');
const ClientValidator = require('./validation/ClientValidator');
const ClientQueryBuilder = require('./queries/ClientQueryBuilder');
const ClientFormatter = require('./formatters/ClientFormatter');

class ClientService {
  constructor(database = null) {
    // Usar solo Prisma Client - más simple y directo
    this.prisma = new PrismaClient();
    this.validator = new ClientValidator();
    this.queryBuilder = new ClientQueryBuilder();
    this.formatter = new ClientFormatter();
  }

  // Get all clients with filters
  async getAllClients(filters = {}, agentId = null) {
    try {
      const pagination = {
        page: parseInt(filters.page) || 1,
        limit: parseInt(filters.limit) || 10
      };

      // Usar el query builder para construir la consulta
      const { countQuery, dataQuery, params, countParams } = this.queryBuilder.buildGetAllQuery(
        filters,
        agentId,
        pagination
      );

      // Ejecutar consultas
      const { total } = this.db.get(countQuery, countParams);
      const rows = this.db.all(dataQuery, params);

      // Formatear respuesta
      const clients = this.formatter.formatClients(rows);

      return {
        clients,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit)
        }
      };
    } catch (error) {
      console.error('Error in getAllClients:', error);
      return {
        clients: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  // Get client by ID
  async getClientById(id, agentId = null) {
    try {
      // Construir y ejecutar query de cliente
      const { query: clientQuery, params: clientParams } = this.queryBuilder.buildGetByIdQuery(id, agentId);
      const clientRow = this.db.get(clientQuery, clientParams);

    if (!clientRow) {
      throw new Error('Cliente no encontrado');
    }

      // Obtener transacciones
      const { query: transactionsQuery, params: transactionsParams } = this.queryBuilder.buildGetTransactionsQuery(id);
      const transactionRows = this.db.all(transactionsQuery, transactionsParams);

      // Formatear respuesta
      const client = this.formatter.formatClientRow(clientRow);
      const transactions = this.formatter.formatTransactions(transactionRows);

    return {
        ...client,
      transactionCount: transactions.length,
        transactions
    };
    } catch (error) {
      console.error('Error in getClientById:', error);
      throw error;
    }
  }

  // Create new client
  async createClient(clientData, agentId) {
    try {
      // Validar datos
      this.validator.validateCreate(clientData);

      // Verificar que el agente existe en la base de datos
      const userCheck = this.db.get('SELECT id FROM users WHERE id = ?', [agentId]);
      if (!userCheck) {
        throw new Error('El agente especificado no existe en la base de datos');
      }

      // Verificar si ya existe un cliente con ese email para este agente
      const { query: checkQuery, params: checkParams } = this.queryBuilder.buildCheckExistingQuery(
        clientData.email,
        agentId
      );
      const existingClient = this.db.get(checkQuery, checkParams);

      if (existingClient) {
        throw new Error('Ya existe un cliente con este email para este agente');
      }

      // Generar ID y timestamps
      const { v4: uuidv4 } = require('uuid');
      const now = new Date().toISOString();
      const clientId = uuidv4();

      // Sanitizar datos
      const sanitizedData = this.validator.sanitize(clientData);

      // Preparar datos para inserción
      const clientToInsert = {
        ...sanitizedData,
        id: clientId,
        agentId,
        createdAt: now,
        updatedAt: now,
        preferences: sanitizedData.preferences ? JSON.stringify(sanitizedData.preferences) : null
      };

      // Crear cliente
      const { query, params } = this.queryBuilder.buildCreateQuery(clientToInsert);
      this.db.run(query, params);

      // Obtener cliente creado con información del agente
      const { query: selectQuery, params: selectParams } = this.queryBuilder.buildGetByIdQuery(clientId, null);
      const row = this.db.get(selectQuery, selectParams);

      // Formatear respuesta
      return this.formatter.formatClientRow({ ...row, transaction_count: 0 });
    } catch (error) {
      console.error('Error creating client:', error);
      
      // Mejorar mensajes de error
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        throw new Error('El agente especificado no existe en la base de datos');
      }
      
      throw error;
    }
  }

  // Update client
  async updateClient(id, clientData, agentId) {
    try {
      // Verificar que el cliente existe y el usuario tiene permisos
      const { query: checkQuery, params: checkParams } = this.queryBuilder.buildGetByIdQuery(id, agentId);
      const existingRow = this.db.get(checkQuery, checkParams);

    if (!existingRow) {
      throw new Error('Cliente no encontrado o no tienes permiso para modificarlo');
    }

      // Validar datos si se proporcionan
      if (clientData.email !== undefined) {
        this.validator.validateEmail(clientData.email);
      }

      // Preparar campos a actualizar
      const updates = {};
      const fieldsToUpdate = [
        'firstName', 'lastName', 'email', 'phone', 'address', 'preferences'
      ];

      fieldsToUpdate.forEach(field => {
        if (clientData[field] !== undefined) {
          if (field === 'firstName' || field === 'lastName' || field === 'phone' || field === 'address') {
            updates[field] = clientData[field]?.trim() || null;
          } else if (field === 'email') {
            updates[field] = clientData[field]?.toLowerCase().trim();
          } else if (field === 'preferences') {
            updates[field] = clientData[field] ? JSON.stringify(clientData[field]) : null;
          } else {
            updates[field] = clientData[field];
          }
        }
      });

      if (Object.keys(updates).length === 0) {
        return this.formatter.formatClientRow(existingRow);
    }

      // Agregar timestamp de actualización
      updates.updatedAt = new Date().toISOString();

      // Actualizar cliente
      const { query: updateQuery, params: updateParams } = this.queryBuilder.buildUpdateQuery(id, updates);
      this.db.run(updateQuery, updateParams);

      // Obtener cliente actualizado
      const { query: selectQuery, params: selectParams } = this.queryBuilder.buildGetByIdQuery(id, null);
      const updatedRow = this.db.get(selectQuery, selectParams);

      return this.formatter.formatClientRow(updatedRow);
    } catch (error) {
      console.error('Error in updateClient:', error);
      throw error;
    }
  }


  // Delete client
  async deleteClient(id, agentId) {
    try {
      // Verificar que el cliente existe y el usuario tiene permisos
      const { query: checkQuery, params: checkParams } = this.queryBuilder.buildGetByIdQuery(id, agentId);
      const client = this.db.get(checkQuery, checkParams);

    if (!client) {
      throw new Error('Cliente no encontrado o no tienes permiso para eliminarlo');
    }

      // Verificar que no tenga transacciones activas
      const { query: transactionsQuery, params: transactionsParams } = this.queryBuilder.buildCheckActiveTransactionsQuery(id);
      const { count: activeTransactionsCount } = this.db.get(transactionsQuery, transactionsParams);

    if (activeTransactionsCount > 0) {
      throw new Error('No se puede eliminar un cliente con transacciones activas');
    }

      // Eliminar cliente
      this.db.run('DELETE FROM clients WHERE id = ?', [id]);

    return { message: 'Cliente eliminado exitosamente' };
    } catch (error) {
      console.error('Error in deleteClient:', error);
      throw error;
    }
  }

  // Get client statistics
  async getClientStats(agentId = null) {
    try {
      const { queries, params } = this.queryBuilder.buildStatsQuery(agentId);

      // Ejecutar consultas
      const totalClients = this.db.get(queries.totalClients, params).count;
      const activeClients = this.db.get(queries.activeClients, params).count;

      // Formatear respuesta
      return this.formatter.formatStats(totalClients, activeClients);
    } catch (error) {
      console.error('Error in getClientStats:', error);
      return {
        totalClients: 0,
        activeClients: 0,
        inactiveClients: 0
      };
    }
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new ClientService();
