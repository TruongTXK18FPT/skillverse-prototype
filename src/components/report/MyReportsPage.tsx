import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, Search, Clock, Eye, CheckCircle, XCircle,
  ChevronDown, Calendar, User, AlertTriangle, Filter,
  RefreshCw, Shield, ArrowLeft
} from 'lucide-react';
import violationReportService, {
  ViolationReportResponse,
  REPORT_TYPES,
  REPORT_STATUSES
} from '../../services/violationReportService';
import './MyReportsPage.css';

interface MyReportsPageProps {
  userId?: number;
  onBack?: () => void;
  onViewReport?: (report: ViolationReportResponse) => void;
}

const MyReportsPage: React.FC<MyReportsPageProps> = ({
  userId: propUserId,
  onBack,
  onViewReport
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use userId from props, auth context, or redirect if not available
  const userId = propUserId || user?.id;
  
  const [reports, setReports] = useState<ViolationReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    loadReports();
  }, [userId, navigate]);

  const loadReports = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await violationReportService.getMyReports(userId);
      setReports(data);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError('Không thể tải danh sách báo cáo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedUserName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} />;
      case 'INVESTIGATING': return <Eye size={14} />;
      case 'RESOLVED': return <CheckCircle size={14} />;
      case 'DISMISSED': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'severity-high';
      case 'MEDIUM': return 'severity-medium';
      case 'LOW': return 'severity-low';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="vr-my-reports-page">
        <div className="vr-loading-state">
          <RefreshCw size={32} className="vr-spinning" />
          <span>Đang tải danh sách báo cáo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vr-my-reports-page">
      {/* Header */}
      <div className="vr-reports-header">
        <button className="vr-btn-back" onClick={() => onBack ? onBack() : navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="vr-header-icon">
          <Shield size={24} />
        </div>
        <div className="vr-header-text">
          <h2>Báo Cáo Của Tôi</h2>
          <p>Theo dõi trạng thái các báo cáo bạn đã gửi</p>
        </div>
        <button className="vr-btn-refresh" onClick={loadReports}>
          <RefreshCw size={18} />
        </button>
      </div>

      {error && (
        <div className="vr-error-alert">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="vr-reports-filters">
        <div className="vr-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, mã báo cáo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="vr-filter-tabs">
          <button 
            className={`vr-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <Filter size={14} />
            Tất cả ({reports.length})
          </button>
          <button 
            className={`vr-filter-tab pending ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            <Clock size={14} />
            Chờ xử lý
          </button>
          <button 
            className={`vr-filter-tab investigating ${statusFilter === 'INVESTIGATING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('INVESTIGATING')}
          >
            <Eye size={14} />
            Đang điều tra
          </button>
          <button 
            className={`vr-filter-tab resolved ${statusFilter === 'RESOLVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('RESOLVED')}
          >
            <CheckCircle size={14} />
            Đã giải quyết
          </button>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="vr-empty-state">
          <FileText size={48} />
          <h3>Không có báo cáo nào</h3>
          <p>Bạn chưa gửi báo cáo nào hoặc không có kết quả phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="vr-reports-list">
          {filteredReports.map((report) => (
            <div 
              key={report.id} 
              className={`vr-report-card ${getSeverityClass(report.severity)} ${expandedReport === report.id ? 'expanded' : ''}`}
            >
              {/* Report Header */}
              <div 
                className="vr-report-card-header"
                onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
              >
                <div className={`vr-report-severity ${report.severity.toLowerCase()}`}>
                  <AlertTriangle size={16} />
                </div>
                
                <div className="vr-report-main">
                  <h4>{report.title}</h4>
                  <div className="vr-report-meta">
                    <span className="vr-report-code">{report.reportCode}</span>
                    <span><Calendar size={12} /> {formatDate(report.createdAt)}</span>
                    <span className="vr-report-type-badge">
                      {REPORT_TYPES[report.reportType as keyof typeof REPORT_TYPES]}
                    </span>
                  </div>
                </div>

                <div className={`vr-report-status ${report.status.toLowerCase()}`}>
                  {getStatusIcon(report.status)}
                  <span>{REPORT_STATUSES[report.status as keyof typeof REPORT_STATUSES]}</span>
                </div>

                <ChevronDown 
                  size={20} 
                  className={`vr-expand-icon ${expandedReport === report.id ? 'rotated' : ''}`} 
                />
              </div>

              {/* Expanded Content */}
              {expandedReport === report.id && (
                <div className="vr-report-card-body">
                  <div className="vr-report-parties">
                    <div className="vr-party reported">
                      <div className="vr-party-label">Người bị báo cáo</div>
                      <div className="vr-party-info">
                        <User size={16} />
                        <span>{report.reportedUserName || 'N/A'}</span>
                        <span className="vr-party-id">(ID: {report.reportedUserId})</span>
                      </div>
                    </div>
                  </div>

                  <div className="vr-report-description">
                    <h5><FileText size={16} /> Mô tả</h5>
                    <p>{report.description}</p>
                  </div>

                  {report.evidences && report.evidences.length > 0 && (
                    <div className="vr-report-evidences">
                      <h5>Bằng chứng đính kèm ({report.evidences.length})</h5>
                      <div className="vr-evidence-tags">
                        {report.evidences.map((ev, idx) => (
                          <span key={idx} className="vr-evidence-tag">
                            {ev.evidenceType}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.adminNotes && (
                    <div className="vr-admin-response">
                      <h5>Phản hồi từ Admin</h5>
                      <p>{report.adminNotes}</p>
                    </div>
                  )}

                  {report.resolutionAction && (
                    <div className="vr-resolution-info">
                      <span className="vr-resolution-label">Hành động:</span>
                      <span className="vr-resolution-action">{report.resolutionAction}</span>
                    </div>
                  )}

                  {onViewReport && (
                    <button 
                      className="vr-btn-view-detail"
                      onClick={() => onViewReport(report)}
                    >
                      <Eye size={16} />
                      Xem chi tiết
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
