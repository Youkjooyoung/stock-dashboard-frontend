import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend
} from 'chart.js';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import {
  useWatchlist, useWatchlistDetail, useAlerts,
  useDeleteAlert, useUserInfo,
  usePortfolio, useAddPortfolio, useDeletePortfolio,
  useStockPrices, useSocialLinks, useUnlinkSocial,
} from '../hooks/useQueries';
import AiAnalysis from '../components/AiAnalysis';
import styles from '../styles/pages/ProfilePage.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TABS = ['계정 정보', '즐겨찾기', '수익률 차트', '알림 관리', '포트폴리오', 'AI 분석'];
const NICK_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30일

/* ── 유틸 함수 ────────────────────────────────── */
function formatDate(str) {
  if (!str) return '-';
  if (str.includes('T')) return str.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  if (/^\d{8}$/.test(str)) return `${str.slice(0,4)}-${str.slice(4,6)}-${str.slice(6,8)}`;
  return str;
}

function validateNickname(name) {
  if (!name.trim()) return '닉네임을 입력해주세요.';
  if (/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?~`]/.test(name))
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

function validatePassword(pw) {
  if (pw.length < 6 || pw.length > 12) return '비밀번호는 6~12자여야 합니다.';
  const hasLetter  = /[가-힣a-zA-Z]/.test(pw);
  const hasNumber  = /[0-9]/.test(pw);
  const hasSpecial = /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?~`]/.test(pw);
  const types = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  if (types < 2) return '영문·한글·숫자·특수문자 중 2가지 이상을 혼합해야 합니다.';
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
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg]         = useState('');
  const [pwMsgType, setPwMsgType] = useState('');
  const [loading, setLoading]     = useState(false);
  const [pwVisible, setPwVisible] = useState({ current: false, new: false, confirm: false });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword]   = useState('');
  const [deletePwVisible, setDeletePwVisible] = useState(false);
  const [deleteMsg, setDeleteMsg]             = useState('');

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
    reader.readAsDataURL(file);
  };

  const handleAvatarConfirm = () => {
    setAvatar(avatarPreview);
    localStorage.setItem('userAvatar', avatarPreview);
    setAvatarModalOpen(false);
    setAvatarPreview('');
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

  const handleChangePassword = async () => {
    setPwMsg('');
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg('모든 항목을 입력해주세요.'); setPwMsgType('error'); return;
    }
    const pwErr = validatePassword(newPw);
    if (pwErr) { setPwMsg(pwErr); setPwMsgType('error'); return; }
    if (newPw !== confirmPw) {
      setPwMsg('새 비밀번호가 일치하지 않습니다.'); setPwMsgType('error'); return;
    }
    setLoading(true);
    try {
      await api.put('/user/password', { currentPassword: currentPw, newPassword: newPw });
      setPwMsg('변경됐습니다. 다시 로그인해주세요.'); setPwMsgType('success');
      setTimeout(() => { logout(); navigate('/login'); }, 2000);
    } catch { setPwMsg('현재 비밀번호가 틀렸습니다.'); setPwMsgType('error'); }
    finally { setLoading(false); }
  };

  const openDeleteModal = () => {
    setDeletePassword('');
    setDeleteMsg('');
    setDeletePwVisible(false);
    setDeleteModalOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteMsg('비밀번호를 입력해주세요.'); return; }
    try {
      await api.delete('/user/account', { data: { password: deletePassword } });
      logout();
      navigate('/login');
    } catch {
      setDeleteMsg('비밀번호가 일치하지 않거나 오류가 발생했습니다.');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await deleteAlertMutation.mutateAsync(alertId);
    } catch {}
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

        {/* ── 회원탈퇴 모달 ── */}
        {deleteModalOpen && (
          <div className={styles['profile-modal-overlay']} onClick={() => setDeleteModalOpen(false)}>
            <div className={styles['profile-modal']} onClick={e => e.stopPropagation()}>
              <div className={styles['profile-modal-header']}>
                <h3 className={`${styles['profile-modal-title']} ${styles['profile-modal-title--danger']}`}>회원 탈퇴</h3>
                <button className={styles['profile-modal-close']} onClick={() => setDeleteModalOpen(false)}>✕</button>
              </div>

              <div className={styles['profile-modal-body']}>
                <p className={styles['delete-modal-desc']}>
                  탈퇴 시 모든 데이터가 <strong>영구 삭제</strong>됩니다.<br/>
                  현재 비밀번호를 입력하여 탈퇴를 확인해주세요.
                </p>
                <div className="input-wrap" style={{ marginTop: 14 }}>
                  <input
                    className="form-input"
                    type={deletePwVisible ? 'text' : 'password'}
                    placeholder="현재 비밀번호"
                    value={deletePassword}
                    onChange={e => { setDeletePassword(e.target.value); setDeleteMsg(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleDeleteAccount()}
                  />
                  <button className="pw-toggle" type="button" onClick={() => setDeletePwVisible(v => !v)}>
                    {deletePwVisible ? '숨기기' : '보기'}
                  </button>
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
            <div className={`${styles['profile-stat-value']} ${styles['profile-stat-value--date']}`}>{formatDate(joinDate)}</div>
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
            <>
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
                    <span className={`${styles['social-icon']} ${styles['social-icon-kakao']}`}>K</span>
                    <span className={styles['social-name']}>카카오</span>
                    {kakaoLink
                      ? <span className={styles['social-email']}>{kakaoLink.providerEmail}</span>
                      : <span className={styles['social-not-linked']}>미연동</span>}
                  </div>
                  {kakaoLink
                    ? <button className={styles['btn-unlink']} onClick={() => handleUnlinkSocial('KAKAO')}>해제</button>
                    : <button className={`${styles['btn-social-link']} ${styles['btn-social-link-kakao']}`} onClick={handleLinkKakao}>연동하기</button>}
                </div>

                <div className={styles['social-row']}>
                  <div className={styles['social-row-left']}>
                    <span className={`${styles['social-icon']} ${styles['social-icon-google']}`}>G</span>
                    <span className={styles['social-name']}>구글</span>
                    {googleLink
                      ? <span className={styles['social-email']}>{googleLink.providerEmail}</span>
                      : <span className={styles['social-not-linked']}>미연동</span>}
                  </div>
                  {googleLink
                    ? <button className={styles['btn-unlink']} onClick={() => handleUnlinkSocial('GOOGLE')}>해제</button>
                    : <button className={`${styles['btn-social-link']} ${styles['btn-social-link-google']}`} onClick={handleLinkGoogle}>연동하기</button>}
                </div>
              </div>

              <div className={styles['pw-section']}>
                <div className="section-title" style={{ marginTop: 20 }}>비밀번호 변경</div>
                {[
                  { label: '현재 비밀번호', value: currentPw, setter: setCurrentPw, key: 'current', placeholder: '현재 비밀번호' },
                  { label: '새 비밀번호',   value: newPw,     setter: setNewPw,     key: 'new',     placeholder: '영문·한글·숫자·특수문자 중 2가지 이상 혼합 / 6~12자' },
                  { label: '비밀번호 확인', value: confirmPw, setter: setConfirmPw, key: 'confirm', placeholder: '새 비밀번호 재입력' },
                ].map(({ label, value, setter, key, placeholder }) => (
                  <div className="form-group" key={key}>
                    <label className="form-label">{label}</label>
                    <div className="input-wrap">
                      <input
                        className="form-input"
                        type={pwVisible[key] ? 'text' : 'password'}
                        placeholder={placeholder}
                        value={value}
                        onChange={e => setter(e.target.value)}
                      />
                      <button
                        className="pw-toggle"
                        type="button"
                        onClick={() => setPwVisible(prev => ({ ...prev, [key]: !prev[key] }))}>
                        {pwVisible[key] ? '숨기기' : '보기'}
                      </button>
                    </div>
                  </div>
                ))}
                {pwMsg && <p className={`feedback-msg ${pwMsgType}`}>{pwMsg}</p>}
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleChangePassword}
                  disabled={loading}
                  style={{ marginBottom: 16 }}>
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>

              <div className={styles['danger-zone']}>
                <div className={styles['danger-zone-text']}>
                  <p className={styles['danger-desc']}>탈퇴 시 모든 데이터가 영구 삭제됩니다.</p>
                </div>
                <button className={styles['btn-delete']} onClick={openDeleteModal}>회원 탈퇴</button>
              </div>
            </>
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
                          s.rate > 0 ? 'rgba(200,74,49,0.7)' : s.rate < 0 ? 'rgba(23,99,178,0.7)' : 'rgba(153,153,153,0.5)'
                        ),
                        borderColor: rateList.map(s =>
                          s.rate > 0 ? '#c84a31' : s.rate < 0 ? '#1763b2' : '#999'
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

            const totalBuy  = portfolio.reduce((s, p) => s + p.buyPrice  * p.quantity, 0);
            const totalNow  = portfolio.reduce((s, p) => s + (priceMap[p.ticker] ?? p.buyPrice) * p.quantity, 0);
            const totalPnl  = totalNow - totalBuy;
            const totalRate = totalBuy > 0 ? (totalPnl / totalBuy * 100) : 0;
            const totalCls  = totalPnl > 0 ? 'up' : totalPnl < 0 ? 'down' : '';
            const totalSign = totalPnl > 0 ? '+' : '';

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

                {portfolio.length > 0 && (
                  <div className={styles['pf-chart-wrap']}>
                    <div className="section-title" style={{ marginBottom: 12 }}>종목별 손익</div>
                    <Bar
                      data={{
                        labels: portfolio.map(p => p.stockName),
                        datasets: [{
                          label: '손익 (원)',
                          data: portfolio.map(p => {
                            const cur = priceMap[p.ticker] ?? p.buyPrice;
                            return (cur - p.buyPrice) * p.quantity;
                          }),
                          backgroundColor: portfolio.map(p => {
                            const cur = priceMap[p.ticker] ?? p.buyPrice;
                            const pnl = (cur - p.buyPrice) * p.quantity;
                            return pnl > 0 ? 'rgba(200,74,49,0.7)' : pnl < 0 ? 'rgba(23,99,178,0.7)' : 'rgba(153,153,153,0.5)';
                          }),
                          borderColor: portfolio.map(p => {
                            const cur = priceMap[p.ticker] ?? p.buyPrice;
                            const pnl = (cur - p.buyPrice) * p.quantity;
                            return pnl > 0 ? '#c84a31' : pnl < 0 ? '#1763b2' : '#999';
                          }),
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
                                return `${v >= 0 ? '+' : ''}${Math.round(v).toLocaleString()}원`;
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

                <div className={styles['pf-header']}>
                  <div className="section-title" style={{ margin: 0 }}>보유 종목 ({portfolio.length})</div>
                  <button className={styles['btn-pf-add']} onClick={() => { setPfFormOpen(v => !v); setPfMsg(''); }}>
                    {pfFormOpen ? '✕ 닫기' : '+ 종목 추가'}
                  </button>
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
                    {portfolio.map(p => {
                      const curPrice = priceMap[p.ticker] ?? p.buyPrice;
                      const pnl      = (curPrice - p.buyPrice) * p.quantity;
                      const rate     = p.buyPrice > 0 ? ((curPrice - p.buyPrice) / p.buyPrice * 100) : 0;
                      const cls      = pnl > 0 ? 'up' : pnl < 0 ? 'down' : '';
                      const sign     = pnl > 0 ? '+' : '';
                      const hasPrice = !!priceMap[p.ticker];
                      return (
                        <div key={p.portfolioId} className={styles['pf-item']}>
                          <div className={styles['pf-item-left']}>
                            <p className={styles['pf-item-name']}>{p.stockName}</p>
                            <p className={styles['pf-item-meta']}>
                              {p.ticker} &middot; {p.quantity}주 &middot; 매수 {p.buyPrice.toLocaleString()}원 &middot; {formatDate(p.buyDate)}
                            </p>
                          </div>
                          <div className={styles['pf-item-right']}>
                            {hasPrice ? (
                              <>
                                <p className={styles['pf-item-cur']}>{curPrice.toLocaleString()}원</p>
                                <p className={`${styles['pf-item-pnl']} ${cls}`}>
                                  {sign}{pnl.toLocaleString()}원 ({sign}{rate.toFixed(2)}%)
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