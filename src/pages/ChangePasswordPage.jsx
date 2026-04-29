import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import IdentityVerifyModal from '../components/IdentityVerifyModal';
import shared from '../styles/pages/AuthShared.module.css';

function validatePassword(pw) {
  if (pw.length < 6 || pw.length > 12) return '비밀번호는 6~12자여야 합니다.';
  const hasLetter  = /[가-힣a-zA-Z]/.test(pw);
  const hasNumber  = /[0-9]/.test(pw);
  const hasSpecial = /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?~`]/.test(pw);
  const types = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  if (types < 2) return '영문·한글·숫자·특수문자 중 2가지 이상을 혼합해야 합니다.';
  return null;
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  const stateVerifyToken = location.state?.verifyToken || '';

  const [verifyToken, setVerifyToken] = useState(stateVerifyToken);
  const [isForcePwChange, setIsForcePwChange] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg]             = useState('');
  const [msgType, setMsgType]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const forcePw = sessionStorage.getItem('forcePwChange');

    if (forcePw === 'Y') {
      sessionStorage.removeItem('forcePwChange');
      setIsForcePwChange(true);
      setShowIdentityModal(true);
      return;
    }

    if (!stateVerifyToken) {
      navigate('/profile');
    }
  }, [navigate, stateVerifyToken]);

  const handleIdentityVerified = (token) => {
    setVerifyToken(token);
    setShowIdentityModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!newPw || !confirmPw) {
      setMsg('모든 항목을 입력해주세요.'); setMsgType('error'); return;
    }
    const pwErr = validatePassword(newPw);
    if (pwErr) { setMsg(pwErr); setMsgType('error'); return; }
    if (newPw !== confirmPw) {
      setMsg('새 비밀번호가 일치하지 않습니다.'); setMsgType('error'); return;
    }
    setLoading(true);
    try {
      await api.put('/user/password', { verifyToken, newPassword: newPw });
      setMsg('비밀번호가 변경됐습니다. 다시 로그인해주세요.'); setMsgType('success');
      setTimeout(() => { logout(); navigate('/login'); }, 2000);
    } catch (err) {
      setMsg(err.response?.data?.message || '비밀번호 변경에 실패했습니다.'); setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  if (showIdentityModal) {
    return (
      <div className="auth-page">
        <IdentityVerifyModal
          title="비밀번호 변경 본인인증"
          description="임시 비밀번호로 로그인되었습니다. 비밀번호 변경을 위해 본인인증이 필요합니다."
          onVerified={handleIdentityVerified}
          onClose={() => { logout(); navigate('/login'); }}
        />
      </div>
    );
  }

  if (!verifyToken) return null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        {!isForcePwChange && (
          <div className="auth-topbar">
            <button type="button" className="auth-back" onClick={() => navigate('/profile')} aria-label="뒤로">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className={shared['topbar-spacer']} />
          </div>
        )}

        <form className="auth-body" onSubmit={handleSubmit} noValidate>
          <h1 className="auth-headline">비밀번호<br/>변경하기</h1>
          <p className="auth-sub">
            {isForcePwChange
              ? '계정이 복구되었습니다.\n보안을 위해 새 비밀번호를 설정해주세요.'
              : '본인인증이 완료되었습니다.\n새 비밀번호를 설정해주세요.'}
          </p>

          <div className="auth-field">
            <label className="auth-label">새 비밀번호</label>
            <div className="auth-input-row">
              <input
                className="auth-input"
                type={showNew ? 'text' : 'password'}
                placeholder="6~12자, 2종류 이상 혼합"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setMsg(''); }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-input-eye"
                onClick={() => setShowNew(p => !p)}
                aria-label={showNew ? '비밀번호 숨기기' : '비밀번호 보기'}>
                {showNew ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">새 비밀번호 확인</label>
            <div className="auth-input-row">
              <input
                className={`auth-input ${confirmPw && newPw !== confirmPw ? 'error' : ''}`}
                type={showConfirm ? 'text' : 'password'}
                placeholder="다시 한 번 입력"
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setMsg(''); }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-input-eye"
                onClick={() => setShowConfirm(p => !p)}
                aria-label={showConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}>
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
            {confirmPw && newPw !== confirmPw && (
              <p className="auth-error-msg">비밀번호가 일치하지 않아요</p>
            )}
          </div>

          {msg && (
            msgType === 'success'
              ? <p className="auth-help-msg">{msg}</p>
              : <p className="auth-error-msg">{msg}</p>
          )}

          <div className="auth-cta-bar">
            <button
              type="submit"
              className={`auth-btn ${isForcePwChange ? shared['btn-submit-full'] : ''}`}
              disabled={loading || !newPw || newPw !== confirmPw}>
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
            {!isForcePwChange && (
              <button
                type="button"
                className={`auth-btn auth-btn-secondary ${shared['btn-secondary-spaced']}`}
                onClick={() => navigate('/profile')}>
                취소
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
