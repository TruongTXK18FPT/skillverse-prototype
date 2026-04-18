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
            <div className="stj-fullpage__reason-block">
              <p className="stj-fullpage__reason-label">Lý do</p>
              <p className="stj-fullpage__reason-content">{dispute.reason}</p>
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
                <div className="stj-fullpage__resolution-notes">
                  <p>{dispute.resolutionNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evidence Section */}
        {dispute.evidence && dispute.evidence.length > 0 && (
          <div className="stj-fullpage__detail-card">
            <h3>Bằng chứng ({dispute.evidence.length})</h3>
            <div className="stj-fullpage__evidence-list">
              {dispute.evidence.map((ev: any) => (
                <div
                  key={ev.id}
                  className={`stj-fullpage__evidence-card ${ev.isOfficial ? "is-official" : ""}`}
                >
                  <div className="stj-fullpage__evidence-header">
                    <div className="stj-fullpage__evidence-author">
                      {ev.evidenceType === "TEXT" && <FileText size={14} />}
                      {ev.evidenceType === "FILE" && <Upload size={14} />}
                      {ev.evidenceType === "LINK" && <LinkIcon size={14} />}
                      <span>{ev.submittedByName}</span>
                      {ev.isOfficial && (
                        <span className="stj-fullpage__admin-badge">Admin</span>
                      )}
                    </div>
                    <span className="stj-fullpage__evidence-time">{formatTime(ev.createdAt)}</span>
                  </div>
                  {ev.content && (
                    <p className="stj-fullpage__evidence-content">{ev.content}</p>
                  )}
                  {ev.fileUrl && (
                    <a
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="stj-fullpage__evidence-file"
                    >
                      <LinkIcon size={11} /> {ev.fileName || "Tệp đính kèm"}
                    </a>
                  )}

                  {/* Responses */}
                  {ev.responses && ev.responses.length > 0 && (
                    <div className="stj-fullpage__evidence-responses">
                      {ev.responses.map((resp: any) => (
                        <div key={resp.id} className="stj-fullpage__evidence-response">
                          <div className="stj-fullpage__evidence-response-header">
                            <MessageSquare size={11} />
                            <span>{resp.respondedByName}</span>
                            <span>{formatTime(resp.createdAt)}</span>
                          </div>
                          <p className="stj-fullpage__evidence-response-content">{resp.content}</p>
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
