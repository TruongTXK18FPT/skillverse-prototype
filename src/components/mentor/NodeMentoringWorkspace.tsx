/**
 * [Nghiệp vụ] Không gian làm việc Mentor - Đánh giá Node.
 *
 * Tính năng:
 * - Xem và đánh giá bằng chứng từ học viên
 * - Xác minh hoàn thành node
 *
 * Mirror pattern từ MentorVerificationAdminTab + MentorGradingDashboard.
 * Phong cách: Cyan Blue Neon Tech.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
  FileText,
  AlertCircle,
  BookOpen,
  Target,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { BookingResponse } from "../../services/bookingService";
import { NodeEvidenceRecordResponse } from "../../types/NodeMentoring";
import { getNodeEvidence } from "../../services/nodeMentoringService";
import MentorNodeReviewPanel from "./MentorNodeReviewPanel";
import MentorNodeVerifyPanel from "./MentorNodeVerifyPanel";
import "./NodeMentoringWorkspace.css";

interface NodeMentoringWorkspaceProps {
  /** Lịch hẹn hiện tại có ngữ cảnh node/journey */
  booking: BookingResponse;
  /** Callback sau khi đánh giá/xác minh thành công */
  onActionComplete?: () => void;
}

const NodeMentoringWorkspace: React.FC<NodeMentoringWorkspaceProps> = ({
  booking,
  onActionComplete,
}) => {
  const { showError } = useToast();
  // Chỉ còn một tab duy nhất - Đánh giá Node

  // Trạng thái Đánh giá Node
  const [evidence, setEvidence] = useState<NodeEvidenceRecordResponse | null>(
    null,
  );
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const hasNodeContext = booking.nodeId && booking.journeyId;

  const loadEvidence = useCallback(async () => {
    if (!hasNodeContext) return;
    try {
      setReviewLoading(true);
      const data = await getNodeEvidence(booking.journeyId!, booking.nodeId!);
      setEvidence(data);
    } catch (err: any) {
      showError(
        "Lỗi tải dữ liệu",
        err.response?.data?.message || "Không thể tải bằng chứng",
      );
    } finally {
      setReviewLoading(false);
    }
  }, [booking.journeyId, booking.nodeId, hasNodeContext, showError]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <span className="nmw-badge nmw-badge-pending">
            <Clock size={14} /> Chờ đánh giá
          </span>
        );
      case "REWORK_REQUESTED":
        return (
          <span className="nmw-badge nmw-badge-rework">
            <AlertCircle size={14} /> Cần làm lại
          </span>
        );
      case "RESUBMITTED":
        return (
          <span className="nmw-badge nmw-badge-pending">
            <Clock size={14} /> Đã nộp lại
          </span>
        );
      case "VERIFIED":
        return (
          <span className="nmw-badge nmw-badge-verified">
            <CheckCircle size={14} /> Đã xác minh
          </span>
        );
      case "REJECTED":
        return (
          <span className="nmw-badge nmw-badge-rejected">
            <XCircle size={14} /> Từ chối
          </span>
        );
      default:
        return <span className="nmw-badge nmw-badge-draft">{status}</span>;
    }
  };

  const canReview = Boolean(
    evidence &&
    evidence.learnerMarkedComplete &&
    !evidence.latestVerification &&
    evidence.verificationStatus !== "VERIFIED" &&
    ["SUBMITTED", "RESUBMITTED"].includes(evidence.submissionStatus),
  );
  const canVerify = Boolean(
    evidence?.learnerMarkedComplete &&
    evidence.latestReview?.reviewResult === "APPROVED" &&
    !evidence.latestVerification,
  );

  return (
    <div className="nmw-container">
      {/* Tiêu đề */}
      <div className="nmw-header">
        <h2 className="nmw-title">
          <ClipboardCheck size={24} />
          <span className="nmw-title-text">Trung tâm Mentor Node</span>
          <span className="nmw-title-glow" />
        </h2>
        {hasNodeContext && (
          <div className="nmw-context">
            <span className="nmw-context-item">
              <BookOpen size={14} /> Hành trình #{booking.journeyId}
            </span>
            <span className="nmw-context-item">
              <Target size={14} /> Node: {booking.nodeId}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="nmw-tabs">
        <button className={`nmw-tab active`} disabled={!hasNodeContext}>
          <Eye size={16} /> Đánh giá Node
        </button>
      </div>

      {/* Nội dung */}
      <div className="nmw-content">
        <div className="nmw-review-section">
          {!hasNodeContext ? (
            <div className="nmw-empty">
              <AlertCircle size={48} />
              <p>Lịch hẹn này không có ngữ cảnh Node Mentoring.</p>
            </div>
          ) : reviewLoading ? (
            <div className="nmw-loading">
              <div className="nmw-loader" />
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : !evidence ? (
            <div className="nmw-empty">
              <FileText size={48} />
              <p>Học viên chưa nộp bằng chứng cho node này.</p>
            </div>
          ) : (
            <div className="nmw-evidence-card">
              <div className="nmw-evidence-header">
                <div className="nmw-evidence-meta">
                  <span className="nmw-evidence-label">Trạng thái:</span>
                  {getStatusBadge(evidence.submissionStatus)}
                </div>
                <span className="nmw-evidence-date">
                  Nộp lúc:{" "}
                  {new Date(evidence.submittedAt).toLocaleString("vi-VN")}
                </span>
              </div>

              <div className="nmw-evidence-body">
                <div className="nmw-evidence-field">
                  <label>Nội dung bài nộp:</label>
                  <div className="nmw-evidence-text">
                    {evidence.submissionText}
                  </div>
                </div>

                {evidence.evidenceUrl && (
                  <div className="nmw-evidence-field">
                    <label>Liên kết bằng chứng:</label>
                    <a
                      href={evidence.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nmw-link"
                    >
                      <ExternalLink size={14} /> Xem bằng chứng
                    </a>
                  </div>
                )}

                {evidence.attachmentUrl && (
                  <div className="nmw-evidence-field">
                    <label>Tệp đính kèm:</label>
                    <a
                      href={evidence.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nmw-link"
                    >
                      <FileText size={14} /> Tải tệp đính kèm
                    </a>
                  </div>
                )}

                {evidence.mentorFeedback && (
                  <div className="nmw-evidence-field">
                    <label>Nhận xét trước đó:</label>
                    <div className="nmw-evidence-feedback">
                      {evidence.mentorFeedback}
                    </div>
                  </div>
                )}
              </div>

              <div className="nmw-evidence-actions">
                {evidence && !evidence.learnerMarkedComplete && (
                  <div className="nmw-verification-info nmw-verification-info--warn">
                    <AlertCircle size={16} />
                    Học viên chưa đánh dấu hoàn thành node, mentor chưa thể đánh
                    giá.
                  </div>
                )}
                {canReview && (
                  <button
                    className="nmw-btn nmw-btn-primary"
                    onClick={() => setShowReviewModal(true)}
                    disabled={reviewLoading}
                  >
                    <ClipboardCheck size={16} /> Đánh giá bài nộp
                  </button>
                )}
                {canVerify && (
                  <button
                    className="nmw-btn nmw-btn-verify"
                    onClick={() => setShowVerifyModal(true)}
                    disabled={reviewLoading}
                  >
                    <ShieldCheck size={16} /> Xác minh Node
                  </button>
                )}
                {evidence.latestVerification && (
                  <div className="nmw-verification-info">
                    <CheckCircle size={16} className="verified" />
                    Node đã được{" "}
                    {evidence.latestVerification.nodeVerificationStatus ===
                    "VERIFIED"
                      ? "xác minh"
                      : "từ chối"}
                    {evidence.latestVerification.verificationNote && (
                      <span className="nmw-note">
                        {" "}
                        - {evidence.latestVerification.verificationNote}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Đánh giá */}
      {showReviewModal && evidence && booking.journeyId && booking.nodeId && (
        <div
          className="nmw-modal-overlay"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="nmw-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 0, width: "600px" }}
          >
            <MentorNodeReviewPanel
              journeyId={booking.journeyId}
              nodeId={booking.nodeId}
              evidence={evidence}
              bookingId={booking.id}
              onReviewSubmitted={() => {
                setShowReviewModal(false);
                loadEvidence();
                onActionComplete?.();
              }}
              onCancel={() => setShowReviewModal(false)}
            />
          </div>
        </div>
      )}

      {/* Modal Xác minh */}
      {showVerifyModal && evidence && booking.journeyId && booking.nodeId && (
        <div
          className="nmw-modal-overlay"
          onClick={() => setShowVerifyModal(false)}
        >
          <div
            className="nmw-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 0, width: "500px" }}
          >
            <MentorNodeVerifyPanel
              journeyId={booking.journeyId}
              nodeId={booking.nodeId}
              evidence={evidence}
              bookingId={booking.id}
              onVerified={() => {
                setShowVerifyModal(false);
                loadEvidence();
                onActionComplete?.();
              }}
              onCancel={() => setShowVerifyModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Component hỗ trợ icon liên kết ngoài
const ExternalLink: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export default NodeMentoringWorkspace;
