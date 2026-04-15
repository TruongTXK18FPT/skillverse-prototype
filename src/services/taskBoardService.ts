import axiosInstance from './axiosInstance';
import { 
  TaskColumnResponse, 
  TaskResponse, 
  CreateTaskRequest, 
  UpdateTaskRequest,
  ClearOverdueTasksResponse,
} from '../types/TaskBoard';

const BASE_URL = '/task-board';

export const taskBoardService = {
  getBoard: async (roadmapSessionId?: number): Promise<TaskColumnResponse[]> => {
    const params = roadmapSessionId !== undefined ? { roadmapSessionId } : {};
    const response = await axiosInstance.get<TaskColumnResponse[]>(`${BASE_URL}`, { params });
    return response.data;
  },

  getArchivedTasks: async (roadmapSessionId?: number, page = 0, size = 20): Promise<{ items: TaskResponse[]; page: number; size: number; total: number }> => {
    const params: any = { page, size };
    if (roadmapSessionId !== undefined) params.roadmapSessionId = roadmapSessionId;
    const response = await axiosInstance.get(`${BASE_URL}/archived`, { params });
    return response.data;
  },

  unarchiveTask: async (taskId: string): Promise<TaskResponse> => {
    const response = await axiosInstance.patch<TaskResponse>(`${BASE_URL}/tasks/${taskId}/unarchive`);
    return response.data;
  },

  archiveRoadmapTasks: async (roadmapSessionId: number): Promise<{ archivedCount: number; message: string }> => {
    const response = await axiosInstance.post(`${BASE_URL}/archive-roadmap/${roadmapSessionId}`);
    return response.data;
  },

  createColumn: async (name: string, color?: string): Promise<TaskColumnResponse> => {
    const response = await axiosInstance.post<TaskColumnResponse>(`${BASE_URL}/columns`, null, {
      params: { name, color }
    });
    return response.data;
  },

  updateColumn: async (columnId: string, name: string, color: string): Promise<TaskColumnResponse> => {
    const response = await axiosInstance.patch<TaskColumnResponse>(`${BASE_URL}/columns/${columnId}`, null, {
      params: { name, color }
    });
    return response.data;
  },

  deleteColumn: async (columnId: string, targetColumnId?: string): Promise<void> => {
    const params: any = {};
    if (targetColumnId) params.targetColumnId = targetColumnId;
    await axiosInstance.delete(`${BASE_URL}/columns/${columnId}`, { params });
  },

  createTask: async (request: CreateTaskRequest): Promise<TaskResponse> => {
    const response = await axiosInstance.post<TaskResponse>(`${BASE_URL}/tasks`, request);
    return response.data;
  },

  updateTask: async (taskId: string, request: UpdateTaskRequest): Promise<TaskResponse> => {
    const response = await axiosInstance.patch<TaskResponse>(`${BASE_URL}/tasks/${taskId}`, request);
    return response.data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/tasks/${taskId}`);
  },

  clearOverdueTasks: async (
    overdueDays = 30,
    columnId?: string,
  ): Promise<ClearOverdueTasksResponse> => {
    const response = await axiosInstance.delete<ClearOverdueTasksResponse>(
      `${BASE_URL}/tasks/clear-overdue`,
      {
        params: {
          overdueDays,
          ...(columnId ? { columnId } : {}),
        },
      },
    );
    return response.data;
  },

  moveTask: async (taskId: string, targetColumnId: string): Promise<void> => {
    await axiosInstance.patch(`${BASE_URL}/tasks/${taskId}/move`, null, {
      params: { targetColumnId }
    });
  },

  reorderTask: async (taskId: string, targetColumnId: string, previousOrderIndex?: number, nextOrderIndex?: number): Promise<TaskResponse> => {
    const params: any = { targetColumnId };
    if (previousOrderIndex !== undefined) params.previousOrderIndex = previousOrderIndex;
    if (nextOrderIndex !== undefined) params.nextOrderIndex = nextOrderIndex;
    
    const response = await axiosInstance.put<TaskResponse>(`${BASE_URL}/tasks/${taskId}/reorder`, null, { params });
    return response.data;
  },

  checkOverdue: async (): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/check-overdue`);
  },

  // Notes
  getNotes: async (): Promise<any[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/notes`);
    return response.data;
  },

  saveNote: async (content: string): Promise<any> => {
    const response = await axiosInstance.post(`${BASE_URL}/notes`, { content });
    return response.data;
  },

  // AI Agent
  generatePlanPreview: async (requirements: string): Promise<any> => {
    const response = await axiosInstance.post(`${BASE_URL}/ai/plan-preview`, { requirements });
    return response.data;
  },

  applyPlan: async (plan: TaskResponse[]): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/ai/apply-plan`, plan);
  }
};
