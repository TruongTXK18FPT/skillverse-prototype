import React, { useState, useEffect } from 'react';
import jobService from '../../services/jobService';
import { JobApplicationResponse, JobApplicationStatus } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import './ApplicantsModal-fleet.css';

interface ApplicantsModalProps {
  jobId: number;
  jobTitle: string;
  onClose: () => void;
  onAccept: (applicationId: number, applicantName: string) => void;
  onReject: (applicationId: number, applicantName: string) => void;
  refreshTrigger?: number;
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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchApplicants(page);
  }, [jobId, refreshTrigger, page]);

  const fetchApplicants = async (pageNumber: number) => {
    setIsLoading(true);
    try {
      const result = await jobService.getJobApplicants(jobId, pageNumber, 3); // 3 items per page
      setApplications(result.content);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      showError('Lỗi Tải Dữ Liệu', 'Không thể tải danh sách ứng viên');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: JobApplicationStatus): string => {
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
    if (processingIds.has(applicationId)) return;
    
    setProcessingIds(prev => new Set(prev).add(applicationId));
    try {
      await jobService.updateApplicationStatus(applicationId, {
        status: 'REVIEWED' as JobApplicationStatus,
        acceptanceMessage: undefined,
        rejectionReason: undefined
      });
      // Update local state immediately without waiting for fetch
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: 'REVIEWED' as JobApplicationStatus } : app
      ));
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
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="am-fleet-overlay" onClick={onClose}>
      <div className="am-fleet-content" onClick={(e) => e.stopPropagation()}>
        <div className="am-fleet-header">
          <div className="am-fleet-title">
            <h3>👥 Danh Sách Ứng Viên</h3>
            <p className="am-fleet-subtitle">TIN TUYỂN DỤNG: {jobTitle}</p>
          </div>
          <button className="am-fleet-close" onClick={onClose}>×</button>
        </div>

        <div className="am-fleet-body">
          {isLoading ? (
            <div className="am-loading-state">
              <MeowlKuruLoader size="medium" text="" />
              <p>Đang tải...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="am-fleet-empty">
              <div className="am-fleet-empty-icon">📭</div>
              <h4>Chưa Có Ứng Viên</h4>
              <p>Chưa có ai ứng tuyển cho vị trí này.</p>
            </div>
          ) : (
            <table className="am-fleet-table">
              <thead>
                <tr>
                  <th>Ứng Viên</th>
                  <th>Thời Gian</th>
                  <th>Trạng Thái</th>
                  <th>Hồ Sơ (Cover Letter)</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className={app.isHighlighted ? 'am-fleet-row-highlighted' : ''}>
                    <td>
                      <div className="am-fleet-user-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>{app.userFullName}</strong>
                        </div>
                        <small>{app.userEmail}</small>
                        {app.portfolioSlug && (
                          <a 
                            href={`/portfolio/${app.portfolioSlug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="am-fleet-portfolio-link"
                          >
                            🔗 Xem Portfolio
                          </a>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(app.appliedAt)}</td>
                    <td>
                      <span className={`am-fleet-badge ${getStatusBadgeClass(app.status)}`}>
                        {getStatusText(app.status)}
                      </span>
                    </td>
                    <td>
                      {app.coverLetter ? (
                        <>
                          <button className="am-fleet-cover-btn" onClick={() => toggleExpand(app.id)}>
                            {expandedId === app.id ? '▼ Ẩn' : '▶ Xem Chi Tiết'}
                          </button>
                          {expandedId === app.id && (
                            <div className="am-fleet-cover-content">
                              {app.coverLetter}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Không có</span>
                      )}
                    </td>
                    <td>
                      <div className="am-fleet-actions">
                        {app.status === 'PENDING' && (
                          <button
                            className="am-btn-action am-btn-review"
                            onClick={() => handleMarkReviewed(app.id)}
                            disabled={processingIds.has(app.id)}
                          >
                            {processingIds.has(app.id) ? '...' : '👁️ Đã Xem'}
                          </button>
                        )}
                        {(app.status === 'PENDING' || app.status === 'REVIEWED') && (
                          <>
                            <button
                              className="am-btn-action am-btn-accept"
                              onClick={() => onAccept(app.id, app.userFullName)}
                            >
                              ✅ Duyệt
                            </button>
                            <button
                              className="am-btn-action am-btn-reject"
                              onClick={() => onReject(app.id, app.userFullName)}
                            >
                              ❌ Loại
                            </button>
                          </>
                        )}
                        {app.status === 'ACCEPTED' && <span style={{color: '#34d399'}}>Đã duyệt vào đội</span>}
                        {app.status === 'REJECTED' && <span style={{color: '#f87171'}}>Đã từ chối</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {totalPages > 1 && (
            <div className="am-fleet-pagination" style={{
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              marginTop: '20px', 
              gap: '15px',
              padding: '10px 0',
              borderTop: '1px solid rgba(45, 212, 191, 0.2)'
            }}>
              <button
                className="am-fleet-pagination-btn"
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid #2dd4bf',
                  color: '#2dd4bf',
                  padding: '5px 15px',
                  borderRadius: '4px',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                  opacity: page === 0 ? 0.5 : 1
                }}
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                &lt; Trước
              </button>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="am-fleet-pagination-btn"
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid #2dd4bf',
                  color: '#2dd4bf',
                  padding: '5px 15px',
                  borderRadius: '4px',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages - 1 ? 0.5 : 1
                }}
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Sau &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantsModal;
