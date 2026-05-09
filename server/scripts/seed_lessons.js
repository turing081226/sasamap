require('dotenv').config();
const mysql = require('mysql2/promise');
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

async function seedLessons() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sasamap',
      port: process.env.DB_PORT || 3306,
    });

    console.log('Connected to MySQL. Starting seed...');

    // Clear existing timetables
    await connection.query('DELETE FROM timetables');
    console.log('Cleared existing timetables.');

    // 1. Extract Unique Rooms and Insert
    const uniqueRooms = [...new Set(RAW_LESSONS.map(lesson => lesson.room))];
    const roomMap = {}; // name -> id mapping

    for (const roomName of uniqueRooms) {
      // Check if room exists
      const [existing] = await connection.query('SELECT id FROM rooms WHERE name = ?', [roomName]);
      if (existing.length > 0) {
        roomMap[roomName] = existing[0].id;
      } else {
        // Determine floor based on first digit after prefix (e.g., S505 -> floor 5)
        let floor = 1;
        const match = roomName.match(/[A-Za-z]+(\d)\d{2}/);
        if (match && match[1]) {
          floor = parseInt(match[1], 10);
        } else if (roomName.match(/\d/)) {
            // fallback, find first digit
            const digitMatch = roomName.match(/(\d)/);
            if (digitMatch) floor = parseInt(digitMatch[1], 10);
        }

        const [result] = await connection.query(
          'INSERT INTO rooms (name, floor, status) VALUES (?, ?, ?)',
          [roomName, floor, 'EMPTY']
        );
        roomMap[roomName] = result.insertId;
      }
    }
    console.log(`Verified/Inserted ${uniqueRooms.length} unique rooms.`);

    // 2. Insert Timetables
    let timetableCount = 0;
    const values = [];
    
    for (const lesson of RAW_LESSONS) {
      const roomId = roomMap[lesson.room];
      const dayOfWeek = dayMap[lesson.day] || 1;
      
      // If time > 1, create multiple periods
      for (let i = 0; i < lesson.time; i++) {
        const currentPeriod = lesson.period + i;
        values.push([lesson.subject, roomId, dayOfWeek, currentPeriod]);
        timetableCount++;
      }
    }

    if (values.length > 0) {
      // Bulk insert in chunks of 1000
      const chunkSize = 1000;
      for (let i = 0; i < values.length; i += chunkSize) {
        const chunk = values.slice(i, i + chunkSize);
        await connection.query(
          `INSERT INTO timetables (subject, room_id, day_of_week, period) VALUES ?`,
          [chunk]
        );
      }
    }

    console.log(`Successfully seeded ${timetableCount} timetable entries from the massive dataset.`);
    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedLessons();
