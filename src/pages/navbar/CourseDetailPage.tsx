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
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getCourse, isFreePrice, Course } from '../../services/courseService';
import { enrollUser, checkEnrollmentStatus, getEnrollmentProgress } from '../../services/enrollmentService';
import { CourseDetailDTO } from '../../data/courseDTOs';
import { getMentorProfile, MentorProfile } from '../../services/mentorProfileService';
import '../../styles/CourseraClone.css';

// Local helpers
const formatCurrency = (amount?: number, currency?: string): string => {
  if (!amount || amount === 0) return 'Miễn phí';
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

  // Check if course data was passed via navigation state
  const passedCourse = location.state?.course;

  // No mocks. All sections will be conditionally rendered from BE data.

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
        // Load mentor profile if available
        if (dto.author?.id) {
          try {
            const profile = await getMentorProfile(dto.author.id);
            setMentorProfile(profile);
          } catch {
            // ignore if not found
          }
        }
        // Enrollment status
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
        // Handle free course enrollment
        await enrollUser(course.id, 1, 'FREE'); // TODO: Get real user ID from auth context
        setIsEnrolled(true);
        setEnrollmentProgress(0);
        alert('Bạn đã đăng ký thành công khóa học miễn phí!');
      } else {
        // Navigate to payment page with course data
        navigate('/payment', {
          state: {
            type: 'course',
            title: course.title,
            price: course.price,
            instructor: course.author?.fullName || `${course.author?.firstName} ${course.author?.lastName}`,
            description: course.description,
            image: course.thumbnailUrl || course.thumbnail?.url
          }
        });
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
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className={`coursera-clone-container ${theme}`} data-theme={theme}>
        <div className="coursera-clone-loading-container">
          <div className="coursera-clone-loading-spinner"></div>
          <p>Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`coursera-clone-container ${theme}`} data-theme={theme}>
        <div className="coursera-clone-error-container">
          <h2>Không tìm thấy khóa học</h2>
          <button onClick={() => navigate('/courses')} className="coursera-clone-back-btn">
            Quay lại danh sách khóa học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`coursera-clone-container ${theme}`} data-theme={theme}>
      {/* Hero Section */}
      <div className="coursera-clone-hero">
        <div className="coursera-clone-hero-content">
          <button onClick={() => navigate(-1)} className="coursera-clone-back-btn">
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>

          <div className="coursera-clone-hero-grid">
            <div className="coursera-clone-course-info">
              <div className="coursera-clone-course-badges">
                {course.level && (
                  <span className="coursera-clone-badge coursera-clone-badge-level">
                    {course.level}
                  </span>
                )}
                {/* Category not available from BE yet */}
              </div>

              <h1 className="coursera-clone-course-title">{course.title}</h1>
              <p className="coursera-clone-course-description">{course.description}</p>

              <div className="coursera-clone-course-stats">
                <div className="coursera-clone-stat-item">
                  <Star className="coursera-clone-stat-icon filled" />
                  <span>{course.averageRating?.toFixed(1) ?? '0.0'}</span>
                </div>
                <div className="coursera-clone-stat-item">
                  <Users className="coursera-clone-stat-icon" />
                  <span>{formatStudentCount(course.enrollmentCount)} học viên</span>
                </div>
                {/* Duration not provided by BE; hide to avoid hardcode */}
                <div className="coursera-clone-stat-item">
                  <BookOpen className="coursera-clone-stat-icon" />
                  <span>{course.modules?.length ?? 0} mô-đun</span>
                </div>
              </div>

              {course.author && (
                <div className="coursera-clone-instructor-info">
                  <img src={mentorProfile?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'} alt={course.author.firstName} className="coursera-clone-instructor-avatar" />
                  <div className="coursera-clone-instructor-details">
                    <h4>{course.author.fullName || `${course.author.firstName} ${course.author.lastName}`}</h4>
                    {mentorProfile?.specialization && <p>{mentorProfile.specialization}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="coursera-clone-course-card">
              <div className="coursera-clone-course-preview">
                <img src={course.thumbnailUrl || (course.thumbnail?.url ?? '')} alt={course.title} className="coursera-clone-preview-image" />
                <div className="coursera-clone-preview-overlay">
                  <button 
                    className="coursera-clone-preview-btn"
                    onClick={handleTrailerPreview}
                  >
                    <Play size={16} />
                    <span>Xem trailer</span>
                  </button>
                </div>
              </div>

              <div className="coursera-clone-pricing-section">
                <div className="coursera-clone-price-info">
                  <h3 className="coursera-clone-price-current">{formatCurrency(course.price, course.currency)}</h3>
                </div>

                {isEnrolled ? (
                  <button 
                    className="coursera-clone-enroll-btn enrolled"
                    onClick={() => navigate('/course-learning', { state: { courseId: course.id } })}
                  >
                    📚 Tiếp tục học
                  </button>
                ) : (
                  <button 
                    className={`coursera-clone-enroll-btn ${loadingEnrollment ? 'loading' : ''}`}
                    onClick={handleEnroll}
                    disabled={loadingEnrollment}
                  >
                    {loadingEnrollment ? '⏳ Đang xử lý...' : (!course.price || course.price === 0 ? '⚡ Đăng ký miễn phí' : '⚡ Đăng ký ngay')}
                  </button>
                )}

                <div className="coursera-clone-action-buttons">
                  <button 
                    className={`coursera-clone-action-btn ${isWishlisted ? 'active' : ''}`}
                    onClick={() => setIsWishlisted(!isWishlisted)}
                  >
                    <Heart size={16} />
                    <span>{isWishlisted ? 'Đã lưu' : 'Lưu'}</span>
                  </button>
                  <button className="coursera-clone-action-btn">
                    <Share2 size={16} />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>

              {/* Feature list is BE-dependent; hidden until BE provides */}
              
              {isEnrolled && (
                <div className="coursera-clone-enrollment-status">
                  <div className="coursera-clone-progress-section">
                    <h4 className="coursera-clone-progress-title">Tiến độ học tập</h4>
                    <div className="coursera-clone-progress-bar">
                      <div className="coursera-clone-progress-fill" style={{ width: `${enrollmentProgress}%` }}></div>
                    </div>
                    <span className="coursera-clone-progress-text">{enrollmentProgress}% hoàn thành</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="coursera-clone-content">
        <div className="coursera-clone-content-layout">
          <div className="coursera-clone-main-content">
            {/* Navigation Tabs */}
            <div className="coursera-clone-content-tabs">
              <button 
                className={`coursera-clone-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Tổng quan
              </button>
              <button 
                className={`coursera-clone-tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
                onClick={() => setActiveTab('curriculum')}
              >
                Nội dung khóa học
              </button>
              <button 
                className={`coursera-clone-tab-btn ${activeTab === 'instructor' ? 'active' : ''}`}
                onClick={() => setActiveTab('instructor')}
              >
                Giảng viên
              </button>
              {Boolean(course.totalReviews && course.totalReviews > 0) && (
                <button 
                  className={`coursera-clone-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  Đánh giá
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="coursera-clone-tab-content">
              {activeTab === 'overview' && (
                <div className="coursera-clone-overview-section">
                  <h2 className="coursera-clone-section-title">Mô tả khóa học</h2>
                  <div className="coursera-clone-course-description-full">
                    <p>
                      {course.description} Khóa học này được thiết kế dành cho những người muốn 
                      nắm vững các kiến thức cơ bản và nâng cao, với nhiều ví dụ thực tế và 
                      bài tập thực hành phong phú.
                    </p>
                    <p>
                      Bạn sẽ học được cách xây dựng các ứng dụng hoàn chỉnh từ đầu đến cuối, 
                      hiểu rõ các best practices và các kỹ thuật tối ưu hóa hiệu suất.
                    </p>
                  </div>

                  <h3 className="coursera-clone-subsection-title">Bạn sẽ học được gì?</h3>
                  <div className="coursera-clone-learning-outcomes">
                    <div className="coursera-clone-outcome-item">
                      <Target className="coursera-clone-outcome-icon" />
                      <span>Nắm vững các khái niệm cơ bản và nâng cao</span>
                    </div>
                    <div className="coursera-clone-outcome-item">
                      <Target className="coursera-clone-outcome-icon" />
                      <span>Xây dựng các dự án thực tế hoàn chỉnh</span>
                    </div>
                    <div className="coursera-clone-outcome-item">
                      <Target className="coursera-clone-outcome-icon" />
                      <span>Hiểu và áp dụng các best practices</span>
                    </div>
                    <div className="coursera-clone-outcome-item">
                      <Target className="coursera-clone-outcome-icon" />
                      <span>Tối ưu hóa hiệu suất và debug lỗi</span>
                    </div>
                  </div>

                  <h3 className="coursera-clone-subsection-title">Yêu cầu</h3>
                  <div className="coursera-clone-requirements">
                    <ul>
                      <li>Kiến thức cơ bản về HTML, CSS và JavaScript</li>
                      <li>Máy tính có thể cài đặt phần mềm phát triển</li>
                      <li>Đam mê học hỏi và thực hành</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div className="coursera-clone-curriculum-section">
                  <h2 className="coursera-clone-section-title">Nội dung khóa học</h2>
                  {course.modules && course.modules.length > 0 ? (
                    <div className="coursera-clone-modules-list">
                      {course.modules.map((module, idx) => (
                        <div key={module.id} className="coursera-clone-module-item">
                          <div className="coursera-clone-module-header">
                            <div className="coursera-clone-module-info">
                              <div className="coursera-clone-module-number">{(module.orderIndex ?? idx) + 1}</div>
                              <div>
                                <h4 className="coursera-clone-module-title">{module.title}</h4>
                                {module.description && (
                                  <span className="coursera-clone-module-duration">{module.description}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Chưa có nội dung.</p>
                  )}

                </div>
              )}

              {activeTab === 'instructor' && course.author && (
                <div className="coursera-clone-instructor-section">
                  <h2 className="coursera-clone-section-title">Về giảng viên</h2>
                  <div className="coursera-clone-instructor-card">
                    <div className="coursera-clone-instructor-header">
                      <img src={mentorProfile?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'} alt={course.author.firstName} className="coursera-clone-instructor-photo" />
                      <div className="coursera-clone-instructor-info-detailed">
                        <h3>{course.author.fullName || `${course.author.firstName} ${course.author.lastName}`}</h3>
                        {mentorProfile?.specialization && <p>{mentorProfile.specialization}</p>}
                      </div>
                    </div>
                    {mentorProfile?.bio && <p className="coursera-clone-instructor-bio">{mentorProfile.bio}</p>}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && Boolean(course.totalReviews && course.totalReviews > 0) && (
                <div className="coursera-clone-reviews-section">
                  <h2 className="coursera-clone-section-title">Đánh giá từ học viên</h2>
                  <div className="coursera-clone-reviews-summary">
                    <div className="coursera-clone-rating-overview">
                      <div className="coursera-clone-overall-rating">
                        <span className="coursera-clone-rating-number">{course.averageRating?.toFixed(1)}</span>
                        <div className="coursera-clone-rating-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`star ${star <= Math.round(course.averageRating || 0) ? 'filled' : ''}`} 
                            />
                          ))}
                        </div>
                        <span className="coursera-clone-rating-count">{course.totalReviews} đánh giá</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="coursera-clone-content-sidebar">
            <div className="coursera-clone-sidebar-card">
              <h3 className="coursera-clone-sidebar-title">Chi tiết khóa học</h3>
              <div className="coursera-clone-course-details">
                <div className="coursera-clone-detail-item">
                  <BookOpen className="coursera-clone-detail-icon" />
                  <div className="coursera-clone-detail-info">
                    <span className="coursera-clone-detail-label">Số mô-đun</span>
                    <span className="coursera-clone-detail-value">{course.modules?.length ?? 0}</span>
                  </div>
                </div>
                {course.currency && (
                  <div className="coursera-clone-detail-item">
                    <div className="coursera-clone-detail-info">
                      <span className="coursera-clone-detail-label">Tiền tệ</span>
                      <span className="coursera-clone-detail-value">{course.currency}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Related courses hidden until BE provides */}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && (
        <div className="coursera-clone-trailer-modal" onClick={closeTrailer}>
          <div className="coursera-clone-trailer-content" onClick={(e) => e.stopPropagation()}>
            <button className="coursera-clone-trailer-close" onClick={closeTrailer}>
              ×
            </button>
            <div className="coursera-clone-trailer-video">
              <img src={course.thumbnailUrl || (course.thumbnail?.url ?? '')} alt={course.title} />
              <div className="coursera-clone-trailer-overlay">
                <Play className="coursera-clone-trailer-play-icon" />
                <span>Video trailer sẽ được phát tại đây</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;