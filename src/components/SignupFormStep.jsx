import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import AddressSearch from './AddressSearch';
import SecureKeypad from './SecureKeypad';
import { useToast } from '../hooks/useToast';
import styles from '../styles/components/SignupFormStep.toss.module.css';

const API = `${API_BASE_URL}/api/auth`;

const STRENGTH_LABELS = ['', '약함', '보통', '강함', '매우 강함'];

function getPasswordStrength(pw) {
    if (!pw) return 0;
    const hasLetter  = /[가-힣a-zA-Z]/.test(pw);
    const hasNumber  = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?~`]/.test(pw);
    const types = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
    if (pw.length < 6) return 1;
    if (types >= 3 && pw.length >= 10) return 4;
    if (types >= 2 && pw.length >= 8)  return 3;
    if (types >= 2)                    return 2;
    return 1;
}

function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validateNickname(name) {
    if (!name.trim()) return '닉네임을 입력해주세요.';
    if (/[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?~`]/.test(name)) return '특수문자는 사용할 수 없습니다.';
    if (!/^[가-힣a-zA-Z0-9]+$/.test(name)) return '한글, 영문, 숫자만 사용 가능합니다.';
    if (/^[가-힣]+$/.test(name)) {
        if (name.length < 2 || name.length > 8) return '한글만 사용 시 2~8자여야 합니다.';
    } else {
        if (name.length < 4 || name.length > 8) return '영문·한글·숫자 혼합 시 4~8자여야 합니다.';
    }
    return null;
}

function validatePassword(pw) {
    if (!pw) return '비밀번호를 입력해주세요.';
    if (pw.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (!/[a-z]/.test(pw)) return '소문자(a-z)를 포함해야 합니다.';
    if (!/[A-Z]/.test(pw)) return '대문자(A-Z)를 포함해야 합니다.';
    if (!/[0-9]/.test(pw)) return '숫자를 포함해야 합니다.';
    if (!/[!@#$%^&*]/.test(pw)) return '특수문자(!@#$%^&*)를 포함해야 합니다.';
    return null;
}

function validateResidentNo(v) {
    const c = v.replace('-', '');
    if (!/^\d{13}$/.test(c)) return false;
    const w = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
    const sum = w.reduce((acc, cur, i) => acc + cur * parseInt(c[i]), 0);
    return (11 - (sum % 11)) % 10 === parseInt(c[12]);
}

export default function SignupFormStep({ certInfo, onComplete }) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [emailChecked, setEmailChecked] = useState(false);
    const [emailExists, setEmailExists]   = useState(false);
    const [errors, setErrors]             = useState({});
    const [form, setForm]                 = useState({
        email: '', password: '', passwordConfirm: '',
        nickname: '',
        address: '', addressDetail: '', agreedTerms: false,
    });
    const [loading, setLoading]   = useState(false);
    const [rrnBack, setRrnBack]   = useState('');
    const [rrnFront, setRrnFront] = useState('');
    const [showKeypad, setShowKeypad] = useState(false);
    const [showPw, setShowPw]     = useState(false);
    const [showPwC, setShowPwC]   = useState(false);
    const [touched, setTouched]   = useState({});
    const [recoverModal, setRecoverModal] = useState(false);
    const [recoverLoading, setRecoverLoading] = useState(false);
    const [recoverMsg, setRecoverMsg] = useState('');

    const change = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        setForm(prev => ({ ...prev, [name]: val }));
        setTouched(prev => ({ ...prev, [name]: true }));

        const next = { ...errors };

        if (name === 'email') {
            setEmailChecked(false);
            setEmailExists(false);
            if (val && !validateEmail(val)) next.email = '올바른 이메일 형식이 아닙니다.';
            else delete next.email;
        }

        if (name === 'password') {
            const err = validatePassword(val);
            if (err) next.password = err; else delete next.password;
            if (touched.passwordConfirm && form.passwordConfirm) {
                if (val !== form.passwordConfirm) next.passwordConfirm = '비밀번호가 일치하지 않습니다.';
                else delete next.passwordConfirm;
            }
        }

        if (name === 'passwordConfirm') {
            if (val && val !== form.password) next.passwordConfirm = '비밀번호가 일치하지 않습니다.';
            else delete next.passwordConfirm;
        }

        if (name === 'nickname') {
            const err = val ? validateNickname(val) : null;
            if (err) next.nickname = err; else delete next.nickname;
        }

        if (name === 'agreedTerms') {
            if (val) delete next.agreedTerms;
            else next.agreedTerms = '이용약관에 동의해주세요.';
        }

        setErrors(next);
    };

    const checkEmail = async () => {
        if (!validateEmail(form.email)) {
            setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다.' }));
            return;
        }
        try {
            const { data } = await axios.post(`${API}/check-email`, { email: form.email });
            setEmailChecked(true);
            setEmailExists(data.exists);
            if (data.exists) setErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다.' }));
            else setErrors(prev => { const e = { ...prev }; delete e.email; return e; });
        } catch {
            setErrors(prev => ({ ...prev, email: '중복 확인 중 오류가 발생했습니다.' }));
        }
    };

    const handleRrnFrontChange = (e) => {
        const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        setRrnFront(v);
        setTouched(prev => ({ ...prev, residentNo: true }));
        const combined = v + rrnBack;
        if (combined.length === 13) {
            if (!validateResidentNo(combined)) setErrors(prev => ({ ...prev, residentNo: '유효하지 않은 주민등록번호입니다.' }));
            else setErrors(prev => { const e = { ...prev }; delete e.residentNo; return e; });
        } else {
            setErrors(prev => { const e = { ...prev }; delete e.residentNo; return e; });
        }
    };

    const handleRrnBackChange = (v) => {
        setRrnBack(v);
        setTouched(prev => ({ ...prev, residentNo: true }));
        if (v.length === 7) {
            const combined = rrnFront + v;
            if (!validateResidentNo(combined)) setErrors(prev => ({ ...prev, residentNo: '유효하지 않은 주민등록번호입니다.' }));
            else setErrors(prev => { const e = { ...prev }; delete e.residentNo; return e; });
        } else {
            setErrors(prev => { const e = { ...prev }; delete e.residentNo; return e; });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true, passwordConfirm: true, nickname: true, residentNo: true, agreedTerms: true, address: true });

        const errs = {};
        if (!validateEmail(form.email))  errs.email = '올바른 이메일 형식이 아닙니다.';
        else if (!emailChecked)          errs.email = '이메일 중복 확인을 해주세요.';
        else if (emailExists)            errs.email = '이미 사용 중인 이메일입니다.';

        const pwErr = validatePassword(form.password);
        if (pwErr) errs.password = pwErr;
        if (form.password !== form.passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않습니다.';

        const nickErr = validateNickname(form.nickname);
        if (nickErr) errs.nickname = nickErr;

        if (rrnFront.length !== 6 || rrnBack.length !== 7 || !validateResidentNo(rrnFront + rrnBack))
            errs.residentNo = '유효하지 않은 주민등록번호입니다.';
        if (!form.address)     errs.address     = '주소를 검색해 주세요.';
        if (!form.agreedTerms) errs.agreedTerms = '이용약관에 동의해주세요.';

        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoading(true);
        try {
            const { data: deletedCheck } = await axios.post(`${API}/check-deleted`, {
                email: form.email
            }, { withCredentials: true });

            if (deletedCheck.deleted && deletedCheck.recoverable) {
                setLoading(false);
                setRecoverModal(true);
                return;
            }

            await axios.post(`${API}/signup`, {
                email:         form.email,
                password:      form.password,
                name:          certInfo.name,
                phone:         certInfo.phone,
                nickname:      form.nickname,
                residentNo:    rrnFront + rrnBack,
                address:       form.address,
                addressDetail: form.addressDetail,
                impUid:        certInfo.impUid,
            }, { withCredentials: true });
            onComplete(form.email);
        } catch (err) {
            showToast(err.response?.data?.message || '회원가입 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRecover = async () => {
        setRecoverLoading(true);
        setRecoverMsg('');
        try {
            const { data } = await axios.post(`${API}/recover-account`, {
                email: form.email,
                name: certInfo.name,
                phone: certInfo.phone,
            }, { withCredentials: true });
            setRecoverMsg(data.message);
        } catch (err) {
            setRecoverMsg(err.response?.data?.message || '계정 복구에 실패했습니다.');
        } finally {
            setRecoverLoading(false);
        }
    };

    const pwStrength  = getPasswordStrength(form.password);
    const pwMatch     = form.passwordConfirm.length > 0 && form.password === form.passwordConfirm;
    const pwMismatch  = form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;
    const rrnComplete = rrnFront.length === 6 && rrnBack.length === 7;
    const rrnHasError = !!errors.residentNo;
    const rrnBackOk   = touched.residentNo && !errors.residentNo && rrnBack.length === 7;

    return (
        <>
            {recoverModal && (
                <div className={styles['recover-overlay']} onClick={() => setRecoverModal(false)}>
                    <div className={styles['recover-modal']} onClick={e => e.stopPropagation()}>
                        <h3 className={styles['recover-title']}>탈퇴된 계정 발견</h3>
                        <p className={styles['recover-desc']}>
                            <strong>{form.email}</strong> 계정이 탈퇴 보류 상태입니다.<br/>
                            복구하시면 해당 이메일로 임시 비밀번호가 발송됩니다.
                        </p>
                        {recoverMsg && (
                            <p className={styles['recover-msg']}>{recoverMsg}</p>
                        )}
                        {!recoverMsg ? (
                            <div className={styles['recover-btn-row']}>
                                <button
                                    type="button"
                                    className={styles['recover-btn-cancel']}
                                    onClick={() => setRecoverModal(false)}>
                                    취소
                                </button>
                                <button
                                    type="button"
                                    className={styles['recover-btn-confirm']}
                                    onClick={handleRecover}
                                    disabled={recoverLoading}>
                                    {recoverLoading ? '처리 중...' : '계정 복구'}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className={styles['recover-login-link']}
                                onClick={() => navigate('/login')}>
                                로그인 페이지로 이동
                            </button>
                        )}
                    </div>
                </div>
            )}

            <form className="auth-body" onSubmit={handleSubmit} noValidate>
                <h1 className="auth-headline">정보를<br/>입력해 주세요</h1>
                <p className="auth-sub">계정을 만들고 주식 정보 보기를 시작하세요</p>

                <div className="auth-field">
                    <label className="auth-label">이름</label>
                    <input className={`auth-input ${styles['input-disabled']}`} value={certInfo.name} disabled />
                </div>

                <div className="auth-field">
                    <label className="auth-label">핸드폰 번호</label>
                    <input className={`auth-input ${styles['input-disabled']}`} value={certInfo.phone} disabled />
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        이메일(아이디) <span className={styles.required}>*</span>
                    </label>
                    <div className={styles['input-row']}>
                        <input
                            className={`auth-input ${errors.email ? 'error' : ''}`}
                            name="email" type="email"
                            placeholder="example@naver.com"
                            value={form.email}
                            onChange={change}
                        />
                        <button type="button" className={styles['check-btn']} onClick={checkEmail}>
                            중복확인
                        </button>
                    </div>
                    {emailChecked && !emailExists && !errors.email &&
                        <span className={styles['msg-ok']}>✓ 사용 가능한 이메일입니다.</span>}
                    {errors.email && <p className="auth-error-msg">{errors.email}</p>}
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        비밀번호 <span className={styles.required}>*</span>
                    </label>
                    <div className="auth-input-row">
                        <input
                            className={`auth-input ${errors.password ? 'error' : ''}`}
                            name="password" type={showPw ? 'text' : 'password'}
                            placeholder="영문 대소문자·숫자·특수문자 포함 8자 이상"
                            value={form.password}
                            onChange={change}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="auth-input-eye"
                            onClick={() => setShowPw(p => !p)}
                            aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}>
                            {showPw ? '🙈' : '👁'}
                        </button>
                    </div>

                    {form.password && (
                        <div className={styles['strength-wrap']}>
                            <div className={styles['strength-bars']}>
                                {[1, 2, 3, 4].map(lv => (
                                    <div
                                        key={lv}
                                        className={`${styles['strength-bar']} ${pwStrength >= lv ? styles[`lv${pwStrength}`] : ''}`}
                                    />
                                ))}
                            </div>
                            <span className={`${styles['strength-label']} ${styles[`lv${pwStrength}`] || ''}`}>
                                {STRENGTH_LABELS[pwStrength]}
                            </span>
                        </div>
                    )}

                    <p className={styles.hint}>영문 대소문자·숫자·특수문자 포함 8자 이상</p>
                    {errors.password && <p className="auth-error-msg">{errors.password}</p>}
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        비밀번호 확인 <span className={styles.required}>*</span>
                    </label>
                    <div className="auth-input-row">
                        <input
                            className={`auth-input ${pwMismatch ? 'error' : ''}`}
                            name="passwordConfirm" type={showPwC ? 'text' : 'password'}
                            placeholder="비밀번호를 다시 입력하세요"
                            value={form.passwordConfirm}
                            onChange={change}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="auth-input-eye"
                            onClick={() => setShowPwC(p => !p)}
                            aria-label={showPwC ? '비밀번호 숨기기' : '비밀번호 보기'}>
                            {showPwC ? '🙈' : '👁'}
                        </button>
                    </div>
                    {form.passwordConfirm && (
                        pwMatch
                            ? <span className={styles['msg-ok']}>✓ 비밀번호가 일치합니다.</span>
                            : <p className="auth-error-msg">비밀번호가 일치하지 않습니다.</p>
                    )}
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        닉네임 <span className={styles.required}>*</span>
                    </label>
                    <input
                        className={`auth-input ${errors.nickname ? 'error' : ''}`}
                        name="nickname"
                        placeholder="한글 2~8자 / 영문·숫자 혼합 4~8자"
                        maxLength={8}
                        value={form.nickname}
                        onChange={change}
                    />
                    <p className={styles.hint}>특수문자 불가 / 한글만 2~8자 / 혼합: 4~8자</p>
                    {errors.nickname && <p className="auth-error-msg">{errors.nickname}</p>}
                    {touched.nickname && !errors.nickname && form.nickname &&
                        <span className={styles['msg-ok']}>✓ 사용 가능한 닉네임입니다.</span>}
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        주민등록번호 <span className={styles.required}>*</span>
                    </label>
                    <div className={styles['rrn-row']}>
                        <input
                            className={`auth-input ${styles['rrn-front']} ${rrnHasError ? 'error' : ''}`}
                            placeholder="앞 6자리"
                            maxLength={6}
                            value={rrnFront}
                            onChange={handleRrnFrontChange}
                        />
                        <span className={styles['rrn-sep']}>-</span>
                        <div
                            className={`${styles['rrn-back-display']} ${rrnHasError ? styles.error : ''} ${rrnBackOk ? styles.success : ''}`}
                            onClick={() => setShowKeypad(true)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowKeypad(true); }}
                        >
                            {Array.from({ length: 7 }, (_, i) => (
                                <span key={i} className={i < rrnBack.length ? styles['rrn-dot-filled'] : styles['rrn-dot-empty']} />
                            ))}
                        </div>
                    </div>
                    {showKeypad && (
                        <SecureKeypad
                            value={rrnBack}
                            onChange={handleRrnBackChange}
                            onClose={() => setShowKeypad(false)}
                        />
                    )}
                    {errors.residentNo && <p className="auth-error-msg">{errors.residentNo}</p>}
                    {touched.residentNo && !errors.residentNo && rrnComplete &&
                        <span className={styles['msg-ok']}>✓ 확인됐습니다.</span>}
                    <p className={styles.hint}>주민등록번호는 암호화되어 안전하게 저장됩니다.</p>
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        주소 <span className={styles.required}>*</span>
                    </label>
                    <div className={styles['input-row']}>
                        <input
                            className={`auth-input ${errors.address ? 'error' : ''}`}
                            value={form.address}
                            readOnly
                            placeholder="주소 검색을 눌러주세요"
                        />
                        <AddressSearch onSelect={(addr) => {
                            setForm(prev => ({ ...prev, address: addr }));
                            setTouched(prev => ({ ...prev, address: true }));
                            setErrors(prev => { const e = { ...prev }; delete e.address; return e; });
                        }} />
                    </div>
                    {errors.address && <p className="auth-error-msg">{errors.address}</p>}
                    {form.address && <span className={styles['msg-ok']}>✓ 주소가 선택됐습니다.</span>}
                    <input
                        className={`auth-input ${styles['input-detail-spaced']}`}
                        name="addressDetail"
                        placeholder="세부주소 입력 (선택)"
                        value={form.addressDetail}
                        onChange={change}
                    />
                </div>

                <div className={styles['terms-row']}>
                    <label className={styles['terms-label']}>
                        <input
                            type="checkbox"
                            name="agreedTerms"
                            checked={form.agreedTerms}
                            onChange={change}
                        />
                        <span>
                            <a href="/terms" target="_blank" rel="noreferrer" className={styles['terms-link']}>이용약관</a>{' '}및{' '}
                            <a href="/privacy" target="_blank" rel="noreferrer" className={styles['terms-link']}>개인정보처리방침</a>에 동의합니다{' '}
                            <span className={styles.required}>(필수)</span>
                        </span>
                    </label>
                    {errors.agreedTerms && <p className="auth-error-msg">{errors.agreedTerms}</p>}
                </div>

                <div className="auth-cta-bar">
                    <button className="auth-btn" type="submit" disabled={loading}>
                        {loading ? '처리 중...' : '회원가입 완료'}
                    </button>
                </div>
            </form>
        </>
    );
}
