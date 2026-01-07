const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Verificar si la base de datos ya existe
const fs = require('fs');
const path = require('path');

const dbPath = './dev.db';
const dbWalPath = './dev.db-wal';
const dbShmPath = './dev.db-shm';

const dbExists = fs.existsSync(dbPath);

if (dbExists) {
  console.log('⚠️  Base de datos existente encontrada');
  console.log('Para evitar perder datos, este script ahora solo inicializa si la base de datos no existe.');
  console.log('Si necesitas resetear la base de datos completamente, elimina manualmente el archivo dev.db');
  console.log('');
  console.log('Para inicializar una base de datos nueva:');
  console.log('1. Detén el servidor backend');
  console.log('2. Elimina el archivo dev.db');
  console.log('3. Vuelve a ejecutar este script');
  console.log('');
  process.exit(0);
}

console.log('📦 Creando nueva base de datos...');

const db = new Database('./dev.db');
db.pragma('journal_mode = WAL');

console.log('Creando base de datos completa...');

// Crear tablas
db.exec(`
  -- Tabla de usuarios
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'AGENT',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabla de clientes
  CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    preferences TEXT,
    agentId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agentId) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Tabla de propiedades
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

  -- Tabla de transacciones
  CREATE TABLE transactions (
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

console.log('Tablas creadas exitosamente');

// Crear usuario de prueba con contraseña hasheada
const hashedPassword = bcrypt.hashSync('123456', 12);
const userId = 'user_' + Date.now();
const now = new Date().toISOString();

const userStmt = db.prepare(`
  INSERT INTO users (id, email, password, name, role, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?)
`);

userStmt.run(
  userId,
  'test@example.com',
  hashedPassword,
  'Usuario de Prueba',
  'AGENT',
  now
);

console.log('Usuario de prueba creado:');
console.log('- Email: test@example.com');
console.log('- Password: 123456');
console.log('- ID:', userId);

// Crear clientes de prueba
const clients = [
  {
    id: uuidv4(),
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+54 11 1234-5678',
    address: 'Av. Corrientes 1234, Buenos Aires',
    preferences: 'Busca departamento de 2 habitaciones en Palermo',
    agentId: userId
  },
  {
    id: uuidv4(),
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@email.com',
    phone: '+54 11 8765-4321',
    address: 'Calle Florida 567, Buenos Aires',
    preferences: 'Interesada en casas familiares en zona norte',
    agentId: userId
  },
  {
    id: uuidv4(),
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@email.com',
    phone: '+54 11 5555-1234',
    address: 'Av. 9 de Julio 890, Buenos Aires',
    preferences: 'Busca local comercial en centro',
    agentId: userId
  },
  {
    id: uuidv4(),
    firstName: 'Ana',
    lastName: 'López',
    email: 'ana.lopez@email.com',
    phone: '+54 11 7777-9999',
    address: 'Calle Reconquista 234, Buenos Aires',
    preferences: 'Apartamento moderno en Puerto Madero',
    agentId: userId
  },
  {
    id: uuidv4(),
    firstName: 'Pedro',
    lastName: 'Martínez',
    email: 'pedro.martinez@email.com',
    phone: '+54 11 3333-4444',
    address: 'Av. Santa Fe 3456, Buenos Aires',
    preferences: 'Casa con jardín en Vicente López',
    agentId: userId
  }
];

const clientStmt = db.prepare(`
  INSERT INTO clients (id, firstName, lastName, email, phone, address, preferences, agentId, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

clients.forEach(client => {
  clientStmt.run(
    client.id,
    client.firstName,
    client.lastName,
    client.email,
    client.phone,
    client.address,
    client.preferences,
    client.agentId,
    now
  );
});

console.log(`Clientes de prueba creados: ${clients.length}`);

// Crear propiedades de prueba
const properties = [
  {
    id: uuidv4(),
    title: 'Hermoso Departamento en Palermo',
    description: 'Excelente departamento de 3 ambientes con vista al parque, completamente renovado.',
    type: 'APARTMENT',
    status: 'AVAILABLE',
    price: 150000,
    currency: 'USD',
    address: 'Av. Santa Fe 1800',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    zipCode: '1425',
    bedrooms: 3,
    bathrooms: 2,
    area: 85,
    yearBuilt: 2015,
    features: JSON.stringify(['Cocina equipada', 'Balcón', 'Parking']),
    images: JSON.stringify([]),
    ownerId: userId,
    listingType: 'SALE'
  },
  {
    id: uuidv4(),
    title: 'Casa Familiar en Vicente López',
    description: 'Casa de 4 habitaciones con jardín amplio, ideal para familias.',
    type: 'HOUSE',
    status: 'AVAILABLE',
    price: 320000,
    currency: 'USD',
    address: 'Calle Maipú 456',
    city: 'Vicente López',
    state: 'Buenos Aires',
    zipCode: '1638',
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    yearBuilt: 2008,
    features: JSON.stringify(['Jardín', 'Cochera', 'Piscina']),
    images: JSON.stringify([]),
    ownerId: userId,
    listingType: 'SALE'
  },
  {
    id: uuidv4(),
    title: 'Local Comercial en Centro',
    description: 'Local estratégico en pleno centro comercial de Buenos Aires.',
    type: 'COMMERCIAL',
    status: 'AVAILABLE',
    price: 280000,
    currency: 'USD',
    address: 'Av. Córdoba 1200',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    zipCode: '1055',
    bedrooms: null,
    bathrooms: 2,
    area: 120,
    yearBuilt: 1995,
    features: JSON.stringify(['Vidriera amplia', 'Aire acondicionado']),
    images: JSON.stringify([]),
    ownerId: userId,
    listingType: 'SALE'
  },
  {
    id: uuidv4(),
    title: 'PH en Almagro',
    description: 'PH moderno con terraza privada, excelente ubicación.',
    type: 'TOWNHOUSE',
    status: 'AVAILABLE',
    price: 195000,
    currency: 'USD',
    address: 'Calle Sarmiento 890',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    zipCode: '1174',
    bedrooms: 3,
    bathrooms: 2.5,
    area: 110,
    yearBuilt: 2010,
    features: JSON.stringify(['Terraza', 'Laundry', 'Seguridad 24hs']),
    images: JSON.stringify([]),
    ownerId: userId,
    listingType: 'SALE'
  },
  {
    id: uuidv4(),
    title: 'Terreno en Zona Norte',
    description: 'Terreno amplio ideal para construcción en zona residencial.',
    type: 'LAND',
    status: 'AVAILABLE',
    price: 85000,
    currency: 'USD',
    address: 'Calle privada sin nombre',
    city: 'Pilar',
    state: 'Buenos Aires',
    zipCode: '1629',
    bedrooms: null,
    bathrooms: null,
    area: 800,
    yearBuilt: null,
    features: JSON.stringify(['Servicios', 'Cerca de ruta']),
    images: JSON.stringify([]),
    ownerId: userId,
    listingType: 'SALE'
  }
];

const propertyStmt = db.prepare(`
  INSERT INTO properties (id, title, description, type, status, price, currency, address, city, state, zipCode, bedrooms, bathrooms, area, yearBuilt, features, images, ownerId, listingType, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

properties.forEach(property => {
  propertyStmt.run(
    property.id,
    property.title,
    property.description,
    property.type,
    property.status,
    property.price,
    property.currency,
    property.address,
    property.city,
    property.state,
    property.zipCode,
    property.bedrooms,
    property.bathrooms,
    property.area,
    property.yearBuilt,
    property.features,
    property.images,
    property.ownerId,
    property.listingType,
    now
  );
});

console.log(`Propiedades de prueba creadas: ${properties.length}`);

// Crear algunas transacciones de ejemplo
const transactions = [
  {
    id: uuidv4(),
    type: 'SALE',
    status: 'COMPLETED',
    amount: 150000,
    commission: 4500, // 3% de comisión
    notes: 'Venta exitosa del departamento en Palermo',
    propertyId: properties[0].id,
    clientId: clients[0].id,
    agentId: userId
  },
  {
    id: uuidv4(),
    type: 'RENTAL',
    status: 'IN_PROGRESS',
    amount: 2500,
    commission: 1250, // 50% del primer mes
    notes: 'Contrato de alquiler en proceso',
    propertyId: properties[3].id,
    clientId: clients[1].id,
    agentId: userId
  }
];

const transactionStmt = db.prepare(`
  INSERT INTO transactions (id, type, status, amount, commission, notes, propertyId, clientId, agentId, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

transactions.forEach(transaction => {
  transactionStmt.run(
    transaction.id,
    transaction.type,
    transaction.status,
    transaction.amount,
    transaction.commission,
    transaction.notes,
    transaction.propertyId,
    transaction.clientId,
    transaction.agentId,
    now
  );
});

console.log(`Transacciones de prueba creadas: ${transactions.length}`);

db.close();

console.log('\n🎉 Base de datos regenerada exitosamente!');
console.log('\n📊 Resumen de datos creados:');
console.log(`- Usuarios: 1`);
console.log(`- Clientes: ${clients.length}`);
console.log(`- Propiedades: ${properties.length}`);
console.log(`- Transacciones: ${transactions.length}`);

console.log('\n🔐 Credenciales de acceso:');
console.log('Email: test@example.com');
console.log('Password: 123456');

console.log('\n🚀 Ahora puedes iniciar el servidor con: npm start');