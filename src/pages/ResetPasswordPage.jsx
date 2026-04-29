import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

function validatePassword(pw) {
    if (!pw) return '비밀번호를 입력해주세요.';
    if (pw.length < 6 || pw.length > 12) return '비밀번호는 6~12자여야 합니다.';
    const hasLetter  = /[가-힣a-zA-Z]/.test(pw);
    const hasNumber  = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?~`]/.test(pw);
    const types = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
    if (types < 2) return '영문·숫자·특수문자 중 2가지 이상을 혼합해야 합니다.';
    return null;
}

export default function ResetPasswordPage() {
    const navigate    = useNavigate();
    const [token, setToken]             = useState('');
    const [password, setPassword]       = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPw, setShowPw]           = useState(false);
    const [showPwC, setShowPwC]         = useState(false);
    const [status, setStatus]           = useState('idle');
    const [error, setError]             = useState('');
    const [pwError, setPwError]         = useState('');
    const called = useRef(false);

    useEffect(() => {
        if (called.current) return;
        called.current = true;
        const t = new URLSearchParams(window.location.search).get('token');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!t) { setStatus('invalid'); return; }
        setToken(t);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validatePassword(password);
        if (err) { setPwError(err); return; }
        if (password !== passwordConfirm) { setPwError('비밀번호가 일치하지 않습니다.'); return; }
        setPwError('');
        setError('');
        setStatus('loading');
        try {
            await api.post('/auth/reset-password', { token, password });
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || '오류가 발생했습니다.');
            setStatus('idle');
        }
    };

    if (status === 'invalid') {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-hero">
                        <div className="auth-hero-emoji">❌</div>
                        <h2 className="auth-hero-title">유효하지 않은 링크예요</h2>
                        <p className="auth-hero-sub">
                            링크가 만료됐거나 올바르지 않아요.<br/>
                            비밀번호 찾기를 다시 시도해주세요.
                        </p>
                    </div>
                    <div className="auth-cta-bar">
                        <button type="button" className="auth-btn" onClick={() => navigate('/forgot-password')}>
                            비밀번호 찾기
                        </button>
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
                        <h2 className="auth-hero-title">비밀번호가 변경됐어요</h2>
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

    if (!token) return null;

    return (
        <div className="auth-page">
            <div className="auth-card">
                <form className="auth-body" onSubmit={handleSubmit} noValidate>
                    <h1 className="auth-headline">새 비밀번호를<br/>설정해 주세요</h1>
                    <p className="auth-sub">새 비밀번호로 다시 로그인해 주세요</p>

                    <div className="auth-field">
                        <label className="auth-label">새 비밀번호</label>
                        <div className="auth-input-row">
                            <input
                                className="auth-input"
                                type={showPw ? 'text' : 'password'}
                                placeholder="6~12자, 2종류 이상 혼합"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="new-password"
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

                    <div className="auth-field">
                        <label className="auth-label">비밀번호 확인</label>
                        <div className="auth-input-row">
                            <input
                                className={`auth-input ${passwordConfirm && password !== passwordConfirm ? 'error' : ''}`}
                                type={showPwC ? 'text' : 'password'}
                                placeholder="다시 한 번 입력"
                                value={passwordConfirm}
                                onChange={e => setPasswordConfirm(e.target.value)}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="auth-input-eye"
                                onClick={() => setShowPwC(p => !p)}
                                aria-label={showPwC ? '비밀번호 숨기기' : '비밀번호 보기'}>
                                {showPwC ? '🙈' : '👁'}
                            </button>
                        </div>
                        {passwordConfirm && password !== passwordConfirm && (
                            <p className="auth-error-msg">비밀번호가 일치하지 않아요</p>
                        )}
                    </div>

                    {pwError && <p className="auth-error-msg">{pwError}</p>}
                    {error  && <p className="auth-error-msg">{error}</p>}

                    <div className="auth-cta-bar">
                        <button
                            className="auth-btn"
                            type="submit"
                            disabled={status === 'loading' || !password || password !== passwordConfirm}>
                            {status === 'loading' ? '변경 중...' : '재설정 완료'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
