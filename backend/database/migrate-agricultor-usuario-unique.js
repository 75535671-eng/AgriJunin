/**
 * Relación 1:1 usuario ↔ agricultor:
 *  - Deja usuario_id como NULL UNIQUE
 *  - Deduplica fichas que comparten el mismo usuario_id (conserva la más antigua,
 *    desvincula las demás poniéndolas en NULL)
 * node database/migrate-agricultor-usuario-unique.js
 */
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agri_junin',
  });

  const db = process.env.DB_NAME || 'agri_junin';

  // 1. Permitir NULL en usuario_id (fichas aún no vinculadas a una cuenta)
  await conn.query('ALTER TABLE agricultores MODIFY usuario_id INT UNSIGNED NULL');

  // 2. Desvincular duplicados: conservar la ficha más antigua por usuario_id
  const [dups] = await conn.query(`
    SELECT usuario_id, MIN(id) AS keep_id, COUNT(*) AS n
    FROM agricultores
    WHERE usuario_id IS NOT NULL
    GROUP BY usuario_id
    HAVING n > 1
  `);

  for (const d of dups) {
    await conn.query(
      'UPDATE agricultores SET usuario_id = NULL WHERE usuario_id = ? AND id <> ?',
      [d.usuario_id, d.keep_id]
    );
    console.log(`  · usuario_id ${d.usuario_id}: ${d.n - 1} ficha(s) duplicada(s) desvinculada(s)`);
  }

  // 3. Agregar índice UNIQUE si aún no existe
  const [idx] = await conn.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'agricultores'
       AND COLUMN_NAME = 'usuario_id' AND NON_UNIQUE = 0`,
    [db]
  );

  if (!idx.length) {
    await conn.query('ALTER TABLE agricultores ADD UNIQUE KEY uq_agricultores_usuario (usuario_id)');
    console.log('✓ Restricción UNIQUE agregada a agricultores.usuario_id (relación 1:1)');
  } else {
    console.log('✓ usuario_id ya es UNIQUE');
  }

  await conn.end();
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
