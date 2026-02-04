import React, { useState, useEffect } from 'react';
import { 
  Check, X, Eye, User, DollarSign, Calendar, Link as LinkIcon, Clock, RefreshCw
} from 'lucide-react';
import Pagination from '../../components/shared/Pagination';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import NeuralModal from '../../components/learning-hud/NeuralModal';
import { seminarService } from '../../services/seminarService';
import { Seminar } from '../../types/seminar';
import '../../styles/AdminSeminarManager.css';
import { useTheme } from '../../context/ThemeContext';

// Helper: Ensure external URL has protocol
const ensureExternalUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

const AdminSeminarManager = () => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject', id: number } | null>(null);
  
  const itemsPerPage = 10;

  const loadSeminars = async () => {
    setLoading(true);
    try {
        // Admin sees Pending by default
        const response = await seminarService.getAllSeminars(currentPage - 1, itemsPerPage, 'PENDING');
        setSeminars(response.content);
        setTotalElements(response.totalElements);
    } catch (error) {
        console.error("Failed to fetch seminars", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadSeminars();
  }, [currentPage]);

  const handleApprove = async (id: number) => {
    setConfirmAction({ type: 'approve', id });
  };

  const handleReject = async (id: number) => {
    setConfirmAction({ type: 'reject', id });
  };
  
  const processConfirmAction = async () => {
    if (!confirmAction) return;
    
    try {
        if (confirmAction.type === 'approve') {
            await seminarService.approveSeminar(confirmAction.id);
        } else {
            await seminarService.rejectSeminar(confirmAction.id);
        }
        loadSeminars();
        setIsModalOpen(false); // Close detail modal if open
    } catch (error) {
        alert(`Lỗi khi ${confirmAction.type === 'approve' ? 'duyệt' : 'từ chối'}`);
    } finally {
        setConfirmAction(null);
    }
  };

  const handleView = async (seminar: Seminar) => {
      try {
          // Fetch full details including meetingLink from admin endpoint
          const fullSeminar = await seminarService.getSeminarByIdForAdmin(seminar.id);
          setSelectedSeminar(fullSeminar);
          setIsModalOpen(true);
      } catch (error) {
          console.error('Failed to fetch seminar details', error);
          // Fallback to cached data
          setSelectedSeminar(seminar);
          setIsModalOpen(true);
      }
  };

  return (
    <div className={`asm-cosmic-container ${theme}`}>
      <div className="asm-cosmic-content">
        <div className="admin-content-header">
          <div className="header-title-area">
            <h2 className="asm-cosmic-title">
              <Calendar className="title-icon" />
              Duyệt Hội Thảo
            </h2>
            <p className="asm-cosmic-description">
              Hệ thống kiểm duyệt các yêu cầu tổ chức hội thảo từ doanh nghiệp
            </p>
          </div>
          <div className="header-actions">
             <button className="asm-refresh-btn" onClick={loadSeminars} disabled={loading}>
                <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                Làm mới
             </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="asm-stats-grid">
          <div className="asm-stat-card pending">
            <div className="asm-stat-icon">
              <Clock size={28} />
            </div>
            <div className="asm-stat-info">
              <div className="asm-stat-value">{totalElements}</div>
              <div className="asm-stat-label">Chờ duyệt</div>
            </div>
            <div className="asm-stat-glow"></div>
          </div>
          
          <div className="asm-stat-card info">
            <div className="asm-stat-icon">
              <User size={28} />
            </div>
            <div className="asm-stat-info">
              <div className="asm-stat-value">{seminars.length}</div>
              <div className="asm-stat-label">Hiển thị</div>
            </div>
            <div className="asm-stat-glow"></div>
          </div>
        </div>

        <div className="asm-table-outer">
          <div className="asm-table-wrapper">
            <table className="asm-cosmic-table">
              <thead>
                <tr>
                  <th>Hội Thảo</th>
                  <th>Người Tạo</th>
                  <th>Thời Gian</th>
                  <th>Giá Vé</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr>
                     <td colSpan={5} className="asm-loading-cell">
                        <div className="asm-loader-wrap">
                          <RefreshCw size={40} className="spinning" />
                          <span>Đang truy xuất dữ liệu...</span>
                        </div>
                     </td>
                   </tr>
                ) : (
                  <>
                    {seminars.map((item) => (
                      <tr key={item.id} className="asm-row-hover">
                        <td>
                          <div className="asm-seminar-info">
                            <div className="asm-seminar-img-mini">
                               <img src={item.imageUrl || 'https://via.placeholder.com/80'} alt="" />
                            </div>
                            <div className="asm-seminar-text">
                              <span className="asm-seminar-title">{item.title}</span>
                              <span className="asm-seminar-id">#ID-{item.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="asm-creator-info">
                            <User size={14} />
                            <span>{item.creatorName || 'Doanh nghiệp'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="asm-time-info">
                            <Calendar size={14} />
                            <span>{new Date(item.startTime).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </td>
                        <td>
                          <div className="asm-price-tag">
                            {item.price === 0 ? (
                               <span className="price-free">Miễn phí</span>
                            ) : (
                               <span className="price-amount">{item.price.toLocaleString()} đ</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="asm-actions">
                            <button 
                              className="asm-action-btn asm-btn-view" 
                              onClick={() => handleView(item)}
                              title="Xem chi tiết"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              className="asm-action-btn asm-btn-approve" 
                              onClick={() => handleApprove(item.id)}
                              title="Duyệt"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              className="asm-action-btn asm-btn-reject" 
                              onClick={() => handleReject(item.id)}
                              title="Từ chối"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {seminars.length === 0 && (
                        <tr>
                            <td colSpan={5} className="asm-empty-state">
                               <div className="asm-empty-wrap">
                                  <div className="asm-empty-icon">📂</div>
                                  <p>Hiện không có hội thảo nào đang chờ duyệt</p>
                               </div>
                            </td>
                        </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          totalItems={totalElements}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <NeuralModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chi Tiết Hội Thảo"
      >
        {selectedSeminar && (
             <div className="asm-modal-content">
                <img 
                    src={selectedSeminar.imageUrl || 'https://via.placeholder.com/800x400'} 
                    alt={selectedSeminar.title}
                    className="asm-modal-img"
                />
                <h3 className="asm-detail-title">{selectedSeminar.title}</h3>
                
                <div className="asm-detail-grid">
                    <div className="asm-detail-item">
                        <User size={18} className="asm-detail-icon" />
                        <div>
                            <span className="asm-detail-label">Người tạo</span>
                            <div className="asm-detail-value">{selectedSeminar.creatorName || selectedSeminar.creatorId}</div>
                        </div>
                    </div>

                    <div className="asm-detail-item">
                        <DollarSign size={18} className="asm-detail-icon" />
                        <div>
                            <span className="asm-detail-label">Giá vé</span>
                            <div className="asm-detail-value">
                                {selectedSeminar.price === 0 ? 'Miễn phí' : selectedSeminar.price.toLocaleString() + ' VNĐ'}
                            </div>
                        </div>
                    </div>

                    <div className="asm-detail-item">
                        <Calendar size={18} className="asm-detail-icon" />
                        <div>
                            <span className="asm-detail-label">Thời gian bắt đầu</span>
                            <div className="asm-detail-value">
                                {new Date(selectedSeminar.startTime).toLocaleDateString('vi-VN')}
                                {' - '}
                                {new Date(selectedSeminar.startTime).toLocaleTimeString('vi-VN')}
                            </div>
                        </div>
                    </div>

                    <div className="asm-detail-item">
                        <Clock size={18} className="asm-detail-icon" />
                        <div>
                            <span className="asm-detail-label">Thời gian kết thúc</span>
                            <div className="asm-detail-value">
                                {new Date(selectedSeminar.endTime).toLocaleDateString('vi-VN')}
                                {' - '}
                                {new Date(selectedSeminar.endTime).toLocaleTimeString('vi-VN')}
                            </div>
                        </div>
                    </div>

                    <div className="asm-detail-item full-width">
                        <LinkIcon size={18} className="asm-detail-icon" />
                        <div>
                            <span className="asm-detail-label">Link Meeting</span>
                            <div className="asm-detail-value">
                                <a href={ensureExternalUrl(selectedSeminar.meetingLink)} target="_blank" rel="noopener noreferrer" style={{ color: '#06b6d4', wordBreak: 'break-all' }}>
                                    {selectedSeminar.meetingLink || 'Chưa cập nhật'}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="asm-detail-section">
                    <span className="asm-detail-label">Mô tả chi tiết</span>
                    <p className="asm-detail-desc">
                        {selectedSeminar.description}
                    </p>
                </div>

                <div className="asm-modal-actions">
                    <button 
                        onClick={() => { setIsModalOpen(false); handleApprove(selectedSeminar.id); }}
                        className="asm-modal-btn approve"
                    >
                        Duyệt
                    </button>
                    <button 
                        onClick={() => { setIsModalOpen(false); handleReject(selectedSeminar.id); }}
                        className="asm-modal-btn reject"
                    >
                        Từ chối
                    </button>
                </div>
             </div>
        )}
      </NeuralModal>

      {/* Confirmation Modal */}
      <NeuralModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === 'approve' ? "Xác Nhận Duyệt" : "Xác Nhận Từ Chối"}
      >
        <div className="asm-confirm-content">
            <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '1rem',
                    color: confirmAction?.type === 'approve' ? '#22c55e' : '#ef4444'
                }}>
                    {confirmAction?.type === 'approve' ? '✅' : '⚠️'}
                </div>
                <h3 style={{ color: 'var(--lhud-text-bright)', marginBottom: '0.5rem' }}>
                    {confirmAction?.type === 'approve' ? 'Bạn có chắc chắn muốn duyệt hội thảo này?' : 'Bạn có chắc chắn muốn từ chối hội thảo này?'}
                </h3>
                <p style={{ color: 'var(--lhud-text-dim)', marginBottom: '2rem' }}>
                    {confirmAction?.type === 'approve' 
                        ? 'Hội thảo sẽ được công khai và người dùng có thể đăng ký tham gia.' 
                        : 'Hội thảo sẽ bị từ chối và người tạo sẽ nhận được thông báo.'}
                </p>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button 
                        className="asm-modal-btn"
                        style={{ background: 'transparent', border: '1px solid var(--lhud-border)' }}
                        onClick={() => setConfirmAction(null)}
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        className={`asm-modal-btn ${confirmAction?.type === 'approve' ? 'approve' : 'reject'}`}
                        onClick={processConfirmAction}
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
      </NeuralModal>

    </div>
  );
};

export default AdminSeminarManager;
