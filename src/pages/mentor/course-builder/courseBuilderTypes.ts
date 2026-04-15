import { SubmissionType } from '../../../data/assignmentDTOs';
import { QuestionType } from '../../../data/quizDTOs';

export type LessonKind = 'video' | 'reading' | 'quiz' | 'assignment';

export interface QuizOptionDraft {
  id: string;
  serverId?: number;
  text: string;
  correct: boolean;
  orderIndex?: number;
}

export interface QuizQuestionDraft {
  id: string;
  serverId?: number;
  text: string;
  type: QuestionType;
  score?: number;
  orderIndex?: number;
  options: QuizOptionDraft[];
}

export interface AssignmentCriteriaDraft {
  id?: number;
  clientId?: string;
  name: string;
  description?: string;
  maxPoints: number;
  passingPoints?: number;
  orderIndex: number;
  isRequired?: boolean;
}

export interface LessonAttachmentDraft {
  id?: string;
  serverId?: number;
  name?: string;
  url?: string;
  mediaId?: number;
}

export interface LessonDraft {
  id: string;
  serverId?: number;
  title: string;
  type: LessonKind;
  contentText?: string;
  resourceUrl?: string;
  youtubeUrl?: string;
  durationMin?: number;
  videoMediaId?: number;
  // Quiz fields
  passScore?: number;
  quizMaxAttempts?: number;
  quizTimeLimitMinutes?: number;
  roundingIncrement?: number;
  cooldownHours?: number;
  quizDescription?: string;
  gradingMethod?: string;
  aiGradingEnabled?: boolean;
  gradingStyle?: 'STANDARD' | 'STRICT' | 'LENIENT';
  questions?: QuizQuestionDraft[];
  // Assignment fields
  assignmentSubmissionType?: SubmissionType;
  assignmentDescription?: string;
  assignmentMaxScore?: number;
  assignmentPassingScore?: number;
  assignmentIsRequired?: boolean;
  assignmentCriteria?: AssignmentCriteriaDraft[];
  attachments?: LessonAttachmentDraft[];
}

export interface ModuleDraft {
  id: string;
  serverId?: number;
  title: string;
  description?: string;
  lessons: LessonDraft[];
}
