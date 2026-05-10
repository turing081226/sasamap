import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Search, RefreshCw, Save } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STATUS_OPTIONS = [
  { value: 'EMPTY', label: '빈 교실' },
  { value: 'IN_USE', label: '사용 중' },
  { value: 'CLASS', label: '수업 중' },
  { value: 'NEEDS_APPROVAL', label: '승인 필요' },
  { value: 'UNAVAILABLE', label: '사용 불가' },
];

export default function RoomManager() {
  const [rooms, setRooms] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [updating, setUpdating] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast({ id: Date.now(), msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/rooms`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setRooms(data);
    } catch {
      showToast('❌ 오류 발생');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      const res = await fetch(`${API}/admin/rooms/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setRooms(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      showToast(`✅ 변경됨`);
    } catch {
      showToast('❌ 변경 실패');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = rooms.filter(r => {
    const q = query.toLowerCase();
    return r.name?.toLowerCase().includes(q) || String(r.id).includes(q);
  });

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      {toast && <div key={toast.id} className="toast-popup">{toast.msg}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--primary)" /> 교실 상태 관리
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            ({filtered.length}개)
          </span>
        </h2>
        <button onClick={fetchRooms}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> 새로고침
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="교실 이름이나 ID로 검색..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', padding: '0.65rem 0.9rem 0.65rem 2.3rem',
            borderRadius: '8px', border: '1.5px solid #e2e8f0',
            fontSize: '0.9rem', outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>불러오는 중...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: '#64748b' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>ID</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>층</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>교실 이름</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>현재 상태</th>
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
              {filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.65rem 0.75rem', color: '#475569', fontSize: '0.85rem' }}>
                    {r.id}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: '600' }}>
                    {r.floor}층
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: '600' }}>
                    {r.name}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      disabled={updating === r.id}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: updating === r.id ? 'wait' : 'pointer',
                        background: r.status === 'EMPTY' ? '#dcfce7' : r.status === 'IN_USE' ? '#fee2e2' : r.status === 'CLASS' ? '#fef08a' : r.status === 'NEEDS_APPROVAL' ? '#bfdbfe' : '#f1f5f9',
                      }}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
