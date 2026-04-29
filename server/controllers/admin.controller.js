const pool = require('../config/db');

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, name, role, created_at FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve users', error: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user role', error: err.message });
  }
};

exports.uploadTimetable = async (req, res) => {
  try {
    const timetables = req.body.timetables; // Array of timetable objects
    if (!timetables || !Array.isArray(timetables)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // In a real scenario, this would be a bulk insert
    for (const item of timetables) {
      await pool.query(
        'INSERT INTO timetables (teacher_id, teacher_name, subject, room_id, day_of_week, period) VALUES (?, ?, ?, ?, ?, ?)',
        [item.teacher_id, item.teacher_name, item.subject, item.room_id, item.day_of_week, item.period]
      );
    }
    res.json({ message: 'Timetables uploaded successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload timetables', error: err.message });
  }
};
