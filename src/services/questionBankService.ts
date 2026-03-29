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
} from '../data/questionBankDTOs';

const BASE = '/api/v1/admin/question-banks';

// ============================================================
// Bank CRUD
// ============================================================

export const createQuestionBank = async (data: CreateQuestionBank): Promise<QuestionBankDetail> => {
  const res = await axiosInstance.post<QuestionBankDetail>(BASE, data);
  return res.data;
};

export const getQuestionBanks = async (
  params?: { domain?: string; industry?: string; jobRole?: string; page?: number; size?: number }
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
