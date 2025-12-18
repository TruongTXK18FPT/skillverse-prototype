import { StudySessionResponse, StudySessionStatus } from './StudyPlan';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  priority: TaskPriority;
  status?: string;
  userProgress?: number; // 0-100
  satisfactionLevel?: string;
  userNotes?: string;
  columnId: string;
  linkedSessionIds?: string[];
}

export interface TaskColumnResponse {
  id: string;
  name: string;
  color?: string;
  orderIndex: number;
  tasks: TaskResponse[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  priority: TaskPriority;
  userProgress?: number;
  satisfactionLevel?: string;
  userNotes?: string;
  columnId: string;
  linkedSessionIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  priority?: TaskPriority;
  columnId?: string;
  status?: string;
  userProgress?: number;
  satisfactionLevel?: string;
  userNotes?: string;
  linkedSessionIds?: string[];
}

export interface DashboardNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}
