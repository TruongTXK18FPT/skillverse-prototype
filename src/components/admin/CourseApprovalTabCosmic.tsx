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
import { NeuralCard, NeuralButton } from '../learning-hud';
import '../learning-hud/learning-hud.css';

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

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    background: 'var(--lhud-surface)',
    border: '1px solid var(--lhud-border)',
    borderRadius: '6px',
    color: 'var(--lhud-text-primary)',
    fontSize: '0.875rem',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s'
  } as const;

  return (
    <div style={{
      padding: '2rem',
      minHeight: '100vh',
      background: 'var(--lhud-deep-space)'
    }}>
      {/* Header Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <NeuralCard style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid var(--lhud-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={24} color="var(--lhud-cyan)" />
            </div>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 600,
                color: 'var(--lhud-cyan)',
                fontFamily: 'Space Habitat, monospace'
              }}>
                {stats.totalPending}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--lhud-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'Space Habitat, monospace'
              }}>
                Chờ Duyệt
              </div>
            </div>
          </div>
        </NeuralCard>

        <NeuralCard style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--lhud-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={24} color="var(--lhud-green)" />
            </div>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 600,
                color: 'var(--lhud-green)',
                fontFamily: 'Space Habitat, monospace'
              }}>
                {stats.totalApproved}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--lhud-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'Space Habitat, monospace'
              }}>
                Đã Duyệt
              </div>
            </div>
          </div>
        </NeuralCard>

        <NeuralCard style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--lhud-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <XCircle size={24} color="var(--lhud-red)" />
            </div>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 600,
                color: 'var(--lhud-red)',
                fontFamily: 'Space Habitat, monospace'
              }}>
                {stats.totalRejected}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--lhud-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'Space Habitat, monospace'
              }}>
                Đã Từ Chối
              </div>
            </div>
          </div>
        </NeuralCard>

        <NeuralCard style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid #fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Star size={24} color="#fbbf24" />
            </div>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 600,
                color: '#fbbf24',
                fontFamily: 'Space Habitat, monospace'
              }}>
                {stats.avgRating.toFixed(1)}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--lhud-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'Space Habitat, monospace'
              }}>
                Đánh Giá TB
              </div>
            </div>
          </div>
        </NeuralCard>
      </div>

      {/* Filters */}
      <NeuralCard style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--lhud-text-dim)'
              }}
            />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học, giảng viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '2.5rem'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
            />
          </div>
          <NeuralButton variant="secondary">
            <Filter size={18} /> Lọc
          </NeuralButton>
        </div>
      </NeuralCard>

      {/* Courses Table */}
      <NeuralCard style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{
            padding: '4rem',
            textAlign: 'center',
            color: 'var(--lhud-cyan)'
          }}>
            <div className="learning-hud-loading" style={{ fontSize: '1rem' }}>
              Đang tải
            </div>
          </div>
        ) : getCurrentPageCourses().length === 0 ? (
          <div style={{
            padding: '4rem',
            textAlign: 'center',
            color: 'var(--lhud-text-dim)'
          }}>
            <BookOpen size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--lhud-text-primary)', marginBottom: '0.5rem' }}>
              Không có khóa học chờ duyệt
            </h3>
            <p>Tất cả khóa học đã được xử lý</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(6, 182, 212, 0.05)',
                  borderBottom: '1px solid var(--lhud-border)'
                }}>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontFamily: 'Space Habitat, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--lhud-cyan)',
                    fontWeight: 600
                  }}>Khóa Học</th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontFamily: 'Space Habitat, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--lhud-cyan)',
                    fontWeight: 600
                  }}>Giảng Viên</th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontFamily: 'Space Habitat, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--lhud-cyan)',
                    fontWeight: 600
                  }}>Danh Mục</th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontFamily: 'Space Habitat, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--lhud-cyan)',
                    fontWeight: 600
                  }}>Ngày Gửi</th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontFamily: 'Space Habitat, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--lhud-cyan)',
                    fontWeight: 600
                  }}>Trạng Thái</th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontFamily: 'Space Habitat, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--lhud-cyan)',
                    fontWeight: 600
                  }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentPageCourses().map((course) => (
                  <tr
                    key={course.id}
                    style={{
                      borderBottom: '1px solid var(--lhud-border)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          background: 'var(--lhud-surface)',
                          border: '1px solid var(--lhud-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <BookOpen size={24} color="var(--lhud-text-dim)" />
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          color: 'var(--lhud-text-primary)'
                        }}>
                          {course.title}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--lhud-text-secondary)', fontSize: '0.875rem' }}>
                        <User size={16} />
                        <span>Instructor</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'Space Habitat, monospace',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid var(--lhud-cyan)',
                        color: 'var(--lhud-cyan)'
                      }}>
                        {course.level}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--lhud-text-secondary)', fontSize: '0.875rem' }}>
                        <Calendar size={16} />
                        <span>{new Date(course.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'Space Habitat, monospace',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: course.status === 'PENDING' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                        border: course.status === 'PENDING' ? '1px solid #fbbf24' : '1px solid var(--lhud-cyan)',
                        color: course.status === 'PENDING' ? '#fbbf24' : 'var(--lhud-cyan)'
                      }}>
                        {course.status === 'PENDING' ? 'Chờ duyệt' : course.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleViewDetails(course)}
                          title="Xem chi tiết"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid var(--lhud-cyan)',
                            color: 'var(--lhud-cyan)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--lhud-cyan)';
                            e.currentTarget.style.color = 'var(--lhud-deep-space)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                            e.currentTarget.style.color = 'var(--lhud-cyan)';
                          }}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleAction('approve', course)}
                          title="Duyệt"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid var(--lhud-green)',
                            color: 'var(--lhud-green)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--lhud-green)';
                            e.currentTarget.style.color = 'var(--lhud-deep-space)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                            e.currentTarget.style.color = 'var(--lhud-green)';
                          }}
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleAction('reject', course)}
                          title="Từ chối"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--lhud-red)',
                            color: 'var(--lhud-red)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--lhud-red)';
                            e.currentTarget.style.color = 'var(--lhud-deep-space)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = 'var(--lhud-red)';
                          }}
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NeuralCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <NeuralButton
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} /> Trước
          </NeuralButton>

          <div style={{
            padding: '0.75rem 1.5rem',
            fontFamily: 'Space Habitat, monospace',
            fontSize: '0.875rem',
            color: 'var(--lhud-text-secondary)'
          }}>
            Trang {currentPage} / {totalPages}
          </div>

          <NeuralButton
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau <ChevronRight size={20} />
          </NeuralButton>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCourse && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 14, 23, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          animation: 'learning-hud-fade-in 0.3s ease-out'
        }}
        onClick={() => setShowDetailsModal(false)}
        >
          <NeuralCard style={{
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'learning-hud-modal-slide-up 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderBottom: '1px solid var(--lhud-border)',
              background: 'rgba(6, 182, 212, 0.03)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--lhud-text-primary)',
                margin: 0
              }}>
                Chi Tiết Khóa Học
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--lhud-text-dim)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--lhud-cyan)';
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--lhud-text-dim)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: 600,
                color: 'var(--lhud-text-primary)',
                marginBottom: '1.5rem'
              }}>
                {selectedCourse.title}
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: 'var(--lhud-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--lhud-border)'
                }}>
                  <User size={18} color="var(--lhud-cyan)" />
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--lhud-text-dim)',
                      marginBottom: '0.25rem',
                      fontFamily: 'Space Habitat, monospace',
                      textTransform: 'uppercase'
                    }}>
                      Giảng viên
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--lhud-text-primary)', fontWeight: 500 }}>
                      Instructor
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: 'var(--lhud-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--lhud-border)'
                }}>
                  <BookOpen size={18} color="var(--lhud-cyan)" />
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--lhud-text-dim)',
                      marginBottom: '0.25rem',
                      fontFamily: 'Space Habitat, monospace',
                      textTransform: 'uppercase'
                    }}>
                      Tác giả
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--lhud-text-primary)', fontWeight: 500 }}>
                      {selectedCourse.authorName || 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: 'var(--lhud-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--lhud-border)'
                }}>
                  <Award size={18} color="var(--lhud-cyan)" />
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--lhud-text-dim)',
                      marginBottom: '0.25rem',
                      fontFamily: 'Space Habitat, monospace',
                      textTransform: 'uppercase'
                    }}>
                      Cấp độ
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--lhud-text-primary)', fontWeight: 500 }}>
                      {selectedCourse.level}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--lhud-text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  Mô tả
                </h4>
                <p style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.8,
                  color: 'var(--lhud-text-secondary)'
                }}>
                  {selectedCourse.description}
                </p>
              </div>

              {courseModules.length > 0 && (
                <div>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--lhud-text-primary)',
                    marginBottom: '1rem'
                  }}>
                    Nội dung khóa học ({courseModules.length} modules)
                  </h4>
                  {courseModules.map((module, idx) => (
                    <NeuralCard key={module.id} style={{
                      marginBottom: '1rem',
                      padding: '1.5rem',
                      borderLeft: '3px solid var(--lhud-cyan)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Layers size={20} color="var(--lhud-cyan)" />
                        <div>
                          <h5 style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            color: 'var(--lhud-text-primary)'
                          }}>
                            Module {idx + 1}: {module.title}
                          </h5>
                          {module.description && (
                            <p style={{
                              margin: '0.25rem 0 0 0',
                              fontSize: '0.9rem',
                              color: 'var(--lhud-text-dim)'
                            }}>
                              {module.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lessons */}
                      {module.lessons && module.lessons.length > 0 && (
                        <div style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                          <h6 style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            color: 'var(--lhud-cyan)',
                            fontFamily: 'Space Habitat, monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
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
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                                e.currentTarget.style.borderColor = 'var(--lhud-cyan)';
                                e.currentTarget.style.transform = 'translateX(4px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--lhud-surface)';
                                e.currentTarget.style.borderColor = 'var(--lhud-border)';
                                e.currentTarget.style.transform = 'translateX(0)';
                              }}
                            >
                              <span style={{ color: 'var(--lhud-text-primary)' }}>• {lesson.title}</span>
                              <div style={{
                                display: 'flex',
                                gap: '0.75rem',
                                fontSize: '0.85rem',
                                color: 'var(--lhud-text-dim)',
                                alignItems: 'center'
                              }}>
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  background: 'rgba(6, 182, 212, 0.1)',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontFamily: 'Space Habitat, monospace'
                                }}>
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
                          <h6 style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            color: 'var(--lhud-green)',
                            fontFamily: 'Space Habitat, monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            ✏️ Bài tập ({module.assignments.length})
                          </h6>
                          {module.assignments.map((assignment: any) => (
                            <div
                              key={assignment.id}
                              style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--lhud-surface)',
                                borderRadius: '6px',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                border: '1px solid var(--lhud-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <span style={{ color: 'var(--lhud-text-primary)' }}>• {assignment.title}</span>
                              <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--lhud-text-dim)'
                              }}>
                                {assignment.maxScore} điểm
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quizzes */}
                      {module.quizzes && module.quizzes.length > 0 && (
                        <div style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                          <h6 style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            color: '#fbbf24',
                            fontFamily: 'Space Habitat, monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            ✅ Bài kiểm tra ({module.quizzes.length})
                          </h6>
                          {module.quizzes.map((quiz: any) => (
                            <div
                              key={quiz.id}
                              style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--lhud-surface)',
                                borderRadius: '6px',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                border: '1px solid var(--lhud-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <span style={{ color: 'var(--lhud-text-primary)' }}>• {quiz.title}</span>
                              <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--lhud-text-dim)'
                              }}>
                                {quiz.passScore}% để đạt
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </NeuralCard>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '1.5rem',
              borderTop: '1px solid var(--lhud-border)',
              background: 'rgba(6, 182, 212, 0.02)'
            }}>
              <NeuralButton variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Đóng
              </NeuralButton>
            </div>
          </NeuralCard>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedCourse && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 14, 23, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          animation: 'learning-hud-fade-in 0.3s ease-out'
        }}
        onClick={() => setShowActionModal(false)}
        >
          <NeuralCard style={{
            maxWidth: '500px',
            width: '100%',
            animation: 'learning-hud-modal-slide-up 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--lhud-border)',
              background: actionType === 'approve' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--lhud-text-primary)',
                margin: 0
              }}>
                {actionType === 'approve' ? 'Duyệt khóa học' : 'Từ chối khóa học'}
              </h2>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--lhud-text-secondary)',
                marginBottom: '1.5rem'
              }}>
                {actionType === 'approve'
                  ? `Bạn có chắc chắn muốn duyệt khóa học "${selectedCourse.title}"?`
                  : `Vui lòng nhập lý do từ chối khóa học "${selectedCourse.title}"`
                }
              </p>

              {actionType === 'reject' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontFamily: 'Space Habitat, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--lhud-cyan)',
                    marginBottom: '0.5rem'
                  }}>
                    Lý do từ chối <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    style={{
                      ...inputStyle,
                      minHeight: '100px',
                      resize: 'vertical' as const
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--lhud-cyan)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--lhud-border)'}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              padding: '1.5rem',
              borderTop: '1px solid var(--lhud-border)',
              background: 'rgba(6, 182, 212, 0.02)'
            }}>
              <NeuralButton
                variant="secondary"
                onClick={() => setShowActionModal(false)}
                disabled={loading}
              >
                Hủy
              </NeuralButton>
              <NeuralButton
                variant={actionType === 'approve' ? 'success' : 'danger'}
                onClick={confirmAction}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : actionType === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </NeuralButton>
            </div>
          </NeuralCard>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && selectedLesson && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 14, 23, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
          animation: 'learning-hud-fade-in 0.3s ease-out'
        }}
        onClick={() => setShowLessonModal(false)}
        >
          <NeuralCard style={{
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'learning-hud-modal-slide-up 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderBottom: '1px solid var(--lhud-border)',
              background: 'rgba(6, 182, 212, 0.03)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--lhud-text-primary)',
                margin: 0
              }}>
                Chi Tiết Bài Học
              </h2>
              <button
                onClick={() => setShowLessonModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--lhud-text-dim)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--lhud-cyan)';
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--lhud-text-dim)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--lhud-text-primary)',
                marginBottom: '1rem'
              }}>
                {selectedLesson.title}
              </h3>

              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid var(--lhud-cyan)',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontFamily: 'Space Habitat, monospace',
                  color: 'var(--lhud-cyan)'
                }}>
                  {selectedLesson.type}
                </span>
                {selectedLesson.duration && (
                  <span style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--lhud-surface)',
                    border: '1px solid var(--lhud-border)',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    color: 'var(--lhud-text-secondary)'
                  }}>
                    {selectedLesson.duration} phút
                  </span>
                )}
              </div>

              {/* Video */}
              {selectedLesson.type === 'VIDEO' && selectedLesson.videoUrl && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    height: 0,
                    overflow: 'hidden',
                    borderRadius: '8px',
                    background: '#000',
                    border: '1px solid var(--lhud-border)'
                  }}>
                    <iframe
                      src={selectedLesson.videoUrl}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 0
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Reading Content */}
              {selectedLesson.type === 'READING' && selectedLesson.contentText && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--lhud-text-primary)',
                    marginBottom: '0.75rem'
                  }}>
                    Nội dung bài đọc
                  </h4>
                  <div style={{
                    background: 'var(--lhud-surface)',
                    border: '1px solid var(--lhud-border)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    lineHeight: 1.8,
                    fontSize: '1rem',
                    color: 'var(--lhud-text-secondary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedLesson.contentText}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {selectedLesson.type === 'VIDEO' && !selectedLesson.videoUrl && (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--lhud-text-dim)',
                  background: 'var(--lhud-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--lhud-border)'
                }}>
                  <Play size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Bài học này chưa có video</p>
                </div>
              )}

              {selectedLesson.type === 'READING' && !selectedLesson.contentText && (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--lhud-text-dim)',
                  background: 'var(--lhud-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--lhud-border)'
                }}>
                  <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Bài học này chưa có nội dung</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '1.5rem',
              borderTop: '1px solid var(--lhud-border)',
              background: 'rgba(6, 182, 212, 0.02)'
            }}>
              <NeuralButton variant="secondary" onClick={() => setShowLessonModal(false)}>
                Đóng
              </NeuralButton>
            </div>
          </NeuralCard>
        </div>
      )}
    </div>
  );
};