import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import * as adminPremiumService from '../../services/adminPremiumService';
import { AdminPremiumPlan, CreatePremiumPlanRequest, UpdatePremiumPlanRequest } from '../../services/adminPremiumService';
import './CreatePremiumPlanModal.css';

interface CreatePremiumPlanModalProps {
  editingPlan: AdminPremiumPlan | null;
  onClose: (shouldRefresh?: boolean) => void;
}

const CreatePremiumPlanModal: React.FC<CreatePremiumPlanModalProps> = ({ editingPlan, onClose }) => {
  const isEditMode = !!editingPlan;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    durationMonths: 1,
    price: 0,
    planType: 'PREMIUM_BASIC' as 'PREMIUM_BASIC' | 'PREMIUM_PLUS' | 'STUDENT_PACK',
    studentDiscountPercent: 0,
    maxSubscribers: null as number | null,
    isActive: true,
  });

  const [features, setFeatures] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load editing plan data
  useEffect(() => {
    if (editingPlan) {
      setFormData({
        name: editingPlan.name,
        displayName: editingPlan.displayName,
        description: editingPlan.description,
        durationMonths: editingPlan.durationMonths,
        price: editingPlan.price,
        planType: editingPlan.planType as any,
        studentDiscountPercent: editingPlan.studentDiscountPercent,
        maxSubscribers: editingPlan.maxSubscribers,
        isActive: editingPlan.isActive,
      });
      setFeatures(editingPlan.features.length > 0 ? editingPlan.features : ['']);
    }
  }, [editingPlan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.checked,
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  const validateForm = (): string | null => {
    if (!isEditMode && !formData.name.trim()) {
      return 'Tên gói không được để trống';
    }

    if (!isEditMode && !adminPremiumService.validatePlanName(formData.name)) {
      return 'Tên gói chỉ được chứa chữ thường, số, gạch ngang và gạch dưới';
    }

    if (!formData.displayName.trim()) {
      return 'Tên hiển thị không được để trống';
    }

    if (!formData.description.trim()) {
      return 'Mô tả không được để trống';
    }

    if (formData.durationMonths < 1 || formData.durationMonths > 12) {
      return 'Thời hạn phải từ 1-12 tháng';
    }

    if (formData.price < 1000) {
      return 'Giá phải từ 1,000 VND trở lên';
    }

    if (formData.studentDiscountPercent < 0 || formData.studentDiscountPercent > 100) {
      return 'Giảm giá sinh viên phải từ 0-100%';
    }

    const validFeatures = features.filter(f => f.trim());
    if (validFeatures.length === 0) {
      return 'Phải có ít nhất 1 tính năng';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validFeatures = features.filter(f => f.trim());
      const featuresJson = adminPremiumService.stringifyFeatures(validFeatures);

      if (isEditMode && editingPlan) {
        // Update existing plan
        const updateData: UpdatePremiumPlanRequest = {
          displayName: formData.displayName,
          description: formData.description,
          durationMonths: formData.durationMonths,
          price: formData.price,
          studentDiscountPercent: formData.studentDiscountPercent,
          features: featuresJson,
          maxSubscribers: formData.maxSubscribers,
          isActive: formData.isActive,
        };
        await adminPremiumService.updatePlan(editingPlan.id, updateData);
        alert('✅ Cập nhật gói premium thành công!');
      } else {
        // Create new plan
        const createData: CreatePremiumPlanRequest = {
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          durationMonths: formData.durationMonths,
          price: formData.price,
          planType: formData.planType,
          studentDiscountPercent: formData.studentDiscountPercent,
          features: featuresJson,
          maxSubscribers: formData.maxSubscribers,
          isActive: formData.isActive,
        };
        await adminPremiumService.createPlan(createData);
        alert('✅ Tạo gói premium thành công!');
      }

      onClose(true); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose()}>
      <div className="modal-content create-plan-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{isEditMode ? 'Chỉnh Sửa Gói Premium' : 'Tạo Gói Premium Mới'}</h2>
          <button className="btn-close" onClick={() => onClose()}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-grid">
            {/* Plan Name (only for create) */}
            {!isEditMode && (
              <div className="form-group full-width">
                <label htmlFor="name">
                  Tên Gói <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="premium_advanced"
                  required
                  pattern="[a-z0-9_-]+"
                  title="Chỉ chữ thường, số, gạch ngang và gạch dưới"
                />
                <small>Chỉ chữ thường, số, gạch ngang và gạch dưới (không thể thay đổi sau khi tạo)</small>
              </div>
            )}

            {/* Display Name */}
            <div className="form-group full-width">
              <label htmlFor="displayName">
                Tên Hiển Thị <span className="required">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Premium Advanced"
                required
              />
            </div>

            {/* Description */}
            <div className="form-group full-width">
              <label htmlFor="description">
                Mô Tả <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả chi tiết về gói premium..."
                rows={3}
                required
              />
            </div>

            {/* Plan Type (only for create) */}
            {!isEditMode && (
              <div className="form-group">
                <label htmlFor="planType">
                  Loại Gói <span className="required">*</span>
                </label>
                <select
                  id="planType"
                  name="planType"
                  value={formData.planType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="PREMIUM_BASIC">Premium Cơ Bản</option>
                  <option value="PREMIUM_PLUS">Premium Plus</option>
                  <option value="STUDENT_PACK">Gói Sinh Viên</option>
                </select>
              </div>
            )}

            {/* Duration */}
            <div className="form-group">
              <label htmlFor="durationMonths">
                Thời Hạn (tháng) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="durationMonths"
                name="durationMonths"
                value={formData.durationMonths}
                onChange={handleInputChange}
                min="1"
                max="12"
                required
              />
            </div>

            {/* Price */}
            <div className="form-group">
              <label htmlFor="price">
                Giá (VND) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="1000"
                step="1000"
                required
              />
            </div>

            {/* Student Discount */}
            <div className="form-group">
              <label htmlFor="studentDiscountPercent">
                Giảm Giá SV (%) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="studentDiscountPercent"
                name="studentDiscountPercent"
                value={formData.studentDiscountPercent}
                onChange={handleInputChange}
                min="0"
                max="100"
                required
              />
            </div>

            {/* Max Subscribers */}
            <div className="form-group">
              <label htmlFor="maxSubscribers">
                Số Người Tối Đa
              </label>
              <input
                type="number"
                id="maxSubscribers"
                name="maxSubscribers"
                value={formData.maxSubscribers || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  maxSubscribers: e.target.value === '' ? null : parseInt(e.target.value)
                }))}
                min="1"
                placeholder="Không giới hạn"
              />
              <small>Để trống nếu không giới hạn</small>
            </div>

            {/* Features */}
            <div className="form-group full-width">
              <label>
                Tính Năng <span className="required">*</span>
              </label>
              <div className="features-list">
                {features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder={`Tính năng ${index + 1}`}
                    />
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="btn-remove-feature"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="btn-add-feature"
                >
                  <Plus size={16} />
                  Thêm Tính Năng
                </button>
              </div>
            </div>

            {/* Is Active */}
            <div className="form-group full-width">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                />
                <span>Kích hoạt gói ngay sau khi tạo</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={() => onClose()}
              className="btn-secondary"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : (isEditMode ? 'Cập Nhật' : 'Tạo Gói')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePremiumPlanModal;
