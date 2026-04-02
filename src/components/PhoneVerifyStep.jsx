import { useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/components/PhoneVerifyStep.module.css';

export default function PhoneVerifyStep({ onCertified }) {

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.iamport.kr/v1/iamport.js';
        script.async = true;
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, []);

    const handleVerify = () => {
        const { IMP } = window;
        if (!IMP) return alert('본인인증 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.');

        IMP.init(import.meta.env.VITE_PORTONE_IMP_KEY);
        IMP.certification({
            merchant_uid: `cert_${Date.now()}`,
            channel_key: 'channel-key-9d22f33f-5c96-4c09-ace1-957763da1b9e',
            popup: true
        }, async (rsp) => {
            if (!rsp.success) return alert('본인인증이 실패했습니다.');

            try {
                const { data } = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/api/auth/certify`,
                    { impUid: rsp.imp_uid },
                    { withCredentials: true }
                );
                onCertified({ name: data.name, phone: data.phone, impUid: rsp.imp_uid });
            } catch {
                alert('본인인증 정보 확인에 실패했습니다.');
            }
        });
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.title}>본인인증</h2>
            <p className={styles.desc}>
                회원가입을 시작하려면 먼저 본인인증이 필요합니다.
            </p>
            <div className={styles.icon}>📱</div>
            <ul className={styles.list}>
                <li>휴대폰 택을 통해 본인인증을 진행합니다.</li>
                <li>인증 후 휴대폰 번호가 자동으로 입력됩니다.</li>
                <li>본인 명의의 휴대폰이 필요합니다.</li>
            </ul>
            <button className={styles.button} onClick={handleVerify}>
                휴대폰 본인인증 시작
            </button>
            <a href="/login" className={styles.link}>이미 계정이 있으신가요? 로그인</a>
        </div>
    );
}