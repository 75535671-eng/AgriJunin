/**
 * Respuestas HTTP estandarizadas para la API
 */
const success = (res, data, message = 'Operación exitosa', status = 200) =>
  res.status(status).json({ success: true, message, data });

const error = (res, message = 'Error interno', status = 500, errors = null) =>
  res.status(status).json({
    success: false,
    message,
    ...(errors && { errors }),
  });

const paginated = (res, data, pagination, message = 'Datos obtenidos') =>
  res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });

module.exports = { success, error, paginated };
