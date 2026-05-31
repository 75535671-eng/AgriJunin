const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

const login = async (email, password) => {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ?',
    [email]
  );
  const user = rows[0];
  if (!user || !user.activo) return null;

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  const { password: _, ...safe } = user;
  return { user: safe, token: generateToken(safe) };
};

const register = async (data) => {
  const hash = await bcrypt.hash(data.password, 10);
  const [result] = await pool.query(
    'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
    [data.nombre, data.email, hash, data.rol || 'agricultor']
  );
  const user = { id: result.insertId, nombre: data.nombre, email: data.email, rol: data.rol || 'agricultor' };
  return { user, token: generateToken(user) };
};

const getProfile = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, rol, activo, avatar_url, created_at FROM usuarios WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

module.exports = { login, register, getProfile, generateToken };
