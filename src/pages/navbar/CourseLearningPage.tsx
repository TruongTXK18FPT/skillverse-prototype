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
import { getQuizById, getUserQuizAttempts } from "../../services/quizService";
import { CourseDetailDTO } from "../../data/courseDTOs";
import AttachmentManager from "../../components/course/AttachmentManager";

// Import Neural HUD Components
import {
  NeuralInterfaceLayout,
  ModuleSidebar,
  VideoHudWrapper,
  ControlDeck,
} from "../../components/learning-hud";

// --- MAIN COMPONENT --- //
const CourseLearningPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const courseId: number | undefined = location.state?.courseId;

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [modulesWithContent, setModulesWithContent] = useState<any[]>([]);

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
  const [activeLessonDetail, setActiveLessonDetail] = useState<any>(null);
  const [loadingLessonDetail, setLoadingLessonDetail] = useState(false);
  const [activeItemType, setActiveItemType] = useState<'lesson' | 'quiz' | null>(null);
  const [activeQuizDetail, setActiveQuizDetail] = useState<any>(null);

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
        setModulesWithContent(mods);
        // Auto select first lesson to make sidebar interactive immediately
        const firstWithLesson = mods.find(
          (m: any) => (m.lessons || []).length > 0
        );
        if (firstWithLesson) {
          const firstLesson = [...firstWithLesson.lessons].sort(
            (a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
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

  // Load content (lesson or quiz) when active item changes - LAZY LOADING
  useEffect(() => {
    if (!activeLesson.lessonId) {
      setActiveLessonDetail(null);
      setActiveQuizDetail(null);
      setActiveItemType(null);
      return;
    }

    // Determine if current item is quiz or lesson
    const currentModule = modulesWithContent.find(m => m.id === activeLesson.moduleId);
    const isQuiz = currentModule?.quizzes?.some(q => q.id === activeLesson.lessonId);

    setLoadingLessonDetail(true);

    if (isQuiz) {
      // LAZY LOAD QUIZ + CHECK ATTEMPTS
      console.log('[QUIZ] Loading quiz:', activeLesson.lessonId);
      setActiveItemType('quiz');
      setActiveLessonDetail(null);

      Promise.all([
        getQuizById(activeLesson.lessonId),
        getUserQuizAttempts(activeLesson.lessonId, user?.id || 0).catch(() => [])
      ])
        .then(([quiz, attempts]) => {
          console.log('[QUIZ] Loaded:', quiz);
          console.log('[QUIZ] Attempts:', attempts);

          // Check if already passed
          const passedAttempt = attempts.find((a: any) => a.passed === true);

          setActiveQuizDetail({
            ...quiz,
            hasAttempts: attempts.length > 0,
            hasPassed: !!passedAttempt,
            bestAttempt: passedAttempt || (attempts.length > 0 ? attempts[0] : null),
            attemptsCount: attempts.length
          });
        })
        .catch((err) => {
          console.error('[QUIZ] Failed:', err);
          setActiveQuizDetail(null);
        })
        .finally(() => setLoadingLessonDetail(false));
    } else {
      // LAZY LOAD LESSON
      console.log('[LESSON] Loading lesson:', activeLesson.lessonId);
      setActiveItemType('lesson');
      setActiveQuizDetail(null);

      getLessonById(activeLesson.lessonId)
        .then((detail) => {
          console.log('[LESSON] Loaded:', detail);
          setActiveLessonDetail(detail);
        })
        .catch((err) => {
          console.error('[LESSON] Failed:', err);
          setActiveLessonDetail(null);
        })
        .finally(() => setLoadingLessonDetail(false));
    }
  }, [activeLesson.lessonId, activeLesson.moduleId, modulesWithContent, user?.id]);

  const sortedModules = useMemo(() => {
    const list = course?.modules ? [...course.modules] : [];
    return list.sort(
      (a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );
  }, [course]);

  const progressPercentage = useMemo(() => progress.percent || 0, [progress]);

  const handleToggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
    // set an active placeholder lesson for enabling complete action
    setActiveLesson((prev) =>
      prev.moduleId ? prev : { moduleId, lessonId: 1 }
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
    const foundModule = (
      modulesWithContent.length ? modulesWithContent : sortedModules
    ).find((m: any) => m.id === moduleId);
    const foundLesson = foundModule?.lessons?.find(
      (l: any) => l.id === lessonId
    );
    const foundQuiz = foundModule?.quizzes?.find(
      (q: any) => q.id === lessonId
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
        courseTitle="LOADING..."
        progress={{ percent: 0 }}
        isSidebarOpen={false}
        onToggleSidebar={() => {}}
        onBack={() => navigate("/courses")}
      >
        <main className="learning-hud-main-content">
          <div className="learning-hud-content-viewer">
            <div className="learning-hud-loading">INITIALIZING NEURAL LINK</div>
          </div>
        </main>
      </NeuralInterfaceLayout>
    );
  }

  if (!course) {
    return (
      <NeuralInterfaceLayout
        courseTitle="ERROR"
        progress={{ percent: 0 }}
        isSidebarOpen={false}
        onToggleSidebar={() => {}}
        onBack={() => navigate("/courses")}
      >
        <main className="learning-hud-main-content">
          <div className="learning-hud-content-viewer">
            <h1 className="learning-hud-viewer-title">COURSE NOT FOUND</h1>
            <p style={{ color: 'var(--lhud-text-secondary)' }}>
              Unable to establish connection to course data.
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
              <div className="learning-hud-loading">LOADING DATA STREAM</div>
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
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                    <h3 style={{
                      marginBottom: '16px',
                      fontSize: '1.8rem',
                      color: 'var(--lhud-green)'
                    }}>
                      QUIZ COMPLETED - DATA VERIFIED
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
                        <strong>SCORE:</strong> {activeQuizDetail.bestAttempt?.score}%
                      </p>
                      <p style={{ fontSize: '1rem', color: 'var(--lhud-text-secondary)' }}>
                        REQUIRED: {activeQuizDetail.passScore}%
                      </p>
                    </div>
                    <p style={{ color: 'var(--lhud-text-secondary)', marginBottom: '16px' }}>
                      Neural sync verified. No re-attempt necessary.
                    </p>
                    <button
                      onClick={() => navigate(`/quiz/${activeQuizDetail.id}/attempt`)}
                      className="learning-hud-nav-btn"
                      style={{ marginTop: '1rem' }}
                    >
                      VIEW DETAILS
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
                      <div style={{
                        fontSize: '4rem',
                        marginBottom: '16px',
                        filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.3))'
                      }}>📝</div>
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
                        {activeQuizDetail.description || 'Knowledge verification checkpoint'}
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
                          color: 'var(--lhud-cyan)',
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
                          Questions
                        </p>
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
                          Pass Score
                        </p>
                      </div>

                      {activeQuizDetail.hasAttempts && (
                        <div style={{
                          padding: '20px',
                          backgroundColor: 'var(--lhud-deep-space)',
                          borderRadius: '12px',
                          border: '1px solid var(--lhud-border)',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '2rem',
                            color: activeQuizDetail.attemptsCount >= 3 ? 'var(--lhud-red)' : 'var(--lhud-cyan)',
                            marginBottom: '8px',
                            fontFamily: '"Space Habitat", monospace'
                          }}>
                            {activeQuizDetail.attemptsCount}/3
                          </div>
                          <p style={{
                            margin: '0',
                            color: 'var(--lhud-text-secondary)',
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            Attempts
                          </p>
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
                          background: activeQuizDetail.hasAttempts 
                            ? 'linear-gradient(135deg, var(--lhud-orange) 0%, var(--lhud-red) 100%)'
                            : 'linear-gradient(135deg, var(--lhud-cyan) 0%, var(--lhud-blue) 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: activeQuizDetail.hasAttempts
                            ? '0 4px 20px rgba(255, 165, 0, 0.3)'
                            : '0 4px 20px rgba(0, 255, 255, 0.3)',
                          transform: 'translateY(0)',
                        }}
                        onMouseEnter={(e) => {
                          const target = e.target as HTMLButtonElement;
                          target.style.transform = 'translateY(-2px)';
                          target.style.boxShadow = activeQuizDetail.hasAttempts
                            ? '0 8px 32px rgba(255, 165, 0, 0.4)'
                            : '0 8px 32px rgba(0, 255, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          const target = e.target as HTMLButtonElement;
                          target.style.transform = 'translateY(0)';
                          target.style.boxShadow = activeQuizDetail.hasAttempts
                            ? '0 4px 20px rgba(255, 165, 0, 0.3)'
                            : '0 4px 20px rgba(0, 255, 255, 0.3)';
                        }}
                        disabled={activeQuizDetail.attemptsCount >= 3}
                      >
                        {activeQuizDetail.attemptsCount >= 3
                          ? 'MAX ATTEMPTS REACHED'
                          : activeQuizDetail.hasAttempts
                          ? `RETRY VERIFICATION (${activeQuizDetail.attemptsCount}/3)`
                          : 'BEGIN VERIFICATION'}
                      </button>
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
                        VIDEO DATA UNAVAILABLE
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
                      {activeLessonDetail.contentText || 'Content data not available.'}
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
                        📎 ATTACHED FILES
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
                UNABLE TO LOAD CONTENT
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--lhud-text-secondary)' }}>
                  {course.description}
                </p>
                <p style={{ color: 'var(--lhud-text-dim)', marginTop: '1rem' }}>
                  Select a lesson from System Log to begin neural sync.
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