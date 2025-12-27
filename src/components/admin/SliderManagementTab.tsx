import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Image, Plus, Edit, Trash2, CheckCircle, XCircle, RefreshCw, X, Save,
  Move, ToggleLeft, ToggleRight, Crop as CropIcon, AlertTriangle
} from 'lucide-react';
import sliderService, { Slider } from '../../services/sliderService';
import { validateImage } from '../../services/fileUploadService';
import getCroppedImg from '../../utils/cropImage';
import Cropper from 'react-easy-crop';
import './UserManagementTabCosmic.css'; // Reuse common admin styles
import './SliderManagementTab.css'; // Slider specific styles

const SliderManagementTab: React.FC = () => {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSlider, setCurrentSlider] = useState<Slider | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sliderToDelete, setSliderToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    displayOrder: 0,
    isActive: true,
    image: null as File | null,
    imagePreview: '',
    ctaText: '',
    ctaLink: ''
  });

  // Status Modal State
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ open: false, type: 'success', message: '' });

  // Crop State
  const [isCropping, setIsCropping] = useState(false);
  const [tempImgUrl, setTempImgUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    fetchSliders();
  }, []);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatusModal({ open: true, type, message });
    // Auto close success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => setStatusModal(prev => ({ ...prev, open: false })), 3000);
    }
  };

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const data = await sliderService.getAllSlidersAdmin();
      setSliders(data);
    } catch (error) {
      console.error('Failed to fetch sliders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentSlider(null);
    setFormData({
      title: '',
      description: '',
      displayOrder: sliders.length,
      isActive: true,
      image: null,
      imagePreview: '',
      ctaText: '',
      ctaLink: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (slider: Slider) => {
    setIsEditing(true);
    setCurrentSlider(slider);
    setFormData({
      title: slider.title,
      description: slider.description || '',
      displayOrder: slider.displayOrder,
      isActive: slider.isActive,
      image: null,
      imagePreview: slider.imageUrl,
      ctaText: slider.ctaText || '',
      ctaLink: slider.ctaLink || ''
    });
    setShowModal(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate using existing service
      const validation = validateImage(file);
      if (!validation.valid) {
        showStatus('error', validation.error || 'File không hợp lệ');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setTempImgUrl(objectUrl);
      setIsCropping(true);
      
      // Reset crop state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (tempImgUrl && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(tempImgUrl, croppedAreaPixels);
        if (croppedImage) {
          setFormData({
            ...formData,
            image: croppedImage,
            imagePreview: URL.createObjectURL(croppedImage)
          });
          setIsCropping(false);
          setTempImgUrl(null);
        }
      } catch (e) {
        console.error(e);
        showStatus('error', 'Lỗi khi cắt ảnh');
      }
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setTempImgUrl(null);
    // If user cancels crop and had no previous image, we might want to clear the file input.
    // But since we can't easily clear file input value, we just close crop mode.
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      showStatus('error', 'Vui lòng nhập tiêu đề');
      return;
    }
    if (!isEditing && !formData.image) {
      showStatus('error', 'Vui lòng chọn hình ảnh');
      return;
    }

    if (formData.displayOrder < 0) {
      showStatus('error', 'Thứ tự hiển thị không thể là số âm');
      return;
    }

    // Client-side Duplicate Order Check
    const isOrderDuplicate = sliders.some(s => 
      s.displayOrder === formData.displayOrder && 
      (!isEditing || s.id !== currentSlider?.id)
    );

    if (isOrderDuplicate) {
      showStatus('error', `Thứ tự #${formData.displayOrder} đã tồn tại. Vui lòng chọn thứ tự khác.`);
      return;
    }

    try {
      setActionLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      if (formData.description) data.append('description', formData.description);
      data.append('displayOrder', formData.displayOrder.toString());
      if (formData.ctaText) data.append('ctaText', formData.ctaText);
      if (formData.ctaLink) data.append('ctaLink', formData.ctaLink);
      if (isEditing) data.append('isActive', formData.isActive.toString());
      if (formData.image) data.append('image', formData.image);

      if (isEditing && currentSlider) {
        await sliderService.updateSlider(currentSlider.id, data);
        showStatus('success', 'Cập nhật slider thành công!');
      } else {
        await sliderService.createSlider(data);
        showStatus('success', 'Tạo slider thành công!');
      }
      
      setShowModal(false);
      fetchSliders();
    } catch (error: any) {
      console.error('Error saving slider:', error);
      const responseData = error.response?.data;
      let errorMsg = responseData?.message || error.message || 'Lỗi không xác định';

      if (responseData?.details && typeof responseData.details === 'object') {
          const details = Object.values(responseData.details).join(', ');
          if (details) {
              errorMsg += ` (${details})`;
          }
      }
      showStatus('error', 'Có lỗi xảy ra: ' + errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setSliderToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!sliderToDelete) return;

    try {
      setActionLoading(true);
      await sliderService.deleteSlider(sliderToDelete);
      showStatus('success', 'Đã xóa slider');
      fetchSliders();
      setShowDeleteModal(false);
      setSliderToDelete(null);
    } catch (error) {
      console.error('Error deleting slider:', error);
      showStatus('error', 'Không thể xóa slider');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (slider: Slider) => {
    try {
      const data = new FormData();
      data.append('isActive', (!slider.isActive).toString());
      await sliderService.updateSlider(slider.id, data);
      fetchSliders(); // Refresh to update UI
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div className="admin-user-management-cosmic">
      <div className="admin-user-header">
        <div>
          <h2>Quản Lý Slider Trang Chủ</h2>
          <p>Quản lý các hình ảnh hiển thị trên slider trang chủ</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-refresh-btn" onClick={fetchSliders} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Làm mới
          </button>
          <button className="admin-download-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            Thêm Slider
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <RefreshCw size={48} className="spinning" />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="admin-users-table">
          <table>
            <thead>
              <tr>
                <th>Thứ tự</th>
                <th>Hình ảnh</th>
                <th>Tiêu đề / Mô tả</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sliders.map((slider) => (
                <tr key={slider.id}>
                  <td>
                    <div className="admin-user-info">
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>#{slider.displayOrder}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-user-avatar" style={{ width: '120px', height: '60px', borderRadius: '4px' }}>
                      <img src={slider.imageUrl} alt={slider.title} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="admin-user-name">{slider.title}</span>
                      <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{slider.description}</span>
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleStatus(slider)}
                      className={`admin-status-badge ${slider.isActive ? 'active' : 'inactive'}`}
                      style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      {slider.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {slider.isActive ? 'Hiển thị' : 'Ẩn'}
                    </button>
                  </td>
                  <td>
                    <div className="admin-date-cell">
                      {new Date(slider.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td>
                    <div className="admin-action-buttons">
                      <button className="admin-action-btn edit" onClick={() => handleOpenEdit(slider)} title="Chỉnh sửa">
                        <Edit size={16} />
                      </button>
                      <button className="admin-action-btn delete" onClick={() => handleDelete(slider.id)} title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sliders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có slider nào. Hãy tạo mới!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && ReactDOM.createPortal(
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{isEditing ? 'Chỉnh Sửa Slider' : 'Thêm Slider Mới'}</h3>
              <button className="admin-close-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="admin-modal-body">
              {isCropping && tempImgUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '400px', position: 'relative' }}>
                  <div style={{ position: 'relative', flex: 1, background: '#333', borderRadius: '8px', overflow: 'hidden' }}>
                    <Cropper
                      image={tempImgUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={1920 / 800}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      objectFit="horizontal-cover"
                    />
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: '#fff', minWidth: '60px' }}>Zoom:</span>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button className="admin-action-btn close" onClick={handleCropCancel}>
                      Hủy bỏ
                    </button>
                    <button className="admin-action-btn save" onClick={handleCropConfirm}>
                      <CropIcon size={16} /> Cắt & Sử dụng
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-edit-form">
                  <div className="admin-form-group">
                    <label>Tiêu đề</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nhập tiêu đề slider"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Mô tả (Optional)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Nhập mô tả ngắn"
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '8px', width: '100%', minHeight: '80px' }}
                    />
                  </div>

                  <div className="admin-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label>Nút CTA (Text)</label>
                      <input
                        type="text"
                        value={formData.ctaText}
                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                        placeholder="VD: Xem ngay"
                      />
                    </div>
                    <div>
                      <label>Link CTA (URL)</label>
                      <input
                        type="text"
                        value={formData.ctaLink}
                        onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                        placeholder="VD: /courses"
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Thứ tự hiển thị</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {isEditing && (
                    <div className="admin-form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          style={{ width: '20px', height: '20px' }}
                        />
                        Hiển thị slider này
                      </label>
                    </div>
                  )}

                  <div className="admin-form-group">
                    <label>Hình ảnh (1920x800 recommended)</label>
                    <div style={{ marginBottom: '10px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ color: '#fff' }}
                      />
                    </div>
                    {formData.imagePreview && (
                      <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <img src={formData.imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isCropping && (
              <div className="admin-modal-footer">
                <button className="admin-action-btn close" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button
                  className="admin-action-btn save"
                  onClick={handleSubmit}
                  disabled={actionLoading}
                >
                  <Save size={16} />
                  {actionLoading ? 'Đang lưu...' : 'Lưu Slider'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      {/* Status Modal */}
      {statusModal.open && ReactDOM.createPortal(
        <div className="admin-modal-overlay" onClick={() => setStatusModal(prev => ({ ...prev, open: false }))}>
          <div className="admin-detail-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-body" style={{ padding: '2rem 1rem' }}>
              <div style={{ marginBottom: '1rem', color: statusModal.type === 'success' ? '#4caf50' : '#f44336' }}>
                {statusModal.type === 'success' ? <CheckCircle size={48} /> : <XCircle size={48} />}
              </div>
              <h3 style={{ marginBottom: '0.5rem', color: '#fff' }}>
                {statusModal.type === 'success' ? 'Thành công' : 'Thất bại'}
              </h3>
              <p style={{ color: '#aaa' }}>{statusModal.message}</p>
            </div>
            <div className="admin-modal-footer" style={{ justifyContent: 'center' }}>
              <button 
                className="admin-action-btn" 
                style={{ background: '#333', color: '#fff' }}
                onClick={() => setStatusModal(prev => ({ ...prev, open: false }))}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ReactDOM.createPortal(
        <div className="slider-delete-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="slider-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="slider-delete-header">
              <div className="slider-delete-icon-wrapper">
                <AlertTriangle size={24} />
              </div>
              <h3 className="slider-delete-title">Xác nhận xóa</h3>
            </div>
            <div className="slider-delete-body">
              <p>Bạn có chắc chắn muốn xóa slider này không?</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>Hành động này không thể hoàn tác.</p>
            </div>
            <div className="slider-delete-footer">
              <button 
                className="slider-delete-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                className="slider-delete-btn-confirm"
                onClick={confirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xóa...' : 'Xóa ngay'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SliderManagementTab;
