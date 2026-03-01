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
      return 'Đã chấm';
    case SubmissionStatus.LATE_PENDING:
    case SubmissionStatus.PENDING:
      return 'Chờ chấm';
    default:
      return 'Chờ xử lý';
  }
};

export const getSubmissionWorkflowTone = (status?: SubmissionStatus | string | null): 'graded' | 'pending' =>
  status === SubmissionStatus.GRADED ? 'graded' : 'pending';

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
