import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Upload, 
  Clock, 
  Users, 
  Star, 
  Calendar,
  DollarSign,
  Award,
  FileText,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  History,
  Code,
  PenTool,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listCoursesByAuthor, createCourse as apiCreateCourse, updateCourse as apiUpdateCourse, deleteCourse, submitCourseForApproval } from '../../services/courseService';
import { CourseStatus, CourseLevel, CourseUpdateDTO, CourseCreateDTO } from '../../data/courseDTOs';
import BookingManagerTab from '../../components/mentor/BookingManagerTab';
import MyScheduleTab from '../../components/mentor/MyScheduleTab';
import EarningsTab from '../../components/mentor/EarningsTab';
import SkillPointsTab from '../../components/mentor/SkillPointsTab';
import ReviewsTab from '../../components/mentor/ReviewsTab';
import MentoringHistoryTab from '../../components/mentor/MentoringHistoryTab';
import '../../styles/MentorPage-HUD.css';
import { listModules, createModule, updateModule } from '../../services/moduleService';
import { listLessonsByModule, createLesson, reorderLessons, getLessonById, deleteLesson } from '../../services/lessonService';
import { LessonType as ApiLessonType, LessonCreateDTO } from '../../data/lessonDTOs';
import { createQuiz, listQuizzesByModule, getQuizById, updateQuiz, deleteQuiz, addQuizQuestion, updateQuizQuestion, deleteQuizQuestion, addQuizOption, updateQuizOption, deleteQuizOption } from '../../services/quizService';
import { QuizCreateDTO, QuizSummaryDTO, QuizDetailDTO, QuizUpdateDTO, QuizQuestionCreateDTO, QuizQuestionDetailDTO, QuizQuestionUpdateDTO, QuizOptionCreateDTO, QuizOptionDTO, QuizOptionUpdateDTO, QuestionType } from '../../data/quizDTOs';
import { listAssignmentsByModule, updateAssignment, deleteAssignment, getAssignmentById } from '../../services/assignmentService';
import { createCodingExercise } from '../../services/codelabService';
import { SubmissionType, AssignmentSummaryDTO } from '../../data/assignmentDTOs';
import AssignmentModal from '../../components/course/AssignmentModal';
import { ProgrammingLanguage, CodingExerciseCreateDTO } from '../../data/codelabDTOs';
import { uploadMedia, getSignedMediaUrl, listMediaByLesson } from '../../services/mediaService';
import HoloProgressBar from '../../components/dashboard-hud/HoloProgressBar';
import AttachmentManager from '../../components/course/AttachmentManager';
import { uploadVideo } from '../../services/fileUploadService';

// Types for mentor dashboard data
export interface Booking {
  id: string;
  studentName: string;
  bookingTime: string;
  topic?: string;
  status: 'Pending' | 'Confirmed' | 'Completed';
  price: number;
  studentAvatar?: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'available' | 'booked' | 'blocked';
  studentName?: string;
  topic?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  status: 'In Progress' | 'Completed' | 'Failed';
  description: string;
  studentName: string;
}

export interface Review {
  id: string;
  studentName: string;
  rating: number;
  feedback: string;
  date: string;
  sessionTopic: string;
  studentAvatar?: string;
}

export interface MentoringSession {
  id: string;
  studentName: string;
  date: string;
  topic: string;
  status: 'Completed' | 'Rated' | 'No Feedback';
  type: 'Free' | 'Paid';
  earnings?: number;
  skillPoints?: number;
  hasReview: boolean;
}

export interface SkillPointActivity {
  id: string;
  activity: string;
  points: number;
  date: string;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedDate: string;
}

// Course Management Types
export interface Course {
  id: number;
  title: string;
  description: string;
  level: CourseLevel;
  status: CourseStatus;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  thumbnail?: {
    id: number;
    url: string;
    fileName: string;
  };
  lessons: Lesson[];
  quizzes: Quiz[];
  assignments: Assignment[];
  codingExercises: CodingExercise[];
  enrollmentCount: number;
  moduleCount?: number;
  lessonCount?: number;
  price?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: number;
  title: string;
  type: 'VIDEO' | 'READING' | 'QUIZ' | 'ASSIGNMENT' | 'CODELAB';
  orderIndex: number;
  durationSec: number;
  contentText?: string;
  videoUrl?: string;
  videoMediaId?: number;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  passScore: number;
  questions: QuizQuestion[];
  lessonId: number;
}

export interface QuizQuestion {
  id: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';
  score: number;
  orderIndex: number;
  options: QuizOption[];
}

export interface QuizOption {
  id: number;
  optionText: string;
  correct: boolean;
  orderIndex: number;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  submissionType: 'FILE' | 'TEXT' | 'LINK';
  maxScore: number;
  dueAt?: string;
  lessonId: number;
}

export interface CodingExercise {
  id: number;
  title: string;
  prompt: string;
  language: string;
  starterCode: string;
  maxScore: number;
  testCases: CodingTestCase[];
  lessonId: number;
}

export interface CodingTestCase {
  id: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  orderIndex: number;
}

// Module Management Types (lightweight for MentorPage)
interface ModuleItem {
  id: number;
  title: string;
  description?: string;
  orderIndex: number;
}

export interface CourseCreateData {
  title: string;
  description: string;
  level: string;
  price?: number;
  currency?: string;
}

export interface LessonCreateData {
  title: string;
  type: 'VIDEO' | 'READING' | 'QUIZ' | 'ASSIGNMENT' | 'CODELAB';
  orderIndex: number;
  contentText?: string;
  videoUrl?: string;
  videoMediaId?: number;
  durationSec?: number;
}

export interface QuizCreateData {
  title: string;
  description: string;
  passScore: number;
  lessonId: number;
}

export interface AssignmentCreateData {
  title: string;
  description: string;
  submissionType: 'FILE' | 'TEXT' | 'LINK';
  maxScore: number;
  dueAt?: string;
  lessonId: number;
}

export interface CodingExerciseCreateData {
  title: string;
  prompt: string;
  language: string;
  starterCode: string;
  maxScore: number;
  lessonId: number;
}

const MentorPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<string>('lessons');
  const [error, setError] = useState<string | null>(null);

  // Modules state for selected course
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [modulesLoading, setModulesLoading] = useState<boolean>(false);
  const [newModuleTitle, setNewModuleTitle] = useState<string>('');
  const [newModuleDescription, setNewModuleDescription] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState<boolean>(false);
  const [moduleQuizzes, setModuleQuizzes] = useState<QuizSummaryDTO[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState<boolean>(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDetailDTO | null>(null);
  const [quizDetailLoading, setQuizDetailLoading] = useState<boolean>(false);
  const [moduleAssignments, setModuleAssignments] = useState<AssignmentSummaryDTO[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<{
    id: number;
    title: string;
    description: string;
    submissionType: SubmissionType;
    maxScore: number;
    dueAt?: string;
  } | null>(null);
  const [activeModuleTab, setActiveModuleTab] = useState<'lessons' | 'quizzes' | 'assignments' | 'codelabs'>('lessons');

  // Quick-add modal states
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // ✅ NEW: Video upload progress tracking
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // ✅ NEW: Selected lesson type for Add Lesson modal
const [selectedLessonType, setSelectedLessonType] = useState<ApiLessonType>(ApiLessonType.VIDEO);

  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddCodelab, setShowAddCodelab] = useState(false);
  const [showQuizDetail, setShowQuizDetail] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddOption, setShowAddOption] = useState(false);
  const [_editingQuiz, setEditingQuiz] = useState<QuizDetailDTO | null>(null);
  const [_editingQuestion, setEditingQuestion] = useState<QuizQuestionDetailDTO | null>(null);
  const [_editingOption, setEditingOption] = useState<QuizOptionDTO | null>(null);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'course' | 'lesson' | 'quiz' | 'question' | 'option' | 'assignment';
    id: number;
    name: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mock data for demonstrations
  const [bookings] = useState<Booking[]>([
    {
      id: '1',
      studentName: 'Nguyễn Văn An',
      bookingTime: '2025-07-03T14:00:00',
      topic: 'Thực Hành Tốt Nhất React',
      status: 'Pending',
      price: 500000,
    },
    {
      id: '2',
      studentName: 'Trần Thị Bình',
      bookingTime: '2025-07-04T10:00:00',
      topic: 'Hướng Dẫn Nghề Nghiệp',
      status: 'Confirmed',
      price: 0,
    },
    {
      id: '3',
      studentName: 'Lê Văn Cường',
      bookingTime: '2025-07-02T16:00:00',
      topic: 'Cơ Bản TypeScript',
      status: 'Completed',
      price: 300000,
    },
  ]);

  // Load mentor's courses from backend
  const loadCourses = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch courses by author from backend
      const response = await listCoursesByAuthor(user.id, 0, 50);
      
      // Convert DTO to internal Course format
      const mentorCourses: Course[] = response.content.map(dto => ({
        id: dto.id,
        title: dto.title,
        description: dto.description,
        level: dto.level,
        status: dto.status,
        author: dto.author,
        thumbnail: dto.thumbnailUrl ? {
          id: 0, // Not available in summary
          url: dto.thumbnailUrl,
          fileName: '' // Not available in summary
        } : undefined,
        lessons: [], // Load separately when needed
        quizzes: [],
        assignments: [],
        codingExercises: [],
        enrollmentCount: dto.enrollmentCount,
        moduleCount: dto.moduleCount, // ✅ Use actual moduleCount from backend
        lessonCount: dto.lessonCount || 0, // ✅ Use actual lessonCount from backend
        price: dto.price,
        currency: dto.currency,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt
      }));
      
      setCourses(mentorCourses);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleApproveBooking = (bookingId: string) => {
    console.log('Approving booking:', bookingId);
  };

  const handleRejectBooking = (bookingId: string) => {
    console.log('Rejecting booking:', bookingId);
  };

  const handleMarkAsDone = (bookingId: string) => {
    console.log('Marking booking as done:', bookingId);
  };

  const handleCreateCourse = async (courseData: CourseCreateData | Partial<CourseCreateData>, thumbnailFile?: File) => {
    setLoading(true);
    try {
      if (!user) throw new Error('User not authenticated');
      console.log('Creating course:', courseData);
      
      const createPayload: CourseCreateDTO = {
        title: courseData.title || '',
        description: courseData.description || '',
        level: (courseData.level as CourseLevel) || CourseLevel.BEGINNER,
        price: courseData.price,
        currency: courseData.currency || 'VND'
      };

      console.log('Creating course with payload:', createPayload);
      const createdDto = await apiCreateCourse(user.id, createPayload, thumbnailFile);
      console.log('Created course response:', createdDto);

      // Type guard to ensure required fields are present
      if (!createdDto.title) {
        throw new Error('Title is required');
      }
      
      const newCourse: Course = {
        id: createdDto.id,
        title: createdDto.title,
        description: createdDto.description,
        level: createdDto.level,
        status: createdDto.status,
        author: createdDto.author,
        thumbnail: createdDto.thumbnail,
        lessons: [],
        quizzes: [],
        assignments: [],
        codingExercises: [],
        enrollmentCount: createdDto.enrollmentCount,
        moduleCount: Array.isArray(createdDto.modules) ? createdDto.modules.length : 0,
        lessonCount: 0,
        price: createdDto.price,
        currency: createdDto.currency,
        createdAt: createdDto.createdAt,
        updatedAt: createdDto.updatedAt
      };
      
      setCourses(prev => [newCourse, ...prev]);
      setShowCreateCourse(false);
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (courseId: number, courseData: Partial<CourseCreateData>, thumbnailFile?: File) => {
    setLoading(true);
    try {
      if (!user) throw new Error('User not authenticated');
      console.log('Updating course:', courseId, courseData);

      // Find the current course to get existing values
      const currentCourse = courses.find(c => c.id === courseId);
      if (!currentCourse) {
        throw new Error('Course not found');
      }

      const updatePayload: CourseUpdateDTO = {
        title: courseData.title || currentCourse.title, // Always provide title
        ...(courseData.description !== undefined && { description: courseData.description }),
        ...(courseData.level && { level: courseData.level as CourseLevel }),
        ...(courseData.price !== undefined && { price: courseData.price }),
        ...(courseData.currency && { currency: courseData.currency })
      };

      console.log('Updating course with payload:', updatePayload);
      const updatedDto = await apiUpdateCourse(courseId, updatePayload, user.id, thumbnailFile);
      console.log('Updated course response:', updatedDto);

      setCourses(prev => prev.map(course => {
        if (course.id !== courseId) return course;
        return {
          ...course,
          title: updatedDto.title,
          description: updatedDto.description,
          level: updatedDto.level,
          status: updatedDto.status,
          author: updatedDto.author,
          thumbnail: updatedDto.thumbnail ?? course.thumbnail,
          price: updatedDto.price,
          currency: updatedDto.currency,
          updatedAt: updatedDto.updatedAt
        };
      }));
      setEditingCourse(null);
    } catch (error: any) {
      console.error('Error updating course:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update course';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    setDeleteTarget({
      type: 'course',
      id: courseId,
      name: course.title,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          console.log('Deleting course:', courseId);
          await deleteCourse(courseId, user?.id || 0);
          setCourses(prev => prev.filter(course => course.id !== courseId));
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        } catch (error) {
          console.error('Error deleting course:', error);
          setError('Không thể xóa khóa học. Vui lòng thử lại.');
        } finally {
          setIsDeleting(false);
        }
      }
    });
    setShowDeleteConfirm(true);
  };

  const handleSubmitForApproval = async (courseId: number) => {
    if (!user) {
      setError('Bạn cần đăng nhập để thực hiện thao tác này.');
      return;
    }
    
    if (window.confirm('Bạn có chắc chắn muốn gửi khóa học này để duyệt? Sau khi gửi, bạn sẽ không thể chỉnh sửa cho đến khi được phê duyệt hoặc từ chối.')) {
      setLoading(true);
      try {
        console.log('Submitting course for approval:', courseId);
        
        const updatedCourse = await submitCourseForApproval(courseId, user.id);
        
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { 
                ...course, 
                status: updatedCourse.status,
                updatedAt: updatedCourse.updatedAt
              }
            : course
        ));
        
        setError(null);
        // Show success message
        alert('Khóa học đã được gửi để duyệt thành công!');
      } catch (error: any) {
        console.error('Error submitting course:', error);
        const errorMessage = error.response?.data?.message || 'Không thể gửi khóa học để duyệt. Vui lòng thử lại.';
        setError(errorMessage);
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseDetail(true);
    // Load modules for the course
    void loadModules(course.id);
  };

  const loadModules = async (courseId: number) => {
    try {
      setModulesLoading(true);
      const data = await listModules(courseId);
      // Normalize
      const mods: ModuleItem[] = (data || []).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        orderIndex: m.orderIndex ?? 0
      }));
      setModules(mods);
    } catch (e) {
      console.error('Failed to load modules', e);
      setModules([]);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleCreateModule = async () => {
    if (!selectedCourse) return;
    if (!newModuleTitle.trim()) return;
    try {
      setModulesLoading(true);
      const created = await createModule(selectedCourse.id, user?.id ?? 0, {
        title: newModuleTitle.trim(),
        description: newModuleDescription.trim() || undefined
      });
      setNewModuleTitle('');
      setNewModuleDescription('');
      setModules(prev => [
        ...prev,
        {
          id: created.id,
          title: created.title,
          description: created.description,
          orderIndex: created.orderIndex ?? prev.length + 1
        }
      ].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
      setSelectedModuleId(created.id);
    } catch (e) {
      console.error('Create module failed', e);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleSelectModule = (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setActiveModuleTab('lessons');
    // Load lessons, quizzes, and assignments for this specific module
    if (selectedCourse) {
      void loadLessons(selectedCourse.id, moduleId);
      void loadQuizzes(moduleId);
      void loadAssignments(moduleId);
    }
  };

  const handleMoveModule = async (moduleId: number, direction: 'up' | 'down') => {
    if (!user) return;
    const sorted = [...modules].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const index = sorted.findIndex(m => m.id === moduleId);
    if (index === -1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[swapIndex];
    const aOrder = a.orderIndex ?? (index + 1);
    const bOrder = b.orderIndex ?? (swapIndex + 1);
    
    // Optimistic UI update first
    const optimisticUpdate = modules.map(m => {
      if (m.id === a.id) return { ...m, orderIndex: bOrder };
      if (m.id === b.id) return { ...m, orderIndex: aOrder };
      return m;
    }).sort((x, y) => (x.orderIndex || 0) - (y.orderIndex || 0));
    setModules(optimisticUpdate);
    
    try {
      // Update backend sequentially to avoid race conditions
      await updateModule(a.id, user.id, { orderIndex: bOrder });
      await updateModule(b.id, user.id, { orderIndex: aOrder });
    } catch (e) {
      console.error('Failed to move module', e);
      // Revert on error
      setModules(sorted);
      setError('Không thể di chuyển module. Vui lòng thử lại.');
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!user) return;
    const lesson = courseLessons.find(l => l.id === lessonId);
    if (!lesson) return;

    setDeleteTarget({
      type: 'lesson',
      id: lessonId,
      name: lesson.title,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteLesson(lessonId, user.id);
          if (selectedCourse && selectedModuleId) {
            await loadLessons(selectedCourse.id, selectedModuleId);
          }
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        } catch (error) {
          console.error('Error deleting lesson:', error);
          setError('Không thể xóa bài học. Vui lòng thử lại.');
        } finally {
          setIsDeleting(false);
        }
      }
    });
    setShowDeleteConfirm(true);
  };

  const loadLessons = async (courseId: number, moduleId?: number) => {
    try {
      setLessonsLoading(true);
      
      if (moduleId) {
        // Load lessons for specific module only
        const lessons = await listLessonsByModule(moduleId);
        console.log('[LOAD_LESSONS] Loaded', lessons.length, 'lessons for module', moduleId);
        const mapped: Lesson[] = lessons.map((l: any) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          orderIndex: l.orderIndex,
          durationSec: l.durationSec ?? 0,
          contentText: l.contentText,
          videoUrl: l.videoUrl,
          videoMediaId: l.videoMediaId
        }));
        console.log('[LOAD_LESSONS] Mapped lessons:', mapped);
        setCourseLessons(mapped);
      } else {
        // Load lessons from all modules (for backward compatibility)
        const courseModules = await listModules(courseId);
        const allLessonsPromises = courseModules.map(module => 
          listLessonsByModule(module.id)
        );
        const lessonsArrays = await Promise.all(allLessonsPromises);
        
        // Flatten and map lessons
        const allLessons = lessonsArrays.flat();
        const mapped: Lesson[] = allLessons.map((l: any) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          orderIndex: l.orderIndex,
          durationSec: l.durationSec ?? 0,
          contentText: l.contentText,
          videoUrl: l.videoUrl,
          videoMediaId: l.videoMediaId
        }));
        
        setCourseLessons(mapped);
      }
    } catch (e) {
      console.error('Failed to load lessons', e);
      setCourseLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  };

  const loadQuizzes = async (moduleId: number) => {
    try {
      setQuizzesLoading(true);
      const quizzes = await listQuizzesByModule(moduleId);
      setModuleQuizzes(quizzes || []);
    } catch (e) {
      console.error('Failed to load quizzes', e);
      setModuleQuizzes([]);
    } finally {
      setQuizzesLoading(false);
    }
  };

  const loadAssignments = async (moduleId: number) => {
    try {
      setAssignmentsLoading(true);
      const assignments = await listAssignmentsByModule(moduleId);
      setModuleAssignments(assignments || []);
    } catch (e) {
      console.error('Failed to load assignments', e);
      setModuleAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleEditAssignment = async (assignmentId: number) => {
    try {
      const assignment = await getAssignmentById(assignmentId);
      // Convert AssignmentDetailDTO to the format expected by AssignmentModal
      setEditingAssignment({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        submissionType: assignment.submissionType,
        maxScore: assignment.maxScore,
        dueAt: assignment.dueAt
      });
      setShowAddAssignment(true);
    } catch (e) {
      console.error('Failed to load assignment details', e);
      setError('Failed to load assignment details');
    }
  };

  const _handleUpdateAssignment = async (assignmentId: number, assignmentData: any) => {
    try {
      if (!user) throw new Error('User not authenticated');
      await updateAssignment(assignmentId, assignmentData, user.id);
      setEditingAssignment(null);
      // Reload assignments
      if (selectedModuleId) {
        await loadAssignments(selectedModuleId);
      }
    } catch (e) {
      console.error('Failed to update assignment', e);
      setError('Failed to update assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!user) return;
    const assignment = moduleAssignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    setDeleteTarget({
      type: 'assignment',
      id: assignmentId,
      name: assignment.title,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteAssignment(assignmentId, user.id);
          if (selectedModuleId) {
            await loadAssignments(selectedModuleId);
          }
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        } catch (e) {
          console.error('Failed to delete assignment', e);
          setError('Không thể xóa bài tập. Vui lòng thử lại.');
        } finally {
          setIsDeleting(false);
        }
      }
    });
    setShowDeleteConfirm(true);
  };

  const handleAssignmentSuccess = () => {
    // Reload assignments after successful create/update
    if (selectedModuleId) {
      void loadAssignments(selectedModuleId);
    }
    setEditingAssignment(null);
  };

  const handleViewQuiz = async (quizId: number) => {
    try {
      setQuizDetailLoading(true);
      const quiz = await getQuizById(quizId);
      setSelectedQuiz(quiz);
      setShowQuizDetail(true);
    } catch (e) {
      console.error('Failed to load quiz details', e);
      setError('Failed to load quiz details');
    } finally {
      setQuizDetailLoading(false);
    }
  };

  const handleEditQuiz = (quiz: QuizDetailDTO) => {
    setEditingQuiz(quiz);
  };

  const _handleUpdateQuiz = async (quizId: number, quizData: QuizUpdateDTO) => {
    try {
      if (!user) throw new Error('User not authenticated');
      const _updated = await updateQuiz(quizId, quizData, user.id);
      setEditingQuiz(null);
      // Reload quizzes
      if (selectedModuleId) {
        await loadQuizzes(selectedModuleId);
      }
    } catch (e) {
      console.error('Failed to update quiz', e);
      setError('Failed to update quiz');
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!user) return;
    const quiz = moduleQuizzes.find(q => q.id === quizId) || selectedQuiz;
    if (!quiz) return;

    setDeleteTarget({
      type: 'quiz',
      id: quizId,
      name: quiz.title,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteQuiz(quizId, user.id);
          if (selectedModuleId) {
            await loadQuizzes(selectedModuleId);
          }
          setShowQuizDetail(false);
          setSelectedQuiz(null);
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        } catch (e) {
          console.error('Failed to delete quiz', e);
          setError('Không thể xóa quiz. Vui lòng thử lại.');
        } finally {
          setIsDeleting(false);
        }
      }
    });
    setShowDeleteConfirm(true);
  };

  const handleAddQuestion = async (quizId: number, questionData: QuizQuestionCreateDTO) => {
    try {
      if (!user) throw new Error('User not authenticated');
      await addQuizQuestion(quizId, questionData, user.id);
      setShowAddQuestion(false);
      // Reload quiz details
      await handleViewQuiz(quizId);
    } catch (e) {
      console.error('Failed to add question', e);
      setError('Failed to add question');
    }
  };

  const _handleUpdateQuestion = async (questionId: number, questionData: QuizQuestionUpdateDTO) => {
    try {
      if (!user) throw new Error('User not authenticated');
      await updateQuizQuestion(questionId, questionData, user.id);
      setEditingQuestion(null);
      // Reload quiz details
      if (selectedQuiz) {
        await handleViewQuiz(selectedQuiz.id);
      }
    } catch (e) {
      console.error('Failed to update question', e);
      setError('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!user || !selectedQuiz) return;
    const question = selectedQuiz.questions.find(q => q.id === questionId);
    if (!question) return;

    setDeleteTarget({
      type: 'question',
      id: questionId,
      name: `Câu hỏi: ${question.questionText.substring(0, 50)}...`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteQuizQuestion(questionId, user.id);
          if (selectedQuiz) {
            await handleViewQuiz(selectedQuiz.id);
          }
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        } catch (e) {
          console.error('Failed to delete question', e);
          setError('Không thể xóa câu hỏi. Vui lòng thử lại.');
        } finally {
          setIsDeleting(false);
        }
      }
    });
    setShowDeleteConfirm(true);
  };

  const handleAddOption = async (questionId: number, optionData: QuizOptionCreateDTO) => {
    try {
      if (!user) throw new Error('User not authenticated');
      await addQuizOption(questionId, optionData, user.id);
      setShowAddOption(false);
      // Reload quiz details
      if (selectedQuiz) {
        await handleViewQuiz(selectedQuiz.id);
      }
    } catch (e) {
      console.error('Failed to add option', e);
      setError('Failed to add option');
    }
  };

  const _handleUpdateOption = async (optionId: number, optionData: QuizOptionUpdateDTO) => {
    try {
      if (!user) throw new Error('User not authenticated');
      await updateQuizOption(optionId, optionData, user.id);
      setEditingOption(null);
      // Reload quiz details
      if (selectedQuiz) {
        await handleViewQuiz(selectedQuiz.id);
      }
    } catch (e) {
      console.error('Failed to update option', e);
      setError('Failed to update option');
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!user || !selectedQuiz) return;

    // Find the option across all questions
    let optionText = 'Option';
    for (const question of selectedQuiz.questions) {
      const option = question.options.find(o => o.id === optionId);
      if (option) {
        optionText = option.optionText;
        break;
      }
    }

    setDeleteTarget({
      type: 'option',
      id: optionId,
      name: `Lựa chọn: ${optionText.substring(0, 50)}${optionText.length > 50 ? '...' : ''}`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteQuizOption(optionId, user.id);
          if (selectedQuiz) {
            await handleViewQuiz(selectedQuiz.id);
          }
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        } catch (e) {
          console.error('Failed to delete option', e);
          setError('Không thể xóa lựa chọn. Vui lòng thử lại.');
        } finally {
          setIsDeleting(false);
        }
      }
    });
    setShowDeleteConfirm(true);
  };

  const getStatusIcon = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PUBLIC:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case CourseStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case CourseStatus.DRAFT:
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case CourseStatus.ARCHIVED:
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PUBLIC:
        return 'mentor-status-public';
      case CourseStatus.PENDING:
        return 'mentor-status-pending';
      case CourseStatus.DRAFT:
        return 'mentor-status-draft';
      case CourseStatus.ARCHIVED:
        return 'mentor-status-archived';
      default:
        return 'mentor-status-archived';
    }
  };

  const getHUDStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PUBLIC:
        return 'mentor-hud-status-public';
      case CourseStatus.PENDING:
        return 'mentor-hud-status-pending';
      case CourseStatus.DRAFT:
        return 'mentor-hud-status-draft';
      case CourseStatus.ARCHIVED:
        return 'mentor-hud-status-archived';
      default:
        return 'mentor-hud-status-draft';
    }
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Play className="w-4 h-4" />;
      case 'READING':
        return <FileText className="w-4 h-4" />;
      case 'QUIZ':
        return <HelpCircle className="w-4 h-4" />;
      case 'ASSIGNMENT':
        return <Edit3 className="w-4 h-4" />;
      case 'CODELAB':
        return <Code className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const tabs = [
    { 
      id: 'courses', 
      label: 'Quản Lý Khóa Học', 
      icon: BookOpen,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Tạo và quản lý khóa học của bạn'
    },
    { 
      id: 'bookings', 
      label: 'Quản Lý Đặt Lịch', 
      icon: Calendar,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      description: 'Quản lý lịch đặt của học viên'
    },
    { 
      id: 'schedule', 
      label: 'Lịch Trình', 
      icon: Clock,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      description: 'Xem lịch trình của bạn'
    },
    { 
      id: 'earnings', 
      label: 'Thu Nhập', 
      icon: DollarSign,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      description: 'Theo dõi thu nhập'
    },
    { 
      id: 'skillpoints', 
      label: 'Điểm Kỹ Năng', 
      icon: Award,
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      description: 'Thành tích của bạn'
    },
    { 
      id: 'reviews', 
      label: 'Đánh Giá', 
      icon: Star,
      gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      description: 'Phản hồi học viên'
    },
    { 
      id: 'history', 
      label: 'Lịch Sử', 
      icon: History,
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      description: 'Hồ sơ buổi học'
    },
  ];

  const renderCoursesTab = () => (
    <div className="mentor-hud-courses">
      <div className="mentor-hud-courses__header">
        <div className="mentor-hud-courses__title-section">
          <h2>MISSION MODULES</h2>
          <p>Quản lý và tạo mới các khóa học</p>
        </div>
        <button
          className="mentor-hud-create-button"
          onClick={() => setShowCreateCourse(true)}
        >
          <Plus className="w-5 h-5" />
          Tạo Khóa Học Mới
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mentor-loading-state">
          <div className="spinner"></div>
          <p>Đang tải khóa học...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mentor-error-state">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="error-message">{error}</p>
          <button 
            className="retry-button" 
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courses.length === 0 && (
        <div className="mentor-hud-empty">
          <BookOpen className="w-16 h-16" style={{color: 'var(--mentor-hud-accent-cyan)'}} />
          <h3>Chưa có khóa học nào</h3>
          <p>Bắt đầu tạo khóa học đầu tiên của bạn!</p>
          <button
            className="mentor-hud-create-button"
            onClick={() => setShowCreateCourse(true)}
          >
            <Plus className="w-5 h-5" />
            Tạo Khóa Học Mới
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && courses.length > 0 && (
        <div className="mentor-hud-courses__grid">
          {courses.map((course) => (
          <div key={course.id} className="mentor-hud-course-card">
            <div className="mentor-hud-course-thumbnail">
              {course.thumbnail?.url ? (
                <img src={course.thumbnail.url} alt={course.title} />
              ) : (
                <div className="mentor-hud-course-thumbnail-placeholder">
                  <BookOpen className="w-12 h-12" />
                </div>
              )}
              <div className={`mentor-hud-course-status ${getHUDStatusColor(course.status)}`}>
                {getStatusIcon(course.status)}
                <span>{course.status}</span>
              </div>
            </div>

            <div className="mentor-hud-course-content">
              <h3 className="mentor-hud-course-title">{course.title}</h3>
              <p className="mentor-hud-course-description">{course.description}</p>

              <div className="mentor-hud-course-meta">
                <div className="mentor-hud-course-level">
                  <span className="mentor-hud-level-badge">{course.level}</span>
                </div>
                <div className="mentor-hud-course-stats">
                  <div className="mentor-hud-course-stat">
                    <Users className="w-4 h-4" />
                    <span>{course.enrollmentCount} Học viên</span>
                  </div>
                  <div className="mentor-hud-course-stat">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.moduleCount} Module</span>
                  </div>
                  <div className="mentor-hud-course-stat">
                    <Play className="w-4 h-4" />
                    <span>{course.lessonCount} Bài học</span>
                  </div>
                  {course.price !== undefined && course.price !== null && (
                    <div className="mentor-hud-course-stat">
                      <DollarSign className="w-4 h-4" />
                      <span>{course.price.toLocaleString('vi-VN')} {course.currency || 'VND'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mentor-course-lessons">
                <h4>Bài học:</h4>
                <div className="mentor-lessons-list">
                  {course.lessons.slice(0, 3).map((lesson) => (
                    <div key={lesson.id} className="mentor-lesson-item">
                      {getLessonTypeIcon(lesson.type)}
                      <span>{lesson.title}</span>
                      <span className="mentor-lesson-duration">{formatDuration(lesson.durationSec)}</span>
                    </div>
                  ))}
                  {course.lessons.length > 3 && (
                    <div className="mentor-lesson-more">
                      +{course.lessons.length - 3} bài học khác
                    </div>
                  )}
                </div>
              </div>

              <div className="mentor-hud-course-actions">
                <button
                  className="mentor-hud-action-button mentor-hud-view-button"
                  onClick={() => handleViewCourse(course)}
                >
                  <Eye className="w-4 h-4" />
                  Xem
                </button>
                <button
                  className="mentor-hud-action-button mentor-hud-edit-button"
                  onClick={() => setEditingCourse(course)}
                >
                  <Edit3 className="w-4 h-4" />
                  Sửa
                </button>
                {course.status === CourseStatus.DRAFT && (
                  <button
                    className="mentor-hud-action-button mentor-hud-submit-button"
                    onClick={() => handleSubmitForApproval(course.id)}
                    disabled={loading}
                  >
                    <Upload className="w-4 h-4" />
                    Gửi Duyệt
                  </button>
                )}
                <button
                  className="mentor-hud-action-button mentor-hud-delete-button"
                  onClick={() => handleDeleteCourse(course.id)}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );

  const renderCourseDetailModal = () => {
    if (!selectedCourse) return null;

    return (
      <div className="mentor-course-detail-modal">
        <div className="mentor-course-detail-content">
          <div className="mentor-course-detail-header">
            <h2 className="mentor-course-detail-title">{selectedCourse.title}</h2>
            <button className="mentor-modal-close" onClick={() => setShowCourseDetail(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mentor-course-detail-body">
            <div className="mentor-course-content-tabs">
              <button 
                className={`mentor-content-tab ${activeContentTab === 'modules' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('modules')}
              >
                <BookOpen className="w-4 h-4" />
                Module
              </button>
            </div>

            {activeContentTab === 'modules' && modules.length === 0 && (
              <div className="mentor-empty-state" style={{ padding: '24px' }}>
                <div className="mentor-courses-title-section" style={{ marginBottom: 12 }}>
                  <h3>Hãy tạo Module đầu tiên</h3>
                  <p>Mỗi khóa học cần ít nhất một Module để chứa bài học, bài tập, quiz và codelab.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="mentor-form-input"
                    placeholder="Tiêu đề module"
                    value={newModuleTitle}
                    onChange={e => setNewModuleTitle(e.target.value)}
                    style={{ maxWidth: 320 }}
                  />
                  <input
                    type="text"
                    className="mentor-form-input"
                    placeholder="Mô tả (tuỳ chọn)"
                    value={newModuleDescription}
                    onChange={e => setNewModuleDescription(e.target.value)}
                    style={{ maxWidth: 400 }}
                  />
                  <button className="mentor-btn-primary" onClick={handleCreateModule} disabled={modulesLoading || !newModuleTitle.trim()}>
                    {modulesLoading ? 'Đang tạo...' : 'Tạo Module'}
                  </button>
                </div>
              </div>
            )}

            {activeContentTab === 'modules' && modules.length > 0 && !selectedModuleId && (
              <div className="mentor-empty-state" style={{ padding: '24px' }}>
                <h3>Chọn một Module để quản lý nội dung</h3>
                <p>Hãy chọn Module ở danh sách bên dưới để thêm bài học, bài tập, quiz hoặc codelab.</p>
              </div>
            )}

            {activeContentTab === 'modules' && (
              <div className="mentor-lessons-section">
                <div className="mentor-lessons-header">
                  <h3 className="mentor-lessons-title">Danh Sách Module</h3>
                  {modules.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="mentor-form-input"
                        placeholder="Tiêu đề module"
                        value={newModuleTitle}
                        onChange={e => setNewModuleTitle(e.target.value)}
                        style={{ maxWidth: 280 }}
                      />
                      <input
                        type="text"
                        className="mentor-form-input"
                        placeholder="Mô tả (tuỳ chọn)"
                        value={newModuleDescription}
                        onChange={e => setNewModuleDescription(e.target.value)}
                        style={{ maxWidth: 360 }}
                      />
                      <button className="mentor-btn-primary" onClick={handleCreateModule} disabled={modulesLoading || !newModuleTitle.trim()}>
                        {modulesLoading ? 'Đang tạo...' : 'Thêm Module'}
                      </button>
                    </div>
                  )}
                </div>

                {modulesLoading ? (
                  <div className="mentor-loading-state"><div className="spinner"></div><p>Đang tải module...</p></div>
                ) : modules.length === 0 ? (
                  <div className="mentor-empty-state">
                    <BookOpen className="w-16 h-16 text-gray-400" />
                    <h3>Chưa có module nào</h3>
                    <p>Tạo module đầu tiên để bắt đầu thêm nội dung cho khóa học.</p>
                  </div>
                ) : (
                  <div className="mentor-lessons-list">
                    {modules.sort((a,b)=> (a.orderIndex||0)-(b.orderIndex||0)).map((m, idx, arr) => (
                      <div key={m.id} className={`mentor-lesson-card ${selectedModuleId === m.id ? 'selected' : ''}`} onClick={() => handleSelectModule(m.id)}>
                        <div className="mentor-lesson-header">
                          <h4 className="mentor-lesson-title">{m.title}</h4>
                          <div className="mentor-lesson-type" style={{ gap: 8 }}>
                            <span>Thứ tự: {m.orderIndex}</span>
                            <button className="mentor-lesson-action-button" disabled={idx===0 || modulesLoading} onClick={(e)=>{ e.stopPropagation(); void handleMoveModule(m.id,'up'); }}>↑</button>
                            <button className="mentor-lesson-action-button" disabled={idx===arr.length-1 || modulesLoading} onClick={(e)=>{ e.stopPropagation(); void handleMoveModule(m.id,'down'); }}>↓</button>
                          </div>
                        </div>
                        <div className="mentor-lesson-meta" style={{ gap: 8 }}>
                          <span style={{ color: '#6b7280' }}>{m.description || 'Không có mô tả'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedModuleId && (
                  <>
                    <div className="mentor-course-content-tabs" style={{ marginTop: 16 }}>
                      <button 
                        className={`mentor-content-tab ${activeModuleTab === 'lessons' ? 'active' : ''}`}
                        onClick={() => setActiveModuleTab('lessons')}
                      >
                        <Play className="w-4 h-4" />
                        Bài Học
                      </button>
                      <button 
                        className={`mentor-content-tab ${activeModuleTab === 'quizzes' ? 'active' : ''}`}
                        onClick={() => setActiveModuleTab('quizzes')}
                      >
                        <HelpCircle className="w-4 h-4" />
                        Quiz
                      </button>
                      <button 
                        className={`mentor-content-tab ${activeModuleTab === 'assignments' ? 'active' : ''}`}
                        onClick={() => setActiveModuleTab('assignments')}
                      >
                        <Edit3 className="w-4 h-4" />
                        Bài Tập
                      </button>
                      <button 
                        className={`mentor-content-tab ${activeModuleTab === 'codelabs' ? 'active' : ''}`}
                        onClick={() => setActiveModuleTab('codelabs')}
                      >
                        <Code className="w-4 h-4" />
                        Code Lab
                      </button>
                    </div>

                    {activeModuleTab === 'lessons' && (
                      <div className="mentor-lessons-section">
                        <div className="mentor-lessons-header">
                          <h3 className="mentor-lessons-title">Bài Học</h3>
                          {selectedModuleId && (
                            <button className="mentor-add-lesson-button" onClick={() => setShowAddLesson(true)}>
                              <Plus className="w-4 h-4" />
                              Thêm Bài Học
                            </button>
                          )}
                        </div>
                        <div className="mentor-lessons-list" onDragOver={(e)=>e.preventDefault()}>
                          {lessonsLoading && <div className="mentor-loading-state"><div className="spinner"></div><p>Đang tải bài học...</p></div>}
                          {courseLessons.map((lesson, idx) => (
                            <div key={lesson.id} className="mentor-lesson-card" draggable onDragStart={(e)=>{ e.dataTransfer.setData('text/plain', String(idx)); }} onDrop={async (e)=>{
                              const from = Number(e.dataTransfer.getData('text/plain'));
                              const to = idx;
                              if (isNaN(from) || from===to || !selectedCourse || !user) return;
                              const arr = [...courseLessons];
                              const [moved] = arr.splice(from,1);
                              arr.splice(to,0,moved);
                              // recompute orderIndex locally for immediate feedback
                              const reindexed = arr.map((l, i) => ({ ...l, orderIndex: i + 1 }));
                              setCourseLessons(reindexed);
                              const newOrder = arr.map(l=>l.id);
                              try { await reorderLessons(selectedCourse.id, newOrder, user.id); } catch(err){ console.error('Reorder failed', err); }
                            }}>
                              <div className="mentor-lesson-header">
                                <h4 className="mentor-lesson-title">{lesson.title}</h4>
                                <div className="mentor-lesson-type">
                                  {getLessonTypeIcon(lesson.type)}
                                  <span>{lesson.type}</span>
                                </div>
                              </div>
                              <div className="mentor-lesson-meta">
                                <span>Thứ tự: {lesson.orderIndex}</span>
                                <span>Thời lượng: {formatDuration(lesson.durationSec)}</span>
                              </div>
                              <div className="mentor-lesson-actions">
                                <button 
                                  className="mentor-lesson-action-button primary"
                                  onClick={() => {
                                    console.log('[EDIT_LESSON] Clicked edit for lesson:', lesson);
                                    console.log('[EDIT_LESSON] contentText:', lesson.contentText);
                                    console.log('[EDIT_LESSON] videoUrl:', lesson.videoUrl);
                                    setEditingLesson(lesson);
                                  }}
                                >
                                  <Edit3 className="w-4 h-4" />
                                  Sửa
                                </button>
                                <button className="mentor-lesson-action-button" onClick={async ()=> {
                                  if (!user) return;
                                  try {
                                    setPreviewLoading(true);
                                    try {
                                      const detail = await getLessonById(lesson.id);
                                      let resolvedVideoUrl = detail.videoUrl as string | undefined;
                                      if (!resolvedVideoUrl && detail.videoMediaId) {
                                        try { 
                                          resolvedVideoUrl = await getSignedMediaUrl(detail.videoMediaId, user.id); 
                                        } catch {
                                          // Ignore error
                                        }
                                      }
                                      const merged: Lesson = {
                                        id: detail.id,
                                        title: detail.title,
                                        type: detail.type,
                                        orderIndex: detail.orderIndex ?? lesson.orderIndex,
                                        durationSec: detail.durationSec ?? lesson.durationSec ?? 0,
                                        contentText: detail.contentText,
                                        videoUrl: resolvedVideoUrl,
                                        videoMediaId: detail.videoMediaId
                                      };
                                      setPreviewLesson(merged);
                                    } catch {
                                      // fallback to media list (prefer signed URL if possible)
                                      try {
                                        const media = await listMediaByLesson(lesson.id);
                                        const video = media.find(m => m.type?.startsWith('video/'));
                                        let fallbackUrl = video?.url;
                                        if (video && user?.id) {
                                          try { 
                                            fallbackUrl = await getSignedMediaUrl(video.id, user.id); 
                                          } catch {
                                            // Ignore error
                                          }
                                        }
                                        setPreviewLesson({ ...lesson, videoUrl: fallbackUrl } as Lesson);
                                      } catch { 
                                        setPreviewLesson(lesson); 
                                      }
                                    }
                                  } finally {
                                    setPreviewLoading(false);
                                  }
                                }}>
                                  <Eye className="w-4 h-4" />
                                  Xem
                                </button>
                                <button 
                                  className="mentor-lesson-action-button danger"
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  disabled={loading}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Xóa
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeModuleTab === 'quizzes' && (
                      <div className="mentor-quiz-section">
                        <div className="mentor-quiz-header">
                          <h3 className="mentor-quiz-title">Quiz</h3>
                          <button className="mentor-add-quiz-button" onClick={() => setShowAddQuiz(true)}>
                            <Plus className="w-4 h-4" />
                            Thêm Quiz
                          </button>
                        </div>
                        <div className="mentor-quiz-list">
                          {quizzesLoading ? (
                            <div className="mentor-loading">Đang tải quiz...</div>
                          ) : moduleQuizzes.length === 0 ? (
                            <div className="mentor-empty-state">
                              <p>Chưa có quiz nào cho module này</p>
                            </div>
                          ) : (
                            moduleQuizzes.map((quiz) => (
                              <div key={quiz.id} className="mentor-quiz-card">
                                <div className="mentor-quiz-header">
                                  <h4 className="mentor-quiz-title">{quiz.title}</h4>
                                  <div className="mentor-quiz-actions">
                                    <button 
                                      className="mentor-action-btn mentor-view-btn"
                                      onClick={() => handleViewQuiz(quiz.id)}
                                      title="View Quiz Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                      className="mentor-action-btn mentor-edit-btn"
                                      onClick={() => handleEditQuiz(quiz as any)}
                                      title="Edit Quiz"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      className="mentor-action-btn mentor-delete-btn"
                                      onClick={() => handleDeleteQuiz(quiz.id)}
                                      title="Delete Quiz"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="mentor-quiz-meta">
                                  <span>Điểm đạt: {quiz.passScore}%</span>
                                  <span>Câu hỏi: {quiz.questionCount}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {activeModuleTab === 'assignments' && (
                      <div className="mentor-assignment-section">
                        <div className="mentor-assignment-header">
                          <h3 className="mentor-assignment-title">Bài Tập</h3>
                          <button className="mentor-add-assignment-button" onClick={() => setShowAddAssignment(true)}>
                            <Plus className="w-4 h-4" />
                            Thêm Bài Tập
                          </button>
                        </div>
                        <div className="mentor-lessons-list">
                          {assignmentsLoading ? (
                            <div className="mentor-loading">
                              <div className="spinner"></div>
                              <p>Đang tải bài tập...</p>
                            </div>
                          ) : moduleAssignments.length === 0 ? (
                            <div className="mentor-empty-state">
                              <PenTool className="w-12 h-12 text-gray-400" />
                              <p>Chưa có bài tập nào</p>
                              <p className="text-sm text-gray-500">Tạo bài tập đầu tiên cho module này</p>
                            </div>
                          ) : (
                            moduleAssignments.map((assignment) => (
                              <div key={assignment.id} className="mentor-lesson-card">
                                <div className="mentor-lesson-header">
                                  <h4 className="mentor-lesson-title">{assignment.title}</h4>
                                  <div className="mentor-lesson-actions">
                                    <div className="mentor-lesson-type">
                                      <PenTool className="w-4 h-4" />
                                      <span>{assignment.submissionType}</span>
                                    </div>
                                    <div className="mentor-lesson-buttons">
                                      <button
                                        className="mentor-btn-icon"
                                        onClick={() => handleEditAssignment(assignment.id)}
                                        title="Edit assignment"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        className="mentor-btn-icon mentor-btn-danger"
                                        onClick={() => handleDeleteAssignment(assignment.id)}
                                        title="Delete assignment"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="mentor-lesson-meta">
                                  <span>Điểm tối đa: {assignment.maxScore}</span>
                                  <span>Hạn nộp: {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'Không có'}</span>
                                </div>
                                {assignment.description && (
                                  <div className="mentor-lesson-description">
                                    <p>{assignment.description}</p>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {activeModuleTab === 'codelabs' && (
                      <div className="mentor-codelab-section">
                        <div className="mentor-codelab-header">
                          <h3 className="mentor-codelab-title">Code Lab</h3>
                          <button className="mentor-add-codelab-button" onClick={() => setShowAddCodelab(true)}>
                            <Plus className="w-4 h-4" />
                            Thêm Code Lab
                          </button>
                        </div>
                        <div className="mentor-lessons-list">
                          {selectedCourse.codingExercises.map((exercise) => (
                            <div key={exercise.id} className="mentor-lesson-card">
                              <div className="mentor-lesson-header">
                                <h4 className="mentor-lesson-title">{exercise.title}</h4>
                                <div className="mentor-lesson-type">
                                  <Code className="w-4 h-4" />
                                  <span>{exercise.language}</span>
                                </div>
                              </div>
                              <div className="mentor-lesson-meta">
                                <span>Điểm tối đa: {exercise.maxScore}</span>
                                <span>Test cases: {exercise.testCases.length}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'courses':
        return renderCoursesTab();
      case 'bookings':
        return (
          <BookingManagerTab
            bookings={bookings}
            onApprove={handleApproveBooking}
            onReject={handleRejectBooking}
            onMarkAsDone={handleMarkAsDone}
          />
        );
      case 'schedule':
        return <MyScheduleTab />;
      case 'earnings':
        return <EarningsTab />;
      case 'skillpoints':
        return <SkillPointsTab />;
      case 'reviews':
        return <ReviewsTab />;
      case 'history':
        return <MentoringHistoryTab />;
      default:
        return (
          <div className="mentor-hud-default-tab">
            <h2 className="mentor-hud-default-title">SYSTEM STANDBY</h2>
            <p className="mentor-hud-default-description">Chọn một tab để xem các hoạt động hướng dẫn của bạn.</p>
          </div>
        );
    }
  };

  return (
    <div className="mentor-hud-dashboard">
      <div className="mentor-hud-dashboard__container">
        <div className="mentor-hud-header">
          <div className="mentor-hud-header__content">
            <div className="mentor-hud-header__status">
              <div className="mentor-hud-header__status-dot"></div>
              <span className="mentor-hud-header__status-text">SYSTEM ONLINE</span>
            </div>
            <h1 className="mentor-hud-header__title">
              MENTOR <span className="mentor-hud-header__title-accent">COMMAND CENTER</span>
            </h1>
            <p className="mentor-hud-header__subtitle">Quản lý hoạt động hướng dẫn và theo dõi tác động của bạn</p>
          </div>
          <div className="mentor-hud-header__corner mentor-hud-header__corner--tl"></div>
          <div className="mentor-hud-header__corner mentor-hud-header__corner--tr"></div>
          <div className="mentor-hud-header__corner mentor-hud-header__corner--bl"></div>
          <div className="mentor-hud-header__corner mentor-hud-header__corner--br"></div>
        </div>

        <div className="mentor-hud-navigation">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`mentor-hud-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent className="mentor-hud-tab__icon" />
                <span className="mentor-hud-tab__label">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mentor-hud-content">
          {renderActiveTab()}
        </div>
      </div>

      {/* Course Creation Modal */}
      {showCreateCourse && (
        <CourseModal
          onClose={() => setShowCreateCourse(false)}
          onSubmit={handleCreateCourse}
          loading={loading}
        />
      )}

      {/* Course Edit Modal */}
      {editingCourse && (
        <CourseModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSubmit={(data) => handleUpdateCourse(editingCourse.id, data as Partial<CourseCreateData>)}
          loading={loading}
        />
      )}

      {/* Course Detail Modal */}
      {showCourseDetail && renderCourseDetailModal()}

      {/* Add Lesson Modal */}
      {showAddLesson && selectedCourse && selectedModuleId && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-content">
            <div className="mentor-modal-header">
              <h2 className="mentor-modal-title">Thêm Bài Học</h2>
              <button className="mentor-modal-close" onClick={()=>setShowAddLesson(false)}><X className="w-6 h-6"/></button>
            </div>
            <form className="mentor-form" onSubmit={async (e)=>{
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
              const type = (form.elements.namedItem('type') as HTMLSelectElement).value as ApiLessonType;
              const duration = Number((form.elements.namedItem('duration') as HTMLInputElement).value || '0');
              const videoUrl = (form.elements.namedItem('videoUrl') as HTMLInputElement | null)?.value?.trim();
              const videoFile = (form.elements.namedItem('videoFile') as HTMLInputElement | null)?.files?.[0] || null;
              const contentText = (form.elements.namedItem('contentText') as HTMLTextAreaElement | null)?.value?.trim();
              if (!title || !user) return;
              try {
                let videoMediaId: number | undefined = undefined;
                let uploadedVideoUrl: string | undefined = undefined;
                if (videoFile && user) {
                  console.log('[LESSON_CREATE] ========== STARTING VIDEO UPLOAD ==========');
                  console.log('[LESSON_CREATE] File:', videoFile.name, 'Size:', videoFile.size, 'bytes');
                  console.log('[LESSON_CREATE] User ID:', user.id);
                  
                  setIsUploadingVideo(true);
                  setVideoUploadProgress(0);
                  console.log('[LESSON_CREATE] State set: isUploadingVideo=true, progress=0');
                  
                  const result = await uploadVideo(
                    videoFile,
                    user.id,
                    (progress) => {
                      console.log('[LESSON_CREATE] ✅ Progress callback called:', progress.percentage, '%');
                      console.log('[LESSON_CREATE] Loaded:', progress.loaded, 'Total:', progress.total);
                      setVideoUploadProgress(progress.percentage);
                      console.log('[LESSON_CREATE] State updated: videoUploadProgress=', progress.percentage);
                    }
                  );
                  
                  videoMediaId = result.mediaId;
                  uploadedVideoUrl = result.url; // ✅ Save Cloudinary URL
                  setIsUploadingVideo(false);
                  console.log('[LESSON_CREATE] ========== UPLOAD COMPLETE ==========');
                  console.log('[LESSON_CREATE] Result:', result);
                  console.log('[LESSON_CREATE] Media ID:', result.mediaId);
                  console.log('[LESSON_CREATE] URL:', result.url);
                }
                
                // ✅ Use uploadedVideoUrl if available, otherwise use manual videoUrl input
                const finalVideoUrl = uploadedVideoUrl || videoUrl;
                
                const lessonPayload: LessonCreateDTO = { 
                  title, 
                  type, 
                  orderIndex: courseLessons.length+1, 
                  durationSec: duration,
                  ...(type === 'VIDEO' && finalVideoUrl ? { videoUrl: finalVideoUrl } : {}),
                  ...(type === 'VIDEO' && videoMediaId ? { videoMediaId } : {}),
                  ...(type === 'READING' && contentText ? { contentText } : {})
                };
                
                if (!selectedModuleId) {
                  console.error('No module selected for lesson creation');
                  return;
                }
                
                console.log('Creating lesson with payload:', lessonPayload);
                const created = await createLesson(selectedModuleId, lessonPayload, user.id);
                console.log('Lesson created successfully:', created.id);
                
                setShowAddLesson(false);
                await loadLessons(selectedCourse.id, selectedModuleId || undefined);
                await loadCourses(); // ✅ Reload courses to update lesson count
              } catch (err) { 
                console.error('Create lesson failed', err);
                setError('Failed to create lesson: ' + (err as any).message);
              }
            }}>
              <div className="mentor-form-group">
                <label className="mentor-form-label" htmlFor="lessonTitle">Tiêu đề</label>
                <input id="lessonTitle" name="title" className="mentor-form-input" placeholder="Bài học..." />
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label" htmlFor="lessonType">Loại</label>
                <select 
                  id="lessonType" 
                  name="type" 
                  className="mentor-form-select"
                  value={selectedLessonType}
                  onChange={(e) => {
                    const newType = e.target.value as ApiLessonType;
                    setSelectedLessonType(newType);
                    console.log('[LESSON_MODAL] Type changed to:', newType);
                  }}
                >
                  <option value="VIDEO">Video</option>
                  <option value="READING">Reading</option>
                </select>
              </div>
              
              {/* ✅ CONDITIONAL: Chỉ hiển thị khi chọn READING */}
              {selectedLessonType === 'READING' && (
                <div className="mentor-form-group">
                  <label className="mentor-form-label" htmlFor="readingContent">Nội dung <span style={{color: '#ef4444'}}>*</span></label>
                  <textarea id="readingContent" name="contentText" className="mentor-form-textarea" rows={4} placeholder="Nhập nội dung bài đọc..."></textarea>
                </div>
              )}
              
              {/* ✅ CONDITIONAL: Chỉ hiển thị khi chọn VIDEO */}
              {selectedLessonType === 'VIDEO' && (
                <>
                  <div className="mentor-form-group">
                    <label className="mentor-form-label" htmlFor="videoUrl">Link video (YouTube, Vimeo, etc.)</label>
                    <input id="videoUrl" name="videoUrl" className="mentor-form-input" placeholder="https://youtube.com/watch?v=..." />
                    <p className="mentor-form-hint">Hoặc upload file video bên dưới</p>
                  </div>
                  <div className="mentor-form-group">
                    <label className="mentor-form-label" htmlFor="videoFile">Tải video từ máy (tùy chọn)</label>
                    <input id="videoFile" name="videoFile" type="file" accept="video/*" className="mentor-form-input" />
                    <p className="mentor-form-hint">
                      📹 Tối đa 300MB • MP4, WebM, MOV, AVI • Progress bar sẽ hiển thị khi upload
                    </p>
                  </div>
                </>
              )}
              {isUploadingVideo && (
                <div className="mentor-form-group">
                  <HoloProgressBar
                    value={videoUploadProgress}
                    label="Đang upload video..."
                    color="cyan"
                    height="md"
                    showPercentage={true}
                    animated={false}
                  />
                  <p style={{textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem'}}>
                    ⏳ Vui lòng không đóng cửa sổ này
                  </p>
                </div>
              )}
              <div className="mentor-form-group">
                <label className="mentor-form-label" htmlFor="duration">Thời lượng (giây)</label>
                <input id="duration" name="duration" type="number" min={0} className="mentor-form-input" />
              </div>
              <div className="mentor-modal-actions">
                <button type="button" className="mentor-btn-secondary" onClick={()=>setShowAddLesson(false)}>Hủy</button>
                <button type="submit" className="mentor-btn-primary" disabled={isUploadingVideo}>
                  {isUploadingVideo ? 'Đang upload...' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editingLesson && selectedCourse && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-content">
            <div className="mentor-modal-header">
              <h2 className="mentor-modal-title">Chỉnh Sửa Bài Học</h2>
              <button className="mentor-modal-close" onClick={()=>setEditingLesson(null)}><X className="w-6 h-6"/></button>
            </div>
            <form className="mentor-form" onSubmit={async (e)=>{
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
              const duration = Number((form.elements.namedItem('duration') as HTMLInputElement).value || '0');
              const videoUrl = (form.elements.namedItem('videoUrl') as HTMLInputElement | null)?.value?.trim();
              const contentText = (form.elements.namedItem('contentText') as HTMLTextAreaElement | null)?.value?.trim();
              const videoFile = (form.elements.namedItem('editVideoFile') as HTMLInputElement | null)?.files?.[0] || null;
              if (!title || !user) return;
              try {
                const { updateLesson } = await import('../../services/lessonService');
                const updatePayload = {
                  title,
                  orderIndex: editingLesson.orderIndex,
                  durationSec: duration,
                  ...(editingLesson.type === 'VIDEO' && videoUrl ? { videoUrl } : {}),
                  ...(editingLesson.type === 'READING' && contentText ? { contentText } : {})
                };
                await updateLesson(editingLesson.id, updatePayload, user.id);
                // If a new video file is provided, upload and attach to this lesson
                if (editingLesson.type === 'VIDEO' && videoFile) {
                  try {
                    const { uploadMedia, attachMediaToLesson } = await import('../../services/mediaService');
                    const media = await uploadMedia(videoFile, user.id);
                    await attachMediaToLesson(media.id, editingLesson.id, user.id);
                  } catch(err) {
                    console.error('Video upload/attach failed', err);
                  }
                }
                setEditingLesson(null);
                await loadLessons(selectedCourse.id, selectedModuleId || undefined);
                alert('Bài học đã được cập nhật thành công!');
              } catch (err) { 
                console.error('Update lesson failed', err); 
                alert('Không thể cập nhật bài học');
              }
            }}>
              <div className="mentor-form-group">
                <label className="mentor-form-label" htmlFor="editLessonTitle">Tiêu đề</label>
                <input 
                  id="editLessonTitle" 
                  name="title" 
                  className="mentor-form-input" 
                  placeholder="Bài học..." 
                  defaultValue={editingLesson.title}
                />
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Loại</label>
                <input 
                  className="mentor-form-input" 
                  value={editingLesson.type} 
                  disabled 
                  style={{ opacity: 0.6 }}
                />
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Không thể thay đổi loại bài học khi chỉnh sửa
                </p>
              </div>
              {editingLesson.type === 'READING' && (
                <>
                  <div className="mentor-form-group">
                    <label className="mentor-form-label" htmlFor="editReadingContent">Nội dung</label>
                    <textarea 
                      id="editReadingContent" 
                      name="contentText" 
                      className="mentor-form-textarea" 
                      rows={6} 
                      placeholder="Nhập nội dung bài đọc..."
                      defaultValue={editingLesson.contentText || ''}
                    ></textarea>
                  </div>
                  
                  {/* ✅ NEW: Attachments for READING lessons */}
                  <AttachmentManager
                    lessonId={editingLesson.id}
                    editable={true}
                  />
                </>
              )}
              {editingLesson.type === 'VIDEO' && (
                <div className="mentor-form-group">
                  <label className="mentor-form-label" htmlFor="editVideoUrl">Link video</label>
                  <input 
                    id="editVideoUrl" 
                    name="videoUrl" 
                    className="mentor-form-input" 
                    placeholder="https://..." 
                    defaultValue={editingLesson.videoUrl || ''}
                  />
                  <p className="mentor-form-hint">Link chỉ là tham chiếu. Bạn có thể tải video lên để lưu trữ an toàn.</p>
                </div>
              )}
              {editingLesson.type === 'VIDEO' && (
                <div className="mentor-form-group">
                  <label className="mentor-form-label" htmlFor="editVideoFile">Tải video từ máy (tùy chọn)</label>
                  <input id="editVideoFile" name="editVideoFile" type="file" accept="video/*" className="mentor-form-input" />
                  {/* Simple preview using current data if available */}
                  {(editingLesson.videoUrl) && (
                    <div style={{ marginTop: 8 }}>
                      <video controls style={{ width: '100%', maxHeight: 240, borderRadius: 8 }} src={editingLesson.videoUrl} />
                    </div>
                  )}
                </div>
              )}
              <div className="mentor-form-group">
                <label className="mentor-form-label" htmlFor="editDuration">Thời lượng (giây)</label>
                <input 
                  id="editDuration" 
                  name="duration" 
                  type="number" 
                  min={0} 
                  className="mentor-form-input" 
                  defaultValue={editingLesson.durationSec}
                />
              </div>
              <div className="mentor-modal-actions">
                <button type="button" className="mentor-btn-secondary" onClick={()=>setEditingLesson(null)}>Hủy</button>
                <button type="submit" className="mentor-btn-primary">Cập Nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Quiz Modal */}
      {showAddQuiz && selectedCourse && selectedModuleId && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-content">
            <div className="mentor-modal-header">
              <h2 className="mentor-modal-title">Thêm Quiz</h2>
              <button className="mentor-modal-close" onClick={()=>setShowAddQuiz(false)}><X className="w-6 h-6"/></button>
            </div>
            <form className="mentor-form" onSubmit={async (e)=>{
              e.preventDefault();
              if (!user || !selectedModuleId) return;
              const form = e.target as HTMLFormElement;
              const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
              const passScore = Number((form.elements.namedItem('pass') as HTMLInputElement).value || '50');
              if (!title) return;
              try {
                // Create quiz for the selected module
                const quizPayload: QuizCreateDTO = { 
                  title, 
                  description: '', 
                  passScore
                };
                console.log('Creating quiz for module:', selectedModuleId, 'with payload:', quizPayload);
                const createdQuiz = await createQuiz(selectedModuleId, quizPayload, user.id);
                console.log('Quiz created successfully:', createdQuiz.id);
                setShowAddQuiz(false);
                await loadLessons(selectedCourse.id, selectedModuleId || undefined);
                await loadQuizzes(selectedModuleId);
              } catch(err){ 
                console.error('Create quiz failed', err);
                setError('Failed to create quiz: ' + (err as any).message);
              }
            }}>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Tiêu đề</label>
                <input name="title" className="mentor-form-input" />
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Điểm đạt (%)</label>
                <input name="pass" type="number" min={0} max={100} className="mentor-form-input" defaultValue={60} />
              </div>
              <div className="mentor-modal-actions">
                <button type="button" className="mentor-btn-secondary" onClick={()=>setShowAddQuiz(false)}>Hủy</button>
                <button type="submit" className="mentor-btn-primary">Tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Detail Modal */}
      {showQuizDetail && selectedQuiz && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-content mentor-quiz-detail-modal">
            <div className="mentor-modal-header">
              <h2 className="mentor-modal-title">Quiz Details: {selectedQuiz.title}</h2>
              <button className="mentor-modal-close" onClick={() => {
                setShowQuizDetail(false);
                setSelectedQuiz(null);
              }}>
                <X className="w-6 h-6"/>
              </button>
            </div>
            
            {quizDetailLoading ? (
              <div className="mentor-loading">Loading quiz details...</div>
            ) : (
              <div className="mentor-quiz-detail-content">
                <div className="mentor-quiz-info">
                  <p><strong>Description:</strong> {selectedQuiz.description || 'No description'}</p>
                  <p><strong>Pass Score:</strong> {selectedQuiz.passScore}%</p>
                  <p><strong>Questions:</strong> {selectedQuiz.questions.length}</p>
                </div>
                
                <div className="mentor-quiz-questions">
                  <div className="mentor-quiz-questions-header">
                    <h3>Questions</h3>
                    <button 
                      className="mentor-btn-primary"
                      onClick={() => setShowAddQuestion(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>
                  
                  {selectedQuiz.questions.length === 0 ? (
                    <div className="mentor-empty-state">
                      <p>No questions added yet</p>
                    </div>
                  ) : (
                    <div className="mentor-questions-list">
                      {selectedQuiz.questions.map((question, index) => (
                        <div key={question.id} className="mentor-question-card">
                          <div className="mentor-question-header">
                            <h4>Question {index + 1}</h4>
                            <div className="mentor-question-actions">
                              <button 
                                className="mentor-action-btn mentor-edit-btn"
                                onClick={() => setEditingQuestion(question)}
                                title="Edit Question"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                className="mentor-action-btn mentor-delete-btn"
                                onClick={() => handleDeleteQuestion(question.id)}
                                title="Delete Question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mentor-question-content">
                            <p><strong>Text:</strong> {question.questionText}</p>
                            <p><strong>Type:</strong> {question.questionType}</p>
                            <p><strong>Score:</strong> {question.score}</p>
                          </div>
                          
                          <div className="mentor-question-options">
                            <div className="mentor-options-header">
                              <h5>Options</h5>
                              <button 
                                className="mentor-btn-secondary"
                                onClick={() => setShowAddOption(true)}
                              >
                                <Plus className="w-4 h-4" />
                                Add Option
                              </button>
                            </div>
                            
                            {question.options.length === 0 ? (
                              <div className="mentor-empty-state">
                                <p>No options added yet</p>
                              </div>
                            ) : (
                              <div className="mentor-options-list">
                                {question.options.map((option, optIndex) => (
                                  <div key={option.id} className={`mentor-option-item ${option.correct ? 'correct' : ''}`}>
                                    <span>{optIndex + 1}. {option.optionText}</span>
                                    {option.correct && <span className="correct-badge">✓ Correct</span>}
                                    <div className="mentor-option-actions">
                                      <button 
                                        className="mentor-action-btn mentor-edit-btn"
                                        onClick={() => setEditingOption(option)}
                                        title="Edit Option"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                      <button 
                                        className="mentor-action-btn mentor-delete-btn"
                                        onClick={() => handleDeleteOption(option.id)}
                                        title="Delete Option"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && selectedQuiz && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-content">
            <div className="mentor-modal-header">
              <h2 className="mentor-modal-title">Add Question</h2>
              <button className="mentor-modal-close" onClick={() => setShowAddQuestion(false)}>
                <X className="w-6 h-6"/>
              </button>
            </div>
            <form className="mentor-form" onSubmit={async (e) => {
              e.preventDefault();
              if (!user || !selectedQuiz) return;
              const form = e.target as HTMLFormElement;
              const questionText = (form.elements.namedItem('questionText') as HTMLInputElement).value.trim();
              const questionType = (form.elements.namedItem('questionType') as HTMLSelectElement).value as QuestionType;
              const score = Number((form.elements.namedItem('score') as HTMLInputElement).value || '1');
              
              if (!questionText) return;
              
              try {
                const questionData: QuizQuestionCreateDTO = {
                  questionText,
                  questionType,
                  score,
                  orderIndex: selectedQuiz.questions.length + 1,
                  options: []
                };
                
                await handleAddQuestion(selectedQuiz.id, questionData);
              } catch (err) {
                console.error('Add question failed', err);
                setError('Failed to add question: ' + (err as any).message);
              }
            }}>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Question Text</label>
                <textarea name="questionText" className="mentor-form-input" rows={3} required />
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Question Type</label>
                <select name="questionType" className="mentor-form-input" defaultValue={QuestionType.MULTIPLE_CHOICE}>
                  <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                  <option value={QuestionType.TRUE_FALSE}>True/False</option>
                  <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
                </select>
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Score</label>
                <input name="score" type="number" min="1" className="mentor-form-input" defaultValue={1} />
              </div>
              <div className="mentor-modal-actions">
                <button type="button" className="mentor-btn-secondary" onClick={() => setShowAddQuestion(false)}>
                  Cancel
                </button>
                <button type="submit" className="mentor-btn-primary">Add Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Option Modal */}
      {showAddOption && selectedQuiz && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-content">
            <div className="mentor-modal-header">
              <h2 className="mentor-modal-title">Add Option</h2>
              <button className="mentor-modal-close" onClick={() => setShowAddOption(false)}>
                <X className="w-6 h-6"/>
              </button>
            </div>
            <form className="mentor-form" onSubmit={async (e) => {
              e.preventDefault();
              if (!user || !selectedQuiz) return;
              const form = e.target as HTMLFormElement;
              const optionText = (form.elements.namedItem('optionText') as HTMLInputElement).value.trim();
              const correct = (form.elements.namedItem('correct') as HTMLInputElement).checked;
              const questionId = Number((form.elements.namedItem('questionId') as HTMLSelectElement).value);
              
              if (!optionText || !questionId) return;
              
              try {
                const optionData: QuizOptionCreateDTO = {
                  optionText,
                  correct
                };
                
                await handleAddOption(questionId, optionData);
              } catch (err) {
                console.error('Add option failed', err);
                setError('Failed to add option: ' + (err as any).message);
              }
            }}>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Question</label>
                <select name="questionId" className="mentor-form-input" required>
                  <option value="">Select a question</option>
                  {selectedQuiz.questions.map(question => (
                    <option key={question.id} value={question.id}>
                      {question.questionText.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Option Text</label>
                <input name="optionText" className="mentor-form-input" required />
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-checkbox">
                  <input name="correct" type="checkbox" />
                  <span>This is the correct answer</span>
                </label>
              </div>
              <div className="mentor-modal-actions">
                <button type="button" className="mentor-btn-secondary" onClick={() => setShowAddOption(false)}>
                  Cancel
                </button>
                <button type="submit" className="mentor-btn-primary">Add Option</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {_editingQuestion && selectedQuiz && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-content">
            <div className="mentor-modal-header">
              <h2 className="mentor-modal-title">Edit Question</h2>
              <button className="mentor-modal-close" onClick={() => setEditingQuestion(null)}>
                <X className="w-6 h-6"/>
              </button>
            </div>
            <form className="mentor-form" onSubmit={async (e) => {
              e.preventDefault();
              if (!user || !_editingQuestion) return;
              const form = e.target as HTMLFormElement;
              const questionText = (form.elements.namedItem('questionText') as HTMLTextAreaElement).value.trim();
              const questionType = (form.elements.namedItem('questionType') as HTMLSelectElement).value as QuestionType;
              const score = Number((form.elements.namedItem('score') as HTMLInputElement).value || '1');
              if (!questionText) return;
              try {
                await updateQuizQuestion(_editingQuestion.id, {
                  questionText,
                  questionType,
                  score,
                  orderIndex: _editingQuestion.orderIndex
                }, user.id);
                // Update UI
                setSelectedQuiz(prev => {
                  if (!prev) return prev;
                  const clone: any = { ...prev, questions: prev.questions.map(q => ({ ...q })) };
                  const idx = clone.questions.findIndex((q: any) => q.id === _editingQuestion.id);
                  if (idx >= 0) {
                    clone.questions[idx].questionText = questionText;
                    clone.questions[idx].questionType = questionType as any;
                    clone.questions[idx].score = score;
                  }
                  return clone;
                });
                setEditingQuestion(null);
              } catch (err) {
                console.error('Update question failed', err);
                setError('Failed to update question: ' + (err as any).message);
              }
            }}>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Question Text</label>
                <textarea name="questionText" className="mentor-form-input" rows={3} defaultValue={_editingQuestion.questionText} required />
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Question Type</label>
                <select name="questionType" className="mentor-form-input" defaultValue={_editingQuestion.questionType}
                  onChange={(e)=>{
                    // Nếu câu hỏi đã có option, chặn đổi kiểu (để tránh 500 BE)
                    const hasOptions = (_editingQuestion.options||[]).length>0;
                    if (hasOptions) {
                      e.preventDefault();
                      (e.target as HTMLSelectElement).value = _editingQuestion.questionType as any;
                      alert('Không thể đổi loại câu hỏi khi đã có lựa chọn. Hãy xóa lựa chọn trước.');
                    }
                  }}
                >
                  <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                  <option value={QuestionType.TRUE_FALSE}>True/False</option>
                  <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
                </select>
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Score</label>
                <input name="score" type="number" min={1} className="mentor-form-input" defaultValue={_editingQuestion.score} />
              </div>
              <div className="mentor-modal-actions">
                <button type="button" className="mentor-btn-secondary" onClick={() => setEditingQuestion(null)}>Cancel</button>
                <button type="submit" className="mentor-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Option Modal */}
      {_editingOption && selectedQuiz && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-content">
            <div className="mentor-modal-header">
              <h2 className="mentor-modal-title">Edit Option</h2>
              <button className="mentor-modal-close" onClick={() => setEditingOption(null)}>
                <X className="w-6 h-6"/>
              </button>
            </div>
            <form className="mentor-form" onSubmit={async (e) => {
              e.preventDefault();
              if (!user || !selectedQuiz || !_editingOption) return;
              const form = e.target as HTMLFormElement;
              const optionText = (form.elements.namedItem('optionText') as HTMLInputElement).value.trim();
              const correct = (form.elements.namedItem('correct') as HTMLInputElement).checked;
              if (!optionText) return;
              try {
                await updateQuizOption(_editingOption.id, { optionText, correct }, user.id);
                // Update UI state locally
                setSelectedQuiz(prev => {
                  if (!prev) return prev;
                  const clone: any = { ...prev, questions: prev.questions.map(q => ({ ...q, options: q.options.map(o => ({ ...o })) })) };
                  for (const q of clone.questions) {
                    const idx = q.options.findIndex((o: any) => o.id === _editingOption.id);
                    if (idx >= 0) {
                      q.options[idx].optionText = optionText;
                      q.options[idx].correct = correct;
                      break;
                    }
                  }
                  return clone;
                });
                setEditingOption(null);
              } catch (err) {
                console.error('Update option failed', err);
                setError('Failed to update option: ' + (err as any).message);
              }
            }}>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Option Text</label>
                <input name="optionText" className="mentor-form-input" defaultValue={_editingOption.optionText} />
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-checkbox">
                  <input name="correct" type="checkbox" defaultChecked={_editingOption.correct} />
                  <span>This is the correct answer</span>
                </label>
              </div>
              <div className="mentor-modal-actions">
                <button type="button" className="mentor-btn-secondary" onClick={() => setEditingOption(null)}>Cancel</button>
                <button type="submit" className="mentor-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAddAssignment}
        onClose={() => {
          setShowAddAssignment(false);
          setEditingAssignment(null);
        }}
        moduleId={selectedModuleId || 0}
        assignmentToEdit={editingAssignment || undefined}
        onSuccess={handleAssignmentSuccess}
      />

      {/* Add Codelab Modal */}
      {showAddCodelab && selectedCourse && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-content">
            <div className="mentor-modal-header">
              <h2 className="mentor-modal-title">Thêm CodeLab</h2>
              <button className="mentor-modal-close" onClick={()=>setShowAddCodelab(false)}><X className="w-6 h-6"/></button>
            </div>
            <form className="mentor-form" onSubmit={async (e)=>{
              e.preventDefault(); if (!user) return;
              const form = e.target as HTMLFormElement;
              const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
              const langInput = (form.elements.namedItem('lang') as HTMLInputElement).value.trim().toUpperCase();
              const language = (Object.values(ProgrammingLanguage) as string[]).includes(langInput) 
                ? (langInput as ProgrammingLanguage) 
                : ProgrammingLanguage.JAVASCRIPT;
              const description = (form.elements.namedItem('prompt') as HTMLTextAreaElement).value.trim();
              const moduleId = Number((form.elements.namedItem('moduleId') as HTMLSelectElement).value);
              if (!title || !description || !moduleId) return;
              try {
                const exerciseData: CodingExerciseCreateDTO = { 
                  title, 
                  description, 
                  difficulty: 'EASY', 
                  language, 
                  starterCode: '', 
                  moduleId, 
                  testCases: [] 
                };
                await createCodingExercise(moduleId, exerciseData, user.id);
                setShowAddCodelab(false);
              } catch(err){ console.error('Create codelab failed', err); }
            }}>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Tiêu đề</label>
                <input name="title" className="mentor-form-input" />
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Ngôn ngữ</label>
                <input name="lang" className="mentor-form-input" defaultValue="JavaScript" />
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Điểm tối đa</label>
                <input name="max" type="number" min={1} className="mentor-form-input" defaultValue={100} />
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Mô tả bài</label>
                <textarea name="prompt" className="mentor-form-textarea" rows={4}></textarea>
              </div>
              <div className="mentor-form-group">
                <label className="mentor-form-label">Module</label>
                <select name="moduleId" className="mentor-form-select">
                  {modules.map(m=> (<option key={m.id} value={m.id}>{m.title}</option>))}
                </select>
              </div>
              <div className="mentor-modal-actions">
                <button type="button" className="mentor-btn-secondary" onClick={()=>setShowAddCodelab(false)}>Hủy</button>
                <button type="submit" className="mentor-btn-primary">Tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewLesson && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-content" style={{ maxWidth: '800px', width: '90vw' }}>
            <div className="mentor-modal-header">
              <h2 className="mentor-modal-title">Chi tiết bài học</h2>
              <button className="mentor-modal-close" onClick={()=>setPreviewLesson(null)}><X className="w-6 h-6"/></button>
            </div>
            <div className="mentor-form" style={{ paddingTop: 12 }}>
              <div style={{ marginBottom: 16 }}>
                <h3 className="mentor-lesson-title" style={{ marginBottom: 8, fontSize: '1.5rem', fontWeight: '600' }}>{previewLesson.title}</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {getLessonTypeIcon(previewLesson.type)}
                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{previewLesson.type}</span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Thứ tự: {previewLesson.orderIndex}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Thời lượng: {formatDuration(previewLesson.durationSec)}
                  </div>
                </div>
              </div>
              {previewLoading ? (
                <div className="mentor-loading-state"><div className="spinner"></div><p>Đang tải nội dung...</p></div>
              ) : (
                <>
                  {previewLesson.type === 'READING' && (
                    <div style={{ 
                      backgroundColor: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      minHeight: '200px' 
                    }}>
                      <h4 style={{ marginBottom: '12px', color: '#374151', fontSize: '1.1rem' }}>Nội dung bài đọc:</h4>
                      <p style={{ 
                        whiteSpace: 'pre-wrap', 
                        color: '#374151', 
                        lineHeight: '1.6',
                        fontSize: '0.95rem'
                      }}>
                        {previewLesson.contentText || 'Không có nội dung'}
                      </p>
                    </div>
                  )}
                  {previewLesson.type === 'VIDEO' && (
                    <div style={{
                      backgroundColor: '#000',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative',
                      minHeight: '300px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {previewLesson.videoUrl ? (
                        <video 
                          style={{ 
                            width: '100%', 
                            height: 'auto',
                            maxHeight: '500px',
                            borderRadius: '12px'
                          }} 
                          controls 
                          src={previewLesson.videoUrl}
                          onError={(e) => {
                            console.error('Video failed to load:', e);
                            const video = e.target as HTMLVideoElement;
                            video.style.display = 'none';
                            const errorDiv = document.createElement('div');
                            errorDiv.innerHTML = '<p style="color: white; text-align: center;">Không thể tải video. Vui lòng kiểm tra lại đường dẫn.</p>';
                            video.parentNode?.appendChild(errorDiv);
                          }}
                        />
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          color: '#9ca3af',
                          padding: '40px'
                        }}>
                          <Play className="w-16 h-16" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                          <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Không có video để hiển thị</p>
                          <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            Video có thể chưa được tải lên hoặc đường dẫn không hợp lệ
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Isolated */}
      {showDeleteConfirm && deleteTarget && (
        <div className="hud-confirm-delete-overlay">
          <div className="hud-confirm-delete-content">
            <div className="hud-confirm-delete-header">
              <div className="hud-confirm-delete-icon">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="hud-confirm-delete-title-section">
                <h2 className="hud-confirm-delete-title">Xác Nhận Xóa</h2>
                <p className="hud-confirm-delete-subtitle">
                  Thao tác này không thể hoàn tác
                </p>
              </div>
            </div>

            <div className="hud-confirm-delete-body">
              <p className="hud-confirm-delete-message">
                Bạn có chắc chắn muốn xóa{' '}
                {deleteTarget.type === 'course' && 'khóa học'}
                {deleteTarget.type === 'lesson' && 'bài học'}
                {deleteTarget.type === 'quiz' && 'quiz'}
                {deleteTarget.type === 'question' && 'câu hỏi'}
                {deleteTarget.type === 'option' && 'lựa chọn'}
                {deleteTarget.type === 'assignment' && 'bài tập'}
                {' '}này không?
              </p>

              <div className="hud-confirm-delete-item">
                <p className="hud-confirm-delete-item-name">{deleteTarget.name}</p>
              </div>

              <div className="hud-confirm-delete-warning">
                <AlertTriangle className="w-5 h-5 hud-confirm-delete-warning-icon" />
                <p className="hud-confirm-delete-warning-text">
                  Cảnh báo: Dữ liệu sau khi xóa sẽ không thể khôi phục. Hãy chắc chắn bạn muốn thực hiện thao tác này.
                </p>
              </div>

              <div className="hud-confirm-delete-actions">
                <button
                  className="hud-confirm-delete-btn hud-confirm-delete-btn-cancel"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  disabled={isDeleting}
                >
                  Hủy
                </button>
                <button
                  className="hud-confirm-delete-btn hud-confirm-delete-btn-confirm"
                  onClick={() => deleteTarget.onConfirm()}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Unified Course Modal Component
const CourseModal: React.FC<{
  course?: Course | null;
  onClose: () => void;
  onSubmit: (data: CourseCreateData | Partial<CourseCreateData>, thumbnailFile?: File) => void | Promise<void>;
  loading: boolean;
}> = ({ course, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState<CourseCreateData>({
    title: course?.title || '',
    description: course?.description || '',
    level: course?.level || 'Beginner'
  });
  const [price, setPrice] = useState<number | ''>(course?.price ?? '');
  const [currency, setCurrency] = useState<string>(course?.currency || 'VND');

  const [thumbPreview, setThumbPreview] = useState<string | undefined>(course?.thumbnail?.url);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      console.log('Selecting thumbnail file:', file.name);
      setThumbPreview(URL.createObjectURL(file));
      setSelectedThumbnailFile(file);
      return file;
    } catch (e) {
      console.error('Thumbnail selection failed', e);
      return file;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      const submitData = { ...formData, ...(price !== '' ? { price: Number(price), currency: currency || 'VND' } : { currency }) };
      console.log('Submitting course data:', submitData);
      onSubmit(submitData, selectedThumbnailFile || undefined);
    }
  };

  const isEditMode = !!course;
  
  let buttonText: string;
  if (loading) {
    buttonText = isEditMode ? 'Đang cập nhật...' : 'Đang tạo...';
  } else {
    buttonText = isEditMode ? 'Cập Nhật' : 'Tạo Khóa Học';
  }

  return (
    <div className="mentor-modal-overlay">
      <div className="mentor-modal-content">
        <div className="mentor-modal-header">
          <h2 className="mentor-modal-title">{isEditMode ? 'Chỉnh Sửa Khóa Học' : 'Tạo Khóa Học Mới'}</h2>
          <button className="mentor-modal-close" onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="mentor-form">
          <div className="mentor-form-group">
            <label className="mentor-form-label" htmlFor="price">Giá (VND mặc định)</label>
            <input id="price" className="mentor-form-input" type="number" min={0} value={price} onChange={(e)=> setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="vd. 199000" />
          </div>
          <div className="mentor-form-group">
            <label className="mentor-form-label" htmlFor="currency">Tiền tệ</label>
            <select id="currency" className="mentor-form-select" value={currency} onChange={(e)=> setCurrency(e.target.value)}>
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="mentor-form-group">
            <label htmlFor="title" className="mentor-form-label">Tiêu đề khóa học *</label>
            <input
              type="text"
              id="title"
              className="mentor-form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nhập tiêu đề khóa học"
              required
            />
          </div>

          <div className="mentor-form-group">
            <label htmlFor="description" className="mentor-form-label">Mô tả</label>
            <textarea
              id="description"
              className="mentor-form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả về khóa học"
              rows={4}
            />
          </div>

          <div className="mentor-form-group">
            <label htmlFor="level" className="mentor-form-label">Cấp độ</label>
            <select
              id="level"
              className="mentor-form-select"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            >
              <option value="Beginner">Cơ bản</option>
              <option value="Intermediate">Trung bình</option>
              <option value="Advanced">Nâng cao</option>
            </select>
          </div>

          <div className="mentor-form-group">
            <label htmlFor="thumbnail" className="mentor-form-label">Ảnh bìa</label>
            <input
              type="file"
              id="thumbnail"
              className="mentor-form-input"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
            />
            {thumbPreview && (
              <div style={{ marginTop: 8 }}>
                <img src={thumbPreview} alt="thumbnail" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }} />
              </div>
            )}
          </div>

          <div className="mentor-modal-actions">
            <button type="button" className="mentor-btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="mentor-btn-primary" disabled={loading}>
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorPage;
