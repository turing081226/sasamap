import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Edit3, FileSpreadsheet, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../lib/api';

const DAYS = ['', '월', '화', '수', '목', '금'];
const emptyForm = { teacher_name: '', subject: '', room_id: '', day_of_week: 1, period: 1 };

export default function TimetableManager() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showAdd, setShowAdd] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const fileRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/admin/timetables');
      if (!res.ok) throw new Error(`API error (${res.status})`);
      setItems(await res.json());
    } catch (err) {
      console.error('Failed to fetch timetables', err);
      setItems([]);
      setError('DB에서 수업 데이터를 불러오지 못했습니다. 로그인 상태와 관리자 권한을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!form.subject || !form.teacher_name) {
      showToast('과목명과 교사명은 필수입니다.');
      return;
    }

    try {
      const res = await apiFetch('/admin/timetables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`API error (${res.status})`);

      await fetchData();
      setForm({ ...emptyForm });
      setShowAdd(false);
      showToast('수업을 추가했습니다.');
    } catch (err) {
      console.error('Timetable add error:', err);
      showToast('추가에 실패했습니다.');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setShowAdd(false);
    setForm({
      teacher_name: item.teacher_name || '',
      subject: item.subject || '',
      room_id: item.room_id || '',
      day_of_week: item.day_of_week || 1,
      period: item.period || 1,
    });
  };

  const handleUpdate = async () => {
    try {
      const res = await apiFetch(`/admin/timetables/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`API error (${res.status})`);

      await fetchData();
      setEditingId(null);
      setForm({ ...emptyForm });
      showToast('수업을 수정했습니다.');
    } catch (err) {
      console.error('Timetable update error:', err);
      showToast('수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await apiFetch(`/admin/timetables/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`API error (${res.status})`);
      setItems(prev => prev.filter(item => item.id !== id));
      showToast('삭제했습니다.');
    } catch (err) {
      console.error('Timetable delete error:', err);
      showToast('삭제에 실패했습니다.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        const timetables = rows.map(row => ({
          teacher_name: row['교사명'] || row.teacher_name || '',
          subject: row['과목'] || row.subject || '',
          room_id: row['교실ID'] || row.room_id || null,
          day_of_week: Number(row['요일번호'] || row.day_of_week || 1),
          period: Number(row['교시'] || row.period || 1),
        }));

        const res = await apiFetch('/admin/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timetables }),
        });
        if (!res.ok) throw new Error(`API error (${res.status})`);

        await fetchData();
        showToast(`${timetables.length}개의 수업 데이터를 업로드했습니다.`);
      } catch (err) {
        console.error('Timetable upload error:', err);
        showToast('파일 처리 중 오류가 발생했습니다.');
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleDownload = () => {
    const data = items.map(item => ({
      교사명: item.teacher_name,
      과목: item.subject,
      교실ID: item.room_id || '',
      요일번호: item.day_of_week,
      교시: item.period,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '시간표');
    XLSX.writeFile(wb, 'sasa_timetable.xlsx');
  };

  const filtered = items.filter(item => {
    const q = query.toLowerCase();
    return (
      item.teacher_name?.toLowerCase().includes(q) ||
      item.subject?.toLowerCase().includes(q) ||
      item.room_name?.toLowerCase().includes(q)
    );
  });

  const inputStyle = {
    padding: '0.5rem 0.7rem',
    borderRadius: '7px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
  };

  const renderFormRow = (onSave, onCancel, saveLabel) => (
    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>교사명 *</label>
          <input style={inputStyle} value={form.teacher_name} onChange={e => setForm(prev => ({ ...prev, teacher_name: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>과목 *</label>
          <input style={inputStyle} value={form.subject} onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>교실 ID</label>
          <input style={inputStyle} type="number" placeholder="예: 1" value={form.room_id} onChange={e => setForm(prev => ({ ...prev, room_id: e.target.value ? Number(e.target.value) : '' }))} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>요일</label>
          <select style={inputStyle} value={form.day_of_week} onChange={e => setForm(prev => ({ ...prev, day_of_week: Number(e.target.value) }))}>
            {[1, 2, 3, 4, 5].map(day => <option key={day} value={day}>{DAYS[day]}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>교시</label>
          <select style={inputStyle} value={form.period} onChange={e => setForm(prev => ({ ...prev, period: Number(e.target.value) }))}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(period => <option key={period} value={period}>{period}교시</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '0.45rem 1rem', borderRadius: '7px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          <X size={14} style={{ verticalAlign: '-2px' }} /> 취소
        </button>
        <button onClick={onSave} className="btn" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Save size={14} /> {saveLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      {toast && <div className="toast-popup">{toast}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSpreadsheet size={20} color="var(--primary)" /> 수업 데이터 관리
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({filtered.length}개)</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button onClick={() => { setShowAdd(!showAdd); setEditingId(null); setForm({ ...emptyForm }); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.7rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: showAdd ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}>
            <Plus size={14} /> 추가
          </button>
          <button onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.7rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#16a34a' }}>
            <Upload size={14} /> 엑셀 업로드
          </button>
          <button onClick={handleDownload}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.7rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#7c3aed' }}>
            <Download size={14} /> 내보내기
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
      </div>

      {error && (
        <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.8rem', borderRadius: '8px', background: '#fef2f2', color: '#991b1b', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '0.75rem' }}>
        <button onClick={() => setShowFormat(!showFormat)} style={{ fontSize: '0.8rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          엑셀 업로드 형식 안내 {showFormat ? '닫기' : '보기'}
        </button>
        {showFormat && (
          <div style={{ marginTop: '0.5rem', padding: '0.8rem', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #bbf7d0', lineHeight: 1.8 }}>
            <strong>필수 열 이름:</strong>{' '}
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>교사명</code>{' '}
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>과목</code>{' '}
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>교실ID</code>{' '}
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>요일번호</code>{' (1=월 ~ 5=금) '}
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>교시</code>{' (1~9)'}
          </div>
        )}
      </div>

      {showAdd && renderFormRow(handleAdd, () => setShowAdd(false), '추가')}

      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input type="text" placeholder="교사명, 과목, 교실로 검색..." value={query} onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', padding: '0.55rem 0.8rem 0.55rem 2.1rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }} />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>불러오는 중...</p>
      ) : (
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    표시할 수업 데이터가 없습니다.
                  </td>
                </tr>
              )}
              {filtered.map(item => editingId === item.id ? (
                <tr key={item.id}>
                  <td colSpan={6} style={{ padding: '0.5rem' }}>
                    {renderFormRow(handleUpdate, () => { setEditingId(null); setForm({ ...emptyForm }); }, '저장')}
                  </td>
                </tr>
              ) : (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.55rem' }}>{DAYS[item.day_of_week] || item.day_of_week}</td>
                  <td style={{ padding: '0.55rem' }}>{item.period}교시</td>
                  <td style={{ padding: '0.55rem', fontWeight: 600 }}>{item.subject}</td>
                  <td style={{ padding: '0.55rem' }}>{item.teacher_name || '-'}</td>
                  <td style={{ padding: '0.55rem' }}>{item.room_name || item.room_id || '-'}</td>
                  <td style={{ padding: '0.55rem', textAlign: 'center' }}>
                    <button onClick={() => startEdit(item)} title="수정" style={{ marginRight: '0.25rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#2563eb' }}>
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} title="삭제" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}>
                      <Trash2 size={15} />
                    </button>
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
