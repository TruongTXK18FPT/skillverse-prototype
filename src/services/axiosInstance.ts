import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/verify',
  // Note: /api/auth/logout is NOT public - it requires Authorization header
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/resend-otp',
  '/api/auth/complete-profile',
  '/api/users/register',
  '/api/users/verify-email',
  '/api/users/resend-otp',
  '/api/mentors/register',
  '/api/business/register',
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