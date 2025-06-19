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
  MessageCircle
} from 'lucide-react';
import Logo from '../assets/Logo.jpg';
import '../styles/Header.css';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface NavLinkClassProps {
  isActive: boolean;
}

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { translations } = useLanguage();

  const mainNavLinks = [
    { path: '/', label: translations.navigation.home },
    { path: '/dashboard', label: translations.navigation.dashboard },
    { path: '/community', label: translations.navigation.community },
  ];

  const allCategories = [
    { path: '/dashboard', label: translations.navigation.dashboard, description: translations.navigation.descriptions.dashboard },
    { path: '/courses', label: translations.navigation.courses, description: translations.navigation.descriptions.courses },
    { path: '/mentorship', label: translations.navigation.mentorship, description: translations.navigation.descriptions.mentorship },
    { path: '/community', label: translations.navigation.community, description: translations.navigation.descriptions.community },
    { path: '/jobs', label: translations.navigation.jobs, description: translations.navigation.descriptions.jobs },
    { path: '/portfolio', label: translations.navigation.portfolio, description: translations.navigation.descriptions.portfolio },
    { path: '/chatbot', label: translations.navigation.chatbot, description: translations.navigation.descriptions.chatbot },
    { path: '/seminar', label: translations.navigation.seminar, description: translations.navigation.descriptions.seminar },
  ];


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    navigate('/login');
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
                Danh Mục
                <ChevronDown className="w-4 h-4 ml-1" />
              </span>
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
                      <h3 className="category-item__title">{category.label}</h3>
                      <p className="category-item__description">{category.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* User Actions */}
          <div className="user-actions">
            <button
              className="action-button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="action-icon" />
            </button>

            <button
              className="action-button notification-btn"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label="Notifications"
            >
              <Bell className="action-icon" />
              <span className="notification-badge">3</span>
            </button>

            <button
              className="action-button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="action-icon sun" />
              ) : (
                <Moon className="action-icon moon" />
              )}
            </button>

            <LanguageSwitcher />

            {/* Login Button */}
            <button onClick={handleLogin} className="login-btn">
              {translations.auth.login}
            </button>

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="action-icon" />
              ) : (
                <Menu className="action-icon" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="mobile-nav">
            {mainNavLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
                {location.pathname === link.path && (
                  <span className="mobile-nav-link__indicator" />
                )}
              </NavLink>
            ))}
            <div className="mobile-categories">
              <h3 className="mobile-categories__title">All Categories</h3>
              {allCategories.map((category) => (
                <Link
                  key={category.path}
                  to={category.path}
                  className="mobile-nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.label}
                </Link>
              ))}
            </div>
            <button onClick={handleLogin} className="mobile-login-btn">
              {translations.auth.login}
            </button>
          </nav>
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
            <div className="p-4">
              {/* Add notifications here */}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;