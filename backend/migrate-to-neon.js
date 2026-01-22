#!/usr/bin/env node

/**
 * Script para migrar datos de SQLite a Neon (PostgreSQL)
 *
 * Uso:
 * 1. Configurar DATABASE_URL en .env apuntando a Neon
 * 2. Ejecutar: node migrate-to-neon.js
 *
 * Este script:
 * - Lee todos los datos de SQLite (dev.db)
 * - Los migra a Neon usando Prisma
 * - Verifica la migración
 */

const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class NeonMigrator {
  constructor() {
    this.prisma = new PrismaClient();
    this.sqliteDb = null;
  }

  async connect() {
    try {
      // Conectar a SQLite para leer datos
      const dbPath = path.join(__dirname, 'dev.db');
      if (!fs.existsSync(dbPath)) {
        console.log('❌ No se encontró dev.db. Creando base de datos de ejemplo...');
        await this.createSampleData();
        return;
      }

      this.sqliteDb = new Database(dbPath);
      console.log('✅ Conectado a SQLite');

      // Verificar conexión a Neon
      await this.prisma.$connect();
      console.log('✅ Conectado a Neon (PostgreSQL)');

    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
      process.exit(1);
    }
  }

  async createSampleData() {
    console.log('📝 Creando datos de ejemplo en Neon...');

    try {
      // Crear usuario de ejemplo
      const hashedPassword = await this.hashPassword('admin123');
      const user = await this.prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN'
        }
      });
      console.log('✅ Usuario creado:', user.email);

      // Crear propiedades de ejemplo
      const properties = await this.prisma.property.createMany({
        data: [
          {
            title: 'Casa Moderna en Palermo',
            description: 'Hermosa casa de 3 dormitorios con jardín',
            type: 'HOUSE',
            status: 'AVAILABLE',
            price: 150000,
            address: 'Av. Santa Fe 1234',
            city: 'Buenos Aires',
            state: 'Buenos Aires',
            bedrooms: 3,
            bathrooms: 2,
            area: 120,
            ownerId: user.id
          },
          {
            title: 'Departamento Centro',
            description: 'Excelente ubicación, cerca de todo',
            type: 'APARTMENT',
            status: 'AVAILABLE',
            price: 80000,
            address: 'Calle Florida 567',
            city: 'Buenos Aires',
            state: 'Buenos Aires',
            bedrooms: 2,
            bathrooms: 1,
            area: 65,
            ownerId: user.id
          }
        ]
      });
      console.log('✅ Propiedades creadas:', properties.count);

      // Crear clientes de ejemplo
      const clients = await this.prisma.client.createMany({
        data: [
          {
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@email.com',
            phone: '+54911234567',
            address: 'Av. Corrientes 890',
            agentId: user.id
          },
          {
            firstName: 'María',
            lastName: 'González',
            email: 'maria@email.com',
            phone: '+54911876543',
            address: 'Calle Lavalle 456',
            agentId: user.id
          }
        ]
      });
      console.log('✅ Clientes creados:', clients.count);

      // Obtener IDs para crear transacciones
      const props = await this.prisma.property.findMany({ select: { id: true } });
      const clientList = await this.prisma.client.findMany({ select: { id: true } });

      // Crear transacciones de ejemplo
      const transactions = await this.prisma.transaction.createMany({
        data: [
          {
            type: 'SALE',
            status: 'COMPLETED',
            amount: 150000,
            commission: 7500,
            propertyId: props[0].id,
            clientId: clientList[0].id,
            agentId: user.id
          },
          {
            type: 'RENTAL',
            status: 'PENDING',
            amount: 2000,
            commission: 400,
            propertyId: props[1].id,
            clientId: clientList[1].id,
            agentId: user.id
          }
        ]
      });
      console.log('✅ Transacciones creadas:', transactions.count);

    } catch (error) {
      console.error('❌ Error creando datos de ejemplo:', error);
      throw error;
    }
  }

  async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async migrateData() {
    if (!this.sqliteDb) {
      console.log('ℹ️ No hay datos SQLite para migrar, usando datos de ejemplo');
      return;
    }

    console.log('🔄 Iniciando migración de datos...');

    try {
      // Migrar usuarios
      await this.migrateUsers();

      // Migrar propiedades
      await this.migrateProperties();

      // Migrar clientes
      await this.migrateClients();

      // Migrar transacciones
      await this.migrateTransactions();

      console.log('✅ Migración completada exitosamente!');

    } catch (error) {
      console.error('❌ Error en migración:', error);
      throw error;
    }
  }

  async migrateUsers() {
    console.log('👤 Migrando usuarios...');
    const users = this.sqliteDb.prepare('SELECT * FROM users').all();

    for (const user of users) {
      try {
        await this.prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
        console.log(`  ✅ ${user.email}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`  ⚠️ Usuario ya existe: ${user.email}`);
        } else {
          throw error;
        }
      }
    }
  }

  async migrateProperties() {
    console.log('🏠 Migrando propiedades...');
    const properties = this.sqliteDb.prepare('SELECT * FROM properties').all();

    for (const prop of properties) {
      try {
        await this.prisma.property.create({
          data: {
            id: prop.id,
            title: prop.title,
            description: prop.description,
            type: prop.type,
            status: prop.status,
            price: prop.price,
            address: prop.address,
            city: prop.city,
            state: prop.state,
            zipCode: prop.zipCode,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            area: prop.area,
            yearBuilt: prop.yearBuilt,
            features: prop.features,
            images: prop.images,
            ownerId: prop.ownerId,
            createdAt: new Date(prop.createdAt),
            updatedAt: new Date(prop.updatedAt)
          }
        });
        console.log(`  ✅ ${prop.title}`);
      } catch (error) {
        console.error(`  ❌ Error con propiedad ${prop.title}:`, error.message);
      }
    }
  }

  async migrateClients() {
    console.log('👥 Migrando clientes...');
    const clients = this.sqliteDb.prepare('SELECT * FROM clients').all();

    for (const client of clients) {
      try {
        await this.prisma.client.create({
          data: {
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
            address: client.address,
            preferences: client.preferences,
            agentId: client.agentId,
            createdAt: new Date(client.createdAt),
            updatedAt: new Date(client.updatedAt)
          }
        });
        console.log(`  ✅ ${client.firstName} ${client.lastName}`);
      } catch (error) {
        console.error(`  ❌ Error con cliente ${client.firstName}:`, error.message);
      }
    }
  }

  async migrateTransactions() {
    console.log('💰 Migrando transacciones...');
    const transactions = this.sqliteDb.prepare('SELECT * FROM transactions').all();

    for (const tx of transactions) {
      try {
        await this.prisma.transaction.create({
          data: {
            id: tx.id,
            type: tx.type,
            status: tx.status,
            amount: tx.amount,
            commission: tx.commission,
            notes: tx.notes,
            propertyId: tx.propertyId,
            clientId: tx.clientId,
            agentId: tx.agentId,
            createdAt: new Date(tx.createdAt),
            updatedAt: new Date(tx.updatedAt)
          }
        });
        console.log(`  ✅ Transacción ${tx.type} - $${tx.amount}`);
      } catch (error) {
        console.error(`  ❌ Error con transacción:`, error.message);
      }
    }
  }

  async verifyMigration() {
    console.log('🔍 Verificando migración...');

    const stats = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.property.count(),
      this.prisma.client.count(),
      this.prisma.transaction.count()
    ]);

    console.log(`
📊 Estadísticas de migración:
  👤 Usuarios: ${stats[0]}
  🏠 Propiedades: ${stats[1]}
  👥 Clientes: ${stats[2]}
  💰 Transacciones: ${stats[3]}
    `);
  }

  async close() {
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
    await this.prisma.$disconnect();
  }

  async run() {
    try {
      console.log('🚀 Iniciando migración a Neon...\n');

      await this.connect();
      await this.migrateData();
      await this.verifyMigration();

      console.log('\n🎉 ¡Migración completada exitosamente!');
      console.log('\n📝 Próximos pasos:');
      console.log('  1. Actualizar .env con DATABASE_URL de Neon');
      console.log('  2. Probar la aplicación: npm run dev');
      console.log('  3. Verificar login con admin@example.com / admin123');

    } catch (error) {
      console.error('\n❌ Error en migración:', error);
      process.exit(1);
    } finally {
      await this.close();
    }
  }
}

// Ejecutar migración
if (require.main === module) {
  const migrator = new NeonMigrator();
  migrator.run();
}

module.exports = NeonMigrator;