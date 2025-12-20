import React, { useState, useEffect } from 'react';
import jobService from '../../services/jobService';
import { JobPostingResponse, JobStatus } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import './MinJobListTab.css';

interface MinJobListTabProps {
  onViewApplicants?: (jobId: number) => void;
  refreshTrigger?: number; // For external refresh after job creation
}

const MinJobListTab: React.FC<MinJobListTabProps> = ({ onViewApplicants, refreshTrigger }) => {
  const { showSuccess, showError } = useToast();
  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPostingResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<JobPostingResponse | null>(null);
  
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

  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await jobService.getMyJobs();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showError('Lỗi Tải Dữ Liệu', 'Không thể tải danh sách công việc');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    filterStatus === 'all' || job.status === filterStatus
  );

  const getStatusBadge = (status: JobStatus): string => {
    const statusClasses = {
      'IN_PROGRESS': 'mjlt-status-progress',
      'OPEN': 'mjlt-status-open',
      'CLOSED': 'mjlt-status-closed'
    };
    return statusClasses[status] || 'mjlt-status-open';
  };

  const getStatusText = (status: JobStatus): string => {
    const statusTexts = {
      'IN_PROGRESS': 'Đang Soạn',
      'OPEN': 'Đang Mở',
      'CLOSED': 'Đã Đóng'
    };
    return statusTexts[status] || status;
  };

  const handleViewJob = (job: JobPostingResponse) => {
    setSelectedJob(job);
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
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

  const handleCloseEditModal = () => {
    setEditingJob(null);
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

      showSuccess('Thành Công', 'Công việc đã được cập nhật');
      setEditingJob(null);
      fetchJobs(); // Refresh list
    } catch (error) {
      console.error('Error updating job:', error);
      showError('Lỗi Cập Nhật', error instanceof Error ? error.message : 'Không thể cập nhật công việc');
    }
  };

  const handleChangeStatus = async (jobId: number, newStatus: JobStatus) => {
    try {
      await jobService.changeJobStatus(jobId, newStatus);
      showSuccess('Thành Công', `Đã chuyển trạng thái sang ${getStatusText(newStatus)}`);
      fetchJobs();
    } catch (error) {
      console.error('Error changing status:', error);
      showError('Lỗi Đổi Trạng Thái', error instanceof Error ? error.message : 'Không thể đổi trạng thái');
    }
  };

  const handleCloseJob = async (job: JobPostingResponse) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đóng "${job.title}"?`)) return;
    
    await handleChangeStatus(job.id, 'CLOSED' as JobStatus);
  };

  const handleReopenJob = async (jobId: number) => {
    if (!window.confirm('Mở lại job sẽ xóa tất cả applications hiện tại. Bạn có chắc chắn?')) return;

    try {
      await jobService.reopenJob(jobId);
      showSuccess('Thành Công', 'Job đã được mở lại');
      fetchJobs();
    } catch (error) {
      console.error('Error reopening job:', error);
      showError('Lỗi Mở Lại', error instanceof Error ? error.message : 'Không thể mở lại job');
    }
  };

  const handleDelete = async (jobId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác và sẽ xóa tất cả đơn ứng tuyển liên quan.')) {
      try {
        await jobService.deleteJob(jobId);
        // Remove from local state immediately
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        showSuccess('Thành Công', 'Đã xóa công việc');
      } catch (err: any) {
        console.error('Failed to delete job:', err);
        showError('Lỗi Xóa', 'Không thể xóa công việc. Vui lòng thử lại sau.');
      }
    }
  };

  const handleViewApplicants = (jobId: number) => {
    if (onViewApplicants) {
      onViewApplicants(jobId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatBudget = (min: number, max: number) => {
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  return (
    <div className="mjlt-minjob-list-tab">
      <div className="mjlt-tab-header">
        <h2>📋 Danh Sách Công Việc</h2>
        <p>Quản lý các công việc đã đăng và theo dõi tiến độ</p>
      </div>

      <div className="mjlt-list-controls">
        <div className="mjlt-filter-section">
          <label htmlFor="status-filter">Lọc theo Trạng Thái:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất Cả Công Việc</option>
            <option value="IN_PROGRESS">Đang Soạn</option>
            <option value="OPEN">Đang Mở</option>
            <option value="CLOSED">Đã Đóng</option>
          </select>
        </div>
        <div className="mjlt-jobs-count">
          {filteredJobs.length} công việc
        </div>
      </div>

      {isLoading ? (
        <div className="mjlt-loading-state">
          <MeowlKuruLoader size="medium" text="" />
          <p>Đang tải...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="mjlt-empty-state">
          <div className="mjlt-empty-icon">📋</div>
          <h3>Không tìm thấy công việc</h3>
          <p>
            {filterStatus === 'all' 
              ? "Bạn chưa đăng công việc nào. Tạo công việc đầu tiên của bạn!"
              : `Không có công việc với trạng thái "${getStatusText(filterStatus as JobStatus)}".`
            }
          </p>
        </div>
      ) : (
        <div className="mjlt-jobs-table-container">
          <table className="mjlt-jobs-table">
            <thead>
              <tr>
                <th>Tiêu Đề Công Việc</th>
                <th>Trạng Thái</th>
                <th>Ngân Sách</th>
                <th>Hạn Chót</th>
                <th>Ứng Viên</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <tr key={job.id}>
                  <td>
                    <div className="mjlt-job-title-cell">
                      <strong>{job.title}</strong>
                      <div className="mjlt-job-skills">
                        {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="mjlt-skill-mini-tag">
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 3 && (
                          <span className="mjlt-skill-mini-tag more">
                            +{job.requiredSkills.length - 3}
                          </span>
                        )}
                      </div>
                      {job.isRemote ? (
                        <span className="mjlt-remote-badge">🌐 Remote</span>
                      ) : job.location && (
                        <span className="mjlt-location-badge">📍 {job.location}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`mjlt-status-badge ${getStatusBadge(job.status)}`}>
                      {getStatusText(job.status)}
                    </span>
                  </td>
                  <td className="mjlt-budget-cell">
                    {formatBudget(job.minBudget, job.maxBudget)}
                  </td>
                  <td className="mjlt-deadline-cell">
                    {formatDate(job.deadline)}
                  </td>
                  <td className="mjlt-applicants-cell">
                    <button
                      className="mjlt-applicants-count"
                      onClick={() => handleViewApplicants(job.id)}
                      disabled={job.applicantCount === 0}
                      title="Xem danh sách ứng viên"
                    >
                      {job.applicantCount} ứng viên
                    </button>
                  </td>
                  <td>
                    <div className="mjlt-action-buttons">
                      <button
                        className="mjlt-action-btn mjlt-view-btn"
                        onClick={() => handleViewJob(job)}
                        title="Xem Chi Tiết"
                      >
                        👁️
                      </button>
                      {job.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            className="mjlt-action-btn mjlt-edit-btn"
                            onClick={() => handleEditJob(job)}
                            title="Chỉnh Sửa"
                          >
                            ✏️
                          </button>
                          <button
                            className="mjlt-action-btn mjlt-open-btn"
                            onClick={() => handleChangeStatus(job.id, 'OPEN' as JobStatus)}
                            title="Mở Công Việc"
                          >
                            🚀 Mở
                          </button>
                        </>
                      )}
                      {job.status === 'OPEN' && (
                        <button
                          className="mjlt-action-btn mjlt-close-btn"
                          onClick={() => handleCloseJob(job)}
                          title="Đóng Công Việc"
                        >
                          🔒 Đóng
                        </button>
                      )}
                      {job.status === 'CLOSED' && (
                        <button
                          className="mjlt-action-btn mjlt-reopen-btn"
                          onClick={() => handleReopenJob(job.id)}
                          title="Mở Lại (xóa tất cả applications)"
                        >
                          🔄 Mở Lại
                        </button>
                      )}
                      <button
                        className="mjlt-action-btn mjlt-delete-btn"
                        onClick={() => handleDelete(job.id)}
                        title="Xóa Công Việc"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="mjlt-modal-overlay" onClick={handleCloseModal}>
          <div className="mjlt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mjlt-modal-header">
              <h3>{selectedJob.title}</h3>
              <button className="mjlt-close-modal" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="mjlt-modal-body">
              <div className="mjlt-job-detail-section">
                <h4>Mô Tả</h4>
                <p>{selectedJob.description}</p>
              </div>
              
              <div className="mjlt-job-detail-section">
                <h4>Kỹ Năng Yêu Cầu</h4>
                <div className="mjlt-skills-display">
                  {selectedJob.requiredSkills.map((skill, idx) => (
                    <span key={idx} className="mjlt-skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mjlt-job-detail-grid">
                <div className="mjlt-detail-item">
                  <strong>Ngân Sách:</strong>
                  <span>{formatBudget(selectedJob.minBudget, selectedJob.maxBudget)}</span>
                </div>
                <div className="mjlt-detail-item">
                  <strong>Hạn Chót:</strong>
                  <span>{formatDate(selectedJob.deadline)}</span>
                </div>
                <div className="mjlt-detail-item">
                  <strong>Trạng Thái:</strong>
                  <span className={`mjlt-status-badge ${getStatusBadge(selectedJob.status)}`}>
                    {getStatusText(selectedJob.status)}
                  </span>
                </div>
                <div className="mjlt-detail-item">
                  <strong>Ứng Viên:</strong>
                  <span>{selectedJob.applicantCount}</span>
                </div>
                <div className="mjlt-detail-item">
                  <strong>Làm Việc:</strong>
                  <span>{selectedJob.isRemote ? '🌐 Remote' : `📍 ${selectedJob.location}`}</span>
                </div>
                <div className="mjlt-detail-item">
                  <strong>Công Ty:</strong>
                  <span>{selectedJob.recruiterCompanyName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="mjlt-modal-overlay" onClick={handleCloseEditModal}>
          <div className="mjlt-modal-content mjlt-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mjlt-modal-header">
              <h3>✏️ Chỉnh Sửa Công Việc</h3>
              <button className="mjlt-close-modal" onClick={handleCloseEditModal}>
                ×
              </button>
            </div>
            <div className="mjlt-modal-body">
              <div className="mjlt-form-group">
                <label>Tiêu Đề *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="mjlt-form-group">
                <label>Mô Tả *</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={5}
                />
              </div>

              <div className="mjlt-form-row">
                <div className="mjlt-form-group">
                  <label>Ngân Sách Min (VND) *</label>
                  <input
                    type="number"
                    value={editForm.minBudget}
                    onChange={(e) => setEditForm(prev => ({ ...prev, minBudget: e.target.value }))}
                  />
                </div>
                <div className="mjlt-form-group">
                  <label>Ngân Sách Max (VND) *</label>
                  <input
                    type="number"
                    value={editForm.maxBudget}
                    onChange={(e) => setEditForm(prev => ({ ...prev, maxBudget: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mjlt-form-group">
                <label>Hạn Chót *</label>
                <input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>

              <div className="mjlt-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.isRemote}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isRemote: e.target.checked }))}
                  />
                  <span> Làm Việc Từ Xa</span>
                </label>
              </div>

              {!editForm.isRemote && (
                <div className="mjlt-form-group">
                  <label>Địa Điểm *</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              )}

              <div className="mjlt-modal-actions">
                <button className="mjlt-btn-secondary" onClick={handleCloseEditModal}>
                  Hủy
                </button>
                <button className="mjlt-btn-primary" onClick={handleSaveEdit}>
                  💾 Lưu Thay Đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinJobListTab;
