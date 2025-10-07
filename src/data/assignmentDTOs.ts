// Assignment DTOs - Matching Backend Structure

export enum SubmissionType {
  FILE = 'FILE',
  TEXT = 'TEXT',
  LINK = 'LINK'
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  GRADED = 'GRADED',
  LATE = 'LATE'
}

// Assignment Detail DTO
export interface AssignmentDetailDTO {
  id: number;
  title: string;
  description: string;
  submissionType: SubmissionType;
  maxScore: number;
  dueAt?: string;
  moduleId: number;
  createdAt: string;
  updatedAt: string;
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
  dueAt?: string;
}

// Assignment Update DTO
export interface AssignmentUpdateDTO {
  title?: string;
  description?: string;
  submissionType?: SubmissionType;
  maxScore?: number;
  dueAt?: string;
}

// Assignment Submission Detail DTO
export interface AssignmentSubmissionDetailDTO {
  id: number;
  assignmentId: number;
  studentId: number;
  studentName: string;
  submissionText?: string;
  submissionLink?: string;
  fileMediaId?: number;
  submittedAt: string;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: number;
}

// Assignment Submission Create DTO
export interface AssignmentSubmissionCreateDTO {
  assignmentId: number;
  submissionText?: string;
  submissionLink?: string;
  fileMediaId?: number;
}

// Grade Assignment DTO
export interface GradeAssignmentDTO {
  submissionId: number;
  score: number;
  feedback?: string;
}
