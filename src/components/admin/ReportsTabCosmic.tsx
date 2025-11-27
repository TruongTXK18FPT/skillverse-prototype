import React, { useState } from 'react';
import {
  AlertTriangle, Shield, Search, Filter, RefreshCw,
  Eye, CheckCircle, XCircle, AlertOctagon, Clock,
  User, FileText, Ban, Scale, ChevronDown, ExternalLink,
  Paperclip, Calendar, TrendingUp, Flag, Gavel, ShieldAlert, ShieldCheck
} from 'lucide-react';
import './ReportsTabCosmic.css';

interface Report {
  id: number;
  title: string;
  reporter: string;
  reporterId: string;
  reported: string;
  reportedId: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  date: string;
  description: string;
  evidence: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
}

interface ReportStats {
  newReports: number;
  investigating: number;
  resolved: number;
  critical: number;
  thisWeek: number;
  responseRate: number;
}

const ReportsTabCosmic: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  // Mock stats
  const [stats] = useState<ReportStats>({
    newReports: 7,
    investigating: 3,
    resolved: 15,
    critical: 2,
    thisWeek: 12,
    responseRate: 94
  });

  // Mock reports
  const [reports] = useState<Report[]>([
    {
      id: 1,
      title: 'Nội dung không phù hợp',
      reporter: 'Nguyễn Văn A',
      reporterId: 'USR001',
      reported: 'Mentor XYZ',
      reportedId: 'MNT003',
      type: 'Nội dung',
      severity: 'high',
      date: '2024-01-15 14:30',
      description: 'Mentor chia sẻ nội dung không phù hợp trong buổi coaching, sử dụng ngôn từ thiếu tôn trọng và có hành vi quấy rối.',
      evidence: ['Screenshot chat', 'Recording buổi học', 'Nhân chứng'],
      status: 'pending'
    },
    {
      id: 2,
      title: 'Spam và quảng cáo trái phép',
      reporter: 'Trần Thị B',
      reporterId: 'USR002',
      reported: 'Business ABC',
      reportedId: 'BUS005',
      type: 'Spam',
      severity: 'medium',
      date: '2024-01-15 10:15',
      description: 'Doanh nghiệp liên tục gửi tin nhắn quảng cáo không liên quan đến dịch vụ mentoring, gây phiền nhiễu người dùng.',
      evidence: ['Message logs', 'Screenshots'],
      status: 'investigating'
    },
    {
      id: 3,
      title: 'Lừa đảo tài chính',
      reporter: 'Lê Văn C',
      reporterId: 'USR003',
      reported: 'User DEF',
      reportedId: 'USR099',
      type: 'Lừa đảo',
      severity: 'high',
      date: '2024-01-14 16:45',
      description: 'Người dùng yêu cầu chuyển tiền trực tiếp thay vì qua hệ thống, hứa hẹn dịch vụ mentoring nhưng không thực hiện.',
      evidence: ['Chat history', 'Payment request screenshot', 'Bank transfer proof'],
      status: 'resolved'
    },
    {
      id: 4,
      title: 'Vi phạm bản quyền khóa học',
      reporter: 'Mentor ABC',
      reporterId: 'MNT001',
      reported: 'User GHI',
      reportedId: 'USR055',
      type: 'Bản quyền',
      severity: 'medium',
      date: '2024-01-14 09:20',
      description: 'Người dùng chia sẻ tài liệu khóa học có bản quyền lên các nền tảng khác mà không có sự đồng ý.',
      evidence: ['Link bài viết', 'Screenshot'],
      status: 'investigating'
    },
    {
      id: 5,
      title: 'Hành vi quấy rối',
      reporter: 'Phạm Thị D',
      reporterId: 'USR004',
      reported: 'User JKL',
      reportedId: 'USR077',
      type: 'Quấy rối',
      severity: 'high',
      date: '2024-01-13 18:00',
      description: 'Người dùng gửi tin nhắn có nội dung quấy rối, đe dọa sau khi bị từ chối kết bạn.',
      evidence: ['Chat screenshots', 'Email threats'],
      status: 'pending'
    }
  ]);

  const filteredReports = reports.filter(report => {
    const matchesFilter = activeFilter === 'all' || report.status === activeFilter;
    const matchesSearch = searchQuery === '' || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reported.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertOctagon size={16} />;
      case 'medium': return <AlertTriangle size={16} />;
      default: return <Flag size={16} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'investigating': return <Eye size={14} />;
      case 'resolved': return <CheckCircle size={14} />;
      case 'dismissed': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'investigating': return 'Đang điều tra';
      case 'resolved': return 'Đã giải quyết';
      case 'dismissed': return 'Đã bỏ qua';
      default: return status;
    }
  };

  const handleAction = (reportId: number, action: string) => {
    console.log(`${action} report ${reportId}`);
    // Implement action logic here
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
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

      {/* Stats Section */}
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
              <div className="rpt-stat-value">{stats.investigating}</div>
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
              <div className="rpt-stat-value">{stats.resolved}</div>
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
              <div className="rpt-stat-value">{stats.critical}</div>
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
              <div className="rpt-stat-value">{stats.thisWeek}</div>
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
      <div className="rpt-section rpt-section-list">
        <div className="rpt-list-header">
          <Shield size={20} />
          <h3>Danh Sách Báo Cáo ({filteredReports.length})</h3>
        </div>

        <div className="rpt-reports-list">
          {filteredReports.map((report) => (
            <div 
              key={report.id} 
              className={`rpt-report-card ${report.severity} ${expandedReport === report.id ? 'expanded' : ''}`}
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
                    <span><User size={12} /> {report.reporter}</span>
                    <span><Calendar size={12} /> {report.date}</span>
                    <span className="rpt-report-type">{report.type}</span>
                  </div>
                </div>

                <div className={`rpt-report-status ${report.status}`}>
                  {getStatusIcon(report.status)}
                  <span>{getStatusLabel(report.status)}</span>
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
                        <span>{report.reporter}</span>
                        <span className="rpt-party-id">({report.reporterId})</span>
                      </div>
                    </div>
                    <div className="rpt-party-arrow">→</div>
                    <div className="rpt-party reported">
                      <div className="rpt-party-label">Đối tượng bị báo cáo</div>
                      <div className="rpt-party-info">
                        <User size={16} />
                        <span>{report.reported}</span>
                        <span className="rpt-party-id">({report.reportedId})</span>
                      </div>
                    </div>
                  </div>

                  <div className="rpt-report-description">
                    <h5><FileText size={16} /> Mô tả chi tiết</h5>
                    <p>{report.description}</p>
                  </div>

                  <div className="rpt-report-evidence">
                    <h5><Paperclip size={16} /> Bằng chứng đính kèm</h5>
                    <div className="rpt-evidence-list">
                      {report.evidence.map((item, idx) => (
                        <div key={idx} className="rpt-evidence-item">
                          <ExternalLink size={14} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rpt-report-actions">
                    <button 
                      className="rpt-action-btn investigate"
                      onClick={() => handleAction(report.id, 'investigate')}
                    >
                      <Eye size={16} />
                      Điều tra
                    </button>
                    <button 
                      className="rpt-action-btn resolve"
                      onClick={() => handleAction(report.id, 'resolve')}
                    >
                      <CheckCircle size={16} />
                      Giải quyết
                    </button>
                    <button 
                      className="rpt-action-btn escalate"
                      onClick={() => handleAction(report.id, 'escalate')}
                    >
                      <Gavel size={16} />
                      Leo thang
                    </button>
                    <button 
                      className="rpt-action-btn ban"
                      onClick={() => handleAction(report.id, 'ban')}
                    >
                      <Ban size={16} />
                      Cấm tài khoản
                    </button>
                    <button 
                      className="rpt-action-btn dismiss"
                      onClick={() => handleAction(report.id, 'dismiss')}
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
      </div>
    </div>
  );
};

export default ReportsTabCosmic;
