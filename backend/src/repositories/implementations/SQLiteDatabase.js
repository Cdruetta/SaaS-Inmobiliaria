const Database = require('better-sqlite3');
const path = require('path');
const IDatabase = require('../interfaces/IDatabase');

/**
 * Implementación concreta de base de datos SQLite
 * Aplica el principio de Inversión de Dependencias (DIP)
 */
class SQLiteDatabase extends IDatabase {
  constructor(dbPath = path.join(__dirname, '../../../dev.db')) {
    super();
    this.db = new Database(dbPath);
    // Habilitar foreign keys en SQLite
    this.db.pragma('foreign_keys = ON');
  }

  all(query, params = []) {
    try {
      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error('Error executing SELECT query:', error);
      throw error;
    }
  }

  get(query, params = []) {
    try {
      const stmt = this.db.prepare(query);
      return stmt.get(...params);
    } catch (error) {
      console.error('Error executing SELECT (single) query:', error);
      throw error;
    }
  }

  run(query, params = []) {
    try {
      const stmt = this.db.prepare(query);
      return stmt.run(...params);
    } catch (error) {
      console.error('Error executing mutation query:', error);
      throw error;
    }
  }

  prepare(query) {
    try {
      return this.db.prepare(query);
    } catch (error) {
      console.error('Error preparing statement:', error);
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = SQLiteDatabase;