const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import logger
const logger = require('./services/logger');

// Import metrics service
const MetricsService = require('./services/metrics');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// Request logging middleware
const requestLogger = require('./middlewares/requestLogger');
app.use(requestLogger);

// HTTP Metrics middleware
app.use(MetricsService.httpMetricsMiddleware());

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
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/transactions', require('./routes/transactions'));

// Health check con métricas detalladas
app.get('/health', MetricsService.healthCheck());

// Métricas de Prometheus
app.get('/metrics', MetricsService.metricsEndpoint());


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
