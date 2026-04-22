/**
 * [Nghiệp vụ] Workspace cho mentor xử lý node mentoring + final verification.
 *
 * Tính năng:
 * - Tab 1: Node Review - xem và review evidence từ learner
 * - Tab 2: Final Confirmation - xác nhận hoàn thành journey
 *
 * Mirror pattern từ MentorVerificationAdminTab + MentorGradingDashboard.
 */
import React, { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { BookingResponse } from '../../services/bookingService';
import {
  NodeEvidenceRecordResponse,
  NodeReviewResult,
  NodeFinalVerificationStatus,
  JourneyCompletionGateResponse,
} from '../../types/NodeMentoring';
import {
  getNodeEvidence,
  reviewNodeSubmission,
  verifyNode,
  getCompletionGate,
  submitCompletionReport,
} from '../../services/nodeMentoringService';
import JourneyVerificationDossier from '../journey/JourneyVerificationDossier';
import './NodeMentoringWorkspace.css';

type WorkspaceTab = 'NODE_REVIEW' | 'FINAL_CONFIRMATION';

interface NodeMentoringWorkspaceProps {
  /** Booking hiện tại có context node/journey */
  booking: BookingResponse;
  /** Callback sau khi review/verify thành công */
  onActionComplete?: () => void;
}

const NodeMentoringWorkspace: React.FC<NodeMentoringWorkspaceProps> = ({
  booking,
  onActionComplete,
}) => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('NODE_REVIEW');

  // Node Review State
  const [evidence, setEvidence] = useState<NodeEvidenceRecordResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Review Form State
  const [reviewResult, setReviewResult] = useState<NodeReviewResult>('APPROVED');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | undefined>(undefined);

  // Verify Form State
  const [verificationStatus, setVerificationStatus] = useState<NodeFinalVerificationStatus>('VERIFIED');
  const [verificationNote, setVerificationNote] = useState('');

  // Final Gate State
  const [gate, setGate] = useState<JourneyCompletionGateResponse | null>(null);
  const [gateLoading, setGateLoading] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [gateDecision, setGateDecision] = useState<'PASS' | 'FAIL'>('PASS');

  const hasNodeContext = booking.nodeId && booking.journeyId;
  const hasJourneyContext = booking.journeyId;

  const loadEvidence = useCallback(async () => {
    if (!hasNodeContext) return;
    try {
      setReviewLoading(true);
      const data = await getNodeEvidence(booking.journeyId!, booking.nodeId!);
      setEvidence(data);
    } catch (err: any) {
      showError('Lỗi tải dữ liệu', err.response?.data?.message || 'Không thể tải evidence');
    } finally {
      setReviewLoading(false);
    }
  }, [booking.journeyId, booking.nodeId, hasNodeContext, showError]);

  const loadGate = useCallback(async () => {
    if (!hasJourneyContext) return;
    try {
      setGateLoading(true);
      const data = await getCompletionGate(booking.journeyId!);
      setGate(data);
    } catch (err: any) {
      showError('Lỗi tải gate', err.response?.data?.message || 'Không thể tải trạng thái gate');
    } finally {
      setGateLoading(false);
    }
  }, [booking.journeyId, hasJourneyContext, showError]);

  useEffect(() => {
    if (activeTab === 'NODE_REVIEW') {
      loadEvidence();
    } else {
      loadGate();
    }
  }, [activeTab, loadEvidence, loadGate]);

  const handleSubmitReview = async () => {
    if (!hasNodeContext) return;
    try {
      setReviewLoading(true);
      const request = {
        reviewResult,
        feedback: feedback.trim() || undefined,
        score,
        bookingId: booking.id,
      };
      await reviewNodeSubmission(booking.journeyId!, booking.nodeId!, request);
      showSuccess('Thành công', 'Đã gửi review cho learner');
      setShowReviewModal(false);
      resetReviewForm();
      await loadEvidence();
      onActionComplete?.();
    } catch (err: any) {
      showError('Lỗi review', err.response?.data?.message || 'Không thể gửi review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!hasNodeContext) return;
    try {
      setReviewLoading(true);
      const request = {
        nodeVerificationStatus: verificationStatus,
        verificationNote: verificationNote.trim() || undefined,
        bookingId: booking.id,
      };
      await verifyNode(booking.journeyId!, booking.nodeId!, request);
      showSuccess('Thành công', `Node đã được ${verificationStatus === 'VERIFIED' ? 'xác minh' : 'từ chối'}`);
      setShowVerifyModal(false);
      resetVerifyForm();
      await loadEvidence();
      onActionComplete?.();
    } catch (err: any) {
      showError('Lỗi xác minh', err.response?.data?.message || 'Không thể xác minh node');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmitCompletionReport = async () => {
    if (!hasJourneyContext) return;
    try {
      setGateLoading(true);
      const request = {
        gateDecision,
        completionNote: completionNote.trim() || undefined,
        bookingId: booking.id,
      };
      await submitCompletionReport(booking.journeyId!, request);
      showSuccess('Thành công', `Đã ${gateDecision === 'PASS' ? 'xác nhận' : 'từ chối'} hoàn thành journey`);
      setShowCompletionModal(false);
      resetCompletionForm();
      await loadGate();
      onActionComplete?.();
    } catch (err: any) {
      showError('Lỗi xác nhận', err.response?.data?.message || 'Không thể xác nhận hoàn thành');
    } finally {
      setGateLoading(false);
    }
  };

  const resetReviewForm = () => {
    setReviewResult('APPROVED');
    setFeedback('');
    setScore(undefined);
  };

  const resetVerifyForm = () => {
    setVerificationStatus('VERIFIED');
    setVerificationNote('');
  };

  const resetCompletionForm = () => {
    setCompletionNote('');
    setGateDecision('PASS');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="nmw-badge nmw-badge-pending"><Clock size={14} /> Chờ review</span>;
      case 'REWORK_REQUESTED':
        return <span className="nmw-badge nmw-badge-rework"><AlertCircle size={14} /> Cần làm lại</span>;
      case 'RESUBMITTED':
        return <span className="nmw-badge nmw-badge-pending"><Clock size={14} /> Đã nộp lại</span>;
      case 'VERIFIED':
        return <span className="nmw-badge nmw-badge-verified"><CheckCircle size={14} /> Đã xác minh</span>;
      case 'REJECTED':
        return <span className="nmw-badge nmw-badge-rejected"><XCircle size={14} /> Từ chối</span>;
      default:
        return <span className="nmw-badge nmw-badge-draft">{status}</span>;
    }
  };

  const getGateStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <span className="nmw-badge nmw-badge-verified"><CheckCircle size={14} /> Gate PASS</span>;
      case 'BLOCKED':
        return <span className="nmw-badge nmw-badge-rejected"><XCircle size={14} /> Gate BLOCKED</span>;
      case 'NOT_REQUIRED':
        return <span className="nmw-badge nmw-badge-draft">Không yêu cầu</span>;
      default:
        return <span className="nmw-badge nmw-badge-pending"><Clock size={14} /> Chờ xác nhận</span>;
    }
  };

  const canReview = evidence && ['SUBMITTED', 'RESUBMITTED'].includes(evidence.submissionStatus);
  const canVerify = evidence?.latestReview?.reviewResult === 'APPROVED' && !evidence.latestVerification;

  return (
    <div className="nmw-container">
      {/* Header */}
      <div className="nmw-header">
        <h2 className="nmw-title">
          <ClipboardCheck size={24} /> Node Mentoring Workspace
        </h2>
        {hasNodeContext && (
          <div className="nmw-context">
            <span className="nmw-context-item"><BookOpen size={14} /> Journey #{booking.journeyId}</span>
            <span className="nmw-context-item"><Target size={14} /> Node: {booking.nodeId}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="nmw-tabs">
        <button
          className={`nmw-tab ${activeTab === 'NODE_REVIEW' ? 'active' : ''}`}
          onClick={() => setActiveTab('NODE_REVIEW')}
          disabled={!hasNodeContext}
        >
          <Eye size={16} /> Review Node
        </button>
        <button
          className={`nmw-tab ${activeTab === 'FINAL_CONFIRMATION' ? 'active' : ''}`}
          onClick={() => setActiveTab('FINAL_CONFIRMATION')}
          disabled={!hasJourneyContext}
        >
          <ShieldCheck size={16} /> Final Confirmation
        </button>
      </div>

      {/* Tab Content */}
      <div className="nmw-content">
        {activeTab === 'NODE_REVIEW' && (
          <div className="nmw-review-section">
            {!hasNodeContext ? (
              <div className="nmw-empty">
                <AlertCircle size={48} />
                <p>Booking này không có context node mentoring.</p>
              </div>
            ) : reviewLoading ? (
              <div className="nmw-loading">Đang tải...</div>
            ) : !evidence ? (
              <div className="nmw-empty">
                <FileText size={48} />
                <p>Learner chưa nộp evidence cho node này.</p>
              </div>
            ) : (
              <div className="nmw-evidence-card">
                <div className="nmw-evidence-header">
                  <div className="nmw-evidence-meta">
                    <span className="nmw-evidence-label">Trạng thái:</span>
                    {getStatusBadge(evidence.submissionStatus)}
                  </div>
                  <span className="nmw-evidence-date">
                    Nộp lúc: {new Date(evidence.submittedAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="nmw-evidence-body">
                  <div className="nmw-evidence-field">
                    <label>Nội dung submission:</label>
                    <div className="nmw-evidence-text">{evidence.submissionText}</div>
                  </div>

                  {evidence.evidenceUrl && (
                    <div className="nmw-evidence-field">
                      <label>Evidence URL:</label>
                      <a href={evidence.evidenceUrl} target="_blank" rel="noopener noreferrer" className="nmw-link">
                        <ExternalLink size={14} /> Xem evidence
                      </a>
                    </div>
                  )}

                  {evidence.attachmentUrl && (
                    <div className="nmw-evidence-field">
                      <label>Attachment:</label>
                      <a href={evidence.attachmentUrl} target="_blank" rel="noopener noreferrer" className="nmw-link">
                        <FileText size={14} /> Tải attachment
                      </a>
                    </div>
                  )}

                  {evidence.mentorFeedback && (
                    <div className="nmw-evidence-field">
                      <label>Feedback trước đó:</label>
                      <div className="nmw-evidence-feedback">{evidence.mentorFeedback}</div>
                    </div>
                  )}
                </div>

                <div className="nmw-evidence-actions">
                  {canReview && (
                    <button
                      className="nmw-btn nmw-btn-primary"
                      onClick={() => setShowReviewModal(true)}
                      disabled={reviewLoading}
                    >
                      <ClipboardCheck size={16} /> Review Submission
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
                      Node đã được {evidence.latestVerification.nodeVerificationStatus === 'VERIFIED' ? 'xác minh' : 'từ chối'}
                      {evidence.latestVerification.verificationNote && (
                        <span className="nmw-note"> - {evidence.latestVerification.verificationNote}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'FINAL_CONFIRMATION' && (
          <div className="nmw-gate-section">
            {!hasJourneyContext ? (
              <div className="nmw-empty">
                <AlertCircle size={48} />
                <p>Booking này không có context journey.</p>
              </div>
            ) : gateLoading ? (
              <div className="nmw-loading">Đang tải...</div>
            ) : !gate ? (
              <div className="nmw-empty">
                <AlertCircle size={48} />
                <p>Không thể tải trạng thái gate.</p>
              </div>
            ) : (
              <div className="nmw-gate-card">
                <JourneyVerificationDossier
                  journeyId={booking.journeyId!}
                  readonly
                />
                <div className="nmw-gate-header">
                  <h3>Journey Completion Gate</h3>
                  {getGateStatusBadge(gate.finalGateStatus)}
                </div>

                <div className="nmw-gate-checklist">
                  <div className={`nmw-check-item ${gate.hasPassCompletionReport ? 'passed' : ''}`}>
                    {gate.hasPassCompletionReport ? <CheckCircle size={16} /> : <Clock size={16} />}
                    <span>Completion Report từ Mentor</span>
                  </div>
                  <div className={`nmw-check-item ${gate.outputAssessmentApproved ? 'passed' : ''}`}>
                    {gate.outputAssessmentApproved ? <CheckCircle size={16} /> : <Clock size={16} />}
                    <span>Output Assessment đã duyệt</span>
                  </div>
                </div>

                {gate.blockingReasons.length > 0 && (
                  <div className="nmw-blocking-reasons">
                    <h4>Lý do chưa thể hoàn thành:</h4>
                    <ul>
                      {gate.blockingReasons.map((reason, idx) => (
                        <li key={idx}><AlertCircle size={14} /> {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="nmw-gate-actions">
                  {gate.finalGateStatus !== 'PASSED' && (
                    <button
                      className="nmw-btn nmw-btn-primary"
                      onClick={() => setShowCompletionModal(true)}
                      disabled={gateLoading}
                    >
                      <ShieldCheck size={16} /> Xác nhận hoàn thành
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="nmw-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="nmw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nmw-modal-header">
              <h3><ClipboardCheck size={20} /> Review Submission</h3>
              <button className="nmw-modal-close" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            <div className="nmw-modal-body">
              <div className="nmw-form-group">
                <label>Kết quả review:</label>
                <select
                  value={reviewResult}
                  onChange={(e) => setReviewResult(e.target.value as NodeReviewResult)}
                  className="nmw-select"
                >
                  <option value="APPROVED">APPROVED - Chấp nhận</option>
                  <option value="REWORK_REQUESTED">REWORK_REQUESTED - Cần làm lại</option>
                  <option value="REJECTED">REJECTED - Từ chối</option>
                </select>
              </div>
              <div className="nmw-form-group">
                <label>Điểm (tùy chọn):</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score || ''}
                  onChange={(e) => setScore(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="nmw-input"
                  placeholder="Nhập điểm (0-100)"
                />
              </div>
              <div className="nmw-form-group">
                <label>Feedback:</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="nmw-textarea"
                  rows={4}
                  placeholder="Nhập feedback cho learner..."
                />
              </div>
            </div>
            <div className="nmw-modal-footer">
              <button className="nmw-btn nmw-btn-secondary" onClick={() => setShowReviewModal(false)}>
                Hủy
              </button>
              <button
                className="nmw-btn nmw-btn-primary"
                onClick={handleSubmitReview}
                disabled={reviewLoading}
              >
                {reviewLoading ? 'Đang gửi...' : 'Gửi Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="nmw-modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="nmw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nmw-modal-header">
              <h3><ShieldCheck size={20} /> Xác minh Node</h3>
              <button className="nmw-modal-close" onClick={() => setShowVerifyModal(false)}>×</button>
            </div>
            <div className="nmw-modal-body">
              <div className="nmw-form-group">
                <label>Quyết định xác minh:</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as NodeFinalVerificationStatus)}
                  className="nmw-select"
                >
                  <option value="VERIFIED">VERIFIED - Xác minh thành công</option>
                  <option value="REJECTED">REJECTED - Từ chối xác minh</option>
                </select>
              </div>
              <div className="nmw-form-group">
                <label>Ghi chú xác minh:</label>
                <textarea
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  className="nmw-textarea"
                  rows={3}
                  placeholder="Nhập ghi chú xác minh (tùy chọn)..."
                />
              </div>
            </div>
            <div className="nmw-modal-footer">
              <button className="nmw-btn nmw-btn-secondary" onClick={() => setShowVerifyModal(false)}>
                Hủy
              </button>
              <button
                className="nmw-btn nmw-btn-verify"
                onClick={handleSubmitVerification}
                disabled={reviewLoading}
              >
                {reviewLoading ? 'Đang xử lý...' : 'Xác minh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="nmw-modal-overlay" onClick={() => setShowCompletionModal(false)}>
          <div className="nmw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nmw-modal-header">
              <h3><ShieldCheck size={20} /> Xác nhận hoàn thành Journey</h3>
              <button className="nmw-modal-close" onClick={() => setShowCompletionModal(false)}>×</button>
            </div>
            <div className="nmw-modal-body">
              <div className="nmw-form-group">
                <label>Quyết định:</label>
                <select
                  value={gateDecision}
                  onChange={(e) => setGateDecision(e.target.value as 'PASS' | 'FAIL')}
                  className="nmw-select"
                >
                  <option value="PASS">PASS - Cho phép hoàn thành</option>
                  <option value="FAIL">FAIL - Từ chối hoàn thành</option>
                </select>
              </div>
              <div className="nmw-form-group">
                <label>Ghi chú hoàn thành:</label>
                <textarea
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  className="nmw-textarea"
                  rows={4}
                  placeholder="Nhập ghi chú về quyết định hoàn thành..."
                />
              </div>
            </div>
            <div className="nmw-modal-footer">
              <button className="nmw-btn nmw-btn-secondary" onClick={() => setShowCompletionModal(false)}>
                Hủy
              </button>
              <button
                className="nmw-btn nmw-btn-primary"
                onClick={handleSubmitCompletionReport}
                disabled={gateLoading}
              >
                {gateLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for external link icon
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
