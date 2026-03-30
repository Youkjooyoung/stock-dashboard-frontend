import { useEffect } from 'react';
import styles from '../styles/components/AddressSearch.module.css';

export default function AddressSearch({ onSelect }) {

    useEffect(() => {
        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.async = true;
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, []);

    const handleSearch = () => {
        new window.daum.Postcode({
            oncomplete: (data) => {
                const address = data.roadAddress || data.jibunAddress;
                onSelect(address);
            }
        }).open();
    };

    return (
        <button type="button" className={styles.button} onClick={handleSearch}>
            주소 검색
        </button>
    );
}