import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import shared from '../styles/pages/AuthShared.module.css';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [status, setStatus]           = useState('loading');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(null);
  const called = useRef(false);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendStatus('loading');
    try {
      await api.post('/auth/resend-verify', { email: resendEmail });
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
      return;
    }
    api.get('/auth/verify-email', { params: { token } })
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-hero">
            <div className="auth-hero-emoji">⏳</div>
            <h2 className="auth-hero-title">인증 처리 중...</h2>
            <p className="auth-hero-sub">잠시만 기다려 주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-hero">
            <div className="auth-hero-emoji success">✅</div>
            <h2 className="auth-hero-title">이메일 인증이<br/>완료됐어요</h2>
            <p className="auth-hero-sub">잠시 후 로그인 페이지로 이동합니다.</p>
          </div>
          <div className="auth-cta-bar">
            <button type="button" className="auth-btn" onClick={() => navigate('/login')}>
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="auth-hero-emoji">❌</div>
          <h2 className="auth-hero-title">인증에 실패했어요</h2>
          <p className="auth-hero-sub">
            인증 링크가 만료됐거나 유효하지 않아요.<br/>
            이메일을 입력하고 인증 메일을 다시 받아보세요.
          </p>
        </div>
        <div className="auth-body">
          <div className="auth-field">
            <label className="auth-label">이메일</label>
            <input
              className="auth-input"
              type="email"
              placeholder="가입한 이메일 주소"
              value={resendEmail}
              onChange={e => setResendEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          {resendStatus === 'sent' && (
            <p className="auth-help-msg">인증 메일을 재발송했습니다. 받은 편지함을 확인해주세요.</p>
          )}
          {resendStatus === 'error' && (
            <p className="auth-error-msg">이메일을 확인하거나 잠시 후 다시 시도해주세요.</p>
          )}
        </div>
        <div className="auth-cta-bar">
          <button
            type="button"
            className="auth-btn"
            onClick={handleResend}
            disabled={!resendEmail || resendStatus === 'loading' || resendStatus === 'sent'}>
            {resendStatus === 'loading' ? '발송 중...' : '인증 메일 재발송'}
          </button>
          <button
            type="button"
            className={`auth-btn auth-btn-secondary ${shared['btn-secondary-spaced']}`}
            onClick={() => navigate('/login')}>
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
