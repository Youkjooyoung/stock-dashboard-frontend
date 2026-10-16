import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useAlertStore from '../store/alertStore';
import useDarkMode from '../hooks/useDarkMode';
import { useAlerts, useDeleteAlert } from '../hooks/useQueries';
import { useToast } from '../hooks/useToast';
import TweaksPanel from './TweaksPanel';
import LogoMark from './LogoMark';
import styles from '../styles/components/Header.module.css';

const NAV_ITEMS = [
  { label: '대시보드', path: '/' },
  { label: '종목 비교', path: '/compare' },
  { label: '프로필', path: '/profile' },
];

// 알림이 울린 시각. 아직 울리지 않은 알림은 등록 시각을 쓴다.
const alertTime = (alert) => new Date(alert.triggeredAt || alert.createdAt);

export default function Header({ autoRefresh, onToggleRefresh }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { logout } = useAuthStore();
  const { showToast } = useToast();
  const [dark, setDark] = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { badgeCount, reset } = useAlertStore();
  const { data: alerts = [] } = useAlerts();
  const deleteAlertMutation = useDeleteAlert();

  const email    = localStorage.getItem('userEmail') || '';
  const nickname = localStorage.getItem('kakaoNickname') || '';
  const provider = localStorage.getItem('provider') || '';
  const isGoogle = provider === 'google';
  const isKakao  = email.startsWith('kakao_') || provider === 'kakao';
  const displayName = nickname || (isGoogle ? 'Google 사용자' : isKakao ? '카카오 사용자' : email);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const alertRef = useRef(null);
  // 읽음 표시는 서버에 저장하지 않고 이 브라우저(localStorage)에 알림 ID 목록으로만 기억한다.
  const [readAlerts, setReadAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('readAlerts') || '[]'); }
    catch { return []; }
  });

  // 목표가에 도달해 울린 알림만, 최근 것부터
  const triggeredAlerts = alerts.filter(a => a.isTriggered === 'Y')
                                .sort((a, b) => alertTime(b) - alertTime(a));

  // 알림 창 바깥을 누르면 창을 닫는다.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alertRef.current && !alertRef.current.contains(e.target)) {
        setIsAlertOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsAlertOpen(p => !p);
    if (badgeCount > 0) reset();
  };

  const markAsRead = (e, alertId) => {
    e.stopPropagation();
    if (readAlerts.includes(alertId)) return;
    const newRead = [...readAlerts, alertId];
    setReadAlerts(newRead);
    localStorage.setItem('readAlerts', JSON.stringify(newRead));
  };

  const markAllAsRead = () => {
    const allIds = triggeredAlerts.map(a => a.alertId);
    const merged = Array.from(new Set([...readAlerts, ...allIds]));
    setReadAlerts(merged);
    localStorage.setItem('readAlerts', JSON.stringify(merged));
  };

  const deleteAlert = async (e, alertId) => {
    e.stopPropagation();
    try {
      await deleteAlertMutation.mutateAsync(alertId);
    } catch {
      showToast('알림 삭제에 실패했습니다.', 'error');
    }
  };

  const deleteAllAlerts = async () => {
    if (triggeredAlerts.length === 0) return;
    if (!window.confirm('수신된 모든 알림을 삭제할까요?')) return;
    try {
      await Promise.all(
        triggeredAlerts.map(a => deleteAlertMutation.mutateAsync(a.alertId))
      );
    } catch {
      showToast('일부 알림 삭제에 실패했습니다.', 'error');
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;
    await logout();
    navigate('/login');
  };

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">

          <button type="button" className="header-logo" onClick={() => navigate('/')} aria-label="주식 대시보드 홈">
            <LogoMark size={26} />
            <span className="header-logo-text">주식<span>대시보드</span></span>
          </button>

          <nav className="header-subnav" aria-label="주요 메뉴">
            {NAV_ITEMS.map(item => (
              <button
                type="button"
                key={item.path}
                className={`header-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                aria-current={location.pathname === item.path ? 'page' : undefined}
                onClick={() => navigate(item.path)}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="header-user">

            {onToggleRefresh && (
              <button
                type="button"
                className={`header-pill ${autoRefresh ? 'live' : ''}`}
                onClick={onToggleRefresh}
                aria-pressed={autoRefresh}
                title={autoRefresh ? '자동갱신 중지' : '자동갱신 시작'}>
                <span className="dot" />
                LIVE
              </button>
            )}

            <TweaksPanel />

            <button
              type="button"
              className="header-pill"
              onClick={() => setDark(d => !d)}
              title={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}>
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                {dark ? (
                  <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
                ) : (
                  <>
                    <circle cx="8" cy="8" r="3.4"/>
                    <path d="M8 .8v1.6M8 13.6v1.6M.8 8h1.6M13.6 8h1.6M2.9 2.9l1.1 1.1M12 12l1.1 1.1M2.9 13.1l1.1-1.1M12 4l1.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </>
                )}
              </svg>
              {dark ? 'DARK' : 'LIGHT'}
            </button>

            <div className={styles['header-bell-wrap']} ref={alertRef}>
              <button
                type="button"
                className="header-bell"
                onClick={handleBellClick}
                title="알림 목록 열기"
                aria-label="알림"
                aria-expanded={isAlertOpen}
                aria-controls="header-alert-list">
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6a5 5 0 0 1 10 0c0 3 1.5 4 1.5 4H1.5S3 9 3 6z"/>
                  <path d="M6.5 13a1.5 1.5 0 0 0 3 0"/>
                </svg>
                {badgeCount > 0 && (
                  <span className="badge">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>

              {isAlertOpen && (
                <div id="header-alert-list" className={styles['alert-dropdown']} role="region" aria-label="수신 알림">
                  <div className={styles['alert-dropdown-header']}>
                    <span>알림 목록</span>
                    {triggeredAlerts.length > 0 && (
                      <div className={styles['alert-dropdown-header-actions']}>
                        <button
                          type="button"
                          className={styles['alert-header-btn']}
                          onClick={markAllAsRead}
                          title="모두 읽음 처리">
                          모두 읽음
                        </button>
                        <button
                          type="button"
                          className={`${styles['alert-header-btn']} ${styles['alert-header-btn-danger']}`}
                          onClick={deleteAllAlerts}
                          title="모두 삭제">
                          모두 삭제
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={styles['alert-dropdown-body']}>
                    {triggeredAlerts.length === 0 ? (
                      <div className={styles['alert-empty']}>수신된 알림이 없습니다.</div>
                    ) : (
                      triggeredAlerts.map(a => {
                        const alertId = a.alertId;
                        const isRead = readAlerts.includes(alertId);
                        return (
                          <div key={alertId} className={`${styles['alert-item']} ${isRead ? styles.read : ''}`}>
                            <div className={styles['alert-item-content']}>
                              <div className={styles['alert-item-title']}>{a.stockName || a.STOCK_NAME}</div>
                              <div className={styles['alert-item-desc']}>
                                목표가 {(a.targetPrice || a.TARGET_PRICE)?.toLocaleString()}원 {(a.alertType || a.ALERT_TYPE) === 'ABOVE' ? '이상' : '이하'} 도달!
                              </div>
                              <div className={styles['alert-item-time']}>
                                {alertTime(a).toLocaleString('ko-KR')}
                              </div>
                            </div>
                            <div className={styles['alert-item-actions']}>
                              {!isRead && (
                                <button type="button" className={styles['alert-action-btn']} onClick={(e) => markAsRead(e, alertId)} aria-label={`${a.stockName || a.STOCK_NAME} 알림 읽음 처리`}>✓</button>
                              )}
                              <button type="button" className={`${styles['alert-action-btn']} ${styles.delete}`} onClick={(e) => deleteAlert(e, alertId)} aria-label={`${a.stockName || a.STOCK_NAME} 알림 삭제`}>✕</button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="header-username">
              {isKakao && <span className="provider-badge kakao">K</span>}
              {isGoogle && <span className="provider-badge google">G</span>}
              {!isKakao && !isGoogle && <span className={styles['provider-badge-fallback']} aria-hidden="true" />}
              {displayName}
            </div>

            <button type="button" className="header-logout" onClick={handleLogout}>
              로그아웃
            </button>

            <button
              type="button"
              className={`${styles['header-hamburger']} ${mobileOpen ? styles.open : ''}`}
              onClick={() => setMobileOpen(p => !p)}
              aria-label="메뉴 열기/닫기"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation">
              <span className={styles['hamburger-line']} />
              <span className={styles['hamburger-line']} />
              <span className={styles['hamburger-line']} />
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-navigation" className={`${styles['mobile-menu']} ${mobileOpen ? styles.open : ''}`}>
        <div className={styles['mobile-menu-inner']}>
          {NAV_ITEMS.map(item => (
            <button
              type="button"
              key={item.path}
              className={`${styles['mobile-nav-item']} ${location.pathname === item.path ? styles.active : ''}`}
              aria-current={location.pathname === item.path ? 'page' : undefined}
              onClick={() => handleNav(item.path)}>
              {item.label}
            </button>
          ))}
          <hr className={styles['mobile-menu-divider']} />
          <div className={styles['mobile-menu-actions']}>
            {onToggleRefresh && (
              <button
                type="button"
                className={`header-pill ${autoRefresh ? 'live' : ''}`}
                onClick={onToggleRefresh}
                aria-pressed={autoRefresh}>
                <span className="dot" />
                LIVE
              </button>
            )}
            <button
              type="button"
              className="header-pill"
              onClick={() => setDark(d => !d)}
              aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}>
              {dark ? 'DARK' : 'LIGHT'}
            </button>
            <TweaksPanel />
            <button type="button" className="header-logout" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
