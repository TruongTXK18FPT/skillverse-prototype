import axiosInstance from './axiosInstance';
import {
  QuizDetailDTO,
  QuizCreateDTO,
  QuizUpdateDTO,
  QuizSummaryDTO,
  QuizAttemptDTO,
  QuizQuestionDetailDTO,
  QuizQuestionCreateDTO,
  QuizQuestionUpdateDTO,
  QuizOptionDTO,
  QuizOptionCreateDTO,
  QuizOptionUpdateDTO,
  SubmitQuizDTO
} from '../data/quizDTOs';

/**
 * Create a new quiz for a module
 * @param moduleId - The ID of the module
 * @param quizData - The quiz data
 * @param actorId - The ID of the user creating the quiz
 * @returns Promise with the created quiz detail
 */
export const createQuiz = async (
  moduleId: number,
  quizData: QuizCreateDTO,
  actorId: number
): Promise<QuizDetailDTO> => {
  const response = await axiosInstance.post<QuizDetailDTO>(
    `/quizzes`,
    quizData,
    { params: { moduleId, actorId } }
  );
  return response.data;
};

/**
 * Update an existing quiz
 * @param quizId - The ID of the quiz to update
 * @param quizData - The updated quiz data
 * @param actorId - The ID of the user updating the quiz
 * @returns Promise with the updated quiz detail
 */
export const updateQuiz = async (
  quizId: number,
  quizData: QuizUpdateDTO,
  actorId: number
): Promise<QuizDetailDTO> => {
  const response = await axiosInstance.put<QuizDetailDTO>(
    `/quizzes/${quizId}`,
    quizData,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Delete a quiz
 * @param quizId - The ID of the quiz to delete
 * @param actorId - The ID of the user deleting the quiz
 */
export const deleteQuiz = async (
  quizId: number,
  actorId: number
): Promise<void> => {
  await axiosInstance.delete(`/quizzes/${quizId}`, {
    params: { actorId }
  });
};

/**
 * Get quiz details by ID
 * @param quizId - The ID of the quiz
 * @returns Promise with the quiz detail
 */
export const getQuizById = async (
  quizId: number
): Promise<QuizDetailDTO> => {
  const response = await axiosInstance.get<QuizDetailDTO>(
    `/quizzes/${quizId}`
  );
  return response.data;
};

/**
 * List all quizzes for a module
 * @param moduleId - The ID of the module
 * @returns Promise with array of quiz summaries
 */
export const listQuizzesByModule = async (
  moduleId: number
): Promise<QuizSummaryDTO[]> => {
  const response = await axiosInstance.get<QuizSummaryDTO[]>(
    `/quizzes/modules/${moduleId}/quizzes`
  );
  return response.data;
};

/**
 * Add a question to a quiz
 * @param quizId - The ID of the quiz
 * @param questionData - The question data
 * @param actorId - The ID of the user adding the question
 * @returns Promise with the created question
 */
export const addQuizQuestion = async (
  quizId: number,
  questionData: QuizQuestionCreateDTO,
  actorId: number
): Promise<QuizQuestionDetailDTO> => {
  const response = await axiosInstance.post<QuizQuestionDetailDTO>(
    `/quizzes/${quizId}/questions`,
    questionData,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Update a quiz question
 * @param questionId - The ID of the question to update
 * @param questionData - The updated question data
 * @param actorId - The ID of the user updating the question
 * @returns Promise with the updated question
 */
export const updateQuizQuestion = async (
  questionId: number,
  questionData: QuizQuestionUpdateDTO,
  actorId: number
): Promise<QuizQuestionDetailDTO> => {
  const response = await axiosInstance.put<QuizQuestionDetailDTO>(
    `/quizzes/questions/${questionId}`,
    questionData,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Delete a quiz question
 * @param questionId - The ID of the question to delete
 * @param actorId - The ID of the user deleting the question
 */
export const deleteQuizQuestion = async (
  questionId: number,
  actorId: number
): Promise<void> => {
  await axiosInstance.delete(`/quizzes/questions/${questionId}`, {
    params: { actorId }
  });
};

/**
 * Add an option to a quiz question
 */
export const addQuizOption = async (
  questionId: number,
  optionData: QuizOptionCreateDTO,
  actorId: number
): Promise<QuizOptionDTO> => {
  const response = await axiosInstance.post<QuizOptionDTO>(
    `/quizzes/questions/${questionId}/options`,
    optionData,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Update a quiz option
 */
export const updateQuizOption = async (
  optionId: number,
  optionData: QuizOptionUpdateDTO,
  actorId: number
): Promise<QuizOptionDTO> => {
  const response = await axiosInstance.put<QuizOptionDTO>(
    `/quizzes/options/${optionId}`,
    optionData,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Delete a quiz option
 */
export const deleteQuizOption = async (
  optionId: number,
  actorId: number
): Promise<void> => {
  await axiosInstance.delete(`/quizzes/options/${optionId}`, {
    params: { actorId }
  });
};

/**
 * Start a quiz attempt
 * @param quizId - The ID of the quiz
 * @param userId - The ID of the user starting the quiz
 * @returns Promise with the quiz attempt detail
 */
export const startQuizAttempt = async (
  quizId: number,
  userId: number
): Promise<QuizAttemptDTO> => {
  const response = await axiosInstance.post<QuizAttemptDTO>(
    `/quizzes/${quizId}/attempts`,
    {},
    { params: { userId } }
  );
  return response.data;
};

/**
 * Submit quiz answers
 * @param attemptId - The ID of the quiz attempt
 * @param submitData - Quiz submission data
 * @param userId - The ID of the user submitting
 * @returns Promise with the graded attempt
 */
export const submitQuizAnswers = async (
  attemptId: number,
  submitData: SubmitQuizDTO,
  userId: number
): Promise<QuizAttemptDTO> => {
  const response = await axiosInstance.post<QuizAttemptDTO>(
    `/quiz-attempts/${attemptId}/submit`,
    submitData,
    { params: { userId } }
  );
  return response.data;
};

/**
 * Get quiz attempts for a user
 * @param quizId - The ID of the quiz
 * @param userId - The ID of the user
 * @returns Promise with array of attempts
 */
export const getUserQuizAttempts = async (
  quizId: number,
  userId: number
): Promise<QuizAttemptDTO[]> => {
  const response = await axiosInstance.get<QuizAttemptDTO[]>(
    `/quizzes/${quizId}/attempts`,
    { params: { userId } }
  );
  return response.data;
};
