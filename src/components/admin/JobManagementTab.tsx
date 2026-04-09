import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearchParams } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Clock,
  Zap,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox,
  Flame,
  TrendingUp,
  ChevronRight,
  Check,
  X,
  FileText,
  CreditCard,
  Star,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  Ban,
  Trash2,
  Unlock,
  Gavel,
  BarChart3,
  ChevronUp,
  ChevronDown,
  List,
  ShieldAlert,
  MessageSquare,
  Scale,
  ArrowUpDown,
  PieChart as PieChartIcon,
  TrendingDown,
  Activity,
  Target,
  Award,
  Link as LinkIcon,
  Paperclip,
  Image,
  Send,
  Download,
  ExternalLink,
  User,
  Percent,
  Mail,
} from "lucide-react";
import adminService from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import {
  AdminJobStats,
  PageResponse,
  DisputeResponse,
  DisputeResolution,
  ResolveDisputeRequest,
} from "../../data/adminDTOs";
import {
  ShortTermJobStatus,
  SHORT_TERM_JOB_STATUS_DISPLAY,
  JobUrgency,
  Dispute,
  JobStatusAuditLog,
} from "../../types/ShortTermJob";
import Toast from "../shared/Toast";
import "./JobManagementTab.css";

type SubTab = "stats" | "all" | "approve" | "disputes";

// ==================== CONSTANTS ====================

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#64748b",
  PENDING_APPROVAL: "#f59e0b",
  PUBLISHED: "#3b82f6",
  APPLIED: "#06b6d4",
  IN_PROGRESS: "#f97316",
  SUBMITTED: "#a855f7",
  UNDER_REVIEW: "#eab308",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
  COMPLETED: "#14b8a6",
  PAID: "#10b981",
  CANCELLED: "#475569",
  DISPUTED: "#ef4444",
  ESCALATED: "#a855f7",
  CLOSED: "#6b7280",
};

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  OPEN: "#ef4444",
  UNDER_INVESTIGATION: "#f59e0b",
  AWAITING_RESPONSE: "#06b6d4",
  RESOLVED: "#22c55e",
  DISMISSED: "#6b7280",
  ESCALATED: "#a855f7",
};

const URGENCY_COLORS = ["#22c55e", "#f59e0b", "#f97316", "#ef4444"];

const getErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) {
    return data;
  }
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
};

// ==================== COMPONENT ====================

export const JobManagementTab: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    toast,
    isVisible,
    hideToast,
    showSuccess,
    showError,
    showWarning,
  } = useToast();

  // Sub-tab state
  const [subTab, setSubTab] = useState<SubTab>("stats");

  // Helper: whether a job can be deleted or banned (not COMPLETED, PAID, or CLOSED)
  const canModifyJob = (job: any) => {
    const terminalStatuses = ["COMPLETED", "PAID", "CLOSED"];
    return !terminalStatuses.includes(job.status);
  };

  // Approve tab state (short-term only)
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // All Jobs tab state
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allJobsPage, setAllJobsPage] = useState(0);
  const [allJobsTotalPages, setAllJobsTotalPages] = useState(0);
  const [allJobsTotal, setAllJobsTotal] = useState(0);
  const [allJobsLoading, setAllJobsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Disputes tab state
  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [disputesPage, setDisputesPage] = useState(0);
  const [disputesTotalPages, setDisputesTotalPages] = useState(0);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputeStatusFilter, setDisputeStatusFilter] = useState<string>("");

  // Stats tab state
  const [stats, setStats] = useState<AdminJobStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Shared modal state
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "ban" | "unban" | "delete"
  >("approve");
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Dispute resolve modal
  const [selectedDispute, setSelectedDispute] =
    useState<DisputeResponse | null>(null);
  const [disputeDetail, setDisputeDetail] = useState<Dispute | null>(null);
  const [disputeDetailLoading, setDisputeDetailLoading] = useState(false);
  const [disputeAuditLogs, setDisputeAuditLogs] = useState<JobStatusAuditLog[]>([]);
  const [disputeAuditLoading, setDisputeAuditLoading] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [resolveResolution, setResolveResolution] =
    useState<DisputeResolution | "">("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolvePartialPct, setResolvePartialPct] = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);

  // Scroll lock
  useEffect(() => {
    const locked =
      showDetailsModal || showActionModal || showDisputeModal;
    document.body.style.overflow = locked ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDetailsModal, showActionModal, showDisputeModal]);

  useEffect(() => {
    const requestedSubTab = searchParams.get("subTab");
    if (
      requestedSubTab === "stats" ||
      requestedSubTab === "all" ||
      requestedSubTab === "approve" ||
      requestedSubTab === "disputes"
    ) {
      setSubTab(requestedSubTab);
    }
  }, [searchParams]);

  // ==================== DATA LOADING ====================

  const loadPendingJobs = useCallback(async () => {
    setPendingLoading(true);
    try {
      // Fetch both full-time and short-term pending jobs in parallel
      const [fullTimeJobs, shortTermJobs] = await Promise.all([
        adminService.getPendingJobs(),
        adminService.getPendingShortTermJobs(),
      ]);
      // Combine both lists — full-time jobs have a 'isFullTime' flag for rendering distinction
      const allPending = [
        ...(fullTimeJobs || []).map((j: any) => ({ ...j, _isFullTime: true })),
        ...(shortTermJobs || []).map((j: any) => ({ ...j, _isFullTime: false })),
      ];
      setPendingJobs(allPending);
    } catch (error) {
      console.error("Error loading pending jobs:", error);
      showError("Lỗi", "Không thể tải danh sách việc làm chờ duyệt");
    } finally {
      setPendingLoading(false);
    }
  }, [showError]);

  const loadAllJobs = useCallback(
    async (page: number = 0, status?: string) => {
      setAllJobsLoading(true);
      try {
        const params: any = { page, size: 15 };
        if (status) params.status = status;
        const data = await adminService.getAllJobs(params);
        let jobs = data.content || [];
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          jobs = jobs.filter(
            (j: any) =>
              j.title?.toLowerCase().includes(q) ||
              j.id?.toString().includes(q)
          );
        }
        setAllJobs(jobs);
        setAllJobsPage(data.number || 0);
        setAllJobsTotalPages(data.totalPages || 0);
        setAllJobsTotal(data.totalElements || 0);
      } catch (error) {
        console.error("Error loading all jobs:", error);
        showError("Lỗi", "Không thể tải danh sách việc làm");
      } finally {
        setAllJobsLoading(false);
      }
    },
    [searchQuery, showError]
  );

  const loadDisputes = useCallback(
    async (page: number = 0, status?: string) => {
      setDisputesLoading(true);
      try {
        const params: any = { page, size: 15 };
        if (status) params.status = status;
        const data = await adminService.getDisputes(params);
        setDisputes(data.content || []);
        setDisputesPage(data.number || 0);
        setDisputesTotalPages(data.totalPages || 0);
      } catch (error) {
        console.error("Error loading disputes:", error);
        showError("Lỗi", "Không thể tải danh sách khiếu nại");
      } finally {
        setDisputesLoading(false);
      }
    },
    [showError]
  );

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await adminService.getJobStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
      showError("Lỗi", "Không thể tải thống kê");
    } finally {
      setStatsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (!user) return;
    if (subTab === "approve") loadPendingJobs();
    if (subTab === "all") loadAllJobs(0, statusFilter || undefined);
    if (subTab === "disputes")
      loadDisputes(0, disputeStatusFilter || undefined);
    if (subTab === "stats") loadStats();
  }, [user, subTab, statusFilter, disputeStatusFilter]);

  // ==================== ACTION HANDLERS ====================

  const handleAction = async () => {
    if (!selectedJob) return;
    if (
      (actionType === "reject" ||
        actionType === "ban" ||
        actionType === "delete") &&
      !actionReason.trim()
    ) {
      showWarning("Cảnh báo", "Vui lòng nhập lý do");
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === "approve") {
        if (selectedJob._isFullTime) {
          await adminService.approveJob(selectedJob.id);
          showSuccess("Thành công", "Đã duyệt tin tuyển dụng dài hạn");
        } else {
          await adminService.approveShortTermJob(selectedJob.id);
          showSuccess("Thành công", "Đã duyệt tin tuyển dụng ngắn hạn");
        }
      } else if (actionType === "reject") {
        if (selectedJob._isFullTime) {
          await adminService.rejectJob(selectedJob.id, actionReason);
        } else {
          await adminService.rejectShortTermJob(selectedJob.id, actionReason);
        }
        showSuccess("Thành công", "Đã từ chối tin tuyển dụng");
      } else if (actionType === "ban") {
        await adminService.banJob(selectedJob.id, actionReason);
        showSuccess("Thành công", "Đã khóa tin tuyển dụng");
      } else if (actionType === "unban") {
        await adminService.unbanJob(selectedJob.id);
        showSuccess("Thành công", "Đã mở khóa tin tuyển dụng");
      } else if (actionType === "delete") {
        await adminService.deleteJob(selectedJob.id, actionReason);
        showSuccess("Thành công", "Đã xóa tin tuyển dụng");
      }

      await loadAllJobs(0, statusFilter || undefined);
      await loadPendingJobs();
      await loadStats();
      setShowActionModal(false);
      setShowDetailsModal(false);
      setActionReason("");
    } catch (error) {
      console.error("Error processing action:", error);
      showError(
        "Lỗi",
        getErrorMessage(error, "Không thể xử lý yêu cầu"),
      );
      return;
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;
    if (!resolveResolution) {
      showWarning("Cảnh báo", "Vui lòng chọn hình thức giải quyết");
      return;
    }

    setResolveLoading(true);
    try {
      const request: ResolveDisputeRequest = {
        resolution: resolveResolution,
        resolutionNotes: resolveNotes || undefined,
      };
      if (
        resolveResolution === "WORKER_PARTIAL" &&
        resolvePartialPct
      ) {
        request.partialRefundPct = parseFloat(resolvePartialPct);
      }
      await adminService.resolveDispute(selectedDispute.id, request);
      showSuccess("Thành công", "Đã giải quyết khiếu nại");
      await loadDisputes(0, disputeStatusFilter || undefined);
      await loadStats();
      setShowDisputeModal(false);
      setResolveResolution("");
      setResolveNotes("");
      setResolvePartialPct("");
    } catch (error) {
      console.error("Error resolving dispute:", error);
      showError(
        "Lỗi",
        getErrorMessage(error, "Không thể giải quyết khiếu nại"),
      );
      return;
    } finally {
      setResolveLoading(false);
    }
  };

  const openActionModal = (
    job: any,
    type: "approve" | "reject" | "ban" | "unban" | "delete"
  ) => {
    setSelectedJob(job);
    setActionType(type);
    setActionReason("");
    setShowActionModal(true);
  };

  const handleRefresh = () => {
    if (subTab === "approve") loadPendingJobs();
    if (subTab === "all") loadAllJobs(0, statusFilter || undefined);
    if (subTab === "disputes")
      loadDisputes(0, disputeStatusFilter || undefined);
    if (subTab === "stats") loadStats();
  };

  // ==================== HELPERS ====================

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBudgetRange = (job: any) => {
    if (job.budget != null) return formatCurrency(job.budget);
    if (job.minBudget != null && job.maxBudget != null) {
      if (job.minBudget === 0 && job.maxBudget === 0) return "Thỏa thuận";
      return `${formatCurrency(job.minBudget)} - ${formatCurrency(job.maxBudget)}`;
    }
    return "N/A";
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusBadgeClass = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "jm-badge--draft",
      PENDING_APPROVAL: "jm-badge--pending",
      PUBLISHED: "jm-badge--published",
      APPLIED: "jm-badge--applied",
      IN_PROGRESS: "jm-badge--in-progress",
      SUBMITTED: "jm-badge--submitted",
      UNDER_REVIEW: "jm-badge--under-review",
      APPROVED: "jm-badge--approved",
      REJECTED: "jm-badge--rejected",
      COMPLETED: "jm-badge--completed",
      PAID: "jm-badge--paid",
      CANCELLED: "jm-badge--cancelled",
      DISPUTED: "jm-badge--disputed",
      ESCALATED: "jm-badge--escalated",
      CLOSED: "jm-badge--closed",
    };
    return map[status] || "jm-badge--normal";
  };

  const getStatusLabel = (status: string) => {
    const display =
      SHORT_TERM_JOB_STATUS_DISPLAY[status as ShortTermJobStatus];
    return display ? display.text : status;
  };

  const getDisputeStatusClass = (status: string) => {
    const map: Record<string, string> = {
      OPEN: "jm-badge--disputed",
      UNDER_INVESTIGATION: "jm-badge--pending",
      AWAITING_RESPONSE: "jm-badge--applied",
      RESOLVED: "jm-badge--completed",
      DISMISSED: "jm-badge--closed",
      ESCALATED: "jm-badge--submitted",
    };
    return map[status] || "jm-badge--normal";
  };

  const getDisputeStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      OPEN: "Mở",
      UNDER_INVESTIGATION: "Đang điều tra",
      AWAITING_RESPONSE: "Chờ phản hồi",
      RESOLVED: "Đã giải quyết",
      DISMISSED: "Bị bác",
      ESCALATED: "Leo thang",
    };
    return map[status] || status;
  };

  const getDisputeTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      NO_SUBMISSION: "Không nộp bài",
      POOR_QUALITY: "Chất lượng kém",
      MISSING_DELIVERABLE: "Thiếu bàn giao",
      DEADLINE_VIOLATION: "Vi phạm deadline",
      PAYMENT_ISSUE: "Vấn đề thanh toán",
      COMMUNICATION_FAILURE: "Lỗi giao tiếp",
      SCOPE_CHANGE: "Thay đổi phạm vi",
      SCAM_REPORT: "Báo lừa đảo",
      OTHER: "Khác",
    };
    map.WORKER_PROTECTION = "Bảo vệ ứng viên";
    map.RECRUITER_ABUSE = "Recruiter lạm dụng";
    map.CANCELLATION_REVIEW = "Xét duyệt yêu cầu hủy";
    return map[type] || type;
  };

  const getResolutionLabel = (r: DisputeResolution) => {
    const map: Partial<Record<DisputeResolution, string>> = {
      FULL_REFUND: "Hoàn tiền cho NTD",
      FULL_RELEASE: "Giải ngân cho ỨC",
      PARTIAL_REFUND: "Hoàn tiền 1 phần",
      PARTIAL_RELEASE: "Giải ngân 1 phần",
      RESUBMIT_REQUIRED: "Yêu cầu nộp lại",
      NO_ACTION: "Không xử lý",
      WORKER_WINS: "Ứng viên thắng — nhận 100%",
      WORKER_PARTIAL: "Ứng viên thắng 1 phần",
      RECRUITER_WINS: "Nhà tuyển dụng thắng",
    };
    map.CANCEL_JOB = "Hủy job";
    map.RECRUITER_WARNING = "Cảnh báo recruiter";
    return map[r] || r;
  };

  const getEvidenceTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      TEXT: <FileText size={13} />,
      FILE: <Paperclip size={13} />,
      LINK: <LinkIcon size={13} />,
      SCREENSHOT: <Image size={13} />,
      CHAT_LOG: <MessageSquare size={13} />,
      DELIVERABLE_SNAPSHOT: <FileText size={13} />,
    };
    return icons[type] || <FileText size={13} />;
  };

  const formatTime = (ts: string) =>
    ts ? new Date(ts).toLocaleString("vi-VN") : "";

  const getDisputeTypeMeta = (type: string) => {
    const map: Record<string, { color: string; bg: string }> = {
      WORKER_PROTECTION: { color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
      RECRUITER_ABUSE: { color: "#f87171", bg: "rgba(248,113,113,0.15)" },
      POOR_QUALITY: { color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
      SCOPE_CHANGE: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
      PAYMENT_ISSUE: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
      NO_SUBMISSION: { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
      DEADLINE_VIOLATION: { color: "#f87171", bg: "rgba(248,113,113,0.15)" },
      COMMUNICATION_FAILURE: { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
      SCAM_REPORT: { color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
      OTHER: { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
    };
    map.CANCELLATION_REVIEW = { color: "#fb7185", bg: "rgba(251,113,133,0.15)" };
    return map[type] || { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
  };

  const getUrgencyLabel = (urgency: string) => {
    const map: Record<string, string> = {
      NORMAL: "Bình thường",
      URGENT: "Gấp",
      VERY_URGENT: "Rất gấp",
      ASAP: "Ngay lập tức",
    };
    return map[urgency] || urgency;
  };

  const getResolutionOptions = (disputeType?: string) => {
    if (
      disputeType === "WORKER_PROTECTION" ||
      disputeType === "RECRUITER_ABUSE" ||
      disputeType === "CANCELLATION_REVIEW"
    ) {
      return [
        ...(disputeType === "CANCELLATION_REVIEW"
          ? [{
              value: "CANCEL_JOB" as DisputeResolution,
              label: "Hủy job",
              sub: "Chấp nhận yêu cầu hủy",
              color: "#f87171",
              icon: <XCircle size={14} />,
            }]
          : []),
        {
          value: "FULL_RELEASE" as DisputeResolution,
          label: "Release toàn bộ",
          sub: "Giải ngân toàn bộ cho ứng viên",
          color: "#4ade80",
          icon: <TrendingUp size={14} />,
        },
        {
          value: "RECRUITER_WARNING" as DisputeResolution,
          label: "Cảnh báo recruiter",
          sub: "Giữ job tiếp tục và cảnh báo recruiter",
          color: "#f59e0b",
          icon: <AlertTriangle size={14} />,
        },
        {
          value: "RESUBMIT_REQUIRED" as DisputeResolution,
          label: "Tiếp tục công việc",
          sub: "Bác dispute và yêu cầu user làm tiếp",
          color: "#94a3b8",
          icon: <RefreshCw size={14} />,
        },
      ] as { value: DisputeResolution; label: string; sub: string; color: string; icon: React.ReactNode }[];
    }

    return [
      { value: "WORKER_WINS" as DisputeResolution, label: "ỨC thắng", sub: "Nhận 100% tiền", color: "#a855f7", icon: <TrendingUp size={14} /> },
      { value: "RECRUITER_WINS" as DisputeResolution, label: "NTD thắng", sub: "Nhận 100% tiền", color: "#06b6d4", icon: <TrendingDown size={14} /> },
      { value: "WORKER_PARTIAL" as DisputeResolution, label: "ỨC thắng 1 phần", sub: "Chia % theo quyết định", color: "#fbbf24", icon: <ArrowUpDown size={14} /> },
      { value: "FULL_REFUND" as DisputeResolution, label: "Hoàn toàn cho NTD", sub: "Refund 100%", color: "#f87171", icon: <TrendingDown size={14} /> },
      { value: "FULL_RELEASE" as DisputeResolution, label: "Giải ngân cho ỨC", sub: "Release 100%", color: "#4ade80", icon: <TrendingUp size={14} /> },
      { value: "RESUBMIT_REQUIRED" as DisputeResolution, label: "Yêu cầu nộp lại", sub: "Không xử lý tài chính", color: "#94a3b8", icon: <RefreshCw size={14} /> },
    ] as { value: DisputeResolution; label: string; sub: string; color: string; icon: React.ReactNode }[];
  };

  const getAuditActorLabel = (log: JobStatusAuditLog) => {
    const changedBy =
      typeof log.changedBy === "object" && log.changedBy !== null
        ? log.changedBy
        : null;
    return (
      changedBy?.fullName ||
      changedBy?.email ||
      (typeof log.changedBy === "number" ? `User #${log.changedBy}` : null) ||
      log.changedByRole
    );
  };

  // ==================== CHART DATA ====================

  const getPieChartData = () => {
    if (!stats) return [];
    return Object.entries(stats.byStatus || {})
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: getStatusLabel(status),
        value: count as number,
        status,
        color: STATUS_COLORS[status] || "#64748b",
      }));
  };

  const getBarChartData = () => {
    if (!stats) return [];
    return Object.entries(stats.byUrgency || {}).map(([urgency, count]) => ({
      name: getUrgencyLabel(urgency),
      value: count as number,
      fill:
        urgency === "ASAP"
          ? URGENCY_COLORS[3]
          : urgency === "VERY_URGENT"
            ? URGENCY_COLORS[2]
            : urgency === "URGENT"
              ? URGENCY_COLORS[1]
              : URGENCY_COLORS[0],
    }));
  };

  // ==================== RENDER ====================

  return (
    <div className="jm-container">
      {/* Header */}
      <div className="jm-header">
        <div className="jm-header__info">
          <h2 className="jm-header__title">Quản lý việc làm</h2>
          <div className="jm-header__badges">
            {stats && (
              <span className="jm-stat-badge jm-stat-badge--purple">
                <Briefcase size={13} /> Tổng: {stats.totalJobs}
              </span>
            )}
            {pendingJobs.length > 0 && (
              <span className="jm-stat-badge jm-stat-badge--amber">
                <AlertCircle size={13} /> Chờ duyệt: {pendingJobs.length}
              </span>
            )}
          </div>
        </div>
        <button className="jm-btn jm-btn--refresh" onClick={handleRefresh}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Sub-tabs - Stats FIRST */}
      <div className="jm-tabs jm-tabs--main">
        <button
          className={`jm-tab ${subTab === "stats" ? "jm-tab--active jm-tab--purple" : ""}`}
          onClick={() => setSubTab("stats")}
        >
          <BarChart3 size={15} /> Thống kê
          {stats && stats.disputedCount > 0 && (
            <span className="jm-tab__count jm-tab__count--red">
              {stats.disputedCount}
            </span>
          )}
        </button>
        <button
          className={`jm-tab ${subTab === "all" ? "jm-tab--active jm-tab--blue" : ""}`}
          onClick={() => setSubTab("all")}
        >
          <List size={15} /> Tất cả việc làm
        </button>
        <button
          className={`jm-tab ${subTab === "approve" ? "jm-tab--active jm-tab--amber" : ""}`}
          onClick={() => setSubTab("approve")}
        >
          <CheckCircle size={15} /> Duyệt tin
          {pendingJobs.length > 0 && (
            <span className="jm-tab__count jm-tab__count--amber">
              {pendingJobs.length}
            </span>
          )}
        </button>
        <button
          className={`jm-tab ${subTab === "disputes" ? "jm-tab--active jm-tab--red" : ""}`}
          onClick={() => setSubTab("disputes")}
        >
          <ShieldAlert size={15} /> Khiếu nại
        </button>
      </div>

      {/* ========== SUB-TAB: STATS (FIRST) ========== */}
      {subTab === "stats" && (
        <>
          {statsLoading ? (
            <div className="jm-state-center">
              <Loader2
                size={48}
                className="jm-spin jm-state__icon--loading"
              />
              <p>Đang tải thống kê...</p>
            </div>
          ) : stats ? (
            <div className="jm-stats-tab">
              {/* KPI Summary Row */}
              <div className="jm-kpi-row">
                <div className="jm-kpi-card jm-kpi-card--gradient-purple">
                  <div className="jm-kpi-card__glow" />
                  <div className="jm-kpi-card__icon">
                    <Briefcase size={22} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">{stats.totalJobs}</div>
                    <div className="jm-kpi-card__label">Tổng việc làm</div>
                  </div>
                  <div className="jm-kpi-card__trend jm-kpi-card__trend--up">
                    <TrendingUp size={12} />
                  </div>
                </div>

                <div className="jm-kpi-card jm-kpi-card--gradient-amber">
                  <div className="jm-kpi-card__glow" />
                  <div className="jm-kpi-card__icon">
                    <AlertCircle size={22} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">
                      {stats.pendingApprovalCount}
                    </div>
                    <div className="jm-kpi-card__label">Chờ duyệt</div>
                  </div>
                  <div className="jm-kpi-card__trend jm-kpi-card__trend--neutral">
                    <Clock size={12} />
                  </div>
                </div>

                <div className="jm-kpi-card jm-kpi-card--gradient-blue">
                  <div className="jm-kpi-card__glow" />
                  <div className="jm-kpi-card__icon">
                    <CheckCircle size={22} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">
                      {stats.publishedCount}
                    </div>
                    <div className="jm-kpi-card__label">Đã đăng</div>
                  </div>
                  <div className="jm-kpi-card__trend jm-kpi-card__trend--up">
                    <Activity size={12} />
                  </div>
                </div>

                <div className="jm-kpi-card jm-kpi-card--gradient-orange">
                  <div className="jm-kpi-card__glow" />
                  <div className="jm-kpi-card__icon">
                    <Clock size={22} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">
                      {stats.inProgressCount}
                    </div>
                    <div className="jm-kpi-card__label">Đang thực hiện</div>
                  </div>
                  <div className="jm-kpi-card__trend jm-kpi-card__trend--neutral">
                    <Activity size={12} />
                  </div>
                </div>

                <div className="jm-kpi-card jm-kpi-card--gradient-teal">
                  <div className="jm-kpi-card__glow" />
                  <div className="jm-kpi-card__icon">
                    <Star size={22} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">
                      {stats.completedCount}
                    </div>
                    <div className="jm-kpi-card__label">Hoàn thành</div>
                  </div>
                  <div className="jm-kpi-card__trend jm-kpi-card__trend--up">
                    <Award size={12} />
                  </div>
                </div>

                <div className="jm-kpi-card jm-kpi-card--gradient-red">
                  <div className="jm-kpi-card__glow" />
                  <div className="jm-kpi-card__icon">
                    <AlertTriangle size={22} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">
                      {stats.disputedCount}
                    </div>
                    <div className="jm-kpi-card__label">Tranh chấp</div>
                  </div>
                  <div className="jm-kpi-card__trend jm-kpi-card__trend--down">
                    <TrendingDown size={12} />
                  </div>
                </div>
              </div>

              {/* Earnings KPI Row */}
              <div className="jm-kpi-row jm-kpi-row--earnings">
                <div className="jm-kpi-card jm-kpi-card--gradient-emerald">
                  <div className="jm-kpi-card__glow" />
                  <div className="jm-kpi-card__icon jm-kpi-card__icon--white">
                    <TrendingUp size={26} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value jm-kpi-card__value--money">
                      {formatCurrency(stats.totalPlatformEarnings || 0)}
                    </div>
                    <div className="jm-kpi-card__label">Thu nhập nền tảng</div>
                  </div>
                  <div className="jm-kpi-card__sub">
                    <span className="jm-kpi-card__sub-label">Phí 10% từ ký quỹ</span>
                  </div>
                </div>

                <div className="jm-kpi-card jm-kpi-card--gradient-indigo">
                  <div className="jm-kpi-card__glow" />
                  <div className="jm-kpi-card__icon jm-kpi-card__icon--white">
                    <Building2 size={26} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value jm-kpi-card__value--money">
                      {formatCurrency(stats.totalRecruiterEarnings || 0)}
                    </div>
                    <div className="jm-kpi-card__label">Thu nhập nhà tuyển dụng</div>
                  </div>
                  <div className="jm-kpi-card__sub">
                    <span className="jm-kpi-card__sub-label">90% từ ký quỹ</span>
                  </div>
                </div>

                <div className="jm-kpi-card jm-kpi-card--gradient-gold">
                  <div className="jm-kpi-card__glow" />
                  <div className="jm-kpi-card__icon jm-kpi-card__icon--white">
                    <CreditCard size={26} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value jm-kpi-card__value--money">
                      {formatCurrency(stats.totalEscrowVolume || 0)}
                    </div>
                    <div className="jm-kpi-card__label">Tổng giá trị ký quỹ</div>
                  </div>
                  <div className="jm-kpi-card__sub">
                    <span className="jm-kpi-card__sub-label">{stats.activeEscrows || 0} ký quỹ đang hoạt động</span>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="jm-charts-row">
                {/* PieChart: Status Distribution */}
                <div className="jm-chart-card">
                  <div className="jm-chart-card__header">
                    <div className="jm-chart-card__title-group">
                      <PieChartIcon size={18} className="jm-chart-card__icon jm-chart-card__icon--purple" />
                      <h3 className="jm-chart-card__title">
                        Phân bổ theo trạng thái
                      </h3>
                    </div>
                  </div>
                  <div className="jm-chart-card__body jm-chart-card__body--pie">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="transparent"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid rgba(139,92,246,0.25)",
                            borderRadius: "10px",
                            color: "#e2e8f0",
                            fontSize: "0.82rem",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                          }}
                          itemStyle={{ color: "#94a3b8" }}
                          formatter={(value: number, name: string) => [
                            `${value} việc`,
                            name,
                          ]}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                            paddingTop: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* BarChart: Urgency Breakdown */}
                <div className="jm-chart-card">
                  <div className="jm-chart-card__header">
                    <div className="jm-chart-card__title-group">
                      <BarChart3
                        size={18}
                        className="jm-chart-card__icon jm-chart-card__icon--cyan"
                      />
                      <h3 className="jm-chart-card__title">
                        Phân bổ theo mức độ gấp
                      </h3>
                    </div>
                  </div>
                  <div className="jm-chart-card__body">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={getBarChartData()}
                        margin={{
                          top: 10,
                          right: 10,
                          left: -15,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid rgba(139,92,246,0.25)",
                            borderRadius: "10px",
                            color: "#e2e8f0",
                            fontSize: "0.82rem",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                          }}
                          cursor={{
                            fill: "rgba(139,92,246,0.08)",
                            radius: 6,
                          }}
                          formatter={(value: number, name: string) => [
                            `${value} việc`,
                            "Số lượng",
                          ]}
                        />
                        <Bar
                          dataKey="value"
                          name="Số lượng"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={50}
                        >
                          {getBarChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Extended KPI row */}
              <div className="jm-kpi-row jm-kpi-row--secondary">
                <div className="jm-kpi-card jm-kpi-card--small">
                  <div className="jm-kpi-card__icon jm-kpi-card__icon--green">
                    <DollarSign size={18} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">{stats.paidCount}</div>
                    <div className="jm-kpi-card__label">Đã thanh toán</div>
                  </div>
                </div>
                <div className="jm-kpi-card jm-kpi-card--small">
                  <div className="jm-kpi-card__icon jm-kpi-card__icon--purple">
                    <ShieldAlert size={18} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">
                      {stats.escalatedCount}
                    </div>
                    <div className="jm-kpi-card__label">Leo thang</div>
                  </div>
                </div>
                <div className="jm-kpi-card jm-kpi-card--small">
                  <div className="jm-kpi-card__icon jm-kpi-card__icon--gray">
                    <XCircle size={18} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">
                      {stats.cancelledCount}
                    </div>
                    <div className="jm-kpi-card__label">Đã hủy</div>
                  </div>
                </div>
                <div className="jm-kpi-card jm-kpi-card--small">
                  <div className="jm-kpi-card__icon jm-kpi-card__icon--blue">
                    <FileText size={18} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">{stats.draftCount}</div>
                    <div className="jm-kpi-card__label">Bản nháp</div>
                  </div>
                </div>
                <div className="jm-kpi-card jm-kpi-card--small">
                  <div className="jm-kpi-card__icon jm-kpi-card__icon--red">
                    <Ban size={18} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">
                      {stats.rejectedCount}
                    </div>
                    <div className="jm-kpi-card__label">Bị từ chối</div>
                  </div>
                </div>
                <div className="jm-kpi-card jm-kpi-card--small">
                  <div className="jm-kpi-card__icon jm-kpi-card__icon--gray">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="jm-kpi-card__content">
                    <div className="jm-kpi-card__value">{stats.closedCount}</div>
                    <div className="jm-kpi-card__label">Đã đóng</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="jm-state-center">
              <Inbox size={48} className="jm-state__icon--empty" />
              <p>Không có dữ liệu thống kê</p>
            </div>
          )}
        </>
      )}

      {/* ========== SUB-TAB: ALL JOBS ========== */}
      {subTab === "all" && (
        <>
          {/* Filter bar */}
          <div className="jm-filter-bar">
            <div className="jm-search-box">
              <Search size={15} className="jm-search-icon" />
              <input
                type="text"
                className="jm-search-input"
                placeholder="Tìm kiếm theo tiêu đề hoặc ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    loadAllJobs(0, statusFilter || undefined);
                }}
              />
            </div>
            <div className="jm-filter-group">
              <Filter size={15} />
              <select
                className="jm-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setAllJobsPage(0);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.keys(ShortTermJobStatus).map((s) => (
                  <option key={s} value={s}>
                    {getStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <span className="jm-result-count">
              {allJobsTotal} việc làm
            </span>
          </div>

          {/* Jobs table */}
          {allJobsLoading ? (
            <div className="jm-state-center">
              <Loader2
                size={48}
                className="jm-spin jm-state__icon--loading"
              />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : allJobs.length === 0 ? (
            <div className="jm-state-center">
              <Inbox size={48} className="jm-state__icon--empty" />
              <p>Không tìm thấy việc làm nào</p>
            </div>
          ) : (
            <>
              <div className="jm-table-container">
                <table className="jm-table">
                  <thead>
                    <tr>
                      <th>
                        <ArrowUpDown size={13} /> ID
                      </th>
                      <th>Tiêu đề</th>
                      <th>Nhà tuyển dụng</th>
                      <th>Trạng thái</th>
                      <th>Ngân sách</th>
                      <th>Deadline</th>
                      <th>Ứng viên</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allJobs.map((job) => (
                      <tr
                        key={job.id}
                        className={
                          job.isBanned ? "jm-row--banned" : ""
                        }
                      >
                        <td className="jm-td--id">#{job.id}</td>
                        <td className="jm-td--title">
                          <span className="jm-title-text">{job.title}</span>
                          {job.isBanned && (
                            <span className="jm-badge jm-badge--disputed">
                              <Ban size={10} />
                              Đã khóa
                            </span>
                          )}
                          {job.urgency && job.urgency !== "NORMAL" && (
                            <span
                              className={`jm-badge jm-badge--${job.urgency === "ASAP" || job.urgency === "VERY_URGENT" ? "disputed" : "high"}`}
                            >
                              <Flame size={10} />
                              {getUrgencyLabel(job.urgency)}
                            </span>
                          )}
                        </td>
                        <td className="jm-td--company">
                          <Building2 size={13} />
                          {job.recruiterInfo?.companyName || "N/A"}
                        </td>
                        <td>
                          <span
                            className={`jm-badge ${getStatusBadgeClass(job.status)}`}
                          >
                            {getStatusLabel(job.status)}
                          </span>
                        </td>
                        <td className="jm-td--money">
                          {formatCurrency(job.budget)}
                        </td>
                        <td className="jm-td--date">
                          <Calendar size={12} />
                          {formatDate(job.deadline)}
                        </td>
                        <td className="jm-td--center">
                          <span className="jm-applicant-count">
                            <Users size={12} />
                            {job.applicantCount || 0}
                          </span>
                        </td>
                        <td className="jm-td--actions">
                          <button
                            className="jm-icon-btn jm-icon-btn--view"
                            onClick={() => {
                              setSelectedJob(job);
                              setShowDetailsModal(true);
                            }}
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                          {job.isBanned ? (
                            <button
                              className="jm-icon-btn jm-icon-btn--unban"
                              onClick={() => openActionModal(job, "unban")}
                              title="Mở khóa"
                            >
                              <Unlock size={14} />
                            </button>
                          ) : canModifyJob(job) && (
                            <button
                              className="jm-icon-btn jm-icon-btn--ban"
                              onClick={() => openActionModal(job, "ban")}
                              title="Khóa"
                            >
                              <Ban size={14} />
                            </button>
                          )}
                          {canModifyJob(job) && (
                            <button
                              className="jm-icon-btn jm-icon-btn--delete"
                              onClick={() => openActionModal(job, "delete")}
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {allJobsTotalPages > 1 && (
                <div className="jm-pagination">
                  <button
                    className="jm-page-btn"
                    disabled={allJobsPage === 0}
                    onClick={() =>
                      loadAllJobs(
                        allJobsPage - 1,
                        statusFilter || undefined
                      )
                    }
                  >
                    <ChevronDown
                      size={14}
                      style={{ transform: "rotate(90deg)" }}
                    />
                  </button>
                  <span className="jm-page-info">
                    Trang {allJobsPage + 1} / {allJobsTotalPages} (
                    {allJobsTotal} kết quả)
                  </span>
                  <button
                    className="jm-page-btn"
                    disabled={allJobsPage >= allJobsTotalPages - 1}
                    onClick={() =>
                      loadAllJobs(
                        allJobsPage + 1,
                        statusFilter || undefined
                      )
                    }
                  >
                    <ChevronDown
                      size={14}
                      style={{ transform: "rotate(-90deg)" }}
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ========== SUB-TAB: APPROVE ========== */}
      {subTab === "approve" && (
        <>
          {pendingLoading ? (
            <div className="jm-state-center">
              <Loader2
                size={48}
                className="jm-spin jm-state__icon--loading"
              />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : pendingJobs.length === 0 ? (
            <div className="jm-state-center">
              <CheckCircle
                size={48}
                className="jm-state__icon--empty"
                style={{ color: "#22c55e" }}
              />
              <p style={{ color: "#64748b" }}>
                Không có tin tuyển dụng nào chờ duyệt
              </p>
              <span className="jm-state-sub">Tất cả tin đã được xử lý</span>
            </div>
          ) : (
            <div className="jm-approve-grid">
              {pendingJobs.map((job) => (
                <div key={job.id} className="jm-approve-card">
                  <div className="jm-approve-card__glow" />
                  <div className="jm-approve-card__header">
                    <div className="jm-approve-card__company">
                      <div className="jm-approve-card__company-icon">
                        <Building2 size={14} />
                      </div>
                      <span>
                        {job.recruiterCompanyName || job.recruiterInfo?.companyName || "N/A"}
                      </span>
                    </div>
                    <div className="jm-approve-card__badges">
                      <span className={`jm-badge ${job._isFullTime ? "jm-badge--info" : "jm-badge--pending"}`}>
                        <Briefcase size={10} />
                        {job._isFullTime ? "Dài hạn" : "Ngắn hạn"}
                      </span>
                      {job.urgency && job.urgency !== "NORMAL" && (
                        <span
                          className={`jm-badge ${job.urgency === "ASAP" ? "jm-badge--disputed" : "jm-badge--high"}`}
                        >
                          <Flame size={10} />
                          {getUrgencyLabel(job.urgency)}
                        </span>
                      )}
                      <span className="jm-badge jm-badge--pending">
                        <AlertCircle size={10} />
                        Chờ duyệt
                      </span>
                    </div>
                  </div>
                  {job._isFullTime && (job.recruiterEmail || job.createdAt) && (
                    <div className="jm-approve-card__creator">
                      {job.recruiterEmail && (
                        <span className="jm-approve-card__creator-item">
                          <Mail size={11} />
                          {job.recruiterEmail}
                        </span>
                      )}
                      {job.createdAt && (
                        <span className="jm-approve-card__creator-item">
                          <Clock size={11} />
                          Gửi: {formatDateTime(job.createdAt)}
                        </span>
                      )}
                    </div>
                  )}
                  <h3 className="jm-approve-card__title">{job.title}</h3>
                  <div className="jm-approve-card__meta">
                    <div className="jm-approve-card__meta-item jm-approve-card__meta-item--money">
                      <DollarSign size={14} />
                      <span>{formatBudgetRange(job)}</span>
                    </div>
                    <div className="jm-approve-card__meta-item">
                      <Calendar size={14} />
                      <span>{formatDate(job.deadline)}</span>
                    </div>
                    {job._isFullTime && job.experienceLevel && (
                      <div className="jm-approve-card__meta-item">
                        <Zap size={14} />
                        <span>{job.experienceLevel}</span>
                      </div>
                    )}
                    <div className="jm-approve-card__meta-item">
                      <Users size={14} />
                      <span>{job.applicantCount || 0} ứng viên</span>
                    </div>
                  </div>
                  {job.requiredSkills?.length > 0 && (
                    <div className="jm-approve-card__skills">
                      {job.requiredSkills.slice(0, 5).map((skill: string, i: number) => (
                        <span key={i} className="jm-skill-chip">
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills.length > 5 && (
                        <span className="jm-skill-chip jm-skill-chip--more">
                          +{job.requiredSkills.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="jm-approve-card__actions">
                    <button
                      className="jm-approve-btn jm-approve-btn--view"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye size={15} />
                      <span>Chi tiết</span>
                      <ChevronRight size={13} />
                    </button>
                    <button
                      className="jm-approve-btn jm-approve-btn--approve"
                      onClick={() => openActionModal(job, "approve")}
                    >
                      <CheckCircle size={15} />
                      <span>Duyệt</span>
                    </button>
                    <button
                      className="jm-approve-btn jm-approve-btn--reject"
                      onClick={() => openActionModal(job, "reject")}
                    >
                      <XCircle size={15} />
                      <span>Từ chối</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========== SUB-TAB: DISPUTES ========== */}
      {subTab === "disputes" && (
        <>
          <div className="jm-filter-bar">
            <div className="jm-filter-group">
              <Filter size={15} />
              <select
                className="jm-select"
                value={disputeStatusFilter}
                onChange={(e) => {
                  setDisputeStatusFilter(e.target.value);
                  setDisputesPage(0);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="OPEN">Mở</option>
                <option value="UNDER_INVESTIGATION">Đang điều tra</option>
                <option value="AWAITING_RESPONSE">Chờ phản hồi</option>
                <option value="RESOLVED">Đã giải quyết</option>
                <option value="DISMISSED">Bị bác</option>
                <option value="ESCALATED">Leo thang</option>
              </select>
            </div>
          </div>

          {disputesLoading ? (
            <div className="jm-state-center">
              <Loader2
                size={48}
                className="jm-spin jm-state__icon--loading"
              />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : disputes.length === 0 ? (
            <div className="jm-state-center">
              <Scale
                size={48}
                style={{ color: "#22c55e" }}
                className="jm-state__icon--empty"
              />
              <p>Không có khiếu nại nào</p>
              <span className="jm-state-sub">
                Hệ thống đang hoạt động tốt
              </span>
            </div>
          ) : (
            <>
              <div className="jm-disputes-grid">
                {disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    className={`jm-dispute-card jm-dispute-card--${dispute.status.toLowerCase().replace("_", "-")}`}
                  >
                    <div className="jm-dispute-card__header">
                      <div className="jm-dispute-card__id">
                        <Gavel size={14} />
                        <span>#{dispute.id}</span>
                      </div>
                      <div className="jm-dispute-card__badges">
                        <span
                          className={`jm-badge ${getDisputeStatusClass(dispute.status)}`}
                        >
                          {getDisputeStatusLabel(dispute.status)}
                        </span>
                        <span className="jm-badge jm-badge--normal">
                          {getDisputeTypeLabel(dispute.disputeType)}
                        </span>
                      </div>
                    </div>

                    <div className="jm-dispute-card__reason">
                      <MessageSquare size={13} />
                      <span>"{dispute.reason}"</span>
                    </div>

                    <div className="jm-dispute-card__parties">
                      <div className="jm-dispute-party jm-dispute-party--initiator">
                        <div className="jm-dispute-party__avatar">
                          <TrendingUp size={14} />
                        </div>
                        <div className="jm-dispute-party__info">
                          <div className="jm-dispute-party__label">
                            Người khiếu nại
                          </div>
                          <div className="jm-dispute-party__name">
                            {dispute.initiatorName ||
                              `User #${dispute.initiatorId}`}
                          </div>
                        </div>
                      </div>
                      <div className="jm-dispute-party__vs">VS</div>
                      <div className="jm-dispute-party jm-dispute-party--respondent">
                        <div className="jm-dispute-party__avatar jm-dispute-party__avatar--respondent">
                          <Users size={14} />
                        </div>
                        <div className="jm-dispute-party__info">
                          <div className="jm-dispute-party__label">
                            Bị khiếu nại
                          </div>
                          <div className="jm-dispute-party__name">
                            {dispute.respondentName ||
                              `User #${dispute.respondentId}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="jm-dispute-card__footer">
                      <div className="jm-dispute-card__job-info">
                        <Briefcase size={12} />
                        <span>Job #{dispute.jobId}</span>
                      </div>
                      <div className="jm-dispute-card__date">
                        <Clock size={12} />
                        <span>{formatDate(dispute.createdAt)}</span>
                      </div>
                    </div>

                    {dispute.resolution && (
                      <div className="jm-dispute-card__resolution">
                        <ShieldCheck size={12} />
                        <span>
                          {getResolutionLabel(dispute.resolution)}
                          {dispute.partialRefundPct &&
                            ` (${dispute.partialRefundPct}%)`}
                        </span>
                      </div>
                    )}

                    <div className="jm-dispute-card__actions">
                      <button
                        className="jm-dispute-btn jm-dispute-btn--view"
                        onClick={async () => {
                          setSelectedDispute(dispute);
                          setShowDisputeModal(true);
                          setDisputeDetail(null);
                          setDisputeAuditLogs([]);
                          setResolveResolution("");
                          setResolveNotes("");
                          setResolvePartialPct("");
                          setDisputeDetailLoading(true);
                          setDisputeAuditLoading(true);
                          try {
                            const [detail, auditLogs] = await Promise.all([
                              adminService.getDisputeDetail(dispute.id),
                              adminService.getDisputeAuditLogs(dispute.id),
                            ]);
                            setDisputeDetail(detail);
                            setDisputeAuditLogs(auditLogs);
                          } catch {
                            // Fallback: use list item data
                          } finally {
                            setDisputeDetailLoading(false);
                            setDisputeAuditLoading(false);
                          }
                        }}
                      >
                        <Gavel size={14} />
                        <span>Xem & giải quyết</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {disputesTotalPages > 1 && (
                <div className="jm-pagination">
                  <button
                    className="jm-page-btn"
                    disabled={disputesPage === 0}
                    onClick={() =>
                      loadDisputes(
                        disputesPage - 1,
                        disputeStatusFilter || undefined
                      )
                    }
                  >
                    <ChevronDown
                      size={14}
                      style={{ transform: "rotate(90deg)" }}
                    />
                  </button>
                  <span className="jm-page-info">
                    Trang {disputesPage + 1} / {disputesTotalPages}
                  </span>
                  <button
                    className="jm-page-btn"
                    disabled={disputesPage >= disputesTotalPages - 1}
                    onClick={() =>
                      loadDisputes(
                        disputesPage + 1,
                        disputeStatusFilter || undefined
                      )
                    }
                  >
                    <ChevronDown
                      size={14}
                      style={{ transform: "rotate(-90deg)" }}
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ========== DETAILS MODAL ========== */}
      {showDetailsModal &&
        selectedJob &&
        ReactDOM.createPortal(
          <div className="jm-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="jm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="jm-modal__header">
                <div className="jm-modal__header-left">
                  <div className="jm-modal__type-icon jm-modal__type-icon--amber">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h2 className="jm-modal__title">Chi tiết việc làm</h2>
                    <p className="jm-modal__subtitle">
                      #{selectedJob.id} — {getStatusLabel(selectedJob.status)}
                    </p>
                  </div>
                </div>
                <button
                  className="jm-modal__close"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="jm-modal__body">
                <div className="jm-detail__hero">
                  <div className="jm-detail__hero-top">
                    <h3 className="jm-detail__job-title">{selectedJob.title}</h3>
                    <div className="jm-detail__hero-badges">
                      <span
                        className={`jm-badge ${getStatusBadgeClass(selectedJob.status)}`}
                      >
                        {getStatusLabel(selectedJob.status)}
                      </span>
                      {selectedJob.isBanned && (
                        <span className="jm-badge jm-badge--disputed">
                          <Ban size={11} /> Đã khóa
                        </span>
                      )}
                      {selectedJob.urgency &&
                        selectedJob.urgency !== "NORMAL" && (
                          <span
                            className={`jm-badge ${selectedJob.urgency === "ASAP" || selectedJob.urgency === "VERY_URGENT" ? "jm-badge--disputed" : "jm-badge--high"}`}
                          >
                            <Flame size={11} />
                            {getUrgencyLabel(selectedJob.urgency)}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="jm-detail__hero-meta">
                    <span className="jm-detail__meta-pill">
                      <Building2 size={13} />
                      {selectedJob.recruiterInfo?.companyName || "N/A"}
                    </span>
                    <span className="jm-detail__meta-pill">
                      <MapPin size={13} />
                      {selectedJob.isRemote
                        ? "Remote"
                        : selectedJob.location || "N/A"}
                    </span>
                    {selectedJob.paymentMethod && (
                      <span className="jm-detail__meta-pill">
                        <CreditCard size={13} />
                        {selectedJob.paymentMethod}
                      </span>
                    )}
                  </div>
                  {selectedJob.isBanned && selectedJob.banReason && (
                    <div className="jm-ban-reason">
                      <Ban size={14} /> Lý do khóa: {selectedJob.banReason}
                    </div>
                  )}
                </div>

                <div className="jm-detail__stats">
                  <div className="jm-detail__stat">
                    <div className="jm-detail__stat-icon jm-detail__stat-icon--green">
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <div className="jm-detail__stat-value">
                        {formatCurrency(selectedJob.budget)}
                      </div>
                      <div className="jm-detail__stat-label">Ngân sách</div>
                    </div>
                  </div>
                  <div className="jm-detail__stat">
                    <div className="jm-detail__stat-icon jm-detail__stat-icon--blue">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="jm-detail__stat-value">
                        {formatDate(selectedJob.deadline)}
                      </div>
                      <div className="jm-detail__stat-label">Deadline</div>
                    </div>
                  </div>
                  <div className="jm-detail__stat">
                    <div className="jm-detail__stat-icon jm-detail__stat-icon--purple">
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="jm-detail__stat-value">
                        {selectedJob.estimatedDuration || "N/A"}
                      </div>
                      <div className="jm-detail__stat-label">
                        Thời gian ước tính
                      </div>
                    </div>
                  </div>
                  <div className="jm-detail__stat">
                    <div className="jm-detail__stat-icon jm-detail__stat-icon--amber">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="jm-detail__stat-value">
                        {selectedJob.applicantCount || 0}
                      </div>
                      <div className="jm-detail__stat-label">Ứng viên</div>
                    </div>
                  </div>
                </div>

                {/* Description with Full Markdown Rendering */}
                <div className="jm-detail__section">
                  <h4 className="jm-detail__section-title">
                    <FileText size={15} /> Mô tả công việc
                  </h4>
                  <div className="jm-markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedJob.description || "Không có mô tả"}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="jm-detail__section">
                  <h4 className="jm-detail__section-title">
                    <Star size={15} /> Kỹ năng yêu cầu
                  </h4>
                  <div className="jm-detail__skills">
                    {selectedJob.requiredSkills?.length > 0 ? (
                      selectedJob.requiredSkills.map((s: string, i: number) => (
                        <span key={i} className="jm-skill-chip">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="jm-empty-text">Không có</span>
                    )}
                  </div>
                </div>

                {selectedJob.minRating && (
                  <div className="jm-detail__section">
                    <h4 className="jm-detail__section-title">
                      <Target size={15} /> Yêu cầu tối thiểu
                    </h4>
                    <div className="jm-detail__requirements">
                      <div className="jm-requirement-item">
                        <Star size={14} />
                        <span>
                          Rating tối thiểu:{" "}
                          <strong>{selectedJob.minRating} sao</strong>
                        </span>
                      </div>
                      {selectedJob.maxApplicants && (
                        <div className="jm-requirement-item">
                          <Users size={14} />
                          <span>
                            Tối đa:{" "}
                            <strong>
                              {selectedJob.maxApplicants} ứng viên
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="jm-modal__footer">
                {selectedJob.status === "PENDING_APPROVAL" && (
                  <>
                    <button
                      className="jm-modal-btn jm-modal-btn--approve"
                      onClick={() => {
                        setShowDetailsModal(false);
                        openActionModal(selectedJob, "approve");
                      }}
                    >
                      <ShieldCheck size={16} /> Phê duyệt
                    </button>
                    <button
                      className="jm-modal-btn jm-modal-btn--reject"
                      onClick={() => {
                        setShowDetailsModal(false);
                        openActionModal(selectedJob, "reject");
                      }}
                    >
                      <XCircle size={16} /> Từ chối
                    </button>
                  </>
                )}
                {!selectedJob.isBanned && canModifyJob(selectedJob) && (
                  <button
                    className="jm-modal-btn jm-modal-btn--ban"
                    onClick={() => {
                      setShowDetailsModal(false);
                      openActionModal(selectedJob, "ban");
                    }}
                  >
                    <Ban size={16} /> Khóa
                  </button>
                )}
                {selectedJob.isBanned && (
                  <button
                    className="jm-modal-btn jm-modal-btn--unban"
                    onClick={() => {
                      setShowDetailsModal(false);
                      openActionModal(selectedJob, "unban");
                    }}
                  >
                    <Unlock size={16} /> Mở khóa
                  </button>
                )}
                {canModifyJob(selectedJob) && (
                  <button
                    className="jm-modal-btn jm-modal-btn--delete"
                    onClick={() => {
                      setShowDetailsModal(false);
                      openActionModal(selectedJob, "delete");
                    }}
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                )}
                <button
                  className="jm-modal-btn jm-modal-btn--secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========== ACTION MODAL ========== */}
      {showActionModal &&
        selectedJob &&
        ReactDOM.createPortal(
          <div className="jm-overlay" onClick={() => setShowActionModal(false)}>
            <div
              className="jm-modal jm-modal--sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="jm-modal__header">
                <div className="jm-modal__header-left">
                  <div
                    className={`jm-modal__type-icon ${actionType === "approve" || actionType === "unban" ? "jm-modal__type-icon--green" : "jm-modal__type-icon--red"}`}
                  >
                    {actionType === "approve" ? (
                      <CheckCircle size={18} />
                    ) : actionType === "unban" ? (
                      <Unlock size={18} />
                    ) : actionType === "ban" ? (
                      <Ban size={18} />
                    ) : actionType === "delete" ? (
                      <Trash2 size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </div>
                  <div>
                    <h2 className="jm-modal__title">
                      {actionType === "approve"
                        ? "Phê duyệt"
                        : actionType === "reject"
                          ? "Từ chối"
                          : actionType === "ban"
                            ? "Khóa việc làm"
                            : actionType === "unban"
                              ? "Mở khóa việc làm"
                              : "Xóa việc làm"}
                    </h2>
                    <p className="jm-modal__subtitle">{selectedJob.title}</p>
                  </div>
                </div>
                <button
                  className="jm-modal__close"
                  onClick={() => setShowActionModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="jm-modal__body">
                <div className="jm-confirm__job-card">
                  <div className="jm-confirm__job-icon">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="jm-confirm__job-title">
                      {selectedJob.title}
                    </div>
                    <div className="jm-confirm__job-company">
                      {selectedJob.recruiterInfo?.companyName || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="jm-form-group">
                  <label className="jm-form-label">
                    <AlertCircle size={14} />
                    Lý do{" "}
                    {actionType === "reject"
                      ? "từ chối"
                      : actionType === "ban"
                        ? "khóa"
                        : "xóa"}{" "}
                    <span className="jm-required">*</span>
                  </label>
                  <textarea
                    className="jm-textarea"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={4}
                    placeholder={
                      actionType === "approve"
                        ? "Ghi chú (tùy chọn)..."
                        : actionType === "reject"
                          ? "Nhập lý do từ chối để gửi thông báo đến recruiter..."
                          : actionType === "ban"
                            ? "Nhập lý do khóa việc làm..."
                            : "Nhập lý do xóa việc làm..."
                    }
                  />
                </div>
              </div>
              <div className="jm-modal__footer">
                <button
                  className={`jm-modal-btn ${actionType === "approve" || actionType === "unban" ? "jm-modal-btn--approve" : actionType === "reject" || actionType === "ban" || actionType === "delete" ? "jm-modal-btn--reject" : "jm-modal-btn--secondary"}`}
                  onClick={handleAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={15} className="jm-spin" /> Đang xử
                      lý...
                    </>
                  ) : actionType === "approve" ? (
                    <>
                      <Check size={15} /> Xác nhận duyệt
                    </>
                  ) : actionType === "reject" ? (
                    <>
                      <X size={15} /> Xác nhận từ chối
                    </>
                  ) : actionType === "ban" ? (
                    <>
                      <Ban size={15} /> Xác nhận khóa
                    </>
                  ) : actionType === "unban" ? (
                    <>
                      <Unlock size={15} /> Xác nhận mở khóa
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} /> Xác nhận xóa
                    </>
                  )}
                </button>
                <button
                  className="jm-modal-btn jm-modal-btn--secondary"
                  onClick={() => setShowActionModal(false)}
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========== DISPUTE RESOLVE MODAL ========== */}
      {showDisputeModal &&
        selectedDispute &&
        ReactDOM.createPortal(
          <div className="adm-overlay" onClick={() => setShowDisputeModal(false)}>
            <div
              className="adm-modal adm-modal--xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="adm-modal__header">
                <div className="adm-modal__header-left">
                  <div className="adm-modal__type-icon adm-modal__type-icon--red">
                    <Gavel size={20} />
                  </div>
                  <div>
                    <h2 className="adm-modal__title">Chi tiết & Giải quyết Khiếu nại</h2>
                    <div className="adm-modal__meta-row">
                      <span className="adm-dispute-id">#{selectedDispute.id}</span>
                      <span
                        className="adm-badge"
                        style={{
                          background: getDisputeTypeMeta(selectedDispute.disputeType).bg,
                          color: getDisputeTypeMeta(selectedDispute.disputeType).color,
                        }}
                      >
                        {getDisputeTypeLabel(selectedDispute.disputeType)}
                      </span>
                      <span
                        className={`adm-badge ${selectedDispute.status === "OPEN" ? "adm-badge--disputed" : selectedDispute.status === "RESOLVED" ? "adm-badge--completed" : selectedDispute.status === "ESCALATED" ? "adm-badge--submitted" : "adm-badge--normal"}`}
                      >
                        {getDisputeStatusLabel(selectedDispute.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className="adm-modal__close"
                  onClick={() => setShowDisputeModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="adm-modal__body">
                {/* Left Column */}
                <div className="adm-modal__col">
                  {/* Dispute Overview */}
                  <div className="adm-section">
                    <div className="adm-section__title">
                      <ShieldAlert size={15} />
                      Thông tin khiếu nại
                    </div>
                    <div className="adm-info-grid">
                      <div className="adm-info-item">
                        <div className="adm-info-item__label"><TrendingUp size={12} /> Người khiếu nại</div>
                        <div className="adm-info-item__value">{selectedDispute.initiatorName || `User #${selectedDispute.initiatorId}`}</div>
                      </div>
                      <div className="adm-info-item">
                        <div className="adm-info-item__label"><Users size={12} /> Bị khiếu nại</div>
                        <div className="adm-info-item__value">{selectedDispute.respondentName || `User #${selectedDispute.respondentId}`}</div>
                      </div>
                      <div className="adm-info-item">
                        <div className="adm-info-item__label"><Briefcase size={12} /> Công việc</div>
                        <div className="adm-info-item__value">#{selectedDispute.jobId}</div>
                      </div>
                      <div className="adm-info-item">
                        <div className="adm-info-item__label"><Clock size={12} /> Mở lúc</div>
                        <div className="adm-info-item__value">{formatTime(selectedDispute.createdAt)}</div>
                      </div>
                      {selectedDispute.resolvedAt && (
                        <div className="adm-info-item">
                          <div className="adm-info-item__label"><CheckCircle size={12} /> Giải quyết lúc</div>
                          <div className="adm-info-item__value">{formatTime(selectedDispute.resolvedAt)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="adm-section">
                    <div className="adm-section__title">
                      <MessageSquare size={15} />
                      Lý do khiếu nại
                    </div>
                    <div className="adm-reason-box">
                      <p>{selectedDispute.reason}</p>
                    </div>
                  </div>

                  <div className="adm-section">
                    <div className="adm-section__title">
                      <Clock size={15} />
                      Audit log
                      {disputeAuditLoading ? (
                        <Loader2 size={14} className="adm-spin" />
                      ) : (
                        <span className="adm-section__count">{disputeAuditLogs.length}</span>
                      )}
                    </div>
                    {disputeAuditLoading ? (
                      <div className="adm-loading-row">
                        <Loader2 size={18} className="adm-spin" />
                        <span>Đang tải audit log...</span>
                      </div>
                    ) : disputeAuditLogs.length > 0 ? (
                      <div className="adm-evidence-timeline">
                        {disputeAuditLogs.map((log) => (
                          <div key={`audit-${log.id}`} className="adm-evidence-item adm-evidence-item--official">
                            <div className="adm-evidence-item__header">
                              <div className="adm-evidence-item__meta">
                                <span className="adm-evidence-item__author">{getAuditActorLabel(log)}</span>
                                <span className="adm-evidence-item__admin-badge">{log.changedByRole}</span>
                              </div>
                              <span className="adm-evidence-item__time">{formatTime(log.createdAt)}</span>
                            </div>
                            <p className="adm-evidence-item__content">
                              {log.previousStatus} → {log.newStatus}
                            </p>
                            {log.reason && <p className="adm-evidence-item__content">{log.reason}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="adm-empty-evidence">
                        <Clock size={20} />
                        <span>Chưa có audit log nào cho dispute này.</span>
                      </div>
                    )}
                  </div>

                  {/* Resolution (if resolved) */}
                  {selectedDispute.status === "RESOLVED" && selectedDispute.resolution && (
                    <div className="adm-section">
                      <div className="adm-section__title">
                        <ShieldCheck size={15} />
                        Kết quả giải quyết
                      </div>
                      <div className="adm-resolution-card">
                        <div className="adm-resolution-card__type">{getResolutionLabel(selectedDispute.resolution)}</div>
                        {selectedDispute.partialRefundPct && (
                          <div className="adm-resolution-card__split">
                            Chia {selectedDispute.partialRefundPct}% cho ứng viên
                          </div>
                        )}
                        {selectedDispute.resolutionNotes && (
                          <p className="adm-resolution-card__notes">{selectedDispute.resolutionNotes}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Evidence Timeline */}
                  <div className="adm-section">
                    <div className="adm-section__title">
                      <Paperclip size={15} />
                      Bằng chứng
                      {disputeDetailLoading ? (
                        <Loader2 size={14} className="adm-spin" />
                      ) : (
                        <span className="adm-section__count">
                          {disputeDetail?.evidence?.length || selectedDispute.evidence?.length || 0}
                        </span>
                      )}
                    </div>
                    {disputeDetailLoading ? (
                      <div className="adm-loading-row">
                        <Loader2 size={18} className="adm-spin" />
                        <span>Đang tải bằng chứng...</span>
                      </div>
                    ) : (disputeDetail?.evidence?.length || 0) > 0 ? (
                      <div className="adm-evidence-timeline">
                        {(disputeDetail?.evidence || []).map((ev: any) => (
                          <div key={ev.id} className={`adm-evidence-item ${ev.isOfficial ? "adm-evidence-item--official" : ""}`}>
                            <div className="adm-evidence-item__header">
                              <div className="adm-evidence-item__meta">
                                <span className="adm-evidence-item__icon">
                                  {getEvidenceTypeIcon(ev.evidenceType)}
                                </span>
                                <span className="adm-evidence-item__author">{ev.submittedByName}</span>
                                {ev.isOfficial && (
                                  <span className="adm-evidence-item__admin-badge">Admin</span>
                                )}
                              </div>
                              <span className="adm-evidence-item__time">{formatTime(ev.createdAt)}</span>
                            </div>
                            {ev.content && (
                              <p className="adm-evidence-item__content">{ev.content}</p>
                            )}
                            {ev.fileUrl && (
                              <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer" className="adm-evidence-item__file">
                                {ev.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <div className="adm-evidence-item__img-wrap">
                                    <img src={ev.fileUrl} alt={ev.fileName || "Evidence"} className="adm-evidence-item__img" />
                                    <div className="adm-evidence-item__img-overlay">
                                      <ExternalLink size={14} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="adm-evidence-item__file-badge">
                                    <Paperclip size={13} />
                                    <span>{ev.fileName || "Tệp đính kèm"}</span>
                                    <ExternalLink size={11} />
                                  </div>
                                )}
                              </a>
                            )}
                            {ev.responses && ev.responses.length > 0 && (
                              <div className="adm-evidence-item__responses">
                                {ev.responses.map((resp: any) => (
                                  <div key={resp.id} className="adm-evidence-item__response">
                                    <div className="adm-evidence-item__response-header">
                                      <MessageSquare size={11} />
                                      <span>{resp.respondedByName}</span>
                                      <span className="adm-evidence-item__time">{formatTime(resp.createdAt)}</span>
                                    </div>
                                    <p>{resp.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="adm-empty-evidence">
                        <Paperclip size={20} />
                        <span>Chưa có bằng chứng nào được gửi.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column — Resolution Form */}
                {selectedDispute.status !== "RESOLVED" && selectedDispute.status !== "DISMISSED" && (
                  <div className="adm-modal__col adm-modal__col--right">
                    <div className="adm-section">
                      <div className="adm-section__title">
                        <Scale size={15} />
                        Quyết định giải quyết
                      </div>

                      {/* Resolution type selector */}
                      <div className="adm-resolution-grid">
                        {getResolutionOptions(selectedDispute.disputeType).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`adm-resolution-card ${resolveResolution === opt.value ? "is-selected" : ""}`}
                            style={{ "--res-color": opt.color } as React.CSSProperties}
                            onClick={() => setResolveResolution(opt.value as DisputeResolution)}
                          >
                            <span className="adm-resolution-card__icon">{opt.icon}</span>
                            <div>
                              <div className="adm-resolution-card__label">{opt.label}</div>
                              <div className="adm-resolution-card__sub">{opt.sub}</div>
                            </div>
                            {resolveResolution === opt.value && (
                              <CheckCircle size={16} className="adm-resolution-card__check" />
                            )}
                          </button>
                        ))}
                        <>
                        {getResolutionOptions(selectedDispute.disputeType)
                          .filter((opt) => opt.value === "CANCEL_JOB" || opt.value === "RECRUITER_WARNING")
                          .map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={`adm-resolution-card ${resolveResolution === opt.value ? "is-selected" : ""}`}
                              style={{ "--res-color": opt.color } as React.CSSProperties}
                              onClick={() => setResolveResolution(opt.value as DisputeResolution)}
                            >
                              <span className="adm-resolution-card__icon">{opt.icon}</span>
                              <div>
                                <div className="adm-resolution-card__label">{opt.label}</div>
                                <div className="adm-resolution-card__sub">{opt.sub}</div>
                              </div>
                              {resolveResolution === opt.value && (
                                <CheckCircle size={16} className="adm-resolution-card__check" />
                              )}
                            </button>
                          ))}
                        {([
                          { value: "WORKER_WINS", label: "ỨC thắng", sub: "Nhận 100% tiền", color: "#a855f7", icon: <TrendingUp size={14} /> },
                          { value: "RECRUITER_WINS", label: "NTD thắng", sub: "Nhận 100% tiền", color: "#06b6d4", icon: <TrendingDown size={14} /> },
                          { value: "WORKER_PARTIAL", label: "ỨC thắng 1 phần", sub: "Chia % theo quyết định", color: "#fbbf24", icon: <ArrowUpDown size={14} /> },
                          { value: "FULL_REFUND", label: "Hoàn toàn cho NTD", sub: "Refund 100%", color: "#f87171", icon: <TrendingDown size={14} /> },
                          { value: "FULL_RELEASE", label: "Giải ngân cho ỨC", sub: "Release 100%", color: "#4ade80", icon: <TrendingUp size={14} /> },
                          { value: "RESUBMIT_REQUIRED", label: "Yêu cầu nộp lại", sub: "Không xử lý tài chính", color: "#94a3b8", icon: <RefreshCw size={14} /> },
                        ] as { value: string; label: string; sub: string; color: string; icon: React.ReactNode }[]).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`adm-resolution-card ${resolveResolution === opt.value ? "is-selected" : ""}`}
                            style={{ "--res-color": opt.color } as React.CSSProperties}
                            onClick={() => setResolveResolution(opt.value as DisputeResolution)}
                          >
                            <span className="adm-resolution-card__icon">{opt.icon}</span>
                            <div>
                              <div className="adm-resolution-card__label">{opt.label}</div>
                              <div className="adm-resolution-card__sub">{opt.sub}</div>
                            </div>
                            {resolveResolution === opt.value && (
                              <CheckCircle size={16} className="adm-resolution-card__check" />
                            )}
                          </button>
                        ))}
                        </>
                      </div>

                      {/* Partial split input */}
                      {(resolveResolution === "WORKER_PARTIAL" || resolveResolution === "PARTIAL_REFUND" || resolveResolution === "PARTIAL_RELEASE") && (
                        <div className="adm-form-group">
                          <label className="adm-form-label">
                            <Percent size={13} /> % cho ứng viên
                          </label>
                          <div className="adm-range-input">
                            <input
                              type="range"
                              min={10}
                              max={90}
                              step={5}
                              value={parseInt(resolvePartialPct) || 50}
                              onChange={(e) => setResolvePartialPct(e.target.value)}
                            />
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={resolvePartialPct}
                              onChange={(e) => setResolvePartialPct(e.target.value)}
                              placeholder="50"
                              className="adm-input adm-input--number"
                            />
                          </div>
                          <div className="adm-split-preview">
                            <div className="adm-split-preview__worker">
                              <TrendingUp size={11} /> ỨC: {parseInt(resolvePartialPct) || 50}%
                            </div>
                            <div className="adm-split-preview__recruiter">
                              <TrendingDown size={11} /> NTD: {100 - (parseInt(resolvePartialPct) || 50)}%
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin notes */}
                      <div className="adm-form-group">
                        <label className="adm-form-label">
                          <MessageSquare size={13} /> Ghi chú giải quyết
                        </label>
                        <textarea
                          className="adm-textarea"
                          value={resolveNotes}
                          onChange={(e) => setResolveNotes(e.target.value)}
                          rows={4}
                          placeholder="Nhập ghi chú về quyết định giải quyết (bắt buộc)..."
                        />
                      </div>

                      {/* Actions */}
                      <div className="adm-modal-actions">
                        <button
                          className="adm-btn adm-btn--danger"
                          onClick={handleResolveDispute}
                          disabled={resolveLoading || !resolveResolution}
                        >
                          {resolveLoading ? (
                            <><Loader2 size={15} className="adm-spin" /> Đang xử lý...</>
                          ) : (
                            <><Gavel size={15} /> Xác nhận giải quyết</>
                          )}
                        </button>
                        <button
                          className="adm-btn adm-btn--ghost"
                          onClick={() => setShowDisputeModal(false)}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
        />
      )}
    </div>
  );
};
