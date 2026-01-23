const request = require('supertest')
const app = require('../../server')

// Mock del middleware de autenticación para tests
jest.mock('../../middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    // Simular usuario autenticado para tests
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'AGENT'
    }
    next()
  },
  authorizeRoles: () => (req, res, next) => next()
}))

describe('Clients API Integration Tests', () => {
  let testDb
  let agentToken
  let testAgentId

  beforeAll(async () => {
    // Crear base de datos de test
    const testDbPath = path.join(__dirname, '../../../test.db')
    testDb = new Database(testDbPath)

    // Crear tablas de test
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'AGENT'
      );

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        agentId TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        preferences TEXT,
        FOREIGN KEY (agentId) REFERENCES users(id)
      );
    `)

    // Crear usuario de test (con el ID simulado por el mock)
    testAgentId = 'test-user-id' // Usar el mismo ID que simula el mock
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('testpass123', 12)

    testDb.prepare(`
      INSERT INTO users (id, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(testAgentId, 'test@example.com', hashedPassword, 'Test Agent', 'AGENT')

    // Token simulado (no se usa realmente por el mock)
    agentToken = 'mock-token'
  })

  afterAll(() => {
    if (testDb) {
      testDb.close()
    }
  })

  beforeEach(() => {
    // Limpiar tabla clients antes de cada test
    if (testDb) {
      testDb.prepare('DELETE FROM clients').run()
    }
  })

  describe('GET /api/clients', () => {
    it('should return empty array when no clients exist', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('clients')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.clients).toEqual([])
      expect(response.body.pagination.total).toBe(0)
    })

    it('should return clients for authenticated agent', async () => {
      // Crear cliente de test
      const clientId = 'test-client-' + Date.now()
      testDb.prepare(`
        INSERT INTO clients (id, firstName, lastName, email, agentId)
        VALUES (?, ?, ?, ?, ?)
      `).run(clientId, 'John', 'Doe', 'john@example.com', testAgentId)

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200)

      expect(response.body.clients).toHaveLength(1)
      expect(response.body.clients[0]).toMatchObject({
        id: clientId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        agentId: testAgentId
      })
      expect(response.body.pagination.total).toBe(1)
    })

    it('should filter clients by search term', async () => {
      // Crear múltiples clientes
      testDb.prepare(`
        INSERT INTO clients (id, firstName, lastName, email, agentId)
        VALUES (?, ?, ?, ?, ?)
      `).run('client1', 'John', 'Doe', 'john@example.com', testAgentId)

      testDb.prepare(`
        INSERT INTO clients (id, firstName, lastName, email, agentId)
        VALUES (?, ?, ?, ?, ?)
      `).run('client2', 'Jane', 'Smith', 'jane@example.com', testAgentId)

      const response = await request(app)
        .get('/api/clients?search=John')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200)

      expect(response.body.clients).toHaveLength(1)
      expect(response.body.clients[0].firstName).toBe('John')
    })

    it('should handle pagination', async () => {
      // Crear múltiples clientes
      for (let i = 0; i < 5; i++) {
        testDb.prepare(`
          INSERT INTO clients (id, firstName, lastName, email, agentId)
          VALUES (?, ?, ?, ?, ?)
        `).run(`client${i}`, `Name${i}`, 'Doe', `name${i}@example.com`, testAgentId)
      }

      const response = await request(app)
        .get('/api/clients?page=1&limit=2')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200)

      expect(response.body.clients).toHaveLength(2)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(2)
      expect(response.body.pagination.total).toBe(5)
      expect(response.body.pagination.pages).toBe(3)
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/clients')
        .expect(401)

      expect(response.body.error).toBe('Token de acceso requerido')
    })

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.error).toBe('Token inválido')
    })
  })

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '3512345678',
        address: 'Córdoba, Argentina'
      }

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(clientData)
        .expect(201)

      expect(response.body.message).toBe('Cliente creado exitosamente')
      expect(response.body.client).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '3512345678',
        address: 'Córdoba, Argentina',
        agentId: testAgentId
      })
      expect(response.body.client).toHaveProperty('id')
      expect(response.body.client).toHaveProperty('createdAt')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({})
        .expect(400)

      expect(response.body.error).toContain('Campos requeridos faltantes')
    })

    it('should validate email format', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email'
      }

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(clientData)
        .expect(400)

      expect(response.body.error).toContain('El email no tiene un formato válido')
    })

    it('should prevent duplicate emails for same agent', async () => {
      // Crear cliente primero
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }

      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(clientData)
        .expect(201)

      // Intentar crear otro con mismo email
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(clientData)
        .expect(400)

      expect(response.body.error).toContain('Ya existe un cliente con este email')
    })
  })

  describe('GET /api/clients/:id', () => {
    it('should return a specific client', async () => {
      const clientId = 'test-client-' + Date.now()
      testDb.prepare(`
        INSERT INTO clients (id, firstName, lastName, email, agentId)
        VALUES (?, ?, ?, ?, ?)
      `).run(clientId, 'John', 'Doe', 'john@example.com', testAgentId)

      const response = await request(app)
        .get(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200)

      expect(response.body.client).toMatchObject({
        id: clientId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        agentId: testAgentId
      })
    })

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/non-existent-id')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(404)

      expect(response.body.error).toBe('Cliente no encontrado')
    })
  })

  describe('PUT /api/clients/:id', () => {
    it('should update a client', async () => {
      const clientId = 'test-client-' + Date.now()
      testDb.prepare(`
        INSERT INTO clients (id, firstName, lastName, email, agentId)
        VALUES (?, ?, ?, ?, ?)
      `).run(clientId, 'John', 'Doe', 'john@example.com', testAgentId)

      const updateData = {
        firstName: 'Jane',
        phone: '3519876543'
      }

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.message).toBe('Cliente actualizado exitosamente')
      expect(response.body.client.firstName).toBe('Jane')
      expect(response.body.client.phone).toBe('3519876543')
      expect(response.body.client.email).toBe('john@example.com') // No cambió
    })
  })

  describe('DELETE /api/clients/:id', () => {
    it('should delete a client', async () => {
      const clientId = 'test-client-' + Date.now()
      testDb.prepare(`
        INSERT INTO clients (id, firstName, lastName, email, agentId)
        VALUES (?, ?, ?, ?, ?)
      `).run(clientId, 'John', 'Doe', 'john@example.com', testAgentId)

      const response = await request(app)
        .delete(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200)

      expect(response.body.message).toBe('Cliente eliminado exitosamente')

      // Verificar que ya no existe
      const checkResponse = await request(app)
        .get(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(404)
    })
  })
})