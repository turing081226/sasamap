import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Search, RefreshCw, Edit2, Trash2, Plus, X, Save } from 'lucide-react';
import { apiFetch } from '../lib/api';

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

  // Inline forms control states
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', floor: 1, type: '', description: '' });

  const showToast = (msg) => {
    setToast({ id: Date.now(), msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/rooms');
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
      const res = await apiFetch(`/admin/rooms/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await apiFetch(`/admin/rooms/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      setRooms(prev => prev.filter(r => r.id !== id));
      showToast('✅ 삭제되었습니다.');
    } catch {
      showToast('❌ 삭제 실패');
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ name: '', floor: 1, type: '', description: '' });
    setShowAdd(!showAdd);
  };

  const startEdit = (room) => {
    setShowAdd(false);
    setEditingId(room.id);
    setFormData({ 
      name: room.name || '', 
      floor: room.floor || 1, 
      type: room.type || '', 
      description: room.description || '' 
    });
  };

  const handleSaveRoom = async () => {
    if (!formData.name) {
      showToast('⚠️ 교실 이름은 필수입니다.');
      return;
    }
    try {
      if (editingId) {
        // Edit
        const res = await apiFetch(`/admin/rooms/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error();
        setRooms(prev => prev.map(r => r.id === editingId ? { ...r, ...formData } : r));
        showToast('✅ 수정되었습니다.');
        setEditingId(null);
      } else {
        // Add
        const res = await apiFetch('/admin/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setRooms(prev => [...prev, { ...formData, id: data.id, status: 'EMPTY' }]);
        showToast('✅ 추가되었습니다.');
        setShowAdd(false);
      }
    } catch (err) {
      console.error("Save room error:", err);
      showToast('❌ 저장 실패');
    }
  };

  const filtered = rooms.filter(r => {
    const q = query.toLowerCase();
    return r.name?.toLowerCase().includes(q) || String(r.id).includes(q);
  });

  const inputSt = { 
    padding: '0.45rem 0.65rem', 
    borderRadius: '7px', 
    border: '1.5px solid #e2e8f0', 
    fontSize: '0.85rem', 
    outline: 'none', 
    width: '100%' 
  };

  const renderFormRow = (onSave, onCancel, saveLabel) => (
    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '2px' }}>교실 이름 *</label>
          <input style={inputSt} required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '2px' }}>층수 *</label>
          <input style={inputSt} type="number" required min="1" value={formData.floor} onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })} />
        </div>
        <div>
          <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '2px' }}>타입 (선택)</label>
          <input style={inputSt} placeholder="예: 일반교실, 특별실" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '2px' }}>설명 (선택)</label>
          <input style={inputSt} placeholder="교실 설명" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
          <X size={13} style={{ verticalAlign: '-2px' }} /> 취소
        </button>
        <button type="button" onClick={onSave} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Save size={13} /> {saveLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="card" style={{ marginBottom: '1.5rem', position: 'relative' }}>
      {toast && <div key={toast.id} className="toast-popup">{toast.msg}</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--primary)" /> 교실 상태 관리
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            ({filtered.length}개)
          </span>
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={openAddForm}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: showAdd ? '#eff6ff' : 'white', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            <Plus size={14} /> 교실 추가
          </button>
          <button onClick={fetchRooms}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> 새로고침
          </button>
        </div>
      </div>

      {/* Inline Add form */}
      {showAdd && renderFormRow(handleSaveRoom, () => setShowAdd(false), "추가")}

      {/* Search */}
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
                <th style={{ padding: '0.6rem 0.75rem', width: '80px' }}>ID</th>
                <th style={{ padding: '0.6rem 0.75rem', width: '100px' }}>층</th>
                <th style={{ padding: '0.6rem 0.75rem', width: '200px' }}>교실 이름</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>설명</th>
                <th style={{ padding: '0.6rem 0.75rem', width: '180px' }}>현재 상태</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: '120px' }}>관리</th>
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
              {filtered.map(r => editingId === r.id ? (
                <tr key={r.id} style={{ background: '#eff6ff' }}>
                  <td colSpan={6} style={{ padding: '0.5rem' }}>
                    {renderFormRow(handleSaveRoom, () => { setEditingId(null); }, "저장")}
                  </td>
                </tr>
              ) : (
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
                      <button onClick={() => startEdit(r)}
                        style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', color: '#2563eb' }} title="수정">
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
    </div>
  );
}
