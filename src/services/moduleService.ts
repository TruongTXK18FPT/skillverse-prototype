import axiosInstance from './axiosInstance';
import {
  ModuleCreateDTO,
  ModuleUpdateDTO,
  ModuleSummaryDTO,
  ModuleDetailDTO
} from '../data/moduleDTOs';
import { LessonSummaryDTO } from '../data/lessonDTOs';
import { QuizSummaryDTO } from '../data/quizDTOs';
import { AssignmentSummaryDTO } from '../data/assignmentDTOs';
import { resolveRevisionItemWarning } from '../utils/courseRevisionMessages';
import { getAccessToken } from '../utils/authStorage';

// Re-export DTOs for backward compatibility (consumers can import from service)
export type { ModuleCreateDTO, ModuleUpdateDTO, ModuleSummaryDTO, ModuleDetailDTO };

// ==================== Internal API Response Types ====================
// These are private to this service - represent raw API responses
// that may differ from domain DTOs

/** Raw API response for lesson (may have different field names) */
interface LessonApiResponse {
  id: number;
  title: string;
  type?: string;
  lessonType?: string;  // Alternative field name from some endpoints
  orderIndex?: number;
  durationSec?: number;
  contentText?: string;
  resourceUrl?: string;
  videoUrl?: string;
  videoMediaId?: number;
  // Keep revision-sensitive fields when backend provides them to avoid accidental snapshot drift.
  passScore?: number;
  questions?: unknown[];
  assignmentCriteria?: unknown[];
  assignmentSubmissionType?: string;
  assignmentMaxScore?: number;
  assignmentPassingScore?: number;
  isRequired?: boolean;
}

/** Raw API response for quiz */
interface QuizApiResponse {
  id: number;
  title: string;
  description?: string;
  passScore: number;
  orderIndex?: number;
  questionCount?: number;
}

/** Raw API response for assignment */
interface AssignmentApiResponse {
  id: number;
  title: string;
  description?: string;
  submissionType?: string;
  maxScore?: number;
  orderIndex?: number;
  dueAt?: string;
}

interface RevisionWarningDecorated {
  revisionWarning?: boolean;
  revisionWarningMessage?: string | null;
  revisionWarningReasonCode?: string | null;
}

const decorateRevisionWarning = <T extends object>(
  item: T,
  warningSource?: unknown
): T & RevisionWarningDecorated => {
  const warning = resolveRevisionItemWarning(warningSource ?? item);
  if (!warning) {
    return item;
  }
  return {
    ...item,
    revisionWarning: warning.isBreaking,
    revisionWarningMessage: warning.message,
    revisionWarningReasonCode: warning.reasonCode ?? null,
  };
};

// ==================== Constants ====================

const DEFAULT_LESSON_TYPE = 'VIDEO';

// ==================== API Functions ====================

export const listModules = async (courseId: number): Promise<ModuleSummaryDTO[]> => {
  const res = await axiosInstance.get(`/courses/${courseId}/modules`);
  return res.data as ModuleSummaryDTO[];
};

export const createModule = async (courseId: number, actorId: number, dto: ModuleCreateDTO): Promise<ModuleDetailDTO> => {
  const res = await axiosInstance.post(`/courses/${courseId}/modules`, dto, { params: { actorId } });
  return res.data as ModuleDetailDTO;
};

export const updateModule = async (moduleId: number, actorId: number, dto: ModuleUpdateDTO): Promise<ModuleDetailDTO> => {
  const res = await axiosInstance.put(`/modules/${moduleId}`, dto, { params: { actorId } });
  return res.data as ModuleDetailDTO;
};

export const deleteModule = async (moduleId: number, actorId: number): Promise<void> => {
  await axiosInstance.delete(`/modules/${moduleId}`, { params: { actorId } });
};

export const assignLessonToModule = async (moduleId: number, lessonId: number, actorId: number): Promise<void> => {
  await axiosInstance.post(`/modules/${moduleId}/assign-lesson/${lessonId}`, null, { params: { actorId } });
};

// Load modules with lessons and quizzes content for admin/course detail views
// Uses single batch endpoint — eliminates N+1 HTTP requests
export const listModulesWithContent = async (courseId: number): Promise<ModuleDetailDTO[]> => {
  // Gắn token thủ công — interceptor có thể miss getAccessToken() trong một số context
  // Pattern giống getCourse() trong courseService.ts
  const token = getAccessToken();
  const res = await axiosInstance.get<any[]>(
    `/courses/${courseId}/modules/full`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  const raw = res.data || [];

  return raw.map((m, index) => {
    const moduleTitle = String(m.title ?? m.moduleTitle ?? m.name ?? '').trim() || `Chương ${index + 1}`;
    const moduleDescription = String(m.description ?? m.moduleDescription ?? '').trim();

    return {
      id: Number(m.id ?? m.moduleId ?? 0),
      title: moduleTitle,
      description: moduleDescription,
      orderIndex: m.orderIndex ?? index,
      courseId: courseId,
      createdAt: m.createdAt ?? '',
      updatedAt: m.updatedAt ?? '',
      lessons: (m.lessons || []).map((l: LessonApiResponse) =>
        decorateRevisionWarning({
          id: l.id,
          title: l.title,
          type: (l.type || l.lessonType || DEFAULT_LESSON_TYPE) as LessonSummaryDTO['type'],
          orderIndex: l.orderIndex ?? 0,
          durationSec: l.durationSec ?? 0,
          contentText: l.contentText,
          resourceUrl: l.resourceUrl,
          videoUrl: l.videoUrl,
          videoMediaId: l.videoMediaId,
          passScore: l.passScore,
          questions: Array.isArray(l.questions) ? l.questions : undefined,
          assignmentCriteria: Array.isArray(l.assignmentCriteria) ? l.assignmentCriteria : undefined,
          assignmentSubmissionType: l.assignmentSubmissionType,
          assignmentMaxScore: l.assignmentMaxScore,
          assignmentPassingScore: l.assignmentPassingScore,
          isRequired: l.isRequired,
        }, l)
      ) as LessonSummaryDTO[],
      quizzes: (m.quizzes || []).map((q: QuizApiResponse) =>
        decorateRevisionWarning({
          id: q.id,
          title: q.title,
          description: q.description ?? '',
          passScore: q.passScore,
          orderIndex: q.orderIndex ?? 0,
          questionCount: q.questionCount ?? 0,
        }, q)
      ) as QuizSummaryDTO[],
      assignments: (m.assignments || []).map((a: AssignmentApiResponse) =>
        decorateRevisionWarning({
          id: a.id,
          title: a.title,
          description: a.description ?? '',
          submissionType: (a.submissionType ?? 'TEXT') as AssignmentSummaryDTO['submissionType'],
          maxScore: a.maxScore ?? 0,
          orderIndex: a.orderIndex ?? 0,
          dueAt: a.dueAt,
        }, a)
      ) as AssignmentSummaryDTO[]
    };
  });
};

