import React, { useState, useEffect } from 'react';
import jobService from '../../services/jobService';
import { JobApplicationResponse } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import { Clock, MapPin, DollarSign, Calendar, Briefcase, CheckCircle, XCircle, Eye } from 'lucide-react';
import './MyApplicationsPage.css';

const MyApplicationsPage: React.FC = () => {
  const { showError } = useToast();
  const [applications, setApplications] = useState<JobApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  const fetchMyApplications = async () => {
    setLoading(true);
    try {
      const data = await jobService.getMyApplications();
      // Sort by appliedAt desc (newest first)
      data.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      showError('Lỗi', 'Không thể tải danh sách ứng tuyển');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          text: 'Đang Chờ', 
          color: '#f59e0b', 
          icon: <Clock size={16} />,
          bg: 'rgba(245, 158, 11, 0.1)'
        };
      case 'REVIEWED':
        return { 
          text: 'Đã Xem', 
          color: '#3b82f6', 
          icon: <Eye size={16} />,
          bg: 'rgba(59, 130, 246, 0.1)'
        };
      case 'ACCEPTED':
        return { 
          text: 'Được Chấp Nhận', 
          color: '#10b981', 
          icon: <CheckCircle size={16} />,
          bg: 'rgba(16, 185, 129, 0.1)'
        };
      case 'REJECTED':
        return { 
          text: 'Bị Từ Chối', 
          color: '#ef4444', 
          icon: <XCircle size={16} />,
          bg: 'rgba(239, 68, 68, 0.1)'
        };
      default:
        return { 
          text: status, 
          color: '#6b7280', 
          icon: <Clock size={16} />,
          bg: 'rgba(107, 114, 128, 0.1)'
        };
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'ALL') return true;
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'PENDING').length,
    reviewed: applications.filter(a => a.status === 'REVIEWED').length,
    accepted: applications.filter(a => a.status === 'ACCEPTED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="my-applications-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải danh sách ứng tuyển...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-applications-page">
      <div className="map-header">
        <div className="map-header-content">
          <h1>📋 Đơn Ứng Tuyển Của Tôi</h1>
          <p>Theo dõi trạng thái các công việc bạn đã ứng tuyển</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="map-stats-grid">
        <div className="map-stat-card" onClick={() => setFilter('ALL')} style={{ cursor: 'pointer', borderColor: filter === 'ALL' ? '#3498db' : 'transparent' }}>
          <div className="map-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Briefcase size={24} />
          </div>
          <div className="map-stat-info">
            <h3>{stats.total}</h3>
            <p>Tổng Đơn</p>
          </div>
        </div>

        <div className="map-stat-card" onClick={() => setFilter('PENDING')} style={{ cursor: 'pointer', borderColor: filter === 'PENDING' ? '#f59e0b' : 'transparent' }}>
          <div className="map-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Clock size={24} />
          </div>
          <div className="map-stat-info">
            <h3>{stats.pending}</h3>
            <p>Đang Chờ</p>
          </div>
        </div>

        <div className="map-stat-card" onClick={() => setFilter('REVIEWED')} style={{ cursor: 'pointer', borderColor: filter === 'REVIEWED' ? '#3b82f6' : 'transparent' }}>
          <div className="map-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <Eye size={24} />
          </div>
          <div className="map-stat-info">
            <h3>{stats.reviewed}</h3>
            <p>Đã Xem</p>
          </div>
        </div>

        <div className="map-stat-card" onClick={() => setFilter('ACCEPTED')} style={{ cursor: 'pointer', borderColor: filter === 'ACCEPTED' ? '#10b981' : 'transparent' }}>
          <div className="map-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="map-stat-info">
            <h3>{stats.accepted}</h3>
            <p>Chấp Nhận</p>
          </div>
        </div>

        <div className="map-stat-card" onClick={() => setFilter('REJECTED')} style={{ cursor: 'pointer', borderColor: filter === 'REJECTED' ? '#ef4444' : 'transparent' }}>
          <div className="map-stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <XCircle size={24} />
          </div>
          <div className="map-stat-info">
            <h3>{stats.rejected}</h3>
            <p>Từ Chối</p>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="map-content">
        {filteredApplications.length === 0 ? (
          <div className="map-empty-state">
            <div className="map-empty-icon">📭</div>
            <h3>Chưa Có Đơn Ứng Tuyển</h3>
            <p>
              {filter === 'ALL' 
                ? 'Bạn chưa ứng tuyển công việc nào. Hãy khám phá các công việc mới!'
                : `Không có đơn ứng tuyển với trạng thái "${getStatusInfo(filter).text}"`
              }
            </p>
            <button 
              className="map-cta-button"
              onClick={() => window.location.href = '/jobs'}
            >
              🔍 Tìm Công Việc
            </button>
          </div>
        ) : (
          <div className="map-applications-grid">
            {filteredApplications.map((app) => {
              const statusInfo = getStatusInfo(app.status);
              return (
                <div key={app.id} className="map-application-card">
                  {/* Card Header */}
                  <div className="map-card-header">
                    <h3>{app.jobTitle}</h3>
                    <div 
                      className="map-status-badge"
                      style={{ 
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        border: `2px solid ${statusInfo.color}40`
                      }}
                    >
                      {statusInfo.icon}
                      <span>{statusInfo.text}</span>
                    </div>
                  </div>

                  {/* Job Meta */}
                  <div className="map-card-meta">
                    <div className="map-meta-item">
                      <Briefcase size={16} />
                      <span>{app.recruiterCompanyName}</span>
                    </div>
                    <div className="map-meta-item">
                      <DollarSign size={16} />
                      <span>{formatBudget(app.minBudget, app.maxBudget)}</span>
                    </div>
                    <div className="map-meta-item">
                      <MapPin size={16} />
                      <span>{app.isRemote ? '🌐 Từ Xa' : `📍 ${app.location}`}</span>
                    </div>
                    <div className="map-meta-item">
                      <Calendar size={16} />
                      <span>Ứng tuyển: {formatDate(app.appliedAt)}</span>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {app.coverLetter && (
                    <div className="map-cover-letter">
                      <strong>📝 Cover Letter:</strong>
                      <p>{app.coverLetter}</p>
                    </div>
                  )}

                  {/* Response Messages */}
                  {app.acceptanceMessage && (
                    <div className="map-response-message map-acceptance">
                      <CheckCircle size={18} />
                      <div>
                        <strong>✅ Tin Nhắn Chấp Nhận:</strong>
                        <p>{app.acceptanceMessage}</p>
                      </div>
                    </div>
                  )}

                  {app.rejectionReason && (
                    <div className="map-response-message map-rejection">
                      <XCircle size={18} />
                      <div>
                        <strong>❌ Lý Do Từ Chối:</strong>
                        <p>{app.rejectionReason}</p>
                      </div>
                    </div>
                  )}

                  {/* Processed Date */}
                  {app.processedAt && (
                    <div className="map-processed-date">
                      <Clock size={14} />
                      <span>Xử lý: {formatDate(app.processedAt)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplicationsPage;
