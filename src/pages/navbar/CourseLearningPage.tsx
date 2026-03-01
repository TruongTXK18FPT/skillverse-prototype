import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { getCourseLearningStatus } from "../../services/courseLearningService";
import { CourseDetailDTO, CourseStatus, ModuleSummaryDTO } from "../../data/courseDTOs";
import { LessonSummaryDTO, LessonDetailDTO } from "../../data/lessonDTOs";
import { QuizSummaryDTO, QuizDetailDTO, QuizAttemptDTO } from "../../data/quizDTOs";
import { AssignmentSummaryDTO } from "../../data/assignmentDTOs";
import {
  CourseLearningLocationState,
  LearningContentType,
  clearCourseLearningReturnContext,
  persistCourseLearningReturnContext,
  readStoredCourseLearningReturnContext,
  resolveCourseLearningOrigin,
} from "../../utils/courseLearningNavigation";
import { hasAssignmentDueDate } from "../../utils/assignmentPresentation";
import { buildCertificateVerificationUrl } from "../../components/certificate/certificatePresentation";
import AttachmentManager from "../../components/course/AttachmentManager";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
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

      return items.sort((a, b) => a.orderIndex - b.orderIndex);
    });

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

// --- MAIN COMPONENT --- //
const CourseLearningPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

    if (routerState?.courseId) {
      return {
        ...routerState,
        preview: isPreviewMode,
      };
    }

    return null;
  }, [isPreviewMode, queryCourseId, routerState]);
  const courseId: number | undefined = locationState?.courseId;

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [modulesWithContent, setModulesWithContent] = useState<ModuleWithContent[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
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
  const [activeLessonDetail, setActiveLessonDetail] = useState<LessonDetailDTO | null>(null);
  const [loadingLessonDetail, setLoadingLessonDetail] = useState(false);
  const [activeQuizDetail, setActiveQuizDetail] = useState<QuizWithAttemptStatus | null>(null);

  // Countdown timer state cho quiz retry
  const [retryCountdown, setRetryCountdown] = useState<number>(0);

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
  const activeQuizRetrySeconds = activeQuizDetail?.secondsUntilRetry ?? 0;
  const shouldTrackQuizRetryCountdown = activeQuizRetrySeconds > 0;

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
      return;
    }

    try {
      const status = await getCourseLearningStatus(courseId);
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
    } catch {
      setProgress({ ...EMPTY_PROGRESS_STATE });
      setItemStatuses((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([, statusValue]) => statusValue === "in-progress")
        ) as Record<string, "in-progress">
      );
    }
  }, [courseId, isPreviewMode, user?.id]);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getCourse(courseId)
      .then((dto) => setCourse(dto))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load modules + lessons for sidebar content
    listModulesWithContent(courseId)
      .then((mods) => {
        const normalizedModules = mods as ModuleWithContent[];
        setModulesWithContent(normalizedModules);
        loadCourseLearningState(normalizedModules);
        const curriculum = buildCurriculumItems(normalizedModules);
        const resumeItem = locationState?.resumeItem;
        const restoredItem = resumeItem
          ? curriculum.find(
              (item) =>
                item.moduleId === resumeItem.moduleId &&
                item.itemId === resumeItem.lessonId &&
                item.itemType === resumeItem.itemType
            ) ?? null
          : null;
        const initialItem = restoredItem ?? curriculum[0];

        if (initialItem) {
          setExpandedModules([initialItem.moduleId]);
          setActiveLesson({
            moduleId: initialItem.moduleId,
            lessonId: initialItem.itemId,
            itemType: initialItem.itemType,
          });
        }
      })
      .catch(() => setModulesWithContent([]));
  }, [courseId, isPreviewMode, loadCourseLearningState, locationState?.resumeItem]);

  useEffect(() => {
    setActiveLessonTitle(activeCurriculumItem?.title ?? "");
  }, [activeCurriculumItem]);

  const buildReturnContext = useCallback(
    (item: CurriculumItem | null = activeCurriculumItem): CourseLearningLocationState => ({
      courseId,
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
    [activeCurriculumItem, courseId, isPreviewMode, locationState?.origin]
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
  }, [activeCurriculumItem, user?.id]);

  const sortedModules = useMemo((): ModuleSummaryDTO[] => {
    const list = course?.modules ? [...course.modules] : [];
    return list.sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );
  }, [course]);

  const progressPercentage = useMemo(() => progress.percent || 0, [progress]);
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

  const handleToggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
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
      { replace: false }
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

  const handleSelectLesson = (
    moduleId: number,
    lessonId: number,
    itemType?: string
  ) => {
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
      alert("Chúc mừng! Bạn đã hoàn thành module này.");
    }
  };

  const handlePrevLesson = () => {
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

    const returnContext = buildReturnContext(activeCurriculumItem);
    persistCourseLearningReturnContext(returnContext);
    navigate(`/assignment/${activeCurriculumItem.itemId}`, { state: returnContext });
  };

  const handleOpenQuizAttemptPage = useCallback((view: 'start' | 'result' = 'start') => {
    if (!activeCurriculumItem || activeCurriculumItem.itemType !== "quiz") {
      return;
    }

    const returnContext = buildReturnContext(activeCurriculumItem);
    persistCourseLearningReturnContext(returnContext);
    navigate(
      {
        pathname: `/quiz/${activeCurriculumItem.itemId}/attempt`,
        search: view === 'result' ? '?view=result' : '',
      },
      { state: returnContext }
    );
  }, [activeCurriculumItem, buildReturnContext, navigate]);

  const completeDeckConfig = useMemo(() => {
    if (isPreviewMode) {
      return {
        canComplete: false,
        completeLabel: "Chế độ xem trước",
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
  }, [activeItemType, activeLesson.moduleId, isActiveItemCompleted, isPreviewMode]);

  if (loading) {
    return (
      <NeuralInterfaceLayout
        courseTitle="ĐANG TẢI..."
        progress={{ percent: 0 }}
        isSidebarOpen={false}
        onToggleSidebar={() => {}}
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
        onToggleSidebar={() => {}}
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
        onToggleSidebar={() => {}}
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
        isOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <main className="learning-hud-main-content">
        <div className="learning-hud-content-viewer">
          <h1 className="learning-hud-viewer-title">
            {activeLessonTitle || course.title}
          </h1>
          {isPreviewMode && (
            <div className="lhud-preview-banner">
              <strong>Chế độ xem trước:</strong> Bạn có thể xem nội dung như học viên, nhưng không thể làm bài, nộp bài hoặc đánh dấu hoàn thành.
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
                {activeQuizDetail.hasPassed ? (
                  /* SHOW RESULT IF ALREADY PASSED */
                  <div className="lhud-quiz-complete-card">
                    <h3 className="lhud-quiz-complete-title">
                      Bạn đã hoàn thành bài kiểm tra
                    </h3>
                    <div className="lhud-quiz-complete-score">
                      <p className="lhud-quiz-complete-score-main">
                        <strong>ĐIỂM SỐ:</strong> {activeQuizDetail.bestAttempt?.score}%
                      </p>
                      <p className="lhud-quiz-complete-score-sub">
                        ĐIỂM ĐẠT: {activeQuizDetail.passScore}%
                      </p>
                    </div>
                    <p className="lhud-quiz-complete-note">
                      Bạn đã đạt yêu cầu. Không cần làm lại bài kiểm tra.
                    </p>
                    {!isPreviewMode && (
                      <button
                        onClick={() => handleOpenQuizAttemptPage('result')}
                        className="learning-hud-nav-btn lhud-quiz-complete-action"
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

                    {/* Quiz Stats Grid */}
                    <div className="lhud-quiz-stats">
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

                      {/* Điểm cao nhất - Chỉ hiện khi đã có attempts */}
                      {activeQuizDetail.hasAttempts && activeQuizDetail.bestScore !== null && (
                        <div className={`lhud-quiz-stat is-best ${activeQuizDetail.bestScore >= activeQuizDetail.passScore ? 'is-pass' : 'is-fail'}`}>
                          <div className="lhud-quiz-stat-value">
                            {activeQuizDetail.bestScore}%
                          </div>
                          <p className="lhud-quiz-stat-label">
                            Điểm cao nhất
                          </p>
                          <div className="lhud-quiz-stat-sub">
                            {activeQuizDetail.bestScore >= activeQuizDetail.passScore ? '✓ Đã đạt yêu cầu' : '✗ Chưa đạt yêu cầu'}
                          </div>
                        </div>
                      )}

                      {activeQuizDetail.hasAttempts && (
                        <div className={`lhud-quiz-stat is-attempts ${activeQuizDetail.attemptsCount >= activeQuizDetail.maxAttempts ? 'is-maxed' : ''}`}>
                          <div className="lhud-quiz-stat-value">
                            {activeQuizDetail.attemptsCount}/{activeQuizDetail.maxAttempts}
                          </div>
                          <p className="lhud-quiz-stat-label">
                            {activeQuizDetail.attemptsCount >= activeQuizDetail.maxAttempts ? 'Hết lượt' : 'Số lần thử'}
                          </p>
                          {activeQuizDetail.attemptsCount >= activeQuizDetail.maxAttempts && (
                            <div className="lhud-quiz-stat-sub is-warning">
                              Chờ 24h để làm lại
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="lhud-quiz-action">
                      {!isPreviewMode && activeQuizDetail.latestAttempt && (
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
                          }
                        }}
                        className={`lhud-quiz-action-btn ${
                          activeQuizDetail.attemptsCount >= activeQuizDetail.maxAttempts
                            ? 'is-locked'
                            : (activeQuizDetail.questions?.length || 0) === 0
                            ? 'is-disabled'
                            : activeQuizDetail.hasAttempts
                            ? 'is-retry'
                            : 'is-start'
                        } ${isPreviewMode ? 'is-preview' : ''}`}
                        disabled={
                          isPreviewMode ||
                          activeQuizDetail.attemptsCount >= activeQuizDetail.maxAttempts ||
                          (activeQuizDetail.questions?.length || 0) === 0
                        }
                      >
                        {isPreviewMode
                          ? 'Chế độ xem trước'
                          : activeQuizDetail.attemptsCount >= activeQuizDetail.maxAttempts
                          ? 'Hết lượt làm bài'
                          : (activeQuizDetail.questions?.length || 0) === 0
                          ? 'Bài kiểm tra chưa có câu hỏi'
                          : activeQuizDetail.hasAttempts
                          ? `Làm lại (${activeQuizDetail.attemptsCount}/${activeQuizDetail.maxAttempts})`
                          : 'Bắt đầu làm bài'}
                      </button>

                      {/* Thông báo khi hết lượt với countdown timer */}
                      {activeQuizDetail.attemptsCount >= activeQuizDetail.maxAttempts && (
                        <div className="lhud-quiz-lock-banner">
                          <p className="lhud-quiz-lock-title">
                            Đã sử dụng hết 3 lượt làm bài
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
                              Bạn có thể làm lại sau 24 giờ kể từ lần làm đầu tiên. Hãy xem lại bài học trong thời gian chờ.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Reassurance Info */}
                      {(activeQuizDetail.questions?.length || 0) > 0 && activeQuizDetail.attemptsCount < activeQuizDetail.maxAttempts && (
                        <>
                          <div className="lhud-quiz-meta">
                             <span title="Thời gian làm bài dự kiến">Thời gian: 10 phút</span>
                             <span title="Số lần làm lại tối đa">Còn lại: {activeQuizDetail.maxAttempts - activeQuizDetail.attemptsCount} lần</span>
                             <span title="Tiến trình được lưu tự động">Tự động lưu tiến độ</span>
                          </div>
                          
                          <div className="lhud-quiz-note">
                             Hoàn thành quiz để mở khóa bài học tiếp theo trong module.
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
            canNavigatePrev={activeCurriculumIndex > 0}
            canNavigateNext={
              activeCurriculumIndex >= 0 &&
              activeCurriculumIndex < curriculumItems.length - 1
            }
            canComplete={completeDeckConfig.canComplete}
            completeLabel={completeDeckConfig.completeLabel}
            completeState={completeDeckConfig.completeState}
          />
        </div>
      </main>
    </NeuralInterfaceLayout>
  );
};

export default CourseLearningPage;
