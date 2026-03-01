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
  certificateId?: number | null;
  certificateSerial?: string | null;
  certificateRevoked?: boolean | null;
  certificateRevokedAt?: string | null;
}
