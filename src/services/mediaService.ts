import axiosInstance from './axiosInstance';

export interface MediaDTO {
  id: number;
  url: string;
  fileName: string;
  type: string;
  fileSize?: number;
}

export const uploadMedia = async (file: File, actorId: number): Promise<MediaDTO> => {
  const form = new FormData();
  form.append('file', file);
  form.append('actorId', String(actorId));
  const res = await axiosInstance.post<MediaDTO>('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000 // 2 minutes timeout for large video uploads
  });
  return res.data;
};

export const attachMediaToLesson = async (mediaId: number, lessonId: number, actorId: number): Promise<MediaDTO> => {
  const res = await axiosInstance.put<MediaDTO>(`/media/${mediaId}/attach-lesson`, undefined, {
    params: { lessonId, actorId }
  });
  return res.data;
};

export const getSignedMediaUrl = async (mediaId: number, actorId: number): Promise<string> => {
  const res = await axiosInstance.get<{ url: string }>(`/media/${mediaId}/signed-url`, {
    params: { actorId }
  });
  return res.data.url;
};

export const listMediaByLesson = async (lessonId: number): Promise<MediaDTO[]> => {
  const res = await axiosInstance.get<MediaDTO[]>(`/media/lesson/${lessonId}`);
  return res.data;
};

export const attachMediaToCourse = async (mediaId: number, courseId: number, actorId: number): Promise<MediaDTO> => {
  const res = await axiosInstance.put<MediaDTO>(`/media/${mediaId}/attach-course`, undefined, {
    params: { courseId, actorId }
  });
  return res.data;
};
