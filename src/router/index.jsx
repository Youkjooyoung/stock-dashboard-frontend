import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppLayout from '../components/AppLayout';
import ErrorBoundary from '../components/ErrorBoundary';

const LoginPage            = lazy(() => import('../pages/LoginPage'));
const SignupPage           = lazy(() => import('../pages/SignupPage'));
const DashboardPage        = lazy(() => import('../pages/DashboardPage'));
const ProfilePage          = lazy(() => import('../pages/ProfilePage'));
const OAuthCallbackPage    = lazy(() => import('../pages/OAuthCallbackPage'));
const OAuthLinkCallbackPage = lazy(() => import('../pages/OAuthLinkCallbackPage'));
const VerifyEmailPage      = lazy(() => import('../pages/VerifyEmailPage'));
const ForgotPasswordPage   = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage    = lazy(() => import('../pages/ResetPasswordPage'));
const AdminPage            = lazy(() => import('../pages/AdminPage'));
const ComparePage          = lazy(() => import('../pages/ComparePage'));
const ChangePasswordPage   = lazy(() => import('../pages/ChangePasswordPage'));
const DocsPreviewPage      = lazy(() => import('../pages/DocsPreviewPage'));

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>로딩 중...</div>}>
                <Routes>
                    <Route path="/login"         element={<LoginPage />} />
                    <Route path="/signup"        element={<SignupPage />} />
                    <Route path="/oauth"         element={<OAuthCallbackPage />} />
                    <Route path="/oauth/kakao"   element={<OAuthCallbackPage />} />
                    <Route path="/oauth/google"  element={<OAuthCallbackPage />} />
                    <Route path="/oauth/link"    element={<OAuthLinkCallbackPage />} />
                    <Route path="/verify-email"      element={<VerifyEmailPage />} />
                    <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
                    <Route path="/reset-password"   element={<ResetPasswordPage />} />
                    <Route path="/admin"            element={<AdminPage />} />
                    <Route path="/change-password"  element={<ChangePasswordPage />} />
                    <Route path="/docs"             element={<DocsPreviewPage />} />

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
            </Suspense>
        </BrowserRouter>
    );
}
