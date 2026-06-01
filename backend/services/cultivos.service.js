const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');
const { lotesAgricultorClause } = require('../utils/scope');

const crud = new CrudService(
  'cultivos',
  [
    'nombre', 'nombre_cientifico', 'tipo', 'temporada', 'dias_crecimiento',
    'rendimiento_promedio', 'humedad_optima_min', 'humedad_optima_max',
    'temp_optima_min', 'temp_optima_max', 'descripcion', 'activo',
    'estado_aprobacion', 'solicitado_por', 'revisado_por', 'fecha_revision', 'motivo_rechazo',
    'lote_solicitud_id',
  ],
  'nombre ASC'
);

const enrichSelect = `
  SELECT c.*,
         us.nombre AS solicitante_nombre,
         ur.nombre AS revisor_nombre,
         ls.codigo_lote AS lote_solicitud_codigo,
         ls.nombre AS lote_solicitud_nombre,
         COUNT(DISTINCT l.id) AS total_lotes,
         COUNT(DISTINCT l.agricultor_id) AS total_agricultores,
         GROUP_CONCAT(
           DISTINCT CONCAT(a.nombres, ' ', a.apellidos)
           ORDER BY a.apellidos SEPARATOR ', '
         ) AS agricultores_en_lotes
  FROM cultivos c
  LEFT JOIN usuarios us ON c.solicitado_por = us.id
  LEFT JOIN usuarios ur ON c.revisado_por = ur.id
  LEFT JOIN lotes ls ON c.lote_solicitud_id = ls.id
  LEFT JOIN lotes l ON l.cultivo_id = c.id AND l.activo = 1
  LEFT JOIN agricultores a ON a.id = l.agricultor_id
`;

const applyVisibilityFilters = (sql, params, query, user) => {
  if (query.solo_aprobados === '1' || query.solo_aprobados === 'true') {
    sql += ` AND c.estado_aprobacion = 'aprobado'`;
  } else if (query.pendientes === '1' || query.pendientes === 'true') {
    sql += ` AND c.estado_aprobacion = 'pendiente'`;
  } else if (user?.rol === 'agricultor') {
    sql += ` AND (c.estado_aprobacion = 'aprobado' OR (c.estado_aprobacion IN ('pendiente','rechazado') AND c.solicitado_por = ?))`;
    params.push(user.id);
  }
  return sql;
};

const findAllEnriched = async (query) => {
  let sql = `${enrichSelect} WHERE 1=1`;
  const params = [];

  if (query.search) {
    sql += ' AND (c.nombre LIKE ? OR c.nombre_cientifico LIKE ? OR c.tipo LIKE ?)';
    const s = `%${query.search}%`;
    params.push(s, s, s);
  }
  if (query.activo !== undefined) {
    sql += ' AND c.activo = ?';
    params.push(query.activo);
  }

  sql = applyVisibilityFilters(sql, params, query, query.user);

  const scopeFilter = lotesAgricultorClause(query.scope, 'l');
  if (scopeFilter.clause) {
    sql += scopeFilter.clause;
    params.push(...scopeFilter.params);
  }

  sql += ' GROUP BY c.id';

  let countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT c.id FROM cultivos c
      LEFT JOIN lotes l ON l.cultivo_id = c.id AND l.activo = 1
      WHERE 1=1`;
  const countParams = [];
  if (query.search) {
    countSql += ' AND (c.nombre LIKE ? OR c.nombre_cientifico LIKE ? OR c.tipo LIKE ?)';
    const s = `%${query.search}%`;
    countParams.push(s, s, s);
  }
  countSql = applyVisibilityFilters(countSql, countParams, query, query.user);
  if (scopeFilter.clause) {
    countSql += scopeFilter.clause;
    countParams.push(...scopeFilter.params);
  }
  countSql += ' GROUP BY c.id) AS sub';

  const [[{ total }]] = await pool.query(countSql, countParams);
  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  sql += ' ORDER BY FIELD(c.estado_aprobacion, \'pendiente\', \'aprobado\', \'rechazado\'), c.nombre ASC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.query(sql, params);
  return {
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const findById = async (id, scope, user) => {
  const [rows] = await pool.query(`${enrichSelect} WHERE c.id = ? GROUP BY c.id`, [id]);
  const item = rows[0];
  if (!item) return null;
  if (user?.rol === 'agricultor' && item.estado_aprobacion !== 'aprobado' && item.solicitado_por !== user.id) {
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
    if (payload.lote_solicitud_id) {
      const [[lote]] = await pool.query(
        `SELECT l.id FROM lotes l
         INNER JOIN agricultores ag ON ag.id = l.agricultor_id
         WHERE l.id = ? AND ag.usuario_id = ?`,
        [payload.lote_solicitud_id, user.id]
      );
      if (!lote) {
        const err = new Error('El lote seleccionado no pertenece a su cuenta');
        err.status = 400;
        throw err;
      }
    }
  } else {
    payload.estado_aprobacion = 'aprobado';
    payload.activo = payload.activo !== undefined ? payload.activo : 1;
  }
  return crud.create(payload);
};

const update = async (id, data, user) => {
  const existing = await crud.findById(id);
  if (!existing) return null;
  if (user.rol === 'agricultor') {
    if (existing.solicitado_por !== user.id || existing.estado_aprobacion !== 'pendiente') {
      return null;
    }
    const { estado_aprobacion, solicitado_por, revisado_por, ...safe } = data;
    return crud.update(id, safe);
  }
  return crud.update(id, data);
};

const aprobar = async (id, revisorId) => {
  const [[cultivo]] = await pool.query(
    'SELECT lote_solicitud_id FROM cultivos WHERE id = ? AND estado_aprobacion = ?',
    [id, 'pendiente']
  );
  if (!cultivo) return null;

  const [result] = await pool.query(
    `UPDATE cultivos SET estado_aprobacion = 'aprobado', activo = 1,
     revisado_por = ?, fecha_revision = NOW(), motivo_rechazo = NULL
     WHERE id = ? AND estado_aprobacion = 'pendiente'`,
    [revisorId, id]
  );
  if (!result.affectedRows) return null;

  if (cultivo.lote_solicitud_id) {
    await pool.query(
      `UPDATE lotes SET cultivo_id = ? WHERE id = ? AND estado_aprobacion = 'aprobado'`,
      [id, cultivo.lote_solicitud_id]
    );
  }

  return findById(id, null, { rol: 'administrador', id: revisorId });
};

const rechazar = async (id, revisorId, motivo) => {
  const [result] = await pool.query(
    `UPDATE cultivos SET estado_aprobacion = 'rechazado', activo = 0,
     revisado_por = ?, fecha_revision = NOW(), motivo_rechazo = ?
     WHERE id = ? AND estado_aprobacion = 'pendiente'`,
    [revisorId, motivo || 'No cumple criterios del catálogo', id]
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
