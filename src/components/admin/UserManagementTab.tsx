import React, { useState } from 'react';
import './UserManagementTab.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'mentor' | 'business' | 'student';
  status: 'active' | 'banned' | 'pending';
  joinDate: string;
  lastActive: string;
  avatar?: string;
}

const UserManagementTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'Nguyễn Văn An',
      email: 'an.nguyen@email.com',
      role: 'mentor',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2025-07-02',
    },
    {
      id: '2',
      name: 'Trần Thị Bình',
      email: 'binh.tran@email.com',
      role: 'business',
      status: 'active',
      joinDate: '2024-02-20',
      lastActive: '2025-07-01',
    },
    {
      id: '3',
      name: 'Lê Văn Cường',
      email: 'cuong.le@email.com',
      role: 'student',
      status: 'pending',
      joinDate: '2025-06-30',
      lastActive: '2025-07-03',
    },
    {
      id: '4',
      name: 'Phạm Thị Dung',
      email: 'dung.pham@email.com',
      role: 'mentor',
      status: 'banned',
      joinDate: '2024-03-10',
      lastActive: '2025-06-15',
    },
    {
      id: '5',
      name: 'Hoàng Văn Em',
      email: 'em.hoang@email.com',
      role: 'student',
      status: 'active',
      joinDate: '2024-05-05',
      lastActive: '2025-07-03',
    },
  ]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = (userId: string, action: string) => {
    console.log(`Performing ${action} on user ${userId}`);
    // In real app, make API call to perform action
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'mentor': return '#667eea';
      case 'business': return '#43e97b';
      case 'student': return '#fa709a';
      default: return '#7f8c8d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#43e97b';
      case 'banned': return '#ff6b6b';
      case 'pending': return '#ffa726';
      default: return '#7f8c8d';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'mentor': return 'Mentor';
      case 'business': return 'Doanh nghiệp';
      case 'student': return 'Học viên';
      default: return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'banned': return 'Bị cấm';
      case 'pending': return 'Chờ duyệt';
      default: return status;
    }
  };

  const renderBanButton = (user: User) => {
    if (user.status === 'active') {
      return (
        <button 
          className="administrator-action-btn administrator-ban-btn"
          onClick={() => handleUserAction(user.id, 'ban')}
          title="Cấm tài khoản"
        >
          🚫
        </button>
      );
    } else if (user.status === 'banned') {
      return (
        <button 
          className="administrator-action-btn administrator-unban-btn"
          onClick={() => handleUserAction(user.id, 'unban')}
          title="Bỏ cấm tài khoản"
        >
          ✅
        </button>
      );
    }
    return null;
  };

  return (
    <div className="administrator-user-management">
      <div className="administrator-user-header">
        <h2>Quản Lý Người Dùng</h2>
        <p>Quản lý tất cả tài khoản người dùng trên nền tảng</p>
      </div>

      <div className="administrator-user-controls">
        <div className="administrator-search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="administrator-search-input"
          />
          <span className="administrator-search-icon">🔍</span>
        </div>

        <div className="administrator-filters">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="administrator-filter-select"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="mentor">Mentor</option>
            <option value="business">Doanh nghiệp</option>
            <option value="student">Học viên</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="administrator-filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="pending">Chờ duyệt</option>
            <option value="banned">Bị cấm</option>
          </select>
        </div>
      </div>

      <div className="administrator-user-stats">
        <div className="administrator-stat-item">
          <span className="administrator-stat-number">{users.filter(u => u.role === 'mentor').length}</span>
          <span className="administrator-stat-label">Mentors</span>
        </div>
        <div className="administrator-stat-item">
          <span className="administrator-stat-number">{users.filter(u => u.role === 'business').length}</span>
          <span className="administrator-stat-label">Doanh nghiệp</span>
        </div>
        <div className="administrator-stat-item">
          <span className="administrator-stat-number">{users.filter(u => u.role === 'student').length}</span>
          <span className="administrator-stat-label">Học viên</span>
        </div>
        <div className="administrator-stat-item">
          <span className="administrator-stat-number">{users.filter(u => u.status === 'active').length}</span>
          <span className="administrator-stat-label">Đang hoạt động</span>
        </div>
      </div>

      <div className="administrator-user-table-container">
        <table className="administrator-user-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tham gia</th>
              <th>Hoạt động cuối</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="administrator-user-row">
                <td>
                  <div className="administrator-user-info">
                    <div className="administrator-user-avatar">
                      {user.name.charAt(0)}
                    </div>
                    <span className="administrator-user-name">{user.name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span 
                    className="administrator-role-badge"
                    style={{ backgroundColor: getRoleColor(user.role) }}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>
                  <span 
                    className="administrator-status-badge"
                    style={{ backgroundColor: getStatusColor(user.status) }}
                  >
                    {getStatusLabel(user.status)}
                  </span>
                </td>
                <td>{new Date(user.joinDate).toLocaleDateString('vi-VN')}</td>
                <td>{new Date(user.lastActive).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div className="administrator-action-buttons">
                    <button 
                      className="administrator-action-btn administrator-view-btn"
                      onClick={() => handleUserAction(user.id, 'view')}
                      title="Xem hồ sơ"
                    >
                      👁️
                    </button>
                    {renderBanButton(user)}
                    <button 
                      className="administrator-action-btn administrator-reset-btn"
                      onClick={() => handleUserAction(user.id, 'reset-password')}
                      title="Đặt lại mật khẩu"
                    >
                      🔑
                    </button>
                    <button 
                      className="administrator-action-btn administrator-edit-btn"
                      onClick={() => handleUserAction(user.id, 'edit-role')}
                      title="Chỉnh sửa vai trò"
                    >
                      ✏️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="administrator-no-results">
          <p>Không tìm thấy người dùng nào phù hợp với bộ lọc.</p>
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;
