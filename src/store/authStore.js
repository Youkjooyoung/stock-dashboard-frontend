import { create } from 'zustand';
import api from '../api/axiosInstance';
import { clearStoredAuth } from '../utils/authStorage';

// 로그인 상태. 새로고침해도 유지되도록 localStorage 값으로 시작한다.
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
      // 서버 요청이 실패해도 이 브라우저의 로그인 정보는 지운다.
      clearStoredAuth();
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