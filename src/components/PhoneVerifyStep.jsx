import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { useToast } from '../hooks/useToast';
import shared from '../styles/pages/AuthShared.module.css';
import styles from '../styles/components/PhoneVerifyStep.toss.module.css';

export default function PhoneVerifyStep({ onCertified, onExistingFound }) {
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.iamport.kr/v1/iamport.js';
        script.async = true;
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, []);

    const handleVerify = () => {
        const { IMP } = window;
        if (!IMP) { showToast('본인인증 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.', 'warning'); return; }

        IMP.init(import.meta.env.VITE_PORTONE_IMP_KEY);
        IMP.certification({
            merchant_uid: `cert_${Date.now()}`,
            channel_key: 'channel-key-9d22f33f-5c96-4c09-ace1-957763da1b9e',
            popup: true
        }, async (rsp) => {
            if (!rsp.success) { showToast('본인인증이 실패했습니다.', 'error'); return; }

            try {
                const { data } = await axios.post(
                    `${API_BASE_URL}/api/auth/certify`,
                    { impUid: rsp.imp_uid },
                    { withCredentials: true }
                );
                if (data.existingMember === true && typeof onExistingFound === 'function') {
                    onExistingFound({
                        name: data.name,
                        phone: data.phone,
                        impUid: rsp.imp_uid,
                        provider: data.existingProvider ?? null,
                        maskedEmail: data.existingMaskedEmail ?? null,
                    });
                    return;
                }
                onCertified({ name: data.name, phone: data.phone, impUid: rsp.imp_uid });
            } catch {
                showToast('본인인증 정보 확인에 실패했습니다.', 'error');
            }
        });
    };

    return (
        <>
            <div className="auth-hero">
                <div className="auth-hero-emoji">📱</div>
                <h2 className="auth-hero-title">본인인증을<br/>진행해 주세요</h2>
                <p className="auth-hero-sub">회원가입 시작 전 본인 명의 휴대폰으로<br/>인증해 주세요</p>
            </div>

            <div className="auth-body">
                <ul className={styles['info-list']}>
                    <li>휴대폰 본인인증을 통해 본인을 확인합니다.</li>
                    <li>인증 후 휴대폰 번호가 자동으로 입력됩니다.</li>
                    <li>본인 명의의 휴대폰이 필요합니다.</li>
                </ul>
            </div>

            <div className="auth-cta-bar">
                <button type="button" className="auth-btn" onClick={handleVerify}>
                    휴대폰 본인인증 시작
                </button>
                <button
                    type="button"
                    className={`auth-btn auth-btn-secondary ${shared['btn-secondary-spaced']}`}
                    onClick={() => navigate('/login')}>
                    이미 계정이 있어요
                </button>
            </div>
        </>
    );
}
