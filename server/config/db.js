require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const wrapQuery = async (client, sql, params) => {
  // Convert ? to $1, $2, etc.
  let i = 1;
  let pgSql = sql.replace(/\?/g, () => `$${i++}`);

  // Convert MySQL 'ON DUPLICATE KEY UPDATE' to PostgreSQL 'ON CONFLICT DO UPDATE'
  if (pgSql.includes('ON DUPLICATE KEY UPDATE')) {
    pgSql = pgSql.replace(
      /ON DUPLICATE KEY UPDATE notification_time = VALUES\(notification_time\)/,
      'ON CONFLICT (user_id) DO UPDATE SET notification_time = EXCLUDED.notification_time'
    );
  }

  // Handle INSERT RETURNING for insertId
  const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
  if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
    pgSql += ' RETURNING id';
  }

  const result = await client.query(pgSql, params);

  if (isInsert) {
    const insertId = result.rows[0] ? result.rows[0].id : null;
    return [{ insertId }, result.fields];
  }

  return [result.rows, result.fields];
};

const pool = {
  query: async (sql, params) => {
    return wrapQuery(pgPool, sql, params);
  },
  getConnection: async () => {
    const client = await pgPool.connect();
    return {
      query: async (sql, params) => wrapQuery(client, sql, params),
      release: () => client.release(),
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK')
    };
  }
};

module.exports = pool;
