const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    if (!result) return error(res, 'Credenciales inválidas', 401);
    return success(res, result, 'Inicio de sesión exitoso');
  } catch (e) { next(e); }
};

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return success(res, result, 'Registro exitoso', 201);
  } catch (e) { next(e); }
};

exports.profile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    if (!user) return error(res, 'Usuario no encontrado', 404);
    return success(res, user);
  } catch (e) { next(e); }
};
