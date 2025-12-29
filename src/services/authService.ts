import axiosInstance from './axiosInstance';
import {
  LoginRequest,
  AuthResponse,
  VerifyEmailRequest,
  ResendOtpRequest,
  RefreshTokenRequest,
  RegistrationResponse,
  UserDto,
  GoogleAuthRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SetPasswordRequest,
  SetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse
} from '../data/authDTOs';

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

class AuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.token = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');

    // Check if token is expired on initialization
    if (this.token && this.isTokenExpired(this.token)) {
      
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Helper to check if token is expired
  private isTokenExpired(token: string): boolean {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return true;
      
      const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const decoded = JSON.parse(decodedJson);
      const exp = decoded.exp;
      
      if (!exp) return false; // No expiry set
      
      return Date.now() >= exp * 1000;
    } catch (e) {
      return true; // Invalid token
    }
  }

  // Login endpoint
  async login(credentials: LoginRequest): Promise<string> {
    try {
      
      
      const response = await axiosInstance.post<AuthResponse>('/api/auth/login', credentials);
      const authData = response.data;

      // Store tokens and user data
      this.token = authData.accessToken;
      this.refreshToken = authData.refreshToken;
      
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));

      
      
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
          
      
      
      
      if (isUnverifiedError) {
        // Create a special error type for unverified email
        const unverifiedError = new Error(errorMessage) as Error & { needsVerification?: boolean; email?: string };
        unverifiedError.needsVerification = true;
        unverifiedError.email = credentials.email;
        
        throw unverifiedError;
      }
      
      throw new Error(errorMessage);
    }
  }

  // Google OAuth login
  async loginWithGoogle(googleAccessToken: string): Promise<{
    redirectUrl: string;
    needsProfileCompletion: boolean;
    authData: AuthResponse;
  }> {
    try {
      
      
      // Send access token as idToken (backend will use it to fetch user info)
      const request: GoogleAuthRequest = { idToken: googleAccessToken };
      const response = await axiosInstance.post<AuthResponse>('/api/auth/google', request);
      const authData = response.data;

      // Store tokens and user data
      this.token = authData.accessToken;
      this.refreshToken = authData.refreshToken;
      
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));

      
      
      // Return redirect URL and profile completion status
      return {
        redirectUrl: this.getRedirectUrlByRole(authData.user.roles),
        needsProfileCompletion: authData.needsProfileCompletion || false,
        authData
      };
      
    } catch (error: unknown) {
      console.error('Google login error:', error);
      const axiosError = error as AxiosError;
      const data: unknown = (axiosError as any)?.response?.data;
      const errorMessage = typeof data === 'string'
        ? data
        : (axiosError.response?.data as any)?.message || 'Google login failed. Please try again.';
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

  // Forgot password - Request OTP
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    try {
      
      
      const request: ForgotPasswordRequest = { email };
      const response = await axiosInstance.post<ForgotPasswordResponse>(
        '/api/auth/forgot-password', 
        request
      );
      
      
      return response.data;
      
    } catch (error: unknown) {
      console.error('Forgot password error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 
        'Gửi mã OTP thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  }

  // Reset password with OTP
  async resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      
      
      const response = await axiosInstance.post<ResetPasswordResponse>(
        '/api/auth/reset-password', 
        request
      );
      
      
      return response.data;
      
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 
        'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  }

  // Set password for Google OAuth users (requires authentication)
  async setPassword(request: SetPasswordRequest): Promise<SetPasswordResponse> {
    try {
      
      
      const response = await axiosInstance.post<SetPasswordResponse>(
        '/api/auth/set-password', 
        request
      );
      
      
      return response.data;
      
    } catch (error: unknown) {
      console.error('Set password error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 
        'Đặt mật khẩu thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  }

  // Change password for authenticated users (requires authentication)
  async changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      
      
      const response = await axiosInstance.post<ChangePasswordResponse>(
        '/api/auth/change-password', 
        request
      );
      
      
      return response.data;
      
    } catch (error: unknown) {
      console.error('Change password error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 
        'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<AuthResponse> {
    try {
      
      
      if (!this.refreshToken) {
        console.error('❌ No refresh token available');
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
      
      // ✅ FIX: Only update user data if it exists in response
      if (authData.user) {
        localStorage.setItem('user', JSON.stringify(authData.user));
        
      } else {
        console.warn('⚠️ No user data in refresh response, keeping existing user data');
        // Keep existing user data in localStorage
      }

      return authData;
    } catch (error: unknown) {
      console.error('❌ Token refresh failed:', error);
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Token refresh failed';
      console.error('Error details:', errorMessage);
      
      // Clear tokens on refresh failure
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
      try { sessionStorage.removeItem('adminKeyVerified'); } catch (e) { void e; }
      
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local storage
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      try { sessionStorage.removeItem('adminKeyVerified'); } catch (e) { void e; }
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
    if (!this.token) return false;
    
    if (this.isTokenExpired(this.token)) {
      // Token expired, clear session
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return false;
    }
    
    return true;
  }

  // Get redirect URL based on user roles
  private getRedirectUrlByRole(roles: string[]): string {
    const baseUrl = window.location.origin;
    
    if (roles.includes('ADMIN')) {
      return `${baseUrl}/admin`;
    } else if (roles.includes('MENTOR')) {
      return `${baseUrl}/mentor`;
    } else if (roles.includes('RECRUITER')) {
      return `${baseUrl}/business`;
    } else if (roles.includes('PARENT')) {
      return `${baseUrl}/parent-dashboard`;
    } else {
      return `${baseUrl}/dashboard`;
    }
  }
}

export default new AuthService();
