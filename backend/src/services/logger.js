const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colores para los diferentes niveles
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Formato personalizado
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.colorize({ all: true })
);

// Formato para archivos (sin colores)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transportes
const transports = [
  // Console log para desarrollo
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format,
  }),

  // Archivo de errores
  new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
    level: 'error',
    format: fileFormat,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
  }),

  // Archivo general
  new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
    format: fileFormat,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
  }),

  // Archivo específico para requests HTTP
  new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/http-%DATE%.log'),
    level: 'http',
    format: fileFormat,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '7d',
  }),
];

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
});

// Función helper para logs HTTP
logger.http = (message, meta = {}) => {
  logger.log('http', message, {
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

// Función helper para logs de requests
logger.request = (req, res, responseTime) => {
  logger.http('API Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });
};

// Función helper para logs de errores
logger.errorWithContext = (error, context = {}) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  });
};

// Función helper para logs de base de datos
logger.database = (operation, table, duration, success = true) => {
  logger.info('Database Operation', {
    operation,
    table,
    duration: `${duration}ms`,
    success,
    timestamp: new Date().toISOString(),
  });
};

// Función helper para logs de autenticación
logger.auth = (action, userId, success = true, details = {}) => {
  logger.info('Authentication Event', {
    action,
    userId,
    success,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

module.exports = logger;