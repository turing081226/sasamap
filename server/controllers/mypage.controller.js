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
    await pool.query(
      'INSERT INTO user_notifications (user_id, notification_time) VALUES (?, ?) ON DUPLICATE KEY UPDATE notification_time = VALUES(notification_time)',
      [userId, notification_time]
    );
    res.json({ message: 'Notification settings updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification settings', error: err.message });
  }
};
