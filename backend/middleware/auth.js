const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

/**
 * Middleware JWT - protege rutas privadas
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return error(res, 'Token no proporcionado', 401);
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return error(res, 'Token inválido o expirado', 401);
  }
};

/** Restringe acceso por roles */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return error(res, 'No autenticado', 401);
  if (!roles.includes(req.user.rol)) {
    return error(res, 'No tiene permisos para esta acción', 403);
  }
  next();
};

module.exports = { authenticate, authorize };
