import { Users, UploadCloud, Database } from 'lucide-react';

export default function Admin() {
  const users = [
    { id: 1, email: 'teacher1@sasa.hs.kr', name: '김교사', role: 'ADMIN' },
    { id: 2, email: 'student1@sasa.hs.kr', name: '이학생', role: 'USER' },
  ];

  return (
    <div>
      <h1 className="title" style={{color: '#991b1b'}}>🛡️ 관리자 (ADMIN) 페이지</h1>
      
      <div className="card" style={{marginBottom: '2rem', borderLeft: '4px solid #991b1b'}}>
        <h2 style={{fontSize: '1.2rem', marginBottom: '0.5rem'}}>인증 필요</h2>
        <p style={{color: 'var(--text-muted)'}}>이 페이지는 실제 서버 연결시 ADMIN 권한이 있는 구글 계정으로만 접근 가능합니다.</p>
      </div>

      <div className="grid">
        <div className="card" style={{gridColumn: '1 / span 2'}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Users size={20} color="var(--primary)" /> 유저 정보 관리
          </h2>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead>
              <tr style={{borderBottom: '2px solid var(--border-color)'}}>
                <th style={{padding: '0.75rem'}}>ID</th>
                <th style={{padding: '0.75rem'}}>이름</th>
                <th style={{padding: '0.75rem'}}>이메일</th>
                <th style={{padding: '0.75rem'}}>권한</th>
                <th style={{padding: '0.75rem'}}>액션</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                  <td style={{padding: '0.75rem'}}>{u.id}</td>
                  <td style={{padding: '0.75rem'}}>{u.name}</td>
                  <td style={{padding: '0.75rem'}}>{u.email}</td>
                  <td style={{padding: '0.75rem'}}>
                    <span className={`badge ${u.role === 'ADMIN' ? 'bg-red' : 'bg-blue'}`}>{u.role}</span>
                  </td>
                  <td style={{padding: '0.75rem'}}>
                    <button style={{padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer'}}>권한 변경</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Database size={20} color="var(--primary)" /> 기초 데이터
          </h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center'}}>
              <UploadCloud size={32} color="var(--text-muted)" style={{margin: '0 auto', marginBottom: '0.5rem'}} />
              <p style={{fontWeight: '500'}}>최신 시간표 엑셀 업로드</p>
              <button className="btn" style={{marginTop: '1rem', width: '100%'}}>파일 선택</button>
            </div>
            <button className="btn" style={{backgroundColor: '#166534'}}>서버에 데이터 송신</button>
          </div>
        </div>
      </div>
    </div>
  );
}
