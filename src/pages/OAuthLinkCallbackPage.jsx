import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

export default function OAuthLinkCallbackPage() {
  const navigate = useNavigate();
  const isRequestSent = useRef(false);

  useEffect(() => {
    if (isRequestSent.current) return;
    isRequestSent.current = true;

    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');
    // 주소창과 방문 기록에 code/state 가 남지 않도록 지운다.
    window.history.replaceState(null, '', window.location.pathname);

    if (!code || !state) {
      navigate('/profile?linkError=true');
      return;
    }

    // state 는 서버가 연동 시작 때 발급한 일회용 값이다. 누가 요청했는지는 서버가 기억한다.
    api.post('/auth/link/callback', { code, state })
      .then(res => navigate(`/profile?linked=${res.data.provider}`))
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
