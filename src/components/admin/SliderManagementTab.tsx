import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Image, Plus, Edit, Trash2, CheckCircle, XCircle, RefreshCw, X, Save,
  Move, ToggleLeft, ToggleRight, Crop as CropIcon, AlertTriangle
} from 'lucide-react';
import sliderService from '../../services/sliderService';
import { Slider } from '../../data/sliderDTOs';
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
    isLogin: false,
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
      isLogin: false,
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
      isLogin: slider.isLogin,
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
      data.append('isLogin', formData.isLogin.toString());
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
                <th className="slider-col-order">Thứ tự</th>
                <th className="slider-col-image">Hình ảnh</th>
                <th className="slider-col-info">Tiêu đề / Mô tả</th>
                <th className="slider-col-status">Trạng thái</th>
                <th className="slider-col-date">Ngày tạo</th>
                <th className="slider-col-action">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sliders.map((slider) => (
                <tr key={slider.id}>
                  <td className="slider-cell-center">
                    <span className="slider-order-text">#{slider.displayOrder}</span>
                  </td>
                  <td>
                    <div className="admin-user-avatar slider-image-container">
                      <img src={slider.imageUrl} alt={slider.title} className="slider-image" />
                    </div>
                  </td>
                  <td>
                    <div className="slider-info-container">
                      <span className="admin-user-name">{slider.title}</span>
                      <span className="slider-desc-text">{slider.description}</span>
                    </div>
                  </td>
                  <td className="slider-cell-center">
                    <div className="slider-status-container">
                      <span 
                        className={`slider-badge-common ${slider.isLogin ? 'slider-badge-login' : 'slider-badge-public'}`}
                      >
                        {slider.isLogin ? 'Đăng nhập' : 'Công khai'}
                      </span>
                      
                      <button 
                        onClick={() => handleToggleStatus(slider)}
                        className={`slider-btn-status admin-status-badge ${slider.isActive ? 'active' : 'inactive'}`}
                      >
                        {slider.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {slider.isActive ? 'Hiển thị' : 'Ẩn'}
                      </button>
                    </div>
                  </td>
                  <td className="slider-cell-center">
                    <div className="admin-date-cell center">
                      {new Date(slider.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="slider-cell-center">
                    <div className="admin-action-buttons center">
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
                  <td colSpan={6} className="slider-empty-table-cell">Chưa có slider nào. Hãy tạo mới!</td>
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
                <div className="slider-cropper-container">
                  <div className="slider-cropper-wrapper">
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
                  <div className="slider-zoom-control">
                    <span className="slider-zoom-label">Zoom:</span>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="slider-zoom-slider"
                    />
                  </div>
                  <div className="slider-crop-actions">
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
                      className="slider-textarea"
                    />
                  </div>

                  <div className="admin-form-group slider-form-grid-2">
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

                  <div className="admin-form-group">
                    <label className="slider-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isLogin}
                        onChange={(e) => setFormData({ ...formData, isLogin: e.target.checked })}
                        className="slider-checkbox-input"
                      />
                      Yêu cầu đăng nhập (Chỉ hiển thị cho user đã đăng nhập)
                    </label>
                  </div>

                  {isEditing && (
                    <div className="admin-form-group">
                      <label className="slider-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="slider-checkbox-input"
                        />
                        Hiển thị slider này
                      </label>
                    </div>
                  )}

                  <div className="admin-form-group">
                    <label>Hình ảnh (1920x800 recommended)</label>
                    <div className="slider-file-input-wrapper">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="slider-file-input"
                      />
                    </div>
                    {formData.imagePreview && (
                      <div className="slider-image-preview-container">
                        <img src={formData.imagePreview} alt="Preview" className="slider-image-preview" />
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
          <div className="admin-detail-modal slider-status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-body slider-status-body">
              <div className={`slider-status-icon ${statusModal.type}`}>
                {statusModal.type === 'success' ? <CheckCircle size={48} /> : <XCircle size={48} />}
              </div>
              <h3 className="slider-status-title">
                {statusModal.type === 'success' ? 'Thành công' : 'Thất bại'}
              </h3>
              <p className="slider-status-message">{statusModal.message}</p>
            </div>
            <div className="admin-modal-footer slider-status-footer">
              <button 
                className="admin-action-btn slider-status-close-btn" 
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
              <p className="slider-delete-warning">Hành động này không thể hoàn tác.</p>
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
