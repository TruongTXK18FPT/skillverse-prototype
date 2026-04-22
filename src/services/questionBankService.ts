import axiosInstance from './axiosInstance';
import {
  QuestionBankSummary,
  QuestionBankDetail,
  CreateQuestionBank,
  UpdateQuestionBank,
  QuestionResponse,
  CreateQuestion,
  UpdateQuestion,
  ImportPreview,
  ImportResult,
  AiDraftResponse,
  AiGenerateDraftRequest,
  PaginatedResponse,
  CreateQuestionBankSubmission,
  QuestionBankSubmission,
  ReviewQuestionBankSubmission,
} from '../data/questionBankDTOs';

const BASE = '/api/v1/admin/question-banks';
const MENTOR_SUBMISSION_BASE = '/api/v1/mentor/question-bank-submissions';
const ADMIN_SUBMISSION_BASE = '/api/v1/admin/question-bank-submissions';

// ============================================================
// Bank CRUD
// ============================================================

export const createQuestionBank = async (data: CreateQuestionBank): Promise<QuestionBankDetail> => {
  const res = await axiosInstance.post<QuestionBankDetail>(BASE, data);
  return res.data;
};

export const getQuestionBanks = async (
  params?: { domain?: string; industry?: string; jobRole?: string; skillName?: string; page?: number; size?: number }
): Promise<PaginatedResponse<QuestionBankSummary>> => {
  const res = await axiosInstance.get<PaginatedResponse<QuestionBankSummary>>(BASE, { params });
  return res.data;
};

export const getQuestionBank = async (id: number): Promise<QuestionBankDetail> => {
  const res = await axiosInstance.get<QuestionBankDetail>(`${BASE}/${id}`);
  return res.data;
};

export const updateQuestionBank = async (id: number, data: UpdateQuestionBank): Promise<QuestionBankDetail> => {
  const res = await axiosInstance.put<QuestionBankDetail>(`${BASE}/${id}`, data);
  return res.data;
};

export const deleteQuestionBank = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${BASE}/${id}`);
};

// ============================================================
// Question CRUD
// ============================================================

export const addQuestion = async (bankId: number, data: CreateQuestion): Promise<QuestionResponse> => {
  const res = await axiosInstance.post<QuestionResponse>(`${BASE}/${bankId}/questions`, data);
  return res.data;
};

export const getQuestions = async (
  bankId: number,
  params?: { difficulty?: string; skillArea?: string; category?: string; page?: number; size?: number }
): Promise<PaginatedResponse<QuestionResponse>> => {
  const res = await axiosInstance.get<PaginatedResponse<QuestionResponse>>(`${BASE}/${bankId}/questions`, { params });
  return res.data;
};

export const getQuestion = async (bankId: number, questionId: number): Promise<QuestionResponse> => {
  const res = await axiosInstance.get<QuestionResponse>(`${BASE}/${bankId}/questions/${questionId}`);
  return res.data;
};

export const updateQuestion = async (
  bankId: number,
  questionId: number,
  data: UpdateQuestion
): Promise<QuestionResponse> => {
  const res = await axiosInstance.put<QuestionResponse>(`${BASE}/${bankId}/questions/${questionId}`, data);
  return res.data;
};

export const deleteQuestion = async (bankId: number, questionId: number): Promise<void> => {
  await axiosInstance.delete(`${BASE}/${bankId}/questions/${questionId}`);
};

export const bulkAddQuestions = async (
  bankId: number,
  questions: CreateQuestion[],
  source = 'AI_GENERATED'
): Promise<{ savedCount: number; message: string }> => {
  const res = await axiosInstance.post<{ savedCount: number; message: string }>(
    `${BASE}/${bankId}/questions/bulk?source=${source}`,
    questions
  );
  return res.data;
};

// ============================================================
// Import
// ============================================================

export const previewImport = async (bankId: number, file: File): Promise<ImportPreview> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axiosInstance.post<ImportPreview>(
    `${BASE}/${bankId}/questions/import/preview`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
};

export const confirmImport = async (
  bankId: number,
  questions: CreateQuestion[],
  source = 'IMPORT'
): Promise<ImportResult> => {
  const res = await axiosInstance.post<ImportResult>(
    `${BASE}/${bankId}/questions/import/confirm?source=${source}`,
    questions
  );
  return res.data;
};

// ============================================================
// AI Draft Generation
// ============================================================

export const generateAiDraft = async (
  bankId: number,
  data: AiGenerateDraftRequest
): Promise<AiDraftResponse> => {
  const res = await axiosInstance.post<AiDraftResponse>(
    `${BASE}/${bankId}/questions/ai-generate`,
    data
  );
  return res.data;
};

// ============================================================
// Mentor Question Bank Contribution
// ============================================================

export const createQuestionBankSubmission = async (
  data: CreateQuestionBankSubmission
): Promise<QuestionBankSubmission> => {
  const res = await axiosInstance.post<QuestionBankSubmission>(MENTOR_SUBMISSION_BASE, data);
  return res.data;
};

export const getMyQuestionBankSubmissions = async (): Promise<QuestionBankSubmission[]> => {
  const res = await axiosInstance.get<QuestionBankSubmission[]>(MENTOR_SUBMISSION_BASE);
  return res.data;
};

export const getMyQuestionBankSubmission = async (id: number): Promise<QuestionBankSubmission> => {
  const res = await axiosInstance.get<QuestionBankSubmission>(`${MENTOR_SUBMISSION_BASE}/${id}`);
  return res.data;
};

// ============================================================
// Admin Review For Mentor Contributions
// ============================================================

export const getAdminQuestionBankSubmissions = async (
  params?: { statuses?: string[]; page?: number; size?: number }
): Promise<PaginatedResponse<QuestionBankSubmission>> => {
  const res = await axiosInstance.get<PaginatedResponse<QuestionBankSubmission>>(ADMIN_SUBMISSION_BASE, { params });
  return res.data;
};

export const getAdminQuestionBankSubmission = async (id: number): Promise<QuestionBankSubmission> => {
  const res = await axiosInstance.get<QuestionBankSubmission>(`${ADMIN_SUBMISSION_BASE}/${id}`);
  return res.data;
};

export const reviewQuestionBankSubmission = async (
  id: number,
  data: ReviewQuestionBankSubmission
): Promise<QuestionBankSubmission> => {
  const res = await axiosInstance.post<QuestionBankSubmission>(`${ADMIN_SUBMISSION_BASE}/${id}/review`, data);
  return res.data;
};

export const countPendingQuestionBankSubmissions = async (): Promise<number> => {
  const res = await axiosInstance.get<{ count: number }>(`${ADMIN_SUBMISSION_BASE}/count-pending`);
  return res.data.count;
};

// ============================================================
// AI Skill Resolution
// ============================================================

const SKILL_RESOLVE_BASE = '/api/v1/question-banks/skills';

export interface SkillResolveResponse {
  skillName: string;
  domain: string;
  industry: string;
  jobRole: string;
  confidence: number;
  reasoning: string;
  questionBankExists: boolean;
  existingQuestionBankId?: number;
  existingQuestionBankTitle?: string;
  createdQuestionBankId?: number;
  createdQuestionBankTitle?: string;
  alternatives?: {
    domain: string;
    industry: string;
    jobRole: string;
    confidence: number;
  }[];
}

/**
 * Use AI to resolve a skill name → domain / industry / jobRole.
 * Accessible by ADMIN, AI_ADMIN, and MENTOR roles.
 */
export const resolveSkill = async (skillName: string): Promise<SkillResolveResponse> => {
  const res = await axiosInstance.post<SkillResolveResponse>(
    `${SKILL_RESOLVE_BASE}/resolve`,
    { skillName }
  );
  return res.data;
};

/**
 * Use AI to resolve a skill and auto-create the question bank if it doesn't exist.
 * Accessible by ADMIN and AI_ADMIN roles only.
 */
export const resolveAndCreateQuestionBank = async (skillName: string): Promise<SkillResolveResponse> => {
  const res = await axiosInstance.post<SkillResolveResponse>(
    `${SKILL_RESOLVE_BASE}/resolve-and-create`,
    { skillName }
  );
  return res.data;
};
