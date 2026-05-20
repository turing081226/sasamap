require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');

async function addFriendsTable() {
  const connStr = (process.env.DATABASE_URL || process.env.POSTGRES_URL).replace('localhost', '127.0.0.1');
  const pgPool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pgPool.connect();
    console.log('Connected to PostgreSQL database.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        friend_id INT NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (user_id, friend_id)
      )
    `);

    console.log('Table \`friends\` is ready.');
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Error adding friends table:', err);
    process.exit(1);
  }
}

addFriendsTable();
