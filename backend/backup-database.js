#!/usr/bin/env node

/**
 * Script para backup automático de la base de datos
 * Uso: node backup-database.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('./src/services/logger');

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
    this.dbPath = path.join(__dirname, 'dev.db');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  }

  async createBackup() {
    try {
      logger.info('Starting database backup process');

      // Verificar que existe la base de datos
      if (!fs.existsSync(this.dbPath)) {
        throw new Error('Database file not found');
      }

      // Crear directorio de backups si no existe
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
        logger.info('Created backups directory');
      }

      // Generar nombre del archivo de backup
      const backupFileName = `backup-${this.timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Copiar archivo de base de datos
      fs.copyFileSync(this.dbPath, backupPath);
      logger.info(`Database backup created: ${backupFileName}`);

      // Copiar también archivos WAL y SHM si existen (SQLite)
      const walFile = `${this.dbPath}-wal`;
      const shmFile = `${this.dbPath}-shm`;

      if (fs.existsSync(walFile)) {
        fs.copyFileSync(walFile, `${backupPath}-wal`);
        logger.info('WAL file backup created');
      }

      if (fs.existsSync(shmFile)) {
        fs.copyFileSync(shmFile, `${backupPath}-shm`);
        logger.info('SHM file backup created');
      }

      // Limpiar backups antiguos (mantener últimos 10)
      await this.cleanupOldBackups();

      // Verificar integridad del backup
      await this.verifyBackup(backupPath);

      logger.info('Database backup completed successfully');
      return backupPath;

    } catch (error) {
      logger.error('Database backup failed:', error);
      throw error;
    }
  }

  async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stats: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      // Mantener solo los 10 backups más recientes
      const maxBackups = parseInt(process.env.BACKUP_RETENTION_COUNT) || 10;

      if (files.length > maxBackups) {
        const filesToDelete = files.slice(maxBackups);

        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          logger.info(`Deleted old backup: ${file.name}`);
        }
      }
    } catch (error) {
      logger.warn('Error cleaning up old backups:', error.message);
    }
  }

  async verifyBackup(backupPath) {
    try {
      // Verificar que el archivo existe y tiene contenido
      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      // Intentar una consulta simple para verificar integridad
      const Database = require('better-sqlite3');
      const db = new Database(backupPath, { readonly: true });

      const result = db.prepare('SELECT COUNT(*) as count FROM sqlite_master').get();
      db.close();

      if (result.count === 0) {
        throw new Error('Backup file appears to be corrupted');
      }

      logger.info('Backup verification successful');
    } catch (error) {
      logger.error('Backup verification failed:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        console.log('No backups directory found');
        return;
      }

      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: this.formatBytes(stats.size),
            created: stats.mtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));

      console.log('\n📁 Database Backups:');
      console.log('==================');
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   Size: ${file.size}`);
        console.log(`   Created: ${file.created}`);
        console.log('');
      });

    } catch (error) {
      console.error('Error listing backups:', error.message);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async scheduleBackup() {
    const intervalHours = parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24;

    logger.info(`Scheduling automatic backups every ${intervalHours} hours`);

    setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }
}

// Función principal
async function main() {
  const backup = new DatabaseBackup();
  const command = process.argv[2];

  switch (command) {
    case 'list':
      await backup.listBackups();
      break;

    case 'schedule':
      await backup.scheduleBackup();
      console.log('Backup scheduler started. Press Ctrl+C to stop.');
      // Mantener el proceso vivo
      process.stdin.resume();
      break;

    default:
      const backupPath = await backup.createBackup();
      console.log(`✅ Backup created: ${path.basename(backupPath)}`);
      break;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseBackup;