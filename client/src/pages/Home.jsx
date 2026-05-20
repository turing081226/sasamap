import { Link } from 'react-router-dom';
import { Compass, Search as SearchIcon, User, Calendar } from 'lucide-react';

export default function Home() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>SASA 공강맵</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem' }}>세종과학예술영재학교 교실 찾기 & 빈 교실 조회</p>
      </div>

      <div className="home-grid">
        <Link to="/find-room" className="home-card">
          <div className="icon-wrapper" style={{ background: '#eff6ff', color: 'var(--primary)' }}>
            <Compass size={32} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '0.35rem', fontWeight: '700' }}>교실 찾기</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>지도에서 교실 위치를 확인하고<br/>실시간 현황을 조회하세요.</p>
          </div>
        </Link>

        <Link to="/search" className="home-card">
          <div className="icon-wrapper" style={{ background: '#f3e8ff', color: '#9333ea' }}>
            <SearchIcon size={32} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '0.35rem', fontWeight: '700' }}>통합 검색</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>교실, 과목, 교사 이름으로<br/>교내 일정을 빠르게 찾으세요.</p>
          </div>
        </Link>

        <Link to="/timetable" className="home-card">
          <div className="icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <Calendar size={32} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '0.35rem', fontWeight: '700' }}>내 시간표</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>나만의 특별 활동과 시간표를<br/>스마트하게 관리하세요.</p>
          </div>
        </Link>

        <Link to="/mypage" className="home-card">
          <div className="icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <User size={32} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '0.35rem', fontWeight: '700' }}>마이페이지</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>내 프로필과 공강 위치를<br/>등록하고 친구들과 공유하세요.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
