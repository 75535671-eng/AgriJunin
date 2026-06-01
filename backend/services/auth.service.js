const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/** Hash bcrypt válido ($2a$10$...); lo demás se trata como texto plano (phpMyAdmin). */
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$.{53}$/;

const isBcryptHash = (value) => typeof value === 'string' && BCRYPT_REGEX.test(value);

const verifyPassword = async (plain, stored) => {
  if (!stored) return false;
  if (isBcryptHash(stored)) return bcrypt.compare(plain, stored);
  return plain === stored;
};

const upgradePasswordHash = async (userId, plainPassword) => {
  const hash = await bcrypt.hash(plainPassword, 10);
  await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, userId]);
};

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const findUserByLogin = async (login) => {
  const value = String(login || '').trim();
  if (/^\d{8}$/.test(value)) {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, dni, password, rol, activo, estado_cuenta FROM usuarios WHERE dni = ?',
      [value]
    );
    return rows[0];
  }
  const normalizedEmail = normalizeEmail(value);
  const [rows] = await pool.query(
    'SELECT id, nombre, email, dni, password, rol, activo, estado_cuenta FROM usuarios WHERE LOWER(TRIM(email)) = ?',
    [normalizedEmail]
  );
  return rows[0];
};

const login = async (login, password) => {
  const user = await findUserByLogin(login);
  if (!user) return null;

  if (user.estado_cuenta === 'pendiente') {
    throw Object.assign(
      new Error('Su cuenta de técnico está pendiente de aprobación por el administrador.'),
      { status: 403 }
    );
  }
  if (user.estado_cuenta === 'rechazada') {
    throw Object.assign(
      new Error('Su solicitud de cuenta fue rechazada. Contacte al administrador.'),
      { status: 403 }
    );
  }
  if (!user.activo) return null;

  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  if (!isBcryptHash(user.password)) {
    await upgradePasswordHash(user.id, password);
  }

  const { password: _, ...safe } = user;
  const profile = await getProfile(safe.id);
  return { user: profile || safe, token: generateToken(safe) };
};

const register = async (data) => {
  const dni = String(data.dni || '').trim();
  if (!/^\d{8}$/.test(dni)) {
    throw Object.assign(new Error('DNI inválido'), { status: 400 });
  }

  const [[existingDni]] = await pool.query('SELECT id FROM usuarios WHERE dni = ?', [dni]);
  if (existingDni) {
    throw Object.assign(new Error('Ya existe una cuenta con este DNI'), { status: 409 });
  }

  const hash = await bcrypt.hash(data.password, 10);
  const email = normalizeEmail(data.email);
  const nombre = data.nombre || `${data.nombres} ${data.apellidos}`.trim();
  const rol = data.rol || 'agricultor';
  const esTecnicoPendiente = rol === 'tecnico';
  const estadoCuenta = esTecnicoPendiente ? 'pendiente' : 'aprobada';
  const activo = esTecnicoPendiente ? 0 : 1;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO usuarios (nombre, email, dni, password, rol, activo, estado_cuenta) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, email, dni, hash, rol, activo, estadoCuenta]
    );
    const userId = result.insertId;

    if (rol === 'agricultor') {
      const [[existingAg]] = await conn.query('SELECT id FROM agricultores WHERE dni = ?', [dni]);
      if (existingAg) {
        await conn.query('UPDATE agricultores SET usuario_id = ?, activo = 1 WHERE dni = ?', [userId, dni]);
      } else {
        await conn.query(
          `INSERT INTO agricultores (usuario_id, dni, nombres, apellidos, email_contacto, distrito, fecha_registro, activo)
           VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 1)`,
          [
            userId,
            dni,
            data.nombres || nombre.split(' ')[0],
            data.apellidos || nombre.split(' ').slice(1).join(' '),
            email,
            data.distrito || 'Junín',
          ]
        );
      }
    }

    await conn.commit();
    const user = { id: userId, nombre, email, dni, rol, estado_cuenta: estadoCuenta };
    const profile = await getProfile(userId);

    if (esTecnicoPendiente) {
      return {
        user: profile || user,
        token: null,
        pendienteAprobacion: true,
      };
    }

    return { user: profile || user, token: generateToken(user), pendienteAprobacion: false };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const getProfile = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, dni, rol, activo, estado_cuenta, avatar_url, created_at FROM usuarios WHERE id = ?',
    [id]
  );
  const user = rows[0];
  if (!user) return null;
  if (user.rol === 'agricultor') {
    const [[ag]] = await pool.query(
      'SELECT id, nombres, apellidos FROM agricultores WHERE usuario_id = ? AND activo = 1 LIMIT 1',
      [id]
    );
    if (ag) {
      user.agricultor_id = ag.id;
      user.agricultor_nombre = `${ag.nombres} ${ag.apellidos}`;
    }
  }
  return user;
};

module.exports = { login, register, getProfile, generateToken };
