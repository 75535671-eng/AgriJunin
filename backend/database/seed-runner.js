/**
 * Ejecuta schema + seeds con contraseñas bcrypt reales
 * Uso: npm run seed
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await conn.query(schema);
  console.log('✓ Schema creado');

  const hash = await bcrypt.hash('Admin123!', 10);

  await conn.query('USE agri_junin');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  const tables = ['alertas', 'registros_agricolas', 'sensores', 'lotes', 'cultivos', 'agricultores', 'usuarios'];
  for (const t of tables) await conn.query(`TRUNCATE TABLE ${t}`);
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  await conn.query(
    `INSERT INTO usuarios (nombre, email, password, rol) VALUES
     ('Carlos Mendoza', 'admin@agrijunin.pe', ?, 'administrador'),
     ('María Quispe', 'maria.quispe@agrijunin.pe', ?, 'agricultor'),
     ('Juan Rojas', 'juan.rojas@agrijunin.pe', ?, 'agricultor'),
     ('Ana Tello', 'ana.tello@agrijunin.pe', ?, 'tecnico'),
     ('Pedro Huamán', 'pedro.huaman@agrijunin.pe', ?, 'tecnico')`,
    [hash, hash, hash, hash, hash]
  );

  const seeds = fs.readFileSync(path.join(__dirname, 'seeds.sql'), 'utf8');
  const dataOnly = seeds.replace(/^[\s\S]*?USE agri_junin;\s*/i, '').replace(/INSERT INTO usuarios[\s\S]*?;\s*/i, '');
  await conn.query(dataOnly);

  console.log('✓ Datos de prueba insertados');
  console.log('  Credenciales: admin@agrijunin.pe / Admin123!');
  await conn.end();
}

run().catch((e) => {
  console.error('Error en seed:', e.message);
  process.exit(1);
});
