import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  UserCheck, Building2, Clock, CheckCircle, XCircle,
  Search, Filter, Eye, RefreshCw, X, Calendar, Mail,
  FileText, Award, Briefcase, Globe, MapPin, ChevronLeft, ChevronRight,
  ExternalLink, Download, Maximize2, Phone, Cpu
} from 'lucide-react';
import adminService from '../../services/adminService';
import axiosInstance, { API_BASE_URL } from '../../services/axiosInstance';
import { adminApproveCccd, getPendingCccdVerifications, PendingCccdMentor } from '../../services/identityService';
import { useToast } from '../../hooks/useToast';
import Toast from '../shared/Toast';
import {
  MentorApplicationDto,
  RecruiterApplicationDto,
  ApplicationStatusFilter,
  ApplicationsResponse,
  ApplicationStatus
} from '../../data/adminDTOs';
import { getStoredUserRaw } from '../../utils/authStorage';
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
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning } = useToast();

  // CCCD Pending Verification
  const [pendingCccdList, setPendingCccdList] = useState<PendingCccdMentor[]>([]);
  const [cccdLoading, setCccdLoading] = useState(false);
  const [expandedCccdId, setExpandedCccdId] = useState<number | null>(null);

  // Get current user to check for USER_ADMIN permission
  const currentUserStr = getStoredUserRaw();
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const canManage = currentUser?.roles?.includes('ADMIN') || currentUser?.roles?.includes('USER_ADMIN');

  const fetchApplications = useCallback(async () => {
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
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const fetchPendingCccd = useCallback(async () => {
    try {
      setCccdLoading(true);
      const list = await getPendingCccdVerifications();
      setPendingCccdList(list);
    } catch (err) {
      console.error('❌ Error fetching pending CCCD:', err);
    } finally {
      setCccdLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCccd();
  }, [fetchPendingCccd]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchTerm, statusFilter]);

  // Scroll lock for modals
  useEffect(() => {
    if (showDetailModal || showRejectModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal, showRejectModal]);

  // fetchApplications moved into useCallback above

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
      
      const response = type === 'MENTOR' 
        ? await adminService.approveMentorApplication(userId)
        : await adminService.approveRecruiterApplication(userId);
      
      if (response.success) {
        showSuccess(
          'Duyệt thành công',
          `Đã duyệt đơn ${type === 'MENTOR' ? 'Mentor' : 'Doanh nghiệp'} thành công.`,
          4
        );
        setShowDetailModal(false);
        fetchApplications();
      } else {
        showError('Duyệt thất bại', response.message || 'Không thể duyệt đơn.');
      }
    } catch (err: any) {
      console.error('❌ Error approving:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi duyệt đơn';
      showError('Duyệt thất bại', errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCccd = async (userId: number) => {
    try {
      setActionLoading(true);
      await adminApproveCccd(userId);
      showSuccess('Xác Thực Thành Công', 'CCCD đã được xác thực. Email thông báo đã gửi cho Mentor.');
      fetchApplications();
      fetchPendingCccd();
      setExpandedCccdId(null);
      setShowDetailModal(false);
    } catch (err: any) {
      showError('Xác Thực Thất Bại', err.message || 'Không thể xác thực CCCD.');
    } finally {
      setActionLoading(false);
    }
  };


  const handleRejectConfirm = async () => {
    if (!selectedApplication || !rejectReason.trim()) {
      showWarning('Thiếu thông tin', 'Vui lòng nhập lý do từ chối.');
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
        showSuccess('Từ chối thành công', 'Đã từ chối đơn đăng ký.', 4);
        setShowRejectModal(false);
        setShowDetailModal(false);
        setRejectReason('');
        fetchApplications();
      } else {
        showError('Từ chối thất bại', response.message || 'Không thể từ chối đơn.');
      }
    } catch (err: any) {
      console.error('❌ Error rejecting:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi từ chối đơn';
      showError('Từ chối thất bại', errorMsg);
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
        {pendingCccdList.length > 0 && (
          <div className="verification-stat-card" style={{
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)'
          }}>
            <div className="verification-stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              <Cpu size={24} />
            </div>
            <div className="verification-stat-content">
              <div className="verification-stat-value" style={{ color: '#f59e0b' }}>{pendingCccdList.length}</div>
              <div className="verification-stat-label">CCCD Chờ Duyệt</div>
            </div>
          </div>
        )}
      </div>

      {/* ===== CCCD PENDING VERIFICATION SECTION ===== */}
      {(pendingCccdList.length > 0 || cccdLoading) && (
        <div style={{
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Cpu size={22} style={{ color: '#f59e0b' }} />
              <div>
                <h3 style={{ margin: 0, color: '#fcd34d', fontSize: '1.1rem' }}>CCCD Chờ Xác Thực Danh Tính</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                  Các Mentor đã nộp CCCD, AI đã trích xuất xong, đang chờ Admin duyệt
                </p>
              </div>
            </div>
            <button
              className="verification-refresh-btn"
              onClick={fetchPendingCccd}
              disabled={cccdLoading}
              style={{ fontSize: '0.8rem' }}
            >
              <RefreshCw size={16} className={cccdLoading ? 'spinning' : ''} />
              Làm mới
            </button>
          </div>

          {cccdLoading ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>
              <RefreshCw size={20} className="spinning" style={{ marginRight: '0.5rem' }} />
              Đang tải...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingCccdList.map((mentor) => {
                let extractedInfo: any = null;
                try {
                  if (mentor.cccdExtractedData) {
                    const parsed = JSON.parse(mentor.cccdExtractedData);
                    extractedInfo = parsed?.front?.data?.[0] || null;
                  }
                } catch { /* ignore */ }

                return (
                  <div key={mentor.userId} style={{
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    borderRadius: '0.75rem',
                    overflow: 'hidden'
                  }}>
                    {/* Row header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.875rem 1.25rem', cursor: 'pointer'
                    }} onClick={() => setExpandedCccdId(expandedCccdId === mentor.userId ? null : mentor.userId)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'rgba(245,158,11,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#f59e0b', fontWeight: 700, fontSize: '1rem', flexShrink: 0
                        }}>
                          {mentor.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{mentor.fullName}</div>
                          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{mentor.email}</div>
                        </div>
                        {extractedInfo && (
                          <span style={{
                            background: 'rgba(16,185,129,0.12)', color: '#34d399',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: '0.4rem', padding: '2px 8px', fontSize: '0.75rem'
                          }}>
                            ✓ AI đã trích xuất
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          className="verification-action-btn approve"
                          onClick={(e) => { e.stopPropagation(); handleApproveCccd(mentor.userId); }}
                          disabled={actionLoading}
                          title="Xác thực CCCD"
                          style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <CheckCircle size={14} />
                          {actionLoading ? '...' : 'Xác Thực'}
                        </button>
                        <Eye size={16} style={{ color: '#64748b' }} />
                      </div>
                    </div>

                    {/* Expanded AI data */}
                    {expandedCccdId === mentor.userId && (
                      <div style={{
                        borderTop: '1px solid rgba(245,158,11,0.12)',
                        padding: '1rem 1.25rem',
                        background: 'rgba(0,0,0,0.2)'
                      }}>
                        {extractedInfo ? (
                          <div className="verification-ai-grid">
                            <div className="verification-ai-item">
                              <span className="verification-ai-label">Số CCCD</span>
                              <span className="verification-ai-value highlight">{extractedInfo.id || mentor.cccdNumber || 'Không có'}</span>
                            </div>
                            <div className="verification-ai-item">
                              <span className="verification-ai-label">Họ và Tên</span>
                              <span className="verification-ai-value highlight">{extractedInfo.name || mentor.cccdFullName || 'Không có'}</span>
                            </div>
                            <div className="verification-ai-item">
                              <span className="verification-ai-label">Ngày Sinh</span>
                              <span className="verification-ai-value">{extractedInfo.dob || mentor.cccdDob || 'Không có'}</span>
                            </div>
                            <div className="verification-ai-item">
                              <span className="verification-ai-label">Giới Tính</span>
                              <span className="verification-ai-value">{extractedInfo.sex || 'Không có'}</span>
                            </div>
                            <div className="verification-ai-item">
                              <span className="verification-ai-label">Quê Quán</span>
                              <span className="verification-ai-value">{extractedInfo.home || 'Không có'}</span>
                            </div>
                            <div className="verification-ai-item" style={{ gridColumn: '1/-1' }}>
                              <span className="verification-ai-label">Nơi Thường Trú</span>
                              <span className="verification-ai-value">{extractedInfo.address || 'Không có'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="verification-ai-empty">
                            AI đang xử lý. Dữ liệu sẽ xuất hiện sau vài giây. Vui lòng làm mới.
                          </div>
                        )}
                        <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.75rem', marginBottom: 0 }}>
                          Cập nhật lúc: {mentor.updatedAt ? new Date(mentor.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                      {data.applicationStatus === ApplicationStatus.PENDING && canManage && (
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
      {showDetailModal && selectedApplication && ReactDOM.createPortal(
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
                <MentorDetail
                  mentor={selectedApplication.data as MentorApplicationDto}
                  onApproveCccd={handleApproveCccd}
                  actionLoading={actionLoading}
                />
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
        </div>,
        document.body
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApplication && ReactDOM.createPortal(
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
        </div>,
        document.body
      )}

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={false}
          countdownText={toast.countdownText}
          position="center"
          useOverlay={false}
          actionButton={toast.actionButton}
        />
      )}
    </div>
  );
};

// Mentor Detail Component
const MentorDetail: React.FC<{
  mentor: MentorApplicationDto;
  onApproveCccd?: (userId: number) => void;
  actionLoading?: boolean;
}> = ({ mentor, onApproveCccd, actionLoading }) => {
  const [cvPreviewUrl, setCvPreviewUrl] = useState<string | null>(null);
  const [certPreviewUrl, setCertPreviewUrl] = useState<string | null>(null);
  const [pdfOverlay, setPdfOverlay] = useState<{ url: string; title: string } | null>(null);
  const [cvDocxUrl, setCvDocxUrl] = useState<string | null>(null);
  const [certDocxUrl, setCertDocxUrl] = useState<string | null>(null);
  const [cvImageUrl, setCvImageUrl] = useState<string | null>(null);
  const [certImageUrl, setCertImageUrl] = useState<string | null>(null);
  const [certImagePreviewMap, setCertImagePreviewMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const preparePreview = async (srcUrl: string | undefined, setUrl: (u: string | null) => void) => {
      if (!srcUrl) { setUrl(null); return; }
      const isPdf = /\.pdf($|\?)/i.test(srcUrl);
      const isRaw = /\/raw\/upload\//.test(srcUrl) && !isPdf;
      if (isPdf && !isRaw) { setUrl(srcUrl); return; }
      if (isRaw) {
        try {
          const m = srcUrl.match(/https:\/\/res\.cloudinary\.com\/([^/]+)\/(raw)\/upload\/(v\d+\/)?(.+)/);
          if (!m) { setUrl(null); return; }
          const publicId = m[4];
          const endpoint = `${API_BASE_URL}/admin/media/stream-pdf?publicId=${encodeURIComponent(publicId)}&resourceType=raw`;
          const res = await axiosInstance.get(endpoint, { responseType: 'blob' });
          const blobUrl = URL.createObjectURL(res.data);
          setUrl(blobUrl);
          return;
        } catch (e) {
          console.error('Preview fetch failed', e);
          setUrl(null);
        }
      } else {
        setUrl(null);
      }
    };

    preparePreview(mentor.cvPortfolioUrl, setCvPreviewUrl);
    preparePreview(mentor.certificatesUrl, setCertPreviewUrl);
  }, [mentor.cvPortfolioUrl, mentor.certificatesUrl]);



  useEffect(() => {
    const urls = Array.isArray(mentor.certificateUrls) ? mentor.certificateUrls : [];
    setCertImagePreviewMap({});

    const isImgUrl = (u: string) => {
      const extImg = /\.(jpe?g|png|gif|svg|webp)($|\?)/i.test(u);
      const isCloudImg = /\/image\/upload\//.test(u);
      const isRawImg = /\/raw\/upload\//.test(u) && extImg;
      return extImg || isCloudImg || isRawImg;
    };

    const prepareImage = async (u: string) => {
      if (!u || !isImgUrl(u)) return;
      if (/\/raw\/upload\//.test(u)) {
        try {
          const m = u.match(/https:\/\/res\.cloudinary\.com\/([^/]+)\/raw\/upload\/(v\d+\/)?(.+)/);
          if (!m) return;
          const publicId = m[3];
          const res = await axiosInstance.get(`${API_BASE_URL}/admin/media/signed-url`, {
            params: { publicId, resourceType: 'raw' }
          });
          const signedUrl = res.data as string;
          setCertImagePreviewMap(prev => ({ ...prev, [u]: signedUrl }));
        } catch (e) {
          console.error('Image signed URL fetch failed', e);
        }
      } else {
        setCertImagePreviewMap(prev => ({ ...prev, [u]: u }));
      }
    };

    urls.forEach(prepareImage);
  }, [mentor.certificateUrls]);

  useEffect(() => {
    const setupDocOrImage = (srcUrl: string | undefined, setDocx: (u: string | null) => void, setImg: (u: string | null) => void) => {
      if (!srcUrl) { setDocx(null); setImg(null); return; }
      const isDocx = /\.docx($|\?)/i.test(srcUrl);
      const isImage = /\.(jpe?g|png|gif|svg|webp)($|\?)/i.test(srcUrl) || /\/image\/upload\//.test(srcUrl);
      if (isDocx) {
        const viewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(srcUrl)}`;
        setDocx(viewer);
        setImg(null);
        return;
      }
      if (isImage) {
        setImg(srcUrl);
        setDocx(null);
        return;
      }
      setDocx(null);
      setImg(null);
    };
    setupDocOrImage(mentor.cvPortfolioUrl, setCvDocxUrl, setCvImageUrl);
    setupDocOrImage(mentor.certificatesUrl, setCertDocxUrl, setCertImageUrl);
  }, [mentor.cvPortfolioUrl, mentor.certificatesUrl]);

  const downloadUrl = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toAscii = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const yyyymmdd = (d?: string) => {
    const dt = d ? new Date(d) : new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${y}${m}${dd}`;
  };

  const individualImageUrls = Array.isArray(mentor.certificateUrls)
    ? mentor.certificateUrls.filter(u =>
        /\.(jpe?g|png|gif|svg|webp)(?:$|\?)/i.test(u) ||
        /\/image\/upload\//.test(u) ||
        ( /\/raw\/upload\//.test(u) && /\.(jpe?g|png|gif|svg|webp)(?:$|\?)/i.test(u) )
      )
    : [];

  return (
  <>
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
        <div className="verification-links">
          <a href={mentor.linkedinProfile} target="_blank" rel="noopener noreferrer" className="verification-link">
            <Globe size={16} /> {mentor.linkedinProfile}
          </a>
          {/^https?:\/\/(www\.)?linkedin\.com\//.test(mentor.linkedinProfile) && (
            <span className="verification-badge valid">Hợp lệ</span>
          )}
        </div>
      </div>
    )}

    {/* CCCD Information Section */}
    <div className="verification-detail-section">
      <h5>Xác Thực Danh Tính (CCCD)</h5>
      <div className="verification-detail-grid">
        <div className="verification-detail-item">
          <CheckCircle size={18} style={{ color: mentor.identityVerified ? '#10b981' : '#f59e0b' }} />
          <div>
            <label>Trạng thái xác thực</label>
            <span style={{ color: mentor.identityVerified ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
              {mentor.identityVerified ? 'Đã xác thực hợp lệ' : 'Chưa xác thực / Đang chờ duyệt'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin CCCD Approve Button */}
      {!mentor.identityVerified && mentor.cccdExtractedData && mentor.cccdExtractedData !== '{}' && mentor.cccdExtractedData !== '{"status":"processing"}' && onApproveCccd && (
        <div style={{ marginTop: '1rem' }}>
          <button
            className="verification-modal-btn approve"
            onClick={() => onApproveCccd(mentor.userId)}
            disabled={actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}
          >
            <CheckCircle size={16} />
            {actionLoading ? 'Đang xử lý...' : '\u2705 Xác Thực Danh Tính CCCD'}
          </button>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Nhấn để xác thực CCCD cho Mentor này. Email thông báo sẽ được gửi tự động.
          </p>
        </div>
      )}

      {mentor.cccdExtractedData && (
        <div className="verification-ai-card">
          <div className="verification-ai-card-header">
            <Cpu size={18} />
            Dữ Liệu Trích Xuất Từ FPT.AI
          </div>
          {(() => {
            try {
              const data = JSON.parse(mentor.cccdExtractedData);
              const front = data?.front?.data?.[0];
              const back = data?.back?.data?.[0];
              
              if (!front && !back) return <div className="verification-ai-empty">Không có dữ liệu trích xuất</div>;

              return (
                <div className="verification-ai-grid">
                  <div className="verification-ai-item">
                    <span className="verification-ai-label">Số CCCD</span>
                    <span className="verification-ai-value highlight">{front?.id || mentor.cccdNumber || 'Không có'}</span>
                  </div>
                  <div className="verification-ai-item">
                    <span className="verification-ai-label">Họ và Tên</span>
                    <span className="verification-ai-value highlight">{front?.name || mentor.cccdFullName || 'Không có'}</span>
                  </div>
                  <div className="verification-ai-item">
                    <span className="verification-ai-label">Ngày Sinh</span>
                    <span className="verification-ai-value">{front?.dob || mentor.cccdDob || 'Không có'}</span>
                  </div>
                  <div className="verification-ai-item">
                    <span className="verification-ai-label">Giới Tính</span>
                    <span className="verification-ai-value">{front?.sex || 'Không có'}</span>
                  </div>
                  <div className="verification-ai-item">
                    <span className="verification-ai-label">Quê Quán</span>
                    <span className="verification-ai-value">{front?.home || 'Không có'}</span>
                  </div>
                  <div className="verification-ai-item">
                    <span className="verification-ai-label">Nơi Thường Trú</span>
                    <span className="verification-ai-value">{front?.address || 'Không có'}</span>
                  </div>
                  <div className="verification-ai-item">
                    <span className="verification-ai-label">Đặc Điểm Nhận Dạng</span>
                    <span className="verification-ai-value">{back?.features || 'Không có'}</span>
                  </div>
                  <div className="verification-ai-item">
                    <span className="verification-ai-label">Ngày Cấp</span>
                    <span className="verification-ai-value">{back?.issue_date || 'Không có'}</span>
                  </div>
                  <div className="verification-ai-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="verification-ai-label">Nơi Cấp</span>
                    <span className="verification-ai-value">{back?.issue_loc || 'Không có'}</span>
                  </div>
                </div>
              );
            } catch (e) {
              return <div className="verification-ai-empty">Lỗi định dạng dữ liệu ({mentor.cccdNumber})</div>;
            }
          })()}
        </div>
      )}
    </div>

    {(mentor.cvPortfolioUrl || mentor.certificatesUrl) && (
      <div className="verification-detail-section">
        <h5>Tài Liệu Đính Kèm</h5>
        <div className="verification-documents">
          {mentor.cvPortfolioUrl && (
            <div className="verification-document-preview">
              <div className="verification-document-header">
                <div className="verification-document-title"><FileText size={20} /> CV / Portfolio</div>
                {cvPreviewUrl && (
                  <div className="verification-document-actions">
                    <button className="verification-doc-btn" title="Phóng to" onClick={() => setPdfOverlay({ url: cvPreviewUrl, title: 'CV / Portfolio' })}>
                      <Maximize2 size={16} />
                    </button>
                    <button className="verification-doc-btn" title="Mở tab mới" onClick={() => window.open(cvPreviewUrl, '_blank')}>
                      <ExternalLink size={16} />
                    </button>
                    <button className="verification-doc-btn" title="Tải về" onClick={() => downloadUrl(cvPreviewUrl, `CV_Portfolio_${toAscii(mentor.fullName)}_${yyyymmdd(mentor.applicationDate)}.pdf`)}>
                      <Download size={16} />
                    </button>
                  </div>
                )}
              </div>
              {cvPreviewUrl ? (
                <embed src={cvPreviewUrl} type="application/pdf" className="verification-iframe" />
              ) : cvDocxUrl ? (
                <iframe src={cvDocxUrl} className="verification-docx-frame" title="DOCX Preview" />
              ) : cvImageUrl ? (
                <img src={cvImageUrl} alt="Portfolio" className="verification-image" />
              ) : (
                <a href={mentor.cvPortfolioUrl} target="_blank" rel="noopener noreferrer" className="verification-link">Mở tài liệu</a>
              )}
            </div>
          )}
          {mentor.certificatesUrl && (
            <div className="verification-document-preview">
              <div className="verification-document-header">
                <div className="verification-document-title"><Award size={20} /> Chứng chỉ</div>
                {certPreviewUrl && (
                  <div className="verification-document-actions">
                    <button className="verification-doc-btn" title="Phóng to" onClick={() => setPdfOverlay({ url: certPreviewUrl, title: 'Chứng chỉ' })}>
                      <Maximize2 size={16} />
                    </button>
                    <button className="verification-doc-btn" title="Mở tab mới" onClick={() => window.open(certPreviewUrl, '_blank')}>
                      <ExternalLink size={16} />
                    </button>
                    <button className="verification-doc-btn" title="Tải về" onClick={() => downloadUrl(certPreviewUrl, `ChungChi_${toAscii(mentor.fullName)}_${yyyymmdd(mentor.applicationDate)}.pdf`)}>
                      <Download size={16} />
                    </button>
                  </div>
                )}
              </div>
              {certPreviewUrl ? (
                <embed src={certPreviewUrl} type="application/pdf" className="verification-iframe" />
              ) : certDocxUrl ? (
                <iframe src={certDocxUrl} className="verification-docx-frame" title="DOCX Preview" />
              ) : certImageUrl ? (
                <img src={certImageUrl} alt="Certificate" className="verification-image" />
              ) : (
                <a href={mentor.certificatesUrl} target="_blank" rel="noopener noreferrer" className="verification-link">Mở tài liệu</a>
              )}
            </div>
          )}

          {individualImageUrls.length > 0 && (
            <div className="verification-detail-section">
              <h5>Chứng chỉ riêng lẻ</h5>
              <div className="verification-documents">
                {individualImageUrls.map((url, idx) => {
                  const isImage = /\.(jpe?g|png|gif|svg|webp)($|\?)/i.test(url) || /\/image\/upload\//.test(url) || (/\/raw\/upload\//.test(url) && /\.(jpe?g|png|gif|svg|webp)($|\?)/i.test(url));
                  const title = `Chứng chỉ #${idx + 1}`;
                  if (!isImage) return null;
                  const previewUrl = certImagePreviewMap[url] || url;
                  return (
                    <div key={idx} className="verification-document-preview">
                      <div className="verification-document-header">
                        <div className="verification-document-title"><Award size={18} /> {title}</div>
                        <div className="verification-document-actions">
                          <button className="verification-doc-btn" title="Mở tab mới" onClick={() => window.open(previewUrl, '_blank')}>
                            <ExternalLink size={16} />
                          </button>
                          <button className="verification-doc-btn" title="Tải về" onClick={() => downloadUrl(previewUrl, `ChungChi_${toAscii(mentor.fullName)}_${yyyymmdd(mentor.applicationDate)}_${idx + 1}.jpg`)}>
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                      <img src={previewUrl} alt={title} className="verification-image" />
                    </div>
                  );
                })}
              </div>
            </div>
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
  {pdfOverlay && (
    <div className="verification-pdf-overlay" onClick={() => setPdfOverlay(null)}>
      <div className="verification-pdf-container" onClick={(e) => e.stopPropagation()}>
        <div className="verification-pdf-toolbar">
          <div className="verification-pdf-title">{pdfOverlay.title}</div>
          <div className="verification-pdf-actions">
            <button className="verification-doc-btn" title="Mở tab mới" onClick={() => window.open(pdfOverlay.url, '_blank')}>
              <ExternalLink size={16} />
            </button>
            <button className="verification-doc-btn" title="Tải về" onClick={() => downloadUrl(pdfOverlay.url, 'document.pdf')}>
              <Download size={16} />
            </button>
            <button className="verification-doc-btn" title="Đóng" onClick={() => setPdfOverlay(null)}>
              <X size={16} />
            </button>
          </div>
        </div>
        <embed src={pdfOverlay.url} type="application/pdf" className="verification-pdf-iframe" />
      </div>
    </div>
  )}
  </>
  );
};

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
        {recruiter.contactPersonPhone && recruiter.contactPersonPhone !== 'N/A' && (
          <div className="verification-detail-item">
            <Phone size={18} />
            <div>
              <label>Số điện thoại liên hệ</label>
              <span>{recruiter.contactPersonPhone}</span>
            </div>
          </div>
        )}
        {recruiter.contactPersonPosition && recruiter.contactPersonPosition !== 'N/A' && (
          <div className="verification-detail-item">
            <Briefcase size={18} />
            <div>
              <label>Chức vụ</label>
              <span>{recruiter.contactPersonPosition}</span>
            </div>
          </div>
        )}
        {recruiter.companySize && recruiter.companySize !== 'N/A' && (
          <div className="verification-detail-item">
            <Building2 size={18} />
            <div>
              <label>Quy mô công ty</label>
              <span>{recruiter.companySize}</span>
            </div>
          </div>
        )}
        {recruiter.industry && recruiter.industry !== 'N/A' && (
          <div className="verification-detail-item">
            <Award size={18} />
            <div>
              <label>Ngành nghề</label>
              <span>{recruiter.industry}</span>
            </div>
          </div>
        )}
      </div>
    </div>

    {recruiter.companyDocumentsUrl && (
      <div className="verification-detail-section">
        <h5>Tài Liệu Công Ty</h5>
        <div className="verification-documents">
          <RecruiterDoc url={recruiter.companyDocumentsUrl} />
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

const RecruiterDoc: React.FC<{ url: string }> = ({ url }) => {
  const isImage = /\.(jpe?g|png|gif|svg|webp)($|\?)/i.test(url) || /\/image\/upload\//.test(url) || (/\/raw\/upload\//.test(url) && /\.(jpe?g|png|gif|svg|webp)($|\?)/i.test(url));
  const extMatch = url.match(/\.([a-z0-9]+)(?:$|\?)/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : (isImage ? 'jpg' : 'pdf');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<string | null>(null);

  useEffect(() => {
    const isRaw = /\/raw\/upload\//.test(url);
    const hasPdfExt = /\.pdf($|\?)/i.test(url);
    if (hasPdfExt && !isRaw) { setPreviewUrl(url); return; }
    if (isRaw) {
      const m = url.match(/https:\/\/res\.cloudinary\.com\/([^/]+)\/raw\/upload\/(v\d+\/)?(.+)/);
      if (!m) { setPreviewUrl(null); return; }
      const publicId = m[3];
      axiosInstance.get(`${API_BASE_URL}/admin/media/stream-pdf`, { params: { publicId, resourceType: 'raw' }, responseType: 'blob' })
        .then(res => { setPreviewUrl(URL.createObjectURL(res.data)); })
        .catch(() => { setPreviewUrl(null); });
      return;
    }
    setPreviewUrl(null);
  }, [url]);

  const downloadUrl = (u: string, filename: string) => {
    const a = document.createElement('a');
    a.href = u;
    a.download = filename;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const actionUrl = previewUrl || url;

  return (
    <div className="verification-document-preview">
      <div className="verification-document-header">
        <div className="verification-document-title"><FileText size={20} /> Giấy tờ đăng ký kinh doanh</div>
        <div className="verification-document-actions">
          <button className="verification-doc-btn" title="Phóng to" onClick={() => setOverlay(actionUrl)}>
            <Maximize2 size={16} />
          </button>
          <button className="verification-doc-btn" title="Mở tab mới" onClick={() => window.open(actionUrl, '_blank')}>
            <ExternalLink size={16} />
          </button>
          <button className="verification-doc-btn" title="Tải về" onClick={() => downloadUrl(actionUrl, `company-document.${previewUrl ? 'pdf' : ext}`)}>
            <Download size={16} />
          </button>
        </div>
      </div>
      {previewUrl ? (
        <embed src={previewUrl} type="application/pdf" className="verification-iframe" />
      ) : isImage ? (
      	<img src={url} alt="Company Document" className="verification-image" />
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="verification-link">Mở tài liệu</a>
      )}
      {overlay && (
        <div className="verification-pdf-overlay" onClick={() => setOverlay(null)}>
          <div className="verification-pdf-container" onClick={(e) => e.stopPropagation()}>
            <div className="verification-pdf-toolbar">
              <div className="verification-pdf-title">Giấy tờ đăng ký kinh doanh</div>
              <div className="verification-pdf-actions">
                <button className="verification-doc-btn" title="Mở tab mới" onClick={() => window.open(overlay, '_blank')}>
                  <ExternalLink size={16} />
                </button>
                <button className="verification-doc-btn" title="Tải về" onClick={() => downloadUrl(overlay, `company-document.${previewUrl ? 'pdf' : ext}`)}>
                  <Download size={16} />
                </button>
                <button className="verification-doc-btn" title="Đóng" onClick={() => setOverlay(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            {previewUrl ? (
              <embed src={overlay} type="application/pdf" className="verification-pdf-iframe" />
            ) : (
              <img src={overlay} alt="Company Document" className="verification-image" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountVerificationTabCosmic;
