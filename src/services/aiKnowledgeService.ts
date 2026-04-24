import axiosInstance from './axiosInstance';
import {
  AdminChatbotKnowledgeUploadRequest,
  AdminRoadmapKnowledgeUploadRequest,
  AiKnowledgeDocumentDetailResponse,
  AiKnowledgeDocumentListItemResponse,
  ListAdminAiKnowledgeDocumentsParams,
  ListMentorAiKnowledgeDocumentsParams,
  MentorRoadmapKnowledgeSubmissionRequest,
  ReviewAiKnowledgeRequest,
  SpringPageResponse,
} from '../types/aiKnowledge';

const appendOptionalString = (formData: FormData, key: string, value?: string) => {
  if (value != null && value.trim() !== '') {
    formData.append(key, value.trim());
  }
};

const buildAdminChatbotUploadFormData = (
  payload: AdminChatbotKnowledgeUploadRequest
): FormData => {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('title', payload.title);
  appendOptionalString(formData, 'description', payload.description);
  appendOptionalString(formData, 'industry', payload.industry);
  appendOptionalString(formData, 'level', payload.level);
  return formData;
};

const buildAdminRoadmapUploadFormData = (
  payload: AdminRoadmapKnowledgeUploadRequest
): FormData => {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('title', payload.title);
  formData.append('skillName', payload.skillName);
  appendOptionalString(formData, 'description', payload.description);
  appendOptionalString(formData, 'industry', payload.industry);
  appendOptionalString(formData, 'level', payload.level);
  return formData;
};

const buildMentorRoadmapSubmissionFormData = (
  payload: MentorRoadmapKnowledgeSubmissionRequest
): FormData => {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('title', payload.title);
  formData.append('skillName', payload.skillName);
  appendOptionalString(formData, 'description', payload.description);
  appendOptionalString(formData, 'industry', payload.industry);
  appendOptionalString(formData, 'level', payload.level);
  return formData;
};

export const uploadAdminChatbotDocument = async (
  payload: AdminChatbotKnowledgeUploadRequest
): Promise<AiKnowledgeDocumentDetailResponse> => {
  const response = await axiosInstance.post<AiKnowledgeDocumentDetailResponse>(
    '/admin/ai-knowledge/chatbot-documents',
    buildAdminChatbotUploadFormData(payload)
  );
  return response.data;
};

export const uploadAdminRoadmapDocument = async (
  payload: AdminRoadmapKnowledgeUploadRequest
): Promise<AiKnowledgeDocumentDetailResponse> => {
  const response = await axiosInstance.post<AiKnowledgeDocumentDetailResponse>(
    '/admin/ai-knowledge/roadmap-documents',
    buildAdminRoadmapUploadFormData(payload)
  );
  return response.data;
};

export const listAdminAiKnowledgeDocuments = async (
  params: ListAdminAiKnowledgeDocumentsParams = {}
): Promise<SpringPageResponse<AiKnowledgeDocumentListItemResponse>> => {
  const response = await axiosInstance.get<SpringPageResponse<AiKnowledgeDocumentListItemResponse>>(
    '/admin/ai-knowledge/documents',
    { params }
  );
  return response.data;
};

export const getAdminAiKnowledgeDocumentDetail = async (
  id: number
): Promise<AiKnowledgeDocumentDetailResponse> => {
  const response = await axiosInstance.get<AiKnowledgeDocumentDetailResponse>(
    `/admin/ai-knowledge/documents/${id}`
  );
  return response.data;
};

export const reviewAdminAiKnowledgeDocument = async (
  id: number,
  payload: ReviewAiKnowledgeRequest
): Promise<AiKnowledgeDocumentDetailResponse> => {
  const response = await axiosInstance.post<AiKnowledgeDocumentDetailResponse>(
    `/admin/ai-knowledge/documents/${id}/review`,
    payload
  );
  return response.data;
};

export const reindexAdminAiKnowledgeDocument = async (
  id: number
): Promise<AiKnowledgeDocumentDetailResponse> => {
  const response = await axiosInstance.post<AiKnowledgeDocumentDetailResponse>(
    `/admin/ai-knowledge/documents/${id}/reindex`
  );
  return response.data;
};

export const archiveAdminAiKnowledgeDocument = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/admin/ai-knowledge/documents/${id}`);
};

export const submitMentorRoadmapDocument = async (
  payload: MentorRoadmapKnowledgeSubmissionRequest
): Promise<AiKnowledgeDocumentDetailResponse> => {
  const response = await axiosInstance.post<AiKnowledgeDocumentDetailResponse>(
    '/mentor/ai-knowledge/roadmap-documents',
    buildMentorRoadmapSubmissionFormData(payload)
  );
  return response.data;
};

export const listMentorAiKnowledgeDocuments = async (
  params: ListMentorAiKnowledgeDocumentsParams = {}
): Promise<SpringPageResponse<AiKnowledgeDocumentListItemResponse>> => {
  const response = await axiosInstance.get<SpringPageResponse<AiKnowledgeDocumentListItemResponse>>(
    '/mentor/ai-knowledge/documents',
    { params }
  );
  return response.data;
};

export const getMentorAiKnowledgeDocumentDetail = async (
  id: number
): Promise<AiKnowledgeDocumentDetailResponse> => {
  const response = await axiosInstance.get<AiKnowledgeDocumentDetailResponse>(
    `/mentor/ai-knowledge/documents/${id}`
  );
  return response.data;
};

export const deleteMentorAiKnowledgeDocument = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/mentor/ai-knowledge/documents/${id}`);
};
