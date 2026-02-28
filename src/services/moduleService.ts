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
}

/** Raw API response for quiz */
interface QuizApiResponse {
  id: number;
  title: string;
  passScore: number;
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
}

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
  const res = await axiosInstance.get<any[]>(`/courses/${courseId}/modules/full`);
  const raw = res.data || [];

  return raw.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description ?? '',
    orderIndex: m.orderIndex ?? 0,
    courseId: courseId,
    createdAt: m.createdAt ?? '',
    updatedAt: m.updatedAt ?? '',
    lessons: (m.lessons || []).map((l: LessonApiResponse) => ({
      id: l.id,
      title: l.title,
      type: (l.type || l.lessonType || DEFAULT_LESSON_TYPE) as LessonSummaryDTO['type'],
      orderIndex: l.orderIndex ?? 0,
      durationSec: l.durationSec ?? 0
    })) as LessonSummaryDTO[],
    quizzes: (m.quizzes || []).map((q: QuizApiResponse) => ({
      id: q.id,
      title: q.title,
      description: '',
      passScore: q.passScore,
      questionCount: q.questionCount ?? 0
    })) as QuizSummaryDTO[],
    assignments: (m.assignments || []).map((a: AssignmentApiResponse) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? '',
      submissionType: (a.submissionType ?? 'TEXT') as AssignmentSummaryDTO['submissionType'],
      maxScore: a.maxScore ?? 0
    })) as AssignmentSummaryDTO[]
  }));
};

