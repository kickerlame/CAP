// ============================================================
// VPPT — src/api/client.ts
// Axios instance with JWT auth interceptors + auto-refresh.
// ============================================================
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Attach access token ───────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isAuthRoute = config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh');
  if (!isAuthRoute) {
    const token = localStorage.getItem('vppt_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Auto-refresh on 401 ───────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

const clearAuthStorage = () => {
  localStorage.removeItem('vppt_access_token');
  localStorage.removeItem('vppt_refresh_token');
  localStorage.removeItem('vppt_user');
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Do not attempt refresh on auth endpoints (login, refresh, logout)
    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers!.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('vppt_refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        clearAuthStorage();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = data.data.accessToken;
        localStorage.setItem('vppt_access_token', newToken);
        processQueue(null, newToken);
        original.headers!.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        clearAuthStorage();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
