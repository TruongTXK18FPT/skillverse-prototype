import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getCourse } from '../../services/courseService';
import { listModulesWithContent } from '../../services/moduleService';
import { getEnrollment } from '../../services/enrollmentService';
import { CourseDetailDTO } from '../../data/courseDTOs';
import '../../styles/CourseLearningPage.css';

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
    case 'video': return <PlayCircle className="course-learning-lesson-icon" />;
    case 'reading': return <FileText className="course-learning-lesson-icon" />;
    case 'quiz': return <HelpCircle className="course-learning-lesson-icon" />;
    default: return <Circle className="course-learning-lesson-icon" />;
  }
};

// --- MAIN COMPONENT --- //
const CourseLearningPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const courseId: number | undefined = location.state?.courseId;

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [modulesWithContent, setModulesWithContent] = useState<any[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [activeLesson, setActiveLesson] = useState<{ moduleId: number | null; lessonId: number | null }>({ moduleId: null, lessonId: null });
  const [activeLessonTitle, setActiveLessonTitle] = useState<string>('');
  const [lessonStatuses, setLessonStatuses] = useState<{ [key: string]: 'completed' | 'in-progress' }>({
    
  });

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
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
        const firstWithLesson = mods.find((m: any) => (m.lessons || []).length > 0);
        if (firstWithLesson) {
          const firstLesson = [...firstWithLesson.lessons].sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))[0];
          setExpandedModules([firstWithLesson.id]);
          setActiveLesson({ moduleId: firstWithLesson.id, lessonId: firstLesson.id });
          setActiveLessonTitle(firstLesson.title);
        }
      })
      .catch(() => setModulesWithContent([]));
  }, [courseId]);

  const sortedModules = useMemo(() => {
    const list = course?.modules ? [...course.modules] : [];
    return list.sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [course]);

  const totalLessons = useMemo(() => 0, []);
  const completedLessons = useMemo(() => Object.values(lessonStatuses).filter(s => s === 'completed').length, [lessonStatuses]);
  const progressPercentage = useMemo(() => (completedLessons / totalLessons) * 100, [completedLessons, totalLessons]);

  const currentLesson = undefined as unknown as { id: number; type: string; title: string; duration?: string } | undefined;

  const currentContent = lessonContentData[`${activeLesson.moduleId}-${activeLesson.lessonId}`] || {};

  const handleToggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
    // set an active placeholder lesson for enabling complete action
    setActiveLesson(prev => prev.moduleId ? prev : { moduleId, lessonId: 1 });
  };

  const handleSelectLesson = (moduleId: number, lessonId: number) => {
    const statusKey = `${moduleId}-${lessonId}`;
    if (lessonStatuses[statusKey] === 'completed') {
       setActiveLesson({ moduleId, lessonId });
    } else {
      setActiveLesson({ moduleId, lessonId });
      setLessonStatuses(prev => ({ ...prev, [statusKey]: 'in-progress' }));
    }
    const foundModule = (modulesWithContent.length ? modulesWithContent : sortedModules).find((m: any) => m.id === moduleId);
    const foundLesson = foundModule?.lessons?.find((l: any) => l.id === lessonId);
    if (foundLesson) setActiveLessonTitle(foundLesson.title);
  };
  
  const handleMarkAsComplete = () => {
    const statusKey = `${activeLesson.moduleId}-${activeLesson.lessonId}`;
    setLessonStatuses(prev => ({ ...prev, [statusKey]: 'completed' }));
    // Optionally, move to the next lesson automatically
    handleNextLesson();
  };

  const findNextLesson = () => null;

  const handleNextLesson = () => {
    const nextLesson = findNextLesson();
    if (nextLesson) {
      handleSelectLesson(nextLesson.moduleId, nextLesson.lessonId);
    } else {
      alert("Congratulations! You've completed the course!");
    }
  };

  if (loading) {
    return (
      <div className={`course-learning-container ${theme}`} data-theme={theme}>
        <div className="course-learning-header"><span>Đang tải...</span></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`course-learning-container ${theme}`} data-theme={theme}>
        <div className="course-learning-header">
          <button onClick={() => navigate(-1)} className="course-learning-back-btn">
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
          <button onClick={() => navigate('/courses')} className="course-learning-back-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="course-learning-course-title">
            <h3>{course.title}</h3>
            <span>{course.description}</span>
          </div>
        </div>
        <div className="course-learning-header-center">
          <div className="course-learning-progress-bar-container">
            <div className="course-learning-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <span className="course-learning-progress-text">Hoàn thành {Math.round(progressPercentage)}%</span>
        </div>
        <div className="course-learning-header-right">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="course-learning-sidebar-toggle">
            <LayoutDashboard size={20} />
            <span>Nội dung khóa học</span>
          </button>
        </div>
      </header>

      <div className="course-learning-body">
        <aside className={`course-learning-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="course-learning-sidebar-content">
            {(modulesWithContent.length ? modulesWithContent : sortedModules)?.map((module: any, idx: number) => {
              const isExpanded = expandedModules.includes(module.id);
              return (
                <div key={module.id} className="course-learning-module">
                  <button className="course-learning-module-header" onClick={() => handleToggleModule(module.id)}>
                    <span className="course-learning-module-title">Module {(module.orderIndex ?? (idx + 1))}: {module.title}</span>
                    <ChevronDown className={`course-learning-expand-icon ${isExpanded ? 'expanded' : ''}`} />
                  </button>
                  {isExpanded && (
                    <ul className="course-learning-lessons-list">
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons
                          .slice()
                          .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                          .map((lesson: any) => (
                            <li key={lesson.id}>
                              <button type="button" className="course-learning-lesson-item" onClick={() => handleSelectLesson(module.id, lesson.id)}>
                                <div className="course-learning-lesson-info">
                                  <LessonIcon type={(lesson.type || '').toLowerCase()} />
                                  <div className="course-learning-lesson-details">
                                    <span className="course-learning-lesson-title">{lesson.title}</span>
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))
                      ) : (
                        <li>
                          <div className="course-learning-lesson-item">
                            <div className="course-learning-lesson-info">
                              <FileText className="course-learning-lesson-icon" />
                              <div className="course-learning-lesson-details">
                                <span className="course-learning-lesson-title">Nội dung module đang cập nhật</span>
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
            <h1 className="course-learning-viewer-title">{activeLessonTitle || course.title}</h1>
            <div className="course-learning-reading-content">
              {activeLessonTitle ? (
                <p>Nội dung bài học sẽ hiển thị ở đây (đang chờ BE trả về chi tiết lesson).</p>
              ) : (
                <>
                  <p>{course.description}</p>
                  <p>Chi tiết bài học sẽ hiển thị sau khi BE cung cấp API lessons.</p>
                </>
              )}
            </div>
          </div>

          <footer className="course-learning-content-footer">
            <button className="course-learning-nav-btn prev" disabled>
              <ChevronLeft size={18} />
              <span>Trước</span>
            </button>
            <button 
              className="course-learning-complete-btn"
              onClick={handleMarkAsComplete}
              disabled={!activeLesson.moduleId}
            >
              <CheckCircle size={20} />
              <span>
                Đánh dấu hoàn thành
              </span>
            </button>
            <button className="course-learning-nav-btn next" onClick={handleNextLesson} disabled>
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
