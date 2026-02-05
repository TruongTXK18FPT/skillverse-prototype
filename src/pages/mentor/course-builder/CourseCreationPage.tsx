import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiBookOpen, FiList, FiFileText, FiPlay, FiHelpCircle, FiClipboard, 
  FiPlus, FiTrash2, FiSettings, FiChevronDown, FiChevronUp, FiInfo,
  FiArrowLeft, FiSave, FiCheck, FiImage, FiX, FiAlertTriangle
} from 'react-icons/fi';
import { useCourseManagement } from '../../../context/mentor/CourseManagementContext';
import { useAuth } from '../../../context/AuthContext';
import { CourseLevel, LessonType, CourseStatus } from '../../../data/courseDTOs';
import { SubmissionType } from '../../../data/assignmentDTOs';
import { QuestionType } from '../../../data/quizDTOs';
import { uploadMedia } from '../../../services/mediaService';
import { useMentorNotice } from '../../../context/mentor/MentorNoticeContext';
import RichTextEditor from '../../../components/shared/RichTextEditor';
import { 
  AssignmentCriteriaDraft,
  LessonAttachmentDraft,
  LessonDraft,
  LessonKind,
  ModuleDraft,
  QuizOptionDraft,
  QuizQuestionDraft
} from './courseBuilderTypes';
import { 
  AssignmentCriteriaItemErrors,
  AssignmentFieldErrors,
  validateAssignmentScore,
  validateAssignmentsBeforeSave,
  validateQuizzesBeforeSave
} from './courseBuilderValidation';
import '../../../styles/course-builder.css';

// ============================================================================
// TYPES
// ============================================================================

type ViewState = 
  | { type: 'course_info' }
  | { type: 'module'; moduleId: string }
  | { type: 'lesson'; moduleId: string; lessonId: string };

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES = ['Development', 'Business', 'Design', 'Marketing', 'IT & Software', 'Personal Development'];

const LEVELS = [
  { value: CourseLevel.BEGINNER, label: 'Cơ bản' },
  { value: CourseLevel.INTERMEDIATE, label: 'Trung bình' },
  { value: CourseLevel.ADVANCED, label: 'Nâng cao' }
];

const LESSON_TYPES = [
  { value: 'reading', label: 'Bài đọc', icon: <FiFileText /> },
  { value: 'video', label: 'Video', icon: <FiPlay /> },
  { value: 'quiz', label: 'Quiz', icon: <FiHelpCircle /> },
  { value: 'assignment', label: 'Bài tập', icon: <FiClipboard /> }
];

const createId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

// ============================================================================
// COMPONENT
// ============================================================================

const CourseCreationPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditMode = Boolean(courseId);
  const { user } = useAuth();

  const {
    state,
    updateCourseForm,
    loadCourseForEdit,
    createCourse,
    updateCourse,
    resetState
  } = useCourseManagement();

  const { courseForm, isLoading } = state;
  
  const isEditable = !isEditMode || 
                     !state.currentCourse || 
                     state.currentCourse.status === CourseStatus.DRAFT || 
                     state.currentCourse.status === 'REJECTED' as CourseStatus; // Cast if string

  // Local State
  const [activeView, setActiveView] = useState<ViewState>({ type: 'course_info' });
  const [modules, setModules] = useState<ModuleDraft[]>([]);
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [assignmentErrors, setAssignmentErrors] = useState<Record<string, AssignmentFieldErrors>>({});
  
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  // Quiz Editor State (for tab switching)
  const [lessonEditor, setLessonEditor] = useState<{ activeTab: 'settings' | 'questions' }>({ activeTab: 'settings' });
  const { showNotice } = useMentorNotice();

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    showNotice(type, message);
  };
  const getApiErrorMessage = (err: unknown): string => {
    const responseData = (err as { response?: { data?: unknown } })?.response?.data;
    if (responseData) {
      if (typeof responseData === 'string') return responseData;
      if (typeof responseData === 'object') {
        const responseObj = responseData as { message?: string; error?: string };
        return responseObj.message || responseObj.error || JSON.stringify(responseData);
      }
      return String(responseData);
    }
    if (err instanceof Error) return err.message;
    return String(err);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const saveInFlightRef = useRef(false);
  
  const clearAssignmentError = (
     lessonId: string,
     field: keyof AssignmentFieldErrors,
     criteriaIndex?: number,
     criteriaField?: keyof AssignmentCriteriaItemErrors
  ) => {
     setAssignmentErrors(prev => {
        const current = prev[lessonId];
        if (!current) return prev;
        const next: AssignmentFieldErrors = { ...current };

        if (field === 'criteriaItems' && criteriaIndex !== undefined && criteriaField) {
           const items = { ...(next.criteriaItems || {}) };
           const item = { ...(items[criteriaIndex] || {}) };
           delete item[criteriaField];
           if (Object.keys(item).length > 0) {
              items[criteriaIndex] = item;
           } else {
              delete items[criteriaIndex];
           }
           if (Object.keys(items).length > 0) {
              next.criteriaItems = items;
           } else {
              delete next.criteriaItems;
           }
           delete next.criteriaTotal;
        } else if (field === 'criteriaItems') {
           delete next.criteriaItems;
           delete next.criteriaTotal;
        } else {
           delete next[field];
           if (field === 'maxScore') {
              delete next.criteriaTotal;
           }
        }

        if (Object.keys(next).length === 0) {
           const copy = { ...prev };
           delete copy[lessonId];
           return copy;
        }
        return { ...prev, [lessonId]: next };
     });
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isEditMode && courseId) {
      loadCourseForEdit(courseId);
    } else {
      resetState();
    }
  }, [isEditMode, courseId, loadCourseForEdit, resetState]);

  // Sync from context to local state
  useEffect(() => {
    if (!isEditMode || isLoading || !state.currentCourse) return;
    
    if (state.courseForm.learningObjectives?.length) {
      setLearningObjectives(state.courseForm.learningObjectives);
    }
    if (state.courseForm.requirements?.length) {
      setRequirements(state.courseForm.requirements);
    }
    
    // Map context modules to local draft modules if needed
    // This part assumes we might need to transform data structure
    if (state.modules.length > 0 && modules.length === 0) {
        const mappedModules: ModuleDraft[] = state.modules.map(m => ({
            id: createId(), // Or keep server ID as string
            serverId: m.id,
            title: m.title,
            description: m.description,
            lessons: m.lessons.map(rawLesson => {
                const lesson = rawLesson as Partial<LessonDraft> & { id: number; type?: LessonType | string; durationSec?: number; videoUrl?: string };
                return {
                  id: createId(),
                  serverId: lesson.id,
                  title: lesson.title || '',
                  type: (lesson.type?.toString().toLowerCase() || 'reading') as LessonKind,
                  durationMin: lesson.durationSec ? Math.round(lesson.durationSec / 60) : undefined,
                  contentText: lesson.contentText,
                  resourceUrl: lesson.resourceUrl,
                  youtubeUrl: lesson.youtubeUrl || lesson.videoUrl,
                  videoMediaId: lesson.videoMediaId,
                  passScore: lesson.passScore,
                  quizTimeLimitMinutes: lesson.quizTimeLimitMinutes,
                  quizMaxAttempts: lesson.quizMaxAttempts,
                  quizDescription: lesson.quizDescription,
                  gradingMethod: lesson.gradingMethod,
                  isAssessment: lesson.isAssessment,
                  questions: (lesson.questions || []).map((q: QuizQuestionDraft) => ({
                     ...q,
                     score: Number.isFinite(Number(q.score)) && Number(q.score) > 0 ? Number(q.score) : 1
                  })),
                  assignmentSubmissionType: (lesson.assignmentSubmissionType || (lesson as { submissionType?: SubmissionType }).submissionType || SubmissionType.TEXT) as SubmissionType,
                  assignmentDescription: lesson.assignmentDescription,
                  assignmentMaxScore: lesson.assignmentMaxScore,
                  assignmentPassingScore: lesson.assignmentPassingScore,
                  assignmentCriteria: lesson.assignmentCriteria,
                  attachments: lesson.attachments
                };
            })
        }));
        setModules(mappedModules);
    }
  }, [isEditMode, isLoading, state.currentCourse, state.modules]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleGoBack = () => navigate('/mentor', { state: { activeTab: 'courses' } });

  const handleThumbnailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'File quá lớn (Tối đa 5MB)');
        return;
      }
      setThumbnailFile(file);
      // Preview immediately
      updateCourseForm({ thumbnailUrl: URL.createObjectURL(file) });
    }
  }, [showToast, updateCourseForm]);

  const updateLessonField = (moduleId: string, lessonId: string, data: Partial<LessonDraft>) => {
    setModules(prev => prev.map(m => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        lessons: m.lessons.map(l => {
          if (l.id !== lessonId) return l;
          
          // Data integrity check: If type changes significantly (e.g. Reading -> Quiz), 
          // we must clear the serverId to force creation of a new entity, preventing backend type mismatch errors.
          let newServerId = l.serverId;
          if (data.type && data.type !== l.type) {
             const isOldLesson = l.type === 'reading' || l.type === 'video';
             const isNewLesson = data.type === 'reading' || data.type === 'video';
             
             // If switching between incompatible types (Lesson <-> Quiz <-> Assignment)
             if (isOldLesson !== isNewLesson || l.type === 'quiz' || data.type === 'quiz' || l.type === 'assignment' || data.type === 'assignment') {
                 if (l.type !== data.type) {
                     newServerId = undefined; // Treat as new entity
                 }
             }
          }

          return { ...l, ...data, serverId: newServerId };
        })
      };
    }));
  };

  const handleRemoveLesson = (moduleId: string, lessonId: string) => {
    setConfirmDialog({
      title: 'Xóa bài học',
      message: 'Bạn có chắc chắn muốn xóa bài học này?',
      confirmLabel: 'Xóa',
      onConfirm: () => {
        setModules(prev => prev.map(m => {
          if (m.id !== moduleId) return m;
          return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
        }));
        setActiveView({ type: 'module', moduleId });
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeView.type !== 'lesson' || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const { moduleId, lessonId } = activeView;

    try {
       // Upload file via mediaService
       const uploadedMedia = await uploadMedia(file, user?.id || 0);
       
       // Update lesson attachments
       setModules(prev => prev.map(m => {
          if (m.id !== moduleId) return m;
          return {
             ...m,
             lessons: m.lessons.map(l => {
                if (l.id !== lessonId) return l;
                const newAttachment: LessonAttachmentDraft = {
                   name: uploadedMedia.fileName || file.name,
                   mediaId: uploadedMedia.id,
                   url: uploadedMedia.url
                };
                const newAttachments: LessonAttachmentDraft[] = [...(l.attachments || []), newAttachment];
                return { ...l, attachments: newAttachments };
             })
          };
       }));
       
       showToast('success', 'Upload file thành công!');
    } catch (err) {
       console.error(err);
       showToast('error', 'Lỗi khi upload file: ' + err);
    } finally {
       // Reset input
       if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeView.type !== 'lesson' || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    // Check file type
    if (!file.type.startsWith('video/')) {
       showToast('error', 'Vui lòng chọn file video hợp lệ (mp4, webm, etc.)');
       return;
    }

    const { moduleId, lessonId } = activeView;

    try {
       showToast('success', 'Đang upload video, vui lòng chờ...');
       // Upload file via mediaService
       const uploadedMedia = await uploadMedia(file, user?.id || 0);
       
       // Update lesson videoMediaId
       updateLessonField(moduleId, lessonId, { videoMediaId: uploadedMedia.id });
       
       showToast('success', 'Upload video thành công!');
    } catch (err) {
       console.error(err);
       showToast('error', 'Lỗi khi upload video: ' + err);
    } finally {
       // Reset input
       if (e.target) e.target.value = '';
    }
  };

  const createDefaultQuestion = (type: QuestionType = QuestionType.MULTIPLE_CHOICE): QuizQuestionDraft => {
    const base: QuizQuestionDraft = {
      id: createId(),
      text: '',
      score: 1,
      type,
      options: []
    };

    if (type === QuestionType.TRUE_FALSE) {
      base.options = [
        { id: createId(), text: 'True', correct: true },
        { id: createId(), text: 'False', correct: false }
      ];
    } else if (type === QuestionType.MULTIPLE_CHOICE) {
      base.options = [
        { id: createId(), text: '', correct: false },
        { id: createId(), text: '', correct: false },
        { id: createId(), text: '', correct: false },
        { id: createId(), text: '', correct: false }
      ];
    } else if (type === QuestionType.SHORT_ANSWER) {
      base.options = [
        { id: createId(), text: '', correct: true }
      ];
    }

    return base;
  };

  // ============================================================================
  // RENDERERS
  // ============================================================================

  const renderSidebar = () => (
    <div className="cb-sidebar">
      <div className="cb-sidebar__header">
        <span>NỘI DUNG KHÓA HỌC</span>
      </div>
      
      <div className="cb-sidebar__section">
        <div 
          className={`cb-sidebar__item ${activeView.type === 'course_info' ? 'is-active' : ''}`}
          onClick={() => setActiveView({ type: 'course_info' })}
        >
          <div className="cb-sidebar__item-label">
            <FiBookOpen /> Thông tin chung
          </div>
        </div>
      </div>

      <div className="cb-sidebar__section">
        <div className="cb-sidebar__header" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          MODULES
        </div>
        
        {modules.map((module, index) => (
          <div key={module.id} className="cb-sidebar__module-group">
            <div 
              className={`cb-sidebar__item ${activeView.type === 'module' && activeView.moduleId === module.id ? 'is-active' : ''}`}
              onClick={() => setActiveView({ type: 'module', moduleId: module.id })}
            >
              <div className="cb-sidebar__item-label">
                <FiList /> 
                <span style={{ fontWeight: 500 }}>{index + 1}. {module.title || '(Chưa có tiêu đề)'}</span>
              </div>
              <button 
                className="cb-icon-button" 
                style={{ width: 24, height: 24, fontSize: 12 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsedModules(prev => ({ ...prev, [module.id]: !prev[module.id] }));
                }}
              >
                {collapsedModules[module.id] ? <FiChevronDown /> : <FiChevronUp />}
              </button>
            </div>

            {!collapsedModules[module.id] && (
              <div className="cb-sidebar__sub-list">
                {module.lessons.map((lesson, lIndex) => {
                  let Icon = FiFileText;
                  if (lesson.type === 'video') Icon = FiPlay;
                  if (lesson.type === 'quiz') Icon = FiHelpCircle;
                  if (lesson.type === 'assignment') Icon = FiClipboard;

                  return (
                    <div 
                      key={lesson.id}
                      className={`cb-sidebar__item cb-sidebar__sub-item ${
                        activeView.type === 'lesson' && activeView.lessonId === lesson.id ? 'is-active' : ''
                      }`}
                      onClick={() => setActiveView({ type: 'lesson', moduleId: module.id, lessonId: lesson.id })}
                    >
                      <div className="cb-sidebar__item-label">
                        <Icon size={14} />
                        <span>{lIndex + 1}. {lesson.title || '(Chưa có tiêu đề)'}</span>
                      </div>
                    </div>
                  );
                })}
                
                <button 
                  className="cb-sidebar__add-btn"
                  disabled={!isEditable}
                  onClick={(e) => {
                     if (!isEditable) return;
                     e.stopPropagation();
                     const newLessonId = createId();
                    const newLesson: LessonDraft = {
                       id: newLessonId,
                       title: 'Bài học mới',
                       type: 'reading',
                       contentText: '',
                       questions: [],
                       assignmentSubmissionType: SubmissionType.TEXT
                     };
                     setModules(prev => prev.map(m => m.id === module.id ? { ...m, lessons: [...m.lessons, newLesson] } : m));
                     setActiveView({ type: 'lesson', moduleId: module.id, lessonId: newLessonId });
                  }}
                >
                  <FiPlus /> Thêm bài học
                </button>
              </div>
            )}
          </div>
        ))}

        <button 
          className="cb-button cb-button--ghost" 
          disabled={!isEditable}
          style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', color: 'var(--cb-accent-cyan)', opacity: !isEditable ? 0.5 : 1, cursor: !isEditable ? 'not-allowed' : 'pointer' }}
          onClick={() => {
            if (!isEditable) return;
            const newModuleId = createId();
            const newModule: ModuleDraft = {
              id: newModuleId,
              title: 'Module mới',
              lessons: []
            };
            setModules(prev => [...prev, newModule]);
            setActiveView({ type: 'module', moduleId: newModuleId });
          }}
        >
          <FiPlus /> Thêm Module
        </button>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (activeView.type === 'course_info') {
      return (
        <div className="cb-main-content">
          <div className="cb-panel">
            <div className="cb-panel__header">
              <div className="cb-panel__title"><FiInfo /> Thông tin cơ bản</div>
            </div>
            <div className="cb-panel__body">
              <div className="cb-grid cb-grid--2">
                <div>
                  <div className="cb-form-group">
                    <label className="cb-label cb-label--required">Tên khóa học</label>
                    <input
                      type="text" className="cb-input"
                      value={courseForm.title || ''}
                      onChange={(e) => updateCourseForm({ title: e.target.value })}
                    />
                  </div>
                  <div className="cb-form-group">
                    <label className="cb-label">Mô tả ngắn</label>
                    <textarea
                      className="cb-input cb-textarea"
                      value={courseForm.summary || ''}
                      onChange={(e) => updateCourseForm({ summary: e.target.value })}
                      placeholder="Mô tả ngắn gọn về khóa học (hiển thị trên thẻ khóa học)"
                    />
                  </div>
                  <div className="cb-form-group">
                    <label className="cb-label">Mô tả chi tiết</label>
                    <textarea
                      className="cb-input cb-textarea"
                      style={{ height: 150 }}
                      value={courseForm.description || ''}
                      onChange={(e) => updateCourseForm({ description: e.target.value })}
                    />
                  </div>
                  
                  <div className="cb-grid cb-grid--2">
                     <div className="cb-form-group">
                        <label className="cb-label">Danh mục</label>
                        <select 
                           className="cb-input cb-select"
                           value={courseForm.category || ''}
                           onChange={(e) => updateCourseForm({ category: e.target.value })}
                        >
                           <option value="">Chọn danh mục</option>
                           {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="cb-form-group">
                        <label className="cb-label">Độ khó</label>
                        <select 
                           className="cb-input cb-select"
                           value={courseForm.level || CourseLevel.BEGINNER}
                           onChange={(e) => updateCourseForm({ level: e.target.value as CourseLevel })}
                        >
                           {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="cb-grid cb-grid--2">
                     <div className="cb-form-group">
                        <label className="cb-label">Giá (VND)</label>
                        <input 
                           type="number" className="cb-input"
                           value={courseForm.price ?? 0}
                           onChange={(e) => updateCourseForm({ price: parseInt(e.target.value) || 0 })}
                        />
                     </div>
                     <div className="cb-form-group">
                        <label className="cb-label">Thời lượng (giờ)</label>
                        <input 
                           type="number" className="cb-input"
                           value={courseForm.estimatedDuration ?? 0}
                           onChange={(e) => updateCourseForm({ estimatedDuration: parseFloat(e.target.value) || 0 })}
                        />
                     </div>
                  </div>
                </div>
                <div>
                   <div className="cb-form-group">
                      <label className="cb-label">Ảnh bìa</label>
                      <div 
                         className="cb-course-upload"
                         onClick={() => document.getElementById('thumbnail-upload')?.click()}
                      >
                         <input id="thumbnail-upload" type="file" hidden onChange={handleThumbnailChange} accept="image/*" />
                         {courseForm.thumbnailUrl ? (
                            <img src={courseForm.thumbnailUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         ) : (
                            <div style={{ textAlign: 'center' }}>
                               <FiImage size={32} />
                               <p>Tải ảnh lên</p>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Learning Objectives */}
                   <div className="cb-form-group">
                      <label className="cb-label">Mục tiêu khóa học</label>
                      {learningObjectives.map((obj, idx) => (
                         <div key={idx} className="cb-input-group" style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                            <input 
                               className="cb-input"
                               value={obj}
                               placeholder={`Mục tiêu ${idx + 1}`}
                               onChange={(e) => {
                                  const newObjs = [...learningObjectives];
                                  newObjs[idx] = e.target.value;
                                  setLearningObjectives(newObjs);
                                  updateCourseForm({ learningObjectives: newObjs });
                               }}
                            />
                            {learningObjectives.length > 1 && (
                               <button 
                                  className="cb-icon-button"
                                  onClick={() => {
                                     const newObjs = learningObjectives.filter((_, i) => i !== idx);
                                     setLearningObjectives(newObjs);
                                     updateCourseForm({ learningObjectives: newObjs });
                                  }}
                               >
                                  <FiX />
                               </button>
                            )}
                         </div>
                      ))}
                      <button 
                         className="cb-button cb-button--ghost cb-button--sm"
                         onClick={() => setLearningObjectives([...learningObjectives, ''])}
                      >
                         <FiPlus /> Thêm mục tiêu
                      </button>
                   </div>

                   {/* Requirements */}
                   <div className="cb-form-group">
                      <label className="cb-label">Yêu cầu đầu vào</label>
                      {requirements.map((req, idx) => (
                         <div key={idx} className="cb-input-group" style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                            <input 
                               className="cb-input"
                               value={req}
                               placeholder={`Yêu cầu ${idx + 1}`}
                               onChange={(e) => {
                                  const newReqs = [...requirements];
                                  newReqs[idx] = e.target.value;
                                  setRequirements(newReqs);
                                  updateCourseForm({ requirements: newReqs });
                               }}
                            />
                            {requirements.length > 1 && (
                               <button 
                                  className="cb-icon-button"
                                  onClick={() => {
                                     const newReqs = requirements.filter((_, i) => i !== idx);
                                     setRequirements(newReqs);
                                     updateCourseForm({ requirements: newReqs });
                                  }}
                               >
                                  <FiX />
                               </button>
                            )}
                         </div>
                      ))}
                      <button 
                         className="cb-button cb-button--ghost cb-button--sm"
                         onClick={() => setRequirements([...requirements, ''])}
                      >
                         <FiPlus /> Thêm yêu cầu
                      </button>
                   </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeView.type === 'module') {
      const module = modules.find(m => m.id === activeView.moduleId);
      if (!module) return <div className="cb-empty-state">Module không tồn tại</div>;
      return (
         <div className="cb-main-content">
            <div className="cb-panel">
               <div className="cb-panel__header">
                  <div className="cb-panel__title">Chỉnh sửa Module</div>
                  <button 
                     className="cb-button cb-button--danger cb-button--sm"
                     onClick={() => {
                        setConfirmDialog({
                           title: 'Xóa Module',
                           message: 'Bạn có chắc chắn muốn xóa module này?',
                           onConfirm: () => {
                              setModules(prev => prev.filter(m => m.id !== module.id));
                              setActiveView({ type: 'course_info' });
                           }
                        });
                     }}
                  >
                     <FiTrash2 /> Xóa
                  </button>
               </div>
               <div className="cb-panel__body">
                  <div className="cb-form-group">
                     <label className="cb-label">Tên Module</label>
                     <input 
                        className="cb-input"
                        value={module.title}
                        onChange={(e) => setModules(prev => prev.map(m => m.id === module.id ? { ...m, title: e.target.value } : m))}
                     />
                  </div>
                  <div className="cb-form-group">
                     <label className="cb-label">Mô tả</label>
                     <textarea 
                        className="cb-input cb-textarea"
                        value={module.description || ''}
                        onChange={(e) => setModules(prev => prev.map(m => m.id === module.id ? { ...m, description: e.target.value } : m))}
                     />
                  </div>
               </div>
            </div>
         </div>
      );
    }

    if (activeView.type === 'lesson') {
      const module = modules.find(m => m.id === activeView.moduleId);
      const lesson = module?.lessons.find(l => l.id === activeView.lessonId);
      if (!module || !lesson) return <div className="cb-empty-state">Bài học không tồn tại</div>;
      const lessonErrors = assignmentErrors[lesson.id];

      return (
        <div className="cb-main-content">
           <div className="cb-panel">
              <div className="cb-panel__header">
                 <div className="cb-panel__title">
                    {lesson.type === 'quiz' && <FiHelpCircle />}
                    {lesson.type === 'video' && <FiPlay />}
                    {lesson.type === 'reading' && <FiFileText />}
                    <span style={{ marginLeft: 8 }}>{lesson.title}</span>
                 </div>
                 <button 
                    className="cb-button cb-button--danger cb-button--sm"
                    onClick={() => handleRemoveLesson(module.id, lesson.id)}
                 >
                    <FiTrash2 /> Xóa
                 </button>
              </div>
              <div className="cb-panel__body">
                 <div className="cb-form-group">
                    <label className="cb-label">Loại bài học</label>
                    <div className="cb-chips">
                       {LESSON_TYPES.map(type => (
                          <button
                             key={type.value}
                             className={`cb-chip ${lesson.type === type.value ? 'is-active' : ''}`}
                             onClick={() => {
                                const next: Partial<LessonDraft> = { type: type.value as LessonKind };
                                if (type.value === 'assignment' && !lesson.assignmentSubmissionType) {
                                   next.assignmentSubmissionType = SubmissionType.TEXT;
                                }
                                updateLessonField(module.id, lesson.id, next);
                             }}
                          >
                             {type.icon} {type.label}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="cb-form-group">
                    <label className="cb-label">Tiêu đề</label>
                    <input 
                       className="cb-input"
                       value={lesson.title}
                       onChange={(e) => updateLessonField(module.id, lesson.id, { title: e.target.value })}
                    />
                 </div>

                 {lesson.type === 'reading' && (
                    <>
                       <div className="cb-form-group">
                          <label className="cb-label">Nội dung</label>
                          <RichTextEditor 
                             key={lesson.id}
                             initialContent={lesson.contentText || ''}
                             onChange={(val) => updateLessonField(module.id, lesson.id, { contentText: val })}
                             placeholder="Nhập nội dung bài học..."
                          />
                       </div>
                       <div className="cb-form-group">
                          <label className="cb-label">Tài liệu tham khảo (Link/File URL)</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                             <button 
                                className="cb-button cb-button--secondary" 
                                onClick={() => {
                                   const url = prompt("Nhập URL file hoặc tài liệu:");
                                   if (url) {
                                      updateLessonField(module.id, lesson.id, { resourceUrl: url });
                                   }
                                }}
                             >
                                <FiImage /> Nhập Link
                             </button>
                             <button 
                                className="cb-button cb-button--secondary" 
                                onClick={() => fileInputRef.current?.click()}
                             >
                                <FiImage /> Upload File
                             </button>
                          </div>
                          
                          {/* Attachments List */}
                             {lesson.attachments && lesson.attachments.length > 0 && (
                             <div className="cb-attachments-list" style={{ marginTop: 12 }}>
                                {lesson.attachments.map((att: LessonAttachmentDraft, idx: number) => (
                                   <div key={idx} className="cb-attachment-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', border: '1px solid var(--cb-border-color)', borderRadius: 4, marginBottom: 8 }}>
                                      <FiFileText />
                                      <a href={att.url || '#'} target="_blank" rel="noopener noreferrer" style={{ flex: 1, color: 'var(--cb-accent-cyan)' }}>
                                         {att.name}
                                      </a>
                                      <button 
                                         className="cb-icon-button"
                                         onClick={() => {
                                            const newAtts = lesson.attachments?.filter((_, i) => i !== idx);
                                            updateLessonField(module.id, lesson.id, { attachments: newAtts });
                                         }}
                                      >
                                         <FiX />
                                      </button>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    </>
                 )}

                 {lesson.type === 'video' && (
                    <div className="cb-form-group">
                       <label className="cb-label">Nguồn Video</label>
                       <div className="cb-tabs" style={{ marginBottom: 16 }}>
                          <button 
                             className={`cb-tab ${!lesson.videoMediaId && lesson.videoMediaId !== 0 ? 'cb-tab--active' : ''}`}
                             onClick={() => updateLessonField(module.id, lesson.id, { videoMediaId: undefined })}
                          >
                             YouTube URL
                          </button>
                          <button 
                             className={`cb-tab ${lesson.videoMediaId || lesson.videoMediaId === 0 ? 'cb-tab--active' : ''}`}
                             onClick={() => {
                                if (lesson.videoMediaId === undefined) {
                                   updateLessonField(module.id, lesson.id, { videoMediaId: 0 });
                                }
                             }}
                          >
                             Upload Video
                          </button>
                       </div>

                       {(!lesson.videoMediaId && lesson.videoMediaId !== 0) ? (
                          <input 
                             className="cb-input"
                             value={lesson.youtubeUrl || ''}
                             onChange={(e) => updateLessonField(module.id, lesson.id, { youtubeUrl: e.target.value })}
                             placeholder="https://youtube.com/..."
                          />
                       ) : (
                          <div className="cb-course-upload" style={{ padding: 24 }}>
                             {lesson.videoMediaId ? (
                                <div style={{ textAlign: 'center' }}>
                                   <FiPlay size={32} />
                                   <p style={{ marginTop: 8, fontWeight: 500 }}>Video đã được tải lên</p>
                                   <p style={{ fontSize: '0.8rem', color: '#888' }}>ID: {lesson.videoMediaId}</p>
                                   <button className="cb-button cb-button--secondary cb-button--sm" style={{ marginTop: 16 }} onClick={() => videoInputRef.current?.click()}>
                                      Thay đổi Video
                                   </button>
                                </div>
                             ) : (
                                <div style={{ textAlign: 'center' }}>
                                   <FiPlay size={32} />
                                   <p>Kéo thả video vào đây hoặc click để upload</p>
                                   <button className="cb-button cb-button--secondary cb-button--sm" style={{ marginTop: 8 }} onClick={() => videoInputRef.current?.click()}>
                                      Chọn Video
                                   </button>
                                </div>
                             )}
                          </div>
                       )}
                    </div>
                 )}

                 {lesson.type === 'assignment' && (
                    <div className="cb-form-group">
                       <label className="cb-label">Hình thức nộp bài</label>
                       <select
                          className="cb-input cb-select"
                          value={lesson.assignmentSubmissionType || SubmissionType.TEXT}
                          onChange={(e) =>
                             {
                               updateLessonField(module.id, lesson.id, {
                                  assignmentSubmissionType: e.target.value as SubmissionType
                               });
                               clearAssignmentError(lesson.id, 'submissionType');
                             }
                          }
                       >
                          <option value={SubmissionType.TEXT}>Nộp văn bản</option>
                          <option value={SubmissionType.FILE}>Tải file</option>
                          <option value={SubmissionType.LINK}>Gửi link</option>
                       </select>
                       {lessonErrors?.submissionType && (
                         <div className="cb-error-text">{lessonErrors.submissionType}</div>
                       )}

                       <label className="cb-label">Mô tả bài tập</label>
                       <RichTextEditor 
                          key={`assign-${lesson.id}`}
                          initialContent={lesson.assignmentDescription || ''}
                          onChange={(val) => updateLessonField(module.id, lesson.id, { assignmentDescription: val })}
                          placeholder="Mô tả yêu cầu bài tập, hướng dẫn nộp bài..."
                       />
                       
                       <div className="cb-grid cb-grid--2" style={{ marginTop: 16 }}>
                          <div className="cb-form-group">
                             <label className="cb-label">Điểm tối đa</label>
                             <input 
                                type="number" className="cb-input"
                                value={lesson.assignmentMaxScore ?? 100}
                                onChange={(e) => {
                                   updateLessonField(module.id, lesson.id, { assignmentMaxScore: parseInt(e.target.value) });
                                   clearAssignmentError(lesson.id, 'maxScore');
                                }}
                             />
                             {lessonErrors?.maxScore && (
                               <div className="cb-error-text">{lessonErrors.maxScore}</div>
                             )}
                          </div>
                          <div className="cb-form-group">
                             <label className="cb-label">Điểm đạt</label>
                             <input 
                                type="number" className="cb-input"
                                value={lesson.assignmentPassingScore ?? 50}
                                onChange={(e) => {
                                   updateLessonField(module.id, lesson.id, { assignmentPassingScore: parseInt(e.target.value) });
                                   clearAssignmentError(lesson.id, 'passingScore');
                                }}
                             />
                             {lessonErrors?.passingScore && (
                               <div className="cb-error-text">{lessonErrors.passingScore}</div>
                             )}
                          </div>
                       </div>

                       <div className="cb-form-group" style={{ marginTop: 24 }}>
                          <label className="cb-label">Tiêu chí chấm điểm (Rubric)</label>
                          <div className="cb-criteria-list">
                             {(lesson.assignmentCriteria || []).map((crit: AssignmentCriteriaDraft, idx: number) => {
                                const criteriaError = lessonErrors?.criteriaItems?.[idx];
                                return (
                                <div key={idx} className="cb-criteria-item" style={{ 
                                   display: 'flex', gap: 12, alignItems: 'flex-start', 
                                   padding: 16, border: '1px solid var(--cb-border-color)', borderRadius: 8, marginBottom: 12,
                                   backgroundColor: 'var(--cb-bg-secondary)'
                                }}>
                                   <div style={{ flex: 1 }}>
                                      <input 
                                         className="cb-input"
                                         value={crit.name}
                                         placeholder="Tên tiêu chí (VD: Sáng tạo, Kỹ thuật...)"
                                         style={{ marginBottom: 8 }}
                                         onChange={(e) => {
                                            const newCrit = [...(lesson.assignmentCriteria || [])];
                                            newCrit[idx].name = e.target.value;
                                            updateLessonField(module.id, lesson.id, { assignmentCriteria: newCrit });
                                            clearAssignmentError(lesson.id, 'criteriaItems', idx, 'name');
                                         }}
                                      />
                                      {criteriaError?.name && (
                                        <div className="cb-error-text">{criteriaError.name}</div>
                                      )}
                                      <textarea 
                                         className="cb-input cb-textarea"
                                         value={crit.description || ''}
                                         placeholder="Mô tả tiêu chí..."
                                         style={{ height: 60, fontSize: '0.9rem' }}
                                         onChange={(e) => {
                                            const newCrit = [...(lesson.assignmentCriteria || [])];
                                            newCrit[idx].description = e.target.value;
                                            updateLessonField(module.id, lesson.id, { assignmentCriteria: newCrit });
                                         }}
                                      />
                                   </div>
                                   <div style={{ width: 100 }}>
                                      <input 
                                         type="number" className="cb-input"
                                         value={crit.maxPoints}
                                         placeholder="Điểm"
                                         title="Điểm tối đa"
                                         onChange={(e) => {
                                            const newCrit = [...(lesson.assignmentCriteria || [])];
                                            newCrit[idx].maxPoints = parseInt(e.target.value) || 0;
                                            updateLessonField(module.id, lesson.id, { assignmentCriteria: newCrit });
                                            clearAssignmentError(lesson.id, 'criteriaItems', idx, 'maxPoints');
                                         }}
                                      />
                                      {criteriaError?.maxPoints && (
                                        <div className="cb-error-text">{criteriaError.maxPoints}</div>
                                      )}
                                   </div>
                                   <button 
                                      className="cb-icon-button cb-icon-button--danger"
                                      style={{ marginTop: 4 }}
                                      onClick={() => {
                                         const newCrit = lesson.assignmentCriteria?.filter((_, i) => i !== idx);
                                         updateLessonField(module.id, lesson.id, { assignmentCriteria: newCrit });
                                         clearAssignmentError(lesson.id, 'criteriaItems');
                                      }}
                                   >
                                      <FiTrash2 />
                                   </button>
                                </div>
                               );
                             })}
                             <div style={{ marginTop: 8, fontSize: '0.9rem', color: validateAssignmentScore(lesson) ? 'var(--cb-success-color)' : 'var(--cb-error-color)' }}>
                                Tổng điểm tiêu chí: {lesson.assignmentCriteria?.reduce((sum, c) => sum + (c.maxPoints || 0), 0) || 0} / {lesson.assignmentMaxScore || 100}
                                {!validateAssignmentScore(lesson) && ' (Tổng điểm tiêu chí phải bằng Điểm tối đa)'}
                             </div>
                             {lessonErrors?.criteriaTotal && (
                               <div className="cb-error-text">{lessonErrors.criteriaTotal}</div>
                             )}
                             <button 
                                className="cb-button cb-button--secondary"
                                onClick={() => {
                                   const newCrit: AssignmentCriteriaDraft = { 
                                      name: '', 
                                      description: '', 
                                      maxPoints: 10, 
                                      orderIndex: (lesson.assignmentCriteria?.length || 0) 
                                   };
                                   updateLessonField(module.id, lesson.id, { assignmentCriteria: [...(lesson.assignmentCriteria || []), newCrit] });
                                }}
                             >
                                <FiPlus /> Thêm tiêu chí
                             </button>
                          </div>
                       </div>
                    </div>
                 )}

                 {lesson.type === 'quiz' && (
                    <div className="cb-quiz-editor">
                       <div className="cb-tabs">
                          <button 
                             className={`cb-tab ${lessonEditor.activeTab === 'settings' ? 'cb-tab--active' : ''}`}
                             onClick={() => setLessonEditor(prev => ({ ...prev, activeTab: 'settings' }))}
                          >
                             <FiSettings /> Cấu hình
                          </button>
                          <button 
                             className={`cb-tab ${lessonEditor.activeTab === 'questions' ? 'cb-tab--active' : ''}`}
                             onClick={() => setLessonEditor(prev => ({ ...prev, activeTab: 'questions' }))}
                          >
                             <FiList /> Câu hỏi ({lesson.questions?.length || 0})
                          </button>
                       </div>

                       {lessonEditor.activeTab === 'settings' ? (
                          <>
                             <div className="cb-form-group">
                                <label className="cb-label">Mô tả bài kiểm tra</label>
                                <textarea 
                                   className="cb-input cb-textarea"
                                   style={{ height: 100 }}
                                   value={lesson.quizDescription || ''}
                                   onChange={(e) => updateLessonField(module.id, lesson.id, { quizDescription: e.target.value })}
                                   placeholder="Hướng dẫn làm bài, quy định..."
                                />
                             </div>

                             <div className="cb-grid cb-grid--2" style={{ marginTop: 16 }}>
                             <div className="cb-form-group">
                                <label className="cb-label">Điểm đạt (%)</label>
                                <input 
                                   type="number" className="cb-input"
                                   value={lesson.passScore ?? 80}
                                   onChange={(e) => updateLessonField(module.id, lesson.id, { passScore: parseInt(e.target.value) })}
                                />
                             </div>
                             <div className="cb-form-group">
                                <label className="cb-label">Số lần làm lại</label>
                                <input 
                                   type="number" className="cb-input"
                                   value={lesson.quizMaxAttempts ?? 3}
                                   onChange={(e) => updateLessonField(module.id, lesson.id, { quizMaxAttempts: parseInt(e.target.value) })}
                                />
                             </div>
                             <div className="cb-form-group">
                                <label className="cb-label">Thời gian (phút)</label>
                                <input 
                                   type="number" className="cb-input"
                                   value={lesson.quizTimeLimitMinutes ?? ''}
                                   placeholder="Không giới hạn"
                                   onChange={(e) => updateLessonField(module.id, lesson.id, { quizTimeLimitMinutes: parseInt(e.target.value) })}
                                />
                             </div>
                             
                             <div className="cb-form-group">
                                <label className="cb-label">Phương pháp tính điểm</label>
                                <select 
                                   className="cb-input cb-select"
                                   value={lesson.gradingMethod || 'HIGHEST'}
                                   onChange={(e) => updateLessonField(module.id, lesson.id, { gradingMethod: e.target.value })}
                                >
                                   <option value="HIGHEST">Điểm cao nhất</option>
                                   <option value="AVERAGE">Điểm trung bình</option>
                                   <option value="FIRST">Lần làm đầu tiên</option>
                                   <option value="LAST">Lần làm cuối cùng</option>
                                </select>
                             </div>

                             <div className="cb-form-group">
                                <label className="cb-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                   <input 
                                      type="checkbox"
                                      checked={lesson.isAssessment || false}
                                      onChange={(e) => updateLessonField(module.id, lesson.id, { isAssessment: e.target.checked })}
                                   />
                                   Đây là bài kiểm tra đánh giá (Assessment)
                                </label>
                                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                                   Bài kiểm tra đánh giá thường có trọng số cao hơn và yêu cầu nghiêm ngặt hơn.
                                </p>
                             </div>
                          </div>
                          </>
                       ) : (
                          <div className="cb-questions-manager" style={{ marginTop: 16 }}>
                             {(lesson.questions || []).map((q: QuizQuestionDraft, idx: number) => (
                                <div key={q.id} className="cb-question-card">
                                   <div className="cb-question-header">
                                      <span>Câu {idx + 1}</span>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12, color: 'var(--cb-text-dim)' }}>Điểm</span>
                                            <input
                                               type="number"
                                               min={1}
                                               className="cb-input cb-input--compact"
                                               style={{ width: 80, height: 32 }}
                                               value={q.score ?? 1}
                                               onChange={(e) => {
                                                  const nextScore = parseInt(e.target.value, 10);
                                                  const newQ = [...(lesson.questions || [])];
                                                  newQ[idx].score = Number.isFinite(nextScore) && nextScore > 0 ? nextScore : 1;
                                                  updateLessonField(module.id, lesson.id, { questions: newQ });
                                               }}
                                            />
                                         </div>
                                         <select
                                            className="cb-input cb-select"
                                            style={{ 
                                               width: 'auto', 
                                               padding: '4px 8px', 
                                               height: 32,
                                               backgroundColor: 'var(--cb-bg-secondary)',
                                               color: 'var(--cb-text-primary)',
                                               borderColor: 'var(--cb-border-color)'
                                            }}
                                            value={q.type || QuestionType.MULTIPLE_CHOICE}
                                            onChange={(e) => {
                                               const newType = e.target.value as QuestionType;
                                               const defaultQ = createDefaultQuestion(newType);
                                               const newQ = [...(lesson.questions || [])];
                                               newQ[idx] = { ...newQ[idx], type: newType, options: defaultQ.options };
                                               updateLessonField(module.id, lesson.id, { questions: newQ });
                                            }}
                                         >
                                            <option value={QuestionType.MULTIPLE_CHOICE} style={{ backgroundColor: 'var(--cb-bg-secondary)', color: 'var(--cb-text-primary)' }}>Trắc nghiệm</option>
                                            <option value={QuestionType.TRUE_FALSE} style={{ backgroundColor: 'var(--cb-bg-secondary)', color: 'var(--cb-text-primary)' }}>Đúng/Sai</option>
                                            <option value={QuestionType.SHORT_ANSWER} style={{ backgroundColor: 'var(--cb-bg-secondary)', color: 'var(--cb-text-primary)' }}>Điền từ</option>
                                         </select>
                                         <button 
                                            className="cb-icon-button cb-icon-button--danger"
                                            onClick={() => {
                                               const newQ = lesson.questions?.filter(qi => qi.id !== q.id);
                                               updateLessonField(module.id, lesson.id, { questions: newQ });
                                            }}
                                         >
                                            <FiTrash2 />
                                         </button>
                                      </div>
                                   </div>
                                   <input 
                                      className="cb-input" 
                                      value={q.text} 
                                      placeholder="Nhập nội dung câu hỏi..."
                                      onChange={(e) => {
                                         const newQ = [...(lesson.questions || [])];
                                         newQ[idx].text = e.target.value;
                                         updateLessonField(module.id, lesson.id, { questions: newQ });
                                      }}
                                   />
                                   
                                   {/* Options UI based on Type */}
                                   <div className="cb-options" style={{ marginTop: 12 }}>
                                      {/* MULTIPLE CHOICE */}
                                      {(q.type === QuestionType.MULTIPLE_CHOICE || !q.type) && (
                                         <>
                                            {q.options.map((opt: QuizOptionDraft, oIdx: number) => (
                                               <div key={opt.id} className="cb-option-row">
                                                  <input 
                                                     className="cb-input cb-input--compact"
                                                     value={opt.text}
                                                     placeholder={`Lựa chọn ${oIdx + 1}`}
                                                     onKeyDown={(e) => {
                                                        if (e.key === 'ArrowDown' || e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const nextInput = (e.currentTarget.parentElement?.nextElementSibling?.querySelector('input') as HTMLInputElement);
                                                            if (nextInput) nextInput.focus();
                                                        }
                                                        if (e.key === 'ArrowUp') {
                                                            e.preventDefault();
                                                            const prevInput = (e.currentTarget.parentElement?.previousElementSibling?.querySelector('input') as HTMLInputElement);
                                                            if (prevInput) prevInput.focus();
                                                        }
                                                     }}
                                                     onChange={(e) => {
                                                        const newQ = [...(lesson.questions || [])];
                                                        newQ[idx].options[oIdx].text = e.target.value;
                                                        updateLessonField(module.id, lesson.id, { questions: newQ });
                                                     }}
                                                  />
                                                  <div className="cb-option-correct" title="Đánh dấu đáp án đúng">
                                                     <input 
                                                        type="checkbox"
                                                        checked={opt.correct}
                                                        onChange={(e) => {
                                                           const newQ = [...(lesson.questions || [])];
                                                           newQ[idx].options[oIdx].correct = e.target.checked;
                                                           updateLessonField(module.id, lesson.id, { questions: newQ });
                                                        }}
                                                     />
                                                  </div>
                                                  <button 
                                                     className="cb-icon-button"
                                                     onClick={() => {
                                                        const newQ = [...(lesson.questions || [])];
                                                        newQ[idx].options = newQ[idx].options.filter((o: QuizOptionDraft) => o.id !== opt.id);
                                                        updateLessonField(module.id, lesson.id, { questions: newQ });
                                                     }}
                                                  >
                                                     <FiX />
                                                  </button>
                                               </div>
                                            ))}
                                            <button 
                                               className="cb-button cb-button--ghost cb-button--sm"
                                               onClick={() => {
                                                  const newQ = [...(lesson.questions || [])];
                                                  newQ[idx].options.push({ id: createId(), text: '', correct: false });
                                                  updateLessonField(module.id, lesson.id, { questions: newQ });
                                               }}
                                            >
                                               <FiPlus /> Thêm lựa chọn
                                            </button>
                                         </>
                                      )}

                                      {/* TRUE/FALSE */}
                                      {q.type === QuestionType.TRUE_FALSE && (
                                         <div style={{ display: 'flex', gap: 16 }}>
                                            {q.options.map((opt: QuizOptionDraft, oIdx: number) => (
                                               <label 
                                                  key={opt.id} 
                                                  className={`cb-tf-option ${opt.correct ? 'is-selected' : ''}`}
                                                  style={{ 
                                                     display: 'flex', alignItems: 'center', gap: 8, 
                                                     padding: '8px 16px', borderRadius: 8, 
                                                     border: opt.correct ? '1px solid var(--cb-success-color)' : '1px solid var(--cb-border-color)',
                                                     backgroundColor: opt.correct ? 'rgba(var(--cb-success-rgb), 0.1)' : 'transparent',
                                                     cursor: 'pointer',
                                                     color: 'var(--cb-text-primary)'
                                                  }}
                                               >
                                                  <input 
                                                     type="radio"
                                                     name={`q-${q.id}`}
                                                     checked={opt.correct}
                                                     onChange={() => {
                                                        const newQ = [...(lesson.questions || [])];
                                                        newQ[idx].options.forEach((o: QuizOptionDraft) => o.correct = false);
                                                        newQ[idx].options[oIdx].correct = true;
                                                        updateLessonField(module.id, lesson.id, { questions: newQ });
                                                     }}
                                                  />
                                                  <span style={{ color: 'var(--cb-text-primary)' }}>{opt.text}</span>
                                               </label>
                                            ))}
                                         </div>
                                      )}

                                      {/* SHORT ANSWER */}
                                      {q.type === QuestionType.SHORT_ANSWER && (
                                         <div className="cb-option-row">
                                            <input 
                                               className="cb-input"
                                               value={q.options[0]?.text || ''}
                                               placeholder="Nhập câu trả lời chính xác..."
                                               onChange={(e) => {
                                                  const newQ = [...(lesson.questions || [])];
                                                  if (!newQ[idx].options[0]) {
                                                     newQ[idx].options[0] = { id: createId(), text: '', correct: true };
                                                  }
                                                  newQ[idx].options[0].text = e.target.value;
                                                  newQ[idx].options[0].correct = true;
                                                  updateLessonField(module.id, lesson.id, { questions: newQ });
                                               }}
                                            />
                                         </div>
                                      )}
                                   </div>
                                </div>
                             ))}
                             <button 
                                className="cb-button cb-button--secondary"
                                onClick={() => {
                                   const newQ = createDefaultQuestion();
                                   updateLessonField(module.id, lesson.id, { questions: [...(lesson.questions || []), newQ] });
                                }}
                             >
                                <FiPlus /> Thêm câu hỏi
                             </button>
                          </div>
                       )}
                    </div>
                 )}
              </div>
           </div>
        </div>
      );
    }
    return <div className="cb-empty-state">Chọn một mục để chỉnh sửa</div>;
  };

  return (
    <div className="cb-page">
      {!isEditable && (
         <div className="cb-banner-warning" style={{ 
            backgroundColor: '#fff3cd', 
            color: '#856404', 
            padding: '12px 24px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            borderBottom: '1px solid #ffeeba'
         }}>
            <FiAlertTriangle size={20} />
            <div>
               <strong>Chế độ xem:</strong> Khóa học này đang ở trạng thái <strong>{state.currentCourse?.status}</strong> và không thể chỉnh sửa trực tiếp. 
               Vui lòng tạo phiên bản mới hoặc gửi yêu cầu chỉnh sửa.
            </div>
         </div>
      )}

      <div className="cb-container" style={{ maxWidth: '100%', padding: '0 24px', paddingBottom: 0 }}>
        <header className="cb-header" style={{ marginBottom: 16 }}>
          <div className="cb-header__left">
            <button className="cb-back-button" onClick={handleGoBack}>
              <FiArrowLeft /> Quay lại
            </button>
            <h1 className="cb-title">{isEditMode ? 'Chỉnh sửa khóa học' : 'Tạo khóa học'}</h1>
          </div>
          <div className="cb-header__right">
             <button 
                className="cb-button cb-button--secondary" 
                disabled={isSaving || !isEditable} 
                onClick={async () => {
                   if (saveInFlightRef.current) return;
                   const assignmentValidation = validateAssignmentsBeforeSave(modules);
                   setAssignmentErrors(assignmentValidation.errorsByLesson);
                   if (Object.keys(assignmentValidation.errorsByLesson).length > 0) {
                      showToast('error', assignmentValidation.firstMessage || 'Vui lòng kiểm tra lại thông tin bài tập.');
                      return;
                   }
                   const quizValidation = validateQuizzesBeforeSave(modules);
                   if (Object.keys(quizValidation.errorsByLesson).length > 0) {
                      showToast('error', quizValidation.firstMessage || 'Vui lòng kiểm tra lại thông tin quiz.');
                      return;
                   }
                   saveInFlightRef.current = true;
                   setIsSaving(true);
                   try {
                      // Pass local modules state to save logic
                      let savedCourse;
                      const courseDataOverride = {};
                      const fileToUpload = thumbnailFile || undefined;

                      if (isEditMode && courseId) {
                         savedCourse = await updateCourse(courseId, modules, courseDataOverride, fileToUpload);
                      } else {
                         savedCourse = await createCourse(modules, courseDataOverride, fileToUpload);
                      }
                      
                      if (savedCourse) {
                         // Sync local state with saved data (server IDs)
                         // We need to reload modules from the returned course
                         // Map savedCourse.modules to ModuleDraft[]
                         const mappedModules: ModuleDraft[] = savedCourse.modules.map(rawModule => {
                             const module = rawModule as { id: number; title: string; description?: string; lessons?: Array<Partial<LessonDraft> & { id: number; type?: LessonType | string; durationSec?: number; videoUrl?: string }>; };
                             return {
                               id: module.id.toString(),
                               serverId: module.id,
                               title: module.title,
                               description: module.description,
                               lessons: (module.lessons || []).map(rawLesson => {
                                 const lesson = rawLesson as Partial<LessonDraft> & { id: number; type?: LessonType | string; durationSec?: number; videoUrl?: string };
                                 return {
                                   id: lesson.id.toString(),
                                   serverId: lesson.id,
                                   title: lesson.title || '',
                                   type: (lesson.type?.toString().toLowerCase() || 'reading') as LessonKind,
                                   durationMin: lesson.durationSec ? Math.round(lesson.durationSec / 60) : undefined,
                                   contentText: lesson.contentText,
                                   resourceUrl: lesson.resourceUrl,
                                   youtubeUrl: lesson.youtubeUrl || lesson.videoUrl,
                                   videoMediaId: lesson.videoMediaId,
                                   passScore: lesson.passScore,
                                   quizTimeLimitMinutes: lesson.quizTimeLimitMinutes,
                                   quizMaxAttempts: lesson.quizMaxAttempts,
                                   quizDescription: lesson.quizDescription,
                                   gradingMethod: lesson.gradingMethod,
                                   isAssessment: lesson.isAssessment,
                                   questions: (lesson.questions || []).map((q: QuizQuestionDraft) => ({
                                     ...q,
                                     score: Number.isFinite(Number(q.score)) && Number(q.score) > 0 ? Number(q.score) : 1
                                   })),
                                   assignmentSubmissionType: (lesson.assignmentSubmissionType || (lesson as { submissionType?: SubmissionType }).submissionType || SubmissionType.TEXT) as SubmissionType,
                                   assignmentDescription: lesson.assignmentDescription,
                                   assignmentMaxScore: lesson.assignmentMaxScore,
                                   assignmentPassingScore: lesson.assignmentPassingScore,
                                   assignmentCriteria: lesson.assignmentCriteria,
                                   attachments: lesson.attachments
                                 };
                               })
                             };
                         });
                         
                         setModules(mappedModules);
                         setAssignmentErrors({});
                         
                         if (!isEditMode) {
                            navigate(`/mentor/courses/${savedCourse.id}/edit`, { replace: true });
                         }
                         showToast('success', 'Đã lưu thành công! Dữ liệu đã được đồng bộ.');
                      } else {
                         showToast('error', 'Lỗi khi lưu: Không nhận được dữ liệu từ server.');
                      }
                   } catch (err) {
                      const message = getApiErrorMessage(err);
                      showToast('error', `Lỗi khi lưu: ${message}`);
                   } finally {
                      saveInFlightRef.current = false;
                      setIsSaving(false);
                   }
                }}
             >
                <FiSave /> Lưu nháp
             </button>
             <button className="cb-button cb-button--success" disabled={isSaving || !isEditable} onClick={() => showToast('info', 'Chức năng xuất bản đang phát triển')}>
                <FiCheck /> Xuất bản
             </button>
          </div>
        </header>
      </div>
      
      <div className="cb-workspace">
        {renderSidebar()}
        {renderMainContent()}
      </div>

      {confirmDialog && (
        <div className="cb-modal-overlay">
           <div className="cb-modal">
              <h3>{confirmDialog.title}</h3>
              <p>{confirmDialog.message}</p>
              <div className="cb-modal__actions">
                 <button className="cb-button cb-button--secondary" onClick={() => setConfirmDialog(null)}>Hủy</button>
                 <button className="cb-button cb-button--danger" onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                 }}>{confirmDialog.confirmLabel || 'Xác nhận'}</button>
              </div>
           </div>
        </div>
      )}

      <input 
         type="file" 
         ref={fileInputRef} 
         style={{ display: 'none' }} 
         onChange={handleFileUpload} 
         accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
      />
      <input 
         type="file" 
         ref={videoInputRef} 
         style={{ display: 'none' }} 
         onChange={handleVideoUpload} 
         accept="video/mp4,video/webm,video/ogg"
      />
    </div>
  );
};

export default CourseCreationPage;
