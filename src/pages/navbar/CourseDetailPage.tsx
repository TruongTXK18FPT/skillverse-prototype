import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Users,
  Clock,
  BookOpen,
  Trophy,
  Play,
  CheckCircle,
  Globe,
  Download,
  Share2,
  Heart,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Shield,
  Cpu,
  Layers,
  Award,
  Activity
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getCourse } from '../../services/courseService';
import { enrollUser, checkEnrollmentStatus, getEnrollmentProgress } from '../../services/enrollmentService';
import { CourseDetailDTO } from '../../data/courseDTOs';
import { getMentorProfile, MentorProfile } from '../../services/mentorProfileService';
import PurchaseCourseModal from '../../components/course/PurchaseCourseModal';
import '../../styles/CourseDetailCockpit.css';

// Local helpers
const formatCurrency = (amount?: number, currency?: string): string => {
  if (!amount || amount === 0) return 'MIỄN PHÍ';
  if (currency && currency.toUpperCase() !== 'VND') {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    } catch {
      return amount.toLocaleString('vi-VN') + ' ' + currency;
    }
  }
  return amount.toLocaleString('vi-VN') + ' VND';
};

const CourseDetailPage = () => {
  const { theme } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [loadingEnrollment, setLoadingEnrollment] = useState(false);
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const passedCourse = location.state?.course;

  useEffect(() => {
    if (isEnrolled) {
      setShowPaymentModal(false);
    }
  }, [isEnrolled]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const courseIdNum = parseInt(id);
    getCourse(courseIdNum)
      .then(async (dto) => {
        setCourse(dto);
        if (dto.author?.id) {
          try {
            const profile = await getMentorProfile(dto.author.id);
            setMentorProfile(profile);
          } catch {
            // ignore
          }
        }
        try {
          const enrolled = await checkEnrollmentStatus(courseIdNum, 1);
          setIsEnrolled(enrolled);
          if (enrolled) {
            const progress = await getEnrollmentProgress(courseIdNum, 1);
            setEnrollmentProgress(progress.progress);
          }
        } catch {
          // ignore
        }
      })
      .catch(err => {
        console.error('Error loading course:', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!course || loadingEnrollment) return;

    setLoadingEnrollment(true);

    try {
      if (!course.price || course.price === 0) {
        await enrollUser(course.id, 1);
        setIsEnrolled(true);
        setEnrollmentProgress(0);
        alert('Bạn đã đăng ký thành công khóa học miễn phí!');
      } else {
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Có lỗi xảy ra khi đăng ký khóa học. Vui lòng thử lại.');
    } finally {
      setLoadingEnrollment(false);
    }
  };

  const handleTrailerPreview = () => {
    setShowTrailer(true);
  };

  const closeTrailer = () => {
    setShowTrailer(false);
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const formatStudentCount = (count: number): string => {
    const num = count || 0;
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'BEGINNER': return 'beginner';
      case 'INTERMEDIATE': return 'intermediate';
      case 'ADVANCED': return 'advanced';
      default: return 'beginner';
    }
  };

  if (loading) {
    return (
      <div className={`cockpit-detail-container ${theme}`} data-theme={theme}>
        <div className="cockpit-detail-hud-frame">
          <div className="cockpit-detail-loading">
            <div className="cockpit-detail-radar-spinner">
              <div className="cockpit-detail-radar-sweep"></div>
              <div className="cockpit-detail-radar-blip"></div>
            </div>
            <p className="cockpit-detail-loading-text">ĐANG TẢI DỮ LIỆU MODULE...</p>
            <div className="cockpit-detail-loading-bar">
              <div className="cockpit-detail-loading-progress"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`cockpit-detail-container ${theme}`} data-theme={theme}>
        <div className="cockpit-detail-hud-frame">
          <div className="cockpit-detail-error">
            <Shield className="cockpit-detail-error-icon" />
            <h2 className="cockpit-detail-error-title">KHÔNG TÌM THẤY MODULE</h2>
            <p className="cockpit-detail-error-text">Module không tồn tại trong hệ thống</p>
            <button onClick={() => navigate('/courses')} className="cockpit-detail-back-btn">
              <ArrowLeft className="cockpit-detail-btn-icon" />
              QUAY LẠI HỆ THỐNG
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cockpit-detail-container ${theme}`} data-theme={theme}>
      {/* HUD Corners */}
      <div className="cockpit-detail-hud-corners">
        <div className="cockpit-detail-corner cockpit-detail-corner-tl"></div>
        <div className="cockpit-detail-corner cockpit-detail-corner-tr"></div>
        <div className="cockpit-detail-corner cockpit-detail-corner-bl"></div>
        <div className="cockpit-detail-corner cockpit-detail-corner-br"></div>
      </div>

      {/* Main HUD Frame */}
      <div className="cockpit-detail-hud-frame">
        {/* Navigation Bar */}
        <div className="cockpit-detail-nav-bar">
          <button onClick={() => navigate(-1)} className="cockpit-detail-nav-back">
            <ArrowLeft className="cockpit-detail-nav-icon" />
            <span>QUAY LẠI</span>
          </button>
          <div className="cockpit-detail-nav-status">
            <Activity className="cockpit-detail-status-icon" />
            <span className="cockpit-detail-status-text">MODULE ACTIVE</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="cockpit-detail-hero">
          <div className="cockpit-detail-hero-grid">
            {/* Left: Course Info */}
            <div className="cockpit-detail-info-panel">
              {/* Level Badge */}
              {course.level && (
                <div className={`cockpit-detail-level-badge cockpit-detail-level-${getLevelColor(course.level)}`}>
                  <Shield className="cockpit-detail-badge-icon" />
                  <span>{course.level}</span>
                </div>
              )}

              {/* Title */}
              <h1 className="cockpit-detail-title">{course.title}</h1>

              {/* Description */}
              <p className="cockpit-detail-description">{course.description}</p>

              {/* Stats Grid */}
              <div className="cockpit-detail-stats-grid">
                <div className="cockpit-detail-stat-card">
                  <Star className="cockpit-detail-stat-icon" />
                  <div className="cockpit-detail-stat-content">
                    <span className="cockpit-detail-stat-value">{course.averageRating?.toFixed(1) ?? '0.0'}</span>
                    <span className="cockpit-detail-stat-label">RATING</span>
                  </div>
                </div>
                <div className="cockpit-detail-stat-card">
                  <Users className="cockpit-detail-stat-icon" />
                  <div className="cockpit-detail-stat-content">
                    <span className="cockpit-detail-stat-value">{formatStudentCount(course.enrollmentCount)}</span>
                    <span className="cockpit-detail-stat-label">USERS</span>
                  </div>
                </div>
                <div className="cockpit-detail-stat-card">
                  <Layers className="cockpit-detail-stat-icon" />
                  <div className="cockpit-detail-stat-content">
                    <span className="cockpit-detail-stat-value">{course.modules?.length ?? 0}</span>
                    <span className="cockpit-detail-stat-label">MODULES</span>
                  </div>
                </div>
              </div>

              {/* Instructor Card */}
              {course.author && (
                <div className="cockpit-detail-instructor-card">
                  <div className="cockpit-detail-instructor-header">
                    <Cpu className="cockpit-detail-instructor-icon" />
                    <span className="cockpit-detail-instructor-label">INSTRUCTOR</span>
                  </div>
                  <div className="cockpit-detail-instructor-info">
                    <img
                      src={mentorProfile?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                      alt={course.author.firstName}
                      className="cockpit-detail-instructor-avatar"
                    />
                    <div className="cockpit-detail-instructor-details">
                      <h4 className="cockpit-detail-instructor-name">
                        {course.author.fullName || `${course.author.firstName} ${course.author.lastName}`}
                      </h4>
                      {mentorProfile?.specialization && (
                        <p className="cockpit-detail-instructor-spec">{mentorProfile.specialization}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Enrollment Panel */}
            <div className="cockpit-detail-enrollment-panel">
              {/* Preview Card */}
              <div className="cockpit-detail-preview-card">
                <div className="cockpit-detail-preview-container">
                  <img
                    src={course.thumbnailUrl || (course.thumbnail?.url ?? '')}
                    alt={course.title}
                    className="cockpit-detail-preview-image"
                  />
                  <div className="cockpit-detail-preview-overlay">
                    <button className="cockpit-detail-play-btn" onClick={handleTrailerPreview}>
                      <Play className="cockpit-detail-play-icon" />
                      <span>PREVIEW</span>
                    </button>
                  </div>
                  {/* Energy Indicator */}
                  <div className="cockpit-detail-energy-indicator">
                    <div className="cockpit-detail-energy-pulse"></div>
                  </div>
                </div>

                {/* Price Section */}
                <div className="cockpit-detail-price-section">
                  <div className="cockpit-detail-price-header">
                    <Zap className="cockpit-detail-price-icon" />
                    <span className="cockpit-detail-price-label">ACTIVATION COST</span>
                  </div>
                  <div className="cockpit-detail-price-value">
                    {formatCurrency(course.price, course.currency)}
                  </div>
                </div>

                {/* Enrollment Button */}
                {isEnrolled ? (
                  <button
                    className="cockpit-detail-enroll-btn enrolled"
                    onClick={() => navigate('/course-learning', { state: { courseId: course.id } })}
                  >
                    <BookOpen className="cockpit-detail-btn-icon" />
                    <span>TIẾP TỤC HỌC</span>
                  </button>
                ) : (
                  <button
                    className={`cockpit-detail-enroll-btn ${loadingEnrollment ? 'loading' : ''}`}
                    onClick={handleEnroll}
                    disabled={loadingEnrollment}
                  >
                    <Zap className="cockpit-detail-btn-icon" />
                    <span>{loadingEnrollment ? 'ĐANG XỬ LÝ...' : 'KÍCH HOẠT MODULE'}</span>
                  </button>
                )}

                {/* Action Buttons */}
                <div className="cockpit-detail-action-grid">
                  <button
                    className={`cockpit-detail-action-btn ${isWishlisted ? 'active' : ''}`}
                    onClick={() => setIsWishlisted(!isWishlisted)}
                  >
                    <Heart className="cockpit-detail-action-icon" />
                    <span>{isWishlisted ? 'ĐÃ LƯU' : 'LƯU'}</span>
                  </button>
                  <button className="cockpit-detail-action-btn">
                    <Share2 className="cockpit-detail-action-icon" />
                    <span>CHIA SẺ</span>
                  </button>
                </div>

                {/* Progress Section (if enrolled) */}
                {isEnrolled && (
                  <div className="cockpit-detail-progress-section">
                    <div className="cockpit-detail-progress-header">
                      <Activity className="cockpit-detail-progress-icon" />
                      <span className="cockpit-detail-progress-label">TIẾN ĐỘ HỌC TẬP</span>
                    </div>
                    <div className="cockpit-detail-progress-bar">
                      <div className="cockpit-detail-progress-fill" style={{ width: `${enrollmentProgress}%` }}></div>
                    </div>
                    <span className="cockpit-detail-progress-text">{enrollmentProgress}% HOÀN THÀNH</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="cockpit-detail-content">
          {/* Navigation Tabs */}
          <div className="cockpit-detail-tabs">
            <button
              className={`cockpit-detail-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Target className="cockpit-detail-tab-icon" />
              <span>TỔNG QUAN</span>
            </button>
            <button
              className={`cockpit-detail-tab ${activeTab === 'curriculum' ? 'active' : ''}`}
              onClick={() => setActiveTab('curriculum')}
            >
              <Layers className="cockpit-detail-tab-icon" />
              <span>NỘI DUNG</span>
            </button>
            <button
              className={`cockpit-detail-tab ${activeTab === 'instructor' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructor')}
            >
              <Cpu className="cockpit-detail-tab-icon" />
              <span>GIẢNG VIÊN</span>
            </button>
            {Boolean(course.totalReviews && course.totalReviews > 0) && (
              <button
                className={`cockpit-detail-tab ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                <Star className="cockpit-detail-tab-icon" />
                <span>ĐÁNH GIÁ</span>
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="cockpit-detail-tab-content">
            {activeTab === 'overview' && (
              <div className="cockpit-detail-overview">
                <div className="cockpit-detail-section-panel">
                  <div className="cockpit-detail-section-header">
                    <div className="cockpit-detail-section-marker"></div>
                    <h2 className="cockpit-detail-section-title">MÔ TẢ MODULE</h2>
                  </div>
                  <div className="cockpit-detail-section-content">
                    <p className="cockpit-detail-text">
                      {course.description} Khóa học này được thiết kế dành cho những người muốn
                      nắm vững các kiến thức cơ bản và nâng cao, với nhiều ví dụ thực tế và
                      bài tập thực hành phong phú.
                    </p>
                    <p className="cockpit-detail-text">
                      Bạn sẽ học được cách xây dựng các ứng dụng hoàn chỉnh từ đầu đến cuối,
                      hiểu rõ các best practices và các kỹ thuật tối ưu hóa hiệu suất.
                    </p>
                  </div>
                </div>

                <div className="cockpit-detail-section-panel">
                  <div className="cockpit-detail-section-header">
                    <div className="cockpit-detail-section-marker"></div>
                    <h3 className="cockpit-detail-section-title">NĂNG LỰC ĐẠT ĐƯỢC</h3>
                  </div>
                  <div className="cockpit-detail-outcomes-grid">
                    <div className="cockpit-detail-outcome-card">
                      <Target className="cockpit-detail-outcome-icon" />
                      <span>Nắm vững các khái niệm cơ bản và nâng cao</span>
                    </div>
                    <div className="cockpit-detail-outcome-card">
                      <Trophy className="cockpit-detail-outcome-icon" />
                      <span>Xây dựng các dự án thực tế hoàn chỉnh</span>
                    </div>
                    <div className="cockpit-detail-outcome-card">
                      <Shield className="cockpit-detail-outcome-icon" />
                      <span>Hiểu và áp dụng các best practices</span>
                    </div>
                    <div className="cockpit-detail-outcome-card">
                      <Zap className="cockpit-detail-outcome-icon" />
                      <span>Tối ưu hóa hiệu suất và debug lỗi</span>
                    </div>
                  </div>
                </div>

                <div className="cockpit-detail-section-panel">
                  <div className="cockpit-detail-section-header">
                    <div className="cockpit-detail-section-marker"></div>
                    <h3 className="cockpit-detail-section-title">YÊU CẦU HỆ THỐNG</h3>
                  </div>
                  <ul className="cockpit-detail-requirements">
                    <li>
                      <CheckCircle className="cockpit-detail-check-icon" />
                      <span>Kiến thức cơ bản về HTML, CSS và JavaScript</span>
                    </li>
                    <li>
                      <CheckCircle className="cockpit-detail-check-icon" />
                      <span>Máy tính có thể cài đặt phần mềm phát triển</span>
                    </li>
                    <li>
                      <CheckCircle className="cockpit-detail-check-icon" />
                      <span>Đam mê học hỏi và thực hành</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="cockpit-detail-curriculum">
                <div className="cockpit-detail-section-panel">
                  <div className="cockpit-detail-section-header">
                    <div className="cockpit-detail-section-marker"></div>
                    <h2 className="cockpit-detail-section-title">DANH SÁCH CÁC MODULE CON</h2>
                  </div>
                  {course.modules && course.modules.length > 0 ? (
                    <div className="cockpit-detail-modules-list">
                      {course.modules.map((module, idx) => (
                        <div key={module.id} className="cockpit-detail-module-card">
                          <div className="cockpit-detail-module-header">
                            <div className="cockpit-detail-module-number">
                              <span className="cockpit-detail-module-index">{String((module.orderIndex ?? idx) + 1).padStart(2, '0')}</span>
                            </div>
                            <div className="cockpit-detail-module-info">
                              <h4 className="cockpit-detail-module-title">{module.title}</h4>
                              {module.description && (
                                <p className="cockpit-detail-module-desc">{module.description}</p>
                              )}
                            </div>
                            <button
                              className="cockpit-detail-module-toggle"
                              onClick={() => toggleModule(module.id)}
                            >
                              {expandedModule === module.id ? (
                                <ChevronUp className="cockpit-detail-toggle-icon" />
                              ) : (
                                <ChevronDown className="cockpit-detail-toggle-icon" />
                              )}
                            </button>
                          </div>
                          {expandedModule === module.id && (
                            <div className="cockpit-detail-module-content">
                              <p className="cockpit-detail-module-detail">Chi tiết module sẽ được hiển thị ở đây</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="cockpit-detail-empty">
                      <Layers className="cockpit-detail-empty-icon" />
                      <p className="cockpit-detail-empty-text">Chưa có nội dung module</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'instructor' && course.author && (
              <div className="cockpit-detail-instructor-section">
                <div className="cockpit-detail-section-panel">
                  <div className="cockpit-detail-section-header">
                    <div className="cockpit-detail-section-marker"></div>
                    <h2 className="cockpit-detail-section-title">THÔNG TIN GIẢNG VIÊN</h2>
                  </div>
                  <div className="cockpit-detail-instructor-full-card">
                    <div className="cockpit-detail-instructor-profile">
                      <img
                        src={mentorProfile?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                        alt={course.author.firstName}
                        className="cockpit-detail-instructor-photo"
                      />
                      <div className="cockpit-detail-instructor-bio-section">
                        <h3 className="cockpit-detail-instructor-full-name">
                          {course.author.fullName || `${course.author.firstName} ${course.author.lastName}`}
                        </h3>
                        {mentorProfile?.specialization && (
                          <p className="cockpit-detail-instructor-role">{mentorProfile.specialization}</p>
                        )}
                        {mentorProfile?.bio && (
                          <p className="cockpit-detail-instructor-bio">{mentorProfile.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && Boolean(course.totalReviews && course.totalReviews > 0) && (
              <div className="cockpit-detail-reviews">
                <div className="cockpit-detail-section-panel">
                  <div className="cockpit-detail-section-header">
                    <div className="cockpit-detail-section-marker"></div>
                    <h2 className="cockpit-detail-section-title">ĐÁNH GIÁ TỪ NGƯỜI DÙNG</h2>
                  </div>
                  <div className="cockpit-detail-reviews-summary">
                    <div className="cockpit-detail-rating-card">
                      <div className="cockpit-detail-rating-number">{course.averageRating?.toFixed(1)}</div>
                      <div className="cockpit-detail-rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`cockpit-detail-star ${star <= Math.round(course.averageRating || 0) ? 'filled' : ''}`}
                          />
                        ))}
                      </div>
                      <div className="cockpit-detail-rating-count">{course.totalReviews} ĐÁNH GIÁ</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && (
        <div className="cockpit-detail-modal-overlay" onClick={closeTrailer}>
          <div className="cockpit-detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="cockpit-detail-modal-close" onClick={closeTrailer}>
              <span>×</span>
            </button>
            <div className="cockpit-detail-modal-video">
              <img src={course.thumbnailUrl || (course.thumbnail?.url ?? '')} alt={course.title} />
              <div className="cockpit-detail-modal-play-overlay">
                <Play className="cockpit-detail-modal-play-icon" />
                <span>VIDEO PREVIEW</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && course && (
        <PurchaseCourseModal
          course={course}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setIsEnrolled(true);
            setEnrollmentProgress(0);
            setShowPaymentModal(false);
            alert('Thanh toán thành công! Bạn đã kích hoạt khóa học.');
          }}
        />
      )}
    </div>
  );
};

export default CourseDetailPage;
