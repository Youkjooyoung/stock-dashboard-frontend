import React from 'react';
import styles from '../styles/components/PageState.module.css';

export function RouteLoading({ label = '화면을 불러오는 중입니다.' }) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default function PageState({
  tone = 'empty',
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <section
      className={`${styles.state} ${styles[tone] || ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <span className={styles.icon} aria-hidden="true">
        {tone === 'error' ? '!' : '–'}
      </span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  );
}
