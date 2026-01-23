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

      // Sanitizar datos
      const sanitizedData = this.validator.sanitize(clientData);

      // Crear cliente usando Prisma
      const client = await this.prisma.client.create({
        data: {
          firstName: sanitizedData.firstName,
          lastName: sanitizedData.lastName,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
          address: sanitizedData.address,
          preferences: sanitizedData.preferences || null,
          agentId: agentId
        },
        include: {
          agent: {
            select: { id: true, name: true, email: true }
          },
          transactions: {
            select: { id: true },
            where: {
              status: {
                in: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
              }
            }
          }
        }
      });

      // Formatear respuesta
      return this.formatter.formatClientRow({
        ...client,
        transaction_count: client.transactions.length
      });
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
      const existingClient = await this.prisma.client.findFirst({
        where: {
          id: id,
          ...(agentId && { agentId: agentId })
        },
        include: {
          agent: { select: { id: true, name: true, email: true } },
          transactions: {
            select: { id: true },
            where: {
              status: { in: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] }
            }
          }
        }
      });

      if (!existingClient) {
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
            updates[field] = clientData[field] || null;
          } else {
            updates[field] = clientData[field];
          }
        }
      });

      if (Object.keys(updates).length === 0) {
        return this.formatter.formatClientRow({
          ...existingClient,
          transaction_count: existingClient.transactions.length
        });
      }

      // Actualizar cliente usando Prisma
      const updatedClient = await this.prisma.client.update({
        where: { id: id },
        data: updates,
        include: {
          agent: { select: { id: true, name: true, email: true } },
          transactions: {
            select: { id: true },
            where: {
              status: { in: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] }
            }
          }
        }
      });

      // Formatear respuesta con cliente actualizado
      return this.formatter.formatClientRow({
        ...updatedClient,
        transaction_count: updatedClient.transactions.length
      });
    } catch (error) {
      console.error('Error in updateClient:', error);
      throw error;
    }
  }


  // Delete client
  async deleteClient(id, agentId) {
    try {
      // Verificar que el cliente existe y el usuario tiene permisos
      const client = await this.prisma.client.findFirst({
        where: {
          id: id,
          ...(agentId && { agentId: agentId })
        },
        include: {
          transactions: {
            where: {
              status: {
                in: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
              }
            }
          }
        }
      });

      if (!client) {
        throw new Error('Cliente no encontrado o no tienes permiso para eliminarlo');
      }

      // Verificar que no tenga transacciones activas
      if (client.transactions.length > 0) {
        throw new Error('No se puede eliminar un cliente con transacciones activas');
      }

      // Eliminar cliente usando Prisma
      await this.prisma.client.delete({
        where: { id: id }
      });

      return { message: 'Cliente eliminado exitosamente' };
    } catch (error) {
      console.error('Error in deleteClient:', error);
      throw error;
    }
  }

  // Get client statistics
  async getClientStats(agentId = null) {
    try {
      // Construir where clause
      let whereClause = {};
      if (agentId) {
        whereClause.agentId = agentId;
      }

      // Contar clientes totales
      const totalClients = await this.prisma.client.count({
        where: whereClause
      });

      // Contar clientes activos (que tienen transacciones)
      const activeClients = await this.prisma.client.count({
        where: {
          ...whereClause,
          transactions: {
            some: {
              status: {
                in: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
              }
            }
          }
        }
      });

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
