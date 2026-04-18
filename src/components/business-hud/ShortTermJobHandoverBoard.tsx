import { useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  X,
  ZoomIn,
} from "lucide-react";
import {
  ShortTermApplicationResponse,
  ShortTermJobResponse,
  ShortTermApplicationStatus,
  ShortTermJobStatus,
  DeliverableType,
  Deliverable,
} from "../../types/ShortTermJob";
import shortTermJobService from "../../services/shortTermJobService";
import { useToast } from "../../hooks/useToast";
import { resolveRecruitmentAssetUrl } from "../../utils/recruitmentUi";
import TrustScoreDisplay from "../short-term-job/TrustScoreDisplay";
import DisputePanel from "../short-term-job/DisputePanel";
import { useAuth } from "../../context/AuthContext";
import "./short-term-fleet.css";

interface ShortTermJobHandoverBoardProps {
  job: ShortTermJobResponse;
  applications: ShortTermApplicationResponse[];
  onRefresh: () => void;
  onJobUpdate?: (updatedJob: ShortTermJobResponse) => void;
  selectedApplicantRevisionCount?: number;
}

type HandoverFilter =
  | "all"
  | "submitted"
  | "revision"
  | "approved"
  | "completed";
type RevisionNoteItem = NonNullable<
  ShortTermApplicationResponse["revisionNotes"]
>[number];
type DeliverableBucket = "image" | "video" | "link" | "file";

interface SubmissionRoundGroup {
  round: number;
  deliverables: Deliverable[];
  submittedAt?: string;
  recruiterNote?: string;
  recruiterRequestedAt?: string;
  isCurrent: boolean;
}

const ShortTermJobHandoverBoard = ({
  job,
  applications,
  onRefresh,
  selectedApplicantRevisionCount = 0,
  onJobUpdate,
}: ShortTermJobHandoverBoardProps) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedRoundByApp, setSelectedRoundByApp] = useState<
    Record<number, number>
  >({});
  const [filter, setFilter] = useState<HandoverFilter>("all");
  const [revisionModal, setRevisionModal] =
    useState<ShortTermApplicationResponse | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [lightboxImage, setLightboxImage] = useState<Deliverable | null>(null);
  const [cancelReviewModal, setCancelReviewModal] =
    useState<ShortTermApplicationResponse | null>(null);
  const [cancelReviewReason, setCancelReviewReason] = useState("");

  const handoverApps = applications.filter(
    (app) =>
      app.status === ShortTermApplicationStatus.SUBMITTED ||
      app.status === ShortTermApplicationStatus.REVISION_REQUIRED ||
      app.status === ShortTermApplicationStatus.APPROVED ||
      app.status === ShortTermApplicationStatus.COMPLETED ||
      app.status === ShortTermApplicationStatus.PAID,
  );

  const filteredApps = handoverApps.filter((app) => {
    if (filter === "submitted")
      return app.status === ShortTermApplicationStatus.SUBMITTED;
    if (filter === "revision")
      return app.status === ShortTermApplicationStatus.REVISION_REQUIRED;
    if (filter === "approved")
      return app.status === ShortTermApplicationStatus.APPROVED;
    if (filter === "completed") {
      return (
        app.status === ShortTermApplicationStatus.COMPLETED ||
        app.status === ShortTermApplicationStatus.PAID
      );
    }
    return true;
  });

  const countSubmitted = handoverApps.filter(
    (application) =>
      application.status === ShortTermApplicationStatus.SUBMITTED,
  ).length;
  const countRevision = handoverApps.filter(
    (application) =>
      application.status === ShortTermApplicationStatus.REVISION_REQUIRED,
  ).length;
  const countApproved = handoverApps.filter(
    (application) => application.status === ShortTermApplicationStatus.APPROVED,
  ).length;
  const countCompleted = handoverApps.filter(
    (application) =>
      application.status === ShortTermApplicationStatus.COMPLETED ||
      application.status === ShortTermApplicationStatus.PAID,
  ).length;

  const statCards = [
    {
      key: "submitted",
      label: "Đã nộp",
      meta: "Chờ recruiter review",
      value: countSubmitted,
    },
    {
      key: "revision",
      label: "Cần sửa",
      meta: "Chờ ứng viên cập nhật",
      value: countRevision,
    },
    {
      key: "approved",
      label: "Đã duyệt",
      meta: "Sẵn sàng chốt job",
      value: countApproved,
    },
    {
      key: "completed",
      label: "Hoàn tất",
      meta: "Đã nghiệm thu / thanh toán",
      value: countCompleted,
    },
  ] as const;

  const handleApproveWork = async (
    application: ShortTermApplicationResponse,
  ) => {
    try {
      setActionLoading(application.id);
      // Nếu chưa có selectedApplicantId, gọi selectCandidate trước
      if (!job.selectedApplicantId) {
        await shortTermJobService.selectCandidate(job.id, application.id);
      }
      await shortTermJobService.approveWork(
        application.id,
        "Bàn giao đạt yêu cầu.",
      );
      // Refresh job + applicants để UI cập nhật đúng trạng thái
      const refreshedJob = await shortTermJobService.getJobDetails(job.id);
      onJobUpdate?.(refreshedJob);
      showSuccess("Đã duyệt bàn giao", "Công việc đã được chấp thuận.");
      onRefresh();
    } catch (error: any) {
      showError("Không thể duyệt", error.message || "Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionModal || !revisionNote.trim()) {
      showError("Thiếu nội dung", "Vui lòng nhập ghi chú yêu cầu sửa lại.");
      return;
    }
    try {
      setActionLoading(revisionModal.id);
      await shortTermJobService.requestRevision({
        applicationId: revisionModal.id,
        note: revisionNote.trim(),
      });
      setRevisionModal(null);
      setRevisionNote("");
      showSuccess("Đã yêu cầu sửa lại", "Ứng viên sẽ được thông báo.");
      onRefresh();
    } catch (error: any) {
      showError("Không thể yêu cầu sửa", error.message || "Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmCancellationReview = async () => {
    if (!cancelReviewModal || !cancelReviewReason.trim()) return;
    try {
      setActionLoading(cancelReviewModal.id);
      await shortTermJobService.requestCancellationReview(
        cancelReviewModal.id,
        cancelReviewReason.trim(),
      );
      showSuccess(
        "Đã gửi yêu cầu hủy",
        "Admin sẽ xem xét trong 5 ngày làm việc.",
      );
      setCancelReviewModal(null);
      setCancelReviewReason("");
      onRefresh();
    } catch (error: any) {
      showError(
        "Không thể gửi yêu cầu hủy",
        error.message || "Vui lòng thử lai.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteJob = async (
    application: ShortTermApplicationResponse,
  ) => {
    try {
      setActionLoading(application.id);
      // Re-fetch latest job + applicants to get current state
      const freshApps = await shortTermJobService.getJobApplicants(
        job.id,
        0,
        50,
      );
      const currentApp = freshApps.content?.find(
        (a) => a.id === application.id,
      );
      if (currentApp?.status !== ShortTermApplicationStatus.APPROVED) {
        showError(
          "Chưa duyệt bàn giao",
          "Vui lòng duyệt bàn giao trước khi hoàn tất.",
        );
        setActionLoading(null);
        return;
      }
      await shortTermJobService.completeJob(job.id);
      showSuccess("Đã hoàn tất job", "Công việc đã được đánh dấu hoàn thành.");
      onRefresh();
    } catch (error: any) {
      showError("Không thể hoàn tất", error.message || "Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsPaid = async (
    application: ShortTermApplicationResponse,
  ) => {
    try {
      setActionLoading(application.id);
      await shortTermJobService.markAsPaid(job.id);
      showSuccess(
        "Đã xác nhận thanh toán",
        "Job đã được đánh dấu đã thanh toán.",
      );
      onRefresh();
    } catch (error: any) {
      showError(
        "Không thể xác nhận thanh toán",
        error.message || "Vui lòng thử lại.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status: ShortTermApplicationStatus): string => {
    switch (status) {
      case ShortTermApplicationStatus.SUBMITTED:
        return "stj-handover-badge--submitted";
      case ShortTermApplicationStatus.REVISION_REQUIRED:
        return "stj-handover-badge--revision";
      case ShortTermApplicationStatus.APPROVED:
        return "stj-handover-badge--approved";
      case ShortTermApplicationStatus.COMPLETED:
        return "stj-handover-badge--completed";
      case ShortTermApplicationStatus.PAID:
        return "stj-handover-badge--paid";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: ShortTermApplicationStatus): string => {
    switch (status) {
      case ShortTermApplicationStatus.SUBMITTED:
        return "Đã nộp";
      case ShortTermApplicationStatus.REVISION_REQUIRED:
        return "Cần sửa lại";
      case ShortTermApplicationStatus.APPROVED:
        return "Đã duyệt";
      case ShortTermApplicationStatus.COMPLETED:
        return "Hoàn thành";
      case ShortTermApplicationStatus.PAID:
        return "Đã thanh toán";
      default:
        return status;
    }
  };

  const formatDate = (date?: string): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (date?: string): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // [Nghiệp vụ] Job ngắn hạn chỉ có 1 ứng viên được chọn, nên số lần nộp được suy ra từ submissionCount và số lần yêu cầu sửa.
  const getSubmissionRound = (
    application: ShortTermApplicationResponse,
  ): number => {
    const submissionCount = application.submissionCount || 0;
    const fallbackFromRevision = (application.revisionCount || 0) + 1;
    return Math.max(
      submissionCount,
      fallbackFromRevision,
      application.submittedAt ? 1 : 0,
      1,
    );
  };

  // [Nghiệp vụ] Sắp xếp revision theo thời gian để hiển thị timeline bàn giao rõ ràng, dễ theo dõi từng vòng chỉnh sửa.
  const getSortedRevisionNotes = (
    application: ShortTermApplicationResponse,
  ): RevisionNoteItem[] => {
    return [...(application.revisionNotes || [])].sort(
      (a, b) =>
        new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime(),
    );
  };

  const getTimestamp = (date?: string): number | null => {
    if (!date) return null;
    const timestamp = new Date(date).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  };

  const getDeliverableBucket = (
    deliverable: Deliverable,
  ): DeliverableBucket => {
    if (
      deliverable.type === DeliverableType.IMAGE ||
      /^\s*image\//i.test(deliverable.mimeType || "")
    ) {
      return "image";
    }
    if (
      deliverable.type === DeliverableType.VIDEO ||
      /^\s*video\//i.test(deliverable.mimeType || "")
    ) {
      return "video";
    }
    if (deliverable.type === DeliverableType.LINK) {
      return "link";
    }
    return "file";
  };

  // [Nghiệp vụ] Gom file theo từng lần nộp dựa vào uploadedAt và các mốc recruiter yêu cầu sửa.
  const getSubmissionRoundGroups = (
    application: ShortTermApplicationResponse,
    revisionHistory: RevisionNoteItem[],
  ): SubmissionRoundGroup[] => {
    const totalRounds = getSubmissionRound(application);
    const revisionCheckpoints = revisionHistory
      .map((note, index) => ({
        requestedAt: getTimestamp(note.requestedAt),
        roundAfter: index + 2,
      }))
      .filter(
        (
          checkpoint,
        ): checkpoint is { requestedAt: number; roundAfter: number } =>
          checkpoint.requestedAt !== null,
      );

    const groups: SubmissionRoundGroup[] = Array.from(
      { length: totalRounds },
      (_, index) => {
        const round = index + 1;
        const reviewForRound = revisionHistory[round - 1];

        return {
          round,
          deliverables: [],
          submittedAt:
            round === totalRounds
              ? application.submittedAt || application.appliedAt
              : undefined,
          recruiterNote: reviewForRound?.note,
          recruiterRequestedAt: reviewForRound?.requestedAt,
          isCurrent: round === totalRounds,
        };
      },
    );

    (application.deliverables || []).forEach((deliverable) => {
      const uploadedAt = getTimestamp(deliverable.uploadedAt);

      if (uploadedAt === null) {
        groups[totalRounds - 1].deliverables.push(deliverable);
        return;
      }

      let round = 1;
      revisionCheckpoints.forEach((checkpoint) => {
        if (uploadedAt > checkpoint.requestedAt) {
          round = checkpoint.roundAfter;
        }
      });

      const boundedRound = Math.min(Math.max(round, 1), totalRounds);
      groups[boundedRound - 1].deliverables.push(deliverable);
    });

    groups.forEach((group) => {
      group.deliverables.sort((a, b) => {
        const dateB = getTimestamp(b.uploadedAt) || 0;
        const dateA = getTimestamp(a.uploadedAt) || 0;
        return dateB - dateA;
      });

      if (!group.submittedAt && group.deliverables.length > 0) {
        group.submittedAt = group.deliverables[0].uploadedAt;
      }
    });

    return groups.slice().reverse();
  };

  const getRoundContent = (
    application: ShortTermApplicationResponse,
    roundGroup: SubmissionRoundGroup,
  ): string => {
    const roundDescriptions = roundGroup.deliverables
      .map((deliverable) => deliverable.description?.trim())
      .filter((description): description is string => Boolean(description));

    const uniqueDescriptions = Array.from(new Set(roundDescriptions));
    if (uniqueDescriptions.length > 0) {
      return uniqueDescriptions.join(" | ");
    }

    if (roundGroup.isCurrent && application.workNote?.trim()) {
      return application.workNote.trim();
    }

    return "Không có mô tả nội dung bàn giao ở lần gửi này.";
  };

  // [Nghiệp vụ] Cho phép recruiter chọn từng round bàn giao để tập trung review đúng version, tránh lẫn file giữa các lần nộp.
  const getActiveRoundGroup = (
    applicationId: number,
    roundGroups: SubmissionRoundGroup[],
  ): SubmissionRoundGroup | null => {
    if (roundGroups.length === 0) return null;
    const selectedRound = selectedRoundByApp[applicationId];
    const matchedRound = roundGroups.find(
      (group) => group.round === selectedRound,
    );
    return matchedRound || roundGroups[0];
  };

  const renderDeliverableItem = (deliverable: Deliverable, key: string) => {
    const resolvedUrl = resolveRecruitmentAssetUrl(deliverable.fileUrl);
    const bucket = getDeliverableBucket(deliverable);
    const fileSize =
      deliverable.fileSize > 0
        ? `${(deliverable.fileSize / 1024).toFixed(1)} KB`
        : "";

    if (bucket === "image") {
      return (
        <li key={key}>
          <div className="stj-handover-card__image-item">
            <img
              src={resolvedUrl}
              alt={deliverable.fileName || "Hình ảnh bàn giao"}
              className="stj-handover-card__image-thumb"
              onClick={() =>
                setLightboxImage({
                  ...deliverable,
                  fileUrl: resolvedUrl || deliverable.fileUrl,
                })
              }
              onError={(event) => {
                (event.target as HTMLImageElement).style.display = "none";
                (
                  event.target as HTMLImageElement
                ).nextElementSibling?.classList.remove(
                  "stj-handover-card__image-fallback--hidden",
                );
              }}
            />
            <div className="stj-handover-card__image-fallback stj-handover-card__image-fallback--hidden">
              <ImageIcon size={20} />
              <span>{deliverable.fileName}</span>
            </div>
            <div className="stj-handover-card__image-overlay">
              <button
                className="stj-handover-card__image-btn"
                onClick={() =>
                  setLightboxImage({
                    ...deliverable,
                    fileUrl: resolvedUrl || deliverable.fileUrl,
                  })
                }
                title="Xem ảnh"
              >
                <ZoomIn size={14} />
              </button>
              <a
                href={resolvedUrl}
                download={deliverable.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="stj-handover-card__image-btn"
                title="Tải về"
                onClick={(event) => event.stopPropagation()}
              >
                <Download size={14} />
              </a>
            </div>
            {fileSize && (
              <span className="stj-handover-card__image-size">{fileSize}</span>
            )}
          </div>
        </li>
      );
    }

    if (bucket === "video") {
      return (
        <li key={key}>
          <div className="stj-handover-card__file-item stj-handover-card__file-item--video">
            <video
              src={resolvedUrl}
              className="stj-handover-card__video-thumb"
              onClick={() => window.open(resolvedUrl, "_blank")}
            />
            <div className="stj-handover-card__file-info">
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="stj-handover-card__file-link"
                title={deliverable.fileName || resolvedUrl || "Video bàn giao"}
              >
                <ExternalLink size={11} />
                <span className="stj-handover-card__file-link-text">
                  {deliverable.fileName || "Video bàn giao"}
                </span>
              </a>
              {fileSize && (
                <span className="stj-handover-card__file-size">{fileSize}</span>
              )}
            </div>
            <a
              href={resolvedUrl}
              download={deliverable.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="stj-handover-card__file-download"
              title="Tải về"
            >
              <Download size={12} />
            </a>
          </div>
        </li>
      );
    }

    return (
      <li key={key}>
        <div className="stj-handover-card__file-item">
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="stj-handover-card__file-link"
            title={deliverable.fileName || resolvedUrl || "File bàn giao"}
          >
            <ExternalLink size={11} />
            <span className="stj-handover-card__file-link-text">
              {deliverable.fileName || "File bàn giao"}
            </span>
          </a>
          {fileSize && (
            <span className="stj-handover-card__file-size">{fileSize}</span>
          )}
          {bucket !== "link" && (
            <a
              href={resolvedUrl}
              download={deliverable.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="stj-handover-card__file-download"
              title="Tải về"
            >
              <Download size={12} />
            </a>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="stj-handover-board">
      <div className="stj-handover-stats">
        {statCards.map((stat) => (
          <div
            key={stat.key}
            className={`stj-handover-stat stj-handover-stat--${stat.key}`}
          >
            <div className="stj-handover-stat__body">
              <span className="stj-handover-stat__label">{stat.label}</span>
              <span className="stj-handover-stat__meta">{stat.meta}</span>
            </div>
            <span
              className={`stj-handover-stat__num stj-handover-stat__num--${stat.key}`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="stj-handover-filters">
        <button
          className={`stj-filter-chip ${filter === "all" ? "stj-filter-chip--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Tất cả ({handoverApps.length})
        </button>
        <button
          className={`stj-filter-chip ${filter === "submitted" ? "stj-filter-chip--active" : ""}`}
          onClick={() => setFilter("submitted")}
        >
          Đã nộp ({countSubmitted})
        </button>
        <button
          className={`stj-filter-chip ${filter === "revision" ? "stj-filter-chip--active" : ""}`}
          onClick={() => setFilter("revision")}
        >
          Cần sửa ({countRevision})
        </button>
        <button
          className={`stj-filter-chip ${filter === "approved" ? "stj-filter-chip--active" : ""}`}
          onClick={() => setFilter("approved")}
        >
          Đã duyệt ({countApproved})
        </button>
        <button
          className={`stj-filter-chip ${filter === "completed" ? "stj-filter-chip--active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Hoàn tất ({countCompleted})
        </button>
      </div>

      {filteredApps.length === 0 ? (
        <div className="stj-handover-empty">
          <CheckCircle2 size={32} />
          <div>
            <strong>Không có bàn giao nào trong nhóm này</strong>
            <p>Bộ lọc hiện tại không có submission phù hợp.</p>
          </div>
        </div>
      ) : (
        <div className="stj-handover-grid">
          {filteredApps.map((application) => {
            const isBusy = actionLoading === application.id;
            const deliverables = application.deliverables || [];
            const revisionCount = application.revisionCount || 0;
            const revisionHistory = getSortedRevisionNotes(application);
            const submissionRound = getSubmissionRound(application);
            const submissionRoundGroups = getSubmissionRoundGroups(
              application,
              revisionHistory,
            );
            const activeRoundGroup = getActiveRoundGroup(
              application.id,
              submissionRoundGroups,
            );

            return (
              <div
                key={application.id}
                className={`stj-handover-card ${getStatusBadgeClass(application.status)}`}
              >
                <div className="stj-handover-card__header">
                  <div className="stj-handover-card__identity">
                    {application.userAvatar ? (
                      <img
                        src={resolveRecruitmentAssetUrl(application.userAvatar)}
                        alt={application.userFullName}
                        className="stj-handover-card__avatar"
                      />
                    ) : (
                      <div className="stj-handover-card__avatar stj-handover-card__avatar--fallback">
                        {application.userFullName
                          ? application.userFullName
                              .split(" ")
                              .map((name) => name[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          : "??"}
                      </div>
                    )}
                    <div>
                      <strong className="stj-handover-card__name">
                        {application.userFullName || "Không xác định"}
                      </strong>
                      <span className="stj-handover-card__subtitle">
                        {application.userProfessionalTitle || "Ứng viên"}
                      </span>
                      {application.userId && (
                        <div className="stj-handover-card__trust">
                          <TrustScoreDisplay
                            userId={application.userId}
                            size="small"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`stj-handover-badge ${getStatusBadgeClass(application.status)}`}
                  >
                    {getStatusLabel(application.status)}
                  </span>
                </div>

                <div className="stj-handover-card__meta">
                  <span>
                    <Clock3 size={12} />
                    Lần nộp {submissionRound}:{" "}
                    {formatDate(
                      application.submittedAt || application.appliedAt,
                    )}
                  </span>
                  <span>
                    <FileText size={12} />
                    {deliverables.length} files
                  </span>
                  {revisionCount > 0 && (
                    <span className="stj-handover-card__revision">
                      <RefreshCw size={12} />
                      {revisionCount} lần sửa
                    </span>
                  )}
                </div>

                <div className="stj-handover-card__workspace">
                  <section className="stj-handover-card__section stj-handover-card__section--timeline">
                    <div className="stj-handover-card__section-head">
                      <span className="stj-handover-card__section-title">
                        <RefreshCw size={12} />
                        Tiến trình bàn giao
                      </span>
                      <span className="stj-handover-card__section-meta">
                        {revisionCount} yêu cầu sửa
                      </span>
                    </div>

                    <ol className="stj-handover-timeline">
                      {submissionRoundGroups.map((roundGroup) => {
                        const isActive =
                          activeRoundGroup?.round === roundGroup.round;
                        const roundContent = getRoundContent(
                          application,
                          roundGroup,
                        );

                        return (
                          <li
                            key={`${application.id}-timeline-${roundGroup.round}`}
                            className={`stj-handover-timeline__item ${roundGroup.isCurrent ? "stj-handover-timeline__item--current" : ""} ${isActive ? "stj-handover-timeline__item--active" : ""}`}
                          >
                            <span
                              className={`stj-handover-timeline__dot ${roundGroup.isCurrent ? "stj-handover-timeline__dot--current" : roundGroup.recruiterNote ? "stj-handover-timeline__dot--resolved" : "stj-handover-timeline__dot--open"}`}
                            />
                            <button
                              type="button"
                              className="stj-handover-timeline__trigger"
                              onClick={() => {
                                setSelectedRoundByApp((previous) => ({
                                  ...previous,
                                  [application.id]: roundGroup.round,
                                }));
                              }}
                            >
                              <div className="stj-handover-timeline__content">
                                <div className="stj-handover-timeline__head">
                                  <strong>Lần gửi {roundGroup.round}</strong>
                                  <span>
                                    {formatDateTime(roundGroup.submittedAt)}
                                  </span>
                                </div>
                                <p>{roundContent}</p>
                                {roundGroup.isCurrent ? (
                                  <span className="stj-handover-timeline__state stj-handover-timeline__state--current">
                                    Trạng thái hiện tại:{" "}
                                    {getStatusLabel(application.status)}
                                  </span>
                                ) : roundGroup.recruiterNote ? (
                                  <span className="stj-handover-timeline__state stj-handover-timeline__state--resolved">
                                    Có feedback recruiter cho lần này
                                  </span>
                                ) : (
                                  <span className="stj-handover-timeline__state stj-handover-timeline__state--open">
                                    Lần nộp trước đó
                                  </span>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </section>

                  <section className="stj-handover-card__section stj-handover-card__section--deliverables">
                    <div className="stj-handover-card__section-head">
                      <span className="stj-handover-card__section-title">
                        <Download size={12} />
                        Deliverables
                      </span>
                      <span className="stj-handover-card__section-meta">
                        {deliverables.length} file
                      </span>
                    </div>

                    {activeRoundGroup ? (
                      (() => {
                        const imageItems = activeRoundGroup.deliverables.filter(
                          (deliverable) =>
                            getDeliverableBucket(deliverable) === "image",
                        );
                        const linkItems = activeRoundGroup.deliverables.filter(
                          (deliverable) =>
                            getDeliverableBucket(deliverable) === "link",
                        );
                        const fileItems = activeRoundGroup.deliverables.filter(
                          (deliverable) => {
                            const bucket = getDeliverableBucket(deliverable);
                            return bucket === "file" || bucket === "video";
                          },
                        );
                        const roundContent = getRoundContent(
                          application,
                          activeRoundGroup,
                        );

                        return (
                          <article
                            className={`stj-handover-round stj-handover-round--focused ${activeRoundGroup.isCurrent ? "stj-handover-round--current" : ""}`}
                          >
                            <div className="stj-handover-round__header">
                              <strong>Lần gửi {activeRoundGroup.round}</strong>
                              <span>
                                {formatDateTime(activeRoundGroup.submittedAt)}
                              </span>
                            </div>

                            <div className="stj-handover-round__meta">
                              <span>
                                {activeRoundGroup.deliverables.length} file
                              </span>
                              {activeRoundGroup.isCurrent && (
                                <span className="stj-handover-round__badge">
                                  Phiên bản hiện tại
                                </span>
                              )}
                            </div>

                            <p className="stj-handover-round__content">
                              {roundContent}
                            </p>

                            {activeRoundGroup.recruiterNote && (
                              <div className="stj-handover-round__review-note">
                                <RefreshCw size={12} />
                                <div>
                                  <strong>
                                    Feedback recruiter (
                                    {formatDateTime(
                                      activeRoundGroup.recruiterRequestedAt,
                                    )}
                                    )
                                  </strong>
                                  <p>{activeRoundGroup.recruiterNote}</p>
                                </div>
                              </div>
                            )}

                            {activeRoundGroup.deliverables.length === 0 ? (
                              <div className="stj-handover-round__empty">
                                Chưa có file cho lần gửi này.
                              </div>
                            ) : (
                              <div className="stj-handover-round__groups">
                                {imageItems.length > 0 && (
                                  <div className="stj-handover-round__group">
                                    <span className="stj-handover-round__group-title">
                                      Hình ảnh ({imageItems.length})
                                    </span>
                                    <ul className="stj-handover-card__file-list stj-handover-card__file-list--image">
                                      {imageItems.map((deliverable, index) =>
                                        renderDeliverableItem(
                                          deliverable,
                                          `image-${activeRoundGroup.round}-${deliverable.id || index}`,
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}

                                {linkItems.length > 0 && (
                                  <div className="stj-handover-round__group">
                                    <span className="stj-handover-round__group-title">
                                      Liên kết ({linkItems.length})
                                    </span>
                                    <ul className="stj-handover-card__file-list stj-handover-card__file-list--link">
                                      {linkItems.map((deliverable, index) =>
                                        renderDeliverableItem(
                                          deliverable,
                                          `link-${activeRoundGroup.round}-${deliverable.id || index}`,
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}

                                {fileItems.length > 0 && (
                                  <div className="stj-handover-round__group">
                                    <span className="stj-handover-round__group-title">
                                      Tệp và video ({fileItems.length})
                                    </span>
                                    <ul className="stj-handover-card__file-list stj-handover-card__file-list--asset">
                                      {fileItems.map((deliverable, index) =>
                                        renderDeliverableItem(
                                          deliverable,
                                          `asset-${activeRoundGroup.round}-${deliverable.id || index}`,
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </article>
                        );
                      })()
                    ) : (
                      <div className="stj-handover-timeline__empty">
                        Không có dữ liệu bàn giao cho ứng viên này.
                      </div>
                    )}
                  </section>
                </div>

                <div className="stj-handover-card__actions">
                  {application.status ===
                    ShortTermApplicationStatus.SUBMITTED && (
                    <>
                      <button
                        className="stj-action-btn stj-action-btn--approve"
                        disabled={isBusy}
                        onClick={() => handleApproveWork(application)}
                      >
                        {isBusy ? (
                          <Loader2 size={13} className="stj-spin" />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        Duyệt bàn giao
                      </button>
                      <button
                        className="stj-action-btn stj-action-btn--revision"
                        disabled={isBusy}
                        onClick={() => {
                          setRevisionModal(application);
                          setRevisionNote("");
                        }}
                      >
                        <RefreshCw size={13} />
                        Yêu cầu sửa
                      </button>
                      {selectedApplicantRevisionCount >= 5 && (
                        <button
                          className="stj-action-btn stj-action-btn--cancel"
                          disabled={isBusy}
                          onClick={() => {
                            setCancelReviewModal(application);
                            setCancelReviewReason("");
                          }}
                          title="Yêu cầu admin xem xét hủy job sau 5 lần sửa"
                        >
                          <X size={13} />
                          Yêu cầu hủy
                        </button>
                      )}
                    </>
                  )}

                  {application.status ===
                    ShortTermApplicationStatus.REVISION_REQUIRED && (
                    <div className="stj-handover-card__info-chip">
                      <RefreshCw size={13} />
                      Đã yêu cầu sửa lại - chờ ứng viên nộp lại
                    </div>
                  )}

                  {application.status ===
                    ShortTermApplicationStatus.APPROVED && (
                    <button
                      className="stj-action-btn stj-action-btn--approve"
                      disabled={isBusy}
                      onClick={() => handleCompleteJob(application)}
                    >
                      {isBusy ? (
                        <Loader2 size={13} className="stj-spin" />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      Hoàn tất job
                    </button>
                  )}

                  {application.status ===
                    ShortTermApplicationStatus.COMPLETED &&
                    job.status !== ShortTermJobStatus.COMPLETED &&
                    job.status !== ShortTermJobStatus.PAID && (
                      <button
                        className="stj-action-btn stj-action-btn--approve"
                        disabled={isBusy}
                        onClick={() => handleMarkAsPaid(application)}
                      >
                        {isBusy ? (
                          <Loader2 size={13} className="stj-spin" />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        Xác nhận thanh toán
                      </button>
                    )}

                  {application.status === ShortTermApplicationStatus.PAID && (
                    <div className="stj-handover-card__info-chip stj-handover-card__info-chip--success">
                      <CheckCircle2 size={13} />
                      Đã hoàn tất và thanh toán
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Panel */}
      <DisputePanel
        jobId={job.id}
        applicationId={job.selectedApplicantId}
        currentUserId={user?.id || 0}
        currentUserRole="RECRUITER"
        jobStatus={job.status}
      />

      {revisionModal && (
        <div
          className="stj-modal-backdrop"
          onClick={() => setRevisionModal(null)}
        >
          <div
            className="stj-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="stj-modal__eyebrow">Yêu cầu sửa bàn giao</span>
            <h3>{revisionModal.userFullName}</h3>
            <p>Mô tả chi tiết những gì cần sửa để ứng viên hiểu rõ yêu cầu.</p>
            <textarea
              className="stj-textarea"
              value={revisionNote}
              onChange={(event) => setRevisionNote(event.target.value)}
              placeholder="Ví dụ: Logo cần đặt ở vị trí chính giữa, màu nền cần chuyển sang #020617..."
              rows={4}
            />
            <div className="stj-modal__actions">
              <button
                className="stj-btn stj-btn--secondary"
                onClick={() => setRevisionModal(null)}
              >
                Hủy
              </button>
              <button
                className="stj-btn stj-btn--revision"
                disabled={actionLoading !== null || !revisionNote.trim()}
                onClick={handleRequestRevision}
              >
                {actionLoading !== null ? (
                  <Loader2 size={13} className="stj-spin" />
                ) : (
                  <RefreshCw size={13} />
                )}
                Gửi yêu cầu sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelReviewModal && (
        <div
          className="stj-modal-backdrop"
          onClick={() => setCancelReviewModal(null)}
        >
          <div
            className="stj-modal stj-modal--cancel-review"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="stj-modal__eyebrow">
              Yêu cầu hủy job cho admin
            </span>
            <h3>{cancelReviewModal.userFullName}</h3>
            <p>
              Sau khi gửi, Admin sẽ xem xét lý do và bằng chứng bàn giao trước
              khi quyết định có hủy job hay không. Nếu Admin từ chối, công việc
              sẽ tiếp tục và bạn cần phối hợp với ứng viên để hoàn thành.
            </p>
            <textarea
              className="stj-modal__textarea"
              value={cancelReviewReason}
              onChange={(e) => setCancelReviewReason(e.target.value)}
              placeholder="Nhập lý do bạn muốn hủy công việc này (ví dụ: ứng viên không hoàn thành đúng yêu cầu sau nhiều lần sửa)..."
              rows={4}
            />
            <div className="stj-modal__actions">
              <button
                className="stj-btn stj-btn--secondary"
                onClick={() => setCancelReviewModal(null)}
              >
                Hủy
              </button>
              <button
                className="stj-btn stj-btn--danger"
                disabled={actionLoading !== null || !cancelReviewReason.trim()}
                onClick={handleConfirmCancellationReview}
              >
                {actionLoading !== null ? (
                  <Loader2 size={13} className="stj-spin" />
                ) : (
                  <X size={13} />
                )}
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div className="stj-lightbox" onClick={() => setLightboxImage(null)}>
          <div
            className="stj-lightbox__inner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="stj-lightbox__close"
              onClick={() => setLightboxImage(null)}
            >
              <X size={20} />
            </button>
            <img
              src={resolveRecruitmentAssetUrl(lightboxImage.fileUrl)}
              alt={lightboxImage.fileName || "Hình ảnh bàn giao"}
              className="stj-lightbox__img"
            />
            <div className="stj-lightbox__footer">
              <span className="stj-lightbox__filename">
                <ImageIcon size={14} />
                {lightboxImage.fileName || "Hình ảnh bàn giao"}
              </span>
              <a
                href={resolveRecruitmentAssetUrl(lightboxImage.fileUrl)}
                download={lightboxImage.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="stj-lightbox__download"
              >
                <Download size={14} />
                Tải về
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortTermJobHandoverBoard;
