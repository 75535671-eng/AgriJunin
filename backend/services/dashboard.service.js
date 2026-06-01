const { pool } = require('../config/database');
const { fetchClimaHuancayo } = require('./weather.service');
const { lotesAgricultorClause } = require('../utils/scope');

const ROLE_META = {
  administrador: {
    titulo: 'Panel administrador',
    descripcion: 'Vista global del sistema: productores, cultivos, lotes, sensores y alertas.',
  },
  tecnico: {
    titulo: 'Panel técnico',
    descripcion: 'Monitoreo de campo: lotes, sensores, registros y alertas de todos los agricultores.',
  },
  agricultor: {
    titulo: 'Mi parcela',
    descripcion: 'Resumen de sus lotes, lecturas de sensores, registros y alertas.',
  },
};

const getStats = async (scope = {}) => {
  const rol = scope.rol || 'administrador';
  const lotFilter = lotesAgricultorClause(scope, 'l');
  const lotParams = lotFilter.params;

  const agricultoresSql =
    rol === 'agricultor'
      ? 'SELECT COUNT(*) as total FROM agricultores WHERE id = ? AND activo = 1'
      : 'SELECT COUNT(*) as total FROM agricultores WHERE activo = 1';
  const agricultoresParams = rol === 'agricultor' ? [scope.agricultorId || 0] : [];

  const [[agricultores]] = await pool.query(agricultoresSql, agricultoresParams);

  const cultivosSql =
    rol === 'agricultor'
      ? `SELECT COUNT(DISTINCT c.id) as total FROM cultivos c
         INNER JOIN lotes l ON l.cultivo_id = c.id AND l.activo = 1
         WHERE c.activo = 1${lotFilter.clause}`
      : 'SELECT COUNT(*) as total FROM cultivos WHERE activo = 1';
  const [[cultivos]] = await pool.query(
    cultivosSql,
    rol === 'agricultor' ? lotParams : []
  );

  const sensoresSql = `
    SELECT COUNT(*) as total FROM sensores s
    INNER JOIN lotes l ON s.lote_id = l.id
    WHERE s.estado = 'activo' AND s.activo = 1${lotFilter.clause}`;
  const [[sensores]] = await pool.query(sensoresSql, lotParams);

  const alertasSql = `
    SELECT COUNT(*) as total FROM alertas al
    LEFT JOIN registros_agricolas r ON al.registro_id = r.id
    LEFT JOIN sensores s ON al.sensor_id = s.id
    LEFT JOIN lotes l ON COALESCE(al.lote_id, r.lote_id, s.lote_id) = l.id
    WHERE al.nivel = 'critica' AND al.resuelta = 0
      AND (l.id IS NOT NULL OR al.tipo = 'sistema')${lotFilter.clause}`;
  const [[alertas]] = await pool.query(alertasSql, lotParams);

  const lotesSql = `SELECT COUNT(*) as total FROM lotes l WHERE l.activo = 1${lotFilter.clause}`;
  const [[lotes]] = await pool.query(lotesSql, lotParams);

  const registrosSql = `
    SELECT COUNT(*) as total FROM registros_agricolas r
    JOIN lotes l ON r.lote_id = l.id
    WHERE 1=1${lotFilter.clause}`;
  const [[registros]] = await pool.query(registrosSql, lotParams);

  const [produccionSemanal] = await pool.query(
    `
    SELECT DATE(r.fecha_registro) as fecha,
           COALESCE(SUM(r.produccion_kg), 0) as produccion
    FROM registros_agricolas r
    JOIN lotes l ON r.lote_id = l.id
    WHERE r.fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)${lotFilter.clause}
    GROUP BY DATE(r.fecha_registro)
    ORDER BY fecha ASC
  `,
    lotParams
  );

  const [alertasPorNivel] = await pool.query(
    `
    SELECT al.nivel, COUNT(*) as cantidad
    FROM alertas al
    LEFT JOIN registros_agricolas r ON al.registro_id = r.id
    LEFT JOIN sensores s ON al.sensor_id = s.id
    LEFT JOIN lotes l ON COALESCE(al.lote_id, r.lote_id, s.lote_id) = l.id
    WHERE al.resuelta = 0 AND (l.id IS NOT NULL OR al.tipo = 'sistema')${lotFilter.clause}
    GROUP BY al.nivel
  `,
    lotParams
  );

  const cultivosPorTipoSql =
    rol === 'agricultor'
      ? `
    SELECT c.tipo, COUNT(DISTINCT c.id) as cantidad
    FROM cultivos c
    INNER JOIN lotes l ON l.cultivo_id = c.id AND l.activo = 1
    WHERE c.activo = 1${lotFilter.clause}
    GROUP BY c.tipo`
      : `SELECT tipo, COUNT(*) as cantidad FROM cultivos WHERE activo = 1 GROUP BY tipo`;
  const [cultivosPorTipo] = await pool.query(
    cultivosPorTipoSql,
    rol === 'agricultor' ? lotParams : []
  );

  const [sensoresPorEstado] = await pool.query(
    `
    SELECT s.estado, COUNT(*) as cantidad FROM sensores s
    INNER JOIN lotes l ON s.lote_id = l.id
    WHERE 1=1${lotFilter.clause}
    GROUP BY s.estado
  `,
    lotParams
  );

  const [ultimasAlertas] = await pool.query(
    `
    SELECT al.*,
           COALESCE(al.lote_id, r.lote_id, s.lote_id) AS lote_id,
           l.nombre AS lote_nombre,
           s.codigo_sensor,
           s.nombre AS sensor_nombre
    FROM alertas al
    LEFT JOIN registros_agricolas r ON al.registro_id = r.id
    LEFT JOIN sensores s ON al.sensor_id = s.id
    LEFT JOIN lotes l ON COALESCE(al.lote_id, r.lote_id, s.lote_id) = l.id
    WHERE (l.id IS NOT NULL OR al.tipo = 'sistema')${lotFilter.clause}
    ORDER BY al.fecha_alerta DESC LIMIT 5
  `,
    lotParams
  );

  const [[produccionTotal]] = await pool.query(
    `
    SELECT COALESCE(SUM(r.produccion_kg), 0) as total
    FROM registros_agricolas r
    JOIN lotes l ON r.lote_id = l.id
    WHERE r.fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)${lotFilter.clause}
  `,
    lotParams
  );

  let climaHuancayo = null;
  try {
    climaHuancayo = await fetchClimaHuancayo();
  } catch {
    climaHuancayo = null;
  }

  const meta = ROLE_META[rol] || ROLE_META.administrador;

  return {
    climaHuancayo,
    contexto: {
      rol,
      titulo: meta.titulo,
      descripcion: meta.descripcion,
      agricultorVinculado: rol !== 'agricultor' || !!scope.agricultorId,
      flujo: [
        { paso: 1, modulo: 'Agricultores', descripcion: 'Productores registrados en el sistema' },
        { paso: 2, modulo: 'Cultivos', descripcion: 'Catálogo de especies (papa, maíz, etc.)' },
        { paso: 3, modulo: 'Lotes', descripcion: 'Parcelas asignadas a cada agricultor' },
        { paso: 4, modulo: 'Sensores', descripcion: 'Dispositivos instalados en cada lote' },
        { paso: 5, modulo: 'Registros', descripcion: 'Mediciones y producción por lote' },
        { paso: 6, modulo: 'Alertas', descripcion: 'Avisos automáticos según umbrales' },
      ],
    },
    kpis: {
      totalAgricultores: agricultores.total,
      totalCultivos: cultivos.total,
      sensoresActivos: sensores.total,
      alertasCriticas: alertas.total,
      totalLotes: lotes.total,
      totalRegistros: registros.total,
      produccionSemanalKg: produccionTotal.total,
    },
    produccionSemanal,
    alertasPorNivel,
    cultivosPorTipo,
    sensoresPorEstado,
    ultimasAlertas,
  };
};

module.exports = { getStats };
