const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');
const { lotesAgricultorClause, canAccessLote } = require('../utils/scope');

const crud = new CrudService(
  'sensores',
  ['lote_id', 'codigo_sensor', 'nombre', 'tipo', 'unidad_medida', 'valor_min', 'valor_max', 'ultima_lectura', 'ultima_fecha', 'estado', 'bateria_pct', 'activo'],
  'created_at DESC'
);

const findAllEnriched = async (query) => {
  let sql = `
    SELECT s.*, l.nombre as lote_nombre, l.codigo_lote, l.agricultor_id, l.cultivo_id,
           c.nombre as cultivo_nombre,
           CONCAT(a.nombres, ' ', a.apellidos) as agricultor_nombre
    FROM sensores s
    LEFT JOIN lotes l ON s.lote_id = l.id
    LEFT JOIN agricultores a ON l.agricultor_id = a.id
    LEFT JOIN cultivos c ON l.cultivo_id = c.id
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
  if (query.cultivo_id) { sql += ' AND l.cultivo_id = ?'; params.push(query.cultivo_id); }
  if (query.agricultor_id) { sql += ' AND l.agricultor_id = ?'; params.push(query.agricultor_id); }

  const scopeFilter = lotesAgricultorClause(query.scope, 'l');
  sql += scopeFilter.clause;
  params.push(...scopeFilter.params);

  const countSql = sql.replace(/SELECT s\.\*[\s\S]*?FROM sensores s/, 'SELECT COUNT(*) as total FROM sensores s');
  const [[{ total }]] = await pool.query(countSql, params);
  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.query(sql, params);
  return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const findById = async (id, scope) => {
  const item = await crud.findById(id);
  if (!item) return null;
  const [lotes] = await pool.query('SELECT * FROM lotes WHERE id = ?', [item.lote_id]);
  if (!canAccessLote(lotes[0] || {}, scope)) return null;
  const [rows] = await pool.query(
    `SELECT s.*, l.nombre as lote_nombre, l.codigo_lote FROM sensores s
     LEFT JOIN lotes l ON s.lote_id = l.id WHERE s.id = ?`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { ...crud, findAll: findAllEnriched, findById };
