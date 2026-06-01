const dniService = require('../services/dni-peru.service');
const { success, error } = require('../utils/response');

exports.consultar = async (req, res, next) => {
  try {
    const dni = String(req.params.dni || '').trim();
    if (!/^\d{8}$/.test(dni)) {
      return error(res, 'El DNI debe tener 8 dígitos', 400);
    }
    const data = await dniService.consultarDni(dni);
    return success(res, data, 'Datos del DNI obtenidos');
  } catch (e) {
    return error(res, e.message || 'Error al consultar DNI', 400);
  }
};
