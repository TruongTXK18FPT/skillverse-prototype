import axiosInstance from './axiosInstance';
import {
  CourseLearningRevisionInfoDTO,
  CourseLearningStatusDTO,
  RevisionInfoResponse,
  UpgradeToActiveResponse
} from '../data/courseLearningDTOs';

const normalizeRevisionInfoResponse = (data: Partial<CourseLearningRevisionInfoDTO> | null | undefined): CourseLearningRevisionInfoDTO => ({
  courseId: Number(data?.courseId ?? 0),
  userId: Number(data?.userId ?? 0),
  learningRevisionId: data?.learningRevisionId ?? null,
  activeRevisionId: data?.activeRevisionId ?? null,
  latestRevisionId: data?.latestRevisionId ?? null,
  upgradePolicy: data?.upgradePolicy ?? null,
  hasNewerRevision: Boolean(data?.hasNewerRevision)
});

export const getCourseLearningStatus = async (
  courseId: number
): Promise<CourseLearningStatusDTO> => {
  const response = await axiosInstance.get<CourseLearningStatusDTO>(
    `/course-learning/courses/${courseId}/status`
  );
  return response.data;
};

export const getCourseLearningRevisionInfo = async (
  courseId: number
): Promise<RevisionInfoResponse> => {
  const response = await axiosInstance.get<Partial<CourseLearningRevisionInfoDTO>>(
    `/course-learning/courses/${courseId}/revision-info`
  );
  return normalizeRevisionInfoResponse(response.data);
};

export const upgradeCourseLearningToActiveRevision = async (
  courseId: number
): Promise<UpgradeToActiveResponse> => {
  const response = await axiosInstance.post<Partial<CourseLearningRevisionInfoDTO>>(
    `/course-learning/courses/${courseId}/upgrade-to-active`
  );
  return normalizeRevisionInfoResponse(response.data);
};

export const upgradeCourseToActiveRevision = upgradeCourseLearningToActiveRevision;
