/**
 * CoursesTab Component
 * 
 * Displays list of mentor's courses with navigation to create/edit/content pages.
 * Replaces the course management section from legacy MentorPage.
 * retest
 * @module components/mentor/CoursesTab
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Plus,
  Edit3,
  Upload,
  Users,
  ArrowLeft,
  Play,
  DollarSign,
  Eye,
  MessageSquare,
  Archive,
  PenTool,
  Clock,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  listCoursesByAuthor,
  listCoursesByAuthorWithStatus,
  deleteCourse,
  submitCourseForApproval,
  createCourseRevision,
  listCourseRevisions,
  getMentorCourseStats
} from '../../services/courseService';
import type { CourseRevisionDTO } from '../../services/courseService';
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

const getStatusFilterLabel = (status: 'ALL' | CourseStatus): string => {
  if (status === 'ALL') {
    return 'Tất cả';
  }

  return getStatusLabel(status);
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
  const COURSES_PAGE_STORAGE_KEY = 'mentor.courses.currentPage';

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CourseStatus>('ALL');
  const [courseGroups, setCourseGroups] = useState<Record<number, GroupChatResponse | null>>({});
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<Course | null>(null);
  const [courseStats, setCourseStats] = useState<Record<string, number> | null>(null);
  const [courseStatsStatus, setCourseStatsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const saved = typeof window !== 'undefined'
      ? window.sessionStorage.getItem(COURSES_PAGE_STORAGE_KEY)
      : null;
    const parsed = saved ? Number(saved) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'default' | 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);
  const [courseRevisions, setCourseRevisions] = useState<Record<number, CourseRevisionDTO[]>>({});
  const [revisionLoadingCourseId, setRevisionLoadingCourseId] = useState<number | null>(null);
  const [revisionDrawer, setRevisionDrawer] = useState<{
    isOpen: boolean;
    courseId: number | null;
    courseTitle: string;
    revisions: CourseRevisionDTO[];
    total: number;
    loading: boolean;
  }>({
    isOpen: false,
    courseId: null,
    courseTitle: '',
    revisions: [],
    total: 0,
    loading: false
  });
  const { showNotice } = useMentorNotice();

  useEffect(() => {
    if (!revisionDrawer.isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [revisionDrawer.isOpen]);
  
  // Group Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [initialModalData, setInitialModalData] = useState({ name: '', avatar: '' });
  const itemsPerPage = 8;

  // Load courses on mount and when filter/page changes
  useEffect(() => {
    if (user?.id) {
      loadCourses(currentPage);
    }
  }, [user?.id, currentPage, statusFilter]);

  // Load course stats for badge counts
  useEffect(() => {
    if (!user?.id) return;
    setCourseStatsStatus('loading');
    getMentorCourseStats(user.id)
      .then((stats) => {
        setCourseStats(stats);
        setCourseStatsStatus('ready');
      })
      .catch(() => {
        setCourseStats(null);
        setCourseStatsStatus('error');
      });
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(COURSES_PAGE_STORAGE_KEY, String(currentPage));
  }, [currentPage]);

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

  useEffect(() => {
    const publicCourses = courses.filter(course => course.status === CourseStatus.PUBLIC);
    if (publicCourses.length === 0) {
      setCourseRevisions({});
      return;
    }

    const loadRevisionSnapshots = async () => {
      const results = await Promise.allSettled(
        publicCourses.map(async (course) => {
          const response = await listCourseRevisions(course.id, 0, 1);
          return { courseId: course.id, revisions: response.content ?? [] };
        })
      );

      const revisionMap: Record<number, CourseRevisionDTO[]> = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          revisionMap[result.value.courseId] = result.value.revisions;
        }
      });
      setCourseRevisions(revisionMap);
    };

    void loadRevisionSnapshots();
  }, [courses]);

  const loadCourses = async (pageToLoad: number = currentPage) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = statusFilter === 'ALL'
        ? await listCoursesByAuthorWithStatus(user.id, pageToLoad - 1, itemsPerPage, 'updatedAt', 'desc', undefined, false)
        : await listCoursesByAuthorWithStatus(user.id, pageToLoad - 1, itemsPerPage, 'updatedAt', 'desc', statusFilter as CourseStatus, true);
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
    if (course.status === CourseStatus.SUSPENDED) {
      showNotice('warning', 'Khóa học đang tạm khóa. Vui lòng chỉnh sửa và gửi kháng cáo thay vì xóa/lưu trữ.');
      return;
    }

    const hasEnrollments = (course.enrollmentCount ?? 0) > 0;
    const title = 'Lưu trữ khóa học';
    const message = hasEnrollments
      ? `Khóa học "${course.title}" có ${course.enrollmentCount} học viên đã đăng ký. Khóa học sẽ được lưu trữ (không hiển thị công khai) nhưng học viên hiện tại vẫn có thể tiếp tục truy cập nội dung đã mua.`
      : `Bạn có chắc chắn muốn lưu trữ khóa học "${course.title}"? Khóa học sẽ bị ẩn khỏi luồng công khai và có thể cần quy trình nội bộ để mở lại.`;
    const confirmLabel = 'Lưu trữ';

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
          getMentorCourseStats(user.id)
            .then((stats) => {
              setCourseStats(stats);
              setCourseStatsStatus('ready');
            })
            .catch(() => {});
          showNotice('success', 'Khóa học đã được lưu trữ.');
        } catch (err) {
          console.error('Failed to archive course:', err);
          setError('Không thể lưu trữ khóa học. Vui lòng thử lại.');
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
          getMentorCourseStats(user.id)
            .then((stats) => {
              setCourseStats(stats);
              setCourseStatsStatus('ready');
            })
            .catch(() => {});
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

  const getApiErrorMessage = (error: any, fallback: string) => {
    const responseData = error?.response?.data;
    if (typeof responseData === 'string' && responseData.trim()) return responseData;
    if (responseData?.message && typeof responseData.message === 'string') return responseData.message;
    if (responseData?.error && typeof responseData.error === 'string') return responseData.error;
    if (error?.message && typeof error.message === 'string') return error.message;
    return fallback;
  };

  const getRevisionStatusLabel = (status: CourseRevisionDTO['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'Bản nháp';
      case 'PENDING':
        return 'Chờ duyệt';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Bị từ chối';
      case 'ARCHIVED':
        return 'Đã lưu trữ';
      default:
        return status;
    }
  };

  const getActionableRevision = (courseId: number): CourseRevisionDTO | null => {
    const revisions = courseRevisions[courseId] ?? [];
    const openRevision = revisions.find(
      revision =>
        revision.status === 'DRAFT' ||
        revision.status === 'PENDING' ||
        revision.status === 'REJECTED'
    );
    return openRevision ?? null;
  };

  const refreshCourseRevisions = async (courseId: number) => {
    const response = await listCourseRevisions(courseId, 0, 1);
    setCourseRevisions(prev => ({ ...prev, [courseId]: response.content ?? [] }));
    return response.content ?? [];
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('vi-VN');
  };

  const handleCreateRevision = async (course: Course) => {
    try {
      setRevisionLoadingCourseId(course.id);
      // Always re-check revision state right before creating to avoid stale UI races.
      const latestRevisions = await refreshCourseRevisions(course.id);
      const openRevision = latestRevisions.find(
        (revision) =>
          revision.status === 'DRAFT' ||
          revision.status === 'PENDING' ||
          revision.status === 'REJECTED'
      );

      if (openRevision) {
        const isPending = openRevision.status === 'PENDING';
        showNotice(
          isPending ? 'warning' : 'info',
          isPending
            ? `Khóa học đã có phiên bản #${openRevision.revisionNumber} đang chờ duyệt. Vui lòng đợi admin xử lý trước khi tạo phiên bản mới.`
            : `Khóa học đã có phiên bản #${openRevision.revisionNumber}. Đang mở phiên bản hiện có để bạn tiếp tục cập nhật.`
        );
        navigate(`/mentor/courses/${course.id}/edit?revisionId=${openRevision.id}`, {
          state: { activeTab: 'courses', coursesPage: currentPage }
        });
        return;
      }

      const created = await createCourseRevision(course.id);
      await refreshCourseRevisions(course.id);
      showNotice(
        'success',
        `Đã tạo phiên bản #${created.revisionNumber}. Đang chuyển sang trang chỉnh sửa phiên bản.`
      );
      navigate(`/mentor/courses/${course.id}/edit?revisionId=${created.id}`, {
        state: { activeTab: 'courses', coursesPage: currentPage }
      });
    } catch (err: any) {
      const apiErrorMessage = getApiErrorMessage(err, 'Không thể tạo phiên bản mới.');

      if (apiErrorMessage.includes('COURSE_HAS_OPEN_REVISION')) {
        try {
          const latestRevisions = await refreshCourseRevisions(course.id);
          const openRevision = latestRevisions.find(
            (revision) =>
              revision.status === 'DRAFT' ||
              revision.status === 'PENDING' ||
              revision.status === 'REJECTED'
          );
          if (openRevision) {
            const isPending = openRevision.status === 'PENDING';
            showNotice(
              isPending ? 'warning' : 'info',
              isPending
                ? `Khóa học đã có phiên bản #${openRevision.revisionNumber} đang chờ duyệt. Vui lòng đợi admin xử lý trước khi tạo phiên bản mới.`
                : `Khóa học đã có phiên bản #${openRevision.revisionNumber}. Đang mở phiên bản hiện có để bạn tiếp tục cập nhật.`
            );
            navigate(`/mentor/courses/${course.id}/edit?revisionId=${openRevision.id}`, {
              state: { activeTab: 'courses', coursesPage: currentPage }
            });
            return;
          }
        } catch {
          // Ignore and fallback to generic message below.
        }
      }

      if (apiErrorMessage.includes('FORBIDDEN') || apiErrorMessage.toLowerCase().includes('access denied')) {
        showNotice(
          'error',
          'Bạn không có quyền cập nhật revision cho khóa học này (không phải tác giả hoặc thiếu quyền mentor/admin).'
        );
        return;
      }

      showNotice('error', apiErrorMessage);
    } finally {
      setRevisionLoadingCourseId(null);
    }
  };

  const getRevisionStatusClass = (status: CourseRevisionDTO['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'mentor-hud-revision-status--draft';
      case 'PENDING':
        return 'mentor-hud-revision-status--pending';
      case 'APPROVED':
        return 'mentor-hud-revision-status--approved';
      case 'REJECTED':
        return 'mentor-hud-revision-status--rejected';
      case 'ARCHIVED':
        return 'mentor-hud-revision-status--archived';
      default:
        return '';
    }
  };

  const handleUpdateRevision = async (course: Course) => {
    const revision = getActionableRevision(course.id);
    if (!revision) {
      showNotice('warning', 'Chưa có revision để cập nhật.');
      return;
    }
    if (revision.status !== 'DRAFT' && revision.status !== 'REJECTED') {
      showNotice('warning', 'Revision hiện tại không cho phép chỉnh sửa.');
      return;
    }

    try {
      setRevisionLoadingCourseId(course.id);
      navigate(`/mentor/courses/${course.id}/edit?revisionId=${revision.id}`, {
        state: { activeTab: 'courses', coursesPage: currentPage }
      });
    } catch (err: any) {
      showNotice('error', getApiErrorMessage(err, 'Không thể mở phiên bản để chỉnh sửa.'));
    } finally {
      setRevisionLoadingCourseId(null);
    }
  };

  const handleOpenRevisionReadOnly = (courseId: number, revisionId: number) => {
    navigate(`/mentor/courses/${courseId}/edit?revisionId=${revisionId}`, {
      state: { activeTab: 'courses', coursesPage: currentPage }
    });
  };

  const handleOpenCourseView = (course: Course, latestRevision?: CourseRevisionDTO) => {
    const revisionId = latestRevision?.id;
    const target = revisionId
      ? `/mentor/courses/${course.id}/edit?revisionId=${revisionId}`
      : `/mentor/courses/${course.id}/edit`;
    navigate(target, {
      state: { activeTab: 'courses', coursesPage: currentPage }
    });
  };

  const handleOpenRevisionHistory = async (course: Course) => {
    setRevisionDrawer({
      isOpen: true,
      courseId: course.id,
      courseTitle: course.title,
      revisions: [],
      total: 0,
      loading: true
    });

    try {
      const response = await listCourseRevisions(course.id, 0, 20);
      setRevisionDrawer({
        isOpen: true,
        courseId: course.id,
        courseTitle: course.title,
        revisions: response.content ?? [],
        total: response.totalElements ?? (response.content?.length ?? 0),
        loading: false
      });
    } catch (err: any) {
      setRevisionDrawer(prev => ({ ...prev, loading: false }));
      showNotice('error', getApiErrorMessage(err, 'Không thể tải lịch sử phiên bản.'));
    }
  };

  const handleCloseRevisionHistory = () => {
    setRevisionDrawer(prev => ({ ...prev, isOpen: false }));
  };

  const renderRevisionHistoryModal = () => {
    if (!revisionDrawer.isOpen || typeof document === 'undefined') {
      return null;
    }

    return createPortal(
      <>
        <div className="mentor-hud-revision-modal-overlay" onClick={handleCloseRevisionHistory} />
        <section className="mentor-hud-revision-modal" role="dialog" aria-modal="true">
          <div className="mentor-hud-revision-modal__header">
            <div>
              <h3 className="mentor-hud-revision-modal__title">Lịch sử phiên bản</h3>
              <p className="mentor-hud-revision-modal__subtitle">{revisionDrawer.courseTitle}</p>
            </div>
            <button
              className="mentor-hud-action-button mentor-hud-view-button mentor-hud-revision-modal__close"
              onClick={handleCloseRevisionHistory}
              title="Đóng lịch sử phiên bản"
            >
              <X className="w-4 h-4" />
              Đóng
            </button>
          </div>

          <div className="mentor-hud-revision-modal__body">
            {revisionDrawer.loading && (
              <div className="mentor-hud-loading">
                <MeowlKuruLoader size="small" />
                <p>Đang tải lịch sử phiên bản...</p>
              </div>
            )}

            {!revisionDrawer.loading && revisionDrawer.revisions.length === 0 && (
              <div className="mentor-hud-empty">
                <p>Chưa có phiên bản nào.</p>
              </div>
            )}

            {!revisionDrawer.loading && revisionDrawer.revisions.length > 0 && (
              <div className="mentor-hud-revision-modal__list">
                {revisionDrawer.revisions.map((revision) => (
                  <div key={revision.id} className="mentor-hud-revision-modal__item">
                    <div className="mentor-hud-revision-modal__item-main">
                      <span className={`mentor-hud-revision-status ${getRevisionStatusClass(revision.status)}`}>
                        {getRevisionStatusLabel(revision.status)}
                      </span>
                      <span className="mentor-hud-revision-meta">
                        #{revision.revisionNumber} • Tạo {formatDateTime(revision.createdAt)} • Cập nhật {formatDateTime(revision.updatedAt)}
                      </span>
                    </div>
                    <button
                      className="mentor-hud-action-button mentor-hud-view-button mentor-hud-revision-modal__open"
                      onClick={() => handleOpenRevisionReadOnly(revision.courseId, revision.id)}
                      title="Mở phiên bản này"
                    >
                      <Eye className="w-4 h-4" />
                      Mở
                    </button>
                  </div>
                ))}
                {revisionDrawer.total > revisionDrawer.revisions.length && (
                  <p className="mentor-hud-revision-modal__footnote">
                    Đang hiển thị {revisionDrawer.revisions.length}/{revisionDrawer.total} phiên bản gần nhất.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </>,
      document.body
    );
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

  const visibleCourses = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesSearch =
        keyword.length === 0 ||
        course.title.toLowerCase().includes(keyword) ||
        (course.description || '').toLowerCase().includes(keyword) ||
        (course.category || '').toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === 'ALL' || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courses, searchTerm, statusFilter]);

  const activeStatusLabel = getStatusFilterLabel(statusFilter);
  const totalCourseCount = courseStatsStatus === 'ready' ? (courseStats?.ALL ?? 0) : null;
  const shouldShowGlobalEmpty = !loading && totalCourseCount === 0;
  const shouldShowCourseShell = !shouldShowGlobalEmpty;
  const filteredEmpty = shouldShowCourseShell && !loading && visibleCourses.length === 0;
  const trimmedSearchTerm = searchTerm.trim();

  const filteredEmptyCopy = useMemo(() => {
    if (trimmedSearchTerm.length > 0) {
      return {
        title: 'Không có khóa học phù hợp',
        description: `Không tìm thấy khóa học nào khớp với "${trimmedSearchTerm}" trong bộ lọc hiện tại.`
      };
    }

    if (statusFilter === 'ALL') {
      return {
        title: 'Chưa có khóa học hiển thị',
        description: 'Hiện chưa có khóa học nào trong danh sách này. Bạn có thể tạo khóa học mới để bắt đầu.'
      };
    }

    return {
      title: `Không có khóa học ở trạng thái ${activeStatusLabel.toLowerCase()}`,
      description: `Hiện chưa có khóa học nào thuộc nhóm ${activeStatusLabel.toLowerCase()}.`
    };
  }, [activeStatusLabel, statusFilter, trimmedSearchTerm]);

  // Render
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

      {/* Loading State */}
      {loading && courses.length === 0 && shouldShowCourseShell && (
        <div className="mentor-hud-loading">
          <MeowlKuruLoader size="small" />
          <p>Đang tải khóa học...</p>
        </div>
      )}

      {/* Global Empty State */}
      {shouldShowGlobalEmpty && (
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

      {/* Course Shell */}
      {shouldShowCourseShell && (
        <>
          <div className="mentor-hud-courses__filters">
            <input
              type="text"
              className="mentor-hud-courses__search-input"
              placeholder="Tìm kiếm khóa học theo tên, mô tả, danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mentor-hud-filter-tabs">
            {(['ALL', CourseStatus.DRAFT, CourseStatus.PENDING, CourseStatus.PUBLIC, CourseStatus.REJECTED, CourseStatus.SUSPENDED, CourseStatus.ARCHIVED] as const).map((status) => {
              const label = getStatusFilterLabel(status);
              const statKey = status === 'ALL' ? 'ALL' : status as string;
              const count = courseStats?.[statKey] ?? 0;

              return (
                <button
                  key={status}
                  className={`mentor-hud-filter-tab${statusFilter === status ? ' active' : ''}`}
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                >
                  <span>{label}</span>
                  {count > 0 && <span className="mentor-hud-tab-badge">{count}</span>}
                </button>
              );
            })}
          </div>

          {filteredEmpty && (
            <div className="mentor-hud-empty mentor-hud-empty--compact">
              <div className="mentor-hud-empty--compact-copy">
                <h3>{filteredEmptyCopy.title}</h3>
                <p>{filteredEmptyCopy.description}</p>
              </div>
              <button
                className="mentor-hud-create-button mentor-hud-empty--compact-cta"
                onClick={() => navigate('/mentor/courses/create')}
              >
                <Plus className="w-5 h-5" />
                Tạo Khóa Học Mới
              </button>
            </div>
          )}

          {visibleCourses.length > 0 && (
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
              {visibleCourses.map((course) => {
              const revisionHistory = courseRevisions[course.id] ?? [];
              const actionableRevision = getActionableRevision(course.id);
              const latestRevision = revisionHistory[0];

              return (
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
                      onClick={() => handleOpenCourseView(course, latestRevision)}
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

                  {course.status === CourseStatus.PUBLIC && (
                    <>
                      {!actionableRevision && (
                        <button
                          className="mentor-hud-action-button mentor-hud-submit-button"
                          onClick={() => handleCreateRevision(course)}
                          disabled={revisionLoadingCourseId === course.id}
                          title="Tạo phiên bản nháp để cập nhật khóa học đã xuất bản"
                        >
                          <PenTool className="w-4 h-4" />
                          Cập nhật phiên bản
                        </button>
                      )}

                      {actionableRevision && (
                        <>
                          {(actionableRevision.status === 'DRAFT' ||
                            actionableRevision.status === 'REJECTED') && (
                            <button
                              className="mentor-hud-action-button mentor-hud-edit-button"
                              onClick={() => handleUpdateRevision(course)}
                              disabled={revisionLoadingCourseId === course.id}
                              title="Mở phiên bản nháp để chỉnh sửa"
                            >
                              <Edit3 className="w-4 h-4" />
                              Tiếp tục phiên bản
                            </button>
                          )}

                          {actionableRevision.status === 'PENDING' && (
                            <button
                              className="mentor-hud-action-button mentor-hud-view-button"
                              disabled={true}
                              title="Revision đang chờ admin duyệt"
                            >
                              <Clock className="w-4 h-4" />
                              Phiên bản chờ duyệt
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {latestRevision && (
                    <button
                      className="mentor-hud-action-button mentor-hud-view-button"
                      onClick={() => void handleOpenRevisionHistory(course)}
                      title="Xem lịch sử phiên bản"
                    >
                      <Eye className="w-4 h-4" />
                      Lịch sử phiên bản
                    </button>
                  )}

                  {/* Xóa/Lưu trữ — ẩn cho ARCHIVED/SUSPENDED */}
                  {(course.status !== CourseStatus.ARCHIVED && course.status !== CourseStatus.SUSPENDED) ? (
                    <button
                      className="mentor-hud-action-button mentor-hud-delete-button"
                      onClick={() => handleDeleteCourse(course.id)}
                      disabled={loading}
                      title="Lưu trữ khóa học"
                    >
                      <><Archive className="w-4 h-4" /> Lưu trữ</>
                    </button>
                  ) : null}
                </div>

              </div>
              </div>
            )})}
            </div>
          )}
          {visibleCourses.length > 0 && (
            <Pagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {renderRevisionHistoryModal()}

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

