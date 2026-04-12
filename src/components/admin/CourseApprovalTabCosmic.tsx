import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Search, Eye, CheckCircle, XCircle,
  Clock, User, Calendar, RefreshCw, ShieldOff,
  ShieldCheck, AlertTriangle, BarChart3
} from 'lucide-react';
import {
  listPendingCourses,
  approveCourse,
  rejectCourse,
  suspendCourse,
  restoreCourse,
  getCourse,
  listAllCoursesAdmin,
  getAdminCourseStats,
  CourseStatsResponse,
  CourseRevisionDTO,
  listAdminCourseRevisions,
  approveCourseRevision,
  rejectCourseRevision
} from '../../services/courseService';
import {
  CourseDetailDTO,
  CourseSummaryDTO,
  CourseStatus
} from '../../data/courseDTOs';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import Pagination from '../shared/Pagination';
import Toast from '../shared/Toast';
import {
  getAutoUpgradeOutcomeClass,
  getAutoUpgradeOutcomeLabel,
  mapReasonCodeToVietnameseMessage
} from '../../utils/courseRevisionMessages';
import './CourseApprovalTabCosmic.css';

// ==================== TYPES ====================
type StatusFilterTab = 'ALL' | 'PENDING' | 'PUBLIC' | 'REJECTED' | 'SUSPENDED';

type RevisionCourseMeta = {
  title: string;
  authorName: string;
  thumbnailUrl?: string;
};

const STATUS_TAB_CONFIG: { key: StatusFilterTab; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL', label: 'Tất Cả', icon: <BarChart3 size={16} /> },
  { key: 'PENDING', label: 'Chờ Duyệt', icon: <Clock size={16} /> },
  { key: 'PUBLIC', label: 'Đã Duyệt', icon: <CheckCircle size={16} /> },
  { key: 'REJECTED', label: 'Đã Từ Chối', icon: <XCircle size={16} /> },
  { key: 'SUSPENDED', label: 'Tạm Khóa', icon: <ShieldOff size={16} /> },
];

export const CourseApprovalTabCosmic: React.FC = () => {
  const { user } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning, showInfo } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ==================== STATE ====================
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [showActionModal, setShowActionModal] = useState(false);
  
  // Action states  
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | 'restore'>('approve');
  const [actionReason, setActionReason] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusFilterTab>('PENDING');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stats from API
  const [stats, setStats] = useState<CourseStatsResponse>({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalSuspended: 0,
    totalDraft: 0,
    totalArchived: 0,
    totalAll: 0
  });
  const [revisionQueue, setRevisionQueue] = useState<CourseRevisionDTO[]>([]);
  const [revisionCourseMeta, setRevisionCourseMeta] = useState<Record<number, RevisionCourseMeta>>({});
  const [revisionQueueLoading, setRevisionQueueLoading] = useState(false);
  const [revisionActionLoading, setRevisionActionLoading] = useState(false);
  const [revisionApproveResults, setRevisionApproveResults] = useState<Record<number, CourseRevisionDTO>>({});
  const [showRevisionRejectModal, setShowRevisionRejectModal] = useState(false);
  const [selectedRevisionForReject, setSelectedRevisionForReject] = useState<CourseRevisionDTO | null>(null);
  const [revisionRejectReason, setRevisionRejectReason] = useState('');

  const getApiErrorMessage = useCallback((error: unknown, fallbackMessage: string) => {
    const responseData = (error as { response?: { data?: unknown } })?.response?.data;
    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === 'object') {
      const responseObject = responseData as { message?: string; error?: string };
      if (responseObject.message?.trim()) {
        return responseObject.message;
      }
      if (responseObject.error?.trim()) {
        return responseObject.error;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }, []);

  // ==================== API HANDLERS (defined before effects) ====================
  const loadStats = useCallback(async () => {
    try {
      const data = await getAdminCourseStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading course stats:', error);
    }
  }, []);

  const loadRevisionQueue = useCallback(async () => {
    try {
      setRevisionQueueLoading(true);
      const response = await listAdminCourseRevisions(0, 20, 'PENDING');
      const queue = response.content ?? [];
      setRevisionQueue(queue);

      const uniqueCourseIds = Array.from(new Set(queue.map(item => item.courseId)));
      const courseMetaEntries = await Promise.all(
        uniqueCourseIds.map(async (courseId) => {
          try {
            const course = await getCourse(courseId);
            return [
              courseId,
              {
                title: course.title || `Course #${courseId}`,
                authorName: course.authorName || 'N/A',
                thumbnailUrl: course.thumbnailUrl
              }
            ] as const;
          } catch {
            return [
              courseId,
              {
                title: `Course #${courseId}`,
                authorName: 'N/A',
                thumbnailUrl: undefined
              }
            ] as const;
          }
        })
      );

      setRevisionCourseMeta(Object.fromEntries(courseMetaEntries));
    } catch (error) {
      console.error('Error loading revision queue:', error);
      showError('Lỗi', 'Không thể tải danh sách revision chờ duyệt');
    } finally {
      setRevisionQueueLoading(false);
    }
  }, [showError]);

  const loadCourses = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let response;
      const search = debouncedSearch.trim() || undefined;

      if (activeTab === 'PENDING' && !search) {
        response = await listPendingCourses(currentPage - 1, itemsPerPage);
      } else if (activeTab === 'ALL') {
        response = await listAllCoursesAdmin(currentPage - 1, itemsPerPage, undefined, search);
      } else {
        response = await listAllCoursesAdmin(currentPage - 1, itemsPerPage, activeTab, search);
      }

      setCourses(response.content);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error loading courses:', error);
      showError('Lỗi', 'Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, activeTab, debouncedSearch, showError]);

  // ==================== EFFECTS ====================
  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchTerm]);

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [currentPage, activeTab, debouncedSearch, user, loadCourses]);

  // Load stats on mount
  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, loadStats]);

  useEffect(() => {
    if (user) {
      void loadRevisionQueue();
    }
  }, [user, loadRevisionQueue]);

  useEffect(() => {
    const requestedStatus = (searchParams.get('status') || 'PENDING').toUpperCase();
    if (
      requestedStatus === 'ALL' ||
      requestedStatus === 'PENDING' ||
      requestedStatus === 'PUBLIC' ||
      requestedStatus === 'REJECTED' ||
      requestedStatus === 'SUSPENDED'
    ) {
      setActiveTab(requestedStatus);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Scroll lock for modals
  useEffect(() => {
    if (showActionModal || showRevisionRejectModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showActionModal, showRevisionRejectModal]);

  const handleViewDetails = (course: CourseSummaryDTO) => {
    navigate(`/admin/courses/${course.id}/preview`, {
      state: { returnTo: '/admin?tab=courses' }
    });
  };

  const handleAction = (type: 'approve' | 'reject' | 'suspend' | 'restore', course: CourseSummaryDTO) => {
    setSelectedCourse(course as unknown as CourseDetailDTO);
    setActionType(type);
    setActionReason('');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedCourse || !user) return;

    if ((actionType === 'reject' || actionType === 'suspend') && !actionReason.trim()) {
      showWarning('Cảnh báo', actionType === 'reject' ? 'Vui lòng nhập lý do từ chối' : 'Vui lòng nhập lý do tạm khóa');
      return;
    }

    try {
      setActionLoading(true);
      let successMessage = '';
      switch (actionType) {
        case 'approve':
          await approveCourse(selectedCourse.id, user.id);
          successMessage = `Đã duyệt khóa học "${selectedCourse.title}".`;
          break;
        case 'reject':
          await rejectCourse(selectedCourse.id, user.id, actionReason);
          successMessage = `Đã từ chối khóa học "${selectedCourse.title}".`;
          break;
        case 'suspend':
          await suspendCourse(selectedCourse.id, user.id, actionReason);
          successMessage = `Đã tạm khóa khóa học "${selectedCourse.title}".`;
          break;
        case 'restore':
          await restoreCourse(selectedCourse.id, user.id);
          successMessage = `Đã khôi phục khóa học "${selectedCourse.title}".`;
          break;
      }
      setShowActionModal(false);
      await Promise.all([loadCourses(), loadStats()]);
      showSuccess('Cập nhật khóa học', successMessage);
    } catch (error) {
      console.error('Error processing action:', error);
      showError(
        'Không thể cập nhật khóa học',
        getApiErrorMessage(error, 'Có lỗi xảy ra khi xử lý yêu cầu.')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([loadCourses(), loadStats(), loadRevisionQueue()]);
      showInfo('Đã làm mới', 'Danh sách khóa học và thống kê đã được cập nhật.');
    } catch (error) {
      showError(
        'Không thể làm mới dữ liệu',
        getApiErrorMessage(error, 'Vui lòng thử lại sau.')
      );
    }
  }, [getApiErrorMessage, loadCourses, loadRevisionQueue, loadStats, showError, showInfo]);

  const handleRefreshRevisionQueue = useCallback(async () => {
    try {
      await loadRevisionQueue();
      showInfo('Đã làm mới', 'Danh sách revision chờ duyệt đã được cập nhật.');
    } catch (error) {
      showError(
        'Không thể làm mới revision queue',
        getApiErrorMessage(error, 'Vui lòng thử lại sau.')
      );
    }
  }, [getApiErrorMessage, loadRevisionQueue, showError, showInfo]);

  const handleRefreshCoursesOnly = useCallback(async () => {
    try {
      await Promise.all([loadCourses(), loadStats()]);
      showInfo('Đã làm mới', 'Danh sách khóa học đã được cập nhật.');
    } catch (error) {
      showError(
        'Không thể làm mới khóa học',
        getApiErrorMessage(error, 'Vui lòng thử lại sau.')
      );
    }
  }, [getApiErrorMessage, loadCourses, loadStats, showError, showInfo]);

  const handleApproveRevision = async (revision: CourseRevisionDTO) => {
    try {
      setRevisionActionLoading(true);
      const result = await approveCourseRevision(revision.id);
      setRevisionApproveResults(prev => ({ ...prev, [revision.id]: result }));
      await Promise.all([loadCourses(), loadStats(), loadRevisionQueue()]);
      const reasonMessage = mapReasonCodeToVietnameseMessage(
        result.autoUpgradeReasonCode,
        result.autoUpgradeReasonDetail
      );
      const isManualPolicyReason = result.autoUpgradeReasonCode === 'POLICY_MANUAL_ONLY';
      const autoUpgradeSummary = isManualPolicyReason
        ? 'Manual-only: learner hiện tại giữ revision cũ và chỉ nâng cấp khi chủ động thao tác.'
        : `Kết quả xử lý nâng cấp: ${getAutoUpgradeOutcomeLabel(result.autoUpgradeOutcome)}. ${reasonMessage}`;
      showSuccess(
        'Duyệt revision thành công',
        `Revision #${result.revisionNumber} (ID: ${result.id}) đã được duyệt. ${autoUpgradeSummary}`
      );
    } catch (error) {
      showError(
        'Không thể duyệt revision',
        getApiErrorMessage(error, 'Vui lòng kiểm tra revision queue hoặc quyền admin.')
      );
    } finally {
      setRevisionActionLoading(false);
    }
  };

  const handleViewRevision = (revision: CourseRevisionDTO) => {
    navigate(`/admin/courses/${revision.courseId}/preview?revisionId=${revision.id}`, {
      state: { returnTo: '/admin?tab=courses' }
    });
  };

  const handleOpenRejectRevisionModal = (revision: CourseRevisionDTO) => {
    setSelectedRevisionForReject(revision);
    setRevisionRejectReason('');
    setShowRevisionRejectModal(true);
  };

  const handleRejectRevision = async () => {
    if (!selectedRevisionForReject) {
      return;
    }

    const reason = revisionRejectReason.trim();
    if (!reason) {
      showWarning('Thiếu lý do', 'Vui lòng nhập lý do từ chối trước khi reject revision.');
      return;
    }

    try {
      setRevisionActionLoading(true);
      const result = await rejectCourseRevision(selectedRevisionForReject.id, reason);
      await Promise.all([loadCourses(), loadStats(), loadRevisionQueue()]);
      setShowRevisionRejectModal(false);
      setSelectedRevisionForReject(null);
      setRevisionRejectReason('');
      showSuccess(
        'Từ chối revision thành công',
        `Revision #${result.revisionNumber} (ID: ${result.id}) đã bị từ chối.`
      );
    } catch (error) {
      showError(
        'Không thể từ chối revision',
        getApiErrorMessage(error, 'Vui lòng kiểm tra revision queue hoặc quyền admin.')
      );
    } finally {
      setRevisionActionLoading(false);
    }
  };

  // ==================== HELPERS ====================
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'PUBLIC': return 'Đã duyệt';
      case 'DRAFT': return 'Nháp';
      case 'ARCHIVED': return 'Đã lưu trữ';
      case 'REJECTED': return 'Đã từ chối';
      case 'SUSPENDED': return 'Tạm khóa';
      default: return status || 'N/A';
    }
  };

  const handleTabChange = (tab: StatusFilterTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
  };

  /**
   * Determine which action buttons to show based on course status
   */
  const getActionButtons = (course: CourseSummaryDTO) => {
    const buttons: React.ReactNode[] = [
      <button
        key="view"
        className="cosmic-action-btn view"
        onClick={() => handleViewDetails(course)}
        title="Xem chi tiết"
      >
        <Eye size={18} />
      </button>
    ];

    if (course.status === CourseStatus.PENDING) {
      buttons.push(
        <button key="approve" className="cosmic-action-btn approve" onClick={() => handleAction('approve', course)} title="Duyệt">
          <CheckCircle size={18} />
        </button>,
        <button key="reject" className="cosmic-action-btn reject" onClick={() => handleAction('reject', course)} title="Từ chối">
          <XCircle size={18} />
        </button>
      );
    }

    if (course.status === CourseStatus.PUBLIC) {
      buttons.push(
        <button key="suspend" className="cosmic-action-btn suspend" onClick={() => handleAction('suspend', course)} title="Tạm khóa">
          <ShieldOff size={18} />
        </button>
      );
    }

    if (course.status === CourseStatus.SUSPENDED) {
      buttons.push(
        <button key="restore" className="cosmic-action-btn restore" onClick={() => handleAction('restore', course)} title="Khôi phục">
          <ShieldCheck size={18} />
        </button>
      );
    }

    return buttons;
  };

  // ==================== RENDER ====================

  return (
    <div className="cosmic-course-approval">
      {/* Header Stats */}
      <div className="course-approval-stats-grid">
        <div className="course-approval-stat-card pending">
          <div className="cosmic-stat-icon">
            <Clock size={24} />
          </div>
          <div className="cosmic-stat-content">
            <div className="cosmic-stat-value">{stats.totalPending}</div>
            <div className="cosmic-stat-label">Chờ Duyệt</div>
          </div>
        </div>

        <div className="course-approval-stat-card approved">
          <div className="cosmic-stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="cosmic-stat-content">
            <div className="cosmic-stat-value">{stats.totalApproved}</div>
            <div className="cosmic-stat-label">Đã Duyệt</div>
          </div>
        </div>

        <div className="course-approval-stat-card rejected">
          <div className="cosmic-stat-icon">
            <XCircle size={24} />
          </div>
          <div className="cosmic-stat-content">
            <div className="cosmic-stat-value">{stats.totalRejected}</div>
            <div className="cosmic-stat-label">Đã Từ Chối</div>
          </div>
        </div>

        <div className="course-approval-stat-card suspended">
          <div className="cosmic-stat-icon">
            <ShieldOff size={24} />
          </div>
          <div className="cosmic-stat-content">
            <div className="cosmic-stat-value">{stats.totalSuspended}</div>
            <div className="cosmic-stat-label">Tạm Khóa</div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="cosmic-status-tabs">
        {STATUS_TAB_CONFIG.map(tab => (
          <button
            key={tab.key}
            className={`cosmic-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.key === 'PENDING' && stats.totalPending > 0 && (
              <span className="cosmic-tab-badge">{stats.totalPending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="cosmic-filters">
        <div className="cosmic-search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học, giảng viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="cosmic-filter-btn" onClick={() => void handleRefresh()}>
          <RefreshCw size={18} /> Làm mới
        </button>
      </div>

      <div className="cosmic-revision-canary-panel">
        <div className="cosmic-revision-canary-header">
          <div>
            <div className="cosmic-revision-canary-title">Course Revision</div>
            <div className="cosmic-revision-canary-subtitle">
              Danh sách phiên bản đang chờ duyệt, có thể duyệt/từ chối trực tiếp.
            </div>
          </div>
          <button
            className="cosmic-filter-btn cosmic-revision-refresh-btn"
            onClick={() => void handleRefreshRevisionQueue()}
            disabled={revisionQueueLoading || revisionActionLoading}
            title="Gọi lại API revision queue"
          >
            <RefreshCw size={16} /> Tải lại revision
          </button>
        </div>

        {revisionQueue.length === 0 ? (
          <div className="cosmic-revision-canary-empty">Không có revision PENDING trong queue.</div>
        ) : (
          <div className="cosmic-table-container cosmic-revision-table-container">
            <table className="cosmic-table cosmic-revision-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Revision</th>
                  <th>Khóa Học</th>
                  <th>Giảng Viên</th>
                  <th>Cấp độ</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Ngày Submitted</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {revisionQueue.map((revision, index) => {
                  const courseMeta = revisionCourseMeta[revision.courseId];
                  const approvedResult = revisionApproveResults[revision.id];
                  return (
                    <tr key={revision.id}>
                      <td className="cosmic-stt-cell">{index + 1}</td>
                      <td>
                        <div className="cosmic-revision-cell-main">Rev #{index + 1}</div>
                      </td>
                      <td>
                        <div className="cosmic-course-info">
                          <div className="cosmic-course-thumbnail">
                            {courseMeta?.thumbnailUrl ? (
                              <img src={courseMeta.thumbnailUrl} alt="" />
                            ) : (
                              <BookOpen size={20} />
                            )}
                          </div>
                          <span>{courseMeta?.title || revision.title || `Course #${revision.courseId}`}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cosmic-instructor-info">
                          <User size={16} />
                          <span>{courseMeta?.authorName || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="cosmic-category-badge">{revision.level || 'N/A'}</span>
                      </td>
                      <td>
                        <span className={`cosmic-status-badge ${revision.status?.toLowerCase() ?? 'draft'}`}>
                          {getStatusLabel(revision.status)}
                        </span>
                      </td>
                      <td>
                        <div className="cosmic-date-info">
                          <Calendar size={16} />
                          <span>{revision.createdAt ? formatDate(revision.createdAt) : 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cosmic-date-info">
                          <Calendar size={16} />
                          <span>{revision.submittedAt ? formatDate(revision.submittedAt) : 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cosmic-action-buttons">
                          <button
                            className="cosmic-action-btn view"
                            onClick={() => handleViewRevision(revision)}
                            title="Xem chi tiết revision"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="cosmic-action-btn approve"
                            onClick={() => void handleApproveRevision(revision)}
                            disabled={revisionActionLoading}
                            title="Approve revision"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            className="cosmic-action-btn reject"
                            onClick={() => handleOpenRejectRevisionModal(revision)}
                            disabled={revisionActionLoading}
                            title="Reject revision"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                        {approvedResult && (
                          <div className="cosmic-revision-result-inline">
                            <span className={`cosmic-revision-upgrade-badge ${getAutoUpgradeOutcomeClass(approvedResult.autoUpgradeOutcome)}`}>
                              {getAutoUpgradeOutcomeLabel(approvedResult.autoUpgradeOutcome)}
                            </span>
                            <span className="cosmic-revision-upgrade-reason">
                              {mapReasonCodeToVietnameseMessage(
                                approvedResult.autoUpgradeReasonCode,
                                approvedResult.autoUpgradeReasonDetail
                              )}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Courses Table */}
      <div className="cosmic-courses-panel-header">
        <div className="cosmic-courses-panel-title">Danh sách khóa học</div>
        <button
          className="cosmic-filter-btn cosmic-courses-refresh-btn"
          onClick={() => void handleRefreshCoursesOnly()}
          disabled={loading || actionLoading}
          title="Gọi lại API danh sách khóa học"
        >
          <RefreshCw size={16} /> Tải lại khóa học
        </button>
      </div>

      <div className="cosmic-table-container">
        {loading ? (
          <div className="cosmic-loading">
            <MeowlKuruLoader size="medium" text="" />
            <p>Đang tải...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="cosmic-empty-state">
            <BookOpen size={64} />
            <h3>Không có khóa học nào</h3>
            <p>{activeTab === 'PENDING' ? 'Tất cả khóa học đã được xử lý' : `Không có khóa học với trạng thái "${getStatusLabel(activeTab)}"`}</p>
          </div>
        ) : (
          <table className="cosmic-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Khóa Học</th>
                <th>Giảng Viên</th>
                <th>Cấp độ</th>
                <th>Ngày Tạo</th>
                <th>Trạng Thái</th>
                {(activeTab === 'REJECTED' || activeTab === 'ALL') && <th>Lý Do</th>}
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={course.id}>
                  <td className="cosmic-stt-cell">{index + 1}</td>
                  <td>
                    <div className="cosmic-course-info">
                      <div className="cosmic-course-thumbnail">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} />
                        ) : (
                          <BookOpen size={24} />
                        )}
                      </div>
                      <div>
                        <div className="cosmic-course-title">{course.title}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cosmic-instructor-info">
                      <User size={16} />
                      <span>{course.authorName || course.author?.fullName || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="cosmic-category-badge">{course.level}</span>
                  </td>
                  <td>
                    <div className="cosmic-date-info">
                      <Calendar size={16} />
                      <span>{formatDate(course.createdAt)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`cosmic-status-badge ${course.status?.toLowerCase()}`}>
                      {getStatusLabel(course.status)}
                    </span>
                  </td>
                  {(activeTab === 'REJECTED' || activeTab === 'ALL') && (
                    <td>
                      {course.rejectionReason && (
                        <span className="cosmic-reason-text" title={course.rejectionReason}>
                          <AlertTriangle size={14} /> {course.rejectionReason.length > 40 ? course.rejectionReason.substring(0, 40) + '...' : course.rejectionReason}
                        </span>
                      )}
                    </td>
                  )}
                  <td>
                    <div className="cosmic-action-buttons">
                      {getActionButtons(course)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        totalItems={totalElements}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Action Modal */}
      {showActionModal && selectedCourse && ReactDOM.createPortal(
        <div className="cosmic-modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="cosmic-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="cosmic-modal-header">
              <h2>
                {actionType === 'approve' && 'Duyệt Khóa Học'}
                {actionType === 'reject' && 'Từ Chối Khóa Học'}
                {actionType === 'suspend' && 'Tạm Khóa Khóa Học'}
                {actionType === 'restore' && 'Khôi Phục Khóa Học'}
              </h2>
              <button className="cosmic-close-btn" onClick={() => setShowActionModal(false)}>×</button>
            </div>

            <div className="cosmic-modal-body">
              <p style={{ marginBottom: '1.5rem' }}>
                {actionType === 'approve' && `Bạn có chắc chắn muốn duyệt khóa học "${selectedCourse.title}"?`}
                {actionType === 'reject' && `Vui lòng nhập lý do từ chối khóa học "${selectedCourse.title}"`}
                {actionType === 'suspend' && `Vui lòng nhập lý do tạm khóa khóa học "${selectedCourse.title}"`}
                {actionType === 'restore' && `Bạn có chắc chắn muốn khôi phục khóa học "${selectedCourse.title}" về trạng thái Công Khai?`}
              </p>

              {(actionType === 'reject' || actionType === 'suspend') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a5b4fc' }}>
                    {actionType === 'reject' ? 'Lý do từ chối' : 'Lý do tạm khóa'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    className="reason-input"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={actionType === 'reject' ? 'Nhập lý do từ chối...' : 'Nhập lý do tạm khóa (vi phạm nội dung, v.v.)...'}
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div className="cosmic-modal-footer">
              <button className="btn-secondary" onClick={() => setShowActionModal(false)} disabled={actionLoading}>
                Hủy
              </button>
              <button 
                className={
                  actionType === 'approve' ? 'btn-approve' :
                  actionType === 'reject' ? 'btn-reject' :
                  actionType === 'suspend' ? 'btn-suspend' :
                  'btn-restore'
                }
                onClick={confirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' :
                  actionType === 'approve' ? 'Xác nhận duyệt' :
                  actionType === 'reject' ? 'Xác nhận từ chối' :
                  actionType === 'suspend' ? 'Xác nhận tạm khóa' :
                  'Xác nhận khôi phục'
                }
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {showRevisionRejectModal && selectedRevisionForReject && ReactDOM.createPortal(
        <div className="cosmic-modal-overlay" onClick={() => setShowRevisionRejectModal(false)}>
          <div className="cosmic-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="cosmic-modal-header">
              <h2>Từ Chối Revision</h2>
              <button className="cosmic-close-btn" onClick={() => setShowRevisionRejectModal(false)}>×</button>
            </div>

            <div className="cosmic-modal-body">
              <p style={{ marginBottom: '1rem' }}>
                Vui lòng nhập lý do từ chối cho revision #{selectedRevisionForReject.revisionNumber} (ID: {selectedRevisionForReject.id}).
              </p>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a5b4fc' }}>
                Lý do từ chối <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="reason-input"
                value={revisionRejectReason}
                onChange={(e) => setRevisionRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối revision..."
                rows={4}
              />
            </div>

            <div className="cosmic-modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowRevisionRejectModal(false)}
                disabled={revisionActionLoading}
              >
                Hủy
              </button>
              <button
                className="btn-reject"
                onClick={() => void handleRejectRevision()}
                disabled={revisionActionLoading}
              >
                {revisionActionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
          countdownText={toast.countdownText}
          actionButton={toast.actionButton}
        />
      )}

    </div>
  );
};
