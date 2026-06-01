const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

exports.login = async (req, res, next) => {
  try {
    const loginId = req.body.dni || req.body.email || req.body.login;
    const result = await authService.login(loginId, req.body.password);
    if (!result) return error(res, 'Credenciales inválidas', 401);
    return success(res, result, 'Inicio de sesión exitoso');
  } catch (e) {
    if (e.status) return error(res, e.message, e.status);
    next(e);
  }
};

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    const msg = result.pendienteAprobacion
      ? 'Registro recibido. Un administrador debe aprobar su cuenta antes de iniciar sesión.'
      : 'Registro exitoso';
    return success(res, result, msg, 201);
  } catch (e) {
    if (e.status) return error(res, e.message, e.status);
    if (e.code === 'ER_DUP_ENTRY') {
      return error(res, 'El correo o DNI ya está registrado', 409);
    }
    next(e);
  }
};

exports.profile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    if (!user) return error(res, 'Usuario no encontrado', 404);
    return success(res, user);
  } catch (e) { next(e); }
};
