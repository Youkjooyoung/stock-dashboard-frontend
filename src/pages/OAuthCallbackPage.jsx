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
      const userId   = params.get('userId') || null;
      window.history.replaceState(null, '', window.location.pathname);
      setAuth(email, accessToken, refreshToken, userId, role);
      localStorage.setItem('kakaoNickname', nickname);
      localStorage.setItem('provider', provider);
      navigate(role === 'ADMIN' ? '/admin' : '/');
    } else if (code) {
      const provider = window.location.pathname.includes('kakao') ? 'kakao' : 'google';
      api.get(`/auth/${provider}/exchange?code=${encodeURIComponent(code)}`)
        .then(res => {
          const { accessToken, refreshToken, email, nickname, role, userId } = res.data;
          setAuth(email, accessToken, refreshToken, userId || null, role || 'USER');
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="auth-hero-emoji">⏳</div>
          <h2 className="auth-hero-title">로그인 처리 중...</h2>
          <p className="auth-hero-sub">잠시만 기다려 주세요.</p>
        </div>
      </div>
    </div>
  );
}
