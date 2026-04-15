import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useAlertStore from '../store/alertStore';
import useDarkMode from '../hooks/useDarkMode';
import { useAlerts, useDeleteAlert } from '../hooks/useQueries';
import { useToast } from '../hooks/useToast';
import styles from '../styles/components/Header.module.css';

const NAV_ITEMS = [
  { label: '대시보드', path: '/' },
  { label: '종목 비교', path: '/compare' },
  { label: '프로필', path: '/profile' },
];

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
  const [readAlerts, setReadAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('readAlerts') || '[]'); }
    catch { return []; }
  });

  // 이미 도달(Triggered) 처리된 알림만 최신순 정렬
  const triggeredAlerts = alerts.filter(a => a.isTriggered === 'Y' || a.IS_TRIGGERED === 'Y')
                                .sort((a, b) => new Date(b.triggeredAt || b.TRIGGERED_AT || b.createdAt || b.CREATED_AT) - new Date(a.triggeredAt || a.TRIGGERED_AT || a.createdAt || a.CREATED_AT));

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
    const allIds = triggeredAlerts.map(a => a.alertId || a.ALERT_ID);
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
        triggeredAlerts.map(a => deleteAlertMutation.mutateAsync(a.alertId || a.ALERT_ID))
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
      <header className={styles.header}>
        <div className={styles['header-inner']}>

          {/* 로고 */}
          <div className={styles['header-logo']} onClick={() => navigate('/')}>
            <div className={styles['header-logo-mark']}>S</div>
            <span className={styles['header-logo-text']}>주식<span>대시보드</span></span>
          </div>

          {/* 서브 네비게이션 */}
          <nav className={styles['header-subnav']}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.path}
                className={`${styles['header-nav-item']} ${location.pathname === item.path ? styles.active : ''}`}
                onClick={() => navigate(item.path)}>
                {item.label}
              </button>
            ))}
          </nav>

          {/* 우측 유저 영역 */}
          <div className={styles['header-user']}>

            {/* 자동갱신 표시 */}
            {onToggleRefresh && (
              <div className={styles['refresh-indicator']}>
                <span className={`${styles['refresh-dot']} ${autoRefresh ? styles.on : ''}`} />
              </div>
            )}

            {/* 자동갱신 토글 버튼 */}
            {onToggleRefresh && (
              <button
                className={`${styles['header-action-btn']} ${autoRefresh ? styles.active : ''}`}
                onClick={onToggleRefresh}
                title={autoRefresh ? '자동갱신 중지' : '자동갱신 시작'}>
                {autoRefresh ? '갱신 ON' : '갱신 OFF'}
              </button>
            )}

            {/* 알림 배지 버튼 */}
            <div className={styles['header-bell-wrap']} style={{ position: 'relative' }} ref={alertRef}>
              <button
                className={styles['header-bell-btn']}
                onClick={handleBellClick}
                title="알림 확인 (클릭시 초기화)">
                🔔
                {badgeCount > 0 && (
                  <span className={styles['alert-badge']}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>

              {/* 알림 드롭다운 */}
              {isAlertOpen && (
                <div className={styles['alert-dropdown']}>
                  <div className={styles['alert-dropdown-header']}>
                    <span>알림 목록</span>
                    {triggeredAlerts.length > 0 && (
                      <div className={styles['alert-dropdown-header-actions']}>
                        <button
                          className={styles['alert-header-btn']}
                          onClick={markAllAsRead}
                          title="모두 읽음 처리">
                          모두 읽음
                        </button>
                        <button
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
                        const alertId = a.alertId || a.ALERT_ID;
                        const isRead = readAlerts.includes(alertId);
                        return (
                          <div key={alertId} className={`${styles['alert-item']} ${isRead ? styles.read : ''}`}>
                            <div className={styles['alert-item-content']}>
                              <div className={styles['alert-item-title']}>{a.stockName || a.STOCK_NAME}</div>
                              <div className={styles['alert-item-desc']}>
                                목표가 {(a.targetPrice || a.TARGET_PRICE)?.toLocaleString()}원 {(a.alertType || a.ALERT_TYPE) === 'ABOVE' ? '이상' : '이하'} 도달!
                              </div>
                              <div className={styles['alert-item-time']}>
                                {new Date(a.triggeredAt || a.TRIGGERED_AT || a.createdAt || a.CREATED_AT).toLocaleString('ko-KR')}
                              </div>
                            </div>
                            <div className={styles['alert-item-actions']}>
                              {!isRead && (
                                <button className={styles['alert-action-btn']} onClick={(e) => markAsRead(e, alertId)}>✓</button>
                              )}
                              <button className={`${styles['alert-action-btn']} ${styles.delete}`} onClick={(e) => deleteAlert(e, alertId)}>✕</button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 다크모드 토글 */}
            <button
              className={styles['header-theme-btn']}
              onClick={() => setDark(d => !d)}
              title={dark ? '라이트 모드' : '다크 모드'}>
              {dark ? '☀️' : '🌙'}
            </button>

            {/* 사용자 이름 */}
            <div className={styles['header-user-name']}>
              {isKakao && <span className={`${styles['header-provider-badge']} ${styles.kakao}`}>K</span>}
              {isGoogle && <span className={`${styles['header-provider-badge']} ${styles.google}`}>G</span>}
              <span className={styles['header-name-text']}>{displayName}</span>
            </div>

            {/* 로그아웃 */}
            <button className={styles['header-logout-btn']} onClick={handleLogout}>
              로그아웃
            </button>

            {/* 햄버거 버튼 (모바일) */}
            <button
              className={`${styles['header-hamburger']} ${mobileOpen ? styles.open : ''}`}
              onClick={() => setMobileOpen(p => !p)}
              aria-label="메뉴 열기/닫기">
              <span className={styles['hamburger-line']} />
              <span className={styles['hamburger-line']} />
              <span className={styles['hamburger-line']} />
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 드롭다운 메뉴 */}
      <div className={`${styles['mobile-menu']} ${mobileOpen ? styles.open : ''}`}>
        <div className={styles['mobile-menu-inner']}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`${styles['mobile-nav-item']} ${location.pathname === item.path ? styles.active : ''}`}
              onClick={() => handleNav(item.path)}>
              {item.label}
            </button>
          ))}
          <hr className={styles['mobile-menu-divider']} />
          <div className={styles['mobile-menu-actions']}>
            {onToggleRefresh && (
              <button
                className={`${styles['header-action-btn']} ${autoRefresh ? styles.active : ''}`}
                onClick={onToggleRefresh}>
                {autoRefresh ? '갱신 ON' : '갱신 OFF'}
              </button>
            )}
            <button
              className={styles['header-action-btn']}
              onClick={() => setDark(d => !d)}>
              {dark ? '☀️ 라이트' : '🌙 다크'}
            </button>
            <button className={styles['header-logout-btn']} onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
