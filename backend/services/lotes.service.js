const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');
const { lotesAgricultorClause, canAccessLote } = require('../utils/scope');

const crud = new CrudService(
  'lotes',
  [
    'agricultor_id', 'cultivo_id', 'codigo_lote', 'nombre', 'ubicacion', 'latitud', 'longitud',
    'area_hectareas', 'tipo_suelo', 'estado', 'fecha_siembra', 'fecha_cosecha_est', 'activo',
    'estado_aprobacion', 'solicitado_por', 'revisado_por', 'fecha_revision', 'motivo_rechazo',
  ],
  'created_at DESC'
);

const enrichSelect = `
  SELECT l.*, a.nombres AS agricultor_nombres, a.apellidos AS agricultor_apellidos,
         c.nombre AS cultivo_nombre, us.nombre AS solicitante_nombre, ur.nombre AS revisor_nombre
  FROM lotes l
  LEFT JOIN agricultores a ON l.agricultor_id = a.id
  LEFT JOIN cultivos c ON l.cultivo_id = c.id
  LEFT JOIN usuarios us ON l.solicitado_por = us.id
  LEFT JOIN usuarios ur ON l.revisado_por = ur.id
`;

const applyVisibilityFilters = (sql, params, query, user) => {
  if (query.solo_aprobados === '1' || query.solo_aprobados === 'true') {
    sql += ` AND l.estado_aprobacion = 'aprobado' AND l.activo = 1`;
  } else if (query.pendientes === '1' || query.pendientes === 'true') {
    sql += ` AND l.estado_aprobacion = 'pendiente'`;
  } else if (user?.rol === 'agricultor') {
    sql += ` AND (l.estado_aprobacion = 'aprobado' OR (l.estado_aprobacion IN ('pendiente','rechazado') AND l.solicitado_por = ?))`;
    params.push(user.id);
  }
  return sql;
};

const findAllEnriched = async (query) => {
  let sql = `${enrichSelect} WHERE 1=1`;
  const params = [];

  if (query.search) {
    sql += ` AND (l.nombre LIKE ? OR l.codigo_lote LIKE ? OR l.ubicacion LIKE ?)`;
    const s = `%${query.search}%`;
    params.push(s, s, s);
  }
  if (query.estado) {
    sql += ' AND l.estado = ?';
    params.push(query.estado);
  }
  if (query.agricultor_id) {
    sql += ' AND l.agricultor_id = ?';
    params.push(query.agricultor_id);
  }
  if (query.cultivo_id) {
    sql += ' AND l.cultivo_id = ?';
    params.push(query.cultivo_id);
  }

  sql = applyVisibilityFilters(sql, params, query, query.user);

  const scopeFilter = lotesAgricultorClause(query.scope, 'l');
  sql += scopeFilter.clause;
  params.push(...scopeFilter.params);

  let countSql = `
    SELECT COUNT(*) AS total FROM lotes l
    LEFT JOIN agricultores a ON l.agricultor_id = a.id
    WHERE 1=1`;
  const countParams = [];
  if (query.search) {
    countSql += ` AND (l.nombre LIKE ? OR l.codigo_lote LIKE ? OR l.ubicacion LIKE ?)`;
    const s = `%${query.search}%`;
    countParams.push(s, s, s);
  }
  if (query.estado) {
    countSql += ' AND l.estado = ?';
    countParams.push(query.estado);
  }
  if (query.agricultor_id) {
    countSql += ' AND l.agricultor_id = ?';
    countParams.push(query.agricultor_id);
  }
  countSql = applyVisibilityFilters(countSql, countParams, query, query.user);
  countSql += scopeFilter.clause;
  countParams.push(...scopeFilter.params);
  const [[{ total }]] = await pool.query(countSql, countParams);

  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  sql += ` ORDER BY FIELD(l.estado_aprobacion, 'pendiente', 'aprobado', 'rechazado'), l.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.query(sql, params);
  return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const findById = async (id, scope, user) => {
  const [rows] = await pool.query(`${enrichSelect} WHERE l.id = ?`, [id]);
  const item = rows[0];
  if (!item || !canAccessLote(item, scope)) return null;
  if (
    user?.rol === 'agricultor' &&
    item.estado_aprobacion !== 'aprobado' &&
    item.solicitado_por !== user.id
  ) {
    return null;
  }
  return item;
};

const create = async (data, user) => {
  const payload = { ...data };
  if (user.rol === 'agricultor') {
    payload.estado_aprobacion = 'pendiente';
    payload.solicitado_por = user.id;
    payload.activo = 0;
  } else {
    payload.estado_aprobacion = 'aprobado';
    payload.activo = payload.activo !== undefined ? payload.activo : 1;
  }
  return crud.create(payload);
};

const update = async (id, data, user, scope) => {
  const existing = await findById(id, scope, user);
  if (!existing) return null;
  if (user.rol === 'agricultor') {
    if (existing.solicitado_por !== user.id || existing.estado_aprobacion !== 'pendiente') {
      return null;
    }
    const { estado_aprobacion, solicitado_por, revisado_por, activo, ...safe } = data;
    return crud.update(id, safe);
  }
  return crud.update(id, data);
};

const aprobar = async (id, revisorId) => {
  const [result] = await pool.query(
    `UPDATE lotes SET estado_aprobacion = 'aprobado', activo = 1,
     revisado_por = ?, fecha_revision = NOW(), motivo_rechazo = NULL
     WHERE id = ? AND estado_aprobacion = 'pendiente'`,
    [revisorId, id]
  );
  if (!result.affectedRows) return null;
  return findById(id, null, { rol: 'administrador', id: revisorId });
};

const rechazar = async (id, revisorId, motivo) => {
  const [result] = await pool.query(
    `UPDATE lotes SET estado_aprobacion = 'rechazado', activo = 0,
     revisado_por = ?, fecha_revision = NOW(), motivo_rechazo = ?
     WHERE id = ? AND estado_aprobacion = 'pendiente'`,
    [revisorId, motivo || 'Solicitud de lote no aprobada', id]
  );
  if (!result.affectedRows) return null;
  return findById(id, null, { rol: 'administrador', id: revisorId });
};

module.exports = {
  ...crud,
  findAll: findAllEnriched,
  findById,
  create,
  update,
  aprobar,
  rechazar,
};
