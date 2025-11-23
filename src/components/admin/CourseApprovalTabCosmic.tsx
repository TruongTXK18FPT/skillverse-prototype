import React, { useState, useEffect } from 'react';
import {
  BookOpen, Search, Filter, Eye, CheckCircle, XCircle, 
  Clock, User, Calendar, Star, ChevronLeft, ChevronRight, Award, Layers
} from 'lucide-react';
import {
  listPendingCourses,
  approveCourse,
  rejectCourse,
  getCourse
} from '../../services/courseService';
import {
  CourseDetailDTO,
  CourseSummaryDTO
} from '../../data/courseDTOs';
import { listModulesWithContent, ModuleDetailDTO } from '../../services/moduleService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import './CourseApprovalTabCosmic.css';

export const CourseApprovalTabCosmic: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  // State
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailDTO | null>(null);
  const [courseModules, setCourseModules] = useState<ModuleDetailDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionReason, setActionReason] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submittedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    avgRating: 0
  });

  useEffect(() => {
    if (user) {
      loadPendingCourses();
    }
  }, [currentPage, sortBy, sortOrder, user]);

  const loadPendingCourses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await listPendingCourses(
        currentPage - 1,
        itemsPerPage,
        sortBy,
        sortOrder
      );
      setCourses(response.content);
      setTotalPages(response.totalPages);
      
      // Calculate stats
      setStats({
        totalPending: response.totalElements,
        totalApproved: 0, // Would need separate API
        totalRejected: 0, // Would need separate API
        avgRating: 0
      });
    } catch (error) {
      console.error('Error loading courses:', error);
      showError('Lỗi', 'Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (course: CourseSummaryDTO) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const details = await getCourse(course.id);
      const modules = await listModulesWithContent(course.id) as any;
      
      setSelectedCourse(details);
      setCourseModules(modules);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading course details:', error);
      showError('Lỗi', 'Không thể tải chi tiết khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type: 'approve' | 'reject', course: CourseSummaryDTO) => {
    setSelectedCourse(course as any);
    setActionType(type);
    setActionReason('');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedCourse || !user) return;

    if (actionType === 'reject' && !actionReason.trim()) {
      showWarning('Cảnh báo', 'Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setLoading(true);
      if (actionType === 'approve') {
        await approveCourse(selectedCourse.id, user.id);
        showSuccess('Thành công', 'Đã duyệt khóa học thành công');
      } else {
        await rejectCourse(selectedCourse.id, user.id, actionReason);
        showSuccess('Thành công', 'Đã từ chối khóa học');
      }
      
      setShowActionModal(false);
      loadPendingCourses();
    } catch (error) {
      console.error('Error processing action:', error);
      showError('Lỗi', 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCourses = () => {
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const getCurrentPageCourses = () => {
    const filtered = getFilteredCourses();
    return filtered;
  };

  return (
    <div className="cosmic-course-approval">
      {/* Header Stats */}
      <div className="course-approval-stats-grid">
        <div className="course-approval-stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalPending}</div>
            <div className="stat-label">Chờ Duyệt</div>
          </div>
        </div>

        <div className="course-approval-stat-card approved">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalApproved}</div>
            <div className="stat-label">Đã Duyệt</div>
          </div>
        </div>

        <div className="course-approval-stat-card rejected">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalRejected}</div>
            <div className="stat-label">Đã Từ Chối</div>
          </div>
        </div>

        <div className="course-approval-stat-card rating">
          <div className="stat-icon">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgRating.toFixed(1)}</div>
            <div className="stat-label">Đánh Giá TB</div>
          </div>
        </div>
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

        <button className="cosmic-filter-btn">
          <Filter size={18} />
          Lọc
        </button>
      </div>

      {/* Courses Table */}
      <div className="cosmic-table-container">
        {loading ? (
          <div className="cosmic-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : getCurrentPageCourses().length === 0 ? (
          <div className="cosmic-empty-state">
            <BookOpen size={64} />
            <h3>Không có khóa học chờ duyệt</h3>
            <p>Tất cả khóa học đã được xử lý</p>
          </div>
        ) : (
          <table className="cosmic-table">
            <thead>
              <tr>
                <th>Khóa Học</th>
                <th>Giảng Viên</th>
                <th>Danh Mục</th>
                <th>Ngày Gửi</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentPageCourses().map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-info">
                      <div className="course-thumbnail">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} />
                        ) : (
                          <BookOpen size={24} />
                        )}
                      </div>
                      <div>
                        <div className="course-title">{course.title}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="instructor-info">
                      <User size={16} />
                      <span>Instructor</span>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{course.level}</span>
                  </td>
                  <td>
                    <div className="date-info">
                      <Calendar size={16} />
                      <span>{new Date(course.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${course.status?.toLowerCase()}`}>
                      {course.status === 'PENDING' ? 'Chờ duyệt' : course.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={() => handleViewDetails(course)}
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="action-btn approve"
                        onClick={() => handleAction('approve', course)}
                        title="Duyệt"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        className="action-btn reject"
                        onClick={() => handleAction('reject', course)}
                        title="Từ chối"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="cosmic-pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} />
            Trước
          </button>

          <div className="pagination-info">
            Trang {currentPage} / {totalPages}
          </div>

          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCourse && (
        <div className="cosmic-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="cosmic-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi Tiết Khóa Học</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="course-detail-section">
                <h3>{selectedCourse.title}</h3>
                
                <div className="detail-grid">
                  <div className="detail-item">
                    <User size={18} />
                    <div>
                      <div className="label">Giảng viên</div>
                      <div className="value">Instructor</div>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <BookOpen size={18} />
                    <div>
                      <div className="label">Tác giả</div>
                      <div className="value">{selectedCourse.authorName || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <Award size={18} />
                    <div>
                      <div className="label">Cấp độ</div>
                      <div className="value">{selectedCourse.level}</div>
                    </div>
                  </div>
                </div>

                <div className="description">
                  <h4>Mô tả</h4>
                  <p>{selectedCourse.description}</p>
                </div>

                {courseModules.length > 0 && (
                  <div className="modules-section">
                    <h4>Nội dung khóa học ({courseModules.length} modules)</h4>
                    {courseModules.map((module) => (
                      <div key={module.id} className="module-item">
                        <Layers size={16} />
                        <span>{module.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Đóng
              </button>
              <button className="btn-approve" onClick={() => {
                setShowDetailsModal(false);
                handleAction('approve', selectedCourse as any);
              }}>
                <CheckCircle size={18} />
                Duyệt
              </button>
              <button className="btn-reject" onClick={() => {
                setShowDetailsModal(false);
                handleAction('reject', selectedCourse as any);
              }}>
                <XCircle size={18} />
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="cosmic-modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="cosmic-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{actionType === 'approve' ? 'Duyệt Khóa Học' : 'Từ Chối Khóa Học'}</h2>
              <button className="close-btn" onClick={() => setShowActionModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <p>
                {actionType === 'approve' 
                  ? 'Bạn có chắc chắn muốn duyệt khóa học này?' 
                  : 'Vui lòng nhập lý do từ chối:'}
              </p>
              
              {actionType === 'reject' && (
                <textarea
                  className="reason-input"
                  placeholder="Nhập lý do từ chối..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={4}
                />
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowActionModal(false)}>
                Hủy
              </button>
              <button 
                className={actionType === 'approve' ? 'btn-approve' : 'btn-reject'}
                onClick={confirmAction}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : (actionType === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
