import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Link as LinkIcon,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  History,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  AssignmentDetailDTO,
  AssignmentSubmissionDetailDTO,
  AssignmentSubmissionCreateDTO,
  SubmissionType,
  SubmissionStatus
} from '../../data/assignmentDTOs';
import {
  getAssignmentById,
  submitAssignment,
  getMySubmissions
} from '../../services/assignmentService';
import { uploadMedia } from '../../services/mediaService';
import { useAuth } from '../../context/AuthContext';
import {
  getSubmissionTimingInfo,
  getSubmissionWorkflowLabel,
  hasAssignmentDueDate,
  isAssignmentPastDue,
} from '../../utils/assignmentPresentation';
import './learning-hud.css';

interface AssignmentViewerProps {
  assignmentId: number;
  onClose?: () => void;
  readOnly?: boolean;
}

const AssignmentViewer: React.FC<AssignmentViewerProps> = ({ assignmentId, onClose, readOnly = false }) => {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentDetailDTO | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionDetailDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistorySubmissionId, setSelectedHistorySubmissionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [submissionText, setSubmissionText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadData = useCallback(async () => {
    if (!assignmentId || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const assignmentData = await getAssignmentById(assignmentId);
      const submissionsData = readOnly ? [] : await getMySubmissions(assignmentId);
      setAssignment(assignmentData);
      setSubmissions(submissionsData);
      setSelectedHistorySubmissionId((current) => {
        if (!current) return null;
        return submissionsData.some((submission) => submission.id === current) ? current : null;
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assignment';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, user?.id, readOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment || !user?.id) return;

    setSubmitting(true);
    setError(null);

    try {
      const submissionData: AssignmentSubmissionCreateDTO = {};

      if (assignment.submissionType === SubmissionType.TEXT) {
        if (!submissionText.trim()) {
          setError('Please enter your submission text');
          setSubmitting(false);
          return;
        }
        submissionData.submissionText = submissionText;
      } else if (assignment.submissionType === SubmissionType.LINK) {
        if (!linkUrl.trim()) {
          setError('Please enter a URL');
          setSubmitting(false);
          return;
        }
        if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
          setError('URL must start with http:// or https://');
          setSubmitting(false);
          return;
        }
        submissionData.linkUrl = linkUrl;
      } else if (assignment.submissionType === SubmissionType.FILE) {
        if (!selectedFile) {
          setError('Please select a file to upload');
          setSubmitting(false);
          return;
        }
        // Upload file first
        setUploadProgress(10);
        const mediaResult = await uploadMedia(selectedFile, user.id);
        setUploadProgress(100);
        submissionData.fileMediaId = mediaResult.id;
      }

      await submitAssignment(assignmentId, submissionData);

      // Reset form
      setSubmissionText('');
      setLinkUrl('');
      setSelectedFile(null);
      setUploadProgress(0);

      // Reload data to show new submission
      await loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit assignment';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (submission: AssignmentSubmissionDetailDTO) => {
    if (submission.status === SubmissionStatus.GRADED) {
      const isPassed = submission.isPassed === true;
      return (
        <span className={`learning-hud-submission-badge ${isPassed ? 'passed' : 'failed'}`}>
          <CheckCircle size={14} />
          {submission.score}/{submission.maxScore} {isPassed ? 'Đạt' : 'Cần cải thiện'}
        </span>
      );
    }
    const timingInfo = getSubmissionTimingInfo(assignment?.dueAt, submission.isLate);
    if (timingInfo?.tone === 'late') {
      return (
        <span className="learning-hud-submission-badge late">
          <AlertCircle size={14} />
          {timingInfo.text}
        </span>
      );
    }
    return (
      <span className="learning-hud-submission-badge pending">
        <Clock size={14} />
        {getSubmissionWorkflowLabel(submission.status)}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasDueDate = hasAssignmentDueDate(assignment?.dueAt);
  const isDueDatePassed = isAssignmentPastDue(assignment?.dueAt);

  const newestSubmission = submissions.find(s => s.isNewest);
  const previousSubmissions = submissions.filter(s => !s.isNewest);
  const selectedHistorySubmission = previousSubmissions.find((submission) => submission.id === selectedHistorySubmissionId) ?? null;
  const hasMeaningfulCriteriaThreshold = (passingPoints?: number | null) =>
    passingPoints != null && Number(passingPoints) > 0;

  const renderSubmissionDetails = (submission: AssignmentSubmissionDetailDTO, heading: string) => (
    <div className="learning-hud-current-submission">
      <div className="learning-hud-submission-header">
        <h3>{heading}</h3>
        {getStatusBadge(submission)}
      </div>
      <div className="learning-hud-submission-content">
        {submission.submissionText && (
          <div className="learning-hud-submission-text">
            {submission.submissionText}
          </div>
        )}
        {submission.linkUrl && (
          <a
            href={submission.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="learning-hud-submission-link"
          >
            <LinkIcon size={16} />
            {submission.linkUrl}
          </a>
        )}
        {submission.fileMediaUrl && (
          <a
            href={submission.fileMediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="learning-hud-submission-file"
          >
            <Upload size={16} />
            View Uploaded File
          </a>
        )}
        <div className="learning-hud-submission-meta">
          <span>Nộp lúc: {formatDate(submission.submittedAt)}</span>
          {(() => {
            const timingInfo = getSubmissionTimingInfo(assignment?.dueAt, submission.isLate);
            if (!timingInfo) {
              return null;
            }
            return (
              <span className={`learning-hud-timing-badge ${timingInfo.tone}`}>
                {timingInfo.text}
              </span>
            );
          })()}
          {submission.gradedAt && (
            <span>Chấm lúc: {formatDate(submission.gradedAt)}</span>
          )}
        </div>
      </div>
      {submission.feedback && (
        <div className="learning-hud-submission-feedback">
          <h4>Nhận xét của mentor:</h4>
          <p>{submission.feedback}</p>
          {submission.gradedByName && (
            <span className="learning-hud-grader">
              - {submission.gradedByName}
            </span>
          )}
        </div>
      )}
      {submission.criteriaScores && submission.criteriaScores.length > 0 && submission.status === SubmissionStatus.GRADED && (
        <div className="learning-hud-criteria-breakdown">
          <h4>Chi Tiết Tiêu Chí</h4>
          {submission.criteriaScores.map((cs) => {
            const hasThreshold = hasMeaningfulCriteriaThreshold(cs.passingPoints);
            const criteriaState = hasThreshold ? (cs.passed ? 'passed' : 'failed') : '';

            return (
            <div key={`${submission.id}-${cs.criteriaId}`} className={`learning-hud-criteria-row ${criteriaState}`}>
              <div className="learning-hud-criteria-info">
                <span className="learning-hud-criteria-name">{cs.criteriaName}</span>
                {hasThreshold && (
                  <span className={`learning-hud-criteria-badge ${cs.passed ? 'passed' : 'failed'}`}>
                    {cs.passed ? '✓ Đạt' : '✗ Chưa đạt'}
                  </span>
                )}
              </div>
              <div className="learning-hud-criteria-score">
                {cs.score}/{cs.maxPoints}
                {hasThreshold && (
                  <span className="learning-hud-criteria-threshold"> (cần ≥{cs.passingPoints})</span>
                )}
              </div>
              {cs.feedback && (
                <div className="learning-hud-criteria-feedback">{cs.feedback}</div>
              )}
            </div>
          )})}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="learning-hud-assignment-viewer">
        <div className="learning-hud-assignment-loading">
          <div className="learning-hud-spinner" />
          <span>LOADING ASSIGNMENT DATA...</span>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="learning-hud-assignment-viewer">
        <div className="learning-hud-assignment-error">
          <AlertCircle size={48} />
          <span>Assignment not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-hud-assignment-viewer">
      {/* Header */}
      <div className="learning-hud-assignment-header">
        <div className="learning-hud-assignment-title-row">
          <h2>{assignment.title}</h2>
          {onClose && (
            <button className="learning-hud-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>
        <div className="learning-hud-assignment-meta">
          <span className="learning-hud-assignment-type">
            {assignment.submissionType === SubmissionType.TEXT && <FileText size={16} />}
            {assignment.submissionType === SubmissionType.LINK && <LinkIcon size={16} />}
            {assignment.submissionType === SubmissionType.FILE && <Upload size={16} />}
            {assignment.submissionType}
          </span>
          <span className="learning-hud-assignment-score">
            Điểm tối đa: {assignment.maxScore}
          </span>
          {hasDueDate && assignment.dueAt && (
            <span className={`learning-hud-assignment-due ${isDueDatePassed ? 'overdue' : ''}`}>
              <Clock size={16} />
              Hạn nộp: {formatDate(assignment.dueAt)}
              {isDueDatePassed && ' (Đã quá hạn)'}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="learning-hud-assignment-description">
        <h3>Yêu cầu bài tập</h3>
        <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
      </div>

      {/* Rubric Preview — show grading criteria before submission */}
      {assignment.criteria && assignment.criteria.length > 0 && (
        <div className="learning-hud-rubric-preview">
          <h3>Tiêu Chí Chấm Điểm</h3>
          <div className="learning-hud-rubric-list">
            {assignment.criteria.map((criterion) => (
              <div key={criterion.id ?? criterion.name} className="learning-hud-rubric-item">
                <div className="learning-hud-rubric-header">
                  <span className="learning-hud-rubric-name">
                    {criterion.name}
                    {criterion.isRequired && <span className="learning-hud-rubric-required">*</span>}
                  </span>
                  <span className="learning-hud-rubric-points">
                    {criterion.passingPoints != null && criterion.passingPoints > 0
                      ? `≥${criterion.passingPoints}/${criterion.maxPoints}`
                      : `/${criterion.maxPoints}`
                    }
                  </span>
                </div>
                {criterion.description && (
                  <p className="learning-hud-rubric-desc">{criterion.description}</p>
                )}
              </div>
            ))}
          </div>
          {assignment.passingScore != null && (
            <div className="learning-hud-rubric-summary">
              Điểm đạt tối thiểu: <strong>{assignment.passingScore}/{assignment.maxScore}</strong>
            </div>
          )}
        </div>
      )}

      {/* Current Submission Status */}
      {!readOnly && newestSubmission && (
        renderSubmissionDetails(newestSubmission, `Bài nộp của bạn (Lần #${newestSubmission.attemptNumber})`)
      )}

      {/* Submission History */}
      {!readOnly && previousSubmissions.length > 0 && (
        <div className="learning-hud-submission-history">
          <button
            className="learning-hud-history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={16} />
            Lịch sử nộp bài ({previousSubmissions.length})
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showHistory && (
            <div className="learning-hud-history-list">
              {previousSubmissions.map(sub => (
                <div
                  key={sub.id}
                  className={`learning-hud-history-item ${selectedHistorySubmissionId === sub.id ? 'active' : ''}`}
                >
                  <div className="learning-hud-history-header">
                    <span>Lần #{sub.attemptNumber}</span>
                    {getStatusBadge(sub)}
                  </div>
                  <div className="learning-hud-history-meta">
                    <span>Nộp lúc: {formatDate(sub.submittedAt)}</span>
                    {(() => {
                      const timingInfo = getSubmissionTimingInfo(assignment?.dueAt, sub.isLate);
                      if (!timingInfo) {
                        return null;
                      }
                      return (
                        <span className={`learning-hud-timing-badge ${timingInfo.tone}`}>
                          {timingInfo.text}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="learning-hud-history-actions">
                    <button
                      type="button"
                      className="learning-hud-history-action-btn"
                      onClick={() => setSelectedHistorySubmissionId((current) => current === sub.id ? null : sub.id)}
                    >
                      {selectedHistorySubmissionId === sub.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showHistory && selectedHistorySubmission && (
            <div className="learning-hud-history-detail">
              {renderSubmissionDetails(
                selectedHistorySubmission,
                `Xem lại lần nộp #${selectedHistorySubmission.attemptNumber}`
              )}
            </div>
          )}
        </div>
      )}

      {/* Submission Form — gated by submission status */}
      {!readOnly && (() => {
        // Gate logic: determine if student can submit
        if (newestSubmission) {
          // PENDING: waiting for grading — block resubmission
          if (newestSubmission.status === SubmissionStatus.PENDING || newestSubmission.status === SubmissionStatus.LATE_PENDING) {
            return (
              <div className="learning-hud-submission-gate">
                <Clock size={24} />
                <p>Đang chờ mentor chấm điểm...</p>
                <span className="learning-hud-gate-hint">
                  Bạn sẽ có thể nộp lại sau khi bài được chấm (nếu chưa đạt).
                </span>
              </div>
            );
          }
          // PASSED: no resubmission needed
          if (newestSubmission.isPassed === true) {
            return (
              <div className="learning-hud-submission-gate passed">
                <CheckCircle size={24} />
                <p>Bạn đã hoàn thành bài tập này ✓</p>
                <span className="learning-hud-gate-hint">
                  Điểm: {newestSubmission.score}/{newestSubmission.maxScore}
                </span>
              </div>
            );
          }
          // FAIL: allow reattempt — fall through to form
        }
        // No submission yet OR failed → show form
        return (
          <div className="learning-hud-submission-form">
          <h3>
            {newestSubmission ? 'Nộp Lại Bài Tập' : 'Nộp Bài Tập'}
          </h3>
          {hasDueDate && isDueDatePassed && (
            <div className="learning-hud-late-warning">
              <AlertCircle size={16} />
              Bài tập đã quá hạn. Nếu nộp lúc này, hệ thống sẽ ghi nhận là nộp muộn.
            </div>
          )}

          {error && (
            <div className="learning-hud-form-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {assignment.submissionType === SubmissionType.TEXT && (
              <textarea
                className="learning-hud-text-input"
                placeholder="Nhập nội dung bài nộp..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={8}
                disabled={submitting}
              />
            )}

            {assignment.submissionType === SubmissionType.LINK && (
              <input
                type="url"
                className="learning-hud-link-input"
                placeholder="https://duong-dan-bai-lam-cua-ban"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                disabled={submitting}
              />
            )}

            {assignment.submissionType === SubmissionType.FILE && (
              <div className="learning-hud-file-upload">
                <input
                  type="file"
                  id="file-upload"
                  className="learning-hud-file-input"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  disabled={submitting}
                />
                <label htmlFor="file-upload" className="learning-hud-file-label">
                  <Upload size={24} />
                  {selectedFile ? selectedFile.name : 'Chọn tệp để tải lên'}
                </label>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="learning-hud-upload-progress">
                    <div
                      className="learning-hud-upload-bar"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="learning-hud-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="learning-hud-spinner small" />
                  Đang nộp...
                </>
              ) : (
                <>
                  <Send size={18} />
                  {newestSubmission ? 'Nộp Lại' : 'Nộp Bài'}
                </>
              )}
            </button>
          </form>

          <div className="learning-hud-submission-note">
            <p>
              💡 Bạn có thể nộp lại nếu bài chưa đạt. Mentor sẽ chấm bài nộp mới nhất.
            </p>
          </div>
        </div>
        );
      })()}
      {readOnly && (
        <div className="learning-hud-submission-note">
          <p>
            Chế độ xem trước: phần nộp bài được tắt. Học viên sẽ thấy biểu mẫu nộp bài khi tham gia khóa học.
          </p>
        </div>
      )}
    </div>
  );
};

export default AssignmentViewer;
