// Portfolio Service DTOs - mapping from backend Java DTOs to TypeScript interfaces

export interface UserProfileDTO {
  // Primary key
  userId: number;
  
  // ===== BASIC PROFILE INFO (from user_service.UserProfile) =====
  fullName?: string;
  email?: string;
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
  workExperiences?: PortfolioWorkExperienceDTO[];
  educationHistory?: PortfolioEducationDTO[];
  
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

  // Achievements (JSON array - for mentor accounts)
  achievements?: string; // JSON array: ["Best Mentor 2024", "Top Rated"]

  // Owner role for frontend tab visibility
  primaryRole?: string; // MENTOR, USER, RECRUITER, ADMIN

  // Roadmap mentoring price (for mentor accounts)
  roadmapMentoringPrice?: number;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioWorkExperienceDTO {
  id?: string;
  companyName?: string;
  position?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  currentJob?: boolean;
  description?: string;
}

export interface PortfolioEducationDTO {
  id?: string;
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  description?: string;
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
  includeCompletedMissions?: boolean;
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

// ==================== SYSTEM CERTIFICATE TYPES (AUTO-IMPORT) ====================

export interface SystemCertificateDTO {
  id: number;
  source: 'COURSE' | 'BADGE' | 'EXTERNAL';
  title: string;
  issuer: string;
  issueDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  category?: string;
  skills?: string[];
  imageUrl?: string;
  badgeKey?: string;
  badgeRarity?: string;
  imported: boolean;
}

// ==================== COMPLETED MISSION TYPES (SHORT-TERM JOBS) ====================

export interface CompletedMissionDTO {
  applicationId: number;
  jobId?: number;
  jobTitle: string;
  jobDescription?: string;
  recruiterName: string;
  recruiterAvatar?: string;
  recruiterCompanyName?: string;
  budget?: number;
  currency?: string;
  deadline?: string;
  estimatedDuration?: string;
  isRemote?: boolean;
  location?: string;
  requiredSkills?: string[];
  paymentMethod?: string;
  completedAt?: string;
  rating?: number;
  reviewComment?: string;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  deliverables?: DeliverableInfo[];
  status: 'COMPLETED' | 'PAID';
  workNote?: string;
}

export interface DeliverableInfo {
  fileName: string;
  fileUrl: string;
  type?: string;
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
  location?: string;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  isAvailable?: boolean;
  hasPortfolio?: boolean;
  isVerified?: boolean;
  isPremium?: boolean;
  hasCertificates?: boolean;
  hasRelevantProjects?: boolean;
  hasCompletedMissions?: boolean;
  mustMatchPrimarySkill?: boolean;
  minOverallScore?: number;
  minSkillFit?: number;
  openToOffers?: boolean;
  enableAIMatching?: boolean;
  jobId?: number; // For long-term job matching
  shortTermJobId?: number; // For short-term job (gig/freelance) matching
}

export interface CandidateFitComponentScore {
  key: string;
  label: string;
  score: number;
  weight: number;
  weightedScore?: number;
  explanation?: string;
}

export interface CandidateSkillBreakdown {
  skill: string;
  primary?: boolean;
  required?: boolean;
  matched?: boolean;
  matchType?: string;
  relevanceScore?: number;
  confidenceScore?: number;
  evidenceSources?: string[];
}

export interface CandidateEvidenceHighlight {
  type: string;
  title: string;
  relevanceScore?: number;
  matchedSkills?: string[];
}

export interface CandidateMissingRequirement {
  skill: string;
  severity?: string;
  suggestion?: string;
}

export interface CandidateFitAnalysis {
  overallScore: number;
  band?: string;
  recommendation?: string;
  confidenceScore?: number;
  riskPenalty?: number;
  components?: CandidateFitComponentScore[];
  skillBreakdown?: CandidateSkillBreakdown[];
  evidenceHighlights?: CandidateEvidenceHighlight[];
  missingRequirements?: CandidateMissingRequirement[];
  riskFlags?: string[];
  interviewQuestions?: string[];
  nextActions?: string[];
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
  yearsOfExperience?: number;
  location?: string;
  availabilityStatus?: string;
  matchScore?: number;
  skillMatchPercent?: number;
  matchQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  primarySkillMatch?: boolean;
  skillMatchScore?: number;
  projectMatchScore?: number;
  certMatchScore?: number;
  missionMatchScore?: number;
  experienceMatchScore?: number;
  evidenceMatchScore?: number;
  deliveryMatchScore?: number;
  logisticsMatchScore?: number;
  confidenceMatchScore?: number;
  riskPenaltyScore?: number;
  // Detailed breakdown context
  matchedSkills?: string[];
  unmatchedSkills?: string[];
  totalRequiredSkills?: number;
  totalCandidateSkills?: number;
  completedMissionsCount?: number;
  totalCertificatesCount?: number;
  totalVerifiedSkillsCount?: number;
  relevantProjectsCount?: number;
  relevantCertificatesCount?: number;
  relevantMissionsCount?: number;
  averageMissionRating?: number;
  fitExplanation?: string;
  fitAnalysis?: CandidateFitAnalysis;
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
  fitSummary: string;
  skillSignals: SkillSignal[];
  reasoning: string;
  confidenceScore: number;
  matchQuality: MatchQuality;
  modelUsed?: string;
  processingTimeMs?: number;
  isFallback?: boolean;
}

export interface SkillSignal {
  skill: string;
  evidence: string;
  isRequired: boolean;
  relevanceScore: number;
}

export type MatchQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

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

// AI-Enhanced Analysis Response (combines deterministic scores + AI reasoning)
export interface AiEnhancedAnalysisResponse {
  deterministicScores: CandidateSearchResult;
  verdict: 'STRONG_ACCEPT' | 'ACCEPT' | 'CONSIDER' | 'WEAK' | 'RISKY' | 'REJECT';
  recommendation: string;
  matchScore: number;
  primarySkillMatch: boolean;
  aiAnalysis?: {
    fitSummary?: string;
    reasoning?: string;
    confidenceScore?: number;
    matchQuality?: string;
    skillSignals?: Array<{
      skill: string;
      evidence?: string;
      isRequired?: boolean;
      relevanceScore: number;
    }>;
    modelUsed?: string;
    processingTimeMs?: number;
    isFallback?: boolean;
  };
  aiError?: string;
}
