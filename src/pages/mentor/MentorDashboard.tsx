/**
 * MentorDashboard (NEW)
 * 
 * Clean, modular mentor dashboard that routes to appropriate components.
 * Replaces the monolithic legacy MentorPage.
 * 
 * Architecture:
 * - Uses MentorSidebar for navigation
 * - Routes tabs to separate components
 * - Course management uses dedicated pages (CourseCreationPage, CourseContentPage)
 * 
 * @module pages/mentor/MentorDashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import { listCoursesByAuthor } from '../../services/courseService';
import { getMentorSubmissionStats } from '../../services/assignmentService';

// Sidebar
import MentorSidebar from '../../components/mentor/MentorSidebar';

// Tab Components
import MentorOverviewHUD from '../../components/mentor/MentorOverviewHUD';
import CoursesTab from '../../components/mentor/CoursesTab';
import MentorCourseAnalyticsTab from '../../components/mentor/MentorCourseAnalyticsTab';
import MentorScheduleManager from '../../components/portfolio-hud/MentorScheduleManager';
import MentorBookingManager from '../../components/portfolio-hud/MentorBookingManager';
import SkillPointsTab from '../../components/mentor/SkillPointsTab';
import EarningsTab from '../../components/mentor/EarningsTab';
import ReviewsTab from '../../components/mentor/ReviewsTab';
import MentorGradingDashboard from '../../components/mentor/MentorGradingDashboard';
import MentorCertificateSettingsTab from '../../components/mentor/MentorCertificateSettingsTab';
import MentorVerificationTab from '../../components/mentor/MentorVerificationTab';

// Styles
import '../../styles/MentorPage-HUD.css';

// ============================================================================
// COMPONENT
// ============================================================================

const MentorDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { activeTab?: string } | null;

  // State
  const [activeTab, setActiveTab] = useState<string>(locationState?.activeTab || 'overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingGradingCount, setPendingGradingCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/mentor' } });
    }
  }, [user, authLoading, navigate]);

  // Load lightweight mentor stats when user is available
  useEffect(() => {
    if (user?.id) {
      loadCourseCount();
      loadPendingGradingCount();
    }
  }, [user?.id]);

  const loadCourseCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Only request one record, rely on totalElements for accurate total course count.
      const response = await listCoursesByAuthor(user.id, 0, 1);
      setCourseCount(response.totalElements ?? (response.content?.length || 0));
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  }, [user?.id]);

  const loadPendingGradingCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const stats = await getMentorSubmissionStats();
      setPendingGradingCount(stats.pendingCount ?? 0);
    } catch (err) {
      console.error('Failed to load pending grading count:', err);
      setPendingGradingCount(0);
    }
  }, [user?.id]);

  // Update URL state when tab changes (optional - for deep linking)
  useEffect(() => {
    if (locationState?.activeTab && locationState.activeTab !== activeTab) {
      setActiveTab(locationState.activeTab);
    }
  }, [locationState?.activeTab]);

  // Handle navigation from overview HUD
  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Loading state
  if (authLoading) {
    return (
      <div className="mentor-hud-page">
        <div className="mentor-hud-loading-fullpage">
          <MeowlKuruLoader size="large" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <MentorOverviewHUD onNavigate={handleNavigate} courseCount={courseCount} />;

      case 'courses':
        return <CoursesTab />;

      case 'course-analytics':
        return <MentorCourseAnalyticsTab />;

      case 'schedule':
        return <MentorScheduleManager />;

      case 'bookings':
        return <MentorBookingManager />;

      case 'skillpoints':
        return <SkillPointsTab />;

      case 'earnings':
        return <EarningsTab />;

      case 'reviews':
        return <ReviewsTab />;

      case 'grading':
        return <MentorGradingDashboard onPendingCountChange={setPendingGradingCount} />;

      case 'certificate-settings':
        return <MentorCertificateSettingsTab />;

      case 'verification':
        return <MentorVerificationTab />;

      default:
        return <MentorOverviewHUD onNavigate={handleNavigate} courseCount={courseCount} />;
    }
  };

  return (
    <div className="mentor-hud-page">
      {/* Mobile Menu Toggle */}
      <button
        className="mentor-hud-mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <MentorSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        pendingGradingCount={pendingGradingCount}
      />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mentor-hud-mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`mentor-hud-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="mentor-hud-content">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default MentorDashboard;
