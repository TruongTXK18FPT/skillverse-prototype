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
  getBoard: async (): Promise<TaskColumnResponse[]> => {
    const response = await axiosInstance.get<TaskColumnResponse[]>(`${BASE_URL}`);
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
