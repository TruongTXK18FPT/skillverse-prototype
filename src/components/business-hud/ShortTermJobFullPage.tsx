import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  FileText,
  Globe,
  Loader2,
  MapPin,
  Send,
  ShieldCheck,
  Star,
  Target,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getApplicantDisplayName,
  resolveRecruitmentAssetUrl,
} from "../../utils/recruitmentUi";
import {
  ShortTermApplicationResponse,
  ShortTermApplicationStatus,
  ShortTermJobResponse,
  ShortTermJobStatus,
  JobEscrow,
  EscrowStatus,
} from "../../types/ShortTermJob";
import shortTermJobService from "../../services/shortTermJobService";
import walletService from "../../services/walletService";
import { useToast } from "../../hooks/useToast";
import ShortTermJobHandoverBoard from "./ShortTermJobHandoverBoard";
import EscrowStatusBanner from "../short-term-job/EscrowStatusBanner";
import FundingModal from "../short-term-job/FundingModal";
import DisputePanel from "../short-term-job/DisputePanel";
import { JobMarkdownSurface } from "../shared/JobMarkdownSurface";
import "./short-term-fleet.css";

interface ShortTermJobFullPageProps {
  jobId: number;
  onBack: () => void;
  onEdit: (jobId: number) => void;
}

type FullPageTab = "overview" | "applicants" | "handover" | "milestone";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#64748b",
  PENDING_APPROVAL: "#fbbf24",
  PUBLISHED: "#3b82f6",
  APPLIED: "#22d3ee",
  IN_PROGRESS: "#f97316",
  SUBMITTED: "#a855f7",
  UNDER_REVIEW: "#fbbf24",
  APPROVED: "#34d399",
  REJECTED: "#fb7185",
  COMPLETED: "#4ade80",
  PAID: "#4ade80",
  CANCELLED: "#64748b",
  DISPUTED: "#fb7185",
  CLOSED: "#94a3b8",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bản nháp",
  PENDING_APPROVAL: "Chờ duyệt",
  PUBLISHED: "Đang tuyển",
  APPLIED: "Có ứng viên",
  IN_PROGRESS: "Đang thực hiện",
  SUBMITTED: "Đã nộp",
  UNDER_REVIEW: "Đang review",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  COMPLETED: "Hoàn thành",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  DISPUTED: "Tranh chấp",
  CLOSED: "Đã đóng",
};

const APP_STATUS_COLORS: Record<string, string> = {
  PENDING: "#3b82f6",
  ACCEPTED: "#34d399",
  REJECTED: "#fb7185",
  WORKING: "#f97316",
  SUBMITTED: "#a855f7",
  REVISION_REQUIRED: "#fbbf24",
  APPROVED: "#34d399",
  COMPLETED: "#4ade80",
  PAID: "#4ade80",
  CANCELLED: "#64748b",
  WITHDRAWN: "#64748b",
};

const APP_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  ACCEPTED: "Được chọn",
  REJECTED: "Từ chối",
  WORKING: "Đang làm",
  SUBMITTED: "Đã nộp",
  REVISION_REQUIRED: "Cần sửa",
  APPROVED: "Đã duyệt",
  COMPLETED: "Hoàn thành",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  WITHDRAWN: "Đã rút đơn",
};

const ShortTermJobFullPage = ({
  jobId,
  onBack,
  onEdit,
}: ShortTermJobFullPageProps) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<FullPageTab>("overview");
  const [job, setJob] = useState<ShortTermJobResponse | null>(null);
  const [applications, setApplications] = useState<
    ShortTermApplicationResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [acceptModal, setAcceptModal] =
    useState<ShortTermApplicationResponse | null>(null);
  const [escrow, setEscrow] = useState<JobEscrow | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showFundingModal, setShowFundingModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [jobData, appData, escrowData, walletData] = await Promise.all([
        shortTermJobService.getJobDetails(jobId),
        shortTermJobService.getJobApplicants(jobId, 0, 50),
        shortTermJobService.getEscrowStatus(jobId).catch(() => null),
        walletService.getMyWallet().catch(() => null),
      ]);
      setJob(jobData);
      setApplications(appData.content || []);
      setEscrow(escrowData);
      setWalletBalance(walletData?.cashBalance || 0);
    } catch (error: any) {
      showError(
        "Không thể tải chi tiết job",
        error.message || "Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleDeleteJob = async () => {
    if (!job) return;
    try {
      setIsActionBusy(true);
      await shortTermJobService.deleteJob(jobId);
      showSuccess("Đã xóa job", "Job đã được xóa thành công.");
      onBack();
    } catch (error: any) {
      showError("Không thể xóa job", error.message || "Vui lòng thử lại.");
    } finally {
      setIsActionBusy(false);
      setConfirmDelete(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!job) return;
    try {
      setIsActionBusy(true);
      const updated = await shortTermJobService.submitForApproval(jobId);
      setJob(updated);
      showSuccess("Đã gửi duyệt", "Job đã được gửi để admin phê duyệt.");
    } catch (error: any) {
      showError("Không thể gửi duyệt", error.message || "Vui lòng thử lại.");
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleCloseJob = async () => {
    if (!job) return;
    if (
      !window.confirm(
        `Đóng job "${job.title}"? Người đã nộp vẫn có thể tiếp tục nộp bài.`,
      )
    )
      return;
    try {
      setIsActionBusy(true);
      await shortTermJobService.changeJobStatus(
        jobId,
        ShortTermJobStatus.CLOSED,
      );
      showSuccess(
        "Đã đóng job",
        "Job đã được đóng lại. Ứng viên đã nộp vẫn có thể tiếp tục nộp bài.",
      );
      await loadData();
    } catch (error: any) {
      showError("Không thể đóng job", error.message || "Vui lòng thử lại.");
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleAcceptApplication = async () => {
    if (!acceptModal) return;
    const canApproveApplicants = escrow?.status === EscrowStatus.FUNDED;
    if (!canApproveApplicants) {
      showError(
        "Chưa ký quỹ",
        "Vui lòng ký quỹ trước khi duyệt ứng viên.",
      );
      return;
    }

    try {
      setIsActionBusy(true);
      await shortTermJobService.selectCandidate(jobId, acceptModal.id);
      showSuccess(
        "Đã chấp nhận ứng viên",
        `${acceptModal.userFullName} đã được chọn cho job này.`,
      );
      setAcceptModal(null);
      await loadData();
    } catch (error: any) {
      showError("Không thể chấp nhận", error.message || "Vui lòng thử lại.");
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleRejectApplication = async (app: ShortTermApplicationResponse) => {
    try {
      setIsActionBusy(true);
      await shortTermJobService.updateApplicationStatus(app.id, {
        status: ShortTermApplicationStatus.REJECTED,
      });
      showSuccess("Đã từ chối", "Ứng viên đã được thông báo.");
      await loadData();
    } catch (error: any) {
      showError("Không thể từ chối", error.message || "Vui lòng thử lại.");
    } finally {
      setIsActionBusy(false);
    }
  };

  const formatBudget = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date?: string): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="stj-fullpage stj-fullpage--loading">
        <Loader2 size={32} className="stj-spin" />
        <p>Đang tải chi tiết job...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="stj-fullpage">
        <div className="stj-handover-empty">
          <XCircle size={32} />
          <div>
            <strong>Không tìm thấy job</strong>
            <p>Job này có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingApps = applications.filter(
    (a) => a.status === ShortTermApplicationStatus.PENDING,
  );
  const handoverApps = applications.filter(
    (a) =>
      a.status === ShortTermApplicationStatus.SUBMITTED ||
      a.status === ShortTermApplicationStatus.REVISION_REQUIRED ||
      a.status === ShortTermApplicationStatus.APPROVED ||
      a.status === ShortTermApplicationStatus.COMPLETED ||
      a.status === ShortTermApplicationStatus.PAID,
  );
  const canApproveApplicants = escrow?.status === EscrowStatus.FUNDED;
  const approveBlockedMessage =
    "Cần ký quỹ trước khi duyệt ứng viên";

  return (
    <div className="stj-fullpage">
      {/* Header */}
      <header className="stj-fullpage__header">
        <div className="stj-fullpage__header-left">
          <button
            className="stj-fullpage__back"
            onClick={onBack}
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="stj-fullpage__job-info">
            <strong>{job.title}</strong>
            <span
              className="stj-fullpage__status-badge"
              style={{
                backgroundColor: `${STATUS_COLORS[job.status]}22`,
                color: STATUS_COLORS[job.status],
                borderColor: `${STATUS_COLORS[job.status]}44`,
              }}
            >
              {STATUS_LABELS[job.status] || job.status}
            </span>
          </div>
        </div>

        <div className="stj-fullpage__header-right">
          <span className="stj-fullpage__meta-pill">
            <DollarSign size={13} />
            {formatBudget(job.budget)}
          </span>
          <span className="stj-fullpage__meta-pill">
            <Calendar size={13} />
            {formatDate(job.deadline)}
          </span>

          <div className="stj-fullpage__actions">
            {job.status === ShortTermJobStatus.DRAFT && (
              <button
                className="stj-btn stj-btn--ghost"
                onClick={() => onEdit(jobId)}
              >
                <Edit2 size={14} />
                Chỉnh sửa
              </button>
            )}

            {job.status === ShortTermJobStatus.DRAFT && (
              <button
                className="stj-btn stj-btn--primary"
                disabled={isActionBusy}
                onClick={handleSubmitForApproval}
              >
                {isActionBusy ? (
                  <Loader2 size={14} className="stj-spin" />
                ) : (
                  <Send size={14} />
                )}
                Gửi duyệt
              </button>
            )}

            {job.status === ShortTermJobStatus.DRAFT && (
              <button
                className="stj-btn stj-btn--danger"
                disabled={isActionBusy}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} />
                Xóa
              </button>
            )}

            {(job.status === ShortTermJobStatus.PUBLISHED ||
              job.status === ShortTermJobStatus.APPLIED ||
              job.status === ShortTermJobStatus.IN_PROGRESS) &&
              applications.some(
                (a) => a.status === ShortTermApplicationStatus.ACCEPTED,
              ) && (
                <button
                  className="stj-btn stj-btn--ghost"
                  disabled={isActionBusy}
                  onClick={handleCloseJob}
                >
                  {isActionBusy ? (
                    <Loader2 size={14} className="stj-spin" />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  Đóng job
                </button>
              )}
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="stj-fullpage__stats">
        <div className="stj-fullpage__stat-item">
          <Users size={16} />
          <strong>{applications.length}</strong>
          <span>Ứng viên</span>
        </div>
        {job.urgency && job.urgency !== "NORMAL" && (
          <div className="stj-fullpage__stat-item stj-fullpage__stat-item--urgent">
            <Target size={16} />
            <strong>{job.urgency}</strong>
            <span>Độ khẩn</span>
          </div>
        )}
        <div className="stj-fullpage__stat-item">
          {job.isRemote ? <Globe size={16} /> : <MapPin size={16} />}
          <strong>{job.isRemote ? "Từ xa" : job.location || "On-site"}</strong>
          <span>Loại</span>
        </div>
        {job.minRating !== undefined && (
          <div className="stj-fullpage__stat-item">
            <Star size={16} />
            <strong>{job.minRating}+</strong>
            <span>Rating tối thiểu</span>
          </div>
        )}
      </div>

      {/* Escrow Status Banner */}
      <EscrowStatusBanner
        escrow={escrow}
        jobId={jobId}
        currentUserRole="RECRUITER"
        onFund={() => setShowFundingModal(true)}
        onRelease={async () => {
          try {
            setIsActionBusy(true);
            await shortTermJobService.releaseEscrow(jobId);
            showSuccess(
              "Đã giải phóng thanh toán",
              "Thanh toán đã được giải phóng cho ứng viên.",
            );
            window.dispatchEvent(new Event("wallet:updated"));
            await loadData();
          } catch (error: any) {
            showError(
              "Không thể giải phóng",
              error.message || "Vui lòng thử lại.",
            );
          } finally {
            setIsActionBusy(false);
          }
        }}
        onDispute={() => {}}
        onRefund={async () => {
          try {
            setIsActionBusy(true);
            await shortTermJobService.refundEscrow(jobId, "Hoàn tiền ký quỹ");
            showSuccess("Đã hoàn tiền", "Tiền ký quỹ đã được hoàn vào ví.");
            window.dispatchEvent(new Event("wallet:updated"));
            await loadData();
          } catch (error: any) {
            showError(
              "Không thể hoàn tiền",
              error.message || "Vui lòng thử lại.",
            );
          } finally {
            setIsActionBusy(false);
          }
        }}
      />

      {/* Tabs */}
      <nav className="stj-fullpage__tabs">
        <button
          className={`stj-fullpage__tab ${activeTab === "overview" ? "is-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FileText size={14} />
          Tổng quan
        </button>
        <button
          className={`stj-fullpage__tab ${activeTab === "applicants" ? "is-active" : ""}`}
          onClick={() => setActiveTab("applicants")}
        >
          <Users size={14} />
          Ứng viên ({applications.length})
        </button>
        <button
          className={`stj-fullpage__tab ${activeTab === "handover" ? "is-active" : ""}`}
          onClick={() => setActiveTab("handover")}
        >
          <CheckCircle2 size={14} />
          Bàn giao ({handoverApps.length})
        </button>
        {job.milestones && job.milestones.length > 0 && (
          <button
            className={`stj-fullpage__tab ${activeTab === "milestone" ? "is-active" : ""}`}
            onClick={() => setActiveTab("milestone")}
          >
            <Target size={14} />
            Milestone ({job.milestones.length})
          </button>
        )}
      </nav>

      {/* Tab Content */}
      <div className="stj-fullpage__content">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="stj-fullpage__overview">
            <div className="stj-fullpage__overview-grid">
              <div className="stj-fullpage__detail-card stj-fullpage__detail-card--description">
                <h3>Mô tả công việc</h3>
                <div className="stj-fullpage__description">
                  <JobMarkdownSurface
                    content={job.description || "Chưa có mô tả chi tiết."}
                    density="detail"
                    theme="cyan"
                    placeholder="Chưa có mô tả chi tiết."
                  />
                  {/*
                  {job.description || 'Chưa có mô tả chi tiết.'}
                  */}
                </div>
              </div>

              <div className="stj-fullpage__detail-card">
                <h3>Thông tin job</h3>
                <div className="stj-fullpage__info-list">
                  <div className="stj-fullpage__info-row">
                    <span>Ngân sách</span>
                    <strong>{formatBudget(job.budget)}</strong>
                  </div>
                  <div className="stj-fullpage__info-row">
                    <span>Deadline</span>
                    <strong>{formatDate(job.deadline)}</strong>
                  </div>
                  <div className="stj-fullpage__info-row">
                    <span>Ước tính thời gian</span>
                    <strong>{job.estimatedDuration || "N/A"}</strong>
                  </div>
                  <div className="stj-fullpage__info-row">
                    <span>Hình thức</span>
                    <strong>
                      {job.isRemote ? "Từ xa" : job.location || "On-site"}
                    </strong>
                  </div>
                  <div className="stj-fullpage__info-row">
                    <span>Đăng lúc</span>
                    <strong>{formatDate(job.createdAt)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="stj-fullpage__detail-card">
                <h3>Kỹ năng yêu cầu</h3>
                <div className="stj-fullpage__skills">
                  {job.requiredSkills.map((skill) => (
                    <span key={skill} className="stj-fullpage__skill-chip">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.milestones && job.milestones.length > 0 && (
              <div className="stj-fullpage__detail-card">
                <h3>Milestones ({job.milestones.length})</h3>
                <div className="stj-fullpage__milestone-list">
                  {job.milestones.map((ms) => (
                    <div key={ms.id} className="stj-fullpage__milestone-item">
                      <div className="stj-fullpage__milestone-header">
                        <strong>{ms.title}</strong>
                        <span
                          className="stj-fullpage__milestone-status"
                          style={{
                            color: STATUS_COLORS[ms.status] || "#64748b",
                          }}
                        >
                          {STATUS_LABELS[ms.status] || ms.status}
                        </span>
                      </div>
                      <p>{ms.description}</p>
                      <div className="stj-fullpage__milestone-meta">
                        <span>{formatBudget(ms.amount)}</span>
                        <span>Deadline: {formatDate(ms.deadline)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dispute Panel */}
            <DisputePanel
              jobId={jobId}
              applicationId={job.selectedApplicantId}
              currentUserId={user?.id || 0}
              currentUserRole="RECRUITER"
              jobStatus={job.status}
            />
          </div>
        )}

        {/* Applicants Tab */}
        {activeTab === "applicants" && (
          <div className="stj-fullpage__applicants">
            {applications.length === 0 ? (
              <div className="stj-handover-empty">
                <Users size={32} />
                <div>
                  <strong>Chưa có ứng viên nào</strong>
                  <p>
                    Job này chưa có ai ứng tuyển. Hãy đăng job để thu hút ứng
                    viên.
                  </p>
                </div>
              </div>
            ) : (
              <div className="stj-fullpage__app-grid">
                {applications.map((app) => (
                  <div key={app.id} className="stj-fullpage__app-card">
                    <div className="stj-fullpage__app-header">
                      <div className="stj-fullpage__app-identity">
                        {app.userAvatar ? (
                          <img
                            src={
                              resolveRecruitmentAssetUrl(app.userAvatar) || ""
                            }
                            alt={app.userFullName}
                            className="stj-handover-card__avatar"
                          />
                        ) : (
                          <div className="stj-handover-card__avatar stj-handover-card__avatar--fallback">
                            {app.userFullName
                              ? app.userFullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : "??"}
                          </div>
                        )}
                        <div>
                          <strong>
                            {getApplicantDisplayName(
                              app.userFullName,
                              app.userEmail,
                            )}
                          </strong>
                          <span>{app.userProfessionalTitle || "Ứng viên"}</span>
                        </div>
                      </div>
                      <span
                        className="stj-fullpage__app-status"
                        style={{
                          backgroundColor: `${APP_STATUS_COLORS[app.status]}22`,
                          color: APP_STATUS_COLORS[app.status],
                        }}
                      >
                        {APP_STATUS_LABELS[app.status] || app.status}
                      </span>
                    </div>

                    {app.coverLetter && (
                      <p className="stj-fullpage__app-letter">
                        {app.coverLetter}
                      </p>
                    )}

                    <div className="stj-fullpage__app-meta">
                      <span>Nộp: {formatDate(app.appliedAt)}</span>
                      {app.proposedPrice && (
                        <span>Đề xuất: {formatBudget(app.proposedPrice)}</span>
                      )}
                      {app.proposedDuration && (
                        <span>Thời gian: {app.proposedDuration}</span>
                      )}
                    </div>

                    {app.status === ShortTermApplicationStatus.PENDING && (
                      <div className="stj-fullpage__app-actions">
                        <button
                          className="stj-btn stj-btn--approve"
                          disabled={isActionBusy || !canApproveApplicants}
                          title={
                            canApproveApplicants
                              ? "Chấp nhận ứng viên"
                              : approveBlockedMessage
                          }
                          onClick={() => setAcceptModal(app)}
                        >
                          <CheckCircle2 size={13} />
                          Chấp nhận
                        </button>
                        <button
                          className="stj-btn stj-btn--danger"
                          disabled={isActionBusy}
                          onClick={() => handleRejectApplication(app)}
                        >
                          <XCircle size={13} />
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Handover Tab */}
        {activeTab === "handover" && (
          <ShortTermJobHandoverBoard
            job={job}
            applications={applications}
            onRefresh={handleRefresh}
            onJobUpdate={(updated) => setJob(updated)}
          />
        )}

        {/* Milestone Tab */}
        {activeTab === "milestone" &&
          job.milestones &&
          job.milestones.length > 0 && (
            <div className="stj-fullpage__milestones">
              {job.milestones.map((ms, idx) => (
                <div key={ms.id} className="stj-fullpage__milestone-card">
                  <div className="stj-fullpage__milestone-header">
                    <div className="stj-fullpage__milestone-num">{idx + 1}</div>
                    <div>
                      <strong>{ms.title}</strong>
                      <span
                        style={{
                          color: STATUS_COLORS[ms.status] || "#64748b",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                        }}
                      >
                        {STATUS_LABELS[ms.status] || ms.status}
                      </span>
                    </div>
                  </div>
                  <p>{ms.description}</p>
                  <div className="stj-fullpage__milestone-footer">
                    <span>{formatBudget(ms.amount)}</span>
                    <span>Deadline: {formatDate(ms.deadline)}</span>
                    {ms.completedAt && (
                      <span>Hoàn thành: {formatDate(ms.completedAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Accept Confirmation Modal */}
      {acceptModal && (
        <div
          className="stj-modal-backdrop"
          onClick={() => setAcceptModal(null)}
        >
          <div className="stj-modal" onClick={(e) => e.stopPropagation()}>
            <span className="stj-modal__eyebrow">Chấp nhận ứng viên</span>
            <h3>{acceptModal.userFullName}</h3>
            <p>
              Bạn sắp chọn ứng viên này cho job <strong>"{job.title}"</strong>.
              Ứng viên sẽ nhận được thông báo và bắt đầu nhận việc.
            </p>
            <div className="stj-modal__actions">
              <button
                className="stj-btn stj-btn--secondary"
                onClick={() => setAcceptModal(null)}
              >
                Huỷ
              </button>
              <button
                className="stj-btn stj-btn--approve"
                disabled={isActionBusy || !canApproveApplicants}
                title={
                  canApproveApplicants
                    ? "Xác nhận chọn ứng viên"
                    : approveBlockedMessage
                }
                onClick={handleAcceptApplication}
              >
                {isActionBusy ? (
                  <Loader2 size={13} className="stj-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                Xác nhận chọn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="stj-modal-backdrop"
          onClick={() => setConfirmDelete(false)}
        >
          <div className="stj-modal" onClick={(e) => e.stopPropagation()}>
            <span className="stj-modal__eyebrow">Xác nhận xóa</span>
            <h3>Xóa job "{job.title}"?</h3>
            <p>
              Hành động này không thể hoàn tác. Job sẽ bị xóa vĩnh viễn cùng với
              tất cả dữ liệu liên quan.
            </p>
            <div className="stj-modal__actions">
              <button
                className="stj-btn stj-btn--secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Huỷ
              </button>
              <button
                className="stj-btn stj-btn--danger"
                disabled={isActionBusy}
                onClick={handleDeleteJob}
              >
                {isActionBusy ? (
                  <Loader2 size={13} className="stj-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Funding Modal */}
      <FundingModal
        visible={showFundingModal}
        jobId={jobId}
        jobTitle={job.title}
        budget={job.budget}
        walletBalance={walletBalance}
        onClose={() => setShowFundingModal(false)}
        onEscrowFunded={async () => {
          setShowFundingModal(false);
          await loadData();
          showSuccess("Đã ký quỹ", "Tiền đã được ký quỹ thành công.");
          window.dispatchEvent(new Event("wallet:updated"));
        }}
      />
    </div>
  );
};

export default ShortTermJobFullPage;
