/**
 * MentorGateOverviewPanel — Tổng quan tab "Gate & Xác nhận" cho mentor.
 *
 * Hiển thị 3 vùng chính:
 *  1. Gate Status — `getCompletionGate(journeyId)`.
 *  2. Final Output Submission — `getLatestOutputAssessment(journeyId)`.
 *  3. Node Verification Summary — bảng tóm tắt từ `nodeStatusMap` truyền từ parent.
 *
 * Trước đây tab này dùng `NodeMentoringWorkspace` cần `booking.nodeId`, nhưng
 * booking ROADMAP_MENTORING có `nodeId = null` → tab trống. Component này thay
 * thế để mentor luôn có context tổng quan + bài nộp Final Assessment.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Link as LinkIcon,
  AlertCircle,
  Target,
  FileCheck2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "../../hooks/useToast";
import {
  getCompletionGate,
  getLatestOutputAssessment,
} from "../../services/nodeMentoringService";
import {
  getForceDownloadUrl,
  getFileExtFromUrl,
} from "../../services/fileUploadService";
import type {
  JourneyCompletionGateResponse,
  JourneyOutputAssessmentResponse,
} from "../../types/NodeMentoring";
import "./MentorGateOverviewPanel.css";

export interface MentorGateNodeStatus {
  selfCompleted?: boolean;
  verified?: "VERIFIED" | "REJECTED" | "NONE" | string;
  submitted?: boolean;
  hasMentorCoverage?: boolean;
}

interface Props {
  journeyId: number;
  finalNodeId?: string | null;
  nodes?: any[];
  nodeStatusMap?: Record<string, MentorGateNodeStatus>;
  learnerName?: string;
  /** Khi mentor bấm nút "Chấm PASS". Điều hướng tới tab Assessment — khi APPROVE assessment, backend sẽ tự động tạo PASS completion report. */
  onJumpToAssessment?: () => void;
  /** Khi mentor click 1 node để xem chi tiết ở sidebar. */
  onSelectNode?: (nodeId: string) => void;
  /** Bump để force refresh khi parent thay đổi (vd. sau khi mentor APPROVE). */
  refreshKey?: number;
}

const formatDateTime = (iso?: string): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return iso;
  }
};

const MentorGateOverviewPanel: React.FC<Props> = ({
  journeyId,
  finalNodeId,
  nodes = [],
  nodeStatusMap = {},
  learnerName,
  onJumpToAssessment,
  onSelectNode,
  refreshKey,
}) => {
  const { showError } = useToast();

  const [gate, setGate] = useState<JourneyCompletionGateResponse | null>(null);
  const [assessment, setAssessment] =
    useState<JourneyOutputAssessmentResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    if (!journeyId) return;
    setLoading(true);
    try {
      const [gateRes, asmRes] = await Promise.allSettled([
        getCompletionGate(journeyId),
        getLatestOutputAssessment(journeyId),
      ]);
      if (gateRes.status === "fulfilled") setGate(gateRes.value);
      else setGate(null);
      if (asmRes.status === "fulfilled") setAssessment(asmRes.value);
      else setAssessment(null);
    } catch (e: any) {
      showError(
        "Lỗi",
        e?.response?.data?.message || "Không thể tải dữ liệu Gate.",
      );
    } finally {
      setLoading(false);
    }
  }, [journeyId, showError]);

  useEffect(() => {
    loadAll();
  }, [loadAll, refreshKey]);

  // ─── Render: Gate status ────────────────────────────────────────────────
  const renderGateStatus = () => {
    if (!gate) {
      return (
        <div className="mgop-empty">
          <ShieldQuestion size={28} />
          <p>Chưa có dữ liệu gate.</p>
        </div>
      );
    }

    const statusBadge = (() => {
      switch (gate.finalGateStatus) {
        case "PASSED":
          return (
            <span className="mgop-badge mgop-badge--pass">
              <CheckCircle2 size={14} /> PASSED
            </span>
          );
        case "BLOCKED":
          return (
            <span className="mgop-badge mgop-badge--block">
              <ShieldAlert size={14} /> BLOCKED
            </span>
          );
        case "NOT_REQUIRED":
        default:
          return (
            <span className="mgop-badge mgop-badge--neutral">
              <ShieldQuestion size={14} /> NOT REQUIRED
            </span>
          );
      }
    })();

    const translateReason = (r: string) => {
      if (r.includes("The journey output assessment must be APPROVED"))
        return "Bài Final Assessment phải được đánh giá Đạt (APPROVED)";
      if (r.includes("A PASS completion report is required"))
        return "Cần có Completion Report đánh giá PASS";
      if (r.includes("The final verification node must be VERIFIED"))
        return "Node cuối cùng phải được Xác thực (VERIFIED)";
      if (r.includes("Final node is not verified"))
        return "Node cuối cùng chưa được xác thực";
      if (r.includes("Output assessment is not approved"))
        return "Bài Final Assessment chưa được duyệt";
      if (r.includes("Missing PASS completion report"))
        return "Thiếu Completion Report đánh giá PASS";
      return r;
    };

    return (
      <div className="mgop-card">
        <div className="mgop-card-head">
          <div className="mgop-card-title">
            <ShieldCheck size={18} /> Trạng thái Gate
          </div>
          {statusBadge}
        </div>

        <div className="mgop-flag-grid">
          <div className="mgop-flag">
            <span className="mgop-flag-label">Yêu cầu xác thực Final Node</span>
            <span
              className={`mgop-flag-value ${gate.finalVerificationRequired ? "ok" : "off"}`}
            >
              {gate.finalVerificationRequired ? "Có" : "Không"}
            </span>
          </div>
          <div className="mgop-flag">
            <span className="mgop-flag-label">
              Yêu cầu đánh giá Final Assessment
            </span>
            <span
              className={`mgop-flag-value ${gate.journeyOutputVerificationRequired ? "ok" : "off"}`}
            >
              {gate.journeyOutputVerificationRequired ? "Có" : "Không"}
            </span>
          </div>
          <div className="mgop-flag">
            <span className="mgop-flag-label">Report hoàn thành (PASS)</span>
            <span
              className={`mgop-flag-value ${gate.hasPassCompletionReport ? "ok" : "warn"}`}
            >
              {gate.hasPassCompletionReport ? "Đã có" : "Chưa có"}
            </span>
          </div>
          <div className="mgop-flag">
            <span className="mgop-flag-label">Final Assessment đã duyệt</span>
            <span
              className={`mgop-flag-value ${gate.outputAssessmentApproved ? "ok" : "warn"}`}
            >
              {gate.outputAssessmentApproved ? "Đã duyệt" : "Chưa duyệt"}
            </span>
          </div>
        </div>

        {gate.blockingReasons && gate.blockingReasons.length > 0 && (
          <div className="mgop-blocking">
            <div className="mgop-blocking-title">
              <AlertCircle size={14} /> Điều kiện còn thiếu
            </div>
            <ul>
              {gate.blockingReasons.map((r, i) => (
                <li key={i}>{translateReason(r)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // ─── Render: Submission card ─────────────────────────────────────────────
  const renderSubmission = () => {
    return (
      <div className="mgop-card">
        <div className="mgop-card-head">
          <div className="mgop-card-title">
            <ClipboardList size={18} /> Bài nộp Final Assessment của học viên
            {learnerName && (
              <span className="mgop-subtle"> · {learnerName}</span>
            )}
          </div>
          {assessment && (
            <span
              className={`mgop-badge mgop-badge--${
                assessment.assessmentStatus === "APPROVED"
                  ? "pass"
                  : assessment.assessmentStatus === "REJECTED"
                    ? "block"
                    : "pending"
              }`}
            >
              {assessment.assessmentStatus === "APPROVED" && (
                <CheckCircle2 size={14} />
              )}
              {assessment.assessmentStatus === "REJECTED" && (
                <XCircle size={14} />
              )}
              {assessment.assessmentStatus === "PENDING" && <Clock size={14} />}
              {assessment.assessmentStatus}
            </span>
          )}
        </div>

        {!assessment ? (
          <div className="mgop-empty">
            <Clock size={28} />
            <p>Học viên chưa nộp Final Assessment.</p>
          </div>
        ) : (
          <>
            <div className="mgop-meta-row">
              <span>Nộp lúc: {formatDateTime(assessment.submittedAt)}</span>
              {assessment.assessedAt && (
                <span>· Đã chấm: {formatDateTime(assessment.assessedAt)}</span>
              )}
              {assessment.score != null && (
                <span>
                  · Điểm: <strong>{assessment.score}/100</strong>
                </span>
              )}
            </div>

            <div className="mgop-section-label">Nội dung</div>
            <div className="mgop-content">
              {assessment.submissionText ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {assessment.submissionText}
                </ReactMarkdown>
              ) : (
                <span className="mgop-subtle">(Không có nội dung)</span>
              )}
            </div>

            {(assessment.evidenceUrl || assessment.attachmentUrl) && (
              <div className="mgop-links">
                {assessment.evidenceUrl && (
                  <a
                    href={assessment.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mgop-link"
                  >
                    <LinkIcon size={14} /> Mở evidence
                  </a>
                )}
                {assessment.attachmentUrl && (
                  <a
                    href={getForceDownloadUrl(assessment.attachmentUrl)}
                    download
                    rel="noreferrer"
                    className="mgop-link"
                  >
                    <FileText size={14} /> Tải file (
                    {getFileExtFromUrl(assessment.attachmentUrl)})
                  </a>
                )}
              </div>
            )}

            {assessment.feedback && (
              <>
                <div className="mgop-section-label">Feedback đã gửi</div>
                <div className="mgop-content mgop-content--feedback">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {assessment.feedback}
                  </ReactMarkdown>
                </div>
              </>
            )}

            {onJumpToAssessment && (
              <button
                type="button"
                className="mgop-action-btn"
                onClick={onJumpToAssessment}
                title="Chấm Final Assessment — khi APPROVE, hệ thống sẽ tự xác nhận hoàn thành lộ trình (PASS)."
              >
                <FileCheck2 size={14} /> Chấm PASS / FAIL ở tab Assessment
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  // ─── Render: Node verification summary ───────────────────────────────────
  const renderNodeSummary = () => {
    if (!nodes.length) return null;
    return (
      <div className="mgop-card">
        <div className="mgop-card-head">
          <div className="mgop-card-title">
            <Target size={18} /> Tóm tắt Node ({nodes.length})
          </div>
        </div>
        <div className="mgop-node-list">
          {nodes.map((n: any, i: number) => {
            const status = nodeStatusMap[n.id] || {};
            const isFinal = finalNodeId && n.id === finalNodeId;
            let badge: React.ReactNode;
            if (status.verified === "VERIFIED") {
              badge = (
                <span className="mgop-badge mgop-badge--pass mgop-badge--sm">
                  <CheckCircle2 size={12} /> Verified
                </span>
              );
            } else if (status.verified === "REJECTED") {
              badge = (
                <span className="mgop-badge mgop-badge--block mgop-badge--sm">
                  <XCircle size={12} /> Rejected
                </span>
              );
            } else if (status.submitted) {
              badge = (
                <span className="mgop-badge mgop-badge--pending mgop-badge--sm">
                  <Clock size={12} /> Đã nộp
                </span>
              );
            } else {
              badge = (
                <span className="mgop-badge mgop-badge--neutral mgop-badge--sm">
                  Chưa nộp
                </span>
              );
            }
            return (
              <button
                key={n.id}
                type="button"
                className={`mgop-node-row ${isFinal ? "mgop-node-row--final" : ""}`}
                onClick={() => onSelectNode?.(n.id)}
              >
                <span className="mgop-node-idx">{i + 1}</span>
                <span className="mgop-node-title" title={n.title}>
                  {n.title || n.id}
                  {isFinal && <span className="mgop-final-tag">FINAL</span>}
                </span>
                {badge}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mgop-root">
      <div className="mgop-toolbar">
        <div className="mgop-toolbar-title">
          <ShieldCheck size={18} /> Gate & Xác nhận
        </div>
        <button
          type="button"
          className="mgop-refresh-btn"
          onClick={loadAll}
          disabled={loading}
          title="Làm mới"
        >
          <RefreshCw size={14} className={loading ? "mgop-spin" : ""} />{" "}
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {renderGateStatus()}
      {renderSubmission()}
      {renderNodeSummary()}
    </div>
  );
};

export default MentorGateOverviewPanel;
