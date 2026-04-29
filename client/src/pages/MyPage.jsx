import { Calendar, Bell, Edit3 } from 'lucide-react';

export default function MyPage() {
  return (
    <div>
      <h1 className="title">👤 마이페이지</h1>
      
      <div className="grid">
        <div className="card" style={{gridColumn: '1 / -1'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
            <div style={{width: 60, height: 60, backgroundColor: 'var(--primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold'}}>
              유
            </div>
            <div>
              <h2 style={{fontSize: '1.4rem'}}>유저이름</h2>
              <p style={{color: 'var(--text-muted)'}}>student@sasa.hs.kr</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Calendar size={20} color="var(--primary)" /> 내 시간표
          </h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>이번 주 나의 특별활동 및 수업 시간표를 관리하세요.</p>
          <button className="btn" style={{width: '100%'}}>시간표 조회/수정</button>
        </div>

        <div className="card">
          <h2 style={{fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Edit3 size={20} color="var(--primary)" /> 계획서 작성
          </h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>프로젝트, 동아리 활동 등 사용처 계획서를 작성합니다.</p>
          <button className="btn" style={{width: '100%'}}>계획서 쓰기</button>
        </div>

        <div className="card">
          <h2 style={{fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Bell size={20} color="var(--primary)" /> 알림 설정
          </h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>수업 시작 전 알림을 받을 시간을 설정합니다.</p>
          <select style={{width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem'}}>
            <option>수업 5분 전</option>
            <option>수업 10분 전</option>
            <option>수업 30분 전</option>
          </select>
          <button className="btn" style={{width: '100%'}}>저장 완료</button>
        </div>
      </div>
    </div>
  );
}
