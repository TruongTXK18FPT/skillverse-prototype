export enum AiKnowledgeUseCase {
  CHATBOT_GLOBAL = 'CHATBOT_GLOBAL',
  ROADMAP_SKILL = 'ROADMAP_SKILL',
  GRADING_ASSIGNMENT = 'GRADING_ASSIGNMENT',
  GRADING_MODULE = 'GRADING_MODULE',
  GRADING_COURSE = 'GRADING_COURSE'
}

export enum AiKnowledgeApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum AiKnowledgeIngestionStatus {
  NOT_INGESTED = 'NOT_INGESTED',
  INDEXED = 'INDEXED',
  FAILED = 'FAILED'
}

export interface SpringPageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface AiKnowledgeDocumentListItemResponse {
  id: number;
  title: string;
  description?: string | null;
  useCase: AiKnowledgeUseCase;
  approvalStatus: AiKnowledgeApprovalStatus;
  ingestionStatus: AiKnowledgeIngestionStatus;
  uploadedByUserId: number;
  mentorId?: number | null;
  skillName?: string | null;
  skillSlug?: string | null;
  courseId?: number | null;
  moduleId?: number | null;
  assignmentId?: number | null;
  docType?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  originalFileName?: string | null;
  storageUrl?: string | null;
  reviewNote?: string | null;
  approvedAt?: string | null;
  indexedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiKnowledgeDocumentDetailResponse {
  id: number;
  title: string;
  description?: string | null;
  useCase: AiKnowledgeUseCase;
  approvalStatus: AiKnowledgeApprovalStatus;
  ingestionStatus: AiKnowledgeIngestionStatus;
  uploadedByUserId: number;
  approvedByUserId?: number | null;
  mentorId?: number | null;
  skillName?: string | null;
  skillSlug?: string | null;
  industry?: string | null;
  level?: string | null;
  courseId?: number | null;
  moduleId?: number | null;
  assignmentId?: number | null;
  docType?: string | null;
  ragDocId?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  originalFileName?: string | null;
  storageFolder?: string | null;
  storageUrl?: string | null;
  extractedText?: string | null;
  extractError?: string | null;
  reviewNote?: string | null;
  approvedAt?: string | null;
  indexedAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminChatbotKnowledgeUploadRequest {
  file: File;
  title: string;
  description?: string;
  industry?: string;
  level?: string;
}

export interface AdminRoadmapKnowledgeUploadRequest {
  file: File;
  title: string;
  description?: string;
  skillName: string;
  industry?: string;
  level?: string;
}

export interface MentorRoadmapKnowledgeSubmissionRequest {
  file: File;
  title: string;
  description?: string;
  skillName: string;
  industry?: string;
  level?: string;
}

export interface MentorGradingKnowledgeSubmissionRequest {
  file: File;
  title: string;
  description?: string;
  courseId: number;
  moduleId?: number;
  assignmentId?: number;
}

export interface ReviewAiKnowledgeRequest {
  approved: boolean;
  reviewNote?: string;
}

export interface ListAdminAiKnowledgeDocumentsParams {
  useCase?: AiKnowledgeUseCase;
  approvalStatus?: AiKnowledgeApprovalStatus;
  ingestionStatus?: AiKnowledgeIngestionStatus;
  skillSlug?: string;
  courseId?: number;
  moduleId?: number;
  assignmentId?: number;
  page?: number;
  size?: number;
}

export interface ListMentorAiKnowledgeDocumentsParams {
  page?: number;
  size?: number;
}
