const pool = require('../config/db');

const getDayLabel = (day) => {
  const days = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금' };
  return days[day] || '';
};

const formatDetails = (slots, formatFn) => {
  if (!slots || slots.length === 0) return [];
  
  const merged = [];
  let currentGroup = null;

  for (const s of slots) {
    const text = formatFn(s);
    if (!currentGroup) {
      currentGroup = { day: s.day_of_week, start: s.period, end: s.period, text };
    } else {
      if (currentGroup.day === s.day_of_week && currentGroup.text === text && s.period === currentGroup.end + 1) {
        currentGroup.end = s.period;
      } else {
        merged.push(currentGroup);
        currentGroup = { day: s.day_of_week, start: s.period, end: s.period, text };
      }
    }
  }
  if (currentGroup) merged.push(currentGroup);

  return merged.map(g => {
    const periodStr = g.start === g.end ? `${g.start}교시` : `${g.start}~${g.end}교시`;
    return `${getDayLabel(g.day)}요일 ${periodStr}: ${g.text}`;
  });
};

exports.searchAll = async (req, res) => {
  try {
    const { q, type } = req.query;
    
    // If q is undefined or empty, match everything
    const searchQuery = q ? `%${q}%` : '%';
    const searchType = type || 'all';

    let results = [];

    // 1. 교사 검색
    if (searchType === 'all' || searchType === 'teacher') {
      const [rows] = await pool.query(
        `SELECT t.teacher_name, t.subject, t.day_of_week, t.period, r.name as room_name, tc.office_room_id, r2.name as office_name
         FROM timetables t 
         LEFT JOIN rooms r ON t.room_id = r.id
         LEFT JOIN teachers tc ON tc.id = t.teacher_id OR tc.name = t.teacher_name
         LEFT JOIN rooms r2 ON tc.office_room_id = r2.id
         WHERE t.teacher_name LIKE ?
         ORDER BY t.teacher_name, t.day_of_week, t.period`,
        [searchQuery]
      );

      const teacherMap = {};
      rows.forEach(row => {
        if (!row.teacher_name) return;
        const cleanName = row.teacher_name.replace(/\s+/g, '');
        if (!teacherMap[cleanName]) {
          teacherMap[cleanName] = [];
        }
        teacherMap[cleanName].push(row);
      });

      Object.keys(teacherMap).forEach(teacherName => {
        const slots = teacherMap[teacherName];
        const uniqueSubjects = Array.from(new Set(slots.map(s => s.subject).filter(Boolean)));
        
        // Format detailed timetable schedule slots
        const details = formatDetails(slots, s => `${s.subject || '과목 미지정'} ${s.teacher_name || teacherName} 선생님 (${s.room_name || '장소 미지정'})`);

        const office = slots[0]?.office_name ? ` (교무실: ${slots[0].office_name})` : '';
        results.push({
          id: `teacher_${teacherName}`,
          type: '교사',
          title: `${teacherName} 선생님${office}`,
          subtitle: `담당 과목: ${uniqueSubjects.join(', ') || '없음'}`,
          location: slots[0]?.room_name || '위치 미정',
          details: details
        });
      });
    }

    // 2. 과목 검색
    if (searchType === 'all' || searchType === 'subject') {
      const [rows] = await pool.query(
        `SELECT t.subject, t.teacher_name, t.day_of_week, t.period, r.name as room_name 
         FROM timetables t 
         LEFT JOIN rooms r ON t.room_id = r.id
         WHERE t.subject LIKE ?
         ORDER BY t.subject, t.day_of_week, t.period`,
        [searchQuery]
      );

      const subjectMap = {};
      rows.forEach(row => {
        if (!row.subject) return;
        if (!subjectMap[row.subject]) {
          subjectMap[row.subject] = [];
        }
        subjectMap[row.subject].push(row);
      });

      Object.keys(subjectMap).forEach(subjectName => {
        const slots = subjectMap[subjectName];
        const uniqueRooms = Array.from(new Set(slots.map(s => s.room_name).filter(Boolean)));
        
        // Format detailed schedule slots for subject
        const details = formatDetails(slots, s => `${s.subject || subjectName} ${s.teacher_name || '교사 미지정'} 선생님 (${s.room_name || '장소 미지정'})`);

        results.push({
          id: `subject_${subjectName}`,
          type: '과목',
          title: subjectName,
          subtitle: `수업 교실: ${uniqueRooms.join(', ') || '지정되지 않음'}`,
          location: uniqueRooms[0] || '-',
          details: details
        });
      });
    }

    // 3. 교실 검색
    if (searchType === 'all' || searchType === 'room') {
      const [rows] = await pool.query(
        `SELECT r.id as room_id, r.name as room_name, r.floor, r.status, r.description,
                t.subject, t.teacher_name, t.day_of_week, t.period
         FROM rooms r
         LEFT JOIN timetables t ON t.room_id = r.id
         WHERE r.name LIKE ? OR r.description LIKE ?
         ORDER BY r.name, t.day_of_week, t.period`,
        [searchQuery, searchQuery]
      );

      const roomMap = {};
      rows.forEach(row => {
        if (!roomMap[row.room_name]) {
          roomMap[row.room_name] = {
            id: row.room_id,
            name: row.room_name,
            floor: row.floor,
            status: row.status,
            description: row.description,
            slots: []
          };
        }
        if (row.subject) {
          roomMap[row.room_name].slots.push(row);
        }
      });

      Object.keys(roomMap).forEach(roomName => {
        const roomData = roomMap[roomName];
        
        const details = formatDetails(roomData.slots, s => `${s.subject || '과목 미지정'} ${s.teacher_name || '교사 미지정'} 선생님 (${roomName})`);

        let statusText = '빈 교실';
        if (roomData.status === 'MAINTENANCE') statusText = '점검 중';
        else if (roomData.status === 'UNAVAILABLE') statusText = '사용 불가';
        else if (roomData.status === 'NEEDS_APPROVAL') statusText = '승인 필요';
        else if (roomData.status === 'IN_USE') statusText = '사용 중';

        results.push({
          id: `room_${roomData.id}`,
          type: '교실',
          title: `${roomName} (${roomData.floor}층)`,
          subtitle: `상태: ${statusText}${roomData.description ? ` - ${roomData.description}` : ''}`,
          location: roomName,
          details: details.length > 0 ? details : ['개설되거나 등록된 정규 수업 일정이 없습니다.']
        });
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};
