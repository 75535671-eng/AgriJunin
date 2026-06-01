const { pool } = require('../config/database');

const listPendientesTecnicos = async () => {
  const [rows] = await pool.query(
    `SELECT id, nombre, email, dni, rol, estado_cuenta, created_at
     FROM usuarios
     WHERE rol = 'tecnico' AND estado_cuenta = 'pendiente'
     ORDER BY created_at DESC`
  );
  return rows;
};

const aprobarCuenta = async (id, adminId) => {
  const [result] = await pool.query(
    `UPDATE usuarios SET estado_cuenta = 'aprobada', activo = 1
     WHERE id = ? AND rol = 'tecnico' AND estado_cuenta = 'pendiente'`,
    [id]
  );
  if (!result.affectedRows) return null;
  const [[user]] = await pool.query(
    'SELECT id, nombre, email, dni, rol, estado_cuenta, activo FROM usuarios WHERE id = ?',
    [id]
  );
  return user;
};

const rechazarCuenta = async (id, adminId, motivo) => {
  const [result] = await pool.query(
    `UPDATE usuarios SET estado_cuenta = 'rechazada', activo = 0
     WHERE id = ? AND rol = 'tecnico' AND estado_cuenta = 'pendiente'`,
    [id]
  );
  if (!result.affectedRows) return null;
  return { id, motivo: motivo || 'Solicitud no aprobada' };
};

module.exports = { listPendientesTecnicos, aprobarCuenta, rechazarCuenta };
