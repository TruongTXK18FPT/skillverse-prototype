// ============================================================
// Common pagination wrapper
// ============================================================
export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// ============================================================
// Question Bank DTOs — mirrors backend request/response types
// ============================================================

export interface QuestionBankSummary {
  id: number;
  domain: string;
  industry?: string;
  jobRole?: string;
  skillName?: string;
  title: string;
  activeQuestionCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface QuestionBankDetail extends QuestionBankSummary {
  description?: string;
  difficultyDistribution: string;
  updatedAt: string;
  difficultyBreakdown: Record<string, number>;
}

export interface CreateQuestionBank {
  domain: string;
  industry?: string;
  jobRole?: string;
  skillName?: string;
  title: string;
  description?: string;
  difficultyDistribution?: string;
}

export interface UpdateQuestionBank {
  title?: string;
  description?: string;
  industry?: string;
  jobRole?: string;
  skillName?: string;
  difficultyDistribution?: string;
  isActive?: boolean;
}

export interface QuestionResponse {
  id: number;
  bankId: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  skillArea?: string;
  category?: string;
  source?: string;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  skillArea?: string;
  category?: string;
}

export interface UpdateQuestion {
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: string;
  skillArea?: string;
  category?: string;
  isActive?: boolean;
}

export interface QuestionImportItem {
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: string;
  skillArea?: string;
  category?: string;
  lineNumber?: number;
  errors?: string[];
  valid: boolean;
}

export interface ImportPreview {
  questions: QuestionImportItem[];
}

export interface ImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  savedCount: number;
  savedIndices: number[];
  message: string;
}

export interface AiDraftQuestion {
  draftId: number;
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: string;
  skillArea?: string;
  category?: string;
  edited: boolean;
}

export interface AiDraftResponse {
  drafts: AiDraftQuestion[];
  totalGenerated: number;
}

export interface AiGenerateDraftRequest {
  questionCount?: number;
  difficultyDistribution?: Record<string, number>;
  focusSkillAreas?: string[];
}

export interface BulkAddQuestions {
  questions: CreateQuestion[];
  source?: string;
}

export type QuestionBankSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type QuestionBankSubmissionSource = 'MANUAL' | 'JSON_IMPORT';

export interface QuestionBankSubmissionQuestion {
  id?: number;
  displayOrder?: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  skillArea?: string;
  category?: string;
}

export interface CreateQuestionBankSubmission {
  domain: string;
  industry: string;
  jobRole: string;
  skillName: string;
  title?: string;
  description?: string;
  difficultyDistribution?: string;
  source: QuestionBankSubmissionSource;
  questions: CreateQuestion[];
}

export interface ReviewQuestionBankSubmission {
  approved: boolean;
  reviewNote?: string;
}

export interface QuestionBankSubmission {
  id: number;
  mentorId: number;
  mentorName: string;
  mentorEmail: string;
  mentorAvatarUrl?: string;
  mentorPortfolioSlug?: string;
  domain: string;
  industry: string;
  jobRole: string;
  skillName: string;
  title: string;
  description?: string;
  difficultyDistribution?: string;
  status: QuestionBankSubmissionStatus;
  source: QuestionBankSubmissionSource;
  questionCount: number;
  savedQuestionCount: number;
  duplicateQuestionCount: number;
  resolvedQuestionBankId?: number;
  resolvedQuestionBankTitle?: string;
  reviewNote?: string;
  reviewedById?: number;
  reviewedByName?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  questions?: QuestionBankSubmissionQuestion[];
}
