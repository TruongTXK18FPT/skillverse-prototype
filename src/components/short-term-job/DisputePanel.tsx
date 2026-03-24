import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Link as LinkIcon,
  Upload,
  MessageSquare,
  Plus,
  Send,
} from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import { uploadMedia } from "../../services/mediaService";
import { useToast } from "../../hooks/useToast";
import { getStoredUserRaw } from "../../utils/authStorage";
import {
  Dispute,
  DisputeType,
  DisputeStatus,
  DisputeEvidence,
} from "../../types/ShortTermJob";
import "../business-hud/short-term-fleet.css";

interface DisputePanelProps {
  jobId: number;
  applicationId?: number;
  currentUserId: number;
  currentUserRole: "RECRUITER" | "WORKER";
  jobStatus?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const DISPUTE_TYPE_OPTIONS: { value: DisputeType; label: string }[] = [
  { value: DisputeType.NO_SUBMISSION, label: "Không nộp bài" },
  { value: DisputeType.POOR_QUALITY, label: "Chất lượng kém" },
  { value: DisputeType.MISSING_DELIVERABLE, label: "Thiếu sản phẩm" },
  { value: DisputeType.DEADLINE_VIOLATION, label: "Vi phạm deadline" },
  { value: DisputeType.PAYMENT_ISSUE, label: "Vấn đề thanh toán" },
  { value: DisputeType.COMMUNICATION_FAILURE, label: "Không liên lạc được" },
  { value: DisputeType.SCOPE_CHANGE, label: "Thay đổi phạm vi" },
  { value: DisputeType.SCAM_REPORT, label: "Báo lừa đảo" },
  { value: DisputeType.OTHER, label: "Khác" },
];

const DisputePanel: React.FC<DisputePanelProps> = ({
  jobId,
  applicationId,
  currentUserId,
  currentUserRole,
  jobStatus,
  isOpen: controlledIsOpen,
  onToggle,
}) => {
  const { showSuccess, showError } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(controlledIsOpen ?? internalOpen);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [openFormData, setOpenFormData] = useState({ disputeType: DisputeType.OTHER, reason: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [responseMap, setResponseMap] = useState<Record<number, string>>({});
  const [isSubmittingResponse, setIsSubmittingResponse] = useState<number | null>(null);

  useEffect(() => {
    loadDispute();
  }, [jobId]);

  const loadDispute = async () => {
    setIsLoading(true);
    try {
      const d = await shortTermJobService.getDisputeByJob(jobId);
      setDispute(d);
    } catch {
      setDispute(null);
    } finally {
      setIsLoading(false);
    }
  };

  const canOpenDispute =
    jobStatus === "IN_PROGRESS" ||
    jobStatus === "SUBMITTED" ||
    jobStatus === "UNDER_REVIEW" ||
    jobStatus === "APPROVED";

  const handleOpenDispute = async () => {
    if (!openFormData.reason.trim()) {
      showError("Thiếu nội dung", "Vui lòng nhập lý do dispute.");
      return;
    }
    if (!applicationId) {
      showError("Lỗi", "Không tìm thấy application.");
      return;
    }
    setIsSubmitting(true);
    try {
      const d = await shortTermJobService.openDispute({
        jobId,
        applicationId,
        disputeType: openFormData.disputeType,
        reason: openFormData.reason.trim(),
      });
      setDispute(d);
      setShowOpenForm(false);
      setOpenFormData({ disputeType: DisputeType.OTHER, reason: "" });
      showSuccess("Đã mở dispute", "Dispute đã được gửi. Admin sẽ xem xét.");
    } catch (err: any) {
      showError("Mở dispute thất bại", err.message || "Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!dispute) return;
    if (!evidenceText.trim() && !evidenceLink.trim() && !evidenceFile) {
      showError("Thiếu bằng chứng", "Vui lòng nhập text, link, hoặc tải lên tệp.");
      return;
    }
    setIsSubmittingEvidence(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      if (evidenceFile) {
        const actorId = getStoredUserRaw()
          ? JSON.parse(getStoredUserRaw()!).id
          : 0;
        const media = await uploadMedia(evidenceFile, actorId);
        fileUrl = media.url;
        fileName = media.fileName;
      }
      const evidenceType = evidenceFile
        ? "FILE"
        : evidenceLink.trim()
        ? "LINK"
        : "TEXT";
      await shortTermJobService.submitEvidence(dispute.id, {
        evidenceType,
        content: evidenceText.trim() || undefined,
        fileUrl,
        fileName,
        description: evidenceFile?.name || evidenceLink.trim() || undefined,
      });
      setEvidenceText("");
      setEvidenceLink("");
      setEvidenceFile(null);
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

  const isDisputeActive = dispute && !["RESOLVED", "DISMISSED"].includes(dispute.status);

  return (
    <div
      style={{
        borderRadius: "16px",
        background: "rgba(8, 15, 30, 0.65)",
        border: "1px solid rgba(251, 113, 133, 0.15)",
        overflow: "hidden",
        marginBottom: "1rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          cursor: "pointer",
          background: dispute
            ? "rgba(251, 113, 133, 0.06)"
            : "transparent",
        }}
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (controlledIsOpen === undefined) setInternalOpen(next);
          onToggle?.();
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <AlertTriangle size={18} style={{ color: "#fb7185" }} />
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#e0f2fe" }}>
            Dispute
          </span>
          {dispute && (
            <span
              style={{
                padding: "0.15rem 0.5rem",
                borderRadius: "999px",
                fontSize: "0.7rem",
                fontWeight: 700,
                background:
                  dispute.status === "RESOLVED"
                    ? "rgba(74, 222, 128, 0.15)"
                    : dispute.status === "DISMISSED"
                    ? "rgba(148, 163, 184, 0.15)"
                    : "rgba(251, 113, 133, 0.15)",
                color:
                  dispute.status === "RESOLVED"
                    ? "#4ade80"
                    : dispute.status === "DISMISSED"
                    ? "#94a3b8"
                    : "#fb7185",
              }}
            >
              {shortTermJobService.getDisputeStatusText(dispute.status)}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} style={{ color: "#94a3b8" }} /> : <ChevronDown size={16} style={{ color: "#94a3b8" }} />}
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: "0 1.25rem 1.25rem" }}>
          {isLoading ? (
            <div className="stj-loading" style={{ padding: "1rem 0" }}>
              <Loader2 size={18} className="stj-spin" />
            </div>
          ) : !dispute ? (
            <>
              {/* No dispute yet */}
              {canOpenDispute && (
                <>
                  {!showOpenForm ? (
                    <button
                      className="stj-btn stj-btn--danger"
                      onClick={() => setShowOpenForm(true)}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      <AlertTriangle size={14} />
                      Mở Dispute
                    </button>
                  ) : (
                    <div style={{ marginTop: "0.75rem" }}>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.4rem" }}>
                        Loại dispute
                      </label>
                      <select
                        value={openFormData.disputeType}
                        onChange={(e) =>
                          setOpenFormData((p) => ({ ...p, disputeType: e.target.value as DisputeType }))
                        }
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(148, 163, 184, 0.15)",
                          background: "rgba(8, 15, 30, 0.55)",
                          color: "#e0f2fe",
                          fontSize: "0.85rem",
                          marginBottom: "0.75rem",
                          outline: "none",
                        }}
                      >
                        {DISPUTE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.4rem" }}>
                        Lý do / Mô tả chi tiết
                      </label>
                      <textarea
                        className="stj-textarea"
                        value={openFormData.reason}
                        onChange={(e) => setOpenFormData((p) => ({ ...p, reason: e.target.value }))}
                        placeholder="Mô tả chi tiết vấn đề của bạn..."
                        rows={4}
                      />

                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", justifyContent: "flex-end" }}>
                        <button
                          className="stj-btn stj-btn--secondary"
                          onClick={() => setShowOpenForm(false)}
                          disabled={isSubmitting}
                        >
                          Hủy
                        </button>
                        <button
                          className="stj-btn stj-btn--danger"
                          onClick={handleOpenDispute}
                          disabled={isSubmitting || !openFormData.reason.trim()}
                        >
                          {isSubmitting ? (
                            <Loader2 size={13} className="stj-spin" />
                          ) : (
                            <AlertTriangle size={13} />
                          )}
                          Gửi Dispute
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!canOpenDispute && (
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", textAlign: "center", padding: "0.5rem 0" }}>
                  Không thể mở dispute ở trạng thái công việc hiện tại.
                </p>
              )}
            </>
          ) : (
            <>
              {/* Dispute info */}
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  background: "rgba(8, 15, 30, 0.45)",
                  border: "1px solid rgba(148, 163, 184, 0.08)",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "0.78rem" }}>
                    <span style={{ color: "#64748b" }}>Loại: </span>
                    <span style={{ color: "#e0f2fe", fontWeight: 500 }}>
                      {shortTermJobService.getDisputeTypeText(dispute.disputeType)}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem" }}>
                    <span style={{ color: "#64748b" }}>Người mở: </span>
                    <span style={{ color: "#e0f2fe", fontWeight: 500 }}>{dispute.initiatorName}</span>
                  </div>
                  <div style={{ fontSize: "0.78rem" }}>
                    <span style={{ color: "#64748b" }}>Mở lúc: </span>
                    <span style={{ color: "#94a3b8" }}>{formatTime(dispute.createdAt)}</span>
                  </div>
                </div>
                {dispute.reason && (
                  <p
                    style={{
                      margin: "0.5rem 0 0",
                      fontSize: "0.82rem",
                      color: "#cbd5e1",
                      lineHeight: 1.55,
                    }}
                  >
                    {dispute.reason}
                  </p>
                )}
              </div>

              {/* Evidence List */}
              {dispute.evidence && dispute.evidence.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h4
                    style={{
                      margin: "0 0 0.6rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#94a3b8",
                    }}
                  >
                    Bằng chứng ({dispute.evidence.length})
                  </h4>
                  {dispute.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "10px",
                        background: "rgba(8, 15, 30, 0.45)",
                        border: `1px solid ${ev.isOfficial ? "rgba(251, 191, 36, 0.2)" : "rgba(148, 163, 184, 0.08)"}`,
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {ev.evidenceType === "TEXT" && <FileText size={13} style={{ color: "#94a3b8" }} />}
                          {ev.evidenceType === "FILE" && <Upload size={13} style={{ color: "#94a3b8" }} />}
                          {ev.evidenceType === "LINK" && <LinkIcon size={13} style={{ color: "#94a3b8" }} />}
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#e0f2fe" }}>
                            {ev.submittedByName}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                            {formatTime(ev.createdAt)}
                          </span>
                        </div>
                      </div>
                      {ev.content && (
                        <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                          {ev.content}
                        </p>
                      )}
                      {ev.fileUrl && (
                        <a
                          href={ev.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: "0.78rem", color: "#67e8f9", textDecoration: "none" }}
                        >
                          <LinkIcon size={11} /> {ev.fileName || "Tệp đính kèm"}
                        </a>
                      )}
                      {ev.description && (
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                          {ev.description}
                        </p>
                      )}

                      {/* Responses */}
                      {ev.responses && ev.responses.length > 0 && (
                        <div style={{ marginTop: "0.5rem", paddingLeft: "0.75rem", borderLeft: "2px solid rgba(148, 163, 184, 0.12)" }}>
                          {ev.responses.map((resp) => (
                            <div key={resp.id} style={{ marginBottom: "0.35rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <MessageSquare size={11} style={{ color: "#64748b" }} />
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                                  {resp.respondedByName}
                                </span>
                                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                                  {formatTime(resp.createdAt)}
                                </span>
                              </div>
                              <p style={{ margin: "0.1rem 0 0", fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                                {resp.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Response form */}
                      {isDisputeActive && (
                        <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem" }}>
                          <input
                            type="text"
                            placeholder="Phản hồi..."
                            value={responseMap[ev.id] || ""}
                            onChange={(e) => setResponseMap((p) => ({ ...p, [ev.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleRespondToEvidence(ev.id)}
                            style={{
                              flex: 1,
                              padding: "0.4rem 0.6rem",
                              borderRadius: "6px",
                              border: "1px solid rgba(148, 163, 184, 0.15)",
                              background: "rgba(8, 15, 30, 0.55)",
                              color: "#e0f2fe",
                              fontSize: "0.8rem",
                              outline: "none",
                            }}
                          />
                          <button
                            className="stj-btn stj-btn--ghost"
                            onClick={() => handleRespondToEvidence(ev.id)}
                            disabled={isSubmittingResponse === ev.id || !responseMap[ev.id]?.trim()}
                            style={{ padding: "0.4rem 0.6rem" }}
                          >
                            {isSubmittingResponse === ev.id ? (
                              <Loader2 size={12} className="stj-spin" />
                            ) : (
                              <Send size={12} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Evidence Form */}
              {isDisputeActive && (
                <div>
                  <h4
                    style={{
                      margin: "0 0 0.6rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#94a3b8",
                    }}
                  >
                    Gửi bằng chứng
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <textarea
                      className="stj-textarea"
                      value={evidenceText}
                      onChange={(e) => setEvidenceText(e.target.value)}
                      placeholder="Nhập nội dung bằng chứng..."
                      rows={2}
                      style={{ minHeight: "60px" }}
                    />
                    <input
                      type="url"
                      placeholder="Hoặc dán đường dẫn..."
                      value={evidenceLink}
                      onChange={(e) => setEvidenceLink(e.target.value)}
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(148, 163, 184, 0.15)",
                        background: "rgba(8, 15, 30, 0.55)",
                        color: "#e0f2fe",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="file"
                        id={`dispute-file-${jobId}`}
                        onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                        style={{ fontSize: "0.8rem", color: "#94a3b8" }}
                      />
                      {evidenceFile && (
                        <span style={{ fontSize: "0.78rem", color: "#4ade80" }}>
                          {evidenceFile.name}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        className="stj-btn stj-btn--primary"
                        onClick={handleSubmitEvidence}
                        disabled={
                          isSubmittingEvidence ||
                          (!evidenceText.trim() && !evidenceLink.trim() && !evidenceFile)
                        }
                      >
                        {isSubmittingEvidence ? (
                          <Loader2 size={13} className="stj-spin" />
                        ) : (
                          <Plus size={13} />
                        )}
                        Gửi bằng chứng
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Resolved */}
              {dispute.status === "RESOLVED" && dispute.resolutionNotes && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: "rgba(74, 222, 128, 0.08)",
                    border: "1px solid rgba(74, 222, 128, 0.2)",
                    marginTop: "0.5rem",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#4ade80", marginBottom: "0.35rem" }}>
                    Kết quả: {dispute.resolution}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.5 }}>
                    {dispute.resolutionNotes}
                  </p>
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
