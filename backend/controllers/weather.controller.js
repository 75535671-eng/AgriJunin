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
    const loteId = req.body.lote_id ? parseInt(req.body.lote_id, 10) : null;
    const result = await weatherService.sincronizarClima(req.user.id, loteId);
    return success(res, result, 'Clima sincronizado con registros y sensores');
  } catch (e) {
    if (e.message?.includes('lotes activos')) return error(res, e.message, 404);
    next(e);
  }
};
