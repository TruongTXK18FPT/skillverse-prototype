import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Eye, Search, Send, AlertTriangle,
  User, DollarSign, Calendar, Link as LinkIcon, Wallet, CheckCircle, FileText, Download
} from 'lucide-react';
import Pagination from '../../components/shared/Pagination';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import NeuralModal from '../../components/learning-hud/NeuralModal';
import Toast from '../../components/shared/Toast';
import { seminarService } from '../../services/seminarService';
import { Seminar, SeminarCreateRequest } from '../../types/seminar';
import { useSeminarValidation } from '../../hooks/useSeminarValidation';
import { useToast } from '../../hooks/useToast';
import { SeminarErrorDisplay } from '../../components/seminar/SeminarErrorDisplay';
import '../../styles/RecruiterSeminarManager.css';
import { useTheme } from '../../context/ThemeContext';

const RecruiterSeminarManager = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();
  const { errors, validateForm, validateField, validateSubmission, clearErrors, parseBackendErrors } = useSeminarValidation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<SeminarCreateRequest>({
      title: '',
      description: '',
      imageUrl: '',
      meetingLink: '',
      startTime: '',
      endTime: '',
      price: 0,
      maxCapacity: undefined
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmSubmitId, setConfirmSubmitId] = useState<number | null>(null);
  const [viewSeminar, setViewSeminar] = useState<Seminar | null>(null);
  const [currentUser, setCurrentUser] = useState<{fullName: string} | null>(null);

  const itemsPerPage = 6;

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            setCurrentUser(JSON.parse(userStr));
        } catch (e) {
            console.error("Error parsing user from local storage", e);
        }
    }
  }, []);

  useEffect(() => {
    loadSeminars();
  }, [currentPage]);

  const loadSeminars = async () => {
    setLoading(true);
    try {
        const response = await seminarService.getMySeminars(currentPage - 1, itemsPerPage);
        setSeminars(response.content);
    } catch (error) {
        console.error("Failed to fetch seminars", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Frontend validation
    if (!validateForm(formData)) {
      showError('Dữ liệu không hợp lệ', 'Vui lòng kiểm tra lại các trường thông tin.');
      return;
    }
    
    try {
        if (editingId) {
            await seminarService.updateSeminar(editingId, formData);
            showSuccess('Thành công', 'Cập nhật hội thảo thành công!');
        } else {
            const submitData = new FormData();
            
            // Create a clean version of the data for the backend
            const requestData = {
                title: formData.title,
                description: formData.description,
                meetingLink: formData.meetingLink,
                startTime: formData.startTime,
                endTime: formData.endTime,
                price: formData.price,
                maxCapacity: formData.maxCapacity,
                // imageUrl is handled by backend if file is present
                imageUrl: formData.imageUrl 
            };
            
            // Append the JSON data as a Blob with application/json type
            submitData.append('data', new Blob([JSON.stringify(requestData)], {
                type: 'application/json'
            }));

            // Append image if selected
            if (selectedImage) {
                submitData.append('image', selectedImage);
            }

            await seminarService.createSeminar(submitData);
            showSuccess('Thành công', 'Tạo hội thảo mới thành công!');
        }
        setIsModalOpen(false);
        setEditingId(null);
        setSelectedImage(null);
        setPreviewUrl(null);
        clearErrors();
        loadSeminars();
    } catch (error: any) {
        console.error("Failed to save seminar", error);
        
        // Parse backend validation errors
        parseBackendErrors(error);
        
        // Show toast notification with specific error
        const errorMessage = error?.response?.data?.message || 'Không thể lưu hội thảo. Vui lòng thử lại.';
        showError('Lỗi', errorMessage);
    }
  };

  const handleEdit = (seminar: Seminar) => {
      setEditingId(seminar.id);
      setFormData({
          title: seminar.title,
          description: seminar.description,
          imageUrl: seminar.imageUrl,
          meetingLink: seminar.meetingLink || '',
          startTime: seminar.startTime,
          endTime: seminar.endTime,
          price: seminar.price,
          maxCapacity: seminar.maxCapacity
      });
      // Clear image selection on edit for now (or show existing URL)
      setSelectedImage(null);
      setPreviewUrl(seminar.imageUrl || null);
      setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedImage(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
        title: '',
        description: '',
        imageUrl: '',
        meetingLink: '',
        startTime: '',
        endTime: '',
        price: 0,
        maxCapacity: undefined
    });
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const filteredSeminars = seminars.filter(s => 
      s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitSeminar = (id: number) => {
      setConfirmSubmitId(id);
  };

  const handleConfirmSubmit = async () => {
    if (confirmSubmitId) {
      try {
        // Find the seminar to validate
        const seminar = seminars.find(s => s.id === confirmSubmitId);
        if (!seminar) {
          showError('Lỗi', 'Không tìm thấy hội thảo');
          setConfirmSubmitId(null);
          return;
        }

        // Validate submission (check 24h rule)
        const validation = validateSubmission(seminar.startTime);
        if (!validation.isValid) {
          showError('Không thể gửi duyệt', validation.error || 'Không đủ điều kiện gửi duyệt');
          setConfirmSubmitId(null);
          return;
        }

        await seminarService.submitSeminar(confirmSubmitId);
        showSuccess('Thành công', 'Gửi duyệt hội thảo thành công!');
        loadSeminars();
      } catch (error) {
        console.error("Failed to submit seminar", error);
        showError('Lỗi', 'Có lỗi xảy ra khi gửi duyệt hội thảo.');
      } finally {
        setConfirmSubmitId(null);
      }
    }
  };

  const handleView = (seminar: Seminar) => {
      setViewSeminar(seminar);
  };

  const handleDownloadRevenueInvoice = async (seminarId: number, seminarTitle: string) => {
    try {
      const blob = await seminarService.downloadSeminarRevenueInvoice(seminarId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revenue_${seminarTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download revenue invoice", error);
      alert("Có lỗi xảy ra khi tải báo cáo doanh thu.");
    }
  };

  return (
    <div className={`rsm-container ${theme}`}>
      <div className="rsm-content">
        <div className="rsm-header">
          <h1 className="rsm-title">Quản Lý Hội Thảo</h1>
          <p className="rsm-description">
            Tạo và quản lý các buổi hội thảo trực tuyến của bạn
          </p>
        </div>

        <div className="rsm-controls">
          <div className="rsm-search-box">
            <Search className="rsm-search-icon" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm hội thảo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rsm-search-input"
            />
          </div>
          
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="rsm-add-btn"
          >
            <Plus size={20} />
            <span>Tạo Hội Thảo Mới</span>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="rsm-stats-bar">
          <div className="rsm-stats-card">
            <FileText size={24} className="rsm-stats-icon" />
            <div className="rsm-stats-info">
              <span className="rsm-stats-value">{seminars.length}</span>
              <span className="rsm-stats-label">Tổng Hội Thảo</span>
            </div>
          </div>
          <div className="rsm-stats-card">
            <CheckCircle size={24} className="rsm-stats-icon rsm-stats-icon--success" />
            <div className="rsm-stats-info">
              <span className="rsm-stats-value">{seminars.filter(s => s.status === 'ACCEPTED' || s.status === 'OPEN').length}</span>
              <span className="rsm-stats-label">Đã Được Duyệt</span>
            </div>
          </div>
          <div 
            className="rsm-stats-card rsm-stats-card--clickable"
            onClick={() => navigate('/my-wallet')}
            title="Xem lịch sử thu nhập từ bán vé"
          >
            <Wallet size={24} className="rsm-stats-icon rsm-stats-icon--wallet" />
            <div className="rsm-stats-info">
              <span className="rsm-stats-value">Xem Thu Nhập</span>
              <span className="rsm-stats-label">Wallet History →</span>
            </div>
          </div>
        </div>

        <div className="rsm-table-wrapper">
          <table className="rsm-table">
            <thead>
              <tr>
                <th>Tiêu Đề</th>
                <th>Bắt Đầu</th>
                <th>Kết Thúc</th>
                <th>Giá Vé</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSeminars.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td className="rsm-time-cell">
                    {new Date(item.startTime).toLocaleDateString()} <br/>
                    <span className="rsm-time-sub">
                        {new Date(item.startTime).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="rsm-time-cell">
                    {new Date(item.endTime).toLocaleDateString()} <br/>
                    <span className="rsm-time-sub">
                        {new Date(item.endTime).toLocaleTimeString()}
                    </span>
                  </td>
                  <td>
                    {item.price === 0 ? <span style={{ color: 'var(--lhud-cyan)' }}>Miễn phí</span> : item.price.toLocaleString() + ' đ'}
                  </td>
                  <td>
                    <span className={`rsm-status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="rsm-actions">
                      {item.status === 'DRAFT' && (
                          <>
                            <button 
                                className="rsm-action-btn" 
                                onClick={() => handleEdit(item)}
                                title="Chỉnh sửa"
                            >
                                <Edit size={16} />
                            </button>
                            <button 
                                className="rsm-action-btn" 
                                onClick={() => handleSubmitSeminar(item.id)}
                                title="Gửi duyệt"
                                style={{ color: '#eab308' }}
                            >
                                <Send size={16} />
                            </button>
                          </>
                      )}
                      {(item.status === 'ACCEPTED' || item.status === 'OPEN' || item.status === 'CLOSED') && (
                        <button 
                          className="rsm-action-btn" 
                          onClick={() => handleDownloadRevenueInvoice(item.id, item.title)}
                          title="Tải báo cáo doanh thu"
                          style={{ color: '#10b981' }}
                        >
                          <Download size={16} />
                        </button>
                      )}
                      <button 
                          className="rsm-action-btn" 
                          onClick={() => handleView(item)}
                          title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={filteredSeminars.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <NeuralModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Cập Nhật Hội Thảo" : "Tạo Hội Thảo Mới"}
      >
        <form onSubmit={handleSubmit} className="rsm-form">
            {Object.keys(errors).length > 0 && (
              <SeminarErrorDisplay 
                errors={Object.values(errors).flat()} 
                onClose={clearErrors} 
              />
            )}
            <div className="rsm-form-group">
                <label className="rsm-form-label">Tiêu Đề</label>
                <input 
                    type="text" 
                    required 
                    className={`rsm-form-input ${errors.title ? 'rsm-form-input--error' : ''}`}
                    value={formData.title}
                    onChange={e => {
                      setFormData({...formData, title: e.target.value});
                      validateField('title', e.target.value);
                    }}
                />
                {errors.title && <span className="rsm-form-error">{errors.title}</span>}
            </div>

            <div className="rsm-form-group">
                <label className="rsm-form-label">Hình Ảnh Poster</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input 
                        type="file" 
                        accept="image/*"
                        className="rsm-form-input"
                        onChange={handleImageChange}
                    />
                    {previewUrl && (
                        <div style={{ 
                            width: '100%', 
                            height: '200px', 
                            background: `url(${previewUrl}) center/cover no-repeat`,
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }} />
                    )}
                </div>
            </div>
            
            <div className="rsm-form-group">
                <label className="rsm-form-label">Mô Tả Chi Tiết</label>
                <textarea 
                    rows={5}
                    className={`rsm-form-textarea ${errors.description ? 'rsm-form-input--error' : ''}`}
                    value={formData.description}
                    onChange={e => {
                      setFormData({...formData, description: e.target.value});
                      validateField('description', e.target.value);
                    }}
                />
                {errors.description && <span className="rsm-form-error">{errors.description}</span>}
            </div>

            <div className="rsm-form-row">
                <div className="rsm-form-group">
                    <label className="rsm-form-label">Bắt Đầu</label>
                    <input 
                        type="datetime-local" 
                        required
                        className={`rsm-form-input ${errors.startTime ? 'rsm-form-input--error' : ''}`}
                        value={formData.startTime}
                        onChange={e => {
                          setFormData({...formData, startTime: e.target.value});
                          validateField('startTime', e.target.value);
                        }}
                    />
                    {errors.startTime && <span className="rsm-form-error">{errors.startTime}</span>}
                </div>
                <div className="rsm-form-group">
                    <label className="rsm-form-label">Kết Thúc</label>
                    <input 
                        type="datetime-local" 
                        required
                        className={`rsm-form-input ${errors.endTime ? 'rsm-form-input--error' : ''}`}
                        value={formData.endTime}
                        onChange={e => {
                          setFormData({...formData, endTime: e.target.value});
                          validateField('endTime', e.target.value);
                        }}
                    />
                    {errors.endTime && <span className="rsm-form-error">{errors.endTime}</span>}
                </div>
            </div>

            <div className="rsm-form-group">
                <label className="rsm-form-label">Link Meeting (Google Meet/Zoom)</label>
                <input 
                    type="text" 
                    required
                    placeholder="meet.google.com/abc-xyz hoặc zoom.us/j/123456789"
                    className={`rsm-form-input ${errors.meetingLink ? 'rsm-form-input--error' : ''}`}
                    value={formData.meetingLink}
                    onChange={e => {
                      setFormData({...formData, meetingLink: e.target.value});
                      validateField('meetingLink', e.target.value);
                    }}
                />
                {errors.meetingLink && <span className="rsm-form-error">{errors.meetingLink}</span>}
            </div>

            <div className="rsm-form-group">
                <label className="rsm-form-label">Giá Vé (VNĐ) - Nhập 0 nếu miễn phí</label>
                <input 
                    type="number" 
                    min="0"
                    className={`rsm-form-input ${errors.price ? 'rsm-form-input--error' : ''}`}
                    value={formData.price}
                    onChange={e => {
                      const value = Number(e.target.value);
                      setFormData({...formData, price: value});
                      validateField('price', value);
                    }}
                />
                {errors.price && <span className="rsm-form-error">{errors.price}</span>}
            </div>

            <div className="rsm-form-group">
                <label className="rsm-form-label">Số Lượng Vé Tối Đa - Để trống hoặc 0 nếu không giới hạn</label>
                <input 
                    type="number" 
                    min="0"
                    max="10000"
                    placeholder="Không giới hạn"
                    className={`rsm-form-input ${errors.maxCapacity ? 'rsm-form-input--error' : ''}`}
                    value={formData.maxCapacity || ''}
                    onChange={e => {
                      const value = e.target.value ? Number(e.target.value) : undefined;
                      setFormData({...formData, maxCapacity: value});
                      if (value !== undefined) {
                        validateField('maxCapacity', value);
                      }
                    }}
                />
                {errors.maxCapacity && <span className="rsm-form-error">{errors.maxCapacity}</span>}
                <small style={{ color: 'var(--lhud-text-dim)', display: 'block', marginTop: '0.5rem' }}>
                    Giới hạn số lượng người có thể tham gia hội thảo này
                </small>
            </div>

            <div className="rsm-form-actions">
                <button 
                    type="button" 
                    className="rsm-btn-cancel"
                    onClick={() => setIsModalOpen(false)}
                >
                    Hủy
                </button>
                <button 
                    type="submit"
                    className="rsm-btn-submit"
                >
                    {editingId ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
            </div>
        </form>
      </NeuralModal>

      <MeowlGuide currentPage="manager" />

      {/* Submit Confirmation Modal */}
      <NeuralModal
        isOpen={!!confirmSubmitId}
        onClose={() => setConfirmSubmitId(null)}
        title="Xác Nhận Gửi Duyệt"
      >
        <div className="rsm-confirm-modal">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ 
                    width: '60px', height: '60px', borderRadius: '50%', 
                    background: 'rgba(234, 179, 8, 0.2)', color: '#eab308',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <AlertTriangle size={32} />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Bạn có chắc chắn muốn gửi duyệt?</h3>
                <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>
                    Sau khi gửi duyệt, hội thảo sẽ chuyển sang trạng thái <strong>PENDING</strong> và bạn sẽ <strong>không thể chỉnh sửa</strong> thông tin được nữa cho đến khi có kết quả xét duyệt.
                </p>
            </div>
            
            <div className="rsm-form-actions" style={{ marginTop: '1.5rem' }}>
                <button 
                    className="rsm-btn-cancel"
                    onClick={() => setConfirmSubmitId(null)}
                >
                    Hủy bỏ
                </button>
                <button 
                    className="rsm-btn-submit"
                    onClick={handleConfirmSubmit}
                    style={{ background: '#eab308', color: '#000' }}
                >
                    Xác nhận gửi
                </button>
            </div>
        </div>
      </NeuralModal>

      {/* View Detail Modal */}
      <NeuralModal
        isOpen={!!viewSeminar}
        onClose={() => setViewSeminar(null)}
        title="Chi Tiết Hội Thảo"
      >
        {viewSeminar && (
             <div className="rsm-modal-content">
                <img 
                    src={viewSeminar.imageUrl || 'https://via.placeholder.com/800x400'} 
                    alt={viewSeminar.title}
                    className="rsm-modal-img"
                />
                <h3 className="rsm-detail-title">{viewSeminar.title}</h3>
                
                <div className="rsm-detail-grid">
                    <div className="rsm-detail-item">
                        <User size={18} className="rsm-detail-icon" />
                        <div>
                            <span className="rsm-detail-label">Người tạo</span>
                            <div className="rsm-detail-value">
                                {viewSeminar.creatorName && viewSeminar.creatorName !== 'Recruiter' 
                                    ? viewSeminar.creatorName 
                                    : (currentUser?.fullName || viewSeminar.creatorId || 'Me')}
                            </div>
                        </div>
                    </div>

                    <div className="rsm-detail-item">
                        <DollarSign size={18} className="rsm-detail-icon" />
                        <div>
                            <span className="rsm-detail-label">Giá vé</span>
                            <div className="rsm-detail-value">
                                {viewSeminar.price === 0 ? 'Miễn phí' : viewSeminar.price.toLocaleString() + ' VNĐ'}
                            </div>
                        </div>
                    </div>

                    <div className="rsm-detail-item">
                        <Wallet size={18} className="rsm-detail-icon" />
                        <div>
                            <span className="rsm-detail-label">Sức chứa</span>
                            <div className="rsm-detail-value">
                                {viewSeminar.maxCapacity ? (
                                    <span style={{ color: viewSeminar.isSoldOut ? '#ef4444' : '#06b6d4' }}>
                                        {viewSeminar.ticketsSold}/{viewSeminar.maxCapacity} vé
                                        {viewSeminar.isSoldOut && ' 🔴 HẾT'}
                                    </span>
                                ) : (
                                    <span style={{ color: '#06b6d4' }}>
                                        ♾️ Không giới hạn ({viewSeminar.ticketsSold} vé đã bán)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rsm-detail-item full-width">
                        <Calendar size={18} className="rsm-detail-icon" />
                        <div>
                            <span className="rsm-detail-label">Thời gian</span>
                            <div className="rsm-detail-value">
                                {new Date(viewSeminar.startTime).toLocaleDateString()}
                                {' | '}
                                {new Date(viewSeminar.startTime).toLocaleTimeString()} - {new Date(viewSeminar.endTime).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>

                    <div className="rsm-detail-item full-width">
                        <LinkIcon size={18} className="rsm-detail-icon" />
                        <div>
                            <span className="rsm-detail-label">Link Meeting</span>
                            <div className="rsm-detail-value">
                                <a href={viewSeminar.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#06b6d4' }}>
                                    {viewSeminar.meetingLink || 'Chưa cập nhật'}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="rsm-detail-section">
                    <span className="rsm-detail-label">Mô tả chi tiết</span>
                    <p className="rsm-detail-desc">
                        {viewSeminar.description}
                    </p>
                </div>

                <div className="rsm-form-actions" style={{ marginTop: '2rem' }}>
                    <button 
                        className="rsm-btn-cancel"
                        onClick={() => setViewSeminar(null)}
                        style={{ width: '100%' }}
                    >
                        Đóng
                    </button>
                </div>
             </div>
        )}
      </NeuralModal>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
        />
      )}
    </div>
  );
};

export default RecruiterSeminarManager;
