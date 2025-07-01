import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Search,
  Grid,
  GraduationCap,
  MessageCircle,
  Home,
  BarChart3,
  Users,
  Briefcase,
  User,
  Bot,
  Calendar,
  Crown,
  Wallet,
  Trophy
} from 'lucide-react';
import Logo from '../assets/Logo.jpg';
import '../styles/Header.css';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { translations } = useLanguage();

  const mainNavLinks = [
    { path: '/', label: translations.navigation.home, icon: Home },
  ];

  const allCategories = [
    { path: '/dashboard', label: translations.navigation.dashboard, description: translations.navigation.descriptions.dashboard, icon: BarChart3 },
    { path: '/courses', label: translations.navigation.courses, description: translations.navigation.descriptions.courses, icon: GraduationCap },
    { path: '/mentorship', label: translations.navigation.mentorship, description: translations.navigation.descriptions.mentorship, icon: Users },
    { path: '/community', label: translations.navigation.community, description: translations.navigation.descriptions.community, icon: MessageCircle },
    { path: '/jobs', label: translations.navigation.jobs, description: translations.navigation.descriptions.jobs, icon: Briefcase },
    { path: '/portfolio', label: translations.navigation.portfolio, description: translations.navigation.descriptions.portfolio, icon: User },
    { path: '/chatbot', label: translations.navigation.chatbot, description: translations.navigation.descriptions.chatbot, icon: Bot },
    { path: '/gamification', label: translations.navigation.gamification, description: translations.navigation.descriptions.gamification, icon: Trophy },
    { path: '/seminar', label: translations.navigation.seminar, description: translations.navigation.descriptions.seminar, icon: Calendar },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCategoryOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.header-content') && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogin = () => {
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const handlePremium = () => {
    navigate('/premium');
    setIsMobileMenuOpen(false);
  };

  const handleWallet = () => {
    navigate('/wallet');
    setIsMobileMenuOpen(false);
  };

  const handleMobileNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`header ${theme} ${isScrolled ? 'header--scrolled' : ''}`}>
      <div className="header-container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo-container">
            <div className="logo-wrapper">
              <img src={Logo} alt="SkillVerse Logo" className="logo-image" />
            </div>
            <span className="logo-title">SkillVerse</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            {mainNavLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-link__text">{link.label}</span>
                {location.pathname === link.path && (
                  <span className="nav-link__indicator" />
                )}
              </NavLink>
            ))}
            
            {/* Category Button */}
            <button 
              className="nav-link category-button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            >
              <span className="nav-link__text">
                <Grid className="w-4 h-4 mr-1" />
                Danh Mục
                <ChevronDown className="w-4 h-4 ml-1" />
              </span>
            </button>

            {/* Premium Button - Next to Category */}
            <button 
              onClick={handlePremium} 
              className="premium-btn"
              aria-label="Premium - Nâng cấp"
              title="Premium - Nâng cấp"
            >
              <Crown className="premium-icon" />
              <span className="premium-text">Nâng cấp</span>
            </button>

            {/* Wallet Button - Next to Premium */}
            <button 
              onClick={handleWallet} 
              className="wallet-btn"
              aria-label="Ví SkillCoin"
              title="Ví SkillCoin"
            >
              <Wallet className="wallet-icon" />
              <span className="wallet-text">Ví</span>
            </button>

            {/* Category Dropdown */}
            {isCategoryOpen && (
              <div className="category-dropdown">
                <div className="category-grid">
                  {allCategories.map((category) => (
                    <Link
                      key={category.path}
                      to={category.path}
                      className="category-item"
                      onClick={() => setIsCategoryOpen(false)}
                    >
                      <category.icon className="category-item__icon" />
                      <div className="category-item__content">
                        <h3 className="category-item__title">{category.label}</h3>
                        <p className="category-item__description">{category.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* User Actions */}
          <div className="user-actions">
            {/* Search Button - Hidden on mobile */}
            {/* <button
              className="action-button search-button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="action-icon" />
            </button> */}

            {/* Notifications */}
            <button
              className="action-button search-button"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label="Notifications"
            >
              <Bell className="action-icon" />
            </button>

            {/* Theme Toggle */}
            <button
              className="action-button theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="action-icon sun" />
              ) : (
                <Moon className="action-icon moon" />
              )}
            </button>

            {/* Language Switcher - Hidden on mobile */}
            <div className="language-switcher-wrapper">
              <LanguageSwitcher />
            </div>

            {/* Login Button - Hidden on mobile */}
            <button onClick={handleLogin} className="login-btn desktop-only">
              {translations.auth.login}
            </button>

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="action-icon" />
              ) : (
                <Menu className="action-icon" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay">
            <nav className="mobile-nav">
              {/* Mobile Header */}
              <div className="mobile-nav-header">
                <h3 className="mobile-nav-title">Menu</h3>
                <button
                  className="mobile-nav-close"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="action-icon" />
                </button>
              </div>

              {/* Main Navigation Links */}
              <div className="mobile-nav-section">
                <h4 className="mobile-nav-section-title">Điều hướng chính</h4>
                {mainNavLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => handleMobileNavClick(link.path)}
                    className={`mobile-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                  >
                    <link.icon className="mobile-nav-link__icon" />
                    <span>{link.label}</span>
                    {location.pathname === link.path && (
                      <span className="mobile-nav-link__indicator" />
                    )}
                  </button>
                ))}
              </div>

              {/* All Categories */}
              <div className="mobile-nav-section">
                <h4 className="mobile-nav-section-title">Tất cả danh mục</h4>
                <div className="mobile-categories-grid">
                  {allCategories.map((category) => (
                    <button
                      key={category.path}
                      onClick={() => handleMobileNavClick(category.path)}
                      className={`mobile-category-item ${location.pathname === category.path ? 'active' : ''}`}
                    >
                      <category.icon className="mobile-category-item__icon" />
                      <div className="mobile-category-item__content">
                        <span className="mobile-category-item__title">{category.label}</span>
                        <span className="mobile-category-item__description">{category.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="mobile-nav-actions">
                <button
                  onClick={() => {
                    setIsSearchOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="mobile-action-btn"
                >
                  <Search className="mobile-action-btn__icon" />
                  <span>Tìm kiếm</span>
                </button>

                <div className="mobile-language-switcher">
                  <LanguageSwitcher />
                </div>

                <button 
                  onClick={handlePremium} 
                  className="mobile-premium-btn"
                  aria-label="Premium"
                  title="Premium"
                >
                  <Crown className="mobile-premium-icon" />
                </button>

                <button 
                  onClick={handleWallet} 
                  className="mobile-wallet-btn"
                  aria-label="Ví SkillCoin"
                  title="Ví SkillCoin"
                >
                  <Wallet className="mobile-wallet-icon" />
                </button>

                <button onClick={handleLogin} className="mobile-login-btn">
                  <User className="mobile-login-btn__icon" />
                  <span>{translations.auth.login}</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="search-modal">
          <div className="search-container">
            <div className="search-header">
              <Search className="action-icon" />
              <input
                type="text"
                placeholder={translations.common.search}
                className="search-input"
                autoFocus
              />
              <button
                className="search-close"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="action-icon" />
              </button>
            </div>
            
            <div className="search-content">
              {/* Empty State */}
              <div className="search-empty">
                <Search className="search-empty-icon" />
                <h3 className="search-empty-text">{translations.common.search}</h3>
                <p className="search-empty-description">
                  {translations.common.searchDescription}
                </p>
              </div>

              {/* Search Results - Initially Hidden */}
              <div className="search-results" style={{ display: 'none' }}>
                {/* Example Result Items */}
                <div className="search-result-item">
                  <div className="search-result-icon">
                    <GraduationCap />
                  </div>
                  <div className="search-result-content">
                    <h4 className="search-result-title">React.js Advanced Course</h4>
                    <p className="search-result-description">
                      Master advanced React concepts and patterns
                    </p>
                    <div className="search-result-meta">
                      <span>Course • 12 hours</span>
                      <span>4.9 ★</span>
                    </div>
                  </div>
                </div>

                <div className="search-result-item">
                  <div className="search-result-icon">
                    <MessageCircle />
                  </div>
                  <div className="search-result-content">
                    <h4 className="search-result-title">TypeScript Best Practices</h4>
                    <p className="search-result-description">
                      Discussion about TypeScript patterns and practices
                    </p>
                    <div className="search-result-meta">
                      <span>Discussion • 2 days ago</span>
                      <span>24 replies</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div className="notification-modal">
          <div className="notification-container">
            <div className="notification-header">
              <h2 className="notification-title">
                {translations.notifications.title}
              </h2>
              <button
                className="notification-close"
                onClick={() => setIsNotificationsOpen(false)}
              >
                <X className="action-icon" />
              </button>
            </div>
            <div className="notification-content">
              <div className="notification-empty">
                <Bell className="notification-empty-icon" />
                <p>Không có thông báo mới</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;