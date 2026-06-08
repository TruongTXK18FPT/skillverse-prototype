/**
 * [Nghiệp vụ] Types cho luồng node mentoring + final verification gate (V3 Phase 1).
 *
 * Convention mirrors `services/mentorVerificationService.ts`: union literals for
 * status, flat DTOs. No nested helper types.
 */

// ==================== Union literals ====================

export type AssignmentSource = 'SYSTEM_GENERATED' | 'MENTOR_REFINED' | 'TEMPLATE';

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

export interface GradingCriterion {
  id: string;
  title: string;
  maxScore: number;
}

export type AssignmentVerificationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUESTED';

export interface NodeAssignmentResponse {
  id: number;
  journeyId: number;
  roadmapSessionId?: number;
  nodeId: string;
  nodeSkillId?: number;
  assignmentSource: AssignmentSource;
  title?: string;
  description?: string;
  expectedOutput?: string;
  rubric?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt?: string;
  criteria?: GradingCriterion[];
  verificationStatus?: AssignmentVerificationStatus;
}

export interface UpsertNodeAssignmentRequest {
  title?: string;
  description?: string;
  nodeSkillId?: number;
  assignmentSource?: AssignmentSource;
  criteria?: GradingCriterion[];
  expectedOutput?: string;
  rubric?: string;
}

// ==================== Evidence ====================

export interface SubmitNodeEvidenceRequest {
  submissionText: string;
  evidenceUrl?: string;
  attachmentUrl?: string;
}

export interface GradingCriterionScore {
  criterionId: string;
  title: string;
  score: number;
  maxScore: number;
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
  criteriaScores?: GradingCriterionScore[];
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
  learnerMarkedComplete?: boolean;
  roadmapProgressStatus?: string;
  /** True when an active mentor booking covers this node. FE uses this to choose UI path. */
  hasMentorCoverage?: boolean;
  latestReview?: NodeReviewResponse;
  latestVerification?: NodeVerificationResponseDto;
  latestAiReviewId?: number;
  latestAiReviewStatus?: 'PENDING' | 'PASSED' | 'FAILED' | 'NEEDS_ADMIN_REVIEW';
}

// ==================== Review / Verify (mentor) ====================

export interface ReviewNodeSubmissionRequest {
  reviewResult: NodeReviewResult;
  feedback?: string;
  score?: number;
  bookingId?: number;
  criteriaScores?: GradingCriterionScore[];
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
  finalAssignmentInstructions?: string;
  finalAssignmentRubric?: string;
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
  latestAiReviewId?: number;
  latestAiReviewStatus?: 'PENDING' | 'PASSED' | 'FAILED' | 'NEEDS_ADMIN_REVIEW';
}

// ==================== V3 Phase 2: ROADMAP_MENTORING ====================

export type BookingType = 'GENERAL' | 'NODE_MENTORING' | 'JOURNEY_MENTORING' | 'ROADMAP_MENTORING';

export interface SubmitEvidenceReportRequest {
  summaryReport: string;
  assignmentsGiven?: string[];
  meetingDurationMinutes?: number;
  gateDecision: GateDecision;
  weakNodeIds?: string[];
  failReason?: string;
}

export interface VerificationEvidenceReportResponse {
  id: number;
  journeyId: number;
  bookingId: number;
  mentorId: number;
  meetingJitsiLink?: string;
  meetingDurationMinutes?: number;
  summaryReport: string;
  assignmentsGiven?: string[];
  weakNodeIds?: string[];
  failReason?: string;
  gateDecision: GateDecision;
  attemptNumber: number;
  submittedAt: string;
}

export interface UserVerifiedSkillDTO {
  id: number;
  skillName: string;
  skillLevel?: string;
  verifiedByMentorId: number;
  verifiedByMentorName?: string;
  journeyId?: number;
  bookingId?: number;
  verificationNote?: string;
  featuredOrder?: number;
  verifiedAt: string;
}
