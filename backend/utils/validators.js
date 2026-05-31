const { body, param, query } = require('express-validator');

const idParam = [param('id').isInt({ min: 1 }).withMessage('ID inválido')];

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
];

const registerRules = [
  body('nombre').trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Debe tener mayúscula, minúscula y número'),
  body('rol').optional().isIn(['administrador', 'agricultor', 'tecnico']),
];

const agricultorRules = [
  body('usuario_id').isInt({ min: 1 }),
  body('dni').matches(/^\d{8}$/).withMessage('DNI debe tener 8 dígitos'),
  body('nombres').trim().isLength({ min: 2, max: 100 }),
  body('apellidos').trim().isLength({ min: 2, max: 100 }),
  body('hectareas_totales').optional().isFloat({ min: 0 }),
  body('fecha_registro').isISO8601().toDate(),
];

const cultivoRules = [
  body('nombre').trim().isLength({ min: 2, max: 120 }),
  body('tipo').isIn(['cereal', 'tuberculo', 'hortaliza', 'fruta', 'legumbre', 'forraje', 'otro']),
  body('temporada').optional().isIn(['verano', 'invierno', 'todo_año']),
  body('dias_crecimiento').optional().isInt({ min: 1, max: 365 }),
];

const loteRules = [
  body('agricultor_id').isInt({ min: 1 }),
  body('codigo_lote').trim().isLength({ min: 3, max: 30 }),
  body('nombre').trim().isLength({ min: 2, max: 120 }),
  body('area_hectareas').isFloat({ min: 0.01 }),
  body('tipo_suelo').optional().isIn(['arcilloso', 'arenoso', 'franco', 'limoso', 'otro']),
  body('estado').optional().isIn(['preparacion', 'siembra', 'crecimiento', 'cosecha', 'barbecho']),
];

const sensorRules = [
  body('lote_id').isInt({ min: 1 }),
  body('codigo_sensor').trim().isLength({ min: 3, max: 40 }),
  body('nombre').trim().isLength({ min: 2, max: 120 }),
  body('tipo').isIn(['humedad_suelo', 'temperatura', 'humedad_aire', 'ph', 'luz', 'pluviometro', 'multiparametro']),
  body('unidad_medida').trim().notEmpty(),
];

const registroRules = [
  body('lote_id').isInt({ min: 1 }),
  body('cultivo_id').isInt({ min: 1 }),
  body('temperatura').optional().isFloat({ min: -20, max: 50 }),
  body('humedad_suelo').optional().isFloat({ min: 0, max: 100 }),
  body('humedad_aire').optional().isFloat({ min: 0, max: 100 }),
  body('ph_suelo').optional().isFloat({ min: 0, max: 14 }),
];

const alertaRules = [
  body('registro_id').isInt({ min: 1 }),
  body('tipo').isIn(['humedad', 'temperatura', 'ph', 'pluvia', 'sensor', 'produccion', 'sistema']),
  body('nivel').isIn(['info', 'advertencia', 'critica']),
  body('titulo').trim().isLength({ min: 3, max: 200 }),
  body('mensaje').trim().isLength({ min: 5 }),
];

module.exports = {
  idParam, paginationQuery, loginRules, registerRules,
  agricultorRules, cultivoRules, loteRules, sensorRules, registroRules, alertaRules,
};
