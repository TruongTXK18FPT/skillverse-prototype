import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Upload,
  User,
  Eye,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  AssignmentDetailDTO,
  AssignmentSubmissionDetailDTO,
  AssignmentCriteriaDTO,
  CriteriaScoreDTO,
  SubmissionStatus,
  SubmissionType
} from '../../data/assignmentDTOs';
import { getAssignmentById, getAssignmentSubmissions, gradeSubmission } from '../../services/assignmentService';
import { downloadFile } from '../../utils/downloadFile';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { generateAiGrade, toggleTrustAi } from '../../services/aiGradingService';
import { AiGradingResultDTO } from '../../data/assignmentDTOs';
import { useAuth } from '../../context/AuthContext';
import { useAppToast } from '../../context/ToastContext';
import './assignment-grading.css';

type FilterType = 'all' | 'pending' | 'graded' | 'late' | 'aiProcessing';

interface LocationState {
  courseName?: string;
  courseId?: number;
  moduleName?: string;
  moduleId?: number;
  assignmentName?: string;
  fromGradingDashboard?: boolean;
}

interface GradingWorkspaceState {
  submission: AssignmentSubmissionDetailDTO | null;
  score: string;
  feedback: string;
  criteriaScores: Record<number, string>;
  criteriaFeedback: Record<number, string>;
  expandedCriteriaFeedback: Record<number, boolean>;
  submitting: boolean;
  /** True when mentor has run AI pre-grade and is confirming the result — triggers isAiGrade=true on BE. */
  confirmingAiGrade: boolean;
}

const emptyWorkspaceState = (): GradingWorkspaceState => ({
  submission: null,
  score: '',
  feedback: '',
  criteriaScores: {},
  criteriaFeedback: {},
  expandedCriteriaFeedback: {},
  submitting: false,
  confirmingAiGrade: false,
});

const resolveLearnerName = (userName?: string | null, userId?: number) => {
  const trimmed = userName?.trim();
  if (trimmed && !/^null(?:\s+null)?$/i.test(trimmed)) {
    return trimmed;
  }
  return userId ? `Học viên #${userId}` : 'Học viên chưa cập nhật tên';
};

const getSubmissionTypeLabel = (submissionType: SubmissionType) => {
  switch (submissionType) {
    case SubmissionType.TEXT:
      return 'Văn bản';
    case SubmissionType.LINK:
      return 'Liên kết';
    case SubmissionType.FILE:
      return 'Tệp tải lên';
    default:
      return submissionType;
  }
};

const getCriterionPassingThreshold = (criterion?: Pick<AssignmentCriteriaDTO, 'passingPoints'> | null) => {
  if (criterion?.passingPoints == null || Number(criterion.passingPoints) <= 0) {
    return null;
  }
  return Number(criterion.passingPoints);
};

const MentorGradingPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const toast = useAppToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const gradingWorkspaceRef = useRef<HTMLElement | null>(null);

  const [assignment, setAssignment] = useState<AssignmentDetailDTO | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionDetailDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [descriptionCollapsed, setDescriptionCollapsed] = useState(false);
  const [gradingWorkspace, setGradingWorkspace] = useState<GradingWorkspaceState>(emptyWorkspaceState);
  const [aiGradingResult, setAiGradingResult] = useState<AiGradingResultDTO | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!assignmentId || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [assignmentData, submissionsResponse] = await Promise.all([
        getAssignmentById(Number(assignmentId)),
        getAssignmentSubmissions(Number(assignmentId))
      ]);
      setAssignment(assignmentData);
      setSubmissions(submissionsResponse.content);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNumberInputWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    event.currentTarget.blur();
  };

  const visibleCriteria = assignment?.criteria ?? [];
  const requiredCriteria = visibleCriteria.filter((criterion) => criterion.isRequired);
  const hasCriteria = visibleCriteria.length > 0;
  const hasRequiredCriterionThresholds = requiredCriteria.some((criterion) => getCriterionPassingThreshold(criterion) != null);
  const effectivePassingScore = assignment?.passingScore ?? assignment?.maxScore;
  const activeSubmission = gradingWorkspace.submission;

  const criteriaValidation = useMemo(() => {
    const errors: Record<number, string> = {};
    let total = 0;
    let filledCount = 0;
    let requiredPassed = true;
    const criteriaWithIds = visibleCriteria.filter(
      (criterion): criterion is AssignmentCriteriaDTO & { id: number } => criterion.id != null
    );

    if (!hasCriteria) {
      return {
        errors,
        total,
        missingCount: 0,
        requiredPassed: true,
        totalExceeds: false,
        criteriaCount: 0,
        hasBlockingError: false
      };
    }

    criteriaWithIds.forEach((criterion) => {
      const rawValue = (gradingWorkspace.criteriaScores[criterion.id] ?? '').trim();
      if (!rawValue) {
        errors[criterion.id] = 'Nhập điểm cho tiêu chí này.';
        if (criterion.isRequired) requiredPassed = false;
        return;
      }

      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) {
        errors[criterion.id] = 'Điểm không hợp lệ.';
        if (criterion.isRequired) requiredPassed = false;
        return;
      }
      if (numericValue < 0) {
        errors[criterion.id] = 'Điểm không được âm.';
        if (criterion.isRequired) requiredPassed = false;
        return;
      }
      if (numericValue > criterion.maxPoints) {
        errors[criterion.id] = `Không được vượt quá ${criterion.maxPoints} điểm.`;
        if (criterion.isRequired) requiredPassed = false;
        return;
      }

      filledCount += 1;
      total += numericValue;
      if (criterion.isRequired) {
        const threshold = getCriterionPassingThreshold(criterion);
        if (threshold != null && numericValue < threshold) requiredPassed = false;
      }
    });

    const totalExceeds = assignment?.maxScore != null && total > assignment.maxScore;
    const missingCount = criteriaWithIds.length - filledCount;
    return {
      errors,
      total,
      missingCount,
      requiredPassed,
      totalExceeds,
      criteriaCount: criteriaWithIds.length,
      hasBlockingError: missingCount > 0 || Object.keys(errors).length > 0 || totalExceeds
    };
  }, [assignment?.maxScore, gradingWorkspace.criteriaScores, hasCriteria, visibleCriteria]);

  const flatScoreValidation = useMemo(() => {
    const rawValue = gradingWorkspace.score.trim();
    if (!rawValue) return { value: null as number | null, error: 'Nhập tổng điểm.' };
    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) return { value: null as number | null, error: 'Tổng điểm không hợp lệ.' };
    if (numericValue < 0) return { value: null as number | null, error: 'Tổng điểm không được âm.' };
    if (assignment?.maxScore != null && numericValue > assignment.maxScore) {
      return { value: numericValue, error: `Tổng điểm không được vượt quá ${assignment.maxScore}.` };
    }
    return { value: numericValue, error: null as string | null };
  }, [assignment?.maxScore, gradingWorkspace.score]);

  const canSubmitGrade = Boolean(
    activeSubmission &&
      !gradingWorkspace.submitting &&
      (hasCriteria
        ? criteriaValidation.criteriaCount > 0 && !criteriaValidation.hasBlockingError
        : !flatScoreValidation.error)
  );

  const openGradingWorkspace = (submission: AssignmentSubmissionDetailDTO) => {
    const criteriaScores: Record<number, string> = {};
    const criteriaFeedback: Record<number, string> = {};
    const expandedCriteriaFeedback: Record<number, boolean> = {};
    submission.criteriaScores?.forEach((criteriaScore) => {
      if (criteriaScore.criteriaId != null) {
        criteriaScores[criteriaScore.criteriaId] = criteriaScore.score?.toString() || '';
        criteriaFeedback[criteriaScore.criteriaId] = criteriaScore.feedback || '';
        if (criteriaScore.feedback?.trim()) {
          expandedCriteriaFeedback[criteriaScore.criteriaId] = true;
        }
      }
    });

    setError(null);
    setAiError(null);

    // If submission has existing AI results, pre-populate them
    if (submission.isAiGraded && submission.aiScore != null) {
      // Reconstruct AiGradingResultDTO from existing submission data
      const existingResult: AiGradingResultDTO = {
        criteriaScores: submission.criteriaScores?.map(cs => ({
          criteriaId: cs.criteriaId,
          criteriaName: cs.criteriaName || '',
          score: cs.score ?? 0,
          maxPoints: cs.maxPoints ?? 0,
          passingPoints: cs.passingPoints ?? 0,
          passed: cs.passed ?? false,
          feedback: cs.feedback || '',
          confidence: null
        })) || [],
        totalScore: submission.aiScore,
        overallFeedback: submission.aiFeedback || '',
        overallConfidence: submission.aiConfidence ?? 0
      };
      setAiGradingResult(existingResult);

      // Pre-fill criteria scores from AI results if not already loaded
      submission.criteriaScores?.forEach((cs) => {
        if (cs.criteriaId != null && !criteriaScores[String(cs.criteriaId)]) {
          criteriaScores[cs.criteriaId] = cs.score?.toString() || '';
        }
        if (cs.criteriaId != null && !criteriaFeedback[cs.criteriaId] && cs.feedback) {
          criteriaFeedback[cs.criteriaId] = cs.feedback;
          expandedCriteriaFeedback[cs.criteriaId] = true;
        }
      });
    } else {
      setAiGradingResult(null);
    }

    setGradingWorkspace({
      submission,
      score: submission.score?.toString() || '',
      feedback: submission.feedback || '',
      criteriaScores,
      criteriaFeedback,
      expandedCriteriaFeedback,
      submitting: false
    });

    window.requestAnimationFrame(() => {
      gradingWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleAiPreGrade = async () => {
    if (!activeSubmission || aiLoading) return;
    if (activeSubmission?.aiGradeAttemptCount && activeSubmission.aiGradeAttemptCount >= 3) {
      toast.showError('Giới hạn AI', 'Đã đạt giới hạn 3 lần gọi AI cho bài nộp này.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateAiGrade(activeSubmission.id);
      setAiGradingResult(result);
      const newScores: Record<number, string> = {};
      const newFeedback: Record<number, string> = {};
      result.criteriaScores.forEach((cs) => {
        if (cs.criteriaId) {
          newScores[cs.criteriaId] = String(cs.score);
          if (cs.feedback) newFeedback[cs.criteriaId] = cs.feedback;
        }
      });
      setGradingWorkspace((prev) => ({
        ...prev,
        criteriaScores: { ...prev.criteriaScores, ...newScores },
        criteriaFeedback: { ...prev.criteriaFeedback, ...newFeedback },
        feedback: result.overallFeedback || prev.feedback,
        // Flag that this grade is confirming an AI pre-grade result
        confirmingAiGrade: true,
      }));
      if (result.overallConfidence >= 0.95 && assignment?.trustAiEnabled) {
        toast.showSuccess('AI tự tin cao', `Điểm tự tin: ${Math.round(result.overallConfidence * 100)}%. Bạn có thể xác nhận nhanh.`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'AI chấm bài thất bại.';
      setAiError(msg);
      toast.showError('AI chấm thất bại', msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleTrustAi = async (enabled: boolean) => {
    if (!assignment?.id) return;
    try {
      await toggleTrustAi(assignment.id, enabled);
      setAssignment((prev) => prev ? { ...prev, trustAiEnabled: enabled } : prev);
      toast.showSuccess('Trust AI', enabled ? 'Đã bật Trust AI cho assignment này.' : 'Đã tắt Trust AI cho assignment này.');
    } catch (err: any) {
      toast.showError('Lỗi', 'Không thể cập nhật Trust AI.');
    }
  };

  const closeGradingWorkspace = () => {
    if (gradingWorkspace.submitting) return;
    setGradingWorkspace(emptyWorkspaceState());
    setAiGradingResult(null);
    setAiError(null);
  };

  const toggleCriterionFeedback = (criterionId: number) => {
    setGradingWorkspace((prev) => ({
      ...prev,
      expandedCriteriaFeedback: {
        ...prev.expandedCriteriaFeedback,
        [criterionId]: !prev.expandedCriteriaFeedback[criterionId]
      }
    }));
  };

  const handleGrade = async () => {
    if (!activeSubmission || !user?.id) return;

    if (hasCriteria) {
      if (criteriaValidation.missingCount > 0) {
        setError('Cần nhập đầy đủ điểm cho từng rubric trước khi lưu.');
        return;
      }
      const firstCriterionError = Object.values(criteriaValidation.errors)[0];
      if (firstCriterionError) {
        setError(firstCriterionError);
        return;
      }
      if (criteriaValidation.totalExceeds) {
        setError(`Tổng điểm rubric không được vượt quá ${assignment?.maxScore}.`);
        return;
      }
    } else if (flatScoreValidation.error) {
      setError(flatScoreValidation.error);
      return;
    }

    setGradingWorkspace((prev) => ({ ...prev, submitting: true }));

    try {
      if (hasCriteria) {
        const criteriaScoresPayload: CriteriaScoreDTO[] = visibleCriteria
          .filter((criterion): criterion is AssignmentCriteriaDTO & { id: number } => criterion.id != null)
          .map((criterion) => ({
            criteriaId: criterion.id,
            score: Number(gradingWorkspace.criteriaScores[criterion.id] || '0'),
            maxPoints: criterion.maxPoints,
            feedback: gradingWorkspace.criteriaFeedback[criterion.id] || undefined
          }));

        await gradeSubmission(activeSubmission.id, {
          submissionId: activeSubmission.id,
          score: criteriaValidation.total,
          feedback: gradingWorkspace.feedback || undefined,
          criteriaScores: criteriaScoresPayload,
          ...(gradingWorkspace.confirmingAiGrade && { isAiGrade: true }),
        });
      } else {
        await gradeSubmission(activeSubmission.id, {
          submissionId: activeSubmission.id,
          score: flatScoreValidation.value ?? 0,
          feedback: gradingWorkspace.feedback || undefined,
          ...(gradingWorkspace.confirmingAiGrade && { isAiGrade: true }),
        });
      }

      setGradingWorkspace(emptyWorkspaceState());
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Chấm điểm thất bại.');
      setGradingWorkspace((prev) => ({ ...prev, submitting: false }));
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    if (filter === 'pending' && (submission.status === SubmissionStatus.GRADED || submission.status === SubmissionStatus.AI_COMPLETED)) return false;
    if (filter === 'graded' && submission.status !== SubmissionStatus.GRADED && submission.status !== SubmissionStatus.AI_COMPLETED) return false;
    if (filter === 'late' && !submission.isLate) return false;
    if (filter === 'aiProcessing' && !(submission.isAiGraded && submission.mentorConfirmed === null)) return false;
    return true;
  });

  const getStatusIcon = (submission: AssignmentSubmissionDetailDTO) => {
    // AI auto-pass: score is set + isPassed=true (Trust AI auto-confirmed)
    if (submission.isAiGraded && submission.score != null && submission.isPassed === true) {
      return <CheckCircle className="status-icon passed" size={18} />;
    }
    if (submission.status === SubmissionStatus.GRADED || submission.status === SubmissionStatus.AI_COMPLETED) {
      return submission.isPassed === true
        ? <CheckCircle className="status-icon passed" size={18} />
        : <AlertCircle className="status-icon failed" size={18} />;
    }
    if (submission.isAiGraded && submission.mentorConfirmed === null) {
      return <Sparkles className="status-icon ai-processing" size={18} />;
    }
    if (submission.isLate) {
      return <AlertCircle className="status-icon late" size={18} />;
    }
    return <Clock className="status-icon pending" size={18} />;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Prev/next navigation within filtered list
  const currentSubmissionIndex = activeSubmission
    ? filteredSubmissions.findIndex(s => s.id === activeSubmission.id)
    : -1;
  const hasPrevSubmission = currentSubmissionIndex > 0;
  const hasNextSubmission = currentSubmissionIndex < filteredSubmissions.length - 1 && currentSubmissionIndex !== -1;
  const isActiveSubmissionAutoPassed = Boolean(
    activeSubmission
      && activeSubmission.isAiGraded
      && activeSubmission.score != null
      && activeSubmission.isPassed === true
  );
  const isActiveSubmissionAiReviewed = Boolean(
    activeSubmission
      && activeSubmission.isAiGraded
      && activeSubmission.aiScore != null
      && activeSubmission.score == null
  );
  const isActiveSubmissionGraded = Boolean(
    activeSubmission
      && (
        isActiveSubmissionAutoPassed
        || activeSubmission.status === SubmissionStatus.GRADED
        || activeSubmission.status === SubmissionStatus.AI_COMPLETED
      )
  );
  const activeSubmissionStatusText = activeSubmission
    ? isActiveSubmissionAutoPassed
      ? 'Đã đạt'
      : isActiveSubmissionGraded
        ? 'Đã chấm'
        : isActiveSubmissionAiReviewed
          ? 'AI đã chấm'
          : activeSubmission.isLate
            ? 'Nộp muộn'
            : 'Chờ chấm'
    : '';
  const activeSubmissionStatusTone = isActiveSubmissionGraded
    ? 'graded'
    : isActiveSubmissionAiReviewed
      ? 'ai'
      : activeSubmission?.isLate
        ? 'late'
        : 'pending';
  const rubricCompletedCount = hasCriteria
    ? Math.max(criteriaValidation.criteriaCount - criteriaValidation.missingCount, 0)
    : 0;
  const rubricRemainingCount = hasCriteria
    ? Math.max(criteriaValidation.criteriaCount - rubricCompletedCount, 0)
    : 0;
  const rubricTrackingText = criteriaValidation.criteriaCount === 0
    ? 'Rubric chưa sẵn sàng.'
    : rubricRemainingCount === 0
      ? `${rubricCompletedCount}/${criteriaValidation.criteriaCount} rubric hợp lệ.`
      : `${rubricCompletedCount}/${criteriaValidation.criteriaCount} rubric hợp lệ · còn ${rubricRemainingCount}.`;

  const handlePrevSubmission = () => {
    if (hasPrevSubmission) {
      openGradingWorkspace(filteredSubmissions[currentSubmissionIndex - 1]);
    }
  };

  const handleNextSubmission = () => {
    if (hasNextSubmission) {
      openGradingWorkspace(filteredSubmissions[currentSubmissionIndex + 1]);
    }
  };

  if (loading) {
    return (
      <div className="mentor-grading-page">
        <div className="grading-loading">
          <div className="grading-spinner" />
          <span>Đang tải bài nộp...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-grading-page">
      <div className="grading-header">
        <button
          className="grading-back-btn"
          onClick={() => {
            if (state?.fromGradingDashboard) {
              navigate('/mentor', { state: { activeTab: 'grading' } });
            } else {
              navigate('/mentor');
            }
          }}
        >
          <ArrowLeft size={20} />
          {state?.fromGradingDashboard ? 'Quay về Chấm bài' : 'Quay về trang mentor'}
        </button>
        <div className="grading-title-section">
          {state?.courseName && (
            <div className="grading-breadcrumb">
              <button
                className="breadcrumb-item breadcrumb-item--link"
                onClick={() => navigate('/mentor', { state: { activeTab: 'grading' } })}
              >
                Danh sách chấm bài
              </button>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item">{state.courseName}</span>
              {state.moduleName && (
                <>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-item">{state.moduleName}</span>
                </>
              )}
              {(assignment?.title || state?.assignmentName) && (
                <>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-item active">{assignment?.title || state.assignmentName}</span>
                </>
              )}
            </div>
          )}
          <h1>{assignment?.title || 'Chấm bài tập'}</h1>
          <div className="grading-meta">
            {assignment?.submissionType && (
              <span className="grading-type">
                {assignment.submissionType === SubmissionType.TEXT && <FileText size={16} />}
                {assignment.submissionType === SubmissionType.LINK && <LinkIcon size={16} />}
                {assignment.submissionType === SubmissionType.FILE && <Upload size={16} />}
                {getSubmissionTypeLabel(assignment.submissionType)}
              </span>
            )}
            <span className="grading-max-score">Tối đa: {assignment?.maxScore} điểm</span>
            {assignment?.dueAt && <span className="grading-due">Hạn nộp: {formatDate(assignment.dueAt)}</span>}
            <span className={`grading-mode-badge ${hasCriteria ? 'rubric' : 'flat'}`}>
              {hasCriteria ? `${visibleCriteria.length} tiêu chí rubric` : 'Dữ liệu legacy cần bổ sung rubric'}
            </span>
          </div>
        </div>
      </div>

      {!activeSubmission && (
        <>
          {assignment?.description && (
            <div className="assignment-info-card">
              <div className="info-card-header" onClick={() => setDescriptionCollapsed(c => !c)} style={{ cursor: 'pointer' }}>
                <FileText size={20} />
                <h3>Yêu cầu bài tập</h3>
                <span className="info-card-toggle">{descriptionCollapsed ? '▶' : '▼'}</span>
              </div>
              {!descriptionCollapsed && (
                <div className="info-card-body">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(assignment.description) }} />
                </div>
              )}
            </div>
          )}

          <div className="grading-guidance-grid">
            {assignment?.learningOutcome && (
              <div className="grading-guidance-card">
                <div className="guidance-card-title">Kết quả cần đạt</div>
                <p>{assignment.learningOutcome}</p>
              </div>
            )}
            {assignment?.gradingCriteria && (
              <div className="grading-guidance-card">
                <div className="guidance-card-title">Lưu ý chấm điểm</div>
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(assignment.gradingCriteria) }} />
              </div>
            )}
            <div className={`grading-guidance-card ${hasCriteria ? 'rubric-ready' : 'flat-ready'}`}>
              <div className="guidance-card-title">{hasCriteria ? 'Rubric chấm điểm' : 'Dữ liệu rubric'}</div>
              {hasCriteria ? (
                <div className="guidance-rubric-summary">
                  <p>
                    Bài này có <strong>{visibleCriteria.length}</strong> tiêu chí, trong đó có{' '}
                    <strong>{requiredCriteria.length}</strong> tiêu chí bắt buộc.
                  </p>
                  <p>Hệ thống khóa nút lưu nếu có rubric vượt thang điểm, bỏ trống hoặc nhập không hợp lệ.</p>
                </div>
              ) : (
                <div className="guidance-flat-summary">
                  <p>Bài tập này được tạo từ dữ liệu cũ hoặc chưa đồng bộ rubric. Nên bổ sung rubric trước khi tiếp tục sử dụng lâu dài.</p>
                  <p>
                    Thang điểm tối đa: <strong>{assignment?.maxScore ?? 0}</strong>
                    {effectivePassingScore !== undefined && (
                      <>
                        {' '}| Mốc đạt: <strong>{effectivePassingScore}</strong>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="grading-error">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Full student table — shown when workspace is closed */}
      {!activeSubmission && (
        <div className="submissions-table-container">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Ngày nộp</th>
                <th>Lần nộp</th>
                <th>Trạng thái</th>
                <th>Điểm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-submissions">
                    Không có bài nộp phù hợp.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className={[
                      submission.isLate ? 'late-row' : '',
                      activeSubmission?.id === submission.id ? 'selected-row' : ''
                    ].filter(Boolean).join(' ')}
                  >
                    <td className="student-cell">
                      <User size={16} />
                      <span>{resolveLearnerName(submission.userName, submission.userId)}</span>
                      {submission.isNewest && <span className="newest-badge">Mới nhất</span>}
                    </td>
                    <td>{formatDate(submission.submittedAt)}</td>
                    <td>#{submission.attemptNumber}</td>
                    <td className="status-cell">
                      {getStatusIcon(submission)}
                      <span>
                        {submission.isAiGraded && submission.score != null && submission.isPassed === true
                          ? 'Đã đạt'
                          : submission.status === SubmissionStatus.GRADED || submission.status === SubmissionStatus.AI_COMPLETED
                          ? 'Đã chấm'
                          : submission.isAiGraded && submission.aiScore != null && submission.score == null
                          ? 'AI đã chấm'
                          : submission.isAiGraded && submission.mentorConfirmed === null
                          ? 'AI xử lý'
                          : submission.isLate
                          ? 'Nộp muộn'
                          : 'Chờ chấm'}
                      </span>
                      {submission.isAiGraded && submission.score != null && submission.isPassed === true && (
                        <span className="ai-badge ai-badge--auto-confirmed">✅ Tự động</span>
                      )}
                      {submission.isAiGraded && submission.mentorConfirmed === null && submission.score == null && (
                        <span className="ai-badge">AI</span>
                      )}
                    </td>
                    <td>
                      {submission.score !== undefined && submission.score !== null
                        ? `${submission.score}/${submission.maxScore}`
                        : submission.isAiGraded && submission.aiScore != null
                        ? `${submission.aiScore}/${submission.maxScore}`
                        : '-'}
                    </td>
                    <td className="actions-cell">
                      <button
                        className={`grading-action-btn ${submission.status !== SubmissionStatus.GRADED ? 'grading-action-btn--primary' : ''}`}
                        onClick={() => openGradingWorkspace(submission)}
                        title={submission.status === SubmissionStatus.GRADED ? 'Xem hoặc chấm lại bài đã chấm' : 'Mở khung chấm cho bài nộp'}
                      >
                        {submission.status === SubmissionStatus.GRADED ? <Eye size={16} /> : <Edit3 size={16} />}
                        <span>{submission.status === SubmissionStatus.GRADED ? 'Xem / chấm lại' : 'Mở khung chấm'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Compact submission bar — shown when workspace is open */}
      {activeSubmission && (
        <div className="submissions-compact-bar">
          <User size={15} className="compact-bar__icon" />
          <span className="compact-bar__name">
            {resolveLearnerName(activeSubmission.userName, activeSubmission.userId)}
          </span>
          <span className="compact-bar__divider">·</span>
          <span className="compact-bar__date">{formatDate(activeSubmission.submittedAt)}</span>
          <span className="compact-bar__divider">·</span>
          <span className={`compact-bar__status ${
            (activeSubmission.isAiGraded && activeSubmission.score != null && activeSubmission.isPassed === true)
              ? 'graded'
              : (activeSubmission.status === SubmissionStatus.GRADED || activeSubmission.status === SubmissionStatus.AI_COMPLETED)
              ? 'graded'
              : 'pending'
          }`}>
            {activeSubmission.isAiGraded && activeSubmission.score != null && activeSubmission.isPassed === true
              ? 'Đã đạt'
              : activeSubmission.status === SubmissionStatus.GRADED || activeSubmission.status === SubmissionStatus.AI_COMPLETED
              ? 'Đã chấm'
              : activeSubmission.isAiGraded && activeSubmission.aiScore != null
              ? 'AI đã chấm'
              : activeSubmission.isLate
              ? 'Nộp muộn'
              : 'Chờ chấm'}
            {activeSubmission.score !== null && activeSubmission.score !== undefined
              ? ` · ${activeSubmission.score}/${activeSubmission.maxScore}`
              : activeSubmission.isAiGraded && activeSubmission.aiScore != null && activeSubmission.score == null
              ? ` · ${activeSubmission.aiScore}/${activeSubmission.maxScore}`
              : ''}
          </span>
          <div className="compact-bar__nav">
            <button
              className="compact-nav-btn"
              onClick={handlePrevSubmission}
              disabled={!hasPrevSubmission}
              title="Bài trước"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="compact-nav-indicator">
              {currentSubmissionIndex + 1} / {filteredSubmissions.length}
            </span>
            <button
              className="compact-nav-btn"
              onClick={handleNextSubmission}
              disabled={!hasNextSubmission}
              title="Bài tiếp"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            className="compact-expand-btn"
            onClick={closeGradingWorkspace}
            title="Thu gọn bảng"
          >
            <ChevronDown size={16} />
            Thu gọn
          </button>
        </div>
      )}

      {activeSubmission && (
        <section className="grading-workspace" ref={gradingWorkspaceRef}>
          <div className="grading-workspace__header">
            <div>
              <h2>Không gian chấm bài</h2>
              <p>Xem bài nộp, đối chiếu rubric và lưu điểm ngay trên cùng một màn hình.</p>
            </div>
            <button
              className="workspace-close-btn"
              onClick={closeGradingWorkspace}
              disabled={gradingWorkspace.submitting}
            >
              <X size={18} />
              Đóng
            </button>
          </div>

          {/* Dispute Banner */}
          {activeSubmission.disputeFlag && (
            <div className="dispute-banner">
              <div className="dispute-banner__icon">⚠️</div>
              <div className="dispute-banner__content">
                <strong>Học viên đã yêu cầu bạn xem xét lại bài này.</strong>
                {activeSubmission.disputeReason && (
                  <p className="dispute-banner__reason">Lý do: {activeSubmission.disputeReason}</p>
                )}
              </div>
            </div>
          )}

          {/* AI Grading Section */}
          {assignment?.aiGradingEnabled && (
            <div className="ai-grading-section">
              {aiError && (
                <div className="ai-error-banner">
                  <AlertCircle size={16} />
                  {aiError}
                  <button onClick={() => setAiError(null)}><X size={14} /></button>
                </div>
              )}

              {/* CASE A: AI has already graded (auto or manual) — show result panel */}
              {activeSubmission.isAiGraded && activeSubmission.aiScore != null && (
                <>
                  {/* Auto-confirmed by Trust AI: score + isPassed are set on BE */}
                  {activeSubmission.mentorConfirmed === true && (
                    <div className="ai-result-card ai-result-card--auto-confirmed">
                      <div className="ai-result-card__header">
                        <span>🤖 Kết quả AI — Tự động duyệt</span>
                        <span className={`ai-confidence-badge ${(activeSubmission.aiConfidence ?? 0) >= 0.9 ? 'high' : 'medium'}`}>
                          Tự tin {Math.round((activeSubmission.aiConfidence ?? 0) * 100)}%
                        </span>
                      </div>
                      <div className="ai-result-card__score">
                        Điểm: <strong>{activeSubmission.aiScore}/{activeSubmission.maxScore}</strong>
                      </div>
                      {activeSubmission.isPassed === true && (
                        <div className="ai-result-card__verdict ai-result-card__verdict--pass">
                          ✅ <strong>Đạt yêu cầu</strong> — Bài đã được duyệt tự động. Học viên đã thấy kết quả.
                        </div>
                      )}
                      {activeSubmission.isPassed === false && (
                        <div className="ai-result-card__verdict ai-result-card__verdict--fail">
                          ❌ <strong>Không đạt</strong> — Học viên có thể nộp lại.
                        </div>
                      )}
                      {activeSubmission.aiFeedback && (
                        <div className="ai-result-card__feedback">
                          {activeSubmission.aiFeedback}
                        </div>
                      )}
                      {/* Per-rubric scores from BE (auto-confirmed submissions have criteriaScores) */}
                      {activeSubmission.criteriaScores && activeSubmission.criteriaScores.length > 0 && (
                        <div className="ai-result-card__rubrics">
                          <div className="ai-result-card__rubrics-title">Chi tiết theo rubric:</div>
                          {activeSubmission.criteriaScores.map((cs) => (
                            <div key={cs.criteriaId} className={`ai-rubric-item ${cs.passed ? 'pass' : 'fail'}`}>
                              <div className="ai-rubric-item__header">
                                <span className="ai-rubric-item__name">{cs.criteriaName}</span>
                                <span className={`ai-rubric-item__score ${cs.passed ? 'pass' : 'fail'}`}>
                                  {cs.score}/{cs.maxPoints} {cs.passed ? '✓' : '✗'}
                                </span>
                              </div>
                              {cs.feedback && (
                                <div className="ai-rubric-item__feedback">{cs.feedback}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI graded but mentor needs to confirm (low confidence) */}
                  {activeSubmission.mentorConfirmed === null && (
                    <div className="ai-result-card ai-result-card--pending">
                      <div className="ai-result-card__header">
                        <span>🤖 AI đã chấm — Chờ xác nhận</span>
                        <span className={`ai-confidence-badge ${(activeSubmission.aiConfidence ?? 0) >= 0.9 ? 'high' : 'medium'}`}>
                          Tự tin {Math.round((activeSubmission.aiConfidence ?? 0) * 100)}%
                        </span>
                      </div>
                      <div className="ai-result-card__score">
                        Điểm AI: <strong>{activeSubmission.aiScore}/{activeSubmission.maxScore}</strong>
                      </div>
                      {activeSubmission.aiFeedback && (
                        <div className="ai-result-card__feedback">{activeSubmission.aiFeedback}</div>
                      )}
                      {/* Per-rubric scores */}
                      {activeSubmission.criteriaScores && activeSubmission.criteriaScores.length > 0 && (
                        <div className="ai-result-card__rubrics">
                          <div className="ai-result-card__rubrics-title">Chi tiết theo rubric:</div>
                          {activeSubmission.criteriaScores.map((cs) => (
                            <div key={cs.criteriaId} className={`ai-rubric-item ${cs.passed ? 'pass' : 'fail'}`}>
                              <div className="ai-rubric-item__header">
                                <span className="ai-rubric-item__name">{cs.criteriaName}</span>
                                <span className={`ai-rubric-item__score ${cs.passed ? 'pass' : 'fail'}`}>
                                  {cs.score}/{cs.maxPoints} {cs.passed ? '✓' : '✗'}
                                </span>
                              </div>
                              {cs.feedback && (
                                <div className="ai-rubric-item__feedback">{cs.feedback}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="ai-result-card__pending-hint">
                        ⚠️ AI chưa đủ tự tin (confidence &lt; 95%) — vui lòng xác nhận hoặc điều chỉnh điểm trước khi lưu.
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* CASE B: Mentor triggered AI Pre-grade (result from API call) */}
              {aiGradingResult && (
                <div className="ai-result-card">
                  <div className="ai-result-card__header">
                    <span>🤖 Kết quả AI</span>
                    <span className={`ai-confidence-badge ${aiGradingResult.overallConfidence >= 0.9 ? 'high' : 'medium'}`}>
                      Tự tin {Math.round(aiGradingResult.overallConfidence * 100)}%
                    </span>
                  </div>
                  {assignment.trustAiEnabled && aiGradingResult.overallConfidence >= 0.95 && (
                    <div className="ai-trust-hint">
                      ✅ AI tự tin cao — Bạn có thể xác nhận nhanh để tiết kiệm thời gian.
                    </div>
                  )}
                </div>
              )}

              {/* CASE C: AI has NOT graded yet — show Pre-grade button */}
              {!(activeSubmission.isAiGraded && activeSubmission.aiScore != null) && (
                <>
                  <button
                    className="ai-pregrade-btn"
                    onClick={handleAiPreGrade}
                    disabled={aiLoading || (activeSubmission.aiGradeAttemptCount ?? 0) >= 3}
                  >
                    {aiLoading ? (
                      <>
                        <div className="grading-spinner small" />
                        Đang AI chấm...
                      </>
                    ) : (
                      <>🤖 AI Pre-grade{activeSubmission.aiGradeAttemptCount ? ` (${activeSubmission.aiGradeAttemptCount}/3)` : ''}</>
                    )}
                  </button>
                  <label className="trust-ai-toggle">
                    <input
                      type="checkbox"
                      checked={Boolean(assignment.trustAiEnabled)}
                      onChange={(e) => handleToggleTrustAi(e.target.checked)}
                    />
                    <span>Trust AI — tự động xác nhận khi AI tự tin ≥ 95%</span>
                  </label>
                </>
              )}
            </div>
          )}

          <div className="grading-workspace__meta-hero">
            <div className="workspace-meta-hero__identity">
              <span className="workspace-meta-hero__eyebrow">Học viên đang chấm</span>
              <strong className="workspace-meta-hero__name">
                {resolveLearnerName(activeSubmission.userName, activeSubmission.userId)}
              </strong>
              <div className="workspace-meta-hero__chips">
                <span className={`workspace-meta-pill ${activeSubmissionStatusTone}`}>
                  {activeSubmissionStatusText}
                </span>
              </div>
            </div>

            <div className="workspace-meta-hero__stats">
              <div className="workspace-meta-stat">
                <span className="workspace-meta-stat__label">Thời gian nộp</span>
                <strong>{formatDate(activeSubmission.submittedAt)}</strong>
              </div>
              <div className="workspace-meta-stat">
                <span className="workspace-meta-stat__label">Lần nộp</span>
                <strong>#{activeSubmission.attemptNumber}</strong>
              </div>
              <div className="workspace-meta-stat">
                <span className="workspace-meta-stat__label">Trạng thái</span>
                <strong className={`workspace-meta-stat__status ${activeSubmissionStatusTone}`}>
                  {activeSubmissionStatusText}
                </strong>
              </div>
            </div>
          </div>

          <div className="grading-workspace__grid">
            <div className="grading-workspace__panel grading-workspace__panel--left">
              <div className="workspace-panel__title">Bài nộp của học viên</div>
              {activeSubmission.isLate && (
                <div className="late-warning-badge">
                  <AlertCircle size={16} />
                  Bài nộp này được gửi sau hạn nộp.
                </div>
              )}

              <div className={`submission-mode-banner ${hasCriteria ? 'rubric' : 'flat'}`}>
                {hasCriteria ? (
                  <span>Bài tập này đang được chấm theo rubric. Mỗi tiêu chí đều hiển rõ thang điểm và ngưỡng đạt.</span>
                ) : (
                  <span>Bài tập này thiếu rubric trong dữ liệu hiện tại. Nên bổ sung rubric để việc chấm điểm minh bạch hơn.</span>
                )}
              </div>

              {activeSubmission.submissionText && (
                <div className="workspace-content-block">
                  <div className="workspace-content-block__label">Nội dung nộp</div>
                  <div className="submission-text-view submission-text-view--tall"
                       dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeSubmission.submissionText) }} />
                </div>
              )}

              {activeSubmission.linkUrl && (
                <div className="workspace-content-block">
                  <div className="workspace-content-block__label">Liên kết bài nộp</div>
                  <a
                    href={activeSubmission.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="submission-link-view"
                  >
                    <LinkIcon size={16} />
                    {activeSubmission.linkUrl}
                  </a>
                </div>
              )}

              {activeSubmission.fileMediaUrl && (
                <div className="workspace-content-block">
                  <div className="workspace-content-block__label">Tệp tải lên</div>
                  <button
                    onClick={() => downloadFile(
                      `/api/assignments/submissions/${activeSubmission.id}/download`,
                      'bai_nop'
                    )}
                    className="submission-file-view"
                  >
                    <Upload size={16} />
                    Mở tệp bài nộp
                  </button>
                </div>
              )}

              {!activeSubmission.submissionText && !activeSubmission.linkUrl && !activeSubmission.fileMediaUrl && (
                <div className="submission-empty-state">
                  Bài nộp này không có nội dung hiển thị trực tiếp.
                </div>
              )}

              {activeSubmission.status === SubmissionStatus.GRADED && (
                <div className="workspace-existing-grade">
                  <div className="workspace-existing-grade__title">Kết quả hiện tại</div>
                  <p>
                    Điểm đang lưu: <strong>{activeSubmission.score ?? 0}/{activeSubmission.maxScore}</strong>
                    {activeSubmission.feedback && <> | Nhận xét đã lưu bên dưới.</>}
                  </p>
                </div>
              )}

              <div className="workspace-left-action-dock">
                {hasCriteria && (
                  <div className="workspace-left-score-tracker">
                    <div className="workspace-score-summary workspace-score-summary--left workspace-score-summary--compact">
                      <div className="workspace-score-summary__info">
                        <strong>Tổng điểm tạm tính</strong>
                        <span className={`workspace-score-summary__subtext ${criteriaValidation.totalExceeds ? 'error' : ''}`}>
                          {criteriaValidation.totalExceeds
                            ? `Đang vượt quá ${assignment?.maxScore ?? 0} điểm.`
                            : rubricTrackingText}
                        </span>
                      </div>
                      <div className={`workspace-score-summary__value ${criteriaValidation.totalExceeds ? 'invalid' : ''}`}>
                        {criteriaValidation.total} / {assignment?.maxScore ?? 0}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions sticky trong cột trái */}
                <div className="workspace-left-actions">
                  <button className="workspace-btn workspace-btn-secondary" onClick={closeGradingWorkspace} disabled={gradingWorkspace.submitting}>
                    Đóng khung chấm
                  </button>
                  <button className="workspace-btn workspace-btn-primary" onClick={handleGrade} disabled={!canSubmitGrade}>
                    {gradingWorkspace.submitting ? (
                      <React.Fragment>
                        <div className="grading-spinner small" />
                        Đang lưu...
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <CheckCircle size={16} />
                        Lưu điểm
                      </React.Fragment>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grading-workspace__panel grading-workspace__panel--scoring">
              {hasCriteria ? (
                <>
                  {/* Pattern D: Sticky score header */}
                  <div className="workspace-scoring-header">
                    <div className="workspace-scoring-header__title-row">
                      <div className="workspace-scoring-header__title">Chấm điểm</div>
                    </div>
                  </div>

                  <div className="workspace-scrollable-criteria">
                    <div className={`workspace-inline-note ${!hasRequiredCriterionThresholds || criteriaValidation.requiredPassed ? 'success' : 'warning'}`}>
                      {!hasRequiredCriterionThresholds
                        ? 'Rubric này chưa cấu hình ngưỡng đạt riêng cho từng tiêu chí; tổng điểm sẽ quyết định kết quả đạt.'
                        : criteriaValidation.requiredPassed
                          ? 'Tất cả tiêu chí bắt buộc hiện đang đạt ngưỡng.'
                          : 'Còn tiêu chí bắt buộc chưa đạt ngưỡng hoặc chưa nhập điểm.'}
                    </div>

                    <div className="criteria-grading-list">
                      {visibleCriteria
                      .filter((criterion): criterion is AssignmentCriteriaDTO & { id: number } => criterion.id != null)
                      .map((criterion) => {
                        const rawValue = gradingWorkspace.criteriaScores[criterion.id] ?? '';
                        const numericValue = Number(rawValue);
                        const hasValue = rawValue.trim() !== '' && Number.isFinite(numericValue);
                        const threshold = getCriterionPassingThreshold(criterion);
                        const criterionPassed = hasValue && threshold != null && numericValue >= threshold;
                        const criterionError = criteriaValidation.errors[criterion.id];
                        const isFeedbackExpanded =
                          gradingWorkspace.expandedCriteriaFeedback[criterion.id] ||
                          Boolean((gradingWorkspace.criteriaFeedback[criterion.id] || '').trim());

                        return (
                          <div key={criterion.id} className={`criteria-card ${criterionError ? 'invalid' : criterionPassed ? 'passed' : ''}`}>
                            <div className="criteria-card__header">
                              <div>
                                <div className="criteria-card__title">
                                  {criterion.name}
                                  {criterion.isRequired && <span className="criteria-required-badge">Bắt buộc</span>}
                                </div>
                                {criterion.description && (
                                  <p className="criteria-card__description">{criterion.description}</p>
                                )}
                              </div>
                              <div className="criteria-card__meta">
                                <span>Tối đa: {criterion.maxPoints}</span>
                                {threshold != null && <span>Đạt từ: {threshold}</span>}
                              </div>
                            </div>

                            <div className="criteria-card__fields">
                              <div className="criteria-field">
                                <label>Điểm rubric</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={criterion.maxPoints}
                                  step="0.5"
                                  inputMode="decimal"
                                  value={rawValue}
                                  disabled={gradingWorkspace.submitting}
                                  onWheelCapture={handleNumberInputWheel}
                                  onChange={(event) => {
                                    setError(null);
                                    setGradingWorkspace((prev) => ({
                                      ...prev,
                                      criteriaScores: { ...prev.criteriaScores, [criterion.id]: event.target.value }
                                    }));
                                  }}
                                  className={criterionError ? 'invalid' : ''}
                                  placeholder="Nhập điểm"
                                />
                                {criterionError ? (
                                  <div className="criteria-field__error">{criterionError}</div>
                                ) : (
                                  <div className={`criteria-field__hint ${hasValue ? (criterionPassed ? 'success' : 'warning') : ''}`}>
                                    {hasValue
                                      ? (threshold == null
                                        ? 'Rubric này đã có điểm hợp lệ.'
                                        : criterionPassed
                                          ? 'Rubric này đang đạt ngưỡng.'
                                          : 'Rubric này đã có điểm nhưng chưa đạt ngưỡng.')
                                      : 'Nhập điểm hợp lệ để mở nút lưu.'}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className={`criteria-feedback-toggle ${isFeedbackExpanded ? 'expanded' : ''}`}
                                  onClick={() => toggleCriterionFeedback(criterion.id)}
                                  disabled={gradingWorkspace.submitting}
                                >
                                  {isFeedbackExpanded ? 'Ẩn nhận xét tiêu chí' : 'Thêm nhận xét tiêu chí'}
                                </button>
                              </div>

                              {isFeedbackExpanded && (
                                <div className="criteria-field criteria-field--wide">
                                  <label>Nhận xét tiêu chí</label>
                                  <textarea
                                    value={gradingWorkspace.criteriaFeedback[criterion.id] || ''}
                                    disabled={gradingWorkspace.submitting}
                                    onChange={(event) =>
                                      setGradingWorkspace((prev) => ({
                                        ...prev,
                                        criteriaFeedback: { ...prev.criteriaFeedback, [criterion.id]: event.target.value }
                                      }))
                                    }
                                    placeholder="Nhận xét riêng cho rubric này (tùy chọn)"
                                    rows={3}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grade-input-group">
                    <label htmlFor="workspace-feedback">Nhận xét chung</label>
                    <textarea
                      id="workspace-feedback"
                      value={gradingWorkspace.feedback}
                      disabled={gradingWorkspace.submitting}
                      onChange={(event) => setGradingWorkspace((prev) => ({ ...prev, feedback: event.target.value }))}
                      placeholder="Nhận xét tổng quát cho học viên..."
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <React.Fragment>
                  <div className="workspace-panel__title">Chấm điểm</div>
                  <div className="grading-mode-callout">
                    <div className="grading-mode-callout__title">Bài tập legacy chưa có rubric</div>
                    <p>
                      Dữ liệu này nên được cập nhật rubric ở phiên bản tiếp theo. Trong lúc chờ cập nhật, mentor có thể chấm theo tổng điểm để không chặn luồng vận hành.
                    </p>
                    <div className="grade-input-group">
                      <label htmlFor="legacy-score">Tổng điểm</label>
                      <input
                        id="legacy-score"
                        type="number"
                        min="0"
                        max={assignment?.maxScore}
                        step="0.5"
                        inputMode="decimal"
                        value={gradingWorkspace.score}
                        disabled={gradingWorkspace.submitting}
                        onWheelCapture={handleNumberInputWheel}
                        onChange={(event) => {
                          setError(null);
                          setGradingWorkspace((prev) => ({ ...prev, score: event.target.value }));
                        }}
                        className={flatScoreValidation.error ? 'invalid' : ''}
                        placeholder="Nhập tổng điểm"
                      />
                      {flatScoreValidation.error && (
                        <div className="criteria-field__error">{flatScoreValidation.error}</div>
                      )}
                    </div>
                  </div>

                  <div className="grade-input-group">
                    <label htmlFor="workspace-feedback">Nhận xét chung</label>
                    <textarea
                      id="workspace-feedback"
                      value={gradingWorkspace.feedback}
                      disabled={gradingWorkspace.submitting}
                      onChange={(event) => setGradingWorkspace((prev) => ({ ...prev, feedback: event.target.value }))}
                      placeholder="Nhận xét tổng quát cho học viên..."
                      rows={3}
                    />
                  </div>

                  <div className="workspace-actions">
                    <button className="workspace-btn workspace-btn-secondary" onClick={closeGradingWorkspace} disabled={gradingWorkspace.submitting}>
                      Đóng khung chấm
                    </button>
                    <button className="workspace-btn workspace-btn-primary" onClick={handleGrade} disabled={!canSubmitGrade}>
                      {gradingWorkspace.submitting ? (
                        <React.Fragment>
                          <div className="grading-spinner small" />
                          Đang lưu...
                        </React.Fragment>
                      ) : (
                        <React.Fragment>
                          <CheckCircle size={16} />
                          Lưu điểm
                        </React.Fragment>
                      )}
                    </button>
                  </div>
                </React.Fragment>
              )}
            </div>
            </div>
          </section>
        )}
      </div>
    );
  };

  export default MentorGradingPage;
