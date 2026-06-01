const { pool } = require('../config/database');
const { CrudService } = require('./crud.service');
const { lotesAgricultorClause, canAccessLote } = require('../utils/scope');

const ALLOWED = [
  'lote_id',
  'registro_id',
  'sensor_id',
  'tipo',
  'nivel',
  'titulo',
  'mensaje',
  'leida',
  'resuelta',
  'fecha_alerta',
  'fecha_resolucion',
];

const ALERTA_JOINS = `
  LEFT JOIN registros_agricolas r ON al.registro_id = r.id
  LEFT JOIN sensores s ON al.sensor_id = s.id
  LEFT JOIN lotes l ON COALESCE(al.lote_id, r.lote_id, s.lote_id) = l.id
  LEFT JOIN agricultores a ON l.agricultor_id = a.id
  LEFT JOIN cultivos c ON COALESCE(r.cultivo_id, l.cultivo_id) = c.id`;

const SELECT_ENRICHED = `
  SELECT al.*,
         COALESCE(al.lote_id, r.lote_id, s.lote_id) AS lote_id_resuelto,
         l.nombre AS lote_nombre,
         l.codigo_lote,
         s.codigo_sensor,
         s.nombre AS sensor_nombre,
         CONCAT(a.nombres, ' ', a.apellidos) AS agricultor_nombre,
         c.nombre AS cultivo_nombre
  FROM alertas al
  ${ALERTA_JOINS}`;

const crud = new CrudService('alertas', ALLOWED, 'fecha_alerta DESC');

async function resolveLoteId(data) {
  if (data.lote_id) return data.lote_id;
  if (data.registro_id) {
    const [rows] = await pool.query('SELECT lote_id FROM registros_agricolas WHERE id = ?', [
      data.registro_id,
    ]);
    return rows[0]?.lote_id ?? null;
  }
  if (data.sensor_id) {
    const [rows] = await pool.query('SELECT lote_id FROM sensores WHERE id = ?', [data.sensor_id]);
    return rows[0]?.lote_id ?? null;
  }
  return null;
}

function assertOrigen(data) {
  const { registro_id, sensor_id, lote_id, tipo } = data;
  if (tipo === 'sistema') return;
  if (registro_id || sensor_id || lote_id) return;
  const err = new Error('Indique registro agrícola, sensor o lote (o use tipo sistema).');
  err.status = 400;
  throw err;
}

async function normalizePayload(data) {
  const payload = { ...data };
  assertOrigen(payload);
  const loteId = await resolveLoteId(payload);
  if (loteId && !payload.lote_id) payload.lote_id = loteId;
  if (payload.tipo === 'sensor' && payload.sensor_id && payload.registro_id) {
    payload.registro_id = null;
  }
  return payload;
}

async function getLoteForAlerta(item) {
  if (item.lote_id) {
    const [rows] = await pool.query('SELECT * FROM lotes WHERE id = ?', [item.lote_id]);
    return rows[0];
  }
  if (item.registro_id) {
    const [regs] = await pool.query('SELECT lote_id FROM registros_agricolas WHERE id = ?', [
      item.registro_id,
    ]);
    if (regs[0]?.lote_id) {
      const [rows] = await pool.query('SELECT * FROM lotes WHERE id = ?', [regs[0].lote_id]);
      return rows[0];
    }
  }
  if (item.sensor_id) {
    const [sens] = await pool.query('SELECT lote_id FROM sensores WHERE id = ?', [item.sensor_id]);
    if (sens[0]?.lote_id) {
      const [rows] = await pool.query('SELECT * FROM lotes WHERE id = ?', [sens[0].lote_id]);
      return rows[0];
    }
  }
  return null;
}

const findAllEnriched = async (query) => {
  let sql = `${SELECT_ENRICHED} WHERE 1=1`;
  const params = [];

  if (query.nivel) {
    sql += ' AND al.nivel = ?';
    params.push(query.nivel);
  }
  if (query.leida !== undefined) {
    sql += ' AND al.leida = ?';
    params.push(query.leida);
  }
  if (query.resuelta !== undefined) {
    sql += ' AND al.resuelta = ?';
    params.push(query.resuelta);
  }
  if (query.search) {
    sql += ' AND (al.titulo LIKE ? OR al.mensaje LIKE ?)';
    const s = `%${query.search}%`;
    params.push(s, s);
  }

  const scopeFilter = lotesAgricultorClause(query.scope, 'l');
  sql += ` AND (l.id IS NOT NULL OR al.tipo = 'sistema')${scopeFilter.clause}`;
  params.push(...scopeFilter.params);

  const countSql = sql.replace(
    /SELECT al\.\*[\s\S]*?FROM alertas al/,
    'SELECT COUNT(*) as total FROM alertas al'
  );
  const [[{ total }]] = await pool.query(countSql, params);
  const page = parseInt(query.page || 1, 10);
  const limit = parseInt(query.limit || 10, 10);
  sql += ' ORDER BY al.fecha_alerta DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.query(sql, params);
  return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const findById = async (id, scope) => {
  const item = await crud.findById(id);
  if (!item) return null;

  const lote = await getLoteForAlerta(item);
  if (lote && !canAccessLote(lote, scope)) return null;
  if (!lote && item.tipo !== 'sistema' && scope?.rol === 'agricultor') return null;

  const [rows] = await pool.query(`${SELECT_ENRICHED} WHERE al.id = ?`, [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const payload = await normalizePayload(data);
  return crud.create(payload);
};

const update = async (id, data) => {
  const existing = await crud.findById(id);
  if (!existing) return null;
  const merged = { ...existing, ...data };
  const payload = await normalizePayload(merged);
  return crud.update(id, payload);
};

module.exports = { ...crud, findAll: findAllEnriched, findById, create, update };
