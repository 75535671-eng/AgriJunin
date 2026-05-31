const { pool } = require('../config/database');

/**
 * Servicio genérico CRUD reutilizable
 */
class CrudService {
  constructor(table, allowedFields, defaultOrder = 'id DESC') {
    this.table = table;
    this.allowedFields = allowedFields;
    this.defaultOrder = defaultOrder;
  }

  async findAll({ search, searchFields = [], filters = {}, page = 1, limit = 10 } = {}) {
    let sql = `SELECT * FROM ${this.table} WHERE 1=1`;
    const params = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '' && this.allowedFields.includes(key)) {
        sql += ` AND ${key} = ?`;
        params.push(value);
      }
    }

    if (search && searchFields.length) {
      const conditions = searchFields.map((f) => `${f} LIKE ?`).join(' OR ');
      sql += ` AND (${conditions})`;
      searchFields.forEach(() => params.push(`%${search}%`));
    }

    const countSql = sql.replace(/SELECT \* FROM/, 'SELECT COUNT(*) as total FROM');
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    const offset = (page - 1) * limit;
    sql += ` ORDER BY ${this.defaultOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), offset);

    const [rows] = await pool.query(sql, params);
    return {
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async create(data) {
    const fields = Object.keys(data).filter((k) => this.allowedFields.includes(k));
    const values = fields.map((f) => data[f]);
    const [result] = await pool.query(
      `INSERT INTO ${this.table} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
      values
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const fields = Object.keys(data).filter((k) => this.allowedFields.includes(k));
    if (!fields.length) return this.findById(id);
    const sets = fields.map((f) => `${f} = ?`).join(', ');
    await pool.query(`UPDATE ${this.table} SET ${sets} WHERE id = ?`, [...fields.map((f) => data[f]), id]);
    return this.findById(id);
  }

  async remove(id) {
    const [result] = await pool.query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = { CrudService };
