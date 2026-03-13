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
import './HUDReportStyles.css';

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'hud-status-pending';
      case 'INVESTIGATING': return 'hud-status-investigating';
      case 'RESOLVED': return 'hud-status-resolved';
      case 'DISMISSED': return 'hud-status-dismissed';
      default: return '';
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
      <div className="hud-report-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1.5rem' }}>
          <RefreshCw size={48} className="hud-spinning" style={{ color: 'var(--hud-accent-cyan)' }} />
          <span style={{ fontFamily: 'var(--hud-font-display)', color: 'var(--hud-accent-cyan)', letterSpacing: '2px' }}>TRUY XUẤT DỮ LIỆU CƠ SỞ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hud-report-container">
      <div className="hud-report-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div className="hud-report-header">
          <div className="hud-report-title-section">
            <button 
              onClick={() => onBack ? onBack() : navigate(-1)}
              style={{ background: 'none', border: 'none', color: 'var(--hud-accent-cyan)', cursor: 'pointer', padding: '0.5rem', display: 'flex' }}
            >
              <ArrowLeft size={24} />
            </button>
            <div className="hud-report-icon-box">
              <Shield size={24} />
            </div>
            <div>
              <h2>NHẬT KÝ BÁO CÁO</h2>
              <p>Theo dõi trạng thái các tín hiệu đã gửi</p>
            </div>
          </div>
          <button 
            className="hud-report-btn hud-report-btn-ghost" 
            onClick={loadReports}
            style={{ width: '40px', height: '40px', padding: 0 }}
          >
            <RefreshCw size={18} className={loading ? 'hud-spinning' : ''} />
          </button>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid var(--hud-accent-red)', 
            color: 'var(--hud-accent-red)',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1.5rem'
          }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="hud-toolbar">
          <div className="hud-search-container">
            <Search size={18} className="hud-search-icon" />
            <input
              className="hud-search-input"
              type="text"
              placeholder="MÃ BÁO CÁO, TIÊU ĐỀ, ĐỐI TƯỢNG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className={`hud-report-btn ${statusFilter === 'all' ? 'hud-report-btn-primary' : 'hud-report-btn-ghost'}`}
              onClick={() => setStatusFilter('all')}
              style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
            >
              TẤT CẢ ({reports.length})
            </button>
            <button 
              className={`hud-report-btn ${statusFilter === 'PENDING' ? 'hud-report-btn-primary' : 'hud-report-btn-ghost'}`}
              onClick={() => setStatusFilter('PENDING')}
              style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
            >
              CHỜ XỬ LÝ
            </button>
            <button 
              className={`hud-report-btn ${statusFilter === 'INVESTIGATING' ? 'hud-report-btn-primary' : 'hud-report-btn-ghost'}`}
              onClick={() => setStatusFilter('INVESTIGATING')}
              style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
            >
              ĐANG ĐIỀU TRA
            </button>
            <button 
              className={`hud-report-btn ${statusFilter === 'RESOLVED' ? 'hud-report-btn-primary' : 'hud-report-btn-ghost'}`}
              onClick={() => setStatusFilter('RESOLVED')}
              style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
            >
              ĐÃ GIẢI QUYẾT
            </button>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px dashed rgba(6, 182, 212, 0.2)', background: 'rgba(6, 182, 212, 0.02)' }}>
            <FileText size={48} style={{ color: 'var(--hud-text-dim)', marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ fontFamily: 'var(--hud-font-display)', color: 'var(--hud-text-secondary)', textTransform: 'uppercase' }}>Không có dữ liệu</h3>
            <p style={{ color: 'var(--hud-text-dim)' }}>Hệ thống không tìm thấy báo cáo nào phù hợp với yêu cầu.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredReports.map((report) => (
              <div 
                key={report.id} 
                className="hud-report-card"
                style={{ 
                  padding: 0, 
                  background: 'rgba(13, 22, 35, 0.4)',
                  borderColor: expandedReport === report.id ? 'var(--hud-accent-cyan)' : 'rgba(6, 182, 212, 0.15)',
                  borderLeft: `4px solid ${
                    report.severity === 'HIGH' ? 'var(--hud-accent-red)' : 
                    report.severity === 'MEDIUM' ? 'var(--hud-accent-yellow)' : 
                    'var(--hud-accent-green)'
                  }`
                }}
              >
                {/* Report Header */}
                <div 
                  style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.5rem' }}
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '1rem' }}>{report.title}</h4>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--hud-text-dim)', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--hud-accent-cyan)', fontFamily: 'var(--hud-font-display)' }}>{report.reportCode}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12} /> {formatDate(report.createdAt)}</span>
                      <span style={{ 
                        background: 'rgba(6, 182, 212, 0.1)', 
                        color: 'var(--hud-accent-cyan)', 
                        padding: '0.1rem 0.5rem', 
                        borderRadius: '2px',
                        fontSize: '0.7rem'
                      }}>
                        {REPORT_TYPES[report.reportType as keyof typeof REPORT_TYPES]}
                      </span>
                    </div>
                  </div>

                  <div className={`hud-status-badge ${getStatusBadgeClass(report.status)}`}>
                    {getStatusIcon(report.status)}
                    <span>{REPORT_STATUSES[report.status as keyof typeof REPORT_STATUSES]}</span>
                  </div>

                  <ChevronDown 
                    size={20} 
                    style={{ 
                      color: 'var(--hud-text-dim)', 
                      transition: 'transform 0.3s', 
                      transform: expandedReport === report.id ? 'rotate(180deg)' : 'none' 
                    }} 
                  />
                </div>

                {/* Expanded Content */}
                {expandedReport === report.id && (
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(6, 182, 212, 0.1)', marginTop: '-0.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.25rem' }}>
                      <div className="hud-report-field">
                        <label>ĐỐI TƯỢNG BỊ BÁO CÁO</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '4px' }}>
                          <User size={18} style={{ color: 'var(--hud-accent-cyan)' }} />
                          <div>
                            <div style={{ color: '#fff', fontSize: '0.9rem' }}>{report.reportedUserName || 'CHƯA XÁC ĐỊNH'}</div>
                            <div style={{ color: 'var(--hud-text-dim)', fontSize: '0.75rem' }}>ID: {report.reportedUserId}</div>
                          </div>
                        </div>
                      </div>

                      <div className="hud-report-field">
                        <label>MÔ TẢ CHI TIẾT</label>
                        <p style={{ margin: 0, color: 'var(--hud-text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '4px' }}>
                          {report.description}
                        </p>
                      </div>
                    </div>

                    {report.evidences && report.evidences.length > 0 && (
                      <div className="hud-report-field" style={{ marginTop: '1.5rem' }}>
                        <label>DỮ LIỆU BẰNG CHỨNG ({report.evidences.length})</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          {report.evidences.map((ev, idx) => (
                            <span key={idx} style={{ 
                              background: 'rgba(6, 182, 212, 0.1)', 
                              border: '1px solid var(--hud-accent-cyan)',
                              color: 'var(--hud-accent-cyan)',
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.75rem',
                              borderRadius: '2px'
                            }}>
                              {ev.evidenceType}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.adminNotes && (
                      <div className="hud-report-field" style={{ marginTop: '1.5rem' }}>
                        <label>PHẢN HỒI TỪ ĐƠN VỊ KIỂM SOÁT</label>
                        <div style={{ background: 'rgba(168, 85, 247, 0.05)', borderLeft: '3px solid var(--hud-accent-purple)', padding: '1rem' }}>
                          <p style={{ margin: 0, color: 'var(--hud-text-primary)', fontSize: '0.9rem' }}>{report.adminNotes}</p>
                        </div>
                      </div>
                    )}

                    {report.resolutionAction && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--hud-text-dim)', textTransform: 'uppercase' }}>HÀNH ĐỘNG CỦA HỆ THỐNG:</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--hud-accent-green)', fontWeight: 600 }}>{report.resolutionAction}</span>
                      </div>
                    )}

                    {onViewReport && (
                      <button 
                        className="hud-report-btn hud-report-btn-primary"
                        onClick={() => onViewReport(report)}
                        style={{ marginTop: '1.5rem', width: '100%', fontSize: '0.8rem' }}
                      >
                        <Eye size={16} />
                        XEM CHI TIẾT ĐẦY ĐỦ
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReportsPage;
