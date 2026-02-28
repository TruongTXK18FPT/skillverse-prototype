import React, { useState, useEffect, useCallback } from 'react';
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
import {
  getAssignmentById,
  getAssignmentSubmissions,
  gradeSubmission
} from '../../services/assignmentService';
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

const MentorGradingPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [assignment, setAssignment] = useState<AssignmentDetailDTO | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionDetailDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Grading modal state
  const [gradingModal, setGradingModal] = useState<{
    isOpen: boolean;
    submission: AssignmentSubmissionDetailDTO | null;
    score: string;
    feedback: string;
    criteriaScores: Record<number, string>; // criteriaId -> score string
    criteriaFeedback: Record<number, string>; // criteriaId -> feedback
    submitting: boolean;
  }>({
    isOpen: false,
    submission: null,
    score: '',
    feedback: '',
    criteriaScores: {},
    criteriaFeedback: {},
    submitting: false
  });

  // View submission modal state
  const [viewModal, setViewModal] = useState<{
    isOpen: boolean;
    submission: AssignmentSubmissionDetailDTO | null;
  }>({
    isOpen: false,
    submission: null
  });

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
      setError(err?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasCriteria = assignment?.criteria && assignment.criteria.length > 0;

  // Compute total from criteria scores (auto-sum)
  const criteriaTotal = hasCriteria
    ? Object.values(gradingModal.criteriaScores).reduce((sum, v) => {
        const n = parseFloat(v);
        return sum + (isNaN(n) ? 0 : n);
      }, 0)
    : 0;

  const handleGrade = async () => {
    if (!gradingModal.submission || !user?.id) return;
    
    if (hasCriteria) {
      // Criteria-based grading: validate each criterion
      const criteria = assignment!.criteria!;
      for (const c of criteria) {
        const val = parseFloat(gradingModal.criteriaScores[c.id!] || '');
        if (isNaN(val) || val < 0) {
          setError(`Vui lòng nhập điểm hợp lệ cho tiêu chí "${c.name}"`);
          return;
        }
        if (val > c.maxPoints) {
          setError(`Điểm tiêu chí "${c.name}" không được vượt quá ${c.maxPoints}`);
          return;
        }
      }

      setGradingModal(prev => ({ ...prev, submitting: true }));

      try {
        const criteriaScoresPayload: CriteriaScoreDTO[] = criteria.map(c => ({
          criteriaId: c.id!,
          score: parseFloat(gradingModal.criteriaScores[c.id!] || '0'),
          maxPoints: c.maxPoints,
          feedback: gradingModal.criteriaFeedback[c.id!] || undefined
        }));

        await gradeSubmission(
          gradingModal.submission.id,
          {
            score: criteriaTotal,
            feedback: gradingModal.feedback || undefined,
            criteriaScores: criteriaScoresPayload
          }
        );
        setGradingModal({
          isOpen: false, submission: null, score: '', feedback: '',
          criteriaScores: {}, criteriaFeedback: {}, submitting: false
        });
        await loadData();
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Chấm điểm thất bại');
        setGradingModal(prev => ({ ...prev, submitting: false }));
      }
    } else {
      // Flat score grading (no criteria)
      const score = parseFloat(gradingModal.score);
      if (isNaN(score) || score < 0) {
        setError('Vui lòng nhập điểm hợp lệ');
        return;
      }
      if (assignment && score > assignment.maxScore) {
        setError(`Điểm không được vượt quá ${assignment.maxScore}`);
        return;
      }

      setGradingModal(prev => ({ ...prev, submitting: true }));

      try {
        await gradeSubmission(
          gradingModal.submission.id,
          {
            score,
            feedback: gradingModal.feedback || undefined
          }
        );
        setGradingModal({
          isOpen: false, submission: null, score: '', feedback: '',
          criteriaScores: {}, criteriaFeedback: {}, submitting: false
        });
        await loadData();
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Chấm điểm thất bại');
        setGradingModal(prev => ({ ...prev, submitting: false }));
      }
    }
  };

  const openGradingModal = (submission: AssignmentSubmissionDetailDTO) => {
    // Pre-populate criteria scores from existing grading data if re-grading
    const criteriaScores: Record<number, string> = {};
    const criteriaFeedback: Record<number, string> = {};
    if (submission.criteriaScores && submission.criteriaScores.length > 0) {
      for (const cs of submission.criteriaScores) {
        if (cs.criteriaId != null) {
          criteriaScores[cs.criteriaId] = cs.score?.toString() || '';
          criteriaFeedback[cs.criteriaId] = cs.feedback || '';
        }
      }
    }
    setGradingModal({
      isOpen: true,
      submission,
      score: submission.score?.toString() || '',
      feedback: submission.feedback || '',
      criteriaScores,
      criteriaFeedback,
      submitting: false
    });
  };

  const openViewModal = (submission: AssignmentSubmissionDetailDTO) => {
    setViewModal({ isOpen: true, submission });
  };

  // Filter and search submissions
  const filteredSubmissions = submissions.filter(sub => {
    // Apply filter
    if (filter === 'pending' && sub.status === SubmissionStatus.GRADED) return false;
    if (filter === 'graded' && sub.status !== SubmissionStatus.GRADED) return false;
    if (filter === 'late' && !sub.isLate) return false;
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return sub.userName.toLowerCase().includes(query);
    }
    return true;
  });

  const getStatusIcon = (sub: AssignmentSubmissionDetailDTO) => {
    if (sub.status === SubmissionStatus.GRADED) {
      const isPassed = sub.isPassed === true;
      return isPassed ? 
        <CheckCircle className="status-icon passed" size={18} /> :
        <AlertCircle className="status-icon failed" size={18} />;
    }
    if (sub.isLate) {
      return <AlertCircle className="status-icon late" size={18} />;
    }
    return <Clock className="status-icon pending" size={18} />;
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

  const pendingCount = submissions.filter(s => s.status !== SubmissionStatus.GRADED && s.isNewest).length;
  const gradedCount = submissions.filter(s => s.status === SubmissionStatus.GRADED).length;
  const lateCount = submissions.filter(s => s.isLate).length;

  if (loading) {
    return (
      <div className="mentor-grading-page">
        <div className="grading-loading">
          <div className="grading-spinner" />
          <span>Loading submissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-grading-page">
      {/* Header */}
      <div className="grading-header">
        <button className="grading-back-btn" onClick={() => {
          if (state?.fromGradingDashboard) {
            navigate('/mentor', { state: { activeTab: 'grading' } });
          } else {
            navigate('/mentor');
          }
        }}>
          <ArrowLeft size={20} />
          {state?.fromGradingDashboard ? 'Quay về Chấm Bài' : 'Back to Dashboard'}
        </button>
        <div className="grading-title-section">
          {/* Breadcrumb */}
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
          <h1>{assignment?.title || 'Assignment Grading'}</h1>
          <div className="grading-meta">
            {assignment?.submissionType && (
              <span className="grading-type">
                {assignment.submissionType === SubmissionType.TEXT && <FileText size={16} />}
                {assignment.submissionType === SubmissionType.LINK && <LinkIcon size={16} />}
                {assignment.submissionType === SubmissionType.FILE && <Upload size={16} />}
                {assignment.submissionType}
              </span>
            )}
            <span className="grading-max-score">Max: {assignment?.maxScore} pts</span>
            {assignment?.dueAt && (
              <span className="grading-due">Due: {formatDate(assignment.dueAt)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Info Card */}
      {assignment?.description && (
        <div className="assignment-info-card">
          <div className="info-card-header">
            <FileText size={20} />
            <h3>Yêu Cầu Bài Tập</h3>
          </div>
          <div className="info-card-body">
            <p>{assignment.description}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grading-stats">
        <div className={`stat-card ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
          <Clock size={24} />
          <div className="stat-content">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className={`stat-card ${filter === 'graded' ? 'active' : ''}`} onClick={() => setFilter('graded')}>
          <CheckCircle size={24} />
          <div className="stat-content">
            <span className="stat-value">{gradedCount}</span>
            <span className="stat-label">Graded</span>
          </div>
        </div>
        <div className={`stat-card ${filter === 'late' ? 'active' : ''}`} onClick={() => setFilter('late')}>
          <AlertCircle size={24} />
          <div className="stat-content">
            <span className="stat-value">{lateCount}</span>
            <span className="stat-label">Late</span>
          </div>
        </div>
        <div className={`stat-card ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          <User size={24} />
          <div className="stat-content">
            <span className="stat-value">{submissions.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grading-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Submissions Table */}
      <div className="submissions-table-container">
        <table className="submissions-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Submitted</th>
              <th>Attempt</th>
              <th>Status</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-submissions">
                  No submissions found
                </td>
              </tr>
            ) : (
              filteredSubmissions.map(sub => (
                <tr key={sub.id} className={sub.isLate ? 'late-row' : ''}>
                  <td className="student-cell">
                    <User size={16} />
                    <span>{sub.userName}</span>
                    {sub.isNewest && <span className="newest-badge">Latest</span>}
                  </td>
                  <td>{formatDate(sub.submittedAt)}</td>
                  <td>#{sub.attemptNumber}</td>
                  <td className="status-cell">
                    {getStatusIcon(sub)}
                    <span>
                      {sub.status === SubmissionStatus.GRADED
                        ? 'Graded'
                        : sub.isLate
                        ? 'Late'
                        : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {sub.score !== undefined && sub.score !== null
                      ? `${sub.score}/${sub.maxScore}`
                      : '-'}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="action-btn view"
                      onClick={() => openViewModal(sub)}
                      title="View submission"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="action-btn grade"
                      onClick={() => openGradingModal(sub)}
                      title="Grade submission"
                    >
                      <Edit3 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Submission Modal */}
      {viewModal.isOpen && viewModal.submission && (
        <div className="grading-modal-overlay" onClick={() => setViewModal({ isOpen: false, submission: null })}>
          <div className="grading-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submission Details</h2>
              <button className="modal-close" onClick={() => setViewModal({ isOpen: false, submission: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="submission-detail-row">
                <label>Student:</label>
                <span>{viewModal.submission.userName}</span>
              </div>
              <div className="submission-detail-row">
                <label>Submitted:</label>
                <span>{formatDate(viewModal.submission.submittedAt)}</span>
              </div>
              <div className="submission-detail-row">
                <label>Attempt:</label>
                <span>#{viewModal.submission.attemptNumber}</span>
              </div>
              {viewModal.submission.isLate && (
                <div className="late-warning-badge">
                  <AlertCircle size={16} />
                  Late Submission
                </div>
              )}
              <div className="submission-content-section">
                <label>Submission Content:</label>
                {viewModal.submission.submissionText && (
                  <div className="submission-text-view">
                    {viewModal.submission.submissionText}
                  </div>
                )}
                {viewModal.submission.linkUrl && (
                  <a
                    href={viewModal.submission.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="submission-link-view"
                  >
                    <LinkIcon size={16} />
                    {viewModal.submission.linkUrl}
                  </a>
                )}
                {viewModal.submission.fileMediaUrl && (
                  <a
                    href={viewModal.submission.fileMediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="submission-file-view"
                  >
                    <Upload size={16} />
                    View Uploaded File
                  </a>
                )}
              </div>
              {viewModal.submission.feedback && (
                <div className="submission-feedback-section">
                  <label>Your Feedback:</label>
                  <p>{viewModal.submission.feedback}</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn primary"
                onClick={() => {
                  setViewModal({ isOpen: false, submission: null });
                  openGradingModal(viewModal.submission!);
                }}
              >
                <Edit3 size={16} />
                Grade This
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingModal.isOpen && gradingModal.submission && (
        <div className="grading-modal-overlay" onClick={() => !gradingModal.submitting && setGradingModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="grading-modal" onClick={e => e.stopPropagation()} style={hasCriteria ? { maxWidth: 640 } : undefined}>
            <div className="modal-header">
              <h2>Chấm Điểm</h2>
              <button
                className="modal-close"
                onClick={() => setGradingModal(prev => ({ ...prev, isOpen: false }))}
                disabled={gradingModal.submitting}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="submission-detail-row">
                <label>Học viên:</label>
                <span>{gradingModal.submission.userName}</span>
              </div>
              <div className="submission-detail-row">
                <label>Lần nộp:</label>
                <span>#{gradingModal.submission.attemptNumber}</span>
              </div>

              {hasCriteria ? (
                <>
                  {/* Criteria-based grading */}
                  <div className="criteria-grading-section">
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                      Chấm theo tiêu chí ({assignment!.criteria!.length} tiêu chí)
                    </label>
                    {assignment!.criteria!.map((c: AssignmentCriteriaDTO) => {
                      const currentScore = parseFloat(gradingModal.criteriaScores[c.id!] || '');
                      const threshold = c.passingPoints ?? c.maxPoints;
                      const isCriterionPassed = !isNaN(currentScore) && currentScore >= threshold;
                      const hasInput = !isNaN(currentScore);
                      return (
                      <div key={c.id} className="criteria-score-row" style={{
                        padding: '0.75rem', marginBottom: '0.5rem',
                        background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                        border: `1px solid ${hasInput ? (isCriterionPassed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.06)'}`,
                        borderLeft: hasInput ? `3px solid ${isCriterionPassed ? '#10b981' : '#ef4444'}` : '3px solid transparent'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.9rem' }}>
                            {c.name}
                            {c.isRequired && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {c.passingPoints != null && (
                              <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>Pass: ≥{c.passingPoints}</span>
                            )}
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Tối đa: {c.maxPoints}</span>
                          </div>
                        </div>
                        {c.description && (
                          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>{c.description}</p>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max={c.maxPoints}
                            step="0.5"
                            value={gradingModal.criteriaScores[c.id!] || ''}
                            onChange={e => setGradingModal(prev => ({
                              ...prev,
                              criteriaScores: { ...prev.criteriaScores, [c.id!]: e.target.value }
                            }))}
                            placeholder="Điểm"
                            disabled={gradingModal.submitting}
                            style={{
                              width: 90, padding: '0.5rem', background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                              color: '#e2e8f0', fontSize: '0.9rem', textAlign: 'center'
                            }}
                          />
                          <input
                            type="text"
                            value={gradingModal.criteriaFeedback[c.id!] || ''}
                            onChange={e => setGradingModal(prev => ({
                              ...prev,
                              criteriaFeedback: { ...prev.criteriaFeedback, [c.id!]: e.target.value }
                            }))}
                            placeholder="Nhận xét tiêu chí (tùy chọn)"
                            disabled={gradingModal.submitting}
                            style={{
                              flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                              color: '#e2e8f0', fontSize: '0.85rem'
                            }}
                          />
                        </div>
                      </div>
                    );
                    })}
                    {/* Auto-calculated total + criteria pass/fail summary */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem', marginTop: '0.5rem',
                      background: 'rgba(6, 182, 212, 0.1)', borderRadius: 8,
                      border: '1px solid rgba(6, 182, 212, 0.2)'
                    }}>
                      <div>
                        <span style={{ color: '#06b6d4', fontWeight: 600, fontSize: '0.9rem' }}>Tổng điểm</span>
                        {assignment?.criteria?.some(c => c.passingPoints != null) && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                            {assignment.criteria.filter(c => c.isRequired).every(c => {
                              const score = parseFloat(gradingModal.criteriaScores[c.id!] || '0');
                              const threshold = c.passingPoints ?? c.maxPoints;
                              return score >= threshold;
                            })
                              ? <span style={{ color: '#10b981' }}>✓ Đạt tất cả tiêu chí bắt buộc</span>
                              : <span style={{ color: '#ef4444' }}>✗ Chưa đạt một số tiêu chí bắt buộc</span>
                            }
                          </div>
                        )}
                      </div>
                      <span style={{ 
                        color: criteriaTotal > (assignment?.maxScore || 0) ? '#ef4444' : '#06b6d4', 
                        fontWeight: 700, fontSize: '1.1rem' 
                      }}>
                        {criteriaTotal} / {assignment?.maxScore}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* Flat score grading (no criteria) */
                <div className="grade-input-group">
                  <label htmlFor="score">Điểm (Tối đa: {assignment?.maxScore}):</label>
                  <input
                    id="score"
                    type="number"
                    min="0"
                    max={assignment?.maxScore}
                    step="0.5"
                    value={gradingModal.score}
                    onChange={e => setGradingModal(prev => ({ ...prev, score: e.target.value }))}
                    placeholder="Nhập điểm"
                    disabled={gradingModal.submitting}
                  />
                </div>
              )}
              
              <div className="grade-input-group">
                <label htmlFor="feedback">Nhận xét chung (tùy chọn):</label>
                <textarea
                  id="feedback"
                  value={gradingModal.feedback}
                  onChange={e => setGradingModal(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Nhập nhận xét cho học viên..."
                  rows={3}
                  disabled={gradingModal.submitting}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn secondary"
                onClick={() => setGradingModal(prev => ({ ...prev, isOpen: false }))}
                disabled={gradingModal.submitting}
              >
                Hủy
              </button>
              <button
                className="modal-btn primary"
                onClick={handleGrade}
                disabled={
                  gradingModal.submitting || 
                  (hasCriteria 
                    ? Object.keys(gradingModal.criteriaScores).length < (assignment?.criteria?.length || 0)
                    : !gradingModal.score)
                }
              >
                {gradingModal.submitting ? (
                  <>
                    <div className="grading-spinner small" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Lưu Điểm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorGradingPage;
