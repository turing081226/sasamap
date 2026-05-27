const pool = require('../config/db');

exports.getMyTimetable = async (req, res) => {
  try {
    const userId = req.user.id;
    const [timetable] = await pool.query('SELECT * FROM user_timetables WHERE user_id = ?', [userId]);
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving personal timetable', error: err.message });
  }
};

exports.updateMyTimetable = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = req.body.timetable; // array of items
    
    // Simple approach: delete existing and insert new
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query('DELETE FROM user_timetables WHERE user_id = ?', [userId]);
      for (const item of items) {
        await connection.query(
          'INSERT INTO user_timetables (user_id, day_of_week, period, subject, room_name) VALUES (?, ?, ?, ?, ?)',
          [userId, item.day_of_week, item.period, item.subject, item.room_name]
        );
      }
      await connection.commit();
      res.json({ message: 'Timetable updated successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating personal timetable', error: err.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, plan_date } = req.body;
    await pool.query(
      'INSERT INTO user_plans (user_id, title, content, plan_date) VALUES (?, ?, ?, ?)',
      [userId, title, content, plan_date]
    );
    res.json({ message: 'Plan created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating plan', error: err.message });
  }
};

exports.setNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notification_time } = req.body;
    
    // Delete existing notification setting for the user
    await pool.query('DELETE FROM user_notifications WHERE user_id = ?', [userId]);
    
    // Insert new notification setting
    await pool.query(
      'INSERT INTO user_notifications (user_id, notification_time, is_active) VALUES (?, ?, TRUE)',
      [userId, notification_time]
    );
    res.json({ message: 'Notification settings updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification settings', error: err.message });
  }
};

// Help helper to check if a specific day and period is currently active
const getOccupyType = (day, period) => {
  const now = new Date();
  const currentDay = now.getDay(); // 1 = Monday ... 5 = Friday
  if (currentDay !== day) return 'FUTURE';

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const PERIODS = [
    { id: 1, time: "08:40-09:30" },
    { id: 2, time: "09:40-10:30" },
    { id: 3, time: "10:40-11:30" },
    { id: 4, time: "11:40-12:30" },
    { id: 5, time: "13:20-14:10" },
    { id: 6, time: "14:20-15:10" },
    { id: 7, time: "15:20-16:10" },
    { id: 8, time: "16:20-17:10" },
    { id: 9, time: "17:20-18:10" }
  ];

  let currentPeriod = null;
  for (const p of PERIODS) {
    const [startStr, endStr] = p.time.split(/[-–]/);
    const [sh, sm] = startStr.trim().split(':').map(Number);
    const [eh, em] = endStr.trim().split(':').map(Number);
    if (currentMins >= sh * 60 + sm && currentMins <= eh * 60 + em) {
      currentPeriod = p.id;
      break;
    }
  }

  return (currentPeriod === period) ? 'CURRENT' : 'FUTURE';
};

exports.getMyOccupancy = async (req, res) => {
  try {
    const userId = req.user.id;
    const [occupancies] = await pool.query(
      'SELECT uo.*, r.name AS room_name, r.floor FROM user_occupancies uo JOIN rooms r ON uo.room_id = r.id WHERE uo.user_id = ? ORDER BY uo.day_of_week ASC, uo.period ASC',
      [userId]
    );
    res.json(occupancies);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving your occupancies', error: err.message });
  }
};

exports.occupyRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { room_id, day_of_week, period } = req.body;

    if (!room_id || !day_of_week || !period) {
      return res.status(400).json({ message: 'room_id, day_of_week, and period are required' });
    }

    const roomIdVal = parseInt(room_id, 10);
    const dayVal = parseInt(day_of_week, 10);
    const periodVal = parseInt(period, 10);

    // 1. Check if there is a regular class at that time in the room
    const [timetables] = await pool.query(
      'SELECT * FROM timetables WHERE room_id = ? AND day_of_week = ? AND period = ?',
      [roomIdVal, dayVal, periodVal]
    );
    if (timetables.length > 0) {
      return res.status(400).json({ message: '해당 교실의 해당 시간에는 정규 수업이 있습니다.' });
    }

    // 2. Removed the restriction allowing multiple people to occupy the same room.

    // 3. Determine occupy type (CURRENT or FUTURE)
    const occupyType = getOccupyType(dayVal, periodVal);

    // 4. Upsert occupancy (DELETE then INSERT to avoid unique constraint issues)
    await pool.query(
      'DELETE FROM user_occupancies WHERE user_id = ? AND day_of_week = ? AND period = ?',
      [userId, dayVal, periodVal]
    );
    const insertSql = `
      INSERT INTO user_occupancies (user_id, room_id, day_of_week, period, occupy_type)
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.query(insertSql, [userId, roomIdVal, dayVal, periodVal, occupyType]);

    res.json({ message: '위치 정보가 성공적으로 등록/수정되었습니다. 📍' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering occupancy', error: err.message });
  }
};

exports.cancelOccupancy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM user_occupancies WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: '위치 공유 등록이 취소되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling occupancy', error: err.message });
  }
};

