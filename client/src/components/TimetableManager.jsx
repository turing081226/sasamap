import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit3, Trash2, Search, Upload, Download, X, Save, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DAYS = ['', '월', '화', '수', '목', '금'];

const MOCK_TIMETABLES = [
  { id: 1, teacher_name: '홍길동', subject: '수학', room_name: '1-1반', day_of_week: 1, period: 1 },
  { id: 2, teacher_name: '홍길동', subject: '수학', room_name: '1-2반', day_of_week: 1, period: 2 },
  { id: 3, teacher_name: '김영희', subject: '영어', room_name: '2-2반', day_of_week: 2, period: 3 },
  { id: 4, teacher_name: '박과학', subject: '물리', room_name: '3-1반', day_of_week: 3, period: 1 },
  { id: 5, teacher_name: '이국어', subject: '국어', room_name: '1-3반', day_of_week: 4, period: 5 },
];

const emptyForm = { teacher_name: '', subject: '', room_id: '', day_of_week: 1, period: 1 };

export default function TimetableManager() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [toast, setToast] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showAdd, setShowAdd] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const fileRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/timetables`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error();
      setItems(await res.json());
      setUsingMock(false);
    } catch {
      setItems(MOCK_TIMETABLES);
      setUsingMock(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── CRUD ──
  const handleAdd = async () => {
    if (!form.subject || !form.teacher_name) return showToast('⚠️ 과목명과 교사명은 필수입니다.');
    try {
      if (!usingMock) {
        const res = await fetch(`${API}/admin/timetables`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
      }
      const newItem = { ...form, id: Date.now(), room_name: form.room_id || '-' };
      setItems(prev => [...prev, newItem]);
      setForm({ ...emptyForm });
      setShowAdd(false);
      showToast('✅ 수업이 추가되었습니다.');
    } catch { showToast('❌ 추가 실패'); }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({ teacher_name: item.teacher_name, subject: item.subject, room_id: item.room_id || '', day_of_week: item.day_of_week, period: item.period });
  };

  const handleUpdate = async () => {
    try {
      if (!usingMock) {
        const res = await fetch(`${API}/admin/timetables/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
      }
      setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...form, room_name: form.room_id || i.room_name } : i));
      setEditingId(null);
      setForm({ ...emptyForm });
      showToast('✅ 수업이 수정되었습니다.');
    } catch { showToast('❌ 수정 실패'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      if (!usingMock) {
        const res = await fetch(`${API}/admin/timetables/${id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error();
      }
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('🗑️ 삭제되었습니다.');
    } catch { showToast('❌ 삭제 실패'); }
  };

  // ── Excel upload ──
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        const mapped = rows.map(r => ({
          teacher_name: r['교사명'] || r['teacher_name'] || '',
          subject: r['과목'] || r['subject'] || '',
          room_id: r['교실ID'] || r['room_id'] || null,
          day_of_week: Number(r['요일번호'] || r['day_of_week'] || 1),
          period: Number(r['교시'] || r['period'] || 1),
        }));
        if (!usingMock) {
          await fetch(`${API}/admin/timetable`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ timetables: mapped }),
          });
        }
        setItems(prev => [...prev, ...mapped.map((m, i) => ({ ...m, id: Date.now() + i, room_name: '-' }))]);
        showToast(`✅ ${mapped.length}개의 수업 데이터를 업로드했습니다.`);
      } catch { showToast('❌ 파일 처리 중 오류가 발생했습니다.'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // ── Excel download ──
  const handleDownload = () => {
    const data = items.map(i => ({
      '교사명': i.teacher_name, '과목': i.subject, '교실ID': i.room_id || '',
      '요일번호': i.day_of_week, '교시': i.period,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '시간표');
    XLSX.writeFile(wb, 'sasa_timetable.xlsx');
  };

  const filtered = items.filter(i => {
    const q = query.toLowerCase();
    return i.teacher_name?.toLowerCase().includes(q) || i.subject?.toLowerCase().includes(q) || i.room_name?.toLowerCase().includes(q);
  });

  const inputSt = { padding: '0.5rem 0.7rem', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', width: '100%' };

  const FormRow = ({ onSave, onCancel, saveLabel }) => (
    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div><label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>교사명 *</label>
          <input style={inputSt} value={form.teacher_name} onChange={e => setForm(f => ({ ...f, teacher_name: e.target.value }))} /></div>
        <div><label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>과목 *</label>
          <input style={inputSt} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
        <div><label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>교실 ID</label>
          <input style={inputSt} type="number" placeholder="예: 1" value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value ? Number(e.target.value) : '' }))} /></div>
        <div><label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>요일</label>
          <select style={inputSt} value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: Number(e.target.value) }))}>
            {[1,2,3,4,5].map(d => <option key={d} value={d}>{DAYS[d]}</option>)}
          </select></div>
        <div><label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>교시</label>
          <select style={inputSt} value={form.period} onChange={e => setForm(f => ({ ...f, period: Number(e.target.value) }))}>
            {[1,2,3,4,5,6,7,8,9].map(p => <option key={p} value={p}>{p}교시</option>)}
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

      {usingMock && <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.8rem', borderRadius: '8px', background: '#fef9c3', color: '#713f12', fontSize: '0.8rem', border: '1px solid #fde68a' }}>⚠️ 임시 데이터 표시 중</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSpreadsheet size={20} color="var(--primary)" /> 수업 데이터 관리
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({filtered.length}개)</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button onClick={() => { setShowAdd(!showAdd); setEditingId(null); setForm({ ...emptyForm }); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.7rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: showAdd ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}>
            <Plus size={14} /> 추가</button>
          <button onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.7rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#16a34a' }}>
            <Upload size={14} /> 엑셀 업로드</button>
          <button onClick={handleDownload}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.7rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#7c3aed' }}>
            <Download size={14} /> 내보내기</button>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
      </div>

      {/* Format guide toggle */}
      <div style={{ marginBottom: '0.75rem' }}>
        <button onClick={() => setShowFormat(!showFormat)} style={{ fontSize: '0.8rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          📋 엑셀 업로드 형식 안내 {showFormat ? '닫기' : '보기'}</button>
        {showFormat && (
          <div style={{ marginTop: '0.5rem', padding: '0.8rem', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #bbf7d0', lineHeight: 1.8 }}>
            <strong>필수 열 이름 (첫 행 헤더):</strong><br/>
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>교사명</code>{' '}
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>과목</code>{' '}
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>교실ID</code>{' '}
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>요일번호</code>{' (1=월 ~ 5=금) '}
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>교시</code>{' (1~7)'}<br/>
            <strong>예시:</strong> 홍길동 | 수학 | 1 | 1 | 3 → 홍길동 선생님, 수학, 교실ID 1, 월요일 3교시<br/>
            ✅ 업로드 시 <strong>기존 데이터에 추가</strong>됩니다.
          </div>
        )}
      </div>

      {/* Add form */}
      {showAdd && <FormRow onSave={handleAdd} onCancel={() => setShowAdd(false)} saveLabel="추가" />}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input type="text" placeholder="교사명, 과목, 교실로 검색..." value={query} onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', padding: '0.55rem 0.8rem 0.55rem 2.1rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }} />
      </div>

      {/* Table */}
      {loading ? <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>불러오는 중...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>요일</th>
                <th style={{ padding: '0.5rem' }}>교시</th>
                <th style={{ padding: '0.5rem' }}>과목</th>
                <th style={{ padding: '0.5rem' }}>교사</th>
                <th style={{ padding: '0.5rem' }}>교실</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', width: '100px' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>데이터가 없습니다.</td></tr>}
              {filtered.map(item => editingId === item.id ? (
                <tr key={item.id} style={{ background: '#eff6ff' }}>
                  <td colSpan={6} style={{ padding: '0.5rem' }}>
                    <FormRow onSave={handleUpdate} onCancel={() => { setEditingId(null); setForm({ ...emptyForm }); }} saveLabel="저장" />
                  </td>
                </tr>
              ) : (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.5rem' }}><span className="badge bg-blue">{DAYS[item.day_of_week]}</span></td>
                  <td style={{ padding: '0.5rem' }}>{item.period}교시</td>
                  <td style={{ padding: '0.5rem', fontWeight: 600 }}>{item.subject}</td>
                  <td style={{ padding: '0.5rem' }}>{item.teacher_name}</td>
                  <td style={{ padding: '0.5rem', color: '#475569' }}>{item.room_name || '-'}</td>
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
