import React, { useState, useEffect } from "react";
import shortTermJobService from "../../services/shortTermJobService";
import { useToast } from "../../hooks/useToast";
import { recruiterSubscriptionService } from "../../services/recruiterSubscriptionService";
import { premiumService } from "../../services/premiumService";
import {
  CreateShortTermJobRequest,
  JobUrgency,
  PaymentMethod,
} from "../../types/ShortTermJob";
import "./fleet-styles.css";

// ==================== CONSTANTS ====================

const SUBCATEGORY_OPTIONS = [
  { value: "DESIGN", label: "Thiết kế" },
  { value: "DEVELOPMENT", label: "Lập trình" },
  { value: "WRITING", label: "Viết nội dung" },
  { value: "MARKETING", label: "Marketing" },
  { value: "VIDEO", label: "Video / Animation" },
  { value: "TRANSLATION", label: "Dịch thuật" },
  { value: "DATA_ENTRY", label: "Nhập liệu" },
  { value: "VIRTUAL_ASSISTANT", label: "Trợ lý ảo" },
  { value: "CONSULTING", label: "Tư vấn" },
  { value: "OTHER", label: "Khác" },
];

const URGENCY_OPTIONS: { value: JobUrgency; label: string; badge: string }[] = [
  { value: JobUrgency.NORMAL, label: "Bình thường", badge: "🟢" },
  { value: JobUrgency.URGENT, label: "Gấp — vài ngày", badge: "🟡" },
  { value: JobUrgency.VERY_URGENT, label: "Rất gấp — 24-48h", badge: "🟠" },
  { value: JobUrgency.ASAP, label: "Cần ngay lập tức", badge: "🔴" },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; desc: string }[] =
  [
    { value: "FIXED", label: "Trả một lần", desc: "Thanh toán khi hoàn thành" },
    { value: "MILESTONE", label: "Theo cột mốc", desc: "Chia theo giai đoạn" },
    { value: "HOURLY", label: "Theo giờ", desc: "Tính theo thời gian làm" },
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
  "Photoshop",
  "Illustrator",
  "Content Writing",
  "SEO",
  "Social Media",
  "Video Editing",
  "Data Analysis",
  "Excel",
  "Translation",
  "WordPress",
];

// ==================== COMPONENT ====================

interface ShortTermLaunchPadProps {
  onJobCreated?: () => void;
}

const ShortTermLaunchPad: React.FC<ShortTermLaunchPadProps> = ({
  onJobCreated,
}) => {
  const { showSuccess, showError } = useToast();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [shortTermRemaining, setShortTermRemaining] = useState(0);
  const [shortTermUnlimited, setShortTermUnlimited] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSubscriptionStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      // 1) Try recruiter-specific endpoint first
      const info = await recruiterSubscriptionService.getSubscriptionInfo();
      setHasSubscription(info.hasSubscription);
      if (info.hasSubscription) {
        setShortTermUnlimited(info.shortTermJobPostingUnlimited);
        setShortTermRemaining(info.shortTermJobPostingRemaining);
        return info;
      }
    } catch {
      // Endpoint failed — fall through to general premium check
    }

    // 2) Fallback: check general premium subscription
    try {
      const generalSub = await premiumService.getCurrentSubscription();
      if (generalSub && generalSub.status === "ACTIVE") {
        const planType = generalSub.plan?.planType || "";
        const isEnterprise = planType === "RECRUITER_PRO";
        const isPremiumPlus = planType === "PREMIUM_PLUS";
        const isBasic = planType === "PREMIUM_BASIC";
        const hasSub = isEnterprise || isPremiumPlus || isBasic;
        if (hasSub) {
          const unlimited = isEnterprise;
          const remaining = isEnterprise ? 9999 : isPremiumPlus ? 50 : 10;
          setHasSubscription(true);
          setShortTermUnlimited(unlimited);
          setShortTermRemaining(remaining);
          return {
            hasSubscription: true,
            shortTermJobPostingUnlimited: unlimited,
            shortTermJobPostingRemaining: remaining,
          };
        }
      }
    } catch {
      // General premium check also failed
    }

    // No subscription found
    setHasSubscription(false);
    setShortTermUnlimited(false);
    setShortTermRemaining(0);
    return null;
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    budget: "",
    isNegotiable: false,
    paymentMethod: "FIXED" as PaymentMethod,
    deadline: "",
    workDeadline: "",
    estimatedDuration: "",
    urgency: JobUrgency.NORMAL,
    isRemote: true,
    location: "",
    maxApplicants: "10",
    subCategory: "OTHER",
    requiredSkills: [] as string[],
  });

  const [skillInput, setSkillInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSkillAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput.trim());
    }
  };

  const addSkill = (skill: string) => {
    if (!formData.requiredSkills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill],
      }));
    }
    setSkillInput("");
    setShowSuggestions(false);
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (!formData.title.trim() || formData.title.length < 10) {
      showError("Lỗi", "Tiêu đề phải có ít nhất 10 ký tự");
      setIsSubmitting(false);
      return;
    }
    if (!formData.description.trim() || formData.description.length < 50) {
      showError("Lỗi", "Mô tả phải có ít nhất 50 ký tự");
      setIsSubmitting(false);
      return;
    }
    if (!formData.isNegotiable && Number(formData.budget) < 100000) {
      showError("Lỗi", "Ngân sách tối thiểu là 100.000 VND");
      setIsSubmitting(false);
      return;
    }
    if (!formData.deadline) {
      showError("Lỗi", "Vui lòng chọn hạn nhận đơn");
      setIsSubmitting(false);
      return;
    }
    if (formData.requiredSkills.length === 0) {
      showError("Lỗi", "Vui lòng thêm ít nhất 1 kỹ năng yêu cầu");
      setIsSubmitting(false);
      return;
    }

    // Re-fetch fresh subscription data before making posting decisions
    const freshInfo = await checkSubscriptionStatus();
    const currentHasSub = freshInfo?.hasSubscription ?? false;
    const currentUnlimited = freshInfo?.shortTermJobPostingUnlimited ?? false;
    const currentRemaining = freshInfo?.shortTermJobPostingRemaining ?? 0;

    const confirmMsg = publish
      ? currentHasSub && (currentUnlimited || currentRemaining > 0)
        ? `Bạn còn ${currentUnlimited ? "không giới hạn" : currentRemaining} lượt đăng tin ngắn hạn. Đăng và xuất bản ngay?`
        : currentHasSub && currentRemaining <= 0
          ? null // Will show error instead
          : "Đăng và xuất bản tin ngay? (Phí: 30.000 VNĐ sẽ trừ vào ví)"
      : "Lưu bản nháp để chỉnh sửa sau?";

    if (
      publish &&
      currentHasSub &&
      !currentUnlimited &&
      currentRemaining <= 0
    ) {
      showError(
        "Hết quota",
        "Bạn đã hết lượt đăng tin ngắn hạn trong tháng này.",
      );
      setIsSubmitting(false);
      return;
    }
    if (!(await confirmAction(confirmMsg || ""))) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Append time component to date strings for LocalDateTime backend fields
      const deadlineDateTime = formData.deadline
        ? `${formData.deadline}T23:59:59`
        : formData.deadline;
      const workDeadlineDateTime = formData.workDeadline
        ? `${formData.workDeadline}T23:59:59`
        : undefined;

      const payload: CreateShortTermJobRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim() || undefined,
        budget: formData.isNegotiable ? 0 : Number(formData.budget),
        isNegotiable: formData.isNegotiable,
        paymentMethod: formData.paymentMethod,
        deadline: deadlineDateTime,
        workDeadline: workDeadlineDateTime,
        estimatedDuration: formData.estimatedDuration || "1 ngày",
        urgency: formData.urgency,
        isRemote: formData.isRemote,
        location: formData.isRemote ? undefined : formData.location,
        maxApplicants: Number(formData.maxApplicants) || 10,
        subCategory: formData.subCategory,
        requiredSkills: formData.requiredSkills,
      };

      const created = await shortTermJobService.createJob(payload);

      if (publish && created?.id) {
        await shortTermJobService.publishJob(created.id);
      }

      showSuccess(
        publish ? "Đã Gửi Duyệt" : "Đã Lưu Nháp",
        publish
          ? "Tin việc ngắn hạn đã được gửi để admin phê duyệt!"
          : "Bản nháp đã được lưu. Bạn có thể chỉnh sửa và xuất bản sau.",
      );

      // Reset form
      setFormData({
        title: "",
        description: "",
        requirements: "",
        budget: "",
        isNegotiable: false,
        paymentMethod: "FIXED",
        deadline: "",
        workDeadline: "",
        estimatedDuration: "",
        urgency: JobUrgency.NORMAL,
        isRemote: true,
        location: "",
        maxApplicants: "10",
        subCategory: "OTHER",
        requiredSkills: [],
      });

      onJobCreated?.();
    } catch (err) {
      console.error("Short-term job creation failed:", err);
      showError("Thất bại", "Không thể tạo việc ngắn hạn. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSuggestions = SKILL_SUGGESTIONS.filter(
    (s) =>
      !formData.requiredSkills.includes(s) &&
      s.toLowerCase().includes(skillInput.toLowerCase()),
  );

  return (
    <div className="fleet-panel">
      <div className="fleet-title">
        <i className="fas fa-bolt"></i>
        Đăng Tin Việc Ngắn Hạn / Gig
      </div>

      <div className="fleet-form-layout">
        {/* ======================== LEFT: FORM ======================== */}
        <form onSubmit={(e) => handleSubmit(e, true)}>
          {/* Title */}
          <div className="fleet-input-group">
            <label className="fleet-label">Tiêu Đề Công Việc *</label>
            <input
              type="text"
              name="title"
              className="fleet-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Thiết kế banner quảng cáo cho fanpage"
              required
            />
            {formData.title.length > 0 && formData.title.length < 10 && (
              <small style={{ color: "#fca5a5", fontSize: "0.75rem" }}>
                Cần ít nhất 10 ký tự ({formData.title.length}/10)
              </small>
            )}
          </div>

          {/* Description */}
          <div className="fleet-input-group">
            <label className="fleet-label">Mô Tả Chi Tiết *</label>
            <textarea
              name="description"
              className="fleet-input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả công việc cần làm, yêu cầu cụ thể, bàn giao..."
              rows={4}
              required
            />
            {formData.description.length > 0 &&
              formData.description.length < 50 && (
                <small style={{ color: "#fca5a5", fontSize: "0.75rem" }}>
                  Cần ít nhất 50 ký tự ({formData.description.length}/50)
                </small>
              )}
          </div>

          {/* Requirements */}
          <div className="fleet-input-group">
            <label className="fleet-label">Yêu Cầu Ứng Viên</label>
            <textarea
              name="requirements"
              className="fleet-input"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="- Có kinh nghiệm thiết kế&#10;- Sử dụng thành thạo Figma&#10;- ..."
              rows={3}
            />
          </div>

          {/* Category & Urgency row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div className="fleet-input-group">
              <label className="fleet-label">Danh Mục</label>
              <select
                name="subCategory"
                className="fleet-input"
                value={formData.subCategory}
                onChange={handleChange}
              >
                {SUBCATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="fleet-input-group">
              <label className="fleet-label">Mức Độ Gấp</label>
              <select
                name="urgency"
                className="fleet-input"
                value={formData.urgency}
                onChange={handleChange}
              >
                {URGENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.badge} {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Skills */}
          <div className="fleet-input-group" style={{ position: "relative" }}>
            <label className="fleet-label">
              Kỹ Năng Yêu Cầu * — Nhấn Enter hoặc chọn gợi ý
            </label>
            <input
              type="text"
              className="fleet-input"
              value={skillInput}
              onChange={(e) => {
                setSkillInput(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleSkillAdd}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Nhập kỹ năng và nhấn Enter"
            />
            {/* Suggestions dropdown */}
            {showSuggestions &&
              skillInput &&
              filteredSuggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#1e293b",
                    border: "1px solid rgba(6,182,212,0.3)",
                    borderRadius: 8,
                    maxHeight: 150,
                    overflowY: "auto",
                    zIndex: 20,
                  }}
                >
                  {filteredSuggestions.slice(0, 6).map((s) => (
                    <div
                      key={s}
                      onMouseDown={() => addSkill(s)}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        color: "#e2e8f0",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                      onMouseOver={(e) =>
                        ((e.target as HTMLElement).style.background =
                          "rgba(6,182,212,0.12)")
                      }
                      onMouseOut={(e) =>
                        ((e.target as HTMLElement).style.background =
                          "transparent")
                      }
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            <div className="fleet-merc-skills" style={{ marginTop: "10px" }}>
              {formData.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="fleet-chip"
                  onClick={() => removeSkill(skill)}
                  style={{ cursor: "pointer" }}
                  title="Click để xóa"
                >
                  {skill} ✕
                </span>
              ))}
            </div>
          </div>

          {/* Budget & Payment row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div className="fleet-input-group">
              <label className="fleet-label">Ngân Sách (VND) *</label>
              <input
                type="number"
                name="budget"
                className="fleet-input"
                value={formData.budget}
                onChange={handleChange}
                placeholder="VD: 500000"
                disabled={formData.isNegotiable}
                required={!formData.isNegotiable}
                min="100000"
              />
            </div>
            <div className="fleet-input-group">
              <label className="fleet-label">Phương Thức Thanh Toán</label>
              <select
                name="paymentMethod"
                className="fleet-input"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                {PAYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} — {o.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="fleet-input-group"
            style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}
          >
            <input
              type="checkbox"
              name="isNegotiable"
              checked={formData.isNegotiable}
              onChange={handleChange}
              id="st-negotiable-check"
            />
            <label
              htmlFor="st-negotiable-check"
              style={{ color: "var(--fleet-text)", cursor: "pointer" }}
            >
              Thỏa thuận (Ẩn mức giá)
            </label>
          </div>

          {/* Deadlines row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div className="fleet-input-group">
              <label className="fleet-label">Hạn Nhận Đơn *</label>
              <input
                type="date"
                name="deadline"
                className="fleet-input"
                value={formData.deadline}
                onChange={handleChange}
                required
              />
            </div>
            <div className="fleet-input-group">
              <label className="fleet-label">Hạn Hoàn Thành</label>
              <input
                type="date"
                name="workDeadline"
                className="fleet-input"
                value={formData.workDeadline}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Duration & Max Applicants */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div className="fleet-input-group">
              <label className="fleet-label">Thời Gian Ước Tính</label>
              <input
                type="text"
                name="estimatedDuration"
                className="fleet-input"
                value={formData.estimatedDuration}
                onChange={handleChange}
                placeholder="VD: 2 ngày, 4 giờ"
              />
            </div>
            <div className="fleet-input-group">
              <label className="fleet-label">Số Ứng Viên Tối Đa</label>
              <input
                type="number"
                name="maxApplicants"
                className="fleet-input"
                value={formData.maxApplicants}
                onChange={handleChange}
                min="1"
                max="100"
              />
            </div>
          </div>

          {/* Remote / Location */}
          <div
            className="fleet-input-group"
            style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}
          >
            <input
              type="checkbox"
              name="isRemote"
              checked={formData.isRemote}
              onChange={handleChange}
              id="st-remote-check"
            />
            <label
              htmlFor="st-remote-check"
              style={{ color: "var(--fleet-text)", cursor: "pointer" }}
            >
              Làm việc từ xa (Remote)
            </label>
          </div>

          {!formData.isRemote && (
            <div className="fleet-input-group">
              <label className="fleet-label">Địa Điểm Làm Việc</label>
              <input
                type="text"
                name="location"
                className="fleet-input"
                value={formData.location}
                onChange={handleChange}
                placeholder="Nhập địa chỉ cụ thể..."
                required
              />
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button
              type="submit"
              className="fleet-btn-primary"
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting
                ? "Đang xử lý..."
                : hasSubscription &&
                    (shortTermUnlimited || shortTermRemaining > 0)
                  ? `⚡ Xuất Bản Ngay (Gói Premium${!shortTermUnlimited ? ` - còn ${shortTermRemaining} lượt` : ""})`
                  : hasSubscription && shortTermRemaining <= 0
                    ? "Đã hết lượt đăng tin ngắn hạn"
                    : "⚡ Xuất Bản Ngay (Phí: 30.000 VNĐ)"}
            </button>
            <button
              type="button"
              className="fleet-btn-primary"
              disabled={isSubmitting}
              style={{
                flex: 0.6,
                background: "rgba(100,116,139,0.25)",
                borderColor: "rgba(100,116,139,0.4)",
              }}
              onClick={(e) => handleSubmit(e as any, false)}
            >
              💾 Lưu Nháp
            </button>
          </div>
        </form>

        {/* ======================== RIGHT: PREVIEW ======================== */}
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            padding: "20px",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div className="fleet-label" style={{ marginBottom: "4px" }}>
            Xem Trước Tin Đăng
          </div>

          <div
            className="fleet-panel"
            style={{ border: "1px dashed var(--fleet-cyan)", margin: 0 }}
          >
            <h3 style={{ color: "#fff", margin: "0 0 8px 0" }}>
              {formData.title || "Tiêu đề công việc"}
            </h3>

            {/* Tags row */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              <span
                className="fleet-chip"
                style={{
                  background: "rgba(245,158,11,0.2)",
                  borderColor: "rgba(245,158,11,0.4)",
                }}
              >
                {SUBCATEGORY_OPTIONS.find(
                  (o) => o.value === formData.subCategory,
                )?.label || "Khác"}
              </span>
              <span
                className="fleet-chip"
                style={{
                  background: "rgba(6,182,212,0.2)",
                  borderColor: "rgba(6,182,212,0.4)",
                }}
              >
                {formData.isRemote
                  ? "🌐 Remote"
                  : `📍 ${formData.location || "Onsite"}`}
              </span>
              <span className="fleet-chip">
                {
                  URGENCY_OPTIONS.find((o) => o.value === formData.urgency)
                    ?.badge
                }{" "}
                {
                  URGENCY_OPTIONS.find((o) => o.value === formData.urgency)
                    ?.label
                }
              </span>
            </div>

            <p
              style={{
                color: "var(--fleet-text-muted)",
                fontSize: "0.9rem",
                whiteSpace: "pre-line",
              }}
            >
              {formData.description || "Mô tả công việc sẽ xuất hiện ở đây..."}
            </p>

            {formData.requirements && (
              <div style={{ marginTop: "12px" }}>
                <div className="fleet-label">Yêu Cầu</div>
                <p
                  style={{
                    color: "var(--fleet-text-muted)",
                    fontSize: "0.85rem",
                    whiteSpace: "pre-line",
                  }}
                >
                  {formData.requirements}
                </p>
              </div>
            )}

            <div
              style={{
                marginTop: "16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <div className="fleet-label">Ngân Sách</div>
                <div
                  style={{ color: "var(--fleet-success)", fontWeight: "bold" }}
                >
                  {formData.isNegotiable
                    ? "Thỏa thuận"
                    : formData.budget
                      ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(Number(formData.budget))
                      : "0 ₫"}
                </div>
              </div>
              <div>
                <div className="fleet-label">Thanh Toán</div>
                <div style={{ color: "#fff" }}>
                  {
                    PAYMENT_OPTIONS.find(
                      (o) => o.value === formData.paymentMethod,
                    )?.label
                  }
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "12px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <div className="fleet-label">Hạn Nhận Đơn</div>
                <div style={{ color: "#fff" }}>
                  {formData.deadline
                    ? new Date(formData.deadline).toLocaleDateString("vi-VN")
                    : "—"}
                </div>
              </div>
              <div>
                <div className="fleet-label">Thời Gian</div>
                <div style={{ color: "#fff" }}>
                  {formData.estimatedDuration || "—"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <div className="fleet-label">Kỹ Năng Yêu Cầu</div>
              <div className="fleet-merc-skills">
                {formData.requiredSkills.length > 0 ? (
                  formData.requiredSkills.map((s) => (
                    <span key={s} className="fleet-chip">
                      {s}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      color: "var(--fleet-text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    Chưa chỉ định kỹ năng
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                padding: "10px 14px",
                background: "rgba(245,158,11,0.08)",
                borderRadius: 8,
                border: "1px solid rgba(245,158,11,0.18)",
                fontSize: "0.8rem",
                color: "#f59e0b",
              }}
            >
              ⚡ Tối đa {formData.maxApplicants || 10} ứng viên
              {formData.workDeadline &&
                ` · Hoàn thành trước ${new Date(formData.workDeadline).toLocaleDateString("vi-VN")}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortTermLaunchPad;
