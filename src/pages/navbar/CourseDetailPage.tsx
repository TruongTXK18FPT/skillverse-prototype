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
  Activity,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../utils/useToast';
import {
  getCourse,
} from '../../services/courseService';
import { listModulesWithContent } from '../../services/moduleService';
import { enrollUser, checkEnrollmentStatus, getEnrollmentProgress } from '../../services/enrollmentService';
import { CourseDetailDTO, CourseStatus } from '../../data/courseDTOs';
import { ModuleDetailDTO } from '../../data/moduleDTOs';
import { getMentorProfile, MentorProfile } from '../../services/mentorProfileService';
import { getGroupByCourse, joinGroup, GroupChatResponse } from '../../services/groupChatService';
import {
  buildCourseLearningDestination,
  buildCourseLearningOrigin,
} from '../../utils/courseLearningNavigation';
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
  const [modules, setModules] = useState<ModuleDetailDTO[]>([]);
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

  const buildCourseLearningState = (preview = false) => {
    if (!course) return null;

    return {
      courseId: course.id,
      preview,
      origin: buildCourseLearningOrigin(location.pathname, {
        search: location.search,
        hash: location.hash,
        label: 'trang khóa học'
      })
    };
  };

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
        
        // Fetch detailed module content (lessons, quizzes, etc.)
        try {
          const detailModules = await listModulesWithContent(courseIdNum);
          setModules(detailModules);
        } catch (mErr) {
          console.error('Error loading module content:', mErr);
          // Fallback to basic modules from course DTO if detail fetch fails
          if (dto.modules) {
            setModules(dto.modules.map(m => ({
              ...m,
              courseId: courseIdNum,
              createdAt: '',
              updatedAt: '',
              lessons: [],
              quizzes: [],
              assignments: []
            })));
          }
        }

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
    if (!course || loadingEnrollment) return;

    if (!user) {
      showInfo(
        'Yêu cầu đăng nhập', 
        'Vui lòng đăng nhập để kích hoạt khóa học này.',
        {
          text: 'Đăng nhập ngay',
          onClick: () => navigate('/login', { state: { from: location.pathname } })
        },
        true
      );
      return;
    }

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
            onClick: () => {
              const courseLearningState = buildCourseLearningState();
              if (!courseLearningState) return;

              navigate(buildCourseLearningDestination(courseLearningState), {
                state: courseLearningState
              });
            }
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

  const handleShare = () => {
    const shareUrl = `skillverse.vn/courses/${id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showSuccess('Thành công', 'Đã sao chép liên kết khóa học vào bộ nhớ tạm!', undefined, true);
      })
      .catch(() => {
        showError('Lỗi', 'Không thể sao chép liên kết.');
      });
  };

  const handleMentorChat = () => {
    if (!user) {
      showInfo(
        'Yêu cầu đăng nhập', 
        'Vui lòng đăng nhập để nhắn tin với Mentor.',
        {
          text: 'Đăng nhập ngay',
          onClick: () => navigate('/login', { state: { from: location.pathname } })
        },
        true
      );
      return;
    }
    navigate('/messages', { state: { openChatWith: course?.author?.id, type: 'DIRECT' } });
  };

  const handlePreviewLearning = () => {
    if (!course) return;

    const courseLearningState = buildCourseLearningState(true);
    if (!courseLearningState) return;

    navigate(buildCourseLearningDestination(courseLearningState), {
      state: courseLearningState
    });
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

              {/* Course Facts / Quick Info */}
              <div className="cockpit-detail-quick-info">
                <div className="cockpit-detail-quick-grid">
                  <div className="cockpit-detail-quick-item">
                    <span className="cockpit-detail-quick-label">CẤP ĐỘ</span>
                    <span className="cockpit-detail-quick-value">{getLevelLabel(course.level)}</span>
                  </div>
                  <div className="cockpit-detail-quick-item">
                    <span className="cockpit-detail-quick-label">DANH MỤC</span>
                    <span className="cockpit-detail-quick-value">{course.category || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="cockpit-detail-quick-item">
                    <span className="cockpit-detail-quick-label">NGÔN NGỮ</span>
                    <span className="cockpit-detail-quick-value">{course.language || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="cockpit-detail-quick-item">
                    <span className="cockpit-detail-quick-label">THỜI LƯỢNG</span>
                    <span className="cockpit-detail-quick-value">{formatDuration(course.estimatedDurationHours)}</span>
                  </div>
                  <div className="cockpit-detail-quick-item">
                    <span className="cockpit-detail-quick-label">CẬP NHẬT</span>
                    <span className="cockpit-detail-quick-value">{formatDate(course.publishedDate || course.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Instructor Quick Info */}
              {course.author && (
                <div className="cockpit-detail-instructor-mini-card">
                  <div className="cockpit-detail-instructor-mini-header">
                    <Cpu className="cockpit-detail-instructor-mini-icon" />
                    <span className="cockpit-detail-instructor-mini-label">AUTHOR / INSTRUCTOR</span>
                  </div>
                  <div className="cockpit-detail-instructor-mini-body">
                    <img 
                      src={mentorProfile?.avatar || course.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.author.fullName || 'Instructor')}&background=00f6ff&color=0a0e1a`} 
                      alt={course.author.fullName} 
                      className="cockpit-detail-instructor-mini-avatar"
                    />
                    <div className="cockpit-detail-instructor-mini-info">
                      <h3 className="cockpit-detail-instructor-mini-name">
                        {course.author.fullName || `${course.author.firstName} ${course.author.lastName}`}
                      </h3>
                      {mentorProfile?.specialization && (
                        <p className="cockpit-detail-instructor-mini-spec">{mentorProfile.specialization}</p>
                      )}
                    </div>
                  </div>
                  {/* Instructor Actions */}
                  <div className="cockpit-detail-instructor-mini-footer">
                    <button className="cockpit-detail-instructor-mini-btn" onClick={() => navigate(`/mentorship?search=${encodeURIComponent(course.author?.fullName || '')}`)}>
                      <ExternalLink className="cockpit-detail-instructor-mini-btn-icon" />
                      HỒ SƠ MENTOR
                    </button>
                    <button className="cockpit-detail-instructor-mini-btn primary" onClick={handleMentorChat}>
                      <MessageSquare className="cockpit-detail-instructor-mini-btn-icon" />
                      NHẮN TIN
                    </button>
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
                        const courseLearningState = buildCourseLearningState();
                        if (!courseLearningState) return;

                        navigate(buildCourseLearningDestination(courseLearningState), {
                          state: courseLearningState
                        });
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

                {/* Share Button */}
                <button 
                  className="cockpit-detail-share-full-btn"
                  onClick={handleShare}
                >
                  <Share2 className="cockpit-detail-share-icon" />
                  CHIA SẺ KHÓA HỌC
                </button>

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
                  {modules && modules.length > 0 ? (
                    <div className="cockpit-detail-modules-list">
                      {modules.map((module, idx) => (
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
                              {/* Integrated lesson, quiz, assignment list */}
                              <div className="cockpit-detail-module-items">
                                {(module.lessons && module.lessons.length > 0) || 
                                 (module.quizzes && module.quizzes.length > 0) || 
                                 (module.assignments && module.assignments.length > 0) ? (
                                  <>
                                    {module.lessons?.map((lesson, lIdx) => (
                                      <div key={`lesson-${lesson.id}`} className="cockpit-detail-item">
                                        <div className="cockpit-detail-item-icon">
                                          <Play className="w-4 h-4" />
                                        </div>
                                        <div className="cockpit-detail-item-text">
                                          <span className="cockpit-detail-item-type">BÀI HỌC {lIdx + 1}</span>
                                          <span className="cockpit-detail-item-title">{lesson.title}</span>
                                        </div>
                                        {lesson.durationSec > 0 && (
                                          <div className="cockpit-detail-item-meta">
                                            {Math.floor(lesson.durationSec / 60)} PHÚT
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {module.quizzes?.map((quiz, qIdx) => (
                                      <div key={`quiz-${quiz.id}`} className="cockpit-detail-item quiz">
                                        <div className="cockpit-detail-item-icon">
                                          <Zap className="w-4 h-4" />
                                        </div>
                                        <div className="cockpit-detail-item-text">
                                          <span className="cockpit-detail-item-type">BÀI KIỂM TRA</span>
                                          <span className="cockpit-detail-item-title">{quiz.title}</span>
                                        </div>
                                        <div className="cockpit-detail-item-meta">
                                          {quiz.questionCount} CÂU HỎI
                                        </div>
                                      </div>
                                    ))}
                                    {module.assignments?.map((assignment, aIdx) => (
                                      <div key={`assignment-${assignment.id}`} className="cockpit-detail-item assignment">
                                        <div className="cockpit-detail-item-icon">
                                          <Target className="w-4 h-4" />
                                        </div>
                                        <div className="cockpit-detail-item-text">
                                          <span className="cockpit-detail-item-type">BÀI TẬP</span>
                                          <span className="cockpit-detail-item-title">{assignment.title}</span>
                                        </div>
                                        <div className="cockpit-detail-item-meta">
                                          {assignment.maxScore} ĐIỂM
                                        </div>
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <p className="cockpit-detail-module-detail">Nội dung chi tiết chương đang được cập nhật</p>
                                )}
                              </div>
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
                onClick: () => {
                  const courseLearningState = buildCourseLearningState();
                  if (!courseLearningState) return;

                  navigate(buildCourseLearningDestination(courseLearningState), {
                    state: courseLearningState
                  });
                }
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
        useOverlay={toast.useOverlay}
      />
    </div>
  );
};

export default CourseDetailPage;
