import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Briefcase, Building2, MapPin, DollarSign, Calendar, Globe, Users } from 'lucide-react';
import './JobManagementTab.css'; // New unique CSS file

export const JobManagementTab: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadPendingJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await adminService.getPendingJobs();
      setJobs(data);
    } catch (error) {
      console.error('Error loading pending jobs:', error);
      showError('Lỗi', 'Không thể tải danh sách việc làm chờ duyệt');
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    loadPendingJobs();
  }, [loadPendingJobs]);

  // Scroll lock for modals
  useEffect(() => {
    if (showDetailsModal || showActionModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailsModal, showActionModal]);

  const handleAction = async () => {
    if (!selectedJob) return;

    if (actionType === 'reject' && !actionReason.trim()) {
      showWarning('Cảnh báo', 'Vui lòng nhập lý do từ chối');
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        await adminService.approveJob(selectedJob.id);
        showSuccess('Thành công', 'Đã duyệt tin tuyển dụng');
      } else {
        await adminService.rejectJob(selectedJob.id, actionReason);
        showSuccess('Thành công', 'Đã từ chối tin tuyển dụng và hoàn tiền');
      }
      
      await loadPendingJobs();
      setShowActionModal(false);
      setShowDetailsModal(false);
      setActionReason('');
    } catch (error) {
      console.error('Error processing job:', error);
      showError('Lỗi', 'Không thể xử lý tin tuyển dụng');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (type: 'approve' | 'reject') => {
    setActionType(type);
    setActionReason('');
    setShowActionModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="job-approval-container">
      <div className="job-approval-header">
        <div>
          <h2>Quản Lý Tuyển Dụng</h2>
          <div className="job-approval-stats-group" style={{ marginTop: '0.5rem' }}>
            <span className="job-approval-stat-badge">Chờ duyệt: {jobs.length}</span>
          </div>
        </div>
        <button className="job-approval-btn-primary" onClick={loadPendingJobs} disabled={loading}>
            {loading ? 'Đang tải...' : '🔄 Làm mới'}
        </button>
      </div>

      <div className="job-approval-table-container">
        {loading ? (
          <div className="job-approval-loading">
            <div className="spinning" style={{ display: 'inline-block', marginBottom: '10px' }}>⏳</div>
            <div>Đang tải dữ liệu...</div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="job-approval-empty">Không có tin tuyển dụng nào chờ duyệt</div>
        ) : (
          <table className="job-approval-table">
            <thead>
              <tr>
                <th>Công ty</th>
                <th>Tiêu đề</th>
                <th>Ngân sách</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <span className="job-approval-company-name">{job.recruiterCompanyName}</span>
                  </td>
                  <td>
                    <strong className="job-approval-job-title">{job.title}</strong>
                  </td>
                  <td>
                    <span className="job-approval-budget">
                      {formatCurrency(job.minBudget)} - {formatCurrency(job.maxBudget)}
                    </span>
                  </td>
                  <td>{formatDate(job.createdAt)}</td>
                  <td>
                    <div className="job-approval-actions">
                      <button 
                        className="job-approval-btn-icon job-approval-btn-view" 
                        onClick={() => { setSelectedJob(job); setShowDetailsModal(true); }}
                        title="Xem chi tiết"
                      >
                        👁️
                      </button>
                      <button 
                        className="job-approval-btn-icon job-approval-btn-approve" 
                        onClick={() => { setSelectedJob(job); openActionModal('approve'); }}
                        title="Duyệt"
                      >
                        ✓
                      </button>
                      <button 
                        className="job-approval-btn-icon job-approval-btn-reject" 
                        onClick={() => { setSelectedJob(job); openActionModal('reject'); }}
                        title="Từ chối"
                      >
                        ✗
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedJob && ReactDOM.createPortal(
        <div className="job-approval-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="job-approval-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="job-approval-modal-header">
              <h2 className="job-approval-modal-title">Chi tiết tin tuyển dụng</h2>
              <button className="job-approval-modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            
            <div className="job-approval-modal-body">
              <div className="job-approval-detail-header">
                <h3>{selectedJob.title}</h3>
                <div className="job-approval-meta">
                  <span className="job-approval-badge-orange">Chờ duyệt</span>
                  <div className="job-approval-meta-item">
                    <Building2 size={16}/> 
                    <span>{selectedJob.recruiterCompanyName}</span>
                  </div>
                  <div className="job-approval-meta-item">
                    <MapPin size={16}/> 
                    <span>{selectedJob.isRemote ? 'Remote' : selectedJob.location}</span>
                  </div>
                </div>
              </div>

              <div className="job-approval-description">
                <h4 style={{ color: '#fff', marginTop: 0, marginBottom: '1rem' }}>Mô tả công việc</h4>
                <div dangerouslySetInnerHTML={{ __html: selectedJob.description }} />
              </div>

              <div className="job-approval-stats-grid">
                <div className="job-approval-stat-card">
                  <DollarSign className="job-approval-stat-icon" />
                  <div>
                    <div className="job-approval-stat-value">
                      {formatCurrency(selectedJob.minBudget)} - {formatCurrency(selectedJob.maxBudget)}
                    </div>
                    <div className="job-approval-stat-label">Ngân sách</div>
                  </div>
                </div>
                <div className="job-approval-stat-card">
                  <Calendar className="job-approval-stat-icon" />
                  <div>
                    <div className="job-approval-stat-value">{formatDate(selectedJob.deadline)}</div>
                    <div className="job-approval-stat-label">Hạn nộp hồ sơ</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Kỹ năng yêu cầu</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedJob.requiredSkills?.map((skill: string, idx: number) => (
                        <span key={idx} className="job-approval-badge-gray">{skill}</span>
                    ))}
                </div>
              </div>
            </div>

            <div className="job-approval-modal-actions">
              <button className="job-approval-btn-success" onClick={() => openActionModal('approve')}>
                ✓ Phê duyệt
              </button>
              <button className="job-approval-btn-danger" onClick={() => openActionModal('reject')}>
                ✗ Từ chối
              </button>
              <button className="job-approval-btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Action Modal */}
      {showActionModal && selectedJob && ReactDOM.createPortal(
        <div className="job-approval-modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="job-approval-modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="job-approval-modal-header">
              <h2 className="job-approval-modal-title">
                {actionType === 'approve' ? 'Duyệt' : 'Từ chối'} tin tuyển dụng
              </h2>
              <button className="job-approval-modal-close" onClick={() => setShowActionModal(false)}>×</button>
            </div>
            
            <div className="job-approval-modal-body">
              <p style={{ color: '#e0e7ff', marginBottom: '1rem' }}>
                Bạn có chắc chắn muốn {actionType === 'approve' ? 'duyệt' : 'từ chối'} tin tuyển dụng này?
              </p>
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.1)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                borderLeft: '4px solid #8b5cf6'
              }}>
                <strong style={{ color: '#fff' }}>"{selectedJob.title}"</strong>
              </div>
              
              <div className="job-approval-form-group">
                <label>{actionType === 'reject' ? 'Lý do từ chối:' : 'Ghi chú (tùy chọn):'}</label>
                <textarea 
                    className="job-approval-textarea"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={actionType === 'reject' ? 'Nhập lý do từ chối để gửi email thông báo...' : 'Ghi chú thêm...'}
                />
              </div>
            </div>

            <div className="job-approval-modal-actions">
              <button 
                className={actionType === 'approve' ? 'job-approval-btn-success' : 'job-approval-btn-danger'} 
                onClick={handleAction} 
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
              <button className="job-approval-btn-secondary" onClick={() => setShowActionModal(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
