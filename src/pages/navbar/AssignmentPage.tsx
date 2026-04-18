import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Info,
  Target,
  CheckSquare,
  Eye,
  AlertTriangle,
  Terminal,
  Save,
  Send,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Monitor,
  Check,
  Sparkles,
  User
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
import { requestMentorReview, getAiGradeResult } from '../../services/aiGradingService';
import { downloadFile } from '../../utils/downloadFile';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { uploadMedia } from '../../services/mediaService';
import { useAuth } from '../../context/AuthContext';
import {
  buildCourseLearningDestination,
  CourseLearningLocationState,
  readStoredCourseLearningReturnContext,
} from '../../utils/courseLearningNavigation';
import {
  getSubmissionWorkflowLabel,
} from '../../utils/assignmentPresentation';
import RichTextEditor from '../../components/shared/RichTextEditor';

import './AssignmentPage.css';

const formatRubricPoints = (value?: number | null) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  if (Number.isInteger(numeric)) return String(numeric);
  return numeric.toFixed(2).replace(/\.?0+$/, '');
};

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
  const [showPreview, setShowPreview] = useState(true);
  const [showResubmitModal, setShowResubmitModal] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // If AI graded and failed → show resubmit choice modal instead of confirm modal
    if (newestSubmission?.isAiGraded && newestSubmission.isPassed === false) {
      setShowResubmitModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = async (gradingMode?: 'AI' | 'MENTOR') => {
    if (!assignment || !user?.id) return;

    setShowConfirmModal(false);
    setShowResubmitModal(false);
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const submissionData: AssignmentSubmissionCreateDTO = {};

      if (assignment.submissionType === SubmissionType.TEXT) {
        if (!submissionText.trim()) {
          setError('Vui lòng nhập nội dung bài nộp');
          setSubmitting(false);
          return;
        }
        submissionData.submissionText = submissionText;
      } else if (assignment.submissionType === SubmissionType.LINK) {
        if (!linkUrl.trim()) {
          setError('Vui lòng nhập đường dẫn URL');
          setSubmitting(false);
          return;
        }
        if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
          setError('URL phải bắt đầu bằng http:// hoặc https://');
          setSubmitting(false);
          return;
        }
        submissionData.linkUrl = linkUrl;
      } else if (assignment.submissionType === SubmissionType.FILE) {
        if (!selectedFile) {
          setError('Vui lòng chọn tệp để nộp');
          setSubmitting(false);
          return;
        }
        setUploadProgress(10);
        const mediaResult = await uploadMedia(selectedFile, user.id);
        setUploadProgress(100);
        submissionData.fileMediaId = mediaResult.id;
      }

      if (gradingMode) {
        submissionData.gradingMode = gradingMode;
      }

      await submitAssignment(parseInt(assignmentId!), submissionData);

      setSuccess(gradingMode === 'MENTOR'
        ? 'Đã nộp bài — mentor sẽ chấm thủ công.'
        : 'Đã nộp bài thành công.');
      setSubmissionText('');
      setLinkUrl('');
      setSelectedFile(null);
      setUploadProgress(0);
      setDraftSavedAt(null);
      setDraftDirty(false);

      const draftKey = `assignment_draft_${assignmentId}_${user.id}`;
      localStorage.removeItem(draftKey);

      await loadData();
    } catch (err: any) {
      setError(getFriendlyAssignmentError(err?.response?.data?.message || 'Lỗi khi nộp bài'));
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
      case 'USER_NOT_ENROLLED': return 'Bạn chưa có quyền nộp bài cho khóa học này.';
      case 'SUBMISSION_PENDING_GRADING': return 'Bài nộp gần nhất đang chờ mentor chấm. Bạn chưa thể nộp tiếp lúc này.';
      case 'ASSIGNMENT_ALREADY_PASSED': return 'Bạn đã đạt yêu cầu ở bài tập này.';
      case 'MEDIA_NOT_FOUND': return 'Không tìm thấy tệp đã tải lên. Hãy thử chọn lại tệp.';
      default: return message || 'Đã xảy ra lỗi khi xử lý bài nộp.';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const hasMeaningfulCriteriaThreshold = (passingPoints?: number | null) =>
    passingPoints != null && Number(passingPoints) > 0;

  // DEADCODE: deadline/late feature removed 2026-04-15 — no deadline input in mentor form
  // const hasDueDate = hasAssignmentDueDate(assignment?.dueAt);
  // const isDueDatePassed = isAssignmentPastDue(assignment?.dueAt);
  const newestSubmission = submissions.find(s => s.isNewest);
  const supportsDraftSave = assignment?.submissionType === SubmissionType.TEXT || assignment?.submissionType === SubmissionType.LINK;
  const submissionBlockedByPending =
    newestSubmission?.status === SubmissionStatus.PENDING ||
    newestSubmission?.status === SubmissionStatus.AI_PENDING;
  const submissionBlockedByPass = newestSubmission?.isPassed === true;
  const canSubmitAnotherAttempt = !submissionBlockedByPending && !submissionBlockedByPass;
  const canSaveDraft =
    canSubmitAnotherAttempt && supportsDraftSave && Boolean(submissionText.trim() || linkUrl.trim());
  const submissionTypeLabel = assignment?.submissionType === SubmissionType.TEXT
    ? 'Văn bản' : assignment?.submissionType === SubmissionType.LINK ? 'Liên kết' : 'Tệp tải lên';
  
  const getAssignmentStatus = () => {
    if (!newestSubmission) return { text: 'Chưa nộp', icon: <AlertTriangle size={14} />, tone: 'warning' };
    // AI auto-pass: score + isPassed are set by BE auto-confirm
    if (newestSubmission.isAiGraded && newestSubmission.isPassed === true) {
      return { text: 'Đã đạt', icon: <CheckCircle size={14} />, tone: 'success' };
    }
    if (newestSubmission.status === SubmissionStatus.GRADED || newestSubmission.status === SubmissionStatus.AI_COMPLETED) {
      return { text: 'Đã chấm', icon: <CheckCircle size={14} />, tone: 'success' };
    }
    if (newestSubmission.status === SubmissionStatus.AI_PENDING || (newestSubmission.isAiGraded && newestSubmission.mentorConfirmed === null)) {
      return { text: 'Chờ mentor xác nhận', icon: <Loader2 size={14} className="ap-v2-spin-icon" />, tone: 'ai-pending' };
    }
    return { text: 'Đã nộp', icon: <Clock size={14} />, tone: 'pending' };
  };

  // Stable ref for polling state — avoids stale closure from `newestSubmission`
  const pollingRef = useRef<{ targetId: number | null; intervalId: ReturnType<typeof setInterval> | null }>({
    targetId: null,
    intervalId: null,
  });

  // Poll for AI grading result — runs whenever `submissions` changes
  useEffect(() => {
    // Only poll if this assignment has AI grading enabled
    if (!assignment?.aiGradingEnabled) return;

    const latest = submissions.find(s => s.isNewest);
    const isAiPending = latest?.status === SubmissionStatus.AI_PENDING && !latest?.isAiGraded;

    if (!isAiPending) {
      if (pollingRef.current.intervalId) {
        clearInterval(pollingRef.current.intervalId);
        pollingRef.current = { targetId: null, intervalId: null };
      }
      return;
    }

    if (pollingRef.current.targetId === latest.id) return;

    if (pollingRef.current.intervalId) {
      clearInterval(pollingRef.current.intervalId);
    }
    const targetId = latest.id;
    pollingRef.current = { targetId, intervalId: null };

    pollingRef.current.intervalId = setInterval(async () => {
      if (pollingRef.current.targetId === null) return;
      try {
        const result = await getAiGradeResult(pollingRef.current.targetId);
        if (result.isAiGraded) {
          clearInterval(pollingRef.current.intervalId!);
          pollingRef.current = { targetId: null, intervalId: null };
          const submissionsData = await getMySubmissions(parseInt(assignmentId!));
          setSubmissions(submissionsData);
        }
      } catch {
        // silently ignore polling errors
      }
    }, 10000);

    return () => {
      if (pollingRef.current.intervalId) {
        clearInterval(pollingRef.current.intervalId);
        pollingRef.current = { targetId: null, intervalId: null };
      }
    };
  }, [submissions, assignment?.aiGradingEnabled, assignmentId]);

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
      <div className="ap-v2-loader-view">
        <div className="ap-v2-spinner"></div>
        <p className="ap-v2-loader-text">Đang tải vũ trụ bài tập...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="ap-v2-error-view">
        <AlertCircle size={64} className="ap-v2-error-icon" />
        <h2 className="ap-v2-error-title">Không tìm thấy nhiệm vụ</h2>
        <button onClick={handleBackToCourse} className="ap-v2-btn-outline">
          <ArrowLeft size={18} />
          <span>Quay lại khóa học</span>
        </button>
      </div>
    );
  }

  const status = getAssignmentStatus();
  const rubricCriteria = [...(assignment.criteria ?? [])]
    .sort((left, right) => {
      const leftIndex = left.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = right.orderIndex ?? Number.MAX_SAFE_INTEGER;
      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }
      return (left.id ?? 0) - (right.id ?? 0);
    })
    .map((criteria, index) => {
      const maxPoints = Number(criteria.maxPoints ?? 0);
      const passingRaw = criteria.passingPoints;
      const passingPoints =
        passingRaw == null ? null : Number(passingRaw);

      return {
        ...criteria,
        ordinal: index + 1,
        maxPoints: Number.isFinite(maxPoints) ? maxPoints : 0,
        passingPoints:
          passingPoints != null && Number.isFinite(passingPoints)
            ? passingPoints
            : null,
      };
    });

  const rubricMaxPoints = rubricCriteria.reduce(
    (sum, criteria) => sum + criteria.maxPoints,
    0,
  );

  return (
    <div className="assignment-page-v2">
      <div className="ap-v2-ambient">
        <div className="ap-v2-ambient-left" />
        <div className="ap-v2-ambient-right" />
      </div>

      <div className="ap-v2-nav">
        <button onClick={handleBackToCourse} className="ap-v2-back-btn">
          <ArrowLeft size={18} />
          <span>Quay lại khóa học</span>
        </button>
        <div className="ap-v2-sys-badge">
          <Monitor size={14} />
          <span>ASSIGNMENT_HUD_V2</span>
        </div>
      </div>

      <div className="ap-v2-container">
        <section className="ap-v2-hero">
          <div className="ap-v2-title-block">
            <div className="ap-v2-req-label">
              <div className="ap-v2-req-dot"></div>
              <span className="ap-v2-req-text">
                Nhiệm vụ {assignment.isRequired !== false ? 'Bắt buộc' : 'Tùy chọn'}
              </span>
            </div>
            <h1 className="ap-v2-title">{assignment.title}</h1>

            <div className="ap-v2-tags">
              <div className={`ap-v2-tag ap-v2-tag--${status.tone}`}>
                {status.icon}
                <span>{status.text}</span>
              </div>
              <div className="ap-v2-tag ap-v2-tag--neutral">
                <FileText size={14} />
                <span>{submissionTypeLabel}</span>
              </div>
            </div>
          </div>

          <div className="ap-v2-hero-metrics">
            <article className="ap-v2-hero-metric">
              <Award size={20} className="ap-v2-hero-metric__icon" />
              <span className="ap-v2-hero-metric__label">Điểm tối đa</span>
              <strong className="ap-v2-hero-metric__value">
                {assignment.maxScore}
                <span>pt</span>
              </strong>
            </article>
          </div>
        </section>

        <div className="ap-v2-grid ap-v2-grid--workspace">

          {/* ======================= REQUIREMENTS COLUMN ======================= */}
          <div className="ap-v2-col-left">
            <div className="ap-v2-glass-panel">
              <div className="ap-v2-panel-glow"></div>

              <div className="ap-v2-doc-content">
                {assignment.learningOutcome && (
                  <div className="ap-v2-section ap-v2-section--target">
                    <h3><Target size={16} /> Mục tiêu đạt được</h3>
                    <p>{assignment.learningOutcome}</p>
                  </div>
                )}

                <div className="ap-v2-section ap-v2-section--req">
                  <h3><Info size={16} /> Yêu cầu nhiệm vụ</h3>
                  {assignment.description ? (
                    <div
                      className="ap-v2-rich-content ap-v2-rich-content--req"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(assignment.description) }}
                    />
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#64748b' }}>Chưa có mô tả chi tiết.</p>
                  )}
                </div>

                {rubricCriteria.length > 0 && (
                  <div className="ap-v2-section ap-v2-section--rubric-criteria">
                    <h3><CheckSquare size={16} /> Rubric chấm điểm</h3>

                    <div className="ap-v2-rubric-criteria-head">
                      <span>{rubricCriteria.length} tiêu chí</span>
                      <strong>{formatRubricPoints(rubricMaxPoints)} điểm tối đa</strong>
                    </div>

                    <div className="ap-v2-rubric-criteria-list">
                      {rubricCriteria.map((criteria) => {
                        const hasPassingPoints =
                          criteria.passingPoints != null &&
                          criteria.passingPoints > 0;

                        return (
                          <article key={`criteria-${criteria.id ?? criteria.ordinal}`} className="ap-v2-rubric-criteria-item">
                            <div className="ap-v2-rubric-criteria-top">
                              <span className="ap-v2-rubric-criteria-index">
                                C{criteria.ordinal}
                              </span>

                              <div className="ap-v2-rubric-criteria-main">
                                <strong>
                                  {criteria.name?.trim() || `Tiêu chí ${criteria.ordinal}`}
                                </strong>
                                {criteria.description?.trim() && (
                                  <p>{criteria.description}</p>
                                )}
                              </div>

                              <span className="ap-v2-rubric-criteria-points">
                                {formatRubricPoints(criteria.maxPoints)} điểm
                              </span>
                            </div>

                            <div className="ap-v2-rubric-criteria-meta">
                              <span>
                                {hasPassingPoints
                                  ? `Điểm đạt tối thiểu: ${formatRubricPoints(criteria.passingPoints)} điểm`
                                  : 'Không có ngưỡng điểm tối thiểu riêng'}
                              </span>

                              <span className={`ap-v2-rubric-criteria-required ${criteria.isRequired ? 'is-required' : 'is-optional'}`}>
                                {criteria.isRequired ? 'Bắt buộc' : 'Khuyến nghị'}
                              </span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assignment.gradingCriteria && (
                  <div className="ap-v2-section ap-v2-section--rubric">
                    <h3><CheckSquare size={16} /> Tiêu chí chấm điểm</h3>
                    <div
                      className="ap-v2-rubric-box ap-v2-rich-content"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(assignment.gradingCriteria) }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================= RIGHT COLUMN ======================= */}
          <div className="ap-v2-col-right">
            <div className="ap-v2-editor-sticky">
            
            {error && (
              <div className="ap-v2-alert ap-v2-alert--error">
                <AlertCircle size={20} className="ap-v2-alert-icon" />
                <span className="ap-v2-alert-text">{error}</span>
              </div>
            )}
            {success && (
              <div className="ap-v2-alert ap-v2-alert--success">
                <CheckCircle size={20} className="ap-v2-alert-icon" />
                <span className="ap-v2-alert-text">{success}</span>
              </div>
            )}

            {!canSubmitAnotherAttempt && newestSubmission && !submissionBlockedByPass && submissionBlockedByPending && (
              <div className="ap-v2-blocker">
                <div className="ap-v2-blocker-icon-box">
                  <Clock size={32} style={{ color: '#06b6d4' }} />
                </div>
                <h3>Bài nộp đang được xử lý</h3>
                <p>Hệ thống đã ghi nhận bài nộp và chuyển đến Mentor. Bạn sẽ có thể thao tác lại sau khi có kết quả.</p>
              </div>
            )}

            {canSubmitAnotherAttempt && (
              <form onSubmit={handleSubmit} className="ap-v2-form">
                <div className="ap-v2-terminal">
                  
                  <div className="ap-v2-terminal-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="ap-v2-mac-btns">
                        <div className="ap-v2-mac-btn"></div>
                        <div className="ap-v2-mac-btn"></div>
                        <div className="ap-v2-mac-btn"></div>
                      </div>
                      <span className="ap-v2-terminal-filename">
                        {assignment.submissionType === SubmissionType.TEXT ? 'editor.txt' : 
                         assignment.submissionType === SubmissionType.LINK ? 'hyperlink.md' : 'upload_module.sh'}
                      </span>
                    </div>
                  </div>

                  <div className="ap-v2-terminal-body">
                    {assignment.submissionType === SubmissionType.TEXT && (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '350px' }}>
                        <RichTextEditor
                          initialContent={submissionText}
                          onChange={handleSubmissionTextChange}
                          placeholder="// Bắt đầu gõ đáp án của bạn tại đây..."
                          userId={user?.id}
                        />
                      </div>
                    )}

                    {assignment.submissionType === SubmissionType.LINK && (
                      <div className="ap-v2-input-pad">
                        <label className="ap-v2-input-label">Nhập địa chỉ Link</label>
                        <div className="ap-v2-link-wrapper">
                          <LinkIcon size={20} className="ap-v2-link-icon" />
                          <input
                            type="url"
                            className="ap-v2-link-input"
                            value={linkUrl}
                            onChange={(e) => handleLinkUrlChange(e.target.value)}
                            placeholder="https://github.com/..."
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    )}

                    {assignment.submissionType === SubmissionType.FILE && (
                      <div className="ap-v2-input-pad">
                        <label className="ap-v2-input-label">Đính kèm File</label>
                        <div className="ap-v2-dropzone">
                           <input
                            type="file"
                            className="ap-v2-file-input"
                            onChange={handleFileChange}
                            disabled={submitting}
                          />
                          {!selectedFile ? (
                            <div className="ap-v2-dz-empty">
                              <Upload size={32} className="ap-v2-dz-icon" />
                              <span className="ap-v2-dz-text">Kéo thả tệp vào đây hoặc Click để duyệt</span>
                            </div>
                          ) : (
                            <div className="ap-v2-dz-filled">
                              <div className="ap-v2-dz-file-icon"><FileText size={32} /></div>
                              <span className="ap-v2-dz-filename">{selectedFile.name}</span>
                              <span className="ap-v2-dz-hint">Click để chọn tệp khác</span>
                            </div>
                          )}
                        </div>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="ap-v2-upload-track">
                            <div className="ap-v2-upload-bar" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        )}
                        <div className="ap-v2-dz-hint" style={{ color: 'var(--hud-text-dim)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                          PDF, DOCX, DOC • Tối đa 10MB
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ap-v2-terminal-footer">
                    <div className={`ap-v2-draft-status ${draftDirty ? 'ap-v2-draft-status--dirty' : draftSavedAt ? 'ap-v2-draft-status--saved' : ''}`}>
                      {supportsDraftSave && canSubmitAnotherAttempt && (
                        draftDirty ? (
                          <span>● Unsaved changes</span>
                        ) : draftSavedAt ? (
                          <span>✔ Saved at {formatDate(draftSavedAt).split(' ')[1]}</span>
                        ) : (
                          <span>File clean / No draft</span>
                        )
                      )}
                    </div>
                    
                    <div className="ap-v2-actions">
                      {supportsDraftSave && (
                        <button
                          type="button"
                          className="ap-v2-btn ap-v2-btn-draft"
                          onClick={handleSaveDraft}
                          disabled={submitting || !canSaveDraft}
                        >
                          <Save size={16} /> Lưu nháp
                        </button>
                      )}
                      
                      <button
                        type="submit"
                        className="ap-v2-btn ap-v2-btn-submit"
                        disabled={submitting || (assignment.submissionType === SubmissionType.TEXT && !submissionText.trim()) ||
                                 (assignment.submissionType === SubmissionType.LINK && !linkUrl.trim()) ||
                                 (assignment.submissionType === SubmissionType.FILE && !selectedFile)}
                      >
                        {submitting ? (
                          <><Loader2 size={16} className="ap-v2-spin" /> Đang xử lý...</>
                        ) : (
                          <><Send size={16} /> Bắt đầu Submit</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>

        {(newestSubmission || submissions.length > 0) && (
          <section className="ap-v2-logbook">
            {newestSubmission && (
              <div className="ap-v2-prev-card">
                <div className="ap-v2-prev-header" onClick={() => setShowPreview(!showPreview)}>
                  <div className="ap-v2-prev-header-left">
                    <div className={`ap-v2-prev-icon-box ap-v2-prev-icon-box--${newestSubmission.status === SubmissionStatus.GRADED || newestSubmission.status === SubmissionStatus.AI_COMPLETED ? 'success' : newestSubmission.status === SubmissionStatus.AI_PENDING ? 'ai-pending' : 'pending'}`}>
                      {newestSubmission.status === SubmissionStatus.GRADED || newestSubmission.status === SubmissionStatus.AI_COMPLETED ? (
                        <CheckCircle size={24} />
                      ) : newestSubmission.status === SubmissionStatus.AI_PENDING ? (
                        <Sparkles size={24} />
                      ) : (
                        <Clock size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="ap-v2-prev-title">Bài nộp gần nhất</h3>
                      <p className="ap-v2-prev-subtitle">Trạng thái: <span style={{ color: '#e2e8f0' }}>{getSubmissionWorkflowLabel(newestSubmission.status)}</span></p>
                    </div>
                  </div>
                  <div style={{ color: '#64748b' }}>
                    {showPreview ? <Eye size={20} /> : <Eye size={20} style={{ opacity: 0.5 }} />}
                  </div>
                </div>

                {showPreview && (
                  <div className="ap-v2-prev-body">
                    <div className="ap-v2-prev-tags">
                      <div className="ap-v2-ptag">
                        <span>Nộp lúc:</span> {formatDate(newestSubmission.submittedAt)}
                      </div>
                      {newestSubmission.score !== undefined && newestSubmission.score !== null && (
                        <div className="ap-v2-ptag ap-v2-ptag--score">
                          Điểm: {newestSubmission.score}/{assignment.maxScore}
                        </div>
                      )}
                    </div>

                    <div className="ap-v2-prev-content-box">
                      {newestSubmission.submissionText && (
                        <div style={{ whiteSpace: 'pre-wrap' }}
                             dangerouslySetInnerHTML={{ __html: sanitizeHtml(newestSubmission.submissionText) }} />
                      )}
                      {newestSubmission.linkUrl && (
                        <a href={newestSubmission.linkUrl} target="_blank" rel="noopener noreferrer" className="ap-v2-prev-link">
                          <LinkIcon size={16} />
                          {newestSubmission.linkUrl}
                        </a>
                      )}
                      {newestSubmission.fileMediaUrl && (
                        <button
                          onClick={() => downloadFile(
                            `/api/assignments/submissions/${newestSubmission.id}/download`,
                            newestSubmission.submissionText || 'file_nop'
                          )}
                          className="ap-v2-prev-link"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: 'inherit' }}
                        >
                          <Upload size={16} />
                          Xem file đã nộp
                        </button>
                      )}
                    </div>

                    {/* Mentor feedback — NOT shown when AI auto-confirmed (feedback == aiFeedback) */}
                    {newestSubmission.feedback && newestSubmission.mentorConfirmed !== true && (
                      <div className="ap-v2-feedback-box">
                        <div className="ap-v2-fb-title"><Terminal size={14} /> Nhận xét tổng thể</div>
                        <div className="ap-v2-fb-text">{newestSubmission.feedback}</div>
                        {newestSubmission.gradedByName ? (
                          <div className="ap-v2-fb-mentor">Mentor: {newestSubmission.gradedByName}</div>
                        ) : newestSubmission.isAiGraded ? (
                          <div className="ap-v2-fb-mentor">AI đã chấm</div>
                        ) : null}
                      </div>
                    )}

                    {/* AI Grading Results — shown whenever AI has graded */}
                    {newestSubmission.isAiGraded && newestSubmission.aiScore != null && (
                      <div className="ap-v2-feedback-box ap-v2-feedback-box--ai">
                        <div className="ap-v2-fb-title">
                          <Sparkles size={14} /> Điểm AI
                        </div>
                        <div className="ap-v2-fb-text">
                          Điểm AI: <strong>{newestSubmission.aiScore}/{assignment.maxScore}</strong>
                        </div>
                        {newestSubmission.aiFeedback && (
                          <div className="ap-v2-fb-text" style={{ marginTop: '8px' }}>
                            {newestSubmission.aiFeedback}
                          </div>
                        )}
                        {newestSubmission.aiGradeAttemptCount != null && newestSubmission.aiGradeAttemptCount > 0 && (
                          <div className="ap-v2-fb-mentor" style={{ marginTop: '4px' }}>
                            AI đã chấm {newestSubmission.aiGradeAttemptCount} lần
                          </div>
                        )}
                        {/* Dispute button — shown when AI graded but mentor not confirmed */}
                        {newestSubmission.mentorConfirmed === null && newestSubmission.disputeFlag !== true && (
                          <button
                            className="ap-v2-btn ap-v2-btn--dispute"
                            style={{ marginTop: '12px' }}
                            onClick={async () => {
                              if (!confirm('Bạn có chắc muốn yêu cầu mentor xem xét lại bài này?')) return;
                              try {
                                await requestMentorReview(newestSubmission.id, null);
                                setSuccess('Đã gửi yêu cầu. Mentor sẽ xem xét lại.');
                                await loadData();
                              } catch (err: any) {
                                setError(err?.response?.data?.message || 'Gửi yêu cầu thất bại.');
                              }
                            }}
                          >
                            🔄 Yêu cầu Mentor xem xét
                          </button>
                        )}
                        {/* Already disputed */}
                        {newestSubmission.disputeFlag === true && (
                          <div className="ap-v2-alert ap-v2-alert--warning" style={{ marginTop: '12px', padding: '8px 12px', fontSize: '0.85rem' }}>
                            ⚠️ Bạn đã yêu cầu mentor xem xét lại bài này.
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Rubric Results — shown whenever AI has graded (auto or manual) */}
                    {newestSubmission.isAiGraded && newestSubmission.criteriaScores && newestSubmission.criteriaScores.length > 0 && (
                      <div className="ap-v2-rubric-analysis">
                        <h4>Phân tích Rubric</h4>
                        <div className="ap-v2-rubric-list">
                          {newestSubmission.criteriaScores.map((cs) => {
                            const hasThreshold = hasMeaningfulCriteriaThreshold(cs.passingPoints);
                            const passed = cs.passed;
                            return (
                              <div key={cs.criteriaId} className={`ap-v2-rubric-item ${hasThreshold ? (passed ? 'ap-v2-rubric-item--pass' : 'ap-v2-rubric-item--fail') : 'ap-v2-rubric-item--neutral'}`}>
                                <div className="ap-v2-rubric-header">
                                  <span className="ap-v2-rubric-name">{cs.criteriaName}</span>
                                  <span className={`ap-v2-rubric-score ap-v2-rubric-score--${hasThreshold ? (passed ? 'pass' : 'fail') : 'neutral'}`}>
                                    {cs.score}/{cs.maxPoints} pts
                                  </span>
                                </div>
                                {hasThreshold && (
                                  <div className="ap-v2-rubric-thresh">Đạt từ: {cs.passingPoints} pts</div>
                                )}
                                {cs.feedback && (
                                  <div className="ap-v2-rubric-fb">{cs.feedback}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {submissions.length > 0 && (
              <div className="ap-v2-history">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="ap-v2-history-toggle"
                >
                  <History size={16} /> Lịch sử hệ thống ({submissions.length})
                  {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {showHistory && (
                  <div className="ap-v2-timeline">
                    {submissions.map((sub) => {
                      return (
                        <div key={sub.id} className={`ap-v2-timeline-item ${sub.isNewest ? 'ap-v2-timeline-item--latest' : ''}`}>
                          <div className="ap-v2-tl-header">
                            <div className="ap-v2-tl-info">
                              <span className="ap-v2-tl-commit">Lần nộp #{sub.attemptNumber}</span>
                              {sub.isNewest && <span className="ap-v2-tl-latest-badge">Mới nhất</span>}
                            </div>
                            <span className="ap-v2-tl-date">{formatDate(sub.submittedAt)}</span>
                          </div>

                          <div className="ap-v2-tl-meta">
                            <div className={`ap-v2-tl-tag ${
                              sub.status === SubmissionStatus.GRADED || sub.status === SubmissionStatus.AI_COMPLETED
                                ? 'ap-v2-tl-tag--graded'
                                : sub.status === SubmissionStatus.AI_PENDING
                                ? 'ap-v2-tl-tag--ai-pending'
                                : 'ap-v2-tl-tag--pending'
                            }`}>
                              {getSubmissionWorkflowLabel(sub.status)}
                            </div>

                            {sub.score !== undefined && sub.score !== null && (
                              <div className="ap-v2-tl-score" style={{ marginLeft: 'auto' }}>
                                {sub.score} <span>/ {assignment.maxScore}</span>
                              </div>
                            )}

                            {sub.fileMediaUrl && (
                              <button
                                onClick={() => downloadFile(
                                  `/api/assignments/submissions/${sub.id}/download`,
                                  'file_nop'
                                )}
                                className="ap-v2-prev-link"
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                              >
                                <Upload size={14} />
                                Xem file đã nộp
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {showConfirmModal && (
        <div className="ap-v2-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="ap-v2-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-v2-modal-header">
              <h3 className="ap-v2-modal-title"><AlertCircle size={20} /> Xác nhận nộp bài</h3>
              <button className="ap-v2-modal-close" onClick={() => setShowConfirmModal(false)}><X size={20} /></button>
            </div>
            <div className="ap-v2-modal-body">
              <p className="ap-v2-modal-text">
                Bạn sắp gửi file <span className="ap-v2-modal-code">bài tập</span> lên server. Mentor sẽ nhận được bản lưu này.
              </p>
              <div className="ap-v2-modal-list">
                 <div className="ap-v2-modal-li"><Check size={14} /> Nội dung đã hoàn tất</div>
                 <div className="ap-v2-modal-li"><Check size={14} /> Đúng định dạng được yêu cầu</div>
              </div>

              <div className="ap-v2-modal-actions">
                <button className="ap-v2-btn-cancel" onClick={() => setShowConfirmModal(false)}>Return</button>
                <button className="ap-v2-btn-exec" onClick={() => confirmSubmit()}>Execute</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resubmit Choice Modal — shown when AI graded and failed */}
      {showResubmitModal && (
        <div className="ap-v2-modal-overlay" onClick={() => setShowResubmitModal(false)}>
          <div className="ap-v2-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-v2-modal-header">
              <h3 className="ap-v2-modal-title"><AlertCircle size={20} /> Nộp lại bài</h3>
              <button className="ap-v2-modal-close" onClick={() => setShowResubmitModal(false)}><X size={20} /></button>
            </div>
            <div className="ap-v2-modal-body">
              <p className="ap-v2-modal-text">
                Bạn chưa đạt yêu cầu. Hãy chọn cách nộp lại:
              </p>
              <div className="ap-v2-modal-resubmit-choices">
                <button
                  className="ap-v2-resubmit-choice"
                  onClick={() => {
                    setShowResubmitModal(false);
                    setShowConfirmModal(true);
                  }}
                >
                  <Sparkles size={18} />
                  <div>
                    <strong>Nộp lại để AI chấm lại</strong>
                    <span>AI sẽ chấm bài mới tự động</span>
                  </div>
                </button>
                <button
                  className="ap-v2-resubmit-choice"
                  onClick={() => confirmSubmit('MENTOR')}
                >
                  <User size={18} />
                  <div>
                    <strong>Nộp lại để mentor chấm thủ công</strong>
                    <span>Mentor sẽ xem và chấm bài cho bạn</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentPage;
