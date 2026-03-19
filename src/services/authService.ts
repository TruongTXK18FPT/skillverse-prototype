import axiosInstance from "./axiosInstance";
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
  ChangePasswordResponse,
} from "../data/authDTOs";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUserRaw,
  setAuthSession,
  updateAuthSession,
} from "../utils/authStorage";
import {
  broadcastLogoutToOtherTabs,
  broadcastSessionToOtherTabs,
} from "../utils/authTabSync";
import { clearPersistedMeowlChatState } from "./meowlChatService";

// Helper type for axios error handling
type AxiosError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      code?: string;
    };
  };
};

class AuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.token = getAccessToken();
    this.refreshToken = getRefreshToken();

    // On startup, avoid clearing refresh session if access token is expired.
    // Keep refresh token so app can silently refresh and restore auth state.
    if (this.token && this.isTokenExpired(this.token)) {
      this.token = null;
    }
  }

  private syncTokensFromStorage(): void {
    this.token = getAccessToken() ?? this.token;
    this.refreshToken = getRefreshToken() ?? this.refreshToken;
  }

  // Helper to check if token is expired
  private isTokenExpired(token: string): boolean {
    try {
      const payloadBase64 = token.split(".")[1];
      if (!payloadBase64) return true;

      const decodedJson = atob(
        payloadBase64.replace(/-/g, "+").replace(/_/g, "/"),
      );
      const decoded = JSON.parse(decodedJson);
      const exp = decoded.exp;

      if (!exp) return false; // No expiry set

      return Date.now() >= exp * 1000;
    } catch {
      return true; // Invalid token
    }
  }

  // Login endpoint
  async login(credentials: LoginRequest, rememberMe = false): Promise<string> {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        "/api/auth/login",
        {
          email: credentials.email,
          password: credentials.password,
          rememberMe,
        },
      );
      const authData = response.data;
      const persistedRefreshToken = rememberMe
        ? authData.refreshToken ?? null
        : null;

      // Store tokens and user data
      this.token = authData.accessToken;
      this.refreshToken = persistedRefreshToken;

      setAuthSession(
        authData.accessToken,
        persistedRefreshToken,
        authData.user,
        rememberMe,
      );
      broadcastSessionToOtherTabs();

      // Return redirect URL based on user roles
      return this.getRedirectUrlByRole(authData.user.roles);
    } catch (error: unknown) {
      console.error("Login error:", error);
      const axiosError = error as AxiosError;
      const errorCode = axiosError.response?.data?.code || "";
      const errorMessage =
        axiosError.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";

      // Check if error is related to unverified email
      const isUnverifiedError =
        errorCode === "EMAIL_NOT_VERIFIED" ||
        errorMessage.toLowerCase().includes("verify") ||
        errorMessage.toLowerCase().includes("xác thực") ||
        errorMessage.toLowerCase().includes("not verified") ||
        errorMessage.toLowerCase().includes("chưa xác thực") ||
        errorMessage.toLowerCase().includes("email not verified") ||
        errorMessage.toLowerCase().includes("please verify") ||
        errorMessage.toLowerCase().includes("account not verified") ||
        errorMessage.toLowerCase().includes("verification required");

      if (isUnverifiedError) {
        // Create a special error type for unverified email
        const unverifiedError = new Error(errorMessage) as Error & {
          needsVerification?: boolean;
          email?: string;
        };
        unverifiedError.needsVerification = true;
        unverifiedError.email = credentials.email;

        throw unverifiedError;
      }

      throw new Error(errorMessage);
    }
  }

  // Google OAuth login (currently receives Google access_token from useGoogleLogin)
  async loginWithGoogle(googleAccessToken: string, rememberMe = false): Promise<{
    redirectUrl: string;
    needsProfileCompletion: boolean;
    authData: AuthResponse;
  }> {
    try {
      // Send access token as idToken (backend will use it to fetch user info)
      const request: GoogleAuthRequest = {
        idToken: googleAccessToken,
        rememberMe,
      };
      const response = await axiosInstance.post<AuthResponse>(
        "/api/auth/google",
        request,
      );
      const authData = response.data;
      const persistedRefreshToken = rememberMe
        ? authData.refreshToken ?? null
        : null;

      // Store tokens and user data
      this.token = authData.accessToken;
      this.refreshToken = persistedRefreshToken;

      setAuthSession(
        authData.accessToken,
        persistedRefreshToken,
        authData.user,
        rememberMe,
      );
      broadcastSessionToOtherTabs();

      // Return redirect URL and profile completion status
      return {
        redirectUrl: this.getRedirectUrlByRole(authData.user.roles),
        needsProfileCompletion: authData.needsProfileCompletion || false,
        authData,
      };
    } catch (error: unknown) {
      console.error("Google login error:", error);
      const axiosError = error as AxiosError;
      const data: unknown = (axiosError as any)?.response?.data;
      const errorMessage =
        typeof data === "string"
          ? data
          : (axiosError.response?.data as any)?.message ||
            "Google login failed. Please try again.";
      throw new Error(errorMessage);
    }
  }

  // Verify email with OTP
  async verifyEmail(
    request: VerifyEmailRequest,
  ): Promise<RegistrationResponse> {
    try {
      const response = await axiosInstance.post<RegistrationResponse>(
        "/api/auth/verify-email",
        request,
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Email verification error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Xác thực email thất bại. Vui lòng thử lại.";
      throw new Error(errorMessage);
    }
  }

  // Resend OTP
  async resendOtp(request: ResendOtpRequest): Promise<string> {
    try {
      const response = await axiosInstance.post<string>(
        "/api/auth/resend-otp",
        request,
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Resend OTP error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Gửi lại mã OTP thất bại. Vui lòng thử lại.";
      throw new Error(errorMessage);
    }
  }

  // Forgot password - Request OTP
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    try {
      const request: ForgotPasswordRequest = { email };
      const response = await axiosInstance.post<ForgotPasswordResponse>(
        "/api/auth/forgot-password",
        request,
      );

      return response.data;
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Gửi mã OTP thất bại. Vui lòng thử lại.";
      throw new Error(errorMessage);
    }
  }

  // Reset password with OTP
  async resetPassword(
    request: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    try {
      const response = await axiosInstance.post<ResetPasswordResponse>(
        "/api/auth/reset-password",
        request,
      );

      return response.data;
    } catch (error: unknown) {
      console.error("Reset password error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      throw new Error(errorMessage);
    }
  }

  // Set password for Google OAuth users (requires authentication)
  async setPassword(request: SetPasswordRequest): Promise<SetPasswordResponse> {
    try {
      const response = await axiosInstance.post<SetPasswordResponse>(
        "/api/auth/set-password",
        request,
      );

      return response.data;
    } catch (error: unknown) {
      console.error("Set password error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Đặt mật khẩu thất bại. Vui lòng thử lại.";
      throw new Error(errorMessage);
    }
  }

  // Change password for authenticated users (requires authentication)
  async changePassword(
    request: ChangePasswordRequest,
  ): Promise<ChangePasswordResponse> {
    try {
      const response = await axiosInstance.post<ChangePasswordResponse>(
        "/api/auth/change-password",
        request,
      );

      return response.data;
    } catch (error: unknown) {
      console.error("Change password error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Đổi mật khẩu thất bại. Vui lòng thử lại.";
      throw new Error(errorMessage);
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<AuthResponse> {
    try {
      this.syncTokensFromStorage();
      if (!this.refreshToken) {
        console.error("❌ No refresh token available");
        throw new Error("No refresh token available");
      }

      const request: RefreshTokenRequest = { refreshToken: this.refreshToken };
      const response = await axiosInstance.post<AuthResponse>(
        "/api/auth/refresh",
        request,
      );
      const authData = response.data;

      // Update tokens
      this.token = authData.accessToken;
      this.refreshToken = authData.refreshToken ?? null;

      updateAuthSession(
        authData.accessToken,
        this.refreshToken,
        authData.user,
      );
      broadcastSessionToOtherTabs();

      return authData;
    } catch (error: unknown) {
      console.error("❌ Token refresh failed:", error);
      const axiosError = error as AxiosError;
      const data = axiosError.response?.data as
        | { code?: string; message?: string }
        | undefined;
      const errorMessage = data?.message || "Token refresh failed";
      console.error("Error details:", errorMessage);

      if (
        error instanceof Error &&
        error.message === "No refresh token available"
      ) {
        throw error;
      }

      // Clear tokens on refresh failure
      this.logout();

      const errorCode = data?.code;
      if (errorCode === "ACCOUNT_INACTIVE") {
        throw new Error(
          "Tài khoản của bạn đang bị khóa hoặc không hoạt động. Vui lòng liên hệ hỗ trợ.",
        );
      }
      if (errorCode === "REFRESH_TOKEN_EXPIRED") {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      throw new Error(
        errorMessage || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      );
    }
  }

  // Logout user with Meowl chat history cleanup
  async logout(): Promise<void> {
    try {
      this.syncTokensFromStorage();
      // Get user ID before clearing data for Meowl history cleanup
      const storedUser = this.getStoredUser();
      const userId = storedUser?.id;

      // Clear Meowl chat history on backend if user was logged in
      if (userId && this.token) {
        try {
          await axiosInstance.delete(`/v1/meowl/history/${userId}`);
          console.log("Meowl chat history cleared on logout");
        } catch (error) {
          // Don't block logout if Meowl cleanup fails
          console.warn("Failed to clear Meowl chat history:", error);
        }
      }

      // Call logout API endpoint - token sent via Authorization header
      if (this.token) {
        try {
          await axiosInstance.post("/api/auth/logout");
        } catch (error) {
          // Don't throw error if logout API fails, still clear local data
          console.warn("Logout API call failed:", error);
        }
      }

      // Clear tokens and user data
      this.token = null;
      this.refreshToken = null;
      clearAuthSession();
      broadcastLogoutToOtherTabs();
      // Clear Meowl preferences
      localStorage.removeItem("meowl_dark_mode");
      localStorage.removeItem("meowl_font_size");
      localStorage.removeItem("meowl_theme");
      clearPersistedMeowlChatState();
      // Clear guest session
      sessionStorage.removeItem("meowl_guest_session");
      try {
        sessionStorage.removeItem("adminKeyVerified");
      } catch (e) {
        void e;
      }

      // Dispatch event to immediately clear Meowl chat UI
      window.dispatchEvent(new CustomEvent("meowl-logout"));

      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear local storage
      this.token = null;
      this.refreshToken = null;
      clearAuthSession();
      broadcastLogoutToOtherTabs();
      localStorage.removeItem("meowl_dark_mode");
      localStorage.removeItem("meowl_font_size");
      localStorage.removeItem("meowl_theme");
      clearPersistedMeowlChatState();
      sessionStorage.removeItem("meowl_guest_session");
      try {
        sessionStorage.removeItem("adminKeyVerified");
      } catch (e) {
        void e;
      }
      window.dispatchEvent(new CustomEvent("meowl-logout"));
    }
  }

  // Get current access token
  getToken(): string | null {
    this.syncTokensFromStorage();
    return this.token;
  }

  // Get stored user data
  getStoredUser(): UserDto | null {
    try {
      const userStr = getStoredUserRaw();
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    this.syncTokensFromStorage();
    if (!this.token) return false;

    if (this.isTokenExpired(this.token)) {
      // Token expired; keep refresh token/session for silent refresh flow
      this.token = null;
      return false;
    }

    return true;
  }

  // Get redirect URL based on user roles
  private getRedirectUrlByRole(roles: string[]): string {
    const baseUrl = window.location.origin;

    if (roles.includes("ADMIN")) {
      return `${baseUrl}/admin`;
    } else if (roles.includes("MENTOR")) {
      return `${baseUrl}/mentor`;
    } else if (roles.includes("RECRUITER")) {
      return `${baseUrl}/business`;
    } else if (roles.includes("PARENT")) {
      return `${baseUrl}/parent-dashboard`;
    } else {
      return `${baseUrl}/dashboard`;
    }
  }
}

export default new AuthService();
