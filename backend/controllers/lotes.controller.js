const lotesSvc = require('../services/lotes.service');
const { success, error, paginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const result = await lotesSvc.findAll({
      ...req.query,
      scope: req.scope,
      user: req.user,
    });
    return paginated(res, result.data, result.pagination, 'Lotes obtenidos');
  } catch (e) {
    next(e);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await lotesSvc.findById(req.params.id, req.scope, req.user);
    if (!item) return error(res, 'Lote no encontrado', 404);
    return success(res, item);
  } catch (e) {
    next(e);
  }
};

const prepareBody = (body, scope) => {
  const data = { ...body };
  if (scope?.rol === 'agricultor') {
    if (!scope.agricultorId) {
      const err = new Error('Su usuario no está vinculado a un agricultor activo');
      err.status = 403;
      throw err;
    }
    data.agricultor_id = scope.agricultorId;
  } else if (!data.agricultor_id) {
    const err = new Error('Debe seleccionar un agricultor');
    err.status = 400;
    throw err;
  }
  return data;
};

const create = async (req, res, next) => {
  try {
    const body = prepareBody(req.body, req.scope);
    const item = await lotesSvc.create(body, req.user);
    const msg =
      req.user.rol === 'agricultor'
        ? 'Solicitud de lote enviada. Un técnico o administrador la revisará.'
        : 'Lote creado';
    return success(res, item, msg, 201);
  } catch (e) {
    if (e.status === 403 || e.status === 400) return error(res, e.message, e.status);
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const body = prepareBody(req.body, req.scope);
    const item = await lotesSvc.update(req.params.id, body, req.user, req.scope);
    if (!item) return error(res, 'Lote no encontrado o no editable', 404);
    return success(res, item, 'Lote actualizado');
  } catch (e) {
    if (e.status === 403 || e.status === 400) return error(res, e.message, e.status);
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const deleted = await lotesSvc.remove(req.params.id);
    if (!deleted) return error(res, 'Lote no encontrado', 404);
    return success(res, null, 'Lote eliminado');
  } catch (e) {
    next(e);
  }
};

const aprobar = async (req, res, next) => {
  try {
    const item = await lotesSvc.aprobar(req.params.id, req.user.id);
    if (!item) return error(res, 'Lote no encontrado o ya fue revisado', 404);
    return success(res, item, 'Lote aprobado');
  } catch (e) {
    next(e);
  }
};

const rechazar = async (req, res, next) => {
  try {
    const motivo = req.body.motivo;
    const item = await lotesSvc.rechazar(req.params.id, req.user.id, motivo);
    if (!item) return error(res, 'Lote no encontrado o ya fue revisado', 404);
    return success(res, item, 'Lote rechazado');
  } catch (e) {
    next(e);
  }
};

module.exports = { getAll, getById, create, update, remove, aprobar, rechazar };
