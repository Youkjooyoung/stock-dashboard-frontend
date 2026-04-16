import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import IdentityVerifyModal from '../components/IdentityVerifyModal';
import styles from '../styles/pages/ChangePasswordPage.module.css';

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
  const [pwVisible, setPwVisible] = useState({ new: false, confirm: false });

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
      <div className={styles['change-pw-page']}>
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
    <div className={styles['change-pw-page']}>
      <div className={styles['change-pw-card']}>

        <div className={styles['change-pw-header']}>
          {!isForcePwChange && (
            <button className={styles['btn-back']} onClick={() => navigate('/profile')}>← 프로필로 돌아가기</button>
          )}
          <h2 className={styles['change-pw-title']}>비밀번호 변경</h2>
          <p className={styles['change-pw-desc']}>
            {isForcePwChange
              ? '계정이 복구되었습니다. 보안을 위해 새 비밀번호를 설정해주세요.'
              : '본인인증이 완료되었습니다. 새 비밀번호를 설정해주세요.'}
          </p>
        </div>

        <form className={styles['change-pw-form']} onSubmit={handleSubmit}>
          {[
            { label: '새 비밀번호',     value: newPw,     setter: setNewPw,     key: 'new',     placeholder: '영문·한글·숫자·특수문자 중 2가지 이상 혼합 / 6~12자' },
            { label: '새 비밀번호 확인', value: confirmPw, setter: setConfirmPw, key: 'confirm', placeholder: '새 비밀번호를 다시 입력하세요' },
          ].map(({ label, value, setter, key, placeholder }) => (
            <div className={styles['form-group']} key={key}>
              <label className={styles['form-label']}>{label}</label>
              <div className={styles['input-wrap']}>
                <input
                  className={styles['form-input']}
                  type={pwVisible[key] ? 'text' : 'password'}
                  placeholder={placeholder}
                  value={value}
                  onChange={e => { setter(e.target.value); setMsg(''); }}
                />
                <button
                  className={styles['pw-toggle']}
                  type="button"
                  onClick={() => setPwVisible(prev => ({ ...prev, [key]: !prev[key] }))}>
                  {pwVisible[key] ? '숨기기' : '보기'}
                </button>
              </div>
            </div>
          ))}

          {msg && <p className={`${styles['feedback-msg']} ${styles[msgType]}`}>{msg}</p>}

          <div className={styles['btn-row']}>
            {!isForcePwChange && (
              <button
                type="button"
                className={styles['btn-cancel']}
                onClick={() => navigate('/profile')}>
                취소
              </button>
            )}
            <button
              type="submit"
              className={styles['btn-submit']}
              disabled={loading}
              style={isForcePwChange ? { flex: 1 } : undefined}>
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
