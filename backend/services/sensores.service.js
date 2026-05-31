const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');

const crud = new CrudService(
  'sensores',
  ['lote_id', 'codigo_sensor', 'nombre', 'tipo', 'unidad_medida', 'valor_min', 'valor_max', 'ultima_lectura', 'ultima_fecha', 'estado', 'bateria_pct', 'activo'],
  'created_at DESC'
);

const findAllEnriched = async (query) => {
  let sql = `
    SELECT s.*, l.nombre as lote_nombre, l.codigo_lote
    FROM sensores s
    LEFT JOIN lotes l ON s.lote_id = l.id
    WHERE 1=1`;
  const params = [];

  if (query.search) {
    sql += ` AND (s.nombre LIKE ? OR s.codigo_sensor LIKE ?)`;
    const t = `%${query.search}%`;
    params.push(t, t);
  }
  if (query.estado) { sql += ' AND s.estado = ?'; params.push(query.estado); }
  if (query.tipo) { sql += ' AND s.tipo = ?'; params.push(query.tipo); }
  if (query.lote_id) { sql += ' AND s.lote_id = ?'; params.push(query.lote_id); }

  const countSql = sql.replace(/SELECT s\.\*[\s\S]*?FROM sensores s/, 'SELECT COUNT(*) as total FROM sensores s');
  const [[{ total }]] = await pool.query(countSql, params);
  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.query(sql, params);
  return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

module.exports = { ...crud, findAll: findAllEnriched };
