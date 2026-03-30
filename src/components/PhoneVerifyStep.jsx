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
        if (!IMP) return alert('ë³¸ì¸?¸ì¦ ëª¨ë“ˆ ë¡œë”© ì¤‘ì…?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„??ì£¼ì„¸??');

        IMP.init(import.meta.env.VITE_PORTONE_IMP_KEY);
        IMP.certification({
            merchant_uid: `cert_${Date.now()}`,
            channel_key: 'channel-key-9d22f33f-5c96-4c09-ace1-957763da1b9e',
            popup: true
        }, async (rsp) => {
            if (!rsp.success) return alert('ë³¸ì¸?¸ì¦???¤íŒ¨?ˆìŠµ?ˆë‹¤.');

            try {
                const { data } = await axios.post(
                    'https://api.jyyouk.shop/api/auth/certify',
                    { impUid: rsp.imp_uid },
                    { withCredentials: true }
                );
                onCertified({ name: data.name, phone: data.phone });
            } catch {
                alert('ë³¸ì¸?¸ì¦ ?•ë³´ ?•ì¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
            }
        });
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.title}>ë³¸ì¸?¸ì¦</h2>
            <p className={styles.desc}>
                ?Œì›ê°€?…ì„ ?œì‘?˜ë ¤ë©??´ë???ë³¸ì¸?¸ì¦???„ìš”?©ë‹ˆ??
            </p>
            <div className={styles.icon}>?“±</div>
            <ul className={styles.list}>
                <li>?µì‹ ??? íƒ ??ë³¸ì¸?¸ì¦??ì§„í–‰?©ë‹ˆ??</li>
                <li>?¸ì¦???´ë???ë²ˆí˜¸???ë™?¼ë¡œ ?…ë ¥?©ë‹ˆ??</li>
                <li>ë³¸ì¸ ëª…ì˜???´ë??°ì´ ?„ìš”?©ë‹ˆ??</li>
            </ul>
            <button className={styles.button} onClick={handleVerify}>
                ?´ë???ë³¸ì¸?¸ì¦ ?œì‘
            </button>
            <a href="/login" className={styles.link}>?´ë? ê³„ì •???ˆìœ¼? ê??? ë¡œê·¸??/a>
        </div>
    );
}
