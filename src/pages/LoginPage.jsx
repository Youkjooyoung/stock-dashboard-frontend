import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import styles from '../styles/pages/LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [email, setEmail]           = useState(localStorage.getItem('savedEmail') || '');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('savedEmail'));
  const [showPw, setShowPw]         = useState(false);

  const BASE = import.meta.env.VITE_API_BASE_URL;

  const handleGoogleLogin = () => { window.location.href = `${BASE}/api/auth/google/login`; };
  const handleKakaoLogin  = () => { window.location.href = `${BASE}/api/auth/kakao/login`; };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, userId } = res.data;
      setAuth(email, accessToken, refreshToken, userId);
      if (rememberMe) localStorage.setItem('savedEmail', email);
      else localStorage.removeItem('savedEmail');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className={styles['login-page']}>

      <div className={styles['login-page-header']}>
        <div className={styles['login-page-logo']}>S</div>
        <span className={styles['login-page-brand']}>주식<span>대시보드</span></span>
      </div>

      <div className={styles['login-card']}>
        <h2 className={styles['login-card-title']}>로그인</h2>
        <p className={styles['login-card-subtitle']}>관심 종목을 관리하고 시장을 분석하세요</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              className="form-input"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <div className="input-wrap">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="비밀번호 입력"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button className="pw-toggle" type="button" onClick={() => setShowPw(p => !p)}>
                {showPw ? '숨기기' : '보기'}
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
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button
            className={styles['btn-login-submit']}
            type="submit"
            disabled={loading}>
            {loading ? <><span className="spinner" />처리 중...</> : '로그인'}
          </button>
        </form>

        <div className={styles['divider-or']}>또는</div>
        <div className={styles['social-btn-group']}>
          <button className={styles['btn-kakao-login']} type="button" onClick={handleKakaoLogin}>
            <span className={styles['kakao-icon']}>💬</span>
            카카오로 로그인
          </button>
          <button className={styles['btn-google-login']} type="button" onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google로 로그인
          </button>
        </div>

        <p className={styles['login-toggle']}>
          계정이 없으신가요?{' '}
          <span className={styles['login-toggle-link']} onClick={() => navigate('/signup')}>
            회원가입
          </span>
        </p>
      </div>
    </div>
  );
}