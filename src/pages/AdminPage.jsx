import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import styles from '../styles/pages/AdminPage.module.css';

export default function AdminPage() {
    const navigate   = useNavigate();
    const { role, logout } = useAuthStore();

    const [tab, setTab]               = useState('stats');
    const [stats, setStats]           = useState(null);
    const [topList, setTopList]       = useState([]);
    const [users, setUsers]           = useState([]);
    const [stocks, setStocks]         = useState([]);
    const [alerts, setAlerts]         = useState([]);
    const [chats, setChats]           = useState([]);
    const [loading, setLoading]       = useState(false);
    const [stocksLoading, setStocksLoading] = useState(false);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [chatsLoading, setChatsLoading]   = useState(false);

    useEffect(() => {
        if (role !== 'ADMIN') { navigate('/'); return; }
        fetchStats();
        fetchTopWatchlist();
    }, []);

    useEffect(() => {
        if (tab === 'users'   && users.length  === 0) fetchUsers();
        if (tab === 'stocks'  && stocks.length === 0) fetchStocks();
        if (tab === 'alerts'  && alerts.length === 0) fetchAlerts();
        if (tab === 'chats'   && chats.length  === 0) fetchChats();
    }, [tab]);

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
        alert('인증 메일을 재발송했습니다.');
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

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <div className={styles.logo}>S</div>
                    <span>주식대시보드 <em>관리자</em></span>
                </div>
                <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
            </header>

            <div className={styles.container}>
                <nav className={styles.tabs}>
                    <button className={`${styles.tab} ${tab === 'stats'  ? styles.tabActive : ''}`} onClick={() => setTab('stats')}>통계</button>
                    <button className={`${styles.tab} ${tab === 'users'  ? styles.tabActive : ''}`} onClick={() => setTab('users')}>회원 관리</button>
                    <button className={`${styles.tab} ${tab === 'stocks' ? styles.tabActive : ''}`} onClick={() => setTab('stocks')}>주식 관리</button>
                    <button className={`${styles.tab} ${tab === 'alerts' ? styles.tabActive : ''}`} onClick={() => setTab('alerts')}>알림 관리</button>
                    <button className={`${styles.tab} ${tab === 'chats'  ? styles.tabActive : ''}`} onClick={() => setTab('chats')}>AI 채팅 이력</button>
                </nav>

                {tab === 'stats' && (
                    <div className={styles.statsSection}>
                        <div className={styles.statCards}>
                            <div className={styles.statCard}>
                                <p className={styles.statLabel}>전체 회원</p>
                                <p className={styles.statValue}>{stats?.totalUsers ?? '-'}</p>
                            </div>
                            <div className={styles.statCard}>
                                <p className={styles.statLabel}>오늘 가입</p>
                                <p className={styles.statValue}>{stats?.todaySignups ?? '-'}</p>
                            </div>
                            <div className={styles.statCard}>
                                <p className={styles.statLabel}>이메일 인증 완료</p>
                                <p className={styles.statValue}>{stats?.verifiedUsers ?? '-'}</p>
                            </div>
                            <div className={styles.statCard}>
                                <p className={styles.statLabel}>계정 잠금</p>
                                <p className={`${styles.statValue} ${stats?.lockedUsers > 0 ? styles.danger : ''}`}>{stats?.lockedUsers ?? '-'}</p>
                            </div>
                        </div>

                        <div className={styles.topSection}>
                            <h3 className={styles.sectionTitle}>즐겨찾기 TOP 5 종목</h3>
                            {topList.length === 0 ? (
                                <p className={styles.empty}>데이터가 없습니다.</p>
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>순위</th>
                                            <th>티커</th>
                                            <th>종목명</th>
                                            <th>즐겨찾기 수</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topList.map((item, i) => (
                                            <tr key={i}>
                                                <td>{i + 1}</td>
                                                <td>{item.ticker}</td>
                                                <td>{item.name}</td>
                                                <td>{item.cnt}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'users' && (
                    <div className={styles.usersSection}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>전체 회원 ({users.length}명)</h3>
                            <button className={styles.refreshBtn} onClick={fetchUsers}>새로고침</button>
                        </div>
                        {loading ? (
                            <p className={styles.empty}>불러오는 중...</p>
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>이메일</th>
                                            <th>이름</th>
                                            <th>닉네임</th>
                                            <th>이메일인증</th>
                                            <th>계정잠금</th>
                                            <th>권한</th>
                                            <th>가입일</th>
                                            <th>관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.userId}>
                                                <td>{u.userId}</td>
                                                <td>{u.email}</td>
                                                <td>{u.name || '-'}</td>
                                                <td>{u.nickname || '-'}</td>
                                                <td>
                                                    <span className={u.emailVerified === 'Y' ? styles.badgeOk : styles.badgeWarn}>
                                                        {u.emailVerified === 'Y' ? '인증' : '미인증'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={u.accountLocked === 'Y' ? styles.badgeDanger : styles.badgeOk}>
                                                        {u.accountLocked === 'Y' ? '잠금' : '정상'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={u.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                                                <td className={styles.actions}>
                                                    {u.accountLocked === 'Y' && (
                                                        <button className={styles.actionBtn} onClick={() => handleUnlock(u.userId)}>잠금해제</button>
                                                    )}
                                                    {u.emailVerified !== 'Y' && (
                                                        <button className={styles.actionBtn} onClick={() => handleResend(u.userId)}>메일재발송</button>
                                                    )}
                                                    <button className={`${styles.actionBtn} ${styles.roleBtn}`} onClick={() => handleRoleToggle(u.userId, u.role)}>
                                                        {u.role === 'ADMIN' ? 'USER로' : 'ADMIN으로'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
                {tab === 'stocks' && (
                    <div className={styles.usersSection}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>종목 목록 ({stocks.length}개)</h3>
                            <button className={styles.refreshBtn} onClick={fetchStocks}>새로고침</button>
                        </div>
                        {stocksLoading ? (
                            <p className={styles.empty}>불러오는 중...</p>
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>티커</th>
                                            <th>종목명</th>
                                            <th>거래소</th>
                                            <th>등록일</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stocks.length === 0 ? (
                                            <tr><td colSpan={4} className={styles.empty}>데이터가 없습니다.</td></tr>
                                        ) : stocks.map(s => (
                                            <tr key={s.ticker}>
                                                <td>{s.ticker}</td>
                                                <td>{s.name}</td>
                                                <td>{s.market}</td>
                                                <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'alerts' && (
                    <div className={styles.usersSection}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>목표가 알림 ({alerts.length}건)</h3>
                            <button className={styles.refreshBtn} onClick={fetchAlerts}>새로고침</button>
                        </div>
                        {alertsLoading ? (
                            <p className={styles.empty}>불러오는 중...</p>
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>알림ID</th>
                                            <th>사용자이메일</th>
                                            <th>티커</th>
                                            <th>종목명</th>
                                            <th>목표가</th>
                                            <th>조건</th>
                                            <th>활성여부</th>
                                            <th>등록일</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.length === 0 ? (
                                            <tr><td colSpan={8} className={styles.empty}>데이터가 없습니다.</td></tr>
                                        ) : alerts.map(a => (
                                            <tr key={a.alertId}>
                                                <td>{a.alertId}</td>
                                                <td>{a.email}</td>
                                                <td>{a.ticker}</td>
                                                <td>{a.stockName}</td>
                                                <td>{a.targetPrice?.toLocaleString()}</td>
                                                <td>{a.alertType}</td>
                                                <td>
                                                    <span className={a.isTriggered === 'N' ? styles.badgeOk : styles.badgeWarn}>
                                                        {a.isTriggered === 'N' ? '활성' : '발동됨'}
                                                    </span>
                                                </td>
                                                <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'chats' && (
                    <div className={styles.usersSection}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>AI 채팅 이력 ({chats.length}건)</h3>
                            <button className={styles.refreshBtn} onClick={fetchChats}>새로고침</button>
                        </div>
                        {chatsLoading ? (
                            <p className={styles.empty}>불러오는 중...</p>
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>사용자이메일</th>
                                            <th>티커</th>
                                            <th>메시지 (50자)</th>
                                            <th>일시</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chats.length === 0 ? (
                                            <tr><td colSpan={5} className={styles.empty}>데이터가 없습니다.</td></tr>
                                        ) : chats.map(c => (
                                            <tr key={c.msgId}>
                                                <td>{c.msgId}</td>
                                                <td>{c.userEmail}</td>
                                                <td>{c.ticker}</td>
                                                <td>{c.content}</td>
                                                <td>{c.createdAt ? new Date(c.createdAt).toLocaleString('ko-KR') : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
