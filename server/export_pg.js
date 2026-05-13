const fs = require('fs');
const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', password: '1avahound*', database: 'sasamap' });
  let out = '';

  out += `
DROP TABLE IF EXISTS user_timetables CASCADE;
DROP TABLE IF EXISTS user_plans CASCADE;
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS timetables CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  floor INT NOT NULL,
  type VARCHAR(50) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'EMPTY',
  description VARCHAR(255) DEFAULT NULL
);

CREATE TABLE timetables (
  id SERIAL PRIMARY KEY,
  teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
  teacher_name VARCHAR(100) DEFAULT NULL,
  subject VARCHAR(100) NOT NULL,
  room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
  day_of_week INT NOT NULL,
  period INT NOT NULL
);

CREATE TABLE user_notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_plans (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  plan_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_timetables (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL,
  period INT NOT NULL,
  subject VARCHAR(100) DEFAULT NULL,
  room_name VARCHAR(100) DEFAULT NULL
);
`;

  const escapePG = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (val instanceof Date) return `'${val.toISOString()}'`;
    let s = String(val).replace(/'/g, "''");
    return `'${s}'`;
  };

  const tables = ['users', 'rooms', 'timetables', 'user_notifications', 'user_plans', 'user_timetables'];

  for (const t of tables) {
    const [rows] = await pool.query('SELECT * FROM ' + t);
    if (rows.length === 0) continue;
    
    // Chunking inserts
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const cols = Object.keys(chunk[0]);
      out += `INSERT INTO ${t} (${cols.join(', ')}) VALUES \n`;
      
      const valStrings = chunk.map(row => {
        return '(' + cols.map(c => escapePG(row[c])).join(', ') + ')';
      });
      out += valStrings.join(',\n') + ';\n\n';
    }
    
    // reset sequence
    out += `SELECT setval('${t}_id_seq', (SELECT MAX(id) FROM ${t}));\n\n`;
  }

  fs.writeFileSync('../sasamap_pg_dump.sql', out);
  console.log('Saved to sasamap_pg_dump.sql');
  process.exit(0);
}
run().catch(console.error);
