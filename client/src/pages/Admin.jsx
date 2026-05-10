import { useState, useEffect, useCallback } from 'react';
import { Users, Database, Search, Shield, ShieldOff, RefreshCw } from 'lucide-react';
import TimetableManager from '../components/TimetableManager';
import RoomManager from '../components/RoomManager';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ─── Mock fallback (DB 연결 안 됐을 때) ────────────────────────
const MOCK_USERS = [
  { id: 1, email: 'woolrabit77@sasa.hs.kr', name: '관리자', role: 'ADMIN',  created_at: '2025-01-01' },
  { id: 2, email: 'student1@sasa.hs.kr',    name: '김학생', role: 'USER',   created_at: '2025-03-10' },
  { id: 3, email: 'student2@sasa.hs.kr',    name: '이학생', role: 'USER',   created_at: '2025-03-11' },
  { id: 4, email: 'teacher1@sasa.hs.kr',    name: '박선생', role: 'USER',   created_at: '2025-02-01' },
];

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('USERS');
  const [users, setUsers]       = useState([]);
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [toast, setToast]       = useState('');
  const [updating, setUpdating] = useState(null); // id of user being updated

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Fetch users from backend (fall back to mock) ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setUsers(data);
      setUsingMock(false);
    } catch {
      setUsers(MOCK_USERS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Toggle role ──
  const toggleRole = async (u) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setUpdating(u.id);
    try {
      if (!usingMock) {
        const res = await fetch(`${API}/admin/users/${u.id}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ role: newRole }),
        });
        if (!res.ok) throw new Error();
      }
      setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, role: newRole } : usr));
      showToast(`${u.name || u.email}의 권한을 ${newRole}로 변경했습니다.`);
    } catch {
      showToast('❌ 권한 변경에 실패했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  // ── Filter by query ──
  const filtered = users.filter(u => {
    const q = query.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="title" style={{ color: '#991b1b', marginBottom: '1.2rem' }}>🛡️ 관리자 페이지</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('USERS')}
          className="btn" 
          style={{ background: activeTab === 'USERS' ? 'var(--primary)' : '#e2e8f0', color: activeTab === 'USERS' ? 'white' : 'var(--text-main)', whiteSpace: 'nowrap' }}>
          유저 관리
        </button>
        <button 
          onClick={() => setActiveTab('TIMETABLES')}
          className="btn" 
          style={{ background: activeTab === 'TIMETABLES' ? 'var(--primary)' : '#e2e8f0', color: activeTab === 'TIMETABLES' ? 'white' : 'var(--text-main)', whiteSpace: 'nowrap' }}>
          수업 데이터 관리
        </button>
        <button 
          onClick={() => setActiveTab('ROOMS')}
          className="btn" 
          style={{ background: activeTab === 'ROOMS' ? 'var(--primary)' : '#e2e8f0', color: activeTab === 'ROOMS' ? 'white' : 'var(--text-main)', whiteSpace: 'nowrap' }}>
          교실 상태 관리
        </button>
      </div>

      {/* Toast */}
      {toast && <div className="toast-popup">{toast}</div>}

      {/* ── 유저 정보 관리 ── */}
      {activeTab === 'USERS' && (
        <>
          {usingMock && (
            <div style={{
              marginBottom: '1rem', padding: '0.6rem 1rem', borderRadius: '8px',
              background: '#fef9c3', color: '#713f12', fontSize: '0.85rem',
              border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              ⚠️ DB 연결 없이 임시 데이터를 표시 중입니다. 권한 변경은 로컬에서만 반영됩니다.
            </div>
          )}

          <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--primary)" /> 유저 정보 관리
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({filtered.length}명)
            </span>
          </h2>
          <button onClick={fetchUsers}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> 새로고침
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="이름 또는 이메일로 검색..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.65rem 0.9rem 0.65rem 2.3rem',
              borderRadius: '8px', border: '1.5px solid #e2e8f0',
              fontSize: '0.9rem', outline: 'none',
            }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>불러오는 중...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: '#64748b' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>이름</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>이메일</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>권한</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>변경</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: '600' }}>
                      {u.name || '—'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#475569', fontSize: '0.85rem' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span className={`badge ${u.role === 'ADMIN' ? 'bg-red' : 'bg-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleRole(u)}
                        disabled={updating === u.id || (currentUser && (currentUser.id === u.id || currentUser.email === u.email))}
                        title={(currentUser && (currentUser.id === u.id || currentUser.email === u.email)) ? '자신의 권한은 해제할 수 없습니다' : (u.role === 'ADMIN' ? '일반 유저로 변경' : '관리자로 승격')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '0.35rem 0.75rem', borderRadius: '7px',
                          border: '1px solid',
                          borderColor: u.role === 'ADMIN' ? '#fecaca' : '#bfdbfe',
                          background: u.role === 'ADMIN' ? '#fff7f7' : '#eff6ff',
                          color: u.role === 'ADMIN' ? '#dc2626' : '#2563eb',
                          cursor: (updating === u.id || (currentUser && (currentUser.id === u.id || currentUser.email === u.email))) ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem', fontWeight: '600',
                          opacity: (updating === u.id || (currentUser && (currentUser.id === u.id || currentUser.email === u.email))) ? 0.6 : 1,
                        }}
                      >
                        {u.role === 'ADMIN'
                          ? <><ShieldOff size={13} /> 권한 해제</>
                          : <><Shield size={13} /> 관리자 지정</>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </div>
        </>
      )}

      {/* ── 수업 데이터 관리 ── */}
      {activeTab === 'TIMETABLES' && <TimetableManager />}

      {/* ── 교실 상태 관리 ── */}
      {activeTab === 'ROOMS' && <RoomManager />}
    </div>
  );
}
