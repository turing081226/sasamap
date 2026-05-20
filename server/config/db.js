require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Global mock databases
global.mockOccupancies = global.mockOccupancies || [];
global.mockDb = global.mockDb || {
  users: [],
  rooms: [],
  timetables: [],
  user_timetables: [],
  user_occupancies: global.mockOccupancies,
  user_plans: [],
  user_notifications: []
};
global.isFallbackMode = global.isFallbackMode || false;

// DUMP File Parser for robust local fallback
function parseDumpFile() {
  try {
    const dumpPath = path.join(__dirname, '../../data/sasamap_pg_dump.sql');
    if (!fs.existsSync(dumpPath)) {
      console.warn("⚠️ sasamap_pg_dump.sql not found at:", dumpPath);
      return;
    }
    const content = fs.readFileSync(dumpPath, 'utf8');
    
    // Clear and reload mocks
    global.mockDb = global.mockDb || {};
    global.mockDb.users = [];
    global.mockDb.rooms = [];
    global.mockDb.timetables = [];
    global.mockDb.user_timetables = global.mockDb.user_timetables || [];
    global.mockDb.user_occupancies = global.mockDb.user_occupancies || global.mockOccupancies;
    global.mockDb.user_plans = global.mockDb.user_plans || [];
    global.mockDb.user_notifications = global.mockDb.user_notifications || [];

    const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/gi;
    let match;
    while ((match = insertRegex.exec(content)) !== null) {
      const tableName = match[1].toLowerCase();
      global.mockDb[tableName] = global.mockDb[tableName] || [];

      const columns = match[2].split(',').map(c => c.trim().toLowerCase());
      const valuesPart = match[3];

      const tupleRegex = /\(([^)]+)\)/g;
      let tupleMatch;
      while ((tupleMatch = tupleRegex.exec(valuesPart)) !== null) {
        const rawValues = tupleMatch[1];
        const parsedValues = [];
        let currentVal = '';
        let inQuotes = false;
        for (let i = 0; i < rawValues.length; i++) {
          const char = rawValues[i];
          if (char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parsedValues.push(currentVal.trim());
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        parsedValues.push(currentVal.trim());

        const row = {};
        columns.forEach((col, idx) => {
          let val = parsedValues[idx];
          if (val === undefined) return;
          if (val.toUpperCase() === 'NULL') {
            row[col] = null;
          } else if (val.startsWith("'") && val.endsWith("'")) {
            row[col] = val.slice(1, -1);
          } else {
            const num = Number(val);
            row[col] = isNaN(num) ? val : num;
          }
        });
        global.mockDb[tableName].push(row);
      }
    }
    console.log(`✅ Loaded Mock Data from Dump: ${global.mockDb.users.length} users, ${global.mockDb.rooms.length} rooms, ${global.mockDb.timetables.length} timetables.`);
  } catch (err) {
    console.error("❌ Failed to parse SQL dump for fallback:", err.message);
  }
}

// Initial mock load
parseDumpFile();

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Advanced Query Simulator for seamless local testing without running DB
const mockQuery = async (sql, params = []) => {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  const upperSql = cleanSql.toUpperCase();
  console.log(`🔍 [MockQuery] Incoming SQL: "${cleanSql.slice(0, 150)}..." with params:`, params);
  console.log(`🔍 [MockQuery] Current Mock Timetables count: ${global.mockDb.timetables ? global.mockDb.timetables.length : 'undefined'}`);

  // 1. SELECT * FROM users WHERE email = ?
  if (upperSql.includes('FROM USERS') && upperSql.includes('EMAIL =')) {
    const email = params[0];
    let user = global.mockDb.users.find(u => u.email === email);
    if (!user) {
      user = {
        id: global.mockDb.users.length + 1,
        email: email,
        name: email ? email.split('@')[0] : '임시 사용자',
        role: email && email.includes('admin') ? 'ADMIN' : 'USER',
        created_at: new Date().toISOString()
      };
      global.mockDb.users.push(user);
    }
    return [[user], {}];
  }

  // 1-1. SELECT * FROM users WHERE id = ?
  if (upperSql.includes('FROM USERS') && upperSql.includes('ID =')) {
    const id = parseInt(params[0], 10);
    const user = global.mockDb.users.find(u => u.id === id);
    return [user ? [user] : [], {}];
  }

  // 1-2. INSERT INTO users
  if (upperSql.includes('INSERT INTO USERS')) {
    const email = params[0];
    const name = params[1];
    const role = params[2] || 'USER';
    const newUser = {
      id: global.mockDb.users.length + 1,
      email,
      name,
      role,
      created_at: new Date().toISOString()
    };
    global.mockDb.users.push(newUser);
    return [{ insertId: newUser.id }, {}];
  }

  // 2. SELECT * FROM user_timetables
  if (upperSql.includes('FROM USER_TIMETABLES') && upperSql.includes('USER_ID =')) {
    const userId = params[0];
    const res = global.mockDb.user_timetables.filter(t => t.user_id === userId);
    return [res, {}];
  }

  // 3. DELETE FROM user_timetables
  if (upperSql.includes('DELETE FROM USER_TIMETABLES') && upperSql.includes('USER_ID =')) {
    const userId = params[0];
    global.mockDb.user_timetables = global.mockDb.user_timetables.filter(t => t.user_id !== userId);
    return [[], {}];
  }

  // 4. INSERT INTO user_timetables
  if (upperSql.includes('INSERT INTO USER_TIMETABLES')) {
    const row = {
      id: global.mockDb.user_timetables.length + 1,
      user_id: params[0],
      day_of_week: params[1],
      period: params[2],
      subject: params[3],
      room_name: params[4]
    };
    global.mockDb.user_timetables.push(row);
    return [{ insertId: row.id }, {}];
  }

  // 5. SELECT * FROM user_occupancies (with room info)
  if (upperSql.includes('FROM USER_OCCUPANCIES') && upperSql.includes('JOIN ROOMS') && upperSql.includes('USER_ID =')) {
    const userId = params[0];
    const res = global.mockOccupancies
      .filter(o => o.user_id === userId)
      .map(o => {
        const r = global.mockDb.rooms.find(rm => rm.id === o.room_id) || {};
        return {
          ...o,
          room_name: r.name || '알 수 없음',
          floor: r.floor || 0
        };
      })
      .sort((a, b) => (a.day_of_week - b.day_of_week) || (a.period - b.period));
    return [res, {}];
  }

  // 6. SELECT * FROM timetables (specific schedule check)
  if (upperSql.includes('FROM TIMETABLES') && upperSql.includes('ROOM_ID =') && upperSql.includes('DAY_OF_WEEK =') && upperSql.includes('PERIOD =')) {
    const roomId = params[0];
    const day = params[1];
    const period = params[2];
    const res = global.mockDb.timetables.filter(t => t.room_id === roomId && t.day_of_week === day && t.period === period);
    return [res, {}];
  }

  // 7. SELECT * FROM user_occupancies (overlap check)
  if (upperSql.includes('FROM USER_OCCUPANCIES') && upperSql.includes('ROOM_ID =') && upperSql.includes('USER_ID !=')) {
    const roomId = params[0];
    const day = params[1];
    const period = params[2];
    const userId = params[3];
    const res = global.mockOccupancies.filter(o => o.room_id === roomId && o.day_of_week === day && o.period === period && o.user_id !== userId);
    return [res, {}];
  }

  // 8. INSERT INTO user_occupancies (UPSERT)
  if (upperSql.includes('INSERT INTO USER_OCCUPANCIES')) {
    const userId = params[0];
    const roomId = params[1];
    const day = params[2];
    const period = params[3];
    const occupyType = params[4];

    let existing = global.mockOccupancies.find(o => o.user_id === userId && o.day_of_week === day && o.period === period);
    if (existing) {
      existing.room_id = roomId;
      existing.occupy_type = occupyType;
      existing.created_at = new Date().toISOString();
    } else {
      global.mockOccupancies.push({
        id: global.mockOccupancies.length + 1,
        user_id: userId,
        room_id: roomId,
        day_of_week: day,
        period: period,
        occupy_type: occupyType,
        created_at: new Date().toISOString()
      });
    }
    return [{ insertId: global.mockOccupancies.length }, {}];
  }

  // 9. DELETE FROM user_occupancies
  if (upperSql.includes('DELETE FROM USER_OCCUPANCIES') && upperSql.includes('USER_ID =')) {
    const id = parseInt(params[0], 10);
    const userId = parseInt(params[1], 10);
    const prevLen = global.mockOccupancies.length;
    global.mockOccupancies = global.mockOccupancies.filter(o => !(o.id === id && o.user_id === userId));
    global.mockDb.user_occupancies = global.mockOccupancies;
    return [global.mockOccupancies.length < prevLen ? [{ affectedRows: 1 }] : [], {}];
  }

  // 10. SELECT * FROM rooms WHERE status = 'EMPTY' / status = "EMPTY"
  if (upperSql.includes('FROM ROOMS') && upperSql.includes('STATUS =') && upperSql.includes('EMPTY')) {
    let res = global.mockDb.rooms.filter(r => r.status === 'EMPTY');
    if (upperSql.includes('FLOOR =')) {
      const floor = params[0];
      res = res.filter(r => r.floor === floor);
    }
    return [res, {}];
  }

  // 11. SELECT * FROM rooms WHERE id = ?
  if (upperSql.includes('FROM ROOMS') && upperSql.includes('ID =')) {
    const id = params[0];
    const res = global.mockDb.rooms.filter(r => r.id === id);
    return [res, {}];
  }

  // 12. SELECT * FROM timetables WHERE room_id = ?
  if (upperSql.includes('FROM TIMETABLES') && upperSql.includes('ROOM_ID =')) {
    const roomId = params[0];
    const res = global.mockDb.timetables.filter(t => t.room_id === roomId);
    return [res, {}];
  }

  // 13. SELECT t.id, t.teacher_name, t.subject, t.day_of_week, t.period, r.name AS room_name FROM timetables t
  if (upperSql.includes('FROM TIMETABLES T') && upperSql.includes('LEFT JOIN ROOMS R')) {
    const res = global.mockDb.timetables.map(t => {
      const r = global.mockDb.rooms.find(rm => rm.id === t.room_id) || {};
      return {
        id: t.id,
        teacher_name: t.teacher_name,
        subject: t.subject,
        day_of_week: t.day_of_week,
        period: t.period,
        room_name: r.name || null,
        room_id: r.id || null
      };
    });
    return [res, {}];
  }

  // 14. SELECT id, name, floor, type, description FROM rooms (Available rooms query)
  if (upperSql.includes('FROM ROOMS') && upperSql.includes('STATUS != \'MAINTENANCE\'') && upperSql.includes('NOT IN')) {
    const dayVal = params[0];
    const periodVal = params[1];

    const classRoomIds = global.mockDb.timetables
      .filter(t => t.day_of_week === dayVal && t.period === periodVal && t.room_id !== null)
      .map(t => t.room_id);

    const occupiedRoomIds = global.mockOccupancies
      .filter(o => o.day_of_week === dayVal && o.period === periodVal)
      .map(o => o.room_id);

    const res = global.mockDb.rooms
      .filter(r => r.status !== 'MAINTENANCE' && !classRoomIds.includes(r.id) && !occupiedRoomIds.includes(r.id))
      .map(r => ({ id: r.id, name: r.name, floor: r.floor, type: r.type, description: r.description }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [res, {}];
  }

  // 15. SELECT uo.id, uo.user_id, uo.room_id, uo.day_of_week, uo.period, uo.occupy_type, uo.created_at, u.name AS user_name, r.name AS room_name FROM user_occupancies uo
  if (upperSql.includes('FROM USER_OCCUPANCIES UO') && upperSql.includes('JOIN USERS U') && upperSql.includes('JOIN ROOMS R')) {
    const res = global.mockOccupancies.map(o => {
      const u = global.mockDb.users.find(usr => usr.id === o.user_id) || { name: '테스트 유저' };
      const r = global.mockDb.rooms.find(rm => rm.id === o.room_id) || { name: '알 수 없음' };
      return {
        id: o.id,
        user_id: o.user_id,
        room_id: o.room_id,
        day_of_week: o.day_of_week,
        period: o.period,
        occupy_type: o.occupy_type,
        created_at: o.created_at,
        user_name: u.name,
        room_name: r.name
      };
    });
    return [res, {}];
  }

  // 16. INSERT INTO user_notifications / user_plans (General INSERTs)
  if (upperSql.includes('INSERT INTO USER_NOTIFICATIONS')) {
    return [{ insertId: 1 }, {}];
  }
  if (upperSql.includes('INSERT INTO USER_PLANS')) {
    return [{ insertId: 1 }, {}];
  }

  // 17. CREATE TABLE IF NOT EXISTS user_occupancies
  if (upperSql.includes('CREATE TABLE IF NOT EXISTS USER_OCCUPANCIES')) {
    return [[], {}];
  }

  // 18. SELECT id, name, floor, type, status, description FROM rooms ORDER BY floor, name
  if (upperSql.includes('FROM ROOMS') && upperSql.includes('ORDER BY FLOOR, NAME')) {
    const res = [...global.mockDb.rooms].sort((a, b) => (a.floor - b.floor) || a.name.localeCompare(b.name));
    return [res, {}];
  }

  // 19. SELECT id, email, name, role, created_at FROM users
  if (upperSql.includes('FROM USERS') && !upperSql.includes('WHERE')) {
    return [global.mockDb.users, {}];
  }

  // 20. SELECT DISTINCT t.teacher_name, t.subject, r.name as room_name FROM timetables t LEFT JOIN rooms r ON t.room_id = r.id WHERE t.teacher_name LIKE ?
  if (upperSql.includes('DISTINCT T.TEACHER_NAME') && upperSql.includes('TEACHER_NAME LIKE')) {
    const rawPattern = params[0] || '%';
    const pattern = rawPattern.replace(/%/g, '');
    const filtered = global.mockDb.timetables.filter(t => {
      if (!t.teacher_name) return false;
      return t.teacher_name.toLowerCase().includes(pattern.toLowerCase());
    });
    const res = [];
    const seen = new Set();
    for (const t of filtered) {
      const r = global.mockDb.rooms.find(rm => rm.id === t.room_id) || {};
      const key = `${t.teacher_name}-${t.subject}-${r.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        res.push({ teacher_name: t.teacher_name, subject: t.subject, room_name: r.name || null });
      }
    }
    return [res, {}];
  }

  // 21. SELECT DISTINCT t.subject, r.name as room_name, t.day_of_week, t.period FROM timetables t LEFT JOIN rooms r ON t.room_id = r.id WHERE t.subject LIKE ?
  if (upperSql.includes('DISTINCT T.SUBJECT') && upperSql.includes('SUBJECT LIKE')) {
    const rawPattern = params[0] || '%';
    const pattern = rawPattern.replace(/%/g, '');
    const filtered = global.mockDb.timetables.filter(t => t.subject.toLowerCase().includes(pattern.toLowerCase()));
    const res = [];
    const seen = new Set();
    for (const t of filtered) {
      const r = global.mockDb.rooms.find(rm => rm.id === t.room_id) || {};
      const key = `${t.subject}-${r.name}-${t.day_of_week}-${t.period}`;
      if (!seen.has(key)) {
        seen.add(key);
        res.push({ subject: t.subject, room_name: r.name || null, day_of_week: t.day_of_week, period: t.period });
      }
    }
    return [res, {}];
  }

  // 22. SELECT r.id, r.name, r.floor, r.status FROM rooms r WHERE r.name LIKE ?
  if (upperSql.includes('FROM ROOMS R') && upperSql.includes('R.NAME LIKE')) {
    const rawPattern = params[0] || '%';
    const pattern = rawPattern.replace(/%/g, '');
    const res = global.mockDb.rooms
      .filter(r => r.name.toLowerCase().includes(pattern.toLowerCase()))
      .map(r => ({ id: r.id, name: r.name, floor: r.floor, status: r.status }));
    return [res, {}];
  }

  // Fallback default: empty array
  console.warn(`⚠️ [MockQuery] Unmatched SQL fallback to empty array: "${cleanSql}"`);
  return [[], {}];
};

const wrapQuery = async (client, sql, params = []) => {
  // Check if we are in fallback mode
  if (global.isFallbackMode) {
    return mockQuery(sql, params);
  }

  let i = 1;
  let pgSql = sql.replace(/\?/g, () => `$${i++}`);

  if (pgSql.includes('ON DUPLICATE KEY UPDATE')) {
    pgSql = pgSql.replace(
      /ON DUPLICATE KEY UPDATE notification_time = VALUES\(notification_time\)/,
      'ON CONFLICT (user_id) DO UPDATE SET notification_time = EXCLUDED.notification_time'
    );
  }

  const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
  if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
    pgSql += ' RETURNING id';
  }

  try {
    const result = await client.query(pgSql, params);
    if (isInsert) {
      const insertId = result.rows[0] ? result.rows[0].id : null;
      return [{ insertId }, result.fields];
    }
    return [result.rows, result.fields];
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.syscall === 'connect' || err.message.includes('connect')) {
      if (!global.isFallbackMode) {
        console.warn("⚠️ [Database Connection Failed] Switching to In-Memory Fallback Engine.");
        global.isFallbackMode = true;
      }
      return mockQuery(sql, params);
    }
    throw err;
  }
};

const pool = {
  query: async (sql, params = []) => {
    return wrapQuery(pgPool, sql, params);
  },
  getConnection: async () => {
    if (global.isFallbackMode) {
      return {
        query: async (sql, params = []) => mockQuery(sql, params),
        release: () => {},
        beginTransaction: () => {},
        commit: () => {},
        rollback: () => {}
      };
    }
    try {
      const client = await pgPool.connect();
      return {
        query: async (sql, params = []) => wrapQuery(client, sql, params),
        release: () => client.release(),
        beginTransaction: () => client.query('BEGIN'),
        commit: () => client.query('COMMIT'),
        rollback: () => client.query('ROLLBACK')
      };
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.syscall === 'connect' || err.message.includes('connect')) {
        console.warn("⚠️ [Database Connection Failed on Connect] Switching to In-Memory Fallback Engine.");
        global.isFallbackMode = true;
        return {
          query: async (sql, params = []) => mockQuery(sql, params),
          release: () => {},
          beginTransaction: () => {},
          commit: () => {},
          rollback: () => {}
        };
      }
      throw err;
    }
  }
};

// Automatically initialize user_occupancies table if it doesn't exist (Only if DB is connected)
(async () => {
  try {
    if (global.isFallbackMode) return;
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user_occupancies (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        day_of_week INT NOT NULL,
        period INT NOT NULL,
        occupy_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, day_of_week, period)
      );
    `;
    await pool.query(createTableQuery);
    console.log('✅ user_occupancies table verified/created successfully.');
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.syscall === 'connect') {
      global.isFallbackMode = true;
      console.warn('⚠️ DB not reachable during init. Switched to In-Memory Fallback.');
    } else {
      console.error('❌ Failed to initialize user_occupancies table:', err.message);
    }
  }
})();

module.exports = pool;
