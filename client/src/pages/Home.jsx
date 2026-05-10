import { Link } from 'react-router-dom';
import { Compass, Search as SearchIcon, User } from 'lucide-react';

export default function Home() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.5rem' }}>SASA 공강맵</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>세종과학예술영재학교 교실 찾기 & 빈 교실 조회</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <Link to="/find-room" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem', textAlign: 'center' }}>
            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
              <Compass size={40} />
            </div>
            <div>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>교실 찾기</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>지도에서 교실 위치를 확인하고<br/>상태를 조회하세요.</p>
            </div>
          </div>
        </Link>

        <Link to="/search" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem', textAlign: 'center' }}>
            <div style={{ background: '#f3e8ff', padding: '1rem', borderRadius: '50%', color: '#9333ea' }}>
              <SearchIcon size={40} />
            </div>
            <div>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>통합 검색</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>교실, 과목, 교사 이름으로<br/>빠르게 검색하세요.</p>
            </div>
          </div>
        </Link>

        <Link to="/mypage" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem', textAlign: 'center' }}>
            <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '50%', color: '#16a34a' }}>
              <User size={40} />
            </div>
            <div>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>마이페이지</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>내 시간표와 즐겨찾기한<br/>교실을 관리하세요.</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
