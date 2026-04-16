import { DisputeResolution } from "../../data/adminDTOs";
import {
  ShortTermJobStatus,
  SHORT_TERM_JOB_STATUS_DISPLAY,
} from "../../types/ShortTermJob";

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "purple";

export interface AdminShortTermJob {
  id: number;
  title?: string;
  description?: string;
  status?: string;
  isNegotiable?: boolean;
  budget?: number;
  urgency?: string;
  deadline?: string;
  estimatedDuration?: string;
  recruiterCompanyName?: string;
  recruiterEmail?: string;
  applicantCount?: number;
  isRemote?: boolean;
  location?: string | null;
  requiredSkills?: string[];
  createdAt?: string;
  updatedAt?: string;
  banned?: boolean;
  isBanned?: boolean;
  [key: string]: unknown;
}

export interface AdminPendingJob {
  id: number;
  title?: string;
  description?: string;
  status?: string;
  isNegotiable?: boolean;
  recruiterCompanyName?: string;
  recruiterEmail?: string;
  createdAt?: string;
  deadline?: string;
  budget?: number;
  minBudget?: number;
  maxBudget?: number;
  isRemote?: boolean;
  location?: string | null;
  applicantCount?: number;
  requiredSkills?: string[];
  _jobType: "FULL_TIME" | "SHORT_TERM";
}

const UNKNOWN_COMPANY_FALLBACK = "Không rõ công ty";
const NORMALIZED_EMPTY_TEXT = new Set([
  "n/a",
  "na",
  "unknown",
  "unknown company",
  "không rõ công ty",
  "null",
  "undefined",
]);

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

const getNestedValue = (
  source: Record<string, unknown> | null,
  path: string[],
): unknown => {
  let current: unknown = source;

  for (const key of path) {
    const record = asRecord(current);
    if (!record || !(key in record)) {
      return undefined;
    }
    current = record[key];
  }

  return current;
};

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const normalized = trimmed.toLowerCase();
  if (NORMALIZED_EMPTY_TEXT.has(normalized)) {
    return undefined;
  }

  return trimmed;
};

const pickFirstMeaningfulText = (
  ...candidates: unknown[]
): string | undefined => {
  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
};

export const resolveRecruiterCompanyName = (
  source: unknown,
  fallback: string = UNKNOWN_COMPANY_FALLBACK,
): string => {
  const record = asRecord(source);

  const companyName = pickFirstMeaningfulText(
    record?.recruiterCompanyName,
    record?.companyName,
    getNestedValue(record, ["recruiterInfo", "companyName"]),
    getNestedValue(record, ["recruiterProfile", "companyName"]),
    getNestedValue(record, ["recruiter", "companyName"]),
    getNestedValue(record, ["recruiter", "recruiterProfile", "companyName"]),
  );

  return companyName ?? fallback;
};

export const resolveRecruiterEmail = (source: unknown): string | undefined => {
  const record = asRecord(source);

  return pickFirstMeaningfulText(
    record?.recruiterEmail,
    record?.email,
    getNestedValue(record, ["recruiter", "email"]),
    getNestedValue(record, ["recruiterInfo", "email"]),
    getNestedValue(record, ["recruiterProfile", "email"]),
    getNestedValue(record, ["recruiterProfile", "user", "email"]),
    getNestedValue(record, ["recruiter", "user", "email"]),
    getNestedValue(record, ["user", "email"]),
  );
};

export const formatCurrency = (amount?: number | null) => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "N/A";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatBudgetRange = (job: {
  isNegotiable?: boolean;
  budget?: number;
  minBudget?: number;
  maxBudget?: number;
}) => {
  if (job.isNegotiable) {
    return "Thỏa thuận";
  }

  if (job.budget !== undefined && job.budget !== null) {
    if (job.budget === 0) {
      return "Thỏa thuận";
    }
    return formatCurrency(job.budget);
  }

  if (job.minBudget !== undefined && job.maxBudget !== undefined) {
    if (job.minBudget === 0 && job.maxBudget === 0) {
      return "Thỏa thuận";
    }
    return `${formatCurrency(job.minBudget)} - ${formatCurrency(job.maxBudget)}`;
  }

  return "N/A";
};

export const getShortTermStatusLabel = (status?: string) => {
  if (!status) return "N/A";
  const mapped = SHORT_TERM_JOB_STATUS_DISPLAY[status as ShortTermJobStatus];
  return mapped?.text ?? status;
};

export const getFullTimeStatusLabel = (status?: string) => {
  if (!status) return "N/A";

  const labels: Record<string, string> = {
    IN_PROGRESS: "Bản nháp",
    PENDING_APPROVAL: "Chờ duyệt",
    OPEN: "Đang tuyển",
    REJECTED: "Bị từ chối",
    CLOSED: "Đã đóng",
  };

  return labels[status] ?? status;
};

export const getUrgencyLabel = (urgency?: string) => {
  if (!urgency) return "Không xác định";

  const labels: Record<string, string> = {
    NORMAL: "Bình thường",
    URGENT: "Gấp",
    VERY_URGENT: "Rất gấp",
    ASAP: "Ngay lập tức",
  };

  return labels[urgency] ?? urgency;
};

export const getDisputeStatusLabel = (status?: string) => {
  if (!status) return "N/A";

  const labels: Record<string, string> = {
    OPEN: "Mở",
    UNDER_INVESTIGATION: "Đang điều tra",
    AWAITING_RESPONSE: "Chờ phản hồi",
    RESOLVED: "Đã giải quyết",
    DISMISSED: "Bị bác",
    ESCALATED: "Leo thang",
  };

  return labels[status] ?? status;
};

export const getDisputeTypeLabel = (type?: string) => {
  if (!type) return "Khác";

  const labels: Record<string, string> = {
    NO_SUBMISSION: "Không nộp bài",
    POOR_QUALITY: "Chất lượng kém",
    MISSING_DELIVERABLE: "Thiếu bàn giao",
    DEADLINE_VIOLATION: "Vi phạm deadline",
    PAYMENT_ISSUE: "Vấn đề thanh toán",
    COMMUNICATION_FAILURE: "Lỗi giao tiếp",
    SCOPE_CHANGE: "Thay đổi phạm vi",
    SCAM_REPORT: "Báo lừa đảo",
    WORKER_PROTECTION: "Bảo vệ ứng viên",
    RECRUITER_ABUSE: "Recruiter lạm dụng",
    CANCELLATION_REVIEW: "Xét duyệt yêu cầu hủy",
    OTHER: "Khác",
  };

  return labels[type] ?? type;
};

export const getResolutionLabel = (resolution?: DisputeResolution) => {
  if (!resolution) return "Chưa có";

  const labels: Partial<Record<DisputeResolution, string>> = {
    CANCEL_JOB: "Hủy job",
    FULL_REFUND: "Hoàn tiền toàn phần",
    FULL_RELEASE: "Giải ngân toàn phần",
    PARTIAL_REFUND: "Hoàn tiền một phần",
    PARTIAL_RELEASE: "Giải ngân một phần",
    RESUBMIT_REQUIRED: "Yêu cầu nộp lại",
    NO_ACTION: "Không xử lý",
    WORKER_WINS: "Ứng viên thắng",
    WORKER_PARTIAL: "Ứng viên thắng một phần",
    RECRUITER_WINS: "Nhà tuyển dụng thắng",
    RECRUITER_WARNING: "Cảnh báo recruiter",
  };

  return labels[resolution] ?? resolution;
};

export const getShortTermStatusTone = (status?: string): StatusTone => {
  if (!status) return "neutral";

  const tones: Record<string, StatusTone> = {
    DRAFT: "neutral",
    PENDING_APPROVAL: "warning",
    PUBLISHED: "info",
    APPLIED: "info",
    IN_PROGRESS: "purple",
    SUBMITTED: "purple",
    UNDER_REVIEW: "warning",
    APPROVED: "success",
    COMPLETED: "success",
    PAID: "success",
    REJECTED: "danger",
    CANCELLED: "neutral",
    DISPUTED: "danger",
    ESCALATED: "danger",
    CLOSED: "neutral",
  };

  return tones[status] ?? "neutral";
};

export const getFullTimeStatusTone = (status?: string): StatusTone => {
  if (!status) return "neutral";

  const tones: Record<string, StatusTone> = {
    IN_PROGRESS: "neutral",
    PENDING_APPROVAL: "warning",
    OPEN: "success",
    REJECTED: "danger",
    CLOSED: "info",
  };

  return tones[status] ?? "neutral";
};

export const getDisputeStatusTone = (status?: string): StatusTone => {
  if (!status) return "neutral";

  const tones: Record<string, StatusTone> = {
    OPEN: "danger",
    UNDER_INVESTIGATION: "warning",
    AWAITING_RESPONSE: "info",
    RESOLVED: "success",
    DISMISSED: "neutral",
    ESCALATED: "purple",
  };

  return tones[status] ?? "neutral";
};

export const isJobBanned = (job: AdminShortTermJob) => {
  return Boolean(job.banned || job.isBanned);
};

export const canModifyShortTermJob = (status?: string) => {
  if (!status) return true;
  return !["COMPLETED", "PAID", "CLOSED"].includes(status);
};
