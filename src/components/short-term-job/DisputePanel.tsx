import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Info,
  Link as LinkIcon,
  RefreshCw,
  Upload,
  MessageSquare,
  Plus,
  Send,
  Shield,
  ShieldAlert,
  Clock,
  Users,
  Briefcase,
  X,
  Paperclip,
  Image,
  File,
  CheckCircle2,
  Scale,
} from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import { uploadMedia } from "../../services/mediaService";
import { useToast } from "../../hooks/useToast";
import { getStoredUserRaw } from "../../utils/authStorage";
import {
  Dispute,
  DisputeStatus,
  DisputeType,
  DisputeEvidence,
} from "../../types/ShortTermJob";
import ConfirmDialog from "../shared/ConfirmDialog";
import "../business-hud/short-term-fleet.css";

interface DisputePanelProps {
  jobId: number;
  applicationId?: number;
  currentUserId: number;
  currentUserRole: "RECRUITER" | "WORKER";
  jobStatus?: string;
  disputeEligibilityUnlocked?: boolean;
  revisionCount?: number;
  isOpen?: boolean;
  onToggle?: () => void;
  jobTitle?: string;
  recruiterName?: string;
  workerName?: string;
  escrowAmount?: number;
}

type EvidenceType = "TEXT" | "FILE" | "LINK" | "SCREENSHOT" | "CHAT_LOG" | "DELIVERABLE_SNAPSHOT";

const EVIDENCE_TYPE_OPTIONS: { value: EvidenceType; label: string; icon: React.ReactNode }[] = [
  { value: "TEXT", label: "Văn bản", icon: <FileText size={14} /> },
  { value: "FILE", label: "Tệp đính kèm", icon: <Paperclip size={14} /> },
  { value: "LINK", label: "Đường dẫn", icon: <LinkIcon size={14} /> },
  { value: "SCREENSHOT", label: "Ảnh chụp màn hình", icon: <Image size={14} /> },
  { value: "CHAT_LOG", label: "Nhật ký chat", icon: <MessageSquare size={14} /> },
  { value: "DELIVERABLE_SNAPSHOT", label: "Bàn giao đã nộp", icon: <File size={14} /> },
];

const DISPUTE_TYPE_OPTIONS: { value: DisputeType; label: string; description: string; icon: React.ReactNode }[] = [
  { value: DisputeType.WORKER_PROTECTION, label: "Bảo vệ ứng viên", description: "Ứng viên bị lạm dụng hoặc bất công trong quy trình revision (≥5 lần sửa).", icon: <Shield size={14} /> },
  { value: DisputeType.POOR_QUALITY, label: "Chất lượng kém", description: "Sản phẩm bàn giao không đạt yêu cầu hoặc không đúng scope.", icon: <AlertTriangle size={14} /> },
  { value: DisputeType.NO_SUBMISSION, label: "Không nộp bài", description: "Ứng viên không nộp sản phẩm hoặc bỏ bê công việc.", icon: <FileText size={14} /> },
  { value: DisputeType.MISSING_DELIVERABLE, label: "Thiếu sản phẩm", description: "Bàn giao thiếu file, tài liệu hoặc nội dung quan trọng.", icon: <File size={14} /> },
  { value: DisputeType.DEADLINE_VIOLATION, label: "Vi phạm deadline", description: "Công việc giao trễ so với deadline thỏa thuận ban đầu.", icon: <Clock size={14} /> },
  { value: DisputeType.PAYMENT_ISSUE, label: "Vấn đề thanh toán", description: "Thanh toán không đúng hạn hoặc không đúng số tiền.", icon: <Scale size={14} /> },
  { value: DisputeType.COMMUNICATION_FAILURE, label: "Không liên lạc được", description: "Ứng viên hoặc recruiter không phản hồi trong thời gian dài.", icon: <X size={14} /> },
  { value: DisputeType.SCOPE_CHANGE, label: "Thay đổi phạm vi", description: "Recruiter thay đổi yêu cầu ngoài phạm vi công việc ban đầu.", icon: <Plus size={14} /> },
  { value: DisputeType.RECRUITER_ABUSE, label: "Lạm dụng từ recruiter", description: "Recruiter yêu cầu sửa liên tục mà không có lý do hợp lý.", icon: <ShieldAlert size={14} /> },
  { value: DisputeType.CANCELLATION_REVIEW, label: "Yêu cầu hủy job", description: "Xem xét yêu cầu hủy công việc từ recruiter.", icon: <X size={14} /> },
  { value: DisputeType.OTHER, label: "Khác", description: "Các vấn đề khác không thuộc danh mục trên.", icon: <AlertTriangle size={14} /> },
];

const DisputePanel: React.FC<DisputePanelProps> = ({
  jobId,
  applicationId,
  currentUserId,
  currentUserRole,
  jobStatus,
  disputeEligibilityUnlocked,
  revisionCount,
  isOpen: controlledIsOpen,
  onToggle,
  jobTitle,
  recruiterName,
  workerName,
  escrowAmount,
}) => {
  const { showSuccess, showError } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(controlledIsOpen ?? internalOpen);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  // Evidence submission state
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("TEXT");
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidenceFilesPreview, setEvidenceFilesPreview] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Response state
  const [responseMap, setResponseMap] = useState<Record<number, string>>({});
  const [isSubmittingResponse, setIsSubmittingResponse] = useState<number | null>(null);

  // Expand/collapse evidence
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});

  // Dispute creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDisputeType, setCreateDisputeType] = useState("");
  const [createReason, setCreateReason] = useState("");
  const [isCreatingDispute, setIsCreatingDispute] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);

  // ========== CALLBACKS (must be defined before useEffect) ==========

  const loadDispute = useCallback(async () => {
    setIsLoading(true);
    try {
      const d = await shortTermJobService.getDisputeByJob(jobId);
      setDispute(d);
    } catch {
      setDispute(null);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      showError("File quá lớn", `Từng file tối đa 10MB. File vượt quá: ${oversized.map(f => f.name).join(", ")}`);
      return;
    }
    const previews = files.map((f) => URL.createObjectURL(f));
    setEvidenceFiles((prev) => [...prev, ...files]);
    setEvidenceFilesPreview((prev) => [...prev, ...previews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(evidenceFilesPreview[index]);
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
    setEvidenceFilesPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image size={16} />;
    if (file.type.startsWith("video/")) return <File size={16} />;
    return <Paperclip size={16} />;
  };

  const handleSubmitEvidence = async () => {
    if (!dispute) return;
    const hasText = evidenceText.trim();
    const hasLink = evidenceLink.trim();
    const hasFiles = evidenceFiles.length > 0;
    if (!hasText && !hasLink && !hasFiles) {
      showError("Thiếu nội dung", "Vui lòng nhập văn bản, đường dẫn, hoặc tải lên tệp.");
      return;
    }
    setIsSubmittingEvidence(true);
    try {
      const actorId = getStoredUserRaw() ? JSON.parse(getStoredUserRaw()!).id : 0;

      // Submit text evidence
      if (hasText || hasLink) {
        await shortTermJobService.submitEvidence(dispute.id, {
          evidenceType: evidenceType,
          content: evidenceText.trim() || undefined,
          fileUrl: hasLink ? evidenceLink.trim() : undefined,
          description: hasLink ? "Đường dẫn tham chiếu" : undefined,
        });
      }

      // Submit each file
      for (let i = 0; i < evidenceFiles.length; i++) {
        const file = evidenceFiles[i];
        const preview = evidenceFilesPreview[i];
        const media = await uploadMedia(file, actorId);
        await shortTermJobService.submitEvidence(dispute.id, {
          evidenceType: file.type.startsWith("image/") ? "SCREENSHOT" : "FILE",
          content: `Tệp đính kèm: ${file.name}`,
          fileUrl: media.url,
          fileName: media.fileName,
          description: file.name,
        });
      }

      setEvidenceText("");
      setEvidenceLink("");
      setEvidenceFiles([]);
      setEvidenceFilesPreview([]);
      setEvidenceType("TEXT");
      showSuccess("Đã gửi bằng chứng", "Bằng chứng của bạn đã được ghi nhận.");
      await loadDispute();
    } catch (err: any) {
      showError("Gửi bằng chứng thất bại", err.message || "Vui lòng thử lại.");
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleRespondToEvidence = async (evidenceId: number) => {
    if (!dispute) return;
    const content = responseMap[evidenceId]?.trim();
    if (!content) return;
    setIsSubmittingResponse(evidenceId);
    try {
      await shortTermJobService.respondToEvidence(dispute.id, evidenceId, content);
      setResponseMap((prev) => ({ ...prev, [evidenceId]: "" }));
      showSuccess("Đã phản hồi", "Phản hồi của bạn đã được ghi nhận.");
      await loadDispute();
    } catch (err: any) {
      showError("Phản hồi thất bại", err.message || "Vui lòng thử lại.");
    } finally {
      setIsSubmittingResponse(null);
    }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleString("vi-VN");

  const handleSubmitDispute = async () => {
    if (!createDisputeType || !createReason.trim() || !applicationId) return;
    setIsCreatingDispute(true);
    try {
      const newDispute = await shortTermJobService.openDispute({
        jobId,
        applicationId,
        disputeType: createDisputeType as DisputeType,
        reason: createReason.trim(),
      });
      setDispute(newDispute);
      setShowCreateForm(false);
      setCreateDisputeType("");
      setCreateReason("");
      showSuccess("Đã gửi khiếu nại", "Admin sẽ xem xét trong 5 ngày làm việc.");
    } catch (err: any) {
      showError("Gửi khiếu nại thất bại", err.message || "Vui lòng thử lại.");
    } finally {
      setIsCreatingDispute(false);
      setShowCreateConfirm(false);
    }
  };

  const getStatusMeta = (status: string) => {
    const meta: Record<string, { bg: string; color: string; label: string }> = {
      OPEN: { bg: "rgba(251, 113, 133, 0.15)", color: "#fb7185", label: "Đang mở" },
      UNDER_INVESTIGATION: { bg: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", label: "Đang điều tra" },
      AWAITING_RESPONSE: { bg: "rgba(56, 189, 248, 0.15)", color: "#7dd3fc", label: "Chờ phản hồi" },
      ESCALATED: { bg: "rgba(239, 68, 68, 0.15)", color: "#f87171", label: "Escalated" },
      RESOLVED: { bg: "rgba(74, 222, 128, 0.15)", color: "#4ade80", label: "Đã giải quyết" },
      DISMISSED: { bg: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", label: "Bị bác" },
    };
    return meta[status] || { bg: "rgba(148,163,184,0.1)", color: "#94a3b8", label: status };
  };

  const getEvidenceTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      TEXT: <FileText size={13} />,
      FILE: <Paperclip size={13} />,
      LINK: <LinkIcon size={13} />,
      SCREENSHOT: <Image size={13} />,
      CHAT_LOG: <MessageSquare size={13} />,
      DELIVERABLE_SNAPSHOT: <File size={13} />,
    };
    return icons[type] || <FileText size={13} />;
  };

  const statusMeta = dispute ? getStatusMeta(dispute.status) : null;

  // ========== COMPUTED VALUES (derived from state) ==========
  const ELIGIBLE_JOB_STATUSES = ["CANCELLATION_REQUESTED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "AUTO_APPROVED"];
  const canOpenDispute = currentUserRole === "WORKER" &&
    !!disputeEligibilityUnlocked &&
    (revisionCount || 0) >= 5 &&
    ELIGIBLE_JOB_STATUSES.includes(jobStatus || "");
  const isDisputeActive = dispute && !["RESOLVED", "DISMISSED"].includes(dispute.status);

  // ========== EFFECTS ==========
  useEffect(() => {
    loadDispute();
  }, [loadDispute]);

  useEffect(() => {
    if (!isDisputeActive) return;
    const interval = setInterval(loadDispute, 30_000);
    return () => clearInterval(interval);
  }, [isDisputeActive, loadDispute]);

  return (
    <div className="dp-panel">
      {/* Header */}
      <div className="dp-panel__header" onClick={() => {
        const next = !isOpen;
        setIsOpen(next);
        if (controlledIsOpen === undefined) setInternalOpen(next);
        onToggle?.();
      }}>
        <div className="dp-panel__header-left">
          <Shield size={18} className="dp-panel__header-icon" />
          <span className="dp-panel__title">Dispute</span>
          {dispute && (
            <span
              className="dp-badge"
              style={{ background: statusMeta?.bg, color: statusMeta?.color }}
            >
              {statusMeta?.label}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {isOpen && dispute && isDisputeActive && (
            <button
              onClick={(e) => { e.stopPropagation(); loadDispute(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", padding: "0.2rem" }}
              title="Làm mới"
            >
              <RefreshCw size={14} style={{ opacity: isLoading ? 0.5 : 1 }} />
            </button>
          )}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="dp-panel__body">
          {isLoading ? (
            <div className="dp-loading">
              <Loader2 size={20} className="dp-spin" />
              <span>Đang tải...</span>
            </div>
          ) : !dispute ? (
            canOpenDispute ? (
              showCreateForm ? (
                <div className="dp-create-form">
                  <div className="dp-create-form__header">
                    <ShieldAlert size={18} />
                    <span>Mở khiếu nại</span>
                  </div>

                  <div className="dp-create-form__type-section">
                    <div className="dp-section-title">
                      <AlertTriangle size={13} /> Loại khiếu nại
                    </div>
                    <div className="dp-dispute-type-grid">
                      {DISPUTE_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`dp-dispute-type-card ${createDisputeType === opt.value ? "is-selected" : ""}`}
                          onClick={() => setCreateDisputeType(opt.value)}
                          title={opt.description}
                        >
                          <div className="dp-dispute-type-card__icon">{opt.icon}</div>
                          <div className="dp-dispute-type-card__info">
                            <span className="dp-dispute-type-card__label">{opt.label}</span>
                            <span className="dp-dispute-type-card__desc">{opt.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="dp-create-form__reason">
                    <div className="dp-section-title">
                      <MessageSquare size={13} /> Mô tả chi tiết
                    </div>
                    <textarea
                      className="dp-textarea"
                      value={createReason}
                      onChange={(e) => setCreateReason(e.target.value)}
                      placeholder="Mô tả chi tiết vấn đề bạn gặp phải, kèm bằng chứng nếu có..."
                      rows={5}
                    />
                    <span className="dp-create-form__char-count">
                      {createReason.length} / 2000 ký tự
                    </span>
                  </div>

                  <div className="dp-create-form__warning">
                    <AlertTriangle size={14} />
                    <span>
                      <strong>Lưu ý:</strong> Mở khiếu nại sẽ đóng băng số tiền escrow cho đến khi Admin xử lý (tối đa 5 ngày). Khiếu nại không được rút lại sau khi gửi.
                    </span>
                  </div>

                  <div className="dp-create-form__continue">
                    <button
                      className="dp-btn dp-btn--ghost"
                      onClick={() => setShowCreateForm(false)}
                    >
                      <ArrowLeft size={14} /> Tiếp tục làm việc
                    </button>
                    <span className="dp-create-form__or">hoặc</span>
                    <button
                      className="dp-btn dp-btn--danger"
                      onClick={() => setShowCreateConfirm(true)}
                      disabled={!createDisputeType || !createReason.trim() || isCreatingDispute}
                    >
                      {isCreatingDispute ? (
                        <><Loader2 size={13} className="dp-spin" /> Đang gửi...</>
                      ) : (
                        <><ShieldAlert size={14} /> Mở khiếu nại</>
                      )}
                    </button>
                  </div>

                  <ConfirmDialog
                    isOpen={showCreateConfirm}
                    title="Xác nhận gửi khiếu nại"
                    message={`Bạn sắp gửi khiếu nại.\n\nSố tiền escrow sẽ bị đóng băng. Bạn không thể rút lại khiếu nại sau khi gửi. Tiếp tục?`}
                    confirmLabel="Gửi khiếu nại"
                    cancelLabel="Hủy"
                    variant="danger"
                    onConfirm={handleSubmitDispute}
                    onCancel={() => setShowCreateConfirm(false)}
                  />
                </div>
              ) : (
                <div className="dp-empty dp-empty--can-dispute">
                  <CheckCircle2 size={24} color="#00ff88" />
                  <p>Đã đạt 5 lần sửa — bạn có thể mở khiếu nại</p>
                  <span>Bạn có thể tiếp tục làm việc hoặc mở khiếu nại nếu cần.</span>
                  <button
                    className="dp-btn dp-btn--danger"
                    style={{ marginTop: "0.75rem" }}
                    onClick={() => setShowCreateForm(true)}
                  >
                    <ShieldAlert size={14} /> Mở khiếu nại
                  </button>
                </div>
              )
            ) : (
              <div className="dp-empty">
                {currentUserRole === "RECRUITER" ? (
                  <>
                    {(revisionCount || 0) >= 5 ? (
                      <>
                        <CheckCircle2 size={24} color="#00f5ff" />
                        <p>Ứng viên đã đạt 5 lần sửa — có thể mở khiếu nại</p>
                        <span>Chờ ứng viên mở khiếu nại hoặc liên hệ admin.</span>
                      </>
                    ) : (
                      <>
                        <Info size={24} />
                        <p>Chưa có khiếu nại cho công việc này.</p>
                        <span>Ứng viên đã {revisionCount || 0}/5 lần yêu cầu sửa.</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <AlertTriangle size={24} />
                    <p>Chưa đủ điều kiện mở khiếu nại.</p>
                    <span>Đã {revisionCount || 0}/5 lần yêu cầu sửa. Khiếu nại sẽ mở sau lần sửa thứ 5.</span>
                  </>
                )}
              </div>
            )
          ) : (
            <>
              {/* Dispute Overview */}
              <div className="dp-overview">
                <div className="dp-overview__grid">
                  <div className="dp-info-card">
                    <div className="dp-info-card__label">
                      <Users size={13} /> Người khiếu nại
                    </div>
                    <div className="dp-info-card__value">{dispute.initiatorName || `#${dispute.initiatorId}`}</div>
                  </div>
                  <div className="dp-info-card">
                    <div className="dp-info-card__label">
                      <Briefcase size={13} /> Công việc
                    </div>
                    <div className="dp-info-card__value">{jobTitle || `#${jobId}`}</div>
                  </div>
                  <div className="dp-info-card">
                    <div className="dp-info-card__label">
                      <Clock size={13} /> Mở lúc
                    </div>
                    <div className="dp-info-card__value">{formatTime(dispute.createdAt)}</div>
                  </div>
                  {escrowAmount !== undefined && (
                    <div className="dp-info-card">
                      <div className="dp-info-card__label">
                        <Scale size={13} /> Số tiền escrow
                      </div>
                      <div className="dp-info-card__value dp-info-card__value--money">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(escrowAmount)}
                      </div>
                    </div>
                  )}
                  {dispute.adminResolutionDeadlineAt && (
                    <div className="dp-info-card">
                      <div className="dp-info-card__label">
                        <Clock size={13} /> Hạn xử lý
                      </div>
                      <div className="dp-info-card__value dp-info-card__value--urgent">
                        {formatTime(dispute.adminResolutionDeadlineAt)}
                      </div>
                    </div>
                  )}
                  {dispute.escalationLevel !== undefined && dispute.escalationLevel > 0 && (
                    <div className="dp-info-card">
                      <div className="dp-info-card__label">
                        <AlertTriangle size={13} /> Cấp leo thang
                      </div>
                      <div className="dp-info-card__value" style={{ color: "#fb7185" }}>
                        Cấp {dispute.escalationLevel} — {dispute.priority || "Thường"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div className="dp-reason">
                  <div className="dp-reason__label">Lý do khiếu nại</div>
                  <div className="dp-reason__content">{dispute.reason}</div>
                </div>

                {/* Resolution */}
                {dispute.status === "RESOLVED" && (
                  <div className="dp-resolution">
                    <div className="dp-resolution__header">
                      <CheckCircle2 size={16} />
                      <span>Kết quả giải quyết</span>
                    </div>
                    <div className="dp-resolution__type">{shortTermJobService.getDisputeTypeText(dispute.disputeType)}</div>
                    {dispute.resolutionNotes && (
                      <p className="dp-resolution__notes">{dispute.resolutionNotes}</p>
                    )}
                    {dispute.partialRefundPct !== undefined && (
                      <div className="dp-resolution__split">
                        Chia {dispute.partialRefundPct}% cho ứng viên
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Evidence Timeline */}
              {dispute.evidence && dispute.evidence.length > 0 && (
                <div className="dp-evidence-section">
                  <div className="dp-section-title">
                    <Paperclip size={15} />
                    Bằng chứng ({dispute.evidence.length})
                  </div>
                  <div className="dp-timeline">
                    {dispute.evidence.map((ev) => (
                      <div key={ev.id} className={`dp-evidence-item ${ev.isOfficial ? "dp-evidence-item--official" : ""}`}>
                        <div className="dp-evidence-item__header">
                          <div className="dp-evidence-item__meta">
                            <span className="dp-evidence-item__type-icon">
                              {getEvidenceTypeIcon(ev.evidenceType)}
                            </span>
                            <span className="dp-evidence-item__author">{ev.submittedByName}</span>
                            {ev.isOfficial && (
                              <span className="dp-evidence-item__admin-badge">Admin</span>
                            )}
                          </div>
                          <span className="dp-evidence-item__time">{formatTime(ev.createdAt)}</span>
                        </div>

                        {ev.content && (
                          <p className="dp-evidence-item__content">{ev.content}</p>
                        )}

                        {ev.fileUrl && (
                          <a
                            href={ev.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dp-evidence-item__file"
                          >
                            {ev.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img src={ev.fileUrl} alt={ev.fileName || "Evidence"} className="dp-evidence-item__file-thumb" />
                            ) : (
                              <div className="dp-evidence-item__file-badge">
                                <Paperclip size={14} />
                                <span>{ev.fileName || "Tệp đính kèm"}</span>
                              </div>
                            )}
                          </a>
                        )}

                        {ev.responses && ev.responses.length > 0 && (
                          <div className="dp-evidence-item__responses">
                            {ev.responses.map((resp) => (
                              <div key={resp.id} className="dp-evidence-item__response">
                                <div className="dp-evidence-item__response-header">
                                  <MessageSquare size={11} />
                                  <span className="dp-evidence-item__response-author">{resp.respondedByName}</span>
                                  {resp.isAdminResponse && (
                                    <span className="dp-evidence-item__admin-badge">Admin</span>
                                  )}
                                  <span className="dp-evidence-item__time">{formatTime(resp.createdAt)}</span>
                                </div>
                                <p className="dp-evidence-item__response-content">{resp.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Respond to this evidence */}
                        {isDisputeActive && (
                          <div className="dp-evidence-item__reply">
                            <input
                              type="text"
                              placeholder="Phản hồi bằng chứng này..."
                              value={responseMap[ev.id] || ""}
                              onChange={(e) => setResponseMap((p) => ({ ...p, [ev.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === "Enter" && handleRespondToEvidence(ev.id)}
                              className="dp-evidence-item__reply-input"
                            />
                            <button
                              className="dp-evidence-item__reply-btn"
                              onClick={() => handleRespondToEvidence(ev.id)}
                              disabled={isSubmittingResponse === ev.id || !responseMap[ev.id]?.trim()}
                            >
                              {isSubmittingResponse === ev.id ? (
                                <Loader2 size={13} className="dp-spin" />
                              ) : (
                                <Send size={13} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Evidence Form */}
              {isDisputeActive && (
                <div className="dp-submit-evidence">
                  <div className="dp-section-title">
                    <Plus size={15} />
                    Gửi bằng chứng mới
                  </div>

                  {/* Evidence type selector */}
                  <div className="dp-evidence-type-selector">
                    {EVIDENCE_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`dp-evidence-type-btn ${evidenceType === opt.value ? "is-active" : ""}`}
                        onClick={() => setEvidenceType(opt.value)}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Text area */}
                  {(evidenceType === "TEXT" || evidenceType === "SCREENSHOT" || evidenceType === "CHAT_LOG" || evidenceType === "DELIVERABLE_SNAPSHOT") && (
                    <textarea
                      className="dp-textarea"
                      value={evidenceText}
                      onChange={(e) => setEvidenceText(e.target.value)}
                      placeholder={
                        evidenceType === "CHAT_LOG"
                          ? "Dán nội dung cuộc trò chuyện tại đây..."
                          : evidenceType === "SCREENSHOT"
                          ? "Mô tả ảnh chụp màn hình..."
                          : "Nhập nội dung bằng chứng..."
                      }
                      rows={4}
                    />
                  )}

                  {/* Link input */}
                  {evidenceType === "LINK" && (
                    <input
                      type="url"
                      className="dp-input"
                      value={evidenceLink}
                      onChange={(e) => setEvidenceLink(e.target.value)}
                      placeholder="https://..."
                    />
                  )}

                  {/* File upload zone */}
                  {evidenceType === "FILE" && (
                    <div className="dp-file-upload" onClick={() => fileInputRef.current?.click()}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="dp-file-upload__input"
                        onChange={handleFileSelect}
                      />
                      <Upload size={22} className="dp-file-upload__icon" />
                      <p className="dp-file-upload__text">
                        <strong>Kéo thả hoặc click để chọn tệp</strong>
                      </p>
                      <span className="dp-file-upload__hint">Hình ảnh, tài liệu, video...</span>
                    </div>
                  )}

                  {/* Selected files */}
                  {evidenceFiles.length > 0 && (
                    <div className="dp-files-list">
                      {evidenceFiles.map((file, i) => (
                        <div key={i} className="dp-file-item">
                          <div className="dp-file-item__thumb">
                            {file.type.startsWith("image/") ? (
                              <img src={evidenceFilesPreview[i]} alt="" />
                            ) : (
                              <Paperclip size={16} />
                            )}
                          </div>
                          <div className="dp-file-item__info">
                            <span className="dp-file-item__name">{file.name}</span>
                            <span className="dp-file-item__size">{formatFileSize(file.size)}</span>
                          </div>
                          <button
                            type="button"
                            className="dp-file-item__remove"
                            onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    className="dp-btn dp-btn--primary"
                    onClick={handleSubmitEvidence}
                    disabled={
                      isSubmittingEvidence ||
                      (!evidenceText.trim() && !evidenceLink.trim() && evidenceFiles.length === 0)
                    }
                  >
                    {isSubmittingEvidence ? (
                      <><Loader2 size={14} className="dp-spin" /> Đang gửi...</>
                    ) : (
                      <><Plus size={14} /> Gửi bằng chứng</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DisputePanel;
