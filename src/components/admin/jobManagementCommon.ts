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
  budget?: number;
  urgency?: string;
  deadline?: string;
  estimatedDuration?: string;
  recruiterCompanyName?: string;
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
  recruiterCompanyName?: string;
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
  budget?: number;
  minBudget?: number;
  maxBudget?: number;
}) => {
  if (job.budget !== undefined && job.budget !== null) {
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
