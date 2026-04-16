import { useMemo } from 'react';
import styles from '../styles/components/SummaryCards.module.css';

export default function SummaryCards({ stocks }) {
  const stats = useMemo(() => {
    if (stocks.length === 0) return null;

    let upCount = 0, downCount = 0, rateSum = 0;
    let topVol = stocks[0], topGainer = stocks[0];

    for (const s of stocks) {
      const diff = s.clpr - s.mkp;
      if (diff > 0) upCount++;
      else if (diff < 0) downCount++;

      const rate = s.mkp > 0 ? (diff / s.mkp * 100) : 0;
      rateSum += rate;

      if ((s.trqu || 0) > (topVol?.trqu || 0)) topVol = s;
      const topRate = topGainer?.mkp > 0 ? ((topGainer.clpr - topGainer.mkp) / topGainer.mkp * 100) : 0;
      if (rate > topRate) topGainer = s;
    }

    return {
      latestDate:   stocks[0]?.basDt || '-',
      upCount,
      downCount,
      flatCount:    stocks.length - upCount - downCount,
      avgRate:      rateSum / stocks.length,
      topVol,
      topGainer,
      topGainerRate: topGainer?.mkp > 0
        ? ((topGainer.clpr - topGainer.mkp) / topGainer.mkp * 100).toFixed(2)
        : '0.00',
    };
  }, [stocks]);

  if (!stats) return null;

  const { latestDate, upCount, downCount, flatCount, avgRate, topVol, topGainer, topGainerRate } = stats;

  return (
    <div className={styles['summary-cards']}>

      {/* 총 종목 수 */}
      <div className={`${styles['summary-card']} ${styles['color-green']}`}>
        <div className={styles['summary-card-header']}>
          <span className={styles['summary-label']}>TOTAL STOCKS</span>
          <span className={styles['summary-icon']} aria-hidden="true" />
        </div>
        <div className={styles['summary-value']}>
          {stocks.length.toLocaleString()}
        </div>
        <div className={styles['summary-sub']}>기준일 {latestDate}</div>
      </div>

      {/* 등락 현황 */}
      <div className={`${styles['summary-card']} ${styles['color-up']}`}>
        <div className={styles['summary-card-header']}>
          <span className={styles['summary-label']}>ADV / FLAT / DEC</span>
          <span className={styles['summary-icon']} aria-hidden="true" />
        </div>
        <div className={styles['summary-stat-row']}>
          <span className={styles['summary-stat-up']}>{upCount}</span>
          <span className={styles['summary-stat-sep']}>/</span>
          <span className={styles['summary-stat-flat']}>{flatCount}</span>
          <span className={styles['summary-stat-sep']}>/</span>
          <span className={styles['summary-stat-down']}>{downCount}</span>
        </div>
        <div className={`${styles['summary-sub']} ${avgRate > 0 ? styles['color-up'] : avgRate < 0 ? styles['color-down'] : ''}`}>
          평균 {avgRate >= 0 ? '+' : ''}{avgRate.toFixed(2)}%
        </div>
      </div>

      {/* 최고 거래량 */}
      <div className={`${styles['summary-card']} ${styles['color-warning']}`}>
        <div className={styles['summary-card-header']}>
          <span className={styles['summary-label']}>TOP VOLUME</span>
          <span className={styles['summary-icon']} aria-hidden="true" />
        </div>
        <div className={`${styles['summary-value-name']} ${styles['color-warning']}`}>
          {topVol?.itmsNm || '-'}
        </div>
        <div className={styles['summary-sub']}>{(topVol?.trqu || 0).toLocaleString()}주</div>
      </div>

      {/* 최고 상승 */}
      <div className={`${styles['summary-card']} ${styles['color-up']}`}>
        <div className={styles['summary-card-header']}>
          <span className={styles['summary-label']}>TOP GAINER</span>
          <span className={styles['summary-icon']} aria-hidden="true" />
        </div>
        <div className={`${styles['summary-value-name']} ${styles['color-up']}`}>
          {topGainer?.itmsNm || '-'}
        </div>
        <div className={`${styles['summary-sub']} ${styles['color-up']}`}>
          +{topGainerRate}%
        </div>
      </div>

    </div>
  );
}
