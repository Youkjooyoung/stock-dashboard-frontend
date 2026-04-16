import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import styles from '../styles/components/IdentityVerifyModal.module.css';

export default function IdentityVerifyModal({ onVerified, onClose, title, description }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.iamport.kr/v1/iamport.js';
        script.async = true;
        document.head.appendChild(script);
        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    const handleVerify = () => {
        const { IMP } = window;
        if (!IMP) {
            setError('본인인증 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        setError('');
        setLoading(true);

        IMP.init(import.meta.env.VITE_PORTONE_IMP_KEY);
        IMP.certification({
            merchant_uid: `cert_${Date.now()}`,
            channel_key: 'channel-key-9d22f33f-5c96-4c09-ace1-957763da1b9e',
            popup: true
        }, async (rsp) => {
            if (!rsp.success) {
                setLoading(false);
                setError('본인인증이 취소되었거나 실패했습니다.');
                return;
            }

            try {
                const { data } = await api.post('/auth/verify-identity', {
                    impUid: rsp.imp_uid
                });
                setLoading(false);
                onVerified(data.verifyToken);
            } catch (err) {
                setLoading(false);
                setError(err.response?.data?.message || '본인인증 확인에 실패했습니다.');
            }
        });
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h3 className={styles.title}>{title || '본인인증'}</h3>
                <p className={styles.desc}>
                    {description || '보안을 위해 본인인증이 필요합니다. 휴대폰 인증을 진행해주세요.'}
                </p>
                <div className={styles.icon}>🔐</div>

                {error && <p className={styles['error-msg']}>{error}</p>}

                {loading ? (
                    <p className={styles['loading-text']}>본인인증 확인 중...</p>
                ) : (
                    <>
                        <button className={styles['btn-verify']} onClick={handleVerify}>
                            휴대폰 본인인증
                        </button>
                        <button className={styles['btn-cancel']} onClick={onClose}>
                            취소
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
