import React, { useMemo, useState } from "react";
import {
  CreateShortTermJobRequest,
  JobUrgency,
} from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import { RichMarkdownEditor } from "./RichMarkdownEditor";
import "../business-hud/streamlined-job-forms.css";

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
  budget?: string;
  deadline?: string;
  workDeadline?: string;
  requiredSkills?: string;
  estimatedDuration?: string;
}

const SUBCATEGORY_OPTIONS = [
  { value: "DESIGN", label: "Thiết kế" },
  { value: "DEVELOPMENT", label: "Lập trình" },
  { value: "WRITING", label: "Viết nội dung" },
  { value: "MARKETING", label: "Marketing" },
  { value: "VIDEO", label: "Video / Animation" },
  { value: "OTHER", label: "Khác" },
];

const URGENCY_OPTIONS = [
  { value: JobUrgency.NORMAL, label: "Bình thường" },
  { value: JobUrgency.URGENT, label: "Gấp trong vài ngày" },
  { value: JobUrgency.VERY_URGENT, label: "Rất gấp 24-48h" },
  { value: JobUrgency.ASAP, label: "Cần làm ngay" },
];

const SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Node.js",
  "Figma",
  "SEO",
  "Content Writing",
  "Video Editing",
  "Translation",
];

const BUDGET_PRESETS = [
  { label: "500k", value: 500000 },
  { label: "1 triệu", value: 1000000 },
  { label: "3 triệu", value: 3000000 },
  { label: "5 triệu", value: 5000000 },
];

const DURATION_PRESETS = ["4 giờ", "1 ngày", "3 ngày", "1 tuần", "2 tuần"];

const REQUIREMENTS_TEMPLATE = `- Có kinh nghiệm với hạng mục tương tự
- Chủ động cập nhật tiến độ
- Sẵn sàng chỉnh sửa theo phản hồi`;

const normalizeDateTimeLocal = (value?: string) => {
  if (!value) {
    return "";
  }

  if (value.includes("T")) {
    return value.slice(0, 16);
  }

  return `${value}T09:00`;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const appendBlock = (current: string, block: string) => {
  const trimmed = current.trim();
  return trimmed ? `${trimmed}\n\n${block}` : block;
};

export const ShortTermJobForm: React.FC<ShortTermJobFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = "create",
}) => {
  const { showError } = useToast();
  const [formData, setFormData] = useState<CreateShortTermJobRequest>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    requirements: initialData?.requirements || "",
    budget: initialData?.budget || 0,
    deadline: normalizeDateTimeLocal(initialData?.deadline),
    workDeadline: normalizeDateTimeLocal(initialData?.workDeadline),
    estimatedDuration: initialData?.estimatedDuration || "",
    urgency: initialData?.urgency || JobUrgency.NORMAL,
    isRemote: true,
    maxApplicants: initialData?.maxApplicants || 10,
    subCategory: initialData?.subCategory || "OTHER",
    requiredSkills: initialData?.requiredSkills || [],
    primarySkill: initialData?.primarySkill || "",
    allowsRevision: initialData?.allowsRevision ?? true,
    maxRevisions: initialData?.maxRevisions || 2,
    tags: initialData?.tags || [],
    deliverableTypes: initialData?.deliverableTypes || [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [skillInput, setSkillInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(
      initialData?.requirements ||
      initialData?.workDeadline ||
      initialData?.tags?.length
    ),
  );

  const handleInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleNumberField = (
    field: keyof CreateShortTermJobRequest,
    value: number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = (skill: string) => {
    const normalized = skill.trim();
    if (!normalized || formData.requiredSkills.includes(normalized)) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      requiredSkills: [...prev.requiredSkills, normalized],
      // If no primary skill is set, set this one automatically
      primarySkill: prev.primarySkill ? prev.primarySkill : normalized,
    }));
    setSkillInput("");
    setErrors((prev) => ({ ...prev, requiredSkills: undefined }));
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => {
      const newSkills = prev.requiredSkills.filter((item) => item !== skill);
      return {
        ...prev,
        requiredSkills: newSkills,
        primarySkill: prev.primarySkill === skill 
          ? (newSkills.length > 0 ? newSkills[0] : "") 
          : prev.primarySkill,
      };
    });
  };

  const addTag = () => {
    const normalized = tagInput.trim();
    if (!normalized || formData.tags?.includes(normalized)) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), normalized],
    }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((item) => item !== tag) || [],
    }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (formData.title.trim().length < 8) {
      nextErrors.title = "Tiêu đề nên có ít nhất 8 ký tự.";
    }
    if (formData.description.trim().length < 50) {
      nextErrors.description = "Mô tả nên có ít nhất 50 ký tự.";
    }
    if (formData.requiredSkills.length === 0) {
      nextErrors.requiredSkills = "Hãy thêm ít nhất 1 kỹ năng.";
    }
    if (Number(formData.budget) < 100000) {
      nextErrors.budget = "Ngân sách tối thiểu là 100.000 VNĐ.";
    }
    if (!formData.deadline) {
      nextErrors.deadline = "Vui lòng chọn hạn nhận đơn.";
    }
    if (!formData.estimatedDuration.trim()) {
      nextErrors.estimatedDuration = "Hãy nhập deadline nộp dự án (SLA).";
    }
    if (
      formData.workDeadline &&
      formData.deadline &&
      new Date(formData.workDeadline) < new Date(formData.deadline)
    ) {
      nextErrors.workDeadline =
        "Hạn hoàn thành cần sau hoặc bằng hạn nhận đơn.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showError(
        "Thông tin chưa đầy đủ",
        "Vui lòng kiểm tra lại các trường bắt buộc.",
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (publish: boolean) => {
    if (!validateForm()) {
      return;
    }

    const payload: CreateShortTermJobRequest = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      requirements: formData.requirements?.trim() || undefined,
      budget: Number(formData.budget),
      maxApplicants: Number(formData.maxApplicants) || 10,
      maxRevisions: formData.allowsRevision
        ? Number(formData.maxRevisions) || 2
        : 0,
      tags: (formData.tags || []).filter(Boolean),
    };

    await onSubmit(payload, publish);
  };

  const completedEssentials = [
    formData.title.trim(),
    formData.description.trim(),
    formData.requiredSkills.length > 0 ? "skills" : "",
    formData.deadline,
    formData.estimatedDuration.trim(),
    Number(formData.budget) > 0 ? "budget" : "",
  ].filter(Boolean).length;

  // Extract plain text from markdown for preview sidebar
  const descriptionExcerpt = useMemo(() => {
    if (!formData.description.trim()) return "";
    // Strip markdown syntax for preview
    return formData.description
      .replace(/#{1,6}\s+/g, "") // headings
      .replace(/\*\*(.*?)\*\*/g, "$1") // bold
      .replace(/\*(.*?)\*/g, "$1") // italic
      .replace(/~~(.*?)~~/g, "$1") // strikethrough
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // links
      .replace(/!\[(.*?)\]\(.*?\)/g, "[Hình: $1]") // images
      .replace(/`{1,3}[^`]*`{1,3}/g, "") // code
      .replace(/^\s*[-*+]\s+/gm, "• ") // list items
      .replace(/^\s*\d+\.\s+/gm, "") // numbered lists
      .replace(/^\s*>\s+/gm, "") // blockquotes
      .replace(/\|[^|\n]+\|/g, "") // tables
      .replace(/\n{2,}/g, " ") // multiple newlines
      .replace(/\n/g, " ") // single newlines
      .trim()
      .substring(0, 200);
  }, [formData.description]);

  const previewMetrics = [
    {
      label: "Ngân sách",
      value:
        Number(formData.budget) > 0
          ? currencyFormatter.format(Number(formData.budget))
          : "Chưa nhập ngân sách",
    },
    {
      label: "Danh mục",
      value:
        SUBCATEGORY_OPTIONS.find(
          (option) => option.value === formData.subCategory,
        )?.label || "Khác",
    },
    { label: "Địa điểm", value: "Remote" },
  ];

  return (
    <div className="sjf-shell sjf-shell--embedded">
      <div className="sjf-grid">
        <div className="sjf-form">
          <section className="sjf-card sjf-card--strong">
            <div className="sjf-card__header">
              <div>
                <h3 className="sjf-card__title">Thông tin cốt lõi</h3>
                <p className="sjf-card__desc">
                  Tập trung vào các thông tin khiến ứng viên quyết định nhanh:
                  công việc là gì, cần kỹ năng nào và hoàn thành trong bao lâu.
                </p>
              </div>
            </div>

            <div className="sjf-field-grid">
              <div className="sjf-field sjf-field--full">
                <label className="sjf-label">
                  Tiêu đề công việc
                  <span className="sjf-label__required">*</span>
                </label>
                <input
                  className="sjf-input"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Thiết kế bộ banner cho chiến dịch ra mắt"
                />
                {errors.title && (
                  <span className="sjf-error">{errors.title}</span>
                )}
              </div>

              <div className="sjf-field sjf-field--full">
                <label className="sjf-label">
                  Mô tả công việc
                  <span className="sjf-label__required">*</span>
                </label>
                <RichMarkdownEditor
                  value={formData.description}
                  onChange={(v) => {
                    setFormData((prev) => ({ ...prev, description: v }));
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  placeholder="Viết mô tả đầu ra cần bàn giao, phạm vi công việc và tiêu chí hoàn thành..."
                  minHeight={260}
                  error={errors.description}
                />
              </div>

              <div className="sjf-field sjf-field--full">
                <label className="sjf-label">
                  Kỹ năng quan trọng
                  <span className="sjf-label__required">*</span>
                </label>
                <div className="sjf-inline-input">
                  <input
                    className="sjf-input"
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addSkill(skillInput);
                      }
                    }}
                    placeholder="Nhập kỹ năng và nhấn Enter"
                  />
                  <button
                    type="button"
                    className="sjf-button sjf-button--secondary"
                    onClick={() => addSkill(skillInput)}
                  >
                    Thêm kỹ năng
                  </button>
                </div>
                {errors.requiredSkills && (
                  <span className="sjf-error">{errors.requiredSkills}</span>
                )}
                <div className="sjf-pill-row">
                  {SKILL_SUGGESTIONS.filter(
                    (skill) => !formData.requiredSkills.includes(skill),
                  ).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className="sjf-preset"
                      onClick={() => addSkill(skill)}
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
                <div className="sjf-chip-row">
                  {formData.requiredSkills.length > 0 ? (
                    formData.requiredSkills.map((skill) => (
                      <span key={skill} className={`sjf-chip ${formData.primarySkill === skill ? 'sjf-chip--primary' : 'sjf-chip--active'}`}>
                        {skill}
                        {formData.primarySkill === skill && (
                          <span className="sjf-chip__badge" title="Kỹ năng chính mang trọng số cao nhất">⭐ Chính</span>
                        )}
                        <button
                          type="button"
                          className="sjf-chip__remove"
                          onClick={() => removeSkill(skill)}
                          aria-label={`Xóa ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="sjf-empty">
                      Chưa có kỹ năng nào được thêm.
                    </span>
                  )}
                </div>
                {formData.requiredSkills.length > 0 && (
                  <div className="sjf-field sjf-field--sub" style={{ marginTop: '1rem' }}>
                    <label className="sjf-label" style={{ fontSize: '0.85rem' }}>
                      Chọn Kỹ Năng Chính (⭐)
                    </label>
                    <select
                      className="sjf-select"
                      value={formData.primarySkill || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, primarySkill: e.target.value }))}
                      style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                    >
                      {formData.requiredSkills.map(skill => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                    </select>
                    <p className="sjf-note" style={{ marginTop: '0.5rem' }}>Kỹ năng này mang trọng số cao nhất trong thuật toán tìm kiếm ứng viên.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="sjf-card">
            <div className="sjf-card__header">
              <div>
                <h3 className="sjf-card__title">Ngân sách và tiến độ</h3>
                <p className="sjf-card__desc">
                  Tối ưu để ứng viên biết ngay mức độ phù hợp về chi phí và thời
                  lượng.
                </p>
              </div>
            </div>

            <div className="sjf-field-grid">
              <div className="sjf-field">
                <label className="sjf-label">
                  Ngân sách
                  <span className="sjf-label__required">*</span>
                </label>
                <input
                  className="sjf-input"
                  type="number"
                  value={formData.budget || ""}
                  onChange={(event) =>
                    handleNumberField("budget", Number(event.target.value))
                  }
                  placeholder="1000000"
                />
                {errors.budget && (
                  <span className="sjf-error">{errors.budget}</span>
                )}
              </div>

              <div className="sjf-field sjf-field--full">
                <span className="sjf-label">Preset ngân sách</span>
                <div className="sjf-pill-row">
                  {BUDGET_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`sjf-preset ${
                        Number(formData.budget) === preset.value
                          ? "sjf-preset--active"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          budget: preset.value,
                        }))
                      }
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sjf-field">
                <label className="sjf-label">
                  Hạn nhận đơn
                  <span className="sjf-label__required">*</span>
                </label>
                <input
                  className="sjf-input"
                  name="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
                {errors.deadline && (
                  <span className="sjf-error">{errors.deadline}</span>
                )}
              </div>

              <div className="sjf-field">
                <label className="sjf-label">
                  Deadline nộp dự án
                  <span className="sjf-label__required">*</span>
                </label>
                <input
                  className="sjf-input"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: 3 ngày, 8 giờ"
                />
                {errors.estimatedDuration && (
                  <span className="sjf-error">{errors.estimatedDuration}</span>
                )}
              </div>

              <div className="sjf-field sjf-field--full">
                <span className="sjf-label">Gợi ý thời hạn SLA</span>
                <div className="sjf-pill-row">
                  {DURATION_PRESETS.map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      className={`sjf-preset ${
                        formData.estimatedDuration === duration
                          ? "sjf-preset--active"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          estimatedDuration: duration,
                        }))
                      }
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="sjf-card">
            <div className="sjf-card__header">
              <div>
                <h3 className="sjf-card__title">Cách phối hợp</h3>
                <p className="sjf-card__desc">
                  Chỉ giữ lại các lựa chọn giúp hai bên hiểu cách làm việc.
                </p>
              </div>
            </div>

            <div className="sjf-field-grid">
              <div className="sjf-field">
                <label className="sjf-label">Danh mục</label>
                <select
                  className="sjf-select"
                  name="subCategory"
                  value={formData.subCategory || "OTHER"}
                  onChange={handleInputChange}
                >
                  {SUBCATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sjf-field">
                <label className="sjf-label">Độ gấp</label>
                <select
                  className="sjf-select"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                >
                  {URGENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              className="sjf-advanced-toggle"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              <span>Mở thêm thông tin hỗ trợ và điều khoản chi tiết</span>
              <span>{showAdvanced ? "Thu gọn" : "Mở rộng"}</span>
            </button>

            {showAdvanced && (
              <div className="sjf-advanced">
                <div className="sjf-field-grid">
                  <div className="sjf-field sjf-field--full">
                    <div
                      className="sjf-card__header"
                      style={{ marginBottom: 0 }}
                    >
                      <label className="sjf-label">Yêu cầu ứng viên</label>
                      <button
                        type="button"
                        className="sjf-link-button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            requirements: appendBlock(
                              prev.requirements || "",
                              REQUIREMENTS_TEMPLATE,
                            ),
                          }))
                        }
                      >
                        Chèn mẫu yêu cầu
                      </button>
                    </div>
                    <textarea
                      className="sjf-textarea"
                      name="requirements"
                      value={formData.requirements || ""}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Nêu kỳ vọng về kinh nghiệm, công cụ hoặc cách phối hợp."
                    />
                  </div>

                  <div className="sjf-field">
                    <label className="sjf-label">Hạn hoàn thành</label>
                    <input
                      className="sjf-input"
                      name="workDeadline"
                      type="datetime-local"
                      value={formData.workDeadline || ""}
                      onChange={handleInputChange}
                    />
                    {errors.workDeadline && (
                      <span className="sjf-error">{errors.workDeadline}</span>
                    )}
                  </div>

                  <div className="sjf-field">
                    <label className="sjf-label">Số ứng viên tối đa</label>
                    <input
                      className="sjf-input"
                      type="number"
                      value={formData.maxApplicants || ""}
                      onChange={(event) =>
                        handleNumberField(
                          "maxApplicants",
                          Number(event.target.value),
                        )
                      }
                      min={1}
                      max={100}
                    />
                  </div>

                  <div className="sjf-field sjf-field--full">
                    <div className="sjf-toggle-card">
                      <div className="sjf-toggle-card__content">
                        <span className="sjf-toggle-card__title">
                          Cho phép yêu cầu chỉnh sửa
                        </span>
                        <span className="sjf-note">
                          Hữu ích khi công việc cần bàn giao qua nhiều vòng phản
                          hồi.
                        </span>
                      </div>
                      <label className="sjf-switch">
                        <input
                          type="checkbox"
                          name="allowsRevision"
                          checked={formData.allowsRevision ?? true}
                          onChange={handleInputChange}
                        />
                        <span className="sjf-switch__track" />
                      </label>
                    </div>
                  </div>

                  {formData.allowsRevision && (
                    <div className="sjf-field">
                      <label className="sjf-label">
                        Số lần chỉnh sửa tối đa
                      </label>
                      <input
                        className="sjf-input"
                        type="number"
                        value={formData.maxRevisions || ""}
                        onChange={(event) =>
                          handleNumberField(
                            "maxRevisions",
                            Number(event.target.value),
                          )
                        }
                        min={1}
                        max={10}
                      />
                    </div>
                  )}

                  <div className="sjf-field sjf-field--full">
                    <label className="sjf-label">Tag hỗ trợ tìm kiếm</label>
                    <div className="sjf-inline-input">
                      <input
                        className="sjf-input"
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Ví dụ: landing-page, social, banner"
                      />
                      <button
                        type="button"
                        className="sjf-button sjf-button--secondary"
                        onClick={addTag}
                      >
                        Thêm tag
                      </button>
                    </div>
                    <div className="sjf-chip-row">
                      {(formData.tags || []).map((tag) => (
                        <span key={tag} className="sjf-chip sjf-chip--active">
                          {tag}
                          <button
                            type="button"
                            className="sjf-chip__remove"
                            onClick={() => removeTag(tag)}
                            aria-label={`Xóa ${tag}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="sjf-actions">
            {onCancel && (
              <button
                type="button"
                className="sjf-button sjf-button--secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Hủy
              </button>
            )}
            <button
              type="button"
              className="sjf-button sjf-button--secondary"
              onClick={() => void handleSubmit(false)}
              disabled={isLoading}
            >
              {isLoading ? "Đang lưu..." : "Lưu nháp"}
            </button>
            <button
              type="button"
              className="sjf-button sjf-button--primary"
              onClick={() => void handleSubmit(true)}
              disabled={isLoading}
            >
              {isLoading
                ? "Đang xử lý..."
                : mode === "create"
                  ? "Đăng công việc"
                  : "Cập nhật và đăng"}
            </button>
          </div>
        </div>

        <aside className="sjf-card sjf-card--sticky">
          <div className="sjf-preview">
            <div>
              <h3 className="sjf-card__title">Tóm tắt tin đăng</h3>
              <p className="sjf-card__desc">
                Kiểm tra nhanh phần hiển thị trước khi lưu hoặc xuất bản.
              </p>
            </div>

            <div className="sjf-progress" aria-hidden="true">
              <div
                className="sjf-progress__bar"
                style={{ width: `${(completedEssentials / 6) * 100}%` }}
              />
            </div>

            <div className="sjf-preview__hero">
              <h4 className="sjf-preview__title">
                {formData.title || "Tiêu đề công việc sẽ hiển thị ở đây"}
              </h4>
              <p className="sjf-preview__body">
                {descriptionExcerpt
                  ? `${descriptionExcerpt}${descriptionExcerpt.length >= 200 ? "..." : ""}`
                  : "Mô tả đầu ra, cách bàn giao và tiêu chí hoàn thành để ứng viên đánh giá mức phù hợp."}
              </p>
            </div>

            <div className="sjf-preview__grid">
              {previewMetrics.map((metric) => (
                <div key={metric.label} className="sjf-preview__metric">
                  <span className="sjf-preview__metric-label">
                    {metric.label}
                  </span>
                  <span className="sjf-preview__metric-value">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="sjf-preview__list">
              <div className="sjf-preview__list-item">
                <span className="sjf-preview__list-label">Kỹ năng</span>
                <div className="sjf-chip-row">
                  {formData.requiredSkills.length > 0 ? (
                    formData.requiredSkills.map((skill) => (
                      <span key={skill} className="sjf-chip sjf-chip--active">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="sjf-empty">
                      Chưa có kỹ năng nào được thêm.
                    </span>
                  )}
                </div>
              </div>

              <div className="sjf-preview__list-item">
                <span className="sjf-preview__list-label">Tiến độ</span>
                <span className="sjf-preview__list-value">
                  {`Nhận đơn đến ${formData.deadline || "..."} • SLA nộp bài ${
                    formData.estimatedDuration || "..."
                  }`}
                </span>
              </div>

              <div className="sjf-preview__list-item">
                <span className="sjf-preview__list-label">Yêu cầu hỗ trợ</span>
                <span className="sjf-preview__list-value">
                  {formData.requirements ? (
                    formData.requirements
                  ) : (
                    <span className="sjf-empty">
                      Phần yêu cầu chi tiết có thể để trống và chỉ mở khi cần
                      sàng lọc kỹ hơn.
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ShortTermJobForm;
