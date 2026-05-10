import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import FindRoom from './pages/FindRoom';
import Search from './pages/Search';
import MyPage from './pages/MyPage';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { Home as HomeIcon, Compass, Search as SearchIcon, User, Shield } from 'lucide-react';
import logo from './assets/logo.png';

function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setShowNav(false);
      } else {
        // Scrolling up
        setShowNav(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const NavItem = ({ to, icon: Icon, text }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        <Icon size={18} />
        <span>{text}</span>
      </Link>
    );
  };

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app-container">
      {!isLoginPage && (
        <>
          {/* Top Header for Mobile & PC */}
          <header className={`top-header ${showNav ? '' : 'nav-hidden'}`}>
            <Link to="/" className="nav-brand">
              <img src={logo} alt="SASA Logo" className="header-logo" />
              <span className="brand-text">SASA 공강맵</span>
            </Link>
          </header>

          {/* Bottom Nav for Mobile / Top Nav for PC */}
          <nav className={`navbar ${showNav ? '' : 'nav-hidden'}`}>
            <Link to="/" className="nav-brand">
              <img src={logo} alt="SASA Logo" className="header-logo" />
              <span className="brand-text">SASA 공강맵</span>
            </Link>
            <div className="nav-links">
              <NavItem to="/" icon={HomeIcon} text="홈" />
              <NavItem to="/find-room" icon={Compass} text="교실찾기" />
              <NavItem to="/search" icon={SearchIcon} text="검색" />
              <NavItem to="/mypage" icon={User} text="마이페이지" />
              {isAdmin && <NavItem to="/admin" icon={Shield} text="관리자" />}
            </div>
          </nav>
        </>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/find-room" element={<ProtectedRoute><FindRoom /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
