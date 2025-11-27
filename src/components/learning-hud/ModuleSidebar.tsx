import React from 'react';
import {
  ChevronDown,
  PlayCircle,
  FileText,
  HelpCircle,
  Circle,
  CheckCircle,
  Lock
} from 'lucide-react';
import HoloProgressBar from './HoloProgressBar';
import './learning-hud.css';

interface Lesson {
  id: number;
  title: string;
  type: string;
  orderIndex?: number;
}

interface Quiz {
  id: number;
  title: string;
  orderIndex?: number;
}

interface Module {
  id: number;
  title: string;
  orderIndex?: number;
  lessons?: Lesson[];
  quizzes?: Quiz[];
}

interface ModuleSidebarProps {
  modules: Module[];
  expandedModules: number[];
  activeLesson: { moduleId: number | null; lessonId: number | null };
  lessonStatuses: { [key: string]: 'completed' | 'in-progress' };
  progress: { completedLessons: number; totalLessons: number; percent: number };
  onToggleModule: (moduleId: number) => void;
  onSelectLesson: (moduleId: number, lessonId: number) => void;
  isOpen: boolean;
}

const LessonIcon = ({ type }: { type: string }) => {
  const iconClass = "learning-hud-lesson-icon";
  switch (type.toLowerCase()) {
    case 'video':
      return <PlayCircle className={iconClass} size={18} />;
    case 'reading':
      return <FileText className={iconClass} size={18} />;
    case 'quiz':
      return <HelpCircle className={iconClass} size={18} />;
    default:
      return <Circle className={iconClass} size={18} />;
  }
};

const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  modules,
  expandedModules,
  activeLesson,
  lessonStatuses,
  progress,
  onToggleModule,
  onSelectLesson,
  isOpen
}) => {
  return (
    <aside className={`learning-hud-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="learning-hud-sidebar-content">
        {/* Progress Bar at Top */}
        <div style={{ marginBottom: '2rem' }}>
          <HoloProgressBar percent={progress.percent} />
        </div>

        {/* Modules List */}
        {modules.map((module, idx) => {
          const isExpanded = expandedModules.includes(module.id);

          return (
            <div key={module.id} className="learning-hud-module">
              <button
                className="learning-hud-module-header"
                onClick={() => onToggleModule(module.id)}
              >
                <span className="learning-hud-module-title">
                  MODULE {module.orderIndex ?? idx + 1}: {module.title}
                </span>
                <ChevronDown
                  className={`learning-hud-expand-icon ${isExpanded ? 'expanded' : ''}`}
                  size={20}
                />
              </button>

              {isExpanded && (
                <ul className="learning-hud-lessons-list">
                  {/* Render Lessons */}
                  {module.lessons && module.lessons.length > 0 ? (
                    module.lessons
                      .slice()
                      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                      .map((lesson) => {
                        const statusKey = `${module.id}-${lesson.id}`;
                        const status = lessonStatuses[statusKey];
                        const isActive =
                          activeLesson.moduleId === module.id &&
                          activeLesson.lessonId === lesson.id;

                        return (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              className={`learning-hud-lesson-item ${
                                isActive ? 'active' : ''
                              } ${status === 'completed' ? 'completed' : ''}`}
                              onClick={() => onSelectLesson(module.id, lesson.id)}
                            >
                              <div className="learning-hud-lesson-info">
                                <LessonIcon type={lesson.type || ''} />
                                <div className="learning-hud-lesson-details">
                                  <span className="learning-hud-lesson-title">
                                    {lesson.title}
                                  </span>
                                </div>
                              </div>
                              {status === 'completed' && (
                                <CheckCircle
                                  className="learning-hud-status-icon completed"
                                  size={18}
                                />
                              )}
                            </button>
                          </li>
                        );
                      })
                  ) : null}

                  {/* Render Quizzes */}
                  {module.quizzes && module.quizzes.length > 0 &&
                    module.quizzes
                      .slice()
                      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                      .map((quiz) => {
                        const isActive =
                          activeLesson.moduleId === module.id &&
                          activeLesson.lessonId === quiz.id;

                        return (
                          <li key={`quiz-${quiz.id}`}>
                            <button
                              type="button"
                              className={`learning-hud-lesson-item ${
                                isActive ? 'active' : ''
                              }`}
                              onClick={() => onSelectLesson(module.id, quiz.id)}
                            >
                              <div className="learning-hud-lesson-info">
                                <HelpCircle className="learning-hud-lesson-icon" size={18} />
                                <div className="learning-hud-lesson-details">
                                  <span className="learning-hud-lesson-title">
                                    {quiz.title} (QUIZ)
                                  </span>
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}

                  {/* Empty State */}
                  {(!module.lessons || module.lessons.length === 0) &&
                    (!module.quizzes || module.quizzes.length === 0) && (
                      <li>
                        <div className="learning-hud-lesson-item learning-hud-empty-state">
                          <div className="learning-hud-lesson-info">
                            <FileText className="learning-hud-lesson-icon" size={18} />
                            <div className="learning-hud-lesson-details">
                              <span className="learning-hud-lesson-title">
                                DATA PENDING...
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
  );
};

export default ModuleSidebar;