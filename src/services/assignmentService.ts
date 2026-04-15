import axiosInstance from './axiosInstance';
import {
  AssignmentDetailDTO,
  AssignmentCreateDTO,
  AssignmentUpdateDTO,
  AssignmentSummaryDTO,
  AssignmentSubmissionDetailDTO,
  AssignmentSubmissionCreateDTO,
  GradeAssignmentDTO,
  MentorSubmissionItemDTO,
  PendingSubmissionItemDTO
} from '../data/assignmentDTOs';

interface SpringPageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MentorSubmissionStatsResponse {
  totalCount: number;
  pendingCount: number;
  gradedCount: number;
  lateCount: number;
}

/**
 * Create a new assignment for a module.
 * Actor identity is resolved server-side from JWT.
 * @param moduleId - The ID of the module
 * @param assignmentData - The assignment data
 * @returns Promise with the created assignment detail
 */
export const createAssignment = async (
  moduleId: number,
  assignmentData: AssignmentCreateDTO
): Promise<AssignmentDetailDTO> => {
  const response = await axiosInstance.post<AssignmentDetailDTO>(
    `/assignments`,
    assignmentData,
    { params: { moduleId } }
  );
  return response.data;
};

/**
 * Update an existing assignment.
 * Actor identity is resolved server-side from JWT.
 * @param assignmentId - The ID of the assignment to update
 * @param assignmentData - The updated assignment data
 * @returns Promise with the updated assignment detail
 */
export const updateAssignment = async (
  assignmentId: number,
  assignmentData: AssignmentUpdateDTO
): Promise<AssignmentDetailDTO> => {
  const response = await axiosInstance.put<AssignmentDetailDTO>(
    `/assignments/${assignmentId}`,
    assignmentData
  );
  return response.data;
};

/**
 * Delete an assignment.
 * Actor identity is resolved server-side from JWT.
 * @param assignmentId - The ID of the assignment to delete
 */
export const deleteAssignment = async (
  assignmentId: number
): Promise<void> => {
  await axiosInstance.delete(`/assignments/${assignmentId}`);
};

/**
 * Get assignment details by ID
 * @param assignmentId - The ID of the assignment
 * @returns Promise with the assignment detail
 */
export const getAssignmentById = async (
  assignmentId: number
): Promise<AssignmentDetailDTO> => {
  const response = await axiosInstance.get<AssignmentDetailDTO>(
    `/assignments/${assignmentId}`
  );
  return response.data;
};

/**
 * List all assignments for a module
 * @param moduleId - The ID of the module
 * @returns Promise with array of assignment summaries
 */
export const listAssignmentsByModule = async (
  moduleId: number
): Promise<AssignmentSummaryDTO[]> => {
  const response = await axiosInstance.get<AssignmentSummaryDTO[]>(
    `/modules/${moduleId}/assignments`
  );
  return response.data;
};

/**
 * Submit an assignment.
 * User identity is resolved server-side from JWT.
 * @param assignmentId - The ID of the assignment
 * @param submissionData - The submission data
 * @returns Promise with the submission detail
 */
export const submitAssignment = async (
  assignmentId: number,
  submissionData: AssignmentSubmissionCreateDTO
): Promise<AssignmentSubmissionDetailDTO> => {
  const response = await axiosInstance.post<AssignmentSubmissionDetailDTO>(
    `/assignments/${assignmentId}/submissions`,
    submissionData
  );
  return response.data;
};

/**
 * Get submissions for an assignment (mentor/admin).
 * Identity resolved server-side from JWT.
 * @param assignmentId - The ID of the assignment
 * @returns Promise with PageResponse containing array of submissions
 */
export const getAssignmentSubmissions = async (
  assignmentId: number
): Promise<PageResponse<AssignmentSubmissionDetailDTO>> => {
  const response = await axiosInstance.get<PageResponse<AssignmentSubmissionDetailDTO>>(
    `/assignments/${assignmentId}/submissions`
  );
  return response.data;
};

/**
 * Grade an assignment submission.
 * Grader identity is resolved server-side from JWT.
 * @param submissionId - The ID of the submission
 * @param grading - The grading data (score, feedback, criteria)
 * @returns Promise with the updated submission
 */
export const gradeSubmission = async (
  submissionId: number,
  grading: GradeAssignmentDTO
): Promise<AssignmentSubmissionDetailDTO> => {
  const response = await axiosInstance.put<AssignmentSubmissionDetailDTO>(
    `/assignments/submissions/${submissionId}/grade`,
    grading
  );
  return response.data;
};

/**
 * Get user's own submissions for an assignment (all versions).
 * User identity is resolved server-side from JWT.
 * @param assignmentId - The ID of the assignment
 * @returns Promise with array of user's submissions (newest first)
 */
export const getMySubmissions = async (
  assignmentId: number
): Promise<AssignmentSubmissionDetailDTO[]> => {
  const response = await axiosInstance.get<AssignmentSubmissionDetailDTO[]>(
    `/assignments/${assignmentId}/submissions/mine`
  );
  return response.data;
};

/**
 * Get pending submissions for grading (mentor/admin).
 * Identity resolved server-side from JWT.
 * @param assignmentId - The ID of the assignment
 * @returns Promise with array of pending submissions
 */
export const getPendingSubmissions = async (
  assignmentId: number
): Promise<AssignmentSubmissionDetailDTO[]> => {
  const response = await axiosInstance.get<AssignmentSubmissionDetailDTO[]>(
    `/assignments/${assignmentId}/submissions/pending`
  );
  return response.data;
};

/**
 * Get count of pending submissions (for badge display).
 * Identity resolved server-side from JWT.
 * @param assignmentId - The ID of the assignment
 * @returns Promise with count of pending submissions
 */
export const countPendingSubmissions = async (
  assignmentId: number
): Promise<number> => {
  const response = await axiosInstance.get<number>(
    `/assignments/${assignmentId}/submissions/pending/count`
  );
  return response.data;
};

/**
 * Get ALL pending submissions across all assignments for a mentor (batch endpoint).
 * Replaces the N+1 pattern of loading per-course/module/assignment.
 * Mentor ID is resolved server-side from the JWT token.
 * @returns Promise with array of pending submission items with context
 */
export const getAllPendingForMentor = async (): Promise<PendingSubmissionItemDTO[]> => {
  const response = await axiosInstance.get<PendingSubmissionItemDTO[]>(
    `/assignments/mentor/pending-all`
  );
  return response.data;
};

/**
 * Get all newest submissions across assignments for the authenticated mentor.
 * Used by mentor grading dashboards that need pending and graded items together.
 */
export const getAllMentorSubmissions = async (): Promise<MentorSubmissionItemDTO[]> => {
  const response = await axiosInstance.get<MentorSubmissionItemDTO[]>(
    `/assignments/mentor/submissions`
  );
  return response.data;
};

/**
 * Get paged newest submissions for mentor grading dashboard.
 * Supports server-side filter and search for performance at scale.
 */
export const getMentorSubmissionsPage = async (
  page: number = 0,
  size: number = 10,
  filter: 'ALL' | 'PENDING' | 'GRADED' | 'LATE' = 'ALL',
  search?: string
): Promise<SpringPageResponse<MentorSubmissionItemDTO>> => {
  const params: Record<string, string | number> = { page, size, filter };
  if (search && search.trim()) {
    params.search = search.trim();
  }

  const response = await axiosInstance.get<SpringPageResponse<MentorSubmissionItemDTO>>(
    `/assignments/mentor/submissions/paged`,
    { params }
  );
  return response.data;
};

/**
 * Get aggregate stats for mentor grading dashboard cards.
 */
export const getMentorSubmissionStats = async (): Promise<MentorSubmissionStatsResponse> => {
  const response = await axiosInstance.get<MentorSubmissionStatsResponse>(
    `/assignments/mentor/submissions/stats`
  );
  return response.data;
};

/**
 * Get the prior submission (attempt N-1) for a given submission.
 * Used by mentor grading UI to surface AI feedback from the previous attempt
 * when a student has resubmitted after an AI failure.
 * @param submissionId - The ID of the current (newest) submission
 * @returns Promise with the prior submission detail
 * @throws 404 if no prior submission exists
 */
export const getPriorSubmission = async (
  submissionId: number
): Promise<AssignmentSubmissionDetailDTO> => {
  const response = await axiosInstance.get<AssignmentSubmissionDetailDTO>(
    `/assignments/submissions/${submissionId}/prior`
  );
  return response.data;
};
