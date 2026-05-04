import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Users, UserCheck, Shield, Search, Filter,
  Eye, Edit, Ban, CheckCircle, XCircle, Key,
  Mail, Phone, Calendar, Activity, Award, BookOpen,
  RefreshCw, X, Save, ChevronLeft, ChevronRight, Trash2, Download, Gift,
  FileText, Briefcase, Building, Star
} from 'lucide-react';
import adminUserService from '../../services/adminUserService';
import walletService from '../../services/walletService';
import { AdminUserResponse, AdminUserDetailResponse, PrimaryRole, UserStatus } from '../../types/adminUser';
import DeleteAccountModal from './DeleteAccountModal';
import AdminSecurityGateModal from './AdminSecurityGateModal';
import { confirmAction } from '../../context/ConfirmDialogContext';
import { getStoredUserRaw } from '../../utils/authStorage';
import {
  showAppError,
  showAppSuccess,
  showAppWarning,
} from '../../context/ToastContext';
import { useScrollToListTopOnPagination } from '../../hooks/useScrollToListTopOnPagination';
import './UserManagementTabCosmic.css';

// Sub-admin role whitelist (same as BE) - defined outside component to avoid recreating on every render
const SUB_ADMIN_ROLES: readonly string[] = ['USER_ADMIN', 'CONTENT_ADMIN', 'COMMUNITY_ADMIN', 
                           'FINANCE_ADMIN', 'PREMIUM_ADMIN', 'AI_ADMIN', 
                           'SUPPORT_ADMIN', 'SYSTEM_ADMIN'];

const availableAdminRoles = [
  { value: 'USER_ADMIN', label: 'User Admin (Quản lý User)' },
  { value: 'CONTENT_ADMIN', label: 'Content Admin (Duyệt Content)' },
  { value: 'COMMUNITY_ADMIN', label: 'Community Admin (Cộng đồng)' },
  { value: 'FINANCE_ADMIN', label: 'Finance Admin (Tài chính)' },
  { value: 'PREMIUM_ADMIN', label: 'Premium Admin (Gói cước)' },
  { value: 'AI_ADMIN', label: 'AI Admin (AI Experts)' },
  { value: 'SUPPORT_ADMIN', label: 'Support Admin (Hỗ trợ)' },
  { value: 'SYSTEM_ADMIN', label: 'System Admin (Hệ thống)' }
];

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
  const [itemsPerPage] = useState(5);
  const { withPaginationScroll } = useScrollToListTopOnPagination();

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

  // Gift Modal state
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftForm, setGiftForm] = useState({
    cashAmount: 0,
    coinAmount: 0,
    reason: 'Admin gift'
  });
  const [userToGift, setUserToGift] = useState<{ id: number; name: string } | null>(null);

  // Security Modal state
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [pendingGiftUser, setPendingGiftUser] = useState<{ id: number; name: string } | null>(null);

  // Role Assignment Modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [userToAssignRole, setUserToAssignRole] = useState<{ id: number; name: string } | null>(null);

  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string; title: string }>({
    show: false,
    message: '',
    title: ''
  });

  // Get current user from storage to check permissions
  const currentUserStr = getStoredUserRaw();
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isSuperAdmin = currentUser?.roles?.includes('ADMIN');
  const currentUserId = currentUser?.id;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, roleFilter, statusFilter]);

  // Scroll lock for modals
  useEffect(() => {
    if (showDetailModal || showEditModal || showDeleteModal || showGiftModal || showSecurityModal || showRoleModal || successModal.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal, showEditModal, showDeleteModal, showGiftModal, showSecurityModal, showRoleModal, successModal.show]);

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
      showAppError('Không thể tải chi tiết user', 'Vui lòng thử lại.');
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
      showAppError('Không thể tải thông tin user', 'Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRoleModal = async (user: AdminUserResponse) => {
    try {
      setActionLoading(true);
      const detail = await adminUserService.getUserDetailById(user.id);
      setUserToAssignRole({ id: user.id, name: user.fullName });
      
      // Pre-select existing sub-admin roles only (filter out USER, MENTOR, RECRUITER, ADMIN, PARENT)
      if (detail.roles) {
        const subAdminRolesOnly = detail.roles.filter((role: string) => SUB_ADMIN_ROLES.includes(role));
        setSelectedRoles(subAdminRolesOnly);
      } else {
        setSelectedRoles([]);
      }
      
      setShowRoleModal(true);
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
      showAppError('Không thể tải quyền hạn', 'Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRoles = async () => {
    if (!userToAssignRole) {
      showAppWarning('Lỗi', 'Không có người dùng được chọn.');
      return;
    }

    try {
      setActionLoading(true);
      await adminUserService.setSubAdminRoles(userToAssignRole.id, selectedRoles);
      setShowRoleModal(false);
      setSuccessModal({
        show: true,
        title: 'Phân Quyền Thành Công',
        message: `Đã cập nhật quyền admin cho ${userToAssignRole.name}. Người dùng cần đăng nhập lại để áp dụng quyền mới.`
      });
      fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error('Failed to assign roles:', error);
      showAppError('Cập nhật quyền thất bại', error.message || 'Lỗi không xác định');
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
      showAppSuccess('Cập nhật thành công', 'Thông tin user đã được cập nhật.');
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      showAppError(
        'Lỗi khi cập nhật user',
        error.response?.data?.message || 'Vui lòng thử lại.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenGiftModal = (userId: number, userName: string) => {
    // Instead of opening gift modal directly, open security gate first
    setPendingGiftUser({ id: userId, name: userName });
    setShowSecurityModal(true);
  };

  const handleSecuritySuccess = () => {
    if (pendingGiftUser) {
        setShowSecurityModal(false);
        setUserToGift(pendingGiftUser);
        setGiftForm({ cashAmount: 0, coinAmount: 0, reason: 'Admin gift' });
        setShowGiftModal(true);
        setPendingGiftUser(null);
    }
  };

  const handleSendGift = async () => {
    if (!userToGift) return;
    if (giftForm.cashAmount <= 0 && giftForm.coinAmount <= 0) {
        showAppWarning('Thiếu giá trị quà tặng', 'Vui lòng nhập số tiền hoặc xu > 0.');
        return;
    }

    try {
      setActionLoading(true);
      await walletService.adminGiftUser({
        userId: userToGift.id,
        cashAmount: giftForm.cashAmount,
        coinAmount: giftForm.coinAmount,
        reason: giftForm.reason
      });
      showAppSuccess('Tặng quà thành công', `Đã tặng quà cho ${userToGift.name}.`);
      setShowGiftModal(false);
    } catch (error: any) {
      console.error('❌ Error gifting user:', error);
      showAppError('Lỗi khi tặng quà', error.message || 'Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async (userId: number) => {
    if (!(await confirmAction('Bạn có chắc muốn cấm user này?'))) return;

    try {
      setActionLoading(true);
      await adminUserService.banUser(userId, 'Banned by admin');
      await fetchUsers();
      showAppSuccess('Đã cấm user', 'Tài khoản đã bị khóa.');
    } catch (error: any) {
      console.error('❌ Error banning user:', error);
      showAppError('Lỗi khi cấm user', 'Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      setActionLoading(true);
      await adminUserService.unbanUser(userId, 'Unbanned by admin');
      await fetchUsers();
      showAppSuccess('Đã kích hoạt user', 'Tài khoản đã được mở lại.');
    } catch (error: any) {
      console.error('❌ Error unbanning user:', error);
      showAppError('Lỗi khi kích hoạt user', 'Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
    if (!newPassword || newPassword.length < 6) {
      showAppWarning('Mật khẩu không hợp lệ', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      setActionLoading(true);
      await adminUserService.resetUserPassword({
        userId,
        newPassword,
        reason: 'Admin reset password'
      });
      showAppSuccess('Đã reset mật khẩu', 'Mật khẩu mới đã được cập nhật.');
    } catch (error: any) {
      console.error('❌ Error resetting password:', error);
      showAppError('Lỗi khi reset mật khẩu', 'Vui lòng thử lại.');
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
      showAppSuccess('Đã xóa tài khoản', 'Tài khoản đã bị xóa vĩnh viễn.');
    } catch (error: any) {
      console.error('❌ Error permanently deleting user:', error);
      showAppError(
        'Lỗi khi xóa tài khoản',
        error.response?.data?.message || 'Vui lòng thử lại.',
      );
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
        <div className="admin-header-actions">
          <button className="admin-refresh-btn" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Làm mới
          </button>
          <button
            className="admin-download-btn"
            onClick={() => {
              const params: any = {};
              if (roleFilter !== 'all') params.role = roleFilter.toUpperCase();
              if (statusFilter !== 'all') params.status = statusFilter.toUpperCase();
              if (searchTerm.trim()) params.search = searchTerm.trim();
              import('../../services/adminService').then(({ default: adminService }) => {
                adminService.downloadUsersReport(params);
              });
            }}
            disabled={loading}
            title="Tải báo cáo người dùng (CSV)"
          >
            <Download size={18} />
            Tải báo cáo
          </button>
          <button
            className="admin-download-btn"
            onClick={() => {
              const params: any = {};
              if (roleFilter !== 'all') params.role = roleFilter.toUpperCase();
              if (statusFilter !== 'all') params.status = statusFilter.toUpperCase();
              if (searchTerm.trim()) params.search = searchTerm.trim();
              import('../../services/adminService').then(({ default: adminService }) => {
                adminService.downloadUsersReportPdf(params);
              });
            }}
            disabled={loading}
            title="Tải báo cáo người dùng (PDF)"
          >
            <Download size={18} />
            Tải PDF
          </button>
        </div>
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

      {/* Filters - 2 columns: left search, right filters (2 rows) */}
      <div className="admin-user-filters-grid">
        <div className="admin-user-filters-left">
          <div className="admin-search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="admin-user-filters-right">
          <div className="admin-filter-row">
            <Filter size={20} />
            <span style={{ fontWeight: 500, marginRight: 8 }}>Vai trò:</span>
            <button
              className={`admin-filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >Tất cả</button>
            <button
              className={`admin-filter-btn ${roleFilter === 'mentor' ? 'active' : ''}`}
              onClick={() => setRoleFilter('mentor')}
            >Mentor</button>
            <button
              className={`admin-filter-btn ${roleFilter === 'recruiter' ? 'active' : ''}`}
              onClick={() => setRoleFilter('recruiter')}
            >Doanh nghiệp</button>
            <button
              className={`admin-filter-btn ${roleFilter === 'user' ? 'active' : ''}`}
              onClick={() => setRoleFilter('user')}
            >Học viên</button>
            <button
              className={`admin-filter-btn ${roleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setRoleFilter('admin')}
            >Quản trị</button>
          </div>
          <div className="admin-filter-row">
            <span style={{ fontWeight: 500, marginRight: 8 }}>Trạng thái:</span>
            <button
              className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >Tất cả</button>
            <button
              className={`admin-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >Hoạt động</button>
            <button
              className={`admin-filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('inactive')}
            >Không hoạt động</button>
          </div>
        </div>
      </div>

      {/* Table - only 5 columns, actions in dropdown below */}
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
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <React.Fragment key={user.id}>
                <tr>
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
                    <div className="admin-user-role-badge" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={`admin-role-badge ${user.primaryRole.toLowerCase()}`}>
                        {getRoleIcon(user.primaryRole)}
                        {getRoleLabel(user.primaryRole)}
                      </span>
                      {user.roles && user.roles.length > 0 && user.roles.filter(r => r !== user.primaryRole && r.includes('ADMIN')).map(role => (
                        <span key={role} className="admin-role-badge admin-sub" style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                          <Shield size={10} style={{ marginRight: '3px' }} />
                          {role.replace('_ADMIN', '')}
                        </span>
                      ))}
                    </div>
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
                </tr>
                <tr className="admin-user-actions-row">
                  <td colSpan={6} style={{ padding: 0, background: 'transparent' }}>
                    <div className="admin-action-dropdown-wrapper">
                      <details className="admin-usermgmt-action-dropdown">
                        <summary className="admin-action-dropdown-btn">Hành động</summary>
                        <div className="admin-action-buttons-row">
                          <button
                            className="admin-action-btn view"
                            onClick={() => handleViewDetail(user.id)}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} /> Xem chi tiết
                          </button>
                          <button
                            className="admin-action-btn gift"
                            onClick={() => handleOpenGiftModal(user.id, user.fullName)}
                            title="Tặng quà (Xu/Tiền)"
                            style={{ color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)' }}
                          >
                            <Gift size={16} /> Tặng quà
                          </button>
                          <button
                            className="admin-action-btn edit"
                            onClick={() => handleEditUser(user.id)}
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} /> Chỉnh sửa
                          </button>
                          {user.status === 'ACTIVE' ? (
                            <button
                              className="admin-action-btn ban"
                              onClick={() => handleBanUser(user.id)}
                              title="Cấm tài khoản"
                            >
                              <Ban size={16} /> Cấm
                            </button>
                          ) : (
                            <button
                              className="admin-action-btn unban"
                              onClick={() => handleUnbanUser(user.id)}
                              title="Kích hoạt"
                            >
                              <CheckCircle size={16} /> Kích hoạt
                            </button>
                          )}
                          {isSuperAdmin && user.id !== currentUserId && (
                            <button
                              className="admin-action-btn edit"
                              onClick={() => handleOpenRoleModal(user)}
                              title="Phân quyền Admin"
                            >
                              <Shield size={16} /> Phân quyền
                            </button>
                          )}
                          <button
                            className="admin-action-btn reset"
                            onClick={() => handleResetPassword(user.id)}
                            title="Reset mật khẩu"
                          >
                            <Key size={16} /> Reset mật khẩu
                          </button>
                          {user.status === 'INACTIVE' && (
                            <button
                              className="admin-action-btn delete"
                              onClick={() => handleOpenDeleteModal(user.id, user.fullName)}
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 size={16} /> Xóa vĩnh viễn
                            </button>
                          )}
                        </div>
                      </details>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-pagination-btn"
            onClick={withPaginationScroll(() => setCurrentPage(p => Math.max(1, p - 1)))}
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
            onClick={withPaginationScroll(() => setCurrentPage(p => Math.min(totalPages, p + 1)))}
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
      {showDetailModal && selectedUser && ReactDOM.createPortal(
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

              {/* Mentor Specific Info */}
              {selectedUser.primaryRole === 'MENTOR' && (
                <div className="admin-detail-section">
                  <h4>Thông Tin Mentor</h4>
                  <div className="admin-detail-grid">
                    <div className="admin-detail-item">
                      <Shield size={18} />
                      <div>
                        <div className="label">Trạng thái CCCD</div>
                        <div className="value">
                          {selectedUser.identityVerified ? (
                            <span style={{ color: '#10b981' }}>Đã xác thực</span>
                          ) : selectedUser.cccdExtractedData ? (
                            <span style={{ color: '#f59e0b' }}>Chờ xác thực</span>
                          ) : (
                            <span style={{ color: '#ef4444' }}>Chưa cập nhật</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedUser.cccdNumber && (
                      <div className="admin-detail-item">
                        <FileText size={18} />
                        <div>
                          <div className="label">Số CCCD</div>
                          <div className="value">{selectedUser.cccdNumber}</div>
                        </div>
                      </div>
                    )}
                    {selectedUser.yearsOfExperience !== undefined && (
                      <div className="admin-detail-item">
                        <Briefcase size={18} />
                        <div>
                          <div className="label">Kinh nghiệm</div>
                          <div className="value">{selectedUser.yearsOfExperience} năm</div>
                        </div>
                      </div>
                    )}
                    {selectedUser.mentorSkills && (
                      <div className="admin-detail-item" style={{ gridColumn: '1 / -1' }}>
                        <Star size={18} />
                        <div>
                          <div className="label">Kỹ năng</div>
                          <div className="value">{selectedUser.mentorSkills}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recruiter Specific Info */}
              {selectedUser.primaryRole === 'RECRUITER' && (
                <div className="admin-detail-section">
                  <h4>Thông Tin Doanh Nghiệp</h4>
                  <div className="admin-detail-grid">
                    <div className="admin-detail-item">
                      <Building size={18} />
                      <div>
                        <div className="label">Tên công ty</div>
                        <div className="value">{selectedUser.companyName || 'Chưa cập nhật'}</div>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <FileText size={18} />
                      <div>
                        <div className="label">Mã số thuế</div>
                        <div className="value">{selectedUser.taxCode || 'Chưa cập nhật'}</div>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <Briefcase size={18} />
                      <div>
                        <div className="label">Lĩnh vực</div>
                        <div className="value">{selectedUser.industry || 'Chưa cập nhật'}</div>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <Shield size={18} />
                      <div>
                        <div className="label">Trạng thái xác thực</div>
                        <div className="value">
                          {selectedUser.companyVerified ? (
                            <span style={{ color: '#10b981' }}>Đã xác thực</span>
                          ) : (
                            <span style={{ color: '#f59e0b' }}>Chưa xác thực</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && ReactDOM.createPortal(
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
        </div>,
        document.body
      )}

      {/* Gift Modal */}
      {showGiftModal && userToGift && ReactDOM.createPortal(
        <div className="admin-modal-overlay" onClick={() => setShowGiftModal(false)}>
          <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Tặng Quà Cho {userToGift.name}</h3>
              <button className="admin-close-btn" onClick={() => setShowGiftModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-edit-form">
                <div className="admin-form-group">
                  <label>Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    value={giftForm.cashAmount}
                    onChange={(e) => setGiftForm({ ...giftForm, cashAmount: Number(e.target.value) })}
                    placeholder="Nhập số tiền"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Số Xu (SkillCoin)</label>
                  <input
                    type="number"
                    value={giftForm.coinAmount}
                    onChange={(e) => setGiftForm({ ...giftForm, coinAmount: Number(e.target.value) })}
                    placeholder="Nhập số xu"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Lý do</label>
                  <input
                    type="text"
                    value={giftForm.reason}
                    onChange={(e) => setGiftForm({ ...giftForm, reason: e.target.value })}
                    placeholder="Nhập lý do tặng"
                  />
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-action-btn close" onClick={() => setShowGiftModal(false)}>
                Hủy
              </button>
              <button
                className="admin-action-btn save"
                onClick={handleSendGift}
                disabled={actionLoading}
                style={{ background: '#F59E0B' }}
              >
                <Gift size={16} />
                {actionLoading ? 'Đang gửi...' : 'Gửi quà tặng'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        userName={userToDelete?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={actionLoading}
      />

      {/* Security Gate Modal */}
      <AdminSecurityGateModal
        isOpen={showSecurityModal}
        onClose={() => {
            setShowSecurityModal(false);
            setPendingGiftUser(null);
        }}
        onSuccess={handleSecuritySuccess}
        title="Xác thực Admin"
        description="Tính năng tặng quà yêu cầu quyền truy cập cấp cao. Vui lòng nhập mã bảo mật để tiếp tục."
        requiredKey={import.meta.env.VITE_ADMIN_GIFT_SECRET}
      />

      {/* Assign Role Modal */}
      {showRoleModal && userToAssignRole && ReactDOM.createPortal(
        <div className="admin-modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Phân Quyền Admin - {userToAssignRole.name}</h3>
              <button className="admin-close-btn" onClick={() => setShowRoleModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="admin-modal-body">
              <p style={{ color: '#aaa', marginBottom: '1rem' }}>
                Chọn các quyền quản trị viên bổ sung cho người dùng này.
                Người dùng sẽ có quyền truy cập vào các tab tương ứng.
              </p>
              
              <div className="admin-role-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {availableAdminRoles.map((role) => (
                  <label 
                    key={role.value} 
                    className={`admin-role-card ${selectedRoles.includes(role.value) ? 'selected' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      background: selectedRoles.includes(role.value) ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: selectedRoles.includes(role.value) ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.value)}
                      onChange={(e) => {
                        const roleValue = role.value;
                        setSelectedRoles(prev => 
                          e.target.checked 
                            ? [...prev, roleValue]
                            : prev.filter(r => r !== roleValue)
                        );
                      }}
                      style={{ marginRight: '10px', width: '18px', height: '18px' }}
                    />
                    <span style={{ color: '#fff' }}>{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-action-btn close" onClick={() => setShowRoleModal(false)}>
                Hủy
              </button>
              <button
                className="admin-action-btn save"
                onClick={handleSubmitRoles}
                disabled={actionLoading}
              >
                <Shield size={16} />
                {actionLoading ? 'Đang lưu...' : 'Lưu quyền'}
              </button>
            </div>
          </div>
        </div>,
        document.body
       )}

      {/* Success Modal */}
      {successModal.show && ReactDOM.createPortal(
        <div className="admin-modal-overlay" onClick={() => setSuccessModal({ ...successModal, show: false })}>
          <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="admin-modal-body" style={{ padding: '2rem' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'rgba(16, 185, 129, 0.2)', 
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <CheckCircle size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>{successModal.title}</h3>
              <p style={{ color: '#aaa', marginBottom: '2rem' }}>{successModal.message}</p>
              <button 
                className="admin-action-btn save" 
                onClick={() => setSuccessModal({ ...successModal, show: false })}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

     </div>
   );
};

export default UserManagementTabCosmic;
