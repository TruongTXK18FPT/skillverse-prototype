import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { JobPostingResponse } from '../../data/jobDTOs';

interface FateCardProps {
  job: JobPostingResponse;
  onClick: () => void;
}

const FateCard = ({ job, onClick }: FateCardProps) => {
  // Determine card rarity based on salary
  const getRarity = (): 'gold' | 'crimson' | 'blue' => {
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

  return (
    <div className="odyssey-card-wrapper" onClick={onClick}>
      <div className={`odyssey-card odyssey-card--${rarity}`}>
        {/* Badge for high salary or remote */}
        {isHighSalary && (
          <div className="odyssey-card__badge odyssey-card__badge--urgent">
            HIGH PAY
          </div>
        )}
        {job.isRemote && !isHighSalary && (
          <div className="odyssey-card__badge odyssey-card__badge--remote">
            Remote
          </div>
        )}

        {/* Corner Hologram Indicators */}
        <div className="odyssey-card__corner-indicator odyssey-card__corner-indicator--tl"></div>
        <div className="odyssey-card__corner-indicator odyssey-card__corner-indicator--br"></div>

        {/* Content Wrapper */}
        <div className="odyssey-card__content-wrapper">
          {/* Faction (Company) */}
          <div className="odyssey-card__faction">
            <div className="odyssey-card__faction-ring">
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
                  <span className="odyssey-card__tag">
                    +{job.requiredSkills.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bounty (Salary) */}
          <div className="odyssey-card__bounty">
            <div className="odyssey-card__bounty-label">Bounty</div>
            <div className="odyssey-card__bounty-amount">
              {formatBudget()}
            </div>
          </div>

          {/* Footer */}
          <div className="odyssey-card__footer">
            <button className="odyssey-card__btn" onClick={onClick}>
              <span>Pick</span>
              <ArrowRight className="odyssey-card__btn-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FateCard;