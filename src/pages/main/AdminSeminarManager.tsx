import React, { useState, useEffect } from 'react';
import { 
  Check, X, Eye, User, DollarSign, Calendar, Link as LinkIcon, Clock
} from 'lucide-react';
import Pagination from '../../components/shared/Pagination';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import NeuralModal from '../../components/learning-hud/NeuralModal';
import { seminarService } from '../../services/seminarService';
import { Seminar } from '../../types/seminar';
import '../../styles/AdminSeminarManager.css';
import { useTheme } from '../../context/ThemeContext';

const AdminSeminarManager = () => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject', id: number } | null>(null);
  
  const itemsPerPage = 6;

  const loadSeminars = async () => {
    setLoading(true);
    try {
        // Admin sees Pending by default
        const response = await seminarService.getAllSeminars(currentPage - 1, itemsPerPage, 'PENDING');
        setSeminars(response.content);
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
    <div className={`asm-container ${theme}`}>
      <div className="asm-content">
        <div className="asm-header">
          <h1 className="asm-title">Duyệt Hội Thảo</h1>
          <p className="asm-description">
            Kiểm duyệt các hội thảo đang chờ (Pending)
          </p>
        </div>

        <div className="asm-table-wrapper">
          <table className="asm-table">
            <thead>
              <tr>
                <th>Tiêu Đề</th>
                <th>Người Tạo</th>
                <th>Thời Gian</th>
                <th>Giá Vé</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {seminars.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.creatorName || item.creatorId}</td>
                  <td>
                    {new Date(item.startTime).toLocaleDateString()}
                  </td>
                  <td>
                    {item.price === 0 ? <span style={{ color: '#22c55e' }}>Miễn phí</span> : item.price.toLocaleString() + ' đ'}
                  </td>
                  <td>
                    <div className="asm-actions">
                      <button 
                        className="asm-action-btn asm-btn-view" 
                        onClick={() => handleView(item)}
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="asm-action-btn asm-btn-approve" 
                        onClick={() => handleApprove(item.id)}
                        title="Duyệt"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        className="asm-action-btn asm-btn-reject" 
                        onClick={() => handleReject(item.id)}
                        title="Từ chối"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {seminars.length === 0 && !loading && (
                  <tr>
                      <td colSpan={5} className="asm-empty-state">Không có hội thảo nào đang chờ duyệt</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={seminars.length}
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
                                <a href={selectedSeminar.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#06b6d4', wordBreak: 'break-all' }}>
                                    {selectedSeminar.meetingLink}
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
