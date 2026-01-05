const Database = require('better-sqlite3');
const db = new Database('./dev.db');

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'AGENT',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    preferences TEXT,
    agentId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agentId) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Crear usuario de prueba
const userInsertStmt = db.prepare(`
  INSERT OR REPLACE INTO users (id, email, password, name, role, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();
userInsertStmt.run(
  'temp-user-id',
  'test@example.com',
  'password123',
  'Usuario de Prueba',
  'AGENT',
  now
);

// Insertar clientes de prueba
const clients = [
  {
    id: 'client_1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+54 11 1234-5678',
    address: 'Av. Corrientes 1234, Buenos Aires',
    agentId: 'temp-user-id'
  },
  {
    id: 'client_2',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@email.com',
    phone: '+54 11 8765-4321',
    address: 'Calle Florida 567, Buenos Aires',
    agentId: 'temp-user-id'
  },
  {
    id: 'client_3',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@email.com',
    phone: '+54 11 5555-1234',
    address: 'Av. 9 de Julio 890, Buenos Aires',
    agentId: 'temp-user-id'
  },
  {
    id: 'client_4',
    firstName: 'Ana',
    lastName: 'López',
    email: 'ana.lopez@email.com',
    phone: '+54 11 7777-9999',
    address: 'Calle Reconquista 234, Buenos Aires',
    agentId: 'temp-user-id'
  },
  {
    id: 'client_5',
    firstName: 'Pedro',
    lastName: 'Martínez',
    email: 'pedro.martinez@email.com',
    phone: '+54 11 3333-4444',
    address: 'Av. Santa Fe 3456, Buenos Aires',
    agentId: 'temp-user-id'
  }
];

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO clients (id, firstName, lastName, email, phone, address, agentId, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

clients.forEach(client => {
  insertStmt.run(
    client.id,
    client.firstName,
    client.lastName,
    client.email,
    client.phone,
    client.address,
    client.agentId,
    now
  );
});

console.log('Clientes de prueba insertados correctamente');
console.log('Total de clientes insertados:', clients.length);

db.close();
