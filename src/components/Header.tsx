import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
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
  Building2,
  Compass,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import walletService from '../services/walletService';
import userService from '../services/userService';
import { premiumService } from '../services/premiumService';
import { UserProfileResponse } from '../data/userDTOs';
import { UserSubscriptionResponse } from '../data/premiumDTOs';
import Logo from '../assets/skillverse.png';
import silverFrame from '../assets/premium/silver_avatar.png';
import goldenFrame from '../assets/premium/golden_avatar.png';
import diamondFrame from '../assets/premium/diamond_avatar.png';
import '../styles/Header.css';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuToggleLocked, setIsMobileMenuToggleLocked] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const quickNavRef = useRef<HTMLDivElement>(null);

  // Quick navigation items
  const quickNavItems = [
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

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getMyProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadWalletBalance = async () => {
    if (!user) return;
    
    setLoadingBalance(true);
    try {
      const wallet = await walletService.getMyWallet();
      setWalletBalance(wallet.cashBalance);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      setWalletBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const sub = await premiumService.getCurrentSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const getAvatarFrame = () => {
    if (!subscription || !subscription.isActive) return null;
    
    const planType = subscription.plan.planType;
    switch (planType) {
      case 'STUDENT_PACK':
        return silverFrame;
      case 'PREMIUM_BASIC':
        return goldenFrame;
      case 'PREMIUM_PLUS':
        return diamondFrame;
      default:
        return null;
    }
  };

  const getPremiumColor = () => {
    if (!subscription || !subscription.isActive) return null;
    
    const planType = subscription.plan.planType;
    switch (planType) {
      case 'STUDENT_PACK':
        return '#c0c0c0'; // Silver
      case 'PREMIUM_BASIC':
        return '#ffd700'; // Gold
      case 'PREMIUM_PLUS':
        return '#b9f2ff'; // Diamond
      default:
        return null;
    }
  };

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '255, 255, 255';
  };

  // Fetch wallet balance, profile and subscription when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWalletBalance();
      loadUserProfile();
      loadSubscription();
    }
  }, [isAuthenticated, user]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (quickNavRef.current && !quickNavRef.current.contains(event.target as Node)) {
        setShowQuickNav(false);
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

  const handleExplore = () => {
    navigate('/explore');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuToggleLocked) return;
    setIsMobileMenuToggleLocked(true);
    setIsMobileMenuOpen(prev => !prev);
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

          {/* Explore Button */}
          <Link to="/explore" className="header-nav-btn explore-btn desktop-only">
            <Compass size={18} />
            <span>Khám Phá</span>
          </Link>

          {/* Quick Navigation Menu */}
          <div ref={quickNavRef} className="categories-container desktop-only">
            <button
              className="header-nav-btn quick-nav-btn"
              onClick={() => setShowQuickNav(!showQuickNav)}
            >
              <Zap size={18} />
              <span className="header-categories-text">Dịch Chuyển</span>
              <ChevronDown size={16} />
            </button>

            {showQuickNav && (
              <div className="mega-menu">
                <div className="mega-menu-grid">
                  {quickNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="category-link"
                      onClick={() => setShowQuickNav(false)}
                    >
                      <item.icon className="category-icon" />
                      <div className="category-content">
                        <h3 className="category-title">{item.name}</h3>
                        <p className="category-description">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
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
            <div ref={userMenuRef} className="user-profile-group desktop-only" style={{
              background: getPremiumColor() ? `linear-gradient(135deg, rgba(${hexToRgb(getPremiumColor()!)}, 0.1), rgba(${hexToRgb(getPremiumColor()!)}, 0.05))` : undefined,
              border: getPremiumColor() ? `1px solid ${getPremiumColor()}` : undefined,
              boxShadow: getPremiumColor() ? `0 0 20px rgba(${hexToRgb(getPremiumColor()!)}, 0.3)` : undefined
            }}>
              <button
                className="user-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="profile-group-content">
                  <div className="header-user-avatar" style={{
                    border: getPremiumColor() ? `3px solid ${getPremiumColor()}` : '2px solid rgba(255,255,255,0.2)',
                    boxShadow: getPremiumColor() ? `0 0 15px ${getPremiumColor()}` : undefined
                  }}>
                    {userProfile?.avatarMediaUrl ? (
                      <img src={userProfile.avatarMediaUrl} alt="Avatar" className="header-avatar-img" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div className="user-info-inline">
                    <span className="user-greeting">
                      Xin chào, <strong style={{ color: getPremiumColor() || undefined }}>{user.fullName}</strong>
                    </span>
                    <span className="user-balance" style={{ color: getPremiumColor() || undefined }}>
                      💰 Số dư: {loadingBalance ? '...' : (walletBalance !== null && walletBalance !== undefined) ? walletBalance.toLocaleString('vi-VN') + ' đ' : 'N/A'}
                    </span>
                  </div>
                  <ChevronDown size={16} className="dropdown-icon" />
                </div>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="header-user-avatar-large" style={{
                      border: getPremiumColor() ? `3px solid ${getPremiumColor()}` : '2px solid rgba(255,255,255,0.2)',
                      boxShadow: getPremiumColor() ? `0 0 20px ${getPremiumColor()}` : undefined
                    }}>
                      {userProfile?.avatarMediaUrl ? (
                        <img src={userProfile.avatarMediaUrl} alt="Avatar" className="header-avatar-img-large" />
                      ) : (
                        <User size={24} />
                      )}
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

            {/* Mobile Explore Button */}
            <div className="mobile-explore-section">
              <button className="mobile-explore-btn" onClick={handleExplore}>
                <Compass size={24} />
                <span>Khám Phá Bản Đồ Vũ Trụ</span>
              </button>
            </div>

            {/* Mobile Quick Navigation */}
            <div className="mobile-categories">
              <h3 className="mobile-section-title">Dịch Chuyển Nhanh</h3>
              <div className="mobile-category-grid">
                {quickNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="mobile-category-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="mobile-category-icon" />
                    <div className="mobile-category-content">
                      <span className="mobile-category-title">{item.name}</span>
                      <span className="mobile-category-description">{item.description}</span>
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