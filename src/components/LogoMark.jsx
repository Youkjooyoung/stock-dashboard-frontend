import styles from '../styles/components/LogoMark.module.css';

export default function LogoMark({ size = 28, title = '주식 대시보드 로고' }) {
  return (
    <img
      className={styles['logo-mark']}
      src="/stock-logo.png"
      alt={title}
      width={size}
      height={size}
      decoding="async"
    />
  );
}
