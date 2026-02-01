import React, { useState, useEffect, useCallback } from 'react';
import jobService from '../../services/jobService';
import { JobPostingResponse, JobStatus, JobApplicationStatus } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import ApplicantsModal from '../business/ApplicantsModal';
import './fleet-styles.css';

interface OperationLogProps {
  refreshTrigger?: number;
}

const OperationLog: React.FC<OperationLogProps> = ({ refreshTrigger }) => {
  const { showError, showSuccess } = useToast();
  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  const [selectedJob, setSelectedJob] = useState<JobPostingResponse | null>(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPostingResponse | null>(null);

  // Reopen Modal State
  const [reopenModal, setReopenModal] = useState<{
    visible: boolean;
    jobId: number | null;
    deadline: string;
    clearApplications: boolean;
    isFree: boolean;
  }>({
    visible: false,
    jobId: null,
    deadline: '',
    clearApplications: true,
    isFree: false
  });

  // Close Modal State
  const [closeModal, setCloseModal] = useState<{
    visible: boolean;
    jobId: number | null;
  }>({
    visible: false,
    jobId: null
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    requiredSkills: [] as string[],
    minBudget: '',
    maxBudget: '',
    deadline: '',
    isRemote: true,
    location: ''
  });

  // 1. Define fetchJobs with useCallback to stabilize the function reference
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await jobService.getMyJobs();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showError('Lỗi Hệ Thống', 'Không thể tải nhật ký hoạt động.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]); // Dependencies that don't change often

  // 2. Fetch jobs when triggers change
  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger, localRefreshTrigger, fetchJobs]);

  // 3. Separate effect to update selectedJob details when jobs list updates
  // This prevents the infinite loop of fetchJobs -> setJobs -> selectedJob -> fetchJobs
  useEffect(() => {
    if (selectedJob) {
      const updatedSelectedJob = jobs.find(job => job.id === selectedJob.id);
      if (updatedSelectedJob) {
        // Only update if data actually changed to avoid render loops
        if (JSON.stringify(updatedSelectedJob) !== JSON.stringify(selectedJob)) {
          setSelectedJob(updatedSelectedJob);
        }
      }
    }
  }, [jobs, selectedJob]);

  const handleDelete = async (jobId: number) => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn hủy tin tuyển dụng này? Hành động này sẽ xóa vĩnh viễn dữ liệu và đơn ứng tuyển.')) {
      try {
        await jobService.deleteJob(jobId);
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        if (selectedJob?.id === jobId) setSelectedJob(null);
        showSuccess('Thành Công', 'Tin tuyển dụng đã được hủy thành công.');
      } catch (err: any) {
        console.error('Failed to delete job:', err);
        showError('Lỗi', 'Không thể hủy tin tuyển dụng. Vui lòng thử lại.');
      }
    }
  };

  const handleCloseJob = (jobId: number) => {
    setCloseModal({
      visible: true,
      jobId: jobId
    });
  };

  const confirmClose = async () => {
    if (!closeModal.jobId) return;

    try {
      await jobService.changeJobStatus(closeModal.jobId, JobStatus.CLOSED);
      // Update local state
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === closeModal.jobId ? { ...job, status: JobStatus.CLOSED } : job
      ));
      if (selectedJob?.id === closeModal.jobId) {
        setSelectedJob(prev => prev ? { ...prev, status: JobStatus.CLOSED } : null);
      }
      showSuccess('Thành Công', 'Nhiệm vụ đã được đóng lại.');
      setCloseModal({ visible: false, jobId: null });
    } catch (err: any) {
      console.error('Failed to close job:', err);
      showError('Lỗi', 'Không thể đóng nhiệm vụ.');
    }
  };

  const handleReopenClick = (job: JobPostingResponse) => {
    // Check grace period (5 minutes)
    const updatedAt = new Date(job.updatedAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - updatedAt) / (1000 * 60);
    const isFree = diffMinutes <= 5;

    // Default deadline: +30 days
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 30);
    const deadlineStr = defaultDeadline.toISOString().split('T')[0];

    setReopenModal({
      visible: true,
      jobId: job.id,
      deadline: deadlineStr,
      clearApplications: true,
      isFree
    });
  };

  const confirmReopen = async () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1); // Tomorrow
    
    // Removed unused minDateStr to fix lint warning

    if (new Date(reopenModal.deadline) < minDate) {
        showError('Lỗi Ngày Tháng', 'Hạn chót phải từ ngày mai trở đi.');
        return;
    }

    if (!reopenModal.jobId) return;

    try {
      await jobService.reopenJob(reopenModal.jobId, {
        deadline: reopenModal.deadline,
        clearApplications: reopenModal.clearApplications
      });
      
      await fetchJobs();
      
      if (selectedJob?.id === reopenModal.jobId) {
         setSelectedJob(prev => prev ? { ...prev, status: JobStatus.OPEN } : null);
      }

      showSuccess('Thành Công', 'Nhiệm vụ đã được tái kích hoạt.');

      // Dispatch wallet update event
      window.dispatchEvent(new Event('wallet:updated'));

      setReopenModal(prev => ({ ...prev, visible: false }));
    } catch (err: any) {
      console.error('Failed to reopen job:', err);
      showError('Lỗi', 'Không thể mở lại nhiệm vụ.');
    }
  };

  const handleEditJob = (job: JobPostingResponse) => {
    setEditingJob(job);
    setEditForm({
      title: job.title,
      description: job.description,
      requiredSkills: [...job.requiredSkills],
      minBudget: job.minBudget.toString(),
      maxBudget: job.maxBudget.toString(),
      deadline: job.deadline,
      isRemote: job.isRemote,
      location: job.location || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingJob) return;

    try {
      await jobService.updateJob(editingJob.id, {
        title: editForm.title,
        description: editForm.description,
        requiredSkills: editForm.requiredSkills,
        minBudget: parseFloat(editForm.minBudget),
        maxBudget: parseFloat(editForm.maxBudget),
        deadline: editForm.deadline,
        isRemote: editForm.isRemote,
        location: editForm.isRemote ? null : editForm.location
      });

      showSuccess('Thành Công', 'Thông tin nhiệm vụ đã được cập nhật.');
      setEditingJob(null);
      fetchJobs();
      
      // Update selected job if it's the one being edited
      if (selectedJob?.id === editingJob.id) {
         setSelectedJob(prev => prev ? {
             ...prev,
             title: editForm.title,
             description: editForm.description,
             minBudget: parseFloat(editForm.minBudget),
             maxBudget: parseFloat(editForm.maxBudget),
             deadline: editForm.deadline
         } : null);
      }
    } catch (error) {
      console.error('Error updating job:', error);
      showError('Lỗi Cập Nhật', 'Không thể cập nhật thông tin nhiệm vụ.');
    }
  };

  // Deprecated - kept for reference if needed
  // Added underscore to suppress unused warning
  const _handleReopenJob = async (_jobId: number) => {
     console.warn('Deprecated handleReopenJob called. Use handleReopenClick instead.');
  };

  const handleViewDetails = (job: JobPostingResponse) => {
    setSelectedJob(job);
  };

  const handleOpenApplicants = () => {
    if (selectedJob) {
      setShowApplicantsModal(true);
    }
  };

  const handleAcceptApplicant = async (appId: number, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn CHẤP NHẬN ứng viên ${name}?`)) {
      try {
        await jobService.updateApplicationStatus(appId, {
          status: 'ACCEPTED' as JobApplicationStatus,
          acceptanceMessage: 'Chúc mừng! Bạn đã được chọn tham gia đội ngũ.'
        });
        // Trigger local refresh for modal
        setLocalRefreshTrigger(prev => prev + 1);
        showSuccess('Tuyển Dụng Thành Công', `Đã chấp nhận ${name} vào đội!`);
      } catch (_e) { // Renamed e to _e
        showError('Lỗi', 'Không thể chấp nhận ứng viên này.');
      }
    }
  };

  const handleRejectApplicant = async (appId: number, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn TỪ CHỐI ứng viên ${name}?`)) {
      try {
        await jobService.updateApplicationStatus(appId, {
          status: 'REJECTED' as JobApplicationStatus,
          rejectionReason: 'Hồ sơ chưa phù hợp với yêu cầu hiện tại.'
        });
        // Trigger local refresh for modal
        setLocalRefreshTrigger(prev => prev + 1);
        showSuccess('Đã Từ Chối', `Đã gửi thông báo từ chối cho ${name}.`);
      } catch (_e) { // Renamed e to _e
        showError('Lỗi', 'Không thể từ chối ứng viên này.');
      }
    }
  };

  const getStatusBadgeClass = (status: JobStatus): string => {
    switch (status) {
      case 'OPEN': return 'fleet-status-open';
      case 'CLOSED': return 'fleet-status-closed';
      default: return 'fleet-status-closed';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="fleet-panel">
      <div className="fleet-title">
        <i className="fas fa-list-alt"></i>
        Nhật Ký Hoạt Động
      </div>
      
      {isLoading ? (
        <div style={{ color: 'var(--fleet-cyan)', padding: '20px', textAlign: 'center' }}>
          Đang tải dữ liệu...
        </div>
      ) : (
        <>
          <table className="fleet-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vị Trí Tuyển Dụng</th>
                <th>Hạn Chót</th>
                <th>Ngân Sách</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--fleet-text-muted)' }}>
                    Không tìm thấy tin tuyển dụng nào. Hãy tạo tin mới.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className={selectedJob?.id === job.id ? 'fleet-row-selected' : ''}
                  >
                    <td 
                      style={{ fontFamily: 'monospace', color: 'var(--fleet-cyan)', cursor: 'pointer' }}
                      onClick={() => handleViewDetails(job)}
                    >
                      #{job.id}
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{job.title}</td>
                    <td>{formatDate(job.deadline)}</td>
                    <td>{job.isNegotiable ? 'Thỏa thuận' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(job.maxBudget)}</td>
                    <td>
                      <span className={`fleet-status-badge ${getStatusBadgeClass(job.status)}`}>
                        [{job.status === 'OPEN' ? 'MỞ' : job.status === 'PENDING_APPROVAL' ? 'CHỜ DUYỆT' : 'ĐÓNG'}]
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="fleet-btn-icon" 
                          onClick={() => handleViewDetails(job)}
                          title="Xem Chi Tiết & Thao Tác"
                          style={{ color: 'var(--fleet-cyan)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2em' }}
                        >
                          <i className="fas fa-info-circle"></i> ℹ️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Job Details Panel (Slide-in or Modal) */}
          {selectedJob && (
            <div className="fleet-details-panel">
              <div className="fleet-details-header">
                <h3>Chi Tiết Tin #{selectedJob.id}</h3>
                <button 
                  className="fleet-close-btn"
                  onClick={() => setSelectedJob(null)}
                >
                  ✕
                </button>
              </div>
              
              <div className="fleet-details-content">
                <div className="fleet-detail-row">
                  <label>Tiêu Đề:</label>
                  <span>{selectedJob.title}</span>
                </div>
                <div className="fleet-detail-row">
                  <label>Trạng Thái:</label>
                  <span className={`fleet-status-badge ${getStatusBadgeClass(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                </div>
                <div className="fleet-detail-row">
                  <label>Mô Tả:</label>
                  <p>{selectedJob.description}</p>
                </div>
                <div className="fleet-detail-row">
                  <label>Quyền Lợi:</label>
                  <p>{selectedJob.benefits || 'Chưa cập nhật'}</p>
                </div>
                <div className="fleet-detail-row">
                  <label>Kỹ Năng:</label>
                  <div className="fleet-merc-skills">
                    {selectedJob.requiredSkills?.map(s => <span key={s} className="fleet-chip">{s}</span>) || 'Không có yêu cầu'}
                  </div>
                </div>
                <div className="fleet-detail-row">
                  <label>Hình Thức:</label>
                  <span>{selectedJob.isRemote ? 'Làm việc từ xa (Remote)' : selectedJob.location} - {selectedJob.jobType}</span>
                </div>
                <div className="fleet-detail-row">
                  <label>Tuyển Dụng:</label>
                  <span>{selectedJob.hiringQuantity} người ({selectedJob.experienceLevel})</span>
                </div>
                
                <div className="fleet-details-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    className="fleet-btn-icon"
                    onClick={handleOpenApplicants}
                    style={{ 
                      background: 'rgba(6, 182, 212, 0.1)', 
                      border: '1px solid var(--fleet-cyan)', 
                      color: 'var(--fleet-cyan)',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    👥 Xem Ứng Viên
                  </button>

                  {selectedJob.status === 'OPEN' && (
                    <button 
                      className="fleet-btn-warning"
                      onClick={() => handleCloseJob(selectedJob.id)}
                    >
                      🛑 Đóng Nhiệm Vụ
                    </button>
                  )}
                  
                  {selectedJob.status === 'CLOSED' && (
                    <>
                      <button 
                        className="fleet-btn-primary-small"
                        onClick={() => handleEditJob(selectedJob)}
                        style={{ 
                          background: 'rgba(245, 158, 11, 0.1)', 
                          color: '#f59e0b', 
                          borderColor: '#f59e0b',
                          flex: '0 0 auto',
                          width: 'auto',
                          padding: '8px 16px'
                        }}
                      >
                        ✏️ Chỉnh Sửa
                      </button>
                      <button 
                        className="fleet-btn-success"
                        onClick={() => handleReopenClick(selectedJob)}
                      >
                        🔄 Mở Lại Nhiệm Vụ
                      </button>
                    </>
                  )}
                  
                  <button 
                    className="fleet-btn-danger"
                    onClick={() => handleDelete(selectedJob.id)}
                  >
                    🗑️ Hủy Nhiệm Vụ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Applicants Modal */}
          {showApplicantsModal && selectedJob && (
            <ApplicantsModal
              jobId={selectedJob.id}
              jobTitle={selectedJob.title}
              onClose={() => setShowApplicantsModal(false)}
              onAccept={handleAcceptApplicant}
              onReject={handleRejectApplicant}
              refreshTrigger={localRefreshTrigger}
            />
          )}

          {/* Close Job Modal */}
          {closeModal.visible && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={() => setCloseModal(prev => ({ ...prev, visible: false }))}>
              <div className="fleet-panel" style={{ width: '500px', maxWidth: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="fleet-details-header">
                  <h3 style={{ color: 'var(--fleet-warning)' }}>🛑 Xác Nhận Đóng Nhiệm Vụ</h3>
                  <button className="fleet-close-btn" onClick={() => setCloseModal(prev => ({ ...prev, visible: false }))}>✕</button>
                </div>
                
                <div style={{ padding: '20px 0', color: '#e2e8f0' }}>
                  <p>Bạn có chắc chắn muốn đóng nhiệm vụ này không?</p>
                  <ul style={{ margin: '15px 0 15px 20px', lineHeight: '1.6' }}>
                    <li>Ứng viên sẽ không thể nộp đơn mới.</li>
                    <li>Nhiệm vụ sẽ chuyển sang trạng thái <strong>CLOSED</strong>.</li>
                    <li>Bạn có thể mở lại sau (có phí nếu quá thời gian ân hạn).</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button className="fleet-btn-secondary" onClick={() => setCloseModal(prev => ({ ...prev, visible: false }))}>Hủy Bỏ</button>
                  <button className="fleet-btn-danger" onClick={confirmClose}>Xác Nhận Đóng</button>
                </div>
              </div>
            </div>
          )}

          {/* Reopen Job Modal */}
          {reopenModal.visible && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={() => setReopenModal(prev => ({ ...prev, visible: false }))}>
              <div className="fleet-panel" style={{ width: '500px', maxWidth: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="fleet-details-header">
                  <h3>🔄 Mở Lại Nhiệm Vụ</h3>
                  <button className="fleet-close-btn" onClick={() => setReopenModal(prev => ({ ...prev, visible: false }))}>✕</button>
                </div>
                
                <div style={{ 
                  backgroundColor: reopenModal.isFree ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: reopenModal.isFree ? '#10b981' : '#f59e0b',
                  padding: '15px', borderRadius: '4px', marginBottom: '20px',
                  border: `1px solid ${reopenModal.isFree ? '#10b981' : '#f59e0b'}`
                }}>
                  <strong>{reopenModal.isFree ? '✨ MIỄN PHÍ' : '💰 PHÍ: 20.000 VNĐ'}</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#e2e8f0' }}>
                    {reopenModal.isFree 
                      ? 'Bạn đang trong thời gian ân hạn (5 phút). Mở lại job sẽ không tốn phí.'
                      : 'Đã quá thời gian ân hạn 5 phút. Phí mở lại sẽ được trừ vào ví của bạn.'
                    }
                  </p>
                </div>

                <div className="fleet-input-group">
                  <label className="fleet-label">Hạn Chót Mới *</label>
                  <input
                    type="date"
                    className="fleet-input"
                    value={reopenModal.deadline}
                    onChange={(e) => setReopenModal(prev => ({ ...prev, deadline: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="fleet-input-group">
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#e2e8f0' }}>
                    <input
                      type="checkbox"
                      checked={reopenModal.clearApplications}
                      onChange={(e) => setReopenModal(prev => ({ ...prev, clearApplications: e.target.checked }))}
                      style={{ marginRight: '10px', width: 'auto' }}
                    />
                    <span>
                      <strong>Xóa danh sách ứng viên cũ?</strong>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="fleet-btn-secondary" onClick={() => setReopenModal(prev => ({ ...prev, visible: false }))}>Hủy</button>
                  <button className="fleet-btn-primary" onClick={confirmReopen}>✅ Xác Nhận</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Job Modal */}
          {editingJob && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={() => setEditingJob(null)}>
              <div className="fleet-panel" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <div className="fleet-details-header">
                  <h3>✏️ Chỉnh Sửa Tin Tuyển Dụng</h3>
                  <button className="fleet-close-btn" onClick={() => setEditingJob(null)}>✕</button>
                </div>
                
                <div className="fleet-input-group">
                  <label className="fleet-label">Tiêu Đề *</label>
                  <input type="text" className="fleet-input" value={editForm.title} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} />
                </div>

                <div className="fleet-input-group">
                  <label className="fleet-label">Mô Tả *</label>
                  <textarea 
                    className="fleet-input" 
                    value={editForm.description} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    style={{ background: 'transparent', border: '1px solid var(--fleet-border)', width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className="fleet-input-group" style={{ flex: 1 }}>
                    <label className="fleet-label">Ngân Sách Min (VND)</label>
                    <input type="number" className="fleet-input" value={editForm.minBudget} onChange={(e) => setEditForm(prev => ({ ...prev, minBudget: e.target.value }))} />
                  </div>
                  <div className="fleet-input-group" style={{ flex: 1 }}>
                    <label className="fleet-label">Ngân Sách Max (VND)</label>
                    <input type="number" className="fleet-input" value={editForm.maxBudget} onChange={(e) => setEditForm(prev => ({ ...prev, maxBudget: e.target.value }))} />
                  </div>
                </div>

                <div className="fleet-input-group">
                  <label className="fleet-label">Hạn Chót</label>
                  <input type="date" className="fleet-input" value={editForm.deadline} onChange={(e) => setEditForm(prev => ({ ...prev, deadline: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="fleet-btn-secondary" onClick={() => setEditingJob(null)}>Hủy</button>
                  <button className="fleet-btn-primary" onClick={handleSaveEdit}>💾 Lưu Thay Đổi</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OperationLog;