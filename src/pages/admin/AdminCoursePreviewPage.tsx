/**
 * AdminCoursePreviewPage — Full-page admin course preview for review & approval.
 * 
 * Replaces the old modal in CourseApprovalTabCosmic with a dedicated page that
 * provides a better UX for reviewing course content (modules, lessons, assignments, quizzes).
 * 
 * Route: /admin/courses/:courseId/preview
 * Access: ADMIN / CONTENT_ADMIN only (wrapped in <AdminRoute>)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, User, Award, Layers, Play, FileText,
  CheckCircle, XCircle, ShieldOff, ShieldCheck,
  Clock, BookOpen, ChevronDown, ChevronUp,
  Calendar, DollarSign, Tag, ClipboardList, HelpCircle,
  CheckSquare, AlertCircle, PenTool, Paperclip, Download, ExternalLink
} from 'lucide-react';
import { getCourse, approveCourse, rejectCourse, suspendCourse, restoreCourse } from '../../services/courseService';
import { listModulesWithContent, ModuleDetailDTO } from '../../services/moduleService';
import { getLessonById } from '../../services/lessonService';
import { getQuizById } from '../../services/quizService';
import { getAssignmentById } from '../../services/assignmentService';
import { LessonAttachmentDTO, listAttachments } from '../../services/attachmentService';
import { CourseDetailDTO, CourseStatus } from '../../data/courseDTOs';
import { QuizDetailDTO, QuizQuestionDetailDTO, QuestionType } from '../../data/quizDTOs';
import { AssignmentDetailDTO } from '../../data/assignmentDTOs';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import { NeuralCard } from '../../components/learning-hud';
import Toast from '../../components/shared/Toast';
import './AdminCoursePreviewPage.css';

// ==================== SUB-COMPONENTS ====================

type ModulePreviewItem =
  | { kind: 'lesson'; id: number; title: string; orderIndex: number; lessonType: string; durationSec?: number }
  | { kind: 'assignment'; id: number; title: string; orderIndex: number; description?: string; maxScore?: number }
  | { kind: 'quiz'; id: number; title: string; orderIndex: number; passScore: number; questionCount?: number };

const previewKindPriority: Record<ModulePreviewItem['kind'], number> = {
  lesson: 0,
  assignment: 1,
  quiz: 2
};

const getModulePreviewItems = (module: ModuleDetailDTO): ModulePreviewItem[] => {
  const lessonItems: ModulePreviewItem[] = (module.lessons || []).map((lesson) => ({
    kind: 'lesson',
    id: lesson.id,
    title: lesson.title,
    orderIndex: lesson.orderIndex ?? 0,
    lessonType: lesson.type,
    durationSec: lesson.durationSec
  }));

  const assignmentItems: ModulePreviewItem[] = (module.assignments || []).map((assignment) => ({
    kind: 'assignment',
    id: assignment.id,
    title: assignment.title,
    orderIndex: assignment.orderIndex ?? 0,
    description: assignment.description,
    maxScore: assignment.maxScore
  }));

  const quizItems: ModulePreviewItem[] = (module.quizzes || []).map((quiz) => ({
    kind: 'quiz',
    id: quiz.id,
    title: quiz.title,
    orderIndex: quiz.orderIndex ?? 0,
    passScore: quiz.passScore,
    questionCount: quiz.questionCount
  }));

  return [...lessonItems, ...assignmentItems, ...quizItems].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    if (previewKindPriority[a.kind] !== previewKindPriority[b.kind]) {
      return previewKindPriority[a.kind] - previewKindPriority[b.kind];
    }
    return a.id - b.id;
  });
};

const getPreviewItemLabel = (item: ModulePreviewItem) => {
  if (item.kind === 'lesson') {
    switch (item.lessonType) {
      case 'READING':
        return 'Bài đọc';
      case 'VIDEO':
        return 'Video';
      default:
        return item.lessonType;
    }
  }

  if (item.kind === 'assignment') {
    return 'Bài tập';
  }

  return 'Quiz';
};

const getPreviewItemBadgeClass = (item: ModulePreviewItem) => {
  if (item.kind === 'lesson') {
    return item.lessonType === 'READING'
      ? 'acp-type-badge-reading'
      : item.lessonType === 'VIDEO'
        ? 'acp-type-badge-video'
        : 'acp-type-badge-lesson';
  }

  if (item.kind === 'assignment') {
    return 'acp-type-badge-assignment';
  }

  return 'acp-type-badge-quiz';
};

const isSafePreviewUrl = (value?: string | null) => {
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/** Expandable lesson detail — loaded on-demand when user clicks */
const LessonDetail: React.FC<{ lessonId: number }> = ({ lessonId }) => {
  const [lesson, setLesson] = useState<any>(null);
  const [attachments, setAttachments] = useState<LessonAttachmentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadLesson = useCallback(async () => {
    if (lesson) { setExpanded(prev => !prev); return; }
    try {
      setLoading(true);
      const data = await getLessonById(lessonId);
      setLesson(data);
      if (data.type === 'READING') {
        const attachmentList = await listAttachments(lessonId);
        setAttachments(attachmentList);
      }
      setExpanded(true);
    } catch (err) {
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  }, [lessonId, lesson]);

  return (
    <div className="acp-lesson-detail">
      <button className="acp-lesson-expand-btn" onClick={loadLesson} disabled={loading}>
        {loading ? <Clock size={14} className="acp-spin" /> : expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>Xem nội dung</span>
      </button>
      {expanded && lesson && (
        <div className="acp-lesson-content">
          {lesson.type === 'VIDEO' && lesson.videoUrl && (
            <div className="acp-video-wrapper">
              <iframe
                src={lesson.videoUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {lesson.type === 'READING' && lesson.contentText && (
            <div className="acp-reading-content" dangerouslySetInnerHTML={{ __html: lesson.contentText }} />
          )}
          {lesson.type === 'READING' && lesson.resourceUrl && (
            <div className="acp-reading-resource">
              <span className="acp-reading-resource-label">Liên kết tham khảo</span>
              {isSafePreviewUrl(lesson.resourceUrl) ? (
                <a
                  href={lesson.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="acp-reading-resource-link"
                >
                  <ExternalLink size={14} /> Mở liên kết
                </a>
              ) : (
                <span className="acp-reading-resource-invalid">Liên kết không hợp lệ</span>
              )}
            </div>
          )}
          {lesson.type === 'READING' && attachments.length > 0 && (
            <div className="acp-reading-attachments">
              <div className="acp-reading-attachments-title">
                <Paperclip size={15} /> Tài liệu đính kèm ({attachments.length})
              </div>
              <div className="acp-reading-attachments-list">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="acp-reading-attachment-item">
                    <div className="acp-reading-attachment-info">
                      <span className="acp-reading-attachment-name">{attachment.title}</span>
                      <div className="acp-reading-attachment-meta">
                        <span className="acp-reading-attachment-type">{attachment.type}</span>
                        {attachment.fileSizeFormatted && (
                          <span className="acp-reading-attachment-size">{attachment.fileSizeFormatted}</span>
                        )}
                      </div>
                    </div>
                    {isSafePreviewUrl(attachment.downloadUrl) ? (
                      <a
                        href={attachment.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="acp-reading-attachment-link"
                        title="Mở tài liệu"
                      >
                        <Download size={14} />
                        <span>Mở file</span>
                      </a>
                    ) : (
                      <span className="acp-reading-resource-invalid">File/link không hợp lệ</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {lesson.type === 'VIDEO' && !lesson.videoUrl && (
            <div className="acp-empty-content"><Play size={32} /><p>Chưa có video</p></div>
          )}
          {lesson.type === 'READING' && !lesson.contentText && (
            <div className="acp-empty-content"><FileText size={32} /><p>Chưa có nội dung</p></div>
          )}
        </div>
      )}
    </div>
  );
};

/** Expandable quiz detail — loads questions on-demand */
const QuizDetail: React.FC<{ quizId: number }> = ({ quizId }) => {
  const [quiz, setQuiz] = useState<QuizDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadQuiz = useCallback(async () => {
    if (quiz) { setExpanded(prev => !prev); return; }
    try {
      setLoading(true);
      const data = await getQuizById(quizId);
      setQuiz(data);
      setExpanded(true);
    } catch (err) {
      console.error('Error loading quiz:', err);
    } finally {
      setLoading(false);
    }
  }, [quizId, quiz]);

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE: return 'Trắc nghiệm';
      case QuestionType.TRUE_FALSE: return 'Đúng/Sai';
      case QuestionType.SHORT_ANSWER: return 'Điền từ';
      default: return type;
    }
  };

  return (
    <div className="acp-quiz-detail">
      <button className="acp-lesson-expand-btn" onClick={loadQuiz} disabled={loading}>
        {loading ? <Clock size={14} className="acp-spin" /> : expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>Xem câu hỏi</span>
      </button>
      {expanded && quiz && (
        <div className="acp-quiz-content">
          {quiz.questions && quiz.questions.length > 0 ? (
            <div className="acp-questions-list">
              {quiz.questions
                .sort((a: QuizQuestionDetailDTO, b: QuizQuestionDetailDTO) => a.orderIndex - b.orderIndex)
                .map((q: QuizQuestionDetailDTO, qIdx: number) => (
                <div key={q.id} className="acp-question-item">
                  <div className="acp-question-header">
                    <span className="acp-question-number">Câu {qIdx + 1}</span>
                    <span className="acp-question-type-badge">{getQuestionTypeLabel(q.questionType)}</span>
                    <span className="acp-question-score">{q.score} điểm</span>
                  </div>
                  <p className="acp-question-text">{q.questionText}</p>
                  {q.options && q.options.length > 0 && (
                    <div className="acp-options-list">
                      {q.options
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map(opt => (
                        <div key={opt.id} className={`acp-option-item ${opt.correct ? 'acp-option-correct' : ''}`}>
                          {opt.correct ? <CheckCircle size={14} className="acp-option-icon-correct" /> : <span className="acp-option-bullet" />}
                          <span className="acp-option-text">{opt.optionText}</span>
                          {opt.correct && <span className="acp-correct-label">Đáp án đúng</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="acp-empty-content">
              <HelpCircle size={24} />
              <p>Chưa có câu hỏi nào</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Expandable assignment detail — loads criteria on-demand */
const AssignmentDetailView: React.FC<{ assignmentId: number }> = ({ assignmentId }) => {
  const [assignment, setAssignment] = useState<AssignmentDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadAssignment = useCallback(async () => {
    if (assignment) { setExpanded(prev => !prev); return; }
    try {
      setLoading(true);
      const data = await getAssignmentById(assignmentId);
      setAssignment(data);
      setExpanded(true);
    } catch (err) {
      console.error('Error loading assignment:', err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, assignment]);

  return (
    <div className="acp-assignment-detail">
      <button className="acp-lesson-expand-btn" onClick={loadAssignment} disabled={loading}>
        {loading ? <Clock size={14} className="acp-spin" /> : expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>Xem chi tiết</span>
      </button>
      {expanded && assignment && (
        <div className="acp-assignment-content">
          {/* Assignment metadata */}
          <div className="acp-assignment-meta">
            {assignment.passingScore != null && (
              <span className="acp-assignment-meta-item">
                <AlertCircle size={14} /> Điểm đạt: {assignment.passingScore}/{assignment.maxScore}
              </span>
            )}
            {assignment.submissionType && (
              <span className="acp-assignment-meta-item">
                <FileText size={14} /> Hình thức: {assignment.submissionType === 'FILE' ? 'Nộp file' : assignment.submissionType === 'TEXT' ? 'Viết bài' : 'Nộp link'}
              </span>
            )}
            {assignment.isRequired && (
              <span className="acp-assignment-meta-item acp-required-tag">
                <CheckSquare size={14} /> Bắt buộc
              </span>
            )}
          </div>

          {/* Learning outcome */}
          {assignment.learningOutcome && (
            <div className="acp-assignment-section">
              <h5 className="acp-assignment-section-title">Mục tiêu học tập</h5>
              <p className="acp-assignment-section-text">{assignment.learningOutcome}</p>
            </div>
          )}

          {/* Grading criteria text */}
          {assignment.gradingCriteria && (
            <div className="acp-assignment-section">
              <h5 className="acp-assignment-section-title">Hướng dẫn chấm điểm</h5>
              <p className="acp-assignment-section-text">{assignment.gradingCriteria}</p>
            </div>
          )}

          {/* Criteria rubric table */}
          {assignment.criteria && assignment.criteria.length > 0 ? (
            <div className="acp-criteria-section">
              <h5 className="acp-assignment-section-title">Bảng tiêu chí chấm điểm ({assignment.criteria.length} tiêu chí)</h5>
              <table className="acp-criteria-table">
                <thead>
                  <tr>
                    <th>Tiêu chí</th>
                    <th>Mô tả</th>
                    <th>Điểm tối đa</th>
                    <th>Điểm đạt</th>
                    <th>Bắt buộc</th>
                  </tr>
                </thead>
                <tbody>
                  {assignment.criteria
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map(c => (
                    <tr key={c.id || c.clientId}>
                      <td className="acp-criteria-name">{c.name}</td>
                      <td className="acp-criteria-desc">{c.description || '—'}</td>
                      <td className="acp-criteria-points">{c.maxPoints}</td>
                      <td className="acp-criteria-points">{c.passingPoints ?? '—'}</td>
                      <td className="acp-criteria-required">{c.isRequired ? <CheckCircle size={14} className="acp-icon-yes" /> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}><strong>Tổng</strong></td>
                    <td className="acp-criteria-points"><strong>{assignment.criteria.reduce((s, c) => s + c.maxPoints, 0)}</strong></td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="acp-empty-content acp-empty-small">
              <p>Chưa có tiêu chí chấm điểm (chấm theo điểm tổng)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Action confirmation modal — kept as modal since it's a quick action */
const ActionModal: React.FC<{
  actionType: 'approve' | 'reject' | 'suspend' | 'restore';
  courseTitle: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ actionType, courseTitle, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  const needsReason = actionType === 'reject' || actionType === 'suspend';

  const labels: Record<string, { title: string; prompt: string; btn: string; btnClass: string }> = {
    approve:  { title: 'Duyệt Khóa Học',      prompt: `Bạn có chắc chắn muốn duyệt khóa học "${courseTitle}"?`,                    btn: 'Xác nhận duyệt',      btnClass: 'acp-btn-approve' },
    reject:   { title: 'Từ Chối Khóa Học',     prompt: `Vui lòng nhập lý do từ chối khóa học "${courseTitle}"`,                      btn: 'Xác nhận từ chối',     btnClass: 'acp-btn-reject' },
    suspend:  { title: 'Tạm Khóa Khóa Học',    prompt: `Vui lòng nhập lý do tạm khóa khóa học "${courseTitle}"`,                    btn: 'Xác nhận tạm khóa',   btnClass: 'acp-btn-suspend' },
    restore:  { title: 'Khôi Phục Khóa Học',    prompt: `Bạn có chắc chắn muốn khôi phục khóa học "${courseTitle}" về trạng thái Công Khai?`, btn: 'Xác nhận khôi phục',   btnClass: 'acp-btn-restore' },
  };

  const cfg = labels[actionType];

  return (
    <div className="acp-modal-overlay" onClick={onCancel}>
      <div className="acp-modal" onClick={e => e.stopPropagation()}>
        <h3>{cfg.title}</h3>
        <p>{cfg.prompt}</p>
        {needsReason && (
          <textarea
            className="acp-reason-input"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={actionType === 'reject' ? 'Nhập lý do từ chối...' : 'Nhập lý do tạm khóa...'}
            rows={4}
          />
        )}
        <div className="acp-modal-actions">
          <button className="acp-btn-secondary" onClick={onCancel} disabled={loading}>Hủy</button>
          <button
            className={cfg.btnClass}
            onClick={() => onConfirm(reason)}
            disabled={loading || (needsReason && !reason.trim())}
          >
            {loading ? 'Đang xử lý...' : cfg.btn}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN PAGE ====================

const AdminCoursePreviewPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning } = useToast();

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [modules, setModules] = useState<ModuleDetailDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject' | 'suspend' | 'restore' } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const returnTo = ((location.state as { returnTo?: string } | null)?.returnTo || '/admin?tab=courses');

  const getApiErrorMessage = useCallback((error: unknown, fallbackMessage: string) => {
    const responseData = (error as { response?: { data?: unknown } })?.response?.data;
    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === 'object') {
      const responseObject = responseData as { message?: string; error?: string };
      if (responseObject.message?.trim()) {
        return responseObject.message;
      }
      if (responseObject.error?.trim()) {
        return responseObject.error;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }, []);

  // ---- Data Loading ----
  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const id = parseInt(courseId, 10);
      const [courseData, moduleData] = await Promise.all([
        getCourse(id),
        listModulesWithContent(id)
      ]);
      const sortedModules = [...(moduleData as ModuleDetailDTO[])].sort((a, b) => a.orderIndex - b.orderIndex);
      setCourse(courseData);
      setModules(sortedModules);
      // Expand all modules by default
      const expanded: Record<number, boolean> = {};
      sortedModules.forEach(m => { expanded[m.id] = true; });
      setExpandedModules(expanded);
    } catch (err) {
      console.error('Error loading course:', err);
      showError('Lỗi', 'Không thể tải thông tin khóa học');
    } finally {
      setLoading(false);
    }
  }, [courseId, showError]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  // ---- Actions ----
  const handleConfirmAction = async (reason: string) => {
    if (!course || !user || !actionModal) return;

    if ((actionModal.type === 'reject' || actionModal.type === 'suspend') && !reason.trim()) {
      showWarning('Cảnh báo', actionModal.type === 'reject' ? 'Vui lòng nhập lý do từ chối' : 'Vui lòng nhập lý do tạm khóa');
      return;
    }

    try {
      setActionLoading(true);
      let successMessage = '';
      switch (actionModal.type) {
        case 'approve':
          await approveCourse(course.id, user.id);
          successMessage = `Đã duyệt khóa học "${course.title}".`;
          break;
        case 'reject':
          await rejectCourse(course.id, user.id, reason);
          successMessage = `Đã từ chối khóa học "${course.title}".`;
          break;
        case 'suspend':
          await suspendCourse(course.id, user.id, reason);
          successMessage = `Đã tạm khóa khóa học "${course.title}".`;
          break;
        case 'restore':
          await restoreCourse(course.id, user.id);
          successMessage = `Đã khôi phục khóa học "${course.title}".`;
          break;
      }
      setActionModal(null);
      await loadCourse();
      showSuccess('Cập nhật khóa học', successMessage);
    } catch (err) {
      console.error('Error processing action:', err);
      showError(
        'Không thể cập nhật khóa học',
        getApiErrorMessage(err, 'Có lỗi xảy ra khi xử lý yêu cầu.')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  // ---- Helpers ----
  const getStatusBadge = (status?: string) => {
    const map: Record<string, { label: string; className: string }> = {
      PENDING:   { label: 'Chờ duyệt',    className: 'acp-status-pending' },
      PUBLIC:    { label: 'Đã duyệt',     className: 'acp-status-public' },
      DRAFT:     { label: 'Bản nháp',     className: 'acp-status-draft' },
      REJECTED:  { label: 'Đã từ chối',   className: 'acp-status-rejected' },
      SUSPENDED: { label: 'Tạm khóa',     className: 'acp-status-suspended' },
      ARCHIVED:  { label: 'Đã lưu trữ',   className: 'acp-status-archived' },
    };
    const cfg = map[status || ''] || { label: status || 'N/A', className: '' };
    return <span className={`acp-status-badge ${cfg.className}`}>{cfg.label}</span>;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount || amount === 0) return 'Miễn phí';
    return amount.toLocaleString('vi-VN') + ' ' + (currency || 'VND');
  };

  // ---- Computed ----
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const totalAssignments = modules.reduce((sum, m) => sum + (m.assignments?.length || 0), 0);
  const totalQuizzes = modules.reduce((sum, m) => sum + (m.quizzes?.length || 0), 0);

  // ---- Render ----
  if (loading) {
    return (
      <div className="acp-page">
        <div className="acp-loading">
          <MeowlKuruLoader size="medium" text="" />
          <p>Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="acp-page">
        <div className="acp-empty">
          <BookOpen size={64} />
          <h3>Không tìm thấy khóa học</h3>
          <button className="acp-btn-secondary" onClick={() => navigate(returnTo)}>
            <ArrowLeft size={18} /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="acp-page">
      {/* Top Bar */}
      <div className="acp-topbar">
        <button className="acp-back-btn" onClick={() => navigate(returnTo)}>
          <ArrowLeft size={20} />
          <span>Quay lại quản lý</span>
        </button>
        <div className="acp-topbar-actions">
          {course.status === CourseStatus.PENDING && (
            <>
              <button className="acp-btn-approve" onClick={() => setActionModal({ type: 'approve' })}>
                <CheckCircle size={18} /> Duyệt
              </button>
              <button className="acp-btn-reject" onClick={() => setActionModal({ type: 'reject' })}>
                <XCircle size={18} /> Từ chối
              </button>
            </>
          )}
          {course.status === CourseStatus.PUBLIC && (
            <button className="acp-btn-suspend" onClick={() => setActionModal({ type: 'suspend' })}>
              <ShieldOff size={18} /> Tạm khóa
            </button>
          )}
          {course.status === CourseStatus.SUSPENDED && (
            <button className="acp-btn-restore" onClick={() => setActionModal({ type: 'restore' })}>
              <ShieldCheck size={18} /> Khôi phục
            </button>
          )}
        </div>
      </div>

      {/* Course Header */}
      <div className="acp-header">
        <div className="acp-header-left">
          {course.thumbnailUrl && (
            <img className="acp-thumbnail" src={course.thumbnailUrl} alt={course.title} />
          )}
          <div className="acp-header-info">
            <div className="acp-title-row">
              <h1 className="acp-title">{course.title}</h1>
              {getStatusBadge(course.status)}
            </div>
            <div className="acp-meta-row">
              <span className="acp-meta-item"><User size={16} /> {course.authorName || 'N/A'}</span>
              <span className="acp-meta-item"><Award size={16} /> {course.level}</span>
              <span className="acp-meta-item"><Calendar size={16} /> Tạo: {formatDate(course.createdAt)}</span>
              <span className="acp-meta-item"><DollarSign size={16} /> {formatCurrency(course.price, course.currency)}</span>
            </div>
            {course.category && (
              <div className="acp-tags">
                <span className="acp-tag"><Tag size={12} /> {course.category}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection / Suspension info */}
      {course.status === CourseStatus.REJECTED && course.rejectionReason && (
        <div className="acp-alert acp-alert-rejected">
          <XCircle size={20} />
          <div>
            <strong>Lý do từ chối:</strong> {course.rejectionReason}
            {course.rejectedAt && <span className="acp-alert-date"> — {formatDate(course.rejectedAt)}</span>}
          </div>
        </div>
      )}
      {course.status === CourseStatus.SUSPENDED && course.suspensionReason && (
        <div className="acp-alert acp-alert-suspended">
          <ShieldOff size={20} />
          <div>
            <strong>Lý do tạm khóa:</strong> {course.suspensionReason}
            {course.suspendedAt && <span className="acp-alert-date"> — {formatDate(course.suspendedAt)}</span>}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="acp-stats-grid">
        <div className="acp-stat-card">
          <Layers size={20} />
          <div><div className="acp-stat-value">{modules.length}</div><div className="acp-stat-label">Modules</div></div>
        </div>
        <div className="acp-stat-card">
          <BookOpen size={20} />
          <div><div className="acp-stat-value">{totalLessons}</div><div className="acp-stat-label">Bài học</div></div>
        </div>
        <div className="acp-stat-card">
          <FileText size={20} />
          <div><div className="acp-stat-value">{totalAssignments}</div><div className="acp-stat-label">Bài tập</div></div>
        </div>
        <div className="acp-stat-card">
          <CheckCircle size={20} />
          <div><div className="acp-stat-value">{totalQuizzes}</div><div className="acp-stat-label">Bài kiểm tra</div></div>
        </div>
      </div>

      {/* Description */}
      <NeuralCard className="acp-section">
        <h2 className="acp-section-title">Mô tả khóa học</h2>
        <div className="acp-description">
          {course.description || <em className="acp-text-dim">Chưa có mô tả</em>}
        </div>
      </NeuralCard>

      {/* Modules Content */}
      <div className="acp-section">
        <h2 className="acp-section-title">Nội dung khóa học ({modules.length} modules)</h2>

        {modules.length === 0 ? (
          <div className="acp-empty-content">
            <Layers size={48} />
            <p>Khóa học chưa có nội dung</p>
          </div>
        ) : (
          modules.map((module, idx) => (
            <NeuralCard key={module.id} className="acp-module-card">
              {/* Module Header */}
              <div className="acp-module-header" onClick={() => toggleModule(module.id)}>
                <div className="acp-module-title-row">
                  <Layers size={20} className="acp-module-icon" />
                  <div>
                    <h3 className="acp-module-title">Module {idx + 1}: {module.title}</h3>
                    {module.description && <p className="acp-module-desc">{module.description}</p>}
                  </div>
                </div>
                <div className="acp-module-toggle">
                  {expandedModules[module.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Module Content (collapsible) */}
              {expandedModules[module.id] && (
                <div className="acp-module-body">
                  {getModulePreviewItems(module).length > 0 && (
                    <>
                      <div className="acp-module-summary">
                        {!!module.lessons?.length && (
                          <span className="acp-summary-pill acp-summary-pill-lesson">
                            <BookOpen size={14} /> Bài học ({module.lessons.length})
                          </span>
                        )}
                        {!!module.assignments?.length && (
                          <span className="acp-summary-pill acp-summary-pill-assignment">
                            <PenTool size={14} /> Bài tập ({module.assignments.length})
                          </span>
                        )}
                        {!!module.quizzes?.length && (
                          <span className="acp-summary-pill acp-summary-pill-quiz">
                            <ClipboardList size={14} /> Bài kiểm tra ({module.quizzes.length})
                          </span>
                        )}
                      </div>

                      <div className="acp-content-sequence">
                        {getModulePreviewItems(module).map((item, itemIdx) => (
                          <div key={`${item.kind}-${item.id}`} className={`acp-content-item acp-content-item-${item.kind}`}>
                            <div className="acp-content-item-header">
                              <div className="acp-content-item-leading">
                                <span className="acp-content-order">{itemIdx + 1}.</span>
                                <span className="acp-content-item-name">{item.title}</span>
                              </div>
                              <div className="acp-content-item-meta">
                                <span className={`acp-type-badge ${getPreviewItemBadgeClass(item)}`}>
                                  {getPreviewItemLabel(item)}
                                </span>
                                {item.kind === 'lesson' && !!item.durationSec && (
                                  <span className="acp-duration">{Math.ceil(item.durationSec / 60)} phút</span>
                                )}
                                {item.kind === 'assignment' && (
                                  <span className="acp-score-badge">{item.maxScore ?? 0} điểm</span>
                                )}
                                {item.kind === 'quiz' && (
                                  <>
                                    {item.questionCount != null && <span className="acp-quiz-count">{item.questionCount} câu</span>}
                                    <span className="acp-score-badge">{item.passScore}% để đạt</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {item.kind === 'assignment' && item.description && (
                              <p className="acp-content-item-desc">{item.description}</p>
                            )}

                            {item.kind === 'lesson' && <LessonDetail lessonId={item.id} />}
                            {item.kind === 'assignment' && <AssignmentDetailView assignmentId={item.id} />}
                            {item.kind === 'quiz' && <QuizDetail quizId={item.id} />}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Empty module */}
                  {getModulePreviewItems(module).length === 0 && (
                    <div className="acp-empty-content">
                      <p>Module này chưa có nội dung</p>
                    </div>
                  )}
                </div>
              )}
            </NeuralCard>
          ))
        )}
      </div>

      {/* Bottom Action Bar (sticky) */}
      {(course.status === CourseStatus.PENDING || course.status === CourseStatus.PUBLIC || course.status === CourseStatus.SUSPENDED) && (
        <div className="acp-bottom-bar">
          <button className="acp-btn-secondary" onClick={() => navigate(returnTo)}>
            <ArrowLeft size={18} /> Quay lại
          </button>
          <div className="acp-bottom-actions">
            {course.status === CourseStatus.PENDING && (
              <>
                <button className="acp-btn-reject" onClick={() => setActionModal({ type: 'reject' })}>
                  <XCircle size={18} /> Từ chối
                </button>
                <button className="acp-btn-approve" onClick={() => setActionModal({ type: 'approve' })}>
                  <CheckCircle size={18} /> Duyệt khóa học
                </button>
              </>
            )}
            {course.status === CourseStatus.PUBLIC && (
              <button className="acp-btn-suspend" onClick={() => setActionModal({ type: 'suspend' })}>
                <ShieldOff size={18} /> Tạm khóa
              </button>
            )}
            {course.status === CourseStatus.SUSPENDED && (
              <button className="acp-btn-restore" onClick={() => setActionModal({ type: 'restore' })}>
                <ShieldCheck size={18} /> Khôi phục
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionModal && course && (
        <ActionModal
          actionType={actionModal.type}
          courseTitle={course.title}
          onConfirm={handleConfirmAction}
          onCancel={() => setActionModal(null)}
          loading={actionLoading}
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
          countdownText={toast.countdownText}
          actionButton={toast.actionButton}
        />
      )}
    </div>
  );
};

export default AdminCoursePreviewPage;
