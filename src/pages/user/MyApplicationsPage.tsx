import React, { useState, useEffect } from 'react';
import jobService from '../../services/jobService';
import { JobApplicationResponse } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import { Clock, MapPin, DollarSign, Calendar, CheckCircle, XCircle, Eye } from 'lucide-react';
import OdysseyLayout from '../../components/jobs-odyssey/OdysseyLayout';
import '../../components/jobs-odyssey/odyssey-styles.css';

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
      showError('Lỗi tải dữ liệu', 'Không thể tải danh sách ứng tuyển. Vui lòng thử lại.');
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
      <OdysseyLayout>
        <div className="odyssey-loading">
          <div className="odyssey-loading__spinner"></div>
          <p className="odyssey-loading__text">Đang tải danh sách ứng tuyển...</p>
        </div>
      </OdysseyLayout>
    );
  }

  return (
    <OdysseyLayout>
      <header className="odyssey-header">
        <h1 className="odyssey-header__title">Đơn Ứng Tuyển</h1>
        <p className="odyssey-header__subtitle">Theo dõi trạng thái công việc đã ứng tuyển</p>
      </header>

      {/* Status Filter Console */}
      <div className="odyssey-filter-console">
        <div className="odyssey-filter-console__content odyssey-filter-console__content--expanded">
          <div className="odyssey-filter-console__section">
            <label className="odyssey-filter-console__label">
              <span className="odyssey-filter-console__label-icon">◆</span>
              Trạng thái
            </label>
            <div className="odyssey-filter-console__toggle-group">
              {[
                { key: 'ALL', label: `Tất cả (${stats.total})` },
                { key: 'PENDING', label: `Đang chờ (${stats.pending})` },
                { key: 'REVIEWED', label: `Đã xem (${stats.reviewed})` },
                { key: 'ACCEPTED', label: `Chấp nhận (${stats.accepted})` },
                { key: 'REJECTED', label: `Từ chối (${stats.rejected})` }
              ].map((s) => (
                <button
                  key={s.key}
                  className={`odyssey-filter-console__toggle ${filter === s.key ? 'odyssey-filter-console__toggle--active' : ''}`}
                  onClick={() => setFilter(s.key)}
                >
                  <span className="odyssey-filter-console__toggle-led"></span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="odyssey-content">
        {filteredApplications.length === 0 ? (
          <div className="odyssey-empty">
            <div className="odyssey-empty__icon">📭</div>
            <h3 className="odyssey-empty__title">Chưa có đơn ứng tuyển</h3>
            <p className="odyssey-empty__text">
              {filter === 'ALL' 
                ? 'Bạn chưa ứng tuyển công việc nào. Khám phá công việc mới ngay!'
                : `Không có đơn ứng tuyển với trạng thái "${getStatusInfo(filter).text}"`
              }
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button className="odyssey-card__btn" onClick={() => window.location.href = '/jobs'}>
                <span>Tìm công việc</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="odyssey-grid">
            {filteredApplications.map((app) => (
              <div key={app.id} className="odyssey-card-wrapper">
                <div className={`odyssey-card odyssey-card--${((app.minBudget + app.maxBudget) / 2) > 5000000 ? 'crimson' : ((app.minBudget + app.maxBudget) / 2) >= 1000000 ? 'gold' : 'blue'}`}>
                  <div className="odyssey-card__corner-indicator odyssey-card__corner-indicator--tl"></div>
                  <div className="odyssey-card__corner-indicator odyssey-card__corner-indicator--br"></div>

                  <div className="odyssey-card__content-wrapper">
                    <div className="odyssey-card__faction">
                      <div className="odyssey-card__faction-ring">
                        {app.recruiterCompanyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <div className="odyssey-card__company">{app.recruiterCompanyName}</div>
                    </div>

                    <div className="odyssey-card__content">
                      <h3 className="odyssey-card__title">{app.jobTitle}</h3>
                    </div>

                    <div className="odyssey-card__meta">
                      <div className="odyssey-card__meta-item">
                        <DollarSign className="odyssey-card__meta-icon" size={16} />
                        <span>{formatBudget(app.minBudget, app.maxBudget)}</span>
                      </div>
                      <div className="odyssey-card__meta-item">
                        <MapPin className="odyssey-card__meta-icon" size={16} />
                        <span>{app.isRemote ? '🌐 Từ xa' : `📍 ${app.location}`}</span>
                      </div>
                      <div className="odyssey-card__meta-item">
                        <Calendar className="odyssey-card__meta-icon" size={16} />
                        <span>Ứng tuyển: {formatDate(app.appliedAt)}</span>
                      </div>
                    </div>

                    {app.coverLetter && (
                      <p className="odyssey-card__description">📝 {app.coverLetter}</p>
                    )}

                    <div className="odyssey-card__badge" style={{ background: getStatusInfo(app.status).bg, color: getStatusInfo(app.status).color }}>
                      {getStatusInfo(app.status).icon}
                      <span style={{ marginLeft: '0.5rem' }}>{getStatusInfo(app.status).text}</span>
                    </div>

                    {app.acceptanceMessage && (
                      <p className="odyssey-card__description" style={{ color: '#10b981' }}>✅ {app.acceptanceMessage}</p>
                    )}
                    {app.rejectionReason && (
                      <p className="odyssey-card__description" style={{ color: '#ef4444' }}>❌ {app.rejectionReason}</p>
                    )}

                    {app.processedAt && (
                      <div className="odyssey-card__meta" style={{ marginTop: '0.5rem' }}>
                        <div className="odyssey-card__meta-item">
                          <Clock className="odyssey-card__meta-icon" size={14} />
                          <span>Xử lý: {formatDate(app.processedAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </OdysseyLayout>
  );
};

export default MyApplicationsPage;
