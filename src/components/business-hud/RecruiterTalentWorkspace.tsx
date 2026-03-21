import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Crown,
  Eye,
  FileText,
  Inbox,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  AICandidateMatchResponse,
  CandidateSearchResult,
  ExternalCertificateDTO,
  MentorReviewDTO,
  PortfolioProjectDTO,
  RecruitmentMessageResponse,
  RecruitmentSessionResponse,
  RecruitmentSessionStatus,
  UserProfileDTO,
} from '../../data/portfolioDTOs';
import { JobApplicationResponse, JobApplicationStatus, JobPostingResponse, JobStatus } from '../../data/jobDTOs';
import candidateSearchService from '../../services/candidateSearchService';
import jobBoostService from '../../services/jobBoostService';
import jobService from '../../services/jobService';
import portfolioService from '../../services/portfolioService';
import recruiterSubscriptionService, {
  RecruiterSubscriptionInfoResponse,
} from '../../services/recruiterSubscriptionService';
import recruitmentChatService from '../../services/recruitmentChatService';
import {
  getApplicantDisplayName,
  getApplicantInitials,
  getApplicantSubtitle,
  resolveRecruitmentAssetUrl,
} from '../../utils/recruitmentUi';
import { useToast } from '../../hooks/useToast';
import './RecruiterTalentWorkspace.css';

type TalentTab = 'applicants' | 'advanced' | 'chats';
type DecisionState = 'ACCEPTED' | 'REJECTED';
type ApplicantFilter = 'all' | 'pending' | 'accepted' | 'rejected';

type CandidateSeed = {
  candidateId: number;
  fullName: string;
  professionalTitle?: string;
  avatarUrl?: string;
  portfolioSlug?: string;
  email?: string;
  matchScore?: number;
  matchQuality?: string;
  sourceLabel: string;
};

interface RecruiterTalentWorkspaceProps {
  jobs: JobPostingResponse[];
}

const resolveAssetUrl = (raw?: string): string => {
  return resolveRecruitmentAssetUrl(raw) || '/images/meowl.jpg';
};

const formatCompactCurrency = (amount?: number, currency = 'VND'): string => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatShortDate = (value?: string): string => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatRelativeTime = (value?: string): string => {
  if (!value) return '—';
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffHours < 1) return 'Vừa xong';
  if (diffHours < 24) return `${diffHours}h trước`;
  if (diffDays < 7) return `${diffDays}ng trước`;
  return formatShortDate(value);
};

const parseSkillList = (value?: string[] | string | null): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }
};

const getJobStatusLabel = (status: JobStatus): string => {
  switch (status) {
    case JobStatus.OPEN: return 'Đang tuyển';
    case JobStatus.IN_PROGRESS: return 'Draft';
    case JobStatus.CLOSED: return 'Đã đóng';
    case JobStatus.PENDING_APPROVAL: return 'Chờ duyệt';
    case JobStatus.REJECTED: return 'Bị từ chối';
    default: return status;
  }
};

const getSessionStatusLabel = (status: RecruitmentSessionStatus): string => {
  switch (status) {
    case RecruitmentSessionStatus.CONTACTED: return 'Đã liên hệ';
    case RecruitmentSessionStatus.INTERESTED: return 'Quan tâm';
    case RecruitmentSessionStatus.INVITED: return 'Đã mời';
    case RecruitmentSessionStatus.APPLICATION_RECEIVED: return 'Đã nhận đơn';
    case RecruitmentSessionStatus.SCREENING: return 'Sàng lọc';
    case RecruitmentSessionStatus.OFFER_SENT: return 'Đã gửi offer';
    case RecruitmentSessionStatus.HIRED: return 'Đã tuyển';
    case RecruitmentSessionStatus.NOT_INTERESTED: return 'Không quan tâm';
    case RecruitmentSessionStatus.ARCHIVED: return 'Lưu trữ';
    default: return status;
  }
};

const getApplicationStatusLabel = (status: JobApplicationResponse['status']): string => {
  switch (status) {
    case 'PENDING': return 'Mới apply';
    case 'REVIEWED': return 'Đã xem';
    case 'ACCEPTED': return 'Đã duyệt';
    case 'REJECTED': return 'Đã loại';
    default: return status;
  }
};

const getSkillSignalColor = (score: number): string => {
  if (score >= 0.8) return '#4ade80';
  if (score >= 0.6) return '#f0d060';
  if (score >= 0.4) return '#fbbf24';
  return '#f87171';
};

// ============ AI INSIGHT RENDERER ============
interface SkillSignal {
  skill?: string;
  isRequired?: boolean;
  relevanceScore?: number;
  evidence?: string;
}

const AIInsightRenderer = ({ insight }: { insight: AICandidateMatchResponse }) => {
  const [expanded, setExpanded] = useState(false);
  const confidence = Math.round((insight.confidence || 0) * 100);
  const signals: SkillSignal[] = (insight as any).skillSignals || [];

  // Strip escape artifacts from AI output
  const cleanText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\\{/g, '{')
      .replace(/\\\}/g, '}')
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
      .replace(/\\\|/g, '|')
      .replace(/\\`/g, '`')
      .replace(/\\-/g, '-')
      .replace(/\\#/g, '#')
      .replace(/\{\{/g, '{')
      .replace(/\}\}/g, '}')
      .replace(/\[\[/g, '[')
      .replace(/\]\]/g, ']')
      .replace(/""/g, '"')
      .replace(/"{2,}/g, '"')
      .replace(/\*{3,}/g, '**')
      .replace(/_{3,}/g, '_')
      .trim();
  };

  // Inline markdown: **bold**, `code`, *italic*, emojis
  const parseInline = (line: string): React.ReactNode => {
    if (!line) return null;
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partKey = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={partKey++} className="md-bold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      // Inline code `text`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(<code key={partKey++} className="md-code">{codeMatch[1]}</code>);
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }
      // Italic *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)([^*_]+?)\1/);
      if (italicMatch) {
        parts.push(<em key={partKey++} className="md-italic">{italicMatch[2]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }
      const nextSpecial = remaining.search(/\*\*|`|\*_|_[\s\W]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }
    return parts.length > 0 ? <span key={`inline-${partKey}`}>{parts}</span> : null;
  };

  // Check if content looks like rich markdown (has ## headings)
  const isRichMarkdown = (text: string): boolean => {
    return /^##\s/.test(text.trim());
  };

  // Parse rich markdown into structured JSX blocks
  const parseRichMarkdown = (raw: string): React.ReactNode => {
    const text = cleanText(raw);
    if (!text) return null;

    const lines = text.split('\n');
    const sections: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Skip HR before first content
      if ((line === '---' || line === '***' || line === '___') && sections.length === 0) {
        i++; continue;
      }

      // HR divider
      if (line === '---' || line === '***' || line === '___') {
        sections.push(<hr key={key++} className="md-hr" />);
        i++; continue;
      }

      // Top-level heading: ## 🧠 Đánh giá tổng quan
      if (line.startsWith('## ')) {
        const headingText = line.slice(3).trim();
        // Extract emoji
        const emojiMatch = headingText.match(/^([^\s]+\s)/);
        const emoji = emojiMatch ? emojiMatch[1] : '';
        const heading = emojiMatch ? headingText.slice(emojiMatch[0].length) : headingText;
        sections.push(
          <div key={key++} className="md-section">
            <div className="md-section__heading">
              {emoji && <span className="md-section__emoji">{emoji}</span>}
              <span>{parseInline(heading)}</span>
            </div>
          </div>
        );
        i++; continue;
      }

      // Sub-heading: ### 1. React (Quan trọng)
      if (line.startsWith('### ')) {
        const subText = line.slice(4).trim();
        // Extract index number
        const indexMatch = subText.match(/^(\d+\.\s*)/);
        const idx = indexMatch ? indexMatch[1] : '';
        const rest = indexMatch ? subText.slice(indexMatch[0].length) : subText;

        // Check for badge (Quan trọng / Ưu tiên)
        const badgeMatch = rest.match(/\s*\(([^)]+)\)\s*$/);
        const badge = badgeMatch ? badgeMatch[1].trim() : '';
        const title = badgeMatch ? rest.slice(0, -badgeMatch[0].length).trim() : rest;

        // Collect content until next ## or --- or ###
        const contentLines: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const t = lines[j].trim();
          if (t.startsWith('## ') || t.startsWith('---') || t.startsWith('### ')) break;
          if (t) contentLines.push(lines[j]);
          j++;
        }

        const content = parseSkillContent(contentLines.join('\n'), badge);

        sections.push(
          <div key={key++} className={`md-skill-block ${badge.toLowerCase().includes('quan') ? 'md-skill-block--required' : ''}`}>
            <div className="md-skill-block__header">
              {idx && <span className="md-skill-block__idx">{idx.replace('.', '')}</span>}
              <span className="md-skill-block__name">{parseInline(title)}</span>
              {badge && (
                <span className={`md-skill-block__badge ${badge.toLowerCase().includes('quan') ? 'md-skill-block__badge--required' : 'md-skill-block__badge--optional'}`}>
                  {badge}
                </span>
              )}
            </div>
            {content}
          </div>
        );
        i = j;
        continue;
      }

      // Bullet lists
      if (line.match(/^[-*+] /)) {
        const items: React.ReactNode[] = [];
        while (i < lines.length && lines[i].trim().match(/^[-*+] /)) {
          const itemText = lines[i].trim().slice(2);
          // Check for nested sub-items
          if (itemText.match(/^\s{2,}[-*+]/)) {
            // Skip nested for now — handled inline
            items.push(<li key={key++}>{parseInline(itemText.trim())}</li>);
          } else {
            items.push(<li key={key++}>{parseInline(itemText)}</li>);
          }
          i++;
        }
        sections.push(<ul key={key++} className="md-ul">{items}</ul>);
        continue;
      }

      // Ordered lists
      if (line.match(/^\d+\. /)) {
        const items: React.ReactNode[] = [];
        while (i < lines.length && lines[i].trim().match(/^\d+\. /)) {
          const itemText = lines[i].trim().replace(/^\d+\. /, '');
          items.push(<li key={key++}>{parseInline(itemText)}</li>);
          i++;
        }
        sections.push(<ol key={key++} className="md-ol">{items}</ol>);
        continue;
      }

      // Paragraph
      if (line) {
        const paraLines: string[] = [line];
        let j = i + 1;
        while (j < lines.length) {
          const t = lines[j].trim();
          if (!t || t.startsWith('#') || t.startsWith('-') || t.startsWith('*') || t.match(/^\d+\./) || t === '---') break;
          if (t) paraLines.push(t);
          j++;
        }
        sections.push(<p key={key++} className="md-p">{paraLines.map(l => parseInline(l))}</p>);
        i = j;
        continue;
      }

      i++;
    }

    return <>{sections}</>;
  };

  // Parse skill block content (score, evidence, etc.)
  const parseSkillContent = (content: string, _badge: string): React.ReactNode => {
    const lines = content.split('\n');
    const rows: React.ReactNode[] = [];
    let key = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Key-value: **Label:** value
      const kvMatch = trimmed.match(/^\*\*([^*]+):\*\*\s*(.+)/);
      if (kvMatch) {
        const label = kvMatch[1].trim();
        const value = kvMatch[2].trim();

        if (label.includes('Mức độ phù hợp') || label.includes('Mức độ')) {
          // Extract stars and score
          const starMatch = value.match(/(?:⭐|✅|⚠️|❗|❌|[\s])*\s*\(?([0-9.]+)\/?1\.0\)?/);
          const scoreMatch = value.match(/([0-9.]+)\/1\.0/);
          const stars = starMatch ? starMatch[1].trim() : value.split('(')[0].trim();
          const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

          rows.push(
            <div key={key++} className="md-skill-row">
              <span className="md-skill-row__label">{parseInline(label)}</span>
              <div className="md-skill-row__score">
                <span className="md-skill-stars">{stars}</span>
                <span className="md-skill-score-num">({score.toFixed(1)}/1.0)</span>
                <div className="md-skill-bar">
                  <div className="md-skill-bar__fill" style={{
                    width: `${score * 100}%`,
                    background: score >= 0.8 ? '#4ade80' : score >= 0.6 ? '#facc15' : score >= 0.4 ? '#fb923c' : '#f87171'
                  }} />
                </div>
              </div>
            </div>
          );
        } else if (label.includes('Trạng thái')) {
          rows.push(
            <div key={key++} className="md-skill-row">
              <span className="md-skill-row__label">{parseInline(label)}</span>
              <span className="md-skill-status">{parseInline(value)}</span>
            </div>
          );
        } else {
          rows.push(
            <div key={key++} className="md-skill-row">
              <span className="md-skill-row__label">{parseInline(label)}</span>
              <span className="md-skill-row__value">{parseInline(value)}</span>
            </div>
          );
        }
        continue;
      }

      // Bullet under skill
      if (trimmed.match(/^[-*+] /)) {
        rows.push(<li key={key++} className="md-skill-subitem">{parseInline(trimmed.slice(2))}</li>);
        continue;
      }

      // Standalone text
      rows.push(<p key={key++} className="md-skill-note">{parseInline(trimmed)}</p>);
    }

    return <div className="md-skill-content">{rows}</div>;
  };

  const reasoning = cleanText(insight.reasoning || '');
  const hasRichMarkdown = isRichMarkdown(reasoning);

  return (
    <div className="rtw-ai-insight">
      {/* Header */}
      <div className="rtw-ai-insight__header">
        <div className="rtw-ai-insight__title">
          <Sparkles size={16} />
          <span>Phân tích AI</span>
        </div>
        <div className="rtw-ai-insight__confidence">
          <div className="rtw-ai-insight__confidence-bar">
            <div
              className="rtw-ai-insight__confidence-fill"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="rtw-ai-insight__confidence-text">{confidence}%</span>
        </div>
      </div>

      {/* Content */}
      <div className="rtw-ai-insight__content">
        {/* Full markdown rendering */}
        {reasoning && (
          <div className="rtw-ai-insight__reasoning">
            {parseRichMarkdown(reasoning)}
          </div>
        )}

        {/* Skill Signals — show as mini-cards when not in rich markdown */}
        {!hasRichMarkdown && signals.length > 0 && (
          <div className="rtw-ai-insight__section">
            <div className="rtw-ai-insight__section-title">
              <CheckCircle2 size={12} />
              Tín hiệu kỹ năng ({signals.length})
            </div>
            <div className="rtw-skill-signals">
              {signals.map((signal, idx) => {
                const score = signal.relevanceScore || 0;
                const color = getSkillSignalColor(score);
                return (
                  <div
                    key={idx}
                    className={`rtw-skill-signal ${signal.isRequired ? 'rtw-skill-signal--required' : ''}`}
                  >
                    <div className="rtw-skill-signal__bar">
                      <div
                        className="rtw-skill-signal__bar-fill"
                        style={{ width: `${score * 100}%`, background: color }}
                      />
                    </div>
                    <div className="rtw-skill-signal__info">
                      <span className="rtw-skill-signal__name">{signal.skill || 'Kỹ năng'}</span>
                      {signal.evidence && (
                        <span className="rtw-skill-signal__evidence">{signal.evidence}</span>
                      )}
                    </div>
                    <span className={`rtw-skill-signal__badge ${signal.isRequired ? 'rtw-skill-signal__badge--required' : 'rtw-skill-signal__badge--optional'}`}>
                      {signal.isRequired ? 'Bắt buộc' : 'Ưu tiên'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Raw toggle */}
        <div>
          <button
            className="rtw-ghost-btn"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem', padding: '0.45rem' }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Thu gọn markdown gốc' : 'Xem markdown gốc từ AI'}
          </button>
          {expanded && (
            <pre style={{
              marginTop: '0.4rem',
              padding: '0.75rem',
              borderRadius: '0.8rem',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(212,175,55,0.08)',
              fontSize: '0.7rem',
              color: '#b8a898',
              overflow: 'auto',
              maxHeight: '320px',
              lineHeight: 1.6,
              fontFamily: '"Fira Code", "Cascadia Code", monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {reasoning}
            </pre>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="rtw-ai-insight__footer">
        <span>{formatRelativeTime(insight.generatedAt)}</span>
        <span>Confidence {confidence}%</span>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT ============
const RecruiterTalentWorkspace = ({ jobs }: RecruiterTalentWorkspaceProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const portfolioRequestRef = useRef(0);
  const [jobRoster, setJobRoster] = useState<JobPostingResponse[]>(jobs);

  const [subscription, setSubscription] =
    useState<RecruiterSubscriptionInfoResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TalentTab>('applicants');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [applicants, setApplicants] = useState<JobApplicationResponse[]>([]);
  const [discoveries, setDiscoveries] = useState<CandidateSearchResult[]>([]);
  const [sessions, setSessions] = useState<RecruitmentSessionResponse[]>([]);

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSeed | null>(null);
  const [selectedSession, setSelectedSession] = useState<RecruitmentSessionResponse | null>(null);
  const [applicantFilter, setApplicantFilter] = useState<ApplicantFilter>('all');

  const [portfolioProfile, setPortfolioProfile] = useState<UserProfileDTO | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProjectDTO[]>([]);
  const [portfolioCertificates, setPortfolioCertificates] = useState<ExternalCertificateDTO[]>([]);
  const [portfolioReviews, setPortfolioReviews] = useState<MentorReviewDTO[]>([]);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [discoveryAccessError, setDiscoveryAccessError] = useState<string | null>(null);

  const [boost, setBoost] = useState<any>(null);
  const [boostAnalytics, setBoostAnalytics] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<AICandidateMatchResponse | null>(null);

  const [messageDraft, setMessageDraft] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [boostDuration, setBoostDuration] = useState(7);

  const [decisionModal, setDecisionModal] = useState<{
    application: JobApplicationResponse;
    status: DecisionState;
  } | null>(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isApplicantsLoading, setIsApplicantsLoading] = useState(false);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isBoostLoading, setIsBoostLoading] = useState(false);
  const [isActionBusy, setIsActionBusy] = useState(false);

  const [chatMessages, setChatMessages] = useState<RecruitmentMessageResponse[]>([]);

  useEffect(() => {
    setJobRoster(jobs);
  }, [jobs]);

  const orderedJobs = [...jobRoster].sort((left, right) => {
    const leftOpen = left.status === JobStatus.OPEN ? 1 : 0;
    const rightOpen = right.status === JobStatus.OPEN ? 1 : 0;
    if (leftOpen !== rightOpen) return rightOpen - leftOpen;
    return (right.applicantCount || 0) - (left.applicantCount || 0);
  });

  const selectedJob =
    orderedJobs.find((job) => job.id === selectedJobId) || orderedJobs[0] || null;

  const totalApplicantCount = jobRoster.reduce(
    (sum, job) => sum + (job.applicantCount || 0),
    0,
  );
  const openJobCount = jobRoster.filter((job) => job.status === JobStatus.OPEN).length;
  const currentPortfolioSkills = parseSkillList(portfolioProfile?.topSkills);

  const filteredApplicants = applicants.filter((app) => {
    if (applicantFilter === 'pending') return app.status === 'PENDING' || app.status === 'REVIEWED';
    if (applicantFilter === 'accepted') return app.status === 'ACCEPTED';
    if (applicantFilter === 'rejected') return app.status === 'REJECTED';
    return true;
  });

  const hasAcceptedApplicant = applicants.some((app) => app.status === 'ACCEPTED');

  const loadSubscription = async () => {
    try {
      const result = await recruiterSubscriptionService.getSubscriptionInfo();
      setSubscription(result);
    } catch (error: any) {
      showError('Không thể tải quyền recruiter', error.message || 'Vui lòng thử lại sau');
    }
  };

  const openPortfolioExternally = () => {
    if (!selectedCandidate) return;
    const targetPath = selectedCandidate.portfolioSlug
      ? `/portfolio/${selectedCandidate.portfolioSlug}`
      : `/portfolio/profile/${selectedCandidate.candidateId}`;
    window.open(targetPath, '_blank', 'noopener,noreferrer');
  };

  const pickCandidate = async (
    seed: CandidateSeed,
    preferredSession?: RecruitmentSessionResponse | null,
  ) => {
    const requestId = portfolioRequestRef.current + 1;
    portfolioRequestRef.current = requestId;

    setSelectedCandidate(seed);
    setAiInsight(null);
    setPortfolioError(null);
    setIsPortfolioLoading(true);

    const linkedSession =
      preferredSession === undefined
        ? sessions.find(
            (session) =>
              session.candidateId === seed.candidateId &&
              (!selectedJobId || session.jobId === selectedJobId),
          ) || null
        : preferredSession;

    setSelectedSession(linkedSession);

    const [profile, projects, certificates, reviews] = await Promise.all([
      portfolioService.getPublicProfile(seed.candidateId).catch(() => null),
      portfolioService.getPublicUserProjects(seed.candidateId).catch(() => []),
      portfolioService.getPublicUserCertificates(seed.candidateId).catch(() => []),
      portfolioService.getPublicUserReviews(seed.candidateId).catch(() => []),
    ]);

    if (requestId !== portfolioRequestRef.current) return;

    setPortfolioProfile(profile);
    setPortfolioProjects(projects);
    setPortfolioCertificates(certificates);
    setPortfolioReviews(reviews);
    setPortfolioError(profile ? null : 'Không thể tải hồ sơ công khai của ứng viên này.');
    setIsPortfolioLoading(false);
  };

  const loadApplicants = async (jobId: number) => {
    setIsApplicantsLoading(true);
    try {
      const result = await jobService.getJobApplicants(jobId, 0, 20);
      setApplicants(result.content || []);

      if (result.content?.length) {
        const firstApplicant = result.content[0];
        if (!selectedCandidate || selectedCandidate.sourceLabel !== 'Ứng viên đã apply') {
          await pickCandidate({
            candidateId: firstApplicant.userId,
            fullName: getApplicantDisplayName(firstApplicant.userFullName, firstApplicant.userEmail),
            professionalTitle: firstApplicant.userProfessionalTitle,
            avatarUrl: firstApplicant.userAvatar,
            portfolioSlug: firstApplicant.portfolioSlug,
            email: firstApplicant.userEmail,
            sourceLabel: 'Ứng viên đã apply',
          });
        }
      }
    } catch (error: any) {
      setApplicants([]);
      showError('Không thể tải applicants', error.message || 'Vui lòng thử lại');
    } finally {
      setIsApplicantsLoading(false);
    }
  };

  const loadDiscoveries = async (jobId: number, showToastOnError = false) => {
    if (!subscription?.hasCandidateDatabaseAccess) {
      setDiscoveries([]);
      setDiscoveryAccessError('Cần nâng cấp gói Recruiter để truy cập cơ sở ứng viên.');
      return;
    }

    setDiscoveryAccessError(null);
    setIsDiscoveryLoading(true);
    try {
      const result = await candidateSearchService.searchCandidates(
        {
          hasPortfolio: true,
          jobId,
          // No enableAIMatching - keep it clean
        },
        0,
        20,
        'totalScore',
        'DESC',
      );

      setDiscoveries(result.candidates);
    } catch (error: any) {
      setDiscoveries([]);
      if (showToastOnError) {
        showError('Không thể tìm ứng viên', error.message || 'Vui lòng kiểm tra gói recruiter');
      }
    } finally {
      setIsDiscoveryLoading(false);
    }
  };

  const loadSessions = async (jobId?: number | null) => {
    setIsSessionsLoading(true);
    try {
      const result = jobId
        ? await recruitmentChatService.getSessionsByJob(jobId)
        : (await recruitmentChatService.getRecruiterSessions(0, 24)).sessions;

      setSessions(result || []);

      if (selectedSession) {
        const refreshed = (result || []).find((session) => session.id === selectedSession.id) || null;
        setSelectedSession(refreshed);
      }
    } catch (error: any) {
      setSessions([]);
      showError('Không thể tải chat tuyển dụng', error.message || 'Vui lòng thử lại');
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const loadBoost = async (jobId: number) => {
    try {
      const result = await jobBoostService.getBoostByJob(jobId);
      setBoost(result);
      if (result) {
        const analytics = await jobBoostService.getBoostAnalytics(result.id).catch(() => null);
        setBoostAnalytics(analytics);
      } else {
        setBoostAnalytics(null);
      }
    } catch {
      setBoost(null);
      setBoostAnalytics(null);
    }
  };

  const syncJobContext = async (jobId: number) => {
    await Promise.all([
      loadApplicants(jobId),
      loadDiscoveries(jobId),
      loadSessions(jobId),
      loadBoost(jobId),
    ]);
  };

  const handleRefreshCurrentJob = async () => {
    if (!selectedJobId) return;
    await syncJobContext(selectedJobId);
    showSuccess('Đã làm mới', 'Pipeline tuyển dụng đã được đồng bộ lại.');
  };

  const handleCloseSelectedJob = async () => {
    if (!selectedJobId || !selectedJob) return;

    try {
      setIsActionBusy(true);
      const updatedJob = await jobService.changeJobStatus(selectedJobId, JobStatus.CLOSED);
      setJobRoster((current) =>
        current.map((job) => (job.id === updatedJob.id ? updatedJob : job)),
      );
      showSuccess('Đã đóng job', 'Job không còn nhận thêm ứng viên mới.');
    } catch (error: any) {
      showError('Không thể đóng job', error.message || 'Vui lòng thử lại');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleReviewApplication = async (application: JobApplicationResponse) => {
    try {
      setIsActionBusy(true);
      await jobService.updateApplicationStatus(application.id, {
        status: JobApplicationStatus.REVIEWED,
      });
      showSuccess('Đã đánh dấu', 'Applicant đã được chuyển sang trạng thái đã xem.');
      if (selectedJobId) {
        await loadApplicants(selectedJobId);
      }
    } catch (error: any) {
      showError('Không thể cập nhật applicant', error.message || 'Vui lòng thử lại');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleConfirmDecision = async () => {
    if (!decisionModal) return;

    const fieldName =
      decisionModal.status === 'ACCEPTED' ? 'acceptanceMessage' : 'rejectionReason';

    if (!decisionNote.trim()) {
      showError('Thiếu nội dung', 'Vui lòng nhập ghi chú cho quyết định này.');
      return;
    }

    try {
      setIsActionBusy(true);
      await jobService.updateApplicationStatus(decisionModal.application.id, {
        status: decisionModal.status as JobApplicationStatus,
        [fieldName]: decisionNote.trim(),
      });
      setDecisionModal(null);
      setDecisionNote('');
      showSuccess(
        decisionModal.status === 'ACCEPTED' ? 'Đã duyệt applicant' : 'Đã loại applicant',
        'Trạng thái hồ sơ đã được cập nhật.',
      );
      if (selectedJobId) {
        await loadApplicants(selectedJobId);
      }
    } catch (error: any) {
      showError('Không thể cập nhật applicant', error.message || 'Vui lòng thử lại');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleBoostAction = async () => {
    if (!selectedJobId) return;

    try {
      setIsBoostLoading(true);
      if (boost) {
        const extended = await jobBoostService.extendBoost(boost.id, boostDuration);
        setBoost(extended);
        showSuccess('Đã gia hạn boost', 'Job đang được đẩy ưu tiên thêm thời gian.');
      } else {
        const created = await jobBoostService.createBoost({
          jobId: selectedJobId,
          durationDays: boostDuration,
        });
        setBoost(created);
        showSuccess('Đã kích hoạt boost', 'Job đã được đẩy nổi bật trong candidate search.');
      }

      await loadBoost(selectedJobId);
    } catch (error: any) {
      showError('Không thể boost job', error.message || 'Vui lòng kiểm tra quota recruiter.');
    } finally {
      setIsBoostLoading(false);
    }
  };

  const handleCancelBoost = async () => {
    if (!boost) return;

    try {
      setIsBoostLoading(true);
      await jobBoostService.cancelBoost(boost.id);
      setBoost(null);
      setBoostAnalytics(null);
      showSuccess('Đã huỷ boost', 'Job đã quay về phân phối bình thường.');
    } catch (error: any) {
      showError('Không thể huỷ boost', error.message || 'Vui lòng thử lại.');
    } finally {
      setIsBoostLoading(false);
    }
  };

  const openChatWithCandidate = async (
    seed: CandidateSeed,
    sourceType: 'MANUAL' | 'AI_SEARCH' | 'PROFILE_VIEW' = 'MANUAL',
  ) => {
    try {
      setIsActionBusy(true);
      const session = await recruitmentChatService.getOrCreateSession(
        seed.candidateId,
        selectedJobId || undefined,
        sourceType,
      );
      // Refresh sessions in background
      loadSessions(selectedJobId);
      // Navigate immediately to messages page with this session
      navigate('/messages', {
        state: {
          openChatWith: session.id.toString(),
          type: 'RECRUITMENT',
        },
      });
    } catch (error: any) {
      showError('Không thể mở chat', error.message || 'Vui lòng thử lại.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const inviteCandidateToJob = async (seed: CandidateSeed) => {
    if (!selectedJobId) {
      showError('Chưa chọn job', 'Hãy chọn job trước khi gửi lời mời.');
      return;
    }

    try {
      setIsActionBusy(true);
      const session = await candidateSearchService.connectCandidateToJob(
        seed.candidateId,
        selectedJobId,
      );
      await loadSessions(selectedJobId);
      await pickCandidate(seed, session);
      setActiveTab('chats');
      showSuccess('Đã gửi lời mời', 'Candidate đã được kéo vào pipeline chat đúng job.');
    } catch (error: any) {
      showError('Không thể mời ứng viên', error.message || 'Vui lòng thử lại.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleShortlist = async (seed: CandidateSeed) => {
    if (!selectedJobId) {
      showError('Chưa chọn job', 'Hãy chọn job trước khi shortlist.');
      return;
    }

    try {
      setIsActionBusy(true);
      await candidateSearchService.shortlistCandidate(seed.candidateId, selectedJobId);
      showSuccess('Đã shortlist', `${seed.fullName} đã được lưu vào shortlist cho job này.`);
      await loadDiscoveries(selectedJobId);
    } catch (error: any) {
      showError('Không thể shortlist', error.message || 'Vui lòng thử lại.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleRunAiInsight = async (seed?: CandidateSeed) => {
    const target = seed || selectedCandidate;
    if (!selectedJobId || !target) {
      showError('Thiếu context', 'Hãy chọn cả job và ứng viên trước khi chạy AI insight.');
      return;
    }

    try {
      setIsAiLoading(true);
      const result = await candidateSearchService.getAIMatchExplanation(
        selectedJobId,
        target.candidateId,
      );
      setAiInsight(result);
      if (seed) {
        await pickCandidate(target);
      }
    } catch (error: any) {
      showError('Không thể phân tích AI', error.message || 'Vui lòng kiểm tra gói recruiter.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSession || !messageDraft.trim()) return;

    try {
      setIsSendingMessage(true);
      const message = await recruitmentChatService.sendMessage({
        sessionId: selectedSession.id,
        content: messageDraft.trim(),
        messageType: 'TEXT',
      });
      setChatMessages((current) => [...current, message]);
      setMessageDraft('');
      await loadSessions(selectedJobId);
    } catch (error: any) {
      showError('Không thể gửi tin nhắn', error.message || 'Vui lòng thử lại.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSessionStatus = async (status: RecruitmentSessionStatus) => {
    if (!selectedSession) return;

    try {
      setIsActionBusy(true);
      const updated = await recruitmentChatService.updateSessionStatus(
        selectedSession.id,
        status,
      );
      setSelectedSession(updated);
      await loadSessions(selectedJobId);
      showSuccess('Đã cập nhật pipeline chat', 'Trạng thái conversation đã được đồng bộ.');
    } catch (error: any) {
      showError('Không thể cập nhật chat status', error.message || 'Vui lòng thử lại.');
    } finally {
      setIsActionBusy(false);
    }
  };

  useEffect(() => {
    if (!orderedJobs.length) {
      setSelectedJobId(null);
      return;
    }

    if (!selectedJobId || !orderedJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(orderedJobs[0].id);
    }
  }, [orderedJobs, selectedJobId]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      await loadSubscription();
      if (isMounted) {
        setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedJobId || !subscription) return;

    setApplicants([]);
    setDiscoveries([]);
    setSessions([]);
    setDiscoveryAccessError(null);
    setSelectedSession(null);
    setAiInsight(null);
    syncJobContext(selectedJobId);
  }, [selectedJobId, subscription]);

  useEffect(() => {
    if (!selectedSession?.id) {
      setChatMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsChatLoading(true);
      try {
        const result = await recruitmentChatService.getSessionMessages(selectedSession.id, 0, 50);
        setChatMessages((result.messages || []).reverse());
        await recruitmentChatService.markMessagesAsRead(selectedSession.id).catch(() => undefined);
      } catch (error: any) {
        setChatMessages([]);
        showError('Không thể tải tin nhắn', error.message || 'Vui lòng thử lại');
      } finally {
        setIsChatLoading(false);
      }
    };

    loadMessages();
  }, [selectedSession?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (isBootstrapping) {
    return (
      <div className="rtw-shell rtw-shell--loading">
        <Loader2 size={28} className="rtw-spin" />
        <p>Đang khởi tạo workspace...</p>
      </div>
    );
  }

  if (!orderedJobs.length) {
    return (
      <div className="rtw-shell">
        <section className="rtw-hero rtw-hero--empty">
          <div className="rtw-hero__intro">
            <span className="rtw-badge-pill rtw-badge-pill--gold">
              <Rocket size={13} />
              Sẵn sàng tuyển dụng
            </span>

            <h2 className="rtw-hero__headline">
              Không gian tuyển dụng cao cấp
              <br />
              <span className="rtw-hero__headline--gold">Khu vực nâng cao</span>
            </h2>

            <p className="rtw-hero__desc">
              Khu vực nâng cao giúp bạn quản lý toàn bộ luồng tìm kiếm ứng viên —
              từ pipeline đơn ứng tuyển, khu vực nâng cao, phân tích AI cho đến chat
              trực tiếp theo từng candidate, tất cả trong một màn hình duy nhất.
            </p>

            <div className="rtw-hero__features">
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon"><Users size={18} /></div>
                <div className="rtw-feature-text">
                  <strong>Applicant Pipeline</strong>
                  <span>Theo dõi đơn ứng tuyển theo từng job với trạng thái trực quan</span>
                </div>
              </div>
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon"><Sparkles size={18} /></div>
                <div className="rtw-feature-text">
                  <strong>Phân tích AI</strong>
                  <span>AI phân tích mức độ phù hợp ứng viên với job — dẫn chứng cụ thể</span>
                </div>
              </div>
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon"><FileText size={18} /></div>
                <div className="rtw-feature-text">
                  <strong>Portfolio Review</strong>
                  <span>Xem và đánh giá portfolio, dự án, chứng chỉ của ứng viên ngay trong workspace</span>
                </div>
              </div>
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon"><MessageSquare size={18} /></div>
                <div className="rtw-feature-text">
                  <strong>Contextual Chat</strong>
                  <span>Nhắn tin với ứng viên, gắn đúng job để context luôn rõ ràng</span>
                </div>
              </div>
            </div>

            <div className="rtw-hero__cta">
              <div className="rtw-cta-box">
                <div className="rtw-cta-icon"><Briefcase size={24} /></div>
                <div className="rtw-cta-content">
                  <strong>Đăng job đầu tiên để bắt đầu</strong>
                  <span>Tạo việc ngắn hạn hoặc dài hạn, workspace sẽ tự động kích hoạt toàn bộ luồng tuyển dụng cho bạn.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rtw-hero__aside">
            <div className="rtw-aside-card">
              <div className="rtw-aside-card__header">
                <Crown size={16} />
                <span>Bạn đang dùng</span>
              </div>
              <div className="rtw-aside-card__plan">
                {subscription?.planDisplayName || 'Free tier'}
              </div>
              <div className="rtw-aside-card__perks">
                <div className="rtw-perk-item"><CheckCircle2 size={13} /><span>Quản lý job &amp; ứng viên</span></div>
                <div className="rtw-perk-item"><CheckCircle2 size={13} /><span>AI phân tích matching</span></div>
                <div className="rtw-perk-item"><CheckCircle2 size={13} /><span>Chat &amp; portfolio review</span></div>
                <div className="rtw-perk-item"><CheckCircle2 size={13} /><span>Boost visibility cho job</span></div>
              </div>
            </div>

            <div className="rtw-aside-card rtw-aside-card--stats">
              <div className="rtw-aside-stat">
                <span className="rtw-aside-stat__num">0</span>
                <span className="rtw-aside-stat__label">Job đang tuyển</span>
              </div>
              <div className="rtw-aside-stat">
                <span className="rtw-aside-stat__num">0</span>
                <span className="rtw-aside-stat__label">Ứng viên</span>
              </div>
              <div className="rtw-aside-stat">
                <span className="rtw-aside-stat__num">0</span>
                <span className="rtw-aside-stat__label">Cuộc trò chuyện</span>
              </div>
            </div>

            <div className="rtw-aside-card rtw-aside-card--tip">
              <div className="rtw-tip-icon"><Zap size={15} /></div>
              <p>
                <strong>Mẹo nhanh:</strong> Việc ngắn hạn (freelance/gig) với mô tả rõ ràng,
                ngân sách minh bạch và thời hạn cụ thể sẽ thu hút ứng viên chất lượng cao nhất.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="rtw-shell">
      {/* TIER 1: HERO BANNER */}
      <section className="rtw-hero">
        <div className="rtw-hero__intro">
          <span className="rtw-panel__eyebrow" style={{ marginBottom: '0.35rem' }}>
            <Crown size={12} />
            Khu vực nâng cao — Recruiter Talent Hub
          </span>
          <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, var(--rtw-cyan), transparent)', borderRadius: 999, opacity: 0.4 }} />
          <h2>
            Quản lý toàn bộ luồng tuyển dụng
            <br />
            <span className="rtw-hero__headline--gold">trong một workspace</span>
          </h2>
          <div className="rtw-hero__chips">
            <span className="rtw-chip rtw-chip--gold">
              <Crown size={13} />
              {subscription?.planDisplayName || 'Free tier'}
            </span>
            <span className="rtw-chip rtw-chip--purple">
              <Sparkles size={13} />
              {subscription?.canUseAICandidateSuggestion ? 'AI phân tích bật' : 'AI phân tích khóa'}
            </span>
            <span className="rtw-chip rtw-chip--muted">
              <ShieldCheck size={13} />
              {subscription?.hasCandidateDatabaseAccess ? 'Cơ sở ứng viên' : 'Cần nâng cấp'}
            </span>
          </div>
        </div>

        <div className="rtw-metric-grid">
          <article className="rtw-metric">
            <span className="rtw-metric__label">Job đang mở</span>
            <strong>{openJobCount}</strong>
            <span className="rtw-metric__hint">Sẵn sàng tuyển</span>
          </article>
          <article className="rtw-metric">
            <span className="rtw-metric__label">Tổng ứng viên</span>
            <strong>{totalApplicantCount}</strong>
            <span className="rtw-metric__hint">Toàn bộ pipeline</span>
          </article>
          <article className="rtw-metric">
            <span className="rtw-metric__label">Cuộc trò chuyện</span>
            <strong>{sessions.length}</strong>
            <span className="rtw-metric__hint">Chat đang diễn ra</span>
          </article>
          <article className="rtw-metric">
            <span className="rtw-metric__label">Boost quota</span>
            <strong>{subscription?.jobBoostRemaining ?? 0}</strong>
            <span className="rtw-metric__hint">Lần boost còn lại</span>
          </article>
        </div>
      </section>

      {/* JOB BAR — HORIZONTAL SELECTOR */}
      <div className="rtw-job-bar">
        {/* Selected job summary */}
        <div className="rtw-job-bar__selected">
          <div className="rtw-job-bar__selected-icon">
            <Target size={18} />
          </div>
          <div className="rtw-job-bar__selected-info">
            <h3>{selectedJob?.title || 'Chưa chọn job'}</h3>
            <div className="rtw-job-bar__selected-meta">
              {selectedJob && (
                <>
                  <span className={`rtw-status-pill rtw-status-pill--${selectedJob.status.toLowerCase()}`}>
                    {getJobStatusLabel(selectedJob.status)}
                  </span>
                  <span className="rtw-inline-stat">
                    <Users size={12} />
                    {selectedJob.applicantCount || 0} ứng tuyển
                  </span>
                  <span className="rtw-inline-stat">
                    <Wallet size={12} />
                    {formatCompactCurrency(selectedJob.minBudget)} — {formatCompactCurrency(selectedJob.maxBudget)}
                  </span>
                  <span className="rtw-inline-stat">
                    <Calendar size={12} />
                    {formatShortDate(selectedJob.deadline)}
                  </span>
                </>
              )}
            </div>
            {selectedJob && (
              <div className="rtw-job-bar__selected-tags">
                {(selectedJob.requiredSkills || []).slice(0, 4).map((skill) => (
                  <span key={skill} className="rtw-skill-pill rtw-skill-pill--gold">{skill}</span>
                ))}
                {(selectedJob.requiredSkills || []).length > 4 && (
                  <span className="rtw-skill-pill">+{selectedJob.requiredSkills.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Job roster */}
        <div className="rtw-job-bar__roster">
          {orderedJobs.map((job) => (
            <button
              key={job.id}
              className={`rtw-job-bar__roster-item ${job.id === selectedJobId ? 'rtw-job-bar__roster-item--active' : ''}`}
              onClick={() => setSelectedJobId(job.id)}
            >
              <strong>{job.title}</strong>
              <span className={`rtw-status-pill rtw-status-pill--${job.status.toLowerCase()}`} style={{ fontSize: '0.62rem' }}>
                {getJobStatusLabel(job.status)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* TIER 2: WORKSPACE GRID */}
      <div className="rtw-grid">
        {/* COL 1: MAIN PIPELINE — TABS */}
        <section className="rtw-column">
          <div className="rtw-panel">
            {/* Tab Navigation */}
            <div className="rtw-tabs">
              <button
                className={`rtw-tab ${activeTab === 'applicants' ? 'rtw-tab--active' : ''}`}
                onClick={() => setActiveTab('applicants')}
              >
                <Inbox size={15} />
                Applicants
                {applicants.length > 0 && (
                  <span style={{ marginLeft: '0.25rem', padding: '0.08rem 0.35rem', borderRadius: '999px', background: 'rgba(212,175,55,0.15)', color: '#f0d060', fontSize: '0.68rem', fontWeight: 700 }}>
                    {applicants.length}
                  </span>
                )}
              </button>
              <button
                className={`rtw-tab ${activeTab === 'advanced' ? 'rtw-tab--active' : ''}`}
                onClick={() => setActiveTab('advanced')}
              >
                <Settings2 size={15} />
                Nâng cao
                {discoveries.length > 0 && (
                  <span style={{ marginLeft: '0.25rem', padding: '0.08rem 0.35rem', borderRadius: '999px', background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', fontSize: '0.68rem', fontWeight: 700 }}>
                    {discoveries.length}
                  </span>
                )}
              </button>
              <button
                className={`rtw-tab ${activeTab === 'chats' ? 'rtw-tab--active' : ''}`}
                onClick={() => setActiveTab('chats')}
              >
                <MessageSquare size={15} />
                Chats
                {sessions.length > 0 && (
                  <span style={{ marginLeft: '0.25rem', padding: '0.08rem 0.35rem', borderRadius: '999px', background: 'rgba(74,222,128,0.12)', color: '#86efac', fontSize: '0.68rem', fontWeight: 700 }}>
                    {sessions.length}
                  </span>
                )}
              </button>
            </div>

            {/* === APPLICANTS TAB === */}
            {activeTab === 'applicants' && (
              <div className="rtw-feed">
                <div className="rtw-feed__intro">
                  <div>
                    <span className="rtw-panel__eyebrow"><Inbox size={11} />Applicant Pipeline</span>
                    <h3>{selectedJob?.title}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="rtw-status-pill rtw-status-pill--open">
                      {filteredApplicants.length} ứng viên
                    </span>
                  </div>
                </div>

                {/* Filter chips */}
                <div className="rtw-tabs" style={{ gap: '0.4rem' }}>
                  <button
                    className={`rtw-chip-btn ${applicantFilter === 'all' ? 'rtw-tab--active' : ''}`}
                    onClick={() => setApplicantFilter('all')}
                  >
                    Tất cả ({applicants.length})
                  </button>
                  <button
                    className={`rtw-chip-btn ${applicantFilter === 'pending' ? 'rtw-tab--active' : ''}`}
                    onClick={() => setApplicantFilter('pending')}
                  >
                    Chờ duyệt ({applicants.filter((a) => a.status === 'PENDING' || a.status === 'REVIEWED').length})
                  </button>
                  <button
                    className={`rtw-chip-btn ${applicantFilter === 'accepted' ? 'rtw-tab--active' : ''}`}
                    onClick={() => setApplicantFilter('accepted')}
                  >
                    Đã duyệt ({applicants.filter((a) => a.status === 'ACCEPTED').length})
                  </button>
                  <button
                    className={`rtw-chip-btn ${applicantFilter === 'rejected' ? 'rtw-tab--active' : ''}`}
                    onClick={() => setApplicantFilter('rejected')}
                  >
                    Từ chối ({applicants.filter((a) => a.status === 'REJECTED').length})
                  </button>
                </div>

                {isApplicantsLoading ? (
                  <div className="rtw-loading-block">
                    <Loader2 size={22} className="rtw-spin" />
                    <span>Đang tải applicant...</span>
                  </div>
                ) : filteredApplicants.length === 0 ? (
                  <div className="rtw-empty-state">
                    <Users size={24} style={{ color: '#d4af37', opacity: 0.5 }} />
                    <div>
                      <strong>Không có ứng viên nào trong nhóm này</strong>
                      <p>Thử chọn bộ lọc khác hoặc boost job để thu hút thêm ứng viên.</p>
                    </div>
                  </div>
                ) : (
                  filteredApplicants.map((application) => {
                    const seed: CandidateSeed = {
                      candidateId: application.userId,
                      fullName: getApplicantDisplayName(application.userFullName, application.userEmail),
                      professionalTitle: application.userProfessionalTitle,
                      avatarUrl: application.userAvatar,
                      portfolioSlug: application.portfolioSlug,
                      email: application.userEmail,
                      sourceLabel: 'Ứng viên đã apply',
                    };

                    return (
                      <article
                        key={application.id}
                        className={`rtw-card ${selectedCandidate?.candidateId === application.userId ? 'rtw-card--active' : ''}`}
                        onClick={() => pickCandidate(seed)}
                      >
                        <div className="rtw-card__header">
                          <div className="rtw-identity">
                            {application.userAvatar ? (
                              <img src={resolveAssetUrl(application.userAvatar)} alt="" className="rtw-avatar" />
                            ) : (
                              <div className="rtw-avatar rtw-avatar--fallback">
                                {getApplicantInitials(application.userFullName, application.userEmail)}
                              </div>
                            )}
                            <div>
                              <h4>{getApplicantDisplayName(application.userFullName, application.userEmail)}</h4>
                              <p>{getApplicantSubtitle(application.userProfessionalTitle, Boolean(application.portfolioSlug))}</p>
                            </div>
                          </div>
                          <span className={`rtw-status-pill rtw-status-pill--${application.status.toLowerCase()}`}>
                            {getApplicationStatusLabel(application.status)}
                          </span>
                        </div>

                        <p className="rtw-card__body">
                          {application.coverLetter || 'Ứng viên chưa để lại cover letter.'}
                        </p>

                        <div className="rtw-card__meta">
                          <span><Clock3 size={12} />{formatRelativeTime(application.appliedAt)}</span>
                          <span><Wallet size={12} />{formatCompactCurrency(application.minBudget)} — {formatCompactCurrency(application.maxBudget)}</span>
                        </div>

                        <div className="rtw-card__actions">
                          <button
                            className="rtw-chip-btn"
                            title="Xem dossier"
                            onClick={(e) => { e.stopPropagation(); pickCandidate(seed); }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="rtw-chip-btn"
                            title="Nhắn tin"
                            onClick={(e) => { e.stopPropagation(); openChatWithCandidate(seed, 'PROFILE_VIEW'); }}
                          >
                            <MessageSquare size={14} />
                          </button>
                          {application.status === 'PENDING' && (
                            <button
                              className="rtw-chip-btn"
                              title="Đánh dấu đã xem"
                              onClick={(e) => { e.stopPropagation(); handleReviewApplication(application); }}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          {(application.status === 'PENDING' || application.status === 'REVIEWED') && (
                            <>
                              <button
                                className="rtw-chip-btn rtw-chip-btn--success"
                                title="Duyệt ứng viên"
                                onClick={(e) => { e.stopPropagation(); setDecisionModal({ application, status: 'ACCEPTED' }); setDecisionNote(''); }}
                              >
                                <CheckCircle2 size={14} />
                              </button>
                              <button
                                className="rtw-chip-btn rtw-chip-btn--danger"
                                title="Loại ứng viên"
                                onClick={(e) => { e.stopPropagation(); setDecisionModal({ application, status: 'REJECTED' }); setDecisionNote(''); }}
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {/* === NÂNG CAO (ADVANCED) TAB === */}
            {activeTab === 'advanced' && (
              <div className="rtw-feed">
                <div className="rtw-feed__intro">
                  <div>
                    <span className="rtw-panel__eyebrow"><Settings2 size={11} />Khu vực nâng cao</span>
                    <h3>Tìm &amp; kết nối ứng viên</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {discoveries.length > 0 && (
                      <span className="rtw-status-pill">
                        {discoveries.length} ứng viên
                      </span>
                    )}
                    <button className="rtw-ghost-btn" onClick={() => selectedJobId && loadDiscoveries(selectedJobId, true)}>
                      <RefreshCw size={13} />
                      Làm mới
                    </button>
                  </div>
                </div>

                {!subscription?.hasCandidateDatabaseAccess ? (
                  <div className="rtw-empty-state">
                    <Crown size={24} style={{ color: '#d4af37', opacity: 0.6 }} />
                    <div>
                      <strong>Cần nâng cấp gói Recruiter</strong>
                      <p>Truy cập cơ sở ứng viên để sử dụng khu vực nâng cao. Liên hệ để biết thêm chi tiết.</p>
                    </div>
                  </div>
                ) : discoveryAccessError ? (
                  <div className="rtw-empty-state">
                    <Crown size={24} style={{ color: '#d4af37', opacity: 0.6 }} />
                    <div>
                      <strong>{discoveryAccessError}</strong>
                      <p>Vui lòng nâng cấp gói Recruiter để sử dụng tính năng này.</p>
                    </div>
                  </div>
                ) : isDiscoveryLoading ? (
                  <div className="rtw-loading-block">
                    <Loader2 size={22} className="rtw-spin" />
                    <span>Đang quét cơ sở ứng viên...</span>
                  </div>
                ) : discoveries.length === 0 ? (
                  <div className="rtw-empty-state">
                    <Search size={24} style={{ color: '#d4af37', opacity: 0.5 }} />
                    <div>
                      <strong>Chưa có ứng viên phù hợp</strong>
                      <p>Danh sách ứng viên khả dụng trong cơ sở dữ liệu. Boost job để tăng visibility.</p>
                    </div>
                  </div>
                ) : (
                  discoveries.map((candidate) => {
                    const seed: CandidateSeed = {
                      candidateId: candidate.userId,
                      fullName: candidate.fullName,
                      professionalTitle: candidate.professionalTitle,
                      avatarUrl: candidate.avatarUrl,
                      portfolioSlug: candidate.customUrlSlug,
                      matchScore: candidate.matchScore,
                      matchQuality: candidate.matchQuality,
                      sourceLabel: 'Khu vực nâng cao',
                    };

                    const matchPct = Math.round((candidate.matchScore || 0) * 100);
                    const matchColor = matchPct >= 80 ? '#4ade80' : matchPct >= 60 ? '#f0d060' : matchPct >= 40 ? '#fbbf24' : '#f87171';

                    return (
                      <article
                        key={candidate.userId}
                        className={`rtw-card ${selectedCandidate?.candidateId === candidate.userId ? 'rtw-card--active' : ''}`}
                        onClick={() => pickCandidate(seed)}
                      >
                        <div className="rtw-card__header">
                          <div className="rtw-identity">
                            {candidate.avatarUrl ? (
                              <img src={resolveAssetUrl(candidate.avatarUrl)} alt="" className="rtw-avatar" />
                            ) : (
                              <div className="rtw-avatar rtw-avatar--fallback">
                                {candidate.fullName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h4>{candidate.fullName}</h4>
                              <p>{candidate.professionalTitle || 'Talent profile'}</p>
                            </div>
                          </div>
                          <div className="rtw-score-pill" style={{ borderColor: `${matchColor}40`, background: `${matchColor}15`, color: matchColor }}>
                            <Star size={12} />
                            {matchPct}%
                          </div>
                        </div>

                        <div className="rtw-skill-row" style={{ gap: '0.35rem' }}>
                          {parseSkillList(candidate.topSkills).slice(0, 5).map((skill) => (
                            <span key={`${candidate.userId}-${skill}`} className="rtw-skill-pill" style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}>
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="rtw-card__meta">
                          <span><Wallet size={12} />{formatCompactCurrency(candidate.hourlyRate, candidate.preferredCurrency)}/giờ</span>
                          <span><Award size={12} />{candidate.totalProjects || 0} dự án</span>
                        </div>

                        <div className="rtw-card__actions">
                          <button
                            className="rtw-chip-btn"
                            title="AI phân tích"
                            onClick={(e) => { e.stopPropagation(); handleRunAiInsight(seed); }}
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            className="rtw-chip-btn"
                            title="Shortlist"
                            onClick={(e) => { e.stopPropagation(); handleShortlist(seed); }}
                          >
                            <Target size={14} />
                          </button>
                          <button
                            className="rtw-chip-btn"
                            title="Nhắn tin"
                            onClick={(e) => { e.stopPropagation(); openChatWithCandidate(seed, 'PROFILE_VIEW'); }}
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            className="rtw-chip-btn rtw-chip-btn--success"
                            title="Mời ứng tuyển"
                            onClick={(e) => { e.stopPropagation(); inviteCandidateToJob(seed); }}
                          >
                            <Rocket size={14} />
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {/* === CHATS TAB === */}
            {activeTab === 'chats' && (
              <div className="rtw-feed">
                <div className="rtw-feed__intro">
                  <div>
                    <span className="rtw-panel__eyebrow"><MessageSquare size={11} />Recruitment Conversations</span>
                    <h3>Chat theo context ứng viên</h3>
                  </div>
                  {sessions.length > 0 && (
                    <span className="rtw-status-pill">
                      {sessions.length} cuộc trò chuyện
                    </span>
                  )}
                </div>

                {isSessionsLoading ? (
                  <div className="rtw-loading-block">
                    <Loader2 size={22} className="rtw-spin" />
                    <span>Đang tải conversations...</span>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="rtw-empty-state">
                    <MessageSquare size={24} style={{ color: '#d4af37', opacity: 0.5 }} />
                    <div>
                      <strong>Chưa có conversation cho job này</strong>
                      <p>Bắt đầu chat từ applicant hoặc khu vực nâng cao để context được lưu lại.</p>
                    </div>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <article
                      key={session.id}
                      className={`rtw-card ${selectedSession?.id === session.id ? 'rtw-card--active' : ''}`}
                      onClick={() =>
                        pickCandidate(
                          {
                            candidateId: session.candidateId,
                            fullName: session.candidateFullName,
                            professionalTitle: session.candidateTitle,
                            avatarUrl: session.candidateAvatar,
                            sourceLabel: 'Recruitment chat',
                          },
                          session,
                        )
                      }
                    >
                      <div className="rtw-card__header">
                        <div className="rtw-identity">
                          {session.candidateAvatar ? (
                            <img src={resolveAssetUrl(session.candidateAvatar)} alt="" className="rtw-avatar" />
                          ) : (
                            <div className="rtw-avatar rtw-avatar--fallback">
                              {session.candidateFullName?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4>{session.candidateFullName}</h4>
                            <p>{session.jobTitle || 'Chưa gắn job'}</p>
                          </div>
                        </div>
                        <span className={`rtw-status-pill rtw-status-pill--chat-${session.status.toLowerCase()}`}>
                          {getSessionStatusLabel(session.status)}
                        </span>
                      </div>

                      <p className="rtw-card__body">
                        {session.lastMessagePreview || 'Chưa có tin nhắn nào.'}
                      </p>

                      <div className="rtw-card__meta">
                        <span><Clock3 size={12} />{formatRelativeTime(session.lastMessageAt || session.createdAt)}</span>
                        {session.unreadCount ? (
                          <span style={{ color: '#f0d060' }}>
                            <MessageSquare size={12} />{session.unreadCount} chưa đọc
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {/* DOSSIER / INTEL PANEL — BELOW PIPELINE */}
        <section className="rtw-column">
          <div className="rtw-panel rtw-panel--premium">
            <div className="rtw-panel__header">
              <div>
                <span className="rtw-panel__eyebrow">
                  <Star size={11} />
                  Candidate Dossier
                </span>
                <h3>{selectedCandidate?.fullName || 'Chọn ứng viên để xem'}</h3>
              </div>
              {selectedCandidate && (
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button
                    className="rtw-chip-btn rtw-chip-btn--cyan"
                    title="Mở portfolio"
                    onClick={openPortfolioExternally}
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {!selectedCandidate ? (
              <div className="rtw-empty-state">
                <Users size={24} style={{ color: '#d4af37', opacity: 0.4 }} />
                <div>
                  <strong>Chưa chọn ứng viên</strong>
                  <p>Chọn một applicant hoặc ứng viên từ khu vực nâng cao để xem dossier chi tiết.</p>
                </div>
              </div>
            ) : (
              <div className="rtw-dossier-strip">
                {/* ── TOP ROW: Hero compact (3 cols) ── */}
                {isPortfolioLoading ? (
                  <div className="rtw-loading-block rtw-dossier-loading">
                    <Loader2 size={20} className="rtw-spin" />
                    <span>Đang tải hồ sơ...</span>
                  </div>
                ) : portfolioError ? (
                  <div className="rtw-empty-state">
                    <Users size={20} style={{ color: '#f87171', opacity: 0.6 }} />
                    <div>
                      <strong>Không thể tải hồ sơ</strong>
                      <p>{portfolioError}</p>
                    </div>
                  </div>
                ) : portfolioProfile ? (
                  <>
                    <div className="rtw-dossier-hero-compact">
                      {/* Col 1: Identity */}
                      <div className="rtw-dossier-identity">
                        <img
                          src={resolveAssetUrl(portfolioProfile.portfolioAvatarUrl || portfolioProfile.basicAvatarUrl || selectedCandidate.avatarUrl)}
                          alt=""
                          className="rtw-dossier-avatar"
                        />
                        <div className="rtw-dossier-identity__info">
                          <strong className="rtw-dossier-name">
                            {portfolioProfile.fullName || selectedCandidate.fullName}
                          </strong>
                          <span className="rtw-dossier-title">
                            {portfolioProfile.professionalTitle || selectedCandidate.professionalTitle || 'Talent'}
                          </span>
                          <div className="rtw-dossier-identity__stats">
                            {selectedCandidate.matchScore && (
                              <span className="rtw-dossier-match">
                                <Star size={11} fill="currentColor" />
                                {Math.round(selectedCandidate.matchScore * 100)}% match
                              </span>
                            )}
                            <span className="rtw-dossier-stat">
                              <Briefcase size={11} />
                              {portfolioProfile.yearsOfExperience !== undefined ? `${portfolioProfile.yearsOfExperience}y` : '—'}
                            </span>
                            <span className="rtw-dossier-stat">
                              <FileText size={11} />
                              {portfolioProfile.totalProjects || portfolioProjects.length} proj
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Bio + Skills */}
                      <div className="rtw-dossier-bio-skills">
                        <div className="rtw-dossier-bio">
                          <p>
                            {portfolioProfile.tagline || portfolioProfile.careerGoals || portfolioProfile.basicBio || 'Chưa có tóm tắt công khai.'}
                          </p>
                        </div>
                        {currentPortfolioSkills.length > 0 && (
                          <div className="rtw-dossier-skills-row">
                            {currentPortfolioSkills.map((skill) => (
                              <span key={skill} className="rtw-skill-pill rtw-skill-pill--gold">{skill}</span>
                            ))}
                          </div>
                        )}
                        <div className="rtw-dossier-meta-row">
                          <span><Wallet size={11} />{formatCompactCurrency(portfolioProfile.hourlyRate, portfolioProfile.preferredCurrency)}/giờ</span>
                          <span><MapPin size={11} />{portfolioProfile.location || '—'}</span>
                          <span><ShieldCheck size={11} />{portfolioProfile.availabilityStatus || '—'}</span>
                        </div>
                      </div>

                      {/* Col 3: AI Summary + Actions */}
                      <div className="rtw-dossier-actions-col">
                        {aiInsight && (
                          <div className="rtw-dossier-ai-summary">
                            <div className="rtw-dossier-ai-confidence">
                              <span>Độ tự tin AI</span>
                              <span className="rtw-dossier-ai-score">
                                {aiInsight.confidence != null ? `${Math.round(aiInsight.confidence * 100)}%` : '—'}
                              </span>
                            </div>
                            <div className="rtw-dossier-ai-bar">
                              <div
                                className="rtw-dossier-ai-bar__fill"
                                style={{ width: aiInsight.confidence != null ? `${Math.round(aiInsight.confidence * 100)}%` : '0%' }}
                              />
                            </div>
                          </div>
                        )}

                        {isAiLoading && !aiInsight && (
                          <div className="rtw-dossier-ai-loading">
                            <Loader2 size={14} className="rtw-spin" />
                            <span>AI đang phân tích...</span>
                          </div>
                        )}

                        <div className="rtw-dossier-cta">
                          <button
                            className="rtw-primary-btn"
                            disabled={isActionBusy}
                            onClick={() => openChatWithCandidate(selectedCandidate, 'PROFILE_VIEW')}
                          >
                            <MessageSquare size={14} />
                            Chat ngay
                          </button>
                          <button
                            className="rtw-secondary-btn"
                            disabled={isAiLoading}
                            onClick={() => handleRunAiInsight()}
                          >
                            {isAiLoading ? <Loader2 size={14} className="rtw-spin" /> : <Sparkles size={14} />}
                            AI phân tích
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AI INSIGHT — Premium Rendered */}
                    {aiInsight && <AIInsightRenderer insight={aiInsight} />}

                    {/* ── BOTTOM ROW: Projects | Certificates | Reviews ── */}
                    <div className="rtw-dossier-bottom-row">
                      {/* Projects */}
                      <div className="rtw-dossier-section-card">
                        <div className="rtw-dossier-section-card__header">
                          <FileText size={13} />
                          <strong>Dự án nổi bật</strong>
                          <span className="rtw-dossier-count">{portfolioProjects.length}</span>
                        </div>
                        <div className="rtw-dossier-project-list">
                          {portfolioProjects.slice(0, 3).map((project) => (
                            <div key={project.id || project.title} className="rtw-dossier-project-item">
                              <strong>{project.title}</strong>
                              <p>{project.description?.slice(0, 100)}{project.description?.length > 100 ? '…' : ''}</p>
                              {(project.tools?.length ?? 0) > 0 && (
                                <div className="rtw-dossier-tech-row">
                                  {(project.tools ?? []).slice(0, 4).map((t: string) => (
                                    <span key={t} className="rtw-skill-pill rtw-skill-pill--subtle">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {portfolioProjects.length === 0 && (
                            <p className="rtw-dossier-empty">Chưa có dự án công khai.</p>
                          )}
                        </div>
                      </div>

                      {/* Certificates */}
                      <div className="rtw-dossier-section-card">
                        <div className="rtw-dossier-section-card__header">
                          <CheckCircle2 size={13} />
                          <strong>Chứng chỉ</strong>
                          <span className="rtw-dossier-count">{portfolioCertificates.length}</span>
                        </div>
                        <div className="rtw-dossier-cert-list">
                          {portfolioCertificates.slice(0, 3).map((cert) => (
                            <div key={cert.id || cert.title} className="rtw-dossier-cert-item">
                              <strong>{cert.title}</strong>
                              <span>{cert.issuingOrganization}</span>
                              {cert.issueDate && (
                                <span className="rtw-dossier-date">
                                  <Clock3 size={10} />{new Date(cert.issueDate).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          ))}
                          {portfolioCertificates.length === 0 && (
                            <p className="rtw-dossier-empty">Chưa có chứng chỉ công khai.</p>
                          )}
                        </div>
                      </div>

                      {/* Reviews */}
                      <div className="rtw-dossier-section-card">
                        <div className="rtw-dossier-section-card__header">
                          <Star size={13} />
                          <strong>Mentor Reviews</strong>
                          <span className="rtw-dossier-count">{portfolioReviews.length}</span>
                        </div>
                        <div className="rtw-dossier-review-list">
                          {portfolioReviews.slice(0, 2).map((review) => (
                            <div key={review.id || review.mentorName} className="rtw-dossier-review-item">
                              <div className="rtw-dossier-review-item__header">
                                <strong>{review.mentorName}</strong>
                                {review.rating != null && (() => {
                                  const r = review.rating as number;
                                  return (
                                    <div className="rtw-dossier-stars">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                          key={s}
                                          size={10}
                                          fill={s <= r ? '#d4af37' : 'transparent'}
                                          stroke={s <= r ? '#d4af37' : '#6b6b6b'}
                                        />
                                      ))}
                                      <span>{r.toFixed(1)}</span>
                                    </div>
                                  );
                                })()}
                              </div>
                              <p>{review.feedback}</p>
                            </div>
                          ))}
                          {portfolioReviews.length === 0 && (
                            <p className="rtw-dossier-empty">Chưa có review công khai.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* DECISION MODAL */}
      {decisionModal && (
        <div className="rtw-modal-backdrop" onClick={() => setDecisionModal(null)}>
          <div className="rtw-modal" onClick={(event) => event.stopPropagation()}>
            <span className="rtw-panel__eyebrow">
              {decisionModal.status === 'ACCEPTED' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {decisionModal.status === 'ACCEPTED' ? 'Duyệt applicant' : 'Loại applicant'}
            </span>
            <h3>{decisionModal.application.userFullName}</h3>
            <p>
              {decisionModal.status === 'ACCEPTED'
                ? 'Nhập lời nhắn để candidate nhận email và biết bước tiếp theo.'
                : 'Nhập lý do để recruiter history và email phản hồi nhất quán.'}
            </p>
            <textarea
              className="rtw-textarea"
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder={
                decisionModal.status === 'ACCEPTED'
                  ? 'Ví dụ: Portfolio phù hợp, mời bạn vào vòng interview...'
                  : 'Ví dụ: Kỹ năng hiện tại chưa khớp với yêu cầu job...'
              }
            />
            <div className="rtw-modal__actions">
              <button className="rtw-secondary-btn" onClick={() => setDecisionModal(null)}>Huỷ</button>
              <button className="rtw-primary-btn" disabled={isActionBusy} onClick={handleConfirmDecision}>
                {isActionBusy ? <Loader2 size={14} className="rtw-spin" /> : <CheckCircle2 size={14} />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterTalentWorkspace;
