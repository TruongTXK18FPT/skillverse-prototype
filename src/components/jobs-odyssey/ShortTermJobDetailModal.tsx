import React, { useState } from "react";
import ReactDOM from "react-dom";
import {
  X,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Calendar,
  Building2,
  Users,
  Flame,
  TrendingUp,
  Zap,
  CreditCard,
  Star,
  FileText,
  CheckCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import shortTermJobService from "../../services/shortTermJobService";
import { ShortTermJobResponse } from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import Toast from "../shared/Toast";
import "./ShortTermJobDetailModal.css";

interface ShortTermJobDetailModalProps {
  job: ShortTermJobResponse;
  onClose: () => void;
  onApplySuccess?: () => void;
}

const ShortTermJobDetailModal: React.FC<ShortTermJobDetailModalProps> = ({
  job,
  onClose,
  onApplySuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning } =
    useToast();

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedPrice, setProposedPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userRole = user?.roles?.[0];
  const isRecruiter = userRole === "RECRUITER";
  const isCanApply = isAuthenticated && !isRecruiter;

  const getVariant = (): "urgent" | "high" | "normal" => {
    if (job.urgency === "VERY_URGENT" || job.urgency === "ASAP")
      return "urgent";
    if (job.urgency === "URGENT") return "high";
    return "normal";
  };
  const variant = getVariant();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("vi-VN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDeadlineDays = () => {
    if (!job.deadline) return null;
    const diff = Math.ceil(
      (new Date(job.deadline).getTime() - Date.now()) / 86400000,
    );
    return diff;
  };

  const urgencyConfig = {
    urgent: {
      label: "Gấp",
      icon: <Flame size={14} />,
      cls: "stm-badge--urgent",
    },
    high: {
      label: "Ưu tiên cao",
      icon: <TrendingUp size={14} />,
      cls: "stm-badge--high",
    },
    normal: {
      label: "Bình thường",
      icon: <Zap size={14} />,
      cls: "stm-badge--normal",
    },
  }[variant];

  const deadlineDays = getDeadlineDays();

  const handleApply = async () => {
    if (!isAuthenticated) {
      showWarning("Chưa đăng nhập", "Vui lòng đăng nhập để ứng tuyển");
      return;
    }
    setIsSubmitting(true);
    try {
      await shortTermJobService.applyToJob(job.id, {
        coverLetter: coverLetter || undefined,
        proposedPrice: proposedPrice ? parseFloat(proposedPrice) : undefined,
      });
      showSuccess(
        "Ứng tuyển thành công!",
        "Nhà tuyển dụng sẽ liên hệ với bạn sớm.",
      );
      setShowApplyForm(false);
      onApplySuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Không thể gửi đơn ứng tuyển";
      showError("Lỗi", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="stm-overlay" onClick={onClose}>
      <div
        className={`stm-modal stm-modal--${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="stm-header">
          <div className={`stm-header__icon stm-header__icon--${variant}`}>
            <Zap size={20} />
          </div>
          <div className="stm-header__title-group">
            <div className="stm-header__label">Công việc ngắn hạn · Gig</div>
            <div className="stm-header__badges">
              <span className={`stm-badge ${urgencyConfig.cls}`}>
                {urgencyConfig.icon} {urgencyConfig.label}
              </span>
              {deadlineDays !== null && deadlineDays <= 3 && (
                <span className="stm-badge stm-badge--deadline">
                  <Clock size={11} />
                  {deadlineDays <= 0 ? "Hết hạn" : `Còn ${deadlineDays}d`}
                </span>
              )}
            </div>
          </div>
          <button className="stm-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="stm-body">
          {/* Hero */}
          <div className="stm-hero">
            <h2 className="stm-hero__title">{job.title}</h2>
            <div className="stm-hero__meta">
              <span className="stm-meta-pill">
                <Building2 size={13} />
                {job.recruiterInfo?.companyName || job.recruiterCompanyName}
              </span>
              <span className="stm-meta-pill">
                <MapPin size={13} />
                {job.isRemote ? "Remote" : job.location || "N/A"}
              </span>
              {job.paymentMethod && (
                <span className="stm-meta-pill">
                  <CreditCard size={13} />
                  {job.paymentMethod === "MILESTONE"
                    ? "Theo Milestone"
                    : job.paymentMethod === "HOURLY"
                      ? "Theo giờ"
                      : "Trọn gói"}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="stm-stats">
            <div className="stm-stat">
              <div className="stm-stat__icon stm-stat__icon--green">
                <DollarSign size={16} />
              </div>
              <div>
                <div className="stm-stat__value">
                  {formatCurrency(job.budget)}
                </div>
                <div className="stm-stat__label">
                  Ngân sách{" "}
                  {job.isNegotiable && (
                    <span className="stm-negotiable">• Thương lượng</span>
                  )}
                </div>
              </div>
            </div>
            <div className="stm-stat">
              <div className="stm-stat__icon stm-stat__icon--red">
                <Calendar size={16} />
              </div>
              <div>
                <div
                  className={`stm-stat__value ${deadlineDays !== null && deadlineDays <= 3 ? "stm-stat__value--warn" : ""}`}
                >
                  {formatDate(job.deadline)}
                </div>
                <div className="stm-stat__label">Deadline nộp</div>
              </div>
            </div>
            <div className="stm-stat">
              <div className="stm-stat__icon stm-stat__icon--purple">
                <Clock size={16} />
              </div>
              <div>
                <div className="stm-stat__value">
                  {job.estimatedDuration || "N/A"}
                </div>
                <div className="stm-stat__label">Thời gian ước tính</div>
              </div>
            </div>
            {job.maxApplicants && (
              <div className="stm-stat">
                <div className="stm-stat__icon stm-stat__icon--blue">
                  <Users size={16} />
                </div>
                <div>
                  <div className="stm-stat__value">
                    {job.applicantCount || 0} / {job.maxApplicants}
                  </div>
                  <div className="stm-stat__label">Ứng viên</div>
                </div>
              </div>
            )}
            {job.minRating && (
              <div className="stm-stat">
                <div className="stm-stat__icon stm-stat__icon--amber">
                  <Star size={16} />
                </div>
                <div>
                  <div className="stm-stat__value">
                    {job.minRating}★ trở lên
                  </div>
                  <div className="stm-stat__label">Rating tối thiểu</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="stm-section">
            <h4 className="stm-section__title">
              <FileText size={15} /> Mô tả công việc
            </h4>
            <div
              className="stm-desc"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>

          {/* Skills */}
          <div className="stm-section">
            <h4 className="stm-section__title">
              <Briefcase size={15} /> Kỹ năng yêu cầu
            </h4>
            <div className="stm-skills">
              {job.requiredSkills?.length > 0 ? (
                job.requiredSkills.map((s, i) => (
                  <span key={i} className="stm-skill-chip">
                    {s}
                  </span>
                ))
              ) : (
                <span className="stm-empty-text">
                  Không có yêu cầu kỹ năng cụ thể
                </span>
              )}
            </div>
          </div>

          {/* Milestones */}
          {job.milestones && job.milestones.length > 0 && (
            <div className="stm-section">
              <h4 className="stm-section__title">
                <ShieldCheck size={15} /> Các Milestone
              </h4>
              <div className="stm-milestones">
                {job.milestones.map((m, i) => (
                  <div key={i} className="stm-milestone">
                    <div className="stm-milestone__num">{i + 1}</div>
                    <div>
                      <div className="stm-milestone__title">{m.title}</div>
                      <div className="stm-milestone__budget">
                        {formatCurrency(m.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply form */}
          {showApplyForm && (
            <div className="stm-apply-form">
              <h4 className="stm-section__title">
                <CheckCircle size={15} /> Đơn ứng tuyển
              </h4>
              <div className="stm-form-group">
                <label className="stm-form-label">
                  Thư giới thiệu (tùy chọn)
                </label>
                <textarea
                  className="stm-textarea"
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Giới thiệu bản thân và lý do bạn phù hợp với công việc này..."
                />
              </div>
              {job.isNegotiable && (
                <div className="stm-form-group">
                  <label className="stm-form-label">
                    Giá đề xuất (VND, tùy chọn)
                  </label>
                  <input
                    className="stm-input"
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder={`Mặc định: ${job.budget.toLocaleString("vi-VN")} ₫`}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="stm-footer">
          {isCanApply && !showApplyForm && (
            <button
              className={`stm-btn stm-btn--apply stm-btn--${variant}`}
              onClick={() => setShowApplyForm(true)}
            >
              <Zap size={16} /> Ứng tuyển ngay
            </button>
          )}
          {isCanApply && showApplyForm && (
            <button
              className={`stm-btn stm-btn--apply stm-btn--${variant}`}
              onClick={handleApply}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="stm-spin" /> Đang gửi...
                </>
              ) : (
                <>
                  <CheckCircle size={15} /> Gửi đơn ứng tuyển
                </>
              )}
            </button>
          )}
          {isCanApply && showApplyForm && (
            <button
              className="stm-btn stm-btn--secondary"
              onClick={() => setShowApplyForm(false)}
            >
              Hủy
            </button>
          )}
          {!isCanApply && !isAuthenticated && (
            <div className="stm-login-hint">
              Đăng nhập để ứng tuyển công việc này
            </div>
          )}
          <button
            className="stm-btn stm-btn--secondary stm-btn--close"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>

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
    </div>,
    document.body,
  );
};

export default ShortTermJobDetailModal;
