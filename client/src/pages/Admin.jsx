import { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw, Search, Shield, ShieldOff, Table2, Users } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const tabs = [
  { id: 'users', label: '사용자', icon: Users },
  { id: 'rooms', label: '교실', icon: Database },
  { id: 'timetables', label: '수업', icon: Table2 },
];

const statusLabels = {
  EMPTY: '빈 교실',
  IN_USE: '사용 중',
  CLASS: '수업 중',
  NEEDS_APPROVAL: '승인 필요',
  UNAVAILABLE: '사용 불가',
  MAINTENANCE: '점검 중',
};

const dayLabels = ['', '월', '화', '수', '목', '금'];

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, roomRes, timetableRes] = await Promise.all([
        apiFetch('/admin/users'),
        apiFetch('/admin/rooms'),
        apiFetch('/admin/timetables'),
      ]);
      setUsers(userRes.ok ? await userRes.json() : []);
      setRooms(roomRes.ok ? await roomRes.json() : []);
      setTimetables(timetableRes.ok ? await timetableRes.json() : []);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
      setUsers([]);
      setRooms([]);
      setTimetables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const lowerQuery = query.toLowerCase();

  const filteredUsers = useMemo(() => users.filter((item) => (
    item.name?.toLowerCase().includes(lowerQuery) ||
    item.email?.toLowerCase().includes(lowerQuery) ||
    item.role?.toLowerCase().includes(lowerQuery)
  )), [lowerQuery, users]);

  const filteredRooms = useMemo(() => rooms.filter((item) => (
    item.name?.toLowerCase().includes(lowerQuery) ||
    item.type?.toLowerCase().includes(lowerQuery) ||
    item.description?.toLowerCase().includes(lowerQuery) ||
    String(item.floor).includes(lowerQuery)
  )), [lowerQuery, rooms]);

  const filteredTimetables = useMemo(() => timetables.filter((item) => (
    item.subject?.toLowerCase().includes(lowerQuery) ||
    item.teacher_name?.toLowerCase().includes(lowerQuery) ||
    item.room_name?.toLowerCase().includes(lowerQuery)
  )), [lowerQuery, timetables]);

  const toggleRole = async (targetUser) => {
    const role = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const res = await apiFetch(`/admin/users/${targetUser.id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? { ...item, role } : item)));
    }
  };

  const updateRoomStatus = async (roomId, status) => {
    const res = await apiFetch(`/admin/rooms/${roomId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, status } : room)));
    }
  };

  return (
    <section className="page-shell admin-page">
      <header className="section-head desktop-page-head">
        <div>
          <span className="section-kicker">Admin</span>
          <h1>사이트 데이터 관리</h1>
        </div>
        <button className="button secondary" onClick={fetchAdminData} type="button">
          <RefreshCw size={16} />
          새로고침
        </button>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`admin-tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </aside>

        <div className="admin-workspace">
          <label className="search-box admin-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="관리 데이터 검색"
            />
          </label>

          {loading && <div className="empty-state">관리 데이터를 불러오는 중입니다.</div>}

          {!loading && activeTab === 'users' && (
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
                  {filteredUsers.map((item) => {
                    const isSelf = currentUser?.id === item.id || currentUser?.email === item.email;
                    return (
                      <tr key={item.id}>
                        <td>{item.name || '-'}</td>
                        <td>{item.email}</td>
                        <td><span className={`role-chip ${item.role?.toLowerCase()}`}>{item.role}</span></td>
                        <td>
                          <button className="icon-control" onClick={() => toggleRole(item)} disabled={isSelf} type="button">
                            {item.role === 'ADMIN' ? <ShieldOff size={16} /> : <Shield size={16} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && activeTab === 'rooms' && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>교실</th>
                    <th>층</th>
                    <th>설명</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => (
                    <tr key={room.id}>
                      <td>{room.name}</td>
                      <td>{room.floor}층</td>
                      <td>{room.description || '-'}</td>
                      <td>
                        <select
                          value={room.status || 'EMPTY'}
                          onChange={(event) => updateRoomStatus(room.id, event.target.value)}
                          className="table-select"
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && activeTab === 'timetables' && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>요일</th>
                    <th>교시</th>
                    <th>과목</th>
                    <th>교사</th>
                    <th>교실</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimetables.map((item) => (
                    <tr key={item.id}>
                      <td>{dayLabels[item.day_of_week] || item.day_of_week}</td>
                      <td>{item.period}교시</td>
                      <td>{item.subject}</td>
                      <td>{item.teacher_name || '-'}</td>
                      <td>{item.room_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
