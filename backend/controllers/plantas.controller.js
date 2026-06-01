const plantasService = require('../services/plantas.service');
const { success, error } = require('../utils/response');

exports.buscar = async (req, res, next) => {
  try {
    const q = req.query.q || req.query.nombre || '';
    const data = await plantasService.buscarEspecies(q);
    return success(res, data, 'Especies encontradas');
  } catch (e) {
    if (e.message?.includes('TREFLE') || e.message?.includes('token') || e.message?.includes('API')) {
      return error(res, e.message, 503);
    }
    if (e.message?.includes('2 caracteres')) {
      return error(res, e.message, 400);
    }
    return error(res, e.message || 'Error al buscar especies', 502);
  }
};
