require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// CORS with credentials for cookies
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const roomRoutes = require('./routes/room.routes');
const searchRoutes = require('./routes/search.routes');
const mypageRoutes = require('./routes/mypage.routes');
const friendRoutes = require('./routes/friend.routes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/mypage', mypageRoutes);
app.use('/api/friends', friendRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./config/db');
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [rooms] = await pool.query('SELECT COUNT(*) as count FROM rooms');
    const [timetables] = await pool.query('SELECT COUNT(*) as count FROM timetables');
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'NONE';
    res.json({
      status: 'ok',
      db_connected: true,
      db_url_prefix: dbUrl.substring(0, 15) + '...',
      users_count: users[0].count,
      rooms_count: rooms[0].count,
      timetables_count: timetables[0].count
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message, stack: err.stack });
  }
});
// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(process.env.PORT || 3001, () => console.log('서버 실행중, 포트:', process.env.PORT || 3001));
}

module.exports = app;