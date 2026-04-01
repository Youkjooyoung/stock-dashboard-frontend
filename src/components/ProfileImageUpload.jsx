import { useState, useRef } from 'react';
import { uploadProfileImage } from '../api/profileApi';
import styles from './ProfileImageUpload.module.css';

const DEFAULT_IMAGE = '/default-profile.png';

export default function ProfileImageUpload({ currentImageUrl, onUploadSuccess }) {
    const [previewUrl, setPreviewUrl] = useState(currentImageUrl || DEFAULT_IMAGE);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setErrorMsg('');
        setIsLoading(true);

        try {
            const imageUrl = await uploadProfileImage(file);
            onUploadSuccess(imageUrl);
        } catch (err) {
            setPreviewUrl(currentImageUrl || DEFAULT_IMAGE);
            setErrorMsg(err.response?.data?.message || '이미지 업로드에 실패했습니다.');
        } finally {
            setIsLoading(false);
            URL.revokeObjectURL(objectUrl);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.imageWrapper} onClick={() => fileInputRef.current.click()}>
                <img src={previewUrl} alt="프로필" className={styles.profileImg} />
                <div className={styles.overlay}>
                    <span className={styles.overlayText}>변경</span>
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handleFileChange}
            />
            {isLoading && <span className={styles.loadingText}>업로드 중...</span>}
            {errorMsg && <span className={styles.errorMsg}>{errorMsg}</span>}
        </div>
    );
}
