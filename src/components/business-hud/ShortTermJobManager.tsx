import React, { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit2,
  Trash2,
  Clock,
  Users,
  CheckCircle,
  FileText,
  AlertTriangle,
  Send,
  Shield,
  X,
} from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import {
  ShortTermJobResponse,
  ShortTermJobStatus,
  CreateShortTermJobRequest,
} from "../../types/ShortTermJob";
import { ShortTermJobForm } from "../../components/short-term-job";
import ShortTermJobFullPage from "./ShortTermJobFullPage";
import { useToast } from "../../hooks/useToast";
import "./short-term-fleet.css";

// ==================== HELPERS ====================

const STATUS_MAP: Record<
  string,
  { label: string; cssClass: string; hint?: string }
> = {
  DRAFT: { label: "Nháp", cssClass: "stj-badge--draft" },
  PENDING_APPROVAL: {
    label: "Chờ duyệt",
    cssClass: "stj-badge--pending-approval",
  },
  PUBLISHED: { label: "Đang tuyển", cssClass: "stj-badge--published" },
  APPLIED: { label: "Có ứng viên", cssClass: "stj-badge--applied" },
  IN_PROGRESS: { label: "Đang thực hiện", cssClass: "stj-badge--in-progress" },
  SUBMITTED: { label: "Đã nộp bài", cssClass: "stj-badge--submitted" },
  UNDER_REVIEW: { label: "Đang review", cssClass: "stj-badge--under-review" },
  APPROVED: { label: "Đã duyệt", cssClass: "stj-badge--approved" },
  REJECTED: { label: "Từ chối", cssClass: "stj-badge--rejected" },
  COMPLETED: { label: "Hoàn thành", cssClass: "stj-badge--completed" },
  PAID: { label: "Đã thanh toán", cssClass: "stj-badge--paid" },
  CANCELLATION_REQUESTED: {
    label: "Hủy chờ duyệt",
    cssClass: "stj-badge--cancellation-review",
    hint: "Admin đang xem xét",
  },
  AUTO_CANCELLED: {
    label: "Tự động hủy",
    cssClass: "stj-badge--cancelled",
    hint: "Hết thời hạn phản hồi",
  },
  CANCELLED: { label: "Đã hủy", cssClass: "stj-badge--cancelled" },
  DISPUTED: { label: "Tranh chấp", cssClass: "stj-badge--disputed" },
  DISPUTE_OPENED: {
    label: "Đang tranh chấp",
    cssClass: "stj-badge--disputed",
    hint: "Admin đang xử lý",
  },
};

const URGENCY_MAP: Record<string, { label: string; cssClass: string }> = {
  NORMAL: { label: "Bình thường", cssClass: "stj-urgency--normal" },
  URGENT: { label: "Gấp", cssClass: "stj-urgency--urgent" },
  VERY_URGENT: { label: "Rất gấp", cssClass: "stj-urgency--very-urgent" },
  ASAP: { label: "Cần ngay", cssClass: "stj-urgency--asap" },
};

const formatBudget = (amount: number): string => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString("vi-VN");
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getDaysRemaining = (
  deadline: string,
): { days: number; text: string; isExpired: boolean } => {
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { days, text: "Đã hết hạn", isExpired: true };
  if (days === 0) return { days: 0, text: "Hôm nay", isExpired: false };
  if (days === 1) return { days: 1, text: "1 ngày", isExpired: false };
  return { days, text: `${days} ngày`, isExpired: false };
};

const renderStatusBadge = (
  status: string,
  statusInfo: { label: string; cssClass: string; hint?: string },
) => {
  const showShield = status === "CANCELLATION_REQUESTED";

  return (
    <div className="stj-status-stack">
      <span className={`stj-badge ${statusInfo.cssClass}`}>
        {showShield && <Shield size={11} strokeWidth={2.25} />}
        {statusInfo.label}
      </span>
      {statusInfo.hint && (
        <span className="stj-status-stack__hint">{statusInfo.hint}</span>
      )}
    </div>
  );
};

// ==================== COMPONENT ====================

interface ShortTermJobManagerProps {
  onCreateNew?: () => void;
}

const ShortTermJobManager: React.FC<ShortTermJobManagerProps> = ({
  onCreateNew,
}) => {
  const { showSuccess, showError } = useToast();

  // State
  const [jobs, setJobs] = useState<ShortTermJobResponse[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<ShortTermJobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Inline edit state
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [editingJobData, setEditingJobData] =
    useState<Partial<CreateShortTermJobRequest> | null>(null);
  const [isEditFetching, setIsEditFetching] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    visible: boolean;
    jobId: number | null;
    title: string;
  }>({
    visible: false,
    jobId: null,
    title: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Close dialog
  const [closeDialog, setCloseDialog] = useState<{
    visible: boolean;
    jobId: number | null;
    title: string;
  }>({
    visible: false,
    jobId: null,
    title: "",
  });
  const [isClosing, setIsClosing] = useState(false);

  // ==================== DATA FETCHING ====================
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await shortTermJobService.getMyJobs();
      setJobs(data);
    } catch (error) {
      console.error("Failed to fetch short-term jobs:", error);
      showError("Lỗi hệ thống", "Không thể tải danh sách công việc ngắn hạn");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ==================== FILTERING ====================
  useEffect(() => {
    let result = [...jobs];

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter((j) => j.status === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q),
      );
    }

    setFilteredJobs(result);
  }, [jobs, statusFilter, searchQuery]);

  // ==================== STATS ====================
  const stats = {
    total: jobs.length,
    pendingApproval: jobs.filter(
      (j) => j.status === ShortTermJobStatus.PENDING_APPROVAL,
    ).length,
    published: jobs.filter((j) => j.status === ShortTermJobStatus.PUBLISHED)
      .length,
    inProgress: jobs.filter((j) =>
      [
        ShortTermJobStatus.IN_PROGRESS,
        ShortTermJobStatus.SUBMITTED,
        ShortTermJobStatus.UNDER_REVIEW,
      ].includes(j.status),
    ).length,
    completed: jobs.filter((j) =>
      [ShortTermJobStatus.COMPLETED, ShortTermJobStatus.PAID].includes(
        j.status,
      ),
    ).length,
    totalApplicants: jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0),
  };
  const handoverQueue = jobs.filter((job) =>
    [
      ShortTermJobStatus.SUBMITTED,
      ShortTermJobStatus.UNDER_REVIEW,
      ShortTermJobStatus.APPROVED,
    ].includes(job.status),
  );

  // ==================== ACTIONS ====================
  const handleSubmitForApproval = async (jobId: number) => {
    try {
      await shortTermJobService.submitForApproval(jobId);
      showSuccess("Đã gửi duyệt", "Công việc đã được gửi cho Admin xét duyệt");
      fetchJobs();
    } catch (error) {
      console.error("Failed to submit for approval:", error);
      showError("Lỗi", "Không thể gửi duyệt công việc");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.jobId) return;
    setIsDeleting(true);
    try {
      await shortTermJobService.deleteJob(deleteDialog.jobId);
      showSuccess("Đã xóa", "Công việc đã được xóa thành công");
      setDeleteDialog({ visible: false, jobId: null, title: "" });
      fetchJobs();
    } catch (error) {
      console.error("Failed to delete job:", error);
      showError("Lỗi", "Không thể xóa công việc");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseJob = async () => {
    if (!closeDialog.jobId) return;
    setIsClosing(true);
    try {
      await shortTermJobService.changeJobStatus(closeDialog.jobId, ShortTermJobStatus.CANCELLED);
      showSuccess("Đã đóng job", "Job đã được đóng lại.");
      setCloseDialog({ visible: false, jobId: null, title: "" });
      fetchJobs();
    } catch (error) {
      console.error("Failed to close job:", error);
      showError("Lỗi", "Không thể đóng công việc");
    } finally {
      setIsClosing(false);
    }
  };

  const handleViewDetail = (jobId: number) => {
    setSelectedJobId(jobId);
  };

  const handleEdit = async (jobId: number) => {
    setSelectedJobId(null);
    setIsEditFetching(true);
    try {
      const job = await shortTermJobService.getJobDetails(jobId);
      setEditingJobData({
        title: job.title,
        description: job.description,
        budget: job.budget,
        deadline: job.deadline,
        requiredSkills: job.requiredSkills ?? [],
        urgency: job.urgency,
        isRemote: job.isRemote,
        location: job.location,
        estimatedDuration: job.estimatedDuration,
        maxApplicants: job.maxApplicants,
      });
      setEditingJobId(jobId);
    } catch (error) {
      console.error("Failed to fetch job for editing:", error);
      showError("Lỗi", "Không thể tải thông tin công việc");
    } finally {
      setIsEditFetching(false);
    }
  };

  const handleEditSubmit = async (
    data: CreateShortTermJobRequest,
    publish: boolean,
  ) => {
    if (!editingJobId) return;
    setIsEditSaving(true);
    try {
      await shortTermJobService.updateJob(editingJobId, data);
      if (publish) {
        await shortTermJobService.publishJob(editingJobId);
        showSuccess("Thành công", "Công việc đã được cập nhật và đăng");
      } else {
        showSuccess("Thành công", "Công việc đã được cập nhật");
      }
      setEditingJobId(null);
      setEditingJobData(null);
      fetchJobs();
    } catch (error: unknown) {
      console.error("Failed to update job:", error);
      const errMsg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Không thể lưu công việc";
      showError("Lỗi", errMsg);
    } finally {
      setIsEditSaving(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="stj-manager">
      {/* Header */}
      <div className="stj-manager__header">
        <h2 className="stj-manager__title">
          <Zap size={22} className="stj-manager__title-icon" />
          Quản Lý Việc Ngắn Hạn
        </h2>
        <div className="stj-manager__actions">
          <button
            className="stj-manager__btn stj-manager__btn--ghost"
            onClick={fetchJobs}
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
          {onCreateNew && (
            <button
              className="stj-manager__btn stj-manager__btn--primary"
              onClick={onCreateNew}
            >
              <Plus size={16} /> Tạo Mới
            </button>
          )}
        </div>
      </div>

      {/* ====== Inline Edit View ====== */}
      {isEditFetching && (
        <div className="stj-manager__loading">
          <div className="rh-spinner" />
          <span>Đang tải thông tin chỉnh sửa...</span>
        </div>
      )}
      {editingJobId && editingJobData ? (
        <div className="stj-inline-edit">
          <div className="stj-inline-edit__header">
            <h3 className="stj-inline-edit__title">
              <Edit2 size={18} /> Chỉnh sửa công việc
            </h3>
            <button
              className="stj-table__action-btn"
              onClick={() => {
                setEditingJobId(null);
                setEditingJobData(null);
              }}
              title="Đóng"
            >
              <X size={16} />
            </button>
          </div>
          <ShortTermJobForm
            initialData={editingJobData}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setEditingJobId(null);
              setEditingJobData(null);
            }}
            isLoading={isEditSaving}
            mode="edit"
          />
        </div>
      ) : selectedJobId ? (
        <ShortTermJobFullPage
          jobId={selectedJobId}
          onBack={() => setSelectedJobId(null)}
          onEdit={(id) => handleEdit(id)}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="stj-stats">
            <div className="stj-stats__card">
              <div className="stj-stats__icon stj-stats__icon--amber">
                <FileText size={20} />
              </div>
              <div className="stj-stats__info">
                <span className="stj-stats__value">{stats.total}</span>
                <span className="stj-stats__label">Tổng số</span>
              </div>
            </div>
            <div className="stj-stats__card">
              <div className="stj-stats__icon stj-stats__icon--cyan">
                <Zap size={20} />
              </div>
              <div className="stj-stats__info">
                <span className="stj-stats__value">{stats.published}</span>
                <span className="stj-stats__label">Đang tuyển</span>
              </div>
            </div>
            {stats.pendingApproval > 0 && (
              <div className="stj-stats__card">
                <div className="stj-stats__icon stj-stats__icon--amber">
                  <Shield size={20} />
                </div>
                <div className="stj-stats__info">
                  <span className="stj-stats__value">
                    {stats.pendingApproval}
                  </span>
                  <span className="stj-stats__label">Chờ duyệt</span>
                </div>
              </div>
            )}
            <div className="stj-stats__card">
              <div className="stj-stats__icon stj-stats__icon--blue">
                <Clock size={20} />
              </div>
              <div className="stj-stats__info">
                <span className="stj-stats__value">{stats.inProgress}</span>
                <span className="stj-stats__label">Đang thực hiện</span>
              </div>
            </div>
            <div className="stj-stats__card">
              <div className="stj-stats__icon stj-stats__icon--green">
                <CheckCircle size={20} />
              </div>
              <div className="stj-stats__info">
                <span className="stj-stats__value">{stats.completed}</span>
                <span className="stj-stats__label">Hoàn thành</span>
              </div>
            </div>
            <div className="stj-stats__card">
              <div className="stj-stats__icon stj-stats__icon--purple">
                <Users size={20} />
              </div>
              <div className="stj-stats__info">
                <span className="stj-stats__value">
                  {stats.totalApplicants}
                </span>
                <span className="stj-stats__label">Ứng viên</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="stj-filters">
            <div className="stj-filters__search">
              <Search size={16} className="stj-filters__search-icon" />
              <input
                type="text"
                className="stj-filters__search-input"
                placeholder="Tìm kiếm theo tên công việc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="stj-filters__select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value={ShortTermJobStatus.DRAFT}>Nháp</option>
              <option value={ShortTermJobStatus.PENDING_APPROVAL}>
                Chờ duyệt
              </option>
              <option value={ShortTermJobStatus.PUBLISHED}>Đang tuyển</option>
              <option value={ShortTermJobStatus.APPLIED}>Có ứng viên</option>
              <option value={ShortTermJobStatus.IN_PROGRESS}>
                Đang thực hiện
              </option>
              <option value={ShortTermJobStatus.SUBMITTED}>Đã nộp bài</option>
              <option value={ShortTermJobStatus.APPROVED}>Đã duyệt</option>
              <option value="CANCELLATION_REQUESTED">Hủy chờ duyệt</option>
              <option value={ShortTermJobStatus.COMPLETED}>Hoàn thành</option>
              <option value={ShortTermJobStatus.PAID}>Đã thanh toán</option>
              <option value={ShortTermJobStatus.CANCELLED}>Đã hủy / Đóng</option>
            </select>
          </div>

          {handoverQueue.length > 0 && (
            <section className="stj-handover-queue">
              <div className="stj-handover-queue__header">
                <div>
                  <span className="stj-handover-queue__eyebrow">Bàn giao cần xử lý</span>
                  <h3>Các job đang chờ recruiter kiểm tra</h3>
                </div>
                <span className="stj-handover-queue__count">{handoverQueue.length}</span>
              </div>

              <div className="stj-handover-queue__grid">
                {handoverQueue.slice(0, 6).map((job) => {
                  const statusInfo = STATUS_MAP[job.status] || {
                    label: job.status,
                    cssClass: "",
                    hint: undefined,
                  };

                  return (
                    <button
                      key={job.id}
                      type="button"
                      className="stj-handover-card"
                      onClick={() => handleViewDetail(job.id)}
                    >
                      <div className="stj-handover-card__top">
                        {renderStatusBadge(job.status, statusInfo)}
                        <span className="stj-handover-card__deadline">{formatDate(job.deadline)}</span>
                      </div>
                      <strong className="stj-handover-card__title">{job.title}</strong>
                      <p className="stj-handover-card__meta">
                        {job.applicantCount || 0} ứng viên • ngân sách {formatBudget(job.budget)}đ
                      </p>
                      <span className="stj-handover-card__cta">Mở khu bàn giao</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="stj-loading">
              <div className="stj-loading__spinner" />
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="stj-empty">
              <div className="stj-empty__icon">
                <Zap size={36} />
              </div>
              <h3 className="stj-empty__title">
                {searchQuery || statusFilter !== "ALL"
                  ? "Không tìm thấy kết quả"
                  : "Chưa có công việc ngắn hạn"}
              </h3>
              <p className="stj-empty__desc">
                {searchQuery || statusFilter !== "ALL"
                  ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                  : "Bắt đầu bằng cách tạo công việc ngắn hạn đầu tiên"}
              </p>
              {!searchQuery && statusFilter === "ALL" && onCreateNew && (
                <button
                  className="stj-manager__btn stj-manager__btn--primary"
                  onClick={onCreateNew}
                >
                  <Plus size={16} /> Tạo Công Việc Đầu Tiên
                </button>
              )}
            </div>
          ) : (
            <div className="stj-table-wrapper">
              <div className="stj-table-wrapper__scroll">
                <table className="stj-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35%" }}>Công việc</th>
                      <th>Trạng thái</th>
                      <th>Ngân sách</th>
                      <th>Deadline</th>
                      <th>Ứng viên</th>
                      <th>Cấp độ</th>
                      <th style={{ width: "120px" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => {
                      const statusInfo = STATUS_MAP[job.status] || {
                        label: job.status,
                        cssClass: "",
                        hint: undefined,
                      };
                      const urgencyInfo = URGENCY_MAP[job.urgency] || {
                        label: job.urgency,
                        cssClass: "stj-urgency--normal",
                      };
                      const deadline = getDaysRemaining(job.deadline);
                      const isExpanded = expandedJobId === job.id;

                      return (
                        <React.Fragment key={job.id}>
                          <tr>
                            <td>
                              <div className="stj-table__title-cell">
                                <span
                                  className="stj-table__title"
                                  onClick={() => handleViewDetail(job.id)}
                                >
                                  {job.title}
                                </span>
                                <span className="stj-table__subtitle">
                                  {job.isRemote
                                    ? "🌐 Remote"
                                    : `📍 ${job.location || "Tại chỗ"}`}
                                  {job.estimatedDuration &&
                                    ` · ${job.estimatedDuration}`}
                                </span>
                              </div>
                            </td>
                            <td>
                              {renderStatusBadge(job.status, statusInfo)}
                            </td>
                            <td>
                              <span className="stj-budget">
                                {formatBudget(job.budget)}đ
                              </span>
                              {job.isNegotiable && (
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "var(--fleet-text-muted)",
                                    display: "block",
                                  }}
                                >
                                  Thương lượng
                                </span>
                              )}
                            </td>
                            <td>
                              <span
                                style={{
                                  color: deadline.isExpired
                                    ? "#ef4444"
                                    : "var(--fleet-text)",
                                  fontSize: "0.88rem",
                                }}
                              >
                                {formatDate(job.deadline)}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  color: deadline.isExpired
                                    ? "#ef4444"
                                    : "var(--fleet-text-muted)",
                                  display: "block",
                                }}
                              >
                                {deadline.isExpired
                                  ? "⚠ Hết hạn"
                                  : `Còn ${deadline.text}`}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: "#fff", fontWeight: 600 }}>
                                {job.applicantCount || 0}
                              </span>
                              {job.maxApplicants && (
                                <span
                                  style={{
                                    color: "var(--fleet-text-muted)",
                                    fontSize: "0.78rem",
                                  }}
                                >
                                  /{job.maxApplicants}
                                </span>
                              )}
                            </td>
                            <td>
                              <span
                                className={`stj-urgency ${urgencyInfo.cssClass}`}
                              >
                                <span className="stj-urgency__dot" />
                                {urgencyInfo.label}
                              </span>
                            </td>
                            <td>
                              <div className="stj-table__actions">
                                <button
                                  className="stj-table__action-btn"
                                  onClick={() =>
                                    setExpandedJobId(isExpanded ? null : job.id)
                                  }
                                  title="Xem nhanh"
                                >
                                  <Eye size={14} />
                                </button>
                                {job.status === ShortTermJobStatus.DRAFT && (
                                  <>
                                    <button
                                      className="stj-table__action-btn"
                                      onClick={() => handleEdit(job.id)}
                                      title="Chỉnh sửa"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      className="stj-table__action-btn stj-table__action-btn--success"
                                      onClick={() =>
                                        handleSubmitForApproval(job.id)
                                      }
                                      title="Gửi duyệt"
                                    >
                                      <Send size={14} />
                                    </button>
                                  </>
                                )}
                                {job.status ===
                                  ShortTermJobStatus.PENDING_APPROVAL && (
                                  <span
                                    className="stj-badge stj-badge--pending-approval"
                                    style={{
                                      fontSize: "0.68rem",
                                      padding: "0.1rem 0.4rem",
                                    }}
                                  >
                                    <Shield size={10} /> Chờ duyệt
                                  </span>
                                )}
                                {(job.status === ShortTermJobStatus.COMPLETED ||
                                  job.status === ShortTermJobStatus.PAID) && (
                                  <button
                                    className="stj-table__action-btn"
                                    onClick={() => setCloseDialog({ visible: true, jobId: job.id, title: job.title })}
                                    title="Đóng job"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                                {(job.status === ShortTermJobStatus.DRAFT ||
                                  job.status ===
                                    ShortTermJobStatus.CANCELLED) && (
                                  <button
                                    className="stj-table__action-btn stj-table__action-btn--danger"
                                    onClick={() =>
                                      setDeleteDialog({
                                        visible: true,
                                        jobId: job.id,
                                        title: job.title,
                                      })
                                    }
                                    title="Xóa"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Quick View Expanded Row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} style={{ padding: 0 }}>
                                <div className="stj-quickview">
                                  <div className="stj-quickview__row">
                                    <div className="stj-quickview__field">
                                      <span className="stj-quickview__label">
                                        Mô tả
                                      </span>
                                      <span className="stj-quickview__value">
                                        {job.description?.length > 150
                                          ? `${job.description.substring(0, 150)}...`
                                          : job.description}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="stj-quickview__row">
                                    <div className="stj-quickview__field">
                                      <span className="stj-quickview__label">
                                        Hình thức
                                      </span>
                                      <span className="stj-quickview__value">
                                        {job.isRemote
                                          ? "Remote"
                                          : job.location || "Onsite"}
                                      </span>
                                    </div>
                                    <div className="stj-quickview__field">
                                      <span className="stj-quickview__label">
                                        Thanh toán
                                      </span>
                                      <span className="stj-quickview__value">
                                        {job.paymentMethod === "FIXED"
                                          ? "Trọn gói"
                                          : job.paymentMethod === "HOURLY"
                                            ? "Theo giờ"
                                            : "Milestone"}
                                      </span>
                                    </div>
                                    <div className="stj-quickview__field">
                                      <span className="stj-quickview__label">
                                        Ngày tạo
                                      </span>
                                      <span className="stj-quickview__value">
                                        {formatDate(job.createdAt)}
                                      </span>
                                    </div>
                                    <div className="stj-quickview__field">
                                      <span className="stj-quickview__label">
                                        Milestone
                                      </span>
                                      <span className="stj-quickview__value">
                                        {job.milestones?.length || 0} giai đoạn
                                      </span>
                                    </div>
                                  </div>
                                  {job.requiredSkills &&
                                    job.requiredSkills.length > 0 && (
                                      <div style={{ marginTop: "0.5rem" }}>
                                        <span
                                          className="stj-quickview__label"
                                          style={{
                                            marginBottom: "0.35rem",
                                            display: "block",
                                          }}
                                        >
                                          Kỹ năng yêu cầu
                                        </span>
                                        <div className="stj-skill-tags">
                                          {job.requiredSkills.map(
                                            (skill, idx) => (
                                              <span
                                                key={idx}
                                                className="stj-skill-tag"
                                              >
                                                {skill}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  <div
                                    style={{
                                      marginTop: "1rem",
                                      display: "flex",
                                      gap: "0.5rem",
                                    }}
                                  >
                                    <button
                                      className="stj-manager__btn stj-manager__btn--secondary"
                                      onClick={() => handleViewDetail(job.id)}
                                    >
                                      <Eye size={14} /> Xem Chi Tiết
                                    </button>
                                    {job.status ===
                                      ShortTermJobStatus.DRAFT && (
                                      <button
                                        className="stj-manager__btn stj-manager__btn--primary"
                                        onClick={() =>
                                          handleSubmitForApproval(job.id)
                                        }
                                      >
                                        <Send size={14} /> Gửi Duyệt
                                      </button>
                                    )}
                                    {job.status ===
                                      ShortTermJobStatus.PENDING_APPROVAL && (
                                      <span
                                        className="stj-badge stj-badge--pending-approval"
                                        style={{ padding: "0.35rem 0.75rem" }}
                                      >
                                        <Shield size={12} /> Đang chờ Admin
                                        duyệt
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="stj-summary">
                <span>
                  <FileText size={14} />
                  Hiển thị {filteredJobs.length} / {jobs.length} công việc
                </span>
                <span>
                  <Users size={14} />
                  Tổng {stats.totalApplicants} ứng viên
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.visible && (
        <div
          className="stj-overlay"
          onClick={() =>
            !isDeleting &&
            setDeleteDialog({ visible: false, jobId: null, title: "" })
          }
        >
          <div className="stj-dialog" onClick={(e) => e.stopPropagation()}>
            <AlertTriangle
              size={40}
              style={{ color: "#ef4444", marginBottom: "1rem" }}
            />
            <h3 className="stj-dialog__title">Xác nhận xóa</h3>
            <p className="stj-dialog__desc">
              Bạn có chắc chắn muốn xóa công việc{" "}
              <strong style={{ color: "#fff" }}>"{deleteDialog.title}"</strong>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="stj-dialog__actions">
              <button
                className="stj-dialog__btn stj-dialog__btn--cancel"
                onClick={() =>
                  setDeleteDialog({ visible: false, jobId: null, title: "" })
                }
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                className="stj-dialog__btn stj-dialog__btn--danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Job Dialog */}
      {closeDialog.visible && (
        <div
          className="stj-overlay"
          onClick={() =>
            !isClosing &&
            setCloseDialog({ visible: false, jobId: null, title: "" })
          }
        >
          <div className="stj-dialog stj-dialog--close" onClick={(e) => e.stopPropagation()}>
            <div className="stj-dialog__icon-wrap stj-dialog__icon-wrap--amber">
              <X size={32} />
            </div>
            <h3 className="stj-dialog__title">Đóng công việc</h3>
            <p className="stj-dialog__desc">
              Bạn có chắc chắn muốn đóng công việc{" "}
              <strong style={{ color: "#fff" }}>"{closeDialog.title}"</strong>?
              <br />
              <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                Công việc đã đóng sẽ chuyển sang trạng thái "Đã hủy" và bạn có thể xóa nếu cần.
              </span>
            </p>
            <div className="stj-dialog__actions">
              <button
                className="stj-dialog__btn stj-dialog__btn--cancel"
                onClick={() =>
                  setCloseDialog({ visible: false, jobId: null, title: "" })
                }
                disabled={isClosing}
              >
                Hủy
              </button>
              <button
                className="stj-dialog__btn stj-dialog__btn--warning"
                onClick={handleCloseJob}
                disabled={isClosing}
              >
                {isClosing ? "Đang đóng..." : "Đóng công việc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortTermJobManager;
