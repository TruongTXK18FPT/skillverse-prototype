import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  FiBookOpen, FiList, FiFileText, FiPlay, FiHelpCircle, FiClipboard, 
  FiPlus, FiTrash2, FiSettings, FiChevronDown, FiChevronUp, FiInfo,
  FiArrowLeft, FiSave, FiCheck, FiImage, FiX, FiAlertTriangle,
  FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import { useCourseManagement } from '../../../context/mentor/CourseManagementContext';
import { useAuth } from '../../../context/AuthContext';
import { CourseLevel, LessonType, CourseStatus } from '../../../data/courseDTOs';
import { SubmissionType } from '../../../data/assignmentDTOs';
import { QuestionType } from '../../../data/quizDTOs';
import { uploadMedia } from '../../../services/mediaService';
import {
  submitCourseForApproval,
  createCourseRevision,
  getCourseRevision,
  listCourseRevisions,
  submitCourseRevision,
  updateCourseRevision,
  CourseRevisionDTO
} from '../../../services/courseService';
import { useToast } from '../../../hooks/useToast';
import Toast from '../../../components/shared/Toast';
import RichTextEditor from '../../../components/shared/RichTextEditor';
import { 
  AssignmentCriteriaDraft,
  LessonAttachmentDraft,
  LessonDraft,
  LessonKind,
  ModuleDraft,
  QuizOptionDraft,
  QuizQuestionDraft
} from './courseBuilderTypes';
import { 
  AssignmentCriteriaItemErrors,
  AssignmentFieldErrors,
  validateAssignmentScore,
  validateAssignmentsBeforeSave,
  validateQuizzesBeforeSave
} from './courseBuilderValidation';
import '../../../styles/course-builder.css';

// ============================================================================
// TYPES
// ============================================================================

type ViewState = 
  | { type: 'course_info' }
  | { type: 'module'; moduleId: string }
  | { type: 'lesson'; moduleId: string; lessonId: string };

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES = ['Development', 'Business', 'Design', 'Marketing', 'IT & Software', 'Personal Development'];

const LEVELS = [
  { value: CourseLevel.BEGINNER, label: 'Cơ bản' },
  { value: CourseLevel.INTERMEDIATE, label: 'Trung bình' },
  { value: CourseLevel.ADVANCED, label: 'Nâng cao' }
];

const LESSON_TYPES = [
  { value: 'reading', label: 'Bài đọc', icon: <FiFileText />, color: '#3b82f6' },
  { value: 'video', label: 'Video', icon: <FiPlay />, color: '#ef4444' },
  { value: 'quiz', label: 'Quiz', icon: <FiHelpCircle />, color: '#8b5cf6' },
  { value: 'assignment', label: 'Bài tập', icon: <FiClipboard />, color: '#f59e0b' }
];

/** Get display info (Icon, color, label) for a lesson type */
const getLessonTypeMeta = (type: string) => {
  const found = LESSON_TYPES.find(t => t.value === type);
  return {
    Icon: type === 'video' ? FiPlay : type === 'quiz' ? FiHelpCircle : type === 'assignment' ? FiClipboard : FiFileText,
    color: found?.color || '#3b82f6',
    label: found?.label || 'Bài đọc',
  };
};

const createId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

const normalizeLessonAttachments = (attachments?: LessonAttachmentDraft[]) => {
  const normalized: LessonAttachmentDraft[] = [];

  (attachments || []).forEach((attachment) => {
    const draftLike = attachment as LessonAttachmentDraft & {
      id?: string | number;
      title?: string;
      downloadUrl?: string;
    };

    const name = draftLike.name || draftLike.title;
    const url = draftLike.url || draftLike.downloadUrl;
    const serverId = draftLike.serverId ?? (typeof draftLike.id === 'number' ? draftLike.id : undefined);

    if (!serverId && !draftLike.mediaId && !(url && url.trim())) {
      return;
    }

    normalized.push({
      ...attachment,
      ...(serverId ? { serverId } : {}),
      name: name || 'Attachment',
      url
    });
  });

  return normalized;
};

const normalizeSnapshotText = (value?: string | null) => {
  if (value == null) return null;
  const collapsed = value.replace(/\s+/g, ' ').trim();
  return collapsed.length > 0 ? collapsed : null;
};

const buildRevisionContentSnapshot = (modules: ModuleDraft[]) => ({
  snapshotVersion: 1,
  modules: modules.map((module, moduleIndex) => ({
    orderIndex: moduleIndex,
    title: normalizeSnapshotText(module.title),
    description: normalizeSnapshotText(module.description),
    lessons: module.lessons.map((lesson, lessonIndex) => ({
      orderIndex: lessonIndex,
      title: normalizeSnapshotText(lesson.title),
      type: lesson.type,
      durationMin: lesson.durationMin ?? null,
      contentText: normalizeSnapshotText(lesson.contentText),
      resourceUrl: normalizeSnapshotText(lesson.resourceUrl),
      youtubeUrl: normalizeSnapshotText(lesson.youtubeUrl),
      videoMediaId: lesson.videoMediaId ?? null,
      passScore: lesson.passScore ?? null,
      quizMaxAttempts: lesson.quizMaxAttempts ?? null,
      quizTimeLimitMinutes: lesson.quizTimeLimitMinutes ?? null,
      quizDescription: normalizeSnapshotText(lesson.quizDescription),
      gradingMethod: normalizeSnapshotText(lesson.gradingMethod),
      isAssessment: lesson.isAssessment ?? null,
      assignmentSubmissionType: lesson.assignmentSubmissionType ?? null,
      assignmentDescription: normalizeSnapshotText(lesson.assignmentDescription),
      assignmentMaxScore: lesson.assignmentMaxScore ?? null,
      assignmentPassingScore: lesson.assignmentPassingScore ?? null,
      questions: (lesson.questions || []).map((question, questionIndex) => ({
        orderIndex: question.orderIndex ?? questionIndex,
        text: normalizeSnapshotText(question.text),
        type: question.type,
        score: question.score ?? null,
        options: (question.options || []).map((option, optionIndex) => ({
          orderIndex: option.orderIndex ?? optionIndex,
          text: normalizeSnapshotText(option.text),
          correct: option.correct
        }))
      })),
      assignmentCriteria: (lesson.assignmentCriteria || []).map((criteria, criteriaIndex) => ({
        orderIndex: criteria.orderIndex ?? criteriaIndex,
        name: normalizeSnapshotText(criteria.name),
        description: normalizeSnapshotText(criteria.description),
        maxPoints: criteria.maxPoints ?? null,
        isRequired: criteria.isRequired ?? null
      })),
      attachments: normalizeLessonAttachments(lesson.attachments).map((attachment, attachmentIndex) => ({
        orderIndex: attachmentIndex,
        name: normalizeSnapshotText(attachment.name),
        mediaId: attachment.mediaId ?? attachment.serverId ?? null,
        url: normalizeSnapshotText(attachment.url)
      }))
    }))
  }))
});

const toPositiveNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
};

const parseQuestionTypeFromSnapshot = (value: unknown): QuestionType => {
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (upper === QuestionType.TRUE_FALSE) return QuestionType.TRUE_FALSE;
    if (upper === QuestionType.SHORT_ANSWER) return QuestionType.SHORT_ANSWER;
    if (upper === QuestionType.MULTIPLE_CHOICE) return QuestionType.MULTIPLE_CHOICE;
  }
  return QuestionType.MULTIPLE_CHOICE;
};

const parseLessonKindFromSnapshot = (value: unknown): LessonKind => {
  if (typeof value !== 'string') return 'reading';
  const normalized = value.toLowerCase();
  if (normalized === 'video' || normalized === 'quiz' || normalized === 'assignment' || normalized === 'reading') {
    return normalized;
  }
  return 'reading';
};

const parseSubmissionTypeFromSnapshot = (value: unknown): SubmissionType => {
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (upper === SubmissionType.FILE) return SubmissionType.FILE;
    if (upper === SubmissionType.TEXT) return SubmissionType.TEXT;
    if (upper === SubmissionType.LINK) return SubmissionType.LINK;
  }
  return SubmissionType.TEXT;
};

const parseModulesFromRevisionSnapshot = (contentSnapshotJson?: string): ModuleDraft[] => {
  if (!contentSnapshotJson) return [];

  try {
    const parsed = JSON.parse(contentSnapshotJson) as {
      modules?: Array<{
        title?: string;
        description?: string;
        lessons?: Array<Record<string, unknown>>;
      }>;
    };

    if (!Array.isArray(parsed.modules)) {
      return [];
    }

    return parsed.modules.map((module, moduleIndex) => {
      const moduleId = `snapshot-module-${moduleIndex}-${createId()}`;
      const lessons = Array.isArray(module.lessons) ? module.lessons : [];

      return {
        id: moduleId,
        title: typeof module.title === 'string' ? module.title : `Module ${moduleIndex + 1}`,
        description: typeof module.description === 'string' ? module.description : '',
        lessons: lessons.map((lessonRaw, lessonIndex) => {
          const lessonId = `snapshot-lesson-${moduleIndex}-${lessonIndex}-${createId()}`;
          const questionsRaw = Array.isArray(lessonRaw.questions) ? lessonRaw.questions : [];
          const criteriaRaw = Array.isArray(lessonRaw.assignmentCriteria) ? lessonRaw.assignmentCriteria : [];
          const attachmentsRaw = Array.isArray(lessonRaw.attachments) ? lessonRaw.attachments : [];

          const questions: QuizQuestionDraft[] = questionsRaw.map((questionRaw, questionIndex) => {
            const optionsRaw = Array.isArray(questionRaw.options) ? questionRaw.options : [];
            return {
              id: `snapshot-q-${moduleIndex}-${lessonIndex}-${questionIndex}-${createId()}`,
              text: typeof questionRaw.text === 'string' ? questionRaw.text : '',
              type: parseQuestionTypeFromSnapshot(questionRaw.type),
              score: toPositiveNumberOrUndefined(questionRaw.score) ?? 1,
              orderIndex: toPositiveNumberOrUndefined(questionRaw.orderIndex) ?? questionIndex,
              options: optionsRaw.map((optionRaw: Record<string, unknown>, optionIndex: number) => ({
                id: `snapshot-opt-${moduleIndex}-${lessonIndex}-${questionIndex}-${optionIndex}-${createId()}`,
                text: typeof optionRaw.text === 'string' ? optionRaw.text : '',
                correct: Boolean(optionRaw.correct),
                orderIndex: toPositiveNumberOrUndefined(optionRaw.orderIndex) ?? optionIndex
              }))
            };
          });

          const assignmentCriteria: AssignmentCriteriaDraft[] = criteriaRaw.map((criteriaRawItem, criteriaIndex) => ({
            clientId: `snapshot-criteria-${moduleIndex}-${lessonIndex}-${criteriaIndex}-${createId()}`,
            name: typeof criteriaRawItem.name === 'string' ? criteriaRawItem.name : '',
            description: typeof criteriaRawItem.description === 'string' ? criteriaRawItem.description : '',
            maxPoints: toPositiveNumberOrUndefined(criteriaRawItem.maxPoints) ?? 0,
            orderIndex: toPositiveNumberOrUndefined(criteriaRawItem.orderIndex) ?? criteriaIndex,
            isRequired: typeof criteriaRawItem.isRequired === 'boolean' ? criteriaRawItem.isRequired : true
          }));

          const attachments = normalizeLessonAttachments(
            attachmentsRaw.map((attachmentRaw, attachmentIndex) => ({
              id: `snapshot-attachment-${moduleIndex}-${lessonIndex}-${attachmentIndex}-${createId()}`,
              name: typeof attachmentRaw.name === 'string' ? attachmentRaw.name : 'Attachment',
              url: typeof attachmentRaw.url === 'string' ? attachmentRaw.url : undefined,
              mediaId: typeof attachmentRaw.mediaId === 'number' ? attachmentRaw.mediaId : undefined
            }))
          );

          return {
            id: lessonId,
            title: typeof lessonRaw.title === 'string' ? lessonRaw.title : `Bài học ${lessonIndex + 1}`,
            type: parseLessonKindFromSnapshot(lessonRaw.type),
            durationMin: toPositiveNumberOrUndefined(lessonRaw.durationMin),
            contentText: typeof lessonRaw.contentText === 'string' ? lessonRaw.contentText : '',
            resourceUrl: typeof lessonRaw.resourceUrl === 'string' ? lessonRaw.resourceUrl : undefined,
            youtubeUrl: typeof lessonRaw.youtubeUrl === 'string' ? lessonRaw.youtubeUrl : undefined,
            videoMediaId: typeof lessonRaw.videoMediaId === 'number' ? lessonRaw.videoMediaId : undefined,
            passScore: toPositiveNumberOrUndefined(lessonRaw.passScore),
            quizMaxAttempts: toPositiveNumberOrUndefined(lessonRaw.quizMaxAttempts),
            quizTimeLimitMinutes: toPositiveNumberOrUndefined(lessonRaw.quizTimeLimitMinutes),
            quizDescription: typeof lessonRaw.quizDescription === 'string' ? lessonRaw.quizDescription : undefined,
            gradingMethod: typeof lessonRaw.gradingMethod === 'string' ? lessonRaw.gradingMethod : undefined,
            isAssessment: typeof lessonRaw.isAssessment === 'boolean' ? lessonRaw.isAssessment : undefined,
            assignmentSubmissionType: parseSubmissionTypeFromSnapshot(lessonRaw.assignmentSubmissionType),
            assignmentDescription:
              typeof lessonRaw.assignmentDescription === 'string' ? lessonRaw.assignmentDescription : undefined,
            assignmentMaxScore: toPositiveNumberOrUndefined(lessonRaw.assignmentMaxScore),
            assignmentPassingScore: toPositiveNumberOrUndefined(lessonRaw.assignmentPassingScore),
            questions,
            assignmentCriteria,
            attachments
          };
        })
      };
    });
  } catch (error) {
    console.error('Failed to parse revision content snapshot:', error);
    return [];
  }
};

const formatRevisionStatusLabel = (status?: string | null) => {
  switch (status) {
    case 'DRAFT':
      return 'Bản nháp';
    case 'PENDING':
      return 'Chờ duyệt';
    case 'APPROVED':
      return 'Đã duyệt';
    case 'REJECTED':
      return 'Bị từ chối';
    default:
      return status || 'N/A';
  }
};

const getRevisionStatusTone = (status?: string | null) => {
  switch (status) {
    case 'DRAFT':
      return 'draft';
    case 'PENDING':
      return 'pending';
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'neutral';
  }
};

const formatRevisionDate = (date?: string | null) =>
  date ? new Date(date).toLocaleString('vi-VN') : '—';

// ============================================================================
// COMPONENT
// ============================================================================

const CourseCreationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();
  const isEditMode = Boolean(courseId);
  const { user } = useAuth();

  /** Prevent scroll-wheel from accidentally changing number inputs */
  const blurOnWheel = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur();

  const {
    state,
    updateCourseForm,
    loadCourseForEdit,
    createCourse,
    updateCourse,
    resetState
  } = useCourseManagement();

  const { courseForm, isLoading } = state;
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning, showInfo } = useToast();
  const searchParams = new URLSearchParams(location.search);
  const revisionIdParam = searchParams.get('revisionId');
  const revisionId = revisionIdParam ? Number(revisionIdParam) : null;
  const isRevisionMode = Boolean(revisionId && !Number.isNaN(revisionId));
  const [activeRevision, setActiveRevision] = useState<CourseRevisionDTO | null>(null);
  const [revisionHistory, setRevisionHistory] = useState<CourseRevisionDTO[]>([]);
  const [isRevisionLoading, setIsRevisionLoading] = useState(false);
  const [isRevisionHistoryModalOpen, setIsRevisionHistoryModalOpen] = useState(false);
  const revisionIsEditable = activeRevision?.status === 'DRAFT' || activeRevision?.status === 'REJECTED';
  
  const isEditable = isRevisionMode
    ? revisionIsEditable
    : (!isEditMode ||
      !state.currentCourse ||
      state.currentCourse.status === CourseStatus.DRAFT ||
      state.currentCourse.status === CourseStatus.REJECTED ||
      state.currentCourse.status === CourseStatus.SUSPENDED);

  // Local State
  const [activeView, setActiveView] = useState<ViewState>({ type: 'course_info' });
  const [modules, setModules] = useState<ModuleDraft[]>([]);
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [assignmentErrors, setAssignmentErrors] = useState<Record<string, AssignmentFieldErrors>>({});
  
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  // Quiz Editor State (for tab switching)
  const [lessonEditor, setLessonEditor] = useState<{ activeTab: 'settings' | 'questions' }>({ activeTab: 'settings' });
  const showToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    switch (type) {
      case 'success':
        showSuccess('Đã cập nhật', message);
        break;
      case 'error':
        showError('Không thể tiếp tục', message);
        break;
      case 'warning':
        showWarning('Cần kiểm tra lại', message);
        break;
      case 'info':
      default:
        showInfo('Thông tin', message);
        break;
    }
  }, [showError, showInfo, showSuccess, showWarning]);
  const getApiErrorMessage = useCallback((err: unknown): string => {
    const responseData = (err as { response?: { data?: unknown } })?.response?.data;
    if (responseData) {
      if (typeof responseData === 'string') return responseData;
      if (typeof responseData === 'object') {
        const responseObj = responseData as { message?: string; error?: string };
        return responseObj.message || responseObj.error || JSON.stringify(responseData);
      }
      return String(responseData);
    }
    if (err instanceof Error) return err.message;
    return String(err);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const saveInFlightRef = useRef(false);
  const latestRevision = revisionHistory[0] ?? activeRevision;
  const openRevision = revisionHistory.find(
    (revision) => revision.status === 'DRAFT' || revision.status === 'PENDING'
  );
  const hasPendingOpenRevision = !isRevisionMode && openRevision?.status === 'PENDING';
  const hasDraftOpenRevision = !isRevisionMode && openRevision?.status === 'DRAFT';
  
  const clearAssignmentError = (
     lessonId: string,
     field: keyof AssignmentFieldErrors,
     criteriaIndex?: number,
     criteriaField?: keyof AssignmentCriteriaItemErrors
  ) => {
     setAssignmentErrors(prev => {
        const current = prev[lessonId];
        if (!current) return prev;
        const next: AssignmentFieldErrors = { ...current };

        if (field === 'criteriaItems' && criteriaIndex !== undefined && criteriaField) {
           const items = { ...(next.criteriaItems || {}) };
           const item = { ...(items[criteriaIndex] || {}) };
           delete item[criteriaField];
           if (Object.keys(item).length > 0) {
              items[criteriaIndex] = item;
           } else {
              delete items[criteriaIndex];
           }
           if (Object.keys(items).length > 0) {
              next.criteriaItems = items;
           } else {
              delete next.criteriaItems;
           }
           delete next.criteriaTotal;
        } else if (field === 'criteriaItems') {
           delete next.criteriaItems;
           delete next.criteriaTotal;
        } else {
           delete next[field];
           if (field === 'maxScore') {
              delete next.criteriaTotal;
           }
        }

        if (Object.keys(next).length === 0) {
           const copy = { ...prev };
           delete copy[lessonId];
           return copy;
        }
        return { ...prev, [lessonId]: next };
     });
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isEditMode && courseId) {
      loadCourseForEdit(courseId);
    } else {
      resetState();
    }
  }, [isEditMode, courseId, loadCourseForEdit, resetState]);

  // Show error notification when context error changes
  useEffect(() => {
    if (state.error) {
      showToast('error', state.error);
    }
  }, [showToast, state.error]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const submitted = params.get('submitted') === '1';
    const revisionCreated = params.get('revisionCreated') === '1';
    const revisionSubmitted = params.get('revisionSubmitted') === '1';
    if (!submitted && !revisionCreated && !revisionSubmitted) {
      return;
    }

    if (submitted) {
      showToast('success', 'Đã gửi khóa học tới quản trị viên để xét duyệt.');
    }
    if (revisionCreated) {
      showToast('success', 'Đã tạo phiên bản mới. Bạn có thể chỉnh sửa rồi gửi duyệt phiên bản.');
    }
    if (revisionSubmitted) {
      showToast('success', 'Đã gửi phiên bản tới quản trị viên để xét duyệt.');
    }
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.search, navigate, showToast]);

  useEffect(() => {
    if (!isEditMode || !courseId) {
      setRevisionHistory([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const response = await listCourseRevisions(Number(courseId), 0, 10);
        setRevisionHistory(response.content ?? []);
      } catch {
        setRevisionHistory([]);
      }
    };

    void loadHistory();
  }, [courseId, isEditMode]);

  useEffect(() => {
    if (!isRevisionMode || !revisionId) {
      setActiveRevision(null);
      return;
    }

    const loadRevision = async () => {
      try {
        setIsRevisionLoading(true);
        const revision = await getCourseRevision(revisionId);
        setActiveRevision(revision);
        const revisionFormData: Partial<typeof state.courseForm> = {};
        if (revision.title !== undefined) revisionFormData.title = revision.title;
        if (revision.description !== undefined) revisionFormData.description = revision.description;
        if (revision.shortDescription !== undefined) revisionFormData.summary = revision.shortDescription;
        if (revision.category !== undefined) revisionFormData.category = revision.category;
        if (revision.level !== undefined) revisionFormData.level = revision.level as CourseLevel;
        if (revision.price !== undefined) revisionFormData.price = revision.price;
        if (revision.currency !== undefined) revisionFormData.currency = revision.currency;
        if (revision.estimatedDurationHours !== undefined) {
          revisionFormData.estimatedDuration = revision.estimatedDurationHours;
        }
        if (revision.language !== undefined) revisionFormData.language = revision.language;
        if (Object.keys(revisionFormData).length > 0) {
          updateCourseForm(revisionFormData);
        }
        if (revision.learningObjectivesJson) {
          const parsedObjectives = JSON.parse(revision.learningObjectivesJson) as string[];
          if (Array.isArray(parsedObjectives) && parsedObjectives.length > 0) {
            setLearningObjectives(parsedObjectives);
          }
        }
        if (revision.requirementsJson) {
          const parsedRequirements = JSON.parse(revision.requirementsJson) as string[];
          if (Array.isArray(parsedRequirements) && parsedRequirements.length > 0) {
            setRequirements(parsedRequirements);
          }
        }
        const snapshotModules = parseModulesFromRevisionSnapshot(revision.contentSnapshotJson);
        if (snapshotModules.length > 0) {
          setModules(snapshotModules);
          setAssignmentErrors({});
        }
      } catch (error) {
        showToast('error', `Không thể tải thông tin phiên bản: ${getApiErrorMessage(error)}`);
      } finally {
        setIsRevisionLoading(false);
      }
    };

    void loadRevision();
  }, [getApiErrorMessage, isRevisionMode, revisionId, showToast, updateCourseForm]);

  useEffect(() => {
    if (!isRevisionHistoryModalOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRevisionHistoryModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevisionHistoryModalOpen]);

  // Sync from context to local state
  useEffect(() => {
    if (!isEditMode || isLoading || !state.currentCourse) return;
    
    if (state.courseForm.learningObjectives?.length) {
      setLearningObjectives(state.courseForm.learningObjectives);
    }
    if (state.courseForm.requirements?.length) {
      setRequirements(state.courseForm.requirements);
    }
    
    // Map context modules to local draft modules if needed
    // This part assumes we might need to transform data structure
    if (state.modules.length > 0 && modules.length === 0) {
        const mappedModules: ModuleDraft[] = state.modules.map(m => ({
            id: m.id.toString(),
            serverId: m.id,
            title: m.title,
            description: m.description,
            lessons: m.lessons.map(rawLesson => {
                const lessonId = (rawLesson as unknown as { id: number }).id;
                const lesson = rawLesson as unknown as Partial<LessonDraft> & { id: number; type?: LessonType | string; durationSec?: number; videoUrl?: string };
                return {
                  id: lessonId.toString(),
                  serverId: lessonId,
                  title: lesson.title || '',
                  type: (lesson.type?.toString().toLowerCase() || 'reading') as LessonKind,
                  durationMin: lesson.durationSec ? Math.round(lesson.durationSec / 60) : undefined,
                  contentText: lesson.contentText,
                  resourceUrl: lesson.resourceUrl,
                  youtubeUrl: lesson.youtubeUrl || lesson.videoUrl,
                  videoMediaId: lesson.videoMediaId,
                  passScore: lesson.passScore,
                  quizTimeLimitMinutes: lesson.quizTimeLimitMinutes,
                  quizMaxAttempts: lesson.quizMaxAttempts,
                  quizDescription: lesson.quizDescription,
                  gradingMethod: lesson.gradingMethod,
                  isAssessment: lesson.isAssessment,
                  questions: (lesson.questions || []).map((q: QuizQuestionDraft) => ({
                     ...q,
                     score: Number.isFinite(Number(q.score)) && Number(q.score) > 0 ? Number(q.score) : 1
                  })),
                  assignmentSubmissionType: (lesson.assignmentSubmissionType || (lesson as { submissionType?: SubmissionType }).submissionType || SubmissionType.TEXT) as SubmissionType,
                  assignmentDescription: lesson.assignmentDescription,
                  assignmentMaxScore: lesson.assignmentMaxScore,
                  assignmentPassingScore: lesson.assignmentPassingScore,
                  assignmentCriteria: lesson.assignmentCriteria,
                  attachments: normalizeLessonAttachments(lesson.attachments)
                };
            })
        }));
        setModules(mappedModules);
    }
  }, [
    isEditMode,
    isLoading,
    modules.length,
    state.courseForm.learningObjectives,
    state.courseForm.requirements,
    state.currentCourse,
    state.modules,
  ]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleGoBack = () => {
    const fromState = location.state as { activeTab?: string; coursesPage?: number } | null;
    const targetPage = fromState?.coursesPage;
    navigate('/mentor', {
      state: {
        activeTab: fromState?.activeTab || 'courses',
        ...(typeof targetPage === 'number' && Number.isFinite(targetPage) && targetPage > 0
          ? { coursesPage: targetPage }
          : {})
      }
    });
  };

  const handleCreateRevisionFromPublic = useCallback(async () => {
    if (!state.currentCourse?.id) {
      showToast('error', 'Không tìm thấy khóa học để tạo phiên bản mới.');
      return;
    }

    try {
      setIsRevisionLoading(true);
      const createdRevision = await createCourseRevision(state.currentCourse.id);
      const refreshed = await listCourseRevisions(state.currentCourse.id, 0, 10);
      setRevisionHistory(refreshed.content ?? []);
      navigate(
        `/mentor/courses/${state.currentCourse.id}/edit?revisionId=${createdRevision.id}&revisionCreated=1`,
        { replace: true }
      );
    } catch (error) {
      const apiErrorMessage = getApiErrorMessage(error);

      if (apiErrorMessage.includes('COURSE_HAS_OPEN_REVISION')) {
        try {
          const refreshed = await listCourseRevisions(state.currentCourse.id, 0, 20);
          const history = refreshed.content ?? [];
          setRevisionHistory(history);

          const openRevision = history.find(
            (revision) => revision.status === 'DRAFT' || revision.status === 'PENDING'
          );

          if (openRevision) {
            const isPending = openRevision.status === 'PENDING';
            showToast(
              isPending ? 'warning' : 'info',
              isPending
                ? `Khóa học đã có phiên bản #${openRevision.revisionNumber} đang chờ duyệt. Chưa thể tạo phiên bản mới cho tới khi admin xử lý phiên bản này.`
                : `Khóa học đã có phiên bản nháp #${openRevision.revisionNumber}. Mở phiên bản hiện có để bạn tiếp tục chỉnh sửa.`
            );
            navigate(
              `/mentor/courses/${state.currentCourse.id}/edit?revisionId=${openRevision.id}`,
              { replace: true }
            );
            return;
          }
        } catch {
          // Fall through and show original backend message.
        }
      }

      showToast('error', `Không thể tạo phiên bản mới: ${apiErrorMessage}`);
    } finally {
      setIsRevisionLoading(false);
    }
  }, [getApiErrorMessage, navigate, showToast, state.currentCourse]);

  const handleOpenRevisionInEditor = useCallback((targetRevision: CourseRevisionDTO) => {
    if (!state.currentCourse?.id) return;
    setIsRevisionHistoryModalOpen(false);
    navigate(`/mentor/courses/${state.currentCourse.id}/edit?revisionId=${targetRevision.id}`);
  }, [navigate, state.currentCourse?.id]);

  const handleThumbnailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditable) {
      if (e.target) e.target.value = '';
      showToast('warning', 'Khóa học đang ở chế độ xem, bạn không thể thay đổi ảnh bìa.');
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'File quá lớn (Tối đa 5MB)');
        return;
      }
      setThumbnailFile(file);
      // Preview immediately
      updateCourseForm({ thumbnailUrl: URL.createObjectURL(file) });
    }
  }, [isEditable, showToast, updateCourseForm]);

  const updateLessonField = (moduleId: string, lessonId: string, data: Partial<LessonDraft>) => {
    setModules(prev => prev.map(m => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        lessons: m.lessons.map(l => {
          if (l.id !== lessonId) return l;
          
          // Data integrity check: If type changes significantly (e.g. Reading -> Quiz), 
          // we must clear the serverId to force creation of a new entity, preventing backend type mismatch errors.
          let newServerId = l.serverId;
          if (data.type && data.type !== l.type) {
             const isOldLesson = l.type === 'reading' || l.type === 'video';
             const isNewLesson = data.type === 'reading' || data.type === 'video';
             
             // If switching between incompatible types (Lesson <-> Quiz <-> Assignment)
             if (isOldLesson !== isNewLesson || l.type === 'quiz' || data.type === 'quiz' || l.type === 'assignment' || data.type === 'assignment') {
                 if (l.type !== data.type) {
                     newServerId = undefined; // Treat as new entity
                 }
             }
          }

          return { ...l, ...data, serverId: newServerId };
        })
      };
    }));
  };

  const handleRemoveLesson = (moduleId: string, lessonId: string) => {
    setConfirmDialog({
      title: 'Xóa bài học',
      message: 'Bạn có chắc chắn muốn xóa bài học này?',
      confirmLabel: 'Xóa',
      onConfirm: () => {
        setModules(prev => prev.map(m => {
          if (m.id !== moduleId) return m;
          return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
        }));
        setActiveView({ type: 'module', moduleId });
      }
    });
  };

  const handleMoveModule = (moduleId: string, direction: 'up' | 'down') => {
    setModules(prev => {
      const idx = prev.findIndex(m => m.id === moduleId);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  };

  const handleMoveLesson = (moduleId: string, lessonId: string, direction: 'up' | 'down') => {
    setModules(prev => prev.map(m => {
      if (m.id !== moduleId) return m;
      const idx = m.lessons.findIndex(l => l.id === lessonId);
      if (idx < 0) return m;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= m.lessons.length) return m;
      const lessons = [...m.lessons];
      [lessons[idx], lessons[targetIdx]] = [lessons[targetIdx], lessons[idx]];
      return { ...m, lessons };
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditable) {
      if (e.target) e.target.value = '';
      showToast('warning', 'Khóa học đang ở chế độ xem, bạn không thể thêm tệp đính kèm.');
      return;
    }
    if (activeView.type !== 'lesson' || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const { moduleId, lessonId } = activeView;

    try {
       // Upload file via mediaService
       const uploadedMedia = await uploadMedia(file, user?.id || 0);
       
       // Update lesson attachments
       setModules(prev => prev.map(m => {
          if (m.id !== moduleId) return m;
          return {
             ...m,
             lessons: m.lessons.map(l => {
                if (l.id !== lessonId) return l;
                const newAttachment: LessonAttachmentDraft = {
                   name: uploadedMedia.fileName || file.name,
                   mediaId: uploadedMedia.id,
                   url: uploadedMedia.url
                };
                const newAttachments: LessonAttachmentDraft[] = [...(l.attachments || []), newAttachment];
                return { ...l, attachments: newAttachments };
             })
          };
       }));
       
       showToast('success', 'Upload file thành công!');
    } catch (err) {
       console.error(err);
       showToast('error', 'Lỗi khi upload file: ' + err);
    } finally {
       // Reset input
       if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditable) {
      if (e.target) e.target.value = '';
      showToast('warning', 'Khóa học đang ở chế độ xem, bạn không thể tải video lên.');
      return;
    }
    if (activeView.type !== 'lesson' || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    // Check file type
    if (!file.type.startsWith('video/')) {
       showToast('error', 'Vui lòng chọn file video hợp lệ (mp4, webm, etc.)');
       return;
    }

    const { moduleId, lessonId } = activeView;

    try {
       showToast('success', 'Đang upload video, vui lòng chờ...');
       // Upload file via mediaService
       const uploadedMedia = await uploadMedia(file, user?.id || 0);
       
       // Update lesson videoMediaId
       updateLessonField(moduleId, lessonId, { videoMediaId: uploadedMedia.id });
       
       showToast('success', 'Upload video thành công!');
    } catch (err) {
       console.error(err);
       showToast('error', 'Lỗi khi upload video: ' + err);
    } finally {
       // Reset input
       if (e.target) e.target.value = '';
    }
  };

  const createDefaultQuestion = (type: QuestionType = QuestionType.MULTIPLE_CHOICE): QuizQuestionDraft => {
    const base: QuizQuestionDraft = {
      id: createId(),
      text: '',
      score: 1,
      type,
      options: []
    };

    if (type === QuestionType.TRUE_FALSE) {
      base.options = [
        { id: createId(), text: 'True', correct: true },
        { id: createId(), text: 'False', correct: false }
      ];
    } else if (type === QuestionType.MULTIPLE_CHOICE) {
      base.options = [
        { id: createId(), text: '', correct: false },
        { id: createId(), text: '', correct: false },
        { id: createId(), text: '', correct: false },
        { id: createId(), text: '', correct: false }
      ];
    } else if (type === QuestionType.SHORT_ANSWER) {
      base.options = [
        { id: createId(), text: '', correct: true }
      ];
    }

    return base;
  };

  const persistCourseDraft = useCallback(async (
    options?: { silentSuccess?: boolean; redirectToEdit?: boolean }
  ) => {
    if (saveInFlightRef.current) {
      return null;
    }

    const assignmentValidation = validateAssignmentsBeforeSave(modules);
    setAssignmentErrors(assignmentValidation.errorsByLesson);
    if (Object.keys(assignmentValidation.errorsByLesson).length > 0) {
      showToast('error', assignmentValidation.firstMessage || 'Vui lòng kiểm tra lại thông tin bài tập.');
      return null;
    }

    const quizValidation = validateQuizzesBeforeSave(modules);
    if (Object.keys(quizValidation.errorsByLesson).length > 0) {
      showToast('error', quizValidation.firstMessage || 'Vui lòng kiểm tra lại thông tin quiz.');
      return null;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);

    try {
      if (isRevisionMode && activeRevision) {
        const contentSnapshotJson = JSON.stringify(buildRevisionContentSnapshot(modules));
        const updatedRevision = await updateCourseRevision(activeRevision.id, {
          title: state.courseForm.title,
          description: state.courseForm.description,
          shortDescription: state.courseForm.summary,
          category: state.courseForm.category,
          level: state.courseForm.level,
          estimatedDurationHours: state.courseForm.estimatedDuration,
          language: state.courseForm.language,
          price: state.courseForm.price,
          currency: state.courseForm.currency,
          learningObjectives,
          requirements,
          contentSnapshotJson
        });
        setActiveRevision(updatedRevision);
        if (!options?.silentSuccess) {
          showToast('success', `Đã lưu bản nháp phiên bản #${updatedRevision.revisionNumber}.`);
        }
        return state.currentCourse;
      }

      let savedCourse;
      const fileToUpload = thumbnailFile || undefined;

      if (isEditMode && courseId) {
        savedCourse = await updateCourse(courseId, modules, {}, fileToUpload);
      } else {
        savedCourse = await createCourse(modules, {}, fileToUpload);
      }

      if (!savedCourse) {
        showToast('error', 'Lỗi khi lưu: Không nhận được dữ liệu từ server.');
        return null;
      }

      const mappedModules: ModuleDraft[] = savedCourse.modules.map(rawModule => {
        const module = rawModule as {
          id: number;
          title: string;
          description?: string;
          lessons?: Array<Partial<LessonDraft> & { id: number; type?: LessonType | string; durationSec?: number; videoUrl?: string }>;
        };

        return {
          id: module.id.toString(),
          serverId: module.id,
          title: module.title,
          description: module.description,
          lessons: (module.lessons || []).map(rawLesson => {
            const lessonId = (rawLesson as { id: number }).id;
            const lesson = rawLesson as Partial<LessonDraft> & {
              id: number;
              type?: LessonType | string;
              durationSec?: number;
              videoUrl?: string;
            };

            return {
              id: lessonId.toString(),
              serverId: lessonId,
              title: lesson.title || '',
              type: (lesson.type?.toString().toLowerCase() || 'reading') as LessonKind,
              durationMin: lesson.durationSec ? Math.round(lesson.durationSec / 60) : undefined,
              contentText: lesson.contentText,
              resourceUrl: lesson.resourceUrl,
              youtubeUrl: lesson.youtubeUrl || lesson.videoUrl,
              videoMediaId: lesson.videoMediaId,
              passScore: lesson.passScore,
              quizTimeLimitMinutes: lesson.quizTimeLimitMinutes,
              quizMaxAttempts: lesson.quizMaxAttempts,
              quizDescription: lesson.quizDescription,
              gradingMethod: lesson.gradingMethod,
              isAssessment: lesson.isAssessment,
              questions: (lesson.questions || []).map((question: QuizQuestionDraft) => ({
                ...question,
                score: Number.isFinite(Number(question.score)) && Number(question.score) > 0 ? Number(question.score) : 1
              })),
              assignmentSubmissionType: (
                lesson.assignmentSubmissionType ||
                (lesson as { submissionType?: SubmissionType }).submissionType ||
                SubmissionType.TEXT
              ) as SubmissionType,
              assignmentDescription: lesson.assignmentDescription,
              assignmentMaxScore: lesson.assignmentMaxScore,
              assignmentPassingScore: lesson.assignmentPassingScore,
              assignmentCriteria: lesson.assignmentCriteria,
              attachments: normalizeLessonAttachments(lesson.attachments)
            };
          })
        };
      });

      const idMap = new Map<string, { newModuleId: string; lessonMap: Map<string, string> }>();
      modules.forEach((oldModule, moduleIndex) => {
        const newModule = mappedModules[moduleIndex];
        if (!newModule) return;

        const lessonMap = new Map<string, string>();
        oldModule.lessons.forEach((oldLesson, lessonIndex) => {
          const newLesson = newModule.lessons[lessonIndex];
          if (newLesson) {
            lessonMap.set(oldLesson.id, newLesson.id);
          }
        });

        idMap.set(oldModule.id, { newModuleId: newModule.id, lessonMap });
      });

      setModules(mappedModules);
      setAssignmentErrors({});

      setActiveView(prev => {
        if (prev.type === 'module') {
          const entry = idMap.get(prev.moduleId);
          return entry ? { type: 'module', moduleId: entry.newModuleId } : prev;
        }

        if (prev.type === 'lesson') {
          const entry = idMap.get(prev.moduleId);
          if (!entry) return prev;

          const newLessonId = entry.lessonMap.get(prev.lessonId);
          return newLessonId
            ? { type: 'lesson', moduleId: entry.newModuleId, lessonId: newLessonId }
            : prev;
        }

        return prev;
      });

      const shouldRedirectToEdit = options?.redirectToEdit ?? !isEditMode;
      if (!isEditMode && shouldRedirectToEdit) {
        navigate(`/mentor/courses/${savedCourse.id}/edit`, { replace: true });
      }

      if (!options?.silentSuccess) {
        showToast('success', 'Đã lưu thành công. Dữ liệu đã được đồng bộ.');
      }

      return savedCourse;
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message.includes('COURSE_REVISION_CONTENT_SNAPSHOT_TOO_LARGE')) {
        showToast('error', 'Nội dung phiên bản quá lớn. Vui lòng chia nhỏ hoặc tinh gọn nội dung trước khi lưu.');
      } else {
        showToast('error', `Lỗi khi lưu: ${message}`);
      }
      return null;
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }, [
    activeRevision,
    courseId,
    createCourse,
    getApiErrorMessage,
    isEditMode,
    isRevisionMode,
    learningObjectives,
    modules,
    navigate,
    requirements,
    showToast,
    state.courseForm,
    state.currentCourse,
    thumbnailFile,
    updateCourse
  ]);

  const handleSaveDraft = useCallback(async () => {
    await persistCourseDraft();
  }, [persistCourseDraft]);

  const handlePublishCourse = useCallback(async () => {
    if (!user?.id) {
      showToast('error', 'Không xác định được tài khoản người hướng dẫn hiện tại.');
      return;
    }

    const hasLearningContent = modules.some(module => module.lessons.length > 0);
    if (!hasLearningContent) {
      showToast('warning', 'Khóa học phải có ít nhất 1 module chứa nội dung trước khi gửi duyệt.');
      return;
    }

    const savedCourse = await persistCourseDraft({
      silentSuccess: true,
      redirectToEdit: false,
    });
    if (!savedCourse) {
      return;
    }

    try {
      setIsSaving(true);
      if (isRevisionMode && activeRevision) {
        showToast('info', 'Đang gửi phiên bản tới quản trị viên để xét duyệt.');
        const submittedRevision = await submitCourseRevision(activeRevision.id);
        setActiveRevision(submittedRevision);
        if (courseId) {
          const refreshed = await listCourseRevisions(Number(courseId), 0, 10);
          setRevisionHistory(refreshed.content ?? []);
        }
        navigate(`/mentor/courses/${savedCourse.id}/edit?revisionId=${submittedRevision.id}&revisionSubmitted=1`, { replace: true });
        return;
      }

      showToast('info', 'Đang gửi khóa học tới quản trị viên để xét duyệt.');
      const submittedCourse = await submitCourseForApproval(savedCourse.id, user.id);
      if (isEditMode) {
        await loadCourseForEdit(submittedCourse.id.toString());
      }
      navigate(`/mentor/courses/${submittedCourse.id}/edit?submitted=1`, { replace: true });
    } catch (error) {
      const apiErrorMessage = getApiErrorMessage(error);
      if (apiErrorMessage.includes('COURSE_REVISION_NO_CHANGES_TO_SUBMIT')) {
        showToast('warning', 'Phiên bản chưa có thay đổi thực tế so với bản gốc, nên chưa thể gửi duyệt.');
      } else if (apiErrorMessage.includes('COURSE_REVISION_NO_CHANGES_SINCE_REJECTION')) {
        showToast('warning', 'Phiên bản bị từ chối trước đó nhưng chưa có cập nhật mới, nên chưa thể gửi duyệt lại.');
      } else if (apiErrorMessage.includes('COURSE_REVISION_BASELINE_NOT_FOUND')) {
        showToast('error', 'Không xác định được bản gốc để so sánh thay đổi. Vui lòng liên hệ quản trị viên để xử lý dữ liệu phiên bản.');
      } else {
        showToast('error', `Không thể gửi duyệt: ${apiErrorMessage}`);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    activeRevision,
    courseId,
    getApiErrorMessage,
    isEditMode,
    isRevisionMode,
    loadCourseForEdit,
    modules,
    navigate,
    persistCourseDraft,
    showToast,
    user?.id
  ]);

  // ============================================================================
  // RENDERERS
  // ============================================================================

  const renderSidebar = () => (
    <div className="cb-sidebar">
      <div className="cb-sidebar__header">
        <span>NỘI DUNG KHÓA HỌC</span>
      </div>
      
      <div className="cb-sidebar__section">
        <div 
          className={`cb-sidebar__item ${activeView.type === 'course_info' ? 'is-active' : ''}`}
          onClick={() => setActiveView({ type: 'course_info' })}
        >
          <div className="cb-sidebar__item-label">
            <FiBookOpen /> Thông tin chung
          </div>
        </div>
      </div>

      <div className="cb-sidebar__section">
        <div className="cb-sidebar__header" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          MODULES
        </div>
        
        {modules.map((module, index) => (
          <div key={module.id} className="cb-sidebar__module-group">
            <div 
              className={`cb-sidebar__item ${activeView.type === 'module' && activeView.moduleId === module.id ? 'is-active' : ''}`}
              onClick={() => setActiveView({ type: 'module', moduleId: module.id })}
            >
              <div className="cb-sidebar__item-label">
                <FiList /> 
                <span style={{ fontWeight: 500 }}>{index + 1}. {module.title || '(Chưa có tiêu đề)'}</span>
              </div>
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {isEditable && index > 0 && (
                  <button
                    className="cb-icon-button"
                    style={{ width: 22, height: 22, fontSize: 11 }}
                    title="Di chuyển lên"
                    onClick={(e) => { e.stopPropagation(); handleMoveModule(module.id, 'up'); }}
                  >
                    <FiArrowUp />
                  </button>
                )}
                {isEditable && index < modules.length - 1 && (
                  <button
                    className="cb-icon-button"
                    style={{ width: 22, height: 22, fontSize: 11 }}
                    title="Di chuyển xuống"
                    onClick={(e) => { e.stopPropagation(); handleMoveModule(module.id, 'down'); }}
                  >
                    <FiArrowDown />
                  </button>
                )}
                <button 
                  className="cb-icon-button" 
                  style={{ width: 24, height: 24, fontSize: 12 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCollapsedModules(prev => ({ ...prev, [module.id]: !prev[module.id] }));
                  }}
                >
                  {collapsedModules[module.id] ? <FiChevronDown /> : <FiChevronUp />}
                </button>
              </div>
            </div>

            {!collapsedModules[module.id] && (
              <div className="cb-sidebar__sub-list">
                {module.lessons.map((lesson, lIndex) => {
                  const meta = getLessonTypeMeta(lesson.type);

                  return (
                    <div 
                      key={lesson.id}
                      className={`cb-sidebar__item cb-sidebar__sub-item ${
                        activeView.type === 'lesson' && activeView.lessonId === lesson.id ? 'is-active' : ''
                      }`}
                      onClick={() => setActiveView({ type: 'lesson', moduleId: module.id, lessonId: lesson.id })}
                    >
                      <div className="cb-sidebar__item-label">
                        <span
                          className="cb-sidebar__lesson-icon"
                          style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                        >
                          <meta.Icon size={12} />
                        </span>
                        <span className="cb-sidebar__lesson-text">
                          <span>{lIndex + 1}. {lesson.title || '(Chưa có tiêu đề)'}</span>
                          <span className="cb-sidebar__lesson-badge" style={{ backgroundColor: `${meta.color}18`, color: meta.color, borderColor: `${meta.color}40` }}>
                            {meta.label}
                          </span>
                        </span>
                      </div>
                      {isEditable && (
                        <div style={{ display: 'flex', gap: 1, alignItems: 'center', marginLeft: 'auto' }}>
                          {lIndex > 0 && (
                            <button
                              className="cb-icon-button"
                              style={{ width: 20, height: 20, fontSize: 10, border: 'none' }}
                              title="Di chuyển lên"
                              onClick={(e) => { e.stopPropagation(); handleMoveLesson(module.id, lesson.id, 'up'); }}
                            >
                              <FiArrowUp />
                            </button>
                          )}
                          {lIndex < module.lessons.length - 1 && (
                            <button
                              className="cb-icon-button"
                              style={{ width: 20, height: 20, fontSize: 10, border: 'none' }}
                              title="Di chuyển xuống"
                              onClick={(e) => { e.stopPropagation(); handleMoveLesson(module.id, lesson.id, 'down'); }}
                            >
                              <FiArrowDown />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <button 
                  className="cb-sidebar__add-btn"
                  disabled={!isEditable}
                  onClick={(e) => {
                     if (!isEditable) return;
                     e.stopPropagation();
                     const newLessonId = createId();
                    const newLesson: LessonDraft = {
                       id: newLessonId,
                       title: 'Bài học mới',
                       type: 'reading',
                       contentText: '',
                       questions: [],
                       assignmentSubmissionType: SubmissionType.TEXT
                     };
                     setModules(prev => prev.map(m => m.id === module.id ? { ...m, lessons: [...m.lessons, newLesson] } : m));
                     setActiveView({ type: 'lesson', moduleId: module.id, lessonId: newLessonId });
                  }}
                >
                  <FiPlus /> Thêm bài học
                </button>
              </div>
            )}
          </div>
        ))}

        <button 
          className="cb-button cb-button--ghost" 
          disabled={!isEditable}
          style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', color: 'var(--cb-accent-cyan)', opacity: !isEditable ? 0.5 : 1, cursor: !isEditable ? 'not-allowed' : 'pointer' }}
          onClick={() => {
            if (!isEditable) return;
            const newModuleId = createId();
            const newModule: ModuleDraft = {
              id: newModuleId,
              title: 'Module mới',
              lessons: []
            };
            setModules(prev => [...prev, newModule]);
            setActiveView({ type: 'module', moduleId: newModuleId });
          }}
        >
          <FiPlus /> Thêm Module
        </button>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (activeView.type === 'course_info') {
      return (
        <div className="cb-main-content">
          <div className="cb-panel">
            <div className="cb-panel__header">
              <div className="cb-panel__title"><FiInfo /> Thông tin cơ bản</div>
            </div>
            <div className="cb-panel__body">
              <div className="cb-grid cb-grid--2">
                <div>
                  <div className="cb-form-group">
                    <label className="cb-label cb-label--required">Tên khóa học</label>
                    <input
                      type="text" className="cb-input"
                      value={courseForm.title || ''}
                      onChange={(e) => updateCourseForm({ title: e.target.value })}
                    />
                  </div>
                  <div className="cb-form-group">
                    <label className="cb-label">Mô tả ngắn</label>
                    <textarea
                      className="cb-input cb-textarea"
                      value={courseForm.summary || ''}
                      onChange={(e) => updateCourseForm({ summary: e.target.value })}
                      placeholder="Mô tả ngắn gọn về khóa học (hiển thị trên thẻ khóa học)"
                    />
                  </div>
                  <div className="cb-form-group">
                    <label className="cb-label">Mô tả chi tiết</label>
                    <textarea
                      className="cb-input cb-textarea"
                      style={{ height: 150 }}
                      value={courseForm.description || ''}
                      onChange={(e) => updateCourseForm({ description: e.target.value })}
                    />
                  </div>
                  
                  <div className="cb-grid cb-grid--2">
                     <div className="cb-form-group">
                        <label className="cb-label">Danh mục</label>
                        <select 
                           className="cb-input cb-select"
                           value={courseForm.category || ''}
                           onChange={(e) => updateCourseForm({ category: e.target.value })}
                        >
                           <option value="">Chọn danh mục</option>
                           {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="cb-form-group">
                        <label className="cb-label">Độ khó</label>
                        <select 
                           className="cb-input cb-select"
                           value={courseForm.level || CourseLevel.BEGINNER}
                           onChange={(e) => updateCourseForm({ level: e.target.value as CourseLevel })}
                        >
                           {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="cb-grid cb-grid--2">
                     <div className="cb-form-group">
                        <label className="cb-label">Giá (VND)</label>
                        <input 
                           type="number" className="cb-input"
                           value={courseForm.price ?? 0}
                           onWheel={blurOnWheel}
                           onChange={(e) => updateCourseForm({ price: parseInt(e.target.value) || 0 })}
                        />
                     </div>
                     <div className="cb-form-group">
                        <label className="cb-label">Thời lượng (giờ)</label>
                        <input 
                           type="number" className="cb-input"
                           value={courseForm.estimatedDuration ?? 0}
                           onWheel={blurOnWheel}
                           onChange={(e) => updateCourseForm({ estimatedDuration: parseFloat(e.target.value) || 0 })}
                        />
                     </div>
                  </div>
                </div>
                <div>
                   <div className="cb-form-group">
                      <label className="cb-label">Ảnh bìa</label>
                      <div 
                         className={`cb-course-upload${!isEditable ? ' cb-course-upload--disabled' : ''}`}
                         onClick={() => {
                           if (!isEditable) {
                             showToast('info', 'Chỉ có thể xem trong trạng thái hiện tại. Tạo hoặc mở phiên bản nháp để chỉnh sửa.');
                             return;
                           }
                           document.getElementById('thumbnail-upload')?.click();
                         }}
                      >
                         <input
                           id="thumbnail-upload"
                           type="file"
                           hidden
                           onChange={handleThumbnailChange}
                           accept="image/*"
                           disabled={!isEditable}
                         />
                         {courseForm.thumbnailUrl ? (
                            <img src={courseForm.thumbnailUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         ) : (
                            <div style={{ textAlign: 'center' }}>
                               <FiImage size={32} />
                               <p>Tải ảnh lên</p>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Learning Objectives */}
                   <div className="cb-form-group">
                      <label className="cb-label">Mục tiêu khóa học</label>
                      {learningObjectives.map((obj, idx) => (
                         <div key={idx} className="cb-input-group" style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                            <input 
                               className="cb-input"
                               value={obj}
                               placeholder={`Mục tiêu ${idx + 1}`}
                               onChange={(e) => {
                                  const newObjs = [...learningObjectives];
                                  newObjs[idx] = e.target.value;
                                  setLearningObjectives(newObjs);
                                  updateCourseForm({ learningObjectives: newObjs });
                               }}
                            />
                            {learningObjectives.length > 1 && (
                               <button 
                                  className="cb-icon-button"
                                  onClick={() => {
                                     const newObjs = learningObjectives.filter((_, i) => i !== idx);
                                     setLearningObjectives(newObjs);
                                     updateCourseForm({ learningObjectives: newObjs });
                                  }}
                               >
                                  <FiX />
                               </button>
                            )}
                         </div>
                      ))}
                      <button 
                         className="cb-button cb-button--ghost cb-button--sm"
                         onClick={() => setLearningObjectives([...learningObjectives, ''])}
                      >
                         <FiPlus /> Thêm mục tiêu
                      </button>
                   </div>

                   {/* Requirements */}
                   <div className="cb-form-group">
                      <label className="cb-label">Yêu cầu đầu vào</label>
                      {requirements.map((req, idx) => (
                         <div key={idx} className="cb-input-group" style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                            <input 
                               className="cb-input"
                               value={req}
                               placeholder={`Yêu cầu ${idx + 1}`}
                               onChange={(e) => {
                                  const newReqs = [...requirements];
                                  newReqs[idx] = e.target.value;
                                  setRequirements(newReqs);
                                  updateCourseForm({ requirements: newReqs });
                               }}
                            />
                            {requirements.length > 1 && (
                               <button 
                                  className="cb-icon-button"
                                  onClick={() => {
                                     const newReqs = requirements.filter((_, i) => i !== idx);
                                     setRequirements(newReqs);
                                     updateCourseForm({ requirements: newReqs });
                                  }}
                               >
                                  <FiX />
                               </button>
                            )}
                         </div>
                      ))}
                      <button 
                         className="cb-button cb-button--ghost cb-button--sm"
                         onClick={() => setRequirements([...requirements, ''])}
                      >
                         <FiPlus /> Thêm yêu cầu
                      </button>
                   </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeView.type === 'module') {
      const module = modules.find(m => m.id === activeView.moduleId);
      if (!module) return <div className="cb-empty-state">Module không tồn tại</div>;
      return (
         <div className="cb-main-content">
            <div className="cb-panel">
               <div className="cb-panel__header">
                  <div className="cb-panel__title">Chỉnh sửa Module</div>
                  <button 
                     className="cb-button cb-button--danger cb-button--sm"
                     onClick={() => {
                        setConfirmDialog({
                           title: 'Xóa Module',
                           message: 'Bạn có chắc chắn muốn xóa module này?',
                           onConfirm: () => {
                              setModules(prev => prev.filter(m => m.id !== module.id));
                              setActiveView({ type: 'course_info' });
                           }
                        });
                     }}
                  >
                     <FiTrash2 /> Xóa
                  </button>
               </div>
               <div className="cb-panel__body">
                  <div className="cb-form-group">
                     <label className="cb-label">Tên Module</label>
                     <input 
                        className="cb-input"
                        value={module.title}
                        onChange={(e) => setModules(prev => prev.map(m => m.id === module.id ? { ...m, title: e.target.value } : m))}
                     />
                  </div>
                  <div className="cb-form-group">
                     <label className="cb-label">Mô tả</label>
                     <textarea 
                        className="cb-input cb-textarea"
                        value={module.description || ''}
                        onChange={(e) => setModules(prev => prev.map(m => m.id === module.id ? { ...m, description: e.target.value } : m))}
                     />
                  </div>
               </div>
            </div>
         </div>
      );
    }

    if (activeView.type === 'lesson') {
      const module = modules.find(m => m.id === activeView.moduleId);
      const lesson = module?.lessons.find(l => l.id === activeView.lessonId);
      if (!module || !lesson) return <div className="cb-empty-state">Bài học không tồn tại</div>;
      const lessonErrors = assignmentErrors[lesson.id];

      return (
        <div className="cb-main-content">
           <div className="cb-panel">
              <div className="cb-panel__header">
                 <div className="cb-panel__title">
                    {lesson.type === 'quiz' && <FiHelpCircle />}
                    {lesson.type === 'video' && <FiPlay />}
                    {lesson.type === 'reading' && <FiFileText />}
                    <span style={{ marginLeft: 8 }}>{lesson.title}</span>
                 </div>
                 <button 
                    className="cb-button cb-button--danger cb-button--sm"
                    onClick={() => handleRemoveLesson(module.id, lesson.id)}
                 >
                    <FiTrash2 /> Xóa
                 </button>
              </div>
              <div className="cb-panel__body">
                 <div className="cb-form-group">
                    <label className="cb-label">Loại bài học</label>
                    <div className="cb-chips">
                       {LESSON_TYPES.map(type => (
                          <button
                             key={type.value}
                             className={`cb-chip ${lesson.type === type.value ? 'is-active' : ''}`}
                             onClick={() => {
                                const next: Partial<LessonDraft> = { type: type.value as LessonKind };
                                if (type.value === 'assignment') {
                                   if (!lesson.assignmentSubmissionType) {
                                      next.assignmentSubmissionType = SubmissionType.TEXT;
                                   }
                                   if (lesson.assignmentMaxScore == null) {
                                      next.assignmentMaxScore = 100;
                                   }
                                   if (lesson.assignmentPassingScore == null) {
                                      next.assignmentPassingScore = 50;
                                   }
                                }
                                updateLessonField(module.id, lesson.id, next);
                             }}
                          >
                             {type.icon} {type.label}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="cb-form-group">
                    <label className="cb-label">Tiêu đề</label>
                    <input 
                       className="cb-input"
                       value={lesson.title}
                       onChange={(e) => updateLessonField(module.id, lesson.id, { title: e.target.value })}
                    />
                 </div>

                 {lesson.type === 'reading' && (
                    <>
                       <div className="cb-form-group">
                          <label className="cb-label">Nội dung</label>
                          <RichTextEditor 
                             key={lesson.id}
                             initialContent={lesson.contentText || ''}
                             onChange={(val) => updateLessonField(module.id, lesson.id, { contentText: val })}
                             placeholder="Nhập nội dung bài học..."
                          />
                       </div>
                       <div className="cb-form-group">
                          <label className="cb-label">Tài liệu tham khảo (Link/File URL)</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                             <button 
                                className="cb-button cb-button--secondary" 
                                onClick={() => {
                                   const url = prompt("Nhập URL file hoặc tài liệu:");
                                   if (url) {
                                      updateLessonField(module.id, lesson.id, { resourceUrl: url });
                                   }
                                }}
                             >
                                <FiImage /> Nhập Link
                             </button>
                             <button 
                                className="cb-button cb-button--secondary" 
                                onClick={() => fileInputRef.current?.click()}
                             >
                                <FiImage /> Upload File
                             </button>
                          </div>
                          
                          {/* Attachments List */}
                             {lesson.attachments && lesson.attachments.length > 0 && (
                             <div className="cb-attachments-list" style={{ marginTop: 12 }}>
                                {lesson.attachments.map((att: LessonAttachmentDraft, idx: number) => (
                                   <div key={idx} className="cb-attachment-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', border: '1px solid var(--cb-border-color)', borderRadius: 4, marginBottom: 8 }}>
                                      <FiFileText />
                                      <a href={att.url || '#'} target="_blank" rel="noopener noreferrer" style={{ flex: 1, color: 'var(--cb-accent-cyan)' }}>
                                         {att.name || 'Attachment'}
                                      </a>
                                      <button 
                                         className="cb-icon-button"
                                         onClick={() => {
                                            const newAtts = lesson.attachments?.filter((_, i) => i !== idx);
                                            updateLessonField(module.id, lesson.id, { attachments: newAtts });
                                         }}
                                      >
                                         <FiX />
                                      </button>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    </>
                 )}

                 {lesson.type === 'video' && (
                    <div className="cb-form-group">
                       <label className="cb-label">Nguồn Video</label>
                       <div className="cb-tabs" style={{ marginBottom: 16 }}>
                          <button 
                             className={`cb-tab ${!lesson.videoMediaId && lesson.videoMediaId !== 0 ? 'cb-tab--active' : ''}`}
                             onClick={() => updateLessonField(module.id, lesson.id, { videoMediaId: undefined })}
                          >
                             YouTube URL
                          </button>
                          <button 
                             className={`cb-tab ${lesson.videoMediaId || lesson.videoMediaId === 0 ? 'cb-tab--active' : ''}`}
                             onClick={() => {
                                if (lesson.videoMediaId === undefined) {
                                   updateLessonField(module.id, lesson.id, { videoMediaId: 0 });
                                }
                             }}
                          >
                             Upload Video
                          </button>
                       </div>

                       {(!lesson.videoMediaId && lesson.videoMediaId !== 0) ? (
                          <input 
                             className="cb-input"
                             value={lesson.youtubeUrl || ''}
                             onChange={(e) => updateLessonField(module.id, lesson.id, { youtubeUrl: e.target.value })}
                             placeholder="https://youtube.com/..."
                          />
                       ) : (
                          <div className="cb-course-upload" style={{ padding: 24 }}>
                             {lesson.videoMediaId ? (
                                <div style={{ textAlign: 'center' }}>
                                   <FiPlay size={32} />
                                   <p style={{ marginTop: 8, fontWeight: 500 }}>Video đã được tải lên</p>
                                   <p style={{ fontSize: '0.8rem', color: '#888' }}>ID: {lesson.videoMediaId}</p>
                                   <button className="cb-button cb-button--secondary cb-button--sm" style={{ marginTop: 16 }} onClick={() => videoInputRef.current?.click()}>
                                      Thay đổi Video
                                   </button>
                                </div>
                             ) : (
                                <div style={{ textAlign: 'center' }}>
                                   <FiPlay size={32} />
                                   <p>Kéo thả video vào đây hoặc click để upload</p>
                                   <button className="cb-button cb-button--secondary cb-button--sm" style={{ marginTop: 8 }} onClick={() => videoInputRef.current?.click()}>
                                      Chọn Video
                                   </button>
                                </div>
                             )}
                          </div>
                       )}
                    </div>
                 )}

                 {lesson.type === 'assignment' && (
                    <div className="cb-form-group">
                       <label className="cb-label">Hình thức nộp bài</label>
                       <select
                          className="cb-input cb-select"
                          value={lesson.assignmentSubmissionType || SubmissionType.TEXT}
                          onChange={(e) =>
                             {
                               updateLessonField(module.id, lesson.id, {
                                  assignmentSubmissionType: e.target.value as SubmissionType
                               });
                               clearAssignmentError(lesson.id, 'submissionType');
                             }
                          }
                       >
                          <option value={SubmissionType.TEXT}>Nộp văn bản</option>
                          <option value={SubmissionType.FILE}>Tải file</option>
                          <option value={SubmissionType.LINK}>Gửi link</option>
                       </select>
                       {lessonErrors?.submissionType && (
                         <div className="cb-error-text">{lessonErrors.submissionType}</div>
                       )}

                       <label className="cb-label">Mô tả bài tập</label>
                       <RichTextEditor 
                          key={`assign-${lesson.id}`}
                          initialContent={lesson.assignmentDescription || ''}
                          onChange={(val) => {
                             updateLessonField(module.id, lesson.id, { assignmentDescription: val });
                             clearAssignmentError(lesson.id, 'description');
                          }}
                          placeholder="Mô tả yêu cầu bài tập, hướng dẫn nộp bài..."
                       />
                       {lessonErrors?.description && (
                         <div className="cb-error-text">{lessonErrors.description}</div>
                       )}
                       
                       <div className="cb-grid cb-grid--2" style={{ marginTop: 16 }}>
                          <div className="cb-form-group">
                             <label className="cb-label">Điểm tối đa</label>
                             <input 
                                type="number" className="cb-input"
                                value={lesson.assignmentMaxScore ?? 100}
                                onWheel={blurOnWheel}
                                onChange={(e) => {
                                   updateLessonField(module.id, lesson.id, { assignmentMaxScore: parseInt(e.target.value) });
                                   clearAssignmentError(lesson.id, 'maxScore');
                                }}
                             />
                             {lessonErrors?.maxScore && (
                               <div className="cb-error-text">{lessonErrors.maxScore}</div>
                             )}
                          </div>
                          <div className="cb-form-group">
                             <label className="cb-label">Điểm đạt</label>
                             <input 
                                type="number" className="cb-input"
                                value={lesson.assignmentPassingScore ?? 50}
                                onWheel={blurOnWheel}
                                onChange={(e) => {
                                   updateLessonField(module.id, lesson.id, { assignmentPassingScore: parseInt(e.target.value) });
                                   clearAssignmentError(lesson.id, 'passingScore');
                                }}
                             />
                             {lessonErrors?.passingScore && (
                               <div className="cb-error-text">{lessonErrors.passingScore}</div>
                             )}
                          </div>
                       </div>

                       <div className="cb-form-group" style={{ marginTop: 24 }}>
                          <label className="cb-label">Tiêu chí chấm điểm (Rubric) <span style={{ color: 'var(--cb-error-color)' }}>*</span></label>
                          {lessonErrors?.criteriaRequired && (
                            <div className="cb-error-text" style={{ marginBottom: 8 }}>{lessonErrors.criteriaRequired}</div>
                          )}
                          <div className="cb-criteria-list">
                             {(lesson.assignmentCriteria || []).map((crit: AssignmentCriteriaDraft, idx: number) => {
                                const criteriaError = lessonErrors?.criteriaItems?.[idx];
                                return (
                                <div key={idx} className="cb-criteria-item" style={{ 
                                   display: 'flex', gap: 12, alignItems: 'flex-start', 
                                   padding: 16, border: '1px solid var(--cb-border-color)', borderRadius: 8, marginBottom: 12,
                                   backgroundColor: 'var(--cb-bg-secondary)'
                                }}>
                                   <div style={{ flex: 1 }}>
                                      <input 
                                         className="cb-input"
                                         value={crit.name}
                                         placeholder="Tên tiêu chí (VD: Sáng tạo, Kỹ thuật...)"
                                         style={{ marginBottom: 8 }}
                                         onChange={(e) => {
                                            const newCrit = [...(lesson.assignmentCriteria || [])];
                                            newCrit[idx].name = e.target.value;
                                            updateLessonField(module.id, lesson.id, { assignmentCriteria: newCrit });
                                            clearAssignmentError(lesson.id, 'criteriaItems', idx, 'name');
                                         }}
                                      />
                                      {criteriaError?.name && (
                                        <div className="cb-error-text">{criteriaError.name}</div>
                                      )}
                                      <textarea 
                                         className="cb-input cb-textarea"
                                         value={crit.description || ''}
                                         placeholder="Mô tả tiêu chí..."
                                         style={{ height: 60, fontSize: '0.9rem' }}
                                         onChange={(e) => {
                                            const newCrit = [...(lesson.assignmentCriteria || [])];
                                            newCrit[idx].description = e.target.value;
                                            updateLessonField(module.id, lesson.id, { assignmentCriteria: newCrit });
                                         }}
                                      />
                                   </div>
                                   <div style={{ width: 100 }}>
                                      <input 
                                         type="number" className="cb-input"
                                         value={crit.maxPoints}
                                         placeholder="Điểm"
                                         title="Điểm tối đa"
                                         onWheel={blurOnWheel}
                                         onChange={(e) => {
                                            const newCrit = [...(lesson.assignmentCriteria || [])];
                                            newCrit[idx].maxPoints = parseInt(e.target.value) || 0;
                                            updateLessonField(module.id, lesson.id, { assignmentCriteria: newCrit });
                                            clearAssignmentError(lesson.id, 'criteriaItems', idx, 'maxPoints');
                                         }}
                                      />
                                      {criteriaError?.maxPoints && (
                                        <div className="cb-error-text">{criteriaError.maxPoints}</div>
                                      )}
                                   </div>
                                   <button 
                                      className="cb-icon-button cb-icon-button--danger"
                                      style={{ marginTop: 4 }}
                                      onClick={() => {
                                         const newCrit = lesson.assignmentCriteria?.filter((_, i) => i !== idx);
                                         updateLessonField(module.id, lesson.id, { assignmentCriteria: newCrit });
                                         clearAssignmentError(lesson.id, 'criteriaItems');
                                      }}
                                   >
                                      <FiTrash2 />
                                   </button>
                                </div>
                               );
                             })}
                             <div style={{ marginTop: 8, fontSize: '0.9rem', color: validateAssignmentScore(lesson) ? 'var(--cb-success-color)' : 'var(--cb-error-color)' }}>
                                Tổng điểm tiêu chí: {lesson.assignmentCriteria?.reduce((sum, c) => sum + (c.maxPoints || 0), 0) || 0} / {lesson.assignmentMaxScore || 100}
                                {!validateAssignmentScore(lesson) && ' (Tổng điểm tiêu chí phải bằng Điểm tối đa)'}
                             </div>
                             {lessonErrors?.criteriaTotal && (
                               <div className="cb-error-text">{lessonErrors.criteriaTotal}</div>
                             )}
                             <button 
                                className="cb-button cb-button--secondary"
                                onClick={() => {
                                   const newCrit: AssignmentCriteriaDraft = { 
                                      name: '', 
                                      description: '', 
                                      maxPoints: 10, 
                                      orderIndex: (lesson.assignmentCriteria?.length || 0) 
                                   };
                                   updateLessonField(module.id, lesson.id, { assignmentCriteria: [...(lesson.assignmentCriteria || []), newCrit] });
                                   clearAssignmentError(lesson.id, 'criteriaRequired');
                                }}
                             >
                                <FiPlus /> Thêm tiêu chí
                             </button>
                          </div>
                       </div>
                    </div>
                 )}

                 {lesson.type === 'quiz' && (
                    <div className="cb-quiz-editor">
                       <div className="cb-tabs">
                          <button 
                             className={`cb-tab ${lessonEditor.activeTab === 'settings' ? 'cb-tab--active' : ''}`}
                             onClick={() => setLessonEditor(prev => ({ ...prev, activeTab: 'settings' }))}
                          >
                             <FiSettings /> Cấu hình
                          </button>
                          <button 
                             className={`cb-tab ${lessonEditor.activeTab === 'questions' ? 'cb-tab--active' : ''}`}
                             onClick={() => setLessonEditor(prev => ({ ...prev, activeTab: 'questions' }))}
                          >
                             <FiList /> Câu hỏi ({lesson.questions?.length || 0})
                          </button>
                       </div>

                       {lessonEditor.activeTab === 'settings' ? (
                          <>
                             <div className="cb-form-group">
                                <label className="cb-label">Mô tả bài kiểm tra</label>
                                <textarea 
                                   className="cb-input cb-textarea"
                                   style={{ height: 100 }}
                                   value={lesson.quizDescription || ''}
                                   onChange={(e) => updateLessonField(module.id, lesson.id, { quizDescription: e.target.value })}
                                   placeholder="Hướng dẫn làm bài, quy định..."
                                />
                             </div>

                             <div className="cb-grid cb-grid--2" style={{ marginTop: 16 }}>
                             <div className="cb-form-group">
                                <label className="cb-label">Điểm đạt (%)</label>
                                <input 
                                   type="number" className="cb-input"
                                   value={lesson.passScore ?? 80}
                                   onWheel={blurOnWheel}
                                   onChange={(e) => updateLessonField(module.id, lesson.id, { passScore: parseInt(e.target.value) })}
                                />
                             </div>
                             <div className="cb-form-group">
                                <label className="cb-label">Số lần làm lại</label>
                                <input 
                                   type="number" className="cb-input"
                                   value={lesson.quizMaxAttempts ?? 3}
                                   onWheel={blurOnWheel}
                                   onChange={(e) => updateLessonField(module.id, lesson.id, { quizMaxAttempts: parseInt(e.target.value) })}
                                />
                             </div>
                             <div className="cb-form-group">
                                <label className="cb-label">Thời gian (phút)</label>
                                <input 
                                   type="number" className="cb-input"
                                   value={lesson.quizTimeLimitMinutes ?? ''}
                                   placeholder="Không giới hạn"
                                   onWheel={blurOnWheel}
                                   onChange={(e) => updateLessonField(module.id, lesson.id, { quizTimeLimitMinutes: parseInt(e.target.value) })}
                                />
                             </div>
                             
                             <div className="cb-form-group">
                                <label className="cb-label">Phương pháp tính điểm</label>
                                <select 
                                   className="cb-input cb-select"
                                   value={lesson.gradingMethod || 'HIGHEST'}
                                   onChange={(e) => updateLessonField(module.id, lesson.id, { gradingMethod: e.target.value })}
                                >
                                   <option value="HIGHEST">Điểm cao nhất</option>
                                   <option value="AVERAGE">Điểm trung bình</option>
                                   <option value="FIRST">Lần làm đầu tiên</option>
                                   <option value="LAST">Lần làm cuối cùng</option>
                                </select>
                             </div>

                             <div className="cb-form-group">
                                <label className="cb-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                   <input 
                                      type="checkbox"
                                      checked={lesson.isAssessment || false}
                                      onChange={(e) => updateLessonField(module.id, lesson.id, { isAssessment: e.target.checked })}
                                   />
                                   Đây là bài kiểm tra đánh giá (Assessment)
                                </label>
                                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                                   Bài kiểm tra đánh giá thường có trọng số cao hơn và yêu cầu nghiêm ngặt hơn.
                                </p>
                             </div>
                          </div>
                          </>
                       ) : (
                          <div className="cb-questions-manager" style={{ marginTop: 16 }}>
                             {(lesson.questions || []).map((q: QuizQuestionDraft, idx: number) => (
                                <div key={q.id} className="cb-question-card">
                                   <div className="cb-question-header">
                                      <span>Câu {idx + 1}</span>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12, color: 'var(--cb-text-dim)' }}>Điểm</span>
                                            <input
                                               type="number"
                                               min={1}
                                               className="cb-input cb-input--compact"
                                               style={{ width: 80, height: 32 }}
                                               value={q.score ?? 1}
                                               onWheel={blurOnWheel}
                                               onChange={(e) => {
                                                  const nextScore = parseInt(e.target.value, 10);
                                                  const newQ = [...(lesson.questions || [])];
                                                  newQ[idx].score = Number.isFinite(nextScore) && nextScore > 0 ? nextScore : 1;
                                                  updateLessonField(module.id, lesson.id, { questions: newQ });
                                               }}
                                            />
                                         </div>
                                         <select
                                            className="cb-input cb-select"
                                            style={{ 
                                               width: 'auto', 
                                               padding: '4px 8px', 
                                               height: 32,
                                               backgroundColor: 'var(--cb-bg-secondary)',
                                               color: 'var(--cb-text-primary)',
                                               borderColor: 'var(--cb-border-color)'
                                            }}
                                            value={q.type || QuestionType.MULTIPLE_CHOICE}
                                            onChange={(e) => {
                                               const newType = e.target.value as QuestionType;
                                               const defaultQ = createDefaultQuestion(newType);
                                               const newQ = [...(lesson.questions || [])];
                                               newQ[idx] = { ...newQ[idx], type: newType, options: defaultQ.options };
                                               updateLessonField(module.id, lesson.id, { questions: newQ });
                                            }}
                                         >
                                            <option value={QuestionType.MULTIPLE_CHOICE} style={{ backgroundColor: 'var(--cb-bg-secondary)', color: 'var(--cb-text-primary)' }}>Trắc nghiệm</option>
                                            <option value={QuestionType.TRUE_FALSE} style={{ backgroundColor: 'var(--cb-bg-secondary)', color: 'var(--cb-text-primary)' }}>Đúng/Sai</option>
                                            <option value={QuestionType.SHORT_ANSWER} style={{ backgroundColor: 'var(--cb-bg-secondary)', color: 'var(--cb-text-primary)' }}>Điền từ</option>
                                         </select>
                                         <button 
                                            className="cb-icon-button cb-icon-button--danger"
                                            onClick={() => {
                                               const newQ = lesson.questions?.filter(qi => qi.id !== q.id);
                                               updateLessonField(module.id, lesson.id, { questions: newQ });
                                            }}
                                         >
                                            <FiTrash2 />
                                         </button>
                                      </div>
                                   </div>
                                   <input 
                                      className="cb-input" 
                                      value={q.text} 
                                      placeholder="Nhập nội dung câu hỏi..."
                                      onChange={(e) => {
                                         const newQ = [...(lesson.questions || [])];
                                         newQ[idx].text = e.target.value;
                                         updateLessonField(module.id, lesson.id, { questions: newQ });
                                      }}
                                   />
                                   
                                   {/* Options UI based on Type */}
                                   <div className="cb-options" style={{ marginTop: 12 }}>
                                      {/* MULTIPLE CHOICE */}
                                      {(q.type === QuestionType.MULTIPLE_CHOICE || !q.type) && (
                                         <>
                                            {q.options.map((opt: QuizOptionDraft, oIdx: number) => (
                                               <div key={opt.id} className="cb-option-row">
                                                  <input 
                                                     className="cb-input cb-input--compact"
                                                     value={opt.text}
                                                     placeholder={`Lựa chọn ${oIdx + 1}`}
                                                     onKeyDown={(e) => {
                                                        if (e.key === 'ArrowDown' || e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const nextInput = (e.currentTarget.parentElement?.nextElementSibling?.querySelector('input') as HTMLInputElement);
                                                            if (nextInput) nextInput.focus();
                                                        }
                                                        if (e.key === 'ArrowUp') {
                                                            e.preventDefault();
                                                            const prevInput = (e.currentTarget.parentElement?.previousElementSibling?.querySelector('input') as HTMLInputElement);
                                                            if (prevInput) prevInput.focus();
                                                        }
                                                     }}
                                                     onChange={(e) => {
                                                        const newQ = [...(lesson.questions || [])];
                                                        newQ[idx].options[oIdx].text = e.target.value;
                                                        updateLessonField(module.id, lesson.id, { questions: newQ });
                                                     }}
                                                  />
                                                  <div className="cb-option-correct" title="Đánh dấu đáp án đúng">
                                                     <input 
                                                        type="checkbox"
                                                        checked={opt.correct}
                                                        onChange={(e) => {
                                                           const newQ = [...(lesson.questions || [])];
                                                           newQ[idx].options[oIdx].correct = e.target.checked;
                                                           updateLessonField(module.id, lesson.id, { questions: newQ });
                                                        }}
                                                     />
                                                  </div>
                                                  <button 
                                                     className="cb-icon-button"
                                                     onClick={() => {
                                                        const newQ = [...(lesson.questions || [])];
                                                        newQ[idx].options = newQ[idx].options.filter((o: QuizOptionDraft) => o.id !== opt.id);
                                                        updateLessonField(module.id, lesson.id, { questions: newQ });
                                                     }}
                                                  >
                                                     <FiX />
                                                  </button>
                                               </div>
                                            ))}
                                            <button 
                                               className="cb-button cb-button--ghost cb-button--sm"
                                               onClick={() => {
                                                  const newQ = [...(lesson.questions || [])];
                                                  newQ[idx].options.push({ id: createId(), text: '', correct: false });
                                                  updateLessonField(module.id, lesson.id, { questions: newQ });
                                               }}
                                            >
                                               <FiPlus /> Thêm lựa chọn
                                            </button>
                                         </>
                                      )}

                                      {/* TRUE/FALSE */}
                                      {q.type === QuestionType.TRUE_FALSE && (
                                         <div style={{ display: 'flex', gap: 16 }}>
                                            {q.options.map((opt: QuizOptionDraft, oIdx: number) => (
                                               <label 
                                                  key={opt.id} 
                                                  className={`cb-tf-option ${opt.correct ? 'is-selected' : ''}`}
                                                  style={{ 
                                                     display: 'flex', alignItems: 'center', gap: 8, 
                                                     padding: '8px 16px', borderRadius: 8, 
                                                     border: opt.correct ? '1px solid var(--cb-success-color)' : '1px solid var(--cb-border-color)',
                                                     backgroundColor: opt.correct ? 'rgba(var(--cb-success-rgb), 0.1)' : 'transparent',
                                                     cursor: 'pointer',
                                                     color: 'var(--cb-text-primary)'
                                                  }}
                                               >
                                                  <input 
                                                     type="radio"
                                                     name={`q-${q.id}`}
                                                     checked={opt.correct}
                                                     onChange={() => {
                                                        const newQ = [...(lesson.questions || [])];
                                                        newQ[idx].options.forEach((o: QuizOptionDraft) => o.correct = false);
                                                        newQ[idx].options[oIdx].correct = true;
                                                        updateLessonField(module.id, lesson.id, { questions: newQ });
                                                     }}
                                                  />
                                                  <span style={{ color: 'var(--cb-text-primary)' }}>{opt.text}</span>
                                               </label>
                                            ))}
                                         </div>
                                      )}

                                      {/* SHORT ANSWER */}
                                      {q.type === QuestionType.SHORT_ANSWER && (
                                         <div className="cb-option-row">
                                            <input 
                                               className="cb-input"
                                               value={q.options[0]?.text || ''}
                                               placeholder="Nhập câu trả lời chính xác..."
                                               onChange={(e) => {
                                                  const newQ = [...(lesson.questions || [])];
                                                  if (!newQ[idx].options[0]) {
                                                     newQ[idx].options[0] = { id: createId(), text: '', correct: true };
                                                  }
                                                  newQ[idx].options[0].text = e.target.value;
                                                  newQ[idx].options[0].correct = true;
                                                  updateLessonField(module.id, lesson.id, { questions: newQ });
                                               }}
                                            />
                                         </div>
                                      )}
                                   </div>
                                </div>
                             ))}
                             <button 
                                className="cb-button cb-button--secondary"
                                onClick={() => {
                                   const newQ = createDefaultQuestion();
                                   updateLessonField(module.id, lesson.id, { questions: [...(lesson.questions || []), newQ] });
                                }}
                             >
                                <FiPlus /> Thêm câu hỏi
                             </button>
                          </div>
                       )}
                    </div>
                 )}
              </div>
           </div>
        </div>
      );
    }
    return <div className="cb-empty-state">Chọn một mục để chỉnh sửa</div>;
  };

  return (
    <div className="cb-page">
      {!isEditable && (
         <div className="cb-banner-warning">
            <FiAlertTriangle size={20} />
            <div>
               <strong>Chế độ xem:</strong> Khóa học này đang ở trạng thái <strong>{state.currentCourse?.status}</strong> và không thể chỉnh sửa trực tiếp. 
               {isRevisionMode
                 ? ` Phiên bản hiện tại đang ở trạng thái ${activeRevision?.status ?? 'N/A'}, bạn chỉ có thể xem.`
                 : hasPendingOpenRevision
                   ? ` Khóa học đã có phiên bản #${openRevision?.revisionNumber ?? ''} đang chờ duyệt. Vui lòng chờ admin xử lý phiên bản này trước khi tạo phiên bản mới.`
                   : hasDraftOpenRevision
                     ? ` Khóa học đã có phiên bản nháp #${openRevision?.revisionNumber ?? ''}. Vui lòng mở phiên bản này để tiếp tục chỉnh sửa.`
                     : ' Vui lòng tạo phiên bản mới để cập nhật khóa học đã xuất bản.'}
            </div>
            {!isRevisionMode && state.currentCourse?.status === CourseStatus.PUBLIC && (
              <button
                className="cb-button cb-banner-warning__action"
                onClick={() => {
                  if (openRevision) {
                    handleOpenRevisionInEditor(openRevision);
                    return;
                  }
                  void handleCreateRevisionFromPublic();
                }}
                disabled={isRevisionLoading}
              >
                <FiPlus /> {openRevision ? `Mở phiên bản #${openRevision.revisionNumber}` : 'Tạo phiên bản mới'}
              </button>
            )}
         </div>
      )}

      <div className="cb-container" style={{ maxWidth: '100%', padding: '0 24px', paddingBottom: 0, flexShrink: 0 }}>
        <header className="cb-header" style={{ marginBottom: 16 }}>
          <div className="cb-header__left">
            <button className="cb-back-button" onClick={handleGoBack}>
              <FiArrowLeft /> Quay lại
            </button>
            <h1 className="cb-title">
              {isEditMode ? 'Chỉnh sửa khóa học' : 'Tạo khóa học'}
              {isRevisionMode && activeRevision ? ` • Phiên bản #${activeRevision.revisionNumber}` : ''}
            </h1>
          </div>
          <div className="cb-header__right">
              {isEditMode && state.currentCourse?.id && revisionHistory.length > 0 && (
                <button
                  className="cb-revision-history-trigger"
                  onClick={() => setIsRevisionHistoryModalOpen(true)}
                >
                  <FiList />
                  <span>Xem lịch sử</span>
                  {latestRevision && (
                    <span className="cb-revision-history-trigger__latest">#{latestRevision.revisionNumber}</span>
                  )}
                </button>
              )}
              <button 
                 className="cb-button cb-button--secondary" 
                 disabled={isSaving || !isEditable} 
                 onClick={() => void handleSaveDraft()}
              >
                <FiSave /> Lưu nháp
             </button>
             <button
                className="cb-button cb-button--success"
                disabled={isSaving || !isEditable}
                onClick={() => void handlePublishCourse()}
             >
                <FiCheck /> Gửi duyệt
             </button>
           </div>
         </header>

       </div>
      
      <div className="cb-workspace">
        {renderSidebar()}
        {renderMainContent()}
      </div>

      {confirmDialog && (
        <div className="cb-modal-overlay">
           <div className="cb-modal">
              <h3>{confirmDialog.title}</h3>
              <p>{confirmDialog.message}</p>
              <div className="cb-modal__actions">
                 <button className="cb-button cb-button--secondary" onClick={() => setConfirmDialog(null)}>Hủy</button>
                 <button className="cb-button cb-button--danger" onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                 }}>{confirmDialog.confirmLabel || 'Xác nhận'}</button>
              </div>
           </div>
        </div>
      )}

      {isRevisionHistoryModalOpen && (
        <div
          className="cb-modal-overlay"
          role="presentation"
          onClick={() => setIsRevisionHistoryModalOpen(false)}
        >
          <div
            className="cb-modal cb-revision-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Lịch sử phiên bản"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cb-modal__header">
              <div>
                <h3>Lịch sử phiên bản</h3>
                <p className="cb-revision-modal__subtitle">
                  {state.courseForm.title || state.currentCourse?.title || 'Khóa học'}
                </p>
              </div>
              <button
                className="cb-button cb-button--secondary cb-button--sm"
                onClick={() => setIsRevisionHistoryModalOpen(false)}
              >
                <FiX /> Đóng
              </button>
            </div>

            <div className="cb-revision-modal__list">
              {revisionHistory.map((revision) => {
                const isCurrentRevision = activeRevision?.id === revision.id;
                return (
                  <article
                    key={revision.id}
                    className={`cb-revision-row${isCurrentRevision ? ' is-current' : ''}`}
                  >
                    <div className="cb-revision-row__info">
                      <div className="cb-revision-row__line">
                        <span className={`cb-revision-status cb-revision-status--${getRevisionStatusTone(revision.status)}`}>
                          {formatRevisionStatusLabel(revision.status)}
                        </span>
                        <span className="cb-revision-row__number">#{revision.revisionNumber}</span>
                        {isCurrentRevision && <span className="cb-revision-row__current">Đang mở</span>}
                      </div>
                      <div className="cb-revision-row__meta">
                        <span>Tạo: {formatRevisionDate(revision.createdAt)}</span>
                        <span>Cập nhật: {formatRevisionDate(revision.updatedAt)}</span>
                      </div>
                    </div>
                    <button
                      className="cb-button cb-button--secondary cb-button--sm"
                      onClick={() => handleOpenRevisionInEditor(revision)}
                    >
                      Mở
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <input 
         type="file" 
         ref={fileInputRef} 
         style={{ display: 'none' }} 
         onChange={handleFileUpload} 
         accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
      />
      <input 
         type="file" 
         ref={videoInputRef} 
         style={{ display: 'none' }} 
         onChange={handleVideoUpload} 
         accept="video/mp4,video/webm,video/ogg"
      />

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

export default CourseCreationPage;
