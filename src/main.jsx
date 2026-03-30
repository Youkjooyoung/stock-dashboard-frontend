import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,        // 30초: 주식 데이터 특성상 짧게 유지
      gcTime:    5 * 60 * 1000,    // 5분: 캐시 보관
      refetchOnWindowFocus: false, // 탭 전환 시 자동 재요청 비활성화
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
