const logger = require('../services/logger');

/**
 * Middleware para logging de requests HTTP
 * Registra información detallada de cada request
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Capturar la respuesta original para poder acceder al status code
  const originalSend = res.send;
  res.send = function(data) {
    res.locals.responseData = data;
    originalSend.call(this, data);
  };

  // Log cuando se complete la respuesta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Determinar el nivel de log basado en el status code
    let logLevel = 'http';
    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }

    logger.log(logLevel, 'HTTP Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString(),
    });

    // Log adicional para requests lentos (>1000ms)
    if (duration > 1000) {
      logger.warn('Slow Request Detected', {
        method: req.method,
        url: req.originalUrl || req.url,
        duration: `${duration}ms`,
        threshold: '1000ms',
      });
    }

    // Log adicional para errores del servidor
    if (statusCode >= 500) {
      logger.error('Server Error Response', {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        userId: req.user?.id,
        error: res.locals.error?.message,
      });
    }
  });

  next();
};

module.exports = requestLogger;