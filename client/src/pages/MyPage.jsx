import { useState } from 'react';
import { Calendar, Bell, Edit3, LogOut, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MyPage() {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    grade: user?.grade || '',
    classNum: user?.classNum || '',
    studentId: user?.studentId || '',
    bio: user?.bio || '',
  });
  const [saveMsg, setSaveMsg] = useState('');

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

      <div className="grid">
        {/* Profile Card */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 64, height: 64, minWidth: 64,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              borderRadius: '50%',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              color: 'white', fontSize: '1.6rem', fontWeight: 'bold',
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
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.2rem' }}>
                    {user?.name || '이름 없음'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {user?.email}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    {user?.grade && `${user.grade}학년 ${user.classNum}반 ${user.studentId}번`}
                  </p>
                  {user?.bio && (
                    <p style={{ color: '#475569', fontSize: '0.9rem', fontStyle: 'italic' }}>
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
                    <Edit3 size={16} /> 수정
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

        {/* 시간표 */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="var(--primary)" /> 내 시간표
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            이번 주 나의 특별활동 및 수업 시간표를 관리하세요.
          </p>
          <button className="btn" style={{ width: '100%' }}>시간표 조회/수정</button>
        </div>

        {/* 알림 설정 */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="var(--primary)" /> 알림 설정
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            수업 시작 전 알림을 받을 시간을 설정합니다.
          </p>
          <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <option>수업 5분 전</option>
            <option>수업 10분 전</option>
            <option>수업 30분 전</option>
          </select>
          <button className="btn" style={{ width: '100%' }}>저장 완료</button>
        </div>
      </div>
    </div>
  );
}
