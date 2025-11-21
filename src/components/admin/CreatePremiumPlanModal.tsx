import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import * as adminPremiumService from '../../services/adminPremiumService';
import { 
  AdminPremiumPlan, 
  CreatePremiumPlanRequest, 
  UpdatePremiumPlanRequest,
  FeatureLimitConfig,
  FeatureType,
  ResetPeriod
} from '../../services/adminPremiumService';
import './CreatePremiumPlanModal.css';

interface CreatePremiumPlanModalProps {
  editingPlan: AdminPremiumPlan | null;
  onClose: (shouldRefresh?: boolean) => void;
}

const CreatePremiumPlanModal: React.FC<CreatePremiumPlanModalProps> = ({ editingPlan, onClose }) => {
  const isEditMode = !!editingPlan;
  const isFreeTier = editingPlan?.isFreeTier || false;

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
  const [featureLimits, setFeatureLimits] = useState<FeatureLimitConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load editing plan data
  useEffect(() => {
    if (editingPlan) {
      console.log('📝 Loading editing plan:', editingPlan);
      console.log('📊 Feature Limits from API:', editingPlan.featureLimits);
      
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
      
      // Load feature limits
      if (editingPlan.featureLimits && editingPlan.featureLimits.length > 0) {
        const mappedLimits = editingPlan.featureLimits.map(fl => ({
          featureType: fl.featureType,
          limitValue: fl.limitValue,
          resetPeriod: fl.resetPeriod,
          isUnlimited: fl.isUnlimited,
          bonusMultiplier: fl.bonusMultiplier,
          description: fl.description || '',
          isActive: fl.isActive,
        }));
        console.log('✅ Mapped feature limits:', mappedLimits);
        setFeatureLimits(mappedLimits);
      } else {
        console.warn('⚠️ No feature limits found in editingPlan');
        setFeatureLimits([]);
      }
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

  // Feature Limits handlers
  const addFeatureLimit = () => {
    setFeatureLimits([...featureLimits, {
      featureType: 'AI_CHATBOT_REQUESTS',
      limitValue: 10,
      resetPeriod: 'DAILY',
      isUnlimited: false,
      isActive: true,
    }]);
  };

  const updateFeatureLimit = (index: number, updates: Partial<FeatureLimitConfig>) => {
    const newLimits = [...featureLimits];
    newLimits[index] = { ...newLimits[index], ...updates };
    
    // Auto-adjust based on feature type
    if (updates.featureType) {
      if (adminPremiumService.isMultiplierFeature(updates.featureType)) {
        newLimits[index].limitValue = null;
        newLimits[index].bonusMultiplier = newLimits[index].bonusMultiplier || 1.0;
      } else {
        newLimits[index].bonusMultiplier = undefined;
        if (newLimits[index].limitValue === null && !newLimits[index].isUnlimited) {
          newLimits[index].limitValue = 10;
        }
      }
    }
    
    // Clear limitValue if unlimited
    if (updates.isUnlimited === true) {
      newLimits[index].limitValue = null;
    }
    
    setFeatureLimits(newLimits);
  };

  const removeFeatureLimit = (index: number) => {
    setFeatureLimits(featureLimits.filter((_, i) => i !== index));
  };

  const validateForm = (): string | null => {
    // For FREE_TIER editing, skip core field validation (only limits can be edited)
    if (isFreeTier && isEditMode) {
      console.log('✅ Skipping core field validation for FREE_TIER edit');
      return null;
    }

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
        // For FREE_TIER: Only send feature limits (backend will reject core property updates)
        const updateData: UpdatePremiumPlanRequest = isFreeTier ? {
          // Send original values for required fields (backend will ignore them for FREE_TIER)
          displayName: editingPlan.displayName,
          description: editingPlan.description,
          durationMonths: editingPlan.durationMonths,
          price: editingPlan.price,
          studentDiscountPercent: editingPlan.studentDiscountPercent,
          features: JSON.stringify(editingPlan.features), // Convert array to JSON string
          maxSubscribers: editingPlan.maxSubscribers,
          isActive: editingPlan.isActive,
          featureLimits: featureLimits.length > 0 ? featureLimits : undefined,
        } : {
          // For other plans: Send all updated fields
          displayName: formData.displayName,
          description: formData.description,
          durationMonths: formData.durationMonths,
          price: formData.price,
          studentDiscountPercent: formData.studentDiscountPercent,
          features: featuresJson,
          maxSubscribers: formData.maxSubscribers,
          isActive: formData.isActive,
          featureLimits: featureLimits.length > 0 ? featureLimits : undefined,
        };
        
        console.log('🚀 Submitting update for plan:', editingPlan.id, isFreeTier ? '(FREE_TIER)' : '');
        console.log('📊 Feature Limits being sent:', updateData.featureLimits);
        console.log('📦 Full update data:', updateData);
        
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
          featureLimits: featureLimits.length > 0 ? featureLimits : undefined,
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
    <div className="premium-plan-modal-overlay" onClick={() => onClose()}>
      <div className="premium-plan-modal-content premium-plan-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="premium-plan-modal-header">
          <h2>
            {isEditMode ? (isFreeTier ? 'Chỉnh Sửa Giới Hạn FREE_TIER' : 'Chỉnh Sửa Gói Premium') : 'Tạo Gói Premium Mới'}
          </h2>
          <button className="premium-plan-modal-btn-close" onClick={() => onClose()}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="premium-plan-modal-body">
          {error && (
            <div className="premium-plan-modal-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {isFreeTier && (
            <div className="premium-plan-modal-error" style={{background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#3b82f6'}}>
              <AlertCircle size={20} />
              <span>⚠️ Gói FREE_TIER: Chỉ có thể chỉnh sửa giới hạn tính năng. Các thuộc tính khác không thể thay đổi.</span>
            </div>
          )}

          <div className="premium-plan-modal-form-grid">
            {/* Plan Name (only for create) */}
            {!isEditMode && (
              <div className="premium-plan-modal-form-group full-width">
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
            <div className="premium-plan-modal-form-group full-width">
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
                disabled={isFreeTier}
              />
            </div>

            {/* Description */}
            <div className="premium-plan-modal-form-group full-width">
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
                disabled={isFreeTier}
              />
            </div>

            {/* Plan Type (only for create) */}
            {!isEditMode && (
              <div className="premium-plan-modal-form-group">
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
            <div className="premium-plan-modal-form-group">
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
                disabled={isFreeTier}
              />
            </div>

            {/* Price */}
            <div className="premium-plan-modal-form-group">
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
                disabled={isFreeTier}
              />
            </div>

            {/* Student Discount */}
            <div className="premium-plan-modal-form-group">
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
                disabled={isFreeTier}
              />
            </div>

            {/* Max Subscribers */}
            <div className="premium-plan-modal-form-group">
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

            {/* Features - Hide for FREE_TIER */}
            {!isFreeTier && (
            <div className="premium-plan-modal-form-group full-width">
              <label>
                Tính Năng <span className="required">*</span>
              </label>
              <div className="premium-plan-modal-features-list">
                {features.map((feature, index) => (
                  <div key={index} className="premium-plan-modal-feature-item">
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
                        className="premium-plan-modal-btn-remove-feature"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="premium-plan-modal-btn-add"
                >
                  <Plus size={16} />
                  Thêm Tính Năng
                </button>
              </div>
            </div>
            )}

            {/* Feature Limits */}
            <div className="premium-plan-modal-form-group full-width">
              <div className="premium-modal-section-header">
                <label>Giới Hạn Tính Năng (Feature Limits)</label>
                <button
                  type="button"
                  onClick={addFeatureLimit}
                  className="premium-plan-modal-btn-add"
                >
                  <Plus size={16} />
                  Thêm Giới Hạn
                </button>
              </div>
              
              {featureLimits.length > 0 ? (
                <div className="premium-modal-feature-limits-list">
                  {featureLimits.map((limit, index) => (
                    <div key={index} className="premium-modal-limit-item">
                      {/* Feature Type */}
                      <div className="premium-modal-limit-field">
                        <label>Loại Tính Năng</label>
                        <select
                          value={limit.featureType}
                          onChange={(e) => updateFeatureLimit(index, { 
                            featureType: e.target.value as FeatureType 
                          })}
                        >
                          <option value="AI_CHATBOT_REQUESTS">AI Chatbot Requests</option>
                          <option value="AI_ROADMAP_GENERATION">AI Roadmap Generation</option>
                          <option value="MENTOR_BOOKING_MONTHLY">Mentor Booking (Monthly)</option>
                          <option value="COIN_EARNING_MULTIPLIER">Coin Earning Multiplier</option>
                          <option value="PRIORITY_SUPPORT">Priority Support</option>
                        </select>
                      </div>

                      {/* Limit Value or Multiplier */}
                      {adminPremiumService.isMultiplierFeature(limit.featureType) ? (
                        <div className="premium-modal-limit-field">
                          <label>Hệ Số Nhân</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={limit.bonusMultiplier || 1.0}
                            onChange={(e) => updateFeatureLimit(index, { 
                              bonusMultiplier: parseFloat(e.target.value) || 1.0
                            })}
                            placeholder="1.0"
                          />
                        </div>
                      ) : (
                        <div className="premium-modal-limit-field">
                          <label>Giới Hạn</label>
                          <input
                            type="number"
                            min="0"
                            value={limit.limitValue || 0}
                            onChange={(e) => updateFeatureLimit(index, { 
                              limitValue: parseInt(e.target.value) || 0
                            })}
                            placeholder="Số lượng"
                            disabled={limit.isUnlimited}
                          />
                        </div>
                      )}

                      {/* Reset Period */}
                      <div className="premium-modal-limit-field">
                        <label>Chu Kỳ Reset</label>
                        <select
                          value={limit.resetPeriod}
                          onChange={(e) => updateFeatureLimit(index, { 
                            resetPeriod: e.target.value as ResetPeriod
                          })}
                        >
                          <option value="HOURLY">Mỗi giờ</option>
                          <option value="DAILY">Mỗi ngày</option>
                          <option value="MONTHLY">Mỗi tháng</option>
                          <option value="CUSTOM_8_HOURS">Mỗi 8 giờ</option>
                          <option value="NEVER">Không reset</option>
                        </select>
                      </div>

                      {/* Unlimited Checkbox */}
                      {!adminPremiumService.isMultiplierFeature(limit.featureType) && (
                        <div className="premium-modal-limit-field checkbox-field">
                          <label className="premium-plan-modal-checkbox">
                            <input
                              type="checkbox"
                              checked={limit.isUnlimited}
                              onChange={(e) => updateFeatureLimit(index, { 
                                isUnlimited: e.target.checked
                              })}
                            />
                            <span>Không giới hạn</span>
                          </label>
                        </div>
                      )}

                      {/* Description */}
                      <div className="premium-modal-limit-field full-width">
                        <label>Mô Tả</label>
                        <input
                          type="text"
                          value={limit.description || ''}
                          onChange={(e) => updateFeatureLimit(index, { 
                            description: e.target.value
                          })}
                          placeholder="Mô tả giới hạn..."
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFeatureLimit(index)}
                        className="premium-modal-btn-remove-limit"
                        title="Xóa giới hạn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="premium-modal-no-limits">
                  Chưa có giới hạn tính năng. Nhấn "Thêm Giới Hạn" để thêm.
                </p>
              )}
            </div>

            {/* Is Active - Hide for FREE_TIER */}
            {!isFreeTier && (
            <div className="premium-plan-modal-form-group full-width">
              <label className="premium-plan-modal-checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                />
                <span>Kích hoạt gói ngay sau khi tạo</span>
              </label>
            </div>
            )}
          </div>

          {/* Footer */}
          <div className="premium-plan-modal-footer">
            <button
              type="button"
              onClick={() => onClose()}
              className="premium-plan-modal-btn-secondary"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="premium-plan-modal-btn-primary"
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
