import { useState, useRef, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, ArcElement, Tooltip, Legend
} from 'chart.js';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import {
  useWatchlist, useWatchlistDetail, useAlerts,
  useDeleteAlert, useUserInfo,
  usePortfolio, useAddPortfolio, useDeletePortfolio,
  useStockPrices, useSocialLinks, useUnlinkSocial,
} from '../hooks/useQueries';
import { uploadProfileImage } from '../api/profileApi';
import AiAnalysis from '../components/AiAnalysis';
import IdentityVerifyModal from '../components/IdentityVerifyModal';
import { formatShortDate } from '../utils/dateUtils';
import styles from '../styles/pages/ProfilePage.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const TABS = ['계정 정보', '즐겨찾기', '수익률 차트', '알림 관리', '포트폴리오', 'AI 분석'];
const NICK_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30일


function validateNickname(name) {
  if (!name.trim()) return '닉네임을 입력해주세요.';
  if (/[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?~`]/.test(name))
    return '특수문자는 사용할 수 없습니다.';
  if (!/^[가-힣a-zA-Z0-9]+$/.test(name))
    return '한글, 영문, 숫자만 사용 가능합니다.';
  if (/^[가-힣]+$/.test(name)) {
    if (name.length < 2 || name.length > 8) return '한글만 사용 시 2~8자여야 합니다.';
  } else {
    if (name.length < 4 || name.length > 8) return '영문·한글·숫자 혼합 시 4~8자여야 합니다.';
  }
  return null;
}

function getCooldownDays() {
  const last = localStorage.getItem('nicknameLastChanged');
  if (!last) return 0;
  const diff = Date.now() - new Date(last).getTime();
  const days = Math.ceil((NICK_COOLDOWN_MS - diff) / 86400000);
  return days > 0 ? days : 0;
}

/* ── 컴포넌트 ────────────────────────────────── */
export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { logout } = useAuthStore();
  const fileRef = useRef(null);

  /* ── React Query 데이터 ── */
  const { data: userInfo, refetch: refetchUserInfo }  = useUserInfo();
  const { data: socialLinks = [] }  = useSocialLinks();
  const { data: watchlistIds = [] } = useWatchlist();
  const { data: watchlist = [] }    = useWatchlistDetail();
  const { data: alerts = [] }       = useAlerts();
  const deleteAlertMutation         = useDeleteAlert();
  const { data: portfolio = [] }    = usePortfolio();
  const { data: stockPrices = [] }  = useStockPrices();
  const addPortfolioMutation        = useAddPortfolio();
  const deletePortfolioMutation     = useDeletePortfolio();
  const unlinkSocialMutation        = useUnlinkSocial();

  const email = userInfo?.email || localStorage.getItem('userEmail') || '';
  const isKakaoOnlyEmail = email.startsWith('kakao_') || email.startsWith('google_');

  const provider  = localStorage.getItem('provider') || '';
  const isGoogle  = provider === 'google';
  const isKakao   = email.startsWith('kakao_') || provider === 'kakao';
  const isSocial  = isKakao || isGoogle;

  const currentProvider = provider;
  const loginMethod = currentProvider === 'google' ? 'Google' : currentProvider === 'kakao' ? '카카오' : '이메일';
  const roleLabel   = isSocial ? '소셜 회원' : '일반 회원';
  const roleClass   = isSocial ? 'google' : 'normal';

  const [activeTab, setActiveTab] = useState('계정 정보');
  const [nickname, setNickname]   = useState('');
  const [avatar, setAvatar]       = useState(localStorage.getItem('userAvatar') || '');

  useEffect(() => {
    if (userInfo?.nickname) {
        setNickname(userInfo.nickname);
    }
  }, [userInfo]);

  const displayName = nickname || (isSocial ? '소셜 사용자' : email);
  const avatarClass = currentProvider === 'kakao' ? 'kakao' : currentProvider === 'google' ? 'google' : '';

  const [nickModalOpen, setNickModalOpen]       = useState(false);
  const [nickModalInput, setNickModalInput]     = useState('');
  const [nickModalMsg, setNickModalMsg]         = useState('');
  const [nickModalMsgType, setNickModalMsgType] = useState('');
  const [nickDupOk, setNickDupOk]               = useState(false);

  const [avatarPreview, setAvatarPreview]   = useState('');
  const [avatarFile, setAvatarFile]           = useState(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason]       = useState('');
  const [deleteMsg, setDeleteMsg]             = useState('');
  const [deleteVerifyToken, setDeleteVerifyToken] = useState('');
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [identityPurpose, setIdentityPurpose]     = useState('');

  const kakaoLink  = socialLinks.find(s => s.provider === 'KAKAO');
  const googleLink = socialLinks.find(s => s.provider === 'GOOGLE');
  const [socialMsg, setSocialMsg]     = useState('');
  const [socialMsgType, setSocialMsgType] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('linked')) {
      const p = params.get('linked');
      setSocialMsg(`${p === 'kakao' ? '카카오' : '구글'} 계정 연동이 완료됐습니다.`);
      setSocialMsgType('success');
    } else if (params.get('linkError')) {
      setSocialMsg('소셜 계정 연동에 실패했습니다.');
      setSocialMsgType('error');
    }
  }, [location.search]);

  const handleLinkKakao = () => {
    const token = localStorage.getItem('accessToken');
    window.location.href = `${api.defaults.baseURL}/auth/kakao/link?token=${token}`;
  };

  const handleLinkGoogle = () => {
    const token = localStorage.getItem('accessToken');
    window.location.href = `${api.defaults.baseURL}/auth/google/link?token=${token}`;
  };

  const handleUnlinkSocial = async (provider) => {
    if (!window.confirm(`${provider === 'KAKAO' ? '카카오' : '구글'} 연동을 해제하시겠습니까?`)) return;
    try {
      await unlinkSocialMutation.mutateAsync(provider);
      setSocialMsg('연동이 해제됐습니다.'); setSocialMsgType('success');
    } catch {
      setSocialMsg('연동 해제에 실패했습니다.'); setSocialMsgType('error');
    }
  };

  const [pfTicker,   setPfTicker]   = useState('');
  const [pfName,     setPfName]     = useState('');
  const [pfQty,      setPfQty]      = useState('');
  const [pfPrice,    setPfPrice]    = useState('');
  const [pfDate,     setPfDate]     = useState('');
  const [pfMsg,      setPfMsg]      = useState('');
  const [pfMsgType,  setPfMsgType]  = useState('');
  const [pfFormOpen, setPfFormOpen] = useState(false);
  const [pfSortKey,  setPfSortKey]  = useState('pnl');
  const [pfSortDir,  setPfSortDir]  = useState('desc');

  const handleAddPortfolio = async () => {
    if (!pfTicker || !pfName || !pfQty || !pfPrice || !pfDate) {
      setPfMsg('모든 항목을 입력해주세요.'); setPfMsgType('error'); return;
    }
    const buyDate = pfDate.replace(/-/g, '');
    try {
      await addPortfolioMutation.mutateAsync({
        ticker: pfTicker.toUpperCase(),
        stockName: pfName,
        quantity: parseFloat(pfQty),
        buyPrice: parseInt(pfPrice, 10),
        buyDate,
      });
      setPfTicker(''); setPfName(''); setPfQty('');
      setPfPrice(''); setPfDate('');
      setPfMsg('추가됐습니다.'); setPfMsgType('success');
      setPfFormOpen(false);
    } catch {
      setPfMsg('추가에 실패했습니다.'); setPfMsgType('error');
    }
  };

  const watchCount = watchlistIds.length;
  const joinDate   = userInfo?.createdAt || '';

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setAvatarModalOpen(true);
    };
    setAvatarFile(file);
    reader.readAsDataURL(file);
  };

  const handleAvatarConfirm = async () => {
    if (!avatarFile) return;
    try {
        const imageUrl = await uploadProfileImage(avatarFile);
        setAvatar(imageUrl);
        localStorage.setItem('userAvatar', imageUrl);
        setAvatarModalOpen(false);
        setAvatarPreview('');
        setAvatarFile(null);
    } catch (err) {
        showToast(err.response?.data?.message || '이미지 업로드에 실패했습니다.', 'error');
    }
  };
  const handleAvatarCancel = () => {
    setAvatarModalOpen(false);
    setAvatarPreview('');
  };

  const openNickModal = () => {
    setNickModalInput('');
    setNickDupOk(false);
    const days = getCooldownDays();
    setNickModalMsg(days > 0 ? `닉네임은 ${days}일 후에 변경 가능합니다.` : '');
    setNickModalMsgType(days > 0 ? 'error' : '');
    setNickModalOpen(true);
  };

  const handleNickInputChange = (val) => {
    setNickModalInput(val);
    setNickDupOk(false);
    setNickModalMsg('');
    setNickModalMsgType('');
  };

  const handleCheckDuplicate = async () => {
    const err = validateNickname(nickModalInput.trim());
    if (err) { setNickModalMsg(err); setNickModalMsgType('error'); return; }
    try {
      const res = await api.get(`/user/nickname/check?nickname=${encodeURIComponent(nickModalInput.trim())}`);
      if (res.data.available) {
        setNickModalMsg('사용 가능한 닉네임입니다.');
        setNickModalMsgType('success');
        setNickDupOk(true);
      } else {
        setNickModalMsg('이미 사용 중인 닉네임입니다.');
        setNickModalMsgType('error');
        setNickDupOk(false);
      }
    } catch {
      setNickModalMsg('중복 검사 중 오류가 발생했습니다.');
      setNickModalMsgType('error');
    }
  };

  const handleConfirmNickname = async () => {
    if (!nickDupOk) { setNickModalMsg('중복 검사를 먼저 진행해주세요.'); setNickModalMsgType('error'); return; }
    if (getCooldownDays() > 0) return;
    if (!window.confirm('닉네임을 변경하시겠습니까?')) return;
    try {
      await api.put('/user/nickname', { nickname: nickModalInput.trim() });
      setNickname(nickModalInput.trim());
      localStorage.setItem('nicknameLastChanged', new Date().toISOString());
      refetchUserInfo();
      setNickModalOpen(false);
    } catch {
      setNickModalMsg('변경에 실패했습니다.');
      setNickModalMsgType('error');
    }
  };

  const handleIdentityVerifyForPw = () => {
    setIdentityPurpose('password');
    setIdentityModalOpen(true);
  };

  const handleIdentityVerifyForDelete = () => {
    setIdentityPurpose('delete');
    setIdentityModalOpen(true);
  };

  const handleIdentityVerified = (verifyToken) => {
    setIdentityModalOpen(false);
    if (identityPurpose === 'password') {
      navigate('/change-password', { state: { verifyToken } });
    } else if (identityPurpose === 'delete') {
      setDeleteVerifyToken(verifyToken);
      setDeleteReason('');
      setDeleteMsg('');
      setDeleteModalOpen(true);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) { setDeleteMsg('탈퇴 사유를 입력해주세요.'); return; }
    try {
      await api.delete('/user/account', {
        data: { verifyToken: deleteVerifyToken, deleteReason: deleteReason }
      });
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteMsg(err.response?.data?.message || '탈퇴 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await deleteAlertMutation.mutateAsync(alertId);
    } catch {
      /* ignore */
    }
  };

  const rateList = watchlist.map(s => {
    const open  = s.mkp  || 0;
    const close = s.clpr || 0;
    const rate  = open > 0 ? ((close - open) / open * 100) : 0;
    return { ...s, rate };
  });

  const cooldownDays = getCooldownDays();

  return (
    <div>
      <div className={styles['profile-page']}>

        {/* ── 아바타 미리보기 모달 ── */}
        {avatarModalOpen && (
          <div className={styles['profile-modal-overlay']} onClick={handleAvatarCancel}>
            <div className={styles['profile-modal']} onClick={e => e.stopPropagation()}>
              <div className={styles['profile-modal-header']}>
                <h3 className={styles['profile-modal-title']}>프로필 사진 변경</h3>
                <button className={styles['profile-modal-close']} onClick={handleAvatarCancel}>✕</button>
              </div>
              <div className={styles['profile-modal-body']} style={{ textAlign: 'center' }}>
                <img
                  src={avatarPreview}
                  alt="preview"
                  style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                />
                <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)' }}>
                  이 사진으로 변경하시겠습니까?
                </p>
              </div>
              <div className={styles['profile-modal-footer']}>
                <button className="btn btn-outline" onClick={handleAvatarCancel}>취소</button>
                <button className="btn btn-primary" onClick={handleAvatarConfirm}>변경완료</button>
              </div>
            </div>
          </div>
        )}

        {/* ── 닉네임 변경 모달 ── */}
        {nickModalOpen && (
          <div className={styles['profile-modal-overlay']} onClick={() => setNickModalOpen(false)}>
            <div className={styles['profile-modal']} onClick={e => e.stopPropagation()}>
              <div className={styles['profile-modal-header']}>
                <h3 className={styles['profile-modal-title']}>닉네임 변경</h3>
                <button className={styles['profile-modal-close']} onClick={() => setNickModalOpen(false)}>✕</button>
              </div>

              <div className={styles['profile-modal-body']}>
                {cooldownDays > 0 ? (
                  <p className={styles['nick-cooldown-msg']}>
                    닉네임은 <strong>{cooldownDays}일</strong> 후에 변경 가능합니다.<br/>
                    <span className={styles['nick-cooldown-sub']}>닉네임은 변경 후 30일간 재변경이 불가합니다.</span>
                  </p>
                ) : (
                  <>
                    <div className={styles['nick-modal-input-row']}>
                      <input
                        className="form-input"
                        placeholder="새 닉네임 입력"
                        value={nickModalInput}
                        onChange={e => handleNickInputChange(e.target.value)}
                        maxLength={8}
                        onKeyDown={e => e.key === 'Enter' && handleCheckDuplicate()}
                      />
                      <button className={styles['btn-check-dup']} onClick={handleCheckDuplicate}>
                        중복 검사
                      </button>
                    </div>
                    <p className={styles['nick-modal-hint']}>
                      한글만: 2~8자 &nbsp;|&nbsp; 영문·한글·숫자 혼합: 4~8자 &nbsp;|&nbsp; 특수문자 불가
                    </p>
                    {nickModalMsg && (
                      <p className={`${styles['nick-modal-msg']} ${nickModalMsgType ? styles[nickModalMsgType] : ''}`}>{nickModalMsg}</p>
                    )}
                  </>
                )}
              </div>

              <div className={styles['profile-modal-footer']}>
                <button className="btn btn-outline" onClick={() => setNickModalOpen(false)}>취소</button>
                {cooldownDays === 0 && (
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmNickname}
                    disabled={!nickDupOk}>
                    변경완료
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 본인인증 모달 ── */}
        {identityModalOpen && (
          <IdentityVerifyModal
            title={identityPurpose === 'password' ? '비밀번호 변경 본인인증' : '회원 탈퇴 본인인증'}
            description={identityPurpose === 'password'
              ? '비밀번호 변경을 위해 본인인증이 필요합니다.'
              : '회원 탈퇴를 위해 본인인증이 필요합니다.'}
            onVerified={handleIdentityVerified}
            onClose={() => setIdentityModalOpen(false)}
          />
        )}

        {/* ── 회원탈퇴 모달 (본인인증 완료 후) ── */}
        {deleteModalOpen && (
          <div className={styles['profile-modal-overlay']} onClick={() => setDeleteModalOpen(false)}>
            <div className={styles['profile-modal']} onClick={e => e.stopPropagation()}>
              <div className={styles['profile-modal-header']}>
                <h3 className={`${styles['profile-modal-title']} ${styles['profile-modal-title--danger']}`}>회원 탈퇴</h3>
                <button className={styles['profile-modal-close']} onClick={() => setDeleteModalOpen(false)}>✕</button>
              </div>

              <div className={styles['profile-modal-body']}>
                <p className={styles['delete-modal-desc']}>
                  탈퇴 후 <strong>2주간 보류 상태</strong>로 유지되며, 이후 영구 삭제됩니다.<br/>
                  2주 내 재가입 시 계정을 복구할 수 있습니다.
                </p>
                <div style={{ marginTop: 14 }}>
                  <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>탈퇴 사유</label>
                  <textarea
                    className="form-input"
                    placeholder="탈퇴 사유를 입력해주세요"
                    value={deleteReason}
                    onChange={e => { setDeleteReason(e.target.value); setDeleteMsg(''); }}
                    rows={3}
                    style={{ resize: 'vertical', minHeight: 80 }}
                  />
                </div>
                {deleteMsg && <p className={`${styles['nick-modal-msg']} ${styles.error}`}>{deleteMsg}</p>}
              </div>

              <div className={styles['profile-modal-footer']}>
                <button className="btn btn-outline" onClick={() => setDeleteModalOpen(false)}>취소</button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>탈퇴 확인</button>
              </div>
            </div>
          </div>
        )}

        {/* 페이지 헤더 */}
        <div className={styles['profile-page-header']}>
          <button className={styles['btn-back']} onClick={() => navigate('/')}>← 대시보드</button>
          <h2 className={styles['profile-page-title']}>내 프로필</h2>
        </div>

        {/* 프로필 상단 카드 */}
        <div className={styles['profile-top-card']}>
          <div className={styles['profile-info-row']}>
            <div className={styles['profile-avatar-wrap']} onClick={() => fileRef.current?.click()}>
              <div className={`${styles['profile-avatar']} ${avatarClass ? styles[avatarClass] : ''}`}>
                {avatar
                  ? <img src={avatar} alt="avatar" />
                  : (currentProvider === 'google' ? 'G' : currentProvider === 'kakao' ? 'K' : displayName.charAt(0).toUpperCase())}
              </div>
              <div className={styles['profile-avatar-edit-btn']}>✏</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

            <div className={styles['profile-meta']}>
              <div className={styles['profile-nickname-row']}>
                <span className={styles['profile-nickname-display']}>{displayName}</span>
                <button className={styles['btn-nickname-change']} onClick={openNickModal}>변경하기</button>
              </div>
              <span className={`${styles['role-badge']} ${styles[roleClass]}`}>{roleLabel}</span>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className={styles['profile-stats']}>
          <div className={styles['profile-stat-card']}>
            <div className={styles['profile-stat-value']}>{watchCount}</div>
            <div className={styles['profile-stat-label']}>즐겨찾기 종목</div>
          </div>
          <div className={styles['profile-stat-card']}>
            <div className={styles['profile-stat-value']}>{loginMethod}</div>
            <div className={styles['profile-stat-label']}>로그인 방식</div>
          </div>
          <div className={styles['profile-stat-card']}>
            <div className={`${styles['profile-stat-value']} ${styles['profile-stat-value--date']}`}>{formatShortDate(joinDate)}</div>
            <div className={styles['profile-stat-label']}>가입일</div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className={styles['profile-tabs']}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles['profile-tab-btn']} ${activeTab === t ? styles.active : ''}`}
              onClick={() => setActiveTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        <div className={styles['profile-tab-content']}>

          {/* ── 계정 정보 탭 ── */}
          {activeTab === '계정 정보' && (
            <div className={styles['account-layout']}>

              {/* 왼쪽: 계정 정보 + 소셜 연동 */}
              <div className={styles['account-left']}>
                <div className="section-title">계정 정보</div>
                <div className={styles['info-row']}>
                  <span className={styles['info-key']}>이메일</span>
                  <span className={styles['info-val']}>{isKakaoOnlyEmail ? '소셜 가입 계정' : email}</span>
                </div>
                <div className={styles['info-row']}>
                  <span className={styles['info-key']}>계정 유형</span>
                  <span className={styles['info-val']}>{isSocial ? '소셜 연동됨' : '자체 회원'}</span>
                </div>
                <div className={styles['info-row']}>
                  <span className={styles['info-key']}>보안</span>
                  <span className={`${styles['info-val']} ${styles.secure}`}>🔒 HTTPS 보안 접속</span>
                </div>

                <div className={styles['social-section']}>
                  <div className="section-title" style={{ marginTop: 20 }}>소셜 계정 연동</div>
                  {socialMsg && (
                    <p className={`${styles['social-msg']} ${styles[socialMsgType]}`}>{socialMsg}</p>
                  )}
                  <div className={styles['social-row']}>
                    <div className={styles['social-row-left']}>
                      <span className={`${styles['social-icon']} ${styles['social-icon-kakao']}`}>
                        <svg viewBox="0 0 24 24" fill="#3C1E1E">
                          <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.7 5.08 4.27 6.48L5.2 21l4.87-2.56C10.63 18.6 11.31 18.6 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
                        </svg>
                      </span>
                      <span className={styles['social-name']}>카카오</span>
                      {kakaoLink
                        ? <span className={styles['social-status-linked']}>● 연동됨</span>
                        : <span className={styles['social-status-unlinked']}>미연동</span>}
                      {kakaoLink && (
                        <span className={styles['social-email']}>{kakaoLink.providerEmail}</span>
                      )}
                    </div>
                    {kakaoLink
                      ? <button className={styles['btn-unlink']} onClick={() => handleUnlinkSocial('KAKAO')}>해제</button>
                      : <button className={`${styles['btn-social-link']} ${styles['btn-social-link-kakao']}`} onClick={handleLinkKakao}>연동하기</button>}
                  </div>
                  <div className={styles['social-row']}>
                    <div className={styles['social-row-left']}>
                      <span className={`${styles['social-icon']} ${styles['social-icon-google']}`}>
                        <svg viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </span>
                      <span className={styles['social-name']}>구글</span>
                      {googleLink
                        ? <span className={styles['social-status-linked']}>● 연동됨</span>
                        : <span className={styles['social-status-unlinked']}>미연동</span>}
                      {googleLink && (
                        <span className={styles['social-email']}>{googleLink.providerEmail}</span>
                      )}
                    </div>
                    {googleLink
                      ? <button className={styles['btn-unlink']} onClick={() => handleUnlinkSocial('GOOGLE')}>해제</button>
                      : <button className={`${styles['btn-social-link']} ${styles['btn-social-link-google']}`} onClick={handleLinkGoogle}>연동하기</button>}
                  </div>
                </div>
              </div>

              {/* 오른쪽: 비밀번호 변경 버튼 + 회원 탈퇴 */}
              <div className={styles['account-right']}>
                <div className={styles['pw-section']}>
                  <div className="section-title">비밀번호 변경</div>
                  <p className={styles['pw-section-desc']}>본인인증 후 비밀번호를 변경할 수 있습니다.</p>
                  <button
                    className={styles['btn-change-pw']}
                    onClick={handleIdentityVerifyForPw}>
                    비밀번호 변경하기
                  </button>
                </div>

                <div className={styles['danger-zone']}>
                  <div className={styles['danger-zone-text']}>
                    <p className={styles['danger-desc']}>탈퇴 후 2주간 보류 상태로 유지됩니다.</p>
                  </div>
                  <button className={styles['btn-delete']} onClick={handleIdentityVerifyForDelete}>회원 탈퇴</button>
                </div>
              </div>

            </div>
          )}

          {/* ── 즐겨찾기 탭 ── */}
          {activeTab === '즐겨찾기' && (
            <>
              <div className="section-title">즐겨찾기 종목 ({watchlist.length})</div>
              {watchlist.length === 0 ? (
                <div className={styles['profile-empty']}>즐겨찾기한 종목이 없습니다.</div>
              ) : (
                watchlist.map((s, i) => {
                  const open  = s.mkp  || 0;
                  const close = s.clpr || 0;
                  const rate  = open > 0 ? ((close - open) / open * 100) : 0;
                  const diff  = close - open;
                  const cls   = rate > 0 ? 'up' : rate < 0 ? 'down' : 'zero';
                  const sign  = rate > 0 ? '▲' : rate < 0 ? '▼' : '-';
                  return (
                    <div key={i} className={styles['watchlist-item']}>
                      <div className={styles['watchlist-item-info']}>
                        <p className={styles['item-name']}>{s.itmsNm}</p>
                        <p className={styles['item-code']}>{s.srtnCd} · {s.mrktCtg}</p>
                      </div>
                      <div className={styles['watchlist-item-price']}>
                        <p className={styles['price-val']}>{close.toLocaleString()}원</p>
                        <p className={`${styles['price-diff']} ${cls}`}>
                          {sign} {Math.abs(diff).toLocaleString()} ({rate.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ── 수익률 차트 탭 ── */}
          {activeTab === '수익률 차트' && (
            <>
              <div className="section-title">즐겨찾기 종목 수익률</div>
              {rateList.length === 0 ? (
                <div className={styles['profile-empty']}>즐겨찾기한 종목이 없습니다.</div>
              ) : (
                <>
                  <Bar
                    data={{
                      labels: rateList.map(s => s.itmsNm),
                      datasets: [{
                        label: '등락률 (%)',
                        data: rateList.map(s => s.rate),
                        backgroundColor: rateList.map(s =>
                          s.rate > 0 ? 'rgba(226,76,75,0.75)' : s.rate < 0 ? 'rgba(59,122,217,0.75)' : 'rgba(142,142,147,0.5)'
                        ),
                        borderColor: rateList.map(s =>
                          s.rate > 0 ? '#E24C4B' : s.rate < 0 ? '#3B7AD9' : '#8E8E93'
                        ),
                        borderWidth: 1.5,
                        borderRadius: 4,
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: ctx => `${ctx.raw >= 0 ? '+' : ''}${ctx.raw.toFixed(2)}%` } }
                      },
                      scales: {
                        y: { ticks: { callback: v => `${v}%` }, grid: { color: 'rgba(128,128,128,0.08)' } },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                  <div style={{ marginTop: 20 }}>
                    {[...rateList].sort((a, b) => b.rate - a.rate).map((s, i) => {
                      const cls  = s.rate > 0 ? 'up' : s.rate < 0 ? 'down' : 'zero';
                      const sign = s.rate > 0 ? '▲' : s.rate < 0 ? '▼' : '-';
                      const medalClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'other';
                      return (
                        <div key={i} className={styles['rank-item']}>
                          <div className={styles['rank-item-left']}>
                            <span className={`${styles['rank-medal']} ${styles[medalClass]}`}>{i + 1}</span>
                            <div>
                              <p className={styles['rank-name']}>{s.itmsNm}</p>
                              <p className={styles['rank-code']}>{s.srtnCd}</p>
                            </div>
                          </div>
                          <div>
                            <p className={`${styles['rank-rate']} ${cls}`}>{sign} {Math.abs(s.rate).toFixed(2)}%</p>
                            <p className={styles['rank-price']}>{(s.clpr || 0).toLocaleString()}원</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── 알림 관리 탭 ── */}
          {activeTab === '알림 관리' && (
            <>
              <div className="section-title">목표가 알림 ({alerts.length})</div>
              {alerts.length === 0 ? (
                <div className={styles['profile-empty']}>설정된 알림이 없습니다.</div>
              ) : (
                alerts.map(a => (
                  <div
                    key={a.alertId}
                    className={`${styles['alert-manage-item']} ${styles[a.alertType === 'ABOVE' ? 'above' : 'below']}`}>
                    <div>
                      <p className={styles['alert-manage-name']}>{a.stockName}</p>
                      <p className={styles['alert-manage-condition']}>
                        <span className={a.alertType === 'ABOVE' ? 'up' : 'down'}>
                          {a.alertType === 'ABOVE' ? '▲ 이상' : '▼ 이하'}
                        </span>
                        &nbsp;{a.targetPrice?.toLocaleString()}원
                        {a.isTriggered === 'Y' && (
                          <span className={styles['alert-manage-triggered']}>✓ 도달</span>
                        )}
                      </p>
                    </div>
                    <button className={styles['btn-alert-delete']} onClick={() => handleDeleteAlert(a.alertId)}>
                      삭제
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {/* ── 포트폴리오 탭 ── */}
          {activeTab === '포트폴리오' && (() => {
            const priceMap = Object.fromEntries(
              stockPrices.map(s => [s.srtnCd, s.clpr || 0])
            );

            const enriched = portfolio.map(p => {
              const curPrice  = priceMap[p.ticker] ?? p.buyPrice;
              const hasPrice  = !!priceMap[p.ticker];
              const invested  = p.buyPrice * p.quantity;
              const evaluated = curPrice    * p.quantity;
              const pnl       = evaluated - invested;
              const rate      = p.buyPrice > 0 ? ((curPrice - p.buyPrice) / p.buyPrice * 100) : 0;
              return { ...p, curPrice, hasPrice, invested, evaluated, pnl, rate };
            });

            const totalBuy  = enriched.reduce((s, p) => s + p.invested,  0);
            const totalNow  = enriched.reduce((s, p) => s + p.evaluated, 0);
            const totalPnl  = totalNow - totalBuy;
            const totalRate = totalBuy > 0 ? (totalPnl / totalBuy * 100) : 0;
            const totalCls  = totalPnl > 0 ? 'up' : totalPnl < 0 ? 'down' : '';
            const totalSign = totalPnl > 0 ? '+' : '';

            const pricedOnly = enriched.filter(p => p.hasPrice);
            const topGainer  = pricedOnly.length
              ? [...pricedOnly].sort((a, b) => b.rate - a.rate)[0]
              : null;
            const topLoser   = pricedOnly.length
              ? [...pricedOnly].sort((a, b) => a.rate - b.rate)[0]
              : null;

            const chartOrdered = [...enriched].sort((a, b) => b.pnl - a.pnl);
            const pnlColor  = pnl => pnl > 0 ? 'rgba(226,76,75,0.75)' : pnl < 0 ? 'rgba(59,122,217,0.75)' : 'rgba(142,142,147,0.5)';
            const pnlBorder = pnl => pnl > 0 ? '#E24C4B' : pnl < 0 ? '#3B7AD9' : '#8E8E93';

            const sortedList = [...enriched].sort((a, b) => {
              const dir = pfSortDir === 'asc' ? 1 : -1;
              if (pfSortKey === 'pnl')   return (a.pnl - b.pnl) * dir;
              if (pfSortKey === 'rate')  return (a.rate - b.rate) * dir;
              if (pfSortKey === 'value') return (a.evaluated - b.evaluated) * dir;
              if (pfSortKey === 'name')  return a.stockName.localeCompare(b.stockName, 'ko') * dir;
              if (pfSortKey === 'date')  return String(a.buyDate || '').localeCompare(String(b.buyDate || '')) * dir;
              return 0;
            });

            return (
              <>
                {portfolio.length > 0 && (
                  <div className={styles['pf-summary']}>
                    <div className={styles['pf-summary-item']}>
                      <span className={styles['pf-summary-label']}>총 투자금액</span>
                      <span className={styles['pf-summary-value']}>{totalBuy.toLocaleString()}원</span>
                    </div>
                    <div className={styles['pf-summary-item']}>
                      <span className={styles['pf-summary-label']}>총 평가금액</span>
                      <span className={styles['pf-summary-value']}>{totalNow.toLocaleString()}원</span>
                    </div>
                    <div className={styles['pf-summary-item']}>
                      <span className={styles['pf-summary-label']}>총 손익</span>
                      <span className={`${styles['pf-summary-value']} ${totalCls}`}>
                        {totalSign}{totalPnl.toLocaleString()}원
                      </span>
                    </div>
                    <div className={styles['pf-summary-item']}>
                      <span className={styles['pf-summary-label']}>수익률</span>
                      <span className={`${styles['pf-summary-value']} ${totalCls}`}>
                        {totalSign}{totalRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}

                {(topGainer || topLoser) && (
                  <div className={styles['pf-highlight-row']}>
                    {topGainer && topGainer.rate > 0 && (
                      <div className={`${styles['pf-highlight']} ${styles['pf-highlight-up']}`}>
                        <span className={styles['pf-highlight-badge']}>🏆 최고 수익</span>
                        <p className={styles['pf-highlight-name']}>{topGainer.stockName}</p>
                        <p className={styles['pf-highlight-rate']}>+{topGainer.rate.toFixed(2)}%</p>
                        <p className={styles['pf-highlight-pnl']}>+{Math.round(topGainer.pnl).toLocaleString()}원</p>
                      </div>
                    )}
                    {topLoser && topLoser.rate < 0 && (
                      <div className={`${styles['pf-highlight']} ${styles['pf-highlight-down']}`}>
                        <span className={styles['pf-highlight-badge']}>⚠ 최대 손실</span>
                        <p className={styles['pf-highlight-name']}>{topLoser.stockName}</p>
                        <p className={styles['pf-highlight-rate']}>{topLoser.rate.toFixed(2)}%</p>
                        <p className={styles['pf-highlight-pnl']}>{Math.round(topLoser.pnl).toLocaleString()}원</p>
                      </div>
                    )}
                  </div>
                )}

                {portfolio.length > 0 && (
                  <div className={styles['pf-chart-wrap']}>
                    <div className="section-title" style={{ marginBottom: 12 }}>종목별 손익 (손익 큰 순)</div>
                    <Bar
                      data={{
                        labels: chartOrdered.map(p => p.stockName),
                        datasets: [{
                          label: '손익 (원)',
                          data: chartOrdered.map(p => p.pnl),
                          backgroundColor: chartOrdered.map(p => pnlColor(p.pnl)),
                          borderColor:     chartOrdered.map(p => pnlBorder(p.pnl)),
                          borderWidth: 1.5,
                          borderRadius: 4,
                        }]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: ctx => {
                                const v = ctx.raw;
                                const item = chartOrdered[ctx.dataIndex];
                                return [
                                  `${v >= 0 ? '+' : ''}${Math.round(v).toLocaleString()}원`,
                                  `수익률 ${item.rate >= 0 ? '+' : ''}${item.rate.toFixed(2)}%`,
                                ];
                              }
                            }
                          }
                        },
                        scales: {
                          y: { ticks: { callback: v => `${v >= 0 ? '+' : ''}${Number(v).toLocaleString()}` }, grid: { color: 'rgba(128,128,128,0.08)' } },
                          x: { grid: { display: false } }
                        }
                      }}
                    />
                  </div>
                )}

                {portfolio.length > 0 && (
                  <div className={styles['pf-chart-wrap']}>
                    <div className="section-title" style={{ marginBottom: 12 }}>투자금 vs 평가금 비교</div>
                    <Bar
                      data={{
                        labels: chartOrdered.map(p => p.stockName),
                        datasets: [
                          {
                            label: '투자금',
                            data: chartOrdered.map(p => p.invested),
                            backgroundColor: 'rgba(142,142,147,0.45)',
                            borderColor: '#8E8E93',
                            borderWidth: 1,
                            borderRadius: 4,
                          },
                          {
                            label: '평가금',
                            data: chartOrdered.map(p => p.evaluated),
                            backgroundColor: chartOrdered.map(p => pnlColor(p.pnl)),
                            borderColor:     chartOrdered.map(p => pnlBorder(p.pnl)),
                            borderWidth: 1.5,
                            borderRadius: 4,
                          },
                        ]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
                          tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${Math.round(ctx.raw).toLocaleString()}원` } }
                        },
                        scales: {
                          y: { ticks: { callback: v => `${Number(v).toLocaleString()}` }, grid: { color: 'rgba(128,128,128,0.08)' } },
                          x: { grid: { display: false } }
                        }
                      }}
                    />
                  </div>
                )}

                {portfolio.length > 0 && (
                  <div className={styles['pf-charts-row']}>
                    <div className={styles['pf-chart-wrap']}>
                      <div className="section-title" style={{ marginBottom: 12 }}>종목별 수익률</div>
                      <Bar
                        data={{
                          labels: chartOrdered.map(p => p.stockName),
                          datasets: [{
                            label: '수익률 (%)',
                            data: chartOrdered.map(p => p.rate),
                            backgroundColor: chartOrdered.map(p => pnlColor(p.pnl)),
                            borderColor:     chartOrdered.map(p => pnlBorder(p.pnl)),
                            borderWidth: 1.5,
                            borderRadius: 4,
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: ctx => `${ctx.raw >= 0 ? '+' : ''}${ctx.raw.toFixed(2)}%` } }
                          },
                          scales: {
                            y: { ticks: { callback: v => `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}%` }, grid: { color: 'rgba(128,128,128,0.08)' } },
                            x: { grid: { display: false } }
                          }
                        }}
                      />
                    </div>
                    <div className={styles['pf-chart-wrap']}>
                      <div className="section-title" style={{ marginBottom: 12 }}>포트폴리오 구성 (투자금 기준)</div>
                      <Doughnut
                        data={{
                          labels: enriched.map(p => p.stockName),
                          datasets: [{
                            data: enriched.map(p => p.invested),
                            backgroundColor: ['#4f8ef7','#f76e6e','#4ec980','#f7c94f','#9b59b6','#1abc9c','#e67e22','#3498db','#e74c3c','#2ecc71'].slice(0, enriched.length),
                            borderWidth: 1,
                            borderColor: 'var(--surface-2)',
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
                            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${Number(ctx.raw).toLocaleString()}원 (${totalBuy > 0 ? (ctx.raw / totalBuy * 100).toFixed(1) : 0}%)` } }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className={styles['pf-header']}>
                  <div className="section-title" style={{ margin: 0 }}>보유 종목 ({portfolio.length})</div>
                  <div className={styles['pf-header-actions']}>
                    {portfolio.length > 1 && (
                      <>
                        <select
                          className={styles['pf-sort-select']}
                          value={pfSortKey}
                          onChange={e => setPfSortKey(e.target.value)}>
                          <option value="pnl">손익순</option>
                          <option value="rate">수익률순</option>
                          <option value="value">평가금액순</option>
                          <option value="name">이름순</option>
                          <option value="date">매수일순</option>
                        </select>
                        <button
                          className={styles['pf-sort-dir']}
                          onClick={() => setPfSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                          title={pfSortDir === 'asc' ? '오름차순' : '내림차순'}>
                          {pfSortDir === 'asc' ? '↑ 오름' : '↓ 내림'}
                        </button>
                      </>
                    )}
                    <button className={styles['btn-pf-add']} onClick={() => { setPfFormOpen(v => !v); setPfMsg(''); }}>
                      {pfFormOpen ? '✕ 닫기' : '+ 종목 추가'}
                    </button>
                  </div>
                </div>

                {pfFormOpen && (
                  <div className={styles['pf-form']}>
                    <div className={styles['pf-form-row']}>
                      <div className={styles['pf-form-field']}>
                        <label className={styles['pf-form-label']}>종목코드</label>
                        <input className="form-input" placeholder="예: 005930" value={pfTicker}
                          onChange={e => setPfTicker(e.target.value)} maxLength={10} />
                      </div>
                      <div className={styles['pf-form-field']}>
                        <label className={styles['pf-form-label']}>종목명</label>
                        <input className="form-input" placeholder="예: 삼성전자" value={pfName}
                          onChange={e => setPfName(e.target.value)} maxLength={50} />
                      </div>
                    </div>
                    <div className={styles['pf-form-row']}>
                      <div className={styles['pf-form-field']}>
                        <label className={styles['pf-form-label']}>보유수량</label>
                        <input className="form-input" type="number" placeholder="예: 10" value={pfQty}
                          onChange={e => setPfQty(e.target.value)} min="0" step="0.01" />
                      </div>
                      <div className={styles['pf-form-field']}>
                        <label className={styles['pf-form-label']}>매수가 (원)</label>
                        <input className="form-input" type="number" placeholder="예: 72000" value={pfPrice}
                          onChange={e => setPfPrice(e.target.value)} min="0" />
                      </div>
                      <div className={styles['pf-form-field']}>
                        <label className={styles['pf-form-label']}>매수일</label>
                        <input className="form-input" type="date" value={pfDate}
                          onChange={e => setPfDate(e.target.value)} />
                      </div>
                    </div>
                    {pfMsg && <p className={`feedback-msg ${pfMsgType}`}>{pfMsg}</p>}
                    <button
                      className="btn btn-primary"
                      onClick={handleAddPortfolio}
                      disabled={addPortfolioMutation.isPending}>
                      {addPortfolioMutation.isPending ? '추가 중...' : '추가'}
                    </button>
                  </div>
                )}

                {portfolio.length === 0 ? (
                  <div className={styles['profile-empty']}>보유 종목이 없습니다.</div>
                ) : (
                  <div className={styles['pf-list']}>
                    {sortedList.map(p => {
                      const cls  = p.pnl > 0 ? 'up' : p.pnl < 0 ? 'down' : '';
                      const sign = p.pnl > 0 ? '+' : '';
                      return (
                        <div key={p.portfolioId} className={styles['pf-item']}>
                          <div className={styles['pf-item-left']}>
                            <p className={styles['pf-item-name']}>{p.stockName}</p>
                            <p className={styles['pf-item-meta']}>
                              {p.ticker} &middot; {p.quantity}주 &middot; 매수 {p.buyPrice.toLocaleString()}원 &middot; {formatShortDate(p.buyDate)}
                            </p>
                          </div>
                          <div className={styles['pf-item-right']}>
                            {p.hasPrice ? (
                              <>
                                <p className={styles['pf-item-cur']}>{p.curPrice.toLocaleString()}원</p>
                                <p className={`${styles['pf-item-pnl']} ${cls}`}>
                                  {sign}{Math.round(p.pnl).toLocaleString()}원 ({sign}{p.rate.toFixed(2)}%)
                                </p>
                              </>
                            ) : (
                              <p className={styles['pf-item-cur']} style={{ color: 'var(--text-3)' }}>현재가 없음</p>
                            )}
                            <button
                              className={styles['btn-pf-delete']}
                              onClick={() => deletePortfolioMutation.mutate(p.portfolioId)}
                              disabled={deletePortfolioMutation.isPending}>
                              삭제
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}

          {/* ── AI 분석 탭 ── */}
          {activeTab === 'AI 분석' && (() => {
            const priceMap = Object.fromEntries(
              stockPrices.map(s => [s.srtnCd, s.clpr || 0])
            );
            return (
              <>
                <div className="section-title" style={{ marginBottom: 16 }}>포트폴리오 AI 분석</div>
                {portfolio.length === 0 ? (
                  <div className={styles['profile-empty']}>
                    포트폴리오 탭에서 종목을 추가하면 AI 분석을 받을 수 있습니다.
                  </div>
                ) : (
                  <AiAnalysis type="portfolio" portfolio={portfolio} priceMap={priceMap} />
                )}
              </>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
