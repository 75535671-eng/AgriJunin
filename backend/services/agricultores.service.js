const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');

const crud = new CrudService(
  'agricultores',
  ['usuario_id', 'dni', 'nombres', 'apellidos', 'telefono', 'email_contacto', 'direccion', 'distrito', 'provincia', 'departamento', 'hectareas_totales', 'fecha_registro', 'activo', 'notas'],
  'created_at DESC'
);

const attachLotesCultivos = async (agricultores) => {
  if (!agricultores.length) return agricultores;

  const ids = agricultores.map((a) => a.id);
  const [lotes] = await pool.query(
    `SELECT l.agricultor_id, l.id AS lote_id, l.codigo_lote, l.nombre AS lote_nombre,
            l.estado, l.area_hectareas, l.fecha_siembra,
            c.id AS cultivo_id, c.nombre AS cultivo_nombre, c.tipo AS cultivo_tipo
     FROM lotes l
     LEFT JOIN cultivos c ON c.id = l.cultivo_id
     WHERE l.agricultor_id IN (?) AND l.activo = 1
     ORDER BY c.nombre ASC, l.nombre ASC`,
    [ids]
  );

  const byAgricultor = {};
  for (const row of lotes) {
    if (!byAgricultor[row.agricultor_id]) byAgricultor[row.agricultor_id] = [];
    byAgricultor[row.agricultor_id].push({
      lote_id: row.lote_id,
      codigo_lote: row.codigo_lote,
      lote_nombre: row.lote_nombre,
      cultivo_id: row.cultivo_id,
      cultivo_nombre: row.cultivo_nombre || 'Sin cultivo',
      cultivo_tipo: row.cultivo_tipo,
      estado: row.estado,
      area_hectareas: row.area_hectareas,
      fecha_siembra: row.fecha_siembra,
    });
  }

  return agricultores.map((a) => {
    const lotes_cultivos = byAgricultor[a.id] || [];
    const nombres = [...new Set(lotes_cultivos.map((x) => x.cultivo_nombre).filter((n) => n !== 'Sin cultivo'))];
    return {
      ...a,
      lotes_cultivos,
      total_lotes: lotes_cultivos.length,
      total_cultivos_distintos: nombres.length,
      cultivos_en_lotes: nombres.join(', ') || null,
    };
  });
};

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

  const countSql = `
    SELECT COUNT(*) as total FROM (
      SELECT a.id FROM agricultores a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      WHERE 1=1`;
  let countSqlEnd = '';
  const countParams = [];
  if (query.search) {
    countSqlEnd += ` AND (a.nombres LIKE ? OR a.apellidos LIKE ? OR a.dni LIKE ? OR a.distrito LIKE ?)`;
    const s = `%${query.search}%`;
    countParams.push(s, s, s, s);
  }
  if (query.activo !== undefined) {
    countSqlEnd += ' AND a.activo = ?';
    countParams.push(query.activo);
  }
  if (query.distrito) {
    countSqlEnd += ' AND a.distrito = ?';
    countParams.push(query.distrito);
  }
  const fullCountSql = `${countSql}${countSqlEnd} GROUP BY a.id) AS sub`;
  const [[{ total }]] = await pool.query(fullCountSql, countParams);
  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  const offset = (page - 1) * limit;

  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  const data = await attachLotesCultivos(rows);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const findById = async (id, scope) => {
  const item = await crud.findById(id);
  if (!item) return null;
  if (scope?.rol === 'agricultor' && scope.agricultorId && Number(id) !== Number(scope.agricultorId)) {
    return null;
  }
  const [enriched] = await attachLotesCultivos([item]);
  const [[usuario]] = await pool.query(
    'SELECT email, nombre FROM usuarios WHERE id = ?',
    [item.usuario_id]
  );
  return {
    ...enriched,
    usuario_email: usuario?.email,
    usuario_nombre: usuario?.nombre,
  };
};

module.exports = { ...crud, findAll: findAllEnriched, findById };
