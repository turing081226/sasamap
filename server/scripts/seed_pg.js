require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');
const RAW_LESSONS = require('./data.js');

const dayMap = {
  "MONDAY": 1,
  "TUESDAY": 2,
  "WEDNESDAY": 3,
  "THURSDAY": 4,
  "FRIDAY": 5,
  "SATURDAY": 6,
  "SUNDAY": 7
};

async function seedLessonsPG() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connected to PostgreSQL. Starting seed...');

    // Clear existing timetables and rooms
    await pool.query('DELETE FROM timetables');
    await pool.query('DELETE FROM rooms');
    console.log('Cleared existing timetables and rooms.');

    // 1. Extract Unique Rooms and Insert
    const uniqueRooms = [...new Set(RAW_LESSONS.map(lesson => lesson.room))];
    const roomMap = {}; // name -> id mapping

    for (const roomName of uniqueRooms) {
      let floor = 1;
      const match = roomName.match(/[A-Za-z]+(\d)\d{2}/);
      if (match && match[1]) {
        floor = parseInt(match[1], 10);
      } else if (roomName.match(/\d/)) {
        const digitMatch = roomName.match(/(\d)/);
        if (digitMatch) floor = parseInt(digitMatch[1], 10);
      }

      const result = await pool.query(
        'INSERT INTO rooms (name, floor, status) VALUES ($1, $2, $3) RETURNING id',
        [roomName, floor, 'EMPTY']
      );
      roomMap[roomName] = result.rows[0].id;
    }
    console.log(`Inserted ${uniqueRooms.length} unique rooms.`);

    // 2. Insert Timetables
    let timetableCount = 0;

    for (const lesson of RAW_LESSONS) {
      const roomId = roomMap[lesson.room];
      const dayOfWeek = dayMap[lesson.day] || 1;

      for (let i = 0; i < lesson.time; i++) {
        const currentPeriod = lesson.period + i;
        await pool.query(
          `INSERT INTO timetables (subject, room_id, day_of_week, period) VALUES ($1, $2, $3, $4)`,
          [lesson.subject, roomId, dayOfWeek, currentPeriod]
        );
        timetableCount++;
      }
    }

    console.log(`Successfully seeded ${timetableCount} timetable entries from the dataset.`);
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seedLessonsPG();
