import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const verifySession = useCallback(async () => {
    const res = await apiFetch('/auth/me');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || '세션 확인에 실패했습니다.');
    }
    saveAuth(data.user);
    return data.user;
  }, [saveAuth]);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const sessionUser = await verifySession();
        if (mounted) setUser(sessionUser);
      } catch {
        if (mounted) clearAuth();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [clearAuth, verifySession]);

  useEffect(() => {
    window.addEventListener('auth:expired', clearAuth);
    return () => window.removeEventListener('auth:expired', clearAuth);
  }, [clearAuth]);

  const googleLogin = async (credentialResponse) => {
    try {
      const res = await apiFetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || '로그인에 실패했습니다.' };
      }
      await verifySession();
      return { success: true };
    } catch (err) {
      clearAuth();
      return { success: false, message: err.message || '구글 로그인 서버 오류가 발생했습니다.' };
    }
  };

  const login = async () => {
    try {
      const res = await apiFetch('/auth/dev', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message || '개발 로그인에 실패했습니다.' };
      }
      await verifySession();
      return { success: true };
    } catch (err) {
      clearAuth();
      return { success: false, message: err.message || '개발 로그인 서버 오류가 발생했습니다.' };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    }
    clearAuth();
  };

  const updateProfile = (updatedFields) => {
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
