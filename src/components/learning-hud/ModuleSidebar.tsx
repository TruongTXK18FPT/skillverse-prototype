import React from 'react';
import {
  ChevronDown,
  PlayCircle,
  FileText,
  HelpCircle,
  Circle,
  CheckCircle,
  Lock,
  ClipboardList
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

interface Assignment {
  id: number;
  title: string;
  orderIndex?: number;
}

interface Module {
  id: number;
  title: string;
  description?: string;
  orderIndex?: number;
  lessons?: Lesson[];
  quizzes?: Quiz[];
  assignments?: Assignment[];
}

type SidebarItem =
  | { itemType: 'lesson'; id: number; title: string; orderIndex: number; lessonType: string }
  | { itemType: 'quiz'; id: number; title: string; orderIndex: number }
  | { itemType: 'assignment'; id: number; title: string; orderIndex: number };

interface ModuleSidebarProps {
  modules: Module[];
  expandedModules: number[];
  activeLesson: { moduleId: number | null; lessonId: number | null; itemType?: string | null };
  itemStatuses: { [key: string]: 'completed' | 'in-progress' };
  progress: { completedItems: number; totalItems: number; percent: number };
  onToggleModule: (moduleId: number) => void;
  onSelectLesson: (moduleId: number, lessonId: number, itemType?: string) => void;
  disableLessonSelection?: boolean;
  onLockedLessonSelect?: () => void;
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

const sidebarItemPriority: Record<SidebarItem['itemType'], number> = {
  lesson: 0,
  assignment: 1,
  quiz: 2,
};

const buildOrderedModuleItems = (module: Module): SidebarItem[] => {
  const lessonItems: SidebarItem[] = (module.lessons || []).map((lesson) => ({
    itemType: 'lesson',
    id: lesson.id,
    title: lesson.title,
    orderIndex: lesson.orderIndex ?? 0,
    lessonType: lesson.type || '',
  }));

  const quizItems: SidebarItem[] = (module.quizzes || []).map((quiz) => ({
    itemType: 'quiz',
    id: quiz.id,
    title: quiz.title,
    orderIndex: quiz.orderIndex ?? 0,
  }));

  const assignmentItems: SidebarItem[] = (module.assignments || []).map((assignment) => ({
    itemType: 'assignment',
    id: assignment.id,
    title: assignment.title,
    orderIndex: assignment.orderIndex ?? 0,
  }));

  return [...lessonItems, ...quizItems, ...assignmentItems].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    if (sidebarItemPriority[a.itemType] !== sidebarItemPriority[b.itemType]) {
      return sidebarItemPriority[a.itemType] - sidebarItemPriority[b.itemType];
    }
    return a.id - b.id;
  });
};

const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  modules,
  expandedModules,
  activeLesson,
  itemStatuses,
  progress,
  onToggleModule,
  onSelectLesson,
  disableLessonSelection = false,
  onLockedLessonSelect,
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
          const orderedItems = buildOrderedModuleItems(module);

          return (
            <div key={module.id} className="learning-hud-module">
              <button
                className="learning-hud-module-header"
                onClick={() => onToggleModule(module.id)}
              >
                <span className="learning-hud-module-title">
                  CHƯƠNG {idx + 1}: {module.title}
                </span>
                <ChevronDown
                  className={`learning-hud-expand-icon ${isExpanded ? 'expanded' : ''}`}
                  size={20}
                />
              </button>

              {isExpanded && (
                <>
                <ul className="learning-hud-lessons-list">
                  {orderedItems.map((item) => {
                    const statusKey = `${module.id}-${item.itemType}-${item.id}`;
                    const status = itemStatuses[statusKey];
                    const isActive =
                      activeLesson.moduleId === module.id &&
                      activeLesson.lessonId === item.id &&
                      (activeLesson.itemType === item.itemType ||
                        (item.itemType === 'lesson' && activeLesson.itemType == null));

                    return (
                      <li key={`${item.itemType}-${item.id}`}>
                        <button
                          type="button"
                          className={`learning-hud-lesson-item ${
                            isActive ? 'active' : ''
                          } ${status === 'completed' ? 'completed' : ''} ${disableLessonSelection ? 'locked' : ''}`}
                          onClick={() => {
                            if (disableLessonSelection) {
                              onLockedLessonSelect?.();
                              return;
                            }
                            onSelectLesson(module.id, item.id, item.itemType);
                          }}
                          disabled={disableLessonSelection}
                        >
                          <div className="learning-hud-lesson-info">
                            {item.itemType === 'lesson' ? (
                              <LessonIcon type={item.lessonType || ''} />
                            ) : item.itemType === 'quiz' ? (
                              <HelpCircle className="learning-hud-lesson-icon" size={18} />
                            ) : (
                              <ClipboardList className="learning-hud-lesson-icon" size={18} />
                            )}
                            <div className="learning-hud-lesson-details">
                              <span className="learning-hud-lesson-title">
                                {item.itemType === 'quiz' ? `${item.title} (BÀI KIỂM TRA)` : item.title}
                              </span>
                              {item.itemType === 'assignment' && (
                                <span className="learning-hud-lesson-badge assignment-badge">
                                  BÀI TẬP
                                </span>
                              )}
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
                  })}

                  {/* Empty State */}
                  {orderedItems.length === 0 && (
                      <li>
                        <div className="learning-hud-lesson-item learning-hud-empty-state">
                          <div className="learning-hud-lesson-info">
                            <FileText className="learning-hud-lesson-icon" size={18} />
                            <div className="learning-hud-lesson-details">
                              <span className="learning-hud-lesson-title">
                                Đang cập nhật nội dung...
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}
                </ul>
                </>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default ModuleSidebar;
