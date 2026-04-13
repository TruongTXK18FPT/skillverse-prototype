import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Zap,
  Plus,
  TrendingUp,
  Users,
  FileText,
  Clock,
  CheckCircle,
  BarChart3,
  ArrowUpRight,
  ChevronRight,
  PieChart,
  Activity,
  Shield,
} from "lucide-react";
import jobService from "../../services/jobService";
import shortTermJobService from "../../services/shortTermJobService";
import { JobPostingResponse, JobStatus } from "../../data/jobDTOs";
import {
  ShortTermJobResponse,
  ShortTermJobStatus,
} from "../../types/ShortTermJob";
import OperationLog from "./OperationLog";
import MissionLaunchPad from "./MissionLaunchPad";
import ShortTermJobManager from "./ShortTermJobManager";
import RegulationsTab from "./RegulationsTab";
import "./job-hub.css";

// ==================== TYPES ====================
type HubPanel = "overview" | "fulltime" | "shortterm" | "regulations";

interface OverviewStats {
  // Full-time
  ftTotal: number;
  ftOpen: number;
  ftClosed: number;
  ftApplicants: number;
  // Short-term
  stTotal: number;
  stPublished: number;
  stInProgress: number;
  stCompleted: number;
  stApplicants: number;
  // Combined
  totalJobs: number;
  totalApplicants: number;
}

// ==================== MINI CHART COMPONENTS ====================

const DonutChart: React.FC<{
  segments: { value: number; color: string; label: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: number;
}> = ({ segments, size = 140, centerLabel, centerValue }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="jh-donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="jh-donut__svg">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.1)"
          strokeWidth="14"
        />
        {total > 0 &&
          segments.map((seg, i) => {
            const pct = seg.value / total;
            const dashLen = pct * circumference;
            const dashGap = circumference - dashLen;
            const offset = currentOffset;
            currentOffset += dashLen;
            return (
              <circle
                key={i}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={`${dashLen} ${dashGap}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="jh-donut__segment"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            );
          })}
      </svg>
      <div className="jh-donut__center">
        <span className="jh-donut__value">{centerValue ?? total}</span>
        {centerLabel && <span className="jh-donut__label">{centerLabel}</span>}
      </div>
    </div>
  );
};

const BarChartSimple: React.FC<{
  bars: { label: string; value: number; color: string }[];
  maxValue?: number;
}> = ({ bars, maxValue }) => {
  const max = maxValue || Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="jh-barchart">
      {bars.map((bar, i) => (
        <div key={i} className="jh-barchart__item">
          <span className="jh-barchart__label">{bar.label}</span>
          <div className="jh-barchart__track">
            <div
              className="jh-barchart__fill"
              style={{
                width: `${(bar.value / max) * 100}%`,
                background: bar.color,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          </div>
          <span className="jh-barchart__value">{bar.value}</span>
        </div>
      ))}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const JobManagementHub: React.FC = () => {
  const [activePanel, setActivePanel] = useState<HubPanel>("overview");
  const [showCreateFulltime, setShowCreateFulltime] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Data
  const [ftJobs, setFtJobs] = useState<JobPostingResponse[]>([]);
  const [stJobs, setStJobs] = useState<ShortTermJobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ftData, stData] = await Promise.all([
        jobService.getMyJobs().catch(() => [] as JobPostingResponse[]),
        shortTermJobService
          .getMyJobs()
          .catch(() => [] as ShortTermJobResponse[]),
      ]);
      setFtJobs(ftData);
      setStJobs(stData);
    } catch (error) {
      console.error("Failed to fetch job data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, refreshTrigger]);

  // ==================== COMPUTED STATS ====================
  const stats: OverviewStats = {
    ftTotal: ftJobs.length,
    ftOpen: ftJobs.filter((j) => j.status === JobStatus.OPEN).length,
    ftClosed: ftJobs.filter((j) => j.status === JobStatus.CLOSED).length,
    ftApplicants: ftJobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0),
    stTotal: stJobs.length,
    stPublished: stJobs.filter((j) => j.status === ShortTermJobStatus.PUBLISHED)
      .length,
    stInProgress: stJobs.filter((j) =>
      [
        ShortTermJobStatus.IN_PROGRESS,
        ShortTermJobStatus.SUBMITTED,
        ShortTermJobStatus.UNDER_REVIEW,
      ].includes(j.status),
    ).length,
    stCompleted: stJobs.filter((j) =>
      [ShortTermJobStatus.COMPLETED, ShortTermJobStatus.PAID].includes(
        j.status,
      ),
    ).length,
    stApplicants: stJobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0),
    totalJobs: ftJobs.length + stJobs.length,
    totalApplicants:
      ftJobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0) +
      stJobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0),
  };

  const handleMissionLaunched = () => {
    setRefreshTrigger((p) => p + 1);
    setShowCreateFulltime(false);
  };

  // ==================== SIDEBAR NAV ====================
  const sidebarItems = [
    {
      id: "overview" as HubPanel,
      icon: <LayoutDashboard size={20} />,
      label: "Tổng Quan",
      badge: stats.totalJobs,
      color: "#06b6d4",
    },
    {
      id: "fulltime" as HubPanel,
      icon: <Briefcase size={20} />,
      label: "Dài Hạn",
      badge: stats.ftTotal,
      color: "#3b82f6",
    },
    {
      id: "shortterm" as HubPanel,
      icon: <Zap size={20} />,
      label: "Ngắn Hạn",
      badge: stats.stTotal,
      color: "#f59e0b",
    },
    {
      id: "regulations" as HubPanel,
      icon: <Shield size={20} />,
      label: "Quy Định",
      badge: 0,
      color: "#06b6d4",
    },
  ];

  // ==================== RENDER ====================
  return (
    <div className="jh-hub">
      {/* Sidebar */}
      <aside className="jh-sidebar">
        <div className="jh-sidebar__header">
          <BarChart3 size={22} />
          <span>Quản Lý Việc Làm</span>
        </div>

        <nav className="jh-sidebar__nav">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`jh-sidebar__item ${activePanel === item.id ? "jh-sidebar__item--active" : ""}`}
              onClick={() => {
                setActivePanel(item.id);
                setShowCreateFulltime(false);
              }}
              style={{ "--item-color": item.color } as React.CSSProperties}
            >
              <span className="jh-sidebar__icon">{item.icon}</span>
              <span className="jh-sidebar__label">{item.label}</span>
              {item.badge > 0 && (
                <span className="jh-sidebar__badge">{item.badge}</span>
              )}
              <ChevronRight size={14} className="jh-sidebar__arrow" />
            </button>
          ))}
        </nav>

        {/* Quick actions */}
        <div className="jh-sidebar__actions">
          <button
            className="jh-sidebar__action-btn jh-sidebar__action-btn--blue"
            onClick={() => {
              setActivePanel("fulltime");
              setShowCreateFulltime(true);
            }}
          >
            <Plus size={16} /> Đăng Dài Hạn
          </button>
          <button
            className="jh-sidebar__action-btn jh-sidebar__action-btn--amber"
            onClick={() => (window.location.href = "/short-term-jobs/create")}
          >
            <Zap size={16} /> Đăng Ngắn Hạn
          </button>
        </div>

        {/* Mini summary */}
        <div className="jh-sidebar__summary">
          <div className="jh-sidebar__summary-row">
            <Users size={14} />
            <span>{stats.totalApplicants} ứng viên</span>
          </div>
          <div className="jh-sidebar__summary-row">
            <FileText size={14} />
            <span>{stats.totalJobs} công việc</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="jh-content">
        {/* ==================== OVERVIEW PANEL ==================== */}
        {activePanel === "overview" && (
          <div className="jh-overview">
            {/* Header */}
            <div className="jh-panel-header">
              <div>
                <h2 className="jh-panel-header__title">
                  <LayoutDashboard size={24} />
                  Tổng Quan Tuyển Dụng
                </h2>
                <p className="jh-panel-header__desc">
                  Thống kê và phân tích hoạt động tuyển dụng
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="jh-overview__cards">
              <div className="jh-stat-card jh-stat-card--cyan">
                <div className="jh-stat-card__icon">
                  <FileText size={22} />
                </div>
                <div className="jh-stat-card__info">
                  <span className="jh-stat-card__value">{stats.totalJobs}</span>
                  <span className="jh-stat-card__label">Tổng Công Việc</span>
                </div>
                <TrendingUp size={16} className="jh-stat-card__trend" />
              </div>
              <div className="jh-stat-card jh-stat-card--blue">
                <div className="jh-stat-card__icon">
                  <Briefcase size={22} />
                </div>
                <div className="jh-stat-card__info">
                  <span className="jh-stat-card__value">{stats.ftOpen}</span>
                  <span className="jh-stat-card__label">Dài Hạn Đang Mở</span>
                </div>
                <Activity size={16} className="jh-stat-card__trend" />
              </div>
              <div className="jh-stat-card jh-stat-card--amber">
                <div className="jh-stat-card__icon">
                  <Zap size={22} />
                </div>
                <div className="jh-stat-card__info">
                  <span className="jh-stat-card__value">
                    {stats.stPublished}
                  </span>
                  <span className="jh-stat-card__label">
                    Ngắn Hạn Đang Tuyển
                  </span>
                </div>
                <ArrowUpRight size={16} className="jh-stat-card__trend" />
              </div>
              <div className="jh-stat-card jh-stat-card--purple">
                <div className="jh-stat-card__icon">
                  <Users size={22} />
                </div>
                <div className="jh-stat-card__info">
                  <span className="jh-stat-card__value">
                    {stats.totalApplicants}
                  </span>
                  <span className="jh-stat-card__label">Tổng Ứng Viên</span>
                </div>
                <TrendingUp size={16} className="jh-stat-card__trend" />
              </div>
            </div>

            {/* Charts Row */}
            <div className="jh-overview__charts">
              {/* Donut - Job Distribution */}
              <div className="jh-chart-panel">
                <h3 className="jh-chart-panel__title">
                  <PieChart size={18} /> Phân Bổ Công Việc
                </h3>
                <div className="jh-chart-panel__body">
                  <DonutChart
                    segments={[
                      {
                        value: stats.ftOpen,
                        color: "#3b82f6",
                        label: "Dài hạn mở",
                      },
                      {
                        value: stats.ftClosed,
                        color: "#64748b",
                        label: "Dài hạn đóng",
                      },
                      {
                        value: stats.stPublished,
                        color: "#f59e0b",
                        label: "Ngắn hạn tuyển",
                      },
                      {
                        value: stats.stInProgress,
                        color: "#06b6d4",
                        label: "Ngắn hạn đang làm",
                      },
                      {
                        value: stats.stCompleted,
                        color: "#22c55e",
                        label: "Ngắn hạn xong",
                      },
                    ]}
                    centerLabel="Tổng"
                    centerValue={stats.totalJobs}
                  />
                  <div className="jh-chart-panel__legend">
                    <div className="jh-legend-item">
                      <span
                        className="jh-legend-dot"
                        style={{ background: "#3b82f6" }}
                      />
                      Dài hạn mở ({stats.ftOpen})
                    </div>
                    <div className="jh-legend-item">
                      <span
                        className="jh-legend-dot"
                        style={{ background: "#64748b" }}
                      />
                      Dài hạn đóng ({stats.ftClosed})
                    </div>
                    <div className="jh-legend-item">
                      <span
                        className="jh-legend-dot"
                        style={{ background: "#f59e0b" }}
                      />
                      Ngắn hạn tuyển ({stats.stPublished})
                    </div>
                    <div className="jh-legend-item">
                      <span
                        className="jh-legend-dot"
                        style={{ background: "#06b6d4" }}
                      />
                      Đang thực hiện ({stats.stInProgress})
                    </div>
                    <div className="jh-legend-item">
                      <span
                        className="jh-legend-dot"
                        style={{ background: "#22c55e" }}
                      />
                      Hoàn thành ({stats.stCompleted})
                    </div>
                  </div>
                </div>
              </div>

              {/* Bar Chart - Category Comparison */}
              <div className="jh-chart-panel">
                <h3 className="jh-chart-panel__title">
                  <BarChart3 size={18} /> So Sánh Loại Hình
                </h3>
                <div className="jh-chart-panel__body jh-chart-panel__body--col">
                  <BarChartSimple
                    bars={[
                      {
                        label: "Tổng tin DH",
                        value: stats.ftTotal,
                        color: "#3b82f6",
                      },
                      {
                        label: "Tổng tin NH",
                        value: stats.stTotal,
                        color: "#f59e0b",
                      },
                      {
                        label: "UV Dài hạn",
                        value: stats.ftApplicants,
                        color: "#818cf8",
                      },
                      {
                        label: "UV Ngắn hạn",
                        value: stats.stApplicants,
                        color: "#fb923c",
                      },
                      {
                        label: "DH Đang mở",
                        value: stats.ftOpen,
                        color: "#22d3ee",
                      },
                      {
                        label: "NH Hoàn thành",
                        value: stats.stCompleted,
                        color: "#34d399",
                      },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Quick Access Panels */}
            <div className="jh-overview__quick">
              {/* Full-time Quick */}
              <div
                className="jh-quick-card jh-quick-card--blue"
                onClick={() => setActivePanel("fulltime")}
              >
                <div className="jh-quick-card__header">
                  <Briefcase size={20} />
                  <h3>Tuyển Dụng Dài Hạn</h3>
                  <ChevronRight size={18} className="jh-quick-card__arrow" />
                </div>
                <div className="jh-quick-card__stats">
                  <div className="jh-quick-card__stat">
                    <span className="jh-quick-card__stat-value">
                      {stats.ftOpen}
                    </span>
                    <span className="jh-quick-card__stat-label">Đang mở</span>
                  </div>
                  <div className="jh-quick-card__stat">
                    <span className="jh-quick-card__stat-value">
                      {stats.ftClosed}
                    </span>
                    <span className="jh-quick-card__stat-label">Đã đóng</span>
                  </div>
                  <div className="jh-quick-card__stat">
                    <span className="jh-quick-card__stat-value">
                      {stats.ftApplicants}
                    </span>
                    <span className="jh-quick-card__stat-label">Ứng viên</span>
                  </div>
                </div>
                {ftJobs.length > 0 && (
                  <div className="jh-quick-card__recent">
                    <span className="jh-quick-card__recent-label">
                      Tin mới nhất:
                    </span>
                    <span className="jh-quick-card__recent-title">
                      {ftJobs[0]?.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Short-term Quick */}
              <div
                className="jh-quick-card jh-quick-card--amber"
                onClick={() => setActivePanel("shortterm")}
              >
                <div className="jh-quick-card__header">
                  <Zap size={20} />
                  <h3>Việc Ngắn Hạn / Gig</h3>
                  <ChevronRight size={18} className="jh-quick-card__arrow" />
                </div>
                <div className="jh-quick-card__stats">
                  <div className="jh-quick-card__stat">
                    <span className="jh-quick-card__stat-value">
                      {stats.stPublished}
                    </span>
                    <span className="jh-quick-card__stat-label">
                      Đang tuyển
                    </span>
                  </div>
                  <div className="jh-quick-card__stat">
                    <span className="jh-quick-card__stat-value">
                      {stats.stInProgress}
                    </span>
                    <span className="jh-quick-card__stat-label">Đang làm</span>
                  </div>
                  <div className="jh-quick-card__stat">
                    <span className="jh-quick-card__stat-value">
                      {stats.stCompleted}
                    </span>
                    <span className="jh-quick-card__stat-label">
                      Hoàn thành
                    </span>
                  </div>
                </div>
                {stJobs.length > 0 && (
                  <div className="jh-quick-card__recent">
                    <span className="jh-quick-card__recent-label">
                      Tin mới nhất:
                    </span>
                    <span className="jh-quick-card__recent-title">
                      {stJobs[0]?.title}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Loading overlay */}
            {isLoading && (
              <div className="jh-overview__loading">
                <div className="stj-loading__spinner" />
                <span>Đang cập nhật dữ liệu...</span>
              </div>
            )}
          </div>
        )}

        {/* ==================== FULL-TIME PANEL ==================== */}
        {activePanel === "fulltime" && (
          <div className="jh-panel">
            <div className="jh-panel-header">
              <div>
                <h2 className="jh-panel-header__title">
                  <Briefcase size={24} />
                  Quản Lý Tuyển Dụng Dài Hạn
                </h2>
                <p className="jh-panel-header__desc">
                  {stats.ftOpen} tin đang mở · {stats.ftApplicants} ứng viên ·{" "}
                  {stats.ftTotal} tổng tin
                </p>
              </div>
              <div className="jh-panel-header__actions">
                <button
                  className="jh-panel-header__btn jh-panel-header__btn--primary"
                  onClick={() => setShowCreateFulltime(!showCreateFulltime)}
                >
                  {showCreateFulltime ? (
                    "← Danh sách"
                  ) : (
                    <>
                      <Plus size={16} /> Đăng Mới
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mini Stats */}
            <div className="jh-mini-stats">
              <div className="jh-mini-stat jh-mini-stat--blue">
                <FileText size={16} /> <strong>{stats.ftTotal}</strong> Tổng
              </div>
              <div className="jh-mini-stat jh-mini-stat--green">
                <CheckCircle size={16} /> <strong>{stats.ftOpen}</strong> Đang
                mở
              </div>
              <div className="jh-mini-stat jh-mini-stat--gray">
                <Clock size={16} /> <strong>{stats.ftClosed}</strong> Đã đóng
              </div>
              <div className="jh-mini-stat jh-mini-stat--purple">
                <Users size={16} /> <strong>{stats.ftApplicants}</strong> Ứng
                viên
              </div>
            </div>

            {showCreateFulltime ? (
              <MissionLaunchPad onMissionLaunched={handleMissionLaunched} />
            ) : (
              <OperationLog refreshTrigger={refreshTrigger} />
            )}
          </div>
        )}

        {/* ==================== SHORT-TERM PANEL ==================== */}
        {activePanel === "shortterm" && (
          <div className="jh-panel">
            <div className="jh-panel-header">
              <div>
                <h2 className="jh-panel-header__title">
                  <Zap size={24} />
                  Quản Lý Việc Ngắn Hạn
                </h2>
                <p className="jh-panel-header__desc">
                  {stats.stPublished} đang tuyển · {stats.stInProgress} đang
                  thực hiện · {stats.stCompleted} hoàn thành
                </p>
              </div>
            </div>

            {/* Mini Stats */}
            <div className="jh-mini-stats">
              <div className="jh-mini-stat jh-mini-stat--amber">
                <Zap size={16} /> <strong>{stats.stTotal}</strong> Tổng
              </div>
              <div className="jh-mini-stat jh-mini-stat--cyan">
                <ArrowUpRight size={16} /> <strong>{stats.stPublished}</strong>{" "}
                Đang tuyển
              </div>
              <div className="jh-mini-stat jh-mini-stat--blue">
                <Clock size={16} /> <strong>{stats.stInProgress}</strong> Đang
                làm
              </div>
              <div className="jh-mini-stat jh-mini-stat--green">
                <CheckCircle size={16} /> <strong>{stats.stCompleted}</strong>{" "}
                Hoàn thành
              </div>
            </div>

            <ShortTermJobManager
              onCreateNew={() =>
                (window.location.href = "/short-term-jobs/create")
              }
            />
          </div>
        )}

        {/* ==================== REGULATIONS PANEL ==================== */}
        {activePanel === "regulations" && (
          <RegulationsTab />
        )}
      </main>
    </div>
  );
};

export default JobManagementHub;
