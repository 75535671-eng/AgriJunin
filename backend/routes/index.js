const express = require('express');
const { createCrudController } = require('../utils/crudController');
const { authenticate, authorize } = require('../middleware/auth');
const { attachScope } = require('../middleware/scope');
const { validate } = require('../middleware/validate');
const authCtrl = require('../controllers/auth.controller');
const dniCtrl = require('../controllers/dni.controller');
const usuariosCtrl = require('../controllers/usuarios.controller');
const dashCtrl = require('../controllers/dashboard.controller');
const weatherCtrl = require('../controllers/weather.controller');
const agricultoresSvc = require('../services/agricultores.service');
const cultivosSvc = require('../services/cultivos.service');
const lotesSvc = require('../services/lotes.service');
const sensoresSvc = require('../services/sensores.service');
const registrosSvc = require('../services/registros.service');
const alertasSvc = require('../services/alertas.service');
const cultivosCtrl = require('../controllers/cultivos.controller');
const lotesCtrl = require('../controllers/lotes.controller');
const mapsCtrl = require('../controllers/maps.controller');
const plantasCtrl = require('../controllers/plantas.controller');
const v = require('../utils/validators');

const router = express.Router();

// Auth público
router.get('/auth/consulta-dni/:dni', dniCtrl.consultar);
router.post('/auth/login', v.loginRules, validate, authCtrl.login);
router.post('/auth/register', v.registerRules, validate, authCtrl.register);

// Rutas protegidas
router.use(authenticate);
router.use(attachScope);

router.get('/auth/profile', authCtrl.profile);

router.get('/usuarios/pendientes', authorize('administrador'), usuariosCtrl.listPendientes);
router.patch('/usuarios/:id/aprobar', v.idParam, validate, authorize('administrador'), usuariosCtrl.aprobar);
router.patch('/usuarios/:id/rechazar', v.idParam, validate, authorize('administrador'), usuariosCtrl.rechazar);
router.get('/dashboard/stats', dashCtrl.getStats);

// Clima real Huancayo — Open-Meteo
router.get('/clima/huancayo', weatherCtrl.getHuancayo);
router.post('/clima/sincronizar', authorize('administrador', 'tecnico', 'agricultor'), weatherCtrl.sincronizar);

router.get('/maps/config', authorize('administrador', 'tecnico', 'agricultor'), mapsCtrl.config);
router.get('/maps/directions', authorize('administrador', 'tecnico', 'agricultor'), mapsCtrl.directions);
router.get('/maps/geocode', authorize('administrador', 'tecnico', 'agricultor'), mapsCtrl.reverseGeocode);

router.get('/plantas/buscar', authorize('administrador', 'tecnico', 'agricultor'), plantasCtrl.buscar);

const crudRoutes = (path, service, name, rules, readRoles = ['administrador', 'tecnico', 'agricultor']) => {
  const ctrl = createCrudController(service, name);
  const canWrite = authorize('administrador', 'tecnico');
  const canRead = authorize(...readRoles);

  router.get(`/${path}`, v.paginationQuery, validate, canRead, ctrl.getAll);
  router.get(`/${path}/:id`, v.idParam, validate, canRead, ctrl.getById);
  router.post(`/${path}`, rules, validate, canWrite, ctrl.create);
  router.put(`/${path}/:id`, v.idParam, validate, canWrite, ctrl.update);
  router.delete(`/${path}/:id`, v.idParam, validate, authorize('administrador'), ctrl.remove);
};

crudRoutes('agricultores', agricultoresSvc, 'Agricultor', v.agricultorRules, ['administrador', 'tecnico']);

router.get('/cultivos', v.paginationQuery, validate, authorize('administrador', 'tecnico', 'agricultor'), cultivosCtrl.getAll);
router.get('/cultivos/:id', v.idParam, validate, authorize('administrador', 'tecnico', 'agricultor'), cultivosCtrl.getById);
router.post('/cultivos', v.cultivoRules, validate, authorize('administrador', 'tecnico', 'agricultor'), cultivosCtrl.create);
router.put('/cultivos/:id', v.idParam, validate, authorize('administrador', 'tecnico', 'agricultor'), cultivosCtrl.update);
router.patch('/cultivos/:id/aprobar', v.idParam, validate, authorize('administrador', 'tecnico'), cultivosCtrl.aprobar);
router.patch('/cultivos/:id/rechazar', v.idParam, validate, authorize('administrador', 'tecnico'), cultivosCtrl.rechazar);
router.delete('/cultivos/:id', v.idParam, validate, authorize('administrador'), cultivosCtrl.remove);

router.get('/lotes', v.paginationQuery, validate, authorize('administrador', 'tecnico', 'agricultor'), lotesCtrl.getAll);
router.get('/lotes/:id', v.idParam, validate, authorize('administrador', 'tecnico', 'agricultor'), lotesCtrl.getById);
router.post('/lotes', v.loteRules, validate, authorize('administrador', 'tecnico', 'agricultor'), lotesCtrl.create);
router.put('/lotes/:id', v.idParam, validate, authorize('administrador', 'tecnico', 'agricultor'), lotesCtrl.update);
router.patch('/lotes/:id/aprobar', v.idParam, validate, authorize('administrador', 'tecnico'), lotesCtrl.aprobar);
router.patch('/lotes/:id/rechazar', v.idParam, validate, authorize('administrador', 'tecnico'), lotesCtrl.rechazar);
router.delete('/lotes/:id', v.idParam, validate, authorize('administrador'), lotesCtrl.remove);
crudRoutes('sensores', sensoresSvc, 'Sensor', v.sensorRules);
crudRoutes('registros', registrosSvc, 'Registro agrícola', v.registroRules);
crudRoutes('alertas', alertasSvc, 'Alerta', v.alertaRules);

module.exports = router;
