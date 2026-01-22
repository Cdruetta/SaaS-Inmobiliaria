const promClient = require('prom-client');

// Crear registro de métricas
const register = new promClient.Registry();

// Agregar métricas por defecto de Node.js
promClient.collectDefaultMetrics({ register });

// Métricas personalizadas para la aplicación
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

const activeUsers = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
});

const clientOperationsTotal = new promClient.Counter({
  name: 'client_operations_total',
  help: 'Total number of client operations',
  labelNames: ['operation', 'status'],
});

const propertyOperationsTotal = new promClient.Counter({
  name: 'property_operations_total',
  help: 'Total number of property operations',
  labelNames: ['operation', 'status'],
});

// Registrar métricas
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(databaseQueryDuration);
register.registerMetric(activeUsers);
register.registerMetric(clientOperationsTotal);
register.registerMetric(propertyOperationsTotal);

class MetricsService {
  // HTTP Metrics
  static recordHttpRequest(method, route, statusCode, duration) {
    const durationInSeconds = duration / 1000;

    httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(durationInSeconds);

    httpRequestsTotal
      .labels(method, route, statusCode.toString())
      .inc();
  }

  // Database Metrics
  static recordDatabaseQuery(operation, table, duration) {
    const durationInSeconds = duration / 1000;
    databaseQueryDuration
      .labels(operation, table)
      .observe(durationInSeconds);
  }

  // User Metrics
  static setActiveUsers(count) {
    activeUsers.set(count);
  }

  static incrementActiveUsers() {
    activeUsers.inc();
  }

  static decrementActiveUsers() {
    activeUsers.dec();
  }

  // Client Operations Metrics
  static recordClientOperation(operation, success = true) {
    clientOperationsTotal
      .labels(operation, success ? 'success' : 'error')
      .inc();
  }

  // Property Operations Metrics
  static recordPropertyOperation(operation, success = true) {
    propertyOperationsTotal
      .labels(operation, success ? 'success' : 'error')
      .inc();
  }

  // Middleware para capturar métricas HTTP
  static httpMetricsMiddleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        const method = req.method;
        const route = req.route?.path || req.originalUrl.split('?')[0];
        const statusCode = res.statusCode;

        this.recordHttpRequest(method, route, statusCode, duration);
      });

      next();
    };
  }

  // Endpoint para exponer métricas
  static metricsEndpoint() {
    return async (req, res) => {
      try {
        const metrics = await register.metrics();
        res.set('Content-Type', register.contentType);
        res.end(metrics);
      } catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).end();
      }
    };
  }

  // Health check con métricas básicas
  static healthCheck() {
    return (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
      };

      // Actualizar métricas de health
      this.setActiveUsers(Math.floor(Math.random() * 100)); // Simulado

      res.json(health);
    };
  }

  // Obtener registro de métricas (para testing)
  static getRegister() {
    return register;
  }
}

module.exports = MetricsService;