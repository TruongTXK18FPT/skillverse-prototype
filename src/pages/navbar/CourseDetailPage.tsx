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
import { findCourseById, parsePrice, isFreePrice, Course } from '../../services/courseService';
import '../../styles/CourseDetailPage.css';

interface CourseModule {
  id: number;
  title: string;
  duration: string;
  lessons: string[];
  isPreview?: boolean;
}

const CourseDetailPage = () => {
  const { theme } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Check if course data was passed via navigation state
  const passedCourse = location.state?.course;

  // Mock course modules data
  const courseModules: CourseModule[] = [
    {
      id: 1,
      title: "Giới thiệu và Cài đặt",
      duration: "45 phút",
      lessons: [
        "Giới thiệu về khóa học",
        "Cài đặt môi trường phát triển",
        "Tạo dự án đầu tiên",
        "Hiểu về cấu trúc thư mục"
      ],
      isPreview: true
    },
    {
      id: 2,
      title: "Các khái niệm cơ bản",
      duration: "1 giờ 20 phút",
      lessons: [
        "Components và JSX",
        "Props và State",
        "Event Handling",
        "Conditional Rendering",
        "Lists và Keys"
      ]
    },
    {
      id: 3,
      title: "Hooks nâng cao",
      duration: "2 giờ",
      lessons: [
        "useState và useEffect",
        "useContext và useReducer",
        "Custom Hooks",
        "useCallback và useMemo",
        "Thực hành với Hooks"
      ]
    },
    {
      id: 4,
      title: "Quản lý State",
      duration: "1 giờ 30 phút",
      lessons: [
        "Context API",
        "Redux Toolkit",
        "State Management Patterns",
        "Debugging State"
      ]
    }
  ];

  // Mock instructor data
  const instructorInfo = {
    name: "",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    title: "Senior Frontend Developer",
    experience: "8+ năm kinh nghiệm",
    students: "15,000+ học viên",
    courses: "12 khóa học",
    rating: 4.8,
    bio: "Chuyên gia Frontend với hơn 8 năm kinh nghiệm làm việc tại các công ty công nghệ hàng đầu. Đã giảng dạy và hướng dẫn hàng nghìn lập trình viên."
  };

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      user: "Nguyễn Văn A",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face",
      rating: 5,
      date: "2 tuần trước",
      comment: "Khóa học rất hay và dễ hiểu. Giảng viên giải thích rất chi tiết và có nhiều ví dụ thực tế."
    },
    {
      id: 2,
      user: "Trần Thị B",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b2dc3d20?w=40&h=40&fit=crop&crop=face",
      rating: 5,
      date: "1 tháng trước",
      comment: "Nội dung cập nhật, bài tập thực hành phong phú. Rất đáng để đầu tư."
    },
    {
      id: 3,
      user: "Lê Văn C",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      rating: 4,
      date: "3 tuần trước",
      comment: "Khóa học tốt, tuy nhiên một số phần có thể giải thích thêm chi tiết hơn."
    }
  ];

  useEffect(() => {
    // If course data was passed via navigation state, use it directly
    if (passedCourse) {
      setCourse({
        ...passedCourse,
        rating: passedCourse.rating ?? Math.random() * 2 + 3,
        students: passedCourse.students ?? Math.floor(Math.random() * 5000) + 100
      });
      setLoading(false);
      return;
    }

    // Fallback: try to fetch from API if no course data was passed and we have an ID
    if (!id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Use the course service to find the course
    findCourseById(id)
      .then(foundCourse => {
        if (foundCourse) {
          setCourse(foundCourse);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching course:', err);
        setLoading(false);
      });
  }, [id, passedCourse]);

  const handleEnroll = () => {
    if (!course) return;
    
    if (isFreePrice(course.price)) {
      // Handle free course enrollment
      alert('Bạn đã đăng ký thành công khóa học miễn phí!');
      return;
    }

    // Navigate to payment page with course data
    navigate('/payment', {
      state: {
        type: 'course',
        title: course.title,
        price: parsePrice(course.price),
        instructor: course.instructor,
        description: course.description,
        image: course.image
      }
    });
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const formatStudentCount = (count: string | number): string => {
    const num = typeof count === 'number' ? count : parseInt(count.toString());
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className={`course-detail-container ${theme}`} data-theme={theme}>
        <div className="course-detail-loading-container">
          <div className="course-detail-loading-spinner"></div>
          <p>Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`course-detail-container ${theme}`} data-theme={theme}>
        <div className="course-detail-error-container">
          <h2>Không tìm thấy khóa học</h2>
          <button onClick={() => navigate('/courses')} className="course-detail-back-to-courses-btn">
            Quay lại danh sách khóa học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`course-detail-container ${theme}`} data-theme={theme}>
      {/* Hero Section */}
      <div className="course-detail-course-hero">
        <div className="course-detail-hero-background">
          <img src={course.image} alt={course.title} className="course-detail-hero-bg-image" />
          <div className="course-detail-hero-overlay"></div>
        </div>
        
        <div className="course-detail-hero-content">
          <button onClick={() => navigate(-1)} className="course-detail-back-button">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>

          <div className="course-detail-hero-main">
            <div className="course-detail-hero-info">
              <div className="course-detail-course-badges">
                {course.level && (
                  <span className={`level-badge level-${course.level.toLowerCase()}`}>
                    {course.level}
                  </span>
                )}
                <span className="course-detail-category-badge">{course.category}</span>
              </div>

              <h1 className="course-detail-course-title">{course.title}</h1>
              <p className="course-detail-course-description">{course.description}</p>

              <div className="course-detail-course-stats">
                <div className="course-detail-stat-item">
                  <Star className="course-detail-stat-icon filled" />
                  <span className="course-detail-stat-value">{course.rating?.toFixed(1)}</span>
                  <span className="course-detail-stat-label">(1,234 đánh giá)</span>
                </div>
                <div className="course-detail-stat-item">
                  <Users className="course-detail-stat-icon" />
                  <span className="course-detail-stat-value">{formatStudentCount(course.students || 0)}</span>
                  <span className="course-detail-stat-label">học viên</span>
                </div>
                <div className="course-detail-stat-item">
                  <Clock className="course-detail-stat-icon" />
                  <span className="course-detail-stat-value">{course.duration || '6 tuần'}</span>
                </div>
                <div className="course-detail-stat-item">
                  <BookOpen className="course-detail-stat-icon" />
                  <span className="course-detail-stat-value">{course.modules || 12}</span>
                  <span className="course-detail-stat-label">bài học</span>
                </div>
              </div>

              <div className="course-detail-instructor-info">
                <img src={instructorInfo.avatar} alt={course.instructor} className="course-detail-instructor-avatar" />
                <div className="course-detail-instructor-details">
                  <h4 className="course-detail-instructor-name">{course.instructor}</h4>
                  <p className="course-detail-instructor-title">{instructorInfo.title}</p>
                </div>
              </div>
            </div>

            <div className="course-detail-hero-card">
              <div className="course-detail-course-preview">
                <img src={course.image} alt={course.title} className="course-detail-preview-image" />
                <button className="course-detail-preview-play-btn">
                  <Play className="course-detail-play-icon" />
                  <span>Xem trailer</span>
                </button>
              </div>

              <div className="course-detail-pricing-section">
                <div className="course-detail-price-info">
                  {isFreePrice(course.price) ? (
                    <div className="course-detail-free-price">
                      <span className="course-detail-price-label">Miễn phí</span>
                    </div>
                  ) : (
                    <div className="course-detail-paid-price">
                      <span className="course-detail-current-price">{course.price}</span>
                      <span className="course-detail-price-note">Thanh toán một lần</span>
                    </div>
                  )}
                </div>

                <button 
                  className={`enroll-btn ${isFreePrice(course.price) ? 'free' : 'paid'}`}
                  onClick={handleEnroll}
                >
                  <span className="course-detail-enroll-icon">⚡</span>
                  {isFreePrice(course.price) ? 'Đăng ký miễn phí' : 'Đăng ký ngay'}
                </button>

                <div className="course-detail-action-buttons">
                  <button 
                    className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
                    onClick={() => setIsWishlisted(!isWishlisted)}
                  >
                    <Heart className="course-detail-heart-icon" />
                    <span>{isWishlisted ? 'Đã lưu' : 'Lưu khóa học'}</span>
                  </button>
                  <button className="course-detail-share-btn">
                    <Share2 className="course-detail-share-icon" />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>

              <div className="course-detail-course-includes">
                <h4 className="course-detail-includes-title">Khóa học bao gồm:</h4>
                <ul className="course-detail-includes-list">
                  <li><CheckCircle className="course-detail-check-icon" />Truy cập trọn đời</li>
                  <li><CheckCircle className="course-detail-check-icon" />Chứng chỉ hoàn thành</li>
                  <li><CheckCircle className="course-detail-check-icon" />Hỗ trợ từ giảng viên</li>
                  <li><CheckCircle className="course-detail-check-icon" />Tài liệu tham khảo</li>
                  <li><CheckCircle className="course-detail-check-icon" />Bài tập thực hành</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="course-detail-course-content">
        <div className="course-detail-content-layout">
          <div className="course-detail-main-content">
            {/* Navigation Tabs */}
            <div className="course-detail-content-tabs">
              <button 
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Tổng quan
              </button>
              <button 
                className={`tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
                onClick={() => setActiveTab('curriculum')}
              >
                Nội dung khóa học
              </button>
              <button 
                className={`tab-btn ${activeTab === 'instructor' ? 'active' : ''}`}
                onClick={() => setActiveTab('instructor')}
              >
                Giảng viên
              </button>
              <button 
                className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Đánh giá
              </button>
            </div>

            {/* Tab Content */}
            <div className="course-detail-tab-content">
              {activeTab === 'overview' && (
                <div className="course-detail-overview-section">
                  <h2 className="course-detail-section-title">Mô tả khóa học</h2>
                  <div className="course-detail-course-description-full">
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

                  <h3 className="course-detail-subsection-title">Bạn sẽ học được gì?</h3>
                  <div className="course-detail-learning-outcomes">
                    <div className="course-detail-outcome-item">
                      <Target className="course-detail-outcome-icon" />
                      <span>Nắm vững các khái niệm cơ bản và nâng cao</span>
                    </div>
                    <div className="course-detail-outcome-item">
                      <Target className="course-detail-outcome-icon" />
                      <span>Xây dựng các dự án thực tế hoàn chỉnh</span>
                    </div>
                    <div className="course-detail-outcome-item">
                      <Target className="course-detail-outcome-icon" />
                      <span>Hiểu và áp dụng các best practices</span>
                    </div>
                    <div className="course-detail-outcome-item">
                      <Target className="course-detail-outcome-icon" />
                      <span>Tối ưu hóa hiệu suất và debug lỗi</span>
                    </div>
                  </div>

                  <h3 className="course-detail-subsection-title">Yêu cầu</h3>
                  <div className="course-detail-requirements">
                    <ul>
                      <li>Kiến thức cơ bản về HTML, CSS và JavaScript</li>
                      <li>Máy tính có thể cài đặt phần mềm phát triển</li>
                      <li>Đam mê học hỏi và thực hành</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div className="course-detail-curriculum-section">
                  <h2 className="course-detail-section-title">Nội dung khóa học</h2>
                  <div className="course-detail-curriculum-stats">
                    <span>{courseModules.length} chương</span>
                    <span>•</span>
                    <span>{courseModules.reduce((acc, module) => acc + module.lessons.length, 0)} bài học</span>
                    <span>•</span>
                    <span>Tổng thời lượng: 8 giờ</span>
                  </div>

                  <div className="course-detail-modules-list">
                    {courseModules.map((module) => (
                      <div key={module.id} className="course-detail-module-item">
                        <button 
                          className="course-detail-module-header"
                          onClick={() => toggleModule(module.id)}
                        >
                          <div className="course-detail-module-info">
                            <h4 className="course-detail-module-title">
                              Chương {module.id}: {module.title}
                            </h4>
                            <span className="course-detail-module-duration">{module.duration}</span>
                          </div>
                          {expandedModule === module.id ? 
                            <ChevronUp className="course-detail-expand-icon" /> : 
                            <ChevronDown className="course-detail-expand-icon" />
                          }
                        </button>

                        {expandedModule === module.id && (
                          <div className="course-detail-module-content">
                            <ul className="course-detail-lessons-list">
                              {module.lessons.map((lesson, index) => (
                                <li key={index} className="course-detail-lesson-item">
                                  <Play className="course-detail-lesson-icon" />
                                  <span className="course-detail-lesson-title">{lesson}</span>
                                  {module.isPreview && index === 0 && (
                                    <span className="course-detail-preview-badge">Preview</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'instructor' && (
                <div className="course-detail-instructor-section">
                  <h2 className="course-detail-section-title">Về giảng viên</h2>
                  <div className="course-detail-instructor-card">
                    <div className="course-detail-instructor-header">
                      <img src={instructorInfo.avatar} alt={course.instructor} className="course-detail-instructor-photo" />
                      <div className="course-detail-instructor-info-detailed">
                        <h3 className="course-detail-instructor-name">{course.instructor}</h3>
                        <p className="course-detail-instructor-title">{instructorInfo.title}</p>
                        <div className="course-detail-instructor-stats">
                          <div className="course-detail-instructor-stat">
                            <Star className="course-detail-stat-icon" />
                            <span>{instructorInfo.rating} xếp hạng</span>
                          </div>
                          <div className="course-detail-instructor-stat">
                            <Users className="course-detail-stat-icon" />
                            <span>{instructorInfo.students}</span>
                          </div>
                          <div className="course-detail-instructor-stat">
                            <BookOpen className="course-detail-stat-icon" />
                            <span>{instructorInfo.courses}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="course-detail-instructor-bio">{instructorInfo.bio}</p>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="course-detail-reviews-section">
                  <h2 className="course-detail-section-title">Đánh giá từ học viên</h2>
                  <div className="course-detail-reviews-summary">
                    <div className="course-detail-rating-overview">
                      <div className="course-detail-overall-rating">
                        <span className="course-detail-rating-number">{course.rating?.toFixed(1)}</span>
                        <div className="course-detail-rating-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`star ${star <= Math.round(course.rating || 0) ? 'filled' : ''}`} 
                            />
                          ))}
                        </div>
                        <span className="course-detail-rating-count">1,234 đánh giá</span>
                      </div>
                    </div>
                  </div>

                  <div className="course-detail-reviews-list">
                    {reviews.map((review) => (
                      <div key={review.id} className="course-detail-review-item">
                        <div className="course-detail-review-header">
                          <img src={review.avatar} alt={review.user} className="course-detail-reviewer-avatar" />
                          <div className="course-detail-reviewer-info">
                            <h4 className="course-detail-reviewer-name">{review.user}</h4>
                            <div className="course-detail-review-meta">
                              <div className="course-detail-review-rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`star small ${star <= review.rating ? 'filled' : ''}`} 
                                  />
                                ))}
                              </div>
                              <span className="course-detail-review-date">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="course-detail-review-comment">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="course-detail-content-sidebar">
            <div className="course-detail-sidebar-card">
              <h3 className="course-detail-sidebar-title">Chi tiết khóa học</h3>
              <div className="course-detail-course-details">
                <div className="course-detail-detail-item">
                  <Clock className="course-detail-detail-icon" />
                  <div className="course-detail-detail-info">
                    <span className="course-detail-detail-label">Thời lượng</span>
                    <span className="course-detail-detail-value">{course.duration || '6 tuần'}</span>
                  </div>
                </div>
                <div className="course-detail-detail-item">
                  <BookOpen className="course-detail-detail-icon" />
                  <div className="course-detail-detail-info">
                    <span className="course-detail-detail-label">Bài học</span>
                    <span className="course-detail-detail-value">{course.modules || 12} bài</span>
                  </div>
                </div>
                <div className="course-detail-detail-item">
                  <Globe className="course-detail-detail-icon" />
                  <div className="course-detail-detail-info">
                    <span className="course-detail-detail-label">Ngôn ngữ</span>
                    <span className="course-detail-detail-value">Tiếng Việt</span>
                  </div>
                </div>
                <div className="course-detail-detail-item">
                  <Trophy className="course-detail-detail-icon" />
                  <div className="course-detail-detail-info">
                    <span className="course-detail-detail-label">Chứng chỉ</span>
                    <span className="course-detail-detail-value">Có</span>
                  </div>
                </div>
                <div className="course-detail-detail-item">
                  <Download className="course-detail-detail-icon" />
                  <div className="course-detail-detail-info">
                    <span className="course-detail-detail-label">Tài liệu</span>
                    <span className="course-detail-detail-value">Có thể tải</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="course-detail-sidebar-card">
              <h3 className="course-detail-sidebar-title">Khóa học liên quan</h3>
              <div className="course-detail-related-courses">
                <div className="course-detail-related-course-item">
                  <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&h=60&fit=crop" alt="Related course" className="course-detail-related-course-image" />
                  <div className="course-detail-related-course-info">
                    <h4 className="course-detail-related-course-title">JavaScript Nâng cao</h4>
                    <span className="course-detail-related-course-price">590,000₫</span>
                  </div>
                </div>
                <div className="course-detail-related-course-item">
                  <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=80&h=60&fit=crop" alt="Related course" className="course-detail-related-course-image" />
                  <div className="course-detail-related-course-info">
                    <h4 className="course-detail-related-course-title">Node.js Backend</h4>
                    <span className="course-detail-related-course-price">790,000₫</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;