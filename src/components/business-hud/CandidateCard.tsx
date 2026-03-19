import { useState } from 'react';
import {
  User,
  MapPin,
  Clock,
  Briefcase,
  Award,
  CheckCircle,
  Crown,
  Star,
  MessageCircle,
  BookmarkPlus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { CandidateSearchResult } from '../../data/portfolioDTOs';
import './CandidateCard.css';

interface CandidateCardProps {
  candidate: CandidateSearchResult;
  onViewProfile: (candidateId: number) => void;
  onStartChat?: (candidateId: number) => void;
  onShortlist?: (candidateId: number) => void;
  onConnectToJob?: (candidateId: number) => void;
  selectedJobId?: number;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onViewProfile,
  onStartChat,
  onShortlist,
  onConnectToJob,
  selectedJobId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const formatHourlyRate = (rate?: number, currency?: string) => {
    if (!rate) return null;
    const formatter = new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 0
    });
    return `${formatter.format(rate)} ${currency || 'VND'}/giờ`;
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Vừa hoạt động';
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays}ng trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getMatchQualityColor = (quality?: string) => {
    switch (quality) {
      case 'EXCELLENT': return '#10b981';
      case 'GOOD': return '#3b82f6';
      case 'FAIR': return '#f59e0b';
      case 'POOR': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getMatchQualityLabel = (quality?: string) => {
    switch (quality) {
      case 'EXCELLENT': return 'Xuất sắc';
      case 'GOOD': return 'Tốt';
      case 'FAIR': return 'Khá';
      case 'POOR': return 'Thấp';
      default: return 'Chưa đánh giá';
    }
  };

  const parseSkills = (skillsJson?: string): string[] => {
    if (!skillsJson) return [];
    try {
      return JSON.parse(skillsJson);
    } catch {
      return [];
    }
  };

  const topSkills = candidate.topSkills?.length > 0
    ? parseSkills(candidate.topSkills).length > 0
      ? parseSkills(candidate.topSkills)
      : candidate.topSkills
    : [];

  return (
    <div className={`candidate-card ${candidate.isPremium ? 'candidate-card--premium' : ''} ${candidate.isHighlighted ? 'candidate-card--highlighted' : ''}`}>
      {/* Header with Avatar and Basic Info */}
      <div className="candidate-card__header" onClick={() => onViewProfile(candidate.userId)}>
        <div className="candidate-card__avatar-wrapper">
          {candidate.avatarUrl ? (
            <img src={candidate.avatarUrl} alt={candidate.fullName} className="candidate-card__avatar" />
          ) : (
            <div className="candidate-card__avatar-placeholder">
              <User size={24} />
            </div>
          )}

          {/* Premium Badge */}
          {candidate.isPremium && (
            <div className="candidate-card__premium-badge" title="Premium Candidate">
              <Crown size={12} />
            </div>
          )}
        </div>

        <div className="candidate-card__info">
          <div className="candidate-card__name-row">
            <h3 className="candidate-card__name">{candidate.fullName}</h3>
            {candidate.isVerified && (
              <CheckCircle size={16} className="candidate-card__verified" title="Verified" />
            )}
          </div>

          {candidate.professionalTitle && (
            <p className="candidate-card__title">{candidate.professionalTitle}</p>
          )}

          <div className="candidate-card__meta">
            {candidate.hourlyRate && (
              <span className="candidate-card__rate">
                <Briefcase size={12} />
                {formatHourlyRate(candidate.hourlyRate, candidate.preferredCurrency)}
              </span>
            )}
            {candidate.totalProjects !== undefined && (
              <span className="candidate-card__projects">
                <Award size={12} />
                {candidate.totalProjects} dự án
              </span>
            )}
            {candidate.lastActive && (
              <span className="candidate-card__activity">
                <Clock size={12} />
                {formatRelativeTime(candidate.lastActive)}
              </span>
            )}
          </div>
        </div>

        {/* Match Score */}
        <div className="candidate-card__match">
          <div
            className="candidate-card__match-score"
            style={{
              background: `conic-gradient(${getMatchQualityColor(candidate.matchQuality)} ${candidate.matchScore * 3.6}deg, #e5e7eb 0deg)`
            }}
          >
            <span style={{ color: getMatchQualityColor(candidate.matchQuality) }}>
              {Math.round(candidate.matchScore * 100)}%
            </span>
          </div>
          <span className="candidate-card__match-label">
            {getMatchQualityLabel(candidate.matchQuality)}
          </span>
        </div>
      </div>

      {/* Skills */}
      {topSkills.length > 0 && (
        <div className="candidate-card__skills">
          {topSkills.slice(0, 5).map((skill, index) => (
            <span key={index} className="candidate-card__skill-tag">
              {skill}
            </span>
          ))}
          {topSkills.length > 5 && (
            <span className="candidate-card__skill-more">+{topSkills.length - 5}</span>
          )}
        </div>
      )}

      {/* AI Fit Explanation */}
      {(candidate.fitExplanation || candidate.aiSummary) && (
        <div className="candidate-card__ai-summary">
          <div className="candidate-card__ai-header">
            <Sparkles size={14} />
            <span>Tại sao phù hợp</span>
          </div>
          <p className="candidate-card__ai-text">
            {isExpanded ? (candidate.fitExplanation || candidate.aiSummary) : (candidate.fitExplanation || candidate.aiSummary)?.slice(0, 120) + '...'}
          </p>
          {(candidate.fitExplanation || candidate.aiSummary)?.length > 120 && (
            <button
              className="candidate-card__expand-btn"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {isExpanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}

      {/* Badges */}
      <div className="candidate-card__badges">
        {candidate.hasPortfolio && (
          <span className="candidate-card__badge candidate-card__badge--portfolio">
            <Star size={12} />
            Portfolio
          </span>
        )}
        {candidate.isPremium && (
          <span className="candidate-card__badge candidate-card__badge--premium">
            <Crown size={12} />
            Premium
          </span>
        )}
        {candidate.isVerified && (
          <span className="candidate-card__badge candidate-card__badge--verified">
            <CheckCircle size={12} />
            Verified
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="candidate-card__actions">
        <button
          className="candidate-card__action candidate-card__action--primary"
          onClick={() => onViewProfile(candidate.userId)}
        >
          <ExternalLink size={14} />
          Xem Hồ Sơ
        </button>

        {onShortlist && (
          <button
            className="candidate-card__action"
            onClick={() => onShortlist(candidate.userId)}
          >
            <BookmarkPlus size={14} />
            Lưu
          </button>
        )}

        {onStartChat && (
          <button
            className="candidate-card__action"
            onClick={() => onStartChat(candidate.userId)}
          >
            <MessageCircle size={14} />
            Nhắn Tin
          </button>
        )}

        {onConnectToJob && selectedJobId && (
          <button
            className="candidate-card__action candidate-card__action--highlight"
            onClick={() => onConnectToJob(candidate.userId)}
          >
            <Briefcase size={14} />
            Mời Ứng Tuyển
          </button>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;
