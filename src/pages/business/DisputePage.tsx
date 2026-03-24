import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  FileText,
  Link as LinkIcon,
  Upload,
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import { uploadMedia } from "../../services/mediaService";
import { useToast } from "../../hooks/useToast";
import { getStoredUserRaw } from "../../utils/authStorage";
import DisputePanel from "../../components/short-term-job/DisputePanel";
import EscrowStatusBanner from "../../components/short-term-job/EscrowStatusBanner";
import EscrowTransactionList from "../../components/short-term-job/EscrowTransactionList";
import "../business-hud/short-term-fleet.css";
import "../../components/business-hud/short-term-fleet.css";

const DisputePage: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [dispute, setDispute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (disputeId) {
      loadDispute();
    }
  }, [disputeId]);

  const loadDispute = async () => {
    if (!disputeId) return;
    setIsLoading(true);
    try {
      const d = await shortTermJobService.getDispute(parseInt(disputeId));
      setDispute(d);
    } catch (err: any) {
      showError("Lỗi", err.message || "Không thể tải dispute.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="stj-fullpage stj-fullpage--loading">
        <Loader2 size={32} className="stj-spin" />
        <p>Đang tải dispute...</p>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="stj-fullpage">
        <div className="stj-handover-empty">
          <XCircle size={32} />
          <div>
            <strong>Không tìm thấy dispute</strong>
            <p>Dispute này có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleString("vi-VN");

  return (
    <div className="stj-fullpage">
      {/* Header */}
      <header className="stj-fullpage__header">
        <div className="stj-fullpage__header-left">
          <button className="stj-fullpage__back" onClick={() => navigate(-1)} title="Quay lại">
            <ArrowLeft size={18} />
          </button>
          <div className="stj-fullpage__job-info">
            <strong>Dispute #{dispute.id}</strong>
            <span
              className="stj-fullpage__status-badge"
              style={{
                backgroundColor:
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
                borderColor:
                  dispute.status === "RESOLVED"
                    ? "rgba(74, 222, 128, 0.3)"
                    : dispute.status === "DISMISSED"
                    ? "rgba(148, 163, 184, 0.3)"
                    : "rgba(251, 113, 133, 0.3)",
              }}
            >
              {shortTermJobService.getDisputeStatusText(dispute.status)}
            </span>
          </div>
        </div>
      </header>

      {/* Dispute Details */}
      <div className="stj-fullpage__overview">
        <div className="stj-fullpage__overview-grid">
          {/* Dispute Info Card */}
          <div className="stj-fullpage__detail-card">
            <h3>Thông tin Dispute</h3>
            <div className="stj-fullpage__info-list">
              <div className="stj-fullpage__info-row">
                <span>Loại dispute</span>
                <strong>{shortTermJobService.getDisputeTypeText(dispute.disputeType)}</strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>Người mở</span>
                <strong>{dispute.initiatorName}</strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>Bị dispute</span>
                <strong>{dispute.respondentName}</strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>Công việc</span>
                <strong>{dispute.jobTitle || `#${dispute.jobId}`}</strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>Mở lúc</span>
                <strong>{formatTime(dispute.createdAt)}</strong>
              </div>
              {dispute.resolvedAt && (
                <div className="stj-fullpage__info-row">
                  <span>Giải quyết lúc</span>
                  <strong>{formatTime(dispute.resolvedAt)}</strong>
                </div>
              )}
            </div>
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "rgba(8, 15, 30, 0.45)",
                border: "1px solid rgba(148, 163, 184, 0.08)",
              }}
            >
              <p style={{ margin: "0 0 0.35rem", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Lý do
              </p>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.6 }}>
                {dispute.reason}
              </p>
            </div>
          </div>

          {/* Resolution Card */}
          {dispute.status === "RESOLVED" && (
            <div className="stj-fullpage__detail-card">
              <h3>Kết quả giải quyết</h3>
              <div className="stj-fullpage__info-list">
                <div className="stj-fullpage__info-row">
                  <span>Phương án</span>
                  <strong style={{ color: "#4ade80" }}>{dispute.resolution}</strong>
                </div>
                {dispute.partialRefundPct !== undefined && (
                  <div className="stj-fullpage__info-row">
                    <span>Tỷ lệ hoàn</span>
                    <strong>{dispute.partialRefundPct}%</strong>
                  </div>
                )}
              </div>
              {dispute.resolutionNotes && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: "rgba(74, 222, 128, 0.08)",
                    border: "1px solid rgba(74, 222, 128, 0.2)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "#94a3b8", lineHeight: 1.6 }}>
                    {dispute.resolutionNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evidence Section */}
        {dispute.evidence && dispute.evidence.length > 0 && (
          <div className="stj-fullpage__detail-card">
            <h3>Bằng chứng ({dispute.evidence.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
              {dispute.evidence.map((ev: any) => (
                <div
                  key={ev.id}
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "12px",
                    background: "rgba(8, 15, 30, 0.45)",
                    border: ev.isOfficial
                      ? "1px solid rgba(251, 191, 36, 0.2)"
                      : "1px solid rgba(148, 163, 184, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {ev.evidenceType === "TEXT" && <FileText size={14} style={{ color: "#94a3b8" }} />}
                      {ev.evidenceType === "FILE" && <Upload size={14} style={{ color: "#94a3b8" }} />}
                      {ev.evidenceType === "LINK" && <LinkIcon size={14} style={{ color: "#94a3b8" }} />}
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e0f2fe" }}>
                        {ev.submittedByName}
                      </span>
                      {ev.isOfficial && (
                        <span
                          style={{
                            padding: "0.1rem 0.4rem",
                            borderRadius: "999px",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            background: "rgba(251, 191, 36, 0.15)",
                            color: "#fbbf24",
                          }}
                        >
                          Admin
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{formatTime(ev.createdAt)}</span>
                  </div>
                  {ev.content && (
                    <p style={{ margin: "0 0 0.35rem", fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.6 }}>
                      {ev.content}
                    </p>
                  )}
                  {ev.fileUrl && (
                    <a
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.82rem", color: "#67e8f9", textDecoration: "none" }}
                    >
                      <LinkIcon size={11} /> {ev.fileName || "Tệp đính kèm"}
                    </a>
                  )}

                  {/* Responses */}
                  {ev.responses && ev.responses.length > 0 && (
                    <div
                      style={{
                        marginTop: "0.6rem",
                        paddingLeft: "0.75rem",
                        borderLeft: "2px solid rgba(148, 163, 184, 0.12)",
                      }}
                    >
                      {ev.responses.map((resp: any) => (
                        <div key={resp.id} style={{ marginBottom: "0.4rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <MessageSquare size={11} style={{ color: "#64748b" }} />
                            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8" }}>
                              {resp.respondedByName}
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                              {formatTime(resp.createdAt)}
                            </span>
                          </div>
                          <p style={{ margin: "0.1rem 0 0 1.2rem", fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                            {resp.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputePage;
