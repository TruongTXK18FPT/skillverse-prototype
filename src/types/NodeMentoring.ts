/**
 * [Nghiệp vụ] Types cho luồng node mentoring + final verification gate (V3 Phase 1).
 *
 * Convention mirrors `services/mentorVerificationService.ts`: union literals for
 * status, flat DTOs. No nested helper types.
 */

// ==================== Union literals ====================

export type AssignmentSource = 'SYSTEM_GENERATED' | 'MENTOR_REFINED';

export type NodeSubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REWORK_REQUESTED'
  | 'RESUBMITTED'
  | 'WITHDRAWN';

export type NodeVerificationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'VERIFIED';

export type NodeReviewResult = 'APPROVED' | 'REWORK_REQUESTED' | 'REJECTED';

export type NodeFinalVerificationStatus = 'VERIFIED' | 'REJECTED';

export type GateDecision = 'PASS' | 'FAIL' | 'PENDING';

export type FinalGateStatus = 'NOT_REQUIRED' | 'BLOCKED' | 'PASSED';

export type OutputAssessmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ==================== Assignment ====================

export interface NodeAssignmentResponse {
  id: number;
  journeyId: number;
  roadmapSessionId?: number;
  nodeId: string;
  nodeSkillId?: number;
  assignmentSource: AssignmentSource;
  title?: string;
  description?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UpsertNodeAssignmentRequest {
  title?: string;
  description?: string;
  nodeSkillId?: number;
  assignmentSource?: AssignmentSource;
}

// ==================== Evidence ====================

export interface SubmitNodeEvidenceRequest {
  submissionText: string;
  evidenceUrl?: string;
  attachmentUrl?: string;
}

export interface NodeReviewResponse {
  id: number;
  submissionId: number;
  mentorId: number;
  bookingId?: number;
  score?: number;
  feedback?: string;
  reviewResult: NodeReviewResult;
  reviewedAt: string;
}

export interface NodeVerificationResponseDto {
  id: number;
  submissionId: number;
  mentorId: number;
  bookingId?: number;
  nodeVerificationStatus: NodeFinalVerificationStatus;
  verificationNote?: string;
  verifiedAt: string;
}

export interface NodeEvidenceRecordResponse {
  id: number;
  journeyId: number;
  roadmapSessionId?: number;
  nodeId: string;
  assignmentId?: number;
  learnerId: number;
  submissionText: string;
  evidenceUrl?: string;
  attachmentUrl?: string;
  submissionStatus: NodeSubmissionStatus;
  verificationStatus: NodeVerificationStatus;
  mentorFeedback?: string;
  submittedAt: string;
  updatedAt?: string;
  latestReview?: NodeReviewResponse;
  latestVerification?: NodeVerificationResponseDto;
}

// ==================== Review / Verify (mentor) ====================

export interface ReviewNodeSubmissionRequest {
  reviewResult: NodeReviewResult;
  feedback?: string;
  score?: number;
  bookingId?: number;
}

export interface VerifyNodeRequest {
  nodeVerificationStatus: NodeFinalVerificationStatus;
  verificationNote?: string;
  bookingId?: number;
}

// ==================== Final verification gate ====================

export interface JourneyCompletionGateResponse {
  journeyId: number;
  finalGateStatus: FinalGateStatus;
  finalVerificationRequired: boolean;
  journeyOutputVerificationRequired: boolean;
  hasPassCompletionReport: boolean;
  outputAssessmentApproved: boolean;
  blockingReasons: string[];
}

export interface ConfirmJourneyCompletionRequest {
  gateDecision: GateDecision;
  completionNote?: string;
  bookingId?: number;
}

export interface JourneyCompletionReportResponse {
  id: number;
  journeyId: number;
  mentorId: number;
  bookingId?: number;
  gateDecision: GateDecision;
  completionNote?: string;
  confirmedAt: string;
}

export interface SubmitJourneyOutputAssessmentRequest {
  submissionText: string;
  evidenceUrl?: string;
  attachmentUrl?: string;
}

export interface AssessJourneyOutputRequest {
  assessmentStatus: OutputAssessmentStatus;
  feedback?: string;
  score?: number;
}

export interface JourneyOutputAssessmentResponse {
  id: number;
  journeyId: number;
  learnerId: number;
  mentorId?: number;
  submissionText?: string;
  evidenceUrl?: string;
  attachmentUrl?: string;
  score?: number;
  feedback?: string;
  assessmentStatus: OutputAssessmentStatus;
  submittedAt: string;
  assessedAt?: string;
}
