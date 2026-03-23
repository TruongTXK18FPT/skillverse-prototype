export interface LearningResultHistoryItemDTO {
  itemId: number;
  itemType: 'QUIZ' | 'ASSIGNMENT' | string;
  title: string;
  scoreLabel?: string | null;
  completedAt?: string | null;
}

export interface CourseLearningStatusDTO {
  courseId: number;
  userId: number;
  completedLessonIds: number[];
  completedQuizIds: number[];
  completedAssignmentIds: number[];
  completedLessonCount: number;
  totalLessonCount: number;
  completedQuizCount: number;
  totalQuizCount: number;
  completedRequiredAssignmentCount: number;
  totalRequiredAssignmentCount: number;
  completedItemCount: number;
  totalItemCount: number;
  percent: number;
  legacyQuizResults?: LearningResultHistoryItemDTO[];
  legacyAssignmentResults?: LearningResultHistoryItemDTO[];
  certificateId?: number | null;
  certificateSerial?: string | null;
  certificateRevoked?: boolean | null;
  certificateRevokedAt?: string | null;
}

export interface CourseLearningRevisionInfoDTO {
  courseId: number;
  userId: number;
  learningRevisionId: number | null;
  activeRevisionId: number | null;
  latestRevisionId: number | null;
  upgradePolicy: string | null;
  hasNewerRevision: boolean;
}

export type RevisionInfoResponse = CourseLearningRevisionInfoDTO;

export type UpgradeToActiveResponse = CourseLearningRevisionInfoDTO;
