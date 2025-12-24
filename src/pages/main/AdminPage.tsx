import React, { useState, useEffect } from 'react';
import UserManagementTabCosmic from '../../components/admin/UserManagementTabCosmic';
import AccountVerificationTabCosmic from '../../components/admin/AccountVerificationTabCosmic';
import { CourseApprovalTabCosmic } from '../../components/admin/CourseApprovalTabCosmic';
import AnalyticsTab from '../../components/admin/AnalyticsTab';
import NotificationsTabCosmic from '../../components/admin/NotificationsTabCosmic';
import ReportsTabCosmic from '../../components/admin/ReportsTabCosmic';
import TransactionManagementTabCosmic from '../../components/admin/TransactionManagementTabCosmic';
import WithdrawalApprovalTab from '../../components/admin/WithdrawalApprovalTab';
import SkillPointManagementTabCosmic from '../../components/admin/SkillPointManagementTabCosmic';
import SystemSettingsTabCosmic from '../../components/admin/SystemSettingsTabCosmic';
import PremiumPlansManagementTab from '../../components/admin/PremiumPlansManagementTab';
import SupportTicketsTab from '../../components/admin/SupportTicketsTab';
import AIExpertManagementTab from '../../components/admin/AIExpertManagementTab';
import CommunityManagementTab from '../../components/admin/CommunityManagementTab';
import { JobManagementTab } from '../../components/admin/JobManagementTab';
import MeowlSkinUploadTab from '../../components/admin/MeowlSkinUploadTab';
import {
  Users, UserCheck, BookOpen, BarChart3, Bell, AlertTriangle,
  CreditCard, Banknote, Zap, Crown, Ticket, Settings, Brain, MessageSquare, Briefcase, Shirt
} from 'lucide-react';
import adminUserService from '../../services/adminUserService';
import adminService from '../../services/adminService';
import supportService from '../../services/supportService';
import walletService from '../../services/walletService';
import '../../styles/AdminPageCosmic.css';

interface AdminStats {
  totalUsers: number;
  pendingWithdrawals: number;
  pendingVerifications: number;
  totalTickets: number;
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('users');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingWithdrawals: 0,
    pendingVerifications: 0,
    totalTickets: 0
  });

  // Fetch user roles on mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.roles && Array.isArray(user.roles)) {
          setUserRoles(user.roles);
        }
      }
    } catch (e) {
      console.error('Error parsing user roles', e);
    }
  }, []);

  // Fetch real stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersData, ticketStats, withdrawalData, pendingApps] = await Promise.allSettled([
          adminUserService.getAllUsers(),
          supportService.getTicketStats(),
          walletService.adminGetWithdrawalRequests(0, 100, 'PENDING'),
          adminService.getPendingApplications()
        ]);

        setStats({
          totalUsers: usersData.status === 'fulfilled' ? usersData.value.totalUsers : 0,
          totalTickets: ticketStats.status === 'fulfilled' ? ticketStats.value.totalTickets : 0,
          pendingWithdrawals: withdrawalData.status === 'fulfilled' 
            ? (withdrawalData.value?.content?.length || withdrawalData.value?.totalElements || 0)
            : 0,
          pendingVerifications: pendingApps.status === 'fulfilled'
            ? pendingApps.value.totalApplications
            : 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
    };
    fetchStats();
  }, []);

  const allTabs = [
    { 
      id: 'users', 
      label: 'Quản Lý Người Dùng', 
      icon: Users,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Quản lý tài khoản người dùng',
      allowedRoles: ['USER_ADMIN']
    },
    { 
      id: 'verification', 
      label: 'Xác Thực Tài Khoản', 
      icon: UserCheck,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      description: 'Duyệt đơn đăng ký',
      allowedRoles: ['USER_ADMIN']
    },
    { 
      id: 'courses', 
      label: 'Duyệt Khóa Học', 
      icon: BookOpen,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      description: 'Phê duyệt khóa học mới',
      allowedRoles: ['CONTENT_ADMIN']
    },
    { 
      id: 'jobs', 
      label: 'Duyệt Tuyển Dụng', 
      icon: Briefcase,
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      description: 'Phê duyệt tin tuyển dụng',
      allowedRoles: ['CONTENT_ADMIN']
    },
    { 
      id: 'analytics', 
      label: 'Thống Kê', 
      icon: BarChart3,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      description: 'Báo cáo và phân tích',
      allowedRoles: ['ADMIN']
    },
    { 
      id: 'notifications', 
      label: 'Thông Báo', 
      icon: Bell,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      description: 'Gửi thông báo hệ thống',
      allowedRoles: ['SUPPORT_ADMIN']
    },
    { 
      id: 'reports', 
      label: 'Báo Cáo Vi Phạm', 
      icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
      description: 'Xử lý báo cáo từ người dùng',
      allowedRoles: ['COMMUNITY_ADMIN', 'FINANCE_ADMIN', 'USER_ADMIN']
    },
    { 
      id: 'community', 
      label: 'Quản Lý Cộng Đồng', 
      icon: MessageSquare,
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      description: 'Quản lý bài viết và bình luận',
      allowedRoles: ['COMMUNITY_ADMIN']
    },
    { 
      id: 'payments', 
      label: 'Thanh Toán', 
      icon: CreditCard,
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      description: 'Quản lý giao dịch',
      allowedRoles: ['FINANCE_ADMIN']
    },
    { 
      id: 'withdrawals', 
      label: 'Duyệt Rút Tiền', 
      icon: Banknote,
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      description: 'Xử lý yêu cầu rút tiền',
      allowedRoles: ['FINANCE_ADMIN']
    },
    { 
      id: 'skillpoints', 
      label: 'Điểm Kỹ Năng', 
      icon: Zap,
      gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      description: 'Quản lý điểm thưởng',
      allowedRoles: ['PREMIUM_ADMIN']
    },
    { 
      id: 'premium', 
      label: 'Quản Lý Premium', 
      icon: Crown,
      gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
      description: 'Quản lý gói premium',
      allowedRoles: ['PREMIUM_ADMIN']
    },
    { 
      id: 'support', 
      label: 'Hỗ Trợ Tickets', 
      icon: Ticket,
      gradient: 'linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)',
      description: 'Quản lý yêu cầu hỗ trợ',
      allowedRoles: ['SUPPORT_ADMIN']
    },
    { 
      id: 'ai-experts', 
      label: 'AI Experts', 
      icon: Brain,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
      description: 'Quản lý AI Career Experts',
      allowedRoles: ['AI_ADMIN']
    },
    { 
      id: 'skin-upload', 
      label: 'Upload Skin', 
      icon: Shirt,
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
      description: 'Upload Meowl Skins',
      allowedRoles: ['AI_ADMIN']
    },
    { 
      id: 'settings', 
      label: 'Cài Đặt Hệ Thống', 
      icon: Settings,
      gradient: 'linear-gradient(135deg, #868f96 0%, #596164 100%)',
      description: 'Cấu hình nền tảng',
      allowedRoles: ['SYSTEM_ADMIN']
    },
  ];

  const tabs = allTabs.filter(tab => {
    if (userRoles.includes('ADMIN')) return true;
    return tab.allowedRoles.some(role => userRoles.includes(role));
  });

  // Automatically switch to first available tab if current one is not allowed
  useEffect(() => {
    if (tabs.length > 0) {
      const currentTabAvailable = tabs.some(t => t.id === activeTab);
      if (!currentTabAvailable) {
        setActiveTab(tabs[0].id);
      }
    }
  }, [userRoles]); // tabs is derived from userRoles, so we can depend on userRoles (or just tabs if we wrap it in useMemo)

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagementTabCosmic />;
      case 'verification':
        return <AccountVerificationTabCosmic />;
      case 'courses':
        return <CourseApprovalTabCosmic />;
      case 'jobs':
        return <JobManagementTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'notifications':
        return <NotificationsTabCosmic />;
      case 'reports':
        return <ReportsTabCosmic />;
      case 'community':
        return <CommunityManagementTab />;
      case 'payments':
        return <TransactionManagementTabCosmic />;
      case 'withdrawals':
        return <WithdrawalApprovalTab />;
      case 'skillpoints':
        return <SkillPointManagementTabCosmic />;
      case 'premium':
        return <PremiumPlansManagementTab />;
      case 'support':
        return <SupportTicketsTab />;
      case 'settings':
        return <SystemSettingsTabCosmic />;
      case 'ai-experts':
        return <AIExpertManagementTab />;
      case 'skin-upload':
        return <MeowlSkinUploadTab />;
      default:
        return (
          <div className="administrator-default-tab">
            <h2>Chào mừng đến với Bảng Điều Khiển Quản Trị</h2>
            <p>Chọn một tab để quản lý các hoạt động của nền tảng.</p>
          </div>
        );
    }
  };

  return (
    <div className="administrator-page">
      <div className="administrator-header">
        <div>
          <h1>Bảng Điều Khiển Quản Trị</h1>
          <p>Quản lý toàn bộ nền tảng SkillVerse và theo dõi hoạt động người dùng</p>
        </div>
      </div>
      <div className="administrator-stats-quick">
        <div className="administrator-stat-card">
          <span className="administrator-stat-icon">
            <Users size={28} />
          </span>
          <div>
            <div className="administrator-stat-number">{stats.totalUsers.toLocaleString()}</div>
            <div className="administrator-stat-label">Tổng Người Dùng</div>
          </div>
        </div>
        <div className="administrator-stat-card">
          <span className="administrator-stat-icon">
            <Banknote size={28} />
          </span>
          <div>
            <div className="administrator-stat-number">{stats.pendingWithdrawals}</div>
            <div className="administrator-stat-label">Đơn Rút Tiền</div>
          </div>
        </div>
        <div className="administrator-stat-card">
          <span className="administrator-stat-icon">
            <UserCheck size={28} />
          </span>
          <div>
            <div className="administrator-stat-number">{stats.pendingVerifications}</div>
            <div className="administrator-stat-label">Chờ Xác Thực</div>
          </div>
        </div>
        <div className="administrator-stat-card">
          <span className="administrator-stat-icon">
            <Ticket size={28} />
          </span>
          <div>
            <div className="administrator-stat-number">{stats.totalTickets}</div>
            <div className="administrator-stat-label">Tổng Tickets</div>
          </div>
        </div>
      </div>

      <div className="administrator-tabs">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              className={`administrator-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                '--tab-gradient': tab.gradient
              } as React.CSSProperties & { '--tab-gradient': string }}
            >
              <div className="administrator-tab-icon-wrapper">
                <IconComponent size={22} className="administrator-tab-icon" />
              </div>
              <div className="administrator-tab-content">
                <span className="administrator-tab-label">{tab.label}</span>
                <span className="administrator-tab-description">{tab.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="administrator-content">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default AdminPage;
