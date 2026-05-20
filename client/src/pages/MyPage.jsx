import { useState, useEffect } from 'react';
import { Calendar, Bell, Edit3, LogOut, Save, X, MapPin, Trash2, Clock, Check, Users, UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

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
  { id: 5, label: "5교시", time: "13:20-14:10" },
  { id: 6, label: "6교시", time: "14:20-15:10" },
  { id: 7, label: "7교시", time: "15:20-16:10" },
  { id: 8, label: "8교시", time: "16:20-17:10" },
  { id: 9, label: "9교시", time: "17:20-18:10" }
];

const getDefaultDay = () => {
  const day = new Date().getDay();
  if (day >= 1 && day <= 5) return day;
  return 1;
};

const getCurrentPeriod = () => {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  for (const p of PERIODS) {
    const [startStr, endStr] = p.time.split(/[-–]/);
    const [sh, sm] = startStr.trim().split(':').map(Number);
    const [eh, em] = endStr.trim().split(':').map(Number);
    if (currentMins >= sh * 60 + sm && currentMins <= eh * 60 + em) {
      return p.id;
    }
  }
  return 1;
};

const getDayName = (id) => {
  return DAYS.find(d => d.id === id)?.label || '';
};

export default function MyPage() {
  const { user, token, logout, updateProfile } = useAuth();
  const showNotification = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    grade: user?.grade || '',
    classNum: user?.classNum || '',
    studentId: user?.studentId || '',
    bio: user?.bio || '',
  });
  const [saveMsg, setSaveMsg] = useState('');

  // Location occupancy states
  const [occupancies, setOccupancies] = useState([]);
  const [selectedDay, setSelectedDay] = useState(getDefaultDay());
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Friends states
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [friendLoading, setFriendLoading] = useState(false);

  // Fetch my occupancies
  const fetchMyOccupancies = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/mypage/occupancy`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOccupancies(data);
      }
    } catch (err) {
      console.error('Failed to fetch occupancies', err);
    }
  };

  // Fetch available empty rooms for the selected time
  const fetchAvailableRooms = async (day, period) => {
    if (!token) return;
    setLoadingAvailable(true);
    try {
      const res = await fetch(`${API}/rooms/available?day_of_week=${day}&period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableRooms(data);
        if (data.length > 0) {
          setSelectedRoomId(data[0].id);
        } else {
          setSelectedRoomId('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch available rooms', err);
    } finally {
      setLoadingAvailable(false);
    }
  };

  useEffect(() => {
    fetchMyOccupancies();
    fetchFriends();
    fetchFriendRequests();
  }, [token]);

  const fetchFriends = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/friends`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) { console.error('Failed to fetch friends', err); }
  };

  const fetchFriendRequests = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/friends/requests`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setFriendRequests(data);
      }
    } catch (err) { console.error('Failed to fetch friend requests', err); }
  };

  const handleRequestFriend = async () => {
    if (!friendEmail.trim()) { showNotification('error', '이메일을 입력해주세요.'); return; }
    setFriendLoading(true);
    try {
      const res = await fetch(`${API}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: friendEmail.trim() })
      });
      const data = await res.json();
      if (res.ok) { showNotification('success', data.message); setFriendEmail(''); }
      else { showNotification('error', data.message); }
    } catch (err) { showNotification('error', '친구 신청 중 오류 발생'); }
    finally { setFriendLoading(false); }
  };

  const handleAcceptFriend = async (id) => {
    try {
      const res = await fetch(`${API}/friends/accept/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) { showNotification('success', data.message); fetchFriends(); fetchFriendRequests(); }
      else { showNotification('error', data.message); }
    } catch (err) { showNotification('error', '요청 수락 중 오류 발생'); }
  };

  const handleDeleteFriend = async (id) => {
    if (!window.confirm('정말로 삭제/거절하시겠습니까?')) return;
    try {
      const res = await fetch(`${API}/friends/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) { showNotification('success', data.message); fetchFriends(); fetchFriendRequests(); }
      else { showNotification('error', data.message); }
    } catch (err) { showNotification('error', '삭제 중 오류 발생'); }
  };

  useEffect(() => {
    fetchAvailableRooms(selectedDay, selectedPeriod);
  }, [selectedDay, selectedPeriod, token]);

  const handleEdit = () => {
    setForm({
      name: user?.name || '',
      grade: user?.grade || '',
      classNum: user?.classNum || '',
      studentId: user?.studentId || '',
      bio: user?.bio || '',
    });
    setIsEditing(true);
    setSaveMsg('');
  };

  const handleSave = () => {
    updateProfile(form);
    setIsEditing(false);
    setSaveMsg('저장되었습니다! ✅');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveMsg('');
  };

  // Occupy a room
  const handleRegisterOccupancy = async () => {
    if (!selectedRoomId) {
      showNotification('error', '교실을 선택해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/mypage/occupancy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: selectedRoomId,
          day_of_week: selectedDay,
          period: selectedPeriod
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message);
        fetchMyOccupancies();
        fetchAvailableRooms(selectedDay, selectedPeriod);
      } else {
        showNotification('error', data.message);
      }
    } catch (err) {
      showNotification('error', '위치 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel my occupancy
  const handleCancelOccupancy = async (id) => {
    if (!window.confirm('위치 정보를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API}/mypage/occupancy/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message);
        fetchMyOccupancies();
        fetchAvailableRooms(selectedDay, selectedPeriod);
      } else {
        showNotification('error', data.message);
      }
    } catch (err) {
      showNotification('error', '위치 해제 중 오류가 발생했습니다.');
    }
  };


  const isCurrentTime = (day, period) => {
    const now = new Date();
    const currentDay = now.getDay();
    if (currentDay !== day) return false;

    const currentMins = now.getHours() * 60 + now.getMinutes();
    const p = PERIODS.find(x => x.id === period);
    if (!p) return false;

    const [startStr, endStr] = p.time.split(/[-–]/);
    const [sh, sm] = startStr.trim().split(':').map(Number);
    const [eh, em] = endStr.trim().split(':').map(Number);
    return (currentMins >= sh * 60 + sm && currentMins <= eh * 60 + em);
  };

  const isCurrent = isCurrentTime(selectedDay, selectedPeriod);

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.95rem',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '0.3rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div>
      <h1 className="title">👤 마이페이지</h1>

      <div className="grid" style={{ gap: '1.5rem' }}>
        {/* Profile Card */}
        <div className="card" style={{ gridColumn: '1 / -1', borderLeft: '5px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, minWidth: 72,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              borderRadius: '50%',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              color: 'white', fontSize: '1.8rem', fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(37,99,235,0.2)',
            }}>
              {user?.name?.charAt(0) || '?'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '160px' }}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div>
                    <label style={labelStyle}>이름</label>
                    <input style={inputStyle} value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={labelStyle}>학년</label>
                      <input style={inputStyle} value={form.grade} placeholder="1"
                        onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>반</label>
                      <input style={inputStyle} value={form.classNum} placeholder="3"
                        onChange={e => setForm(f => ({ ...f, classNum: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>번호</label>
                      <input style={inputStyle} value={form.studentId} placeholder="12"
                        onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>한 마디</label>
                    <textarea
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                      value={form.bio}
                      onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.2rem', color: '#1e293b' }}>
                    {user?.name || '이름 없음'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {user?.email}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    {user?.grade ? `${user.grade}학년 ${user.classNum}반 ${user.studentId}번` : '정보 등록 필요'}
                  </p>
                  {user?.bio && (
                    <p style={{
                      color: '#475569', fontSize: '0.9rem', fontStyle: 'italic',
                      background: '#f8fafc', padding: '0.5rem 0.8rem', borderRadius: '8px',
                      display: 'inline-block', borderLeft: '3px solid #cbd5e1'
                    }}>
                      "{user.bio}"
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start', flexWrap: 'wrap' }}>
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem' }}>
                    <Save size={16} /> 저장
                  </button>
                  <button onClick={handleCancel}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                      background: 'white', cursor: 'pointer', fontWeight: '600', color: '#64748b'
                    }}>
                    <X size={16} /> 취소
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleEdit}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                      background: 'white', cursor: 'pointer', fontWeight: '600', color: '#475569'
                    }}>
                    <Edit3 size={16} /> 프로필 수정
                  </button>
                  <button onClick={logout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #fecaca',
                      background: '#fff7f7', cursor: 'pointer', fontWeight: '600', color: '#ef4444'
                    }}>
                    <LogOut size={16} /> 로그아웃
                  </button>
                </>
              )}
            </div>
          </div>

          {saveMsg && (
            <div style={{
              marginTop: '0.75rem', padding: '0.6rem 1rem', borderRadius: '8px',
              background: '#dcfce7', color: '#166534', fontSize: '0.9rem', fontWeight: '600'
            }}>
              {saveMsg}
            </div>
          )}
        </div>

        {/* 내 위치 등록 카드 (Compact Grid Card) */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Decorative background blur shape */}
          <div style={{
            position: 'absolute', top: '-100px', right: '-100px', width: '200px', height: '200px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0) 70%)',
            borderRadius: '50%', pointerEvents: 'none'
          }} />

          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}>
            <MapPin size={18} color="var(--primary)" /> 📍 내 위치 등록
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4' }}>
            공강 시간에 머무는 교실을 등록하여 친구들과 실시간 위치를 공유해보세요.
          </p>

          {/* 등록 폼 */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem'
          }}>
            {/* 요일 & 교시 선택 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ ...labelStyle, fontSize: '0.75rem', marginBottom: '0.2rem' }}>요일</label>
                <select
                  value={selectedDay}
                  onChange={e => setSelectedDay(parseInt(e.target.value, 10))}
                  style={{
                    ...inputStyle, background: 'white', cursor: 'pointer', fontWeight: '600', color: '#1e293b',
                    border: '1px solid #cbd5e1', padding: '0.4rem 0.6rem', fontSize: '0.875rem'
                  }}
                >
                  {DAYS.map(day => (
                    <option key={day.id} value={day.id}>{day.label}요일</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ ...labelStyle, fontSize: '0.75rem', marginBottom: '0.2rem' }}>교시</label>
                <select
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(parseInt(e.target.value, 10))}
                  style={{
                    ...inputStyle, background: 'white', cursor: 'pointer', fontWeight: '600', color: '#1e293b',
                    border: '1px solid #cbd5e1', padding: '0.4rem 0.6rem', fontSize: '0.875rem'
                  }}
                >
                  {PERIODS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 교실 선택 */}
            <div>
              <label style={{ ...labelStyle, fontSize: '0.75rem', marginBottom: '0.2rem' }}>머무는 교실</label>
              <select
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                disabled={loadingAvailable || availableRooms.length === 0}
                style={{
                  ...inputStyle, background: 'white', cursor: availableRooms.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: '700', color: '#1e293b', border: '1px solid #cbd5e1',
                  padding: '0.4rem 0.6rem', fontSize: '0.875rem'
                }}
              >
                {loadingAvailable ? (
                  <option>조회 중...</option>
                ) : availableRooms.length > 0 ? (
                  availableRooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.floor}층)
                    </option>
                  ))
                ) : (
                  <option>비어있는 교실 없음 ❌</option>
                )}
              </select>
            </div>

            {/* 등록 버튼 */}
            <button
              onClick={handleRegisterOccupancy}
              disabled={submitting || !selectedRoomId}
              style={{
                width: '100%', padding: '0.55rem', borderRadius: '8px', border: 'none',
                background: !selectedRoomId
                  ? '#cbd5e1'
                  : isCurrent
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white', fontWeight: '700', fontSize: '0.9rem', cursor: !selectedRoomId ? 'not-allowed' : 'pointer',
                boxShadow: selectedRoomId ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                transition: 'transform 0.1s ease, filter 0.2s ease',
              }}
              onMouseDown={e => { if (selectedRoomId) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { if (selectedRoomId) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {submitting ? (
                '등록 중...'
              ) : isCurrent ? (
                <>📍 나 지금 여기에 있어요 (등록)</>
              ) : (
                <>📅 나 이때 여기에 있을게요 (예약)</>
              )}
            </button>
          </div>

          {/* 내 위치 등록 내역 */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> 내 위치 등록 내역 ({occupancies.length})
            </h3>
            {occupancies.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {occupancies.map(occ => {
                  const occIsCurrent = isCurrentTime(occ.day_of_week, occ.period);
                  return (
                    <div
                      key={occ.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#f8fafc',
                        border: `1px solid ${occIsCurrent ? '#fca5a5' : '#e2e8f0'}`,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {/* Status Badge */}
                        <span style={{
                          padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700',
                          background: occIsCurrent ? '#fee2e2' : '#dbeafe',
                          color: occIsCurrent ? '#dc2626' : '#1e40af',
                        }}>
                          {occIsCurrent ? '현재' : '예약'}
                        </span>
                        <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.85rem' }}>
                          {occ.room_name} ({occ.floor}층)
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          {getDayName(occ.day_of_week)}요일 {occ.period}교시
                        </span>
                      </div>
                      <button
                        onClick={() => handleCancelOccupancy(occ.id)}
                        style={{
                          background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
                          padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: '1.25rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc',
                border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', lineHeight: '1.4'
              }}>
                등록된 위치 정보가 없습니다.<br />
                위 폼에서 내 위치를 등록해 보세요! 🚀
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

