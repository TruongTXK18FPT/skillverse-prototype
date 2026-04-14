import { useEffect, useState, type KeyboardEvent } from "react";
import { ArrowRight, MapPin, Users } from "lucide-react";
import {
  JobBoostResponse,
  JobBoostStatus,
  JobPostingResponse,
} from "../../data/jobDTOs";
import jobBoostService from "../../services/jobBoostService";
import { JobMarkdownSurface } from "../shared/JobMarkdownSurface";

interface LongTermJobCardProps {
  job: JobPostingResponse;
  onClick: () => void;
  showBoostBadge?: boolean;
  jobTypeLabel?: string;
}

type SalaryTier = "base" | "mid" | "high" | "negotiable";

const LongTermJobCard: React.FC<LongTermJobCardProps> = ({
  job,
  onClick,
  showBoostBadge = true,
  jobTypeLabel,
}) => {
  const [boost, setBoost] = useState<JobBoostResponse | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    if (!showBoostBadge) {
      setBoost(null);
      return;
    }

    const loadBoostStatus = async () => {
      try {
        const boostData = await jobBoostService.getBoostByJob(job.id);
        setBoost(boostData);
      } catch {
        setBoost(null);
      }
    };

    loadBoostStatus();
  }, [job.id, showBoostBadge]);

  useEffect(() => {
    setLogoFailed(false);
  }, [job.id, job.recruiterCompanyLogoUrl]);

  const isBoosted = boost?.status === JobBoostStatus.ACTIVE;
  const averageSalary = (job.minBudget + job.maxBudget) / 2;

  const salaryTier: SalaryTier = job.isNegotiable
    ? "negotiable"
    : averageSalary >= 30_000_000
      ? "high"
      : averageSalary >= 15_000_000
        ? "mid"
        : "base";

  const salaryTierLabel = isBoosted
    ? "Tin ưu tiên"
    : salaryTier === "high"
      ? "Mức lương cao"
      : salaryTier === "mid"
        ? "Mức lương khá"
        : salaryTier === "negotiable"
          ? "Lương thương lượng"
          : "Mức lương cơ bản";

  const formatSalaryRange = () => {
    if (job.isNegotiable) return "Thỏa thuận";

    const formatter = new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    });

    if (job.minBudget === job.maxBudget) {
      return formatter.format(job.minBudget);
    }

    return `${formatter.format(job.minBudget)} - ${formatter.format(job.maxBudget)}`;
  };

  const formatRelativeTime = () => {
    const date = new Date(job.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Mới đăng";
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays}d trước`;

    return date.toLocaleDateString("vi-VN");
  };

  const getCompanyInitials = () =>
    job.recruiterCompanyName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const companyLogoUrl = !logoFailed ? job.recruiterCompanyLogoUrl : undefined;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`fate-card ${isBoosted ? "fate-card--premium" : "fate-card--blue"}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="fate-card__top fate-card__top--space-between">
        <div
          className={`fate-card__salary-tier fate-card__salary-tier--${isBoosted ? "premium" : salaryTier}`}
        >
          {salaryTierLabel}
        </div>

        <div className="fate-card__top-right">
          {jobTypeLabel && (
            <span className="fate-card__category-badge">{jobTypeLabel}</span>
          )}
          {job.isRemote ? (
            <div className="fate-card__remote-badge">Từ xa</div>
          ) : (
            <div className="fate-card__time-badge">{formatRelativeTime()}</div>
          )}
        </div>
      </div>

      <div className="fate-card__company">
        <div
          className={`fate-card__company-avatar ${isBoosted ? "fate-card__company-avatar--premium" : ""}`}
        >
          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt={job.recruiterCompanyName}
              className="fate-card__company-avatar-image"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            getCompanyInitials()
          )}
        </div>
        <div className="fate-card__company-name">{job.recruiterCompanyName}</div>
      </div>

      <h3 className="fate-card__title">{job.title}</h3>

      <div className={`fate-card__salary ${isBoosted ? "fate-card__salary--premium" : ""}`}>
        <span className="fate-card__salary-value">{formatSalaryRange()}</span>
        {!job.isNegotiable && <span className="fate-card__salary-unit">/tháng</span>}
      </div>

      {job.requiredSkills.length > 0 && (
        <div className="fate-card__skills">
          {job.requiredSkills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className={`fate-card__skill ${isBoosted ? "fate-card__skill--premium" : ""}`}
            >
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
        <div className="fate-card__description">
          <JobMarkdownSurface
            content={job.description}
            density="card"
            theme={isBoosted ? "gold" : salaryTier === "high" ? "amber" : "cyan"}
            maxHeight={170}
          />
        </div>
      )}

      <div className="fate-card__meta">
        <div className="fate-card__meta-item">
          <MapPin size={13} />
          <span>{job.isRemote ? "Từ xa" : job.location || "Việt Nam"}</span>
        </div>
        <div className="fate-card__meta-item">
          <Users size={13} />
          <span>{job.applicantCount || 0} ứng viên</span>
        </div>
      </div>

      <div className="fate-card__cta fate-card__cta--gig">
        <span className="fate-card__cta-copy">
          <strong>Xem chi tiết</strong>
          <span>Mở mô tả chi tiết</span>
        </span>
        <ArrowRight size={16} />
      </div>
    </div>
  );
};

export default LongTermJobCard;