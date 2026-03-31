import { create } from 'zustand';
import api from '../api/axiosInstance';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('accessToken') || null,
  user:  localStorage.getItem('userEmail')   || null,

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error("로그아웃 API 에러:", error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('kakaoNickname');
      localStorage.removeItem('provider');
      localStorage.removeItem('userId');
      set({ user: null, token: null });
    }
  },

  setAuth: (email, accessToken, refreshToken, userId) => {
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userEmail',    email);
    if (userId) localStorage.setItem('userId', String(userId));
    set({ user: email, token: accessToken });
  },
}));

export default useAuthStore;