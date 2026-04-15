import axiosInstance from './axiosInstance';
import { AiGradingResultDTO, AdminAiAssignmentConfigDTO } from '../data/assignmentDTOs';

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

/**
 * Trigger AI auto-grading for a submission.
 * POST /api/ai-grading/generate/{submissionId}
 */
export const generateAiGrade = async (
  submissionId: number
): Promise<AiGradingResultDTO> => {
  const response = await axiosInstance.post<AiGradingResultDTO>(
    `/ai-grading/generate/${submissionId}`
  );
  return response.data;
};

/**
 * Get the AI grading result for a submission (already generated).
 * GET /api/ai-grading/result/{submissionId}
 */
export const getAiGradeResult = async (
  submissionId: number
): Promise<AiGradingResultDTO> => {
  const response = await axiosInstance.get<AiGradingResultDTO>(
    `/ai-grading/result/${submissionId}`
  );
  return response.data;
};

/**
 * Toggle Trust AI auto-confirm for an assignment.
 * PUT /api/ai-grading/assignment/{assignmentId}/trust-ai?enabled={bool}
 */
export const toggleTrustAi = async (
  assignmentId: number,
  enabled: boolean
): Promise<void> => {
  await axiosInstance.put(`/ai-grading/assignment/${assignmentId}/trust-ai`, undefined, {
    params: { enabled },
  });
};

/**
 * Student requests mentor to review an AI-graded submission (dispute).
 * PUT /api/ai-grading/dispute/{submissionId}
 */
export const requestMentorReview = async (
  submissionId: number,
  reason?: string
): Promise<void> => {
  await axiosInstance.put(`/ai-grading/dispute/${submissionId}`, reason ?? null);
};

// ============================================================
// ADMIN PROMPT MANAGEMENT
// ============================================================

/** PUT /api/admin/ai-grading/assignments/{id}/ai-enabled */
export const updateAiEnabled = async (
  assignmentId: number,
  enabled: boolean
): Promise<AdminAiAssignmentConfigDTO> => {
  const response = await axiosInstance.put<AdminAiAssignmentConfigDTO>(
    `/admin/ai-grading/assignments/${assignmentId}/ai-enabled`,
    { enabled }
  );
  return response.data;
};

/** PUT /api/admin/ai-grading/assignments/{id}/prompt */
export const overridePrompt = async (
  assignmentId: number,
  prompt: string
): Promise<AdminAiAssignmentConfigDTO> => {
  const response = await axiosInstance.put<AdminAiAssignmentConfigDTO>(
    `/admin/ai-grading/assignments/${assignmentId}/prompt`,
    { prompt }
  );
  return response.data;
};

/** PUT /api/admin/ai-grading/assignments/{id}/grading-style */
export const updateGradingStyle = async (
  assignmentId: number,
  style: string
): Promise<AdminAiAssignmentConfigDTO> => {
  const response = await axiosInstance.put<AdminAiAssignmentConfigDTO>(
    `/admin/ai-grading/assignments/${assignmentId}/grading-style`,
    { style }
  );
  return response.data;
};

/** PUT /api/admin/ai-grading/assignments/{id}/disable-prompt */
export const disablePrompt = async (
  assignmentId: number
): Promise<AdminAiAssignmentConfigDTO> => {
  const response = await axiosInstance.put<AdminAiAssignmentConfigDTO>(
    `/admin/ai-grading/assignments/${assignmentId}/disable-prompt`
  );
  return response.data;
};

/** GET /api/admin/ai-grading/assignments/{id}/audit */
export const getPromptAuditLog = async (
  assignmentId: number,
  page = 0,
  size = 20
): Promise<{ content: PromptAuditLogDTO[]; totalElements: number; totalPages: number }> => {
  const response = await axiosInstance.get(
    `/admin/ai-grading/assignments/${assignmentId}/audit`,
    { params: { page, size } }
  );
  return response.data;
};
