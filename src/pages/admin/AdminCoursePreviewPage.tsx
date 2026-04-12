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
  CheckSquare, AlertTriangle, AlertCircle, PenTool, Paperclip, Download, ExternalLink
} from 'lucide-react';
import {
  getCourse,
  getCourseRevision,
  getLatestApprovedRevision,
  approveCourse,
  rejectCourse,
  suspendCourse,
  restoreCourse,
  CourseRevisionDTO
} from '../../services/courseService';
import { listModulesWithContent, ModuleDetailDTO } from '../../services/moduleService';
import { getLessonById } from '../../services/lessonService';
import { getQuizById } from '../../services/quizService';
import { getAssignmentById } from '../../services/assignmentService';
import { LessonAttachmentDTO, listAttachments } from '../../services/attachmentService';
import { downloadFile } from '../../utils/downloadFile';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { LessonDetailDTO, LessonType } from '../../data/lessonDTOs';
import { CourseDetailDTO, CourseStatus } from '../../data/courseDTOs';
import { QuizDetailDTO, QuizOptionDTO, QuizQuestionDetailDTO, QuestionType } from '../../data/quizDTOs';
import { AssignmentDetailDTO, SubmissionType } from '../../data/assignmentDTOs';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import { NeuralCard } from '../../components/learning-hud';
import Toast from '../../components/shared/Toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AdminCoursePreviewPage.css';

// ==================== SUB-COMPONENTS ====================

type ModuleLessonSummary = NonNullable<ModuleDetailDTO['lessons']>[number];
type ModuleQuizSummary = NonNullable<ModuleDetailDTO['quizzes']>[number];
type ModuleAssignmentSummary = NonNullable<ModuleDetailDTO['assignments']>[number];

type LessonPreviewSummary = ModuleLessonSummary & {
  sourceEntityId?: number;
  attachments?: LessonAttachmentDTO[];
};

type QuizPreviewSummary = ModuleQuizSummary & {
  sourceEntityId?: number;
  questions?: QuizQuestionDetailDTO[];
};

type AssignmentPreviewSummary = ModuleAssignmentSummary & {
  sourceEntityId?: number;
  passingScore?: number;
  isRequired?: boolean;
  learningOutcome?: string;
  gradingCriteria?: string;
  criteria?: AssignmentDetailDTO['criteria'];
};

type ModulePreviewItem =
  | {
      kind: 'lesson';
      id: number;
      sourceEntityId?: number;
      title: string;
      orderIndex: number;
      lessonType: string;
      durationSec?: number;
      lessonPreview?: LessonPreviewSummary;
    }
  | {
      kind: 'assignment';
      id: number;
      sourceEntityId?: number;
      title: string;
      orderIndex: number;
      description?: string;
      maxScore?: number;
      assignmentPreview?: AssignmentPreviewSummary;
    }
  | {
      kind: 'quiz';
      id: number;
      sourceEntityId?: number;
      title: string;
      orderIndex: number;
      passScore: number;
      questionCount?: number;
      quizPreview?: QuizPreviewSummary;
    };

const previewKindPriority: Record<ModulePreviewItem['kind'], number> = {
  lesson: 0,
  assignment: 1,
  quiz: 2
};

const snapshotItemPriority: Record<'LESSON' | 'ASSIGNMENT' | 'QUIZ', number> = {
  LESSON: 0,
  ASSIGNMENT: 1,
  QUIZ: 2
};

const isPositiveEntityId = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const toRecordArray = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isRecord);
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toIntegerOrDefault = (value: unknown, fallback: number): number => {
  const parsed = toNumberOrNull(value);
  if (parsed === null) {
    return fallback;
  }
  return Math.trunc(parsed);
};

const toStringOrUndefined = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined;
};

const toNonBlankStringOrUndefined = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const toBooleanOrUndefined = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
};

const toPositiveNumberOrDefault = (value: unknown, fallback: number) => {
  const parsed = toNumberOrNull(value);
  if (parsed === null || parsed < 0) {
    return fallback;
  }
  return Math.trunc(parsed);
};

const toPositiveEntityId = (value: unknown): number | undefined => {
  const parsed = toNumberOrNull(value);
  if (parsed === null || parsed <= 0) {
    return undefined;
  }
  return Math.trunc(parsed);
};

const normalizeContent = (raw: string): string => {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<strong>(.*?)<\/strong>/gis, '**$1**')
    .replace(/<em>(.*?)<\/em>/gis, '*$1*')
    .replace(/<b>(.*?)<\/b>/gis, '**$1**')
    .replace(/<i>(.*?)<\/i>/gis, '*$1*')
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gis, '#### $1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const snapshotAttachmentType = (value: unknown): LessonAttachmentDTO['type'] => {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    const supported = [
      'PDF',
      'DOCX',
      'PPTX',
      'XLSX',
      'EXTERNAL_LINK',
      'GOOGLE_DRIVE',
      'GITHUB',
      'YOUTUBE',
      'WEBSITE'
    ];
    if (supported.includes(normalized)) {
      return normalized as LessonAttachmentDTO['type'];
    }
  }
  return 'EXTERNAL_LINK' as LessonAttachmentDTO['type'];
};

const snapshotSubmissionType = (value: unknown): SubmissionType => {
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (upper === SubmissionType.FILE) return SubmissionType.FILE;
    if (upper === SubmissionType.LINK) return SubmissionType.LINK;
    if (upper === SubmissionType.TEXT) return SubmissionType.TEXT;
  }
  return SubmissionType.TEXT;
};

const snapshotQuestionType = (value: unknown): QuestionType => {
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase();
    if (upper === QuestionType.MULTIPLE_CHOICE) return QuestionType.MULTIPLE_CHOICE;
    if (upper === QuestionType.TRUE_FALSE) return QuestionType.TRUE_FALSE;
    if (upper === QuestionType.SHORT_ANSWER) return QuestionType.SHORT_ANSWER;
    if (upper === 'MULTIPLE-CHOICE') return QuestionType.MULTIPLE_CHOICE;
    if (upper === 'TRUE/FALSE') return QuestionType.TRUE_FALSE;
  }
  return QuestionType.MULTIPLE_CHOICE;
};

const snapshotLessonType = (itemRaw: Record<string, unknown>): LessonType => {
  const itemType = toNonBlankStringOrUndefined(itemRaw.type)?.toUpperCase()
    ?? toNonBlankStringOrUndefined(itemRaw.lessonType)?.toUpperCase();
  if (itemType === 'VIDEO') return LessonType.VIDEO;
  if (itemType === 'CODELAB') return LessonType.CODELAB;
  return LessonType.READING;
};

const snapshotItemType = (itemRaw: Record<string, unknown>): 'LESSON' | 'ASSIGNMENT' | 'QUIZ' => {
  const rawType = toNonBlankStringOrUndefined(itemRaw.type)?.toUpperCase()
    ?? toNonBlankStringOrUndefined(itemRaw.itemType)?.toUpperCase();
  if (rawType === 'QUIZ') return 'QUIZ';
  if (rawType === 'ASSIGNMENT') return 'ASSIGNMENT';
  return 'LESSON';
};

const parseSnapshotAttachments = (value: unknown): LessonAttachmentDTO[] => {
  const attachmentRawList = toRecordArray(value);
  return attachmentRawList.map((attachmentRaw, index) => ({
    id: toPositiveEntityId(attachmentRaw.id) ?? -1 * (index + 1),
    title: toNonBlankStringOrUndefined(attachmentRaw.title)
      ?? toNonBlankStringOrUndefined(attachmentRaw.name)
      ?? `Tài liệu ${index + 1}`,
    description: toStringOrUndefined(attachmentRaw.description),
    downloadUrl: toStringOrUndefined(attachmentRaw.downloadUrl)
      ?? toStringOrUndefined(attachmentRaw.url)
      ?? toStringOrUndefined(attachmentRaw.externalUrl)
      ?? '',
    type: snapshotAttachmentType(attachmentRaw.type),
    fileSize: toNumberOrNull(attachmentRaw.fileSize) ?? undefined,
    fileSizeFormatted: toStringOrUndefined(attachmentRaw.fileSizeFormatted),
    orderIndex: toIntegerOrDefault(attachmentRaw.orderIndex, index),
    createdAt: toStringOrUndefined(attachmentRaw.createdAt) ?? ''
  }));
};

const parseSnapshotQuestions = (value: unknown): QuizQuestionDetailDTO[] => {
  const questionRawList = toRecordArray(value);
  return questionRawList
    .map((questionRaw, questionIndex) => {
      const optionsRaw = toRecordArray(questionRaw.options);
      const options: QuizOptionDTO[] = optionsRaw
        .map((optionRaw, optionIndex) => ({
          id: toPositiveEntityId(optionRaw.id) ?? -1 * ((questionIndex + 1) * 100 + optionIndex + 1),
          optionText: toNonBlankStringOrUndefined(optionRaw.optionText)
            ?? toNonBlankStringOrUndefined(optionRaw.text)
            ?? `Lựa chọn ${optionIndex + 1}`,
          correct: Boolean(optionRaw.correct ?? optionRaw.isCorrect),
          orderIndex: toPositiveNumberOrDefault(optionRaw.orderIndex, optionIndex)
        }))
        .sort((a, b) => a.orderIndex - b.orderIndex);

      return {
        id: toPositiveEntityId(questionRaw.id) ?? -1 * (questionIndex + 1),
        questionText: toNonBlankStringOrUndefined(questionRaw.questionText)
          ?? toNonBlankStringOrUndefined(questionRaw.text)
          ?? `Câu hỏi ${questionIndex + 1}`,
        questionType: snapshotQuestionType(questionRaw.questionType ?? questionRaw.type),
        score: toPositiveNumberOrDefault(questionRaw.score, 0),
        orderIndex: toPositiveNumberOrDefault(questionRaw.orderIndex, questionIndex),
        options,
        correctOptionCount: options.filter(option => option.correct).length
      };
    })
    .sort((a, b) => a.orderIndex - b.orderIndex);
};

const parseSnapshotCriteria = (value: unknown): AssignmentDetailDTO['criteria'] => {
  const criteriaRawList = toRecordArray(value);
  const criteria = criteriaRawList
    .map((criteriaRaw, criteriaIndex) => ({
      id: toPositiveEntityId(criteriaRaw.id),
      name: toNonBlankStringOrUndefined(criteriaRaw.name) ?? `Tiêu chí ${criteriaIndex + 1}`,
      description: toStringOrUndefined(criteriaRaw.description) ?? '',
      maxPoints: toPositiveNumberOrDefault(criteriaRaw.maxPoints, 0),
      passingPoints: toNumberOrNull(criteriaRaw.passingPoints) ?? undefined,
      orderIndex: toPositiveNumberOrDefault(criteriaRaw.orderIndex, criteriaIndex),
      isRequired: Boolean(criteriaRaw.isRequired)
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return criteria.length > 0 ? criteria : undefined;
};

const extractSnapshotModuleItems = (moduleRaw: Record<string, unknown>): Record<string, unknown>[] => {
  const lessons = toRecordArray(moduleRaw.lessons);
  const legacyItems = toRecordArray(moduleRaw.items);
  const primaryItems = lessons.length > 0 ? lessons : legacyItems;

  const standaloneQuizzes = toRecordArray(moduleRaw.quizzes).map((quizRaw) => ({
    ...quizRaw,
    type: toNonBlankStringOrUndefined(quizRaw.type) ?? 'QUIZ'
  }));

  const standaloneAssignments = toRecordArray(moduleRaw.assignments).map((assignmentRaw) => ({
    ...assignmentRaw,
    type: toNonBlankStringOrUndefined(assignmentRaw.type) ?? 'ASSIGNMENT'
  }));

  return [...primaryItems, ...standaloneQuizzes, ...standaloneAssignments];
};

const getModulePreviewItems = (module: ModuleDetailDTO): ModulePreviewItem[] => {
  const lessonItems: ModulePreviewItem[] = (module.lessons || []).map((lesson) => {
    const lessonPreview = lesson as LessonPreviewSummary;
    return {
    kind: 'lesson',
    id: lesson.id,
    sourceEntityId: lessonPreview.sourceEntityId ?? (isPositiveEntityId(lesson.id) ? lesson.id : undefined),
    title: lesson.title,
    orderIndex: lesson.orderIndex ?? 0,
    lessonType: lesson.type,
      durationSec: lesson.durationSec,
      lessonPreview
    };
  });

  const assignmentItems: ModulePreviewItem[] = (module.assignments || []).map((assignment) => {
    const assignmentPreview = assignment as AssignmentPreviewSummary;
    return {
    kind: 'assignment',
    id: assignment.id,
    sourceEntityId: assignmentPreview.sourceEntityId ?? (isPositiveEntityId(assignment.id) ? assignment.id : undefined),
    title: assignment.title,
    orderIndex: assignment.orderIndex ?? 0,
    description: assignment.description,
      maxScore: assignment.maxScore,
      assignmentPreview
    };
  });

  const quizItems: ModulePreviewItem[] = (module.quizzes || []).map((quiz) => {
    const quizPreview = quiz as QuizPreviewSummary;
    return {
    kind: 'quiz',
    id: quiz.id,
    sourceEntityId: quizPreview.sourceEntityId ?? (isPositiveEntityId(quiz.id) ? quiz.id : undefined),
    title: quiz.title,
    orderIndex: quiz.orderIndex ?? 0,
    passScore: quiz.passScore,
      questionCount: quiz.questionCount,
      quizPreview
    };
  });

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

const parseModulesFromRevisionSnapshot = (
  contentSnapshotJson: string | undefined,
  courseId: number
): ModuleDetailDTO[] => {
  if (!contentSnapshotJson) return [];

  try {
    const parsed = JSON.parse(contentSnapshotJson) as { modules?: unknown[] };

    if (!Array.isArray(parsed.modules)) {
      return [];
    }

    return parsed.modules
      .map((moduleNode, moduleIndex) => {
        if (!isRecord(moduleNode)) {
          return null;
        }

        const moduleId = toPositiveEntityId(moduleNode.id) ?? -1 * (moduleIndex + 1);
        const moduleTitle = toNonBlankStringOrUndefined(moduleNode.title) ?? `Module ${moduleIndex + 1}`;
        const moduleDescription = toStringOrUndefined(moduleNode.description) ?? '';
        const lessons: LessonPreviewSummary[] = [];
        const quizzes: QuizPreviewSummary[] = [];
        const assignments: AssignmentPreviewSummary[] = [];

        const moduleItems = extractSnapshotModuleItems(moduleNode)
          .map((itemRaw, rawIndex) => ({ itemRaw, rawIndex }))
          .sort((a, b) => {
            const aOrder = toPositiveNumberOrDefault(a.itemRaw.orderIndex, a.rawIndex);
            const bOrder = toPositiveNumberOrDefault(b.itemRaw.orderIndex, b.rawIndex);
            if (aOrder !== bOrder) {
              return aOrder - bOrder;
            }

            const aType = snapshotItemType(a.itemRaw);
            const bType = snapshotItemType(b.itemRaw);
            if (snapshotItemPriority[aType] !== snapshotItemPriority[bType]) {
              return snapshotItemPriority[aType] - snapshotItemPriority[bType];
            }

            const aId = toPositiveEntityId(a.itemRaw.id) ?? Number.MAX_SAFE_INTEGER;
            const bId = toPositiveEntityId(b.itemRaw.id) ?? Number.MAX_SAFE_INTEGER;
            return aId - bId;
          });

        moduleItems.forEach(({ itemRaw, rawIndex }, itemIndex) => {
          const resolvedType = snapshotItemType(itemRaw);
          const title = toNonBlankStringOrUndefined(itemRaw.title) ?? `Mục ${itemIndex + 1}`;
          const orderIndex = toPositiveNumberOrDefault(itemRaw.orderIndex, rawIndex);
          const sourceEntityId = toPositiveEntityId(itemRaw.id);
          const generatedId = -1 * ((moduleIndex + 1) * 10_000 + itemIndex + 1);
          const stableItemId = sourceEntityId ?? generatedId;

          if (resolvedType === 'QUIZ') {
            const questions = parseSnapshotQuestions(itemRaw.questions);
            quizzes.push({
              id: stableItemId,
              sourceEntityId,
              title,
              description: toStringOrUndefined(itemRaw.quizDescription)
                ?? toStringOrUndefined(itemRaw.description)
                ?? '',
              passScore: toPositiveNumberOrDefault(itemRaw.passScore, 0),
              orderIndex,
              questionCount: questions.length,
              maxAttempts: toNumberOrNull(itemRaw.quizMaxAttempts) ?? undefined,
              timeLimitMinutes: toNumberOrNull(itemRaw.quizTimeLimitMinutes) ?? undefined,
              roundingIncrement: toNumberOrNull(itemRaw.roundingIncrement) ?? undefined,
              cooldownHours: toNumberOrNull(itemRaw.cooldownHours) ?? undefined,
              moduleId,
              questions
            });
            return;
          }

          if (resolvedType === 'ASSIGNMENT') {
            assignments.push({
              id: stableItemId,
              sourceEntityId,
              title,
              description: toStringOrUndefined(itemRaw.assignmentDescription)
                ?? toStringOrUndefined(itemRaw.description)
                ?? '',
              submissionType: snapshotSubmissionType(itemRaw.assignmentSubmissionType ?? itemRaw.submissionType),
              maxScore: toPositiveNumberOrDefault(itemRaw.assignmentMaxScore ?? itemRaw.maxScore, 0),
              orderIndex,
              dueAt: toStringOrUndefined(itemRaw.dueAt),
              moduleId,
              passingScore: toNumberOrNull(itemRaw.assignmentPassingScore ?? itemRaw.passingScore) ?? undefined,
              isRequired: toBooleanOrUndefined(itemRaw.isRequired),
              learningOutcome: toStringOrUndefined(itemRaw.learningOutcome),
              gradingCriteria: toStringOrUndefined(itemRaw.gradingCriteria),
              criteria: parseSnapshotCriteria(itemRaw.assignmentCriteria ?? itemRaw.criteria)
            });
            return;
          }

          const durationSec = toPositiveNumberOrDefault(itemRaw.durationSec, -1);
          const durationMin = toPositiveNumberOrDefault(itemRaw.durationMin, -1);
          lessons.push({
            id: stableItemId,
            sourceEntityId,
            title,
            type: snapshotLessonType(itemRaw),
            orderIndex,
            durationSec: durationSec >= 0 ? durationSec : durationMin >= 0 ? durationMin * 60 : 0,
            contentText: toStringOrUndefined(itemRaw.contentText) ?? '',
            resourceUrl: toStringOrUndefined(itemRaw.resourceUrl),
            videoUrl: toStringOrUndefined(itemRaw.videoUrl) ?? toStringOrUndefined(itemRaw.youtubeUrl),
            videoMediaId: toPositiveEntityId(itemRaw.videoMediaId),
            attachments: parseSnapshotAttachments(itemRaw.attachments)
          });
        });

        return {
          id: moduleId,
          title: moduleTitle,
          description: moduleDescription,
          orderIndex: toPositiveNumberOrDefault(moduleNode.orderIndex, moduleIndex),
          courseId,
          createdAt: '',
          updatedAt: '',
          lessons,
          quizzes,
          assignments
        } as ModuleDetailDTO;
      })
      .filter((module): module is ModuleDetailDTO => module !== null);
  } catch (error) {
    console.error('Error parsing revision snapshot for admin preview:', error);
    return [];
  }
};

const buildLessonDetailFromPreview = (
  lessonPreview: LessonPreviewSummary,
  fallbackLessonId: number
): LessonDetailDTO => {
  return {
    id: lessonPreview.sourceEntityId ?? lessonPreview.id ?? fallbackLessonId,
    title: lessonPreview.title,
    type: lessonPreview.type,
    orderIndex: lessonPreview.orderIndex ?? 0,
    durationSec: lessonPreview.durationSec ?? 0,
    contentText: lessonPreview.contentText,
    resourceUrl: lessonPreview.resourceUrl,
    videoUrl: lessonPreview.videoUrl,
    videoMediaId: lessonPreview.videoMediaId,
    moduleId: 0,
    createdAt: '',
    updatedAt: '',
    attachments: lessonPreview.attachments
  };
};

const hasSnapshotLessonContent = (lessonPreview?: LessonPreviewSummary): boolean => {
  if (!lessonPreview) {
    return false;
  }
  if (lessonPreview.type === LessonType.VIDEO) {
    return Boolean(lessonPreview.videoUrl?.trim());
  }
  return Boolean(lessonPreview.contentText?.trim())
    || Boolean(lessonPreview.resourceUrl?.trim())
    || (lessonPreview.attachments?.length ?? 0) > 0;
};

const buildQuizDetailFromPreview = (
  quizPreview: QuizPreviewSummary,
  fallbackQuizId: number
): QuizDetailDTO => {
  return {
    id: quizPreview.sourceEntityId ?? quizPreview.id ?? fallbackQuizId,
    title: quizPreview.title,
    description: quizPreview.description ?? '',
    passScore: quizPreview.passScore,
    maxAttempts: quizPreview.maxAttempts,
    timeLimitMinutes: quizPreview.timeLimitMinutes,
    roundingIncrement: quizPreview.roundingIncrement,
    gradingMethod: quizPreview.gradingMethod,
    cooldownHours: quizPreview.cooldownHours,
    orderIndex: quizPreview.orderIndex,
    moduleId: quizPreview.moduleId ?? 0,
    questions: quizPreview.questions ?? [],
    createdAt: '',
    updatedAt: ''
  };
};

const hasSnapshotQuizContent = (quizPreview?: QuizPreviewSummary): boolean => {
  if (!quizPreview) {
    return false;
  }
  return (quizPreview.questions?.length ?? 0) > 0 || Boolean(quizPreview.description?.trim());
};

const buildAssignmentDetailFromPreview = (
  assignmentPreview: AssignmentPreviewSummary,
  fallbackAssignmentId: number
): AssignmentDetailDTO => {
  return {
    id: assignmentPreview.sourceEntityId ?? assignmentPreview.id ?? fallbackAssignmentId,
    title: assignmentPreview.title,
    description: assignmentPreview.description ?? '',
    submissionType: assignmentPreview.submissionType ?? SubmissionType.TEXT,
    maxScore: assignmentPreview.maxScore ?? 0,
    passingScore: assignmentPreview.passingScore,
    dueAt: assignmentPreview.dueAt,
    moduleId: assignmentPreview.moduleId ?? 0,
    createdAt: '',
    updatedAt: '',
    isRequired: assignmentPreview.isRequired,
    learningOutcome: assignmentPreview.learningOutcome,
    gradingCriteria: assignmentPreview.gradingCriteria,
    criteria: assignmentPreview.criteria
  };
};

const hasSnapshotAssignmentContent = (assignmentPreview?: AssignmentPreviewSummary): boolean => {
  if (!assignmentPreview) {
    return false;
  }

  return Boolean(assignmentPreview.description?.trim())
    || Boolean(assignmentPreview.learningOutcome?.trim())
    || Boolean(assignmentPreview.gradingCriteria?.trim())
    || (assignmentPreview.criteria?.length ?? 0) > 0;
};

/** Expandable lesson detail — loaded on-demand when user clicks */
interface LessonDetailProps {
  lessonId: number;
  sourceEntityId?: number;
  viewerId?: number;
  snapshotLesson?: LessonPreviewSummary;
  preferSnapshot?: boolean;
}

const LessonDetail: React.FC<LessonDetailProps> = ({
  lessonId,
  sourceEntityId,
  viewerId,
  snapshotLesson,
  preferSnapshot = false
}) => {
  const [lesson, setLesson] = useState<LessonDetailDTO | null>(() => {
    if (!preferSnapshot || !snapshotLesson) {
      return null;
    }
    return buildLessonDetailFromPreview(snapshotLesson, lessonId);
  });
  const [attachments, setAttachments] = useState<LessonAttachmentDTO[]>(() => {
    if (!preferSnapshot || !snapshotLesson?.attachments) {
      return [];
    }
    return snapshotLesson.attachments;
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loadedFromSource, setLoadedFromSource] = useState(false);

  useEffect(() => {
    if (!preferSnapshot || !snapshotLesson) {
      return;
    }

    setLesson(buildLessonDetailFromPreview(snapshotLesson, lessonId));
    setAttachments(snapshotLesson.attachments ?? []);
  }, [preferSnapshot, snapshotLesson, lessonId]);

  useEffect(() => {
    setLoadedFromSource(false);
  }, [lessonId, sourceEntityId]);

  const loadLesson = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (preferSnapshot && snapshotLesson) {
      setLesson(buildLessonDetailFromPreview(snapshotLesson, lessonId));
      setAttachments(snapshotLesson.attachments ?? []);
      setExpanded(true);
      if (hasSnapshotLessonContent(snapshotLesson)) {
        return;
      }
    }

    if (loadedFromSource) {
      setExpanded(true);
      return;
    }

    const resolvedSourceId = isPositiveEntityId(sourceEntityId)
      ? sourceEntityId
      : isPositiveEntityId(lessonId)
        ? lessonId
        : undefined;

    if (!resolvedSourceId) {
      setExpanded(true);
      return;
    }

    try {
      setLoading(true);
      const data = await getLessonById(resolvedSourceId);
      setLesson(data);

      if (data.type === LessonType.READING) {
        if (viewerId && viewerId > 0) {
          try {
            const attachmentList = await listAttachments(resolvedSourceId, viewerId);
            setAttachments(attachmentList);
          } catch (attachmentError: any) {
            const isEnrollmentForbidden = attachmentError?.response?.status === 403
              && String(attachmentError?.response?.data?.message || '').toUpperCase().includes('USER_NOT_ENROLLED');

            if (!isEnrollmentForbidden) {
              console.warn('Could not load attachments from live lesson, keep snapshot attachments:', attachmentError);
            }
            setAttachments(snapshotLesson?.attachments ?? data.attachments ?? []);
          }
        } else {
          setAttachments(snapshotLesson?.attachments ?? data.attachments ?? []);
        }
      } else {
        setAttachments([]);
      }

      setLoadedFromSource(true);
      setExpanded(true);
    } catch (err) {
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  }, [expanded, lessonId, loadedFromSource, preferSnapshot, snapshotLesson, sourceEntityId, viewerId]);

  return (
    <div className="acp-lesson-detail">
      <button className="acp-lesson-expand-btn" onClick={loadLesson} disabled={loading}>
        {loading ? <Clock size={14} className="acp-spin" /> : expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>Xem nội dung</span>
      </button>
      {expanded && lesson && (
        <div className="acp-lesson-content">
          {lesson.type === LessonType.VIDEO && lesson.videoUrl && (
            <div className="acp-video-wrapper">
              <iframe
                src={lesson.videoUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {lesson.type === LessonType.READING && lesson.contentText && (
            <div className="acp-reading-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {normalizeContent(lesson.contentText || '')}
              </ReactMarkdown>
            </div>
          )}
          {lesson.type === LessonType.READING && lesson.resourceUrl && (
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
          {lesson.type === LessonType.READING && attachments.length > 0 && (
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
                    {attachment.downloadUrl ? (
                      <button
                        onClick={() => downloadFile(
                          `/api/lessons/attachments/stream-url`,
                          attachment.title,
                          { downloadUrl: attachment.downloadUrl, filename: attachment.title }
                        )}
                        className="acp-reading-attachment-link"
                        title="Mở tài liệu"
                      >
                        <Download size={14} />
                        <span>Mở file</span>
                      </button>
                    ) : (
                      <span className="acp-reading-resource-invalid">Chưa có file</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {lesson.type === LessonType.VIDEO && !lesson.videoUrl && (
            <div className="acp-empty-content"><Play size={32} /><p>Chưa có video</p></div>
          )}
          {lesson.type === LessonType.READING && !lesson.contentText?.trim() && (
            <div className="acp-empty-content"><FileText size={32} /><p>Chưa có nội dung</p></div>
          )}
        </div>
      )}
    </div>
  );
};

/** Expandable quiz detail — loads questions on-demand */
interface QuizDetailProps {
  quizId: number;
  sourceEntityId?: number;
  snapshotQuiz?: QuizPreviewSummary;
  preferSnapshot?: boolean;
}

const QuizDetail: React.FC<QuizDetailProps> = ({
  quizId,
  sourceEntityId,
  snapshotQuiz,
  preferSnapshot = false
}) => {
  const [quiz, setQuiz] = useState<QuizDetailDTO | null>(() => {
    if (!preferSnapshot || !snapshotQuiz) {
      return null;
    }
    return buildQuizDetailFromPreview(snapshotQuiz, quizId);
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loadedFromSource, setLoadedFromSource] = useState(false);

  useEffect(() => {
    if (!preferSnapshot || !snapshotQuiz) {
      return;
    }
    setQuiz(buildQuizDetailFromPreview(snapshotQuiz, quizId));
  }, [preferSnapshot, snapshotQuiz, quizId]);

  useEffect(() => {
    setLoadedFromSource(false);
  }, [quizId, sourceEntityId]);

  const loadQuiz = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (preferSnapshot && snapshotQuiz) {
      setQuiz(buildQuizDetailFromPreview(snapshotQuiz, quizId));
      setExpanded(true);
      if (hasSnapshotQuizContent(snapshotQuiz)) {
        return;
      }
    }

    if (loadedFromSource) {
      setExpanded(true);
      return;
    }

    const resolvedSourceId = isPositiveEntityId(sourceEntityId)
      ? sourceEntityId
      : isPositiveEntityId(quizId)
        ? quizId
        : undefined;

    if (!resolvedSourceId) {
      setExpanded(true);
      return;
    }

    try {
      setLoading(true);
      const data = await getQuizById(resolvedSourceId);
      setQuiz(data);
      setLoadedFromSource(true);
      setExpanded(true);
    } catch (err) {
      console.error('Error loading quiz:', err);
    } finally {
      setLoading(false);
    }
  }, [expanded, loadedFromSource, preferSnapshot, quizId, snapshotQuiz, sourceEntityId]);

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
interface AssignmentDetailProps {
  assignmentId: number;
  sourceEntityId?: number;
  snapshotAssignment?: AssignmentPreviewSummary;
  preferSnapshot?: boolean;
}

const AssignmentDetailView: React.FC<AssignmentDetailProps> = ({
  assignmentId,
  sourceEntityId,
  snapshotAssignment,
  preferSnapshot = false
}) => {
  const [assignment, setAssignment] = useState<AssignmentDetailDTO | null>(() => {
    if (!preferSnapshot || !snapshotAssignment) {
      return null;
    }
    return buildAssignmentDetailFromPreview(snapshotAssignment, assignmentId);
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loadedFromSource, setLoadedFromSource] = useState(false);

  useEffect(() => {
    if (!preferSnapshot || !snapshotAssignment) {
      return;
    }
    setAssignment(buildAssignmentDetailFromPreview(snapshotAssignment, assignmentId));
  }, [preferSnapshot, snapshotAssignment, assignmentId]);

  useEffect(() => {
    setLoadedFromSource(false);
  }, [assignmentId, sourceEntityId]);

  const loadAssignment = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (preferSnapshot && snapshotAssignment) {
      setAssignment(buildAssignmentDetailFromPreview(snapshotAssignment, assignmentId));
      setExpanded(true);
      if (hasSnapshotAssignmentContent(snapshotAssignment)) {
        return;
      }
    }

    if (loadedFromSource) {
      setExpanded(true);
      return;
    }

    const resolvedSourceId = isPositiveEntityId(sourceEntityId)
      ? sourceEntityId
      : isPositiveEntityId(assignmentId)
        ? assignmentId
        : undefined;

    if (!resolvedSourceId) {
      setExpanded(true);
      return;
    }

    try {
      setLoading(true);
      const data = await getAssignmentById(resolvedSourceId);
      setAssignment(data);
      setLoadedFromSource(true);
      setExpanded(true);
    } catch (err) {
      console.error('Error loading assignment:', err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, expanded, loadedFromSource, preferSnapshot, snapshotAssignment, sourceEntityId]);

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
                      <td className="acp-criteria-desc">{c.description ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.description) }} /> : '—'}</td>
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
  const revisionIdParam = new URLSearchParams(location.search).get('revisionId');
  const revisionId = revisionIdParam ? Number(revisionIdParam) : null;
  const hasRevisionId = typeof revisionId === 'number' && Number.isFinite(revisionId) && revisionId > 0;
  const { user } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning } = useToast();

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [modules, setModules] = useState<ModuleDetailDTO[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<CourseRevisionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject' | 'suspend' | 'restore' } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [hasModulesWarning, setHasModulesWarning] = useState(false);
  const [liveModules, setLiveModules] = useState<ModuleDetailDTO[]>([]);
  // Left column: toggle giữa "bản trước đó" (APPROVED revision) và "bản đang publish" (live course)
  const [leftSideMode, setLeftSideMode] = useState<'previous' | 'live'>('previous');
  const [previousRevision, setPreviousRevision] = useState<CourseRevisionDTO | null>(null);
  const [previousModules, setPreviousModules] = useState<ModuleDetailDTO[]>([]);
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
      const courseData = await getCourse(id);
      setCourse(courseData);

      // Load modules riêng — nếu fail vẫn hiển thị course header
      let moduleData: ModuleDetailDTO[] = [];
      let liveModuleData: ModuleDetailDTO[] = [];
      try {
        const res = await listModulesWithContent(id);
        moduleData = res;
        liveModuleData = [...res].sort((a, b) => a.orderIndex - b.orderIndex);
      } catch (moduleError) {
        console.warn('Could not load modules:', moduleError);
        setHasModulesWarning(true);
        showWarning('Cảnh báo', 'Không tải được danh sách chương. Hiển thị thông tin cơ bản.');
      }

      const sortedModules = [...moduleData].sort((a, b) => a.orderIndex - b.orderIndex);
      let effectiveModules = sortedModules;

      if (hasRevisionId && revisionId !== null) {
        try {
          const revision = await getCourseRevision(revisionId);
          setSelectedRevision(revision);
          const snapshotModules = parseModulesFromRevisionSnapshot(revision.contentSnapshotJson, id)
            .sort((a, b) => a.orderIndex - b.orderIndex);
          if (snapshotModules.length > 0) {
            effectiveModules = snapshotModules;
          }
        } catch (revisionError) {
          console.error('Error loading revision snapshot:', revisionError);
          setSelectedRevision(null);
          showWarning('Cảnh báo', 'Không tải được snapshot revision, hiển thị nội dung khóa học hiện tại.');
        }
      } else {
        setSelectedRevision(null);
      }

      // Luôn fetch APPROVED revision gần nhất — cho left column toggle
      try {
        const prevRev = await getLatestApprovedRevision(id);
        if (prevRev) {
          setPreviousRevision(prevRev);
          const prevMods = parseModulesFromRevisionSnapshot(prevRev.contentSnapshotJson, id)
            .sort((a, b) => a.orderIndex - b.orderIndex);
          setPreviousModules(prevMods);
        } else {
          setPreviousRevision(null);
          setPreviousModules([]);
        }
      } catch {
        setPreviousRevision(null);
        setPreviousModules([]);
      }

      setModules(effectiveModules);
      setLiveModules(liveModuleData);
      // Expand all modules by default
      const expanded: Record<number, boolean> = {};
      effectiveModules.forEach(m => { expanded[m.id] = true; });
      setExpandedModules(expanded);
    } catch (err) {
      console.error('Error loading course:', err);
      showError('Lỗi', 'Không thể tải thông tin khóa học');
    } finally {
      setLoading(false);
    }
  }, [courseId, hasRevisionId, revisionId, showError, showWarning]);

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

  // ---- Compare Layout Helpers ----

  // Computed: left column luôn dùng APPROVED revision snapshot — không dùng live DB để so sánh đúng
  const leftModules = previousRevision ? previousModules : [];

  const leftTitle = previousRevision?.title || course?.title;

  const leftColumnLabel = 'Bản đã duyệt gần nhất';

  const showCompareLayout = hasRevisionId && selectedRevision !== null;

  // ---- Render Helpers ----

  const renderStatsGrid = (moduleList: ModuleDetailDTO[]) => {
    const total = moduleList.reduce((s, m) => s + (m.lessons?.length || 0), 0);
    const assignments = moduleList.reduce((s, m) => s + (m.assignments?.length || 0), 0);
    const quizzes = moduleList.reduce((s, m) => s + (m.quizzes?.length || 0), 0);
    return (
      <div className="acp-compare__stats-grid">
        <div className="acp-stat-card">
          <Layers size={16} />
          <div><div className="acp-stat-value">{moduleList.length}</div><div className="acp-stat-label">Modules</div></div>
        </div>
        <div className="acp-stat-card">
          <BookOpen size={16} />
          <div><div className="acp-stat-value">{total}</div><div className="acp-stat-label">Bài học</div></div>
        </div>
        <div className="acp-stat-card">
          <FileText size={16} />
          <div><div className="acp-stat-value">{assignments}</div><div className="acp-stat-label">Bài tập</div></div>
        </div>
        <div className="acp-stat-card">
          <CheckCircle size={16} />
          <div><div className="acp-stat-value">{quizzes}</div><div className="acp-stat-label">Bài kiểm tra</div></div>
        </div>
      </div>
    );
  };

  interface ModuleCardProps {
    module: ModuleDetailDTO;
    idx: number;
    useSnapshotContent: boolean; // true = revision snapshot, false = live course
  }

  const ModuleCard: React.FC<ModuleCardProps> = ({ module, idx, useSnapshotContent }) => {
    const moduleItems = getModulePreviewItems(module);

    return (
      <NeuralCard key={module.id} className="acp-module-card">
        <div className="acp-module-header" onClick={() => toggleModule(module.id)}>
          <div className="acp-module-title-row">
            <Layers size={20} className="acp-module-icon" />
            <div className="acp-module-title__content">
              <h3 className="acp-module-title">Module {idx + 1}: {module.title}</h3>
              {module.description && <div className="acp-module-desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(module.description) }} />}
            </div>
          </div>
          <div className="acp-module-toggle">
            {expandedModules[module.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        {expandedModules[module.id] && (
          <div className="acp-module-body">
            {moduleItems.length > 0 && (
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
                  {moduleItems.map((item, itemIdx) => (
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
                        <div className="acp-content-item-desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.description) }} />
                      )}

                      {item.kind === 'lesson' && (
                        <LessonDetail
                          lessonId={item.id}
                          sourceEntityId={item.sourceEntityId}
                          viewerId={user?.id}
                          snapshotLesson={item.lessonPreview}
                          preferSnapshot={useSnapshotContent}
                        />
                      )}
                      {item.kind === 'assignment' && (
                        <AssignmentDetailView
                          assignmentId={item.id}
                          sourceEntityId={item.sourceEntityId}
                          snapshotAssignment={item.assignmentPreview}
                          preferSnapshot={useSnapshotContent}
                        />
                      )}
                      {item.kind === 'quiz' && (
                        <QuizDetail
                          quizId={item.id}
                          sourceEntityId={item.sourceEntityId}
                          snapshotQuiz={item.quizPreview}
                          preferSnapshot={useSnapshotContent}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            {moduleItems.length === 0 && (
              <div className="acp-empty-content">
                <p>Module này chưa có nội dung</p>
              </div>
            )}
          </div>
        )}
      </NeuralCard>
    );
  };

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
          {!selectedRevision && course.status === CourseStatus.PENDING && (
            <>
              <button className="acp-btn-approve" onClick={() => setActionModal({ type: 'approve' })}>
                <CheckCircle size={18} /> Duyệt
              </button>
              <button className="acp-btn-reject" onClick={() => setActionModal({ type: 'reject' })}>
                <XCircle size={18} /> Từ chối
              </button>
            </>
          )}
          {!selectedRevision && course.status === CourseStatus.PUBLIC && (
            <button className="acp-btn-suspend" onClick={() => setActionModal({ type: 'suspend' })}>
              <ShieldOff size={18} /> Tạm khóa
            </button>
          )}
          {!selectedRevision && course.status === CourseStatus.SUSPENDED && (
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
              {selectedRevision && (
                <span className="acp-status-badge acp-status-pending">
                  Revision #{selectedRevision.revisionNumber} - {selectedRevision.status}
                </span>
              )}
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

      {/* Modules load warning */}
      {hasModulesWarning && (
        <div className="acp-alert acp-alert-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Cảnh báo:</strong> Không tải được danh sách chương từ server. Hiển thị thông tin cơ bản.
          </div>
        </div>
      )}

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

      {showCompareLayout ? (
        /* ====== SIDE-BY-SIDE COMPARE LAYOUT ====== */
        <div className="acp-compare__wrapper">
          {/* Cột trái luôn hiển thị APPROVED revision snapshot */}
          <div className="acp-compare-toggle">
            <button className="acp-toggle-btn active">
              Bản đã duyệt gần nhất
            </button>
          </div>

          <div className="acp-compare__layout">

            {/* LEFT: Toggle-dependent content */}
            <div className="acp-compare__column acp-compare__column--left">
              <div className="acp-compare__column-header">
                <span className="acp-compare__badge acp-compare__badge--live">{leftColumnLabel}</span>
                <span className="acp-compare__column-title">{leftTitle}</span>
                {getStatusBadge(course.status)}
              </div>

              <div className="acp-compare__section">
                <h4 className="acp-compare__section-title">Mô tả khóa học</h4>
                <div className="acp-description">
                  {(leftSideMode === 'previous' && previousRevision?.description?.trim())
                    ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(previousRevision.description) }} />
                    : course.description?.trim()
                      ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }} />
                      : <em className="acp-text-dim">Chưa có mô tả</em>
                  }
                </div>
              </div>

              <div className="acp-compare__section">
                <h4 className="acp-compare__section-title">Thống kê</h4>
                {renderStatsGrid(leftModules)}
              </div>

              <div className="acp-compare__section">
                <h4 className="acp-compare__section-title">Nội dung khóa học ({leftModules.length} modules)</h4>
                {leftModules.length === 0 ? (
                  <div className="acp-empty-content">
                    <Layers size={48} />
                    <p>Khóa học chưa có nội dung</p>
                  </div>
                ) : (
                  leftModules
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((module, idx) => (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        idx={idx}
                        useSnapshotContent={leftSideMode === 'previous'}
                      />
                    ))
                )}
              </div>
            </div>

            {/* RIGHT: Bản chờ duyệt (cố định) */}
            <div className="acp-compare__column acp-compare__column--right">
              <div className="acp-compare__column-header">
                <span className="acp-compare__badge acp-compare__badge--revision">Bản chờ duyệt</span>
                <span className="acp-compare__column-title">{selectedRevision?.title || course.title}</span>
                {selectedRevision && (
                  <span className="acp-status-badge acp-status-pending">Revision #{selectedRevision.revisionNumber}</span>
                )}
              </div>

              <div className="acp-compare__section">
                <h4 className="acp-compare__section-title">Mô tả khóa học</h4>
                <div className="acp-description">
                  {selectedRevision?.description?.trim()
                    ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedRevision.description) }} />
                    : course.description?.trim()
                      ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }} />
                      : <em className="acp-text-dim">Chưa có mô tả</em>
                  }
                </div>
              </div>

              <div className="acp-compare__section">
                <h4 className="acp-compare__section-title">Thống kê</h4>
                {renderStatsGrid(modules)}
              </div>

              <div className="acp-compare__section">
                <h4 className="acp-compare__section-title">Nội dung khóa học ({modules.length} modules)</h4>
                {modules.length === 0 ? (
                  <div className="acp-empty-content">
                    <Layers size={48} />
                    <p>Khóa học chưa có nội dung</p>
                  </div>
                ) : (
                  modules
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((module, idx) => (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        idx={idx}
                        useSnapshotContent={true}
                      />
                    ))
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* ====== SINGLE COLUMN (no revision) ====== */
        <>
          {/* Stats Overview */}
          <div className="acp-stats-grid">
            <div className="acp-stat-card">
              <Layers size={20} />
              <div><div className="acp-stat-value">{modules.length}</div><div className="acp-stat-label">Modules</div></div>
            </div>
            <div className="acp-stat-card">
              <BookOpen size={20} />
              <div><div className="acp-stat-value">{modules.reduce((s, m) => s + (m.lessons?.length || 0), 0)}</div><div className="acp-stat-label">Bài học</div></div>
            </div>
            <div className="acp-stat-card">
              <FileText size={20} />
              <div><div className="acp-stat-value">{modules.reduce((s, m) => s + (m.assignments?.length || 0), 0)}</div><div className="acp-stat-label">Bài tập</div></div>
            </div>
            <div className="acp-stat-card">
              <CheckCircle size={20} />
              <div><div className="acp-stat-value">{modules.reduce((s, m) => s + (m.quizzes?.length || 0), 0)}</div><div className="acp-stat-label">Bài kiểm tra</div></div>
            </div>
          </div>

          {/* Description */}
          <NeuralCard className="acp-section">
            <h2 className="acp-section-title">Mô tả khóa học</h2>
            <div className="acp-description">
              {course.description?.trim()
                ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }} />
                : <em className="acp-text-dim">Chưa có mô tả</em>}
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
              modules
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((module, idx) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    idx={idx}
                    useSnapshotContent={false}
                  />
                ))
            )}
          </div>
        </>
      )}

      {/* Bottom Action Bar (sticky) */}
      {!selectedRevision && (course.status === CourseStatus.PENDING || course.status === CourseStatus.PUBLIC || course.status === CourseStatus.SUSPENDED) && (
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
