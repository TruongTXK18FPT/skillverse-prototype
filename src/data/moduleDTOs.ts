// Module DTOs - Matching Backend Structure

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

// Module Detail DTO
export interface ModuleDetailDTO {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  courseId: number;
  createdAt: string;
  updatedAt: string;
  lessons?: any[]; // Can be typed as LessonBriefDTO[] if needed
}

// Module Summary DTO
export interface ModuleSummaryDTO {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  courseId?: number;
}

// Module Create DTO
export interface ModuleCreateDTO {
  title: string;
  description: string;
  orderIndex: number;
}

// Module Update DTO
export interface ModuleUpdateDTO {
  title?: string;
  description?: string;
  orderIndex?: number;
}

// Module Progress Detail DTO
export interface ModuleProgressDetailDTO {
  moduleId: number;
  status: ProgressStatus;
  timeSpentSec: number;
  lastPositionSec?: number;
  updatedAt: string;
}

// Module Progress Update DTO
export interface ModuleProgressUpdateDTO {
  status?: ProgressStatus;
  timeSpentSec?: number;
  lastPositionSec?: number;
}

// Module Progress Create DTO
export interface ModuleProgressCreateDTO {
  moduleId: number;
  status: ProgressStatus;
  timeSpentSec: number;
  lastPositionSec?: number;
}
