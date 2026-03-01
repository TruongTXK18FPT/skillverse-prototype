import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  Link as LinkIcon,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  History,
  ArrowLeft,
  Award,
  Calendar,
  Info,
  Target,
  CheckSquare,
  Eye,
  AlertTriangle
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
  buildCourseLearningDestination,
  CourseLearningLocationState,
  readStoredCourseLearningReturnContext,
} from '../../utils/courseLearningNavigation';
import {
  getSubmissionTimingInfo,
  getSubmissionWorkflowLabel,
  getSubmissionWorkflowTone,
  hasAssignmentDueDate,
  isAssignmentPastDue,
} from '../../utils/assignmentPresentation';
import './AssignmentPage.css';

const AssignmentPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const locationState = (location.state as CourseLearningLocationState | null) ?? null;
  
  const [assignment, setAssignment] = useState<AssignmentDetailDTO | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionDetailDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [submissionText, setSubmissionText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load draft from localStorage
  useEffect(() => {
    if (assignmentId && user?.id) {
      const draftKey = `assignment_draft_${assignmentId}_${user.id}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setSubmissionText(draft.text || '');
          setLinkUrl(draft.link || '');
          setDraftSavedAt(draft.savedAt || null);
          setDraftDirty(false);
        } catch (e) {
          console.error('Failed to load draft:', e);
        }
      }
    }
  }, [assignmentId, user?.id]);

  useEffect(() => {
    loadData();
  }, [assignmentId, user?.id]);

  const loadData = async () => {
    if (!assignmentId || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [assignmentData, submissionsData] = await Promise.all([
        getAssignmentById(parseInt(assignmentId)),
        getMySubmissions(parseInt(assignmentId))
      ]);
      setAssignment(assignmentData);
      setSubmissions(submissionsData);
    } catch (err: any) {
      setError(getFriendlyAssignmentError(err?.response?.data?.message || 'Failed to load assignment'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      newestSubmission &&
      (newestSubmission.status === SubmissionStatus.PENDING ||
        newestSubmission.status === SubmissionStatus.LATE_PENDING)
    ) {
      setError('Bài nộp gần nhất đang chờ mentor chấm. Bạn chưa thể nộp lại lúc này.');
      return;
    }
    if (newestSubmission?.isPassed === true) {
      setError('Bạn đã đạt yêu cầu ở bài tập này. Không cần nộp lại.');
      return;
    }
    setShowConfirmModal(true); // Show confirmation first
  };

  const confirmSubmit = async () => {
    if (!assignment || !user?.id) return;

    setShowConfirmModal(false);
    setSubmitting(true);
    setError(null);
    setSuccess(null);

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
        setUploadProgress(10);
        const mediaResult = await uploadMedia(selectedFile, user.id);
        setUploadProgress(100);
        submissionData.fileMediaId = mediaResult.id;
      }

      await submitAssignment(parseInt(assignmentId!), submissionData);

      setSuccess('Đã nộp bài thành công.');
      setSubmissionText('');
      setLinkUrl('');
      setSelectedFile(null);
      setUploadProgress(0);
      setDraftSavedAt(null);
      setDraftDirty(false);
      
      // Clear draft from localStorage
      const draftKey = `assignment_draft_${assignmentId}_${user.id}`;
      localStorage.removeItem(draftKey);
      
      // Reload submissions
      await loadData();
    } catch (err: any) {
      setError(getFriendlyAssignmentError(err?.response?.data?.message || 'Failed to submit assignment'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleSubmissionTextChange = (value: string) => {
    setSubmissionText(value);
    setDraftDirty(true);
    setError(null);
    setSuccess(null);
  };

  const handleLinkUrlChange = (value: string) => {
    setLinkUrl(value);
    setDraftDirty(true);
    setError(null);
    setSuccess(null);
  };

  const handleSaveDraft = () => {
    if (!assignmentId || !user?.id) {
      return;
    }

    const draftKey = `assignment_draft_${assignmentId}_${user.id}`;
    const text = submissionText.trim();
    const link = linkUrl.trim();

    if (!text && !link) {
      localStorage.removeItem(draftKey);
      setDraftSavedAt(null);
      setDraftDirty(false);
      setSuccess('Đã xóa nháp trống.');
      return;
    }

    const savedAt = new Date().toISOString();
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        text: submissionText,
        link: linkUrl,
        savedAt
      })
    );
    setDraftSavedAt(savedAt);
    setDraftDirty(false);
    setSuccess('Đã lưu nháp.');
  };

  const getFriendlyAssignmentError = (message?: string) => {
    switch (message) {
      case 'USER_NOT_ENROLLED':
        return 'Bạn chưa có quyền nộp bài cho khóa học này.';
      case 'SUBMISSION_PENDING_GRADING':
        return 'Bài nộp gần nhất đang chờ mentor chấm. Bạn chưa thể nộp tiếp lúc này.';
      case 'ASSIGNMENT_ALREADY_PASSED':
        return 'Bạn đã đạt yêu cầu ở bài tập này.';
      case 'MEDIA_NOT_FOUND':
        return 'Không tìm thấy tệp đã tải lên. Hãy thử chọn lại tệp.';
      default:
        return message || 'Đã xảy ra lỗi khi xử lý bài nộp.';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasMeaningfulCriteriaThreshold = (passingPoints?: number | null) =>
    passingPoints != null && Number(passingPoints) > 0;

  const hasDueDate = hasAssignmentDueDate(assignment?.dueAt);
  const isDueDatePassed = isAssignmentPastDue(assignment?.dueAt);
  const newestSubmission = submissions.find(s => s.isNewest);
  const supportsDraftSave = assignment?.submissionType === SubmissionType.TEXT || assignment?.submissionType === SubmissionType.LINK;
  const submissionBlockedByPending =
    newestSubmission?.status === SubmissionStatus.PENDING ||
    newestSubmission?.status === SubmissionStatus.LATE_PENDING;
  const submissionBlockedByPass = newestSubmission?.isPassed === true;
  const canSubmitAnotherAttempt = !submissionBlockedByPending && !submissionBlockedByPass;
  const canSaveDraft =
    canSubmitAnotherAttempt && supportsDraftSave && Boolean(submissionText.trim() || linkUrl.trim());
  const submissionTypeLabel = assignment?.submissionType === SubmissionType.TEXT
    ? 'Văn bản'
    : assignment?.submissionType === SubmissionType.LINK
      ? 'Liên kết'
      : 'Tệp tải lên';
  
  // Determine overall status
  const getAssignmentStatus = () => {
    if (!newestSubmission) return { text: 'Chưa nộp', icon: <AlertTriangle size={18} />, color: 'warning' };
    if (newestSubmission.status === SubmissionStatus.GRADED) {
      return { text: 'Đã chấm', icon: <CheckCircle size={18} />, color: 'success' };
    }
    return { text: 'Đã nộp', icon: <Clock size={18} />, color: 'pending' };
  };

  const status = getAssignmentStatus();
  const newestSubmissionTiming = newestSubmission
    ? getSubmissionTimingInfo(assignment?.dueAt, newestSubmission.isLate)
    : null;

  const handleBackToCourse = useCallback(() => {
    const returnContext = locationState?.courseId
      ? locationState
      : readStoredCourseLearningReturnContext();

    if (returnContext?.courseId) {
      navigate(buildCourseLearningDestination(returnContext), { state: returnContext });
      return;
    }

    navigate(-1);
  }, [locationState, navigate]);

  if (loading) {
    return (
      <div className="assignment-page">
        <div className="assignment-loading">
          <div className="loading-spinner"></div>
          <p>Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="assignment-page">
        <div className="assignment-error">
          <AlertCircle size={48} />
          <h2>Assignment not found</h2>
          <button onClick={handleBackToCourse} className="btn-back">
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-page">
      {/* Header Navigation */}
      <div className="assignment-nav">
        <button onClick={handleBackToCourse} className="btn-back-nav">
          <ArrowLeft size={20} />
          <span>Quay lại khóa học</span>
        </button>
      </div>

      <div className="assignment-container">
        <div className="assignment-main-column">
          {/* Title Section with Status */}
          <div className="assignment-header">
            <div className="header-top">
              <h1>{assignment.title}</h1>
              <div className={`assignment-overall-status assignment-overall-status--${status.color}`}>
                {status.icon}
                <span>{status.text}</span>
              </div>
            </div>

            {/* Critical Metadata Cards */}
            <div className="assignment-critical-info">
              <div className={`info-card ${assignment.isRequired !== false ? 'required' : 'optional'}`}>
                <AlertCircle size={16} />
                <div>
                  <strong>{assignment.isRequired !== false ? 'BẮT BUỘC' : 'TÙY CHỌN'}</strong>
                  <p>{assignment.isRequired !== false ? 'Bài tập này là bắt buộc' : 'Bài tập không bắt buộc'}</p>
                </div>
              </div>
              
              <div className="info-card points">
                <Award size={16} />
                <div>
                  <strong>{assignment.maxScore} ĐIỂM</strong>
                  <p>Ảnh hưởng đến điểm tổng kết</p>
                </div>
              </div>
              
              {hasDueDate && assignment.dueAt && (
                <div className={`info-card deadline ${isDueDatePassed ? 'overdue' : ''}`}>
                  <Calendar size={16} />
                  <div>
                    <strong>Hạn nộp</strong>
                    <p>{formatDate(assignment.dueAt)}</p>
                    {isDueDatePassed && <span className="overdue-label">Đã quá hạn</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Type */}
            <div className="assignment-meta">
              <div className="meta-item">
                {assignment.submissionType === SubmissionType.TEXT && <FileText size={18} />}
                {assignment.submissionType === SubmissionType.LINK && <LinkIcon size={18} />}
                {assignment.submissionType === SubmissionType.FILE && <Upload size={18} />}
                <span>Hình thức nộp: {submissionTypeLabel}</span>
              </div>
            </div>
          </div>

          {/* Learning Outcome Section */}
          {assignment.learningOutcome && (
            <div className="learning-outcome-section">
              <div className="section-header">
                <Target size={18} />
                <h2>Mục tiêu bài tập</h2>
              </div>
              <div className="section-content">
                <p className="outcome-text">{assignment.learningOutcome}</p>
              </div>
            </div>
          )}

          {/* Grading Criteria Section */}
          {assignment.gradingCriteria && (
            <div className="grading-criteria-section">
              <div className="section-header">
                <CheckSquare size={18} />
                <h2>Tiêu chí chấm điểm</h2>
              </div>
              <div className="section-content">
                <div dangerouslySetInnerHTML={{ __html: assignment.gradingCriteria }} />
              </div>
            </div>
          )}

          {/* Instructions/Description */}
          <div className="assignment-instructions">
            <div className="section-header">
              <Info size={18} />
              <h2>Yêu cầu bài tập</h2>
            </div>
            <div className="instructions-content">
              {assignment.description ? (
                <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
              ) : (
                <div className="placeholder-content">
                  <h3>Yêu cầu chính:</h3>
                  <ul>
                    <li>Hoàn thành các task được giao trong bài tập</li>
                    <li>Đảm bảo code sạch và dễ đọc</li>
                  </ul>
                  <h3>Lưu ý:</h3>
                  <ul>
                    <li>Kiểm tra kỹ trước khi nộp</li>
                    <li>Đọc kỹ tiêu chí chấm điểm</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="submission-card">
            <div className="submission-card-header">
              <h2>Nộp bài tập</h2>
              <p className="submission-card-intro">
                Chuẩn bị bài làm cẩn thận, lưu nháp khi cần và gửi bản hoàn chỉnh cho mentor.
              </p>
            </div>

            {/* Current Status */}
            {newestSubmission && (
              <div className={`current-status current-status--${getSubmissionWorkflowTone(newestSubmission.status)}`}>
                {newestSubmission.status === SubmissionStatus.GRADED ? (
                  <CheckCircle size={20} />
                ) : (
                  <Clock size={20} />
                )}
                <div>
                  <strong>Trạng thái: {getSubmissionWorkflowLabel(newestSubmission.status)}</strong>
                  <div className="current-status-meta">
                    {newestSubmission.score !== undefined && newestSubmission.score !== null && (
                      <p>Điểm: {newestSubmission.score}/{assignment.maxScore}</p>
                    )}
                    {newestSubmissionTiming && (
                      <span className={`submission-timing-chip ${newestSubmissionTiming.tone}`}>
                        {newestSubmissionTiming.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Alerts */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Draft Saved Indicator */}
            {supportsDraftSave && canSubmitAnotherAttempt && (
              <div className={`draft-indicator ${draftDirty ? 'draft-pending' : ''}`}>
                <span>
                  {draftDirty
                    ? 'Có thay đổi chưa lưu'
                    : draftSavedAt
                      ? `Nháp đã lưu lúc ${formatDate(draftSavedAt)}`
                      : 'Bạn chưa lưu nháp'}
                </span>
              </div>
            )}

            {submissionBlockedByPending && (
              <div className="assignment-submission-gate assignment-submission-gate--pending">
                <Clock size={20} />
                <div>
                  <strong>Bài nộp gần nhất đang chờ chấm</strong>
                  <p>Bạn sẽ có thể nộp lại sau khi mentor chấm xong, nếu kết quả chưa đạt.</p>
                </div>
              </div>
            )}

            {submissionBlockedByPass && (
              <div className="assignment-submission-gate assignment-submission-gate--passed">
                <CheckCircle size={20} />
                <div>
                  <strong>Bạn đã hoàn thành bài tập này</strong>
                  <p>Không cần nộp lại. Bạn có thể xem lại bài nộp và nhận xét ở phần bên dưới.</p>
                </div>
              </div>
            )}

            {/* Submission Form */}
            {canSubmitAnotherAttempt && (
            <form onSubmit={handleSubmit} className="submission-form">
              {assignment.submissionType === SubmissionType.TEXT && (
                <div className="form-group">
                  <label htmlFor="submission-text">Câu trả lời của bạn</label>
                  <textarea
                    id="submission-text"
                    value={submissionText}
                    onChange={(e) => handleSubmissionTextChange(e.target.value)}
                    placeholder="Viết câu trả lời, mô tả cách làm hoặc đính kèm hướng dẫn cần thiết..."
                    rows={10}
                    disabled={submitting}
                  />
                </div>
              )}

              {assignment.submissionType === SubmissionType.LINK && (
                <div className="form-group">
                  <label htmlFor="link-url">Link bài nộp</label>
                  <input
                    type="url"
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => handleLinkUrlChange(e.target.value)}
                    placeholder="https://github.com/..., https://drive.google.com/..., ..."
                    disabled={submitting}
                  />
                </div>
              )}

              {assignment.submissionType === SubmissionType.FILE && (
                <div className="form-group">
                  <label htmlFor="file-upload">Tải file lên</label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileChange}
                      disabled={submitting}
                    />
                    {selectedFile && (
                      <div className="file-preview">
                        <FileText size={16} />
                        <span>{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="upload-progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Reassurance Message - Prominent Position */}
              <div className="reassurance-box">
                <p>
                  <strong>Bạn có thể nộp lại nếu bài chưa đạt.</strong><br/>
                  Mentor sẽ chấm bài nộp mới nhất của bạn sau mỗi lần gửi hợp lệ.
                </p>
              </div>

              {hasDueDate && isDueDatePassed && (
                <div className="warning-box">
                  <p>
                    Đã quá hạn nộp. Bài nộp trễ có thể bị trừ điểm.
                  </p>
                </div>
              )}

              <div className={`submission-action-row ${supportsDraftSave ? 'with-draft' : 'single-action'}`}>
                {supportsDraftSave && (
                  <button
                    type="button"
                    className="btn-draft"
                    onClick={handleSaveDraft}
                    disabled={submitting || !canSaveDraft}
                  >
                    Lưu nháp
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting || (assignment.submissionType === SubmissionType.TEXT && !submissionText.trim()) ||
                           (assignment.submissionType === SubmissionType.LINK && !linkUrl.trim()) ||
                           (assignment.submissionType === SubmissionType.FILE && !selectedFile)}
                >
                  {submitting ? (
                    <>
                      <div className="spinner-small"></div>
                      Đang nộp...
                    </>
                  ) : (
                    'Nộp bài tập'
                  )}
                </button>
              </div>
            </form>
            )}
          </div>

          {/* Submission Preview */}
          {newestSubmission && (
            <div className="submission-preview-section">
              <div className="section-header" onClick={() => setShowPreview(!showPreview)}>
                <Eye size={18} />
                <h3>Bài nộp gần nhất</h3>
                <button className="toggle-btn">{showPreview ? '▲' : '▼'}</button>
              </div>
              {showPreview && (
                <div className="preview-content">
                  <div className="preview-meta">
                    <span>Nộp lúc: {formatDate(newestSubmission.submittedAt)}</span>
                    {newestSubmission.score !== undefined && newestSubmission.score !== null && (
                      <span className="preview-score">
                        Điểm: {newestSubmission.score}/{assignment.maxScore}
                      </span>
                    )}
                    {newestSubmissionTiming && (
                      <span className={`submission-timing-chip ${newestSubmissionTiming.tone}`}>
                        {newestSubmissionTiming.text}
                      </span>
                    )}
                  </div>
                  <div className="preview-body">
                    {newestSubmission.submissionText && (
                      <div className="submitted-text">{newestSubmission.submissionText}</div>
                    )}
                    {newestSubmission.linkUrl && (
                      <a href={newestSubmission.linkUrl} target="_blank" rel="noopener noreferrer">
                        {newestSubmission.linkUrl}
                      </a>
                    )}
                  </div>
                  {newestSubmission.feedback && (
                    <div className="preview-feedback">
                      <strong>Nhận xét tổng thể:</strong>
                      <p>{newestSubmission.feedback}</p>
                      {newestSubmission.gradedByName && (
                        <span className="grader-name">Người chấm: {newestSubmission.gradedByName}</span>
                      )}
                    </div>
                  )}
                  {newestSubmission.criteriaScores && newestSubmission.criteriaScores.length > 0 && newestSubmission.status === SubmissionStatus.GRADED && (
                    <div className="criteria-breakdown">
                      <strong>Chi tiết rubric</strong>
                      <div className="criteria-breakdown-list">
                        {newestSubmission.criteriaScores.map((cs) => {
                          const hasThreshold = hasMeaningfulCriteriaThreshold(cs.passingPoints);
                          const breakdownState = hasThreshold ? (cs.passed ? 'passed' : 'failed') : '';

                          return (
                          <div key={cs.criteriaId} className={`criteria-breakdown-item ${breakdownState}`}>
                            <div className="criteria-breakdown-header">
                              <span className="criteria-breakdown-name">{cs.criteriaName}</span>
                              <span className="criteria-breakdown-score">
                                {cs.score}/{cs.maxPoints}
                                {hasThreshold && ` | Đạt từ ${cs.passingPoints}`}
                              </span>
                            </div>
                            {cs.feedback && (
                              <div className="criteria-breakdown-feedback">{cs.feedback}</div>
                            )}
                          </div>
                        )})}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submission History */}
          {submissions.length > 0 && (
            <div className="submission-history">
              <div className="history-header" onClick={() => setShowHistory(!showHistory)}>
                <h3>
                  <History size={20} />
                  Lịch sử nộp bài ({submissions.length} lần)
                </h3>
                <button className="toggle-btn">
                  {showHistory ? '▲' : '▼'}
                </button>
              </div>
              {showHistory && (
                <div className="history-list">
                  {submissions.map((sub) => {
                    const timingInfo = getSubmissionTimingInfo(assignment?.dueAt, sub.isLate);

                    return (
                      <div key={sub.id} className={`history-item ${sub.isNewest ? 'newest' : ''}`}>
                        <div className="history-item-header">
                          <span className="attempt-number">Lần nộp #{sub.attemptNumber}</span>
                          <span className={`assignment-status-badge assignment-status-badge--${getSubmissionWorkflowTone(sub.status)}`}>
                            {getSubmissionWorkflowLabel(sub.status)}
                          </span>
                          {timingInfo && (
                            <span className={`submission-timing-chip ${timingInfo.tone}`}>
                              {timingInfo.text}
                            </span>
                          )}
                          {sub.isNewest && <span className="newest-badge">Mới nhất</span>}
                        </div>
                        <div className="history-item-meta">
                          <span>Nộp lúc: {formatDate(sub.submittedAt)}</span>
                          {sub.score !== undefined && sub.score !== null && (
                            <span className="score">Điểm: {sub.score}/{assignment.maxScore}</span>
                          )}
                        </div>
                        {sub.feedback && (
                          <div className="feedback">
                            <strong>Nhận xét tổng thể:</strong> {sub.feedback}
                          </div>
                        )}
                        {sub.criteriaScores && sub.criteriaScores.length > 0 && sub.status === SubmissionStatus.GRADED && (
                          <div className="criteria-breakdown">
                            <strong>Chi tiết rubric</strong>
                            <div className="criteria-breakdown-list">
                              {sub.criteriaScores.map((cs) => {
                                const hasThreshold = hasMeaningfulCriteriaThreshold(cs.passingPoints);
                                const breakdownState = hasThreshold ? (cs.passed ? 'passed' : 'failed') : '';

                                return (
                                <div key={cs.criteriaId} className={`criteria-breakdown-item ${breakdownState}`}>
                                  <div className="criteria-breakdown-header">
                                    <span className="criteria-breakdown-name">{cs.criteriaName}</span>
                                    <span className="criteria-breakdown-score">
                                      {cs.score}/{cs.maxPoints}
                                      {hasThreshold && ` | Đạt từ ${cs.passingPoints}`}
                                    </span>
                                  </div>
                                  {cs.feedback && (
                                    <div className="criteria-breakdown-feedback">{cs.feedback}</div>
                                  )}
                                </div>
                              )})}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác nhận nộp bài</h3>
            </div>
            <div className="modal-body">
              <p>Bạn sắp gửi bài nộp hiện tại cho mentor chấm điểm.</p>
              <ul className="modal-checklist">
                <li>Nội dung bài làm đã hoàn chỉnh.</li>
                <li>Bạn đã kiểm tra lại yêu cầu và định dạng nộp bài.</li>
                <li>Nếu cần chỉnh sửa sau này, bạn vẫn có thể nộp lại.</li>
              </ul>
              <p className="modal-note">Hệ thống sẽ ghi nhận lần nộp mới nhất của bạn để mentor chấm.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn-confirm" 
                onClick={confirmSubmit}
              >
                Xác nhận nộp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentPage;
