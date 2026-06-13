import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  HelpCircle,
  LogOut,
  Map,
  Moon,
  Search,
  Shield,
  Sun,
  Users,
} from 'lucide-react';
import FindRoom from './pages/FindRoom';
import SearchPage from './pages/Search';
import Social from './pages/Social';
import Timetable from './pages/Timetable';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import logo from './assets/logo.png';

const navItems = [
  { to: '/', label: '지도', icon: Map },
  { to: '/search', label: '검색', icon: Search },
  { to: '/social', label: '소셜', icon: Users },
  { to: '/timetable', label: '일정', icon: CalendarDays },
];

function App() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/' || location.pathname === '/find-room';
    return location.pathname === to;
  };

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
  };

  if (isLoginPage) {
    return (
      <main className="auth-shell">
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="app-container">
      <header className="app-topbar">
        <Link to="/" className="app-brand" onClick={() => setProfileOpen(false)}>
          <img src={logo} alt="SASA 로고" className="app-logo" />
          <span>SASA 공강맵</span>
        </Link>

        <nav className="desktop-nav" aria-label="주요 메뉴">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`nav-link ${isActive(to) ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              <Shield size={18} />
              <span>관리</span>
            </Link>
          )}
        </nav>

        <div className="topbar-actions">
          <button className="icon-control" onClick={() => setDarkMode((value) => !value)} aria-label="다크모드">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="icon-control" onClick={() => setHelpOpen(true)} aria-label="도움말">
            <HelpCircle size={18} />
          </button>
          <button className="profile-button" onClick={() => setProfileOpen(true)} aria-label="프로필">
            <span>{(user?.name || 'S').slice(0, 1)}</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProtectedRoute><FindRoom /></ProtectedRoute>} />
          <Route path="/find-room" element={<Navigate to="/" replace />} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
          <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="mobile-bottom-nav" aria-label="하단 메뉴">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`mobile-tab ${isActive(to) ? 'active' : ''}`}>
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {profileOpen && (
        <div className="modal-backdrop" onClick={() => setProfileOpen(false)}>
          <section className="app-modal profile-modal" onClick={(event) => event.stopPropagation()}>
            <header className="app-modal-header">
              <h2>프로필</h2>
              <button className="icon-control" onClick={() => setProfileOpen(false)} aria-label="닫기">×</button>
            </header>
            <div className="profile-modal-body">
              <div className="profile-avatar">{(user?.name || 'S').slice(0, 1)}</div>
              <div>
                <strong>{user?.name || '사용자'}</strong>
                <span>{user?.email || 'student@sasa.hs.kr'}</span>
              </div>
            </div>
            <div className="app-modal-actions">
              {isAdmin && (
                <Link className="button secondary" to="/admin" onClick={() => setProfileOpen(false)}>
                  관리 탭
                </Link>
              )}
              <button className="button danger" onClick={handleLogout}>
                <LogOut size={15} />
                로그아웃
              </button>
            </div>
          </section>
        </div>
      )}

      {helpOpen && (
        <div className="modal-backdrop" onClick={() => setHelpOpen(false)}>
          <section className="app-modal" onClick={(event) => event.stopPropagation()}>
            <header className="app-modal-header">
              <h2>도움말</h2>
              <button className="icon-control" onClick={() => setHelpOpen(false)} aria-label="닫기">×</button>
            </header>
            <p className="modal-copy">
              지도에서 교실 상태를 먼저 확인하고, 검색/소셜/일정에서 필요한 정보를 상세 팝업으로 확인합니다.
            </p>
            <div className="app-modal-actions">
              <button className="button primary" onClick={() => setHelpOpen(false)}>확인</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
