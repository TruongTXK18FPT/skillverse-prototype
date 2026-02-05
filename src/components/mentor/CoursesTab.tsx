/**
 * CoursesTab Component
 * 
 * Displays list of mentor's courses with navigation to create/edit/content pages.
 * Replaces the course management section from legacy MentorPage.
 * 
 * @module components/mentor/CoursesTab
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Users,
  ArrowLeft,
  Play,
  DollarSign,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listCoursesByAuthor, deleteCourse, submitCourseForApproval } from '../../services/courseService';
import { CourseStatus, CourseLevel } from '../../data/courseDTOs';
import { createGroup, getGroupByCourse, updateGroup, GroupChatResponse } from '../../services/groupChatService';
import CreateGroupModal from '../course/CreateGroupModal';
import StudentManagementTab from '../course/StudentManagementTab';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { API_BASE_URL } from '../../services/axiosInstance';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useMentorNotice } from '../../context/mentor/MentorNoticeContext';

// ============================================================================
// TYPES
// ============================================================================

// Re-export from courseDTOs for use in other components
import { CourseSummaryDTO } from '../../data/courseDTOs';
export type Course = CourseSummaryDTO;

// ============================================================================
// HELPERS
// ============================================================================

const getStatusColor = (status: CourseStatus): string => {
  switch (status) {
    case CourseStatus.DRAFT: return 'mentor-hud-status-draft';
    case CourseStatus.PENDING: return 'mentor-hud-status-pending';
    case CourseStatus.PUBLIC: return 'mentor-hud-status-public';
    case CourseStatus.REJECTED: return 'mentor-hud-status-rejected';
    case CourseStatus.ARCHIVED: return 'mentor-hud-status-archived';
    default: return '';
  }
};

const getStatusLabel = (status: CourseStatus): string => {
  switch (status) {
    case CourseStatus.DRAFT: return 'Bản nháp';
    case CourseStatus.PENDING: return 'Chờ duyệt';
    case CourseStatus.PUBLIC: return 'Đã xuất bản';
    case CourseStatus.REJECTED: return 'Bị từ chối';
    case CourseStatus.ARCHIVED: return 'Đã lưu trữ';
    default: return status;
  }
};

const formatDuration = (seconds: number): string => {
  if (!seconds) return '0 phút';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} phút`;
};

const resolveCourseThumbnail = (course: Course): string | null => {
  const raw = course.thumbnail?.url || course.thumbnailUrl || '';
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }
  const apiOrigin = API_BASE_URL.replace(/\/api$/i, '');
  if (raw.startsWith('/')) {
    return `${apiOrigin}${raw}`;
  }
  return raw;
};

// ============================================================================
// COMPONENT
// ============================================================================

const CoursesTab: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseGroups, setCourseGroups] = useState<Record<number, GroupChatResponse | null>>({});
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<Course | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'default' | 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);
  const { showNotice } = useMentorNotice();
  
  // Group Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [initialModalData, setInitialModalData] = useState({ name: '', avatar: '' });

  // Load courses on mount
  useEffect(() => {
    if (user?.id) {
      loadCourses();
    }
  }, [user?.id]);

  // Load group info for each course
  useEffect(() => {
    if (courses.length > 0) {
      courses.forEach(async (c) => {
        try {
          const group = await getGroupByCourse(c.id);
          if (group) {
            setCourseGroups(prev => ({ ...prev, [c.id]: group }));
          }
        } catch {
          // ignore - course may not have a group
        }
      });
    }
  }, [courses]);

  const loadCourses = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listCoursesByAuthor(user.id, 0, 1000);
      // API returns PageResponse, extract content array
      setCourses(response.content || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError('Không thể tải danh sách khóa học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!user) return;
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    setConfirmDialog({
      title: 'Xóa khóa học',
      message: `Bạn có chắc chắn muốn xóa khóa học "${course.title}"? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteCourse(courseId, user.id);
          setCourses(prev => prev.filter(c => c.id !== courseId));
          showNotice('success', 'Đã xóa khóa học.');
        } catch (err) {
          console.error('Failed to delete course:', err);
          setError('Không thể xóa khóa học. Vui lòng thử lại.');
        }
      }
    });
  };

  const handleSubmitForApproval = async (courseId: number) => {
    if (!user) return;
    setConfirmDialog({
      title: 'Gửi khóa học để duyệt',
      message: 'Bạn có chắc chắn muốn gửi khóa học này để duyệt?',
      confirmLabel: 'Gửi duyệt',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        setLoading(true);
        try {
          const updatedCourse = await submitCourseForApproval(courseId, user.id);
          setCourses(prev => prev.map(c =>
            c.id === courseId
              ? { ...c, status: updatedCourse.status, updatedAt: updatedCourse.updatedAt }
              : c
          ));
          showNotice('success', 'Khóa học đã được gửi để duyệt thành công!');
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || 'Không thể gửi khóa học để duyệt.';
          setError(errorMessage);
          showNotice('error', errorMessage);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Group modal handlers
  const handleOpenCreateModal = (courseId: number, courseTitle: string) => {
    setActiveCourseId(courseId);
    setModalMode('create');
    setInitialModalData({ name: `Hỗ trợ: ${courseTitle}`, avatar: '' });
    setModalOpen(true);
  };

  const handleOpenEditModal = (courseId: number, group: GroupChatResponse) => {
    setActiveCourseId(courseId);
    setModalMode('edit');
    setInitialModalData({ name: group.name, avatar: group.avatarUrl || '' });
    setModalOpen(true);
  };

  const handleModalSubmit = async (name: string, avatarUrl: string) => {
    if (!user || !activeCourseId) return;

    try {
      if (modalMode === 'create') {
        const res = await createGroup(user.id, { courseId: activeCourseId, name, avatarUrl });
        setCourseGroups(prev => ({ ...prev, [activeCourseId]: res }));
        showNotice('success', 'Đã tạo group chat thành công!');
      } else {
        const currentGroup = courseGroups[activeCourseId];
        if (currentGroup) {
          const res = await updateGroup(currentGroup.id, user.id, { courseId: activeCourseId, name, avatarUrl });
          setCourseGroups(prev => ({ ...prev, [activeCourseId]: res }));
          showNotice('success', 'Đã cập nhật group chat thành công!');
        }
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Group modal error:', err);
      showNotice('error', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  // Render
  if (loading && courses.length === 0) {
    return (
      <div className="mentor-hud-loading">
        <MeowlKuruLoader size="small" />
        <p>Đang tải khóa học...</p>
      </div>
    );
  }

  if (selectedCourseForStudents && user) {
    return (
      <div className="mentor-hud-courses">
        <div className="mentor-hud-courses__header">
          <div className="mentor-hud-courses__title-section">
            <h2 className="mentor-hud-courses__title">
              <BookOpen className="w-6 h-6" />
              Quản Lý Học Viên
            </h2>
            <p className="mentor-hud-courses__subtitle">
              {selectedCourseForStudents.title}
            </p>
          </div>
          <button
            className="mentor-hud-action-button mentor-hud-view-button"
            onClick={() => setSelectedCourseForStudents(null)}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại khóa học
          </button>
        </div>

        <StudentManagementTab
          courseId={selectedCourseForStudents.id}
          currentUserId={user.id}
        />
      </div>
    );
  }

  return (
    <div className="mentor-hud-courses">
      {/* Header */}
      <div className="mentor-hud-courses__header">
        <div className="mentor-hud-courses__title-section">
          <h2 className="mentor-hud-courses__title">
            <BookOpen className="w-6 h-6" />
            Quản Lý Khóa Học
          </h2>
          <p className="mentor-hud-courses__subtitle">
            Tạo, chỉnh sửa và quản lý nội dung khóa học của bạn
          </p>
        </div>
        <button
          className="mentor-hud-create-button"
          onClick={() => navigate('/mentor/courses/create')}
        >
          <Plus className="w-5 h-5" />
          Tạo Khóa Học Mới
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mentor-hud-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <div className="mentor-hud-empty">
          <BookOpen className="w-16 h-16" style={{ color: 'var(--mentor-hud-accent-cyan)' }} />
          <h3>Chưa có khóa học nào</h3>
          <p>Bắt đầu tạo khóa học đầu tiên của bạn!</p>
          <button
            className="mentor-hud-create-button"
            onClick={() => navigate('/mentor/courses/create')}
          >
            <Plus className="w-5 h-5" />
            Tạo Khóa Học Mới
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {courses.length > 0 && (
        <div className="mentor-hud-courses__grid">
          {/* Create Card */}
          <div
            className="mentor-hud-course-card mentor-hud-course-card--create"
            onClick={() => navigate('/mentor/courses/create')}
          >
            <div className="mentor-hud-course-card--create-content">
              <div className="create-icon-wrapper">
                <Plus className="w-8 h-8" />
              </div>
              <h3>Tạo Khóa Học Mới</h3>
              <p>Bắt đầu xây dựng lộ trình tri thức của bạn</p>
            </div>
          </div>

          {/* Course Cards */}
          {courses.map((course) => (
            <div key={course.id} className="mentor-hud-course-card">
              {/* Thumbnail */}
              <div className="mentor-hud-course-thumbnail">
                {resolveCourseThumbnail(course) ? (
                  <img src={resolveCourseThumbnail(course) || ''} alt={course.title} />
                ) : (
                  <div className="mentor-hud-course-thumbnail-placeholder">
                    <BookOpen className="w-12 h-12" />
                  </div>
                )}
                <div className={`mentor-hud-course-status ${getStatusColor(course.status)}`}>
                  <span>{getStatusLabel(course.status)}</span>
                </div>
              </div>

              {/* Content */}
              <div className="mentor-hud-course-content">
                <h3 className="mentor-hud-course-title">{course.title}</h3>
                <p className="mentor-hud-course-description">{course.description}</p>

                {/* Meta */}
                <div className="mentor-hud-course-meta">
                  <span className="mentor-hud-level-badge">{course.level}</span>
                  <div className="mentor-hud-course-stats">
                    <div className="mentor-hud-course-stat">
                      <Users className="w-4 h-4" />
                      <span>{course.enrollmentCount} Học viên</span>
                    </div>
                    <div className="mentor-hud-course-stat">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.moduleCount || 0} Module</span>
                    </div>
                    <div className="mentor-hud-course-stat">
                      <Play className="w-4 h-4" />
                      <span>{course.lessonCount || course.lessons?.length || 0} Bài học</span>
                    </div>
                    {course.price !== undefined && course.price !== null && (
                      <div className="mentor-hud-course-stat">
                        <DollarSign className="w-4 h-4" />
                        <span>{course.price.toLocaleString('vi-VN')} {course.currency || 'VND'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mentor-hud-course-actions">
                  <button
                    className="mentor-hud-action-button mentor-hud-edit-button"
                    onClick={() => navigate(`/mentor/courses/${course.id}/edit`)}
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit3 className="w-4 h-4" />
                    Sửa
                  </button>

                  <button
                    className="mentor-hud-action-button mentor-hud-view-button"
                    onClick={() => navigate(`/mentor/courses/${course.id}/content`)}
                    title="Quản lý nội dung"
                  >
                    <Eye className="w-4 h-4" />
                    Nội Dung
                  </button>

                  <button
                    className="mentor-hud-action-button"
                    onClick={() => setSelectedCourseForStudents(course)}
                    title="Quản lý học viên"
                  >
                    <Users className="w-4 h-4" />
                    Học Viên
                  </button>

                  {course.status === CourseStatus.DRAFT && (
                    <button
                      className="mentor-hud-action-button mentor-hud-submit-button"
                      onClick={() => handleSubmitForApproval(course.id)}
                      disabled={loading}
                      title="Gửi duyệt"
                    >
                      <Upload className="w-4 h-4" />
                      Gửi Duyệt
                    </button>
                  )}

                  {course.status === CourseStatus.PUBLIC && (
                    courseGroups[course.id] ? (
                      <button
                        className="mentor-hud-action-button"
                        style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: '#10b981' }}
                        onClick={() => handleOpenEditModal(course.id, courseGroups[course.id]!)}
                        title="Quản lý Group"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Group
                      </button>
                    ) : (
                      <button
                        className="mentor-hud-action-button"
                        style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: '#3b82f6' }}
                        onClick={() => handleOpenCreateModal(course.id, course.title)}
                        title="Tạo Group"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Tạo Group
                      </button>
                    )
                  )}

                  <button
                    className="mentor-hud-action-button mentor-hud-delete-button"
                    onClick={() => handleDeleteCourse(course.id)}
                    disabled={loading}
                    title="Xóa khóa học"
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

      {/* Group Modal */}
  <CreateGroupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        initialName={initialModalData.name}
        initialAvatar={initialModalData.avatar}
      />
    </div>
  );
};

export default CoursesTab;
