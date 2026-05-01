import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  MessageSquare,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AiTokenUsageSummary,
  AiTokenUsageTimeSeriesPoint,
  AiTokenUsageBreakdown,
  AiTokenUsageLog,
  getAiTokenUsageSummary,
  getAiTokenUsageTimeSeries,
  getAiTokenUsageBreakdown,
  getAiTokenUsageLogs,
  getPresetDateRanges,
  formatTokenCount,
  formatFlowType,
  formatProviderType,
  AiFlowType,
  AiProviderType,
} from "../../services/aiTokenUsageService";
import { useToast } from "../../hooks/useToast";
import "./AdminAiTokenUsageDashboard.css";

type DateRangePreset = "today" | "last7Days" | "last30Days" | "custom";

interface FilterState {
  preset: DateRangePreset;
  from: string;
  to: string;
  flowType: AiFlowType | "";
  providerType: AiProviderType | "";
  status: "SUCCESS" | "FAILED" | "";
}

const PAGE_SIZE = 20;

const AdminAiTokenUsageDashboard: React.FC = () => {
  const { showError } = useToast();

  const [filters, setFilters] = useState<FilterState>(() => {
    const presets = getPresetDateRanges();
    return {
      preset: "today",
      from: presets.today.from,
      to: presets.today.to,
      flowType: "",
      providerType: "",
      status: "",
    };
  });

  const [summary, setSummary] = useState<AiTokenUsageSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<AiTokenUsageTimeSeriesPoint[]>([]);
  const [breakdown, setBreakdown] = useState<AiTokenUsageBreakdown | null>(null);
  const [logs, setLogs] = useState<AiTokenUsageLog[]>([]);
  const [logsTotalPages, setLogsTotalPages] = useState(0);
  const [logsTotalElements, setLogsTotalElements] = useState(0);

  const [loading, setLoading] = useState({
    summary: false,
    chart: false,
    breakdown: false,
    logs: false,
  });
  const [error, setError] = useState<string | null>(null);

  const presets = useMemo(() => getPresetDateRanges(), []);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchData = async () => {
    setError(null);
    setLoading({ summary: true, chart: true, breakdown: true, logs: true });

    const params = {
      from: filters.from,
      to: filters.to,
      flowType: filters.flowType || undefined,
      providerType: filters.providerType || undefined,
      status: filters.status || undefined,
    };

    try {
      const [summaryData, timeSeriesData, breakdownData, logsData] = await Promise.all([
        getAiTokenUsageSummary(params),
        getAiTokenUsageTimeSeries(params),
        getAiTokenUsageBreakdown(params),
        getAiTokenUsageLogs({ ...params, page: currentPage, size: PAGE_SIZE }),
      ]);

      setSummary(summaryData);
      setTimeSeries(timeSeriesData);
      setBreakdown(breakdownData);
      setLogs(logsData.content);
      setLogsTotalPages(logsData.totalPages);
      setLogsTotalElements(logsData.totalElements);
    } catch (err) {
      setError("Không thể tải dữ liệu token usage. Vui lòng thử lại sau.");
      showError("Lỗi", "Không thể tải dữ liệu token usage");
    } finally {
      setLoading({ summary: false, chart: false, breakdown: false, logs: false });
    }
  };

  useEffect(() => {
    void fetchData();
  }, [filters.from, filters.to, filters.flowType, filters.providerType, filters.status, currentPage]);

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === "custom") {
      setFilters((prev) => ({ ...prev, preset }));
      return;
    }
    const range = presets[preset];
    setFilters({
      ...filters,
      preset,
      from: range.from,
      to: range.to,
    });
  };

  const handleRefresh = () => {
    void fetchData();
  };

  const handleExportCSV = () => {
    if (!logs.length) return;

    const headers = [
      "Thời gian",
      "Flow",
      "Provider",
      "Model",
      "Prompt Tokens",
      "Completion Tokens",
      "Total Tokens",
      "Estimated",
      "Status",
      "Latency (ms)",
    ];

    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleString("vi-VN"),
      formatFlowType(log.flowType),
      formatProviderType(log.providerType),
      log.modelName || "-",
      log.promptTokens,
      log.completionTokens,
      log.totalTokens,
      log.estimated ? "Yes" : "No",
      log.status,
      log.latencyMs ?? "-",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-token-usage-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "-";

  const chartData = useMemo(() => {
    const grouped = new Map<string, { timestamp: string; promptTokens: number; completionTokens: number; totalTokens: number }>();

    timeSeries.forEach((point) => {
      const key = new Date(point.timestamp).toLocaleString("vi-VN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!grouped.has(key)) {
        grouped.set(key, { timestamp: key, promptTokens: 0, completionTokens: 0, totalTokens: 0 });
      }
      const existing = grouped.get(key)!;
      existing.promptTokens += point.promptTokens;
      existing.completionTokens += point.completionTokens;
      existing.totalTokens += point.totalTokens;
    });

    return Array.from(grouped.values()).slice(-50); // Limit to last 50 points
  }, [timeSeries]);

  return (
    <div className="admin-token-usage">
      <header className="admin-token-usage__header">
        <div>
          <span className="admin-token-usage__eyebrow">Giám sát hệ thống AI</span>
          <h1>Luồng Token AI</h1>
          <p>Theo dõi lượng token sử dụng qua các luồng AI trong hệ thống.</p>
        </div>
        <button
          className="admin-token-usage__refresh-btn"
          onClick={handleRefresh}
          disabled={Object.values(loading).some(Boolean)}
        >
          <RefreshCw size={16} className={Object.values(loading).some(Boolean) ? "spinning" : ""} />
          Làm mới
        </button>
      </header>

      {error && (
        <div className="admin-token-usage__error">
          <AlertTriangle size={18} />
          {error}
          <button onClick={handleRefresh}>Thử lại</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="admin-token-usage__filters">
        <div className="admin-token-usage__filter-group">
          <label className="admin-token-usage__filter-label">
            <Calendar size={14} />
            Khoảng thời gian
          </label>
          <select
            value={filters.preset}
            onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
          >
            <option value="today">Hôm nay</option>
            <option value="last7Days">7 ngày qua</option>
            <option value="last30Days">30 ngày qua</option>
            <option value="custom">Tùy chỉnh</option>
          </select>
        </div>

        {filters.preset === "custom" && (
          <>
            <div className="admin-token-usage__filter-group">
              <label className="admin-token-usage__filter-label">Từ</label>
              <input
                type="datetime-local"
                value={filters.from.slice(0, 16)}
                onChange={(e) => setFilters({ ...filters, from: new Date(e.target.value).toISOString() })}
              />
            </div>
            <div className="admin-token-usage__filter-group">
              <label className="admin-token-usage__filter-label">Đến</label>
              <input
                type="datetime-local"
                value={filters.to.slice(0, 16)}
                onChange={(e) => setFilters({ ...filters, to: new Date(e.target.value).toISOString() })}
              />
            </div>
          </>
        )}

        <div className="admin-token-usage__filter-group">
          <label className="admin-token-usage__filter-label">
            <Filter size={14} />
            Flow
          </label>
          <select
            value={filters.flowType}
            onChange={(e) => { setFilters({ ...filters, flowType: e.target.value as AiFlowType }); setCurrentPage(0); }}
          >
            <option value="">Tất cả</option>
            <option value="AI_GRADING">Chấm điểm AI</option>
            <option value="CHATBOT">Chatbot</option>
            <option value="MEOWL_CHAT">Meowl Chat</option>
            <option value="ROADMAP_GENERATION">Tạo lộ trình</option>
            <option value="STUDY_PLAN">Kế hoạch học tập</option>
            <option value="CV_GENERATION">Tạo CV</option>
          </select>
        </div>

        <div className="admin-token-usage__filter-group">
          <label className="admin-token-usage__filter-label">
            <Server size={14} />
            Provider
          </label>
          <select
            value={filters.providerType}
            onChange={(e) => { setFilters({ ...filters, providerType: e.target.value as AiProviderType }); setCurrentPage(0); }}
          >
            <option value="">Tất cả</option>
            <option value="LOCAL_AI">Local AI</option>
            <option value="GEMINI">Gemini</option>
            <option value="MISTRAL">Mistral</option>
          </select>
        </div>

        <div className="admin-token-usage__filter-group">
          <label className="admin-token-usage__filter-label">Trạng thái</label>
          <select
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value as "SUCCESS" | "FAILED" | "" }); setCurrentPage(0); }}
          >
            <option value="">Tất cả</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Thất bại</option>
          </select>
        </div>
      </div>

      {/* KPI Cards - Essential 4 metrics only */}
      <div className="admin-token-usage__kpi-grid">
        <div className="admin-token-usage__kpi-card">
          <div className="admin-token-usage__kpi-icon total">
            <Zap size={20} />
          </div>
          <div className="admin-token-usage__kpi-content">
            <span className="admin-token-usage__kpi-value monospace">
              {loading.summary ? "-" : formatTokenCount(summary?.totalTokens ?? 0)}
            </span>
            <span className="admin-token-usage__kpi-label">Tổng tokens</span>
          </div>
        </div>

        <div className="admin-token-usage__kpi-card">
          <div className="admin-token-usage__kpi-icon prompt">
            <MessageSquare size={20} />
          </div>
          <div className="admin-token-usage__kpi-content">
            <span className="admin-token-usage__kpi-value monospace">
              {loading.summary ? "-" : formatTokenCount(summary?.promptTokens ?? 0)}
            </span>
            <span className="admin-token-usage__kpi-label">Prompt tokens</span>
          </div>
        </div>

        <div className="admin-token-usage__kpi-card">
          <div className="admin-token-usage__kpi-icon completion">
            <Activity size={20} />
          </div>
          <div className="admin-token-usage__kpi-content">
            <span className="admin-token-usage__kpi-value monospace">
              {loading.summary ? "-" : formatTokenCount(summary?.completionTokens ?? 0)}
            </span>
            <span className="admin-token-usage__kpi-label">Completion tokens</span>
          </div>
        </div>

        <div className="admin-token-usage__kpi-card">
          <div className="admin-token-usage__kpi-icon requests">
            <Server size={20} />
          </div>
          <div className="admin-token-usage__kpi-content">
            <span className="admin-token-usage__kpi-value monospace">
              {loading.summary ? "-" : (summary?.requestCount ?? 0).toLocaleString()}
            </span>
            <span className="admin-token-usage__kpi-label">Số requests</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="admin-token-usage__chart-section">
        <h3>Biểu đồ sử dụng token theo thời gian</h3>
        <div className="admin-token-usage__chart-container">
          {loading.chart ? (
            <div className="admin-token-usage__loading">
              <div className="admin-token-usage__spinner" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="admin-token-usage__empty">Chưa có dữ liệu trong khoảng thời gian này</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => formatTokenCount(v)} axisLine={false} />
                <Tooltip
                  formatter={(value) => [formatTokenCount(Number(value) || 0), ""]}
                  contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Line
                  type="monotone"
                  dataKey="promptTokens"
                  name="Prompt"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="completionTokens"
                  name="Completion"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="admin-token-usage__breakdown-grid">
        <div className="admin-token-usage__breakdown-card">
          <h4>Phân bố theo Flow</h4>
          {loading.breakdown ? (
            <div className="admin-token-usage__loading small">
              <div className="admin-token-usage__spinner small" />
            </div>
          ) : (
            <ul className="admin-token-usage__breakdown-list">
              {breakdown?.byFlowType.slice(0, 5).map((item) => (
                <li key={item.key}>
                  <span className="admin-token-usage__breakdown-label">{formatFlowType(item.key)}</span>
                  <span className="admin-token-usage__breakdown-value">{formatTokenCount(item.totalTokens)}</span>
                  <span className="admin-token-usage__breakdown-percent">{item.percentage.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-token-usage__breakdown-card">
          <h4>Phân bố theo Provider</h4>
          {loading.breakdown ? (
            <div className="admin-token-usage__loading small">
              <div className="admin-token-usage__spinner small" />
            </div>
          ) : (
            <ul className="admin-token-usage__breakdown-list">
              {breakdown?.byProviderType.slice(0, 5).map((item) => (
                <li key={item.key}>
                  <span className="admin-token-usage__breakdown-label">{formatProviderType(item.key)}</span>
                  <span className="admin-token-usage__breakdown-value">{formatTokenCount(item.totalTokens)}</span>
                  <span className="admin-token-usage__breakdown-percent">{item.percentage.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="admin-token-usage__logs-section">
        <div className="admin-token-usage__logs-header">
          <h3>Lịch sử sử dụng gần đây</h3>
          <button
            className="export-btn"
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            title="Chỉ xuất các bản ghi đang hiển thị trong trang hiện tại"
          >
            <Download size={16} />
            Xuất trang hiện tại CSV
          </button>
        </div>

        <div className="admin-token-usage__table-container">
          <table className="admin-token-usage__table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Flow</th>
                <th>Provider</th>
                <th>Model</th>
                <th>Tokens</th>
                <th>Status</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              {loading.logs && logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-token-usage__loading-cell">
                    <div className="admin-token-usage__spinner small" />
                  </td>
                </tr>
              )}
              {!loading.logs && logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-token-usage__empty-cell">
                    Chưa có dữ liệu token trong khoảng thời gian này.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDateTime(log.createdAt)}</td>
                  <td>
                    <span className={`admin-token-usage__flow-badge ${log.flowType.toLowerCase()}`}>
                      {formatFlowType(log.flowType)}
                    </span>
                  </td>
                  <td>{formatProviderType(log.providerType)}</td>
                  <td>{log.modelName || "-"}</td>
                  <td>
                    {formatTokenCount(log.totalTokens)}
                    {log.estimated && <span className="admin-token-usage__estimated-badge">ƯT</span>}
                  </td>
                  <td>
                    <span className={`admin-token-usage__status-badge ${log.status.toLowerCase()}`}>
                      {log.status === "SUCCESS" ? "Thành công" : "Thất bại"}
                    </span>
                  </td>
                  <td>{log.latencyMs ? `${log.latencyMs}ms` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logsTotalPages > 1 && (
          <div className="admin-token-usage__pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft size={16} />
              Trước
            </button>
            <span>
              Trang {currentPage + 1} / {logsTotalPages} • {logsTotalElements} bản ghi
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(logsTotalPages - 1, p + 1))}
              disabled={currentPage >= logsTotalPages - 1}
            >
              Sau
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAiTokenUsageDashboard;
