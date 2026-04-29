import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import { useToast } from '../hooks/useToast';
import styles from '../styles/pages/AdminPage.module.css';
import utils from '../styles/inline-utils.module.css';

const NAV_ITEMS = [
  { id: 'stats', label: '대시보드 통계', icon: '📊' },
  { id: 'users', label: '회원 관리', icon: '👥' },
  { id: 'stocks', label: '주식 종목 관리', icon: '📈' },
  { id: 'alerts', label: '목표가 알림 관리', icon: '🔔' },
  { id: 'chats', label: 'AI 채팅 이력', icon: '💬' },
];

export default function AdminPage() {
    const navigate = useNavigate();
    const { role, logout } = useAuthStore();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [topList, setTopList] = useState([]);
    const [users, setUsers] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stocksLoading, setStocksLoading] = useState(false);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [chatsLoading, setChatsLoading] = useState(false);

    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('ALL');
    const [userStatusFilter, setUserStatusFilter] = useState('ALL');
    const [userSortKey, setUserSortKey] = useState('userId');
    const [userSortDir, setUserSortDir] = useState('asc');
    const [userPage, setUserPage] = useState(1);

    const [stockSearch, setStockSearch] = useState('');
    const [stockSortKey, setStockSortKey] = useState('ticker');
    const [stockSortDir, setStockSortDir] = useState('asc');
    const [stockPage, setStockPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const filteredAndSortedUsers = useMemo(() => {
        if (!users) return [];
        const q = userSearch.toLowerCase().trim();
        const filtered = users.filter(u => {
            const matchesSearch = !q
                || (u.email || '').toLowerCase().includes(q)
                || (u.name || '').toLowerCase().includes(q)
                || (u.nickname || '').toLowerCase().includes(q);
            if (!matchesSearch) return false;

            if (userRoleFilter !== 'ALL' && (u.role || 'USER') !== userRoleFilter) return false;

            if (userStatusFilter === 'LOCKED'   && u.accountLocked !== 'Y')  return false;
            if (userStatusFilter === 'NORMAL'   && (u.accountLocked === 'Y' || u.emailVerified !== 'Y')) return false;
            if (userStatusFilter === 'UNVERIFIED' && u.emailVerified === 'Y') return false;

            return true;
        });

        if (!userSortKey) return filtered;

        return [...filtered].sort((a, b) => {
            const getField = (obj, key) => {
                if (key === 'userId')    return obj.userId ?? 0;
                if (key === 'email')     return (obj.email    || '').toLowerCase();
                if (key === 'name')      return (obj.name     || '').toLowerCase();
                if (key === 'createdAt') return obj.createdAt || '';
                if (key === 'role')      return obj.role      || 'USER';
                return '';
            };
            const valA = getField(a, userSortKey);
            const valB = getField(b, userSortKey);
            if (valA < valB) return userSortDir === 'asc' ? -1 : 1;
            if (valA > valB) return userSortDir === 'asc' ?  1 : -1;
            return 0;
        });
    }, [users, userSearch, userRoleFilter, userStatusFilter, userSortKey, userSortDir]);

    const paginatedUsers = useMemo(() => {
        const start = (userPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAndSortedUsers, userPage]);

    const totalUserPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE) || 1;

    const filteredAndSortedStocks = useMemo(() => {
        if (!stocks) return [];
        const q = stockSearch.toLowerCase();
        const filtered = stocks.filter(s => {
            const t = String(s.TICKER || s.ticker || '').toLowerCase();
            const n = String(s.ITEM_NM || s.itemNm || s.name || '').toLowerCase();
            return t.includes(q) || n.includes(q);
        });

        if (!stockSortKey) return filtered;

        return filtered.sort((a, b) => {
            const getField = (obj, key) => {
                if (key === 'ticker') return obj.TICKER || obj.ticker || '';
                if (key === 'name') return obj.ITEM_NM || obj.itemNm || obj.name || '';
                if (key === 'market') return obj.MARKET || obj.market || '';
                if (key === 'createdAt') return obj.CREATED_AT || obj.createdAt || '';
                return '';
            };
            const valA = getField(a, stockSortKey);
            const valB = getField(b, stockSortKey);
            if (valA < valB) return stockSortDir === 'asc' ? -1 : 1;
            if (valA > valB) return stockSortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [stocks, stockSearch, stockSortKey, stockSortDir]);

    const paginatedStocks = useMemo(() => {
        const start = (stockPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedStocks.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAndSortedStocks, stockPage]);

    const totalStockPages = Math.ceil(filteredAndSortedStocks.length / ITEMS_PER_PAGE) || 1;

    useEffect(() => {
        if (role !== 'ADMIN') { navigate('/'); return; }
        fetchStats();
        fetchTopWatchlist();
    }, []);

    useEffect(() => {
        if (activeTab === 'users' && users.length === 0) fetchUsers();
        if (activeTab === 'stocks' && stocks.length === 0) fetchStocks();
        if (activeTab === 'alerts' && alerts.length === 0) fetchAlerts();
        if (activeTab === 'chats' && chats.length === 0) fetchChats();
    }, [activeTab]);

    useEffect(() => {
        setUserPage(1);
    }, [userSearch, userRoleFilter, userStatusFilter, userSortKey, userSortDir]);

    const fetchAlerts = async () => {
        setAlertsLoading(true);
        try {
            const { data } = await api.get('/admin/alerts');
            setAlerts(data);
        } finally {
            setAlertsLoading(false);
        }
    };

    const fetchChats = async () => {
        setChatsLoading(true);
        try {
            const { data } = await api.get('/admin/chats');
            setChats(data);
        } finally {
            setChatsLoading(false);
        }
    };

    const fetchStats = async () => {
        const { data } = await api.get('/admin/stats');
        setStats(data);
    };

    const fetchTopWatchlist = async () => {
        const { data } = await api.get('/admin/watchlist/top');
        setTopList(data);
    };

    const fetchStocks = async () => {
        setStocksLoading(true);
        try {
            const { data } = await api.get('/admin/stocks');
            setStocks(data);
        } finally {
            setStocksLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = async (userId) => {
        if (!window.confirm('계정 잠금을 해제하시겠습니까?')) return;
        await api.post(`/admin/users/${userId}/unlock`);
        fetchUsers();
    };

    const handleResend = async (userId) => {
        await api.post(`/admin/users/${userId}/resend-verify`);
        showToast('인증 메일을 재발송했습니다.', 'success');
    };

    const handleRoleToggle = async (userId, currentRole) => {
        const next = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        if (!window.confirm(`권한을 ${next}로 변경하시겠습니까?`)) return;
        await api.post(`/admin/users/${userId}/role`);
        fetchUsers();
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleStockSort = (key) => {
        if (stockSortKey === key) setStockSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setStockSortKey(key); setStockSortDir('asc'); }
        setStockPage(1);
    };

    const handleUserSort = (key) => {
        if (userSortKey === key) setUserSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setUserSortKey(key); setUserSortDir('asc'); }
    };

    const resetUserFilters = () => {
        setUserSearch('');
        setUserRoleFilter('ALL');
        setUserStatusFilter('ALL');
        setUserSortKey('userId');
        setUserSortDir('asc');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'stats':
                return (
                    <>
                        <div className={styles.cardGrid}>
                            <div className={styles.adminCard}>
                                <div className={styles.cardTitle}>전체 회원 <span>👥</span></div>
                                <div className={styles.cardValue}>{stats?.totalUsers ?? '-'}</div>
                            </div>
                            <div className={styles.adminCard}>
                                <div className={styles.cardTitle}>오늘 가입 <span>✨</span></div>
                                <div className={styles.cardValue}>{stats?.todaySignups ?? '-'}</div>
                            </div>
                            <div className={styles.adminCard}>
                                <div className={styles.cardTitle}>이메일 인증 완료 <span>✅</span></div>
                                <div className={styles.cardValue}>{stats?.verifiedUsers ?? '-'}</div>
                            </div>
                            <div className={styles.adminCard}>
                                <div className={styles.cardTitle}>계정 잠금 <span>🔒</span></div>
                                <div className={`${styles.cardValue} ${stats?.lockedUsers > 0 ? utils['danger-color'] : ''}`}>{stats?.lockedUsers ?? '-'}</div>
                            </div>
                        </div>

                        <div className={styles.adminCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitle}>즐겨찾기 TOP 5 종목</div>
                            </div>
                            <div className={styles.tableWrapper}>
                                {topList.length === 0 ? (
                                    <p className={utils['empty-pad-sm']}>데이터가 없습니다.</p>
                                ) : (
                                    <table className={styles.adminTable}>
                                        <thead>
                                            <tr>
                                                <th>순위</th>
                                                <th>종목명</th>
                                                <th>종목코드</th>
                                                <th>즐겨찾기 수</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topList.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td><strong>{item.name}</strong></td>
                                                    <td>{item.ticker}</td>
                                                    <td>{item.cnt}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </>
                );

            case 'users': {
                const isFiltered = userSearch !== '' || userRoleFilter !== 'ALL' || userStatusFilter !== 'ALL';
                const sortArrow = (key) => userSortKey === key ? (userSortDir === 'asc' ? ' ▲' : ' ▼') : '';

                return (
                    <div className={styles.adminCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>
                                전체 회원 목록 ({filteredAndSortedUsers.length}명{isFiltered ? ` / 전체 ${users.length}명` : ''})
                            </div>
                            <div className={styles.filterBar}>
                                <input
                                    type="text"
                                    placeholder="이메일·이름·닉네임 검색..."
                                    className={styles.filterInput}
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                                <select
                                    className={styles.filterSelect}
                                    value={userRoleFilter}
                                    onChange={(e) => setUserRoleFilter(e.target.value)}>
                                    <option value="ALL">전체 권한</option>
                                    <option value="USER">일반회원</option>
                                    <option value="ADMIN">관리자</option>
                                </select>
                                <select
                                    className={styles.filterSelect}
                                    value={userStatusFilter}
                                    onChange={(e) => setUserStatusFilter(e.target.value)}>
                                    <option value="ALL">전체 상태</option>
                                    <option value="NORMAL">정상</option>
                                    <option value="LOCKED">잠금</option>
                                    <option value="UNVERIFIED">이메일 미인증</option>
                                </select>
                                {isFiltered && (
                                    <button className={styles.actionBtn} onClick={resetUserFilters}>초기화</button>
                                )}
                                <button className={styles.refreshBtn} onClick={fetchUsers}>새로고침</button>
                            </div>
                        </div>

                        <div className={styles.tableWrapper}>
                            {loading ? (
                                <p className={utils['empty-pad']}>데이터를 불러오는 중입니다...</p>
                            ) : filteredAndSortedUsers.length === 0 ? (
                                <p className={utils['empty-pad']}>
                                    조건에 맞는 회원이 없습니다.
                                </p>
                            ) : (
                                <table className={styles.adminTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.sortable} onClick={() => handleUserSort('userId')}>ID{sortArrow('userId')}</th>
                                            <th className={styles.sortable} onClick={() => handleUserSort('email')}>이메일{sortArrow('email')}</th>
                                            <th className={styles.sortable} onClick={() => handleUserSort('name')}>이름/닉네임{sortArrow('name')}</th>
                                            <th className={styles.sortable} onClick={() => handleUserSort('createdAt')}>가입일{sortArrow('createdAt')}</th>
                                            <th className={styles.sortable} onClick={() => handleUserSort('role')}>권한{sortArrow('role')}</th>
                                            <th>상태</th>
                                            <th>관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedUsers.map(u => (
                                            <tr key={u.userId}>
                                                <td>{u.userId}</td>
                                                <td>{u.email}</td>
                                                <td>{u.name || '-'} / {u.nickname || '-'}</td>
                                                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                                                <td>
                                                    <span className={u.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    {u.accountLocked === 'Y' ? (
                                                        <span className={styles.badgeDanger}>잠금</span>
                                                    ) : u.emailVerified !== 'Y' ? (
                                                        <span className={styles.badgeWarn}>미인증</span>
                                                    ) : (
                                                        <span className={styles.badgeOk}>정상</span>
                                                    )}
                                                </td>
                                                <td className={styles.actions}>
                                                    {u.accountLocked === 'Y' && <button className={styles.actionBtn} onClick={() => handleUnlock(u.userId)}>잠금해제</button>}
                                                    {u.emailVerified !== 'Y' && <button className={styles.actionBtn} onClick={() => handleResend(u.userId)}>메일재발송</button>}
                                                    <button className={`${styles.actionBtn} ${styles.roleBtn}`} onClick={() => handleRoleToggle(u.userId, u.role)}>권한변경</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {!loading && totalUserPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.actionBtn}
                                        disabled={userPage === 1}
                                        onClick={() => setUserPage(p => p - 1)}>
                                        이전
                                    </button>
                                    <span className={styles.pageIndicator}>
                                        {userPage} / {totalUserPages}
                                    </span>
                                    <button
                                        className={styles.actionBtn}
                                        disabled={userPage === totalUserPages}
                                        onClick={() => setUserPage(p => p + 1)}>
                                        다음
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            case 'stocks': {
                return (
                    <div className={styles.adminCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>주식 종목 관리 ({filteredAndSortedStocks.length}개)</div>
                            <div className={styles.filterBar}>
                                <input
                                    type="text"
                                    placeholder="종목명 또는 코드 검색..."
                                    className={styles.filterInput}
                                    value={stockSearch}
                                    onChange={(e) => { setStockSearch(e.target.value); setStockPage(1); }}
                                />
                                <button className={styles.refreshBtn} onClick={fetchStocks}>새로고침</button>
                            </div>
                        </div>

                        <div className={styles.tableWrapper}>
                            {stocksLoading ? (
                                <p className={utils['empty-pad']}>데이터를 불러오는 중입니다...</p>
                            ) : (
                                <table className={styles.adminTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.sortable} onClick={() => handleStockSort('ticker')}>
                                                종목코드 {stockSortKey === 'ticker' ? (stockSortDir === 'asc' ? '▲' : '▼') : ''}
                                            </th>
                                            <th className={styles.sortable} onClick={() => handleStockSort('name')}>
                                                종목명 {stockSortKey === 'name' ? (stockSortDir === 'asc' ? '▲' : '▼') : ''}
                                            </th>
                                            <th className={styles.sortable} onClick={() => handleStockSort('market')}>
                                                거래소 {stockSortKey === 'market' ? (stockSortDir === 'asc' ? '▲' : '▼') : ''}
                                            </th>
                                            <th className={styles.sortable} onClick={() => handleStockSort('createdAt')}>
                                                등록일 {stockSortKey === 'createdAt' ? (stockSortDir === 'asc' ? '▲' : '▼') : ''}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedStocks.map(s => (
                                            <tr key={s.ITEM_ID || s.itemId || s.TICKER || s.ticker}>
                                                <td>{s.TICKER || s.ticker}</td>
                                                <td><strong>{s.ITEM_NM || s.itemNm || s.name}</strong></td>
                                                <td>{s.MARKET || s.market}</td>
                                                <td>{(s.CREATED_AT || s.createdAt) ? new Date(s.CREATED_AT || s.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {!stocksLoading && totalStockPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.actionBtn}
                                        disabled={stockPage === 1}
                                        onClick={() => setStockPage(p => p - 1)}>
                                        이전
                                    </button>
                                    <span className={styles.pageIndicator}>
                                        {stockPage} / {totalStockPages}
                                    </span>
                                    <button
                                        className={styles.actionBtn}
                                        disabled={stockPage === totalStockPages}
                                        onClick={() => setStockPage(p => p + 1)}>
                                        다음
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            case 'alerts':
                return (
                    <div className={styles.adminCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>목표가 알림 관리 ({alerts.length}개)</div>
                            <button className={styles.refreshBtn} onClick={fetchAlerts}>새로고침</button>
                        </div>
                        <div className={styles.tableWrapper}>
                            {alertsLoading ? (
                                <p className={utils['empty-pad']}>데이터를 불러오는 중입니다...</p>
                            ) : (
                                <table className={styles.adminTable}>
                                    <thead>
                                        <tr>
                                            <th>알림ID</th>
                                            <th>사용자ID</th>
                                            <th>종목명(코드)</th>
                                            <th>목표가</th>
                                            <th>조건</th>
                                            <th>상태</th>
                                            <th>등록일</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.map(a => (
                                            <tr key={a.alertId || a.ALERT_ID}>
                                                <td>{a.alertId || a.ALERT_ID}</td>
                                                <td>{a.userId || a.USER_ID}</td>
                                                <td><strong>{a.stockName || a.STOCK_NAME}</strong> ({a.ticker || a.TICKER})</td>
                                                <td>{(a.targetPrice || a.TARGET_PRICE)?.toLocaleString()}원</td>
                                                <td>{(a.alertType || a.ALERT_TYPE) === 'ABOVE' ? '이상 ▲' : '이하 ▼'}</td>
                                                <td>
                                                    <span className={(a.isTriggered || a.IS_TRIGGERED) === 'Y' ? styles.badgeDanger : styles.badgeOk}>
                                                        {(a.isTriggered || a.IS_TRIGGERED) === 'Y' ? '발송완료' : '대기중'}
                                                    </span>
                                                </td>
                                                <td>{(a.createdAt || a.CREATED_AT) ? new Date(a.createdAt || a.CREATED_AT).toLocaleDateString('ko-KR') : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                );

            case 'chats':
                return (
                    <div className={styles.adminCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>AI 채팅 이력 ({chats.length}건)</div>
                            <button className={styles.refreshBtn} onClick={fetchChats}>새로고침</button>
                        </div>
                        <div className={styles.tableWrapper}>
                            {chatsLoading ? (
                                <p className={utils['empty-pad']}>데이터를 불러오는 중입니다...</p>
                            ) : (
                                <table className={styles.adminTable}>
                                    <thead>
                                        <tr>
                                            <th>메시지ID</th>
                                            <th>사용자 이메일</th>
                                            <th>종목코드</th>
                                            <th>질문 내용</th>
                                            <th>요청일시</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chats.map(c => (
                                            <tr key={c.msgId || c.MSG_ID}>
                                                <td>{c.msgId || c.MSG_ID}</td>
                                                <td>{c.userEmail || c.USER_EMAIL || '익명'}</td>
                                                <td>{c.ticker || c.TICKER || '전체'}</td>
                                                <td className={utils['cell-truncate']} title={c.content || c.CONTENT}>
                                                    {c.content || c.CONTENT}
                                                </td>
                                                <td>{(c.createdAt || c.CREATED_AT) ? new Date(c.createdAt || c.CREATED_AT).toLocaleString('ko-KR') : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className={styles.adminCard}>
                        <div className={utils['empty-pad']}>해당 탭의 기능이 아직 준비되지 않았습니다.</div>
                    </div>
                );
        }
    };

    return (
        <div className={styles.adminLayout}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <span className={styles.brandIcon}>✦</span>
                    관리자 페이지
                </div>
                <nav className={styles.navList}>
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h1 className={styles.title}>
                        {NAV_ITEMS.find(item => item.id === activeTab)?.label}
                    </h1>
                    <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
                </header>

                <div>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}