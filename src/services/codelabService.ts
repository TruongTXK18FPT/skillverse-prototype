import axiosInstance from './axiosInstance';
import {
  CodingExerciseDetailDTO,
  CodingExerciseCreateDTO,
  CodingExerciseUpdateDTO,
  CodingExerciseSummaryDTO,
  CodingSubmissionDetailDTO,
  CodingSubmissionCreateDTO,
  CodingTestCaseDTO,
  CodingTestCaseCreateDTO,
  CodingTestCaseUpdateDTO
} from '../data/codelabDTOs';

/**
 * Create a new coding exercise for a module
 * @param moduleId - The ID of the module
 * @param exerciseData - The coding exercise data
 * @param actorId - The ID of the user creating the exercise
 * @returns Promise with the created exercise detail
 */
export const createCodingExercise = async (
  moduleId: number,
  exerciseData: CodingExerciseCreateDTO,
  actorId: number
): Promise<CodingExerciseDetailDTO> => {
  const response = await axiosInstance.post<CodingExerciseDetailDTO>(
    `/coding-exercises`,
    exerciseData,
    { params: { moduleId, actorId } }
  );
  return response.data;
};

/**
 * Update an existing coding exercise
 * @param exerciseId - The ID of the exercise to update
 * @param exerciseData - The updated exercise data
 * @param actorId - The ID of the user updating the exercise
 * @returns Promise with the updated exercise detail
 */
export const updateCodingExercise = async (
  exerciseId: number,
  exerciseData: CodingExerciseUpdateDTO,
  actorId: number
): Promise<CodingExerciseDetailDTO> => {
  const response = await axiosInstance.put<CodingExerciseDetailDTO>(
    `/coding-exercises/${exerciseId}`,
    exerciseData,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Delete a coding exercise
 * @param exerciseId - The ID of the exercise to delete
 * @param actorId - The ID of the user deleting the exercise
 */
export const deleteCodingExercise = async (
  exerciseId: number,
  actorId: number
): Promise<void> => {
  await axiosInstance.delete(`/coding-exercises/${exerciseId}`, {
    params: { actorId }
  });
};

/**
 * Get coding exercise details by ID
 * @param exerciseId - The ID of the exercise
 * @returns Promise with the exercise detail
 */
export const getCodingExerciseById = async (
  exerciseId: number
): Promise<CodingExerciseDetailDTO> => {
  const response = await axiosInstance.get<CodingExerciseDetailDTO>(
    `/coding-exercises/${exerciseId}`
  );
  return response.data;
};

/**
 * List all coding exercises for a module
 * @param moduleId - The ID of the module
 * @returns Promise with array of exercise summaries
 */
export const listCodingExercisesByModule = async (
  moduleId: number
): Promise<CodingExerciseSummaryDTO[]> => {
  const response = await axiosInstance.get<CodingExerciseSummaryDTO[]>(
    `/modules/${moduleId}/coding-exercises`
  );
  return response.data;
};

/**
 * Add a test case to a coding exercise
 * @param exerciseId - The ID of the exercise
 * @param testCaseData - The test case data
 * @param actorId - The ID of the user adding the test case
 * @returns Promise with the created test case
 */
export const addTestCase = async (
  exerciseId: number,
  testCaseData: CodingTestCaseCreateDTO,
  actorId: number
): Promise<CodingTestCaseDTO> => {
  const response = await axiosInstance.post<CodingTestCaseDTO>(
    `/coding-exercises/${exerciseId}/test-cases`,
    testCaseData,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Update a test case
 * @param testCaseId - The ID of the test case to update
 * @param testCaseData - The updated test case data
 * @param actorId - The ID of the user updating the test case
 * @returns Promise with the updated test case
 */
export const updateTestCase = async (
  testCaseId: number,
  testCaseData: CodingTestCaseUpdateDTO,
  actorId: number
): Promise<CodingTestCaseDTO> => {
  const response = await axiosInstance.put<CodingTestCaseDTO>(
    `/test-cases/${testCaseId}`,
    testCaseData,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Delete a test case
 * @param testCaseId - The ID of the test case to delete
 * @param actorId - The ID of the user deleting the test case
 */
export const deleteTestCase = async (
  testCaseId: number,
  actorId: number
): Promise<void> => {
  await axiosInstance.delete(`/test-cases/${testCaseId}`, {
    params: { actorId }
  });
};

/**
 * Submit code for a coding exercise
 * @param exerciseId - The ID of the exercise
 * @param submissionData - The code submission data
 * @param userId - The ID of the user submitting
 * @returns Promise with the submission detail (includes test results)
 */
export const submitCode = async (
  exerciseId: number,
  submissionData: CodingSubmissionCreateDTO,
  userId: number
): Promise<CodingSubmissionDetailDTO> => {
  const response = await axiosInstance.post<CodingSubmissionDetailDTO>(
    `/coding-exercises/${exerciseId}/submissions`,
    submissionData,
    { params: { userId } }
  );
  return response.data;
};

/**
 * Get submissions for a coding exercise (mentor/admin)
 * @param exerciseId - The ID of the exercise
 * @param actorId - The ID of the mentor/admin
 * @returns Promise with array of submissions
 */
export const getCodingSubmissions = async (
  exerciseId: number,
  actorId: number
): Promise<CodingSubmissionDetailDTO[]> => {
  const response = await axiosInstance.get<CodingSubmissionDetailDTO[]>(
    `/coding-exercises/${exerciseId}/submissions`,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Get user's submissions for an exercise
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user
 * @returns Promise with array of user's submissions
 */
export const getUserCodingSubmissions = async (
  exerciseId: number,
  userId: number
): Promise<CodingSubmissionDetailDTO[]> => {
  const response = await axiosInstance.get<CodingSubmissionDetailDTO[]>(
    `/coding-exercises/${exerciseId}/submissions/user/${userId}`
  );
  return response.data;
};

/**
 * Run code against test cases (without saving submission)
 * @param exerciseId - The ID of the exercise
 * @param code - The code to test
 * @param userId - The ID of the user
 * @returns Promise with test results
 */
export const runCode = async (
  exerciseId: number,
  code: string,
  userId: number
): Promise<{ passed: boolean; results: Array<{ testCaseId: number; passed: boolean; output: string; error?: string }> }> => {
  const response = await axiosInstance.post(
    `/coding-exercises/${exerciseId}/run`,
    { code },
    { params: { userId } }
  );
  return response.data;
};
