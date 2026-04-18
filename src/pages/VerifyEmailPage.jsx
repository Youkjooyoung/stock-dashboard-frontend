import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import LogoMark from '../components/LogoMark';
import styles from '../styles/pages/VerifyEmailPage.module.css';

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

  return (
    <div className={styles['verify-page']}>
      <div className={styles['verify-page-header']}>
        <LogoMark size={38} />
        <span className={styles['verify-page-brand']}>주식<span>대시보드</span></span>
      </div>
      <div className={styles['verify-card']}>
        {status === 'loading' && (
          <>
            <div className={styles['verify-icon']}>⏳</div>
            <h2 className={styles['verify-title']}>인증 처리 중...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div className={styles['verify-icon']}>✅</div>
            <h2 className={styles['verify-title']}>이메일 인증이 완료됐습니다.</h2>
            <p className={styles['verify-desc']}>잠시 후 로그인 페이지로 이동합니다.</p>
            <a href="/login" className={styles['verify-btn']}>로그인 페이지로 이동</a>
          </>
        )}
        {status === 'error' && (
          <>
            <div className={styles['verify-icon']}>❌</div>
            <h2 className={styles['verify-title']}>인증에 실패했습니다.</h2>
            <p className={styles['verify-desc']}>인증 링크가 만료됐거나 유효하지 않습니다.</p>
            <div className={styles['resend-form']}>
              <input
                className={styles['resend-input']}
                type="email"
                placeholder="가입한 이메일 주소"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
              />
              <button
                className={styles['btn-resend']}
                onClick={handleResend}
                disabled={resendStatus === 'loading' || resendStatus === 'sent'}>
                {resendStatus === 'loading' ? '발송 중...' : '인증 메일 재발송'}
              </button>
            </div>
            {resendStatus === 'sent' && (
              <p className={styles['resend-msg-success']}>인증 메일을 재발송했습니다.</p>
            )}
            {resendStatus === 'error' && (
              <p className={styles['resend-msg-error']}>이메일을 확인하거나 잠시 후 다시 시도해주세요.</p>
            )}
            <a href="/login" className={styles['verify-btn']}>로그인 페이지로 이동</a>
          </>
        )}
      </div>
    </div>
  );
}
