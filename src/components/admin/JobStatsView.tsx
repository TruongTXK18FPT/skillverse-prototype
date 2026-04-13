import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  CircleDollarSign,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { AdminFullTimeJobStats, AdminJobStats } from "../../data/adminDTOs";
import {
  formatCurrency,
  getFullTimeStatusLabel,
  getShortTermStatusLabel,
} from "./jobManagementCommon";

interface JobStatsViewProps {
  fullTimeStats: AdminFullTimeJobStats | null;
  shortTermStats: AdminJobStats | null;
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "#38bdf8",
  PENDING_APPROVAL: "#f59e0b",
  OPEN: "#22d3ee",
  REJECTED: "#f87171",
  CLOSED: "#60a5fa",
  DRAFT: "#64748b",
  PUBLISHED: "#06b6d4",
  APPLIED: "#22d3ee",
  SUBMITTED: "#a78bfa",
  UNDER_REVIEW: "#facc15",
  APPROVED: "#22c55e",
  COMPLETED: "#10b981",
  PAID: "#34d399",
  CANCELLED: "#94a3b8",
  DISPUTED: "#fb7185",
  ESCALATED: "#c084fc",
};

const URGENCY_COLORS: Record<string, string> = {
  NORMAL: "#22c55e",
  URGENT: "#f59e0b",
  VERY_URGENT: "#f97316",
  ASAP: "#ef4444",
};

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  REVIEWED: "Đã xem",
  ACCEPTED: "Đã nhận",
  INTERVIEW_SCHEDULED: "Đã lên lịch PV",
  INTERVIEWED: "Đã phỏng vấn",
  OFFER_SENT: "Đã gửi offer",
  OFFER_ACCEPTED: "Đã nhận offer",
  OFFER_REJECTED: "Từ chối offer",
  CONTRACT_SIGNED: "Đã ký hợp đồng",
  REJECTED: "Bị từ chối",
};

const chartTooltipStyle = {
  background: "rgba(5, 18, 36, 0.95)",
  border: "1px solid rgba(34, 211, 238, 0.28)",
  borderRadius: "10px",
  color: "#e0f2fe",
  fontSize: "12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
};

const chartTooltipLabelStyle = {
  color: "#bde9ff",
  fontWeight: 600,
};

const chartTooltipItemStyle = {
  color: "#e0f2fe",
};

export const JobStatsView: React.FC<JobStatsViewProps> = ({
  fullTimeStats,
  shortTermStats,
  loading,
  onRefresh,
}) => {
  const totalFullTimeJobs = fullTimeStats?.totalJobs ?? 0;
  const totalShortTermJobs = shortTermStats?.totalJobs ?? 0;
  const totalJobs = totalFullTimeJobs + totalShortTermJobs;

  const pendingApprovalCount =
    (fullTimeStats?.pendingApprovalCount ?? 0) +
    (shortTermStats?.pendingApprovalCount ?? 0);

  const totalApplicants = fullTimeStats?.totalApplicants ?? 0;
  const disputedCount = shortTermStats?.disputedCount ?? 0;
  const totalEscrowVolume = shortTermStats?.totalEscrowVolume ?? 0;

  const combinedStatusData = useMemo(() => {
    const shortTerm = Object.entries(shortTermStats?.byStatus ?? {}).map(
      ([status, count]) => ({
        status,
        name: `ST - ${getShortTermStatusLabel(status)}`,
        value: count,
      }),
    );

    const fullTime = Object.entries(fullTimeStats?.byStatus ?? {}).map(
      ([status, count]) => ({
        status,
        name: `FT - ${getFullTimeStatusLabel(status)}`,
        value: count,
      }),
    );

    return [...fullTime, ...shortTerm]
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [fullTimeStats?.byStatus, shortTermStats?.byStatus]);

  const workloadSplitData = useMemo(
    () => [
      { name: "Full-time", value: totalFullTimeJobs, color: "#3b82f6" },
      { name: "Short-term", value: totalShortTermJobs, color: "#06b6d4" },
    ],
    [totalFullTimeJobs, totalShortTermJobs],
  );

  const urgencyData = useMemo(
    () =>
      Object.entries(shortTermStats?.byUrgency ?? {})
        .map(([urgency, count]) => ({
          name:
            urgency === "VERY_URGENT"
              ? "Rất gấp"
              : urgency === "ASAP"
                ? "Ngay"
                : urgency === "URGENT"
                  ? "Gấp"
                  : "Bình thường",
          value: count,
          fill: URGENCY_COLORS[urgency] ?? "#22c55e",
        }))
        .filter((item) => item.value > 0),
    [shortTermStats?.byUrgency],
  );

  const applicationFunnelData = useMemo(
    () =>
      Object.entries(fullTimeStats?.applicationByStatus ?? {})
        .map(([status, count]) => ({
          name: APPLICATION_STATUS_LABELS[status] ?? status,
          value: count,
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
    [fullTimeStats?.applicationByStatus],
  );

  if (loading) {
    return (
      <div className="jmt-state-card">
        <Loader2 size={32} className="jmt-spin" />
        <p>Đang tải thống kê full-time và short-term...</p>
      </div>
    );
  }

  if (!fullTimeStats && !shortTermStats) {
    return (
      <div className="jmt-state-card">
        <p>Không có dữ liệu thống kê để hiển thị.</p>
        <button className="jmt-btn jmt-btn--ghost" onClick={onRefresh}>
          <RefreshCw size={14} /> Tải lại
        </button>
      </div>
    );
  }

  const pendingRatio =
    totalJobs > 0 ? Math.round((pendingApprovalCount / totalJobs) * 100) : 0;
  const disputeRatio =
    totalShortTermJobs > 0
      ? Math.round((disputedCount / totalShortTermJobs) * 100)
      : 0;
  const avgApplicants = fullTimeStats?.averageApplicantsPerJob ?? 0;

  return (
    <div className="jmt-stack">
      <div className="jmt-row jmt-row--between">
        <div>
          <h3 className="jmt-title">Phân tích tổng quan tuyển dụng</h3>
          <p className="jmt-subtitle">
            Gom chung dữ liệu full-time và short-term để theo dõi sức khỏe vận
            hành.
          </p>
        </div>
        <button className="jmt-btn jmt-btn--ghost" onClick={onRefresh}>
          <RefreshCw size={14} /> Làm mới dữ liệu
        </button>
      </div>

      <div className="jmt-kpi-grid">
        <article className="jmt-kpi-card jmt-kpi-card--cyan">
          <div className="jmt-kpi-icon">
            <Briefcase size={18} />
          </div>
          <div>
            <div className="jmt-kpi-value">{totalJobs}</div>
            <div className="jmt-kpi-label">Tổng tin tuyển dụng</div>
          </div>
        </article>

        <article className="jmt-kpi-card jmt-kpi-card--blue">
          <div className="jmt-kpi-icon">
            <Activity size={18} />
          </div>
          <div>
            <div className="jmt-kpi-value">{pendingApprovalCount}</div>
            <div className="jmt-kpi-label">Tin chờ duyệt ({pendingRatio}%)</div>
          </div>
        </article>

        <article className="jmt-kpi-card jmt-kpi-card--amber">
          <div className="jmt-kpi-icon">
            <Users size={18} />
          </div>
          <div>
            <div className="jmt-kpi-value">{totalApplicants}</div>
            <div className="jmt-kpi-label">Ứng viên full-time</div>
          </div>
        </article>

        <article className="jmt-kpi-card jmt-kpi-card--red">
          <div className="jmt-kpi-icon">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="jmt-kpi-value">{disputedCount}</div>
            <div className="jmt-kpi-label">Tranh chấp ST ({disputeRatio}%)</div>
          </div>
        </article>

        <article className="jmt-kpi-card jmt-kpi-card--green">
          <div className="jmt-kpi-icon">
            <CircleDollarSign size={18} />
          </div>
          <div>
            <div className="jmt-kpi-value">
              {formatCurrency(totalEscrowVolume)}
            </div>
            <div className="jmt-kpi-label">Tổng giá trị ký quỹ ST</div>
          </div>
        </article>
      </div>

      <div className="jmt-insight-box">
        <div className="jmt-insight-item">
          <TrendingUp size={14} />
          <span>
            Bình quân mỗi tin full-time có{" "}
            <strong>{avgApplicants.toFixed(1)}</strong> ứng viên.
          </span>
        </div>
        <div className="jmt-insight-item">
          <TrendingUp size={14} />
          <span>
            Tỷ trọng hiện tại: <strong>{totalFullTimeJobs}</strong> full-time và{" "}
            <strong>{totalShortTermJobs}</strong> short-term.
          </span>
        </div>
      </div>

      <div className="jmt-chart-grid jmt-chart-grid--two">
        <section className="jmt-chart-card">
          <h4>Phân bổ trạng thái chi tiết (FT + ST)</h4>
          <div className="jmt-chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={combinedStatusData}
                layout="vertical"
                margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(34,211,238,0.15)"
                />
                <XAxis type="number" stroke="#93c5fd" />
                <YAxis
                  type="category"
                  width={145}
                  dataKey="name"
                  stroke="#7dd3fc"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartTooltipLabelStyle}
                  itemStyle={chartTooltipItemStyle}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {combinedStatusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.status] ?? "#38bdf8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="jmt-chart-card">
          <h4>Tỷ trọng khối lượng theo loại tin</h4>
          <div className="jmt-chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={workloadSplitData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={115}
                  paddingAngle={4}
                >
                  {workloadSplitData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartTooltipLabelStyle}
                  itemStyle={chartTooltipItemStyle}
                  formatter={(value) => [`${value} tin`, "Số lượng"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="jmt-chart-grid jmt-chart-grid--two">
        <section className="jmt-chart-card">
          <h4>Cường độ mức độ gấp của short-term</h4>
          <div className="jmt-chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={urgencyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(34,211,238,0.15)"
                />
                <XAxis
                  dataKey="name"
                  stroke="#7dd3fc"
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="#93c5fd" />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartTooltipLabelStyle}
                  itemStyle={chartTooltipItemStyle}
                  formatter={(value) => [`${value} tin`, "Số lượng"]}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {urgencyData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="jmt-chart-card">
          <h4>Pipeline ứng viên full-time</h4>
          <div className="jmt-chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={applicationFunnelData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(34,211,238,0.15)"
                />
                <XAxis
                  dataKey="name"
                  stroke="#7dd3fc"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={70}
                />
                <YAxis stroke="#93c5fd" />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartTooltipLabelStyle}
                  itemStyle={chartTooltipItemStyle}
                  formatter={(value) => [`${value} ứng viên`, "Số lượng"]}
                />
                <Bar dataKey="value" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
};

export default JobStatsView;
