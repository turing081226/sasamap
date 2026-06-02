import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import logoImg from '../assets/logo.png';

export default function Login() {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 60%, #f0fdf4 100%)',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'white',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 40px rgba(37,99,235,0.10)',
        border: '1px solid #e2e8f0',
      }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',      // 로고의 가로 크기
            height: '64px',     // 로고의 세로 크기
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <img 
            src={logoImg} 
            alt="Logo" 
            style={{ width: '300%', height: '300%', objectFit: 'contain' }} 
          /></div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.3rem' }}>
            SASA 공강맵
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            세종과학예술영재학교 학생만 이용 가능합니다
          </p>
        </div>

        {/* Google Login Component */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setLoading(true);
              const result = await googleLogin(credentialResponse);
              if (result.success) {
                navigate(from, { replace: true });
              } else {
                setError(result.message);
              }
              setLoading(false);
            }}
            onError={() => {
              setError('구글 로그인에 실패했습니다.');
            }}
            useOneTap
            auto_select
            shape="rectangular"
            theme="outline"
            size="large"
            width="100%"
          />
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b', padding: '0.6rem 0.9rem',
            borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
          * @sasa.hs.kr 학교 이메일 계정으로만<br />입장 가능합니다.
        </p>
      </div>
    </div>
  );
}
