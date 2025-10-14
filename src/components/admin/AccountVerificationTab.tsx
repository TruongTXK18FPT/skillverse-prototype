import React, { useState, useEffect } from 'react';
import './AccountVerificationTab.css';
import adminService from '../../services/adminService';
import {
  MentorApplicationDto,
  RecruiterApplicationDto,
  ApplicationStatusFilter,
  ApplicationsResponse,
  ApplicationStatus
} from '../../data/adminDTOs';

const AccountVerificationTab: React.FC = () => {
  // Real data from API
  const [mentorApplications, setMentorApplications] = useState<MentorApplicationDto[]>([]);
  const [recruiterApplications, setRecruiterApplications] = useState<RecruiterApplicationDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>('PENDING');
  
  // Reject modal
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [selectedApplication, setSelectedApplication] = useState<{
    userId: number;
    type: 'MENTOR' | 'RECRUITER';
    name: string;
  } | null>(null);

  // Fetch applications when component mounts or status filter changes
  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ApplicationsResponse = await adminService.getApplications(statusFilter);
      
      setMentorApplications(response.mentorApplications || []);
      setRecruiterApplications(response.recruiterApplications || []);
      
      console.log('✅ Applications loaded:', {
        mentors: response.mentorApplications?.length || 0,
        recruiters: response.recruiterApplications?.length || 0,
        total: response.totalApplications
      });
    } catch (err) {
      console.error('❌ Error fetching applications:', err);
      setError('Không thể tải danh sách đơn đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Filter applications based on role
  const filteredMentors = roleFilter === 'all' || roleFilter === 'mentor' 
    ? mentorApplications 
    : [];
  const filteredRecruiters = roleFilter === 'all' || roleFilter === 'business' 
    ? recruiterApplications 
    : [];

  // Handle approve
  const handleApprove = async (userId: number, type: 'MENTOR' | 'RECRUITER') => {
    try {
      const response = type === 'MENTOR' 
        ? await adminService.approveMentorApplication(userId)
        : await adminService.approveRecruiterApplication(userId);
      
      if (response.success) {
        alert(`✅ Đã duyệt đơn ${type === 'MENTOR' ? 'Mentor' : 'Recruiter'} thành công!`);
        fetchApplications(); // Reload data
      }
    } catch (err) {
      console.error('❌ Error approving:', err);
      alert('Có lỗi xảy ra khi duyệt đơn. Vui lòng thử lại.');
    }
  };

  // Handle reject click (open modal)
  const handleRejectClick = (userId: number, type: 'MENTOR' | 'RECRUITER', name: string) => {
    setSelectedApplication({ userId, type, name });
    setShowRejectModal(true);
  };

  // Handle reject confirm (submit)
  const handleRejectConfirm = async () => {
    if (!selectedApplication || !rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }

    try {
      const response = selectedApplication.type === 'MENTOR'
        ? await adminService.rejectMentorApplication(selectedApplication.userId, rejectReason)
        : await adminService.rejectRecruiterApplication(selectedApplication.userId, rejectReason);
      
      if (response.success) {
        alert(`✅ Đã từ chối đơn ${selectedApplication.type === 'MENTOR' ? 'Mentor' : 'Recruiter'}!`);
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedApplication(null);
        fetchApplications(); // Reload data
      }
    } catch (err) {
      console.error('❌ Error rejecting:', err);
      alert('Có lỗi xảy ra khi từ chối đơn. Vui lòng thử lại.');
    }
  };

  // Utility functions
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING: return '#ffa726';
      case ApplicationStatus.APPROVED: return '#43e97b';
      case ApplicationStatus.REJECTED: return '#ff6b6b';
      default: return '#7f8c8d';
    }
  };

  const getStatusLabel = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING: return 'Chờ duyệt';
      case ApplicationStatus.APPROVED: return 'Đã duyệt';
      case ApplicationStatus.REJECTED: return 'Từ chối';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Loading state
  if (loading) {
    return (
      <div className="administrator-verification">
        <div className="administrator-verification-loading">
          <p>⏳ Đang tải danh sách đơn đăng ký...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="administrator-verification">
        <div className="administrator-verification-error">
          <p>❌ {error}</p>
          <button onClick={fetchApplications} className="administrator-verification-btn">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats from real data
  const totalPending = mentorApplications.filter(m => m.applicationStatus === ApplicationStatus.PENDING).length +
                       recruiterApplications.filter(r => r.applicationStatus === ApplicationStatus.PENDING).length;
  const mentorPending = mentorApplications.filter(m => m.applicationStatus === ApplicationStatus.PENDING).length;
  const recruiterPending = recruiterApplications.filter(r => r.applicationStatus === ApplicationStatus.PENDING).length;

  return (
    <div className="administrator-verification">
      <div className="administrator-verification-header">
        <h2>Xác Thực Tài Khoản</h2>
        <p>Duyệt đơn đăng ký mentor và doanh nghiệp</p>
      </div>

      <div className="administrator-verification-controls">
        <div className="administrator-verification-stats">
          <div className="administrator-verification-stat">
            <span className="administrator-verification-stat-number">{totalPending}</span>
            <span className="administrator-verification-stat-label">Chờ duyệt</span>
          </div>
          <div className="administrator-verification-stat">
            <span className="administrator-verification-stat-number">{mentorPending}</span>
            <span className="administrator-verification-stat-label">Mentor mới</span>
          </div>
          <div className="administrator-verification-stat">
            <span className="administrator-verification-stat-number">{recruiterPending}</span>
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
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatusFilter)}
            className="administrator-verification-filter"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
      </div>

      <div className="administrator-verification-list">
        {/* Mentor Applications */}
        {filteredMentors.map((mentor) => (
          <div key={`mentor-${mentor.userId}`} className="administrator-verification-card">
            <div className="administrator-verification-card-header">
              <div className="administrator-verification-applicant">
                <div className="administrator-verification-avatar">
                  {mentor.fullName.charAt(0)}
                </div>
                <div className="administrator-verification-info">
                  <h3>{mentor.fullName}</h3>
                  <p>{mentor.email}</p>
                  <span className="administrator-verification-role">🎓 Mentor</span>
                </div>
              </div>
              
              <div className="administrator-verification-meta">
                <span 
                  className="administrator-verification-status"
                  style={{ backgroundColor: getStatusColor(mentor.applicationStatus) }}
                >
                  {getStatusLabel(mentor.applicationStatus)}
                </span>
                <span className="administrator-verification-date">
                  {formatDate(mentor.applicationDate)}
                </span>
              </div>
            </div>

            <div className="administrator-verification-details">
              <div className="administrator-verification-mentor-info">
                <h4>Thông tin Mentor</h4>
                <p><strong>Chuyên môn:</strong> {mentor.mainExpertiseArea}</p>
                <p><strong>Kinh nghiệm:</strong> {mentor.yearsOfExperience} năm</p>
                <p><strong>Mô tả:</strong> {mentor.personalProfile || 'Chưa có'}</p>
                {mentor.linkedinProfile && (
                  <p><strong>LinkedIn:</strong> <a href={mentor.linkedinProfile} target="_blank" rel="noopener noreferrer">{mentor.linkedinProfile}</a></p>
                )}
              </div>

              {(mentor.cvPortfolioUrl || mentor.certificatesUrl) && (
                <div className="administrator-verification-documents">
                  <h4>Tài liệu đính kèm</h4>
                  <div className="administrator-verification-document-list">
                    {mentor.cvPortfolioUrl && (
                      <div className="administrator-verification-document">
                        <span className="administrator-verification-document-icon">📄</span>
                        <span className="administrator-verification-document-name">CV/Portfolio</span>
                        <button 
                          className="administrator-verification-document-view"
                          onClick={() => window.open(mentor.cvPortfolioUrl, '_blank')}
                        >
                          Xem
                        </button>
                      </div>
                    )}
                    {mentor.certificatesUrl && (
                      <div className="administrator-verification-document">
                        <span className="administrator-verification-document-icon">🏆</span>
                        <span className="administrator-verification-document-name">Chứng chỉ</span>
                        <button 
                          className="administrator-verification-document-view"
                          onClick={() => window.open(mentor.certificatesUrl, '_blank')}
                        >
                          Xem
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {mentor.applicationStatus === ApplicationStatus.PENDING && (
              <div className="administrator-verification-actions">
                <button 
                  className="administrator-verification-btn administrator-verification-approve"
                  onClick={() => handleApprove(mentor.userId, 'MENTOR')}
                >
                  ✅ Duyệt
                </button>
                <button 
                  className="administrator-verification-btn administrator-verification-reject"
                  onClick={() => handleRejectClick(mentor.userId, 'MENTOR', mentor.fullName)}
                >
                  ❌ Từ chối
                </button>
              </div>
            )}

            {mentor.applicationStatus === ApplicationStatus.REJECTED && mentor.rejectionReason && (
              <div className="administrator-verification-rejection-reason">
                <strong>Lý do từ chối:</strong> {mentor.rejectionReason}
              </div>
            )}
          </div>
        ))}

        {/* Recruiter Applications */}
        {filteredRecruiters.map((recruiter) => (
          <div key={`recruiter-${recruiter.userId}`} className="administrator-verification-card">
            <div className="administrator-verification-card-header">
              <div className="administrator-verification-applicant">
                <div className="administrator-verification-avatar">
                  {recruiter.companyName.charAt(0)}
                </div>
                <div className="administrator-verification-info">
                  <h3>{recruiter.companyName}</h3>
                  <p>{recruiter.email}</p>
                  <span className="administrator-verification-role">🏢 Doanh nghiệp</span>
                </div>
              </div>
              
              <div className="administrator-verification-meta">
                <span 
                  className="administrator-verification-status"
                  style={{ backgroundColor: getStatusColor(recruiter.applicationStatus) }}
                >
                  {getStatusLabel(recruiter.applicationStatus)}
                </span>
                <span className="administrator-verification-date">
                  {formatDate(recruiter.applicationDate)}
                </span>
              </div>
            </div>

            <div className="administrator-verification-details">
              <div className="administrator-verification-business-info">
                <h4>Thông tin Doanh nghiệp</h4>
                <p><strong>Người liên hệ:</strong> {recruiter.fullName}</p>
                {recruiter.companyWebsite && (
                  <p><strong>Website:</strong> <a href={recruiter.companyWebsite} target="_blank" rel="noopener noreferrer">{recruiter.companyWebsite}</a></p>
                )}
                {recruiter.companyAddress && (
                  <p><strong>Địa chỉ:</strong> {recruiter.companyAddress}</p>
                )}
                {recruiter.taxCodeOrBusinessRegistrationNumber && (
                  <p><strong>Mã số thuế:</strong> {recruiter.taxCodeOrBusinessRegistrationNumber}</p>
                )}
              </div>

              {recruiter.companyDocumentsUrl && (
                <div className="administrator-verification-documents">
                  <h4>Tài liệu đính kèm</h4>
                  <div className="administrator-verification-document-list">
                    <div className="administrator-verification-document">
                      <span className="administrator-verification-document-icon">📄</span>
                      <span className="administrator-verification-document-name">Giấy tờ công ty</span>
                      <button 
                        className="administrator-verification-document-view"
                        onClick={() => window.open(recruiter.companyDocumentsUrl, '_blank')}
                      >
                        Xem
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {recruiter.applicationStatus === ApplicationStatus.PENDING && (
              <div className="administrator-verification-actions">
                <button 
                  className="administrator-verification-btn administrator-verification-approve"
                  onClick={() => handleApprove(recruiter.userId, 'RECRUITER')}
                >
                  ✅ Duyệt
                </button>
                <button 
                  className="administrator-verification-btn administrator-verification-reject"
                  onClick={() => handleRejectClick(recruiter.userId, 'RECRUITER', recruiter.companyName)}
                >
                  ❌ Từ chối
                </button>
              </div>
            )}

            {recruiter.applicationStatus === ApplicationStatus.REJECTED && recruiter.rejectionReason && (
              <div className="administrator-verification-rejection-reason">
                <strong>Lý do từ chối:</strong> {recruiter.rejectionReason}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredMentors.length === 0 && filteredRecruiters.length === 0 && (
        <div className="administrator-verification-empty">
          <p>Không có đơn đăng ký nào phù hợp với bộ lọc.</p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApplication && (
        <div className="administrator-verification-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="administrator-verification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="administrator-verification-modal-header">
              <h3>Từ chối đơn đăng ký</h3>
              <button 
                className="administrator-verification-modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="administrator-verification-modal-body">
              <p><strong>Ứng viên:</strong> {selectedApplication.name}</p>
              <p><strong>Vai trò:</strong> {selectedApplication.type === 'MENTOR' ? 'Mentor' : 'Recruiter'}</p>
              <label>
                <strong>Lý do từ chối: <span style={{color: 'red'}}>*</span></strong>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối đơn đăng ký..."
                  rows={5}
                  className="administrator-verification-textarea"
                />
              </label>
            </div>
            <div className="administrator-verification-modal-footer">
              <button 
                className="administrator-verification-btn administrator-verification-cancel"
                onClick={() => setShowRejectModal(false)}
              >
                Hủy
              </button>
              <button 
                className="administrator-verification-btn administrator-verification-reject"
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountVerificationTab;
