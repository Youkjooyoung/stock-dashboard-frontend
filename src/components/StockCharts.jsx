import { useMemo, useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import styles from '../styles/components/StockCharts.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function useThemeAttr() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || 'light'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.dataset.theme || 'light');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

function buildOptions({ isPercent = false, signed = false, dark = false } = {}) {
  const tickX    = dark ? '#A4A8B0' : '#6B6F78';
  const tickY    = dark ? '#C7CAD1' : '#A4A8B0';
  const gridLine = dark ? 'rgba(232,230,222,0.08)' : 'rgba(11,13,16,0.05)';
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 520, easing: 'easeOutCubic' },
    layout: { padding: { top: 4, right: 4, bottom: 0, left: 0 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0B0D10',
        titleColor: '#FFFFFF',
        bodyColor: '#E8E6DE',
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 12, family: "'JetBrains Mono', ui-monospace, Consolas, monospace" },
        callbacks: {
          label: ctx => {
            const v = ctx.raw;
            if (isPercent) {
              const sign = signed && v > 0 ? '+' : '';
              return `${sign}${v.toFixed(2)}%`;
            }
            return v.toLocaleString();
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { size: 11, weight: '500' },
          color: tickX,
          maxRotation: 0,
          padding: 6,
          autoSkip: false
        }
      },
      y: {
        grid: { color: gridLine, drawTicks: false },
        border: { display: false },
        ticks: {
          font: { size: 10, family: "'JetBrains Mono', ui-monospace, Consolas, monospace" },
          color: tickY,
          padding: 8,
          callback: v => {
            if (isPercent) {
              const sign = signed && v > 0 ? '+' : '';
              return `${sign}${v}%`;
            }
            return v >= 1000 ? (v / 1000).toLocaleString() + 'k' : v.toLocaleString();
          }
        }
      }
    }
  };
}

function makeDataset(rows, valueKey, color) {
  return {
    labels: rows.map(r => r.itmsNm || r.srtnCd || '-'),
    datasets: [{
      data: rows.map(r => r[valueKey]),
      backgroundColor: color,
      hoverBackgroundColor: color,
      borderRadius: 5,
      borderSkipped: false,
      barPercentage: 0.68,
      categoryPercentage: 0.88,
    }]
  };
}

function ChartSkeleton() {
  return (
    <div className={styles['charts-grid']}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className={styles['chart-box']}>
          <div className={styles['chart-header']}>
            <div className={`skeleton ${styles['chart-skeleton-title']}`} />
          </div>
          <div className={`${styles['chart-canvas-wrap']} ${styles['chart-skeleton-canvas']}`}>
            <div className={styles['chart-skeleton-bars']}>
              {[...Array(10)].map((_, j) => (
                <div
                  key={j}
                  className={`skeleton ${styles['chart-skeleton-bar']}`}
                  style={{ height: `${30 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StockCharts({ stocks, loading }) {
  const theme = useThemeAttr();
  const dark  = theme === 'dark';

  const { topVolume, topPrice, topGainers, topLosers } = useMemo(() => {
    if (!stocks || stocks.length === 0) {
      return { topVolume: [], topPrice: [], topGainers: [], topLosers: [] };
    }
    const withRate = stocks
      .filter(s => s.mkp > 0 && s.clpr > 0)
      .map(s => ({ ...s, rate: ((s.clpr - s.mkp) / s.mkp) * 100 }));

    return {
      topVolume:  [...stocks].sort((a, b) => (b.trqu || 0) - (a.trqu || 0)).slice(0, 10),
      topPrice:   [...stocks].sort((a, b) => (b.clpr || 0) - (a.clpr || 0)).slice(0, 10),
      topGainers: withRate.filter(s => s.rate > 0).sort((a, b) => b.rate - a.rate).slice(0, 10),
      topLosers:  withRate.filter(s => s.rate < 0).sort((a, b) => a.rate - b.rate).slice(0, 10),
    };
  }, [stocks]);

  if (loading || !stocks || stocks.length === 0) return <ChartSkeleton />;

  const volumeColor = dark ? 'rgba(148,163,184,0.92)' : 'rgba(11,13,16,0.85)';
  const priceColor  = dark ? 'rgba(100,116,139,0.88)' : 'rgba(60,64,73,0.80)';

  const charts = [
    {
      title: '거래량 TOP 10',
      badge: 'VOLUME',
      data: makeDataset(topVolume, 'trqu', volumeColor),
      options: buildOptions({ isPercent: false, dark }),
    },
    {
      title: '종가 TOP 10',
      badge: 'PRICE',
      data: makeDataset(topPrice, 'clpr', priceColor),
      options: buildOptions({ isPercent: false, dark }),
    },
    {
      title: '상승률 TOP 10',
      badge: 'GAINERS',
      badgeColor: 'up',
      data: makeDataset(topGainers, 'rate', 'rgba(232,51,74,0.88)'),
      options: buildOptions({ isPercent: true, signed: true, dark }),
      empty: topGainers.length === 0 && '상승 종목 없음',
    },
    {
      title: '하락률 TOP 10',
      badge: 'LOSERS',
      badgeColor: 'down',
      data: makeDataset(topLosers, 'rate', 'rgba(31,111,235,0.88)'),
      options: buildOptions({ isPercent: true, signed: true, dark }),
      empty: topLosers.length === 0 && '하락 종목 없음',
    },
  ];

  return (
    <div className={styles['charts-grid']}>
      {charts.map((c, i) => (
        <div key={i} className={styles['chart-box']}>
          <div className={styles['chart-header']}>
            <h2 className={styles['chart-title']}>{c.title}</h2>
            <span className={`${styles['chart-badge']} ${c.badgeColor ? styles[`badge-${c.badgeColor}`] : ''}`}>
              {c.badge}
            </span>
          </div>
          <div className={styles['chart-canvas-wrap']}>
            {c.empty ? (
              <div className={styles['chart-empty']}>{c.empty}</div>
            ) : (
              <Bar data={c.data} options={c.options} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
