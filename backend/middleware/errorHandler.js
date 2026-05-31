const { error } = require('../utils/response');

/** Manejador global de errores */
const errorHandler = (err, req, res, _next) => {
  console.error('[API Error]', err.message);

  if (err.code === 'ER_DUP_ENTRY') {
    return error(res, 'El registro ya existe (dato duplicado)', 409);
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return error(res, 'Referencia inválida en los datos enviados', 400);
  }

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  return error(res, message, status);
};

module.exports = { errorHandler };
