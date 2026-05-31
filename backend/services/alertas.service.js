const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');

const crud = new CrudService(
  'alertas',
  ['registro_id', 'tipo', 'nivel', 'titulo', 'mensaje', 'leida', 'resuelta', 'fecha_alerta', 'fecha_resolucion'],
  'fecha_alerta DESC'
);

const findAllEnriched = async (query) => {
  let sql = `
    SELECT al.*, r.lote_id, l.nombre as lote_nombre
    FROM alertas al
    JOIN registros_agricolas r ON al.registro_id = r.id
    LEFT JOIN lotes l ON r.lote_id = l.id
    WHERE 1=1`;
  const params = [];

  if (query.nivel) { sql += ' AND al.nivel = ?'; params.push(query.nivel); }
  if (query.leida !== undefined) { sql += ' AND al.leida = ?'; params.push(query.leida); }
  if (query.resuelta !== undefined) { sql += ' AND al.resuelta = ?'; params.push(query.resuelta); }
  if (query.search) {
    sql += ' AND (al.titulo LIKE ? OR al.mensaje LIKE ?)';
    const s = `%${query.search}%`;
    params.push(s, s);
  }

  const countSql = sql.replace(/SELECT al\.\*[\s\S]*?FROM alertas al/, 'SELECT COUNT(*) as total FROM alertas al');
  const [[{ total }]] = await pool.query(countSql, params);
  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  sql += ' ORDER BY al.fecha_alerta DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.query(sql, params);
  return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

module.exports = { ...crud, findAll: findAllEnriched };
