/**
 * Aprobación de lotes + vínculo cultivo→lote en solicitud
 * node database/migrate-lotes-aprobacion.js
 */
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agri_junin',
  });

  const db = process.env.DB_NAME || 'agri_junin';

  const [loteCols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lotes' AND COLUMN_NAME = 'estado_aprobacion'`,
    [db]
  );

  if (!loteCols.length) {
    await conn.query(`
      ALTER TABLE lotes
        ADD COLUMN estado_aprobacion ENUM('aprobado','pendiente','rechazado') NOT NULL DEFAULT 'aprobado' AFTER activo,
        ADD COLUMN solicitado_por INT UNSIGNED NULL AFTER estado_aprobacion,
        ADD COLUMN revisado_por INT UNSIGNED NULL,
        ADD COLUMN fecha_revision TIMESTAMP NULL,
        ADD COLUMN motivo_rechazo VARCHAR(255) NULL,
        ADD INDEX idx_lotes_aprobacion (estado_aprobacion),
        ADD CONSTRAINT fk_lotes_solicitante FOREIGN KEY (solicitado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
        ADD CONSTRAINT fk_lotes_revisor FOREIGN KEY (revisado_por) REFERENCES usuarios(id) ON DELETE SET NULL
    `);
    await conn.query(`UPDATE lotes SET estado_aprobacion = 'aprobado', activo = 1`);
    console.log('✓ Columnas de aprobación en lotes');
  } else {
    console.log('✓ Aprobación de lotes ya existe');
  }

  const [culCols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cultivos' AND COLUMN_NAME = 'lote_solicitud_id'`,
    [db]
  );

  if (!culCols.length) {
    await conn.query(`
      ALTER TABLE cultivos
        ADD COLUMN lote_solicitud_id INT UNSIGNED NULL AFTER motivo_rechazo,
        ADD CONSTRAINT fk_cultivos_lote_solicitud
          FOREIGN KEY (lote_solicitud_id) REFERENCES lotes(id) ON DELETE SET NULL
    `);
    console.log('✓ Columna lote_solicitud_id en cultivos');
  } else {
    console.log('✓ lote_solicitud_id ya existe');
  }

  await conn.end();
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
