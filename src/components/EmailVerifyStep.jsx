import styles from '../styles/components/EmailVerifyStep.module.css';

export default function EmailVerifyStep({ email }) {
    return (
        <div className={styles.card}>
            <div className={styles.icon}>✉️</div>
            <h2 className={styles.title}>이메일 인증</h2>
            <p className={styles.desc}>
                <strong className={styles.email}>{email}</strong> 으로<br />
                인증 메일을 발송했습니다.
            </p>
            <ul className={styles.list}>
                <li>이메일 수신함을 확인해 주세요.</li>
                <li>스팸 메일함도 확인해 주세요.</li>
                <li>링크는 24시간 동안 유효합니다.</li>
            </ul>
            <a href="/login" className={styles.button}>
                로그인 페이지로 이동
            </a>
        </div>
    );
}