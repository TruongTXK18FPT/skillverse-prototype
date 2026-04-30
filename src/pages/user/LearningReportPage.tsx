import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpenCheck,
  Briefcase,
  Clock3,
  Cpu,
  Download,
  Flame,
  GraduationCap,
  Layers,
  LineChart,
  ListTodo,
  Rocket,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Filter,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import HUDCard from "../../components/dashboard-hud/HUDCard";
import StatUnit from "../../components/dashboard-hud/StatUnit";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import learningReportService, {
  Recommendation,
  RecommendationTier,
  ReportRange,
  StudentLearningReportResponse,
  isValidReportId,
  parseReportId,
} from "../../services/learningReportService";
import { downloadLearningReportPDF } from "../../components/learning-report/PDFGenerator";
import "./LearningReportPage.css";

const RANGE_OPTIONS: ReportRange[] = ["7d", "30d", "90d"];
const BREAKDOWN_PAGE_SIZE = 5;

type RoadmapBreakdownFilter =
  | "all"
  | "not-started"
  | "in-progress"
  | "complete";
type RoadmapBreakdownSort =
  | "progress-desc"
  | "progress-asc"
  | "title-asc"
  | "missions-desc";
type CourseBreakdownFilter = "all" | "active" | "complete" | "not-started";
type CourseBreakdownSort =
  | "progress-desc"
  | "progress-asc"
  | "title-asc"
  | "status-asc"
  | "completed-desc";

const statNumber = (value: number | undefined) => value ?? 0;

// Chart Colors (Hex for Recharts)
const CHART_COLORS = {
  cyan: { primary: "#00f5ff", glow: "rgba(0, 245, 255, 0.5)" },
  blue: { primary: "#00d4ff", glow: "rgba(0, 212, 255, 0.5)" },
  purple: {
    primary: "#a855f7",
    glow: "rgba(168, 85, 247, 0.5)",
    dark: "#7c3aed",
  },
  green: { primary: "#10b981", glow: "rgba(16, 185, 129, 0.5)" },
  orange: { primary: "#f97316", glow: "rgba(249, 115, 22, 0.5)" },
  yellow: {
    primary: "#eab308",
    glow: "rgba(234, 179, 8, 0.5)",
    dark: "#ca8a04",
  },
};

// Custom Tooltip for Charts
const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="lr-tooltip">
        <p className="lr-tooltip-title">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="lr-tooltip-item"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// =====================================================================
// Recommendation card rendering (algorithm-driven, no AI)
// =====================================================================
// Using `any` here to avoid friction with lucide-react ForwardRef typing.
const TIER_META: Record<
  RecommendationTier,
  { label: string; className: string; Icon: any }
> = {
  CRITICAL: {
    label: "Cần Xử Lý Ngay",
    className: "critical",
    Icon: AlertTriangle,
  },
  IMPROVE: { label: "Cải Thiện", className: "improve", Icon: TrendingUp },
  NEXT_STEP: { label: "Bước Tiếp Theo", className: "next-step", Icon: Rocket },
  STRENGTH: { label: "Điểm Mạnh", className: "strength", Icon: Award },
};

function formatMetric(rec: Recommendation): string | null {
  if (rec.metricValue == null) return null;
  const unit = rec.metricUnit ?? "";
  const current = `${rec.metricValue}${unit}`;
  if (rec.metricTarget != null) {
    return `${current} → mục tiêu ${rec.metricTarget}${unit}`;
  }
  return current;
}

function renderRecommendationCard(
  rec: Recommendation,
  index: number,
  navigate: ReturnType<typeof useNavigate>,
) {
  const meta = TIER_META[rec.tier] ?? TIER_META.IMPROVE;
  const { Icon } = meta;
  const metric = formatMetric(rec);
  return (
    <div
      key={rec.id ? `${rec.id}-${index}` : `rec-${index}`}
      className={`lr-tip lr-tip--card lr-tip--${meta.className}`}
      data-tier={rec.tier}
    >
      <div className={`lr-tip-icon-wrapper ${meta.className}`}>
        <Icon size={18} />
      </div>
      <div className="lr-tip-body">
        <div className="lr-tip-header">
          <span className={`lr-tip-badge lr-tip-badge--${meta.className}`}>
            {meta.label}
          </span>
          {rec.category && <span className="lr-tip-chip">{rec.category}</span>}
        </div>
        <p className="lr-tip-title">{rec.title}</p>
        {rec.analysis && <p className="lr-tip-text">{rec.analysis}</p>}
        {rec.action && (
          <p className="lr-tip-action">
            <ArrowRight size={14} />
            <span>{rec.action}</span>
          </p>
        )}
        {(metric || rec.linkPath) && (
          <div className="lr-tip-footer">
            {metric && <span className="lr-tip-metric">{metric}</span>}
            {rec.linkPath && (
              <button
                type="button"
                className="lr-tip-link"
                onClick={() => navigate(rec.linkPath as string)}
              >
                {rec.linkLabel ?? "Mở"}
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const LearningReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reportIdParam = searchParams.get("id");
  const snapshotId = isValidReportId(reportIdParam)
    ? parseReportId(reportIdParam)
    : null;
  const isSnapshotView = snapshotId !== null;

  const [selectedRange, setSelectedRange] = useState<ReportRange>("30d");
  const [report, setReport] = useState<StudentLearningReportResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmapSearch, setRoadmapSearch] = useState("");
  const [roadmapFilter, setRoadmapFilter] =
    useState<RoadmapBreakdownFilter>("all");
  const [roadmapSort, setRoadmapSort] =
    useState<RoadmapBreakdownSort>("progress-desc");
  const [roadmapPage, setRoadmapPage] = useState(1);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseFilter, setCourseFilter] =
    useState<CourseBreakdownFilter>("all");
  const [courseSort, setCourseSort] =
    useState<CourseBreakdownSort>("progress-desc");
  const [coursePage, setCoursePage] = useState(1);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (snapshotId) {
          const [snapshot, timeline] = await Promise.all([
            learningReportService.getReportById(snapshotId),
            learningReportService.getTimeline(selectedRange, snapshotId),
          ]);

          setReport({
            ...snapshot,
            range: selectedRange,
            timeline: timeline.timeline,
          });
          return;
        }

        const liveSummary =
          await learningReportService.getSummary(selectedRange);
        setReport(liveSummary);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải learning report lúc này.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadReport();
  }, [selectedRange, snapshotId]);

  const handleSaveSnapshot = async () => {
    setIsSavingSnapshot(true);
    setError(null);
    try {
      const snapshot =
        await learningReportService.createSnapshot(selectedRange);
      setSearchParams({ id: String(snapshot.reportId) });
      setReport(snapshot);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu snapshot cho báo cáo.",
      );
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) return;

    setIsDownloadingPdf(true);
    setError(null);
    try {
      await downloadLearningReportPDF(report, {
        filename: learningReportService.formatReportFileName(report),
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể tải PDF lúc này.",
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleViewLive = () => {
    setSearchParams({});
  };

  // Enhanced chart data with tasks and jobs
  const chartData = useMemo(() => {
    if (!report?.timeline) return [];
    return report.timeline.map((point) => ({
      ...point,
      // Ensure all values are numbers for the chart
      studyHours: Math.round(((point.studyMinutes || 0) / 60) * 10) / 10,
      productivity:
        (point.missionsCompleted || 0) +
        (point.tasksCompleted || 0) +
        (point.jobsCompleted || 0),
    }));
  }, [report?.timeline]);

  const hasAnyData = useMemo(() => {
    if (!report) return false;
    return (
      statNumber(report.studyStats.totalStudyHours) > 0 ||
      statNumber(report.roadmapStats.totalRoadmaps) > 0 ||
      statNumber(report.taskStats.totalTasks) > 0 ||
      statNumber(report.courseStats.activeCourses) > 0 ||
      statNumber(report.courseStats.completedCourses) > 0 ||
      statNumber(report.jobStats?.completedJobs) > 0
    );
  }, [report]);

  const filteredRoadmaps = useMemo(() => {
    const normalizedSearch = roadmapSearch.trim().toLowerCase();

    return [...(report?.roadmapBreakdown || [])]
      .filter((item) => {
        if (roadmapFilter === "complete" && item.progressPercent < 100) {
          return false;
        }
        if (
          roadmapFilter === "in-progress" &&
          (item.progressPercent <= 0 || item.progressPercent >= 100)
        ) {
          return false;
        }
        if (roadmapFilter === "not-started" && item.progressPercent > 0) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }

        return [item.title, item.goal, item.status, item.nextMissionTitle]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((a, b) => {
        switch (roadmapSort) {
          case "progress-asc":
            return a.progressPercent - b.progressPercent;
          case "title-asc":
            return a.title.localeCompare(b.title, "vi");
          case "missions-desc":
            return b.totalMissions - a.totalMissions;
          case "progress-desc":
          default:
            return b.progressPercent - a.progressPercent;
        }
      });
  }, [report?.roadmapBreakdown, roadmapFilter, roadmapSearch, roadmapSort]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = courseSearch.trim().toLowerCase();

    return [...(report?.courseBreakdown || [])]
      .filter((item) => {
        if (courseFilter === "complete" && item.progressPercent < 100) {
          return false;
        }
        if (
          courseFilter === "active" &&
          (item.progressPercent <= 0 || item.progressPercent >= 100)
        ) {
          return false;
        }
        if (courseFilter === "not-started" && item.progressPercent > 0) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }

        return [item.courseTitle, item.status, item.completedAt]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((a, b) => {
        switch (courseSort) {
          case "progress-asc":
            return a.progressPercent - b.progressPercent;
          case "title-asc":
            return a.courseTitle.localeCompare(b.courseTitle, "vi");
          case "status-asc":
            return a.status.localeCompare(b.status, "vi");
          case "completed-desc":
            return (
              new Date(b.completedAt || 0).getTime() -
              new Date(a.completedAt || 0).getTime()
            );
          case "progress-desc":
          default:
            return b.progressPercent - a.progressPercent;
        }
      });
  }, [courseFilter, courseSearch, courseSort, report?.courseBreakdown]);

  useEffect(() => {
    setRoadmapPage(1);
  }, [roadmapFilter, roadmapSearch, roadmapSort, report?.reportId]);

  useEffect(() => {
    setCoursePage(1);
  }, [courseFilter, courseSearch, courseSort, report?.reportId]);

  const roadmapTotalPages = Math.max(
    1,
    Math.ceil(filteredRoadmaps.length / BREAKDOWN_PAGE_SIZE),
  );
  const courseTotalPages = Math.max(
    1,
    Math.ceil(filteredCourses.length / BREAKDOWN_PAGE_SIZE),
  );

  useEffect(() => {
    if (roadmapPage > roadmapTotalPages) {
      setRoadmapPage(roadmapTotalPages);
    }
  }, [roadmapPage, roadmapTotalPages]);

  useEffect(() => {
    if (coursePage > courseTotalPages) {
      setCoursePage(courseTotalPages);
    }
  }, [coursePage, courseTotalPages]);

  const paginatedRoadmaps = useMemo(() => {
    const start = (roadmapPage - 1) * BREAKDOWN_PAGE_SIZE;
    return filteredRoadmaps.slice(start, start + BREAKDOWN_PAGE_SIZE);
  }, [filteredRoadmaps, roadmapPage]);

  const paginatedCourses = useMemo(() => {
    const start = (coursePage - 1) * BREAKDOWN_PAGE_SIZE;
    return filteredCourses.slice(start, start + BREAKDOWN_PAGE_SIZE);
  }, [coursePage, filteredCourses]);

  const resetRoadmapBreakdownTools = () => {
    setRoadmapSearch("");
    setRoadmapFilter("all");
    setRoadmapSort("progress-desc");
    setRoadmapPage(1);
  };

  const resetCourseBreakdownTools = () => {
    setCourseSearch("");
    setCourseFilter("all");
    setCourseSort("progress-desc");
    setCoursePage(1);
  };

  // Determine trend for each stat
  const getTrend = (
    current: number,
    threshold: number,
  ): "up" | "down" | "stable" => {
    if (current > threshold) return "up";
    if (current < threshold / 2) return "down";
    return "stable";
  };

  return (
    <div className="lr-hud-container">
      <div className="lr-content-wrapper">
        {/* Hero Header */}
        <header className="lr-hero">
          <div className="lr-hero-main">
            <button
              className="lr-back-btn"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft size={18} />
              <span>Dashboard</span>
            </button>

            <div className="lr-hero-content">
              <div className="lr-hero-badge">
                {isSnapshotView ? (
                  <span className="lr-snapshot-badge">SNAPSHOT</span>
                ) : (
                  <div className="lr-live-badge">
                    <span className="lr-live-pulse" />
                    <span>PHÂN TÍCH TRỰC TIẾP</span>
                  </div>
                )}
              </div>
              <h1 className="lr-title">
                <Cpu size={32} className="lr-title-icon" />
                Phân Tích Học Tập
              </h1>
              <p className="lr-subtitle">
                {report
                  ? `${isSnapshotView ? "Snapshot lưu lúc" : "Cập nhật lúc"} ${learningReportService.formatReportDate(
                      report.generatedAt,
                    )}`
                  : "Phân tích tiến độ học tập và làm việc theo thời gian thực"}
              </p>
            </div>
          </div>

          <div className="lr-hero-actions">
            {isSnapshotView && (
              <button className="lr-btn lr-btn-ghost" onClick={handleViewLive}>
                <RefreshCw size={16} />
                <span>Live View</span>
              </button>
            )}
            {/* <button
              className="lr-btn lr-btn-ghost"
              onClick={handleDownloadPdf}
              disabled={!report || isDownloadingPdf}
            >
              <Download size={16} />
              <span>{isDownloadingPdf ? "Đang tạo..." : "Export PDF"}</span>
            </button> */}
            <button
              className="lr-btn lr-btn-primary"
              onClick={handleSaveSnapshot}
              disabled={isSavingSnapshot || isSnapshotView}
            >
              <Save size={16} />
              <span>{isSavingSnapshot ? "Đang lưu..." : "Lưu Snapshot"}</span>
            </button>
          </div>
        </header>

        {/* Range Selector */}
        <HUDCard variant="default">
          <div className="lr-range-info-container">
            <div className="lr-range-title-group">
              <Cpu size={20} className="lr-range-icon" />
              <div>
                <strong className="lr-range-title">Thời Gian Phân Tích</strong>
                <p className="lr-range-desc">
                  Timeline chi tiết: Thời Gian Học | Roadmap Node | Jobs
                </p>
              </div>
            </div>
            <div className="lr-range-switch">
              {RANGE_OPTIONS.map((range) => (
                <button
                  key={range}
                  className={`lr-range-btn ${selectedRange === range ? "active" : ""}`}
                  onClick={() => setSelectedRange(range)}
                >
                  {range === "7d"
                    ? "7 Ngày"
                    : range === "30d"
                      ? "30 Ngày"
                      : "90 Ngày"}
                </button>
              ))}
            </div>
          </div>
        </HUDCard>

        {error && (
          <div className="lr-error">
            <Zap size={20} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <section className="lr-loading">
            <div className="lr-loader" />
            <p>Đang phân tích dữ liệu...</p>
            <span className="lr-loading-sub">
              Tổng hợp từ Roadmap, Tasks, Courses & Jobs
            </span>
          </section>
        ) : report ? (
          <>
            {/* Stats Grid - 8 cards for comprehensive tracking */}
            <section className="lr-stats-grid">
              <StatUnit
                label="Tiến Độ Tổng Thể"
                value={`${statNumber(report.overallProgress)}%`}
                change={`Xu hướng: ${report.learningTrend}`}
                color="cyan"
                icon={Target}
                trend={
                  report.learningTrend === "improving"
                    ? "up"
                    : report.learningTrend === "declining"
                      ? "down"
                      : "neutral"
                }
              />
              <StatUnit
                label="Thời Gian Học"
                value={`${statNumber(report.studyStats.totalStudyHours)}h`}
                change={`${statNumber(report.studyStats.studyMinutesWeek)} phút / tuần`}
                color="cyan"
                icon={Clock3}
                trend={
                  getTrend(report.studyStats.studyMinutesWeek, 120) === "stable"
                    ? "neutral"
                    : getTrend(report.studyStats.studyMinutesWeek, 120)
                }
              />
              <StatUnit
                label="Chuỗi Liên Tiếp"
                value={`${statNumber(report.studyStats.currentStreak)}`}
                change={`${statNumber(report.studyStats.studyMinutesToday)} phút hôm nay`}
                color="orange"
                icon={Flame}
                trend={report.studyStats.currentStreak > 3 ? "up" : "neutral"}
              />
              <StatUnit
                label="Task Đã Xong"
                value={`${statNumber(report.taskStats.completedTasks)}/${statNumber(report.taskStats.totalTasks)}`}
                change={`${statNumber(report.taskStats.pendingTasks)} chờ, ${statNumber(report.taskStats.overdueTasks)} trễ`}
                color="green"
                icon={ListTodo}
                trend={report.taskStats.overdueTasks > 0 ? "down" : "neutral"}
              />
              <StatUnit
                label="Roadmap Node Đã Xong"
                value={`${statNumber(report.roadmapStats.completedMissions)}/${statNumber(report.roadmapStats.totalMissions)}`}
                change={`${statNumber(report.roadmapStats.pendingMissions)} roadmap node còn lại`}
                color="purple"
                icon={BookOpenCheck}
                trend={
                  getTrend(
                    report.roadmapStats.completedMissions,
                    report.roadmapStats.totalMissions / 2,
                  ) === "stable"
                    ? "neutral"
                    : getTrend(
                        report.roadmapStats.completedMissions,
                        report.roadmapStats.totalMissions / 2,
                      )
                }
              />
              <StatUnit
                label="Khóa Học Đang Mở"
                value={`${statNumber(report.courseStats.activeCourses)}`}
                change={`${statNumber(report.courseStats.completedCourses)} khóa hoàn thành`}
                color="yellow"
                icon={GraduationCap}
                trend="neutral"
              />
              <StatUnit
                label="Tiến Độ Khóa Học"
                value={`${statNumber(report.courseStats.averageActiveCourseProgress)}%`}
                change="Trung bình khóa đang học"
                color="cyan"
                icon={BarChart3}
                trend={
                  getTrend(
                    report.courseStats.averageActiveCourseProgress,
                    50,
                  ) === "stable"
                    ? "neutral"
                    : getTrend(
                        report.courseStats.averageActiveCourseProgress,
                        50,
                      )
                }
              />
              <StatUnit
                label="Job Đã Xong"
                value={`${statNumber(report.jobStats?.completedJobs)}`}
                change={`${statNumber(report.jobStats?.totalJobsApplied)} apply | ${statNumber(report.jobStats?.onTimeDeliveryRate)}% on-time`}
                color="green"
                icon={Briefcase}
                trend={
                  getTrend(report.jobStats?.completedJobs || 0, 1) === "stable"
                    ? "neutral"
                    : getTrend(report.jobStats?.completedJobs || 0, 1)
                }
              />
            </section>

            {/* Main Content Grid */}
            <section className="lr-main-grid">
              {/* Enhanced Timeline Chart */}
              <HUDCard variant="default" scanline>
                <div className="lr-panel-header">
                  <div>
                    <h2 className="lr-panel-title">
                      <TrendingUp size={20} />
                      Dòng Thời Gian Hoạt Động
                    </h2>
                    <p className="lr-panel-subtitle">
                      Phân tích chi tiết: Roadmap Node & Jobs theo thời gian
                    </p>
                  </div>
                  <LineChart size={24} className="lr-panel-icon" />
                </div>

                <div className="lr-chart-container">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={380}>
                      <ComposedChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="studyGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={CHART_COLORS.cyan.primary}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={CHART_COLORS.cyan.primary}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(148, 163, 184, 0.1)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="bucketLabel"
                          tick={{ fill: "#8b9bb4", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                          tickLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fill: "#8b9bb4", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                          tickLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                          label={{
                            value: "Thời Gian Học (phút)",
                            angle: -90,
                            position: "insideLeft",
                            fill: CHART_COLORS.cyan.primary,
                          }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: "#8b9bb4", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                          tickLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                          label={{
                            value: "Đã Hoàn Thành",
                            angle: 90,
                            position: "insideRight",
                            fill: CHART_COLORS.blue.primary,
                          }}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ color: "#8b9bb4" }} />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="studyMinutes"
                          stroke={CHART_COLORS.cyan.primary}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#studyGradient)"
                          name="Thời Gian Học"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="missionsCompleted"
                          stroke={CHART_COLORS.purple.primary}
                          strokeWidth={3}
                          dot={{
                            fill: CHART_COLORS.purple.primary,
                            r: 4,
                            strokeWidth: 0,
                          }}
                          activeDot={{ r: 6, fill: CHART_COLORS.purple.glow }}
                          name="Roadmap Node"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="jobsCompleted"
                          stroke={CHART_COLORS.orange.primary}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{
                            fill: CHART_COLORS.orange.primary,
                            r: 3,
                            strokeWidth: 0,
                          }}
                          name="Jobs"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="lr-empty">
                      <Layers size={48} />
                      <p>Chưa có dữ liệu timeline cho khoảng này.</p>
                      <span>
                        Bắt đầu học và làm việc để xem phân tích chi tiết
                      </span>
                    </div>
                  )}
                </div>
              </HUDCard>

              {/* Personalised Recommendations Panel (algorithm-driven) */}
              <HUDCard variant="chamfer" decorated>
                <div className="lr-panel-header">
                  <div>
                    <h2 className="lr-panel-title">
                      <Target size={20} />
                      Phân Tích & Đề Xuất Cá Nhân Hóa
                    </h2>
                    <p className="lr-panel-subtitle">
                      Đánh giá chi tiết dựa trên thuật toán phân tích dữ liệu
                    </p>
                  </div>
                  <Sparkles size={24} className="lr-panel-icon" />
                </div>
                <div className="lr-tips-list">
                  {report.overview.recommendations.length === 0 ? (
                    <div className="lr-tip">
                      <div className="lr-tip-icon-wrapper default">
                        <Sparkles size={18} />
                      </div>
                      <div className="lr-tip-body">
                        <p className="lr-tip-title">Đang chờ dữ liệu</p>
                        <p className="lr-tip-text">
                          Bắt đầu phiên học hoặc tạo lộ trình để hệ thống phân
                          tích.
                        </p>
                      </div>
                    </div>
                  ) : (
                    report.overview.recommendations.map((rec, index) =>
                      renderRecommendationCard(rec, index, navigate),
                    )
                  )}
                </div>
              </HUDCard>
            </section>

            {/* Job Performance Section */}
            {report.jobStats && report.jobStats.totalJobsApplied > 0 && (
              <HUDCard variant="default">
                <div className="lr-panel-header">
                  <div>
                    <h2 className="lr-panel-title">
                      <Briefcase size={20} />
                      Hiệu Suất Công Việc
                    </h2>
                    <p className="lr-panel-subtitle">
                      Đánh giá hiệu suất làm việc từ Short-term Jobs đã hoàn
                      thành
                    </p>
                  </div>
                </div>

                <div className="lr-jobs-grid">
                  <div className="lr-job-metric">
                    <span className="lr-job-metric-value green">
                      {report.jobStats.completedJobs}
                    </span>
                    <span className="lr-job-metric-label">Jobs Hoàn Thành</span>
                  </div>
                  <div className="lr-job-metric">
                    <span className="lr-job-metric-value cyan">
                      {report.jobStats.totalJobsApplied}
                    </span>
                    <span className="lr-job-metric-label">Tổng Apply</span>
                  </div>
                  <div className="lr-job-metric">
                    <span className="lr-job-metric-value purple">
                      {report.jobStats.onTimeDeliveryRate}%
                    </span>
                    <span className="lr-job-metric-label">On-Time Rate</span>
                  </div>
                  <div className="lr-job-metric">
                    <span className="lr-job-metric-value yellow">
                      {report.jobStats.totalEarnings?.toLocaleString() || 0}đ
                    </span>
                    <span className="lr-job-metric-label">Tổng Thu Nhập</span>
                  </div>
                </div>

                {report.jobBreakdown && report.jobBreakdown.length > 0 && (
                  <div className="lr-table-wrap">
                    <table className="lr-table">
                      <thead>
                        <tr>
                          <th>Job</th>
                          <th>Recruiter</th>
                          <th>Status</th>
                          <th>Milestones</th>
                          <th>Thu Nhập</th>
                          <th>Kỹ Năng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.jobBreakdown.slice(0, 5).map((job) => (
                          <tr key={job.jobId}>
                            <td>
                              <strong>{job.jobTitle}</strong>
                              <span className="lr-job-date">
                                {job.completedAt
                                  ? new Date(
                                      job.completedAt,
                                    ).toLocaleDateString("vi-VN")
                                  : job.appliedAt
                                    ? `Apply: ${new Date(job.appliedAt).toLocaleDateString("vi-VN")}`
                                    : "Pending"}
                              </span>
                            </td>
                            <td>{job.recruiterName}</td>
                            <td>
                              <span className={`lr-job-status ${job.status}`}>
                                {job.status}
                              </span>
                            </td>
                            <td>
                              {job.milestonesCompleted}/{job.milestonesTotal}
                            </td>
                            <td className="lr-job-earnings">
                              {job.earnedAmount?.toLocaleString() || 0}đ
                            </td>
                            <td>
                              <div className="lr-job-skills">
                                {job.primarySkill && (
                                  <span className="lr-skill primary">
                                    {job.primarySkill}
                                  </span>
                                )}
                                {job.skillsDemonstrated
                                  ?.slice(0, 2)
                                  .map((skill, i) => (
                                    <span key={i} className="lr-skill">
                                      {skill}
                                    </span>
                                  ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </HUDCard>
            )}

            {/* Detailed Breakdown Tables */}
            <section className="lr-tables-grid">
              {/* Roadmap Breakdown */}
              <HUDCard variant="default">
                <div className="lr-panel-header">
                  <div>
                    <h2 className="lr-panel-title">
                      <BookOpenCheck size={20} />
                      Tiến Độ Lộ Trình
                    </h2>
                    <p className="lr-panel-subtitle">
                      Chi tiết tiến độ từng roadmap
                    </p>
                  </div>
                </div>
                <div className="lr-breakdown-tools">
                  <label className="lr-breakdown-search">
                    <Search size={15} />
                    <input
                      type="search"
                      value={roadmapSearch}
                      onChange={(event) => setRoadmapSearch(event.target.value)}
                      placeholder="Tìm roadmap, goal, node kế tiếp..."
                      aria-label="Tìm kiếm lộ trình"
                    />
                  </label>
                  <label className="lr-breakdown-control">
                    <Filter size={15} />
                    <select
                      value={roadmapFilter}
                      onChange={(event) =>
                        setRoadmapFilter(
                          event.target.value as RoadmapBreakdownFilter,
                        )
                      }
                      aria-label="Lọc lộ trình"
                    >
                      <option value="all">Tất cả tiến độ</option>
                      <option value="not-started">Chưa bắt đầu</option>
                      <option value="in-progress">Đang học</option>
                      <option value="complete">Hoàn thành</option>
                    </select>
                  </label>
                  <label className="lr-breakdown-control">
                    <SlidersHorizontal size={15} />
                    <select
                      value={roadmapSort}
                      onChange={(event) =>
                        setRoadmapSort(
                          event.target.value as RoadmapBreakdownSort,
                        )
                      }
                      aria-label="Sắp xếp lộ trình"
                    >
                      <option value="progress-desc">Tiến độ cao nhất</option>
                      <option value="progress-asc">Tiến độ thấp nhất</option>
                      <option value="title-asc">Tên A-Z</option>
                      <option value="missions-desc">Nhiều node nhất</option>
                    </select>
                  </label>
                  <div className="lr-breakdown-summary">
                    <span>
                      {filteredRoadmaps.length}/{report.roadmapBreakdown.length}{" "}
                      roadmap
                    </span>
                    {(roadmapSearch || roadmapFilter !== "all") && (
                      <button
                        type="button"
                        onClick={resetRoadmapBreakdownTools}
                      >
                        Xóa lọc
                      </button>
                    )}
                  </div>
                </div>
                <div className="lr-table-wrap">
                  <table className="lr-table">
                    <thead>
                      <tr>
                        <th>Roadmap</th>
                        <th>Progress</th>
                        <th>Roadmap Node</th>
                        <th>Kế tiếp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRoadmaps.length > 0 ? (
                        paginatedRoadmaps.map((item) => (
                          <tr key={item.roadmapId}>
                            <td>
                              <strong>{item.title}</strong>
                              <span>{item.goal || "Chưa có goal mô tả"}</span>
                            </td>
                            <td>
                              <div className="lr-progress-cell">
                                <div className="lr-progress-bar">
                                  <div
                                    className="lr-progress-fill"
                                    style={{
                                      width: `${item.progressPercent}%`,
                                      background: `linear-gradient(90deg, ${CHART_COLORS.purple.dark}, ${CHART_COLORS.purple.primary})`,
                                      boxShadow: `0 0 10px ${CHART_COLORS.purple.glow}`,
                                    }}
                                  />
                                </div>
                                <span>{item.progressPercent}%</span>
                              </div>
                            </td>
                            <td>
                              {item.completedMissions}/{item.totalMissions}
                            </td>
                            <td>
                              {item.nextMissionTitle || "✓ Đã hoàn thành"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="lr-empty-cell">
                            Không có roadmap phù hợp để hiển thị
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredRoadmaps.length > BREAKDOWN_PAGE_SIZE && (
                  <div className="lr-breakdown-pagination">
                    <button
                      type="button"
                      onClick={() =>
                        setRoadmapPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={roadmapPage === 1}
                    >
                      Trang trước
                    </button>
                    <span>
                      Trang {roadmapPage}/{roadmapTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRoadmapPage((prev) =>
                          Math.min(prev + 1, roadmapTotalPages),
                        )
                      }
                      disabled={roadmapPage === roadmapTotalPages}
                    >
                      Trang sau
                    </button>
                  </div>
                )}
              </HUDCard>

              {/* Course Breakdown */}
              <HUDCard variant="default">
                <div className="lr-panel-header">
                  <div>
                    <h2 className="lr-panel-title">
                      <GraduationCap size={20} />
                      Tiến Độ Khóa Học
                    </h2>
                    <p className="lr-panel-subtitle">Tiến độ các khóa học</p>
                  </div>
                </div>
                <div className="lr-breakdown-tools">
                  <label className="lr-breakdown-search">
                    <Search size={15} />
                    <input
                      type="search"
                      value={courseSearch}
                      onChange={(event) => setCourseSearch(event.target.value)}
                      placeholder="Tìm khóa học, status, ngày hoàn thành..."
                      aria-label="Tìm kiếm khóa học"
                    />
                  </label>
                  <label className="lr-breakdown-control">
                    <Filter size={15} />
                    <select
                      value={courseFilter}
                      onChange={(event) =>
                        setCourseFilter(
                          event.target.value as CourseBreakdownFilter,
                        )
                      }
                      aria-label="Lọc khóa học"
                    >
                      <option value="all">Tất cả tiến độ</option>
                      <option value="not-started">Chưa bắt đầu</option>
                      <option value="active">Đang học</option>
                      <option value="complete">Hoàn thành</option>
                    </select>
                  </label>
                  <label className="lr-breakdown-control">
                    <SlidersHorizontal size={15} />
                    <select
                      value={courseSort}
                      onChange={(event) =>
                        setCourseSort(event.target.value as CourseBreakdownSort)
                      }
                      aria-label="Sắp xếp khóa học"
                    >
                      <option value="progress-desc">Tiến độ cao nhất</option>
                      <option value="progress-asc">Tiến độ thấp nhất</option>
                      <option value="title-asc">Tên A-Z</option>
                      <option value="status-asc">Status A-Z</option>
                      <option value="completed-desc">
                        Hoàn thành mới nhất
                      </option>
                    </select>
                  </label>
                  <div className="lr-breakdown-summary">
                    <span>
                      {filteredCourses.length}/{report.courseBreakdown.length}{" "}
                      khóa học
                    </span>
                    {(courseSearch || courseFilter !== "all") && (
                      <button type="button" onClick={resetCourseBreakdownTools}>
                        Xóa lọc
                      </button>
                    )}
                  </div>
                </div>
                <div className="lr-table-wrap">
                  <table className="lr-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCourses.length > 0 ? (
                        paginatedCourses.map((item) => (
                          <tr key={`${item.courseId}-${item.status}`}>
                            <td>
                              <strong>{item.courseTitle}</strong>
                            </td>
                            <td>
                              <span className={`lr-job-status ${item.status}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <div className="lr-progress-cell">
                                <div className="lr-progress-bar">
                                  <div
                                    className="lr-progress-fill"
                                    style={{
                                      width: `${item.progressPercent}%`,
                                      background: `linear-gradient(90deg, ${CHART_COLORS.yellow.dark}, ${CHART_COLORS.yellow.primary})`,
                                      boxShadow: `0 0 10px ${CHART_COLORS.yellow.glow}`,
                                    }}
                                  />
                                </div>
                                <span>{item.progressPercent}%</span>
                              </div>
                            </td>
                            <td>
                              {item.completedAt &&
                              !item.completedAt.toString().startsWith("0001")
                                ? learningReportService.formatReportDate(
                                    item.completedAt,
                                  )
                                : "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="lr-empty-cell">
                            Không có khóa học phù hợp để hiển thị
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredCourses.length > BREAKDOWN_PAGE_SIZE && (
                  <div className="lr-breakdown-pagination">
                    <button
                      type="button"
                      onClick={() =>
                        setCoursePage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={coursePage === 1}
                    >
                      Trang trước
                    </button>
                    <span>
                      Trang {coursePage}/{courseTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCoursePage((prev) =>
                          Math.min(prev + 1, courseTotalPages),
                        )
                      }
                      disabled={coursePage === courseTotalPages}
                    >
                      Trang sau
                    </button>
                  </div>
                )}
              </HUDCard>
            </section>

            {!hasAnyData && (
              <section className="lr-empty lr-empty-full">
                <Layers size={64} />
                <h3>Chưa có dữ liệu phân tích</h3>
                <p>
                  Bắt đầu học tập, hoàn thành tasks, theo dõi roadmap hoặc apply
                  job để xem phân tích chi tiết về tiến độ của bạn.
                </p>
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default LearningReportPage;
