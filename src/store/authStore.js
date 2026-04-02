import { create } from 'zustand';
import api from '../api/axiosInstance';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('accessToken') || null,
  user:  localStorage.getItem('userEmail')   || null,
  role:  localStorage.getItem('userRole')    || 'USER',

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
      localStorage.removeItem('userRole');
      set({ user: null, token: null, role: 'USER' });
    }
  },

  setAuth: (email, accessToken, refreshToken, userId, role = 'USER') => {
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userEmail',    email);
    localStorage.setItem('userRole',     role);
    if (userId) localStorage.setItem('userId', String(userId));
    set({ user: email, token: accessToken, role });
  },
}));

export default useAuthStore;