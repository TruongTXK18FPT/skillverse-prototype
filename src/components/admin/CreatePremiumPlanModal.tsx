import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Plus, Trash2, AlertCircle } from "lucide-react";
import * as adminPremiumService from "../../services/adminPremiumService";
import { showAppSuccess } from "../../context/ToastContext";
import {
  AdminPremiumPlan,
  CreatePremiumPlanRequest,
  UpdatePremiumPlanRequest,
  FeatureLimitConfig,
  FeatureType,
  ResetPeriod,
} from "../../services/adminPremiumService";
import "./CreatePremiumPlanModal.css";

interface CreatePremiumPlanModalProps {
  editingPlan: AdminPremiumPlan | null;
  onClose: (shouldRefresh?: boolean) => void;
}

const CreatePremiumPlanModal: React.FC<CreatePremiumPlanModalProps> = ({
  editingPlan,
  onClose,
}) => {
  const isEditMode = !!editingPlan;
  const isFreeTier = editingPlan?.isFreeTier || false;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    durationMonths: 1,
    price: 0,
    planType: "PREMIUM_BASIC" as
      | "PREMIUM_BASIC"
      | "PREMIUM_PLUS"
      | "STUDENT_PACK"
      | "RECRUITER_PRO",
    targetRole: "LEARNER" as "LEARNER" | "RECRUITER",
    discountPercent: 0,
    isActive: true,
  });

  const [features, setFeatures] = useState<string[]>([""]);
  const [featureLimits, setFeatureLimits] = useState<FeatureLimitConfig[]>([]);
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
        targetRole:
          editingPlan.targetRole === "RECRUITER" ? "RECRUITER" : "LEARNER",
        discountPercent:
          editingPlan.discountPercent ?? editingPlan.studentDiscountPercent,
        isActive: editingPlan.isActive,
      });
      setFeatures(
        editingPlan.features.length > 0 ? editingPlan.features : [""],
      );

      // Load feature limits
      if (editingPlan.featureLimits && editingPlan.featureLimits.length > 0) {
        const mappedLimits = editingPlan.featureLimits.map((fl) => ({
          featureType: fl.featureType,
          limitValue: fl.limitValue,
          resetPeriod: fl.resetPeriod,
          isUnlimited: fl.isUnlimited,
          bonusMultiplier: fl.bonusMultiplier,
          description: fl.description || "",
          isActive: fl.isActive,
        }));
        setFeatureLimits(mappedLimits);
      } else {
        console.warn("⚠️ No feature limits found in editingPlan");
        setFeatureLimits([]);
      }
    }
  }, [editingPlan]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" ? (value === "" ? 0 : parseFloat(value)) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
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
    setFeatures([...features, ""]);
  };

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  // Feature Limits handlers
  const addFeatureLimit = () => {
    setFeatureLimits([
      ...featureLimits,
      {
        featureType: "AI_CHATBOT_REQUESTS",
        limitValue: 10,
        resetPeriod: "DAILY",
        isUnlimited: false,
        isActive: true,
      },
    ]);
  };

  const updateFeatureLimit = (
    index: number,
    updates: Partial<FeatureLimitConfig>,
  ) => {
    const newLimits = [...featureLimits];
    newLimits[index] = { ...newLimits[index], ...updates };

    // Auto-adjust based on feature type
    if (updates.featureType) {
      if (adminPremiumService.isMultiplierFeature(updates.featureType)) {
        newLimits[index].limitValue = null;
        newLimits[index].bonusMultiplier =
          newLimits[index].bonusMultiplier || 1.0;
      } else {
        newLimits[index].bonusMultiplier = undefined;
        if (
          newLimits[index].limitValue === null &&
          !newLimits[index].isUnlimited
        ) {
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
      return null;
    }

    if (!isEditMode && !formData.name.trim()) {
      return "Tên gói không được để trống";
    }

    if (!isEditMode && !adminPremiumService.validatePlanName(formData.name)) {
      return "Tên gói chỉ được chứa chữ thường, số, gạch ngang và gạch dưới";
    }

    if (!formData.displayName.trim()) {
      return "Tên hiển thị không được để trống";
    }

    if (!formData.description.trim()) {
      return "Mô tả không được để trống";
    }

    if (formData.durationMonths < 1 || formData.durationMonths > 12) {
      return "Thời hạn phải từ 1-12 tháng";
    }

    if (formData.price < 1000) {
      return "Giá phải từ 1,000 VND trở lên";
    }

    if (
      formData.discountPercent < 0 ||
      formData.discountPercent > 100
    ) {
      return "Giảm giá theo role phải từ 0-100%";
    }

    const validFeatures = features.filter((f) => f.trim());
    if (validFeatures.length === 0) {
      return "Phải có ít nhất 1 tính năng";
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
      const validFeatures = features.filter((f) => f.trim());
      const featuresJson = adminPremiumService.stringifyFeatures(validFeatures);

      if (isEditMode && editingPlan) {
        // For FREE_TIER: Only send feature limits (backend will reject core property updates)
        const updateData: UpdatePremiumPlanRequest = isFreeTier
          ? {
              // Send original values for required fields (backend will ignore them for FREE_TIER)
              displayName: editingPlan.displayName,
              description: editingPlan.description,
              durationMonths: editingPlan.durationMonths,
              price: editingPlan.price,
              discountPercent:
                editingPlan.discountPercent ?? editingPlan.studentDiscountPercent,
              studentDiscountPercent:
                editingPlan.discountPercent ?? editingPlan.studentDiscountPercent,
              features: JSON.stringify(editingPlan.features), // Convert array to JSON string
              isActive: editingPlan.isActive,
              targetRole: editingPlan.targetRole as any,
              featureLimits:
                featureLimits.length > 0 ? featureLimits : undefined,
            }
          : {
              // For other plans: Send all updated fields
              displayName: formData.displayName,
              description: formData.description,
              durationMonths: formData.durationMonths,
              price: formData.price,
              discountPercent: formData.discountPercent,
              studentDiscountPercent: formData.discountPercent,
              features: featuresJson,
              isActive: formData.isActive,
              targetRole: formData.targetRole,
              featureLimits:
                featureLimits.length > 0 ? featureLimits : undefined,
        };

        await adminPremiumService.updatePlan(editingPlan.id, updateData);
        showAppSuccess("Cập nhật thành công", "Gói premium đã được cập nhật.");
      } else {
        // Create new plan
        const createData: CreatePremiumPlanRequest = {
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          durationMonths: formData.durationMonths,
          price: formData.price,
          discountPercent: formData.discountPercent,
          planType: formData.planType,
          targetRole: formData.targetRole,
          studentDiscountPercent: formData.discountPercent,
          features: featuresJson,
          isActive: formData.isActive,
          featureLimits: featureLimits.length > 0 ? featureLimits : undefined,
        };
        await adminPremiumService.createPlan(createData);
        showAppSuccess("Tạo thành công", "Gói premium mới đã được tạo.");
      }

      onClose(true); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="admin-modal-overlay" onClick={() => onClose()}>
      <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <h3>
            {isEditMode
              ? isFreeTier
                ? "Chỉnh Sửa Giới Hạn FREE_TIER"
                : "Chỉnh Sửa Gói Premium"
              : "Tạo Gói Premium Mới"}
          </h3>
          <button className="admin-close-btn" onClick={() => onClose()}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-modal-body">
          {error && (
            <div className="admin-form-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {isFreeTier && (
            <div className="admin-form-info">
              <AlertCircle size={18} />
              <span>
                Gói FREE_TIER: Chỉ có thể chỉnh sửa giới hạn tính năng. Các
                thuộc tính khác không thể thay đổi.
              </span>
            </div>
          )}

          <div className="admin-form-grid">
            {/* Plan Name (only for create) */}
            {!isEditMode && (
              <div className="admin-form-group full-width">
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
                <small>
                  Chỉ chữ thường, số, gạch ngang và gạch dưới (không thể thay
                  đổi sau khi tạo)
                </small>
              </div>
            )}

            {/* Display Name */}
            <div className="admin-form-group full-width">
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
            <div className="admin-form-group full-width">
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
              <div className="admin-form-group">
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
                  <option value="RECRUITER_PRO">Gói Nhà Tuyển Dụng</option>
                </select>
              </div>
            )}

            {/* Target Role */}
            {!isFreeTier && (
              <div className="admin-form-group">
                <label htmlFor="targetRole">
                  Dành Cho
                </label>
                <select
                  id="targetRole"
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleInputChange}
                >
                  <option value="LEARNER">Học viên / Người dùng</option>
                  <option value="RECRUITER">Nhà tuyển dụng</option>
                </select>
                <small>Role sẽ hiển thị gói này cho đúng nhóm người dùng</small>
              </div>
            )}

            {/* Duration */}
            <div className="admin-form-group">
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
            <div className="admin-form-group">
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

            {/* Role Discount */}
            <div className="admin-form-group">
              <label htmlFor="discountPercent">
                Giảm Giá Theo Role (%) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="discountPercent"
                name="discountPercent"
                value={formData.discountPercent}
                onChange={handleInputChange}
                min="0"
                max="100"
                required
                disabled={isFreeTier}
              />
              <small>Áp dụng cho nhóm người dùng mà gói này đang nhắm tới</small>
            </div>

            {/* Features */}
            {!isFreeTier && (
              <div className="admin-form-group full-width">
                <label>
                  Tính Năng <span className="required">*</span>
                </label>
                <div className="admin-features-list">
                  {features.map((feature, index) => (
                    <div key={index} className="admin-feature-input">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) =>
                          handleFeatureChange(index, e.target.value)
                        }
                        placeholder={`Tính năng ${index + 1}`}
                      />
                      {features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="admin-action-btn delete"
                          title="Xóa tính năng"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="admin-btn-add-item"
                  >
                    <Plus size={16} />
                    Thêm Tính Năng
                  </button>
                </div>
              </div>
            )}

            {/* Feature Limits */}
            <div className="admin-form-group full-width">
              <div className="admin-section-header">
                <label>Giới Hạn Tính Năng</label>
                <button
                  type="button"
                  onClick={addFeatureLimit}
                  className="admin-btn-add-item"
                >
                  <Plus size={14} />
                  Thêm
                </button>
              </div>

              {featureLimits.length > 0 ? (
                <div className="admin-feature-limits-list">
                  {featureLimits.map((limit, index) => (
                    <div key={index} className="admin-limit-item">
                      <div className="admin-limit-field">
                        <label>Loại Tính Năng</label>
                        <select
                          value={limit.featureType}
                          onChange={(e) =>
                            updateFeatureLimit(index, {
                              featureType: e.target.value as FeatureType,
                            })
                          }
                        >
                          <optgroup label="Học viên / Chung">
                            <option value="AI_CHATBOT_REQUESTS">
                              AI Chatbot Requests
                            </option>
                            <option value="AI_ROADMAP_GENERATION">
                              AI Roadmap Generation
                            </option>
                            <option value="MENTOR_BOOKING_MONTHLY">
                              Mentor Booking
                            </option>
                            <option value="COIN_EARNING_MULTIPLIER">
                              Coin Multiplier
                            </option>
                            <option value="PRIORITY_SUPPORT">
                              Priority Support
                            </option>
                          </optgroup>
                          <optgroup label="Nhà tuyển dụng">
                            <option value="JOB_POSTING_MONTHLY">
                              Số tin tuyển dụng/tháng
                            </option>
                            <option value="SHORT_TERM_JOB_POSTING">
                              Số tin việc ngắn hạn
                            </option>
                            <option value="JOB_BOOST_MONTHLY">
                              Đẩy tin/tháng
                            </option>
                            <option value="HIGHLIGHT_JOB_POST">
                              Highlight bài đăng
                            </option>
                            <option value="AI_CANDIDATE_SUGGESTION">
                              AI gợi ý ứng viên
                            </option>
                            <option value="COMPANY_PROFILE_PREMIUM">
                              Hồ sơ công ty nâng cao
                            </option>
                            <option value="ANALYTICS_DASHBOARD">
                              Bảng phân tích
                            </option>
                            <option value="CANDIDATE_DATABASE_ACCESS">
                              CSDL ứng viên
                            </option>
                            <option value="AUTOMATED_OUTREACH">
                              Liên hệ tự động
                            </option>
                            <option value="API_ACCESS">API Access</option>
                            <option value="RECRUITER_PRIORITY_SUPPORT">
                              Hỗ trợ ưu tiên (Recruiter)
                            </option>
                          </optgroup>
                        </select>
                      </div>

                      {adminPremiumService.isMultiplierFeature(
                        limit.featureType,
                      ) ? (
                        <div className="admin-limit-field">
                          <label>Hệ Số Nhân</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={limit.bonusMultiplier || 1.0}
                            onChange={(e) =>
                              updateFeatureLimit(index, {
                                bonusMultiplier:
                                  parseFloat(e.target.value) || 1.0,
                              })
                            }
                            placeholder="1.0"
                          />
                        </div>
                      ) : (
                        <div className="admin-limit-field">
                          <label>Giới Hạn</label>
                          <input
                            type="number"
                            min="0"
                            value={limit.limitValue || 0}
                            onChange={(e) =>
                              updateFeatureLimit(index, {
                                limitValue: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="Số lượng"
                            disabled={limit.isUnlimited}
                          />
                        </div>
                      )}

                      <div className="admin-limit-field">
                        <label>Reset</label>
                        <select
                          value={limit.resetPeriod}
                          onChange={(e) =>
                            updateFeatureLimit(index, {
                              resetPeriod: e.target.value as ResetPeriod,
                            })
                          }
                        >
                          <option value="HOURLY">Mỗi giờ</option>
                          <option value="DAILY">Mỗi ngày</option>
                          <option value="MONTHLY">Mỗi tháng</option>
                          <option value="CUSTOM_8_HOURS">8 giờ</option>
                          <option value="NEVER">Không reset</option>
                        </select>
                      </div>

                      {!adminPremiumService.isMultiplierFeature(
                        limit.featureType,
                      ) && (
                        <div className="admin-limit-field checkbox-field">
                          <label>
                            <input
                              type="checkbox"
                              checked={limit.isUnlimited}
                              onChange={(e) =>
                                updateFeatureLimit(index, {
                                  isUnlimited: e.target.checked,
                                })
                              }
                            />
                            <span>Không giới hạn</span>
                          </label>
                        </div>
                      )}

                      <div className="admin-limit-field full-width">
                        <label>Mô Tả</label>
                        <input
                          type="text"
                          value={limit.description || ""}
                          onChange={(e) =>
                            updateFeatureLimit(index, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Mô tả giới hạn..."
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFeatureLimit(index)}
                        className="admin-action-btn delete"
                        title="Xóa giới hạn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-empty-hint">
                  Chưa có giới hạn tính năng. Nhấn "Thêm" để thêm.
                </p>
              )}
            </div>

            {/* Is Active */}
            {!isFreeTier && (
              <div className="admin-form-group full-width">
                <label>
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
          <div className="admin-modal-footer">
            <button
              type="button"
              onClick={() => onClose()}
              className="admin-action-btn close"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="admin-action-btn save"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : isEditMode ? "Cập Nhật" : "Tạo Gói"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default CreatePremiumPlanModal;
