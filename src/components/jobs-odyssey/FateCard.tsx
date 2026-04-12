import { useEffect, useState } from 'react';
import { MapPin, Clock, Users, ArrowRight, Crown, Eye, MousePointer, Zap } from 'lucide-react';
import { JobPostingResponse, JobBoostResponse, JobBoostStatus } from '../../data/jobDTOs';
import jobBoostService from '../../services/jobBoostService';
import { JobMarkdownSurface } from '../shared/JobMarkdownSurface';

interface FateCardProps {
  job: JobPostingResponse;
  onClick: () => void;
  showBoostBadge?: boolean;
}

const FateCard: React.FC<FateCardProps> = ({ job, onClick, showBoostBadge = true }) => {
  const [boost, setBoost] = useState<JobBoostResponse | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    if (showBoostBadge) {
      loadBoostStatus();
    }
  }, [job.id, showBoostBadge]);

  useEffect(() => {
    setLogoFailed(false);
  }, [job.id, job.recruiterCompanyLogoUrl]);

  const loadBoostStatus = async () => {
    try {
      const boostData = await jobBoostService.getBoostByJob(job.id);
      setBoost(boostData);
    } catch (error) {
      console.error('Error loading boost status:', error);
    }
  };

  // Determine rarity
  const isPremium = boost?.status === JobBoostStatus.ACTIVE;
  const avgSalary = (job.minBudget + job.maxBudget) / 2;
  const isHighSalary = !isPremium && avgSalary > 5000000;

  // Format salary range for display
  const formatSalaryRange = () => {
    // Negotiable jobs: show "Thỏa thuận" instead of 0
    if (job.isNegotiable) return "Thỏa thuận";
    const fmt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
    if (job.minBudget === job.maxBudget) {
      return fmt.format(job.minBudget);
    }
    return `${fmt.format(job.minBudget)} - ${fmt.format(job.maxBudget)}`;
  };

  // Format relative time
  const formatRelativeTime = () => {
    const date = new Date(job.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return 'Mới đăng';
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays}d trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Get company initials
  const getCompanyInitials = () => {
    return job.recruiterCompanyName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Boost remaining days
  const getBoostDaysLeft = () => {
    if (!boost?.endDate) return 0;
    const end = new Date(boost.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const boostDaysLeft = getBoostDaysLeft();
  const companyLogoUrl = !logoFailed ? job.recruiterCompanyLogoUrl : undefined;

  // Boost stats
  const impressions = boost?.impressions ?? 0;
  const clicks = boost?.clicks ?? 0;
  const applications = boost?.applications ?? 0;
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';

  return (
    <div
      className={`fate-card fate-card--${isPremium ? 'premium' : isHighSalary ? 'crimson' : 'blue'}`}
      onClick={onClick}
    >
      {/* Top badge */}
      <div className="fate-card__top">
        {isPremium ? (
          <div className="fate-card__boost-badge">
            <Crown size={12} />
            <span>Đẩy Top</span>
            <span className="fate-card__boost-days">
              <Clock size={10} />
              {boostDaysLeft} ngày
            </span>
          </div>
        ) : isHighSalary ? (
          <div className="fate-card__salary-badge">Lương cao</div>
        ) : job.isRemote ? (
          <div className="fate-card__remote-badge">Remote</div>
        ) : (
          <div className="fate-card__time-badge">{formatRelativeTime()}</div>
        )}
      </div>

      {/* Company section */}
      <div className="fate-card__company">
        <div className={`fate-card__company-avatar ${isPremium ? 'fate-card__company-avatar--premium' : ''}`}>
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

      {/* Title */}
      <h3 className="fate-card__title">{job.title}</h3>

      {/* Salary — most prominent */}
      <div className={`fate-card__salary ${isPremium ? 'fate-card__salary--premium' : ''}`}>
        <span className="fate-card__salary-value">{formatSalaryRange()}</span>
        <span className="fate-card__salary-unit">/tháng</span>
      </div>

      {/* Skills */}
      {job.requiredSkills.length > 0 && (
        <div className="fate-card__skills">
          {job.requiredSkills.slice(0, 3).map((skill, i) => (
            <span key={i} className={`fate-card__skill ${isPremium ? 'fate-card__skill--premium' : ''}`}>
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
            theme={isPremium ? "gold" : isHighSalary ? "crimson" : "cyan"}
            maxHeight={170}
          />
        </div>
      )}

      {/* Premium stats */}
      {isPremium && (
        <div className="fate-card__boost-stats">
          <div className="fate-card__boost-stat">
            <Eye size={11} />
            <span>{impressions.toLocaleString()}</span>
          </div>
          <div className="fate-card__boost-stat">
            <MousePointer size={11} />
            <span>{clicks.toLocaleString()}</span>
          </div>
          <div className="fate-card__boost-stat">
            <Users size={11} />
            <span>{applications}</span>
          </div>
          <div className="fate-card__boost-stat fate-card__boost-stat--highlight">
            <Zap size={11} />
            <span>{ctr}%</span>
          </div>
        </div>
      )}

      {/* Footer meta */}
      <div className="fate-card__meta">
        <div className="fate-card__meta-item">
          <MapPin size={13} />
          <span>{job.isRemote ? 'Remote' : job.location || 'Việt Nam'}</span>
        </div>
        <div className="fate-card__meta-item">
          <Users size={13} />
          <span>{job.applicantCount || 0} ứng tuyển</span>
        </div>
      </div>

      {/* CTA */}
      <div className={`fate-card__cta ${isPremium ? 'fate-card__cta--premium' : ''}`}>
        <span>Xem chi tiết</span>
        <ArrowRight size={16} />
      </div>

      {/* Premium glow overlay */}
      {isPremium && <div className="fate-card__glow" aria-hidden="true" />}
    </div>
  );
};

export default FateCard;
