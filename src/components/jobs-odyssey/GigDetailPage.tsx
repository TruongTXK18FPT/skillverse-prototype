import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Flame,
  TrendingUp,
  Zap,
  CreditCard,
  Briefcase,
  Star,
  ShieldCheck,
  CheckCircle,
  Loader2,
  Timer,
  Ban,
  Share2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { ShortTermJobResponse, ShortTermJobStatus } from "../../types/ShortTermJob";
import { JobMarkdownSurface } from "../shared/JobMarkdownSurface";
import shortTermJobService from "../../services/shortTermJobService";
import jobService from "../../services/jobService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import Toast from "../shared/Toast";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import LoginRequiredModal from "../auth/LoginRequiredModal";
import "./odyssey-styles.css";
import "./GigDetailPage.css";

const GigDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning } =
    useToast();

  const [job, setJob] = useState<ShortTermJobResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const COOLDOWN_MS_TOTAL = 3_600_000;
  const JLAB_COOLDOWN_KEY = "jlab_cancel_cooldowns";

  const userRole = user?.roles?.[0];
  const isRecruiter = userRole === "RECRUITER";
  // hasApplied: use API response first, then check from getMyApplications
  const hasApplied = job?.hasApplied === true;

  const getVariant = (): "urgent" | "high" | "normal" => {
    if (!job) return "normal";
    if (job.urgency === "VERY_URGENT" || job.urgency === "ASAP")
      return "urgent";
    if (job.urgency === "URGENT") return "high";
    return "normal";
  };
  const variant = getVariant();
  const themeClass =
    variant === "urgent"
      ? "gdp-hero--crimson"
      : variant === "high"
        ? "gdp-hero--amber"
        : "gdp-hero--emerald";

  const markdownTheme =
    variant === "urgent"
      ? "crimson"
      : variant === "high"
        ? "amber"
        : "emerald";

  // Cooldown tracking
  useEffect(() => {
    if (!showApplyForm || !jobId) return;
    try {
      const stored: Record<string, string> = JSON.parse(
        localStorage.getItem(JLAB_COOLDOWN_KEY) || "{}",
      );
      const ts = stored[jobId];
      if (ts) {
        const remaining =
          COOLDOWN_MS_TOTAL - (Date.now() - new Date(ts).getTime());
        setCooldownMs(remaining > 0 ? remaining : 0);
      }
    } catch {
      setCooldownMs(0);
    }
  }, [showApplyForm, jobId]);

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const t = setTimeout(
      () => setCooldownMs((prev) => Math.max(0, prev - 1000)),
      1000,
    );
    return () => clearTimeout(t);
  }, [cooldownMs]);

  const formatCooldownTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const fetchJob = async () => {
    if (!jobId) return;
    setIsLoading(true);
    try {
      const jobData = await shortTermJobService.getJobDetails(Number(jobId));
      setJob(jobData);
    } catch (err) {
      showError("Lỗi", "Không thể tải thông tin công việc");
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const checkHasApplied = async () => {
    if (!jobId || isRecruiter) return;
    try {
      // Check both APIs for short-term job applications
      const applied = await jobService.hasAppliedToJob(Number(jobId));
      if (applied) {
        setJob((prev) => prev ? { ...prev, hasApplied: true } : prev);
        return;
      }
      const apps = await shortTermJobService.getMyApplications();
      const found = apps.find((a) => a.jobId === Number(jobId));
      if (found) {
        setJob((prev) => prev ? { ...prev, hasApplied: true } : prev);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  useEffect(() => {
    if (job) checkHasApplied();
  }, [job]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = async () => {
    if (!isAuthenticated) {
      showWarning("Chưa đăng nhập", "Vui lòng đăng nhập để ứng tuyển");
      return;
    }
    setIsApplying(true);
    try {
      await shortTermJobService.applyToJob(Number(jobId), {
        coverLetter: coverLetter || undefined,
        proposedPrice: proposedPrice
          ? parseFloat(proposedPrice)
          : undefined,
      });
      showSuccess(
        "Ứng tuyển thành công!",
        "Nhà tuyển dụng sẽ liên hệ với bạn sớm.",
      );
      setShowApplyForm(false);
      setJob((prev) => (prev ? { ...prev, hasApplied: true } : prev));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể gửi đơn ứng tuyển";
      if (msg.toLowerCase().includes("portfolio")) {
        showError(
          "Cần tạo Portfolio",
          "Bạn cần tạo portfolio trước khi ứng tuyển!",
        );
      } else {
        showError("Lỗi", msg);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showSuccess("Đã sao chép", "Link công việc đã được sao chép!");
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
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
    if (!job?.deadline) return null;
    return Math.ceil(
      (new Date(job.deadline).getTime() - Date.now()) / 86400000,
    );
  };

  const getCompanyInitials = () => {
    const name =
      job?.recruiterInfo?.companyName ||
      job?.recruiterCompanyName ||
      "SV";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPaymentLabel = () => {
    if (!job) return "";
    if (job.paymentMethod === "HOURLY") return "Theo giờ";
    if (job.paymentMethod === "MILESTONE") return "Theo milestone";
    return "Trọn gói";
  };

  const isExpired = job ? new Date(job.deadline) < new Date() : false;
  const canApply =
    job &&
    job.status === ShortTermJobStatus.PUBLISHED &&
    !isExpired &&
    !isRecruiter &&
    !hasApplied;

  const urgencyLabel =
    variant === "urgent"
      ? "Rất gấp"
      : variant === "high"
        ? "Ưu tiên cao"
        : "Ngắn hạn";

  if (isLoading) {
    return (
      <div className="gdp-loading">
        <MeowlKuruLoader size="medium" text="" />
        <p className="gdp-loading__text">Đang tải chi tiết công việc...</p>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="gdp-page">
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để ứng tuyển"
        message="Bạn cần đăng nhập để nộp hồ sơ ứng tuyển công việc"
        feature="Ứng tuyển công việc"
      />

      {/* Back Navigation */}
      <div className="gdp-back">
        <button className="gdp-back__btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Quay lại danh sách</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className={`gdp-hero ${themeClass}`}>
        <div className="gdp-hero__inner">
          {/* Urgency Badge */}
          <div className="gdp-hero__badge-row">
            <span className={`gdp-badge gdp-badge--${variant}`}>
              {variant === "urgent" ? (
                <Flame size={12} />
              ) : variant === "high" ? (
                <TrendingUp size={12} />
              ) : (
                <Zap size={12} />
              )}
              {urgencyLabel}
            </span>
            {job.status && (
              <span className="gdp-badge gdp-badge--status">{job.status}</span>
            )}
            {getDeadlineDays() !== null && getDeadlineDays()! <= 3 && (
              <span className="gdp-badge gdp-badge--deadline">
                <Clock size={11} />
                {getDeadlineDays()! <= 0
                  ? "Đã hết hạn"
                  : `Còn ${getDeadlineDays()} ngày`}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="gdp-hero__title">{job.title}</h1>

          {/* Company Info — clickable to view profile */}
          <div className="gdp-hero__company">
            <button
              className="gdp-hero__company-link"
              onClick={() =>
                navigate(
                  `/profile/business/${
                    job?.recruiterInfo?.id || job?.recruiterId
                  }`,
                )
              }
            >
              <div className="gdp-hero__company-avatar">{getCompanyInitials()}</div>
              <div className="gdp-hero__company-info">
                <span className="gdp-hero__company-name">
                  {job.recruiterInfo?.companyName ||
                    job.recruiterCompanyName ||
                    "Công ty SkillVerse"}
                </span>
                <span className="gdp-hero__company-sub">
                  <Zap size={10} />
                  Gig ngắn hạn · {job.paymentMethod && getPaymentLabel()}
                  <ExternalLink size={10} style={{ marginLeft: 4, opacity: 0.6 }} />
                </span>
              </div>
            </button>
          </div>

          {/* Stats Row */}
          <div className="gdp-hero__stats">
            <div className="gdp-hero__stat">
              <DollarSign size={16} />
              <div>
                <div className="gdp-hero__stat-value">
                  {formatCurrency(job.budget)}
                </div>
                <div className="gdp-hero__stat-label">
                  Ngân sách
                  {job.isNegotiable && (
                    <span className="gdp-hero__negotiable"> · Thương lượng</span>
                  )}
                </div>
              </div>
            </div>
            <div className="gdp-hero__stat">
              <Calendar size={16} />
              <div>
                <div className="gdp-hero__stat-value">{formatDate(job.deadline)}</div>
                <div className="gdp-hero__stat-label">Hạn nộp</div>
              </div>
            </div>
            <div className="gdp-hero__stat">
              <Clock size={16} />
              <div>
                <div className="gdp-hero__stat-value">
                  {job.estimatedDuration || "Thỏa thuận"}
                </div>
                <div className="gdp-hero__stat-label">Thời gian ước tính</div>
              </div>
            </div>
            {job.maxApplicants ? (
              <div className="gdp-hero__stat">
                <Users size={16} />
                <div>
                  <div className="gdp-hero__stat-value">
                    {job.applicantCount || 0} / {job.maxApplicants}
                  </div>
                  <div className="gdp-hero__stat-label">Ứng viên</div>
                </div>
              </div>
            ) : (
              <div className="gdp-hero__stat">
                <Users size={16} />
                <div>
                  <div className="gdp-hero__stat-value">
                    {job.applicantCount || 0}
                  </div>
                  <div className="gdp-hero__stat-label">Ứng viên</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="gdp-hero__actions">
            {canApply && !showApplyForm && (
              <button
                className={`gdp-btn gdp-btn--primary gdp-btn--${variant}`}
                onClick={() => setShowApplyForm(true)}
              >
                <Zap size={16} />
                Ứng tuyển ngay
              </button>
            )}
            {hasApplied && (
              <div className="gdp-applied-chip">
                <CheckCircle size={16} />
                Đã ứng tuyển
              </div>
            )}
            {!isAuthenticated && !isRecruiter && (
              <button
                className="gdp-btn gdp-btn--outline"
                onClick={() => setShowLoginModal(true)}
              >
                Đăng nhập để ứng tuyển
              </button>
            )}
            <button
              className="gdp-btn gdp-btn--icon"
              onClick={handleShare}
              title="Chia sẻ"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="gdp-content">
        <div className="gdp-content__inner">
          {/* Main Column */}
          <div className="gdp-main">
            {/* Description */}
            <section className="gdp-section">
              <h2 className="gdp-section__title">
                <Briefcase size={16} />
                Mô tả công việc
              </h2>
              <div className="gdp-section__body">
                <JobMarkdownSurface
                  content={job.description || ""}
                  density="detail"
                  theme={markdownTheme}
                  className="gdp-markdown"
                />
              </div>
            </section>

            {/* Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <section className="gdp-section">
                <h2 className="gdp-section__title">
                  <Star size={16} />
                  Kỹ năng yêu cầu
                </h2>
                <div className="gdp-section__body">
                  <div className="gdp-skills">
                    {job.requiredSkills.map((skill, i) => (
                      <span key={i} className="gdp-skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Milestones */}
            {job.milestones && job.milestones.length > 0 && (
              <section className="gdp-section">
                <h2 className="gdp-section__title">
                  <ShieldCheck size={16} />
                  Cột mốc thanh toán
                </h2>
                <div className="gdp-section__body">
                  <div className="gdp-milestones">
                    {job.milestones.map((m, i) => (
                      <div key={i} className="gdp-milestone">
                        <div className="gdp-milestone__num">{i + 1}</div>
                        <div className="gdp-milestone__content">
                          <div className="gdp-milestone__header">
                            <span className="gdp-milestone__title">{m.title}</span>
                            <span className="gdp-milestone__amount">
                              {formatCurrency(m.amount)}
                            </span>
                          </div>
                          {m.description && (
                            <p className="gdp-milestone__desc">{m.description}</p>
                          )}
                          {m.deadline && (
                            <div className="gdp-milestone__deadline">
                              <Clock size={11} />
                              {formatDate(m.deadline)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

          </div>

          {/* Sidebar */}
          <div className="gdp-sidebar">
            {/* Quick Info */}
            <div className="gdp-sidebar__card">
              <h3 className="gdp-sidebar__title">Thông tin nhanh</h3>
              <div className="gdp-sidebar__list">
                <div className="gdp-sidebar__item">
                  <MapPin size={14} />
                  <div>
                    <span className="gdp-sidebar__item-label">Địa điểm</span>
                    <span className="gdp-sidebar__item-value">
                      {job.isRemote ? "Remote" : job.location || "Việt Nam"}
                    </span>
                  </div>
                </div>
                <div className="gdp-sidebar__item">
                  <DollarSign size={14} />
                  <div>
                    <span className="gdp-sidebar__item-label">Hình thức</span>
                    <span className="gdp-sidebar__item-value">
                      {getPaymentLabel()}
                    </span>
                  </div>
                </div>
                <div className="gdp-sidebar__item">
                  <Calendar size={14} />
                  <div>
                    <span className="gdp-sidebar__item-label">Hạn nộp</span>
                    <span
                      className={`gdp-sidebar__item-value ${isExpired ? "gdp-sidebar__item-value--expired" : ""}`}
                    >
                      {formatDate(job.deadline)}
                    </span>
                  </div>
                </div>
                <div className="gdp-sidebar__item">
                  <Clock size={14} />
                  <div>
                    <span className="gdp-sidebar__item-label">Thời gian</span>
                    <span className="gdp-sidebar__item-value">
                      {job.estimatedDuration || "Thỏa thuận"}
                    </span>
                  </div>
                </div>
                <div className="gdp-sidebar__item">
                  <CreditCard size={14} />
                  <div>
                    <span className="gdp-sidebar__item-label">Ngân sách</span>
                    <span className="gdp-sidebar__item-value gdp-sidebar__item-value--budget">
                      {formatCurrency(job.budget)}
                    </span>
                  </div>
                </div>
                {job.minRating && (
                  <div className="gdp-sidebar__item">
                    <Star size={14} />
                    <div>
                      <span className="gdp-sidebar__item-label">Rating tối thiểu</span>
                      <span className="gdp-sidebar__item-value">
                        {job.minRating}★ trở lên
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Apply CTA */}
            {canApply && !showApplyForm && (
              <div className="gdp-sidebar__card gdp-sidebar__card--cta">
                <div className="gdp-sidebar__cta-label">Sẵn sàng ứng tuyển?</div>
                <button
                  className={`gdp-btn gdp-btn--primary gdp-btn--full gdp-btn--${variant}`}
                  onClick={() => setShowApplyForm(true)}
                >
                  <Zap size={16} />
                  Ứng tuyển ngay
                </button>
              </div>
            )}

            {/* Already Applied */}
            {hasApplied && (
              <div className="gdp-sidebar__card gdp-sidebar__card--applied">
                <CheckCircle size={20} />
                <span>Đã ứng tuyển công việc này</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Form Panel */}
      {showApplyForm && (
        <div className="gdp-apply-panel">
          <div className="gdp-apply-panel__inner">
            {cooldownMs > 0 ? (
              /* Cooldown Widget */
              <div className="gdp-cooldown">
                <div className="gdp-cooldown__ring-wrap">
                  <svg
                    className="gdp-cooldown__ring-svg"
                    viewBox="0 0 80 80"
                    width="80"
                    height="80"
                  >
                    <circle className="gdp-cooldown__ring-bg" cx="40" cy="40" r="34" />
                    <circle
                      className="gdp-cooldown__ring-progress"
                      cx="40"
                      cy="40"
                      r="34"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - cooldownMs / COOLDOWN_MS_TOTAL)}`}
                    />
                  </svg>
                  <div className="gdp-cooldown__ring-inner">
                    <Timer size={20} />
                    <span className="gdp-cooldown__time">
                      {formatCooldownTime(cooldownMs)}
                    </span>
                  </div>
                </div>
                <div className="gdp-cooldown__copy">
                  <div className="gdp-cooldown__headline">
                    <Ban size={15} />
                    Đang có thời gian chờ
                  </div>
                  <p className="gdp-cooldown__desc">
                    Bạn đã hủy đơn ứng tuyển vị trí này gần đây. Vui lòng chờ
                    hết thời gian để ứng tuyển lại.
                  </p>
                </div>
              </div>
            ) : (
              /* Apply Form */
              <>
                <div className="gdp-apply-panel__header">
                  <h3 className="gdp-apply-panel__title">
                    <CheckCircle size={18} />
                    Đơn ứng tuyển
                  </h3>
                  <button
                    className="gdp-apply-panel__close"
                    onClick={() => setShowApplyForm(false)}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="gdp-apply-panel__body">
                  <div className="gdp-form-group">
                    <div className="gdp-form-label">
                      Thư giới thiệu
                      <span className="gdp-form-label__optional">(tùy chọn)</span>
                    </div>
                    <textarea
                      className="gdp-textarea"
                      rows={6}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Giới thiệu bản thân và lý do bạn phù hợp với công việc này..."
                    />
                    <span className="gdp-form-hint">
                      Viết ngắn gọn, đi thẳng vào thế mạnh của bạn
                    </span>
                  </div>
                  {job.isNegotiable && (
                    <div className="gdp-form-group">
                      <div className="gdp-form-label">
                        Giá đề xuất
                        <span className="gdp-form-label__optional">(VND, tùy chọn)</span>
                      </div>
                      <input
                        className="gdp-input"
                        type="number"
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                        placeholder={`Mặc định: ${job.budget.toLocaleString("vi-VN")} ₫`}
                      />
                    </div>
                  )}
                </div>
                <div className="gdp-apply-panel__footer">
                  <button
                    className="gdp-btn gdp-btn--outline"
                    onClick={() => setShowApplyForm(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className={`gdp-btn gdp-btn--primary gdp-btn--${variant}`}
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 size={15} className="gdp-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={15} />
                        Gửi đơn ứng tuyển
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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

export default GigDetailPage;
