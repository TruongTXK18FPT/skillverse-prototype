/**
 * [Nghiệp vụ] Service cho node mentoring + final verification gate (V3 Phase 1).
 *
 * Convention mirrors `mentorVerificationService.ts`: thin axios wrappers,
 * flat DTOs, no client-side state.
 *
 * Endpoint prefix:
 * - Node-level: /api/v1/journeys/{journeyId}/nodes/{nodeId}/...
 * - Journey-level gate: /api/v1/journeys/{journeyId}/...
 *
 * Cloudinary upload for evidenceUrl / attachmentUrl REUSES
 * `uploadEvidence(file)` from `mentorVerificationService.ts` — do not
 * re-implement here.
 */
import axiosInstance from './axiosInstance';
import {
  AssessJourneyOutputRequest,
  ConfirmJourneyCompletionRequest,
  JourneyCompletionGateResponse,
  JourneyCompletionReportResponse,
  JourneyOutputAssessmentResponse,
  NodeAssignmentResponse,
  NodeEvidenceRecordResponse,
  NodeReviewResponse,
  NodeVerificationResponseDto,
  ReviewNodeSubmissionRequest,
  SubmitJourneyOutputAssessmentRequest,
  SubmitNodeEvidenceRequest,
  UpsertNodeAssignmentRequest,
  VerifyNodeRequest,
} from '../types/NodeMentoring';

const nodeBase = (journeyId: number, nodeId: string) =>
  `/api/v1/journeys/${journeyId}/nodes/${encodeURIComponent(nodeId)}`;

const journeyBase = (journeyId: number) => `/api/v1/journeys/${journeyId}`;

// ==================== Assignment ====================

/** Read current assignment snapshot for a node (null if none yet). */
export const getNodeAssignment = async (
  journeyId: number,
  nodeId: string,
): Promise<NodeAssignmentResponse | null> => {
  const response = await axiosInstance.get<NodeAssignmentResponse | null>(
    `${nodeBase(journeyId, nodeId)}/assignment`,
  );
  return response.data ?? null;
};

/** Mentor: upsert mentor-refined assignment snapshot. */
export const upsertNodeAssignment = async (
  journeyId: number,
  nodeId: string,
  request: UpsertNodeAssignmentRequest,
): Promise<NodeAssignmentResponse> => {
  const response = await axiosInstance.put<NodeAssignmentResponse>(
    `${nodeBase(journeyId, nodeId)}/assignment`,
    request,
  );
  return response.data;
};

// ==================== Evidence (learner) ====================

export const getNodeEvidence = async (
  journeyId: number,
  nodeId: string,
): Promise<NodeEvidenceRecordResponse | null> => {
  const response = await axiosInstance.get<NodeEvidenceRecordResponse | null>(
    `${nodeBase(journeyId, nodeId)}/evidence`,
  );
  return response.data ?? null;
};

/** Learner: upsert single current evidence record for (journey, node). */
export const submitNodeEvidence = async (
  journeyId: number,
  nodeId: string,
  request: SubmitNodeEvidenceRequest,
): Promise<NodeEvidenceRecordResponse> => {
  const response = await axiosInstance.post<NodeEvidenceRecordResponse>(
    `${nodeBase(journeyId, nodeId)}/evidence`,
    request,
  );
  return response.data;
};

// ==================== Review / Verify (mentor) ====================

export const reviewNodeSubmission = async (
  journeyId: number,
  nodeId: string,
  request: ReviewNodeSubmissionRequest,
): Promise<NodeReviewResponse> => {
  const response = await axiosInstance.post<NodeReviewResponse>(
    `${nodeBase(journeyId, nodeId)}/review`,
    request,
  );
  return response.data;
};

export const verifyNode = async (
  journeyId: number,
  nodeId: string,
  request: VerifyNodeRequest,
): Promise<NodeVerificationResponseDto> => {
  const response = await axiosInstance.post<NodeVerificationResponseDto>(
    `${nodeBase(journeyId, nodeId)}/verify`,
    request,
  );
  return response.data;
};

// ==================== Final verification gate ====================

export const getCompletionGate = async (
  journeyId: number,
): Promise<JourneyCompletionGateResponse> => {
  const response = await axiosInstance.get<JourneyCompletionGateResponse>(
    `${journeyBase(journeyId)}/completion-gate`,
  );
  return response.data;
};

/** Mentor: submit completion report (PASS unlocks the gate). */
export const submitCompletionReport = async (
  journeyId: number,
  request: ConfirmJourneyCompletionRequest,
): Promise<JourneyCompletionReportResponse> => {
  const response = await axiosInstance.post<JourneyCompletionReportResponse>(
    `${journeyBase(journeyId)}/completion-report`,
    request,
  );
  return response.data;
};

// ==================== Output assessment ====================

export const getLatestOutputAssessment = async (
  journeyId: number,
): Promise<JourneyOutputAssessmentResponse | null> => {
  const response = await axiosInstance.get<JourneyOutputAssessmentResponse | null>(
    `${journeyBase(journeyId)}/output-assessment`,
  );
  return response.data ?? null;
};

export const submitOutputAssessment = async (
  journeyId: number,
  request: SubmitJourneyOutputAssessmentRequest,
): Promise<JourneyOutputAssessmentResponse> => {
  const response = await axiosInstance.post<JourneyOutputAssessmentResponse>(
    `${journeyBase(journeyId)}/output-assessment`,
    request,
  );
  return response.data;
};

export const assessOutputAssessment = async (
  journeyId: number,
  request: AssessJourneyOutputRequest,
): Promise<JourneyOutputAssessmentResponse> => {
  const response = await axiosInstance.put<JourneyOutputAssessmentResponse>(
    `${journeyBase(journeyId)}/output-assessment/assess`,
    request,
  );
  return response.data;
};
