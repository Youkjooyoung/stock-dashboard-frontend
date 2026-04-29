import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import shared from '../styles/pages/AuthShared.module.css';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail]   = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError]   = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) { setError('이메일을 입력해주세요.'); return; }
        setStatus('loading');
        setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setStatus('sent');
        } catch (err) {
            setError(err.response?.data?.message || '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            setStatus('idle');
        }
    };

    if (status === 'sent') {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-topbar">
                        <button type="button" className="auth-back" onClick={() => navigate('/login')} aria-label="뒤로">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                        <span className={shared['topbar-spacer']} />
                    </div>
                    <div className="auth-hero">
                        <div className="auth-hero-emoji success">📨</div>
                        <h2 className="auth-hero-title">메일을 발송했어요</h2>
                        <p className="auth-hero-sub">
                            아래 이메일로 비밀번호 재설정 링크를<br/>
                            보내드렸어요. 1시간 안에 확인해 주세요.
                        </p>
                        <div className="auth-email-pill">
                            <span className={shared['email-pill-icon']}>✉</span> {email}
                        </div>
                    </div>
                    <div className="auth-cta-bar">
                        <button
                            type="button"
                            className="auth-btn"
                            onClick={() => navigate('/login')}>
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
                <div className="auth-topbar">
                    <button type="button" className="auth-back" onClick={() => navigate('/login')} aria-label="뒤로">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <span className={shared['topbar-spacer']} />
                </div>
                <form className="auth-body" onSubmit={handleSubmit} noValidate>
                    <h1 className="auth-headline">비밀번호를<br/>잊으셨나요?</h1>
                    <p className="auth-sub">가입한 이메일을 입력하시면<br/>재설정 링크를 보내드릴게요</p>
                    <div className="auth-field">
                        <label className="auth-label">이메일</label>
                        <input
                            className="auth-input"
                            type="email"
                            placeholder="가입한 이메일 주소"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>
                    {error && <p className="auth-error-msg">{error}</p>}
                    <div className="auth-cta-bar">
                        <button
                            className="auth-btn"
                            type="submit"
                            disabled={status === 'loading' || !email.includes('@')}>
                            {status === 'loading' ? '발송 중...' : '재설정 링크 발송'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
