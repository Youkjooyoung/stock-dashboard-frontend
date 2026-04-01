import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Title, Tooltip, Legend
} from 'chart.js';
import AlertNotification from '../components/AlertNotification';
import NewsSection from '../components/NewsSection';
import StockCharts from '../components/StockCharts';
import StockModal from '../components/StockModal';
import StockTable from '../components/StockTable';
import SummaryCards from '../components/SummaryCards';
import { SkeletonCards, SkeletonTable } from '../components/StockListSkeleton';
import { useStockPrices, useWatchlist, useToggleWatchlist, QUERY_KEYS } from '../hooks/useQueries';
import api from '../api/axiosInstance';
import styles from '../styles/pages/DashboardPage.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);


export default function DashboardPage() {
  const navigate = useNavigate();
  const { autoRefresh } = useOutletContext();
  const queryClient = useQueryClient();

  const [tab, setTab]               = useState('all');
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null);
  const [bulkOpen,   setBulkOpen]   = useState(false);
  const [bulkStatus, setBulkStatus] = useState(null); // null | { status, current, total }
  const intervalRef    = useRef(null);
  const stompRef       = useRef(null);
  const bulkPollRef    = useRef(null);
  const userId = localStorage.getItem('userId');

  const {
    data: stocks = [],
    isLoading: stocksLoading,
    refetch: refetchStocks,
  } = useStockPrices();

  const { data: watchlist = [] } = useWatchlist();
  const toggleWatchMutation = useToggleWatchlist();

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('https://api.jyyouk.shop/ws', null, { transports: ['websocket'] }),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/prices', () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stocks });
        });
      },
      onStompError: (frame) => {
        console.warn('[WebSocket] STOMP error:', frame.headers?.message);
      },
      onDisconnect: () => {
        console.info('[WebSocket] disconnected, reconnecting in 5s');
      },
      onWebSocketError: (e) => {
        console.warn('[WebSocket] socket error:', e);
      },
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); };
  }, [queryClient]);

  // ?�동갱신 ?�터�?(WebSocket 미연�????�백)
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => refetchStocks(), 30000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, refetchStocks]);

  const toggleWatchlist = async (itemId) => {
    const isWatched = watchlist.includes(itemId);
    try {
      await toggleWatchMutation.mutateAsync({ itemId, isWatched });
    } catch {
      alert('로그인이 필요합니다.');
      navigate('/login');
    }
  };

  const openModal = (stock) => setModal(stock);

  // ?�체 과거 ?�이???�집
  function toYYYYMMDD(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  async function startBulkCollect(years, skipExisting = false) {
    const end   = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - years);
    const params = { startDate: toYYYYMMDD(start), endDate: toYYYYMMDD(end), skipExisting };
    await api.post('/stock/collect/history/all', null, { params });
    setBulkOpen(false);
    setBulkStatus({ status: 'running', current: 0, total: 0 });

    // 진행 ?�태 ?�링
    bulkPollRef.current = setInterval(async () => {
      try {
        const res = await api.get('/stock/collect/history/status');
        setBulkStatus(res.data);
        if (res.data.status === 'done' || res.data.status === 'error') {
          clearInterval(bulkPollRef.current);
        }
      } catch { clearInterval(bulkPollRef.current); }
    }, 2000);
  }

  // 마운?????�집???��? 진행 중이�??�동?�로 ?�링 ?�작
  useEffect(() => {
    api.get('/stock/collect/history/status').then(res => {
      if (res.data.status === 'running') {
        setBulkStatus(res.data);
        bulkPollRef.current = setInterval(async () => {
          try {
            const r = await api.get('/stock/collect/history/status');
            setBulkStatus(r.data);
            if (r.data.status === 'done' || r.data.status === 'error') {
              clearInterval(bulkPollRef.current);
            }
          } catch { clearInterval(bulkPollRef.current); }
        }, 2000);
      }
    }).catch(() => {});
    return () => clearInterval(bulkPollRef.current);
  }, []);

  return (
    <div>
      <AlertNotification userId={userId} />

      {/* ?�체 과거 ?�이???�집 UI */}
      <div className={styles['bulk-bar']}>
        {bulkStatus && bulkStatus.status === 'running' ? (
          <div className={styles['bulk-progress']}>
            <span className="spinner" style={{ width: 14, height: 14 }} />
            <span>
              전체 과거 데이터 수집 중&nbsp;
              {bulkStatus.total > 0
                ? `${bulkStatus.current} / ${bulkStatus.total} 종목`
                : '준비 중'}
            </span>
          </div>
        ) : bulkStatus && bulkStatus.status === 'done' ? (
          <div className={styles['bulk-done']}>
            ✅ 전체 수집 완료 ({bulkStatus.total}종목)
            <button className={styles['bulk-close']} onClick={() => setBulkStatus(null)}>✕</button>
          </div>
        ) : (
          <div className={styles['bulk-wrap']}>
            <button className={styles['btn-bulk']} onClick={() => setBulkOpen(v => !v)}>
              📥 전체 과거 데이터 수집
            </button>
            {bulkOpen && (
              <div className={styles['bulk-dropdown']}>
                <div className={styles['bulk-dropdown-title']}>전체 수집</div>
                {[1, 3, 5, 10].map(y => (
                  <button key={y} className={styles['bulk-option']} onClick={() => startBulkCollect(y, false)}>
                    {y}년 ({y * 252}거래일)
                  </button>
                ))}
                <div className={styles['bulk-dropdown-title']} style={{ marginTop: 8 }}>미수집 종목만</div>
                {[1, 3, 5, 10].map(y => (
                  <button key={'skip' + y} className={`${styles['bulk-option']} ${styles['bulk-option-skip']}`} onClick={() => startBulkCollect(y, true)}>
                    {y}년 (기수집 스킵)
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <main className={styles['dashboard-main']}>
        {stocksLoading ? (
          <>
            <SkeletonCards />
            <div className={styles['dashboard-mid-row']}>
              <StockCharts stocks={[]} loading={true} />
              <div className={styles['dashboard-news-sticky']}>
                <NewsSection />
              </div>
            </div>
            <SkeletonTable />
          </>
        ) : (
          <>
            <SummaryCards stocks={stocks} />

            <div className={styles['dashboard-mid-row']}>
              <StockCharts stocks={stocks} loading={false} />
              <div className={styles['dashboard-news-sticky']}>
                <NewsSection />
              </div>
            </div>

            <StockTable
              stocks={stocks}
              watchlist={watchlist}
              tab={tab}
              search={search}
              onTabChange={setTab}
              onSearchChange={setSearch}
              onRowClick={openModal}
              onToggleWatch={toggleWatchlist}
            />
          </>
        )}
      </main>

      <StockModal
        stock={modal}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
