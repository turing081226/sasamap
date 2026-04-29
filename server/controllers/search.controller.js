const pool = require('../config/db');

exports.searchAll = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = `%${q}%`;

    // Search teachers mapping to timetables
    const [teachers] = await pool.query(
      `SELECT t.*, u.email as teacher_email 
       FROM timetables t 
       LEFT JOIN users u ON t.teacher_id = u.id 
       WHERE t.teacher_name LIKE ? OR t.subject LIKE ?`,
      [searchQuery, searchQuery]
    );

    // Search rooms
    const [rooms] = await pool.query(
      'SELECT * FROM rooms WHERE name LIKE ? OR type LIKE ?',
      [searchQuery, searchQuery]
    );

    res.json({
      teachers,
      rooms
    });
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};
