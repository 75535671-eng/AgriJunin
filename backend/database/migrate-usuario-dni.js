/**
 * Añade DNI a usuarios para registro e inicio de sesión
 * node database/migrate-usuario-dni.js
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
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'dni'`,
    [process.env.DB_NAME || 'agri_junin']
  );

  if (!cols.length) {
    await conn.query(`
      ALTER TABLE usuarios
        ADD COLUMN dni VARCHAR(8) NULL UNIQUE AFTER email,
        ADD INDEX idx_usuarios_dni (dni)
    `);
    console.log('✓ Columna dni agregada a usuarios');
  } else {
    console.log('✓ Columna dni ya existe');
  }

  await conn.end();
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
