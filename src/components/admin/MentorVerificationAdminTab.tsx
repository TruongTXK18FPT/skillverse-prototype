/**
 * [Nghiệp vụ] Admin Tab để quản lý các yêu cầu xác thực skill (Batch cho Mentor, Single cho Student).
 * 
 * Tính năng:
 * - Xem danh sách request với phân trang (10 req/page).
 * - Lọc theo trạng thái.
 * - Split-Screen Modal cho Mentor Batch: Nửa trái xem tài liệu (PDF, Link), Nửa phải duyệt từng kỹ năng (Partial Approval).
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
  AlertCircle,
  Package,
  Github,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  getAllBatchVerifications,
  reviewBatchVerification,
  BatchVerificationResponse,
  ReviewBatchVerificationRequest,
  EvidenceResponse
} from '../../services/mentorVerificationService';
import {
  getAllStudentVerifications,
  reviewStudentVerification,
  StudentVerificationResponse
} from '../../services/studentSkillVerificationService';
import { useToast } from '../../hooks/useToast';
import { useScrollToListTopOnPagination } from '../../hooks/useScrollToListTopOnPagination';
import './MentorVerificationAdminTab.css';

type FilterType = 'ALL' | 'PENDING' | 'HISTORY';
type RequesterRole = 'MENTOR' | 'STUDENT';

// For UI convenience
type UnifiedVerificationItem = {
  isBatch: boolean;
  id: number;
  requesterId: number;
  requesterName: string;
  requesterEmail: string;
  requesterAvatarUrl?: string;
  requesterRole: RequesterRole;
  title: string;
  status: string;
  requestedAt: string;
  originalBatch?: BatchVerificationResponse;
  originalStudent?: StudentVerificationResponse;
};

const MentorVerificationAdminTab: React.FC = () => {
  const [items, setItems] = useState<UnifiedVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [requesterRole, setRequesterRole] = useState<RequesterRole>('MENTOR');
  const [filterType, setFilterType] = useState<FilterType>('PENDING');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 10;
  const { withPaginationScroll } = useScrollToListTopOnPagination();
  
  // Modals
  const [selectedBatch, setSelectedBatch] = useState<BatchVerificationResponse | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const [selectedStudentReq, setSelectedStudentReq] = useState<StudentVerificationResponse | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Batch Review State
  const [batchReviewNotes, setBatchReviewNotes] = useState('');
  const [skillReviews, setSkillReviews] = useState<Record<number, { approved: boolean; note: string }>>({});
  
  // Action State
  const [actionLoading, setActionLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      let statuses: string[] | undefined = undefined;
      if (filterType === 'PENDING') {
        statuses = ['PENDING'];
      } else if (filterType === 'HISTORY') {
        statuses = ['APPROVED', 'REJECTED', 'PARTIAL_APPROVED', 'COMPLETED', 'REVOKED'];
      }

      let responseData: UnifiedVerificationItem[] = [];

      if (requesterRole === 'MENTOR') {
        const response = await getAllBatchVerifications(statuses, currentPage, PAGE_SIZE);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        responseData = response.content.map(b => ({
          isBatch: true,
          id: b.id,
          requesterId: b.mentorId,
          requesterName: b.mentorName,
          requesterEmail: b.mentorEmail,
          requesterAvatarUrl: b.mentorAvatarUrl,
          requesterRole: 'MENTOR',
          title: `Lô Xác Thực (${b.skills?.length || 0} kỹ năng)`,
          status: b.status,
          requestedAt: b.submittedAt,
          originalBatch: b
        }));
      } else {
        const response = await getAllStudentVerifications(statuses as any, currentPage, PAGE_SIZE);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        responseData = response.content.map(s => ({
          isBatch: false,
          id: s.id,
          requesterId: s.userId,
          requesterName: s.userName,
          requesterEmail: s.userEmail,
          requesterAvatarUrl: s.userAvatarUrl,
          requesterRole: 'STUDENT',
          title: s.skillName,
          status: s.status,
          requestedAt: s.requestedAt,
          originalStudent: s
        }));
      }

      setItems(responseData);
    } catch (err: any) {
      console.error('Lỗi tải danh sách xác thực', err);
      showError('Lỗi', 'Không thể tải danh sách. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [requesterRole, filterType, currentPage, PAGE_SIZE, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Batch Modal
  const openBatchModal = (batch: BatchVerificationResponse) => {
    setSelectedBatch(batch);
    setBatchReviewNotes(batch.generalReviewNote || '');
    
    // Initialize review state
    const initialReviews: Record<number, { approved: boolean; note: string }> = {};
    batch.skills?.forEach(s => {
      initialReviews[s.id] = {
        approved: s.status === 'APPROVED',
        note: s.reviewNote || ''
      };
    });
    setSkillReviews(initialReviews);
    setShowBatchModal(true);
  };

  const toggleSkillApproval = (skillId: number) => {
    setSkillReviews(prev => ({
      ...prev,
      [skillId]: { ...prev[skillId], approved: !prev[skillId].approved }
    }));
  };

  const approveAllPending = () => {
    if (!selectedBatch) return;
    const updated = { ...skillReviews };
    selectedBatch.skills?.forEach(s => {
      if (s.status === 'PENDING') {
        updated[s.id] = { ...updated[s.id], approved: true };
      }
    });
    setSkillReviews(updated);
  };

  const submitBatchReview = async () => {
    if (!selectedBatch) return;
    
    try {
      setActionLoading(true);
      const payload: ReviewBatchVerificationRequest = {
        generalReviewNote: batchReviewNotes.trim(),
        skillsReview: Object.keys(skillReviews).map(key => {
          const skillId = Number(key);
          return {
            skillVerificationId: skillId,
            approved: skillReviews[skillId].approved,
            reviewNote: skillReviews[skillId].note.trim()
          };
        })
      };

      await reviewBatchVerification(selectedBatch.id, payload);
      showSuccess('Thành công', `Đã lưu kết quả duyệt Lô #${selectedBatch.id}`);
      setShowBatchModal(false);
      loadData();
    } catch (err: any) {
      showError('Lỗi duyệt yêu cầu', err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Student Modal
  const openStudentModal = (studentReq: StudentVerificationResponse) => {
    setSelectedStudentReq(studentReq);
    setShowStudentModal(true);
  };

  const handleStudentReview = async (approved: boolean) => {
    if (!selectedStudentReq) return;
    try {
      setActionLoading(true);
      await reviewStudentVerification(selectedStudentReq.id, { approved, reviewNote: batchReviewNotes });
      showSuccess('Thành công', `Đã ${approved ? 'duyệt' : 'từ chối'} skill của sinh viên`);
      setShowStudentModal(false);
      setBatchReviewNotes('');
      loadData();
    } catch (err: any) {
      showError('Lỗi xử lý', err.response?.data?.message || err.message);
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

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return <FileText size={16} />;
      case 'GITHUB': return <Github size={16} />;
      case 'CV': return <FileText size={16} />;
      case 'PORTFOLIO_LINK': return <ExternalLink size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getEvidenceLabel = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return 'Chứng chỉ';
      case 'GITHUB': return 'GitHub';
      case 'CV': return 'CV / Resume';
      case 'PORTFOLIO_LINK': return 'Portfolio / Website';
      case 'WORK_EXPERIENCE': return 'Kinh nghiệm';
      default: return type;
    }
  };

  const isImageUrl = (url: string | undefined) => {
    if (!url) return false;
    return /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url) || url.includes("cloudinary.com");
  };

  const isPdfUrl = (url: string | undefined) => {
    if (!url) return false;
    return /\.pdf($|\?)/i.test(url);
  };

  return (
    <div className="admin-mvt-container">
      {/* Header */}
      <div className="admin-mvt-header">
        <h2 className="admin-mvt-title">
          <ShieldCheck size={28} /> Quản lý Xác thực Kỹ Năng
        </h2>
        <div className="admin-mvt-role-toggle">
          <button 
            className={`admin-role-btn ${requesterRole === 'MENTOR' ? 'active' : ''}`}
            onClick={() => { setRequesterRole('MENTOR'); setCurrentPage(0); }}
          >
            Giảng Viên (Mentor - Batch)
          </button>
          <button 
            className={`admin-role-btn ${requesterRole === 'STUDENT' ? 'active' : ''}`}
            onClick={() => { setRequesterRole('STUDENT'); setCurrentPage(0); }}
          >
            Học Viên (Student - Single)
          </button>
        </div>
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
          <CheckCircle size={16} style={{ marginBottom: '-2px', marginRight: '4px' }}/> Lịch sử
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
              <th>Người Yêu Cầu</th>
              <th>Loại / Tiêu Đề</th>
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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Không có yêu cầu xác thực nào.
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>
                    <div className="admin-mvt-avatar-cell">
                      <div className="admin-mvt-avatar">
                        {item.requesterName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="admin-mvt-name">{item.requesterName}</div>
                        <div className="admin-mvt-email">{item.requesterEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.isBatch ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}><Package size={16} /> <strong>{item.title}</strong></span>
                    ) : (
                      <strong>{item.title}</strong>
                    )}
                  </td>
                  <td>{formatDate(item.requestedAt)}</td>
                  <td>
                    {item.status === 'PENDING' && <span style={{ color: '#facc15' }}><Clock size={14}/> Chờ duyệt</span>}
                    {(item.status === 'APPROVED' || item.status === 'COMPLETED') && <span style={{ color: '#4ade80' }}><CheckCircle size={14}/> Hoàn tất</span>}
                    {item.status === 'PARTIAL_APPROVED' && <span style={{ color: '#38bdf8' }}><CheckCircle size={14}/> Duyệt 1 phần</span>}
                    {item.status === 'REJECTED' && <span style={{ color: '#f87171' }}><XCircle size={14}/> Từ chối</span>}
                    {item.status === 'REVOKED' && <span style={{ color: '#cbd5e1' }}><XCircle size={14}/> Đã gỡ</span>}
                  </td>
                  <td>
                    <div className="admin-mvt-actions">
                      <button 
                        className="admin-mvt-btn admin-mvt-btn--view"
                        onClick={() => {
                          if (item.isBatch && item.originalBatch) openBatchModal(item.originalBatch);
                          else if (!item.isBatch && item.originalStudent) openStudentModal(item.originalStudent);
                        }}
                      >
                        <Eye size={14} /> Duyệt / Xem
                      </button>
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
              Hiển thị trang {currentPage + 1} / {totalPages} (Tổng: {totalElements})
            </span>
            <div className="admin-mvt-page-controls">
              <button 
                className="admin-mvt-page-btn"
                disabled={currentPage === 0 || loading}
                onClick={withPaginationScroll(() => setCurrentPage(p => p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="admin-mvt-page-btn"
                disabled={currentPage >= totalPages - 1 || loading}
                onClick={withPaginationScroll(() => setCurrentPage(p => p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Verification Split-Screen Modal */}
      {showBatchModal && selectedBatch && (
        <div className="admin-split-overlay">
          <div className="admin-split-modal">
            
            {/* Left Side: Evidence Hub */}
            <div className="admin-split-left">
              <div className="admin-split-header">
                <h3><Package size={20} /> Evidence Hub (Hồ Sơ Minh Chứng)</h3>
              </div>
              <div className="admin-split-content">
                
                {/* External Links as Cards */}
                <div className="admin-evidence-section">
                  <h4 className="admin-evidence-title">Liên Kết Ngoài</h4>
                  {selectedBatch.githubUrl && (
                    <div className="admin-link-card">
                      <div className="admin-link-card-info">
                        <Github size={24} color="#e2e8f0" />
                        <div>
                          <strong>GitHub Profile/Repo</strong>
                          <span className="admin-link-url">{selectedBatch.githubUrl}</span>
                        </div>
                      </div>
                      <a href={selectedBatch.githubUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-outline">
                        Mở Tab Mới <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                  {selectedBatch.portfolioUrl && (
                    <div className="admin-link-card">
                      <div className="admin-link-card-info">
                        <ExternalLink size={24} color="#e2e8f0" />
                        <div>
                          <strong>Portfolio Link</strong>
                          <span className="admin-link-url">{selectedBatch.portfolioUrl}</span>
                        </div>
                      </div>
                      <a href={selectedBatch.portfolioUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-outline">
                        Mở Tab Mới <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                  {(!selectedBatch.githubUrl && !selectedBatch.portfolioUrl) && (
                    <p className="admin-empty-text">Không có liên kết ngoài.</p>
                  )}
                </div>

                {selectedBatch.additionalNotes && (
                  <div className="admin-evidence-section">
                    <h4 className="admin-evidence-title">Mô Tả Tổng Quan</h4>
                    <div className="admin-text-card">
                      {selectedBatch.additionalNotes}
                    </div>
                  </div>
                )}

                {/* Internal Evidences (Images/PDFs) */}
                <div className="admin-evidence-section">
                  <h4 className="admin-evidence-title">Tệp Đính Kèm</h4>
                  {selectedBatch.evidences?.map(ev => (
                    <div key={ev.id} className="admin-file-card">
                      <div className="admin-file-card-header">
                        <span className="admin-file-type">{getEvidenceIcon(ev.evidenceType)} {getEvidenceLabel(ev.evidenceType)}</span>
                        {ev.evidenceUrl && (
                          <a href={ev.evidenceUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-text">
                            Mở <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      {ev.evidenceUrl && (
                        <a href={ev.evidenceUrl} target="_blank" rel="noopener noreferrer" className="admin-file-url">
                          {ev.evidenceUrl}
                        </a>
                      )}
                      {ev.description && <p className="admin-file-desc">{ev.description}</p>}
                      {isImageUrl(ev.evidenceUrl) && (
                        <div className="admin-image-preview">
                          <img src={ev.evidenceUrl} alt="Evidence" />
                        </div>
                      )}
                      {isPdfUrl(ev.evidenceUrl) && (
                        <iframe src={ev.evidenceUrl} className="admin-pdf-preview" title="PDF Preview"></iframe>
                      )}
                    </div>
                  ))}
                  {(!selectedBatch.evidences || selectedBatch.evidences.length === 0) && (
                    <p className="admin-empty-text">Không có tệp đính kèm.</p>
                  )}
                </div>

              </div>
            </div>

            {/* Right Side: Skills Checklist */}
            <div className="admin-split-right">
              <div className="admin-split-header" style={{ justifyContent: 'space-between' }}>
                <h3>Checklist Kỹ Năng ({selectedBatch.skills?.length || 0})</h3>
                <button className="admin-close-btn" onClick={() => setShowBatchModal(false)}><X size={24} /></button>
              </div>
              <div className="admin-split-content">
                
                <div className="admin-batch-info-panel">
                  <div className="admin-avatar-small">{selectedBatch.mentorName.charAt(0)}</div>
                  <div>
                    <strong>{selectedBatch.mentorName}</strong>
                    <span>{selectedBatch.mentorEmail}</span>
                  </div>
                </div>

                <div className="admin-checklist-actions">
                  <button className="admin-btn-glow" onClick={approveAllPending}>
                    <CheckSquare size={16} /> Duyệt Nhanh Tất Cả (Pending)
                  </button>
                </div>

                <div className="admin-skills-checklist">
                  {selectedBatch.skills?.map(sk => {
                    const reviewState = skillReviews[sk.id] || { approved: false, note: '' };
                    return (
                      <div key={sk.id} className={`admin-skill-item ${reviewState.approved ? 'approved' : ''}`}>
                        <div className="admin-skill-item-header">
                          <div className="admin-skill-item-title" onClick={() => toggleSkillApproval(sk.id)}>
                            {reviewState.approved ? <CheckSquare size={20} color="#4ade80" /> : <Square size={20} color="#94a3b8" />}
                            <span>{sk.skillName}</span>
                          </div>
                          {sk.status !== 'PENDING' && (
                            <span className="admin-skill-status-badge">
                              {sk.status === 'APPROVED' ? 'Đã Duyệt' : 'Từ chối'}
                            </span>
                          )}
                        </div>
                        <input 
                          type="text" 
                          className="admin-inline-input"
                          placeholder="Ghi chú thêm cho kỹ năng này (nếu có)..."
                          value={reviewState.note}
                          onChange={(e) => setSkillReviews(prev => ({
                            ...prev,
                            [sk.id]: { ...prev[sk.id], note: e.target.value }
                          }))}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="admin-general-note">
                  <label>Ghi Chú Chung Cho Toàn Bộ Lô</label>
                  <textarea 
                    rows={3} 
                    placeholder="Nhận xét tổng quan..."
                    value={batchReviewNotes}
                    onChange={(e) => setBatchReviewNotes(e.target.value)}
                  />
                </div>

              </div>
              <div className="admin-split-footer">
                <button className="admin-btn-outline" onClick={() => setShowBatchModal(false)}>Hủy</button>
                <button className="admin-btn-glow" onClick={submitBatchReview} disabled={actionLoading}>
                  <CheckCircle size={16} /> Hoàn Tất Lưu Lô
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Student Single Modal - Simplified for brevity */}
      {showStudentModal && selectedStudentReq && (
        <div className="admin-mvt-modal-overlay" onClick={() => setShowStudentModal(false)}>
           <div className="admin-mvt-modal" onClick={e => e.stopPropagation()}>
               <div className="admin-mvt-modal__header">
                  <h3>Duyệt Sinh Viên: {selectedStudentReq.skillName}</h3>
                  <button className="admin-mvt-close-btn" onClick={() => setShowStudentModal(false)}><X size={20} /></button>
               </div>
               <div className="admin-mvt-modal__body">
                   <p>Người yêu cầu: {selectedStudentReq.userName}</p>
                   {/* Similar details as single view */}
                   <textarea placeholder="Lý do..." style={{width: '100%', marginTop: '1rem', background: 'transparent', color: 'white', padding: '10px'}} value={batchReviewNotes} onChange={e => setBatchReviewNotes(e.target.value)} />
               </div>
               <div className="admin-mvt-modal__footer">
                  <button className="admin-btn-outline" style={{borderColor: 'red', color: 'red'}} onClick={() => handleStudentReview(false)}>Từ chối</button>
                  <button className="admin-btn-glow" onClick={() => handleStudentReview(true)}>Duyệt</button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MentorVerificationAdminTab;
