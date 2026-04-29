import { useMemo, useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import styles from '../styles/components/StockCharts.module.css';
import utils from '../styles/inline-utils.module.css';

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

function readToken(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function buildOptions({ isPercent = false, signed = false, dark = false } = {}) {
  const tickName  = readToken('--text-secondary', dark ? '#A4A8B0' : '#6B6F78');
  const tickValue = readToken('--text-tertiary', dark ? '#C7CAD1' : '#A4A8B0');
  const gridLine  = readToken('--divider', dark ? 'rgba(232,230,222,0.08)' : 'rgba(11,13,16,0.05)');
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    animation: { duration: 520, easing: 'easeOutCubic' },
    layout: { padding: { top: 4, right: 12, bottom: 0, left: 0 } },
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
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { size: 11, weight: '600' },
          color: tickName,
          padding: 6,
          autoSkip: false,
          crossAlign: 'far',
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return label.length > 8 ? label.slice(0, 8) + '…' : label;
          }
        }
      },
      x: {
        grid: { color: gridLine, drawTicks: false },
        border: { display: false },
        ticks: {
          font: { size: 10, family: "'JetBrains Mono', ui-monospace, Consolas, monospace" },
          color: tickValue,
          padding: 8,
          maxRotation: 0,
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
      borderRadius: 4,
      borderSkipped: false,
      barPercentage: 0.78,
      categoryPercentage: 0.84,
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
            <div className={styles['chart-skeleton-rows']}>
              {[...Array(10)].map((_, j) => (
                <div
                  key={j}
                  className={`skeleton ${styles['chart-skeleton-row']} ${utils['dynamic-bar-w']}`}
                  style={{ '--bar-w': `${40 + Math.random() * 55}%` }}
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

  const volumeColor = readToken('--text', dark ? '#F2F4F6' : '#191F28');
  const priceColor  = readToken('--text-secondary', dark ? '#B0B8C1' : '#4E5968');
  const upColor     = readToken('--c-up', dark ? '#FF5C6A' : '#F04452');
  const downColor   = readToken('--c-down', dark ? '#4D8EFA' : '#3182F6');

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
      data: makeDataset(topGainers, 'rate', upColor),
      options: buildOptions({ isPercent: true, signed: true, dark }),
      empty: topGainers.length === 0 && '상승 종목 없음',
    },
    {
      title: '하락률 TOP 10',
      badge: 'LOSERS',
      badgeColor: 'down',
      data: makeDataset(topLosers, 'rate', downColor),
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
            <span className={`chart-badge ${c.badgeColor || ''}`}>
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
