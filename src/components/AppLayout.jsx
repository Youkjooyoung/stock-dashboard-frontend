import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import FloatingAiChat from './FloatingAiChat';
import Header from './Header';
import StockTicker from './StockTicker';

export default function AppLayout() {
  const [autoRefresh, setAutoRefresh] = useState(
    () => localStorage.getItem('autoRefresh') === 'true'
  );

  const token = localStorage.getItem('accessToken');

  const toggleRefresh = () => {
    setAutoRefresh(p => {
      localStorage.setItem('autoRefresh', String(!p));
      return !p;
    });
  };

  if (!token) return <Navigate to="/login" replace />;

  return (
    <>
      <Header autoRefresh={autoRefresh} onToggleRefresh={toggleRefresh} />
      <StockTicker />
      <Outlet context={{ autoRefresh, setAutoRefresh }} />
      <FloatingAiChat />
    </>
  );
}
