import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

export default function OAuthLinkCallbackPage() {
  const navigate = useNavigate();
  const isRequestSent = useRef(false);

  useEffect(() => {
    if (isRequestSent.current) return;
    isRequestSent.current = true;

    const params     = new URLSearchParams(window.location.search);
    const code       = params.get('code');
    const state      = params.get('state');

    if (!code || !state) {
      navigate('/profile?linkError=true');
      return;
    }

    const colonIdx = state.indexOf(':');
    const provider = state.substring(0, colonIdx);
    const token    = state.substring(colonIdx + 1);

    if (!provider || !token) {
      navigate('/profile?linkError=true');
      return;
    }

    api.get(`/auth/${provider}/link/callback`, { params: { code, token } })
      .then(() => navigate(`/profile?linked=${provider}`))
      .catch(() => navigate('/profile?linkError=true'));
  }, [navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="auth-hero-emoji">🔗</div>
          <h2 className="auth-hero-title">계정 연동 처리 중...</h2>
          <p className="auth-hero-sub">잠시만 기다려 주세요.</p>
        </div>
      </div>
    </div>
  );
}
