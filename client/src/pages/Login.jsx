import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

export default function Login() {
  const { googleLogin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDevLogin = () => {
    login({
      id: 'local-dev-user',
      name: '로컬 사용자',
      email: 'local@sasa.hs.kr',
      role: 'ADMIN',
    });
    navigate(from, { replace: true });
  };

  return (
    <div className="login-page">
      <section className="login-card">
        <img src={logo} alt="SASA 로고" className="login-logo" />
        <h1>SASA 공강맵</h1>
        <p>학교 계정으로 로그인해 교실 상태와 일정을 확인합니다.</p>

        <div className="google-login-wrap">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setLoading(true);
              setError('');
              const result = await googleLogin(credentialResponse);
              setLoading(false);
              if (result.success) {
                navigate(from, { replace: true });
              } else {
                setError(result.message || '로그인에 실패했습니다.');
              }
            }}
            onError={() => setError('구글 로그인에 실패했습니다.')}
            useOneTap
            auto_select
            shape="rectangular"
            theme="outline"
            size="large"
            width="100%"
          />
        </div>

        {import.meta.env.DEV && (
          <button className="button secondary dev-login-button" onClick={handleDevLogin} type="button">
            로컬 개발 로그인
          </button>
        )}

        {loading && <div className="empty-state slim">로그인 중입니다.</div>}
        {error && <div className="form-error">{error}</div>}
      </section>
    </div>
  );
}
