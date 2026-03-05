import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import adminService from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Clock,
  Zap,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox,
  Flame,
  TrendingUp,
  ChevronRight,
  Check,
  X,
  FileText,
  CreditCard,
  Star,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import Toast from "../shared/Toast";
import "./JobManagementTab.css";

type JobViewType = "regular" | "shortterm";

export const JobManagementTab: React.FC = () => {
  const { user } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning } =
    useToast();

  const [viewType, setViewType] = useState<JobViewType>("regular");
  const [jobs, setJobs] = useState<any[]>([]);
  const [shortTermJobs, setShortTermJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadPendingJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [regularData, shortTermData] = await Promise.all([
        adminService.getPendingJobs(),
        adminService.getPendingShortTermJobs(),
      ]);
      setJobs(regularData);
      setShortTermJobs(shortTermData);
    } catch (error) {
      console.error("Error loading pending jobs:", error);
      showError("Lỗi", "Không thể tải danh sách việc làm chờ duyệt");
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    loadPendingJobs();
  }, [loadPendingJobs]);

  const currentJobs = viewType === "regular" ? jobs : shortTermJobs;

  // Scroll lock for modals
  useEffect(() => {
    if (showDetailsModal || showActionModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDetailsModal, showActionModal]);

  const handleAction = async () => {
    if (!selectedJob) return;

    if (actionType === "reject" && !actionReason.trim()) {
      showWarning("Cảnh báo", "Vui lòng nhập lý do từ chối");
      return;
    }

    setActionLoading(true);
    try {
      if (viewType === "shortterm") {
        // Short-term job API
        if (actionType === "approve") {
          await adminService.approveShortTermJob(selectedJob.id);
          showSuccess("Thành công", "Đã duyệt tin tuyển dụng ngắn hạn");
        } else {
          await adminService.rejectShortTermJob(selectedJob.id, actionReason);
          showSuccess(
            "Thành công",
            "Đã từ chối tin tuyển dụng ngắn hạn và hoàn tiền",
          );
        }
      } else {
        // Regular job API
        if (actionType === "approve") {
          await adminService.approveJob(selectedJob.id);
          showSuccess("Thành công", "Đã duyệt tin tuyển dụng");
        } else {
          await adminService.rejectJob(selectedJob.id, actionReason);
          showSuccess("Thành công", "Đã từ chối tin tuyển dụng và hoàn tiền");
        }
      }

      await loadPendingJobs();
      setShowActionModal(false);
      setShowDetailsModal(false);
      setActionReason("");
    } catch (error) {
      console.error("Error processing job:", error);
      showError("Lỗi", "Không thể xử lý tin tuyển dụng");
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (type: "approve" | "reject") => {
    setActionType(type);
    setActionReason("");
    setShowActionModal(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case "URGENT":
        return {
          label: "Gấp",
          className: "jm-badge--urgent",
          icon: <Flame size={11} />,
        };
      case "HIGH":
        return {
          label: "Ưu tiên cao",
          className: "jm-badge--high",
          icon: <TrendingUp size={11} />,
        };
      default:
        return {
          label: "Bình thường",
          className: "jm-badge--normal",
          icon: null,
        };
    }
  };

  const getCompanyName = (job: any) =>
    viewType === "shortterm"
      ? job.recruiterInfo?.companyName || "N/A"
      : job.recruiterCompanyName || "N/A";

  const getBudgetLabel = (job: any) =>
    viewType === "shortterm"
      ? formatCurrency(job.budget)
      : `${formatCurrency(job.minBudget)} – ${formatCurrency(job.maxBudget)}`;

  return (
    <div className="jm-container">
      {/* ── Header ── */}
      <div className="jm-header">
        <div className="jm-header__info">
          <h2 className="jm-header__title">Duyệt Tuyển Dụng</h2>
          <div className="jm-header__badges">
            <span className="jm-stat-badge jm-stat-badge--purple">
              <Briefcase size={13} /> Dài hạn: {jobs.length}
            </span>
            <span className="jm-stat-badge jm-stat-badge--amber">
              <Zap size={13} /> Ngắn hạn: {shortTermJobs.length}
            </span>
          </div>
        </div>
        <button
          className="jm-btn jm-btn--refresh"
          onClick={loadPendingJobs}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={16} className="jm-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="jm-tabs">
        <button
          className={`jm-tab ${viewType === "regular" ? "jm-tab--active jm-tab--blue" : ""}`}
          onClick={() => setViewType("regular")}
        >
          <Briefcase size={15} />
          Tuyển dụng dài hạn
          <span className="jm-tab__count">{jobs.length}</span>
        </button>
        <button
          className={`jm-tab ${viewType === "shortterm" ? "jm-tab--active jm-tab--amber" : ""}`}
          onClick={() => setViewType("shortterm")}
        >
          <Zap size={15} />
          Gig / Ngắn hạn
          <span
            className={`jm-tab__count ${viewType === "shortterm" ? "jm-tab__count--amber" : ""}`}
          >
            {shortTermJobs.length}
          </span>
        </button>
      </div>

      {/* ── Cards ── */}
      {loading ? (
        <div className="jm-state-center">
          <Loader2 size={40} className="jm-spin jm-state__icon--loading" />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : currentJobs.length === 0 ? (
        <div className="jm-state-center">
          <Inbox size={48} className="jm-state__icon--empty" />
          <p>Không có tin tuyển dụng nào chờ duyệt</p>
        </div>
      ) : (
        <div className="jm-cards">
          {currentJobs.map((job) => {
            const urgency =
              viewType === "shortterm" ? getUrgencyConfig(job.urgency) : null;
            return (
              <div
                key={job.id}
                className={`jm-card ${viewType === "shortterm" ? "jm-card--amber" : "jm-card--blue"}`}
              >
                <div className="jm-card__accent" />
                <div className="jm-card__body">
                  <div className="jm-card__top">
                    <div className="jm-card__company">
                      <Building2 size={14} />
                      {getCompanyName(job)}
                    </div>
                    <div className="jm-card__badges">
                      <span className="jm-badge jm-badge--pending">
                        <AlertCircle size={11} /> Chờ duyệt
                      </span>
                      {urgency && (
                        <span className={`jm-badge ${urgency.className}`}>
                          {urgency.icon} {urgency.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="jm-card__title">{job.title}</h3>
                  <div className="jm-card__meta">
                    <span className="jm-card__meta-item jm-card__meta-item--green">
                      <DollarSign size={13} /> {getBudgetLabel(job)}
                    </span>
                    <span className="jm-card__meta-item">
                      <Calendar size={13} />{" "}
                      {formatDate(
                        viewType === "shortterm" ? job.deadline : job.createdAt,
                      )}
                    </span>
                    {viewType === "shortterm" && (
                      <span className="jm-card__meta-item">
                        <Clock size={13} /> {job.estimatedDuration || "N/A"}
                      </span>
                    )}
                    <span className="jm-card__meta-item">
                      <MapPin size={13} />{" "}
                      {job.isRemote ? "Remote" : job.location || "N/A"}
                    </span>
                  </div>
                  {job.requiredSkills?.length > 0 && (
                    <div className="jm-card__skills">
                      {job.requiredSkills
                        .slice(0, 4)
                        .map((skill: string, i: number) => (
                          <span key={i} className="jm-skill-chip">
                            {skill}
                          </span>
                        ))}
                      {job.requiredSkills.length > 4 && (
                        <span className="jm-skill-chip jm-skill-chip--more">
                          +{job.requiredSkills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="jm-card__actions">
                  <button
                    className="jm-action-btn jm-action-btn--view"
                    onClick={() => {
                      setSelectedJob(job);
                      setShowDetailsModal(true);
                    }}
                    title="Xem chi tiết"
                  >
                    <Eye size={15} />
                    <span>Chi tiết</span>
                    <ChevronRight size={13} />
                  </button>
                  <button
                    className="jm-action-btn jm-action-btn--approve"
                    onClick={() => {
                      setSelectedJob(job);
                      openActionModal("approve");
                    }}
                    title="Duyệt"
                  >
                    <CheckCircle size={15} />
                    <span>Duyệt</span>
                  </button>
                  <button
                    className="jm-action-btn jm-action-btn--reject"
                    onClick={() => {
                      setSelectedJob(job);
                      openActionModal("reject");
                    }}
                    title="Từ chối"
                  >
                    <XCircle size={15} />
                    <span>Từ chối</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Details Modal ── */}
      {showDetailsModal &&
        selectedJob &&
        ReactDOM.createPortal(
          <div
            className="jm-overlay"
            onClick={() => setShowDetailsModal(false)}
          >
            <div className="jm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="jm-modal__header">
                <div className="jm-modal__header-left">
                  <div
                    className={`jm-modal__type-icon ${viewType === "shortterm" ? "jm-modal__type-icon--amber" : "jm-modal__type-icon--blue"}`}
                  >
                    {viewType === "shortterm" ? (
                      <Zap size={18} />
                    ) : (
                      <Briefcase size={18} />
                    )}
                  </div>
                  <div>
                    <h2 className="jm-modal__title">Chi tiết tin tuyển dụng</h2>
                    <p className="jm-modal__subtitle">
                      {viewType === "shortterm"
                        ? "Công việc ngắn hạn / Gig"
                        : "Tuyển dụng dài hạn"}
                    </p>
                  </div>
                </div>
                <button
                  className="jm-modal__close"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="jm-modal__body">
                <div className="jm-detail__hero">
                  <div className="jm-detail__hero-top">
                    <h3 className="jm-detail__job-title">
                      {selectedJob.title}
                    </h3>
                    <div className="jm-detail__hero-badges">
                      <span className="jm-badge jm-badge--pending">
                        <AlertCircle size={12} /> Chờ duyệt
                      </span>
                      {viewType === "shortterm" &&
                        selectedJob.urgency &&
                        (() => {
                          const u = getUrgencyConfig(selectedJob.urgency);
                          return (
                            <span className={`jm-badge ${u.className}`}>
                              {u.icon} {u.label}
                            </span>
                          );
                        })()}
                    </div>
                  </div>
                  <div className="jm-detail__hero-meta">
                    <span className="jm-detail__meta-pill">
                      <Building2 size={13} />{" "}
                      {viewType === "shortterm"
                        ? selectedJob.recruiterInfo?.companyName || "N/A"
                        : selectedJob.recruiterCompanyName}
                    </span>
                    <span className="jm-detail__meta-pill">
                      <MapPin size={13} />{" "}
                      {selectedJob.isRemote
                        ? "Remote"
                        : selectedJob.location || "N/A"}
                    </span>
                    {viewType === "shortterm" && selectedJob.paymentMethod && (
                      <span className="jm-detail__meta-pill">
                        <CreditCard size={13} />{" "}
                        {selectedJob.paymentMethod === "MILESTONE"
                          ? "Theo Milestone"
                          : "Trọn gói"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="jm-detail__stats">
                  <div className="jm-detail__stat">
                    <div className="jm-detail__stat-icon jm-detail__stat-icon--green">
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <div className="jm-detail__stat-value">
                        {viewType === "shortterm"
                          ? formatCurrency(selectedJob.budget)
                          : `${formatCurrency(selectedJob.minBudget)} – ${formatCurrency(selectedJob.maxBudget)}`}
                      </div>
                      <div className="jm-detail__stat-label">Ngân sách</div>
                    </div>
                  </div>
                  <div className="jm-detail__stat">
                    <div className="jm-detail__stat-icon jm-detail__stat-icon--blue">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="jm-detail__stat-value">
                        {formatDate(
                          viewType === "shortterm"
                            ? selectedJob.deadline
                            : selectedJob.deadline || selectedJob.createdAt,
                        )}
                      </div>
                      <div className="jm-detail__stat-label">
                        {viewType === "shortterm"
                          ? "Deadline"
                          : "Hạn nộp hồ sơ"}
                      </div>
                    </div>
                  </div>
                  {viewType === "shortterm" && (
                    <>
                      <div className="jm-detail__stat">
                        <div className="jm-detail__stat-icon jm-detail__stat-icon--purple">
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="jm-detail__stat-value">
                            {selectedJob.estimatedDuration || "N/A"}
                          </div>
                          <div className="jm-detail__stat-label">
                            Thời gian ước tính
                          </div>
                        </div>
                      </div>
                      <div className="jm-detail__stat">
                        <div className="jm-detail__stat-icon jm-detail__stat-icon--amber">
                          <Users size={16} />
                        </div>
                        <div>
                          <div className="jm-detail__stat-value">
                            {selectedJob.maxApplicants || "∞"}
                          </div>
                          <div className="jm-detail__stat-label">
                            Ứng viên tối đa
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="jm-detail__section">
                  <h4 className="jm-detail__section-title">
                    <FileText size={15} /> Mô tả công việc
                  </h4>
                  <div
                    className="jm-detail__desc"
                    dangerouslySetInnerHTML={{
                      __html: selectedJob.description,
                    }}
                  />
                </div>
                <div className="jm-detail__section">
                  <h4 className="jm-detail__section-title">
                    <Star size={15} /> Kỹ năng yêu cầu
                  </h4>
                  <div className="jm-detail__skills">
                    {selectedJob.requiredSkills?.length > 0 ? (
                      selectedJob.requiredSkills.map(
                        (skill: string, idx: number) => (
                          <span key={idx} className="jm-skill-chip">
                            {skill}
                          </span>
                        ),
                      )
                    ) : (
                      <span className="jm-empty-text">
                        Không có yêu cầu kỹ năng cụ thể
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="jm-modal__footer">
                <button
                  className="jm-modal-btn jm-modal-btn--approve"
                  onClick={() => {
                    setShowDetailsModal(false);
                    openActionModal("approve");
                  }}
                >
                  <ShieldCheck size={16} /> Phê duyệt
                </button>
                <button
                  className="jm-modal-btn jm-modal-btn--reject"
                  onClick={() => {
                    setShowDetailsModal(false);
                    openActionModal("reject");
                  }}
                >
                  <XCircle size={16} /> Từ chối
                </button>
                <button
                  className="jm-modal-btn jm-modal-btn--secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ── Action Modal ── */}
      {showActionModal &&
        selectedJob &&
        ReactDOM.createPortal(
          <div className="jm-overlay" onClick={() => setShowActionModal(false)}>
            <div
              className="jm-modal jm-modal--sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="jm-modal__header">
                <div className="jm-modal__header-left">
                  <div
                    className={`jm-modal__type-icon ${actionType === "approve" ? "jm-modal__type-icon--green" : "jm-modal__type-icon--red"}`}
                  >
                    {actionType === "approve" ? (
                      <ShieldCheck size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </div>
                  <div>
                    <h2 className="jm-modal__title">
                      {actionType === "approve"
                        ? "Phê duyệt tin tuyển dụng"
                        : "Từ chối tin tuyển dụng"}
                    </h2>
                    <p className="jm-modal__subtitle">
                      {actionType === "approve"
                        ? "Tin sẽ được đăng công khai"
                        : "Tiền sẽ được hoàn lại recruiter"}
                    </p>
                  </div>
                </div>
                <button
                  className="jm-modal__close"
                  onClick={() => setShowActionModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="jm-modal__body">
                <div className="jm-confirm__job-card">
                  <div className="jm-confirm__job-icon">
                    {viewType === "shortterm" ? (
                      <Zap size={16} />
                    ) : (
                      <Briefcase size={16} />
                    )}
                  </div>
                  <div>
                    <div className="jm-confirm__job-title">
                      {selectedJob.title}
                    </div>
                    <div className="jm-confirm__job-company">
                      {getCompanyName(selectedJob)}
                    </div>
                  </div>
                </div>
                <div className="jm-form-group">
                  <label className="jm-form-label">
                    {actionType === "reject" ? (
                      <>
                        <AlertCircle size={14} /> Lý do từ chối{" "}
                        <span className="jm-required">*</span>
                      </>
                    ) : (
                      <>
                        <FileText size={14} /> Ghi chú (tùy chọn)
                      </>
                    )}
                  </label>
                  <textarea
                    className="jm-textarea"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={4}
                    placeholder={
                      actionType === "reject"
                        ? "Nhập lý do từ chối để gửi thông báo đến recruiter..."
                        : "Thêm ghi chú cho quyết định duyệt..."
                    }
                  />
                </div>
              </div>
              <div className="jm-modal__footer">
                <button
                  className={`jm-modal-btn ${actionType === "approve" ? "jm-modal-btn--approve" : "jm-modal-btn--reject"}`}
                  onClick={handleAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={15} className="jm-spin" /> Đang xử lý...
                    </>
                  ) : actionType === "approve" ? (
                    <>
                      <Check size={15} /> Xác nhận duyệt
                    </>
                  ) : (
                    <>
                      <X size={15} /> Xác nhận từ chối
                    </>
                  )}
                </button>
                <button
                  className="jm-modal-btn jm-modal-btn--secondary"
                  onClick={() => setShowActionModal(false)}
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
        />
      )}
    </div>
  );
};
