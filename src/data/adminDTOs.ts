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
