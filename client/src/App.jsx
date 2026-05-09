import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import FindRoom from './pages/FindRoom';
import Search from './pages/Search';
import MyPage from './pages/MyPage';
import Admin from './pages/Admin';
import { Compass, Search as SearchIcon, User, Shield } from 'lucide-react';

function App() {
  const location = useLocation();
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

  return (
    <div className="app-container">
      {/* Top Header for Mobile & PC */}
      <header className={`top-header ${showNav ? '' : 'nav-hidden'}`}>
        <Link to="/" className="nav-brand">🏫 SASA 공강맵</Link>
      </header>

      {/* Bottom Nav for Mobile / Top Nav for PC */}
      <nav className={`navbar ${showNav ? '' : 'nav-hidden'}`}>
        <div className="nav-links">
          <NavItem to="/" icon={Compass} text="교실찾기" />
          <NavItem to="/search" icon={SearchIcon} text="검색" />
          <NavItem to="/mypage" icon={User} text="마이페이지" />
          <NavItem to="/admin" icon={Shield} text="관리자" />
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<FindRoom />} />
          <Route path="/search" element={<Search />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
