import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Trash2, X, Search, Edit2, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const DAYS = [
  { id: 1, label: '월' },
  { id: 2, label: '화' },
  { id: 3, label: '수' },
  { id: 4, label: '목' },
  { id: 5, label: '금' },
];

const PERIODS = [
  { id: 1, label: "1교시", time: "08:40-09:30" },
  { id: 2, label: "2교시", time: "09:40-10:30" },
  { id: 3, label: "3교시", time: "10:40-11:30" },
  { id: 4, label: "4교시", time: "11:40-12:30" },
  // 점심시간은 12:30 - 13:20에 렌더링 시점에 삽입됩니다.
  { id: 5, label: "5교시", time: "13:20-14:10" },
  { id: 6, label: "6교시", time: "14:20-15:10" },
  { id: 7, label: "7교시", time: "15:20-16:10" },
  { id: 8, label: "8교시", time: "16:20-17:10" },
  { id: 9, label: "9교시", time: "17:20-18:10" }
];

// Elegant gradient palettes for subjects
const PALETTES = [
  { bg: 'linear-gradient(135deg, #f43f5e, #be123c)', border: '#be123c', text: '#ffffff' }, // Rose/Crimson
  { bg: 'linear-gradient(135deg, #0ea5e9, #0369a1)', border: '#0369a1', text: '#ffffff' }, // Sky Blue
  { bg: 'linear-gradient(135deg, #10b981, #047857)', border: '#047857', text: '#ffffff' }, // Emerald
  { bg: 'linear-gradient(135deg, #8b5cf6, #5b21b6)', border: '#5b21b6', text: '#ffffff' }, // Violet
  { bg: 'linear-gradient(135deg, #f59e0b, #b45309)', border: '#b45309', text: '#ffffff' }, // Amber
  { bg: 'linear-gradient(135deg, #ec4899, #be185d)', border: '#be185d', text: '#ffffff' }, // Pink
  { bg: 'linear-gradient(135deg, #14b8a6, #0f766e)', border: '#0f766e', text: '#ffffff' }, // Teal
  { bg: 'linear-gradient(135deg, #6366f1, #3730a3)', border: '#3730a3', text: '#ffffff' }, // Indigo
  { bg: 'linear-gradient(135deg, #84cc16, #4d7c0f)', border: '#4d7c0f', text: '#ffffff' }, // Lime/Green
  { bg: 'linear-gradient(135deg, #a855f7, #6b21a8)', border: '#6b21a8', text: '#ffffff' }, // Purple
];

const getSubjectColor = (subject) => {
  if (!subject) return { bg: '#f8fafc', border: '#cbd5e1', text: '#64748b' };
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
};

const getDayName = (id) => DAYS.find(d => d.id === id)?.label || '';

export default function Timetable() {
  const { token } = useAuth();
  const [userTimetable, setUserTimetable] = useState([]);
  const [masterTimetable, setMasterTimetable] = useState([]);
  
  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Modal control states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null); // { day, period }
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom manual input state
  const [customSubject, setCustomSubject] = useState('');
  const [customTeacher, setCustomTeacher] = useState('');
  const [customRoom, setCustomRoom] = useState('');

  // Fetch functions
  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch user timetable
      const userRes = await fetch(`${API}/mypage/timetable`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let userData = [];
      if (userRes.ok) {
        userData = await userRes.json();
        setUserTimetable(userData);
      }

      // 2. Fetch school master timetable
      const masterRes = await fetch(`${API}/rooms/timetables`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (masterRes.ok) {
        const masterData = await masterRes.json();
        setMasterTimetable(masterData);
      }
    } catch (err) {
      console.error('Failed to fetch timetable data', err);
      showNotification('error', '시간표 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showNotification = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif({ type: '', text: '' }), 4000);
  };

  // Helper to find class in user timetable
  const findUserClass = (day, period) => {
    return userTimetable.find(item => item.day_of_week === day && item.period === period);
  };

  // Save changes to server
  const saveTimetableToServer = async (newTimetable) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/mypage/timetable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ timetable: newTimetable })
      });

      if (res.ok) {
        setUserTimetable(newTimetable);
        showNotification('success', '시간표가 성공적으로 저장되었습니다! ✨');
      } else {
        const errData = await res.json();
        showNotification('error', errData.message || '시간표 저장에 실패했습니다.');
      }
    } catch (err) {
      showNotification('error', '서버와의 통신에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open modal for a cell
  const handleCellClick = (day, period) => {
    const existing = findUserClass(day, period);
    setSelectedCell({ day, period });
    setSearchQuery('');
    
    if (existing) {
      // Decompose subject into subject and class name if it contains '/'
      let subjName = existing.subject;
      let teacherName = '';
      
      // Look up in master timetable if possible to get teacher info
      const matchingMaster = masterTimetable.find(m => 
        m.day_of_week === day && 
        m.period === period && 
        m.subject === existing.subject && 
        m.room_name === existing.room_name
      );
      
      if (matchingMaster) {
        teacherName = matchingMaster.teacher_name;
      }
      
      setCustomSubject(subjName);
      setCustomTeacher(teacherName);
      setCustomRoom(existing.room_name || '');
    } else {
      setCustomSubject('');
      setCustomTeacher('');
      setCustomRoom('');
    }
    
    setModalOpen(true);
  };

  // Delete a class slot
  const handleDeleteSlot = () => {
    if (!selectedCell) return;
    const { day, period } = selectedCell;
    const updated = userTimetable.filter(item => !(item.day_of_week === day && item.period === period));
    saveTimetableToServer(updated);
    setModalOpen(false);
  };

  // Save manual custom course
  const handleSaveCustom = (e) => {
    e.preventDefault();
    if (!customSubject.trim()) {
      showNotification('error', '과목명을 입력해 주세요.');
      return;
    }
    
    const { day, period } = selectedCell;
    const cleanSubject = customSubject.trim();
    const cleanRoom = customRoom.trim();
    
    // Check if slot already exists, filter it out
    const baseList = userTimetable.filter(item => !(item.day_of_week === day && item.period === period));
    
    const newItem = {
      day_of_week: day,
      period: period,
      subject: cleanSubject,
      room_name: cleanRoom || null
    };
    
    const updated = [...baseList, newItem];
    saveTimetableToServer(updated);
    setModalOpen(false);
  };

  // Auto select a master course and register immediately
  const handleSelectMasterCourse = (masterCourse) => {
    const { day, period } = selectedCell;
    const baseList = userTimetable.filter(item => !(item.day_of_week === day && item.period === period));
    
    // Subject string combination as in the DB or reference image: e.g. "선형대수학 / 3반"
    const displaySubject = masterCourse.subject;
    
    const newItem = {
      day_of_week: day,
      period: period,
      subject: displaySubject,
      room_name: masterCourse.room_name || null
    };

    const updated = [...baseList, newItem];
    saveTimetableToServer(updated);
    setModalOpen(false);
  };

  // Filter master timetable for selection
  const getFilteredMasterCourses = () => {
    if (!selectedCell) return [];
    const { day, period } = selectedCell;
    
    // 1. Filter by current day and period
    let courses = masterTimetable.filter(item => item.day_of_week === day && item.period === period);
    
    // 2. Filter by search query if any
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      courses = courses.filter(item => 
        item.subject?.toLowerCase().includes(q) || 
        item.teacher_name?.toLowerCase().includes(q) || 
        item.room_name?.toLowerCase().includes(q)
      );
    }
    
    return courses;
  };

  const filteredMasterList = getFilteredMasterCourses();

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Styles Injection */}
      <style>{`
        /* Premium Responsive Timetable Grid Styles */
        .timetable-container {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          overflow: hidden;
          margin-bottom: 2rem;
          position: relative;
        }

        .timetable-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .timetable-table {
          width: 100%;
          min-width: 720px; /* Ensures desktop grid structure is legible on mobile horizontal scroll */
          border-collapse: separate;
          border-spacing: 6px;
          table-layout: fixed;
        }

        .timetable-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 12px 6px;
          text-align: center;
          border-radius: 8px;
        }

        .timetable-table th.time-column-header {
          width: 90px;
          background: transparent;
          font-weight: 500;
          color: #94a3b8;
        }

        .time-cell {
          text-align: center;
          background: #f8fafc;
          border-radius: 8px;
          padding: 10px 4px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 90px;
        }

        .time-cell .period-number {
          font-size: 1.25rem;
          font-weight: 800;
          color: #334155;
          margin-bottom: 2px;
        }

        .time-cell .period-time {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Lunch Row Spacing */
        .lunch-row-container {
          background: #f1f5f9;
          border-radius: 8px;
          text-align: center;
          vertical-align: middle;
          font-weight: 700;
          color: #475569;
          font-size: 0.9rem;
          letter-spacing: 0.1em;
          height: 48px;
          transition: background-color 0.2s;
        }

        .lunch-time-text {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
          margin-left: 8px;
          letter-spacing: 0;
        }

        /* Interactive Grid Cell */
        .cell-interactive {
          height: 90px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 8px;
          border: 1px dashed #e2e8f0;
          background: #fafafa;
        }

        .cell-interactive:hover {
          border-color: var(--primary);
          background: #f0f7ff;
          transform: translateY(-1px);
        }

        .cell-empty-btn {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #cbd5e1;
          transition: color 0.2s;
        }

        .cell-interactive:hover .cell-empty-btn {
          color: var(--primary);
        }

        /* Filled Class Block */
        .class-block {
          position: absolute;
          inset: 0;
          padding: 8px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .class-block:hover {
          filter: brightness(0.96);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }

        .class-subject {
          font-size: 0.85rem;
          font-weight: 800;
          line-height: 1.25;
          margin-bottom: 2px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .class-meta-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .class-teacher {
          font-size: 0.72rem;
          font-weight: 500;
          opacity: 0.85;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .class-room {
          font-size: 0.72rem;
          font-weight: 700;
          opacity: 0.95;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Modal Overlay & Card styling */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          animation: modalFadeIn 0.2s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-card {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalSlideUp {
          from { transform: translateY(12px) scale(0.98); }
          to { transform: translateY(0) scale(1); }
        }

        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .modal-section-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Master timetables list */
        .master-item-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 180px;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 6px;
          background: #f8fafc;
        }

        .master-item-btn {
          width: 100%;
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .master-item-btn:hover {
          border-color: var(--primary);
          background: #f0f7ff;
          transform: translateX(2px);
        }

        .master-item-subject {
          font-weight: 700;
          color: #1e293b;
          font-size: 0.85rem;
        }

        .master-item-teacher {
          font-size: 0.78rem;
          color: #64748b;
          margin-left: 6px;
        }

        .master-item-room {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--primary);
          background: #eff6ff;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .manual-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-full-width {
          grid-column: span 2;
        }

        .custom-input-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          color: #475569;
          margin-bottom: 4px;
        }

        .custom-textbox {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          outline: none;
          font-size: 0.88rem;
          transition: border-color 0.2s;
        }

        .custom-textbox:focus {
          border-color: var(--primary);
        }
      `}</style>

      {/* Global Notifications popup */}
      {notif.text && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 2000,
          padding: '0.85rem 1.5rem', borderRadius: '12px',
          background: notif.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${notif.type === 'success' ? '#22c55e' : '#ef4444'}`,
          color: notif.type === 'success' ? '#14532d' : '#7f1d1d',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'slideIn 0.3s ease-out',
        }}>
          {notif.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {notif.text}
        </div>
      )}

      {/* Header section */}
      <div className="timetable-header-row">
        <div>
          <h1 className="title" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={28} color="var(--primary)" /> 내 시간표 설계
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            요일과 교시 빈 칸을 터치해 수업을 구성해 보세요. 과목별로 색상이 자동 지정됩니다.
          </p>
        </div>
        
        {/* Sync loading or status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="btn" 
            style={{ 
              background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', 
              padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            새로고침
          </button>
        </div>
      </div>

      {/* Timetable Grid Container */}
      <div className="timetable-container">
        {loading && userTimetable.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '360px', gap: '12px' }}>
            <RefreshCw size={36} color="var(--primary)" className="spin-anim" />
            <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>데이터 로드 중...</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ padding: '8px' }}>
            <table className="timetable-table">
              <thead>
                <tr>
                  <th className="time-column-header">교시</th>
                  {DAYS.map(day => (
                    <th key={day.id}>{day.label}요일</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 1교시 ~ 4교시 */}
                {PERIODS.slice(0, 4).map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="time-cell">
                        <span className="period-number">{p.id}</span>
                        <span className="period-time">{p.time}</span>
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const classItem = findUserClass(day.id, p.id);
                      const color = getSubjectColor(classItem?.subject);
                      return (
                        <td key={`${day.id}-${p.id}`}>
                          <div className="cell-interactive" onClick={() => handleCellClick(day.id, p.id)}>
                            {classItem ? (
                              <div className="class-block" style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}>
                                <span className="class-subject">{classItem.subject}</span>
                                <div className="class-meta-info">
                                  <span className="class-teacher">
                                    {masterTimetable.find(m => m.day_of_week === day.id && m.period === p.id && m.subject === classItem.subject)?.teacher_name || ''}
                                  </span>
                                  <span className="class-room">{classItem.room_name || ''}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="cell-empty-btn">
                                <Plus size={18} />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* 점심시간 행 병합 */}
                <tr>
                  <td>
                    <div className="time-cell" style={{ height: '48px', padding: '0px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b' }}>점심</span>
                    </div>
                  </td>
                  <td colSpan={5}>
                    <div className="lunch-row-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      🍽️ 점심시간 <span className="lunch-time-text">12:30 ~ 13:20</span>
                    </div>
                  </td>
                </tr>

                {/* 5교시 ~ 9교시 */}
                {PERIODS.slice(4).map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="time-cell">
                        <span className="period-number">{p.id}</span>
                        <span className="period-time">{p.time}</span>
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const classItem = findUserClass(day.id, p.id);
                      const color = getSubjectColor(classItem?.subject);
                      return (
                        <td key={`${day.id}-${p.id}`}>
                          <div className="cell-interactive" onClick={() => handleCellClick(day.id, p.id)}>
                            {classItem ? (
                              <div className="class-block" style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}>
                                <span className="class-subject">{classItem.subject}</span>
                                <div className="class-meta-info">
                                  <span className="class-teacher">
                                    {masterTimetable.find(m => m.day_of_week === day.id && m.period === p.id && m.subject === classItem.subject)?.teacher_name || ''}
                                  </span>
                                  <span className="class-room">{classItem.room_name || ''}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="cell-empty-btn">
                                <Plus size={18} />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Course Edit/Add Modal Overlay */}
      {modalOpen && selectedCell && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge bg-blue" style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem' }}>
                  {getDayName(selectedCell.day)}요일 {selectedCell.period}교시
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e293b' }}>수업 추가/수정</h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#334155'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              
              {/* Option A: Quick Search from Master Timetable */}
              <div>
                <span className="modal-section-title">
                  <Search size={14} /> 학교 수업에서 선택하기
                </span>
                
                {/* Search query input */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="과목, 교사, 교실 이름 검색..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 10px 6px 30px', border: '1.5px solid #cbd5e1', 
                      borderRadius: '8px', fontSize: '0.82rem', outline: 'none'
                    }}
                  />
                </div>

                {/* Master suggestions grid/list */}
                {filteredMasterList.length > 0 ? (
                  <div className="master-item-list">
                    {filteredMasterList.map(master => (
                      <button 
                        key={master.id} 
                        className="master-item-btn"
                        onClick={() => handleSelectMasterCourse(master)}
                      >
                        <div>
                          <span className="master-item-subject">{master.subject}</span>
                          {master.teacher_name && (
                            <span className="master-item-teacher">({master.teacher_name} 선생님)</span>
                          )}
                        </div>
                        {master.room_name && (
                          <span className="master-item-room">{master.room_name}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '20px', border: '1px dashed #cbd5e1', borderRadius: '10px', 
                    background: '#f8fafc', textalign: 'center', color: '#94a3b8', fontSize: '0.78rem',
                    textAlign: 'center'
                  }}>
                    {searchQuery.trim() 
                      ? '검색 결과와 일치하는 개설 수업이 없습니다. 🔍' 
                      : '이 시간대에 개설된 정규 수업이 없습니다. 아래 수동 입력을 이용하세요.'
                    }
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #f1f5f9' }} />

              {/* Option B: Manual Input form */}
              <form onSubmit={handleSaveCustom}>
                <span className="modal-section-title">
                  <Edit2 size={14} /> 직접 정보 입력하기
                </span>
                
                <div className="manual-form-grid">
                  
                  {/* Subject Name */}
                  <div className="form-full-width">
                    <label className="custom-input-label">과목명 *</label>
                    <input 
                      type="text" 
                      className="custom-textbox" 
                      placeholder="예: 고급 알고리즘 / 창체"
                      value={customSubject}
                      onChange={e => setCustomSubject(e.target.value)}
                      required
                    />
                  </div>

                  {/* Teacher Name */}
                  <div>
                    <label className="custom-input-label">교사명 (선택)</label>
                    <input 
                      type="text" 
                      className="custom-textbox" 
                      placeholder="예: 김정화"
                      value={customTeacher}
                      onChange={e => setCustomTeacher(e.target.value)}
                    />
                  </div>

                  {/* Room Name */}
                  <div>
                    <label className="custom-input-label">교실 (선택)</label>
                    <input 
                      type="text" 
                      className="custom-textbox" 
                      placeholder="예: A401"
                      value={customRoom}
                      onChange={e => setCustomRoom(e.target.value)}
                    />
                  </div>

                </div>

                {/* Bottom action row inside form */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  
                  {/* If editing existing, show delete */}
                  {findUserClass(selectedCell.day, selectedCell.period) && (
                    <button 
                      type="button"
                      onClick={handleDeleteSlot}
                      style={{
                        marginRight: 'auto', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
                        padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Trash2 size={14} /> 삭제
                    </button>
                  )}

                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)}
                    style={{
                      background: 'white', color: '#64748b', border: '1px solid #cbd5e1',
                      padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    취소
                  </button>

                  <button 
                    type="submit" 
                    disabled={isSaving}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none',
                      padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {isSaving ? '저장 중...' : '저장 완료'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
