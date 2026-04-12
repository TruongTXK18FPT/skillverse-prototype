import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  JobApplicationResponse,
  JobApplicationStatus,
} from "../../data/jobDTOs";
import { useToast } from "../../hooks/useToast";
import jobService from "../../services/jobService";
import {
  getApplicantDisplayName,
  getApplicantInitials,
  getApplicantSubtitle,
  getPortfolioPath,
  resolveRecruitmentAssetUrl,
} from "../../utils/recruitmentUi";
import InterviewScheduleModal from "./InterviewScheduleModal";
import "./ApplicantsModal-fleet.css";

interface ApplicantsModalProps {
  jobId: number;
  jobTitle: string;
  isRemote?: boolean; // Whether this job is remote — affects routing after ACCEPTED
  onClose: () => void;
  onChanged?: () => void;
  refreshTrigger?: number;
}

type DecisionStatus = "ACCEPTED" | "REJECTED";

const getStatusBadgeClass = (status: JobApplicationStatus): string => {
  const statusClasses: Record<string, string> = {
    PENDING: "am-status-pending",
    REVIEWED: "am-status-reviewed",
    ACCEPTED: "am-status-accepted",
    REJECTED: "am-status-rejected",
    INTERVIEW_SCHEDULED: "am-status-interview-scheduled",
    INTERVIEWED: "am-status-interviewed",
    OFFER_SENT: "am-status-offer-sent",
    OFFER_ACCEPTED: "am-status-offer-accepted",
    OFFER_REJECTED: "am-status-offer-rejected",
    CONTRACT_SIGNED: "am-status-contract-signed",
  };

  return statusClasses[status] || "am-status-pending";
};

const getStatusText = (status: JobApplicationStatus): string => {
  const statusTexts: Record<string, string> = {
    PENDING: "Mới nộp",
    REVIEWED: "Đã xem",
    ACCEPTED: "Đã duyệt",
    INTERVIEW_SCHEDULED: "Lịch phỏng vấn",
    INTERVIEWED: "Đã phỏng vấn",
    OFFER_SENT: "Đã gửi đề nghị",
    OFFER_ACCEPTED: "Nhận đề nghị",
    OFFER_REJECTED: "Từ chối đề nghị",
    REJECTED: "Đã từ chối",
    CONTRACT_SIGNED: "Đã ký hợp đồng",
  };

  return statusTexts[status] || status;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const ApplicantsModal: React.FC<ApplicantsModalProps> = ({
  jobId,
  jobTitle,
  isRemote = false,
  onClose,
  onChanged,
  refreshTrigger,
}) => {
  const navigate = useNavigate();
  const { showError, showSuccess, showInfo } = useToast();
  const [applications, setApplications] = useState<JobApplicationResponse[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [decisionModal, setDecisionModal] = useState<{
    application: JobApplicationResponse;
    status: DecisionStatus;
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [createContractModal, setCreateContractModal] = useState<JobApplicationResponse | null>(null);
  const [interviewModalApp, setInterviewModalApp] = useState<JobApplicationResponse | null>(null);

  useEffect(() => {
    fetchApplicants(page);
  }, [jobId, refreshTrigger, page]);

  const fetchApplicants = async (pageNumber: number) => {
    setIsLoading(true);
    try {
      const result = await jobService.getJobApplicants(jobId, pageNumber, 6);
      setApplications(result.content || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      showError(
        "Lỗi tải dữ liệu",
        "Không thể tải danh sách ứng viên cho công việc này.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const markBusy = (applicationId: number) => {
    setProcessingIds((previous) => new Set(previous).add(applicationId));
  };

  const clearBusy = (applicationId: number) => {
    setProcessingIds((previous) => {
      const next = new Set(previous);
      next.delete(applicationId);
      return next;
    });
  };

  const handleMarkReviewed = async (applicationId: number) => {
    if (processingIds.has(applicationId)) {
      return;
    }

    markBusy(applicationId);
    try {
      await jobService.updateApplicationStatus(applicationId, {
        status: "REVIEWED" as JobApplicationStatus,
      });
      setApplications((previous) =>
        previous.map((application) =>
          application.id === applicationId
            ? { ...application, status: "REVIEWED" as JobApplicationStatus }
            : application,
        ),
      );
      onChanged?.();
    } catch (error) {
      console.error("Error marking reviewed:", error);
      showError(
        "Lỗi cập nhật",
        error instanceof Error
          ? error.message
          : "Không thể đánh dấu hồ sơ đã xem.",
      );
    } finally {
      clearBusy(applicationId);
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

  const handleOpenChat = async (application: JobApplicationResponse) => {
    try {
      // Get or create a recruitment session for this applicant, then navigate to messenger
      const { default: recruitmentChatService } = await import("../../services/recruitmentChatService");
      const session = await recruitmentChatService.getOrCreateSession(
        application.userId,
        jobId,
        "MANUAL",
      );
      navigate(`/messenger?sessionId=${session.id}`);
      onClose();
    } catch (error) {
      console.error("Error opening recruiter chat:", error);
      showError(
        "Không thể mở chat",
        error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      );
    }
  };

  const handleDecisionSubmit = async () => {
    if (!decisionModal) {
      return;
    }

    const note = decisionNote.trim();
    if (!note) {
      showError(
        "Thiếu nội dung",
        "Vui lòng nhập nội dung đầy đủ cho quyết định này.",
      );
      return;
    }

    const applicationId = decisionModal.application.id;
    markBusy(applicationId);
    try {
      await jobService.updateApplicationStatus(applicationId, {
        status: decisionModal.status as JobApplicationStatus,
        acceptanceMessage:
          decisionModal.status === "ACCEPTED" ? note : undefined,
        rejectionReason: decisionModal.status === "REJECTED" ? note : undefined,
      });

      showSuccess(
        decisionModal.status === "ACCEPTED"
          ? "Đã duyệt ứng viên"
          : "Đã từ chối ứng viên",
        `${getApplicantDisplayName(
          decisionModal.application.userFullName,
          decisionModal.application.userEmail,
        )} đã được cập nhật trạng thái.`,
      );

      const acceptedApp = decisionModal.status === "ACCEPTED"
        ? { ...decisionModal.application, status: "ACCEPTED" as JobApplicationStatus }
        : null;

      setDecisionModal(null);
      setDecisionNote("");
      await fetchApplicants(page);
      onChanged?.();

      if (acceptedApp) {
        // For REMOTE jobs: show interview scheduling modal
        // For ONSITE jobs: show contract creation modal
        setTimeout(() => {
          if (isRemote) {
            setInterviewModalApp(acceptedApp);
          } else {
            setCreateContractModal(acceptedApp);
          }
        }, 300);
      }
    } catch (error) {
      console.error("Error updating applicant decision:", error);
      showError(
        "Không thể cập nhật hồ sơ",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      clearBusy(applicationId);
    }
  };

  return (
    <>
      <div className="am-fleet-overlay" onClick={onClose}>
        <div
          className="am-fleet-content"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="am-fleet-header">
            <div className="am-fleet-title-row">
              <div className="am-fleet-title">
                <h3>
                  <span className="am-title-icon">
                    <Sparkles size={16} />
                  </span>
                  Pipeline Ứng Viên
                </h3>
                <p className="am-fleet-subtitle">{jobTitle}</p>
              </div>
              <button
                className="am-fleet-close"
                onClick={onClose}
                title="Đóng"
                type="button"
              >
                ×
              </button>
            </div>

            {/* Stats Row */}
            <div className="am-fleet-stats">
              <div className="am-fleet-stat">
                <span
                  className="am-fleet-stat-dot"
                  style={{
                    background: "#00f5ff",
                    boxShadow: "0 0 6px #00f5ff",
                  }}
                />
                <span>Tổng:</span>
                <span className="am-fleet-stat-value">{totalElements}</span>
              </div>
              <div className="am-fleet-stat">
                <span
                  className="am-fleet-stat-dot"
                  style={{ background: "#fbbf24" }}
                />
                <span>Chờ duyệt:</span>
                <span className="am-fleet-stat-value">
                  {applications.filter((a) => a.status === "PENDING").length}
                </span>
              </div>
              <div className="am-fleet-stat">
                <span
                  className="am-fleet-stat-dot"
                  style={{ background: "#34d399" }}
                />
                <span>Đã duyệt:</span>
                <span className="am-fleet-stat-value">
                  {applications.filter((a) => a.status === "ACCEPTED").length}
                </span>
              </div>
              <div className="am-fleet-stat">
                <span
                  className="am-fleet-stat-dot"
                  style={{ background: "#f87171" }}
                />
                <span>Từ chối:</span>
                <span className="am-fleet-stat-value">
                  {applications.filter((a) => a.status === "REJECTED").length}
                </span>
              </div>
            </div>
          </div>

          <div className="am-fleet-body">
            {isLoading ? (
              <div className="am-loading-state">
                <Loader2 size={24} className="am-spin" />
                <p>Đang tải danh sách ứng viên...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="am-fleet-empty">
                <div className="am-fleet-empty-icon">📭</div>
                <h4>Chưa có ứng viên</h4>
                <p>
                  Danh sách nộp đơn sẽ xuất hiện ở đây ngay khi công việc nhận
                  được hồ sơ mới.
                </p>
              </div>
            ) : (
              <div className="am-fleet-list">
                {applications.map((application) => {
                  const displayName = getApplicantDisplayName(
                    application.userFullName,
                    application.userEmail,
                  );
                  const avatarUrl = resolveRecruitmentAssetUrl(
                    application.userAvatar,
                  );
                  const portfolioPath = getPortfolioPath(
                    application.portfolioSlug,
                  );
                  const isBusy = processingIds.has(application.id);

                  return (
                    <article
                      key={application.id}
                      className={`am-fleet-card ${application.isHighlighted ? "am-fleet-card--highlighted" : ""}`}
                    >
                      <div className="am-fleet-card__header">
                        <div className="am-fleet-card__identity">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="am-fleet-card__avatar"
                            />
                          ) : (
                            <div className="am-fleet-card__avatar am-fleet-card__avatar--fallback">
                              {getApplicantInitials(
                                application.userFullName,
                                application.userEmail,
                              )}
                            </div>
                          )}

                          <div>
                            <h4>{displayName}</h4>
                            <p>
                              {getApplicantSubtitle(
                                application.userProfessionalTitle,
                                Boolean(portfolioPath),
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="am-fleet-card__summary">
                          <span
                            className={`am-fleet-badge ${getStatusBadgeClass(application.status)}`}
                          >
                            {getStatusText(application.status)}
                          </span>
                          <span className="am-fleet-card__date">
                            <Clock3 size={13} />
                            {formatDate(application.appliedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="am-fleet-card-body">
                        {application.coverLetter ? (
                          <div className="am-fleet-card__letter">
                            <div className="am-fleet-card__letter-head">
                              <strong>Cover letter</strong>
                              <button
                                className="am-fleet-cover-btn"
                                onClick={() =>
                                  setExpandedId((current) =>
                                    current === application.id
                                      ? null
                                      : application.id,
                                  )
                                }
                                type="button"
                              >
                                {expandedId === application.id
                                  ? "Thu gọn"
                                  : "Xem đầy đủ"}
                              </button>
                            </div>
                            <p>
                              {expandedId === application.id ||
                              application.coverLetter.length <= 220
                                ? application.coverLetter
                                : `${application.coverLetter.slice(0, 220)}...`}
                            </p>
                          </div>
                        ) : (
                          <div className="am-fleet-card__letter am-fleet-card__letter--empty">
                            Ứng viên chưa để lại cover letter.
                          </div>
                        )}

                        {(application.acceptanceMessage ||
                          application.rejectionReason) && (
                          <div className="am-fleet-card__note">
                            <strong>
                              {application.status === "ACCEPTED"
                                ? "Ghi chú duyệt"
                                : "Lý do từ chối"}
                            </strong>
                            <p>
                              {application.acceptanceMessage ||
                                application.rejectionReason}
                            </p>
                          </div>
                        )}

                        <div className="am-fleet-card__meta">
                          <span>
                            <ShieldCheck size={13} />
                            {portfolioPath
                              ? "Portfolio công khai sẵn sàng review"
                              : "Chưa có portfolio công khai"}
                          </span>
                          {application.isHighlighted && (
                            <span>
                              <Sparkles size={13} />
                              Hồ sơ nổi bật
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="am-fleet-actions">
                        <button
                          className="am-btn-icon am-btn-view"
                          title="Xem portfolio"
                          onClick={() => handleOpenPortfolio(application)}
                          type="button"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="am-btn-icon am-btn-chat"
                          title="Chat theo job"
                          onClick={() => handleOpenChat(application)}
                          type="button"
                        >
                          <MessageSquare size={14} />
                        </button>

                        <span className="am-btn-sep" />

                        {application.status === "PENDING" && (
                          <button
                            className="am-btn-icon am-btn-review"
                            title="Đánh dấu đã xem"
                            onClick={() => handleMarkReviewed(application.id)}
                            disabled={isBusy}
                            type="button"
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="am-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                          </button>
                        )}
                        {(application.status === "PENDING" ||
                          application.status === "REVIEWED") && (
                          <>
                            <button
                              className="am-btn-icon am-btn-accept"
                              title="Duyệt ứng viên"
                              onClick={() => {
                                setDecisionModal({
                                  application,
                                  status: "ACCEPTED",
                                });
                                setDecisionNote("");
                              }}
                              type="button"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              className="am-btn-icon am-btn-reject"
                              title="Từ chối ứng viên"
                              onClick={() => {
                                setDecisionModal({
                                  application,
                                  status: "REJECTED",
                                });
                                setDecisionNote("");
                              }}
                              type="button"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="am-fleet-pagination">
                <button
                  className="am-fleet-pagination-btn"
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                  type="button"
                >
                  Trước
                </button>
                <span>
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  className="am-fleet-pagination-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((current) => current + 1)}
                  type="button"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {decisionModal && (
        <div
          className="am-decision-overlay"
          onClick={() => setDecisionModal(null)}
        >
          <div
            className="am-decision-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>
              {decisionModal.status === "ACCEPTED"
                ? "Duyệt ứng viên với thông điệp rõ ràng"
                : "Từ chối ứng viên với lý do cụ thể"}
            </h3>
            <p>
              {decisionModal.status === "ACCEPTED"
                ? `Thông điệp này sẽ được gửi cho ${getApplicantDisplayName(
                    decisionModal.application.userFullName,
                    decisionModal.application.userEmail,
                  )}.`
                : `Hãy nêu lý do đủ rõ để ${getApplicantDisplayName(
                    decisionModal.application.userFullName,
                    decisionModal.application.userEmail,
                  )} hiểu quyết định của bạn.`}
            </p>

            <textarea
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder={
                decisionModal.status === "ACCEPTED"
                  ? "Ví dụ: Hồ sơ của bạn phù hợp với nhu cầu hiện tại. Chúng tôi muốn mời bạn vào vòng tiếp theo..."
                  : "Ví dụ: Kinh nghiệm hiện tại chưa khớp với stack và phạm vi triển khai của vị trí này..."
              }
              rows={6}
              maxLength={1200}
            />

            <div className="am-decision-meta">
              {decisionNote.length}/1200 ký tự
            </div>

            <div className="am-decision-actions">
              <button
                type="button"
                className="am-btn-action"
                onClick={() => setDecisionModal(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`am-btn-action ${decisionModal.status === "ACCEPTED" ? "am-btn-accept" : "am-btn-reject"}`}
                onClick={handleDecisionSubmit}
                disabled={processingIds.has(decisionModal.application.id)}
              >
                {processingIds.has(decisionModal.application.id) ? (
                  <Loader2 size={15} className="am-spin" />
                ) : decisionModal.status === "ACCEPTED" ? (
                  <Send size={15} />
                ) : (
                  <XCircle size={15} />
                )}
                {decisionModal.status === "ACCEPTED"
                  ? "Xác nhận duyệt"
                  : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {createContractModal && (
        <div
          className="am-decision-overlay"
          onClick={() => setCreateContractModal(null)}
        >
          <div
            className="am-decision-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Tiếp theo</h3>
            <p>
              Bạn đã duyệt ứng viên <strong>{getApplicantDisplayName(createContractModal.userFullName, createContractModal.userEmail)}</strong>.
              {isRemote ? (
                " Với công việc Remote, bước tiếp theo là xếp lịch phỏng vấn trực tuyến."
              ) : (
                " Với công việc Onsite, bạn có thể đóng job sau khi đã duyệt ứng viên."
              )}
            </p>
            <div className="am-decision-actions">
              <button
                type="button"
                className="am-btn-action"
                onClick={() => setCreateContractModal(null)}
              >
                {isRemote ? "Để sau" : "Hoàn thành"}
              </button>
              {isRemote && (
                <button
                  type="button"
                  className="am-btn-action am-btn-accept"
                  onClick={() => {
                    const app = createContractModal;
                    setCreateContractModal(null);
                    setInterviewModalApp(app);
                  }}
                >
                  <Calendar size={14} />
                  Xếp lịch phỏng vấn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {interviewModalApp && (
        <InterviewScheduleModal
          application={interviewModalApp}
          onClose={() => {
            setInterviewModalApp(null);
            fetchApplicants(page);
          }}
          onScheduled={() => {
            setInterviewModalApp(null);
            fetchApplicants(page);
            onChanged?.();
          }}
        />
      )}

    </>
  );
};

export default ApplicantsModal;
