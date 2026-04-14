import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import ReactDOM from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  RefreshCw,
  ShieldOff,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  ChevronRight,
  PieChart,
  Award,
  Target,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  listPendingCourses,
  approveCourse,
  rejectCourse,
  suspendCourse,
  restoreCourse,
  getCourse,
  listAllCoursesAdmin,
  getAdminCourseStats,
  CourseStatsResponse,
  listAdminCourseRevisions,
  approveCourseRevision,
  rejectCourseRevision,
  CourseRevisionDTO,
} from "../../services/courseService";
import adminUserService from "../../services/adminUserService";
import {
  CourseDetailDTO,
  CourseSummaryDTO,
  CourseStatus,
} from "../../data/courseDTOs";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import Pagination from "../shared/Pagination";
import Toast from "../shared/Toast";
import {
  getAutoUpgradeOutcomeClass,
  getAutoUpgradeOutcomeLabel,
  mapReasonCodeToVietnameseMessage,
} from "../../utils/courseRevisionMessages";
import "./AdminCourseHub.css";

// ==================== TYPES ====================
type ViewMode = "overview" | "analytics" | "courses";
type StatusFilterTab = "ALL" | "PENDING" | "PUBLIC" | "REJECTED" | "SUSPENDED";

type DatePreset =
  | "7days"
  | "30days"
  | "90days"
  | "thisMonth"
  | "thisYear"
  | "custom";

const PRESET_LABELS: Record<DatePreset, string> = {
  "7days": "7 Ngày",
  "30days": "30 Ngày",
  "90days": "90 Ngày",
  thisMonth: "Tháng Này",
  thisYear: "Năm Nay",
  custom: "Tùy Chỉnh",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#fbbf24",
  PUBLIC: "#00d2ff",
  REJECTED: "#ef4444",
  SUSPENDED: "#f97316",
  DRAFT: "#a78bfa",
  ARCHIVED: "#6b7280",
};

const STATUS_TAB_CONFIG: {
  key: StatusFilterTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: "ALL", label: "Tất Cả", icon: <BarChart3 size={16} /> },
  { key: "PENDING", label: "Chờ Duyệt", icon: <Clock size={16} /> },
  { key: "PUBLIC", label: "Đã Duyệt", icon: <CheckCircle size={16} /> },
  { key: "REJECTED", label: "Từ Chối", icon: <XCircle size={16} /> },
  { key: "SUSPENDED", label: "Tạm Khóa", icon: <ShieldOff size={16} /> },
];

// ==================== FORMATTERS ====================
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  UNKNOWN: "N/A",
};

type CourseSummaryWithCompletion = CourseSummaryDTO & {
  completedCount?: number;
};

const normalizeCourseLevel = (level?: string | null): string => {
  if (!level) return "UNKNOWN";

  const normalized = level
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "");

  if (!normalized) return "UNKNOWN";
  if (
    normalized.includes("BEGINNER") ||
    normalized.includes("BEGINER") ||
    normalized.includes("BASIC") ||
    normalized.includes("COBAN")
  ) {
    return "BEGINNER";
  }
  if (
    normalized.includes("INTERMEDIATE") ||
    normalized.includes("MEDIATE") ||
    normalized.includes("TRUNGCAP") ||
    normalized.includes("TRUNGBINH")
  ) {
    return "INTERMEDIATE";
  }
  if (normalized.includes("ADVANCED") || normalized.includes("NANGCAO")) {
    return "ADVANCED";
  }
  return "UNKNOWN";
};

const formatCourseLevelLabel = (level: string) =>
  LEVEL_LABELS[level] || LEVEL_LABELS.UNKNOWN;

const getCourseCompletedCount = (course: CourseSummaryDTO): number => {
  const raw = (course as CourseSummaryWithCompletion).completedCount;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) return 0;
  return Math.floor(raw);
};

// Format VND for chart axis — shows actual readable values
const formatVND = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
};

const formatVNDCompact = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
};

const toInputDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getPresetDates = (preset: Exclude<DatePreset, "custom">) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (preset === "7days") start.setDate(start.getDate() - 6);
  if (preset === "30days") start.setDate(start.getDate() - 29);
  if (preset === "90days") start.setDate(start.getDate() - 89);
  if (preset === "thisMonth") start.setDate(1);
  if (preset === "thisYear") {
    start.setMonth(0);
    start.setDate(1);
  }
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPeriodMeta = (date: Date) => ({
  label: `T${date.getMonth() + 1}`,
  fullLabel: new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(date),
  year: date.getFullYear(),
});

const buildDonutGradient = (items: { value: number; tone: string }[]) => {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return "conic-gradient(rgba(0, 210, 255, 0.1) 0deg 360deg)";
  let current = 0;
  const slices = items.map((item) => {
    const start = current;
    current += (item.value / total) * 360;
    return `${item.tone} ${start}deg ${current}deg`;
  });
  return `conic-gradient(${slices.join(", ")})`;
};

// Custom tooltip for recharts with neon style
const CustomTooltip = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  unit,
}: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: "rgba(0, 15, 35, 0.95)",
        border: "1px solid rgba(0, 210, 255, 0.3)",
        borderRadius: 10,
        padding: "0.625rem 0.875rem",
        fontSize: "0.8rem",
        color: "#e0f2fe",
        boxShadow: "0 4px 20px rgba(0, 210, 255, 0.15)",
      }}
    >
      {labelFormatter && (
        <div
          style={{
            color: "rgba(0, 210, 255, 0.6)",
            fontSize: "0.72rem",
            marginBottom: 4,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {labelFormatter(label)}
        </div>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
            }}
          />
          <span style={{ color: "rgba(0, 210, 255, 0.6)" }}>{p.name}: </span>
          <span style={{ fontWeight: 700 }}>
            {formatter ? formatter(p.value) : p.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

// ==================== COMPONENT ====================
export const AdminCourseHub: React.FC = () => {
  const { user } = useAuth();
  const {
    toast,
    isVisible,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("overview");

  // Course list state
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailDTO | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "suspend" | "restore"
  >("approve");
  const [actionReason, setActionReason] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusFilterTab>("PENDING");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stats & analytics
  const [stats, setStats] = useState<CourseStatsResponse>({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalSuspended: 0,
    totalDraft: 0,
    totalArchived: 0,
    totalAll: 0,
  });
  const [analyticsDatePreset, setAnalyticsDatePreset] =
    useState<DatePreset>("thisYear");
  const analyticsPresetInit = getPresetDates("thisYear");
  const [analyticsStartDate, setAnalyticsStartDate] = useState(
    analyticsPresetInit.startDate,
  );
  const [analyticsEndDate, setAnalyticsEndDate] = useState(
    analyticsPresetInit.endDate,
  );
  const [allCoursesForAnalytics, setAllCoursesForAnalytics] = useState<
    CourseSummaryDTO[]
  >([]);
  const [totalSystemUsers, setTotalSystemUsers] = useState(0);

  // Revision queue
  const [revisionQueue, setRevisionQueue] = useState<CourseRevisionDTO[]>([]);
  const [revisionCourseMeta, setRevisionCourseMeta] = useState<
    Record<number, { title: string; authorName: string; thumbnailUrl?: string }>
  >({});
  const [revisionQueueLoading, setRevisionQueueLoading] = useState(false);
  const [revisionActionLoading, setRevisionActionLoading] = useState(false);
  const [revisionApproveResults, setRevisionApproveResults] = useState<
    Record<number, CourseRevisionDTO>
  >({});
  const [showRevisionRejectModal, setShowRevisionRejectModal] = useState(false);
  const [selectedRevisionForReject, setSelectedRevisionForReject] =
    useState<CourseRevisionDTO | null>(null);
  const [revisionRejectReason, setRevisionRejectReason] = useState("");

  // ==================== HELPERS ====================
  const getApiErrorMessage = useCallback(
    (error: unknown, fallbackMessage: string) => {
      const responseData = (error as { response?: { data?: unknown } })
        ?.response?.data;
      if (typeof responseData === "string" && responseData.trim())
        return responseData;
      if (responseData && typeof responseData === "object") {
        const obj = responseData as { message?: string; error?: string };
        if (obj.message?.trim()) return obj.message;
        if (obj.error?.trim()) return obj.error;
      }
      if (error instanceof Error && error.message.trim()) return error.message;
      return fallbackMessage;
    },
    [],
  );

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("vi-VN");

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case "PENDING":
        return "Chờ duyệt";
      case "PUBLIC":
        return "Đã duyệt";
      case "DRAFT":
        return "Nháp";
      case "ARCHIVED":
        return "Lưu trữ";
      case "REJECTED":
        return "Từ chối";
      case "SUSPENDED":
        return "Tạm khóa";
      default:
        return status || "N/A";
    }
  };

  // ==================== API LOADERS ====================
  const loadStats = useCallback(async () => {
    try {
      const data = await getAdminCourseStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading course stats:", error);
    }
  }, []);

  const loadTotalSystemUsers = useCallback(async () => {
    try {
      const response = await adminUserService.getAllUsers();
      const total =
        (response as any)?.totalUsers ||
        (response as any)?.totalElements ||
        (Array.isArray(response) ? response.length : 0);
      setTotalSystemUsers(total || 0);
    } catch {
      setTotalSystemUsers(0);
    }
  }, []);

  const loadRevisionQueue = useCallback(async () => {
    try {
      setRevisionQueueLoading(true);
      const response = await listAdminCourseRevisions(0, 20, "PENDING");
      const queue = response.content ?? [];
      setRevisionQueue(queue);

      const uniqueCourseIds = Array.from(
        new Set(queue.map((item) => item.courseId)),
      );
      const metaEntries = await Promise.all(
        uniqueCourseIds.map(async (courseId) => {
          try {
            const course = await getCourse(courseId);
            return [
              courseId,
              {
                title: course.title || `Course #${courseId}`,
                authorName: course.authorName || "N/A",
                thumbnailUrl: course.thumbnailUrl,
              },
            ] as const;
          } catch {
            return [
              courseId,
              {
                title: `Course #${courseId}`,
                authorName: "N/A",
                thumbnailUrl: undefined,
              },
            ] as const;
          }
        }),
      );
      setRevisionCourseMeta(Object.fromEntries(metaEntries));
    } catch (error) {
      console.error("Error loading revision queue:", error);
      showError("Lỗi", "Không thể tải danh sách revision chờ duyệt");
    } finally {
      setRevisionQueueLoading(false);
    }
  }, [showError]);

  const loadCourses = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const search = debouncedSearch.trim() || undefined;
      let response;
      if (activeTab === "PENDING" && !search) {
        response = await listPendingCourses(currentPage - 1, itemsPerPage);
      } else if (activeTab === "ALL") {
        response = await listAllCoursesAdmin(
          currentPage - 1,
          itemsPerPage,
          undefined,
          search,
        );
      } else {
        response = await listAllCoursesAdmin(
          currentPage - 1,
          itemsPerPage,
          activeTab,
          search,
        );
      }
      setCourses(response.content);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Error loading courses:", error);
      showError("Lỗi", "Không thể tải danh sách khóa học");
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, activeTab, debouncedSearch, showError]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, coursesPage] = await Promise.all([
        getAdminCourseStats(),
        listAllCoursesAdmin(0, 500),
      ]);
      setStats(statsData);
      setAllCoursesForAnalytics(coursesPage.content || []);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (user) {
      void loadStats();
      void loadRevisionQueue();
      void loadTotalSystemUsers();
      if (viewMode === "courses") void loadCourses();
    }
  }, [user, loadStats, loadRevisionQueue, loadTotalSystemUsers, viewMode]);

  useEffect(() => {
    if (viewMode === "courses") {
      void loadCourses();
    } else if (viewMode === "analytics") {
      void loadAnalyticsData();
    }
  }, [
    currentPage,
    activeTab,
    debouncedSearch,
    viewMode,
    loadCourses,
    loadAnalyticsData,
  ]);

  useEffect(() => {
    const requestedStatus = (
      searchParams.get("status") || "PENDING"
    ).toUpperCase();
    if (
      ["ALL", "PENDING", "PUBLIC", "REJECTED", "SUSPENDED"].includes(
        requestedStatus,
      )
    ) {
      setActiveTab(requestedStatus as StatusFilterTab);
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (showActionModal || showRevisionRejectModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showActionModal, showRevisionRejectModal]);

  // ==================== ANALYTICS COMPUTATIONS ====================
  const analyticsSafeStart =
    analyticsStartDate <= analyticsEndDate
      ? analyticsStartDate
      : analyticsEndDate;
  const analyticsSafeEnd =
    analyticsEndDate >= analyticsStartDate
      ? analyticsEndDate
      : analyticsStartDate;

  const filteredAnalyticsCourses = useMemo(() => {
    return allCoursesForAnalytics.filter((course) => {
      const createdAt = parseDate(course.createdAt);
      if (!createdAt) return false;
      const start = new Date(analyticsSafeStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(analyticsSafeEnd);
      end.setHours(23, 59, 59, 999);
      return createdAt >= start && createdAt <= end;
    });
  }, [allCoursesForAnalytics, analyticsSafeStart, analyticsSafeEnd]);

  const publicAnalyticsCourses = useMemo(
    () => filteredAnalyticsCourses.filter((c) => c.status === "PUBLIC"),
    [filteredAnalyticsCourses],
  );

  const totalEnrollment = useMemo(
    () =>
      filteredAnalyticsCourses.reduce(
        (sum, c) => sum + (c.enrollmentCount ?? 0),
        0,
      ),
    [filteredAnalyticsCourses],
  );

  // Real revenue — sum of actual course price * enrollment count for PUBLIC courses
  const totalRevenue = useMemo(() => {
    return filteredAnalyticsCourses
      .filter((c) => c.status === "PUBLIC")
      .reduce((sum, c) => {
        const price = c.price ? Number(c.price) : 0;
        const enrollments = c.enrollmentCount ?? 0;
        return sum + price * enrollments;
      }, 0);
  }, [filteredAnalyticsCourses]);

  const avgCompletionRate = useMemo(() => {
    const withEnrollment = publicAnalyticsCourses.filter(
      (c) => (c.enrollmentCount ?? 0) > 0,
    );
    if (withEnrollment.length === 0) return 0;
    const totalRate = withEnrollment.reduce((sum, c) => {
      const enrolled = c.enrollmentCount ?? 0;
      const completed = getCourseCompletedCount(c);
      return sum + completed / enrolled;
    }, 0);
    return (totalRate / withEnrollment.length) * 100;
  }, [publicAnalyticsCourses]);

  // Enrollment participation ratio (enrolled vs total system users)
  const enrollmentParticipationRatio = useMemo(() => {
    if (totalSystemUsers <= 0) return 0;
    return (totalEnrollment / totalSystemUsers) * 100;
  }, [totalEnrollment, totalSystemUsers]);

  const statusDistribution = useMemo(
    () => [
      {
        label: "Chờ duyệt",
        value: stats.totalPending,
        tone: STATUS_COLORS.PENDING,
      },
      {
        label: "Đã duyệt",
        value: stats.totalApproved,
        tone: STATUS_COLORS.PUBLIC,
      },
      {
        label: "Bị từ chối",
        value: stats.totalRejected,
        tone: STATUS_COLORS.REJECTED,
      },
      {
        label: "Tạm khóa",
        value: stats.totalSuspended,
        tone: STATUS_COLORS.SUSPENDED,
      },
      { label: "Bản nháp", value: stats.totalDraft, tone: STATUS_COLORS.DRAFT },
      {
        label: "Lưu trữ",
        value: stats.totalArchived,
        tone: STATUS_COLORS.ARCHIVED,
      },
    ],
    [stats],
  );

  const categoryRevenue = useMemo(() => {
    const map = new Map<
      string,
      { revenue: number; count: number; enrollment: number }
    >();
    filteredAnalyticsCourses.forEach((course) => {
      if (course.status !== "PUBLIC") return;
      const cat = course.category || "Khác";
      const existing = map.get(cat) || { revenue: 0, count: 0, enrollment: 0 };
      const price = course.price ? Number(course.price) : 0;
      existing.revenue += price * (course.enrollmentCount ?? 0);
      existing.count += 1;
      existing.enrollment += course.enrollmentCount ?? 0;
      map.set(cat, existing);
    });
    return Array.from(map.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filteredAnalyticsCourses]);

  // Revenue trend — monthly, uses actual course prices
  const revenueTrend = useMemo(() => {
    const months: {
      label: string;
      fullLabel: string;
      revenue: number;
      courses: number;
    }[] = [];
    const now = new Date();
    // Show 12 months for yearly view
    const monthCount = analyticsDatePreset === "thisYear" ? 12 : 6;
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const { label, fullLabel } = getPeriodMeta(d);
      const monthCourses = filteredAnalyticsCourses.filter((c) => {
        const created = parseDate(c.createdAt);
        return (
          created &&
          created.getFullYear() === d.getFullYear() &&
          created.getMonth() === d.getMonth()
        );
      });
      // Revenue for this month = sum of (course price * enrollment) for courses created in this month
      const monthRevenue = monthCourses.reduce((sum, c) => {
        const price = c.price ? Number(c.price) : 0;
        return sum + price * (c.enrollmentCount ?? 0);
      }, 0);
      months.push({
        label,
        fullLabel,
        revenue: monthRevenue,
        courses: monthCourses.length,
      });
    }
    return months;
  }, [filteredAnalyticsCourses, analyticsDatePreset]);

  // Yearly breakdown by year
  const yearlyBreakdown = useMemo(() => {
    const yearMap = new Map<
      number,
      { courses: number; revenue: number; enrollment: number }
    >();
    allCoursesForAnalytics.forEach((course) => {
      const created = parseDate(course.createdAt);
      if (!created) return;
      const year = created.getFullYear();
      const existing = yearMap.get(year) || {
        courses: 0,
        revenue: 0,
        enrollment: 0,
      };
      existing.courses += 1;
      if (course.status === "PUBLIC") {
        const price = course.price ? Number(course.price) : 0;
        existing.revenue += price * (course.enrollmentCount ?? 0);
        existing.enrollment += course.enrollmentCount ?? 0;
      }
      yearMap.set(year, existing);
    });
    return Array.from(yearMap.entries())
      .map(([year, data]) => ({ year, ...data }))
      .sort((a, b) => a.year - b.year);
  }, [allCoursesForAnalytics]);

  const maxYearRevenue = useMemo(
    () => Math.max(...yearlyBreakdown.map((y) => y.revenue), 1),
    [yearlyBreakdown],
  );

  // Top level distribution
  const levelDistribution = useMemo(() => {
    const map = new Map<string, { count: number; enrollment: number }>();
    publicAnalyticsCourses.forEach((course) => {
      const level = normalizeCourseLevel(course.level);
      const existing = map.get(level) || { count: 0, enrollment: 0 };
      existing.count += 1;
      existing.enrollment += course.enrollmentCount ?? 0;
      map.set(level, existing);
    });
    return Array.from(map.entries())
      .map(([level, data]) => ({
        level: formatCourseLevelLabel(level),
        ...data,
      }))
      .sort((a, b) => b.enrollment - a.enrollment);
  }, [publicAnalyticsCourses]);

  const topCourse = useMemo(() => {
    const sorted = [...publicAnalyticsCourses]
      .filter((c) => (c.enrollmentCount ?? 0) > 0)
      .sort((a, b) => (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0));
    return sorted[0] || null;
  }, [publicAnalyticsCourses]);

  const avgCoursePrice = useMemo(() => {
    const publicCourses = filteredAnalyticsCourses.filter(
      (c) => c.status === "PUBLIC" && c.price && Number(c.price) > 0,
    );
    if (publicCourses.length === 0) return 0;
    const total = publicCourses.reduce((sum, c) => sum + Number(c.price), 0);
    return total / publicCourses.length;
  }, [filteredAnalyticsCourses]);

  const handleAnalyticsPresetChange = (preset: DatePreset) => {
    setAnalyticsDatePreset(preset);
    if (preset === "custom") return;
    const range = getPresetDates(preset);
    setAnalyticsStartDate(range.startDate);
    setAnalyticsEndDate(range.endDate);
  };

  // ==================== ACTION HANDLERS ====================
  const handleViewDetails = (course: CourseSummaryDTO) => {
    navigate(`/admin/courses/${course.id}/preview`, {
      state: { returnTo: "/admin?tab=courses" },
    });
  };

  const handleAction = (
    type: "approve" | "reject" | "suspend" | "restore",
    course: CourseSummaryDTO,
  ) => {
    setSelectedCourse(course as unknown as CourseDetailDTO);
    setActionType(type);
    setActionReason("");
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedCourse || !user) return;
    if (
      (actionType === "reject" || actionType === "suspend") &&
      !actionReason.trim()
    ) {
      showWarning(
        "Cảnh báo",
        actionType === "reject"
          ? "Vui lòng nhập lý do từ chối"
          : "Vui lòng nhập lý do tạm khóa",
      );
      return;
    }
    try {
      setActionLoading(true);
      let successMessage = "";
      switch (actionType) {
        case "approve":
          await approveCourse(selectedCourse.id, user.id);
          successMessage = `Đã duyệt khóa học "${selectedCourse.title}".`;
          break;
        case "reject":
          await rejectCourse(selectedCourse.id, user.id, actionReason);
          successMessage = `Đã từ chối khóa học "${selectedCourse.title}".`;
          break;
        case "suspend":
          await suspendCourse(selectedCourse.id, user.id, actionReason);
          successMessage = `Đã tạm khóa khóa học "${selectedCourse.title}".`;
          break;
        case "restore":
          await restoreCourse(selectedCourse.id, user.id);
          successMessage = `Đã khôi phục khóa học "${selectedCourse.title}".`;
          break;
      }
      setShowActionModal(false);
      await Promise.all([loadCourses(), loadStats()]);
      showSuccess("Cập nhật khóa học", successMessage);
    } catch (error) {
      showError(
        "Không thể cập nhật khóa học",
        getApiErrorMessage(error, "Có lỗi xảy ra khi xử lý yêu cầu."),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshAll = useCallback(async () => {
    try {
      await Promise.all([
        loadCourses(),
        loadStats(),
        loadRevisionQueue(),
        loadTotalSystemUsers(),
      ]);
      showInfo("Đã làm mới", "Dữ liệu đã được cập nhật.");
    } catch (error) {
      showError(
        "Không thể làm mới",
        getApiErrorMessage(error, "Vui lòng thử lại."),
      );
    }
  }, [
    loadCourses,
    loadRevisionQueue,
    loadStats,
    loadTotalSystemUsers,
    getApiErrorMessage,
    showError,
    showInfo,
  ]);

  const handleRefreshRevisionQueue = useCallback(async () => {
    try {
      await loadRevisionQueue();
      showInfo("Đã làm mới", "Danh sách revision đã được cập nhật.");
    } catch (error) {
      showError(
        "Không thể làm mới",
        getApiErrorMessage(error, "Vui lòng thử lại."),
      );
    }
  }, [loadRevisionQueue, getApiErrorMessage, showError, showInfo]);

  const handleRefreshCoursesOnly = useCallback(async () => {
    try {
      await Promise.all([loadCourses(), loadStats()]);
      showInfo("Đã làm mới", "Danh sách khóa học đã được cập nhật.");
    } catch (error) {
      showError(
        "Không thể làm mới",
        getApiErrorMessage(error, "Vui lòng thử lại."),
      );
    }
  }, [loadCourses, loadStats, getApiErrorMessage, showError, showInfo]);

  const handleRefreshAnalytics = useCallback(async () => {
    try {
      await Promise.all([loadAnalyticsData(), loadTotalSystemUsers()]);
      showInfo("Đã làm mới", "Dữ liệu phân tích đã được cập nhật.");
    } catch (error) {
      showError(
        "Không thể làm mới",
        getApiErrorMessage(error, "Vui lòng thử lại."),
      );
    }
  }, [
    loadAnalyticsData,
    loadTotalSystemUsers,
    getApiErrorMessage,
    showError,
    showInfo,
  ]);

  const handleApproveRevision = async (revision: CourseRevisionDTO) => {
    try {
      setRevisionActionLoading(true);
      const result = await approveCourseRevision(revision.id);
      setRevisionApproveResults((prev) => ({ ...prev, [revision.id]: result }));
      await Promise.all([loadCourses(), loadStats(), loadRevisionQueue()]);
      const reasonMessage = mapReasonCodeToVietnameseMessage(
        result.autoUpgradeReasonCode,
        result.autoUpgradeReasonDetail,
      );
      const isManual = result.autoUpgradeReasonCode === "POLICY_MANUAL_ONLY";
      const summary = isManual
        ? "Manual-only: learner giữ revision cũ và chỉ nâng cấp khi chủ động thao tác."
        : `Kết quả: ${getAutoUpgradeOutcomeLabel(result.autoUpgradeOutcome)}. ${reasonMessage}`;
      showSuccess(
        "Duyệt revision thành công",
        `Revision #${result.revisionNumber} (ID: ${result.id}) đã được duyệt. ${summary}`,
      );
    } catch (error) {
      showError(
        "Không thể duyệt revision",
        getApiErrorMessage(error, "Kiểm tra queue hoặc quyền admin."),
      );
    } finally {
      setRevisionActionLoading(false);
    }
  };

  const handleViewRevision = (revision: CourseRevisionDTO) => {
    navigate(
      `/admin/courses/${revision.courseId}/preview?revisionId=${revision.id}`,
      {
        state: { returnTo: "/admin?tab=courses" },
      },
    );
  };

  const handleOpenRejectRevisionModal = (revision: CourseRevisionDTO) => {
    setSelectedRevisionForReject(revision);
    setRevisionRejectReason("");
    setShowRevisionRejectModal(true);
  };

  const handleRejectRevision = async () => {
    if (!selectedRevisionForReject) return;
    const reason = revisionRejectReason.trim();
    if (!reason) {
      showWarning("Thiếu lý do", "Vui lòng nhập lý do từ chối.");
      return;
    }
    try {
      setRevisionActionLoading(true);
      const result = await rejectCourseRevision(
        selectedRevisionForReject.id,
        reason,
      );
      await Promise.all([loadCourses(), loadStats(), loadRevisionQueue()]);
      setShowRevisionRejectModal(false);
      setSelectedRevisionForReject(null);
      setRevisionRejectReason("");
      showSuccess(
        "Từ chối revision thành công",
        `Revision #${result.revisionNumber} (ID: ${result.id}) đã bị từ chối.`,
      );
    } catch (error) {
      showError(
        "Không thể từ chối revision",
        getApiErrorMessage(error, "Kiểm tra queue hoặc quyền admin."),
      );
    } finally {
      setRevisionActionLoading(false);
    }
  };

  const handleTabChange = (tab: StatusFilterTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm("");
  };

  const getActionButtons = (course: CourseSummaryDTO) => {
    const buttons: React.ReactNode[] = [
      <button
        key="view"
        className="ach-action-btn view"
        onClick={() => handleViewDetails(course)}
        title="Xem chi tiết"
      >
        <Eye size={18} />
      </button>,
    ];
    if (course.status === CourseStatus.PENDING) {
      buttons.push(
        <button
          key="approve"
          className="ach-action-btn approve"
          onClick={() => handleAction("approve", course)}
          title="Duyệt"
        >
          <CheckCircle size={18} />
        </button>,
        <button
          key="reject"
          className="ach-action-btn reject"
          onClick={() => handleAction("reject", course)}
          title="Từ chối"
        >
          <XCircle size={18} />
        </button>,
      );
    }
    if (course.status === CourseStatus.PUBLIC) {
      buttons.push(
        <button
          key="suspend"
          className="ach-action-btn suspend"
          onClick={() => handleAction("suspend", course)}
          title="Tạm khóa"
        >
          <ShieldOff size={18} />
        </button>,
      );
    }
    if (course.status === CourseStatus.SUSPENDED) {
      buttons.push(
        <button
          key="restore"
          className="ach-action-btn restore"
          onClick={() => handleAction("restore", course)}
          title="Khôi phục"
        >
          <ShieldCheck size={18} />
        </button>,
      );
    }
    return buttons;
  };

  const handleQuickAction = (tab: string) => {
    setActiveTab(tab as StatusFilterTab);
    setViewMode("courses");
    setCurrentPage(1);
    setSearchTerm("");
  };

  // ==================== RENDER ====================
  return (
    <div className="ach-wrapper">
      {/* ========== TOP NAVIGATION ========== */}
      <div className="ach-top-nav">
        <div className="ach-top-nav-title">
          <Activity size={14} />
          <span>COURSE MANAGEMENT</span>
        </div>
        <div className="ach-top-nav-tabs">
          <button
            className={`ach-top-nav-tab ${viewMode === "overview" ? "active" : ""}`}
            onClick={() => setViewMode("overview")}
          >
            <BarChart3 size={15} /> Tổng Quan
          </button>
          <button
            className={`ach-top-nav-tab ${viewMode === "analytics" ? "active" : ""}`}
            onClick={() => setViewMode("analytics")}
          >
            <Activity size={15} /> Phân Tích
          </button>
          <button
            className={`ach-top-nav-tab ${viewMode === "courses" ? "active" : ""}`}
            onClick={() => setViewMode("courses")}
          >
            <BookOpen size={15} /> Quản Lý Khóa Học
            {stats.totalPending > 0 && (
              <span className="ach-tab-badge">{stats.totalPending}</span>
            )}
          </button>
        </div>
        <button
          className="ach-refresh-btn"
          onClick={() => void handleRefreshAll()}
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* ========== OVERVIEW MODE ========== */}
      {viewMode === "overview" && (
        <>
          {/* Stats Cards */}
          <div className="ach-stats-grid">
            <div className="ach-stat-card pending">
              <div className="ach-stat-icon">
                <Clock size={22} />
              </div>
              <div className="ach-stat-body">
                <div className="ach-stat-value">
                  {formatNumber(stats.totalPending)}
                </div>
                <div className="ach-stat-label">Chờ Duyệt</div>
              </div>
            </div>
            <div className="ach-stat-card approved">
              <div className="ach-stat-icon">
                <CheckCircle size={22} />
              </div>
              <div className="ach-stat-body">
                <div className="ach-stat-value">
                  {formatNumber(stats.totalApproved)}
                </div>
                <div className="ach-stat-label">Đã Duyệt</div>
              </div>
            </div>
            <div className="ach-stat-card rejected">
              <div className="ach-stat-icon">
                <XCircle size={22} />
              </div>
              <div className="ach-stat-body">
                <div className="ach-stat-value">
                  {formatNumber(stats.totalRejected)}
                </div>
                <div className="ach-stat-label">Từ Chối</div>
              </div>
            </div>
            <div className="ach-stat-card suspended">
              <div className="ach-stat-icon">
                <ShieldOff size={22} />
              </div>
              <div className="ach-stat-body">
                <div className="ach-stat-value">
                  {formatNumber(stats.totalSuspended)}
                </div>
                <div className="ach-stat-label">Tạm Khóa</div>
              </div>
            </div>
            <div className="ach-stat-card enrollment">
              <div className="ach-stat-icon">
                <Users size={22} />
              </div>
              <div className="ach-stat-body">
                <div className="ach-stat-value">
                  {formatNumber(totalEnrollment)}
                </div>
                <div className="ach-stat-label">Tổng Enrollment</div>
              </div>
            </div>
            <div className="ach-stat-card revenue-card">
              <div className="ach-stat-icon">
                <DollarSign size={22} />
              </div>
              <div className="ach-stat-body">
                <div className="ach-stat-value">
                  {formatVNDCompact(totalRevenue)}
                </div>
                <div className="ach-stat-label">Tổng Doanh Thu</div>
              </div>
            </div>
          </div>

          {/* Quick Actions + Donut */}
          <div className="ach-overview-row">
            {/* Quick Actions */}
            <div className="ach-quick-actions-panel">
              <div className="ach-panel-header">
                <AlertTriangle size={16} className="ach-panel-icon" />
                <h4>Thao Tác Nhanh</h4>
              </div>
              <div className="ach-quick-actions">
                <button
                  className="ach-qa-card pending"
                  onClick={() => handleQuickAction("PENDING")}
                >
                  <div className="ach-qa-top">
                    <span>Chờ duyệt</span>
                    <span className="ach-qa-badge">Queue</span>
                  </div>
                  <strong>{formatNumber(stats.totalPending)}</strong>
                  <ChevronRight size={14} />
                </button>
                <button
                  className="ach-qa-card suspended"
                  onClick={() => handleQuickAction("SUSPENDED")}
                >
                  <div className="ach-qa-top">
                    <span>Tạm khóa</span>
                    <span className="ach-qa-badge">Warning</span>
                  </div>
                  <strong>{formatNumber(stats.totalSuspended)}</strong>
                  <ChevronRight size={14} />
                </button>
                {topCourse && (
                  <button
                    className="ach-qa-card top"
                    onClick={() =>
                      navigate(`/admin/courses/${topCourse.id}/preview`, {
                        state: { returnTo: "/admin?tab=courses" },
                      })
                    }
                  >
                    <div className="ach-qa-top">
                      <span>Top Enrollment</span>
                      <span className="ach-qa-badge">Best</span>
                    </div>
                    <strong>
                      {formatNumber(topCourse.enrollmentCount ?? 0)}
                    </strong>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Status Donut */}
            <div className="ach-donut-panel">
              <div className="ach-panel-header">
                <PieChart size={16} className="ach-panel-icon" />
                <h4>Phân Bổ Trạng Thái</h4>
              </div>
              <div className="ach-donut-layout">
                <div
                  className="ach-donut"
                  style={{ background: buildDonutGradient(statusDistribution) }}
                >
                  <div className="ach-donut-center">
                    <strong>{formatNumber(stats.totalAll)}</strong>
                    <span>Tổng</span>
                  </div>
                </div>
                <div className="ach-legend">
                  {statusDistribution.map((item) => (
                    <div key={item.label} className="ach-legend-item">
                      <span
                        className="ach-legend-dot"
                        style={{ background: item.tone }}
                      />
                      <span className="ach-legend-label">{item.label}</span>
                      <span className="ach-legend-value">
                        {formatNumber(item.value)}
                        {stats.totalAll > 0
                          ? ` • ${((item.value / stats.totalAll) * 100).toFixed(1)}%`
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========== ANALYTICS MODE ========== */}
      {viewMode === "analytics" && (
        <>
          {/* Date Filter */}
          <div className="ach-analytics-filter">
            <div className="ach-preset-group">
              {(
                [
                  "7days",
                  "30days",
                  "90days",
                  "thisMonth",
                  "thisYear",
                  "custom",
                ] as DatePreset[]
              ).map((preset) => (
                <button
                  key={preset}
                  className={`ach-preset-btn ${analyticsDatePreset === preset ? "active" : ""}`}
                  onClick={() => handleAnalyticsPresetChange(preset)}
                >
                  {PRESET_LABELS[preset]}
                </button>
              ))}
            </div>
            {analyticsDatePreset === "custom" && (
              <div className="ach-date-range">
                <input
                  type="date"
                  value={analyticsSafeStart}
                  onChange={(e) => setAnalyticsStartDate(e.target.value)}
                  className="ach-date-input"
                />
                <span>—</span>
                <input
                  type="date"
                  value={analyticsSafeEnd}
                  onChange={(e) => setAnalyticsEndDate(e.target.value)}
                  className="ach-date-input"
                />
              </div>
            )}
            <button
              className="ach-refresh-btn small"
              onClick={() => void handleRefreshAnalytics()}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Analytics Metrics */}
          <div className="ach-metrics-grid">
            <div className="ach-metric-card">
              <div className="ach-metric-icon">
                <Users size={20} />
              </div>
              <div className="ach-metric-body">
                <div className="ach-metric-value">
                  {formatNumber(totalEnrollment)}
                </div>
                <div className="ach-metric-label">Tổng Enrollment</div>
                <div className="ach-metric-detail">
                  {filteredAnalyticsCourses.length} khóa (lọc)
                </div>
              </div>
            </div>
            <div className="ach-metric-card">
              <div className="ach-metric-icon">
                <DollarSign size={20} />
              </div>
              <div className="ach-metric-body">
                <div className="ach-metric-value">
                  {totalRevenue > 0 ? formatVNDCompact(totalRevenue) : "0đ"}
                </div>
                <div className="ach-metric-label">Tổng Doanh Thu</div>
                <div className="ach-metric-detail">Từ giá thực tế</div>
              </div>
            </div>
            <div className="ach-metric-card">
              <div className="ach-metric-icon">
                <TrendingUp size={20} />
              </div>
              <div className="ach-metric-body">
                <div className="ach-metric-value">
                  {formatPercent(enrollmentParticipationRatio)}
                </div>
                <div className="ach-metric-label">Tỷ Lệ Tham Gia</div>
                <div className="ach-metric-detail">
                  {formatNumber(totalEnrollment)}/
                  {formatNumber(totalSystemUsers)} HV
                </div>
              </div>
            </div>
            <div className="ach-metric-card">
              <div className="ach-metric-icon">
                <Target size={20} />
              </div>
              <div className="ach-metric-body">
                <div className="ach-metric-value">
                  {formatPercent(avgCompletionRate)}
                </div>
                <div className="ach-metric-label">Tỷ Lệ Hoàn Thành</div>
                <div className="ach-metric-detail">
                  {publicAnalyticsCourses.length} khóa hoạt động
                </div>
              </div>
            </div>
            <div className="ach-metric-card">
              <div className="ach-metric-icon">
                <BookOpen size={20} />
              </div>
              <div className="ach-metric-body">
                <div className="ach-metric-value">
                  {publicAnalyticsCourses.length}
                </div>
                <div className="ach-metric-label">Khóa Đang Hoạt Động</div>
                <div className="ach-metric-detail">
                  Trên tổng {formatNumber(stats.totalAll)} khóa
                </div>
              </div>
            </div>
            <div className="ach-metric-card">
              <div className="ach-metric-icon">
                <Award size={20} />
              </div>
              <div className="ach-metric-body">
                <div className="ach-metric-value">
                  {avgCoursePrice > 0
                    ? formatVNDCompact(avgCoursePrice)
                    : "Miễn phí"}
                </div>
                <div className="ach-metric-label">Giá TB Khóa</div>
                <div className="ach-metric-detail">
                  {publicAnalyticsCourses.length} khóa có giá
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="ach-charts-row">
            {/* Revenue Trend */}
            <div className="ach-chart-panel">
              <div className="ach-panel-header">
                <div>
                  <span className="ach-panel-eyebrow">Doanh thu</span>
                  <h4>Xu hướng doanh thu theo tháng</h4>
                </div>
                <BarChart3 size={18} className="ach-panel-icon" />
              </div>
              <div className="ach-chart-shell">
                {revenueTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={revenueTrend}
                      margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="ach-revenue-grad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#00d2ff"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="#00d2ff"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="rgba(0, 210, 255, 0.06)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        stroke="rgba(0, 210, 255, 0.35)"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                      />
                      <YAxis
                        stroke="rgba(0, 210, 255, 0.35)"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatVND}
                        fontSize={11}
                      />
                      <Tooltip
                        content={
                          <CustomTooltip
                            formatter={formatVNDCompact}
                            labelFormatter={(l: string) =>
                              revenueTrend.find((r: any) => r.label === l)
                                ?.fullLabel || l
                            }
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#00d2ff"
                        strokeWidth={2}
                        fill="url(#ach-revenue-grad)"
                        dot={{ r: 3, fill: "#00d2ff", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="ach-empty-chart">
                    <BarChart3 size={32} />
                    <span>Chưa có dữ liệu doanh thu</span>
                  </div>
                )}
              </div>
              <div className="ach-chart-footer">
                <span>
                  Tổng: <strong>{formatCurrency(totalRevenue)}</strong>
                </span>
                <span>{revenueTrend.length} tháng</span>
              </div>
            </div>

            {/* Revenue by Category */}
            <div className="ach-chart-panel">
              <div className="ach-panel-header">
                <div>
                  <span className="ach-panel-eyebrow">Danh mục</span>
                  <h4>Doanh thu theo danh mục</h4>
                </div>
                <Layers size={18} className="ach-panel-icon" />
              </div>
              <div className="ach-chart-shell">
                {categoryRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={categoryRevenue}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="ach-cat-bar"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop
                            offset="0%"
                            stopColor="#00d2ff"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="100%"
                            stopColor="#0891b2"
                            stopOpacity={0.8}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="rgba(0, 210, 255, 0.06)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke="rgba(0, 210, 255, 0.35)"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatVND}
                        fontSize={11}
                      />
                      <YAxis
                        dataKey="category"
                        type="category"
                        stroke="rgba(0, 210, 255, 0.35)"
                        tickLine={false}
                        axisLine={false}
                        fontSize={10}
                        width={75}
                      />
                      <Tooltip
                        content={<CustomTooltip formatter={formatVNDCompact} />}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="url(#ach-cat-bar)"
                        radius={[0, 6, 6, 0]}
                        barSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="ach-empty-chart">
                    <Layers size={32} />
                    <span>Chưa có dữ liệu</span>
                  </div>
                )}
              </div>
              <div className="ach-chart-footer">
                <span>{categoryRevenue.length} danh mục</span>
                <span>{formatVNDCompact(totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Yearly Breakdown + Level Distribution Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            {/* Yearly Breakdown */}
            <div className="ach-enrollment-ratio-panel">
              <div className="ach-panel-header">
                <div>
                  <span className="ach-panel-eyebrow">Theo năm</span>
                  <h4>Thống kê theo năm</h4>
                </div>
                <Calendar size={18} className="ach-panel-icon" />
              </div>
              {yearlyBreakdown.length === 0 ? (
                <div className="ach-empty-chart" style={{ height: 120 }}>
                  <Calendar size={28} />
                  <span>Chưa có dữ liệu</span>
                </div>
              ) : (
                <div className="ach-year-breakdown">
                  {yearlyBreakdown.map((item) => (
                    <div key={item.year} className="ach-year-row">
                      <span className="ach-year-row-label">{item.year}</span>
                      <div className="ach-year-row-bar-wrap">
                        <div
                          className="ach-year-row-bar"
                          style={{
                            width: `${Math.max((item.revenue / maxYearRevenue) * 100, item.courses > 0 ? 5 : 0)}%`,
                          }}
                        />
                      </div>
                      <span className="ach-year-row-value">
                        {formatNumber(item.courses)} khóa
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enrollment Participation Ratio */}
            <div className="ach-enrollment-ratio-panel">
              <div className="ach-panel-header">
                <div>
                  <span className="ach-panel-eyebrow">Tỷ lệ</span>
                  <h4>Tỷ lệ tham gia khóa học</h4>
                </div>
                <Target size={18} className="ach-panel-icon" />
              </div>
              <div className="ach-ratio-row">
                <span className="ach-ratio-label">Học viên đã đăng ký</span>
                <span className="ach-ratio-value">
                  <span className="highlight">
                    {formatNumber(totalEnrollment)}
                  </span>
                </span>
              </div>
              <div className="ach-ratio-row">
                <span className="ach-ratio-label">Tổng học viên hệ thống</span>
                <span className="ach-ratio-value">
                  {formatNumber(totalSystemUsers)}
                </span>
              </div>
              <div className="ach-ratio-row">
                <span className="ach-ratio-label">Tỷ lệ tham gia</span>
                <span className="ach-ratio-value">
                  {totalSystemUsers > 0 ? (
                    <span className="highlight">
                      {formatPercent(enrollmentParticipationRatio)}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </span>
              </div>
              <div className="ach-ratio-row">
                <span className="ach-ratio-label">Khóa đang hoạt động</span>
                <span className="ach-ratio-value">
                  <span className="highlight">
                    {publicAnalyticsCourses.length}
                  </span>
                </span>
              </div>
              <div className="ach-ratio-row">
                <span className="ach-ratio-label">TB enrollment/khóa</span>
                <span className="ach-ratio-value">
                  {publicAnalyticsCourses.length > 0 ? (
                    <span className="highlight">
                      {formatNumber(
                        Math.round(
                          totalEnrollment / publicAnalyticsCourses.length,
                        ),
                      )}
                    </span>
                  ) : (
                    "0"
                  )}
                </span>
              </div>
              <div className="ach-ratio-bar">
                <div
                  className="ach-ratio-bar-fill"
                  style={{
                    width: `${Math.min(enrollmentParticipationRatio, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Level Distribution */}
          {levelDistribution.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div className="ach-chart-panel">
                <div className="ach-panel-header">
                  <div>
                    <span className="ach-panel-eyebrow">Cấp độ</span>
                    <h4>Phân bổ theo cấp độ khóa học</h4>
                  </div>
                  <Award size={18} className="ach-panel-icon" />
                </div>
                <div className="ach-chart-shell">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={levelDistribution}
                      layout="vertical"
                      margin={{ top: 4, right: 30, left: 8, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="ach-level-bar"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop
                            offset="0%"
                            stopColor="#00d2ff"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor="#0891b2"
                            stopOpacity={0.6}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="rgba(0, 210, 255, 0.06)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke="rgba(0, 210, 255, 0.35)"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                      />
                      <YAxis
                        dataKey="level"
                        type="category"
                        stroke="rgba(0, 210, 255, 0.35)"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        width={120}
                      />
                      <Tooltip
                        content={<CustomTooltip formatter={formatNumber} />}
                      />
                      <Bar
                        dataKey="enrollment"
                        fill="url(#ach-level-bar)"
                        radius={[0, 6, 6, 0]}
                        barSize={18}
                        name="Enrollment"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="ach-chart-footer">
                  <span>{levelDistribution.length} cấp độ</span>
                  <span>
                    {formatNumber(
                      levelDistribution.reduce((s, l) => s + l.enrollment, 0),
                    )}{" "}
                    tổng enrollment
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== COURSES MANAGEMENT MODE ========== */}
      {viewMode === "courses" && (
        <>
          {/* Revision Queue */}
          <div className="ach-revision-panel">
            <div className="ach-revision-header">
              <div>
                <div className="ach-revision-title">Course Revision Queue</div>
                <div className="ach-revision-subtitle">
                  Danh sách phiên bản đang chờ duyệt
                </div>
              </div>
              <button
                className="ach-refresh-btn small"
                onClick={() => void handleRefreshRevisionQueue()}
                disabled={revisionQueueLoading || revisionActionLoading}
              >
                <RefreshCw size={14} /> Tải lại
              </button>
            </div>
            {revisionQueue.length === 0 ? (
              <div className="ach-revision-empty">
                Không có revision PENDING trong queue.
              </div>
            ) : (
              <div className="ach-table-scroll">
                <table className="ach-table ach-revision-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Revision</th>
                      <th>Khóa Học</th>
                      <th>Giảng Viên</th>
                      <th>Cấp độ</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Submitted</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revisionQueue.map((revision, index) => {
                      const courseMeta = revisionCourseMeta[revision.courseId];
                      const approvedResult =
                        revisionApproveResults[revision.id];
                      return (
                        <tr key={revision.id}>
                          <td className="ach-stt">{index + 1}</td>
                          <td>
                            <strong>Rev #{index + 1}</strong>
                          </td>
                          <td>
                            <div className="ach-course-info">
                              <div className="ach-thumb">
                                {courseMeta?.thumbnailUrl ? (
                                  <img src={courseMeta.thumbnailUrl} alt="" />
                                ) : (
                                  <BookOpen size={18} />
                                )}
                              </div>
                              <span>
                                {courseMeta?.title ||
                                  revision.title ||
                                  `Course #${revision.courseId}`}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="ach-instructor-info">
                              <User size={14} />
                              <span>{courseMeta?.authorName || "N/A"}</span>
                            </div>
                          </td>
                          <td>
                            <span className="ach-category-badge">
                              {revision.level || "N/A"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`ach-status-badge ${revision.status?.toLowerCase() ?? "draft"}`}
                            >
                              {getStatusLabel(revision.status)}
                            </span>
                          </td>
                          <td>
                            <div className="ach-date-info">
                              <Calendar size={14} />
                              <span>
                                {revision.createdAt
                                  ? formatDate(revision.createdAt)
                                  : "N/A"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="ach-date-info">
                              <Calendar size={14} />
                              <span>
                                {revision.submittedAt
                                  ? formatDate(revision.submittedAt)
                                  : "N/A"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="ach-action-buttons">
                              <button
                                className="ach-action-btn view"
                                onClick={() => handleViewRevision(revision)}
                                title="Xem chi tiết"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="ach-action-btn approve"
                                onClick={() =>
                                  void handleApproveRevision(revision)
                                }
                                disabled={revisionActionLoading}
                                title="Approve"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                className="ach-action-btn reject"
                                onClick={() =>
                                  handleOpenRejectRevisionModal(revision)
                                }
                                disabled={revisionActionLoading}
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                            {approvedResult && (
                              <div className="ach-revision-result">
                                <span
                                  className={`ach-upgrade-badge ${getAutoUpgradeOutcomeClass(approvedResult.autoUpgradeOutcome)}`}
                                >
                                  {getAutoUpgradeOutcomeLabel(
                                    approvedResult.autoUpgradeOutcome,
                                  )}
                                </span>
                                <span className="ach-upgrade-reason">
                                  {mapReasonCodeToVietnameseMessage(
                                    approvedResult.autoUpgradeReasonCode,
                                    approvedResult.autoUpgradeReasonDetail,
                                  )}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Courses Table */}
          <div className="ach-section-header">
            <span className="ach-section-title">Danh sách khóa học</span>
            <button
              className="ach-refresh-btn small"
              onClick={() => void handleRefreshCoursesOnly()}
              disabled={loading}
            >
              <RefreshCw size={14} /> Tải lại
            </button>
          </div>

          {/* Status Tabs */}
          <div className="ach-status-tabs">
            {STATUS_TAB_CONFIG.map((tab) => (
              <button
                key={tab.key}
                className={`ach-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.key === "PENDING" && stats.totalPending > 0 && (
                  <span className="ach-tab-badge">{stats.totalPending}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="ach-filters">
            <div className="ach-search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học, giảng viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="ach-table-wrap">
            {loading ? (
              <div className="ach-loading">
                <MeowlKuruLoader size="medium" text="" />
                <p>Đang tải...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="ach-empty-state">
                <BookOpen size={48} />
                <h3>Không có khóa học nào</h3>
                <p>
                  {activeTab === "PENDING"
                    ? "Tất cả khóa học đã được xử lý"
                    : `Không có khóa học với trạng thái "${getStatusLabel(activeTab)}"`}
                </p>
              </div>
            ) : (
              <table className="ach-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Khóa Học</th>
                    <th>Giảng Viên</th>
                    <th>Cấp độ</th>
                    <th>Ngày Tạo</th>
                    <th>Trạng Thái</th>
                    {(activeTab === "REJECTED" || activeTab === "ALL") && (
                      <th>Lý Do</th>
                    )}
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr key={course.id}>
                      <td className="ach-stt">{index + 1}</td>
                      <td>
                        <div className="ach-course-info">
                          <div className="ach-thumb">
                            {course.thumbnailUrl ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.title}
                              />
                            ) : (
                              <BookOpen size={20} />
                            )}
                          </div>
                          <span className="ach-course-title">
                            {course.title}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="ach-instructor-info">
                          <User size={14} />
                          <span>
                            {course.authorName ||
                              course.author?.fullName ||
                              "N/A"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="ach-category-badge">
                          {course.level}
                        </span>
                      </td>
                      <td>
                        <div className="ach-date-info">
                          <Calendar size={14} />
                          <span>{formatDate(course.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`ach-status-badge ${course.status?.toLowerCase()}`}
                        >
                          {getStatusLabel(course.status)}
                        </span>
                      </td>
                      {(activeTab === "REJECTED" || activeTab === "ALL") && (
                        <td>
                          {course.rejectionReason && (
                            <span
                              className="ach-reason-text"
                              title={course.rejectionReason}
                            >
                              <AlertTriangle size={12} />{" "}
                              {course.rejectionReason.length > 40
                                ? course.rejectionReason.substring(0, 40) +
                                  "..."
                                : course.rejectionReason}
                            </span>
                          )}
                        </td>
                      )}
                      <td>
                        <div className="ach-action-buttons">
                          {getActionButtons(course)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* ========== ACTION MODAL ========== */}
      {showActionModal &&
        selectedCourse &&
        ReactDOM.createPortal(
          <div
            className="ach-modal-overlay"
            onClick={() => setShowActionModal(false)}
          >
            <div
              className="ach-modal small"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ach-modal-header">
                <h2>
                  {actionType === "approve" && "Duyệt Khóa Học"}
                  {actionType === "reject" && "Từ Chối Khóa Học"}
                  {actionType === "suspend" && "Tạm Khóa Khóa Học"}
                  {actionType === "restore" && "Khôi Phục Khóa Học"}
                </h2>
                <button
                  className="ach-close-btn"
                  onClick={() => setShowActionModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="ach-modal-body">
                <p>
                  {actionType === "approve" &&
                    `Bạn có chắc muốn duyệt khóa học "${selectedCourse.title}"?`}
                  {actionType === "reject" &&
                    `Vui lòng nhập lý do từ chối khóa học "${selectedCourse.title}"`}
                  {actionType === "suspend" &&
                    `Vui lòng nhập lý do tạm khóa khóa học "${selectedCourse.title}"`}
                  {actionType === "restore" &&
                    `Khôi phục khóa học "${selectedCourse.title}" về trạng thái Công Khai?`}
                </p>
                {(actionType === "reject" || actionType === "suspend") && (
                  <div>
                    <label>
                      {actionType === "reject"
                        ? "Lý do từ chối"
                        : "Lý do tạm khóa"}{" "}
                      <span style={{ color: "#f87171" }}>*</span>
                    </label>
                    <textarea
                      className="ach-reason-input"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder={
                        actionType === "reject"
                          ? "Nhập lý do từ chối..."
                          : "Nhập lý do tạm khóa..."
                      }
                      rows={4}
                    />
                  </div>
                )}
              </div>
              <div className="ach-modal-footer">
                <button
                  className="ach-btn-secondary"
                  onClick={() => setShowActionModal(false)}
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button
                  className={`ach-btn-${actionType}`}
                  onClick={confirmAction}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Đang xử lý..."
                    : actionType === "approve"
                      ? "Xác nhận duyệt"
                      : actionType === "reject"
                        ? "Xác nhận từ chối"
                        : actionType === "suspend"
                          ? "Xác nhận tạm khóa"
                          : "Xác nhận khôi phục"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showRevisionRejectModal &&
        selectedRevisionForReject &&
        ReactDOM.createPortal(
          <div
            className="ach-modal-overlay"
            onClick={() => setShowRevisionRejectModal(false)}
          >
            <div
              className="ach-modal small"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ach-modal-header">
                <h2>Từ Chối Revision</h2>
                <button
                  className="ach-close-btn"
                  onClick={() => setShowRevisionRejectModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="ach-modal-body">
                <p>
                  Revision #{selectedRevisionForReject.revisionNumber} (ID:{" "}
                  {selectedRevisionForReject.id})
                </p>
                <label>
                  Lý do từ chối <span style={{ color: "#f87171" }}>*</span>
                </label>
                <textarea
                  className="ach-reason-input"
                  value={revisionRejectReason}
                  onChange={(e) => setRevisionRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  rows={4}
                />
              </div>
              <div className="ach-modal-footer">
                <button
                  className="ach-btn-secondary"
                  onClick={() => setShowRevisionRejectModal(false)}
                  disabled={revisionActionLoading}
                >
                  Hủy
                </button>
                <button
                  className="ach-btn-reject"
                  onClick={() => void handleRejectRevision()}
                  disabled={revisionActionLoading}
                >
                  {revisionActionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
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
          countdownText={toast.countdownText}
          actionButton={toast.actionButton}
        />
      )}
    </div>
  );
};

export default AdminCourseHub;
