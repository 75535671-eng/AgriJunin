const { success, error, paginated } = require('./response');

/** Factory de controladores CRUD MVC */
const createCrudController = (service, entityName) => ({
  getAll: async (req, res, next) => {
    try {
      const result = await service.findAll(req.query);
      return paginated(res, result.data, result.pagination, `${entityName} obtenidos`);
    } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await service.findById(req.params.id);
      if (!item) return error(res, `${entityName} no encontrado`, 404);
      return success(res, item);
    } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try {
      const item = await service.create(req.body);
      return success(res, item, `${entityName} creado`, 201);
    } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try {
      const exists = await service.findById(req.params.id);
      if (!exists) return error(res, `${entityName} no encontrado`, 404);
      const item = await service.update(req.params.id, req.body);
      return success(res, item, `${entityName} actualizado`);
    } catch (e) { next(e); }
  },
  remove: async (req, res, next) => {
    try {
      const deleted = await service.remove(req.params.id);
      if (!deleted) return error(res, `${entityName} no encontrado`, 404);
      return success(res, null, `${entityName} eliminado`);
    } catch (e) { next(e); }
  },
});

module.exports = { createCrudController };
