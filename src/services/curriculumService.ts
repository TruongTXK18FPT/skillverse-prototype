import axiosInstance from './axiosInstance';
import {
  CurriculumUpsertRequestDTO,
  CurriculumUpsertResponseDTO
} from '../data/curriculumDTOs';

export const upsertCurriculum = async (
  courseId: number,
  actorId: number,
  payload: CurriculumUpsertRequestDTO
): Promise<CurriculumUpsertResponseDTO> => {
  const response = await axiosInstance.put<CurriculumUpsertResponseDTO>(
    `/courses/${courseId}/curriculum`,
    payload,
    { params: { actorId } }
  );
  return response.data;
};
