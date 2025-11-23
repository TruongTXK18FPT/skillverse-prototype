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
  nextStep: string;
}

// Email Verified Response DTO
export interface EmailVerifiedResponse {
  message: string;
  email: string;
  isVerified: boolean;
}

// API Error Response
export interface ApiErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}