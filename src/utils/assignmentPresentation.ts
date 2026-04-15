import { SubmissionStatus } from '../data/assignmentDTOs';

// DEADCODE: deadline/late feature removed 2026-04-15 — no deadline input in mentor form
// These functions are kept for future use if deadline feature is re-implemented.
// All return null/false because assignment.dueAt is always null.

// DEADCODE — always returns false (no deadline input in mentor form)
export const hasAssignmentDueDate = (dueAt?: string | null): boolean => Boolean(dueAt);

// DEADCODE — always returns false (no deadline input in mentor form)
export const isAssignmentPastDue = (dueAt?: string | null, now = new Date()): boolean => {
  if (!dueAt) return false;
  return new Date(dueAt) < now;
};

export const getSubmissionWorkflowLabel = (status?: SubmissionStatus | string | null): string => {
  switch (status) {
    case SubmissionStatus.GRADED:
    case SubmissionStatus.AI_COMPLETED:
      return 'Đã chấm';
    case SubmissionStatus.AI_PENDING:
      return 'Chờ mentor xác nhận';
    case SubmissionStatus.PENDING:
      return 'Chờ chấm';
    // LATE_PENDING removed 2026-04-15 — DEADCODE
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

/** DEADCODE — always returns null because assignment.dueAt is always null */
export const getSubmissionTimingInfo = (
  dueAt?: string | null,
  isLate?: boolean | null
): { text: 'Trong hạn' | 'Nộp muộn'; tone: 'on-time' | 'late' } | null => {
  if (!dueAt) return null;  // no deadline set → no timing info
  return isLate
    ? { text: 'Nộp muộn', tone: 'late' }
    : { text: 'Trong hạn', tone: 'on-time' };
};
