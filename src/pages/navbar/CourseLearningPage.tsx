import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useTheme } from '../../context/ThemeContext'; // Assuming you have this context
import '../../styles/CourseLearningPage.css';

// --- MOCK DATA --- //
const courseData = {
  title: "The Complete React Developer Course",
  modules: [
    {
      id: 1,
      title: "Introduction to React",
      lessons: [
        { id: 1, type: 'video', title: "Welcome to the Course", duration: "05:30", isPreview: true },
        { id: 2, type: 'reading', title: "Setting Up Your Development Environment", duration: "15 min read" },
        { id: 3, type: 'video', title: "Creating Your First React App", duration: "12:15" },
        { id: 4, type: 'quiz', title: "Module 1 Quiz", duration: "5 questions" },
      ]
    },
    {
      id: 2,
      title: "Components, Props, and State",
      lessons: [
        { id: 1, type: 'video', title: "Understanding Functional Components", duration: "18:40" },
        { id: 2, type: 'reading', title: "Passing Data with Props", duration: "20 min read" },
        { id: 3, type: 'video', title: "Managing State with Hooks (useState)", duration: "25:00" },
        { id: 4, type: 'quiz', title: "Module 2 Quiz", duration: "8 questions" },
      ]
    },
    {
      id: 3,
      title: "Advanced Hooks and State Management",
      lessons: [
        { id: 1, type: 'video', title: "Side Effects with useEffect", duration: "22:10" },
        { id: 2, type: 'reading', title: "Global State with Context API", duration: "30 min read" },
        { id: 3, type: 'video', title: "Performance Optimization with useMemo", duration: "17:55" },
        { id: 4, type: 'quiz', title: "Final Exam", duration: "20 questions" },
      ]
    }
  ]
};

type LessonContent = {
  videoUrl?: string;
  content?: string;
  questions?: {
    question: string;
    options: string[];
    answer: string;
  }[];
};

const lessonContentData: { [key: string]: LessonContent } = {
  '1-1': { videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk' },
  '1-2': {
    content: `<h2>Setting Up Your Environment</h2><p>Before you can start building amazing React applications, you need to set up your development environment. This involves two main tools: <strong>Node.js</strong> and a <strong>code editor</strong>.</p><h3>1. Install Node.js</h3><p>React development requires Node.js and its package manager, npm. You can download the latest LTS (Long Term Support) version from the official <a href="https://nodejs.org/" target="_blank">Node.js website</a>.</p><code># Verify installation in your terminal<br/>node -v<br/>npm -v</code><h3>2. Choose a Code Editor</h3><p>We recommend using Visual Studio Code (VS Code), a free and powerful editor with excellent support for JavaScript and React. Download it from the <a href="https://code.visualstudio.com/" target="_blank">official VS Code website</a>.</p>`
  },
  '1-4': {
    questions: [
      {
        question: "What is JSX?",
        options: ["A JavaScript library", "A syntax extension for JavaScript", "A CSS preprocessor", "A database query language"],
        answer: "A syntax extension for JavaScript"
      },
      {
        question: "How do you create a React app?",
        options: ["npx make-react-app", "npm init react-app", "npx create-react-app", "npm create-react-app"],
        answer: "npx create-react-app"
      }
    ]
  },
  // Add more content for other lessons as needed
};


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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [activeLesson, setActiveLesson] = useState({ moduleId: 1, lessonId: 1 });
  const [lessonStatuses, setLessonStatuses] = useState<{ [key: string]: 'completed' | 'in-progress' }>({
    '1-1': 'in-progress'
  });

  const totalLessons = useMemo(() => courseData.modules.reduce((acc, mod) => acc + mod.lessons.length, 0), []);
  const completedLessons = useMemo(() => Object.values(lessonStatuses).filter(s => s === 'completed').length, [lessonStatuses]);
  const progressPercentage = useMemo(() => (completedLessons / totalLessons) * 100, [completedLessons, totalLessons]);

  const currentLesson = courseData.modules
    .find(m => m.id === activeLesson.moduleId)?.lessons
    .find(l => l.id === activeLesson.lessonId);

  const currentContent = lessonContentData[`${activeLesson.moduleId}-${activeLesson.lessonId}`] || {};

  const handleToggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSelectLesson = (moduleId: number, lessonId: number) => {
    const statusKey = `${moduleId}-${lessonId}`;
    if (lessonStatuses[statusKey] === 'completed') {
       setActiveLesson({ moduleId, lessonId });
    } else {
      setActiveLesson({ moduleId, lessonId });
      setLessonStatuses(prev => ({ ...prev, [statusKey]: 'in-progress' }));
    }
  };
  
  const handleMarkAsComplete = () => {
    const statusKey = `${activeLesson.moduleId}-${activeLesson.lessonId}`;
    setLessonStatuses(prev => ({ ...prev, [statusKey]: 'completed' }));
    // Optionally, move to the next lesson automatically
    handleNextLesson();
  };

  const findNextLesson = () => {
    const currentModuleIndex = courseData.modules.findIndex(m => m.id === activeLesson.moduleId);
    const currentLessonIndex = courseData.modules[currentModuleIndex].lessons.findIndex(l => l.id === activeLesson.lessonId);

    if (currentLessonIndex < courseData.modules[currentModuleIndex].lessons.length - 1) {
      return { moduleId: activeLesson.moduleId, lessonId: courseData.modules[currentModuleIndex].lessons[currentLessonIndex + 1].id };
    }
    if (currentModuleIndex < courseData.modules.length - 1) {
      return { moduleId: courseData.modules[currentModuleIndex + 1].id, lessonId: courseData.modules[currentModuleIndex + 1].lessons[0].id };
    }
    return null; // End of course
  }

  const handleNextLesson = () => {
    const nextLesson = findNextLesson();
    if (nextLesson) {
      handleSelectLesson(nextLesson.moduleId, nextLesson.lessonId);
    } else {
      alert("Congratulations! You've completed the course!");
    }
  };

  return (
    <div className={`course-learning-container ${theme}`} data-theme={theme}>
      <header className="course-learning-header">
        <div className="course-learning-header-left">
          <button onClick={() => navigate('/courses')} className="course-learning-back-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="course-learning-course-title">
            <h3>{courseData.title}</h3>
            <span>{currentLesson?.title}</span>
          </div>
        </div>
        <div className="course-learning-header-center">
          <div className="course-learning-progress-bar-container">
            <div className="course-learning-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <span className="course-learning-progress-text">{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="course-learning-header-right">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="course-learning-sidebar-toggle">
            <LayoutDashboard size={20} />
            <span>Course Content</span>
          </button>
        </div>
      </header>

      <div className="course-learning-body">
        <aside className={`course-learning-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="course-learning-sidebar-content">
            {courseData.modules.map(module => {
              const isExpanded = expandedModules.includes(module.id);
              return (
                <div key={module.id} className="course-learning-module">
                  <button className="course-learning-module-header" onClick={() => handleToggleModule(module.id)}>
                    <span className="course-learning-module-title">Module {module.id}: {module.title}</span>
                    <ChevronDown className={`course-learning-expand-icon ${isExpanded ? 'expanded' : ''}`} />
                  </button>
                  {isExpanded && (
                    <ul className="course-learning-lessons-list">
                      {module.lessons.map(lesson => {
                        const statusKey = `${module.id}-${lesson.id}`;
                        const status = lessonStatuses[statusKey];
                        const isActive = activeLesson.moduleId === module.id && activeLesson.lessonId === lesson.id;
                        const isLocked = !lesson.isPreview && !lessonStatuses[`${module.id}-${lesson.id-1}`] && lesson.id !== 1;

                        return (
                          <li key={lesson.id}>
                            <button
                              className={`course-learning-lesson-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                              onClick={() => !isLocked && handleSelectLesson(module.id, lesson.id)}
                              disabled={isLocked}
                            >
                              <div className="course-learning-lesson-info">
                                {status === 'completed' ? <CheckCircle className="course-learning-status-icon completed" /> : <LessonIcon type={lesson.type} />}
                                <div className="course-learning-lesson-details">
                                  <span className="course-learning-lesson-title">{lesson.title}</span>
                                  <span className="course-learning-lesson-duration">{lesson.duration}</span>
                                </div>
                              </div>
                              {isLocked && <Lock size={16} className="course-learning-lock-icon" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="course-learning-main-content">
          <div className="course-learning-content-viewer">
            <h1 className="course-learning-viewer-title">{currentLesson?.title}</h1>
            
            {currentLesson?.type === 'video' && (
              <div className="course-learning-video-player">
                <iframe
                  src={currentContent.videoUrl}
                  title={currentLesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {currentLesson?.type === 'reading' && (
              <div className="course-learning-reading-content"
                   dangerouslySetInnerHTML={{ __html: currentContent.content || '<p>No content available.</p>' }}
              />
            )}

            {currentLesson?.type === 'quiz' && (
              <div className="course-learning-quiz-content">
                <p>Test your knowledge. There are <strong>{currentContent.questions?.length || 0}</strong> questions in this quiz.</p>
                {/* A full quiz component would go here */}
                <button className="course-learning-quiz-start-btn">Start Quiz</button>
              </div>
            )}
          </div>

          <footer className="course-learning-content-footer">
            <button className="course-learning-nav-btn prev">
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>
            <button 
              className="course-learning-complete-btn"
              onClick={handleMarkAsComplete}
              disabled={lessonStatuses[`${activeLesson.moduleId}-${activeLesson.lessonId}`] === 'completed'}
            >
              <CheckCircle size={20} />
              <span>
                {lessonStatuses[`${activeLesson.moduleId}-${activeLesson.lessonId}`] === 'completed' ? 'Completed' : 'Mark as Complete'}
              </span>
            </button>
            <button className="course-learning-nav-btn next" onClick={handleNextLesson}>
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default CourseLearningPage;
