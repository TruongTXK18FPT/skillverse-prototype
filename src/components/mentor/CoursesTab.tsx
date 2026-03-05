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
  MessageSquare,
  Archive,
  PenTool
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listCoursesByAuthor, deleteCourse, submitCourseForApproval } from '../../services/courseService';
import { CourseStatus } from '../../data/courseDTOs';
import { createGroup, getGroupByCourse, updateGroup, GroupChatResponse } from '../../services/groupChatService';
import CreateGroupModal from '../course/CreateGroupModal';
import StudentManagementTab from '../course/StudentManagementTab';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { API_BASE_URL } from '../../services/axiosInstance';
import ConfirmDialog from '../shared/ConfirmDialog';
import Pagination from '../shared/Pagination';
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
    case CourseStatus.SUSPENDED: return 'mentor-hud-status-archived';
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
    case CourseStatus.SUSPENDED: return 'Tạm khóa';
    case CourseStatus.ARCHIVED: return 'Đã lưu trữ';
    default: return status;
  }
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
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseGroups, setCourseGroups] = useState<Record<number, GroupChatResponse | null>>({});
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<Course | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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
  const itemsPerPage = 8;

  // Load courses on mount
  useEffect(() => {
    if (user?.id) {
      loadCourses(currentPage);
    }
  }, [user?.id, currentPage]);

  // Load group info for all courses in parallel (batched)
  useEffect(() => {
    if (courses.length > 0) {
      const loadGroups = async () => {
        const results = await Promise.allSettled(
          courses.map(c => getGroupByCourse(c.id).then(group => ({ courseId: c.id, group })))
        );
        const groups: Record<number, GroupChatResponse | null> = {};
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value.group) {
            groups[r.value.courseId] = r.value.group;
          }
        });
        setCourseGroups(groups);
      };
      loadGroups();
    }
  }, [courses]);

  const loadCourses = async (pageToLoad: number = currentPage) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listCoursesByAuthor(user.id, pageToLoad - 1, itemsPerPage);
      const fetchedCourses = response.content || [];
      const fetchedTotal = response.totalElements ?? fetchedCourses.length;

      // If current page becomes invalid after data changes (e.g. delete last item on page), move back 1 page.
      if (pageToLoad > 1 && fetchedCourses.length === 0 && fetchedTotal > 0) {
        setCurrentPage(pageToLoad - 1);
        return;
      }

      setCourses(fetchedCourses);
      setTotalItems(fetchedTotal);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setCourses([]);
      setTotalItems(0);
      setError('Không thể tải danh sách khóa học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!user) return;
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const hasEnrollments = (course.enrollmentCount ?? 0) > 0;
    const isPublic = course.status === CourseStatus.PUBLIC;

    let title: string;
    let message: string;
    let confirmLabel: string;

    if (isPublic && hasEnrollments) {
      title = 'Lưu trữ khóa học';
      message = `Khóa học "${course.title}" đang có ${course.enrollmentCount} học viên. Khóa học sẽ được lưu trữ (không hiển thị công khai) nhưng học viên hiện tại vẫn có thể truy cập nội dung đã mua.`;
      confirmLabel = 'Lưu trữ';
    } else if (hasEnrollments) {
      title = 'Lưu trữ khóa học';
      message = `Khóa học "${course.title}" có ${course.enrollmentCount} học viên đã đăng ký. Khóa học sẽ được lưu trữ thay vì xóa vĩnh viễn.`;
      confirmLabel = 'Lưu trữ';
    } else {
      title = 'Xóa khóa học';
      message = `Bạn có chắc chắn muốn xóa khóa học "${course.title}"? Hành động này không thể hoàn tác.`;
      confirmLabel = 'Xóa';
    }

    setConfirmDialog({
      title,
      message,
      confirmLabel,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteCourse(courseId, user.id);
          await loadCourses(currentPage);
          showNotice('success', hasEnrollments ? 'Khóa học đã được lưu trữ.' : 'Đã xóa khóa học.');
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
          await submitCourseForApproval(courseId, user.id);
          await loadCourses(currentPage);
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

  const handleOpenCertificateSettings = () => {
    navigate('/mentor', { state: { activeTab: 'certificate-settings' } });
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
          <p className="mentor-hud-courses__helper">
            Muốn chứng chỉ hiển thị chữ ký riêng? Bạn có thể cấu hình ngay trong mục cài đặt chứng chỉ.
          </p>
        </div>
        <div className="mentor-hud-courses__header-actions">
          <button
            type="button"
            className="mentor-hud-secondary-button"
            onClick={handleOpenCertificateSettings}
          >
            <PenTool className="w-4 h-4" />
            Cài đặt chứng chỉ
          </button>
          <button
            className="mentor-hud-create-button"
            onClick={() => navigate('/mentor/courses/create')}
          >
            <Plus className="w-5 h-5" />
            Tạo Khóa Học Mới
          </button>
        </div>
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
          <BookOpen className="w-16 h-16 mentor-hud-empty-icon" />
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
        <>
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

                {/* Rejection reason banner */}
                {course.status === CourseStatus.REJECTED && course.rejectionReason && (
                  <div className="mentor-hud-rejection-banner">
                    <strong>Lý do từ chối:</strong> {course.rejectionReason}
                  </div>
                )}

                {/* Suspension reason banner */}
                {course.status === CourseStatus.SUSPENDED && course.suspensionReason && (
                  <div className="mentor-hud-rejection-banner mentor-hud-suspension-banner">
                    <strong>Lý do tạm khóa:</strong> {course.suspensionReason}
                    <p style={{ margin: '4px 0 0', fontSize: '0.85em', opacity: 0.85 }}>
                      Bạn có thể chỉnh sửa nội dung và gửi kháng cáo để admin xem xét lại.
                    </p>
                  </div>
                )}

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
                      <span>{course.lessonCount ?? 0} Bài học</span>
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
                  {/* Sửa: cho DRAFT / REJECTED / SUSPENDED */}
                  {(course.status === CourseStatus.DRAFT || course.status === CourseStatus.REJECTED || course.status === CourseStatus.SUSPENDED) ? (
                    <button
                      className="mentor-hud-action-button mentor-hud-edit-button"
                      onClick={() => navigate(`/mentor/courses/${course.id}/edit`)}
                      title="Chỉnh sửa khóa học"
                    >
                      <Edit3 className="w-4 h-4" />
                      Sửa
                    </button>
                  ) : (
                    <button
                      className="mentor-hud-action-button mentor-hud-view-button"
                      onClick={() => navigate(`/mentor/courses/${course.id}/edit`)}
                      title="Xem chi tiết khóa học"
                    >
                      <Eye className="w-4 h-4" />
                      Xem
                    </button>
                  )}

                  <button
                    className="mentor-hud-action-button mentor-hud-students-button"
                    onClick={() => setSelectedCourseForStudents(course)}
                    title="Quản lý học viên"
                  >
                    <Users className="w-4 h-4" />
                    Học Viên
                  </button>

                  {(course.status === CourseStatus.DRAFT || course.status === CourseStatus.REJECTED) && (
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

                  {course.status === CourseStatus.SUSPENDED && (
                    <button
                      className="mentor-hud-action-button mentor-hud-submit-button"
                      onClick={() => handleSubmitForApproval(course.id)}
                      disabled={loading}
                      title="Gửi kháng cáo để admin xem xét lại"
                    >
                      <Upload className="w-4 h-4" />
                      Kháng Cáo
                    </button>
                  )}

                  {course.status === CourseStatus.PUBLIC && (
                    courseGroups[course.id] ? (
                      <button
                        className="mentor-hud-action-button mentor-hud-group-button"
                        onClick={() => handleOpenEditModal(course.id, courseGroups[course.id]!)}
                        title="Quản lý Group"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Group
                      </button>
                    ) : (
                      <button
                        className="mentor-hud-action-button mentor-hud-create-group-button"
                        onClick={() => handleOpenCreateModal(course.id, course.title)}
                        title="Tạo Group"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Tạo Group
                      </button>
                    )
                  )}

                  {/* Xóa/Lưu trữ — ẩn cho ARCHIVED */}
                  {course.status !== CourseStatus.ARCHIVED ? (
                    <button
                      className="mentor-hud-action-button mentor-hud-delete-button"
                      onClick={() => handleDeleteCourse(course.id)}
                      disabled={loading}
                      title={(course.enrollmentCount ?? 0) > 0 ? 'Lưu trữ khóa học' : 'Xóa khóa học'}
                    >
                      {(course.enrollmentCount ?? 0) > 0 ? (
                        <><Archive className="w-4 h-4" /> Lưu trữ</>
                      ) : (
                        <><Trash2 className="w-4 h-4" /> Xóa</>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
              </div>
            ))}
          </div>
          <Pagination
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
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
