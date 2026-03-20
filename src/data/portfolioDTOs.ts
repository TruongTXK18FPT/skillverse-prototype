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
  MICRO_JOB = 'MICRO_JOB',
  FREELANCE = 'FREELANCE',
  PERSONAL = 'PERSONAL',
  ACADEMIC = 'ACADEMIC',
  OPEN_SOURCE = 'OPEN_SOURCE',
  INTERNSHIP = 'INTERNSHIP',
  FULL_TIME = 'FULL_TIME',
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

export interface CandidateSummaryDTO {
  userId: number;
  fullName: string;
  professionalTitle?: string;
  avatarUrl?: string;
  customUrlSlug?: string;
  topSkills?: string; // JSON string
  isHighlighted?: boolean;
  hourlyRate?: number;
  preferredCurrency?: string;
  totalProjects?: number;
}

export interface FreelancerCardDisplay {
  id: number | string;
  name: string;
  skills: string[];
  rating: number;
  completedProjects: number;
  hourlyRate: number;
  avatar?: string;
  isHighlighted?: boolean;
  professionalTitle?: string;
  customUrlSlug?: string;
}

// ==================== CANDIDATE SEARCH TYPES ====================

export interface CandidateSearchFilters {
  query?: string;
  skills?: string[];
  experienceLevel?: string;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  isAvailable?: boolean;
  hasPortfolio?: boolean;
  isVerified?: boolean;
  isPremium?: boolean;
  hasCertificates?: boolean;
  openToOffers?: boolean;
  enableAIMatching?: boolean;
  jobId?: number; // For job-specific matching
}

export interface CandidateSearchResult {
  userId: number;
  fullName: string;
  professionalTitle?: string;
  avatarUrl?: string;
  customUrlSlug?: string;
  topSkills: string[] | string;
  isHighlighted?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
  hasPortfolio?: boolean;
  hourlyRate?: number;
  preferredCurrency?: string;
  totalProjects?: number;
  matchScore?: number;
  skillMatchPercent?: number;
  matchQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  fitExplanation?: string;
  aiSummary?: string;
  lastActive?: string;
  shortlistId?: number;
  shortlistStatus?: string;
  shortlistNotes?: string;
}

export interface CandidateSearchResponse {
  candidates: CandidateSearchResult[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AICandidateMatchResponse {
  candidateId: number;
  jobId: number;
  matchScore: number;
  skillMatchPercent: number;
  extractedSkills: string[];
  fitExplanation: string;
  reasoning: string;
  confidence: number;
  generatedAt: string;
}

// ==================== Recruitment Chat Types ====================

export enum RecruitmentSessionStatus {
  CONTACTED = 'CONTACTED',
  INTERESTED = 'INTERESTED',
  INVITED = 'INVITED',
  APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
  SCREENING = 'SCREENING',
  OFFER_SENT = 'OFFER_SENT',
  HIRED = 'HIRED',
  NOT_INTERESTED = 'NOT_INTERESTED',
  ARCHIVED = 'ARCHIVED'
}

export enum RecruitmentSessionSource {
  MANUAL = 'MANUAL',
  AI_SEARCH = 'AI_SEARCH',
  RECOMMENDATION = 'RECOMMENDATION',
  PROFILE_VIEW = 'PROFILE_VIEW',
  SHORTLIST = 'SHORTLIST'
}

export enum RecruitmentJobContextType {
  JOB_POSTING = 'JOB_POSTING',
  SHORT_TERM_JOB = 'SHORT_TERM_JOB',
}

export interface RecruitmentSessionResponse {
  id: number;
  recruiterId: number;
  recruiterName: string;
  recruiterAvatar?: string;
  recruiterCompany?: string;
  candidateId: number;
  candidateFullName: string;
  candidateTitle?: string;
  candidateAvatar?: string;
  candidateHasPortfolio?: boolean;
  candidateSlug?: string;
  jobId?: number;
  jobTitle?: string;
  jobContextType?: RecruitmentJobContextType;
  jobStatus?: string;
  isRemote?: boolean;
  jobLocation?: string;
  isChatAvailable?: boolean;
  chatDisabledReason?: string;
  status: RecruitmentSessionStatus;
  sourceType: RecruitmentSessionSource;
  matchScore?: number;
  skillMatchPercent?: number;
  unreadCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt?: string;
  lastMessagePreview?: string;
}

export interface RecruitmentMessageResponse {
  id: number;
  sessionId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'RECRUITER' | 'CANDIDATE';
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'GIF' | 'EMOJI' | 'SYSTEM';
  actionType?: string;
  actionData?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface CreateRecruitmentSessionRequest {
  candidateId: number;
  jobId?: number;
  jobContextType?: RecruitmentJobContextType;
  sourceType?: RecruitmentSessionSource;
  matchScore?: number;
  skillMatchPercent?: number;
  initialMessage?: string;
}

export interface SendRecruitmentMessageRequest {
  sessionId: number;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'GIF' | 'EMOJI';
  actionType?: string;
  actionData?: string;
}
