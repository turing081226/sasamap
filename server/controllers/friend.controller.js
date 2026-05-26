const pool = require('../config/db');

// 시간 유틸리티 (현재 교시 계산)
const getCurrentTimeInfo = () => {
  const now = new Date();
  const currentDay = now.getDay(); // 1 = 월 ... 5 = 금
  if (currentDay < 1 || currentDay > 5) return { day: -1, period: -1 };

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const PERIODS = [
    { id: 1, start: 8 * 60 + 40, end: 9 * 60 + 30 },
    { id: 2, start: 9 * 60 + 40, end: 10 * 60 + 30 },
    { id: 3, start: 10 * 60 + 40, end: 11 * 60 + 30 },
    { id: 4, start: 11 * 60 + 40, end: 12 * 60 + 30 },
    { id: 5, start: 13 * 60 + 20, end: 14 * 60 + 10 },
    { id: 6, start: 14 * 60 + 20, end: 15 * 60 + 10 },
    { id: 7, start: 15 * 60 + 20, end: 16 * 60 + 10 },
    { id: 8, start: 16 * 60 + 20, end: 17 * 60 + 10 },
    { id: 9, start: 17 * 60 + 20, end: 18 * 60 + 10 }
  ];

  for (const p of PERIODS) {
    if (currentMins >= p.start && currentMins <= p.end) {
      return { day: currentDay, period: p.id };
    }
  }
  // 수업시간이 아닐 때 (쉬는시간, 점심 등) - 편의상 가장 가까운 교시로 매핑하거나 -1 반환
  // 여기서는 엄격하게 매핑
  return { day: currentDay, period: -1 };
};

// 1. 친구 신청
exports.requestFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    // 1. 친구 정보 찾기
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: '해당 이메일을 가진 사용자가 없습니다.' });
    }
    const friendId = users[0].id;

    if (userId === friendId) {
      return res.status(400).json({ message: '자기 자신에게 친구 신청을 할 수 없습니다.' });
    }

    // 2. 이미 친구이거나 요청 상태인지 확인
    const [existing] = await pool.query(
      'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [userId, friendId, friendId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: '이미 친구 요청을 보냈거나 친구 상태입니다.' });
    }

    // 3. 요청 생성
    await pool.query(
      'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
      [userId, friendId, 'PENDING']
    );

    res.json({ message: '친구 신청이 완료되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '친구 신청 중 오류 발생', error: err.message });
  }
};

// 2. 나에게 온 친구 요청 목록 조회
exports.getRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const [requests] = await pool.query(`
      SELECT f.id, u.id AS sender_id, u.name AS sender_name, u.email AS sender_email
      FROM friends f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'PENDING'
    `, [userId]);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: '친구 요청 조회 중 오류 발생', error: err.message });
  }
};

// 3. 친구 요청 수락
exports.acceptFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.id;

    const [result] = await pool.query(
      'UPDATE friends SET status = ? WHERE id = ? AND friend_id = ?',
      ['ACCEPTED', requestId, userId]
    );

    if (result.rowCount === 0 && result.affectedRows === 0) {
       return res.status(404).json({ message: '요청을 찾을 수 없거나 권한이 없습니다.' });
    }

    res.json({ message: '친구 요청을 수락했습니다.' });
  } catch (err) {
    res.status(500).json({ message: '친구 수락 중 오류 발생', error: err.message });
  }
};

// 4. 친구 삭제 / 거절
exports.deleteFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.id;

    await pool.query(
      'DELETE FROM friends WHERE id = ? AND (user_id = ? OR friend_id = ?)',
      [requestId, userId, userId]
    );

    res.json({ message: '처리되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '오류 발생', error: err.message });
  }
};

// 5. 내 친구 목록 및 현재 위치 조회
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { day, period } = getCurrentTimeInfo();

    // 1. 내 친구 목록 가져오기 (양방향)
    const [friendsList] = await pool.query(`
      SELECT f.id AS friendship_id, u.id AS user_id, u.name, u.email
      FROM friends f
      JOIN users u ON (u.id = f.friend_id AND f.user_id = ?) OR (u.id = f.user_id AND f.friend_id = ?)
      WHERE f.status = 'ACCEPTED'
    `, [userId, userId]);

    if (friendsList.length === 0) {
      return res.json([]);
    }

    const friendIds = friendsList.map(f => f.user_id);

    // 2. 현재 시간의 user_occupancies 가져오기
    let occupancies = [];
    if (day !== -1 && period !== -1) {
      const [occRows] = await pool.query(`
        SELECT uo.user_id, r.name AS room_name, r.floor
        FROM user_occupancies uo
        JOIN rooms r ON uo.room_id = r.id
        WHERE uo.day_of_week = ? AND uo.period = ? AND uo.user_id = ANY($3::int[])
      `, [day, period, friendIds]); 
      // Note: PostgreSQL parameter matching might vary, but db.js replaces ? with $1. 
      // However, db.js regex doesn't handle ANY($3::int[]) well with ? if it breaks syntax. 
      // Let's use a dynamic IN clause.
    }
    
    // Better compatibility for IN clause across MySQL emulator wrapper
    let occMap = {};
    if (day !== -1 && period !== -1 && friendIds.length > 0) {
      const placeholders = friendIds.map(() => '?').join(',');
      const [occRows] = await pool.query(`
        SELECT uo.user_id, r.name AS room_name, r.floor
        FROM user_occupancies uo
        JOIN rooms r ON uo.room_id = r.id
        WHERE uo.day_of_week = ? AND uo.period = ? AND uo.user_id IN (${placeholders})
      `, [day, period, ...friendIds]);
      
      occRows.forEach(row => {
        occMap[row.user_id] = { type: 'OCCUPANCY', text: `📍 ${row.floor}층 ${row.room_name}` };
      });
    }

    // 3. 현재 시간의 user_timetables 가져오기
    let timeMap = {};
    if (day !== -1 && period !== -1 && friendIds.length > 0) {
      const placeholders = friendIds.map(() => '?').join(',');
      const [timeRows] = await pool.query(`
        SELECT user_id, room_name, subject
        FROM user_timetables
        WHERE day_of_week = ? AND period = ? AND user_id IN (${placeholders})
      `, [day, period, ...friendIds]);
      
      timeRows.forEach(row => {
        timeMap[row.user_id] = { type: 'CLASS', text: `📖 ${row.room_name || row.subject}` };
      });
    }

    // 4. 결합
    const result = friendsList.map(friend => {
      let location = '공강';
      let locationType = 'EMPTY';

      if (occMap[friend.user_id]) {
        location = occMap[friend.user_id].text;
        locationType = occMap[friend.user_id].type;
      } else if (timeMap[friend.user_id]) {
        location = timeMap[friend.user_id].text;
        locationType = timeMap[friend.user_id].type;
      } else if (day === -1 || period === -1) {
         location = '수업 시간 아님';
         locationType = 'OFF_HOURS';
      }

      return {
        ...friend,
        location,
        locationType
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '친구 목록 조회 중 오류 발생', error: err.message });
  }
};
