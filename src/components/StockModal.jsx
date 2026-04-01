import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import StockChat from './StockChat';
import AlertSetter from './AlertSetter';
import AiAnalysis from './AiAnalysis';
import CandlestickChart from './CandlestickChart';
import { useStockDetail, useStockNews, useCollectTickerHistory } from '../hooks/useQueries';
import { SkeletonChart, SkeletonNews } from './StockModalSkeleton';
import styles from '../styles/components/StockModal.module.css';

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: ctx => `종가: ${ctx.raw?.toLocaleString()}원`
      }
    }
  },
  scales: {
    y: {
      ticks: { callback: v => v.toLocaleString() },
      grid: { color: 'rgba(0,0,0,0.05)' }
    },
    x: { grid: { display: false } }
  }
};

const PERIODS = ['일', '주', '월'];

// 수집 기간 옵션
const COLLECT_RANGES = [
  { label: '1년',  months: 12 },
  { label: '3년',  months: 36 },
  { label: '5년',  months: 60 },
  { label: '최대', months: 240 },
];

function toYYYYMMDD(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

export default function StockModal({ stock, onClose }) {
  const [chartType,    setChartType]    = useState('candle');
  const [period,       setPeriod]       = useState('일');
  const [collectOpen,  setCollectOpen]  = useState(false);

  const { data: detailData = [], isLoading: chartLoading } = useStockDetail(stock?.srtnCd);
  const { data: news = [],       isLoading: newsLoading  } = useStockNews(stock?.itmsNm);
  const collectMutation = useCollectTickerHistory(stock?.srtnCd);

  function handleCollect(months) {
    const end   = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    collectMutation.mutate(
      { startDate: toYYYYMMDD(start), endDate: toYYYYMMDD(end) },
      { onSuccess: () => setCollectOpen(false) }
    );
  }

  if (!stock) return null;

  const open  = stock.mkp  || 0;
  const close = stock.clpr || 0;
  const high  = stock.hipr || 0;
  const low   = stock.lopr || 0;
  const vol   = stock.trqu || 0;
  const diff  = close - open;
  const rate  = open > 0 ? ((diff / open) * 100) : 0;
  const cls   = rate > 0 ? 'up' : rate < 0 ? 'down' : 'zero';
  const sign  = rate > 0 ? '▲' : rate < 0 ? '▼' : '-';

  const stats = [
    { label: '시가',   value: open.toLocaleString()  + '원' },
    { label: '종가',   value: close.toLocaleString() + '원', cls },
    { label: '고가',   value: high.toLocaleString()  + '원', cls: 'up' },
    { label: '저가',   value: low.toLocaleString()   + '원', cls: 'down' },
    { label: '거래량', value: vol.toLocaleString() },
    { label: '등락률', value: `${sign} ${Math.abs(diff).toLocaleString()}원 (${rate.toFixed(2)}%)`, cls },
  ];

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={styles['modal-box']} onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div className={styles['modal-header']}>
          <div className={styles['modal-title-block']}>
            <h2 className={styles['modal-stock-name']}>{stock.itmsNm}</h2>
            <div className={styles['modal-stock-meta']}>
              <span className={styles['modal-stock-code']}>{stock.srtnCd}</span>
              <span className={styles['modal-stock-sep']}>·</span>
              <span className="market-badge">{stock.mrktCtg || 'KOSPI'}</span>
              <span className={styles['modal-stock-sep']}>·</span>
              <span>{stock.basDt}</span>
            </div>
          </div>
          <button className={styles['modal-close']} onClick={onClose}>✕</button>
        </div>

        {/* 본문 */}
        <div className={styles['modal-body']}>

          {/* 핵심 지표 */}
          <div className={styles['modal-stats']}>
            {stats.map((s, i) => (
              <div key={i} className={styles['modal-stat-item']}>
                <div className={styles['modal-stat-label']}>{s.label}</div>
                <div className={`${styles['modal-stat-value']} ${s.cls || ''}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* 알림 설정 */}
          <AlertSetter stock={stock} />

          {/* 종가 추이 차트 */}
          <div className={styles['modal-chart-wrap']}>
            <div className={styles['modal-chart-header']}>
              <div className={styles['modal-section-title']}>
                📈 종가 추이
                <span className={styles['modal-data-count']}>({detailData.length}일)</span>
              </div>
              <div className={styles['modal-chart-controls']}>
                {/* 과거 데이터 수집 */}
                <div className={styles['collect-wrap']}>
                  <button
                    className={styles['btn-collect']}
                    onClick={() => setCollectOpen(v => !v)}
                    disabled={collectMutation.isPending}>
                    {collectMutation.isPending ? '수집 중...' : '📥 과거 데이터'}
                  </button>
                  {collectOpen && (
                    <div className={styles['collect-dropdown']}>
                      {COLLECT_RANGES.map(r => (
                        <button key={r.label} className={styles['collect-option']}
                          onClick={() => handleCollect(r.months)}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* 기간 선택 */}
                <div className={styles['modal-chart-tab-group']}>
                  {PERIODS.map(p => (
                    <button
                      key={p}
                      className={`${styles['modal-chart-tab']} ${period === p ? styles.active : ''}`}
                      onClick={() => setPeriod(p)}>
                      {p}
                    </button>
                  ))}
                </div>
                {/* 차트 타입 */}
                <div className={styles['modal-chart-tab-group']}>
                  <button
                    className={`${styles['modal-chart-tab']} ${chartType === 'candle' ? styles.active : ''}`}
                    onClick={() => setChartType('candle')}>
                    캔들
                  </button>
                  <button
                    className={`${styles['modal-chart-tab']} ${chartType === 'line' ? styles.active : ''}`}
                    onClick={() => setChartType('line')}>
                    라인
                  </button>
                </div>
              </div>
            </div>
            {chartLoading ? (
              <SkeletonChart />
            ) : detailData.length > 0 ? (
              chartType === 'candle' ? (
                <CandlestickChart data={detailData} period={period} height={280} />
              ) : (
                <Line
                  data={{
                    labels: detailData.map(d => {
                      const dt = d.basDt;
                      return `${dt.slice(4,6)}/${dt.slice(6,8)}`;
                    }),
                    datasets: [{
                      label: '종가',
                      data: detailData.map(d => d.clpr),
                      borderColor: 'var(--primary)',
                      backgroundColor: 'rgba(59,91,219,0.07)',
                      tension: 0.35,
                      fill: true,
                      pointRadius: 3,
                      pointHoverRadius: 5,
                      pointBackgroundColor: 'var(--primary)',
                    }]
                  }}
                  options={chartOptions}
                />
              )
            ) : (
              <div className={styles['modal-chart-loading']}>데이터가 없습니다.</div>
            )}
          </div>

          {/* 관련 뉴스 */}
          <div className={styles['modal-news-wrap']}>
            <div className={styles['modal-section-title']}>📰 관련 뉴스</div>
            {newsLoading ? (
              <SkeletonNews />
            ) : news.length > 0 ? (
              news.map((n, i) => (
                <a key={i}
                  href={n.originallink || n.link}
                  target="_blank"
                  rel="noreferrer"
                  className={styles['modal-news-item']}>
                  <div className={styles['modal-news-title']}>{n.title}</div>
                  <div className={styles['modal-news-desc']}>{n.description}</div>
                  <div className={styles['modal-news-date']}>{formatDate(n.pubDate)}</div>
                </a>
              ))
            ) : (
              <div className={styles['modal-news-empty']}>관련 뉴스가 없습니다.</div>
            )}
          </div>

          {/* AI 종목 분석 */}
          <AiAnalysis type="stock" stock={stock} />

          {/* 실시간 토론 채팅 */}
          <StockChat ticker={stock.srtnCd} stockName={stock.itmsNm} />

        </div>
      </div>
    </div>
  );
}
