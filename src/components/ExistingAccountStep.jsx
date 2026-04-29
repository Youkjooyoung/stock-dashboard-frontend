import { useNavigate } from 'react-router-dom';
import { maskPhone } from '../utils/maskUtils';
import shared from '../styles/pages/AuthShared.module.css';
import styles from '../styles/components/ExistingAccountStep.module.css';

const PROVIDER_LABELS = {
  EMAIL: '이메일',
  KAKAO: '카카오',
  GOOGLE: '구글',
};

const PROVIDER_ICONS = {
  EMAIL: '@',
  KAKAO: 'K',
  GOOGLE: 'G',
};

export default function ExistingAccountStep({ phone, provider, maskedEmail, onRetry }) {
  const navigate = useNavigate();

  const providerKey = provider ? String(provider).toUpperCase() : 'EMAIL';
  const providerLabel = PROVIDER_LABELS[providerKey] || '이메일';
  const providerIcon = PROVIDER_ICONS[providerKey] || '@';
  const providerCls = providerKey.toLowerCase();

  const handleGoLogin = () => {
    navigate('/login', { state: { prefillEmail: maskedEmail || '' } });
  };

  return (
    <>
      <div className="auth-hero">
        <div className="auth-hero-emoji">👤</div>
        <h2 className="auth-hero-title">이미 가입된<br/>계정이에요</h2>
        <p className="auth-hero-sub">
          본인인증된 휴대폰 번호로<br/>이미 가입된 계정이 있어요
        </p>
        <div className="auth-email-pill">
          <span className={`${shared['email-pill-icon']} ${styles['phone-icon']}`}>📱</span>
          {maskPhone(phone)}
        </div>
        <div className={styles['provider-pill']}>
          <span className={`${styles['provider-icon']} ${styles[providerCls]}`}>{providerIcon}</span>
          <span className={styles['provider-name']}>{providerLabel}</span>
          {maskedEmail && <span className={styles['masked-email']}>· {maskedEmail}</span>}
        </div>
      </div>

      <div className="auth-cta-bar">
        <button type="button" className="auth-btn" onClick={handleGoLogin}>
          로그인하러 가기
        </button>
        <button
          type="button"
          className={`auth-btn auth-btn-secondary ${shared['btn-secondary-spaced']}`}
          onClick={onRetry}>
          다른 계정으로 가입
        </button>
      </div>
    </>
  );
}
