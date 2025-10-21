// Portfolio Service DTOs - mapping from backend Java DTOs to TypeScript interfaces

export interface UserProfileDTO {
  // Primary key
  userId: number;
  
  // ===== BASIC PROFILE INFO (from user_service.UserProfile) =====
  fullName?: string;
  basicBio?: string;
  phone?: string;
  address?: string;
  region?: string;
  avatarMediaId?: number;
  basicAvatarUrl?: string;
  companyId?: number;
  socialLinks?: string; // JSON string
  
  // ===== EXTENDED PORTFOLIO INFO (from portfolio_service.PortfolioExtendedProfile) =====
  professionalTitle?: string;
  careerGoals?: string;
  yearsOfExperience?: number;
  
  // Portfolio media (separate from basic profile avatar)
  portfolioAvatarUrl?: string;
  videoIntroUrl?: string;
  coverImageUrl?: string;
  
  // Professional links
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioWebsiteUrl?: string;
  behanceUrl?: string;
  dribbbleUrl?: string;
  
  // Additional portfolio info
  tagline?: string;
  location?: string;
  availabilityStatus?: string;
  hourlyRate?: number;
  preferredCurrency?: string;
  
  // Skills and languages (JSON arrays as strings)
  topSkills?: string; // JSON: ["Java", "React"]
  languagesSpoken?: string; // JSON: ["Vietnamese", "English"]
  
  // Portfolio settings
  isPublic?: boolean;
  showContactInfo?: boolean;
  allowJobOffers?: boolean;
  themePreference?: string;
  
  // Portfolio stats
  portfolioViews?: number;
  totalProjects?: number;
  totalCertificates?: number;
  
  // SEO
  customUrlSlug?: string;
  metaDescription?: string;
  keywords?: string; // JSON array
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export enum ProjectType {
  MICROJOB = 'MICROJOB',
  FREELANCE = 'FREELANCE',
  PERSONAL = 'PERSONAL',
  ACADEMIC = 'ACADEMIC',
  OPEN_SOURCE = 'OPEN_SOURCE'
}

export interface ProjectAttachmentDTO {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export interface PortfolioProjectDTO {
  id?: number;
  userId?: number;
  title: string;
  description: string;
  clientName?: string;
  projectType: ProjectType;
  duration?: string;
  completionDate?: string;
  tools?: string[];
  outcomes?: string[];
  rating?: number;
  clientFeedback?: string;
  projectUrl?: string;
  githubUrl?: string;
  thumbnailUrl?: string;
  attachments?: ProjectAttachmentDTO[];
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum CertificateCategory {
  TECHNICAL = 'TECHNICAL',
  DESIGN = 'DESIGN',
  BUSINESS = 'BUSINESS',
  SOFT_SKILLS = 'SOFT_SKILLS',
  LANGUAGE = 'LANGUAGE',
  OTHER = 'OTHER'
}

export interface ExternalCertificateDTO {
  id?: number;
  userId?: number;
  title: string;
  issuingOrganization: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  certificateImageUrl?: string;
  skills?: string[];
  category?: CertificateCategory;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MentorReviewDTO {
  id?: number;
  userId?: number;
  mentorId?: number;
  mentorName: string;
  mentorTitle?: string;
  mentorAvatarUrl?: string;
  feedback: string;
  skillEndorsed?: string;
  rating?: number;
  isVerified?: boolean;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneratedCVDTO {
  id?: number;
  userId?: number;
  cvContent: string;
  cvJson?: string;
  templateName: string;
  isActive?: boolean;
  version?: number;
  generatedByAi?: boolean;
  pdfUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CVGenerationRequest {
  templateName: string; // PROFESSIONAL, CREATIVE, MINIMAL, MODERN
  targetRole?: string;
  targetIndustry?: string;
  additionalInstructions?: string;
  includeProjects?: boolean;
  includeCertificates?: boolean;
  includeReviews?: boolean;
}

// Helper types for form data
export interface CreateExtendedProfileForm {
  profile: Partial<UserProfileDTO>;
  avatar?: File;
  video?: File;
  coverImage?: File;
}

export interface UpdateExtendedProfileForm {
  profile: Partial<UserProfileDTO>;
  avatar?: File;
  video?: File;
  coverImage?: File;
}

export interface CreateProjectForm {
  project: PortfolioProjectDTO;
  thumbnail?: File;
}

export interface UpdateProjectForm {
  project: PortfolioProjectDTO;
  thumbnail?: File;
}

export interface CreateCertificateForm {
  certificate: ExternalCertificateDTO;
  image?: File;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface CheckExtendedProfileResponse {
  success: boolean;
  hasExtendedProfile: boolean;
}
