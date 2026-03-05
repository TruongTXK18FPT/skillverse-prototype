import React, { useState } from "react";
import { FiPlus, FiTrash2, FiSave, FiSend, FiX, FiZap, FiCode, FiDollarSign, FiMapPin, FiTag, FiCheckSquare } from "react-icons/fi";
import {
  CreateShortTermJobRequest,
  CreateMilestoneRequest,
  JobUrgency,
  PaymentMethod,
} from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import "./short-term-job-form.css";

// ==================== TYPES ====================

interface ShortTermJobFormProps {
  initialData?: Partial<CreateShortTermJobRequest>;
  onSubmit: (
    data: CreateShortTermJobRequest,
    publish: boolean,
  ) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

interface FormErrors {
  title?: string;
  description?: string;
  requirements?: string;
  budget?: string;
  deadline?: string;
  workDeadline?: string;
  requiredSkills?: string;
  subCategory?: string;
  estimatedDuration?: string;
  maxApplicants?: string;
}

// ==================== CONSTANTS ====================

const SUBCATEGORY_OPTIONS = [
  { value: "DESIGN", label: "Thiết kế" },
  { value: "DEVELOPMENT", label: "Lập trình" },
  { value: "WRITING", label: "Viết nội dung" },
  { value: "MARKETING", label: "Marketing" },
  { value: "VIDEO", label: "Video/Animation" },
  { value: "TRANSLATION", label: "Dịch thuật" },
  { value: "DATA_ENTRY", label: "Nhập liệu" },
  { value: "VIRTUAL_ASSISTANT", label: "Trợ lý ảo" },
  { value: "CONSULTING", label: "Tư vấn" },
  { value: "OTHER", label: "Khác" },
];

const URGENCY_OPTIONS = [
  {
    value: JobUrgency.NORMAL,
    label: "Bình thường",
    description: "Không gấp",
  },
  {
    value: JobUrgency.URGENT,
    label: "Gấp",
    description: "Cần trong vài ngày",
  },
  {
    value: JobUrgency.VERY_URGENT,
    label: "Rất gấp",
    description: "Cần trong 24-48h",
  },
  {
    value: JobUrgency.ASAP,
    label: "Cần ngay",
    description: "Làm ngay lập tức",
  },
];

const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "FIXED",
    label: "Trả một lần",
    description: "Thanh toán khi hoàn thành",
  },
  {
    value: "MILESTONE",
    label: "Theo cột mốc",
    description: "Chia theo giai đoạn",
  },
  {
    value: "HOURLY",
    label: "Theo giờ",
    description: "Tính theo thời gian làm",
  },
];

const SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "UI/UX Design",
  "Figma",
  "Adobe Photoshop",
  "Adobe Illustrator",
  "Content Writing",
  "SEO",
  "Social Media",
  "Video Editing",
  "Data Analysis",
  "Excel",
  "PowerPoint",
  "Translation",
];

// ==================== FORM COMPONENT ====================

export const ShortTermJobForm: React.FC<ShortTermJobFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = "create",
}) => {
  const { showError, showSuccess } = useToast();

  // Form state - using correct field names from CreateShortTermJobRequest
  const [formData, setFormData] = useState<CreateShortTermJobRequest>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    requirements: initialData?.requirements || "",
    budget: initialData?.budget || 0,
    deadline: initialData?.deadline || "",
    workDeadline: initialData?.workDeadline || "",
    requiredSkills: initialData?.requiredSkills || [],
    subCategory: initialData?.subCategory || "OTHER",
    urgency: initialData?.urgency || JobUrgency.NORMAL,
    isRemote: initialData?.isRemote ?? true,
    location: initialData?.location || "",
    estimatedDuration: initialData?.estimatedDuration || "",
    maxApplicants: initialData?.maxApplicants || 10,
    paymentMethod: initialData?.paymentMethod || "FIXED",
    allowsRevision: initialData?.allowsRevision ?? true,
    maxRevisions: initialData?.maxRevisions || 2,
    milestones: initialData?.milestones || [],
    deliverableTypes: initialData?.deliverableTypes || [],
    tags: initialData?.tags || [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [skillInput, setSkillInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  // ========== VALIDATION ==========
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề không được để trống";
    } else if (formData.title.length < 10) {
      newErrors.title = "Tiêu đề phải có ít nhất 10 ký tự";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả không được để trống";
    } else if (formData.description.length < 50) {
      newErrors.description = "Mô tả phải có ít nhất 50 ký tự";
    }

    if (formData.budget <= 0) {
      newErrors.budget = "Ngân sách phải lớn hơn 0";
    } else if (formData.budget < 100000) {
      newErrors.budget = "Ngân sách tối thiểu là 100,000 VND";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Hạn nhận đơn không được để trống";
    } else if (new Date(formData.deadline) <= new Date()) {
      newErrors.deadline = "Hạn nhận đơn phải sau thời điểm hiện tại";
    }

    if (formData.workDeadline) {
      if (new Date(formData.workDeadline) <= new Date(formData.deadline)) {
        newErrors.workDeadline = "Deadline hoàn thành phải sau hạn nhận đơn";
      }
    }

    if (formData.requiredSkills.length === 0) {
      newErrors.requiredSkills = "Phải chọn ít nhất 1 kỹ năng";
    }

    if (!formData.estimatedDuration.trim()) {
      newErrors.estimatedDuration = "Thời gian ước tính không được để trống";
    }

    if (
      formData.maxApplicants !== undefined &&
      (formData.maxApplicants < 1 || formData.maxApplicants > 100)
    ) {
      newErrors.maxApplicants = "Số ứng viên tối đa phải từ 1 đến 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== HANDLERS ==========
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleAddSkill = () => {
    if (
      skillInput.trim() &&
      !formData.requiredSkills.includes(skillInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()],
      }));
      setSkillInput("");
      if (errors.requiredSkills) {
        setErrors((prev) => ({ ...prev, requiredSkills: undefined }));
      }
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skill),
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  // Milestone handlers
  const handleAddMilestone = () => {
    const newMilestone: CreateMilestoneRequest = {
      title: "",
      description: "",
      deadline: "",
      amount: 0,
      order: formData.milestones?.length || 0,
    };
    setFormData((prev) => ({
      ...prev,
      milestones: [...(prev.milestones || []), newMilestone],
    }));
  };

  const handleUpdateMilestone = (
    index: number,
    field: keyof CreateMilestoneRequest,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones?.map((m, i) =>
        i === index ? { ...m, [field]: value } : m,
      ),
    }));
  };

  const handleRemoveMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones
        ?.filter((_, i) => i !== index)
        .map((m, i) => ({ ...m, order: i })),
    }));
  };

  const handleSubmit = async (publish: boolean) => {
    if (!validateForm()) {
      showError("Lỗi", "Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      await onSubmit(formData, publish);
      showSuccess(
        "Thành công",
        publish ? "Công việc đã được đăng" : "Công việc đã được lưu nháp",
      );
    } catch {
      showError("Lỗi", "Không thể lưu công việc");
    }
  };

  // ========== RENDER ==========
  return (
    <div className="stj-form">

      {/* ── Basic Info ─────────────────────────────────────── */}
      <div className="stj-form__section">
        <div className="stj-form__section-header">
          <h3 className="stj-form__section-title">
            <FiZap className="stj-form__icon" />
            Thông tin cơ bản
          </h3>
        </div>
        <div className="stj-form__section-body">

          {/* Title */}
          <div className="stj-form__field">
            <label className="stj-form__label stj-form__label--required">Tiêu đề công việc</label>
            <input
              className={`stj-form__input${errors.title ? " stj-form__input--error" : ""}`}
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="VD: Thiết kế logo cho startup công nghệ"
              maxLength={200}
            />
            {errors.title && <span className="stj-form__error">⚠ {errors.title}</span>}
            <span className="stj-form__hint">{formData.title.length}/200 ký tự</span>
          </div>

          {/* Description */}
          <div className="stj-form__field">
            <label className="stj-form__label stj-form__label--required">Mô tả chi tiết</label>
            <textarea
              className={`stj-form__textarea${errors.description ? " stj-form__textarea--error" : ""}`}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Mô tả công việc, mục tiêu, kết quả mong muốn..."
              rows={6}
              maxLength={5000}
            />
            {errors.description && <span className="stj-form__error">⚠ {errors.description}</span>}
            <span className="stj-form__hint">{formData.description.length}/5000 ký tự</span>
          </div>

          {/* Requirements */}
          <div className="stj-form__field">
            <label className="stj-form__label">Yêu cầu</label>
            <textarea
              className="stj-form__textarea"
              name="requirements"
              value={formData.requirements || ""}
              onChange={handleInputChange}
              placeholder="Các yêu cầu về kỹ năng, kinh nghiệm, công cụ..."
              rows={4}
              maxLength={3000}
            />
          </div>

          {/* Category + Urgency */}
          <div className="stj-form__row">
            <div className="stj-form__field">
              <label className="stj-form__label stj-form__label--required">Danh mục</label>
              <select
                className="stj-form__select"
                name="subCategory"
                value={formData.subCategory || "OTHER"}
                onChange={handleInputChange}
              >
                {SUBCATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="stj-form__field">
              <label className="stj-form__label stj-form__label--required">Độ gấp</label>
              <select
                className="stj-form__select"
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
              >
                {URGENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Skills ─────────────────────────────────────────── */}
      <div className="stj-form__section">
        <div className="stj-form__section-header">
          <h3 className="stj-form__section-title">
            <FiCode className="stj-form__icon" />
            Kỹ năng cần thiết
          </h3>
        </div>
        <div className="stj-form__section-body">
          <div className="stj-form__pill-input-row">
            <input
              className={`stj-form__input${errors.requiredSkills ? " stj-form__input--error" : ""}`}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Nhập kỹ năng và Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); }
              }}
            />
            <button className="stj-form__pill-add-btn" onClick={handleAddSkill} type="button">
              <FiPlus size={13} /> Thêm
            </button>
          </div>
          {errors.requiredSkills && <span className="stj-form__error">⚠ {errors.requiredSkills}</span>}

          <span className="stj-form__suggest-label">Gợi ý nhanh:</span>
          <div className="stj-form__pill-list">
            {SKILL_SUGGESTIONS.filter((s) => !formData.requiredSkills.includes(s))
              .slice(0, 12)
              .map((skill) => (
                <span
                  key={skill}
                  className="stj-form__pill stj-form__pill--suggest"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, requiredSkills: [...prev.requiredSkills, skill] }));
                  }}
                >
                  + {skill}
                </span>
              ))}
          </div>

          <hr className="stj-form__divider" />

          <span className="stj-form__count-label">Đã chọn ({formData.requiredSkills.length})</span>
          <div className="stj-form__pill-list">
            {formData.requiredSkills.map((skill) => (
              <span key={skill} className="stj-form__pill stj-form__pill--selected">
                {skill}
                <span className="stj-form__pill-x" onClick={() => handleRemoveSkill(skill)}>✕</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Budget & Timeline ──────────────────────────────── */}
      <div className="stj-form__section">
        <div className="stj-form__section-header">
          <h3 className="stj-form__section-title">
            <FiDollarSign className="stj-form__icon" />
            Ngân sách & Thời hạn
          </h3>
        </div>
        <div className="stj-form__section-body">

          <div className="stj-form__row">
            {/* Budget */}
            <div className="stj-form__field">
              <label className="stj-form__label stj-form__label--required">Ngân sách (VND)</label>
              <div className="stj-form__number-wrap">
                <input
                  className="stj-form__number-input"
                  type="number"
                  value={formData.budget || ""}
                  min={100000}
                  step={100000}
                  onChange={(e) => handleNumberChange("budget", Number(e.target.value))}
                  placeholder="100000"
                />
                <button className="stj-form__number-btn" type="button" onClick={() => handleNumberChange("budget", (formData.budget || 0) + 100000)}>+</button>
                <button className="stj-form__number-btn" type="button" onClick={() => handleNumberChange("budget", Math.max(0, (formData.budget || 0) - 100000))}>−</button>
              </div>
              {errors.budget && <span className="stj-form__error">⚠ {errors.budget}</span>}
            </div>

            {/* Payment Method */}
            <div className="stj-form__field">
              <label className="stj-form__label stj-form__label--required">Hình thức thanh toán</label>
              <select
                className="stj-form__select"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="stj-form__row">
            {/* Deadline */}
            <div className="stj-form__field">
              <label className="stj-form__label stj-form__label--required">Hạn nhận đơn ứng tuyển</label>
              <input
                className={`stj-form__input${errors.deadline ? " stj-form__input--error" : ""}`}
                name="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={handleInputChange}
              />
              {errors.deadline && <span className="stj-form__error">⚠ {errors.deadline}</span>}
            </div>

            {/* Work Deadline */}
            <div className="stj-form__field">
              <label className="stj-form__label">Deadline hoàn thành</label>
              <input
                className={`stj-form__input${errors.workDeadline ? " stj-form__input--error" : ""}`}
                name="workDeadline"
                type="datetime-local"
                value={formData.workDeadline || ""}
                onChange={handleInputChange}
              />
              {errors.workDeadline && <span className="stj-form__error">⚠ {errors.workDeadline}</span>}
            </div>
          </div>

          <div className="stj-form__row">
            {/* Estimated Duration */}
            <div className="stj-form__field">
              <label className="stj-form__label stj-form__label--required">Thời gian ước tính</label>
              <input
                className={`stj-form__input${errors.estimatedDuration ? " stj-form__input--error" : ""}`}
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleInputChange}
                placeholder="VD: 3-5 ngày, 1 tuần..."
              />
              {errors.estimatedDuration && <span className="stj-form__error">⚠ {errors.estimatedDuration}</span>}
            </div>

            {/* Max Applicants */}
            <div className="stj-form__field">
              <label className="stj-form__label stj-form__label--required">Số ứng viên tối đa</label>
              <div className="stj-form__number-wrap">
                <input
                  className="stj-form__number-input"
                  type="number"
                  value={formData.maxApplicants || ""}
                  min={1}
                  max={100}
                  onChange={(e) => handleNumberChange("maxApplicants", Number(e.target.value))}
                />
                <button className="stj-form__number-btn" type="button" onClick={() => handleNumberChange("maxApplicants", Math.min(100, (formData.maxApplicants || 10) + 1))}>+</button>
                <button className="stj-form__number-btn" type="button" onClick={() => handleNumberChange("maxApplicants", Math.max(1, (formData.maxApplicants || 10) - 1))}>−</button>
              </div>
              {errors.maxApplicants && <span className="stj-form__error">⚠ {errors.maxApplicants}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Location & Settings ────────────────────────────── */}
      <div className="stj-form__section">
        <div className="stj-form__section-header">
          <h3 className="stj-form__section-title">
            <FiMapPin className="stj-form__icon" />
            Địa điểm & Cài đặt
          </h3>
        </div>
        <div className="stj-form__section-body">

          {/* Remote toggle */}
          <div className="stj-form__toggle-row">
            <span className="stj-form__toggle-label">Làm việc từ xa (Remote)</span>
            <label className="stj-form__switch">
              <input
                type="checkbox"
                checked={formData.isRemote}
                onChange={(e) => handleSwitchChange("isRemote", e.target.checked)}
              />
              <div className="stj-form__switch-track">
                <div className="stj-form__switch-thumb" />
              </div>
            </label>
          </div>

          {!formData.isRemote && (
            <div className="stj-form__field">
              <label className="stj-form__label">Địa điểm làm việc</label>
              <input
                className="stj-form__input"
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
                placeholder="VD: Quận 1, TP.HCM"
              />
            </div>
          )}

          <hr className="stj-form__divider" />

          {/* Allows revision toggle */}
          <div className="stj-form__toggle-row">
            <span className="stj-form__toggle-label">Cho phép yêu cầu chỉnh sửa</span>
            <label className="stj-form__switch">
              <input
                type="checkbox"
                checked={formData.allowsRevision ?? true}
                onChange={(e) => handleSwitchChange("allowsRevision", e.target.checked)}
              />
              <div className="stj-form__switch-track">
                <div className="stj-form__switch-thumb" />
              </div>
            </label>
          </div>

          {formData.allowsRevision && (
            <div className="stj-form__field">
              <label className="stj-form__label">Số lần chỉnh sửa tối đa</label>
              <div className="stj-form__number-wrap">
                <input
                  className="stj-form__number-input"
                  type="number"
                  value={formData.maxRevisions || ""}
                  min={1}
                  max={10}
                  onChange={(e) => handleNumberChange("maxRevisions", Number(e.target.value))}
                />
                <button className="stj-form__number-btn" type="button" onClick={() => handleNumberChange("maxRevisions", Math.min(10, (formData.maxRevisions || 2) + 1))}>+</button>
                <button className="stj-form__number-btn" type="button" onClick={() => handleNumberChange("maxRevisions", Math.max(1, (formData.maxRevisions || 2) - 1))}>−</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Milestones ─────────────────────────────────────── */}
      {formData.paymentMethod === "MILESTONE" && (
        <div className="stj-form__section">
          <div className="stj-form__section-header">
            <h3 className="stj-form__section-title">
              <FiCheckSquare className="stj-form__icon" />
              Cột mốc thanh toán
            </h3>
            <button className="stj-form__add-btn" type="button" onClick={handleAddMilestone}>
              <FiPlus size={13} /> Thêm cột mốc
            </button>
          </div>
          <div className="stj-form__section-body">
            {formData.milestones?.map((milestone, index) => (
              <div key={index} className="stj-form__milestone">
                <div className="stj-form__milestone-header">
                  <span className="stj-form__milestone-title">Cột mốc {index + 1}</span>
                  <button
                    className="stj-form__milestone-del"
                    type="button"
                    onClick={() => handleRemoveMilestone(index)}
                    title="Xóa cột mốc"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
                <input
                  className="stj-form__input"
                  placeholder="Tên cột mốc"
                  value={milestone.title}
                  onChange={(e) => handleUpdateMilestone(index, "title", e.target.value)}
                />
                <textarea
                  className="stj-form__textarea"
                  placeholder="Mô tả"
                  rows={2}
                  value={milestone.description}
                  onChange={(e) => handleUpdateMilestone(index, "description", e.target.value)}
                />
                <div className="stj-form__row">
                  <div className="stj-form__field">
                    <label className="stj-form__label">Deadline</label>
                    <input
                      className="stj-form__input"
                      type="datetime-local"
                      value={milestone.deadline}
                      onChange={(e) => handleUpdateMilestone(index, "deadline", e.target.value)}
                    />
                  </div>
                  <div className="stj-form__field">
                    <label className="stj-form__label">Số tiền (VND)</label>
                    <div className="stj-form__number-wrap">
                      <input
                        className="stj-form__number-input"
                        type="number"
                        value={milestone.amount || ""}
                        min={0}
                        step={100000}
                        onChange={(e) => handleUpdateMilestone(index, "amount", Number(e.target.value))}
                      />
                      <button className="stj-form__number-btn" type="button" onClick={() => handleUpdateMilestone(index, "amount", (milestone.amount || 0) + 100000)}>+</button>
                      <button className="stj-form__number-btn" type="button" onClick={() => handleUpdateMilestone(index, "amount", Math.max(0, (milestone.amount || 0) - 100000))}>−</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!formData.milestones || formData.milestones.length === 0) && (
              <div className="stj-form__empty-note">
                Chưa có cột mốc nào. Nhấn &quot;Thêm cột mốc&quot; để bắt đầu.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tags ───────────────────────────────────────────── */}
      <div className="stj-form__section">
        <div className="stj-form__section-header">
          <h3 className="stj-form__section-title">
            <FiTag className="stj-form__icon" />
            Tags (Tùy chọn)
          </h3>
        </div>
        <div className="stj-form__section-body">
          <div className="stj-form__pill-input-row">
            <input
              className="stj-form__input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Nhập tag..."
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }
              }}
            />
            <button className="stj-form__pill-add-btn" type="button" onClick={handleAddTag}>
              <FiPlus size={13} /> Thêm
            </button>
          </div>
          <div className="stj-form__pill-list">
            {formData.tags?.map((tag) => (
              <span key={tag} className="stj-form__pill stj-form__pill--tag">
                {tag}
                <span className="stj-form__pill-x" onClick={() => handleRemoveTag(tag)}>✕</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────── */}
      <div className="stj-form__actions">
        {onCancel && (
          <button
            className="stj-form__btn stj-form__btn--cancel"
            type="button"
            onClick={onCancel}
            disabled={isLoading}
          >
            <FiX size={14} /> Hủy
          </button>
        )}
        <button
          className="stj-form__btn stj-form__btn--draft"
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isLoading}
        >
          {isLoading ? <span className="stj-form__spinner" /> : <FiSave size={14} />}
          Lưu nháp
        </button>
        <button
          className="stj-form__btn stj-form__btn--publish"
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isLoading}
        >
          {isLoading ? <span className="stj-form__spinner" /> : <FiSend size={14} />}
          {mode === "create" ? "Đăng công việc" : "Cập nhật & Đăng"}
        </button>
      </div>
    </div>
  );
};

export default ShortTermJobForm;
