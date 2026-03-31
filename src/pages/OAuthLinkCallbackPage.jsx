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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ color: 'var(--text-2)', fontSize: 15 }}>계정 연동 처리 중...</p>
    </div>
  );
}