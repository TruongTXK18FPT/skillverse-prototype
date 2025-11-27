import React, { useState, useEffect } from 'react';
import {
  UserCheck, Building2, Clock, CheckCircle, XCircle,
  Search, Filter, Eye, RefreshCw, X, Calendar, Mail,
  FileText, Award, Briefcase, Globe, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';
import adminService from '../../services/adminService';
import {
  MentorApplicationDto,
  RecruiterApplicationDto,
  ApplicationStatusFilter,
  ApplicationsResponse,
  ApplicationStatus
} from '../../data/adminDTOs';
import './AccountVerificationTabCosmic.css';

const AccountVerificationTabCosmic: React.FC = () => {
  const [mentorApplications, setMentorApplications] = useState<MentorApplicationDto[]>([]);
  const [recruiterApplications, setRecruiterApplications] = useState<RecruiterApplicationDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<{
    data: MentorApplicationDto | RecruiterApplicationDto;
    type: 'MENTOR' | 'RECRUITER';
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchTerm, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ApplicationsResponse = await adminService.getApplications(statusFilter);
      setMentorApplications(response.mentorApplications || []);
      setRecruiterApplications(response.recruiterApplications || []);
    } catch (err) {
      console.error('❌ Error fetching applications:', err);
      setError('Không thể tải danh sách đơn đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  // Combined and filtered list
  const getCombinedApplications = () => {
    let combined: Array<{ data: MentorApplicationDto | RecruiterApplicationDto; type: 'MENTOR' | 'RECRUITER' }> = [];
    
    if (roleFilter === 'all' || roleFilter === 'mentor') {
      combined = [...combined, ...mentorApplications.map(m => ({ data: m, type: 'MENTOR' as const }))];
    }
    if (roleFilter === 'all' || roleFilter === 'recruiter') {
      combined = [...combined, ...recruiterApplications.map(r => ({ data: r, type: 'RECRUITER' as const }))];
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      combined = combined.filter(item => {
        if (item.type === 'MENTOR') {
          const m = item.data as MentorApplicationDto;
          return m.fullName.toLowerCase().includes(term) || m.email.toLowerCase().includes(term);
        } else {
          const r = item.data as RecruiterApplicationDto;
          return r.companyName.toLowerCase().includes(term) || r.email.toLowerCase().includes(term);
        }
      });
    }

    // Sort by date
    combined.sort((a, b) => new Date(b.data.applicationDate).getTime() - new Date(a.data.applicationDate).getTime());
    
    return combined;
  };

  const allApplications = getCombinedApplications();
  const totalPages = Math.ceil(allApplications.length / itemsPerPage);
  const currentApplications = allApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    totalPending: mentorApplications.filter(m => m.applicationStatus === ApplicationStatus.PENDING).length +
                  recruiterApplications.filter(r => r.applicationStatus === ApplicationStatus.PENDING).length,
    mentorPending: mentorApplications.filter(m => m.applicationStatus === ApplicationStatus.PENDING).length,
    recruiterPending: recruiterApplications.filter(r => r.applicationStatus === ApplicationStatus.PENDING).length,
    totalApproved: mentorApplications.filter(m => m.applicationStatus === ApplicationStatus.APPROVED).length +
                   recruiterApplications.filter(r => r.applicationStatus === ApplicationStatus.APPROVED).length
  };

  const handleApprove = async (userId: number, type: 'MENTOR' | 'RECRUITER') => {
    try {
      setActionLoading(true);
      console.log(`📤 Approving ${type} application for userId: ${userId}`);
      
      const response = type === 'MENTOR' 
        ? await adminService.approveMentorApplication(userId)
        : await adminService.approveRecruiterApplication(userId);
      
      if (response.success) {
        alert(`✅ Đã duyệt đơn ${type === 'MENTOR' ? 'Mentor' : 'Recruiter'} thành công!`);
        setShowDetailModal(false);
        fetchApplications();
      } else {
        alert(`❌ Lỗi: ${response.message || 'Không thể duyệt đơn'}`);
      }
    } catch (err: any) {
      console.error('❌ Error approving:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi duyệt đơn';
      alert(`❌ Lỗi: ${errorMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedApplication || !rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }

    try {
      setActionLoading(true);
      const userId = selectedApplication.type === 'MENTOR' 
        ? (selectedApplication.data as MentorApplicationDto).userId
        : (selectedApplication.data as RecruiterApplicationDto).userId;

      const response = selectedApplication.type === 'MENTOR'
        ? await adminService.rejectMentorApplication(userId, rejectReason)
        : await adminService.rejectRecruiterApplication(userId, rejectReason);
      
      if (response.success) {
        alert(`✅ Đã từ chối đơn!`);
        setShowRejectModal(false);
        setShowDetailModal(false);
        setRejectReason('');
        fetchApplications();
      } else {
        alert(`❌ Lỗi: ${response.message || 'Không thể từ chối đơn'}`);
      }
    } catch (err: any) {
      console.error('❌ Error rejecting:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi từ chối đơn';
      alert(`❌ Lỗi: ${errorMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return <span className="verification-status-badge pending"><Clock size={14} /> Chờ duyệt</span>;
      case ApplicationStatus.APPROVED:
        return <span className="verification-status-badge approved"><CheckCircle size={14} /> Đã duyệt</span>;
      case ApplicationStatus.REJECTED:
        return <span className="verification-status-badge rejected"><XCircle size={14} /> Từ chối</span>;
      default:
        return <span className="verification-status-badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="verification-cosmic">
        <div className="verification-loading">
          <RefreshCw size={48} className="spinning" />
          <p>Đang tải danh sách đơn đăng ký...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verification-cosmic">
        <div className="verification-error">
          <XCircle size={48} />
          <h3>Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <button onClick={fetchApplications} className="verification-retry-btn">
            <RefreshCw size={18} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-cosmic">
      {/* Header */}
      <div className="verification-header">
        <div className="verification-header-left">
          <UserCheck size={32} className="verification-header-icon" />
          <div>
            <h2>Xác Thực Tài Khoản</h2>
            <p>Duyệt đơn đăng ký Mentor và Doanh nghiệp</p>
          </div>
        </div>
        <button className="verification-refresh-btn" onClick={fetchApplications} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="verification-stats-grid">
        <div className="verification-stat-card pending">
          <div className="verification-stat-icon">
            <Clock size={24} />
          </div>
          <div className="verification-stat-content">
            <div className="verification-stat-value">{stats.totalPending}</div>
            <div className="verification-stat-label">Chờ Duyệt</div>
          </div>
        </div>
        <div className="verification-stat-card mentor">
          <div className="verification-stat-icon">
            <UserCheck size={24} />
          </div>
          <div className="verification-stat-content">
            <div className="verification-stat-value">{stats.mentorPending}</div>
            <div className="verification-stat-label">Mentor Mới</div>
          </div>
        </div>
        <div className="verification-stat-card recruiter">
          <div className="verification-stat-icon">
            <Building2 size={24} />
          </div>
          <div className="verification-stat-content">
            <div className="verification-stat-value">{stats.recruiterPending}</div>
            <div className="verification-stat-label">Doanh Nghiệp Mới</div>
          </div>
        </div>
        <div className="verification-stat-card approved">
          <div className="verification-stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="verification-stat-content">
            <div className="verification-stat-value">{stats.totalApproved}</div>
            <div className="verification-stat-label">Đã Duyệt</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="verification-filters">
        <div className="verification-search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="verification-filter-buttons">
          <Filter size={18} />
          <button
            className={`verification-filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            Tất cả
          </button>
          <button
            className={`verification-filter-btn ${roleFilter === 'mentor' ? 'active' : ''}`}
            onClick={() => setRoleFilter('mentor')}
          >
            <UserCheck size={16} /> Mentor
          </button>
          <button
            className={`verification-filter-btn ${roleFilter === 'recruiter' ? 'active' : ''}`}
            onClick={() => setRoleFilter('recruiter')}
          >
            <Building2 size={16} /> Doanh nghiệp
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatusFilter)}
          className="verification-status-select"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Từ chối</option>
        </select>
      </div>

      {/* Applications Table */}
      <div className="verification-table-container">
        <table className="verification-table">
          <thead>
            <tr>
              <th>Ứng viên</th>
              <th>Vai trò</th>
              <th>Thông tin</th>
              <th>Ngày nộp</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentApplications.map((item) => {
              const isMentor = item.type === 'MENTOR';
              const data = item.data;
              const name = isMentor 
                ? (data as MentorApplicationDto).fullName 
                : (data as RecruiterApplicationDto).companyName;
              const email = data.email;
              const userId = isMentor 
                ? (data as MentorApplicationDto).userId 
                : (data as RecruiterApplicationDto).userId;

              return (
                <tr key={`${item.type}-${userId}`}>
                  <td>
                    <div className="verification-applicant-info">
                      <div className="verification-avatar">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="verification-name">{name}</div>
                        <div className="verification-email">
                          <Mail size={14} /> {email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`verification-role-badge ${item.type.toLowerCase()}`}>
                      {isMentor ? <UserCheck size={14} /> : <Building2 size={14} />}
                      {isMentor ? 'Mentor' : 'Doanh nghiệp'}
                    </span>
                  </td>
                  <td>
                    {isMentor ? (
                      <div className="verification-brief-info">
                        <span><Briefcase size={14} /> {(data as MentorApplicationDto).mainExpertiseArea}</span>
                        <span><Award size={14} /> {(data as MentorApplicationDto).yearsOfExperience} năm KN</span>
                      </div>
                    ) : (
                      <div className="verification-brief-info">
                        <span><Globe size={14} /> {(data as RecruiterApplicationDto).companyWebsite || 'N/A'}</span>
                        <span><MapPin size={14} /> {(data as RecruiterApplicationDto).companyAddress || 'N/A'}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="verification-date">
                      <Calendar size={14} />
                      {formatDate(data.applicationDate)}
                    </div>
                  </td>
                  <td>{getStatusBadge(data.applicationStatus)}</td>
                  <td>
                    <div className="verification-actions">
                      <button
                        className="verification-action-btn view"
                        onClick={() => {
                          setSelectedApplication(item);
                          setShowDetailModal(true);
                        }}
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      {data.applicationStatus === ApplicationStatus.PENDING && (
                        <>
                          <button
                            className="verification-action-btn approve"
                            onClick={() => handleApprove(userId, item.type)}
                            disabled={actionLoading}
                            title="Duyệt"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            className="verification-action-btn reject"
                            onClick={() => {
                              setSelectedApplication(item);
                              setShowRejectModal(true);
                            }}
                            title="Từ chối"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {currentApplications.length === 0 && (
          <div className="verification-empty">
            <UserCheck size={64} />
            <h3>Không có đơn đăng ký</h3>
            <p>Không tìm thấy đơn đăng ký nào phù hợp với bộ lọc</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="verification-pagination">
          <button
            className="verification-pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} /> Trước
          </button>
          <div className="verification-pagination-info">
            Trang {currentPage} / {totalPages}
          </div>
          <button
            className="verification-pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedApplication && (
        <div className="verification-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="verification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="verification-modal-header">
              <h3>Chi Tiết Đơn Đăng Ký</h3>
              <button className="verification-close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="verification-modal-body">
              {selectedApplication.type === 'MENTOR' ? (
                <MentorDetail mentor={selectedApplication.data as MentorApplicationDto} />
              ) : (
                <RecruiterDetail recruiter={selectedApplication.data as RecruiterApplicationDto} />
              )}
            </div>

            <div className="verification-modal-footer">
              {selectedApplication.data.applicationStatus === ApplicationStatus.PENDING && (
                <>
                  <button
                    className="verification-modal-btn approve"
                    onClick={() => {
                      const userId = selectedApplication.type === 'MENTOR'
                        ? (selectedApplication.data as MentorApplicationDto).userId
                        : (selectedApplication.data as RecruiterApplicationDto).userId;
                      handleApprove(userId, selectedApplication.type);
                    }}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={18} /> Duyệt đơn
                  </button>
                  <button
                    className="verification-modal-btn reject"
                    onClick={() => setShowRejectModal(true)}
                  >
                    <XCircle size={18} /> Từ chối
                  </button>
                </>
              )}
              <button
                className="verification-modal-btn close"
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApplication && (
        <div className="verification-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="verification-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="verification-modal-header">
              <h3>Từ Chối Đơn Đăng Ký</h3>
              <button className="verification-close-btn" onClick={() => setShowRejectModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="verification-modal-body">
              <p className="verification-reject-info">
                Bạn đang từ chối đơn đăng ký của{' '}
                <strong>
                  {selectedApplication.type === 'MENTOR'
                    ? (selectedApplication.data as MentorApplicationDto).fullName
                    : (selectedApplication.data as RecruiterApplicationDto).companyName}
                </strong>
              </p>
              
              <div className="verification-form-group">
                <label>Lý do từ chối <span className="required">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối đơn đăng ký..."
                  rows={4}
                />
              </div>
            </div>

            <div className="verification-modal-footer">
              <button
                className="verification-modal-btn close"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Hủy
              </button>
              <button
                className="verification-modal-btn reject"
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mentor Detail Component
const MentorDetail: React.FC<{ mentor: MentorApplicationDto }> = ({ mentor }) => (
  <div className="verification-detail-content">
    <div className="verification-detail-header">
      <div className="verification-detail-avatar">
        {mentor.fullName.charAt(0).toUpperCase()}
      </div>
      <div>
        <h4>{mentor.fullName}</h4>
        <p>{mentor.email}</p>
        <span className="verification-role-badge mentor">
          <UserCheck size={14} /> Mentor
        </span>
      </div>
    </div>

    <div className="verification-detail-section">
      <h5>Thông Tin Chuyên Môn</h5>
      <div className="verification-detail-grid">
        <div className="verification-detail-item">
          <Briefcase size={18} />
          <div>
            <label>Lĩnh vực chuyên môn</label>
            <span>{mentor.mainExpertiseArea}</span>
          </div>
        </div>
        <div className="verification-detail-item">
          <Award size={18} />
          <div>
            <label>Kinh nghiệm</label>
            <span>{mentor.yearsOfExperience} năm</span>
          </div>
        </div>
      </div>
    </div>

    {mentor.personalProfile && (
      <div className="verification-detail-section">
        <h5>Giới Thiệu Bản Thân</h5>
        <p className="verification-description">{mentor.personalProfile}</p>
      </div>
    )}

    {mentor.linkedinProfile && (
      <div className="verification-detail-section">
        <h5>Liên Kết</h5>
        <a href={mentor.linkedinProfile} target="_blank" rel="noopener noreferrer" className="verification-link">
          <Globe size={16} /> LinkedIn Profile
        </a>
      </div>
    )}

    {(mentor.cvPortfolioUrl || mentor.certificatesUrl) && (
      <div className="verification-detail-section">
        <h5>Tài Liệu Đính Kèm</h5>
        <div className="verification-documents">
          {mentor.cvPortfolioUrl && (
            <a href={mentor.cvPortfolioUrl} target="_blank" rel="noopener noreferrer" className="verification-document">
              <FileText size={20} />
              <span>CV / Portfolio</span>
            </a>
          )}
          {mentor.certificatesUrl && (
            <a href={mentor.certificatesUrl} target="_blank" rel="noopener noreferrer" className="verification-document">
              <Award size={20} />
              <span>Chứng chỉ</span>
            </a>
          )}
        </div>
      </div>
    )}

    {mentor.applicationStatus === ApplicationStatus.REJECTED && mentor.rejectionReason && (
      <div className="verification-detail-section rejection">
        <h5>Lý Do Từ Chối</h5>
        <p>{mentor.rejectionReason}</p>
      </div>
    )}
  </div>
);

// Recruiter Detail Component
const RecruiterDetail: React.FC<{ recruiter: RecruiterApplicationDto }> = ({ recruiter }) => (
  <div className="verification-detail-content">
    <div className="verification-detail-header">
      <div className="verification-detail-avatar recruiter">
        {recruiter.companyName.charAt(0).toUpperCase()}
      </div>
      <div>
        <h4>{recruiter.companyName}</h4>
        <p>{recruiter.email}</p>
        <span className="verification-role-badge recruiter">
          <Building2 size={14} /> Doanh nghiệp
        </span>
      </div>
    </div>

    <div className="verification-detail-section">
      <h5>Thông Tin Công Ty</h5>
      <div className="verification-detail-grid">
        <div className="verification-detail-item">
          <UserCheck size={18} />
          <div>
            <label>Người liên hệ</label>
            <span>{recruiter.fullName}</span>
          </div>
        </div>
        {recruiter.taxCodeOrBusinessRegistrationNumber && (
          <div className="verification-detail-item">
            <FileText size={18} />
            <div>
              <label>Mã số thuế</label>
              <span>{recruiter.taxCodeOrBusinessRegistrationNumber}</span>
            </div>
          </div>
        )}
        {recruiter.companyWebsite && (
          <div className="verification-detail-item">
            <Globe size={18} />
            <div>
              <label>Website</label>
              <a href={recruiter.companyWebsite} target="_blank" rel="noopener noreferrer">
                {recruiter.companyWebsite}
              </a>
            </div>
          </div>
        )}
        {recruiter.companyAddress && (
          <div className="verification-detail-item">
            <MapPin size={18} />
            <div>
              <label>Địa chỉ</label>
              <span>{recruiter.companyAddress}</span>
            </div>
          </div>
        )}
      </div>
    </div>

    {recruiter.companyDocumentsUrl && (
      <div className="verification-detail-section">
        <h5>Tài Liệu Công Ty</h5>
        <div className="verification-documents">
          <a href={recruiter.companyDocumentsUrl} target="_blank" rel="noopener noreferrer" className="verification-document">
            <FileText size={20} />
            <span>Giấy tờ đăng ký kinh doanh</span>
          </a>
        </div>
      </div>
    )}

    {recruiter.applicationStatus === ApplicationStatus.REJECTED && recruiter.rejectionReason && (
      <div className="verification-detail-section rejection">
        <h5>Lý Do Từ Chối</h5>
        <p>{recruiter.rejectionReason}</p>
      </div>
    )}
  </div>
);

export default AccountVerificationTabCosmic;
