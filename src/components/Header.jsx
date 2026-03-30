import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useAlertStore from '../store/alertStore';
import useDarkMode from '../hooks/useDarkMode';
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
  const [dark, setDark] = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { badgeCount, reset } = useAlertStore();

  const email    = localStorage.getItem('userEmail') || '';
  const nickname = localStorage.getItem('kakaoNickname') || '';
  const provider = localStorage.getItem('provider') || '';
  const isGoogle = provider === 'google';
  const isKakao  = email.startsWith('kakao_') || provider === 'kakao';
  const displayName = nickname || (isGoogle ? 'Google 사용자' : isKakao ? '카카오 사용자' : email);

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
            <div className={styles['header-bell-wrap']}>
              <button
                className={styles['header-bell-btn']}
                onClick={reset}
                title="알림 확인 (클릭시 초기화)">
                🔔
                {badgeCount > 0 && (
                  <span className={styles['alert-badge']}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
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
