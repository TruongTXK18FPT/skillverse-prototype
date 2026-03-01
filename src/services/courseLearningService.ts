import axiosInstance from './axiosInstance';
import { CourseLearningStatusDTO } from '../data/courseLearningDTOs';

export const getCourseLearningStatus = async (
  courseId: number
): Promise<CourseLearningStatusDTO> => {
  const response = await axiosInstance.get<CourseLearningStatusDTO>(
    `/course-learning/courses/${courseId}/status`
  );
  return response.data;
};
