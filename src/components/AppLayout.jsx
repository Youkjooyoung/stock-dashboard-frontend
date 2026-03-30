import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Header from './Header';
import StockTicker from './StockTicker';

export default function AppLayout() {
  const [autoRefresh, setAutoRefresh] = useState(
    () => localStorage.getItem('autoRefresh') === 'true'
  );
  const [stocks, setStocks] = useState([]);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) return;
    api.get('/stock/prices').then(r => setStocks(r.data)).catch(() => {});
  }, [token]);

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
      <StockTicker stocks={stocks} />
      <Outlet context={{ stocks, setStocks, autoRefresh, setAutoRefresh }} />
    </>
  );
}
