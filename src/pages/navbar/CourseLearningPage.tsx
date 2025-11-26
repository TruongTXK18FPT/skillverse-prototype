import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle,
  Circle,
  Lock,
  ChevronLeft,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getCourse } from "../../services/courseService";
import { listModulesWithContent } from "../../services/moduleService";
import { getEnrollment } from "../../services/enrollmentService";
import {
  getLessonById,
  listLessonsByModule,
  getNextLesson,
  getPrevLesson,
  completeLesson,
  getModuleProgress,
} from "../../services/lessonService";
import { getQuizById, getUserQuizAttempts } from "../../services/quizService";
import { CourseDetailDTO } from "../../data/courseDTOs";
import AttachmentManager from "../../components/course/AttachmentManager";
import "../../styles/CourseLearningPage.css";

// Không dùng mock; dữ liệu lấy từ BE

type LessonContent = {
  videoUrl?: string;
  content?: string;
  questions?: {
    question: string;
    options: string[];
    answer: string;
  }[];
};

const lessonContentData: { [key: string]: LessonContent } = {};

// --- HELPER COMPONENTS --- //
const LessonIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "video":
      return <PlayCircle className="course-learning-lesson-icon" />;
    case "reading":
      return <FileText className="course-learning-lesson-icon" />;
    case "quiz":
      return <HelpCircle className="course-learning-lesson-icon" />;
    default:
      return <Circle className="course-learning-lesson-icon" />;
  }
};

// --- MAIN COMPONENT --- //
const CourseLearningPage = () => {
  const { theme } = useTheme();
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
  }, [activeLesson.lessonId, activeLesson.moduleId, modulesWithContent]);

  const sortedModules = useMemo(() => {
    const list = course?.modules ? [...course.modules] : [];
    return list.sort(
      (a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );
  }, [course]);

  const progressPercentage = useMemo(() => progress.percent || 0, [progress]);

  const currentLesson = undefined as unknown as
    | { id: number; type: string; title: string; duration?: string }
    | undefined;

  const currentContent =
    lessonContentData[`${activeLesson.moduleId}-${activeLesson.lessonId}`] ||
    {};

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
    if (foundLesson) setActiveLessonTitle(foundLesson.title);
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
      // Không tự động chuyển bài: để nút "Tiếp" đảm nhiệm việc điều hướng
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

  if (loading) {
    return (
      <div className={`course-learning-container ${theme}`} data-theme={theme}>
        <div className="course-learning-header">
          <span>Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`course-learning-container ${theme}`} data-theme={theme}>
        <div className="course-learning-header">
          <button
            onClick={() => navigate(-1)}
            className="course-learning-back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <span>Không tìm thấy khóa học</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`course-learning-container ${theme}`} data-theme={theme}>
      <header className="course-learning-header">
        <div className="course-learning-header-left">
          <button
            onClick={() => navigate("/courses")}
            className="course-learning-back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="course-learning-course-title">
            <h3>{course.title}</h3>
            <span>{course.description}</span>
          </div>
        </div>
        <div className="course-learning-header-center">
          <div className="course-learning-progress-bar-container">
            <div
              className="course-learning-progress-bar"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="course-learning-progress-text">
            Hoàn thành {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="course-learning-header-right">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="course-learning-sidebar-toggle"
          >
            <LayoutDashboard size={20} />
            <span>Nội dung khóa học</span>
          </button>
        </div>
      </header>

      <div className="course-learning-body">
        <aside
          className={`course-learning-sidebar ${isSidebarOpen ? "open" : ""}`}
        >
          <div className="course-learning-sidebar-content">
            {(modulesWithContent.length
              ? modulesWithContent
              : sortedModules
            )?.map((module: any, idx: number) => {
              const isExpanded = expandedModules.includes(module.id);
              return (
                <div key={module.id} className="course-learning-module">
                  <button
                    className="course-learning-module-header"
                    onClick={() => handleToggleModule(module.id)}
                  >
                    <span className="course-learning-module-title">
                      Module {module.orderIndex ?? idx + 1}: {module.title}
                    </span>
                    <ChevronDown
                      className={`course-learning-expand-icon ${
                        isExpanded ? "expanded" : ""
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <ul className="course-learning-lessons-list">
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons
                          .slice()
                          .sort(
                            (a: any, b: any) =>
                              (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                          )
                          .map((lesson: any) => (
                            <li key={lesson.id}>
                              <button
                                type="button"
                                className="course-learning-lesson-item"
                                onClick={() =>
                                  handleSelectLesson(module.id, lesson.id)
                                }
                              >
                                <div className="course-learning-lesson-info">
                                  <LessonIcon
                                    type={(lesson.type || "").toLowerCase()}
                                  />
                                  <div className="course-learning-lesson-details">
                                    <span className="course-learning-lesson-title">
                                      {lesson.title}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))
                      ) : null}
                      
                      {/* RENDER QUIZZES */}
                      {module.quizzes && module.quizzes.length > 0 && (
                        module.quizzes
                          .slice()
                          .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                          .map((quiz: any) => (
                            <li key={`quiz-${quiz.id}`}>
                              <button
                                type="button"
                                className="course-learning-lesson-item"
                                onClick={() => handleSelectLesson(module.id, quiz.id)}
                              >
                                <div className="course-learning-lesson-info">
                                  <HelpCircle className="course-learning-lesson-icon" />
                                  <div className="course-learning-lesson-details">
                                    <span className="course-learning-lesson-title">
                                      {quiz.title} (Quiz)
                                    </span>
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))
                      )}
                      
                      {/* EMPTY STATE */}
                      {(!module.lessons || module.lessons.length === 0) && (!module.quizzes || module.quizzes.length === 0) && (
                        <li>
                          <div className="course-learning-lesson-item">
                            <div className="course-learning-lesson-info">
                              <FileText className="course-learning-lesson-icon" />
                              <div className="course-learning-lesson-details">
                                <span className="course-learning-lesson-title">
                                  Nội dung module đang cập nhật
                                </span>
                              </div>
                            </div>
                          </div>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="course-learning-main-content">
          <div className="course-learning-content-viewer">
            <h1 className="course-learning-viewer-title">
              {activeLessonTitle || course.title}
            </h1>
            <div className="course-learning-reading-content">
              {loadingLessonDetail ? (
                <p>Đang tải nội dung...</p>
              ) : activeItemType === 'quiz' && activeQuizDetail ? (
                <>
                  {activeQuizDetail.hasPassed ? (
                    /* SHOW RESULT IF ALREADY PASSED */
                    <div style={{ padding: '40px', backgroundColor: '#d4edda', borderRadius: '12px', textAlign: 'center', border: '2px solid #28a745' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                      <h3 style={{ marginBottom: '16px', fontSize: '1.8rem', color: '#155724' }}>Bạn đã hoàn thành quiz này!</h3>
                      <div style={{ display: 'inline-block', marginBottom: '24px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
                        <p style={{ marginBottom: '8px', fontSize: '1.2rem' }}><strong>Điểm số:</strong> {activeQuizDetail.bestAttempt?.score}%</p>
                        <p style={{ fontSize: '1rem', color: '#666' }}>Yêu cầu: {activeQuizDetail.passScore}%</p>
                      </div>
                      <p style={{ color: '#155724', marginBottom: '16px' }}>Bạn không cần làm lại quiz này.</p>
                      <button
                        onClick={() => navigate(`/quiz/${activeQuizDetail.id}/attempt`)}
                        style={{
                          padding: '12px 32px',
                          fontSize: '1rem',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  ) : (
                    /* QUIZ PREVIEW - Navigate to quiz page */
                    <div style={{ padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '12px', textAlign: 'center' }}>
                      <h3 style={{ marginBottom: '16px', fontSize: '1.8rem' }}>📝 {activeQuizDetail.title}</h3>
                      <p style={{ marginBottom: '24px', color: '#666', fontSize: '1.1rem' }}>
                        {activeQuizDetail.description || 'Kiểm tra kiến thức của bạn'}
                      </p>
                      <div style={{ display: 'inline-block', marginBottom: '24px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'left' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Số câu hỏi:</strong> {activeQuizDetail.questions?.length || 0}</p>
                        <p style={{ marginBottom: '8px' }}><strong>Điểm đạt:</strong> {activeQuizDetail.passScore}%</p>
                        {activeQuizDetail.hasAttempts && (
                          <p style={{ color: '#666', marginTop: '12px' }}>
                            <strong>Số lần làm:</strong> {activeQuizDetail.attemptsCount}/3
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/quiz/${activeQuizDetail.id}/attempt`)}
                        style={{
                          padding: '16px 48px',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {activeQuizDetail.hasAttempts ? `Làm lại (${activeQuizDetail.attemptsCount}/3)` : 'Bắt đầu Quiz'}
                      </button>
                    </div>
                  )}
                </>
              ) : activeLessonDetail ? (
                <>
                  {/* VIDEO LESSON */}
                  {activeLessonDetail.type === 'VIDEO' && (
                    <div className="course-learning-video-player">
                      {activeLessonDetail.videoUrl ? (
                        <iframe
                          src={activeLessonDetail.videoUrl}
                          title={activeLessonDetail.title}
                          allowFullScreen
                        />
                      ) : (
                        <p>Video chưa được upload.</p>
                      )}
                    </div>
                  )}
                  
                  {/* READING LESSON */}
                  {activeLessonDetail.type === 'READING' && (
                    <>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', marginBottom: '24px' }}>
                        {activeLessonDetail.contentText || 'Nội dung bài đọc chưa có.'}
                      </div>
                      
                      {/* ATTACHMENTS */}
                      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>📎 Tài liệu đính kèm</h3>
                        <AttachmentManager
                          lessonId={activeLessonDetail.id}
                          editable={false}
                        />
                      </div>
                    </>
                  )}
                </>
              ) : activeLessonTitle ? (
                <p>Không thể tải nội dung.</p>
              ) : (
                <>
                  <p>{course.description}</p>
                  <p>Chọn một bài học để bắt đầu.</p>
                </>
              )}
            </div>
          </div>

          <footer className="course-learning-content-footer">
            <button
              className="course-learning-nav-btn prev"
              onClick={async () => {
                const prev = await findPrevLesson();
                if (prev) handleSelectLesson(prev.moduleId, prev.lessonId);
              }}
              disabled={!activeLesson.lessonId}
            >
              <ChevronLeft size={18} />
              <span>Trước</span>
            </button>
            <button
              className="course-learning-complete-btn"
              onClick={handleMarkAsComplete}
              disabled={!activeLesson.moduleId}
            >
              <CheckCircle size={20} />
              <span>Đánh dấu hoàn thành</span>
            </button>
            <button
              className="course-learning-nav-btn next"
              onClick={handleNextLesson}
              disabled={!activeLesson.lessonId}
            >
              <span>Tiếp</span>
              <ChevronRight size={18} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default CourseLearningPage;
