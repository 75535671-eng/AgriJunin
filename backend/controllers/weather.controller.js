const weatherService = require('../services/weather.service');
const { success, error } = require('../utils/response');

exports.getHuancayo = async (req, res, next) => {
  try {
    const clima = await weatherService.fetchClimaHuancayo();
    return success(res, clima, 'Clima actual de Huancayo (Open-Meteo)');
  } catch (e) {
    next(e);
  }
};

exports.sincronizar = async (req, res, next) => {
  try {
    const rol = req.user?.rol;
    const syncTodos = req.body.todos === true || req.body.todos === 'true' || req.body.todos === 1;

    if (syncTodos && ['administrador', 'tecnico'].includes(rol)) {
      const result = await weatherService.sincronizarClimaTodos(req.user.id);
      const n = result.sincronizacion.lotes_procesados;
      return success(
        res,
        result,
        `Clima sincronizado en ${n} lote${n === 1 ? '' : 's'} activos`
      );
    }

    const loteId = req.body.lote_id ? parseInt(req.body.lote_id, 10) : null;
    const result = await weatherService.sincronizarClima(req.user.id, loteId, req.scope);
    return success(res, result, 'Clima sincronizado con registros y sensores');
  } catch (e) {
    if (e.message?.includes('lotes activos')) return error(res, e.message, 404);
    next(e);
  }
};
