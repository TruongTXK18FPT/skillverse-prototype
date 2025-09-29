import axiosInstance from './axiosInstance';
import {
  LoginRequest,
  AuthResponse,
  VerifyEmailRequest,
  ResendOtpRequest,
  RefreshTokenRequest,
  RegistrationResponse,
  UserDto
} from '../data/authDTOs';

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

class AuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.token = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Login endpoint
  async login(credentials: LoginRequest): Promise<string> {
    try {
      console.log('Attempting login with credentials:', credentials.email);
      
      const response = await axiosInstance.post<AuthResponse>('/api/auth/login', credentials);
      const authData = response.data;

      // Store tokens and user data
      this.token = authData.accessToken;
      this.refreshToken = authData.refreshToken;
      
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));

      console.log('Login successful for user:', authData.user.email);
      
      // Return redirect URL based on user roles
      return this.getRedirectUrlByRole(authData.user.roles);
      
    } catch (error: unknown) {
      console.error('Login error:', error);
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      // Check if error is related to unverified email
      const isUnverifiedError = errorMessage.toLowerCase().includes('verify') || 
          errorMessage.toLowerCase().includes('xác thực') ||
          errorMessage.toLowerCase().includes('not verified') ||
          errorMessage.toLowerCase().includes('chưa xác thực') ||
          errorMessage.toLowerCase().includes('email not verified') ||
          errorMessage.toLowerCase().includes('please verify') ||
          errorMessage.toLowerCase().includes('account not verified') ||
          errorMessage.toLowerCase().includes('verification required');
          
      console.log('Error message:', errorMessage);
      console.log('Is unverified error:', isUnverifiedError);
      
      if (isUnverifiedError) {
        // Create a special error type for unverified email
        const unverifiedError = new Error(errorMessage) as Error & { needsVerification?: boolean; email?: string };
        unverifiedError.needsVerification = true;
        unverifiedError.email = credentials.email;
        console.log('Throwing unverified error:', unverifiedError);
        throw unverifiedError;
      }
      
      throw new Error(errorMessage);
    }
  }

  // Verify email with OTP
  async verifyEmail(request: VerifyEmailRequest): Promise<RegistrationResponse> {
    try {
      const response = await axiosInstance.post<RegistrationResponse>('/api/auth/verify-email', request);
      return response.data;
    } catch (error: unknown) {
      console.error('Email verification error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Xác thực email thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  }

  // Resend OTP
  async resendOtp(request: ResendOtpRequest): Promise<string> {
    try {
      const response = await axiosInstance.post<string>('/api/auth/resend-otp', request);
      return response.data;
    } catch (error: unknown) {
      console.error('Resend OTP error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Gửi lại mã OTP thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<AuthResponse> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const request: RefreshTokenRequest = { refreshToken: this.refreshToken };
      const response = await axiosInstance.post<AuthResponse>('/api/auth/refresh', request);
      const authData = response.data;

      // Update tokens
      this.token = authData.accessToken;
      this.refreshToken = authData.refreshToken;
      
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));

      return authData;
    } catch (error: unknown) {
      console.error('Token refresh error:', error);
      this.logout();
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  // Logout user
  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout API endpoint - token sent via Authorization header
      if (this.token) {
        try {
          await axiosInstance.post('/api/auth/logout');
        } catch (error) {
          // Don't throw error if logout API fails, still clear local data
          console.warn('Logout API call failed:', error);
        }
      }
      
      // Clear tokens and user data
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local storage
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Get current access token
  getToken(): string | null {
    return this.token;
  }

  // Get stored user data
  getStoredUser(): UserDto | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get redirect URL based on user roles
  private getRedirectUrlByRole(roles: string[]): string {
    const baseUrl = window.location.origin;
    
    if (roles.includes('ADMIN')) {
      return `${baseUrl}/admin`;
    } else if (roles.includes('MENTOR')) {
      return `${baseUrl}/mentor`;
    } else if (roles.includes('BUSINESS')) {
      return `${baseUrl}/business`;
    } else {
      return `${baseUrl}/dashboard`;
    }
  }
}

export default new AuthService();
