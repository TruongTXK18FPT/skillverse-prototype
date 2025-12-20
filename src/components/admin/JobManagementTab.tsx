import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Briefcase, Building2, MapPin, DollarSign, Calendar, Globe, Users } from 'lucide-react';
import '../../styles/ModalsEnhanced.css';
import './CourseApprovalTab.css'; // Reusing CourseApproval styles

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
    <div className="course-approval-container">
      <div className="approval-header">
        <h2>Quản Lý Tuyển Dụng</h2>
        <div className="stats-group">
          <span className="stat-badge">Chờ duyệt: {jobs.length}</span>
        </div>
        <button className="btn-primary" onClick={loadPendingJobs} disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">Đang tải...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">Không có tin tuyển dụng nào chờ duyệt</div>
        ) : (
          <table className="courses-table">
            <thead>
              <tr>
                <th>Công ty</th>
                <th>Tiêu đề</th>
                <th>Ngân sách</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.recruiterCompanyName}</td>
                  <td>
                    <strong>{job.title}</strong>
                  </td>
                  <td>{formatCurrency(job.minBudget)} - {formatCurrency(job.maxBudget)}</td>
                  <td>{formatDate(job.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-view" onClick={() => { setSelectedJob(job); setShowDetailsModal(true); }}>👁️</button>
                      <button className="btn-icon btn-approve" onClick={() => { setSelectedJob(job); openActionModal('approve'); }}>✓</button>
                      <button className="btn-icon btn-reject" onClick={() => { setSelectedJob(job); openActionModal('reject'); }}>✗</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedJob && (
        <div className="module-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="module-modal-content course-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="module-modal-header">
              <h2 className="module-modal-title">Chi tiết tin tuyển dụng</h2>
              <button className="module-modal-close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="module-modal-form">
              <div className="course-detail-header">
                <div className="course-header-info">
                  <h3>{selectedJob.title}</h3>
                  <div className="course-meta">
                    <span className="badge badge-orange">Chờ duyệt</span>
                    <span className="author-info"><Building2 size={14}/> {selectedJob.recruiterCompanyName}</span>
                    <span className="author-info"><MapPin size={14}/> {selectedJob.isRemote ? 'Remote' : selectedJob.location}</span>
                  </div>
                </div>
              </div>

              <div className="course-description-full">
                <h4>Mô tả công việc</h4>
                <div dangerouslySetInnerHTML={{ __html: selectedJob.description }} />
              </div>

              <div className="course-stats-grid">
                <div className="stat-card">
                  <DollarSign className="stat-icon" />
                  <div>
                    <div className="stat-number">{formatCurrency(selectedJob.minBudget)} - {formatCurrency(selectedJob.maxBudget)}</div>
                    <div className="cv-stat-label">Ngân sách</div>
                  </div>
                </div>
                <div className="stat-card">
                  <Calendar className="stat-icon" />
                  <div>
                    <div className="stat-number">{formatDate(selectedJob.deadline)}</div>
                    <div className="cv-stat-label">Hạn nộp hồ sơ</div>
                  </div>
                </div>
              </div>

              <div className="course-modules-section">
                <h4>Kỹ năng yêu cầu</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedJob.requiredSkills?.map((skill: string, idx: number) => (
                        <span key={idx} className="badge badge-gray">{skill}</span>
                    ))}
                </div>
              </div>
            </div>
            <div className="module-form-actions">
              <button className="btn-success" onClick={() => openActionModal('approve')}>✓ Phê duyệt</button>
              <button className="btn-danger" onClick={() => openActionModal('reject')}>✗ Từ chối</button>
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedJob && (
        <div className="module-modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="module-modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="module-modal-header">
              <h2 className="module-modal-title">{actionType === 'approve' ? 'Duyệt' : 'Từ chối'} tin tuyển dụng</h2>
              <button className="module-modal-close-btn" onClick={() => setShowActionModal(false)}>×</button>
            </div>
            <div className="module-modal-form">
              <p>Bạn có chắc chắn muốn {actionType === 'approve' ? 'duyệt' : 'từ chối'} tin tuyển dụng này?</p>
              <strong>"{selectedJob.title}"</strong>
              <div className="form-group">
                <label>{actionType === 'reject' ? 'Lý do từ chối:' : 'Ghi chú:'}</label>
                <textarea 
                    className="form-textarea"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={actionType === 'reject' ? 'Nhập lý do...' : ''}
                />
              </div>
            </div>
            <div className="module-form-actions">
                <button className={actionType === 'approve' ? 'btn-success' : 'btn-danger'} onClick={handleAction} disabled={actionLoading}>
                    {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
                <button className="btn-secondary" onClick={() => setShowActionModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
