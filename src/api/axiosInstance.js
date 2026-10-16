import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { clearStoredAuth } from '../utils/authStorage';

const BASE = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL:         BASE,
  timeout:         10000,
  withCredentials: true,
  xsrfCookieName:  'XSRF-TOKEN',
  xsrfHeaderName:  'X-XSRF-TOKEN',
});

// 모든 요청에 저장된 액세스 토큰을 붙인다.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const clearAuthAndRedirect = () => {
  clearStoredAuth();
  window.location.href = '/login';
};

// ── 동시 401 처리용 큐 패턴 ──────────────────────────────
// 토큰이 만료되면 여러 요청이 한꺼번에 401 을 받는다.
// 토큰 갱신(refresh)은 한 번만 하고, 나머지 요청은 큐에서 기다렸다가 새 토큰으로 다시 보낸다.
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
  // api 가 아니라 axios 를 직접 쓴다. api 로 보내면 갱신 요청의 401 이 다시 이 인터셉터로 들어와 무한 반복된다.
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

    // 토큰 없이 받은 403 은 "로그인이 필요한 기능"이므로 갱신을 시도하지 않는다.
    // 토큰이 있는데 받은 403 은 만료된 토큰일 수 있어 401 과 똑같이 갱신을 시도한다.
    // _retry 표시로 같은 요청은 한 번만 다시 보낸다.
    if (status === 403 && !hasToken) {
      return Promise.reject(error);
    }

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
