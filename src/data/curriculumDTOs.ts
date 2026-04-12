import { LessonType } from './lessonDTOs';
import { SubmissionType, AssignmentCriteriaDTO } from './assignmentDTOs';
import { QuizGradingMethod, QuizQuestionCreateDTO } from './quizDTOs';

export enum CurriculumItemType {
  LESSON = 'LESSON',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT'
}

export interface CurriculumItemUpsertDTO {
  id?: number;
  clientId?: string;
  type: CurriculumItemType;
  title?: string;
  description?: string;
  orderIndex?: number;

  lessonType?: LessonType;
  durationSec?: number;
  contentText?: string;
  resourceUrl?: string;
  videoUrl?: string;

  passScore?: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  roundingIncrement?: number;
  gradingMethod?: QuizGradingMethod;
  cooldownHours?: number;
  questions?: QuizQuestionCreateDTO[];

  submissionType?: SubmissionType;
  maxScore?: number;
  passingScore?: number;
  dueAt?: string;
  criteria?: AssignmentCriteriaDTO[];
}

export interface ModuleUpsertDTO {
  id?: number;
  clientId?: string;
  title: string;
  description?: string;
  orderIndex?: number;
  items?: CurriculumItemUpsertDTO[];
}

export interface CurriculumUpsertRequestDTO {
  replaceMissing?: boolean;
  modules: ModuleUpsertDTO[];
}

export interface CurriculumUpsertResponseDTO {
  modules: ModuleUpsertDTO[];
}
