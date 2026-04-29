import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/useToast';
import { toYYYYMMDD } from '../utils/dateUtils';
import useStomp from '../hooks/useStomp';
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
import useAuthStore from '../store/authStore';
import api from '../api/axiosInstance';
import styles from '../styles/pages/DashboardPage.module.css';
import utils from '../styles/inline-utils.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);


export default function DashboardPage() {
  const navigate = useNavigate();
  const { autoRefresh } = useOutletContext();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const role = useAuthStore(s => s.role);
  const isAdmin = role === 'ADMIN';

  const [tab, setTab]               = useState('all');
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null);
  const [bulkOpen,   setBulkOpen]   = useState(false);
  const [bulkStatus, setBulkStatus] = useState(null); // null | { status, current, total }
  const intervalRef    = useRef(null);
  const bulkPollRef    = useRef(null);
  const userId = localStorage.getItem('userId');

  const {
    data: stocks = [],
    isLoading: stocksLoading,
    refetch: refetchStocks,
  } = useStockPrices();

  const { data: watchlist = [] } = useWatchlist();
  const toggleWatchMutation = useToggleWatchlist();

  useStomp('/topic/prices', {
    reconnectDelay: 5000,
    sockjsOptions: { transports: ['websocket'] },
    onMessage: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stocks }),
  });

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
      showToast('로그인이 필요합니다.', 'warning');
      navigate('/login');
    }
  };

  const openModal = (stock) => setModal(stock);

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

  // 마운트 시 수집이 이미 진행 중이면 자동으로 폴링 시작 (ADMIN 전용 엔드포인트)
  useEffect(() => {
    if (!isAdmin) return;
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
  }, [isAdmin]);

  return (
    <div>
      <AlertNotification userId={userId} />

      {/* 전체 과거 데이터 수집 UI (ADMIN 전용) */}
      {isAdmin && (
        <div className={styles['bulk-bar']}>
          {bulkStatus && bulkStatus.status === 'running' ? (
            <div className={styles['bulk-progress']}>
              <span className={`spinner ${utils['spinner-tiny']}`} />
              <span>
                COLLECTING&nbsp;
                {bulkStatus.total > 0
                  ? `${bulkStatus.current} / ${bulkStatus.total}`
                  : '...'}
              </span>
            </div>
          ) : bulkStatus && bulkStatus.status === 'done' ? (
            <div className={styles['bulk-done']}>
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3.5 8.5 6.5 11.5 12.5 5.5"/>
              </svg>
              DONE · {bulkStatus.total}
              <button className={styles['bulk-close']} onClick={() => setBulkStatus(null)} aria-label="닫기">✕</button>
            </div>
          ) : (
            <div className={styles['bulk-wrap']}>
              <button className={styles['btn-bulk']} onClick={() => setBulkOpen(v => !v)}>
                <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 2v9"/>
                  <path d="M4.5 7.5 8 11l3.5-3.5"/>
                  <path d="M2.5 13.5h11"/>
                </svg>
                HISTORY COLLECT
              </button>
              {bulkOpen && (
                <div className={styles['bulk-dropdown']}>
                  <div className={styles['bulk-dropdown-title']}>FULL COLLECT</div>
                  {[1, 3, 5, 10].map(y => (
                    <button key={y} className={styles['bulk-option']} onClick={() => startBulkCollect(y, false)}>
                      {y}Y · {(y * 252).toLocaleString()}d
                    </button>
                  ))}
                  <div className={styles['bulk-dropdown-title']}>UNCOLLECTED ONLY</div>
                  {[1, 3, 5, 10].map(y => (
                    <button key={'skip' + y} className={`${styles['bulk-option']} ${styles['bulk-option-skip']}`} onClick={() => startBulkCollect(y, true)}>
                      {y}Y · skip existing
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
