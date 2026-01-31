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
import { CourseDetailDTO, ModuleSummaryDTO } from "../../data/courseDTOs";
import { LessonSummaryDTO, LessonDetailDTO } from "../../data/lessonDTOs";
import { QuizSummaryDTO, QuizDetailDTO } from "../../data/quizDTOs";
import { AssignmentSummaryDTO } from "../../data/assignmentDTOs";
import AttachmentManager from "../../components/course/AttachmentManager";

// Import Neural HUD Components
import {
  NeuralInterfaceLayout,
  ModuleSidebar,
  VideoHudWrapper,
  ControlDeck,
  AssignmentViewer,
} from "../../components/learning-hud";

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

    getEnrollment(courseId, 1).catch(() => {});

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
  }, [courseId]);

  // Load module progress when active module/lesson changes
  useEffect(() => {
    if (!activeLesson.moduleId) return;
    const userId = user?.id || 0;
    if (!userId) return;
    getModuleProgress(activeLesson.moduleId, userId)
      .then(setProgress)
      .catch(() =>
        setProgress({ completedLessons: 0, totalLessons: 0, percent: 0 })
      );
  }, [activeLesson.moduleId, user?.id]);

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
            <p style={{ color: 'var(--lhud-text-secondary)' }}>
              Không thể kết nối đến dữ liệu khóa học. Vui lòng thử lại sau.
            </p>
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

          <div className="learning-hud-reading-content">
            {loadingLessonDetail ? (
              <div className="learning-hud-loading">ĐANG TẢI DÒNG DỮ LIỆU</div>
            ) : activeItemType === 'assignment' && activeAssignmentId ? (
              <AssignmentViewer assignmentId={activeAssignmentId} />
            ) : activeItemType === 'quiz' && activeQuizDetail ? (
              <>
                {activeQuizDetail.hasPassed ? (
                  /* SHOW RESULT IF ALREADY PASSED */
                  <div style={{
                    padding: '40px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '2px solid var(--lhud-green)'
                  }}>
                    <h3 style={{
                      marginBottom: '16px',
                      fontSize: '1.8rem',
                      color: 'var(--lhud-green)'
                    }}>
                      BÀI KIỂM TRA HOÀN TẤT - DỮ LIỆU ĐÃ XÁC MINH
                    </h3>
                    <div style={{
                      display: 'inline-block',
                      marginBottom: '24px',
                      padding: '20px',
                      backgroundColor: 'var(--lhud-space-light)',
                      borderRadius: '8px',
                      border: '1px solid var(--lhud-border)'
                    }}>
                      <p style={{ marginBottom: '8px', fontSize: '1.2rem', color: 'var(--lhud-text-primary)' }}>
                        <strong>ĐIỂM SỐ:</strong> {activeQuizDetail.bestAttempt?.score}%
                      </p>
                      <p style={{ fontSize: '1rem', color: 'var(--lhud-text-secondary)' }}>
                        ĐIỂM ĐẠT: {activeQuizDetail.passScore}%
                      </p>
                    </div>
                    <p style={{ color: 'var(--lhud-text-secondary)', marginBottom: '16px' }}>
                      Đã xác minh đồng bộ thần kinh. Không cần thử lại.
                    </p>
                    <button
                      onClick={() => navigate(`/quiz/${activeQuizDetail.id}/attempt`)}
                      className="learning-hud-nav-btn"
                      style={{ marginTop: '1rem' }}
                    >
                      XEM CHI TIẾT
                    </button>
                  </div>
                ) : (
                  /* QUIZ PREVIEW - Navigate to quiz page */
                  <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '32px',
                    backgroundColor: 'var(--lhud-space-light)',
                    borderRadius: '16px',
                    border: '2px solid var(--lhud-cyan)',
                    boxShadow: '0 8px 32px rgba(0, 255, 255, 0.1)'
                  }}>
                    {/* Quiz Header */}
                    <div style={{
                      textAlign: 'center',
                      marginBottom: '32px',
                      paddingBottom: '24px',
                      borderBottom: '1px solid var(--lhud-border)'
                    }}>
                      {/* Context Breadcrumb */}
                      <div style={{
                         marginBottom: '16px',
                         color: 'var(--lhud-cyan)',
                         fontSize: '0.9rem',
                         textTransform: 'uppercase',
                         letterSpacing: '1px'
                      }}>
                        {(modulesWithContent.find(m => m.id === activeLesson.moduleId) || sortedModules.find(m => m.id === activeLesson.moduleId))?.title || 'Module'} › Bài đánh giá kiến thức
                      </div>

                      <h2 style={{
                        margin: '0 0 16px 0',
                        fontSize: '2.2rem',
                        color: 'var(--lhud-text-primary)',
                        fontFamily: '"Space Habitat", monospace',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}>
                        {activeQuizDetail.title}
                      </h2>
                      <p style={{
                        margin: '0',
                        color: 'var(--lhud-text-secondary)',
                        fontSize: '1.1rem',
                        lineHeight: '1.6'
                      }}>
                        {activeQuizDetail.description || 'Đánh giá mức độ hiểu bài trước khi tiếp tục học'}
                      </p>
                      
                      {/* Quiz Objective */}
                      <p style={{ 
                        marginTop: '12px', 
                        fontStyle: 'italic', 
                        color: 'var(--lhud-text-dim)',
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                      }}>
                        "Hoàn thành quiz để xác nhận bạn đã hiểu các khái niệm cốt lõi và tiếp tục sang nội dung tiếp theo."
                      </p>
                    </div>

                    {/* Quiz Stats Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '20px',
                      marginBottom: '32px'
                    }}>
                      <div style={{
                        padding: '20px',
                        backgroundColor: 'var(--lhud-deep-space)',
                        borderRadius: '12px',
                        border: '1px solid var(--lhud-border)',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '2rem',
                          color: (activeQuizDetail.questions?.length || 0) === 0 ? 'var(--lhud-red)' : 'var(--lhud-cyan)',
                          marginBottom: '8px',
                          fontFamily: '"Space Habitat", monospace'
                        }}>
                          {activeQuizDetail.questions?.length || 0}
                        </div>
                        <p style={{
                          margin: '0',
                          color: 'var(--lhud-text-secondary)',
                          fontSize: '0.9rem',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          {(activeQuizDetail.questions?.length || 0) === 0 ? 'Chưa có câu hỏi' : 'Câu hỏi'}
                        </p>
                        {(activeQuizDetail.questions?.length || 0) === 0 && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--lhud-red)', marginTop: '8px' }}>
                            Đang cập nhật
                          </div>
                        )}
                      </div>

                      <div style={{
                        padding: '20px',
                        backgroundColor: 'var(--lhud-deep-space)',
                        borderRadius: '12px',
                        border: '1px solid var(--lhud-border)',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '2rem',
                          color: 'var(--lhud-cyan)',
                          marginBottom: '8px',
                          fontFamily: '"Space Habitat", monospace'
                        }}>
                          {activeQuizDetail.passScore}%
                        </div>
                        <p style={{
                          margin: '0',
                          color: 'var(--lhud-text-secondary)',
                          fontSize: '0.9rem',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          Điểm đạt
                        </p>
                        <div style={{ fontSize: '0.75rem', color: 'var(--lhud-text-dim)', marginTop: '8px' }}>
                          Cần đạt tối thiểu {activeQuizDetail.passScore}%
                        </div>
                      </div>

                      {/* Điểm cao nhất - Chỉ hiện khi đã có attempts */}
                      {activeQuizDetail.hasAttempts && activeQuizDetail.bestScore !== null && (
                        <div style={{
                          padding: '20px',
                          backgroundColor: activeQuizDetail.bestScore >= activeQuizDetail.passScore 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : 'var(--lhud-deep-space)',
                          borderRadius: '12px',
                          border: activeQuizDetail.bestScore >= activeQuizDetail.passScore 
                            ? '1px solid rgba(16, 185, 129, 0.3)' 
                            : '1px solid var(--lhud-border)',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '2rem',
                            color: activeQuizDetail.bestScore >= activeQuizDetail.passScore 
                              ? '#10b981' 
                              : '#f97316',
                            marginBottom: '8px',
                            fontFamily: '"Space Habitat", monospace'
                          }}>
                            {activeQuizDetail.bestScore}%
                          </div>
                          <p style={{
                            margin: '0',
                            color: 'var(--lhud-text-secondary)',
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            Điểm cao nhất
                          </p>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: activeQuizDetail.bestScore >= activeQuizDetail.passScore ? '#34d399' : '#fb923c', 
                            marginTop: '8px' 
                          }}>
                            {activeQuizDetail.bestScore >= activeQuizDetail.passScore ? '✓ Đã đạt yêu cầu' : '✗ Chưa đạt yêu cầu'}
                          </div>
                        </div>
                      )}

                      {activeQuizDetail.hasAttempts && (
                        <div style={{
                          padding: '20px',
                          backgroundColor: activeQuizDetail.attemptsCount >= 3 
                            ? 'rgba(239, 68, 68, 0.1)' 
                            : 'var(--lhud-deep-space)',
                          borderRadius: '12px',
                          border: activeQuizDetail.attemptsCount >= 3 
                            ? '1px solid rgba(239, 68, 68, 0.3)' 
                            : '1px solid var(--lhud-border)',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '2rem',
                            color: activeQuizDetail.attemptsCount >= 3 ? '#ef4444' : 'var(--lhud-cyan)',
                            marginBottom: '8px',
                            fontFamily: '"Space Habitat", monospace'
                          }}>
                            {activeQuizDetail.attemptsCount}/3
                          </div>
                          <p style={{
                            margin: '0',
                            color: activeQuizDetail.attemptsCount >= 3 ? '#fca5a5' : 'var(--lhud-text-secondary)',
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                          {activeQuizDetail.attemptsCount >= 3 ? 'Hết lượt' : 'Số lần thử'}
                        </p>
                        {activeQuizDetail.attemptsCount >= 3 && (
                          <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '8px' }}>
                            Chờ 24h để làm lại
                          </div>
                        )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => navigate(`/quiz/${activeQuizDetail.id}/attempt`)}
                        style={{
                          padding: '16px 48px',
                          fontSize: '1.1rem',
                          fontFamily: '"Space Habitat", monospace',
                          fontWeight: 'bold',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          background: activeQuizDetail.attemptsCount >= 3
                            ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                            : activeQuizDetail.hasAttempts 
                            ? 'linear-gradient(135deg, var(--lhud-orange) 0%, #ea580c 100%)'
                            : 'linear-gradient(135deg, var(--lhud-cyan) 0%, #0891b2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: (activeQuizDetail.attemptsCount >= 3 || (activeQuizDetail.questions?.length || 0) === 0) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: activeQuizDetail.attemptsCount >= 3 ? 'none' : '0 4px 20px rgba(6, 182, 212, 0.3)',
                          transform: 'translateY(0)',
                          opacity: (activeQuizDetail.questions?.length || 0) === 0 ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if ((activeQuizDetail.questions?.length || 0) > 0 && activeQuizDetail.attemptsCount < 3) {
                             const target = e.target as HTMLButtonElement;
                             target.style.transform = 'translateY(-2px)';
                             target.style.boxShadow = '0 6px 25px rgba(6, 182, 212, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const target = e.target as HTMLButtonElement;
                          target.style.transform = 'translateY(0)';
                          target.style.boxShadow = activeQuizDetail.attemptsCount >= 3 ? 'none' : '0 4px 20px rgba(6, 182, 212, 0.3)';
                        }}
                        disabled={activeQuizDetail.attemptsCount >= 3 || (activeQuizDetail.questions?.length || 0) === 0}
                      >
                        {activeQuizDetail.attemptsCount >= 3
                          ? '🔒 HẾT LƯỢT LÀM BÀI'
                          : (activeQuizDetail.questions?.length || 0) === 0
                          ? 'BÀI QUIZ CHƯA CÓ CÂU HỎI'
                          : activeQuizDetail.hasAttempts
                          ? `🔄 LÀM LẠI BÀI KIỂM TRA (${activeQuizDetail.attemptsCount}/3)`
                          : '⚡ BẮT ĐẦU LÀM BÀI'}
                      </button>

                      {/* Thông báo khi hết lượt với countdown timer */}
                      {activeQuizDetail.attemptsCount >= 3 && (
                        <div style={{
                          marginTop: '20px',
                          padding: '16px 24px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          color: '#fca5a5'
                        }}>
                          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#ef4444' }}>
                            ⏰ Đã sử dụng hết 3 lượt làm bài
                          </p>
                          {retryCountdown > 0 ? (
                            <div style={{ margin: 0 }}>
                              <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--lhud-text-secondary)' }}>
                                Bạn có thể làm lại sau:
                              </p>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '8px',
                                marginBottom: '12px'
                              }}>
                                <div style={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                  padding: '12px 16px',
                                  borderRadius: '8px',
                                  fontFamily: 'monospace',
                                  fontSize: '1.5rem',
                                  fontWeight: 'bold',
                                  color: 'var(--lhud-cyan)',
                                  letterSpacing: '2px',
                                  border: '1px solid var(--lhud-cyan-dim)'
                                }}>
                                  {formatCountdown(retryCountdown)}
                                </div>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--lhud-text-secondary)', opacity: 0.8 }}>
                                Hãy xem lại bài học trong thời gian chờ để chuẩn bị tốt hơn.
                              </p>
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--lhud-text-secondary)' }}>
                              Bạn có thể làm lại sau 24 giờ kể từ lần làm đầu tiên. Hãy xem lại bài học trong thời gian chờ.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Reassurance Info */}
                      {(activeQuizDetail.questions?.length || 0) > 0 && activeQuizDetail.attemptsCount < 3 && (
                        <>
                          <div style={{ 
                            marginTop: '24px', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: '24px', 
                            color: 'var(--lhud-text-secondary)', 
                            fontSize: '0.9rem',
                            flexWrap: 'wrap'
                          }}>
                             <span title="Thời gian làm bài dự kiến">⏱️ Thời gian: 10 phút</span>
                             <span title="Số lần làm lại tối đa">🔄 Còn lại: {3 - activeQuizDetail.attemptsCount} lần</span>
                             <span title="Tiến trình được lưu tự động">💾 Lưu tự động</span>
                          </div>
                          
                          <div style={{ 
                             marginTop: '16px',
                             fontSize: '0.9rem',
                             color: 'var(--lhud-cyan)',
                             opacity: 0.8
                          }}>
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
                    <div style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.8',
                      marginBottom: '24px',
                      color: 'var(--lhud-text-secondary)'
                    }}>
                      {activeLessonDetail.contentText || 'Dữ liệu nội dung không khả dụng.'}
                    </div>

                    {/* ATTACHMENTS */}
                    <div style={{
                      marginTop: '32px',
                      paddingTop: '24px',
                      borderTop: '1px solid var(--lhud-border)'
                    }}>
                      <h3 style={{
                        marginBottom: '16px',
                        fontSize: '1.2rem',
                        color: 'var(--lhud-cyan)',
                        fontFamily: '"Space Habitat", monospace',
                        letterSpacing: '1px'
                      }}>
                        TỆP ĐÍNH KÈM
                      </h3>
                      <AttachmentManager
                        lessonId={activeLessonDetail.id}
                        editable={false}
                      />
                    </div>
                  </>
                )}
              </>
            ) : activeLessonTitle ? (
              <div className="learning-hud-empty-state">
                KHÔNG THỂ TẢI NỘI DUNG
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--lhud-text-secondary)' }}>
                  {course.description}
                </p>
                <p style={{ color: 'var(--lhud-text-dim)', marginTop: '1rem' }}>
                  Chọn một bài học từ Nhật ký hệ thống để bắt đầu đồng bộ.
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
            canComplete={!!activeLesson.moduleId}
          />
        </div>
      </main>
    </NeuralInterfaceLayout>
  );
};

export default CourseLearningPage;