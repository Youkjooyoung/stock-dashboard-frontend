import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import styles from '../styles/components/StockCharts.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const baseOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.95)',
      titleColor: '#262626',
      bodyColor: '#6b7280',
      borderColor: '#dbdbdb',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: ctx => ctx.raw?.toLocaleString()
      }
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 30, color: '#a0a0a0' } },
    y: { grid: { color: 'rgba(128,128,128,0.08)' }, ticks: { font: { size: 11 }, color: '#a0a0a0', callback: v => v.toLocaleString() } }
  }
};

function ChartSkeleton() {
  return (
    <div className={styles['charts-wrap']}>
      {[0, 1].map(i => (
        <div key={i} className={styles['chart-box']}>
          <div className={`skeleton ${styles['chart-skeleton-title']}`} />
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
  if (loading || !stocks || stocks.length === 0) return <ChartSkeleton />;

  const top10Volume = [...stocks].sort((a, b) => b.trqu - a.trqu).slice(0, 10);
  const top10Price  = [...stocks].sort((a, b) => b.clpr - a.clpr).slice(0, 10);

  return (
    <div className={styles['charts-wrap']}>

      <div className={styles['chart-box']}>
        <h2 className={styles['chart-title']}>거래량 TOP 10</h2>
        <div className={styles['chart-canvas-wrap']}>
          <Bar
            data={{
              labels: top10Volume.map(d => d.itmsNm || d.srtnCd),
              datasets: [{
                data: top10Volume.map(d => d.trqu),
                backgroundColor: 'rgba(59,91,219,0.75)',
                borderColor: 'rgba(59,91,219,1)',
                borderWidth: 0,
                borderRadius: 6,
                label: '거래량'
              }]
            }}
            options={baseOptions}
          />
        </div>
      </div>

      <div className={styles['chart-box']}>
        <h2 className={styles['chart-title']}>종가 TOP 10</h2>
        <div className={styles['chart-canvas-wrap']}>
          <Bar
            data={{
              labels: top10Price.map(d => d.itmsNm || d.srtnCd),
              datasets: [{
                data: top10Price.map(d => d.clpr),
                backgroundColor: 'rgba(99,172,229,0.75)',
                borderColor: 'rgba(99,172,229,1)',
                borderWidth: 0,
                borderRadius: 6,
                label: '종가'
              }]
            }}
            options={baseOptions}
          />
        </div>
      </div>

    </div>
  );
}
