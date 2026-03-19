import { useEffect, useState } from 'react';
import { MapPin, Clock, Users, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { JobPostingResponse, JobBoostResponse, JobBoostStatus } from '../../data/jobDTOs';
import jobBoostService from '../../services/jobBoostService';

interface FateCardProps {
  job: JobPostingResponse;
  onClick: () => void;
  showBoostBadge?: boolean;
}

const FateCard: React.FC<FateCardProps> = ({ job, onClick, showBoostBadge = true }) => {
  const [boost, setBoost] = useState<JobBoostResponse | null>(null);

  useEffect(() => {
    if (showBoostBadge) {
      loadBoostStatus();
    }
  }, [job.id, showBoostBadge]);

  const loadBoostStatus = async () => {
    try {
      const boostData = await jobBoostService.getBoostByJob(job.id);
      setBoost(boostData);
    } catch (error) {
      console.error('Error loading boost status:', error);
    }
  };

  // Determine card rarity based on salary
  const getRarity = (): 'gold' | 'crimson' | 'blue' | 'premium' => {
    // Check if boosted first
    if (boost && boost.status === JobBoostStatus.ACTIVE) {
      return 'premium';
    }

    const avgSalary = (job.minBudget + job.maxBudget) / 2;

    if (avgSalary > 5000000) return 'crimson'; // Above 5M VND - Red
    if (avgSalary >= 1000000) return 'gold';   // 1M-5M VND - Gold
    return 'blue';                            // Below 1M VND - Blue
  };

  const rarity = getRarity();

  // Format budget
  const formatBudget = () => {
    const formatter = new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    });

    if (job.minBudget === job.maxBudget) {
      return formatter.format(job.minBudget);
    }
    return `${formatter.format(job.minBudget)} - ${formatter.format(job.maxBudget)}`;
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

  // Get company initials for faction ring
  const getCompanyInitials = () => {
    return job.recruiterCompanyName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if high salary (red card)
  const isHighSalary = rarity === 'crimson';
  const isPremium = rarity === 'premium';

  // Get days remaining for boosted job
  const getDaysRemaining = () => {
    if (!boost) return 0;
    const endDate = new Date(boost.endDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="odyssey-card-wrapper" onClick={onClick}>
      <div className={`odyssey-card odyssey-card--${rarity}`}>
        {/* Badge for boosted job */}
        {isPremium && (
          <div className="odyssey-card__badge odyssey-card__badge--premium">
            <Sparkles size={12} />
            Được đẩy top
          </div>
        )}
        {/* Badge for high salary or remote */}
        {!isPremium && isHighSalary && (
          <div className="odyssey-card__badge odyssey-card__badge--urgent">
            Lương cao
          </div>
        )}
        {!isPremium && job.isRemote && !isHighSalary && (
          <div className="odyssey-card__badge odyssey-card__badge--remote">
            Làm việc từ xa
          </div>
        )}

        {/* Corner Hologram Indicators */}
        <div className={`odyssey-card__corner-indicator odyssey-card__corner-indicator--tl ${isPremium ? 'odyssey-card__corner-indicator--premium' : ''}`}></div>
        <div className={`odyssey-card__corner-indicator odyssey-card__corner-indicator--br ${isPremium ? 'odyssey-card__corner-indicator--premium' : ''}`}></div>

        {/* Content Wrapper */}
        <div className="odyssey-card__content-wrapper">
          {/* Faction (Company) */}
          <div className="odyssey-card__faction">
            <div className={`odyssey-card__faction-ring ${isPremium ? 'odyssey-card__faction-ring--premium' : ''}`}>
              {getCompanyInitials()}
            </div>
            <div className="odyssey-card__company">
              {job.recruiterCompanyName}
            </div>
          </div>

          {/* Card Content */}
          <div className="odyssey-card__content">
            <h3 className="odyssey-card__title">{job.title}</h3>

            {/* Skills Tags */}
            {job.requiredSkills.length > 0 && (
              <div className="odyssey-card__tags">
                {job.requiredSkills.slice(0, 4).map((skill, index) => (
                  <span key={index} className="odyssey-card__tag">
                    {skill}
                  </span>
                ))}
                {job.requiredSkills.length > 4 && (
                  <span className="odyssey-card__tag odyssey-card__tag--more">
                    +{job.requiredSkills.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Budget */}
            <div className="odyssey-card__bounty">
              <span className="odyssey-card__bounty-value">{formatBudget()}</span>
              <span className="odyssey-card__bounty-label">/tháng</span>
            </div>

            {/* Meta Info */}
            <div className="odyssey-card__meta">
              <div className="odyssey-card__meta-item">
                <MapPin size={14} />
                <span>{job.isRemote ? 'Remote' : job.location || 'Việt Nam'}</span>
              </div>
              <div className="odyssey-card__meta-item">
                <Clock size={14} />
                <span>{formatRelativeTime()}</span>
              </div>
              <div className="odyssey-card__meta-item">
                <Users size={14} />
                <span>{job.applicantCount || 0} ứng tuyển</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className={`odyssey-card__arrow ${isPremium ? 'odyssey-card__arrow--premium' : ''}`}>
            <ArrowRight size={20} />
          </div>
        </div>

        {/* Premium Glow Effect */}
        {isPremium && (
          <div className="odyssey-card__glow"></div>
        )}
      </div>
    </div>
  );
};

export default FateCard;
