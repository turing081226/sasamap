require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');

async function initDB() {
  try {
    // Connect without DB name to create the database if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
    });

    console.log('Connected to MySQL server.');

    // Create Database
    const dbName = process.env.DB_NAME || 'sasamap';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${dbName}' created or already exists.`);

    await connection.changeUser({ database: dbName });

    // Create Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        role ENUM('ADMIN', 'USER') DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table `users` ready.');

    // Create Rooms Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        floor INT NOT NULL,
        type VARCHAR(50),
        status ENUM('EMPTY', 'IN_USE', 'MAINTENANCE') DEFAULT 'EMPTY'
      )
    `);
    console.log('Table `rooms` ready.');

    // Create Timetables Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS timetables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT,
        teacher_name VARCHAR(100),
        subject VARCHAR(100) NOT NULL,
        room_id INT,
        day_of_week INT NOT NULL COMMENT '1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri',
        period INT NOT NULL COMMENT '1 to 7',
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
      )
    `);
    console.log('Table `timetables` ready.');

    // Create User Plans Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        plan_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Table `user_plans` ready.');

    // Create User Notifications Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        notification_time TIME NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Table `user_notifications` ready.');

    // Create User Timetables Table (for My Page)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_timetables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        day_of_week INT NOT NULL,
        period INT NOT NULL,
        subject VARCHAR(100),
        room_name VARCHAR(100),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Table `user_timetables` ready.');

    // ── Seed default admin user ──
    await connection.query(`
      INSERT IGNORE INTO users (email, name, role) 
      VALUES ('woolrabit77@sasa.hs.kr', '관리자', 'ADMIN')
    `);
    console.log('Default admin user seeded (woolrabit77@sasa.hs.kr).');

    await connection.end();
    console.log('Database initialization completed successfully.');
    process.exit(0);

  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDB();
