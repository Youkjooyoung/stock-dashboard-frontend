import { useState } from 'react';
import api from '../api/axiosInstance';
import LogoMark from '../components/LogoMark';
import styles from '../styles/pages/ForgotPasswordPage.module.css';

export default function ForgotPasswordPage() {
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

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <LogoMark size={38} />
                <span className={styles.brand}>주식<span>대시보드</span></span>
            </div>

            <div className={styles.card}>
                {status === 'sent' ? (
                    <>
                        <div className={styles.icon}>✉️</div>
                        <h2 className={styles.title}>메일을 발송했습니다</h2>
                        <p className={styles.desc}>
                            <strong>{email}</strong> 으로<br />
                            비밀번호 재설정 링크를 발송했습니다.<br />
                            링크는 1시간 동안 유효합니다.
                        </p>
                        <a href="/login" className={styles.btn}>로그인 페이지로 이동</a>
                    </>
                ) : (
                    <>
                        <h2 className={styles.title}>비밀번호 찾기</h2>
                        <p className={styles.desc}>가입한 이메일을 입력하면 재설정 링크를 보내드립니다.</p>
                        <form className={styles.form} onSubmit={handleSubmit} noValidate>
                            <input
                                className={styles.input}
                                type="email"
                                placeholder="가입한 이메일 주소"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                            {error && <p className={styles.errorMsg}>{error}</p>}
                            <button className={styles.btn} type="submit" disabled={status === 'loading'}>
                                {status === 'loading' ? '발송 중...' : '재설정 링크 발송'}
                            </button>
                        </form>
                        <a href="/login" className={styles.backLink}>로그인으로 돌아가기</a>
                    </>
                )}
            </div>
        </div>
    );
}
