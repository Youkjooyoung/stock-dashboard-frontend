import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import styles from '../styles/pages/ResetPasswordPage.module.css';

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

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.logo}>S</div>
                <span className={styles.brand}>주식<span>대시보드</span></span>
            </div>

            <div className={styles.card}>
                {status === 'invalid' && (
                    <>
                        <div className={styles.icon}>❌</div>
                        <h2 className={styles.title}>유효하지 않은 링크입니다</h2>
                        <p className={styles.desc}>링크가 만료됐거나 올바르지 않습니다.<br />비밀번호 찾기를 다시 시도해주세요.</p>
                        <a href="/forgot-password" className={styles.btn}>비밀번호 찾기</a>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className={styles.icon}>✅</div>
                        <h2 className={styles.title}>비밀번호가 변경됐습니다</h2>
                        <p className={styles.desc}>잠시 후 로그인 페이지로 이동합니다.</p>
                        <a href="/login" className={styles.btn}>로그인 페이지로 이동</a>
                    </>
                )}
                {(status === 'idle' || status === 'loading') && token && (
                    <>
                        <h2 className={styles.title}>새 비밀번호 설정</h2>
                        <p className={styles.desc}>새로 사용할 비밀번호를 입력해주세요.</p>
                        <form className={styles.form} onSubmit={handleSubmit} noValidate>
                            <div className={styles.pwWrap}>
                                <input
                                    className={styles.input}
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="새 비밀번호 (6~12자, 2종류 이상 혼합)"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <button type="button" className={styles.eye} onClick={() => setShowPw(p => !p)}>
                                    {showPw ? '숨기기' : '보기'}
                                </button>
                            </div>
                            <div className={styles.pwWrap}>
                                <input
                                    className={styles.input}
                                    type={showPwC ? 'text' : 'password'}
                                    placeholder="비밀번호 확인"
                                    value={passwordConfirm}
                                    onChange={e => setPasswordConfirm(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <button type="button" className={styles.eye} onClick={() => setShowPwC(p => !p)}>
                                    {showPwC ? '숨기기' : '보기'}
                                </button>
                            </div>
                            {pwError && <p className={styles.errorMsg}>{pwError}</p>}
                            {error  && <p className={styles.errorMsg}>{error}</p>}
                            <button className={styles.btn} type="submit" disabled={status === 'loading'}>
                                {status === 'loading' ? '변경 중...' : '비밀번호 변경'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
