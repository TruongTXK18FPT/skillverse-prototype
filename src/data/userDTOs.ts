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

// Mentor Registration Request DTO
export interface MentorRegistrationRequest {
  fullName: string;
  email: string;
  linkedinProfile: string;
  mainExpertise: string;
  yearsOfExperience: number;
  personalBio: string;
  password: string;
  confirmPassword: string;
  // File uploads will be handled separately in FormData
}

// Mentor Registration Response DTO
export interface MentorRegistrationResponse extends BaseRegistrationResponse {
  mentorId: number;
  applicationStatus: string;
}

// Business Registration Request DTO
export interface BusinessRegistrationRequest {
  companyName: string;
  businessEmail: string;
  companyWebsite: string;
  businessAddress: string;
  taxId: string;
  password: string;
  confirmPassword: string;
  // Contact Person Information
  contactPersonName: string; // Full name of contact person
  contactPersonPhone?: string; // Optional phone number
  contactPersonPosition: string; // Position/Title (CEO, HR Manager, etc.)
  // Company Extended Information
  companySize: string; // Company size range (1-10, 11-50, 51-200, 200+)
  industry: string; // Industry/Sector (IT, Education, Healthcare, etc.)
  // File uploads will be handled separately in FormData
}

// Business Registration Response DTO
export interface BusinessRegistrationResponse extends BaseRegistrationResponse {
  businessId: number;
  applicationStatus: string;
}

// Mentor Profile Response DTO
export interface MentorProfileResponse {
  id: number;
  email: string;
  fullName: string;
  linkedinProfile: string;
  mainExpertise: string;
  yearsOfExperience: number;
  personalBio: string;
  applicationStatus: string;
  isActive: boolean;
  emailVerified: boolean;
  cvFileUrl?: string;
  certificationFileUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

// Business Profile Response DTO
export interface BusinessProfileResponse {
  id: number;
  companyName: string;
  businessEmail: string;
  companyWebsite: string;
  businessAddress: string;
  taxId: string;
  applicationStatus: string;
  isActive: boolean;
  emailVerified: boolean;
  documentFileUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

// Application Status Response DTO
export interface ApplicationStatusResponse {
  applicationStatus: string;
  statusMessage: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewerComments?: string;
}