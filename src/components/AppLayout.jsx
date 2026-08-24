import { useEffect, useRef, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import FloatingAiChat from './FloatingAiChat';
import Header from './Header';
import StockTicker from './StockTicker';

export default function AppLayout() {
  const [autoRefresh, setAutoRefresh] = useState(
    () => localStorage.getItem('autoRefresh') === 'true'
  );
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  const token = localStorage.getItem('accessToken');

  const toggleRefresh = () => {
    setAutoRefresh(p => {
      localStorage.setItem('autoRefresh', String(!p));
      return !p;
    });
  };

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <>
      <a className="skip-link" href="#main-content">본문 바로가기</a>
      <Header autoRefresh={autoRefresh} onToggleRefresh={toggleRefresh} />
      <StockTicker />
      <main
        id="main-content"
        key={pathname}
        ref={mainRef}
        className="route-fade"
        tabIndex={-1}
      >
        <Outlet context={{ autoRefresh, setAutoRefresh }} />
      </main>
      <FloatingAiChat />
    </>
  );
}
