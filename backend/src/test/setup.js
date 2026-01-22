// Setup global para tests del backend
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DATABASE_URL = 'file:./test.db'
process.env.LOG_LEVEL = 'error' // Reducir logs en tests

// Mock para console en tests (opcional)
const originalConsole = { ...console }

// Silenciar logs en tests (descomentar si es necesario)
// console.log = jest.fn()
// console.warn = jest.fn()
// console.error = jest.fn()

// Cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks()
})

// Cleanup global
afterAll(async () => {
  // Limpiar base de datos de test si existe
  try {
    const fs = require('fs')
    const path = require('path')
    const testDbPath = path.join(__dirname, '../../test.db')
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
    const testDbWal = path.join(__dirname, '../../test.db-wal')
    if (fs.existsSync(testDbWal)) {
      fs.unlinkSync(testDbWal)
    }
    const testDbShm = path.join(__dirname, '../../test.db-shm')
    if (fs.existsSync(testDbShm)) {
      fs.unlinkSync(testDbShm)
    }
  } catch (error) {
    console.warn('Error cleaning up test database:', error.message)
  }
})