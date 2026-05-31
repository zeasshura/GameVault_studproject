import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY = 'gv_access_token';
const REFRESH_TOKEN_KEY = 'gv_refresh_token';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ──────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ── Response Interceptor (token refresh on 401) ──────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const isPublicGet = originalRequest.method?.toUpperCase() === 'GET' &&
        (originalRequest.url?.includes('/games/') || originalRequest.url?.includes('/reviews/'));

      if (!refreshToken) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        if (isPublicGet) {
          if (originalRequest.headers) {
            if (typeof originalRequest.headers.delete === 'function') {
              originalRequest.headers.delete('Authorization');
              originalRequest.headers.delete('authorization');
            }
            delete originalRequest.headers.Authorization;
            delete originalRequest.headers.authorization;
          }
          originalRequest._retry = true;
          return apiClient(originalRequest);
        }
        if (originalRequest.url?.includes('/auth/me/')) {
          return Promise.reject(error);
        }
        clearTokensAndRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post('/api/auth/refresh/', {
          refresh: refreshToken,
        });
        const newAccessToken: string = response.data.access;

        localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        if (isPublicGet) {
          if (originalRequest.headers) {
            if (typeof originalRequest.headers.delete === 'function') {
              originalRequest.headers.delete('Authorization');
              originalRequest.headers.delete('authorization');
            }
            delete originalRequest.headers.Authorization;
            delete originalRequest.headers.authorization;
          }
          return apiClient(originalRequest);
        }
        if (originalRequest.url?.includes('/auth/me/')) {
          return Promise.reject(refreshError);
        }
        clearTokensAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function clearTokensAndRedirect() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.location.href = '/login';
}

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };
export default apiClient;
