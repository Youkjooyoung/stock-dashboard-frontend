import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ErrorBoundary from '../components/ErrorBoundary';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import OAuthCallbackPage from '../pages/OAuthCallbackPage';
import ComparePage from '../pages/ComparePage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 인증 불필요 페이지 */}
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth"        element={<OAuthCallbackPage />} />
        <Route path="/oauth/kakao"  element={<OAuthCallbackPage />} />
        <Route path="/oauth/google" element={<OAuthCallbackPage />} />

        {/* 공유 레이아웃: Header + StockTicker (로그인 필요) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={
            <ErrorBoundary title="대시보드 오류" fallbackUrl="/">
              <DashboardPage />
            </ErrorBoundary>
          } />
          <Route path="/compare" element={
            <ErrorBoundary title="종목 비교 오류" fallbackUrl="/compare">
              <ComparePage />
            </ErrorBoundary>
          } />
          <Route path="/profile" element={
            <ErrorBoundary title="프로필 오류" fallbackUrl="/profile">
              <ProfilePage />
            </ErrorBoundary>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
