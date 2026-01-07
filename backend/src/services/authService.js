const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

class AuthService {
  constructor() {
    this.db = new Database(path.join(__dirname, '../../dev.db'));
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
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
  }

  // Register new user
  async register(userData) {
    const { email, password, name, role = 'AGENT' } = userData;
    const { v4: uuidv4 } = require('uuid');

    // Check if user already exists
    const checkStmt = this.db.prepare('SELECT id FROM users WHERE email = ?');
    const existingUser = checkStmt.get(email.toLowerCase().trim());

    if (existingUser) {
      throw new Error('El usuario ya existe con este email');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);
    const now = new Date().toISOString();

    // Create user
    const insertStmt = this.db.prepare(`
      INSERT INTO users (id, email, password, name, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const userId = uuidv4();
    insertStmt.run(
      userId,
      email.toLowerCase().trim(),
      hashedPassword,
      name.trim(),
      role,
      now,
      now
    );

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
    const stmt = this.db.prepare(`
      SELECT id, email, password, name, role
      FROM users
      WHERE email = ?
    `);

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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            properties: true,
            clients: true,
            transactions: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  // Get user by ID
  async getUserById(userId) {
    const stmt = this.db.prepare(`
      SELECT id, email, name, role, createdAt, updatedAt
      FROM users
      WHERE id = ?
    `);

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

    const user = await this.prisma.user.update({
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
  async close() {
    await this.prisma.$disconnect();
  }
}

module.exports = new AuthService();
