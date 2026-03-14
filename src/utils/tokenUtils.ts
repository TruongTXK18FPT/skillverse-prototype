import {
  clearAuthSession,
  getAccessToken,
} from "./authStorage";

/**
 * Token utility functions for handling JWT tokens
 */

/**
 * Clear all authentication tokens from localStorage
 */
export const clearAuthTokens = (): void => {
  clearAuthSession();
};

/**
 * Check if token exists
 */
export const hasToken = (): boolean => {
  return !!getAccessToken();
};

/**
 * Get current token
 */
export const getToken = (): string | null => {
  return getAccessToken();
};

/**
 * Force logout and redirect to login
 */
export const forceLogout = (reason?: string): void => {
  console.error('🔴 Force logout:', reason || 'Unknown reason');
  
  // Clear tokens
  clearAuthTokens();
  
  // Show notification
  if (reason) {
    alert(reason);
  }
  
  // Redirect to login
  window.location.href = '/login';
};

/**
 * Check if error is JWT-related
 */
export const isJWTError = (error: any): boolean => {
  if (!error?.response) return false;
  
  const { status, data } = error.response;
  
  // Check for 401 Unauthorized
  if (status === 401) return true;
  
  // Check for 500 with JWT error message
  if (status === 500 && data?.message) {
    const message = data.message.toLowerCase();
    return (
      message.includes('jwt') ||
      message.includes('token') ||
      message.includes('signature') ||
      message.includes('expired')
    );
  }
  
  return false;
};

export default {
  clearAuthTokens,
  hasToken,
  getToken,
  forceLogout,
  isJWTError,
};
