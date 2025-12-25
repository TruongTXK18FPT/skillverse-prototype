import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  BookOpen, Search, Eye, CheckCircle, XCircle,
  Clock, User, Calendar, Star, ChevronLeft, ChevronRight, 
  Award, Layers, Play, FileText, RefreshCw
} from 'lucide-react';
import {
  listPendingCourses,
  approveCourse,
  rejectCourse,
  getCourse
} from '../../services/courseService';
import { getLessonById } from '../../services/lessonService';
import {
  CourseDetailDTO,
  CourseSummaryDTO
} from '../../data/courseDTOs';
import { listModulesWithContent, ModuleDetailDTO } from '../../services/moduleService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { NeuralCard } from '../learning-hud';
import './CourseApprovalTabCosmic.css';

// ==================== TYPES ====================
interface CourseStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  avgRating: number;
}

export const CourseApprovalTabCosmic: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  // ==================== STATE ====================
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailDTO | null>(null);
  const [courseModules, setCourseModules] = useState<ModuleDetailDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  
  // Action states  
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy] = useState('submittedDate');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState<CourseStats>({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    avgRating: 0
  });

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (user) {
      loadPendingCourses();
    }
  }, [currentPage, sortBy, sortOrder, user]);

  // Scroll lock for modals
  useEffect(() => {
    if (showDetailsModal || showActionModal || showLessonModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailsModal, showActionModal, showLessonModal]);

  // ==================== API HANDLERS ====================
  const loadPendingCourses = useCallback(async () => {
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
      setStats(prev => ({
        ...prev,
        totalPending: response.totalElements
      }));
    } catch (error) {
      console.error('Error loading courses:', error);
      showError('Lỗi', 'Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, sortBy, sortOrder, showError]);

  const handleViewDetails = async (course: CourseSummaryDTO) => {
    if (!user) return;

    try {
      setLoading(true);
      const [details, modules] = await Promise.all([
        getCourse(course.id),
        listModulesWithContent(course.id)
      ]);
      setSelectedCourse(details);
      setCourseModules(modules as ModuleDetailDTO[]);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading course details:', error);
      showError('Lỗi', 'Không thể tải chi tiết khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type: 'approve' | 'reject', course: CourseSummaryDTO) => {
    setSelectedCourse(course as unknown as CourseDetailDTO);
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
      setActionLoading(true);
      if (actionType === 'approve') {
        await approveCourse(selectedCourse.id, user.id);
        showSuccess('Thành công', 'Đã duyệt khóa học thành công');
      } else {
        await rejectCourse(selectedCourse.id, user.id, actionReason);
        showSuccess('Thành công', 'Đã từ chối khóa học');
      }
      setShowActionModal(false);
      setShowDetailsModal(false);
      loadPendingCourses();
    } catch (error) {
      console.error('Error processing action:', error);
      showError('Lỗi', 'Có lỗi xảy ra khi xử lý yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewLesson = async (lessonId: number) => {
    try {
      setLoading(true);
      const lessonDetail = await getLessonById(lessonId);
      setSelectedLesson(lessonDetail);
      setShowLessonModal(true);
    } catch (error) {
      console.error('Error loading lesson detail:', error);
      showError('Lỗi', 'Không thể tải chi tiết bài học');
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPERS ====================
  const getFilteredCourses = (): CourseSummaryDTO[] => {
    if (!searchTerm.trim()) return courses;
    return courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'PUBLIC': return 'Đã duyệt';
      case 'DRAFT': return 'Nháp';
      case 'ARCHIVED': return 'Đã lưu trữ';
      default: return status || 'N/A';
    }
  };

  // ==================== RENDER ====================
  const filteredCourses = getFilteredCourses();

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

        <div className="course-approval-stat-card rating">
          <div className="cosmic-stat-icon">
            <Star size={24} />
          </div>
          <div className="cosmic-stat-content">
            <div className="cosmic-stat-value">{stats.avgRating.toFixed(1)}</div>
            <div className="cosmic-stat-label">Đánh Giá TB</div>
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
        <button className="cosmic-filter-btn" onClick={loadPendingCourses}>
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
        ) : filteredCourses.length === 0 ? (
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
                <th>Cấp độ</th>
                <th>Ngày Gửi</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
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
                      <span>{course.authorName || 'N/A'}</span>
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
                  <td>
                    <div className="cosmic-action-buttons">
                      <button
                        className="cosmic-action-btn view"
                        onClick={() => handleViewDetails(course)}
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="cosmic-action-btn approve"
                        onClick={() => handleAction('approve', course)}
                        title="Duyệt"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        className="cosmic-action-btn reject"
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
            className="cosmic-pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} /> Trước
          </button>

          <div className="cosmic-pagination-info">
            Trang {currentPage} / {totalPages}
          </div>

          <button
            className="cosmic-pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCourse && ReactDOM.createPortal(
        <div className="cosmic-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="cosmic-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cosmic-modal-header">
              <h2>Chi Tiết Khóa Học</h2>
              <button className="cosmic-close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            
            <div className="cosmic-modal-body">
              <div className="cosmic-course-detail-section">
                <h3>{selectedCourse.title}</h3>
                <p className="subtitle">{selectedCourse.authorName || 'N/A'}</p>
              </div>
              
              <div className="cosmic-detail-grid">
                <div className="cosmic-detail-item">
                  <User size={18} />
                  <div>
                    <div className="label">Tác giả</div>
                    <div className="value">{selectedCourse.authorName || 'N/A'}</div>
                  </div>
                </div>
                
                <div className="cosmic-detail-item">
                  <Award size={18} />
                  <div>
                    <div className="label">Cấp độ</div>
                    <div className="value">{selectedCourse.level}</div>
                  </div>
                </div>
              </div>

              <div className="cosmic-description">
                <h4>Mô tả</h4>
                <p>{selectedCourse.description || 'Chưa có mô tả'}</p>
              </div>

              {courseModules.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--lhud-text-primary)', marginBottom: '1rem' }}>
                    Nội dung khóa học ({courseModules.length} modules)
                  </h4>
                  {courseModules.map((module, idx) => (
                    <NeuralCard 
                      key={module.id} 
                      style={{ marginBottom: '1rem', padding: '1.5rem', borderLeft: '3px solid var(--lhud-cyan)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Layers size={20} color="var(--lhud-cyan)" />
                        <div>
                          <h5 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--lhud-text-primary)' }}>
                            Module {idx + 1}: {module.title}
                          </h5>
                          {module.description && (
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--lhud-text-dim)' }}>
                              {module.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lessons */}
                      {module.lessons && module.lessons.length > 0 && (
                        <div style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                          <h6 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--lhud-cyan)' }}>
                            📚 Bài học ({module.lessons.length})
                          </h6>
                          {module.lessons.map((lesson: any) => (
                            <div
                              key={lesson.id}
                              onClick={() => handleViewLesson(lesson.id)}
                              style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--lhud-surface)',
                                borderRadius: '6px',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: '1px solid var(--lhud-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <span style={{ color: 'var(--lhud-text-primary)' }}>• {lesson.title}</span>
                              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--lhud-text-dim)', alignItems: 'center' }}>
                                <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '4px', fontSize: '0.75rem' }}>
                                  {lesson.type}
                                </span>
                                {lesson.duration && <span>{lesson.duration} phút</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Assignments */}
                      {module.assignments && module.assignments.length > 0 && (
                        <div style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                          <h6 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--lhud-green)' }}>
                            ✏️ Bài tập ({module.assignments.length})
                          </h6>
                          {module.assignments.map((assignment: any) => (
                            <div key={assignment.id} style={{ padding: '0.75rem 1rem', background: 'var(--lhud-surface)', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.9rem', border: '1px solid var(--lhud-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--lhud-text-primary)' }}>• {assignment.title}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--lhud-text-dim)' }}>{assignment.maxScore} điểm</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quizzes */}
                      {module.quizzes && module.quizzes.length > 0 && (
                        <div style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                          <h6 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fbbf24' }}>
                            ✅ Bài kiểm tra ({module.quizzes.length})
                          </h6>
                          {module.quizzes.map((quiz: any) => (
                            <div key={quiz.id} style={{ padding: '0.75rem 1rem', background: 'var(--lhud-surface)', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.9rem', border: '1px solid var(--lhud-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--lhud-text-primary)' }}>• {quiz.title}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--lhud-text-dim)' }}>{quiz.passScore}% để đạt</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </NeuralCard>
                  ))}
                </div>
              )}
            </div>

            <div className="cosmic-modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Đóng
              </button>
              <button className="btn-approve" onClick={() => handleAction('approve', selectedCourse as unknown as CourseSummaryDTO)}>
                <CheckCircle size={18} /> Duyệt
              </button>
              <button className="btn-reject" onClick={() => handleAction('reject', selectedCourse as unknown as CourseSummaryDTO)}>
                <XCircle size={18} /> Từ chối
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Action Modal */}
      {showActionModal && selectedCourse && ReactDOM.createPortal(
        <div className="cosmic-modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="cosmic-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="cosmic-modal-header">
              <h2>{actionType === 'approve' ? 'Duyệt Khóa Học' : 'Từ Chối Khóa Học'}</h2>
              <button className="cosmic-close-btn" onClick={() => setShowActionModal(false)}>×</button>
            </div>

            <div className="cosmic-modal-body">
              <p style={{ marginBottom: '1.5rem' }}>
                {actionType === 'approve'
                  ? `Bạn có chắc chắn muốn duyệt khóa học "${selectedCourse.title}"?`
                  : `Vui lòng nhập lý do từ chối khóa học "${selectedCourse.title}"`
                }
              </p>

              {actionType === 'reject' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a5b4fc' }}>
                    Lý do từ chối <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    className="reason-input"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
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
                className={actionType === 'approve' ? 'btn-approve' : 'btn-reject'}
                onClick={confirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' : actionType === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Lesson Modal */}
      {showLessonModal && selectedLesson && ReactDOM.createPortal(
        <div className="cosmic-modal-overlay" onClick={() => setShowLessonModal(false)}>
          <div className="cosmic-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="cosmic-modal-header">
              <h2>Chi Tiết Bài Học</h2>
              <button className="cosmic-close-btn" onClick={() => setShowLessonModal(false)}>×</button>
            </div>

            <div className="cosmic-modal-body">
              <div className="cosmic-course-detail-section">
                <h3>{selectedLesson.title}</h3>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span className="cosmic-category-badge">{selectedLesson.type}</span>
                {selectedLesson.duration && (
                  <span className="cosmic-category-badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                    {selectedLesson.duration} phút
                  </span>
                )}
              </div>

              {/* Video */}
              {selectedLesson.type === 'VIDEO' && selectedLesson.videoUrl && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', background: '#000', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <iframe
                      src={selectedLesson.videoUrl}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Reading Content */}
              {selectedLesson.type === 'READING' && selectedLesson.contentText && (
                <div className="cosmic-description">
                  <h4>Nội dung bài đọc</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{selectedLesson.contentText}</p>
                </div>
              )}

              {/* Empty states */}
              {selectedLesson.type === 'VIDEO' && !selectedLesson.videoUrl && (
                <div className="cosmic-empty-state">
                  <Play size={48} />
                  <p>Bài học này chưa có video</p>
                </div>
              )}

              {selectedLesson.type === 'READING' && !selectedLesson.contentText && (
                <div className="cosmic-empty-state">
                  <FileText size={48} />
                  <p>Bài học này chưa có nội dung</p>
                </div>
              )}
            </div>

            <div className="cosmic-modal-footer">
              <button className="btn-secondary" onClick={() => setShowLessonModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
