import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';

if (!document.documentElement.getAttribute('data-theme')) {
  document.documentElement.setAttribute('data-theme', 'light');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
      gcTime:    5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastContainer>
          <App />
        </ToastContainer>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
