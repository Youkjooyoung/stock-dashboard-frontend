import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import shared from '../styles/pages/AuthShared.module.css';
import styles from '../styles/components/EmailVerifyStep.toss.module.css';

export default function EmailVerifyStep({ email }) {
    const navigate = useNavigate();
    const [resendStatus, setResendStatus] = useState(null);

    const handleResend = async () => {
        setResendStatus('loading');
        try {
            await api.post('/auth/resend-verify', { email });
            setResendStatus('sent');
        } catch {
            setResendStatus('error');
        }
    };

    return (
        <>
            <div className="auth-hero">
                <div className="auth-hero-emoji">✉️</div>
                <h2 className="auth-hero-title">이메일 인증을<br/>완료해 주세요</h2>
                <p className="auth-hero-sub">아래 이메일로 인증 메일을 보냈어요.<br/>메일함에서 인증 버튼을 눌러주세요.</p>
                <div className="auth-email-pill">
                    <span className={shared['email-pill-icon']}>✉</span> {email}
                </div>
            </div>

            <div className="auth-body">
                <ul className={styles['info-list']}>
                    <li>이메일 수신함을 확인해 주세요.</li>
                    <li>스팸 메일함도 확인해 주세요.</li>
                    <li>링크는 24시간 동안 유효합니다.</li>
                </ul>
                {resendStatus === 'sent' && (
                    <p className="auth-help-msg">인증 메일을 재발송했습니다.</p>
                )}
                {resendStatus === 'error' && (
                    <p className="auth-error-msg">재발송에 실패했습니다. 잠시 후 다시 시도해주세요.</p>
                )}
            </div>

            <div className="auth-cta-bar">
                <button
                    type="button"
                    className="auth-btn"
                    onClick={() => navigate('/login')}>
                    로그인 페이지로 이동
                </button>
                <button
                    type="button"
                    className={`auth-btn auth-btn-secondary ${shared['btn-secondary-spaced']}`}
                    onClick={handleResend}
                    disabled={resendStatus === 'loading' || resendStatus === 'sent'}>
                    {resendStatus === 'loading' ? '발송 중...' : '인증 메일 재발송'}
                </button>
            </div>
        </>
    );
}
