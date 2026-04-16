import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
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
  Zap,
  HelpCircle,
  ShoppingBag,
  AlertTriangle,
  Target,
  Search,
  Sparkles,
  ArrowRight,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import walletService from "../../services/walletService";
import userService from "../../services/userService";
import businessService from "../../services/businessService";
import { premiumService } from "../../services/premiumService";
import { notificationService } from "../../services/notificationService";
import {
  getMyMentorProfile,
  MentorProfile,
} from "../../services/mentorProfileService";
import {
  BusinessProfileResponse,
  UserProfileResponse,
} from "../../data/userDTOs";
import { UserSubscriptionResponse } from "../../data/premiumDTOs";
import NotificationDropdown from "./NotificationDropdown";
import LoginRequiredModal from "../auth/LoginRequiredModal";
import Logo from "../../assets/brand/skillverse.png";
import LogoNoel from "../../assets/brand/logoNoel.png";
import LogoTet from "../../assets/brand/logo-tet.png";
import { resolveRecruitmentAssetUrl } from "../../utils/recruitmentUi";
import "../../styles/Header.css";

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuToggleLocked, setIsMobileMenuToggleLocked] =
    useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(
    null,
  );
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfileResponse | null>(null);
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(
    null,
  );
  const [subscription, setSubscription] =
    useState<UserSubscriptionResponse | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredFeature, setLoginRequiredFeature] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const quickNavRef = useRef<HTMLDivElement>(null);

  const getLogo = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Logo Tết từ tháng 1 đến tháng 3 năm 2026
    if (currentYear === 2026 && currentMonth >= 1 && currentMonth <= 3) {
      return LogoTet;
    }

    // Logo Noel tháng 12
    if (currentMonth === 12) {
      return LogoNoel;
    }

    // Logo mặc định
    return Logo;
  };

  const isNoel = new Date().getMonth() + 1 === 12;
  const isTet = (() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    return currentYear === 2026 && currentMonth >= 1 && currentMonth <= 3;
  })();

  // Quick navigation items
  const quickNavItems = [
    {
      name: "Bảng Điều Khiển",
      description: "Theo dõi tiến độ học tập và thành tích của bạn",
      path: "/dashboard",
      icon: BarChart3,
      hideForRoles: ["MENTOR"],
    },
    {
      name: "Khóa Học",
      description: "Khám phá các khóa học chất lượng cao",
      path: "/courses",
      icon: GraduationCap,
      hideForRoles: ["RECRUITER"],
    },
    {
      name: "Lộ Trình Học Tập",
      description: "Khám phá lộ trình học tập và phát triển kỹ năng",
      path: "/roadmap",
      icon: Map,
      hideForRoles: ["RECRUITER"],
    },
    {
      name: "Kế Hoạch AI",
      description: "Quản lý và tiếp tục kế hoạch học tập cá nhân",
      path: "/study-planner",
      icon: Calendar,
      hideForRoles: ["RECRUITER"],
    },
    {
      name: "Cố Vấn",
      description: "Kết nối với chuyên gia trong ngành",
      path: "/mentorship",
      icon: Users,
      hideForRoles: ["MENTOR", "RECRUITER"],
    },
    {
      name: "Cộng Đồng",
      description: "Tham gia cộng đồng học tập sôi động",
      path: "/community",
      icon: MessageSquare,
    },
    {
      name: "Việc Làm",
      description: "Tìm kiếm cơ hội việc làm phù hợp",
      path: "/jobs",
      icon: Briefcase,
      hideForRoles: ["MENTOR"],
    },
    {
      name: "Hồ Sơ",
      description: "Quản lý và chia sẻ thành tích của bạn",
      path: "/portfolio",
      icon: User,
      hideForRoles: ["RECRUITER"],
    },
    {
      name: "Trợ Lý AI",
      description: "Nhận hỗ trợ từ trợ lý AI thông minh",
      path: "/chatbot",
      icon: Bot,
      hideForRoles: ["MENTOR"],
    },
    {
      name: "Trò Chơi",
      description: "Bảng xếp hạng, huy hiệu và mini-games",
      path: "/gamification",
      icon: Trophy,
      hideForRoles: ["MENTOR", "RECRUITER"],
    },
    // {
    //   name: 'Hướng Dẫn',
    //   description: 'Hướng dẫn sử dụng chi tiết cho mọi vai trò',
    //   path: '/user-guide',
    //   icon: BookOpen
    // },
    // {
    //   name: "Hội Thảo",
    //   description: "Tham gia các hội thảo và sự kiện",
    //   path: "/seminar",
    //   icon: Calendar,
    // },
    {
      name: "Meowl Shop",
      description: "Cửa hàng Skin Neon Tech độc quyền",
      path: "/meowl-shop",
      icon: ShoppingBag,
      hideForRoles: ["MENTOR", "RECRUITER"],
    },
    // {
    //   name: 'Cầu Nguyện',
    //   description: 'Đôi khi chỉ cần có niềm tin là đủ',
    //   path: '/pray',
    //   icon: BadgeQuestionMark
    // }
  ];

  const studentOnlyQuickNavPaths = new Set([
    "/dashboard",
    "/roadmap",
    "/study-planner",
    "/chatbot",
    "/portfolio",
    "/meowl-shop",
  ]);

  const guestShowcaseQuickNavPaths = new Set([
    "/roadmap",
    "/chatbot",
    "/meowl-shop",
  ]);

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await userService.getMyProfile();
      setUserProfile(profile);

      if (user?.roles.includes("RECRUITER")) {
        try {
          const recruiterProfile = await businessService.getMyBusinessProfile();
          setBusinessProfile(recruiterProfile);
        } catch (e) {
          console.error("Failed to load business profile", e);
          setBusinessProfile(null);
        }
      } else {
        setBusinessProfile(null);
      }

      if (user?.roles.includes("MENTOR")) {
        try {
          const mProfile = await getMyMentorProfile();
          setMentorProfile(mProfile);
        } catch (e) {
          console.error("Failed to load mentor profile", e);
        }
      } else {
        setMentorProfile(null);
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  }, [user]);

  const loadWalletBalance = useCallback(async () => {
    if (!user) return;

    setLoadingBalance(true);
    try {
      const wallet = await walletService.getMyWallet();
      setWalletBalance(wallet.cashBalance);
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
      setWalletBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  }, [user]);

  const loadSubscription = useCallback(async () => {
    try {
      const sub = await premiumService.getCurrentSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Failed to load subscription:", error);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  }, []);

  const getPremiumColor = () => {
    if (!subscription || !subscription.isActive) return null;

    const planType = subscription.plan.planType;
    switch (planType) {
      case "STUDENT_PACK":
        return "#c0c0c0"; // Silver
      case "PREMIUM_BASIC":
        return "#ffd700"; // Gold
      case "PREMIUM_PLUS":
        return "#b9f2ff"; // Diamond
      default:
        return null;
    }
  };

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : "255, 255, 255";
  };

  // Fetch wallet balance, profile and subscription when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWalletBalance();
      loadUserProfile();
      loadSubscription();
      loadUnreadCount();

      const interval = setInterval(loadUnreadCount, 60000);

      // Listen for wallet balance updates
      const handleWalletUpdate = () => {
        loadWalletBalance();
      };

      // Listen for notification read events
      const handleNotificationRead = (event: any) => {
        if (event.detail && typeof event.detail.unreadCount === "number") {
          setUnreadCount(event.detail.unreadCount);
        }
      };

      window.addEventListener("wallet:updated", handleWalletUpdate);
      window.addEventListener("notification:read", handleNotificationRead);

      return () => {
        clearInterval(interval);
        window.removeEventListener("wallet:updated", handleWalletUpdate);
        window.removeEventListener("notification:read", handleNotificationRead);
      };
    }
  }, [
    isAuthenticated,
    user,
    loadWalletBalance,
    loadUserProfile,
    loadSubscription,
    loadUnreadCount,
  ]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        quickNavRef.current &&
        !quickNavRef.current.contains(event.target as Node)
      ) {
        setShowQuickNav(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setShowUserMenu(false);
    setShowQuickNav(false);
    setIsMobileMenuOpen(false);

    // Move away from dashboard first so auth teardown cannot flash dashboard fallback UI.
    navigate("/", { replace: true });

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogin = () => {
    navigate("/login");
    setIsMobileMenuOpen(false);
  };

  const handleProfile = () => {
    navigate("/profile");
    setShowUserMenu(false);
  };

  const handleUpgrade = () => {
    const roles = (user?.roles || []).map((role) => role.toUpperCase());
    const hasAdminBypass =
      roles.includes("ADMIN") || roles.some((role) => role.endsWith("_ADMIN"));

    if (roles.includes("MENTOR") && !hasAdminBypass) {
      navigate("/mentor");
      return;
    }

    navigate("/premium");
  };

  const handleWallet = () => {
    navigate("/my-wallet");
  };

  const handleMentor = () => {
    navigate("/mentor");
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuToggleLocked) return;
    setIsMobileMenuToggleLocked(true);
    setIsMobileMenuOpen((prev) => !prev);
    setTimeout(() => setIsMobileMenuToggleLocked(false), 250);
  };

  // Root roles take priority over sub-admin roles (*_ADMIN)
  // Priority: ADMIN > RECRUITER > MENTOR > *_ADMIN > USER
  const isRootAdminRole = !!user && user.roles.includes("ADMIN");
  const isSubAdminRole =
    !!user &&
    !isRootAdminRole &&
    user.roles.some((role) => role.endsWith("_ADMIN"));
  const isMentorRole = !!user && user.roles.includes("MENTOR");
  const isRecruiterRole = !!user && user.roles.includes("RECRUITER");
  const hasLearnerRole =
    !!user && (user.roles.includes("USER") || user.roles.includes("LEARNER"));
  const canManageBookings = isMentorRole || hasLearnerRole;
  const isStudentRole =
    !!user &&
    user.roles.includes("USER") &&
    !isMentorRole &&
    !isRecruiterRole &&
    !isRootAdminRole &&
    !isSubAdminRole;
  const shouldShowManagementNav =
    isAuthenticated &&
    !!user &&
    (isRootAdminRole || isRecruiterRole || isSubAdminRole);

  const profileMenuLabel = isRecruiterRole
    ? "Hồ sơ doanh nghiệp"
    : isMentorRole
      ? "Hồ sơ giảng viên"
      : "Hồ sơ cá nhân";

  const recruiterCompanyLogoUrl = isRecruiterRole
    ? resolveRecruitmentAssetUrl(businessProfile?.companyLogoUrl)
    : undefined;

  const resolvedHeaderAvatar =
    recruiterCompanyLogoUrl ||
    resolveRecruitmentAssetUrl(
      user?.avatarMediaUrl ||
        mentorProfile?.avatar ||
        userProfile?.avatarMediaUrl ||
        user?.avatarUrl,
    );

  const modalProtectedPaths = new Set([
    "/mentorship",
    "/portfolio",
    "/chatbot",
    "/study-planner",
    "/roadmap",
    "/meowl-shop",
  ]);

  const handleQuickNavLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    name: string,
    path: string,
    closeMobileMenu = false,
  ) => {
    if (modalProtectedPaths.has(path) && !isAuthenticated) {
      event.preventDefault();
      setLoginRequiredFeature(name);
      setShowLoginModal(true);
      setShowQuickNav(false);
      if (closeMobileMenu) {
        setIsMobileMenuOpen(false);
      }
      return;
    }

    setShowQuickNav(false);
    if (closeMobileMenu) {
      setIsMobileMenuOpen(false);
    }
  };

  // Build management nav: root ADMIN and RECRUITER get their own dedicated pages
  // Sub-admin roles get the admin page
  const managementNav = isRootAdminRole
    ? { to: "/admin", label: "Quản lý Quản Trị", icon: Shield }
    : isRecruiterRole
      ? { to: "/business", label: "Quản lý Doanh Nghiệp", icon: Building2 }
      : isSubAdminRole
        ? { to: "/admin", label: "Quản lý Quản Trị", icon: Shield }
        : null;

  return (
    <>
      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Yêu cầu đăng nhập"
        message="Bạn cần đăng nhập để sử dụng tính năng này"
        feature={loginRequiredFeature}
      />

      <header className="header-minimal">
        <div className="header-container">
          {/* Left Section */}
          <div className="main-header-left">
            {/* Logo */}
            <Link to="/" className="header-logo-link">
              <img
                src={getLogo()}
                alt="SkillVerse"
                className={`header-logo-image ${isNoel ? "noel-logo" : ""} ${isTet ? "tet-logo" : ""}`}
              />
            </Link>

            {/* Always show management nav if user has admin/recruiter/sub-admin role */}
            {shouldShowManagementNav && managementNav ? (
              <div className="sv-nav-btn-wrapper">
                <Link
                  to={managementNav.to}
                  className="header-nav-btn explore-btn desktop-only sv-nav-explore"
                >
                  <managementNav.icon size={18} />
                  <div className="sv-nav-btn-content">
                    <span className="sv-nav-label">{managementNav.label}</span>
                    <span className="sv-nav-subtext">trang quản lý</span>
                  </div>
                </Link>
              </div>
            ) : null}

            {/* USER role features — always show alongside management nav if user also has USER role */}
            {/* Mentor button for MENTOR role, otherwise Explore Button */}
            {!shouldShowManagementNav && (
              <div className="sv-nav-btn-wrapper">
                {isMentorRole ? (
                  <Link
                    to="/mentor"
                    className="header-nav-btn explore-btn desktop-only sv-nav-explore"
                    title="Quản lý giảng viên"
                  >
                    <BookOpen size={18} />
                    <div className="sv-nav-btn-content">
                      <span className="sv-nav-label">Quản lý Giảng Viên</span>
                      <span className="sv-nav-subtext">trang quản lý</span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to="/explore"
                    className="header-nav-btn explore-btn desktop-only sv-nav-explore"
                    title="Khám phá vũ trụ SkillVerse - Tìm hiểu các khu vực và bắt đầu hành trình"
                  >
                    <Compass size={18} />
                    <div className="sv-nav-btn-content">
                      <span className="sv-nav-label">Khám Phá</span>
                      <span className="sv-nav-subtext">bắt đầu từ đây</span>
                    </div>
                  </Link>
                )}
                <div className="sv-nav-tooltip">
                  <Sparkles size={14} />
                  <span>
                    {isMentorRole
                      ? "Quản lý khóa học, hồ sơ và cộng đồng"
                      : "Khám phá bản đồ vũ trụ & tìm hiểu hệ thống"}
                  </span>
                </div>
              </div>
            )}

            {/* Quick Navigation Menu — always visible to everyone */}
            <div
              ref={quickNavRef}
              className="categories-container desktop-only"
            >
              <div className="sv-nav-btn-wrapper">
                <button
                  className="header-nav-btn quick-nav-btn sv-nav-teleport"
                  onClick={() => setShowQuickNav(!showQuickNav)}
                  title="Dịch chuyển nhanh đến các tính năng"
                >
                  <Zap size={18} className="sv-teleport-icon" />
                  <div className="sv-nav-btn-content">
                    <span className="sv-nav-label">Dịch Chuyển</span>
                    <span className="sv-nav-subtext">các tính năng chính</span>
                  </div>
                  <ChevronDown size={16} />
                </button>
                <div className="sv-nav-tooltip">
                  <Zap size={14} />
                  <span>Truy cập nhanh các tính năng chính</span>
                </div>
              </div>

              {showQuickNav && (
                <div className="sv-mega-menu">
                  {/* Smart Suggestion Line - Only for users with learner role (USER/LEARNER), not MENTOR/RECRUITER/ADMIN */}
                  {hasLearnerRole &&
                    !user?.roles.includes("MENTOR") &&
                    !user?.roles.includes("RECRUITER") &&
                    !user?.roles.includes("ADMIN") && (
                      <div className="sv-mega-suggestion">
                        <Sparkles size={18} className="sv-suggestion-icon" />
                        <span className="sv-suggestion-text">
                          {localStorage.getItem("onboarded") === "true"
                            ? "Tiếp tục lộ trình học của bạn"
                            : "Bắt đầu lộ trình học đầu tiên"}
                        </span>
                        <Link
                          to="/journey"
                          className="sv-suggestion-cta"
                          onClick={() => setShowQuickNav(false)}
                        >
                          <span>Đi ngay</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    )}

                  {/* Group 1: Primary Actions */}
                  {(() => {
                    const mentorPrimaryItems = [
                      {
                        name: "Khóa Học",
                        description: "Quản lý nội dung khóa học của bạn",
                        path: "/courses",
                        icon: GraduationCap,
                        requireAuth: true,
                      },
                      {
                        name: "Cộng Đồng",
                        description: "Tương tác cùng cộng đồng học tập",
                        path: "/community",
                        icon: MessageSquare,
                        requireAuth: true,
                      },
                      {
                        name: "Cố Vấn",
                        description: "Quản lý hồ sơ cố vấn của bạn",
                        path: "/mentorship",
                        icon: Users,
                        requireAuth: true,
                      },
                      {
                        name: "Hồ Sơ",
                        description: "Quản lý hồ sơ giảng viên của bạn",
                        path: "/profile/mentor",
                        icon: User,
                        requireAuth: true,
                      },
                    ];

                    const userPrimaryItems = [
                      {
                        name: "Bảng Điều Khiển",
                        description: "Theo dõi tiến độ học tập và thành tích",
                        path: "/dashboard",
                        icon: BarChart3,
                        requireAuth: true,
                      },
                      {
                        name: "Lộ Trình Học Tập",
                        description: "Lộ trình học tập và phát triển kỹ năng",
                        path: "/roadmap",
                        icon: Map,
                        requireAuth: true,
                      },
                      {
                        name: "Trợ Lý AI",
                        description: "Nhận hỗ trợ từ trợ lý AI thông minh",
                        path: "/chatbot",
                        icon: Bot,
                        requireAuth: true,
                      },
                      {
                        name: "Kế Hoạch AI",
                        description:
                          "Quản lý và tiếp tục kế hoạch học tập cá nhân",
                        path: "/study-planner",
                        icon: Calendar,
                        requireAuth: true,
                      },
                    ];

                    // Only show MENTOR items if user has MENTOR role
                    // Only show USER items if user has USER role
                    const mentorSection = isMentorRole ? (
                      <div className="sv-mega-section">
                        <h4 className="sv-mega-section-title">
                          <Target size={14} className="sv-section-icon" />
                          <span>Hành động chính</span>
                        </h4>
                        <div className="sv-mega-grid sv-mega-grid--primary">
                          {mentorPrimaryItems.map((item) =>
                            item.requireAuth && !isAuthenticated ? (
                              <div
                                key={item.path + item.name}
                                className="sv-mega-link sv-mega-link--primary"
                                style={{ cursor: "pointer" }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setLoginRequiredFeature(item.name);
                                  setShowLoginModal(true);
                                  setShowQuickNav(false);
                                }}
                              >
                                <item.icon className="sv-mega-link-icon" />
                                <div className="sv-mega-link-content">
                                  <h3 className="sv-mega-link-title">
                                    {item.name}
                                  </h3>
                                  <p className="sv-mega-link-desc">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <Link
                                key={item.path + item.name}
                                to={item.path}
                                className="sv-mega-link sv-mega-link--primary"
                                onClick={() => setShowQuickNav(false)}
                              >
                                <item.icon className="sv-mega-link-icon" />
                                <div className="sv-mega-link-content">
                                  <h3 className="sv-mega-link-title">
                                    {item.name}
                                  </h3>
                                  <p className="sv-mega-link-desc">
                                    {item.description}
                                  </p>
                                </div>
                              </Link>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null;

                    // Student-only primary actions.
                    const userSection = isStudentRole ? (
                        <div className="sv-mega-section">
                          <h4 className="sv-mega-section-title">
                            <Target size={14} className="sv-section-icon" />
                            <span>Hành động chính</span>
                          </h4>
                          <div className="sv-mega-grid sv-mega-grid--primary">
                            {userPrimaryItems.map((item) =>
                              item.requireAuth && !isAuthenticated ? (
                                <div
                                  key={item.path + item.name}
                                  className="sv-mega-link sv-mega-link--primary"
                                  style={{ cursor: "pointer" }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setLoginRequiredFeature(item.name);
                                    setShowLoginModal(true);
                                    setShowQuickNav(false);
                                  }}
                                >
                                  <item.icon className="sv-mega-link-icon" />
                                  <div className="sv-mega-link-content">
                                    <h3 className="sv-mega-link-title">
                                      {item.name}
                                    </h3>
                                    <p className="sv-mega-link-desc">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <Link
                                  key={item.path + item.name}
                                  to={item.path}
                                  className="sv-mega-link sv-mega-link--primary"
                                  onClick={() => setShowQuickNav(false)}
                                >
                                  <item.icon className="sv-mega-link-icon" />
                                  <div className="sv-mega-link-content">
                                    <h3 className="sv-mega-link-title">
                                      {item.name}
                                    </h3>
                                    <p className="sv-mega-link-desc">
                                      {item.description}
                                    </p>
                                  </div>
                                </Link>
                              ),
                            )}
                          </div>
                        </div>
                      ) : null;

                    // Recruiter primary actions.
                    const recruiterSection = isRecruiterRole ? (
                      <div className="sv-mega-section">
                        <h4 className="sv-mega-section-title">
                          <Target size={14} className="sv-section-icon" />
                          <span>Hành động chính</span>
                        </h4>
                        <div className="sv-mega-grid sv-mega-grid--primary">
                          <Link
                            to="/jobs"
                            className="sv-mega-link sv-mega-link--primary"
                            onClick={() => setShowQuickNav(false)}
                          >
                            <Briefcase className="sv-mega-link-icon" />
                            <div className="sv-mega-link-content">
                              <h3 className="sv-mega-link-title">Việc Làm</h3>
                              <p className="sv-mega-link-desc">
                                Tìm kiếm & quản lý tin tuyển dụng
                              </p>
                            </div>
                          </Link>
                          <Link
                            to="/community"
                            className="sv-mega-link sv-mega-link--primary"
                            onClick={() => setShowQuickNav(false)}
                          >
                            <MessageSquare className="sv-mega-link-icon" />
                            <div className="sv-mega-link-content">
                              <h3 className="sv-mega-link-title">Cộng Đồng</h3>
                              <p className="sv-mega-link-desc">
                                Tham gia cộng đồng học tập sôi động
                              </p>
                            </div>
                          </Link>
                        </div>
                      </div>
                    ) : null;

                    // Guest primary actions — only for users with no special role (not MENTOR, not USER, not RECRUITER)
                    const guestSection =
                      !isMentorRole &&
                      !user?.roles.includes("USER") &&
                      !isRecruiterRole ? (
                        <div className="sv-mega-section">
                          <h4 className="sv-mega-section-title">
                            <Target size={14} className="sv-section-icon" />
                            <span>Hành động chính</span>
                          </h4>
                          <div className="sv-mega-grid sv-mega-grid--primary">
                            {[
                              {
                                name: "Lộ Trình Học Tập",
                                description: "Khám phá lộ trình học tập và phát triển kỹ năng",
                                path: "/roadmap",
                                icon: Map,
                              },
                              {
                                name: "Trợ Lý AI",
                                description: "Nhận hỗ trợ từ trợ lý AI thông minh",
                                path: "/chatbot",
                                icon: Bot,
                              },
                              {
                                name: "Meowl Shop",
                                description: "Cửa hàng Skin Neon Tech độc quyền",
                                path: "/meowl-shop",
                                icon: ShoppingBag,
                              },
                            ].map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                className="sv-mega-link sv-mega-link--primary"
                                onClick={(event) =>
                                  handleQuickNavLinkClick(
                                    event,
                                    item.name,
                                    item.path,
                                  )
                                }
                              >
                                <item.icon className="sv-mega-link-icon" />
                                <div className="sv-mega-link-content">
                                  <h3 className="sv-mega-link-title">{item.name}</h3>
                                  <p className="sv-mega-link-desc">{item.description}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null;

                    return (
                      <>
                        {mentorSection}
                        {userSection}
                        {recruiterSection}
                        {guestSection}
                      </>
                    );
                  })()}

                  {/* Group 2: Explore & Learn — only for non-MENTOR, non-RECRUITER, non-root-ADMIN */}
                  {!isMentorRole && !isRecruiterRole && !isRootAdminRole && (
                    <div className="sv-mega-section">
                      <h4 className="sv-mega-section-title">
                        <Search size={14} className="sv-section-icon" />
                        <span>Khám phá & Học tập</span>
                      </h4>
                      <div className="sv-mega-grid sv-mega-grid--secondary">
                        {[
                          {
                            name: "Khóa Học",
                            description: "Khám phá các khóa học chất lượng cao",
                            path: "/courses",
                            icon: GraduationCap,
                          },
                          {
                            name: "Cố Vấn",
                            description: "Kết nối với chuyên gia trong ngành",
                            path: "/mentorship",
                            icon: Users,
                          },
                          {
                            name: "Cộng Đồng",
                            description: "Tham gia cộng đồng học tập sôi động",
                            path: "/community",
                            icon: MessageSquare,
                          },
                          ...(hasLearnerRole
                            ? [
                                {
                                  name: "Meowl Shop",
                                  description:
                                    "Cửa hàng Skin Neon Tech độc quyền",
                                  path: "/meowl-shop",
                                  icon: ShoppingBag,
                                  className: "sv-mega-link--shop-highlight",
                                },
                              ]
                            : [
                                {
                                  name: "Việc Làm",
                                  description:
                                    "Tìm kiếm cơ hội việc làm phù hợp",
                                  path: "/jobs",
                                  icon: Briefcase,
                                },
                              ]),
                        ].map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`sv-mega-link ${item.className ?? ""}`.trim()}
                            onClick={(e) =>
                              handleQuickNavLinkClick(e, item.name, item.path)
                            }
                          >
                            <item.icon className="sv-mega-link-icon" />
                            <div className="sv-mega-link-content">
                              <h3 className="sv-mega-link-title">
                                {item.name}
                              </h3>
                              <p className="sv-mega-link-desc">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group 3: Learner career actions — show for anyone with USER/LEARNER role */}
                  {hasLearnerRole && !isMentorRole && !isRecruiterRole && (
                    <div className="sv-mega-section">
                      <h4 className="sv-mega-section-title">
                        <Briefcase size={14} className="sv-section-icon" />
                        <span>Công việc</span>
                      </h4>
                      <div className="sv-mega-grid sv-mega-grid--tertiary">
                        {[
                          {
                            name: "Portfolio",
                            description:
                              "Quản lý và chia sẻ thành tích của bạn",
                            path: "/portfolio",
                            icon: User,
                          },
                          {
                            name: "Trung tâm công việc",
                            description:
                              "Quản lý toàn bộ đơn ứng tuyển của bạn",
                            path: "/my-applications",
                            icon: FileText,
                          },
                          {
                            name: "Việc Làm",
                            description: "Tìm kiếm cơ hội việc làm phù hợp",
                            path: "/jobs",
                            icon: Briefcase,
                          },
                        ].map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="sv-mega-link"
                            onClick={(e) =>
                              handleQuickNavLinkClick(e, item.name, item.path)
                            }
                          >
                            <item.icon className="sv-mega-link-icon" />
                            <div className="sv-mega-link-content">
                              <h3 className="sv-mega-link-title">
                                {item.name}
                              </h3>
                              <p className="sv-mega-link-desc">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="header-right">
            {/* Upgrade Button */}
            {!isLoggingOut && user?.roles.includes("USER") && !isMentorRole && (
              <button
                onClick={handleUpgrade}
                className="header-upgrade-btn desktop-only"
              >
                <Crown size={18} />
                <span className="header-upgrade-text">Mở khóa giới hạn</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-btn desktop-only"
              style={{ display: "none" }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Authentication */}
            {!isLoggingOut && isAuthenticated && user ? (
              <>
                <div
                  ref={userMenuRef}
                  className="user-profile-group desktop-only"
                  style={{
                    background: getPremiumColor()
                      ? `linear-gradient(135deg, rgba(${hexToRgb(getPremiumColor()!)}, 0.1), rgba(${hexToRgb(getPremiumColor()!)}, 0.05))`
                      : undefined,
                    border: getPremiumColor()
                      ? `1px solid ${getPremiumColor()}`
                      : undefined,
                    boxShadow: getPremiumColor()
                      ? `0 0 20px rgba(${hexToRgb(getPremiumColor()!)}, 0.3)`
                      : undefined,
                  }}
                >
                  {unreadCount > 0 && (
                    <span className="header-notification-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  <button
                    className="user-profile-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <div className="profile-group-content">
                      <div
                        className="header-user-avatar"
                        style={{
                          border: getPremiumColor()
                            ? `3px solid ${getPremiumColor()}`
                            : "2px solid rgba(255,255,255,0.2)",
                          boxShadow: getPremiumColor()
                            ? `0 0 15px ${getPremiumColor()}`
                            : undefined,
                        }}
                      >
                        {resolvedHeaderAvatar ? (
                          <img
                            src={resolvedHeaderAvatar}
                            alt="Avatar"
                            className={`header-avatar-img${
                              recruiterCompanyLogoUrl
                                ? " header-avatar-img--company-logo"
                                : ""
                            }`}
                          />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                      <div className="user-info-inline">
                        <span className="user-greeting">
                          Xin chào,{" "}
                          <strong
                            style={{ color: getPremiumColor() || undefined }}
                          >
                            {userProfile?.fullName || user.fullName}
                          </strong>
                        </span>
                        <span
                          className="user-balance"
                          style={{ color: getPremiumColor() || undefined }}
                        >
                          Số dư:{" "}
                          {loadingBalance
                            ? "..."
                            : walletBalance !== null &&
                                walletBalance !== undefined
                              ? walletBalance.toLocaleString("vi-VN") + " đ"
                              : "N/A"}
                        </span>
                      </div>
                      <ChevronDown size={16} className="dropdown-icon" />
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="user-dropdown">
                      <div className="dropdown-content-scroll">
                        <div className="dropdown-notification-panel">
                          <NotificationDropdown inline collapsible />
                        </div>

                        <div className="dropdown-menu-groups">
                          <section className="dropdown-group dropdown-group--activity">
                            <p className="dropdown-group-label">HOẠT ĐỘNG</p>
                            {user.roles.includes("USER") && (
                              <button
                                onClick={() => {
                                  navigate("/my-applications");
                                  setShowUserMenu(false);
                                }}
                                className="dropdown-item"
                              >
                                <Briefcase size={16} />
                                <span>Đơn Ứng Tuyển</span>
                              </button>
                            )}
                            {canManageBookings && (
                              <button
                                onClick={() => {
                                  if (isMentorRole) {
                                    navigate("/mentor", {
                                      state: { activeTab: "bookings" },
                                    });
                                  } else {
                                    navigate("/my-bookings?tab=bookings");
                                  }
                                  setShowUserMenu(false);
                                }}
                                className="dropdown-item"
                              >
                                <Calendar size={16} />
                                <span>Quản lý lịch hẹn</span>
                              </button>
                            )}
                          </section>

                          <section className="dropdown-group dropdown-group--system">
                            <p className="dropdown-group-label">HỆ THỐNG</p>
                            <button
                              onClick={() => {
                                navigate("/help-center");
                                setShowUserMenu(false);
                              }}
                              className="dropdown-item"
                            >
                              <HelpCircle size={16} />
                              <span>Hỗ trợ</span>
                            </button>
                            <button
                              onClick={() => {
                                navigate("/report-violation");
                                setShowUserMenu(false);
                              }}
                              className="dropdown-item"
                            >
                              <AlertTriangle size={16} />
                              <span>Báo cáo vi phạm</span>
                            </button>
                          </section>

                          <section className="dropdown-group dropdown-group--account">
                            <p className="dropdown-group-label">TÀI KHOẢN</p>
                            <button
                              onClick={() => {
                                handleWallet();
                                setShowUserMenu(false);
                              }}
                              className="dropdown-item"
                            >
                              <Wallet size={16} />
                              <span>Ví</span>
                            </button>
                            <button
                              onClick={() => {
                                navigate("/messages");
                                setShowUserMenu(false);
                              }}
                              className="dropdown-item"
                            >
                              <MessageSquare size={16} />
                              <span>Tin nhắn</span>
                            </button>
                            {user.roles.includes("PARENT") && (
                              <button
                                onClick={() => {
                                  navigate("/parent-dashboard");
                                  setShowUserMenu(false);
                                }}
                                className="dropdown-item"
                              >
                                <Users size={16} />
                                <span>Phụ huynh</span>
                              </button>
                            )}
                            {user.roles.includes("MENTOR") && (
                              <button
                                onClick={() => {
                                  navigate("/mentor");
                                  setShowUserMenu(false);
                                }}
                                className="dropdown-item"
                              >
                                <BookOpen size={16} />
                                <span>Giảng Viên</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleProfile();
                                setShowUserMenu(false);
                              }}
                              className="dropdown-item"
                            >
                              <User size={16} />
                              <span>{profileMenuLabel}</span>
                            </button>
                            <button
                              onClick={handleLogout}
                              className="dropdown-item logout"
                            >
                              <LogOut size={16} />
                              <span>Đăng xuất</span>
                            </button>
                          </section>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="header-login-btn desktop-only"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng nhập"}
              </button>
            )}

            {/* Mobile quick actions */}
            {!isMentorRole && !isLoggingOut && (
              <button
                className="mobile-icon-btn mobile-only"
                aria-label="Upgrade"
                onClick={handleUpgrade}
              >
                <Crown size={18} />
              </button>
            )}

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
        {isMobileMenuOpen &&
          createPortal(
            <div className="mobile-menu" id="sv-mobile-menu">
              <div className="mobile-menu-content">
                {/* Mobile User Section */}
                {!isLoggingOut && isAuthenticated && user ? (
                  <div className="mobile-user-section">
                    <div className="mobile-user-info">
                      <div className="user-avatar-large">
                        {resolvedHeaderAvatar ? (
                          <img
                            src={resolvedHeaderAvatar}
                            alt="Avatar"
                            className={`header-avatar-img-large${
                              recruiterCompanyLogoUrl
                                ? " header-avatar-img-large--company-logo"
                                : ""
                            }`}
                          />
                        ) : (
                          <User size={32} />
                        )}
                      </div>
                      <div className="user-details">
                        <p className="user-name">{user.fullName}</p>
                        <p className="user-email">{user.email}</p>
                      </div>
                    </div>

                    {/* Mobile User Actions - Integrated */}
                    <div className="mobile-user-actions-grid">
                      <button
                        onClick={() => {
                          handleWallet();
                          setIsMobileMenuOpen(false);
                        }}
                        className="mobile-action-icon-btn"
                        title="Ví"
                      >
                        <Wallet size={20} />
                        <span>Ví</span>
                      </button>
                      <button
                        className="mobile-action-icon-btn"
                        title="Thông báo"
                      >
                        <Bell size={20} />
                        <span>Thông báo</span>
                      </button>
                      {user?.roles.includes("USER") && !isMentorRole && (
                        <button
                          onClick={() => {
                            handleUpgrade();
                            setIsMobileMenuOpen(false);
                          }}
                          className="mobile-action-icon-btn upgrade"
                          title="Nâng cấp"
                        >
                          <Crown size={20} />
                          <span>Nâng cấp</span>
                        </button>
                      )}
                    </div>

                    <div className="mobile-user-menu-list">
                      {user.roles.includes("RECRUITER") && (
                        <button
                          onClick={() => {
                            navigate("/business");
                            setIsMobileMenuOpen(false);
                          }}
                          className="mobile-menu-item"
                          style={{ color: "#F472B6" }}
                        >
                          <Building2 size={18} />
                          <span>Quản lý Doanh Nghiệp</span>
                        </button>
                      )}
                      {(user.roles.includes("ADMIN") ||
                        user.roles.some((role) => role.endsWith("_ADMIN"))) && (
                        <button
                          onClick={() => {
                            navigate("/admin");
                            setIsMobileMenuOpen(false);
                          }}
                          className="mobile-menu-item"
                          style={{ color: "#F472B6" }}
                        >
                          <Shield size={18} />
                          <span>Quản Trị Viên</span>
                        </button>
                      )}
                      {user.roles.includes("MENTOR") && (
                        <button
                          onClick={handleMentor}
                          className="mobile-menu-item"
                        >
                          <BookOpen size={18} />
                          <span>Giảng Viên</span>
                        </button>
                      )}
                      {user.roles.includes("PARENT") && (
                        <button
                          onClick={() => {
                            navigate("/parent-dashboard");
                            setIsMobileMenuOpen(false);
                          }}
                          className="mobile-menu-item"
                        >
                          <Users size={18} />
                          <span>Phụ huynh</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleProfile();
                          setIsMobileMenuOpen(false);
                        }}
                        className="mobile-menu-item"
                      >
                        <User size={18} />
                        <span>{profileMenuLabel}</span>
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="mobile-menu-item logout"
                      >
                        <LogOut size={18} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="mobile-login-btn"
                    disabled={isLoggingOut}
                  >
                    <User size={18} />
                    <span>
                      {isLoggingOut ? "Đang đăng xuất..." : "Đăng nhập"}
                    </span>
                  </button>
                )}

                {/* Mobile Quick Navigation */}
                <div className="mobile-categories">
                  <h3 className="mobile-section-title">Dịch Chuyển Nhanh</h3>
                  <div className="mobile-category-grid">
                    {quickNavItems
                      .filter((item) => {
                        const hiddenByRole = item.hideForRoles?.some((role) =>
                          user?.roles.includes(role),
                        );
                        if (hiddenByRole) {
                          return false;
                        }

                        if (studentOnlyQuickNavPaths.has(item.path)) {
                          if (isStudentRole) {
                            return true;
                          }

                          const isGuest = !isAuthenticated;
                          return isGuest && guestShowcaseQuickNavPaths.has(item.path);
                        }

                        return true;
                      })
                      .map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="mobile-category-link"
                          onClick={(e) =>
                            handleQuickNavLinkClick(
                              e,
                              item.name,
                              item.path,
                              true,
                            )
                          }
                        >
                          <item.icon className="mobile-category-icon" />
                          <div className="mobile-category-content">
                            <span className="mobile-category-title">
                              {item.name}
                            </span>
                            <span className="mobile-category-description">
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </header>
    </>
  );
};

export default Header;
