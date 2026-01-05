const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

class AuthService {
  constructor() {
    this.db = new Database('./dev.db');
    // Crear tabla si no existe
    this.db.exec(`
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
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Register new user
  async register(userData) {
    const { email, password, name, role = 'AGENT' } = userData;

    // Check if user already exists
    const existingStmt = this.db.prepare('SELECT id FROM users WHERE email = ?');
    const existingUser = existingStmt.get(email.toLowerCase().trim());

    if (existingUser) {
      throw new Error('El usuario ya existe con este email');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);
    const userId = 'user_' + Date.now();

    // Create user
    const insertStmt = this.db.prepare(`
      INSERT INTO users (id, email, password, name, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertStmt.run(userId, email.toLowerCase().trim(), hashedPassword, name.trim(), role, now, now);

    const user = {
      id: userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role: role
    };

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  // Login user
  async login(email, password) {
    // Find user
    const stmt = this.db.prepare('SELECT id, email, password, name, role FROM users WHERE email = ?');
    const user = stmt.get(email.toLowerCase().trim());

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };
  }

  // Get user profile
  async getProfile(userId) {
    const stmt = this.db.prepare('SELECT id, email, name, role, createdAt, updatedAt FROM users WHERE id = ?');
    const user = stmt.get(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Add counts (simplified for now)
    user._count = {
      properties: 0,
      clients: 0,
      transactions: 0
    };

    return user;
  }

  // Get user by ID
  async getUserById(userId) {
    const stmt = this.db.prepare('SELECT id, email, name, role, createdAt, updatedAt FROM users WHERE id = ?');
    const user = stmt.get(userId);
    return user;
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    const { password, ...data } = updateData;

    let hashedPassword;
    if (password) {
      hashedPassword = await this.hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...(hashedPassword && { password: hashedPassword })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    });

    return user;
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = new AuthService();
