const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });
async function run() {
  const c = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sasamap',
      port: process.env.DB_PORT || 3306,
  });
  const [rows] = await c.query("SELECT * FROM users");
  console.log(rows);
  process.exit();
}
run();
