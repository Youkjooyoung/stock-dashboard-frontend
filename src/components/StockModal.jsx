import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'motion/react';
import { Line } from 'react-chartjs-2';
import StockChat from './StockChat';
import AlertSetter from './AlertSetter';
import AiAnalysis from './AiAnalysis';
import CandlestickChart from './CandlestickChart';
import AnimatedNumber, { formatters } from './AnimatedNumber';
import { useStockDetail, useStockNews, useCollectTickerHistory } from '../hooks/useQueries';
import { SkeletonChart, SkeletonNews } from './StockModalSkeleton';
import { toYYYYMMDD, formatNewsDate } from '../utils/dateUtils';
import styles from '../styles/components/StockModal.module.css';

let scrollLockCount = 0;
let savedHtmlOverflow = '';

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    const html = document.documentElement;
    savedHtmlOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.documentElement.style.overflow = savedHtmlOverflow;
  }
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(11, 13, 16, 0.9)',
      padding: 10,
      titleFont: { size: 12, weight: '600' },
      bodyFont: { size: 11 },
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      callbacks: { label: ctx => `종가: ${ctx.raw?.toLocaleString()}원` }
    }
  },
  scales: {
    y: {
      ticks: { callback: v => v.toLocaleString(), font: { size: 11 } },
      grid: { color: 'rgba(0,0,0,0.05)' }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
};

const PERIODS = ['일', '주', '월'];
const COLLECT_RANGES = [
  { label: '1년',  months: 12 },
  { label: '3년',  months: 36 },
  { label: '5년',  months: 60 },
  { label: '최대', months: 240 },
];

const TABS = [
  { key: 'overview', label: '개요' },
  { key: 'chart',    label: '차트' },
  { key: 'news',     label: '뉴스' },
  { key: 'ai',       label: 'AI 분석' },
  { key: 'chat',     label: '토론' },
];

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.97, y: 8 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.2, ease: [0.2, 0, 0.1, 1] }
  },
  exit:    { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } }
};

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } }
};

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

export default function StockModal({ stock, onClose }) {
  const [chartType, setChartType] = useState('candle');
  const [period, setPeriod] = useState('일');
  const [collectOpen, setCollectOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const tabGroupRef = useRef(null);
  const modalBodyRef = useRef(null);

  const { data: detailData = [], isLoading: chartLoading } = useStockDetail(stock?.srtnCd);
  const { data: news = [], isLoading: newsLoading } = useStockNews(stock?.itmsNm);

  useEffect(() => {
    if (!stock) return;
    lockBodyScroll();
    return unlockBodyScroll;
  }, [stock]);

  useLayoutEffect(() => {
    const el = modalBodyRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [stock?.srtnCd, activeTab]);

  const collectMutation = useCollectTickerHistory(stock?.srtnCd);

  function handleCollect(months) {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    collectMutation.mutate(
      { startDate: toYYYYMMDD(start), endDate: toYYYYMMDD(end) },
      { onSuccess: () => setCollectOpen(false) }
    );
  }

  if (!stock) return null;

  const open = stock.mkp || 0;
  const close = stock.clpr || 0;
  const high = stock.hipr || 0;
  const low = stock.lopr || 0;
  const vol = stock.trqu || 0;
  const diff = close - open;
  const rate = open > 0 ? ((diff / open) * 100) : 0;
  const cls = rate > 0 ? 'up' : rate < 0 ? 'down' : 'zero';
  const sign = rate > 0 ? '▲' : rate < 0 ? '▼' : '−';

  const stats = [
    { label: '시가', value: open, cls: '' },
    { label: '종가', value: close, cls },
    { label: '고가', value: high, cls: 'up' },
    { label: '저가', value: low, cls: 'down' },
    { label: '거래량', value: vol, cls: '', isVolume: true },
    { label: '등락률', value: rate, diff, cls, isRate: true },
  ];

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={styles['modal-overlay']}
        onClick={onClose}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit">

        <motion.div
          className={styles['modal-box']}
          onClick={e => e.stopPropagation()}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit">

          {/* 헤더 (항상 상단 고정) */}
          <div className={styles['modal-header']}>
            <div className={styles['modal-title-block']}>
              <h2 className={styles['modal-stock-name']}>{stock.itmsNm}</h2>
              <div className={styles['modal-stock-meta']}>
                <span className={styles['modal-stock-code']}>{stock.srtnCd}</span>
                <span className={styles['modal-stock-sep']}>·</span>
                <span className="market-badge">{stock.mrktCtg || 'KOSPI'}</span>
                <span className={styles['modal-stock-sep']}>·</span>
                <span className={styles['modal-stock-date']}>{stock.basDt}</span>
              </div>
            </div>
            <button
              className={styles['modal-close']}
              onClick={onClose}
              aria-label="닫기">
              <IconClose />
            </button>
          </div>

          {/* 탭 바 (헤더 아래 고정) */}
          <div className={styles['modal-tabs']} role="tablist">
            {TABS.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                className={`${styles['modal-tab']} ${activeTab === t.key ? styles.active : ''}`}
                onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* 본문 (탭별 스크롤 가능) */}
          <div className={styles['modal-body']} ref={modalBodyRef}>

            {/* 개요 탭 */}
            {activeTab === 'overview' && (
              <>
                <div className={styles['modal-stats']}>
                  {stats.map((s, i) => (
                    <div key={i} className={styles['modal-stat-item']}>
                      <div className={styles['modal-stat-label']}>{s.label}</div>
                      <div className={`${styles['modal-stat-value']} ${s.cls || ''}`}>
                        {s.isRate ? (
                          <>
                            <span>{sign}</span>
                            <AnimatedNumber value={Math.abs(s.diff)} formatter={formatters.comma} duration={0.5} />
                            <span>원</span>
                            <span>(</span>
                            <AnimatedNumber value={Math.abs(s.value)} decimals={2} duration={0.5} />
                            <span>%)</span>
                          </>
                        ) : s.isVolume ? (
                          <AnimatedNumber value={s.value} formatter={formatters.comma} duration={0.6} />
                        ) : (
                          <>
                            <AnimatedNumber value={s.value} formatter={formatters.comma} duration={0.6} />
                            <span>원</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles['modal-section-wrap']}>
                  <AlertSetter stock={stock} />
                </div>
              </>
            )}

            {/* 차트 탭 */}
            {activeTab === 'chart' && (
              <div className={styles['modal-chart-wrap']}>
                <div className={styles['modal-chart-header']}>
                  <div className={styles['modal-section-title']}>
                    종가 추이
                    <span className={styles['modal-data-count']}>({detailData.length}일)</span>
                  </div>
                  <div className={styles['modal-chart-controls']}>
                    <div className={styles['collect-wrap']}>
                      <button
                        className={styles['btn-collect']}
                        onClick={() => setCollectOpen(v => !v)}
                        disabled={collectMutation.isPending}>
                        <IconDownload />
                        {collectMutation.isPending ? '수집 중' : '과거 데이터'}
                      </button>
                      <AnimatePresence>
                        {collectOpen && (
                          <motion.div
                            className={styles['collect-dropdown']}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.12 }}>
                            {COLLECT_RANGES.map(r => (
                              <button
                                key={r.label}
                                className={styles['collect-option']}
                                onClick={() => handleCollect(r.months)}>
                                {r.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className={styles['modal-chart-tab-group']} ref={tabGroupRef}>
                      {PERIODS.map((p) => (
                        <button
                          key={p}
                          className={`${styles['modal-chart-tab']} ${period === p ? styles.active : ''}`}
                          onClick={() => setPeriod(p)}>
                          {p}
                        </button>
                      ))}
                    </div>

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

                <div className={styles['modal-chart-canvas']}>
                  {chartLoading ? (
                    <SkeletonChart />
                  ) : detailData.length > 0 ? (
                    chartType === 'candle' ? (
                      <CandlestickChart data={detailData} period={period} height={320} />
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
                            borderColor: 'var(--text-1)',
                            backgroundColor: 'rgba(11,13,16,0.05)',
                            tension: 0.3,
                            fill: true,
                            pointRadius: 2,
                            pointHoverRadius: 4,
                            pointBackgroundColor: 'var(--text-1)',
                          }]
                        }}
                        options={chartOptions}
                      />
                    )
                  ) : (
                    <div className={styles['modal-chart-loading']}>데이터가 없습니다.</div>
                  )}
                </div>
              </div>
            )}

            {/* 뉴스 탭 */}
            {activeTab === 'news' && (
              <div className={styles['modal-news-wrap']}>
                {newsLoading ? (
                  <SkeletonNews />
                ) : news.length > 0 ? (
                  news.map((n, i) => (
                    <a
                      key={i}
                      href={n.originallink || n.link}
                      target="_blank"
                      rel="noreferrer"
                      className={styles['modal-news-item']}>
                      <div className={styles['modal-news-title']}>{n.title}</div>
                      <div className={styles['modal-news-desc']}>{n.description}</div>
                      <div className={styles['modal-news-date']}>{formatNewsDate(n.pubDate)}</div>
                    </a>
                  ))
                ) : (
                  <div className={styles['modal-news-empty']}>관련 뉴스가 없습니다.</div>
                )}
              </div>
            )}

            {/* AI 분석 탭 */}
            {activeTab === 'ai' && (
              <div className={styles['modal-tab-pane']}>
                <AiAnalysis type="stock" stock={stock} />
              </div>
            )}

            {/* 토론 탭 */}
            {activeTab === 'chat' && (
              <div className={styles['modal-tab-pane']}>
                <StockChat ticker={stock.srtnCd} stockName={stock.itmsNm} />
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
