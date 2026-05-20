const pool = require('../config/db');

// helper function (same as in mypage.controller)
const getOccupyType = (day, period) => {
  const now = new Date();
  const currentDay = now.getDay();
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

// get current period globally
const getCurrentPeriodInfo = () => {
  const now = new Date();
  const currentDay = now.getDay();
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
  return { day: currentDay, period: currentPeriod };
};

exports.requestFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    // find user by email
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: '해당 이메일을 가진 사용자를 찾을 수 없습니다.' });
    }

    const friendId = users[0].id;
    
    if (userId === friendId) {
      return res.status(400).json({ message: '자기 자신에게 친구 신청을 할 수 없습니다.' });
    }

    // check existing request or friendship
    const [existing] = await pool.query(
      'SELECT status FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [userId, friendId, friendId, userId]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'ACCEPTED') {
        return res.status(400).json({ message: '이미 친구인 사용자입니다.' });
      } else {
        return res.status(400).json({ message: '이미 친구 요청을 보냈거나 받은 상태입니다.' });
      }
    }

    await pool.query(
      'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
      [userId, friendId, 'PENDING']
    );

    res.json({ message: '친구 신청을 보냈습니다.' });
  } catch (err) {
    console.error('Request friend error:', err);
    res.status(500).json({ message: '친구 신청 중 오류가 발생했습니다.' });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    // Requests where user is the receiver
    const [requests] = await pool.query(`
      SELECT f.id, f.user_id as sender_id, u.name as sender_name, u.email as sender_email, f.created_at
      FROM friends f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'PENDING'
    `, [userId]);

    res.json(requests);
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ message: '친구 요청 목록을 불러오지 못했습니다.' });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // friends table id

    // check if it belongs to user
    const [requests] = await pool.query('SELECT * FROM friends WHERE id = ? AND friend_id = ? AND status = ?', [id, userId, 'PENDING']);
    if (requests.length === 0) {
      return res.status(404).json({ message: '유효하지 않은 요청입니다.' });
    }

    await pool.query('UPDATE friends SET status = ? WHERE id = ?', ['ACCEPTED', id]);
    res.json({ message: '친구 신청을 수락했습니다.' });
  } catch (err) {
    console.error('Accept friend error:', err);
    res.status(500).json({ message: '수락 중 오류가 발생했습니다.' });
  }
};

exports.deleteFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // friends table id

    const [requests] = await pool.query('SELECT * FROM friends WHERE id = ? AND (user_id = ? OR friend_id = ?)', [id, userId, userId]);
    if (requests.length === 0) {
      return res.status(404).json({ message: '유효하지 않은 요청입니다.' });
    }

    await pool.query('DELETE FROM friends WHERE id = ?', [id]);
    res.json({ message: '친구 목록에서 삭제/거절되었습니다.' });
  } catch (err) {
    console.error('Delete friend error:', err);
    res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all accepted friends
    const [friendsRows] = await pool.query(`
      SELECT f.id as friendship_id, u.id as user_id, u.name, u.email
      FROM friends f
      JOIN users u ON (f.user_id = u.id OR f.friend_id = u.id)
      WHERE (f.user_id = ? OR f.friend_id = ?) 
        AND f.status = 'ACCEPTED' 
        AND u.id != ?
    `, [userId, userId, userId]);

    const { day, period } = getCurrentPeriodInfo();

    // Attach current location
    for (const friend of friendsRows) {
      friend.location = "정보 없음"; // default
      friend.locationType = "NONE";

      if (day >= 1 && day <= 5 && period) {
        // 1. check user_occupancies (voluntary overrides)
        const [occupancies] = await pool.query(`
          SELECT r.name as room_name, r.floor 
          FROM user_occupancies uo 
          JOIN rooms r ON uo.room_id = r.id 
          WHERE uo.user_id = ? AND uo.day_of_week = ? AND uo.period = ?
        `, [friend.user_id, day, period]);

        if (occupancies.length > 0) {
          friend.location = \`📍 \${occupancies[0].room_name} (\${occupancies[0].floor}층)\`;
          friend.locationType = "OCCUPANCY";
        } else {
          // 2. check regular timetables
          const [timetables] = await pool.query(`
            SELECT room_name, subject 
            FROM user_timetables 
            WHERE user_id = ? AND day_of_week = ? AND period = ?
          `, [friend.user_id, day, period]);

          if (timetables.length > 0) {
            const t = timetables[0];
            friend.location = \`\${t.subject} (\${t.room_name || '위치미정'})\`;
            friend.locationType = "CLASS";
          } else {
            friend.location = "공강";
            friend.locationType = "EMPTY";
          }
        }
      } else {
        friend.location = "수업 외 시간";
        friend.locationType = "NONE";
      }
    }

    res.json(friendsRows);
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ message: '친구 목록을 불러오지 못했습니다.' });
  }
};
