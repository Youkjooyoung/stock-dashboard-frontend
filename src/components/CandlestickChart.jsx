import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import styles from '../styles/components/CandlestickChart.module.css';

function toTime(basDt) {
  const s = String(basDt);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function aggregateWeekly(sorted) {
  const weeks = {};
  sorted.forEach(d => {
    const date = new Date(toTime(d.basDt));
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    const key = monday.toISOString().slice(0, 10);
    if (!weeks[key]) {
      weeks[key] = { time: key, open: d.mkp || 0, high: d.hipr || 0, low: d.lopr || 0, close: d.clpr || 0, vol: d.trqu || 0 };
    } else {
      weeks[key].high  = Math.max(weeks[key].high, d.hipr || 0);
      weeks[key].low   = Math.min(weeks[key].low,  d.lopr || 0);
      weeks[key].close = d.clpr || 0;
      weeks[key].vol  += d.trqu || 0;
    }
  });
  return Object.values(weeks).sort((a, b) => a.time.localeCompare(b.time));
}

function aggregateMonthly(sorted) {
  const months = {};
  sorted.forEach(d => {
    const key = `${String(d.basDt).slice(0, 4)}-${String(d.basDt).slice(4, 6)}-01`;
    if (!months[key]) {
      months[key] = { time: key, open: d.mkp || 0, high: d.hipr || 0, low: d.lopr || 0, close: d.clpr || 0, vol: d.trqu || 0 };
    } else {
      months[key].high  = Math.max(months[key].high, d.hipr || 0);
      months[key].low   = Math.min(months[key].low,  d.lopr || 0);
      months[key].close = d.clpr || 0;
      months[key].vol  += d.trqu || 0;
    }
  });
  return Object.values(months).sort((a, b) => a.time.localeCompare(b.time));
}

export default function CandlestickChart({ data = [], period = '일', height = 300 }) {
  const containerRef = useRef(null);
  const tooltipRef   = useRef(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // 시가/고가/저가/종가 중 하나라도 0이면 차트에서 제외 (잘못된 데이터)
    const sorted = [...data]
      .filter(d => d.mkp > 0 && d.hipr > 0 && d.lopr > 0 && d.clpr > 0)
      .sort((a, b) => String(a.basDt).localeCompare(String(b.basDt)));

    let chartData, volData;
    if (period === '주') {
      const agg = aggregateWeekly(sorted);
      chartData = agg.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
      volData   = agg.map(d => ({ time: d.time, value: d.vol, color: d.close >= d.open ? 'rgba(226,76,75,0.4)' : 'rgba(59,122,217,0.4)' }));
    } else if (period === '월') {
      const agg = aggregateMonthly(sorted);
      chartData = agg.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
      volData   = agg.map(d => ({ time: d.time, value: d.vol, color: d.close >= d.open ? 'rgba(226,76,75,0.4)' : 'rgba(59,122,217,0.4)' }));
    } else {
      chartData = sorted.map(d => ({ time: toTime(d.basDt), open: d.mkp||0, high: d.hipr||0, low: d.lopr||0, close: d.clpr||0 }));
      volData   = sorted.map(d => ({
        time:  toTime(d.basDt),
        value: d.trqu || 0,
        color: (d.clpr || 0) >= (d.mkp || 0) ? 'rgba(226,76,75,0.4)' : 'rgba(59,122,217,0.4)',
      }));
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor  = isDark ? '#8b95a1' : '#6b7280';
    const gridColor  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const borderColor = isDark ? '#2a2e39' : '#e5e7eb';
    const crosshairColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(60,60,70,0.55)';
    const crosshairLabelBg = isDark ? '#2a2e39' : '#2a2e39';

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height,
      layout: {
        background:  { color: 'transparent' },
        textColor,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: crosshairColor,
          width: 1,
          style: 3,
          labelBackgroundColor: crosshairLabelBg,
          labelVisible: true,
        },
        horzLine: {
          color: crosshairColor,
          width: 1,
          style: 3,
          labelBackgroundColor: crosshairLabelBg,
          labelVisible: true,
        },
      },
      rightPriceScale: {
        borderColor,
        visible: true,
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
      timeScale: {
        borderColor,
        timeVisible: false,
        fixLeftEdge:  true,
        fixRightEdge: true,
      },
      handleScale:  { mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
    });

    const upColor   = isDark ? '#f03e3e' : '#e24c4b';
    const downColor = isDark ? '#339af0' : '#3b7ad9';

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor,
      downColor,
      borderUpColor:   upColor,
      borderDownColor: downColor,
      wickUpColor:     upColor,
      wickDownColor:   downColor,
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
      priceLineStyle: 2,
      lastValueVisible: true,
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
    });
    candleSeries.setData(chartData);

    // 거래량 히스토그램 (캔들 색상과 연동)
    const volSeries = chart.addSeries(HistogramSeries, {
      priceScaleId:     'vol',
      priceLineVisible: false,
      lastValueVisible: false,
    });
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volSeries.setData(volData);

    chart.timeScale().fitContent();

    // 마우스 호버 툴팁
    chart.subscribeCrosshairMove(param => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        tooltip.style.display = 'none';
        return;
      }

      const candle = param.seriesData.get(candleSeries);
      if (!candle) { tooltip.style.display = 'none'; return; }

      const w = containerRef.current.clientWidth;
      let left = param.point.x + 14;
      if (left + 150 > w) left = param.point.x - 164;

      tooltip.style.display = 'block';
      tooltip.style.left = `${left}px`;
      tooltip.style.top  = `${Math.max(4, param.point.y - 70)}px`;

      const fmt  = v => Number(v || 0).toLocaleString();
      const isUp = candle.close >= candle.open;
      tooltip.innerHTML = `
        <div class="${styles['tt-date']}">${param.time}</div>
        <table class="${styles['tt-table']}">
          <tr><td>시가</td><td>${fmt(candle.open)}</td></tr>
          <tr><td>고가</td><td class="${styles['tt-up']}">${fmt(candle.high)}</td></tr>
          <tr><td>저가</td><td class="${styles['tt-down']}">${fmt(candle.low)}</td></tr>
          <tr><td>종가</td><td class="${isUp ? styles['tt-up'] : styles['tt-down']}" style="font-weight:700">${fmt(candle.close)}</td></tr>
        </table>`;
    });

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [data, period, height]);

  if (data.length === 0) return null;

  return (
    <div className={styles['candle-wrap']}>
      <div style={{ position: 'relative' }}>
        <div ref={containerRef} className={styles['candle-container']} />
        <div ref={tooltipRef} className={styles['candle-tooltip']} />
      </div>
    </div>
  );
}
