/**
 * [Nghiệp vụ] Panel cho mentor xác minh node sau khi đã review.
 *
 * Standalone component - dùng sau khi review submission.
 * Verification là bước cuối cùng để "khóa" node với quyết định VERIFIED/REJECTED.
 */
import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import {
  NodeEvidenceRecordResponse,
  NodeFinalVerificationStatus,
  VerifyNodeRequest,
} from '../../types/NodeMentoring';
import { verifyNode } from '../../services/nodeMentoringService';
import './MentorNodeVerifyPanel.css';

interface MentorNodeVerifyPanelProps {
  journeyId: number;
  nodeId: string;
  evidence: NodeEvidenceRecordResponse;
  bookingId?: number;
  onVerified?: (updated: NodeEvidenceRecordResponse) => void;
  onCancel?: () => void;
}

const MentorNodeVerifyPanel: React.FC<MentorNodeVerifyPanelProps> = ({
  journeyId,
  nodeId,
  evidence,
  bookingId,
  onVerified,
  onCancel,
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [verificationStatus, setVerificationStatus] = useState<NodeFinalVerificationStatus>('VERIFIED');
  const [verificationNote, setVerificationNote] = useState('');

  const canSubmit = !loading && !evidence.latestVerification;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      const request: VerifyNodeRequest = {
        nodeVerificationStatus: verificationStatus,
        verificationNote: verificationNote.trim() || undefined,
        bookingId,
      };

      await verifyNode(journeyId, nodeId, request);
      showSuccess(
        'Thành công',
        `Node đã được ${verificationStatus === 'VERIFIED' ? 'xác minh' : 'từ chối'}`
      );
      onVerified?.(evidence);
    } catch (err: any) {
      showError('Lỗi xác minh', err.response?.data?.message || 'Không thể xác minh node');
    } finally {
      setLoading(false);
    }
  };

  // Nếu đã verify rồi, hiển thị thông tin thay vì form
  if (evidence.latestVerification) {
    const isVerified = evidence.latestVerification.nodeVerificationStatus === 'VERIFIED';
    return (
      <div className="mnvp-panel">
        <div className="mnvp-header">
          <ShieldCheck size={20} />
          <h3>Xác minh Node</h3>
        </div>
        <div className="mnvp-already-verified">
          <div className={`mnvp-status ${isVerified ? 'verified' : 'rejected'}`}>
            {isVerified ? <CheckCircle size={32} /> : <XCircle size={32} />}
            <span>Node đã được {isVerified ? 'xác minh' : 'từ chối'}</span>
          </div>
          {evidence.latestVerification.verificationNote && (
            <div className="mnvp-note">
              <label>Ghi chú:</label>
              <p>{evidence.latestVerification.verificationNote}</p>
            </div>
          )}
          <div className="mnvp-meta">
            Xác minh lúc: {new Date(evidence.latestVerification.verifiedAt).toLocaleString('vi-VN')}
          </div>
        </div>
      </div>
    );
  }

  // Kiểm tra có review trước đó không
  if (!evidence.latestReview) {
    return (
      <div className="mnvp-panel">
        <div className="mnvp-header">
          <ShieldCheck size={20} />
          <h3>Xác minh Node</h3>
        </div>
        <div className="mnvp-no-review">
          <AlertTriangle size={32} />
          <p>Chưa thể xác minh: Mentor chưa review submission này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mnvp-panel">
      <div className="mnvp-header">
        <ShieldCheck size={20} />
        <h3>Xác minh Node</h3>
      </div>

      <div className="mnvp-content">
        {/* Review Summary */}
        <div className="mnvp-review-summary">
          <div className="mnvp-section-title">Review trước đó:</div>
          <div className={`mnvp-review-result ${evidence.latestReview.reviewResult.toLowerCase()}`}>
            {evidence.latestReview.reviewResult === 'APPROVED' && <CheckCircle size={16} />}
            {evidence.latestReview.reviewResult === 'REJECTED' && <XCircle size={16} />}
            {evidence.latestReview.reviewResult === 'REWORK_REQUESTED' && <AlertCircle size={16} />}
            <span>{evidence.latestReview.reviewResult}</span>
          </div>
          {evidence.latestReview.feedback && (
            <div className="mnvp-review-feedback">
              <label>Feedback:</label>
              <p>{evidence.latestReview.feedback}</p>
            </div>
          )}
        </div>

        {/* Verification Form */}
        <div className="mnvp-form">
          <div className="mnvp-form-group">
            <label>Quyết định xác minh:</label>
            <div className="mnvp-status-options">
              <button
                type="button"
                className={`mnvp-status-btn ${verificationStatus === 'VERIFIED' ? 'active' : ''}`}
                onClick={() => setVerificationStatus('VERIFIED')}
              >
                <CheckCircle size={16} /> VERIFIED
              </button>
              <button
                type="button"
                className={`mnvp-status-btn ${verificationStatus === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setVerificationStatus('REJECTED')}
              >
                <XCircle size={16} /> REJECTED
              </button>
            </div>
          </div>

          <div className="mnvp-form-group">
            <label>Ghi chú xác minh (tùy chọn):</label>
            <textarea
              value={verificationNote}
              onChange={(e) => setVerificationNote(e.target.value)}
              className="mnvp-textarea"
              rows={3}
              placeholder="Nhập ghi chú về quyết định xác minh..."
            />
          </div>
        </div>
      </div>

      <div className="mnvp-actions">
        {onCancel && (
          <button className="mnvp-btn mnvp-btn-secondary" onClick={onCancel} disabled={loading}>
            Hủy
          </button>
        )}
        <button
          className="mnvp-btn mnvp-btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? (
            'Đang xử lý...'
          ) : (
            <>
              <ShieldCheck size={16} /> Xác minh
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Helper icons
const AlertCircle: React.FC<{ size?: number }> = ({ size = 16 }) => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const AlertTriangle: React.FC<{ size?: number }> = ({ size = 16 }) => (
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
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default MentorNodeVerifyPanel;
