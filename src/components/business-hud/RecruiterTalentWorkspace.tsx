import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import {
  AICandidateMatchResponse,
  CandidateSearchResult,
  ExternalCertificateDTO,
  MentorReviewDTO,
  PortfolioProjectDTO,
  RecruitmentMessageResponse,
  RecruitmentJobContextType,
  RecruitmentSessionResponse,
  RecruitmentSessionStatus,
  UserProfileDTO,
} from '../../data/portfolioDTOs';
import { JobApplicationResponse, JobApplicationStatus, JobPostingResponse, JobStatus } from '../../data/jobDTOs';
import candidateSearchService from '../../services/candidateSearchService';
import jobService from '../../services/jobService';
import portfolioService from '../../services/portfolioService';
import shortTermJobService from '../../services/shortTermJobService';
import recruiterSubscriptionService, {
  RecruiterSubscriptionInfoResponse,
} from '../../services/recruiterSubscriptionService';
import recruitmentChatService from '../../services/recruitmentChatService';
import JobBoostButton from './JobBoostButton';
import {
  ShortTermApplicationResponse,
  ShortTermApplicationStatus,
  ShortTermJobResponse,
  ShortTermJobStatus,
} from '../../types/ShortTermJob';
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
  fullTimeJobs: JobPostingResponse[];
  shortTermJobs: ShortTermJobResponse[];
}

type WorkspaceJobKind = 'fulltime' | 'shortterm';

type WorkspaceJob = {
  key: string;
  id: number;
  kind: WorkspaceJobKind;
  title: string;
  status: string;
  statusLabel: string;
  statusTone: string;
  applicantCount: number;
  requiredSkills: string[];
  deadline?: string;
  location?: string | null;
  isRemote?: boolean;
  budgetLabel: string;
  subLabel: string;
  raw: JobPostingResponse | ShortTermJobResponse;
};

type WorkspaceApplicant = {
  id: number;
  kind: WorkspaceJobKind;
  userId: number;
  userFullName: string;
  userEmail?: string;
  userAvatar?: string;
  userProfessionalTitle?: string;
  portfolioSlug?: string;
  coverLetter?: string | null;
  status: string;
  statusLabel: string;
  statusTone: string;
  appliedAt?: string;
  budgetLabel: string;
  canMarkReviewed: boolean;
  canAccept: boolean;
  canReject: boolean;
  raw: JobApplicationResponse | ShortTermApplicationResponse;
};

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

const getFullTimeJobStatusTone = (status: JobStatus): string => {
  switch (status) {
    case JobStatus.OPEN:
      return 'open';
    case JobStatus.IN_PROGRESS:
    case JobStatus.PENDING_APPROVAL:
      return 'pending';
    case JobStatus.REJECTED:
      return 'rejected';
    case JobStatus.CLOSED:
      return 'closed';
    default:
      return 'pending';
  }
};

const getFullTimeApplicationTone = (status: JobApplicationResponse['status']): string => {
  switch (status) {
    case 'ACCEPTED':
      return 'accepted';
    case 'REJECTED':
      return 'rejected';
    case 'PENDING':
    case 'REVIEWED':
    default:
      return 'pending';
  }
};

const getShortTermJobStatusLabel = (status: ShortTermJobStatus): string => {
  switch (status) {
    case ShortTermJobStatus.DRAFT: return 'Bản nháp';
    case ShortTermJobStatus.PENDING_APPROVAL: return 'Chờ duyệt';
    case ShortTermJobStatus.PUBLISHED: return 'Đang hiển thị';
    case ShortTermJobStatus.APPLIED: return 'Đã có apply';
    case ShortTermJobStatus.IN_PROGRESS: return 'Đang thực hiện';
    case ShortTermJobStatus.SUBMITTED: return 'Đã bàn giao';
    case ShortTermJobStatus.UNDER_REVIEW: return 'Đang xem xét';
    case ShortTermJobStatus.APPROVED: return 'Đã duyệt';
    case ShortTermJobStatus.REJECTED: return 'Bị từ chối';
    case ShortTermJobStatus.COMPLETED: return 'Hoàn thành';
    case ShortTermJobStatus.PAID: return 'Đã thanh toán';
    case ShortTermJobStatus.CANCELLED: return 'Đã hủy';
    case ShortTermJobStatus.DISPUTED: return 'Đang tranh chấp';
    case ShortTermJobStatus.CLOSED: return 'Đã đóng';
    default: return status;
  }
};

const getShortTermJobStatusTone = (status: ShortTermJobStatus): string => {
  switch (status) {
    case ShortTermJobStatus.PUBLISHED:
    case ShortTermJobStatus.APPLIED:
    case ShortTermJobStatus.IN_PROGRESS:
    case ShortTermJobStatus.APPROVED:
    case ShortTermJobStatus.COMPLETED:
    case ShortTermJobStatus.PAID:
      return 'open';
    case ShortTermJobStatus.DRAFT:
    case ShortTermJobStatus.PENDING_APPROVAL:
    case ShortTermJobStatus.SUBMITTED:
    case ShortTermJobStatus.UNDER_REVIEW:
      return 'pending';
    case ShortTermJobStatus.REJECTED:
    case ShortTermJobStatus.CANCELLED:
    case ShortTermJobStatus.DISPUTED:
      return 'rejected';
    case ShortTermJobStatus.CLOSED:
      return 'closed';
    default:
      return 'pending';
  }
};

const getShortTermApplicationStatusLabel = (status: ShortTermApplicationStatus): string => {
  switch (status) {
    case ShortTermApplicationStatus.PENDING: return 'Chờ duyệt';
    case ShortTermApplicationStatus.ACCEPTED: return 'Đã chọn';
    case ShortTermApplicationStatus.REJECTED: return 'Từ chối';
    case ShortTermApplicationStatus.WORKING:
    case ShortTermApplicationStatus.IN_PROGRESS:
      return 'Đang làm';
    case ShortTermApplicationStatus.SUBMITTED: return 'Đã bàn giao';
    case ShortTermApplicationStatus.REVISION_REQUIRED: return 'Cần chỉnh sửa';
    case ShortTermApplicationStatus.APPROVED: return 'Đã duyệt';
    case ShortTermApplicationStatus.COMPLETED: return 'Hoàn thành';
    case ShortTermApplicationStatus.PAID: return 'Đã thanh toán';
    case ShortTermApplicationStatus.CANCELLED: return 'Đã hủy';
    case ShortTermApplicationStatus.WITHDRAWN: return 'Rút đơn';
    default: return status;
  }
};

const getShortTermApplicationTone = (status: ShortTermApplicationStatus): string => {
  switch (status) {
    case ShortTermApplicationStatus.ACCEPTED:
    case ShortTermApplicationStatus.WORKING:
    case ShortTermApplicationStatus.IN_PROGRESS:
    case ShortTermApplicationStatus.APPROVED:
    case ShortTermApplicationStatus.COMPLETED:
    case ShortTermApplicationStatus.PAID:
      return 'accepted';
    case ShortTermApplicationStatus.REJECTED:
    case ShortTermApplicationStatus.CANCELLED:
    case ShortTermApplicationStatus.WITHDRAWN:
      return 'rejected';
    case ShortTermApplicationStatus.PENDING:
    case ShortTermApplicationStatus.SUBMITTED:
    case ShortTermApplicationStatus.REVISION_REQUIRED:
    default:
      return 'pending';
  }
};

const getWorkspaceJobKey = (kind: WorkspaceJobKind, id: number): string => `${kind}-${id}`;

const toWorkspaceFullTimeJob = (job: JobPostingResponse): WorkspaceJob => ({
  key: getWorkspaceJobKey('fulltime', job.id),
  id: job.id,
  kind: 'fulltime',
  title: job.title,
  status: job.status,
  statusLabel: getJobStatusLabel(job.status),
  statusTone: getFullTimeJobStatusTone(job.status),
  applicantCount: job.applicantCount || 0,
  requiredSkills: job.requiredSkills || [],
  deadline: job.deadline,
  location: job.location,
  isRemote: job.isRemote,
  budgetLabel: `${formatCompactCurrency(job.minBudget)} - ${formatCompactCurrency(job.maxBudget)}`,
  subLabel: job.isRemote ? 'Remote' : job.location || 'On-site',
  raw: job,
});

const toWorkspaceShortTermJob = (job: ShortTermJobResponse): WorkspaceJob => ({
  key: getWorkspaceJobKey('shortterm', job.id),
  id: job.id,
  kind: 'shortterm',
  title: job.title,
  status: job.status,
  statusLabel: getShortTermJobStatusLabel(job.status),
  statusTone: getShortTermJobStatusTone(job.status),
  applicantCount: job.applicantCount || 0,
  requiredSkills: job.requiredSkills || [],
  deadline: job.deadline,
  location: job.location,
  isRemote: job.isRemote,
  budgetLabel: formatCompactCurrency(job.budget),
  subLabel: job.isRemote ? 'Remote' : job.location || 'On-site',
  raw: job,
});

const toWorkspaceFullTimeApplicant = (application: JobApplicationResponse): WorkspaceApplicant => ({
  id: application.id,
  kind: 'fulltime',
  userId: application.userId,
  userFullName: application.userFullName,
  userEmail: application.userEmail,
  userAvatar: application.userAvatar,
  userProfessionalTitle: application.userProfessionalTitle,
  portfolioSlug: application.portfolioSlug,
  coverLetter: application.coverLetter,
  status: application.status,
  statusLabel: getApplicationStatusLabel(application.status),
  statusTone: getFullTimeApplicationTone(application.status),
  appliedAt: application.appliedAt,
  budgetLabel: `${formatCompactCurrency(application.minBudget)} - ${formatCompactCurrency(application.maxBudget)}`,
  canMarkReviewed: application.status === 'PENDING',
  canAccept: application.status === 'PENDING' || application.status === 'REVIEWED',
  canReject: application.status === 'PENDING' || application.status === 'REVIEWED',
  raw: application,
});

const toWorkspaceShortTermApplicant = (
  application: ShortTermApplicationResponse,
): WorkspaceApplicant => ({
  id: application.id,
  kind: 'shortterm',
  userId: application.userId,
  userFullName: application.userFullName,
  userEmail: application.userEmail,
  userAvatar: application.userAvatar,
  userProfessionalTitle: application.userProfessionalTitle,
  portfolioSlug: application.portfolioSlug,
  coverLetter: application.coverLetter,
  status: application.status,
  statusLabel: getShortTermApplicationStatusLabel(application.status),
  statusTone: getShortTermApplicationTone(application.status),
  appliedAt: application.appliedAt,
  budgetLabel: application.proposedPrice != null
    ? formatCompactCurrency(application.proposedPrice)
    : application.jobDetails?.budget != null
      ? formatCompactCurrency(application.jobDetails.budget)
      : 'Theo ngân sách job',
  canMarkReviewed: false,
  canAccept: application.status === ShortTermApplicationStatus.PENDING,
  canReject: application.status === ShortTermApplicationStatus.PENDING,
  raw: application,
});

const toCandidateSeedFromApplicant = (application: WorkspaceApplicant): CandidateSeed => ({
  candidateId: application.userId,
  fullName: getApplicantDisplayName(application.userFullName, application.userEmail),
  professionalTitle: application.userProfessionalTitle,
  avatarUrl: application.userAvatar,
  portfolioSlug: application.portfolioSlug,
  email: application.userEmail,
  sourceLabel: 'Ứng viên đã apply',
});

const matchesSessionToJob = (
  session: RecruitmentSessionResponse,
  job: WorkspaceJob,
): boolean => {
  if (session.jobId !== job.id) {
    return false;
  }

  if (job.kind === 'shortterm') {
    return session.jobContextType === RecruitmentJobContextType.SHORT_TERM_JOB;
  }

  return (session.jobContextType || RecruitmentJobContextType.JOB_POSTING) === RecruitmentJobContextType.JOB_POSTING;
};

const isWorkspaceJobOpen = (job: WorkspaceJob): boolean => {
  if (job.kind === 'shortterm') {
    return [
      ShortTermJobStatus.PUBLISHED,
      ShortTermJobStatus.APPLIED,
      ShortTermJobStatus.IN_PROGRESS,
      ShortTermJobStatus.SUBMITTED,
      ShortTermJobStatus.UNDER_REVIEW,
      ShortTermJobStatus.APPROVED,
    ].includes((job.raw as ShortTermJobResponse).status);
  }

  return (job.raw as JobPostingResponse).status === JobStatus.OPEN;
};

const isApplicantPending = (application: WorkspaceApplicant): boolean =>
  application.status === 'PENDING' || (application.kind === 'fulltime' && application.status === 'REVIEWED');

// ============ AI INSIGHT RENDERER ============
type MatchQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

interface SkillSignal {
  skill: string;
  evidence: string;
  isRequired: boolean;
  relevanceScore: number;
}

const getMatchQuality = (quality: MatchQuality): { label: string; color: string; icon: string } => {
  switch (quality) {
    case 'EXCELLENT': return { label: 'Xuất sắc', color: '#4ade80', icon: '\u2728' };
    case 'GOOD': return { label: 'Tốt', color: '#60a5fa', icon: '\u2B50' };
    case 'FAIR': return { label: 'Trung bình', color: '#fbbf24', icon: '\u2753' };
    case 'POOR': return { label: 'Yếu', color: '#f87171', icon: '\u26A0\uFE0F' };
  }
};

const getScoreColor = (score: number): string => {
  if (score >= 0.8) return '#4ade80';
  if (score >= 0.6) return '#fbbf24';
  if (score >= 0.4) return '#fb923c';
  return '#f87171';
};

const CircularScoreRing = ({ score, size = 56, strokeWidth = 5, color }: {
  score: number; size?: number; strokeWidth?: number; color: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width={size} height={size} className="rtw-ai-insight__confidence-svg">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text
        x="50%" y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill={color}
        fontSize={size * 0.22}
        fontWeight="700"
        fontFamily="inherit"
      >
        {Math.round(score)}%
      </text>
    </svg>
  );
};

const AIInsightRenderer = ({ insight }: { insight: AICandidateMatchResponse }) => {
  const [expanded, setExpanded] = useState(false);
  const confidence = Math.round((insight.confidenceScore || 0) * 100);
  const signals: SkillSignal[] = insight.skillSignals || [];
  const quality: MatchQuality = insight.matchQuality || 'FAIR';
  const qualityMeta = getMatchQuality(quality);

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
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={partKey++} className="ai-md-bold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(<code key={partKey++} className="ai-md-code">{codeMatch[1]}</code>);
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }
      const italicMatch = remaining.match(/^(\*|_)([^*_]+?)\1/);
      if (italicMatch) {
        parts.push(<em key={partKey++} className="ai-md-italic">{italicMatch[2]}</em>);
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

      if ((line === '---' || line === '***' || line === '___') && sections.length === 0) {
        i++; continue;
      }

      if (line === '---' || line === '***' || line === '___') {
        sections.push(<hr key={key++} className="ai-md-hr" />);
        i++; continue;
      }

      // Top-level heading: ## 🧠 Đánh giá tổng quan
      if (line.startsWith('## ')) {
        const headingText = line.slice(3).trim();
        const emojiMatch = headingText.match(/^([^\s]+\s)/);
        const emoji = emojiMatch ? emojiMatch[1] : '';
        const heading = emojiMatch ? headingText.slice(emojiMatch[0].length) : headingText;
        sections.push(
          <div key={key++} className="ai-md-section">
            <div className="ai-md-section__heading">
              {emoji && <span className="ai-md-section__emoji">{emoji}</span>}
              <span>{parseInline(heading)}</span>
            </div>
          </div>
        );
        i++; continue;
      }

      // Sub-heading: ### 1. React (Quan trọng)  or  #### Skill Name
      if (line.startsWith('### ') || line.startsWith('#### ')) {
        const subText = line.slice(line.startsWith('#### ') ? 5 : 4).trim();
        const indexMatch = subText.match(/^(\d+\.\s*)/);
        const idx = indexMatch ? indexMatch[1] : '';
        const rest = indexMatch ? subText.slice(indexMatch[0].length) : subText;

        const badgeMatch = rest.match(/\s*\(([^)]+)\)\s*$/);
        const badge = badgeMatch ? badgeMatch[1].trim() : '';
        const title = badgeMatch ? rest.slice(0, -badgeMatch[0].length).trim() : rest;

        const contentLines: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const t = lines[j].trim();
          if (t.startsWith('## ') || t.startsWith('---') || t.startsWith('### ') || t.startsWith('#### ')) break;
          if (t) contentLines.push(lines[j]);
          j++;
        }

        const content = parseSkillContent(contentLines.join('\n'), badge);

        sections.push(
          <div key={key++} className={`ai-md-skill-block ${badge.toLowerCase().includes('quan') ? 'ai-md-skill-block--required' : ''}`}>
            <div className="ai-md-skill-block__header">
              {idx && <span className="ai-md-skill-block__idx">{idx.replace('.', '')}</span>}
              <span className="ai-md-skill-block__name">{parseInline(title)}</span>
              {badge && (
                <span className={`ai-md-skill-block__badge ${badge.toLowerCase().includes('quan') ? 'ai-md-skill-block__badge--required' : 'ai-md-skill-block__badge--optional'}`}>
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

      if (line.match(/^[-*+] /)) {
        const items: React.ReactNode[] = [];
        while (i < lines.length && lines[i].trim().match(/^[-*+] /)) {
          const itemText = lines[i].trim().slice(2);
          items.push(<li key={key++}>{parseInline(itemText)}</li>);
          i++;
        }
        sections.push(<ul key={key++} className="ai-md-ul">{items}</ul>);
        continue;
      }

      if (line.match(/^\d+\. /)) {
        const items: React.ReactNode[] = [];
        while (i < lines.length && lines[i].trim().match(/^\d+\. /)) {
          const itemText = lines[i].trim().replace(/^\d+\. /, '');
          items.push(<li key={key++}>{parseInline(itemText)}</li>);
          i++;
        }
        sections.push(<ol key={key++} className="ai-md-ol">{items}</ol>);
        continue;
      }

      if (line) {
        const paraLines: string[] = [line];
        let j = i + 1;
        while (j < lines.length) {
          const t = lines[j].trim();
          if (!t || t.startsWith('#') || t.startsWith('-') || t.startsWith('*') || t.match(/^\d+\./) || t === '---') break;
          if (t) paraLines.push(t);
          j++;
        }
        sections.push(<p key={key++} className="ai-md-p">{paraLines.map((l, li) => <span key={li}>{parseInline(l)}</span>)}</p>);
        i = j;
        continue;
      }

      i++;
    }

    return <>{sections}</>;
  };

  // Parse skill block content
  const parseSkillContent = (content: string, _badge: string): React.ReactNode => {
    const lines = content.split('\n');
    const rows: React.ReactNode[] = [];
    let key = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const kvMatch = trimmed.match(/^\*\*([^*]+):\*\*\s*(.+)/);
      if (kvMatch) {
        const label = kvMatch[1].trim();
        const value = kvMatch[2].trim();

        if (label.includes('Mức độ phù hợp') || label.includes('Mức độ')) {
          const scoreMatch = value.match(/([0-9.]+)\/1\.0/);
          const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
          const scoreColor = getScoreColor(score);

          rows.push(
            <div key={key++} className="ai-md-skill-row">
              <span className="ai-md-skill-row__label">{parseInline(label)}</span>
              <div className="ai-md-skill-row__score">
                <span className="ai-md-skill-score-num">({score.toFixed(1)}/1.0)</span>
                <div className="ai-md-skill-bar">
                  <div className="ai-md-skill-bar__fill" style={{ width: `${score * 100}%`, background: scoreColor }} />
                </div>
              </div>
            </div>
          );
        } else if (label.includes('Trạng thái')) {
          rows.push(
            <div key={key++} className="ai-md-skill-row">
              <span className="ai-md-skill-row__label">{parseInline(label)}</span>
              <span className="ai-md-skill-status">{parseInline(value)}</span>
            </div>
          );
        } else {
          rows.push(
            <div key={key++} className="ai-md-skill-row">
              <span className="ai-md-skill-row__label">{parseInline(label)}</span>
              <span className="ai-md-skill-row__value">{parseInline(value)}</span>
            </div>
          );
        }
        continue;
      }

      if (trimmed.match(/^[-*+] /)) {
        rows.push(<li key={key++} className="ai-md-skill-subitem">{parseInline(trimmed.slice(2))}</li>);
        continue;
      }

      rows.push(<p key={key++} className="ai-md-skill-note">{parseInline(trimmed)}</p>);
    }

    return <div className="ai-md-skill-content">{rows}</div>;
  };

  const reasoning = cleanText(insight.reasoning || '');
  const hasReasoning = /^(##|###|####|\*\*)/.test(reasoning.trim());
  const avgSignalScore = signals.length > 0
    ? signals.reduce((s, sig) => s + sig.relevanceScore, 0) / signals.length
    : 0;

  return (
    <div className="rtw-ai-insight">
      {/* Hero section */}
      <div className="rtw-ai-insight__hero">
        <div className="rtw-ai-insight__hero-left">
          {/* Quality badge */}
          <div className="rtw-ai-insight__quality-badge" style={{ '--badge-color': qualityMeta.color } as React.CSSProperties}>
            <span className="rtw-ai-insight__quality-icon">{qualityMeta.icon}</span>
            <span className="rtw-ai-insight__quality-label" style={{ color: qualityMeta.color }}>
              {qualityMeta.label}
            </span>
          </div>
          <div className="rtw-ai-insight__title">
            <Sparkles size={14} />
            <span>Phân tích AI</span>
          </div>
          {insight.fitSummary && (
            <p className="ai-md-p" style={{ fontSize: '0.78rem', color: 'rgba(200,190,180,0.85)', margin: '0.25rem 0 0 0', lineHeight: 1.5 }}>
              {parseInline(insight.fitSummary)}
            </p>
          )}
        </div>
        <div className="rtw-ai-insight__hero-right">
          <div className="rtw-ai-insight__confidence-ring" style={{ '--ring-color': qualityMeta.color } as React.CSSProperties}>
            <CircularScoreRing score={confidence} color={qualityMeta.color} />
          </div>
        </div>
      </div>

      {/* Skill signals summary */}
      {signals.length > 0 && (
        <div className="ai-signal-summary">
          <div className="ai-signal-summary__score-group">
            <div className="ai-signal-summary__score-ring" style={{ '--ring-color': qualityMeta.color } as React.CSSProperties}>
              <CircularScoreRing score={avgSignalScore * 100} size={48} strokeWidth={4} color={getScoreColor(avgSignalScore)} />
            </div>
            <div style={{ marginLeft: '0.5rem' }}>
              <div className="ai-signal-summary__score-val" style={{ color: getScoreColor(avgSignalScore) }}>
                {(avgSignalScore * 100).toFixed(0)}
              </div>
              <div className="ai-signal-summary__score-label">Điểm TB</div>
            </div>
          </div>
          <div className="ai-signal-summary__breakdown">
            {signals.map((sig, idx) => {
              const scoreColor = getScoreColor(sig.relevanceScore);
              return (
                <div key={idx} className="ai-signal-summary__breakdown-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 0 }}>
                    <span className="ai-skill-bar-mini" style={{ width: '3rem', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0 }}>
                      <div className="ai-skill-bar-mini__fill" style={{ width: `${sig.relevanceScore * 100}%`, height: '100%', background: scoreColor, borderRadius: '2px' }} />
                    </span>
                    <span className="ai-signal-summary__breakdown-label" style={{ fontSize: '0.72rem', color: 'rgba(200,190,180,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sig.skill}
                    </span>
                  </div>
                  <span className="ai-signal-summary__breakdown-val" style={{ color: scoreColor, fontWeight: 600, fontSize: '0.72rem', marginLeft: '0.5rem', flexShrink: 0 }}>
                    {sig.relevanceScore.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="rtw-ai-insight__content">
        {hasReasoning && (
          <div className="rtw-ai-insight__reasoning">
            {parseRichMarkdown(reasoning)}
          </div>
        )}

        {/* Signal cards when no reasoning */}
        {!hasReasoning && signals.length > 0 && (
          <div className="rtw-ai-insight__signal-cards">
            {signals.map((sig, idx) => {
              const scoreColor = getScoreColor(sig.relevanceScore);
              return (
                <div key={idx} className={`ai-signal-card ${sig.isRequired ? 'ai-signal-card--required' : ''}`}>
                  <div className="ai-signal-card__header">
                    <span className="ai-signal-card__name">{parseInline(sig.skill)}</span>
                    <span className={`ai-signal-card__badge ${sig.isRequired ? 'ai-signal-card__badge--required' : 'ai-signal-card__badge--optional'}`}>
                      {sig.isRequired ? 'Bắt buộc' : 'Ưu tiên'}
                    </span>
                    <span className="ai-signal-card__score" style={{ color: scoreColor }}>
                      {(sig.relevanceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  {sig.evidence && (
                    <div className="ai-signal-card__evidence" style={{ fontSize: '0.75rem', color: 'rgba(200,190,180,0.8)', marginTop: '0.3rem', lineHeight: 1.5 }}>
                      {parseInline(sig.evidence)}
                    </div>
                  )}
                  <div className="ai-skill-bar-mini" style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: '0.4rem' }}>
                    <div className="ai-skill-bar-mini__fill" style={{ width: `${sig.relevanceScore * 100}%`, height: '100%', background: scoreColor, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!hasReasoning && signals.length === 0 && (
          <div className="rtw-ai-insight__empty">
            <Sparkles size={20} style={{ opacity: 0.3 }} />
            <span>Không có dữ liệu phân tích chi tiết</span>
          </div>
        )}

        {/* Raw markdown toggle */}
        {reasoning && (
          <div>
            <button
              className="rtw-ai-insight__toggle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Thu gọn' : 'Xem markdown gốc'}
            </button>
            {expanded && (
              <pre className="rtw-ai-insight__raw">
                {reasoning}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="rtw-ai-insight__footer">
        {insight.modelUsed && (
          <span className="rtw-ai-insight__footer-chip">{insight.modelUsed}</span>
        )}
        {insight.processingTimeMs != null && (
          <span className="rtw-ai-insight__footer-chip">{insight.processingTimeMs}ms</span>
        )}
        {insight.isFallback && (
          <span className="rtw-ai-insight__footer-chip rtw-ai-insight__footer-chip--warn">Fallback</span>
        )}
        <span className="rtw-ai-insight__footer-chip">Confidence {confidence}%</span>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT ============
const RecruiterTalentWorkspace = ({ fullTimeJobs, shortTermJobs }: RecruiterTalentWorkspaceProps) => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const portfolioRequestRef = useRef(0);
  const [jobRoster, setJobRoster] = useState<WorkspaceJob[]>(() => [
    ...fullTimeJobs.map(toWorkspaceFullTimeJob),
    ...shortTermJobs.map(toWorkspaceShortTermJob),
  ]);

  const [subscription, setSubscription] =
    useState<RecruiterSubscriptionInfoResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TalentTab>('applicants');
  const [selectedJobKey, setSelectedJobKey] = useState<string | null>(null);

  const [applicants, setApplicants] = useState<WorkspaceApplicant[]>([]);
  const [discoveries, setDiscoveries] = useState<CandidateSearchResult[]>([]);
  const [sessions, setSessions] = useState<RecruitmentSessionResponse[]>([]);

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSeed | null>(null);
  const [selectedSession, setSelectedSession] = useState<RecruitmentSessionResponse | null>(null);
  const rosterRef = useRef<HTMLDivElement>(null);
  const [applicantFilter, setApplicantFilter] = useState<ApplicantFilter>('all');

  const [portfolioProfile, setPortfolioProfile] = useState<UserProfileDTO | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProjectDTO[]>([]);
  const [portfolioCertificates, setPortfolioCertificates] = useState<ExternalCertificateDTO[]>([]);
  const [portfolioReviews, setPortfolioReviews] = useState<MentorReviewDTO[]>([]);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [discoveryAccessError, setDiscoveryAccessError] = useState<string | null>(null);

  const [aiInsight, setAiInsight] = useState<AICandidateMatchResponse | null>(null);

  const [messageDraft, setMessageDraft] = useState('');
  const [decisionNote, setDecisionNote] = useState('');

  const [decisionModal, setDecisionModal] = useState<{
    application: WorkspaceApplicant;
    status: DecisionState;
  } | null>(null);

  // Roster pagination
  const ROSTER_PAGE_SIZE = 5;
  const [rosterPage, setRosterPage] = useState(0);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isApplicantsLoading, setIsApplicantsLoading] = useState(false);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isActionBusy, setIsActionBusy] = useState(false);

  const [chatMessages, setChatMessages] = useState<RecruitmentMessageResponse[]>([]);

  useEffect(() => {
    setJobRoster([
      ...fullTimeJobs.map(toWorkspaceFullTimeJob),
      ...shortTermJobs.map(toWorkspaceShortTermJob),
    ]);
    setRosterPage(0);
  }, [fullTimeJobs, shortTermJobs]);

  const orderedJobs = [...jobRoster].sort((left, right) => {
    const leftOpen = isWorkspaceJobOpen(left) ? 1 : 0;
    const rightOpen = isWorkspaceJobOpen(right) ? 1 : 0;
    if (leftOpen !== rightOpen) return rightOpen - leftOpen;
    return (right.applicantCount || 0) - (left.applicantCount || 0);
  });

  const totalRosterPages = Math.ceil(orderedJobs.length / ROSTER_PAGE_SIZE);
  const paginatedRosterJobs = orderedJobs.slice(
    rosterPage * ROSTER_PAGE_SIZE,
    (rosterPage + 1) * ROSTER_PAGE_SIZE,
  );

  const selectedJob =
    orderedJobs.find((job) => job.key === selectedJobKey) || orderedJobs[0] || null;

  const totalApplicantCount = jobRoster.reduce(
    (sum, job) => sum + (job.applicantCount || 0),
    0,
  );
  const openJobCount = jobRoster.filter((job) => isWorkspaceJobOpen(job)).length;
  const currentPortfolioSkills = parseSkillList(portfolioProfile?.topSkills);
  const supportsAdvanced = selectedJob?.kind === 'fulltime';
  const supportsBoost = selectedJob?.kind === 'fulltime';

  const goToRosterPage = (nextPage: number) => {
    if (!orderedJobs.length) return;

    const safePage = Math.min(Math.max(nextPage, 0), Math.max(totalRosterPages - 1, 0));
    const firstJobOnPage = orderedJobs[safePage * ROSTER_PAGE_SIZE] || null;

    setRosterPage(safePage);

    if (firstJobOnPage && firstJobOnPage.key !== selectedJobKey) {
      setSelectedJobKey(firstJobOnPage.key);
    }
  };

  const filteredApplicants = applicants.filter((app) => {
    if (applicantFilter === 'pending') return isApplicantPending(app);
    if (applicantFilter === 'accepted') return app.status === 'ACCEPTED';
    if (applicantFilter === 'rejected') return app.status === 'REJECTED';
    return true;
  });

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
              (!selectedJob || matchesSessionToJob(session, selectedJob)),
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

  const loadApplicants = async (job: WorkspaceJob) => {
    setIsApplicantsLoading(true);
    try {
      const mappedApplicants =
        job.kind === 'shortterm'
          ? (await shortTermJobService.getJobApplicants(job.id, 0, 20)).content.map(toWorkspaceShortTermApplicant)
          : (await jobService.getJobApplicants(job.id, 0, 20)).content.map(toWorkspaceFullTimeApplicant);

      setApplicants(mappedApplicants || []);

      if (mappedApplicants.length) {
        await pickCandidate(toCandidateSeedFromApplicant(mappedApplicants[0]));
      } else {
        setSelectedCandidate(null);
        setSelectedSession(null);
        setPortfolioProfile(null);
        setPortfolioProjects([]);
        setPortfolioCertificates([]);
        setPortfolioReviews([]);
        setPortfolioError(null);
        setAiInsight(null);
      }
    } catch (error: any) {
      setApplicants([]);
      showError('Không thể tải ứng viên', error.message || 'Vui lòng thử lại');
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

  const loadSessions = async (job?: WorkspaceJob | null) => {
    setIsSessionsLoading(true);
    try {
      let result: RecruitmentSessionResponse[] = [];

      if (!job) {
        result = (await recruitmentChatService.getRecruiterSessions(0, 40)).sessions || [];
      } else if (job.kind === 'shortterm') {
        result = ((await recruitmentChatService.getRecruiterSessions(0, 100)).sessions || [])
          .filter((session) => matchesSessionToJob(session, job));
      } else {
        result = (await recruitmentChatService.getSessionsByJob(job.id))
          .filter((session) => matchesSessionToJob(session, job));
      }

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

  const handleBoostStateChange = () => {
    void loadSubscription();
  };

  const syncJobContext = async (job: WorkspaceJob) => {
    const tasks: Array<Promise<unknown>> = [loadApplicants(job), loadSessions(job)];

    if (job.kind === 'fulltime') {
      tasks.push(loadDiscoveries(job.id));
    } else {
      setDiscoveries([]);
      setDiscoveryAccessError(null);
    }

    await Promise.all(tasks);
  };

  const handleRefreshCurrentJob = async () => {
    if (!selectedJob) return;
    await syncJobContext(selectedJob);
    showSuccess('Đã làm mới', 'Pipeline tuyển dụng đã được đồng bộ lại.');
  };

  const handleCloseSelectedJob = async () => {
    if (!selectedJob) return;

    try {
      setIsActionBusy(true);

      if (selectedJob.kind === 'shortterm') {
        const updatedJob = await shortTermJobService.changeJobStatus(selectedJob.id, ShortTermJobStatus.CLOSED);
        const mappedJob = toWorkspaceShortTermJob(updatedJob);
        setJobRoster((current) =>
          current.map((job) => (job.key === mappedJob.key ? mappedJob : job)),
        );
      } else {
        const updatedJob = await jobService.changeJobStatus(selectedJob.id, JobStatus.CLOSED);
        const mappedJob = toWorkspaceFullTimeJob(updatedJob);
        setJobRoster((current) =>
          current.map((job) => (job.key === mappedJob.key ? mappedJob : job)),
        );
      }

      showSuccess('Đã đóng job', 'Job không còn nhận thêm ứng viên mới.');
    } catch (error: any) {
      showError('Không thể đóng job', error.message || 'Vui lòng thử lại');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleReviewApplication = async (application: WorkspaceApplicant) => {
    if (application.kind !== 'fulltime' || !selectedJob) return;

    try {
      setIsActionBusy(true);
      await jobService.updateApplicationStatus(application.id, {
        status: JobApplicationStatus.REVIEWED,
      });
      showSuccess('Đã đánh dấu', 'Ứng viên đã được chuyển sang trạng thái đã xem.');
      await loadApplicants(selectedJob);
    } catch (error: any) {
      showError('Không thể cập nhật ứng viên', error.message || 'Vui lòng thử lại');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleConfirmDecision = async () => {
    if (!decisionModal || !selectedJob) return;

    if (!decisionNote.trim()) {
      showError('Thiếu nội dung', 'Vui lòng nhập ghi chú cho quyết định này.');
      return;
    }

    try {
      setIsActionBusy(true);

      if (decisionModal.application.kind === 'shortterm') {
        await shortTermJobService.updateApplicationStatus(decisionModal.application.id, {
          status:
            decisionModal.status === 'ACCEPTED'
              ? ShortTermApplicationStatus.ACCEPTED
              : ShortTermApplicationStatus.REJECTED,
          ...(decisionModal.status === 'ACCEPTED'
            ? { message: decisionNote.trim() }
            : { reason: decisionNote.trim() }),
        });
      } else {
        const fieldName =
          decisionModal.status === 'ACCEPTED' ? 'acceptanceMessage' : 'rejectionReason';

        await jobService.updateApplicationStatus(decisionModal.application.id, {
          status: decisionModal.status as JobApplicationStatus,
          [fieldName]: decisionNote.trim(),
        });
      }

      setDecisionModal(null);
      setDecisionNote('');
      showSuccess(
        decisionModal.status === 'ACCEPTED' ? 'Đã duyệt ứng viên' : 'Đã loại ứng viên',
        'Trạng thái hồ sơ đã được cập nhật.',
      );
      await loadApplicants(selectedJob);
    } catch (error: any) {
      showError('Không thể cập nhật ứng viên', error.message || 'Vui lòng thử lại');
    } finally {
      setIsActionBusy(false);
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
        selectedJob?.id,
        sourceType,
        selectedJob?.kind === 'shortterm'
          ? RecruitmentJobContextType.SHORT_TERM_JOB
          : RecruitmentJobContextType.JOB_POSTING,
      );
      loadSessions(selectedJob);
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
    if (!selectedJob) {
      showError('Chưa chọn job', 'Hãy chọn job trước khi gửi lời mời.');
      return;
    }

    if (selectedJob.kind !== 'fulltime') {
      showError('Không hỗ trợ', 'Tính năng mời ứng viên trong workspace hiện chỉ áp dụng cho job toàn thời gian.');
      return;
    }

    try {
      setIsActionBusy(true);
      const session = await candidateSearchService.connectCandidateToJob(
        seed.candidateId,
        selectedJob.id,
      );
      await loadSessions(selectedJob);
      await pickCandidate(seed, session);
      setActiveTab('chats');
      showSuccess('Đã gửi lời mời', 'Ứng viên đã được kéo vào pipeline chat đúng job.');
    } catch (error: any) {
      showError('Không thể mời ứng viên', error.message || 'Vui lòng thử lại.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleShortlist = async (seed: CandidateSeed) => {
    if (!selectedJob) {
      showError('Chưa chọn job', 'Hãy chọn job trước khi shortlist.');
      return;
    }

    if (selectedJob.kind !== 'fulltime') {
      showError('Không hỗ trợ', 'Shortlist AI database hiện chỉ áp dụng cho job toàn thời gian.');
      return;
    }

    try {
      setIsActionBusy(true);
      await candidateSearchService.shortlistCandidate(seed.candidateId, selectedJob.id);
      showSuccess('Đã shortlist', `${seed.fullName} đã được lưu vào shortlist cho job này.`);
      await loadDiscoveries(selectedJob.id);
    } catch (error: any) {
      showError('Không thể shortlist', error.message || 'Vui lòng thử lại.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleRunAiInsight = async (seed?: CandidateSeed) => {
    const target = seed || selectedCandidate;
    if (!selectedJob || !target) {
      showError('Thiếu context', 'Hãy chọn cả job và ứng viên trước khi chạy AI insight.');
      return;
    }

    try {
      setIsAiLoading(true);
      let result: AICandidateMatchResponse;

      if (selectedJob.kind === 'shortterm') {
        result = await candidateSearchService.getShortTermJobMatchExplanation(
          selectedJob.id,
          target.candidateId,
        );
      } else {
        result = await candidateSearchService.getAIMatchExplanation(
          selectedJob.id,
          target.candidateId,
        );
      }

      setAiInsight(result);
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
      await loadSessions(selectedJob);
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
      await loadSessions(selectedJob);
      showSuccess('Đã cập nhật pipeline chat', 'Trạng thái conversation đã được đồng bộ.');
    } catch (error: any) {
      showError('Không thể cập nhật chat status', error.message || 'Vui lòng thử lại.');
    } finally {
      setIsActionBusy(false);
    }
  };

  useEffect(() => {
    if (!orderedJobs.length) {
      setSelectedJobKey(null);
      return;
    }

    if (!selectedJobKey || !orderedJobs.some((job) => job.key === selectedJobKey)) {
      setSelectedJobKey(orderedJobs[0].key);
    }
  }, [orderedJobs, selectedJobKey]);

  // Scroll active roster item into view
  useEffect(() => {
    if (!selectedJobKey || !rosterRef.current) return;
    const idx = orderedJobs.findIndex((j) => j.key === selectedJobKey);
    if (idx < 0) return;
    // If active job is not on current roster page, jump to its page
    const pageOfJob = Math.floor(idx / ROSTER_PAGE_SIZE);
    if (pageOfJob !== rosterPage) {
      setRosterPage(pageOfJob);
    }
    // Scroll the button into view after a short delay
    setTimeout(() => {
      const el = rosterRef.current?.querySelector(`[data-job-key="${selectedJobKey}"]`) as HTMLElement | null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }, 50);
  }, [selectedJobKey, orderedJobs, rosterPage]);

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
    if (!selectedJob) return;

    setApplicants([]);
    setDiscoveries([]);
    setSessions([]);
    setDiscoveryAccessError(null);
    setSelectedSession(null);
    setSelectedCandidate(null);
    setPortfolioProfile(null);
    setPortfolioProjects([]);
    setPortfolioCertificates([]);
    setPortfolioReviews([]);
    setPortfolioError(null);
    setAiInsight(null);
    syncJobContext(selectedJob);
  }, [selectedJob?.key, subscription?.hasCandidateDatabaseAccess]);

  useEffect(() => {
    if (selectedJob?.kind === 'shortterm' && activeTab === 'advanced') {
      setActiveTab('applicants');
    }
  }, [activeTab, selectedJob?.kind]);

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
                  <strong>Pipeline ứng viên</strong>
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
                  <strong>Đánh giá Portfolio</strong>
                  <span>Xem và đánh giá portfolio, dự án, chứng chỉ của ứng viên ngay trong workspace.</span>
                </div>
              </div>
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon"><MessageSquare size={18} /></div>
                <div className="rtw-feature-text">
                  <strong>Chat theo ngữ cảnh</strong>
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
                <div className="rtw-perk-item"><CheckCircle2 size={13} /><span>Chat &amp; đánh giá portfolio</span></div>
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
                  <span className={`rtw-status-pill rtw-status-pill--${selectedJob.statusTone}`}>
                    {selectedJob.statusLabel}
                  </span>
                  <span className={`rtw-chip ${selectedJob.kind === 'fulltime' ? 'rtw-chip--gold' : 'rtw-chip--purple'}`}>
                    {selectedJob.kind === 'fulltime' ? 'Toàn thời gian' : 'Ngắn hạn'}
                  </span>
                  <span className="rtw-inline-stat">
                    <Users size={12} />
                    {selectedJob.applicantCount || 0} ứng tuyển
                  </span>
                  <span className="rtw-inline-stat">
                    <Wallet size={12} />
                    {selectedJob.budgetLabel}
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
            {selectedJob && (
              <div className="rtw-job-bar__selected-actions">
                  {supportsBoost ? (
                    <div className="rtw-job-bar__boost">
                        <JobBoostButton
                          jobId={selectedJob.id}
                          jobTitle={selectedJob.title}
                          onBoostCreated={handleBoostStateChange}
                          onBoostCancelled={handleBoostStateChange}
                        />
                    </div>
                  ) : (
                  <p className="rtw-inline-note rtw-inline-note--left">
                    Boost hiện chỉ hỗ trợ cho job toàn thời gian.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Job roster */}
        <div className="rtw-job-bar__roster" ref={rosterRef}>
          {paginatedRosterJobs.map((job) => (
            <button
              key={job.key}
              data-job-key={job.key}
              className={`rtw-job-bar__roster-item rtw-job-bar__roster-item--${job.statusTone} ${job.key === selectedJobKey ? 'rtw-job-bar__roster-item--active' : ''}`}
              onClick={() => setSelectedJobKey(job.key)}
            >
              <div className="rtw-job-bar__roster-item__header">
                <span className={`rtw-job-bar__roster-item__kind-dot rtw-job-bar__roster-item__kind-dot--${job.kind}`} />
                <span className="rtw-job-bar__roster-item__title">{job.title}</span>
              </div>
              <div className="rtw-job-bar__roster-item__footer">
                <div className="rtw-job-bar__roster-item__meta">
                  <Users size={10} />
                  {job.applicantCount || 0}
                </div>
                <span className={`rtw-status-pill rtw-status-pill--${job.statusTone}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                  {job.statusLabel}
                </span>
              </div>
            </button>
          ))}

          {/* Roster pagination */}
          {totalRosterPages > 1 && (
            <div className="rtw-job-bar__roster-pagination">
              <button
                className="rtw-job-bar__roster-pagination__btn"
                disabled={rosterPage === 0}
                onClick={() => goToRosterPage(rosterPage - 1)}
              >
                <ChevronLeft size={12} />
              </button>
              <span className="rtw-job-bar__roster-pagination__info">
                {rosterPage + 1}/{totalRosterPages}
              </span>
              <button
                className="rtw-job-bar__roster-pagination__btn"
                disabled={rosterPage >= totalRosterPages - 1}
                onClick={() => goToRosterPage(rosterPage + 1)}
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}
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
                Ứng viên
                {applicants.length > 0 && (
                  <span style={{ marginLeft: '0.25rem', padding: '0.08rem 0.35rem', borderRadius: '999px', background: 'rgba(212,175,55,0.15)', color: '#f0d060', fontSize: '0.68rem', fontWeight: 700 }}>
                    {applicants.length}
                  </span>
                )}
              </button>
              <button
                className={`rtw-tab ${activeTab === 'advanced' ? 'rtw-tab--active' : ''} ${!supportsAdvanced ? 'rtw-tab--disabled' : ''}`}
                onClick={() => supportsAdvanced && setActiveTab('advanced')}
                disabled={!supportsAdvanced}
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
                Trò chuyện
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
                    <span className="rtw-panel__eyebrow"><Inbox size={11} />Hộp ứng viên</span>
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
                    Chờ duyệt ({applicants.filter((a) => isApplicantPending(a)).length})
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
                    <span>Đang tải ứng viên...</span>
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
                    const seed = toCandidateSeedFromApplicant(application);

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
                          <span className={`rtw-status-pill rtw-status-pill--${application.statusTone}`}>
                            {application.statusLabel}
                          </span>
                        </div>

                        <p className="rtw-card__body">
                          {application.coverLetter || 'Ứng viên chưa để lại thư giới thiệu.'}
                        </p>

                        <div className="rtw-card__meta">
                          <span><Clock3 size={12} />{formatRelativeTime(application.appliedAt)}</span>
                          <span><Wallet size={12} />{application.budgetLabel}</span>
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
                          {application.canMarkReviewed && (
                            <button
                              className="rtw-chip-btn"
                              title="Đánh dấu đã xem"
                              onClick={(e) => { e.stopPropagation(); handleReviewApplication(application); }}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          {(application.canAccept || application.canReject) && (
                            <>
                              {application.canAccept && (
                                <button
                                className="rtw-chip-btn rtw-chip-btn--success"
                                title="Duyệt ứng viên"
                                onClick={(e) => { e.stopPropagation(); setDecisionModal({ application, status: 'ACCEPTED' }); setDecisionNote(''); }}
                              >
                                <CheckCircle2 size={14} />
                              </button>
                              )}
                              {application.canReject && (
                                <button
                                className="rtw-chip-btn rtw-chip-btn--danger"
                                title="Loại ứng viên"
                                onClick={(e) => { e.stopPropagation(); setDecisionModal({ application, status: 'REJECTED' }); setDecisionNote(''); }}
                              >
                                <XCircle size={14} />
                              </button>
                              )}
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
                    <button className="rtw-ghost-btn" onClick={() => selectedJob && loadDiscoveries(selectedJob.id, true)}>
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
                              <p>{candidate.professionalTitle || 'Hồ sơ ứng viên'}</p>
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
                    <span className="rtw-panel__eyebrow"><MessageSquare size={11} />Tin nhắn tuyển dụng</span>
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
                      <p>Bắt đầu chat từ ứng viên hoặc khu vực nâng cao để context được lưu lại.</p>
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
                            sourceLabel: 'Chat tuyển dụng',
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
                  Hồ sơ ứng viên
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
                  <p>Chọn một ứng viên hoặc ứng viên từ khu vực nâng cao để xem hồ sơ chi tiết.</p>
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
                            {portfolioProfile.professionalTitle || selectedCandidate.professionalTitle || 'Ứng viên'}
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
                                {aiInsight.confidenceScore != null ? `${Math.round(aiInsight.confidenceScore * 100)}%` : '—'}
                              </span>
                            </div>
                            <div className="rtw-dossier-ai-bar">
                              <div
                                className="rtw-dossier-ai-bar__fill"
                                style={{ width: aiInsight.confidenceScore != null ? `${Math.round(aiInsight.confidenceScore * 100)}%` : '0%' }}
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
                          <strong>Đánh giá Mentor</strong>
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
                            <p className="rtw-dossier-empty">Chưa có đánh giá công khai.</p>
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
              {decisionModal.status === 'ACCEPTED' ? 'Duyệt ứng viên' : 'Loại ứng viên'}
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
