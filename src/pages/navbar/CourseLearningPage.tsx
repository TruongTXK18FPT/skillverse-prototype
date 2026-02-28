import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCourse } from "../../services/courseService";
import { listModulesWithContent } from "../../services/moduleService";
import { getEnrollment } from "../../services/enrollmentService";
import {
  getLessonById,
  getNextLesson,
  getPrevLesson,
  completeLesson,
  getModuleProgress,
} from "../../services/lessonService";
import { getQuizById, getQuizAttemptStatus } from "../../services/quizService";
import { CourseDetailDTO, CourseStatus, ModuleSummaryDTO } from "../../data/courseDTOs";
import { LessonSummaryDTO, LessonDetailDTO } from "../../data/lessonDTOs";
import { QuizSummaryDTO, QuizDetailDTO } from "../../data/quizDTOs";
import { AssignmentSummaryDTO } from "../../data/assignmentDTOs";
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
  AssignmentViewer,
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
  attemptsCount: number;
  bestScore: number | null;
  totalAttempts: number;
  canRetry: boolean;
  secondsUntilRetry: number;
  nextRetryAt: string | null;
  maxAttempts: number;
  attemptsRemaining: number;
}

// --- MAIN COMPONENT --- //
const CourseLearningPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const courseId: number | undefined = location.state?.courseId;
  const isPreviewMode = Boolean(
    location.state?.preview ||
    new URLSearchParams(location.search).get('preview') === '1'
  );

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [modulesWithContent, setModulesWithContent] = useState<ModuleWithContent[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [activeLesson, setActiveLesson] = useState<{
    moduleId: number | null;
    lessonId: number | null;
  }>({ moduleId: null, lessonId: null });
  const [activeLessonTitle, setActiveLessonTitle] = useState<string>("");
  const [lessonStatuses, setLessonStatuses] = useState<{
    [key: string]: "completed" | "in-progress";
  }>({});
  const [progress, setProgress] = useState<{
    completedLessons: number;
    totalLessons: number;
    percent: number;
  }>({ completedLessons: 0, totalLessons: 0, percent: 0 });
  const [activeLessonDetail, setActiveLessonDetail] = useState<LessonDetailDTO | null>(null);
  const [loadingLessonDetail, setLoadingLessonDetail] = useState(false);
  const [activeItemType, setActiveItemType] = useState<'lesson' | 'quiz' | 'assignment' | null>(null);
  const [activeQuizDetail, setActiveQuizDetail] = useState<QuizWithAttemptStatus | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<number | null>(null);
  
  // Countdown timer state cho quiz retry
  const [retryCountdown, setRetryCountdown] = useState<number>(0);

  // Effect để cập nhật countdown mỗi giây
  useEffect(() => {
    if (activeQuizDetail && activeQuizDetail.secondsUntilRetry > 0) {
      setRetryCountdown(activeQuizDetail.secondsUntilRetry);
      
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
    }
  }, [activeQuizDetail?.secondsUntilRetry, activeLesson.lessonId, user?.id]);

  // Helper function để format countdown thành HH:MM:SS
  const formatCountdown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

    if (!isPreviewMode) {
      getEnrollment(courseId, 1).catch(() => {});
    }

    // Load modules + lessons for sidebar content
    listModulesWithContent(courseId)
      .then((mods) => {
        setModulesWithContent(mods as ModuleWithContent[]);
        // Auto select first lesson to make sidebar interactive immediately
        const firstWithLesson = mods.find(
          (m) => (m.lessons || []).length > 0
        );
        if (firstWithLesson && firstWithLesson.lessons) {
          const firstLesson = [...firstWithLesson.lessons].sort(
            (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
          )[0];
          setExpandedModules([firstWithLesson.id]);
          setActiveLesson({
            moduleId: firstWithLesson.id,
            lessonId: firstLesson.id,
          });
          setActiveLessonTitle(firstLesson.title);
        }
      })
      .catch(() => setModulesWithContent([]));
  }, [courseId, isPreviewMode]);

  // Load module progress when active module/lesson changes
  useEffect(() => {
    if (!activeLesson.moduleId) return;
    if (isPreviewMode) {
      setProgress({ completedLessons: 0, totalLessons: 0, percent: 0 });
      return;
    }
    const userId = user?.id || 0;
    if (!userId) return;
    getModuleProgress(activeLesson.moduleId, userId)
      .then(setProgress)
      .catch(() =>
        setProgress({ completedLessons: 0, totalLessons: 0, percent: 0 })
      );
  }, [activeLesson.moduleId, user?.id, isPreviewMode]);

  // Load content (lesson, quiz, or assignment) when active item changes - LAZY LOADING
  useEffect(() => {
    if (!activeLesson.lessonId) {
      setActiveLessonDetail(null);
      setActiveQuizDetail(null);
      setActiveAssignmentId(null);
      setActiveItemType(null);
      return;
    }

    // Determine if current item is quiz, assignment, or lesson
    const currentModule = modulesWithContent.find(m => m.id === activeLesson.moduleId);
    const isQuiz = currentModule?.quizzes?.some((q) => q.id === activeLesson.lessonId);
    const isAssignment = currentModule?.assignments?.some((a) => a.id === activeLesson.lessonId);

    setLoadingLessonDetail(true);

    if (isAssignment) {
      // ASSIGNMENT - Just set ID, AssignmentViewer will handle loading
      setActiveItemType('assignment');
      setActiveLessonDetail(null);
      setActiveQuizDetail(null);
      setActiveAssignmentId(activeLesson.lessonId);
      setLoadingLessonDetail(false);
    } else if (isQuiz) {
      // LAZY LOAD QUIZ + CHECK ATTEMPTS với API mới có countdown
      
      setActiveItemType('quiz');
      setActiveLessonDetail(null);

      Promise.all([
        getQuizById(activeLesson.lessonId),
        getQuizAttemptStatus(activeLesson.lessonId, user?.id || 0).catch(() => null)
      ])
        .then(([quiz, attemptStatus]) => {
          if (attemptStatus) {
            // Sử dụng dữ liệu từ API mới
            setActiveQuizDetail({
              ...quiz,
              hasAttempts: attemptStatus.attemptsUsed > 0,
              hasPassed: attemptStatus.hasPassed,
              bestAttempt: attemptStatus.hasPassed ? { passed: true, score: attemptStatus.bestScore } : null,
              attemptsCount: attemptStatus.attemptsUsed,
              bestScore: attemptStatus.bestScore,
              totalAttempts: attemptStatus.recentAttempts?.length || attemptStatus.attemptsUsed,
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
      
      setActiveItemType('lesson');
      setActiveQuizDetail(null);

      getLessonById(activeLesson.lessonId)
        .then((detail) => {
          
          setActiveLessonDetail(detail);
        })
        .catch((err) => {
          console.error('[LESSON] Failed:', err);
          setActiveLessonDetail(null);
        })
        .finally(() => setLoadingLessonDetail(false));
    }
  }, [activeLesson.lessonId, activeLesson.moduleId, modulesWithContent, user?.id]);

  const sortedModules = useMemo((): ModuleSummaryDTO[] => {
    const list = course?.modules ? [...course.modules] : [];
    return list.sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );
  }, [course]);

  const progressPercentage = useMemo(() => progress.percent || 0, [progress]);

  const handleToggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSelectLesson = (moduleId: number, lessonId: number) => {
    const statusKey = `${moduleId}-${lessonId}`;
    if (lessonStatuses[statusKey] === "completed") {
      setActiveLesson({ moduleId, lessonId });
    } else {
      setActiveLesson({ moduleId, lessonId });
      setLessonStatuses((prev) => ({ ...prev, [statusKey]: "in-progress" }));
    }
    // Use modulesWithContent if available (has lessons/quizzes), fallback to sortedModules
    const moduleSource = modulesWithContent.length ? modulesWithContent : [];
    const foundModule = moduleSource.find((m) => m.id === moduleId);
    const foundLesson = foundModule?.lessons?.find(
      (l) => l.id === lessonId
    );
    const foundQuiz = foundModule?.quizzes?.find(
      (q) => q.id === lessonId
    );
    if (foundLesson) setActiveLessonTitle(foundLesson.title);
    if (foundQuiz) setActiveLessonTitle(foundQuiz.title);
  };

  const handleMarkAsComplete = async () => {
    if (!activeLesson.moduleId || !activeLesson.lessonId) return;
    if (isPreviewMode) return;
    const userId = user?.id || 0;
    if (!userId) return;
    try {
      await completeLesson(
        activeLesson.moduleId,
        activeLesson.lessonId,
        userId
      );
      const statusKey = `${activeLesson.moduleId}-${activeLesson.lessonId}`;
      setLessonStatuses((prev) => ({ ...prev, [statusKey]: "completed" }));
      const p = await getModuleProgress(activeLesson.moduleId, userId);
      setProgress(p);
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
  };

  const findNextLesson = async (): Promise<{
    moduleId: number;
    lessonId: number;
  } | null> => {
    if (!activeLesson.moduleId || !activeLesson.lessonId) return null;
    const next = await getNextLesson(
      activeLesson.moduleId,
      activeLesson.lessonId
    );
    if (next && typeof next.id === "number") {
      return { moduleId: activeLesson.moduleId, lessonId: next.id };
    }
    return null;
  };

  const findPrevLesson = async (): Promise<{
    moduleId: number;
    lessonId: number;
  } | null> => {
    if (!activeLesson.moduleId || !activeLesson.lessonId) return null;
    const prev = await getPrevLesson(
      activeLesson.moduleId,
      activeLesson.lessonId
    );
    if (prev && typeof prev.id === "number") {
      return { moduleId: activeLesson.moduleId, lessonId: prev.id };
    }
    return null;
  };

  const handleNextLesson = async () => {
    const nextLesson = await findNextLesson();
    if (nextLesson) {
      handleSelectLesson(nextLesson.moduleId, nextLesson.lessonId);
    } else {
      alert("Chúc mừng! Bạn đã hoàn thành module này.");
    }
  };

  const handlePrevLesson = async () => {
    const prevLesson = await findPrevLesson();
    if (prevLesson) {
      handleSelectLesson(prevLesson.moduleId, prevLesson.lessonId);
    }
  };

  if (loading) {
    return (
      <NeuralInterfaceLayout
        courseTitle="ĐANG TẢI..."
        progress={{ percent: 0 }}
        isSidebarOpen={false}
        onToggleSidebar={() => {}}
        onBack={() => navigate("/courses")}
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
        onBack={() => navigate("/courses")}
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
        onBack={() => navigate("/courses")}
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
              onClick={() => navigate('/courses')}
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
      onBack={() => navigate("/courses")}
    >
      {/* Sidebar */}
      <ModuleSidebar
        modules={modulesWithContent.length ? modulesWithContent : sortedModules}
        expandedModules={expandedModules}
        activeLesson={activeLesson}
        lessonStatuses={lessonStatuses}
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

          <div className="learning-hud-reading-content">
            {loadingLessonDetail ? (
              <div className="learning-hud-loading">ĐANG TẢI DÒNG DỮ LIỆU</div>
            ) : activeItemType === 'assignment' && activeAssignmentId ? (
              <AssignmentViewer assignmentId={activeAssignmentId} readOnly={isPreviewMode} />
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
                        onClick={() => navigate(`/quiz/${activeQuizDetail.id}/attempt`)}
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
                      <button
                        onClick={() => {
                          if (!isPreviewMode) {
                            navigate(`/quiz/${activeQuizDetail.id}/attempt`);
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
            canNavigatePrev={!!activeLesson.lessonId}
            canNavigateNext={!!activeLesson.lessonId}
            canComplete={!!activeLesson.moduleId && !isPreviewMode}
          />
        </div>
      </main>
    </NeuralInterfaceLayout>
  );
};

export default CourseLearningPage;
