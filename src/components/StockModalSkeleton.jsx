import styles from './StockModalSkeleton.module.css';

export function SkeletonChart() {
  return <div className={`skeleton ${styles['skeleton-chart']}`} />;
}

export function SkeletonNews() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <div key={i} className={styles['skeleton-news-item']}>
          <div className={`skeleton ${styles['skeleton-news-title']}`} />
          <div className={`skeleton ${styles['skeleton-news-desc']}`} />
          <div className={`skeleton ${styles['skeleton-news-date']}`} />
        </div>
      ))}
    </>
  );
}
