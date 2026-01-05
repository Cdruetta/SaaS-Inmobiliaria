const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost origins for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }

    // In production, you would check against a whitelist
    // For now, allow all for development
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (temporarily disabled for debugging)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs (increased for debugging)
});
// app.use(limiter); // TEMPORARILY DISABLED

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Inmobiliaria SaaS API' });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/transactions', require('./routes/transactions'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// TEMPORAL: Endpoint para verificar token (quitar en producción)
app.get('/api/verify-token', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.json({ valid: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    res.json({
      valid: true,
      decoded: decoded,
      user: req.user || 'Not set by middleware'
    });
  } catch (error) {
    res.json({
      valid: false,
      error: error.message,
      token: req.headers['authorization']?.split(' ')[1]
    });
  }
});

// TEMPORAL: Endpoint para crear cliente de prueba sin auth (quitar en producción)
app.post('/api/test-create-client', async (req, res) => {
  try {
    console.log('Creating test client...');
    const clientData = req.body;

    const clientService = require('./services/clientService');
    const client = await clientService.createClient(clientData, 'temp-user-id');

    res.json({
      message: 'Cliente de prueba creado',
      client
    });
  } catch (error) {
    console.error('Error creating test client:', error);
    res.status(500).json({
      error: error.message || 'Error al crear cliente de prueba'
    });
  }
});

// TEMPORAL: Endpoint para crear usuario de prueba (quitar en producción)
app.post('/api/create-test-user', async (req, res) => {
  try {
    console.log('Creating test user...');

    // Crear tabla si no existe
    const Database = require('better-sqlite3');
    const db = new Database('./dev.db');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    // Crear tabla si no existe
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

    // Verificar si existe usuario
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get('test@example.com');

    let user;
    if (existingUser) {
      console.log('User exists');
      user = existingUser;
    } else {
      console.log('Creating new user...');
      const hashedPassword = await bcrypt.hash('123456', 12);
      const userId = 'user_' + Date.now();

      const stmt = db.prepare(`
        INSERT INTO users (id, email, password, name, role, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      stmt.run(userId, 'test@example.com', hashedPassword, 'Usuario de Prueba', 'AGENT', now);
      user = { id: userId, email: 'test@example.com', name: 'Usuario de Prueba', role: 'AGENT' };
      console.log('User created');
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    db.close();

    res.json({
      message: existingUser ? 'Usuario de prueba encontrado' : 'Usuario de prueba creado',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      credentials: {
        email: 'test@example.com',
        password: '123456'
      }
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({
      error: error.message || 'Error al crear usuario de prueba'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
