import axios from './axiosInstance';

export const uploadProfileImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.put('/user/profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.imageUrl;
};
