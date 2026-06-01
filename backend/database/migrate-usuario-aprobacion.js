/**
 * Aprobación de cuentas (técnicos requieren visto bueno del administrador)
 * node database/migrate-usuario-aprobacion.js
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
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'estado_cuenta'`,
    [process.env.DB_NAME || 'agri_junin']
  );

  if (!cols.length) {
    await conn.query(`
      ALTER TABLE usuarios
        ADD COLUMN estado_cuenta ENUM('aprobada','pendiente','rechazada') NOT NULL DEFAULT 'aprobada' AFTER activo,
        ADD INDEX idx_usuarios_estado_cuenta (estado_cuenta)
    `);
    await conn.query(`UPDATE usuarios SET estado_cuenta = 'aprobada' WHERE rol IN ('administrador', 'agricultor')`);
    console.log('✓ Columna estado_cuenta agregada');
  } else {
    console.log('✓ estado_cuenta ya existe');
  }

  await conn.end();
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
