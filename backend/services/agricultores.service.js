const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');

const crud = new CrudService(
  'agricultores',
  ['usuario_id', 'dni', 'nombres', 'apellidos', 'telefono', 'email_contacto', 'direccion', 'distrito', 'provincia', 'departamento', 'hectareas_totales', 'fecha_registro', 'activo', 'notas'],
  'created_at DESC'
);

const findAllEnriched = async (query) => {
  let sql = `
    SELECT a.*, u.email as usuario_email, u.nombre as usuario_nombre
    FROM agricultores a
    LEFT JOIN usuarios u ON a.usuario_id = u.id
    WHERE 1=1`;
  const params = [];

  if (query.search) {
    sql += ` AND (a.nombres LIKE ? OR a.apellidos LIKE ? OR a.dni LIKE ? OR a.distrito LIKE ?)`;
    const s = `%${query.search}%`;
    params.push(s, s, s, s);
  }
  if (query.activo !== undefined) {
    sql += ' AND a.activo = ?';
    params.push(query.activo);
  }
  if (query.distrito) {
    sql += ' AND a.distrito = ?';
    params.push(query.distrito);
  }

  const countSql = sql.replace(
    /SELECT a\.\*[\s\S]*?FROM agricultores a/,
    'SELECT COUNT(*) as total FROM agricultores a'
  );
  const [[{ total }]] = await pool.query(countSql, params);
  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  const offset = (page - 1) * limit;

  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

module.exports = { ...crud, findAll: findAllEnriched };
