/**
 * [Nghiệp vụ] Panel cho learner nộp/cập nhật output assessment ở mức journey.
 *
 * Theo spec Phase 1 (§2.4): chỉ available khi learner có active booking mentor.
 * BE sẽ trả 403 nếu không có booking — component hiển thị thông báo rõ ràng.
 *
 * - submissionText bắt buộc
 * - evidenceUrl optional
 * - attachmentUrl optional (không upload trực tiếp — learner paste URL)
 *
 * Mirror pattern từ NodeEvidenceSubmissionPanel, trim cho journey-level.
 */
import { type FC, type FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Link2, Send, XCircle } from 'lucide-react';
import {
  getLatestOutputAssessment,
  submitOutputAssessment,
} from '../../services/nodeMentoringService';
import type {
  JourneyOutputAssessmentResponse,
  OutputAssessmentStatus,
  SubmitJourneyOutputAssessmentRequest,
} from '../../types/NodeMentoring';
import './JourneyOutputAssessmentPanel.css';

interface JourneyOutputAssessmentPanelProps {
  journeyId: number;
  onSubmitted?: (record: JourneyOutputAssessmentResponse) => void;
}

const statusBadge = (status: OutputAssessmentStatus) => {
  switch (status) {
    case 'APPROVED':
      return (
        <span className="joap-badge joap-badge--approved">
          <CheckCircle size={14} /> Đã duyệt
        </span>
      );
    case 'REJECTED':
      return (
        <span className="joap-badge joap-badge--rejected">
          <XCircle size={14} /> Bị từ chối
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="joap-badge joap-badge--pending">
          <Clock size={14} /> Chờ mentor đánh giá
        </span>
      );
  }
};

const JourneyOutputAssessmentPanel: FC<JourneyOutputAssessmentPanelProps> = ({
  journeyId,
  onSubmitted,
}) => {
  const [current, setCurrent] = useState<JourneyOutputAssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [submissionText, setSubmissionText] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const record = await getLatestOutputAssessment(journeyId);
      setCurrent(record);
      if (record) {
        setSubmissionText(record.submissionText ?? '');
        setEvidenceUrl(record.evidenceUrl ?? '');
        setAttachmentUrl(record.attachmentUrl ?? '');
      }
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 403) {
        setError('Output assessment chỉ khả dụng khi bạn đã booking mentor cho journey này.');
      } else {
        setError(axiosErr.response?.data?.message || 'Không tải được output assessment.');
      }
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    load();
  }, [load]);

  const isLocked = current?.assessmentStatus === 'APPROVED';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!submissionText.trim()) {
      setError('Vui lòng mô tả kết quả đầu ra (bắt buộc).');
      return;
    }

    const request: SubmitJourneyOutputAssessmentRequest = {
      submissionText: submissionText.trim(),
      evidenceUrl: evidenceUrl.trim() || undefined,
      attachmentUrl: attachmentUrl.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const saved = await submitOutputAssessment(journeyId, request);
      setCurrent(saved);
      setSuccessMsg('Đã nộp output assessment. Mentor sẽ đánh giá trong thời gian sớm nhất.');
      onSubmitted?.(saved);
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 403) {
        setError('Bạn cần có active booking mentor để nộp output assessment.');
      } else {
        setError(axiosErr.response?.data?.message || 'Nộp output assessment thất bại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="joap-container">
        <div className="joap-loading">Đang tải output assessment…</div>
      </div>
    );
  }

  if (error && !current) {
    return (
      <div className="joap-container">
        <div className="joap-alert joap-alert--error">
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="joap-container">
      <div className="joap-header">
        <div className="joap-header__title">
          <FileText size={18} />
          <h3>Output Assessment — Kết quả đầu ra journey</h3>
        </div>
        {current && statusBadge(current.assessmentStatus)}
      </div>

      {current?.feedback && (
        <div className="joap-feedback">
          <AlertCircle size={16} />
          <div>
            <strong>Feedback từ mentor:</strong>
            <p>{current.feedback}</p>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="joap-alert joap-alert--info">
          <CheckCircle size={16} />
          Output assessment đã được mentor duyệt. Không thể chỉnh sửa.
        </div>
      )}

      {error && (
        <div className="joap-alert joap-alert--error">
          <XCircle size={16} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="joap-alert joap-alert--success">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      <form className="joap-form" onSubmit={handleSubmit}>
        <div className="joap-field">
          <label className="joap-label" htmlFor="joap-text">
            Mô tả kết quả đầu ra <span className="joap-required">*</span>
          </label>
          <textarea
            id="joap-text"
            className="joap-textarea"
            rows={6}
            placeholder="Mô tả những gì bạn đã đạt được sau khi hoàn thành journey này…"
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            disabled={isLocked || submitting}
            required
          />
        </div>

        <div className="joap-field">
          <label className="joap-label" htmlFor="joap-url">
            <Link2 size={14} /> Link minh chứng (tuỳ chọn)
          </label>
          <input
            id="joap-url"
            type="text"
            className="joap-input"
            placeholder="https://github.com/..., portfolio, demo link…"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            disabled={isLocked || submitting}
          />
        </div>

        <div className="joap-field">
          <label className="joap-label" htmlFor="joap-attachment">
            <FileText size={14} /> URL tệp đính kèm (tuỳ chọn, pdf / doc / docx)
          </label>
          <input
            id="joap-attachment"
            type="text"
            className="joap-input"
            placeholder="https://drive.google.com/..."
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            disabled={isLocked || submitting}
          />
        </div>

        <div className="joap-actions">
          <button
            type="submit"
            className="joap-btn joap-btn--primary"
            disabled={isLocked || submitting}
          >
            <Send size={14} />
            {submitting ? 'Đang nộp…' : current ? 'Cập nhật output assessment' : 'Nộp output assessment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JourneyOutputAssessmentPanel;
