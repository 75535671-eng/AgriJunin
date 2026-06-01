const cultivosService = require('../services/cultivos.service');
const { success, error, paginated } = require('../utils/response');

const ctrl = {
  getAll: async (req, res, next) => {
    try {
      const result = await cultivosService.findAll({ ...req.query, scope: req.scope, user: req.user });
      return paginated(res, result.data, result.pagination, 'Cultivos obtenidos');
    } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await cultivosService.findById(req.params.id, req.scope, req.user);
      if (!item) return error(res, 'Cultivo no encontrado', 404);
      return success(res, item);
    } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try {
      const item = await cultivosService.create(req.body, req.user);
      const msg = req.user.rol === 'agricultor'
        ? 'Solicitud enviada. Un técnico o administrador debe aprobarla.'
        : 'Cultivo creado';
      return success(res, item, msg, 201);
    } catch (e) {
      if (e.status === 400) return error(res, e.message, 400);
      next(e);
    }
  },
  update: async (req, res, next) => {
    try {
      const item = await cultivosService.update(req.params.id, req.body, req.user);
      if (!item) return error(res, 'Cultivo no encontrado o sin permiso', 404);
      return success(res, item, 'Cultivo actualizado');
    } catch (e) { next(e); }
  },
  remove: async (req, res, next) => {
    try {
      const deleted = await cultivosService.remove(req.params.id);
      if (!deleted) return error(res, 'Cultivo no encontrado', 404);
      return success(res, null, 'Cultivo eliminado');
    } catch (e) { next(e); }
  },
  aprobar: async (req, res, next) => {
    try {
      const item = await cultivosService.aprobar(req.params.id, req.user.id);
      if (!item) return error(res, 'Solicitud no encontrada o ya procesada', 404);
      return success(res, item, 'Cultivo aprobado y disponible en el catálogo');
    } catch (e) { next(e); }
  },
  rechazar: async (req, res, next) => {
    try {
      const item = await cultivosService.rechazar(req.params.id, req.user.id, req.body.motivo);
      if (!item) return error(res, 'Solicitud no encontrada o ya procesada', 404);
      return success(res, item, 'Solicitud rechazada');
    } catch (e) { next(e); }
  },
};

module.exports = ctrl;
