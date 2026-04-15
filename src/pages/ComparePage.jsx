import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { isoToApiDate } from '../utils/dateUtils';
import { Line } from 'react-chartjs-2';
import { useMutation } from '@tanstack/react-query';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  LineElement, PointElement, Title, Tooltip, Legend
} from 'chart.js';
import api from '../api/axiosInstance';
import styles from '../styles/pages/ComparePage.module.css';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const COLORS = ['#6366F1', '#E24C4B', '#3B7AD9', '#F59E0B', '#F472B6'];


export default function ComparePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [tickerInput, setTickerInput] = useState('');
  const [tickers, setTickers]         = useState([]);
  const [startDate, setStartDate]     = useState('2025-03-17');
  const [endDate, setEndDate]         = useState('2025-03-20');
  const [chartData, setChartData] = useState(null);
  const [statsData, setStatsData] = useState([]);

  const addTicker = () => {
    const t = tickerInput.trim().toUpperCase();
    if (!t || tickers.includes(t)) return;
    if (tickers.length >= 5) { showToast('최대 5개까지 비교 가능해요!', 'warning'); return; }
    setTickers(prev => [...prev, t]);
    setTickerInput('');
  };

  const removeTicker = (t) => setTickers(prev => prev.filter(x => x !== t));

  const searchMutation = useMutation({
    mutationFn: async ({ tickers, startDate, endDate }) => {
      const results = await Promise.all(
        tickers.map(t =>
          api.get(`/stock/prices/${t}/range`, {
            params: { startDate: isoToApiDate(startDate), endDate: isoToApiDate(endDate) }
          }).then(res => ({ ticker: t, data: res.data }))
        )
      );

      const allDates = [...new Set(
        results.flatMap(r => r.data.map(d => d.basDt))
      )].sort();

      const datasets = results.map((r, i) => ({
        label: r.data[0]?.itmsNm || r.ticker,
        data: allDates.map(date => {
          const found = r.data.find(d => d.basDt === date);
          return found ? found.clpr : null;
        }),
        borderColor: COLORS[i],
        backgroundColor: COLORS[i] + '20',
        tension: 0.3,
        fill: false,
        pointRadius: 4,
        spanGaps: true,
      }));

      const stats = results.map((r, i) => {
        if (r.data.length === 0) return null;
        const first  = r.data[0];
        const last   = r.data[r.data.length - 1];
        const change = last.clpr - first.clpr;
        const rate   = ((change / first.clpr) * 100).toFixed(2);
        return {
          ticker: r.ticker,
          name:   first.itmsNm || r.ticker,
          color:  COLORS[i],
          start:  first.clpr,
          end:    last.clpr,
          change,
          rate,
          high:   Math.max(...r.data.map(d => d.hipr)),
          low:    Math.min(...r.data.map(d => d.lopr)),
          volume: r.data.reduce((s, d) => s + d.trqu, 0),
        };
      }).filter(Boolean);

      return { chartData: { labels: allDates, datasets }, stats };
    },
    onSuccess: ({ chartData, stats }) => {
      setChartData(chartData);
      setStatsData(stats);
    },
    onError: () => showToast('데이터 조회에 실패했습니다. 종목코드를 확인해주세요.', 'error'),
  });

  const handleSearch = () => {
    if (tickers.length === 0) { showToast('종목코드를 입력해주세요!', 'warning'); return; }
    searchMutation.mutate({ tickers, startDate, endDate });
  };

  return (
    <div>
      <div className={styles['compare-main']}>

        {/* 페이지 헤더 */}
        <div className={styles['compare-page-header']}>
          <h2 className={styles['compare-page-title']}>종목 비교 &amp; 날짜 범위 조회</h2>
          <button className={styles['btn-back']} onClick={() => navigate('/')}>← 대시보드</button>
        </div>

        {/* 컨트롤 패널 */}
        <div className={styles['compare-controls']}>
          <div className={styles['control-group']}>
            <label className={styles['control-label']}>종목코드 (최대 5개)</label>
            <div className={styles['control-row']}>
              <input
                className={styles['control-input']}
                placeholder="예: 000100"
                value={tickerInput}
                onChange={e => setTickerInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTicker()}
              />
              <button className={styles['btn-search']} onClick={addTicker}>추가</button>
            </div>
          </div>

          <div className={styles['control-group']}>
            <label className={styles['control-label']}>시작일</label>
            <input
              className={`${styles['control-input']} ${styles['date-input']}`}
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              onClick={e => e.currentTarget.showPicker?.()}
              onFocus={e => e.currentTarget.showPicker?.()}
              max={endDate}
            />
          </div>

          <div className={styles['control-group']}>
            <label className={styles['control-label']}>종료일</label>
            <input
              className={`${styles['control-input']} ${styles['date-input']}`}
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              onClick={e => e.currentTarget.showPicker?.()}
              onFocus={e => e.currentTarget.showPicker?.()}
              min={startDate}
            />
          </div>

          <button className={styles['btn-search']} onClick={handleSearch} disabled={searchMutation.isPending}>
            {searchMutation.isPending ? <><span className="spinner" />조회 중</> : '🔍 조회'}
          </button>
        </div>

        {/* 선택된 종목 태그 */}
        {tickers.length > 0 && (
          <div className={styles['ticker-tags']}>
            {tickers.map((t, i) => (
              <span key={t} className={styles['ticker-tag']} style={{ background: COLORS[i] }}>
                {t}
                <button className={styles['ticker-tag-remove']} onClick={() => removeTicker(t)}>✕</button>
              </span>
            ))}
          </div>
        )}

        {/* 차트 + 통계 */}
        {chartData ? (
          <>
            <div className={styles['compare-chart-box']}>
              <h3 className={styles['compare-chart-title']}>종가 추이 비교</h3>
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.raw?.toLocaleString()}원`
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: { callback: v => v.toLocaleString() + '원' },
                      grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: { grid: { display: false } }
                  }
                }}
              />
            </div>

            <div className={styles['compare-stats']}>
              {statsData.map(s => (
                <div key={s.ticker} className={styles['compare-stat-card']} style={{ borderLeftColor: s.color }}>
                  <p className={styles['stat-ticker']}>{s.ticker}</p>
                  <p className={styles['stat-name']}>{s.name}</p>
                  <div className={styles['stat-row']}>
                    <span className={styles['stat-key']}>시작가</span>
                    <span className={styles['stat-val']}>{s.start.toLocaleString()}원</span>
                  </div>
                  <div className={styles['stat-row']}>
                    <span className={styles['stat-key']}>종료가</span>
                    <span className={styles['stat-val']}>{s.end.toLocaleString()}원</span>
                  </div>
                  <div className={styles['stat-row']}>
                    <span className={styles['stat-key']}>변동</span>
                    <span className={`${styles['stat-val']} ${s.change >= 0 ? 'up' : 'down'}`}>
                      {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change).toLocaleString()}원 ({s.rate}%)
                    </span>
                  </div>
                  <div className={styles['stat-row']}>
                    <span className={styles['stat-key']}>최고가</span>
                    <span className={styles['stat-val']}>{s.high.toLocaleString()}원</span>
                  </div>
                  <div className={styles['stat-row']}>
                    <span className={styles['stat-key']}>최저가</span>
                    <span className={styles['stat-val']}>{s.low.toLocaleString()}원</span>
                  </div>
                  <div className={styles['stat-row']}>
                    <span className={styles['stat-key']}>총 거래량</span>
                    <span className={styles['stat-val']}>{s.volume.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles['compare-empty']}>
            <span className={styles['compare-empty-icon']}>📊</span>
            <p className={styles['compare-empty-title']}>종목코드를 입력하고 조회하세요</p>
            <p className={styles['compare-empty-sub']}>최대 5개 종목을 동시에 비교할 수 있습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
