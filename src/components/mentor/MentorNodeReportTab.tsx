import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, FileText, CheckCircle, AlertCircle, XCircle, Send, Award, Clock } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import {
  getNodeEvidence,
  reviewNodeSubmission,
  verifyNode,
} from '../../services/nodeMentoringService';
import {
  NodeEvidenceRecordResponse,
  NodeReviewResult,
  NodeFinalVerificationStatus,
} from '../../types/NodeMentoring';
import MarkdownEditorField from '../shared/MarkdownEditorField';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MentorNodeReportTab.css';

interface MentorNodeReportTabProps {
  journeyId: number;
  nodeId: string;
  nodeTitle?: string;
  learnerName?: string;
  bookingId?: number;
  onReportSubmitted?: () => void;
}

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
  const [evidence, setEvidence] = useState<NodeEvidenceRecordResponse | null>(null);

  // Review Form State
  const [reviewResult, setReviewResult] = useState<NodeReviewResult>('APPROVED');
  const [score, setScore] = useState<number | undefined>(undefined);
  const [feedback, setFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Verify Form State
  const [verifyStatus, setVerifyStatus] = useState<NodeFinalVerificationStatus>('VERIFIED');
  const [verifyNote, setVerifyNote] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  const loadEvidence = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNodeEvidence(journeyId, nodeId);
      setEvidence(data);
      if (data?.latestReview) {
        setReviewResult(data.latestReview.reviewResult);
        setScore(data.latestReview.score);
        setFeedback(data.latestReview.feedback || '');
      }
      if (data?.latestVerification) {
        setVerifyStatus(data.latestVerification.nodeVerificationStatus);
        setVerifyNote(data.latestVerification.verificationNote || '');
      }
    } catch (err: any) {
      // If 404, it means no evidence has been submitted yet.
      if (err.response?.status !== 404) {
        showError('Lỗi', err.response?.data?.message || 'Không thể tải minh chứng của node');
      }
    } finally {
      setLoading(false);
    }
  }, [journeyId, nodeId, showError]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const handleReview = async () => {
    if (!evidence) return;
    try {
      setSubmittingReview(true);
      await reviewNodeSubmission(evidence.id, {
        reviewResult,
        score,
        feedback,
        bookingId,
      });
      showSuccess('Thành công', 'Đã gửi đánh giá minh chứng');
      await loadEvidence();
      onReportSubmitted?.();
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Lỗi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleVerify = async () => {
    if (!evidence) return;
    try {
      setSubmittingVerify(true);
      await verifyNode(evidence.id, {
        nodeVerificationStatus: verifyStatus,
        verificationNote: verifyNote,
        bookingId,
      });
      showSuccess('Thành công', 'Đã xác nhận trạng thái node');
      await loadEvidence();
      onReportSubmitted?.();
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Lỗi xác nhận node');
    } finally {
      setSubmittingVerify(false);
    }
  };

  if (loading) {
    return <div className="mnrt-loading"><Clock size={16} /> Đang tải dữ liệu node...</div>;
  }

  if (!evidence) {
    return (
      <div className="mnrt-empty">
        <FileText size={32} />
        <p>Học viên chưa nộp minh chứng cho node này.</p>
        <span>Bạn có thể yêu cầu học viên nộp minh chứng từ giao diện của họ.</span>
      </div>
    );
  }

  const isVerified = evidence.verificationStatus === 'VERIFIED';

  return (
    <div className="mnrt-container">
      <div className="mnrt-header">
        <div className="mnrt-header-icon"><ShieldCheck size={20} /></div>
        <div>
          <h3 className="mnrt-title">Xác nhận hoàn thành Node</h3>
          <p className="mnrt-subtitle">{nodeTitle} {learnerName && `— ${learnerName}`}</p>
        </div>
      </div>

      {/* View Student Submission */}
      <div className="mnrt-section">
        <div className="mnrt-section-header">
          <FileText size={16} /> <span>Minh chứng đã nộp</span>
          <span className={`mnrt-badge mnrt-badge--${evidence.submissionStatus}`}>
            {evidence.submissionStatus}
          </span>
        </div>
        <div className="mnrt-section-body">
          <div className="mnrt-submission-date">
            Nộp lúc: {new Date(evidence.submittedAt).toLocaleString('vi-VN')}
          </div>
          <div className="mnrt-markdown-content">
            {evidence.submissionText ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {evidence.submissionText}
              </ReactMarkdown>
            ) : (
              <span className="mnrt-empty-text">Không có nội dung văn bản</span>
            )}
          </div>
          {(evidence.evidenceUrl || evidence.attachmentUrl) && (
            <div className="mnrt-attachments">
              {evidence.evidenceUrl && (
                <a href={evidence.evidenceUrl} target="_blank" rel="noreferrer" className="mnrt-link">
                  🔗 Link minh chứng
                </a>
              )}
              {evidence.attachmentUrl && (
                <a href={evidence.attachmentUrl} target="_blank" rel="noreferrer" className="mnrt-link">
                  📎 File đính kèm
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Section */}
      <div className="mnrt-section">
        <div className="mnrt-section-header">
          <Award size={16} /> <span>Đánh giá & Chấm điểm</span>
          {evidence.latestReview && (
            <span className="mnrt-reviewed-mark"><CheckCircle size={14} /> Đã đánh giá</span>
          )}
        </div>
        <div className="mnrt-section-body">
          <div className="mnrt-form-group">
            <label className="mnrt-label">Kết quả đánh giá:</label>
            <div className="mnrt-decision-group">
              <button
                className={`mnrt-decision-btn mnrt-decision-btn--approve ${reviewResult === 'APPROVED' ? 'active' : ''}`}
                onClick={() => setReviewResult('APPROVED')}
                disabled={isVerified}
              >
                <CheckCircle size={16} /> Đạt
              </button>
              <button
                className={`mnrt-decision-btn mnrt-decision-btn--warn ${reviewResult === 'REWORK_REQUESTED' ? 'active' : ''}`}
                onClick={() => setReviewResult('REWORK_REQUESTED')}
                disabled={isVerified}
              >
                <AlertCircle size={16} /> Cần làm lại
              </button>
              <button
                className={`mnrt-decision-btn mnrt-decision-btn--reject ${reviewResult === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setReviewResult('REJECTED')}
                disabled={isVerified}
              >
                <XCircle size={16} /> Từ chối
              </button>
            </div>
          </div>

          <div className="mnrt-form-group">
            <label className="mnrt-label">Điểm (0-100):</label>
            <input
              type="number"
              min={0}
              max={100}
              className="mnrt-input"
              value={score || ''}
              onChange={(e) => setScore(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Ví dụ: 85"
              style={{ width: '100px' }}
              disabled={isVerified}
            />
          </div>

          <div className="mnrt-form-group">
            <MarkdownEditorField
              label="Nhận xét / Phản hồi:"
              value={feedback}
              onChange={setFeedback}
              placeholder="Nhận xét về bài làm của học viên..."
              rows={4}
            />
          </div>

          {!isVerified && (
            <button className="mnrt-submit-btn" onClick={handleReview} disabled={submittingReview}>
              <Send size={15} /> {submittingReview ? 'Đang lưu...' : 'Lưu đánh giá'}
            </button>
          )}
        </div>
      </div>

      {/* Final Verification Section */}
      <div className="mnrt-section mnrt-section--verify">
        <div className="mnrt-section-header">
          <ShieldCheck size={16} /> <span>Quyết định Gate (Mở khóa tiếp)</span>
        </div>
        <div className="mnrt-section-body">
          <p className="mnrt-help-text">
            Xác nhận "VERIFIED" sẽ đánh dấu node này là hoàn thành và mở khóa các node tiếp theo trong roadmap.
          </p>

          <div className="mnrt-form-group">
            <label className="mnrt-label">Quyết định:</label>
            <div className="mnrt-decision-group">
              <button
                className={`mnrt-decision-btn mnrt-decision-btn--approve ${verifyStatus === 'VERIFIED' ? 'active' : ''}`}
                onClick={() => setVerifyStatus('VERIFIED')}
              >
                <CheckCircle size={16} /> VERIFIED (Pass)
              </button>
              <button
                className={`mnrt-decision-btn mnrt-decision-btn--reject ${verifyStatus === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setVerifyStatus('REJECTED')}
              >
                <XCircle size={16} /> REJECTED (Fail)
              </button>
            </div>
          </div>

          <div className="mnrt-form-group">
            <MarkdownEditorField
              label="Ghi chú xác nhận:"
              value={verifyNote}
              onChange={setVerifyNote}
              placeholder="Lý do pass hoặc fail gate này..."
              rows={3}
            />
          </div>

          <button className="mnrt-submit-btn mnrt-submit-btn--verify" onClick={handleVerify} disabled={submittingVerify}>
            <ShieldCheck size={15} /> {submittingVerify ? 'Đang xử lý...' : 'Xác nhận Gate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorNodeReportTab;
