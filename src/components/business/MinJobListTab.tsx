import React, { useState } from 'react';
import { MinJob } from '../../pages/main/BusinessPage';
import './MinJobListTab.css';

interface MinJobListTabProps {
  jobs: MinJob[];
  onCloseJob: (jobId: string) => void;
}

const MinJobListTab: React.FC<MinJobListTabProps> = ({ jobs, onCloseJob }) => {
  const [selectedJob, setSelectedJob] = useState<MinJob | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredJobs = jobs.filter(job => 
    filterStatus === 'all' || job.status.toLowerCase() === filterStatus
  );

  const getStatusBadge = (status: MinJob['status']) => {
    const statusClasses = {
      'Open': 'mjlt-status-open',
      'In Progress': 'mjlt-status-progress',
      'Completed': 'mjlt-status-completed',
      'Closed': 'mjlt-status-closed'
    };
    return statusClasses[status] || 'mjlt-status-open';
  };

  const handleViewJob = (job: MinJob) => {
    setSelectedJob(job);
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
  };

  const handleEditJob = (job: MinJob) => {
    // In a real app, this would open an edit form
    alert(`Chức năng chỉnh sửa cho "${job.title}" sẽ được triển khai ở đây`);
  };

  const handleCloseJob = (job: MinJob) => {
    if (window.confirm(`Bạn có chắc chắn muốn đóng "${job.title}"?`)) {
      onCloseJob(job.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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
            <option value="open">Đang Mở</option>
            <option value="in progress">Đang Thực Hiện</option>
            <option value="completed">Hoàn Thành</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="mjlt-jobs-count">
          {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="mjlt-empty-state">
          <div className="mjlt-empty-icon">📋</div>
          <h3>No jobs found</h3>
          <p>
            {filterStatus === 'all' 
              ? "You haven't posted any jobs yet. Create your first MinJob to get started!"
              : `No jobs with status "${filterStatus}" found.`
            }
          </p>
        </div>
      ) : (
        <div className="mjlt-jobs-table-container">
          <table className="mjlt-jobs-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Status</th>
                <th>Budget</th>
                <th>Deadline</th>
                <th>Applicants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <tr key={job.id}>
                  <td>
                    <div className="mjlt-job-title-cell">
                      <strong>{job.title}</strong>
                      <div className="mjlt-job-skills">
                        {job.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="mjlt-skill-mini-tag">
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="mjlt-skill-mini-tag more">
                            +{job.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`mjlt-status-badge ${getStatusBadge(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="mjlt-budget-cell">
                    {formatBudget(job.budget)}
                  </td>
                  <td className="mjlt-deadline-cell">
                    {formatDate(job.deadline)}
                  </td>
                  <td className="mjlt-applicants-cell">
                    <span className="mjlt-applicants-count">
                      {job.applicants}
                    </span>
                  </td>
                  <td>
                    <div className="mjlt-action-buttons">
                      <button
                        className="mjlt-action-btn mjlt-view-btn"
                        onClick={() => handleViewJob(job)}
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        className="mjlt-action-btn mjlt-edit-btn"
                        onClick={() => handleEditJob(job)}
                        disabled={job.status === 'Closed'}
                        title="Edit Job"
                      >
                        Edit
                      </button>
                      <button
                        className="mjlt-action-btn mjlt-close-btn"
                        onClick={() => handleCloseJob(job)}
                        disabled={job.status === 'Closed' || job.status === 'Completed'}
                        title="Close Job"
                      >
                        Close
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
        <div className="mjlt-modal-overlay">
          <div className="mjlt-modal-content">
            <div className="mjlt-modal-header">
              <h3>{selectedJob.title}</h3>
              <button className="mjlt-close-modal" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="mjlt-modal-body">
              <div className="mjlt-job-detail-section">
                <h4>Description</h4>
                <p>{selectedJob.description}</p>
              </div>
              
              <div className="mjlt-job-detail-section">
                <h4>Required Skills</h4>
                <div className="mjlt-skills-display">
                  {selectedJob.skills.map(skill => (
                    <span key={skill} className="mjlt-skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mjlt-job-detail-grid">
                <div className="mjlt-detail-item">
                  <strong>Budget:</strong>
                  <span>{formatBudget(selectedJob.budget)}</span>
                </div>
                <div className="mjlt-detail-item">
                  <strong>Deadline:</strong>
                  <span>{formatDate(selectedJob.deadline)}</span>
                </div>
                <div className="mjlt-detail-item">
                  <strong>Status:</strong>
                  <span className={`mjlt-status-badge ${getStatusBadge(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                </div>
                <div className="mjlt-detail-item">
                  <strong>Applicants:</strong>
                  <span>{selectedJob.applicants}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinJobListTab;
