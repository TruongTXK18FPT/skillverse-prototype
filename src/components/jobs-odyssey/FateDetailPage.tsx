import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  Building2,
  Star,
  Eye,
  Share2,
  ExternalLink,
  Crown,
  Zap,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import {
  JobPostingResponse,
  JobBoostStatus,
  JobApplicationStatus,
} from "../../data/jobDTOs";
import { JobMarkdownSurface } from "../shared/JobMarkdownSurface";
import jobService from "../../services/jobService";
import jobBoostService from "../../services/jobBoostService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import Toast from "../shared/Toast";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import LoginRequiredModal from "../auth/LoginRequiredModal";
import "./odyssey-styles.css";
import "./GigDetailPage.css";

const COVER_LETTER_MAX = 1000;

const FateDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();

  const [job, setJob] = useState<JobPostingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [boostDaysLeft, setBoostDaysLeft] = useState(0);
  const [boostImpressions, setBoostImpressions] = useState(0);
  const [boostClicks, setBoostClicks] = useState(0);
  const [boostCtr, setBoostCtr] = useState("0.0");

  // Apply state
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<JobApplicationStatus | null>(null);
  const [isCheckingApplied, setIsCheckingApplied] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const userRole = user?.roles?.[0];
  const isRecruiter = userRole === "RECRUITER";
  const isOwner = job?.recruiterUserId === user?.id;

  const avgBudget = job
    ? Math.round((job.minBudget + job.maxBudget) / 2)
    : 0;
  const isHighValue = avgBudget > 5_000_000;
  const themeClass = isHighValue ? "fdp-hero--crimson" : "fdp-hero--blue";

  const fetchJob = async () => {
    if (!jobId) return;
    setIsLoading(true);
    try {
      const jobData = await jobService.getJobDetails(Number(jobId));
      setJob(jobData);
    } catch (err) {
      showError("Lỗi", "Không thể tải thông tin công việc");
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBoostStatus = async () => {
    if (!jobId) return;
    try {
      const boost = await jobBoostService.getBoostByJob(Number(jobId));
      if (boost?.status === JobBoostStatus.ACTIVE) {
        setIsBoostActive(true);
        const end = new Date(boost.endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        setBoostDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
        setBoostImpressions(boost.impressions ?? 0);
        setBoostClicks(boost.clicks ?? 0);
        const ctr =
          boost.impressions > 0
            ? ((boost.clicks / boost.impressions) * 100).toFixed(1)
            : "0.0";
        setBoostCtr(ctr);
      }
    } catch {
      // Boost may not exist
    }
  };

  const checkHasApplied = async () => {
    if (!jobId || isRecruiter || isOwner) return;
    setIsCheckingApplied(true);
    try {
      const applied = await jobService.hasAppliedToJob(Number(jobId));
      if (applied) {
        // Try to get the application to know the status
        const apps = await jobService.getMyApplications();
        const myApp = apps.find((a) => a.jobId === Number(jobId));
        if (myApp) {
          setApplicationStatus(myApp.status);
        }
      }
      setHasApplied(applied);
    } catch {
      // Ignore errors
    } finally {
      setIsCheckingApplied(false);
    }
  };

  const handleApply = async () => {
    if (!jobId) return;
    setIsSubmitting(true);
    try {
      await jobService.applyToJob(Number(jobId), { coverLetter });
      setHasApplied(true);
      setApplicationStatus(JobApplicationStatus.PENDING);
      setShowApplyForm(false);
      setCoverLetter("");
      showSuccess("Ứng tuyển thành công!", "Hồ sơ của bạn đã được gửi.");
    } catch (err: any) {
      showError(
        "Lỗi ứng tuyển",
        err?.response?.data?.message || "Không thể gửi hồ sơ ứng tuyển.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  useEffect(() => {
    if (job) {
      fetchBoostStatus();
      checkHasApplied();
    }
  }, [job]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return "Mới đăng";
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays}d trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const getCompanyInitials = () => {
    const name = job?.recruiterCompanyName || "SV";
    return name
      .split(" ")
      .map((p: string) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isExpired = job
    ? new Date(job.deadline) < new Date()
    : false;

  const getApplicationStatusLabel = (status: JobApplicationStatus) => {
    switch (status) {
      case JobApplicationStatus.PENDING:
        return "Đang chờ duyệt";
      case JobApplicationStatus.REVIEWED:
        return "Đã được xem";
      case JobApplicationStatus.ACCEPTED:
        return "Được chấp nhận";
      case JobApplicationStatus.REJECTED:
        return "Bị từ chối";
      default:
        return "Đã ứng tuyển";
    }
  };

  // Determine which apply button to show
  const showApplyBtn = !isExpired && !isRecruiter && !isOwner;
  const canApplyBtn = showApplyBtn && !hasApplied && !isCheckingApplied;
  const appliedChipColor = applicationStatus === JobApplicationStatus.ACCEPTED
    ? { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)" }
    : applicationStatus === JobApplicationStatus.REJECTED
    ? { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)" }
    : { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)" };

  if (isLoading) {
    return (
      <div className="fdp-loading">
        <MeowlKuruLoader size="medium" text="" />
        <p className="fdp-loading__text">Đang tải chi tiết công việc...</p>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="gdp-page fdp-page">
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
          {/* Boost Badge */}
          {isBoostActive && (
            <div className="gdp-hero__badge-row">
              <span className="gdp-badge gdp-badge--crimson">
                <Crown size={12} />
                Đẩy Top · {boostDaysLeft} ngày
              </span>
              <span className="gdp-badge gdp-badge--emerald">
                <Eye size={11} />
                {boostImpressions.toLocaleString()} lượt xem
              </span>
            </div>
          )}

          {/* Status Badges */}
          {!isBoostActive && (
            <div className="gdp-hero__badge-row">
              <span className="gdp-badge gdp-badge--emerald">
                <Briefcase size={11} />
                Toàn thời gian
              </span>
              {job.isRemote && (
                <span className="gdp-badge gdp-badge--status">Remote</span>
              )}
              <span className="gdp-hero__time-ago">{formatRelativeTime(job.createdAt)}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="gdp-hero__title">{job.title}</h1>

          {/* Company Info — clickable to view profile */}
          <div className="gdp-hero__company">
            <button
              className="gdp-hero__company-link"
              onClick={() =>
                navigate(`/profile/business/${job?.recruiterUserId}`)
              }
            >
              <div className="gdp-hero__company-avatar">{getCompanyInitials()}</div>
              <div className="gdp-hero__company-info">
                <span className="gdp-hero__company-name">
                  {job.recruiterCompanyName || "Công ty SkillVerse"}
                </span>
                <span className="gdp-hero__company-sub">
                  <Briefcase size={10} />
                  Công việc toàn thời gian
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
                  {formatCurrency(job.minBudget)} — {formatCurrency(job.maxBudget)}
                </div>
                <div className="gdp-hero__stat-label">
                  Lương/tháng
                </div>
              </div>
            </div>
            <div className="gdp-hero__stat">
              <Calendar size={16} />
              <div>
                <div className="gdp-hero__stat-value">
                  {formatDate(job.deadline)}
                </div>
                <div className="gdp-hero__stat-label">
                  Hạn nộp{isExpired ? " (Hết hạn)" : ""}
                </div>
              </div>
            </div>
            <div className="gdp-hero__stat">
              <Users size={16} />
              <div>
                <div className="gdp-hero__stat-value">
                  {job.applicantCount || 0}
                </div>
                <div className="gdp-hero__stat-label">Ứng viên</div>
              </div>
            </div>
            <div className="gdp-hero__stat">
              <Building2 size={16} />
              <div>
                <div className="gdp-hero__stat-value">
                  {job.isRemote ? "Remote" : job.location || "Việt Nam"}
                </div>
                <div className="gdp-hero__stat-label">Địa điểm</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="gdp-hero__actions">
            {/* Nút Ứng tuyển — chỉ hiện khi chưa ứng tuyển */}
            {canApplyBtn && (
              <button
                className="gdp-btn gdp-btn--primary gdp-btn--emerald"
                onClick={() => {
                  if (!isAuthenticated) {
                    setShowLoginModal(true);
                  } else {
                    setShowApplyForm(true);
                  }
                }}
              >
                <Briefcase size={16} />
                Ứng tuyển ngay
              </button>
            )}

            {/* Chip Đã ứng tuyển — hiện khi đã ứng tuyển */}
            {hasApplied && (
              <div
                className="gdp-applied-chip"
                style={{
                  color: appliedChipColor.color,
                  background: appliedChipColor.bg,
                  borderColor: appliedChipColor.border,
                }}
              >
                <CheckCircle size={14} />
                {getApplicationStatusLabel(applicationStatus!)}
              </div>
            )}

            {/* Loading state while checking */}
            {isCheckingApplied && (
              <div className="gdp-applied-chip" style={{ opacity: 0.6 }}>
                <Loader2 size={14} className="gdp-spin" />
                Kiểm tra...
              </div>
            )}

            {/* Hết hạn */}
            {isExpired && (
              <div
                className="gdp-applied-chip"
                style={{ color: "#f87171", background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.3)" }}
              >
                <Clock size={14} />
                Đã hết hạn ứng tuyển
              </div>
            )}

            {/* Tài khoản nhà tuyển dụng */}
            {isRecruiter && !isOwner && (
              <div className="gdp-applied-chip">
                <Building2 size={14} />
                Tài khoản nhà tuyển dụng
              </div>
            )}

            <button
              className="gdp-btn gdp-btn--icon"
              onClick={handleShare}
              title="Chia sẻ"
            >
              <Share2 size={16} />
            </button>
          </div>

          {/* Boost Stats */}
          {isBoostActive && (
            <div className="fdp-boost-stats">
              <div className="fdp-boost-stat">
                <Eye size={13} />
                <span>{boostImpressions.toLocaleString()}</span>
                <span className="fdp-boost-stat__label">Lượt xem</span>
              </div>
              <div className="fdp-boost-stat">
                <Users size={13} />
                <span>{boostClicks.toLocaleString()}</span>
                <span className="fdp-boost-stat__label">Nhấn</span>
              </div>
              <div className="fdp-boost-stat fdp-boost-stat--highlight">
                <Zap size={13} />
                <span>{boostCtr}%</span>
                <span className="fdp-boost-stat__label">CTR</span>
              </div>
            </div>
          )}
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
                  theme={isHighValue ? "crimson" : "cyan"}
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
                    <span className="gdp-sidebar__item-label">Lương</span>
                    <span className="gdp-sidebar__item-value gdp-sidebar__item-value--budget">
                      {formatCurrency(job.minBudget)} — {formatCurrency(job.maxBudget)}
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
                    <span className="gdp-sidebar__item-label">Đăng lúc</span>
                    <span className="gdp-sidebar__item-value">
                      {job.createdAt ? formatRelativeTime(job.createdAt) : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="gdp-sidebar__item">
                  <Users size={14} />
                  <div>
                    <span className="gdp-sidebar__item-label">Ứng viên</span>
                    <span className="gdp-sidebar__item-value">
                      {job.applicantCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply CTA Sidebar — chỉ hiện khi chưa ứng tuyển */}
            {canApplyBtn && (
              <div className="gdp-sidebar__card gdp-sidebar__card--cta">
                <div className="gdp-sidebar__cta-label">Sẵn sàng ứng tuyển?</div>
                <button
                  className="gdp-btn gdp-btn--primary gdp-btn--full gdp-btn--emerald"
                  onClick={() => {
                    if (!isAuthenticated) {
                        setShowLoginModal(true);
                    } else {
                      setShowApplyForm(true);
                    }
                  }}
                >
                  <Briefcase size={16} />
                  Ứng tuyển ngay
                </button>
              </div>
            )}

            {/* Đã ứng tuyển chip trong sidebar */}
            {hasApplied && (
              <div className="gdp-sidebar__card gdp-sidebar__card--applied">
                <CheckCircle size={16} />
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {getApplicationStatusLabel(applicationStatus!)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                    Bạn đã ứng tuyển công việc này
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Form Panel */}
      {showApplyForm && (
        <div className="gdp-apply-panel">
          <div className="gdp-apply-panel__inner">
            <div className="gdp-apply-panel__header">
              <h3 className="gdp-apply-panel__title">
                <Briefcase size={18} />
                Ứng tuyển: {job.title}
              </h3>
              <button
                className="gdp-apply-panel__close"
                onClick={() => setShowApplyForm(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="gdp-apply-panel__body">
              <div className="gdp-form-group">
                <div className="gdp-form-label">
                  Thư giới thiệu
                  <span className="gdp-form-label__optional">(Tùy chọn)</span>
                  <span className="gdp-odyssey-char-count">
                    {coverLetter.length}/{COVER_LETTER_MAX}
                  </span>
                </div>
                <textarea
                  className="gdp-textarea"
                  rows={5}
                  maxLength={COVER_LETTER_MAX}
                  placeholder="Giới thiệu ngắn về bản thân, kinh nghiệm và lý do phù hợp với vị trí này..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
                <span className="gdp-form-hint">
                  Viết thư giới thiệu ngắn gọn để gây ấn tượng với nhà tuyển dụng
                </span>
              </div>
            </div>
            <div className="gdp-apply-panel__footer">
              <button
                className="gdp-btn gdp-btn--outline"
                onClick={() => setShowApplyForm(false)}
              >
                Hủy
              </button>
              <button
                className="gdp-btn gdp-btn--primary gdp-btn--emerald"
                onClick={handleApply}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="gdp-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Briefcase size={16} />
                    Gửi hồ sơ
                  </>
                )}
              </button>
            </div>
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

export default FateDetailPage;
