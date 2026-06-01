const mapsService = require('../services/maps.service');
const { success, error } = require('../utils/response');

exports.config = async (req, res, next) => {
  try {
    return success(res, mapsService.getMapsConfig(), 'Configuración de mapas');
  } catch (e) {
    return error(res, e.message, 503);
  }
};

exports.directions = async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return error(res, 'Parámetros lat y lng requeridos', 400);
    }
    const data = await mapsService.getDirectionsToLote(lat, lng);
    return success(res, data, 'Ruta hacia el lote');
  } catch (e) {
    return error(res, e.message, 502);
  }
};

exports.reverseGeocode = async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return error(res, 'Parámetros lat y lng requeridos', 400);
    }
    const data = await mapsService.reverseGeocode(lat, lng);
    return success(res, data, 'Dirección del punto');
  } catch (e) {
    return error(res, e.message, 502);
  }
};
