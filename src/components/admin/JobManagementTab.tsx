import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { AdminFullTimeJobStats, AdminJobStats } from "../../data/adminDTOs";
import adminService from "../../services/adminService";
import { useToast } from "../../hooks/useToast";
import Toast from "../shared/Toast";
import JobStatsView from "./JobStatsView";
import FullTimeJobsView from "./FullTimeJobsView";
import ShortTermJobsView from "./ShortTermJobsView";
import JobApprovalView from "./JobApprovalView";
import JobDisputesView from "./JobDisputesView";
import "./JobManagementTab.css";

type JobManagementTabKey =
  | "stats"
  | "fulltime"
  | "shortterm"
  | "approval"
  | "disputes";

const TAB_CONFIG: Array<{
  key: JobManagementTabKey;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    key: "stats",
    label: "Tổng quan",
    icon: <BarChart3 size={15} />,
    description: "Phân tích hợp nhất",
  },
  {
    key: "fulltime",
    label: "Full-time",
    icon: <BriefcaseBusiness size={15} />,
    description: "Quản lý tuyển dụng dài hạn",
  },
  {
    key: "shortterm",
    label: "Short-term",
    icon: <Timer size={15} />,
    description: "Quản lý mission ngắn hạn",
  },
  {
    key: "approval",
    label: "Duyệt tin",
    icon: <CheckCircle2 size={15} />,
    description: "Hàng chờ duyệt hợp nhất",
  },
  {
    key: "disputes",
    label: "Khiếu nại",
    icon: <ShieldAlert size={15} />,
    description: "Xử lý tranh chấp short-term",
  },
];

const resolveTabFromQuery = (raw?: string | null): JobManagementTabKey => {
  if (!raw) return "stats";

  const normalized = raw.trim().toLowerCase();

  if (normalized === "stats") return "stats";
  if (normalized === "all") return "shortterm";
  if (normalized === "fulltime") return "fulltime";
  if (normalized === "shortterm") return "shortterm";
  if (normalized === "approve" || normalized === "approval") return "approval";
  if (normalized === "disputes") return "disputes";

  return "stats";
};

export const JobManagementTab: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast, isVisible, hideToast, showError } = useToast();

  const [activeTab, setActiveTab] = useState<JobManagementTabKey>("stats");
  const [refreshingMeta, setRefreshingMeta] = useState(false);
  const [fullTimeStats, setFullTimeStats] =
    useState<AdminFullTimeJobStats | null>(null);
  const [shortTermStats, setShortTermStats] = useState<AdminJobStats | null>(
    null,
  );
  const [pendingFullTimeCount, setPendingFullTimeCount] = useState(0);
  const [pendingShortTermCount, setPendingShortTermCount] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const refreshDashboardMeta = useCallback(async () => {
    setRefreshingMeta(true);
    try {
      const [fullStats, shortStats, pendingFullTime, pendingShortTerm] =
        await Promise.all([
          adminService.getFullTimeJobStats(),
          adminService.getJobStats(),
          adminService.getPendingJobs(),
          adminService.getPendingShortTermJobs(),
        ]);

      setFullTimeStats(fullStats);
      setShortTermStats(shortStats);
      setPendingFullTimeCount((pendingFullTime ?? []).length);
      setPendingShortTermCount((pendingShortTerm ?? []).length);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      console.error("Failed to load job dashboard metadata", error);
      showError("Lỗi", "Không thể tải dữ liệu quản lý việc làm");
    } finally {
      setRefreshingMeta(false);
    }
  }, [showError]);

  useEffect(() => {
    const requestedTab = searchParams.get("subTab");
    setActiveTab(resolveTabFromQuery(requestedTab));
  }, [searchParams]);

  useEffect(() => {
    refreshDashboardMeta();
  }, [refreshDashboardMeta]);

  const totalJobs =
    (fullTimeStats?.totalJobs ?? 0) + (shortTermStats?.totalJobs ?? 0);
  const totalPending = pendingFullTimeCount + pendingShortTermCount;
  const disputedCount = shortTermStats?.disputedCount ?? 0;

  const activeTabMeta = useMemo(
    () => TAB_CONFIG.find((tab) => tab.key === activeTab) ?? TAB_CONFIG[0],
    [activeTab],
  );

  return (
    <div className="jmt-root">
      <header className="jmt-header">
        <div className="jmt-header__title-wrap">
          <h2 className="jmt-header__title">Job Management Control Center</h2>
          <p className="jmt-header__subtitle">
            Theo dõi và vận hành song song hai luồng Full-time và Short-term
            trong một giao diện neon tech thống nhất.
          </p>
        </div>

        <div className="jmt-header__actions">
          <button
            className="jmt-btn jmt-btn--ghost"
            onClick={refreshDashboardMeta}
            disabled={refreshingMeta}
          >
            {refreshingMeta ? (
              <Loader2 size={14} className="jmt-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Đồng bộ dữ liệu
          </button>
        </div>
      </header>

      <div className="jmt-summary-strip">
        <span className="jmt-summary-pill jmt-summary-pill--cyan">
          Tổng tin: {totalJobs}
        </span>
        <span className="jmt-summary-pill jmt-summary-pill--amber">
          Chờ duyệt: {totalPending}
        </span>
        <span className="jmt-summary-pill jmt-summary-pill--blue">
          Pending FT: {pendingFullTimeCount}
        </span>
        <span className="jmt-summary-pill jmt-summary-pill--teal">
          Pending ST: {pendingShortTermCount}
        </span>
        <span className="jmt-summary-pill jmt-summary-pill--red">
          Tranh chấp ST: {disputedCount}
        </span>
        {lastUpdatedAt ? (
          <span className="jmt-summary-pill jmt-summary-pill--muted">
            Cập nhật: {new Date(lastUpdatedAt).toLocaleTimeString("vi-VN")}
          </span>
        ) : null}
      </div>

      <nav className="jmt-tab-nav" aria-label="Job management tabs">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            className={`jmt-tab ${tab.key === activeTab ? "jmt-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="jmt-tab__icon">{tab.icon}</span>
            <span>
              <strong>{tab.label}</strong>
              <small>{tab.description}</small>
            </span>
            {tab.key === "approval" && totalPending > 0 ? (
              <span className="jmt-tab__count">{totalPending}</span>
            ) : null}
            {tab.key === "disputes" && disputedCount > 0 ? (
              <span className="jmt-tab__count jmt-tab__count--red">
                {disputedCount}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <section className="jmt-panel" aria-label={activeTabMeta.label}>
        {activeTab === "stats" ? (
          <JobStatsView
            fullTimeStats={fullTimeStats}
            shortTermStats={shortTermStats}
            loading={refreshingMeta}
            onRefresh={refreshDashboardMeta}
          />
        ) : null}

        {activeTab === "fulltime" ? (
          <FullTimeJobsView onDataChanged={refreshDashboardMeta} />
        ) : null}

        {activeTab === "shortterm" ? (
          <ShortTermJobsView onDataChanged={refreshDashboardMeta} />
        ) : null}

        {activeTab === "approval" ? (
          <JobApprovalView onDataChanged={refreshDashboardMeta} />
        ) : null}

        {activeTab === "disputes" ? (
          <JobDisputesView onDataChanged={refreshDashboardMeta} />
        ) : null}
      </section>

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
          useOverlay={toast.useOverlay}
          actionButton={toast.actionButton}
          secondaryActionButton={toast.secondaryActionButton}
        />
      )}
    </div>
  );
};

export default JobManagementTab;
