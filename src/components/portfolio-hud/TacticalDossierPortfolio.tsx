// TACTICAL DOSSIER PORTFOLIO - Mothership Theme
// 100% Logic Preservation from PortfolioPage.tsx
import { useState, useEffect } from 'react';
import {
  Download, Edit, Share2, Eye, Award, Briefcase,
  MapPin, Linkedin, Github as GithubIcon, AlertCircle, Plus,
  Trash2, ExternalLink, Calendar, Settings
} from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import MeowlGuide from '../MeowlGuide';
import portfolioService from '../../services/portfolioService';
import {
  UserProfileDTO,
  PortfolioProjectDTO,
  ExternalCertificateDTO,
  MentorReviewDTO,
  GeneratedCVDTO,
  CVGenerationRequest,
} from '../../data/portfolioDTOs';
import { PilotIDModal } from './PilotIDModal';
import { MissionLogModal } from './MissionLogModal';
import { CommendationModal } from './CommendationModal';
import { DataCompilerModal } from './DataCompilerModal';
import MentorBookingManager from './MentorBookingManager';
import SystemAlertModal from './SystemAlertModal';
import DossierInitScreen from './DossierInitScreen';
import './dossier-portfolio-styles.css';

const TacticalDossierPortfolio = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [hasExtendedProfile, setHasExtendedProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [projects, setProjects] = useState<PortfolioProjectDTO[]>([]);
  const [certificates, setCertificates] = useState<ExternalCertificateDTO[]>([]);
  const [reviews, setReviews] = useState<MentorReviewDTO[]>([]);
  const [cvs, setCvs] = useState<GeneratedCVDTO[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  // Modal States
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'create' | 'edit'>('create');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProject, setSelectedProject] = useState<PortfolioProjectDTO | undefined>();
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);

  // UI States
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedProjectType, setSelectedProjectType] = useState('Tất cả');
  const [alertModal, setAlertModal] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'warning' | 'info'}>({
    show: false,
    message: '',
    type: 'info'
  });

  // Load data on mount
  useEffect(() => {
    loadPortfolioData();
  }, [isAuthenticated, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load Portfolio Data
  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (slug) {
        // Public View
        
        const profileData = await portfolioService.getProfileBySlug(slug);
        setProfile(profileData);
        setHasExtendedProfile(true);
        setIsOwner(false); // Viewing someone else's profile

        // Load public data
        if (profileData.userId) {
          const [projectsData, certsData, reviewsData] = await Promise.all([
            portfolioService.getPublicUserProjects(profileData.userId),
            portfolioService.getPublicUserCertificates(profileData.userId),
            portfolioService.getPublicUserReviews(profileData.userId),
          ]);
          setProjects(projectsData);
          setCertificates(certsData);
          setReviews(reviewsData);
        }
      } else {
        // Private View (Owner)
        if (!isAuthenticated) {
          setLoading(false);
          return;
        }

        const checkResult = await portfolioService.checkExtendedProfile();
        setHasExtendedProfile(checkResult.hasExtendedProfile);
        setIsOwner(true);

        if (checkResult.hasExtendedProfile) {
          const [profileData, projectsData, certsData, reviewsData, cvsData] = await Promise.all([
            portfolioService.getProfile(),
            portfolioService.getUserProjects(),
            portfolioService.getUserCertificates(),
            portfolioService.getUserReviews(),
            portfolioService.getAllCVs(),
          ]);

          setProfile(profileData);
          setProjects(projectsData);
          setCertificates(certsData);
          setReviews(reviewsData);
          setCvs(cvsData);
        }
      }
    } catch (err: any) {
      console.error('Error loading portfolio data:', err);
      setError(err.response?.data?.message || err.message || 'Cannot load dossier data');
    } finally {
      setLoading(false);
    }
  };

  // Handler Functions
  const handleCreateProfile = async (
    profileData: Partial<UserProfileDTO>,
    avatar?: File,
    video?: File,
    coverImage?: File
  ) => {
    await portfolioService.createExtendedProfile(profileData, avatar, video, coverImage);
    await loadPortfolioData();
  };

  const handleUpdateProfile = async (
    profileData: Partial<UserProfileDTO>,
    avatar?: File,
    video?: File,
    coverImage?: File
  ) => {
    await portfolioService.updateExtendedProfile(profileData, avatar, video, coverImage);
    await loadPortfolioData();
  };

  const handleCreateProject = async (project: PortfolioProjectDTO, thumbnail?: File) => {
    await portfolioService.createProject(project, thumbnail);
    await loadPortfolioData();
  };

  const handleUpdateProject = async (project: PortfolioProjectDTO, thumbnail?: File) => {
    if (project.id) {
      await portfolioService.updateProject(project.id, project, thumbnail);
      await loadPortfolioData();
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (confirm('Bạn có chắc muốn xóa dự án này?')) {
      await portfolioService.deleteProject(projectId);
      await loadPortfolioData();
    }
  };

  const handleCreateCertificate = async (certificate: ExternalCertificateDTO, image?: File) => {
    await portfolioService.createCertificate(certificate, image);
    await loadPortfolioData();
  };

  const handleDeleteCertificate = async (certId: number) => {
    if (confirm('Bạn có chắc muốn xóa chứng chỉ này?')) {
      await portfolioService.deleteCertificate(certId);
      await loadPortfolioData();
    }
  };

  const handleGenerateCV = async (request: CVGenerationRequest) => {
    await portfolioService.generateCV(request);
    await loadPortfolioData();
  };

  const handleSetActiveCV = async (cvId: number) => {
    try {
      await portfolioService.setActiveCV(cvId);
      await loadPortfolioData();
      setAlertModal({ show: true, message: 'Đặt CV làm hoạt động thành công!', type: 'success' });
    } catch (error: any) {
      setAlertModal({ show: true, message: 'Không thể đặt CV làm hoạt động: ' + (error?.message || 'Lỗi không xác định'), type: 'error' });
    }
  };

  const handleDeleteCV = async (cvId: number) => {
    if (confirm('Bạn có chắc muốn xóa CV này?')) {
      try {
        await portfolioService.deleteCV(cvId);
        await loadPortfolioData();
        setAlertModal({ show: true, message: 'Xóa CV thành công!', type: 'success' });
      } catch (error: any) {
        setAlertModal({ show: true, message: 'Không thể xóa CV: ' + (error?.message || 'Lỗi không xác định'), type: 'error' });
      }
    }
  };

  const handleEditCV = (cvId: number) => {
    navigate(`/cv?edit=${cvId}`);
  };

  const handleExportCV = async () => {
    try {
      const activeCV = await portfolioService.getActiveCV();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>CV - ${activeCV.templateName}</title></head>
            <body>${activeCV.cvContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch {
      setAlertModal({ show: true, message: 'Chưa có CV đang dùng. Vui lòng tạo hoặc đặt CV đang dùng trước.', type: 'warning' });
    }
  };

  const handleSharePortfolio = () => {
    if (profile?.customUrlSlug) {
      const url = `${globalThis.location.origin}/portfolio/${profile.customUrlSlug}`;
      navigator.clipboard.writeText(url);
      setAlertModal({ show: true, message: 'Đã sao chép liên kết hồ sơ!', type: 'success' });
    } else {
      setAlertModal({ show: true, message: 'Vui lòng cập nhật URL tùy chỉnh trong hồ sơ.', type: 'warning' });
    }
  };

  // Parse skills from JSON string
  const getSkills = () => {
    if (!profile?.topSkills) return [];
    try {
      return JSON.parse(profile.topSkills);
    } catch {
      return [];
    }
  };

  // Parse languages from JSON string
  const getLanguages = () => {
    if (!profile?.languagesSpoken) return [];
    try {
      return JSON.parse(profile.languagesSpoken);
    } catch {
      return [];
    }
  };

  // Filter data
  const filteredCertificates = selectedCategory === 'Tất cả'
    ? certificates
    : certificates.filter(cert => cert.category === selectedCategory);

  const filteredProjects = selectedProjectType === 'Tất cả'
    ? projects
    : projects.filter(proj => proj.projectType === selectedProjectType);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 }
    }
  };

  // Handle section change
  const handleSectionChange = (section: string) => {
    if (section !== activeSection) {
      setActiveSection(section);
    }
  };

  // Not Authenticated State (Only if not viewing public profile)
  if (!isAuthenticated && !slug) {
    return (
      <div className="dossier-portfolio-container" data-theme={theme}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
          <div className="dossier-panel-frame" style={{ maxWidth: '600px', padding: '3rem 2rem' }}>
            <h2 className="dossier-modal-title" style={{ marginBottom: '1rem' }}>🔒 Cần đăng nhập</h2>
            <p style={{ color: 'var(--dossier-silver)', marginBottom: '2rem' }}>
              Bạn cần đăng nhập để truy cập Tài liệu Chiến thuật. Tạo và quản lý hồ sơ cá nhân với nhật ký dự án và chứng chỉ.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/login')} className="dossier-btn-primary">
                Đăng nhập
              </button>
              <button onClick={() => navigate('/register')} className="dossier-btn-secondary">
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
        <MeowlGuide currentPage="portfolio" />
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="dossier-portfolio-container" data-theme={theme}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
          <MeowlKuruLoader text="Đang tải Tài liệu Chiến thuật..." />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="dossier-portfolio-container" data-theme={theme}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
          <AlertCircle size={48} color="#ef4444" />
          <h2 style={{ color: 'var(--dossier-cyan)', fontFamily: "'Space Habitat', monospace" }}>Không thể tải hồ sơ</h2>
          <p style={{ color: 'var(--dossier-silver)' }}>{error}</p>
          <button onClick={loadPortfolioData} className="dossier-btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // No Extended Profile State - System Initialization Screen
  if (!hasExtendedProfile) {
    return (
      <div className="dossier-portfolio-container" data-theme={theme}>
        <DossierInitScreen
          onInitiate={() => {
            setProfileModalMode('create');
            setProfileModalOpen(true);
          }}
        />

        <PilotIDModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onSubmit={handleCreateProfile}
          mode="create"
        />
      </div>
    );
  }

  // Main Portfolio Page
  return (
    <motion.div
      className="dossier-portfolio-container"
      data-theme={theme}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section - Pilot ID Banner */}
      <motion.div 
        className="dossier-header-panel" 
        variants={itemVariants}
        style={{
          backgroundImage: profile?.coverImageUrl ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${profile.coverImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="dossier-header-content">
          <div>
            <h1 className="dossier-header-title">
              TÀI LIỆU CHIẾN THUẬT
            </h1>
            <p className="dossier-header-rank">
              CẤP BẬC: CHỈ HUY • {profile?.professionalTitle || 'Chức danh'}
            </p>
            <p className="dossier-header-subtitle">
              {profile?.fullName || 'Tên của bạn'}
            </p>
          </div>

          <div className="dossier-header-actions">
            {isOwner && (
              <>
                <motion.button
                  className="dossier-btn-primary"
                  onClick={() => navigate('/cv')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Eye size={18} />
                  Xem CV
                </motion.button>
                <motion.button
                  className="dossier-btn-primary"
                  onClick={handleExportCV}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download size={18} />
                  Xuất CV
                </motion.button>
              </>
            )}
            <motion.button
              className="dossier-btn-primary"
              onClick={handleSharePortfolio}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 size={18} />
              Chia sẻ
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs - Trapezoid Modules */}
      <motion.div className="dossier-nav-bar" variants={itemVariants}>
        <nav className="dossier-tabs">
          {[
            { id: 'overview', label: 'Bảng trạng thái', icon: Eye },
            { id: 'projects', label: 'Nhật ký dự án', icon: Briefcase },
            { id: 'certificates', label: 'Chứng chỉ', icon: Award },
            ...(isOwner ? [
              { id: 'bookings', label: 'Quản lý Booking', icon: Calendar },
              { id: 'cv-builder', label: 'Trình tạo dữ liệu', icon: Settings }
            ] : [])
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleSectionChange(tab.id)}
                className={`dossier-tab ${
                  activeSection === tab.id ? 'dossier-tab--active' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      {/* Content Area */}
      <div style={{ position: 'relative', minHeight: '400px' }}>
        <AnimatePresence mode="wait">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Profile Card - Pilot ID */}
              <div className="dossier-pilot-card">
                <div className="dossier-pilot-header">
                  <div>
                    {profile?.portfolioAvatarUrl || profile?.basicAvatarUrl ? (
                      <img
                        src={profile.portfolioAvatarUrl || profile.basicAvatarUrl}
                        alt={profile.fullName || 'User'}
                        className="dossier-pilot-avatar"
                      />
                    ) : (
                      <div className="dossier-pilot-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--dossier-cyan), #0891b2)', color: '#000', fontSize: '2.5rem', fontWeight: 'bold' }}>
                        {profile?.fullName?.[0] || 'U'}
                      </div>
                    )}
                  </div>

                  <div className="dossier-pilot-info">
                    <h2 className="dossier-pilot-name">{profile?.fullName || 'Tên của bạn'}</h2>
                    <p className="dossier-pilot-title">{profile?.professionalTitle || 'Chức danh'}</p>
                    {profile?.location && (
                      <p className="dossier-pilot-location">
                        <MapPin size={16} />
                        {profile.location}
                      </p>
                    )}
                    {profile?.hourlyRate !== undefined && profile.hourlyRate > 0 && (
                      <p className="dossier-pilot-location" style={{ marginTop: '0.25rem', color: 'var(--dossier-green)' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: profile.preferredCurrency || 'USD' }).format(profile.hourlyRate)}
                        </span>
                        <span style={{ fontSize: '0.85em', opacity: 0.8 }}> / giờ</span>
                      </p>
                    )}
                  </div>

                  <div style={{ marginLeft: 'auto' }}>
                    {isOwner && (
                      <button
                        onClick={() => {
                          setProfileModalMode('edit');
                          setProfileModalOpen(true);
                        }}
                        className="dossier-btn-primary"
                      >
                        <Edit size={16} />
                        Sửa ID
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  {/* Contact & Links */}
                  {(profile?.phone || profile?.linkedinUrl || profile?.githubUrl) && (
                    <div style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--dossier-border-silver)', marginBottom: '1.5rem' }}>
                      {profile?.phone && (
                        <a href={`tel:${profile.phone}`} style={{ color: 'var(--dossier-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          📞 {profile.phone}
                        </a>
                      )}
                      {profile?.linkedinUrl && (
                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dossier-cyan)' }}>
                          <Linkedin size={16} />
                        </a>
                      )}
                      {profile?.githubUrl && (
                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dossier-cyan)' }}>
                          <GithubIcon size={16} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Bio */}
                  {profile?.basicBio && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ color: 'var(--dossier-cyan)', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>GIỚI THIỆU</h3>
                      <p style={{ color: 'var(--dossier-silver)' }}>{profile.basicBio}</p>
                    </div>
                  )}

                  {/* Career Goals */}
                  {profile?.careerGoals && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ color: 'var(--dossier-cyan)', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>MỤC TIÊU NGHỀ NGHIỆP</h3>
                      <p style={{ color: 'var(--dossier-silver)' }}>{profile.careerGoals}</p>
                    </div>
                  )}

                  {/* Video Intro */}
                  {profile?.videoIntroUrl && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ color: 'var(--dossier-cyan)', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>VIDEO GIỚI THIỆU</h3>
                      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '0.5rem', border: '1px solid var(--dossier-border-cyan)' }}>
                        <video 
                          src={profile.videoIntroUrl} 
                          controls 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {getSkills().length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ color: 'var(--dossier-cyan)', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>KỸ NĂNG CỐT LÕI</h3>
                      <div className="dossier-module-tags">
                        {getSkills().map((skill: string, idx: number) => (
                          <span key={idx} className="dossier-module-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {getLanguages().length > 0 && (
                    <div>
                      <h3 style={{ color: 'var(--dossier-cyan)', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>NGÔN NGỮ</h3>
                      <div className="dossier-module-tags">
                        {getLanguages().map((lang: string, idx: number) => (
                          <span key={idx} className="dossier-module-tag">{lang}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid - Status Dashboard */}
              <div className="dossier-stats-grid">
                <div className="dossier-stat-module">
                  <div className="dossier-stat-value">{profile?.portfolioViews || 0}</div>
                  <div className="dossier-stat-label">Lượt xem</div>
                </div>
                <div className="dossier-stat-module">
                  <div className="dossier-stat-value">{profile?.totalProjects || 0}</div>
                  <div className="dossier-stat-label">Dự án</div>
                </div>
                <div className="dossier-stat-module">
                  <div className="dossier-stat-value">{profile?.totalCertificates || 0}</div>
                  <div className="dossier-stat-label">Chứng chỉ</div>
                </div>
                <div className="dossier-stat-module">
                  <div className="dossier-stat-value">{reviews.length}</div>
                  <div className="dossier-stat-label">Đánh giá</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Projects Section - Mission Logs */}
          {activeSection === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
                <div>
                  <h2 className="dossier-modal-title">Nhật ký dự án</h2>
                  <p style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Các dự án đã và đang thực hiện</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => {
                      setProjectModalMode('create');
                      setSelectedProject(undefined);
                      setProjectModalOpen(true);
                    }}
                    className="dossier-btn-primary"
                  >
                    <Plus size={18} />
                    Thêm dự án
                  </button>
                )}
              </div>

              {/* Project Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
                {['Tất cả', 'MICROJOB', 'FREELANCE', 'PERSONAL', 'ACADEMIC', 'OPEN_SOURCE'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedProjectType(type)}
                    className={selectedProjectType === type ? 'dossier-btn-primary' : 'dossier-btn-secondary'}
                    style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                  >
                    {type === 'Tất cả' ? 'Tất cả' : type}
                  </button>
                ))}
              </div>

              {/* Projects Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {filteredProjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                    <p style={{ color: 'var(--dossier-silver-dark)' }}>Chưa có dự án nào. Hãy thêm dự án đầu tiên!</p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div key={project.id} className="dossier-mission-card">
                      <div className="dossier-mission-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{project.title}</span>
                        <span className={`dossier-mission-status ${project.completionDate ? 'dossier-mission-status--complete' : 'dossier-mission-status--progress'}`}>
                          <span className={`dossier-led-dot ${project.completionDate ? 'dossier-led-dot--green' : 'dossier-led-dot--yellow'}`}></span>
                          {project.completionDate ? 'HOÀN THÀNH' : 'ĐANG THỰC HIỆN'}
                        </span>
                      </div>
                      {project.thumbnailUrl && (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          style={{ width: '100%', height: '150px', objectFit: 'cover', marginBottom: '1rem' }}
                        />
                      )}
                      <p style={{ fontSize: '0.875rem', color: 'var(--dossier-silver)', marginBottom: '1rem' }}>
                        {project.description}
                      </p>
                      {project.tools && project.tools.length > 0 && (
                        <div className="dossier-module-tags" style={{ marginBottom: '1rem' }}>
                          {project.tools.slice(0, 3).map((tool, idx) => (
                            <span key={idx} className="dossier-module-tag">{tool}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {project.projectUrl && (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dossier-btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                          >
                            <ExternalLink size={14} />
                            Xem
                          </a>
                        )}
                        {isOwner && (
                          <>
                            <button
                              onClick={() => {
                                setProjectModalMode('edit');
                                setSelectedProject(project);
                                setProjectModalOpen(true);
                              }}
                              className="dossier-btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                            >
                              <Edit size={14} />
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id!)}
                              className="dossier-btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', borderColor: 'var(--dossier-red)', color: 'var(--dossier-red)' }}
                            >
                              <Trash2 size={14} />
                              Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Certificates Section - Commendations */}
          {activeSection === 'certificates' && (
            <motion.div
              key="certificates"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
                <div>
                  <h2 className="dossier-modal-title">Chứng chỉ</h2>
                  <p style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Chứng chỉ từ các tổ chức bên ngoài</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setCertificateModalOpen(true)}
                    className="dossier-btn-primary"
                  >
                    <Plus size={18} />
                    Thêm chứng chỉ
                  </button>
                )}
              </div>

              {/* Category Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
                {['Tất cả', 'TECHNICAL', 'DESIGN', 'BUSINESS', 'SOFT_SKILLS', 'LANGUAGE', 'OTHER'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={selectedCategory === cat ? 'dossier-btn-primary' : 'dossier-btn-secondary'}
                    style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                  >
                    {cat === 'Tất cả' ? 'Tất cả' : cat}
                  </button>
                ))}
              </div>

              {/* Certificates Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {filteredCertificates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                    <p style={{ color: 'var(--dossier-silver-dark)' }}>Chưa có chứng chỉ nào. Hãy thêm chứng chỉ đầu tiên!</p>
                  </div>
                ) : (
                  filteredCertificates.map((cert) => (
                    <div key={cert.id} className="dossier-panel-simple">
                      {cert.certificateImageUrl && (
                        <img
                          src={cert.certificateImageUrl}
                          alt={cert.title}
                          style={{ width: '100%', height: '150px', objectFit: 'cover', marginBottom: '1rem', border: '1px solid var(--dossier-border-cyan)' }}
                        />
                      )}
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: 'var(--dossier-cyan)' }}>{cert.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--dossier-silver)', marginBottom: '0.5rem' }}>
                        {cert.issuingOrganization}
                      </p>
                      {cert.issueDate && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--dossier-silver-dark)', marginBottom: '1rem' }}>
                          <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          {new Date(cert.issueDate).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dossier-btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                          >
                            <ExternalLink size={14} />
                            Xác minh
                          </a>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteCertificate(cert.id!)}
                            className="dossier-btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', borderColor: 'var(--dossier-red)', color: 'var(--dossier-red)' }}
                          >
                            <Trash2 size={14} />
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Booking Management Section */}
          {activeSection === 'bookings' && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MentorBookingManager />
            </motion.div>
          )}

          {/* CV Builder Section - Data Compiler */}
          {activeSection === 'cv-builder' && (
            <motion.div
              key="cv-builder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
                <div>
                  <h2 className="dossier-modal-title">Trình tạo dữ liệu</h2>
                  <p style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Sử dụng AI để tạo CV chiến thuật từ hồ sơ người dùng</p>
                </div>
                <button
                  onClick={() => setCvModalOpen(true)}
                  className="dossier-btn-primary"
                >
                  <Plus size={18} />
                  Tạo CV mới
                </button>
              </div>

              {/* CV List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {cvs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                    <p style={{ color: 'var(--dossier-silver-dark)' }}>Chưa có CV nào. Hãy tạo CV đầu tiên bằng AI!</p>
                  </div>
                ) : (
                  cvs.map((cv) => (
                    <div key={cv.id} className="dossier-panel-simple">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.125rem', margin: 0, color: 'var(--dossier-cyan)' }}>{cv.templateName}</h3>
                        {cv.isActive && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: 'var(--dossier-green)',
                            color: '#000',
                            fontSize: '0.75rem',
                            fontFamily: "'Space Habitat', monospace",
                            letterSpacing: '1px'
                          }}>
                            ĐANG DÙNG
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--dossier-silver)', marginBottom: '0.5rem' }}>
                        Phiên bản {cv.version}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--dossier-silver-dark)', marginBottom: '1rem' }}>
                        {new Date(cv.createdAt || '').toLocaleDateString('vi-VN')}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => navigate('/cv')}
                          className="dossier-btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                        >
                          <Eye size={14} />
                          Xem
                        </button>
                        <button
                          onClick={() => handleEditCV(cv.id!)}
                          className="dossier-btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                        >
                          <Edit size={14} />
                          Sửa
                        </button>
                        {!cv.isActive && (
                          <button
                            onClick={() => handleSetActiveCV(cv.id!)}
                            className="dossier-btn-primary"
                            style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                          >
                          <Settings size={14} />
                          Đặt làm CV chính
                        </button>
                        )}
                        <button
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head><title>CV - ${cv.templateName}</title></head>
                                  <body>${cv.cvContent}</body>
                                </html>
                              `);
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }}
                          className="dossier-btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                        >
                          <Download size={14} />
                          PDF
                        </button>
                        <button
                          onClick={() => handleDeleteCV(cv.id!)}
                          className="dossier-btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', borderColor: 'var(--dossier-red)', color: 'var(--dossier-red)' }}
                        >
                          <Trash2 size={14} />
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <PilotIDModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSubmit={profileModalMode === 'create' ? handleCreateProfile : handleUpdateProfile}
        initialData={profile || undefined}
        mode={profileModalMode}
      />

      <MissionLogModal
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setSelectedProject(undefined);
        }}
        onSubmit={projectModalMode === 'create' ? handleCreateProject : handleUpdateProject}
        initialData={selectedProject}
        mode={projectModalMode}
      />

      <CommendationModal
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        onSubmit={handleCreateCertificate}
      />

      <DataCompilerModal
        isOpen={cvModalOpen}
        onClose={() => setCvModalOpen(false)}
        onSubmit={handleGenerateCV}
      />

      <SystemAlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({...alertModal, show: false})}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Meowl Guide */}
      <MeowlGuide currentPage="portfolio" />
    </motion.div>
  );
};

export default TacticalDossierPortfolio;
