import axiosInstance from './axiosInstance';
import {
  AssignmentDetailDTO,
  AssignmentCreateDTO,
  AssignmentUpdateDTO,
  AssignmentSummaryDTO,
  AssignmentSubmissionDetailDTO,
  AssignmentSubmissionCreateDTO
} from '../data/assignmentDTOs';

/**
 * Create a new assignment for a module
 * @param moduleId - The ID of the module
 * @param assignmentData - The assignment data
 * @param actorId - The ID of the user creating the assignment
 * @returns Promise with the created assignment detail
 */
export const createAssignment = async (
  moduleId: number,
  assignmentData: AssignmentCreateDTO,
  actorId: number
): Promise<AssignmentDetailDTO> => {
  const response = await axiosInstance.post<AssignmentDetailDTO>(
    `/assignments`,
    assignmentData,
    { params: { moduleId, actorId } }
  );
  return response.data;
};

/**
 * Update an existing assignment
 * @param assignmentId - The ID of the assignment to update
 * @param assignmentData - The updated assignment data
 * @param actorId - The ID of the user updating the assignment
 * @returns Promise with the updated assignment detail
 */
export const updateAssignment = async (
  assignmentId: number,
  assignmentData: AssignmentUpdateDTO,
  actorId: number
): Promise<AssignmentDetailDTO> => {
  const response = await axiosInstance.put<AssignmentDetailDTO>(
    `/assignments/${assignmentId}`,
    assignmentData,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Delete an assignment
 * @param assignmentId - The ID of the assignment to delete
 * @param actorId - The ID of the user deleting the assignment
 */
export const deleteAssignment = async (
  assignmentId: number,
  actorId: number
): Promise<void> => {
  await axiosInstance.delete(`/assignments/${assignmentId}`, {
    params: { actorId }
  });
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
 * Submit an assignment
 * @param assignmentId - The ID of the assignment
 * @param submissionData - The submission data
 * @param userId - The ID of the user submitting
 * @returns Promise with the submission detail
 */
export const submitAssignment = async (
  assignmentId: number,
  submissionData: AssignmentSubmissionCreateDTO,
  userId: number
): Promise<AssignmentSubmissionDetailDTO> => {
  const response = await axiosInstance.post<AssignmentSubmissionDetailDTO>(
    `/assignments/${assignmentId}/submissions`,
    submissionData,
    { params: { userId } }
  );
  return response.data;
};

/**
 * Get submissions for an assignment (mentor/admin)
 * @param assignmentId - The ID of the assignment
 * @param actorId - The ID of the mentor/admin
 * @returns Promise with array of submissions
 */
export const getAssignmentSubmissions = async (
  assignmentId: number,
  actorId: number
): Promise<AssignmentSubmissionDetailDTO[]> => {
  const response = await axiosInstance.get<AssignmentSubmissionDetailDTO[]>(
    `/assignments/${assignmentId}/submissions`,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Grade an assignment submission
 * @param submissionId - The ID of the submission
 * @param score - The score to assign
 * @param feedback - Optional feedback
 * @param graderId - The ID of the grader
 * @returns Promise with the updated submission
 */
export const gradeSubmission = async (
  submissionId: number,
  score: number,
  feedback: string | undefined,
  graderId: number
): Promise<AssignmentSubmissionDetailDTO> => {
  const response = await axiosInstance.put<AssignmentSubmissionDetailDTO>(
    `/assignments/submissions/${submissionId}/grade`,
    undefined,
    { params: { graderId, score, feedback } }
  );
  return response.data;
};
