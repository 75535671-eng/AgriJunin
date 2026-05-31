const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');

const crud = new CrudService(
  'lotes',
  ['agricultor_id', 'cultivo_id', 'codigo_lote', 'nombre', 'ubicacion', 'latitud', 'longitud', 'area_hectareas', 'tipo_suelo', 'estado', 'fecha_siembra', 'fecha_cosecha_est', 'activo'],
  'created_at DESC'
);

const findAllEnriched = async (query) => {
  let sql = `
    SELECT l.*, a.nombres as agricultor_nombres, a.apellidos as agricultor_apellidos,
           c.nombre as cultivo_nombre
    FROM lotes l
    LEFT JOIN agricultores a ON l.agricultor_id = a.id
    LEFT JOIN cultivos c ON l.cultivo_id = c.id
    WHERE 1=1`;
  const params = [];

  if (query.search) {
    sql += ` AND (l.nombre LIKE ? OR l.codigo_lote LIKE ? OR l.ubicacion LIKE ?)`;
    const s = `%${query.search}%`;
    params.push(s, s, s);
  }
  if (query.estado) { sql += ' AND l.estado = ?'; params.push(query.estado); }
  if (query.agricultor_id) { sql += ' AND l.agricultor_id = ?'; params.push(query.agricultor_id); }

  const countSql = sql.replace(/SELECT l\.\*[\s\S]*?FROM lotes l/, 'SELECT COUNT(*) as total FROM lotes l');
  const [[{ total }]] = await pool.query(countSql, params);
  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  sql += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.query(sql, params);
  return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

module.exports = { ...crud, findAll: findAllEnriched };
