// Auth Service DTOs

// Login Request DTO
export interface LoginRequest {
  email: string;
  password: string;
}

// Register Request DTO
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  region: string;
  bio?: string;
  avatarMediaId?: number;
  companyId?: number;
  socialLinks?: string; // JSON string for social media links
}

// Verify Email Request DTO
export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

// Resend OTP Request DTO
export interface ResendOtpRequest {
  email: string;
}

// Refresh Token Request DTO
export interface RefreshTokenRequest {
  refreshToken: string;
}

// User DTO
export interface UserDto {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string; // User avatar/profile picture URL
  roles: string[];
  authProvider: string; // 'LOCAL' or 'GOOGLE'
  googleLinked: boolean; // Whether user has linked Google account
}

// Google Auth Request DTO
export interface GoogleAuthRequest {
  idToken: string;
}

// Auth Response DTO
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserDto;
  needsProfileCompletion?: boolean;
}

// Registration Response DTO
export interface RegistrationResponse {
  message: string;
  email: string;
  requiresVerification: boolean;
  otpExpiryMinutes: number;
  otpExpiryTime?: string; // ISO timestamp
  nextStep: string;
}

// Email Verified Response DTO
export interface EmailVerifiedResponse {
  message: string;
  email: string;
  isVerified: boolean;
}

// Forgot Password Request DTO
export interface ForgotPasswordRequest {
  email: string;
}

// Forgot Password Response DTO
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  email: string;
  otpExpiryMinutes: number;
  otpExpiryTime?: string; // ISO timestamp
  nextStep: string;
}

// Reset Password Request DTO
export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

// Reset Password Response DTO
export interface ResetPasswordResponse {
  message: string;
  email: string;
  requiresVerification: boolean;
  nextStep: string;
}

// Set Password Request DTO (for Google users)
export interface SetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

// Set Password Response DTO
export interface SetPasswordResponse {
  message: string;
  email: string;
  requiresVerification: boolean;
  nextStep: string;
}

// Change Password Request DTO
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Change Password Response DTO
export interface ChangePasswordResponse {
  message: string;
  email: string;
  requiresVerification: boolean;
  nextStep: string;
}

// API Error Response
export interface ApiErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}