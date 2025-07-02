import React, { useState } from 'react';
import './AccountVerificationTab.css';

interface Application {
  id: string;
  applicantName: string;
  email: string;
  role: 'mentor' | 'business';
  status: 'pending' | 'approved' | 'rejected';
  applicationDate: string;
  documents: {
    id: string;
    name: string;
    type: 'pdf' | 'image';
    url: string;
  }[];
  businessInfo?: {
    companyName: string;
    industry: string;
    size: string;
  };
  mentorInfo?: {
    expertise: string[];
    experience: string;
    education: string;
  };
}

const AccountVerificationTab: React.FC = () => {
  const [applications] = useState<Application[]>([
    {
      id: '1',
      applicantName: 'Nguyễn Văn An',
      email: 'an.nguyen@email.com',
      role: 'mentor',
      status: 'pending',
      applicationDate: '2025-07-01',
      documents: [
        { id: '1', name: 'CV_NguyenVanAn.pdf', type: 'pdf', url: '#' },
        { id: '2', name: 'Certificate_React.jpg', type: 'image', url: '#' },
      ],
      mentorInfo: {
        expertise: ['React', 'TypeScript', 'Node.js'],
        experience: '5 năm kinh nghiệm phát triển Frontend',
        education: 'Cử nhân Công nghệ Thông tin - ĐH Bách Khoa'
      }
    },
    {
      id: '2',
      applicantName: 'Công ty TNHH TechViet',
      email: 'hr@techviet.com',
      role: 'business',
      status: 'pending',
      applicationDate: '2025-06-30',
      documents: [
        { id: '3', name: 'BusinessLicense.pdf', type: 'pdf', url: '#' },
        { id: '4', name: 'CompanyProfile.pdf', type: 'pdf', url: '#' },
      ],
      businessInfo: {
        companyName: 'Công ty TNHH TechViet',
        industry: 'Công nghệ thông tin',
        size: '50-100 nhân viên'
      }
    },
  ]);

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const filteredApplications = applications.filter(app => {
    const matchesRole = roleFilter === 'all' || app.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesRole && matchesStatus;
  });

  const handleApplicationAction = (appId: string, action: string) => {
    console.log(`Performing ${action} on application ${appId}`);
    // In real app, make API call to perform action
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffa726';
      case 'approved': return '#43e97b';
      case 'rejected': return '#ff6b6b';
      default: return '#7f8c8d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  return (
    <div className="administrator-verification">
      <div className="administrator-verification-header">
        <h2>Xác Thực Tài Khoản</h2>
        <p>Duyệt đơn đăng ký mentor và doanh nghiệp</p>
      </div>

      <div className="administrator-verification-controls">
        <div className="administrator-verification-stats">
          <div className="administrator-verification-stat">
            <span className="administrator-verification-stat-number">
              {applications.filter(a => a.status === 'pending').length}
            </span>
            <span className="administrator-verification-stat-label">Chờ duyệt</span>
          </div>
          <div className="administrator-verification-stat">
            <span className="administrator-verification-stat-number">
              {applications.filter(a => a.role === 'mentor' && a.status === 'pending').length}
            </span>
            <span className="administrator-verification-stat-label">Mentor mới</span>
          </div>
          <div className="administrator-verification-stat">
            <span className="administrator-verification-stat-number">
              {applications.filter(a => a.role === 'business' && a.status === 'pending').length}
            </span>
            <span className="administrator-verification-stat-label">Doanh nghiệp mới</span>
          </div>
        </div>

        <div className="administrator-verification-filters">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="administrator-verification-filter"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="mentor">Mentor</option>
            <option value="business">Doanh nghiệp</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="administrator-verification-filter"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      <div className="administrator-verification-list">
        {filteredApplications.map((app) => (
          <div key={app.id} className="administrator-verification-card">
            <div className="administrator-verification-card-header">
              <div className="administrator-verification-applicant">
                <div className="administrator-verification-avatar">
                  {app.applicantName.charAt(0)}
                </div>
                <div className="administrator-verification-info">
                  <h3>{app.applicantName}</h3>
                  <p>{app.email}</p>
                  <span className="administrator-verification-role">
                    {app.role === 'mentor' ? '🎓 Mentor' : '🏢 Doanh nghiệp'}
                  </span>
                </div>
              </div>
              
              <div className="administrator-verification-meta">
                <span 
                  className="administrator-verification-status"
                  style={{ backgroundColor: getStatusColor(app.status) }}
                >
                  {getStatusLabel(app.status)}
                </span>
                <span className="administrator-verification-date">
                  {new Date(app.applicationDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            <div className="administrator-verification-details">
              {app.mentorInfo && (
                <div className="administrator-verification-mentor-info">
                  <h4>Thông tin Mentor</h4>
                  <p><strong>Chuyên môn:</strong> {app.mentorInfo.expertise.join(', ')}</p>
                  <p><strong>Kinh nghiệm:</strong> {app.mentorInfo.experience}</p>
                  <p><strong>Học vấn:</strong> {app.mentorInfo.education}</p>
                </div>
              )}

              {app.businessInfo && (
                <div className="administrator-verification-business-info">
                  <h4>Thông tin Doanh nghiệp</h4>
                  <p><strong>Tên công ty:</strong> {app.businessInfo.companyName}</p>
                  <p><strong>Ngành nghề:</strong> {app.businessInfo.industry}</p>
                  <p><strong>Quy mô:</strong> {app.businessInfo.size}</p>
                </div>
              )}

              <div className="administrator-verification-documents">
                <h4>Tài liệu đính kèm</h4>
                <div className="administrator-verification-document-list">
                  {app.documents.map((doc) => (
                    <div key={doc.id} className="administrator-verification-document">
                      <span className="administrator-verification-document-icon">
                        {doc.type === 'pdf' ? '📄' : '🖼️'}
                      </span>
                      <span className="administrator-verification-document-name">{doc.name}</span>
                      <button 
                        className="administrator-verification-document-view"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        Xem
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {app.status === 'pending' && (
              <div className="administrator-verification-actions">
                <button 
                  className="administrator-verification-btn administrator-verification-approve"
                  onClick={() => handleApplicationAction(app.id, 'approve')}
                >
                  ✅ Duyệt
                </button>
                <button 
                  className="administrator-verification-btn administrator-verification-reject"
                  onClick={() => handleApplicationAction(app.id, 'reject')}
                >
                  ❌ Từ chối
                </button>
                <button 
                  className="administrator-verification-btn administrator-verification-info"
                  onClick={() => handleApplicationAction(app.id, 'request-info')}
                >
                  📝 Yêu cầu bổ sung
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="administrator-verification-empty">
          <p>Không có đơn đăng ký nào phù hợp với bộ lọc.</p>
        </div>
      )}
    </div>
  );
};

export default AccountVerificationTab;
