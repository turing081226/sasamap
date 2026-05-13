import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Search, RefreshCw, Edit2, Trash2, Plus, X, Save } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STATUS_OPTIONS = [
  { value: 'EMPTY', label: '빈 교실' },
  { value: 'IN_USE', label: '사용 중' },
  { value: 'CLASS', label: '수업 중' },
  { value: 'NEEDS_APPROVAL', label: '승인 필요' },
  { value: 'UNAVAILABLE', label: '사용 불가' },
  { value: 'MAINTENANCE', label: '점검 중' },
];

export default function RoomManager() {
  const [rooms, setRooms] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [updating, setUpdating] = useState(null);
  const toastTimer = useRef(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', floor: 1, type: '', description: '' });

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

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API}/admin/rooms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error();
      setRooms(prev => prev.filter(r => r.id !== id));
      showToast('✅ 삭제되었습니다.');
    } catch {
      showToast('❌ 삭제 실패');
    }
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({ name: '', floor: 1, type: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({ 
      name: room.name || '', 
      floor: room.floor || 1, 
      type: room.type || '', 
      description: room.description || '' 
    });
    setIsModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        // Edit
        const res = await fetch(`${API}/admin/rooms/${editingRoom.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error();
        setRooms(prev => prev.map(r => r.id === editingRoom.id ? { ...r, ...formData } : r));
        showToast('✅ 수정되었습니다.');
      } else {
        // Add
        const res = await fetch(`${API}/admin/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setRooms(prev => [...prev, { ...formData, id: data.id, status: 'EMPTY' }]);
        showToast('✅ 추가되었습니다.');
      }
      setIsModalOpen(false);
    } catch {
      showToast('❌ 저장 실패');
    }
  };

  const filtered = rooms.filter(r => {
    const q = query.toLowerCase();
    return r.name?.toLowerCase().includes(q) || String(r.id).includes(q);
  });

  return (
    <div className="card" style={{ marginBottom: '1.5rem', position: 'relative' }}>
      {toast && <div key={toast.id} className="toast-popup">{toast.msg}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--primary)" /> 교실 상태 관리
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            ({filtered.length}개)
          </span>
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', borderRadius: '7px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
            <Plus size={14} /> 교실 추가
          </button>
          <button onClick={fetchRooms}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> 새로고침
          </button>
        </div>
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
                <th style={{ padding: '0.6rem 0.75rem' }}>설명</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>현재 상태</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                    {r.name} {r.type ? <span style={{fontSize:'0.75rem', color:'#64748b', fontWeight:'normal'}}>({r.type})</span> : null}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: '#475569', fontSize: '0.85rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.description || '-'}
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
                        background: r.status === 'EMPTY' ? '#dcfce7' : r.status === 'IN_USE' ? '#fee2e2' : r.status === 'CLASS' ? '#fef08a' : r.status === 'NEEDS_APPROVAL' ? '#bfdbfe' : r.status === 'MAINTENANCE' ? '#fef9c3' : '#f1f5f9',
                      }}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button onClick={() => openEditModal(r)}
                        style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', color: '#475569' }} title="수정">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteRoom(r.id)}
                        style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', color: '#ef4444' }} title="삭제">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem', padding: '1.5rem', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem' }}>
              {editingRoom ? '교실 정보 수정' : '새 교실 추가'}
            </h3>
            <form onSubmit={handleSaveRoom}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>교실 이름 <span style={{color: 'red'}}>*</span></label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>층수 <span style={{color: 'red'}}>*</span></label>
                <input type="number" required min="1" value={formData.floor} onChange={e => setFormData({...formData, floor: Number(e.target.value)})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>타입 (선택)</label>
                <input type="text" placeholder="예: 일반교실, 특별실" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>설명 (선택)</label>
                <textarea rows="3" placeholder="교실에 대한 부가 설명 (2~3줄)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.7rem' }}>
                <Save size={16} /> 저장하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
