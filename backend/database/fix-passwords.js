/**
 * Corrige contraseñas en la BD: crea admin demo y hashea texto plano / hashes rotos.
 * Uso: node database/fix-passwords.js
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$.{53}$/;
const DEMO_EMAILS = new Set([
  'admin@agrijunin.pe',
  'maria.quispe@agrijunin.pe',
  'juan.rojas@agrijunin.pe',
  'ana.tello@agrijunin.pe',
  'pedro.huaman@agrijunin.pe',
]);
const DEMO_PASSWORD = 'Admin123!';

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agri_junin',
  });

  const demoHash = await hashPassword(DEMO_PASSWORD);

  const [adminRows] = await conn.query(
    'SELECT id FROM usuarios WHERE email = ?',
    ['admin@agrijunin.pe']
  );
  if (!adminRows.length) {
    await conn.query(
      `INSERT INTO usuarios (nombre, email, password, rol, activo)
       VALUES (?, ?, ?, 'administrador', 1)`,
      ['Carlos Mendoza', 'admin@agrijunin.pe', demoHash]
    );
    console.log('✓ Usuario admin@agrijunin.pe creado (Admin123!)');
  } else {
    await conn.query('UPDATE usuarios SET password = ?, activo = 1 WHERE email = ?', [
      demoHash,
      'admin@agrijunin.pe',
    ]);
    console.log('✓ admin@agrijunin.pe actualizado (Admin123!)');
  }

  const [users] = await conn.query('SELECT id, email, password FROM usuarios');
  for (const user of users) {
    if (user.email === 'admin@agrijunin.pe') continue;

    const stored = user.password || '';
    const isBcrypt = BCRYPT_REGEX.test(stored);

    if (DEMO_EMAILS.has(user.email)) {
      await conn.query('UPDATE usuarios SET password = ?, activo = 1 WHERE id = ?', [
        demoHash,
        user.id,
      ]);
      console.log(`✓ ${user.email} → Admin123!`);
      continue;
    }

    if (!isBcrypt) {
      const newHash = await hashPassword(stored);
      await conn.query('UPDATE usuarios SET password = ?, activo = 1 WHERE id = ?', [
        newHash,
        user.id,
      ]);
      console.log(`✓ ${user.email} → contraseña hasheada (misma que tenías en texto plano)`);
      continue;
    }

    const okDemo = await bcrypt.compare(DEMO_PASSWORD, stored);
    if (!okDemo) {
      console.log(`  ${user.email}: mantiene su hash bcrypt (usa la contraseña que definiste al crearlo)`);
    }
  }

  console.log('\nListo. Prueba:');
  console.log('  admin@agrijunin.pe / Admin123!');
  console.log('  pierox@agrijunin.pe / (tu contraseña en texto plano, ej. scanpierox321)');
  await conn.end();
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
