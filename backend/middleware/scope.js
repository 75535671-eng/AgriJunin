const { getAgricultorIdByUserId } = require('../utils/scope');

/** Adjunta alcance por rol (agricultor → id de ficha en tabla agricultores). */
const attachScope = async (req, res, next) => {
  try {
    const scope = {
      rol: req.user.rol,
      userId: req.user.id,
      agricultorId: null,
    };
    if (req.user.rol === 'agricultor') {
      scope.agricultorId = await getAgricultorIdByUserId(req.user.id);
    }
    req.scope = scope;
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = { attachScope };
