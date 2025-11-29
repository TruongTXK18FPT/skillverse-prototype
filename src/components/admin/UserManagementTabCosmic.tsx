import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, Shield, Search, Filter,
  Eye, Edit, Ban, CheckCircle, XCircle, Key,
  Mail, Phone, Calendar, Activity, Award, BookOpen,
  RefreshCw, X, Save, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import adminUserService from '../../services/adminUserService';
import { AdminUserResponse, AdminUserDetailResponse, PrimaryRole, UserStatus } from '../../types/adminUser';
import DeleteAccountModal from './DeleteAccountModal';
import './UserManagementTabCosmic.css';

const UserManagementTabCosmic: React.FC = () => {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalMentors: 0,
    totalRecruiters: 0,
    totalRegularUsers: 0,
    totalActiveUsers: 0
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetailResponse | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    primaryRole: 'USER' as PrimaryRole
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminUserService.getAllUsers();
      setUsers(response.users);
      setStats({
        totalMentors: response.totalMentors,
        totalRecruiters: response.totalRecruiters,
        totalRegularUsers: response.totalRegularUsers,
        totalActiveUsers: response.totalActiveUsers
      });
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (roleFilter !== 'all') filters.role = roleFilter.toUpperCase();
      if (statusFilter !== 'all') filters.status = statusFilter.toUpperCase();
      if (searchTerm.trim()) filters.search = searchTerm.trim();

      const response = await adminUserService.getAllUsers(filters);
      setUsers(response.users);
      setStats({
        totalMentors: response.totalMentors,
        totalRecruiters: response.totalRecruiters,
        totalRegularUsers: response.totalRegularUsers,
        totalActiveUsers: response.totalActiveUsers
      });
    } catch (error: any) {
      console.error('❌ Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (userId: number) => {
    try {
      setActionLoading(true);
      const detail = await adminUserService.getUserDetailById(userId);
      setSelectedUser(detail);
      setShowDetailModal(true);
    } catch (error: any) {
      console.error('❌ Error fetching user detail:', error);
      alert('Không thể tải thông tin chi tiết user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (userId: number) => {
    try {
      setActionLoading(true);
      const detail = await adminUserService.getUserDetailById(userId);
      setSelectedUser(detail);
      setEditForm({
        firstName: detail.firstName || '',
        lastName: detail.lastName || '',
        email: detail.email,
        phoneNumber: detail.phoneNumber || '',
        primaryRole: detail.primaryRole
      });
      setShowEditModal(true);
    } catch (error: any) {
      console.error('❌ Error fetching user for edit:', error);
      alert('Không thể tải thông tin user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await adminUserService.updateUserProfile({
        userId: selectedUser.id,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
        reason: 'Admin update'
      });

      if (editForm.primaryRole !== selectedUser.primaryRole) {
        await adminUserService.updateUserRole({
          userId: selectedUser.id,
          primaryRole: editForm.primaryRole,
          reason: 'Admin role change'
        });
      }

      await fetchUsers();
      setShowEditModal(false);
      alert('✅ Cập nhật thành công!');
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      alert(error.response?.data?.message || 'Lỗi khi cập nhật user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async (userId: number) => {
    if (!confirm('Bạn có chắc muốn cấm user này?')) return;

    try {
      setActionLoading(true);
      await adminUserService.banUser(userId, 'Banned by admin');
      await fetchUsers();
      alert('✅ Đã cấm user');
    } catch (error: any) {
      console.error('❌ Error banning user:', error);
      alert('Lỗi khi cấm user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      setActionLoading(true);
      await adminUserService.unbanUser(userId, 'Unbanned by admin');
      await fetchUsers();
      alert('✅ Đã kích hoạt user');
    } catch (error: any) {
      console.error('❌ Error unbanning user:', error);
      alert('Lỗi khi kích hoạt user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
    if (!newPassword || newPassword.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setActionLoading(true);
      await adminUserService.resetUserPassword({
        userId,
        newPassword,
        reason: 'Admin reset password'
      });
      alert('✅ Đã reset mật khẩu');
    } catch (error: any) {
      console.error('❌ Error resetting password:', error);
      alert('Lỗi khi reset mật khẩu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDeleteModal = (userId: number, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setActionLoading(true);
      await adminUserService.permanentlyDeleteUser(userToDelete.id);
      await fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
      alert('✅ Đã xóa vĩnh viễn tài khoản');
    } catch (error: any) {
      console.error('❌ Error permanently deleting user:', error);
      alert(error.response?.data?.message || 'Lỗi khi xóa tài khoản');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const getRoleIcon = (role: PrimaryRole) => {
    switch (role) {
      case 'ADMIN': return <Shield size={18} />;
      case 'MENTOR': return <UserCheck size={18} />;
      case 'RECRUITER': return <Users size={18} />;
      default: return <Users size={18} />;
    }
  };

  const getRoleLabel = (role: PrimaryRole) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'MENTOR': return 'Mentor';
      case 'RECRUITER': return 'Doanh nghiệp';
      case 'USER': return 'Học viên';
      default: return role;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    if (status === 'ACTIVE') {
      return (
        <span className="admin-status-badge active">
          <CheckCircle size={16} />
          Hoạt động
        </span>
      );
    }
    return (
      <span className="admin-status-badge inactive">
        <XCircle size={16} />
        Không hoạt động
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Pagination logic
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  if (loading && users.length === 0) {
    return (
      <div className="admin-user-management-cosmic">
        <div className="admin-loading-state">
          <RefreshCw size={48} className="spinning" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-management-cosmic">
      {/* Header */}
      <div className="admin-user-header">
        <div>
          <h2>Quản Lý Người Dùng</h2>
          <p>Quản lý tất cả tài khoản người dùng trên hệ thống</p>
        </div>
        <button className="admin-refresh-btn" onClick={fetchUsers} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="admin-user-stats">
        <div className="admin-stat-card mentors">
          <UserCheck size={32} />
          <div>
            <div className="admin-stat-number">{stats.totalMentors}</div>
            <div className="admin-stat-label">Mentors</div>
          </div>
        </div>
        <div className="admin-stat-card recruiters">
          <Users size={32} />
          <div>
            <div className="admin-stat-number">{stats.totalRecruiters}</div>
            <div className="admin-stat-label">Doanh nghiệp</div>
          </div>
        </div>
        <div className="admin-stat-card users">
          <Users size={32} />
          <div>
            <div className="admin-stat-number">{stats.totalRegularUsers}</div>
            <div className="admin-stat-label">Học viên</div>
          </div>
        </div>
        <div className="admin-stat-card active">
          <Activity size={32} />
          <div>
            <div className="admin-stat-number">{stats.totalActiveUsers}</div>
            <div className="admin-stat-label">Đang hoạt động</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-user-filters">
        <div className="admin-search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-status-filters">
          <Filter size={20} />
          <button
            className={`admin-filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            Tất cả vai trò
          </button>
          <button
            className={`admin-filter-btn ${roleFilter === 'mentor' ? 'active' : ''}`}
            onClick={() => setRoleFilter('mentor')}
          >
            Mentor
          </button>
          <button
            className={`admin-filter-btn ${roleFilter === 'recruiter' ? 'active' : ''}`}
            onClick={() => setRoleFilter('recruiter')}
          >
            Doanh nghiệp
          </button>
          <button
            className={`admin-filter-btn ${roleFilter === 'user' ? 'active' : ''}`}
            onClick={() => setRoleFilter('user')}
          >
            Học viên
          </button>
        </div>

        <div className="admin-status-filters">
          <button
            className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả trạng thái
          </button>
          <button
            className={`admin-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Hoạt động
          </button>
          <button
            className={`admin-filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Không hoạt động
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-users-table">
        <table>
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
            {currentUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="admin-user-info">
                    <div className="admin-user-avatar">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} />
                      ) : (
                        user.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="admin-user-name">{user.fullName}</span>
                  </div>
                </td>
                <td>
                  <div className="admin-user-email">
                    <Mail size={14} />
                    {user.email}
                  </div>
                </td>
                <td>
                  <span className={`admin-role-badge ${user.primaryRole.toLowerCase()}`}>
                    {getRoleIcon(user.primaryRole)}
                    {getRoleLabel(user.primaryRole)}
                  </span>
                </td>
                <td>{getStatusBadge(user.status)}</td>
                <td>
                  <div className="admin-date-cell">
                    <Calendar size={14} />
                    {formatDate(user.createdAt)}
                  </div>
                </td>
                <td>
                  <div className="admin-date-cell">
                    <Activity size={14} />
                    {formatDate(user.lastActive)}
                  </div>
                </td>
                <td>
                  <div className="admin-action-buttons">
                    <button
                      className="admin-action-btn view"
                      onClick={() => handleViewDetail(user.id)}
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="admin-action-btn edit"
                      onClick={() => handleEditUser(user.id)}
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    {user.status === 'ACTIVE' ? (
                      <button
                        className="admin-action-btn ban"
                        onClick={() => handleBanUser(user.id)}
                        title="Cấm tài khoản"
                      >
                        <Ban size={16} />
                      </button>
                    ) : (
                      <button
                        className="admin-action-btn unban"
                        onClick={() => handleUnbanUser(user.id)}
                        title="Kích hoạt"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button
                      className="admin-action-btn reset"
                      onClick={() => handleResetPassword(user.id)}
                      title="Reset mật khẩu"
                    >
                      <Key size={16} />
                    </button>
                    {user.status === 'INACTIVE' && (
                      <button
                        className="admin-action-btn delete"
                        onClick={() => handleOpenDeleteModal(user.id, user.fullName)}
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
            Trước
          </button>

          <div className="admin-pagination-info">
            <span>Trang {currentPage} / {totalPages}</span>
            <span className="admin-pagination-total">({users.length} người dùng)</span>
          </div>

          <button
            className="admin-pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {users.length === 0 && !loading && (
        <div className="admin-empty-state">
          <Users size={64} />
          <h3>Không tìm thấy người dùng</h3>
          <p>Thử thay đổi bộ lọc hoặc tìm kiếm</p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Chi Tiết Người Dùng</h3>
              <button className="admin-close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Basic Info */}
              <div className="admin-detail-section">
                <h4>Thông Tin Cơ Bản</h4>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <Users size={18} />
                    <div>
                      <div className="label">Họ tên</div>
                      <div className="value">{selectedUser.fullName}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <Mail size={18} />
                    <div>
                      <div className="label">Email</div>
                      <div className="value">{selectedUser.email}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <Phone size={18} />
                    <div>
                      <div className="label">Số điện thoại</div>
                      <div className="value">{selectedUser.phoneNumber || 'Chưa có'}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <Shield size={18} />
                    <div>
                      <div className="label">Vai trò</div>
                      <div className="value">{getRoleLabel(selectedUser.primaryRole)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="admin-detail-section">
                <h4>Thống Kê</h4>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <BookOpen size={18} />
                    <div>
                      <div className="label">Khóa học tạo</div>
                      <div className="value">{selectedUser.coursesCreated}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <BookOpen size={18} />
                    <div>
                      <div className="label">Khóa học đăng ký</div>
                      <div className="value">{selectedUser.coursesEnrolled}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <Award size={18} />
                    <div>
                      <div className="label">Chứng chỉ</div>
                      <div className="value">{selectedUser.certificatesEarned}</div>
                    </div>
                  </div>
                  <div className="admin-detail-item">
                    <Calendar size={18} />
                    <div>
                      <div className="label">Ngày tham gia</div>
                      <div className="value">{formatDate(selectedUser.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Courses */}
              {selectedUser.recentCourses && selectedUser.recentCourses.length > 0 && (
                <div className="admin-detail-section">
                  <h4>Khóa Học Gần Đây</h4>
                  <div className="admin-courses-list">
                    {selectedUser.recentCourses.map((course) => (
                      <div key={course.courseId} className="admin-course-item">
                        <BookOpen size={16} />
                        <div className="course-info">
                          <div className="course-title">{course.courseTitle}</div>
                          <div className="course-progress">Tiến độ: {course.progress}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Certificates */}
              {selectedUser.recentCertificates && selectedUser.recentCertificates.length > 0 && (
                <div className="admin-detail-section">
                  <h4>Chứng Chỉ Gần Đây</h4>
                  <div className="admin-certificates-list">
                    {selectedUser.recentCertificates.map((cert) => (
                      <div key={cert.certificateId} className="admin-certificate-item">
                        <Award size={16} />
                        <div className="cert-info">
                          <div className="cert-course">{cert.courseName}</div>
                          <div className="cert-date">{formatDate(cert.issuedAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="admin-action-btn close" onClick={() => setShowDetailModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Chỉnh Sửa Người Dùng</h3>
              <button className="admin-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-edit-form">
                <div className="admin-form-group">
                  <label>Họ</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    placeholder="Nhập họ"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Tên</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    placeholder="Nhập tên"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Nhập email"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Vai trò</label>
                  <select
                    value={editForm.primaryRole}
                    onChange={(e) => setEditForm({ ...editForm, primaryRole: e.target.value as PrimaryRole })}
                  >
                    <option value="USER">Học viên</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="RECRUITER">Doanh nghiệp</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-action-btn close" onClick={() => setShowEditModal(false)}>
                Hủy
              </button>
              <button
                className="admin-action-btn save"
                onClick={handleSaveEdit}
                disabled={actionLoading}
              >
                <Save size={16} />
                {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        userName={userToDelete?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default UserManagementTabCosmic;
