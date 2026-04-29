const pool = require('../config/db');

const User = {
  findByEmail: async (email) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },
  
  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  create: async (userData) => {
    const { email, name, role } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (email, name, role) VALUES (?, ?, ?)',
      [email, name, role || 'USER']
    );
    return result.insertId;
  }
};

module.exports = User;
