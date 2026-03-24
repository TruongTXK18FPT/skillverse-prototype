import type { KeyboardEvent } from "react";
import {
  ArrowRight,
  Clock,
  Flame,
  MapPin,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { ShortTermJobResponse } from "../../types/ShortTermJob";
import { JobMarkdownSurface } from "../shared/JobMarkdownSurface";

interface GigCardProps {
  job: ShortTermJobResponse;
  onClick: () => void;
}

const getDescriptionPlainText = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return value
    .replace(/\r\n?/g, "\n")
    .replace(/<img\b[^>]*>/gi, " [image] ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " [image] ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const GigCard = ({ job, onClick }: GigCardProps) => {
  const getRarity = (): "emerald" | "amber" | "crimson" => {
    if (job.urgency === "VERY_URGENT" || job.urgency === "ASAP") {
      return "crimson";
    }
    if (job.urgency === "URGENT") {
      return "amber";
    }
    return "emerald";
  };

  const rarity = getRarity();
  const descriptionText = getDescriptionPlainText(job.description);
  const showDescriptionHint =
    Boolean(job.description?.trim()) &&
    (descriptionText.length > 210 ||
      /!\[[^\]]*]\([^)]+\)|<img\b|```|^\s*[-*]\s|^\s*\d+\.\s/m.test(
        job.description ?? "",
      ));

  const formatBudget = (amount: number) => {
    const formatter = new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
      notation: amount >= 1_000_000 ? "compact" : "standard",
      compactDisplay: "short",
    });
    return formatter.format(amount);
  };

  const getPostedTime = () => {
    if (!job.createdAt) {
      return "Đang tuyển";
    }

    const createdAt = new Date(job.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return "Mới đăng";
    }
    if (diffHours < 24) {
      return `${diffHours}h trước`;
    }
    if (diffDays < 7) {
      return `${diffDays}d trước`;
    }

    return createdAt.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getDeadlineInfo = () => {
    if (!job.deadline) {
      return { text: "Không rõ deadline", urgent: false };
    }

    const now = new Date();
    const deadline = new Date(job.deadline);
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: "Đã hết hạn", urgent: true };
    }
    if (diffDays === 0) {
      return { text: "Hôm nay", urgent: true };
    }
    if (diffDays === 1) {
      return { text: "Còn 1 ngày", urgent: true };
    }
    if (diffDays <= 7) {
      return { text: `Còn ${diffDays} ngày`, urgent: diffDays <= 3 };
    }

    return {
      text: deadline.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      urgent: false,
    };
  };

  const getCompanyInitials = () => {
    const name =
      job.recruiterInfo?.companyName || job.recruiterCompanyName || "SV";

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const budgetUnit =
    job.paymentMethod === "HOURLY"
      ? "/giờ"
      : job.paymentMethod === "MILESTONE"
        ? "/milestone"
        : "/công việc";

  const urgencyConfig = {
    crimson: { label: "Rất gấp", icon: <Flame size={12} /> },
    amber: { label: "Ưu tiên", icon: <TrendingUp size={12} /> },
    emerald: { label: "Ngắn hạn", icon: <Zap size={12} /> },
  }[rarity];

  const variantClass =
    rarity === "crimson" ? "fate-card--crimson" : "fate-card--blue";
  const deadline = getDeadlineInfo();
  const postedTime = getPostedTime();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`fate-card ${variantClass} fate-card--gig fate-card--gig-${rarity}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="fate-card__top fate-card__top--gig">
        <div className={`fate-card__gig-badge fate-card__gig-badge--${rarity}`}>
          {urgencyConfig.icon}
          <span>{urgencyConfig.label}</span>
        </div>
        <div className="fate-card__gig-meta-badge">
          {job.isRemote ? "Remote" : postedTime}
        </div>
      </div>

      <div className="fate-card__company">
        <div className="fate-card__company-avatar fate-card__company-avatar--gig">
          {getCompanyInitials()}
        </div>
        <div className="fate-card__company-stack">
          <div className="fate-card__company-name">
            {job.recruiterInfo?.companyName ||
              job.recruiterCompanyName ||
              "Công ty SkillVerse"}
          </div>
          <div className="fate-card__company-subtitle">
            <Zap size={11} />
            <span>Gig ngắn hạn</span>
          </div>
        </div>
      </div>

      <h3 className="fate-card__title">{job.title}</h3>

      <div className="fate-card__salary fate-card__salary--gig">
        <span className="fate-card__salary-value">{formatBudget(job.budget)}</span>
        <span className="fate-card__salary-unit">VND {budgetUnit}</span>
        {job.isNegotiable && (
          <span className="fate-card__gig-negotiable">Thương lượng</span>
        )}
      </div>

      {job.requiredSkills?.length > 0 && (
        <div className="fate-card__skills">
          {job.requiredSkills.slice(0, 3).map((skill, index) => (
            <span key={index} className="fate-card__skill">
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 3 && (
            <span className="fate-card__skill fate-card__skill--more">
              +{job.requiredSkills.length - 3}
            </span>
          )}
        </div>
      )}

      {job.description?.trim() && (
        <div className="fate-card__description fate-card__description--gig">
          <JobMarkdownSurface
            content={job.description}
            className="fate-card__gig-markdown"
            density="card"
            theme={rarity}
            maxHeight={160}
          />
          {showDescriptionHint && (
            <div className="fate-card__detail-hint">
              <span className="fate-card__detail-hint-title">Mô tả dài</span>
              <span className="fate-card__detail-hint-text">
                Nhấn để xem chi tiết đầy đủ
              </span>
            </div>
          )}
        </div>
      )}

      <div className="fate-card__meta fate-card__meta--gig">
        <div className="fate-card__meta-item">
          <MapPin size={13} />
          <span>{job.isRemote ? "Remote" : job.location || "Việt Nam"}</span>
        </div>
        <div className="fate-card__meta-item">
          <Clock size={13} />
          <span>{job.estimatedDuration || "Thỏa thuận thời gian"}</span>
        </div>
        <div
          className={`fate-card__meta-item${deadline.urgent ? " fate-card__meta-item--warn" : ""}`}
        >
          <Clock size={13} />
          <span>{deadline.text}</span>
        </div>
        {job.maxApplicants ? (
          <div className="fate-card__meta-item">
            <Users size={13} />
            <span>
              {job.applicantCount || 0}/{job.maxApplicants} ứng viên
            </span>
          </div>
        ) : (
          <div className="fate-card__meta-item">
            <Users size={13} />
            <span>{job.applicantCount || 0} ứng viên</span>
          </div>
        )}
      </div>

      <div className="fate-card__cta fate-card__cta--gig">
        <span className="fate-card__cta-copy">
          <strong>Xem chi tiết</strong>
          <span>Mở brief công việc</span>
        </span>
        <ArrowRight size={16} />
      </div>
    </div>
  );
};

export default GigCard;
