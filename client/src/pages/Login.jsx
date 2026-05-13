import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImg from '../assets/logo.png';

export default function Login() {
  const { mockLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMockLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 600)); // 로딩 효과

    const result = await mockLogin(email);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

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

        {/* Google Login Button (UI only) */}
        <button
          type="button"
          disabled
          style={{
            width: '100%',
            padding: '0.85rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            fontSize: '0.95rem',
            fontWeight: '600',
            color: '#475569',
            cursor: 'not-allowed',
            opacity: 0.6,
            marginBottom: '1.25rem',
          }}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            style={{ width: '20px', height: '20px' }}
          />
          구글 계정으로 로그인 (준비중)
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>임시 테스트 로그인</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Mock login form */}
        <form onSubmit={handleMockLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
              학교 이메일
            </label>
            <input
              type="email"
              placeholder="본인@sasa.hs.kr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: error ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                outline: 'none',
                fontSize: '0.95rem',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; setError(''); }}
              onBlur={e => { if (!error) e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee2e2', color: '#991b1b', padding: '0.6rem 0.9rem',
              borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '10px',
              border: 'none',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'opacity 0.2s',
              marginTop: '0.25rem',
            }}
          >
            {loading ? '확인 중...' : '이메일로 입장하기'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
          * 실제 서비스에서는 구글 학교 계정 인증으로 대체됩니다.<br />
          * @sasa.hs.kr 이메일만 입장 가능합니다.
        </p>
      </div>
    </div>
  );
}
