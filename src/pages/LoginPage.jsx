import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import { API_BASE_URL } from '../config/env';
import styles from '../styles/pages/LoginPage.toss.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const prefillEmail = location.state?.prefillEmail || '';
  const [email, setEmail]           = useState(prefillEmail || localStorage.getItem('savedEmail') || '');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('savedEmail'));
  const [showPw, setShowPw]         = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [cooldown, setCooldown]     = useState(0);
  const cooldownRef                 = useRef(null);

  useEffect(() => {
    return () => clearInterval(cooldownRef.current);
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`;
  };

  const handleKakaoLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/kakao/login`;
  };

  const handleLogin = async () => {
    setError('');
    setShowResend(false);
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, userId, role, forcePwChange } = res.data;
      setAuth(email, accessToken, refreshToken, userId, role);
      if (rememberMe) localStorage.setItem('savedEmail', email);
      else localStorage.removeItem('savedEmail');
      if (forcePwChange) {
        sessionStorage.setItem('forcePwChange', 'Y');
        navigate('/change-password');
        return;
      }
      navigate(role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      const msg = err.response?.data?.message || '로그인에 실패했습니다.';
      setError(msg);
      if (msg === '이메일 인증이 필요합니다.') setShowResend(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendStatus === 'loading') return;
    setResendStatus('loading');
    try {
      await api.post('/auth/resend-verify', { email });
      setResendStatus('sent');
      setCooldown(60);
      cooldownRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setResendStatus('error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <form className="auth-body" onSubmit={handleSubmit} noValidate>
          <h1 className="auth-headline">반가워요!<br/>로그인해 주세요</h1>
          <p className="auth-sub">관심 종목을 관리하고 시장을 분석하세요</p>

          <div className="auth-field">
            <label className="auth-label">이메일</label>
            <input
              className="auth-input"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">비밀번호</label>
            <div className="auth-input-row">
              <input
                className="auth-input"
                type={showPw ? 'text' : 'password'}
                placeholder="비밀번호 입력"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-input-eye"
                onClick={() => setShowPw(p => !p)}
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className={styles['remember-row']}>
            <label className="check-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              아이디 기억하기
            </label>
            <a href="/forgot-password" className={styles['forgot-link']}>비밀번호 찾기</a>
          </div>

          {error && <p className="auth-error-msg">{error}</p>}

          {showResend && (
            <div className={styles['resend-box']}>
              <p className={styles['resend-desc']}>인증 메일을 받지 못하셨나요?</p>
              <button
                className={styles['btn-resend']}
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resendStatus === 'loading'}>
                {resendStatus === 'loading'
                  ? '발송 중...'
                  : cooldown > 0
                  ? `재발송 (${cooldown}초)`
                  : '인증 메일 재발송'}
              </button>
              {resendStatus === 'sent' && (
                <p className={styles['resend-msg-success']}>인증 메일을 재발송했습니다. 받은 편지함을 확인해주세요.</p>
              )}
              {resendStatus === 'error' && (
                <p className={styles['resend-msg-error']}>발송에 실패했습니다. 잠시 후 다시 시도해주세요.</p>
              )}
            </div>
          )}

          <div className="auth-cta-bar">
            <button
              className="auth-btn"
              type="submit"
              disabled={loading}>
              {loading ? '처리 중...' : '로그인'}
            </button>

            <div className="auth-divider">또는</div>

            <div className="auth-social">
              <button type="button" className="auth-social-btn kakao" onClick={handleKakaoLogin}>
                <span className="icon-circle">K</span>
                카카오로 로그인
              </button>
              <button type="button" className="auth-social-btn google" onClick={handleGoogleLogin}>
                <span className="icon-circle">G</span>
                Google로 로그인
              </button>
            </div>

            <div className="auth-foot">
              계정이 없으신가요?
              <button
                type="button"
                className={styles['toggle-link']}
                onClick={() => navigate('/signup')}>
                회원가입
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
