import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Users,
  Play,
  Share2,
  Heart,
  Eye,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Shield,
  Cpu,
  Layers,
  Activity
} from 'lucide-react';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../utils/useToast';
import { getCourse } from '../../services/courseService';
import { enrollUser, checkEnrollmentStatus, getEnrollmentProgress } from '../../services/enrollmentService';
import { CourseDetailDTO, CourseStatus } from '../../data/courseDTOs';
import { getMentorProfile, MentorProfile } from '../../services/mentorProfileService';
import { getGroupByCourse, joinGroup, GroupChatResponse } from '../../services/groupChatService';
import PurchaseCourseModal from '../../components/course/PurchaseCourseModal';
import Toast from '../../components/shared/Toast';
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
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showSuccess, showError, showInfo, hideToast } = useToast();
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
  const [groupChat, setGroupChat] = useState<GroupChatResponse | null>(null);

  const isPreviewMode = location.pathname.includes('/preview');
  const isCoursePublic = course?.status === CourseStatus.PUBLIC;
  const isActivationLocked = isPreviewMode || (!!course && course.status !== CourseStatus.PUBLIC);
  const canPreviewLearning = Boolean(user?.roles?.some((role) => role === 'MENTOR' || role === 'ADMIN'));

  const formatDate = (value?: string) => {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
    return date.toLocaleDateString('vi-VN');
  };

  const formatDuration = (hours?: number) => {
    if (!hours || hours <= 0) return 'Chưa cập nhật';
    if (hours < 1) return `${Math.round(hours * 60)} phút`;
    return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)} giờ`;
  };

  const getStatusLabel = (status?: CourseStatus) => {
    switch (status) {
      case CourseStatus.PUBLIC:
        return 'Đã công khai';
      case CourseStatus.PENDING:
        return 'Đang chờ duyệt';
      case CourseStatus.DRAFT:
        return 'Bản nháp';
      case CourseStatus.ARCHIVED:
        return 'Đã lưu trữ';
      case CourseStatus.REJECTED:
        return 'Bị từ chối';
      case CourseStatus.SUSPENDED:
        return 'Tạm khóa';
      default:
        return 'Chưa cập nhật';
    }
  };

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
          if (user) {
            const enrolled = await checkEnrollmentStatus(courseIdNum, user.id);
            setIsEnrolled(enrolled);
            if (enrolled) {
              const progress = await getEnrollmentProgress(courseIdNum, user.id);
              setEnrollmentProgress(progress.progress);
            }
          }
        } catch {
          // ignore
        }
      })
      .catch(err => {
        console.error('Error loading course:', err);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    if (course && user) {
      getGroupByCourse(course.id, user.id)
        .then(setGroupChat)
        .catch(() => {});
    }
  }, [course, user]);

  const handleJoinGroup = async () => {
    if (!groupChat || !user) return;
    try {
      if (!groupChat.isMember) {
        await joinGroup(groupChat.id, user.id);
      }
      navigate('/messages', { state: { openChatWith: groupChat.id, type: 'GROUP' } });
    } catch (e) {
      console.error('Failed to join group', e);
      showError('Lỗi', 'Không thể tham gia nhóm chat. Vui lòng thử lại.');
    }
  };

  const handleEnroll = async () => {
    if (!course || loadingEnrollment || !user) return;

    if (isPreviewMode) {
      showInfo('Chế độ xem trước', 'Bạn đang xem trước khóa học. Không thể kích hoạt trong chế độ này.');
      return;
    }

    if (!isCoursePublic) {
      showInfo('Chưa được duyệt', 'Khóa học cần được admin duyệt trước khi học viên có thể kích hoạt.');
      return;
    }

    setLoadingEnrollment(true);

    try {
      if (!course.price || course.price === 0) {
        await enrollUser(course.id, user.id);
        setIsEnrolled(true);
        setEnrollmentProgress(0);
        showSuccess(
          'Đăng ký thành công!', 
          'Bạn đã tham gia khóa học miễn phí. Chúc bạn học tập hiệu quả!',
          {
            text: 'Bắt đầu học',
            onClick: () => navigate('/course-learning', { state: { courseId: course.id } })
          }
        );
      } else {
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      showError('Lỗi đăng ký', 'Có lỗi xảy ra khi đăng ký khóa học. Vui lòng thử lại.');
    } finally {
      setLoadingEnrollment(false);
    }
  };

  const handleTrailerPreview = () => {
    setShowTrailer(true);
  };

  const handlePreviewLearning = () => {
    if (!course) return;
    navigate('/course-learning', { state: { courseId: course.id, preview: true } });
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

  const getLevelLabel = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'BEGINNER':
        return 'Cơ bản';
      case 'INTERMEDIATE':
        return 'Trung cấp';
      case 'ADVANCED':
        return 'Nâng cao';
      default:
        return level || 'Chưa cập nhật';
    }
  };

  if (loading) {
    return (
      <div className={`cockpit-detail-container ${theme}`} data-theme={theme}>
        <div className="cockpit-detail-hud-frame">
          <div className="cockpit-detail-loading">
            <MeowlKuruLoader size="medium" text="" />
            <p className="cockpit-detail-loading-text">ĐANG TẢI DỮ LIỆU KHÓA HỌC...</p>
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
            <h2 className="cockpit-detail-error-title">KHÔNG TÌM THẤY KHÓA HỌC</h2>
            <p className="cockpit-detail-error-text">Khóa học không tồn tại trong hệ thống</p>
            <button onClick={() => navigate('/courses')} className="cockpit-detail-back-btn">
              <ArrowLeft className="cockpit-detail-btn-icon" />
              QUAY LẠI
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusNotice = isPreviewMode
    ? 'Bạn đang xem trước khóa học. Học viên chỉ có thể kích hoạt khi khóa học được admin duyệt và công khai.'
    : (course.status !== CourseStatus.PUBLIC
      ? `Khóa học hiện đang ở trạng thái ${getStatusLabel(course.status)}. Chỉ có thể kích hoạt sau khi được duyệt.`
      : null);

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
            <span className={`cockpit-detail-status-pill ${course.status?.toLowerCase()}`}>
              {getStatusLabel(course.status)}
            </span>
            {isPreviewMode && (
              <span className="cockpit-detail-status-pill preview">
                Xem trước
              </span>
            )}
          </div>
        </div>

        {statusNotice && (
          <div className="cockpit-detail-status-banner">
            <div className="cockpit-detail-status-banner-title">Lưu ý</div>
            <p className="cockpit-detail-status-banner-text">{statusNotice}</p>
          </div>
        )}

        {/* Hero Section */}
        <div className="cockpit-detail-hero">
          <div className="cockpit-detail-hero-grid">
            {/* Left: Course Info */}
            <div className="cockpit-detail-info-panel">
              {/* Level Badge */}
              {course.level && (
                <div className={`cockpit-detail-level-badge cockpit-detail-level-${getLevelColor(course.level)}`}>
                  <Shield className="cockpit-detail-badge-icon" />
                  <span>{getLevelLabel(course.level)}</span>
                </div>
              )}

              {/* Title */}
              <h1 className="cockpit-detail-title">{course.title}</h1>

              {/* Description */}
              <p className="cockpit-detail-description">
                {course.shortDescription || course.description}
              </p>

              {/* Stats Grid */}
              <div className="cockpit-detail-stats-grid">
                <div className="cockpit-detail-stat-card">
                  <Star className="cockpit-detail-stat-icon" />
                  <div className="cockpit-detail-stat-content">
                    <span className="cockpit-detail-stat-value">{course.averageRating?.toFixed(1) ?? '0.0'}</span>
                    <span className="cockpit-detail-stat-label">ĐIỂM ĐÁNH GIÁ</span>
                  </div>
                </div>
                <div className="cockpit-detail-stat-card">
                  <Users className="cockpit-detail-stat-icon" />
                  <div className="cockpit-detail-stat-content">
                    <span className="cockpit-detail-stat-value">{formatStudentCount(course.enrollmentCount)}</span>
                    <span className="cockpit-detail-stat-label">HỌC VIÊN</span>
                  </div>
                </div>
                <div className="cockpit-detail-stat-card">
                  <Layers className="cockpit-detail-stat-icon" />
                  <div className="cockpit-detail-stat-content">
                    <span className="cockpit-detail-stat-value">{course.modules?.length ?? 0}</span>
                    <span className="cockpit-detail-stat-label">CHƯƠNG</span>
                  </div>
                </div>
              </div>

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
                    className={`cockpit-detail-enroll-btn enrolled ${isActivationLocked ? 'locked' : ''}`}
                    onClick={() => {
                      if (!isActivationLocked) {
                        navigate('/course-learning', { state: { courseId: course.id } });
                      }
                    }}
                    disabled={isActivationLocked}
                  >
                    <span>{isActivationLocked ? 'CHƯA THỂ TRUY CẬP' : 'TIẾP TỤC HỌC'}</span>
                  </button>
                ) : (
                  <button
                    className={`cockpit-detail-enroll-btn ${loadingEnrollment ? 'loading' : ''} ${isActivationLocked ? 'locked' : ''}`}
                    onClick={handleEnroll}
                    disabled={loadingEnrollment || isActivationLocked}
                  >
                    <span>
                      {isActivationLocked
                        ? (isPreviewMode ? 'CHẾ ĐỘ XEM TRƯỚC' : 'CHỜ DUYỆT')
                        : (loadingEnrollment ? 'ĐANG XỬ LÝ...' : 'KÍCH HOẠT KHÓA HỌC')}
                    </span>
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
                  {canPreviewLearning && (
                    <button
                      className="cockpit-detail-action-btn"
                      onClick={handlePreviewLearning}
                    >
                      <Eye className="cockpit-detail-action-icon" />
                      <span>XEM TRƯỚC NỘI DUNG</span>
                    </button>
                  )}
                  {isEnrolled && !isActivationLocked && groupChat && (
                    <button
                      className="cockpit-detail-action-btn"
                      onClick={handleJoinGroup}
                      style={{ color: '#60a5fa', borderColor: '#60a5fa' }}
                    >
                      <Users className="cockpit-detail-action-icon" />
                      <span>{groupChat.isMember ? 'VÀO GROUP' : 'THAM GIA GROUP'}</span>
                    </button>
                  )}
                  <button className="cockpit-detail-action-btn">
                    <Share2 className="cockpit-detail-action-icon" />
                    <span>CHIA SẺ</span>
                  </button>
                </div>

                {/* Progress Section (if enrolled) */}
                {isEnrolled && !isActivationLocked && (
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
              <span>TỔNG QUAN & NỘI DUNG</span>
            </button>
            <button
              className={`cockpit-detail-tab ${activeTab === 'curriculum' ? 'active' : ''}`}
              onClick={() => setActiveTab('curriculum')}
            >
              <Layers className="cockpit-detail-tab-icon" />
              <span>CHƯƠNG TRÌNH</span>
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
                    <h2 className="cockpit-detail-section-title">GIỚI THIỆU KHÓA HỌC</h2>
                  </div>
                  <div className="cockpit-detail-section-content">
                    {course.description ? (
                      <p className="cockpit-detail-text" style={{ whiteSpace: 'pre-line' }}>
                        {course.description}
                      </p>
                    ) : (
                      <p className="cockpit-detail-text italic opacity-70">
                        Chưa có mô tả chi tiết cho khóa học này.
                      </p>
                    )}
                  </div>
                </div>

                <div className="cockpit-detail-section-panel">
                  <div className="cockpit-detail-section-header">
                    <div className="cockpit-detail-section-marker"></div>
                    <h2 className="cockpit-detail-section-title">THÔNG TIN KHÓA HỌC</h2>
                  </div>
                  <div className="cockpit-detail-facts-grid">
                    <div className="cockpit-detail-fact">
                      <span className="cockpit-detail-fact-label">Cấp độ</span>
                      <span className="cockpit-detail-fact-value">{getLevelLabel(course.level)}</span>
                    </div>
                    <div className="cockpit-detail-fact">
                      <span className="cockpit-detail-fact-label">Danh mục</span>
                      <span className="cockpit-detail-fact-value">{course.category || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="cockpit-detail-fact">
                      <span className="cockpit-detail-fact-label">Ngôn ngữ</span>
                      <span className="cockpit-detail-fact-value">{course.language || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="cockpit-detail-fact">
                      <span className="cockpit-detail-fact-label">Thời lượng</span>
                      <span className="cockpit-detail-fact-value">{formatDuration(course.estimatedDurationHours)}</span>
                    </div>
                    <div className="cockpit-detail-fact">
                      <span className="cockpit-detail-fact-label">Cập nhật</span>
                      <span className="cockpit-detail-fact-value">
                        {formatDate(course.publishedDate || course.updatedAt)}
                      </span>
                    </div>
                    <div className="cockpit-detail-fact">
                      <span className="cockpit-detail-fact-label">Số chương</span>
                      <span className="cockpit-detail-fact-value">{course.modules?.length ?? 0}</span>
                    </div>
                  </div>
                </div>

                {Boolean(course.learningObjectives?.length) && (
                  <div className="cockpit-detail-section-panel">
                    <div className="cockpit-detail-section-header">
                      <div className="cockpit-detail-section-marker"></div>
                      <h2 className="cockpit-detail-section-title">BẠN SẼ HỌC ĐƯỢC</h2>
                    </div>
                    <div className="cockpit-detail-outcomes-grid">
                      {(course.learningObjectives || []).map((objective, idx) => (
                        <div key={`${objective}-${idx}`} className="cockpit-detail-outcome-card">
                          <span>{objective}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Boolean(course.requirements?.length) && (
                  <div className="cockpit-detail-section-panel">
                    <div className="cockpit-detail-section-header">
                      <div className="cockpit-detail-section-marker"></div>
                      <h2 className="cockpit-detail-section-title">YÊU CẦU</h2>
                    </div>
                    <ul className="cockpit-detail-requirements">
                      {(course.requirements || []).map((requirement, idx) => (
                        <li key={`${requirement}-${idx}`}>
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="cockpit-detail-curriculum">
                <div className="cockpit-detail-section-panel">
                  <div className="cockpit-detail-section-header">
                    <div className="cockpit-detail-section-marker"></div>
                    <h2 className="cockpit-detail-section-title">DANH SÁCH CHƯƠNG</h2>
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
                              <p className="cockpit-detail-module-detail">Chi tiết chương sẽ được hiển thị ở đây</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="cockpit-detail-empty">
                      <Layers className="cockpit-detail-empty-icon" />
                      <p className="cockpit-detail-empty-text">Chưa có nội dung chương</p>
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
            showSuccess(
              'Thanh toán thành công!',
              'Bạn đã kích hoạt khóa học. Hãy bắt đầu hành trình học tập!',
              {
                text: 'Bắt đầu học',
                onClick: () => navigate('/course-learning', { state: { courseId: course.id } })
              }
            );
          }}
        />
      )}

      {/* Toast Notification */}
      <Toast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
        actionButton={toast.actionButton}
      />
    </div>
  );
};

export default CourseDetailPage;
