import axiosInstance from './axiosInstance';
import { AiGradingResultDTO } from '../data/assignmentDTOs';

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
