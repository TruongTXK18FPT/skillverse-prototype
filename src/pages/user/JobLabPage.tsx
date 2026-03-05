import React, { useState, useEffect, useMemo } from "react";
import {
  Briefcase,
  Zap,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
  Eye,
  FileText,
  Users,
  Target,
  Activity,
  BarChart3,
  X,
  ChevronRight,
  Wallet,
  Star,
  MapPin,
  Award,
  Lightbulb,
  FileCheck,
  XCircle,
  Send,
  RefreshCw,
  Building2,
  Globe,
  Timer,
  BadgeCheck,
  Upload,
  Link,
  Trash2,
  FolderOpen,
  ClipboardList,
  AlertTriangle,
  Ban,
  ShieldAlert,
} from "lucide-react";
import jobService from "../../services/jobService";
import shortTermJobService from "../../services/shortTermJobService";
import { JobApplicationResponse } from "../../data/jobDTOs";
import {
  ShortTermApplicationResponse,
  SubmitDeliverableRequest,
} from "../../types/ShortTermJob";
import MeowlKuruLoader from "../../components/kuru-loader/MeowlKuruLoader";
import "../../styles/JobLab.css";
import "../../components/jobs-odyssey/odyssey-styles.css";

type JobType = "ALL" | "REGULAR" | "SHORT_TERM";
type ViewMode =
  | "dashboard"
  | "applications"
  | "active"
  | "completed"
  | "submit"
  | "workspace";

interface JobStats {
  totalApplications: number;
  activeJobs: number;
  waitingApplications: number;
  completedJobs: number;
  totalEarnings: number;
  pendingPayments: number;
}

interface UnifiedApplication {
  id: string;
  type: "REGULAR" | "SHORT_TERM";
  jobId: number;
  title: string;
  company: string;
  minBudget: number;
  maxBudget: number;
  budget?: number;
  isRemote: boolean;
  location: string;
  appliedAt: string;
  status: string;
  coverLetter?: string;
  proposedPrice?: number;
  proposedDuration?: string;
  jobDetails?: {
    title: string;
    budget: number;
    deadline: string;
    recruiterCompanyName?: string;
    description?: string;
    requiredSkills?: string[];
    benefits?: string[];
    location?: string;
    isRemote?: boolean;
  };
}

const JobLab: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [jobType, setJobType] = useState<JobType>("ALL");
  const [loading, setLoading] = useState(true);
  const [regularApplications, setRegularApplications] = useState<
    JobApplicationResponse[]
  >([]);
  const [shortTermApplications, setShortTermApplications] = useState<
    ShortTermApplicationResponse[]
  >([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<UnifiedApplication | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // ── Cancel modal ──────────────────────────────────────────────────────────
  const [cancelModalApp, setCancelModalApp] =
    useState<UnifiedApplication | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonOther, setCancelReasonOther] = useState("");

  // ── Cooldown (1 hour, persisted in localStorage) ──────────────────────────
  const COOLDOWN_MS = 3_600_000;
  const COOLDOWN_KEY = "jlab_cancel_cooldowns";
  const getCooldowns = (): Record<number, string> => {
    try {
      return JSON.parse(localStorage.getItem(COOLDOWN_KEY) || "{}");
    } catch {
      return {};
    }
  };
  const setCooldownFor = (jobId: number) => {
    const cd = getCooldowns();
    cd[jobId] = new Date().toISOString();
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cd));
  };
  const getCooldownRemaining = (jobId: number): number => {
    const cd = getCooldowns();
    if (!cd[jobId]) return 0;
    const remaining = COOLDOWN_MS - (Date.now() - new Date(cd[jobId]).getTime());
    return remaining > 0 ? remaining : 0;
  };
  const formatCooldown = (ms: number) => {
    const m = Math.ceil(ms / 60_000);
    return m >= 60 ? "1 giờ" : `${m} phút`;
  };

  // ── Re-apply lock (after 1 re-apply, cancel is permanently blocked) ────────
  const REAPPLY_KEY = "jlab_reapplied_jobs";
  const getReappliedJobs = (): number[] => {
    try {
      return JSON.parse(localStorage.getItem(REAPPLY_KEY) || "[]");
    } catch {
      return [];
    }
  };
  const hasReapplied = (jobId: number) => getReappliedJobs().includes(jobId);

  // ── Toast system ──────────────────────────────────────────────────────────
  interface ToastItem {
    id: number;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = React.useRef(0);
  const showToast = (
    type: ToastItem["type"],
    title: string,
    message: string,
  ) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      6000,
    );
  };
  const dismissToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Cancel flow ────────────────────────────────────────────────────────────
  const openCancelModal = (app: UnifiedApplication) => {
    if (hasReapplied(app.jobId)) {
      showToast(
        "warning",
        "Không thể hủy đơn",
        `Bạn đã ứng tuyển lại job "${app.title}" sau khi rút trước đó. Đơn lần này không thể hủy nữa.`,
      );
      return;
    }
    const remaining = getCooldownRemaining(app.jobId);
    if (remaining > 0) {
      showToast(
        "info",
        "Đang trong thời gian chờ",
        `Bạn vừa hủy đơn cho job này. Vui lòng chờ thêm ${formatCooldown(remaining)} trước khi thao tác lại.`,
      );
      return;
    }
    setCancelReason("");
    setCancelReasonOther("");
    setCancelModalApp(app);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalApp) return;
    const finalReason =
      cancelReason === "other" ? cancelReasonOther.trim() : cancelReason;
    if (!finalReason) {
      showToast("error", "Thiếu lý do", "Vui lòng chọn hoặc nhập lý do hủy đơn.");
      return;
    }
    const appId = cancelModalApp.id;
    const appSnapshot = { ...cancelModalApp };
    setCancelModalApp(null);
    setCancelling(appId);
    try {
      if (appId.startsWith("shortterm-")) {
        const numericId = Number(appId.replace("shortterm-", ""));
        await shortTermJobService.withdrawApplication(numericId);
        setCooldownFor(appSnapshot.jobId);
      }
      setShowDetailModal(false);
      await fetchApplications();
      showToast(
        "success",
        "Hủy đơn thành công",
        `Đơn "${appSnapshot.title}" đã được rút. Bạn có thể ứng tuyển lại sau 1 giờ — lưu ý: sau khi ứng tuyển lại sẽ không thể hủy nữa.`,
      );
    } catch {
      showToast("error", "Hủy thất bại", "Không thể rút đơn. Vui lòng thử lại.");
    } finally {
      setCancelling(null);
    }
  };

  // Workspace state
  const [workspaceSelectedApp, setWorkspaceSelectedApp] =
    useState<UnifiedApplication | null>(null);
  const [workNote, setWorkNote] = useState("");
  const [workFiles, setWorkFiles] = useState<File[]>([]);
  const [workLinks, setWorkLinks] = useState<string[]>([""]);
  const [isFinalSubmission, setIsFinalSubmission] = useState(false);
  const [submittingWork, setSubmittingWork] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const [regularData, shortTermData] = await Promise.all([
        jobService.getMyApplications().catch(() => []),
        shortTermJobService.getMyApplications().catch(() => []),
      ]);
      setRegularApplications(regularData);
      setShortTermApplications(shortTermData);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Unified applications
  const allApplications: UnifiedApplication[] = useMemo(() => {
    const regular: UnifiedApplication[] = regularApplications.map((app) => ({
      id: `regular-${app.id}`,
      type: "REGULAR" as const,
      jobId: app.jobId,
      title: app.jobTitle,
      company: app.recruiterCompanyName,
      minBudget: app.minBudget,
      maxBudget: app.maxBudget,
      budget: app.maxBudget,
      isRemote: app.isRemote,
      location: app.location,
      appliedAt: app.appliedAt,
      status: app.status,
      coverLetter: app.coverLetter,
    }));

    const shortTerm: UnifiedApplication[] = shortTermApplications.map(
      (app) => ({
        id: `shortterm-${app.id}`,
        type: "SHORT_TERM" as const,
        jobId: app.jobId,
        title: app.jobTitle || app.jobDetails?.title || "Short-term Job",
        company: app.jobDetails?.recruiterCompanyName || "",
        minBudget: app.jobBudget || 0,
        maxBudget: app.jobBudget || 0,
        budget: app.jobBudget || app.proposedPrice || 0,
        isRemote: app.jobDetails?.isRemote || false,
        location: app.jobDetails?.location || "",
        appliedAt: app.appliedAt,
        status: app.status,
        coverLetter: app.coverLetter,
        proposedPrice: app.proposedPrice,
        proposedDuration: app.proposedDuration,
        jobDetails: app.jobDetails,
      }),
    );

    return [...regular, ...shortTerm].sort(
      (a, b) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
    );
  }, [regularApplications, shortTermApplications]);

  // Filter by type
  const filteredApplications = useMemo(() => {
    if (jobType === "ALL") return allApplications;
    return allApplications.filter((app) => app.type === jobType);
  }, [allApplications, jobType]);

  // Filter by view mode
  const viewApplications = useMemo(() => {
    switch (viewMode) {
      case "active":
        return filteredApplications.filter((app) =>
          ["PENDING", "REVIEWED"].includes(app.status),
        );
      case "completed":
        return filteredApplications.filter((app) =>
          ["APPROVED", "COMPLETED", "PAID"].includes(app.status),
        );
      default:
        return filteredApplications;
    }
  }, [filteredApplications, viewMode]);

  // Stats
  const stats: JobStats = useMemo(() => {
    const totalApps = allApplications.length;
    const waitingApplications = allApplications.filter((app) =>
      ["PENDING", "REVIEWED"].includes(app.status),
    ).length;
    const activeJobs = allApplications.filter((app) =>
      ["ACCEPTED", "WORKING"].includes(app.status),
    ).length;
    const completedJobs = allApplications.filter((app) =>
      ["APPROVED", "COMPLETED", "PAID"].includes(app.status),
    ).length;

    const totalEarnings = allApplications
      .filter((app) => ["COMPLETED", "PAID"].includes(app.status))
      .reduce((sum, app) => sum + (app.budget || app.maxBudget || 0), 0);

    const pendingPayments = allApplications
      .filter((app) => ["APPROVED", "SUBMITTED"].includes(app.status))
      .reduce((sum, app) => sum + (app.budget || app.maxBudget || 0), 0);

    return {
      totalApplications: totalApps,
      activeJobs,
      waitingApplications,
      completedJobs,
      totalEarnings,
      pendingPayments,
    };
  }, [allApplications]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; bg: string }
    > = {
      PENDING: {
        label: "Chờ xét",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)",
      },
      REVIEWED: {
        label: "Đã xem",
        color: "#3b82f6",
        bg: "rgba(59, 130, 246, 0.15)",
      },
      ACCEPTED: {
        label: "Được nhận",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.15)",
      },
      WORKING: {
        label: "Đang làm",
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.15)",
      },
      SUBMITTED: {
        label: "Đã nộp",
        color: "#06b6d4",
        bg: "rgba(6, 182, 212, 0.15)",
      },
      APPROVED: {
        label: "Đã duyệt",
        color: "#a855f7",
        bg: "rgba(168, 85, 247, 0.15)",
      },
      COMPLETED: {
        label: "Hoàn thành",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.15)",
      },
      PAID: {
        label: "Đã thanh toán",
        color: "#059669",
        bg: "rgba(5, 150, 105, 0.15)",
      },
      REJECTED: {
        label: "Từ chối",
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.15)",
      },
      WITHDRAWN: {
        label: "Đã rút",
        color: "#6b7280",
        bg: "rgba(107, 114, 128, 0.15)",
      },
    };
    return (
      statusMap[status] || {
        label: status,
        color: "#6b7280",
        bg: "rgba(107, 114, 128, 0.15)",
      }
    );
  };

  const handleCancelApplication = (app: UnifiedApplication) => {
    openCancelModal(app);
  };

  const workspaceApps = useMemo(
    () =>
      allApplications.filter(
        (app) =>
          app.type === "SHORT_TERM" &&
          ["ACCEPTED", "WORKING"].includes(app.status),
      ),
    [allApplications],
  );

  const handleSelectWorkspaceApp = (app: UnifiedApplication) => {
    setWorkspaceSelectedApp(app);
    setWorkNote("");
    setWorkFiles([]);
    setWorkLinks([""]);
    setIsFinalSubmission(false);
  };

  const handleAddLink = () => setWorkLinks((prev) => [...prev, ""]);

  const handleRemoveLink = (idx: number) =>
    setWorkLinks((prev) => prev.filter((_, i) => i !== idx));

  const handleLinkChange = (idx: number, value: string) =>
    setWorkLinks((prev) => prev.map((l, i) => (i === idx ? value : l)));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setWorkFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveFile = (idx: number) =>
    setWorkFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmitDeliverables = async () => {
    if (!workspaceSelectedApp) return;
    if (!workNote.trim() && workFiles.length === 0) {
      alert("Vui lòng nhập ghi chú công việc hoặc đính kèm tệp.");
      return;
    }
    const numericId = Number(workspaceSelectedApp.id.replace("shortterm-", ""));
    const filteredLinks = workLinks.filter((l) => l.trim() !== "");
    const payload: SubmitDeliverableRequest = {
      applicationId: numericId,
      files: workFiles,
      workNote: workNote.trim() || undefined,
      links: filteredLinks.length > 0 ? filteredLinks : undefined,
      isFinalSubmission,
    };
    setSubmittingWork(true);
    try {
      await shortTermJobService.submitDeliverables(payload);
      setWorkNote("");
      setWorkFiles([]);
      setWorkLinks([""]);
      setIsFinalSubmission(false);
      setWorkspaceSelectedApp(null);
      await fetchApplications();
      alert("Nộp công việc thành công!");
    } catch (error) {
      console.error("Error submitting deliverables:", error);
      alert("Không thể nộp công việc. Vui lòng thử lại.");
    } finally {
      setSubmittingWork(false);
    }
  };

  const handleViewDetail = (app: UnifiedApplication) => {
    setSelectedJob(app);
    setShowDetailModal(true);
  };

  const handleGoToJobs = () => {
    window.location.href = "/jobs";
  };

  // Navigation items
  const navItems = [
    { id: "dashboard", label: "Tổng quan", icon: Activity },
    {
      id: "applications",
      label: "Tất cả đơn",
      icon: FileText,
      count: stats.totalApplications,
    },
    {
      id: "active",
      label: "Chờ nhận đơn",
      icon: Clock,
      count: stats.waitingApplications,
    },
    {
      id: "completed",
      label: "Hoàn thành",
      icon: CheckCircle,
      count: stats.completedJobs,
    },
    {
      id: "workspace",
      label: "Khu vực làm việc",
      icon: ClipboardList,
      count: workspaceApps.length,
    },
    { id: "submit", label: "Ứng tuyển", icon: Plus },
  ];

  if (loading) {
    return (
      <div className="jlab-container">
        <div className="jlab-loading">
          <MeowlKuruLoader size="large" text="Đang tải Job Lab..." />
        </div>
      </div>
    );
  }

  return (
    <div className="jlab-container">
      {/* Sidebar */}
      <aside className="jlab-sidebar">
        <div className="jlab-sidebar-logo">
          <div className="jlab-sidebar-logo-icon">
            <Zap size={24} color="#fff" />
          </div>
          <div className="jlab-sidebar-logo-text">
            <h2>Job Lab</h2>
            <span>Career Hub</span>
          </div>
        </div>

        <nav className="jlab-nav-section">
          <div className="jlab-nav-section-title">Menu</div>
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`jlab-nav-item ${viewMode === item.id ? "active" : ""}`}
              onClick={() => setViewMode(item.id as ViewMode)}
            >
              <div className="jlab-nav-item-icon">
                <item.icon size={18} />
              </div>
              <span className="jlab-nav-item-text">{item.label}</span>
              {item.count !== undefined && (
                <span className="jlab-nav-item-badge">{item.count}</span>
              )}
            </div>
          ))}
        </nav>

        <div className="jlab-nav-section" style={{ marginTop: "auto" }}>
          <div className="jlab-nav-section-title">Quick Stats</div>
          <div className="jlab-quick-stats">
            <div className="jlab-quick-stats-header">
              <Wallet size={16} color="#10b981" />
              <span>Tổng thu nhập</span>
            </div>
            <div className="jlab-quick-stats-value">
              {formatCurrency(stats.totalEarnings)}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="jlab-main">
        {/* Header */}
        <div className="jlab-header">
          <div>
            <h1 className="jlab-header-title">
              {viewMode === "dashboard" && "Tổng Quan"}
              {viewMode === "applications" && "Tất Cả Đơn Ứng Tuyển"}
              {viewMode === "active" && "Đang Chờ Nhận Đơn"}
              {viewMode === "completed" && "Công Việc Hoàn Thành"}
              {viewMode === "workspace" && "Khu Vực Làm Việc"}
              {viewMode === "submit" && "Ứng Tuyển Công Việc"}
            </h1>
            <p className="jlab-header-subtitle">
              {viewMode === "dashboard" &&
                "Theo dõi tiến độ và quản lý công việc của bạn"}
              {viewMode === "applications" && "Danh sách tất cả đơn ứng tuyển"}
              {viewMode === "active" &&
                "Các đơn ứng tuyển đang chờ nhà tuyển dụng xét duyệt"}
              {viewMode === "completed" && "Các công việc đã hoàn thành"}
              {viewMode === "workspace" &&
                "Nộp bài và quản lý tiến độ công việc ngắn hạn"}
              {viewMode === "submit" && "Tìm và ứng tuyển công việc mới"}
            </p>
          </div>
          {viewMode !== "dashboard" && (
            <button
              className="jlab-btn-mini jlab-btn-mini--primary"
              onClick={handleGoToJobs}
            >
              <Plus size={14} />
              Tìm việc
            </button>
          )}
        </div>

        {/* Dashboard View */}
        {viewMode === "dashboard" && (
          <>
            {/* Stats Grid */}
            <div className="jlab-stats-grid">
              <div className="jlab-stat-card jlab-stat-card--cyan">
                <div className="jlab-stat-card-icon">
                  <FileText size={24} />
                </div>
                <div className="jlab-stat-card-value">
                  {stats.totalApplications}
                </div>
                <div className="jlab-stat-card-label">Tổng đơn ứng tuyển</div>
                <div className="jlab-stat-card-trend jlab-stat-card-trend--up">
                  <TrendingUp size={14} /> +12% this month
                </div>
              </div>

              <div className="jlab-stat-card jlab-stat-card--orange">
                <div className="jlab-stat-card-icon">
                  <Briefcase size={24} />
                </div>
                <div className="jlab-stat-card-value">{stats.activeJobs}</div>
                <div className="jlab-stat-card-label">Đang thực hiện</div>
                <div className="jlab-stat-card-trend">
                  <Clock size={14} />{" "}
                  {stats.pendingPayments > 0
                    ? `Chờ ${formatCurrency(stats.pendingPayments)}`
                    : "Tất cả đã xử lý"}
                </div>
              </div>

              <div className="jlab-stat-card jlab-stat-card--green">
                <div className="jlab-stat-card-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="jlab-stat-card-value">
                  {stats.completedJobs}
                </div>
                <div className="jlab-stat-card-label">Hoàn thành</div>
                <div className="jlab-stat-card-trend jlab-stat-card-trend--up">
                  <TrendingUp size={14} /> +8% this month
                </div>
              </div>

              <div className="jlab-stat-card jlab-stat-card--purple">
                <div className="jlab-stat-card-icon">
                  <DollarSign size={24} />
                </div>
                <div className="jlab-stat-card-value">
                  {formatCurrency(stats.totalEarnings)}
                </div>
                <div className="jlab-stat-card-label">Tổng thu nhập</div>
                <div className="jlab-stat-card-trend jlab-stat-card-trend--up">
                  <TrendingUp size={14} /> +15% this month
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="jlab-charts-grid">
              {/* Job Status Distribution */}
              <div className="jlab-chart-card">
                <div className="jlab-chart-card-title">
                  <BarChart3 size={18} /> Trạng thái công việc
                </div>
                <div className="jlab-progress-item">
                  <div className="jlab-progress-label">
                    <span>Hoàn thành</span>
                    <span>{stats.completedJobs} jobs</span>
                  </div>
                  <div className="jlab-progress-bar">
                    <div
                      className="jlab-progress-fill jlab-progress-fill--green"
                      style={{
                        width: `${stats.totalApplications ? (stats.completedJobs / stats.totalApplications) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="jlab-progress-item">
                  <div className="jlab-progress-label">
                    <span>Đang làm</span>
                    <span>{stats.activeJobs} jobs</span>
                  </div>
                  <div className="jlab-progress-bar">
                    <div
                      className="jlab-progress-fill jlab-progress-fill--cyan"
                      style={{
                        width: `${stats.totalApplications ? (stats.activeJobs / stats.totalApplications) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="jlab-progress-item">
                  <div className="jlab-progress-label">
                    <span>Chờ xử lý</span>
                    <span>
                      {stats.totalApplications -
                        stats.activeJobs -
                        stats.completedJobs}{" "}
                      jobs
                    </span>
                  </div>
                  <div className="jlab-progress-bar">
                    <div
                      className="jlab-progress-fill jlab-progress-fill--orange"
                      style={{
                        width: `${stats.totalApplications ? ((stats.totalApplications - stats.activeJobs - stats.completedJobs) / stats.totalApplications) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="jlab-chart-card">
                <div className="jlab-chart-card-title">
                  <Activity size={18} /> Hoạt động gần đây
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {allApplications.slice(0, 5).map((app) => (
                    <div
                      key={app.id}
                      className="jlab-activity-item"
                      onClick={() => handleViewDetail(app)}
                    >
                      <div
                        className="jlab-activity-dot"
                        style={{ background: getStatusInfo(app.status).color }}
                      />
                      <div className="jlab-activity-content">
                        <div className="jlab-activity-title">{app.title}</div>
                        <div className="jlab-activity-meta">
                          {getStatusInfo(app.status).label} •{" "}
                          {formatDate(app.appliedAt)}
                        </div>
                      </div>
                      <ChevronRight size={16} color="#6b7280" />
                    </div>
                  ))}
                  {allApplications.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "#94a3b8",
                      }}
                    >
                      Chưa có hoạt động nào
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Jobs */}
            <div style={{ marginTop: "1.5rem" }}>
              <h3 className="jlab-section-title">
                <Briefcase size={18} /> Công việc gần đây
              </h3>
              <div className="jlab-jobs-grid">
                {allApplications.slice(0, 4).map((app) => (
                  <div
                    key={app.id}
                    className="jlab-job-card"
                    onClick={() => handleViewDetail(app)}
                  >
                    <div className="jlab-job-card-header">
                      <span
                        className={`jlab-job-card-type jlab-job-card-type--${app.type === "SHORT_TERM" ? "shortterm" : "fulltime"}`}
                      >
                        {app.type === "SHORT_TERM" ? "Gig" : "Full-time"}
                      </span>
                      <span
                        className="jlab-job-card-status"
                        style={{
                          background: getStatusInfo(app.status).bg,
                          color: getStatusInfo(app.status).color,
                        }}
                      >
                        {getStatusInfo(app.status).label}
                      </span>
                    </div>
                    <h4 className="jlab-job-card-title">{app.title}</h4>
                    <div className="jlab-job-card-company">
                      <Users size={14} /> {app.company}
                    </div>
                    <div className="jlab-job-card-meta">
                      <div className="jlab-job-card-meta-item">
                        <DollarSign size={14} />
                        {formatCurrency(app.budget || app.maxBudget)}
                      </div>
                      <div className="jlab-job-card-meta-item">
                        <Calendar size={14} />
                        {formatDate(app.appliedAt)}
                      </div>
                    </div>
                    <div className="jlab-job-card-actions">
                      <button className="jlab-btn-mini jlab-btn-mini--secondary">
                        <Eye size={12} /> Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Applications List View */}
        {viewMode !== "dashboard" && (
          <>
            {/* Filter Tabs — ody-nav style */}
            <div className="ody-nav jlab-ody-nav-override">
              <div className="ody-nav__track">
                <button
                  className={`ody-nav__pill${jobType === "ALL" ? " ody-nav__pill--active" : ""}`}
                  onClick={() => setJobType("ALL")}
                >
                  <Briefcase size={14} />
                  <span className="ody-nav__label">Tất cả</span>
                  <span className="ody-nav__count">{allApplications.length}</span>
                </button>
                <button
                  className={`ody-nav__pill${jobType === "REGULAR" ? " ody-nav__pill--active" : ""}`}
                  onClick={() => setJobType("REGULAR")}
                >
                  <Briefcase size={14} />
                  <span className="ody-nav__label">Full-time</span>
                  <span className="ody-nav__count">
                    {allApplications.filter((a) => a.type === "REGULAR").length}
                  </span>
                </button>
                <button
                  className={`ody-nav__pill ody-nav__pill--gig${jobType === "SHORT_TERM" ? " ody-nav__pill--active" : ""}`}
                  onClick={() => setJobType("SHORT_TERM")}
                >
                  <Zap size={14} />
                  <span className="ody-nav__label">Gig / Short-term</span>
                  <span className="ody-nav__count">
                    {allApplications.filter((a) => a.type === "SHORT_TERM").length}
                  </span>
                </button>
              </div>
            </div>

            {/* Jobs Grid */}
            {viewApplications.length === 0 ? (
              <div className="jlab-empty">
                <div className="jlab-empty-icon">📭</div>
                <h3 className="jlab-empty-title">Chưa có công việc</h3>
                <p className="jlab-empty-text">
                  {viewMode === "active"
                    ? "Chưa có đơn ứng tuyển nào đang chờ xét duyệt"
                    : viewMode === "completed"
                      ? "Bạn chưa hoàn thành công việc nào"
                      : "Hãy bắt đầu ứng tuyển công việc"}
                </p>
                <button
                  className="jlab-btn-mini jlab-btn-mini--primary"
                  onClick={handleGoToJobs}
                >
                  <Plus size={14} /> Tìm việc ngay
                </button>
              </div>
            ) : (
              <div className="jlab-jobs-grid">
                {viewApplications.map((app) => (
                  <div
                    key={app.id}
                    className="jlab-job-card"
                    onClick={() => handleViewDetail(app)}
                  >
                    <div className="jlab-job-card-header">
                      <span
                        className={`jlab-job-card-type jlab-job-card-type--${app.type === "SHORT_TERM" ? "shortterm" : "fulltime"}`}
                      >
                        {app.type === "SHORT_TERM" ? "Gig" : "Full-time"}
                      </span>
                      <span
                        className="jlab-job-card-status"
                        style={{
                          background: getStatusInfo(app.status).bg,
                          color: getStatusInfo(app.status).color,
                        }}
                      >
                        {getStatusInfo(app.status).label}
                      </span>
                    </div>
                    <h4 className="jlab-job-card-title">{app.title}</h4>
                    <div className="jlab-job-card-company">
                      <Users size={14} /> {app.company}
                    </div>
                    <div className="jlab-job-card-meta">
                      <div className="jlab-job-card-meta-item">
                        <DollarSign size={14} />
                        {formatCurrency(app.budget || app.maxBudget)}
                      </div>
                      <div className="jlab-job-card-meta-item">
                        <Calendar size={14} />
                        {formatDate(app.appliedAt)}
                      </div>
                      {app.type === "SHORT_TERM" && app.proposedPrice && (
                        <div className="jlab-job-card-meta-item">
                          <Zap size={14} />
                          Đề xuất: {formatCurrency(app.proposedPrice)}
                        </div>
                      )}
                    </div>
                    {app.coverLetter && (
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#94a3b8",
                          marginBottom: "1rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {app.coverLetter}
                      </p>
                    )}
                    <div className="jlab-job-card-actions">
                      <button className="jlab-btn-mini jlab-btn-mini--primary">
                        <Eye size={12} /> Chi tiết
                      </button>
                      {["COMPLETED", "PAID"].includes(app.status) && (
                        <button className="jlab-btn-mini jlab-btn-mini--secondary">
                          <Star size={12} /> Đánh giá
                        </button>
                      )}
                      {["PENDING", "REVIEWED"].includes(app.status) && (
                        <button
                          className="jlab-btn-mini jlab-btn-mini--danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelApplication(app);
                          }}
                          disabled={cancelling === app.id}
                        >
                          {cancelling === app.id ? (
                            <RefreshCw size={12} className="jlab-spin" />
                          ) : (
                            <XCircle size={12} />
                          )}
                          Hủy
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedJob && (
        <div
          className="jlab-modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="jlab-modal jlab-modal--large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jlab-modal-header">
              <h3 className="jlab-modal-title">Chi tiết đơn ứng tuyển</h3>
              <button
                className="jlab-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="jlab-modal-body jlab-modal-body--scrollable">
              {/* Header Section */}
              <div className="jlab-detail-header">
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <span
                    className={`jlab-job-card-type jlab-job-card-type--${selectedJob.type === "SHORT_TERM" ? "shortterm" : "fulltime"}`}
                  >
                    {selectedJob.type === "SHORT_TERM"
                      ? "Gig / Short-term"
                      : "Full-time"}
                  </span>
                  <span
                    className="jlab-job-card-status"
                    style={{
                      background: getStatusInfo(selectedJob.status).bg,
                      color: getStatusInfo(selectedJob.status).color,
                    }}
                  >
                    {getStatusInfo(selectedJob.status).label}
                  </span>
                </div>

                <h2 className="jlab-detail-title">{selectedJob.title}</h2>

                <div className="jlab-detail-company">
                  <Building2 size={18} />
                  <span>{selectedJob.company}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="jlab-detail-grid">
                <div className="jlab-detail-info-card">
                  <div className="jlab-detail-info-icon">
                    <DollarSign size={20} />
                  </div>
                  <div className="jlab-detail-info-content">
                    <span className="jlab-detail-info-label">Ngân sách</span>
                    <span className="jlab-detail-info-value">
                      {formatCurrency(
                        selectedJob.budget || selectedJob.maxBudget,
                      )}
                    </span>
                  </div>
                </div>

                {selectedJob.type === "SHORT_TERM" &&
                  selectedJob.proposedPrice && (
                    <div className="jlab-detail-info-card">
                      <div className="jlab-detail-info-icon jlab-detail-info-icon--purple">
                        <Zap size={20} />
                      </div>
                      <div className="jlab-detail-info-content">
                        <span className="jlab-detail-info-label">
                          Giá đề xuất
                        </span>
                        <span className="jlab-detail-info-value">
                          {formatCurrency(selectedJob.proposedPrice)}
                        </span>
                      </div>
                    </div>
                  )}

                <div className="jlab-detail-info-card">
                  <div className="jlab-detail-info-icon jlab-detail-info-icon--green">
                    <Calendar size={20} />
                  </div>
                  <div className="jlab-detail-info-content">
                    <span className="jlab-detail-info-label">
                      Ngày ứng tuyển
                    </span>
                    <span className="jlab-detail-info-value">
                      {formatDate(selectedJob.appliedAt)}
                    </span>
                  </div>
                </div>

                <div className="jlab-detail-info-card">
                  <div className="jlab-detail-info-icon jlab-detail-info-icon--orange">
                    {selectedJob.isRemote ? (
                      <Globe size={20} />
                    ) : (
                      <MapPin size={20} />
                    )}
                  </div>
                  <div className="jlab-detail-info-content">
                    <span className="jlab-detail-info-label">Địa điểm</span>
                    <span className="jlab-detail-info-value">
                      {selectedJob.isRemote
                        ? "Làm việc từ xa"
                        : selectedJob.location || "Liên hệ"}
                    </span>
                  </div>
                </div>

                {selectedJob.proposedDuration && (
                  <div className="jlab-detail-info-card">
                    <div className="jlab-detail-info-icon jlab-detail-info-icon--cyan">
                      <Timer size={20} />
                    </div>
                    <div className="jlab-detail-info-content">
                      <span className="jlab-detail-info-label">
                        Thời gian đề xuất
                      </span>
                      <span className="jlab-detail-info-value">
                        {selectedJob.proposedDuration}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cover Letter Section */}
              {selectedJob.coverLetter && (
                <div className="jlab-detail-section">
                  <h4 className="jlab-detail-section-title">
                    <FileCheck size={18} /> Thư xin việc
                  </h4>
                  <div className="jlab-detail-section-content">
                    {selectedJob.coverLetter}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="jlab-detail-section">
                <h4 className="jlab-detail-section-title">
                  <Clock size={18} /> Lịch sử trạng thái
                </h4>
                <div className="jlab-timeline">
                  <div className="jlab-timeline-item jlab-timeline-item--completed">
                    <div className="jlab-timeline-dot" />
                    <div className="jlab-timeline-content">
                      <span className="jlab-timeline-title">Đã nộp đơn</span>
                      <span className="jlab-timeline-date">
                        {formatDateTime(selectedJob.appliedAt)}
                      </span>
                    </div>
                  </div>
                  {[
                    "REVIEWED",
                    "ACCEPTED",
                    "WORKING",
                    "SUBMITTED",
                    "APPROVED",
                    "COMPLETED",
                    "PAID",
                  ].includes(selectedJob.status) && (
                    <div className="jlab-timeline-item jlab-timeline-item--completed">
                      <div className="jlab-timeline-dot" />
                      <div className="jlab-timeline-content">
                        <span className="jlab-timeline-title">
                          Nhà tuyển dụng đã xem
                        </span>
                        <span className="jlab-timeline-date">-</span>
                      </div>
                    </div>
                  )}
                  {[
                    "ACCEPTED",
                    "WORKING",
                    "SUBMITTED",
                    "APPROVED",
                    "COMPLETED",
                    "PAID",
                  ].includes(selectedJob.status) && (
                    <div className="jlab-timeline-item jlab-timeline-item--completed">
                      <div className="jlab-timeline-dot" />
                      <div className="jlab-timeline-content">
                        <span className="jlab-timeline-title">
                          Được chấp nhận
                        </span>
                        <span className="jlab-timeline-date">-</span>
                      </div>
                    </div>
                  )}
                  {["COMPLETED", "PAID"].includes(selectedJob.status) && (
                    <div className="jlab-timeline-item jlab-timeline-item--completed">
                      <div className="jlab-timeline-dot" />
                      <div className="jlab-timeline-content">
                        <span className="jlab-timeline-title">
                          Hoàn thành công việc
                        </span>
                        <span className="jlab-timeline-date">-</span>
                      </div>
                    </div>
                  )}
                  {selectedJob.status === "REJECTED" && (
                    <div className="jlab-timeline-item jlab-timeline-item--rejected">
                      <div className="jlab-timeline-dot" />
                      <div className="jlab-timeline-content">
                        <span className="jlab-timeline-title">
                          Đơn bị từ chối
                        </span>
                        <span className="jlab-timeline-date">-</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="jlab-modal-footer jlab-modal-footer--actions">
              <button
                className="jlab-btn-mini jlab-btn-mini--secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>

              {["PENDING", "REVIEWED"].includes(selectedJob.status) && (
                <button
                  className="jlab-btn-mini jlab-btn-mini--danger"
                  onClick={() => handleCancelApplication(selectedJob)}
                  disabled={cancelling === selectedJob.id}
                >
                  {cancelling === selectedJob.id ? (
                    <>
                      <RefreshCw size={14} className="jlab-spin" /> Đang hủy...
                    </>
                  ) : (
                    <>
                      <XCircle size={14} /> Hủy đơn
                    </>
                  )}
                </button>
              )}

              {["ACCEPTED", "WORKING"].includes(selectedJob.status) && (
                <button className="jlab-btn-mini jlab-btn-mini--success">
                  <Send size={14} /> Nộp công việc
                </button>
              )}

              {["SUBMITTED", "UNDER_REVIEW"].includes(selectedJob.status) && (
                <button
                  className="jlab-btn-mini jlab-btn-mini--secondary"
                  disabled
                >
                  <Clock size={14} /> Đang chờ duyệt
                </button>
              )}

              {["COMPLETED", "PAID"].includes(selectedJob.status) && (
                <button className="jlab-btn-mini jlab-btn-mini--primary">
                  <Star size={14} /> Đánh giá
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workspace View */}
      {viewMode === "workspace" && (
        <div className="jlab-workspace">
          {workspaceApps.length === 0 ? (
            <div className="jlab-empty">
              <div className="jlab-ws-empty-icon">
                <FolderOpen size={52} />
              </div>
              <h3 className="jlab-empty-title">
                Không có công việc trong khu vực làm việc
              </h3>
              <p className="jlab-empty-text">
                Khi nhà tuyển dụng chấp nhận đơn của bạn, công việc ngắn hạn sẽ
                xuất hiện tại đây.
              </p>
              <button
                className="jlab-btn-mini jlab-btn-mini--primary"
                onClick={handleGoToJobs}
              >
                <Plus size={14} /> Tìm việc ngay
              </button>
            </div>
          ) : (
            <div className="jlab-workspace-layout">
              {/* Job picker panel */}
              <div className="jlab-workspace-sidebar">
                <div className="jlab-ws-sidebar-header">
                  <span className="jlab-ws-sidebar-title">
                    Công việc đang tiến hành
                  </span>
                  <span className="jlab-ws-sidebar-count">
                    {workspaceApps.length}
                  </span>
                </div>
                {workspaceApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={`jlab-workspace-job-item${workspaceSelectedApp?.id === app.id ? " active" : ""}`}
                    onClick={() => handleSelectWorkspaceApp(app)}
                  >
                    <span
                      className="jlab-ws-status-pill"
                      style={{
                        background: getStatusInfo(app.status).bg,
                        color: getStatusInfo(app.status).color,
                      }}
                    >
                      {getStatusInfo(app.status).label}
                    </span>
                    <div className="jlab-workspace-job-item-title">
                      {app.title}
                    </div>
                    <div className="jlab-ws-job-meta">
                      <span>
                        <Building2 size={11} /> {app.company || "—"}
                      </span>
                      <span>
                        <DollarSign size={11} />{" "}
                        {formatCurrency(app.budget || app.maxBudget)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Submission panel */}
              <div className="jlab-workspace-form">
                {!workspaceSelectedApp ? (
                  <div className="jlab-workspace-placeholder">
                    <div className="jlab-ws-placeholder-icon-wrap">
                      <ClipboardList size={44} />
                    </div>
                    <p className="jlab-ws-placeholder-title">
                      Chưa chọn công việc
                    </p>
                    <p className="jlab-ws-placeholder-sub">
                      Chọn một công việc từ danh sách bên trái để soạn báo cáo
                      và nộp bài
                    </p>
                  </div>
                ) : (
                  <div className="jlab-ws-content">
                    {/* Workflow stages */}
                    <div className="jlab-ws-stages">
                      {(
                        [
                          { label: "Được nhận", key: "ACCEPTED" },
                          { label: "Đang thực hiện", key: "WORKING" },
                          { label: "Đã nộp bài", key: "SUBMITTED" },
                          { label: "Hoàn thành", key: "COMPLETED" },
                        ] as { label: string; key: string }[]
                      ).map((step, i) => {
                        const ORDER = [
                          "ACCEPTED",
                          "WORKING",
                          "SUBMITTED",
                          "COMPLETED",
                        ];
                        const cur = ORDER.indexOf(workspaceSelectedApp.status);
                        const done = i < cur;
                        const active = i === cur;
                        return (
                          <React.Fragment key={step.key}>
                            <div
                              className={`jlab-ws-stage${active ? " jlab-ws-stage--active" : ""}${done ? " jlab-ws-stage--done" : ""}`}
                            >
                              <div className="jlab-ws-stage-dot">
                                {done ? (
                                  <CheckCircle size={12} />
                                ) : (
                                  <span>{i + 1}</span>
                                )}
                              </div>
                              <span className="jlab-ws-stage-label">
                                {step.label}
                              </span>
                            </div>
                            {i < 3 && (
                              <div
                                className={`jlab-ws-stage-line${done ? " jlab-ws-stage-line--done" : ""}`}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Job brief */}
                    <div className="jlab-ws-brief">
                      <h3 className="jlab-ws-brief-title">
                        {workspaceSelectedApp.title}
                      </h3>
                      <div className="jlab-ws-brief-chips">
                        <span className="jlab-ws-brief-chip">
                          <Building2 size={12} />{" "}
                          {workspaceSelectedApp.company || "—"}
                        </span>
                        <span className="jlab-ws-brief-chip">
                          <DollarSign size={12} />{" "}
                          {formatCurrency(
                            workspaceSelectedApp.budget ||
                              workspaceSelectedApp.maxBudget,
                          )}
                        </span>
                        {workspaceSelectedApp.proposedDuration && (
                          <span className="jlab-ws-brief-chip">
                            <Timer size={12} />{" "}
                            {workspaceSelectedApp.proposedDuration}
                          </span>
                        )}
                        <span
                          className="jlab-ws-brief-chip jlab-ws-brief-chip--status"
                          style={{
                            background: getStatusInfo(
                              workspaceSelectedApp.status,
                            ).bg,
                            color: getStatusInfo(workspaceSelectedApp.status)
                              .color,
                          }}
                        >
                          {getStatusInfo(workspaceSelectedApp.status).label}
                        </span>
                      </div>
                    </div>

                    {/* Work report section */}
                    <div className="jlab-ws-section">
                      <div className="jlab-ws-section-head">
                        <FileText size={14} />
                        <span>Báo cáo công việc</span>
                        <span className="jlab-ws-required-tag">Bắt buộc</span>
                      </div>
                      <textarea
                        className="jlab-workspace-textarea"
                        placeholder="Mô tả chi tiết công việc đã thực hiện, kết quả đạt được, quy trình xử lý và ghi chú cho nhà tuyển dụng..."
                        value={workNote}
                        onChange={(e) => setWorkNote(e.target.value)}
                        rows={7}
                      />
                      <div className="jlab-ws-char-count">
                        {workNote.length} ký tự
                      </div>
                    </div>

                    {/* Attachments section */}
                    <div className="jlab-ws-section">
                      <div className="jlab-ws-section-head">
                        <Upload size={14} />
                        <span>Tệp đính kèm</span>
                      </div>
                      <label className="jlab-workspace-upload-area">
                        <input
                          type="file"
                          multiple
                          style={{ display: "none" }}
                          onChange={handleFileChange}
                        />
                        <Upload size={20} />
                        <span className="jlab-workspace-upload-text">
                          Kéo &amp; thả tệp vào đây, hoặc nhấp để duyệt
                        </span>
                        <span className="jlab-workspace-upload-hint">
                          PDF, Word, ZIP, hình ảnh — mọi định dạng được hỗ trợ
                        </span>
                      </label>
                      {workFiles.length > 0 && (
                        <div className="jlab-workspace-files-list">
                          {workFiles.map((file, idx) => (
                            <div key={idx} className="jlab-workspace-file-item">
                              <FileCheck size={13} color="#06b6d4" />
                              <span className="jlab-workspace-file-name">
                                {file.name}
                              </span>
                              <span className="jlab-workspace-file-size">
                                {(file.size / 1024).toFixed(0)} KB
                              </span>
                              <button
                                className="jlab-workspace-file-remove"
                                onClick={() => handleRemoveFile(idx)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reference links section */}
                    <div className="jlab-ws-section">
                      <div className="jlab-ws-section-head">
                        <Link size={14} />
                        <span>Đường dẫn tham khảo</span>
                      </div>
                      <div className="jlab-workspace-links">
                        {workLinks.map((link, idx) => (
                          <div key={idx} className="jlab-workspace-link-row">
                            <input
                              type="url"
                              className="jlab-workspace-input"
                              placeholder="https://github.com/... hoặc link demo, portfolio..."
                              value={link}
                              onChange={(e) =>
                                handleLinkChange(idx, e.target.value)
                              }
                            />
                            {workLinks.length > 1 && (
                              <button
                                className="jlab-workspace-file-remove"
                                onClick={() => handleRemoveLink(idx)}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="jlab-ws-link-add-btn"
                          onClick={handleAddLink}
                        >
                          <Plus size={12} /> Thêm đường dẫn
                        </button>
                      </div>
                    </div>

                    {/* Final delivery toggle */}
                    <button
                      type="button"
                      className={`jlab-ws-final-toggle${isFinalSubmission ? " active" : ""}`}
                      onClick={() => setIsFinalSubmission((v) => !v)}
                    >
                      <div
                        className={`jlab-ws-final-check${isFinalSubmission ? " active" : ""}`}
                      >
                        {isFinalSubmission && <CheckCircle size={14} />}
                      </div>
                      <div className="jlab-ws-final-copy">
                        <span className="jlab-ws-final-heading">
                          Bàn giao cuối cùng
                        </span>
                        <span className="jlab-ws-final-desc">
                          Đánh dấu đây là giao hàng hoàn chỉnh — công việc sẽ
                          chuyển sang trạng thái Hoàn thành
                        </span>
                      </div>
                      <BadgeCheck
                        size={18}
                        color={isFinalSubmission ? "#10b981" : "#334155"}
                      />
                    </button>

                    {/* Action bar */}
                    <div className="jlab-ws-action-bar">
                      <div className="jlab-ws-attach-info">
                        {workFiles.length > 0 && (
                          <span className="jlab-ws-attach-chip">
                            <FileCheck size={11} /> {workFiles.length} tệp
                          </span>
                        )}
                        {workLinks.filter((l) => l.trim()).length > 0 && (
                          <span className="jlab-ws-attach-chip">
                            <Link size={11} />{" "}
                            {workLinks.filter((l) => l.trim()).length} link
                          </span>
                        )}
                      </div>
                      <div className="jlab-ws-action-btns">
                        <button
                          type="button"
                          className="jlab-btn-mini jlab-btn-mini--secondary"
                          onClick={() => setWorkspaceSelectedApp(null)}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className={`jlab-ws-submit-btn${isFinalSubmission ? " final" : ""}`}
                          onClick={handleSubmitDeliverables}
                          disabled={submittingWork}
                        >
                          {submittingWork ? (
                            <>
                              <RefreshCw size={14} className="jlab-spin" /> Đang
                              nộp...
                            </>
                          ) : isFinalSubmission ? (
                            <>
                              <Send size={14} /> Nộp bài — Hoàn thành
                            </>
                          ) : (
                            <>
                              <Send size={14} /> Nộp báo cáo
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div
          className="jlab-modal-overlay"
          onClick={() => setShowSubmitModal(false)}
        >
          <div className="jlab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jlab-modal-header">
              <h3 className="jlab-modal-title">Ứng tuyển công việc</h3>
              <button
                className="jlab-modal-close"
                onClick={() => setShowSubmitModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="jlab-modal-body">
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#94a3b8",
                  textAlign: "center",
                  marginBottom: "1rem",
                }}
              >
                Chọn loại công việc bạn muốn ứng tuyển
              </p>
              <div
                style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}
              >
                <button
                  className="jlab-btn-mini jlab-btn-mini--primary"
                  style={{ flex: 1, padding: "2rem", flexDirection: "column" }}
                  onClick={handleGoToJobs}
                >
                  <Briefcase size={32} />
                  <span style={{ marginTop: "0.5rem" }}>Full-time</span>
                </button>
                <button
                  className="jlab-btn-mini jlab-btn-mini--secondary"
                  style={{ flex: 1, padding: "2rem", flexDirection: "column" }}
                  onClick={handleGoToJobs}
                >
                  <Zap size={32} />
                  <span style={{ marginTop: "0.5rem" }}>Gig / Short-term</span>
                </button>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                Bạn sẽ được chuyển đến trang tìm kiếm công việc
              </p>
            </div>
            <div className="jlab-modal-footer">
              <button
                className="jlab-btn-mini jlab-btn-mini--secondary"
                onClick={() => setShowSubmitModal(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ CANCEL APPLICATION MODAL ══════════════ */}
      {cancelModalApp && (
        <div
          className="jlabcm-overlay"
          onClick={() => setCancelModalApp(null)}
        >
          <div
            className="jlabcm-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="jlabcm-title"
          >
            {/* Danger header */}
            <div className="jlabcm-header">
              <div className="jlabcm-header-icon">
                <ShieldAlert size={28} />
              </div>
              <div className="jlabcm-header-copy">
                <h2 id="jlabcm-title" className="jlabcm-title">
                  Xác nhận hủy đơn ứng tuyển
                </h2>
                <p className="jlabcm-subtitle">
                  Hành động này không thể hoàn tác
                </p>
              </div>
              <button
                className="jlabcm-close-btn"
                onClick={() => setCancelModalApp(null)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Job card preview */}
            <div className="jlabcm-job-preview">
              <div className="jlabcm-job-preview-inner">
                <span
                  className={`jlabcm-type-badge jlabcm-type-badge--${cancelModalApp.type === "SHORT_TERM" ? "gig" : "ft"}`}
                >
                  {cancelModalApp.type === "SHORT_TERM" ? "Gig" : "Full-time"}
                </span>
                <h3 className="jlabcm-job-title">{cancelModalApp.title}</h3>
                <div className="jlabcm-job-meta">
                  <span className="jlabcm-job-meta-item">
                    <Building2 size={12} /> {cancelModalApp.company || "—"}
                  </span>
                  <span className="jlabcm-job-meta-item">
                    <DollarSign size={12} />{" "}
                    {formatCurrency(
                      cancelModalApp.budget || cancelModalApp.maxBudget,
                    )}
                  </span>
                  <span
                    className="jlabcm-job-meta-item"
                    style={{ color: getStatusInfo(cancelModalApp.status).color }}
                  >
                    {getStatusInfo(cancelModalApp.status).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning notice */}
            <div className="jlabcm-notice">
              <div className="jlabcm-notice-row">
                <Ban size={14} className="jlabcm-notice-icon jlabcm-notice-icon--red" />
                <span>
                  Sau khi hủy, bạn phải chờ <strong>1 giờ</strong> mới có thể
                  ứng tuyển lại vị trí này.
                </span>
              </div>
              <div className="jlabcm-notice-row">
                <AlertTriangle size={14} className="jlabcm-notice-icon jlabcm-notice-icon--yellow" />
                <span>
                  Nếu ứng tuyển lại, đơn đó sẽ{" "}
                  <strong>không thể hủy thêm lần nữa</strong>.
                </span>
              </div>
            </div>

            {/* Reason selector */}
            <div className="jlabcm-reason-section">
              <label className="jlabcm-reason-label">
                Lý do hủy đơn <span className="jlabcm-reason-required">*</span>
              </label>
              <div className="jlabcm-reasons-grid">
                {[
                  { value: "found_better", label: "Tìm được công việc tốt hơn" },
                  { value: "change_mind", label: "Thay đổi ý định" },
                  { value: "wrong_job", label: "Ứng tuyển nhầm vị trí" },
                  { value: "salary", label: "Mức lương không phù hợp" },
                  { value: "schedule", label: "Lịch làm việc không phù hợp" },
                  { value: "other", label: "Lý do khác..." },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`jlabcm-reason-chip${cancelReason === opt.value ? " selected" : ""}`}
                    onClick={() => setCancelReason(opt.value)}
                  >
                    {cancelReason === opt.value && (
                      <CheckCircle size={13} className="jlabcm-reason-chip-check" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
              {cancelReason === "other" && (
                <textarea
                  className="jlabcm-reason-textarea"
                  placeholder="Nhập lý do cụ thể của bạn..."
                  value={cancelReasonOther}
                  onChange={(e) => setCancelReasonOther(e.target.value)}
                  rows={3}
                  autoFocus
                />
              )}
            </div>

            {/* Footer actions */}
            <div className="jlabcm-footer">
              <button
                type="button"
                className="jlabcm-btn-keep"
                onClick={() => setCancelModalApp(null)}
              >
                Giữ đơn lại
              </button>
              <button
                type="button"
                className="jlabcm-btn-confirm"
                onClick={handleConfirmCancel}
                disabled={
                  !cancelReason ||
                  (cancelReason === "other" && !cancelReasonOther.trim())
                }
              >
                <Ban size={15} />
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TOAST STACK ══════════════ */}
      <div className="jlabtoast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`jlabtoast jlabtoast--${toast.type}`}
          >
            <div className="jlabtoast-icon-wrap">
              {toast.type === "success" && <CheckCircle size={18} />}
              {toast.type === "error" && <XCircle size={18} />}
              {toast.type === "warning" && <AlertTriangle size={18} />}
              {toast.type === "info" && <Clock size={18} />}
            </div>
            <div className="jlabtoast-body">
              <p className="jlabtoast-title">{toast.title}</p>
              <p className="jlabtoast-message">{toast.message}</p>
            </div>
            <button
              className="jlabtoast-dismiss"
              onClick={() => dismissToast(toast.id)}
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
            <div className="jlabtoast-progress" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobLab;
