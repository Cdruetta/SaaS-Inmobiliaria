const { PrismaClient } = require('@prisma/client');
const ClientValidator = require('./validation/ClientValidator');

const prisma = new PrismaClient();

class ClientService {
  constructor() {
    this.prisma = prisma;
    this.validator = new ClientValidator();
  }

  // Get all clients with filters
  async getAllClients(filters = {}, agentId = null) {
    try {
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      // Construir where clause
      const where = {};
      if (agentId) {
        where.agentId = agentId;
      }

      // Agregar filtros de búsqueda
      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Ejecutar consultas
      const [clients, total] = await Promise.all([
        this.prisma.client.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.client.count({ where })
      ]);

      return {
        clients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error in getAllClients:', error);
      throw error;
    }
  }

  // Get client by ID
  async getClientById(id, agentId = null) {
    try {
      const where = { id: parseInt(id) };
      if (agentId) {
        where.agentId = agentId;
      }

      const client = await this.prisma.client.findFirst({
        where,
        include: {
          transactions: true
        }
      });

      if (!client) {
        throw new Error('Cliente no encontrado');
      }

      return {
        ...client,
        transactionCount: client.transactions.length,
        transactions: client.transactions
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

      // Verificar que el agente existe
      const agentExists = await this.prisma.user.findUnique({
        where: { id: agentId }
      });
      if (!agentExists) {
        throw new Error('El agente especificado no existe');
      }

      // Verificar si ya existe un cliente con ese email para este agente
      const existingClient = await this.prisma.client.findFirst({
        where: {
          email: clientData.email.toLowerCase().trim(),
          agentId: agentId
        }
      });

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
          }
        }
      });

      // Formatear respuesta
      return {
        ...client,
        transactionCount: client.transactions.length
      };
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
        return {
          ...existingClient,
          transactionCount: existingClient.transactions.length
        };
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
      return {
        ...updatedClient,
        transactionCount: updatedClient.transactions.length
      };
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
      return {
        totalClients,
        activeClients
      };
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
}

module.exports = new ClientService();
