import api from './axiosInstance';

export const authApi = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  signup: (userData) => api.post('/api/auth/signup', userData),
  logout: () => api.post('/api/auth/logout'),
  refresh: () => api.post('/api/auth/refresh'),
  verifyPortone: (impUid) => api.post('/api/auth/portone/verify', { impUid }),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  getKakaoLoginUrl: () => '/api/auth/kakao/login',
  getGoogleLoginUrl: () => '/api/auth/google/login',
  getKakaoLinkUrl: () => '/api/auth/kakao/link',
  getGoogleLinkUrl: () => '/api/auth/google/link',
};

export const userApi = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data) => api.put('/api/user/profile', data),
  uploadProfileImage: (formData) =>
    api.post('/api/user/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getSocialAccounts: () => api.get('/api/user/social'),
  linkSocialAccount: (data) => api.post('/api/user/social/link', data),
  unlinkSocialAccount: (provider) => api.delete(`/api/user/social/unlink/${provider}`),
  getWatchlist: () => api.get('/api/user/watchlist'),
  getPortfolio: () => api.get('/api/user/portfolio'),
};

export const stockApi = {
  getPrices: () => api.get('/api/stock/prices'),
  getAlerts: () => api.get('/api/alert'),
  addAlert: (data) => api.post('/api/alert', data),
  removeAlert: (alertId) => api.delete(`/api/alert/${alertId}`),
};

export const aiNewsApi = {
  analyzeStock: (promptData) => api.post('/api/ai/analyze', promptData),
  getNews: (ticker) => api.get(`/api/news/${ticker}`),
};

export const adminApi = {
  getStats: () => api.get('/api/admin/stats'),
  getUsers: (params) => api.get('/api/admin/users', { params }),
  getTopWatchlist: () => api.get('/api/admin/watchlist/top'),
  getStocks: (params) => api.get('/api/admin/stocks', { params }),
  getAlerts: (params) => api.get('/api/admin/alerts', { params }),
  getChats: (params) => api.get('/api/admin/chats', { params }),
  unlockUser: (userId) => api.post(`/api/admin/users/${userId}/unlock`),
  resendVerifyEmail: (userId) => api.post(`/api/admin/users/${userId}/resend-verify`),
  changeUserRole: (userId, roleData) => api.post(`/api/admin/users/${userId}/role`, roleData),
};
