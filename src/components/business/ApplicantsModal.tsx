import React, { useState, useEffect } from 'react';
import jobService from '../../services/jobService';
import { JobApplicationResponse, JobApplicationStatus } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import './ApplicantsModal.css';

interface ApplicantsModalProps {
  jobId: number;
  jobTitle: string;
  onClose: () => void;
  onAccept: (applicationId: number, applicantName: string) => void;
  onReject: (applicationId: number, applicantName: string) => void;
  refreshTrigger?: number; // Increment this to trigger refresh
}

const ApplicantsModal: React.FC<ApplicantsModalProps> = ({
  jobId,
  jobTitle,
  onClose,
  onAccept,
  onReject,
  refreshTrigger
}) => {
  const { showError } = useToast();
  const [applications, setApplications] = useState<JobApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchApplicants();
  }, [jobId, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchApplicants = async () => {
    setIsLoading(true);
    try {
      const data = await jobService.getJobApplicants(jobId);
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      showError('Lỗi Tải Dữ Liệu', 'Không thể tải danh sách ứng viên');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: JobApplicationStatus): string => {
    const statusClasses = {
      'PENDING': 'am-status-pending',
      'REVIEWED': 'am-status-reviewed',
      'ACCEPTED': 'am-status-accepted',
      'REJECTED': 'am-status-rejected'
    };
    return statusClasses[status] || 'am-status-pending';
  };

  const getStatusText = (status: JobApplicationStatus): string => {
    const statusTexts = {
      'PENDING': 'Chờ Xét',
      'REVIEWED': 'Đã Xem',
      'ACCEPTED': 'Chấp Nhận',
      'REJECTED': 'Từ Chối'
    };
    return statusTexts[status] || status;
  };

  const handleMarkReviewed = async (applicationId: number) => {
    if (processingIds.has(applicationId)) return; // Prevent double-click
    
    setProcessingIds(prev => new Set(prev).add(applicationId));
    try {
      await jobService.updateApplicationStatus(applicationId, {
        status: 'REVIEWED' as JobApplicationStatus,
        acceptanceMessage: undefined,
        rejectionReason: undefined
      });
      fetchApplicants(); // Refresh list
    } catch (error) {
      console.error('Error marking reviewed:', error);
      showError('Lỗi Cập Nhật', error instanceof Error ? error.message : 'Không thể đánh dấu đã xem');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="am-modal-overlay" onClick={onClose}>
      <div className="am-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="am-modal-header">
          <div>
            <h3>👥 Danh Sách Ứng Viên</h3>
            <p className="am-job-title">{jobTitle}</p>
          </div>
          <button className="am-close-modal" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="am-modal-body">
          {isLoading ? (
            <div className="am-loading-state">
              <div className="am-spinner"></div>
              <p>Đang tải...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="am-empty-state">
              <div className="am-empty-icon">📭</div>
              <h4>Chưa Có Ứng Viên</h4>
              <p>Chưa có ai ứng tuyển cho công việc này.</p>
            </div>
          ) : (
            <div className="am-applicants-table-container">
              <table className="am-applicants-table">
                <thead>
                  <tr>
                    <th>Ứng Viên</th>
                    <th>Ngày Ứng Tuyển</th>
                    <th>Trạng Thái</th>
                    <th>Cover Letter</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td>
                        <div className="am-user-cell">
                          <strong>{app.userFullName}</strong>
                          <small>{app.userEmail}</small>
                        </div>
                      </td>
                      <td className="am-date-cell">
                        {formatDate(app.appliedAt)}
                      </td>
                      <td>
                        <span className={`am-status-badge ${getStatusBadge(app.status)}`}>
                          {getStatusText(app.status)}
                        </span>
                      </td>
                      <td className="am-coverletter-cell">
                        {app.coverLetter ? (
                          <>
                            <button
                              className="am-expand-btn"
                              onClick={() => toggleExpand(app.id)}
                            >
                              {expandedId === app.id ? '▼ Ẩn' : '▶ Xem'}
                            </button>
                            {expandedId === app.id && (
                              <div className="am-coverletter-content">
                                {app.coverLetter}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="am-no-coverletter">Không có</span>
                        )}
                      </td>
                      <td>
                        <div className="am-action-buttons">
                          {app.status === 'PENDING' && (
                            <button
                              className="am-action-btn am-reviewed-btn"
                              onClick={() => handleMarkReviewed(app.id)}
                              disabled={processingIds.has(app.id)}
                              title="Đánh Dấu Đã Xem"
                            >
                              {processingIds.has(app.id) ? '⏳ Đang xử lý...' : '👁️ Đã Xem'}
                            </button>
                          )}
                          {(app.status === 'PENDING' || app.status === 'REVIEWED') && (
                            <>
                              <button
                                className="am-action-btn am-accept-btn"
                                onClick={() => onAccept(app.id, app.userFullName)}
                                title="Chấp Nhận"
                              >
                                ✅ Chấp Nhận
                              </button>
                              <button
                                className="am-action-btn am-reject-btn"
                                onClick={() => onReject(app.id, app.userFullName)}
                                title="Từ Chối"
                              >
                                ❌ Từ Chối
                              </button>
                            </>
                          )}
                          {app.status === 'ACCEPTED' && app.acceptanceMessage && (
                            <div className="am-message-display">
                              <strong>Tin nhắn:</strong>
                              <p>{app.acceptanceMessage}</p>
                            </div>
                          )}
                          {app.status === 'REJECTED' && app.rejectionReason && (
                            <div className="am-message-display am-rejection">
                              <strong>Lý do:</strong>
                              <p>{app.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantsModal;
