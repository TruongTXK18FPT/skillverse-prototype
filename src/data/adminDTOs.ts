/**
 * Admin DTOs for managing mentor and recruiter applications
 */

// ==================== REQUEST DTOs ====================

export interface ApplicationActionRequest {
  userId: number;
  applicationType: 'MENTOR' | 'RECRUITER';
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string; // Required if action is REJECT
}

// ==================== RESPONSE DTOs ====================

export interface AdminApprovalResponse {
  success: boolean;
  message: string;
  userId?: number;
  applicationType?: string;
  action?: string;
  processedBy?: number;
  processedAt?: string;
}

export interface MentorApplicationDto {
  userId: number;
  fullName: string;
  email: string;
  mainExpertiseArea: string;
  yearsOfExperience: number;
  personalProfile: string;
  linkedinProfile?: string;
  cvPortfolioUrl?: string;
  certificatesUrl?: string;
  certificateUrls?: string[];
  applicationStatus: ApplicationStatus;
  isEmailVerified: boolean;
  userStatus: string;
  applicationDate: string;
  approvalDate?: string;
  rejectionReason?: string;
}

export interface RecruiterApplicationDto {
  userId: number;
  fullName: string;
  email: string;
  companyName: string;
  companyWebsite?: string;
  companyAddress?: string;
  taxCodeOrBusinessRegistrationNumber?: string;
  companyDocumentsUrl?: string;
  applicationStatus: ApplicationStatus;
  isEmailVerified: boolean;
  userStatus: string;
  applicationDate: string;
  approvalDate?: string;
  rejectionReason?: string;
  contactPersonPhone?: string;
  contactPersonPosition?: string;
  companySize?: string;
  industry?: string;
}

export interface ApplicationStatusStatsDto {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  mentorPending: number;
  mentorApproved: number;
  mentorRejected: number;
  recruiterPending: number;
  recruiterApproved: number;
  recruiterRejected: number;
}

export interface ApplicationsResponse {
  mentorApplications: MentorApplicationDto[];
  recruiterApplications: RecruiterApplicationDto[];
  totalApplications: number;
  filterStatus: string;
  statusStats: ApplicationStatusStatsDto;
}

// ==================== ENUMS ====================

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export type ApplicationStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

// ==================== SHORT-TERM JOB ADMIN TYPES ====================

export interface AdminJobStats {
  totalJobs: number;
  draftCount: number;
  pendingApprovalCount: number;
  publishedCount: number;
  inProgressCount: number;
  completedCount: number;
  paidCount: number;
  cancelledCount: number;
  disputedCount: number;
  escalatedCount: number;
  closedCount: number;
  rejectedCount: number;
  byStatus: Record<string, number>;
  byUrgency: Record<string, number>;
  totalPlatformEarnings: number;
  totalRecruiterEarnings: number;
  totalEscrowVolume: number;
  activeEscrows: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ResolveDisputeRequest {
  resolution: DisputeResolution;
  partialRefundPct?: number;
  resolutionNotes?: string;
}

export type DisputeResolution =
  | 'CANCEL_JOB'
  | 'FULL_REFUND'
  | 'FULL_RELEASE'
  | 'PARTIAL_REFUND'
  | 'PARTIAL_RELEASE'
  | 'RESUBMIT_REQUIRED'
  | 'NO_ACTION'
  | 'WORKER_WINS'
  | 'WORKER_PARTIAL'
  | 'RECRUITER_WINS'
  | 'RECRUITER_WARNING';

export interface DisputeResponse {
  id: number;
  jobId: number;
  applicationId?: number;
  initiatorId: number;
  initiatorName?: string;
  respondentId: number;
  respondentName?: string;
  disputeType: string;
  reason: string;
  status: DisputeStatus;
  resolution?: DisputeResolution;
  partialRefundPct?: number;
  resolutionNotes?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  createdAt: string;
}

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'AWAITING_RESPONSE'
  | 'RESOLVED'
  | 'DISMISSED'
  | 'ESCALATED';
