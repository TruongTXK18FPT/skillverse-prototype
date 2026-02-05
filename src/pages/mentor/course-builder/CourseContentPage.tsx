/**
 * CourseContentPage
 * 
 * Full-page content management for course modules and lessons.
 * Replaces modal-based content editing with dedicated page experience.
 * 
 * Features:
 * - Module list with drag-drop reordering
 * - Lesson management per module
 * - Different lesson types: video, reading, quiz, assignment
 * - Inline editing with auto-save
 * 
 * @module pages/mentor/CourseContentPage
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiChevronDown,
  FiChevronUp,
  FiPlay,
  FiFileText,
  FiHelpCircle,
  FiClipboard,
  FiCode,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiBookOpen,
  FiLayers,
  FiSettings,
  FiEye,
  FiClock
} from 'react-icons/fi';
import { useCourseManagement, ModuleWithLessons } from '../../../context/mentor/CourseManagementContext';
import { LessonSummaryDTO, LessonType as DTOLessonType } from '../../../data/courseDTOs';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import '../../../styles/course-builder.css';

// ============================================================================
// TYPES
// ============================================================================

type LessonType = 'video' | 'reading' | 'quiz' | 'assignment' | 'codelab';

// ============================================================================
// CONSTANTS
// ============================================================================

const LESSON_TYPES: { value: LessonType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'video', label: 'Video', icon: <FiPlay />, color: '#ef4444' },
  { value: 'reading', label: 'Reading', icon: <FiFileText />, color: '#3b82f6' },
  { value: 'quiz', label: 'Quiz', icon: <FiHelpCircle />, color: '#8b5cf6' },
  { value: 'assignment', label: 'Assignment', icon: <FiClipboard />, color: '#f59e0b' },
  { value: 'codelab', label: 'Code Lab', icon: <FiCode />, color: '#10b981' }
];

// Map DTO LessonType to local type
const mapLessonType = (type: DTOLessonType): LessonType => {
  const typeMap: Record<DTOLessonType, LessonType> = {
    [DTOLessonType.VIDEO]: 'video',
    [DTOLessonType.READING]: 'reading',
    [DTOLessonType.QUIZ]: 'quiz',
    [DTOLessonType.ASSIGNMENT]: 'assignment',
    [DTOLessonType.CODELAB]: 'codelab'
  };
  return typeMap[type] || 'reading';
};

// ============================================================================
// COMPONENT
// ============================================================================

const CourseContentPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  const {
    state,
    loadCourseForEdit,
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
    addLesson,
    updateLesson,
    deleteLesson
  } = useCourseManagement();

  const { currentCourse, modules, isLoading, error } = state;

  // Local state
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'default' | 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // Form states
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<LessonType>('video');

  // Load course data
  useEffect(() => {
    if (courseId) {
      loadCourseForEdit(courseId);
    }
  }, [courseId, loadCourseForEdit]);

  // Expand first module by default
  useEffect(() => {
    if (modules.length > 0 && expandedModules.size === 0) {
      setExpandedModules(new Set([modules[0].id.toString()]));
    }
  }, [modules, expandedModules.size]);

  // ============================================================================
  // HANDLERS - MODULES
  // ============================================================================

  const toggleModuleExpand = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, []);

  const handleAddModule = useCallback(async () => {
    if (!newModuleTitle.trim()) return;

    await addModule({
      title: newModuleTitle.trim(),
      orderIndex: modules.length
    });

    setNewModuleTitle('');
    setShowAddModule(false);
  }, [newModuleTitle, modules.length, addModule]);

  const handleUpdateModule = useCallback(async (moduleId: string, data: Partial<ModuleWithLessons>) => {
    await updateModule(moduleId, data);
    setEditingModule(null);
  }, [updateModule]);

  const handleDeleteModule = useCallback(async (moduleId: string) => {
    setConfirmDialog({
      title: 'Xóa module',
      message: 'Xóa module này sẽ xóa toàn bộ bài học bên trong. Bạn có chắc chắn?',
      confirmLabel: 'Xóa',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        await deleteModule(moduleId);
      }
    });
  }, [deleteModule]);

  const handleMoveModule = useCallback(async (moduleId: string, direction: 'up' | 'down') => {
    const moduleIndex = modules.findIndex((m: ModuleWithLessons) => m.id.toString() === moduleId);
    if (moduleIndex === -1) return;

    const newIndex = direction === 'up' ? moduleIndex - 1 : moduleIndex + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;

    const newOrder = [...modules];
    [newOrder[moduleIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[moduleIndex]];
    
    await reorderModules(newOrder.map((m: ModuleWithLessons) => m.id.toString()));
  }, [modules, reorderModules]);

  // ============================================================================
  // HANDLERS - LESSONS
  // ============================================================================

  const handleAddLesson = useCallback(async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;

    const module = modules.find((m: ModuleWithLessons) => m.id.toString() === moduleId);
    const lessonCount = module?.lessons?.length || 0;

    await addLesson(parseInt(moduleId, 10), {
      title: newLessonTitle.trim(),
      type: newLessonType,
      orderIndex: lessonCount
    });

    setNewLessonTitle('');
    setNewLessonType('video');
    setShowAddLesson(null);
    
    // Ensure module is expanded to show new lesson
    setExpandedModules(prev => new Set([...prev, moduleId]));
  }, [newLessonTitle, newLessonType, modules, addLesson]);

  const handleUpdateLesson = useCallback(async (
    moduleId: string, 
    lessonId: string, 
    data: { title?: string; duration?: number }
  ) => {
    await updateLesson(moduleId, lessonId, data);
    setEditingLesson(null);
  }, [updateLesson]);

  const handleDeleteLesson = useCallback(async (moduleId: string, lessonId: string) => {
    setConfirmDialog({
      title: 'Xóa bài học',
      message: 'Bạn có chắc chắn muốn xóa bài học này? Hành động không thể hoàn tác.',
      confirmLabel: 'Xóa',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        await deleteLesson(moduleId, lessonId);
      }
    });
  }, [deleteLesson]);

  const handleGoBack = useCallback(() => {
    navigate('/mentor', { state: { activeTab: 'courses' } });
  }, [navigate]);

  const handlePreviewCourse = useCallback(() => {
    if (courseId) {
      // Open course preview in new tab or navigate to preview page
      window.open(`/course/${courseId}/preview`, '_blank');
    }
  }, [courseId]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getLessonIcon = (type: LessonType) => {
    const lessonType = LESSON_TYPES.find(t => t.value === type);
    return lessonType?.icon || <FiFileText />;
  };

  const getLessonColor = (type: LessonType) => {
    const lessonType = LESSON_TYPES.find(t => t.value === type);
    return lessonType?.color || '#64748b';
  };

  const renderModuleCard = (module: ModuleWithLessons, index: number) => {
    const isExpanded = expandedModules.has(module.id.toString());
    const isEditing = editingModule === module.id.toString();
    const lessonCount = module.lessons?.length || 0;

    return (
      <motion.div
        key={module.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`cb-module-card ${isExpanded ? 'cb-module-card--active' : ''}`}
      >
        {/* Module Header */}
        <div className="cb-module-card__order">
          <button
            className="cb-module-card__order-btn"
            onClick={() => handleMoveModule(module.id.toString(), 'up')}
            disabled={index === 0}
            title="Move up"
          >
            <FiChevronUp size={14} />
          </button>
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--cb-text-muted)',
            fontWeight: 600
          }}>
            {index + 1}
          </span>
          <button
            className="cb-module-card__order-btn"
            onClick={() => handleMoveModule(module.id.toString(), 'down')}
            disabled={index === modules.length - 1}
            title="Move down"
          >
            <FiChevronDown size={14} />
          </button>
        </div>

        <div className="cb-module-card__content" style={{ flex: 1 }}>
          {isEditing ? (
            // Edit Mode
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cb-spacing-sm)' }}>
              <input
                type="text"
                className="cb-input"
                value={module.title}
                onChange={(e) => handleUpdateModule(module.id.toString(), { ...module, title: e.target.value })}
                placeholder="Module title"
                autoFocus
              />
              <div style={{ display: 'flex', gap: 'var(--cb-spacing-sm)' }}>
                <button
                  className="cb-button cb-button--primary cb-button--sm"
                  onClick={() => setEditingModule(null)}
                >
                  <FiCheck /> Save
                </button>
                <button
                  className="cb-button cb-button--ghost cb-button--sm"
                  onClick={() => setEditingModule(null)}
                >
                  <FiX /> Cancel
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <>
              <div 
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleModuleExpand(module.id.toString())}
              >
                <div style={{ flex: 1 }}>
                  <h3 className="cb-module-card__title">{module.title}</h3>
                  {module.description && (
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--cb-text-secondary)',
                      marginTop: 'var(--cb-spacing-xs)'
                    }}>
                      {module.description}
                    </p>
                  )}
                  <div className="cb-module-card__meta">
                    <span className="cb-module-card__meta-item">
                      <FiLayers size={12} /> {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--cb-spacing-sm)',
                  marginLeft: 'var(--cb-spacing-md)'
                }}>
                  <button
                    className="cb-button cb-button--ghost cb-button--sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingModule(module.id.toString());
                    }}
                    title="Edit module"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    className="cb-button cb-button--ghost cb-button--sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteModule(module.id.toString());
                    }}
                    title="Delete module"
                    style={{ color: 'var(--cb-accent-red)' }}
                  >
                    <FiTrash2 size={14} />
                  </button>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    style={{ 
                      color: 'var(--cb-text-muted)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FiChevronDown size={18} />
                  </motion.div>
                </div>
              </div>
            </>
          )}

          {/* Lessons List */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 'var(--cb-spacing-md)' }}
              >
                {/* Lessons */}
                {module.lessons && module.lessons.length > 0 ? (
                  <div style={{ marginBottom: 'var(--cb-spacing-md)' }}>
                    {module.lessons.map((lesson: LessonSummaryDTO) => {
                      const lessonTypeLocal = mapLessonType(lesson.type);
                      return (
                      <div key={lesson.id} className="cb-lesson-item">
                        <div 
                          className={`cb-lesson-item__icon cb-lesson-item__icon--${lessonTypeLocal}`}
                          style={{ backgroundColor: `${getLessonColor(lessonTypeLocal)}20`, color: getLessonColor(lessonTypeLocal) }}>

                          {getLessonIcon(lessonTypeLocal)}
                        </div>
                        <div className="cb-lesson-item__info">
                          {editingLesson === lesson.id.toString() ? (
                            <input
                              type="text"
                              className="cb-input"
                              value={lesson.title}
                              onChange={(e) => handleUpdateLesson(module.id.toString(), lesson.id.toString(), { title: e.target.value })}
                              onBlur={() => setEditingLesson(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingLesson(null)}
                              autoFocus
                              style={{ padding: 'var(--cb-spacing-xs)' }}
                            />
                          ) : (
                            <>
                              <span className="cb-lesson-item__title">{lesson.title}</span>
                              <span className="cb-lesson-item__meta">
                                {LESSON_TYPES.find(t => t.value === lessonTypeLocal)?.label}
                                {lesson.durationSec && ` • ${Math.round(lesson.durationSec / 60)} min`}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="cb-lesson-item__actions">
                          <button
                            className="cb-button cb-button--ghost cb-button--sm"
                            onClick={() => setEditingLesson(lesson.id.toString())}
                            title="Edit lesson"
                          >
                            <FiEdit2 size={12} />
                          </button>
                          <button
                            className="cb-button cb-button--ghost cb-button--sm"
                            onClick={() => handleDeleteLesson(module.id.toString(), lesson.id.toString())}
                            title="Delete lesson"
                            style={{ color: 'var(--cb-accent-red)' }}
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="cb-empty" style={{ padding: 'var(--cb-spacing-lg)' }}>
                    <FiLayers className="cb-empty__icon" style={{ width: 32, height: 32 }} />
                    <p className="cb-empty__description" style={{ marginBottom: 'var(--cb-spacing-md)' }}>
                      No lessons yet. Add your first lesson to this module.
                    </p>
                  </div>
                )}

                {/* Add Lesson Form */}
                {showAddLesson === module.id.toString() ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="cb-card"
                    style={{ marginTop: 'var(--cb-spacing-sm)' }}
                  >
                    <div style={{ marginBottom: 'var(--cb-spacing-md)' }}>
                      <label className="cb-label">Lesson Title</label>
                      <input
                        type="text"
                        className="cb-input"
                        placeholder="e.g., Introduction to React Hooks"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div style={{ marginBottom: 'var(--cb-spacing-md)' }}>
                      <label className="cb-label">Lesson Type</label>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(5, 1fr)', 
                        gap: 'var(--cb-spacing-sm)' 
                      }}>
                        {LESSON_TYPES.map(type => (
                          <button
                            key={type.value}
                            className={`cb-card ${newLessonType === type.value ? 'cb-card--selected' : ''}`}
                            onClick={() => setNewLessonType(type.value)}
                            style={{ 
                              padding: 'var(--cb-spacing-sm)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 'var(--cb-spacing-xs)',
                              cursor: 'pointer',
                              border: newLessonType === type.value 
                                ? `2px solid ${type.color}` 
                                : '1px solid var(--cb-glass-border)'
                            }}
                          >
                            <span style={{ color: type.color }}>{type.icon}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--cb-text-secondary)' }}>
                              {type.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="cb-button-group">
                      <button
                        className="cb-button cb-button--primary cb-button--sm"
                        onClick={() => handleAddLesson(module.id)}
                        disabled={!newLessonTitle.trim()}
                      >
                        <FiPlus /> Add Lesson
                      </button>
                      <button
                        className="cb-button cb-button--ghost cb-button--sm"
                        onClick={() => {
                          setShowAddLesson(null);
                          setNewLessonTitle('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    className="cb-button cb-button--secondary cb-button--sm"
                    onClick={() => setShowAddLesson(module.id.toString())}
                    style={{ width: '100%' }}
                  >
                    <FiPlus /> Add Lesson
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  const renderAddModuleForm = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="cb-panel"
    >
      <h3 style={{ 
        marginBottom: 'var(--cb-spacing-md)', 
        color: 'var(--cb-text-primary)',
        fontSize: '1rem',
        fontWeight: 600
      }}>
        Add New Module
      </h3>
      <div className="cb-form-group">
        <label className="cb-label cb-label--required">Module Title</label>
        <input
          type="text"
          className="cb-input"
          placeholder="e.g., Getting Started with React"
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          autoFocus
        />
      </div>
      <div className="cb-form-group">
        <div className="cb-button-group">
          <button
            className="cb-button cb-button--primary"
            onClick={handleAddModule}
            disabled={!newModuleTitle.trim()}
          >
            <FiPlus /> Add Module
          </button>
          <button
            className="cb-button cb-button--ghost"
            onClick={() => {
              setShowAddModule(false);
              setNewModuleTitle('');
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderEmptyState = () => (
    <div className="cb-empty" style={{ padding: 'var(--cb-spacing-2xl)' }}>
      <FiBookOpen className="cb-empty__icon" />
      <h3 className="cb-empty__title">No Modules Yet</h3>
      <p className="cb-empty__description">
        Start building your course by adding modules. 
        Each module can contain multiple lessons including videos, readings, and quizzes.
      </p>
      <button
        className="cb-button cb-button--primary"
        onClick={() => setShowAddModule(true)}
      >
        <FiPlus /> Add First Module
      </button>
    </div>
  );

  const renderContentTab = () => (
    <div className="cb-grid cb-grid--sidebar">
      {/* Sidebar - Course Info */}
      <div>
        <div className="cb-panel" style={{ position: 'sticky', top: 'var(--cb-spacing-lg)' }}>
          <h3 style={{ 
            fontSize: '0.875rem', 
            color: 'var(--cb-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--cb-spacing-md)'
          }}>
            Course Summary
          </h3>
          
          {currentCourse?.thumbnailUrl && (
            <div style={{ 
              marginBottom: 'var(--cb-spacing-md)',
              borderRadius: 'var(--cb-radius-md)',
              overflow: 'hidden'
            }}>
              <img 
                src={currentCourse.thumbnailUrl} 
                alt="Course thumbnail"
                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
              />
            </div>
          )}
          
          <h4 style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            color: 'var(--cb-text-primary)',
            marginBottom: 'var(--cb-spacing-sm)'
          }}>
            {currentCourse?.title || 'Untitled Course'}
          </h4>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 'var(--cb-spacing-sm)',
            fontSize: '0.875rem',
            color: 'var(--cb-text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cb-spacing-sm)' }}>
              <FiLayers size={14} />
              <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cb-spacing-sm)' }}>
              <FiBookOpen size={14} />
              <span>
                {modules.reduce((sum: number, m: ModuleWithLessons) => sum + (m.lessons?.length || 0), 0)} lessons
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cb-spacing-sm)' }}>
              <FiClock size={14} />
              <span>{currentCourse?.estimatedDuration || 0}h estimated</span>
            </div>
          </div>
          
          <div style={{ 
            borderTop: '1px solid var(--cb-border-color)',
            marginTop: 'var(--cb-spacing-md)',
            paddingTop: 'var(--cb-spacing-md)'
          }}>
            <button
              className="cb-button cb-button--secondary"
              onClick={() => navigate(`/mentor/courses/${courseId}/edit`)}
              style={{ width: '100%', marginBottom: 'var(--cb-spacing-sm)' }}
            >
              <FiEdit2 /> Edit Full Course
            </button>
            <button
              className="cb-button cb-button--ghost"
              onClick={handlePreviewCourse}
              style={{ width: '100%' }}
            >
              <FiEye /> Preview Course
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Modules List */}
      <div>
        {/* Add Module Form */}
        <AnimatePresence>
          {showAddModule && renderAddModuleForm()}
        </AnimatePresence>

        {/* Modules List */}
        {modules.length > 0 ? (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--cb-spacing-md)'
            }}>
              <h3 style={{ 
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--cb-text-primary)'
              }}>
                Course Modules ({modules.length})
              </h3>
              {!showAddModule && (
                <button
                  className="cb-button cb-button--primary cb-button--sm"
                  onClick={() => setShowAddModule(true)}
                >
                  <FiPlus /> Add Module
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {modules.map((module: ModuleWithLessons, index: number) => renderModuleCard(module, index))}
            </AnimatePresence>
          </>
        ) : (
          !showAddModule && renderEmptyState()
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="cb-panel">
      <div className="cb-panel__header">
        <div>
          <h2 className="cb-panel__title">
            <FiSettings /> Course Settings
          </h2>
          <p className="cb-panel__subtitle">
            Configure advanced settings for your course
          </p>
        </div>
      </div>

      <div className="cb-alert cb-alert--info">
        <FiAlertCircle />
        <div className="cb-alert__content">
          <div className="cb-alert__message">
            Course settings will be available in a future update.
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (isLoading && !currentCourse) {
    return (
      <div className="cb-page">
        <div className="cb-container">
          <div className="cb-loading">
            <div className="cb-skeleton" style={{ width: 200, height: 24 }} />
            <div className="cb-skeleton" style={{ width: '100%', height: 400 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cb-page">
      <div className="cb-container">
        {/* Header */}
        <header className="cb-header">
          <div className="cb-header__left">
            <button className="cb-back-button" onClick={handleGoBack}>
              <FiArrowLeft />
              Back to Dashboard
            </button>
            <h1 className="cb-title">Course Content</h1>
          </div>
          <div className="cb-header__right">
            <div className="cb-footer__status">
              <FiCheck size={12} />
              Auto-saved
            </div>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <div className="cb-alert cb-alert--error" style={{ marginBottom: 'var(--cb-spacing-lg)' }}>
            <FiAlertCircle />
            <div className="cb-alert__content">
              <div className="cb-alert__message">{error}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="cb-tabs">
          <button
            className={`cb-tab ${activeTab === 'content' ? 'cb-tab--active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <FiLayers className="cb-tab__icon" />
            Content
            <span className="cb-tab__count">{modules.length}</span>
          </button>
          <button
            className={`cb-tab ${activeTab === 'settings' ? 'cb-tab--active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings className="cb-tab__icon" />
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'content' ? renderContentTab() : renderSettingsTab()}

        {confirmDialog && (
          <ConfirmDialog
            isOpen={true}
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmLabel={confirmDialog.confirmLabel}
            variant={confirmDialog.variant}
            onCancel={() => setConfirmDialog(null)}
            onConfirm={confirmDialog.onConfirm}
          />
        )}
      </div>
    </div>
  );
};

export default CourseContentPage;
