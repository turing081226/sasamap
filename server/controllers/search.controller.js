const pool = require('../config/db');

exports.searchAll = async (req, res) => {
  try {
    const { q, type } = req.query;
    
    // If q is undefined or empty, match everything
    const searchQuery = q ? `%${q}%` : '%';
    const searchType = type || 'all';

    let results = [];

    // 1. 교사 검색
    if (searchType === 'all' || searchType === 'teacher') {
      const [teachers] = await pool.query(
        `SELECT DISTINCT t.teacher_name, t.subject, r.name as room_name 
         FROM timetables t 
         LEFT JOIN rooms r ON t.room_id = r.id
         WHERE t.teacher_name LIKE ?`,
        [searchQuery]
      );
      teachers.forEach(t => {
        if (t.teacher_name) {
          results.push({
            id: `teacher_${t.teacher_name}_${results.length}`,
            type: '교사',
            title: `${t.teacher_name} 선생님`,
            subtitle: `담당 과목: ${t.subject || '알 수 없음'}`,
            location: t.room_name || '위치 정보 없음',
          });
        }
      });
    }

    // 2. 과목 검색
    if (searchType === 'all' || searchType === 'subject') {
      const [subjects] = await pool.query(
        `SELECT DISTINCT t.subject, r.name as room_name, t.day_of_week, t.period 
         FROM timetables t 
         LEFT JOIN rooms r ON t.room_id = r.id
         WHERE t.subject LIKE ?`,
        [searchQuery]
      );
      
      // Group by subject to avoid massive duplication
      const groupedSubjects = {};
      subjects.forEach(s => {
        if (!groupedSubjects[s.subject]) {
          groupedSubjects[s.subject] = { locations: new Set() };
        }
        if (s.room_name) {
          groupedSubjects[s.subject].locations.add(s.room_name);
        }
      });

      Object.keys(groupedSubjects).forEach((subjName, idx) => {
        const locations = Array.from(groupedSubjects[subjName].locations).join(', ') || '지정되지 않음';
        results.push({
          id: `subject_${idx}`,
          type: '과목',
          title: subjName,
          subtitle: `수업 교실: ${locations}`,
          location: '-',
        });
      });
    }

    // 3. 교실 검색
    if (searchType === 'all' || searchType === 'room') {
      const [rooms] = await pool.query(
        `SELECT r.id, r.name, r.floor, r.status 
         FROM rooms r 
         WHERE r.name LIKE ?`,
        [searchQuery]
      );
      
      rooms.forEach(r => {
        results.push({
          id: `room_${r.id}`,
          type: '교실',
          title: `${r.name} (${r.floor}층)`,
          subtitle: `상태: ${r.status === 'EMPTY' ? '빈 교실' : r.status === 'IN_USE' ? '사용 중' : r.status}`,
          location: r.name,
        });
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};
