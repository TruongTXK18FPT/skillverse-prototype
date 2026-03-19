import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  CheckCircle2,
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
import { JobApplicationResponse, JobPostingResponse, JobStatus } from '../../data/jobDTOs';
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

type TalentTab = 'applicants' | 'discover' | 'chats';
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
  if (amount === undefined || amount === null) return 'Chưa cập nhật';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatShortDate = (value?: string): string => {
  if (!value) return 'Chưa có';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatRelativeTime = (value?: string): string => {
  if (!value) return 'Chưa cập nhật';
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffHours < 1) return 'Vừa xong';
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
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
    case JobStatus.OPEN:
      return 'Đang tuyển';
    case JobStatus.IN_PROGRESS:
      return 'Draft';
    case JobStatus.CLOSED:
      return 'Đã đóng';
    case JobStatus.PENDING_APPROVAL:
      return 'Chờ duyệt';
    case JobStatus.REJECTED:
      return 'Bị từ chối';
    default:
      return status;
  }
};

const getSessionStatusLabel = (status: RecruitmentSessionStatus): string => {
  switch (status) {
    case RecruitmentSessionStatus.CONTACTED:
      return 'Đã liên hệ';
    case RecruitmentSessionStatus.INTERESTED:
      return 'Quan tâm';
    case RecruitmentSessionStatus.INVITED:
      return 'Đã mời';
    case RecruitmentSessionStatus.APPLICATION_RECEIVED:
      return 'Đã nhận đơn';
    case RecruitmentSessionStatus.SCREENING:
      return 'Sàng lọc';
    case RecruitmentSessionStatus.OFFER_SENT:
      return 'Đã gửi offer';
    case RecruitmentSessionStatus.HIRED:
      return 'Đã tuyển';
    case RecruitmentSessionStatus.NOT_INTERESTED:
      return 'Không quan tâm';
    case RecruitmentSessionStatus.ARCHIVED:
      return 'Lưu trữ';
    default:
      return status;
  }
};

const getApplicationStatusLabel = (status: JobApplicationResponse['status']): string => {
  switch (status) {
    case 'PENDING':
      return 'Mới apply';
    case 'REVIEWED':
      return 'Đã xem';
    case 'ACCEPTED':
      return 'Đã duyệt';
    case 'REJECTED':
      return 'Đã loại';
    default:
      return status;
  }
};

const RecruiterTalentWorkspace = ({ jobs }: RecruiterTalentWorkspaceProps) => {
  const { user } = useAuth();
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

  const [searchQuery, setSearchQuery] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [searchSkills, setSearchSkills] = useState<string[]>([]);
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
      const result = await jobService.getJobApplicants(jobId, 0, 12);
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
          query: searchQuery || undefined,
          skills: searchSkills,
          hasPortfolio: true,
          jobId,
          enableAIMatching: subscription.canUseAICandidateSuggestion,
        },
        0,
        12,
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

  const handleAddSkill = () => {
    const nextSkill = skillInput.trim();
    if (!nextSkill || searchSkills.includes(nextSkill)) return;
    setSearchSkills((current) => [...current, nextSkill]);
    setSkillInput('');
  };

  const handleDiscoverySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedJobId) return;
    await loadDiscoveries(selectedJobId, true);
  };

  const handleReviewApplication = async (application: JobApplicationResponse) => {
    try {
      setIsActionBusy(true);
      await jobService.updateApplicationStatus(application.id, {
        status: 'REVIEWED',
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
        status: decisionModal.status,
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
      await loadSessions(selectedJobId);
      await pickCandidate(seed, session);
      setActiveTab('chats');
      showSuccess('Đã mở chat', 'Conversation đã được gắn đúng context job.');
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
        <p>Đang khởi tạo recruiter talent workspace...</p>
      </div>
    );
  }

  if (!orderedJobs.length) {
    return (
      <div className="rtw-shell">
        {/* Hero Banner */}
        <section className="rtw-hero rtw-hero--empty">
          <div className="rtw-hero__intro">
            <div className="rtw-hero__badge">
              <span className="rtw-badge-pill rtw-badge-pill--glow">
                <Rocket size={13} />
                Sẵn sàng tuyển dụng
              </span>
            </div>

            <h2 className="rtw-hero__headline">
              Không gian tuyển dụng thông minh
              <br />
              <span className="rtw-hero__headline--accent">dành riêng cho bạn</span>
            </h2>

            <p className="rtw-hero__desc">
              Recruiter Talent Workspace giúp bạn quản lý toàn bộ luồng tìm kiếm ứng viên —
              từ pipeline đơn ứng tuyển, AI talent discovery, review portfolio cho đến chat
              trực tiếp theo từng candidate, tất cả trong một màn hình duy nhất.
            </p>

            <div className="rtw-hero__features">
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon">
                  <Users size={18} />
                </div>
                <div className="rtw-feature-text">
                  <strong>Applicant Pipeline</strong>
                  <span>Theo dõi đơn ứng tuyển theo từng job với trạng thái trực quan</span>
                </div>
              </div>
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon">
                  <Sparkles size={18} />
                </div>
                <div className="rtw-feature-text">
                  <strong>AI Talent Discovery</strong>
                  <span>Tìm kiếm ứng viên tiềm năng phù hợp với job tự động bằng AI</span>
                </div>
              </div>
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon">
                  <FileText size={18} />
                </div>
                <div className="rtw-feature-text">
                  <strong>Portfolio Review</strong>
                  <span>Xem và đánh giá portfolio, dự án, chứng chỉ của ứng viên ngay trong workspace</span>
                </div>
              </div>
              <div className="rtw-feature-item">
                <div className="rtw-feature-icon">
                  <MessageSquare size={18} />
                </div>
                <div className="rtw-feature-text">
                  <strong>Contextual Chat</strong>
                  <span>Nhắn tin với ứng viên, gắn đúng job để context luôn rõ ràng</span>
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
                <div className="rtw-perk-item">
                  <CheckCircle2 size={13} />
                  <span>Quản lý job & ứng viên</span>
                </div>
                <div className="rtw-perk-item">
                  <CheckCircle2 size={13} />
                  <span>AI talent matching</span>
                </div>
                <div className="rtw-perk-item">
                  <CheckCircle2 size={13} />
                  <span>Chat & portfolio review</span>
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
      <section className="rtw-hero">
        <div className="rtw-hero__intro">
          <span className="rtw-eyebrow">Recruiter Talent Workspace</span>
          <h2>Quản lý toàn bộ luồng tìm ứng viên, review portfolio và chat trong một màn hình</h2>
          <p>
            Mỗi job được gắn applicant pipeline, AI discovery, boost visibility và conversation
            context theo đúng candidate.
          </p>
          <div className="rtw-hero__chips">
            <span className="rtw-chip rtw-chip--accent">
              <Crown size={14} />
              {subscription?.planDisplayName || 'Free tier'}
            </span>
            <span className="rtw-chip">
              <Sparkles size={14} />
              {subscription?.canUseAICandidateSuggestion ? 'AI matching bật' : 'AI matching khóa'}
            </span>
            <span className="rtw-chip">
              <ShieldCheck size={14} />
              {subscription?.hasCandidateDatabaseAccess ? 'Có candidate database' : 'Chưa có candidate database'}
            </span>
          </div>
        </div>

        <div className="rtw-hero__metrics">
          <article className="rtw-metric">
            <span className="rtw-metric__label">Job đang mở</span>
            <strong>{openJobCount}</strong>
            <span className="rtw-metric__hint">Sẵn sàng chạy discovery</span>
          </article>
          <article className="rtw-metric">
            <span className="rtw-metric__label">Applicants</span>
            <strong>{totalApplicantCount}</strong>
            <span className="rtw-metric__hint">Toàn bộ full-time pipeline</span>
          </article>
          <article className="rtw-metric">
            <span className="rtw-metric__label">Chats theo job</span>
            <strong>{sessions.length}</strong>
            <span className="rtw-metric__hint">Context recruiter đang chọn</span>
          </article>
          <article className="rtw-metric">
            <span className="rtw-metric__label">Boost quota còn lại</span>
            <strong>{subscription?.jobBoostRemaining ?? 0}</strong>
            <span className="rtw-metric__hint">Dùng để kéo thêm ứng viên phù hợp</span>
          </article>
        </div>
      </section>

      <div className="rtw-grid">
        <aside className="rtw-column rtw-column--jobs">
          <div className="rtw-panel rtw-panel--spotlight">
            <div className="rtw-panel__header">
              <div>
                <span className="rtw-panel__eyebrow">Job focus</span>
                <h3>{selectedJob?.title}</h3>
              </div>
              <button className="rtw-ghost-btn" onClick={handleRefreshCurrentJob}>
                <RefreshCw size={14} />
                Đồng bộ
              </button>
            </div>

            <div className="rtw-job-spotlight">
              <div className="rtw-job-spotlight__meta">
                <span className={`rtw-status-pill rtw-status-pill--${selectedJob?.status.toLowerCase()}`}>
                  {getJobStatusLabel(selectedJob?.status || JobStatus.IN_PROGRESS)}
                </span>
                <span className="rtw-inline-stat">
                  <Users size={14} />
                  {selectedJob?.applicantCount || 0} applicants
                </span>
              </div>

              <div className="rtw-job-spotlight__stats">
                <div className="rtw-stack-stat">
                  <span>Ngân sách</span>
                  <strong>
                    {formatCompactCurrency(selectedJob?.minBudget)} - {formatCompactCurrency(selectedJob?.maxBudget)}
                  </strong>
                </div>
                <div className="rtw-stack-stat">
                  <span>Deadline</span>
                  <strong>{formatShortDate(selectedJob?.deadline)}</strong>
                </div>
              </div>

              {selectedJob?.status === JobStatus.OPEN && hasAcceptedApplicant && (
                <div className="rtw-job-spotlight__controls">
                  <button
                    className="rtw-secondary-btn"
                    disabled={isActionBusy}
                    onClick={handleCloseSelectedJob}
                  >
                    {isActionBusy ? <Loader2 size={14} className="rtw-spin" /> : <ShieldCheck size={14} />}
                    Đóng job
                  </button>
                </div>
              )}

              <div className="rtw-skill-row">
                {(selectedJob?.requiredSkills || []).slice(0, 5).map((skill) => (
                  <span key={skill} className="rtw-skill-pill">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="rtw-boost-card">
                <div className="rtw-boost-card__header">
                  <div>
                    <span className="rtw-panel__eyebrow">Visibility boost</span>
                    <h4>{boost ? 'Job đang được boost' : 'Kéo ứng viên về job này'}</h4>
                  </div>
                  <Zap size={18} />
                </div>

                <div className="rtw-boost-card__stats">
                  <div>
                    <span>Impressions</span>
                    <strong>{boostAnalytics?.impressions ?? boost?.impressions ?? 0}</strong>
                  </div>
                  <div>
                    <span>Clicks</span>
                    <strong>{boostAnalytics?.clicks ?? boost?.clicks ?? 0}</strong>
                  </div>
                  <div>
                    <span>Applications</span>
                    <strong>{boostAnalytics?.applications ?? boost?.applications ?? 0}</strong>
                  </div>
                </div>

                <div className="rtw-boost-card__controls">
                  <select
                    className="rtw-select"
                    value={boostDuration}
                    onChange={(event) => setBoostDuration(Number(event.target.value))}
                  >
                    <option value={7}>7 ngày</option>
                    <option value={14}>14 ngày</option>
                    <option value={30}>30 ngày</option>
                  </select>
                  <button
                    className="rtw-primary-btn"
                    disabled={isBoostLoading || !subscription?.canHighlightJobs}
                    onClick={handleBoostAction}
                  >
                    {isBoostLoading ? <Loader2 size={14} className="rtw-spin" /> : <Rocket size={14} />}
                    {boost ? 'Gia hạn boost' : 'Kích hoạt boost'}
                  </button>
                </div>

                {boost && (
                  <button className="rtw-secondary-btn" disabled={isBoostLoading} onClick={handleCancelBoost}>
                    <XCircle size={14} />
                    Huỷ boost
                  </button>
                )}

                {!subscription?.canHighlightJobs && (
                  <p className="rtw-inline-note">
                    Gói hiện tại chưa có quyền highlight job hoặc quota đã hết.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rtw-panel">
            <div className="rtw-panel__header">
              <div>
                <span className="rtw-panel__eyebrow">Job roster</span>
                <h3>Chọn context tuyển dụng</h3>
              </div>
            </div>

            <div className="rtw-job-list">
              {orderedJobs.map((job) => (
                <button
                  key={job.id}
                  className={`rtw-job-card ${job.id === selectedJobId ? 'rtw-job-card--active' : ''}`}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <div className="rtw-job-card__row">
                    <strong>{job.title}</strong>
                    <span className={`rtw-status-pill rtw-status-pill--${job.status.toLowerCase()}`}>
                      {getJobStatusLabel(job.status)}
                    </span>
                  </div>
                  <p>{job.description.slice(0, 92)}...</p>
                  <div className="rtw-job-card__meta">
                    <span>
                      <Users size={13} />
                      {job.applicantCount || 0}
                    </span>
                    <span>
                      <Calendar size={13} />
                      {formatShortDate(job.deadline)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="rtw-column rtw-column--pipeline">
          <div className="rtw-panel">
            <div className="rtw-tabs">
              <button
                className={`rtw-tab ${activeTab === 'applicants' ? 'rtw-tab--active' : ''}`}
                onClick={() => setActiveTab('applicants')}
              >
                <Inbox size={15} />
                Applicants
              </button>
              <button
                className={`rtw-tab ${activeTab === 'discover' ? 'rtw-tab--active' : ''}`}
                onClick={() => setActiveTab('discover')}
              >
                <Sparkles size={15} />
                AI Search
              </button>
              <button
                className={`rtw-tab ${activeTab === 'chats' ? 'rtw-tab--active' : ''}`}
                onClick={() => setActiveTab('chats')}
              >
                <MessageSquare size={15} />
                Chats
              </button>
            </div>

            {activeTab === 'applicants' && (
              <div className="rtw-feed">
                <div className="rtw-feed__intro">
                  <div>
                    <span className="rtw-panel__eyebrow">Applicant pipeline</span>
                    <h3>Hồ sơ đã apply vào {selectedJob?.title}</h3>
                  </div>
                </div>

                <div className="rtw-tabs" style={{ gap: '0.5rem' }}>
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
                    Đang tải applicant...
                  </div>
                ) : filteredApplicants.length === 0 ? (
                  <div className="rtw-empty-state">
                    <Users size={24} />
                    <div>
                      <strong>Không có ứng viên nào trong nhóm này</strong>
                      <p>Thử chọn bộ lọc khác hoặc bật boost để thu hút thêm ứng viên.</p>
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
                              <img
                                src={resolveAssetUrl(application.userAvatar)}
                                alt={getApplicantDisplayName(application.userFullName, application.userEmail)}
                                className="rtw-avatar"
                              />
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
                          <span>
                            <Clock3 size={13} />
                            {formatRelativeTime(application.appliedAt)}
                          </span>
                          <span>
                            <Wallet size={13} />
                            {formatCompactCurrency(application.minBudget)} - {formatCompactCurrency(application.maxBudget)}
                          </span>
                        </div>

                        <div className="rtw-card__actions">
                          <button className="rtw-chip-btn" onClick={(event) => {
                            event.stopPropagation();
                            pickCandidate(seed);
                          }}>
                            <Eye size={13} />
                            Xem dossier
                          </button>
                          <button className="rtw-chip-btn" onClick={(event) => {
                            event.stopPropagation();
                            openChatWithCandidate(seed, 'PROFILE_VIEW');
                          }}>
                            <MessageSquare size={13} />
                            Chat
                          </button>
                          {application.status === 'PENDING' && (
                            <button className="rtw-chip-btn" onClick={(event) => {
                              event.stopPropagation();
                              handleReviewApplication(application);
                            }}>
                              <CheckCircle2 size={13} />
                              Đã xem
                            </button>
                          )}
                          {(application.status === 'PENDING' || application.status === 'REVIEWED') && (
                            <>
                              <button className="rtw-chip-btn rtw-chip-btn--success" onClick={(event) => {
                                event.stopPropagation();
                                setDecisionModal({ application, status: 'ACCEPTED' });
                                setDecisionNote('');
                              }}>
                                <CheckCircle2 size={13} />
                                Duyệt
                              </button>
                              <button className="rtw-chip-btn rtw-chip-btn--danger" onClick={(event) => {
                                event.stopPropagation();
                                setDecisionModal({ application, status: 'REJECTED' });
                                setDecisionNote('');
                              }}>
                                <XCircle size={13} />
                                Loại
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

            {activeTab === 'discover' && (
              <div className="rtw-feed">
                <div className="rtw-feed__intro">
                  <div>
                    <span className="rtw-panel__eyebrow">AI talent discovery</span>
                    <h3>Tìm ứng viên phù hợp với {selectedJob?.title}</h3>
                  </div>
                  <button className="rtw-ghost-btn" onClick={() => selectedJobId && loadDiscoveries(selectedJobId, true)}>
                    <RefreshCw size={14} />
                    Làm mới gợi ý
                  </button>
                </div>

                {!subscription?.hasCandidateDatabaseAccess ? (
                  <div className="rtw-empty-state">
                    <Crown size={24} />
                    <div>
                      <strong>Cần nâng cấp gói Recruiter để truy cập cơ sở ứng viên.</strong>
                      <p>AI talent discovery yêu cầu gói premium. Bạn vẫn có thể xem applicants và chat tuyển dụng.</p>
                    </div>
                  </div>
                ) : discoveryAccessError ? (
                  <div className="rtw-empty-state">
                    <Crown size={24} />
                    <div>
                      <strong>{discoveryAccessError}</strong>
                      <p>AI talent discovery yêu cầu gói premium. Bạn vẫn có thể xem applicants và chat tuyển dụng.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <form className="rtw-searchbar" onSubmit={handleDiscoverySubmit}>
                      <div className="rtw-searchbar__field">
                        <Search size={16} />
                        <input
                          type="text"
                          placeholder="Tìm theo kỹ năng, title, keyword..."
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                        />
                      </div>

                      <div className="rtw-searchbar__field rtw-searchbar__field--compact">
                        <Target size={16} />
                        <input
                          type="text"
                          placeholder="Thêm skill"
                          value={skillInput}
                          onChange={(event) => setSkillInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              handleAddSkill();
                            }
                          }}
                        />
                      </div>

                      <button type="button" className="rtw-secondary-btn" onClick={handleAddSkill}>
                        Thêm skill
                      </button>
                      <button type="submit" className="rtw-primary-btn" disabled={isDiscoveryLoading}>
                        {isDiscoveryLoading ? <Loader2 size={14} className="rtw-spin" /> : <Sparkles size={14} />}
                        Chạy search
                      </button>
                    </form>

                    {searchSkills.length > 0 && (
                      <div className="rtw-skill-row rtw-skill-row--tight">
                        {searchSkills.map((skill) => (
                          <button
                            key={skill}
                            className="rtw-skill-pill rtw-skill-pill--removable"
                            onClick={() =>
                              setSearchSkills((current) =>
                                current.filter((currentSkill) => currentSkill !== skill),
                              )
                            }
                          >
                            {skill}
                            <span>×</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {isDiscoveryLoading ? (
                      <div className="rtw-loading-block">
                        <Loader2 size={22} className="rtw-spin" />
                        AI đang quét candidate phù hợp...
                      </div>
                    ) : discoveries.length === 0 ? (
                      <div className="rtw-empty-state">
                        <Search size={24} />
                        <div>
                          <strong>Chưa có candidate phù hợp với bộ lọc hiện tại</strong>
                          <p>Thử bỏ bớt skill filter hoặc boost job để tăng visibility.</p>
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
                          sourceLabel: 'AI talent search',
                        };

                        return (
                          <article
                            key={candidate.userId}
                            className={`rtw-card ${selectedCandidate?.candidateId === candidate.userId ? 'rtw-card--active' : ''}`}
                            onClick={() => pickCandidate(seed)}
                          >
                            <div className="rtw-card__header">
                              <div className="rtw-identity">
                                <img
                                  src={resolveAssetUrl(candidate.avatarUrl)}
                                  alt={candidate.fullName}
                                  className="rtw-avatar"
                                />
                                <div>
                                  <h4>{candidate.fullName}</h4>
                                  <p>{candidate.professionalTitle || 'Talent profile'}</p>
                                </div>
                              </div>
                              <div className="rtw-score-pill">
                                <Star size={13} />
                                {Math.round((candidate.matchScore || 0) * 100)}%
                              </div>
                            </div>

                            <div className="rtw-skill-row rtw-skill-row--tight">
                              {parseSkillList(candidate.topSkills).slice(0, 6).map((skill) => (
                                <span key={`${candidate.userId}-${skill}`} className="rtw-skill-pill">
                                  {skill}
                                </span>
                              ))}
                            </div>

                            <p className="rtw-card__body">
                              {candidate.aiSummary || candidate.fitExplanation || 'Ứng viên phù hợp theo tín hiệu kỹ năng và bối cảnh job.'}
                            </p>

                            <div className="rtw-card__meta">
                              <span>
                                <Wallet size={13} />
                                {formatCompactCurrency(candidate.hourlyRate, candidate.preferredCurrency)}
                              </span>
                              <span>
                                <FileText size={13} />
                                {candidate.totalProjects || 0} projects
                              </span>
                            </div>

                            <div className="rtw-card__actions">
                              <button className="rtw-chip-btn" onClick={(event) => {
                                event.stopPropagation();
                                handleRunAiInsight(seed);
                              }}>
                                <Sparkles size={13} />
                                AI insight
                              </button>
                              <button className="rtw-chip-btn" onClick={(event) => {
                                event.stopPropagation();
                                handleShortlist(seed);
                              }}>
                                <Target size={13} />
                                Shortlist
                              </button>
                              <button className="rtw-chip-btn" onClick={(event) => {
                                event.stopPropagation();
                                openChatWithCandidate(seed, 'AI_SEARCH');
                              }}>
                                <MessageSquare size={13} />
                                Chat
                              </button>
                              <button className="rtw-chip-btn rtw-chip-btn--success" onClick={(event) => {
                                event.stopPropagation();
                                inviteCandidateToJob(seed);
                              }}>
                                <Rocket size={13} />
                                Mời vào job
                              </button>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'chats' && (
              <div className="rtw-feed">
                <div className="rtw-feed__intro">
                  <div>
                    <span className="rtw-panel__eyebrow">Recruitment conversations</span>
                    <h3>Chat theo context ứng viên và job</h3>
                  </div>
                </div>

                {isSessionsLoading ? (
                  <div className="rtw-loading-block">
                    <Loader2 size={22} className="rtw-spin" />
                    Đang tải conversations...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="rtw-empty-state">
                    <MessageSquare size={24} />
                    <div>
                      <strong>Chưa có conversation cho job này</strong>
                      <p>Bắt đầu chat từ applicant hoặc AI search để toàn bộ context được lưu lại tại đây.</p>
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
                          <img
                            src={resolveAssetUrl(session.candidateAvatar)}
                            alt={session.candidateFullName}
                            className="rtw-avatar"
                          />
                          <div>
                            <h4>{session.candidateFullName}</h4>
                            <p>{session.jobTitle || 'Conversation chưa gắn job'}</p>
                          </div>
                        </div>
                        <span className={`rtw-status-pill rtw-status-pill--chat-${session.status.toLowerCase()}`}>
                          {getSessionStatusLabel(session.status)}
                        </span>
                      </div>

                      <p className="rtw-card__body">
                        {session.lastMessagePreview || 'Chưa có tin nhắn nào trong conversation này.'}
                      </p>

                      <div className="rtw-card__meta">
                        <span>
                          <Clock3 size={13} />
                          {formatRelativeTime(session.lastMessageAt || session.createdAt)}
                        </span>
                        <span>
                          <Users size={13} />
                          {session.unreadCount || 0} chưa đọc
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        <aside className="rtw-column rtw-column--intel">
          <div className="rtw-panel rtw-panel--intel">
            <div className="rtw-panel__header">
              <div>
                <span className="rtw-panel__eyebrow">Candidate dossier</span>
                <h3>{selectedCandidate?.fullName || 'Chọn một candidate'}</h3>
              </div>
              {selectedCandidate && (
                <button className="rtw-ghost-btn" onClick={openPortfolioExternally}>
                  <ArrowUpRight size={14} />
                  Mở portfolio
                </button>
              )}
            </div>

            {!selectedCandidate ? (
              <div className="rtw-empty-state">
                <Users size={24} />
                <div>
                  <strong>Chưa chọn candidate</strong>
                  <p>Chọn một applicant, AI match hoặc conversation để mở dossier chi tiết bên phải.</p>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="rtw-dossier-hero"
                  style={{
                    backgroundImage: portfolioProfile?.coverImageUrl
                      ? `linear-gradient(180deg, rgba(5, 10, 24, 0.15), rgba(5, 10, 24, 0.92)), url(${resolveAssetUrl(portfolioProfile.coverImageUrl)})`
                      : undefined,
                  }}
                >
                  <div className="rtw-identity">
                    <img
                      src={resolveAssetUrl(portfolioProfile?.portfolioAvatarUrl || portfolioProfile?.basicAvatarUrl || selectedCandidate.avatarUrl)}
                      alt={selectedCandidate.fullName}
                      className="rtw-avatar rtw-avatar--large"
                    />
                    <div>
                      <h4>{portfolioProfile?.fullName || selectedCandidate.fullName}</h4>
                      <p>{portfolioProfile?.professionalTitle || selectedCandidate.professionalTitle || 'Talent profile'}</p>
                      <div className="rtw-hero__chips">
                        <span className="rtw-chip">
                          <Star size={14} />
                          {selectedCandidate.matchScore
                            ? `${Math.round(selectedCandidate.matchScore * 100)}% match`
                            : selectedCandidate.sourceLabel}
                        </span>
                        <span className="rtw-chip">
                          <FileText size={14} />
                          {portfolioProfile?.totalProjects || portfolioProjects.length} projects
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rtw-dossier-actions">
                    <button className="rtw-primary-btn" disabled={isActionBusy} onClick={() => openChatWithCandidate(selectedCandidate, 'PROFILE_VIEW')}>
                      <MessageSquare size={14} />
                      Chat theo context
                    </button>
                    <button className="rtw-secondary-btn" disabled={isAiLoading} onClick={() => handleRunAiInsight()}>
                      {isAiLoading ? <Loader2 size={14} className="rtw-spin" /> : <Sparkles size={14} />}
                      Phân tích AI
                    </button>
                  </div>
                </div>

                <div className="rtw-dossier-stack">
                  {(isPortfolioLoading || portfolioError) && (
                    <div className="rtw-inline-note">
                      {isPortfolioLoading ? 'Đang tải portfolio chi tiết...' : portfolioError}
                    </div>
                  )}

                  <div className="rtw-detail-grid">
                    <article className="rtw-detail-card">
                      <span className="rtw-panel__eyebrow">Profile signals</span>
                      <div className="rtw-detail-card__list">
                        <span>
                          <Wallet size={13} />
                          {formatCompactCurrency(portfolioProfile?.hourlyRate, portfolioProfile?.preferredCurrency)}
                        </span>
                        <span>
                          <MapPin size={13} />
                          {portfolioProfile?.location || 'Chưa cập nhật location'}
                        </span>
                        <span>
                          <ShieldCheck size={13} />
                          {portfolioProfile?.availabilityStatus || 'Chưa cập nhật availability'}
                        </span>
                        <span>
                          <Briefcase size={13} />
                          {portfolioProfile?.yearsOfExperience !== undefined
                            ? `${portfolioProfile.yearsOfExperience} năm kinh nghiệm`
                            : 'Chưa cập nhật số năm kinh nghiệm'}
                        </span>
                      </div>
                    </article>

                    <article className="rtw-detail-card">
                      <span className="rtw-panel__eyebrow">Tóm tắt</span>
                      <p>
                        {portfolioProfile?.tagline ||
                          portfolioProfile?.careerGoals ||
                          portfolioProfile?.basicBio ||
                          'Ứng viên chưa để lại phần tóm tắt công khai.'}
                      </p>
                    </article>
                  </div>

                  {currentPortfolioSkills.length > 0 && (
                    <article className="rtw-detail-card">
                      <span className="rtw-panel__eyebrow">Core skills</span>
                      <div className="rtw-skill-row">
                        {currentPortfolioSkills.map((skill) => (
                          <span key={skill} className="rtw-skill-pill">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </article>
                  )}

                  {aiInsight && (
                    <article className="rtw-detail-card rtw-detail-card--accent">
                      <div className="rtw-detail-card__title">
                        <Sparkles size={16} />
                        <strong>AI fit insight cho job hiện tại</strong>
                      </div>
                      <p>{aiInsight.fitExplanation}</p>
                      <div className="rtw-detail-card__list">
                        <span>
                          <Target size={13} />
                          Confidence {Math.round((aiInsight.confidence || 0) * 100)}%
                        </span>
                        <span>
                          <CheckCircle2 size={13} />
                          {aiInsight.skillMatchPercent}% required skills signal
                        </span>
                      </div>
                      <p className="rtw-muted-text">{aiInsight.reasoning}</p>
                    </article>
                  )}

                  <article className="rtw-detail-card">
                    <div className="rtw-detail-card__title">
                      <FileText size={16} />
                      <strong>Dự án nổi bật</strong>
                    </div>
                    <div className="rtw-mini-list">
                      {portfolioProjects.slice(0, 3).map((project) => (
                        <div key={project.id || project.title} className="rtw-mini-list__item">
                          <strong>{project.title}</strong>
                          <p>{project.description.slice(0, 120)}...</p>
                        </div>
                      ))}
                      {portfolioProjects.length === 0 && (
                        <p className="rtw-muted-text">Chưa có project công khai.</p>
                      )}
                    </div>
                  </article>

                  <div className="rtw-detail-grid">
                    <article className="rtw-detail-card">
                      <div className="rtw-detail-card__title">
                        <CheckCircle2 size={16} />
                        <strong>Certificates</strong>
                      </div>
                      <div className="rtw-mini-list">
                        {portfolioCertificates.slice(0, 3).map((certificate) => (
                          <div key={certificate.id || certificate.title} className="rtw-mini-list__item">
                            <strong>{certificate.title}</strong>
                            <p>{certificate.issuingOrganization}</p>
                          </div>
                        ))}
                        {portfolioCertificates.length === 0 && (
                          <p className="rtw-muted-text">Chưa có certificate công khai.</p>
                        )}
                      </div>
                    </article>

                    <article className="rtw-detail-card">
                      <div className="rtw-detail-card__title">
                        <Star size={16} />
                        <strong>Mentor reviews</strong>
                      </div>
                      <div className="rtw-mini-list">
                        {portfolioReviews.slice(0, 2).map((review) => (
                          <div key={review.id || review.mentorName} className="rtw-mini-list__item">
                            <strong>{review.mentorName}</strong>
                            <p>{review.feedback}</p>
                          </div>
                        ))}
                        {portfolioReviews.length === 0 && (
                          <p className="rtw-muted-text">Chưa có review công khai.</p>
                        )}
                      </div>
                    </article>
                  </div>

                  <article className="rtw-detail-card">
                    <div className="rtw-detail-card__title">
                      <MessageSquare size={16} />
                      <strong>Recruitment chat</strong>
                    </div>

                    {selectedSession ? (
                      <>
                        <div className="rtw-session-toolbar">
                          <span className={`rtw-status-pill rtw-status-pill--chat-${selectedSession.status.toLowerCase()}`}>
                            {getSessionStatusLabel(selectedSession.status)}
                          </span>
                          <div className="rtw-session-toolbar__actions">
                            <button
                              className="rtw-chip-btn"
                              onClick={() => handleSessionStatus(RecruitmentSessionStatus.INTERESTED)}
                            >
                              Quan tâm
                            </button>
                            <button
                              className="rtw-chip-btn"
                              onClick={() => handleSessionStatus(RecruitmentSessionStatus.SCREENING)}
                            >
                              Screening
                            </button>
                            <button
                              className="rtw-chip-btn"
                              onClick={() => handleSessionStatus(RecruitmentSessionStatus.OFFER_SENT)}
                            >
                              Offer
                            </button>
                          </div>
                        </div>

                        <div className="rtw-chatbox">
                          {isChatLoading ? (
                            <div className="rtw-loading-block">
                              <Loader2 size={18} className="rtw-spin" />
                              Đang tải chat...
                            </div>
                          ) : chatMessages.length === 0 ? (
                            <div className="rtw-empty-state">
                              <MessageSquare size={20} />
                              <div>
                                <strong>Conversation chưa có nội dung</strong>
                                <p>Gửi tin nhắn đầu tiên để giữ toàn bộ trao đổi ngay trong workspace này.</p>
                              </div>
                            </div>
                          ) : (
                            <div className="rtw-chat-log">
                              {chatMessages.map((message) => {
                                const isOwn = message.senderId === user?.id;
                                return (
                                  <div
                                    key={message.id}
                                    className={`rtw-chat-bubble ${isOwn ? 'rtw-chat-bubble--own' : ''}`}
                                  >
                                    <span className="rtw-chat-bubble__name">{message.senderName}</span>
                                    <p>{message.content}</p>
                                    <span className="rtw-chat-bubble__time">
                                      {formatRelativeTime(message.createdAt)}
                                    </span>
                                  </div>
                                );
                              })}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </div>

                        <form className="rtw-chat-form" onSubmit={handleSendMessage}>
                          <input
                            type="text"
                            placeholder="Nhập tin nhắn cho ứng viên..."
                            value={messageDraft}
                            onChange={(event) => setMessageDraft(event.target.value)}
                          />
                          <button type="submit" className="rtw-primary-btn" disabled={isSendingMessage || !messageDraft.trim()}>
                            {isSendingMessage ? <Loader2 size={14} className="rtw-spin" /> : <Send size={14} />}
                            Gửi
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="rtw-empty-state">
                        <MessageSquare size={20} />
                        <div>
                          <strong>Chưa có recruitment session</strong>
                          <p>Bắt đầu chat từ applicant hoặc AI discovery để conversation gắn đúng candidate và job.</p>
                        </div>
                      </div>
                    )}
                  </article>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {decisionModal && (
        <div className="rtw-modal-backdrop" onClick={() => setDecisionModal(null)}>
          <div className="rtw-modal" onClick={(event) => event.stopPropagation()}>
            <span className="rtw-panel__eyebrow">Application decision</span>
            <h3>
              {decisionModal.status === 'ACCEPTED' ? 'Duyệt applicant' : 'Loại applicant'}:
              {' '}
              {decisionModal.application.userFullName}
            </h3>
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
              <button className="rtw-secondary-btn" onClick={() => setDecisionModal(null)}>
                Huỷ
              </button>
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
