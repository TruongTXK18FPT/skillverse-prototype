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
  GradingCriterion,
  GradingCriterionScore,
} from '../../types/NodeMentoring';
import { reviewNodeSubmission, getNodeAssignment } from '../../services/nodeMentoringService';
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
  const [reviewResult, setReviewResult] = useState<NodeReviewResult>('APPROVED');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | undefined>(undefined);

  const [criteria, setCriteria] = useState<GradingCriterion[]>([]);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  React.useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoadingAssignment(true);
        const data = await getNodeAssignment(journeyId, nodeId);
        if (data && data.criteria && data.criteria.length > 0) {
          setCriteria(data.criteria);
          const initialScores: Record<string, number> = {};
          data.criteria.forEach(c => {
            initialScores[c.id] = c.maxScore || 10;
          });
          setCriteriaScores(initialScores);
        }
      } catch (err) {
        console.error("Failed to load assignment criteria", err);
      } finally {
        setLoadingAssignment(false);
      }
    };
    fetchAssignment();
  }, [journeyId, nodeId]);

  const computedScore = React.useMemo(() => {
    if (criteria.length === 0) return score;
    let earned = 0;
    let max = 0;
    criteria.forEach(c => {
      earned += criteriaScores[c.id] || 0;
      max += c.maxScore || 10;
    });
    return max > 0 ? Math.round((earned / max) * 100) : 0;
  }, [criteria, criteriaScores, score]);

  const canSubmit = !loading && !loadingAssignment;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      const formattedScores: GradingCriterionScore[] = criteria.map(c => ({
        criterionId: c.id,
        title: c.title,
        score: criteriaScores[c.id] || 0,
        maxScore: c.maxScore
      }));

      const request: ReviewNodeSubmissionRequest = {
        reviewResult,
        feedback: feedback.trim() || undefined,
        score: criteria.length > 0 ? computedScore : score,
        bookingId,
        criteriaScores: criteria.length > 0 ? formattedScores : undefined,
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
        return 'Chấp nhận (node giữ trạng thái hoàn thành)';
      case 'REJECTED':
        return 'Từ chối (node sẽ mở lại cho learner)';
      case 'REWORK_REQUESTED':
        return 'Cần làm lại (node sẽ mở lại cho learner)';
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

          {criteria.length > 0 ? (
            <div className="mnrp-criteria-grading" style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Chấm điểm theo tiêu chí:
              </label>
              {criteria.map((c) => (
                <div key={c.id} className="mnrp-criterion-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{c.title}:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min={0}
                      max={c.maxScore}
                      value={criteriaScores[c.id] !== undefined ? criteriaScores[c.id] : ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        setCriteriaScores(prev => ({
                          ...prev,
                          [c.id]: Math.min(c.maxScore, Math.max(0, val))
                        }));
                      }}
                      className="mnrp-input"
                      style={{ width: '80px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {c.maxScore}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#06b6d4' }}>Tổng điểm tạm tính:</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#06b6d4' }}>{computedScore}%</span>
              </div>
            </div>
          ) : (
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
          )}

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
