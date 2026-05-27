require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');

async function fixSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('PostgreSQL 데이터베이스에 연결되었습니다.');
    console.log('기존 데이터를 유지하면서 누락된 열(column)들만 추가합니다...');

    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS type VARCHAR(50)`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'EMPTY'`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description VARCHAR(255)`);
    await pool.query(`ALTER TABLE timetables ADD COLUMN IF NOT EXISTS teacher_id INTEGER`);
    await pool.query(`ALTER TABLE timetables ADD COLUMN IF NOT EXISTS teacher_name VARCHAR(100)`);

    console.log('성공적으로 모든 열이 추가되었습니다! 기존 데이터는 전혀 건드리지 않았습니다.');
  } catch (error) {
    console.error('스키마 수정 중 에러 발생:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixSchema();
