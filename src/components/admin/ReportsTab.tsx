import React, { useState } from 'react';
import './ReportsTab.css';

const ReportsTab: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const reports = [
    {
      id: 1,
      title: 'Nội dung không phù hợp',
      reporter: 'Nguyễn Văn A',
      reported: 'Mentor XYZ',
      type: 'Nội dung',
      severity: 'high',
      date: '2 giờ trước',
      description: 'Mentor chia sẻ nội dung không phù hợp trong buổi coaching, sử dụng ngôn từ thiếu tôn trọng.',
      evidence: ['Screenshot 1', 'Recording 1'],
      status: 'pending'
    },
    {
      id: 2,
      title: 'Spam và quảng cáo',
      reporter: 'Trần Thị B',
      reported: 'Business ABC',
      type: 'Spam',
      severity: 'medium',
      date: '5 giờ trước',
      description: 'Doanh nghiệp liên tục gửi tin nhắn quảng cáo không liên quan đến dịch vụ.',
      evidence: ['Message logs'],
      status: 'investigating'
    },
    {
      id: 3,
      title: 'Lừa đảo tài chính',
      reporter: 'Lê Văn C',
      reported: 'User DEF',
      type: 'Lừa đảo',
      severity: 'high',
      date: '1 ngày trước',
      description: 'Người dùng yêu cầu chuyển tiền trước khi cung cấp dịch vụ mentoring.',
      evidence: ['Chat history', 'Payment request'],
      status: 'resolved'
    }
  ];

  const filteredReports = activeFilter === 'all' 
    ? reports 
    : reports.filter(report => report.status === activeFilter);

  const getSeverityClass = (severity: string) => {
    return `administrator-reports-severity ${severity}`;
  };

  const handleAction = (reportId: number, action: string) => {
    console.log(`${action} report ${reportId}`);
    // Implement action logic here
  };

  return (
    <div className="administrator-reports">
      <div className="administrator-reports-header">
        <h2>Quản Lý Báo Cáo Vi Phạm</h2>
        <p>Xem xét và xử lý các báo cáo vi phạm từ người dùng</p>
      </div>

      <div className="administrator-reports-stats">
        <div className="administrator-reports-stat urgent">
          <span className="administrator-reports-stat-number">7</span>
          <span className="administrator-reports-stat-label">Báo cáo mới</span>
        </div>
        <div className="administrator-reports-stat">
          <span className="administrator-reports-stat-number">3</span>
          <span className="administrator-reports-stat-label">Đang xử lý</span>
        </div>
        <div className="administrator-reports-stat">
          <span className="administrator-reports-stat-number">15</span>
          <span className="administrator-reports-stat-label">Đã giải quyết</span>
        </div>
        <div className="administrator-reports-stat urgent">
          <span className="administrator-reports-stat-number">2</span>
          <span className="administrator-reports-stat-label">Nghiêm trọng</span>
        </div>
      </div>

      <div className="administrator-reports-filters">
        <button 
          className={`administrator-reports-filter ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Tất cả báo cáo
        </button>
        <button 
          className={`administrator-reports-filter ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pending')}
        >
          Chờ xử lý
        </button>
        <button 
          className={`administrator-reports-filter ${activeFilter === 'investigating' ? 'active' : ''}`}
          onClick={() => setActiveFilter('investigating')}
        >
          Đang điều tra
        </button>
        <button 
          className={`administrator-reports-filter ${activeFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => setActiveFilter('resolved')}
        >
          Đã giải quyết
        </button>
      </div>

      <div className="administrator-reports-list">
        {filteredReports.map((report) => (
          <div 
            key={report.id} 
            className={`administrator-reports-item ${report.severity === 'high' ? 'urgent' : ''}`}
          >
            <div className="administrator-reports-item-header">
              <div className="administrator-reports-item-info">
                <h3>{report.title}</h3>
                <p><strong>Người báo cáo:</strong> {report.reporter}</p>
                <p><strong>Đối tượng bị báo cáo:</strong> {report.reported}</p>
                <p><strong>Loại vi phạm:</strong> {report.type}</p>
              </div>
              <div className="administrator-reports-item-meta">
                <span className={getSeverityClass(report.severity)}>
                  {(() => {
                    if (report.severity === 'high') return 'Nghiêm trọng';
                    if (report.severity === 'medium') return 'Trung bình';
                    return 'Nhẹ';
                  })()}
                </span>
                <span className="administrator-reports-date">{report.date}</span>
              </div>
            </div>

            <div className="administrator-reports-content">
              <h4>Mô tả chi tiết:</h4>
              <p>{report.description}</p>
            </div>

            <div className="administrator-reports-evidence">
              <strong>Bằng chứng: </strong>
              {report.evidence.map((evidence, evidenceIndex) => (
                <div key={`evidence-${report.id}-${evidenceIndex}`} className="administrator-reports-evidence-item">
                  📎 {evidence}
                </div>
              ))}
            </div>

            <div className="administrator-reports-actions">
              <button 
                className="administrator-reports-action investigate"
                onClick={() => handleAction(report.id, 'investigate')}
              >
                Điều tra
              </button>
              <button 
                className="administrator-reports-action resolve"
                onClick={() => handleAction(report.id, 'resolve')}
              >
                Giải quyết
              </button>
              <button 
                className="administrator-reports-action escalate"
                onClick={() => handleAction(report.id, 'escalate')}
              >
                Leo thang
              </button>
              <button 
                className="administrator-reports-action dismiss"
                onClick={() => handleAction(report.id, 'dismiss')}
              >
                Bỏ qua
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsTab;
