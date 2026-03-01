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
  Search,
  Eye,
  Edit3,
  X
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
import { useAuth } from '../../context/AuthContext';
import './assignment-grading.css';

type FilterType = 'all' | 'pending' | 'graded' | 'late';

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
}

const emptyWorkspaceState = (): GradingWorkspaceState => ({
  submission: null,
  score: '',
  feedback: '',
  criteriaScores: {},
  criteriaFeedback: {},
  expandedCriteriaFeedback: {},
  submitting: false
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
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const gradingWorkspaceRef = useRef<HTMLElement | null>(null);

  const [assignment, setAssignment] = useState<AssignmentDetailDTO | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionDetailDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradingWorkspace, setGradingWorkspace] = useState<GradingWorkspaceState>(emptyWorkspaceState);

  const loadData = useCallback(async () => {
    if (!assignmentId || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [assignmentData, submissionsData] = await Promise.all([
        getAssignmentById(Number(assignmentId)),
        getAssignmentSubmissions(Number(assignmentId))
      ]);
      setAssignment(assignmentData);
      setSubmissions(submissionsData);
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

  const closeGradingWorkspace = () => {
    if (gradingWorkspace.submitting) return;
    setGradingWorkspace(emptyWorkspaceState());
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
          criteriaScores: criteriaScoresPayload
        });
      } else {
        await gradeSubmission(activeSubmission.id, {
          submissionId: activeSubmission.id,
          score: flatScoreValidation.value ?? 0,
          feedback: gradingWorkspace.feedback || undefined
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
    if (filter === 'pending' && submission.status === SubmissionStatus.GRADED) return false;
    if (filter === 'graded' && submission.status !== SubmissionStatus.GRADED) return false;
    if (filter === 'late' && !submission.isLate) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return resolveLearnerName(submission.userName, submission.userId).toLowerCase().includes(query);
    }
    return true;
  });

  const getStatusIcon = (submission: AssignmentSubmissionDetailDTO) => {
    if (submission.status === SubmissionStatus.GRADED) {
      return submission.isPassed === true
        ? <CheckCircle className="status-icon passed" size={18} />
        : <AlertCircle className="status-icon failed" size={18} />;
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

  const pendingCount = submissions.filter((submission) => submission.status !== SubmissionStatus.GRADED && submission.isNewest).length;
  const gradedCount = submissions.filter((submission) => submission.status === SubmissionStatus.GRADED).length;
  const lateCount = submissions.filter((submission) => submission.isLate).length;

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

      {assignment?.description && (
        <div className="assignment-info-card">
          <div className="info-card-header">
            <FileText size={20} />
            <h3>Yêu cầu bài tập</h3>
          </div>
          <div className="info-card-body">
            <p>{assignment.description}</p>
          </div>
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
            <p>{assignment.gradingCriteria}</p>
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

      <div className="grading-stats">
        <div className={`stat-card ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
          <Clock size={24} />
          <div className="stat-content">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Chờ chấm</span>
          </div>
        </div>
        <div className={`stat-card ${filter === 'graded' ? 'active' : ''}`} onClick={() => setFilter('graded')}>
          <CheckCircle size={24} />
          <div className="stat-content">
            <span className="stat-value">{gradedCount}</span>
            <span className="stat-label">Đã chấm</span>
          </div>
        </div>
        <div className={`stat-card ${filter === 'late' ? 'active' : ''}`} onClick={() => setFilter('late')}>
          <AlertCircle size={24} />
          <div className="stat-content">
            <span className="stat-value">{lateCount}</span>
            <span className="stat-label">Nộp muộn</span>
          </div>
        </div>
        <div className={`stat-card ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          <User size={24} />
          <div className="stat-content">
            <span className="stat-value">{submissions.length}</span>
            <span className="stat-label">Tổng</span>
          </div>
        </div>
      </div>

      <div className="grading-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên học viên..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="grading-error">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

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
                      {submission.status === SubmissionStatus.GRADED
                        ? 'Đã chấm'
                        : submission.isLate
                        ? 'Nộp muộn'
                        : 'Chờ chấm'}
                    </span>
                  </td>
                  <td>
                    {submission.score !== undefined && submission.score !== null
                      ? `${submission.score}/${submission.maxScore}`
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

          <div className="grading-workspace__meta-grid">
            <div className="workspace-meta-card">
              <span className="workspace-meta-card__label">Học viên</span>
              <strong>{resolveLearnerName(activeSubmission.userName, activeSubmission.userId)}</strong>
            </div>
            <div className="workspace-meta-card">
              <span className="workspace-meta-card__label">Thời gian nộp</span>
              <strong>{formatDate(activeSubmission.submittedAt)}</strong>
            </div>
            <div className="workspace-meta-card">
              <span className="workspace-meta-card__label">Lần nộp</span>
              <strong>#{activeSubmission.attemptNumber}</strong>
            </div>
            <div className="workspace-meta-card">
              <span className="workspace-meta-card__label">Trạng thái</span>
              <strong>
                {activeSubmission.status === SubmissionStatus.GRADED ? 'Đã chấm' : activeSubmission.isLate ? 'Nộp muộn' : 'Chờ chấm'}
              </strong>
            </div>
          </div>

          <div className="grading-workspace__grid">
            <div className="grading-workspace__panel">
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
                  <div className="submission-text-view submission-text-view--tall">
                    {activeSubmission.submissionText}
                  </div>
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
                  <a
                    href={activeSubmission.fileMediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="submission-file-view"
                  >
                    <Upload size={16} />
                    Mở tệp bài nộp
                  </a>
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

              {hasCriteria && (
                <div className="submission-rubric-preview">
                  <div className="submission-rubric-preview__title">Rubric hiện tại</div>
                  <div className="submission-rubric-preview__list">
                    {visibleCriteria.map((criterion) => (
                      <div key={criterion.id ?? criterion.name} className="submission-rubric-item">
                        <div className="submission-rubric-item__header">
                          <span className="submission-rubric-item__name">
                            {criterion.name}
                            {criterion.isRequired && <span className="submission-rubric-item__required">Bắt buộc</span>}
                          </span>
                          <span className="submission-rubric-item__meta">
                            {criterion.maxPoints} điểm
                            {getCriterionPassingThreshold(criterion) != null && ` | Đạt từ ${getCriterionPassingThreshold(criterion)}`}
                          </span>
                        </div>
                        {criterion.description && (
                          <p className="submission-rubric-item__desc">{criterion.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grading-workspace__panel grading-workspace__panel--scoring">
              <div className="workspace-panel__title">Chấm điểm</div>
              {hasCriteria ? (
                <>
                  <div className="workspace-score-summary">
                    <div>
                      <strong>Tổng điểm tạm tính</strong>
                      <p>Nút lưu chỉ mở khi tất cả rubric hợp lệ và tổng điểm không vượt thang điểm.</p>
                    </div>
                    <div className={`workspace-score-summary__value ${criteriaValidation.totalExceeds ? 'invalid' : ''}`}>
                      {criteriaValidation.total} / {assignment?.maxScore}
                    </div>
                  </div>

                  {criteriaValidation.totalExceeds && (
                    <div className="workspace-inline-error">
                      Tổng điểm rubric đang vượt quá thang điểm bài tập.
                    </div>
                  )}

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
                </>
              ) : (
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
              )}

              <div className="grade-input-group">
                <label htmlFor="workspace-feedback">Nhận xét chung</label>
                <textarea
                  id="workspace-feedback"
                  value={gradingWorkspace.feedback}
                  disabled={gradingWorkspace.submitting}
                  onChange={(event) => setGradingWorkspace((prev) => ({ ...prev, feedback: event.target.value }))}
                  placeholder="Nhận xét tổng quát cho học viên..."
                  rows={5}
                />
              </div>

              <div className="workspace-actions">
                <button className="workspace-btn workspace-btn-secondary" onClick={closeGradingWorkspace} disabled={gradingWorkspace.submitting}>
                  Đóng khung chấm
                </button>
                <button className="workspace-btn workspace-btn-primary" onClick={handleGrade} disabled={!canSubmitGrade}>
                  {gradingWorkspace.submitting ? (
                    <>
                      <div className="grading-spinner small" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Lưu điểm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MentorGradingPage;
