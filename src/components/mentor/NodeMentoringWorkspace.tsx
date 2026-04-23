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
  getCompletionGate,
} from '../../services/nodeMentoringService';
import JourneyVerificationDossier from '../journey/JourneyVerificationDossier';
import MentorNodeReviewPanel from './MentorNodeReviewPanel';
import MentorNodeVerifyPanel from './MentorNodeVerifyPanel';
import MentorCompletionReportForm from './MentorCompletionReportForm';
import MentorOutputAssessmentReview from './MentorOutputAssessmentReview';
import NodeVerificationGate from '../journey/NodeVerificationGate';
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
                
                <div style={{ marginTop: '2rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                  <MentorOutputAssessmentReview 
                    journeyId={booking.journeyId!}
                    onAssessed={loadGate}
                  />
                </div>
                
                <div style={{ marginTop: '2rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                  <NodeVerificationGate 
                    journeyId={booking.journeyId!}
                    gate={gate}
                  />
                </div>

                <div className="nmw-gate-actions" style={{ marginTop: '1.5rem' }}>
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
      {showReviewModal && evidence && booking.journeyId && booking.nodeId && (
        <div className="nmw-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="nmw-modal" onClick={(e) => e.stopPropagation()} style={{ padding: 0, width: '600px' }}>
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

      {/* Verify Modal */}
      {showVerifyModal && evidence && booking.journeyId && booking.nodeId && (
        <div className="nmw-modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="nmw-modal" onClick={(e) => e.stopPropagation()} style={{ padding: 0, width: '500px' }}>
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

      {/* Completion Modal */}
      {showCompletionModal && booking.journeyId && (
        <div className="nmw-modal-overlay" onClick={() => setShowCompletionModal(false)}>
          <div className="nmw-modal" onClick={(e) => e.stopPropagation()} style={{ padding: 0, width: '500px' }}>
            <MentorCompletionReportForm
              journeyId={booking.journeyId}
              bookingId={booking.id}
              learnerName={booking.learnerName}
              onSubmitted={() => {
                setShowCompletionModal(false);
                loadGate();
                onActionComplete?.();
              }}
              onCancel={() => setShowCompletionModal(false)}
            />
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
