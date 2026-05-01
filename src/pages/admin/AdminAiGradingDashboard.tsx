import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Gauge,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import axiosInstance from "../../services/axiosInstance";
import {
  AdminAiAssignmentConfigDTO,
  AdminAiGovernanceStatsDTO,
  AiGradingStatsDTO,
  AiSubmissionDTO,
  CriteriaScoreDTO,
  PromptAuditLogDTO,
  SubmissionType,
} from "../../data/assignmentDTOs";
import {
  disablePrompt,
  getPromptAuditLog,
  overridePrompt,
  updateAiEnabled,
  updateGradingStyle,
} from "../../services/aiGradingService";
import { useToast } from "../../hooks/useToast";
import { useScrollToListTopOnPagination } from "../../hooks/useScrollToListTopOnPagination";
import "./AdminAiGradingDashboard.css";

type InternalTab = "exceptions" | "config";
type StatusFilter = "all" | "confirmed" | "pending" | "disputed" | "exceptions";
type SortKey = "aiGradedAt" | "submittedAt" | "aiConfidence" | "scoreDelta";
type ConfigStyle = "ALL" | "STANDARD" | "STRICT" | "LENIENT";

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

const PAGE_SIZE = 10;
const statusLabels: Record<StatusFilter, string> = {
  all: "Tất cả",
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  disputed: "Tranh chấp",
  exceptions: "Ngoại lệ",
};
const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "aiGradedAt", label: "AI chấm gần nhất" },
  { value: "submittedAt", label: "Nộp bài gần nhất" },
  { value: "aiConfidence", label: "Confidence thấp trước" },
  { value: "scoreDelta", label: "Lệch điểm cao nhất" },
];

const formatNumber = (value?: number | null) => new Intl.NumberFormat("vi-VN").format(value ?? 0);
const formatPercent = (value?: number | null) => `${Math.round((value ?? 0) * 100)}%`;
const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "Chưa có";
const formatScore = (score?: number | null, maxScore?: number | null) =>
  score == null ? "Chưa có" : maxScore != null ? `${score}/${maxScore}` : `${score}`;
const getSubmissionTypeLabel = (type?: SubmissionType | string) =>
  type === "FILE" ? "Tệp" : type === "LINK" ? "Liên kết" : type === "TEXT" ? "Văn bản" : "Không rõ";
const getStyleLabel = (style?: string) =>
  style === "STRICT" ? "Strict" : style === "LENIENT" ? "Lenient" : "Standard";
const getConfidenceMeta = (value?: number | null) => {
  if (value == null) return { tone: "medium", label: "Chưa có" };
  if (value >= 0.8) return { tone: "high", label: formatPercent(value) };
  if (value >= 0.6) return { tone: "medium", label: formatPercent(value) };
  return { tone: "low", label: formatPercent(value) };
};
const getStatusMeta = (item: AiSubmissionDTO) => {
  if (item.disputeFlag) return { tone: "disputed", label: "Cần review" };
  if (item.mentorConfirmed) return { tone: "confirmed", label: "Đã xác nhận" };
  return { tone: "pending", label: "Chờ xác nhận" };
};

const AdminAiGradingDashboard: React.FC = () => {
  const { showSuccess, showError } = useToast();

  // Prompt management state
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [promptModalAssignment, setPromptModalAssignment] = useState<AdminAiAssignmentConfigDTO | null>(null);
  const [promptModalAuditLogs, setPromptModalAuditLogs] = useState<PromptAuditLogDTO[]>([]);
  const [promptModalAuditPage, setPromptModalAuditPage] = useState(0);
  const [promptModalAuditTotalPages, setPromptModalAuditTotalPages] = useState(0);
  const [promptModalAuditTotal, setPromptModalAuditTotal] = useState(0);
  const [promptModalAuditLoading, setPromptModalAuditLoading] = useState(false);
  const [promptModalEditing, setPromptModalEditing] = useState(false);
  const [promptModalEditValue, setPromptModalEditValue] = useState("");
  const [promptModalSaving, setPromptModalSaving] = useState(false);
  const [promptModalStyleValue, setPromptModalStyleValue] = useState("");
  const [promptModalStyleEditing, setPromptModalStyleEditing] = useState(false);
  const [promptModalAiEnabledEditing, setPromptModalAiEnabledEditing] = useState(false);
  const [promptModalAiEnabledValue, setPromptModalAiEnabledValue] = useState(false);

  const [activeTab, setActiveTab] = useState<InternalTab>("config");
  const [stats, setStats] = useState<AiGradingStatsDTO | null>(null);
  const [governanceStats, setGovernanceStats] = useState<AdminAiGovernanceStatsDTO | null>(null);
  const [submissions, setSubmissions] = useState<AiSubmissionDTO[]>([]);
  const [assignments, setAssignments] = useState<AdminAiAssignmentConfigDTO[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<AiSubmissionDTO | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("exceptions");
  const [sortBy, setSortBy] = useState<SortKey>("scoreDelta");
  const [searchInput, setSearchInput] = useState("");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [configSearchInput, setConfigSearchInput] = useState("");
  const [configSearch, setConfigSearch] = useState("");
  const [configStyle, setConfigStyle] = useState<ConfigStyle>("ALL");
  const [configTrustFilter, setConfigTrustFilter] = useState<"ALL" | "TRUST_ON" | "TRUST_OFF">("ALL");
  const [configPromptFilter, setConfigPromptFilter] = useState<"ALL" | "CUSTOM" | "DEFAULT">("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [configPage, setConfigPage] = useState(0);
  const [configTotalPages, setConfigTotalPages] = useState(0);
  const [configTotalElements, setConfigTotalElements] = useState(0);
  const { withPaginationScroll } = useScrollToListTopOnPagination();
  const [statsLoading, setStatsLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSubmissionSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => setConfigSearch(configSearchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [configSearchInput]);

  const clearErrorOnSuccess = () => setError((previous) => (previous ? null : previous));

  const fetchOverview = async () => {
    setStatsLoading(true);
    try {
      const [statsResponse, governanceResponse] = await Promise.all([
        axiosInstance.get<AiGradingStatsDTO>("/api/admin/ai-grading/stats"),
        axiosInstance.get<AdminAiGovernanceStatsDTO>("/api/admin/ai-grading/governance-stats"),
      ]);
      setStats(statsResponse.data);
      setGovernanceStats(governanceResponse.data);
      clearErrorOnSuccess();
    } catch {
      setError("Không thể tải số liệu quản trị AI grading.");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const response = await axiosInstance.get<PageResponse<AiSubmissionDTO>>("/api/admin/ai-grading/submissions", {
        params: {
          page: currentPage,
          size: PAGE_SIZE,
          status: statusFilter,
          exceptionOnly: true,
          search: submissionSearch || undefined,
          sortBy,
          sortDir: sortBy === "aiConfidence" ? "asc" : "desc",
        },
      });
      setSubmissions(response.data.content);
      setTotalElements(response.data.totalElements);
      setTotalPages(response.data.totalPages);
      clearErrorOnSuccess();
    } catch {
      setError("Không thể tải hàng đợi ngoại lệ AI grading.");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const response = await axiosInstance.get<PageResponse<AdminAiAssignmentConfigDTO>>("/api/admin/ai-grading/assignments", {
        params: {
          page: configPage,
          size: PAGE_SIZE,
          search: configSearch || undefined,
          trustAiEnabled:
            configTrustFilter === "ALL" ? undefined : configTrustFilter === "TRUST_ON",
          hasCustomPrompt:
            configPromptFilter === "ALL" ? undefined : configPromptFilter === "CUSTOM",
          gradingStyle: configStyle === "ALL" ? undefined : configStyle,
        },
      });
      setAssignments(response.data.content);
      setConfigTotalElements(response.data.totalElements);
      setConfigTotalPages(response.data.totalPages);
      clearErrorOnSuccess();
    } catch {
      setError("Không thể tải cấu hình AI của assignment.");
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const fetchSubmissionDetail = async (submissionId: number) => {
    setDetailLoading(true);
    try {
      const response = await axiosInstance.get<AiSubmissionDTO>(`/api/admin/ai-grading/submissions/${submissionId}`);
      setSelectedSubmission(response.data);
      clearErrorOnSuccess();
    } catch {
      setError("Không thể tải chi tiết bài nộp.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void fetchOverview();
  }, []);

  useEffect(() => {
    void fetchSubmissions();
  }, [currentPage, submissionSearch, sortBy, statusFilter]);

  useEffect(() => {
    void fetchAssignments();
  }, [configPage, configSearch, configStyle, configTrustFilter, configPromptFilter]);

  useEffect(() => {
    if (selectedSubmissionId != null) {
      void fetchSubmissionDetail(selectedSubmissionId);
    }
  }, [selectedSubmissionId]);

  const confirmationRate = useMemo(() => {
    if (!stats?.totalAiGraded) return 0;
    return stats.confirmed / stats.totalAiGraded;
  }, [stats]);

  const averageAttempts = useMemo(() => {
    if (!stats?.totalAiGraded) return 0;
    return stats.totalAttempts / stats.totalAiGraded;
  }, [stats]);

  const handleRefresh = async () => {
    await Promise.all([fetchOverview(), fetchSubmissions(), fetchAssignments()]);
    if (selectedSubmissionId != null) {
      await fetchSubmissionDetail(selectedSubmissionId);
    }
  };

  const executeRecalculate = async () => {
    if (selectedSubmissionId == null) return;
    setRecalculating(true);
    try {
      await axiosInstance.post(`/api/admin/ai-grading/recalculate/${selectedSubmissionId}`);
      setConfirmOpen(false);
      await handleRefresh();
    } catch {
      setError("Không thể tính lại trạng thái đạt của bài nộp.");
    } finally {
      setRecalculating(false);
    }
  };

  const renderCriteria = (criteriaScores?: CriteriaScoreDTO[]) => {
    if (!criteriaScores?.length) {
      return <div className="admaigrading-empty-block">Chưa có dữ liệu tiêu chí cho bài nộp này.</div>;
    }
    return (
      <div className="admaigrading-criteria-list">
        {criteriaScores.map((criteria) => (
          <div key={`${criteria.criteriaId}-${criteria.criteriaName}`} className="admaigrading-criteria-item">
            <div>
              <strong>{criteria.criteriaName || "Tiêu chí"}</strong>
              <p>{criteria.feedback || "Chưa có nhận xét."}</p>
            </div>
            <div className="admaigrading-criteria-score">
              <span>{formatScore(criteria.score, criteria.maxPoints)}</span>
              <small>{criteria.passed ? "Đạt" : "Chưa đạt"}</small>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const openSubmissionDetail = (submissionId: number) => {
    setSelectedSubmissionId(submissionId);
    setSelectedSubmission(null);
  };

  const openPromptModal = async (assignment: AdminAiAssignmentConfigDTO) => {
    setPromptModalAssignment(assignment);
    setPromptModalOpen(true);
    setPromptModalEditing(false);
    setPromptModalStyleEditing(false);
    setPromptModalAiEnabledEditing(false);
    setPromptModalStyleValue(assignment.gradingStyle ?? "STANDARD");
    setPromptModalAiEnabledValue(assignment.aiGradingEnabled ?? false);
    await fetchPromptAuditLogs(assignment.assignmentId, 0);
  };

  const fetchPromptAuditLogs = async (assignmentId: number, page: number) => {
    setPromptModalAuditLoading(true);
    try {
      const data = await getPromptAuditLog(assignmentId, page);
      setPromptModalAuditLogs(data.content);
      setPromptModalAuditPage(data.totalPages > 0 ? page : 0);
      setPromptModalAuditTotalPages(data.totalPages);
      setPromptModalAuditTotal(data.totalElements);
    } catch {
      showError("Không thể tải lịch sử audit.");
    } finally {
      setPromptModalAuditLoading(false);
    }
  };

  const handleDisablePrompt = async () => {
    if (!promptModalAssignment) return;
    setPromptModalSaving(true);
    try {
      const updated = await disablePrompt(promptModalAssignment.assignmentId);
      setPromptModalAssignment(updated);
      await fetchPromptAuditLogs(updated.assignmentId, 0);
      showSuccess("Đã tắt custom prompt.");
    } catch {
      showError("Không thể tắt prompt.");
    } finally {
      setPromptModalSaving(false);
    }
  };

  const handleSavePromptEdit = async () => {
    if (!promptModalAssignment) return;
    setPromptModalSaving(true);
    try {
      const updated = await overridePrompt(promptModalAssignment.assignmentId, promptModalEditValue);
      setPromptModalAssignment(updated);
      setPromptModalEditing(false);
      await fetchPromptAuditLogs(updated.assignmentId, 0);
      showSuccess("Đã lưu prompt mới.");
    } catch {
      showError("Không thể lưu prompt.");
    } finally {
      setPromptModalSaving(false);
    }
  };

  const handleSaveStyleEdit = async () => {
    if (!promptModalAssignment) return;
    setPromptModalSaving(true);
    try {
      const updated = await updateGradingStyle(promptModalAssignment.assignmentId, promptModalStyleValue);
      setPromptModalAssignment(updated);
      setPromptModalStyleEditing(false);
      await fetchPromptAuditLogs(updated.assignmentId, 0);
      showSuccess("Đã cập nhật grading style.");
    } catch {
      showError("Không thể cập nhật grading style.");
    } finally {
      setPromptModalSaving(false);
    }
  };

  const handleSaveAiEnabledEdit = async () => {
    if (!promptModalAssignment) return;
    setPromptModalSaving(true);
    try {
      const updated = await updateAiEnabled(promptModalAssignment.assignmentId, promptModalAiEnabledValue);
      setPromptModalAssignment(updated);
      setPromptModalAiEnabledEditing(false);
      await fetchPromptAuditLogs(updated.assignmentId, 0);
      showSuccess(`AI grading đã ${promptModalAiEnabledValue ? "bật" : "tắt"}.`);
    } catch {
      showError("Không thể cập nhật AI grading.");
    } finally {
      setPromptModalSaving(false);
    }
  };

  const openPromptEdit = (currentPrompt?: string) => {
    setPromptModalEditValue(currentPrompt ?? "");
    setPromptModalEditing(true);
  };

  const formatAuditAction = (action: string) => {
    switch (action) {
      case "PROMPT_OVERRIDE": return "Sửa prompt";
      case "PROMPT_DISABLED": return "Tắt prompt";
      case "GRADING_STYLE_CHANGED": return "Đổi grading style";
      case "AI_ENABLED_TOGGLED": return "Bật/tắt AI grading";
      default: return action;
    }
  };

  return (
    <div className="admaigrading-wrapper">
      <header className="admaigrading-header">
        <div>
          <span className="admaigrading-eyebrow">Quản trị chất lượng chấm điểm</span>
          <h1>Quản lý chấm điểm tự động</h1>
          <p>Theo dõi số liệu hệ thống, hàng đợi ngoại lệ và cấu hình AI của assignment trong cùng một màn quản trị.</p>
        </div>
        <button
          className="admaigrading-refresh-btn"
          onClick={() => void handleRefresh()}
          disabled={statsLoading || submissionsLoading || assignmentsLoading || recalculating}
        >
          <RefreshCw size={16} className={statsLoading || submissionsLoading || assignmentsLoading || recalculating ? "admaigrading-spinning" : ""} />
          Làm mới
        </button>
      </header>

      {error && <div className="admaigrading-error"><AlertTriangle size={18} />{error}</div>}

      <div className="admaigrading-tabs">
        {totalElements > 0 && (
          <button className={`admaigrading-tab ${activeTab === "exceptions" ? "active" : ""}`} onClick={() => setActiveTab("exceptions")}>
            Cần can thiệp
            <span className="admaigrading-tab-badge">{totalElements}</span>
          </button>
        )}
        <button className={`admaigrading-tab ${activeTab === "config" ? "active" : ""}`} onClick={() => setActiveTab("config")}>Cấu hình AI</button>
      </div>

      {activeTab === "exceptions" && (
        <section className="admaigrading-content">
          <div className="admaigrading-toolbar">
            <label className="admaigrading-search">
              <Search size={16} />
              <input
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(0); }}
                placeholder="Tìm theo học viên, mentor, khóa học, module hoặc bài tập"
              />
            </label>
            <div className="admaigrading-filter-group">
              {(["exceptions", "disputed", "pending", "confirmed", "all"] as StatusFilter[]).map((key) => (
                <button key={key} className={`admaigrading-filter-btn ${statusFilter === key ? "active" : ""}`} onClick={() => { setStatusFilter(key); setCurrentPage(0); }}>
                  {statusLabels[key]}
                </button>
              ))}
            </div>
            <select className="admaigrading-select" value={sortBy} onChange={(e) => { setSortBy(e.target.value as SortKey); setCurrentPage(0); }}>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div className="admaigrading-table-container">
            <table className="admaigrading-table">
              <thead><tr><th>Học viên</th><th>Bài nộp</th><th>Mentor</th><th>Điểm</th><th>Confidence</th><th>Trạng thái</th><th>Thời gian</th><th>Thao tác</th></tr></thead>
              <tbody>
                {submissionsLoading && <tr><td colSpan={8} className="admaigrading-loading-cell"><div className="admaigrading-spinner small" /></td></tr>}
                {!submissionsLoading && !submissions.length && <tr><td colSpan={8} className="admaigrading-empty-cell">Không có submission ngoại lệ phù hợp với bộ lọc hiện tại.</td></tr>}
                {!submissionsLoading && submissions.map((item) => {
                  const status = getStatusMeta(item);
                  const confidence = getConfidenceMeta(item.aiConfidence);
                  return (
                    <tr key={item.submissionId}>
                      <td><strong>{item.studentName || "Chưa rõ"}</strong><div className="admaigrading-cell-sub">ID #{item.studentId}</div></td>
                      <td><strong>{item.assignmentTitle}</strong><div className="admaigrading-cell-sub">{item.courseName} • {item.moduleName} • {getSubmissionTypeLabel(item.submissionType)}</div></td>
                      <td><strong>{item.mentorName || "Chưa gán mentor"}</strong><div className="admaigrading-cell-sub">{(item.aiGradeAttemptCount ?? 0)} lượt AI</div></td>
                      <td><strong>AI: {formatScore(item.aiScore, item.assignmentMaxScore)}</strong><div className="admaigrading-cell-sub">Mentor: {formatScore(item.actualScore, item.assignmentMaxScore)} • Lệch {formatNumber(item.scoreDelta)}</div></td>
                      <td><span className={`aigrading-confidence ${confidence.tone}`}>{confidence.label}</span></td>
                      <td><span className={`aigrading-badge aigrading-badge--${status.tone}`}>{status.label}</span></td>
                      <td><strong>{formatDateTime(item.aiGradedAt)}</strong><div className="admaigrading-cell-sub">Nộp: {formatDateTime(item.submittedAt)}</div></td>
                      <td><button className="admaigrading-action-btn" onClick={() => openSubmissionDetail(item.submissionId)}><Eye size={15} />Xem</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admaigrading-pagination">
            <button onClick={withPaginationScroll(() => setCurrentPage((page) => Math.max(page - 1, 0)))} disabled={currentPage === 0}><ChevronLeft size={16} />Trước</button>
            <span>Trang {totalPages === 0 ? 0 : currentPage + 1}/{Math.max(totalPages, 1)} • {formatNumber(totalElements)} bài</span>
            <button onClick={withPaginationScroll(() => setCurrentPage((page) => Math.min(page + 1, Math.max(totalPages - 1, 0))))} disabled={currentPage + 1 >= totalPages}><ChevronRight size={16} />Sau</button>
          </div>
        </section>
      )}

      {activeTab === "config" && (
        <section className="admaigrading-content">
          <div className="admaigrading-toolbar">
            <label className="admaigrading-search">
              <Search size={16} />
              <input
                value={configSearchInput}
                onChange={(e) => { setConfigSearchInput(e.target.value); setConfigPage(0); }}
                placeholder="Tìm theo mentor, khóa học, module hoặc assignment"
              />
            </label>
            <select className="admaigrading-select" value={configStyle} onChange={(e) => { setConfigStyle(e.target.value as ConfigStyle); setConfigPage(0); }}>
              <option value="ALL">Tất cả style</option>
              <option value="STANDARD">Standard</option>
              <option value="STRICT">Strict</option>
              <option value="LENIENT">Lenient</option>
            </select>
            <select className="admaigrading-select" value={configTrustFilter} onChange={(e) => { setConfigTrustFilter(e.target.value as typeof configTrustFilter); setConfigPage(0); }}>
              <option value="ALL">Mọi trạng thái Trust AI</option>
              <option value="TRUST_ON">Đang bật Trust AI</option>
              <option value="TRUST_OFF">Đang tắt Trust AI</option>
            </select>
            <select className="admaigrading-select" value={configPromptFilter} onChange={(e) => { setConfigPromptFilter(e.target.value as typeof configPromptFilter); setConfigPage(0); }}>
              <option value="ALL">Mọi loại prompt</option>
              <option value="CUSTOM">Có custom prompt</option>
              <option value="DEFAULT">Không có custom prompt</option>
            </select>
          </div>

          <div className="admaigrading-config-list">
            {assignmentsLoading && <div className="admaigrading-loading"><div className="admaigrading-spinner" /></div>}
            {!assignmentsLoading && !assignments.length && <div className="admaigrading-empty-block">Không có assignment AI grading phù hợp với bộ lọc hiện tại.</div>}
            {!assignmentsLoading && assignments.map((item) => (
              <article key={item.assignmentId} className="admaigrading-config-card">
                <div className="admaigrading-config-head">
                  <div>
                    <h3>{item.assignmentTitle}</h3>
                    <p>{item.courseName} • {item.moduleName}</p>
                  </div>
                  <span className={`aigrading-badge ${item.trustAiEnabled ? "aigrading-badge--confirmed" : "aigrading-badge--pending"}`}>
                    {item.trustAiEnabled ? "Trust AI bật" : "Trust AI tắt"}
                  </span>
                </div>
                <div className="admaigrading-config-meta">
                  <div><UserRound size={15} /><span>{item.mentorName || "Chưa rõ mentor"}</span></div>
                  <div><SlidersHorizontal size={15} /><span>{getStyleLabel(item.gradingStyle)}</span></div>
                  <div><BookOpen size={15} /><span>{getSubmissionTypeLabel(item.submissionType)}</span></div>
                  <div><Gauge size={15} /><span>{formatScore(item.maxScore, item.maxScore)}</span></div>
                </div>
                <div className="admaigrading-config-prompt">
                  <strong>Prompt</strong>
                  <p>{item.hasCustomPrompt ? item.promptPreview : "Đang dùng prompt mặc định của hệ thống."}</p>
                  <small>{item.hasCustomPrompt ? `${formatNumber(item.promptLength)} ký tự` : "Không có custom prompt"}</small>
                </div>
                <div className="admaigrading-config-metrics">
                  <span>AI đã chấm: {formatNumber(item.aiGradedSubmissions)}</span>
                  <span>Chờ mentor: {formatNumber(item.pendingMentorConfirmations)}</span>
                  <span>Tranh chấp: {formatNumber(item.disputedSubmissions)}</span>
                  <span>Confidence thấp: {formatNumber(item.lowConfidenceSubmissions)}</span>
                </div>
                <div className="admaigrading-config-actions">
                <button className="admaigrading-action-btn" onClick={() => void openPromptModal(item)}>
                  <Eye size={15} />Xem / Can thiệp
                </button>
              </div>
            </article>
          ))}
        </div>

          <div className="admaigrading-pagination">
            <button onClick={withPaginationScroll(() => setConfigPage((page) => Math.max(page - 1, 0)))} disabled={configPage === 0}><ChevronLeft size={16} />Trước</button>
            <span>Trang {configTotalPages === 0 ? 0 : configPage + 1}/{Math.max(configTotalPages, 1)} • {formatNumber(configTotalElements)} assignment</span>
            <button onClick={withPaginationScroll(() => setConfigPage((page) => Math.min(page + 1, Math.max(configTotalPages - 1, 0))))} disabled={configPage + 1 >= configTotalPages}><ChevronRight size={16} />Sau</button>
          </div>
        </section>
      )}

      {selectedSubmissionId != null && (
        <div className="admaigrading-modal-overlay" onClick={() => setSelectedSubmissionId(null)}>
          <div className="admaigrading-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admaigrading-modal-header"><h2>Chi tiết submission ngoại lệ</h2><button onClick={() => setSelectedSubmissionId(null)}><X size={18} /></button></div>
            <div className="admaigrading-modal-body">
              {detailLoading || !selectedSubmission ? (
                <div className="admaigrading-loading"><div className="admaigrading-spinner" /></div>
              ) : (
                <>
                  <div className="admaigrading-detail-grid">
                    <section className="admaigrading-detail-card"><h3>Thông tin bài nộp</h3><p><UserRound size={15} /> {selectedSubmission.studentName || "Chưa rõ"} • {selectedSubmission.courseName}</p><p><BookOpen size={15} /> {selectedSubmission.assignmentTitle}</p><p><Clock3 size={15} /> Nộp lúc {formatDateTime(selectedSubmission.submittedAt)}</p><p><SlidersHorizontal size={15} /> Hình thức: {getSubmissionTypeLabel(selectedSubmission.submissionType)}</p></section>
                    <section className="admaigrading-detail-card"><h3>Kết quả AI</h3><p>Điểm AI: {formatScore(selectedSubmission.aiScore, selectedSubmission.assignmentMaxScore)}</p><p>Confidence: {getConfidenceMeta(selectedSubmission.aiConfidence).label}</p><p>Lượt AI: {formatNumber(selectedSubmission.aiGradeAttemptCount)}</p><p>{selectedSubmission.aiFeedback || "Chưa có phản hồi tổng hợp từ AI."}</p></section>
                    <section className="admaigrading-detail-card"><h3>Kết quả mentor</h3><p>Mentor: {selectedSubmission.mentorName || "Chưa có"}</p><p>Điểm mentor: {formatScore(selectedSubmission.actualScore, selectedSubmission.assignmentMaxScore)}</p><p>Trạng thái đạt: {selectedSubmission.isPassed ? "Đạt" : "Chưa đạt"}</p><p>{selectedSubmission.mentorFeedback || "Chưa có phản hồi từ mentor."}</p></section>
                    <section className="admaigrading-detail-card"><h3>Dấu hiệu cần rà soát</h3><p>Trạng thái: {getStatusMeta(selectedSubmission).label}</p><p>Chênh lệch điểm: {formatNumber(selectedSubmission.scoreDelta)}</p><p>Tiêu chí đạt/chưa đạt: {formatNumber(selectedSubmission.passedCriteriaCount)}/{formatNumber((selectedSubmission.passedCriteriaCount ?? 0) + (selectedSubmission.failedCriteriaCount ?? 0))}</p><p>{selectedSubmission.disputeReason || "Chưa có lý do tranh chấp."}</p></section>
                  </div>
                  <section className="admaigrading-detail-section"><h3>Phân tích theo tiêu chí</h3>{renderCriteria(selectedSubmission.criteriaScores)}</section>
                </>
              )}
            </div>
            <div className="admaigrading-modal-actions">
              <button className="admaigrading-secondary-btn" onClick={() => setSelectedSubmissionId(null)}>Đóng</button>
              <button className="admaigrading-primary-btn" onClick={() => setConfirmOpen(true)} disabled={detailLoading || recalculating}><RefreshCw size={15} className={recalculating ? "admaigrading-spinning" : ""} />Tính lại trạng thái đạt</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Tính lại trạng thái đạt"
        message="Hệ thống sẽ tính lại trạng thái đạt/chưa đạt dựa trên tiêu chí hiện tại của submission này."
        confirmLabel="Xác nhận tính lại"
        cancelLabel="Hủy"
        variant="primary"
        onConfirm={() => void executeRecalculate()}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Prompt Management Modal */}
      {promptModalOpen && promptModalAssignment && (
        <div className="admaigrading-modal-overlay" onClick={() => setPromptModalOpen(false)}>
          <div className="admaigrading-modal admaigrading-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admaigrading-modal-header">
              <h2>Quản lý Prompt AI — {promptModalAssignment.assignmentTitle}</h2>
              <button onClick={() => setPromptModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="admaigrading-modal-body">
              {/* Assignment Info + Safety Badges */}
              <div className="admaigrading-prompt-info">
                <div className="admaigrading-prompt-meta-row">
                  <span>{promptModalAssignment.courseName} • {promptModalAssignment.moduleName}</span>
                  <div className="admaigrading-prompt-badges">
                    {promptModalAssignment.hasCustomPrompt && (
                      <span className="admaigrading-prompt-badge admaigrading-prompt-badge--custom">Custom Prompt</span>
                    )}
                    {promptModalAssignment.trustAiEnabled && (
                      <span className="admaigrading-prompt-badge admaigrading-prompt-badge--trust">Trust AI</span>
                    )}
                    {promptModalAssignment.disputedSubmissions > 0 && (
                      <span className="admaigrading-prompt-badge admaigrading-prompt-badge--warn">⚠️ Có tranh chấp</span>
                    )}
                    {promptModalAssignment.lowConfidenceSubmissions > 0 && (
                      <span className="admaigrading-prompt-badge admaigrading-prompt-badge--warn">⚠️ Low confidence</span>
                    )}
                  </div>
                </div>

                {/* Grading Style Row */}
                <div className="admaigrading-prompt-control-row">
                  <strong>Grading Style:</strong>
                  {promptModalStyleEditing ? (
                    <>
                      <select
                        className="admaigrading-select admaigrading-prompt-inline-select"
                        value={promptModalStyleValue}
                        onChange={(e) => setPromptModalStyleValue(e.target.value)}
                      >
                        <option value="STANDARD">Standard</option>
                        <option value="STRICT">Strict</option>
                        <option value="LENIENT">Lenient</option>
                      </select>
                      <button className="admaigrading-primary-btn admaigrading-sm-btn" onClick={() => void handleSaveStyleEdit()} disabled={promptModalSaving}>
                        {promptModalSaving ? "..." : "Lưu"}
                      </button>
                      <button className="admaigrading-secondary-btn admaigrading-sm-btn" onClick={() => setPromptModalStyleEditing(false)}>Hủy</button>
                    </>
                  ) : (
                    <>
                      <span className="admaigrading-prompt-value">{getStyleLabel(promptModalAssignment.gradingStyle)}</span>
                      <button className="admaigrading-action-btn admaigrading-sm-btn" onClick={() => setPromptModalStyleEditing(true)}>
                        <Edit3 size={13} />Đổi
                      </button>
                    </>
                  )}
                </div>

                {/* AI Enabled Row */}
                <div className="admaigrading-prompt-control-row">
                  <strong>AI Grading:</strong>
                  {promptModalAiEnabledEditing ? (
                    <>
                      <select
                        className="admaigrading-select admaigrading-prompt-inline-select"
                        value={promptModalAiEnabledValue ? "true" : "false"}
                        onChange={(e) => setPromptModalAiEnabledValue(e.target.value === "true")}
                      >
                        <option value="true">Bật</option>
                        <option value="false">Tắt</option>
                      </select>
                      <button className="admaigrading-primary-btn admaigrading-sm-btn" onClick={() => void handleSaveAiEnabledEdit()} disabled={promptModalSaving}>
                        {promptModalSaving ? "..." : "Lưu"}
                      </button>
                      <button className="admaigrading-secondary-btn admaigrading-sm-btn" onClick={() => setPromptModalAiEnabledEditing(false)}>Hủy</button>
                    </>
                  ) : (
                    <>
                      <span className={`admaigrading-prompt-value ${!promptModalAssignment.aiGradingEnabled ? "admaigrading-prompt-value--inactive" : ""}`}>
                        {promptModalAssignment.aiGradingEnabled ? "Bật" : "Tắt"}
                      </span>
                      <button className="admaigrading-action-btn admaigrading-sm-btn" onClick={() => setPromptModalAiEnabledEditing(true)}>
                        <Edit3 size={13} />Đổi
                      </button>
                    </>
                  )}
                </div>

                {/* Prompt Display/Edit */}
                <div className="admaigrading-prompt-content">
                  <div className="admaigrading-prompt-header-row">
                    <strong>Prompt hiện tại:</strong>
                    {promptModalAssignment.hasCustomPrompt ? (
                      promptModalEditing ? (
                        <>
                          <button className="admaigrading-primary-btn admaigrading-sm-btn" onClick={() => void handleSavePromptEdit()} disabled={promptModalSaving}>
                            {promptModalSaving ? "Đang lưu..." : "Lưu prompt"}
                          </button>
                          <button className="admaigrading-secondary-btn admaigrading-sm-btn" onClick={() => setPromptModalEditing(false)}>Hủy</button>
                        </>
                      ) : (
                        <button className="admaigrading-action-btn admaigrading-sm-btn" onClick={() => openPromptEdit(promptModalAssignment.aiGradingPrompt)}>
                          <Edit3 size={13} />Sửa prompt
                        </button>
                      )
                    ) : (
                      <button className="admaigrading-action-btn admaigrading-sm-btn" onClick={() => openPromptEdit("")}>
                        <Plus size={13} />Thêm prompt
                      </button>
                    )}
                  </div>
                  {promptModalEditing ? (
                    <textarea
                      className="admaigrading-prompt-textarea"
                      value={promptModalEditValue}
                      onChange={(e) => setPromptModalEditValue(e.target.value)}
                      rows={8}
                      placeholder="Nhập prompt mới..."
                    />
                  ) : (
                    <div className="admaigrading-prompt-display">
                      {promptModalAssignment.hasCustomPrompt ? (
                        <pre>{promptModalAssignment.aiGradingPrompt}</pre>
                      ) : (
                        <p className="admaigrading-prompt-empty">Đang dùng prompt mặc định của hệ thống. Mentor chưa tùy chỉnh prompt cho assignment này.</p>
                      )}
                    </div>
                  )}
                  {promptModalAssignment.hasCustomPrompt && (
                    <button
                      className="admaigrading-secondary-btn admaigrading-danger-btn"
                      onClick={() => void handleDisablePrompt()}
                      disabled={promptModalSaving}
                    >
                      {promptModalSaving ? "..." : "Tắt custom prompt"}
                    </button>
                  )}
                </div>
              </div>

              {/* Audit Trail */}
              <div className="admaigrading-audit-section">
                <h3>Lịch sử thay đổi</h3>
                {promptModalAuditLoading ? (
                  <div className="admaigrading-loading"><div className="admaigrading-spinner" /></div>
                ) : promptModalAuditLogs.length === 0 ? (
                  <p className="admaigrading-empty-block">Chưa có lịch sử thay đổi nào cho assignment này.</p>
                ) : (
                  <>
                    <div className="admaigrading-audit-list">
                      {promptModalAuditLogs.map((log) => (
                        <div key={log.id} className="admaigrading-audit-item">
                          <div className="admaigrading-audit-item-header">
                            <strong>{log.adminName}</strong>
                            <span className="admaigrading-audit-action">{formatAuditAction(log.action)}</span>
                            <span className="admaigrading-audit-time">{formatDateTime(log.createdAt)}</span>
                          </div>
                          {log.beforeValue && (
                            <div className="admaigrading-audit-diff">
                              <span className="admaigrading-audit-diff-label">Trước:</span>
                              <pre>{log.beforeValue.substring(0, 200)}{log.beforeValue.length > 200 ? "..." : ""}</pre>
                            </div>
                          )}
                          {log.afterValue && (
                            <div className="admaigrading-audit-diff">
                              <span className="admaigrading-audit-diff-label">Sau:</span>
                              <pre>{log.afterValue.substring(0, 200)}{log.afterValue.length > 200 ? "..." : ""}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {promptModalAuditTotalPages > 1 && (
                      <div className="admaigrading-pagination">
                        <button
                          onClick={() => void fetchPromptAuditLogs(promptModalAssignment.assignmentId, promptModalAuditPage - 1)}
                          disabled={promptModalAuditPage === 0}
                        ><ChevronLeft size={16} />Trước</button>
                        <span>Trang {promptModalAuditPage + 1}/{promptModalAuditTotalPages} • {formatNumber(promptModalAuditTotal)}</span>
                        <button
                          onClick={() => void fetchPromptAuditLogs(promptModalAssignment.assignmentId, promptModalAuditPage + 1)}
                          disabled={promptModalAuditPage + 1 >= promptModalAuditTotalPages}
                        >Sau<ChevronRight size={16} /></button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAiGradingDashboard;
