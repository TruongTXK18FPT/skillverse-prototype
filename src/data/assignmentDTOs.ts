// Assignment DTOs - Matching Backend Structure

export enum SubmissionType {
  FILE = 'FILE',
  TEXT = 'TEXT',
  LINK = 'LINK'
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  GRADED = 'GRADED',
  LATE_PENDING = 'LATE_PENDING'
}

// Assignment Criteria DTO
export interface AssignmentCriteriaDTO {
  id?: number;
  clientId?: string;
  name: string;
  description: string;
  maxPoints: number;
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
  feedback?: string;
}

// Assignment Detail DTO
export interface AssignmentDetailDTO {
  id: number;
  title: string;
  description: string;
  submissionType: SubmissionType;
  maxScore: number;
  passingScore?: number;  // NEW: Minimum score to pass
  dueAt?: string;
  moduleId: number;
  createdAt: string;
  updatedAt: string;
  isRequired?: boolean;
  learningOutcome?: string;
  gradingCriteria?: string;
  criteria?: AssignmentCriteriaDTO[];  // NEW: Grading criteria list
}

// Assignment Summary DTO
export interface AssignmentSummaryDTO {
  id: number;
  title: string;
  description: string;
  submissionType: SubmissionType;
  maxScore: number;
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
  criteria?: AssignmentCriteriaDTO[];  // NEW: Include criteria when creating
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
}

// Assignment Submission Detail DTO - Updated with version tracking
export interface AssignmentSubmissionDetailDTO {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  userId: number;  // Changed from studentId to match backend
  userName: string;  // Changed from studentName to match backend
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
  criteriaScores?: CriteriaScoreDTO[];  // NEW: Detailed criteria scores
  // Version tracking (Coursera-style)
  attemptNumber: number;
  isNewest: boolean;
  isPrevious: boolean;
  isLate: boolean;
}

// Assignment Submission Create DTO
export interface AssignmentSubmissionCreateDTO {
  submissionText?: string;
  linkUrl?: string;
  fileMediaId?: number;
}

// Grade Assignment DTO
export interface GradeAssignmentDTO {
  submissionId: number;
  score: number;
  feedback?: string;
  criteriaScores?: CriteriaScoreDTO[];  // NEW: Grade by criteria
}
