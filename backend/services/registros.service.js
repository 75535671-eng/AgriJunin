const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');

const crud = new CrudService(
  'registros_agricolas',
  ['lote_id', 'cultivo_id', 'fecha_registro', 'temperatura', 'humedad_suelo', 'humedad_aire', 'ph_suelo', 'precipitacion_mm', 'produccion_kg', 'observaciones', 'registrado_por'],
  'fecha_registro DESC'
);

const findAllEnriched = async (query) => {
  let sql = `
    SELECT r.*, l.nombre as lote_nombre, c.nombre as cultivo_nombre, u.nombre as registrado_nombre
    FROM registros_agricolas r
    LEFT JOIN lotes l ON r.lote_id = l.id
    LEFT JOIN cultivos c ON r.cultivo_id = c.id
    LEFT JOIN usuarios u ON r.registrado_por = u.id
    WHERE 1=1`;
  const params = [];

  if (query.lote_id) { sql += ' AND r.lote_id = ?'; params.push(query.lote_id); }
  if (query.cultivo_id) { sql += ' AND r.cultivo_id = ?'; params.push(query.cultivo_id); }

  const countSql = sql.replace(/SELECT r\.\*[\s\S]*?FROM registros_agricolas r/, 'SELECT COUNT(*) as total FROM registros_agricolas r');
  const [[{ total }]] = await pool.query(countSql, params);
  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  sql += ' ORDER BY r.fecha_registro DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.query(sql, params);
  return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

module.exports = { ...crud, findAll: findAllEnriched };
