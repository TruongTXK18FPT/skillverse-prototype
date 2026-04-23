import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import UserManagementTabCosmic from "../../components/admin/UserManagementTabCosmic";
import AdminVerificationTabs from "../../components/admin/AdminVerificationTabs";
import MentorVerificationAdminTab from "../../components/admin/MentorVerificationAdminTab";
import AdminCourseHub from "../../components/admin/AdminCourseHub";
import AnalyticsTab from "../../components/admin/AnalyticsTab";
import NotificationsTabCosmic from "../../components/admin/NotificationsTabCosmic";
import ReportsTabCosmic from "../../components/admin/ReportsTabCosmic";
import TransactionManagementTabCosmic from "../../components/admin/TransactionManagementTabCosmic";
import WithdrawalApprovalTab from "../../components/admin/WithdrawalApprovalTab";
import SkillPointManagementTabCosmic from "../../components/admin/SkillPointManagementTabCosmic";
import SystemSettingsTabCosmic from "../../components/admin/SystemSettingsTabCosmic";
import PremiumPlansManagementTab from "../../components/admin/PremiumPlansManagementTab";
import SupportTicketsTab from "../../components/admin/SupportTicketsTab";
import AIExpertManagementTab from "../../components/admin/AIExpertManagementTab";
import QuestionBankTab from "../../components/admin/questionBank/QuestionBankTab";
import JourneyManagementTab from "../../components/admin/JourneyManagementTab";
import CommunityManagementTab from "../../components/admin/CommunityManagementTab";
import { JobManagementTab } from "../../components/admin/JobManagementTab";
import MeowlSkinUploadTab from "../../components/admin/MeowlSkinUploadTab";
import SliderManagementTab from "../../components/admin/SliderManagementTab";
import AdminAiGradingDashboard from "../admin/AdminAiGradingDashboard";
import AdminAiKnowledgeDashboard from "../admin/AdminAiKnowledgeDashboard";
// import AdminSeminarManager from './AdminSeminarManager';
import adminUserService from "../../services/adminUserService";
import adminService from "../../services/adminService";
import supportService from "../../services/supportService";
import walletService from "../../services/walletService";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminBookingManagementTab from "../../components/admin/AdminBookingManagementTab";
import { getStoredUserRaw } from "../../utils/authStorage";
import "../../styles/AdminPageCosmic.css";
import "../../styles/AdminLayoutHUD.css";

interface AdminStats {
  totalUsers: number;
  pendingWithdrawals: number;
  pendingVerifications: number;
  totalTickets: number;
}

const AdminPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = useMemo(
    () => requestedTab?.trim() || "overview",
    [requestedTab],
  );
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const [, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingWithdrawals: 0,
    pendingVerifications: 0,
    totalTickets: 0,
  });

  // Fetch user roles on mount
  useEffect(() => {
    try {
      const userStr = getStoredUserRaw();
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.roles && Array.isArray(user.roles)) {
          setUserRoles(user.roles);
        }
      }
    } catch (e) {
      console.error("Error parsing user roles", e);
    }
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Fetch real stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersData, ticketStats, withdrawalData, pendingApps] =
          await Promise.allSettled([
            adminUserService.getAllUsers(),
            supportService.getTicketStats(),
            walletService.adminGetWithdrawalRequests(0, 100, "PENDING"),
            adminService.getPendingApplications(),
          ]);

        setStats({
          totalUsers:
            usersData.status === "fulfilled" ? usersData.value.totalUsers : 0,
          totalTickets:
            ticketStats.status === "fulfilled"
              ? ticketStats.value.totalTickets
              : 0,
          pendingWithdrawals:
            withdrawalData.status === "fulfilled"
              ? withdrawalData.value?.content?.length ||
                withdrawalData.value?.totalElements ||
                0
              : 0,
          pendingVerifications:
            pendingApps.status === "fulfilled"
              ? pendingApps.value.totalApplications
              : 0,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      }
    };
    fetchStats();
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "users":
        return <UserManagementTabCosmic />;
      case "verification":
        return <AdminVerificationTabs />;
      case "mentor-skills":
        return <MentorVerificationAdminTab />;
      case "courses":
      case "course-analytics":
        return <AdminCourseHub />;
      case "jobs":
        return <JobManagementTab />;
      // case 'seminars':
      //   return <AdminSeminarManager />;
      case "analytics":
        return <AnalyticsTab />;
      case "notifications":
        return <NotificationsTabCosmic />;
      case "reports":
        return <ReportsTabCosmic />;
      case "community":
        return <CommunityManagementTab />;
      case "payments":
        return <TransactionManagementTabCosmic />;
      case "bookings":
        return <AdminBookingManagementTab />;
      case "withdrawals":
        return <WithdrawalApprovalTab />;
      case "skillpoints":
        return <SkillPointManagementTabCosmic />;
      case "premium":
        return <PremiumPlansManagementTab />;
      case "support":
        return <SupportTicketsTab />;
      case "settings":
        return <SystemSettingsTabCosmic />;
      case "ai-experts":
        return <AIExpertManagementTab />;
      case "ai-grading":
        return <AdminAiGradingDashboard />;
      case "ai-knowledge":
        return <AdminAiKnowledgeDashboard />;
      case "question-bank":
        return <QuestionBankTab />;
      case "journey-management":
      case "journey-ops":
        return <JourneyManagementTab />;
      case "skin-upload":
        return <MeowlSkinUploadTab />;
      case "sliders":
        return <SliderManagementTab />;
      default:
        return <AnalyticsTab />;
    }
  };

  return (
    <div className="admin-layout-hud">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRoles={userRoles}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <main className="admin-main-content">
        <div className="admin-content-inner">{renderActiveTab()}</div>
      </main>
    </div>
  );
};

export default AdminPage;
