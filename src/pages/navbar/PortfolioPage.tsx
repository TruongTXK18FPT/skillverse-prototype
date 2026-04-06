import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download, Edit, Share2, Eye, Award, Briefcase,
  MapPin, Linkedin, Github as GithubIcon, AlertCircle, Plus,
  Trash2, ExternalLink, Calendar, Settings, CheckCircle, Loader2
} from 'lucide-react';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginRequiredModal from '../../components/auth/LoginRequiredModal';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import portfolioService from '../../services/portfolioService';
import {
  UserProfileDTO,
  PortfolioProjectDTO,
  ExternalCertificateDTO,
  MentorReviewDTO,
  GeneratedCVDTO,
  CVGenerationRequest,
} from '../../data/portfolioDTOs';
import ProfileModal from '../../components/portfolio/ProfileModal';
import ProjectModal from '../../components/portfolio/ProjectModal';
import CertificateModal from '../../components/portfolio/CertificateModal';
import CVGenerationModal from '../../components/portfolio/CVGenerationModal';
import '../../styles/PortfolioPage.css';
import '../../styles/PortfolioModals.css';

// ==================== CONSTANTS ====================

// Project Types
export const PROJECT_TYPES = {
  ALL: 'Tất cả',
  MICROJOB: 'MICROJOB',
  FREELANCE: 'FREELANCE',
  PERSONAL: 'PERSONAL',
  ACADEMIC: 'ACADEMIC',
  OPEN_SOURCE: 'OPEN_SOURCE',
} as const;

export const PROJECT_TYPE_OPTIONS = Object.values(PROJECT_TYPES);

// Certificate Categories
export const CERTIFICATE_CATEGORIES = {
  ALL: 'Tất cả',
  TECHNICAL: 'TECHNICAL',
  DESIGN: 'DESIGN',
  BUSINESS: 'BUSINESS',
  SOFT_SKILLS: 'SOFT_SKILLS',
  LANGUAGE: 'LANGUAGE',
  OTHER: 'OTHER',
} as const;

export const CERTIFICATE_CATEGORY_OPTIONS = Object.values(CERTIFICATE_CATEGORIES);

// Tab Definitions
const TABS = [
  { id: 'overview', label: 'Tổng quan', icon: Eye },
  { id: 'projects', label: 'Dự án', icon: Briefcase },
  { id: 'certificates', label: 'Chứng chỉ', icon: Award },
  { id: 'cv-builder', label: 'Tạo CV', icon: Settings }
] as const;

// ==================== TOAST HOOK ====================

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, showToast };
};

// ==================== CONFIRM DIALOG HOOK ====================

const useConfirmDialog = () => {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const confirmAction = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        onConfirm: () => {
          resolve(true);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
      });
    });
  }, []);

  const cancelConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return { confirmState, confirmAction, cancelConfirm };
};

// ==================== MAIN COMPONENT ====================

const PortfolioPage = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();
  const { confirmState, confirmAction, cancelConfirm } = useConfirmDialog();

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Data States
  const [hasExtendedProfile, setHasExtendedProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [projects, setProjects] = useState<PortfolioProjectDTO[]>([]);
  const [certificates, setCertificates] = useState<ExternalCertificateDTO[]>([]);
  const [reviews, setReviews] = useState<MentorReviewDTO[]>([]);
  const [cvs, setCvs] = useState<GeneratedCVDTO[]>([]);

  // Modal States
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'create' | 'edit'>('create');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProject, setSelectedProject] = useState<PortfolioProjectDTO | undefined>();
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // UI States
  const [activeSection, setActiveSection] = useState<typeof TABS[number]['id']>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>(CERTIFICATE_CATEGORIES.ALL);
  const [selectedProjectType, setSelectedProjectType] = useState<string>(PROJECT_TYPES.ALL);

  // Load data on mount
  useEffect(() => {
    loadPortfolioData();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load Portfolio Data
  const loadPortfolioData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const checkResult = await portfolioService.checkExtendedProfile();
      setHasExtendedProfile(checkResult.hasExtendedProfile);

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
    } catch (err: any) {
      console.error('Error loading portfolio data:', err);
      setError(err.response?.data?.message || err.message || 'Không thể tải dữ liệu portfolio');
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
    const confirmed = await confirmAction('Bạn có chắc muốn xóa dự án này?');
    if (!confirmed) return;

    try {
      setActionLoading(prev => ({ ...prev, [`delete-project-${projectId}`]: true }));
      await portfolioService.deleteProject(projectId);
      await loadPortfolioData();
      showToast('Xóa dự án thành công!', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Không thể xóa dự án', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-project-${projectId}`]: false }));
    }
  };

  const handleCreateCertificate = async (certificate: ExternalCertificateDTO, image?: File) => {
    await portfolioService.createCertificate(certificate, image);
    await loadPortfolioData();
  };

  const handleDeleteCertificate = async (certId: number) => {
    const confirmed = await confirmAction('Bạn có chắc muốn xóa chứng chỉ này?');
    if (!confirmed) return;

    try {
      setActionLoading(prev => ({ ...prev, [`delete-cert-${certId}`]: true }));
      await portfolioService.deleteCertificate(certId);
      await loadPortfolioData();
      showToast('Xóa chứng chỉ thành công!', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Không thể xóa chứng chỉ', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-cert-${certId}`]: false }));
    }
  };

  const handleGenerateCV = async (request: CVGenerationRequest) => {
    await portfolioService.generateCV(request);
    await loadPortfolioData();
  };

  const handleSetActiveCV = async (cvId: number) => {
    try {
      setActionLoading(prev => ({ ...prev, [`set-active-cv-${cvId}`]: true }));
      await portfolioService.setActiveCV(cvId);
      await loadPortfolioData();
      showToast('Đặt CV làm active thành công!', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Không thể đặt CV làm active', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`set-active-cv-${cvId}`]: false }));
    }
  };

  const handleDeleteCV = async (cvId: number) => {
    const confirmed = await confirmAction('Bạn có chắc muốn xóa CV này?');
    if (!confirmed) return;

    try {
      setActionLoading(prev => ({ ...prev, [`delete-cv-${cvId}`]: true }));
      await portfolioService.deleteCV(cvId);
      await loadPortfolioData();
      showToast('Xóa CV thành công!', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Không thể xóa CV', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-cv-${cvId}`]: false }));
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
      showToast('Chưa có CV active. Vui lòng tạo hoặc đặt CV active trước.', 'info');
    }
  };

  const handleSharePortfolio = async () => {
    if (profile?.customUrlSlug) {
      const url = `${window.location.origin}/portfolio/${profile.customUrlSlug}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast('Đã copy link portfolio vào clipboard!', 'success');
      } catch {
        showToast('Không thể copy link', 'error');
      }
    } else {
      showToast('Vui lòng cập nhật custom URL slug trong profile.', 'info');
    }
  };

  // Memoized parse functions
  const skills = useMemo(() => {
    if (!profile?.topSkills) return [];
    try {
      return JSON.parse(profile.topSkills);
    } catch {
      return [];
    }
  }, [profile?.topSkills]);

  const languages = useMemo(() => {
    if (!profile?.languagesSpoken) return [];
    try {
      return JSON.parse(profile.languagesSpoken);
    } catch {
      return [];
    }
  }, [profile?.languagesSpoken]);

  // Filter data
  const filteredCertificates = useMemo(() => {
    if (selectedCategory === CERTIFICATE_CATEGORIES.ALL) return certificates;
    return certificates.filter(cert => cert.category === selectedCategory);
  }, [certificates, selectedCategory]);

  const filteredProjects = useMemo(() => {
    if (selectedProjectType === PROJECT_TYPES.ALL) return projects;
    return projects.filter(proj => proj.projectType === selectedProjectType);
  }, [projects, selectedProjectType]);

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

  // Toast render function
  const renderToast = (toast: Toast) => {
    const bgColor = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6',
    }[toast.type];

    return (
      <motion.div
        key={toast.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        style={{
          padding: '12px 20px',
          borderRadius: '8px',
          background: bgColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {toast.type === 'success' && <CheckCircle size={18} />}
        {toast.type === 'error' && <AlertCircle size={18} />}
        {toast.type === 'info' && <Eye size={18} />}
        {toast.message}
      </motion.div>
    );
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="sv-portfolio-container" data-theme={theme}>
      <div style={{ padding: '2rem' }}>
        <div style={{
          height: '120px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          marginBottom: '1rem',
          animation: 'pulse 2s infinite'
        }} />
        <div style={{
          height: '60px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          marginBottom: '1rem'
        }} />
        <div style={{
          height: '200px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px'
        }} />
      </div>
    </div>
  );

  // Not Authenticated State
  if (!isAuthenticated) {
    return (
      <div className="sv-portfolio-container" data-theme={theme}>
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Đăng nhập để xem Portfolio"
          message="Bạn cần đăng nhập để tạo và quản lý portfolio cá nhân"
          feature="Portfolio"
        />

        <div className="pf-no-profile-container">
          <div className="pf-no-profile-card">
            <h2>Đăng nhập để xem Portfolio</h2>
            <p>Bạn cần đăng nhập để tạo và quản lý portfolio của mình. Portfolio giúp bạn showcase kỹ năng, dự án và chứng chỉ với nhà tuyển dụng.</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="pf-btn pf-btn-primary"
              style={{ marginTop: '1rem' }}
            >
              Đăng nhập ngay
            </button>
            <button
              onClick={() => navigate('/register')}
              className="pf-btn pf-btn-secondary"
              style={{ marginTop: '0.5rem' }}
            >
              Tạo tài khoản mới
            </button>
          </div>
        </div>
        <MeowlGuide currentPage="portfolio" />
      </div>
    );
  }

  // Loading State
  if (loading) {
    return renderSkeleton();
  }

  // Error State
  if (error) {
    return (
      <div className="sv-portfolio-container" data-theme={theme}>
        <div className="pf-error-container">
          <AlertCircle size={48} color="#ef4444" />
          <h2>Không thể tải portfolio</h2>
          <p>{error}</p>
          <button onClick={loadPortfolioData} className="pf-btn pf-btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // No Extended Profile State
  if (!hasExtendedProfile) {
    return (
      <div className="sv-portfolio-container" data-theme={theme}>
        {/* Toast Container */}
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <AnimatePresence>
            {toasts.map(renderToast)}
          </AnimatePresence>
        </div>

        <div className="pf-no-profile-container">
          <div className="pf-no-profile-card">
            <h2>Chào mừng đến với Portfolio!</h2>
            <p>Tạo portfolio mở rộng để showcase kỹ năng, dự án và chứng chỉ của bạn với nhà tuyển dụng và khách hàng.</p>
            <button
              onClick={() => {
                setProfileModalMode('create');
                setProfileModalOpen(true);
              }}
              className="pf-btn pf-btn-primary"
              style={{ marginTop: '1rem' }}
            >
              <Plus size={18} />
              Tạo Portfolio Ngay
            </button>
          </div>

          <ProfileModal
            isOpen={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            onSubmit={handleCreateProfile}
            mode="create"
          />
        </div>
      </div>
    );
  }

  // Main Portfolio Page
  return (
    <>
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <AnimatePresence>
          {toasts.map(renderToast)}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      {confirmState.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={cancelConfirm}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '400px',
              textAlign: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            <AlertCircle size={48} color="#f59e0b" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '12px' }}>Xác nhận</h3>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
              {confirmState.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={cancelConfirm}
                className="pf-btn pf-btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={confirmState.onConfirm}
                className="pf-btn pf-btn-primary"
                style={{ background: '#ef4444' }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div
        className="sv-portfolio-container"
        data-theme={theme}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header Section */}
        <motion.div className="sv-portfolio-header" variants={itemVariants}>
          <div className="sv-portfolio-header__content">
            <h1 className="sv-portfolio-header__title">Portfolio Chuyên Nghiệp</h1>
            <p className="sv-portfolio-header__subtitle">
              {profile?.fullName || 'Tên của bạn'} • {profile?.professionalTitle || 'Chức danh'}
            </p>
          </div>

          <div className="sv-portfolio-header__actions">
            <motion.button
              className="sv-btn sv-btn--outline"
              onClick={() => navigate('/cv')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye size={18} />
              Xem CV
            </motion.button>
            <motion.button
              className="sv-btn sv-btn--outline"
              onClick={handleSharePortfolio}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 size={18} />
              Chia sẻ
            </motion.button>
            <motion.button
              className="sv-btn sv-btn--primary"
              onClick={handleExportCV}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={18} />
              Xuất CV
            </motion.button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div className="sv-portfolio-nav" variants={itemVariants}>
          <nav className="sv-portfolio-nav__tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`sv-portfolio-nav__tab ${
                    activeSection === tab.id ? 'sv-portfolio-nav__tab--active' : ''
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
        <div className="sv-portfolio-content">
          <AnimatePresence mode="wait">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <motion.div
                key="overview"
                className="sv-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="sv-profile-card">
                  <div className="sv-profile-card__header">
                    <div className="sv-profile-avatar">
                      {profile?.portfolioAvatarUrl || profile?.basicAvatarUrl ? (
                        <img
                          src={profile.portfolioAvatarUrl || profile.basicAvatarUrl}
                          alt={profile.fullName || 'User'}
                        />
                      ) : (
                        <div className="pf-avatar-placeholder">
                          {profile?.fullName?.[0] || 'U'}
                        </div>
                      )}
                    </div>

                    <div className="sv-profile-info">
                      <h2 className="sv-profile-info__name">{profile?.fullName || 'Tên của bạn'}</h2>
                      <p className="sv-profile-info__title">{profile?.professionalTitle || 'Chức danh'}</p>
                      {profile?.location && (
                        <p className="sv-profile-info__location">
                          <MapPin size={16} />
                          {profile.location}
                        </p>
                      )}
                    </div>

                    <div className="sv-profile-actions">
                      <button
                        onClick={() => {
                          setProfileModalMode('edit');
                          setProfileModalOpen(true);
                        }}
                        className="sv-btn sv-btn--outline sv-btn--sm"
                      >
                        <Edit size={16} />
                        Chỉnh sửa
                      </button>
                    </div>
                  </div>

                  <div className="sv-profile-card__content">
                    <div className="sv-profile-contact">
                      {profile?.phone && (
                        <a href={`tel:${profile.phone}`} className="sv-contact-link">
                          {profile.phone}
                        </a>
                      )}
                      {profile?.linkedinUrl && (
                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="sv-contact-link">
                          <Linkedin size={16} />
                        </a>
                      )}
                      {profile?.githubUrl && (
                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="sv-contact-link">
                          <GithubIcon size={16} />
                        </a>
                      )}
                    </div>

                    {profile?.basicBio && (
                      <div className="sv-profile-section">
                        <h3>Giới thiệu</h3>
                        <p>{profile.basicBio}</p>
                      </div>
                    )}

                    {profile?.careerGoals && (
                      <div className="sv-profile-section">
                        <h3>Mục tiêu nghề nghiệp</h3>
                        <p>{profile.careerGoals}</p>
                      </div>
                    )}

                    {skills.length > 0 && (
                      <div className="sv-profile-section">
                        <h3>Kỹ năng chính</h3>
                        <div className="sv-tags">
                          {skills.map((skill: string, idx: number) => (
                            <span key={idx} className="sv-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {languages.length > 0 && (
                      <div className="sv-profile-section">
                        <h3>Ngôn ngữ</h3>
                        <div className="sv-tags">
                          {languages.map((lang: string, idx: number) => (
                            <span key={idx} className="sv-tag">{lang}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sv-stats-grid">
                  <div className="sv-stat-card">
                    <div className="sv-stat-card__icon">👁</div>
                    <div className="sv-stat-card__content">
                      <h3>{profile?.portfolioViews || 0}</h3>
                      <p>Lượt xem</p>
                    </div>
                  </div>
                  <div className="sv-stat-card">
                    <div className="sv-stat-card__icon">📁</div>
                    <div className="sv-stat-card__content">
                      <h3>{profile?.totalProjects || 0}</h3>
                      <p>Dự án</p>
                    </div>
                  </div>
                  <div className="sv-stat-card">
                    <div className="sv-stat-card__icon">🏆</div>
                    <div className="sv-stat-card__content">
                      <h3>{profile?.totalCertificates || 0}</h3>
                      <p>Chứng chỉ</p>
                    </div>
                  </div>
                  <div className="sv-stat-card">
                    <div className="sv-stat-card__icon">⭐</div>
                    <div className="sv-stat-card__content">
                      <h3>{reviews.length}</h3>
                      <p>Đánh giá</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Projects Section */}
            {activeSection === 'projects' && (
              <motion.div
                key="projects"
                className="sv-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="sv-section-header">
                  <div>
                    <h2>Dự án của tôi</h2>
                    <p>Các dự án đã hoàn thành và đang thực hiện</p>
                  </div>
                  <button
                    onClick={() => {
                      setProjectModalMode('create');
                      setSelectedProject(undefined);
                      setProjectModalOpen(true);
                    }}
                    className="sv-btn sv-btn--primary"
                  >
                    <Plus size={18} />
                    Thêm dự án
                  </button>
                </div>

                <div className="sv-certificate-categories" style={{ marginBottom: '2rem' }}>
                  {PROJECT_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedProjectType(type)}
                      className={`sv-filter-btn ${selectedProjectType === type ? 'active' : ''}`}
                    >
                      {type === PROJECT_TYPES.ALL ? 'Tất cả' : type}
                    </button>
                  ))}
                </div>

                <div className="sv-certificates-grid">
                  {filteredProjects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                      <Briefcase size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <p style={{ color: 'var(--text-secondary)' }}>Chưa có dự án nào. Thêm dự án đầu tiên của bạn!</p>
                    </div>
                  ) : (
                    filteredProjects.map((project) => (
                      <div key={project.id} className="sv-certificate-card">
                        {project.thumbnailUrl && (
                          <img
                            src={project.thumbnailUrl}
                            alt={project.title}
                            loading="lazy"
                            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '1rem' }}
                          />
                        )}
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{project.title}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          {project.description}
                        </p>
                        {project.tools && project.tools.length > 0 && (
                          <div className="sv-tags" style={{ marginBottom: '1rem' }}>
                            {project.tools.slice(0, 3).map((tool, idx) => (
                              <span key={idx} className="sv-tag" style={{ fontSize: '0.75rem' }}>{tool}</span>
                            ))}
                          </div>
                        )}
                        <div className="sv-certificate-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                          {project.projectUrl && (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sv-btn sv-btn--outline sv-btn--sm"
                            >
                              <ExternalLink size={14} />
                              Xem
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setProjectModalMode('edit');
                              setSelectedProject(project);
                              setProjectModalOpen(true);
                            }}
                            className="sv-btn sv-btn--outline sv-btn--sm"
                          >
                            <Edit size={14} />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id!)}
                            className="sv-btn sv-btn--outline sv-btn--sm"
                            disabled={actionLoading[`delete-project-${project.id}`]}
                            style={{ color: '#ef4444' }}
                          >
                            {actionLoading[`delete-project-${project.id}`] ? (
                              <Loader2 size={14} className="spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Certificates Section */}
            {activeSection === 'certificates' && (
              <motion.div
                key="certificates"
                className="sv-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="sv-section-header">
                  <div>
                    <h2>Chứng chỉ & Kỹ năng</h2>
                    <p>Chứng chỉ đã đạt được từ các tổ chức bên ngoài</p>
                  </div>
                  <button
                    onClick={() => setCertificateModalOpen(true)}
                    className="sv-btn sv-btn--primary"
                  >
                    <Plus size={18} />
                    Thêm chứng chỉ
                  </button>
                </div>

                <div className="sv-certificate-categories">
                  {CERTIFICATE_CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`sv-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                    >
                      {cat === CERTIFICATE_CATEGORIES.ALL ? 'Tất cả' : cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="sv-certificates-grid">
                  {filteredCertificates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                      <Award size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <p style={{ color: 'var(--text-secondary)' }}>Chưa có chứng chỉ nào. Thêm chứng chỉ đầu tiên!</p>
                    </div>
                  ) : (
                    filteredCertificates.map((cert) => (
                      <div key={cert.id} className="sv-certificate-card">
                        {cert.certificateImageUrl && (
                          <img
                            src={cert.certificateImageUrl}
                            alt={cert.title}
                            loading="lazy"
                            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '1rem' }}
                          />
                        )}
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{cert.title}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          {cert.issuingOrganization}
                        </p>
                        {cert.issueDate && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                            {new Date(cert.issueDate).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                        {cert.skills && cert.skills.length > 0 && (
                          <div className="sv-tags" style={{ marginBottom: '1rem' }}>
                            {cert.skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="sv-tag" style={{ fontSize: '0.75rem' }}>{skill}</span>
                            ))}
                          </div>
                        )}
                        <div className="sv-certificate-actions">
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sv-btn sv-btn--outline sv-btn--sm"
                            >
                              <ExternalLink size={14} />
                              Xác thực
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteCertificate(cert.id!)}
                            className="sv-btn sv-btn--outline sv-btn--sm"
                            disabled={actionLoading[`delete-cert-${cert.id}`]}
                            style={{ color: '#ef4444' }}
                          >
                            {actionLoading[`delete-cert-${cert.id}`] ? (
                              <Loader2 size={14} className="spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* CV Builder Section */}
            {activeSection === 'cv-builder' && (
              <motion.div
                key="cv-builder"
                className="sv-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="sv-section-header">
                  <div>
                    <h2>Tạo CV với AI</h2>
                    <p>Sử dụng AI để tạo CV chuyên nghiệp từ portfolio của bạn</p>
                  </div>
                  <button
                    onClick={() => setCvModalOpen(true)}
                    className="sv-btn sv-btn--primary"
                  >
                    <Plus size={18} />
                    Tạo CV mới
                  </button>
                </div>

                <div className="sv-certificates-grid">
                  {cvs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                      <Settings size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <p style={{ color: 'var(--text-secondary)' }}>Chưa có CV nào. Tạo CV đầu tiên với AI!</p>
                    </div>
                  ) : (
                    cvs.map((cv) => (
                      <div key={cv.id} className="sv-certificate-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <h3 style={{ fontSize: '1.125rem', margin: 0 }}>{cv.templateName}</h3>
                          {cv.isActive && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              background: '#10b981',
                              color: 'white',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem'
                            }}>
                              Active
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          Version {cv.version}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          {new Date(cv.createdAt || '').toLocaleDateString('vi-VN')}
                        </p>
                        <div className="sv-certificate-actions">
                          <button
                            onClick={() => navigate('/cv')}
                            className="sv-btn sv-btn--outline sv-btn--sm"
                          >
                            <Eye size={14} />
                            Xem
                          </button>
                          <button
                            onClick={() => handleEditCV(cv.id!)}
                            className="sv-btn sv-btn--outline sv-btn--sm"
                          >
                            <Edit size={14} />
                            Sửa
                          </button>
                          {!cv.isActive && (
                            <button
                              onClick={() => handleSetActiveCV(cv.id!)}
                              className="sv-btn sv-btn--primary sv-btn--sm"
                              disabled={actionLoading[`set-active-cv-${cv.id}`]}
                              style={{ background: '#f59e0b' }}
                            >
                              {actionLoading[`set-active-cv-${cv.id}`] ? (
                                <Loader2 size={14} className="spin" />
                              ) : (
                                <Settings size={14} />
                              )}
                              Set Active
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
                            className="sv-btn sv-btn--primary sv-btn--sm"
                          >
                            <Download size={14} />
                            PDF
                          </button>
                          <button
                            onClick={() => handleDeleteCV(cv.id!)}
                            className="sv-btn sv-btn--outline sv-btn--sm"
                            disabled={actionLoading[`delete-cv-${cv.id}`]}
                            style={{ color: '#ef4444' }}
                          >
                            {actionLoading[`delete-cv-${cv.id}`] ? (
                              <Loader2 size={14} className="spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
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
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onSubmit={profileModalMode === 'create' ? handleCreateProfile : handleUpdateProfile}
          initialData={profile || undefined}
          mode={profileModalMode}
        />

        <ProjectModal
          isOpen={projectModalOpen}
          onClose={() => {
            setProjectModalOpen(false);
            setSelectedProject(undefined);
          }}
          onSubmit={projectModalMode === 'create' ? handleCreateProject : handleUpdateProject}
          initialData={selectedProject}
          mode={projectModalMode}
        />

        <CertificateModal
          isOpen={certificateModalOpen}
          onClose={() => setCertificateModalOpen(false)}
          onSubmit={handleCreateCertificate}
        />

        <CVGenerationModal
          isOpen={cvModalOpen}
          onClose={() => setCvModalOpen(false)}
          onSubmit={handleGenerateCV}
        />

        <MeowlGuide currentPage="portfolio" />
      </motion.div>

      {/* Global CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

export default PortfolioPage;
