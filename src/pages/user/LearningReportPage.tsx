import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
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
  RefreshCw,
  Save,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
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
  ReportRange,
  StudentLearningReportResponse,
  isValidReportId,
  parseReportId,
} from "../../services/learningReportService";
import { downloadLearningReportPDF } from "../../components/learning-report/PDFGenerator";
import "./LearningReportPage.css";

const RANGE_OPTIONS: ReportRange[] = ["7d", "30d", "90d"];

const statNumber = (value: number | undefined) => value ?? 0;

// Neon Cyan Tech Theme Colors
const NEON_COLORS = {
  cyan: {
    primary: "#00f5ff",
    glow: "rgba(0, 245, 255, 0.5)",
    dark: "#00c8d6",
    bg: "rgba(0, 245, 255, 0.1)",
  },
  blue: {
    primary: "#00d4ff",
    glow: "rgba(0, 212, 255, 0.5)",
    dark: "#0099cc",
    bg: "rgba(0, 212, 255, 0.1)",
  },
  purple: {
    primary: "#a855f7",
    glow: "rgba(168, 85, 247, 0.5)",
    dark: "#7c3aed",
    bg: "rgba(168, 85, 247, 0.1)",
  },
  green: {
    primary: "#00ff88",
    glow: "rgba(0, 255, 136, 0.5)",
    dark: "#00cc6a",
    bg: "rgba(0, 255, 136, 0.1)",
  },
  orange: {
    primary: "#ff6b35",
    glow: "rgba(255, 107, 53, 0.5)",
    dark: "#e55a2b",
    bg: "rgba(255, 107, 53, 0.1)",
  },
  yellow: {
    primary: "#ffd700",
    glow: "rgba(255, 215, 0, 0.5)",
    dark: "#ccac00",
    bg: "rgba(255, 215, 0, 0.1)",
  },
};

interface NeonStatCardProps {
  label: string;
  value: string;
  helper: string;
  color: keyof typeof NEON_COLORS;
  icon: React.ReactNode;
  trend?: "up" | "down" | "stable";
}

const NeonStatCard: React.FC<NeonStatCardProps> = ({
  label,
  value,
  helper,
  color,
  icon,
  trend,
}) => {
  const theme = NEON_COLORS[color];

  return (
    <article
      className="neon-stat-card"
      style={{
        borderColor: theme.primary,
        boxShadow: `0 0 20px ${theme.glow}, inset 0 0 20px ${theme.bg}`,
      }}
    >
      <div className="neon-stat-header">
        <span
          className="neon-stat-icon"
          style={{
            background: `linear-gradient(135deg, ${theme.dark}, ${theme.primary})`,
            boxShadow: `0 0 15px ${theme.glow}`,
          }}
        >
          {icon}
        </span>
        <div className="neon-stat-label-group">
          <span className="neon-stat-label">{label}</span>
          {trend && (
            <span className={`neon-stat-trend neon-trend-${trend}`}>
              {trend === "up" ? "▲" : trend === "down" ? "▼" : "▸"}
            </span>
          )}
        </div>
      </div>
      <strong
        className="neon-stat-value"
        style={{
          textShadow: `0 0 10px ${theme.glow}, 0 0 20px ${theme.glow}`,
          color: theme.primary,
        }}
      >
        {value}
      </strong>
      <span className="neon-stat-helper" style={{ color: "#8b9bb4" }}>
        {helper}
      </span>
    </article>
  );
};

// Live Analysis Badge
const LiveAnalysisBadge: React.FC = () => (
  <div className="live-analysis-badge">
    <span className="live-pulse" />
    <span className="live-text">LIVE ANALYSIS</span>
  </div>
);

// Custom Neon Tooltip for Charts
const NeonTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="neon-tooltip"
        style={{
          background: "rgba(10, 15, 30, 0.95)",
          border: "1px solid #00f5ff",
          boxShadow: "0 0 20px rgba(0, 245, 255, 0.3)",
          borderRadius: "12px",
          padding: "12px 16px",
        }}
      >
        <p style={{ color: "#00f5ff", margin: "0 0 8px 0", fontWeight: 600 }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color, margin: "4px 0", fontSize: "0.9rem" }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        const liveSummary = await learningReportService.getSummary(selectedRange);
        setReport(liveSummary);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải learning report lúc này."
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
      const snapshot = await learningReportService.createSnapshot(selectedRange);
      setSearchParams({ id: String(snapshot.reportId) });
      setReport(snapshot);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu snapshot cho báo cáo."
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
        err instanceof Error ? err.message : "Không thể tải PDF lúc này."
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
      studyHours: Math.round((point.studyMinutes || 0) / 60 * 10) / 10,
      productivity: (point.missionsCompleted || 0) + (point.tasksCompleted || 0) + (point.jobsCompleted || 0),
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

  // Determine trend for each stat
  const getTrend = (current: number, threshold: number): "up" | "down" | "stable" => {
    if (current > threshold) return "up";
    if (current < threshold / 2) return "down";
    return "stable";
  };

  return (
    <div className="neon-learning-report">
      {/* Animated Background */}
      <div className="neon-bg-grid" />
      <div className="neon-bg-glow cyan" />
      <div className="neon-bg-glow blue" />
      <div className="neon-bg-glow purple" />

      <div className="neon-report-container">
        {/* Hero Header */}
        <header className="neon-hero">
          <div className="neon-hero-main">
            <button
              className="neon-back-btn"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft size={18} />
              <span>Dashboard</span>
            </button>

            <div className="neon-hero-content">
              <div className="neon-hero-badge">
                {isSnapshotView ? (
                  <span className="neon-badge snapshot">SNAPSHOT</span>
                ) : (
                  <LiveAnalysisBadge />
                )}
              </div>
              <h1 className="neon-title">
                <Cpu size={32} className="neon-title-icon" />
                Learning Analytics
              </h1>
              <p className="neon-subtitle">
                {report
                  ? `${isSnapshotView ? "Snapshot lưu lúc" : "Cập nhật lúc"} ${learningReportService.formatReportDate(
                      report.generatedAt
                    )}`
                  : "Phân tích tiến độ học tập và làm việc theo thời gian thực"}
              </p>
            </div>
          </div>

          <div className="neon-hero-actions">
            {isSnapshotView && (
              <button
                className="neon-btn neon-btn-ghost"
                onClick={handleViewLive}
              >
                <RefreshCw size={16} />
                <span>Live View</span>
              </button>
            )}
            <button
              className="neon-btn neon-btn-ghost"
              onClick={handleDownloadPdf}
              disabled={!report || isDownloadingPdf}
            >
              <Download size={16} />
              <span>{isDownloadingPdf ? "Đang tạo..." : "Export PDF"}</span>
            </button>
            <button
              className="neon-btn neon-btn-primary"
              onClick={handleSaveSnapshot}
              disabled={isSavingSnapshot || isSnapshotView}
            >
              <Save size={16} />
              <span>{isSavingSnapshot ? "Đang lưu..." : "Lưu Snapshot"}</span>
            </button>
          </div>
        </header>

        {/* Range Selector */}
        <section className="neon-range-section">
          <div className="neon-range-info">
            <Cpu size={20} className="neon-range-icon" />
            <div>
              <strong className="neon-range-title">Analysis Range</strong>
              <p className="neon-range-desc">
                Timeline chi tiết: Study Minutes | Tasks | Missions | Jobs
              </p>
            </div>
          </div>
          <div className="neon-range-switch">
            {RANGE_OPTIONS.map((range) => (
              <button
                key={range}
                className={`neon-range-btn ${selectedRange === range ? "active" : ""}`}
                onClick={() => setSelectedRange(range)}
              >
                {range === "7d" ? "7 Ngày" : range === "30d" ? "30 Ngày" : "90 Ngày"}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="neon-error">
            <Zap size={20} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <section className="neon-loading">
            <div className="neon-loader" />
            <p>Đang phân tích dữ liệu...</p>
            <span className="neon-loading-sub">Tổng hợp từ Roadmap, Tasks, Courses & Jobs</span>
          </section>
        ) : report ? (
          <>
            {/* Stats Grid - 8 cards for comprehensive tracking */}
            <section className="neon-stats-grid">
              <NeonStatCard
                label="Overall Progress"
                value={`${statNumber(report.overallProgress)}%`}
                helper={`Trend: ${report.learningTrend}`}
                color="cyan"
                icon={<Target size={18} />}
                trend={report.learningTrend === "improving" ? "up" : report.learningTrend === "declining" ? "down" : "stable"}
              />
              <NeonStatCard
                label="Study Hours"
                value={`${statNumber(report.studyStats.totalStudyHours)}h`}
                helper={`${statNumber(report.studyStats.studyMinutesWeek)} phút / tuần`}
                color="blue"
                icon={<Clock3 size={18} />}
                trend={getTrend(report.studyStats.studyMinutesWeek, 120)}
              />
              <NeonStatCard
                label="Current Streak"
                value={`${statNumber(report.studyStats.currentStreak)} ngày`}
                helper={`${statNumber(report.studyStats.studyMinutesToday)} phút hôm nay`}
                color="orange"
                icon={<Flame size={18} />}
                trend={report.studyStats.currentStreak > 3 ? "up" : "stable"}
              />
              <NeonStatCard
                label="Tasks Completed"
                value={`${statNumber(report.taskStats.completedTasks)} / ${statNumber(report.taskStats.totalTasks)}`}
                helper={`${statNumber(report.taskStats.pendingTasks)} chờ, ${statNumber(report.taskStats.overdueTasks)} quá hạn`}
                color="green"
                icon={<ListTodo size={18} />}
                trend={report.taskStats.overdueTasks > 0 ? "down" : "stable"}
              />
              <NeonStatCard
                label="Missions Done"
                value={`${statNumber(report.roadmapStats.completedMissions)} / ${statNumber(report.roadmapStats.totalMissions)}`}
                helper={`${statNumber(report.roadmapStats.pendingMissions)} mission còn lại`}
                color="purple"
                icon={<BookOpenCheck size={18} />}
                trend={getTrend(report.roadmapStats.completedMissions, report.roadmapStats.totalMissions / 2)}
              />
              <NeonStatCard
                label="Active Courses"
                value={`${statNumber(report.courseStats.activeCourses)}`}
                helper={`${statNumber(report.courseStats.completedCourses)} khóa hoàn thành`}
                color="yellow"
                icon={<GraduationCap size={18} />}
                trend="stable"
              />
              <NeonStatCard
                label="Course Progress"
                value={`${statNumber(report.courseStats.averageActiveCourseProgress)}%`}
                helper="Trung bình khóa đang học"
                color="cyan"
                icon={<BarChart3 size={18} />}
                trend={getTrend(report.courseStats.averageActiveCourseProgress, 50)}
              />
              <NeonStatCard
                label="Jobs Completed"
                value={`${statNumber(report.jobStats?.completedJobs)}`}
                helper={`${statNumber(report.jobStats?.totalJobsApplied)} apply | ${statNumber(report.jobStats?.onTimeDeliveryRate)}% on-time`}
                color="green"
                icon={<Briefcase size={18} />}
                trend={getTrend(report.jobStats?.completedJobs || 0, 1)}
              />
            </section>

            {/* Main Content Grid */}
            <section className="neon-main-grid">
              {/* Enhanced Timeline Chart */}
              <article className="neon-panel neon-panel-chart">
                <div className="neon-panel-header">
                  <div>
                    <h2 className="neon-panel-title">
                      <TrendingUp size={20} />
                      Activity Timeline
                    </h2>
                    <p className="neon-panel-subtitle">
                      Phân tích chi tiết: Tasks, Missions & Jobs theo thời gian
                    </p>
                  </div>
                  <LineChart size={24} className="neon-panel-icon" />
                </div>

                <div className="neon-chart-container">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={380}>
                      <ComposedChart data={chartData}>
                        <defs>
                          <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={NEON_COLORS.cyan.primary} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={NEON_COLORS.cyan.primary} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(0, 245, 255, 0.1)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="bucketLabel"
                          tick={{ fill: "#8b9bb4", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(0, 245, 255, 0.2)" }}
                          tickLine={{ stroke: "rgba(0, 245, 255, 0.2)" }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fill: "#8b9bb4", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(0, 245, 255, 0.2)" }}
                          tickLine={{ stroke: "rgba(0, 245, 255, 0.2)" }}
                          label={{ value: 'Study (min)', angle: -90, position: 'insideLeft', fill: '#00f5ff' }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: "#8b9bb4", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(0, 245, 255, 0.2)" }}
                          tickLine={{ stroke: "rgba(0, 245, 255, 0.2)" }}
                          label={{ value: 'Completed', angle: 90, position: 'insideRight', fill: '#00d4ff' }}
                        />
                        <Tooltip content={<NeonTooltip />} />
                        <Legend
                          wrapperStyle={{ color: "#8b9bb4" }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="studyMinutes"
                          stroke={NEON_COLORS.cyan.primary}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#studyGradient)"
                          name="Study Minutes"
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="tasksCompleted"
                          fill={NEON_COLORS.green.primary}
                          radius={[4, 4, 0, 0]}
                          name="Tasks"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="missionsCompleted"
                          stroke={NEON_COLORS.purple.primary}
                          strokeWidth={3}
                          dot={{ fill: NEON_COLORS.purple.primary, r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: NEON_COLORS.purple.glow }}
                          name="Missions"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="jobsCompleted"
                          stroke={NEON_COLORS.orange.primary}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: NEON_COLORS.orange.primary, r: 3, strokeWidth: 0 }}
                          name="Jobs"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="neon-empty">
                      <Layers size={48} />
                      <p>Chưa có dữ liệu timeline cho khoảng này.</p>
                      <span>Bắt đầu học và làm việc để xem phân tích chi tiết</span>
                    </div>
                  )}
                </div>
              </article>

              {/* AI Recommendations Panel */}
              <article className="neon-panel neon-panel-tips">
                <div className="neon-panel-header">
                  <div>
                    <h2 className="neon-panel-title">
                      <Zap size={20} />
                      AI Analysis & Recommendations
                    </h2>
                    <p className="neon-panel-subtitle">
                      Đánh giá chi tiết dựa trên thuật toán phân tích dữ liệu
                    </p>
                  </div>
                  <Target size={24} className="neon-panel-icon" />
                </div>
                <div className="neon-tips-list">
                  {report.overview.recommendations.map((tip, index) => {
                    const isAssessment = tip.includes("Phân tích:") || tip.includes("✅");
                    const isEarning = tip.includes("💰");
                    return (
                      <div
                        key={`${tip}-${index}`}
                        className={`neon-tip ${isAssessment ? "assessment" : ""} ${isEarning ? "earning" : ""}`}
                      >
                        <span
                          className="neon-tip-number"
                          style={{
                            background: isAssessment
                              ? "linear-gradient(135deg, #00ff88, #00cc6a)"
                              : isEarning
                              ? "linear-gradient(135deg, #ffd700, #ccac00)"
                              : "linear-gradient(135deg, #00f5ff, #00c8d6)",
                            boxShadow: isAssessment
                              ? "0 0 10px rgba(0, 255, 136, 0.5)"
                              : isEarning
                              ? "0 0 10px rgba(255, 215, 0, 0.5)"
                              : "0 0 10px rgba(0, 245, 255, 0.5)",
                          }}
                        >
                          {isAssessment ? "✓" : isEarning ? "$" : index + 1}
                        </span>
                        <p>{tip}</p>
                      </div>
                    );
                  })}
                </div>
              </article>
            </section>

            {/* Job Performance Section */}
            {report.jobStats && report.jobStats.totalJobsApplied > 0 && (
              <section className="neon-jobs-section">
                <div className="neon-section-header">
                  <Briefcase size={24} className="neon-section-icon" />
                  <div>
                    <h2 className="neon-section-title">Job Performance Analytics</h2>
                    <p className="neon-section-subtitle">
                      Đánh giá hiệu suất làm việc từ Short-term Jobs đã hoàn thành
                    </p>
                  </div>
                </div>

                <div className="neon-jobs-grid">
                  <div className="neon-job-metric">
                    <span className="neon-job-metric-value" style={{ color: NEON_COLORS.green.primary }}>
                      {report.jobStats.completedJobs}
                    </span>
                    <span className="neon-job-metric-label">Jobs Hoàn Thành</span>
                  </div>
                  <div className="neon-job-metric">
                    <span className="neon-job-metric-value" style={{ color: NEON_COLORS.cyan.primary }}>
                      {report.jobStats.totalJobsApplied}
                    </span>
                    <span className="neon-job-metric-label">Tổng Apply</span>
                  </div>
                  <div className="neon-job-metric">
                    <span className="neon-job-metric-value" style={{ color: NEON_COLORS.purple.primary }}>
                      {report.jobStats.onTimeDeliveryRate}%
                    </span>
                    <span className="neon-job-metric-label">On-Time Rate</span>
                  </div>
                  <div className="neon-job-metric">
                    <span className="neon-job-metric-value" style={{ color: NEON_COLORS.yellow.primary }}>
                      {report.jobStats.totalEarnings?.toLocaleString() || 0}đ
                    </span>
                    <span className="neon-job-metric-label">Tổng Thu Nhập</span>
                  </div>
                </div>

                {report.jobBreakdown && report.jobBreakdown.length > 0 && (
                  <div className="neon-jobs-table-wrap">
                    <table className="neon-jobs-table">
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
                              <span className="neon-job-date">
                                {job.completedAt
                                  ? new Date(job.completedAt).toLocaleDateString("vi-VN")
                                  : job.appliedAt
                                  ? `Apply: ${new Date(job.appliedAt).toLocaleDateString("vi-VN")}`
                                  : "Pending"}
                              </span>
                            </td>
                            <td>{job.recruiterName}</td>
                            <td>
                              <span className={`neon-job-status ${job.status}`}>
                                {job.status}
                              </span>
                            </td>
                            <td>{job.milestonesCompleted}/{job.milestonesTotal}</td>
                            <td style={{ color: NEON_COLORS.yellow.primary, fontWeight: 600 }}>
                              {job.earnedAmount?.toLocaleString() || 0}đ
                            </td>
                            <td>
                              <div className="neon-job-skills">
                                {job.primarySkill && (
                                  <span className="neon-skill primary">{job.primarySkill}</span>
                                )}
                                {job.skillsDemonstrated?.slice(0, 2).map((skill, i) => (
                                  <span key={i} className="neon-skill">{skill}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* Detailed Breakdown Tables */}
            <section className="neon-tables-grid">
              {/* Roadmap Breakdown */}
              <article className="neon-panel">
                <div className="neon-panel-header">
                  <div>
                    <h2 className="neon-panel-title">
                      <BookOpenCheck size={20} />
                      Roadmap Progress
                    </h2>
                    <p className="neon-panel-subtitle">Chi tiết tiến độ từng roadmap</p>
                  </div>
                </div>
                <div className="neon-table-wrap">
                  <table className="neon-table">
                    <thead>
                      <tr>
                        <th>Roadmap</th>
                        <th>Progress</th>
                        <th>Missions</th>
                        <th>Next Mission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.roadmapBreakdown.length > 0 ? (
                        report.roadmapBreakdown.map((item) => (
                          <tr key={item.roadmapId}>
                            <td>
                              <strong>{item.title}</strong>
                              <span>{item.goal || "Chưa có goal mô tả"}</span>
                            </td>
                            <td>
                              <div className="neon-progress-cell">
                                <div className="neon-progress-bar">
                                  <div
                                    className="neon-progress-fill"
                                    style={{
                                      width: `${item.progressPercent}%`,
                                      background: `linear-gradient(90deg, ${NEON_COLORS.purple.dark}, ${NEON_COLORS.purple.primary})`,
                                      boxShadow: `0 0 10px ${NEON_COLORS.purple.glow}`,
                                    }}
                                  />
                                </div>
                                <span>{item.progressPercent}%</span>
                              </div>
                            </td>
                            <td>
                              {item.completedMissions}/{item.totalMissions}
                            </td>
                            <td>{item.nextMissionTitle || "✓ Đã hoàn thành"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="neon-empty-cell">
                            Chưa có roadmap để hiển thị
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>

              {/* Course Breakdown */}
              <article className="neon-panel">
                <div className="neon-panel-header">
                  <div>
                    <h2 className="neon-panel-title">
                      <GraduationCap size={20} />
                      Course Progress
                    </h2>
                    <p className="neon-panel-subtitle">Tiến độ các khóa học</p>
                  </div>
                </div>
                <div className="neon-table-wrap">
                  <table className="neon-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.courseBreakdown.length > 0 ? (
                        report.courseBreakdown.map((item) => (
                          <tr key={`${item.courseId}-${item.status}`}>
                            <td>{item.courseTitle}</td>
                            <td>
                              <span className={`neon-status-badge ${item.status}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <div className="neon-progress-cell">
                                <div className="neon-progress-bar">
                                  <div
                                    className="neon-progress-fill"
                                    style={{
                                      width: `${item.progressPercent}%`,
                                      background: `linear-gradient(90deg, ${NEON_COLORS.yellow.dark}, ${NEON_COLORS.yellow.primary})`,
                                      boxShadow: `0 0 10px ${NEON_COLORS.yellow.glow}`,
                                    }}
                                  />
                                </div>
                                <span>{item.progressPercent}%</span>
                              </div>
                            </td>
                            <td>
                              {item.completedAt
                                ? learningReportService.formatReportDate(item.completedAt)
                                : "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="neon-empty-cell">
                            Chưa có khóa học để hiển thị
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>

            {!hasAnyData && (
              <section className="neon-empty-state">
                <Layers size={64} />
                <h3>Chưa có dữ liệu phân tích</h3>
                <p>
                  Bắt đầu học tập, hoàn thành tasks, theo dõi roadmap hoặc apply job
                  để xem phân tích chi tiết về tiến độ của bạn.
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
