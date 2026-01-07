const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Función para resetear completamente la base de datos
console.log('🗑️  RESETEANDO BASE DE DATOS COMPLETAMENTE...');
console.log('⚠️  Esto eliminará TODOS los datos existentes');
console.log('');

// Borrar base de datos existente si existe
const fs = require('fs');
const path = require('path');

const dbPath = './dev.db';
const dbWalPath = './dev.db-wal';
const dbShmPath = './dev.db-shm';

try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Base de datos anterior eliminada');
  }
  if (fs.existsSync(dbWalPath)) {
    fs.unlinkSync(dbWalPath);
  }
  if (fs.existsSync(dbShmPath)) {
    fs.unlinkSync(dbShmPath);
  }
} catch (error) {
  console.log('❌ Error al eliminar la base de datos anterior:', error.message);
}

const db = new Database('./dev.db');
db.pragma('journal_mode = WAL');

// Crear tablas
db.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'AGENT',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    preferences TEXT,
    agentId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agentId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'AVAILABLE',
    price REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    listingType TEXT DEFAULT 'SALE',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zipCode TEXT,
    bedrooms INTEGER,
    bathrooms REAL,
    area REAL,
    yearBuilt INTEGER,
    features TEXT,
    images TEXT,
    ownerId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    propertyId TEXT NOT NULL,
    clientId TEXT NOT NULL,
    agentId TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    amount REAL NOT NULL,
    commission REAL,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (agentId) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('📋 Tablas creadas exitosamente');

// Función para sembrar datos de prueba
async function seedData() {
  const hashedPassword = await bcrypt.hash('123456', 12);
  const now = new Date().toISOString();

  // Crear usuario de prueba
  const userStmt = db.prepare(`
    INSERT INTO users (id, email, password, name, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const testUserId = uuidv4();
  userStmt.run(testUserId, 'test@example.com', hashedPassword, 'Agente de Prueba', 'AGENT', now, now);
  console.log('👤 Usuario de prueba creado');

  // Crear algunos clientes de prueba
  const clients = [
    { id: uuidv4(), firstName: 'Juan', lastName: 'Pérez', email: 'juan.perez@example.com', phone: '1122334455', address: 'Calle Falsa 123', agentId: testUserId, createdAt: now, updatedAt: now },
    { id: uuidv4(), firstName: 'María', lastName: 'González', email: 'maria.gonzalez@example.com', phone: '1155667788', address: 'Av. Siempreviva 742', agentId: testUserId, createdAt: now, updatedAt: now },
    { id: uuidv4(), firstName: 'Carlos', lastName: 'Rodríguez', email: 'carlos.rodriguez@example.com', phone: '1199887766', address: 'Boulevard de los Sueños 45', agentId: testUserId, createdAt: now, updatedAt: now },
  ];

  const clientStmt = db.prepare(`
    INSERT INTO clients (id, firstName, lastName, email, phone, address, agentId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  clients.forEach(client => clientStmt.run(Object.values(client)));
  console.log('👥 Clientes de prueba creados');

  // Crear algunas propiedades de prueba
  const properties = [
    {
      id: uuidv4(),
      title: 'Casa Moderna con Jardín',
      description: 'Amplia casa con 3 habitaciones y gran jardín.',
      type: 'HOUSE',
      status: 'AVAILABLE',
      price: 250000,
      currency: 'USD',
      listingType: 'SALE',
      address: 'Calle Principal 123',
      city: 'Buenos Aires',
      state: 'CABA',
      zipCode: '1000',
      bedrooms: 3,
      bathrooms: 2.5,
      area: 1800,
      yearBuilt: 2010,
      features: JSON.stringify(['Jardín', 'Garage', 'Piscina']),
      images: JSON.stringify([]),
      ownerId: testUserId,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: 'Apartamento Céntrico',
      description: 'Apartamento de 2 habitaciones en el corazón de la ciudad.',
      type: 'APARTMENT',
      status: 'RENTED',
      price: 80000,
      currency: 'ARS',
      listingType: 'RENT',
      address: 'Av. Corrientes 500',
      city: 'Buenos Aires',
      state: 'CABA',
      zipCode: '1043',
      bedrooms: 2,
      bathrooms: 1,
      area: 800,
      yearBuilt: 1995,
      features: JSON.stringify(['Balcon', 'Seguridad 24hs']),
      images: JSON.stringify([]),
      ownerId: testUserId,
      createdAt: now,
      updatedAt: now
    }
  ];

  const propertyStmt = db.prepare(`
    INSERT INTO properties (id, title, description, type, status, price, currency, listingType, address, city, state, zipCode, bedrooms, bathrooms, area, yearBuilt, features, images, ownerId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  properties.forEach(prop => {
    propertyStmt.run(
      prop.id, prop.title, prop.description, prop.type, prop.status, prop.price, prop.currency, prop.listingType,
      prop.address, prop.city, prop.state, prop.zipCode, prop.bedrooms, prop.bathrooms,
      prop.area, prop.yearBuilt, prop.features, prop.images, prop.ownerId, prop.createdAt, prop.updatedAt
    );
  });
  console.log('🏠 Propiedades de prueba creadas');

  // Crear algunas transacciones de prueba
  const transactions = [
    {
      id: uuidv4(),
      propertyId: properties[1].id,
      clientId: clients[0].id,
      agentId: testUserId,
      type: 'RENTAL',
      status: 'COMPLETED',
      amount: 80000,
      commission: 4000,
      notes: 'Alquiler completado por 24 meses.',
      createdAt: now,
      updatedAt: now
    }
  ];

  const transactionStmt = db.prepare(`
    INSERT INTO transactions (id, propertyId, clientId, agentId, type, status, amount, commission, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  transactions.forEach(tx => transactionStmt.run(Object.values(tx)));
  console.log('💼 Transacciones de prueba creadas');

  console.log('');
  console.log('🎉 Base de datos reseteada y datos de prueba creados exitosamente!');
  console.log('');
  console.log('🔐 Credenciales de acceso:');
  console.log('Email: test@example.com');
  console.log('Password: 123456');
  console.log('');
  console.log('📊 Resumen:');
  console.log(`- Usuarios: 1`);
  console.log(`- Clientes: ${clients.length}`);
  console.log(`- Propiedades: ${properties.length}`);
  console.log(`- Transacciones: ${transactions.length}`);
}

seedData().then(() => {
  db.close();
  console.log('');
  console.log('✅ Proceso completado exitosamente!');
}).catch(err => {
  console.error('❌ Error durante el proceso:', err);
  db.close();
});