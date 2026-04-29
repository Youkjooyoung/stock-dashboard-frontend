import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailVerifyStep from '../components/EmailVerifyStep';
import ExistingAccountStep from '../components/ExistingAccountStep';
import PhoneVerifyStep from '../components/PhoneVerifyStep';
import SignupFormStep from '../components/SignupFormStep';
import shared from '../styles/pages/AuthShared.module.css';
import styles from '../styles/pages/SignupPage.toss.module.css';

const STEP_LABELS = ['본인인증', '정보입력', '이메일인증'];

export default function SignupPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [certInfo, setCertInfo] = useState({ name: '', phone: '' });
    const [signupEmail, setSignupEmail] = useState('');
    const [existingInfo, setExistingInfo] = useState(null);

    const handleCertified = (info) => {
        setExistingInfo(null);
        setCertInfo(info);
        setStep(2);
    };

    const handleExistingFound = (info) => {
        setExistingInfo(info);
    };

    const handleRetry = () => {
        setExistingInfo(null);
        setCertInfo({ name: '', phone: '' });
        setStep(1);
    };

    const handleSignupComplete = (email) => {
        setSignupEmail(email);
        setStep(3);
    };

    const total = STEP_LABELS.length;
    const percent = Math.round((step / total) * 100);

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-topbar">
                    {step > 1 ? (
                        <button
                            type="button"
                            className="auth-back"
                            onClick={() => setStep(step - 1)}
                            aria-label="뒤로">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="auth-back"
                            onClick={() => navigate('/login')}
                            aria-label="로그인으로">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                    )}
                    <span className={shared['topbar-spacer']} />
                </div>

                <div className="auth-progress">
                    <div
                        className={`auth-progress-bar ${styles['progress-bar-dynamic']}`}
                        style={{ '--progress': `${percent}%` }}
                    />
                </div>
                <div className="auth-progress-meta">
                    <span>{step} / {total}</span>
                    <span>{percent}%</span>
                </div>
                <div className={styles['step-labels']}>
                    {STEP_LABELS.map((label, idx) => (
                        <span key={label} className={step === idx + 1 ? styles.active : ''}>
                            {label}
                        </span>
                    ))}
                </div>

                {step === 1 && existingInfo && (
                    <ExistingAccountStep
                        phone={existingInfo.phone}
                        provider={existingInfo.provider}
                        maskedEmail={existingInfo.maskedEmail}
                        onRetry={handleRetry}
                    />
                )}
                {step === 1 && !existingInfo && (
                    <PhoneVerifyStep
                        onCertified={handleCertified}
                        onExistingFound={handleExistingFound}
                    />
                )}
                {step === 2 && <SignupFormStep certInfo={certInfo} onComplete={handleSignupComplete} />}
                {step === 3 && <EmailVerifyStep email={signupEmail} />}
            </div>
        </div>
    );
}
