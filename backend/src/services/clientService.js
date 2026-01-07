const { PrismaClient } = require('@prisma/client');

class ClientService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  // Get all clients with filters
  async getAllClients(filters = {}, agentId = null) {
    try {
      const {
        search,
        page = 1,
        limit = 10
      } = filters;

      // Build where clause
      const where = {};

      // If agentId provided, only show clients owned by this agent
      if (agentId) {
        where.agentId = agentId;
      }

      // Search functionality
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get clients with transaction count and agent info
      const [clients, total] = await Promise.all([
        this.prisma.client.findMany({
          where,
          include: {
            agent: {
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
        this.prisma.client.count({ where })
      ]);

      // Format the response
      const formattedClients = clients.map(client => ({
        ...client,
        preferences: client.preferences ? JSON.parse(client.preferences) : {},
        transactionCount: client._count.transactions
      }));

      return {
        clients: formattedClients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      console.error('Error in getAllClients:', error);
      // Return empty result if database error
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
    // Build where clause (if agentId is null, it's admin and can see all clients)
    const where = agentId ? { id, agentId } : { id };

    const client = await this.prisma.client.findFirst({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transactions: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    // Format the response
    return {
      ...client,
      preferences: client.preferences ? JSON.parse(client.preferences) : {},
      transactionCount: client._count.transactions
    };
  }

  // Create new client
  async createClient(clientData, agentId) {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        preferences
      } = clientData;

      // Validation
      if (!firstName || !lastName || !email) {
        throw new Error('Nombre, apellido y email son requeridos');
      }

      // Check if client already exists for this agent
      const existingClient = await this.prisma.client.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          agentId
        }
      });

      if (existingClient) {
        throw new Error('Ya existe un cliente con este email para este agente');
      }

      // Create client using Prisma
      const client = await this.prisma.client.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim(),
          address: address?.trim(),
          preferences: preferences ? JSON.stringify(preferences) : null,
          agentId
        },
        include: {
          agent: {
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
        ...client,
        preferences: client.preferences ? JSON.parse(client.preferences) : {},
        transactionCount: client._count.transactions
      };
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Update client
  async updateClient(id, clientData, agentId) {
    // First check if client exists and user owns it
    const whereClause = agentId ? { id, agentId } : { id };
    const existingClient = await this.prisma.client.findFirst({
      where: whereClause,
      include: {
        agent: {
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

    if (!existingClient) {
      throw new Error('Cliente no encontrado o no tienes permiso para modificarlo');
    }

    // Build update data
    const updateData = {};
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      preferences
    } = clientData;

    // Only add fields that are provided (not undefined)
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone?.trim();
    if (address !== undefined) updateData.address = address?.trim();
    if (preferences !== undefined) updateData.preferences = preferences ? JSON.stringify(preferences) : null;

    // If no fields to update, return existing client
    if (Object.keys(updateData).length === 0) {
      return {
        ...existingClient,
        preferences: existingClient.preferences ? JSON.parse(existingClient.preferences) : {},
        transactionCount: existingClient._count.transactions
      };
    }

    // Update the client
    const updatedClient = await this.prisma.client.update({
      where: {
        id
      },
      data: updateData,
      include: {
        agent: {
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
      ...updatedClient,
      preferences: updatedClient.preferences ? JSON.parse(updatedClient.preferences) : {},
      transactionCount: updatedClient._count.transactions
    };
  }

  // Delete client
  async deleteClient(id, agentId) {
    // Build where clause for checking ownership
    const whereClause = agentId ? { id, agentId } : { id };

    // First check if client exists and user owns it (if not admin)
    const client = await this.prisma.client.findFirst({
      where: whereClause
    });

    if (!client) {
      throw new Error('Cliente no encontrado o no tienes permiso para eliminarlo');
    }

    // Check if client has active transactions
    const activeTransactionsCount = await this.prisma.transaction.count({
      where: {
        clientId: id,
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      }
    });

    if (activeTransactionsCount > 0) {
      throw new Error('No se puede eliminar un cliente con transacciones activas');
    }

    // Delete the client
    await this.prisma.client.delete({
      where: {
        id
      }
    });

    return { message: 'Cliente eliminado exitosamente' };
  }

  // Get client statistics
  async getClientStats(agentId = null) {
    try {
      const where = agentId ? { agentId } : {};

      const [totalClients, activeClients] = await Promise.all([
        this.prisma.client.count({ where }),
        this.prisma.client.count({
          where: {
            ...where,
            transactions: {
              some: {
                status: {
                  in: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
                }
              }
            }
          }
        })
      ]);

      return {
        totalClients,
        activeClients,
        inactiveClients: totalClients - activeClients
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
  async close() {
    await this.prisma.$disconnect();
  }
}

module.exports = new ClientService();
