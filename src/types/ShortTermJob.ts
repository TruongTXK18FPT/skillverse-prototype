// ==================== ENUMS FOR SHORT-TERM JOBS ====================

/**
 * Loại hình công việc: Ngắn hạn vs Dài hạn
 */
export enum JobCategory {
  SHORT_TERM = "SHORT_TERM", // Gig/Freelance work - làm ngay
  LONG_TERM = "LONG_TERM", // Traditional employment
}

/**
 * Status workflow cho Job Ngắn hạn
 * Flow: Draft → Published → Applied → In Progress → Submitted → Under Review → Approved/Rejected → Completed → Paid
 */
export enum ShortTermJobStatus {
  DRAFT = "DRAFT", // Recruiter đang soạn
  PENDING_APPROVAL = "PENDING_APPROVAL", // Đã gửi duyệt, chờ admin phê duyệt
  PUBLISHED = "PUBLISHED", // Đã đăng, chờ ứng viên
  APPLIED = "APPLIED", // Có ứng viên đã apply
  IN_PROGRESS = "IN_PROGRESS", // Ứng viên đang làm việc
  SUBMITTED = "SUBMITTED", // Ứng viên đã nộp bài (bàn giao)
  UNDER_REVIEW = "UNDER_REVIEW", // Recruiter đang review
  APPROVED = "APPROVED", // Công việc được approve
  REJECTED = "REJECTED", // Công việc bị reject, cần làm lại
  COMPLETED = "COMPLETED", // Hoàn thành
  PAID = "PAID", // Đã thanh toán
  CANCELLED = "CANCELLED", // Đã hủy
  DISPUTED = "DISPUTED", // Đang tranh chấp
}

/**
 * Status workflow cho Job Dài hạn (mở rộng)
 */
export enum LongTermJobStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  PUBLISHED = "PUBLISHED",
  APPLIED = "APPLIED",
  INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED",
  INTERVIEWED = "INTERVIEWED",
  OFFER_SENT = "OFFER_SENT",
  OFFER_ACCEPTED = "OFFER_ACCEPTED",
  OFFER_REJECTED = "OFFER_REJECTED",
  CONTRACT_SIGNED = "CONTRACT_SIGNED",
  PROBATION = "PROBATION",
  EMPLOYED = "EMPLOYED",
  EXTENDED = "EXTENDED",
  TERMINATED = "TERMINATED",
  RESIGNED = "RESIGNED",
  CLOSED = "CLOSED",
}

/**
 * Status cho application của ứng viên trong job ngắn hạn
 */
export enum ShortTermApplicationStatus {
  PENDING = "PENDING", // Chờ duyệt
  ACCEPTED = "ACCEPTED", // Được chọn làm
  REJECTED = "REJECTED", // Không được chọn
  WORKING = "WORKING", // Đang làm việc
  IN_PROGRESS = "IN_PROGRESS", // Alias cho WORKING - đang thực hiện
  SUBMITTED = "SUBMITTED", // Đã nộp deliverables
  REVISION_REQUIRED = "REVISION_REQUIRED", // Cần sửa lại
  APPROVED = "APPROVED", // Công việc được approve
  COMPLETED = "COMPLETED", // Hoàn thành
  PAID = "PAID", // Đã thanh toán
  CANCELLED = "CANCELLED", // Bị hủy
  WITHDRAWN = "WITHDRAWN", // Rút đơn
}

/**
 * Loại deliverable có thể upload
 */
export enum DeliverableType {
  FILE = "FILE",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  LINK = "LINK",
  CODE = "CODE",
  OTHER = "OTHER",
}

/**
 * Urgency level cho job ngắn hạn
 */
export enum JobUrgency {
  NORMAL = "NORMAL", // Bình thường
  URGENT = "URGENT", // Gấp (trong 24h)
  VERY_URGENT = "VERY_URGENT", // Rất gấp (trong vài giờ)
  ASAP = "ASAP", // Cần ngay lập tức
}

// ==================== INTERFACES ====================

/**
 * Interface cho Short-term Job Posting
 */
export interface ShortTermJobPosting {
  id: number;
  title: string;
  description: string;
  requiredSkills: string[];
  category: JobCategory;

  // Pricing
  budget: number; // Fixed price
  isNegotiable: boolean;
  paymentMethod: "FIXED" | "HOURLY" | "MILESTONE";

  // Timing
  deadline: string; // Deadline nộp bài
  estimatedDuration: string; // Thời gian ước tính (e.g., "2 hours", "1 day")
  urgency: JobUrgency;
  startTime?: string; // Thời gian bắt đầu (optional)

  // Work settings
  isRemote: boolean;
  location?: string;

  // Status
  status: ShortTermJobStatus;
  applicantCount: number;
  selectedApplicantId?: number;

  // Milestones (optional)
  milestones?: Milestone[];

  // Requirements
  maxApplicants?: number;
  minRating?: number; // Yêu cầu rating tối thiểu

  // Recruiter info
  recruiterId: number;
  recruiterCompanyName: string;
  recruiterRating?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  completedAt?: string;
  paidAt?: string;
}

/**
 * Milestone cho job phức tạp
 */
export interface Milestone {
  id: number;
  title: string;
  description: string;
  amount: number; // Số tiền cho milestone
  deadline: string;
  status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REJECTED";
  order: number;
  deliverables?: Deliverable[];
  completedAt?: string;
}

/**
 * Deliverable - file bàn giao
 */
export interface Deliverable {
  id: number;
  type: DeliverableType;
  fileName: string;
  fileUrl: string;
  fileSize: number; // bytes
  mimeType: string;
  description?: string;
  uploadedAt: string;
  uploadedBy: number; // userId
  milestoneId?: number;
}

/**
 * Application cho Short-term Job
 */
export interface ShortTermJobApplication {
  id: number;
  jobId: number;
  jobTitle: string;
  userId: number;
  userFullName: string;
  userEmail: string;
  userRating?: number;
  userCompletedJobs?: number;

  // Application details
  coverLetter?: string;
  proposedPrice?: number; // Giá đề xuất (nếu negotiable)
  proposedDuration?: string; // Thời gian đề xuất
  portfolio?: string[]; // Links to relevant work

  // Status
  status: ShortTermApplicationStatus;
  appliedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;

  // Work submission
  deliverables?: Deliverable[];
  workNote?: string; // Ghi chú khi bàn giao

  // Review history
  revisionCount: number;
  revisionNotes?: RevisionNote[];
  submissionCount?: number;
}

/**
 * Note cho revision request
 */
export interface RevisionNote {
  id: number;
  applicationId: number;
  note: string;
  requestedBy: number; // userId
  requestedAt: string;
  resolvedAt?: string;
}

/**
 * Audit log cho status changes
 */
export interface JobStatusAuditLog {
  id: number;
  jobId: number;
  applicationId?: number;
  previousStatus: string;
  newStatus: string;
  changedBy: number; // userId
  changedByRole: "RECRUITER" | "CANDIDATE" | "ADMIN" | "SYSTEM";
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ==================== REQUEST DTOs ====================

/**
 * Payment method type alias
 */
export type PaymentMethod = "FIXED" | "HOURLY" | "MILESTONE";

export interface CreateShortTermJobRequest {
  title: string;
  description: string;
  requiredSkills: string[];
  budget: number;
  isNegotiable?: boolean;
  paymentMethod?: PaymentMethod;
  deadline: string;
  estimatedDuration: string;
  urgency?: JobUrgency;
  startTime?: string;
  isRemote: boolean;
  location?: string;
  maxApplicants?: number;
  minRating?: number;
  milestones?: CreateMilestoneRequest[];
  // Extended fields for form UI
  requirements?: string;
  workDeadline?: string;
  subCategory?: string;
  allowsRevision?: boolean;
  maxRevisions?: number;
  deliverableTypes?: DeliverableType[];
  tags?: string[];
}

export interface UpdateShortTermJobRequest {
  title?: string;
  description?: string;
  requiredSkills?: string[];
  budget?: number;
  isNegotiable?: boolean;
  paymentMethod?: "FIXED" | "HOURLY" | "MILESTONE";
  deadline?: string;
  estimatedDuration?: string;
  urgency?: JobUrgency;
  startTime?: string;
  isRemote?: boolean;
  location?: string;
  maxApplicants?: number;
  minRating?: number;
}

export interface CreateMilestoneRequest {
  title: string;
  description: string;
  amount: number;
  deadline: string;
  order: number;
}

export interface ApplyShortTermJobRequest {
  coverLetter?: string;
  proposedPrice?: number;
  proposedDuration?: string;
  portfolio?: string[];
}

export interface SubmitDeliverableRequest {
  applicationId: number;
  milestoneId?: number;
  files: File[];
  workNote?: string;
  links?: string[];
  isFinalSubmission?: boolean;
}

export interface RequestRevisionRequest {
  applicationId: number;
  note: string;
  specificIssues?: string[];
}

// ==================== RESPONSE DTOs ====================

export interface ShortTermJobPostingResponse extends ShortTermJobPosting {
  recruiterProfile?: {
    companyName: string;
    rating: number;
    totalJobsPosted: number;
    completionRate: number;
  };
}

export interface ShortTermJobApplicationResponse extends ShortTermJobApplication {
  jobDetails?: {
    title: string;
    budget: number;
    deadline: string;
    recruiterCompanyName: string;
  };
}

// ==================== FILTER TYPES ====================

export interface ShortTermJobFilters {
  search?: string;
  skills?: string[];
  minBudget?: number;
  maxBudget?: number;
  urgency?: JobUrgency;
  isRemote?: boolean;
  status?: ShortTermJobStatus;
  maxDuration?: string;
}

// ==================== STATUS TRANSITION RULES ====================

/**
 * Allowed status transitions cho Short-term Job
 */
export const SHORT_TERM_JOB_TRANSITIONS: Record<
  ShortTermJobStatus,
  ShortTermJobStatus[]
> = {
  [ShortTermJobStatus.DRAFT]: [
    ShortTermJobStatus.PENDING_APPROVAL,
    ShortTermJobStatus.CANCELLED,
  ],
  [ShortTermJobStatus.PENDING_APPROVAL]: [
    ShortTermJobStatus.PUBLISHED,
    ShortTermJobStatus.REJECTED,
    ShortTermJobStatus.CANCELLED,
  ],
  [ShortTermJobStatus.PUBLISHED]: [
    ShortTermJobStatus.APPLIED,
    ShortTermJobStatus.CANCELLED,
  ],
  [ShortTermJobStatus.APPLIED]: [
    ShortTermJobStatus.IN_PROGRESS,
    ShortTermJobStatus.CANCELLED,
  ],
  [ShortTermJobStatus.IN_PROGRESS]: [
    ShortTermJobStatus.SUBMITTED,
    ShortTermJobStatus.CANCELLED,
    ShortTermJobStatus.DISPUTED,
  ],
  [ShortTermJobStatus.SUBMITTED]: [ShortTermJobStatus.UNDER_REVIEW],
  [ShortTermJobStatus.UNDER_REVIEW]: [
    ShortTermJobStatus.APPROVED,
    ShortTermJobStatus.REJECTED,
  ],
  [ShortTermJobStatus.APPROVED]: [ShortTermJobStatus.COMPLETED],
  [ShortTermJobStatus.REJECTED]: [ShortTermJobStatus.IN_PROGRESS], // Allow revision
  [ShortTermJobStatus.COMPLETED]: [ShortTermJobStatus.PAID],
  [ShortTermJobStatus.PAID]: [],
  [ShortTermJobStatus.CANCELLED]: [],
  [ShortTermJobStatus.DISPUTED]: [
    ShortTermJobStatus.APPROVED,
    ShortTermJobStatus.REJECTED,
    ShortTermJobStatus.CANCELLED,
  ],
};

/**
 * Allowed status transitions cho Application
 */
export const APPLICATION_TRANSITIONS: Record<
  ShortTermApplicationStatus,
  ShortTermApplicationStatus[]
> = {
  [ShortTermApplicationStatus.PENDING]: [
    ShortTermApplicationStatus.ACCEPTED,
    ShortTermApplicationStatus.REJECTED,
    ShortTermApplicationStatus.WITHDRAWN,
  ],
  [ShortTermApplicationStatus.ACCEPTED]: [ShortTermApplicationStatus.WORKING],
  [ShortTermApplicationStatus.REJECTED]: [],
  [ShortTermApplicationStatus.WORKING]: [
    ShortTermApplicationStatus.SUBMITTED,
    ShortTermApplicationStatus.CANCELLED,
  ],
  [ShortTermApplicationStatus.IN_PROGRESS]: [
    ShortTermApplicationStatus.SUBMITTED,
    ShortTermApplicationStatus.CANCELLED,
  ],
  [ShortTermApplicationStatus.SUBMITTED]: [
    ShortTermApplicationStatus.REVISION_REQUIRED,
    ShortTermApplicationStatus.APPROVED,
  ],
  [ShortTermApplicationStatus.REVISION_REQUIRED]: [
    ShortTermApplicationStatus.SUBMITTED,
  ],
  [ShortTermApplicationStatus.APPROVED]: [ShortTermApplicationStatus.COMPLETED],
  [ShortTermApplicationStatus.COMPLETED]: [ShortTermApplicationStatus.PAID],
  [ShortTermApplicationStatus.PAID]: [],
  [ShortTermApplicationStatus.CANCELLED]: [],
  [ShortTermApplicationStatus.WITHDRAWN]: [],
};

// ==================== VALIDATION HELPERS ====================

/**
 * Check if a status transition is allowed
 */
export function isValidJobStatusTransition(
  currentStatus: ShortTermJobStatus,
  newStatus: ShortTermJobStatus,
): boolean {
  return (
    SHORT_TERM_JOB_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false
  );
}

export function isValidApplicationStatusTransition(
  currentStatus: ShortTermApplicationStatus,
  newStatus: ShortTermApplicationStatus,
): boolean {
  return APPLICATION_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Get role permissions for status changes
 */
export function canChangeJobStatus(
  currentStatus: ShortTermJobStatus,
  newStatus: ShortTermJobStatus,
  role: "RECRUITER" | "CANDIDATE" | "ADMIN",
): boolean {
  // Check if transition is valid first
  if (!isValidJobStatusTransition(currentStatus, newStatus)) {
    return false;
  }

  // Role-based permissions
  const recruiterAllowed: ShortTermJobStatus[] = [
    ShortTermJobStatus.DRAFT,
    ShortTermJobStatus.PUBLISHED,
    ShortTermJobStatus.IN_PROGRESS,
    ShortTermJobStatus.UNDER_REVIEW,
    ShortTermJobStatus.APPROVED,
    ShortTermJobStatus.REJECTED,
    ShortTermJobStatus.COMPLETED,
    ShortTermJobStatus.CANCELLED,
  ];

  const candidateAllowed: ShortTermJobStatus[] = [ShortTermJobStatus.SUBMITTED];

  switch (role) {
    case "ADMIN":
      return true; // Admin can do anything
    case "RECRUITER":
      return recruiterAllowed.includes(newStatus);
    case "CANDIDATE":
      return candidateAllowed.includes(newStatus);
    default:
      return false;
  }
}

// ==================== REVIEW/RATING INTERFACES ====================

/**
 * Job Review - đánh giá hai chiều
 */
export interface JobReview {
  id: number;
  applicationId: number;
  jobTitle: string;

  // Reviewer info
  reviewerId: number;
  reviewerName: string;
  reviewerAvatar?: string;

  // Reviewee info
  revieweeId: number;
  revieweeName: string;
  revieweeAvatar?: string;

  reviewType: "RECRUITER_TO_CANDIDATE" | "CANDIDATE_TO_RECRUITER";

  // Rating
  rating: number; // 1-5 sao
  comment?: string;
  strengths?: string;
  improvements?: string;
  recommendations?: string;

  // Specific ratings
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;

  isPublic: boolean;

  createdAt: string;
  updatedAt: string;
}

/**
 * Rating summary cho profile
 */
export interface UserRatingSummary {
  userId: number;
  userName: string;
  userAvatar?: string;

  averageRating?: number;
  totalReviews: number;
  totalCompletedJobs: number;

  // Breakdown by rating
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;

  // Average specific ratings
  averageCommunicationRating?: number;
  averageQualityRating?: number;
  averageTimelinessRating?: number;
  averageProfessionalismRating?: number;

  // Completion rate
  completionRate: number; // percentage
}

// ==================== REQUEST/RESPONSE TYPES FOR SERVICES ====================

export interface ShortTermJobResponse extends ShortTermJobPosting {
  recruiterInfo?: {
    id: number;
    companyName: string;
    rating?: number;
    totalJobsPosted?: number;
    completionRate?: number;
  };
  isExpired?: boolean;
  canApply?: boolean;
}

export interface ShortTermApplicationResponse extends ShortTermJobApplication {
  jobBudget?: number;
  userAvatar?: string;
  jobDetails?: {
    title: string;
    budget: number;
    deadline: string;
    recruiterCompanyName?: string;
  };
}

export type JobReviewResponse = JobReview;

export interface UpdateShortTermApplicationStatusRequest {
  status: ShortTermApplicationStatus;
  message?: string;
  reason?: string;
}

export interface CreateJobReviewRequest {
  applicationId: number;
  rating: number;
  comment?: string;
  strengths?: string;
  improvements?: string;
  recommendations?: string;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  isPublic?: boolean;
  // Extended fields for review form UI
  overallRating?: number;
  content?: string;
  areasForImprovement?: string;
  wouldRecommend?: boolean;
}

// ==================== STATUS DISPLAY HELPERS ====================

/**
 * Get status display info
 */
export interface StatusDisplayInfo {
  text: string;
  color: string;
  icon?: string;
  description?: string;
}

export const SHORT_TERM_JOB_STATUS_DISPLAY: Record<
  ShortTermJobStatus,
  StatusDisplayInfo
> = {
  [ShortTermJobStatus.DRAFT]: {
    text: "Bản Nháp",
    color: "gray",
    icon: "📝",
    description: "Job đang được soạn thảo",
  },
  [ShortTermJobStatus.PENDING_APPROVAL]: {
    text: "Chờ Duyệt",
    color: "yellow",
    icon: "🔒",
    description: "Đã gửi duyệt, chờ admin phê duyệt",
  },
  [ShortTermJobStatus.PUBLISHED]: {
    text: "Đã Đăng",
    color: "blue",
    icon: "📢",
    description: "Job đã được đăng công khai",
  },
  [ShortTermJobStatus.APPLIED]: {
    text: "Có Ứng Viên",
    color: "cyan",
    icon: "👥",
    description: "Có ứng viên đã ứng tuyển",
  },
  [ShortTermJobStatus.IN_PROGRESS]: {
    text: "Đang Thực Hiện",
    color: "orange",
    icon: "⚡",
    description: "Ứng viên đang làm việc",
  },
  [ShortTermJobStatus.SUBMITTED]: {
    text: "Đã Nộp Bài",
    color: "purple",
    icon: "📤",
    description: "Ứng viên đã bàn giao công việc",
  },
  [ShortTermJobStatus.UNDER_REVIEW]: {
    text: "Đang Xem Xét",
    color: "yellow",
    icon: "🔍",
    description: "Recruiter đang xem xét deliverables",
  },
  [ShortTermJobStatus.APPROVED]: {
    text: "Đã Duyệt",
    color: "green",
    icon: "✅",
    description: "Công việc đã được chấp nhận",
  },
  [ShortTermJobStatus.REJECTED]: {
    text: "Cần Sửa Lại",
    color: "red",
    icon: "🔄",
    description: "Công việc cần được sửa lại",
  },
  [ShortTermJobStatus.COMPLETED]: {
    text: "Hoàn Thành",
    color: "teal",
    icon: "🎉",
    description: "Công việc đã hoàn thành",
  },
  [ShortTermJobStatus.PAID]: {
    text: "Đã Thanh Toán",
    color: "green",
    icon: "💰",
    description: "Đã thanh toán cho ứng viên",
  },
  [ShortTermJobStatus.CANCELLED]: {
    text: "Đã Hủy",
    color: "gray",
    icon: "❌",
    description: "Job đã bị hủy",
  },
  [ShortTermJobStatus.DISPUTED]: {
    text: "Tranh Chấp",
    color: "red",
    icon: "⚠️",
    description: "Đang có tranh chấp",
  },
};

export const APPLICATION_STATUS_DISPLAY: Record<
  ShortTermApplicationStatus,
  StatusDisplayInfo
> = {
  [ShortTermApplicationStatus.PENDING]: {
    text: "Chờ Xét Duyệt",
    color: "blue",
    icon: "⏳",
    description: "Đang chờ recruiter xem xét",
  },
  [ShortTermApplicationStatus.ACCEPTED]: {
    text: "Được Chấp Nhận",
    color: "green",
    icon: "✓",
    description: "Bạn đã được chọn làm việc",
  },
  [ShortTermApplicationStatus.REJECTED]: {
    text: "Không Được Chọn",
    color: "red",
    icon: "✗",
    description: "Đơn ứng tuyển không được chọn",
  },
  [ShortTermApplicationStatus.WORKING]: {
    text: "Đang Làm Việc",
    color: "orange",
    icon: "💼",
    description: "Đang trong quá trình làm việc",
  },
  [ShortTermApplicationStatus.SUBMITTED]: {
    text: "Đã Nộp Bài",
    color: "purple",
    icon: "📤",
    description: "Đã bàn giao deliverables",
  },
  [ShortTermApplicationStatus.REVISION_REQUIRED]: {
    text: "Cần Sửa Lại",
    color: "yellow",
    icon: "🔄",
    description: "Recruiter yêu cầu chỉnh sửa",
  },
  [ShortTermApplicationStatus.APPROVED]: {
    text: "Công Việc Được Duyệt",
    color: "green",
    icon: "✅",
    description: "Công việc đã được chấp nhận",
  },
  [ShortTermApplicationStatus.COMPLETED]: {
    text: "Hoàn Thành",
    color: "teal",
    icon: "🎉",
    description: "Đã hoàn thành công việc",
  },
  [ShortTermApplicationStatus.CANCELLED]: {
    text: "Đã Hủy",
    color: "gray",
    icon: "❌",
    description: "Đơn ứng tuyển đã bị hủy",
  },
  [ShortTermApplicationStatus.IN_PROGRESS]: {
    text: "Đang Thực Hiện",
    color: "orange",
    icon: "🔧",
    description: "Đang trong quá trình thực hiện công việc",
  },
  [ShortTermApplicationStatus.PAID]: {
    text: "Đã Thanh Toán",
    color: "green",
    icon: "💰",
    description: "Đã nhận thanh toán cho công việc",
  },
  [ShortTermApplicationStatus.WITHDRAWN]: {
    text: "Đã Rút Đơn",
    color: "gray",
    icon: "↩️",
    description: "Bạn đã rút đơn ứng tuyển",
  },
};
