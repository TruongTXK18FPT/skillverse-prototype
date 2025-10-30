// ==================== ENUMS ====================

export enum JobStatus {
  IN_PROGRESS = 'IN_PROGRESS', // Draft/private job
  OPEN = 'OPEN',               // Public job accepting applications
  CLOSED = 'CLOSED'            // No longer accepting applications
}

export enum JobApplicationStatus {
  PENDING = 'PENDING',     // Application submitted, not yet reviewed
  REVIEWED = 'REVIEWED',   // Recruiter has reviewed
  ACCEPTED = 'ACCEPTED',   // Application accepted
  REJECTED = 'REJECTED'    // Application rejected
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
}

export interface ApplyJobRequest {
  coverLetter?: string | null; // Optional, max 1000 chars
}

export interface UpdateApplicationStatusRequest {
  status: JobApplicationStatus;
  acceptanceMessage?: string; // Required if status = ACCEPTED
  rejectionReason?: string;   // Required if status = REJECTED
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
  recruiterCompanyName: string; // From nested RecruiterProfile
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
  coverLetter: string | null;
  status: JobApplicationStatus;
  appliedAt: string;
  reviewedAt: string | null;
  processedAt: string | null;
  acceptanceMessage: string | null;
  rejectionReason: string | null;
  // Job details for user's application view
  recruiterCompanyName: string;
  minBudget: number;
  maxBudget: number;
  isRemote: boolean;
  location: string | null;
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
