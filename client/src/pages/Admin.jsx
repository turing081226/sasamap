import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, Shield, ShieldOff, Users } from 'lucide-react';
import TimetableManager from '../components/TimetableManager';
import RoomManager from '../components/RoomManager';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

const tabs = [
  { id: 'USERS', label: '사용자 관리' },
  { id: 'TIMETABLES', label: '수업 데이터 관리' },
  { id: 'ROOMS', label: '교실 상태 관리' },
];

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

      setUsers((prev) => prev.map((user) => (
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

  const filteredUsers = users.filter((user) => {
    const q = query.toLowerCase();
    return (
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q)
    );
  });

  return (
    <section className="page-shell admin-page">
      <header className="section-head desktop-page-head">
        <div>
          <span className="section-kicker">Admin</span>
          <h1>관리자 페이지</h1>
        </div>
      </header>

      <div className="admin-tabbar" role="tablist" aria-label="관리자 메뉴">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {toast && <div className="toast-popup">{toast}</div>}

      {activeTab === 'USERS' && (
        <div className="card admin-manager-card">
          <div className="admin-manager-head">
            <h2>
              <Users size={20} color="var(--primary)" />
              사용자 정보 관리
              <span>({filteredUsers.length}명)</span>
            </h2>
            <button onClick={fetchUsers} className="button secondary" type="button">
              <RefreshCw size={14} />
              새로고침
            </button>
          </div>

          {error && <div className="admin-error-box">{error}</div>}

          <label className="search-box admin-user-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {loading ? (
            <p className="admin-loading">불러오는 중...</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>권한</th>
                    <th>변경</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="table-empty-cell">
                        표시할 사용자가 없습니다.
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map((user) => {
                    const isSelf = currentUser?.id === user.id || currentUser?.email === user.email;
                    return (
                      <tr key={user.id}>
                        <td>{user.name || '-'}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-chip ${user.role?.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleRole(user)}
                            disabled={updating === user.id || isSelf}
                            title={isSelf ? '본인 권한은 여기서 변경할 수 없습니다.' : '권한 변경'}
                            className="button secondary admin-role-button"
                            type="button"
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
    </section>
  );
}
