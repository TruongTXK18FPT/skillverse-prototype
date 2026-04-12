import { SubmissionStatus } from '../data/assignmentDTOs';

export const hasAssignmentDueDate = (dueAt?: string | null): boolean => Boolean(dueAt);

export const isAssignmentPastDue = (dueAt?: string | null, now = new Date()): boolean => {
  if (!dueAt) {
    return false;
  }

  return new Date(dueAt) < now;
};

export const getSubmissionWorkflowLabel = (status?: SubmissionStatus | string | null): string => {
  switch (status) {
    case SubmissionStatus.GRADED:
    case SubmissionStatus.AI_COMPLETED:
      return 'Đã chấm';
    case SubmissionStatus.AI_PENDING:
      return 'Chờ mentor xác nhận';
    case SubmissionStatus.LATE_PENDING:
    case SubmissionStatus.PENDING:
      return 'Chờ chấm';
    default:
      return 'Chờ xử lý';
  }
};

export const getSubmissionWorkflowTone = (status?: SubmissionStatus | string | null): 'graded' | 'pending' | 'ai-pending' =>
  status === SubmissionStatus.GRADED || status === SubmissionStatus.AI_COMPLETED
    ? 'graded'
    : status === SubmissionStatus.AI_PENDING
    ? 'ai-pending'
    : 'pending';

export const getSubmissionTimingInfo = (
  dueAt?: string | null,
  isLate?: boolean | null
): { text: 'Trong hạn' | 'Nộp muộn'; tone: 'on-time' | 'late' } | null => {
  if (!dueAt) {
    return null;
  }

  return isLate
    ? { text: 'Nộp muộn', tone: 'late' }
    : { text: 'Trong hạn', tone: 'on-time' };
};
