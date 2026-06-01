/**
 * Añade campos de aprobación a cultivos (ejecutar una vez)
 * node database/migrate-cultivos-aprobacion.js
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

  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cultivos' AND COLUMN_NAME = 'estado_aprobacion'`,
    [process.env.DB_NAME || 'agri_junin']
  );

  if (cols.length) {
    console.log('✓ Columnas de aprobación ya existen');
    await conn.end();
    return;
  }

  await conn.query(`
    ALTER TABLE cultivos
      ADD COLUMN estado_aprobacion ENUM('aprobado','pendiente','rechazado') NOT NULL DEFAULT 'aprobado' AFTER activo,
      ADD COLUMN solicitado_por INT UNSIGNED NULL AFTER estado_aprobacion,
      ADD COLUMN revisado_por INT UNSIGNED NULL,
      ADD COLUMN fecha_revision TIMESTAMP NULL,
      ADD COLUMN motivo_rechazo VARCHAR(255) NULL,
      ADD INDEX idx_cultivos_aprobacion (estado_aprobacion),
      ADD CONSTRAINT fk_cultivos_solicitante FOREIGN KEY (solicitado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
      ADD CONSTRAINT fk_cultivos_revisor FOREIGN KEY (revisado_por) REFERENCES usuarios(id) ON DELETE SET NULL
  `);
  await conn.query(`UPDATE cultivos SET estado_aprobacion = 'aprobado' WHERE estado_aprobacion IS NULL`);
  console.log('✓ Migración de aprobación de cultivos aplicada');
  await conn.end();
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
