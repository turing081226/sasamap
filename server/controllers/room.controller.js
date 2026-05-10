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
