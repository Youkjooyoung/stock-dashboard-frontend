import axios from 'axios';

const BASE = 'https://api.jyyouk.shop/api';

const api = axios.create({
  baseURL:         BASE,
  timeout:         10000,
  withCredentials: true,
  xsrfCookieName:  'XSRF-TOKEN',
  xsrfHeaderName:  'X-XSRF-TOKEN',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const clearAuthAndRedirect = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('kakaoNickname');
  localStorage.removeItem('provider');
  localStorage.removeItem('userId');
  window.location.href = '/login';
};

// ── 동시 401 처리용 큐 패턴 ──────────────────────────────
let isRefreshing = false;
let failedQueue  = [];          // { resolve, reject }[]

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

const tryRefresh = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('no refresh token');
  const res = await axios.post(
    `${BASE}/auth/refresh`,
    { refreshToken },
    { withCredentials: true }
  );
  const newToken = res.data.accessToken;
  localStorage.setItem('accessToken', newToken);
  return newToken;
};
// ─────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status          = error.response?.status;
    const hasToken        = !!localStorage.getItem('accessToken');

    if ((status === 401 || (status === 403 && hasToken)) && !originalRequest._retry) {
      originalRequest._retry = true;

      // 이미 refresh 진행 중이면 큐에 적재 후 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        const newToken = await tryRefresh();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
