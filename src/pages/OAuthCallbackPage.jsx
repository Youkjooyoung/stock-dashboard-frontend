import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axiosInstance';

// 소셜 로그인에서 돌아오는 페이지. 두 가지 방식을 처리한다.
// 1) /oauth/kakao, /oauth/google?code=... : code 를 백엔드 /auth/{provider}/exchange 로 보내 토큰을 받는다.
// 2) /oauth#accessToken=... : 백엔드 /api/auth/{provider}/callback 이 토큰을 주소에 붙여 보내는 예전 방식.
//    운영 서버의 리다이렉트 주소가 1번으로 바뀐 것을 확인하면 2번과 백엔드 콜백을 함께 지운다.
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  // 개발 모드(StrictMode)에서는 effect 가 두 번 실행된다. code 는 한 번만 쓸 수 있으므로 두 번째 요청을 막는다.
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
      // 주소창과 방문 기록에서 토큰을 지운다.
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
