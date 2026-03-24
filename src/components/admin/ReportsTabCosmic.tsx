import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Shield, Search, Filter, RefreshCw,
  Eye, CheckCircle, XCircle, AlertOctagon, Clock,
  User, FileText, Ban, Scale, ChevronDown, ExternalLink,
  Paperclip, Calendar, TrendingUp, Flag, Gavel, ShieldAlert, ShieldCheck
} from 'lucide-react';
import violationReportService, {
  ViolationReportResponse,
  ViolationReportStatsResponse,
  REPORT_TYPES,
  REPORT_STATUSES,
  RESOLUTION_ACTIONS
} from '../../services/violationReportService';
import ReportActionModals from './ReportActionModals';
import { showAppError } from '../../context/ToastContext';
import './ReportsTabCosmic.css';

const ReportsTabCosmic: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  const [reports, setReports] = useState<ViolationReportResponse[]>([]);
  const [stats, setStats] = useState<ViolationReportStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState<ViolationReportResponse | null>(null);
  const [modalAction, setModalAction] = useState<'investigate' | 'resolve' | 'escalate' | 'dismiss' | null>(null);

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load stats and reports in parallel
      const [statsData, reportsData] = await Promise.all([
        violationReportService.getReportStats(),
        violationReportService.getAllReports(
          activeFilter === 'all' ? undefined : activeFilter.toUpperCase(),
          undefined,
          undefined,
          0,
          100
        )
      ]);
      setStats(statsData);
      setReports(reportsData.content);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError('Không thể tải dữ liệu báo cáo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedUserName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'HIGH': return <AlertOctagon size={16} />;
      case 'MEDIUM': return <AlertTriangle size={16} />;
      default: return <Flag size={16} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return <Clock size={14} />;
      case 'INVESTIGATING': return <Eye size={14} />;
      case 'RESOLVED': return <CheckCircle size={14} />;
      case 'DISMISSED': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleAction = async (reportId: number, action: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    setSelectedReport(report);
    setModalAction(action as any);
  };

  const handleModalSubmit = async (action: string, data: any) => {
    if (!selectedReport) return;
    
    setActionLoading(selectedReport.id);
    try {
      switch (action) {
        case 'investigate':
          // Use admin ID from auth context or default
          await violationReportService.investigateReport(selectedReport.id, 1);
          break;
        case 'resolve':
          await violationReportService.resolveReport(
            selectedReport.id,
            data.resolutionAction,
            data.adminNotes
          );
          break;
        case 'escalate':
          await violationReportService.escalateReport(selectedReport.id, data.adminNotes);
          break;
        case 'dismiss':
          await violationReportService.dismissReport(selectedReport.id, data.adminNotes);
          break;
      }
      
      // Close modal and reload data
      setSelectedReport(null);
      setModalAction(null);
      await loadData();
    } catch (err: any) {
      console.error('Error performing action:', err);
      showAppError('Không thể thực hiện hành động', 'Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleModalClose = () => {
    setSelectedReport(null);
    setModalAction(null);
  };

  const handleRefresh = () => {
    loadData();
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

  return (
    <div className="rpt-cosmic">
      {/* Header Section */}
      <div className="rpt-section rpt-section-header">
        <div className="rpt-header">
          <div className="rpt-header-left">
            <div className="rpt-header-icon">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h2>Quản Lý Báo Cáo Vi Phạm</h2>
              <p>Xem xét và xử lý các báo cáo vi phạm từ người dùng</p>
            </div>
          </div>
          <button className="rpt-refresh-btn" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="rpt-error-alert">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="rpt-section rpt-section-stats">
          <div className="rpt-stats-grid">
            {/* New Reports - Red/Orange */}
            <div className="rpt-stat-card vibrant-red">
              <div className="rpt-stat-glow"></div>
              <div className="rpt-stat-icon">
                <Flag size={26} />
              </div>
              <div className="rpt-stat-content">
                <div className="rpt-stat-value">{stats.newReports}</div>
                <div className="rpt-stat-label">Báo cáo mới</div>
              </div>
            </div>

            {/* Investigating - Yellow */}
            <div className="rpt-stat-card vibrant-yellow">
              <div className="rpt-stat-glow"></div>
              <div className="rpt-stat-icon">
                <Eye size={26} />
              </div>
              <div className="rpt-stat-content">
                <div className="rpt-stat-value">{stats.investigatingReports}</div>
                <div className="rpt-stat-label">Đang điều tra</div>
              </div>
            </div>

            {/* Resolved - Green */}
            <div className="rpt-stat-card vibrant-green">
              <div className="rpt-stat-glow"></div>
              <div className="rpt-stat-icon">
                <ShieldCheck size={26} />
              </div>
              <div className="rpt-stat-content">
                <div className="rpt-stat-value">{stats.resolvedReports}</div>
                <div className="rpt-stat-label">Đã giải quyết</div>
              </div>
            </div>

            {/* Critical - Purple/Magenta */}
            <div className="rpt-stat-card vibrant-purple">
              <div className="rpt-stat-glow"></div>
              <div className="rpt-stat-icon">
                <AlertOctagon size={26} />
              </div>
              <div className="rpt-stat-content">
                <div className="rpt-stat-value">{stats.criticalReports}</div>
                <div className="rpt-stat-label">Nghiêm trọng</div>
              </div>
            </div>

            {/* This Week - Cyan */}
            <div className="rpt-stat-card vibrant-cyan">
              <div className="rpt-stat-glow"></div>
              <div className="rpt-stat-icon">
                <TrendingUp size={26} />
              </div>
              <div className="rpt-stat-content">
                <div className="rpt-stat-value">{stats.reportsThisWeek}</div>
                <div className="rpt-stat-label">Tuần này</div>
              </div>
            </div>

            {/* Response Rate - Blue */}
            <div className="rpt-stat-card vibrant-blue">
              <div className="rpt-stat-glow"></div>
              <div className="rpt-stat-icon">
                <Scale size={26} />
              </div>
              <div className="rpt-stat-content">
                <div className="rpt-stat-value">{stats.responseRate}%</div>
                <div className="rpt-stat-label">Tỷ lệ xử lý</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="rpt-section rpt-section-filters">
        <div className="rpt-filters-row">
          <div className="rpt-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm báo cáo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="rpt-filter-tabs">
            <button 
              className={`rpt-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <Filter size={14} />
              Tất cả
            </button>
            <button 
              className={`rpt-filter-tab pending ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              <Clock size={14} />
              Chờ xử lý
            </button>
            <button 
              className={`rpt-filter-tab investigating ${activeFilter === 'investigating' ? 'active' : ''}`}
              onClick={() => setActiveFilter('investigating')}
            >
              <Eye size={14} />
              Đang điều tra
            </button>
            <button 
              className={`rpt-filter-tab resolved ${activeFilter === 'resolved' ? 'active' : ''}`}
              onClick={() => setActiveFilter('resolved')}
            >
              <CheckCircle size={14} />
              Đã giải quyết
            </button>
          </div>
        </div>
      </div>

      {/* Reports List Section */}
      {loading ? (
        <div className="rpt-loading-state">
          <RefreshCw size={32} className="spinning" />
          <span>Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="rpt-section rpt-section-list">
          <div className="rpt-list-header">
            <Shield size={20} />
            <h3>Danh Sách Báo Cáo ({filteredReports.length})</h3>
          </div>

          {filteredReports.length === 0 ? (
            <div className="rpt-empty-state">
              <FileText size={48} />
              <h3>Không có báo cáo nào</h3>
              <p>Không tìm thấy báo cáo phù hợp với bộ lọc.</p>
            </div>
          ) : (
            <div className="rpt-reports-list">
              {filteredReports.map((report) => (
                <div 
                  key={report.id} 
                  className={`rpt-report-card ${report.severity.toLowerCase()} ${expandedReport === report.id ? 'expanded' : ''}`}
                >
                  {/* Report Header */}
                  <div 
                    className="rpt-report-header"
                    onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                  >
                    <div className="rpt-report-severity">
                      {getSeverityIcon(report.severity)}
                    </div>
                    
                    <div className="rpt-report-main">
                      <h4>{report.title}</h4>
                      <div className="rpt-report-meta">
                        <span><User size={12} /> {report.reporterName}</span>
                        <span><Calendar size={12} /> {formatDate(report.createdAt)}</span>
                        <span className="rpt-report-type">
                          {REPORT_TYPES[report.reportType as keyof typeof REPORT_TYPES] || report.reportType}
                        </span>
                      </div>
                    </div>

                    <div className={`rpt-report-status ${report.status.toLowerCase()}`}>
                      {getStatusIcon(report.status)}
                      <span>{REPORT_STATUSES[report.status as keyof typeof REPORT_STATUSES] || report.status}</span>
                    </div>

                    <ChevronDown size={20} className={`rpt-expand-icon ${expandedReport === report.id ? 'rotated' : ''}`} />
                  </div>

                  {/* Expanded Content */}
                  {expandedReport === report.id && (
                    <div className="rpt-report-body">
                      <div className="rpt-report-parties">
                        <div className="rpt-party reporter">
                          <div className="rpt-party-label">Người báo cáo</div>
                          <div className="rpt-party-info">
                            <User size={16} />
                            <span>{report.reporterName}</span>
                            <span className="rpt-party-id">(ID: {report.reporterId})</span>
                          </div>
                        </div>
                        <div className="rpt-party-arrow">→</div>
                        <div className="rpt-party reported">
                          <div className="rpt-party-label">Đối tượng bị báo cáo</div>
                          <div className="rpt-party-info">
                            <User size={16} />
                            <span>{report.reportedUserName || 'N/A'}</span>
                            <span className="rpt-party-id">(ID: {report.reportedUserId})</span>
                          </div>
                        </div>
                      </div>

                      <div className="rpt-report-description">
                        <h5><FileText size={16} /> Mô tả chi tiết</h5>
                        <p>{report.description}</p>
                      </div>

                      {report.evidences && report.evidences.length > 0 && (
                        <div className="rpt-report-evidence">
                          <h5><Paperclip size={16} /> Bằng chứng đính kèm ({report.evidences.length})</h5>
                          <div className="rpt-evidence-list">
                            {report.evidences.map((item, idx) => (
                              <div key={idx} className="rpt-evidence-item">
                                <ExternalLink size={14} />
                                <span>{item.evidenceType} - {item.fileName || item.description}</span>
                                {item.fileUrl && (
                                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                    Xem
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {report.adminNotes && (
                        <div className="rpt-admin-notes">
                          <h5>Ghi chú Admin</h5>
                          <p>{report.adminNotes}</p>
                        </div>
                      )}

                      {report.resolutionAction && (
                        <div className="rpt-resolution-info">
                          <span className="rpt-resolution-label">Hành động giải quyết:</span>
                          <span className="rpt-resolution-action">
                            {RESOLUTION_ACTIONS[report.resolutionAction as keyof typeof RESOLUTION_ACTIONS] || report.resolutionAction}
                          </span>
                        </div>
                      )}

                      <div className="rpt-report-actions">
                        <button 
                          className="rpt-action-btn investigate"
                          onClick={() => handleAction(report.id, 'investigate')}
                          disabled={actionLoading === report.id || report.status === 'RESOLVED' || report.status === 'DISMISSED'}
                        >
                          <Eye size={16} />
                          {actionLoading === report.id ? 'Đang xử lý...' : 'Điều tra'}
                        </button>
                        <button 
                          className="rpt-action-btn resolve"
                          onClick={() => handleAction(report.id, 'resolve')}
                          disabled={actionLoading === report.id || report.status === 'RESOLVED' || report.status === 'DISMISSED'}
                        >
                          <CheckCircle size={16} />
                          Giải quyết
                        </button>
                        <button 
                          className="rpt-action-btn escalate"
                          onClick={() => handleAction(report.id, 'escalate')}
                          disabled={actionLoading === report.id || report.status === 'RESOLVED' || report.status === 'DISMISSED'}
                        >
                          <Gavel size={16} />
                          Leo thang
                        </button>
                        <button 
                          className="rpt-action-btn dismiss"
                          onClick={() => handleAction(report.id, 'dismiss')}
                          disabled={actionLoading === report.id || report.status === 'RESOLVED' || report.status === 'DISMISSED'}
                        >
                          <XCircle size={16} />
                          Bỏ qua
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Action Modals */}
      <ReportActionModals
        report={selectedReport}
        actionType={modalAction}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default ReportsTabCosmic;
