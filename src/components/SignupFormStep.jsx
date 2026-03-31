import { useState } from 'react';
import axios from 'axios';
import AddressSearch from './AddressSearch';
import styles from '../styles/components/SignupFormStep.module.css';

const API = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

const STRENGTH_COLORS = ['', '#ff4d4d', '#ff9800', '#8bc34a', '#00e676'];
const STRENGTH_LABELS = ['', '약함', '보통', '강함', '매우 강함'];

function getPasswordStrength(pw) {
    if (!pw) return 0;
    const hasLetter  = /[가-힣a-zA-Z]/.test(pw);
    const hasNumber  = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?~`]/.test(pw);
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
    if (/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?~`]/.test(name)) return '특수문자는 사용할 수 없습니다.';
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
    if (pw.length < 6 || pw.length > 12) return '비밀번호는 6~12자여야 합니다.';
    const hasLetter  = /[가-힣a-zA-Z]/.test(pw);
    const hasNumber  = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?~`]/.test(pw);
    const types = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
    if (types < 2) return '영문·한글·숫자·특수문자 중 2가지 이상을 혼합해야 합니다.';
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
    const [emailChecked, setEmailChecked] = useState(false);
    const [emailExists, setEmailExists]   = useState(false);
    const [errors, setErrors]             = useState({});
    const [form, setForm]                 = useState({
        email: '', password: '', passwordConfirm: '',
        nickname: '', residentNo: '',
        address: '', addressDetail: '', agreedTerms: false,
    });
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw]   = useState(false);
    const [showPwC, setShowPwC] = useState(false);
    const [touched, setTouched] = useState({});

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

    const handleResidentNoChange = (e) => {
        let v = e.target.value.replace(/[^0-9]/g, '');
        if (v.length > 6) v = v.slice(0, 6) + '-' + v.slice(6);
        setForm(prev => ({ ...prev, residentNo: v }));
        setTouched(prev => ({ ...prev, residentNo: true }));
        const clean = v.replace('-', '');
        if (clean.length === 13) {
            if (!validateResidentNo(v)) setErrors(prev => ({ ...prev, residentNo: '유효하지 않은 주민등록번호입니다.' }));
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

        if (!validateResidentNo(form.residentNo)) errs.residentNo = '유효하지 않은 주민등록번호입니다.';
        if (!form.address)     errs.address     = '주소를 검색해 주세요.';
        if (!form.agreedTerms) errs.agreedTerms = '이용약관에 동의해주세요.';

        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoading(true);
        try {
            await axios.post(`${API}/signup`, {
                email:         form.email,
                password:      form.password,
                name:          certInfo.name,
                phone:         certInfo.phone,
                nickname:      form.nickname,
                residentNo:    form.residentNo.replace('-', ''),
                address:       form.address,
                addressDetail: form.addressDetail,
            }, { withCredentials: true });
            onComplete(form.email);
        } catch (err) {
            alert(err.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const ic = (field) => {
        const hasError = !!errors[field];
        const isOk     = touched[field] && !hasError && form[field];
        return `${styles.input} ${hasError ? styles.inputError : ''} ${isOk ? styles.inputSuccess : ''}`.trim();
    };

    const pwStrength  = getPasswordStrength(form.password);
    const pwMatch     = form.passwordConfirm.length > 0 && form.password === form.passwordConfirm;
    const pwMismatch  = form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;
    const rrnComplete = form.residentNo.replace('-', '').length === 13;

    return (
        <div className={styles.card}>
            <h2 className={styles.title}>정보 입력</h2>
            <p className={styles.desc}>계정을 만들고 주식 정보보기를 시작하세요</p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>

                <div className={styles.group}>
                    <label className={styles.label}>이름</label>
                    <input className={`${styles.input} ${styles.inputDisabled}`} value={certInfo.name} disabled />
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>핸드폰 번호</label>
                    <input className={`${styles.input} ${styles.inputDisabled}`} value={certInfo.phone} disabled />
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        이메일(아이디) <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.row}>
                        <input
                            className={`${styles.input} ${errors.email ? styles.inputError : ''} ${emailChecked && !emailExists && !errors.email ? styles.inputSuccess : ''}`.trim()}
                            name="email" type="email"
                            placeholder="example@naver.com"
                            value={form.email}
                            onChange={change}
                        />
                        <button type="button" className={styles.checkBtn} onClick={checkEmail}>
                            중복확인
                        </button>
                    </div>
                    {emailChecked && !emailExists && !errors.email &&
                        <span className={styles.msgOk}>✓ 사용 가능한 이메일입니다.</span>}
                    {errors.email && <span className={styles.msgErr}>{errors.email}</span>}
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        비밀번호 <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.pwWrap}>
                        <input
                            className={`${styles.input} ${errors.password ? styles.inputError : ''} ${touched.password && !errors.password && form.password ? styles.inputSuccess : ''}`.trim()}
                            name="password" type={showPw ? 'text' : 'password'}
                            placeholder="영문·한글·숫자·특수문자 혼합 6~12자"
                            value={form.password}
                            onChange={change}
                        />
                        <button type="button" className={styles.eye} onClick={() => setShowPw(p => !p)}>
                            {showPw ? '숨기기' : '보기'}
                        </button>
                    </div>

                    {form.password && (
                        <div className={styles.strengthWrap}>
                            <div className={styles.strengthBars}>
                                {[1, 2, 3, 4].map(lv => (
                                    <div
                                        key={lv}
                                        className={styles.strengthBar}
                                        style={{ background: pwStrength >= lv ? STRENGTH_COLORS[pwStrength] : '#1e2a3a' }}
                                    />
                                ))}
                            </div>
                            <span className={styles.strengthLabel} style={{ color: STRENGTH_COLORS[pwStrength] }}>
                                {STRENGTH_LABELS[pwStrength]}
                            </span>
                        </div>
                    )}

                    <p className={styles.hint}>영문·한글·숫자·특수문자 중 2가지 이상 혼합 / 6~12자</p>
                    {errors.password && <span className={styles.msgErr}>{errors.password}</span>}
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        비밀번호 확인 <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.pwWrap}>
                        <input
                            className={`${styles.input} ${pwMismatch ? styles.inputError : ''} ${pwMatch ? styles.inputSuccess : ''}`.trim()}
                            name="passwordConfirm" type={showPwC ? 'text' : 'password'}
                            placeholder="비밀번호를 다시 입력하세요"
                            value={form.passwordConfirm}
                            onChange={change}
                        />
                        <button type="button" className={styles.eye} onClick={() => setShowPwC(p => !p)}>
                            {showPwC ? '숨기기' : '보기'}
                        </button>
                    </div>
                    {form.passwordConfirm && (
                        <span className={pwMatch ? styles.msgOk : styles.msgErr}>
                            {pwMatch ? '✓ 비밀번호가 일치합니다.' : '✗ 비밀번호가 일치하지 않습니다.'}
                        </span>
                    )}
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        닉네임 <span className={styles.required}>*</span>
                    </label>
                    <input
                        className={ic('nickname')}
                        name="nickname"
                        placeholder="한글 2~8자 / 영문·숫자 혼합 4~8자"
                        maxLength={8}
                        value={form.nickname}
                        onChange={change}
                    />
                    <p className={styles.hint}>특수문자 불가 / 한글만 2~8자 / 혼합: 4~8자</p>
                    {errors.nickname && <span className={styles.msgErr}>{errors.nickname}</span>}
                    {touched.nickname && !errors.nickname && form.nickname &&
                        <span className={styles.msgOk}>✓ 사용 가능한 닉네임입니다.</span>}
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        주민등록번호 <span className={styles.required}>*</span>
                    </label>
                    <input
                        className={`${styles.input} ${errors.residentNo ? styles.inputError : ''} ${touched.residentNo && !errors.residentNo && rrnComplete ? styles.inputSuccess : ''}`.trim()}
                        name="residentNo"
                        placeholder="000000-0000000"
                        maxLength={14}
                        value={form.residentNo}
                        onChange={handleResidentNoChange}
                    />
                    {errors.residentNo && <span className={styles.msgErr}>{errors.residentNo}</span>}
                    {touched.residentNo && !errors.residentNo && rrnComplete &&
                        <span className={styles.msgOk}>✓ 확인됐습니다.</span>}
                    <span className={styles.hint}>귀하의 주민등록번호는 암호화되어 안전하게 저장됩니다.</span>
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        주소 <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.row}>
                        <input
                            className={`${styles.input} ${errors.address ? styles.inputError : ''} ${form.address ? styles.inputSuccess : ''}`.trim()}
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
                    {errors.address && <span className={styles.msgErr}>{errors.address}</span>}
                    {form.address && <span className={styles.msgOk}>✓ 주소가 선택됐습니다.</span>}
                    <input
                        className={styles.input}
                        name="addressDetail"
                        placeholder="세부주소 입력 (선택)"
                        style={{ marginTop: 6 }}
                        value={form.addressDetail}
                        onChange={change}
                    />
                </div>

                <div className={styles.terms}>
                    <label className={styles.checkLabel}>
                        <input
                            type="checkbox"
                            name="agreedTerms"
                            checked={form.agreedTerms}
                            onChange={change}
                        />
                        <span>
                            <a href="/terms" target="_blank" rel="noreferrer" className={styles.termsLink}>이용약관</a>{' '}및{' '}
                            <a href="/privacy" target="_blank" rel="noreferrer" className={styles.termsLink}>개인정보처리방침</a>에 동의합니다{' '}
                            <span className={styles.required}>(필수)</span>
                        </span>
                    </label>
                    {errors.agreedTerms && <span className={styles.msgErr}>{errors.agreedTerms}</span>}
                </div>

                <button className={styles.submit} type="submit" disabled={loading}>
                    {loading ? '처리 중...' : '회원가입 완료'}
                </button>

                <a href="/login" className={styles.loginLink}>이미 계정이 있으신가요? 로그인</a>
            </form>
        </div>
    );
}