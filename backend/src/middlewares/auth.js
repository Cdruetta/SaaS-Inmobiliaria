const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    // Buscar usuario en la base de datos
    try {
      const authService = require('../services/authService');
      const user = await authService.getUserById(decoded.userId);
      req.user = user;
    } catch (dbError) {
      // Si no se encuentra en BD, usar datos del token
      req.user = {
        id: decoded.userId || 'temp-user-' + Date.now(),
        email: decoded.email || 'temp@example.com',
        name: decoded.name || 'Usuario Temporal',
        role: decoded.role || 'AGENT'
      };
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return res.status(500).json({ error: 'Error de autenticación' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
