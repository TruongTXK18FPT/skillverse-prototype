import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Zap,
  Users,
  Calendar,
  Plus,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  PieChart,
  BarChart3,
  Activity,
  Bell,
  Eye,
  Crown,
} from "lucide-react";
import OperationLog from "./OperationLog";
import MissionLaunchPad from "./MissionLaunchPad";
import ShortTermLaunchPad from "./ShortTermLaunchPad";
import ShortTermJobManager from "./ShortTermJobManager";
import MercenaryRadar from "./MercenaryRadar";
import SubscriptionWidget from "./SubscriptionWidget";
import RecruiterSeminarManager from "../../pages/main/RecruiterSeminarManager";
import portfolioService from "../../services/portfolioService";
import {
  FreelancerCardDisplay,
  CandidateSummaryDTO,
} from "../../data/portfolioDTOs";
import jobService from "../../services/jobService";
import shortTermJobService from "../../services/shortTermJobService";
import { JobPostingResponse, JobStatus } from "../../data/jobDTOs";
import {
  ShortTermJobResponse,
  ShortTermJobStatus,
} from "../../types/ShortTermJob";
import "./fleet-styles.css";
import "./recruiter-hub.css";

// ====================================================================
// TYPES
// ====================================================================
type RecruiterSection =
  | "overview"
  | "fulltime"
  | "shortterm"
  | "candidates"
  | "seminar";

interface Stats {
  ftTotal: number;
  ftOpen: number;
  ftClosed: number;
  ftApplicants: number;
  stTotal: number;
  stPublished: number;
  stPendingApproval: number;
  stInProgress: number;
  stCompleted: number;
  stApplicants: number;
  totalJobs: number;
  totalApplicants: number;
}

// ====================================================================
// MINI CHART COMPONENTS (inline — no external dep)
// ====================================================================

const DonutChart: React.FC<{
  segments: { value: number; color: string; label: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: number;
}> = ({ segments, size = 130, centerLabel, centerValue }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="rh-donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="rh-donut__svg">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.08)"
          strokeWidth="14"
        />
        {total > 0 &&
          segments.map((seg, i) => {
            const pct = seg.value / total;
            const dashLen = pct * circ;
            const dashGap = circ - dashLen;
            const cur = offset;
            offset += dashLen;
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
                strokeDashoffset={-cur}
                strokeLinecap="round"
                className="rh-donut__segment"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            );
          })}
      </svg>
      <div className="rh-donut__center">
        <span className="rh-donut__val">{centerValue ?? total}</span>
        {centerLabel && <span className="rh-donut__lbl">{centerLabel}</span>}
      </div>
    </div>
  );
};

const BarChart: React.FC<{
  bars: { label: string; value: number; color: string }[];
  maxValue?: number;
}> = ({ bars, maxValue }) => {
  const max = maxValue || Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="rh-barchart">
      {bars.map((bar, i) => (
        <div key={i} className="rh-barchart__item">
          <span className="rh-barchart__label">{bar.label}</span>
          <div className="rh-barchart__track">
            <div
              className="rh-barchart__fill"
              style={{
                width: `${(bar.value / max) * 100}%`,
                background: bar.color,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          </div>
          <span className="rh-barchart__val">{bar.value}</span>
        </div>
      ))}
    </div>
  );
};

// ====================================================================
// MAIN COMPONENT
// ====================================================================
const CommandDeck: React.FC = () => {
  const [section, setSection] = useState<RecruiterSection>("overview");
  const [showCreateFT, setShowCreateFT] = useState(false);
  const [showCreateST, setShowCreateST] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [ftJobs, setFtJobs] = useState<JobPostingResponse[]>([]);
  const [stJobs, setStJobs] = useState<ShortTermJobResponse[]>([]);
  const [freelancers, setFreelancers] = useState<FreelancerCardDisplay[]>([]);
  const [radarPage, setRadarPage] = useState(0);
  const [radarTotalPages, setRadarTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
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
    } catch (err) {
      console.error("Failed to fetch recruiter data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const fetchCandidates = useCallback(async (page: number) => {
    try {
      const result = await portfolioService.getCandidates(page, 8);
      setFreelancers(mapCandidates(result.content));
      setRadarTotalPages(result.totalPages);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    }
  }, []);

  useEffect(() => {
    if (section === "candidates") fetchCandidates(radarPage);
  }, [section, radarPage, fetchCandidates]);

  const mapCandidates = (
    candidates: CandidateSummaryDTO[],
  ): FreelancerCardDisplay[] =>
    candidates.map((c) => ({
      id: c.userId,
      name: c.fullName || "Người dùng Skillverse",
      professionalTitle: c.professionalTitle || "Freelancer",
      skills: (() => {
        try {
          return JSON.parse(c.topSkills || "[]");
        } catch {
          return [];
        }
      })(),
      rating: 0,
      completedProjects: c.totalProjects || 0,
      hourlyRate: c.hourlyRate || 0,
      avatar: c.avatarUrl,
      isHighlighted: c.isHighlighted,
      customUrlSlug: c.customUrlSlug,
    }));

  // ====================================================================
  // COMPUTED STATS
  // ====================================================================
  const stats: Stats = {
    ftTotal: ftJobs.length,
    ftOpen: ftJobs.filter((j) => j.status === JobStatus.OPEN).length,
    ftClosed: ftJobs.filter((j) => j.status === JobStatus.CLOSED).length,
    ftApplicants: ftJobs.reduce((s, j) => s + (j.applicantCount || 0), 0),
    stTotal: stJobs.length,
    stPublished: stJobs.filter((j) => j.status === ShortTermJobStatus.PUBLISHED)
      .length,
    stPendingApproval: stJobs.filter(
      (j) => j.status === ShortTermJobStatus.PENDING_APPROVAL,
    ).length,
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
    stApplicants: stJobs.reduce((s, j) => s + (j.applicantCount || 0), 0),
    totalJobs: ftJobs.length + stJobs.length,
    totalApplicants:
      ftJobs.reduce((s, j) => s + (j.applicantCount || 0), 0) +
      stJobs.reduce((s, j) => s + (j.applicantCount || 0), 0),
  };

  const jobsNeedingReview = ftJobs.filter(
    (j) => j.status === JobStatus.OPEN && (j.applicantCount || 0) > 0,
  );
  const pendingCount = jobsNeedingReview.reduce(
    (s, j) => s + (j.applicantCount || 0),
    0,
  );

  // ====================================================================
  // NAV CONFIG
  // ====================================================================
  type NavItem = {
    id: RecruiterSection;
    icon: React.ReactNode;
    label: string;
    badge?: number;
    alert?: boolean;
    color: string;
    rgb: string;
  };
  const navItems: NavItem[] = [
    {
      id: "overview",
      icon: <LayoutDashboard size={18} />,
      label: "Tổng Quan",
      badge: pendingCount > 0 ? pendingCount : undefined,
      alert: pendingCount > 0,
      color: "#06b6d4",
      rgb: "6,182,212",
    },
    {
      id: "fulltime",
      icon: <Briefcase size={18} />,
      label: "Tuyển Dụng Dài Hạn",
      badge: stats.ftOpen || undefined,
      color: "#3b82f6",
      rgb: "59,130,246",
    },
    {
      id: "shortterm",
      icon: <Zap size={18} />,
      label: "Việc Ngắn Hạn",
      badge: stats.stPublished + stats.stPendingApproval || undefined,
      color: "#f59e0b",
      rgb: "245,158,11",
    },
    {
      id: "candidates",
      icon: <Users size={18} />,
      label: "Tìm Ứng Viên",
      color: "#a78bfa",
      rgb: "167,139,250",
    },
    // {
    //   id: "seminar",
    //   icon: <Calendar size={18} />,
    //   label: "Hội Thảo",
    //   color: "#2dd4bf",
    //   rgb: "45,212,191",
    // },
  ];

  // Premium link - React Router navigation
  const premiumLink = (
    <Link
      to="/premium"
      className="rh-nav__item"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
        color: "#a78bfa",
        background: "rgba(167, 139, 250, 0.1)",
        textDecoration: "none",
        marginTop: "0.5rem",
      }}
    >
      <Crown size={18} />
      {!sidebarCollapsed && (
        <span style={{ fontWeight: 500 }}>Nâng Cấp Premium</span>
      )}
    </Link>
  );

  const changeSection = (s: RecruiterSection) => {
    setSection(s);
    setShowCreateFT(false);
    setShowCreateST(false);
  };

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <div
      className={`rh-shell ${sidebarCollapsed ? "rh-shell--collapsed" : ""}`}
    >
      {/* ========================= SIDEBAR ========================= */}
      <nav className={`rh-nav ${sidebarCollapsed ? "rh-nav--collapsed" : ""}`}>
        <div className="rh-nav__brand">
          <div className="rh-nav__brand-icon">
            <BarChart3 size={20} />
          </div>
          {!sidebarCollapsed && (
            <div className="rh-nav__brand-text">
              <span className="rh-nav__brand-title">Recruiter Hub</span>
              <span className="rh-nav__brand-sub">Trung tâm tuyển dụng</span>
            </div>
          )}
          <button
            className="rh-nav__collapse-btn"
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        </div>

        {/* Inline notification chip */}
        {pendingCount > 0 && (
          <div
            className="rh-nav__notif-chip"
            onClick={() => changeSection("overview")}
          >
            <Bell size={15} color="#fca5a5" />
            <div className="rh-nav__notif-chip-text">
              <div className="rh-nav__notif-chip-title">
                {pendingCount} đơn ứng tuyển mới
              </div>
              <div className="rh-nav__notif-chip-sub">
                Cần xem xét duyệt ngay
              </div>
            </div>
          </div>
        )}

        <div className="rh-nav__section-label" style={{ marginTop: "0.75rem" }}>
          Điều Hướng
        </div>
        <div className="rh-nav__list">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`rh-nav__item ${section === item.id ? "rh-nav__item--active" : ""}`}
              style={
                {
                  "--rh-item-color": item.color,
                  "--rh-item-rgb": item.rgb,
                } as React.CSSProperties
              }
              onClick={() => changeSection(item.id)}
            >
              <span className="rh-nav__item-icon">{item.icon}</span>
              <span className="rh-nav__item-label">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`rh-nav__badge ${item.alert ? "rh-nav__badge--alert" : ""}`}
                >
                  {item.badge}
                </span>
              )}
              <ChevronRight size={13} style={{ opacity: 0.3, flexShrink: 0 }} />
            </button>
          ))}
        </div>

        <div className="rh-nav__divider" />

        {/* Premium Upgrade Link */}
        {premiumLink}

        <div className="rh-nav__section-label">Thao Tác Nhanh</div>
        <div className="rh-nav__actions">
          <button
            className="rh-nav__action-btn rh-nav__action-btn--blue"
            onClick={() => {
              changeSection("fulltime");
              setShowCreateFT(true);
            }}
          >
            <Plus size={14} /> Đăng Tin Dài Hạn
          </button>
          <button
            className="rh-nav__action-btn rh-nav__action-btn--amber"
            onClick={() => {
              changeSection("shortterm");
              setShowCreateST(true);
            }}
          >
            <Zap size={14} /> Đăng Tin Ngắn Hạn
          </button>
        </div>
      </nav>

      {/* ========================= CONTENT ========================= */}
      <main className="rh-content">
        {/* ---------- OVERVIEW ---------- */}
        {section === "overview" && (
          <div className="rh-panel">
            {pendingCount > 0 && (
              <div className="rh-alert-banner">
                <div className="rh-alert-banner__icon">
                  <AlertTriangle size={20} />
                </div>
                <div className="rh-alert-banner__body">
                  <p className="rh-alert-banner__title">
                    Bạn có {pendingCount} đơn ứng tuyển mới cần xem xét duyệt
                    ngay!
                  </p>
                  <p className="rh-alert-banner__desc">
                    {jobsNeedingReview.length} tin tuyển dụng đang có ứng viên
                    chờ phản hồi —&nbsp;
                    {jobsNeedingReview
                      .slice(0, 2)
                      .map((j) => `"${j.title}"`)
                      .join(", ")}
                    {jobsNeedingReview.length > 2
                      ? ` và ${jobsNeedingReview.length - 2} tin khác`
                      : ""}
                  </p>
                </div>
                <button
                  className="rh-alert-banner__cta"
                  onClick={() => changeSection("fulltime")}
                >
                  <Eye size={14} style={{ marginRight: 6 }} />
                  Xem Ngay
                </button>
              </div>
            )}

            <div className="rh-panel-header">
              <div className="rh-panel-header__left">
                <h2
                  className="rh-panel-header__title"
                  style={
                    { "--rh-item-color": "#06b6d4" } as React.CSSProperties
                  }
                >
                  <LayoutDashboard size={22} /> Tổng Quan Tuyển Dụng
                </h2>
                <p className="rh-panel-header__subtitle">
                  Thống kê toàn bộ hoạt động tuyển dụng dài hạn và ngắn hạn
                </p>
              </div>
              <div className="rh-panel-header__actions">
                <button
                  className="rh-panel-btn rh-panel-btn--secondary"
                  onClick={() => {
                    setRefreshTrigger((p) => p + 1);
                    fetchData();
                  }}
                >
                  <Activity size={14} /> Làm mới
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="rh-loading">
                <div className="rh-spinner" />
                <span>Đang tải dữ liệu...</span>
              </div>
            ) : (
              <>
                <div className="rh-stat-grid">
                  <div className="rh-stat-card rh-stat-card--cyan">
                    <div className="rh-stat-card__icon">
                      <FileText size={22} />
                    </div>
                    <div className="rh-stat-card__info">
                      <span className="rh-stat-card__value">
                        {stats.totalJobs}
                      </span>
                      <span className="rh-stat-card__label">
                        Tổng Công Việc
                      </span>
                      <span className="rh-stat-card__delta">
                        DH: {stats.ftTotal} · NH: {stats.stTotal}
                      </span>
                    </div>
                    <TrendingUp
                      size={16}
                      style={{ color: "#06b6d4", opacity: 0.5 }}
                    />
                  </div>
                  <div className="rh-stat-card rh-stat-card--blue">
                    <div className="rh-stat-card__icon">
                      <Briefcase size={22} />
                    </div>
                    <div className="rh-stat-card__info">
                      <span className="rh-stat-card__value">
                        {stats.ftOpen}
                      </span>
                      <span className="rh-stat-card__label">
                        Tin Dài Hạn Đang Mở
                      </span>
                      <span className="rh-stat-card__delta">
                        {stats.ftClosed} đã đóng
                      </span>
                    </div>
                    <Activity
                      size={16}
                      style={{ color: "#3b82f6", opacity: 0.5 }}
                    />
                  </div>
                  <div className="rh-stat-card rh-stat-card--amber">
                    <div className="rh-stat-card__icon">
                      <Zap size={22} />
                    </div>
                    <div className="rh-stat-card__info">
                      <span className="rh-stat-card__value">
                        {stats.stPublished}
                      </span>
                      <span className="rh-stat-card__label">
                        Ngắn Hạn Đang Tuyển
                      </span>
                      <span className="rh-stat-card__delta">
                        {stats.stInProgress} đang thực hiện
                      </span>
                    </div>
                    <ArrowUpRight
                      size={16}
                      style={{ color: "#f59e0b", opacity: 0.5 }}
                    />
                  </div>
                  <div className="rh-stat-card rh-stat-card--purple">
                    <div className="rh-stat-card__icon">
                      <Users size={22} />
                    </div>
                    <div className="rh-stat-card__info">
                      <span className="rh-stat-card__value">
                        {stats.totalApplicants}
                      </span>
                      <span className="rh-stat-card__label">Tổng Ứng Viên</span>
                      {pendingCount > 0 && (
                        <span
                          className="rh-stat-card__delta"
                          style={{ color: "#fca5a5" }}
                        >
                          ⚠ {pendingCount} chờ duyệt
                        </span>
                      )}
                    </div>
                    <TrendingUp
                      size={16}
                      style={{ color: "#a78bfa", opacity: 0.5 }}
                    />
                  </div>
                </div>

                <div className="rh-section-divider">Gói Dịch Vụ & Quota</div>
                <SubscriptionWidget />

                <div className="rh-charts-row">
                  <div className="rh-chart-box">
                    <h3 className="rh-chart-box__title">
                      <PieChart size={16} /> Phân Bổ Công Việc
                    </h3>
                    <div className="rh-chart-box__body">
                      <DonutChart
                        segments={[
                          {
                            value: stats.ftOpen,
                            color: "#3b82f6",
                            label: "DH Mở",
                          },
                          {
                            value: stats.ftClosed,
                            color: "#475569",
                            label: "DH Đóng",
                          },
                          {
                            value: stats.stPublished,
                            color: "#f59e0b",
                            label: "NH Tuyển",
                          },
                          {
                            value: stats.stInProgress,
                            color: "#06b6d4",
                            label: "NH Làm",
                          },
                          {
                            value: stats.stCompleted,
                            color: "#22c55e",
                            label: "NH Xong",
                          },
                        ]}
                        centerLabel="Tổng"
                        centerValue={stats.totalJobs}
                      />
                      <div className="rh-chart-legend">
                        {[
                          { c: "#3b82f6", l: `DH Đang mở (${stats.ftOpen})` },
                          { c: "#475569", l: `DH Đã đóng (${stats.ftClosed})` },
                          {
                            c: "#f59e0b",
                            l: `NH Đang tuyển (${stats.stPublished})`,
                          },
                          {
                            c: "#06b6d4",
                            l: `NH Thực hiện (${stats.stInProgress})`,
                          },
                          {
                            c: "#22c55e",
                            l: `NH Hoàn thành (${stats.stCompleted})`,
                          },
                        ].map((i, k) => (
                          <div key={k} className="rh-legend-item">
                            <span
                              className="rh-legend-dot"
                              style={{ background: i.c }}
                            />
                            {i.l}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rh-chart-box">
                    <h3 className="rh-chart-box__title">
                      <BarChart3 size={16} /> So Sánh Hiệu Quả
                    </h3>
                    <BarChart
                      bars={[
                        {
                          label: "Tin DH tổng",
                          value: stats.ftTotal,
                          color: "#3b82f6",
                        },
                        {
                          label: "Tin NH tổng",
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

                <div className="rh-section-divider">Truy cập nhanh</div>

                <div className="rh-quick-row">
                  <div
                    className="rh-quick-card rh-quick-card--blue"
                    onClick={() => changeSection("fulltime")}
                  >
                    <div className="rh-quick-card__header">
                      <Briefcase size={18} />
                      <h3>Tuyển Dụng Dài Hạn</h3>
                      <ChevronRight
                        size={16}
                        className="rh-quick-card__arrow"
                      />
                    </div>
                    <div className="rh-quick-card__stats">
                      <div className="rh-quick-card__stat">
                        <span className="rh-quick-card__stat-value">
                          {stats.ftOpen}
                        </span>
                        <span className="rh-quick-card__stat-label">
                          Đang mở
                        </span>
                      </div>
                      <div className="rh-quick-card__stat">
                        <span className="rh-quick-card__stat-value">
                          {stats.ftClosed}
                        </span>
                        <span className="rh-quick-card__stat-label">
                          Đã đóng
                        </span>
                      </div>
                      <div className="rh-quick-card__stat">
                        <span className="rh-quick-card__stat-value">
                          {stats.ftApplicants}
                        </span>
                        <span className="rh-quick-card__stat-label">
                          Ứng viên
                        </span>
                      </div>
                    </div>
                    {ftJobs[0] && (
                      <div className="rh-quick-card__recent">
                        <span className="rh-quick-card__recent-lbl">
                          Mới nhất:
                        </span>
                        <span className="rh-quick-card__recent-title">
                          {ftJobs[0].title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className="rh-quick-card rh-quick-card--amber"
                    onClick={() => changeSection("shortterm")}
                  >
                    <div className="rh-quick-card__header">
                      <Zap size={18} />
                      <h3>Việc Ngắn Hạn / Gig</h3>
                      <ChevronRight
                        size={16}
                        className="rh-quick-card__arrow"
                      />
                    </div>
                    <div className="rh-quick-card__stats">
                      <div className="rh-quick-card__stat">
                        <span className="rh-quick-card__stat-value">
                          {stats.stPublished}
                        </span>
                        <span className="rh-quick-card__stat-label">
                          Đang tuyển
                        </span>
                      </div>
                      <div className="rh-quick-card__stat">
                        <span className="rh-quick-card__stat-value">
                          {stats.stInProgress}
                        </span>
                        <span className="rh-quick-card__stat-label">
                          Đang làm
                        </span>
                      </div>
                      <div className="rh-quick-card__stat">
                        <span className="rh-quick-card__stat-value">
                          {stats.stCompleted}
                        </span>
                        <span className="rh-quick-card__stat-label">
                          Hoàn thành
                        </span>
                      </div>
                    </div>
                    {stJobs[0] && (
                      <div className="rh-quick-card__recent">
                        <span className="rh-quick-card__recent-lbl">
                          Mới nhất:
                        </span>
                        <span className="rh-quick-card__recent-title">
                          {stJobs[0].title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className="rh-quick-card rh-quick-card--purple"
                    onClick={() => changeSection("candidates")}
                  >
                    <div className="rh-quick-card__header">
                      <Users size={18} />
                      <h3>Tìm Ứng Viên</h3>
                      <ChevronRight
                        size={16}
                        className="rh-quick-card__arrow"
                      />
                    </div>
                    <div className="rh-quick-card__stats">
                      <div className="rh-quick-card__stat">
                        <span className="rh-quick-card__stat-value">
                          {stats.totalApplicants}
                        </span>
                        <span className="rh-quick-card__stat-label">
                          Tổng ứng viên
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Hội Thảo quick card - hidden */}
                </div>
              </>
            )}
          </div>
        )}

        {/* ---------- FULL-TIME ---------- */}
        {section === "fulltime" && (
          <div
            className="rh-panel"
            style={{ "--rh-item-color": "#3b82f6" } as React.CSSProperties}
          >
            <div className="rh-panel-header">
              <div className="rh-panel-header__left">
                <h2 className="rh-panel-header__title">
                  <Briefcase size={22} /> Quản Lý Tuyển Dụng Dài Hạn
                </h2>
                <p className="rh-panel-header__subtitle">
                  {stats.ftOpen} đang mở · {stats.ftClosed} đã đóng ·{" "}
                  {stats.ftApplicants} ứng viên
                </p>
              </div>
              <div className="rh-panel-header__actions">
                <button
                  className={`rh-panel-btn ${showCreateFT ? "rh-panel-btn--secondary" : "rh-panel-btn--primary"}`}
                  onClick={() => setShowCreateFT((v) => !v)}
                >
                  {showCreateFT ? (
                    "← Danh sách tin"
                  ) : (
                    <>
                      <Plus size={14} /> Đăng Tin Mới
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="rh-mini-stats">
              <div className="rh-mini-stat rh-mini-stat--blue">
                <FileText size={14} />
                <strong>{stats.ftTotal}</strong> Tổng
              </div>
              <div className="rh-mini-stat rh-mini-stat--green">
                <CheckCircle size={14} />
                <strong>{stats.ftOpen}</strong> Đang mở
              </div>
              <div className="rh-mini-stat rh-mini-stat--gray">
                <Clock size={14} />
                <strong>{stats.ftClosed}</strong> Đã đóng
              </div>
              <div className="rh-mini-stat rh-mini-stat--purple">
                <Users size={14} />
                <strong>{stats.ftApplicants}</strong> Ứng viên
              </div>
            </div>
            {showCreateFT ? (
              <MissionLaunchPad
                onMissionLaunched={() => {
                  setRefreshTrigger((p) => p + 1);
                  setShowCreateFT(false);
                }}
              />
            ) : (
              <OperationLog refreshTrigger={refreshTrigger} />
            )}
          </div>
        )}

        {/* ---------- SHORT-TERM ---------- */}
        {section === "shortterm" && (
          <div
            className="rh-panel"
            style={{ "--rh-item-color": "#f59e0b" } as React.CSSProperties}
          >
            <div className="rh-panel-header">
              <div className="rh-panel-header__left">
                <h2 className="rh-panel-header__title">
                  <Zap size={22} /> Quản Lý Việc Ngắn Hạn
                </h2>
                <p className="rh-panel-header__subtitle">
                  {stats.stPendingApproval > 0 &&
                    `${stats.stPendingApproval} chờ duyệt · `}
                  {stats.stPublished} đang tuyển · {stats.stInProgress} đang
                  thực hiện · {stats.stCompleted} hoàn thành
                </p>
              </div>
              <div className="rh-panel-header__actions">
                <button
                  className={`rh-panel-btn ${showCreateST ? "rh-panel-btn--secondary" : "rh-panel-btn--amber"}`}
                  onClick={() => setShowCreateST((v) => !v)}
                >
                  {showCreateST ? (
                    "← Danh sách tin"
                  ) : (
                    <>
                      <Plus size={14} /> Đăng Tin Mới
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="rh-mini-stats">
              <div className="rh-mini-stat rh-mini-stat--amber">
                <Zap size={14} />
                <strong>{stats.stTotal}</strong> Tổng
              </div>
              <div className="rh-mini-stat rh-mini-stat--cyan">
                <ArrowUpRight size={14} />
                <strong>{stats.stPublished}</strong> Đang tuyển
              </div>
              <div className="rh-mini-stat rh-mini-stat--blue">
                <Clock size={14} />
                <strong>{stats.stInProgress}</strong> Đang làm
              </div>
              <div className="rh-mini-stat rh-mini-stat--green">
                <CheckCircle size={14} />
                <strong>{stats.stCompleted}</strong> Hoàn thành
              </div>
            </div>
            {showCreateST ? (
              <ShortTermLaunchPad
                onJobCreated={() => {
                  setRefreshTrigger((p) => p + 1);
                  setShowCreateST(false);
                }}
              />
            ) : (
              <ShortTermJobManager onCreateNew={() => setShowCreateST(true)} />
            )}
          </div>
        )}

        {/* ---------- CANDIDATES ---------- */}
        {section === "candidates" && (
          <div
            className="rh-panel"
            style={{ "--rh-item-color": "#a78bfa" } as React.CSSProperties}
          >
            <div className="rh-panel-header">
              <div className="rh-panel-header__left">
                <h2 className="rh-panel-header__title">
                  <Users size={22} /> Tìm Kiếm Ứng Viên
                </h2>
                <p className="rh-panel-header__subtitle">
                  Duyệt hồ sơ và tìm kiếm người phù hợp với vị trí tuyển dụng
                </p>
              </div>
            </div>
            <MercenaryRadar
              freelancers={freelancers}
              pagination={{
                page: radarPage,
                totalPages: radarTotalPages,
                onPageChange: setRadarPage,
              }}
            />
          </div>
        )}

        {/* ---------- SEMINARS (hidden) ---------- */}

        {/* ========================= FOOTER ========================= */}
        <footer className="rh-main-footer">
          <div className="rh-main-footer__inner">
            <div className="rh-main-footer__brand">
              <div className="rh-main-footer__logo">SV</div>
              <div className="rh-main-footer__brand-text">
                <span className="rh-main-footer__brand-name">
                  SkillVerse Recruiter
                </span>
                <span className="rh-main-footer__brand-sub">
                  © {new Date().getFullYear()} — Recruitment Management Platform
                </span>
              </div>
            </div>
            <div className="rh-main-footer__links">
              <a href="/about" className="rh-main-footer__link">
                Giới thiệu
              </a>
              <a href="/help" className="rh-main-footer__link">
                Trợ giúp
              </a>
              <a href="/terms-of-service" className="rh-main-footer__link">
                Điều khoản
              </a>
              <a href="/privacy-policy" className="rh-main-footer__link">
                Bảo mật
              </a>
            </div>
            <div className="rh-main-footer__status">
              <span className="rh-main-footer__status-dot" />
              Hệ thống hoạt động bình thường
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default CommandDeck;
