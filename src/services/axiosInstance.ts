import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Determine baseURL based on environment

const isLocal = typeof window !== 'undefined' && location.hostname === 'localhost';
let RAW_BASE =
  import.meta.env.VITE_BACKEND_URL ??
  (isLocal ? 'http://localhost:8080/api' : '/api');

// Ensure base ends with /api (backend is under /api)
if (!/\/api\/?$/i.test(RAW_BASE)) {
  RAW_BASE = `${RAW_BASE.replace(/\/+$/, '')}/api`;
}

// Bỏ dấu "/" cuối để tránh "//"
const baseURL = RAW_BASE.replace(/\/+$/, '');

/**
 * ✅ AUTOMATIC JWT TOKEN REFRESH MECHANISM
 * 
 * How it works:
 * 1. When any API call returns 401 (Unauthorized), interceptor catches it
 * 2. Checks if token refresh is already in progress (prevent race condition)
 * 3. If not, calls /auth/refresh endpoint with refreshToken
 * 4. Backend validates refreshToken and returns new accessToken + refreshToken
 * 5. Updates localStorage with new tokens
 * 6. Retries original failed request with new accessToken
 * 7. Processes queued requests that failed during refresh
 * 
 * Token Flow:
 * - Google Login: Frontend gets Google access_token → Backend validates → Returns JWT + refresh token
 * - JWT Token: Used for all API calls (Authorization: Bearer <token>)
 * - Refresh Token: Stored in localStorage, used to get new JWT when expired
 * - Google access_token: ONLY used once during login, NOT stored
 * 
 * Benefits:
 * - Seamless user experience (no forced logout on token expiration)
 * - Handles concurrent requests during refresh (queuing mechanism)
 * - Works for both LOCAL and GOOGLE users (unified JWT approach)
 * 
 * Security:
 * - Refresh token has longer expiry (24 hours default)
 * - If refresh fails → Force logout and redirect to /login
 * - Each refresh generates new tokens (rotation)
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

export const axiosInstance = axios.create({
  baseURL,
  timeout: 60000, // 60 seconds for AI requests (roadmap generation, chatbot)
  headers: { 'Content-Type': 'application/json' },
});

// Nếu baseURL đã kết thúc bằng "/api" mà URL lại bắt đầu bằng "/api", cắt bớt một cái
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const baseEndsWithApi = /\/api$/i.test(baseURL);
  const url = config.url || '';

  if (baseEndsWithApi && url.startsWith('/api/')) {
    config.url = url.replace(/^\/api/, ''); // "/api/auth" -> "/auth"
  }
  // Chống "//" (trừ "http://")
  if (config.url) {
    config.url = config.url.replace(/([^:]\/)\/+/g, '$1');
  }
  return config;
});

// Public endpoints (❌ bỏ tiền tố /api vì đã có trong baseURL)
const PUBLIC_ENDPOINTS = [
  '/auth/register',
  '/auth/login',
  '/auth/google',             // ✅ Google OAuth login endpoint
  '/auth/refresh',
  '/auth/verify',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/resend-otp',
  '/auth/complete-profile',
  '/users/register',
  '/users/verify-email',
  '/users/resend-otp',
  '/mentors/register',
  '/business/register',
  '/v1/meowl/chat',           // Meowl chat endpoint
  '/v1/meowl/reminders',       // Meowl reminders
  '/v1/meowl/notifications',   // Meowl notifications
  '/v1/meowl/health',          // Meowl health check
];

// Check if the URL matches any public endpoint
const isPublicEndpoint = (url: string): boolean => {
  return PUBLIC_ENDPOINTS.some(endpoint => 
    url.includes(endpoint) || url.startsWith(endpoint)
  );
};

// Request interceptor to add auth token (only for protected endpoints)
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only add token for protected endpoints
    if (!isPublicEndpoint(config.url || '')) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ✅ REFRESH MECHANISM: Process queued requests after token refresh
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle common errors with auto-refresh
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // ✅ AUTO-REFRESH JWT: If 401 and not a refresh/login request, try to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const requestUrl = originalRequest.url || '';
      
      // Don't retry if it's already a refresh or login request
      if (requestUrl.includes('/auth/refresh') || 
          requestUrl.includes('/auth/login') || 
          requestUrl.includes('/auth/google')) {
        console.warn('Authentication failed on auth endpoint, clearing tokens');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        const currentPath = window.location.pathname;
        const isPublicPage = currentPath.includes('/login') || 
                            currentPath.includes('/register') || 
                            currentPath.includes('/verify') ||
                            currentPath === '/';
        
        if (!isPublicPage) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      // ✅ CONCURRENCY CONTROL: If refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        console.warn('No refresh token available, clearing tokens');
        isRefreshing = false;
        processQueue(new Error('No refresh token'), null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        // ✅ CALL REFRESH ENDPOINT: Get new tokens
        console.log('Access token expired, refreshing...');
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken
        });
        
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        
        // ✅ UPDATE STORAGE: Save new tokens
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // ✅ UPDATE REQUEST: Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        console.log('Token refreshed successfully, retrying request');
        isRefreshing = false;
        processQueue(null, newAccessToken);
        
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        console.error('Token refresh failed, logging out', refreshError);
        isRefreshing = false;
        processQueue(refreshError as Error, null);
        
        // ✅ REFRESH FAILED: Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        const currentPath = window.location.pathname;
        const isPublicPage = currentPath.includes('/login') || 
                            currentPath.includes('/register') || 
                            currentPath.includes('/verify') ||
                            currentPath === '/';
        
        if (!isPublicPage) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // ✅ OTHER ERRORS: Pass through
    return Promise.reject(error);
  }
);

// Utility function to clear authentication tokens
export const clearAuthTokens = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  console.log('Authentication tokens cleared');
};

export default axiosInstance;