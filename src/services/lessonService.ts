import axiosInstance from './axiosInstance';
import {
  LessonDetailDTO,
  LessonCreateDTO,
  LessonUpdateDTO,
  LessonSummaryDTO
} from '../data/lessonDTOs';

/**
 * Create a new lesson for a module
 * @param moduleId - The ID of the module
 * @param lessonData - The lesson data
 * @param actorId - The ID of the user creating the lesson
 * @returns Promise with the created lesson detail
 */
export const createLesson = async (
  moduleId: number,
  lessonData: LessonCreateDTO,
  actorId: number
): Promise<LessonDetailDTO> => {
  const response = await axiosInstance.post<LessonDetailDTO>(
    `/lessons`,
    lessonData,
    { 
      params: { moduleId, actorId },
      timeout: 60000 // 60 seconds timeout for video uploads
    }
  );
  return response.data;
};

/**
 * Update an existing lesson
 * @param lessonId - The ID of the lesson to update
 * @param lessonData - The updated lesson data
 * @param actorId - The ID of the user updating the lesson
 * @returns Promise with the updated lesson detail
 */
export const updateLesson = async (
  lessonId: number,
  lessonData: LessonUpdateDTO,
  actorId: number
): Promise<LessonDetailDTO> => {
  const response = await axiosInstance.put<LessonDetailDTO>(
    `/lessons/${lessonId}`,
    lessonData,
    { params: { actorId } }
  );
  return response.data;
};

/**
 * Delete a lesson
 * @param lessonId - The ID of the lesson to delete
 * @param actorId - The ID of the user deleting the lesson
 */
export const deleteLesson = async (
  lessonId: number,
  actorId: number
): Promise<void> => {
  await axiosInstance.delete(`/lessons/${lessonId}`, {
    params: { actorId }
  });
};

/**
 * Get lesson details by ID
 * @param lessonId - The ID of the lesson
 * @returns Promise with the lesson detail
 */
export const getLessonById = async (
  lessonId: number
): Promise<LessonDetailDTO> => {
  const response = await axiosInstance.get<LessonDetailDTO>(`/lessons/${lessonId}`);
  return response.data;
};

/**
 * List all lessons for a module
 * @param moduleId - The ID of the module
 * @returns Promise with array of lesson summaries
 */
export const listLessonsByModule = async (
  moduleId: number
): Promise<LessonSummaryDTO[]> => {
  const response = await axiosInstance.get<LessonSummaryDTO[]>(
    `/modules/${moduleId}/lessons`
  );
  return response.data;
};

/**
 * Reorder lessons in a course
 * @param courseId - The ID of the course
 * @param lessonOrders - Array of lesson IDs in the desired order
 * @param actorId - The ID of the user reordering
 */
export const reorderLessons = async (
  courseId: number,
  lessonOrders: number[],
  actorId: number
): Promise<void> => {
  await axiosInstance.put(
    `/courses/${courseId}/lessons/reorder`,
    { lessonOrders },
    { params: { actorId } }
  );
};
