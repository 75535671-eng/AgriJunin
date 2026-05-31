const { validationResult } = require('express-validator');
const { error } = require('../utils/response');

/** Procesa resultados de express-validator */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Errores de validación', 422, errors.array());
  }
  next();
};

module.exports = { validate };
