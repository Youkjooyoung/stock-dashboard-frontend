import { useState } from 'react';
import axios from 'axios';
import AddressSearch from './AddressSearch';
import styles from '../styles/components/SignupFormStep.module.css';

const API = 'https://api.jyyouk.shop/api/auth';

const STRENGTH_COLORS = ['', '#ff4d4d', '#ff9800', '#8bc34a', '#00e676'];
const STRENGTH_LABELS = ['', '?½í•¨', 'ë³´í†µ', 'ê°•í•¨', 'ë§¤ìš° ê°•í•¨'];

function getPasswordStrength(pw) {
    if (!pw) return 0;
    const hasLetter  = /[ê°€-?£a-zA-Z]/.test(pw);
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
    if (!name.trim()) return '?‰ë„¤?„ì„ ?…ë ¥?´ì£¼?¸ìš”.';
    if (/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?~`]/.test(name)) return '?¹ìˆ˜ë¬¸ì???¬ìš©?????†ìŠµ?ˆë‹¤.';
    if (!/^[ê°€-?£a-zA-Z0-9]+$/.test(name)) return '?œê?, ?ë¬¸, ?«ìë§??¬ìš© ê°€?¥í•©?ˆë‹¤.';
    if (/^[ê°€-??+$/.test(name)) {
        if (name.length < 2 || name.length > 8) return '?œê?ë§??¬ìš© ??2~8?ì—¬???©ë‹ˆ??';
    } else {
        if (name.length < 4 || name.length > 8) return '?ë¬¸Â·?œê?Â·?«ì ?¼í•© ??4~8?ì—¬???©ë‹ˆ??';
    }
    return null;
}

function validatePassword(pw) {
    if (!pw) return 'ë¹„ë?ë²ˆí˜¸ë¥??…ë ¥?´ì£¼?¸ìš”.';
    if (pw.length < 6 || pw.length > 12) return 'ë¹„ë?ë²ˆí˜¸??6~12?ì—¬???©ë‹ˆ??';
    const hasLetter  = /[ê°€-?£a-zA-Z]/.test(pw);
    const hasNumber  = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?~`]/.test(pw);
    const types = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
    if (types < 2) return '?ë¬¸Â·?œê?Â·?«ìÂ·?¹ìˆ˜ë¬¸ì ì¤?2ê°€ì§€ ?´ìƒ???¼í•©?´ì•¼ ?©ë‹ˆ??';
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
    const [loading, setLoading]   = useState(false);
    const [showPw, setShowPw]     = useState(false);
    const [showPwC, setShowPwC]   = useState(false);
    const [touched, setTouched]   = useState({});

    const change = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        setForm(prev => ({ ...prev, [name]: val }));
        setTouched(prev => ({ ...prev, [name]: true }));

        const next = { ...errors };

        if (name === 'email') {
            setEmailChecked(false);
            setEmailExists(false);
            if (val && !validateEmail(val)) next.email = '?¬ë°”ë¥??´ë©”???•ì‹???„ë‹™?ˆë‹¤.';
            else delete next.email;
        }

        if (name === 'password') {
            const err = validatePassword(val);
            if (err) next.password = err; else delete next.password;
            if (touched.passwordConfirm && form.passwordConfirm) {
                if (val !== form.passwordConfirm) next.passwordConfirm = 'ë¹„ë?ë²ˆí˜¸ê°€ ?¼ì¹˜?˜ì? ?ŠìŠµ?ˆë‹¤.';
                else delete next.passwordConfirm;
            }
        }

        if (name === 'passwordConfirm') {
            if (val && val !== form.password) next.passwordConfirm = 'ë¹„ë?ë²ˆí˜¸ê°€ ?¼ì¹˜?˜ì? ?ŠìŠµ?ˆë‹¤.';
            else delete next.passwordConfirm;
        }

        if (name === 'nickname') {
            const err = val ? validateNickname(val) : null;
            if (err) next.nickname = err; else delete next.nickname;
        }

        if (name === 'agreedTerms') {
            if (val) delete next.agreedTerms;
            else next.agreedTerms = '?´ìš©?½ê????™ì˜??ì£¼ì„¸??';
        }

        setErrors(next);
    };

    const checkEmail = async () => {
        if (!validateEmail(form.email)) {
            setErrors(prev => ({ ...prev, email: '?¬ë°”ë¥??´ë©”???•ì‹???„ë‹™?ˆë‹¤.' }));
            return;
        }
        try {
            const { data } = await axios.post(`${API}/check-email`, { email: form.email });
            setEmailChecked(true);
            setEmailExists(data.exists);
            if (data.exists) setErrors(prev => ({ ...prev, email: '?´ë? ?¬ìš© ì¤‘ì¸ ?´ë©”?¼ì…?ˆë‹¤.' }));
            else setErrors(prev => { const e = { ...prev }; delete e.email; return e; });
        } catch {
            setErrors(prev => ({ ...prev, email: 'ì¤‘ë³µ ?•ì¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.' }));
        }
    };

    const handleResidentNoChange = (e) => {
        let v = e.target.value.replace(/[^0-9]/g, '');
        if (v.length > 6) v = v.slice(0, 6) + '-' + v.slice(6);
        setForm(prev => ({ ...prev, residentNo: v }));
        setTouched(prev => ({ ...prev, residentNo: true }));
        const clean = v.replace('-', '');
        if (clean.length === 13) {
            if (!validateResidentNo(v)) setErrors(prev => ({ ...prev, residentNo: '? íš¨?˜ì? ?Šì? ì£¼ë??±ë¡ë²ˆí˜¸?…ë‹ˆ??' }));
            else setErrors(prev => { const e = { ...prev }; delete e.residentNo; return e; });
        } else {
            setErrors(prev => { const e = { ...prev }; delete e.residentNo; return e; });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true, passwordConfirm: true, nickname: true, residentNo: true, agreedTerms: true, address: true });

        const errs = {};
        if (!validateEmail(form.email))  errs.email = '?¬ë°”ë¥??´ë©”???•ì‹???„ë‹™?ˆë‹¤.';
        else if (!emailChecked)          errs.email = '?´ë©”??ì¤‘ë³µ ?•ì¸???´ì£¼?¸ìš”.';
        else if (emailExists)            errs.email = '?´ë? ?¬ìš© ì¤‘ì¸ ?´ë©”?¼ì…?ˆë‹¤.';

        const pwErr = validatePassword(form.password);
        if (pwErr) errs.password = pwErr;
        if (form.password !== form.passwordConfirm) errs.passwordConfirm = 'ë¹„ë?ë²ˆí˜¸ê°€ ?¼ì¹˜?˜ì? ?ŠìŠµ?ˆë‹¤.';

        const nickErr = validateNickname(form.nickname);
        if (nickErr) errs.nickname = nickErr;

        if (!validateResidentNo(form.residentNo)) errs.residentNo = '? íš¨?˜ì? ?Šì? ì£¼ë??±ë¡ë²ˆí˜¸?…ë‹ˆ??';
        if (!form.address)     errs.address     = 'ì£¼ì†Œë¥?ê²€?‰í•´ ì£¼ì„¸??';
        if (!form.agreedTerms) errs.agreedTerms = '?´ìš©?½ê????™ì˜??ì£¼ì„¸??';

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
            alert(err.response?.data?.message || '?Œì›ê°€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
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
            <h2 className={styles.title}>?•ë³´ ?…ë ¥</h2>
            <p className={styles.desc}>ê³„ì •??ë§Œë“¤ê³?ì£¼ì‹ ?€?œë³´?œë? ?œì‘?˜ì„¸??/p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>

                <div className={styles.group}>
                    <label className={styles.label}>?´ë¦„</label>
                    <input className={`${styles.input} ${styles.inputDisabled}`} value={certInfo.name} disabled />
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>?´ë??°ë²ˆ??/label>
                    <input className={`${styles.input} ${styles.inputDisabled}`} value={certInfo.phone} disabled />
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        ?´ë©”??(?„ì´?? <span className={styles.required}>*</span>
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
                            ì¤‘ë³µ?•ì¸
                        </button>
                    </div>
                    {emailChecked && !emailExists && !errors.email &&
                        <span className={styles.msgOk}>???¬ìš© ê°€?¥í•œ ?´ë©”?¼ì…?ˆë‹¤.</span>}
                    {errors.email && <span className={styles.msgErr}>{errors.email}</span>}
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        ë¹„ë?ë²ˆí˜¸ <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.pwWrap}>
                        <input
                            className={`${styles.input} ${errors.password ? styles.inputError : ''} ${touched.password && !errors.password && form.password ? styles.inputSuccess : ''}`.trim()}
                            name="password" type={showPw ? 'text' : 'password'}
                            placeholder="?ë¬¸Â·?œê?Â·?«ìÂ·?¹ìˆ˜ë¬¸ì ?¼í•© 6~12??
                            value={form.password}
                            onChange={change}
                        />
                        <button type="button" className={styles.eye} onClick={() => setShowPw(p => !p)}>
                            {showPw ? '?¨ê¸°ê¸? : 'ë³´ê¸°'}
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

                    <p className={styles.hint}>?ë¬¸Â·?œê?Â·?«ìÂ·?¹ìˆ˜ë¬¸ì ì¤?2ê°€ì§€ ?´ìƒ ?¼í•© / 6~12??/p>
                    {errors.password && <span className={styles.msgErr}>{errors.password}</span>}
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        ë¹„ë?ë²ˆí˜¸ ?•ì¸ <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.pwWrap}>
                        <input
                            className={`${styles.input} ${pwMismatch ? styles.inputError : ''} ${pwMatch ? styles.inputSuccess : ''}`.trim()}
                            name="passwordConfirm" type={showPwC ? 'text' : 'password'}
                            placeholder="ë¹„ë?ë²ˆí˜¸ë¥??¤ì‹œ ?…ë ¥?˜ì„¸??
                            value={form.passwordConfirm}
                            onChange={change}
                        />
                        <button type="button" className={styles.eye} onClick={() => setShowPwC(p => !p)}>
                            {showPwC ? '?¨ê¸°ê¸? : 'ë³´ê¸°'}
                        </button>
                    </div>
                    {form.passwordConfirm && (
                        <span className={pwMatch ? styles.msgOk : styles.msgErr}>
                            {pwMatch ? '??ë¹„ë?ë²ˆí˜¸ê°€ ?¼ì¹˜?©ë‹ˆ??' : '??ë¹„ë?ë²ˆí˜¸ê°€ ?¼ì¹˜?˜ì? ?ŠìŠµ?ˆë‹¤.'}
                        </span>
                    )}
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        ?‰ë„¤??<span className={styles.required}>*</span>
                    </label>
                    <input
                        className={ic('nickname')}
                        name="nickname"
                        placeholder="?œê? 2~8??/ ?ë¬¸Â·?«ì ?¼í•© 4~8??
                        maxLength={8}
                        value={form.nickname}
                        onChange={change}
                    />
                    <p className={styles.hint}>?¹ìˆ˜ë¬¸ì ë¶ˆê? / ?œê?ë§? 2~8??/ ?¼í•©: 4~8??/p>
                    {errors.nickname && <span className={styles.msgErr}>{errors.nickname}</span>}
                    {touched.nickname && !errors.nickname && form.nickname &&
                        <span className={styles.msgOk}>???¬ìš© ê°€?¥í•œ ?‰ë„¤?„ì…?ˆë‹¤.</span>}
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        ì£¼ë??±ë¡ë²ˆí˜¸ <span className={styles.required}>*</span>
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
                        <span className={styles.msgOk}>???•ì¸?ìŠµ?ˆë‹¤.</span>}
                    <span className={styles.hint}>?”’ ì£¼ë??±ë¡ë²ˆí˜¸???”í˜¸?”ë˜???ˆì „?˜ê²Œ ?€?¥ë©?ˆë‹¤.</span>
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>
                        ì£¼ì†Œ <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.row}>
                        <input
                            className={`${styles.input} ${errors.address ? styles.inputError : ''} ${form.address ? styles.inputSuccess : ''}`.trim()}
                            value={form.address}
                            readOnly
                            placeholder="ì£¼ì†Œ ê²€?‰ì„ ?ŒëŸ¬ì£¼ì„¸??
                        />
                        <AddressSearch onSelect={(addr) => {
                            setForm(prev => ({ ...prev, address: addr }));
                            setTouched(prev => ({ ...prev, address: true }));
                            setErrors(prev => { const e = { ...prev }; delete e.address; return e; });
                        }} />
                    </div>
                    {errors.address && <span className={styles.msgErr}>{errors.address}</span>}
                    {form.address && <span className={styles.msgOk}>??ì£¼ì†Œê°€ ? íƒ?ìŠµ?ˆë‹¤.</span>}
                    <input
                        className={styles.input}
                        name="addressDetail"
                        placeholder="?ì„¸ì£¼ì†Œ ?…ë ¥ (? íƒ)"
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
                            <a href="/terms" target="_blank" rel="noreferrer" className={styles.termsLink}>?´ìš©?½ê?</a>{' '}ë°?' '}
                            <a href="/privacy" target="_blank" rel="noreferrer" className={styles.termsLink}>ê°œì¸?•ë³´ì²˜ë¦¬ë°©ì¹¨</a>???™ì˜?©ë‹ˆ??{' '}
                            <span className={styles.required}>(?„ìˆ˜)</span>
                        </span>
                    </label>
                    {errors.agreedTerms && <span className={styles.msgErr}>{errors.agreedTerms}</span>}
                </div>

                <button className={styles.submit} type="submit" disabled={loading}>
                    {loading ? 'ì²˜ë¦¬ ì¤?..' : '?Œì›ê°€???„ë£Œ'}
                </button>

                <a href="/login" className={styles.loginLink}>?´ë? ê³„ì •???ˆìœ¼? ê??? ë¡œê·¸??/a>
            </form>
        </div>
    );
}
