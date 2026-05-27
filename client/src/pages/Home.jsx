import { Link } from 'react-router-dom';
import { Compass, Search as SearchIcon, User, Calendar } from 'lucide-react';

export default function Home() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>SASA 공강맵</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem' }}>세종과학예술영재학교 학생들을 위한 스마트 교내 일정 및 위치 공유 플랫폼</p>
      </div>

      <div className="home-grid">
        <Link to="/find-room" className="home-card">
          <div className="icon-wrapper" style={{ background: '#eff6ff', color: 'var(--primary)' }}>
            <Compass size={32} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '0', fontWeight: '700' }}>교실 찾기</h2>
          </div>
        </Link>

        <Link to="/search" className="home-card">
          <div className="icon-wrapper" style={{ background: '#f3e8ff', color: '#9333ea' }}>
            <SearchIcon size={32} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '0', fontWeight: '700' }}>통합 검색</h2>
          </div>
        </Link>

        <Link to="/timetable" className="home-card">
          <div className="icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <Calendar size={32} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '0', fontWeight: '700' }}>내 시간표</h2>
          </div>
        </Link>

        <Link to="/mypage" className="home-card">
          <div className="icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <User size={32} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginBottom: '0', fontWeight: '700' }}>마이페이지</h2>
          </div>
        </Link>
      </div>
    </div>
  );
}
