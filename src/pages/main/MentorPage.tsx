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
  X
} from 'lucide-react';
import BookingManagerTab from '../../components/mentor/BookingManagerTab';
import MyScheduleTab from '../../components/mentor/MyScheduleTab';
import EarningsTab from '../../components/mentor/EarningsTab';
import SkillPointsTab from '../../components/mentor/SkillPointsTab';
import ReviewsTab from '../../components/mentor/ReviewsTab';
import MentoringHistoryTab from '../../components/mentor/MentoringHistoryTab';
import '../../styles/MentorPage.css';

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
  level: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLIC' | 'ARCHIVED';
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
  isCorrect: boolean;
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

export interface CourseCreateData {
  title: string;
  description: string;
  level: string;
  thumbnailMediaId?: number;
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
  const [activeTab, setActiveTab] = useState<string>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<string>('lessons');

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

  // Mock courses data
  useEffect(() => {
    const mockCourses: Course[] = [
      {
        id: 1,
        title: 'React Fundamentals',
        description: 'Learn the basics of React development',
        level: 'Beginner',
        status: 'PUBLIC',
        author: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        thumbnail: {
          id: 1,
          url: '/api/media/1',
          fileName: 'react-course.jpg'
        },
        lessons: [
          { id: 1, title: 'Introduction to React', type: 'VIDEO', orderIndex: 1, durationSec: 1200 },
          { id: 2, title: 'Components and Props', type: 'VIDEO', orderIndex: 2, durationSec: 1800 },
          { id: 3, title: 'State and Lifecycle', type: 'VIDEO', orderIndex: 3, durationSec: 2100 }
        ],
        quizzes: [
          { id: 1, title: 'React Basics Quiz', description: 'Test your React knowledge', passScore: 70, questions: [], lessonId: 1 }
        ],
        assignments: [
          { id: 1, title: 'Build a Todo App', description: 'Create a simple todo application', submissionType: 'FILE', maxScore: 100, lessonId: 2 }
        ],
        codingExercises: [
          { id: 1, title: 'React Component Exercise', prompt: 'Create a reusable button component', language: 'JavaScript', starterCode: '// Your code here', maxScore: 50, testCases: [], lessonId: 3 }
        ],
        enrollmentCount: 45,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z'
      },
      {
        id: 2,
        title: 'Advanced TypeScript',
        description: 'Master TypeScript for enterprise applications',
        level: 'Advanced',
        status: 'PENDING',
        author: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        lessons: [
          { id: 4, title: 'Advanced Types', type: 'VIDEO', orderIndex: 1, durationSec: 2400 },
          { id: 5, title: 'Generics Deep Dive', type: 'VIDEO', orderIndex: 2, durationSec: 3000 }
        ],
        quizzes: [],
        assignments: [],
        codingExercises: [],
        enrollmentCount: 0,
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-20T00:00:00Z'
      }
    ];
    setCourses(mockCourses);
  }, []);

  const handleApproveBooking = (bookingId: string) => {
    console.log('Approving booking:', bookingId);
  };

  const handleRejectBooking = (bookingId: string) => {
    console.log('Rejecting booking:', bookingId);
  };

  const handleMarkAsDone = (bookingId: string) => {
    console.log('Marking booking as done:', bookingId);
  };

  const handleCreateCourse = async (courseData: CourseCreateData | Partial<CourseCreateData>) => {
    setLoading(true);
    try {
      console.log('Creating course:', courseData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Type guard to ensure required fields are present
      if (!courseData.title) {
        throw new Error('Title is required');
      }
      
      const newCourse: Course = {
        id: Date.now(),
        title: courseData.title,
        description: courseData.description || '',
        level: courseData.level || 'Beginner',
        status: 'DRAFT',
        author: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        thumbnail: courseData.thumbnailMediaId ? {
          id: courseData.thumbnailMediaId,
          url: '/api/media/' + courseData.thumbnailMediaId,
          fileName: 'thumbnail.jpg'
        } : undefined,
        lessons: [],
        quizzes: [],
        assignments: [],
        codingExercises: [],
        enrollmentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCourses(prev => [newCourse, ...prev]);
      setShowCreateCourse(false);
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (courseId: number, courseData: Partial<CourseCreateData>) => {
    setLoading(true);
    try {
      console.log('Updating course:', courseId, courseData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, ...courseData, updatedAt: new Date().toISOString() }
          : course
      ));
      setEditingCourse(null);
    } catch (error) {
      console.error('Error updating course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setLoading(true);
      try {
        console.log('Deleting course:', courseId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCourses(prev => prev.filter(course => course.id !== courseId));
      } catch (error) {
        console.error('Error deleting course:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmitForApproval = async (courseId: number) => {
    setLoading(true);
    try {
      console.log('Submitting course for approval:', courseId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, status: 'PENDING', updatedAt: new Date().toISOString() }
          : course
      ));
    } catch (error) {
      console.error('Error submitting course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseDetail(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLIC':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'DRAFT':
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'ARCHIVED':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLIC':
        return 'mentor-status-public';
      case 'PENDING':
        return 'mentor-status-pending';
      case 'DRAFT':
        return 'mentor-status-draft';
      case 'ARCHIVED':
        return 'mentor-status-archived';
      default:
        return 'mentor-status-archived';
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
    <div className="mentor-courses-section">
      <div className="mentor-courses-header">
        <div className="mentor-courses-title-section">
          <h2>Khóa Học Của Tôi</h2>
          <p>Quản lý và tạo mới các khóa học</p>
        </div>
        <button 
          className="mentor-create-course-button"
          onClick={() => setShowCreateCourse(true)}
        >
          <Plus className="w-5 h-5" />
          Tạo Khóa Học Mới
        </button>
      </div>

      <div className="mentor-courses-grid">
        {courses.map((course) => (
          <div key={course.id} className="mentor-course-card">
            <div className="mentor-course-thumbnail">
              {course.thumbnail ? (
                <img src={course.thumbnail.url} alt={course.title} />
              ) : (
                <div className="mentor-course-thumbnail-placeholder">
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className={`mentor-course-status ${getStatusColor(course.status)}`}>
                {getStatusIcon(course.status)}
                <span>{course.status}</span>
              </div>
            </div>

            <div className="mentor-course-content">
              <h3 className="mentor-course-title">{course.title}</h3>
              <p className="mentor-course-description">{course.description}</p>
              
              <div className="mentor-course-meta">
                <div className="mentor-course-level">
                  <span className="mentor-level-badge">{course.level}</span>
                </div>
                <div className="mentor-course-stats">
                  <div className="mentor-course-stat">
                    <Users className="w-4 h-4" />
                    <span>{course.enrollmentCount} học viên</span>
                  </div>
                  <div className="mentor-course-stat">
                    <Play className="w-4 h-4" />
                    <span>{course.lessons.length} bài học</span>
                  </div>
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

              <div className="mentor-course-actions">
                <button 
                  className="mentor-action-button mentor-view-button"
                  onClick={() => handleViewCourse(course)}
                >
                  <Eye className="w-4 h-4" />
                  Xem
                </button>
                <button 
                  className="mentor-action-button mentor-edit-button"
                  onClick={() => setEditingCourse(course)}
                >
                  <Edit3 className="w-4 h-4" />
                  Sửa
                </button>
                {course.status === 'DRAFT' && (
                  <button 
                    className="mentor-action-button mentor-submit-button"
                    onClick={() => handleSubmitForApproval(course.id)}
                    disabled={loading}
                  >
                    <Upload className="w-4 h-4" />
                    Gửi Duyệt
                  </button>
                )}
                <button 
                  className="mentor-action-button mentor-delete-button"
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

      {courses.length === 0 && (
        <div className="mentor-empty-courses">
          <BookOpen className="w-16 h-16 text-gray-400" />
          <h3>Chưa có khóa học nào</h3>
          <p>Bắt đầu tạo khóa học đầu tiên của bạn</p>
          <button 
            className="mentor-create-course-button"
            onClick={() => setShowCreateCourse(true)}
          >
            <Plus className="w-5 h-5" />
            Tạo Khóa Học Mới
          </button>
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
                className={`mentor-content-tab ${activeContentTab === 'lessons' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('lessons')}
              >
                <Play className="w-4 h-4" />
                Bài Học ({selectedCourse.lessons.length})
              </button>
              <button 
                className={`mentor-content-tab ${activeContentTab === 'quizzes' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('quizzes')}
              >
                <HelpCircle className="w-4 h-4" />
                Quiz ({selectedCourse.quizzes.length})
              </button>
              <button 
                className={`mentor-content-tab ${activeContentTab === 'assignments' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('assignments')}
              >
                <Edit3 className="w-4 h-4" />
                Bài Tập ({selectedCourse.assignments.length})
              </button>
              <button 
                className={`mentor-content-tab ${activeContentTab === 'codelabs' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('codelabs')}
              >
                <Code className="w-4 h-4" />
                Code Lab ({selectedCourse.codingExercises.length})
              </button>
            </div>

            {activeContentTab === 'lessons' && (
              <div className="mentor-lessons-section">
                <div className="mentor-lessons-header">
                  <h3 className="mentor-lessons-title">Bài Học</h3>
                  <button className="mentor-add-lesson-button">
                    <Plus className="w-4 h-4" />
                    Thêm Bài Học
                  </button>
                </div>
                <div className="mentor-lessons-list">
                  {selectedCourse.lessons.map((lesson) => (
                    <div key={lesson.id} className="mentor-lesson-card">
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
                        <button className="mentor-lesson-action-button primary">
                          <Edit3 className="w-4 h-4" />
                          Sửa
                        </button>
                        <button className="mentor-lesson-action-button">
                          <Eye className="w-4 h-4" />
                          Xem
                        </button>
                        <button className="mentor-lesson-action-button danger">
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeContentTab === 'quizzes' && (
              <div className="mentor-quiz-section">
                <div className="mentor-quiz-header">
                  <h3 className="mentor-quiz-title">Quiz</h3>
                  <button className="mentor-add-quiz-button">
                    <Plus className="w-4 h-4" />
                    Thêm Quiz
                  </button>
                </div>
                <div className="mentor-quiz-list">
                  {selectedCourse.quizzes.map((quiz) => (
                    <div key={quiz.id} className="mentor-quiz-card">
                      <div className="mentor-quiz-header">
                        <h4 className="mentor-quiz-title">{quiz.title}</h4>
                      </div>
                      <div className="mentor-quiz-meta">
                        <span>Điểm đạt: {quiz.passScore}%</span>
                        <span>Câu hỏi: {quiz.questions.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeContentTab === 'assignments' && (
              <div className="mentor-assignment-section">
                <div className="mentor-assignment-header">
                  <h3 className="mentor-assignment-title">Bài Tập</h3>
                  <button className="mentor-add-assignment-button">
                    <Plus className="w-4 h-4" />
                    Thêm Bài Tập
                  </button>
                </div>
                <div className="mentor-lessons-list">
                  {selectedCourse.assignments.map((assignment) => (
                    <div key={assignment.id} className="mentor-lesson-card">
                      <div className="mentor-lesson-header">
                        <h4 className="mentor-lesson-title">{assignment.title}</h4>
                        <div className="mentor-lesson-type">
                          <PenTool className="w-4 h-4" />
                          <span>{assignment.submissionType}</span>
                        </div>
                      </div>
                      <div className="mentor-lesson-meta">
                        <span>Điểm tối đa: {assignment.maxScore}</span>
                        <span>Hạn nộp: {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'Không có'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeContentTab === 'codelabs' && (
              <div className="mentor-codelab-section">
                <div className="mentor-codelab-header">
                  <h3 className="mentor-codelab-title">Code Lab</h3>
                  <button className="mentor-add-codelab-button">
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
          <div className="mentor-default-tab">
            <h2 className="mentor-default-title">Chào mừng đến với Bảng Điều Khiển Mentor</h2>
            <p className="mentor-default-description">Chọn một tab để xem các hoạt động hướng dẫn của bạn.</p>
          </div>
        );
    }
  };

  return (
    <div className="mentor-dashboard">
      <div className="mentor-dashboard-header">
        <h1 className="mentor-dashboard-title">Bảng Điều Khiển Mentor</h1>
        <p className="mentor-dashboard-subtitle">Quản lý hoạt động hướng dẫn và theo dõi tác động của bạn</p>
      </div>

      <div className="mentor-navigation-tabs">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`mentor-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                '--tab-gradient': tab.gradient
              } as React.CSSProperties & { '--tab-gradient': string }}
            >
              <div className="mentor-tab-icon-wrapper">
                <IconComponent className="mentor-tab-icon" />
              </div>
              <div className="mentor-tab-content">
                <span className="mentor-tab-label">{tab.label}</span>
                <span className="mentor-tab-description">{tab.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mentor-main-content">
        {renderActiveTab()}
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
    </div>
  );
};

// Unified Course Modal Component
const CourseModal: React.FC<{
  course?: Course | null;
  onClose: () => void;
  onSubmit: (data: CourseCreateData | Partial<CourseCreateData>) => void | Promise<void>;
  loading: boolean;
}> = ({ course, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState<CourseCreateData>({
    title: course?.title || '',
    description: course?.description || '',
    level: course?.level || 'Beginner',
    thumbnailMediaId: course?.thumbnail?.id
  });

  const handleFileUpload = (file: File) => {
    console.log('File selected:', file);
    return file;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit(formData);
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