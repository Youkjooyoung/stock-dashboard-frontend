import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import styles from '../styles/pages/AdminPage.module.css';

export default function AdminPage() {
    const navigate   = useNavigate();
    const { role, logout } = useAuthStore();

    const [tab, setTab]         = useState('stats');
    const [stats, setStats]     = useState(null);
    const [topList, setTopList] = useState([]);
    const [users, setUsers]     = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (role !== 'ADMIN') { navigate('/'); return; }
        fetchStats();
        fetchTopWatchlist();
    }, []);

    useEffect(() => {
        if (tab === 'users' && users.length === 0) fetchUsers();
    }, [tab]);

    const fetchStats = async () => {
        const { data } = await api.get('/admin/stats');
        setStats(data);
    };

    const fetchTopWatchlist = async () => {
        const { data } = await api.get('/admin/watchlist/top');
        setTopList(data);
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
                    <button className={`${styles.tab} ${tab === 'stats' ? styles.tabActive : ''}`} onClick={() => setTab('stats')}>통계</button>
                    <button className={`${styles.tab} ${tab === 'users' ? styles.tabActive : ''}`} onClick={() => setTab('users')}>회원 관리</button>
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
            </div>
        </div>
    );
}
