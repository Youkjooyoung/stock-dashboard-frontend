import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axiosInstance';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const isRequestSent = useRef(false);

  useEffect(() => {
    if (isRequestSent.current) return;
    isRequestSent.current = true;

    const hash   = window.location.hash.slice(1);
    const query  = window.location.search.slice(1);
    const params = new URLSearchParams(hash || query);

    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const code         = params.get('code');

    if (accessToken && refreshToken) {
      const email    = params.get('email') || '';
      const nickname = params.get('nickname') || '';
      const provider = params.get('provider') || 'kakao';
      const role     = params.get('role') || 'USER';
      setAuth(email, accessToken, refreshToken, null, role);
      localStorage.setItem('kakaoNickname', nickname);
      localStorage.setItem('provider', provider);
      navigate(role === 'ADMIN' ? '/admin' : '/');
    } else if (code) {
      const provider = window.location.pathname.includes('kakao') ? 'kakao' : 'google';
      api.get(`/auth/${provider}/exchange?code=${encodeURIComponent(code)}`)
        .then(res => {
          const { accessToken, refreshToken, email, nickname, role } = res.data;
          setAuth(email, accessToken, refreshToken, null, role || 'USER');
          localStorage.setItem('kakaoNickname', nickname || '');
          localStorage.setItem('provider', provider);
          navigate(role === 'ADMIN' ? '/admin' : '/');
        })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, [navigate, setAuth]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ color: 'var(--text-2)', fontSize: 15 }}>로그인 처리 중...</p>
    </div>
  );
}