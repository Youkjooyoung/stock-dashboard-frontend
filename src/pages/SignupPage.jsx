import { useState } from 'react';
import EmailVerifyStep from '../components/EmailVerifyStep';
import PhoneVerifyStep from '../components/PhoneVerifyStep';
import SignupFormStep from '../components/SignupFormStep';
import styles from '../styles/pages/SignupPage.module.css';

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [certInfo, setCertInfo] = useState({ name: '', phone: '' });
    const [signupEmail, setSignupEmail] = useState('');

    const handleCertified = (info) => {
        setCertInfo(info);
        setStep(2);
    };

    const handleSignupComplete = (email) => {
        setSignupEmail(email);
        setStep(3);
    };

    return (
        <div className={styles.container}>
            <div className={styles.stepIndicator}>
                <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>본인인증</div>
                <div className={styles.line} />
                <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>정보입력</div>
                <div className={styles.line} />
                <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>이메일인증</div>
            </div>

            {step === 1 && <PhoneVerifyStep onCertified={handleCertified} />}
            {step === 2 && <SignupFormStep certInfo={certInfo} onComplete={handleSignupComplete} />}
            {step === 3 && <EmailVerifyStep email={signupEmail} />}
        </div>
    );
}