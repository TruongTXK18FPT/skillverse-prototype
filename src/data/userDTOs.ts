// User Service DTOs

// Base Registration Request (shared fields)
export interface BaseRegistrationRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
  bio?: string;
  address?: string;
  region?: string;
}

// User Registration Request DTO
export interface UserRegistrationRequest extends BaseRegistrationRequest {
  socialLinks?: string; // JSON string for social media links
  birthday?: string;
  gender?: string;
  provinceCode?: string;
  districtCode?: string;
}

// Base Registration Response (shared fields)
export interface BaseRegistrationResponse {
  success: boolean;
  message: string;
  email: string;
  userId: number;
  requiresVerification: boolean;
  otpExpiryMinutes: number;
  nextStep: string;
}

// User Registration Response DTO  
export type UserRegistrationResponse = BaseRegistrationResponse;

// User Profile Response DTO
export interface UserProfileResponse {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  bio?: string;
  address?: string;
  region?: string;
  socialLinks?: string;
  birthday?: string;
  gender?: string;
  province?: string;
  district?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// User Skill Response DTO
export interface UserSkillResponse {
  id: number;
  skillName: string;
  proficiencyLevel: string;
  yearsOfExperience?: number;
  description?: string;
  certifications?: string[];
}

// Location DTOs (for province/district)
export interface Province {
  code: string;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
}

export interface District {
  code: string;
  name: string;
  codename: string;
  division_type: string;
  short_codename: string;
  province_code: string;
}