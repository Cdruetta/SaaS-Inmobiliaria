const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

class TransactionService {
  constructor() {
    this.db = new Database('./dev.db');
    this.db.pragma('journal_mode = WAL');

    // Crear tabla si no existe
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        amount REAL NOT NULL,
        commission REAL,
        notes TEXT,
        propertyId TEXT NOT NULL,
        clientId TEXT NOT NULL,
        agentId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (agentId) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  // Get all transactions with filters
  async getAllTransactions(filters = {}, agentId = null) {
    const {
      search,
      type,
      status,
      page = 1,
      limit = 10
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // Filter by agentId if not ADMIN
    if (agentId) {
      whereClause += ' AND t.agentId = ?';
      params.push(agentId);
    }

    if (type) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }
    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }
    if (search) {
      whereClause += ' AND (LOWER(p.title) LIKE LOWER(?) OR LOWER(c.firstName) LIKE LOWER(?) OR LOWER(c.lastName) LIKE LOWER(?))';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const skip = (page - 1) * limit;

    const transactionsStmt = this.db.prepare(`
      SELECT
        t.*,
        p.title as propertyTitle,
        p.address as propertyAddress,
        p.price as propertyPrice,
        c.firstName as clientFirstName,
        c.lastName as clientLastName,
        c.email as clientEmail,
        u.name as agentName,
        u.email as agentEmail
      FROM transactions t
      LEFT JOIN properties p ON t.propertyId = p.id
      LEFT JOIN clients c ON t.clientId = c.id
      LEFT JOIN users u ON t.agentId = u.id
      ${whereClause}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `);
    const transactions = transactionsStmt.all(...params, limit, skip).map(t => ({
      ...t,
      property: {
        id: t.propertyId,
        title: t.propertyTitle,
        address: t.propertyAddress,
        price: parseFloat(t.propertyPrice)
      },
      client: {
        id: t.clientId,
        firstName: t.clientFirstName,
        lastName: t.clientLastName,
        email: t.clientEmail
      },
      agent: {
        id: t.agentId,
        name: t.agentName,
        email: t.agentEmail
      },
      amount: parseFloat(t.amount),
      commission: t.commission ? parseFloat(t.commission) : null,
    }));

    const totalStmt = this.db.prepare(`
      SELECT COUNT(DISTINCT t.id) as count
      FROM transactions t
      LEFT JOIN properties p ON t.propertyId = p.id
      LEFT JOIN clients c ON t.clientId = c.id
      ${whereClause}
    `);
    const totalResult = totalStmt.get(...params);
    const total = totalResult.count;

    return {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

  // Get transaction by ID
  async getTransactionById(id, agentId = null) {
    let whereClause = 'WHERE t.id = ?';
    const params = [id];

    if (agentId) {
      whereClause += ' AND t.agentId = ?';
      params.push(agentId);
    }

    const transactionStmt = this.db.prepare(`
      SELECT
        t.*,
        p.title as propertyTitle,
        p.address as propertyAddress,
        p.price as propertyPrice,
        p.type as propertyType,
        p.status as propertyStatus,
        c.firstName as clientFirstName,
        c.lastName as clientLastName,
        c.email as clientEmail,
        c.phone as clientPhone,
        u.name as agentName,
        u.email as agentEmail
      FROM transactions t
      LEFT JOIN properties p ON t.propertyId = p.id
      LEFT JOIN clients c ON t.clientId = c.id
      LEFT JOIN users u ON t.agentId = u.id
      ${whereClause}
    `);
    const transaction = transactionStmt.get(...params);

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    return {
      ...transaction,
      property: {
        id: transaction.propertyId,
        title: transaction.propertyTitle,
        address: transaction.propertyAddress,
        price: parseFloat(transaction.propertyPrice),
        type: transaction.propertyType,
        status: transaction.propertyStatus
      },
      client: {
        id: transaction.clientId,
        firstName: transaction.clientFirstName,
        lastName: transaction.clientLastName,
        email: transaction.clientEmail,
        phone: transaction.clientPhone
      },
      agent: {
        id: transaction.agentId,
        name: transaction.agentName,
        email: transaction.agentEmail
      },
      amount: parseFloat(transaction.amount),
      commission: transaction.commission ? parseFloat(transaction.commission) : null,
    };

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

    // Verify that property and client exist and belong to the agent
    const propertyStmt = this.db.prepare('SELECT * FROM properties WHERE id = ? AND ownerId = ?');
    const property = propertyStmt.get(propertyId, agentId);

    if (!property) {
      throw new Error('Propiedad no encontrada o no pertenece al agente');
    }

    const clientStmt = this.db.prepare('SELECT * FROM clients WHERE id = ? AND agentId = ?');
    const client = clientStmt.get(clientId, agentId);

    if (!client) {
      throw new Error('Cliente no encontrado o no pertenece al agente');
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO transactions (
        id, type, status, amount, commission, notes, propertyId, clientId, agentId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, type, 'PENDING', parseFloat(amount),
      commission ? parseFloat(commission) : null, notes?.trim(),
      propertyId, clientId, agentId, now, now
    );

    return this.getTransactionById(id, agentId);

  // Update transaction
  async updateTransaction(id, transactionData, agentId) {
    // First check if transaction exists and user owns it
    const existingTransaction = await this.getTransactionById(id, agentId);

    const {
      type,
      status,
      amount,
      commission,
      notes
    } = transactionData;

    const now = new Date().toISOString();
    let setClauses = [];
    const params = [];

    if (type !== undefined) { setClauses.push('type = ?'); params.push(type); }
    if (status !== undefined) { setClauses.push('status = ?'); params.push(status); }
    if (amount !== undefined) { setClauses.push('amount = ?'); params.push(parseFloat(amount)); }
    if (commission !== undefined) { setClauses.push('commission = ?'); params.push(commission ? parseFloat(commission) : null); }
    if (notes !== undefined) { setClauses.push('notes = ?'); params.push(notes?.trim()); }

    setClauses.push('updatedAt = ?');
    params.push(now);

    if (setClauses.length === 0) {
      return existingTransaction; // No changes to apply
    }

    const stmt = this.db.prepare(`
      UPDATE transactions
      SET ${setClauses.join(', ')}
      WHERE id = ? AND agentId = ?
    `);
    stmt.run(...params, id, agentId);

    return this.getTransactionById(id, agentId);

  // Delete transaction
  async deleteTransaction(id, agentId) {
    // First check if transaction exists and user owns it
    await this.getTransactionById(id, agentId);

    const stmt = this.db.prepare('DELETE FROM transactions WHERE id = ? AND agentId = ?');
    const result = stmt.run(id, agentId);

    if (result.changes === 0) {
      throw new Error('Transacción no encontrada o no tienes permiso para eliminarla');
    }

    return { message: 'Transacción eliminada exitosamente' };

  // Get transaction statistics
  async getTransactionStats(agentId = null) {
    try {
      let whereClause = '';
      const params = [];

      if (agentId) {
        whereClause = 'WHERE agentId = ?';
        params.push(agentId);
      }

      // Get total count
      const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM transactions ${whereClause}`);
      const countResult = countStmt.get(...params);
      const totalTransactions = countResult.count;

      // Get total value and commission
      const valueStmt = this.db.prepare(`
        SELECT SUM(amount) as totalAmount, SUM(commission) as totalCommission
        FROM transactions ${whereClause}
      `);
      const valueResult = valueStmt.get(...params);
      const totalValue = valueResult.totalAmount || 0;
      const totalCommission = valueResult.totalCommission || 0;

      // Get stats by status
      const statusStmt = this.db.prepare(`
        SELECT status, COUNT(*) as count, SUM(amount) as value, SUM(commission) as commission
        FROM transactions ${whereClause}
        GROUP BY status
      `);
      const statusStats = statusStmt.all(...params);

      // Get stats by type
      const typeStmt = this.db.prepare(`
        SELECT type, COUNT(*) as count, SUM(amount) as value, SUM(commission) as commission
        FROM transactions ${whereClause}
        GROUP BY type
      `);
      const typeStats = typeStmt.all(...params);

      return {
        totalTransactions,
        totalValue,
        totalCommission,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: stat.count,
            value: stat.value || 0,
            commission: stat.commission || 0
          };
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, stat) => {
          acc[stat.type] = {
            count: stat.count,
            value: stat.value || 0,
            commission: stat.commission || 0
          };
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error in getTransactionStats:', error);
      return {
        totalTransactions: 0,
        totalValue: 0,
        totalCommission: 0,
        byStatus: {},
        byType: {}
      };
    }
  }
}

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = new TransactionService();
