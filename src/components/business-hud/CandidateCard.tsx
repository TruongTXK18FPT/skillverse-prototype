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

  const parseSkills = (skills?: string | string[]): string[] => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    try {
      return JSON.parse(skills);
    } catch {
      return [];
    }
  };

  const topSkills = parseSkills(candidate.topSkills);
  const fitAnalysis = candidate.fitAnalysis;
  const hasDetailedFitAnalysis = Boolean(
    fitAnalysis?.components?.length ||
    fitAnalysis?.skillBreakdown?.length ||
    fitAnalysis?.evidenceHighlights?.length ||
    fitAnalysis?.missingRequirements?.length ||
    fitAnalysis?.riskFlags?.length
  );

  const formatPercent = (value?: number | null) => `${Math.round((value || 0) * 100)}%`;
  const getComponentWeightedScore = (score?: number, weight?: number, weightedScore?: number) =>
    weightedScore ?? ((score || 0) * (weight || 0));
  const matchedSkillDetails = fitAnalysis?.skillBreakdown?.filter(skill => skill.matched) || [];
  const missingSkillDetails = fitAnalysis?.skillBreakdown?.filter(skill => !skill.matched) || [];

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
              <span title="Verified" className="candidate-card__verified" style={{ display: 'inline-flex' }}>
                <CheckCircle size={16} />
              </span>
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
            {candidate.yearsOfExperience !== undefined && (
              <span className="candidate-card__projects">
                <Briefcase size={12} />
                {candidate.yearsOfExperience}y exp
              </span>
            )}
            {candidate.location && (
              <span className="candidate-card__projects">
                <MapPin size={12} />
                {candidate.location}
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
              background: `conic-gradient(${getMatchQualityColor(candidate.matchQuality)} ${(candidate.matchScore || 0) * 3.6}deg, #e5e7eb 0deg)`
            }}
          >
            <span style={{ color: getMatchQualityColor(candidate.matchQuality) }}>
              {Math.round((candidate.matchScore || 0) * 100)}%
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

      {hasDetailedFitAnalysis && fitAnalysis && (
        <div className="candidate-card__fit-analysis">
          <div className="candidate-card__ranking-header">
            <Sparkles size={14} className="neon-icon" />
            <span>Fit analysis</span>
            {fitAnalysis.band && <span className="candidate-card__fit-band">{fitAnalysis.band}</span>}
          </div>

          {(fitAnalysis.recommendation || candidate.fitExplanation) && (
            <p className="candidate-card__fit-recommendation">
              {fitAnalysis.recommendation || candidate.fitExplanation}
            </p>
          )}

          <div className="candidate-card__fit-stats">
            <span>{candidate.totalVerifiedSkillsCount ?? 0} verified skills</span>
            <span>{candidate.relevantProjectsCount ?? 0} relevant projects</span>
            <span>{candidate.completedMissionsCount ?? 0} completed missions</span>
            {candidate.averageMissionRating !== undefined && (
              <span>{candidate.averageMissionRating.toFixed(1)}/5 rating</span>
            )}
          </div>

          {(fitAnalysis.components?.length ?? 0) > 0 && (
            <div className="candidate-card__ranking-grid">
              {fitAnalysis.components!.map((component) => {
                const weighted = getComponentWeightedScore(component.score, component.weight, component.weightedScore);
                return (
                  <div className="ranking-item" key={component.key}>
                    <div className="ranking-label-row">
                      <span className="ranking-label">
                        {component.label} ({Math.round((component.weight || 0) * 100)}%)
                      </span>
                      <span className="ranking-score">+{Math.round(weighted * 100)}%</span>
                    </div>
                    <div className="ranking-bar-wrapper">
                      <div className="ranking-bar-bg">
                        <div
                          className="ranking-bar-fill cyan-glow"
                          style={{ width: `${Math.min(100, Math.max(0, (component.score || 0) * 100))}%` }}
                        />
                      </div>
                      <span className="candidate-card__raw-score">{formatPercent(component.score)}</span>
                    </div>
                    {component.explanation && (
                      <p className="candidate-card__component-note">{component.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {(matchedSkillDetails.length > 0 || missingSkillDetails.length > 0 || candidate.matchedSkills?.length || candidate.unmatchedSkills?.length) && (
            <div className="candidate-card__skill-fit-row">
              <div>
                <strong>Matched</strong>
                <div className="candidate-card__mini-tags">
                  {(matchedSkillDetails.length ? matchedSkillDetails.map(skill => skill.skill) : candidate.matchedSkills || [])
                    .slice(0, 8)
                    .map(skill => <span key={skill} className="candidate-card__mini-tag candidate-card__mini-tag--good">{skill}</span>)}
                </div>
              </div>
              <div>
                <strong>Missing</strong>
                <div className="candidate-card__mini-tags">
                  {(missingSkillDetails.length ? missingSkillDetails.map(skill => skill.skill) : candidate.unmatchedSkills || [])
                    .slice(0, 8)
                    .map(skill => <span key={skill} className="candidate-card__mini-tag candidate-card__mini-tag--risk">{skill}</span>)}
                </div>
              </div>
            </div>
          )}

          {isExpanded && (
            <div className="candidate-card__fit-detail">
              {(fitAnalysis.evidenceHighlights?.length ?? 0) > 0 && (
                <div className="candidate-card__detail-section">
                  <strong>Evidence</strong>
                  {fitAnalysis.evidenceHighlights!.slice(0, 4).map((evidence, index) => (
                    <p key={`${evidence.type}-${index}`}>
                      {evidence.title}
                      {evidence.relevanceScore !== undefined && ` (${formatPercent(evidence.relevanceScore)})`}
                    </p>
                  ))}
                </div>
              )}

              {(fitAnalysis.missingRequirements?.length ?? 0) > 0 && (
                <div className="candidate-card__detail-section">
                  <strong>Gaps</strong>
                  {fitAnalysis.missingRequirements!.slice(0, 4).map((item) => (
                    <p key={item.skill}>{item.skill}{item.suggestion ? ` - ${item.suggestion}` : ''}</p>
                  ))}
                </div>
              )}

              {(fitAnalysis.riskFlags?.length ?? 0) > 0 && (
                <div className="candidate-card__detail-section candidate-card__detail-section--risk">
                  <strong>Risk flags</strong>
                  {fitAnalysis.riskFlags!.slice(0, 4).map((flag) => <p key={flag}>{flag}</p>)}
                </div>
              )}

              {(fitAnalysis.interviewQuestions?.length ?? 0) > 0 && (
                <div className="candidate-card__detail-section">
                  <strong>Interview questions</strong>
                  {fitAnalysis.interviewQuestions!.slice(0, 3).map((question) => <p key={question}>{question}</p>)}
                </div>
              )}

              {(fitAnalysis.nextActions?.length ?? 0) > 0 && (
                <div className="candidate-card__detail-section">
                  <strong>Next actions</strong>
                  {fitAnalysis.nextActions!.slice(0, 3).map((action) => <p key={action}>{action}</p>)}
                </div>
              )}
            </div>
          )}

          <button
            className="candidate-card__expand-btn candidate-card__fit-toggle"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? 'Thu gon' : 'Xem bang chung'}
          </button>
        </div>
      )}

      {/* Ranking Breakdown (Deterministic) */}
      {(!hasDetailedFitAnalysis && candidate.skillMatchScore !== undefined) && (
        <div className="candidate-card__ranking-breakdown">
          <div className="candidate-card__ranking-header">
            <Sparkles size={14} className="neon-icon" />
            <span>Phân tích Độ phù hợp (Thuật toán)</span>
          </div>
          <div className="candidate-card__ranking-grid">
            <div className="ranking-item">
              <div className="ranking-label-row">
                <span className="ranking-label">Kỹ năng (40%)</span>
                {candidate.primarySkillMatch && <span className="neon-badge">⭐ Primary Match</span>}
              </div>
              <div className="ranking-bar-wrapper">
                <div className="ranking-bar-bg"><div className="ranking-bar-fill cyan-glow" style={{width: `${Math.min(100, (candidate.skillMatchScore || 0) / 0.4 * 100)}%`}}></div></div>
                <span className="ranking-score">+{Math.round((candidate.skillMatchScore || 0) * 100)}%</span>
              </div>
            </div>
            <div className="ranking-item">
              <div className="ranking-label-row">
                <span className="ranking-label">Dự án (20%)</span>
              </div>
              <div className="ranking-bar-wrapper">
                <div className="ranking-bar-bg"><div className="ranking-bar-fill blue-glow" style={{width: `${Math.min(100, (candidate.projectMatchScore || 0) / 0.2 * 100)}%`}}></div></div>
                <span className="ranking-score">+{Math.round((candidate.projectMatchScore || 0) * 100)}%</span>
              </div>
            </div>
            <div className="ranking-item">
              <div className="ranking-label-row">
                <span className="ranking-label">Chứng chỉ (20%)</span>
              </div>
              <div className="ranking-bar-wrapper">
                <div className="ranking-bar-bg"><div className="ranking-bar-fill cyan-glow" style={{width: `${Math.min(100, (candidate.certMatchScore || 0) / 0.2 * 100)}%`}}></div></div>
                <span className="ranking-score">+{Math.round((candidate.certMatchScore || 0) * 100)}%</span>
              </div>
            </div>
            <div className="ranking-item">
              <div className="ranking-label-row">
                <span className="ranking-label">Missions (20%)</span>
              </div>
              <div className="ranking-bar-wrapper">
                <div className="ranking-bar-bg"><div className="ranking-bar-fill blue-glow" style={{width: `${Math.min(100, (candidate.missionMatchScore || 0) / 0.2 * 100)}%`}}></div></div>
                <span className="ranking-score">+{Math.round((candidate.missionMatchScore || 0) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Fit Explanation - Keep as secondary context if available */}
      {(!hasDetailedFitAnalysis && (candidate.fitExplanation || candidate.aiSummary)) && (
        <div className="candidate-card__ai-summary">
          <div className="candidate-card__ai-header">
            <Sparkles size={14} />
            <span>AI Đánh giá thêm</span>
          </div>
          <p className="candidate-card__ai-text">
            {isExpanded ? (candidate.fitExplanation || candidate.aiSummary) : (candidate.fitExplanation || candidate.aiSummary)?.slice(0, 120) + '...'}
          </p>
          {((candidate.fitExplanation || candidate.aiSummary)?.length || 0) > 120 && (
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
