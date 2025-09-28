import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';
import { LoginRequest, UserDto, VerifyEmailRequest, ResendOtpRequest } from '../data/authDTOs';
import { UserRegistrationRequest } from '../data/userDTOs';

interface AuthContextType {
  user: UserDto | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<string>;
  register: (userData: UserRegistrationRequest) => Promise<{ requiresVerification: boolean; email: string; message: string }>;
  verifyEmail: (request: VerifyEmailRequest) => Promise<void>;
  resendOtp: (request: ResendOtpRequest) => Promise<string>;
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        if (storedUser && authService.isAuthenticated()) {
          setUser(storedUser);
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

  const login = async (credentials: LoginRequest): Promise<string> => {
    try {
      setLoading(true);
      const redirectUrl = await authService.login(credentials);
      
      // Get updated user data after login
      const updatedUser = authService.getStoredUser();
      setUser(updatedUser);
      
      return redirectUrl;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserRegistrationRequest): Promise<{ requiresVerification: boolean; email: string; message: string }> => {
    try {
      setLoading(true);
      const response = await userService.register(userData);
      
      return {
        requiresVerification: response.requiresVerification,
        email: response.email,
        message: response.message
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
    login,
    register,
    verifyEmail,
    resendOtp,
    logout,
    isAuthenticated: !!user && authService.isAuthenticated(),
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
