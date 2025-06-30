import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/AdminPage.css';
import {
  Users,
  BarChart3,
  Package,
  FileText,
  Settings,
  Bell,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  DollarSign,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Menu,
  Home
} from 'lucide-react';

interface StatCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  status: 'success' | 'warning' | 'error';
}

interface ChartData {
  month: string;
  users: number;
}

const AdminPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [notifications] = useState(3);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sample data
  const [stats] = useState<StatCard[]>([
    {
      id: '1',
      title: 'Tổng Người Dùng',
      value: '12,345',
      change: '+12%',
      changeType: 'increase',
      icon: <Users className="stat-icon" />,
      color: '#667eea'
    },
    {
      id: '2',
      title: 'Doanh Thu',
      value: '₫125.6M',
      change: '+8%',
      changeType: 'increase',
      icon: <DollarSign className="stat-icon" />,
      color: '#48bb78'
    },
    {
      id: '3',
      title: 'Tăng Trưởng',
      value: '23.4%',
      change: '-2%',
      changeType: 'decrease',
      icon: <TrendingUp className="stat-icon" />,
      color: '#ed8936'
    },
    {
      id: '4',
      title: 'Phản Hồi',
      value: '4.8/5',
      change: '+0.2',
      changeType: 'increase',
      icon: <MessageSquare className="stat-icon" />,
      color: '#f093fb'
    }
  ]);

  const [chartData] = useState<ChartData[]>([
    { month: 'Jan', users: 400 },
    { month: 'Feb', users: 500 },
    { month: 'Mar', users: 300 },
    { month: 'Apr', users: 600 },
    { month: 'May', users: 800 },
    { month: 'Jun', users: 700 },
    { month: 'Jul', users: 950 }
  ]);

  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      user: 'Nguyễn Văn A',
      action: 'Đăng ký khóa học',
      target: 'React Fundamentals',
      time: '2 phút trước',
      status: 'success'
    },
    {
      id: '2',
      user: 'Trần Thị B',
      action: 'Hoàn thành bài kiểm tra',
      target: 'JavaScript Advanced',
      time: '15 phút trước',
      status: 'success'
    },
    {
      id: '3',
      user: 'Lê Văn C',
      action: 'Báo cáo lỗi',
      target: 'Video Player',
      time: '1 giờ trước',
      status: 'warning'
    },
    {
      id: '4',
      user: 'Phạm Thị D',
      action: 'Thanh toán thất bại',
      target: 'Premium Plan',
      time: '2 giờ trước',
      status: 'error'
    },
    {
      id: '5',
      user: 'Hoàng Văn E',
      action: 'Tạo tài khoản',
      target: 'New Registration',
      time: '3 giờ trước',
      status: 'success'
    }
  ]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="menu-icon" /> },
    { id: 'users', label: 'Người Dùng', icon: <Users className="menu-icon" /> },
    { id: 'analytics', label: 'Phân Tích', icon: <BarChart3 className="menu-icon" /> },
    { id: 'products', label: 'Sản Phẩm', icon: <Package className="menu-icon" /> },
    { id: 'reports', label: 'Báo Cáo', icon: <FileText className="menu-icon" /> },
    { id: 'settings', label: 'Cài Đặt', icon: <Settings className="menu-icon" /> }
  ];

  const segmentData = [
    { label: 'Học viên mới', value: 35, color: '#667eea' },
    { label: 'Học viên thường xuyên', value: 45, color: '#48bb78' },
    { label: 'Học viên VIP', value: 20, color: '#ed8936' }
  ];

  return (
    <div className={`admin-dashboard ${theme}`} data-theme={theme}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="/src/assets/SkillVerse.jpeg" alt="SkillVerse" className="logo-image" />
            <span className="logo-text">SkillVerse</span>
          </div>

          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeMenuItem === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenuItem(item.id)}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="page-title">
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="menu-icon" />
            </button>
            <div>
              <h1>Dashboard</h1>
              <p>Chào mừng trở lại! Đây là tổng quan về nền tảng của bạn.</p>
            </div>
          </div>

          <div className="top-bar-actions">
            <button className="action-btn theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            <button className="action-btn notification-btn">
              <Bell className="action-icon" />
              {notifications > 0 && (
                <span className="notification-badge">{notifications}</span>
              )}
            </button>

            <div className="user-profile">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format" 
                alt="User Avatar" 
                className="user-avatar"
              />
              <div className="user-info">
                <span className="user-name">Admin User</span>
                <span className="user-role">Quản trị viên</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Stats Cards */}
          <section className="stats-section">
            <div className="stats-grid">
              {stats.map((stat) => (
                <div key={stat.id} className="stat-card" style={{ '--card-color': stat.color } as React.CSSProperties}>
                  <div className="stat-icon-wrapper">
                    {stat.icon}
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-value">{stat.value}</h3>
                    <p className="stat-title">{stat.title}</p>
                    <div className={`stat-change ${stat.changeType}`}>
                      {stat.changeType === 'increase' ? (
                        <TrendingUp className="change-icon" />
                      ) : (
                        <TrendingDown className="change-icon" />
                      )}
                      <span>{stat.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Charts Section */}
          <section className="charts-section">
            <div className="charts-grid">
              {/* Line Chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Tăng Trưởng Người Dùng</h3>
                  <button className="chart-menu">
                    <MoreVertical className="menu-icon" />
                  </button>
                </div>
                <div className="line-chart">
                  <svg viewBox="0 0 400 200" className="chart-svg">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#667eea" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#667eea" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={`grid-${i}`}
                        x1="50"
                        y1={40 + i * 30}
                        x2="380"
                        y2={40 + i * 30}
                        stroke="var(--admin-border)"
                        strokeOpacity="0.3"
                      />
                    ))}
                    
                    {/* Chart line */}
                    <path
                      d="M 50 140 L 100 120 L 150 160 L 200 100 L 250 60 L 300 80 L 350 40"
                      stroke="#667eea"
                      strokeWidth="3"
                      fill="none"
                      className="chart-line"
                    />
                    
                    {/* Area under line */}
                    <path
                      d="M 50 140 L 100 120 L 150 160 L 200 100 L 250 60 L 300 80 L 350 40 L 350 170 L 50 170 Z"
                      fill="url(#lineGradient)"
                    />
                    
                    {/* Data points */}
                    {chartData.map((point, index) => (
                      <circle
                        key={`chart-point-${point.month}-${index}`}
                        cx={50 + index * 50}
                        cy={170 - (point.users / 1000) * 120}
                        r="4"
                        fill="#667eea"
                        className="chart-point"
                      />
                    ))}
                  </svg>
                  
                  <div className="chart-labels">
                    {chartData.map((point) => (
                      <span key={`chart-label-${point.month}`} className="chart-label">
                        {point.month}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Phân Khúc Khách Hàng</h3>
                  <button className="chart-menu">
                    <MoreVertical className="menu-icon" />
                  </button>
                </div>
                <div className="pie-chart">
                  <svg viewBox="0 0 200 200" className="pie-svg">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#667eea"
                      strokeWidth="20"
                      strokeDasharray="175.93 351.86"
                      strokeDashoffset="0"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#48bb78"
                      strokeWidth="20"
                      strokeDasharray="226.19 351.86"
                      strokeDashoffset="-175.93"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#ed8936"
                      strokeWidth="20"
                      strokeDasharray="125.66 351.86"
                      strokeDashoffset="-402.12"
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  
                  <div className="pie-legend">
                    {segmentData.map((segment) => (
                      <div key={`legend-${segment.label}`} className="legend-item">
                        <div 
                          className="legend-color" 
                          style={{ backgroundColor: segment.color }}
                        ></div>
                        <span className="legend-label">{segment.label}</span>
                        <span className="legend-value">{segment.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="activity-section">
            <div className="activity-card">
              <div className="activity-header">
                <h3>Hoạt Động Gần Đây</h3>
                <button className="view-all-btn">Xem tất cả</button>
              </div>
              
              <div className="activity-table">
                <div className="table-header">
                  <div className="table-col">Người dùng</div>
                  <div className="table-col">Hành động</div>
                  <div className="table-col">Đối tượng</div>
                  <div className="table-col">Thời gian</div>
                  <div className="table-col">Trạng thái</div>
                  <div className="table-col">Hành động</div>
                </div>
                
                <div className="table-body">
                  {activities.map((activity) => (
                    <div key={activity.id} className="table-row">
                      <div className="table-cell user-cell">
                        <div className="user-avatar-small">
                          {activity.user.charAt(0)}
                        </div>
                        <span>{activity.user}</span>
                      </div>
                      <div className="table-cell">{activity.action}</div>
                      <div className="table-cell">{activity.target}</div>
                      <div className="table-cell">{activity.time}</div>
                      <div className="table-cell">
                        <span className={`status-badge ${activity.status}`}>
                          {activity.status === 'success' && '✓ Thành công'}
                          {activity.status === 'warning' && '⚠ Cảnh báo'}
                          {activity.status === 'error' && '✗ Lỗi'}
                        </span>
                      </div>
                      <div className="table-cell">
                        <div className="action-buttons">
                          <button className="action-btn-small">
                            <Eye className="action-icon-small" />
                          </button>
                          <button className="action-btn-small">
                            <Edit className="action-icon-small" />
                          </button>
                          <button className="action-btn-small delete">
                            <Trash2 className="action-icon-small" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
