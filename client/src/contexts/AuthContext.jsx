import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // 유저 저장 (토큰은 쿠키로 서버에서 알아서 처리됨)
  const saveAuth = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 실제 구글 로그인 성공 시 호출
  const googleLogin = async (credentialResponse) => {
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        saveAuth(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: '구글 로그인 서버 오류가 발생했습니다.' };
    }
  };

  const login = (userData) => {
    saveAuth(userData);
  };

  // Mock 로그인 — 백엔드 API 호출 → DB에 유저 생성/조회 + 진짜 JWT 발급
  const mockLogin = async (email) => {
    try {
      const res = await fetch(`${API}/auth/mock-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        saveAuth(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      // 백엔드 연결 실패 시 프론트 전용 폴백
      if (!email.endsWith('@sasa.hs.kr')) {
        return { success: false, message: '학교 계정(@sasa.hs.kr)만 로그인할 수 있습니다.' };
      }
      const fallbackToken = 'fallback-token-' + Date.now();
      const fallbackUser = {
        id: 0, email, name: email.split('@')[0], role: 'USER',
      };
      saveAuth(fallbackUser);
      return { success: true };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  // 프로필 수정
  const updateProfile = (updatedFields) => {
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, mockLogin, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
