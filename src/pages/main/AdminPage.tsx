import React, { useState } from 'react';
import UserManagementTabCosmic from '../../components/admin/UserManagementTabCosmic';
import AccountVerificationTab from '../../components/admin/AccountVerificationTab';
import { CourseApprovalTabCosmic } from '../../components/admin/CourseApprovalTabCosmic';
import AnalyticsTab from '../../components/admin/AnalyticsTab';
import NotificationsTab from '../../components/admin/NotificationsTab';
import ReportsTab from '../../components/admin/ReportsTab';
import TransactionManagementTabCosmic from '../../components/admin/TransactionManagementTabCosmic';
import WithdrawalApprovalTab from '../../components/admin/WithdrawalApprovalTab';
import SkillPointManagementTab from '../../components/admin/SkillPointManagementTab';
import SystemSettingsTab from '../../components/admin/SystemSettingsTab';
import PremiumPlansManagementTab from '../../components/admin/PremiumPlansManagementTab';
import SupportTicketsTab from '../../components/admin/SupportTicketsTab';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import '../../styles/AdminPageCosmic.css';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('users');
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { 
      id: 'users', 
      label: 'Quản Lý Người Dùng', 
      icon: '👥',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Quản lý tài khoản người dùng'
    },
    { 
      id: 'verification', 
      label: 'Xác Thực Tài Khoản', 
      icon: '✅',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      description: 'Duyệt đơn đăng ký'
    },
    { 
      id: 'courses', 
      label: 'Duyệt Khóa Học', 
      icon: '📚',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      description: 'Phê duyệt khóa học mới'
    },
    { 
      id: 'analytics', 
      label: 'Thống Kê', 
      icon: '📊',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      description: 'Báo cáo và phân tích'
    },
    { 
      id: 'notifications', 
      label: 'Thông Báo', 
      icon: '🔔',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      description: 'Gửi thông báo hệ thống'
    },
    { 
      id: 'reports', 
      label: 'Báo Cáo Vi Phạm', 
      icon: '⚠️',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
      description: 'Xử lý báo cáo từ người dùng'
    },
    { 
      id: 'payments', 
      label: 'Thanh Toán', 
      icon: '💳',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      description: 'Quản lý giao dịch'
    },
    { 
      id: 'withdrawals', 
      label: 'Duyệt Rút Tiền', 
      icon: '💸',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      description: 'Xử lý yêu cầu rút tiền'
    },
    { 
      id: 'skillpoints', 
      label: 'Điểm Kỹ Năng', 
      icon: '⚡',
      gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      description: 'Quản lý điểm thưởng'
    },
    { 
      id: 'premium', 
      label: 'Quản Lý Premium', 
      icon: '👑',
      gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
      description: 'Quản lý gói premium'
    },
    { 
      id: 'support', 
      label: 'Hỗ Trợ Tickets', 
      icon: '🎫',
      gradient: 'linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)',
      description: 'Quản lý yêu cầu hỗ trợ'
    },
    { 
      id: 'settings', 
      label: 'Cài Đặt Hệ Thống', 
      icon: '⚙️',
      gradient: 'linear-gradient(135deg, #868f96 0%, #596164 100%)',
      description: 'Cấu hình nền tảng'
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagementTabCosmic />;
      case 'verification':
        return <AccountVerificationTab />;
      case 'courses':
        return <CourseApprovalTabCosmic />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'reports':
        return <ReportsTab />;
      case 'payments':
        return <TransactionManagementTabCosmic />;
      case 'withdrawals':
        return <WithdrawalApprovalTab />;
      case 'skillpoints':
        return <SkillPointManagementTab />;
      case 'premium':
        return <PremiumPlansManagementTab />;
      case 'support':
        return <SupportTicketsTab />;
      case 'settings':
        return <SystemSettingsTab />;
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
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}</span>
        </button>
      </div>
      <div className="administrator-stats-quick">
        <div className="administrator-stat-card">
          <span className="administrator-stat-icon">👥</span>
          <div>
            <div className="administrator-stat-number">12,847</div>
            <div className="administrator-stat-label">Tổng Người Dùng</div>
          </div>
        </div>
        <div className="administrator-stat-card">
          <span className="administrator-stat-icon">✅</span>
          <div>
            <div className="administrator-stat-number">23</div>
            <div className="administrator-stat-label">Chờ Duyệt</div>
          </div>
        </div>
        <div className="administrator-stat-card">
          <span className="administrator-stat-icon">⚠️</span>
          <div>
            <div className="administrator-stat-number">7</div>
            <div className="administrator-stat-label">Báo Cáo Mới</div>
          </div>
        </div>
      </div>

      <div className="administrator-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`administrator-tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              '--tab-gradient': tab.gradient
            } as React.CSSProperties & { '--tab-gradient': string }}
          >
            <div className="administrator-tab-icon-wrapper">
              <span className="administrator-tab-icon">{tab.icon}</span>
            </div>
            <div className="administrator-tab-content">
              <span className="administrator-tab-label">{tab.label}</span>
              <span className="administrator-tab-description">{tab.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="administrator-content">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default AdminPage;
