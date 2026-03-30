import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('accessToken') || null,
  user:  localStorage.getItem('userEmail')   || null,

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch('https://localhost:8443/api/auth/logout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refreshToken }),
          credentials: 'include',
        });
      }
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('kakaoNickname');
    localStorage.removeItem('provider');
    localStorage.removeItem('userId');
    set({ user: null, token: null });
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
