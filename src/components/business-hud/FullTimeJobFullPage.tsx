import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileSignature,
  FileText,
  Globe,
  Link2,
  Loader2,
  MapPin,
  MessageSquare,
  Paperclip,
  Plus,
  SearchCheck,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import {
  JobApplicationResponse,
  JobApplicationStatus,
  JobPostingResponse,
  JobStatus,
} from "../../data/jobDTOs";
import { RecruitmentJobContextType } from "../../data/portfolioDTOs";
import jobService from "../../services/jobService";
import contractService, { OnboardingInfoResponse } from "../../services/contractService";
import recruitmentChatService from "../../services/recruitmentChatService";
import interviewService, {
  InterviewScheduleResponse,
  InterviewStatus,
} from "../../services/interviewService";
import { ContractListResponse, ContractStatus } from "../../types/contract";
import { showAppError, showAppInfo, showAppSuccess } from "../../context/ToastContext";
import { JobMarkdownSurface } from "../shared/JobMarkdownSurface";
import ContractForm from "../contract/ContractForm";
import GoogleMeetLogo from "../../assets/meeting/ggmeet.png";
import ZoomLogo from "../../assets/meeting/zoomicon.webp";
import TeamsLogo from "../../assets/meeting/mslogo.png";
import SkillVerseLogo from "../../assets/brand/skillverse.png";
import InterviewScheduleForm from "./InterviewScheduleForm";
import {
  getApplicantDisplayName,
  getApplicantInitials,
  getApplicantSubtitle,
  getPortfolioPath,
  resolveRecruitmentAssetUrl,
} from "../../utils/recruitmentUi";
import FullTimeJobOffersTab from "./FullTimeJobOffersTab";
import RecruiterContractUpload from "./RecruiterContractUpload";
import "./FullTimeJobFullPage.css";
import { MeetingType } from "../../services/interviewService";

export interface JobFlowBlockingItem {
  type: string;
  id: number;
  candidateName: string;
  candidateEmail: string;
  status: string;
  reason: string;
}

type FullPageTab =
  | "overview"
  | "applicants"
  | "interviews"
  | "contracts"
  | "offers";

interface FullTimeJobFullPageProps {
  jobId: number;
  onBack: () => void;
}

type DecisionMode =
  | "ACCEPTED"
  | "REJECTED"
  | "OFFER_SENT"
  | "INTERVIEW_APPROVED"
  | "INTERVIEW_REJECTED";

interface DecisionModalState {
  application: JobApplicationResponse;
  mode: DecisionMode;
  interviewId?: number;
  offerSalary?: number;
  offerAdditionalRequirements?: string;
}

const MIN_DECISION_MESSAGE_LENGTH = 10;

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "#94a3b8",
  PENDING_APPROVAL: "#fbbf24",
  OPEN: "#34d399",
  REJECTED: "#fb7185",
  CLOSED: "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "Nháp",
  PENDING_APPROVAL: "Chờ duyệt",
  OPEN: "Đang mở",
  REJECTED: "Từ chối",
  CLOSED: "Đã đóng",
};

const APP_STATUS_COLORS: Record<string, string> = {
  PENDING: "#38bdf8",
  REVIEWED: "#fbbf24",
  ACCEPTED: "#34d399",
  INTERVIEW_SCHEDULED: "#00f5ff",
  INTERVIEWED: "#818cf8",
  OFFER_SENT: "#aa55ff",
  OFFER_ACCEPTED: "#34d399",
  OFFER_REJECTED: "#fb7185",
  AWAITING_ONBOARDING_INFO: "#06b6d4",
  HIRED: "#10b981",
  CONTRACT_SIGNED: "#8b5cf6",
  REJECTED: "#fb7185",
  // Short-term cross-statuses
  WORKING: "#f97316",
  SUBMITTED: "#a855f7",
  REVISION_REQUIRED: "#fbbf24",
  APPROVED: "#34d399",
  COMPLETED: "#4ade80",
  PAID: "#4ade80",
  CANCELLED: "#64748b",
  WITHDRAWN: "#64748b",
  SUBMITTED_OVERDUE: "#fb7185",
  REVISION_RESPONSE_OVERDUE: "#fbbf24",
  CANCELLATION_REQUESTED: "#f97316",
  AUTO_CANCELLED: "#fb7185",
  DISPUTE_OPENED: "#818cf8",
};

const APP_STATUS_LABELS: Record<string, string> = {
  PENDING: "Mới nộp",
  REVIEWED: "Đã xem",
  ACCEPTED: "Đã duyệt",
  INTERVIEW_SCHEDULED: "Lịch phỏng vấn",
  INTERVIEWED: "Đã phỏng vấn",
  OFFER_SENT: "Đã gửi đề nghị",
  OFFER_ACCEPTED: "Nhận đề nghị",
  OFFER_REJECTED: "Từ chối đề nghị",
  AWAITING_ONBOARDING_INFO: "Đang cung cấp thông tin",
  HIRED: "Đã tuyển dụng",
  CONTRACT_SIGNED: "Đã ký hợp đồng",
  REJECTED: "Từ chối",
  // Short-term cross-statuses
  WORKING: "Đang làm",
  SUBMITTED: "Đã nộp",
  REVISION_REQUIRED: "Cần sửa",
  APPROVED: "Đã duyệt",
  COMPLETED: "Hoàn tất",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  WITHDRAWN: "Đã rút đơn",
  SUBMITTED_OVERDUE: "Quá hạn review",
  REVISION_RESPONSE_OVERDUE: "Quá hạn phản hồi",
  CANCELLATION_REQUESTED: "Yêu cầu hủy",
  AUTO_CANCELLED: "Tự động hủy",
  DISPUTE_OPENED: "Đang khiếu nại",
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bản nháp",
  PENDING_SIGNER: "Chờ ứng viên ký",
  PENDING_EMPLOYER: "Chờ nhà tuyển dụng ký",
  SIGNED: "Đã ký",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã hủy",
};

const FullTimeJobFullPage = ({ jobId, onBack }: FullTimeJobFullPageProps) => {
  const navigate = useNavigate();
  const showToastError = (title: string, message: string) => showAppError(title, message);
  const showToastInfo = (title: string, message: string) => showAppInfo(title, message);
  const showToastSuccess = (title: string, message: string, autoCloseDelay?: number) => showAppSuccess(title, message, autoCloseDelay ?? 5);

  const [activeTab, setActiveTab] = useState<FullPageTab>("overview");
  const [job, setJob] = useState<JobPostingResponse | null>(null);
  const [applications, setApplications] = useState<JobApplicationResponse[]>(
    [],
  );
  const [contracts, setContracts] = useState<ContractListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [closeBlockers, setCloseBlockers] = useState<JobFlowBlockingItem[] | null>(null);
  const [decisionModal, setDecisionModal] = useState<DecisionModalState | null>(null);
  const [onboardingModalCandidate, setOnboardingModalCandidate] = useState<JobApplicationResponse | null>(null);
  const [onboardingInfo, setOnboardingInfo] = useState<OnboardingInfoResponse | null>(null);
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  const [isReminding, setIsReminding] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionSalary, setDecisionSalary] = useState("");
  const [decisionAdditionalReqs, setDecisionAdditionalReqs] = useState("");
  const [contractsUnavailable, setContractsUnavailable] = useState(false);
  const [contractApplication, setContractApplication] =
    useState<JobApplicationResponse | null>(null);
  const [interviewFormApp, setInterviewFormApp] =
    useState<JobApplicationResponse | null>(null);
  const [interviews, setInterviews] = useState<InterviewScheduleResponse[]>([]);
  const [interviewCompleteModal, setInterviewCompleteModal] = useState<{
    application: JobApplicationResponse;
    interview: InterviewScheduleResponse;
  } | null>(null);
  const [contractMode, setContractMode] = useState<'choose' | 'create' | 'upload'>('choose');
  const latestLoadRequestRef = useRef(0);

  useEffect(() => {
    void loadData(jobId);
  }, [jobId]);

  useEffect(() => {
    return () => {
      latestLoadRequestRef.current += 1;
    };
  }, []);

  // Clear contract selection when interview form opens
  useEffect(() => {
    if (interviewFormApp) {
      setContractApplication(null);
    }
  }, [interviewFormApp]);

  // Clear interview form when tab switches away from interviews tab
  useEffect(() => {
    if (activeTab !== "interviews") {
      setInterviewFormApp(null);
    }
  }, [activeTab]);

  const loadData = async (targetJobId: number = jobId) => {
    const requestId = ++latestLoadRequestRef.current;
    setIsLoading(true);
    try {
      const [jobData, applicantPage, interviewData, contractResult] =
        await Promise.all([
          jobService.getJobDetails(targetJobId),
          jobService.getJobApplicants(targetJobId, 0, 100),
          interviewService.getInterviewsByJob(targetJobId),
          contractService
            .getMyContracts("EMPLOYER")
            .then((data) => ({ ok: true as const, data }))
            .catch(() => ({
              ok: false as const,
              data: [] as ContractListResponse[],
            })),
        ]);

      if (requestId !== latestLoadRequestRef.current) {
        return { applications: [] as JobApplicationResponse[] };
      }

      const loadedApps = applicantPage.content || [];
      setJob(jobData);
      setApplications(loadedApps);
      setInterviews(interviewData);
      setContracts(contractResult.data);
      setContractsUnavailable(!contractResult.ok);
      return { applications: loadedApps };
    } catch (error: unknown) {
      if (requestId !== latestLoadRequestRef.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Vui lòng thử lại sau.";
      showToastError("Không thể tải trung tâm job", message);
    } finally {
      if (requestId === latestLoadRequestRef.current) {
        setIsLoading(false);
      }
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  };

  const handleOpenOnboardingInfo = async (app: JobApplicationResponse) => {
    setOnboardingModalCandidate(app);
    setIsOnboardingLoading(true);
    setOnboardingInfo(null);
    try {
      const data = await contractService.getOnboardingInfo(app.id);
      setOnboardingInfo(data || null);
    } catch (error) {
      // Ignored, likely not found
    } finally {
      setIsOnboardingLoading(false);
    }
  };

  const handleRemindOnboarding = async (appId: number) => {
    setIsReminding(true);
    try {
      await contractService.remindOnboardingInfo(appId);
      showToastSuccess("Đã gửi nhắc nhở", "Hệ thống đã gửi email và thông báo cho ứng viên.");
    } catch (error) {
      showToastError("Lỗi", "Không thể gửi nhắc nhở.");
    } finally {
      setIsReminding(false);
    }
  };

  const formatBudget = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatBudgetRange = (targetJob: JobPostingResponse) => {
    if (targetJob.isNegotiable) return "Thỏa thuận";
    if (targetJob.minBudget && targetJob.maxBudget) {
      return `${formatBudget(targetJob.minBudget)} - ${formatBudget(targetJob.maxBudget)}`;
    }
    return "Chưa thiết lập";
  };

  const getMeetingTypeLabel = (type: MeetingType): string => {
    switch (type) {
      case MeetingType.GOOGLE_MEET:
        return "Google Meet";
      case MeetingType.SKILLVERSE_ROOM:
        return "SkillVerse Room";
      case MeetingType.ZOOM:
        return "Zoom";
      case MeetingType.MICROSOFT_TEAMS:
        return "MS Teams";
      case MeetingType.PHONE_CALL:
        return "Điện thoại";
      case MeetingType.ONSITE:
        return "Trực tiếp";
    }
  };

  const getMeetingTypeLogo = (type: MeetingType): string => {
    switch (type) {
      case MeetingType.GOOGLE_MEET:
        return GoogleMeetLogo;
      case MeetingType.SKILLVERSE_ROOM:
        return SkillVerseLogo;
      case MeetingType.ZOOM:
        return ZoomLogo;
      case MeetingType.MICROSOFT_TEAMS:
        return TeamsLogo;
      default:
        return "";
    }
  };

  const MeetingTypeIcon = ({ meetingType }: { meetingType: MeetingType }) => {
    const logo = getMeetingTypeLogo(meetingType);
    if (!logo) return null;
    return (
      <img
        src={logo}
        alt={getMeetingTypeLabel(meetingType)}
        className="ftj-meeting-type-icon"
      />
    );
  };

  const getContractStatusClass = (status: string) => {
    switch (status) {
      case ContractStatus.SIGNED:
        return "ftj-contract-card__status--signed";
      case ContractStatus.PENDING_SIGNER:
      case ContractStatus.PENDING_EMPLOYER:
        return "ftj-contract-card__status--pending";
      case ContractStatus.REJECTED:
      case ContractStatus.CANCELLED:
        return "ftj-contract-card__status--danger";
      default:
        return "ftj-contract-card__status--draft";
    }
  };

  const handleSubmitForApproval = async () => {
    if (!job) return;

    try {
      setIsActionBusy(true);
      const updated = await jobService.submitForApproval(jobId);
      setJob(updated);
      showToastSuccess("Đã gửi duyệt", "Tin tuyển dụng đã được gửi đến admin.");
    } catch (error: unknown) {
      showToastError(
        "Không thể gửi duyệt",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleCloseJob = async () => {
    if (!job) return;

    try {
      setIsActionBusy(true);
      const updated = await jobService.changeJobStatus(jobId, JobStatus.CLOSED);
      setJob(updated);
      showToastSuccess("Đã đóng tin", "Tin tuyển dụng đã ngừng nhận hồ sơ.");
    } catch (error: any) {
      if (error.code === 'JOB_CLOSE_BLOCKED' && error.details?.blockingItems) {
        setCloseBlockers(error.details.blockingItems);
      } else {
        showToastError(
          "Không thể đóng tin",
          error.message || "Vui lòng thử lại.",
        );
      }
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleDeleteJob = async () => {
    try {
      setIsActionBusy(true);
      await jobService.deleteJob(jobId);
      showToastSuccess("Đã xóa job", "Job dài hạn đã được xóa.");
      onBack();
    } catch (error: unknown) {
      showToastError(
        "Không thể xóa job",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setIsActionBusy(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleApplicantDecision = async () => {
    if (!decisionModal) return;

    const note = decisionNote.trim();
    const salaryValue = decisionSalary
      ? parseInt(decisionSalary.replace(/[^0-9]/g, ""), 10)
      : Number.NaN;

    if (decisionModal.mode === "OFFER_SENT") {
      if (
        !decisionSalary.trim() ||
        Number.isNaN(salaryValue) ||
        salaryValue <= 0
      ) {
        showToastError(
          "Thiếu mức lương đề nghị",
          "Vui lòng nhập mức lương hợp lệ trước khi gửi đề nghị.",
        );
        return;
      }

      if (note.length < MIN_DECISION_MESSAGE_LENGTH) {
        showToastError(
          "Thiếu nội dung đề nghị",
          `Vui lòng nhập mô tả đề nghị tối thiểu ${MIN_DECISION_MESSAGE_LENGTH} ký tự.`,
        );
        return;
      }
    }

    if (
      decisionModal.mode === "ACCEPTED" &&
      note.length < MIN_DECISION_MESSAGE_LENGTH
    ) {
      showToastError(
        "Thiếu lời nhắn duyệt",
        `Vui lòng nhập lời nhắn cho ứng viên tối thiểu ${MIN_DECISION_MESSAGE_LENGTH} ký tự.`,
      );
      return;
    }

    if (
      decisionModal.mode === "REJECTED" &&
      note.length < MIN_DECISION_MESSAGE_LENGTH
    ) {
      showToastError(
        "Thiếu lý do từ chối",
        `Vui lòng nhập lý do từ chối tối thiểu ${MIN_DECISION_MESSAGE_LENGTH} ký tự.`,
      );
      return;
    }

    if (
      decisionModal.mode === "INTERVIEW_REJECTED" &&
      note.length < MIN_DECISION_MESSAGE_LENGTH
    ) {
      showToastError(
        "Thiếu nhận xét sau phỏng vấn",
        `Vui lòng nhập nhận xét từ chối tối thiểu ${MIN_DECISION_MESSAGE_LENGTH} ký tự.`,
      );
      return;
    }

    try {
      setIsActionBusy(true);
      const applicationId = decisionModal.application.id;

      // ── Interview completion modes (remote jobs only) ──────────────
      if (
        decisionModal.mode === "INTERVIEW_APPROVED" ||
        decisionModal.mode === "INTERVIEW_REJECTED"
      ) {
        // Step 1: complete interview via backend
        await interviewService.completeInterview(
          decisionModal.interviewId!,
          decisionModal.mode === "INTERVIEW_REJECTED" ? note : "",
        );

        // INTERVIEW_APPROVED: non-negotiable remote job → set ACCEPTED directly, go to contracts tab
        if (decisionModal.mode === "INTERVIEW_APPROVED" && !job?.isNegotiable) {
          await jobService.updateApplicationStatus(applicationId, {
            status: JobApplicationStatus.ACCEPTED,
            acceptanceMessage:
              note || "Ứng viên đã hoàn thành phỏng vấn và được chấp thuận.",
          });
          setDecisionModal(null);
          setDecisionNote("");
          const result = await loadData();
          const loadedApps = result?.applications ?? [];
          const freshApp = loadedApps.find((a: JobApplicationResponse) => a.id === applicationId);
          if (freshApp) {
            setContractApplication({ ...freshApp });
            setActiveTab("contracts");
          }
          return;
        }

        // INTERVIEW_APPROVED + negotiable remote job: just mark as INTERVIEWED
        // Recruiter must manually send offer from the Offers tab
        if (decisionModal.mode === "INTERVIEW_APPROVED" && job?.isNegotiable) {
          setDecisionModal(null);
          setDecisionNote("");
          showToastInfo(
            "Hoàn thành phỏng vấn",
            `Đã xác nhận phỏng vấn. Vui lòng vào tab "Đề nghị" để gửi đề nghị cho ${getApplicantDisplayName(
              decisionModal.application.userFullName,
              decisionModal.application.userEmail,
            )}.`,
          );
          await loadData();
          setActiveTab("offers");
          return;
        }

        // INTERVIEW_REJECTED: direct rejection
        if (decisionModal.mode === "INTERVIEW_REJECTED") {
          await jobService.updateApplicationStatus(applicationId, {
            status: JobApplicationStatus.REJECTED,
            rejectionReason:
              note || "Ứng viên không đạt yêu cầu sau phỏng vấn.",
          });
          setDecisionModal(null);
          setDecisionNote("");
          await loadData();
          showToastSuccess(
            "Đã từ chối",
            `${getApplicantDisplayName(
              decisionModal.application.userFullName,
              decisionModal.application.userEmail,
            )} đã được từ chối sau phỏng vấn.`,
          );
          return;
        }
      }

      // ── OFFER_SENT for negotiable jobs (post-interview) ─────────────
      if (decisionModal.mode === "OFFER_SENT") {
        await jobService.updateApplicationStatus(applicationId, {
          status: JobApplicationStatus.OFFER_SENT,
          offerDetails: decisionNote.trim() || undefined,
          offerSalary: salaryValue,
          offerAdditionalRequirements:
            decisionAdditionalReqs.trim() || undefined,
        });
        showToastSuccess(
          "Đã gửi đề nghị",
          `Đề nghị đã được gửi tới ${getApplicantDisplayName(
            decisionModal.application.userFullName,
            decisionModal.application.userEmail,
          )}.`,
        );
        setDecisionModal(null);
        setDecisionNote("");
        setDecisionSalary("");
        setDecisionAdditionalReqs("");
        await loadData();
        return;
      }

      // ── Application decision modes ────────────────────────────────
      // State machine: PENDING must go through REVIEWED before ACCEPTED
      if (
        decisionModal.application.status === JobApplicationStatus.PENDING &&
        decisionModal.mode === "ACCEPTED"
      ) {
        // Step 1: move PENDING → REVIEWED
        await jobService.updateApplicationStatus(applicationId, {
          status: JobApplicationStatus.REVIEWED,
        });
        // Step 2: move REVIEWED → ACCEPTED
        await jobService.updateApplicationStatus(applicationId, {
          status: JobApplicationStatus.ACCEPTED,
          acceptanceMessage: note,
        });
      } else {
        // REJECTED (from PENDING or REVIEWED) and direct REVIEWED→ACCEPTED are allowed
        await jobService.updateApplicationStatus(applicationId, {
          status: decisionModal.mode as JobApplicationStatus,
          acceptanceMessage:
            decisionModal.mode === "ACCEPTED" ? note : undefined,
          rejectionReason: decisionModal.mode === "REJECTED" ? note : undefined,
        });
      }

      const wasAccepted = decisionModal.mode === "ACCEPTED";
      const appIdForContract = applicationId;
      setDecisionModal(null);
      setDecisionNote("");
      const result = await loadData();
      const loadedApps = result?.applications ?? [];

      if (wasAccepted) {
        const freshApp = loadedApps.find((a: JobApplicationResponse) => a.id === appIdForContract);
        if (freshApp) {
          setContractApplication({ ...freshApp });
          setActiveTab("contracts");
        }
        showToastSuccess("Đã duyệt ứng viên", "Chuyển sang bước tạo hợp đồng.");
      } else {
        showToastSuccess(
          "Đã từ chối ứng viên",
          "Ứng viên đã được cập nhật trạng thái.",
        );
      }
    } catch (error: unknown) {
      showToastError(
        "Không thể cập nhật hồ sơ",
        error instanceof Error ? error.message : "Vui lòng thử lời.",
      );
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleOpenPortfolio = (application: JobApplicationResponse) => {
    const portfolioPath = getPortfolioPath(application.portfolioSlug);
    if (portfolioPath) {
      navigate(portfolioPath);
      return;
    }

    if (application.userId) {
      navigate(`/portfolio/profile/${application.userId}`);
      return;
    }

    showToastInfo(
      "Chưa có portfolio",
      "Ứng viên này chưa công khai portfolio trên SkillVerse.",
    );
  };

  const handleContactApplicant = async (
    application: JobApplicationResponse,
  ) => {
    try {
      setIsActionBusy(true);
      const session = await recruitmentChatService.getOrCreateSession(
        application.userId,
        job?.id,
        "MANUAL",
        RecruitmentJobContextType.JOB_POSTING,
      );
      navigate("/messages", {
        state: {
          openChatWith: session.id.toString(),
          type: "RECRUITMENT",
        },
      });
    } catch (error: unknown) {
      showToastError(
        "Không thể mở chat",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setIsActionBusy(false);
    }
  };

  const applicationIds = new Set(
    applications.map((application) => application.id),
  );
  const applicationContractIds = new Set(
    applications
      .map((application) => application.contractId)
      .filter(
        (contractId): contractId is number => typeof contractId === "number",
      ),
  );
  // Only trust stable IDs here. Matching by title leaks contracts across jobs
  // whenever employers reuse the same job name.
  const allRelatedContracts = job
    ? contracts.filter((contract) => {
        const byJobId =
          typeof contract.jobId === "number" && contract.jobId === job.id;
        const byApplicationId =
          typeof contract.applicationId === "number" &&
          applicationIds.has(contract.applicationId);
        const byApplicationContractId = applicationContractIds.has(contract.id);

        return byJobId || byApplicationId || byApplicationContractId;
      })
    : [];
  const hiringTarget = Math.max(job?.hiringQuantity || 1, 1);
  const signedContracts = allRelatedContracts.filter(
    (contract) => contract.status === ContractStatus.SIGNED,
  );
  const completedContractsCount = Math.min(
    signedContracts.length,
    hiringTarget,
  );
  const scheduledInterviewCount = applications.filter(
    (a) => a.status === JobApplicationStatus.INTERVIEW_SCHEDULED,
  ).length;
  const completedInterviewCount = applications.filter(
    (a) => a.status === JobApplicationStatus.INTERVIEWED,
  ).length;
  // Hiring is complete only when signed contracts reach target or job is explicitly closed.
  const isJobClosed = job?.status === JobStatus.CLOSED;
  const isHiringCompleted = completedContractsCount >= hiringTarget || isJobClosed;
  const completionReferenceContract = signedContracts[0] || null;

  const getInterviewEndTime = (interview: InterviewScheduleResponse) => {
    const duration = interview.durationMinutes || 60;
    return new Date(interview.scheduledAt).getTime() + duration * 60 * 1000;
  };

  const canCompleteInterview = (interview: InterviewScheduleResponse) =>
    Date.now() >= getInterviewEndTime(interview);

  const getCompleteBlockedReason = (interview: InterviewScheduleResponse) => {
    const remainingMs = getInterviewEndTime(interview) - Date.now();
    if (remainingMs <= 0) {
      return "";
    }

    const remainingMinutes = Math.ceil(remainingMs / 60000);
    if (remainingMinutes < 60) {
      return `Chỉ có thể hoàn thành sau khi buổi phỏng vấn kết thúc. Còn khoảng ${remainingMinutes} phút.`;
    }

    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    if (minutes === 0) {
      return `Chỉ có thể hoàn thành sau khi buổi phỏng vấn kết thúc. Còn khoảng ${hours} giờ.`;
    }

    return `Chỉ có thể hoàn thành sau khi buổi phỏng vấn kết thúc. Còn khoảng ${hours} giờ ${minutes} phút.`;
  };

  const pendingApplications = applications.filter(
    (application) => application.status === JobApplicationStatus.PENDING,
  );
  const reviewedApplications = applications.filter(
    (application) => application.status === JobApplicationStatus.REVIEWED,
  );
  const acceptedApplications = applications.filter(
    (application) => application.status === JobApplicationStatus.ACCEPTED,
  );
  // For REMOTE jobs:
  //   - isNegotiable: must go through OFFER_SENT → OFFER_ACCEPTED before contract
  //   - NOT negotiable: INTERVIEWED → ACCEPTED (after INTERVIEW_APPROVED) → ready for contract
  // For ONSITE jobs: INTERVIEWED → ACCEPTED → ready for contract
  const contractReadyApplications = isHiringCompleted
    ? []
    : applications.filter(
        (application) =>
          !application.contractId &&
          (job?.isRemote
            ? job.isNegotiable
              ? application.status === JobApplicationStatus.OFFER_ACCEPTED
              : application.status === JobApplicationStatus.ACCEPTED ||
                application.status === JobApplicationStatus.INTERVIEWED
            : application.status === JobApplicationStatus.ACCEPTED ||
              application.status === JobApplicationStatus.INTERVIEWED),
      );

  useEffect(() => {
    if (isHiringCompleted) {
      setContractApplication(null);
      return;
    }

    if (
      contractApplication &&
      (!contractReadyApplications.some(
        (application) => application.id === contractApplication.id,
      ) ||
        contractApplication.status === JobApplicationStatus.INTERVIEW_SCHEDULED)
    ) {
      setContractApplication(null);
    }
  }, [contractApplication, contractReadyApplications, isHiringCompleted]);

  if (isLoading) {
    return (
      <div className="ftj-fullpage ftj-fullpage--loading">
        <Loader2 size={32} className="ftj-spin" />
        <p>Đang tải trung tâm quản lý job dài hạn...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="ftj-fullpage">
        <div className="ftj-empty">
          <XCircle size={32} />
          <div>
            <strong>Không tìm thấy job</strong>
            <p>Job có thể đã bị xóa hoặc bạn không còn quyền truy cập.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ftj-fullpage">
      <header className="ftj-fullpage__header">
        <div className="ftj-fullpage__header-left">
          <button
            className="ftj-fullpage__back"
            onClick={onBack}
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="ftj-fullpage__job-info">
            <strong>{job.title}</strong>
            <span
              className="ftj-fullpage__status-badge"
              style={{
                backgroundColor: `${STATUS_COLORS[job.status]}22`,
                color: STATUS_COLORS[job.status],
                borderColor: `${STATUS_COLORS[job.status]}44`,
              }}
            >
              {STATUS_LABELS[job.status] || job.status}
            </span>
          </div>
        </div>

        <div className="ftj-fullpage__header-right">
          <span className="ftj-fullpage__meta-pill">
            <DollarSign size={13} />
            {formatBudgetRange(job)}
          </span>
          <span className="ftj-fullpage__meta-pill">
            <Calendar size={13} />
            {formatDate(job.deadline)}
          </span>
          {isHiringCompleted && (
            <span className={`ftj-fullpage__meta-pill ${isJobClosed ? 'ftj-fullpage__meta-pill--ghost' : 'ftj-fullpage__meta-pill--success'}`}>
              {isJobClosed ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
              {isJobClosed ? "Tin đã đóng" : `Đã tuyển đủ ${completedContractsCount}/${hiringTarget}`}
            </span>
          )}

          <div className="ftj-fullpage__actions">
            {job.status === JobStatus.IN_PROGRESS && (
              <button
                className="ftj-btn ftj-btn--primary"
                disabled={isActionBusy}
                onClick={handleSubmitForApproval}
              >
                {isActionBusy ? (
                  <Loader2 size={14} className="ftj-spin" />
                ) : (
                  <Send size={14} />
                )}
                Gửi duyệt
              </button>
            )}

            {job.status === JobStatus.OPEN && (
              <button
                className="ftj-btn ftj-btn--ghost"
                disabled={isActionBusy}
                onClick={handleCloseJob}
              >
                <XCircle size={14} />
                Đóng tin
              </button>
            )}

            {job.status === JobStatus.IN_PROGRESS && (
              <button
                className="ftj-btn ftj-btn--danger"
                disabled={isActionBusy}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} />
                Xóa
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="ftj-fullpage__stats">
        <div className="ftj-fullpage__stat-item">
          <Users size={16} />
          <strong>{applications.length}</strong>
          <span>Ứng viên</span>
        </div>
        <div className="ftj-fullpage__stat-item">
          <SearchCheck size={16} />
          <strong>
            {pendingApplications.length + reviewedApplications.length}
          </strong>
          <span>Cần xử lý</span>
        </div>
        <div className="ftj-fullpage__stat-item">
          <UserCheck size={16} />
          <strong>{acceptedApplications.length}</strong>
          <span>Đã duyệt</span>
        </div>
        <div className="ftj-fullpage__stat-item">
          <FileSignature size={16} />
          <strong>{allRelatedContracts.length}</strong>
          <span>Hợp đồng liên quan</span>
        </div>
        <div className="ftj-fullpage__stat-item">
          {job.isRemote ? <Globe size={16} /> : <MapPin size={16} />}
          <strong>
            {job.isRemote ? "Remote / hybrid" : job.location || "On-site"}
          </strong>
          <span>Hình thức</span>
        </div>
        {job.jobType && (
          <div className="ftj-fullpage__stat-item">
            <Briefcase size={16} />
            <strong>{job.jobType?.replace(/_/g, " ") || "Full-time"}</strong>
            <span>Loại hình</span>
          </div>
        )}
      </div>

      <nav className="ftj-fullpage__tabs">
        <button
          className={`ftj-fullpage__tab ${activeTab === "overview" ? "is-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FileText size={14} />
          Tổng quan
        </button>
        <button
          className={`ftj-fullpage__tab ${activeTab === "applicants" ? "is-active" : ""}`}
          onClick={() => setActiveTab("applicants")}
        >
          <Users size={14} />
          Ứng viên ({applications.length})
        </button>
        <button
          className={`ftj-fullpage__tab ${activeTab === "interviews" ? "is-active" : ""}`}
          onClick={() => setActiveTab("interviews")}
        >
          <Calendar size={14} />
          Phỏng vấn
        </button>
        <button
          className={`ftj-fullpage__tab ${activeTab === "contracts" ? "is-active" : ""}`}
          onClick={() => setActiveTab("contracts")}
          style={{ display: job?.isRemote ? "" : "none" }}
        >
          <FileSignature size={14} />
          Hợp đồng ({allRelatedContracts.length})
        </button>
        <button
          className={`ftj-fullpage__tab ${activeTab === "offers" ? "is-active" : ""}`}
          onClick={() => setActiveTab("offers")}
          style={{ display: job?.isRemote && job?.isNegotiable ? "" : "none" }}
        >
          <Send size={14} />
          Đề nghị
        </button>
      </nav>

      <div className="ftj-fullpage__content">
        {activeTab === "overview" && (
          <div className="ftj-fullpage__overview">
            <div className="ftj-fullpage__overview-grid">
              <div className="ftj-fullpage__detail-card ftj-fullpage__detail-card--description">
                <h3>Mô tả công việc</h3>
                <JobMarkdownSurface
                  content={job.description || "Chưa có mô tả chi tiết."}
                  density="detail"
                  theme="cyan"
                  placeholder="Chưa có mô tả chi tiết."
                />
              </div>

              <div className="ftj-fullpage__detail-card">
                <h3>Thông tin tuyển dụng</h3>
                <div className="ftj-fullpage__info-list">
                  <div className="ftj-fullpage__info-row">
                    <span>Khoảng lương</span>
                    <strong>{formatBudgetRange(job)}</strong>
                  </div>
                  <div className="ftj-fullpage__info-row">
                    <span>Hạn nhận hồ sơ</span>
                    <strong>{formatDate(job.deadline)}</strong>
                  </div>
                  <div className="ftj-fullpage__info-row">
                    <span>Cập nhật cuối</span>
                    <strong>{formatDateTime(job.updatedAt)}</strong>
                  </div>
                  <div className="ftj-fullpage__info-row">
                    <span>Cấp độ</span>
                    <strong>{job.experienceLevel || "Không yêu cầu"}</strong>
                  </div>
                  <div className="ftj-fullpage__info-row">
                    <span>Loại hình</span>
                    <strong>
                      {job.jobType?.replace(/_/g, " ") || "Full-time"}
                    </strong>
                  </div>
                  <div className="ftj-fullpage__info-row">
                    <span>Số lượng tuyển</span>
                    <strong>
                      {job.hiringQuantity
                        ? `${job.hiringQuantity} người`
                        : "1 người"}
                    </strong>
                  </div>
                  <div className="ftj-fullpage__info-row">
                    <span>Giới tính</span>
                    <strong>{job.genderRequirement || "Không yêu cầu"}</strong>
                  </div>
                  <div className="ftj-fullpage__info-row">
                    <span>Địa điểm</span>
                    <strong>
                      {job.isRemote
                        ? "Remote / hybrid"
                        : job.location || "On-site"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="ftj-fullpage__signal-grid">
              <article className="ftj-fullpage__signal-card">
                <span className="ftj-fullpage__signal-label">
                  Applicant pipeline
                </span>
                <strong>{applications.length} hồ sơ đã vào hệ thống</strong>
                <p>
                  {pendingApplications.length} mới nộp,{" "}
                  {reviewedApplications.length} đã xem,
                  {acceptedApplications.length} đã duyệt.
                </p>
              </article>

              <article className="ftj-fullpage__signal-card">
                <span className="ftj-fullpage__signal-label">
                  {isHiringCompleted
                    ? (isJobClosed ? "Job Closed" : "Hiring completed")
                    : "Recruitment progress"}
                </span>
                <strong>
                  {isHiringCompleted
                    ? (isJobClosed ? "Đã dừng nhận hồ sơ" : `Đã tuyển đủ ${hiringTarget} vị trí`)
                    : `${scheduledInterviewCount + completedInterviewCount}/${hiringTarget} lịch phỏng vấn`}
                </strong>
                <p>
                  {isHiringCompleted
                    ? (isJobClosed ? "Job này đã được đóng lại. Không thể tiếp tục tương tác với ứng viên hay tạo hợp đồng mới." : "Job đã đạt chỉ tiêu: đủ hợp đồng hoặc đủ lịch phỏng vấn. Luồng tạo mới đã khóa.")
                    : `${completedContractsCount} hợp đồng ký hoàn tất, ${contractReadyApplications.length} ứng viên sẵn sàng tạo hợp đồng.`}
                </p>
              </article>
            </div>

            {job.requiredSkills?.length > 0 && (
              <div className="ftj-fullpage__detail-card">
                <h3>Kỹ năng yêu cầu</h3>
                <div className="ftj-fullpage__skills">
                  {job.requiredSkills.map((skill) => (
                    <span key={skill} className="ftj-fullpage__skill-chip">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.benefits && (
              <div className="ftj-fullpage__detail-card">
                <h3>Phúc lợi</h3>
                <div className="ftj-fullpage__benefits">
                  {job.benefits
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => (
                      <div key={line} className="ftj-fullpage__benefit-item">
                        <CheckCircle2 size={13} />
                        <span>{line.replace(/^-\s*/, "")}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "applicants" && (
          <div className="ftj-applicants">
            <div className="ftj-applicants__header">
              <div>
                <span className="ftj-applicants__eyebrow">Candidate queue</span>
                <h3>Review hồ sơ và xếp phỏng vấn</h3>
                <p>
                  Duyệt applicant ngay trên trang này, sau đó xếp phỏng vấn và
                  chuyển tiếp sang bước tiếp theo.
                </p>
              </div>
              <div className="ftj-applicants__summary">
                <span>{pendingApplications.length} mới nộp</span>
                <span>{acceptedApplications.length} đã duyệt</span>
                {isHiringCompleted && (
                  <span>
                    Đã tuyển đủ {completedContractsCount}/{hiringTarget}
                  </span>
                )}
              </div>
            </div>

            {isHiringCompleted && job?.isRemote && (
              <div className="ftj-contracts__completion-banner">
                <div>
                  <span className={`ftj-applicants__eyebrow ${isJobClosed ? '' : 'ftj-applicants__eyebrow--glow'}`}>
                    {isJobClosed ? "JOB CLOSED" : "JOB COMPLETED"}
                  </span>
                  <h4>{isJobClosed ? "Tin tuyển dụng đã đóng" : "Đợt tuyển đã hoàn thành"}</h4>
                  <p>
                    {isJobClosed 
                      ? "Bạn đã đóng tin tuyển dụng này. Mọi thao tác cập nhật trạng thái ứng viên hoặc hợp đồng đều đã bị khóa."
                      : "Đã có đủ hợp đồng ký hoàn tất để đạt chỉ tiêu tuyển dụng. Các thao tác duyệt thêm ứng viên hoặc tạo hợp đồng mới đã được khóa."}
                  </p>
                </div>
                {completionReferenceContract && (
                  <button
                    type="button"
                    className="ftj-btn ftj-btn--primary ftj-btn--cyan"
                    onClick={() =>
                      navigate(
                        `/business/contracts/${completionReferenceContract.id}`,
                      )
                    }
                  >
                    <FileSignature size={14} />
                    Xem hợp đồng đã ký
                  </button>
                )}
              </div>
            )}

            {applications.length === 0 ? (
              <div className="ftj-empty">
                <Users size={32} />
                <div>
                  <strong>Chưa có ứng viên nào</strong>
                  <p>
                    Khi có hồ sơ ứng tuyển, toàn bộ pipeline sẽ hiển thị tại
                    đây.
                  </p>
                </div>
              </div>
            ) : (
              <div className="ftj-applicants__grid">
                {applications.map((application) => {
                  const applicantName = getApplicantDisplayName(
                    application.userFullName,
                    application.userEmail,
                  );
                  const hasPortfolio = Boolean(application.portfolioSlug);

                  return (
                    <article
                      key={application.id}
                      className="ftj-applicant-card"
                    >
                      <div className="ftj-applicant-card__header">
                        <div className="ftj-applicant-card__identity">
                          {application.userAvatar ? (
                            <img
                              src={
                                resolveRecruitmentAssetUrl(
                                  application.userAvatar,
                                ) || ""
                              }
                              alt={applicantName}
                              className="ftj-applicant-card__avatar"
                            />
                          ) : (
                            <div className="ftj-applicant-card__avatar ftj-applicant-card__avatar--fallback">
                              {getApplicantInitials(
                                application.userFullName,
                                application.userEmail,
                              )}
                            </div>
                          )}
                          <div>
                            <strong>{applicantName}</strong>
                            <span>
                              {getApplicantSubtitle(
                                application.userProfessionalTitle,
                                hasPortfolio,
                              )}
                            </span>
                          </div>
                        </div>
                        <span
                          className="ftj-applicant-card__status"
                          style={{
                            backgroundColor: `${APP_STATUS_COLORS[application.status]}22`,
                            color: APP_STATUS_COLORS[application.status],
                          }}
                        >
                          {APP_STATUS_LABELS[application.status] ||
                            application.status}
                        </span>
                      </div>

                      <div className="ftj-applicant-card__meta">
                        <span>
                          <Clock3 size={13} />
                          Nộp lúc {formatDateTime(application.appliedAt)}
                        </span>
                        {application.contractStatus && (
                          <span>
                            <FileSignature size={13} />
                            {application.contractStatus}
                          </span>
                        )}
                      </div>

                      <p className="ftj-applicant-card__letter">
                        {application.coverLetter ||
                          "Ứng viên chưa để lại cover letter."}
                      </p>

                      <div className="ftj-applicant-card__actions">
                        {hasPortfolio && (
                          <button
                            type="button"
                            className="ftj-btn ftj-btn--secondary"
                            onClick={() => handleOpenPortfolio(application)}
                          >
                            <Sparkles size={13} />
                            Portfolio
                          </button>
                        )}

                        <button
                          type="button"
                          className="ftj-btn ftj-btn--ghost"
                          onClick={() =>
                            void handleContactApplicant(application)
                          }
                        >
                          <MessageSquare size={13} />
                          Liên hệ
                        </button>

                        {(application.status === JobApplicationStatus.OFFER_ACCEPTED ||
                          application.status === JobApplicationStatus.AWAITING_ONBOARDING_INFO ||
                          application.status === JobApplicationStatus.CONTRACT_SIGNED ||
                          application.status === JobApplicationStatus.HIRED ||
                          application.status === JobApplicationStatus.INTERVIEWED ||
                          application.status === JobApplicationStatus.ACCEPTED) && (
                          <button
                            type="button"
                            className="ftj-btn ftj-btn--secondary"
                            onClick={() => handleOpenOnboardingInfo(application)}
                          >
                            <ShieldCheck size={13} />
                            Xem thông tin pháp lý
                          </button>
                        )}

                        {!isHiringCompleted &&
                          (application.status ===
                            JobApplicationStatus.PENDING ||
                            application.status ===
                              JobApplicationStatus.REVIEWED) && (
                            <>
                              <button
                                type="button"
                                className="ftj-btn ftj-btn--primary ftj-btn--cyan"
                                onClick={() => {
                                  setDecisionModal({
                                    application,
                                    mode: "ACCEPTED",
                                  });
                                  setDecisionNote("");
                                }}
                              >
                                <CheckCircle2 size={13} />
                                Duyệt
                              </button>
                              <button
                                type="button"
                                className="ftj-btn ftj-btn--danger"
                                onClick={() => {
                                  setDecisionModal({
                                    application,
                                    mode: "REJECTED",
                                  });
                                  setDecisionNote("");
                                }}
                              >
                                <XCircle size={13} />
                                Từ chối
                              </button>
                            </>
                          )}

                        {!isHiringCompleted &&
                          application.status ===
                            JobApplicationStatus.ACCEPTED &&
                          !application.contractId && (
                            <button
                              type="button"
                              className="ftj-btn ftj-btn--primary ftj-btn--cyan"
                              onClick={() => {
                                setInterviewFormApp(application);
                                setContractApplication(null);
                                setActiveTab("interviews");
                              }}
                            >
                              <Calendar size={13} />
                              Xếp phỏng vấn
                            </button>
                          )}

                        {/* After INTERVIEWED — Remote jobs only (contract tab hidden for onsite) */}
                        {!isHiringCompleted &&
                          application.status ===
                            JobApplicationStatus.INTERVIEWED &&
                          Boolean(job?.isRemote) &&
                          !application.contractId && (
                            <>
                              {/* Negotiable: show "Gửi đề nghị" button */}
                              {job?.isNegotiable && (
                                <button
                                  type="button"
                                  className="ftj-btn ftj-btn--secondary"
                                  onClick={() => {
                                    setDecisionModal({
                                      application,
                                      mode: "OFFER_SENT",
                                    });
                                    setDecisionNote("");
                                  }}
                                >
                                  <Send size={13} />
                                  Gửi đề nghị
                                </button>
                              )}
                              {/* Non-negotiable: show Accept & Reject buttons */}
                              {!job?.isNegotiable && (
                                <>
                                  <button
                                    type="button"
                                    className="ftj-btn ftj-btn--primary ftj-btn--cyan"
                                    onClick={() => {
                                      setDecisionModal({
                                        application,
                                        mode: "INTERVIEW_APPROVED",
                                        interviewId: interviews.find(
                                          (i) =>
                                            i.applicationId === application.id,
                                        )?.id,
                                      });
                                      setDecisionNote("");
                                    }}
                                  >
                                    <CheckCircle2 size={13} />
                                    Chấp thuận
                                  </button>
                                  <button
                                    type="button"
                                    className="ftj-btn ftj-btn--danger"
                                    onClick={() => {
                                      setDecisionModal({
                                        application,
                                        mode: "INTERVIEW_REJECTED",
                                        interviewId: interviews.find(
                                          (i) =>
                                            i.applicationId === application.id,
                                        )?.id,
                                      });
                                      setDecisionNote("");
                                    }}
                                  >
                                    <XCircle size={13} />
                                    Từ chối
                                  </button>
                                </>
                              )}
                            </>
                          )}

                        {/* After INTERVIEWED — Onsite jobs: mark as hired */}
                        {!isHiringCompleted &&
                          application.status ===
                            JobApplicationStatus.INTERVIEWED &&
                          (job?.isRemote === false ||
                            job?.isRemote === undefined) &&
                          !application.contractId && (
                            <div className="ftj-onsite-hire">
                              <div className="ftj-onsite-hire__info">
                                <span>Ứng viên đã hoàn thành phỏng vấn</span>
                                <p>
                                  Ứng viên đã phỏng vấn xong. Bạn có thể đánh
                                  dấu tuyển đủ để hoàn thành đợt tuyển hoặc tiếp
                                  tục duyệt thêm ứng viên khác.
                                </p>
                              </div>
                              <div className="ftj-onsite-hire__actions">
                                <button
                                  type="button"
                                  className="ftj-btn ftj-btn--primary ftj-btn--cyan"
                                  onClick={async () => {
                                    try {
                                      setIsActionBusy(true);
                                      await jobService.updateApplicationStatus(
                                        application.id,
                                        {
                                          status: JobApplicationStatus.ACCEPTED,
                                          acceptanceMessage:
                                            "Ứng viên đã phỏng vấn thành công và được tuyển.",
                                        },
                                      );
                                      // Mark job as closed (hiring complete)
                                      await jobService.changeJobStatus(
                                        jobId,
                                        JobStatus.CLOSED,
                                      );
                                      showToastSuccess(
                                        "Đã hoàn thành đợt tuyển",
                                        `Đợt tuyển đã được đánh dấu tuyển đủ và đóng lại.`,
                                      );
                                      await loadData();
                                    } catch (err: any) {
                                      showToastError(
                                        "Không thể cập nhật",
                                        err instanceof Error
                                          ? err.message
                                          : "Vui lòng thử lại.",
                                      );
                                    } finally {
                                      setIsActionBusy(false);
                                    }
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                  Đánh dấu tuyển đủ
                                </button>
                              </div>
                            </div>
                          )}

                        {/* OFFER_REJECTED panel — recruiter's round 1 counter-received */}
                        {!isHiringCompleted &&
                          application.status ===
                            JobApplicationStatus.OFFER_REJECTED &&
                          Boolean(job?.isRemote) &&
                          Boolean(job?.isNegotiable) &&
                          !application.contractId && (
                            <div className="ftj-offer-response ftj-offer-response--rejected">
                              <div className="ftj-offer-response__header">
                                <Paperclip size={14} />
                                <strong>Ứng viên đã phản đề nghị</strong>
                              </div>
                              {/* Recruiter's original offer */}
                              {(application.offerSalary ||
                                application.offerDetails ||
                                application.offerAdditionalRequirements) && (
                                <div className="ftj-offer-response__original">
                                  <span className="ftj-offer-response__label">
                                    Đề nghị của bạn
                                  </span>
                                  {application.offerSalary && (
                                    <div className="ftj-offer-response__amount ftj-offer-response__amount--offer">
                                      {Number(
                                        application.offerSalary,
                                      ).toLocaleString("vi-VN")}{" "}
                                      VND/tháng
                                    </div>
                                  )}
                                  {application.offerDetails && (
                                    <p>{application.offerDetails}</p>
                                  )}
                                  {application.offerAdditionalRequirements && (
                                    <p className="ftj-offer-response__extra">
                                      <strong>Yêu cầu bổ sung:</strong>{" "}
                                      {application.offerAdditionalRequirements}
                                    </p>
                                  )}
                                </div>
                              )}
                              {/* Candidate's counter-offer */}
                              {(application.counterSalaryAmount ||
                                application.counterAdditionalRequirements) && (
                                <div className="ftj-offer-response__candidate ftj-offer-response__candidate--counter">
                                  <span className="ftj-offer-response__label">
                                    Phản đề nghị từ ứng viên
                                  </span>
                                  {application.counterSalaryAmount && (
                                    <div className="ftj-offer-response__amount ftj-offer-response__amount--counter">
                                      Yêu cầu:{" "}
                                      {Number(
                                        application.counterSalaryAmount,
                                      ).toLocaleString("vi-VN")}{" "}
                                      VND/tháng
                                    </div>
                                  )}
                                  {application.counterAdditionalRequirements && (
                                    <p>
                                      {
                                        application.counterAdditionalRequirements
                                      }
                                    </p>
                                  )}
                                </div>
                              )}

                              {application.offerRound === 1 ? (
                                <div className="ftj-offer-rejected-actions">
                                  <p className="ftj-offer-rejected-actions__hint">
                                    Ứng viên từ chối đề nghị lần 1. Bạn có thể
                                    gửi đề nghị mới (lần cuối) hoặc kết thúc hồ
                                    sơ.
                                  </p>
                                  <div className="ftj-offer-rejected-actions__btns">
                                    <button
                                      type="button"
                                      className="ftj-btn ftj-btn--secondary"
                                      onClick={() => {
                                        setDecisionModal({
                                          application,
                                          mode: "OFFER_SENT",
                                        });
                                        setDecisionNote("");
                                        setDecisionSalary("");
                                        setDecisionAdditionalReqs("");
                                      }}
                                    >
                                      <Send size={13} />
                                      Gửi đề nghị lần 2
                                    </button>
                                    <button
                                      type="button"
                                      className="ftj-btn ftj-btn--danger"
                                      onClick={() => {
                                        setDecisionModal({
                                          application,
                                          mode: "REJECTED",
                                        });
                                        setDecisionNote("");
                                      }}
                                    >
                                      <XCircle size={13} />
                                      Kết thúc
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="ftj-offer-rejected-actions">
                                  <p className="ftj-offer-rejected-actions__hint ftj-offer-rejected-actions__hint--final">
                                    <AlertTriangle size={14} />
                                    Ứng viên đã từ chối cả 2 lần đề nghị. Không
                                    thể gửi thêm.
                                  </p>
                                  <button
                                    type="button"
                                    className="ftj-btn ftj-btn--danger"
                                    onClick={() => {
                                      setDecisionModal({
                                        application,
                                        mode: "REJECTED",
                                      });
                                      setDecisionNote("");
                                    }}
                                  >
                                    <XCircle size={13} />
                                    Đánh dấu từ chối
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        {/* OFFER response panel — shown when candidate has responded to offer */}
                        {(application.status ===
                          JobApplicationStatus.OFFER_ACCEPTED ||
                          application.status ===
                            JobApplicationStatus.OFFER_REJECTED) && (
                          <div className="ftj-offer-response">
                            <div className="ftj-offer-response__header">
                              <Paperclip size={14} />
                              <strong>
                                {application.status ===
                                JobApplicationStatus.OFFER_ACCEPTED
                                  ? "Ứng viên đã chấp nhận đề nghị"
                                  : "Ứng viên đã phản đề nghị"}
                              </strong>
                            </div>
                            {(application.offerSalary ||
                              application.offerDetails ||
                              application.offerAdditionalRequirements) && (
                              <div className="ftj-offer-response__original">
                                <span className="ftj-offer-response__label">
                                  Đề nghị của bạn
                                </span>
                                {application.offerSalary && (
                                  <div className="ftj-offer-response__amount ftj-offer-response__amount--offer">
                                    {Number(
                                      application.offerSalary,
                                    ).toLocaleString("vi-VN")}{" "}
                                    VND/tháng
                                  </div>
                                )}
                                {application.offerDetails && (
                                  <p>{application.offerDetails}</p>
                                )}
                                {application.offerAdditionalRequirements && (
                                  <p className="ftj-offer-response__extra">
                                    <strong>Yêu cầu bổ sung:</strong>{" "}
                                    {application.offerAdditionalRequirements}
                                  </p>
                                )}
                              </div>
                            )}
                            {(application.counterSalaryAmount ||
                              application.counterAdditionalRequirements) && (
                              <div
                                className={`ftj-offer-response__candidate ftj-offer-response__candidate--counter`}
                              >
                                <span className="ftj-offer-response__label">
                                  Phản đề nghị từ ứng viên
                                </span>
                                {application.counterSalaryAmount && (
                                  <div className="ftj-offer-response__amount ftj-offer-response__amount--counter">
                                    Yêu cầu:{" "}
                                    {Number(
                                      application.counterSalaryAmount,
                                    ).toLocaleString("vi-VN")}{" "}
                                    VND/tháng
                                  </div>
                                )}
                                {application.counterAdditionalRequirements && (
                                  <p>
                                    {application.counterAdditionalRequirements}
                                  </p>
                                )}
                              </div>
                            )}
                            {application.candidateOfferResponse &&
                              !application.counterSalaryAmount && (
                                <div
                                  className={`ftj-offer-response__candidate ${
                                    application.status ===
                                    JobApplicationStatus.OFFER_ACCEPTED
                                      ? "ftj-offer-response__candidate--accepted"
                                      : "ftj-offer-response__candidate--counter"
                                  }`}
                                >
                                  <span className="ftj-offer-response__label">
                                    {application.status ===
                                    JobApplicationStatus.OFFER_ACCEPTED
                                      ? "Lời nhắn của ứng viên"
                                      : "Phản đề nghị từ ứng viên"}
                                  </span>
                                  <p>{application.candidateOfferResponse}</p>
                                </div>
                              )}
                            {application.status ===
                              JobApplicationStatus.OFFER_ACCEPTED &&
                              !application.contractId && (
                                <button
                                  type="button"
                                  className="ftj-btn ftj-btn--primary ftj-btn--cyan"
                                  onClick={() => {
                                    setContractApplication(application);
                                    setActiveTab("contracts");
                                  }}
                                >
                                  <FileSignature size={13} />
                                  Tạo hợp đồng
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

        {activeTab === "interviews" && (
          <div className="ftj-interviews">
            <div className="ftj-interviews__hero">
              <div>
                <span className="ftj-applicants__eyebrow">Interview desk</span>
                <h3>Lịch phỏng vấn của job này</h3>
                <p>
                  Xếp lịch, theo dõi và quản lý các buổi phỏng vấn ứng viên.
                  {job?.isRemote
                    ? " Job remote hỗ trợ đầy đủ hình thức: Google Meet, Zoom, Teams, SkillVerse Room."
                    : " Job onsite sử dụng hình thức phỏng vấn trực tiếp tại công ty."}
                </p>
              </div>
            </div>

            {interviewFormApp ? (
              <InterviewScheduleForm
                application={interviewFormApp}
                isRemote={!!job?.isRemote}
                onClose={() => setInterviewFormApp(null)}
                onScheduled={() => {
                  setInterviewFormApp(null);
                  void loadData();
                }}
              />
            ) : interviews.length === 0 ? (
              <div className="ftj-interviews__empty">
                <Calendar size={28} />
                <div>
                  <strong>Chưa có lịch phỏng vấn nào</strong>
                  <p>
                    Từ tab Ứng viên, chọn ứng viên đã duyệt và nhấn &quot;Xếp
                    phỏng vấn&quot; để tạo lịch.
                  </p>
                </div>
              </div>
            ) : (
              <div className="ftj-interviews__list">
                {interviews.map((interview) => {
                  const interviewCanBeCompleted =
                    canCompleteInterview(interview);
                  const completeBlockedReason =
                    getCompleteBlockedReason(interview);

                  return (
                    <article key={interview.id} className="ftj-interview-card">
                      <div className="ftj-interview-card__header">
                        <div className="ftj-interview-card__identity">
                          {interview.candidateAvatarUrl ? (
                            <img
                              src={resolveRecruitmentAssetUrl(
                                interview.candidateAvatarUrl,
                              )}
                              alt={interview.candidateName}
                              className="ftj-interview-card__avatar"
                            />
                          ) : (
                            <div className="ftj-interview-card__avatar ftj-interview-card__avatar--fallback">
                              {interview.candidateName?.[0]?.toUpperCase() ||
                                "?"}
                            </div>
                          )}
                          <div>
                            <strong>{interview.candidateName}</strong>
                            <span>{interview.jobTitle}</span>
                          </div>
                        </div>
                        <span
                          className="ftj-interview-card__status"
                          data-status={interview.status}
                        >
                          {interview.status === InterviewStatus.PENDING
                            ? "Chờ xác nhận"
                            : interview.status === InterviewStatus.CONFIRMED
                              ? "Đã xác nhận"
                              : interview.status === InterviewStatus.COMPLETED
                                ? "Hoàn thành"
                                : interview.status === InterviewStatus.CANCELLED
                                  ? "Đã hủy"
                                  : interview.status === InterviewStatus.NO_SHOW
                                    ? "Không đến"
                                    : interview.status}
                        </span>
                      </div>
                      <div className="ftj-interview-card__meta">
                        <span>
                          <Calendar size={13} />
                          {formatDateTime(interview.scheduledAt)}
                        </span>
                        <span>
                          <Clock3 size={13} />
                          {interview.durationMinutes} phút
                        </span>
                      </div>
                      {interview.meetingLink && (
                        <div className="ftj-interview-card__link">
                          <Link2 size={13} />
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {interview.meetingLink}
                          </a>
                        </div>
                      )}
                      <div className="ftj-interview-card__meeting-type">
                        <MeetingTypeIcon meetingType={interview.meetingType} />
                        <span>
                          {getMeetingTypeLabel(interview.meetingType)}
                        </span>
                      </div>
                      {interview.interviewerName && (
                        <div className="ftj-interview-card__interviewer">
                          <UserCheck size={13} />
                          {interview.interviewerName}
                        </div>
                      )}
                      <div className="ftj-interview-card__actions">
                        {interview.status === InterviewStatus.PENDING && (
                          <>
                            <button
                              type="button"
                              className="ftj-btn ftj-btn--primary ftj-btn--cyan"
                              disabled={!interviewCanBeCompleted}
                              title={
                                interviewCanBeCompleted
                                  ? undefined
                                  : completeBlockedReason
                              }
                              onClick={() => {
                                if (!interviewCanBeCompleted) {
                                  showToastError(
                                    "Chưa thể hoàn thành",
                                    completeBlockedReason,
                                  );
                                  return;
                                }

                                if (job?.isRemote) {
                                  const app = applications.find(
                                    (a) => a.id === interview.applicationId,
                                  );
                                  if (app)
                                    setInterviewCompleteModal({
                                      application: app,
                                      interview,
                                    });
                                } else {
                                  void (async () => {
                                    try {
                                      await interviewService.completeInterview(
                                        interview.id,
                                        "",
                                      );
                                      // Update application to INTERVIEWED for onsite
                                      await jobService.updateApplicationStatus(
                                        interview.applicationId,
                                        {
                                          status:
                                            JobApplicationStatus.INTERVIEWED,
                                          acceptanceMessage:
                                            "Phỏng vấn onsite hoàn thành.",
                                        },
                                      );
                                      void loadData();
                                    } catch (e) {
                                      showToastError(
                                        "Lỗi",
                                        "Không thể hoàn thành phỏng vấn",
                                      );
                                    }
                                  })();
                                }
                              }}
                            >
                              <CheckCircle2 size={13} />
                              Hoàn thành
                            </button>
                            <button
                              type="button"
                              className="ftj-btn ftj-btn--danger"
                              onClick={async () => {
                                try {
                                  await interviewService.cancelInterview(
                                    interview.id,
                                  );
                                  void loadData();
                                } catch (e) {
                                  showToastError("Lỗi", "Không thể hủy phỏng vấn");
                                }
                              }}
                            >
                              <XCircle size={13} />
                              Hủy
                            </button>
                          </>
                        )}
                        {interview.status === InterviewStatus.CONFIRMED && (
                          <button
                            type="button"
                            className="ftj-btn ftj-btn--primary ftj-btn--cyan"
                            disabled={!interviewCanBeCompleted}
                            title={
                              interviewCanBeCompleted
                                ? undefined
                                : completeBlockedReason
                            }
                            onClick={() => {
                              if (!interviewCanBeCompleted) {
                                showToastError(
                                  "Chưa thể hoàn thành",
                                  completeBlockedReason,
                                );
                                return;
                              }

                              if (job?.isRemote) {
                                const app = applications.find(
                                  (a) => a.id === interview.applicationId,
                                );
                                if (app)
                                  setInterviewCompleteModal({
                                    application: app,
                                    interview,
                                  });
                              } else {
                                void (async () => {
                                  try {
                                    await interviewService.completeInterview(
                                      interview.id,
                                      "",
                                    );
                                    await jobService.updateApplicationStatus(
                                      interview.applicationId,
                                      {
                                        status:
                                          JobApplicationStatus.INTERVIEWED,
                                        acceptanceMessage:
                                          "Phỏng vấn onsite hoàn thành.",
                                      },
                                    );
                                    void loadData();
                                  } catch (e) {
                                    showToastError(
                                      "Lỗi",
                                      "Không thể hoàn thành phỏng vấn",
                                    );
                                  }
                                })();
                              }
                            }}
                          >
                            <CheckCircle2 size={13} />
                            Hoàn thành
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "contracts" && (
          <div className="ftj-contracts">
            <div className="ftj-contracts__hero">
              <div>
                <span className="ftj-applicants__eyebrow">Contract desk</span>
                <h3>Hợp đồng lao động gắn với job này</h3>
                <p>
                  Tạo hợp đồng từ applicant đã duyệt và theo dõi trạng thái ký
                  kết ngay trong cùng luồng quản trị job full-time.
                </p>
                {contractsUnavailable && (
                  <p>
                    Dữ liệu hợp đồng hiện chưa tải được vì API `/contracts/my`
                    đang lỗi. Bạn vẫn có thể chọn ứng viên và soạn hợp đồng mới
                    trực tiếp ở bên dưới.
                  </p>
                )}
              </div>
              <div className="ftj-contracts__hero-actions">
                <button
                  type="button"
                  className="ftj-btn ftj-btn--primary"
                  disabled={
                    isHiringCompleted || contractReadyApplications.length === 0
                  }
                  onClick={() =>
                    setContractApplication(contractReadyApplications[0] || null)
                  }
                >
                  <Plus size={14} />
                  {isHiringCompleted
                    ? "Đã tuyển đủ"
                    : job?.isRemote
                      ? "Tạo hợp đồng mới"
                      : "Tạo hợp đồng mới"}
                </button>
                {job?.isRemote &&
                  contractReadyApplications.length === 0 &&
                  !isHiringCompleted && (
                    <p className="ftj-contracts__remote-note">
                      Ứng viên cần hoàn thành phỏng vấn và nhận đề nghị trước
                      khi tạo hợp đồng.
                    </p>
                  )}
              </div>
            </div>

            {isHiringCompleted && job?.isRemote && (
              <div className="ftj-contracts__completion-banner">
                <div>
                  <span className={`ftj-applicants__eyebrow ${isJobClosed ? '' : 'ftj-applicants__eyebrow--glow'}`}>
                    {isJobClosed ? "JOB CLOSED" : "SIGNED MILESTONE"}
                  </span>
                  <h4>{isJobClosed ? "Job đã đóng" : "Job đã hoàn thành theo hợp đồng đã ký"}</h4>
                  <p>
                    {isJobClosed
                      ? "Bạn đã đóng tin tuyển dụng này. Không thể tạo thêm hợp đồng mới cho job này ở frontend."
                      : `Hệ thống đã ghi nhận đủ ${completedContractsCount}/${hiringTarget} vị trí có hợp đồng được hai bên ký hoàn tất. Không thể tạo thêm hợp đồng mới cho job này ở frontend.`}
                  </p>
                </div>
                {completionReferenceContract && (
                  <button
                    type="button"
                    className="ftj-btn ftj-btn--primary ftj-btn--cyan"
                    onClick={() =>
                      navigate(
                        `/business/contracts/${completionReferenceContract.id}`,
                      )
                    }
                  >
                    <FileSignature size={14} />
                    Mở hợp đồng đã ký
                  </button>
                )}
              </div>
            )}

            <div className="ftj-contracts__rail">
              <article className="ftj-contracts__panel">
                <div className="ftj-contracts__panel-head">
                  <h4>Ứng viên đủ điều kiện</h4>
                  <span>{contractReadyApplications.length}</span>
                </div>
                {contractReadyApplications.length === 0 ? (
                  <div className="ftj-contracts__empty">
                    <FileSignature size={24} />
                    <p>
                      {isHiringCompleted
                        ? "Job đã tuyển đủ và hoàn tất ký hợp đồng. Danh sách tạo mới đã được đóng."
                        : "Chưa có ứng viên đã duyệt nào cần tạo hợp đồng mới."}
                    </p>
                  </div>
                ) : (
                  <div className="ftj-contracts__candidate-list">
                    {contractReadyApplications.map((application) => (
                      <button
                        key={application.id}
                        type="button"
                        className={`ftj-contracts__candidate ${
                          contractApplication?.id === application.id
                            ? "is-active"
                            : ""
                        }`}
                        onClick={() => setContractApplication(application)}
                      >
                        <div>
                          <strong>
                            {getApplicantDisplayName(
                              application.userFullName,
                              application.userEmail,
                            )}
                          </strong>
                          <span>{application.userEmail}</span>
                        </div>
                        <Plus size={14} />
                      </button>
                    ))}
                  </div>
                )}
              </article>
              <article className="ftj-contracts__panel ftj-contracts__panel--wide">
                <div className="ftj-contracts__panel-head">
                  <h4>Hợp đồng đã tạo</h4>
                  <span>{allRelatedContracts.length}</span>
                </div>

                {allRelatedContracts.length === 0 ? (
                  <div className="ftj-contracts__empty">
                    <FileSignature size={24} />
                    <p>Chưa có hợp đồng nào gắn với job này.</p>
                  </div>
                ) : (
                  <div className="ftj-contracts__grid">
                    {allRelatedContracts.map((contract) => (
                      <button
                        key={contract.id}
                        type="button"
                        className="ftj-contract-card"
                        onClick={() =>
                          navigate(`/business/contracts/${contract.id}`)
                        }
                      >
                        <div className="ftj-contract-card__top">
                          <div>
                            <span className="ftj-contract-card__number">
                              {contract.contractNumber}
                            </span>
                            <h4>{contract.candidateName}</h4>
                          </div>
                          <span
                            className={`ftj-contract-card__status ${getContractStatusClass(
                              contract.status,
                            )}`}
                          >
                            {CONTRACT_STATUS_LABELS[contract.status] ||
                              contract.status}
                          </span>
                        </div>

                        <div className="ftj-contract-card__meta">
                          <span>
                            <DollarSign size={13} />
                            {formatBudget(contract.salary)}
                          </span>
                          <span>
                            <Calendar size={13} />
                            Bắt đầu {formatDate(contract.startDate)}
                          </span>
                        </div>

                        <div className="ftj-contract-card__footer">
                          <span>{contract.jobTitle || job.title}</span>
                          <span>Xem chi tiết</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <section className="ftj-contract-composer">
              <div className="ftj-contract-composer__header">
                <div>
                  <span className="ftj-applicants__eyebrow">
                    Contract composer
                  </span>
                  <h3>
                    {isHiringCompleted
                      ? "Job đã hoàn thành, chỉ còn chế độ xem"
                      : contractApplication
                        ? `Soạn hợp đồng cho ${getApplicantDisplayName(
                            contractApplication.userFullName,
                            contractApplication.userEmail,
                          )}`
                        : "Chọn ứng viên để bắt đầu soạn hợp đồng"}
                  </h3>
                  <p>
                    {isHiringCompleted
                      ? "Sau khi đủ hợp đồng được ký hoàn tất, frontend sẽ ngừng cho phép mở form tạo mới để giữ trạng thái job nhất quán với backend."
                      : "Toàn bộ điều khoản, ngày hiệu lực và mức lương được xử lý trực tiếp trong command flow của job này, không cần mở modal riêng."}
                  </p>
                </div>
                {!isHiringCompleted && contractApplication && (
                  <button
                    type="button"
                    className="ftj-btn ftj-btn--ghost"
                    onClick={() => { setContractApplication(null); setContractMode('choose'); }}
                  >
                    <XCircle size={14} />
                    Bỏ chọn ứng viên
                  </button>
                )}
              </div>

              {isHiringCompleted ? (
                <div className="ftj-contract-composer__empty ftj-contract-composer__empty--completed">
                  <CheckCircle2 size={26} />
                  <div>
                    <strong>Form hợp đồng đã được khóa sau khi tuyển đủ</strong>
                    <p>
                      Ít nhất một hợp đồng đã được ký hoàn tất và job này đã đạt
                      đủ chỉ tiêu tuyển dụng. Chỉ còn thao tác xem lại hợp đồng
                      đã ký.
                    </p>
                  </div>
                </div>
              ) : contractApplication ? (
                <div className="ftj-contract-composer__body">
                  <div className="ftj-contract-composer__candidate">
                    <div className="ftj-contract-composer__identity">
                      <div className="ftj-contract-composer__avatar">
                        {resolveRecruitmentAssetUrl(
                          contractApplication.userAvatar,
                        ) ? (
                          <img
                            src={
                              resolveRecruitmentAssetUrl(
                                contractApplication.userAvatar,
                              ) || ""
                            }
                            alt={contractApplication.userFullName}
                          />
                        ) : (
                          <span>
                            {getApplicantInitials(
                              contractApplication.userFullName,
                              contractApplication.userEmail,
                            )}
                          </span>
                        )}
                      </div>
                      <div>
                        <strong>
                          {getApplicantDisplayName(
                            contractApplication.userFullName,
                            contractApplication.userEmail,
                          )}
                        </strong>
                        <span>
                          {getApplicantSubtitle(
                            contractApplication.userProfessionalTitle,
                            Boolean(contractApplication.portfolioSlug),
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="ftj-contract-composer__meta">
                      <span>
                        <Calendar size={13} />
                        Ứng tuyển {formatDate(contractApplication.appliedAt)}
                      </span>
                      <span>
                        <DollarSign size={13} />
                        {formatBudgetRange(job)}
                      </span>
                      <span>
                        <MapPin size={13} />
                        {job.location ||
                          (job.isRemote ? "Remote" : "Chưa thiết lập")}
                      </span>
                    </div>
                  </div>

                  <div className="ftj-contract-composer__panel">
                    {contractMode === 'choose' ? (
                      <div className="ftj-contract-mode-picker">
                        <p style={{
                          fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 16px',
                        }}>
                          Chọn cách tạo hợp đồng cho ứng viên này:
                        </p>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="ftj-btn ftj-btn--primary"
                            style={{
                              flex: 1, minWidth: 200, padding: '18px 24px',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                              background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.2)',
                              borderRadius: 12, color: '#00f0ff', cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => setContractMode('create')}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,240,255,0.12)';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,240,255,0.35)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,240,255,0.06)';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,240,255,0.2)';
                            }}
                          >
                            <FileSignature size={28} />
                            <strong style={{ fontSize: '0.95rem' }}>Soạn hợp đồng</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                              Tạo hợp đồng trực tiếp từ form của SkillVerse với đầy đủ điều khoản lương, quyền lợi.
                            </span>
                          </button>
                          <button
                            type="button"
                            className="ftj-btn ftj-btn--primary"
                            style={{
                              flex: 1, minWidth: 200, padding: '18px 24px',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                              background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
                              borderRadius: 12, color: '#8b5cf6', cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => setContractMode('upload')}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.12)';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.35)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.06)';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.2)';
                            }}
                          >
                            <FileText size={28} />
                            <strong style={{ fontSize: '0.95rem' }}>Upload hợp đồng PDF</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                              Upload file PDF hợp đồng của công ty và gửi trực tiếp cho ứng viên ký.
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : contractMode === 'upload' ? (
                      <RecruiterContractUpload
                        applicationId={contractApplication.id}
                        onSuccess={() => {
                          showToastSuccess(
                            "Đã upload & gửi hợp đồng",
                            "Hợp đồng PDF đã được gửi cho ứng viên.",
                          );
                          setContractApplication(null);
                          setContractMode('choose');
                          void loadData();
                        }}
                        onCancel={() => setContractMode('choose')}
                      />
                    ) : (
                      <>
                        <div style={{ marginBottom: 12 }}>
                          <button
                            type="button"
                            className="ftj-btn ftj-btn--ghost"
                            onClick={() => setContractMode('choose')}
                            style={{ fontSize: '0.82rem' }}
                          >
                            ← Quay lại chọn loại
                          </button>
                        </div>
                        <ContractForm
                          applicationId={contractApplication.id}
                          initialApplication={contractApplication}
                          availableApplications={contractReadyApplications}
                          defaultWorkingLocation={
                            job.location || (job.isRemote ? "Remote" : "")
                          }
                          onSuccess={(contract) => {
                            showToastSuccess(
                              "Đã tạo hợp đồng",
                              `Hợp đồng #${contract.contractNumber} đã được tạo và gửi ký.`,
                            );
                            setContractApplication(null);
                            setContractMode('choose');
                            void loadData();
                          }}
                          onCancel={() => {
                            setContractMode('choose');
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ftj-contract-composer__empty">
                  <FileSignature size={26} />
                  <div>
                    <strong>Chưa chọn ứng viên để soạn hợp đồng</strong>
                    <p>
                      Chọn một ứng viên đã duyệt ở cột bên trên hoặc bấm "Tạo
                      hợp đồng mới" để đổ form trực tiếp vào command center.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "offers" && job && (
          <FullTimeJobOffersTab
            job={job}
            applications={applications}
            onRefresh={() => loadData()}
          />
        )}
      </div>

      {/* ── Interview complete modal (remote jobs) ────────────── */}
      {interviewCompleteModal && (
        <div
          className="ftj-modal-backdrop"
          onClick={() => setInterviewCompleteModal(null)}
        >
          <div className="ftj-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ftj-modal__eyebrow">Kết thúc phỏng vấn</span>
            <h3>{interviewCompleteModal.application.userFullName}</h3>
            <p>
              Sau khi hoàn thành, bạn có thể duyệt để tạo hợp đồng hoặc từ chối
              ứng viên.
              {job?.isNegotiable
                ? " Job lương thỏa thuận sẽ chuyển sang tab Đề nghị để bạn gửi đề nghị."
                : " Job lương cố định sẽ chuyển thẳng sang tạo hợp đồng."}
            </p>
            <textarea
              className="ftj-modal__textarea"
              rows={4}
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Ghi chú sau phỏng vấn (tùy chọn)..."
            />
            <div className="ftj-modal__actions">
              <button
                className="ftj-btn ftj-btn--secondary"
                onClick={() => setInterviewCompleteModal(null)}
              >
                Đóng
              </button>
              <button
                className="ftj-btn ftj-btn--danger"
                onClick={() => {
                  setDecisionModal({
                    application: interviewCompleteModal.application,
                    mode: "INTERVIEW_REJECTED",
                    interviewId: interviewCompleteModal.interview.id,
                  });
                  setDecisionNote("");
                  setInterviewCompleteModal(null);
                }}
              >
                <XCircle size={14} />
                Từ chối
              </button>
              <button
                className="ftj-btn ftj-btn--primary"
                onClick={() => {
                  setDecisionModal({
                    application: interviewCompleteModal.application,
                    mode: "INTERVIEW_APPROVED",
                    interviewId: interviewCompleteModal.interview.id,
                  });
                  setDecisionNote("");
                  setInterviewCompleteModal(null);
                }}
              >
                <CheckCircle2 size={14} />
                {job?.isNegotiable
                  ? "Chấp thuận & gửi đề nghị"
                  : "Duyệt & tạo hợp đồng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Decision modal (application approve/reject/offer) ──── */}
      {decisionModal && (
        <div
          className="ftj-modal-backdrop"
          onClick={() => !isActionBusy && setDecisionModal(null)}
        >
          <div className="ftj-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ftj-modal__eyebrow">
              {decisionModal.mode === "ACCEPTED"
                ? "Duyệt hồ sơ"
                : decisionModal.mode === "OFFER_SENT" &&
                    decisionModal.application.offerRound === 2
                  ? "Gửi đề nghị lần 2"
                  : decisionModal.mode === "OFFER_SENT"
                    ? "Gửi đề nghị"
                    : decisionModal.mode === "INTERVIEW_APPROVED"
                      ? "Chấp thuận ứng viên"
                      : decisionModal.mode === "INTERVIEW_REJECTED"
                        ? "Từ chối ứng viên"
                        : "Từ chối hồ sơ"}
            </span>
            <h3>
              {getApplicantDisplayName(
                decisionModal.application.userFullName,
                decisionModal.application.userEmail,
              )}
            </h3>
            {decisionModal.mode === "OFFER_SENT" ? (
              <>
                <p>
                  {decisionModal.application.offerRound === 2
                    ? "Đây là vòng cuối. Nếu ứng viên từ chối, hồ sơ sẽ bị kết thúc vĩnh viễn."
                    : "Nhập mức lương và điều kiện để gửi đề nghị tới ứng viên."}
                </p>
                <div
                  className="ftj-modal__field"
                  style={{ marginTop: "0.5rem" }}
                >
                  <label className="ftj-modal__label">
                    <DollarSign size={13} />
                    Mức lương đề nghị (VND){" "}
                    <span className="ftj-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="ftj-modal__input"
                    value={decisionSalary}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setDecisionSalary(
                        raw ? parseInt(raw).toLocaleString("vi-VN") : "",
                      );
                    }}
                    placeholder={`Job range: ${job?.minBudget ? job.minBudget.toLocaleString("vi-VN") : "?"} - ${job?.maxBudget ? job.maxBudget.toLocaleString("vi-VN") : "?"} VND`}
                  />
                  {decisionSalary && (
                    <span className="ftj-modal__field-hint">
                      ={" "}
                      {parseInt(
                        decisionSalary.replace(/[^0-9]/g, ""),
                      ).toLocaleString("vi-VN")}{" "}
                      VND/tháng
                    </span>
                  )}
                </div>
                <div className="ftj-modal__field">
                  <label className="ftj-modal__label">
                    <Plus size={13} />
                    Yêu cầu &amp; điều kiện bổ sung
                  </label>
                  <textarea
                    className="ftj-modal__textarea"
                    rows={4}
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="Mô tả thêm: thời hạn thử việc, quyền lợi, lịch làm việc, địa điểm, điều kiện kết thúc..."
                  />
                </div>
                <div className="ftj-modal__field">
                  <label className="ftj-modal__label">
                    Ghi chú nội bộ (tùy chọn)
                  </label>
                  <textarea
                    className="ftj-modal__textarea"
                    rows={2}
                    value={decisionAdditionalReqs}
                    onChange={(e) => setDecisionAdditionalReqs(e.target.value)}
                    placeholder="Ghi chú riêng cho nhà tuyển dụng (không hiển thị với ứng viên)..."
                  />
                </div>
              </>
            ) : (
              <>
                <p>
                  {decisionModal.mode === "ACCEPTED"
                    ? "Nhập lời nhắn gửi tới ứng viên khi được chấp nhận vào vòng phỏng vấn."
                    : decisionModal.mode === "INTERVIEW_APPROVED" &&
                        !job?.isNegotiable
                      ? "Ứng viên sẽ được chuyển thẳng sang bước ký hợp đồng. Nhập ghi chú (tùy chọn)."
                      : decisionModal.mode === "INTERVIEW_APPROVED" &&
                          job?.isNegotiable
                        ? "Ứng viên sẽ được chuyển sang bước gửi đề nghị. Nhập ghi chú (tùy chọn)."
                        : decisionModal.mode === "REJECTED" &&
                            decisionModal.application.status ===
                              JobApplicationStatus.OFFER_REJECTED
                          ? "Ứng viên đã từ chối đề nghị lần cuối. Xác nhận kết thúc hồ sơ này."
                          : "Nhập lý do từ chối để hệ thống gửi phản hồi rõ ràng cho ứng viên."}
                </p>
                <textarea
                  className="ftj-modal__textarea"
                  rows={5}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder={
                    decisionModal.mode === "ACCEPTED"
                      ? "Ví dụ: Hồ sơ phù hợp với vị trí, mời bạn tiếp tục bước xếp phỏng vấn."
                      : decisionModal.mode === "INTERVIEW_APPROVED"
                        ? "Ghi chú sau phỏng vấn (tùy chọn)..."
                        : decisionModal.mode === "REJECTED" &&
                            decisionModal.application.status ===
                              JobApplicationStatus.OFFER_REJECTED
                          ? "Ghi chú kết thúc (tùy chọn)..."
                          : "Ví dụ: Kinh nghiệm hiện tại chưa phù hợp với phạm vi công việc này."
                  }
                />
              </>
            )}
            <div className="ftj-modal__actions">
              <button
                className="ftj-btn ftj-btn--secondary"
                onClick={() => setDecisionModal(null)}
                disabled={isActionBusy}
              >
                Hủy
              </button>
              <button
                className={
                  decisionModal.mode === "INTERVIEW_REJECTED" ||
                  decisionModal.mode === "REJECTED"
                    ? "ftj-btn ftj-btn--danger"
                    : "ftj-btn ftj-btn--primary"
                }
                onClick={handleApplicantDecision}
                disabled={isActionBusy}
              >
                {isActionBusy ? (
                  <Loader2 size={14} className="ftj-spin" />
                ) : decisionModal.mode === "ACCEPTED" ||
                  decisionModal.mode === "INTERVIEW_APPROVED" ? (
                  <CheckCircle2 size={14} />
                ) : decisionModal.mode === "OFFER_SENT" ? (
                  <Send size={14} />
                ) : (
                  <XCircle size={14} />
                )}
                {decisionModal.mode === "ACCEPTED" ||
                decisionModal.mode === "INTERVIEW_APPROVED"
                  ? "Xác nhận duyệt"
                  : decisionModal.mode === "OFFER_SENT"
                    ? decisionModal.application.offerRound === 2
                      ? "Gửi đề nghị lần 2"
                      : "Gửi đề nghị lần 1"
                    : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="ftj-modal-backdrop"
          onClick={() => !isActionBusy && setShowDeleteConfirm(false)}
        >
          <div
            className="ftj-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="ftj-modal__eyebrow">Xác nhận xóa</span>
            <h3>Xóa job "{job.title}"?</h3>
            <p>
              Hành động này không thể hoàn tác. Toàn bộ dữ liệu gắn với bản nháp
              tuyển dụng này sẽ bị xóa khỏi dashboard.
            </p>
            <div className="ftj-modal__actions">
              <button
                className="ftj-btn ftj-btn--secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isActionBusy}
              >
                Hủy
              </button>
              <button
                className="ftj-btn ftj-btn--danger"
                onClick={handleDeleteJob}
                disabled={isActionBusy}
              >
                {isActionBusy ? (
                  <Loader2 size={14} className="ftj-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blockers Modal */}
      {closeBlockers && (
        <div className="ftj-modal-backdrop" onClick={() => setCloseBlockers(null)}>
          <div className="ftj-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <span className="ftj-modal__eyebrow" style={{ color: '#f43f5e' }}>
              <AlertTriangle size={14} style={{ marginRight: 6 }} />
              Không thể đóng tin
            </span>
            <h3>Còn {closeBlockers.length} tác vụ chưa hoàn tất</h3>
            <p style={{ marginBottom: 16 }}>
              Vui lòng xử lý dứt điểm các hồ sơ ứng viên và hợp đồng sau trước khi đóng job:
            </p>
            <div style={{ maxHeight: 300, overflowY: 'auto', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 8, border: '1px solid #334155' }}>
              {closeBlockers.map((blocker, idx) => (
                <div key={idx} style={{ padding: 12, borderBottom: idx < closeBlockers.length - 1 ? '1px solid #334155' : 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>
                      {blocker.type === 'APPLICATION' ? `Hồ sơ ứng viên #${blocker.id}` : `Hợp đồng #${blocker.id}`}
                    </strong>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
                      {blocker.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Ứng viên: <span style={{ color: '#cbd5e1' }}>{blocker.candidateName} ({blocker.candidateEmail})</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#f87171', marginTop: 4 }}>
                    Lý do: {blocker.reason}
                  </div>
                </div>
              ))}
            </div>
            <div className="ftj-modal__actions" style={{ marginTop: 24 }}>
              <button
                className="ftj-btn ftj-btn--primary"
                onClick={() => setCloseBlockers(null)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Onboarding Info Modal */}
      {onboardingModalCandidate && (
        <div className="ftj-modal-backdrop" onClick={() => setOnboardingModalCandidate(null)}>
          <div className="ftj-onboarding-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ftj-onboarding-modal__header">
              <ShieldCheck size={24} className="ftj-onboarding-modal__icon" />
              <div>
                <h2>Thông tin pháp lý & Onboarding</h2>
                <p>Ứng viên: {onboardingModalCandidate.userFullName || onboardingModalCandidate.userEmail}</p>
              </div>
            </div>

            <div className="ftj-onboarding-modal__content">
              {isOnboardingLoading ? (
                <div className="ftj-onboarding-modal__loading">
                  <Loader2 size={24} className="ftj-spin" />
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : onboardingInfo ? (
                <div className="ftj-onboarding-grid">
                  <div className="ftj-onboarding-section">
                    <h3>Thông tin định danh</h3>
                    <div className="ftj-onboarding-item">
                      <span className="label">Họ và tên</span>
                      <span className="value">{onboardingInfo.fullName}</span>
                    </div>
                    <div className="ftj-onboarding-item">
                      <span className="label">Số CCCD/CMND</span>
                      <span className="value">{onboardingInfo.idCardNumber}</span>
                    </div>
                    {onboardingInfo.dateOfBirth && (
                      <div className="ftj-onboarding-item">
                        <span className="label">Ngày sinh</span>
                        <span className="value">{onboardingInfo.dateOfBirth}</span>
                      </div>
                    )}
                    {onboardingInfo.idCardDate && (
                      <div className="ftj-onboarding-item">
                        <span className="label">Ngày cấp</span>
                        <span className="value">{onboardingInfo.idCardDate}</span>
                      </div>
                    )}
                    <div className="ftj-onboarding-item">
                      <span className="label">Nơi cấp</span>
                      <span className="value">{onboardingInfo.idCardPlace}</span>
                    </div>
                    {onboardingInfo.address && (
                      <div className="ftj-onboarding-item">
                        <span className="label">Địa chỉ liên hệ</span>
                        <span className="value">{onboardingInfo.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="ftj-onboarding-section">
                    <h3>Thông tin tài khoản ngân hàng</h3>
                    <div className="ftj-onboarding-item">
                      <span className="label">Tên ngân hàng</span>
                      <span className="value">{onboardingInfo.bankName}</span>
                    </div>
                    <div className="ftj-onboarding-item">
                      <span className="label">Chủ tài khoản</span>
                      <span className="value">{onboardingInfo.bankAccountHolder}</span>
                    </div>
                    <div className="ftj-onboarding-item">
                      <span className="label">Số tài khoản</span>
                      <span className="value">{onboardingInfo.bankAccountNumber}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ftj-onboarding-modal__empty">
                  <AlertTriangle size={32} />
                  <h3>Chưa có thông tin pháp lý</h3>
                  <p>Ứng viên chưa cập nhật thông tin định danh và tài khoản ngân hàng. Bạn có thể gửi nhắc nhở để yêu cầu họ bổ sung.</p>
                </div>
              )}
            </div>

            <div className="ftj-onboarding-modal__actions">
              <button
                className="ftj-btn ftj-btn--ghost"
                onClick={() => setOnboardingModalCandidate(null)}
              >
                Đóng
              </button>
              <button
                className="ftj-btn ftj-btn--primary ftj-btn--cyan"
                disabled={isReminding || isOnboardingLoading}
                onClick={() => handleRemindOnboarding(onboardingModalCandidate.id)}
              >
                {isReminding ? <Loader2 size={14} className="ftj-spin" /> : <Send size={14} />}
                Nhắc nhở nộp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullTimeJobFullPage;
