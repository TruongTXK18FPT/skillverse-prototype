import React, { useState, useEffect, useCallback } from 'react';
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
import '../../styles/ModalsEnhanced.css';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { ChevronDown, ChevronUp, BookOpen, FileText, CheckSquare, Code, Layers } from 'lucide-react';
import './CourseApprovalTab.css';

/**
 * CourseApprovalTab - Quản lý duyệt khóa học cho Admin
 */
export const CourseApprovalTab: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  // State
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailDTO | null>(null);
  const [courseModules, setCourseModules] = useState<ModuleDetailDTO[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionReason, setActionReason] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('submittedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load pending courses
  const loadPendingCourses = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await listPendingCourses(
        page,
        size,
        sortBy,
        sortOrder
      );

      setCourses(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error loading pending courses:', error);
      showError('Lỗi', 'Không thể tải danh sách khóa học chờ duyệt');
    } finally {
      setLoading(false);
    }
  }, [user, page, size, sortBy, sortOrder, showError]);

  // Load course details with modules
  const loadCourseDetails = async (courseId: number) => {
    if (!user) return;

    setLoading(true);
    try {
      const course = await getCourse(courseId);
      setSelectedCourse(course);
      
      // Load modules with lessons & quizzes
      const modules = await listModulesWithContent(courseId) as any;
      setCourseModules(modules || []);
      setExpandedModules(new Set());
      
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading course details:', error);
      showError('Lỗi', 'Không thể tải chi tiết khóa học');
    } finally {
      setLoading(false);
    }
  };

  // Toggle module expansion
  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Handle approve/reject action
  const handleAction = async () => {
    if (!user || !selectedCourse) return;

    if (actionType === 'reject' && !actionReason.trim()) {
      showWarning('Cảnh báo', 'Vui lòng nhập lý do từ chối');
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        await approveCourse(selectedCourse.id, user.id);
        showSuccess('Thành công', `Đã phê duyệt khóa học "${selectedCourse.title}"`);
      } else {
        await rejectCourse(selectedCourse.id, user.id, actionReason);
        showSuccess('Thành công', `Đã từ chối khóa học "${selectedCourse.title}"`);
      }

      // Reload courses and close modals
      await loadPendingCourses();
      setActionReason('');
      setShowActionModal(false);
      setShowDetailsModal(false);
    } catch (error) {
      console.error(`Error ${actionType}ing course:`, error);
      showError('Lỗi', `Không thể ${actionType === 'approve' ? 'phê duyệt' : 'từ chối'} khóa học`);
    } finally {
      setActionLoading(false);
    }
  };

  // Open action modal
  const openActionModal = (type: 'approve' | 'reject') => {
    setActionType(type);
    setActionReason('');
    setShowActionModal(true);
  };

  // Initial load
  useEffect(() => {
    loadPendingCourses();
  }, [loadPendingCourses]);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Không xác định';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBadgeClass = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'badge-green';
      case 'INTERMEDIATE': return 'badge-yellow';
      case 'ADVANCED': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'Cơ bản';
      case 'INTERMEDIATE': return 'Trung cấp';
      case 'ADVANCED': return 'Nâng cao';
      default: return level;
    }
  };

  return (
    <div className="course-approval-container">
      {/* Header with filters */}
      <div className="approval-header">
        <div className="filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
          >
            <option value="submittedDate">Ngày gửi</option>
            <option value="title">Tiêu đề</option>
            <option value="authorName">Tác giả</option>
          </select>

          <select
            className="filter-select"
            value={sortOrder}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Mới nhất</option>
            <option value="asc">Cũ nhất</option>
          </select>

          <button className="btn-primary" onClick={loadPendingCourses} disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {/* Statistics */}
        <div className="stats-group">
          <span className="stat-badge">Tổng chờ duyệt: {totalElements}</span>
          <span className="stat-badge">Trang: {page + 1} / {totalPages || 1}</span>
        </div>
      </div>

      {/* Courses table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">Đang tải...</div>
        ) : courses.length === 0 ? (
          <div className="empty-state">Không có khóa học chờ duyệt</div>
        ) : (
          <table className="courses-table">
            <thead>
              <tr>
                <th>Tiêu đề khóa học</th>
                <th>Tác giả</th>
                <th>Cấp độ</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-title-cell">
                      <strong>{course.title}</strong>
                      <small>{course.shortDescription || course.description}</small>
                    </div>
                  </td>
                  <td>{course.authorName || `${course.author.firstName} ${course.author.lastName}`}</td>
                  <td>
                    <span className={`badge ${getBadgeClass(course.level)}`}>
                      {getLevelText(course.level)}
                    </span>
                  </td>
                  <td>{formatDate(course.submittedDate)}</td>
                  <td>
                    <span className="badge badge-orange">Chờ duyệt</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => loadCourseDetails(course.id)}
                        title="Xem chi tiết"
                      >
                        👁️
                      </button>
                      <button
                        className="btn-icon btn-approve"
                        onClick={() => {
                          setSelectedCourse(course as any);
                          openActionModal('approve');
                        }}
                        title="Phê duyệt"
                      >
                        ✓
                      </button>
                      <button
                        className="btn-icon btn-reject"
                        onClick={() => {
                          setSelectedCourse(course as any);
                          openActionModal('reject');
                        }}
                        title="Từ chối"
                      >
                        ✗
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
        <div className="pagination">
          <button
            className="btn-secondary"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Trang trước
          </button>
          <span>Trang {page + 1} / {totalPages}</span>
          <button
            className="btn-secondary"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Trang sau
          </button>
          <select
            className="filter-select"
            value={size}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      )}

      {/* Course Details Modal */}
      {showDetailsModal && selectedCourse && (
        <div className="module-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="module-modal-content course-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="module-modal-header">
              <h2 className="module-modal-title">Chi tiết khóa học</h2>
              <button className="module-modal-close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="module-modal-form">
              <div className="course-detail-header">
                {selectedCourse.thumbnailUrl && (
                  <img src={selectedCourse.thumbnailUrl} alt={selectedCourse.title} className="course-thumbnail-large" />
                )}
                <div className="course-header-info">
                  <h3>{selectedCourse.title}</h3>
                  <p className="course-description-short">{selectedCourse.shortDescription || selectedCourse.description}</p>

                  <div className="course-meta">
                    <span className={`badge ${getBadgeClass(selectedCourse.level)}`}>
                      {getLevelText(selectedCourse.level)}
                    </span>
                    <span className="badge badge-orange">Chờ duyệt</span>
                    <span className="author-info">
                      👤 {selectedCourse.authorName || `${selectedCourse.author.firstName} ${selectedCourse.author.lastName}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="course-description-full">
                <h4>Mô tả chi tiết</h4>
                <p>{selectedCourse.description}</p>
              </div>

              <div className="course-stats-grid">
                <div className="stat-card">
                  <Layers className="stat-icon" />
                  <div>
                    <div className="stat-number">{selectedCourse.modules?.length || 0}</div>
                    <div className="cv-stat-label">Chương học</div>
                  </div>
                </div>
                <div className="stat-card">
                  <BookOpen className="stat-icon" />
                  <div>
                    <div className="stat-number">{courseModules.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0)}</div>
                    <div className="cv-stat-label">Bài học</div>
                  </div>
                </div>
                <div className="stat-card">
                  <CheckSquare className="stat-icon" />
                  <div>
                    <div className="stat-number">{selectedCourse.enrollmentCount}</div>
                    <div className="cv-stat-label">Học viên</div>
                  </div>
                </div>
              </div>

              {/* Modules and Content */}
              <div className="course-modules-section">
                <h4>Nội dung khóa học ({courseModules.length} chương)</h4>
                {courseModules.length === 0 ? (
                  <p className="empty-message">Khóa học chưa có chương nào</p>
                ) : (
                  <div className="modules-list">
                    {courseModules.map((module, index) => (
                      <div key={module.id} className="module-item">
                        <div 
                          className="module-header"
                          onClick={() => toggleModule(module.id)}
                        >
                          <div className="module-title-section">
                            <span className="module-number">Chương {index + 1}</span>
                            <h5>{module.title}</h5>
                          </div>
                          <div className="module-stats">
                            <span>{module.lessons?.length || 0} bài học</span>
                            {expandedModules.has(module.id) ? 
                              <ChevronUp size={20} /> : 
                              <ChevronDown size={20} />
                            }
                          </div>
                        </div>
                        
                        {expandedModules.has(module.id) && (
                          <div className="module-content">
                            {module.description && (
                              <p className="module-description">{module.description}</p>
                            )}
                            
                            {module.lessons && module.lessons.length > 0 ? (
                              <div className="lessons-list">
                                <h6>Danh sách bài học:</h6>
                                {module.lessons.map((lesson: any, lessonIndex: number) => (
                                  <div key={lesson.id} className="lesson-item">
                                    <div className="lesson-icon">
                                      {lesson.type === 'VIDEO' && <BookOpen size={16} />}
                                      {lesson.type === 'DOCUMENT' && <FileText size={16} />}
                                      {lesson.type === 'QUIZ' && <CheckSquare size={16} />}
                                      {lesson.type === 'CODE' && <Code size={16} />}
                                    </div>
                                    <div className="lesson-info">
                                      <span className="lesson-number">Bài {lessonIndex + 1}:</span>
                                      <span className="lesson-title">{lesson.title}</span>
                                      <span className="lesson-type">{lesson.type}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="empty-message">Chương này chưa có bài học</p>
                            )}

                            {module.quizzes && module.quizzes.length > 0 && (
                              <div className="lessons-list" style={{ marginTop: '1rem' }}>
                                <h6>Quiz trong chương:</h6>
                                {module.quizzes.map((quiz: any, qIndex: number) => (
                                  <div key={quiz.id} className="lesson-item">
                                    <div className="lesson-icon">
                                      <CheckSquare size={16} />
                                    </div>
                                    <div className="lesson-info">
                                      <span className="lesson-number">Quiz {qIndex + 1}:</span>
                                      <span className="lesson-title">{quiz.title}</span>
                                      <span className="lesson-type">{`Câu hỏi: ${quiz.questionCount ?? 0}`}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="course-dates">
                <div><strong>Ngày tạo:</strong> {formatDate(selectedCourse.createdAt)}</div>
                <div><strong>Ngày cập nhật:</strong> {formatDate(selectedCourse.updatedAt)}</div>
                {selectedCourse.submittedDate && (
                  <div><strong>Ngày gửi duyệt:</strong> {formatDate(selectedCourse.submittedDate)}</div>
                )}
              </div>
            </div>
            <div className="module-form-actions">
              <button className="btn-success" onClick={() => openActionModal('approve')}>
                ✓ Phê duyệt
              </button>
              <button className="btn-danger" onClick={() => openActionModal('reject')}>
                ✗ Từ chối
              </button>
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showActionModal && selectedCourse && (
        <div className="module-modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="module-modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="module-modal-header">
              <h2 className="module-modal-title">{actionType === 'approve' ? 'Phê duyệt' : 'Từ chối'} khóa học</h2>
              <button className="module-modal-close-btn" onClick={() => setShowActionModal(false)}>×</button>
            </div>
            <div className="module-modal-form">
              <p>Bạn có chắc chắn muốn {actionType === 'approve' ? 'phê duyệt' : 'từ chối'} khóa học này?</p>
              <strong>"{selectedCourse.title}"</strong>

              <div className="form-group">
                <label>
                  {actionType === 'reject' ? 'Lý do từ chối (bắt buộc):' : 'Ghi chú (tùy chọn):'}
                </label>
                <textarea
                  className="form-textarea"
                  value={actionReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionReason(e.target.value)}
                  placeholder={
                    actionType === 'reject'
                      ? 'Vui lòng nhập lý do từ chối khóa học'
                      : 'Ghi chú cho việc phê duyệt (nếu có)'
                  }
                  rows={4}
                />
              </div>
            </div>
            <div className="module-form-actions">
              <button
                className={actionType === 'approve' ? 'btn-success' : 'btn-danger'}
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' : `Xác nhận ${actionType === 'approve' ? 'phê duyệt' : 'từ chối'}`}
              </button>
              <button className="btn-secondary" onClick={() => setShowActionModal(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
