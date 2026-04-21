/**
 * [Nghiệp vụ] Admin Tab để quản lý các yêu cầu xác thực skill của Mentor.
 * 
 * Tính năng:
 * - Xem danh sách request với phân trang (10 req/page).
 * - Lọc theo trạng thái (PENDING, HISTORY(APPROVED|REJECTED)).
 * - Xem chi tiết Modal bằng chứng.
 * - Duyệt hoặc Từ chối (kèm lý do).
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  getAllVerifications,
  reviewVerification,
  MentorVerificationResponse,
  VerificationStatus,
  ReviewVerificationRequest
} from '../../services/mentorVerificationService';
import { useToast } from '../../hooks/useToast';
import './MentorVerificationAdminTab.css';

type FilterType = 'ALL' | 'PENDING' | 'HISTORY';

const MentorVerificationAdminTab: React.FC = () => {
  const [verifications, setVerifications] = useState<MentorVerificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [filterType, setFilterType] = useState<FilterType>('PENDING');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 10;
  
  // Modals
  const [selectedReq, setSelectedReq] = useState<MentorVerificationResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  
  // Action State
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let statuses: VerificationStatus[] | undefined = undefined;
      
      if (filterType === 'PENDING') {
        statuses = ['PENDING'];
      } else if (filterType === 'HISTORY') {
        statuses = ['APPROVED', 'REJECTED'];
      }

      const response = await getAllVerifications(statuses, currentPage, PAGE_SIZE);
      setVerifications(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      console.error('Lỗi tải danh sách xác thực', err);
      showError('Lỗi', 'Không thể tải danh sách xác thực skill. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [filterType, currentPage, PAGE_SIZE, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Action
  const handleApprove = (req: MentorVerificationResponse) => {
    setSelectedReq(req);
    setShowApproveModal(true);
  };

  const submitApprove = async () => {
    if (!selectedReq) return;
    
    try {
      setActionLoading(true);
      const payload: ReviewVerificationRequest = { approved: true };
      await reviewVerification(selectedReq.id, payload);
      showSuccess('Thành công', `Đã duyệt skill ${selectedReq.skillName}`);
      setShowApproveModal(false);
      setShowDetailModal(false);
      loadData();
    } catch (err: any) {
      showError('Lỗi duyệt yêu cầu', err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitReject = async () => {
    if (!selectedReq || !rejectReason.trim()) return;

    try {
      setActionLoading(true);
      const payload: ReviewVerificationRequest = { 
        approved: false, 
        reviewNote: rejectReason.trim() 
      };
      await reviewVerification(selectedReq.id, payload);
      showSuccess('Thành công', `Đã từ chối skill ${selectedReq.skillName}`);
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectReason('');
      loadData();
    } catch (err: any) {
      showError('Lỗi từ chối yêu cầu', err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="admin-mvt-container">
      {/* Header */}
      <div className="admin-mvt-header">
        <h2 className="admin-mvt-title">
          <ShieldCheck size={28} /> Xác thực Kỹ năng Mentor
        </h2>
      </div>

      {/* Filters */}
      <div className="admin-mvt-filters">
        <button 
          className={`admin-mvt-filter-btn ${filterType === 'PENDING' ? 'active' : ''}`}
          onClick={() => { setFilterType('PENDING'); setCurrentPage(0); }}
        >
          <Clock size={16} style={{ marginBottom: '-2px', marginRight: '4px' }}/> Chờ duyệt
        </button>
        <button 
          className={`admin-mvt-filter-btn ${filterType === 'HISTORY' ? 'active' : ''}`}
          onClick={() => { setFilterType('HISTORY'); setCurrentPage(0); }}
        >
          <CheckCircle size={16} style={{ marginBottom: '-2px', marginRight: '4px' }}/> Lịch sử (Đã duyệt/Từ chối)
        </button>
        <button 
          className={`admin-mvt-filter-btn ${filterType === 'ALL' ? 'active' : ''}`}
          onClick={() => { setFilterType('ALL'); setCurrentPage(0); }}
        >
          Tất cả
        </button>
      </div>

      {/* Table Section */}
      <div className="admin-mvt-table-wrapper">
        <table className="admin-mvt-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mentor</th>
              <th>Skill Yêu Cầu</th>
              <th>Ngày Gửi</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : verifications.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Không có yêu cầu xác thực nào.
                </td>
              </tr>
            ) : (
              verifications.map(req => (
                <tr key={req.id}>
                  <td>#{req.id}</td>
                  <td>
                    <div className="admin-mvt-avatar-cell">
                      <div className="admin-mvt-avatar">
                        {req.mentorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="admin-mvt-name">{req.mentorName}</div>
                        <div className="admin-mvt-email">{req.mentorEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td><strong>{req.skillName}</strong></td>
                  <td>{formatDate(req.requestedAt)}</td>
                  <td>
                    {req.status === 'PENDING' && <span style={{ color: '#facc15' }}><Clock size={14}/> Chờ duyệt</span>}
                    {req.status === 'APPROVED' && <span style={{ color: '#4ade80' }}><CheckCircle size={14}/> Đã duyệt</span>}
                    {req.status === 'REJECTED' && <span style={{ color: '#f87171' }}><XCircle size={14}/> Từ chối</span>}
                  </td>
                  <td>
                    <div className="admin-mvt-actions">
                      <button 
                        className="admin-mvt-btn admin-mvt-btn--view"
                        onClick={() => { setSelectedReq(req); setShowDetailModal(true); }}
                      >
                        <Eye size={14} /> Xem
                      </button>
                      {req.status === 'PENDING' && (
                        <>
                          <button 
                            className="admin-mvt-btn admin-mvt-btn--approve"
                            onClick={() => handleApprove(req)}
                            disabled={actionLoading}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button 
                            className="admin-mvt-btn admin-mvt-btn--reject"
                            onClick={() => { setSelectedReq(req); setShowRejectModal(true); }}
                            disabled={actionLoading}
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="admin-mvt-pagination">
            <span className="admin-mvt-page-info">
              Hiển thị trang {currentPage + 1} / {totalPages} (Tổng: {totalElements} yêu cầu)
            </span>
            <div className="admin-mvt-page-controls">
              <button 
                className="admin-mvt-page-btn"
                disabled={currentPage === 0 || loading}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={16} /> Trang trước
              </button>
              <button 
                className="admin-mvt-page-btn"
                disabled={currentPage >= totalPages - 1 || loading}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Trang tiếp <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailModal && selectedReq && (
        <div className="admin-mvt-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="admin-mvt-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-mvt-modal__header">
              <h3>Chi tiết yêu cầu #{selectedReq.id}</h3>
              <button className="admin-mvt-close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-mvt-modal__body">
              <div className="admin-mvt-detail-group">
                <h4>Thông tin Mentor</h4>
                <div className="admin-mvt-detail-row">
                  <div className="admin-mvt-detail-label">Tên:</div>
                  <div className="admin-mvt-detail-value">{selectedReq.mentorName}</div>
                </div>
                <div className="admin-mvt-detail-row">
                  <div className="admin-mvt-detail-label">Email:</div>
                  <div className="admin-mvt-detail-value">{selectedReq.mentorEmail}</div>
                </div>
              </div>

              <div className="admin-mvt-detail-group">
                <h4>Thông tin Kỹ năng</h4>
                <div className="admin-mvt-detail-row">
                  <div className="admin-mvt-detail-label">Tên kỹ năng:</div>
                  <div className="admin-mvt-detail-value"><strong>{selectedReq.skillName}</strong></div>
                </div>
                {selectedReq.githubUrl && (
                  <div className="admin-mvt-detail-row">
                    <div className="admin-mvt-detail-label">GitHub:</div>
                    <div className="admin-mvt-detail-value">
                      <a href={selectedReq.githubUrl} target="_blank" rel="noopener noreferrer" className="admin-mvt-link">
                        <ExternalLink size={14}/> {selectedReq.githubUrl}
                      </a>
                    </div>
                  </div>
                )}
                {selectedReq.portfolioUrl && (
                  <div className="admin-mvt-detail-row">
                    <div className="admin-mvt-detail-label">Portfolio:</div>
                    <div className="admin-mvt-detail-value">
                      <a href={selectedReq.portfolioUrl} target="_blank" rel="noopener noreferrer" className="admin-mvt-link">
                        <ExternalLink size={14}/> {selectedReq.portfolioUrl}
                      </a>
                    </div>
                  </div>
                )}
                {selectedReq.additionalNotes && (
                  <div className="admin-mvt-detail-row" style={{ flexDirection: 'column' }}>
                    <div className="admin-mvt-detail-label" style={{ marginBottom: '0.5rem', width: 'auto' }}>Mô tả kinh nghiệm:</div>
                    <div className="admin-mvt-detail-value" style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px' }}>
                      {selectedReq.additionalNotes}
                    </div>
                  </div>
                )}
              </div>

              {selectedReq.evidences.length > 0 && (
                <div className="admin-mvt-detail-group">
                  <h4>Bằng Chứng Cung Cấp</h4>
                  {selectedReq.evidences.map(ev => (
                    <div key={ev.id} className="admin-mvt-evidence-card">
                      <p style={{ color: '#22d3ee', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16}/> Loại: {ev.evidenceType}
                      </p>
                      {ev.evidenceUrl && (
                        <p>
                          <strong>Link / File:</strong>{' '}
                          <a href={ev.evidenceUrl} target="_blank" rel="noopener noreferrer" className="admin-mvt-link">
                            Mở liên kết <ExternalLink size={14}/>
                          </a>
                        </p>
                      )}
                      {ev.description && <p><strong>Mô tả:</strong> {ev.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {selectedReq.status !== 'PENDING' && (
                <div className="admin-mvt-detail-group">
                  <h4>Lịch Sử Xử Lý</h4>
                  <div className="admin-mvt-detail-row">
                    <div className="admin-mvt-detail-label">Người duyệt:</div>
                    <div className="admin-mvt-detail-value">{selectedReq.reviewedByName || `Admin #${selectedReq.reviewedById}`}</div>
                  </div>
                  {selectedReq.reviewedAt && (
                    <div className="admin-mvt-detail-row">
                      <div className="admin-mvt-detail-label">Ngày duyệt:</div>
                      <div className="admin-mvt-detail-value">{formatDate(selectedReq.reviewedAt)}</div>
                    </div>
                  )}
                  {selectedReq.reviewNote && (
                    <div className="admin-mvt-detail-row" style={{ flexDirection: 'column' }}>
                      <div className="admin-mvt-detail-label" style={{ marginBottom: '0.5rem', width: 'auto' }}>Lý do / Ghi chú:</div>
                      <div className="admin-mvt-detail-value" style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', borderLeft: '3px solid #8b5cf6' }}>
                        {selectedReq.reviewNote}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="admin-mvt-modal__footer">
              <button 
                className="admin-mvt-btn" 
                style={{ background: 'rgba(100,116,139,0.2)', border: '1px solid rgba(100,116,139,0.3)', color: '#cbd5e1' }}
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
              {selectedReq.status === 'PENDING' && (
                <>
                  <button 
                    className="admin-mvt-btn admin-mvt-btn--reject"
                    onClick={() => { setShowDetailModal(false); setShowRejectModal(true); }}
                  >
                    <XCircle size={16}/> Từ chối
                  </button>
                  <button 
                    className="admin-mvt-btn admin-mvt-btn--approve"
                    onClick={() => handleApprove(selectedReq)}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={16}/> Duyệt phê chuẩn
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && selectedReq && (
        <div className="admin-mvt-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="admin-mvt-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-mvt-modal__header">
              <h3>Từ Chối Yêu Cầu #{selectedReq.id}</h3>
              <button className="admin-mvt-close-btn" onClick={() => setShowRejectModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-mvt-modal__body">
              <div style={{ marginBottom: '1rem', color: '#f87171', display: 'flex', gap: '0.5rem' }}>
                <AlertCircle size={20}/>
                <span>Bạn đang từ chối yêu cầu xác thực skill <strong>{selectedReq.skillName}</strong> của <strong>{selectedReq.mentorName}</strong>. Vui lòng nêu rõ lý do từ chối.</span>
              </div>
              <textarea 
                className="admin-mvt-textarea"
                placeholder="Nhập lý do từ chối (bằng chứng không hợp lệ, link hỏng, ...)"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className="admin-mvt-modal__footer">
              <button 
                className="admin-mvt-btn" 
                style={{ background: 'rgba(100,116,139,0.2)', border: '1px solid rgba(100,116,139,0.3)', color: '#cbd5e1' }}
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
              >
                Hủy
              </button>
              <button 
                className="admin-mvt-btn admin-mvt-btn--reject"
                onClick={submitReject}
                disabled={actionLoading || !rejectReason.trim()}
              >
                <XCircle size={16}/> Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Approve Confirm Modal */}
      {showApproveModal && selectedReq && (
        <div className="admin-mvt-modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="admin-mvt-modal" onClick={e => e.stopPropagation()} style={{ borderColor: '#4ade80', boxShadow: '0 0 30px rgba(74, 222, 128, 0.15)' }}>
            <div className="admin-mvt-modal__header" style={{ borderBottomColor: 'rgba(74, 222, 128, 0.3)' }}>
              <h3 style={{ color: '#4ade80' }}>Xác Nhận Duyệt Yêu Cầu #{selectedReq.id}</h3>
              <button className="admin-mvt-close-btn" onClick={() => setShowApproveModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-mvt-modal__body">
              <div style={{ marginBottom: '1rem', color: '#f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <ShieldCheck size={32} color="#4ade80" />
                <span style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>
                  Bạn có chắc chắn muốn duyệt skill <strong>{selectedReq.skillName}</strong> cho Mentor <strong>{selectedReq.mentorName}</strong>?
                </span>
              </div>
            </div>
            <div className="admin-mvt-modal__footer" style={{ borderTopColor: 'rgba(74, 222, 128, 0.3)' }}>
              <button 
                className="admin-mvt-btn" 
                style={{ background: 'rgba(100,116,139,0.2)', border: '1px solid rgba(100,116,139,0.3)', color: '#cbd5e1' }}
                onClick={() => setShowApproveModal(false)}
              >
                Hủy
              </button>
              <button 
                className="admin-mvt-btn admin-mvt-btn--approve"
                onClick={submitApprove}
                disabled={actionLoading}
              >
                <CheckCircle size={16}/> Duyệt phê chuẩn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorVerificationAdminTab;
