import styles from './StockListSkeleton.module.css';

export function SkeletonCards() {
  return (
    <div className={styles['summary-cards-skeleton']}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className={styles['skeleton-card']}>
          <div className={`skeleton ${styles['skeleton-line']}`} />
          <div className={`skeleton ${styles['skeleton-val']}`} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className={styles['table-skeleton']}>
      <div className={`skeleton ${styles['table-skeleton-toolbar']}`} />
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`skeleton ${styles['table-skeleton-row']}`} />
      ))}
    </div>
  );
}
