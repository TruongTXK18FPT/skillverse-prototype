// TACTICAL DOSSIER PORTFOLIO - Mothership Theme
// 100% Logic Preservation from PortfolioPage.tsx
import { useState, useEffect, useRef } from 'react';
import {
  Download, Edit, Share2, Eye, Award, Briefcase,
  MapPin, Linkedin, Github as GithubIcon, AlertCircle, Plus,
  Trash2, ExternalLink, Calendar, Settings, Camera, Loader2,
  Target, RefreshCw, Star, ShieldCheck, BadgeCheck
} from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import LoginRequiredModal from '../auth/LoginRequiredModal';
import MeowlGuide from '../meowl/MeowlGuide';
import { buildCertificateVerificationPath } from '../certificate/certificatePresentation';
import portfolioService from '../../services/portfolioService';
import {
  UserProfileDTO,
  PortfolioProjectDTO,
  ExternalCertificateDTO,
  MentorReviewDTO,
  GeneratedCVDTO,
  CVGenerationRequest,
  SystemCertificateDTO,
  CompletedMissionDTO,
} from '../../data/portfolioDTOs';
import { PilotIDModal } from './PilotIDModal';
import { MissionLogModal } from './MissionLogModal';
import { CommendationModal } from './CommendationModal';
import { DataCompilerModal } from './DataCompilerModal';
import SystemAlertModal from './SystemAlertModal';
import DossierInitScreen from './DossierInitScreen';
import MissionDetailModal from './MissionDetailModal';
import './dossier-portfolio-styles.css';

const CERTIFICATE_VERIFY_PUBLIC_PATH_REGEX = /^\/certificate\/verify\/([^/?#]+)/i;
const CERTIFICATE_VERIFY_API_PATH_REGEX = /^\/(?:api\/)?certificates\/verify\/([^/?#]+)/i;
const CERTIFICATE_VERIFY_LEGACY_PATH_REGEX = /^\/verify\/certificate\/([^/?#]+)/i;

const decodeSerialSegment = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const resolveCertificateVerificationLink = (credentialUrl?: string): string | undefined => {
  if (!credentialUrl) {
    return undefined;
  }

  const trimmed = credentialUrl.trim();
  if (!trimmed) {
    return undefined;
  }

  if (typeof window === 'undefined') {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    const pathname = parsed.pathname;

    const publicMatch = pathname.match(CERTIFICATE_VERIFY_PUBLIC_PATH_REGEX);
    if (publicMatch?.[1]) {
      return buildCertificateVerificationPath(decodeSerialSegment(publicMatch[1]));
    }

    const apiMatch = pathname.match(CERTIFICATE_VERIFY_API_PATH_REGEX);
    if (apiMatch?.[1]) {
      return buildCertificateVerificationPath(decodeSerialSegment(apiMatch[1]));
    }

    const legacyMatch = pathname.match(CERTIFICATE_VERIFY_LEGACY_PATH_REGEX);
    if (legacyMatch?.[1]) {
      return buildCertificateVerificationPath(decodeSerialSegment(legacyMatch[1]));
    }
  } catch {
    return trimmed;
  }

  return trimmed;
};

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

  // New: System Certificates & Completed Missions
  const [systemCertificates, setSystemCertificates] = useState<SystemCertificateDTO[]>([]);
  const [completedMissions, setCompletedMissions] = useState<CompletedMissionDTO[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [missionsLoading, setMissionsLoading] = useState(false);

  // Modal States
  const [profileModalOpen, setProfileModalOpen] = useState(false);
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [syncPanelOpen, setSyncPanelOpen] = useState(false);
  const [missionDetailModalOpen, setMissionDetailModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<CompletedMissionDTO | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Load data on mount
  useEffect(() => {
    loadPortfolioData();
  }, [isAuthenticated, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load Completed Missions
  const loadCompletedMissions = async () => {
    if (!isAuthenticated || !isOwner) return;
    try {
      setMissionsLoading(true);
      const missions = await portfolioService.getCompletedMissions();
      setCompletedMissions(missions);
    } catch (err: any) {
      console.error('Error loading completed missions:', err);
    } finally {
      setMissionsLoading(false);
    }
  };

  // Load System Certificates (for sync panel)
  const loadSystemCertificates = async () => {
    if (!isAuthenticated || !isOwner) return;
    try {
      const certs = await portfolioService.getSystemCertificates();
      setSystemCertificates(certs);
    } catch (err: any) {
      console.error('Error loading system certificates:', err);
    }
  };

  // Handle Sync System Certificates
  const handleSyncCertificates = async (source: string) => {
    try {
      setSyncLoading(true);
      const result = await portfolioService.importSystemCertificates(source);
      setSystemCertificates(result);
      await loadPortfolioData();
      setAlertModal({
        show: true,
        message: `Đã đồng bộ ${result.filter((c: SystemCertificateDTO) => c.imported).length} chứng chỉ từ hệ thống!`,
        type: 'success'
      });
    } catch (err: any) {
      setAlertModal({
        show: true,
        message: err?.message || 'Không thể đồng bộ chứng chỉ.',
        type: 'error'
      });
    } finally {
      setSyncLoading(false);
    }
  };

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
          const [projectsData, certsData, reviewsData, missionsData] = await Promise.all([
            portfolioService.getPublicUserProjects(profileData.userId),
            portfolioService.getPublicUserCertificates(profileData.userId),
            portfolioService.getPublicUserReviews(profileData.userId),
            portfolioService.getPublicCompletedMissions(profileData.userId),
          ]);
          setProjects(projectsData);
          setCertificates(certsData);
          setReviews(reviewsData);
          setCompletedMissions(missionsData);
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
          const [profileData, projectsData, certsData, reviewsData, cvsData, missionsData] = await Promise.all([
            portfolioService.getProfile(),
            portfolioService.getUserProjects(),
            portfolioService.getUserCertificates(),
            portfolioService.getUserReviews(),
            portfolioService.getAllCVs(),
            portfolioService.getCompletedMissions(),
          ]);

          setProfile(profileData);
          setProjects(projectsData);
          setCertificates(certsData);
          setReviews(reviewsData);
          setCvs(cvsData);
          setCompletedMissions(missionsData);
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
  const handleUpdateProfile = async (
    profileData: Partial<UserProfileDTO>,
    avatar?: File,
    video?: File,
    coverImage?: File
  ) => {
    await portfolioService.updateExtendedProfile(profileData, avatar, video, coverImage);
    await loadPortfolioData();
  };

  const handleQuickAvatarUpdate = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !profile) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAlertModal({
        show: true,
        message: 'Vui lòng chọn một tệp ảnh hợp lệ cho avatar.',
        type: 'warning'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAlertModal({
        show: true,
        message: 'Ảnh avatar vượt quá 10MB. Vui lòng chọn ảnh nhẹ hơn.',
        type: 'warning'
      });
      return;
    }

    try {
      setAvatarUploading(true);
      await portfolioService.updateExtendedProfile(
        {
          ...profile,
          preferredCurrency: profile.preferredCurrency || 'VND',
        },
        file,
      );
      await loadPortfolioData();
      setAlertModal({
        show: true,
        message: 'Avatar portfolio đã được cập nhật.',
        type: 'success'
      });
    } catch (error: any) {
      setAlertModal({
        show: true,
        message: error?.message || 'Không thể cập nhật avatar portfolio.',
        type: 'error'
      });
    } finally {
      setAvatarUploading(false);
    }
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
    if (await confirmAction('Bạn có chắc muốn xóa dự án này?')) {
      await portfolioService.deleteProject(projectId);
      await loadPortfolioData();
    }
  };

  const handleCreateCertificate = async (certificate: ExternalCertificateDTO, image?: File) => {
    await portfolioService.createCertificate(certificate, image);
    await loadPortfolioData();
  };

  const handleDeleteCertificate = async (certId: number) => {
    if (await confirmAction('Bạn có chắc muốn xóa chứng chỉ này?')) {
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
    if (await confirmAction('Bạn có chắc muốn xóa CV này?')) {
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

  // Mission Detail Modal
  const handleMissionClick = (mission: CompletedMissionDTO) => {
    setSelectedMission(mission);
    setMissionDetailModalOpen(true);
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
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Đăng nhập để truy cập Portfolio"
          message="Bạn cần đăng nhập để tạo và quản lý hồ sơ nghề nghiệp"
          feature="Portfolio"
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
          <div className="dossier-panel-frame" style={{ maxWidth: '600px', padding: '3rem 2rem' }}>
            <h2 className="dossier-modal-title" style={{ marginBottom: '1rem' }}>🔒 Cần đăng nhập</h2>
            <p style={{ color: 'var(--dossier-silver)', marginBottom: '2rem' }}>
              Bạn cần đăng nhập để truy cập Hồ sơ nghề nghiệp. Tạo và quản lý hồ sơ cá nhân với nhật ký dự án và chứng chỉ.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowLoginModal(true)} className="dossier-btn-primary">
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
          <MeowlKuruLoader text="Đang tải Hồ sơ nghề nghiệp..." />
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
          <h2 style={{ color: 'var(--dossier-cyan)', fontFamily: "'Inter', sans-serif" }}>Không thể tải hồ sơ</h2>
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
          onInitiate={() => navigate('/portfolio/create')}
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
              HỒ SƠ NGHỀ NGHIỆP
            </h1>
            <p className="dossier-header-rank">
              {profile?.professionalTitle || 'Chức danh'}
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
            { id: 'completed-missions', label: 'Nhiệm vụ đã hoàn thành', icon: Target },
            { id: 'certificates', label: 'Chứng chỉ', icon: Award },
            ...(isOwner ? [
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
                  <div className="dossier-avatar-stack">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQuickAvatarUpdate}
                      style={{ display: 'none' }}
                    />
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
                    {isOwner && (
                      <>
                        <button
                          type="button"
                          className="dossier-avatar-edit"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={avatarUploading}
                          aria-label="Đổi avatar portfolio"
                        >
                          {avatarUploading ? (
                            <Loader2 size={18} className="dossier-spinner" />
                          ) : (
                            <Camera size={18} />
                          )}
                        </button>
                        <span className="dossier-avatar-caption">
                          Đổi avatar ngay trên hồ sơ
                        </span>
                      </>
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
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                            maximumFractionDigits: 0
                          }).format(profile.hourlyRate)}
                        </span>
                        <span style={{ fontSize: '0.85em', opacity: 0.8 }}> / giờ</span>
                      </p>
                    )}
                  </div>

                  <div style={{ marginLeft: 'auto' }}>
                    {isOwner && (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="dossier-btn-secondary"
                          disabled={avatarUploading}
                        >
                          {avatarUploading ? (
                            <Loader2 size={16} className="dossier-spinner" />
                          ) : (
                            <Camera size={16} />
                          )}
                          Đổi avatar
                        </button>
                        <button
                          onClick={() => {
                            setProfileModalOpen(true);
                          }}
                          className="dossier-btn-primary"
                        >
                          <Edit size={16} />
                          Sửa ID
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {/* Contact & Links */}
                  {(isOwner || Boolean(profile?.showContactInfo)) && (profile?.phone || profile?.linkedinUrl || profile?.githubUrl) && (
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
                {['Tất cả', 'MICRO_JOB', 'FREELANCE', 'PERSONAL', 'ACADEMIC', 'OPEN_SOURCE', 'INTERNSHIP', 'FULL_TIME'].map((type) => (
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

          {/* Completed Missions Section - Intel / Amber */}
          {activeSection === 'completed-missions' && (
            <motion.div
              key="completed-missions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
                <div>
                  <h2 className="dossier-modal-title">Nhiệm vụ đã hoàn thành</h2>
                  <p style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Các công việc ngắn hạn đã hoàn thành trên hệ thống</p>
                </div>
                <button
                  onClick={loadCompletedMissions}
                  className="dossier-btn-secondary"
                  style={{ color: 'var(--dossier-cyan)', borderColor: 'var(--dossier-cyan-border)' }}
                >
                  <RefreshCw size={16} />
                  Làm mới
                </button>
              </div>

              {/* Stats Row */}
              <div className="dossier-missions-stats">
                <div className="dossier-missions-stat-card">
                  <div className="dossier-missions-stat-value">{completedMissions.length}</div>
                  <div className="dossier-missions-stat-label">Nhiệm vụ hoàn thành</div>
                </div>
                <div className="dossier-missions-stat-card">
                  <div className="dossier-missions-stat-value">
                    {completedMissions.filter(m => m.status === 'PAID').length}
                  </div>
                  <div className="dossier-missions-stat-label">Đã thanh toán</div>
                </div>
                <div className="dossier-missions-stat-card">
                  <div className="dossier-missions-stat-value">
                    {completedMissions.reduce((sum, m) => sum + (m.budget || 0), 0).toLocaleString('vi-VN')}
                  </div>
                  <div className="dossier-missions-stat-label">Tổng thu (VND)</div>
                </div>
                <div className="dossier-missions-stat-card">
                  <div className="dossier-missions-stat-value">
                    {completedMissions.filter(m => m.rating).reduce((sum, m) => sum + (m.rating || 0), 0) / (completedMissions.filter(m => m.rating).length || 1) || 0}
                  </div>
                  <div className="dossier-missions-stat-label">Đánh giá TB</div>
                </div>
              </div>

              {/* Missions Grid */}
              {missionsLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader2 size={32} className="dossier-spinner" style={{ color: 'var(--dossier-cyan)' }} />
                  <p style={{ color: 'var(--dossier-silver-dark)', marginTop: '1rem' }}>Đang tải nhiệm vụ...</p>
                </div>
              ) : completedMissions.length === 0 ? (
                <div className="dossier-missions-empty">
                  <Target size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                  <p>Chưa có nhiệm vụ nào được hoàn thành.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Hoàn thành các công việc ngắn hạn trên hệ thống để hiển thị tại đây.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {completedMissions.map((mission) => (
                    <div
                      key={mission.applicationId}
                      className="dossier-missions-card"
                      onClick={() => handleMissionClick(mission)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="dossier-missions-header">
                        <span className="dossier-missions-title">{mission.jobTitle}</span>
                        <span className="dossier-missions-status">
                          <span className={`dossier-missions-led-dot ${mission.status === 'PAID' ? 'dossier-missions-led-dot--green' : ''}`}></span>
                          {mission.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'HOÀN THÀNH'}
                        </span>
                      </div>
                      <div className="dossier-missions-body">
                        {/* Recruiter */}
                        <div className="dossier-missions-recruiter">
                          {mission.recruiterAvatar ? (
                            <img
                              src={mission.recruiterAvatar}
                              alt={mission.recruiterName}
                              className="dossier-missions-recruiter-avatar"
                            />
                          ) : (
                            <div
                              className="dossier-missions-recruiter-avatar"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dossier-cyan)', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              {mission.recruiterName?.[0] || 'R'}
                            </div>
                          )}
                          <div>
                            <span className="dossier-missions-recruiter-name">{mission.recruiterName}</span>
                            {mission.recruiterCompanyName && (
                              <p style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.72rem', margin: '0.1rem 0 0 0' }}>
                                {mission.recruiterCompanyName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="dossier-missions-meta">
                          {mission.completedAt && (
                            <div className="dossier-missions-meta-item">
                              <Calendar size={14} />
                              {new Date(mission.completedAt).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                          {mission.budget && (
                            <div className="dossier-missions-meta-item">
                              <span className="dossier-missions-budget">
                                {mission.budget.toLocaleString('vi-VN')} {mission.currency || 'VND'}
                              </span>
                            </div>
                          )}
                          {mission.requiredSkills && mission.requiredSkills.length > 0 && (
                            <div className="dossier-missions-meta-item" style={{ fontSize: '0.72rem' }}>
                              <span style={{ color: 'var(--dossier-silver-dark)' }}>
                                {mission.requiredSkills.slice(0, 2).join(', ')}{mission.requiredSkills.length > 2 ? ` +${mission.requiredSkills.length - 2}` : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Work Note */}
                        {mission.workNote && (
                          <p className="dossier-missions-description">{mission.workNote}</p>
                        )}

                        {/* Required Skills */}
                        {mission.requiredSkills && mission.requiredSkills.length > 0 && (
                          <div className="dossier-missions-deliverables">
                            {mission.requiredSkills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="dossier-missions-deliverable-tag">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Rating */}
                        {mission.rating && (
                          <div className="dossier-missions-rating">
                            <Star size={14} />
                            <span>{mission.rating}/5</span>
                            {mission.reviewComment && (
                              <span style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                                — {mission.reviewComment.length > 50 ? mission.reviewComment.slice(0, 50) + '...' : mission.reviewComment}
                              </span>
                            )}
                          </div>
                        )}

                        {/* View Detail hint */}
                        <div style={{
                          marginTop: '0.75rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid var(--dossier-cyan-border)',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            color: 'var(--dossier-cyan)',
                            fontSize: '0.72rem',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            opacity: 0.7
                          }}>
                            Click để xem chi tiết &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <div>
                  <h2 className="dossier-modal-title">Chứng chỉ</h2>
                  <p style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Chứng chỉ từ các tổ chức và hệ thống</p>
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

              {/* System Certificate Sync Panel (Owner only) */}
              {isOwner && (
                <div className="dossier-sync-panel">
                  <div className="dossier-sync-panel__info">
                    <p className="dossier-sync-panel__title">Đồng bộ từ hệ thống</p>
                    <p className="dossier-sync-panel__desc">
                      Nhập chứng chỉ hoàn thành khóa học và huy hiệu từ hệ thống SkillVerse
                    </p>
                  </div>
                  <div className="dossier-sync-panel__actions">
                    <button
                      onClick={() => handleSyncCertificates('COURSE')}
                      disabled={syncLoading}
                      className="dossier-sync-btn"
                    >
                      {syncLoading ? <Loader2 size={14} className="dossier-spinner" /> : <ShieldCheck size={14} />}
                      Chứng chỉ khóa học
                    </button>
                    <button
                      onClick={() => handleSyncCertificates('BADGE')}
                      disabled={syncLoading}
                      className="dossier-sync-btn"
                    >
                      {syncLoading ? <Loader2 size={14} className="dossier-spinner" /> : <BadgeCheck size={14} />}
                      Huy hiệu
                    </button>
                    <button
                      onClick={() => handleSyncCertificates('ALL')}
                      disabled={syncLoading}
                      className="dossier-sync-btn"
                    >
                      {syncLoading ? <Loader2 size={14} className="dossier-spinner" /> : <RefreshCw size={14} />}
                      Tất cả
                    </button>
                  </div>
                </div>
              )}

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
                  filteredCertificates.map((cert) => {
                    const verificationLink = resolveCertificateVerificationLink(cert.credentialUrl);

                    return (
                    <div key={cert.id} className="dossier-panel-simple">
                      {cert.certificateImageUrl && (
                        <img
                          src={cert.certificateImageUrl}
                          alt={cert.title}
                          style={{ width: '100%', height: '150px', objectFit: 'cover', marginBottom: '1rem', border: '1px solid var(--dossier-border-cyan)' }}
                        />
                      )}
                      <div className="dossier-cert-card-header">
                        <h3 className="dossier-cert-card-title">{cert.title}</h3>
                        {cert.isVerified && (
                          <span className="dossier-system-badge dossier-system-badge--course">
                            <BadgeCheck size={10} />
                            SYSTEM
                          </span>
                        )}
                      </div>
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
                        {verificationLink && (
                          <a
                            href={verificationLink}
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
                    );
                  })
                )}
              </div>
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
                  <p style={{ color: 'var(--dossier-silver-dark)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Sử dụng AI để tạo CV chuyên nghiệp từ hồ sơ người dùng</p>
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
                            fontFamily: "'Inter', sans-serif",
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
        onSubmit={handleUpdateProfile}
        initialData={profile || undefined}
        mode="edit"
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

      <MissionDetailModal
        isOpen={missionDetailModalOpen}
        onClose={() => setMissionDetailModalOpen(false)}
        mission={selectedMission}
      />

      {/* Meowl Guide */}
      <MeowlGuide currentPage="portfolio" />
    </motion.div>
  );
};

export default TacticalDossierPortfolio;
