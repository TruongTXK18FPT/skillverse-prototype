/**
 * Course Management Context
 * 
 * Provides shared state management for course creation and editing workflows.
 * Uses types from existing courseDTOs.ts file.
 * 
 * @module context/mentor/CourseManagementContext
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { 
  CourseLevel, 
  CourseStatus, 
  CourseDetailDTO,
  ModuleSummaryDTO,
  LessonSummaryDTO,
  LessonType
} from '../../data/courseDTOs';
import { AttachmentType, LessonAttachmentDTO } from '../../services/attachmentService';

// ============================================================================
// TYPES
// ============================================================================

// Extended Module with lessons for builder
export interface ModuleWithLessons extends ModuleSummaryDTO {
  lessons: LessonSummaryDTO[];
}

// Course form data for creation wizard
export interface CourseFormData {
  title: string;
  description: string;
  summary?: string;
  category?: string;
  level: CourseLevel;
  price?: number;
  currency?: string;
  thumbnailUrl?: string;
  estimatedDuration?: number;
  language?: string;
  learningObjectives?: string[];
  requirements?: string[];
  status?: CourseStatus;
}

// Module form data
export interface ModuleFormData {
  title: string;
  description?: string;
  orderIndex: number;
}

// Lesson form data
export interface LessonFormData {
  title: string;
  type: string;
  orderIndex: number;
  duration?: number;
  content?: string;
  videoUrl?: string;
}

// Builder state
export interface CourseBuilderState {
  // Course info
  currentCourse: CourseDetailDTO | null;
  courseForm: CourseFormData;
  
  // Wizard
  wizardStep: number;
  
  // Modules and lessons
  modules: ModuleWithLessons[];
  
  // Loading
  isLoading: boolean;
  error: string | null;
}

// Context interface
export interface CourseManagementContextType {
  state: CourseBuilderState;
  
  // Wizard
  setWizardStep: (step: number) => void;
  updateCourseForm: (data: Partial<CourseFormData>) => void;
  
  // Course operations
  createCourse: (modulesSnapshot?: any[], courseDataOverride?: Partial<CourseFormData>, thumbnailFile?: File) => Promise<CourseDetailDTO | null>;
  updateCourse: (courseId: string, modulesSnapshot?: any[], courseDataOverride?: Partial<CourseFormData>, thumbnailFile?: File) => Promise<CourseDetailDTO | null>;
  loadCourseForEdit: (courseId: string) => Promise<void>;
  
  // Module operations
  addModule: (data: ModuleFormData) => Promise<void>;
  updateModule: (moduleId: string, data: Partial<ModuleFormData>) => Promise<void>;
  deleteModule: (moduleId: string) => Promise<void>;
  reorderModules: (newOrder: string[]) => Promise<void>;
  
  // Lesson operations
  addLesson: (moduleId: number, data: LessonFormData) => Promise<void>;
  updateLesson: (moduleId: string, lessonId: string, data: Partial<LessonFormData>) => Promise<void>;
  deleteLesson: (moduleId: string, lessonId: string) => Promise<void>;
  
  // Utility
  resetState: () => void;
  setError: (error: string | null) => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialCourseForm: CourseFormData = {
  title: '',
  description: '',
  summary: '',
  category: '',
  level: CourseLevel.BEGINNER,
  price: 0,
  currency: 'VND',
  thumbnailUrl: '',
  estimatedDuration: undefined,
  language: 'English',
  learningObjectives: [],
  requirements: [],
  status: CourseStatus.DRAFT
};

const initialState: CourseBuilderState = {
  currentCourse: null,
  courseForm: { ...initialCourseForm },
  wizardStep: 1,
  modules: [],
  isLoading: false,
  error: null
};

const COURSE_DRAFT_ORDER_DEBUG_KEY = 'sv_debug_draft_order';

const isCourseDraftOrderDebugEnabled = () =>
  typeof window !== 'undefined' && window.localStorage.getItem(COURSE_DRAFT_ORDER_DEBUG_KEY) === '1';

const debugCourseDraftOrder = (label: string, payload: unknown) => {
  if (!isCourseDraftOrderDebugEnabled()) {
    return;
  }
  console.groupCollapsed(`[COURSE-ORDER-DEBUG] ${label}`);
  console.log(payload);
  console.groupEnd();
};

// ============================================================================
// CONTEXT
// ============================================================================

const CourseManagementContext = createContext<CourseManagementContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface CourseManagementProviderProps {
  children: ReactNode;
}

export const CourseManagementProvider: React.FC<CourseManagementProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<CourseBuilderState>(initialState);
  const createCourseInFlight = useRef<Promise<CourseDetailDTO | null> | null>(null);

  // ============================================================================
  // WIZARD OPERATIONS
  // ============================================================================

  const setWizardStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, wizardStep: step }));
  }, []);

  const updateCourseForm = useCallback((data: Partial<CourseFormData>) => {
    setState(prev => ({
      ...prev,
      courseForm: { ...prev.courseForm, ...data }
    }));
  }, []);

  const normalizeAttachmentDrafts = useCallback((attachments: unknown[] | undefined) => {
    if (!attachments || attachments.length === 0) {
      return [];
    }

    return attachments
      .map((attachment) => {
        if (!attachment || typeof attachment !== 'object') {
          return null;
        }

        const att = attachment as Partial<LessonAttachmentDTO> & {
          serverId?: number;
          name?: string;
          url?: string;
          mediaId?: number;
        };

        const url = att.url || att.downloadUrl;
        const name = att.name || att.title;
        const serverId = att.serverId ?? att.id;

        if (!serverId && !att.mediaId && !url) {
          return null;
        }

        return {
          serverId,
          mediaId: att.mediaId,
          name: name || 'Attachment',
          url
        };
      })
      .filter((attachment): attachment is { serverId?: number; mediaId?: number; name: string; url?: string } => Boolean(attachment));
  }, []);

  const buildAttachmentRequest = useCallback((attachment: {
    serverId?: number;
    mediaId?: number;
    name?: string;
    url?: string;
  }) => {
    if (!attachment.mediaId && !(attachment.url && attachment.url.trim())) {
      return null;
    }

    const attachmentRequest: {
      title: string;
      orderIndex: number;
      type?: AttachmentType;
      mediaId?: number;
      externalUrl?: string;
    } = {
      title: attachment.name || 'Attachment',
      orderIndex: 0
    };

    if (attachment.mediaId) {
      attachmentRequest.type = AttachmentType.PDF;
      if (attachment.name?.toLowerCase().endsWith('.docx')) attachmentRequest.type = AttachmentType.DOCX;
      if (attachment.name?.toLowerCase().endsWith('.pptx')) attachmentRequest.type = AttachmentType.PPTX;
      if (attachment.name?.toLowerCase().endsWith('.xlsx')) attachmentRequest.type = AttachmentType.XLSX;
      attachmentRequest.mediaId = attachment.mediaId;
    } else if (attachment.url) {
      attachmentRequest.type = AttachmentType.EXTERNAL_LINK;
      attachmentRequest.externalUrl = attachment.url;
    }

    return attachmentRequest;
  }, []);

  // ============================================================================
  // COURSE OPERATIONS
  // ============================================================================

  const fetchFullCourseDetails = async (
    courseId: number,
    preferredOrderByModule?: Map<number, Map<string, number>>
  ): Promise<CourseDetailDTO> => {
      // 1. Fetch course details
      const course = await import('../../services/courseService').then(m => m.getCourse(courseId));
      
      // 2. Fetch lessons and quizzes for each module
       const modulesWithLessons = await Promise.all(
         (course.modules || []).map(async (module) => {
           const lessonSummaries = await import('../../services/lessonService').then(m => m.listLessonsByModule(module.id));
           const quizSummaries = await import('../../services/quizService').then(m => m.listQuizzesByModule(module.id));
           const assignmentSummaries = await import('../../services/assignmentService').then(m => m.listAssignmentsByModule(module.id));

           debugCourseDraftOrder(`module ${module.id} summaries`, {
             moduleId: module.id,
             lessons: (lessonSummaries || []).map((item: any) => ({ id: item.id, title: item.title, orderIndex: item.orderIndex })),
             quizzes: (quizSummaries || []).map((item: any) => ({ id: item.id, title: item.title, orderIndex: item.orderIndex })),
             assignments: (assignmentSummaries || []).map((item: any) => ({ id: item.id, title: item.title, orderIndex: item.orderIndex }))
           });
           
           const resolveOrderIndex = (
             primary: unknown,
             fallback: unknown,
             preferred: unknown,
             sourceIndex: number
           ): number => {
             if (typeof primary === 'number' && Number.isFinite(primary)) {
               return primary;
             }
             if (typeof fallback === 'number' && Number.isFinite(fallback)) {
               return fallback;
             }
             if (typeof preferred === 'number' && Number.isFinite(preferred)) {
               return preferred;
             }
             return sourceIndex;
           };

           const preferredModuleOrder = preferredOrderByModule?.get(module.id);
           const getPreferredOrder = (itemType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT', itemId: unknown) => {
             if (!preferredModuleOrder || typeof itemId !== 'number') {
               return undefined;
             }
             return preferredModuleOrder.get(`${itemType}:${itemId}`);
           };

           // Fetch full details for each lesson
           const fullLessons = await Promise.all(
             (lessonSummaries || []).map(async (summary, summaryIndex) => {
                const detail = await import('../../services/lessonService').then(m => m.getLessonById(summary.id));
                // Fetch attachments
                const attachments = await import('../../services/attachmentService').then(m => m.listAttachments(summary.id, user?.id || 0));
                return {
                  ...detail,
                  sourceOrderIndex: resolveOrderIndex((detail as any).orderIndex, (summary as any).orderIndex, undefined, summaryIndex),
                  preferredOrderIndex: getPreferredOrder('LESSON', summary.id),
                  attachments: normalizeAttachmentDrafts(attachments)
                };
             })
           );

           // Fetch full details for each quiz
            const fullQuizzes = await Promise.all(
              (quizSummaries || []).map(async (quiz, summaryIndex) => {
                 const details = await import('../../services/quizService').then(m => m.getQuizById(quiz.id));
                return {
                 ...details,
                 type: 'QUIZ',
                   sourceOrderIndex: resolveOrderIndex((details as any).orderIndex, (quiz as any).orderIndex, undefined, summaryIndex),
                   preferredOrderIndex: getPreferredOrder('QUIZ', quiz.id)
                };
              })
           );

           // Fetch full details for each assignment
            const fullAssignments = await Promise.all(
              (assignmentSummaries || []).map(async (assign, summaryIndex) => {
                 const details = await import('../../services/assignmentService').then(m => m.getAssignmentById(assign.id));
                return {
                 ...details,
                 type: 'ASSIGNMENT',
                   sourceOrderIndex: resolveOrderIndex((details as any).orderIndex, (assign as any).orderIndex, undefined, summaryIndex),
                   preferredOrderIndex: getPreferredOrder('ASSIGNMENT', assign.id)
                };
              })
           );

           // Merge lessons, quizzes, and assignments
           const mergedItems = [
                ...fullLessons.map((l, sourceIndex) => ({
                ...l,
                type: l.type || 'READING',
                 orderIndex: resolveOrderIndex((l as any).orderIndex, (l as any).sourceOrderIndex, (l as any).preferredOrderIndex, sourceIndex),
                  sourceOrderIndex: resolveOrderIndex((l as any).sourceOrderIndex, (l as any).orderIndex, (l as any).preferredOrderIndex, sourceIndex)
              })), // Ensure type
              ...fullQuizzes.map((q, sourceIndex) => ({
                 id: q.id,
                 title: q.title,
                 type: 'QUIZ',
                orderIndex: resolveOrderIndex((q as any).orderIndex, (q as any).sourceOrderIndex, (q as any).preferredOrderIndex, sourceIndex),
                 sourceOrderIndex: resolveOrderIndex((q as any).sourceOrderIndex, (q as any).orderIndex, (q as any).preferredOrderIndex, sourceIndex),
                 durationSec: (q as any).timeLimitMinutes ? (q as any).timeLimitMinutes * 60 : 0,
                 quizDescription: q.description,
                 passScore: q.passScore,
                 quizTimeLimitMinutes: (q as any).timeLimitMinutes,
                 quizMaxAttempts: (q as any).maxAttempts,
                 roundingIncrement: (q as any).roundingIncrement,
                 cooldownHours: (q as any).cooldownHours,
                 questions: ((q as any).questions || []).map((qu: any, qIndex: number) => ({
                    id: qu.id?.toString() || Date.now().toString(),
                    serverId: qu.id,
                    text: qu.questionText,
                    type: qu.questionType,
                    score: Number.isFinite(Number(qu.score)) && Number(qu.score) > 0 ? Number(qu.score) : 1,
                    orderIndex: qu.orderIndex ?? qIndex,
                    options: (qu.options || []).map((op: any, oIndex: number) => ({
                       id: op.id?.toString() || Date.now().toString(),
                       serverId: op.id,
                       text: op.optionText,
                       correct: op.correct,
                       orderIndex: op.orderIndex ?? oIndex
                    }))
                 }))
              })),
                  ...fullAssignments.map((a, sourceIndex) => ({
                     id: a.id,
                     title: a.title,
                     type: 'ASSIGNMENT',
                    orderIndex: resolveOrderIndex((a as any).orderIndex, (a as any).sourceOrderIndex, (a as any).preferredOrderIndex, sourceIndex),
                     sourceOrderIndex: resolveOrderIndex((a as any).sourceOrderIndex, (a as any).orderIndex, (a as any).preferredOrderIndex, sourceIndex),
                     durationSec: 0, // Assignment duration?
                     assignmentDescription: a.description,
                     assignmentSubmissionType: (a as any).submissionType || 'TEXT',
                     assignmentMaxScore: (a as any).maxScore,
                     assignmentPassingScore: (a as any).passingScore,
                     assignmentIsRequired: (a as any).isRequired,
                     assignmentCriteria: (a as any).criteria || [] // Map criteria back
                  }))
           ].sort((a, b) => {
             const orderDiff = (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
             if (orderDiff !== 0) {
               return orderDiff;
             }
             return ((a as any).sourceOrderIndex ?? 0) - ((b as any).sourceOrderIndex ?? 0);
           });

           debugCourseDraftOrder(`module ${module.id} merged items`, {
             moduleId: module.id,
             mergedItems: mergedItems.map((item: any, index: number) => ({
               index,
               id: item.id,
               type: item.type,
               title: item.title,
               orderIndex: item.orderIndex
             }))
           });

           return {
             ...module,
             lessons: mergedItems
           };
         })
       );

       return { ...course, modules: modulesWithLessons as any };
  };

  const createCourse = useCallback(async (modulesSnapshot?: any[], courseDataOverride?: Partial<CourseFormData>, thumbnailFile?: File): Promise<CourseDetailDTO | null> => {
    if (createCourseInFlight.current) {
      return await createCourseInFlight.current;
    }

    // Safety check: if we already have a course ID in state, we should update instead of create
    // We check this BEFORE setting loading state to avoid UI flicker or race conditions
    if (state.currentCourse?.id) {
       return updateCourse(state.currentCourse.id.toString(), modulesSnapshot, courseDataOverride, thumbnailFile);
    }

    const runCreate = (async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const formData = { ...state.courseForm, ...courseDataOverride };
        const courseCreateDTO: any = { 
          title: formData.title,
          description: formData.description,
          shortDescription: formData.summary,
          category: formData.category,
          level: formData.level,
          price: formData.price,
          currency: formData.currency,
          estimatedDurationHours: formData.estimatedDuration,
          language: formData.language,
          learningObjectives: formData.learningObjectives,
          requirements: formData.requirements
        };

        const courseService = await import('../../services/courseService');
        const moduleService = await import('../../services/moduleService');
        const lessonService = await import('../../services/lessonService');
        const quizService = await import('../../services/quizService');
        const assignmentService = await import('../../services/assignmentService');
        const attachmentService = await import('../../services/attachmentService'); // Import attachment service

        const savedCourse = await courseService.createCourse(user?.id || 0, courseCreateDTO, thumbnailFile);
        
        // Save Modules and Lessons if provided
        if (modulesSnapshot && modulesSnapshot.length > 0) {
           for (let i = 0; i < modulesSnapshot.length; i++) {
              const mod = modulesSnapshot[i];
              let moduleId = mod.serverId;
              
              const moduleDTO = {
                 title: mod.title,
                 description: mod.description,
                 orderIndex: i
              };

              if (moduleId) {
                 await moduleService.updateModule(moduleId, user?.id || 0, moduleDTO);
              } else {
                 const newMod = await moduleService.createModule(savedCourse.id, user?.id || 0, moduleDTO);
                 moduleId = newMod.id;
              }

              // Save Lessons & Quizzes
              if (mod.lessons && mod.lessons.length > 0) {
                 for (let j = 0; j < mod.lessons.length; j++) {
                    const lesson = mod.lessons[j];
                    const lessonId = lesson.serverId;

                    if (lesson.type === 'quiz') {
                       // Handle Quiz (existing logic)
                       const quizDTO: any = {
                          title: lesson.title,
                          description: lesson.quizDescription || '',
                          passScore: lesson.passScore || 80,
                          timeLimitMinutes: lesson.quizTimeLimitMinutes,
                          maxAttempts: lesson.quizMaxAttempts,
                          roundingIncrement: lesson.roundingIncrement,
                          gradingMethod: lesson.gradingMethod,
                          cooldownHours: lesson.cooldownHours,
                          orderIndex: j
                       };

                       let quizId = lessonId; 
                       
                       if (quizId) {
                          await quizService.updateQuiz(quizId, quizDTO, user?.id || 0);
                       } else {
                          const newQuiz = await quizService.createQuiz(moduleId, quizDTO, user?.id || 0);
                          quizId = newQuiz.id;
                       }

                       if (lesson.questions && lesson.questions.length > 0) {
                          for (let qIndex = 0; qIndex < lesson.questions.length; qIndex++) {
                             const q = lesson.questions[qIndex];
                             const questionText = q.questionText ?? q.text ?? '';
                             const questionType = q.questionType ?? q.type;
                             const scoreValue = Number(q.score);
                             const score = Number.isFinite(scoreValue) && scoreValue > 0 ? scoreValue : 1;
                             const orderIndex = q.orderIndex ?? qIndex;

                             const questionPayload = { questionText, questionType, score, orderIndex };

                             let savedQ;
                             if (q.serverId) {
                                 savedQ = await quizService.updateQuizQuestion(q.serverId, questionPayload as any, user?.id || 0);
                             } else {
                                 savedQ = await quizService.addQuizQuestion(quizId, { ...questionPayload, options: [] } as any, user?.id || 0);
                             }

                             if (q.options) {
                                for (let oIndex = 0; oIndex < q.options.length; oIndex++) {
                                   const opt = q.options[oIndex];
                                   const optionText = opt.optionText ?? opt.text ?? '';
                                   const correct = !!opt.correct;
                                   const optionOrderIndex = opt.orderIndex ?? oIndex;

                                   if (opt.serverId) {
                                       await quizService.updateQuizOption(
                                          opt.serverId,
                                          { optionText, correct, orderIndex: optionOrderIndex },
                                          user?.id || 0
                                       );
                                   } else {
                                       // Ensure we use the correct question ID from the saved question
                                       // If we just saved the question (create new), use savedQ.id
                                       // If we updated an existing question, use q.serverId (or savedQ.id which should be same)
                                       const targetQuestionId = savedQ?.id || q.serverId;
                                       if (targetQuestionId) {
                                           await quizService.addQuizOption(
                                              targetQuestionId,
                                              { optionText, correct, orderIndex: optionOrderIndex } as any,
                                              user?.id || 0
                                           );
                                       }
                                   }
                                }
                             }
                          }
                       }

                    } else if (lesson.type === 'assignment') {
                       // Handle Assignment
                      const assignmentDTO: any = {
                         title: lesson.title,
                         description: lesson.assignmentDescription || '',
                         submissionType: lesson.assignmentSubmissionType || 'TEXT',
                         maxScore: lesson.assignmentMaxScore || 100,
                         passingScore: lesson.assignmentPassingScore || 50,
                         isRequired: lesson.assignmentIsRequired,
                         orderIndex: j,
                         criteria: lesson.assignmentCriteria || [], // Map criteria
                         // AI Grading fields — was missing, causing aiGradingEnabled=false always
                         aiGradingEnabled: Boolean(lesson.aiGradingEnabled),
                         gradingStyle: (lesson.gradingStyle === 'STANDARD' || lesson.gradingStyle === 'STRICT' || lesson.gradingStyle === 'LENIENT')
                           ? lesson.gradingStyle
                           : 'STANDARD',
                         aiGradingPrompt: lesson.aiGradingPrompt || null,
                      };

                       let assignmentId = lessonId;
                       
                       if (assignmentId) {
                          await assignmentService.updateAssignment(assignmentId, assignmentDTO);
                       } else {
                          const newAssignment = await assignmentService.createAssignment(moduleId, assignmentDTO);
                          assignmentId = newAssignment.id;
                       }
                    } else {
                       // Handle Regular Lesson (Video / Reading)
                       const lessonDTO: any = {
                          title: lesson.title,
                          type: lesson.type?.toUpperCase(),
                          orderIndex: j,
                          durationSec: (lesson.durationMin || 0) * 60,
                          contentText: lesson.contentText,
                          resourceUrl: lesson.resourceUrl,
                          videoUrl: lesson.youtubeUrl,
                          videoMediaId: lesson.videoMediaId
                       };

                       let savedLesson;
                       if (lessonId) {
                          savedLesson = await lessonService.updateLesson(lessonId, lessonDTO, user?.id || 0);
                       } else {
                          savedLesson = await lessonService.createLesson(moduleId, lessonDTO, user?.id || 0);
                       }
                       
                       // Handle Attachments (Reading Lesson)
                       if (lesson.type === 'reading' && lesson.attachments && lesson.attachments.length > 0) {
                           for (const att of lesson.attachments) {
                               if (!att.serverId) {
                                   const attachmentRequest = buildAttachmentRequest(att);
                                   if (!attachmentRequest) {
                                      continue;
                                   }
                                   await attachmentService.addAttachment(savedLesson.id, attachmentRequest, user?.id || 0);
                               }
                           }
                       }
                    }
                 }
              }
           }
        }

        // Reload full course to get fresh state (including questions)
        const finalCourse = await fetchFullCourseDetails(savedCourse.id);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          currentCourse: finalCourse,
          modules: finalCourse.modules as any
        }));
        
        return finalCourse;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create course';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
        throw err;
      }
    })();

    createCourseInFlight.current = runCreate;
    try {
      return await runCreate;
    } finally {
      createCourseInFlight.current = null;
    }
  }, [state.courseForm, state.currentCourse?.id, user]);

  const updateCourse = useCallback(async (courseId: string, modulesSnapshot?: any[], courseDataOverride?: Partial<CourseFormData>, thumbnailFile?: File): Promise<CourseDetailDTO | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const id = Number(courseId);
      if (isNaN(id)) throw new Error('Invalid course ID');

      const formData = { ...state.courseForm, ...courseDataOverride };
      const courseUpdateDTO: any = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.summary,
        category: formData.category,
        level: formData.level,
        price: formData.price,
        currency: formData.currency,
        estimatedDurationHours: formData.estimatedDuration,
        language: formData.language,
        learningObjectives: formData.learningObjectives,
        requirements: formData.requirements
      };

      const courseService = await import('../../services/courseService');
      const moduleService = await import('../../services/moduleService');
      const lessonService = await import('../../services/lessonService');
      const quizService = await import('../../services/quizService');
      const assignmentService = await import('../../services/assignmentService');
      const attachmentService = await import('../../services/attachmentService');

      const updatedCourse = await courseService.updateCourse(id, courseUpdateDTO, user?.id || 0, thumbnailFile);
      
      const preferredOrderByModule = new Map<number, Map<string, number>>();

      // Save Modules and Lessons
      if (modulesSnapshot) {
         for (let i = 0; i < modulesSnapshot.length; i++) {
            const mod = modulesSnapshot[i];
            let moduleId = mod.serverId;
            
            const moduleDTO = {
               title: mod.title,
               description: mod.description,
               orderIndex: i
            };

            if (moduleId) {
               await moduleService.updateModule(moduleId, user?.id || 0, moduleDTO);
            } else {
               const newMod = await moduleService.createModule(id, user?.id || 0, moduleDTO);
               moduleId = newMod.id;
            }

            if (moduleId && Array.isArray(mod.lessons)) {
              const modulePreferredOrder = new Map<string, number>();
              mod.lessons.forEach((lesson: any, lessonIndex: number) => {
                if (typeof lesson?.serverId !== 'number') {
                  return;
                }
                const itemType = lesson.type === 'quiz'
                  ? 'QUIZ'
                  : lesson.type === 'assignment'
                    ? 'ASSIGNMENT'
                    : 'LESSON';
                modulePreferredOrder.set(`${itemType}:${lesson.serverId}`, lessonIndex);
              });
              preferredOrderByModule.set(moduleId, modulePreferredOrder);
            }

            const existingLessonIds = new Set<number>();
            const existingQuizIds = new Set<number>();
            const existingAssignmentIds = new Set<number>();

            if (moduleId) {
              const [existingLessons, existingQuizzes, existingAssignments] = await Promise.all([
                lessonService.listLessonsByModule(moduleId),
                quizService.listQuizzesByModule(moduleId),
                assignmentService.listAssignmentsByModule(moduleId)
              ]);

              (existingLessons || []).forEach((item: any) => {
                if (typeof item?.id === 'number') {
                  existingLessonIds.add(item.id);
                }
              });
              (existingQuizzes || []).forEach((item: any) => {
                if (typeof item?.id === 'number') {
                  existingQuizIds.add(item.id);
                }
              });
              (existingAssignments || []).forEach((item: any) => {
                if (typeof item?.id === 'number') {
                  existingAssignmentIds.add(item.id);
                }
              });
            }

            const keptLessonIds = new Set<number>();
            const keptQuizIds = new Set<number>();
            const keptAssignmentIds = new Set<number>();
            const snapshotLessons = Array.isArray(mod.lessons) ? mod.lessons : [];

            if (snapshotLessons.length > 0) {
               for (let j = 0; j < snapshotLessons.length; j++) {
                  const lesson = snapshotLessons[j];
                  const lessonId = lesson.serverId;

                  if (lesson.type === 'quiz') {
                     // Handle Quiz
                     const quizDTO: any = {
                        title: lesson.title,
                        description: lesson.quizDescription || '',
                        passScore: lesson.passScore || 80,
                        timeLimitMinutes: lesson.quizTimeLimitMinutes,
                        maxAttempts: lesson.quizMaxAttempts,
                        roundingIncrement: lesson.roundingIncrement,
                        gradingMethod: lesson.gradingMethod,
                        cooldownHours: lesson.cooldownHours,
                        orderIndex: j
                     };

                     let quizId = lessonId;
                     
                     if (quizId) {
                        await quizService.updateQuiz(quizId, quizDTO, user?.id || 0);
                     } else {
                        const newQuiz = await quizService.createQuiz(moduleId, quizDTO, user?.id || 0);
                        quizId = newQuiz.id;
                     }

                    if (typeof quizId === 'number') {
                      keptQuizIds.add(quizId);
                    }

                     if (lesson.questions && lesson.questions.length > 0) {
                        for (let qIndex = 0; qIndex < lesson.questions.length; qIndex++) {
                           const q = lesson.questions[qIndex];
                           const questionText = q.questionText ?? q.text ?? '';
                           const questionType = q.questionType ?? q.type;
                           const scoreValue = Number(q.score);
                           const score = Number.isFinite(scoreValue) && scoreValue > 0 ? scoreValue : 1;
                           const orderIndex = q.orderIndex ?? qIndex;

                           const questionPayload = { questionText, questionType, score, orderIndex };

                           let savedQ;
                           if (q.serverId) {
                              // Update existing question
                              savedQ = await quizService.updateQuizQuestion(q.serverId, questionPayload as any, user?.id || 0);
                           } else {
                              // Create new question
                              savedQ = await quizService.addQuizQuestion(quizId, { ...questionPayload, options: [] } as any, user?.id || 0);
                           }
                           
                           if (q.options) {
                              for (let oIndex = 0; oIndex < q.options.length; oIndex++) {
                                 const opt = q.options[oIndex];
                                 const optionText = opt.optionText ?? opt.text ?? '';
                                 const correct = !!opt.correct;
                                 const optionOrderIndex = opt.orderIndex ?? oIndex;

                                 if (opt.serverId) {
                                     await quizService.updateQuizOption(
                                        opt.serverId,
                                        { optionText, correct, orderIndex: optionOrderIndex },
                                        user?.id || 0
                                     );
                                 } else {
                                     // Ensure we use the correct question ID from the saved question
                                     // If we just saved the question (create new), use savedQ.id
                                     // If we updated an existing question, use q.serverId (or savedQ.id which should be same)
                                     const targetQuestionId = savedQ?.id || q.serverId;
                                     if (targetQuestionId) {
                                         await quizService.addQuizOption(
                                            targetQuestionId,
                                            { optionText, correct, orderIndex: optionOrderIndex } as any,
                                            user?.id || 0
                                         );
                                     }
                                 }
                              }
                           }
                        }
                     }

                  } else if (lesson.type === 'assignment') {
                     // Handle Assignment
                     const assignmentDTO: any = {
                        title: lesson.title,
                        description: lesson.assignmentDescription || '',
                        submissionType: lesson.assignmentSubmissionType || 'TEXT',
                        maxScore: lesson.assignmentMaxScore || 100,
                        passingScore: lesson.assignmentPassingScore || 50,
                        isRequired: lesson.assignmentIsRequired,
                        orderIndex: j,
                        criteria: lesson.assignmentCriteria || [], // Map criteria
                        // AI Grading fields — was missing, causing aiGradingEnabled=false always
                        aiGradingEnabled: Boolean(lesson.aiGradingEnabled),
                        gradingStyle: (lesson.gradingStyle === 'STANDARD' || lesson.gradingStyle === 'STRICT' || lesson.gradingStyle === 'LENIENT')
                          ? lesson.gradingStyle
                          : 'STANDARD',
                        aiGradingPrompt: lesson.aiGradingPrompt || null,
                     };

                     let assignmentId = lessonId;
                     
                     if (assignmentId) {
                        await assignmentService.updateAssignment(assignmentId, assignmentDTO);
                     } else {
                        const newAssignment = await assignmentService.createAssignment(moduleId, assignmentDTO);
                        assignmentId = newAssignment.id;
                     }

                    if (typeof assignmentId === 'number') {
                      keptAssignmentIds.add(assignmentId);
                    }
                  } else {
                     // Handle Regular Lesson (Video / Reading)
                     const lessonDTO: any = {
                        title: lesson.title,
                        type: lesson.type?.toUpperCase(),
                        orderIndex: j,
                        durationSec: (lesson.durationMin || 0) * 60,
                        contentText: lesson.contentText,
                        resourceUrl: lesson.resourceUrl,
                        videoUrl: lesson.youtubeUrl,
                        videoMediaId: lesson.videoMediaId
                     };

                     let savedLesson;
                     if (lessonId) {
                        savedLesson = await lessonService.updateLesson(lessonId, lessonDTO, user?.id || 0);
                     } else {
                        savedLesson = await lessonService.createLesson(moduleId, lessonDTO, user?.id || 0);
                     }

                     const resolvedLessonId = typeof savedLesson?.id === 'number'
                       ? savedLesson.id
                       : (typeof lessonId === 'number' ? lessonId : undefined);

                     if (typeof resolvedLessonId === 'number') {
                       keptLessonIds.add(resolvedLessonId);
                     }
                     
                     // Handle Attachments
                     if (lesson.type === 'reading' && lesson.attachments && lesson.attachments.length > 0) {
                         for (const att of lesson.attachments) {
                             if (!att.serverId) {
                                 const attachmentRequest = buildAttachmentRequest(att);
                                 if (!attachmentRequest) {
                                     continue;
                                 }
                                 await attachmentService.addAttachment(savedLesson.id, attachmentRequest, user?.id || 0);
                             }
                         }
                     }
                  }
               }
            }

            if (moduleId) {
              const staleLessonIds = Array.from(existingLessonIds).filter((existingId) => !keptLessonIds.has(existingId));
              const staleQuizIds = Array.from(existingQuizIds).filter((existingId) => !keptQuizIds.has(existingId));
              const staleAssignmentIds = Array.from(existingAssignmentIds).filter((existingId) => !keptAssignmentIds.has(existingId));

              for (const staleLessonId of staleLessonIds) {
                await lessonService.deleteLesson(staleLessonId, user?.id || 0);
              }

              for (const staleQuizId of staleQuizIds) {
                await quizService.deleteQuiz(staleQuizId, user?.id || 0);
              }

              for (const staleAssignmentId of staleAssignmentIds) {
                await assignmentService.deleteAssignment(staleAssignmentId);
              }
            }
         }
      }

      // Reload to ensure sync (including questions)
      const finalCourse = await fetchFullCourseDetails(id, preferredOrderByModule);
      setState(prev => ({ 
         ...prev, 
         isLoading: false, 
         currentCourse: finalCourse,
         modules: finalCourse.modules as any 
      }));
      return finalCourse;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update course';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw err;
    }
  }, [state.courseForm, user?.id]);

  const loadCourseForEdit = useCallback(async (courseId: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const id = Number(courseId);
      if (isNaN(id)) throw new Error('Invalid course ID');

      const courseWithDetails = await fetchFullCourseDetails(id);

      // 3. Update state
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentCourse: courseWithDetails,
        modules: courseWithDetails.modules as any, // Cast because of mixed types (Quiz vs Lesson)
        courseForm: {
          title: courseWithDetails.title,
          description: courseWithDetails.description,
          summary: courseWithDetails.shortDescription,
          category: courseWithDetails.category,
          level: courseWithDetails.level,
          price: courseWithDetails.price,
          currency: courseWithDetails.currency,
          thumbnailUrl: courseWithDetails.thumbnailUrl,
          estimatedDuration: courseWithDetails.estimatedDurationHours,
          language: courseWithDetails.language,
          learningObjectives: courseWithDetails.learningObjectives || [],
          requirements: courseWithDetails.requirements || [],
          status: courseWithDetails.status
        }
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load course';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, []);

  // ============================================================================
  // MODULE OPERATIONS
  // ============================================================================

  const addModule = useCallback(async (data: ModuleFormData): Promise<void> => {
    try {
      const newModule: ModuleWithLessons = {
        id: Date.now(),
        title: data.title,
        description: data.description || '',
        orderIndex: data.orderIndex,
        lessons: []
      };
      
      setState(prev => ({
        ...prev,
        modules: [...prev.modules, newModule]
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add module';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  const updateModule = useCallback(async (moduleId: string, data: Partial<ModuleFormData>): Promise<void> => {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map((m: ModuleWithLessons) => 
        m.id.toString() === moduleId ? { ...m, ...data } : m
      )
    }));
  }, []);

  const deleteModule = useCallback(async (moduleId: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      modules: prev.modules.filter((m: ModuleWithLessons) => m.id.toString() !== moduleId)
    }));
  }, []);

  const reorderModules = useCallback(async (newOrder: string[]): Promise<void> => {
    setState(prev => {
      const moduleMap = new Map(prev.modules.map((m: ModuleWithLessons) => [m.id.toString(), m]));
      const reorderedModules = newOrder
        .map((id: string, index: number) => {
          const module = moduleMap.get(id);
          return module ? { ...module, orderIndex: index } : null;
        })
        .filter((m): m is ModuleWithLessons => m !== null);
      
      return { ...prev, modules: reorderedModules };
    });
  }, []);

  // ============================================================================
  // LESSON OPERATIONS
  // ============================================================================

  const addLesson = useCallback(async (moduleId: number, data: LessonFormData): Promise<void> => {
    const newLesson: LessonSummaryDTO = {
      id: Date.now(),
      title: data.title,
      type: data.type as LessonType,
      orderIndex: data.orderIndex,
      durationSec: (data.duration || 0) * 60
    };
    
    setState(prev => ({
      ...prev,
      modules: prev.modules.map((m: ModuleWithLessons) =>
        m.id === moduleId
          ? { ...m, lessons: [...m.lessons, newLesson] }
          : m
      )
    }));
  }, []);

  const updateLesson = useCallback(async (
    moduleId: string, 
    lessonId: string, 
    data: Partial<LessonFormData>
  ): Promise<void> => {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map((m: ModuleWithLessons) =>
        m.id.toString() === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l: LessonSummaryDTO) =>
                l.id.toString() === lessonId 
                  ? { 
                      ...l, 
                      title: data.title ?? l.title,
                      durationSec: data.duration ? data.duration * 60 : l.durationSec
                    } 
                  : l
              )
            }
          : m
      )
    }));
  }, []);

  const deleteLesson = useCallback(async (moduleId: string, lessonId: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map((m: ModuleWithLessons) =>
        m.id.toString() === moduleId
          ? { ...m, lessons: m.lessons.filter((l: LessonSummaryDTO) => l.id.toString() !== lessonId) }
          : m
      )
    }));
  }, []);

  // ============================================================================
  // UTILITY
  // ============================================================================

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: CourseManagementContextType = {
    state,
    setWizardStep,
    updateCourseForm,
    createCourse,
    updateCourse,
    loadCourseForEdit,
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
    addLesson,
    updateLesson,
    deleteLesson,
    resetState,
    setError
  };

  return (
    <CourseManagementContext.Provider value={contextValue}>
      {children}
    </CourseManagementContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useCourseManagement = (): CourseManagementContextType => {
  const context = useContext(CourseManagementContext);
  if (context === undefined) {
    throw new Error('useCourseManagement must be used within a CourseManagementProvider');
  }
  return context;
};

export default CourseManagementContext;
