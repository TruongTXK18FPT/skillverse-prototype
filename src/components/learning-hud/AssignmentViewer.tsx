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
      const submissionsData = readOnly ? [] : await getMySubmissions(assignmentId, user.id);
      setAssignment(assignmentData);
      setSubmissions(submissionsData);
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

      await submitAssignment(assignmentId, submissionData, user.id);

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
      const isPassed = submission.score! >= submission.maxScore * 0.7;
      return (
        <span className={`learning-hud-submission-badge ${isPassed ? 'passed' : 'failed'}`}>
          <CheckCircle size={14} />
          {submission.score}/{submission.maxScore} {isPassed ? 'PASSED' : 'Needs Improvement'}
        </span>
      );
    }
    if (submission.isLate) {
      return (
        <span className="learning-hud-submission-badge late">
          <AlertCircle size={14} />
          Late - Pending Review
        </span>
      );
    }
    return (
      <span className="learning-hud-submission-badge pending">
        <Clock size={14} />
        Pending Review
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

  const isDueDatePassed = assignment?.dueAt
    ? new Date(assignment.dueAt) < new Date()
    : false;

  const newestSubmission = submissions.find(s => s.isNewest);
  const previousSubmissions = submissions.filter(s => !s.isNewest);

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
            Max Score: {assignment.maxScore}
          </span>
          {assignment.dueAt && (
            <span className={`learning-hud-assignment-due ${isDueDatePassed ? 'overdue' : ''}`}>
              <Clock size={16} />
              Due: {formatDate(assignment.dueAt)}
              {isDueDatePassed && ' (Overdue)'}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="learning-hud-assignment-description">
        <h3>Instructions</h3>
        <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
      </div>

      {/* Current Submission Status */}
      {!readOnly && newestSubmission && (
        <div className="learning-hud-current-submission">
          <div className="learning-hud-submission-header">
            <h3>Your Submission (Attempt #{newestSubmission.attemptNumber})</h3>
            {getStatusBadge(newestSubmission)}
          </div>
          <div className="learning-hud-submission-content">
            {newestSubmission.submissionText && (
              <div className="learning-hud-submission-text">
                {newestSubmission.submissionText}
              </div>
            )}
            {newestSubmission.linkUrl && (
              <a
                href={newestSubmission.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="learning-hud-submission-link"
              >
                <LinkIcon size={16} />
                {newestSubmission.linkUrl}
              </a>
            )}
            {newestSubmission.fileMediaUrl && (
              <a
                href={newestSubmission.fileMediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="learning-hud-submission-file"
              >
                <Upload size={16} />
                View Uploaded File
              </a>
            )}
            <div className="learning-hud-submission-meta">
              Submitted: {formatDate(newestSubmission.submittedAt)}
            </div>
          </div>
          {newestSubmission.feedback && (
            <div className="learning-hud-submission-feedback">
              <h4>Mentor Feedback:</h4>
              <p>{newestSubmission.feedback}</p>
              {newestSubmission.gradedByName && (
                <span className="learning-hud-grader">
                  - {newestSubmission.gradedByName}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submission History */}
      {!readOnly && previousSubmissions.length > 0 && (
        <div className="learning-hud-submission-history">
          <button
            className="learning-hud-history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={16} />
            Previous Submissions ({previousSubmissions.length})
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showHistory && (
            <div className="learning-hud-history-list">
              {previousSubmissions.map(sub => (
                <div key={sub.id} className="learning-hud-history-item">
                  <div className="learning-hud-history-header">
                    <span>Attempt #{sub.attemptNumber}</span>
                    {getStatusBadge(sub)}
                  </div>
                  <div className="learning-hud-history-meta">
                    Submitted: {formatDate(sub.submittedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submission Form (Unlimited Resubmissions) */}
      {!readOnly && (
        <div className="learning-hud-submission-form">
        <h3>
          {newestSubmission ? 'Submit New Attempt' : 'Submit Your Work'}
        </h3>
        {isDueDatePassed && (
          <div className="learning-hud-late-warning">
            <AlertCircle size={16} />
            This assignment is past due. Your submission will be marked as late.
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
              placeholder="Enter your submission text..."
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
              placeholder="https://your-work-url.com"
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
                {selectedFile ? selectedFile.name : 'Click to select file'}
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
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit {newestSubmission ? 'New Attempt' : 'Assignment'}
              </>
            )}
          </button>
        </form>

        <div className="learning-hud-submission-note">
          <p>
            💡 Unlimited resubmissions allowed. Only your latest 2 attempts are kept
            (newest + previous). Mentor will grade your newest submission.
          </p>
        </div>
      </div>
      )}
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
