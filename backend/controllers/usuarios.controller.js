const usuariosService = require('../services/usuarios.service');
const { success, error } = require('../utils/response');

exports.listPendientes = async (req, res, next) => {
  try {
    const data = await usuariosService.listPendientesTecnicos();
    return success(res, data, 'Solicitudes pendientes');
  } catch (e) { next(e); }
};

exports.aprobar = async (req, res, next) => {
  try {
    const user = await usuariosService.aprobarCuenta(req.params.id, req.user.id);
    if (!user) return error(res, 'Solicitud no encontrada', 404);
    return success(res, user, 'Cuenta de técnico aprobada');
  } catch (e) { next(e); }
};

exports.rechazar = async (req, res, next) => {
  try {
    const result = await usuariosService.rechazarCuenta(req.params.id, req.user.id, req.body.motivo);
    if (!result) return error(res, 'Solicitud no encontrada', 404);
    return success(res, result, 'Cuenta rechazada');
  } catch (e) { next(e); }
};
