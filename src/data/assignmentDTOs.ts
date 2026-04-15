// Assignment DTOs - Matching Backend Structure

export enum SubmissionType {
  FILE = 'FILE',
  TEXT = 'TEXT',
  LINK = 'LINK'
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  GRADED = 'GRADED',
  LATE_PENDING = 'LATE_PENDING',
  AI_PENDING = 'AI_PENDING',      // AI grading in progress, waiting for mentor confirm
  AI_COMPLETED = 'AI_COMPLETED'    // AI graded, mentor confirmed (same as GRADED for display)
}

// Assignment Criteria DTO
export interface AssignmentCriteriaDTO {
  id?: number;
  clientId?: string;
  name: string;
  description: string;
  maxPoints: number;
  passingPoints?: number; // Coursera: min score to pass this criterion
  orderIndex: number;
  isRequired: boolean;
}

// Criteria Score DTO (for grading)
export interface CriteriaScoreDTO {
  id?: number;
  criteriaId: number;
  criteriaName?: string;
  score: number;
  maxPoints: number;
  passingPoints?: number; // Min score to pass this criterion
  passed?: boolean;       // Whether this criterion is passed
  feedback?: string;
}

// Assignment Detail DTO
export interface AssignmentDetailDTO {
  id: number;
  title: string;
  description: string;
  submissionType: SubmissionType;
  maxScore: number;
  passingScore?: number;
  dueAt?: string;
  moduleId: number;
  createdAt: string;
  updatedAt: string;
  isRequired?: boolean;
  learningOutcome?: string;
  gradingCriteria?: string;
  criteria?: AssignmentCriteriaDTO[];
  // AI Grading fields
  aiGradingEnabled?: boolean;
  aiGradingPrompt?: string;
  gradingStyle?: 'STANDARD' | 'STRICT' | 'LENIENT';
  trustAiEnabled?: boolean;
}

// Assignment Summary DTO
export interface AssignmentSummaryDTO {
  id: number;
  title: string;
  description: string;
  submissionType: SubmissionType;
  maxScore: number;
  orderIndex?: number;
  dueAt?: string;
  moduleId?: number;
}

// Assignment Create DTO
export interface AssignmentCreateDTO {
  title: string;
  description: string;
  submissionType: SubmissionType;
  maxScore: number;
  passingScore?: number;
  dueAt?: string;
  criteria?: AssignmentCriteriaDTO[];
  // AI Grading fields
  aiGradingEnabled?: boolean;
  aiGradingPrompt?: string;
  gradingStyle?: 'STANDARD' | 'STRICT' | 'LENIENT';
}

// Assignment Update DTO
export interface AssignmentUpdateDTO {
  title?: string;
  description?: string;
  submissionType?: SubmissionType;
  maxScore?: number;
  passingScore?: number;
  dueAt?: string;
  isRequired?: boolean;
  learningOutcome?: string;
  gradingCriteria?: string;
  criteria?: AssignmentCriteriaDTO[];
  // AI Grading fields
  aiGradingEnabled?: boolean;
  aiGradingPrompt?: string;
  gradingStyle?: 'STANDARD' | 'STRICT' | 'LENIENT';
}

// Assignment Submission Detail DTO - Updated with version tracking
export interface AssignmentSubmissionDetailDTO {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  userId: number;
  userName: string;
  submissionText?: string;
  linkUrl?: string;
  fileMediaId?: number;
  fileMediaUrl?: string;
  submittedAt: string;
  status: SubmissionStatus;
  score?: number;
  maxScore: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: number;
  gradedByName?: string;
  criteriaScores?: CriteriaScoreDTO[];
  // Version tracking (Coursera-style)
  attemptNumber: number;
  isNewest: boolean;
  isPrevious: boolean;
  isLate: boolean;
  // Criteria-based pass/fail (Coursera pattern)
  isPassed?: boolean;
  passingScore?: number;
  // AI Grading fields
  isAiGraded?: boolean;
  aiGradedAt?: string;
  aiScore?: number;
  aiFeedback?: string;
  aiConfidence?: number;
  mentorConfirmed?: boolean;
  aiGradeAttemptCount?: number;
  disputeFlag?: boolean;
  disputeAt?: string;
  disputeReason?: string;
}

// Assignment Submission Create DTO
export interface AssignmentSubmissionCreateDTO {
  submissionText?: string;
  linkUrl?: string;
  fileMediaId?: number;
  /** 'AI' = AI chấm tự động (default), 'MENTOR' = skip AI, vào mentor queue ngay */
  gradingMode?: 'AI' | 'MENTOR';
}

// Grade Assignment DTO
export interface GradeAssignmentDTO {
  submissionId: number;
  score: number;
  feedback?: string;
  criteriaScores?: CriteriaScoreDTO[];  // NEW: Grade by criteria
  /** When true, marks submission as AI-graded + mentor-confirmed (use when confirming AI pre-grade result). */
  isAiGrade?: boolean;
}

// Pending Submission Item DTO (batch endpoint for mentor dashboard)
export interface PendingSubmissionItemDTO {
  submission: AssignmentSubmissionDetailDTO;
  courseName: string;
  courseId: number;
  moduleName: string;
  moduleId: number;
  assignmentName: string;
}

export interface MentorSubmissionItemDTO {
  submission: AssignmentSubmissionDetailDTO;
  courseName: string;
  courseId: number;
  moduleName: string;
  moduleId: number;
  assignmentName: string;
  assignmentDueAt?: string;
}

// AI Grading DTOs

export interface AiGradingCriteriaScoreResultDTO {
  criteriaId: number;
  criteriaName: string;
  score: number;
  maxPoints: number;
  passingPoints: number;
  passed: boolean;
  feedback: string;
  confidence: number; // 0.0 - 1.0
}

export interface AiGradingResultDTO {
  criteriaScores: AiGradingCriteriaScoreResultDTO[];
  totalScore: number;
  overallFeedback: string;
  overallConfidence: number; // 0.0 - 1.0
}

// Assignment Update Result DTO (for warning modal)
export interface AssignmentUpdateResultDTO {
  assignment: AssignmentDetailDTO;
  gradedSubmissionCount: number;
  aiPendingSubmissionCount: number;
  pendingSubmissionCount: number;
}

// AI Grading Stats DTO (Admin dashboard)
export interface AiGradingStatsDTO {
  totalAiGraded: number;
  confirmed: number;
  pending: number;
  disputed: number;
  totalAttempts: number;
  lowConfidenceCount: number;
  averageScoreDelta: number;
  comparedSubmissionsCount: number;
}

export interface AdminAiGovernanceStatsDTO {
  aiEnabledAssignments: number;
  trustAiAssignments: number;
  customPromptAssignments: number;
  strictAssignments: number;
  lenientAssignments: number;
  riskyTrustAssignments: number;
}

export interface AdminAiAssignmentConfigDTO {
  assignmentId: number;
  assignmentTitle: string;
  courseName: string;
  moduleName: string;
  mentorId?: number;
  mentorName?: string;
  submissionType?: SubmissionType;
  maxScore?: number;
  aiGradingEnabled?: boolean;
  trustAiEnabled?: boolean;
  gradingStyle?: 'STANDARD' | 'STRICT' | 'LENIENT' | string;
  hasCustomPrompt?: boolean;
  promptLength?: number;
  promptPreview?: string;
  aiGradedSubmissions: number;
  pendingMentorConfirmations: number;
  disputedSubmissions: number;
  lowConfidenceSubmissions: number;
  averageScoreDelta: number;
}

// Prompt Audit Log DTO (Admin dashboard)
export interface PromptAuditLogDTO {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  adminId: number;
  adminName: string;
  action: string;
  beforeValue: string | null;
  afterValue: string | null;
  createdAt: string;
}

// AI Submission DTO (Admin dashboard table) — field order matches BE AiSubmissionDTO exactly
export interface AiSubmissionDTO {
  submissionId: number;
  assignmentId: number;
  assignmentTitle: string;
  studentId: number;
  studentName?: string;
  mentorId?: number;
  mentorName?: string;
  aiScore?: number;
  actualScore?: number;
  aiConfidence?: number;
  mentorConfirmed?: boolean;
  isPassed?: boolean;
  disputeFlag?: boolean;
  aiGradedAt?: string;
  gradedAt?: string;
  submittedAt: string;
  courseName: string;
  moduleName: string;
  submissionType?: SubmissionType;
  assignmentMaxScore?: number;
  aiGradeAttemptCount?: number;
  aiFeedback?: string;
  mentorFeedback?: string;
  disputeReason?: string;
  scoreDelta?: number;
  passedCriteriaCount?: number;
  failedCriteriaCount?: number;
  criteriaScores?: CriteriaScoreDTO[];
  // Page metadata (Spring PageImpl serialization)
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}
