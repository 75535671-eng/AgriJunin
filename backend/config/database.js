const mysql = require('mysql2/promise');
require('./env');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agri_junin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
});

/** Verifica conexión a MySQL */
async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  return true;
}

module.exports = { pool, testConnection };
