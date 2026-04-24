import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, ArrowRight, ChevronRight, X, Search, SlidersHorizontal, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import careerChatService from '../../services/careerChatService';
import { premiumService } from '../../services/premiumService';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import { ExpertFieldResponse, RoleInfo } from '../../types/CareerChat';
import { getDomainImage } from '../../utils/domainImageMap';
import { getExpertDomainMeta } from '../../utils/expertFieldPresentation';
import { useToast } from '../../hooks/useToast';
import LoginRequiredModal from '../../components/auth/LoginRequiredModal';
import '../../styles/CareerChatLandingTech.css';

/**
 * Career Chat Landing Page
 * Hologram-style selection between General Career Advisor and Expert Mode
 */
const CareerChatLanding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { showError } = useToast();
  const [showExpertFlow, setShowExpertFlow] = useState(false);
  const [expertFields, setExpertFields] = useState<ExpertFieldResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const sub = await premiumService.getCurrentSubscription();
        setSubscription(sub);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };
    if (isAuthenticated) {
      fetchSubscription();
    }
  }, [isAuthenticated]);
  
  // Selection state
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [step, setStep] = useState<'choice' | 'domain-roles'>('choice');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'industry' | 'role-count'>('industry');

  // Memoized statistics calculation - only recalculate when expertFields changes
  const statistics = useMemo(() => {
    if (expertFields.length === 0) {
      return { totalExperts: 382, totalDomains: 13, totalIndustries: 45 };
    }
    
    let experts = 0;
    let industries = 0;
    
    expertFields.forEach(field => {
      field.industries.forEach(industry => {
        industries++;
        experts += industry.roles.filter(role => role.isActive).length;
      });
    });
    
    return {
      totalExperts: experts,
      totalDomains: expertFields.length,
      totalIndustries: industries
    };
  }, [expertFields]);

  // Memoized animated counter - prevent recreation on every render
  const animateCounter = useCallback((elementId: string, target: number, suffix: string = '') => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = target / 50;
    const duration = 1500; // 1.5 seconds
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current).toLocaleString() + suffix;
    }, stepTime);
    
    return () => clearInterval(timer);
  }, []);

  // Trigger animation when statistics change
  useEffect(() => {
    if (statistics.totalExperts > 0) {
      const timers = [
        animateCounter('expertCount', statistics.totalExperts, '+'),
        animateCounter('domainCount', statistics.totalDomains, ''),
        animateCounter('industryCount', statistics.totalIndustries, '+')
      ];
      
      return () => {
        timers.forEach(cleanup => cleanup && cleanup());
      };
    }
  }, [statistics, animateCounter]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [isAuthenticated, authLoading]);

  const loadExpertFields = async () => {
    try {
      setLoading(true);
      let fields = await careerChatService.getExpertFields();
      
      // Fallback for demo if API returns empty
      if (!fields || fields.length === 0) {
        console.warn('API returned empty fields, using mock data for demo');
        fields = [
          {
            domain: 'Kinh doanh – Marketing – Quản trị',
            industries: [
              {
                industry: 'Marketing',
                roles: [
                  { jobRole: 'Digital Marketing Specialist', keywords: 'SEO, SEM, Content', isActive: true, mediaUrl: 'https://cdn-icons-png.flaticon.com/512/1998/1998087.png' },
                  { jobRole: 'Content Creator', keywords: 'Video, Blog, Social', isActive: true, mediaUrl: 'https://cdn-icons-png.flaticon.com/512/3050/3050525.png' },
                  { jobRole: 'Brand Manager', keywords: 'Branding, Strategy', isActive: true, mediaUrl: 'https://cdn-icons-png.flaticon.com/512/1570/1570998.png' }
                ]
              },
              {
                industry: 'Business & Management',
                roles: [
                  { jobRole: 'Business Analyst', keywords: 'Data, Requirement, SQL', isActive: true, mediaUrl: 'https://cdn-icons-png.flaticon.com/512/2706/2706950.png' },
                  { jobRole: 'Project Manager', keywords: 'Agile, Scrum, Planning', isActive: true, mediaUrl: 'https://cdn-icons-png.flaticon.com/512/1087/1087815.png' }
                ]
              },
              {
                industry: 'Sales & Growth',
                roles: [
                  { jobRole: 'Sales Executive', keywords: 'B2B, B2C, Negotiation', isActive: true, mediaUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' },
                  { jobRole: 'Account Manager', keywords: 'CRM, Client Relationship', isActive: true, mediaUrl: 'https://cdn-icons-png.flaticon.com/512/942/942748.png' }
                ]
              }
            ]
          },
          {
            domain: 'Công nghệ thông tin (IT)',
            industries: [
              {
                industry: 'Software Development',
                roles: [
                  { jobRole: 'Frontend Developer', keywords: 'React, Vue, CSS', isActive: true, mediaUrl: 'https://cdn-icons-png.flaticon.com/512/2721/2721614.png' },
                  { jobRole: 'Backend Developer', keywords: 'Java, Node.js, Python', isActive: true, mediaUrl: 'https://cdn-icons-png.flaticon.com/512/2721/2721620.png' }
                ]
              },
              {
                industry: 'Data Science',
                roles: [
                  { jobRole: 'Data Scientist', keywords: 'Python, ML, AI', isActive: true, mediaUrl: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png' }
                ]
              }
            ]
          }
        ];
      }
      
      setExpertFields(fields);
    } catch (error) {
      console.error('Failed to load expert fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChat = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    navigate('/chatbot/general');
  };

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setStep('domain-roles');
    setSelectedIndustry(''); // Reset industry filter
  };

  const handleRoleClick = (industry: string, role: RoleInfo) => {
    navigate('/chatbot/expert', {
      state: {
        domain: selectedDomain,
        industry: industry,
        jobRole: role.jobRole,
        mediaUrl: role.mediaUrl
      }
    });
  };

  const handleBack = () => {
    if (step === 'domain-roles') {
      setShowExpertFlow(false);
      setStep('choice');
      setSelectedDomain('');
      setSelectedIndustry('');
    }
  };

  const getCurrentIndustries = () => {
    return expertFields.find(f => f.domain === selectedDomain)?.industries || [];
  };

  const getDisplayIndustries = () => {
    // Deep copy to avoid mutating state
    let industries = JSON.parse(JSON.stringify(getCurrentIndustries()));

    // 1. Filter by Selected Industry (Dropdown)
    if (selectedIndustry && selectedIndustry !== '') {
      industries = industries.filter((i: any) => i.industry === selectedIndustry);
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      industries = industries.map((ind: any) => ({
        ...ind,
        roles: (ind.roles || []).filter((r: RoleInfo) => 
          r.jobRole.toLowerCase().includes(query) ||
          (r.keywords && r.keywords.toLowerCase().includes(query))
        )
      })).filter((ind: any) => ind.roles.length > 0);
    } else {
      // Ensure roles array exists
      industries = industries.map((ind: any) => ({
        ...ind,
        roles: (ind.roles || [])
      }));
    }

    // 3. Sort
    if (sortBy === 'industry') {
      industries.sort((a: any, b: any) => a.industry.localeCompare(b.industry));
    } else if (sortBy === 'role-count') {
      industries.sort((a: any, b: any) => b.roles.length - a.roles.length);
    }

    return industries;
  };

  const displayIndustries = getDisplayIndustries();
  const allIndustries = getCurrentIndustries();

  return (
    <div className="career-landing">
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để sử dụng Career Chat"
        message="Bạn cần đăng nhập để trò chuyện với Meowl và nhận tư vấn nghề nghiệp cá nhân hóa"
        feature="Career Chat"
      />

      {/* Hologram Background */}
      <div className="career-landing__bg">
        <div className="holo-grid"></div>
        <div className="holo-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="holo-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="career-landing__container">
        <AnimatePresence mode="wait">
          {!showExpertFlow ? (
            // Unified Career Advisor Screen - Isolated & Viewport Optimized
            <motion.div
              key="choice"
              className="ccl-landing-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="ccl-landing-col-left">
                {/* Isolated Header */}
                <motion.div
                  className="ccl-landing-header"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="ccl-landing-title-wrapper">
                    <div className="holo-corner tl"></div>
                    <div className="holo-corner tr"></div>
                    <div className="holo-corner bl"></div>
                    <div className="holo-corner br"></div>
                    <h1 className="holo-title">AI CAREER ADVISOR</h1>
                    <p className="holo-subtitle">MEOWL - TRỢ LÝ NGHỀ NGHIỆP THÔNG MINH</p>
                  </div>
                </motion.div>

                {/* Isolated Consultation Features */}
                <motion.div 
                  className="ccl-landing-features"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="ccl-landing-feature-item">
                    <div className="ccl-landing-feature-dot"></div>
                    <span>Tư vấn theo ngữ cảnh: IT, Business, Design, Healthcare...</span>
                  </div>
                  <div className="ccl-landing-feature-item">
                    <div className="ccl-landing-feature-dot"></div>
                    <span>Định hướng nghề nghiệp & phát triển kỹ năng</span>
                  </div>
                  <div className="ccl-landing-feature-item">
                    <div className="ccl-landing-feature-dot"></div>
                    <span>Thông tin thị trường lao động cập nhật</span>
                  </div>
                </motion.div>
              </div>

              <div className="ccl-landing-col-right">
                {/* Redesigned Card - More Synchronized with Theme */}
                <motion.div
                  className="ccl-landing-card"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="ccl-landing-card-glow"></div>
                  <div className="ccl-landing-card-pattern"></div>
                  
                  <div className="card-border">
                    <div className="border-corner tl"></div>
                    <div className="border-corner tr"></div>
                    <div className="border-corner bl"></div>
                    <div className="border-corner br"></div>
                  </div>
                  
                  <div className="ccl-landing-card-icon-wrap">
                    <Sparkles size={48} />
                    <div className="ccl-landing-card-pulse"></div>
                  </div>
                  
                  <div className="ccl-landing-card-body">
                    <h2 className="ccl-landing-card-title">TRÒ CHUYỆN VỚI MEOWL</h2>
                    <p className="ccl-landing-card-subtitle">UNIFIED CAREER ADVISOR</p>
                    
                    <div className="ccl-landing-card-badge">
                      <span className="badge-dot"></span>
                      <span>Nhận diện ngành nghề tự động</span>
                    </div>

                    <div className="ccl-landing-card-hint">
                      <p>Đề cập "<strong>Java</strong>", "<strong>Marketing</strong>" hoặc "<strong>UI Design</strong>" — AI tự điều chỉnh chuyên môn</p>
                    </div>
                    
                    <button 
                      className="ccl-landing-card-btn"
                      onClick={handleGeneralChat}
                    >
                      <span>BẮT ĐẦU TRÒ CHUYỆN</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            // Expert Selection Flow
            <motion.div
              key="expert-flow"
              className="expert-flow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header with Back Button */}
              <div className="flow-header">
                <button className="flow-back-btn" onClick={handleBack}>
                  <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                  <span>QUAY LẠI</span>
                </button>
                
                <div className="flow-progress">
                  <div className={`progress-step ${step === 'choice' ? 'active' : ''} ${selectedDomain ? 'completed' : ''}`}>
                    <span>1</span>
                    <span className="step-label">Lĩnh vực</span>
                  </div>
                  <div className="progress-line"></div>
                  <div className={`progress-step ${step === 'domain-roles' ? 'active' : ''}`}>
                    <span>2</span>
                    <span className="step-label">Vai trò</span>
                  </div>
                </div>

                <button className="flow-close-btn" onClick={() => setShowExpertFlow(false)}>
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flow-content">
                <AnimatePresence mode="wait">
                  {/* Step 1: Domain Selection */}
                  {step === 'choice' && showExpertFlow && (
                    <motion.div
                      key="domain"
                      className="selection-grid"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="selection-title">CHỌN LĨNH VỰC</h2>
                      {loading ? (
                        <div className="loading">Đang tải...</div>
                      ) : (
                        <div className="grid-items">
                          {expertFields.map((field, index) => {
                            const domainMeta = getExpertDomainMeta(field.domain);
                            const domainImage = getDomainImage(field.domain);
                            return (
                              <motion.div
                                key={field.domain}
                                className="grid-item domain"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleDomainSelect(field.domain)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <div className="item-border"></div>
                                {domainImage ? (
                                  <div className="domain-card-image-wrap">
                                    <img
                                      src={domainImage}
                                      alt={domainMeta.label}
                                      className="domain-card-image"
                                    />
                                  </div>
                                ) : (
                                  <div className="domain-card-icon">{domainMeta.icon}</div>
                                )}
                                <div className="item-content">
                                  <h3>{domainMeta.label}</h3>
                                  <p>{field.industries.length} ngành nghề</p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 2: All Industries + Roles Grid */}
                  {step === 'domain-roles' && (
                    <motion.div
                      key="domain-roles"
                      className="industries-roles-view"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="selection-title">{selectedDomain}</h2>
                      <p className="selection-subtitle">Chọn vai trò chuyên gia của bạn</p>
                      
                      {/* Search & Sort & Filter */}
                      <div className="ccl-search-sort-bar">
                        <div className="ccl-search-box">
                          <Search size={18} />
                          <input
                            type="text"
                            placeholder="Tìm kiếm vai trò..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ccl-search-input"
                          />
                        </div>

                        {/* Industry Filter */}
                        <div className="ccl-sort-box">
                          <Filter size={18} />
                          <select
                            value={selectedIndustry}
                            onChange={(e) => setSelectedIndustry(e.target.value)}
                            className="ccl-sort-select"
                          >
                            <option value="">Tất cả ngành</option>
                            {allIndustries.map(ind => (
                              <option key={ind.industry} value={ind.industry}>
                                {ind.industry}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="ccl-sort-box">
                          <SlidersHorizontal size={18} />
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'industry' | 'role-count')}
                            className="ccl-sort-select"
                          >
                            <option value="industry">Theo ngành (A-Z)</option>
                            <option value="role-count">Số lượng vai trò</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="industries-container">
                        {displayIndustries.length > 0 ? (
                          displayIndustries.map((industry: any, industryIndex: number) => (
                            <motion.div
                              key={industry.industry}
                              className="industry-section"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: industryIndex * 0.1 }}
                            >
                              <div className="industry-header">
                                <div className="industry-icon">
                                  <Sparkles size={20} />
                                </div>
                                <h3 className="industry-title">{industry.industry}</h3>
                                <span className="industry-count">{industry.roles.length} vai trò</span>
                              </div>
                              <div className="roles-grid">
                                {Array.isArray(industry.roles) && industry.roles.length > 0 ? (
                                  industry.roles.map((role: RoleInfo) => (
                                    <div
                                      key={role.jobRole}
                                      className="role-card"
                                      onClick={() => handleRoleClick(industry.industry, role)}
                                    >
                                      {role.mediaUrl && (
                                        <div className="role-card-icon">
                                          <img src={role.mediaUrl} alt={role.jobRole} />
                                        </div>
                                      )}
                                      <h4 className="role-card-title">{role.jobRole}</h4>
                                      {role.keywords && (
                                        <p className="role-card-keywords">{role.keywords}</p>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p style={{ color: '#67e8f9', opacity: 0.7, padding: '10px' }}>
                                    Chưa có vai trò nào được cập nhật.
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="no-results">
                            <Search size={48} />
                            <p>Không tìm thấy kết quả nào phù hợp.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CareerChatLanding;
