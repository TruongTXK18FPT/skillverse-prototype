import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  FiSearch,
  FiPlus,
  FiRefreshCw,
  FiZap,
  FiBriefcase,
  FiTrendingUp,
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiUsers,
  FiMapPin,
  FiGlobe,
  FiSliders,
  FiBarChart2,
  FiLayers,
  FiXCircle,
  FiEdit3,
  FiEye,
} from "react-icons/fi";
import { HiLightningBolt } from "react-icons/hi";
import {
  ShortTermJobCard,
  ShortTermJobList,
} from "../../components/short-term-job";
import shortTermJobService from "../../services/shortTermJobService";
import {
  ShortTermJobResponse,
  JobUrgency,
  ShortTermJobFilters,
  ShortTermJobStatus,
} from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import "./JobLab.css";

// ==================== CONSTANTS ====================

const URGENCY_OPTIONS = [
  { value: "", label: "Tất cả mức độ" },
  { value: JobUrgency.NORMAL, label: "Bình thường" },
  { value: JobUrgency.URGENT, label: "Gấp" },
  { value: JobUrgency.VERY_URGENT, label: "Rất gấp" },
  { value: JobUrgency.ASAP, label: "Cần ngay" },
];

const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Mới nhất" },
  { value: "createdAt,asc", label: "Cũ nhất" },
  { value: "budget,desc", label: "Ngân sách cao nhất" },
  { value: "budget,asc", label: "Ngân sách thấp nhất" },
  { value: "applicationDeadline,asc", label: "Sắp hết hạn" },
];

const STATUS_META: Record<
  ShortTermJobStatus,
  { label: string; color: string; bg: string }
> = {
  [ShortTermJobStatus.DRAFT]: {
    label: "Nháp",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.15)",
  },
  [ShortTermJobStatus.PENDING_APPROVAL]: {
    label: "Chờ duyệt",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
  },
  [ShortTermJobStatus.PUBLISHED]: {
    label: "Đang tuyển",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.15)",
  },
  [ShortTermJobStatus.APPLIED]: {
    label: "Có ứng viên",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.15)",
  },
  [ShortTermJobStatus.IN_PROGRESS]: {
    label: "Đang thực hiện",
    color: "#34d399",
    bg: "rgba(52,211,153,0.15)",
  },
  [ShortTermJobStatus.SUBMITTED]: {
    label: "Đã nộp",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.15)",
  },
  [ShortTermJobStatus.UNDER_REVIEW]: {
    label: "Đang review",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.15)",
  },
  [ShortTermJobStatus.APPROVED]: {
    label: "Đã duyệt",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.15)",
  },
  [ShortTermJobStatus.REJECTED]: {
    label: "Bị từ chối",
    color: "#f87171",
    bg: "rgba(248,113,113,0.15)",
  },
  [ShortTermJobStatus.COMPLETED]: {
    label: "Hoàn thành",
    color: "#86efac",
    bg: "rgba(134,239,172,0.15)",
  },
  [ShortTermJobStatus.PAID]: {
    label: "Đã thanh toán",
    color: "#fde68a",
    bg: "rgba(253,230,138,0.15)",
  },
  [ShortTermJobStatus.CANCELLED]: {
    label: "Đã hủy",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.15)",
  },
  [ShortTermJobStatus.CLOSED]: {
    label: "Đã đóng",
    color: "#9ca3af",
    bg: "rgba(156,163,175,0.15)",
  },
  [ShortTermJobStatus.DISPUTED]: {
    label: "Tranh chấp",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.15)",
  },
};

const PIE_COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#f59e0b",
  "#f87171",
  "#60a5fa",
  "#f472b6",
  "#fde68a",
  "#86efac",
  "#fb923c",
  "#6b7280",
  "#4ade80",
  "#94a3b8",
];

const URGENCY_COLORS: Record<string, string> = {
  [JobUrgency.NORMAL]: "#22d3ee",
  [JobUrgency.URGENT]: "#f59e0b",
  [JobUrgency.VERY_URGENT]: "#f87171",
  [JobUrgency.ASAP]: "#ef4444",
};

// Statuses that allow the recruiter to cancel a job
const CANCELLABLE_STATUSES = [
  ShortTermJobStatus.DRAFT,
  ShortTermJobStatus.PENDING_APPROVAL,
  ShortTermJobStatus.PUBLISHED,
  ShortTermJobStatus.APPLIED,
];

// ==================== CUSTOM TOOLTIPS ====================

const CustomPieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { fill: string } }[];
}) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="jlab-chart-tooltip">
        <span style={{ color: d.payload.fill }}>{d.name}</span>
        <b>{d.value} việc</b>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="jlab-chart-tooltip">
        <span className="jlab-chart-tooltip__label">{label}</span>
        <b style={{ color: "#22d3ee" }}>{payload[0].value} việc</b>
      </div>
    );
  }
  return null;
};

// ==================== CANCEL MODAL ====================

interface CancelModalProps {
  job: ShortTermJobResponse;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

const CancelModal: React.FC<CancelModalProps> = ({
  job,
  onConfirm,
  onClose,
  isLoading,
}) => {
  const [reason, setReason] = useState("");
  const PRESET_REASONS = [
    "Đã tìm được ứng viên từ nguồn khác",
    "Thay đổi ngân sách dự án",
    "Dự án bị tạm hoãn hoặc hủy",
    "Yêu cầu công việc đã thay đổi",
    "Lý do nội bộ công ty",
  ];
  return (
    <div className="jlab-modal-overlay" onClick={onClose}>
      <div className="jlab-modal" onClick={(e) => e.stopPropagation()}>
        <div className="jlab-modal__header">
          <div className="jlab-modal__icon jlab-modal__icon--warn">
            <FiAlertTriangle size={22} />
          </div>
          <div>
            <h3 className="jlab-modal__title">Hủy công việc</h3>
            <p className="jlab-modal__subtitle">
              <span className="jlab-modal__job-name">{job.title}</span>
            </p>
          </div>
          <button className="jlab-modal__close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>
        <div className="jlab-modal__body">
          <p className="jlab-modal__desc">
            Công việc sẽ chuyển sang trạng thái <b>Đã hủy</b>. Hành động này
            không thể hoàn tác.
          </p>
          <div className="jlab-modal__presets">
            <p className="jlab-modal__field-label">Lý do nhanh:</p>
            <div className="jlab-modal__preset-chips">
              {PRESET_REASONS.map((r) => (
                <button
                  key={r}
                  className={`jlab-modal__preset-chip${reason === r ? " active" : ""}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="jlab-modal__field">
            <label className="jlab-modal__field-label">
              Hoặc nhập lý do khác:
            </label>
            <textarea
              className="jlab-modal__textarea"
              placeholder="Mô tả lý do hủy công việc (tùy chọn)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="jlab-modal__footer">
          <button
            className="jlab-btn jlab-btn--ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Quay lại
          </button>
          <button
            className="jlab-btn jlab-btn--danger"
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="jlab-spinner" />
            ) : (
              <>
                <FiXCircle size={15} /> Xác nhận hủy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MY JOB CARD ====================

interface MyJobCardProps {
  job: ShortTermJobResponse;
  onCancel: (job: ShortTermJobResponse) => void;
  onEdit: (jobId: number) => void;
  onView: (jobId: number) => void;
}

const MyJobCard: React.FC<MyJobCardProps> = ({
  job,
  onCancel,
  onEdit,
  onView,
}) => {
  const meta = STATUS_META[job.status] ?? STATUS_META[ShortTermJobStatus.DRAFT];
  const canCancel = CANCELLABLE_STATUSES.includes(job.status);
  const budget = job.budget
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(job.budget)
    : "Thỏa thuận";
  const skills: string[] =
    (job as unknown as { skills?: string[]; requiredSkills?: string[] })
      .skills ??
    (job as unknown as { requiredSkills?: string[] }).requiredSkills ??
    [];

  return (
    <div className="jlab-myjob-card">
      <div className="jlab-myjob-card__glow" />
      <div className="jlab-myjob-card__header">
        <div
          className="jlab-myjob-card__status-badge"
          style={{ color: meta.color, background: meta.bg }}
        >
          <span
            className="jlab-myjob-card__status-dot"
            style={{ background: meta.color }}
          />
          {meta.label}
        </div>
        <div className="jlab-myjob-card__urgency" data-urgency={job.urgency}>
          {job.urgency === JobUrgency.ASAP
            ? "🔥 ASAP"
            : job.urgency === JobUrgency.VERY_URGENT
              ? "⚡ Rất gấp"
              : job.urgency === JobUrgency.URGENT
                ? "⏰ Gấp"
                : "📅 Bình thường"}
        </div>
      </div>
      <h3 className="jlab-myjob-card__title">{job.title}</h3>
      <div className="jlab-myjob-card__meta">
        <span>
          <FiDollarSign size={12} /> {budget}
        </span>
        <span>
          <FiUsers size={12} /> {job.applicantCount ?? 0} ứng viên
        </span>
        <span>
          {job.isRemote ? (
            <>
              <FiGlobe size={12} /> Remote
            </>
          ) : (
            <>
              <FiMapPin size={12} /> {job.location ?? "Tại chỗ"}
            </>
          )}
        </span>
      </div>
      {job.deadline && (
        <div className="jlab-myjob-card__deadline">
          <FiClock size={11} />
          Hạn nộp:{" "}
          {new Date(job.deadline).toLocaleDateString("vi-VN")}
        </div>
      )}
      <div className="jlab-myjob-card__skills">
        {skills.slice(0, 3).map((s) => (
          <span key={s} className="jlab-skill-chip">
            {s}
          </span>
        ))}
        {skills.length > 3 && (
          <span className="jlab-skill-chip jlab-skill-chip--more">
            +{skills.length - 3}
          </span>
        )}
      </div>
      <div className="jlab-myjob-card__actions">
        <button
          className="jlab-btn jlab-btn--view"
          onClick={() => onView(job.id)}
        >
          <FiEye size={14} /> Xem
        </button>
        {job.status === ShortTermJobStatus.DRAFT && (
          <button
            className="jlab-btn jlab-btn--edit"
            onClick={() => onEdit(job.id)}
          >
            <FiEdit3 size={14} /> Sửa
          </button>
        )}
        {canCancel && (
          <button
            className="jlab-btn jlab-btn--cancel"
            onClick={() => onCancel(job)}
          >
            <FiXCircle size={14} /> Hủy
          </button>
        )}
      </div>
    </div>
  );
};

// ==================== PAGE COMPONENT ====================

const ShortTermJobListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showInfo, showSuccess } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tabs
  const [activeTab, setActiveTab] = useState<"explore" | "mylab">("explore");

  // Explore state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [jobs, setJobs] = useState<ShortTermJobResponse[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<ShortTermJobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  // My jobs state
  const [myJobs, setMyJobs] = useState<ShortTermJobResponse[]>([]);
  const [myJobsLoading, setMyJobsLoading] = useState(false);
  const [myJobsLoaded, setMyJobsLoaded] = useState(false);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<ShortTermJobResponse | null>(
    null,
  );
  const [isCancelling, setIsCancelling] = useState(false);

  // Filter state
  const [filter, setFilter] = useState<ShortTermJobFilters>({
    search: searchParams.get("keyword") || "",
    urgency: (searchParams.get("urgency") as JobUrgency) || undefined,
    isRemote: searchParams.get("isRemote") === "true" ? true : undefined,
    minBudget: searchParams.get("minBudget")
      ? Number(searchParams.get("minBudget"))
      : undefined,
    maxBudget: searchParams.get("maxBudget")
      ? Number(searchParams.get("maxBudget"))
      : undefined,
    skills: searchParams.get("skills")?.split(",").filter(Boolean) || [],
  });
  const [sort, setSort] = useState(
    searchParams.get("sort") || "createdAt,desc",
  );
  const [searchInput, setSearchInput] = useState(
    searchParams.get("keyword") || "",
  );

  // ========== FETCH ==========
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await shortTermJobService.searchJobs(
        filter,
        currentPage,
        12,
      );
      setJobs(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch {
      showError("Lỗi", "Không thể tải danh sách công việc");
    } finally {
      setIsLoading(false);
    }
  }, [filter, currentPage, showError]);

  const fetchFeaturedJobs = useCallback(async () => {
    try {
      const response = await shortTermJobService.searchJobs(
        { urgency: JobUrgency.URGENT },
        0,
        4,
      );
      setFeaturedJobs(response.content);
    } catch {
      // silent
    }
  }, []);

  const fetchMyJobs = useCallback(async () => {
    setMyJobsLoading(true);
    try {
      const data = await shortTermJobService.getMyJobs();
      setMyJobs(Array.isArray(data) ? data : []);
      setMyJobsLoaded(true);
    } catch {
      showError("Lỗi", "Không thể tải danh sách việc của bạn");
    } finally {
      setMyJobsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  useEffect(() => {
    fetchFeaturedJobs();
  }, [fetchFeaturedJobs]);
  useEffect(() => {
    if (activeTab === "mylab" && !myJobsLoaded) fetchMyJobs();
  }, [activeTab, myJobsLoaded, fetchMyJobs]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.search) params.set("keyword", filter.search);
    if (filter.urgency) params.set("urgency", filter.urgency);
    if (filter.isRemote !== undefined)
      params.set("isRemote", String(filter.isRemote));
    if (filter.minBudget) params.set("minBudget", String(filter.minBudget));
    if (filter.maxBudget) params.set("maxBudget", String(filter.maxBudget));
    if (filter.skills && filter.skills.length > 0)
      params.set("skills", filter.skills.join(","));
    if (sort !== "createdAt,desc") params.set("sort", sort);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sort]);

  // ========== CHART DATA ==========
  const statusChartData = useMemo(() => {
    if (!myJobs.length) return [];
    const counts: Partial<Record<ShortTermJobStatus, number>> = {};
    myJobs.forEach((j) => {
      counts[j.status] = (counts[j.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_META[status as ShortTermJobStatus]?.label ?? status,
      value,
      fill: PIE_COLORS[
        Object.keys(STATUS_META).indexOf(status) % PIE_COLORS.length
      ],
    }));
  }, [myJobs]);

  const urgencyChartData = useMemo(() => {
    if (!myJobs.length) return [];
    const counts: Partial<Record<JobUrgency, number>> = {};
    myJobs.forEach((j) => {
      counts[j.urgency] = (counts[j.urgency] || 0) + 1;
    });
    return [
      {
        name: "Bình thường",
        value: counts[JobUrgency.NORMAL] || 0,
        fill: URGENCY_COLORS[JobUrgency.NORMAL],
      },
      {
        name: "Gấp",
        value: counts[JobUrgency.URGENT] || 0,
        fill: URGENCY_COLORS[JobUrgency.URGENT],
      },
      {
        name: "Rất gấp",
        value: counts[JobUrgency.VERY_URGENT] || 0,
        fill: URGENCY_COLORS[JobUrgency.VERY_URGENT],
      },
      {
        name: "ASAP",
        value: counts[JobUrgency.ASAP] || 0,
        fill: URGENCY_COLORS[JobUrgency.ASAP],
      },
    ].filter((d) => d.value > 0);
  }, [myJobs]);

  const applicantTrendData = useMemo(() => {
    if (myJobs.length < 2) return [];
    const byMonth: Record<
      string,
      { month: string; jobs: number; applicants: number }
    > = {};
    myJobs.forEach((j) => {
      const d = new Date(j.createdAt);
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      if (!byMonth[key]) byMonth[key] = { month: key, jobs: 0, applicants: 0 };
      byMonth[key].jobs++;
      byMonth[key].applicants += j.applicantCount || 0;
    });
    return Object.values(byMonth).slice(-6);
  }, [myJobs]);

  const myStats = useMemo(() => {
    const active = myJobs.filter((j) =>
      [
        ShortTermJobStatus.PUBLISHED,
        ShortTermJobStatus.APPLIED,
        ShortTermJobStatus.IN_PROGRESS,
      ].includes(j.status),
    ).length;
    const completed = myJobs.filter((j) =>
      [ShortTermJobStatus.COMPLETED, ShortTermJobStatus.PAID].includes(
        j.status,
      ),
    ).length;
    const totalApplicants = myJobs.reduce(
      (s, j) => s + (j.applicantCount || 0),
      0,
    );
    const avgBudget = myJobs.length
      ? Math.round(
          myJobs.reduce((s, j) => s + (j.budget || 0), 0) / myJobs.length,
        )
      : 0;
    return {
      total: myJobs.length,
      active,
      completed,
      totalApplicants,
      avgBudget,
    };
  }, [myJobs]);

  // ========== HANDLERS ==========
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter((p) => ({ ...p, search: searchInput }));
    setCurrentPage(0);
  };

  const handleFilterChange = (
    key: keyof ShortTermJobFilters,
    value: unknown,
  ) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setFilter({
      search: "",
      urgency: undefined,
      isRemote: undefined,
      minBudget: undefined,
      maxBudget: undefined,
      skills: [],
    });
    setSearchInput("");
    setSort("createdAt,desc");
    setCurrentPage(0);
  };

  const handleSaveJob = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs((prev) => prev.filter((id) => id !== jobId));
      showInfo("Thông báo", "Đã bỏ lưu");
    } else {
      setSavedJobs((prev) => [...prev, jobId]);
      showSuccess("Thành công", "Đã lưu công việc");
    }
  };

  const handleApply = (jobId: string) => navigate(`/short-term-jobs/${jobId}`);
  const handleViewDetails = (jobId: string) =>
    navigate(`/short-term-jobs/${jobId}`);

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await shortTermJobService.cancelJob(cancelTarget.id, reason || undefined);
      showSuccess("Đã hủy", `Công việc "${cancelTarget.title}" đã được hủy.`);
      setMyJobs((prev) =>
        prev.map((j) =>
          j.id === cancelTarget.id
            ? { ...j, status: ShortTermJobStatus.CANCELLED }
            : j,
        ),
      );
      setCancelTarget(null);
    } catch {
      showError("Lỗi", "Không thể hủy công việc. Vui lòng thử lại.");
    } finally {
      setIsCancelling(false);
    }
  };

  const hasActiveFilters = !!(
    filter.urgency ||
    filter.isRemote !== undefined ||
    filter.minBudget ||
    filter.maxBudget
  );

  // ========== RENDER ==========
  return (
    <div className="jlab-root">
      {/* ── AMBIENT BACKGROUND ── */}
      <div className="jlab-bg">
        <div className="jlab-bg__grid" />
        <div className="jlab-bg__orb jlab-bg__orb--1" />
        <div className="jlab-bg__orb jlab-bg__orb--2" />
        <div className="jlab-bg__orb jlab-bg__orb--3" />
      </div>

      {/* ── HERO ── */}
      <header className="jlab-hero">
        <div className="jlab-hero__badge">
          <HiLightningBolt size={14} />
          <span>FREELANCE &amp; GIG MARKETPLACE</span>
        </div>
        <h1 className="jlab-hero__title">
          <span className="jlab-hero__title-glow">Job</span> Lab
        </h1>
        <p className="jlab-hero__sub">
          Khám phá cơ hội freelance — đăng &amp; quản lý công việc ngắn hạn của
          bạn
        </p>

        {/* ── GLOBAL STATS BAR ── */}
        <div className="jlab-stats-bar">
          <div className="jlab-stat-pill">
            <FiBriefcase size={14} />
            <span className="jlab-stat-pill__num">
              {totalElements.toLocaleString()}
            </span>
            <span className="jlab-stat-pill__lbl">Công việc</span>
          </div>
          <div className="jlab-stat-pill jlab-stat-pill--warn">
            <FiZap size={14} />
            <span className="jlab-stat-pill__num">{featuredJobs.length}</span>
            <span className="jlab-stat-pill__lbl">Việc gấp</span>
          </div>
          <div className="jlab-stat-pill jlab-stat-pill--purple">
            <FiTrendingUp size={14} />
            <span className="jlab-stat-pill__num">
              {jobs.filter((j) => j.isRemote).length}
            </span>
            <span className="jlab-stat-pill__lbl">Remote</span>
          </div>
          {myStats.total > 0 && (
            <div className="jlab-stat-pill jlab-stat-pill--green">
              <FiLayers size={14} />
              <span className="jlab-stat-pill__num">{myStats.total}</span>
              <span className="jlab-stat-pill__lbl">Việc của tôi</span>
            </div>
          )}
        </div>
      </header>

      {/* ── TABS ── */}
      <div className="jlab-tabs">
        <button
          className={`jlab-tab${activeTab === "explore" ? " jlab-tab--active" : ""}`}
          onClick={() => setActiveTab("explore")}
        >
          <FiSearch size={15} /> Khám phá
        </button>
        <button
          className={`jlab-tab${activeTab === "mylab" ? " jlab-tab--active" : ""}`}
          onClick={() => setActiveTab("mylab")}
        >
          <FiBarChart2 size={15} /> Lab của tôi
          {myStats.total > 0 && (
            <span className="jlab-tab__badge">{myStats.total}</span>
          )}
        </button>
        <div className="jlab-tabs__actions">
          <button
            className="jlab-btn jlab-btn--primary"
            onClick={() => navigate("/short-term-jobs/create")}
          >
            <FiPlus size={15} /> Đăng công việc
          </button>
        </div>
      </div>

      {/* ── EXPLORE TAB ── */}
      {activeTab === "explore" && (
        <div className="jlab-panel">
          {/* Search Row */}
          <form onSubmit={handleSearch} className="jlab-search-row">
            <div className="jlab-search-input-wrap">
              <FiSearch size={16} className="jlab-search-input-wrap__icon" />
              <input
                className="jlab-input jlab-input--search"
                placeholder="Tìm kiếm theo tên, kỹ năng, mô tả..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select
              className="jlab-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="jlab-select"
              value={filter.urgency || ""}
              onChange={(e) =>
                handleFilterChange("urgency", e.target.value || undefined)
              }
            >
              {URGENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`jlab-btn jlab-btn--filter${isFilterOpen ? " active" : ""}`}
              onClick={() => setIsFilterOpen((p) => !p)}
            >
              <FiSliders size={15} /> Bộ lọc{" "}
              {hasActiveFilters && <span className="jlab-btn__dot" />}
            </button>
            <button type="submit" className="jlab-btn jlab-btn--search">
              <FiSearch size={15} /> Tìm kiếm
            </button>
          </form>

          {/* Advanced Filter Panel */}
          {isFilterOpen && (
            <div className="jlab-filter-drawer">
              <div className="jlab-filter-section">
                <p className="jlab-filter-label">Hình thức làm việc</p>
                <div className="jlab-filter-chips">
                  <label
                    className={`jlab-filter-chip${filter.isRemote === true ? " active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={filter.isRemote === true}
                      onChange={(e) =>
                        handleFilterChange(
                          "isRemote",
                          e.target.checked ? true : undefined,
                        )
                      }
                    />
                    🌐 Remote
                  </label>
                  <label
                    className={`jlab-filter-chip${filter.isRemote === false ? " active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={filter.isRemote === false}
                      onChange={(e) =>
                        handleFilterChange(
                          "isRemote",
                          e.target.checked ? false : undefined,
                        )
                      }
                    />
                    📍 Tại chỗ
                  </label>
                </div>
              </div>
              <div className="jlab-filter-section">
                <p className="jlab-filter-label">Ngân sách nhanh</p>
                <div className="jlab-filter-chips">
                  {[
                    { label: "💵 Dưới 1 triệu", min: 0, max: 1000000 },
                    { label: "💰 1–5 triệu", min: 1000000, max: 5000000 },
                    { label: "💎 5–10 triệu", min: 5000000, max: 10000000 },
                    {
                      label: "🏆 Trên 10 triệu",
                      min: 10000000,
                      max: undefined,
                    },
                  ].map((opt) => {
                    const isActive =
                      filter.minBudget === opt.min &&
                      filter.maxBudget === opt.max;
                    return (
                      <label
                        key={opt.label}
                        className={`jlab-filter-chip${isActive ? " active" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => {
                            if (e.target.checked)
                              setFilter((p) => ({
                                ...p,
                                minBudget: opt.min,
                                maxBudget: opt.max,
                              }));
                            else
                              setFilter((p) => ({
                                ...p,
                                minBudget: undefined,
                                maxBudget: undefined,
                              }));
                          }}
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="jlab-filter-section">
                <p className="jlab-filter-label">Ngân sách tùy chỉnh (VND)</p>
                <div className="jlab-filter-range">
                  <input
                    type="number"
                    className="jlab-input"
                    placeholder="Từ"
                    value={filter.minBudget || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "minBudget",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                  <span className="jlab-filter-range__sep">—</span>
                  <input
                    type="number"
                    className="jlab-input"
                    placeholder="Đến"
                    value={filter.maxBudget || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "maxBudget",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </div>
              </div>
              <div className="jlab-filter-actions">
                <button
                  className="jlab-btn jlab-btn--ghost"
                  onClick={handleClearFilters}
                >
                  <FiX size={14} /> Xóa bộ lọc
                </button>
                <button
                  className="jlab-btn jlab-btn--primary"
                  onClick={() => setIsFilterOpen(false)}
                >
                  <FiCheckCircle size={14} /> Áp dụng
                </button>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="jlab-active-filters">
              <span className="jlab-active-filters__label">Lọc:</span>
              {filter.urgency && (
                <span className="jlab-active-chip">
                  {
                    URGENCY_OPTIONS.find((u) => u.value === filter.urgency)
                      ?.label
                  }
                  <button
                    onClick={() => handleFilterChange("urgency", undefined)}
                  >
                    <FiX size={10} />
                  </button>
                </span>
              )}
              {filter.isRemote !== undefined && (
                <span className="jlab-active-chip">
                  {filter.isRemote ? "🌐 Remote" : "📍 Tại chỗ"}
                  <button
                    onClick={() => handleFilterChange("isRemote", undefined)}
                  >
                    <FiX size={10} />
                  </button>
                </span>
              )}
              {(filter.minBudget !== undefined ||
                filter.maxBudget !== undefined) && (
                <span className="jlab-active-chip">
                  💰 {filter.minBudget?.toLocaleString()} –{" "}
                  {filter.maxBudget?.toLocaleString()} VND
                  <button
                    onClick={() => {
                      handleFilterChange("minBudget", undefined);
                      handleFilterChange("maxBudget", undefined);
                    }}
                  >
                    <FiX size={10} />
                  </button>
                </span>
              )}
              <button
                className="jlab-btn jlab-btn--ghost jlab-btn--xs"
                onClick={handleClearFilters}
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Featured Jobs */}
          {featuredJobs.length > 0 && currentPage === 0 && !filter.search && (
            <div className="jlab-section">
              <div className="jlab-section__header">
                <h2 className="jlab-section__title">
                  <span className="jlab-section__title-icon">🔥</span> Công việc
                  gấp — Ứng tuyển ngay
                </h2>
              </div>
              <div className="jlab-featured-grid">
                {featuredJobs.map((job) => (
                  <ShortTermJobCard
                    key={job.id}
                    job={job}
                    variant="featured"
                    onApply={handleApply}
                    onSave={handleSaveJob}
                    onViewDetails={handleViewDetails}
                    isSaved={savedJobs.includes(String(job.id))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Results header */}
          <div className="jlab-results-header">
            <p className="jlab-results-header__count">
              Tìm thấy <strong>{totalElements.toLocaleString()}</strong> công
              việc
            </p>
            <button
              className="jlab-btn jlab-btn--ghost jlab-btn--sm"
              onClick={fetchJobs}
              disabled={isLoading}
            >
              <FiRefreshCw size={13} className={isLoading ? "jlab-spin" : ""} />{" "}
              Làm mới
            </button>
          </div>

          {/* Job Listings */}
          {isLoading ? (
            <div className="jlab-loading">
              <div className="jlab-loading__ring" />
              <p>Đang tải danh sách...</p>
            </div>
          ) : (
            <>
              <ShortTermJobList
                jobs={jobs}
                onApply={handleApply}
                onSave={handleSaveJob}
                onViewDetails={handleViewDetails}
                savedJobs={savedJobs}
                columns={3}
                emptyMessage="Không tìm thấy công việc nào phù hợp"
              />
              {totalPages > 1 && (
                <div className="jlab-pagination">
                  <button
                    className="jlab-page-btn"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    ← Trước
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      currentPage < 3
                        ? i
                        : currentPage > totalPages - 3
                          ? totalPages - 5 + i
                          : currentPage - 2 + i;
                    if (pageNum < 0 || pageNum >= totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        className={`jlab-page-btn${currentPage === pageNum ? " active" : ""}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    className="jlab-page-btn"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MY LAB TAB ── */}
      {activeTab === "mylab" && (
        <div className="jlab-panel jlab-panel--lab">
          {myJobsLoading ? (
            <div className="jlab-loading">
              <div className="jlab-loading__ring" />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="jlab-my-stats">
                <div className="jlab-my-stat jlab-my-stat--blue">
                  <div className="jlab-my-stat__icon">
                    <FiBriefcase size={20} />
                  </div>
                  <div className="jlab-my-stat__body">
                    <span className="jlab-my-stat__num">{myStats.total}</span>
                    <span className="jlab-my-stat__lbl">Tổng công việc</span>
                  </div>
                </div>
                <div className="jlab-my-stat jlab-my-stat--cyan">
                  <div className="jlab-my-stat__icon">
                    <FiZap size={20} />
                  </div>
                  <div className="jlab-my-stat__body">
                    <span className="jlab-my-stat__num">{myStats.active}</span>
                    <span className="jlab-my-stat__lbl">Đang hoạt động</span>
                  </div>
                </div>
                <div className="jlab-my-stat jlab-my-stat--green">
                  <div className="jlab-my-stat__icon">
                    <FiCheckCircle size={20} />
                  </div>
                  <div className="jlab-my-stat__body">
                    <span className="jlab-my-stat__num">
                      {myStats.completed}
                    </span>
                    <span className="jlab-my-stat__lbl">Hoàn thành</span>
                  </div>
                </div>
                <div className="jlab-my-stat jlab-my-stat--purple">
                  <div className="jlab-my-stat__icon">
                    <FiUsers size={20} />
                  </div>
                  <div className="jlab-my-stat__body">
                    <span className="jlab-my-stat__num">
                      {myStats.totalApplicants}
                    </span>
                    <span className="jlab-my-stat__lbl">Tổng ứng viên</span>
                  </div>
                </div>
                <div className="jlab-my-stat jlab-my-stat--amber">
                  <div className="jlab-my-stat__icon">
                    <FiDollarSign size={20} />
                  </div>
                  <div className="jlab-my-stat__body">
                    <span className="jlab-my-stat__num">
                      {myStats.avgBudget
                        ? `${(myStats.avgBudget / 1e6).toFixed(1)}M`
                        : "—"}
                    </span>
                    <span className="jlab-my-stat__lbl">Ngân sách TB</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              {myJobs.length > 0 && (
                <div className="jlab-charts">
                  {/* Donut – Status */}
                  <div className="jlab-chart-card">
                    <h3 className="jlab-chart-card__title">
                      <FiLayers size={14} /> Phân bố trạng thái
                    </h3>
                    {statusChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="42%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {statusChartData.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={entry.fill}
                                stroke="rgba(0,0,0,0.3)"
                                strokeWidth={1}
                              />
                            ))}
                          </Pie>
                          <RTooltip content={<CustomPieTooltip />} />
                          <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="jlab-chart-empty">Chưa có dữ liệu</div>
                    )}
                  </div>

                  {/* Bar – Urgency */}
                  <div className="jlab-chart-card">
                    <h3 className="jlab-chart-card__title">
                      <FiZap size={14} /> Phân bố mức độ gấp
                    </h3>
                    {urgencyChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={urgencyChartData} barSize={32}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.06)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <RTooltip content={<CustomBarTooltip />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {urgencyChartData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="jlab-chart-empty">Chưa có dữ liệu</div>
                    )}
                  </div>

                  {/* Area – Trend */}
                  <div className="jlab-chart-card jlab-chart-card--wide">
                    <h3 className="jlab-chart-card__title">
                      <FiTrendingUp size={14} /> Xu hướng đăng tuyển &amp; ứng
                      viên
                    </h3>
                    {applicantTrendData.length > 1 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={applicantTrendData}>
                          <defs>
                            <linearGradient
                              id="grad-jobs"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#22d3ee"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#22d3ee"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="grad-apps"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#a78bfa"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#a78bfa"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <RTooltip
                            contentStyle={{
                              background: "#0f172a",
                              border: "1px solid #1e293b",
                              borderRadius: 8,
                              color: "#e2e8f0",
                              fontSize: 12,
                            }}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="jobs"
                            name="Công việc"
                            stroke="#22d3ee"
                            strokeWidth={2}
                            fill="url(#grad-jobs)"
                            dot={{ fill: "#22d3ee", r: 3 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="applicants"
                            name="Ứng viên"
                            stroke="#a78bfa"
                            strokeWidth={2}
                            fill="url(#grad-apps)"
                            dot={{ fill: "#a78bfa", r: 3 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="jlab-chart-empty">
                        Cần ít nhất 2 tháng dữ liệu để hiển thị xu hướng
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* My Job List */}
              <div className="jlab-section">
                <div className="jlab-section__header">
                  <h2 className="jlab-section__title">
                    <FiBriefcase size={16} /> Danh sách công việc của tôi
                  </h2>
                  <button
                    className="jlab-btn jlab-btn--ghost jlab-btn--sm"
                    onClick={() => {
                      setMyJobsLoaded(false);
                      fetchMyJobs();
                    }}
                    disabled={myJobsLoading}
                  >
                    <FiRefreshCw
                      size={13}
                      className={myJobsLoading ? "jlab-spin" : ""}
                    />{" "}
                    Làm mới
                  </button>
                </div>

                {myJobs.length === 0 ? (
                  <div className="jlab-empty">
                    <FiBriefcase size={48} />
                    <h3>Bạn chưa có công việc nào</h3>
                    <p>Đăng công việc đầu tiên để bắt đầu tuyển dụng</p>
                    <button
                      className="jlab-btn jlab-btn--primary"
                      onClick={() => navigate("/short-term-jobs/create")}
                    >
                      <FiPlus size={14} /> Đăng công việc
                    </button>
                  </div>
                ) : (
                  <div className="jlab-myjob-grid">
                    {myJobs.map((job) => (
                      <MyJobCard
                        key={job.id}
                        job={job}
                        onCancel={setCancelTarget}
                        onEdit={(id) => navigate(`/short-term-jobs/${id}/edit`)}
                        onView={(id) => navigate(`/short-term-jobs/${id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CANCEL MODAL ── */}
      {cancelTarget && (
        <CancelModal
          job={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => !isCancelling && setCancelTarget(null)}
          isLoading={isCancelling}
        />
      )}
    </div>
  );
};

export default ShortTermJobListPage;
