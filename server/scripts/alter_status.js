require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');

async function alterDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sasamap',
      port: process.env.DB_PORT || 3306,
    });

    await connection.query(`
      ALTER TABLE rooms 
      MODIFY COLUMN status ENUM('EMPTY', 'IN_USE', 'CLASS', 'NEEDS_APPROVAL', 'UNAVAILABLE', 'MAINTENANCE') DEFAULT 'EMPTY'
    `);
    console.log("Rooms table altered successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
alterDB();
