import React, { useState, useEffect } from 'react';
import {
  BookOpen, Search, Filter, Eye, CheckCircle, XCircle, 
  Clock, User, Calendar, Star, ChevronLeft, ChevronRight, Award, Layers, Play, FileText, X
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
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);

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
                    {courseModules.map((module, idx) => (
                      <div key={module.id} className="module-detail-card" style={{
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px',
                        background: 'rgba(139, 92, 246, 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <Layers size={20} style={{ color: '#8b5cf6' }} />
                          <div>
                            <h5 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Module {idx + 1}: {module.title}</h5>
                            {module.description && (
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#9ca3af' }}>{module.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Lessons */}
                        {module.lessons && module.lessons.length > 0 && (
                          <div style={{ marginTop: '12px', paddingLeft: '32px' }}>
                            <h6 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#6366f1' }}>
                              📚 Bài học ({module.lessons.length})
                            </h6>
                            {module.lessons.map((lesson: any) => (
                              <div 
                                key={lesson.id} 
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    const lessonDetail = await getLessonById(lesson.id);
                                    setSelectedLesson(lessonDetail);
                                    setShowLessonModal(true);
                                  } catch (error) {
                                    console.error('Error loading lesson detail:', error);
                                    showError('Lỗi', 'Không thể tải chi tiết bài học');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                style={{
                                  padding: '8px 12px',
                                  background: 'rgba(99, 102, 241, 0.1)',
                                  borderRadius: '8px',
                                  marginBottom: '6px',
                                  fontSize: '0.9rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                                  e.currentTarget.style.transform = 'translateX(4px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                  e.currentTarget.style.transform = 'translateX(0)';
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• {lesson.title}</span>
                                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: '#6b7280', alignItems: 'center' }}>
                                    <span>{lesson.type}</span>
                                    <span>{lesson.durationSec ? `${Math.floor(lesson.durationSec / 60)}m` : ''}</span>
                                    <Eye size={14} style={{ color: '#6366f1' }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Quizzes */}
                        {module.quizzes && module.quizzes.length > 0 && (
                          <div style={{ marginTop: '12px', paddingLeft: '32px' }}>
                            <h6 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#10b981' }}>
                              ❓ Quiz ({module.quizzes.length})
                            </h6>
                            {module.quizzes.map((quiz: any) => (
                              <div key={quiz.id} style={{
                                padding: '8px 12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '8px',
                                marginBottom: '6px',
                                fontSize: '0.9rem'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• {quiz.title}</span>
                                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                    {quiz.questionCount || 0} câu hỏi • Điểm đạt: {quiz.passScore}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Assignments */}
                        {module.assignments && module.assignments.length > 0 && (
                          <div style={{ marginTop: '12px', paddingLeft: '32px' }}>
                            <h6 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#f59e0b' }}>
                              📝 Bài tập ({module.assignments.length})
                            </h6>
                            {module.assignments.map((assignment: any) => (
                              <div key={assignment.id} style={{
                                padding: '8px 12px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderRadius: '8px',
                                marginBottom: '6px',
                                fontSize: '0.9rem'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>• {assignment.title}</span>
                                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                    {assignment.submissionType} • Max: {assignment.maxScore} điểm
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Empty state */}
                        {(!module.lessons || module.lessons.length === 0) && 
                         (!module.quizzes || module.quizzes.length === 0) && 
                         (!module.assignments || module.assignments.length === 0) && (
                          <div style={{ 
                            padding: '16px', 
                            textAlign: 'center', 
                            color: '#9ca3af',
                            fontSize: '0.9rem',
                            fontStyle: 'italic'
                          }}>
                            Module này chưa có nội dung
                          </div>
                        )}
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

      {/* Lesson Detail Modal */}
      {showLessonModal && selectedLesson && (
        <div className="cosmic-modal-overlay" onClick={() => setShowLessonModal(false)}>
          <div className="cosmic-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>Chi Tiết Bài Học</h2>
              <button className="close-btn" onClick={() => setShowLessonModal(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '12px' }}>
                  {selectedLesson.title}
                </h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#6b7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {selectedLesson.type === 'VIDEO' ? <Play size={16} /> : <FileText size={16} />}
                    {selectedLesson.type}
                  </span>
                  {selectedLesson.durationSec && (
                    <span>⏱️ {Math.floor(selectedLesson.durationSec / 60)} phút</span>
                  )}
                  <span>📍 Thứ tự: {selectedLesson.orderIndex}</span>
                </div>
              </div>

              {/* Video Content */}
              {selectedLesson.type === 'VIDEO' && selectedLesson.videoUrl && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px' }}>Video</h4>
                  <div style={{ 
                    background: '#000', 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    aspectRatio: '16/9'
                  }}>
                    <video 
                      controls 
                      style={{ width: '100%', height: '100%' }}
                      src={selectedLesson.videoUrl}
                    >
                      Trình duyệt không hỗ trợ video.
                    </video>
                  </div>
                  {selectedLesson.videoUrl && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px' }}>
                      🔗 URL: {selectedLesson.videoUrl}
                    </p>
                  )}
                </div>
              )}

              {/* Reading Content */}
              {selectedLesson.type === 'READING' && selectedLesson.contentText && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px' }}>Nội dung bài đọc</h4>
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '12px',
                    padding: '20px',
                    lineHeight: '1.8',
                    fontSize: '1rem',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedLesson.contentText}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {selectedLesson.type === 'VIDEO' && !selectedLesson.videoUrl && (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#9ca3af',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '12px'
                }}>
                  <Play size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>Bài học này chưa có video</p>
                </div>
              )}

              {selectedLesson.type === 'READING' && !selectedLesson.contentText && (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#9ca3af',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '12px'
                }}>
                  <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>Bài học này chưa có nội dung</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowLessonModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
