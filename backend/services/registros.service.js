const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');
const { lotesAgricultorClause, canAccessLote } = require('../utils/scope');

const crud = new CrudService(
  'registros_agricolas',
  ['lote_id', 'cultivo_id', 'fecha_registro', 'temperatura', 'humedad_suelo', 'humedad_aire', 'ph_suelo', 'precipitacion_mm', 'produccion_kg', 'observaciones', 'registrado_por'],
  'fecha_registro DESC'
);

const findAllEnriched = async (query) => {
  let sql = `
    SELECT r.*, l.nombre as lote_nombre, l.codigo_lote, l.agricultor_id,
           c.nombre as cultivo_nombre,
           CONCAT(a.nombres, ' ', a.apellidos) as agricultor_nombre,
           u.nombre as registrado_nombre
    FROM registros_agricolas r
    LEFT JOIN lotes l ON r.lote_id = l.id
    LEFT JOIN agricultores a ON l.agricultor_id = a.id
    LEFT JOIN cultivos c ON r.cultivo_id = c.id
    LEFT JOIN usuarios u ON r.registrado_por = u.id
    WHERE 1=1`;
  const params = [];

  if (query.lote_id) { sql += ' AND r.lote_id = ?'; params.push(query.lote_id); }
  if (query.cultivo_id) { sql += ' AND r.cultivo_id = ?'; params.push(query.cultivo_id); }
  if (query.agricultor_id) { sql += ' AND l.agricultor_id = ?'; params.push(query.agricultor_id); }

  const scopeFilter = lotesAgricultorClause(query.scope, 'l');
  sql += scopeFilter.clause;
  params.push(...scopeFilter.params);

  const countSql = sql.replace(/SELECT r\.\*[\s\S]*?FROM registros_agricolas r/, 'SELECT COUNT(*) as total FROM registros_agricolas r');
  const [[{ total }]] = await pool.query(countSql, params);
  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  sql += ' ORDER BY r.fecha_registro DESC LIMIT ? OFFSET ?';
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
    `SELECT r.*, l.nombre as lote_nombre, c.nombre as cultivo_nombre, u.nombre as registrado_nombre
     FROM registros_agricolas r
     LEFT JOIN lotes l ON r.lote_id = l.id
     LEFT JOIN cultivos c ON r.cultivo_id = c.id
     LEFT JOIN usuarios u ON r.registrado_por = u.id
     WHERE r.id = ?`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { ...crud, findAll: findAllEnriched, findById };
