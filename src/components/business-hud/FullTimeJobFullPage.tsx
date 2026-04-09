import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileSignature,
  FileText,
  Globe,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  SearchCheck,
  Send,
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
import jobService from "../../services/jobService";
import contractService from "../../services/contractService";
import { ContractListResponse, ContractStatus } from "../../types/contract";
import { useToast } from "../../hooks/useToast";
import { JobMarkdownSurface } from "../shared/JobMarkdownSurface";
import ContractForm from "../contract/ContractForm";
import {
  getApplicantDisplayName,
  getApplicantInitials,
  getApplicantSubtitle,
  getPortfolioPath,
  resolveRecruitmentAssetUrl,
} from "../../utils/recruitmentUi";
import "./FullTimeJobFullPage.css";

type FullPageTab = "overview" | "applicants" | "contracts";

interface FullTimeJobFullPageProps {
  jobId: number;
  onBack: () => void;
}

type DecisionMode = "ACCEPTED" | "REJECTED";

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
  CONTRACT_SIGNED: "#8b5cf6",
  REJECTED: "#fb7185",
};

const APP_STATUS_LABELS: Record<string, string> = {
  PENDING: "Mới nộp",
  REVIEWED: "Đã xem",
  ACCEPTED: "Đã duyệt",
  CONTRACT_SIGNED: "Đã ký hợp đồng",
  REJECTED: "Từ chối",
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
  const { showError, showSuccess, showInfo } = useToast();

  const [activeTab, setActiveTab] = useState<FullPageTab>("overview");
  const [job, setJob] = useState<JobPostingResponse | null>(null);
  const [applications, setApplications] = useState<JobApplicationResponse[]>([]);
  const [contracts, setContracts] = useState<ContractListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [decisionModal, setDecisionModal] = useState<{
    application: JobApplicationResponse;
    mode: DecisionMode;
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [contractsUnavailable, setContractsUnavailable] = useState(false);
  const [contractApplication, setContractApplication] =
    useState<JobApplicationResponse | null>(null);
  const latestLoadRequestRef = useRef(0);

  useEffect(() => {
    void loadData(jobId);
  }, [jobId]);

  useEffect(() => {
    return () => {
      latestLoadRequestRef.current += 1;
    };
  }, []);

  const loadData = async (targetJobId: number = jobId) => {
    const requestId = ++latestLoadRequestRef.current;
    setIsLoading(true);
    try {
      const [jobData, applicantPage, contractResult] = await Promise.all([
        jobService.getJobDetails(targetJobId),
        jobService.getJobApplicants(targetJobId, 0, 100),
        contractService
          .getMyContracts("EMPLOYER")
          .then((data) => ({ ok: true as const, data }))
          .catch(() => ({ ok: false as const, data: [] as ContractListResponse[] })),
      ]);

      if (requestId !== latestLoadRequestRef.current) {
        return;
      }

      setJob(jobData);
      setApplications(applicantPage.content || []);
      setContracts(contractResult.data);
      setContractsUnavailable(!contractResult.ok);
    } catch (error: unknown) {
      if (requestId !== latestLoadRequestRef.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Vui lòng thử lại sau.";
      showError("Không thể tải trung tâm job", message);
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
    });
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
      showSuccess("Đã gửi duyệt", "Tin tuyển dụng đã được gửi đến admin.");
    } catch (error: unknown) {
      showError(
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
      showSuccess("Đã đóng tin", "Tin tuyển dụng đã ngừng nhận hồ sơ.");
    } catch (error: unknown) {
      showError(
        "Không thể đóng tin",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleDeleteJob = async () => {
    try {
      setIsActionBusy(true);
      await jobService.deleteJob(jobId);
      showSuccess("Đã xóa job", "Job dài hạn đã được xóa.");
      onBack();
    } catch (error: unknown) {
      showError(
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
    if (!note) {
      showError(
        "Thiếu nội dung",
        "Hãy nhập nội dung giải thích trước khi xử lý hồ sơ.",
      );
      return;
    }

    try {
      setIsActionBusy(true);
      await jobService.updateApplicationStatus(decisionModal.application.id, {
        status: decisionModal.mode as JobApplicationStatus,
        acceptanceMessage:
          decisionModal.mode === "ACCEPTED" ? note : undefined,
        rejectionReason:
          decisionModal.mode === "REJECTED" ? note : undefined,
      });

      showSuccess(
        decisionModal.mode === "ACCEPTED"
          ? "Đã duyệt ứng viên"
          : "Đã từ chối ứng viên",
        `${getApplicantDisplayName(
          decisionModal.application.userFullName,
          decisionModal.application.userEmail,
        )} đã được cập nhật trạng thái.`,
      );

      const acceptedApplication = decisionModal.application;
      setDecisionModal(null);
      setDecisionNote("");
      await loadData();

      if (decisionModal.mode === "ACCEPTED") {
        setContractApplication({
          ...acceptedApplication,
          status: JobApplicationStatus.ACCEPTED,
        });
        setActiveTab("contracts");
      }
    } catch (error: unknown) {
      showError(
        "Không thể cập nhật hồ sơ",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleOpenPortfolio = (application: JobApplicationResponse) => {
    const portfolioPath = getPortfolioPath(application.portfolioSlug);
    if (!portfolioPath) {
      showInfo(
        "Chưa có portfolio",
        "Ứng viên này chưa công khai portfolio trên SkillVerse.",
      );
      return;
    }

    window.open(portfolioPath, "_blank", "noopener,noreferrer");
  };

  const applicationIds = new Set(applications.map((application) => application.id));
  const applicationContractIds = new Set(
    applications
      .map((application) => application.contractId)
      .filter((contractId): contractId is number => typeof contractId === "number"),
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
  const completedContractsCount = Math.min(signedContracts.length, hiringTarget);
  const isHiringCompleted = completedContractsCount >= hiringTarget;
  const completionReferenceContract = signedContracts[0] || null;

  const pendingApplications = applications.filter(
    (application) => application.status === JobApplicationStatus.PENDING,
  );
  const reviewedApplications = applications.filter(
    (application) => application.status === JobApplicationStatus.REVIEWED,
  );
  const acceptedApplications = applications.filter(
    (application) => application.status === JobApplicationStatus.ACCEPTED,
  );
  const contractReadyApplications = isHiringCompleted
    ? []
    : acceptedApplications.filter((application) => !application.contractId);

  useEffect(() => {
    if (isHiringCompleted) {
      setContractApplication(null);
      return;
    }

    if (
      contractApplication &&
      !contractReadyApplications.some(
        (application) => application.id === contractApplication.id,
      )
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
          <button className="ftj-fullpage__back" onClick={onBack} title="Quay lại">
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
            <span className="ftj-fullpage__meta-pill ftj-fullpage__meta-pill--success">
              <CheckCircle2 size={13} />
              Đã tuyển đủ {completedContractsCount}/{hiringTarget}
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
          <strong>{pendingApplications.length + reviewedApplications.length}</strong>
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
          <strong>{job.isRemote ? "Remote / hybrid" : job.location || "On-site"}</strong>
          <span>Hình thức</span>
        </div>
        {job.jobType && (
          <div className="ftj-fullpage__stat-item">
            <Briefcase size={16} />
            <strong>{job.jobType.replaceAll("_", " ")}</strong>
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
          className={`ftj-fullpage__tab ${activeTab === "contracts" ? "is-active" : ""}`}
          onClick={() => setActiveTab("contracts")}
        >
          <FileSignature size={14} />
          Hợp đồng ({allRelatedContracts.length})
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
                    <strong>{job.jobType?.replaceAll("_", " ") || "Full-time"}</strong>
                  </div>
                  <div className="ftj-fullpage__info-row">
                    <span>Số lượng tuyển</span>
                    <strong>{job.hiringQuantity ? `${job.hiringQuantity} người` : "1 người"}</strong>
                  </div>
                  <div className="ftj-fullpage__info-row">
                    <span>Giới tính</span>
                    <strong>{job.genderRequirement || "Không yêu cầu"}</strong>
                  </div>
                  <div className="ftj-fullpage__info-row">
                    <span>Địa điểm</span>
                    <strong>{job.isRemote ? "Remote / hybrid" : job.location || "On-site"}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="ftj-fullpage__signal-grid">
              <article className="ftj-fullpage__signal-card">
                <span className="ftj-fullpage__signal-label">Applicant pipeline</span>
                <strong>{applications.length} hồ sơ đã vào hệ thống</strong>
                <p>
                  {pendingApplications.length} mới nộp, {reviewedApplications.length} đã xem,
                  {acceptedApplications.length} đã duyệt.
                </p>
              </article>

              <article className="ftj-fullpage__signal-card">
                <span className="ftj-fullpage__signal-label">
                  {isHiringCompleted ? "Hiring completed" : "Contract readiness"}
                </span>
                <strong>
                  {isHiringCompleted
                    ? `Đã tuyển đủ ${completedContractsCount}/${hiringTarget} vị trí`
                    : `${contractReadyApplications.length} ứng viên sẵn sàng tạo hợp đồng`}
                </strong>
                <p>
                  {isHiringCompleted
                    ? "Job này đã đạt chỉ tiêu tuyển dụng thông qua các hợp đồng đã ký hoàn tất. Luồng tạo mới được khóa ở frontend."
                    : "Chuyển sang tab hợp đồng để khởi tạo ngay từ các hồ sơ đã được duyệt."}
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
                <h3>Review hồ sơ và chuyển sang hợp đồng</h3>
                <p>
                  Duyệt applicant ngay trên trang này, sau đó tạo hợp đồng trực tiếp
                  từ hồ sơ đã chấp nhận.
                </p>
              </div>
              <div className="ftj-applicants__summary">
                <span>{pendingApplications.length} mới nộp</span>
                <span>{acceptedApplications.length} đã duyệt</span>
                {isHiringCompleted && (
                  <span>Đã tuyển đủ {completedContractsCount}/{hiringTarget}</span>
                )}
              </div>
            </div>

            {isHiringCompleted && (
              <div className="ftj-contracts__completion-banner">
                <div>
                  <span className="ftj-applicants__eyebrow">Job completed</span>
                  <h4>Đợt tuyển đã hoàn thành</h4>
                  <p>
                    Đã có đủ hợp đồng ký hoàn tất để đạt chỉ tiêu tuyển dụng. Các thao tác duyệt thêm ứng viên hoặc tạo hợp đồng mới đã được khóa.
                  </p>
                </div>
                {completionReferenceContract && (
                  <button
                    type="button"
                    className="ftj-btn ftj-btn--primary"
                    onClick={() =>
                      navigate(`/business/contracts/${completionReferenceContract.id}`)
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
                  <p>Khi có hồ sơ ứng tuyển, toàn bộ pipeline sẽ hiển thị tại đây.</p>
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
                    <article key={application.id} className="ftj-applicant-card">
                      <div className="ftj-applicant-card__header">
                        <div className="ftj-applicant-card__identity">
                          {application.userAvatar ? (
                            <img
                              src={resolveRecruitmentAssetUrl(application.userAvatar) || ""}
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
                          {APP_STATUS_LABELS[application.status] || application.status}
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
                        {application.coverLetter || "Ứng viên chưa để lại cover letter."}
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
                          onClick={() => navigate(`/messenger?userId=${application.userId}`)}
                        >
                          <MessageSquare size={13} />
                          Liên hệ
                        </button>

                        {!isHiringCompleted &&
                          (application.status === JobApplicationStatus.PENDING ||
                            application.status === JobApplicationStatus.REVIEWED) && (
                          <>
                            <button
                              type="button"
                              className="ftj-btn ftj-btn--primary"
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
                          application.status === JobApplicationStatus.ACCEPTED &&
                          !application.contractId && (
                            <button
                              type="button"
                              className="ftj-btn ftj-btn--primary"
                              onClick={() => {
                                setContractApplication(application);
                                setActiveTab("contracts");
                              }}
                            >
                              <Plus size={13} />
                              Tạo hợp đồng
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
                  Tạo hợp đồng từ applicant đã duyệt và theo dõi trạng thái ký kết
                  ngay trong cùng luồng quản trị job full-time.
                </p>
                {contractsUnavailable && (
                  <p>
                    Dữ liệu hợp đồng hiện chưa tải được vì API `/contracts/my` đang lỗi. Bạn
                    vẫn có thể chọn ứng viên và soạn hợp đồng mới trực tiếp ở bên dưới.
                  </p>
                )}
              </div>
              <div className="ftj-contracts__hero-actions">
                <button
                  type="button"
                  className="ftj-btn ftj-btn--primary"
                  disabled={isHiringCompleted || contractReadyApplications.length === 0}
                  onClick={() =>
                    setContractApplication(contractReadyApplications[0] || null)
                  }
                >
                  <Plus size={14} />
                  {isHiringCompleted ? "Đã tuyển đủ" : "Tạo hợp đồng mới"}
                </button>
              </div>
            </div>

            {isHiringCompleted && (
              <div className="ftj-contracts__completion-banner">
                <div>
                  <span className="ftj-applicants__eyebrow">Signed milestone</span>
                  <h4>Job đã hoàn thành theo hợp đồng đã ký</h4>
                  <p>
                    Hệ thống đã ghi nhận đủ {completedContractsCount}/{hiringTarget} vị trí có hợp đồng được hai bên ký hoàn tất. Không thể tạo thêm hợp đồng mới cho job này ở frontend.
                  </p>
                </div>
                {completionReferenceContract && (
                  <button
                    type="button"
                    className="ftj-btn ftj-btn--primary"
                    onClick={() =>
                      navigate(`/business/contracts/${completionReferenceContract.id}`)
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
                          contractApplication?.id === application.id ? "is-active" : ""
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
                        onClick={() => navigate(`/business/contracts/${contract.id}`)}
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
                            {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
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
                  <span className="ftj-applicants__eyebrow">Contract composer</span>
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
                    onClick={() => setContractApplication(null)}
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
                      Ít nhất một hợp đồng đã được ký hoàn tất và job này đã đạt đủ chỉ tiêu tuyển dụng. Chỉ còn thao tác xem lại hợp đồng đã ký.
                    </p>
                  </div>
                </div>
              ) : contractApplication ? (
                <div className="ftj-contract-composer__body">
                  <div className="ftj-contract-composer__candidate">
                    <div className="ftj-contract-composer__identity">
                      <div className="ftj-contract-composer__avatar">
                        {resolveRecruitmentAssetUrl(contractApplication.userAvatar) ? (
                          <img
                            src={resolveRecruitmentAssetUrl(contractApplication.userAvatar) || ""}
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
                        {job.location || (job.isRemote ? "Remote" : "Chưa thiết lập")}
                      </span>
                    </div>
                  </div>

                  <div className="ftj-contract-composer__panel">
                    <ContractForm
                      applicationId={contractApplication.id}
                      initialApplication={contractApplication}
                      availableApplications={contractReadyApplications}
                      defaultWorkingLocation={job.location || (job.isRemote ? "Remote" : "")}
                      onSuccess={(contract) => {
                        showSuccess(
                          "Đã tạo hợp đồng",
                          `Hợp đồng #${contract.contractNumber} đã được tạo và gửi ký.`,
                        );
                        setContractApplication(null);
                        void loadData();
                      }}
                      onCancel={() => setContractApplication(null)}
                    />
                  </div>
                </div>
              ) : (
                <div className="ftj-contract-composer__empty">
                  <FileSignature size={26} />
                  <div>
                    <strong>Chưa chọn ứng viên để soạn hợp đồng</strong>
                    <p>
                      Chọn một ứng viên đã duyệt ở cột bên trên hoặc bấm "Tạo hợp đồng mới"
                      để đổ form trực tiếp vào command center.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {decisionModal && (
        <div
          className="ftj-modal-backdrop"
          onClick={() => !isActionBusy && setDecisionModal(null)}
        >
          <div className="ftj-modal" onClick={(event) => event.stopPropagation()}>
            <span className="ftj-modal__eyebrow">
              {decisionModal.mode === "ACCEPTED" ? "Duyệt hồ sơ" : "Từ chối hồ sơ"}
            </span>
            <h3>
              {getApplicantDisplayName(
                decisionModal.application.userFullName,
                decisionModal.application.userEmail,
              )}
            </h3>
            <p>
              {decisionModal.mode === "ACCEPTED"
                ? "Nhập lời nhắn gửi tới ứng viên khi được chấp nhận vào vòng hợp đồng."
                : "Nhập lý do từ chối để hệ thống gửi phản hồi rõ ràng cho ứng viên."}
            </p>
            <textarea
              className="ftj-modal__textarea"
              rows={5}
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder={
                decisionModal.mode === "ACCEPTED"
                  ? "Ví dụ: Hồ sơ phù hợp với vị trí, mời bạn tiếp tục bước ký hợp đồng."
                  : "Ví dụ: Kinh nghiệm hiện tại chưa phù hợp với phạm vi công việc này."
              }
            />
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
                  decisionModal.mode === "ACCEPTED"
                    ? "ftj-btn ftj-btn--primary"
                    : "ftj-btn ftj-btn--danger"
                }
                onClick={handleApplicantDecision}
                disabled={isActionBusy}
              >
                {isActionBusy ? (
                  <Loader2 size={14} className="ftj-spin" />
                ) : decisionModal.mode === "ACCEPTED" ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <XCircle size={14} />
                )}
                {decisionModal.mode === "ACCEPTED" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
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
          <div className="ftj-modal" onClick={(event) => event.stopPropagation()}>
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
    </div>
  );
};

export default FullTimeJobFullPage;
