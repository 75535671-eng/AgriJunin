const { pool } = require('../config/database');
const { fetchClimaHuancayo } = require('./weather.service');

const getStats = async () => {
  const [[agricultores]] = await pool.query(
    'SELECT COUNT(*) as total FROM agricultores WHERE activo = 1'
  );
  const [[cultivos]] = await pool.query(
    'SELECT COUNT(*) as total FROM cultivos WHERE activo = 1'
  );
  const [[sensores]] = await pool.query(
    "SELECT COUNT(*) as total FROM sensores WHERE estado = 'activo' AND activo = 1"
  );
  const [[alertas]] = await pool.query(
    "SELECT COUNT(*) as total FROM alertas WHERE nivel = 'critica' AND resuelta = 0"
  );
  const [[lotes]] = await pool.query('SELECT COUNT(*) as total FROM lotes WHERE activo = 1');
  const [[registros]] = await pool.query('SELECT COUNT(*) as total FROM registros_agricolas');

  const [produccionSemanal] = await pool.query(`
    SELECT DATE(fecha_registro) as fecha,
           COALESCE(SUM(produccion_kg), 0) as produccion
    FROM registros_agricolas
    WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(fecha_registro)
    ORDER BY fecha ASC
  `);

  const [alertasPorNivel] = await pool.query(`
    SELECT nivel, COUNT(*) as cantidad
    FROM alertas WHERE resuelta = 0
    GROUP BY nivel
  `);

  const [cultivosPorTipo] = await pool.query(`
    SELECT tipo, COUNT(*) as cantidad FROM cultivos WHERE activo = 1 GROUP BY tipo
  `);

  const [sensoresPorEstado] = await pool.query(`
    SELECT estado, COUNT(*) as cantidad FROM sensores GROUP BY estado
  `);

  const [ultimasAlertas] = await pool.query(`
    SELECT al.*, r.lote_id, l.nombre as lote_nombre
    FROM alertas al
    JOIN registros_agricolas r ON al.registro_id = r.id
    JOIN lotes l ON r.lote_id = l.id
    ORDER BY al.fecha_alerta DESC LIMIT 5
  `);

  const [[produccionTotal]] = await pool.query(`
    SELECT COALESCE(SUM(produccion_kg), 0) as total
    FROM registros_agricolas
    WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `);

  let climaHuancayo = null;
  try {
    climaHuancayo = await fetchClimaHuancayo();
  } catch {
    climaHuancayo = null;
  }

  return {
    climaHuancayo,
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
