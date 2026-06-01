const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/response');

exports.getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats(req.scope);
    return success(res, stats, 'Estadísticas del dashboard');
  } catch (e) { next(e); }
};
