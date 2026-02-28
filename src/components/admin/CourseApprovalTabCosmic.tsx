import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
  listAllCoursesAdmin,
  getAdminCourseStats,
  CourseStatsResponse
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
import './CourseApprovalTabCosmic.css';

// ==================== TYPES ====================
type StatusFilterTab = 'ALL' | 'PENDING' | 'PUBLIC' | 'REJECTED' | 'SUSPENDED';

const STATUS_TAB_CONFIG: { key: StatusFilterTab; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL', label: 'Tất Cả', icon: <BarChart3 size={16} /> },
  { key: 'PENDING', label: 'Chờ Duyệt', icon: <Clock size={16} /> },
  { key: 'PUBLIC', label: 'Đã Duyệt', icon: <CheckCircle size={16} /> },
  { key: 'REJECTED', label: 'Đã Từ Chối', icon: <XCircle size={16} /> },
  { key: 'SUSPENDED', label: 'Tạm Khóa', icon: <ShieldOff size={16} /> },
];

export const CourseApprovalTabCosmic: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const navigate = useNavigate();

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
  const [totalPages, setTotalPages] = useState(1);
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

  // ==================== API HANDLERS (defined before effects) ====================
  const loadStats = useCallback(async () => {
    try {
      const data = await getAdminCourseStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading course stats:', error);
    }
  }, []);

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
      setTotalPages(response.totalPages);
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

  // Scroll lock for modals
  useEffect(() => {
    if (showActionModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showActionModal]);

  const handleViewDetails = (course: CourseSummaryDTO) => {
    navigate(`/admin/courses/${course.id}/preview`);
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
      switch (actionType) {
        case 'approve':
          await approveCourse(selectedCourse.id, user.id);
          showSuccess('Thành công', 'Đã duyệt khóa học thành công');
          break;
        case 'reject':
          await rejectCourse(selectedCourse.id, user.id, actionReason);
          showSuccess('Thành công', 'Đã từ chối khóa học');
          break;
        case 'suspend':
          await suspendCourse(selectedCourse.id, user.id, actionReason);
          showSuccess('Thành công', 'Đã tạm khóa khóa học');
          break;
        case 'restore':
          await restoreCourse(selectedCourse.id, user.id);
          showSuccess('Thành công', 'Đã khôi phục khóa học');
          break;
      }
      setShowActionModal(false);
      loadCourses();
      loadStats();
    } catch (error) {
      console.error('Error processing action:', error);
      showError('Lỗi', 'Có lỗi xảy ra khi xử lý yêu cầu');
    } finally {
      setActionLoading(false);
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
        <button className="cosmic-filter-btn" onClick={() => { loadCourses(); loadStats(); }}>
          <RefreshCw size={18} /> Làm mới
        </button>
      </div>

      {/* Courses Table */}
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
              {courses.map((course) => (
                <tr key={course.id}>
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

    </div>
  );
};
