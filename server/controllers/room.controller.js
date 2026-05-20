const pool = require('../config/db');

exports.getEmptyRooms = async (req, res) => {
  try {
    const { floor } = req.query;
    let query = 'SELECT * FROM rooms WHERE status = "EMPTY"';
    const params = [];
    
    if (floor) {
      query += ' AND floor = ?';
      params.push(parseInt(floor, 10));
    }

    const [rooms] = await pool.query(query, params);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving empirical data', error: err.message });
  }
};

exports.getRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [roomInfo] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    
    if (roomInfo.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get current usage from timetables (Simplified for testing)
    const [timetables] = await pool.query('SELECT * FROM timetables WHERE room_id = ?', [id]);

    res.json({
      room: roomInfo[0],
      timetables
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving room specific status', error: err.message });
  }
};

exports.getAllTimetables = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.teacher_name, t.subject, t.day_of_week, t.period,
             r.name AS room_name, r.id AS room_id
      FROM timetables t
      LEFT JOIN rooms r ON t.room_id = r.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getAvailableRooms = async (req, res) => {
  try {
    const { day_of_week, period } = req.query;
    if (!day_of_week || !period) {
      return res.status(400).json({ message: 'day_of_week and period are required' });
    }

    const dayVal = parseInt(day_of_week, 10);
    const periodVal = parseInt(period, 10);

    // Get rooms that:
    // 1. Are not in maintenance
    // 2. Do not have a regular class at that day and period
    // 3. Are not occupied by any user at that day and period
    const [rooms] = await pool.query(`
      SELECT id, name, floor, type, description 
      FROM rooms 
      WHERE status != 'MAINTENANCE' 
        AND id NOT IN (
          SELECT room_id FROM timetables 
          WHERE day_of_week = ? AND period = ? AND room_id IS NOT NULL
        )
        AND id NOT IN (
          SELECT room_id FROM user_occupancies 
          WHERE day_of_week = ? AND period = ?
        )
      ORDER BY name ASC
    `, [dayVal, periodVal, dayVal, periodVal]);

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving available rooms', error: err.message });
  }
};

exports.getAllOccupancies = async (req, res) => {
  try {
    const [occupancies] = await pool.query(`
      SELECT uo.id, uo.user_id, uo.room_id, uo.day_of_week, uo.period, uo.occupy_type, uo.created_at,
             u.name AS user_name, r.name AS room_name
      FROM user_occupancies uo
      JOIN users u ON uo.user_id = u.id
      JOIN rooms r ON uo.room_id = r.id
    `);
    res.json(occupancies);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving occupancies', error: err.message });
  }
};

