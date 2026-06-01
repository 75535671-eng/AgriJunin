/**
 * Alertas: registro_id opcional + lote_id y sensor_id
 * node database/migrate-alertas-origen.js
 */
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function dropFk(conn, table, name) {
  try {
    await conn.query(`ALTER TABLE ${table} DROP FOREIGN KEY ${name}`);
  } catch {
    /* ignorar si no existe */
  }
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agri_junin',
  });

  const db = process.env.DB_NAME || 'agri_junin';

  const [loteCol] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'alertas' AND COLUMN_NAME = 'lote_id'`,
    [db]
  );

  if (!loteCol.length) {
    await dropFk(conn, 'alertas', 'fk_alertas_registro');

    await conn.query(`
      ALTER TABLE alertas
        ADD COLUMN lote_id INT UNSIGNED NULL AFTER id,
        ADD COLUMN sensor_id INT UNSIGNED NULL AFTER registro_id,
        MODIFY registro_id INT UNSIGNED NULL
    `);

    await conn.query(`
      UPDATE alertas al
      INNER JOIN registros_agricolas r ON al.registro_id = r.id
      SET al.lote_id = r.lote_id
      WHERE al.lote_id IS NULL
    `);

    await conn.query(`
      UPDATE alertas al
      INNER JOIN (
        SELECT al2.id AS alerta_id, (
          SELECT s.id FROM sensores s
          WHERE s.lote_id = al2.lote_id
          ORDER BY s.bateria_pct ASC, s.id DESC
          LIMIT 1
        ) AS sid
        FROM alertas al2
        WHERE al2.tipo = 'sensor' AND al2.sensor_id IS NULL
      ) x ON x.alerta_id = al.id
      SET al.sensor_id = x.sid, al.registro_id = NULL
      WHERE x.sid IS NOT NULL
    `);

    await conn.query(`
      ALTER TABLE alertas
        ADD CONSTRAINT fk_alertas_lote
          FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT fk_alertas_registro
          FOREIGN KEY (registro_id) REFERENCES registros_agricolas(id) ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT fk_alertas_sensor
          FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE SET NULL ON UPDATE CASCADE,
        ADD INDEX idx_alertas_lote (lote_id),
        ADD INDEX idx_alertas_sensor (sensor_id)
    `);

    try {
      await conn.query(`
        ALTER TABLE alertas
          ADD CONSTRAINT chk_alertas_origen CHECK (
            registro_id IS NOT NULL OR sensor_id IS NOT NULL OR lote_id IS NOT NULL OR tipo = 'sistema'
          )
      `);
    } catch {
      console.log('  (CHECK omitido si no es compatible con su motor)');
    }

    console.log('✓ Tabla alertas migrada (lote_id, sensor_id, registro opcional)');
  } else {
    console.log('✓ Migración alertas ya aplicada');
  }

  await conn.end();
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
