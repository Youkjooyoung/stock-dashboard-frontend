import { useState, useRef, useEffect, useLayoutEffect } from 'react';
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

const chartOptions = {
  responsive: true,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: 12,
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      callbacks: {
        label: ctx => `종가: ${ctx.raw?.toLocaleString()}원`
      }
    },
    crosshair: {
      line: {
        color: 'rgba(59, 91, 219, 0.3)',
        width: 1,
        dashPattern: [5, 5]
      }
    }
  },
  scales: {
    y: {
      ticks: { 
        callback: v => v.toLocaleString(),
        font: { size: 11 }
      },
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

// 모달 애니메이션 variants
const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      duration: 0.4,
      bounce: 0.3
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
};

// 백드롭 애니메이션
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

// 탭 컨텐츠 애니메이션
const tabContentVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 }
  }
};

export default function StockModal({ stock, onClose }) {
  const [chartType, setChartType] = useState('candle');
  const [period, setPeriod] = useState('일');
  const [collectOpen, setCollectOpen] = useState(false);
  const tabGroupRef = useRef(null);
  const modalBodyRef = useRef(null);

  const { data: detailData = [], isLoading: chartLoading } = useStockDetail(stock?.srtnCd);
  const { data: news = [], isLoading: newsLoading } = useStockNews(stock?.itmsNm);

  useLayoutEffect(() => {
    const el = modalBodyRef.current;
    if (!el) return;
    const reset = () => { el.scrollTop = 0; };
    reset();
    const raf1 = requestAnimationFrame(reset);
    const t1 = setTimeout(reset, 50);
    const t2 = setTimeout(reset, 150);
    const t3 = setTimeout(reset, 350);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [stock?.srtnCd]);
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
  const sign = rate > 0 ? '▲' : rate < 0 ? '▼' : '-';

  const stats = [
    { label: '시가', value: open, cls: '' },
    { label: '종가', value: close, cls },
    { label: '고가', value: high, cls: 'up' },
    { label: '저가', value: low, cls: 'down' },
    { label: '거래량', value: vol, cls: '', isVolume: true },
    { label: '등락률', value: rate, diff, cls, isRate: true },
  ];

  return (
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
          exit="exit"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100) onClose();
          }}>

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
            <motion.button 
              className={styles['modal-close']} 
              onClick={onClose}
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}>
              ✕
            </motion.button>
          </div>

          {/* 본문 */}
          <div className={styles['modal-body']} ref={modalBodyRef}>

            {/* 핵심 지표 */}
            <motion.div 
              className={styles['modal-stats']}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, staggerChildren: 0.05 }}>
              {stats.map((s, i) => (
                <motion.div 
                  key={i} 
                  className={styles['modal-stat-item']}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ duration: 0.2 }}>
                  <div className={styles['modal-stat-label']}>{s.label}</div>
                  <div className={`${styles['modal-stat-value']} ${s.cls || ''}`}>
                    {s.isRate ? (
                      <>
                        <span>{sign}</span> <AnimatedNumber value={Math.abs(s.diff)} formatter={formatters.comma} duration={0.5} />원
                        {' ('}
                        <AnimatedNumber value={Math.abs(s.value)} decimals={2} duration={0.5} />
                        {'%)'}
                      </>
                    ) : s.isVolume ? (
                      <AnimatedNumber value={s.value} formatter={formatters.comma} duration={0.6} />
                    ) : (
                      <>
                        <AnimatedNumber value={s.value} formatter={formatters.comma} duration={0.6} />원
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* 알림 설정 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}>
              <AlertSetter stock={stock} />
            </motion.div>

            {/* 종가 추이 차트 */}
            <motion.div 
              className={styles['modal-chart-wrap']}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}>
              <div className={styles['modal-chart-header']}>
                <div className={styles['modal-section-title']}>
                  📈 종가 추이
                  <span className={styles['modal-data-count']}>({detailData.length}일)</span>
                </div>
                <div className={styles['modal-chart-controls']}>
                  {/* 과거 데이터 수집 */}
                  <div className={styles['collect-wrap']}>
                    <motion.button
                      className={styles['btn-collect']}
                      onClick={() => setCollectOpen(v => !v)}
                      disabled={collectMutation.isPending}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}>
                      {collectMutation.isPending ? '수집 중...' : '📥 과거 데이터'}
                    </motion.button>
                    <AnimatePresence>
                      {collectOpen && (
                        <motion.div 
                          className={styles['collect-dropdown']}
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}>
                          {COLLECT_RANGES.map(r => (
                            <motion.button 
                              key={r.label} 
                              className={styles['collect-option']}
                              onClick={() => handleCollect(r.months)}
                              whileHover={{ x: 4 }}
                              transition={{ duration: 0.15 }}>
                              {r.label}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* 기간 선택 */}
                  <div className={styles['modal-chart-tab-group']} ref={tabGroupRef}>
                    {PERIODS.map((p) => (
                      <motion.button
                        key={p}
                        className={`${styles['modal-chart-tab']} ${period === p ? styles.active : ''}`}
                        onClick={() => setPeriod(p)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}>
                        {p}
                      </motion.button>
                    ))}
                  </div>
                  
                  {/* 차트 타입 */}
                  <div className={styles['modal-chart-tab-group']}>
                    <motion.button
                      className={`${styles['modal-chart-tab']} ${chartType === 'candle' ? styles.active : ''}`}
                      onClick={() => setChartType('candle')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}>
                      캔들
                    </motion.button>
                    <motion.button
                      className={`${styles['modal-chart-tab']} ${chartType === 'line' ? styles.active : ''}`}
                      onClick={() => setChartType('line')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}>
                      라인
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                {chartLoading ? (
                  <SkeletonChart />
                ) : detailData.length > 0 ? (
                  <motion.div
                    key={chartType}
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit">
                    {chartType === 'candle' ? (
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
                    )}
                  </motion.div>
                ) : (
                  <div className={styles['modal-chart-loading']}>데이터가 없습니다.</div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* 관련 뉴스 */}
            <motion.div 
              className={styles['modal-news-wrap']}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}>
              <div className={styles['modal-section-title']}>📰 관련 뉴스</div>
              {newsLoading ? (
                <SkeletonNews />
              ) : news.length > 0 ? (
                news.map((n, i) => (
                  <motion.a 
                    key={i}
                    href={n.originallink || n.link}
                    target="_blank"
                    rel="noreferrer"
                    className={styles['modal-news-item']}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    whileHover={{ x: 4, backgroundColor: 'var(--surface-hover)' }}>
                    <div className={styles['modal-news-title']}>{n.title}</div>
                    <div className={styles['modal-news-desc']}>{n.description}</div>
                    <div className={styles['modal-news-date']}>{formatNewsDate(n.pubDate)}</div>
                  </motion.a>
                ))
              ) : (
                <div className={styles['modal-news-empty']}>관련 뉴스가 없습니다.</div>
              )}
            </motion.div>

            {/* AI 종목 분석 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}>
              <AiAnalysis type="stock" stock={stock} />
            </motion.div>

            {/* 실시간 토론 채팅 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}>
              <StockChat ticker={stock.srtnCd} stockName={stock.itmsNm} />
            </motion.div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
