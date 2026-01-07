const Database = require('better-sqlite3');
const path = require('path');

class ClientService {
  constructor() {
    this.db = new Database(path.join(__dirname, '../../dev.db'));
  }

  // Get all clients with filters
  async getAllClients(filters = {}, agentId = null) {
    try {
      const {
        search,
        page = 1,
        limit = 10
      } = filters;

      // Build SQL query dynamically (moved to the query building section)

      // Build SQL query dynamically
      let whereConditions = [];
      let params = [];

      // If agentId provided, only show clients owned by this agent
      if (agentId) {
        whereConditions.push('c.agentId = ?');
        params.push(agentId);
      }

      // Search functionality
      if (search) {
        whereConditions.push('(c.firstName LIKE ? OR c.lastName LIKE ? OR c.email LIKE ?)');
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM clients c ${whereClause}`;
      const { total } = this.db.prepare(countQuery).get(...params) || { total: 0 };

      // Get clients with pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const clientsQuery = `
        SELECT
          c.*,
          u.id as agent_id,
          u.name as agent_name,
          u.email as agent_email,
          COUNT(t.id) as transaction_count
        FROM clients c
        LEFT JOIN users u ON c.agentId = u.id
        LEFT JOIN transactions t ON c.id = t.clientId
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.createdAt DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const rows = this.db.prepare(clientsQuery).all(...params);

      // Format the response
      const formattedClients = rows.map(row => ({
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        address: row.address,
        preferences: row.preferences ? JSON.parse(row.preferences) : null,
        agentId: row.agentId,
        agent: {
          id: row.agent_id,
          name: row.agent_name,
          email: row.agent_email
        },
        transactionCount: row.transaction_count || 0,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
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
    // Build query (if agentId is null, it's admin and can see all clients)
    let query = `
      SELECT
        c.*,
        u.id as agent_id,
        u.name as agent_name,
        u.email as agent_email
      FROM clients c
      LEFT JOIN users u ON c.agentId = u.id
      WHERE c.id = ?
    `;

    let params = [id];

    if (agentId) {
      query += ' AND c.agentId = ?';
      params.push(agentId);
    }

    const clientRow = this.db.prepare(query).get(...params);

    if (!clientRow) {
      throw new Error('Cliente no encontrado');
    }

    // Get transactions for this client
    const transactionsQuery = `
      SELECT
        t.*,
        p.id as property_id,
        p.title as property_title,
        p.address as property_address,
        p.price as property_price
      FROM transactions t
      LEFT JOIN properties p ON t.propertyId = p.id
      WHERE t.clientId = ?
      ORDER BY t.createdAt DESC
    `;

    const transactionRows = this.db.prepare(transactionsQuery).all(id);

    // Format transactions
    const transactions = transactionRows.map(t => ({
      id: t.id,
      type: t.type,
      status: t.status,
      amount: t.amount,
      commission: t.commission,
      notes: t.notes,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      propertyId: t.propertyId,
      agentId: t.agentId,
      property: {
        id: t.property_id,
        title: t.property_title,
        address: t.property_address,
        price: t.property_price
      }
    }));

    // Format the response
    return {
      id: clientRow.id,
      firstName: clientRow.firstName,
      lastName: clientRow.lastName,
      email: clientRow.email,
      phone: clientRow.phone,
      address: clientRow.address,
      preferences: clientRow.preferences ? JSON.parse(clientRow.preferences) : null,
      agentId: clientRow.agentId,
      agent: {
        id: clientRow.agent_id,
        name: clientRow.agent_name,
        email: clientRow.agent_email
      },
      transactionCount: transactions.length,
      transactions: transactions,
      createdAt: clientRow.createdAt,
      updatedAt: clientRow.updatedAt
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
      const existingClient = this.db.prepare(`
        SELECT id FROM clients
        WHERE email = ? AND agentId = ?
      `).get(email.toLowerCase().trim(), agentId);

      if (existingClient) {
        throw new Error('Ya existe un cliente con este email para este agente');
      }

      const { v4: uuidv4 } = require('uuid');
      const now = new Date().toISOString();
      const clientId = uuidv4();

      // Create client using better-sqlite3
      const insertStmt = this.db.prepare(`
        INSERT INTO clients (
          id, firstName, lastName, email, phone, address, preferences, agentId, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        clientId,
        firstName.trim(),
        lastName.trim(),
        email.toLowerCase().trim(),
        phone?.trim() || null,
        address?.trim() || null,
        preferences ? JSON.stringify(preferences) : null,
        agentId,
        now,
        now
      );

      // Get the created client with agent info
      const selectStmt = this.db.prepare(`
        SELECT
          c.*,
          u.id as agent_id,
          u.name as agent_name,
          u.email as agent_email,
          0 as transaction_count
        FROM clients c
        LEFT JOIN users u ON c.agentId = u.id
        WHERE c.id = ?
      `);

      const row = selectStmt.get(clientId);

      // Format the response
      return {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        address: row.address,
        preferences: row.preferences ? JSON.parse(row.preferences) : null,
        agentId: row.agentId,
        agent: {
          id: row.agent_id,
          name: row.agent_name,
          email: row.agent_email
        },
        transactionCount: row.transaction_count,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Update client
  async updateClient(id, clientData, agentId) {
    // First check if client exists and user owns it
    let checkQuery = 'SELECT * FROM clients WHERE id = ?';
    let checkParams = [id];

    if (agentId) {
      checkQuery += ' AND agentId = ?';
      checkParams.push(agentId);
    }

    const existingRow = this.db.prepare(checkQuery).get(...checkParams);

    if (!existingRow) {
      throw new Error('Cliente no encontrado o no tienes permiso para modificarlo');
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      preferences
    } = clientData;

    // Only add fields that are provided (not undefined)
    if (firstName !== undefined) {
      updateFields.push('firstName = ?');
      updateParams.push(firstName.trim());
    }
    if (lastName !== undefined) {
      updateFields.push('lastName = ?');
      updateParams.push(lastName.trim());
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateParams.push(email.toLowerCase().trim());
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateParams.push(phone?.trim() || null);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateParams.push(address?.trim() || null);
    }
    if (preferences !== undefined) {
      updateFields.push('preferences = ?');
      updateParams.push(preferences ? JSON.stringify(preferences) : null);
    }

    // If no fields to update, return existing client formatted
    if (updateFields.length === 0) {
      return this.formatClientRow(existingRow);
    }

    // Add updatedAt and id to params
    updateFields.push('updatedAt = ?');
    updateParams.push(new Date().toISOString());
    updateParams.push(id);

    // Update the client
    const updateQuery = `
      UPDATE clients
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    this.db.prepare(updateQuery).run(...updateParams);

    // Get the updated client
    const selectStmt = this.db.prepare(`
      SELECT
        c.*,
        u.id as agent_id,
        u.name as agent_name,
        u.email as agent_email,
        COUNT(t.id) as transaction_count
      FROM clients c
      LEFT JOIN users u ON c.agentId = u.id
      LEFT JOIN transactions t ON c.id = t.clientId
      WHERE c.id = ?
      GROUP BY c.id
    `);

    const row = selectStmt.get(id);
    return this.formatClientRow(row);
  }

  // Helper method to format client row
  formatClientRow(row) {
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      address: row.address,
      preferences: row.preferences ? JSON.parse(row.preferences) : null,
      agentId: row.agentId,
      agent: {
        id: row.agent_id,
        name: row.agent_name,
        email: row.agent_email
      },
      transactionCount: row.transaction_count || 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  // Delete client
  async deleteClient(id, agentId) {
    // First check if client exists and user owns it (if not admin)
    let checkQuery = 'SELECT id FROM clients WHERE id = ?';
    let checkParams = [id];

    if (agentId) {
      checkQuery += ' AND agentId = ?';
      checkParams.push(agentId);
    }

    const client = this.db.prepare(checkQuery).get(...checkParams);

    if (!client) {
      throw new Error('Cliente no encontrado o no tienes permiso para eliminarlo');
    }

    // Check if client has active transactions
    const activeTransactionsCount = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE clientId = ? AND status IN ('PENDING', 'IN_PROGRESS')
    `).get(id).count;

    if (activeTransactionsCount > 0) {
      throw new Error('No se puede eliminar un cliente con transacciones activas');
    }

    // Delete the client
    this.db.prepare('DELETE FROM clients WHERE id = ?').run(id);

    return { message: 'Cliente eliminado exitosamente' };
  }

  // Get client statistics
  async getClientStats(agentId = null) {
    try {
      const whereClause = agentId ? 'WHERE agentId = ?' : '';
      const whereParams = agentId ? [agentId] : [];

      const totalClients = this.db.prepare(`SELECT COUNT(*) as count FROM clients ${whereClause}`).get(...whereParams).count;

      // Count clients with active transactions
      const activeClientsQuery = `
        SELECT COUNT(DISTINCT c.id) as count
        FROM clients c
        INNER JOIN transactions t ON c.id = t.clientId
        ${whereClause ? whereClause.replace('WHERE', 'WHERE c.agentId = ? AND') : 'WHERE'} t.status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
      `;

      const activeClientsParams = agentId ? [agentId] : [];
      const activeClients = this.db.prepare(activeClientsQuery).get(...activeClientsParams).count;

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
  close() {
    // better-sqlite3 closes automatically when the process ends
    // but we can explicitly close if needed
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new ClientService();
