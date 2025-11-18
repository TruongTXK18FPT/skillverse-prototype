import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronDown, 
  Grid,
  User,
  LogOut,
  Bell,
  Wallet,
  Sun,
  Moon,
  Menu,
  X,
  Crown,
  BarChart3,
  GraduationCap,
  Users,
  MessageSquare,
  Briefcase,
  Bot,
  Trophy,
  Calendar,
  Map,
  BookOpen,
  Shield,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import walletService from '../services/walletService';
import Logo from '../assets/skillverse.png';
import '../styles/Header.css';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Guard against rapid toggles that can cause layout thrashing on mobile
  const [isMobileMenuToggleLocked, setIsMobileMenuToggleLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Categories for mega menu with icons and descriptions
  const categories = [
    { 
      name: 'Bảng Điều Khiển',
      description: 'Theo dõi tiến độ học tập và thành tích của bạn',
      path: '/dashboard',
      icon: BarChart3
    },
    { 
      name: 'Khóa Học',
      description: 'Khám phá các khóa học chất lượng cao',
      path: '/courses',
      icon: GraduationCap
    },
    { 
      name: 'Lộ Trình Học Tập',
      description: 'Khám phá lộ trình học tập và phát triển kỹ năng',
      path: '/roadmap',
      icon: Map
    },
    { 
      name: 'Cố Vấn',
      description: 'Kết nối với chuyên gia trong ngành',
      path: '/mentorship',
      icon: Users
    },
    { 
      name: 'Cộng Đồng',
      description: 'Tham gia cộng đồng học tập sôi động',
      path: '/community',
      icon: MessageSquare
    },
    { 
      name: 'Việc Làm',
      description: 'Tìm kiếm cơ hội việc làm phù hợp',
      path: '/jobs',
      icon: Briefcase
    },
    { 
      name: 'Hồ Sơ',
      description: 'Quản lý và chia sẻ thành tích của bạn',
      path: '/portfolio',
      icon: User
    },
    { 
      name: 'Trợ Lý AI',
      description: 'Nhận hỗ trợ từ trợ lý AI thông minh',
      path: '/chatbot',
      icon: Bot
    },
    { 
      name: 'Trò Chơi',
      description: 'Bảng xếp hạng, huy hiệu và mini-games',
      path: '/gamification',
      icon: Trophy
    },
    { 
      name: 'Hội Thảo',
      description: 'Tham gia các hội thảo và sự kiện',
      path: '/seminar',
      icon: Calendar
    }
  ];

  // Fetch wallet balance when user is authenticated
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (isAuthenticated && user) {
        setLoadingBalance(true);
        try {
          const walletData = await walletService.getMyWallet();
          setWalletBalance(walletData.cashBalance);
        } catch (error) {
          console.error('Failed to fetch wallet balance:', error);
          setWalletBalance(null);
        } finally {
          setLoadingBalance(false);
        }
      }
    };

    fetchWalletBalance();
  }, [isAuthenticated, user]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setShowMegaMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Smart search - check if query matches any category names or keywords
      const query = searchQuery.toLowerCase().trim();
      
      // Define search keywords for each page
      const searchMap: { [key: string]: string } = {
        // Dashboard keywords
        'dashboard': '/dashboard',
        'bảng điều khiển': '/dashboard',
        'tiến độ': '/dashboard',
        'thống kê': '/dashboard',
        
        // Courses keywords  
        'course': '/courses',
        'courses': '/courses',
        'khóa học': '/courses',
        'học tập': '/courses',
        'bài học': '/courses',
        
        // Roadmap keywords
        'roadmap': '/roadmap', 
        'lộ trình': '/roadmap',
        'lộ trình học tập': '/roadmap',
        'kỹ năng': '/roadmap',
        
        // Mentorship keywords
        'mentor': '/mentorship',
        'mentorship': '/mentorship', 
        'cố vấn': '/mentorship',
        'chuyên gia': '/mentorship',
        
        // Community keywords
        'community': '/community',
        'cộng đồng': '/community',
        'thảo luận': '/community',
        
        // Jobs keywords
        'job': '/jobs',
        'jobs': '/jobs',
        'việc làm': '/jobs',
        'tuyển dụng': '/jobs',
        'cơ hội': '/jobs',
        
        // Portfolio keywords
        'portfolio': '/portfolio',
        'hồ sơ': '/portfolio',
        'thành tích': '/portfolio',
        
        // Chatbot keywords
        'chatbot': '/chatbot',
        'trợ lý': '/chatbot',
        'ai': '/chatbot',
        'trợ lý ai': '/chatbot',
        
        // Gamification keywords
        'game': '/gamification',
        'games': '/gamification',
        'trò chơi': '/gamification',
        'xếp hạng': '/gamification',
        'huy hiệu': '/gamification',
        
        // Seminar keywords  
        'seminar': '/seminar',
        'hội thảo': '/seminar',
        'sự kiện': '/seminar',
        'event': '/seminar'
      };
      
      // Check if query matches any keyword
      const matchedPath = searchMap[query];
      if (matchedPath) {
        navigate(matchedPath);
        setSearchQuery(''); // Clear search after navigation
        setShowMegaMenu(false); // Close mega menu
        return;
      }
      
      // If no direct match, go to search page
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowMegaMenu(false); // Close mega menu
    }
  };

  const handleLogin = () => {
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const handleProfile = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  const handleUpgrade = () => {
    navigate('/premium');
  };

  const handleWallet = () => {
    navigate('/my-wallet');
  };

  const handleMentor = () => {
    navigate('/mentor');
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
  };

  const openMobileSearch = () => {
    setIsMobileMenuOpen(true);
    // Defer focus until menu renders
    setTimeout(() => {
      mobileSearchInputRef.current?.focus();
    }, 0);
  };

  // Debounced/locked toggle to prevent rapid reflows when tapping repeatedly
  const toggleMobileMenu = () => {
    if (isMobileMenuToggleLocked) return;
    setIsMobileMenuToggleLocked(true);
    setIsMobileMenuOpen(prev => !prev);
    // small lock window is enough to avoid burst taps causing flicker
    setTimeout(() => setIsMobileMenuToggleLocked(false), 250);
  };

  return (
    <header className="header-minimal">
      <div className="header-container">
        {/* Left Section */}
        <div className="main-header-left">
          {/* Logo */}
          <Link to="/" className="header-logo-link">
            <img src={Logo} alt="SkillVerse" className="header-logo-image" />
          </Link>

          {/* Categories Mega Menu */}
          <div ref={megaMenuRef} className="categories-container desktop-only">
            <button 
              className="header-categories-btn"
              onClick={() => setShowMegaMenu(!showMegaMenu)}
            >
              <Grid size={18} />
              <span className="header-categories-text">Danh mục</span>
              <ChevronDown size={16} />
            </button>

            {showMegaMenu && (
              <div className="mega-menu">
                <div className="mega-menu-grid">
                  {categories.map((category) => (
                    <Link
                      key={category.path}
                      to={category.path}
                      className="category-link"
                      onClick={() => setShowMegaMenu(false)}
                    >
                      <category.icon className="category-icon" />
                      <div className="category-content">
                        <h3 className="category-title">{category.name}</h3>
                        <p className="category-description">{category.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="search-form desktop-only">
            <div className="header-search-input-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học, mentor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="header-search-input"
              />
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="header-right">
          {/* Admin Link - Only for ADMIN role */}
          {isAuthenticated && user && user.roles.includes('ADMIN') && (
            <Link to="/admin" className="header-nav-link desktop-only">
              <Shield size={18} />
              <span>Quản Trị</span>
            </Link>
          )}

          {/* Upgrade Button */}
          <button onClick={handleUpgrade} className="header-upgrade-btn desktop-only">
            <Crown size={18} />
            <span className="header-upgrade-text">Nâng cấp</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-btn desktop-only"
            style={{ display: 'none' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Authentication */}
          {isAuthenticated && user ? (
            <div ref={userMenuRef} className="user-profile-group desktop-only">
              <button 
                className="user-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="profile-group-content">
                  <div className="header-user-avatar">
                    <User size={18} />
                  </div>
                  <div className="user-info-inline">
                    <span className="user-greeting">Xin chào, <strong>{user.fullName}</strong></span>
                    <span className="user-balance">
                      💰 Số dư: {loadingBalance ? '...' : walletBalance !== null ? walletBalance.toLocaleString('vi-VN') + ' đ' : 'N/A'}
                    </span>
                  </div>
                  <ChevronDown size={16} className="dropdown-icon" />
                </div>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="header-user-avatar-large">
                      <User size={24} />
                    </div>
                    <div className="user-details">
                      <p className="user-name">{user.fullName}</p>
                      <p className="user-email">{user.email}</p>
                    </div>
                  </div>
                  <hr className="dropdown-divider" />
                  
                  {/* Wallet & Notifications in dropdown */}
                  <button onClick={() => { handleWallet(); setShowUserMenu(false); }} className="dropdown-item">
                    <Wallet size={16} />
                    <span>Ví</span>
                  </button>
                  <button className="dropdown-item">
                    <Bell size={16} />
                    <span>Thông báo</span>
                  </button>
                  
                  <hr className="dropdown-divider" />
                  
                  {(user.roles.includes('MENTOR') || user.roles.includes('ADMIN')) && (
                    <button onClick={handleMentor} className="dropdown-item">
                      <BookOpen size={16} />
                      <span>Giảng Viên</span>
                    </button>
                  )}
                  {user.roles.includes('RECRUITER') && (
                    <button onClick={() => navigate('/business')} className="dropdown-item">
                      <Building2 size={16} />
                      <span>Doanh Nghiệp</span>
                    </button>
                  )}
                  {user.roles.includes('USER') && (
                    <button onClick={() => navigate('/my-applications')} className="dropdown-item">
                      <Briefcase size={16} />
                      <span>Đơn Ứng Tuyển</span>
                    </button>
                  )}
                  <button onClick={handleProfile} className="dropdown-item">
                    <User size={16} />
                    <span>Hồ sơ cá nhân</span>
                  </button>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleLogin} className="header-login-btn desktop-only">
              Đăng nhập
            </button>
          )}

          {/* Mobile quick actions */}
          <button
            className="mobile-icon-btn mobile-only"
            aria-label="Search"
            onClick={openMobileSearch}
          >
            <Search size={18} />
          </button>
          <button
            className="mobile-icon-btn mobile-only"
            aria-label="Upgrade"
            onClick={handleUpgrade}
          >
            <Crown size={18} />
          </button>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn mobile-only"
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="sv-mobile-menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu" id="sv-mobile-menu">
          <div className="mobile-menu-content">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mobile-search">
              <div className="header-search-input-container">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="header-search-input"
                  ref={mobileSearchInputRef}
                />
              </div>
            </form>

            {/* Mobile User Section */}
            {isAuthenticated && user ? (
              <div className="mobile-user-section">
                <div className="mobile-user-info">
                  <div className="user-avatar-large">
                    <User size={32} />
                  </div>
                  <div className="user-details">
                    <p className="user-name">{user.fullName}</p>
                    <p className="user-email">{user.email}</p>
                  </div>
                </div>
                <div className="mobile-user-actions">
                  {(user.roles.includes('MENTOR') || user.roles.includes('ADMIN')) && (
                    <button onClick={handleMentor} className="mobile-menu-item">
                      <BookOpen size={18} />
                      <span>Giảng Viên</span>
                    </button>
                  )}
                  <button onClick={handleProfile} className="mobile-menu-item">
                    <User size={18} />
                    <span>Hồ sơ cá nhân</span>
                  </button>
                  <button onClick={handleLogout} className="mobile-menu-item logout">
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleLogin} className="mobile-login-btn">
                <User size={18} />
                <span>Đăng nhập</span>
              </button>
            )}

            {/* Mobile Categories */}
            <div className="mobile-categories">
              <h3 className="mobile-section-title">Danh mục</h3>
              <div className="mobile-category-grid">
                {categories.map((category) => (
                  <Link
                    key={category.path}
                    to={category.path}
                    className="mobile-category-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <category.icon className="mobile-category-icon" />
                    <div className="mobile-category-content">
                      <span className="mobile-category-title">{category.name}</span>
                      <span className="mobile-category-description">{category.description}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="mobile-actions">
              <button onClick={handleUpgrade} className="mobile-action-btn upgrade">
                <Crown size={18} />
                <span>Nâng cấp</span>
              </button>
              <button onClick={handleWallet} className="mobile-action-btn">
                <Wallet size={18} />
                <span>Ví</span>
              </button>
              <button className="mobile-action-btn">
                <Bell size={18} />
                <span>Thông báo</span>
              </button>
              <button onClick={toggleTheme} className="mobile-action-btn" style={{ display: 'none' }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                <span>Chủ đề</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;