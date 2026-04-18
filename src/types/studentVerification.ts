export type StudentVerificationStatus =
  | "EMAIL_OTP_PENDING"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export interface StudentVerificationStartResponse {
  requestId: number;
  status: StudentVerificationStatus;
  otpExpiresAt?: string | null;
  message: string;
}

export interface StudentVerificationEligibilityResponse {
  approved: boolean;
  canBuyStudentPremium: boolean;
  message: string;
  lastApprovedAt?: string | null;
}

export interface StudentVerificationDetailResponse {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  schoolEmail: string;
  schoolDomain: string;
  emailDomainValid: boolean;
  status: StudentVerificationStatus;
  otpExpiresAt?: string | null;
  otpVerifiedAt?: string | null;
  imageUrl?: string | null;
  uploadedFileName?: string | null;
  uploadedContentType?: string | null;
  uploadedFileSize?: number | null;
  reviewNote?: string | null;
  rejectionReason?: string | null;
  reviewedById?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
