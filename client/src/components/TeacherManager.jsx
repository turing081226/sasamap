import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, Search, X, Save, UserCheck } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const emptyForm = { name: '', office_room_id: '' };

export default function TeacherManager() {
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showAdd, setShowAdd] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resTeachers, resRooms] = await Promise.all([
        fetch(`${API}/admin/teachers`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch(`${API}/admin/rooms`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      
      if (resTeachers.ok) setTeachers(await resTeachers.json());
      if (resRooms.ok) setRooms(await resRooms.json());
    } catch (err) {
      console.error(err);
      showToast('❌ 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!form.name.trim()) return showToast('⚠️ 교사명은 필수입니다.');
    try {
      const res = await fetch(`${API}/admin/teachers`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      await fetchData();
      setForm({ ...emptyForm });
      setShowAdd(false);
      showToast('✅ 교사 데이터가 추가되었습니다.');
    } catch { showToast('❌ 추가 실패'); }
  };

  const startEdit = (teacher) => {
    setEditingId(teacher.id);
    setForm({ name: teacher.name, office_room_id: teacher.office_room_id || '' });
  };

  const handleUpdate = async () => {
    if (!form.name.trim()) return showToast('⚠️ 교사명은 필수입니다.');
    try {
      const res = await fetch(`${API}/admin/teachers/${editingId}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      await fetchData();
      setEditingId(null);
      setForm({ ...emptyForm });
      showToast('✅ 교사 데이터가 수정되었습니다.');
    } catch { showToast('❌ 수정 실패'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API}/admin/teachers/${id}`, {
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error();
      setTeachers(prev => prev.filter(t => t.id !== id));
      showToast('🗑️ 삭제되었습니다.');
    } catch { showToast('❌ 삭제 실패'); }
  };

  const filtered = teachers.filter(t => {
    const q = query.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.office_room_name?.toLowerCase().includes(q);
  });

  const inputSt = { padding: '0.5rem 0.7rem', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', width: '100%' };

  const renderFormRow = (onSave, onCancel, saveLabel) => (
    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div><label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>교사명 *</label>
          <input style={inputSt} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="이름" /></div>
        <div><label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>교무실 (사용 교실)</label>
          <select style={inputSt} value={form.office_room_id} onChange={e => setForm(f => ({ ...f, office_room_id: e.target.value ? Number(e.target.value) : '' }))}>
            <option value="">지정 안함</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.floor}층)</option>)}
          </select></div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '0.45rem 1rem', borderRadius: '7px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          <X size={14} style={{ verticalAlign: '-2px' }} /> 취소</button>
        <button onClick={onSave} className="btn" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Save size={14} /> {saveLabel}</button>
      </div>
    </div>
  );

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      {toast && <div className="toast-popup">{toast}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={20} color="var(--primary)" /> 교사 데이터 관리
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({filtered.length}명)</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button onClick={() => { setShowAdd(!showAdd); setEditingId(null); setForm({ ...emptyForm }); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.7rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: showAdd ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}>
            <Plus size={14} /> 교사 추가</button>
        </div>
      </div>

      {showAdd && renderFormRow(handleAdd, () => setShowAdd(false), "추가")}

      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input type="text" placeholder="교사명 또는 교무실로 검색..." value={query} onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', padding: '0.55rem 0.8rem 0.55rem 2.1rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }} />
      </div>

      {loading ? <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>불러오는 중...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>교사명</th>
                <th style={{ padding: '0.5rem' }}>교무실</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', width: '100px' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={3} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>등록된 교사가 없습니다.</td></tr>}
              {filtered.map(item => editingId === item.id ? (
                <tr key={item.id} style={{ background: '#eff6ff' }}>
                  <td colSpan={3} style={{ padding: '0.5rem' }}>
                    {renderFormRow(handleUpdate, () => { setEditingId(null); setForm({ ...emptyForm }); }, "저장")}
                  </td>
                </tr>
              ) : (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.5rem', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '0.5rem', color: '#475569' }}>{item.office_room_name || '미지정'}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => startEdit(item)} title="수정"
                        style={{ padding: '0.3rem', borderRadius: '5px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#2563eb' }}>
                        <Edit3 size={13} /></button>
                      <button onClick={() => handleDelete(item.id)} title="삭제"
                        style={{ padding: '0.3rem', borderRadius: '5px', border: '1px solid #fecaca', background: '#fff7f7', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={13} /></button>
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
