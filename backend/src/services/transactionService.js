const { PrismaClient } = require('@prisma/client');
const TransactionValidator = require('./validation/TransactionValidator');

const prisma = new PrismaClient();

class TransactionService {
  constructor() {
    this.prisma = prisma;
    this.validator = new TransactionValidator();
  }

  // Get all transactions with filters
  async getAllTransactions(filters = {}, agentId = null) {
    try {
      const {
        search,
        type,
        status,
        page = 1,
        limit = 10
      } = filters;

      // Build where clause
      const where = {};

      // Filter by agentId if not ADMIN
      if (agentId) {
        where.agentId = agentId;
      }

      if (type) {
        where.type = type;
      }
      if (status) {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { property: { title: { contains: search, mode: 'insensitive' } } },
          { client: { firstName: { contains: search, mode: 'insensitive' } } },
          { client: { lastName: { contains: search, mode: 'insensitive' } } },
          { notes: { contains: search, mode: 'insensitive' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get transactions with related data
      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where,
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true
              }
            },
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            agent: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: parseInt(limit)
        }),
        this.prisma.transaction.count({ where })
      ]);

      return {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      console.error('Error in getAllTransactions:', error);
      return {
        transactions: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  // Get transaction by ID
  async getTransactionById(id, agentId = null) {
    const where = agentId ? { id, agentId } : { id };

    const transaction = await this.prisma.transaction.findFirst({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            price: true,
            type: true,
            status: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    return transaction;
  }

  // Create new transaction
  async createTransaction(transactionData, agentId) {
    const {
      type,
      amount,
      commission,
      notes,
      propertyId,
      clientId
    } = transactionData;

    // Validation
    if (!type || !amount || !propertyId || !clientId) {
      throw new Error('Tipo, monto, propiedad y cliente son requeridos');
    }

    // Verify that property and client belong to the agent
    const [property, client] = await Promise.all([
      this.prisma.property.findFirst({
        where: agentId ? { id: propertyId, ownerId: agentId } : { id: propertyId }
      }),
      this.prisma.client.findFirst({
        where: agentId ? { id: clientId, agentId } : { id: clientId }
      })
    ]);

    if (!property) {
      throw new Error('Propiedad no encontrada o no tienes acceso a ella');
    }

    if (!client) {
      throw new Error('Cliente no encontrado o no tienes acceso a él');
    }

    // Create transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        type,
        status: 'PENDING',
        amount: parseFloat(amount),
        commission: commission ? parseFloat(commission) : null,
        notes: notes?.trim(),
        propertyId,
        clientId,
        agentId
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            price: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return transaction;
  }

  // Update transaction
  async updateTransaction(id, transactionData, agentId) {
    // First check if transaction exists and user owns it
    const existingTransaction = await this.getTransactionById(id, agentId);

    const updateData = {};
    const {
      type,
      status,
      amount,
      commission,
      notes
    } = transactionData;

    // Only add fields that are provided
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (commission !== undefined) updateData.commission = commission ? parseFloat(commission) : null;
    if (notes !== undefined) updateData.notes = notes?.trim();

    // If no fields to update, return existing transaction
    if (Object.keys(updateData).length === 0) {
      return existingTransaction;
    }

    // Update the transaction
    const updatedTransaction = await this.prisma.transaction.update({
      where: {
        id
      },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            price: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return updatedTransaction;
  }

  // Delete transaction
  async deleteTransaction(id, agentId) {
    // First check if transaction exists and user owns it
    await this.getTransactionById(id, agentId);

    // Delete the transaction
    await this.prisma.transaction.delete({
      where: {
        id
      }
    });

    return { message: 'Transacción eliminada exitosamente' };
  }

  // Get transaction statistics
  async getTransactionStats(agentId = null) {
    try {
      const where = agentId ? { agentId } : {};

      // Ejecutar todas las consultas en paralelo
      const [totalTransactions, totalAmountResult, statusStats, typeStats] = await Promise.all([
        this.prisma.transaction.count({ where }),
        this.prisma.transaction.aggregate({
          where,
          _sum: { amount: true }
        }),
        this.prisma.transaction.groupBy({
          by: ['status'],
          where,
          _count: { status: true }
        }),
        this.prisma.transaction.groupBy({
          by: ['type'],
          where,
          _count: { type: true }
        })
      ]);

      const totalAmount = totalAmountResult._sum.amount || 0;

      return {
        totalTransactions,
        totalAmount,
        byStatus: statusStats.reduce((acc, s) => {
          acc[s.status] = s._count.status;
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, t) => {
          acc[t.type] = t._count.type;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error in getTransactionStats:', error);
      return {
        totalTransactions: 0,
        totalAmount: 0,
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

module.exports = new TransactionService();
