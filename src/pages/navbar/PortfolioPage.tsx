import { useState, useEffect } from 'react';
import { 
  Download, Edit, Share2, Eye, Award, Briefcase,
  MapPin, Linkedin, Github as GithubIcon, Loader, AlertCircle, Plus,
  Trash2, ExternalLink, Calendar, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MeowlGuide from '../../components/MeowlGuide';
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

const PortfolioPage = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
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

  // Load data on mount
  useEffect(() => {
    loadPortfolioData();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load Portfolio Data
  const loadPortfolioData = async () => {
    // Don't load data if not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Starting portfolio data load...');
      console.log('Token:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
      
      // Check if has extended profile
      const checkResult = await portfolioService.checkExtendedProfile();
      console.log('✅ Check result:', checkResult);
      setHasExtendedProfile(checkResult.hasExtendedProfile);
      
      if (checkResult.hasExtendedProfile) {
        console.log('📊 Loading portfolio data...');
        // Load all data in parallel
        const [profileData, projectsData, certsData, reviewsData, cvsData] = await Promise.all([
          portfolioService.getProfile(),
          portfolioService.getUserProjects(),
          portfolioService.getUserCertificates(),
          portfolioService.getUserReviews(),
          portfolioService.getAllCVs(),
        ]);
        
        console.log('✅ Profile loaded:', profileData);
        setProfile(profileData);
        setProjects(projectsData);
        setCertificates(certsData);
        setReviews(reviewsData);
        setCvs(cvsData);
      } else {
        console.log('ℹ️ No extended profile found');
      }
    } catch (err: any) {
      console.error('❌ Error loading portfolio data:', err);
      console.error('Response:', err.response?.data);
      console.error('Status:', err.response?.status);
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
      // Call API to set CV as active
      await portfolioService.setActiveCV(cvId);
      await loadPortfolioData();
      alert('Đã đặt CV làm active thành công!');
    } catch (error: any) {
      alert('Không thể đặt CV làm active: ' + (error?.message || 'Lỗi không xác định'));
    }
  };

  const handleDeleteCV = async (cvId: number) => {
    if (confirm('Bạn có chắc muốn xóa CV này?')) {
      try {
        await portfolioService.deleteCV(cvId);
        await loadPortfolioData();
        alert('Đã xóa CV thành công!');
      } catch (error: any) {
        alert('Không thể xóa CV: ' + (error?.message || 'Lỗi không xác định'));
      }
    }
  };

  const handleEditCV = (cvId: number) => {
    // Navigate to CV page with edit mode
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
      alert('Chưa có CV active. Vui lòng tạo hoặc đặt CV active trước.');
    }
  };

  const handleSharePortfolio = () => {
    if (profile?.customUrlSlug) {
      const url = `${globalThis.location.origin}/portfolio/${profile.customUrlSlug}`;
      navigator.clipboard.writeText(url);
      alert('Đã copy link portfolio vào clipboard!');
    } else {
      alert('Vui lòng cập nhật custom URL slug trong profile.');
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

  // Not Authenticated State
  if (!isAuthenticated) {
    return (
      <div className="sv-portfolio-container" data-theme={theme}>
        <div className="pf-no-profile-container">
          <div className="pf-no-profile-card">
            <h2>🔒 Đăng nhập để xem Portfolio</h2>
            <p>Bạn cần đăng nhập để tạo và quản lý portfolio của mình. Portfolio giúp bạn showcase kỹ năng, dự án và chứng chỉ với nhà tuyển dụng.</p>
            <button
              onClick={() => navigate('/login')}
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
    return (
      <div className="sv-portfolio-container" data-theme={theme}>
        <div className="pf-loading-container">
          <Loader size={48} className="pf-spinner" />
          <p>Đang tải portfolio...</p>
        </div>
      </div>
    );
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
          
          {/* Profile Modal */}
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
          {[
            { id: 'overview', label: 'Tổng quan', icon: Eye },
            { id: 'projects', label: 'Dự án', icon: Briefcase },
            { id: 'certificates', label: 'Chứng chỉ', icon: Award },
            { id: 'cv-builder', label: 'Tạo CV', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleSectionChange(tab.id)}
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
              {/* Profile Card */}
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
                  {/* Contact & Links */}
                  <div className="sv-profile-contact">
                    {profile?.phone && (
                      <a href={`tel:${profile.phone}`} className="sv-contact-link">
                        📞 {profile.phone}
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

                  {/* Bio */}
                  {profile?.basicBio && (
                    <div className="sv-profile-section">
                      <h3>Giới thiệu</h3>
                      <p>{profile.basicBio}</p>
                    </div>
                  )}

                  {/* Career Goals */}
                  {profile?.careerGoals && (
                    <div className="sv-profile-section">
                      <h3>Mục tiêu nghề nghiệp</h3>
                      <p>{profile.careerGoals}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {getSkills().length > 0 && (
                    <div className="sv-profile-section">
                      <h3>Kỹ năng chính</h3>
                      <div className="sv-tags">
                        {getSkills().map((skill: string, idx: number) => (
                          <span key={idx} className="sv-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {getLanguages().length > 0 && (
                    <div className="sv-profile-section">
                      <h3>Ngôn ngữ</h3>
                      <div className="sv-tags">
                        {getLanguages().map((lang: string, idx: number) => (
                          <span key={idx} className="sv-tag">{lang}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="sv-stats-grid">
                <div className="sv-stat-card">
                  <div className="sv-stat-card__icon">👁️</div>
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

              {/* Project Filters */}
              <div className="sv-certificate-categories" style={{ marginBottom: '2rem' }}>
                {['Tất cả', 'MICROJOB', 'FREELANCE', 'PERSONAL', 'ACADEMIC', 'OPEN_SOURCE'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedProjectType(type)}
                    className={`sv-filter-btn ${selectedProjectType === type ? 'active' : ''}`}
                  >
                    {type === 'Tất cả' ? 'Tất cả' : type}
                  </button>
                ))}
              </div>

              {/* Projects Grid */}
              <div className="sv-certificates-grid">
                {filteredProjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Chưa có dự án nào. Thêm dự án đầu tiên của bạn!</p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div key={project.id} className="sv-certificate-card">
                      {project.thumbnailUrl && (
                        <img 
                          src={project.thumbnailUrl} 
                          alt={project.title}
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
                          style={{ color: '#ef4444' }}
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

              {/* Category Filters */}
              <div className="sv-certificate-categories">
                {['Tất cả', 'TECHNICAL', 'DESIGN', 'BUSINESS', 'SOFT_SKILLS', 'LANGUAGE', 'OTHER'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`sv-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                  >
                    {cat === 'Tất cả' ? 'Tất cả' : cat}
                  </button>
                ))}
              </div>

              {/* Certificates Grid */}
              <div className="sv-certificates-grid">
                {filteredCertificates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Chưa có chứng chỉ nào. Thêm chứng chỉ đầu tiên!</p>
                  </div>
                ) : (
                  filteredCertificates.map((cert) => (
                    <div key={cert.id} className="sv-certificate-card">
                      {cert.certificateImageUrl && (
                        <img 
                          src={cert.certificateImageUrl} 
                          alt={cert.title}
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
                          style={{ color: '#ef4444' }}
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

              {/* CV List */}
              <div className="sv-certificates-grid">
                {cvs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
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
                            style={{ background: '#f59e0b' }}
                          >
                            <Settings size={14} />
                            Set Active
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Download PDF logic here
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
                          style={{ color: '#ef4444' }}
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

      {/* Meowl Guide */}
      <MeowlGuide currentPage="portfolio" />
    </motion.div>
  );
};

export default PortfolioPage;
