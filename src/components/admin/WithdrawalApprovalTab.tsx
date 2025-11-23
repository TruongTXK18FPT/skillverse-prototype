import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Clock, CheckCircle, XCircle, Eye, 
  Building2, CreditCard, User, Calendar,
  Filter, Search, RefreshCw
} from 'lucide-react';
import walletService from '../../services/walletService';
import { WithdrawalRequestResponse } from '../../data/walletDTOs';
import './WithdrawalApprovalTabCosmic.css';

const WithdrawalApprovalTab: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequestResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchWithdrawalRequests();
  }, [selectedStatus]);

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      const response = await walletService.adminGetWithdrawalRequests(
        0, 
        50, 
        selectedStatus
      );
      setRequests(response.content || []);
    } catch (error: any) {
      console.error('❌ Failed to fetch withdrawal requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      setActionLoading(true);
      await walletService.adminApproveWithdrawal(requestId, adminNotes || undefined);
      await fetchWithdrawalRequests();
      setShowDetailModal(false);
      setAdminNotes('');
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      alert(error.message || 'Lỗi khi duyệt yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!adminNotes.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setActionLoading(true);
      await walletService.adminRejectWithdrawal(requestId, adminNotes);
      await fetchWithdrawalRequests();
      setShowDetailModal(false);
      setAdminNotes('');
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      alert(error.message || 'Lỗi khi từ chối yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (requestId: number) => {
    try {
      setActionLoading(true);
      await walletService.adminCompleteWithdrawal(requestId, adminNotes || undefined);
      await fetchWithdrawalRequests();
      setShowDetailModal(false);
      setAdminNotes('');
    } catch (error: any) {
      console.error('Failed to complete request:', error);
      alert(error.message || 'Lỗi khi hoàn thành yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailModal = (request: WithdrawalRequestResponse) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setShowDetailModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { icon: <Clock size={14} />, label: 'Chờ duyệt', class: 'pending' },
      APPROVED: { icon: <CheckCircle size={14} />, label: 'Đã duyệt', class: 'approved' },
      COMPLETED: { icon: <CheckCircle size={14} />, label: 'Hoàn thành', class: 'completed' },
      REJECTED: { icon: <XCircle size={14} />, label: 'Từ chối', class: 'rejected' },
      CANCELLED: { icon: <XCircle size={14} />, label: 'Đã hủy', class: 'cancelled' }
    };
    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    return (
      <span className={`admin-status-badge ${badge.class}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const filteredRequests = (requests || []).filter(req => 
    req.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.userFullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: (requests || []).length,
    pending: (requests || []).filter(r => r.status === 'PENDING').length,
    approved: (requests || []).filter(r => r.status === 'APPROVED').length,
    completed: (requests || []).filter(r => r.status === 'COMPLETED').length,
    rejected: (requests || []).filter(r => r.status === 'REJECTED').length
  };

  return (
    <div className="admin-withdrawal-approval-tab">
      <div className="admin-withdrawal-header">
        <div>
          <h2>Duyệt Yêu Cầu Rút Tiền</h2>
          <p>Quản lý và xử lý các yêu cầu rút tiền từ người dùng</p>
        </div>
        <button className="admin-refresh-btn" onClick={fetchWithdrawalRequests} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="admin-withdrawal-stats">
        <div className="admin-stat-card total">
          <DollarSign size={24} />
          <div>
            <div className="admin-stat-number">{stats.total}</div>
            <div className="admin-stat-label">Tổng yêu cầu</div>
          </div>
        </div>
        <div className="admin-stat-card pending">
          <Clock size={24} />
          <div>
            <div className="admin-stat-number">{stats.pending}</div>
            <div className="admin-stat-label">Chờ duyệt</div>
          </div>
        </div>
        <div className="admin-stat-card approved">
          <CheckCircle size={24} />
          <div>
            <div className="admin-stat-number">{stats.approved}</div>
            <div className="admin-stat-label">Đã duyệt</div>
          </div>
        </div>
        <div className="admin-stat-card completed">
          <CheckCircle size={24} />
          <div>
            <div className="admin-stat-number">{stats.completed}</div>
            <div className="admin-stat-label">Hoàn thành</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-withdrawal-filters">
        <div className="admin-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã, tên user, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-status-filters">
          <Filter size={18} />
          {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map(status => (
            <button
              key={status}
              className={`admin-filter-btn ${selectedStatus === status ? 'active' : ''}`}
              onClick={() => setSelectedStatus(status)}
            >
              {status === 'ALL' ? 'Tất cả' : 
               status === 'PENDING' ? 'Chờ duyệt' :
               status === 'APPROVED' ? 'Đã duyệt' :
               status === 'COMPLETED' ? 'Hoàn thành' : 'Từ chối'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="admin-loading-state">
          <RefreshCw size={48} className="spinning" />
          <p>Đang tải...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="admin-empty-state">
          <DollarSign size={64} />
          <h3>Không có yêu cầu nào</h3>
          <p>Chưa có yêu cầu rút tiền phù hợp với bộ lọc</p>
        </div>
      ) : (
        <div className="admin-requests-table">
          <table>
            <thead>
              <tr>
                <th>Mã yêu cầu</th>
                <th>Người dùng</th>
                <th>Số tiền</th>
                <th>Ngân hàng</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => (
                <tr key={request.requestId}>
                  <td className="admin-code-cell">{request.requestCode}</td>
                  <td>
                    <div className="admin-user-info">
                      <div className="admin-user-name">{request.userFullName || 'N/A'}</div>
                      <div className="admin-user-email">{request.userEmail}</div>
                    </div>
                  </td>
                  <td className="admin-amount-cell">{formatCurrency(request.amount)}</td>
                  <td>{request.bankName}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>
                    <button
                      className="admin-action-btn view"
                      onClick={() => openDetailModal(request)}
                    >
                      <Eye size={16} />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Chi Tiết Yêu Cầu Rút Tiền</h3>
              <button className="admin-close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-detail-section">
                <h4>Thông Tin Yêu Cầu</h4>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <span className="label">Mã yêu cầu:</span>
                    <span className="value code">{selectedRequest.requestCode}</span>
                  </div>
                  <div className="admin-detail-item">
                    <span className="label">Trạng thái:</span>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <div className="admin-detail-item">
                    <span className="label">Số tiền:</span>
                    <span className="value amount">{formatCurrency(selectedRequest.amount)}</span>
                  </div>
                  <div className="admin-detail-item">
                    <span className="label">Ngày tạo:</span>
                    <span className="value">{formatDate(selectedRequest.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="admin-detail-section">
                <h4>Thông Tin Người Dùng</h4>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <User size={16} />
                    <span className="label">Tên:</span>
                    <span className="value">{selectedRequest.userFullName || 'N/A'}</span>
                  </div>
                  <div className="admin-detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{selectedRequest.userEmail}</span>
                  </div>
                </div>
              </div>

              <div className="admin-detail-section">
                <h4>Thông Tin Ngân Hàng</h4>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <Building2 size={16} />
                    <span className="label">Ngân hàng:</span>
                    <span className="value">{selectedRequest.bankName}</span>
                  </div>
                  <div className="admin-detail-item">
                    <CreditCard size={16} />
                    <span className="label">Số TK:</span>
                    <span className="value">{selectedRequest.bankAccountNumber}</span>
                  </div>
                  <div className="admin-detail-item">
                    <User size={16} />
                    <span className="label">Chủ TK:</span>
                    <span className="value">{selectedRequest.bankAccountName}</span>
                  </div>
                  {selectedRequest.bankBranch && (
                    <div className="admin-detail-item">
                      <span className="label">Chi nhánh:</span>
                      <span className="value">{selectedRequest.bankBranch}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.processedAt && (
                <div className="admin-detail-section">
                  <h4>Thông Tin Xử Lý</h4>
                  <div className="admin-detail-grid">
                    <div className="admin-detail-item">
                      <Calendar size={16} />
                      <span className="label">Ngày xử lý:</span>
                      <span className="value">{formatDate(selectedRequest.processedAt)}</span>
                    </div>
                    {selectedRequest.approvedByName && (
                      <div className="admin-detail-item">
                        <span className="label">Người xử lý:</span>
                        <span className="value">{selectedRequest.approvedByName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="admin-detail-section">
                <h4>Ghi Chú Admin</h4>
                <textarea
                  className="admin-withdrawal-notes-input"
                  placeholder="Nhập ghi chú (bắt buộc khi từ chối)..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  disabled={selectedRequest.status !== 'PENDING' && selectedRequest.status !== 'APPROVED'}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button
                    className="admin-action-btn reject"
                    onClick={() => handleReject(selectedRequest.requestId)}
                    disabled={actionLoading}
                  >
                    <XCircle size={16} />
                    Từ chối
                  </button>
                  <button
                    className="admin-action-btn approve"
                    onClick={() => handleApprove(selectedRequest.requestId)}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={16} />
                    Duyệt
                  </button>
                </>
              )}
              {selectedRequest.status === 'APPROVED' && (
                <button
                  className="admin-action-btn complete"
                  onClick={() => handleComplete(selectedRequest.requestId)}
                  disabled={actionLoading}
                >
                  <CheckCircle size={16} />
                  Đánh dấu hoàn thành
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalApprovalTab;
