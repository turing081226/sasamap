require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_URL is required for the external PostgreSQL database.');
}

const isLocalDatabase = /localhost|127\.0\.0\.1/.test(connectionString);

const pgPool = new Pool({
  connectionString,
  ssl: isLocalDatabase ? false : { rejectUnauthorized: false }
});

const wrapQuery = async (client, sql, params = []) => {
  // Convert ? to $1, $2, etc.
  let i = 1;
  let pgSql = sql.replace(/\?/g, () => `$${i++}`);

  // Handle INSERT RETURNING for insertId
  const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
  if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
    pgSql += ' RETURNING *';
  }

  const result = await client.query(pgSql, params);

  if (isInsert) {
    const insertId = result.rows[0] ? (result.rows[0].id || result.rows[0].user_id) : null;
    const resObj = { insertId, affectedRows: result.rowCount };
    return [resObj, result.fields];
  }

  const rows = result.rows;
  rows.affectedRows = result.rowCount; // For MySQL compatibility
  return [rows, result.fields];
};

const pool = {
  query: async (sql, params = []) => {
    return wrapQuery(pgPool, sql, params);
  },
  getConnection: async () => {
    const client = await pgPool.connect();
    return {
      query: async (sql, params = []) => wrapQuery(client, sql, params),
      release: () => client.release(),
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK')
    };
  }
};

module.exports = pool;
