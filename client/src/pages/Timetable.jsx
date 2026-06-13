import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Pencil, Search, Trash2, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

const DAYS = [
  { id: 1, label: '월' },
  { id: 2, label: '화' },
  { id: 3, label: '수' },
  { id: 4, label: '목' },
  { id: 5, label: '금' },
];

const PERIODS = [
  { id: 1, label: '1교시', time: '08:40 - 09:30' },
  { id: 2, label: '2교시', time: '09:40 - 10:30' },
  { id: 3, label: '3교시', time: '10:40 - 11:30' },
  { id: 4, label: '4교시', time: '11:40 - 12:30' },
  { id: 'lunch', label: '점심', time: '12:30 - 13:20' },
  { id: 5, label: '5교시', time: '13:20 - 14:10' },
  { id: 6, label: '6교시', time: '14:20 - 15:10' },
  { id: 7, label: '7교시', time: '15:20 - 16:10' },
  { id: 8, label: '8교시', time: '16:20 - 17:10' },
  { id: 9, label: '9교시', time: '17:20 - 18:10' },
];

const getDefaultDay = () => {
  const day = new Date().getDay();
  return day >= 1 && day <= 5 ? day : 1;
};

const toMinutes = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const getCurrentPeriod = () => {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  for (const period of PERIODS) {
    if (period.id === 'lunch') continue;
    const [start, end] = period.time.split(' - ');
    if (current >= toMinutes(start) && current <= toMinutes(end)) return period.id;
  }
  return null;
};

const dayName = (dayId) => DAYS.find((day) => day.id === dayId)?.label || '';

export default function Timetable() {
  const showToast = useToast();
  const [selectedDay, setSelectedDay] = useState(getDefaultDay());
  const [userTimetable, setUserTimetable] = useState([]);
  const [masterTimetable, setMasterTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editCell, setEditCell] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customRoom, setCustomRoom] = useState('');
  const today = new Date().getDay();
  const currentPeriod = getCurrentPeriod();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, masterRes] = await Promise.all([
        apiFetch('/mypage/timetable'),
        apiFetch('/rooms/timetables'),
      ]);
      setUserTimetable(userRes.ok ? await userRes.json() : []);
      setMasterTimetable(masterRes.ok ? await masterRes.json() : []);
    } catch (err) {
      console.error('Failed to fetch timetable data', err);
      showToast('error', '일정 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const findUserClass = (day, period) => (
    userTimetable.find((item) => item.day_of_week === day && item.period === period)
  );

  const findMasterClass = (day, period, classItem) => {
    if (!classItem) return null;
    return masterTimetable.find((item) => (
      item.day_of_week === day &&
      item.period === period &&
      item.subject === classItem.subject &&
      (!classItem.room_name || item.room_name === classItem.room_name)
    ));
  };

  const saveTimetable = async (nextTimetable) => {
    setSaving(true);
    try {
      const res = await apiFetch('/mypage/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetable: nextTimetable }),
      });
      if (!res.ok) throw new Error('시간표 저장에 실패했습니다.');
      setUserTimetable(nextTimetable);
      showToast('success', '시간표를 저장했습니다.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (period) => {
    const existing = findUserClass(selectedDay, period);
    setEditCell({ day: selectedDay, period });
    setSearchQuery('');
    setCustomSubject(existing?.subject || '');
    setCustomRoom(existing?.room_name || '');
  };

  const closeEditModal = () => {
    setEditCell(null);
    setSearchQuery('');
    setCustomSubject('');
    setCustomRoom('');
  };

  const saveCustomClass = async (event) => {
    event.preventDefault();
    if (!editCell || !customSubject.trim()) {
      showToast('error', '과목명을 입력해주세요.');
      return;
    }

    const base = userTimetable.filter((item) => (
      !(item.day_of_week === editCell.day && item.period === editCell.period)
    ));
    await saveTimetable([
      ...base,
      {
        day_of_week: editCell.day,
        period: editCell.period,
        subject: customSubject.trim(),
        room_name: customRoom.trim() || null,
      },
    ]);
    closeEditModal();
  };

  const selectMasterClass = async (course) => {
    if (!editCell) return;
    const base = userTimetable.filter((item) => (
      !(item.day_of_week === editCell.day && item.period === editCell.period)
    ));
    await saveTimetable([
      ...base,
      {
        day_of_week: editCell.day,
        period: editCell.period,
        subject: course.subject,
        room_name: course.room_name || null,
      },
    ]);
    closeEditModal();
  };

  const deleteClass = async () => {
    if (!editCell) return;
    await saveTimetable(userTimetable.filter((item) => (
      !(item.day_of_week === editCell.day && item.period === editCell.period)
    )));
    closeEditModal();
  };

  const filteredMasterCourses = useMemo(() => {
    if (!editCell) return [];
    const query = searchQuery.toLowerCase().trim();
    return masterTimetable.filter((item) => {
      const sameSlot = item.day_of_week === editCell.day && item.period === editCell.period;
      if (!sameSlot) return false;
      if (!query) return true;
      return (
        item.subject?.toLowerCase().includes(query) ||
        item.teacher_name?.toLowerCase().includes(query) ||
        item.room_name?.toLowerCase().includes(query)
      );
    });
  }, [editCell, masterTimetable, searchQuery]);

  return (
    <section className="page-shell timetable-page">
      <header className="section-head">
        <div>
          <span className="section-kicker">오늘 일정</span>
          <h1>교시별 수업과 공강</h1>
        </div>
      </header>

      <div className="day-selector" role="tablist" aria-label="요일 선택">
        {DAYS.map((day) => (
          <button
            key={day.id}
            className={`day-button ${selectedDay === day.id ? 'active' : ''}`}
            onClick={() => setSelectedDay(day.id)}
            type="button"
          >
            {day.label}
          </button>
        ))}
      </div>

      <div className="timetable-scroll">
        <div className="schedule-bars compact">
          {loading && <div className="empty-state">시간표를 불러오는 중입니다.</div>}
          {!loading && PERIODS.map((period) => {
            if (period.id === 'lunch') {
              return (
                <div key={period.id} className="schedule-bar lunch">
                  <div className="period-cell">
                    <strong>{period.label}</strong>
                    <small>{period.time}</small>
                  </div>
                  <div className="schedule-main">
                    <strong>점심</strong>
                  </div>
                </div>
              );
            }

            const classItem = findUserClass(selectedDay, period.id);
            const masterClass = findMasterClass(selectedDay, period.id, classItem);
            const isNow = selectedDay === today && currentPeriod === period.id;

            return (
              <button
                key={period.id}
                className={`schedule-bar ${classItem ? 'filled' : 'free'} ${isNow ? 'current' : ''}`}
                onClick={() => openEditModal(period.id)}
                type="button"
              >
                <div className="period-cell">
                  <strong>{period.label}</strong>
                  <small>{period.time}</small>
                </div>
                <div className="schedule-main">
                  <span className="now-dot" />
                  <strong>{classItem?.subject || '공강'}</strong>
                  <small>{classItem ? [classItem.room_name, masterClass?.teacher_name].filter(Boolean).join(' · ') : '시간표 추가하기'}</small>
                </div>
                <Pencil size={14} />
              </button>
            );
          })}
        </div>
      </div>

      {editCell && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="badge bg-blue">{dayName(editCell.day)}요일 {editCell.period}교시</span>
                <h3>수업 추가/수정</h3>
              </div>
              <button className="modal-close-button" onClick={closeEditModal} aria-label="닫기" type="button">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-section-title">
                <Search size={14} />
                학교 수업에서 선택하기
              </div>

              <label className="modal-search-wrap">
                <Search size={15} />
                <input
                  className="modal-search-input"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="과목, 교사, 교실 검색"
                />
              </label>

              {filteredMasterCourses.length > 0 ? (
                <div className="master-item-list">
                  {filteredMasterCourses.map((course) => (
                    <button
                      key={course.id}
                      className="master-item-btn"
                      onClick={() => selectMasterClass(course)}
                      type="button"
                    >
                      <div>
                        <span className="master-item-subject">{course.subject}</span>
                        <span className="master-item-teacher">{course.teacher_name || '담당 교사 없음'}</span>
                      </div>
                      {course.room_name && <span className="master-item-room">{course.room_name}</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="modal-empty-box">선택 가능한 수업이 없습니다.</div>
              )}

              <div className="modal-divider" />

              <form onSubmit={saveCustomClass}>
                <div className="modal-section-title">
                  <Edit2 size={14} />
                  직접 정보 입력하기
                </div>

                <div className="manual-form-grid">
                  <div className="form-full-width">
                    <label className="custom-input-label" htmlFor="custom-subject">과목명 *</label>
                    <input
                      id="custom-subject"
                      className="custom-textbox"
                      value={customSubject}
                      onChange={(event) => setCustomSubject(event.target.value)}
                      placeholder="예: 고급 알고리즘 / 창체"
                      required
                    />
                  </div>

                  <div className="form-full-width">
                    <label className="custom-input-label" htmlFor="custom-room">교실 또는 선생님</label>
                    <input
                      id="custom-room"
                      className="custom-textbox"
                      value={customRoom}
                      onChange={(event) => setCustomRoom(event.target.value)}
                      placeholder="예: A401 / 홍길동 선생님"
                    />
                  </div>
                </div>

                <div className="modal-action-row">
                  {findUserClass(editCell.day, editCell.period) && (
                    <button className="modal-delete-button" type="button" onClick={deleteClass} disabled={saving}>
                      <Trash2 size={15} />
                      삭제
                    </button>
                  )}
                  <div className="modal-action-spacer" />
                  <button className="modal-cancel-button" type="button" onClick={closeEditModal} disabled={saving}>취소</button>
                  <button className="modal-save-button" type="submit" disabled={saving}>
                    {saving ? '저장 중...' : '저장 완료'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
