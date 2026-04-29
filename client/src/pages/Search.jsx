import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  
  const mockTeachers = [
    { id: 1, name: '이순신', subject: '컴퓨터', status: '공강 (2층 교무실)' },
    { id: 2, name: '세종대왕', subject: '국어', status: '수업중 (1학년 3반)' },
  ];

  return (
    <div>
      <h1 className="title">🔍 통합 검색</h1>
      
      <div className="card" style={{marginBottom: '2rem'}}>
        <div style={{display: 'flex', gap: '1rem'}}>
          <input 
            type="text" 
            placeholder="교사명, 과목, 선생님 등을 검색하세요..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{flex: 1, padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem'}}
          />
          <button className="btn" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <SearchIcon size={18} /> 검색
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2 style={{fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem'}}>👨‍🏫 교사 검색 결과</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {mockTeachers.map(t => (
              <div key={t.id} style={{padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <strong style={{fontSize: '1.1rem'}}>{t.name} 선생님</strong>
                  <span className="badge bg-blue">{t.subject}</span>
                </div>
                <p style={{marginTop: '0.5rem', color: 'var(--text-muted)'}}>현재 위치: {t.status}</p>
                <button className="btn" style={{marginTop: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'white', color: 'var(--primary)', border: '1px solid var(--primary)'}}>시간표 보기</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem'}}>#️⃣ 해시태그 / 교실 검색</h2>
          <p style={{color: 'var(--text-muted)'}}>{query ? `"${query}" 검색 결과가 없습니다.` : '검색어를 입력해보세요.'}</p>
        </div>
      </div>
    </div>
  );
}
