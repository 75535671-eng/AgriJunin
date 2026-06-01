const { pool } = require('../config/database');

const getAgricultorIdByUserId = async (userId) => {
  const [[row]] = await pool.query(
    'SELECT id FROM agricultores WHERE usuario_id = ? AND activo = 1 LIMIT 1',
    [userId]
  );
  return row?.id ?? null;
};

/** Filtro SQL para agricultor: solo sus lotes (alias de tabla lotes: l). */
const lotesAgricultorClause = (scope, alias = 'l') => {
  if (!scope || scope.rol !== 'agricultor') return { clause: '', params: [] };
  if (!scope.agricultorId) return { clause: ' AND 1=0', params: [] };
  return { clause: ` AND ${alias}.agricultor_id = ?`, params: [scope.agricultorId] };
};

const canAccessLote = (lote, scope) => {
  if (!scope || scope.rol !== 'agricultor') return true;
  if (!scope.agricultorId) return false;
  return Number(lote.agricultor_id) === Number(scope.agricultorId);
};

module.exports = {
  getAgricultorIdByUserId,
  lotesAgricultorClause,
  canAccessLote,
};
