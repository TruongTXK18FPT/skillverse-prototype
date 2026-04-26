import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import {
  CompletedMissionDTO,
  ExternalCertificateDTO,
  PortfolioProjectDTO,
  RecruitmentJobContextType,
  RecruitmentSessionResponse,
  UserProfileDTO,
  CandidateSearchResult,
  AiEnhancedAnalysisResponse,
} from "../../data/portfolioDTOs";
import {
  JobApplicationResponse,
  JobApplicationStatus,
  JobPostingResponse,
  JobStatus,
} from "../../data/jobDTOs";
import candidateSearchService from "../../services/candidateSearchService";
import jobService from "../../services/jobService";
import portfolioService from "../../services/portfolioService";
import shortTermJobService from "../../services/shortTermJobService";
import recruiterSubscriptionService, {
  RecruiterSubscriptionInfoResponse,
} from "../../services/recruiterSubscriptionService";
import recruitmentChatService from "../../services/recruitmentChatService";
import JobBoostButton from "./JobBoostButton";
import {
  ShortTermApplicationResponse,
  ShortTermApplicationStatus,
  ShortTermJobResponse,
  ShortTermJobStatus,
} from "../../types/ShortTermJob";
import {
  getApplicantDisplayName,
  getApplicantInitials,
  getApplicantSubtitle,
  resolveRecruitmentAssetUrl,
  getPortfolioPath,
} from "../../utils/recruitmentUi";
import { useToast as useLocalToast } from "../../hooks/useToast";
import { showAppError, showAppSuccess } from "../../context/ToastContext";
import "./RecruiterTalentWorkspace.css";

type TalentTab = "applicants";
type DecisionState = "ACCEPTED" | "REJECTED";
type ApplicantFilter = "all" | "pending" | "accepted" | "rejected";

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

type WorkspaceJobKind = "fulltime" | "shortterm";

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
  return resolveRecruitmentAssetUrl(raw) || "/images/meowl.jpg";
};

const formatCompactCurrency = (amount?: number, currency = "VND"): string => {
  if (amount === undefined || amount === null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatShortDate = (value?: string): string => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatRelativeTime = (value?: string): string => {
  if (!value) return "—";
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffHours < 1) return "Vừa xong";
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
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }
};

const normalizeSkillToken = (value: string): string =>
  value.trim().toLowerCase();

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const normalizeConfidenceScore = (score?: number): number => {
  if (score == null || Number.isNaN(score)) {
    return 0.5;
  }
  return clamp01(score > 1 ? score / 100 : score);
};

const getJobStatusLabel = (status: JobStatus): string => {
  switch (status) {
    case JobStatus.OPEN:
      return "Đang tuyển";
    case JobStatus.IN_PROGRESS:
      return "Draft";
    case JobStatus.CLOSED:
      return "Đã đóng";
    case JobStatus.PENDING_APPROVAL:
      return "Chờ duyệt";
    case JobStatus.REJECTED:
      return "Bị từ chối";
    default:
      return status;
  }
};

const getApplicationStatusLabel = (
  status: JobApplicationResponse["status"],
): string => {
  switch (status) {
    case "PENDING":
      return "Mới apply";
    case "REVIEWED":
      return "Đã xem";
    case "ACCEPTED":
      return "Đã duyệt";
    case "REJECTED":
      return "Đã loại";
    default:
      return status;
  }
};

const getFullTimeJobStatusTone = (status: JobStatus): string => {
  switch (status) {
    case JobStatus.OPEN:
      return "open";
    case JobStatus.IN_PROGRESS:
    case JobStatus.PENDING_APPROVAL:
      return "pending";
    case JobStatus.REJECTED:
      return "rejected";
    case JobStatus.CLOSED:
      return "closed";
    default:
      return "pending";
  }
};

const getFullTimeApplicationTone = (
  status: JobApplicationResponse["status"],
): string => {
  switch (status) {
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
      return "rejected";
    case "PENDING":
    case "REVIEWED":
    default:
      return "pending";
  }
};

const getShortTermJobStatusLabel = (status: ShortTermJobStatus): string => {
  switch (status) {
    case ShortTermJobStatus.DRAFT:
      return "Bản nháp";
    case ShortTermJobStatus.PENDING_APPROVAL:
      return "Chờ duyệt";
    case ShortTermJobStatus.PUBLISHED:
      return "Đang hiển thị";
    case ShortTermJobStatus.APPLIED:
      return "Đã có apply";
    case ShortTermJobStatus.IN_PROGRESS:
      return "Đang thực hiện";
    case ShortTermJobStatus.SUBMITTED:
      return "Đã bàn giao";
    case ShortTermJobStatus.UNDER_REVIEW:
      return "Đang xem xét";
    case ShortTermJobStatus.APPROVED:
      return "Đã duyệt";
    case ShortTermJobStatus.REJECTED:
      return "Bị từ chối";
    case ShortTermJobStatus.COMPLETED:
      return "Hoàn thành";
    case ShortTermJobStatus.PAID:
      return "Đã thanh toán";
    case ShortTermJobStatus.CANCELLED:
      return "Đã hủy";
    case ShortTermJobStatus.DISPUTED:
      return "Đang tranh chấp";
    case ShortTermJobStatus.CLOSED:
      return "Đã đóng";
    default:
      return status;
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
      return "open";
    case ShortTermJobStatus.DRAFT:
    case ShortTermJobStatus.PENDING_APPROVAL:
    case ShortTermJobStatus.SUBMITTED:
    case ShortTermJobStatus.UNDER_REVIEW:
      return "pending";
    case ShortTermJobStatus.REJECTED:
    case ShortTermJobStatus.CANCELLED:
    case ShortTermJobStatus.DISPUTED:
      return "rejected";
    case ShortTermJobStatus.CLOSED:
      return "closed";
    default:
      return "pending";
  }
};

const getShortTermApplicationStatusLabel = (
  status: ShortTermApplicationStatus,
): string => {
  switch (status) {
    case ShortTermApplicationStatus.PENDING:
      return "Chờ duyệt";
    case ShortTermApplicationStatus.ACCEPTED:
      return "Đã chọn";
    case ShortTermApplicationStatus.REJECTED:
      return "Từ chối";
    case ShortTermApplicationStatus.WORKING:
    case ShortTermApplicationStatus.IN_PROGRESS:
      return "Đang làm";
    case ShortTermApplicationStatus.SUBMITTED:
      return "Đã bàn giao";
    case ShortTermApplicationStatus.REVISION_REQUIRED:
      return "Cần chỉnh sửa";
    case ShortTermApplicationStatus.APPROVED:
      return "Đã duyệt";
    case ShortTermApplicationStatus.COMPLETED:
      return "Hoàn thành";
    case ShortTermApplicationStatus.PAID:
      return "Đã thanh toán";
    case ShortTermApplicationStatus.CANCELLED:
      return "Đã hủy";
    case ShortTermApplicationStatus.WITHDRAWN:
      return "Rút đơn";
    default:
      return status;
  }
};

const getShortTermApplicationTone = (
  status: ShortTermApplicationStatus,
): string => {
  switch (status) {
    case ShortTermApplicationStatus.ACCEPTED:
    case ShortTermApplicationStatus.WORKING:
    case ShortTermApplicationStatus.IN_PROGRESS:
    case ShortTermApplicationStatus.APPROVED:
    case ShortTermApplicationStatus.COMPLETED:
    case ShortTermApplicationStatus.PAID:
      return "accepted";
    case ShortTermApplicationStatus.REJECTED:
    case ShortTermApplicationStatus.CANCELLED:
    case ShortTermApplicationStatus.WITHDRAWN:
      return "rejected";
    case ShortTermApplicationStatus.PENDING:
    case ShortTermApplicationStatus.SUBMITTED:
    case ShortTermApplicationStatus.REVISION_REQUIRED:
    default:
      return "pending";
  }
};

const getWorkspaceJobKey = (kind: WorkspaceJobKind, id: number): string =>
  `${kind}-${id}`;

const toWorkspaceFullTimeJob = (job: JobPostingResponse): WorkspaceJob => ({
  key: getWorkspaceJobKey("fulltime", job.id),
  id: job.id,
  kind: "fulltime",
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
  subLabel: job.isRemote ? "Remote" : job.location || "On-site",
  raw: job,
});

const toWorkspaceShortTermJob = (job: ShortTermJobResponse): WorkspaceJob => ({
  key: getWorkspaceJobKey("shortterm", job.id),
  id: job.id,
  kind: "shortterm",
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
  subLabel: job.isRemote ? "Remote" : job.location || "On-site",
  raw: job,
});

const toWorkspaceFullTimeApplicant = (
  application: JobApplicationResponse,
): WorkspaceApplicant => ({
  id: application.id,
  kind: "fulltime",
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
  canMarkReviewed: application.status === "PENDING",
  canAccept:
    application.status === "PENDING" || application.status === "REVIEWED",
  canReject:
    application.status === "PENDING" || application.status === "REVIEWED",
  raw: application,
});

const toWorkspaceShortTermApplicant = (
  application: ShortTermApplicationResponse,
): WorkspaceApplicant => ({
  id: application.id,
  kind: "shortterm",
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
  budgetLabel:
    application.proposedPrice != null
      ? formatCompactCurrency(application.proposedPrice)
      : application.jobDetails?.budget != null
        ? formatCompactCurrency(application.jobDetails.budget)
        : "Theo ngân sách job",
  canMarkReviewed: false,
  canAccept: application.status === ShortTermApplicationStatus.PENDING,
  canReject: application.status === ShortTermApplicationStatus.PENDING,
  raw: application,
});

const toCandidateSeedFromApplicant = (
  application: WorkspaceApplicant,
): CandidateSeed => ({
  candidateId: application.userId,
  fullName: getApplicantDisplayName(
    application.userFullName,
    application.userEmail,
  ),
  professionalTitle: application.userProfessionalTitle,
  avatarUrl: application.userAvatar,
  portfolioSlug: application.portfolioSlug,
  email: application.userEmail,
  sourceLabel: "Ứng viên đã apply",
});

const matchesSessionToJob = (
  session: RecruitmentSessionResponse,
  job: WorkspaceJob,
): boolean => {
  if (session.jobId !== job.id) {
    return false;
  }

  if (job.kind === "shortterm") {
    return session.jobContextType === RecruitmentJobContextType.SHORT_TERM_JOB;
  }

  return (
    (session.jobContextType || RecruitmentJobContextType.JOB_POSTING) ===
    RecruitmentJobContextType.JOB_POSTING
  );
};

const isWorkspaceJobOpen = (job: WorkspaceJob): boolean => {
  if (job.kind === "shortterm") {
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
  application.status === "PENDING" ||
  (application.kind === "fulltime" && application.status === "REVIEWED");

const getApplicantCompletedJobs = (
  application: WorkspaceApplicant,
): number | null => {
  if (application.kind !== "shortterm") return null;
  const completedJobs = (application.raw as ShortTermApplicationResponse)
    .userCompletedJobs;
  return typeof completedJobs === "number" && Number.isFinite(completedJobs)
    ? completedJobs
    : null;
};

// ============ AI INSIGHT RENDERER ============
type MatchQuality = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

interface SkillSignal {
  skill: string;
  evidence: string;
  isRequired: boolean;
  relevanceScore: number;
}

const getMatchQuality = (
  quality: MatchQuality,
): { label: string; color: string; icon: string } => {
  switch (quality) {
    case "EXCELLENT":
      return { label: "Xuất sắc", color: "#4ade80", icon: "\u2728" };
    case "GOOD":
      return { label: "Tốt", color: "#60a5fa", icon: "\u2B50" };
    case "FAIR":
      return { label: "Trung bình", color: "#fbbf24", icon: "\u2753" };
    case "POOR":
      return { label: "Yếu", color: "#f87171", icon: "\u26A0\uFE0F" };
  }
};

const getScoreColor = (score: number): string => {
  if (score >= 0.8) return "#4ade80";
  if (score >= 0.6) return "#fbbf24";
  if (score >= 0.4) return "#fb923c";
  return "#f87171";
};

type CompletedMissionInsightSummary = {
  totalMissions: number;
  paidMissions: number;
  averageRating: number | null;
  relevantMissions: number;
  matchedRequiredSkills: string[];
  requiredSkillsCount: number;
  evidenceScore: number;
};

const summarizeCompletedMissions = (
  missions: CompletedMissionDTO[],
  requiredSkills: string[] = [],
): CompletedMissionInsightSummary => {
  if (!missions.length) {
    return {
      totalMissions: 0,
      paidMissions: 0,
      averageRating: null,
      relevantMissions: 0,
      matchedRequiredSkills: [],
      requiredSkillsCount: requiredSkills.length,
      evidenceScore: 0,
    };
  }

  const requiredSkillMap = new Map<string, string>();
  requiredSkills.forEach((skill) => {
    const normalized = normalizeSkillToken(skill);
    if (normalized) {
      requiredSkillMap.set(normalized, skill.trim());
    }
  });

  const requiredSkillSet = new Set(requiredSkillMap.keys());
  const matchedSkillSet = new Set<string>();
  const ratingValues: number[] = [];
  let paidMissions = 0;
  let relevantMissions = 0;

  missions.forEach((mission) => {
    if (mission.status === "PAID") {
      paidMissions += 1;
    }

    const missionRatings = [
      mission.rating,
      mission.qualityRating,
      mission.communicationRating,
      mission.timelinessRating,
      mission.professionalismRating,
    ].filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value) && value > 0,
    );

    if (missionRatings.length) {
      ratingValues.push(
        missionRatings.reduce((total, value) => total + value, 0) /
          missionRatings.length,
      );
    }

    const missionSkillSet = new Set(
      (mission.requiredSkills || [])
        .map((skill) => normalizeSkillToken(skill))
        .filter(Boolean),
    );

    if (!requiredSkillSet.size) {
      if (missionSkillSet.size > 0) {
        relevantMissions += 1;
      }
      return;
    }

    const intersects = Array.from(missionSkillSet).filter((skill) =>
      requiredSkillSet.has(skill),
    );
    if (intersects.length > 0) {
      relevantMissions += 1;
      intersects.forEach((skill) => matchedSkillSet.add(skill));
    }
  });

  const totalMissions = missions.length;
  const paidRate = paidMissions / totalMissions;
  const averageRating = ratingValues.length
    ? ratingValues.reduce((total, value) => total + value, 0) /
      ratingValues.length
    : null;
  const qualityScore =
    averageRating != null ? clamp01(averageRating / 5) : 0.58;
  const completionScore = clamp01(totalMissions / 10);
  const relevanceByCoverage = requiredSkillSet.size
    ? matchedSkillSet.size / requiredSkillSet.size
    : clamp01(relevantMissions / Math.max(totalMissions, 1));
  const relevanceByVolume = clamp01(relevantMissions / 5);
  const relevanceScore = requiredSkillSet.size
    ? relevanceByCoverage * 0.7 + relevanceByVolume * 0.3
    : relevanceByVolume;

  const evidenceScore = clamp01(
    completionScore * 0.35 +
      paidRate * 0.2 +
      qualityScore * 0.25 +
      relevanceScore * 0.2,
  );

  return {
    totalMissions,
    paidMissions,
    averageRating,
    relevantMissions,
    matchedRequiredSkills: Array.from(matchedSkillSet).map(
      (skill) => requiredSkillMap.get(skill) || skill,
    ),
    requiredSkillsCount: requiredSkillSet.size,
    evidenceScore,
  };
};

// ============ MAIN COMPONENT ============
const RecruiterTalentWorkspace = ({
  fullTimeJobs,
  shortTermJobs,
}: RecruiterTalentWorkspaceProps) => {
  const navigate = useNavigate();
  const { showInfo } = useLocalToast();
  const showToastError = (title: string, message: string) =>
    showAppError(title, message);
  const showToastSuccess = (title: string, message: string) =>
    showAppSuccess(title, message, 5);
  const portfolioRequestRef = useRef(0);
  const [jobRoster, setJobRoster] = useState<WorkspaceJob[]>(() => [
    ...fullTimeJobs.map(toWorkspaceFullTimeJob),
    ...shortTermJobs.map(toWorkspaceShortTermJob),
  ]);

  const [subscription, setSubscription] =
    useState<RecruiterSubscriptionInfoResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TalentTab>("applicants");
  const [selectedJobKey, setSelectedJobKey] = useState<string | null>(null);

  const [applicants, setApplicants] = useState<WorkspaceApplicant[]>([]);
  const [sessions, setSessions] = useState<RecruitmentSessionResponse[]>([]);

  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateSeed | null>(null);
  const [selectedSession, setSelectedSession] =
    useState<RecruitmentSessionResponse | null>(null);
  const rosterRef = useRef<HTMLDivElement>(null);
  const [applicantFilter, setApplicantFilter] =
    useState<ApplicantFilter>("all");
  const [applicantKeyword, setApplicantKeyword] = useState("");

  const [portfolioProfile, setPortfolioProfile] =
    useState<UserProfileDTO | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<
    PortfolioProjectDTO[]
  >([]);
  const [portfolioCertificates, setPortfolioCertificates] = useState<
    ExternalCertificateDTO[]
  >([]);
  const [portfolioCompletedMissions, setPortfolioCompletedMissions] = useState<
    CompletedMissionDTO[]
  >([]);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const [aiInsight, setAiInsight] = useState<CandidateSearchResult | null>(
    null,
  );
  const [aiEnhancedResult, setAiEnhancedResult] =
    useState<AiEnhancedAnalysisResponse | null>(null);
  const [isAiEnhancedLoading, setIsAiEnhancedLoading] = useState(false);

  const [decisionNote, setDecisionNote] = useState("");

  const [decisionModal, setDecisionModal] = useState<{
    application: WorkspaceApplicant;
    status: DecisionState;
  } | null>(null);

  // Roster pagination
  const ROSTER_PAGE_SIZE = 5;
  const [rosterPage, setRosterPage] = useState(0);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isApplicantsLoading, setIsApplicantsLoading] = useState(false);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isActionBusy, setIsActionBusy] = useState(false);

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
    orderedJobs.find((job) => job.key === selectedJobKey) ||
    orderedJobs[0] ||
    null;

  const totalApplicantCount = jobRoster.reduce(
    (sum, job) => sum + (job.applicantCount || 0),
    0,
  );
  const openJobCount = jobRoster.filter((job) =>
    isWorkspaceJobOpen(job),
  ).length;
  const currentPortfolioSkills = parseSkillList(portfolioProfile?.topSkills);
  const completedMissionSummary = useMemo(
    () =>
      summarizeCompletedMissions(
        portfolioCompletedMissions,
        selectedJob?.requiredSkills || [],
      ),
    [portfolioCompletedMissions, selectedJob?.requiredSkills],
  );
  const supportsBoost = selectedJob?.kind === "fulltime";
  const selectedJobSkillPreview = (selectedJob?.requiredSkills || []).slice(
    0,
    2,
  );
  const selectedJobRemainingSkills = Math.max(
    (selectedJob?.requiredSkills?.length || 0) - selectedJobSkillPreview.length,
    0,
  );

  const goToRosterPage = (nextPage: number) => {
    if (!orderedJobs.length) return;

    const safePage = Math.min(
      Math.max(nextPage, 0),
      Math.max(totalRosterPages - 1, 0),
    );
    const firstJobOnPage = orderedJobs[safePage * ROSTER_PAGE_SIZE] || null;

    setRosterPage(safePage);

    if (firstJobOnPage && firstJobOnPage.key !== selectedJobKey) {
      setSelectedJobKey(firstJobOnPage.key);
    }
  };

  const applicantCounts = useMemo(
    () => ({
      all: applicants.length,
      pending: applicants.filter((app) => isApplicantPending(app)).length,
      accepted: applicants.filter((app) => app.status === "ACCEPTED").length,
      rejected: applicants.filter((app) => app.status === "REJECTED").length,
    }),
    [applicants],
  );

  const filteredApplicants = useMemo(() => {
    const normalizedKeyword = applicantKeyword.trim().toLowerCase();

    return applicants
      .filter((app) => {
        if (applicantFilter === "pending" && !isApplicantPending(app))
          return false;
        if (applicantFilter === "accepted" && app.status !== "ACCEPTED")
          return false;
        if (applicantFilter === "rejected" && app.status !== "REJECTED")
          return false;

        if (!normalizedKeyword) return true;

        const haystack = [
          getApplicantDisplayName(app.userFullName, app.userEmail),
          app.userEmail,
          app.userProfessionalTitle,
          app.coverLetter,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedKeyword);
      })
      .sort((left, right) => {
        const leftTs = left.appliedAt ? new Date(left.appliedAt).getTime() : 0;
        const rightTs = right.appliedAt
          ? new Date(right.appliedAt).getTime()
          : 0;
        return rightTs - leftTs;
      });
  }, [applicants, applicantFilter, applicantKeyword]);

  const loadSubscription = async () => {
    try {
      const result = await recruiterSubscriptionService.getSubscriptionInfo();
      setSubscription(result);
    } catch (error: any) {
      showToastError(
        "Không thể tải quyền recruiter",
        error.message || "Vui lòng thử lại sau",
      );
    }
  };

  const buildPublicPortfolioPath = (portfolioSlug?: string | null) => {
    return getPortfolioPath(portfolioSlug);
  };

  const openPortfolioExternally = () => {
    if (!selectedCandidate) return;
    const targetPath = buildPublicPortfolioPath(
      selectedCandidate.portfolioSlug,
    );
    if (!targetPath) {
      showInfo(
        "Chưa có portfolio",
        "Ứng viên này chưa công khai portfolio trên SkillVerse.",
      );
      return;
    }
    window.open(targetPath, "_blank", "noopener,noreferrer");
  };

  const pickCandidate = async (
    seed: CandidateSeed,
    preferredSession?: RecruitmentSessionResponse | null,
  ) => {
    const requestId = portfolioRequestRef.current + 1;
    portfolioRequestRef.current = requestId;

    setSelectedCandidate(seed);
    setAiInsight(null);
    setAiEnhancedResult(null);
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

    const [profile, projects, certificates, completedMissions] =
      await Promise.all([
        portfolioService.getPublicProfile(seed.candidateId).catch(() => null),
        portfolioService
          .getPublicUserProjects(seed.candidateId)
          .catch(() => []),
        portfolioService
          .getPublicUserCertificates(seed.candidateId)
          .catch(() => []),
        portfolioService
          .getPublicCompletedMissions(seed.candidateId)
          .catch(() => []),
      ]);

    if (requestId !== portfolioRequestRef.current) return;

    setPortfolioProfile(profile);
    setPortfolioProjects(projects);
    setPortfolioCertificates(certificates);
    setPortfolioCompletedMissions(completedMissions);
    setPortfolioError(
      profile ? null : "Không thể tải hồ sơ công khai của ứng viên này.",
    );
    setIsPortfolioLoading(false);
  };

  const loadApplicants = async (job: WorkspaceJob) => {
    setIsApplicantsLoading(true);
    try {
      const mappedApplicants =
        job.kind === "shortterm"
          ? (
              await shortTermJobService.getJobApplicants(job.id, 0, 20)
            ).content.map(toWorkspaceShortTermApplicant)
          : (await jobService.getJobApplicants(job.id, 0, 20)).content.map(
              toWorkspaceFullTimeApplicant,
            );

      setApplicants(mappedApplicants || []);

      if (mappedApplicants.length) {
        await pickCandidate(toCandidateSeedFromApplicant(mappedApplicants[0]));
      } else {
        setSelectedCandidate(null);
        setSelectedSession(null);
        setPortfolioProfile(null);
        setPortfolioProjects([]);
        setPortfolioCertificates([]);
        setPortfolioCompletedMissions([]);
        setPortfolioError(null);
        setAiInsight(null);
        setAiEnhancedResult(null);
      }
    } catch (error: any) {
      setApplicants([]);
      showToastError(
        "Không thể tải ứng viên",
        error.message || "Vui lòng thử lại",
      );
    } finally {
      setIsApplicantsLoading(false);
    }
  };

  const loadSessions = async (job?: WorkspaceJob | null) => {
    try {
      let result: RecruitmentSessionResponse[] = [];

      if (!job) {
        result =
          (await recruitmentChatService.getRecruiterSessions(0, 40)).sessions ||
          [];
      } else if (job.kind === "shortterm") {
        result = (
          (await recruitmentChatService.getRecruiterSessions(0, 100))
            .sessions || []
        ).filter((session) => matchesSessionToJob(session, job));
      } else {
        result = (await recruitmentChatService.getSessionsByJob(job.id)).filter(
          (session) => matchesSessionToJob(session, job),
        );
      }

      setSessions(result || []);

      if (selectedSession) {
        const refreshed =
          (result || []).find((session) => session.id === selectedSession.id) ||
          null;
        setSelectedSession(refreshed);
      }
    } catch (error: any) {
      setSessions([]);
      showToastError(
        "Không thể tải chat tuyển dụng",
        error.message || "Vui lòng thử lại",
      );
    }
  };

  const handleBoostStateChange = () => {
    void loadSubscription();
  };

  const syncJobContext = async (job: WorkspaceJob) => {
    await Promise.all([loadApplicants(job), loadSessions(job)]);
  };

  const handleReviewApplication = async (application: WorkspaceApplicant) => {
    if (application.kind !== "fulltime" || !selectedJob) return;

    try {
      setIsActionBusy(true);
      await jobService.updateApplicationStatus(application.id, {
        status: JobApplicationStatus.REVIEWED,
      });
      showToastSuccess(
        "Đã đánh dấu",
        "Ứng viên đã được chuyển sang trạng thái đã xem.",
      );
      await loadApplicants(selectedJob);
    } catch (error: any) {
      showToastError(
        "Không thể cập nhật ứng viên",
        error.message || "Vui lòng thử lại",
      );
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleConfirmDecision = async () => {
    if (!decisionModal || !selectedJob) {
      return;
    }

    if (!decisionNote.trim()) {
      showToastError(
        "Thiếu nội dung",
        "Vui lòng nhập ghi chú cho quyết định này.",
      );
      return;
    }

    try {
      setIsActionBusy(true);

      if (decisionModal.application.kind === "shortterm") {
        await shortTermJobService.updateApplicationStatus(
          decisionModal.application.id,
          {
            status:
              decisionModal.status === "ACCEPTED"
                ? ShortTermApplicationStatus.ACCEPTED
                : ShortTermApplicationStatus.REJECTED,
            ...(decisionModal.status === "ACCEPTED"
              ? { message: decisionNote.trim() }
              : { reason: decisionNote.trim() }),
          },
        );
      } else {
        const fieldName =
          decisionModal.status === "ACCEPTED"
            ? "acceptanceMessage"
            : "rejectionReason";

        await jobService.updateApplicationStatus(decisionModal.application.id, {
          status: decisionModal.status as JobApplicationStatus,
          [fieldName]: decisionNote.trim(),
        });
      }

      setDecisionModal(null);
      setDecisionNote("");
      showToastSuccess(
        decisionModal.status === "ACCEPTED"
          ? "Đã duyệt ứng viên"
          : "Đã loại ứng viên",
        "Trạng thái hồ sơ đã được cập nhật.",
      );
      await loadApplicants(selectedJob);
    } catch (error: any) {
      showToastError(
        "Không thể cập nhật ứng viên",
        error.message || "Vui lòng thử lại",
      );
    } finally {
      setIsActionBusy(false);
    }
  };

  const openChatWithCandidate = async (
    seed: CandidateSeed,
    sourceType: "MANUAL" | "AI_SEARCH" | "PROFILE_VIEW" = "MANUAL",
  ) => {
    try {
      setIsActionBusy(true);
      const session = await recruitmentChatService.getOrCreateSession(
        seed.candidateId,
        selectedJob?.id,
        sourceType,
        selectedJob?.kind === "shortterm"
          ? RecruitmentJobContextType.SHORT_TERM_JOB
          : RecruitmentJobContextType.JOB_POSTING,
      );
      loadSessions(selectedJob);
      navigate(`/messages?sessionId=${session.id}`, {
        state: {
          openChatWith: session.id.toString(),
          type: "RECRUITMENT",
        },
      });
    } catch (error: any) {
      showToastError("Không thể mở chat", error.message || "Vui lòng thử lại.");
    } finally {
      setIsActionBusy(false);
    }
  };

  const openRecruitmentMessenger = () => {
    const targetSession = selectedSession
      ? sessions.find((session) => session.id === selectedSession.id) ||
        sessions[0]
      : sessions[0];

    if (!targetSession) {
      navigate("/messages", {
        state: {
          type: "RECRUITMENT",
        },
      });
      return;
    }

    navigate(`/messages?sessionId=${targetSession.id}`, {
      state: {
        openChatWith: targetSession.id.toString(),
        type: "RECRUITMENT",
      },
    });
  };

  const handleRunAiInsight = async (seed?: CandidateSeed) => {
    const target = seed || selectedCandidate;
    if (!selectedJob || !target) {
      showToastError(
        "Thiếu context",
        "Hãy chọn cả job và ứng viên trước khi phân tích.",
      );
      return;
    }

    try {
      setIsAiLoading(true);
      setAiEnhancedResult(null);
      setAiInsight(null);

      const result =
        selectedJob.kind === "shortterm"
          ? await candidateSearchService.getShortTermJobMatchExplanation(
              selectedJob.id,
              target.candidateId,
            )
          : await candidateSearchService.getAIMatchExplanation(
              selectedJob.id,
              target.candidateId,
            );

      setAiInsight(result);
    } catch (error: any) {
      showToastError(
        "Không thể phân tích AI",
        error.message || "Vui lòng kiểm tra gói recruiter.",
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (!orderedJobs.length) {
      setSelectedJobKey(null);
      return;
    }

    if (
      !selectedJobKey ||
      !orderedJobs.some((job) => job.key === selectedJobKey)
    ) {
      setSelectedJobKey(orderedJobs[0].key);
    }
  }, [orderedJobs, selectedJobKey]);

  // Keep active roster item visible without forcing page-level scroll
  useEffect(() => {
    if (!selectedJobKey || !rosterRef.current) return;
    const idx = orderedJobs.findIndex((j) => j.key === selectedJobKey);
    if (idx < 0) return;

    // If active job is not on current roster page, jump to its page
    const pageOfJob = Math.floor(idx / ROSTER_PAGE_SIZE);
    if (pageOfJob !== rosterPage) {
      setRosterPage(pageOfJob);
      return;
    }

    const rosterEl = rosterRef.current;
    const rafId = window.requestAnimationFrame(() => {
      const targetEl = rosterEl.querySelector(
        `[data-job-key="${selectedJobKey}"]`,
      ) as HTMLElement | null;
      if (!targetEl) return;

      const targetLeft = targetEl.offsetLeft;
      const targetRight = targetLeft + targetEl.offsetWidth;
      const visibleLeft = rosterEl.scrollLeft;
      const visibleRight = visibleLeft + rosterEl.clientWidth;

      if (targetLeft < visibleLeft) {
        rosterEl.scrollTo({
          left: Math.max(targetLeft - 8, 0),
          behavior: "smooth",
        });
        return;
      }

      if (targetRight > visibleRight) {
        rosterEl.scrollTo({
          left: targetRight - rosterEl.clientWidth + 8,
          behavior: "smooth",
        });
      }
    });

    return () => window.cancelAnimationFrame(rafId);
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
    setSessions([]);
    setSelectedSession(null);
    setSelectedCandidate(null);
    setPortfolioProfile(null);
    setPortfolioProjects([]);
    setPortfolioCertificates([]);
    setPortfolioCompletedMissions([]);
    setPortfolioError(null);
    setAiInsight(null);
    setAiEnhancedResult(null);
    setApplicantKeyword("");
    syncJobContext(selectedJob);
  }, [selectedJob?.key, subscription?.hasCandidateDatabaseAccess]);

  useEffect(() => {
    setActiveTab("applicants");
  }, [selectedJob?.kind]);

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
              Khu vực nâng cao giúp bạn quản lý toàn bộ luồng tìm kiếm ứng viên
              — từ pipeline đơn ứng tuyển, khu vực nâng cao, phân tích AI cho
              đến chat trực tiếp theo từng candidate, tất cả trong một màn hình
              duy nhất.
            </p>

            <div className="rtw-hero__features">
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon">
                  <Users size={18} />
                </div>
                <div className="rtw-feature-text">
                  <strong>Pipeline ứng viên</strong>
                  <span>
                    Theo dõi đơn ứng tuyển theo từng job với trạng thái trực
                    quan
                  </span>
                </div>
              </div>
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon">
                  <Sparkles size={18} />
                </div>
                <div className="rtw-feature-text">
                  <strong>Phân tích AI</strong>
                  <span>
                    AI phân tích mức độ phù hợp ứng viên với job — dẫn chứng cụ
                    thể
                  </span>
                </div>
              </div>
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon">
                  <FileText size={18} />
                </div>
                <div className="rtw-feature-text">
                  <strong>Đánh giá Portfolio</strong>
                  <span>
                    Xem và đánh giá portfolio, dự án, chứng chỉ của ứng viên
                    ngay trong workspace.
                  </span>
                </div>
              </div>
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon">
                  <MessageSquare size={18} />
                </div>
                <div className="rtw-feature-text">
                  <strong>Chat theo ngữ cảnh</strong>
                  <span>
                    Nhắn tin với ứng viên, gắn đúng job để context luôn rõ ràng
                  </span>
                </div>
              </div>
            </div>

            <div className="rtw-hero__cta">
              <div className="rtw-cta-box">
                <div className="rtw-cta-icon">
                  <Briefcase size={24} />
                </div>
                <div className="rtw-cta-content">
                  <strong>Đăng job đầu tiên để bắt đầu</strong>
                  <span>
                    Tạo việc ngắn hạn hoặc dài hạn, workspace sẽ tự động kích
                    hoạt toàn bộ luồng tuyển dụng cho bạn.
                  </span>
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
                {subscription?.planDisplayName || "Free tier"}
              </div>
              <div className="rtw-aside-card__perks">
                <div className="rtw-perk-item">
                  <CheckCircle2 size={13} />
                  <span>Quản lý job &amp; ứng viên</span>
                </div>
                <div className="rtw-perk-item">
                  <CheckCircle2 size={13} />
                  <span>AI phân tích matching</span>
                </div>
                <div className="rtw-perk-item">
                  <CheckCircle2 size={13} />
                  <span>Chat &amp; đánh giá portfolio</span>
                </div>
                <div className="rtw-perk-item">
                  <CheckCircle2 size={13} />
                  <span>Boost visibility cho job</span>
                </div>
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
              <div className="rtw-tip-icon">
                <Zap size={15} />
              </div>
              <p>
                <strong>Mẹo nhanh:</strong> Việc ngắn hạn (freelance/gig) với mô
                tả rõ ràng, ngân sách minh bạch và thời hạn cụ thể sẽ thu hút
                ứng viên chất lượng cao nhất.
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
          <span
            className="rtw-panel__eyebrow"
            style={{ marginBottom: "0.35rem" }}
          >
            <Crown size={12} />
            Khu vực nâng cao — Recruiter Talent Hub
          </span>
          <div
            style={{
              width: 40,
              height: 2,
              background:
                "linear-gradient(90deg, var(--rtw-cyan), transparent)",
              borderRadius: 999,
              opacity: 0.4,
            }}
          />
          <h2>
            Quản lý toàn bộ luồng tuyển dụng
            <br />
            <span className="rtw-hero__headline--gold">
              trong một workspace
            </span>
          </h2>
          <div className="rtw-hero__chips">
            <span className="rtw-chip rtw-chip--gold">
              <Crown size={13} />
              {subscription?.planDisplayName || "Free tier"}
            </span>
            <span className="rtw-chip rtw-chip--purple">
              <Sparkles size={13} />
              {subscription?.canUseAICandidateSuggestion
                ? "AI phân tích bật"
                : "AI phân tích khóa"}
            </span>
            <span className="rtw-chip rtw-chip--muted">
              <ShieldCheck size={13} />
              {subscription?.hasCandidateDatabaseAccess
                ? "Cơ sở ứng viên"
                : "Cần nâng cấp"}
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
            <h3>{selectedJob?.title || "Chưa chọn job"}</h3>
            <div className="rtw-job-bar__selected-meta">
              {selectedJob && (
                <>
                  <span
                    className={`rtw-status-pill rtw-status-pill--${selectedJob.statusTone}`}
                  >
                    {selectedJob.statusLabel}
                  </span>
                  <span
                    className={`rtw-chip ${selectedJob.kind === "fulltime" ? "rtw-chip--gold" : "rtw-chip--purple"}`}
                  >
                    {selectedJob.kind === "fulltime"
                      ? "Toàn thời gian"
                      : "Ngắn hạn"}
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
                  {selectedJobSkillPreview.length > 0 && (
                    <span className="rtw-inline-stat">
                      <Sparkles size={12} />
                      {selectedJobSkillPreview.join(", ")}
                      {selectedJobRemainingSkills > 0
                        ? ` +${selectedJobRemainingSkills}`
                        : ""}
                    </span>
                  )}
                </>
              )}
            </div>
            {selectedJob && (
              <div className="rtw-job-bar__selected-actions">
                {supportsBoost ? (
                  <details className="rtw-job-bar__boost-details">
                    <summary>
                      <Zap size={12} />
                      Quản lý boost hiển thị
                      <ChevronDown
                        size={12}
                        className="rtw-job-bar__boost-caret"
                      />
                    </summary>
                    <div className="rtw-job-bar__boost">
                      <JobBoostButton
                        jobId={selectedJob.id}
                        jobTitle={selectedJob.title}
                        onBoostCreated={handleBoostStateChange}
                        onBoostCancelled={handleBoostStateChange}
                      />
                    </div>
                  </details>
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
              className={`rtw-job-bar__roster-item rtw-job-bar__roster-item--${job.statusTone} ${job.key === selectedJobKey ? "rtw-job-bar__roster-item--active" : ""}`}
              onClick={() => setSelectedJobKey(job.key)}
            >
              <div className="rtw-job-bar__roster-item__header">
                <span
                  className={`rtw-job-bar__roster-item__kind-dot rtw-job-bar__roster-item__kind-dot--${job.kind}`}
                />
                <span className="rtw-job-bar__roster-item__title">
                  {job.title}
                </span>
              </div>
              <div className="rtw-job-bar__roster-item__footer">
                <div className="rtw-job-bar__roster-item__meta">
                  <Users size={10} />
                  {job.applicantCount || 0}
                </div>
                <span
                  className={`rtw-status-pill rtw-status-pill--${job.statusTone}`}
                  style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem" }}
                >
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
                className={`rtw-tab ${activeTab === "applicants" ? "rtw-tab--active" : ""}`}
                onClick={() => setActiveTab("applicants")}
              >
                <Inbox size={15} />
                Ứng viên
                {applicants.length > 0 && (
                  <span
                    style={{
                      marginLeft: "0.25rem",
                      padding: "0.08rem 0.35rem",
                      borderRadius: "999px",
                      background: "rgba(212,175,55,0.15)",
                      color: "#f0d060",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                    }}
                  >
                    {applicants.length}
                  </span>
                )}
              </button>
              <button className="rtw-tab" onClick={openRecruitmentMessenger}>
                <MessageSquare size={15} />
                Trò chuyện
                {sessions.length > 0 && (
                  <span
                    style={{
                      marginLeft: "0.25rem",
                      padding: "0.08rem 0.35rem",
                      borderRadius: "999px",
                      background: "rgba(74,222,128,0.12)",
                      color: "#86efac",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                    }}
                  >
                    {sessions.length}
                  </span>
                )}
              </button>
            </div>

            {/* === APPLICANTS TAB === */}
            {activeTab === "applicants" && (
              <div className="rtw-feed">
                <div className="rtw-feed__intro">
                  <div>
                    <span className="rtw-panel__eyebrow">
                      <Inbox size={11} />
                      Hộp ứng viên
                    </span>
                    <h3>{selectedJob?.title}</h3>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span className="rtw-status-pill rtw-status-pill--open">
                      {filteredApplicants.length} ứng viên
                    </span>
                  </div>
                </div>

                <div className="rtw-applicant-toolbar">
                  <div className="rtw-applicant-toolbar__filters">
                    <button
                      className={`rtw-chip-btn ${applicantFilter === "all" ? "rtw-chip-btn--selected" : ""}`}
                      onClick={() => setApplicantFilter("all")}
                    >
                      Tất cả ({applicantCounts.all})
                    </button>
                    <button
                      className={`rtw-chip-btn ${applicantFilter === "pending" ? "rtw-chip-btn--selected" : ""}`}
                      onClick={() => setApplicantFilter("pending")}
                    >
                      Chờ duyệt ({applicantCounts.pending})
                    </button>
                    <button
                      className={`rtw-chip-btn ${applicantFilter === "accepted" ? "rtw-chip-btn--selected" : ""}`}
                      onClick={() => setApplicantFilter("accepted")}
                    >
                      Đã duyệt ({applicantCounts.accepted})
                    </button>
                    <button
                      className={`rtw-chip-btn ${applicantFilter === "rejected" ? "rtw-chip-btn--selected" : ""}`}
                      onClick={() => setApplicantFilter("rejected")}
                    >
                      Từ chối ({applicantCounts.rejected})
                    </button>
                  </div>

                  <label className="rtw-search-box" aria-label="Tìm ứng viên">
                    <Search size={13} />
                    <input
                      type="text"
                      value={applicantKeyword}
                      onChange={(event) =>
                        setApplicantKeyword(event.target.value)
                      }
                      placeholder="Tìm theo tên, email, kỹ năng hoặc cover letter"
                    />
                  </label>
                </div>

                {isApplicantsLoading ? (
                  <div className="rtw-loading-block">
                    <Loader2 size={22} className="rtw-spin" />
                    <span>Đang tải ứng viên...</span>
                  </div>
                ) : filteredApplicants.length === 0 ? (
                  <div className="rtw-empty-state">
                    <Users
                      size={24}
                      style={{ color: "#d4af37", opacity: 0.5 }}
                    />
                    <div>
                      <strong>Không có ứng viên nào trong nhóm này</strong>
                      <p>
                        Thử chọn bộ lọc khác hoặc boost job để thu hút thêm ứng
                        viên.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rtw-applicant-list">
                    {filteredApplicants.map((application) => {
                      const seed = toCandidateSeedFromApplicant(application);
                      const completedJobs =
                        getApplicantCompletedJobs(application);

                      return (
                        <article
                          key={application.id}
                          className={`rtw-card rtw-applicant-card ${selectedCandidate?.candidateId === application.userId ? "rtw-card--active" : ""}`}
                          onClick={() => pickCandidate(seed)}
                        >
                          <div className="rtw-card__header">
                            <div className="rtw-identity">
                              {application.userAvatar ? (
                                <img
                                  src={resolveAssetUrl(application.userAvatar)}
                                  alt=""
                                  className="rtw-avatar"
                                />
                              ) : (
                                <div className="rtw-avatar rtw-avatar--fallback">
                                  {getApplicantInitials(
                                    application.userFullName,
                                    application.userEmail,
                                  )}
                                </div>
                              )}
                              <div>
                                <h4>
                                  {getApplicantDisplayName(
                                    application.userFullName,
                                    application.userEmail,
                                  )}
                                </h4>
                                <p>
                                  {getApplicantSubtitle(
                                    application.userProfessionalTitle,
                                    Boolean(application.portfolioSlug),
                                  )}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`rtw-status-pill rtw-status-pill--${application.statusTone}`}
                            >
                              {application.statusLabel}
                            </span>
                          </div>

                          <p className="rtw-card__body">
                            {application.coverLetter ||
                              "Ứng viên chưa để lại thư giới thiệu."}
                          </p>

                          <div className="rtw-card__meta">
                            <span>
                              <Clock3 size={12} />
                              {formatRelativeTime(application.appliedAt)}
                            </span>
                            <span>
                              <Wallet size={12} />
                              {application.budgetLabel}
                            </span>
                            {completedJobs != null && (
                              <span>
                                <Award size={12} />
                                {completedJobs} job đã hoàn thành
                              </span>
                            )}
                            {application.portfolioSlug && (
                              <span>
                                <FileText size={12} />
                                Portfolio công khai
                              </span>
                            )}
                          </div>

                          <div className="rtw-card__actions rtw-card__actions--split">
                            <div className="rtw-applicant-primary-actions">
                              <button
                                className="rtw-chip-btn rtw-chip-btn--cyan"
                                title="Xem dossier"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  pickCandidate(seed);
                                }}
                              >
                                <Eye size={14} />
                                Hồ sơ
                              </button>
                              <button
                                className="rtw-chip-btn"
                                title="Nhắn tin"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChatWithCandidate(seed, "PROFILE_VIEW");
                                }}
                              >
                                <MessageSquare size={14} />
                                Chat
                              </button>
                              {application.canMarkReviewed && (
                                <button
                                  className="rtw-chip-btn rtw-chip-btn--purple"
                                  title="Đánh dấu đã xem"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReviewApplication(application);
                                  }}
                                >
                                  <CheckCircle2 size={14} />
                                  Đã xem
                                </button>
                              )}
                            </div>

                            {(application.canAccept ||
                              application.canReject) && (
                              <div className="rtw-applicant-secondary-actions">
                                {application.canAccept && (
                                  <button
                                    className="rtw-chip-btn rtw-chip-btn--success"
                                    title="Duyệt ứng viên"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDecisionModal({
                                        application,
                                        status: "ACCEPTED",
                                      });
                                      setDecisionNote("");
                                    }}
                                  >
                                    <CheckCircle2 size={14} />
                                    Duyệt
                                  </button>
                                )}
                                {application.canReject && (
                                  <button
                                    className="rtw-chip-btn rtw-chip-btn--danger"
                                    title="Loại ứng viên"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDecisionModal({
                                        application,
                                        status: "REJECTED",
                                      });
                                      setDecisionNote("");
                                    }}
                                  >
                                    <XCircle size={14} />
                                    Từ chối
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
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
                <h3>{selectedCandidate?.fullName || "Chọn ứng viên để xem"}</h3>
              </div>
              {selectedCandidate?.portfolioSlug && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.35rem",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
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
                <Users size={24} style={{ color: "#d4af37", opacity: 0.4 }} />
                <div>
                  <strong>Chưa chọn ứng viên</strong>
                  <p>
                    Chọn một ứng viên trong danh sách để xem hồ sơ chi tiết.
                  </p>
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
                    <Users
                      size={20}
                      style={{ color: "#f87171", opacity: 0.6 }}
                    />
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
                          src={resolveAssetUrl(
                            portfolioProfile.portfolioAvatarUrl ||
                              portfolioProfile.basicAvatarUrl ||
                              selectedCandidate.avatarUrl,
                          )}
                          alt=""
                          className="rtw-dossier-avatar"
                        />
                        <div className="rtw-dossier-identity__info">
                          <strong className="rtw-dossier-name">
                            {portfolioProfile.fullName ||
                              selectedCandidate.fullName}
                          </strong>
                          <span className="rtw-dossier-title">
                            {portfolioProfile.professionalTitle ||
                              selectedCandidate.professionalTitle ||
                              "Ứng viên"}
                          </span>
                          <div className="rtw-dossier-identity__stats">
                            {selectedCandidate.matchScore && (
                              <span className="rtw-dossier-match">
                                <Star size={11} fill="currentColor" />
                                {Math.round(selectedCandidate.matchScore * 100)}
                                % match
                              </span>
                            )}
                            <span className="rtw-dossier-stat">
                              <Briefcase size={11} />
                              {portfolioProfile.yearsOfExperience !== undefined
                                ? `${portfolioProfile.yearsOfExperience}y`
                                : "—"}
                            </span>
                            <span className="rtw-dossier-stat">
                              <FileText size={11} />
                              {portfolioProfile.totalProjects ||
                                portfolioProjects.length}{" "}
                              proj
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Bio + Skills */}
                      <div className="rtw-dossier-bio-skills">
                        <div className="rtw-dossier-bio">
                          <p>
                            {portfolioProfile.tagline ||
                              portfolioProfile.careerGoals ||
                              portfolioProfile.basicBio ||
                              "Chưa có tóm tắt công khai."}
                          </p>
                        </div>
                        {currentPortfolioSkills.length > 0 && (
                          <div className="rtw-dossier-skills-row">
                            {currentPortfolioSkills.map((skill) => (
                              <span
                                key={skill}
                                className="rtw-skill-pill rtw-skill-pill--gold"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="rtw-dossier-meta-row">
                          <span>
                            <Wallet size={11} />
                            {formatCompactCurrency(
                              portfolioProfile.hourlyRate,
                              portfolioProfile.preferredCurrency,
                            )}
                            /giờ
                          </span>
                          <span>
                            <MapPin size={11} />
                            {portfolioProfile.location || "—"}
                          </span>
                          <span>
                            <ShieldCheck size={11} />
                            {portfolioProfile.availabilityStatus || "—"}
                          </span>
                          <span>
                            <CheckCircle2 size={11} />
                            {completedMissionSummary.totalMissions} job đã hoàn
                            thành
                          </span>
                        </div>
                      </div>

                      {/* Col 3: Actions */}
                      <div className="rtw-dossier-actions-col">
                        <div className="rtw-dossier-cta">
                          <button
                            className="rtw-primary-btn"
                            disabled={isActionBusy}
                            onClick={() =>
                              openChatWithCandidate(
                                selectedCandidate,
                                "PROFILE_VIEW",
                              )
                            }
                          >
                            <MessageSquare size={14} />
                            Chat ngay
                          </button>
                          <button
                            className="rtw-secondary-btn"
                            disabled={isAiEnhancedLoading}
                            onClick={async () => {
                              if (!selectedJob || !selectedCandidate) return;
                              setIsAiEnhancedLoading(true);
                              setAiEnhancedResult(null);
                              setAiInsight(null);
                              try {
                                const result =
                                  selectedJob.kind === "shortterm"
                                    ? await candidateSearchService.getShortTermJobMatchExplanation(
                                        selectedJob.id,
                                        selectedCandidate.candidateId,
                                      )
                                    : await candidateSearchService.getAIMatchExplanation(
                                        selectedJob.id,
                                        selectedCandidate.candidateId,
                                      );
                                setAiInsight(result);
                              } catch (e: any) {
                                showToastError(
                                  "Lỗi phân tích",
                                  e.message || "Thử lại sau.",
                                );
                              } finally {
                                setIsAiEnhancedLoading(false);
                              }
                            }}
                          >
                            {isAiEnhancedLoading ? (
                              <Loader2 size={14} className="rtw-spin" />
                            ) : (
                              <Sparkles size={14} />
                            )}
                            Phân tích
                          </button>
                        </div>
                      </div>
                    </div>

                    {aiInsight?.fitAnalysis?.components?.length && (
                      <div
                        style={{
                          marginTop: "1.5rem",
                          background: "rgba(16, 24, 39, 0.72)",
                          border: "1px solid rgba(6, 182, 212, 0.25)",
                          padding: "1.5rem",
                          borderRadius: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "1rem",
                            color: "#06b6d4",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                          }}
                        >
                          <Sparkles size={16} />
                          <span>Độ tương thích với công việc</span>
                          {aiInsight.fitAnalysis.band && (
                            <span
                              style={{
                                marginLeft: "auto",
                                fontSize: "0.72rem",
                                padding: "2px 8px",
                                borderRadius: "999px",
                                border: "1px solid rgba(6, 182, 212, 0.35)",
                                background: "rgba(6, 182, 212, 0.12)",
                              }}
                            >
                              {aiInsight.fitAnalysis.band}
                            </span>
                          )}
                        </div>

                        {aiInsight.fitAnalysis.recommendation && (
                          <p
                            style={{
                              margin: "0 0 1rem",
                              fontSize: "0.8rem",
                              color: "rgba(255,255,255,0.72)",
                              lineHeight: 1.6,
                            }}
                          >
                            {aiInsight.fitAnalysis.recommendation}
                          </p>
                        )}

                        <div style={{ display: "grid", gap: "0.75rem" }}>
                          {aiInsight.fitAnalysis.components!.map(
                            (component) => {
                              const weighted =
                                component.weightedScore ??
                                (component.score || 0) *
                                  (component.weight || 0);
                              return (
                                <div
                                  key={component.key}
                                  style={{
                                    padding: "0.85rem",
                                    borderRadius: "10px",
                                    background: "rgba(6, 182, 212, 0.05)",
                                    border: "1px solid rgba(6, 182, 212, 0.12)",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      gap: "1rem",
                                      marginBottom: "0.45rem",
                                      fontSize: "0.8rem",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "rgba(255,255,255,0.86)",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {component.label} (
                                      {Math.round(
                                        (component.weight || 0) * 100,
                                      )}
                                      %)
                                    </span>
                                    <strong style={{ color: "#22d3ee" }}>
                                      +{Math.round(weighted * 100)}%
                                    </strong>
                                  </div>
                                  <div
                                    style={{
                                      height: "6px",
                                      background: "rgba(255,255,255,0.08)",
                                      borderRadius: "3px",
                                      overflow: "hidden",
                                      marginBottom: component.explanation
                                        ? "0.5rem"
                                        : 0,
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: "100%",
                                        background:
                                          "linear-gradient(90deg, #06b6d4, #22d3ee)",
                                        width: `${Math.min(100, Math.max(0, (component.score || 0) * 100))}%`,
                                        borderRadius: "3px",
                                      }}
                                    />
                                  </div>
                                  {component.explanation && (
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: "0.74rem",
                                        color: "rgba(255,255,255,0.58)",
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {component.explanation}
                                    </p>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>

                        {(aiInsight.fitAnalysis.skillBreakdown?.length ?? 0) >
                          0 && (
                          <div
                            style={{
                              marginTop: "1rem",
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                              gap: "0.75rem",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  display: "block",
                                  fontSize: "0.74rem",
                                  color: "#86efac",
                                  marginBottom: "0.4rem",
                                }}
                              >
                                Matched skills
                              </strong>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "0.3rem",
                                }}
                              >
                                {aiInsight.fitAnalysis
                                  .skillBreakdown!.filter(
                                    (skill) => skill.matched,
                                  )
                                  .slice(0, 10)
                                  .map((skill) => (
                                    <span
                                      key={skill.skill}
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        fontSize: "0.72rem",
                                        color: "#86efac",
                                        border:
                                          "1px solid rgba(134, 239, 172, 0.25)",
                                        background: "rgba(34, 197, 94, 0.1)",
                                      }}
                                    >
                                      {skill.skill}
                                    </span>
                                  ))}
                              </div>
                            </div>
                            <div>
                              <strong
                                style={{
                                  display: "block",
                                  fontSize: "0.74rem",
                                  color: "#fca5a5",
                                  marginBottom: "0.4rem",
                                }}
                              >
                                Missing skills
                              </strong>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "0.3rem",
                                }}
                              >
                                {aiInsight.fitAnalysis
                                  .skillBreakdown!.filter(
                                    (skill) => !skill.matched,
                                  )
                                  .slice(0, 10)
                                  .map((skill) => (
                                    <span
                                      key={skill.skill}
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        fontSize: "0.72rem",
                                        color: "#fca5a5",
                                        border:
                                          "1px solid rgba(252, 165, 165, 0.25)",
                                        background: "rgba(239, 68, 68, 0.08)",
                                      }}
                                    >
                                      {skill.skill}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {(aiInsight.fitAnalysis.evidenceHighlights?.length ??
                          0) > 0 && (
                          <div
                            style={{
                              marginTop: "1rem",
                              padding: "0.85rem",
                              borderRadius: "10px",
                              background: "rgba(255,255,255,0.04)",
                              color: "rgba(255,255,255,0.68)",
                              fontSize: "0.76rem",
                              lineHeight: 1.55,
                            }}
                          >
                            <strong style={{ color: "#c4b5fd" }}>
                              Evidence:
                            </strong>{" "}
                            {aiInsight.fitAnalysis
                              .evidenceHighlights!.slice(0, 4)
                              .map((item) => item.title)
                              .join(" | ")}
                          </div>
                        )}

                        {(aiInsight.fitAnalysis.riskFlags?.length ?? 0) > 0 && (
                          <div
                            style={{
                              marginTop: "0.75rem",
                              padding: "0.85rem",
                              borderRadius: "10px",
                              background: "rgba(239, 68, 68, 0.08)",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              color: "#fca5a5",
                              fontSize: "0.76rem",
                              lineHeight: 1.55,
                            }}
                          >
                            <strong>Risk flags:</strong>{" "}
                            {aiInsight.fitAnalysis
                              .riskFlags!.slice(0, 4)
                              .join(" | ")}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DETERMINISTIC RANKING BREAKDOWN */}
                    {aiInsight &&
                      !aiInsight.fitAnalysis?.components?.length &&
                      aiInsight.skillMatchScore !== undefined &&
                      (() => {
                        // Pre-compute local helper data for skill overlap in projects & missions
                        const requiredSkills =
                          selectedJob?.requiredSkills || [];
                        const reqSkillsLower = requiredSkills.map((s) =>
                          s.toLowerCase().trim(),
                        );

                        // Skill overlap in projects
                        const projectSkillOverlap = portfolioProjects
                          .flatMap((p) => p.tools || [])
                          .filter((t) =>
                            reqSkillsLower.some((rs) =>
                              t.toLowerCase().includes(rs),
                            ),
                          );
                        const uniqueProjectSkillOverlap = [
                          ...new Set(
                            projectSkillOverlap.map((s) => s.toLowerCase()),
                          ),
                        ];

                        // Skill overlap in missions
                        const missionSkillOverlap = portfolioCompletedMissions
                          .flatMap((m) => m.requiredSkills || [])
                          .filter((t) =>
                            reqSkillsLower.some((rs) =>
                              t.toLowerCase().includes(rs),
                            ),
                          );
                        const uniqueMissionSkillOverlap = [
                          ...new Set(
                            missionSkillOverlap.map((s) => s.toLowerCase()),
                          ),
                        ];

                        const matchedSkills = aiInsight.matchedSkills || [];
                        const unmatchedSkills = aiInsight.unmatchedSkills || [];
                        const totalRequired =
                          aiInsight.totalRequiredSkills || 0;
                        const completedMissions =
                          aiInsight.completedMissionsCount ??
                          portfolioCompletedMissions.length;
                        const totalCerts =
                          aiInsight.totalCertificatesCount ??
                          portfolioCertificates.length;
                        const totalProjects =
                          aiInsight.totalProjects ?? portfolioProjects.length;

                        const skillPct =
                          totalRequired > 0
                            ? Math.round(
                                (matchedSkills.length / totalRequired) * 100,
                              )
                            : 0;

                        return (
                          <div
                            style={{
                              marginTop: "1.5rem",
                              background: "rgba(16, 24, 39, 0.7)",
                              border: "1px solid rgba(6, 182, 212, 0.25)",
                              padding: "1.5rem",
                              borderRadius: "14px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginBottom: "1.25rem",
                                color: "#06b6d4",
                                fontWeight: "bold",
                                fontSize: "0.9rem",
                              }}
                            >
                              <Sparkles size={16} />
                              <span>Phân tích Độ phù hợp (Thuật toán)</span>
                              <span
                                style={{
                                  marginLeft: "auto",
                                  fontSize: "0.75rem",
                                  color: "rgba(255,255,255,0.4)",
                                }}
                              >
                                Trọng số: Kỹ năng(50%), Dự án(25%),
                                Mission(15%), Chứng chỉ(10%)
                              </span>
                            </div>

                            {/* ── SKILL SECTION (50%) ── */}
                            <div
                              style={{
                                marginBottom: "1.25rem",
                                padding: "1rem",
                                background: "rgba(6, 182, 212, 0.05)",
                                borderRadius: "10px",
                                border: "1px solid rgba(6, 182, 212, 0.12)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.85)",
                                  }}
                                >
                                  🎯 Kỹ năng (50%)
                                </span>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                  }}
                                >
                                  {aiInsight.primarySkillMatch && (
                                    <span
                                      style={{
                                        color: "#06b6d4",
                                        fontWeight: 600,
                                        fontSize: "0.72rem",
                                        padding: "2px 8px",
                                        background: "rgba(6, 182, 212, 0.15)",
                                        borderRadius: "6px",
                                        border:
                                          "1px solid rgba(6, 182, 212, 0.3)",
                                      }}
                                      title="Primary skill chiếm tối đa 20% (tức 40% của khung điểm Kỹ năng)"
                                    >
                                      ⭐ Primary Match (20%)
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: "0.82rem",
                                      fontWeight: "bold",
                                      color: "#06b6d4",
                                    }}
                                  >
                                    +
                                    {Math.round(
                                      (aiInsight.skillMatchScore || 0) * 100,
                                    )}
                                    %
                                  </span>
                                </div>
                              </div>
                              <div
                                style={{
                                  height: "6px",
                                  background: "rgba(255,255,255,0.08)",
                                  borderRadius: "3px",
                                  overflow: "hidden",
                                  marginBottom: "0.75rem",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    background:
                                      "linear-gradient(90deg, #06b6d4, #22d3ee)",
                                    width: `${Math.min(100, ((aiInsight.skillMatchScore || 0) / 0.5) * 100)}%`,
                                    borderRadius: "3px",
                                    transition: "width 0.6s ease",
                                  }}
                                ></div>
                              </div>
                              {totalRequired > 0 ? (
                                <div
                                  style={{
                                    fontSize: "0.76rem",
                                    color: "rgba(255,255,255,0.6)",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  <p style={{ margin: "0 0 0.4rem" }}>
                                    Khớp{" "}
                                    <strong style={{ color: "#22d3ee" }}>
                                      {matchedSkills.length}/{totalRequired}
                                    </strong>{" "}
                                    kỹ năng yêu cầu ({skillPct}%)
                                  </p>
                                  {matchedSkills.length > 0 && (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "0.3rem",
                                        marginBottom: "0.4rem",
                                      }}
                                    >
                                      {matchedSkills.map((s) => (
                                        <span
                                          key={s}
                                          style={{
                                            padding: "2px 8px",
                                            background:
                                              "rgba(34, 211, 238, 0.12)",
                                            border:
                                              "1px solid rgba(34, 211, 238, 0.3)",
                                            borderRadius: "4px",
                                            fontSize: "0.72rem",
                                            color: "#22d3ee",
                                          }}
                                        >
                                          ✓ {s}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {unmatchedSkills.length > 0 && (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "0.3rem",
                                      }}
                                    >
                                      {unmatchedSkills.map((s) => (
                                        <span
                                          key={s}
                                          style={{
                                            padding: "2px 8px",
                                            background:
                                              "rgba(239, 68, 68, 0.08)",
                                            border:
                                              "1px solid rgba(239, 68, 68, 0.25)",
                                            borderRadius: "4px",
                                            fontSize: "0.72rem",
                                            color: "#f87171",
                                          }}
                                        >
                                          ✗ {s}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "0.76rem",
                                    color: "rgba(255,255,255,0.5)",
                                  }}
                                >
                                  Không có yêu cầu kỹ năng cụ thể cho vị trí
                                  này.
                                </p>
                              )}
                            </div>

                            {/* ── PROJECT SECTION (25%) ── */}
                            <div
                              style={{
                                marginBottom: "1.25rem",
                                padding: "1rem",
                                background: "rgba(59, 130, 246, 0.04)",
                                borderRadius: "10px",
                                border: "1px solid rgba(59, 130, 246, 0.12)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.85)",
                                  }}
                                >
                                  📁 Dự án (25%)
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: "bold",
                                    color: "#3b82f6",
                                  }}
                                >
                                  +
                                  {Math.round(
                                    (aiInsight.projectMatchScore || 0) * 100,
                                  )}
                                  %
                                </span>
                              </div>
                              <div
                                style={{
                                  height: "6px",
                                  background: "rgba(255,255,255,0.08)",
                                  borderRadius: "3px",
                                  overflow: "hidden",
                                  marginBottom: "0.75rem",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    background:
                                      "linear-gradient(90deg, #3b82f6, #60a5fa)",
                                    width: `${Math.min(100, ((aiInsight.projectMatchScore || 0) / 0.25) * 100)}%`,
                                    borderRadius: "3px",
                                    transition: "width 0.6s ease",
                                  }}
                                ></div>
                              </div>
                              <div
                                style={{
                                  fontSize: "0.76rem",
                                  color: "rgba(255,255,255,0.6)",
                                  lineHeight: 1.6,
                                }}
                              >
                                <p style={{ margin: "0 0 0.3rem" }}>
                                  <strong style={{ color: "#60a5fa" }}>
                                    {totalProjects}
                                  </strong>{" "}
                                  dự án trong portfolio{" "}
                                  {totalProjects === 0
                                    ? "— chưa có dự án nào."
                                    : totalProjects < 3
                                      ? "— khá ít, đạt một phần điểm kinh nghiệm."
                                      : "— portfolio đầy đủ (tối đa điểm kinh nghiệm)."}
                                </p>
                                {uniqueProjectSkillOverlap.length > 0 &&
                                  reqSkillsLower.length > 0 && (
                                    <p style={{ margin: "0 0 0.3rem" }}>
                                      Kỹ năng trùng khớp với yêu cầu job trong
                                      dự án:{" "}
                                      <strong style={{ color: "#60a5fa" }}>
                                        {uniqueProjectSkillOverlap.join(", ")}
                                      </strong>
                                    </p>
                                  )}
                                {uniqueProjectSkillOverlap.length === 0 &&
                                  reqSkillsLower.length > 0 &&
                                  totalProjects > 0 && (
                                    <p
                                      style={{
                                        margin: 0,
                                        color: "#fbbf24",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      ⚠ Dự án chưa liên quan trực tiếp đến kỹ
                                      năng yêu cầu của job.
                                    </p>
                                  )}
                              </div>
                            </div>

                            {/* ── CERTIFICATE SECTION (10%) ── */}
                            <div
                              style={{
                                marginBottom: "1.25rem",
                                padding: "1rem",
                                background: "rgba(6, 182, 212, 0.04)",
                                borderRadius: "10px",
                                border: "1px solid rgba(6, 182, 212, 0.12)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.85)",
                                  }}
                                >
                                  🏅 Chứng chỉ (10%)
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: "bold",
                                    color: "#06b6d4",
                                  }}
                                >
                                  +
                                  {Math.round(
                                    (aiInsight.certMatchScore || 0) * 100,
                                  )}
                                  %
                                </span>
                              </div>
                              <div
                                style={{
                                  height: "6px",
                                  background: "rgba(255,255,255,0.08)",
                                  borderRadius: "3px",
                                  overflow: "hidden",
                                  marginBottom: "0.75rem",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    background:
                                      "linear-gradient(90deg, #06b6d4, #22d3ee)",
                                    width: `${Math.min(100, ((aiInsight.certMatchScore || 0) / 0.1) * 100)}%`,
                                    borderRadius: "3px",
                                    transition: "width 0.6s ease",
                                  }}
                                ></div>
                              </div>
                              <div
                                style={{
                                  fontSize: "0.76rem",
                                  color: "rgba(255,255,255,0.6)",
                                  lineHeight: 1.6,
                                }}
                              >
                                <p style={{ margin: 0 }}>
                                  <strong style={{ color: "#22d3ee" }}>
                                    {totalCerts}
                                  </strong>{" "}
                                  chứng chỉ{" "}
                                  {totalCerts === 0
                                    ? "— chưa có chứng chỉ, khuyến khích bổ sung."
                                    : totalCerts < 2
                                      ? "— có chứng chỉ cơ bản."
                                      : "— đạt điểm lý thuyết tối đa."}
                                </p>
                              </div>
                            </div>

                            {/* ── MISSION SECTION (15%) ── */}
                            <div
                              style={{
                                padding: "1rem",
                                background: "rgba(59, 130, 246, 0.04)",
                                borderRadius: "10px",
                                border: "1px solid rgba(59, 130, 246, 0.12)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.85)",
                                  }}
                                >
                                  🚀 Missions hoàn thành (15%)
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: "bold",
                                    color: "#3b82f6",
                                  }}
                                >
                                  +
                                  {Math.round(
                                    (aiInsight.missionMatchScore || 0) * 100,
                                  )}
                                  %
                                </span>
                              </div>
                              <div
                                style={{
                                  height: "6px",
                                  background: "rgba(255,255,255,0.08)",
                                  borderRadius: "3px",
                                  overflow: "hidden",
                                  marginBottom: "0.75rem",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    background:
                                      "linear-gradient(90deg, #3b82f6, #60a5fa)",
                                    width: `${Math.min(100, ((aiInsight.missionMatchScore || 0) / 0.15) * 100)}%`,
                                    borderRadius: "3px",
                                    transition: "width 0.6s ease",
                                  }}
                                ></div>
                              </div>
                              <div
                                style={{
                                  fontSize: "0.76rem",
                                  color: "rgba(255,255,255,0.6)",
                                  lineHeight: 1.6,
                                }}
                              >
                                <p style={{ margin: "0 0 0.3rem" }}>
                                  <strong style={{ color: "#60a5fa" }}>
                                    {completedMissions}
                                  </strong>{" "}
                                  nhiệm vụ hoàn thành{" "}
                                  {completedMissions === 0
                                    ? "— chưa hoàn thành nhiệm vụ nào trên hệ thống."
                                    : completedMissions < 3
                                      ? "— đạt một phần điểm kinh nghiệm thực chiến."
                                      : "— đạt điểm thực chiến tối đa."}
                                </p>
                                {uniqueMissionSkillOverlap.length > 0 &&
                                  reqSkillsLower.length > 0 && (
                                    <p style={{ margin: 0 }}>
                                      Kỹ năng trùng khớp với yêu cầu job trong
                                      missions:{" "}
                                      <strong style={{ color: "#60a5fa" }}>
                                        {uniqueMissionSkillOverlap.join(", ")}
                                      </strong>
                                    </p>
                                  )}
                                {uniqueMissionSkillOverlap.length === 0 &&
                                  reqSkillsLower.length > 0 &&
                                  completedMissions > 0 && (
                                    <p
                                      style={{
                                        margin: 0,
                                        color: "#fbbf24",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      ⚠ Missions chưa liên quan trực tiếp đến kỹ
                                      năng yêu cầu.
                                    </p>
                                  )}
                              </div>
                            </div>

                            {/* ── OVERALL VERDICT ── */}
                            <div
                              style={{
                                marginTop: "1.25rem",
                                padding: "0.75rem 1rem",
                                background: "rgba(6, 182, 212, 0.08)",
                                borderRadius: "8px",
                                border: "1px solid rgba(6, 182, 212, 0.2)",
                                fontSize: "0.78rem",
                                color: "rgba(255,255,255,0.7)",
                                lineHeight: 1.6,
                              }}
                            >
                              <strong style={{ color: "#06b6d4" }}>
                                💡 Tổng kết:
                              </strong>{" "}
                              {(aiInsight.matchScore || 0) >= 0.8
                                ? "Ứng viên phù hợp xuất sắc — đáp ứng hầu hết yêu cầu, nên ưu tiên liên hệ."
                                : (aiInsight.matchScore || 0) >= 0.5
                                  ? "Ứng viên phù hợp tốt — có tiềm năng nhưng cần đánh giá thêm một số kỹ năng thiếu."
                                  : (aiInsight.matchScore || 0) >= 0.25
                                    ? "Ứng viên phù hợp trung bình — thiếu một số yếu tố quan trọng, cần cân nhắc kỹ."
                                    : "Ứng viên phù hợp thấp — thiếu nhiều kỹ năng/kinh nghiệm yêu cầu."}
                            </div>
                          </div>
                        );
                      })()}

                    {/* ── AI ENHANCED ANALYSIS (Optional) ── */}
                    {aiEnhancedResult && (
                      <div
                        style={{
                          marginTop: "1.5rem",
                          background: "rgba(139, 92, 246, 0.06)",
                          border: "1px solid rgba(139, 92, 246, 0.25)",
                          padding: "1.5rem",
                          borderRadius: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "1rem",
                          }}
                        >
                          <Zap size={16} style={{ color: "#a78bfa" }} />
                          <span
                            style={{
                              fontWeight: "bold",
                              color: "#a78bfa",
                              fontSize: "0.9rem",
                            }}
                          >
                            AI Phân tích nâng cao
                          </span>
                          {aiEnhancedResult.aiAnalysis?.modelUsed && (
                            <span
                              style={{
                                marginLeft: "auto",
                                fontSize: "0.68rem",
                                color: "rgba(255,255,255,0.35)",
                                padding: "2px 6px",
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: "4px",
                              }}
                            >
                              {aiEnhancedResult.aiAnalysis.modelUsed} •{" "}
                              {aiEnhancedResult.aiAnalysis.processingTimeMs}ms
                            </span>
                          )}
                        </div>

                        {/* Verdict Banner */}
                        <div
                          style={{
                            padding: "0.75rem 1rem",
                            borderRadius: "8px",
                            marginBottom: "1rem",
                            background:
                              aiEnhancedResult.verdict === "STRONG_ACCEPT" ||
                              aiEnhancedResult.verdict === "ACCEPT"
                                ? "rgba(74, 222, 128, 0.1)"
                                : aiEnhancedResult.verdict === "REJECT"
                                  ? "rgba(239, 68, 68, 0.1)"
                                  : "rgba(251, 191, 36, 0.1)",
                            border: `1px solid ${aiEnhancedResult.verdict === "STRONG_ACCEPT" || aiEnhancedResult.verdict === "ACCEPT" ? "rgba(74, 222, 128, 0.3)" : aiEnhancedResult.verdict === "REJECT" ? "rgba(239, 68, 68, 0.3)" : "rgba(251, 191, 36, 0.3)"}`,
                            fontSize: "0.82rem",
                            lineHeight: 1.6,
                            color: "rgba(255,255,255,0.8)",
                          }}
                        >
                          <strong>{aiEnhancedResult.recommendation}</strong>
                        </div>

                        {/* AI Fit Summary */}
                        {aiEnhancedResult.aiAnalysis?.fitSummary && (
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "rgba(255,255,255,0.7)",
                              marginBottom: "1rem",
                              lineHeight: 1.6,
                              padding: "0.75rem",
                              background: "rgba(139, 92, 246, 0.05)",
                              borderRadius: "8px",
                            }}
                          >
                            <strong style={{ color: "#c4b5fd" }}>
                              Tóm tắt AI:
                            </strong>{" "}
                            {aiEnhancedResult.aiAnalysis.fitSummary}
                          </div>
                        )}

                        {/* AI Skill Signals */}
                        {(aiEnhancedResult.aiAnalysis?.skillSignals?.length ??
                          0) > 0 && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <p
                              style={{
                                fontSize: "0.76rem",
                                color: "#c4b5fd",
                                fontWeight: 600,
                                marginBottom: "0.5rem",
                              }}
                            >
                              Tín hiệu kỹ năng từ AI:
                            </p>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.3rem",
                              }}
                            >
                              {aiEnhancedResult
                                .aiAnalysis!.skillSignals!.slice(0, 8)
                                .map((sig, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      padding: "3px 8px",
                                      borderRadius: "4px",
                                      fontSize: "0.72rem",
                                      background:
                                        sig.relevanceScore >= 0.7
                                          ? "rgba(74, 222, 128, 0.1)"
                                          : sig.relevanceScore >= 0.4
                                            ? "rgba(251, 191, 36, 0.1)"
                                            : "rgba(239, 68, 68, 0.08)",
                                      border: `1px solid ${sig.relevanceScore >= 0.7 ? "rgba(74, 222, 128, 0.3)" : sig.relevanceScore >= 0.4 ? "rgba(251, 191, 36, 0.3)" : "rgba(239, 68, 68, 0.25)"}`,
                                      color:
                                        sig.relevanceScore >= 0.7
                                          ? "#4ade80"
                                          : sig.relevanceScore >= 0.4
                                            ? "#fbbf24"
                                            : "#f87171",
                                    }}
                                  >
                                    {sig.skill} (
                                    {Math.round(sig.relevanceScore * 100)}%)
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}

                        {aiEnhancedResult.aiError && (
                          <p
                            style={{
                              fontSize: "0.76rem",
                              color: "#fbbf24",
                              fontStyle: "italic",
                            }}
                          >
                            ⚠ {aiEnhancedResult.aiError}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ── BOTTOM ROW: Projects | Certificates | Completed Tasks ── */}
                    <div className="rtw-dossier-bottom-row">
                      {/* Projects */}
                      <div className="rtw-dossier-section-card">
                        <div className="rtw-dossier-section-card__header">
                          <FileText size={13} />
                          <strong>Dự án nổi bật</strong>
                          <span className="rtw-dossier-count">
                            {portfolioProjects.length}
                          </span>
                        </div>
                        <div className="rtw-dossier-project-list">
                          {portfolioProjects.slice(0, 3).map((project) => (
                            <div
                              key={project.id || project.title}
                              className="rtw-dossier-project-item"
                            >
                              <strong>{project.title}</strong>
                              <p>
                                {project.description?.slice(0, 100)}
                                {project.description?.length > 100 ? "…" : ""}
                              </p>
                              {(project.tools?.length ?? 0) > 0 && (
                                <div className="rtw-dossier-tech-row">
                                  {(project.tools ?? [])
                                    .slice(0, 4)
                                    .map((t: string) => (
                                      <span
                                        key={t}
                                        className="rtw-skill-pill rtw-skill-pill--subtle"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {portfolioProjects.length === 0 && (
                            <p className="rtw-dossier-empty">
                              Chưa có dự án công khai.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Certificates */}
                      <div className="rtw-dossier-section-card">
                        <div className="rtw-dossier-section-card__header">
                          <CheckCircle2 size={13} />
                          <strong>Chứng chỉ</strong>
                          <span className="rtw-dossier-count">
                            {portfolioCertificates.length}
                          </span>
                        </div>
                        <div className="rtw-dossier-cert-list">
                          {portfolioCertificates.slice(0, 3).map((cert) => (
                            <div
                              key={cert.id || cert.title}
                              className="rtw-dossier-cert-item"
                            >
                              <strong>{cert.title}</strong>
                              <span>{cert.issuingOrganization}</span>
                              {cert.issueDate && (
                                <span className="rtw-dossier-date">
                                  <Clock3 size={10} />
                                  {new Date(cert.issueDate).toLocaleDateString(
                                    "vi-VN",
                                    { month: "short", year: "numeric" },
                                  )}
                                </span>
                              )}
                            </div>
                          ))}
                          {portfolioCertificates.length === 0 && (
                            <p className="rtw-dossier-empty">
                              Chưa có chứng chỉ công khai.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Completed missions */}
                      <div className="rtw-dossier-section-card">
                        <div className="rtw-dossier-section-card__header">
                          <Briefcase size={13} />
                          <strong>Nhiệm vụ đã hoàn thành</strong>
                          <span className="rtw-dossier-count">
                            {portfolioCompletedMissions.length}
                          </span>
                        </div>
                        <div className="rtw-dossier-mission-list">
                          {portfolioCompletedMissions
                            .slice(0, 3)
                            .map((mission) => (
                              <div
                                key={`${mission.applicationId}-${mission.jobId || mission.jobTitle}`}
                                className="rtw-dossier-mission-item"
                              >
                                <div className="rtw-dossier-mission-item__header">
                                  <strong>{mission.jobTitle}</strong>
                                  <span
                                    className={`rtw-status-pill rtw-status-pill--${mission.status === "PAID" ? "accepted" : "open"}`}
                                  >
                                    {mission.status === "PAID"
                                      ? "Đã thanh toán"
                                      : "Hoàn thành"}
                                  </span>
                                </div>
                                <p>
                                  {mission.workNote ||
                                    mission.jobDescription ||
                                    `Đã hoàn thành nhiệm vụ cho ${mission.recruiterCompanyName || mission.recruiterName}.`}
                                </p>
                                <div className="rtw-dossier-tech-row">
                                  {(mission.requiredSkills || [])
                                    .slice(0, 3)
                                    .map((skill) => (
                                      <span
                                        key={skill}
                                        className="rtw-skill-pill rtw-skill-pill--subtle"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  {mission.rating != null && (
                                    <span className="rtw-skill-pill rtw-skill-pill--subtle">
                                      <Star size={10} />
                                      {mission.rating.toFixed(1)}/5
                                    </span>
                                  )}
                                  {mission.completedAt && (
                                    <span className="rtw-skill-pill rtw-skill-pill--subtle">
                                      <Clock3 size={10} />
                                      {formatShortDate(mission.completedAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          {portfolioCompletedMissions.length === 0 && (
                            <p className="rtw-dossier-empty">
                              Chưa có nhiệm vụ hoàn thành công khai.
                            </p>
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
        <div
          className="rtw-modal-backdrop"
          onClick={() => setDecisionModal(null)}
        >
          <div
            className="rtw-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="rtw-panel__eyebrow">
              {decisionModal.status === "ACCEPTED" ? (
                <CheckCircle2 size={12} />
              ) : (
                <XCircle size={12} />
              )}
              {decisionModal.status === "ACCEPTED"
                ? "Duyệt ứng viên"
                : "Loại ứng viên"}
            </span>
            <h3>{decisionModal.application.userFullName}</h3>
            <p>
              {decisionModal.status === "ACCEPTED"
                ? "Nhập lời nhắn để candidate nhận email và biết bước tiếp theo."
                : "Nhập lý do để recruiter history và email phản hồi nhất quán."}
            </p>
            <textarea
              className="rtw-textarea"
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder={
                decisionModal.status === "ACCEPTED"
                  ? "Ví dụ: Portfolio phù hợp, mời bạn vào vòng interview..."
                  : "Ví dụ: Kỹ năng hiện tại chưa khớp với yêu cầu job..."
              }
            />
            <div className="rtw-modal__actions">
              <button
                className="rtw-secondary-btn"
                onClick={() => setDecisionModal(null)}
              >
                Huỷ
              </button>
              <button
                className="rtw-primary-btn"
                disabled={isActionBusy}
                onClick={handleConfirmDecision}
              >
                {isActionBusy ? (
                  <Loader2 size={14} className="rtw-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
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
