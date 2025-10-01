import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Determine baseURL based on environment

const baseURL =
  import.meta.env.VITE_BACKEND_URL
  || (typeof window !== 'undefined' && location.hostname === 'localhost'
      ? 'http://localhost:8080/api'
      : 'https://skillverse.vn/api'); // ép dùng https production

export const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Public endpoints (❌ bỏ tiền tố /api vì đã có trong baseURL)
const PUBLIC_ENDPOINTS = [
  '/auth/register',
  '/auth/login',
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

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear local storage and redirect to login
      console.warn('Authentication failed, clearing tokens');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Only redirect to login if not already on a public page
      const currentPath = window.location.pathname;
      const isPublicPage = currentPath.includes('/login') || 
                          currentPath.includes('/register') || 
                          currentPath.includes('/verify') ||
                          currentPath === '/';
      
      if (!isPublicPage) {
        window.location.href = '/login';
      }
    }
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