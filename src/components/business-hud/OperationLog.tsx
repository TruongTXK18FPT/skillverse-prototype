import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger, localRefreshTrigger]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await jobService.getMyJobs();
      setJobs(data);
      
      // If a job is selected, update its details from the fresh data
      if (selectedJob) {
        const updatedSelectedJob = data.find(job => job.id === selectedJob.id);
        if (updatedSelectedJob) {
          setSelectedJob(updatedSelectedJob);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showError('System Error', 'Failed to retrieve operation logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn hủy bỏ nhiệm vụ này? Hành động này sẽ xóa vĩnh viễn dữ liệu và đơn ứng tuyển.')) {
      try {
        await jobService.deleteJob(jobId);
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        if (selectedJob?.id === jobId) setSelectedJob(null);
        showSuccess('Mission Aborted', 'Nhiệm vụ đã được hủy bỏ thành công.');
      } catch (err: any) {
        console.error('Failed to delete job:', err);
        showError('Error', 'Không thể hủy nhiệm vụ. Vui lòng thử lại.');
      }
    }
  };

  const handleCloseJob = async (jobId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn ĐÓNG nhiệm vụ này? Ứng viên sẽ không thể nộp đơn nữa.')) {
      try {
        await jobService.changeJobStatus(jobId, 'CLOSED');
        // Update local state
        setJobs(prevJobs => prevJobs.map(job => 
          job.id === jobId ? { ...job, status: 'CLOSED' } : job
        ));
        if (selectedJob?.id === jobId) {
          setSelectedJob(prev => prev ? { ...prev, status: 'CLOSED' } : null);
        }
        showSuccess('Mission Closed', 'Nhiệm vụ đã được đóng lại.');
      } catch (err: any) {
        console.error('Failed to close job:', err);
        showError('Error', 'Không thể đóng nhiệm vụ.');
      }
    }
  };

  const handleReopenJob = async (jobId: number) => {
    if (window.confirm('Bạn có muốn MỞ LẠI nhiệm vụ này? Hành động này sẽ xóa các đơn ứng tuyển cũ và reset số lượng ứng viên.')) {
      try {
        await jobService.reopenJob(jobId);
        // We need to fetch the updated job details from the server to get the correct status
        // But for immediate UI feedback, we can update local state
        // Reopen usually sets status to 'OPEN' or 'PENDING_APPROVAL' depending on logic
        // Let's assume it becomes 'OPEN' for now, but best is to refetch all
        await fetchJobs(); 
        
        // IMPORTANT: Also update the selectedJob if it is the one being reopened
        // Since we just fetched fresh data, we can find the updated job in the new list
        // However, state updates are async, so we might need to rely on the fetchJobs updating 'jobs' 
        // and then finding it, or manually update selectedJob here.
        // A manual update is safer for immediate feedback in the details panel.
        if (selectedJob?.id === jobId) {
           setSelectedJob(prev => prev ? { ...prev, status: 'OPEN' } : null);
        }

        showSuccess('Mission Reopened', 'Nhiệm vụ đã được tái kích hoạt.');
      } catch (err: any) {
        console.error('Failed to reopen job:', err);
        showError('Error', 'Không thể mở lại nhiệm vụ.');
      }
    }
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
          acceptanceMessage: 'Chúc mừng! Bạn đã được chọn tham gia phi hành đoàn.'
        });
        // Trigger local refresh for modal
        setLocalRefreshTrigger(prev => prev + 1);
        showSuccess('Tuyển Dụng Thành Công', `Đã chấp nhận ${name} vào đội!`);
      } catch (e) {
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
      } catch (e) {
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
          Đang quét cơ sở dữ liệu...
        </div>
      ) : (
        <>
          <table className="fleet-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mục Tiêu Nhiệm Vụ</th>
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
                    Không tìm thấy hoạt động nào. Hãy khởi tạo nhiệm vụ mới.
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
                <h3>Chi Tiết Nhiệm Vụ #{selectedJob.id}</h3>
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
                    <button 
                      className="fleet-btn-success"
                      onClick={() => handleReopenJob(selectedJob.id)}
                    >
                      🔄 Mở Lại Nhiệm Vụ
                    </button>
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
        </>
      )}
    </div>
  );
};

export default OperationLog;
