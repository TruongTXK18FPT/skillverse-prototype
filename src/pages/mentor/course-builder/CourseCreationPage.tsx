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
import { mapRevisionSnapshotIdentityErrorToVietnameseMessage } from '../../../utils/courseRevisionMessages';
import '../../../styles/course-builder.css';

// ============================================================================
// TYPES
// ============================================================================

type ViewState = 
  | { type: 'course_info' }
  | { type: 'module'; moduleId: string }
  | { type: 'lesson'; moduleId: string; lessonId: string };

type BuilderFlowState = 'submitted' | 'revisionCreated' | 'revisionSubmitted';

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
const COURSE_BUILDER_FLOW_PARAM = 'flow';
const COURSE_DRAFT_ORDER_DEBUG_KEY = 'sv_debug_draft_order';

const isCourseDraftOrderDebugEnabled = () =>
  typeof window !== 'undefined' && window.localStorage.getItem(COURSE_DRAFT_ORDER_DEBUG_KEY) === '1';

const buildModuleOrderDebugSnapshot = (draftModules: ModuleDraft[]) =>
  draftModules.map((module, moduleIndex) => ({
    moduleIndex,
    moduleId: module.id,
    moduleServerId: module.serverId ?? null,
    moduleTitle: module.title,
    lessons: (module.lessons || []).map((lesson, lessonIndex) => ({
      lessonIndex,
      lessonId: lesson.id,
      lessonServerId: lesson.serverId ?? null,
      type: lesson.type,
      title: lesson.title,
      orderIndex: lesson.orderIndex ?? null
    }))
  }));

const logCourseDraftOrderDebug = (label: string, draftModules: ModuleDraft[]) => {
  if (!isCourseDraftOrderDebugEnabled()) return;
  console.groupCollapsed(`[COURSE-ORDER-DEBUG] ${label}`);
  console.log(buildModuleOrderDebugSnapshot(draftModules));
  console.groupEnd();
};

const parseBuilderFlowState = (params: URLSearchParams): BuilderFlowState | null => {
  const flow = params.get(COURSE_BUILDER_FLOW_PARAM);
  if (flow === 'submitted' || flow === 'revisionCreated' || flow === 'revisionSubmitted') {
    return flow;
  }

  // Backward compatibility for old links generated with dedicated flags.
  if (params.get('submitted') === '1') return 'submitted';
  if (params.get('revisionCreated') === '1') return 'revisionCreated';
  if (params.get('revisionSubmitted') === '1') return 'revisionSubmitted';

  return null;
};

const buildCourseEditUrl = (
  courseId: string | number,
  options?: { revisionId?: number; flow?: BuilderFlowState }
) => {
  const params = new URLSearchParams();
  if (typeof options?.revisionId === 'number' && Number.isFinite(options.revisionId) && options.revisionId > 0) {
    params.set('revisionId', String(options.revisionId));
  }
  if (options?.flow) {
    params.set(COURSE_BUILDER_FLOW_PARAM, options.flow);
  }
  const query = params.toString();
  return query
    ? `/mentor/courses/${courseId}/edit?${query}`
    : `/mentor/courses/${courseId}/edit`;
};

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

const hasOwnKey = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isBooleanOrNull = (value: unknown): boolean =>
  typeof value === 'boolean' || value === null;

const normalizeSnapshotLessonType = (value: unknown): LessonKind | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'reading' || normalized === 'video' || normalized === 'quiz' || normalized === 'assignment') {
    return normalized;
  }
  return null;
};

const normalizeSnapshotQuestionType = (value: unknown): QuestionType | null => {
  if (typeof value !== 'string') return null;
  const upper = value.trim().toUpperCase();
  if (upper === QuestionType.MULTIPLE_CHOICE) return QuestionType.MULTIPLE_CHOICE;
  if (upper === QuestionType.TRUE_FALSE) return QuestionType.TRUE_FALSE;
  if (upper === QuestionType.SHORT_ANSWER) return QuestionType.SHORT_ANSWER;
  return null;
};

const buildRevisionContentSnapshot = (modules: ModuleDraft[]) => ({
  snapshotVersion: 1,
  compatibility: {
    autoCompatibleOnly: true,
      level: 'NON_BREAKING'
  },
  modules: modules.map((module, moduleIndex) => ({
    ...(typeof module.serverId === 'number' && module.serverId > 0 ? { id: module.serverId } : {}),
    orderIndex: moduleIndex,
    title: normalizeSnapshotText(module.title),
    description: normalizeSnapshotText(module.description),
    lessons: module.lessons.map((lesson, lessonIndex) => ({
      ...(typeof lesson.serverId === 'number' && lesson.serverId > 0 ? { id: lesson.serverId } : {}),
      orderIndex: lessonIndex,
      title: normalizeSnapshotText(lesson.title),
      type: lesson.type,
      durationMin: lesson.durationMin ?? null,
      contentText: normalizeSnapshotText(lesson.contentText),
      resourceUrl: normalizeSnapshotText(lesson.resourceUrl),
      youtubeUrl: normalizeSnapshotText(lesson.youtubeUrl),
      videoMediaId: lesson.videoMediaId ?? null,
      ...(lesson.passScore !== undefined ? { passScore: lesson.passScore } : {}),
      ...(lesson.quizMaxAttempts !== undefined ? { quizMaxAttempts: lesson.quizMaxAttempts } : {}),
      ...(lesson.quizTimeLimitMinutes !== undefined ? { quizTimeLimitMinutes: lesson.quizTimeLimitMinutes } : {}),
      ...(lesson.roundingIncrement !== undefined ? { roundingIncrement: lesson.roundingIncrement } : {}),
      ...(lesson.quizDescription !== undefined
        ? { quizDescription: normalizeSnapshotText(lesson.quizDescription) }
        : {}),
      ...(lesson.gradingMethod !== undefined
        ? { gradingMethod: normalizeSnapshotText(lesson.gradingMethod) }
        : {}),
      ...(lesson.isAssessment !== undefined ? { isAssessment: lesson.isAssessment } : {}),
      ...(lesson.cooldownHours !== undefined ? { cooldownHours: lesson.cooldownHours } : {}),
      ...(lesson.assignmentSubmissionType !== undefined
        ? { assignmentSubmissionType: lesson.assignmentSubmissionType }
        : {}),
      ...(lesson.assignmentDescription !== undefined
        ? { assignmentDescription: normalizeSnapshotText(lesson.assignmentDescription) }
        : {}),
      ...(lesson.assignmentMaxScore !== undefined ? { assignmentMaxScore: lesson.assignmentMaxScore } : {}),
      ...(lesson.assignmentPassingScore !== undefined
        ? { assignmentPassingScore: lesson.assignmentPassingScore }
        : {}),
      ...(lesson.type === 'assignment'
        ? { isRequired: lesson.assignmentIsRequired ?? true }
        : (lesson.assignmentIsRequired !== undefined ? { isRequired: lesson.assignmentIsRequired } : {})),
      ...(hasOwnKey(lesson, 'questions')
        ? {
          questions: (lesson.questions || []).map((question, questionIndex) => ({
            ...(typeof question.serverId === 'number' && question.serverId > 0 ? { id: question.serverId } : {}),
            orderIndex: question.orderIndex ?? questionIndex,
            text: normalizeSnapshotText(question.text),
            type: question.type,
            score: question.score ?? null,
            options: (question.options || []).map((option, optionIndex) => ({
              ...(typeof option.serverId === 'number' && option.serverId > 0 ? { id: option.serverId } : {}),
              orderIndex: option.orderIndex ?? optionIndex,
              text: normalizeSnapshotText(option.text),
              correct: option.correct
            }))
          }))
        }
        : {}),
      ...(hasOwnKey(lesson, 'assignmentCriteria')
        ? {
          assignmentCriteria: (lesson.assignmentCriteria || []).map((criteria, criteriaIndex) => ({
            ...(typeof criteria.id === 'number' && criteria.id > 0 ? { id: criteria.id } : {}),
            orderIndex: criteria.orderIndex ?? criteriaIndex,
            name: normalizeSnapshotText(criteria.name),
            description: normalizeSnapshotText(criteria.description),
            maxPoints: criteria.maxPoints ?? null,
            // Keep rubric threshold aligned with criteria points when passingPoints is not explicitly set.
            passingPoints: criteria.passingPoints ?? criteria.maxPoints ?? null,
            isRequired: criteria.isRequired ?? null
          }))
        }
        : {}),
      attachments: normalizeLessonAttachments(lesson.attachments).map((attachment, attachmentIndex) => ({
        ...(typeof attachment.serverId === 'number' && attachment.serverId > 0 ? { id: attachment.serverId } : {}),
        orderIndex: attachmentIndex,
        name: normalizeSnapshotText(attachment.name),
        mediaId: attachment.mediaId ?? null,
        url: normalizeSnapshotText(attachment.url)
      }))
    }))
  }))
});

type RevisionSnapshotPayload = ReturnType<typeof buildRevisionContentSnapshot>;

const normalizeRevisionSnapshotPayload = (snapshot: RevisionSnapshotPayload): RevisionSnapshotPayload => {
  const normalizedModules = Array.isArray(snapshot.modules)
    ? snapshot.modules.map((module, moduleIndex) => ({
      ...module,
      orderIndex: typeof module.orderIndex === 'number' ? module.orderIndex : moduleIndex,
      lessons: Array.isArray(module.lessons)
        ? module.lessons.map((lesson, lessonIndex) => {
          const lessonType = normalizeSnapshotLessonType(lesson.type);
          return {
          ...lesson,
          orderIndex: typeof lesson.orderIndex === 'number' ? lesson.orderIndex : lessonIndex,
          ...(lessonType === 'assignment' && !hasOwnKey(lesson, 'isRequired')
            ? { isRequired: true }
            : {}),
          ...(hasOwnKey(lesson, 'questions')
            ? {
              questions: Array.isArray(lesson.questions)
                ? lesson.questions.map((question, questionIndex) => ({
                  ...question,
                  orderIndex: typeof question.orderIndex === 'number' ? question.orderIndex : questionIndex,
                  options: Array.isArray(question.options)
                    ? question.options.map((option, optionIndex) => ({
                      ...option,
                      orderIndex: typeof option.orderIndex === 'number' ? option.orderIndex : optionIndex,
                    }))
                    : [],
                }))
                : [],
            }
            : {}),
          ...(hasOwnKey(lesson, 'assignmentCriteria')
            ? {
              assignmentCriteria: Array.isArray(lesson.assignmentCriteria)
                ? lesson.assignmentCriteria.map((criteria, criteriaIndex) => ({
                  ...criteria,
                  orderIndex: typeof criteria.orderIndex === 'number' ? criteria.orderIndex : criteriaIndex,
                }))
                : [],
            }
            : {}),
          attachments: Array.isArray(lesson.attachments)
            ? lesson.attachments.map((attachment, attachmentIndex) => ({
              ...attachment,
              orderIndex: typeof attachment.orderIndex === 'number' ? attachment.orderIndex : attachmentIndex,
              mediaId: Object.prototype.hasOwnProperty.call(attachment, 'mediaId') ? attachment.mediaId : null,
              url: Object.prototype.hasOwnProperty.call(attachment, 'url') ? attachment.url : null,
            }))
            : [],
        }})
        : [],
    }))
    : [];

  return {
    ...snapshot,
    snapshotVersion: 1,
    compatibility: {
      autoCompatibleOnly: true,
      level: 'NON_BREAKING',
    },
    modules: normalizedModules,
  };
};

const validateRevisionSnapshotPayload = (snapshot: RevisionSnapshotPayload): string | null => {
  if (!Array.isArray(snapshot.modules)) {
    return 'Snapshot không hợp lệ: thiếu danh sách module.';
  }

  for (let moduleIndex = 0; moduleIndex < snapshot.modules.length; moduleIndex += 1) {
    const module = snapshot.modules[moduleIndex];
    if (!Array.isArray(module.lessons)) {
      return `Snapshot không hợp lệ tại module #${moduleIndex + 1}: thiếu danh sách lessons.`;
    }

    for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex += 1) {
      const lesson = module.lessons[lessonIndex];
      const lessonType = normalizeSnapshotLessonType(lesson.type);
      if (!lessonType) {
        return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, item #${lessonIndex + 1}: thiếu type.`;
      }
      if (typeof lesson.orderIndex !== 'number' || Number.isNaN(lesson.orderIndex)) {
        return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, item #${lessonIndex + 1}: orderIndex không hợp lệ.`;
      }

      if (lessonType === 'quiz') {
        if (!hasOwnKey(lesson, 'passScore')) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}: thiếu passScore (field thiếu khác với explicit null).`;
        }
        if (!isFiniteNumber(lesson.passScore) || lesson.passScore < 0 || lesson.passScore > 100) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}: passScore phải trong khoảng 0-100.`;
        }

        if (!hasOwnKey(lesson, 'questions')) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}: thiếu questions.`;
        }
        if (!Array.isArray(lesson.questions) || lesson.questions.length === 0) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}: questions phải là mảng và có ít nhất 1 câu.`;
        }

        for (let questionIndex = 0; questionIndex < lesson.questions.length; questionIndex += 1) {
          const question = lesson.questions[questionIndex];
          if (typeof question !== 'object' || question == null) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}, câu #${questionIndex + 1}: dữ liệu câu hỏi sai cấu trúc.`;
          }
          const questionType = normalizeSnapshotQuestionType((question as Record<string, unknown>).type);
          if (!questionType) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}, câu #${questionIndex + 1}: thiếu type hợp lệ.`;
          }
          if (!Array.isArray((question as Record<string, unknown>).options)
            || ((question as Record<string, unknown>).options as unknown[]).length === 0) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}, câu #${questionIndex + 1}: thiếu options.`;
          }
        }
      }

      if (lessonType === 'assignment') {
        const assignmentRequiredValue = hasOwnKey(lesson, 'isRequired') ? lesson.isRequired : true;
        if (!isBooleanOrNull(assignmentRequiredValue)) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}: isRequired phải là boolean hoặc null.`;
        }

        if (!hasOwnKey(lesson, 'assignmentCriteria')) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}: thiếu rubric (assignmentCriteria).`;
        }
        if (!Array.isArray(lesson.assignmentCriteria) || lesson.assignmentCriteria.length === 0) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}: rubric phải có ít nhất 1 tiêu chí.`;
        }

        for (let criteriaIndex = 0; criteriaIndex < lesson.assignmentCriteria.length; criteriaIndex += 1) {
          const criteria = lesson.assignmentCriteria[criteriaIndex];
          if (typeof criteria !== 'object' || criteria == null) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}, rubric #${criteriaIndex + 1}: dữ liệu tiêu chí sai cấu trúc.`;
          }
          const criteriaRecord = criteria as Record<string, unknown>;
          const criteriaName = typeof criteriaRecord.name === 'string' ? criteriaRecord.name.trim() : '';
          if (!criteriaName) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}, rubric #${criteriaIndex + 1}: thiếu tên tiêu chí.`;
          }
          if (!isFiniteNumber(criteriaRecord.maxPoints) || criteriaRecord.maxPoints <= 0) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}, rubric #${criteriaIndex + 1}: maxPoints phải > 0.`;
          }
          if (!hasOwnKey(criteriaRecord, 'isRequired') || !isBooleanOrNull(criteriaRecord.isRequired)) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}, rubric #${criteriaIndex + 1}: isRequired phải là boolean hoặc null.`;
          }
        }
      }
    }
  }

  return null;
};

const toPositiveNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
};

const toNonNegativeNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return value;
};

const toPositiveIntegerIdOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return undefined;
};

const toStringOrUndefined = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

const normalizeKey = (value?: string): string =>
  (value || '').trim().toLowerCase();

const isSuspiciousNumericText = (value?: string): boolean => {
  if (!value) return false;
  return /^\d{5,}$/.test(value.trim());
};

const pickPreferredText = (primary?: string, fallback?: string): string | undefined => {
  if (primary && !isSuspiciousNumericText(primary)) {
    return primary;
  }
  if (fallback && !isSuspiciousNumericText(fallback)) {
    return fallback;
  }
  return primary || fallback;
};

const buildLessonFingerprint = (lesson: LessonDraft): string => {
  const normalizedTitle = normalizeKey(lesson.title);
  const normalizedContent = normalizeKey(lesson.contentText);
  const normalizedResource = normalizeKey(lesson.resourceUrl);
  const normalizedYoutube = normalizeKey(lesson.youtubeUrl);
  const type = lesson.type || 'reading';

  return [
    type,
    normalizedTitle,
    normalizedContent,
    normalizedResource,
    normalizedYoutube,
    lesson.passScore ?? '',
    lesson.assignmentSubmissionType ?? '',
    lesson.assignmentMaxScore ?? '',
    lesson.assignmentPassingScore ?? ''
  ].join('|');
};

const dedupeDraftLessons = (lessons: LessonDraft[]): LessonDraft[] => {
  const seenServerIds = new Set<number>();
  const seenFingerprints = new Set<string>();

  return lessons.filter((lesson) => {
    if (typeof lesson.serverId === 'number') {
      if (seenServerIds.has(lesson.serverId)) {
        return false;
      }
      seenServerIds.add(lesson.serverId);
      return true;
    }

    const fingerprint = buildLessonFingerprint(lesson);
    if (seenFingerprints.has(fingerprint)) {
      return false;
    }
    seenFingerprints.add(fingerprint);
    return true;
  });
};

const mapCourseModulesToDraftModules = (courseModules: Array<Record<string, unknown>>): ModuleDraft[] =>
  courseModules.map((module) => {
    const moduleRecord = module as Record<string, unknown>;
    const moduleLessons = Array.isArray(moduleRecord.lessons)
      ? (moduleRecord.lessons as Array<Record<string, unknown>>)
      : [];

    return {
      id: String(moduleRecord.id ?? createId()),
      ...(typeof moduleRecord.id === 'number' ? { serverId: moduleRecord.id } : {}),
      title: toStringOrUndefined(moduleRecord.title) || '',
      description: toStringOrUndefined(moduleRecord.description) || '',
      lessons: moduleLessons.map((rawLesson) => {
        const lessonId = rawLesson.id;
        const quizQuestions = Array.isArray(rawLesson.questions)
          ? (rawLesson.questions as QuizQuestionDraft[])
          : [];
        const assignmentCriteria = Array.isArray(rawLesson.assignmentCriteria)
          ? (rawLesson.assignmentCriteria as AssignmentCriteriaDraft[])
          : (Array.isArray((rawLesson as Record<string, unknown>).criteria)
            ? ((rawLesson as Record<string, unknown>).criteria as AssignmentCriteriaDraft[])
            : []);

        return {
          id: String(lessonId ?? createId()),
          ...(typeof lessonId === 'number' ? { serverId: lessonId } : {}),
          title: toStringOrUndefined(rawLesson.title) || '',
          type: parseLessonKindFromSnapshot(rawLesson.type),
          durationMin: toPositiveNumberOrUndefined(rawLesson.durationSec)
            ? Math.round(Number(rawLesson.durationSec) / 60)
            : toPositiveNumberOrUndefined(rawLesson.durationMin),
          contentText: toStringOrUndefined(rawLesson.contentText),
          resourceUrl: toStringOrUndefined(rawLesson.resourceUrl),
          youtubeUrl: toStringOrUndefined(rawLesson.youtubeUrl) || toStringOrUndefined(rawLesson.videoUrl),
          videoMediaId: typeof rawLesson.videoMediaId === 'number' ? rawLesson.videoMediaId : undefined,
          passScore: toPositiveNumberOrUndefined(rawLesson.passScore),
          quizTimeLimitMinutes: toPositiveNumberOrUndefined(rawLesson.quizTimeLimitMinutes),
          quizMaxAttempts: toPositiveNumberOrUndefined(rawLesson.quizMaxAttempts),
          roundingIncrement: toPositiveNumberOrUndefined(rawLesson.roundingIncrement),
          quizDescription: toStringOrUndefined(rawLesson.quizDescription),
          gradingMethod: toStringOrUndefined(rawLesson.gradingMethod),
          isAssessment: typeof rawLesson.isAssessment === 'boolean' ? rawLesson.isAssessment : undefined,
          cooldownHours: toPositiveNumberOrUndefined(rawLesson.cooldownHours),
          assignmentSubmissionType: parseSubmissionTypeFromSnapshot(
            rawLesson.assignmentSubmissionType ?? rawLesson.submissionType
          ),
          assignmentDescription: toStringOrUndefined(rawLesson.assignmentDescription),
          assignmentMaxScore: toPositiveNumberOrUndefined(rawLesson.assignmentMaxScore),
          assignmentPassingScore: toPositiveNumberOrUndefined(rawLesson.assignmentPassingScore),
          assignmentIsRequired:
            typeof rawLesson.assignmentIsRequired === 'boolean'
              ? rawLesson.assignmentIsRequired
              : (typeof rawLesson.isRequired === 'boolean' ? rawLesson.isRequired : undefined),
          questions: quizQuestions,
          assignmentCriteria,
          attachments: normalizeLessonAttachments(rawLesson.attachments as LessonAttachmentDraft[] | undefined)
        };
      })
    };
  });

const mergeSnapshotModulesWithFallback = (
  snapshotModules: ModuleDraft[],
  fallbackModules: ModuleDraft[]
): ModuleDraft[] => {
  if (snapshotModules.length === 0) {
    return fallbackModules;
  }

  const fallbackByModuleId = new Map<number, ModuleDraft>();
  const fallbackByModuleTitle = new Map<string, ModuleDraft>();

  fallbackModules.forEach((module) => {
    if (module.serverId) {
      fallbackByModuleId.set(module.serverId, module);
    }
    fallbackByModuleTitle.set(normalizeKey(module.title), module);
  });

  const merged: ModuleDraft[] = snapshotModules.map((snapshotModule) => {
    const fallbackModule =
      (snapshotModule.serverId ? fallbackByModuleId.get(snapshotModule.serverId) : undefined)
      || fallbackByModuleTitle.get(normalizeKey(snapshotModule.title));

    if (!fallbackModule) {
      return snapshotModule;
    }

    const fallbackByLessonId = new Map<number, { lesson: LessonDraft; index: number }>();
    const fallbackByTypeAndOrder = new Map<string, { lesson: LessonDraft; index: number }>();

    fallbackModule.lessons.forEach((lesson, index) => {
      if (lesson.serverId) {
        fallbackByLessonId.set(lesson.serverId, { lesson, index });
      }
      fallbackByTypeAndOrder.set(`${lesson.type}:${index}`, { lesson, index });
    });

    const mergedLessons = snapshotModule.lessons.map((snapshotLesson, index) => {
      const fallbackMatch =
        (snapshotLesson.serverId ? fallbackByLessonId.get(snapshotLesson.serverId) : undefined)
        || fallbackByTypeAndOrder.get(`${snapshotLesson.type}:${index}`);

      const fallbackLesson = fallbackMatch?.lesson;

      if (!fallbackLesson) {
        return snapshotLesson;
      }

      return {
        ...fallbackLesson,
        ...snapshotLesson,
        contentText: pickPreferredText(snapshotLesson.contentText, fallbackLesson.contentText),
        resourceUrl: snapshotLesson.resourceUrl || fallbackLesson.resourceUrl,
        youtubeUrl: snapshotLesson.youtubeUrl || fallbackLesson.youtubeUrl,
        videoMediaId: snapshotLesson.videoMediaId ?? fallbackLesson.videoMediaId,
        questions: (snapshotLesson.questions && snapshotLesson.questions.length > 0)
          ? snapshotLesson.questions
          : fallbackLesson.questions,
        assignmentCriteria: (snapshotLesson.assignmentCriteria && snapshotLesson.assignmentCriteria.length > 0)
          ? snapshotLesson.assignmentCriteria
          : fallbackLesson.assignmentCriteria,
        attachments: (snapshotLesson.attachments && snapshotLesson.attachments.length > 0)
          ? snapshotLesson.attachments
          : fallbackLesson.attachments,
      };
    });

    return {
      ...fallbackModule,
      ...snapshotModule,
      description: pickPreferredText(snapshotModule.description, fallbackModule.description) || '',
      // Snapshot is authoritative in revision mode: do not append unmatched fallback lessons.
      lessons: dedupeDraftLessons(mergedLessons)
    };
  });

  return merged;
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
      modules?: Array<Record<string, unknown>>;
    };

    if (!Array.isArray(parsed.modules)) {
      return [];
    }

    return parsed.modules.map((module, moduleIndex) => {
      const moduleId = `snapshot-module-${moduleIndex}-${createId()}`;
      const moduleServerId = toPositiveIntegerIdOrUndefined(module.id);
      const baseLessons = Array.isArray(module.lessons) ? module.lessons : [];
      const legacyItems = Array.isArray(module.items) ? module.items : [];
      const legacyQuizzes = Array.isArray(module.quizzes)
        ? module.quizzes.map((quizRaw) => ({
          ...(quizRaw as Record<string, unknown>),
          type: 'quiz',
          quizDescription: toStringOrUndefined((quizRaw as Record<string, unknown>).quizDescription)
            || toStringOrUndefined((quizRaw as Record<string, unknown>).description),
          quizTimeLimitMinutes:
            toPositiveNumberOrUndefined((quizRaw as Record<string, unknown>).quizTimeLimitMinutes)
            ?? toPositiveNumberOrUndefined((quizRaw as Record<string, unknown>).timeLimitMinutes),
          quizMaxAttempts:
            toPositiveNumberOrUndefined((quizRaw as Record<string, unknown>).quizMaxAttempts)
            ?? toPositiveNumberOrUndefined((quizRaw as Record<string, unknown>).maxAttempts),
        }))
        : [];
      const legacyAssignments = Array.isArray(module.assignments)
        ? module.assignments.map((assignmentRaw) => ({
          ...(assignmentRaw as Record<string, unknown>),
          type: 'assignment',
          assignmentDescription: toStringOrUndefined((assignmentRaw as Record<string, unknown>).assignmentDescription)
            || toStringOrUndefined((assignmentRaw as Record<string, unknown>).description),
          assignmentSubmissionType:
            (assignmentRaw as Record<string, unknown>).assignmentSubmissionType
            ?? (assignmentRaw as Record<string, unknown>).submissionType,
          assignmentMaxScore:
            toPositiveNumberOrUndefined((assignmentRaw as Record<string, unknown>).assignmentMaxScore)
            ?? toPositiveNumberOrUndefined((assignmentRaw as Record<string, unknown>).maxScore),
          assignmentPassingScore:
            toPositiveNumberOrUndefined((assignmentRaw as Record<string, unknown>).assignmentPassingScore)
            ?? toPositiveNumberOrUndefined((assignmentRaw as Record<string, unknown>).passingScore),
          assignmentCriteria:
            (assignmentRaw as Record<string, unknown>).assignmentCriteria
            ?? (assignmentRaw as Record<string, unknown>).criteria,
        }))
        : [];

      // Some older snapshots may contain both `lessons` and legacy `quizzes/assignments/items` arrays.
      // Merge all sources so revision editor does not silently drop quiz/assignment items.
      const combinedLessonSources = [...baseLessons, ...legacyItems, ...legacyQuizzes, ...legacyAssignments]
        .filter((lesson): lesson is Record<string, unknown> => typeof lesson === 'object' && lesson != null);

      const seenSnapshotItemKeys = new Set<string>();
      const lessonsSource = combinedLessonSources.filter((lesson, lessonIndex) => {
        const type = parseLessonKindFromSnapshot(lesson.type);
        const id = toPositiveIntegerIdOrUndefined(lesson.id);
        const orderIndex = toPositiveNumberOrUndefined(lesson.orderIndex) ?? lessonIndex;
        const title = normalizeKey(toStringOrUndefined(lesson.title) || '');
        const dedupeKey = id
          ? `${type}:${id}`
          : `${type}:${orderIndex}:${title}`;

        if (seenSnapshotItemKeys.has(dedupeKey)) {
          return false;
        }
        seenSnapshotItemKeys.add(dedupeKey);
        return true;
      });

      const lessons = lessonsSource
        .sort((a, b) => {
          const left = toPositiveNumberOrUndefined(a.orderIndex) ?? 0;
          const right = toPositiveNumberOrUndefined(b.orderIndex) ?? 0;
          return left - right;
        });

      return {
        id: moduleId,
        ...(moduleServerId ? { serverId: moduleServerId } : {}),
        title: typeof module.title === 'string' ? module.title : `Module ${moduleIndex + 1}`,
        description: typeof module.description === 'string' ? module.description : '',
        lessons: dedupeDraftLessons(lessons.map((lessonRaw, lessonIndex) => {
          const lessonId = `snapshot-lesson-${moduleIndex}-${lessonIndex}-${createId()}`;
          const lessonServerId = toPositiveIntegerIdOrUndefined(lessonRaw.id);
          const questionsRaw = Array.isArray(lessonRaw.questions) ? lessonRaw.questions : [];
          const criteriaRaw = Array.isArray(lessonRaw.assignmentCriteria)
            ? lessonRaw.assignmentCriteria
            : (Array.isArray((lessonRaw as Record<string, unknown>).criteria)
              ? ((lessonRaw as Record<string, unknown>).criteria as unknown[])
              : []);
          const attachmentsRaw = Array.isArray(lessonRaw.attachments) ? lessonRaw.attachments : [];

          const questions: QuizQuestionDraft[] = questionsRaw.map((questionRaw, questionIndex) => {
            const optionsRaw = Array.isArray(questionRaw.options) ? questionRaw.options : [];
            const questionServerId = toPositiveIntegerIdOrUndefined(questionRaw.id);
            return {
              id: `snapshot-q-${moduleIndex}-${lessonIndex}-${questionIndex}-${createId()}`,
              ...(questionServerId ? { serverId: questionServerId } : {}),
              text: typeof questionRaw.text === 'string' ? questionRaw.text : '',
              type: parseQuestionTypeFromSnapshot(questionRaw.type),
              score: toPositiveNumberOrUndefined(questionRaw.score) ?? 1,
              orderIndex: toPositiveNumberOrUndefined(questionRaw.orderIndex) ?? questionIndex,
              options: optionsRaw.map((optionRaw: Record<string, unknown>, optionIndex: number) => {
                const optionServerId = toPositiveIntegerIdOrUndefined(optionRaw.id);
                return {
                  id: `snapshot-opt-${moduleIndex}-${lessonIndex}-${questionIndex}-${optionIndex}-${createId()}`,
                  ...(optionServerId ? { serverId: optionServerId } : {}),
                  text: typeof optionRaw.text === 'string' ? optionRaw.text : '',
                  correct: Boolean(optionRaw.correct),
                  orderIndex: toPositiveNumberOrUndefined(optionRaw.orderIndex) ?? optionIndex
                };
              })
            };
          });

          const assignmentCriteria: AssignmentCriteriaDraft[] = criteriaRaw.map((criteriaRawItem, criteriaIndex) => {
            const criteriaId = toPositiveIntegerIdOrUndefined(criteriaRawItem.id);
            const maxPoints = toPositiveNumberOrUndefined(criteriaRawItem.maxPoints) ?? 0;
            return {
              clientId: `snapshot-criteria-${moduleIndex}-${lessonIndex}-${criteriaIndex}-${createId()}`,
              ...(criteriaId ? { id: criteriaId } : {}),
              name: typeof criteriaRawItem.name === 'string' ? criteriaRawItem.name : '',
              description: typeof criteriaRawItem.description === 'string' ? criteriaRawItem.description : '',
              maxPoints,
              passingPoints: toNonNegativeNumberOrUndefined(criteriaRawItem.passingPoints) ?? maxPoints,
              orderIndex: toPositiveNumberOrUndefined(criteriaRawItem.orderIndex) ?? criteriaIndex,
              isRequired: typeof criteriaRawItem.isRequired === 'boolean' ? criteriaRawItem.isRequired : true
            };
          });

          const attachments = normalizeLessonAttachments(
            attachmentsRaw.map((attachmentRaw, attachmentIndex) => {
              const attachmentServerId = toPositiveIntegerIdOrUndefined(attachmentRaw.id);
              return {
                id: `snapshot-attachment-${moduleIndex}-${lessonIndex}-${attachmentIndex}-${createId()}`,
                name: typeof attachmentRaw.name === 'string' ? attachmentRaw.name : 'Attachment',
                url: typeof attachmentRaw.url === 'string' ? attachmentRaw.url : undefined,
                mediaId: typeof attachmentRaw.mediaId === 'number' ? attachmentRaw.mediaId : undefined,
                ...(attachmentServerId ? { serverId: attachmentServerId } : {})
              };
            })
          );

          return {
            id: lessonId,
            ...(lessonServerId ? { serverId: lessonServerId } : {}),
            title: typeof lessonRaw.title === 'string' ? lessonRaw.title : `Bài học ${lessonIndex + 1}`,
            type: parseLessonKindFromSnapshot(lessonRaw.type),
            durationMin: toPositiveNumberOrUndefined(lessonRaw.durationMin),
            contentText:
              toStringOrUndefined(lessonRaw.contentText)
              || toStringOrUndefined(lessonRaw.content)
              || toStringOrUndefined(lessonRaw.description)
              || '',
            resourceUrl: toStringOrUndefined(lessonRaw.resourceUrl),
            youtubeUrl: toStringOrUndefined(lessonRaw.youtubeUrl) || toStringOrUndefined(lessonRaw.videoUrl),
            videoMediaId: typeof lessonRaw.videoMediaId === 'number' ? lessonRaw.videoMediaId : undefined,
            passScore: toPositiveNumberOrUndefined(lessonRaw.passScore),
            quizMaxAttempts: toPositiveNumberOrUndefined(lessonRaw.quizMaxAttempts),
            quizTimeLimitMinutes: toPositiveNumberOrUndefined(lessonRaw.quizTimeLimitMinutes),
            roundingIncrement: toPositiveNumberOrUndefined(lessonRaw.roundingIncrement),
            quizDescription: typeof lessonRaw.quizDescription === 'string' ? lessonRaw.quizDescription : undefined,
            gradingMethod: typeof lessonRaw.gradingMethod === 'string' ? lessonRaw.gradingMethod : undefined,
            isAssessment: typeof lessonRaw.isAssessment === 'boolean' ? lessonRaw.isAssessment : undefined,
            cooldownHours: toPositiveNumberOrUndefined(lessonRaw.cooldownHours),
            assignmentSubmissionType: parseSubmissionTypeFromSnapshot(
              lessonRaw.assignmentSubmissionType ?? lessonRaw.submissionType
            ),
            assignmentDescription:
              toStringOrUndefined(lessonRaw.assignmentDescription)
              || toStringOrUndefined(lessonRaw.description),
            assignmentMaxScore:
              toPositiveNumberOrUndefined(lessonRaw.assignmentMaxScore)
              ?? toPositiveNumberOrUndefined(lessonRaw.maxScore),
            assignmentPassingScore:
              toPositiveNumberOrUndefined(lessonRaw.assignmentPassingScore)
              ?? toPositiveNumberOrUndefined(lessonRaw.passingScore),
            assignmentIsRequired:
              typeof lessonRaw.isRequired === 'boolean'
                ? lessonRaw.isRequired
                : (typeof lessonRaw.required === 'boolean' ? lessonRaw.required : undefined),
            questions,
            assignmentCriteria,
            attachments
          };
        }))
      };
    });
  } catch (error) {
    console.error('Failed to parse revision content snapshot:', error);
    return [];
  }
};

type ChangeInfo = {
  isNew: boolean;
  changedFields: string[];
};

const normalizeComparableContent = (value?: string): string =>
  normalizeKey((value || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' '));

const normalizeStringList = (items?: string[]): string[] =>
  (items || [])
    .map((item) => normalizeKey(item))
    .filter((item) => item.length > 0);

const parseJsonStringArray = (raw?: string): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
};

const arraysEqualIgnoringOrder = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((item, index) => item === sortedRight[index]);
};

const findMatchingModule = (
  baselineModules: ModuleDraft[],
  module: ModuleDraft,
  moduleIndex: number
): ModuleDraft | undefined => {
  if (typeof module.serverId === 'number') {
    const byId = baselineModules.find((candidate) => candidate.serverId === module.serverId);
    if (byId) return byId;
  }
  if (baselineModules[moduleIndex]) {
    return baselineModules[moduleIndex];
  }
  return baselineModules.find((candidate) => normalizeKey(candidate.title) === normalizeKey(module.title));
};

const findMatchingLesson = (
  baselineLessons: LessonDraft[],
  lesson: LessonDraft,
  lessonIndex: number
): LessonDraft | undefined => {
  if (typeof lesson.serverId === 'number') {
    const byId = baselineLessons.find((candidate) => candidate.serverId === lesson.serverId);
    if (byId) return byId;
  }
  if (baselineLessons[lessonIndex]) {
    return baselineLessons[lessonIndex];
  }
  return baselineLessons.find(
    (candidate) =>
      candidate.type === lesson.type &&
      normalizeKey(candidate.title) === normalizeKey(lesson.title)
  );
};

const getModuleChangeInfo = (
  module: ModuleDraft,
  moduleIndex: number,
  baselineModules: ModuleDraft[]
): { info: ChangeInfo; baselineModule?: ModuleDraft } => {
  const baselineModule = findMatchingModule(baselineModules, module, moduleIndex);
  if (!baselineModule) {
    return {
      info: {
        isNew: true,
        changedFields: ['Module mới']
      }
    };
  }

  const changedFields: string[] = [];
  if (normalizeKey(module.title) !== normalizeKey(baselineModule.title)) {
    changedFields.push('Tên module');
  }
  if (normalizeComparableContent(module.description) !== normalizeComparableContent(baselineModule.description)) {
    changedFields.push('Mô tả module');
  }
  if ((module.lessons?.length || 0) !== (baselineModule.lessons?.length || 0)) {
    changedFields.push('Số lượng bài học');
  }

  return {
    info: {
      isNew: false,
      changedFields
    },
    baselineModule
  };
};

const getLessonChangeInfo = (
  lesson: LessonDraft,
  lessonIndex: number,
  baselineLessons: LessonDraft[]
): ChangeInfo => {
  const baselineLesson = findMatchingLesson(baselineLessons, lesson, lessonIndex);
  if (!baselineLesson) {
    return {
      isNew: true,
      changedFields: ['Bài học mới']
    };
  }

  const changedFields: string[] = [];
  if (lesson.type !== baselineLesson.type) {
    changedFields.push('Loại bài học');
  }
  if (normalizeKey(lesson.title) !== normalizeKey(baselineLesson.title)) {
    changedFields.push('Tiêu đề');
  }

  if (lesson.type === 'reading' || lesson.type === 'video') {
    if (normalizeComparableContent(lesson.contentText) !== normalizeComparableContent(baselineLesson.contentText)) {
      changedFields.push('Nội dung');
    }
    if (normalizeKey(lesson.resourceUrl) !== normalizeKey(baselineLesson.resourceUrl)) {
      changedFields.push('Tài liệu');
    }
    if (normalizeKey(lesson.youtubeUrl) !== normalizeKey(baselineLesson.youtubeUrl)) {
      changedFields.push('Video URL');
    }
  }

  if (lesson.type === 'quiz') {
    if (normalizeComparableContent(lesson.quizDescription) !== normalizeComparableContent(baselineLesson.quizDescription)) {
      changedFields.push('Mô tả quiz');
    }
    if ((lesson.passScore ?? null) !== (baselineLesson.passScore ?? null)) {
      changedFields.push('Điểm đạt');
    }
    if ((lesson.quizMaxAttempts ?? null) !== (baselineLesson.quizMaxAttempts ?? null)) {
      changedFields.push('Số lần làm');
    }
    if ((lesson.quizTimeLimitMinutes ?? null) !== (baselineLesson.quizTimeLimitMinutes ?? null)) {
      changedFields.push('Thời gian làm');
    }
    if ((lesson.questions?.length || 0) !== (baselineLesson.questions?.length || 0)) {
      changedFields.push('Số câu hỏi');
    }
  }

  if (lesson.type === 'assignment') {
    if (normalizeComparableContent(lesson.assignmentDescription) !== normalizeComparableContent(baselineLesson.assignmentDescription)) {
      changedFields.push('Mô tả bài tập');
    }
    if ((lesson.assignmentSubmissionType || '') !== (baselineLesson.assignmentSubmissionType || '')) {
      changedFields.push('Hình thức nộp');
    }
    if ((lesson.assignmentMaxScore ?? null) !== (baselineLesson.assignmentMaxScore ?? null)) {
      changedFields.push('Điểm tối đa');
    }
    if ((lesson.assignmentPassingScore ?? null) !== (baselineLesson.assignmentPassingScore ?? null)) {
      changedFields.push('Điểm đạt');
    }
    if ((lesson.assignmentCriteria?.length || 0) !== (baselineLesson.assignmentCriteria?.length || 0)) {
      changedFields.push('Tiêu chí chấm');
    }
  }

  return {
    isNew: false,
    changedFields
  };
};

const getCourseInfoChangedFields = (
  courseForm: {
    title?: string;
    summary?: string;
    description?: string;
    category?: string;
    level?: string;
    price?: number;
    estimatedDuration?: number;
  },
  learningObjectives: string[],
  requirements: string[],
  baselineRevision: CourseRevisionDTO | null
): string[] => {
  if (!baselineRevision) return [];

  const changedFields: string[] = [];

  if (normalizeKey(courseForm.title) !== normalizeKey(baselineRevision.title)) {
    changedFields.push('Tên khóa học');
  }
  if (normalizeComparableContent(courseForm.summary) !== normalizeComparableContent(baselineRevision.shortDescription)) {
    changedFields.push('Mô tả ngắn');
  }
  if (normalizeComparableContent(courseForm.description) !== normalizeComparableContent(baselineRevision.description)) {
    changedFields.push('Mô tả chi tiết');
  }
  if (normalizeKey(courseForm.category) !== normalizeKey(baselineRevision.category)) {
    changedFields.push('Danh mục');
  }
  if (normalizeKey(courseForm.level) !== normalizeKey(baselineRevision.level)) {
    changedFields.push('Độ khó');
  }
  if ((courseForm.price ?? null) !== (baselineRevision.price ?? null)) {
    changedFields.push('Giá');
  }
  if ((courseForm.estimatedDuration ?? null) !== (baselineRevision.estimatedDurationHours ?? null)) {
    changedFields.push('Thời lượng');
  }

  const baselineObjectives = normalizeStringList(parseJsonStringArray(baselineRevision.learningObjectivesJson));
  const baselineRequirements = normalizeStringList(parseJsonStringArray(baselineRevision.requirementsJson));
  const currentObjectives = normalizeStringList(learningObjectives);
  const currentRequirements = normalizeStringList(requirements);

  if (!arraysEqualIgnoringOrder(currentObjectives, baselineObjectives)) {
    changedFields.push('Mục tiêu khóa học');
  }
  if (!arraysEqualIgnoringOrder(currentRequirements, baselineRequirements)) {
    changedFields.push('Yêu cầu đầu vào');
  }

  return changedFields;
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
  const [baselineRevision, setBaselineRevision] = useState<CourseRevisionDTO | null>(null);
  const [baselineSnapshotModules, setBaselineSnapshotModules] = useState<ModuleDraft[]>([]);
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
  const changedCourseInfoFields = getCourseInfoChangedFields(
    {
      title: courseForm.title,
      summary: courseForm.summary,
      description: courseForm.description,
      category: courseForm.category,
      level: courseForm.level,
      price: courseForm.price,
      estimatedDuration: courseForm.estimatedDuration
    },
    learningObjectives,
    requirements,
    baselineRevision
  );
  
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
    const flowState = parseBuilderFlowState(params);

    if (!flowState) {
      return;
    }

    if (flowState === 'submitted') {
      showToast('success', 'Đã gửi khóa học tới quản trị viên để xét duyệt.');
    } else if (flowState === 'revisionCreated') {
      showToast('success', 'Đã tạo phiên bản mới. Bạn có thể chỉnh sửa rồi gửi duyệt phiên bản.');
    } else if (flowState === 'revisionSubmitted') {
      showToast('success', 'Đã gửi phiên bản tới quản trị viên để xét duyệt.');
    }

    params.delete(COURSE_BUILDER_FLOW_PARAM);
    params.delete('submitted');
    params.delete('revisionCreated');
    params.delete('revisionSubmitted');

    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : ''
      },
      { replace: true }
    );
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
    if (!isEditMode || !courseId || isRevisionMode) {
      return;
    }
    if (state.currentCourse?.status !== CourseStatus.PUBLIC) {
      return;
    }
    if (revisionHistory.length === 0) {
      return;
    }

    const preferredRevision =
      revisionHistory.find((revision) => revision.status === 'APPROVED') ?? revisionHistory[0];

    if (!preferredRevision?.id) {
      return;
    }

    navigate(`/mentor/courses/${courseId}/edit?revisionId=${preferredRevision.id}`, { replace: true });
  }, [
    courseId,
    isEditMode,
    isRevisionMode,
    navigate,
    revisionHistory,
    state.currentCourse?.status
  ]);

  useEffect(() => {
    if (!isRevisionMode || !revisionId) {
      setActiveRevision(null);
      setBaselineRevision(null);
      setBaselineSnapshotModules([]);
      return;
    }

    const loadRevision = async () => {
      try {
        setIsRevisionLoading(true);
        const revision = await getCourseRevision(revisionId);
        setActiveRevision(revision);

        const sourceRevisionId = typeof revision.sourceRevisionId === 'number' ? revision.sourceRevisionId : null;
        if (sourceRevisionId && sourceRevisionId > 0 && sourceRevisionId !== revision.id) {
          try {
            const sourceRevision = await getCourseRevision(sourceRevisionId);
            setBaselineRevision(sourceRevision);
            setBaselineSnapshotModules(parseModulesFromRevisionSnapshot(sourceRevision.contentSnapshotJson));
          } catch {
            setBaselineRevision(null);
            setBaselineSnapshotModules([]);
          }
        } else {
          setBaselineRevision(null);
          setBaselineSnapshotModules([]);
        }

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
        const fallbackModules = mapCourseModulesToDraftModules(state.modules as Array<Record<string, unknown>>);
        const mergedModules = mergeSnapshotModulesWithFallback(snapshotModules, fallbackModules);

        if (mergedModules.length > 0) {
          setModules(mergedModules);
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
      const mappedModules = mapCourseModulesToDraftModules(state.modules as Array<Record<string, unknown>>);
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

  // In revision mode, context modules may arrive after revision snapshot is parsed.
  // Reconcile once context modules are ready to avoid missing lesson-like items.
  useEffect(() => {
    if (!isRevisionMode || !activeRevision || isRevisionLoading) {
      return;
    }
    if (!Array.isArray(state.modules) || state.modules.length === 0) {
      return;
    }

    const snapshotModules = parseModulesFromRevisionSnapshot(activeRevision.contentSnapshotJson);
    if (snapshotModules.length === 0) {
      return;
    }

    const fallbackModules = mapCourseModulesToDraftModules(state.modules as Array<Record<string, unknown>>);
    const reconciledModules = mergeSnapshotModulesWithFallback(snapshotModules, fallbackModules);
    if (reconciledModules.length === 0) {
      return;
    }

    const countLessonLikeItems = (moduleList: ModuleDraft[]): number =>
      moduleList.reduce((total, module) => total + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0);

    const currentCount = countLessonLikeItems(modules);
    const reconciledCount = countLessonLikeItems(reconciledModules);

    if (reconciledCount > currentCount) {
      setModules(reconciledModules);
      setAssignmentErrors({});
    }
  }, [activeRevision, isRevisionLoading, isRevisionMode, modules, state.modules]);

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
        buildCourseEditUrl(state.currentCourse.id, {
          revisionId: createdRevision.id,
          flow: 'revisionCreated'
        }),
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

  const hasConfiguredTypeSpecificData = (lesson: LessonDraft): boolean => {
    if (lesson.type === 'quiz') {
      return Boolean(
        (lesson.questions && lesson.questions.length > 0)
        || (lesson.quizDescription && lesson.quizDescription.trim().length > 0)
        || lesson.passScore !== undefined
        || lesson.quizMaxAttempts !== undefined
        || lesson.quizTimeLimitMinutes !== undefined
      );
    }

    if (lesson.type === 'video') {
      return Boolean(
        (lesson.youtubeUrl && lesson.youtubeUrl.trim().length > 0)
        || (typeof lesson.videoMediaId === 'number' && lesson.videoMediaId > 0)
      );
    }

    if (lesson.type === 'assignment') {
      return Boolean(
        (lesson.assignmentDescription && lesson.assignmentDescription.trim().length > 0)
        || (lesson.assignmentCriteria && lesson.assignmentCriteria.length > 0)
        || lesson.assignmentMaxScore !== undefined
        || lesson.assignmentPassingScore !== undefined
      );
    }

    return Boolean(
      (lesson.contentText && lesson.contentText.trim().length > 0)
      || (lesson.resourceUrl && lesson.resourceUrl.trim().length > 0)
      || (lesson.attachments && lesson.attachments.length > 0)
    );
  };

  const buildTypeSwitchPayload = (
    lesson: LessonDraft,
    nextType: LessonKind
  ): Partial<LessonDraft> => {
    const base: Partial<LessonDraft> = {
      type: nextType,
      contentText: undefined,
      resourceUrl: undefined,
      attachments: [],
      youtubeUrl: undefined,
      videoMediaId: undefined,
      passScore: undefined,
      quizTimeLimitMinutes: undefined,
      quizMaxAttempts: undefined,
      quizDescription: undefined,
      roundingIncrement: undefined,
      gradingMethod: undefined,
      isAssessment: undefined,
      cooldownHours: undefined,
      questions: [],
      assignmentSubmissionType: undefined,
      assignmentDescription: undefined,
      assignmentMaxScore: undefined,
      assignmentPassingScore: undefined,
      assignmentIsRequired: undefined,
      assignmentCriteria: []
    };

    if (nextType === 'reading') {
      return {
        ...base,
        contentText: lesson.type === 'reading' ? (lesson.contentText || '') : ''
      };
    }

    if (nextType === 'video') {
      return {
        ...base,
        youtubeUrl: lesson.type === 'video' ? lesson.youtubeUrl : undefined,
        videoMediaId: lesson.type === 'video' ? lesson.videoMediaId : undefined
      };
    }

    if (nextType === 'quiz') {
      return {
        ...base,
        quizDescription: lesson.type === 'quiz' ? lesson.quizDescription : undefined,
        passScore: lesson.type === 'quiz' ? lesson.passScore : 80,
        quizMaxAttempts: lesson.type === 'quiz' ? lesson.quizMaxAttempts : undefined,
        quizTimeLimitMinutes: lesson.type === 'quiz' ? lesson.quizTimeLimitMinutes : undefined,
        roundingIncrement: lesson.type === 'quiz' ? lesson.roundingIncrement : undefined,
        gradingMethod: lesson.type === 'quiz' ? lesson.gradingMethod : undefined,
        isAssessment: lesson.type === 'quiz' ? lesson.isAssessment : undefined,
        cooldownHours: lesson.type === 'quiz' ? lesson.cooldownHours : undefined,
        questions: lesson.type === 'quiz' ? (lesson.questions || []) : []
      };
    }

    return {
      ...base,
      assignmentSubmissionType: lesson.type === 'assignment'
        ? (lesson.assignmentSubmissionType || SubmissionType.TEXT)
        : SubmissionType.TEXT,
      assignmentDescription: lesson.type === 'assignment' ? lesson.assignmentDescription : undefined,
      assignmentMaxScore: lesson.type === 'assignment' ? (lesson.assignmentMaxScore ?? 100) : 100,
      assignmentPassingScore: lesson.type === 'assignment' ? (lesson.assignmentPassingScore ?? 50) : 50,
      assignmentIsRequired: lesson.type === 'assignment' ? lesson.assignmentIsRequired : undefined,
      assignmentCriteria: lesson.type === 'assignment' ? (lesson.assignmentCriteria || []) : []
    };
  };

  const handleLessonTypeSwitch = (
    moduleId: string,
    lesson: LessonDraft,
    nextType: LessonKind
  ) => {
    if (lesson.type === nextType) {
      return;
    }

    const applySwitch = () => {
      const payload = buildTypeSwitchPayload(lesson, nextType);
      updateLessonField(moduleId, lesson.id, payload);
    };

    if (hasConfiguredTypeSpecificData(lesson)) {
      setConfirmDialog({
        title: 'Đổi loại bài học',
        message: 'Đổi loại sẽ xóa cấu hình chi tiết của loại hiện tại. Bạn có chắc chắn?',
        confirmLabel: 'Đổi loại',
        onConfirm: applySwitch
      });
      return;
    }

    applySwitch();
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
      logCourseDraftOrderDebug('before-save current modules', modules);

      if (isRevisionMode && activeRevision) {
        const normalizedSnapshotPayload = normalizeRevisionSnapshotPayload(buildRevisionContentSnapshot(modules));
        logCourseDraftOrderDebug('revision snapshot modules before updateRevision', normalizedSnapshotPayload.modules as ModuleDraft[]);
        const snapshotValidationError = validateRevisionSnapshotPayload(normalizedSnapshotPayload);
        if (snapshotValidationError) {
          showToast('error', snapshotValidationError);
          return null;
        }

        const contentSnapshotJson = JSON.stringify(normalizedSnapshotPayload);
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

      logCourseDraftOrderDebug('after-save API response modules', (savedCourse.modules || []) as unknown as ModuleDraft[]);

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
              roundingIncrement: lesson.roundingIncrement,
              quizDescription: lesson.quizDescription,
              gradingMethod: lesson.gradingMethod,
              isAssessment: lesson.isAssessment,
              cooldownHours: lesson.cooldownHours,
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
              assignmentIsRequired: lesson.assignmentIsRequired,
              assignmentCriteria: lesson.assignmentCriteria,
              attachments: normalizeLessonAttachments(lesson.attachments)
            };
          })
        };
      });

      logCourseDraftOrderDebug('after-save mapped modules in builder', mappedModules);

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
      const identityMessage = mapRevisionSnapshotIdentityErrorToVietnameseMessage(message);
      if (identityMessage) {
        showToast('error', identityMessage);
      } else if (message.includes('COURSE_REVISION_CONTENT_SNAPSHOT_TOO_LARGE')) {
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
        navigate(
          buildCourseEditUrl(savedCourse.id, {
            revisionId: submittedRevision.id,
            flow: 'revisionSubmitted'
          }),
          { replace: true }
        );
        return;
      }

      showToast('info', 'Đang gửi khóa học tới quản trị viên để xét duyệt.');
      const submittedCourse = await submitCourseForApproval(savedCourse.id, user.id);
      if (isEditMode) {
        await loadCourseForEdit(submittedCourse.id.toString());
      }
      navigate(buildCourseEditUrl(submittedCourse.id, { flow: 'submitted' }), { replace: true });
    } catch (error) {
      const apiErrorMessage = getApiErrorMessage(error);
      const identityMessage = mapRevisionSnapshotIdentityErrorToVietnameseMessage(apiErrorMessage);
      if (identityMessage) {
        showToast('error', identityMessage);
      } else if (apiErrorMessage.includes('COURSE_REVISION_NO_CHANGES_TO_SUBMIT')) {
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
            {(() => {
              const moduleDiff = getModuleChangeInfo(module, index, baselineSnapshotModules);
              const hasModuleChanges = moduleDiff.info.isNew || moduleDiff.info.changedFields.length > 0;
              return (
            <div 
              className={`cb-sidebar__item ${activeView.type === 'module' && activeView.moduleId === module.id ? 'is-active' : ''}`}
              onClick={() => setActiveView({ type: 'module', moduleId: module.id })}
            >
              <div className="cb-sidebar__item-label">
                <FiList /> 
                <span style={{ fontWeight: 500 }}>{index + 1}. {module.title || '(Chưa có tiêu đề)'}</span>
                {isRevisionMode && hasModuleChanges && (
                  <span
                    className="cb-sidebar__lesson-badge"
                    style={{ marginLeft: 8, backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.35)' }}
                    title={moduleDiff.info.changedFields.length > 0 ? `Đã thay đổi: ${moduleDiff.info.changedFields.join(', ')}` : 'Module mới tạo'}
                  >
                    {moduleDiff.info.isNew ? 'Mới' : 'Đã đổi'}
                  </span>
                )}
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
              );
            })()}

            {!collapsedModules[module.id] && (
              <div className="cb-sidebar__sub-list">
                {module.lessons.map((lesson, lIndex) => {
                  const meta = getLessonTypeMeta(lesson.type);
                  const baselineModule = findMatchingModule(baselineSnapshotModules, module, index);
                  const lessonDiff = getLessonChangeInfo(lesson, lIndex, baselineModule?.lessons || []);
                  const hasLessonChanges = lessonDiff.isNew || lessonDiff.changedFields.length > 0;

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
                          {isRevisionMode && hasLessonChanges && (
                            <span
                              className="cb-sidebar__lesson-badge"
                              style={{ marginLeft: 6, backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.35)' }}
                              title={lessonDiff.changedFields.length > 0 ? `Đã thay đổi: ${lessonDiff.changedFields.join(', ')}` : 'Bài học mới tạo'}
                            >
                              {lessonDiff.isNew ? 'Mới' : 'Đã đổi'}
                            </span>
                          )}
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
              {isRevisionMode && changedCourseInfoFields.length > 0 && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: '10px 12px',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    borderRadius: 8,
                    color: '#f5c36a',
                    fontSize: '0.9rem'
                  }}
                >
                  <strong>Đang có thay đổi so với phiên bản gốc:</strong> {changedCourseInfoFields.join(', ')}
                </div>
              )}
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
      const moduleIndex = modules.findIndex((m) => m.id === module.id);
      const moduleDiff = moduleIndex >= 0 ? getModuleChangeInfo(module, moduleIndex, baselineSnapshotModules) : null;
      const moduleChangedFields = moduleDiff?.info.changedFields || [];
      const isNewModule = Boolean(moduleDiff?.info.isNew);
      return (
         <div className="cb-main-content">
            <div className="cb-panel">
               <div className="cb-panel__header">
                  <div className="cb-panel__title">
                    Chỉnh sửa Module
                    {isRevisionMode && (isNewModule || moduleChangedFields.length > 0) && (
                      <span
                        className="cb-sidebar__lesson-badge"
                        style={{ marginLeft: 10, backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.35)' }}
                        title={moduleChangedFields.length > 0 ? `Đã thay đổi: ${moduleChangedFields.join(', ')}` : 'Module mới tạo'}
                      >
                        {isNewModule ? 'Mới' : 'Đã đổi'}
                      </span>
                    )}
                  </div>
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
      const moduleIndex = modules.findIndex((m) => m.id === module.id);
      const lessonIndex = module.lessons.findIndex((l) => l.id === lesson.id);
      const baselineModule = moduleIndex >= 0 ? findMatchingModule(baselineSnapshotModules, module, moduleIndex) : undefined;
      const lessonDiff = lessonIndex >= 0 ? getLessonChangeInfo(lesson, lessonIndex, baselineModule?.lessons || []) : { isNew: false, changedFields: [] };
      const hasLessonChanges = lessonDiff.isNew || lessonDiff.changedFields.length > 0;

      return (
        <div className="cb-main-content">
           <div className="cb-panel">
              <div className="cb-panel__header">
                 <div className="cb-panel__title">
                    {lesson.type === 'quiz' && <FiHelpCircle />}
                    {lesson.type === 'video' && <FiPlay />}
                    {lesson.type === 'reading' && <FiFileText />}
                    <span style={{ marginLeft: 8 }}>{lesson.title}</span>
                    {isRevisionMode && hasLessonChanges && (
                      <span
                        className="cb-sidebar__lesson-badge"
                        style={{ marginLeft: 10, backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.35)' }}
                        title={lessonDiff.changedFields.length > 0 ? `Đã thay đổi: ${lessonDiff.changedFields.join(', ')}` : 'Bài học mới tạo'}
                      >
                        {lessonDiff.isNew ? 'Mới' : 'Đã đổi'}
                      </span>
                    )}
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
                            onClick={() => handleLessonTypeSwitch(module.id, lesson, type.value as LessonKind)}
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
        <div className="cb-confirm-overlay">
          <div className="cb-confirm-modal" role="dialog" aria-modal="true">
            <h3 className="cb-confirm-modal__title">{confirmDialog.title}</h3>
            <p className="cb-confirm-modal__message">{confirmDialog.message}</p>
            <div className="cb-confirm-modal__actions">
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
