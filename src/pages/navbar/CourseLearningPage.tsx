import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  ClipboardList,
  ExternalLink,
  Gauge,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getCourse } from "../../services/courseService";
import { listModulesWithContent } from "../../services/moduleService";
import {
  getLessonById,
  completeLesson,
} from "../../services/lessonService";
import { getQuizAttemptStatus, getQuizForAttemptById, getUserQuizAttempts } from "../../services/quizService";
import {
  getCourseLearningRevisionInfo,
  getCourseLearningStatus,
  upgradeCourseToActiveRevision
} from "../../services/courseLearningService";
import { CourseDetailDTO, CourseStatus, ModuleSummaryDTO } from "../../data/courseDTOs";
import { LessonSummaryDTO, LessonDetailDTO } from "../../data/lessonDTOs";
import { QuizSummaryDTO, QuizDetailDTO, QuizAttemptDTO } from "../../data/quizDTOs";
import { AssignmentSummaryDTO } from "../../data/assignmentDTOs";
import { CourseLearningRevisionInfoDTO } from "../../data/courseLearningDTOs";
import {
  CourseLearningLocationState,
  LearningContentType,
  clearCourseLearningReturnContext,
  persistCourseLearningReturnContext,
  readStoredCourseLearningReturnContext,
  resolveCourseLearningOrigin,
} from "../../utils/courseLearningNavigation";
import { decodeCoursePublicId } from "../../utils/courseRoute";
import { hasAssignmentDueDate } from "../../utils/assignmentPresentation";
import { buildCertificateVerificationUrl } from "../../components/certificate/certificatePresentation";
import {
  BREAKING_ITEM_RETAKE_MESSAGE,
  mapReasonCodeToVietnameseMessage,
  mapUpgradeApiErrorToVietnameseMessage
} from "../../utils/courseRevisionMessages";
import { showAppInfo, showAppWarning } from "../../context/ToastContext";
import AttachmentManager from "../../components/course/AttachmentManager";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import usePremiumAccess from "../../hooks/usePremiumAccess";
import workspaceStyles from "./CourseLearningWorkspace.module.css";
import MeowlGuide from "../../components/meowl/MeowlGuide";

/**
 * Normalize mixed HTML+Markdown content so ReactMarkdown can parse it correctly.
 * Converts common HTML tags to their Markdown/plain equivalents.
 */
function normalizeContent(raw: string): string {
  return raw
    // <br>, <br/>, <br /> → newline
    .replace(/<br\s*\/?>/gi, '\n')
    // <p>...</p> → paragraph with double newline
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    // <strong>...</strong> → **...**
    .replace(/<strong>(.*?)<\/strong>/gis, '**$1**')
    // <em>...</em> → *...*
    .replace(/<em>(.*?)<\/em>/gis, '*$1*')
    // <b>...</b> → **...**
    .replace(/<b>(.*?)<\/b>/gis, '**$1**')
    // <i>...</i> → *...*
    .replace(/<i>(.*?)<\/i>/gis, '*$1*')
    // <h1>...</h1> through <h6>...</h6> → # heading
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gis, '#### $1\n')
    // <li>...</li> → - ...
    .replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n')
    // strip remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    // collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Import Neural HUD Components
import {
  NeuralInterfaceLayout,
  ModuleSidebar,
  VideoHudWrapper,
  ControlDeck,
} from "../../components/learning-hud";
import { type MeowlContextMode } from "../../services/meowlContextService";
import "../../styles/CourseLearningQuiz.css";

// --- LOCAL INTERFACES --- //

/** Module with full content including lessons, quizzes, and assignments */
interface ModuleWithContent {
  id: number;
  title: string;
  description?: string;
  orderIndex?: number;
  lessons?: LessonSummaryDTO[];
  quizzes?: QuizSummaryDTO[];
  assignments?: AssignmentSummaryDTO[];
}

/** Quiz detail combined with attempt status for display */
interface QuizWithAttemptStatus extends QuizDetailDTO {
  hasAttempts: boolean;
  hasPassed: boolean;
  bestAttempt: { passed: boolean; score: number } | null;
  latestAttempt: QuizAttemptDTO | null;
  attemptsCount: number;
  bestScore: number | null;
  totalAttempts: number;
  canRetry: boolean;
  secondsUntilRetry: number;
  nextRetryAt: string | null;
  maxAttempts: number;
  attemptsRemaining: number;
}

interface CurriculumItem {
  moduleId: number;
  moduleTitle: string;
  itemId: number;
  itemType: LearningContentType;
  title: string;
  orderIndex: number;
  assignment?: AssignmentSummaryDTO;
}

interface RevisionWarningDecoratedItem {
  revisionWarning?: boolean;
  revisionWarningMessage?: string | null;
}

type ItemStatus = "completed" | "in-progress";

const EMPTY_PROGRESS_STATE = {
  completedItems: 0,
  totalItems: 0,
  percent: 0,
  certificateId: null as number | null,
  certificateSerial: null as string | null,
  certificateRevoked: false,
  certificateRevokedAt: null as string | null,
};

const buildStatusKey = (
  moduleId: number,
  itemId: number,
  itemType: LearningContentType
) => `${moduleId}-${itemType}-${itemId}`;

const buildCurriculumItems = (modules: ModuleWithContent[]): CurriculumItem[] =>
  modules
    .slice()
    .sort((a, b) => {
      const orderDiff = (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return a.id - b.id;
    })
    .flatMap((module) => {
      const items: CurriculumItem[] = [
        ...(module.lessons ?? []).map((lesson) => ({
          moduleId: module.id,
          moduleTitle: module.title,
          itemId: lesson.id,
          itemType: "lesson" as const,
          title: lesson.title,
          orderIndex: lesson.orderIndex ?? 0,
        })),
        ...(module.quizzes ?? []).map((quiz) => ({
          moduleId: module.id,
          moduleTitle: module.title,
          itemId: quiz.id,
          itemType: "quiz" as const,
          title: quiz.title,
          orderIndex: quiz.orderIndex ?? 0,
        })),
        ...(module.assignments ?? []).map((assignment) => ({
          moduleId: module.id,
          moduleTitle: module.title,
          itemId: assignment.id,
          itemType: "assignment" as const,
          title: assignment.title,
          orderIndex: assignment.orderIndex ?? 0,
          assignment,
        })),
      ];

      const itemTypeRank: Record<LearningContentType, number> = {
        lesson: 0,
        quiz: 1,
        assignment: 2,
      };

      return items.sort((a, b) => {
        const orderDiff = a.orderIndex - b.orderIndex;
        if (orderDiff !== 0) return orderDiff;
        const typeDiff = itemTypeRank[a.itemType] - itemTypeRank[b.itemType];
        if (typeDiff !== 0) return typeDiff;
        return a.itemId - b.itemId;
      });
    });

const getItemRevisionWarningMessage = (
  item: Partial<RevisionWarningDecoratedItem> | null | undefined
) => {
  if (!item?.revisionWarning) {
    return null;
  }
  return BREAKING_ITEM_RETAKE_MESSAGE;
};

const formatShortDate = (dateString?: string) => {
  if (!dateString) return "Không giới hạn";

  return new Date(dateString).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const summarizeHtml = (html?: string) => {
  if (!html) return "Bài tập này đang chờ cập nhật mô tả chi tiết.";

  const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plainText) return "Bài tập này đang chờ cập nhật mô tả chi tiết.";

  return plainText.length > 220 ? `${plainText.slice(0, 220).trim()}...` : plainText;
};

const buildLessonDetailFromSummary = (lesson: LessonSummaryDTO): LessonDetailDTO => ({
  id: lesson.id,
  title: lesson.title,
  type: lesson.type,
  orderIndex: lesson.orderIndex ?? 0,
  durationSec: lesson.durationSec ?? 0,
  contentText: lesson.contentText,
  resourceUrl: lesson.resourceUrl,
  videoUrl: lesson.videoUrl,
  videoMediaId: lesson.videoMediaId,
  moduleId: 0,
  createdAt: '',
  updatedAt: '',
});

// --- MAIN COMPONENT --- //
const CourseLearningPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { coursePublicId } = useParams<{ courseSlug?: string; coursePublicId?: string }>();
  const routerState = (location.state as CourseLearningLocationState | null) ?? null;
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const queryCourseId = useMemo(() => {
    const rawCourseId = searchParams.get("courseId");
    if (!rawCourseId) return undefined;

    const parsedCourseId = Number(rawCourseId);
    return Number.isFinite(parsedCourseId) && parsedCourseId > 0
      ? parsedCourseId
      : undefined;
  }, [searchParams]);
  const routeCourseId = useMemo(
    () => decodeCoursePublicId(coursePublicId),
    [coursePublicId]
  );
  const isPreviewMode = searchParams.get("preview") === "1" || Boolean(routerState?.preview);
  const locationState = useMemo(() => {
    const storedContext = readStoredCourseLearningReturnContext();

    if (queryCourseId) {
      if (routerState) {
        return {
          ...routerState,
          courseId: queryCourseId,
          preview: isPreviewMode,
        };
      }

      if (storedContext?.courseId === queryCourseId) {
        return {
          ...storedContext,
          courseId: queryCourseId,
          preview: isPreviewMode,
        };
      }

      return {
        courseId: queryCourseId,
        preview: isPreviewMode,
      };
    }

    if (routeCourseId) {
      if (routerState) {
        return {
          ...routerState,
          courseId: routeCourseId,
          preview: isPreviewMode,
        };
      }

      if (storedContext?.courseId === routeCourseId) {
        return {
          ...storedContext,
          courseId: routeCourseId,
          preview: isPreviewMode,
        };
      }

      return {
        courseId: routeCourseId,
        preview: isPreviewMode,
      };
    }

    if (routerState?.courseId) {
      return {
        ...routerState,
        preview: isPreviewMode,
      };
    }

    return null;
  }, [isPreviewMode, queryCourseId, routeCourseId, routerState]);
  const courseId: number | undefined = locationState?.courseId;

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [modulesWithContent, setModulesWithContent] = useState<ModuleWithContent[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [activeModulePreviewId, setActiveModulePreviewId] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<{
    moduleId: number | null;
    lessonId: number | null;
    itemType: LearningContentType | null;
  }>({ moduleId: null, lessonId: null, itemType: null });
  const [activeLessonTitle, setActiveLessonTitle] = useState<string>("");
  const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>({});
  const [progress, setProgress] = useState<{
    completedItems: number;
    totalItems: number;
    percent: number;
    certificateId: number | null;
    certificateSerial: string | null;
    certificateRevoked: boolean;
    certificateRevokedAt: string | null;
  }>({ ...EMPTY_PROGRESS_STATE });
  const [revisionInfo, setRevisionInfo] = useState<CourseLearningRevisionInfoDTO | null>(null);
  const [revisionActionMessage, setRevisionActionMessage] = useState<string | null>(null);
  const [isUpgradingRevision, setIsUpgradingRevision] = useState(false);
  const [isRevisionInfoLoading, setIsRevisionInfoLoading] = useState(false);
  const [revisionInfoError, setRevisionInfoError] = useState<string | null>(null);
  const [activeLessonDetail, setActiveLessonDetail] = useState<LessonDetailDTO | null>(null);
  const [loadingLessonDetail, setLoadingLessonDetail] = useState(false);
  const [activeQuizDetail, setActiveQuizDetail] = useState<QuizWithAttemptStatus | null>(null);
  const { hasPremiumAccess, planName } = usePremiumAccess();

  // Countdown timer state cho quiz retry
  const [retryCountdown, setRetryCountdown] = useState<number>(0);

  useEffect(() => {
    setRevisionActionMessage(null);
  }, [courseId]);

  const curriculumItems = useMemo(
    () => buildCurriculumItems(modulesWithContent),
    [modulesWithContent]
  );

  const activeCurriculumItem = useMemo(
    () =>
      curriculumItems.find(
        (item) =>
          item.moduleId === activeLesson.moduleId &&
          item.itemId === activeLesson.lessonId &&
          item.itemType === activeLesson.itemType
      ) ?? null,
    [activeLesson.itemType, activeLesson.lessonId, activeLesson.moduleId, curriculumItems]
  );

  const activeItemType = activeCurriculumItem?.itemType ?? null;
  const activeAssignmentId =
    activeCurriculumItem?.itemType === "assignment"
      ? activeCurriculumItem.itemId
      : null;
  const activeAssignmentSummary =
    activeCurriculumItem?.itemType === "assignment"
      ? activeCurriculumItem.assignment ?? null
      : null;
  const activeStatusKey = activeCurriculumItem
    ? buildStatusKey(
      activeCurriculumItem.moduleId,
      activeCurriculumItem.itemId,
      activeCurriculumItem.itemType
    )
    : null;
  const isActiveItemCompleted = activeStatusKey
    ? itemStatuses[activeStatusKey] === "completed"
    : false;
  const quizAttemptsCount = Number(activeQuizDetail?.attemptsCount ?? 0);
  const quizHasAttemptHistory = quizAttemptsCount > 0;
  const quizBestScore = activeQuizDetail?.bestScore;
  const quizBestScorePassed = typeof quizBestScore === 'number'
    ? quizBestScore >= (activeQuizDetail?.passScore ?? 0)
    : false;
  const activeQuizRetrySeconds = activeQuizDetail?.secondsUntilRetry ?? 0;
  const shouldTrackQuizRetryCountdown = activeQuizRetrySeconds > 0;

  const quizStatsClass = activeQuizDetail
    ? `lhud-quiz-stats ${activeQuizDetail.hasAttempts ? 'lhud-quiz-stats--four-items' : 'lhud-quiz-stats--two-items'}`
    : 'lhud-quiz-stats';

  const activeItemWarningMessage = useMemo(() => {
    if (!activeCurriculumItem) {
      return null;
    }
    const module = modulesWithContent.find((candidate) => candidate.id === activeCurriculumItem.moduleId);
    if (!module) {
      return null;
    }

    if (activeCurriculumItem.itemType === "lesson") {
      const lesson = module.lessons?.find((candidate) => candidate.id === activeCurriculumItem.itemId);
      return getItemRevisionWarningMessage(lesson as RevisionWarningDecoratedItem | undefined);
    }

    if (activeCurriculumItem.itemType === "quiz") {
      const quiz = module.quizzes?.find((candidate) => candidate.id === activeCurriculumItem.itemId);
      return getItemRevisionWarningMessage(quiz as RevisionWarningDecoratedItem | undefined);
    }

    const assignment = module.assignments?.find((candidate) => candidate.id === activeCurriculumItem.itemId);
    return getItemRevisionWarningMessage(assignment as RevisionWarningDecoratedItem | undefined);
  }, [activeCurriculumItem, modulesWithContent]);

  // Effect để cập nhật countdown mỗi giây
  useEffect(() => {
    if (!shouldTrackQuizRetryCountdown) {
      setRetryCountdown(0);
      return;
    }

    setRetryCountdown(activeQuizRetrySeconds);

    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Reload quiz status khi countdown hết
          if (activeLesson.lessonId && user?.id) {
            getQuizAttemptStatus(activeLesson.lessonId, user.id).then((status) => {
              if (status) {
                setActiveQuizDetail((prevQuiz) => prevQuiz ? ({
                  ...prevQuiz,
                  canRetry: status.canRetry,
                  secondsUntilRetry: status.secondsUntilRetry,
                  attemptsCount: status.attemptsUsed,
                  attemptsRemaining: status.maxAttempts - status.attemptsUsed
                }) : null);
              }
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeLesson.lessonId, activeQuizRetrySeconds, shouldTrackQuizRetryCountdown, user?.id]);

  // Helper function để format countdown thành HH:MM:SS
  const formatCountdown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadCourseLearningState = useCallback(async (modules: ModuleWithContent[]) => {
    if (!courseId || isPreviewMode || !user?.id) {
      setProgress({ ...EMPTY_PROGRESS_STATE });
      setItemStatuses({});
      setRevisionInfo(null);
      setRevisionActionMessage(null);
      return;
    }

    setIsRevisionInfoLoading(true);
    const [statusResult, revisionInfoResult] = await Promise.allSettled([
      getCourseLearningStatus(courseId),
      getCourseLearningRevisionInfo(courseId)
    ]);

    if (statusResult.status === "fulfilled") {
      const status = statusResult.value;
      const completedLessons = new Set(status.completedLessonIds ?? []);
      const completedQuizzes = new Set(status.completedQuizIds ?? []);
      const completedAssignments = new Set(status.completedAssignmentIds ?? []);

      const completedStatuses = modules.reduce<Record<string, "completed">>((acc, module) => {
        for (const lesson of module.lessons ?? []) {
          if (completedLessons.has(lesson.id)) {
            acc[buildStatusKey(module.id, lesson.id, "lesson")] = "completed";
          }
        }
        for (const quiz of module.quizzes ?? []) {
          if (completedQuizzes.has(quiz.id)) {
            acc[buildStatusKey(module.id, quiz.id, "quiz")] = "completed";
          }
        }
        for (const assignment of module.assignments ?? []) {
          if (completedAssignments.has(assignment.id)) {
            acc[buildStatusKey(module.id, assignment.id, "assignment")] = "completed";
          }
        }
        return acc;
      }, {});

      setProgress({
        completedItems: status.completedItemCount ?? 0,
        totalItems: status.totalItemCount ?? 0,
        percent: status.percent ?? 0,
        certificateId: status.certificateId ?? null,
        certificateSerial: status.certificateSerial ?? null,
        certificateRevoked: Boolean(status.certificateRevoked),
        certificateRevokedAt: status.certificateRevokedAt ?? null,
      });
      setItemStatuses((prev) => {
        const inProgressEntries = Object.entries(prev).filter(([, statusValue]) => statusValue === "in-progress");
        return {
          ...(Object.fromEntries(inProgressEntries) as Record<string, "in-progress">),
          ...completedStatuses,
        };
      });
    } else {
      setProgress({ ...EMPTY_PROGRESS_STATE });
      setItemStatuses((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([, statusValue]) => statusValue === "in-progress")
        ) as Record<string, "in-progress">
      );
    }

    if (revisionInfoResult.status === "fulfilled") {
      setRevisionInfo(revisionInfoResult.value);
      setRevisionInfoError(null);
    } else {
      setRevisionInfo(null);
      setRevisionInfoError("Không tải được thông tin revision. Bạn vẫn có thể học bình thường.");
    }
    setIsRevisionInfoLoading(false);
  }, [courseId, isPreviewMode, user?.id]);

  const reloadModulesWithLearningState = useCallback(async (
    options?: {
      preferredItem?: {
        moduleId: number;
        itemId: number;
        itemType: LearningContentType;
      } | null;
      fallbackToResume?: boolean;
    }
  ) => {
    if (!courseId) {
      setModulesWithContent([]);
      setActiveModulePreviewId(null);
      setActiveLesson({ moduleId: null, lessonId: null, itemType: null });
      return;
    }

    try {
      const mods = await listModulesWithContent(courseId);
      const normalizedModules = mods as ModuleWithContent[];
      setModulesWithContent(normalizedModules);
      await loadCourseLearningState(normalizedModules);

      const curriculum = buildCurriculumItems(normalizedModules);
      const preferred = options?.preferredItem
        ? curriculum.find(
          (item) =>
            item.moduleId === options.preferredItem?.moduleId &&
            item.itemId === options.preferredItem?.itemId &&
            item.itemType === options.preferredItem?.itemType
        ) ?? null
        : null;
      const resumeItem = options?.fallbackToResume
        ? (locationState?.resumeItem
          ? curriculum.find(
            (item) =>
              item.moduleId === locationState.resumeItem?.moduleId &&
              item.itemId === locationState.resumeItem?.lessonId &&
              item.itemType === locationState.resumeItem?.itemType
          ) ?? null
          : null)
        : null;
      const nextItem = preferred ?? resumeItem ?? curriculum[0] ?? null;
      const hasExplicitTarget = Boolean(preferred ?? resumeItem);

      if (nextItem && hasExplicitTarget) {
        setExpandedModules([nextItem.moduleId]);
        setActiveModulePreviewId(null);
        setActiveLesson({
          moduleId: nextItem.moduleId,
          lessonId: nextItem.itemId,
          itemType: nextItem.itemType,
        });
      } else if (normalizedModules.length > 0) {
        const firstModuleId = normalizedModules[0].id;
        setExpandedModules([firstModuleId]);
        setActiveModulePreviewId(firstModuleId);
        setActiveLesson({ moduleId: null, lessonId: null, itemType: null });
      } else {
        setActiveModulePreviewId(null);
        setActiveLesson({ moduleId: null, lessonId: null, itemType: null });
      }
    } catch {
      setModulesWithContent([]);
    }
  }, [courseId, loadCourseLearningState, locationState?.resumeItem]);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getCourse(courseId)
      .then((dto) => setCourse(dto))
      .catch(() => { })
      .finally(() => setLoading(false));

    // Load modules + lessons for sidebar content
    void reloadModulesWithLearningState({ fallbackToResume: true });
  }, [courseId, isPreviewMode, reloadModulesWithLearningState]);

  useEffect(() => {
    setActiveLessonTitle(activeCurriculumItem?.title ?? "");
  }, [activeCurriculumItem]);

  const buildReturnContext = useCallback(
    (item: CurriculumItem | null = activeCurriculumItem): CourseLearningLocationState => ({
      courseId,
      courseTitle: course?.title,
      preview: isPreviewMode,
      origin: locationState?.origin,
      resumeItem: item
        ? {
          moduleId: item.moduleId,
          lessonId: item.itemId,
          itemType: item.itemType,
        }
        : undefined,
    }),
    [activeCurriculumItem, course?.title, courseId, isPreviewMode, locationState?.origin]
  );

  useEffect(() => {
    if (!courseId) {
      return;
    }
    persistCourseLearningReturnContext(buildReturnContext(activeCurriculumItem));
  }, [activeCurriculumItem, buildReturnContext, courseId]);

  // Load content (lesson, quiz, or assignment) when active item changes - LAZY LOADING
  useEffect(() => {
    if (!activeCurriculumItem) {
      setActiveLessonDetail(null);
      setActiveQuizDetail(null);
      return;
    }

    setLoadingLessonDetail(true);

    if (activeCurriculumItem.itemType === "assignment") {
      setActiveLessonDetail(null);
      setActiveQuizDetail(null);
      setLoadingLessonDetail(false);
    } else if (activeCurriculumItem.itemType === "quiz") {
      // LAZY LOAD QUIZ + CHECK ATTEMPTS với API mới có countdown
      setActiveLessonDetail(null);
      if (activeCurriculumItem.itemId <= 0) {
        setActiveQuizDetail(null);
        setLoadingLessonDetail(false);
        return;
      }

      Promise.all([
        getQuizForAttemptById(activeCurriculumItem.itemId),
        getQuizAttemptStatus(activeCurriculumItem.itemId, user?.id || 0).catch(() => null),
        user?.id
          ? getUserQuizAttempts(activeCurriculumItem.itemId, user.id).catch(() => [])
          : Promise.resolve([])
      ])
        .then(([quiz, attemptStatus, attempts]) => {
          if (attemptStatus) {
            const latestAttempt = attempts[0] ?? attemptStatus.recentAttempts?.[0] ?? null;
            // Sử dụng dữ liệu từ API mới
            setActiveQuizDetail({
              ...quiz,
              hasAttempts: attempts.length > 0 || attemptStatus.attemptsUsed > 0,
              hasPassed: attemptStatus.hasPassed,
              bestAttempt: attemptStatus.hasPassed ? { passed: true, score: attemptStatus.bestScore } : null,
              latestAttempt,
              attemptsCount: attemptStatus.attemptsUsed,
              bestScore: attemptStatus.bestScore,
              totalAttempts: attempts.length || attemptStatus.recentAttempts?.length || attemptStatus.attemptsUsed,
              // Thông tin countdown mới
              canRetry: attemptStatus.canRetry,
              secondsUntilRetry: attemptStatus.secondsUntilRetry,
              nextRetryAt: attemptStatus.nextRetryAt,
              maxAttempts: attemptStatus.maxAttempts,
              attemptsRemaining: attemptStatus.maxAttempts - attemptStatus.attemptsUsed
            });
          } else {
            // Fallback nếu API thất bại
            setActiveQuizDetail({
              ...quiz,
              hasAttempts: false,
              hasPassed: false,
              bestAttempt: null,
              latestAttempt: null,
              attemptsCount: 0,
              bestScore: null,
              totalAttempts: 0,
              canRetry: true,
              secondsUntilRetry: 0,
              nextRetryAt: null,
              maxAttempts: 3,
              attemptsRemaining: 3
            });
          }
        })
        .catch((err) => {
          console.error('[QUIZ] Failed:', err);
          setActiveQuizDetail(null);
        })
        .finally(() => setLoadingLessonDetail(false));
    } else {
      // LAZY LOAD LESSON
      setActiveQuizDetail(null);
      const module = modulesWithContent.find((m) => m.id === activeCurriculumItem.moduleId);
      const lessonSummary = module?.lessons?.find((lesson) => lesson.id === activeCurriculumItem.itemId);

      if (lessonSummary) {
        setActiveLessonDetail(buildLessonDetailFromSummary(lessonSummary));
        setLoadingLessonDetail(false);
      } else {
        getLessonById(activeCurriculumItem.itemId)
          .then((detail) => {
            setActiveLessonDetail(detail);
          })
          .catch((err) => {
            console.error('[LESSON] Failed:', err);
            setActiveLessonDetail(null);
          })
          .finally(() => setLoadingLessonDetail(false));
      }
    }
  }, [activeCurriculumItem, modulesWithContent, user?.id]);

  const sortedModules = useMemo((): ModuleSummaryDTO[] => {
    const list = course?.modules ? [...course.modules] : [];
    return list.sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );
  }, [course]);

  const progressPercentage = useMemo(() => progress.percent || 0, [progress]);
  const moduleSourceForView = modulesWithContent.length ? modulesWithContent : sortedModules;
  const activeModulePreview = useMemo(
    () => moduleSourceForView.find((module) => module.id === activeModulePreviewId) ?? null,
    [activeModulePreviewId, moduleSourceForView]
  );
  const activeCurriculumIndex = useMemo(
    () =>
      activeCurriculumItem
        ? curriculumItems.findIndex(
          (item) =>
            item.moduleId === activeCurriculumItem.moduleId &&
            item.itemId === activeCurriculumItem.itemId &&
            item.itemType === activeCurriculumItem.itemType
        )
        : -1,
    [activeCurriculumItem, curriculumItems]
  );
  const hasNewerRevisionRaw = Boolean(
    !isPreviewMode && revisionInfo?.hasNewerRevision && courseId
  );
  const isCourseCompleted = progress.percent >= 100;
  const hasActiveCertificate = Boolean(progress.certificateId);
  const shouldSuppressNewRevisionBanner = isCourseCompleted && hasActiveCertificate;
  const hasNewerRevision = hasNewerRevisionRaw && !shouldSuppressNewRevisionBanner;
  const canUpgradeRevision = hasNewerRevision && !hasActiveCertificate;
  const requiresManualUpgradeGate = canUpgradeRevision && !isCourseCompleted;

  const handleToggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const isExpanded = prev.includes(moduleId);
      const isCurrentPreview = activeModulePreviewId === moduleId;

      // If user clicks the same module that is already in preview mode, treat as close/toggle off.
      if (isExpanded && isCurrentPreview) {
        setActiveModulePreviewId(null);
        setActiveLesson({ moduleId: null, lessonId: null, itemType: null });
        return prev.filter((id) => id !== moduleId);
      }

      // Single click should always show module overview immediately.
      setActiveModulePreviewId(moduleId);
      setActiveLesson({ moduleId: null, lessonId: null, itemType: null });
      return isExpanded ? prev : [...prev, moduleId];
    });
  };

  const handleExitCourseLearning = useCallback(() => {
    const target = resolveCourseLearningOrigin(locationState, "/courses");
    clearCourseLearningReturnContext();
    navigate(
      {
        pathname: target.pathname,
        search: target.search,
        hash: target.hash,
      },
      { replace: true }
    );
  }, [locationState, navigate]);

  const handleOpenCertificate = useCallback(() => {
    if (!progress.certificateId) {
      return;
    }

    navigate(`/certificate/${progress.certificateId}`);
  }, [navigate, progress.certificateId]);

  const handleCopyCertificateVerificationLink = useCallback(async () => {
    if (!progress.certificateSerial) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        buildCertificateVerificationUrl(progress.certificateSerial)
      );
    } catch {
      // Clipboard access can fail outside secure/browser-supported contexts.
    }
  }, [progress.certificateSerial]);

  const handleUpgradeToActiveRevision = useCallback(async () => {
    if (!courseId || isPreviewMode || isUpgradingRevision || !canUpgradeRevision) {
      return;
    }

    try {
      setIsUpgradingRevision(true);
      setRevisionActionMessage(null);
      const upgraded = await upgradeCourseToActiveRevision(courseId);
      setRevisionInfo(upgraded);
      if (upgraded.hasNewerRevision) {
        setRevisionActionMessage(
          mapReasonCodeToVietnameseMessage(
            "ITEM_RULE_CHANGED",
            "Revision mới có thay đổi lớn. Bạn cần nâng cấp thủ công sang phiên bản mới trước khi tiếp tục học."
          )
        );
      } else {
        setRevisionActionMessage("Đã chuyển sang phiên bản mới.");
      }
      await reloadModulesWithLearningState({
        preferredItem: activeCurriculumItem
          ? {
            moduleId: activeCurriculumItem.moduleId,
            itemId: activeCurriculumItem.itemId,
            itemType: activeCurriculumItem.itemType,
          }
          : null,
        fallbackToResume: false,
      });
    } catch (error) {
      const rawMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setRevisionActionMessage(mapUpgradeApiErrorToVietnameseMessage(rawMessage));
    } finally {
      setIsUpgradingRevision(false);
    }
  }, [
    courseId,
    canUpgradeRevision,
    isPreviewMode,
    isUpgradingRevision,
    activeCurriculumItem,
    reloadModulesWithLearningState
  ]);

  const handleSelectLesson = (
    moduleId: number,
    lessonId: number,
    itemType?: string
  ) => {
    if (requiresManualUpgradeGate) {
      setRevisionActionMessage("Vui lòng chuyển sang phiên bản mới để tiếp tục học.");
      return;
    }

    const selectedItem = curriculumItems.find(
      (item) =>
        item.moduleId === moduleId &&
        item.itemId === lessonId &&
        (!itemType || item.itemType === itemType)
    );

    setActiveLesson({
      moduleId,
      lessonId,
      itemType: (selectedItem?.itemType ?? null) as LearningContentType | null,
    });
    setExpandedModules((prev) => (prev.includes(moduleId) ? prev : [...prev, moduleId]));
    setActiveModulePreviewId(null);
    if (selectedItem?.itemType === "lesson") {
      const statusKey = buildStatusKey(moduleId, lessonId, "lesson");
      if (itemStatuses[statusKey] !== "completed") {
        setItemStatuses((prev) => ({ ...prev, [statusKey]: "in-progress" }));
      }
    }
  };

  const handleMarkAsComplete = async () => {
    if (!activeLesson.moduleId || !activeLesson.lessonId || activeItemType !== "lesson") return;
    if (isPreviewMode || isActiveItemCompleted) return;
    if (requiresManualUpgradeGate) {
      setRevisionActionMessage("Vui lòng chuyển sang phiên bản mới để tiếp tục học.");
      return;
    }
    const userId = user?.id || 0;
    if (!userId) return;
    try {
      await completeLesson(
        activeLesson.moduleId,
        activeLesson.lessonId,
        userId
      );
      await loadCourseLearningState(modulesWithContent);
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
  };

  const handleNextLesson = () => {
    if (requiresManualUpgradeGate) {
      setRevisionActionMessage("Vui lòng chuyển sang phiên bản mới để tiếp tục học.");
      return;
    }

    if (!activeCurriculumItem) return;

    const activeIndex = curriculumItems.findIndex(
      (item) =>
        item.moduleId === activeCurriculumItem.moduleId &&
        item.itemId === activeCurriculumItem.itemId &&
        item.itemType === activeCurriculumItem.itemType
    );
    const nextItem = activeIndex >= 0 ? curriculumItems[activeIndex + 1] : null;

    if (nextItem) {
      handleSelectLesson(nextItem.moduleId, nextItem.itemId, nextItem.itemType);
    } else {
      showAppInfo("Hoàn thành module", "Chúc mừng! Bạn đã hoàn thành module này.");
    }
  };

  const handlePrevLesson = () => {
    if (requiresManualUpgradeGate) {
      setRevisionActionMessage("Vui lòng chuyển sang phiên bản mới để tiếp tục học.");
      return;
    }

    if (!activeCurriculumItem) return;

    const activeIndex = curriculumItems.findIndex(
      (item) =>
        item.moduleId === activeCurriculumItem.moduleId &&
        item.itemId === activeCurriculumItem.itemId &&
        item.itemType === activeCurriculumItem.itemType
    );
    const prevItem = activeIndex > 0 ? curriculumItems[activeIndex - 1] : null;

    if (prevItem) {
      handleSelectLesson(prevItem.moduleId, prevItem.itemId, prevItem.itemType);
    }
  };

  const handleOpenAssignmentPage = () => {
    if (!courseId || !activeCurriculumItem || activeCurriculumItem.itemType !== "assignment") {
      return;
    }
    if (requiresManualUpgradeGate) {
      setRevisionActionMessage("Vui lòng chuyển sang phiên bản mới để tiếp tục học.");
      return;
    }
    if (activeCurriculumItem.itemId <= 0) {
      showAppWarning(
        "Bài tập chưa sẵn sàng",
        "Bài tập này chưa sẵn sàng do chưa đồng bộ định danh. Vui lòng thử lại sau."
      );
      return;
    }

    const returnContext = buildReturnContext(activeCurriculumItem);
    persistCourseLearningReturnContext(returnContext);
    navigate(`/assignment/${activeCurriculumItem.itemId}`, { state: returnContext });
  };

  const handleOpenQuizAttemptPage = useCallback((view: 'start' | 'result' = 'start') => {
    if (!activeCurriculumItem || activeCurriculumItem.itemType !== "quiz") {
      return;
    }
    if (requiresManualUpgradeGate) {
      setRevisionActionMessage("Vui lòng chuyển sang phiên bản mới để tiếp tục học.");
      return;
    }
    if (activeCurriculumItem.itemId <= 0) {
      showAppWarning(
        "Quiz chưa sẵn sàng",
        "Quiz này chưa sẵn sàng do chưa đồng bộ định danh. Vui lòng thử lại sau."
      );
      return;
    }

    const returnContext = buildReturnContext(activeCurriculumItem);
    persistCourseLearningReturnContext(returnContext);
    const params = new URLSearchParams();
    if (view === 'result') {
      params.set('view', 'result');
    }

    navigate(
      {
        pathname: `/quiz/${activeCurriculumItem.itemId}/attempt`,
        search: params.toString() ? `?${params.toString()}` : '',
      },
      { state: returnContext }
    );
  }, [activeCurriculumItem, buildReturnContext, navigate, requiresManualUpgradeGate]);

  const completeDeckConfig = useMemo(() => {
    if (isPreviewMode) {
      return {
        canComplete: false,
        completeLabel: "Chế độ xem trước",
        completeState: "blocked" as const,
      };
    }

    if (requiresManualUpgradeGate) {
      return {
        canComplete: false,
        completeLabel: "Cần nâng cấp revision để học tiếp",
        completeState: "blocked" as const,
      };
    }

    if (activeItemType === "lesson") {
      return {
        canComplete: !!activeLesson.moduleId && !isActiveItemCompleted,
        completeLabel: isActiveItemCompleted ? "Đã hoàn thành" : "Đánh dấu hoàn thành",
        completeState: isActiveItemCompleted ? "completed" as const : "ready" as const,
      };
    }

    if (activeItemType === "quiz") {
      return {
        canComplete: false,
        completeLabel: isActiveItemCompleted ? "Quiz đã đạt" : "Hoàn thành khi đạt quiz",
        completeState: isActiveItemCompleted ? "completed" as const : "blocked" as const,
      };
    }

    if (activeItemType === "assignment") {
      return {
        canComplete: false,
        completeLabel: isActiveItemCompleted ? "Bài tập đã đạt" : "Hoàn thành sau khi pass",
        completeState: isActiveItemCompleted ? "completed" as const : "blocked" as const,
      };
    }

    return {
      canComplete: false,
      completeLabel: "Chọn nội dung để bắt đầu",
      completeState: "blocked" as const,
    };
  }, [activeItemType, activeLesson.moduleId, isActiveItemCompleted, isPreviewMode, requiresManualUpgradeGate]);

  const meowlPanelMode: MeowlContextMode = "MODE_COURSE_LEARNING";

  const meowlPanelSummary = useMemo(() => {
    const summary: string[] = [];

    if (course?.title) {
      summary.push(`Khóa học: ${course.title}`);
    }

    if (activeCurriculumItem?.moduleTitle) {
      summary.push(`Chương: ${activeCurriculumItem.moduleTitle}`);
    }

    if (activeLessonTitle) {
      summary.push(`Nội dung hiện tại: ${activeLessonTitle}`);
    }

    if (activeItemType === "quiz" && activeQuizDetail) {
      summary.push(`Điểm đạt quiz: ${activeQuizDetail.passScore}%`);
      summary.push(`Số lượt đã dùng: ${quizAttemptsCount}/${activeQuizDetail.maxAttempts}`);
    }

    if (activeItemType === "assignment" && activeAssignmentSummary) {
      summary.push(`Loại bài tập: ${activeAssignmentSummary.submissionType}`);
      if (activeAssignmentSummary.dueAt) {
        summary.push(`Hạn nộp: ${formatShortDate(activeAssignmentSummary.dueAt)}`);
      }
    }

    if (activeLessonDetail?.type === "READING") {
      summary.push("Bài đọc: ưu tiên câu hỏi gợi mở, không tóm tắt thay toàn bộ.");
    }

    if (activeLessonDetail?.type === "VIDEO") {
      summary.push("Bài video: không giả vờ biết transcript ẩn hoặc nội dung chưa được cung cấp.");
    }

    return summary;
  }, [
    activeAssignmentSummary,
    activeCurriculumItem?.moduleTitle,
    activeItemType,
    activeLessonDetail?.type,
    activeLessonTitle,
    activeQuizDetail,
    course?.title,
    quizAttemptsCount,
  ]);

  if (loading) {
    return (
      <NeuralInterfaceLayout
        courseTitle="ĐANG TẢI..."
        progress={{ percent: 0 }}
        isSidebarOpen={false}
        onToggleSidebar={() => { }}
        onBack={handleExitCourseLearning}
      >
        <main className="learning-hud-main-content">
          <div className="learning-hud-content-viewer">
            <div className="learning-hud-loading">ĐANG KẾT NỐI DỮ LIỆU KHÓA HỌC...</div>
          </div>
        </main>
      </NeuralInterfaceLayout>
    );
  }

  if (!course) {
    return (
      <NeuralInterfaceLayout
        courseTitle="LỖI"
        progress={{ percent: 0 }}
        isSidebarOpen={false}
        onToggleSidebar={() => { }}
        onBack={handleExitCourseLearning}
      >
        <main className="learning-hud-main-content">
          <div className="learning-hud-content-viewer">
            <h1 className="learning-hud-viewer-title">KHÔNG TÌM THẤY KHÓA HỌC</h1>
            <p className="lhud-text-secondary">
              Không thể kết nối đến dữ liệu khóa học. Vui lòng thử lại sau.
            </p>
          </div>
        </main>
      </NeuralInterfaceLayout>
    );
  }

  if (course.status === CourseStatus.SUSPENDED && !isPreviewMode) {
    return (
      <NeuralInterfaceLayout
        courseTitle={course.title}
        progress={{ percent: 0 }}
        isSidebarOpen={false}
        onToggleSidebar={() => { }}
        onBack={handleExitCourseLearning}
      >
        <main className="learning-hud-main-content">
          <div className="learning-hud-content-viewer" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <h1 className="learning-hud-viewer-title" style={{ color: '#fbbf24' }}>KHÓA HỌC TẠM KHÓA</h1>
            <p className="lhud-text-secondary" style={{ maxWidth: 520, margin: '1rem auto' }}>
              Khóa học này đang bị tạm khóa bởi quản trị viên để xem xét.
              Tiến độ học tập của bạn được giữ nguyên và sẽ khả dụng trở lại
              khi khóa học được mở lại.
            </p>
            <button
              className="learning-hud-nav-button"
              onClick={handleExitCourseLearning}
              style={{ marginTop: '1.5rem' }}
            >
              Quay lại danh sách khóa học
            </button>
          </div>
        </main>
      </NeuralInterfaceLayout>
    );
  }

  return (
    <NeuralInterfaceLayout
      courseTitle={course.title}
      courseDescription={course.description}
      progress={{ percent: progressPercentage }}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      onBack={handleExitCourseLearning}
    >
      {/* Sidebar */}
      <ModuleSidebar
        modules={modulesWithContent.length ? modulesWithContent : sortedModules}
        expandedModules={expandedModules}
        activeLesson={activeLesson}
        itemStatuses={itemStatuses}
        progress={progress}
        onToggleModule={handleToggleModule}
        onSelectLesson={handleSelectLesson}
        disableLessonSelection={requiresManualUpgradeGate}
        onLockedLessonSelect={() => setRevisionActionMessage("Vui lòng chuyển sang phiên bản mới để tiếp tục học.")}
        isOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <main className="learning-hud-main-content">
        <div
          className={workspaceStyles.workspace}
        >
          <div className={workspaceStyles.mainPane}>
            <div className="learning-hud-content-viewer">
              <h1 className="learning-hud-viewer-title">
                {activeLessonTitle || activeModulePreview?.title || course.title}
              </h1>
              {isPreviewMode && (
                <div className="lhud-preview-banner">
                  <strong>Chế độ xem trước:</strong> Bạn có thể xem nội dung như học viên, nhưng không thể làm bài, nộp bài hoặc đánh dấu hoàn thành.
                </div>
              )}
              {hasNewerRevision && revisionInfo && (
                <div className="lhud-revision-banner">
                  <div>
                    <strong>Khóa học đã có phiên bản mới</strong>
                    <p>
                      Khóa học đã có phiên bản mới, vui lòng cập nhật để tiếp tục học đúng quy định của khóa học.
                    </p>
                    {revisionActionMessage && (
                      <p className="lhud-revision-banner__message">{revisionActionMessage}</p>
                    )}
                  </div>
                  {canUpgradeRevision && (
                    <div className="lhud-revision-banner__actions">
                      <button
                        type="button"
                        className="learning-hud-secondary-btn"
                        onClick={() => void handleUpgradeToActiveRevision()}
                        disabled={isUpgradingRevision}
                      >
                        {isUpgradingRevision ? "Đang nâng cấp..." : "Chuyển sang phiên bản mới"}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {!isPreviewMode && isRevisionInfoLoading && (
                <div className="lhud-revision-banner">
                  <div>
                    <strong>Đang đồng bộ revision...</strong>
                    <p>Hệ thống đang kiểm tra phiên bản học hiện tại của bạn.</p>
                  </div>
                </div>
              )}
              {!isPreviewMode && revisionInfoError && (
                <div className="lhud-revision-banner is-warning">
                  <div>
                    <strong>Lưu ý về revision</strong>
                    <p>{revisionInfoError}</p>
                  </div>
                </div>
              )}
              {!hasNewerRevision && revisionActionMessage && (
                <div className="lhud-revision-banner is-success">
                  <div>
                    <strong>Revision đã đồng bộ</strong>
                    <p className="lhud-revision-banner__message">{revisionActionMessage}</p>
                  </div>
                </div>
              )}
              {!isPreviewMode && activeItemWarningMessage && (
                <div className="lhud-revision-banner is-warning">
                  <div>
                    <strong>Nội dung cần làm lại</strong>
                    <p>{activeItemWarningMessage}</p>
                  </div>
                </div>
              )}
              {!isPreviewMode && progress.percent >= 100 && progress.certificateId && (
                <div className="lhud-certificate-banner">
                  <div>
                    <strong>Chứng chỉ đã được cấp</strong>
                    <p>
                      Bạn đã hoàn thành khóa học. Trang chứng chỉ riêng tư dành cho bạn đã sẵn sàng; nếu muốn gửi cho người khác, hãy sao chép liên kết xác thực công khai.
                    </p>
                  </div>
                  <div className="lhud-certificate-banner__actions">
                    {progress.certificateSerial && (
                      <button
                        type="button"
                        className="learning-hud-secondary-btn"
                        onClick={handleCopyCertificateVerificationLink}
                      >
                        <LinkIcon size={16} />
                        Sao chép liên kết công khai
                      </button>
                    )}
                    <button
                      type="button"
                      className="learning-hud-secondary-btn"
                      onClick={handleOpenCertificate}
                    >
                      <ExternalLink size={16} />
                      Xem chứng chỉ
                    </button>
                  </div>
                </div>
              )}
              {!isPreviewMode && progress.percent >= 100 && !progress.certificateId && progress.certificateRevoked && (
                <div className="lhud-certificate-banner is-revoked">
                  <div>
                    <strong>Chứng chỉ đã bị thu hồi</strong>
                    <p>
                      Bạn đã hoàn thành khóa học nhưng chứng chỉ hiện không còn hiệu lực.
                      {progress.certificateRevokedAt
                        ? ` Thời điểm thu hồi: ${new Date(progress.certificateRevokedAt).toLocaleString("vi-VN")}.`
                        : ""}
                    </p>
                  </div>
                </div>
              )}

              <div className="learning-hud-reading-content">
                {loadingLessonDetail ? (
                  <div className="learning-hud-loading">ĐANG TẢI DÒNG DỮ LIỆU</div>
                ) : activeItemType === 'assignment' && activeAssignmentId ? (
                  <div className="lhud-assignment-brief-shell">
                    <section className="lhud-assignment-brief">
                      <div className="lhud-assignment-brief-header">
                        <div>
                          <div className="lhud-assignment-brief-breadcrumb">
                            {activeCurriculumItem?.moduleTitle || "Chương"} › Bài tập thực hành
                          </div>
                          <h2 className="lhud-assignment-brief-title">
                            {activeAssignmentSummary?.title || activeLessonTitle}
                          </h2>
                        </div>
                        <span className="lhud-assignment-brief-badge">
                          <ClipboardList size={16} />
                          Bài tập
                        </span>
                      </div>

                      <p className="lhud-assignment-brief-description">
                        {summarizeHtml(activeAssignmentSummary?.description)}
                      </p>

                      <div className="lhud-assignment-brief-grid">
                        <div className="lhud-assignment-brief-stat">
                          <Gauge size={16} />
                          <div>
                            <span>Điểm tối đa</span>
                            <strong>{activeAssignmentSummary?.maxScore ?? 0} điểm</strong>
                          </div>
                        </div>
                        <div className="lhud-assignment-brief-stat">
                          <LinkIcon size={16} />
                          <div>
                            <span>Hình thức nộp</span>
                            <strong>{activeAssignmentSummary?.submissionType ?? "Đang cập nhật"}</strong>
                          </div>
                        </div>
                        {hasAssignmentDueDate(activeAssignmentSummary?.dueAt) && (
                          <div className="lhud-assignment-brief-stat">
                            <Calendar size={16} />
                            <div>
                              <span>Hạn nộp</span>
                              <strong>{formatShortDate(activeAssignmentSummary?.dueAt)}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="lhud-assignment-brief-actions">
                        {!isPreviewMode && (
                          <button
                            type="button"
                            className="learning-hud-secondary-btn"
                            onClick={handleOpenAssignmentPage}
                            disabled={requiresManualUpgradeGate}
                          >
                            <ExternalLink size={16} />
                            Mở trang bài tập
                          </button>
                        )}
                      </div>
                    </section>
                  </div>
                ) : activeItemType === 'quiz' && activeQuizDetail ? (
                  <>
                    {activeQuizDetail.hasPassed && !activeQuizDetail.canRetry ? (
                      /* SHOW RESULT IF ALREADY PASSED AND CANNOT RETRY */
                      <div className="lhud-quiz-complete-card">
                        <h3 className="lhud-quiz-complete-title">
                          Bạn đã hoàn thành bài kiểm tra
                        </h3>
                        <div className="lhud-quiz-complete-score">
                          <p className="lhud-quiz-complete-score-main">
                            <strong>ĐIỂM SỐ:</strong> {activeQuizDetail.bestAttempt?.score}%
                          </p>
                          <p className="lhud-quiz-complete-score-sub">
                            ĐIỂM CẦN ĐẠT: {activeQuizDetail.passScore}%
                          </p>
                        </div>
                        <p className="lhud-quiz-complete-note">
                          Bạn đã đạt yêu cầu. Không cần làm lại bài kiểm tra.
                        </p>
                        {!isPreviewMode && (
                          <button
                            onClick={() => handleOpenQuizAttemptPage('result')}
                            className="learning-hud-nav-btn lhud-quiz-complete-action"
                            disabled={requiresManualUpgradeGate}
                          >
                            Xem kết quả
                          </button>
                        )}
                      </div>
                    ) : (
                      /* QUIZ PREVIEW - Navigate to quiz page */
                      <div className="lhud-quiz-card">
                        {/* Quiz Header */}
                        <div className="lhud-quiz-card-header">
                          {/* Context Breadcrumb */}
                          <div className="lhud-quiz-card-breadcrumb">
                            {(modulesWithContent.find(m => m.id === activeLesson.moduleId) || sortedModules.find(m => m.id === activeLesson.moduleId))?.title || 'Chương'} › Bài đánh giá kiến thức
                          </div>

                          <h2 className="lhud-quiz-card-title">
                            {activeQuizDetail.title}
                          </h2>
                          <p className="lhud-quiz-card-desc">
                            {activeQuizDetail.description || 'Đánh giá mức độ hiểu bài trước khi tiếp tục học'}
                          </p>

                          {/* Quiz Objective */}
                          <p className="lhud-quiz-card-objective">
                            Hoàn thành bài kiểm tra để xác nhận bạn đã hiểu các khái niệm cốt lõi và tiếp tục sang nội dung tiếp theo.
                          </p>
                        </div>


                        <div className={quizStatsClass}>
                          <div className={`lhud-quiz-stat ${(activeQuizDetail.questions?.length || 0) === 0 ? 'is-empty' : ''}`}>
                            <div className="lhud-quiz-stat-value">
                              {activeQuizDetail.questions?.length || 0}
                            </div>
                            <p className="lhud-quiz-stat-label">
                              {(activeQuizDetail.questions?.length || 0) === 0 ? 'Chưa có câu hỏi' : 'Câu hỏi'}
                            </p>
                            {(activeQuizDetail.questions?.length || 0) === 0 && (
                              <div className="lhud-quiz-stat-sub is-empty">
                                Đang cập nhật
                              </div>
                            )}
                          </div>

                          <div className="lhud-quiz-stat">
                            <div className="lhud-quiz-stat-value">
                              {activeQuizDetail.passScore}%
                            </div>
                            <p className="lhud-quiz-stat-label">
                              Điểm đạt
                            </p>
                            <div className="lhud-quiz-stat-sub">
                              Cần đạt tối thiểu {activeQuizDetail.passScore}%
                            </div>
                          </div>

                          <div
                            className={`lhud-quiz-stat is-best ${!quizHasAttemptHistory
                                ? 'is-pending'
                                : quizBestScorePassed
                                  ? 'is-pass'
                                  : 'is-fail'
                              }`}
                          >
                            <div className="lhud-quiz-stat-value">
                              {typeof quizBestScore === 'number' ? `${quizBestScore}%` : '--'}
                            </div>
                            <p className="lhud-quiz-stat-label">
                              Điểm cao nhất
                            </p>
                            <div className="lhud-quiz-stat-sub">
                              {!quizHasAttemptHistory
                                ? 'Chưa có lần làm'
                                : quizBestScorePassed
                                  ? '✓ Đã đạt yêu cầu'
                                  : '✗ Chưa đạt yêu cầu'}
                            </div>
                          </div>

                          <div
                            className={`lhud-quiz-stat is-attempts ${quizAttemptsCount >= activeQuizDetail.maxAttempts
                                ? 'is-maxed'
                                : !quizHasAttemptHistory
                                  ? 'is-pending'
                                  : ''
                              }`}
                          >
                            <div className="lhud-quiz-stat-value">
                              {quizAttemptsCount}/{activeQuizDetail.maxAttempts}
                            </div>
                            <p className="lhud-quiz-stat-label">
                              {quizAttemptsCount >= activeQuizDetail.maxAttempts ? 'Hết lượt' : 'Số lần thử'}
                            </p>
                            {quizAttemptsCount >= activeQuizDetail.maxAttempts ? (
                              <div className="lhud-quiz-stat-sub is-warning">
                                Chờ 8h để làm lại
                              </div>
                            ) : (
                              <div className="lhud-quiz-stat-sub">
                                {!quizHasAttemptHistory
                                  ? `Tối đa ${activeQuizDetail.maxAttempts} lượt`
                                  : `Còn lại ${Math.max(activeQuizDetail.maxAttempts - quizAttemptsCount, 0)} lượt`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="lhud-quiz-action">
                          {!isPreviewMode && quizHasAttemptHistory && !activeQuizDetail.hasPassed && activeQuizDetail.latestAttempt && (
                            <button
                              type="button"
                              className="learning-hud-secondary-btn lhud-quiz-review-btn"
                              onClick={() => handleOpenQuizAttemptPage('result')}
                            >
                              Xem lại kết quả gần nhất
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (!isPreviewMode) {
                                handleOpenQuizAttemptPage('start');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                            className={`lhud-quiz-action-btn ${quizAttemptsCount >= activeQuizDetail.maxAttempts
                                ? 'is-locked'
                                : (activeQuizDetail.questions?.length || 0) === 0
                                  ? 'is-disabled'
                                  : quizHasAttemptHistory
                                    ? 'is-retry'
                                    : 'is-start'
                              } ${isPreviewMode ? 'is-preview' : ''}`}
                            disabled={
                              isPreviewMode ||
                              requiresManualUpgradeGate ||
                              quizAttemptsCount >= activeQuizDetail.maxAttempts ||
                              (activeQuizDetail.questions?.length || 0) === 0
                            }
                          >
                            {isPreviewMode
                              ? 'Chế độ xem trước'
                              : requiresManualUpgradeGate
                                ? 'Cần nâng cấp revision để học tiếp'
                                : quizAttemptsCount >= activeQuizDetail.maxAttempts
                                  ? 'Hết lượt làm bài'
                                  : (activeQuizDetail.questions?.length || 0) === 0
                                    ? 'Bài kiểm tra chưa có câu hỏi'
                                    : quizHasAttemptHistory
                                      ? `Làm lại (${quizAttemptsCount}/${activeQuizDetail.maxAttempts})`
                                      : 'Bắt đầu làm bài'}
                          </button>

                          {/* Thông báo khi hết lượt với countdown timer */}
                          {quizAttemptsCount >= activeQuizDetail.maxAttempts && (
                            <div className="lhud-quiz-lock-banner">
                              <p className="lhud-quiz-lock-title">
                                Đã sử dụng hết {activeQuizDetail.maxAttempts} lượt làm bài
                              </p>
                              {retryCountdown > 0 ? (
                                <div className="lhud-quiz-lock-body">
                                  <p className="lhud-quiz-lock-text">
                                    Bạn có thể làm lại sau:
                                  </p>
                                  <div className="lhud-quiz-countdown">
                                    <div className="lhud-quiz-countdown-timer">
                                      {formatCountdown(retryCountdown)}
                                    </div>
                                  </div>
                                  <p className="lhud-quiz-lock-hint">
                                    Hãy xem lại bài học trong thời gian chờ để chuẩn bị tốt hơn.
                                  </p>
                                </div>
                              ) : (
                                <p className="lhud-quiz-lock-text">
                                  Bạn có thể làm lại sau 8 giờ kể từ lần làm đầu tiên. Hãy xem lại bài học trong thời gian chờ.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Reassurance Info */}
                          {(activeQuizDetail.questions?.length || 0) > 0 && quizAttemptsCount < activeQuizDetail.maxAttempts && (
                            <>
                              <div className="lhud-quiz-meta">
                                <span title="Thời gian làm bài dự kiến">Thời gian: 10 phút</span>
                                <span title="Số lần làm lại tối đa">Còn lại: {activeQuizDetail.maxAttempts - quizAttemptsCount} lần</span>
                                <span title="Tiến trình được lưu tự động">Tự động lưu tiến độ</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : activeLessonDetail ? (
                  <>
                    {/* VIDEO LESSON */}
                    {activeLessonDetail.type === 'VIDEO' && (
                      <>
                        {activeLessonDetail.videoUrl ? (
                          <VideoHudWrapper
                            videoUrl={activeLessonDetail.videoUrl}
                            title={activeLessonDetail.title}
                          />
                        ) : (
                          <div className="learning-hud-empty-state">
                            DỮ LIỆU VIDEO KHÔNG KHẢ DỤNG
                          </div>
                        )}
                      </>
                    )}

                    {/* READING LESSON */}
                    {activeLessonDetail.type === 'READING' && (
                      <>
                        <div className="lhud-reading-text">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {normalizeContent(activeLessonDetail.contentText || 'Dữ liệu nội dung không khả dụng.')}
                          </ReactMarkdown>
                        </div>

                        <AttachmentManager
                          lessonId={activeLessonDetail.id}
                          editable={false}
                          hideWhenEmpty
                          headerText="Tài liệu đính kèm"
                        />
                      </>
                    )}
                  </>
                ) : activeModulePreview ? (
                  <section className="lhud-module-overview-card">
                    <div className="lhud-module-overview-badge">Tổng quan chương</div>
                    <div className="lhud-module-overview-meta">
                      <span>{(activeModulePreview as ModuleWithContent).lessons?.length ?? 0} Bài học</span>
                      <span>{(activeModulePreview as ModuleWithContent).quizzes?.length ?? 0} Bài kiểm tra</span>
                      <span>{(activeModulePreview as ModuleWithContent).assignments?.length ?? 0} Bài tập</span>
                    </div>
                    {activeModulePreview.description?.trim() ? (
                      <div className="lhud-module-overview-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {normalizeContent(activeModulePreview.description)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="lhud-text-secondary">
                        Chương này hiện chưa có mô tả chi tiết.
                      </p>
                    )}
                  </section>
                ) : activeLessonTitle ? (
                  <div className="learning-hud-empty-state">
                    KHÔNG THỂ TẢI NỘI DUNG
                  </div>
                ) : (
                  <>
                    <p className="lhud-text-secondary">
                      {course.description}
                    </p>
                    <p className="lhud-text-dim lhud-mt-16">
                      Chọn một bài học từ danh sách để bắt đầu.
                    </p>
                  </>
                )}
              </div>

              {/* Control Deck */}
              <ControlDeck
                onPrevious={handlePrevLesson}
                onNext={handleNextLesson}
                onComplete={handleMarkAsComplete}
                canNavigatePrev={!requiresManualUpgradeGate && activeCurriculumIndex > 0}
                canNavigateNext={
                  !requiresManualUpgradeGate &&
                  activeCurriculumIndex >= 0 &&
                  activeCurriculumIndex < curriculumItems.length - 1
                }
                canComplete={completeDeckConfig.canComplete}
                completeLabel={completeDeckConfig.completeLabel}
                completeState={completeDeckConfig.completeState}
              />
            </div>
          </div>
        </div>
      </main>

      <MeowlGuide
        currentPage="courses"
        autoOpenChat
        panelMode={meowlPanelMode}
        panelTheme="cyan"
        panelAllowedModes={["MODE_COURSE_LEARNING", "MODE_GENERAL_FAQ"]}
        roadmapContext={null}
        courseContext={
          course && modulesWithContent.length > 0
            ? {
              courseTitle: course.title,
              moduleTitle: activeCurriculumItem?.moduleTitle || "",
              lessonTitle: activeCurriculumItem?.title || "",
              lessonType: activeCurriculumItem?.itemType === "quiz"
                ? "QUIZ"
                : activeCurriculumItem?.itemType === "assignment"
                  ? "ASSIGNMENT"
                  : (activeLessonDetail?.type || "LESSON"),
              modules: modulesWithContent.map((mod) => ({
                moduleId: mod.id,
                moduleTitle: mod.title,
                lessons: (mod.lessons ?? []).map((l) => ({
                  lessonId: l.id,
                  lessonTitle: l.title,
                  lessonType: l.type,
                })),
                quizzes: (mod.quizzes ?? []).map((q) => ({
                  lessonId: q.id,
                  lessonTitle: q.title,
                  lessonType: "QUIZ",
                })),
                assignments: (mod.assignments ?? []).map((a) => ({
                  lessonId: a.id,
                  lessonTitle: a.title,
                  lessonType: "ASSIGNMENT",
                })),
              })),
              activeModuleId: activeLesson?.moduleId ?? null,
              activeLessonId: activeLesson?.lessonId ?? null,
              activeLessonTitle: activeLessonTitle || undefined,
              activeLessonType: activeLessonDetail?.type || undefined,
              activeLessonDescription: activeLessonDetail?.description || undefined,
            }
            : null
        }
      />
    </NeuralInterfaceLayout>
  );
};

export default CourseLearningPage;
