import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Gauge,
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
  SubmissionType,
} from "../../data/assignmentDTOs";
import "./AdminAiGradingDashboard.css";

type InternalTab = "overview" | "exceptions" | "config";
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
  const [activeTab, setActiveTab] = useState<InternalTab>("overview");
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
        <button className={`admaigrading-tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>Tổng quan</button>
        <button className={`admaigrading-tab ${activeTab === "exceptions" ? "active" : ""}`} onClick={() => setActiveTab("exceptions")}>Ngoại lệ cần review</button>
        <button className={`admaigrading-tab ${activeTab === "config" ? "active" : ""}`} onClick={() => setActiveTab("config")}>Cấu hình AI</button>
      </div>

      {activeTab === "overview" && (
        <section className="admaigrading-content">
          {statsLoading ? (
            <div className="admaigrading-loading"><div className="admaigrading-spinner" /></div>
          ) : (
            <>
              <div className="aigrading-stats-grid">
                <article className="aigrading-stat-card"><BookOpen size={20} /><div className="aigrading-stat-content"><h3>{formatNumber(stats?.totalAiGraded)}</h3><p>Tổng bài AI đã chấm</p><span className="aigrading-stat-sub">Khối lượng submission đã qua AI grading</span></div></article>
                <article className="aigrading-stat-card"><Clock3 size={20} /><div className="aigrading-stat-content"><h3>{formatNumber(stats?.pending)}</h3><p>Chờ mentor xác nhận</p><span className="aigrading-stat-sub">Bài cần mentor khóa điểm</span></div></article>
                <article className="aigrading-stat-card"><ShieldAlert size={20} /><div className="aigrading-stat-content"><h3>{formatNumber(stats?.disputed)}</h3><p>Cần review</p><span className="aigrading-stat-sub">Có tranh chấp hoặc ngoại lệ</span></div></article>
                <article className="aigrading-stat-card"><Gauge size={20} /><div className="aigrading-stat-content"><h3>{formatNumber(stats?.lowConfidenceCount)}</h3><p>Confidence thấp</p><span className="aigrading-stat-sub">Cần kiểm tra thủ công</span></div></article>
              </div>

              <div className="aigrading-info-grid">
                <article className="aigrading-info-card"><CheckCircle2 size={18} /><div><strong>Tỷ lệ mentor xác nhận</strong><p>{formatPercent(confirmationRate)} trên tổng số bài AI đã chấm.</p></div></article>
                <article className="aigrading-info-card"><Scale size={18} /><div><strong>Chênh lệch điểm trung bình</strong><p>{formatNumber(stats?.averageScoreDelta)} điểm trên {formatNumber(stats?.comparedSubmissionsCount)} bài có đủ điểm AI và mentor.</p></div></article>
                <article className="aigrading-info-card"><SlidersHorizontal size={18} /><div><strong>Lượt AI trung bình</strong><p>{averageAttempts.toFixed(1)} lượt cho mỗi bài nộp đã qua AI grading.</p></div></article>
              </div>

              <div className="aigrading-governance-grid">
                <article className="aigrading-governance-card"><Settings2 size={18} /><div><strong>Assignment bật AI grading</strong><p>{formatNumber(governanceStats?.aiEnabledAssignments)} assignment đang dùng AI grading.</p></div></article>
                <article className="aigrading-governance-card"><ShieldAlert size={18} /><div><strong>Assignment bật Trust AI</strong><p>{formatNumber(governanceStats?.trustAiAssignments)} assignment đang auto-trust kết quả AI.</p></div></article>
                <article className="aigrading-governance-card"><FileText size={18} /><div><strong>Custom prompt</strong><p>{formatNumber(governanceStats?.customPromptAssignments)} assignment đang dùng prompt tùy chỉnh.</p></div></article>
                <article className="aigrading-governance-card"><SlidersHorizontal size={18} /><div><strong>Strict / Lenient</strong><p>{formatNumber(governanceStats?.strictAssignments)} strict, {formatNumber(governanceStats?.lenientAssignments)} lenient.</p></div></article>
                <article className="aigrading-governance-card"><AlertTriangle size={18} /><div><strong>Trust AI có rủi ro</strong><p>{formatNumber(governanceStats?.riskyTrustAssignments)} assignment trust AI đang có dấu hiệu cần xem lại.</p></div></article>
              </div>
            </>
          )}
        </section>
      )}

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
            <button onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))} disabled={currentPage === 0}><ChevronLeft size={16} />Trước</button>
            <span>Trang {totalPages === 0 ? 0 : currentPage + 1}/{Math.max(totalPages, 1)} • {formatNumber(totalElements)} bài</span>
            <button onClick={() => setCurrentPage((page) => Math.min(page + 1, Math.max(totalPages - 1, 0)))} disabled={currentPage + 1 >= totalPages}><ChevronRight size={16} />Sau</button>
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
                  <span>Lệch TB: {formatNumber(item.averageScoreDelta)}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="admaigrading-pagination">
            <button onClick={() => setConfigPage((page) => Math.max(page - 1, 0))} disabled={configPage === 0}><ChevronLeft size={16} />Trước</button>
            <span>Trang {configTotalPages === 0 ? 0 : configPage + 1}/{Math.max(configTotalPages, 1)} • {formatNumber(configTotalElements)} assignment</span>
            <button onClick={() => setConfigPage((page) => Math.min(page + 1, Math.max(configTotalPages - 1, 0)))} disabled={configPage + 1 >= configTotalPages}><ChevronRight size={16} />Sau</button>
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
    </div>
  );
};

export default AdminAiGradingDashboard;
