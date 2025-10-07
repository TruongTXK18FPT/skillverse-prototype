// Lesson DTOs - Matching Backend Structure

export enum LessonType {
  VIDEO = 'VIDEO',
  READING = 'READING',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  CODELAB = 'CODELAB'
}

// Lesson Detail DTO
export interface LessonDetailDTO {
  id: number;
  title: string;
  type: LessonType;
  orderIndex: number;
  durationSec: number;
  contentText?: string;
  videoUrl?: string;
  videoMediaId?: number;
  moduleId: number;
  createdAt: string;
  updatedAt: string;
}

// Lesson Summary DTO
export interface LessonSummaryDTO {
  id: number;
  title: string;
  type: LessonType;
  orderIndex: number;
  durationSec: number;
}

// Lesson Create DTO
export interface LessonCreateDTO {
  title: string;
  type: LessonType;
  orderIndex: number;
  durationSec: number;
  contentText?: string;
  videoUrl?: string;
  videoMediaId?: number;
}

// Lesson Update DTO
export interface LessonUpdateDTO {
  title?: string;
  type?: LessonType;
  orderIndex?: number;
  durationSec?: number;
  contentText?: string;
  videoUrl?: string;
  videoMediaId?: number;
}

// Lesson Progress DTO (Deprecated - Use ModuleProgressDTO instead)
export interface LessonProgressDTO {
  id: number;
  lessonId: number;
  userId: number;
  completed: boolean;
  progressPercent: number;
  lastAccessedAt: string;
  completedAt?: string;
}

// Lesson Progress Create DTO (Deprecated - Use ModuleProgressDTO instead)
export interface LessonProgressCreateDTO {
  lessonId: number;
  progressPercent: number;
  completed: boolean;
}
