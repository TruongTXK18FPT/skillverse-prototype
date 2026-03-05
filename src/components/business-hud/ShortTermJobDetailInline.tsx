import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Edit2,
  ExternalLink,
  Globe,
  MapPin,
  Send,
  Star,
  Tag,
  Target,
  Users,
  Zap,
  CheckCircle,
  AlertTriangle,
  FileText,
  Eye,
  Shield,
} from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import {
  ShortTermJobResponse,
  ShortTermJobStatus,
  ShortTermApplicationResponse,
} from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import "./short-term-fleet.css";

// ==================== HELPERS ====================

const STATUS_CONFIG: Record<
  string,
  { label: string; cssClass: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Bản nháp",
    cssClass: "stj-detail-status--draft",
    icon: <FileText size={14} />,
  },
  PENDING_APPROVAL: {
    label: "Chờ duyệt",
    cssClass: "stj-detail-status--pending",
    icon: <Shield size={14} />,
  },
  PUBLISHED: {
    label: "Đang tuyển",
    cssClass: "stj-detail-status--published",
    icon: <Zap size={14} />,
  },
  APPLIED: {
    label: "Có ứng viên",
    cssClass: "stj-detail-status--applied",
    icon: <Users size={14} />,
  },
  IN_PROGRESS: {
    label: "Đang thực hiện",
    cssClass: "stj-detail-status--in-progress",
    icon: <Clock size={14} />,
  },
  SUBMITTED: {
    label: "Đã nộp bài",
    cssClass: "stj-detail-status--submitted",
    icon: <Send size={14} />,
  },
  UNDER_REVIEW: {
    label: "Đang review",
    cssClass: "stj-detail-status--review",
    icon: <Eye size={14} />,
  },
  APPROVED: {
    label: "Đã duyệt",
    cssClass: "stj-detail-status--approved",
    icon: <CheckCircle size={14} />,
  },
  REJECTED: {
    label: "Từ chối",
    cssClass: "stj-detail-status--rejected",
    icon: <AlertTriangle size={14} />,
  },
  COMPLETED: {
    label: "Hoàn thành",
    cssClass: "stj-detail-status--completed",
    icon: <CheckCircle size={14} />,
  },
  PAID: {
    label: "Đã thanh toán",
    cssClass: "stj-detail-status--paid",
    icon: <DollarSign size={14} />,
  },
  CANCELLED: {
    label: "Đã hủy",
    cssClass: "stj-detail-status--cancelled",
    icon: <AlertTriangle size={14} />,
  },
  DISPUTED: {
    label: "Tranh chấp",
    cssClass: "stj-detail-status--disputed",
    icon: <AlertTriangle size={14} />,
  },
};

const PAYMENT_LABELS: Record<string, string> = {
  FIXED: "Trọn gói",
  HOURLY: "Theo giờ",
  MILESTONE: "Theo giai đoạn",
};

const formatBudget = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getDaysRemaining = (
  deadline: string,
): { days: number; text: string; isExpired: boolean; cssClass: string } => {
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0)
    return {
      days,
      text: "Đã hết hạn",
      isExpired: true,
      cssClass: "stj-detail-deadline--expired",
    };
  if (days === 0)
    return {
      days: 0,
      text: "Hôm nay là hạn cuối",
      isExpired: false,
      cssClass: "stj-detail-deadline--urgent",
    };
  if (days <= 3)
    return {
      days,
      text: `Còn ${days} ngày`,
      isExpired: false,
      cssClass: "stj-detail-deadline--urgent",
    };
  return {
    days,
    text: `Còn ${days} ngày`,
    isExpired: false,
    cssClass: "stj-detail-deadline--normal",
  };
};

// ==================== COMPONENT ====================

interface ShortTermJobDetailInlineProps {
  jobId: number;
  onBack: () => void;
  onEdit?: (jobId: number) => void;
  onRefresh?: () => void;
}

const ShortTermJobDetailInline: React.FC<ShortTermJobDetailInlineProps> = ({
  jobId,
  onBack,
  onEdit,
  onRefresh,
}) => {
  const { showSuccess, showError } = useToast();

  const [job, setJob] = useState<ShortTermJobResponse | null>(null);
  const [applications, setApplications] = useState<
    ShortTermApplicationResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "applicants" | "milestones"
  >("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==================== DATA FETCHING ====================
  const fetchJobDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await shortTermJobService.getJobDetails(jobId);
      setJob(data);

      // Fetch applications if job is not draft
      if (
        data.status !== ShortTermJobStatus.DRAFT &&
        data.status !== ShortTermJobStatus.PENDING_APPROVAL
      ) {
        try {
          const result = await shortTermJobService.getJobApplicants(jobId);
          setApplications(result.content);
        } catch {
          // May not have permission — ignore
        }
      }
    } catch (error) {
      console.error("Failed to fetch job details:", error);
      showError("Lỗi", "Không thể tải thông tin công việc");
    } finally {
      setIsLoading(false);
    }
  }, [jobId, showError]);

  useEffect(() => {
    fetchJobDetail();
  }, [fetchJobDetail]);

  // ==================== ACTIONS ====================
  const handleSubmitForApproval = async () => {
    if (!job) return;
    setIsSubmitting(true);
    try {
      await shortTermJobService.submitForApproval(job.id);
      showSuccess("Đã gửi duyệt", "Công việc đã được gửi cho Admin xét duyệt");
      fetchJobDetail();
      onRefresh?.();
    } catch (error: any) {
      showError("Lỗi", error.message || "Không thể gửi duyệt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenFullDetail = () => {
    window.open(`/short-term-jobs/${jobId}`, "_blank");
  };

  // ==================== RENDER ====================
  if (isLoading) {
    return (
      <div className="stj-detail-loading">
        <div className="stj-detail-loading__spinner" />
        <span>Đang tải thông tin...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="stj-detail-empty">
        <AlertTriangle size={36} />
        <h3>Không tìm thấy công việc</h3>
        <button
          className="stj-detail-btn stj-detail-btn--secondary"
          onClick={onBack}
        >
          <ArrowLeft size={14} /> Quay lại
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[job.status] || {
    label: job.status,
    cssClass: "",
    icon: null,
  };
  const deadline = getDaysRemaining(job.deadline);

  return (
    <div className="stj-detail">
      {/* ====== Header ====== */}
      <div className="stj-detail__header">
        <div className="stj-detail__header-top">
          <button
            className="stj-detail-btn stj-detail-btn--ghost"
            onClick={onBack}
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>
          <div className="stj-detail__header-actions">
            {(job.status === ShortTermJobStatus.DRAFT ||
              job.status === ShortTermJobStatus.PUBLISHED ||
              job.status === ShortTermJobStatus.PENDING_APPROVAL) &&
              onEdit && (
                <button
                  className="stj-detail-btn stj-detail-btn--secondary"
                  onClick={() => onEdit(job.id)}
                >
                  <Edit2 size={14} /> Chỉnh sửa
                </button>
              )}
            {job.status === ShortTermJobStatus.DRAFT && (
              <button
                className="stj-detail-btn stj-detail-btn--primary"
                onClick={handleSubmitForApproval}
                disabled={isSubmitting}
              >
                <Send size={14} /> {isSubmitting ? "Đang gửi..." : "Gửi Duyệt"}
              </button>
            )}
            <button
              className="stj-detail-btn stj-detail-btn--ghost"
              onClick={handleOpenFullDetail}
              title="Mở trang chi tiết đầy đủ"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Title + Status */}
        <div className="stj-detail__title-row">
          <div className="stj-detail__title-info">
            <h2 className="stj-detail__title">{job.title}</h2>
            <div className="stj-detail__meta">
              <span className={`stj-detail-status ${statusInfo.cssClass}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
              {job.urgency && job.urgency !== "NORMAL" && (
                <span className="stj-detail-urgency">
                  <Zap size={12} />
                  {job.urgency === "URGENT"
                    ? "Gấp"
                    : job.urgency === "VERY_URGENT"
                      ? "Rất gấp"
                      : "Cần ngay"}
                </span>
              )}
              <span className="stj-detail__meta-item">
                <Calendar size={12} /> Tạo: {formatDateShort(job.createdAt)}
              </span>
            </div>
          </div>
          <div className="stj-detail__budget-badge">
            <span className="stj-detail__budget-amount">
              {formatBudget(job.budget)}
            </span>
            <span className="stj-detail__budget-type">
              {PAYMENT_LABELS[job.paymentMethod] || job.paymentMethod}
              {job.isNegotiable && " · Thương lượng"}
            </span>
          </div>
        </div>
      </div>

      {/* ====== Quick Stats ====== */}
      <div className="stj-detail__stats">
        <div className="stj-detail__stat">
          <Clock size={16} />
          <div>
            <span className="stj-detail__stat-value">
              {job.estimatedDuration || "—"}
            </span>
            <span className="stj-detail__stat-label">Thời gian</span>
          </div>
        </div>
        <div className="stj-detail__stat">
          <Calendar size={16} />
          <div>
            <span className={`stj-detail__stat-value ${deadline.cssClass}`}>
              {formatDateShort(job.deadline)}
            </span>
            <span className="stj-detail__stat-label">{deadline.text}</span>
          </div>
        </div>
        <div className="stj-detail__stat">
          <Users size={16} />
          <div>
            <span className="stj-detail__stat-value">
              {job.applicantCount || 0}
              {job.maxApplicants ? `/${job.maxApplicants}` : ""}
            </span>
            <span className="stj-detail__stat-label">Ứng viên</span>
          </div>
        </div>
        <div className="stj-detail__stat">
          {job.isRemote ? <Globe size={16} /> : <MapPin size={16} />}
          <div>
            <span className="stj-detail__stat-value">
              {job.isRemote ? "Remote" : job.location || "Onsite"}
            </span>
            <span className="stj-detail__stat-label">Hình thức</span>
          </div>
        </div>
        {job.minRating && (
          <div className="stj-detail__stat">
            <Star size={16} />
            <div>
              <span className="stj-detail__stat-value">≥ {job.minRating}★</span>
              <span className="stj-detail__stat-label">Rating tối thiểu</span>
            </div>
          </div>
        )}
      </div>

      {/* ====== Pending Approval Notice ====== */}
      {job.status === ShortTermJobStatus.PENDING_APPROVAL && (
        <div className="stj-detail__notice stj-detail__notice--warning">
          <Shield size={18} />
          <div>
            <strong>Đang chờ Admin duyệt</strong>
            <p>
              Bài đăng của bạn đã được gửi và đang chờ Admin xét duyệt. Sau khi
              được duyệt, phí đăng tin sẽ được trừ và bài viết sẽ xuất hiện trên
              trang tìm việc.
            </p>
          </div>
        </div>
      )}

      {/* ====== Tabs ====== */}
      <div className="stj-detail__tabs">
        <button
          className={`stj-detail__tab ${activeTab === "overview" ? "stj-detail__tab--active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FileText size={14} /> Tổng quan
        </button>
        <button
          className={`stj-detail__tab ${activeTab === "applicants" ? "stj-detail__tab--active" : ""}`}
          onClick={() => setActiveTab("applicants")}
        >
          <Users size={14} /> Ứng viên ({applications.length})
        </button>
        {job.milestones && job.milestones.length > 0 && (
          <button
            className={`stj-detail__tab ${activeTab === "milestones" ? "stj-detail__tab--active" : ""}`}
            onClick={() => setActiveTab("milestones")}
          >
            <Target size={14} /> Milestone ({job.milestones.length})
          </button>
        )}
      </div>

      {/* ====== Tab Content ====== */}
      <div className="stj-detail__content">
        {/* ---- Overview Tab ---- */}
        {activeTab === "overview" && (
          <div className="stj-detail__overview">
            {/* Description */}
            <div className="stj-detail__section">
              <h3 className="stj-detail__section-title">
                <FileText size={16} /> Mô tả công việc
              </h3>
              <div className="stj-detail__description">
                {job.description?.split("\n").map((line, idx) => (
                  <p key={idx}>{line || "\u00A0"}</p>
                ))}
              </div>
            </div>

            {/* Required Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="stj-detail__section">
                <h3 className="stj-detail__section-title">
                  <Tag size={16} /> Kỹ năng yêu cầu
                </h3>
                <div className="stj-detail__skills">
                  {job.requiredSkills.map((skill, idx) => (
                    <span key={idx} className="stj-detail__skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Info */}
            <div className="stj-detail__section">
              <h3 className="stj-detail__section-title">
                <Clock size={16} /> Thông tin thời gian
              </h3>
              <div className="stj-detail__info-grid">
                <div className="stj-detail__info-item">
                  <span className="stj-detail__info-label">Ngày tạo</span>
                  <span className="stj-detail__info-value">
                    {formatDate(job.createdAt)}
                  </span>
                </div>
                {job.publishedAt && (
                  <div className="stj-detail__info-item">
                    <span className="stj-detail__info-label">Ngày đăng</span>
                    <span className="stj-detail__info-value">
                      {formatDate(job.publishedAt)}
                    </span>
                  </div>
                )}
                {job.startTime && (
                  <div className="stj-detail__info-item">
                    <span className="stj-detail__info-label">Bắt đầu</span>
                    <span className="stj-detail__info-value">
                      {formatDate(job.startTime)}
                    </span>
                  </div>
                )}
                <div className="stj-detail__info-item">
                  <span className="stj-detail__info-label">Deadline</span>
                  <span
                    className={`stj-detail__info-value ${deadline.cssClass}`}
                  >
                    {formatDate(job.deadline)}
                  </span>
                </div>
                {job.completedAt && (
                  <div className="stj-detail__info-item">
                    <span className="stj-detail__info-label">Hoàn thành</span>
                    <span className="stj-detail__info-value">
                      {formatDate(job.completedAt)}
                    </span>
                  </div>
                )}
                {job.paidAt && (
                  <div className="stj-detail__info-item">
                    <span className="stj-detail__info-label">Thanh toán</span>
                    <span className="stj-detail__info-value">
                      {formatDate(job.paidAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- Applicants Tab ---- */}
        {activeTab === "applicants" && (
          <div className="stj-detail__applicants">
            {applications.length === 0 ? (
              <div className="stj-detail__no-data">
                <Users size={32} />
                <p>Chưa có ứng viên nào</p>
              </div>
            ) : (
              <div className="stj-detail__applicant-list">
                {applications.map((app) => (
                  <div key={app.id} className="stj-detail__applicant-card">
                    <div className="stj-detail__applicant-info">
                      <div className="stj-detail__applicant-avatar">
                        {app.userFullName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <span className="stj-detail__applicant-name">
                          {app.userFullName}
                        </span>
                        <span className="stj-detail__applicant-email">
                          {app.userEmail}
                        </span>
                      </div>
                    </div>
                    <div className="stj-detail__applicant-meta">
                      {app.proposedPrice && (
                        <span className="stj-detail__applicant-price">
                          <DollarSign size={12} />{" "}
                          {formatBudget(app.proposedPrice)}
                        </span>
                      )}
                      <span
                        className={`stj-detail__applicant-status stj-detail__applicant-status--${app.status.toLowerCase()}`}
                      >
                        {app.status}
                      </span>
                    </div>
                    {app.coverLetter && (
                      <p className="stj-detail__applicant-letter">
                        {app.coverLetter.length > 200
                          ? `${app.coverLetter.substring(0, 200)}...`
                          : app.coverLetter}
                      </p>
                    )}
                    <span className="stj-detail__applicant-date">
                      Ứng tuyển: {formatDateShort(app.appliedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- Milestones Tab ---- */}
        {activeTab === "milestones" && (
          <div className="stj-detail__milestones">
            {job.milestones && job.milestones.length > 0 ? (
              <div className="stj-detail__milestone-list">
                {job.milestones
                  .sort((a, b) => a.order - b.order)
                  .map((ms, idx) => (
                    <div key={ms.id} className="stj-detail__milestone-card">
                      <div className="stj-detail__milestone-header">
                        <span className="stj-detail__milestone-order">
                          {idx + 1}
                        </span>
                        <div className="stj-detail__milestone-info">
                          <span className="stj-detail__milestone-title">
                            {ms.title}
                          </span>
                          <span className="stj-detail__milestone-amount">
                            {formatBudget(ms.amount)}
                          </span>
                        </div>
                        <span
                          className={`stj-detail__milestone-status stj-detail__milestone-status--${ms.status.toLowerCase()}`}
                        >
                          {ms.status === "PENDING"
                            ? "Chờ"
                            : ms.status === "IN_PROGRESS"
                              ? "Đang làm"
                              : ms.status === "SUBMITTED"
                                ? "Đã nộp"
                                : ms.status === "APPROVED"
                                  ? "Hoàn thành"
                                  : "Từ chối"}
                        </span>
                      </div>
                      {ms.description && (
                        <p className="stj-detail__milestone-desc">
                          {ms.description}
                        </p>
                      )}
                      <div className="stj-detail__milestone-meta">
                        <span>
                          <Calendar size={12} /> Hạn:{" "}
                          {formatDateShort(ms.deadline)}
                        </span>
                        {ms.completedAt && (
                          <span>
                            <CheckCircle size={12} /> Xong:{" "}
                            {formatDateShort(ms.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="stj-detail__no-data">
                <Target size={32} />
                <p>Không có milestone</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortTermJobDetailInline;
