/**
 * [Nghiệp vụ] Panel cho mentor review learner submission tại một node.
 *
 * Standalone component - có thể dùng riêng hoặc embed trong workspace.
 * Mirror pattern từ MentorVerificationAdminTab (approve/reject modal flow).
 */
import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import {
  NodeEvidenceRecordResponse,
  NodeReviewResult,
  ReviewNodeSubmissionRequest,
} from '../../types/NodeMentoring';
import { reviewNodeSubmission } from '../../services/nodeMentoringService';
import './MentorNodeReviewPanel.css';

interface MentorNodeReviewPanelProps {
  journeyId: number;
  nodeId: string;
  evidence: NodeEvidenceRecordResponse;
  bookingId?: number;
  onReviewSubmitted?: (updated: NodeEvidenceRecordResponse) => void;
  onCancel?: () => void;
}

const MentorNodeReviewPanel: React.FC<MentorNodeReviewPanelProps> = ({
  journeyId,
  nodeId,
  evidence,
  bookingId,
  onReviewSubmitted,
  onCancel,
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state - NodeReviewResult: 'APPROVED' | 'REWORK_REQUESTED' | 'REJECTED'
  const [reviewResult, setReviewResult] = useState<NodeReviewResult>('APPROVED');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | undefined>(undefined);

  const canSubmit = !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      const request: ReviewNodeSubmissionRequest = {
        reviewResult,
        feedback: feedback.trim() || undefined,
        score,
        bookingId,
      };

      await reviewNodeSubmission(journeyId, nodeId, request);
      showSuccess('Thành công', 'Đã gửi review cho learner');
      onReviewSubmitted?.(evidence);
    } catch (err: any) {
      showError('Lỗi review', err.response?.data?.message || 'Không thể gửi review');
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = () => {
    switch (reviewResult) {
      case 'APPROVED':
        return <CheckCircle size={16} />;
      case 'REJECTED':
        return <XCircle size={16} />;
      case 'REWORK_REQUESTED':
        return <AlertCircle size={16} />;
    }
  };

  const getResultLabel = () => {
    switch (reviewResult) {
      case 'APPROVED':
        return 'Chấp nhận (Learner có thể qua node)';
      case 'REJECTED':
        return 'Từ chối (Node không đạt)';
      case 'REWORK_REQUESTED':
        return 'Cần làm lại (Learner cần cải thiện)';
    }
  };

  return (
    <div className="mnrp-panel">
      <div className="mnrp-header">
        <ClipboardCheck size={20} />
        <h3>Review Submission</h3>
      </div>

      <div className="mnrp-content">
        {/* Evidence Summary */}
        <div className="mnrp-evidence-summary">
          <div className="mnrp-field">
            <label>Nội dung từ learner:</label>
            <div className="mnrp-text">{evidence.submissionText}</div>
          </div>

          {evidence.evidenceUrl && (
            <div className="mnrp-field">
              <label>Evidence URL:</label>
              <a
                href={evidence.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mnrp-link"
              >
                Xem evidence
              </a>
            </div>
          )}

          {evidence.attachmentUrl && (
            <div className="mnrp-field">
              <label>Attachment:</label>
              <a
                href={evidence.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mnrp-link"
              >
                Tải attachment
              </a>
            </div>
          )}
        </div>

        {/* Review Form */}
        <div className="mnrp-form">
          <div className="mnrp-form-group">
            <label>Quyết định review:</label>
            <div className="mnrp-result-options">
              <button
                type="button"
                className={`mnrp-result-btn ${reviewResult === 'APPROVED' ? 'active' : ''}`}
                onClick={() => setReviewResult('APPROVED')}
              >
                <CheckCircle size={16} /> APPROVED
              </button>
              <button
                type="button"
                className={`mnrp-result-btn ${reviewResult === 'REWORK_REQUESTED' ? 'active' : ''}`}
                onClick={() => setReviewResult('REWORK_REQUESTED')}
              >
                <AlertCircle size={16} /> NEEDS_REWORK
              </button>
              <button
                type="button"
                className={`mnrp-result-btn ${reviewResult === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setReviewResult('REJECTED')}
              >
                <XCircle size={16} /> REJECTED
              </button>
            </div>
            <div className="mnrp-result-hint">
              {getResultIcon()} {getResultLabel()}
            </div>
          </div>

          <div className="mnrp-form-group">
            <label>Điểm (tùy chọn):</label>
            <input
              type="number"
              min={0}
              max={100}
              value={score || ''}
              onChange={(e) => setScore(e.target.value ? parseInt(e.target.value) : undefined)}
              className="mnrp-input"
              placeholder="0-100"
            />
          </div>

          <div className="mnrp-form-group">
            <label>Feedback cho learner:</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mnrp-textarea"
              rows={4}
              placeholder={`Nhập feedback ${reviewResult === 'REWORK_REQUESTED' ? '- hướng dẫn learner cần cải thiện gì' : ''}...`}
            />
          </div>
        </div>
      </div>

      <div className="mnrp-actions">
        {onCancel && (
          <button className="mnrp-btn mnrp-btn-secondary" onClick={onCancel} disabled={loading}>
            Hủy
          </button>
        )}
        <button
          className="mnrp-btn mnrp-btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? (
            'Đang gửi...'
          ) : (
            <>
              <Send size={16} /> Gửi Review
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MentorNodeReviewPanel;
