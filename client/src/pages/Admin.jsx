import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, Shield, ShieldOff, Users } from 'lucide-react';
import TimetableManager from '../components/TimetableManager';
import RoomManager from '../components/RoomManager';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('USERS');
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [updating, setUpdating] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/admin/users');
      if (!res.ok) throw new Error(`API error (${res.status})`);
      setUsers(await res.json());
    } catch (err) {
      console.error('Failed to fetch admin users', err);
      setUsers([]);
      setError('DB에서 사용자 데이터를 불러오지 못했습니다. 로그인 상태와 관리자 권한을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setUpdating(targetUser.id);

    try {
      const res = await apiFetch(`/admin/users/${targetUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error(`API error (${res.status})`);

      setUsers(prev => prev.map(user => (
        user.id === targetUser.id ? { ...user, role: newRole } : user
      )));
      showToast(`${targetUser.name || targetUser.email} 권한을 ${newRole}로 변경했습니다.`);
    } catch (err) {
      console.error('Failed to update user role', err);
      showToast('권한 변경에 실패했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const q = query.toLowerCase();
    return (
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q)
    );
  });

  const tabStyle = (tab) => ({
    background: activeTab === tab ? 'var(--primary)' : '#e2e8f0',
    color: activeTab === tab ? 'white' : 'var(--text-main)',
    whiteSpace: 'nowrap',
  });

  return (
    <div>
      <h1 className="title" style={{ color: '#991b1b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={28} color="#991b1b" /> 관리자 페이지
      </h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button onClick={() => setActiveTab('USERS')} className="btn" style={tabStyle('USERS')}>
          사용자 관리
        </button>
        <button onClick={() => setActiveTab('TIMETABLES')} className="btn" style={tabStyle('TIMETABLES')}>
          수업 데이터 관리
        </button>
        <button onClick={() => setActiveTab('ROOMS')} className="btn" style={tabStyle('ROOMS')}>
          교실 상태 관리
        </button>
      </div>

      {toast && <div className="toast-popup">{toast}</div>}

      {activeTab === 'USERS' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--primary)" /> 사용자 정보 관리
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({filteredUsers.length}명)
              </span>
            </h2>
            <button
              onClick={fetchUsers}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} /> 새로고침
            </button>
          </div>

          {error && (
            <div style={{ marginBottom: '1rem', padding: '0.6rem 1rem', borderRadius: '8px', background: '#fef2f2', color: '#991b1b', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.9rem 0.65rem 2.3rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

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
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        표시할 사용자가 없습니다.
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map(user => {
                    const isSelf = currentUser?.id === user.id || currentUser?.email === user.email;
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.7rem 0.75rem', fontWeight: 600 }}>{user.name || '-'}</td>
                        <td style={{ padding: '0.7rem 0.75rem', color: '#475569' }}>{user.email}</td>
                        <td style={{ padding: '0.7rem 0.75rem' }}>
                          <span style={{ padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: user.role === 'ADMIN' ? '#fee2e2' : '#e0f2fe', color: user.role === 'ADMIN' ? '#991b1b' : '#075985' }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.7rem 0.75rem', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleRole(user)}
                            disabled={updating === user.id || isSelf}
                            title={isSelf ? '본인 권한은 여기서 변경할 수 없습니다.' : '권한 변경'}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.65rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: isSelf ? '#f8fafc' : 'white', cursor: isSelf ? 'not-allowed' : 'pointer', fontSize: '0.8rem', opacity: updating === user.id ? 0.6 : 1 }}
                          >
                            {user.role === 'ADMIN' ? <ShieldOff size={14} /> : <Shield size={14} />}
                            {user.role === 'ADMIN' ? 'USER로' : 'ADMIN으로'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'TIMETABLES' && <TimetableManager />}
      {activeTab === 'ROOMS' && <RoomManager />}
    </div>
  );
}
