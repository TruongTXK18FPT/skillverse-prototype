import axiosInstance from './axiosInstance';

export interface ModuleCreateDTO {
  title: string;
  description?: string;
  orderIndex?: number;
}

export interface ModuleUpdateDTO {
  title?: string;
  description?: string;
  orderIndex?: number;
}

export interface ModuleSummaryDTO {
  id: number;
  title: string;
  description?: string;
  orderIndex?: number;
}

export interface ModuleDetailDTO extends ModuleSummaryDTO {
  createdAt: string;
  updatedAt: string;
  lessons: Array<{ id: number; title: string; type: string; orderIndex: number; }>; 
}

export const listModules = async (courseId: number): Promise<ModuleSummaryDTO[]> => {
  const res = await axiosInstance.get(`/courses/${courseId}/modules`);
  return res.data as ModuleSummaryDTO[];
};

export const createModule = async (courseId: number, actorId: number, dto: ModuleCreateDTO): Promise<ModuleDetailDTO> => {
  const res = await axiosInstance.post(`/courses/${courseId}/modules`, dto, { params: { actorId } });
  return res.data as ModuleDetailDTO;
};

export const updateModule = async (moduleId: number, actorId: number, dto: ModuleUpdateDTO): Promise<ModuleDetailDTO> => {
  const res = await axiosInstance.put(`/modules/${moduleId}`, dto, { params: { actorId } });
  return res.data as ModuleDetailDTO;
};

export const deleteModule = async (moduleId: number, actorId: number): Promise<void> => {
  await axiosInstance.delete(`/modules/${moduleId}`, { params: { actorId } });
};

export const assignLessonToModule = async (moduleId: number, lessonId: number, actorId: number): Promise<void> => {
  await axiosInstance.post(`/modules/${moduleId}/assign-lesson/${lessonId}`, null, { params: { actorId } });
};


