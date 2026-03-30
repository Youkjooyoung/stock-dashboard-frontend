import styles from '../styles/components/StockTicker.module.css';

export default function StockTicker({ stocks }) {
  if (!stocks || stocks.length === 0) return null;

  // 거래량 상위 25개 선별
  const tickerStocks = [...stocks]
    .sort((a, b) => b.trqu - a.trqu)
    .slice(0, 25)
    .map(s => {
      const open  = s.mkp  || 0;
      const close = s.clpr || 0;
      const rate  = open > 0 ? ((close - open) / open * 100) : 0;
      return { ...s, rate };
    });

  // 끊김없는 루프를 위해 2배 복제
  const items = [...tickerStocks, ...tickerStocks];

  return (
    <div className={styles['stock-ticker']}>
      <div className={styles['ticker-label']}>실시간</div>
      <div className={styles['ticker-track-wrap']}>
        <div className={styles['ticker-track']}>
          {items.map((s, i) => {
            const cls  = s.rate > 0 ? 'up' : s.rate < 0 ? 'down' : 'zero';
            const sign = s.rate > 0 ? '▲' : s.rate < 0 ? '▼' : '-';
            return (
              <span key={i} className={styles['ticker-item']}>
                <span className={styles['ticker-name']}>{s.itmsNm}</span>
                <span className={`${styles['ticker-price']} ${cls}`}>
                  {(s.clpr || 0).toLocaleString()}
                </span>
                <span className={`${styles['ticker-rate']} ${cls}`}>
                  {sign}{Math.abs(s.rate).toFixed(2)}%
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
