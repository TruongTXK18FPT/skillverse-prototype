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
  Grid
} from 'lucide-react';
import Logo from '../assets/Logo.jpg';
import '../styles/Header.css';
import { useTheme } from '../context/ThemeContext';

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

  const mainNavLinks = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/community', label: 'Community' },
  ];

  const allCategories = [
    { path: '/dashboard', label: 'Dashboard', description: 'Track your learning progress' },
    { path: '/courses', label: 'Courses', description: 'Browse available courses' },
    { path: '/mentorship', label: 'Mentorship', description: 'Connect with mentors' },
    { path: '/community', label: 'Community', description: 'Join the discussion' },
    { path: '/jobs', label: 'Jobs', description: 'Find work opportunities' },
    { path: '/portfolio', label: 'Portfolio', description: 'Showcase your work' },
    { path: '/chatbot', label: 'AI Advisor', description: 'Get personalized guidance' }
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
                Categories
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
            >
              <Search className="action-icon" />
            </button>

            <button
              className="action-button notification-btn"
              onClick={() => setIsNotificationsOpen(true)}
            >
              <Bell className="action-icon" />
              <span className="notification-badge">3</span>
            </button>

            <button
              className="action-button"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="action-icon sun" />
              ) : (
                <Moon className="action-icon" />
              )}
            </button>


            {/* Login Button */}
            <button onClick={handleLogin} className="login-btn">
              Login
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
              Login
            </button>
          </nav>
        )}
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="max-w-2xl mx-auto mt-20 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl">
              <div className="p-4 flex items-center gap-4 border-b dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  autoFocus
                />
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                {/* Add search results here */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="max-w-md mx-auto mt-20 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl">
              <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Notifications
                </h2>
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={() => setIsNotificationsOpen(false)}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                {/* Add notifications here */}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;