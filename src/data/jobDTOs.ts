// ==================== ENUMS ====================

export enum JobStatus {
  IN_PROGRESS = 'IN_PROGRESS', // Draft/private job
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Waiting for admin approval
  OPEN = 'OPEN',               // Public job accepting applications
  REJECTED = 'REJECTED',       // Rejected by admin
  CLOSED = 'CLOSED'            // No longer accepting applications
}

export enum JobApplicationStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEWED = 'INTERVIEWED',
  OFFER_SENT = 'OFFER_SENT',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED',
  AWAITING_ONBOARDING_INFO = 'AWAITING_ONBOARDING_INFO',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

// ==================== ENTITIES ====================

export interface JobPosting {
  id: number;
  title: string;
  description: string;
  requiredSkills: string[]; // JSON array from backend
  minBudget: number;
  maxBudget: number;
  deadline: string; // LocalDate as ISO string (YYYY-MM-DD)
  isRemote: boolean;
  location: string | null;
  status: JobStatus;
  applicantCount: number;
  recruiterProfile: {
    id: number;
    companyName: string;
    user: {
      email: string;
    };
  };
  createdAt: string; // LocalDateTime as ISO string
  updatedAt: string;
}

export interface JobApplication {
  id: number;
  jobPosting: {
    id: number;
    title: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  coverLetter: string | null;
  appliedAt: string; // LocalDateTime as ISO string
  status: JobApplicationStatus;
  acceptanceMessage: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  processedAt: string | null;
}

// ==================== REQUEST DTOs ====================

export interface CreateJobRequest {
  title: string;
  description: string;
  requiredSkills: string[]; // Array of skill names
  minBudget: number;
  maxBudget: number;
  deadline: string; // YYYY-MM-DD format
  isRemote: boolean;
  location?: string | null; // Required if isRemote = false
  // Enhanced fields
  experienceLevel?: string;
  jobType?: string;
  hiringQuantity?: number;
  benefits?: string;
  genderRequirement?: string;
  isNegotiable?: boolean;
  primarySkill?: string;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  requiredSkills?: string[];
  minBudget?: number;
  maxBudget?: number;
  deadline?: string;
  isRemote?: boolean;
  location?: string | null;
  // Enhanced fields
  experienceLevel?: string;
  jobType?: string;
  hiringQuantity?: number;
  benefits?: string;
  genderRequirement?: string;
  isNegotiable?: boolean;
  primarySkill?: string;
}

export interface ApplyJobRequest {
  coverLetter?: string | null; // Optional, max 1000 chars
}

export interface UpdateApplicationStatusRequest {
  status: JobApplicationStatus;
  acceptanceMessage?: string; // Required if status = ACCEPTED
  rejectionReason?: string;   // Required if status = REJECTED
  interviewResult?: string;    // Optional — interview notes when marking INTERVIEWED
  offerDetails?: string;       // Optional — offer letter content when sending OFFER_SENT
  // Recruiter's offer: structured salary + additional requirements
  offerSalary?: number;         // Offered salary amount (VND)
  offerAdditionalRequirements?: string; // Additional terms/benefits/conditions
  // Candidate's response
  candidateOfferResponse?: string; // Optional — candidate's counter-offer/acceptance when responding to OFFER_SENT
  // Candidate's counter-offer: structured salary + additional requirements
  counterSalaryAmount?: number;    // Counter salary amount requested by candidate
  counterAdditionalRequirements?: string; // Additional requirements from candidate
}

// ==================== RESPONSE DTOs ====================

export interface JobPostingResponse {
  id: number;
  title: string;
  description: string;
  requiredSkills: string[];
  minBudget: number;
  maxBudget: number;
  deadline: string; // YYYY-MM-DD
  isRemote: boolean;
  location: string | null;
  status: JobStatus;
  applicantCount: number;
  // Enhanced fields
  experienceLevel?: string;
  jobType?: string;
  hiringQuantity?: number;
  benefits?: string;
  genderRequirement?: string;
  isNegotiable?: boolean;
  primarySkill?: string;

  // Recruiter information
  recruiterCompanyName: string; // From nested RecruiterProfile
  recruiterCompanyLogoUrl?: string;
  recruiterEmail: string;       // From nested User
  recruiterUserId: number;      // For checking if current user owns this job
  createdAt: string;            // ISO datetime string
  updatedAt: string;
}

export interface JobApplicationResponse {
  id: number;
  jobId: number;
  jobTitle: string;
  userId: number;
  userFullName: string; // firstName + lastName concatenated
  userEmail: string;
  userAvatar?: string;
  userProfessionalTitle?: string;
  coverLetter: string | null;
  status: JobApplicationStatus;
  appliedAt: string;
  reviewedAt: string | null;
  processedAt: string | null;
  acceptanceMessage: string | null;
  rejectionReason: string | null;
  interviewResult: string | null; // Interview notes after INTERVIEWED status
  // Offer letter fields (for negotiable jobs)
  offerDetails: string | null; // Recruiter's offer details when status = OFFER_SENT
  offerSalary: number | null; // Recruiter's offered salary amount (VND)
  offerAdditionalRequirements: string | null; // Recruiter's additional terms/benefits
  candidateOfferResponse: string | null; // Candidate's counter-offer/acceptance when responding to offer
  counterSalaryAmount: number | null; // Candidate's counter salary amount (VND)
  counterAdditionalRequirements: string | null; // Candidate's additional requirements
  offerRound: number | null; // Current offer round: 1 = first offer, 2 = second (final) offer, 0/null = no offer sent yet
  // Job details for user's application view
  recruiterCompanyName: string;
  minBudget: number;
  maxBudget: number;
  isRemote: boolean;
  location: string | null;
  isNegotiable?: boolean; // Whether the job has negotiable salary
  isHighlighted?: boolean;
  portfolioSlug?: string; // Added for linking to portfolio
  // Contract link
  contractId?: number;
  contractStatus?: string;
}

// ==================== HELPER TYPES ====================

export interface JobFilters {
  search?: string;       // Search in title/description
  skills?: string[];     // Filter by required skills
  minBudget?: number;
  maxBudget?: number;
  isRemote?: boolean;
  status?: JobStatus;
}

export interface ApplicationFilters {
  status?: JobApplicationStatus;
  jobId?: number;
}

// ==================== JOB BOOST TYPES ====================

export enum JobBoostStatus {
  NOT_BOOSTED = "NOT_BOOSTED",
  ACTIVE = "ACTIVE",
  SCHEDULED = "SCHEDULED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED"
}

export interface JobBoostResponse {
  id: number;
  jobId: number;
  jobTitle: string;
  recruiterId: number;
  status: JobBoostStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  // Analytics
  impressions: number;
  clicks: number;
  applications: number;
}

export interface CreateJobBoostRequest {
  jobId: number;
  durationDays: number;
  startDate?: string; // ISO date string for scheduled boost
}

export interface JobBoostQuotaResponse {
  totalQuota: number;
  usedQuota: number;
  availableQuota: number;
}

export interface JobBoostAnalyticsResponse {
  boostId: number;
  jobId: number;
  jobTitle: string;
  status: JobBoostStatus;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  applications: number;
  ctr: number; // Click-through rate
  conversionRate: number;
}

// Extended JobPostingResponse with boost info for display
export interface JobPostingWithBoost extends JobPostingResponse {
  isBoosted: boolean;
  boostStatus?: JobBoostStatus;
  boostEndDate?: string;
}
