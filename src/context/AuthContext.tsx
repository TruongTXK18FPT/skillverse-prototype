import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import authService from '../services/authService';
import userService from '../services/userService';
import { AUTH_LOGOUT_EVENT, clearAuthTokens } from '../services/axiosInstance';
import { LoginRequest, UserDto, VerifyEmailRequest, ResendOtpRequest, ForgotPasswordResponse, ResetPasswordRequest, ResetPasswordResponse, SetPasswordRequest, SetPasswordResponse, ChangePasswordRequest, ChangePasswordResponse } from '../data/authDTOs';
import { UserRegistrationRequest } from '../data/userDTOs';
import { AUTH_SESSION_SYNCED_EVENT, initAuthTabSync, requestSessionFromOtherTabs } from '../utils/authTabSync';
import { initBookingSync } from '../utils/bookingSync';
import {
  clearAuthSession,
  clearDeviceSessionId,
  updateStoredUser,
} from '../utils/authStorage';

interface AuthContextType {
  user: UserDto | null;
  loading: boolean;
  updateUser: (updates: Partial<UserDto>) => void;
  login: (credentials: LoginRequest, rememberMe?: boolean) => Promise<string>;
  register: (userData: UserRegistrationRequest) => Promise<{ requiresVerification: boolean; email: string; message: string; otpExpiryTime?: string }>;
  verifyEmail: (request: VerifyEmailRequest) => Promise<void>;
  resendOtp: (request: ResendOtpRequest) => Promise<string>;
  forgotPassword: (email: string) => Promise<ForgotPasswordResponse>;
  resetPassword: (request: ResetPasswordRequest) => Promise<ResetPasswordResponse>;
  setPassword: (request: SetPasswordRequest) => Promise<SetPasswordResponse>;
  changePassword: (request: ChangePasswordRequest) => Promise<ChangePasswordResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUser = useCallback((updates: Partial<UserDto>) => {
    setUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      const nextUser = {
        ...prevUser,
        ...updates,
      };
      updateStoredUser(nextUser);
      return nextUser;
    });
  }, []);

  // Initialize cross-tab auth sync channel once.
  useEffect(() => {
    const cleanupAuth = initAuthTabSync();
    const cleanupBooking = initBookingSync();
    return () => { cleanupAuth(); cleanupBooking(); };
  }, []);

  // Listen for global logout events (from axios interceptors)
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
    };

    const handleLoggedElsewhere = () => {
      clearAuthSession();
      clearDeviceSessionId();
      setUser(null);
    };

    const handleSessionSynced = () => {
      const syncedUser = authService.getStoredUser();
      if (syncedUser) {
        setUser(syncedUser);
      }
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
    window.addEventListener('account-logged-elsewhere', handleLoggedElsewhere);
    window.addEventListener(AUTH_SESSION_SYNCED_EVENT, handleSessionSynced);
    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
      window.removeEventListener('account-logged-elsewhere', handleLoggedElsewhere);
      window.removeEventListener(AUTH_SESSION_SYNCED_EVENT, handleSessionSynced);
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        let storedUser = authService.getStoredUser();

        // For sessionStorage-only logins, a new tab can request auth state from existing tabs.
        if (!storedUser) {
          await requestSessionFromOtherTabs();
          storedUser = authService.getStoredUser();
        }

        if (!storedUser) {
          return;
        }

        if (authService.isAuthenticated()) {
          setUser(storedUser);
          return;
        }

        // Access token may be expired after reload; attempt silent refresh first.
        const refreshed = await authService.refreshAccessToken();
        if (refreshed?.user) {
          setUser(refreshed.user);
        } else {
          const fallbackUser = authService.getStoredUser();
          if (fallbackUser) {
            setUser(fallbackUser);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest, rememberMe = false): Promise<string> => {
    try {
      setLoading(true);
      const redirectUrl = await authService.login(credentials, rememberMe);
      
      // Get updated user data after login
      const updatedUser = authService.getStoredUser();
      setUser(updatedUser);
      
      return redirectUrl;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserRegistrationRequest): Promise<{ requiresVerification: boolean; email: string; message: string; otpExpiryTime?: string }> => {
    try {
      setLoading(true);
      const response = await userService.register(userData);
      
      return {
        requiresVerification: response.requiresVerification,
        email: response.email,
        message: response.message,
        otpExpiryTime: response.otpExpiryTime
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (request: VerifyEmailRequest): Promise<void> => {
    try {
      setLoading(true);
      await authService.verifyEmail(request);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (request: ResendOtpRequest): Promise<string> => {
    try {
      setLoading(true);
      return await authService.resendOtp(request);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
    try {
      setLoading(true);
      return await authService.forgotPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (request: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    try {
      setLoading(true);
      const response = await authService.resetPassword(request);
      clearAuthTokens();
      setUser(null);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const setPassword = async (request: SetPasswordRequest): Promise<SetPasswordResponse> => {
    try {
      setLoading(true);
      const response = await authService.setPassword(request);
      clearAuthTokens();
      setUser(null);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (request: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    try {
      setLoading(true);
      const response = await authService.changePassword(request);
      
      // ✅ SECURITY: After password change, tokens are invalidated by backend
      // Clear all auth data and force re-login
      clearAuthTokens();
      setUser(null);
      
      return response;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    updateUser,
    login,
    register,
    verifyEmail,
    resendOtp,
    forgotPassword,
    resetPassword,
    setPassword,
    changePassword,
    logout,
    isAuthenticated: !!user && authService.isAuthenticated(),
  }), [user, loading, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
