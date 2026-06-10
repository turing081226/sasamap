const pool = require('../config/db');

async function run() {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS teachers (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, office_room_id INT REFERENCES rooms(id) ON DELETE SET NULL);');
    
    await pool.query('ALTER TABLE timetables DROP CONSTRAINT IF EXISTS timetables_teacher_id_fkey;');
    await pool.query('ALTER TABLE timetables ADD CONSTRAINT timetables_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;');
    
    console.log('Successfully added teachers table and updated timetables');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();
