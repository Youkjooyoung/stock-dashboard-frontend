import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';

// ── Query Keys ─────────────────────────────────────────────
export const QUERY_KEYS = {
  stocks:          ['stocks'],
  stockDetail:     (ticker) => ['stocks', ticker],
  stockRange:      (ticker, start, end) => ['stocks', ticker, 'range', start, end],
  watchlist:       ['watchlist'],
  watchlistDetail: ['watchlist', 'detail'],
  news:            (query) => ['news', query],
  stockNews:       (stockName) => ['news', 'stock', stockName],
  alerts:          ['alerts'],
  alertsByTicker:  (ticker) => ['alerts', ticker],
  userInfo:        ['user', 'info'],
  portfolio:       ['portfolio'],
  socialLinks:     ['user', 'social'],
};

// ── 주식 전체 목록 ──────────────────────────────────────────
export function useStockPrices() {
  return useQuery({
    queryKey: QUERY_KEYS.stocks,
    queryFn:  () => api.get('/stock/prices').then(r => r.data),
    staleTime: 30 * 1000,
  });
}

// ── 개별 종목 히스토리 (모달 차트용) ───────────────────────
export function useStockDetail(ticker) {
  return useQuery({
    queryKey: QUERY_KEYS.stockDetail(ticker),
    queryFn:  () =>
      api.get(`/stock/prices/${ticker}`)
        .then(r => r.data.sort((a, b) => a.basDt.localeCompare(b.basDt))),
    enabled: !!ticker,
    staleTime: 60 * 1000,
  });
}

// ── 종목 범위 조회 (비교 페이지용) ─────────────────────────
export function useStockRange(ticker, startDate, endDate, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.stockRange(ticker, startDate, endDate),
    queryFn:  () =>
      api.get(`/stock/prices/${ticker}/range`, {
        params: { startDate, endDate },
      }).then(r => ({ ticker, data: r.data })),
    enabled: enabled && !!ticker && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });
}

// ── 즐겨찾기 ID 목록 ───────────────────────────────────────
export function useWatchlist() {
  return useQuery({
    queryKey: QUERY_KEYS.watchlist,
    queryFn:  () => api.get('/user/watchlist').then(r => r.data),
    staleTime: 60 * 1000,
  });
}

// ── 즐겨찾기 상세 (가격 포함) ──────────────────────────────
export function useWatchlistDetail() {
  return useQuery({
    queryKey: QUERY_KEYS.watchlistDetail,
    queryFn:  () => api.get('/user/watchlist/detail').then(r => r.data),
    staleTime: 30 * 1000,
  });
}

// ── 즐겨찾기 토글 뮤테이션 ─────────────────────────────────
export function useToggleWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, isWatched }) =>
      isWatched
        ? api.delete(`/user/watchlist/${itemId}`)
        : api.post(`/user/watchlist/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.watchlist });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.watchlistDetail });
    },
  });
}

// ── 뉴스 검색 ──────────────────────────────────────────────
export function useNews(query, display = 8) {
  return useQuery({
    queryKey: QUERY_KEYS.news(query),
    queryFn:  () =>
      api.get('/news', { params: { query: query + ' 주식', display } })
        .then(r => r.data),
    enabled:   !!query,
    staleTime: 5 * 60 * 1000,
  });
}

// ── 종목 관련 뉴스 (모달용) ────────────────────────────────
export function useStockNews(stockName, display = 4) {
  return useQuery({
    queryKey: QUERY_KEYS.stockNews(stockName),
    queryFn:  () =>
      api.get(`/news/${encodeURIComponent(stockName)}`, { params: { display } })
        .then(r => r.data),
    enabled:   !!stockName,
    staleTime: 5 * 60 * 1000,
  });
}

// ── 알림 목록 ──────────────────────────────────────────────
export function useAlerts() {
  return useQuery({
    queryKey: QUERY_KEYS.alerts,
    queryFn:  () => api.get('/alert').then(r => r.data),
    staleTime: 30 * 1000,
  });
}

// ── 종목별 알림 목록 (AlertSetter용) ──────────────────────
export function useAlertsByTicker(ticker) {
  const { data: allAlerts = [], ...rest } = useAlerts();
  return {
    ...rest,
    data: allAlerts.filter(a => a.ticker === ticker),
  };
}

// ── 알림 추가 뮤테이션 ─────────────────────────────────────
export function useAddAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/alert', payload),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts }),
  });
}

// ── 알림 삭제 뮤테이션 ─────────────────────────────────────
export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId) => api.delete(`/alert/${alertId}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts }),
  });
}

// ── 사용자 정보 ────────────────────────────────────────────
export function useUserInfo() {
  return useQuery({
    queryKey: QUERY_KEYS.userInfo,
    queryFn:  () => api.get('/user/info').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ── 포트폴리오 조회 ─────────────────────────────────────────
export function usePortfolio() {
  return useQuery({
    queryKey: QUERY_KEYS.portfolio,
    queryFn:  () => api.get('/portfolio').then(r => r.data),
    staleTime: 30 * 1000,
  });
}

// ── 포트폴리오 종목 추가 뮤테이션 ──────────────────────────
export function useAddPortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/portfolio', payload),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.portfolio }),
  });
}

// ── 종목 과거 데이터 수집 뮤테이션 ─────────────────────────
export function useCollectTickerHistory(ticker) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ startDate, endDate }) =>
      api.post(`/stock/prices/${ticker}/collect`, null, { params: { startDate, endDate } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockDetail(ticker) });
    },
  });
}

// ── 포트폴리오 종목 삭제 뮤테이션 ──────────────────────────
export function useDeletePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (portfolioId) => api.delete(`/portfolio/${portfolioId}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.portfolio }),
  });
}

// ── 소셜 연동 목록 조회 ─────────────────────────────────────
export function useSocialLinks() {
  return useQuery({
    queryKey: QUERY_KEYS.socialLinks,
    queryFn:  () => api.get('/user/social').then(r => r.data),
    staleTime: 60 * 1000,
  });
}

// ── 소셜 계정 연동 뮤테이션 ────────────────────────────────
export function useLinkSocial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/user/social/link', payload),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.socialLinks }),
  });
}

// ── 소셜 연동 해제 뮤테이션 ────────────────────────────────
export function useUnlinkSocial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider) => api.delete(`/user/social/unlink/${provider}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.socialLinks }),
  });
}
