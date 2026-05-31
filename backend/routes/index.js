const express = require('express');
const { createCrudController } = require('../utils/crudController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const authCtrl = require('../controllers/auth.controller');
const dashCtrl = require('../controllers/dashboard.controller');
const weatherCtrl = require('../controllers/weather.controller');
const agricultoresSvc = require('../services/agricultores.service');
const cultivosSvc = require('../services/cultivos.service');
const lotesSvc = require('../services/lotes.service');
const sensoresSvc = require('../services/sensores.service');
const registrosSvc = require('../services/registros.service');
const alertasSvc = require('../services/alertas.service');
const v = require('../utils/validators');

const router = express.Router();

// Auth público
router.post('/auth/login', v.loginRules, validate, authCtrl.login);
router.post('/auth/register', v.registerRules, validate, authCtrl.register);

// Rutas protegidas
router.use(authenticate);

router.get('/auth/profile', authCtrl.profile);
router.get('/dashboard/stats', dashCtrl.getStats);

// Clima real Huancayo — Open-Meteo
router.get('/clima/huancayo', weatherCtrl.getHuancayo);
router.post('/clima/sincronizar', authorize('administrador', 'tecnico'), weatherCtrl.sincronizar);

const crudRoutes = (path, service, name, rules, roles = ['administrador', 'tecnico', 'agricultor']) => {
  const ctrl = createCrudController(service, name);
  const adminOnly = authorize('administrador', 'tecnico');
  const allRoles = authorize(...roles);

  router.get(`/${path}`, v.paginationQuery, validate, allRoles, ctrl.getAll);
  router.get(`/${path}/:id`, v.idParam, validate, allRoles, ctrl.getById);
  router.post(`/${path}`, rules, validate, adminOnly, ctrl.create);
  router.put(`/${path}/:id`, v.idParam, validate, adminOnly, ctrl.update);
  router.delete(`/${path}/:id`, v.idParam, validate, authorize('administrador'), ctrl.remove);
};

crudRoutes('agricultores', agricultoresSvc, 'Agricultor', v.agricultorRules);
crudRoutes('cultivos', cultivosSvc, 'Cultivo', v.cultivoRules);
crudRoutes('lotes', lotesSvc, 'Lote', v.loteRules);
crudRoutes('sensores', sensoresSvc, 'Sensor', v.sensorRules);
crudRoutes('registros', registrosSvc, 'Registro agrícola', v.registroRules);
crudRoutes('alertas', alertasSvc, 'Alerta', v.alertaRules);

module.exports = router;
