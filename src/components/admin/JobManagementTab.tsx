import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

// ==================== COMPONENT ====================

export const JobManagementTab: React.FC = () => {
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

  // ==================== DATA LOADING ====================

  const loadPendingJobs = useCallback(async () => {
    setPendingLoading(true);
    try {
      const data = await adminService.getPendingShortTermJobs();
      setPendingJobs(data);
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
        await adminService.approveShortTermJob(selectedJob.id);
        showSuccess("Thành công", "Đã duyệt tin tuyển dụng ngắn hạn");
      } else if (actionType === "reject") {
        await adminService.rejectShortTermJob(selectedJob.id, actionReason);
        showSuccess("Thành công", "Đã từ chối tin tuyển dụng");
      } else if (actionType === "ban") {
        await adminService.banJob(selectedJob.id, actionReason);
        showSuccess("Thành công", "Đã khóa tin tuyển dụng");
      } else if (actionType === "unban") {
        await adminService.unbanJob(selectedJob.id);
        showSuccess("Thành công", "Đã mở khóa tin tuyển dụng");
      } else if (actionType === "delete") {
        await adminService.deleteJob(selectedJob.id);
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
      showError("Lỗi", "Không thể xử lý yêu cầu");
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
        (resolveResolution === "PARTIAL_REFUND" ||
          resolveResolution === "PARTIAL_RELEASE") &&
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
      showError("Lỗi", "Không thể giải quyết khiếu nại");
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
      ESCALATED: "Escalated",
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
    return map[type] || type;
  };

  const getResolutionLabel = (r: DisputeResolution) => {
    const map: Record<DisputeResolution, string> = {
      FULL_REFUND: "Hoàn tiền 100%",
      FULL_RELEASE: "Giải ngân 100%",
      PARTIAL_REFUND: "Hoàn tiền 1 phần",
      PARTIAL_RELEASE: "Giải ngân 1 phần",
      RESUBMIT_REQUIRED: "Yêu cầu nộp lại",
      NO_ACTION: "Không xử lý",
    };
    return map[r] || r;
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
                          ) : (
                            <button
                              className="jm-icon-btn jm-icon-btn--ban"
                              onClick={() => openActionModal(job, "ban")}
                              title="Khóa"
                            >
                              <Ban size={14} />
                            </button>
                          )}
                          <button
                            className="jm-icon-btn jm-icon-btn--delete"
                            onClick={() => openActionModal(job, "delete")}
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
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
                        {job.recruiterInfo?.companyName || "N/A"}
                      </span>
                    </div>
                    <div className="jm-approve-card__badges">
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
                  <h3 className="jm-approve-card__title">{job.title}</h3>
                  <div className="jm-approve-card__meta">
                    <div className="jm-approve-card__meta-item jm-approve-card__meta-item--money">
                      <DollarSign size={14} />
                      <span>{formatCurrency(job.budget)}</span>
                    </div>
                    <div className="jm-approve-card__meta-item">
                      <Calendar size={14} />
                      <span>{formatDate(job.deadline)}</span>
                    </div>
                    <div className="jm-approve-card__meta-item">
                      <Clock size={14} />
                      <span>{job.estimatedDuration || "N/A"}</span>
                    </div>
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
                <option value="ESCALATED">Escalated</option>
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
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setShowDisputeModal(true);
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
                {!selectedJob.isBanned &&
                  selectedJob.status !== "PAID" &&
                  selectedJob.status !== "CLOSED" && (
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
                {selectedJob.status !== "PAID" &&
                  selectedJob.status !== "CLOSED" && (
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
          <div className="jm-overlay" onClick={() => setShowDisputeModal(false)}>
            <div
              className="jm-modal jm-modal--lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="jm-modal__header">
                <div className="jm-modal__header-left">
                  <div className="jm-modal__type-icon jm-modal__type-icon--red">
                    <Gavel size={18} />
                  </div>
                  <div>
                    <h2 className="jm-modal__title">Giải quyết khiếu nại</h2>
                    <p className="jm-modal__subtitle">
                      #{selectedDispute.id} —{" "}
                      {getDisputeTypeLabel(selectedDispute.disputeType)}
                    </p>
                  </div>
                </div>
                <button
                  className="jm-modal__close"
                  onClick={() => setShowDisputeModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="jm-modal__body">
                <div className="jm-dispute-detail">
                  <div className="jm-dispute-detail__reason">
                    <strong>Lý do khiếu nại:</strong> {selectedDispute.reason}
                  </div>
                  <div className="jm-dispute-detail__parties">
                    <div className="jm-party-card">
                      <div className="jm-party-card__label">
                        <TrendingUp size={14} /> Người khiếu nại
                      </div>
                      <div className="jm-party-card__value">
                        {selectedDispute.initiatorName ||
                          `User #${selectedDispute.initiatorId}`}
                      </div>
                    </div>
                    <div className="jm-party-card">
                      <div className="jm-party-card__label">
                        <Users size={14} /> Bị khiếu nại
                      </div>
                      <div className="jm-party-card__value">
                        {selectedDispute.respondentName ||
                          `User #${selectedDispute.respondentId}`}
                      </div>
                    </div>
                    <div className="jm-party-card">
                      <div className="jm-party-card__label">
                        <Briefcase size={14} /> Job ID
                      </div>
                      <div className="jm-party-card__value">
                        #{selectedDispute.jobId}
                      </div>
                    </div>
                    <div className="jm-party-card">
                      <div className="jm-party-card__label">
                        <Calendar size={14} /> Ngày tạo
                      </div>
                      <div className="jm-party-card__value">
                        {formatDate(selectedDispute.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="jm-form-group">
                  <label className="jm-form-label">
                    <Scale size={14} /> Hình thức giải quyết{" "}
                    <span className="jm-required">*</span>
                  </label>
                  <div className="jm-resolution-options">
                    {(
                      [
                        "FULL_REFUND",
                        "FULL_RELEASE",
                        "PARTIAL_REFUND",
                        "PARTIAL_RELEASE",
                        "RESUBMIT_REQUIRED",
                        "NO_ACTION",
                      ] as DisputeResolution[]
                    ).map((r) => (
                      <label
                        key={r}
                        className={`jm-resolution-option ${resolveResolution === r ? "jm-resolution-option--selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="resolution"
                          value={r}
                          checked={resolveResolution === r}
                          onChange={() => setResolveResolution(r)}
                        />
                        <span>{getResolutionLabel(r)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {(resolveResolution === "PARTIAL_REFUND" ||
                  resolveResolution === "PARTIAL_RELEASE") && (
                  <div className="jm-form-group">
                    <label className="jm-form-label">
                      <AlertCircle size={14} /> % hoàn tiền / giải ngân{" "}
                      <span className="jm-required">*</span>
                    </label>
                    <input
                      type="number"
                      className="jm-input"
                      value={resolvePartialPct}
                      onChange={(e) => setResolvePartialPct(e.target.value)}
                      placeholder="VD: 50"
                      min={1}
                      max={99}
                    />
                  </div>
                )}

                <div className="jm-form-group">
                  <label className="jm-form-label">
                    <MessageSquare size={14} /> Ghi chú giải quyết
                  </label>
                  <textarea
                    className="jm-textarea"
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    rows={4}
                    placeholder="Nhập ghi chú về quyết định giải quyết..."
                  />
                </div>
              </div>
              <div className="jm-modal__footer">
                <button
                  className="jm-modal-btn jm-modal-btn--approve"
                  onClick={handleResolveDispute}
                  disabled={resolveLoading}
                >
                  {resolveLoading ? (
                    <>
                      <Loader2 size={15} className="jm-spin" /> Đang xử
                      lý...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Xác nhận giải quyết
                    </>
                  )}
                </button>
                <button
                  className="jm-modal-btn jm-modal-btn--secondary"
                  onClick={() => setShowDisputeModal(false)}
                >
                  Hủy bỏ
                </button>
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
