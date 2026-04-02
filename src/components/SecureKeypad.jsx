import { useState, useEffect, useRef } from 'react';
import styles from '../styles/components/SecureKeypad.module.css';

export default function SecureKeypad({ value, onChange, onClose }) {
    const [keys, setKeys] = useState([]);
    const ref = useRef(null);

    useEffect(() => {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        setKeys(nums);
    }, []);

    useEffect(() => {
        const handleOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [onClose]);

    const press = (num) => {
        if (value.length >= 7) return;
        onChange(value + String(num));
    };

    const backspace = () => onChange(value.slice(0, -1));

    return (
        <div className={styles.wrap} ref={ref}>
            <div className={styles.display}>
                {Array.from({ length: 7 }, (_, i) => (
                    <span key={i} className={i < value.length ? styles.dotFilled : styles.dotEmpty} />
                ))}
            </div>
            <div className={styles.grid}>
                {keys.slice(0, 9).map((k, i) => (
                    <button key={i} type="button" className={styles.key} onClick={() => press(k)}>
                        {k}
                    </button>
                ))}
                <button type="button" className={`${styles.key} ${styles.back}`} onClick={backspace}>
                    ←
                </button>
                <button type="button" className={styles.key} onClick={() => press(keys[9])}>
                    {keys[9]}
                </button>
                <button type="button" className={`${styles.key} ${styles.confirm}`} onClick={onClose}>
                    확인
                </button>
            </div>
        </div>
    );
}
