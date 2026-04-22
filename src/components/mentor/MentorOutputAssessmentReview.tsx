/**
 * [Nghiệp vụ] Panel cho mentor assess journey output assessment từ learner.
 *
 * Dùng để đánh giá final output submission trước khi mentor submit completion report.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Award,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import {
  JourneyOutputAssessmentResponse,
  OutputAssessmentStatus,
  AssessJourneyOutputRequest,
} from '../../types/NodeMentoring';
import {
  getLatestOutputAssessment,
  assessOutputAssessment,
} from '../../services/nodeMentoringService';
import './MentorOutputAssessmentReview.css';

interface MentorOutputAssessmentReviewProps {
  journeyId: number;
  onAssessed?: () => void;
}

const MentorOutputAssessmentReview: React.FC<MentorOutputAssessmentReviewProps> = ({
  journeyId,
  onAssessed,
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<JourneyOutputAssessmentResponse | null>(null);

  // Form state
  const [assessmentStatus, setAssessmentStatus] = useState<OutputAssessmentStatus>('PENDING');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | undefined>(undefined);

  const loadAssessment = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLatestOutputAssessment(journeyId);
      setAssessment(data);
      if (data) {
        setAssessmentStatus(data.assessmentStatus);
        setFeedback(data.feedback || '');
        setScore(data.score ?? undefined);
      }
    } catch (err: any) {
      showError('Lỗi tải dữ liệu', err.response?.data?.message || 'Không thể tải assessment');
    } finally {
      setLoading(false);
    }
  }, [journeyId, showError]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  const handleSubmit = async () => {
    if (!assessment) return;
    try {
      setLoading(true);
      const request: AssessJourneyOutputRequest = {
        assessmentStatus,
        feedback: feedback.trim() || undefined,
        score,
      };
      await assessOutputAssessment(journeyId, request);
      showSuccess('Thành công', `Đã ${assessmentStatus === 'APPROVED' ? 'duyệt' : 'từ chối'} output assessment`);
      onAssessed?.();
      await loadAssessment();
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: OutputAssessmentStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="moar-badge moar-badge-success"><CheckCircle size={14} /> APPROVED</span>;
      case 'REJECTED':
        return <span className="moar-badge moar-badge-danger"><XCircle size={14} /> REJECTED</span>;
      default:
        return <span className="moar-badge moar-badge-pending"><Clock size={14} /> PENDING</span>;
    }
  };

  if (loading && !assessment) {
    return (
      <div className="moar-container">
        <div className="moar-loading">Đang tải...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="moar-container">
        <div className="moar-empty">
          <Clock size={32} />
          <p>Learner chưa nộp output assessment.</p>
        </div>
      </div>
    );
  }

  const alreadyAssessed = assessment.assessmentStatus !== 'PENDING';

  return (
    <div className="moar-container">
      <div className="moar-header">
        <FileText size={20} />
        <div>
          <h3>Đánh giá Output Assessment</h3>
          <p className="moar-subtitle">Đánh giá final submission từ learner</p>
        </div>
        {getStatusBadge(assessment.assessmentStatus)}
      </div>

      <div className="moar-content">
        {/* Learner Submission */}
        <div className="moar-section">
          <div className="moar-section-title">Submission từ learner:</div>

          <div className="moar-field">
            <label>Nội dung:</label>
            <div className="moar-text">{assessment.submissionText || '(Không có nội dung)'}</div>
          </div>

          {assessment.evidenceUrl && (
            <div className="moar-field">
              <label>Evidence:</label>
              <a
                href={assessment.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="moar-link"
              >
                <ExternalLink size={14} /> Xem evidence
              </a>
            </div>
          )}

          {assessment.attachmentUrl && (
            <div className="moar-field">
              <label>Attachment:</label>
              <a
                href={assessment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="moar-link"
              >
                <ExternalLink size={14} /> Tải attachment
              </a>
            </div>
          )}

          <div className="moar-meta">
            Nộp lúc: {new Date(assessment.submittedAt).toLocaleString('vi-VN')}
          </div>
        </div>

        {/* Assessment Form */}
        <div className="moar-section">
          <div className="moar-section-title">
            <Award size={16} /> Đánh giá của mentor:
          </div>

          <div className="moar-form-group">
            <label>Quyết định:</label>
            <div className="moar-status-options">
              <button
                type="button"
                className={`moar-status-btn ${assessmentStatus === 'APPROVED' ? 'active' : ''}`}
                onClick={() => setAssessmentStatus('APPROVED')}
                disabled={alreadyAssessed}
              >
                <CheckCircle size={16} /> APPROVED
              </button>
              <button
                type="button"
                className={`moar-status-btn ${assessmentStatus === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setAssessmentStatus('REJECTED')}
                disabled={alreadyAssessed}
              >
                <XCircle size={16} /> REJECTED
              </button>
            </div>
          </div>

          <div className="moar-form-group">
            <label>Điểm (tùy chọn):</label>
            <input
              type="number"
              min={0}
              max={100}
              value={score || ''}
              onChange={(e) => setScore(e.target.value ? parseInt(e.target.value) : undefined)}
              className="moar-input"
              placeholder="0-100"
              disabled={alreadyAssessed}
            />
          </div>

          <div className="moar-form-group">
            <label>Feedback:</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="moar-textarea"
              rows={4}
              placeholder="Nhập feedback cho learner..."
              disabled={alreadyAssessed}
            />
          </div>
        </div>
      </div>

      {!alreadyAssessed && (
        <div className="moar-actions">
          <button
            className="moar-btn moar-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Gửi đánh giá'}
          </button>
        </div>
      )}

      {alreadyAssessed && assessment.assessedAt && (
        <div className="moar-assessed-notice">
          <CheckCircle size={14} /> Đã đánh giá lúc {new Date(assessment.assessedAt).toLocaleString('vi-VN')}
        </div>
      )}
    </div>
  );
};

export default MentorOutputAssessmentReview;
