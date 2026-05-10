const pool = require('../config/db');

// ─── Users ──────────────────────────────────────────────────────
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

// ─── Timetables ──────────────────────────────────────────────────
exports.getAllTimetables = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.teacher_name, t.subject, t.day_of_week, t.period,
             r.name AS room_name, r.id AS room_id
      FROM timetables t
      LEFT JOIN rooms r ON t.room_id = r.id
      ORDER BY t.day_of_week, t.period
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve timetables', error: err.message });
  }
};

exports.createTimetable = async (req, res) => {
  try {
    const { teacher_name, subject, room_id, day_of_week, period } = req.body;
    const [result] = await pool.query(
      'INSERT INTO timetables (teacher_name, subject, room_id, day_of_week, period) VALUES (?, ?, ?, ?, ?)',
      [teacher_name, subject, room_id || null, day_of_week, period]
    );
    res.json({ message: 'Timetable created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create timetable', error: err.message });
  }
};

exports.updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_name, subject, room_id, day_of_week, period } = req.body;
    await pool.query(
      'UPDATE timetables SET teacher_name=?, subject=?, room_id=?, day_of_week=?, period=? WHERE id=?',
      [teacher_name, subject, room_id || null, day_of_week, period, id]
    );
    res.json({ message: 'Timetable updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update timetable', error: err.message });
  }
};

exports.deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM timetables WHERE id = ?', [id]);
    res.json({ message: 'Timetable deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete timetable', error: err.message });
  }
};

// ─── Bulk import (from Excel parsed JSON) ────────────────────────
exports.uploadTimetable = async (req, res) => {
  try {
    const timetables = req.body.timetables;
    if (!timetables || !Array.isArray(timetables)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }
    // Append (기존 데이터 유지, 새 데이터 추가)
    for (const item of timetables) {
      await pool.query(
        'INSERT INTO timetables (teacher_name, subject, room_id, day_of_week, period) VALUES (?, ?, ?, ?, ?)',
        [item.teacher_name, item.subject, item.room_id || null, item.day_of_week, item.period]
      );
    }
    res.json({ message: `${timetables.length}개의 수업 데이터를 추가했습니다.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload timetables', error: err.message });
  }
};

