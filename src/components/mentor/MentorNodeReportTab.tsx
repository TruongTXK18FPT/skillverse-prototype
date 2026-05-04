import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Gauge,
  Link as LinkIcon,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  XCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "../../hooks/useToast";
import {
  getNodeEvidence,
  reviewNodeSubmission,
  verifyNode,
} from "../../services/nodeMentoringService";
import {
  NodeEvidenceRecordResponse,
  NodeFinalVerificationStatus,
  NodeReviewResult,
} from "../../types/NodeMentoring";
import {
  getFileExtFromUrl,
  getForceDownloadUrl,
} from "../../services/fileUploadService";
import MarkdownEditorField from "../shared/MarkdownEditorField";
import "./MentorNodeReportTab.css";

interface MentorNodeReportTabProps {
  journeyId: number;
  nodeId: string;
  nodeTitle?: string;
  learnerName?: string;
  bookingId?: number;
  onReportSubmitted?: () => void;
}

const submissionLabel = (status?: string) => {
  switch (status) {
    case "SUBMITTED":
      return "Đã nộp";
    case "RESUBMITTED":
      return "Đã nộp lại";
    case "REWORK_REQUESTED":
      return "Cần làm lại";
    case "WITHDRAWN":
      return "Đã rút";
    case "DRAFT":
      return "Bản nháp";
    default:
      return status || "Chưa nộp";
  }
};

const reviewLabel = (status?: string) => {
  switch (status) {
    case "APPROVED":
      return "Đạt";
    case "REWORK_REQUESTED":
      return "Cần làm lại";
    case "REJECTED":
      return "Từ chối";
    default:
      return status || "Chưa đánh giá";
  }
};

const verificationLabel = (status?: string) => {
  switch (status) {
    case "VERIFIED":
      return "Đã xác thực";
    case "REJECTED":
      return "Fail node";
    case "APPROVED":
      return "Đã duyệt";
    case "UNDER_REVIEW":
      return "Đang xem xét";
    case "PENDING":
      return "Chờ xác thực";
    default:
      return status || "Chờ xác thực";
  }
};

const resultTone = (status?: string) => {
  if (status === "APPROVED" || status === "VERIFIED") return "success";
  if (status === "REWORK_REQUESTED") return "warning";
  if (status === "REJECTED") return "danger";
  return "neutral";
};

const SCORE_PRESETS: Array<{ value: number; label: string }> = [
  { value: 60, label: "Đủ đạt" },
  { value: 75, label: "Khá" },
  { value: 85, label: "Tốt" },
  { value: 95, label: "Xuất sắc" },
];

const scoreTone = (value?: number) => {
  if (value == null) return "neutral";
  if (value >= 85) return "success";
  if (value >= 70) return "info";
  if (value >= 50) return "warning";
  return "danger";
};

const pickAttachmentIcon = (ext: string) => {
  const e = ext.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(e))
    return FileImage;
  if (["mp4", "mov", "webm", "mkv", "avi"].includes(e)) return FileVideo;
  if (["zip", "rar", "7z", "tar", "gz"].includes(e)) return FileArchive;
  if (["xls", "xlsx", "csv"].includes(e)) return FileSpreadsheet;
  if (
    [
      "js",
      "ts",
      "tsx",
      "jsx",
      "java",
      "py",
      "cpp",
      "c",
      "cs",
      "go",
      "rs",
      "json",
      "xml",
      "yml",
      "yaml",
      "sh",
      "sql",
      "html",
      "css",
    ].includes(e)
  )
    return FileCode;
  return FileText;
};

const formatRelative = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return "";
  const min = Math.round(diff / 60000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} ngày trước`;
  return date.toLocaleDateString("vi-VN");
};

const MentorNodeReportTab: React.FC<MentorNodeReportTabProps> = ({
  journeyId,
  nodeId,
  nodeTitle,
  learnerName,
  bookingId,
  onReportSubmitted,
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState<NodeEvidenceRecordResponse | null>(
    null,
  );

  const [reviewResult, setReviewResult] =
    useState<NodeReviewResult>("APPROVED");
  const [score, setScore] = useState<number | undefined>(undefined);
  const [feedback, setFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [verifyStatus, setVerifyStatus] =
    useState<NodeFinalVerificationStatus>("VERIFIED");
  const [verifyNote, setVerifyNote] = useState("");
  const [submittingVerify, setSubmittingVerify] = useState(false);

  const [submissionExpanded, setSubmissionExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadEvidence = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNodeEvidence(journeyId, nodeId);
      setEvidence(data);
      if (data?.latestReview) {
        setReviewResult(data.latestReview.reviewResult);
        setScore(data.latestReview.score);
        setFeedback(data.latestReview.feedback || "");
      } else {
        setReviewResult("APPROVED");
        setScore(undefined);
        setFeedback("");
      }
      if (data?.latestVerification) {
        setVerifyStatus(data.latestVerification.nodeVerificationStatus);
        setVerifyNote(data.latestVerification.verificationNote || "");
      } else {
        setVerifyStatus("VERIFIED");
        setVerifyNote("");
      }
    } catch (err: any) {
      setEvidence(null);
      if (err.response?.status !== 404) {
        showError(
          "Lỗi",
          err.response?.data?.message || "Không thể tải minh chứng của node",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [journeyId, nodeId, showError]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const state = useMemo(() => {
    const hasSubmitted =
      !!evidence &&
      ["SUBMITTED", "RESUBMITTED"].includes(evidence.submissionStatus);
    const nodeVerified =
      evidence?.latestVerification?.nodeVerificationStatus === "VERIFIED" ||
      evidence?.verificationStatus === "VERIFIED";
    const nodeFailed =
      evidence?.latestVerification?.nodeVerificationStatus === "REJECTED" ||
      evidence?.verificationStatus === "REJECTED";
    const learnerCompleted = evidence?.learnerMarkedComplete === true;
    const hasApprovedReview =
      evidence?.latestReview?.reviewResult === "APPROVED";
    const hasGateDecision = !!evidence?.latestVerification;

    return {
      hasSubmitted,
      learnerCompleted,
      nodeVerified,
      nodeFailed,
      hasApprovedReview,
      hasGateDecision,
      // Mentor can review as soon as learner has submitted evidence
      // No need to wait for learner to separately click "mark complete"
      canReview:
        hasSubmitted && !nodeVerified && !hasGateDecision,
      canVerify:
        hasApprovedReview &&
        !nodeVerified &&
        !hasGateDecision,
    };
  }, [evidence]);

  const handleReview = async () => {
    if (!evidence || !state.canReview) return;
    if (reviewResult !== "APPROVED" && feedback.trim().length < 10) {
      showError(
        "Thiếu phản hồi",
        "Khi yêu cầu làm lại hoặc từ chối, vui lòng ghi rõ lý do để học viên sửa đúng.",
      );
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewNodeSubmission(journeyId, nodeId, {
        reviewResult,
        score,
        feedback: feedback.trim() || undefined,
        bookingId,
      });
      showSuccess("Thành công", "Đã lưu đánh giá minh chứng.");
      await loadEvidence();
      onReportSubmitted?.();
    } catch (err: any) {
      showError(
        "Lỗi",
        err.response?.data?.message || "Không thể lưu đánh giá minh chứng",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleVerify = async () => {
    if (!evidence || !state.canVerify) return;
    if (verifyStatus === "REJECTED" && verifyNote.trim().length < 10) {
      showError(
        "Thiếu ghi chú",
        "Khi fail node, vui lòng ghi rõ yêu cầu nộp lại cho học viên.",
      );
      return;
    }

    try {
      setSubmittingVerify(true);
      await verifyNode(journeyId, nodeId, {
        nodeVerificationStatus: verifyStatus,
        verificationNote: verifyNote.trim() || undefined,
        bookingId,
      });
      showSuccess(
        "Thành công",
        verifyStatus === "VERIFIED"
          ? "Node đã được xác thực."
          : "Node đã được đánh fail và mở lại cho học viên.",
      );
      await loadEvidence();
      onReportSubmitted?.();
    } catch (err: any) {
      showError(
        "Lỗi",
        err.response?.data?.message || "Không thể xác nhận trạng thái node",
      );
    } finally {
      setSubmittingVerify(false);
    }
  };

  if (loading) {
    return (
      <div className="mnrt-loading">
        <Clock size={16} /> Đang tải report node...
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="mnrt-empty">
        <FileText size={34} />
        <p>Học viên chưa nộp minh chứng cho node này.</p>
        <span>Report sẽ sẵn sàng sau khi học viên gửi minh chứng.</span>
      </div>
    );
  }

  const latestReview = evidence.latestReview;
  const latestVerification = evidence.latestVerification;
  const reviewTone = resultTone(latestReview?.reviewResult);
  const gateTone = resultTone(latestVerification?.nodeVerificationStatus);
  const submissionLength = evidence.submissionText?.length ?? 0;
  const isLongSubmission = submissionLength > 800;
  const currentScoreTone = scoreTone(score);
  const handleCopySubmission = async () => {
    if (!evidence.submissionText) return;
    try {
      await navigator.clipboard.writeText(evidence.submissionText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showError("Lỗi", "Không thể sao chép nội dung");
    }
  };
  const attachmentExt = evidence.attachmentUrl
    ? getFileExtFromUrl(evidence.attachmentUrl) || "file"
    : "";
  const AttachmentIcon = attachmentExt
    ? pickAttachmentIcon(attachmentExt)
    : FileText;

  return (
    <div className="mnrt-container">
      <div className="mnrt-hero">
        <div className="mnrt-hero__main">
          <div className="mnrt-hero-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="mnrt-hero-text">
            <h3 className="mnrt-title">Report &amp; Đánh giá node</h3>
            <p className="mnrt-subtitle">
              <span className="mnrt-subtitle__node">{nodeTitle || nodeId}</span>
              {learnerName && (
                <>
                  <span className="mnrt-subtitle__sep">•</span>
                  <span className="mnrt-subtitle__learner">
                    <UserRound size={13} /> {learnerName}
                  </span>
                </>
              )}
              {evidence.submittedAt && (
                <>
                  <span className="mnrt-subtitle__sep">•</span>
                  <span className="mnrt-subtitle__time">
                    <CalendarClock size={13} />
                    {formatRelative(evidence.submittedAt)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <button className="mnrt-refresh-btn" onClick={loadEvidence}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      <div className="mnrt-status-grid">
        <div className="mnrt-status-card">
          <span className="mnrt-status-card__label">Bài nộp</span>
          <strong>{submissionLabel(evidence.submissionStatus)}</strong>
          <small>
            {evidence.submittedAt
              ? new Date(evidence.submittedAt).toLocaleString("vi-VN")
              : "Chưa có thời gian"}
          </small>
        </div>
        <div className="mnrt-status-card">
          <span className="mnrt-status-card__label">Hoàn thành node</span>
          <strong>
            {state.learnerCompleted ? "Đã đánh dấu" : "Chưa đánh dấu"}
          </strong>
          <small>
            {state.learnerCompleted
              ? "Có thể đánh giá nếu đã nộp minh chứng"
              : "Cần học viên đánh dấu hoàn thành"}
          </small>
        </div>
        <div className={`mnrt-status-card mnrt-status-card--${reviewTone}`}>
          <span className="mnrt-status-card__label">Review</span>
          <strong>{reviewLabel(latestReview?.reviewResult)}</strong>
          <small>
            {latestReview?.reviewedAt
              ? new Date(latestReview.reviewedAt).toLocaleString("vi-VN")
              : "Chưa chấm"}
          </small>
        </div>
        <div className={`mnrt-status-card mnrt-status-card--${gateTone}`}>
          <span className="mnrt-status-card__label">Gate</span>
          <strong>
            {verificationLabel(
              latestVerification?.nodeVerificationStatus ||
                evidence.verificationStatus,
            )}
          </strong>
          <small>
            {latestVerification?.verifiedAt
              ? new Date(latestVerification.verifiedAt).toLocaleString("vi-VN")
              : "Chưa xác nhận"}
          </small>
        </div>
      </div>

      <div className="mnrt-layout">
        <section className="mnrt-panel mnrt-panel--submission">
          <div className="mnrt-panel-head">
            <FileText size={16} />
            <div>
              <h4>Minh chứng học viên đã nộp</h4>
              <p>Toàn bộ nội dung bên dưới là bản nộp hiện tại của node.</p>
            </div>
          </div>
          {evidence.submissionText && (
            <div className="mnrt-submission-meta">
              <span className="mnrt-submission-meta__chip">
                <FileText size={12} />{" "}
                {submissionLength.toLocaleString("vi-VN")} ký tự
              </span>
              <button
                type="button"
                className="mnrt-submission-meta__btn"
                onClick={handleCopySubmission}
              >
                <Copy size={12} /> {copied ? "Đã sao chép" : "Sao chép"}
              </button>
            </div>
          )}
          <div
            className={`mnrt-submission-content ${
              isLongSubmission && !submissionExpanded
                ? "mnrt-submission-content--clamped"
                : ""
            }`}
          >
            {evidence.submissionText ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {evidence.submissionText}
              </ReactMarkdown>
            ) : (
              <span className="mnrt-empty-text">
                Không có nội dung văn bản.
              </span>
            )}
          </div>
          {isLongSubmission && (
            <button
              type="button"
              className="mnrt-submission-expand"
              onClick={() => setSubmissionExpanded((v) => !v)}
            >
              {submissionExpanded ? (
                <>
                  <ChevronUp size={14} /> Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> Xem toàn bộ bài nộp
                </>
              )}
            </button>
          )}
          {(evidence.evidenceUrl || evidence.attachmentUrl) && (
            <div className="mnrt-attachment-list">
              {evidence.evidenceUrl && (
                <a
                  className="mnrt-attachment"
                  href={evidence.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="mnrt-attachment__icon">
                    <LinkIcon size={16} />
                  </span>
                  <span className="mnrt-attachment__body">
                    <strong>Link minh chứng</strong>
                    <small>{evidence.evidenceUrl}</small>
                  </span>
                </a>
              )}
              {evidence.attachmentUrl && (
                <a
                  className="mnrt-attachment"
                  href={getForceDownloadUrl(evidence.attachmentUrl)}
                  download
                  rel="noreferrer"
                >
                  <span className="mnrt-attachment__icon mnrt-attachment__icon--file">
                    <AttachmentIcon size={16} />
                  </span>
                  <span className="mnrt-attachment__body">
                    <strong>File đính kèm</strong>
                    <small>
                      Định dạng .{attachmentExt.toLowerCase()} • nhấn để tải về
                    </small>
                  </span>
                  <Download size={14} />
                </a>
              )}
            </div>
          )}
        </section>

        <aside className="mnrt-panel mnrt-panel--actions">
          <div className="mnrt-panel-head">
            <Award size={16} />
            <div>
              <h4>Đánh giá minh chứng</h4>
              <p>Chấm bài trực tiếp trong report, không mở modal.</p>
            </div>
          </div>

          {!state.canReview && (
            <div className="mnrt-lock-note">
              <AlertTriangle size={15} />
              {state.nodeVerified
                ? "Node đã xác thực nên không thể chấm lại."
                : state.hasGateDecision
                  ? "Gate đã có quyết định. Học viên cần nộp lại nếu node bị fail."
                  : !state.hasSubmitted
                    ? "Chưa có bài nộp hợp lệ để chấm."
                    : "Bài nộp hiện không ở trạng thái có thể chấm."}
            </div>
          )}

          <div className="mnrt-form-group">
            <label className="mnrt-label">Kết quả đánh giá</label>
            <div className="mnrt-decision-group">
              <button
                type="button"
                className={`mnrt-decision-btn mnrt-decision-btn--approve ${
                  reviewResult === "APPROVED" ? "active" : ""
                }`}
                onClick={() => setReviewResult("APPROVED")}
                disabled={!state.canReview}
              >
                <CheckCircle2 size={16} /> Đạt
              </button>
              <button
                type="button"
                className={`mnrt-decision-btn mnrt-decision-btn--warn ${
                  reviewResult === "REWORK_REQUESTED" ? "active" : ""
                }`}
                onClick={() => setReviewResult("REWORK_REQUESTED")}
                disabled={!state.canReview}
              >
                <AlertTriangle size={16} /> Làm lại
              </button>
              <button
                type="button"
                className={`mnrt-decision-btn mnrt-decision-btn--reject ${
                  reviewResult === "REJECTED" ? "active" : ""
                }`}
                onClick={() => setReviewResult("REJECTED")}
                disabled={!state.canReview}
              >
                <XCircle size={16} /> Từ chối
              </button>
            </div>
          </div>

          <div className="mnrt-form-group">
            <label className="mnrt-label">
              <Gauge size={13} /> Điểm số
              {score != null && (
                <span
                  className={`mnrt-score-badge mnrt-score-badge--${currentScoreTone}`}
                >
                  {score}/100
                </span>
              )}
            </label>
            <div className="mnrt-score-row">
              <input
                type="number"
                min={0}
                max={100}
                className="mnrt-input mnrt-input--score"
                value={score ?? ""}
                onChange={(e) =>
                  setScore(e.target.value ? Number(e.target.value) : undefined)
                }
                disabled={!state.canReview}
                placeholder="0-100"
              />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                className="mnrt-score-slider"
                value={score ?? 0}
                onChange={(e) => setScore(Number(e.target.value))}
                disabled={!state.canReview}
              />
            </div>
            <div
              className={`mnrt-score-bar mnrt-score-bar--${currentScoreTone}`}
            >
              <span
                style={{ width: `${Math.max(0, Math.min(100, score ?? 0))}%` }}
              />
            </div>
            <div className="mnrt-score-presets">
              {SCORE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`mnrt-score-preset ${
                    score === p.value ? "mnrt-score-preset--active" : ""
                  }`}
                  onClick={() => setScore(p.value)}
                  disabled={!state.canReview}
                >
                  <Sparkles size={11} /> {p.value} · {p.label}
                </button>
              ))}
            </div>
          </div>

          {state.canReview ? (
            <MarkdownEditorField
              label="Phản hồi cho học viên"
              value={feedback}
              onChange={setFeedback}
              placeholder="Ghi rõ điểm mạnh, phần cần sửa và yêu cầu nộp lại nếu có..."
              rows={5}
              className="mnrt-editor"
            />
          ) : latestReview?.feedback ? (
            <div className="mnrt-readonly-feedback">
              <span>Phản hồi mới nhất</span>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {latestReview.feedback}
              </ReactMarkdown>
            </div>
          ) : null}

          <button
            className="mnrt-submit-btn"
            onClick={handleReview}
            disabled={!state.canReview || submittingReview}
          >
            <Send size={15} />{" "}
            {submittingReview ? "Đang lưu..." : "Lưu đánh giá"}
          </button>
        </aside>
      </div>

      <section className="mnrt-panel mnrt-panel--gate">
        <div className="mnrt-panel-head">
          <BadgeCheck size={16} />
          <div>
            <h4>Quyết định Gate của node</h4>
            <p>Chỉ xác thực gate sau khi bài nộp đã được review đạt.</p>
          </div>
        </div>

        {!state.canVerify && (
          <div className="mnrt-lock-note">
            <AlertTriangle size={15} />
            {state.nodeVerified
              ? "Node đã được xác thực."
              : state.hasGateDecision
                ? "Gate đã có quyết định cho lần nộp hiện tại."
                : !state.hasApprovedReview
                  ? "Cần có review đạt trước khi xác thực gate."
                  : "Chưa đủ điều kiện xác thực gate."}
          </div>
        )}

        <div className="mnrt-gate-grid">
          <div className="mnrt-form-group">
            <label className="mnrt-label">Quyết định</label>
            <div className="mnrt-decision-group">
              <button
                type="button"
                className={`mnrt-decision-btn mnrt-decision-btn--approve ${
                  verifyStatus === "VERIFIED" ? "active" : ""
                }`}
                onClick={() => setVerifyStatus("VERIFIED")}
                disabled={!state.canVerify}
              >
                <CheckCircle2 size={16} /> Xác thực
              </button>
              <button
                type="button"
                className={`mnrt-decision-btn mnrt-decision-btn--reject ${
                  verifyStatus === "REJECTED" ? "active" : ""
                }`}
                onClick={() => setVerifyStatus("REJECTED")}
                disabled={!state.canVerify}
              >
                <XCircle size={16} /> Fail node
              </button>
            </div>
          </div>
          <div className="mnrt-form-group">
            <label className="mnrt-label">Ghi chú gate</label>
            <textarea
              className="mnrt-textarea"
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
              disabled={!state.canVerify}
              placeholder="Ghi chú lý do xác thực hoặc yêu cầu nộp lại..."
              rows={4}
            />
          </div>
        </div>

        <button
          className="mnrt-submit-btn mnrt-submit-btn--verify"
          onClick={handleVerify}
          disabled={!state.canVerify || submittingVerify}
        >
          <ShieldCheck size={15} />{" "}
          {submittingVerify ? "Đang xử lý..." : "Xác nhận Gate"}
        </button>
      </section>

      <section className="mnrt-panel mnrt-panel--timeline">
        <div className="mnrt-panel-head">
          <Target size={16} />
          <div>
            <h4>Lịch sử xử lý</h4>
            <p>Thông tin mentor cần đối chiếu trước khi đóng node.</p>
          </div>
        </div>
        <div className="mnrt-timeline">
          <div className="mnrt-timeline-item">
            <span className="mnrt-timeline-dot" />
            <div>
              <strong>Học viên nộp minh chứng</strong>
              <p>{new Date(evidence.submittedAt).toLocaleString("vi-VN")}</p>
            </div>
          </div>
          {latestReview && (
            <div className="mnrt-timeline-item">
              <span
                className={`mnrt-timeline-dot mnrt-timeline-dot--${reviewTone}`}
              />
              <div>
                <strong>
                  Review: {reviewLabel(latestReview.reviewResult)}
                </strong>
                <p>
                  {latestReview.score != null
                    ? `Điểm ${latestReview.score}/100`
                    : "Không nhập điểm"}
                  {latestReview.reviewedAt
                    ? ` • ${new Date(latestReview.reviewedAt).toLocaleString("vi-VN")}`
                    : ""}
                </p>
              </div>
            </div>
          )}
          {latestVerification && (
            <div className="mnrt-timeline-item">
              <span
                className={`mnrt-timeline-dot mnrt-timeline-dot--${gateTone}`}
              />
              <div>
                <strong>
                  Gate:{" "}
                  {verificationLabel(latestVerification.nodeVerificationStatus)}
                </strong>
                <p>
                  {new Date(latestVerification.verifiedAt).toLocaleString(
                    "vi-VN",
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MentorNodeReportTab;
