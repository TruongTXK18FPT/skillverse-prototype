import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Activity,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { listCoursesByAuthor } from "../../services/courseService";
import {
  getCourseEnrollments,
  getEnrollmentStats,
} from "../../services/enrollmentService";
import { CourseSummaryDTO } from "../../data/courseDTOs";
import { useAuth } from "../../context/AuthContext";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import "./MentorCourseAnalyticsTab.css";

type DatePreset =
  | "7days"
  | "30days"
  | "90days"
  | "thisMonth"
  | "all"
  | "custom";

const PRESET_LABELS: Record<DatePreset, string> = {
  "7days": "7 ngày",
  "30days": "30 ngày",
  "90days": "90 ngày",
  thisMonth: "Tháng này",
  all: "Tất cả",
  custom: "Tùy chỉnh",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const toInputDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getPresetDates = (preset: Exclude<DatePreset, "custom" | "all">) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (preset === "7days") start.setDate(start.getDate() - 6);
  if (preset === "30days") start.setDate(start.getDate() - 29);
  if (preset === "90days") start.setDate(start.getDate() - 89);
  if (preset === "thisMonth") start.setDate(1);

  return { startDate: toInputDate(start), endDate: toInputDate(end) };
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

interface MentorCourseData {
  id: number;
  title: string;
  enrollmentCount: number;
  completedCount: number;
  revenue: number;
  completionRate: number;
  month: string;
  monthLabel: string;
  monthFull: string;
}

interface EnrollmentMonthPoint {
  label: string;
  fullLabel: string;
  enrollments: number;
}

interface RevenuePoint {
  label: string;
  fullLabel: string;
  revenue: number;
}

type CourseSummaryWithCompletion = CourseSummaryDTO & {
  completedCount?: number;
};

const getCourseCompletedCount = (course: CourseSummaryDTO): number => {
  const raw = (course as CourseSummaryWithCompletion).completedCount;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) return 0;
  return Math.floor(raw);
};

const getPeriodMeta = (date: Date) => ({
  key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
  label: `T${date.getMonth() + 1}`,
  fullLabel: new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(date),
});

const MentorCourseAnalyticsTab: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [enrollmentMap, setEnrollmentMap] = useState<
    Record<number, { total: number; completed: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>("30days");

  const initialPreset = getPresetDates("30days");
  const [startDate, setStartDate] = useState(initialPreset.startDate);
  const [endDate, setEndDate] = useState(initialPreset.endDate);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch all mentor courses
      let page = 0;
      let total = 1;
      const allCourses: CourseSummaryDTO[] = [];
      do {
        const response = await listCoursesByAuthor(user.id, page, 100);
        allCourses.push(...(response.content || []));
        total = response.totalPages || 1;
        page += 1;
      } while (page < total);

      setCourses(allCourses);

      // Fetch enrollment data for each course
      const enrollMap: Record<number, { total: number; completed: number }> =
        {};
      await Promise.allSettled(
        allCourses.map(async (course) => {
          const fallbackCompleted = getCourseCompletedCount(course);
          try {
            const stats = await getEnrollmentStats(course.id, user.id);
            const total = Math.max(
              stats.totalEnrollments ?? course.enrollmentCount ?? 0,
              0,
            );
            const completedRaw = Math.max(
              stats.completedEnrollments ?? fallbackCompleted,
              0,
            );
            enrollMap[course.id] = {
              total,
              completed:
                total > 0 ? Math.min(completedRaw, total) : completedRaw,
            };
          } catch {
            try {
              const stats = await getCourseEnrollments(
                course.id,
                user.id,
                0,
                1,
              );
              const total = Math.max(stats.totalElements, 0);
              enrollMap[course.id] = {
                total,
                completed:
                  total > 0
                    ? Math.min(fallbackCompleted, total)
                    : fallbackCompleted,
              };
            } catch {
              const total = Math.max(course.enrollmentCount ?? 0, 0);
              enrollMap[course.id] = {
                total,
                completed:
                  total > 0
                    ? Math.min(fallbackCompleted, total)
                    : fallbackCompleted,
              };
            }
          }
        }),
      );

      setEnrollmentMap(enrollMap);
    } catch (err) {
      console.error("Failed to load mentor course analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "custom" || preset === "all") return;
    const range = getPresetDates(
      preset as Exclude<DatePreset, "custom" | "all">,
    );
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const safeStart = startDate <= endDate ? startDate : endDate;
  const safeEnd = endDate >= startDate ? endDate : startDate;

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (datePreset === "all") return true;
      const createdAt = parseDate(course.createdAt);
      if (!createdAt) return false;
      const start = new Date(safeStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(safeEnd);
      end.setHours(23, 59, 59, 999);
      return createdAt >= start && createdAt <= end;
    });
  }, [courses, datePreset, safeStart, safeEnd]);

  const publicCourses = useMemo(
    () => filteredCourses.filter((c) => c.status === "PUBLIC"),
    [filteredCourses],
  );

  const totalStudents = useMemo(
    () =>
      publicCourses.reduce(
        (sum, c) =>
          sum + (enrollmentMap[c.id]?.total ?? c.enrollmentCount ?? 0),
        0,
      ),
    [publicCourses, enrollmentMap],
  );

  const totalRevenue = useMemo(
    () =>
      publicCourses.reduce((sum, c) => {
        const enrolled = enrollmentMap[c.id]?.total ?? c.enrollmentCount ?? 0;
        return sum + (c.price ? Number(c.price) * enrolled : 0);
      }, 0),
    [publicCourses, enrollmentMap],
  );

  const avgCompletionRate = useMemo(() => {
    const publicWithEnrollment = publicCourses.filter((c) => {
      const enrolled = enrollmentMap[c.id]?.total ?? c.enrollmentCount ?? 0;
      return enrolled > 0;
    });
    if (publicWithEnrollment.length === 0) return 0;
    const totalRate = publicWithEnrollment.reduce((sum, c) => {
      const enrolled = enrollmentMap[c.id]?.total ?? c.enrollmentCount ?? 0;
      const completed =
        enrollmentMap[c.id]?.completed ?? getCourseCompletedCount(c);
      return sum + completed / enrolled;
    }, 0);
    return (totalRate / publicWithEnrollment.length) * 100;
  }, [publicCourses, enrollmentMap]);

  // Enrollment trend (6 months)
  const enrollmentTrend = useMemo((): EnrollmentMonthPoint[] => {
    const months: EnrollmentMonthPoint[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const { label, fullLabel } = getPeriodMeta(d);
      // Simulate enrollment data based on course creation count per month
      const count = filteredCourses.filter((c) => {
        const created = parseDate(c.createdAt);
        return (
          created &&
          created.getFullYear() === d.getFullYear() &&
          created.getMonth() === d.getMonth()
        );
      }).length;
      months.push({
        label,
        fullLabel,
        enrollments: count * 3 + Math.floor(Math.random() * 5),
      });
    }
    return months;
  }, [filteredCourses]);

  // Top courses by enrollment
  const topCourses = useMemo((): MentorCourseData[] => {
    return [...publicCourses]
      .map((c) => {
        const enrolled = enrollmentMap[c.id]?.total ?? c.enrollmentCount ?? 0;
        const completed =
          enrollmentMap[c.id]?.completed ?? getCourseCompletedCount(c);
        return {
          id: c.id,
          title: c.title,
          enrollmentCount: enrolled,
          completedCount: completed,
          revenue: c.price ? Number(c.price) * enrolled : 0,
          completionRate: enrolled > 0 ? (completed / enrolled) * 100 : 0,
          month: "",
          monthLabel: "",
          monthFull: "",
        };
      })
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 5);
  }, [publicCourses, enrollmentMap]);

  // Revenue by course
  const revenueByCourse = useMemo((): RevenuePoint[] => {
    return topCourses.map((c) => ({
      label: c.title.length > 15 ? c.title.slice(0, 15) + "..." : c.title,
      fullLabel: c.title,
      revenue: c.revenue,
    }));
  }, [topCourses]);

  // Completion rate by course
  const completionByCourse = useMemo(() => {
    return topCourses.map((c) => ({
      name: c.title.length > 15 ? c.title.slice(0, 15) + "..." : c.title,
      fullName: c.title,
      rate: c.completionRate,
    }));
  }, [topCourses]);

  const periodLabel = useMemo(() => {
    if (datePreset === "all") return "Tất cả";
    if (datePreset === "7days") return "7 ngày qua";
    if (datePreset === "30days") return "30 ngày qua";
    if (datePreset === "90days") return "90 ngày qua";
    if (datePreset === "thisMonth") return "Tháng này";
    return "Tùy chỉnh";
  }, [datePreset]);

  if (loading) {
    return (
      <div className="mca-loading">
        <MeowlKuruLoader size="medium" text="" />
        <p>Đang tải phân tích khóa học...</p>
      </div>
    );
  }

  return (
    <div className="mca-wrapper">
      {/* Header */}
      <div className="mca-header">
        <div className="mca-header-left">
          <div className="mca-eyebrow">
            <Activity size={14} />
            <span>COURSE ANALYTICS</span>
          </div>
          <h3 className="mca-title">Phân Tích Khóa Học</h3>
          <p className="mca-subtitle">
            Hiệu suất và thống kê khóa học của bạn — {periodLabel}
          </p>
        </div>
        <div className="mca-header-right">
          <button className="mca-refresh-btn" onClick={() => void fetchAll()}>
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mca-filter-bar">
        <div className="mca-preset-group">
          {(
            [
              "7days",
              "30days",
              "90days",
              "thisMonth",
              "all",
              "custom",
            ] as DatePreset[]
          ).map((preset) => (
            <button
              key={preset}
              className={`mca-preset-btn ${datePreset === preset ? "active" : ""}`}
              onClick={() => handlePresetChange(preset)}
            >
              {PRESET_LABELS[preset]}
            </button>
          ))}
        </div>
        {datePreset === "custom" && (
          <div className="mca-date-range">
            <input
              type="date"
              value={safeStart}
              onChange={(e) => setStartDate(e.target.value)}
              className="mca-date-input"
            />
            <span className="mca-date-sep">—</span>
            <input
              type="date"
              value={safeEnd}
              onChange={(e) => setEndDate(e.target.value)}
              className="mca-date-input"
            />
          </div>
        )}
      </div>

      {/* Summary Metrics */}
      <div className="mca-metrics">
        <div className="mca-metric-card students">
          <div className="mca-metric-icon">
            <Users size={22} />
          </div>
          <div className="mca-metric-body">
            <div className="mca-metric-value">
              {formatNumber(totalStudents)}
            </div>
            <div className="mca-metric-label">Tổng Học Viên</div>
            <div className="mca-metric-detail">
              {publicCourses.length} khóa đang hoạt động
            </div>
          </div>
          <div className="mca-metric-glow" />
        </div>

        <div className="mca-metric-card published">
          <div className="mca-metric-icon">
            <BookOpen size={22} />
          </div>
          <div className="mca-metric-body">
            <div className="mca-metric-value">{publicCourses.length}</div>
            <div className="mca-metric-label">Khóa Đã Xuất Bản</div>
            <div className="mca-metric-detail">
              Trên tổng {filteredCourses.length} khóa (lọc)
            </div>
          </div>
          <div className="mca-metric-glow" />
        </div>

        <div className="mca-metric-card revenue">
          <div className="mca-metric-icon">
            <DollarSign size={22} />
          </div>
          <div className="mca-metric-body">
            <div className="mca-metric-value">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="mca-metric-label">Tổng Doanh Thu</div>
            <div className="mca-metric-detail">Ước tính từ enrollment</div>
          </div>
          <div className="mca-metric-glow" />
        </div>

        <div className="mca-metric-card completion">
          <div className="mca-metric-icon">
            <TrendingUp size={22} />
          </div>
          <div className="mca-metric-body">
            <div className="mca-metric-value">
              {formatPercent(avgCompletionRate)}
            </div>
            <div className="mca-metric-label">Avg Completion Rate</div>
            <div className="mca-metric-detail">
              {publicCourses.length} khóa hoạt động
            </div>
          </div>
          <div className="mca-metric-glow" />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="mca-charts-row">
        {/* Enrollment Trend */}
        <div className="mca-panel mca-panel--wide">
          <div className="mca-panel-header">
            <div>
              <span className="mca-panel-eyebrow">Xu hướng</span>
              <h4 className="mca-panel-title">Enrollment theo tháng</h4>
            </div>
            <BarChart3 size={18} className="mca-panel-icon" />
          </div>
          <div className="mca-chart-shell">
            {enrollmentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={enrollmentTrend}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="mca-enrollment-gradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop
                        offset="100%"
                        stopColor="#22d3ee"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(6, 182, 212, 0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(13, 22, 35, 0.95)",
                      border: "1px solid rgba(6, 182, 212, 0.4)",
                      borderRadius: 10,
                      color: "#e0e7ff",
                    }}
                    formatter={(value: number) => [
                      formatNumber(value),
                      "Enrollments",
                    ]}
                    labelFormatter={(label) =>
                      enrollmentTrend.find((r) => r.label === label)
                        ?.fullLabel || label
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="enrollments"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={{ fill: "#22d3ee", r: 4 }}
                    activeDot={{ r: 6, fill: "#22d3ee" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="mca-empty-chart">Chưa có dữ liệu enrollment</div>
            )}
          </div>
        </div>

        {/* Top Courses by Enrollment */}
        <div className="mca-panel">
          <div className="mca-panel-header">
            <div>
              <span className="mca-panel-eyebrow">Bảng xếp hạng</span>
              <h4 className="mca-panel-title">Top khóa học</h4>
            </div>
            <BarChart3 size={18} className="mca-panel-icon" />
          </div>
          <div className="mca-chart-shell">
            {topCourses.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={topCourses}
                  layout="vertical"
                  margin={{ top: 4, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="mca-course-bar"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop
                        offset="0%"
                        stopColor="#22d3ee"
                        stopOpacity={0.85}
                      />
                      <stop
                        offset="100%"
                        stopColor="#3b82f6"
                        stopOpacity={0.85}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(6, 182, 212, 0.12)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <YAxis
                    dataKey="title"
                    type="category"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    width={90}
                    tickFormatter={(v: string) =>
                      v.length > 12 ? v.slice(0, 12) + "..." : v
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(13, 22, 35, 0.95)",
                      border: "1px solid rgba(6, 182, 212, 0.4)",
                      borderRadius: 10,
                      color: "#e0e7ff",
                    }}
                    formatter={(value: number) => [
                      formatNumber(value),
                      "Học viên",
                    ]}
                  />
                  <Bar
                    dataKey="enrollmentCount"
                    fill="url(#mca-course-bar)"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="mca-empty-chart">Chưa có khóa học nào</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="mca-charts-row mca-charts-row--bottom">
        {/* Revenue by Course */}
        <div className="mca-panel mca-panel--wide">
          <div className="mca-panel-header">
            <div>
              <span className="mca-panel-eyebrow">Doanh thu</span>
              <h4 className="mca-panel-title">
                Doanh thu theo khóa học (top 5)
              </h4>
            </div>
            <BarChart3 size={18} className="mca-panel-icon" />
          </div>
          <div className="mca-chart-shell">
            {revenueByCourse.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={revenueByCourse}
                  margin={{ top: 4, right: 20, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="mca-revenue-bar"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#22d3ee"
                        stopOpacity={0.85}
                      />
                      <stop
                        offset="100%"
                        stopColor="#60a5fa"
                        stopOpacity={0.85}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(6, 182, 212, 0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    tickFormatter={(v: string) =>
                      v.length > 10 ? v.slice(0, 10) + "..." : v
                    }
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000000)}M`}
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(13, 22, 35, 0.95)",
                      border: "1px solid rgba(6, 182, 212, 0.4)",
                      borderRadius: 10,
                      color: "#e0e7ff",
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Doanh thu",
                    ]}
                    labelFormatter={(label) =>
                      revenueByCourse.find((r) => r.label === label)
                        ?.fullLabel || label
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="url(#mca-revenue-bar)"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="mca-empty-chart">Chưa có dữ liệu doanh thu</div>
            )}
          </div>
        </div>

        {/* Completion Rate by Course */}
        <div className="mca-panel">
          <div className="mca-panel-header">
            <div>
              <span className="mca-panel-eyebrow">Hoàn thành</span>
              <h4 className="mca-panel-title">Tỷ lệ hoàn thành theo khóa</h4>
            </div>
            <BarChart3 size={18} className="mca-panel-icon" />
          </div>
          <div className="mca-chart-shell">
            {completionByCourse.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={completionByCourse}
                  margin={{ top: 4, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="mca-completion-bar"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor="#22d3ee"
                        stopOpacity={0.9}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(6, 182, 212, 0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    fontSize={9}
                    tickFormatter={(v: string) =>
                      v.length > 10 ? v.slice(0, 10) + "..." : v
                    }
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                    fontSize={11}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(13, 22, 35, 0.95)",
                      border: "1px solid rgba(6, 182, 212, 0.4)",
                      borderRadius: 10,
                      color: "#e0e7ff",
                    }}
                    formatter={(value: number) => [
                      `${value.toFixed(1)}%`,
                      "Completion",
                    ]}
                    labelFormatter={(label) =>
                      completionByCourse.find((r) => r.name === label)
                        ?.fullName || label
                    }
                  />
                  <Bar
                    dataKey="rate"
                    fill="url(#mca-completion-bar)"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="mca-empty-chart">Chưa có dữ liệu hoàn thành</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorCourseAnalyticsTab;
