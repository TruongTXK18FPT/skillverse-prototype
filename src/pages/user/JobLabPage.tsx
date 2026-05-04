import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmAction } from "../../context/ConfirmDialogContext";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Clock3,
  DollarSign,
  FileCheck,
  FileSignature,
  FileText,
  FolderOpen,
  Globe,
  Link as LinkIcon,
  MapPin,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Timer,
  Trash2,
  Upload,
  XCircle,
  Zap,
  Cpu,
  PieChart,
  Target,
  TrendingUp,
} from "lucide-react";
import JobLabOffersView from "./JobLabOffersView";
import JobLabFullTimeInlineView from "./JobLabFullTimeInlineView";
import { useScrollToListTopOnPagination } from "../../hooks/useScrollToListTopOnPagination";
import jobService from "../../services/jobService";
import shortTermJobService from "../../services/shortTermJobService";
import { uploadMedia } from "../../services/mediaService";
import { JobApplicationResponse } from "../../data/jobDTOs";
import {
  DisputeResolution,
  DisputeStatus,
  DisputeType,
  ShortTermApplicationResponse,
  SubmitDeliverableRequest,
  RevisionNote,
  UserSubmittedDispute,
} from "../../types/ShortTermJob";
import MeowlKuruLoader from "../../components/kuru-loader/MeowlKuruLoader";
import ContractListPage from "../../components/contract/ContractListPage";
import InterviewListPanel from "../../components/business-hud/InterviewListPanel";
import CandidateOnboardingPanel from "../../components/business-hud/CandidateOnboardingPanel";
import "../../styles/JobLabWorkspace.css";

type JobType = "ALL" | "REGULAR" | "SHORT_TERM";
type ViewMode =
  | "dashboard"
  | "applications"
  | "workspace"
  | "contracts"
  | "interviews"
  | "offers"
  | "disputes"
  | "onboarding";
type ApplicationTimeFilter = "ALL" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";
type IncomeStatusFilter = "ALL" | "PAID" | "COMPLETED";
type DisputeStatusFilter = "ALL" | DisputeStatus;
type IncomeSort =
  | "NEWEST"
  | "OLDEST"
  | "AMOUNT_DESC"
  | "AMOUNT_ASC"
  | "TITLE_ASC";
type JobLabLocationState = {
  viewMode?: ViewMode;
  jobType?: JobType;
  selectedApplicationId?: string;
  applicationType?: "REGULAR" | "SHORT_TERM";
};

export type AppItem = {
  id: string;
  type: "REGULAR" | "SHORT_TERM";
  jobId?: number;
  applicationId: number;
  title: string;
  company: string;
  budget: number;
  isRemote: boolean;
  location: string;
  appliedAt: string;
  status: string;
  coverLetter?: string;
  proposedPrice?: number;
  proposedDuration?: string;
  workNote?: string;
  revisionCount?: number;
  revisionNotes?: RevisionNote[];
  deliverables?: Array<{ id: number; fileName: string; fileUrl: string }>;
  // SLA / Cancellation / Dispute fields
  reviewDeadlineAt?: string;
  responseDeadlineAt?: string;
  disputeEligibilityUnlocked?: boolean;
  // Contract link
  contractId?: number;
  contractStatus?: string;
  // Offer letter (negotiable jobs)
  offerDetails?: string;
  offerSalary?: number;
  offerAdditionalRequirements?: string;
  candidateOfferResponse?: string;
  counterSalaryAmount?: number;
  counterAdditionalRequirements?: string;
  isNegotiable?: boolean;
  offerRound?: number;
};

type IncomeHistoryItem = {
  id: string;
  applicationId: number;
  type: "REGULAR" | "SHORT_TERM";
  title: string;
  company: string;
  status: "PAID" | "COMPLETED";
  statusLabel: string;
  amount: number;
  recordedAt: string;
};

const STATUS_META: Record<
  string,
  { label: string; tone: string; hint: string }
> = {
  PENDING: {
    label: "Chờ phản hồi",
    tone: "amber",
    hint: "Nhà tuyển dụng chưa xử lý hồ sơ của bạn.",
  },
  REVIEWED: { label: "Đã xem", tone: "sky", hint: "Hồ sơ đã được mở xem." },
  ACCEPTED: {
    label: "Được chọn",
    tone: "emerald",
    hint: "Bắt đầu workspace để nhận việc ngay.",
  },
  WORKING: {
    label: "Đang làm",
    tone: "violet",
    hint: "Bạn đang thực hiện công việc.",
  },
  REVISION_REQUIRED: {
    label: "Cần sửa",
    tone: "orange",
    hint: "Nhà tuyển dụng đã gửi feedback, cần bạn cập nhật.",
  },
  SUBMITTED: {
    label: "Đã nộp",
    tone: "cyan",
    hint: "Bàn giao đã gửi, đang chờ kiểm tra.",
  },
  APPROVED: {
    label: "Đã duyệt",
    tone: "fuchsia",
    hint: "Bàn giao được duyệt, chờ hoàn tất.",
  },
  COMPLETED: {
    label: "Hoàn tất",
    tone: "green",
    hint: "Công việc đã hoàn thành.",
  },
  PAID: {
    label: "Đã thanh toán",
    tone: "green",
    hint: "Thanh toán đã được xác nhận.",
  },
  REJECTED: {
    label: "Không tiếp tục",
    tone: "red",
    hint: "Hồ sơ này đã bị từ chối.",
  },
  WITHDRAWN: {
    label: "Đã rút đơn",
    tone: "slate",
    hint: "Bạn đã chủ động rút đơn.",
  },
  SUBMITTED_OVERDUE: {
    label: "Quá hạn review",
    tone: "red",
    hint: "Recruiter chưa review. Bàn giao sẽ được tự động duyệt.",
  },
  REVISION_RESPONSE_OVERDUE: {
    label: "Quá hạn phản hồi",
    tone: "amber",
    hint: "Bạn chưa phản hồi yêu cầu sửa đổi.",
  },
  CANCELLATION_REQUESTED: {
    label: "Yêu cầu hủy",
    tone: "orange",
    hint: "Nhà tuyển dụng yêu cầu hủy công việc.",
  },
  AUTO_CANCELLED: {
    label: "Tự động hủy",
    tone: "red",
    hint: "Không phản hồi trong 72 giờ.",
  },
  DISPUTE_OPENED: {
    label: "Đang khiếu nại",
    tone: "violet",
    hint: "Admin đang xử lý khiếu nại.",
  },
  // Full-time / Freelance job application statuses
  INTERVIEW_SCHEDULED: {
    label: "Lịch phỏng vấn",
    tone: "cyan",
    hint: "Đã có lịch phỏng vấn, chờ đến ngày hẹn.",
  },
  INTERVIEWED: {
    label: "Đã phỏng vấn",
    tone: "sky",
    hint: "Buổi phỏng vấn đã hoàn tất, chờ kết quả.",
  },
  OFFER_SENT: {
    label: "Nhận đề nghị",
    tone: "violet",
    hint: "Nhà tuyển dụng đã gửi đề nghị, chờ bạn phản hồi.",
  },
  OFFER_ACCEPTED: {
    label: "Đã nhận việc",
    tone: "emerald",
    hint: "Bạn đã chấp nhận đề nghị. Chờ ký hợp đồng.",
  },
  OFFER_REJECTED: {
    label: "Từ chối đề nghị",
    tone: "red",
    hint: "Bạn đã từ chối đề nghị này.",
  },
  CONTRACT_SIGNED: {
    label: "Đã ký hợp đồng",
    tone: "fuchsia",
    hint: "Hợp đồng đã được ký, chờ bắt đầu công việc.",
  },
  AWAITING_ONBOARDING_INFO: {
    label: "Đang cung cấp thông tin",
    tone: "cyan",
    hint: "Cần cung cấp CCCD và thông tin ngân hàng để hoàn tất onboarding.",
  },
  HIRED: {
    label: "Đã tuyển dụng",
    tone: "green",
    hint: "Đã được tuyển chính thức (Onsite).",
  },
};

const DISPUTE_STATUS_META: Record<
  string,
  { label: string; tone: string; hint: string }
> = {
  OPEN: {
    label: "Mới mở",
    tone: "red",
    hint: "Đang chờ admin tiếp nhận xử lý.",
  },
  UNDER_INVESTIGATION: {
    label: "Đang điều tra",
    tone: "amber",
    hint: "Admin đang xác minh chứng cứ và lịch sử bàn giao.",
  },
  AWAITING_RESPONSE: {
    label: "Chờ phản hồi",
    tone: "sky",
    hint: "Cần phản hồi bổ sung từ một trong hai bên.",
  },
  ESCALATED: {
    label: "Đã escalated",
    tone: "violet",
    hint: "Case đã leo thang do quá hạn SLA xử lý.",
  },
  RESOLVED: {
    label: "Đã giải quyết",
    tone: "green",
    hint: "Admin đã chốt kết quả dispute.",
  },
  DISMISSED: {
    label: "Bác bỏ",
    tone: "slate",
    hint: "Dispute bị bác bỏ do không đủ điều kiện hoặc chứng cứ.",
  },
};

const DISPUTE_STATUS_FILTER_ITEMS: Array<{
  value: DisputeStatusFilter;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: DisputeStatus.OPEN, label: "Mới mở" },
  { value: DisputeStatus.UNDER_INVESTIGATION, label: "Đang điều tra" },
  { value: DisputeStatus.AWAITING_RESPONSE, label: "Chờ phản hồi" },
  { value: DisputeStatus.ESCALATED, label: "Đã escalated" },
  { value: DisputeStatus.RESOLVED, label: "Đã giải quyết" },
  { value: DisputeStatus.DISMISSED, label: "Bác bỏ" },
];

const DISPUTE_TYPE_LABELS: Record<DisputeType, string> = {
  NO_SUBMISSION: "Không nộp sản phẩm",
  POOR_QUALITY: "Chất lượng kém",
  MISSING_DELIVERABLE: "Thiếu sản phẩm bàn giao",
  DEADLINE_VIOLATION: "Vi phạm deadline",
  PAYMENT_ISSUE: "Vấn đề thanh toán",
  COMMUNICATION_FAILURE: "Mất liên lạc",
  SCOPE_CHANGE: "Thay đổi phạm vi",
  SCAM_REPORT: "Báo cáo lừa đảo",
  OTHER: "Khác",
  WORKER_PROTECTION: "Bảo vệ quyền lợi worker",
  RECRUITER_ABUSE: "Nhà tuyển dụng lạm dụng",
  CANCELLATION_REVIEW: "Yêu cầu admin review hủy",
};

const DISPUTE_RESOLUTION_LABELS: Record<DisputeResolution, string> = {
  FULL_REFUND: "Hoàn tiền toàn bộ",
  FULL_RELEASE: "Giải ngân toàn bộ",
  PARTIAL_REFUND: "Hoàn tiền một phần",
  PARTIAL_RELEASE: "Giải ngân một phần",
  RESUBMIT_REQUIRED: "Yêu cầu nộp lại",
  NO_ACTION: "Không hành động",
  CANCEL_JOB: "Hủy công việc",
  RECRUITER_WARNING: "Cảnh báo recruiter",
  WORKER_WINS: "Worker thắng",
  WORKER_PARTIAL: "Worker nhận một phần",
  RECRUITER_WINS: "Recruiter thắng",
};

const WORKSPACE_STEPS: Record<string, string> = {
  ACCEPTED: "Nhận việc",
  WORKING: "Đang làm",
  SUBMITTED: "Đã nộp",
  COMPLETED: "Hoàn tất",
};

const APPLICATIONS_PAGE_SIZE = 9;
const WORKSPACE_PAGE_SIZE = 8;
const INCOME_HISTORY_PAGE_SIZE = 3;
const DISPUTES_PAGE_SIZE = 8;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

const getStartOfWeek = (date: Date) => {
  const base = startOfDay(date);
  const day = base.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + delta);
  return base;
};

const matchesTimeFilter = (
  dateValue: string,
  filter: ApplicationTimeFilter,
  fromDate?: string,
  toDate?: string,
) => {
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return false;

  if (filter === "ALL") return true;

  const now = new Date();

  if (filter === "THIS_WEEK") {
    const start = getStartOfWeek(now);
    const end = endOfDay(now);
    return target >= start && target <= end;
  }

  if (filter === "THIS_MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endOfDay(now);
    return target >= start && target <= end;
  }

  if (filter === "CUSTOM") {
    if (fromDate) {
      const from = new Date(`${fromDate}T00:00:00`);
      if (target < from) return false;
    }

    if (toDate) {
      const to = new Date(`${toDate}T23:59:59.999`);
      if (target > to) return false;
    }

    return true;
  }

  return true;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
const formatApplicationBudget = (
  app?: Pick<AppItem, "budget" | "isNegotiable" | "type"> | null,
) => {
  if (!app) return formatCurrency(0);
  if (app.isNegotiable || (app.type === "REGULAR" && app.budget <= 0)) {
    return "Thỏa thuận";
  }
  return formatCurrency(app.budget);
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Cập nhật sau";

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Chưa cập nhật";

const getDisputeTypeLabel = (type?: DisputeType) => {
  if (!type) return "Chưa rõ loại";
  return DISPUTE_TYPE_LABELS[type] || type;
};

const getDisputeResolutionLabel = (resolution?: DisputeResolution) => {
  if (!resolution) return "Chưa có kết quả";
  return DISPUTE_RESOLUTION_LABELS[resolution] || resolution;
};

/** Format countdown string from deadline timestamp */
const formatCountdown = (deadline?: string): string => {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Đã quá hạn";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} ngày${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
};

/** Check if deadline has passed */
const isOverdue = (deadline?: string): boolean => {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
};

/** Check if deadline is within warning threshold (24 hours) */
const isWarning = (deadline?: string): boolean => {
  if (!deadline) return false;
  const diff = new Date(deadline).getTime() - Date.now();
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
};

const canSubmitWork = (app: AppItem | null) =>
  Boolean(
    app &&
    app.type === "SHORT_TERM" &&
    [
      "ACCEPTED",
      "WORKING",
      "REVISION_REQUIRED",
      "REVISION_RESPONSE_OVERDUE",
    ].includes(app.status),
  );

const canOpenDispute = (app: AppItem | null) =>
  Boolean(
    app &&
    app.type === "SHORT_TERM" &&
    app.disputeEligibilityUnlocked &&
    [
      "REVISION_REQUIRED",
      "REVISION_RESPONSE_OVERDUE",
      "SUBMITTED",
      "SUBMITTED_OVERDUE",
      "CANCELLATION_REQUESTED",
    ].includes(app.status),
  );

const JobLabPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [jobType, setJobType] = useState<JobType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [applicationTimeFilter, setApplicationTimeFilter] =
    useState<ApplicationTimeFilter>("ALL");
  const [applicationDateFrom, setApplicationDateFrom] = useState("");
  const [applicationDateTo, setApplicationDateTo] = useState("");
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [workspacePage, setWorkspacePage] = useState(1);
  const [incomePage, setIncomePage] = useState(1);
  const [incomeSearch, setIncomeSearch] = useState("");
  const [incomeStatusFilter, setIncomeStatusFilter] =
    useState<IncomeStatusFilter>("ALL");
  const [incomeTypeFilter, setIncomeTypeFilter] = useState<JobType>("ALL");
  const [incomeSort, setIncomeSort] = useState<IncomeSort>("NEWEST");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullTimeAppId, setFullTimeAppId] = useState<string | null>(null);
  const [regularApps, setRegularApps] = useState<JobApplicationResponse[]>([]);
  const [shortTermApps, setShortTermApps] = useState<
    ShortTermApplicationResponse[]
  >([]);
  const [workNote, setWorkNote] = useState("");
  const [workFiles, setWorkFiles] = useState<File[]>([]);
  const [workLinks, setWorkLinks] = useState<string[]>([""]);
  const [isFinalSubmission, setIsFinalSubmission] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeType, setDisputeType] = useState<string>("WORKER_PROTECTION");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);
  const [disputeFilesPreview, setDisputeFilesPreview] = useState<string[]>([]);
  const [disputeSelectedEvidenceType, setDisputeSelectedEvidenceType] =
    useState<string>("TEXT");
  const [submittedDisputes, setSubmittedDisputes] = useState<
    UserSubmittedDispute[]
  >([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesLoaded, setDisputesLoaded] = useState(false);
  const [disputeSearchTerm, setDisputeSearchTerm] = useState("");
  const [disputeStatusFilter, setDisputeStatusFilter] =
    useState<DisputeStatusFilter>("ALL");
  const [disputesPage, setDisputesPage] = useState(1);
  const { withPaginationScroll } = useScrollToListTopOnPagination();

  const loadApplications = async () => {
    setLoading(true);
    try {
      const [regular, shortTerm] = await Promise.all([
        jobService.getMyApplications().catch(() => []),
        shortTermJobService.getMyApplications().catch(() => []),
      ]);
      setRegularApps(regular);
      setShortTermApps(shortTerm);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // [Nghiệp vụ] Tab dispute cần tổng hợp tất cả dispute user đã gửi để filter trạng thái đầy đủ ở frontend.
  const loadSubmittedDisputes = async () => {
    setDisputesLoading(true);
    try {
      const merged: UserSubmittedDispute[] = [];
      let page = 0;
      let totalPages = 1;

      do {
        const response = await shortTermJobService.getMySubmittedDisputes(
          page,
          50,
        );
        merged.push(...(response.content || []));
        totalPages = Math.max(1, response.totalPages || 1);
        page += 1;
      } while (page < totalPages && page < 20);

      const deduped = Array.from(
        new Map(merged.map((item) => [item.id, item])).values(),
      ).sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      );

      setSubmittedDisputes(deduped);
      setDisputesLoaded(true);
    } catch (error: any) {
      setMessage(error?.message || "Không thể tải danh sách dispute đã gửi.");
    } finally {
      setDisputesLoading(false);
    }
  };

  const applications = useMemo<AppItem[]>(() => {
    const regular: AppItem[] = regularApps.map((app) => ({
      id: `regular-${app.id}`,
      type: "REGULAR",
      applicationId: app.id,
      title: app.jobTitle,
      company: app.recruiterCompanyName,
      budget: app.maxBudget,
      isRemote: app.isRemote,
      location: app.location || "",
      appliedAt: app.appliedAt,
      status: app.status,
      coverLetter: app.coverLetter || undefined,
      contractId: app.contractId,
      contractStatus: app.contractStatus,
      // Offer letter (negotiable jobs)
      offerDetails: (app as any).offerDetails,
      offerSalary: (app as any).offerSalary,
      offerAdditionalRequirements: (app as any).offerAdditionalRequirements,
      candidateOfferResponse: (app as any).candidateOfferResponse,
      counterSalaryAmount: (app as any).counterSalaryAmount,
      counterAdditionalRequirements: (app as any).counterAdditionalRequirements,
      isNegotiable: (app as any).isNegotiable,
      offerRound: (app as any).offerRound ?? 0,
    }));

    const shortTerm: AppItem[] = shortTermApps.map((app) => {
      const jobDetailsExt = app.jobDetails as
        | {
            isRemote?: boolean;
            location?: string;
          }
        | undefined;

      return {
        id: `shortterm-${app.id}`,
        type: "SHORT_TERM",
        jobId: app.jobId,
        applicationId: app.id,
        title: app.jobTitle || app.jobDetails?.title || "Gig job",
        company: app.jobDetails?.recruiterCompanyName || "",
        budget: app.jobBudget || app.proposedPrice || 0,
        isRemote: Boolean(jobDetailsExt?.isRemote),
        location: jobDetailsExt?.location || "",
        appliedAt: app.appliedAt,
        status: app.status,
        coverLetter: app.coverLetter || undefined,
        proposedPrice: app.proposedPrice,
        proposedDuration: app.proposedDuration,
        workNote: app.workNote,
        revisionCount: app.revisionCount,
        revisionNotes: (app as any).revisionNotes,
        deliverables: (app.deliverables || []).map((item) => ({
          id: item.id,
          fileName: item.fileName,
          fileUrl: item.fileUrl,
        })),
        // SLA / Cancellation / Dispute fields
        reviewDeadlineAt: app.reviewDeadlineAt,
        responseDeadlineAt: app.responseDeadlineAt,
        disputeEligibilityUnlocked: app.disputeEligibilityUnlocked,
      };
    });

    return [...regular, ...shortTerm].sort(
      (left, right) =>
        new Date(right.appliedAt).getTime() -
        new Date(left.appliedAt).getTime(),
    );
  }, [regularApps, shortTermApps]);

  const applicationsFilteredByTypeAndSearch = useMemo(() => {
    return applications.filter((app) => {
      const matchesType = jobType === "ALL" || app.type === jobType;
      const query = searchTerm.trim().toLowerCase();
      const matchesQuery =
        !query ||
        [app.title, app.company, app.coverLetter]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return matchesType && matchesQuery;
    });
  }, [applications, jobType, searchTerm]);

  const workspaceListApplications = useMemo(
    () =>
      applications.filter((app) => jobType === "ALL" || app.type === jobType),
    [applications, jobType],
  );

  // Workspace detail panel currently supports short-term jobs only.
  const workspaceDetailShortTermApps = useMemo(
    () => workspaceListApplications.filter((app) => app.type === "SHORT_TERM"),
    [workspaceListApplications],
  );

  const applicationsViewItems = useMemo(
    () =>
      applicationsFilteredByTypeAndSearch.filter((app) =>
        matchesTimeFilter(
          app.appliedAt,
          applicationTimeFilter,
          applicationDateFrom,
          applicationDateTo,
        ),
      ),
    [
      applicationsFilteredByTypeAndSearch,
      applicationTimeFilter,
      applicationDateFrom,
      applicationDateTo,
    ],
  );

  const applicationsTotalPages = Math.max(
    1,
    Math.ceil(applicationsViewItems.length / APPLICATIONS_PAGE_SIZE),
  );

  const pagedApplications = useMemo(() => {
    const start = (applicationsPage - 1) * APPLICATIONS_PAGE_SIZE;
    return applicationsViewItems.slice(start, start + APPLICATIONS_PAGE_SIZE);
  }, [applicationsViewItems, applicationsPage]);

  const workspaceTotalPages = Math.max(
    1,
    Math.ceil(workspaceListApplications.length / WORKSPACE_PAGE_SIZE),
  );

  const pagedWorkspaceApplications = useMemo(() => {
    const start = (workspacePage - 1) * WORKSPACE_PAGE_SIZE;
    return workspaceListApplications.slice(start, start + WORKSPACE_PAGE_SIZE);
  }, [workspaceListApplications, workspacePage]);

  useEffect(() => {
    setApplicationsPage(1);
  }, [
    jobType,
    searchTerm,
    applicationTimeFilter,
    applicationDateFrom,
    applicationDateTo,
  ]);

  useEffect(() => {
    setWorkspacePage(1);
  }, [jobType, searchTerm]);

  useEffect(() => {
    setApplicationsPage((current) => Math.min(current, applicationsTotalPages));
  }, [applicationsTotalPages]);

  useEffect(() => {
    setWorkspacePage((current) => Math.min(current, workspaceTotalPages));
  }, [workspaceTotalPages]);

  useEffect(() => {
    if (!workspaceDetailShortTermApps.length) {
      setSelectedId(null);
      return;
    }
    if (
      !selectedId ||
      !workspaceDetailShortTermApps.some((app) => app.id === selectedId)
    ) {
      setSelectedId(workspaceDetailShortTermApps[0].id);
    }
  }, [workspaceDetailShortTermApps, selectedId]);

  useEffect(() => {
    if (!selectedId || !workspaceListApplications.length) return;
    const index = workspaceListApplications.findIndex(
      (app) => app.id === selectedId,
    );
    if (index < 0) return;
    const page = Math.floor(index / WORKSPACE_PAGE_SIZE) + 1;
    if (workspacePage !== page) {
      setWorkspacePage(page);
    }
  }, [selectedId, workspaceListApplications, workspacePage]);

  const selectedApp =
    workspaceDetailShortTermApps.find((app) => app.id === selectedId) || null;

  useEffect(() => {
    const navigationState = location.state as JobLabLocationState | null;
    if (!navigationState) return;

    if (navigationState.jobType) {
      setJobType(navigationState.jobType);
    }

    if (navigationState.viewMode) {
      setViewMode(navigationState.viewMode);
    }

    if (
      navigationState.selectedApplicationId &&
      navigationState.applicationType
    ) {
      const prefix =
        navigationState.applicationType === "SHORT_TERM"
          ? "shortterm"
          : "regular";
      setSelectedId(`${prefix}-${navigationState.selectedApplicationId}`);
    }
  }, [location.state]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      waiting: applications.filter((app) =>
        ["PENDING", "REVIEWED"].includes(app.status),
      ).length,
      active: applications.filter((app) =>
        [
          "ACCEPTED",
          "WORKING",
          "REVISION_REQUIRED",
          "SUBMITTED",
          "APPROVED",
        ].includes(app.status),
      ).length,
      completed: applications.filter((app) =>
        ["COMPLETED", "PAID"].includes(app.status),
      ).length,
      earnings: applications
        .filter((app) => ["COMPLETED", "PAID"].includes(app.status))
        .reduce((sum, app) => sum + app.budget, 0),
    }),
    [applications],
  );

  const incomeHistoryItems = useMemo<IncomeHistoryItem[]>(() => {
    return applications
      .filter(
        (app): app is AppItem & { status: "PAID" | "COMPLETED" } =>
          app.budget > 0 && ["PAID", "COMPLETED"].includes(app.status),
      )
      .map((app) => ({
        id: app.id,
        applicationId: app.applicationId,
        type: app.type,
        title: app.title,
        company: app.company,
        status: app.status,
        statusLabel: app.status === "PAID" ? "Đã thanh toán" : "Hoàn tất",
        amount: app.budget,
        recordedAt: app.appliedAt,
      }));
  }, [applications]);

  const filteredIncomeHistory = useMemo(() => {
    const keyword = incomeSearch.trim().toLowerCase();

    const filtered = incomeHistoryItems.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.title, item.company, item.type]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesStatus =
        incomeStatusFilter === "ALL" || item.status === incomeStatusFilter;

      const matchesType =
        incomeTypeFilter === "ALL" || item.type === incomeTypeFilter;

      return matchesKeyword && matchesStatus && matchesType;
    });

    return [...filtered].sort((left, right) => {
      switch (incomeSort) {
        case "OLDEST":
          return (
            new Date(left.recordedAt).getTime() -
            new Date(right.recordedAt).getTime()
          );
        case "AMOUNT_DESC":
          return right.amount - left.amount;
        case "AMOUNT_ASC":
          return left.amount - right.amount;
        case "TITLE_ASC":
          return left.title.localeCompare(right.title, "vi", {
            sensitivity: "base",
          });
        case "NEWEST":
        default:
          return (
            new Date(right.recordedAt).getTime() -
            new Date(left.recordedAt).getTime()
          );
      }
    });
  }, [
    incomeHistoryItems,
    incomeSearch,
    incomeStatusFilter,
    incomeTypeFilter,
    incomeSort,
  ]);

  const incomeTotalPages = Math.max(
    1,
    Math.ceil(filteredIncomeHistory.length / INCOME_HISTORY_PAGE_SIZE),
  );

  const pagedIncomeHistory = useMemo(() => {
    const start = (incomePage - 1) * INCOME_HISTORY_PAGE_SIZE;
    return filteredIncomeHistory.slice(start, start + INCOME_HISTORY_PAGE_SIZE);
  }, [filteredIncomeHistory, incomePage]);

  const incomeRangeStart = filteredIncomeHistory.length
    ? (incomePage - 1) * INCOME_HISTORY_PAGE_SIZE + 1
    : 0;
  const incomeRangeEnd = Math.min(
    incomePage * INCOME_HISTORY_PAGE_SIZE,
    filteredIncomeHistory.length,
  );

  const offerAppsCount = useMemo(
    () =>
      applications.filter(
        (app) =>
          app.type === "REGULAR" &&
          ["OFFER_SENT", "OFFER_ACCEPTED", "OFFER_REJECTED"].includes(
            app.status,
          ),
      ).length,
    [applications],
  );

  const onboardingApps = useMemo(
    () =>
      applications.filter(
        (app) =>
          app.type === "REGULAR" &&
          app.isRemote &&
          [
            "OFFER_ACCEPTED",
            "AWAITING_ONBOARDING_INFO",
            "INTERVIEWED",
          ].includes(app.status),
      ),
    [applications],
  );

  const [selectedOnboardingAppId, setSelectedOnboardingAppId] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === "onboarding" && onboardingApps.length > 0 && !selectedOnboardingAppId) {
      setSelectedOnboardingAppId(onboardingApps[0].id);
    }
  }, [viewMode, onboardingApps, selectedOnboardingAppId]);

  const filteredSubmittedDisputes = useMemo(() => {
    const normalizedQuery = disputeSearchTerm.trim().toLowerCase();

    return submittedDisputes.filter((item) => {
      const matchesStatus =
        disputeStatusFilter === "ALL" || item.status === disputeStatusFilter;

      const matchesQuery =
        !normalizedQuery ||
        [
          item.id,
          item.jobTitle,
          item.reason,
          item.respondentName,
          item.disputeType,
          item.status,
          item.resolution,
        ]
          .filter((value) => value !== undefined && value !== null)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );

      return matchesStatus && matchesQuery;
    });
  }, [submittedDisputes, disputeSearchTerm, disputeStatusFilter]);

  const disputesTotalPages = Math.max(
    1,
    Math.ceil(filteredSubmittedDisputes.length / DISPUTES_PAGE_SIZE),
  );

  const pagedSubmittedDisputes = useMemo(() => {
    const start = (disputesPage - 1) * DISPUTES_PAGE_SIZE;
    return filteredSubmittedDisputes.slice(start, start + DISPUTES_PAGE_SIZE);
  }, [filteredSubmittedDisputes, disputesPage]);

  const unresolvedSubmittedDisputesCount = useMemo(
    () =>
      submittedDisputes.filter((item) =>
        [
          DisputeStatus.OPEN,
          DisputeStatus.UNDER_INVESTIGATION,
          DisputeStatus.AWAITING_RESPONSE,
          DisputeStatus.ESCALATED,
        ].includes(item.status),
      ).length,
    [submittedDisputes],
  );

  const statusSummary = useMemo(() => {
    const closedCount = applications.filter((app) =>
      ["REJECTED", "WITHDRAWN"].includes(app.status),
    ).length;
    const accountedCount =
      stats.waiting + stats.active + stats.completed + closedCount;
    const otherCount = Math.max(0, applications.length - accountedCount);

    const items = [
      {
        key: "waiting",
        label: "Chờ phản hồi",
        count: stats.waiting,
        color: "#38bdf8",
      },
      {
        key: "active",
        label: "Đang làm",
        count: stats.active,
        color: "#a855f7",
      },
      {
        key: "completed",
        label: "Hoàn tất",
        count: stats.completed,
        color: "#22c55e",
      },
      {
        key: "closed",
        label: "Đã đóng",
        count: closedCount,
        color: "#f59e0b",
      },
      {
        key: "other",
        label: "Khác",
        count: otherCount,
        color: "#94a3b8",
      },
    ] as const;

    const total = items.reduce((sum, item) => sum + item.count, 0);

    if (!total) {
      return {
        items,
        total,
        donutStyle: {
          background:
            "conic-gradient(rgba(56, 189, 248, 0.24) 0% 25%, rgba(168, 85, 247, 0.24) 25% 50%, rgba(34, 197, 94, 0.24) 50% 75%, rgba(245, 158, 11, 0.24) 75% 100%)",
        } as CSSProperties,
      };
    }

    let cursor = 0;
    const parts = items.map((item) => {
      const start = cursor;
      const step = (item.count / total) * 100;
      cursor += step;
      const end = cursor;
      return `${item.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    });

    return {
      items,
      total,
      donutStyle: {
        background: `conic-gradient(${parts.join(", ")})`,
      } as CSSProperties,
    };
  }, [applications, stats.active, stats.completed, stats.waiting]);

  useEffect(() => {
    setIncomePage(1);
  }, [incomeSearch, incomeStatusFilter, incomeTypeFilter, incomeSort]);

  useEffect(() => {
    setIncomePage((current) => Math.min(current, incomeTotalPages));
  }, [incomeTotalPages]);

  useEffect(() => {
    setDisputesPage(1);
  }, [disputeSearchTerm, disputeStatusFilter]);

  useEffect(() => {
    setDisputesPage((current) => Math.min(current, disputesTotalPages));
  }, [disputesTotalPages]);

  useEffect(() => {
    if (viewMode !== "disputes" || disputesLoaded || disputesLoading) return;
    void loadSubmittedDisputes();
  }, [viewMode, disputesLoaded, disputesLoading]);

  const openWorkspace = (app: AppItem) => {
    // Full-time REGULAR jobs open inline view, not workspace
    if (app.type === "REGULAR") {
      setJobType("REGULAR");
      setFullTimeAppId(app.id);
      setViewMode("workspace");
      return;
    }
    const appIndex = workspaceListApplications.findIndex(
      (item) => item.id === app.id,
    );
    if (appIndex >= 0) {
      setWorkspacePage(Math.floor(appIndex / WORKSPACE_PAGE_SIZE) + 1);
    }
    setFullTimeAppId(null);
    setSelectedId(app.id);
    setWorkNote("");
    setWorkFiles([]);
    setWorkLinks([""]);
    setIsFinalSubmission(false);
    setViewMode("workspace");
  };

  const submitDeliverables = async () => {
    if (!selectedApp || !canSubmitWork(selectedApp)) return;
    const links = workLinks.map((item) => item.trim()).filter(Boolean);
    if (!workNote.trim() && workFiles.length === 0 && links.length === 0) {
      setMessage("Hãy nhập báo cáo hoặc thêm file bàn giao.");
      return;
    }

    const payload: SubmitDeliverableRequest = {
      applicationId: selectedApp.applicationId,
      files: workFiles,
      workNote: workNote.trim() || undefined,
      links: links.length ? links : undefined,
      isFinalSubmission,
    };

    try {
      setSubmitting(true);
      await shortTermJobService.submitDeliverables(payload);
      setMessage("Đã gửi bàn giao thành công.");
      setViewMode("applications");
      await loadApplications();
    } catch (error: any) {
      setMessage(error?.message || "Không thể gửi bàn giao.");
    } finally {
      setSubmitting(false);
    }
  };

  const withdrawShortTermApplication = async (app: AppItem) => {
    if (app.type !== "SHORT_TERM") {
      setMessage("Luồng rút đơn full-time chưa được mở ở Job Lab mới.");
      return;
    }
    if (!(await confirmAction(`Rút đơn khỏi công việc "${app.title}"?`)))
      return;
    await shortTermJobService.withdrawApplication(app.applicationId);
    setMessage("Đã rút đơn thành công.");
    await loadApplications();
  };

  const acceptCancellation = async (app: AppItem) => {
    if (
      !(await confirmAction(
        `Chấp nhận hủy công việc "${app.title}"? Tiền escrow sẽ được hoàn cho nhà tuyển dụng.`,
      ))
    )
      return;
    try {
      await shortTermJobService.acceptCancellation(app.applicationId);
      setMessage(
        "Bạn đã chấp nhận yêu cầu hủy. Tiền đã được hoàn cho nhà tuyển dụng.",
      );
      setShowDisputeModal(false);
      setViewMode("applications");
      await loadApplications();
    } catch (error: any) {
      setMessage(error?.message || "Không thể chấp nhận yêu cầu hủy.");
    }
  };

  const submitDispute = async (app: AppItem) => {
    if (!disputeReason.trim() || disputeReason.trim().length < 20) {
      setMessage("Vui lòng nhập lý do khiếu nại (tối thiểu 20 ký tự).");
      return;
    }
    try {
      setDisputeSubmitting(true);
      const resolvedJobId =
        app.jobId ?? Number(app.id.replace("shortterm-", ""));
      if (!Number.isFinite(resolvedJobId) || resolvedJobId <= 0) {
        throw new Error("Khong xac dinh duoc cong viec cho yeu cau khieu nai.");
      }
      // Open the dispute first
      const dispute = await shortTermJobService.openDispute({
        jobId: resolvedJobId,
        applicationId: app.applicationId,
        disputeType: disputeType as any,
        reason: disputeReason.trim(),
      });

      // Submit text evidence
      await shortTermJobService.submitEvidence(dispute.id, {
        evidenceType: disputeSelectedEvidenceType,
        content: disputeReason.trim(),
        description: `Lý do khiếu nại — loại: ${disputeSelectedEvidenceType}`,
      });

      // Upload each file and submit as FILE evidence
      for (let i = 0; i < disputeFiles.length; i++) {
        const file = disputeFiles[i];
        const uploaded = await uploadMedia(file, app.applicationId);
        await shortTermJobService.submitEvidence(dispute.id, {
          evidenceType: "FILE",
          fileUrl: uploaded.url,
          fileName: uploaded.fileName || file.name,
          description: `File minh chung: ${file.name}`,
        });
      }

      setMessage("Đã gửi khiếu nại lên Admin thành công.");
      setShowDisputeModal(false);
      setDisputeReason("");
      setDisputeType("WORKER_PROTECTION");
      setDisputeFiles([]);
      setDisputeFilesPreview([]);
      setDisputeSelectedEvidenceType("TEXT");
      setDisputesLoaded(false);
      setViewMode("applications");
      await loadApplications();
    } catch (error: any) {
      setMessage(error?.message || "Không thể gửi khiếu nại.");
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const openDisputeForm = (_app: AppItem) => {
    setDisputeReason("");
    setDisputeType("WORKER_PROTECTION");
    setDisputeFiles([]);
    setDisputeFilesPreview([]);
    setDisputeSelectedEvidenceType("TEXT");
    setShowDisputeModal(true);
  };

  const handleDisputeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((f) => URL.createObjectURL(f));
    setDisputeFiles((prev) => [...prev, ...files]);
    setDisputeFilesPreview((prev) => [...prev, ...previews]);
  };

  const removeDisputeFile = (index: number) => {
    URL.revokeObjectURL(disputeFilesPreview[index]);
    setDisputeFiles((prev) => prev.filter((_, i) => i !== index));
    setDisputeFilesPreview((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="jlx-shell">
        <div className="jlx-loading jlx-loading--full">
          <div className="jlx-loading-skeleton" aria-hidden="true">
            <div className="jlx-loading-skeleton__line is-wide" />
            <div className="jlx-loading-skeleton__line" />
            <div className="jlx-loading-skeleton__grid">
              <div className="jlx-loading-skeleton__card" />
              <div className="jlx-loading-skeleton__card" />
              <div className="jlx-loading-skeleton__card" />
            </div>
          </div>
          <MeowlKuruLoader size="large" text="Đang tải Job Lab..." />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`jlx-shell${viewMode === "workspace" && workspaceListApplications.length > 0 ? " jlx-shell--workspace" : ""}`}
    >
      <aside className="jlx-sidebar">
        <div className="jlx-brand">
          <div className="jlx-brand__icon">
            <Zap size={20} />
          </div>
          <div>
            <strong>Job Lab</strong>
            <span>Workspace cá nhân</span>
          </div>
        </div>

        <nav className="jlx-nav">
          <div className="jlx-nav__group jlx-nav__group--primary">
            {[
              {
                id: "dashboard" as const,
                label: "Tổng quan",
                icon: Activity,
                count: undefined,
              },
              {
                id: "applications" as const,
                label: "Đơn",
                icon: FileText,
                count: stats.total,
              },
              {
                id: "contracts" as const,
                label: "Hợp đồng",
                icon: FileSignature,
                count: undefined,
              },
              {
                id: "interviews" as const,
                label: "Phỏng vấn",
                icon: Calendar,
                count: undefined,
              },
              {
                id: "offers" as const,
                label: "Đề nghị",
                icon: Send,
                count: offerAppsCount,
              },
              {
                id: "disputes" as const,
                label: "Dispute đã gửi",
                icon: AlertTriangle,
                count: unresolvedSubmittedDisputesCount,
              },
              {
                id: "onboarding" as const,
                label: "Onboarding",
                icon: Shield,
                count: onboardingApps.length || undefined,
              },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={`jlx-nav__item${viewMode === item.id ? " is-active" : ""}`}
                onClick={() => setViewMode(item.id)}
              >
                <span className="jlx-nav__icon">
                  <item.icon size={16} />
                </span>
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className="jlx-nav__count">{item.count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="jlx-nav__group jlx-nav__group--secondary">
            <button
              type="button"
              className="jlx-nav__item"
              onClick={() => navigate("/jobs")}
            >
              <span className="jlx-nav__icon">
                <Plus size={16} />
              </span>
              <span>Tìm việc</span>
            </button>
          </div>
        </nav>
      </aside>

      <main className="jlx-main">
        <header className="jlx-header">
          <div>
            <h1>
              {viewMode === "dashboard" && "Tổng quan Job Lab"}
              {viewMode === "applications" && "Tất cả đơn ứng tuyển"}
              {viewMode === "workspace" && "Workspace"}
              {viewMode === "contracts" && "Hợp đồng của tôi"}
              {viewMode === "interviews" && "Lịch phỏng vấn"}
              {viewMode === "offers" && "Các đề nghị đã nhận"}
              {viewMode === "disputes" && "Dispute đã gửi"}
              {viewMode === "onboarding" && "Thông tin nhân sự"}
            </h1>
            <p>
              {viewMode === "dashboard" &&
                "Nhịp tuyển dụng, công việc đang làm và điểm cần xử lý."}
              {viewMode === "applications" &&
                "Tất cả đơn được gom trên một màn hình."}
              {viewMode === "workspace" &&
                "Mở workspace để làm việc không bị gián đoạn."}
              {viewMode === "contracts" &&
                "Xem và quản lý hợp đồng lao động đã ký."}
              {viewMode === "interviews" &&
                "Theo dõi các buổi phỏng vấn online và onsite."}
              {viewMode === "offers" && "Xem và phản hồi đề nghị tuyển dụng."}
              {viewMode === "disputes" &&
                "Theo dõi toàn bộ tranh chấp bạn đã gửi theo trạng thái xử lý."}
              {viewMode === "onboarding" &&
                "Cung cấp CCCD và thông tin ngân hàng cho các job Remote đang chờ."}
            </p>
          </div>
          <div className="jlx-header__actions">
            <button
              type="button"
              className="jlx-btn jlx-btn--ghost"
              onClick={() => {
                if (viewMode === "disputes") {
                  void loadSubmittedDisputes();
                  return;
                }
                void loadApplications();
              }}
            >
              <RefreshCw size={14} />
              Làm mới
            </button>
            <button
              type="button"
              className="jlx-btn jlx-btn--primary"
              onClick={() => navigate("/jobs")}
            >
              <Briefcase size={14} />
              Tìm việc
            </button>
          </div>
        </header>

        {message && <div className="jlx-banner">{message}</div>}

        {viewMode === "dashboard" && (
          <>
            {/* NEW HUD HERO - COMMANDER STYLE */}
            <section className="jlx-joblab-hero">
              <div className="jlx-joblab-hero-backdrop"></div>
              <div className="jlx-hero-scanline"></div>

              <div className="jlx-joblab-hero__content">
                <div className="jlx-joblab-hero__left">
                  <div className="jlx-hero-badge">
                    <span className="jlx-badge-icon">
                      <Shield size={14} />
                    </span>
                    <span className="jlx-badge-text">
                      SYSTEM ACTIVE: CAREER_TRACKER_V4.0
                    </span>
                  </div>
                  <h1 className="jlx-title">
                    <span className="jlx-title-primary">
                      TRUNG TÂM CÔNG VIỆC
                    </span>
                    <span className="jlx-title-operator">
                      THEO DÕI TRẠNG THÁI ỨNG TUYỂN
                    </span>
                  </h1>
                  <p className="jlx-description">
                    Hệ thống quản lý lộ trình sự nghiệp và quy trình ứng tuyển
                    thông minh. Theo dõi, tối ưu hóa và làm chủ hành trình sự
                    nghiệp của bạn.
                  </p>

                  <div className="jlx-hero-actions">
                    <button
                      type="button"
                      className="jlx-btn jlx-btn--primary"
                      onClick={() => navigate("/jobs")}
                    >
                      <Target size={18} />
                      <span>CÔNG VIỆC</span>
                    </button>
                    <button
                      type="button"
                      className="jlx-btn jlx-btn--ghost"
                      onClick={() => {
                        setJobType("ALL");
                        setSearchTerm("");
                        setFullTimeAppId(null);
                        setViewMode("workspace");
                      }}
                    >
                      <FileText size={18} />
                      <span>WORKSPACE</span>
                    </button>
                  </div>
                </div>

                <div className="jlx-hero-visual">
                  <div className="jlx-visual-ring"></div>
                  <div className="jlx-visual-core">
                    <Briefcase size={40} className="jlx-visual-icon" />
                  </div>
                  <div className="jlx-visual-data">
                    <div className="jlx-data-bit">
                      <Activity size={12} /> SYNC_OK
                    </div>
                    <div className="jlx-data-bit">
                      <Cpu size={12} /> AUTH_STABLE
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="jlx-hud-stats">
              <div className="jlx-job-stat">
                <div className="jlx-job-stat__header">
                  <div className="jlx-job-stat__icon-wrap jlx-job-stat__icon-wrap--cyan">
                    <Zap className="jlx-job-stat__icon" size={24} />
                  </div>
                  <div className="jlx-job-stat__info">
                    <div className="jlx-job-stat__value">
                      {applications.length}
                    </div>
                    <div className="jlx-job-stat__label">
                      Tổng đơn ứng tuyển
                    </div>
                  </div>
                </div>
                <div className="jlx-job-stat__glow"></div>
              </div>

              <div className="jlx-job-stat">
                <div className="jlx-job-stat__header">
                  <div className="jlx-job-stat__icon-wrap jlx-job-stat__icon-wrap--purple">
                    <TrendingUp className="jlx-job-stat__icon" size={24} />
                  </div>
                  <div className="jlx-job-stat__info">
                    <div className="jlx-job-stat__value">{stats.active}</div>
                    <div className="jlx-job-stat__label">Đang làm</div>
                  </div>
                </div>
                <div className="jlx-job-stat__glow"></div>
              </div>

              <div className="jlx-job-stat">
                <div className="jlx-job-stat__header">
                  <div className="jlx-job-stat__icon-wrap jlx-job-stat__icon-wrap--green">
                    <CheckCircle2 className="jlx-job-stat__icon" size={24} />
                  </div>
                  <div className="jlx-job-stat__info">
                    <div className="jlx-job-stat__value">{stats.completed}</div>
                    <div className="jlx-job-stat__label">Đã hoàn tất</div>
                  </div>
                </div>
                <div className="jlx-job-stat__glow"></div>
              </div>

              <div className="jlx-job-stat">
                <div className="jlx-job-stat__header">
                  <div className="jlx-job-stat__icon-wrap jlx-job-stat__icon-wrap--orange">
                    <Clock className="jlx-job-stat__icon" size={24} />
                  </div>
                  <div className="jlx-job-stat__info">
                    <div className="jlx-job-stat__value">{stats.waiting}</div>
                    <div className="jlx-job-stat__label">Chờ phản hồi</div>
                  </div>
                </div>
                <div className="jlx-job-stat__glow"></div>
              </div>
            </section>

            {applications.length ? (
              <div className="jlx-main-visuals">
                {/* PIPELINE VISUALIZATION */}
                <div className="jlx-card jlx-pipeline">
                  <div className="jlx-card-header">
                    <DollarSign size={18} className="jlx-header-icon" />
                    <h3 className="jlx-card-title">LỊCH SỬ THU NHẬP</h3>
                  </div>
                  <article
                    className="jlx-income-summary"
                    aria-label="Tổng thu nhập"
                  >
                    <div className="jlx-income-summary__head">
                      <span className="jlx-income-summary__icon">
                        <DollarSign size={18} />
                      </span>
                      <div>
                        <p>Tổng thu nhập</p>
                        <strong>{formatCurrency(stats.earnings)}</strong>
                      </div>
                    </div>
                    <span className="jlx-income-summary__note">
                      Thu nhập từ các đơn đã hoàn tất và đã thanh toán.
                    </span>
                  </article>

                  <section
                    className="jlx-income-history"
                    aria-label="Bảng lịch sử thu nhập"
                  >
                    <div className="jlx-income-history__toolbar">
                      <label className="jlx-income-history__search">
                        <Search size={14} />
                        <input
                          value={incomeSearch}
                          onChange={(event) =>
                            setIncomeSearch(event.target.value)
                          }
                          placeholder="Tìm theo job hoặc công ty..."
                        />
                      </label>

                      <div className="jlx-income-history__toolbar-right">
                        <label className="jlx-income-history__control">
                          <span>Trạng thái</span>
                          <select
                            value={incomeStatusFilter}
                            onChange={(event) =>
                              setIncomeStatusFilter(
                                event.target.value as IncomeStatusFilter,
                              )
                            }
                          >
                            <option value="ALL">Tất cả</option>
                            <option value="PAID">Đã thanh toán</option>
                            <option value="COMPLETED">Hoàn tất</option>
                          </select>
                        </label>

                        <label className="jlx-income-history__control">
                          <span>Loại job</span>
                          <select
                            value={incomeTypeFilter}
                            onChange={(event) =>
                              setIncomeTypeFilter(event.target.value as JobType)
                            }
                          >
                            <option value="ALL">Tất cả</option>
                            <option value="REGULAR">Full-time</option>
                            <option value="SHORT_TERM">Gig</option>
                          </select>
                        </label>

                        <label className="jlx-income-history__control">
                          <span>Sắp xếp</span>
                          <select
                            value={incomeSort}
                            onChange={(event) =>
                              setIncomeSort(event.target.value as IncomeSort)
                            }
                          >
                            <option value="NEWEST">Mới nhất</option>
                            <option value="OLDEST">Cũ nhất</option>
                            <option value="AMOUNT_DESC">Tiền giảm dần</option>
                            <option value="AMOUNT_ASC">Tiền tăng dần</option>
                            <option value="TITLE_ASC">Tên job A-Z</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="jlx-income-history__table-wrap">
                      <table className="jlx-income-history__table">
                        <thead>
                          <tr>
                            <th>Job</th>
                            <th>Loại</th>
                            <th>Trạng thái ghi nhận</th>
                            <th>Ngày ghi nhận</th>
                            <th className="is-right">Số tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedIncomeHistory.length === 0 ? (
                            <tr>
                              <td colSpan={5}>
                                <div className="jlx-income-history__empty">
                                  Không có khoản thu nhập nào phù hợp bộ lọc.
                                </div>
                              </td>
                            </tr>
                          ) : (
                            pagedIncomeHistory.map((item) => (
                              <tr key={`${item.id}-${item.applicationId}`}>
                                <td>
                                  <div className="jlx-income-history__job-title">
                                    {item.title}
                                  </div>
                                  <div className="jlx-income-history__job-meta">
                                    {item.company || "Không rõ công ty"}
                                  </div>
                                </td>
                                <td>
                                  <span className="jlx-income-history__type">
                                    {item.type === "SHORT_TERM"
                                      ? "Gig"
                                      : "Full-time"}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`jlx-income-history__status ${
                                      item.status === "PAID"
                                        ? "is-paid"
                                        : "is-completed"
                                    }`}
                                  >
                                    {item.statusLabel}
                                  </span>
                                </td>
                                <td>{formatDate(item.recordedAt)}</td>
                                <td className="is-right">
                                  <span className="jlx-income-history__amount">
                                    + {formatCurrency(item.amount)}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="jlx-income-history__pagination">
                      <span>
                        {filteredIncomeHistory.length
                          ? `Hiển thị ${incomeRangeStart}-${incomeRangeEnd} / ${filteredIncomeHistory.length} khoản thu`
                          : "Chưa có khoản thu nhập"}
                      </span>
                      <div className="jlx-income-history__pagination-actions">
                        <button
                          type="button"
                          className="jlx-btn jlx-btn--ghost"
                          onClick={withPaginationScroll(() =>
                            setIncomePage((current) => Math.max(1, current - 1))
                          )}
                          disabled={incomePage <= 1}
                        >
                          Trước
                        </button>
                        <span>
                          Trang {incomePage}/{incomeTotalPages}
                        </span>
                        <button
                          type="button"
                          className="jlx-btn jlx-btn--ghost"
                          onClick={withPaginationScroll(() =>
                            setIncomePage((current) =>
                              Math.min(incomeTotalPages, current + 1),
                            )
                          )}
                          disabled={incomePage >= incomeTotalPages}
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  </section>

                  <div className="jlx-card-corner top-left"></div>
                  <div className="jlx-card-corner bottom-right"></div>
                </div>

                {/* DONUT SUMMARY */}
                <div className="jlx-card jlx-status-donut">
                  <div className="jlx-card-header">
                    <PieChart size={18} className="jlx-header-icon" />
                    <h3 className="jlx-card-title">PHÂN BỔ TRẠNG THÁI</h3>
                  </div>
                  <div className="jlx-donut-container">
                    <div
                      className="jlx-donut-chart"
                      style={statusSummary.donutStyle}
                    >
                      <div className="jlx-donut-hole">
                        <div className="jlx-donut-value">
                          {applications.length}
                        </div>
                        <div className="jlx-donut-label">TỔNG SỐ</div>
                      </div>
                    </div>
                    <div className="jlx-donut-legend">
                      {statusSummary.items.map((item) => (
                        <div className="jlx-legend-item" key={item.key}>
                          <span
                            className="jlx-dot"
                            style={{
                              backgroundColor: item.color,
                              boxShadow: `0 0 8px ${item.color}`,
                            }}
                          ></span>
                          <span className="jlx-legend-text">
                            {item.label.toUpperCase()} ({item.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="jlx-card-corner top-left"></div>
                  <div className="jlx-card-corner bottom-right"></div>
                </div>
              </div>
            ) : (
              <section className="jlx-joblab-empty-mission">
                <div className="jlx-joblab-empty-mission__orb jlx-joblab-empty-mission__orb--one" />
                <div className="jlx-joblab-empty-mission__orb jlx-joblab-empty-mission__orb--two" />
                <FolderOpen size={46} />
                <h3>Chưa có đơn nào</h3>
                <p>Apply job đầu tiên để bắt đầu hành trình!</p>
                <button
                  type="button"
                  className="jlx-btn jlx-btn--primary"
                  onClick={() => navigate("/jobs")}
                >
                  <Briefcase size={14} />
                  Khám phá job
                </button>
              </section>
            )}
          </>
        )}

        {viewMode === "applications" && (
          <>
            <section className="jlx-app-toolbar">
              <div className="jlx-app-toolbar__main">
                <div className="jlx-type-tabs">
                  {[
                    { id: "ALL", label: "Tất cả" },
                    { id: "REGULAR", label: "Freelance" },
                    { id: "SHORT_TERM", label: "Gig" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`jlx-type-tab${jobType === item.id ? " is-active" : ""}`}
                      onClick={() => setJobType(item.id as JobType)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <label className="jlx-search">
                  <Search size={16} />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm theo tên, công ty..."
                  />
                </label>
              </div>
              <div className="jlx-app-toolbar__filters">
                <label className="jlx-filter-control">
                  <Clock3 size={14} />
                  <select
                    value={applicationTimeFilter}
                    onChange={(event) => {
                      const nextFilter = event.target
                        .value as ApplicationTimeFilter;
                      setApplicationTimeFilter(nextFilter);
                      if (nextFilter !== "CUSTOM") {
                        setApplicationDateFrom("");
                        setApplicationDateTo("");
                      }
                    }}
                  >
                    <option value="ALL">Mọi thời gian</option>
                    <option value="THIS_WEEK">Tuần này</option>
                    <option value="THIS_MONTH">Tháng này</option>
                    <option value="CUSTOM">Trong khoảng thời gian</option>
                  </select>
                </label>

                {applicationTimeFilter === "CUSTOM" && (
                  <div className="jlx-date-range">
                    <label className="jlx-date-field">
                      <span>Từ ngày</span>
                      <input
                        type="date"
                        value={applicationDateFrom}
                        onChange={(event) =>
                          setApplicationDateFrom(event.target.value)
                        }
                      />
                    </label>
                    <label className="jlx-date-field">
                      <span>Đến ngày</span>
                      <input
                        type="date"
                        value={applicationDateTo}
                        onChange={(event) =>
                          setApplicationDateTo(event.target.value)
                        }
                        min={applicationDateFrom || undefined}
                      />
                    </label>
                  </div>
                )}
              </div>
            </section>

            {!applicationsViewItems.length ? (
              <div className="jlx-empty-state">
                <FolderOpen size={42} />
                <h3>Không có đơn phù hợp</h3>
                <p>Thử đổi bộ lọc hoặc tìm thêm công việc mới.</p>
              </div>
            ) : (
              <>
                <div className="jlx-card-grid">
                  {pagedApplications.map((app) => {
                    const status = STATUS_META[app.status] || {
                      label: app.status,
                      tone: "slate",
                      hint: "",
                    };
                    return (
                      <article key={app.id} className="jlx-job-card">
                        <div className="jlx-job-card__top">
                          <span
                            className={`jlx-type is-${app.type === "SHORT_TERM" ? "gig" : "regular"}`}
                          >
                            {app.type === "SHORT_TERM" ? "Gig" : "Freelance"}
                          </span>
                          <span className={`jlx-status is-${status.tone}`}>
                            {status.label}
                          </span>
                          {app.contractId && (
                            <span
                              className={`jlx-status is-${app.contractStatus === "SIGNED" ? "green" : "amber"}`}
                            >
                              {app.contractStatus === "SIGNED"
                                ? "Đã ký HĐ"
                                : "HĐ chờ ký"}
                            </span>
                          )}
                        </div>
                        <h4>{app.title}</h4>
                        <p className="jlx-job-card__company">
                          <Building2 size={14} />
                          {app.company || "SkillVerse"}
                        </p>
                        <div className="jlx-job-card__meta">
                          <span>
                            <DollarSign size={14} />
                            {formatApplicationBudget(app)}
                          </span>
                          <span>
                            <Calendar size={14} />
                            {formatDate(app.appliedAt)}
                          </span>
                        </div>
                        <p className="jlx-job-card__hint">{status.hint}</p>
                        <div className="jlx-job-card__actions">
                          <button
                            type="button"
                            className="jlx-btn jlx-btn--primary"
                            onClick={() => openWorkspace(app)}
                          >
                            <ClipboardList size={14} />
                            Mở workspace
                          </button>
                          {app.type === "SHORT_TERM" &&
                            ["PENDING", "REVIEWED"].includes(app.status) && (
                              <button
                                type="button"
                                className="jlx-btn jlx-btn--ghost"
                                onClick={() =>
                                  withdrawShortTermApplication(app)
                                }
                              >
                                <XCircle size={14} />
                                Rút đơn
                              </button>
                            )}
                          {app.contractId && (
                            <button
                              type="button"
                              className="jlx-btn jlx-btn--ghost"
                              onClick={() =>
                                navigate(`/contracts/${app.contractId}`)
                              }
                            >
                              <FileCheck size={14} />
                              Xem hợp đồng
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {applicationsTotalPages > 1 && (
                  <div className="jlx-pagination">
                    <div className="jlx-pagination__summary">
                      {applicationsViewItems.length} đơn •{" "}
                      {APPLICATIONS_PAGE_SIZE} đơn/trang
                    </div>
                    <div className="jlx-pagination__actions">
                      <button
                        type="button"
                        className="jlx-btn jlx-btn--ghost"
                        onClick={withPaginationScroll(() =>
                          setApplicationsPage((page) => Math.max(1, page - 1))
                        )}
                        disabled={applicationsPage === 1}
                      >
                        Trước
                      </button>
                      <span className="jlx-pagination__page">
                        Trang {applicationsPage}/{applicationsTotalPages}
                      </span>
                      <button
                        type="button"
                        className="jlx-btn jlx-btn--ghost"
                        onClick={withPaginationScroll(() =>
                          setApplicationsPage((page) =>
                            Math.min(applicationsTotalPages, page + 1),
                          )
                        )}
                        disabled={applicationsPage >= applicationsTotalPages}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {viewMode === "workspace" && (
          <section className="jlx-workspace">
            {fullTimeAppId ? (
              <JobLabFullTimeInlineView
                app={applications.find((a) => a.id === fullTimeAppId)!}
                onBack={() => setFullTimeAppId(null)}
                onRefresh={loadApplications}
              />
            ) : !workspaceListApplications.length ? (
              <div className="jlx-empty-state">
                <FolderOpen size={42} />
                <h3>Chưa có workspace nào</h3>
                <p>Hãy quay lại danh sách đơn để mở job chi tiết.</p>
              </div>
            ) : (
              <>
                <div className="jlx-workspace-bar">
                  <div className="jlx-workspace-bar__left">
                    <button
                      type="button"
                      className="jlx-workspace-bar__back"
                      onClick={() => setViewMode("applications")}
                    >
                      <FolderOpen size={14} />
                      Quay lại
                    </button>
                    <div className="jlx-workspace-bar__info">
                      <strong>{selectedApp?.title || "Workspace"}</strong>
                      <span>
                        {workspaceListApplications.length} đơn •{" "}
                        {jobType === "ALL"
                          ? "Tất cả"
                          : jobType === "REGULAR"
                            ? "Dài hạn"
                            : "Ngắn hạn"}
                      </span>
                    </div>
                  </div>
                  <div className="jlx-workspace-bar__right">
                    <div className="jlx-type-tabs jlx-type-tabs--workspace">
                      {[
                        { id: "ALL", label: "Tất cả" },
                        { id: "REGULAR", label: "Dài hạn (Freelance)" },
                        { id: "SHORT_TERM", label: "Ngắn hạn (Gig)" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`jlx-type-tab${jobType === item.id ? " is-active" : ""}`}
                          onClick={() => {
                            setJobType(item.id as JobType);
                            setWorkspacePage(1);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="jlx-workspace-layout">
                  <aside className="jlx-workspace-rail">
                    <div className="jlx-workspace-rail__head">
                      <div>
                        <span className="jlx-panel__eyebrow">
                          Danh sách đơn
                        </span>
                        <h3>Workspace</h3>
                      </div>
                      <span className="jlx-pill-count">
                        {workspaceListApplications.length}
                      </span>
                    </div>
                    <div className="jlx-workspace-rail__list">
                      {pagedWorkspaceApplications.map((app) => {
                        const status = STATUS_META[app.status] || {
                          label: app.status,
                          tone: "slate",
                        };
                        return (
                          <button
                            key={app.id}
                            type="button"
                            className={`jlx-workspace-entry${app.type === "SHORT_TERM" && selectedApp?.id === app.id ? " is-active" : ""}`}
                            onClick={() => openWorkspace(app)}
                          >
                            <div className="jlx-workspace-entry__top">
                              <span className={`jlx-status is-${status.tone}`}>
                                {status.label}
                              </span>
                              <span className="jlx-type is-compact">
                                {app.type === "SHORT_TERM"
                                  ? "Gig"
                                  : "Freelance"}
                              </span>
                            </div>
                            <strong>{app.title}</strong>
                            <p>{app.company || "SkillVerse"}</p>
                          </button>
                        );
                      })}
                    </div>
                    {workspaceTotalPages > 1 && (
                      <div className="jlx-workspace-rail__pagination">
                        <button
                          type="button"
                          className="jlx-btn jlx-btn--ghost"
                          onClick={withPaginationScroll(() =>
                            setWorkspacePage((page) => Math.max(1, page - 1))
                          )}
                          disabled={workspacePage === 1}
                        >
                          Trước
                        </button>
                        <span>
                          Trang {workspacePage}/{workspaceTotalPages}
                        </span>
                        <button
                          type="button"
                          className="jlx-btn jlx-btn--ghost"
                          onClick={withPaginationScroll(() =>
                            setWorkspacePage((page) =>
                              Math.min(workspaceTotalPages, page + 1),
                            )
                          )}
                          disabled={workspacePage >= workspaceTotalPages}
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </aside>

                  <div className="jlx-workspace-detail">
                    {selectedApp ? (
                      <>
                        <div className="jlx-workspace-hero">
                          <div>
                            <div className="jlx-hero-badge">
                              <ClipboardList size={13} />
                              <span>Không gian làm việc</span>
                            </div>
                            <h2>{selectedApp.title}</h2>
                            <p>
                              {
                                (
                                  STATUS_META[selectedApp.status] || {
                                    hint: "",
                                  }
                                ).hint
                              }
                            </p>
                            <div className="jlx-hero-tags">
                              <span className="jlx-chip">
                                <Building2 size={12} />
                                {selectedApp.company || "SkillVerse"}
                              </span>
                              <span className="jlx-chip">
                                <DollarSign size={12} />
                                {formatApplicationBudget(selectedApp)}
                              </span>
                              {selectedApp.proposedDuration && (
                                <span className="jlx-chip">
                                  <Timer size={12} />
                                  {selectedApp.proposedDuration}
                                </span>
                              )}
                            </div>

                            {/* SLA countdown — recruiter phải review trong 48h */}
                            {selectedApp.type === "SHORT_TERM" &&
                              selectedApp.status === "SUBMITTED" &&
                              selectedApp.reviewDeadlineAt && (
                                <div
                                  className={`jlx-sla-badge ${isOverdue(selectedApp.reviewDeadlineAt) ? "is-overdue" : isWarning(selectedApp.reviewDeadlineAt) ? "is-warning" : ""}`}
                                >
                                  <Clock size={14} />
                                  <span>
                                    {isOverdue(selectedApp.reviewDeadlineAt)
                                      ? "Đã quá hạn review! Bàn giao sẽ được tự động duyệt."
                                      : `Còn ${formatCountdown(selectedApp.reviewDeadlineAt)} để recruiter review`}
                                  </span>
                                </div>
                              )}

                            {/* Cancellation requested — warning banner */}
                            {selectedApp.type === "SHORT_TERM" &&
                              selectedApp.status ===
                                "CANCELLATION_REQUESTED" && (
                                <div className="jlx-warning-banner">
                                  <AlertTriangle size={18} />
                                  <div>
                                    <strong>
                                      Nhà tuyển dụng yêu cầu hủy công việc
                                    </strong>
                                    <p>
                                      Công việc đã qua 5 lần yêu cầu sửa đổi.
                                      {selectedApp.responseDeadlineAt && (
                                        <>
                                          {" "}
                                          Bạn có{" "}
                                          <strong>
                                            {formatCountdown(
                                              selectedApp.responseDeadlineAt,
                                            )}
                                          </strong>{" "}
                                          để phản hồi.
                                        </>
                                      )}
                                    </p>
                                    <p className="jlx-warning-banner__note">
                                      Sau{" "}
                                      {selectedApp.responseDeadlineAt
                                        ? new Date(
                                            selectedApp.responseDeadlineAt,
                                          ).toLocaleString("vi-VN")
                                        : ""}{" "}
                                      nếu không phản hồi, hệ thống sẽ tự động
                                      hủy và hoàn tiền cho nhà tuyển dụng.
                                    </p>
                                  </div>
                                </div>
                              )}

                            {/* SLA countdown cho phản hồi cancellation */}
                            {selectedApp.type === "SHORT_TERM" &&
                              selectedApp.status === "CANCELLATION_REQUESTED" &&
                              selectedApp.responseDeadlineAt && (
                                <div
                                  className={`jlx-sla-badge ${isOverdue(selectedApp.responseDeadlineAt) ? "is-overdue" : isWarning(selectedApp.responseDeadlineAt) ? "is-warning" : ""}`}
                                >
                                  <Clock size={14} />
                                  <span>
                                    {isOverdue(selectedApp.responseDeadlineAt)
                                      ? "Đã quá hạn! Công việc sẽ bị hủy tự động."
                                      : `Còn ${formatCountdown(selectedApp.responseDeadlineAt)} để phản hồi — chấp nhận hủy hoặc khiếu nại`}
                                  </span>
                                </div>
                              )}

                            {/* Dispute opened — show status */}
                            {selectedApp.type === "SHORT_TERM" &&
                              selectedApp.status ===
                                "CANCELLATION_REQUESTED" && (
                                <div className="jlx-warning-banner">
                                  <AlertTriangle size={18} />
                                  <div>
                                    <strong>
                                      Yêu cầu hủy đang chờ admin xem xét
                                    </strong>
                                    <p>
                                      Recruiter đã gửi yêu cầu hủy sau nhiều lần
                                      sửa đổi. Admin sẽ kiểm tra audit log và
                                      bằng chứng trước khi quyết định.
                                    </p>
                                    <p className="jlx-warning-banner__note">
                                      Bạn không cần chấp nhận hủy. Nếu không
                                      đồng ý, hãy gửi dispute và đính kèm file
                                      hoặc hình ảnh chứng minh công việc đã làm
                                      đúng yêu cầu.
                                    </p>
                                  </div>
                                </div>
                              )}

                            {selectedApp.type === "SHORT_TERM" &&
                              selectedApp.status === "REVISION_REQUIRED" &&
                              selectedApp.disputeEligibilityUnlocked && (
                                <div className="jlx-warning-banner">
                                  <AlertTriangle size={18} />
                                  <div>
                                    <strong>
                                      Đã mở quyền dispute sau 5 lần sửa
                                    </strong>
                                    <p>
                                      Công việc này đã chạm ngưỡng 5 lần yêu cầu
                                      sửa. Nếu recruiter tiếp tục gây bất lợi,
                                      bạn có thể gửi dispute cho admin cùng bằng
                                      chứng để được xem xét bảo vệ.
                                    </p>
                                  </div>
                                </div>
                              )}

                            {selectedApp.type === "SHORT_TERM" &&
                              selectedApp.status === "DISPUTE_OPENED" && (
                                <div className="jlx-sla-badge is-warning">
                                  <Shield size={14} />
                                  <span>
                                    Khiếu nại đã gửi lên Admin. Vui lòng chờ xử
                                    lý.
                                  </span>
                                </div>
                              )}
                          </div>
                          <div className="jlx-hero-right">
                            <span
                              className={`jlx-status is-${(STATUS_META[selectedApp.status] || { tone: "slate" }).tone}`}
                            >
                              {
                                (
                                  STATUS_META[selectedApp.status] || {
                                    label: selectedApp.status,
                                  }
                                ).label
                              }
                            </span>
                            {selectedApp.status === "OFFER_ACCEPTED" && (
                              <span className="jlx-status is-green">
                                <CheckCircle2 size={11} />
                                Đã chấp nhận
                              </span>
                            )}
                            {selectedApp.status === "OFFER_REJECTED" && (
                              <span className="jlx-status is-red">
                                <XCircle size={11} />
                                Đã phản đề nghị
                              </span>
                            )}
                            <div className="jlx-hero-meta">
                              <div className="jlx-hero-meta-item">
                                <Calendar size={13} />
                                <span>{formatDate(selectedApp.appliedAt)}</span>
                              </div>
                              <div className="jlx-hero-meta-item">
                                {selectedApp.isRemote ? (
                                  <Globe size={13} />
                                ) : (
                                  <MapPin size={13} />
                                )}
                                <span>
                                  {selectedApp.isRemote
                                    ? "Remote"
                                    : selectedApp.location || "Cập nhật sau"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedApp.type === "SHORT_TERM" && (
                          <div className="jlx-stepper">
                            {Object.entries(WORKSPACE_STEPS).map(
                              ([key, label], index) => {
                                const allKeys = Object.keys(WORKSPACE_STEPS);
                                const currentIndex = allKeys.indexOf(
                                  selectedApp.status,
                                );
                                const stepIndex = index;
                                const done =
                                  currentIndex !== -1 &&
                                  stepIndex < currentIndex;
                                const active = stepIndex === currentIndex;
                                return (
                                  <React.Fragment key={key}>
                                    <div
                                      className={`jlx-step${done ? " is-done" : ""}${active ? " is-active" : ""}`}
                                    >
                                      <div className="jlx-step__dot">
                                        {done ? (
                                          <CheckCircle2 size={12} />
                                        ) : (
                                          index + 1
                                        )}
                                      </div>
                                      <span>{label}</span>
                                    </div>
                                    {index <
                                      Object.keys(WORKSPACE_STEPS).length -
                                        1 && (
                                      <div className="jlx-step__connector" />
                                    )}
                                  </React.Fragment>
                                );
                              },
                            )}
                          </div>
                        )}

                        <div
                          className={`jlx-workspace-grid${
                            selectedApp.type === "REGULAR" &&
                            selectedApp.status === "OFFER_SENT"
                              ? " is-expanded"
                              : ""
                          }`}
                        >
                          <article className="jlx-panel">
                            <div className="jlx-info-grid">
                              <div className="jlx-info-card">
                                <span>Ngày ứng tuyển</span>
                                <strong>
                                  {formatDate(selectedApp.appliedAt)}
                                </strong>
                              </div>
                              <div className="jlx-info-card">
                                <span>Loại công việc</span>
                                <strong>
                                  {selectedApp.type === "SHORT_TERM"
                                    ? "Gig"
                                    : "Freelance"}
                                </strong>
                              </div>
                              {selectedApp.proposedPrice && (
                                <div className="jlx-info-card">
                                  <span>Giá đề xuất</span>
                                  <strong>
                                    {formatCurrency(selectedApp.proposedPrice)}
                                  </strong>
                                </div>
                              )}
                              {selectedApp.revisionCount !== undefined && (
                                <div className="jlx-info-card">
                                  <span>Số vòng sửa</span>
                                  <strong>{selectedApp.revisionCount}</strong>
                                </div>
                              )}
                            </div>

                            {/* ====== FEEDBACK SECTION ====== */}
                            <div className="jlx-feedback-section">
                              <div className="jlx-feedback-section__header">
                                <MessageSquare size={14} />
                                <span>Feedback từ Nhà tuyển dụng</span>
                                {selectedApp.revisionNotes &&
                                  selectedApp.revisionNotes.length > 0 && (
                                    <span className="jlx-feedback-section__count">
                                      {selectedApp.revisionNotes.length}
                                    </span>
                                  )}
                              </div>

                              {/* Recruiter open feedback — most prominent */}
                              {selectedApp.revisionNotes?.some(
                                (n) =>
                                  !n.resolvedAt &&
                                  n.requestedById !== selectedApp.applicationId,
                              ) ? (
                                <div className="jlx-feedback-list jlx-feedback-list--scrollable">
                                  {selectedApp.revisionNotes
                                    .slice()
                                    .sort(
                                      (a, b) =>
                                        new Date(b.requestedAt).getTime() -
                                        new Date(a.requestedAt).getTime(),
                                    )
                                    .map((note) => {
                                      const isRecruiter =
                                        note.requestedById !==
                                        selectedApp.applicationId;
                                      const isResolved = !!note.resolvedAt;
                                      return (
                                        <div
                                          key={note.id}
                                          className={`jlx-feedback-card ${isRecruiter ? (isResolved ? "is-recruiter-resolved" : "is-recruiter-open") : "is-worker"}`}
                                        >
                                          <div className="jlx-feedback-card__top">
                                            <div className="jlx-feedback-card__author-row">
                                              {isRecruiter ? (
                                                <Building2 size={13} />
                                              ) : (
                                                <CheckCircle2 size={13} />
                                              )}
                                              <span className="jlx-feedback-card__author">
                                                {note.requestedByName ||
                                                  "Nộp bài"}
                                              </span>
                                              <span
                                                className={`jlx-feedback-card__badge ${isRecruiter ? "badge-recruiter" : "badge-worker"}`}
                                              >
                                                {isRecruiter
                                                  ? "Nhà tuyển dụng"
                                                  : "Ứng viên"}
                                              </span>
                                              {isResolved ? (
                                                <span className="jlx-feedback-card__status badge-resolved">
                                                  <CheckCircle2 size={10} /> Đã
                                                  xử lý
                                                </span>
                                              ) : isRecruiter ? (
                                                <span className="jlx-feedback-card__status badge-open">
                                                  <AlertTriangle size={10} />{" "}
                                                  Cần sửa
                                                </span>
                                              ) : null}
                                            </div>
                                            <span className="jlx-feedback-card__time">
                                              {formatDate(note.requestedAt)}
                                            </span>
                                          </div>
                                          <p className="jlx-feedback-card__note">
                                            {note.note}
                                          </p>
                                          {note.specificIssues &&
                                            note.specificIssues.length > 0 && (
                                              <ul className="jlx-feedback-card__issues">
                                                {note.specificIssues.map(
                                                  (issue, i) => (
                                                    <li key={i}>{issue}</li>
                                                  ),
                                                )}
                                              </ul>
                                            )}
                                        </div>
                                      );
                                    })}
                                </div>
                              ) : (
                                <div className="jlx-feedback-empty">
                                  <MessageSquare size={18} />
                                  <span>
                                    Chưa có feedback từ Nhà tuyển dụng
                                  </span>
                                </div>
                              )}
                            </div>

                            {selectedApp.coverLetter && (
                              <div className="jlx-note">
                                <h4>
                                  <FileText size={16} />
                                  Cover letter
                                </h4>
                                <p>{selectedApp.coverLetter}</p>
                              </div>
                            )}

                            {selectedApp.workNote && (
                              <div className="jlx-note">
                                <h4>
                                  <FileCheck size={16} />
                                  Ghi chú bàn giao gần nhất
                                </h4>
                                <p>{selectedApp.workNote}</p>
                              </div>
                            )}

                            {!!selectedApp.deliverables?.length && (
                              <div className="jlx-deliverables">
                                {selectedApp.deliverables.map((item) => (
                                  <a
                                    key={item.id}
                                    href={item.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="jlx-deliverable"
                                  >
                                    <FileCheck size={14} />
                                    <span>{item.fileName}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </article>

                          <aside className="jlx-workspace-side">
                            <article className="jlx-panel">
                              <div className="jlx-status-explainer">
                                <strong>
                                  {
                                    (
                                      STATUS_META[selectedApp.status] || {
                                        label: selectedApp.status,
                                      }
                                    ).label
                                  }
                                </strong>
                                <p>
                                  {
                                    (
                                      STATUS_META[selectedApp.status] || {
                                        hint: "",
                                      }
                                    ).hint
                                  }
                                </p>
                              </div>
                            </article>

                            {/* Cancellation requested actions */}
                            {selectedApp.type === "SHORT_TERM" &&
                              selectedApp.status ===
                                "CANCELLATION_REQUESTED" && (
                                <article className="jlx-panel">
                                  <div className="jlx-dispute-actions">
                                    <button
                                      type="button"
                                      className="jlx-btn jlx-btn--danger"
                                      onClick={() =>
                                        openDisputeForm(selectedApp)
                                      }
                                    >
                                      <Shield size={14} />
                                      Khiếu nại lên Admin
                                    </button>
                                    <button
                                      type="button"
                                      className="jlx-btn jlx-btn--ghost"
                                      onClick={() =>
                                        acceptCancellation(selectedApp)
                                      }
                                    >
                                      <CheckCircle2 size={14} />
                                      Chấp nhận hủy
                                    </button>
                                  </div>
                                </article>
                              )}
                            {canOpenDispute(selectedApp) && (
                              <article className="jlx-panel">
                                <div className="jlx-dispute-actions">
                                  <button
                                    type="button"
                                    className="jlx-btn jlx-btn--danger"
                                    onClick={() => openDisputeForm(selectedApp)}
                                  >
                                    <Shield size={14} />
                                    {selectedApp.status ===
                                    "CANCELLATION_REQUESTED"
                                      ? "Gửi bằng chứng cho admin"
                                      : "Mở dispute sau 5 lần sửa"}
                                  </button>
                                </div>
                              </article>
                            )}

                            {/* OFFER REJECTED PANEL — shown after candidate countered/responded,
                                before recruiter re-sends offer or permanently closes */}
                            {selectedApp.type === "REGULAR" &&
                              selectedApp.status === "OFFER_REJECTED" && (
                                <article className="jlx-panel jlx-panel--offer-rejected">
                                  <div className="jlx-offer-panel">
                                    <div className="jlx-offer-panel__header">
                                      <Clock3 size={16} />
                                      <div>
                                        <strong>
                                          Chờ phản hồi từ Nhà tuyển dụng
                                        </strong>
                                        <span>
                                          Phản đề nghị của bạn đã được gửi
                                        </span>
                                      </div>
                                    </div>

                                    {selectedApp.offerRound === 2 && (
                                      <div className="jlx-offer-rejected-notice">
                                        <AlertTriangle size={14} />
                                        <p>
                                          Đây là vòng cuối. Nhà tuyển dụng có
                                          thể gửi đề nghị lại hoặc kết thúc. Nếu
                                          bị từ chối, hồ sơ sẽ bị loại.
                                        </p>
                                      </div>
                                    )}

                                    {/* Show candidate's previous response */}
                                    {selectedApp.candidateOfferResponse && (
                                      <div className="jlx-feedback-card is-worker">
                                        <div className="jlx-feedback-card__author-row">
                                          <span className="jlx-feedback-card__author">
                                            Bạn
                                          </span>
                                          <span className="jlx-feedback-card__badge badge-worker">
                                            Phản đề nghị
                                          </span>
                                        </div>
                                        <p className="jlx-feedback-card__note">
                                          {selectedApp.candidateOfferResponse}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </article>
                              )}

                            {/* OFFER ACCEPTED feedback — only shown when OFFER_ACCEPTED */}
                            {selectedApp.status === "OFFER_ACCEPTED" &&
                              selectedApp.candidateOfferResponse && (
                                <article className="jlx-panel">
                                  <div className="jlx-feedback-section">
                                    <div className="jlx-feedback-section__header">
                                      <Paperclip size={14} />
                                      <span>Phản hồi của bạn</span>
                                    </div>
                                    <div className="jlx-feedback-card is-worker">
                                      <div className="jlx-feedback-card__top">
                                        <div className="jlx-feedback-card__author-row">
                                          <CheckCircle2 size={13} />
                                          <span className="jlx-feedback-card__author">
                                            Bạn
                                          </span>
                                          <span className="jlx-feedback-card__badge badge-worker">
                                            Chấp thuận
                                          </span>
                                        </div>
                                      </div>
                                      <p className="jlx-feedback-card__note">
                                        {selectedApp.candidateOfferResponse}
                                      </p>
                                    </div>
                                  </div>
                                </article>
                              )}
                          </aside>
                        </div>

                        {canSubmitWork(selectedApp) && (
                          <article className="jlx-panel jlx-panel--workspace">
                            <div className="jlx-form-grid">
                              <div className="jlx-field">
                                <label>Báo cáo công việc</label>
                                <textarea
                                  value={workNote}
                                  onChange={(event) =>
                                    setWorkNote(event.target.value)
                                  }
                                  rows={7}
                                  placeholder="Mô tả kết quả công việc và nội dung bàn giao..."
                                />
                              </div>

                              <div className="jlx-field">
                                <label>Tệp đính kèm</label>
                                <label className="jlx-upload">
                                  <input
                                    type="file"
                                    multiple
                                    onChange={(event) =>
                                      setWorkFiles((current) => [
                                        ...current,
                                        ...Array.from(event.target.files || []),
                                      ])
                                    }
                                  />
                                  <Upload size={18} />
                                  <span>Thêm file bàn giao</span>
                                </label>
                                {!!workFiles.length && (
                                  <div className="jlx-upload-list">
                                    {workFiles.map((file, index) => (
                                      <div
                                        key={`${file.name}-${index}`}
                                        className="jlx-upload-item"
                                      >
                                        <span>{file.name}</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setWorkFiles((current) =>
                                              current.filter(
                                                (_, currentIndex) =>
                                                  currentIndex !== index,
                                              ),
                                            )
                                          }
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="jlx-field">
                                <label>Liên kết tham chiếu</label>
                                <div className="jlx-link-stack">
                                  {workLinks.map((link, index) => (
                                    <div key={index} className="jlx-link-row">
                                      <input
                                        value={link}
                                        onChange={(event) =>
                                          setWorkLinks((current) =>
                                            current.map((item, currentIndex) =>
                                              currentIndex === index
                                                ? event.target.value
                                                : item,
                                            ),
                                          )
                                        }
                                        placeholder="Link demo, GitHub, Figma..."
                                      />
                                      {workLinks.length > 1 && (
                                        <button
                                          type="button"
                                          className="jlx-icon-btn"
                                          onClick={() =>
                                            setWorkLinks((current) =>
                                              current.filter(
                                                (_, currentIndex) =>
                                                  currentIndex !== index,
                                              ),
                                            )
                                          }
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="jlx-btn jlx-btn--ghost"
                                    onClick={() =>
                                      setWorkLinks((current) => [
                                        ...current,
                                        "",
                                      ])
                                    }
                                  >
                                    <LinkIcon size={14} />
                                    Thêm liên kết
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                className={`jlx-final-toggle${isFinalSubmission ? " is-active" : ""}`}
                                onClick={() =>
                                  setIsFinalSubmission((current) => !current)
                                }
                              >
                                <div className="jlx-final-toggle__check">
                                  {isFinalSubmission ? (
                                    <CheckCircle2 size={16} />
                                  ) : (
                                    <ClipboardList size={16} />
                                  )}
                                </div>
                                <div>
                                  <strong>Bàn giao cuối cùng</strong>
                                  <span>
                                    Đánh dấu nếu đây là phiên bản hoàn chỉnh.
                                  </span>
                                </div>
                              </button>
                            </div>

                            <div className="jlx-submit-bar">
                              <div className="jlx-submit-bar__meta">
                                <span>{workFiles.length} file</span>
                                <span>
                                  {
                                    workLinks.filter((item) => item.trim())
                                      .length
                                  }{" "}
                                  link
                                </span>
                              </div>
                              <button
                                type="button"
                                className="jlx-btn jlx-btn--primary"
                                onClick={submitDeliverables}
                                disabled={submitting}
                              >
                                {submitting ? (
                                  <>
                                    <RefreshCw size={14} className="jlx-spin" />
                                    Đang gửi
                                  </>
                                ) : (
                                  <>
                                    <Send size={14} />
                                    {isFinalSubmission
                                      ? "Gửi bàn giao cuối"
                                      : "Gửi báo cáo"}
                                  </>
                                )}
                              </button>
                            </div>
                          </article>
                        )}
                      </>
                    ) : (
                      <div className="jlx-empty-inline">
                        {jobType === "REGULAR"
                          ? "Chọn một đơn dài hạn ở cột trái để mở workspace chi tiết."
                          : jobType === "SHORT_TERM"
                            ? "Chọn một đơn Gig ở cột trái để xem workspace chi tiết."
                            : "Chọn một đơn ở cột trái để mở workspace chi tiết."}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {viewMode === "contracts" && (
          <section className="jlx-contracts-section">
            <ContractListPage role="CANDIDATE" />
          </section>
        )}

        {viewMode === "interviews" && (
          <section className="jlx-interviews-section">
            <InterviewListPanel />
          </section>
        )}

        {viewMode === "offers" && (
          <section className="jlx-offers-section">
            <JobLabOffersView
              applications={applications}
              onRefresh={loadApplications}
            />
          </section>
        )}

        {viewMode === "onboarding" && (
          <section className="jlx-onboarding-section">
            {onboardingApps.length === 0 ? (
              <div className="jlx-empty-state">
                <Shield size={42} />
                <h3>Không có job nào cần onboarding</h3>
                <p>Các job Remote đang chờ bạn cung cấp thông tin sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
                {/* Horizontal Pill Selector for Multiple Jobs */}
                {onboardingApps.length > 1 && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
                    background: 'rgba(30,41,59,0.5)', padding: '8px', borderRadius: 999, border: '1px solid rgba(100,116,139,0.2)'
                  }}>
                    {onboardingApps.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedOnboardingAppId(app.id)}
                        style={{
                          padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                          background: selectedOnboardingAppId === app.id ? 'rgba(0,240,255,0.15)' : 'transparent',
                          color: selectedOnboardingAppId === app.id ? '#00f0ff' : '#94a3b8',
                          border: 'none', transition: 'all 0.2s', fontSize: '0.88rem',
                          fontWeight: selectedOnboardingAppId === app.id ? 600 : 400
                        }}
                      >
                        {app.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* Centered Focus Panel */}
                <div style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
                  {selectedOnboardingAppId && onboardingApps.find(a => a.id === selectedOnboardingAppId) && (
                    <div style={{ 
                      marginBottom: 24, textAlign: 'center', 
                      background: 'linear-gradient(90deg, rgba(0,240,255,0) 0%, rgba(0,240,255,0.05) 50%, rgba(0,240,255,0) 100%)',
                      padding: '16px 0', borderBottom: '1px solid rgba(0,240,255,0.2)'
                    }}>
                      <span style={{ color: '#00f0ff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
                        ONBOARDING CHO VỊ TRÍ
                      </span>
                      <h2 style={{ margin: '6px 0 0', fontSize: '1.5rem', color: '#fff', fontWeight: 600 }}>
                        {onboardingApps.find(a => a.id === selectedOnboardingAppId)?.title}
                      </h2>
                      <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontSize: '0.95rem' }}>
                        {onboardingApps.find(a => a.id === selectedOnboardingAppId)?.company}
                      </p>
                    </div>
                  )}

                  {selectedOnboardingAppId && onboardingApps.find(a => a.id === selectedOnboardingAppId) ? (
                    <CandidateOnboardingPanel
                      applicationId={onboardingApps.find(a => a.id === selectedOnboardingAppId)!.applicationId}
                      onComplete={() => {
                        setSelectedOnboardingAppId(null);
                        void loadApplications();
                      }}
                      onCancel={onboardingApps.length > 1 ? () => setSelectedOnboardingAppId(null) : undefined}
                    />
                  ) : (
                    <div className="jlx-empty-state" style={{ minHeight: 300 }}>
                      <Shield size={32} />
                      <h3>Chọn một job để bắt đầu</h3>
                      <p>Vui lòng chọn job cần cung cấp thông tin.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {viewMode === "disputes" && (
          <section className="jlx-disputes-section">
            <section className="jlx-app-toolbar">
              <div className="jlx-app-toolbar__main">
                <label className="jlx-search">
                  <Search size={16} />
                  <input
                    value={disputeSearchTerm}
                    onChange={(event) =>
                      setDisputeSearchTerm(event.target.value)
                    }
                    placeholder="Tìm theo mã dispute, job, lý do..."
                  />
                </label>
                <div className="jlx-dispute-summary-chip">
                  <Shield size={14} />
                  <span>
                    Tổng {submittedDisputes.length} dispute • Đang xử lý{" "}
                    {unresolvedSubmittedDisputesCount}
                  </span>
                </div>
              </div>
              <div className="jlx-app-toolbar__filters">
                <label className="jlx-filter-control">
                  <AlertTriangle size={14} />
                  <select
                    value={disputeStatusFilter}
                    onChange={(event) =>
                      setDisputeStatusFilter(
                        event.target.value as DisputeStatusFilter,
                      )
                    }
                  >
                    {DISPUTE_STATUS_FILTER_ITEMS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            {disputesLoading ? (
              <div className="jlx-disputes-loading">
                <RefreshCw size={18} className="jlx-spin" />
                Đang tải danh sách dispute đã gửi...
              </div>
            ) : !filteredSubmittedDisputes.length ? (
              <div className="jlx-empty-state">
                <Shield size={42} />
                <h3>Không có dispute phù hợp</h3>
                <p>Thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
              </div>
            ) : (
              <>
                <div className="jlx-card-grid">
                  {pagedSubmittedDisputes.map((item) => {
                    const statusMeta = DISPUTE_STATUS_META[item.status] || {
                      label: item.status,
                      tone: "slate",
                      hint: "Đang chờ cập nhật trạng thái từ hệ thống.",
                    };

                    return (
                      <article
                        key={item.id}
                        className="jlx-job-card jlx-dispute-card"
                      >
                        <div className="jlx-job-card__top">
                          <span className={`jlx-status is-${statusMeta.tone}`}>
                            {statusMeta.label}
                          </span>
                          <span className="jlx-type is-gig">
                            Dispute #{item.id}
                          </span>
                        </div>

                        <h4>
                          {item.jobTitle ||
                            (item.jobId
                              ? `Công việc #${item.jobId}`
                              : "Dispute chưa gắn job")}
                        </h4>

                        <p className="jlx-job-card__company">
                          <Building2 size={14} />
                          {item.respondentName
                            ? `Đối tác: ${item.respondentName}`
                            : "Đối tác đang cập nhật"}
                        </p>

                        <div className="jlx-job-card__meta">
                          <span>
                            <Shield size={14} />
                            {getDisputeTypeLabel(item.disputeType)}
                          </span>
                          <span>
                            <Calendar size={14} />
                            Tạo lúc {formatDateTime(item.createdAt)}
                          </span>
                        </div>

                        <p className="jlx-dispute-card__reason">
                          {item.reason}
                        </p>

                        <div className="jlx-dispute-card__meta-grid">
                          <div className="jlx-dispute-card__meta-item">
                            <span>Job / Application</span>
                            <strong>
                              #{item.jobId || "-"} / #
                              {item.applicationId || "-"}
                            </strong>
                          </div>
                          <div className="jlx-dispute-card__meta-item">
                            <span>
                              {item.resolvedAt ? "Đóng lúc" : "Hạn SLA"}
                            </span>
                            <strong>
                              {item.resolvedAt
                                ? formatDateTime(item.resolvedAt)
                                : formatDateTime(
                                    item.adminResolutionDeadlineAt,
                                  )}
                            </strong>
                          </div>
                        </div>

                        <p className="jlx-job-card__hint">{statusMeta.hint}</p>

                        {item.resolution && (
                          <p className="jlx-dispute-card__resolution">
                            Kết quả:{" "}
                            {getDisputeResolutionLabel(item.resolution)}
                            {item.partialRefundPct !== undefined
                              ? ` (${item.partialRefundPct}%)`
                              : ""}
                          </p>
                        )}

                        {item.resolutionNotes && (
                          <p className="jlx-dispute-card__notes">
                            Ghi chú admin: {item.resolutionNotes}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>

                {disputesTotalPages > 1 && (
                  <div className="jlx-pagination">
                    <div className="jlx-pagination__summary">
                      {filteredSubmittedDisputes.length} dispute •{" "}
                      {DISPUTES_PAGE_SIZE} dispute/trang
                    </div>
                    <div className="jlx-pagination__actions">
                      <button
                        type="button"
                        className="jlx-btn jlx-btn--ghost"
                        onClick={withPaginationScroll(() =>
                          setDisputesPage((page) => Math.max(1, page - 1))
                        )}
                        disabled={disputesPage === 1}
                      >
                        Trước
                      </button>
                      <span className="jlx-pagination__page">
                        Trang {disputesPage}/{disputesTotalPages}
                      </span>
                      <button
                        type="button"
                        className="jlx-btn jlx-btn--ghost"
                        onClick={withPaginationScroll(() =>
                          setDisputesPage((page) =>
                            Math.min(disputesTotalPages, page + 1),
                          )
                        )}
                        disabled={disputesPage >= disputesTotalPages}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Dispute modal */}
        {showDisputeModal && selectedApp && (
          <div
            className="jlx-modal-overlay"
            onClick={() => setShowDisputeModal(false)}
          >
            <div
              className="jlx-modal jlx-modal--dispute"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="jlx-modal__header">
                <div className="jlx-modal__header-left">
                  <Shield size={18} />
                  <h3>Gửi Khiếu Nại lên Admin</h3>
                </div>
                <button
                  type="button"
                  className="jlx-modal__close"
                  onClick={() => setShowDisputeModal(false)}
                >
                  <XCircle size={18} />
                </button>
              </div>
              <div className="jlx-modal__body">
                <p className="jlx-modal__desc">
                  Mô tả chi tiết vấn đề của bạn. Admin sẽ xem xét trong 5 ngày
                  làm việc. Bạn có thể thêm minh chứng để hỗ trợ khiếu nại của
                  mình.
                </p>

                {/* Dispute type */}
                <div className="jlx-field">
                  <label>Loại khiếu nại</label>
                  <select
                    value={disputeType}
                    onChange={(e) => setDisputeType(e.target.value)}
                    className="jlx-select"
                  >
                    <option value="WORKER_PROTECTION">
                      Nhà tuyển dụng làm đủ sai qua 5 lần sửa đổi
                    </option>
                    <option value="POOR_QUALITY">
                      Chất lượng không đạt yêu cầu
                    </option>
                    <option value="SCOPE_CHANGE">
                      Phạm vi công việc thay đổi không thỏa thuận
                    </option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                {/* Evidence type */}
                <div className="jlx-field">
                  <label>Loại minh chứng chính</label>
                  <select
                    value={disputeSelectedEvidenceType}
                    onChange={(e) =>
                      setDisputeSelectedEvidenceType(e.target.value)
                    }
                    className="jlx-select"
                  >
                    <option value="TEXT">Văn bản (Text)</option>
                    <option value="SCREENSHOT">
                      Ảnh chụp màn hình (Screenshot)
                    </option>
                    <option value="CHAT_LOG">Lịch sử chat (Chat Log)</option>
                    <option value="LINK">Liên kết (Link)</option>
                    <option value="DELIVERABLE_SNAPSHOT">
                      Ảnh bàn giao (Deliverable Snapshot)
                    </option>
                  </select>
                  <span className="jlx-field__hint">
                    Loại minh chứng sẽ được gắn cho nội dung lý do bạn nhập bên
                    dưới.
                  </span>
                </div>

                {/* Reason textarea */}
                <div className="jlx-field">
                  <label>
                    Lý do khiếu nại <span className="jlx-required">*</span>
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    rows={5}
                    placeholder="Mô tả chi tiết vấn đề của bạn (tối thiểu 20 ký tự). Nếu chọn loại minh chứng là TEXT, nội dung này sẽ được gửi làm minh chứng..."
                    className="jlx-textarea"
                  />
                  <span className="jlx-field__hint">
                    {disputeReason.length}/20 ký tự tối thiểu
                  </span>
                </div>

                {/* File upload area */}
                <div className="jlx-field">
                  <label>Minh chứng kèm theo (tùy chọn)</label>
                  <div
                    className="jlx-dispute-upload"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      const previews = files.map((f) => URL.createObjectURL(f));
                      setDisputeFiles((prev) => [...prev, ...files]);
                      setDisputeFilesPreview((prev) => [...prev, ...previews]);
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleDisputeFileSelect}
                      className="jlx-dispute-upload__input"
                      id="dispute-file-input"
                    />
                    <label
                      htmlFor="dispute-file-input"
                      className="jlx-dispute-upload__label"
                    >
                      <Upload size={22} />
                      <span className="jlx-dispute-upload__text">
                        Kéo thả file vào đây hoặc <strong>nhấn để chọn</strong>
                      </span>
                      <span className="jlx-dispute-upload__hint">
                        Hỗ trợ: ảnh, PDF, DOC, DOCX, TXT (nhiều file)
                      </span>
                    </label>
                  </div>

                  {/* Selected files list */}
                  {disputeFilesPreview.length > 0 && (
                    <div className="jlx-dispute-files">
                      {disputeFilesPreview.map((preview, index) => {
                        const file = disputeFiles[index];
                        const isImage = file?.type.startsWith("image/");
                        return (
                          <div
                            key={`${file?.name}-${index}`}
                            className="jlx-dispute-file-item"
                          >
                            {isImage ? (
                              <img
                                src={preview}
                                alt={file?.name}
                                className="jlx-dispute-file-item__thumb"
                              />
                            ) : (
                              <div className="jlx-dispute-file-item__icon">
                                <FileText size={16} />
                              </div>
                            )}
                            <div className="jlx-dispute-file-item__info">
                              <span className="jlx-dispute-file-item__name">
                                {file?.name}
                              </span>
                              <span className="jlx-dispute-file-item__size">
                                {file && file.size > 0
                                  ? `${(file.size / 1024).toFixed(1)} KB`
                                  : ""}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="jlx-dispute-file-item__remove"
                              onClick={() => removeDisputeFile(index)}
                              disabled={disputeSubmitting}
                              aria-label="Xóa file"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="jlx-modal__footer">
                <button
                  type="button"
                  className="jlx-btn jlx-btn--ghost"
                  onClick={() => setShowDisputeModal(false)}
                  disabled={disputeSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="jlx-btn jlx-btn--danger"
                  onClick={() => submitDispute(selectedApp)}
                  disabled={
                    disputeSubmitting || disputeReason.trim().length < 20
                  }
                >
                  {disputeSubmitting ? (
                    <>
                      <RefreshCw size={14} className="jlx-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Shield size={14} />
                      Gửi khiếu nại lên Admin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobLabPage;
