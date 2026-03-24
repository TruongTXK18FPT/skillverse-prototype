import React, { useEffect, useState } from "react";
import shortTermJobService from "../../services/shortTermJobService";
import { useToast } from "../../hooks/useToast";
import { recruiterSubscriptionService } from "../../services/recruiterSubscriptionService";
import { premiumService } from "../../services/premiumService";
import {
  CreateShortTermJobRequest,
  JobUrgency,
} from "../../types/ShortTermJob";
import { RichMarkdownEditor } from "../short-term-job/RichMarkdownEditor";
import { JobMarkdownSurface } from "../shared/JobMarkdownSurface";
import { InsufficientWalletModal } from "../shared/InsufficientWalletModal";
import "./streamlined-job-forms.css";

interface ShortTermLaunchPadProps {
  onJobCreated?: () => void;
}

interface PostingQuota {
  hasSubscription: boolean;
  shortTermJobPostingRemaining: number;
  shortTermJobPostingUnlimited: boolean;
}

interface ShortTermFormState {
  title: string;
  description: string;
  requirements: string;
  budget: string;
  deadline: string;
  workDeadline: string;
  estimatedDuration: string;
  urgency: JobUrgency;
  maxApplicants: string;
  subCategory: string;
  requiredSkills: string[];
}

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

const URGENCY_OPTIONS: { value: JobUrgency; label: string }[] = [
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
  "Data Analysis",
  "WordPress",
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
- Có thể trao đổi và cập nhật tiến độ rõ ràng`;

const createInitialFormData = (): ShortTermFormState => ({
  title: "",
  description: "",
  requirements: "",
  budget: "",
  deadline: "",
  workDeadline: "",
  estimatedDuration: "",
  urgency: JobUrgency.NORMAL,
  maxApplicants: "10",
  subCategory: "OTHER",
  requiredSkills: [],
});

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const appendBlock = (current: string, block: string) => {
  const trimmed = current.trim();
  return trimmed ? `${trimmed}\n\n${block}` : block;
};

const ShortTermLaunchPad: React.FC<ShortTermLaunchPadProps> = ({
  onJobCreated,
}) => {
  const { showSuccess, showError } = useToast();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [shortTermRemaining, setShortTermRemaining] = useState(0);
  const [shortTermUnlimited, setShortTermUnlimited] = useState(false);
  const [formData, setFormData] = useState<ShortTermFormState>(
    createInitialFormData(),
  );
  const [skillInput, setSkillInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletModalAmount, setWalletModalAmount] = useState(0);
  const [walletModalType, setWalletModalType] = useState<"escrow" | "posting">("escrow");

  useEffect(() => {
    void checkSubscriptionStatus();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkSubscriptionStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const checkSubscriptionStatus = async (): Promise<PostingQuota | null> => {
    try {
      const info = await recruiterSubscriptionService.getSubscriptionInfo();
      setHasSubscription(info.hasSubscription);
      if (info.hasSubscription) {
        setShortTermUnlimited(info.shortTermJobPostingUnlimited);
        setShortTermRemaining(info.shortTermJobPostingRemaining);
        return info;
      }
    } catch (error) {
      console.log("Recruiter subscription check failed:", error);
    }

    try {
      const generalSub = await premiumService.getCurrentSubscription();
      if (generalSub?.status === "ACTIVE") {
        const planType = generalSub.plan?.planType || "";
        const isEnterprise = planType === "RECRUITER_PRO";
        const isPremiumPlus = planType === "PREMIUM_PLUS";
        const isBasic = planType === "PREMIUM_BASIC";
        const hasSub = isEnterprise || isPremiumPlus || isBasic;

        if (hasSub) {
          const quota: PostingQuota = {
            hasSubscription: true,
            shortTermJobPostingUnlimited: isEnterprise,
            shortTermJobPostingRemaining: isEnterprise
              ? 9999
              : isPremiumPlus
                ? 50
                : 10,
          };
          setHasSubscription(true);
          setShortTermUnlimited(quota.shortTermJobPostingUnlimited);
          setShortTermRemaining(quota.shortTermJobPostingRemaining);
          return quota;
        }
      }
    } catch (error) {
      console.log("General premium check failed:", error);
    }

    setHasSubscription(false);
    setShortTermUnlimited(false);
    setShortTermRemaining(0);
    return null;
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, type, value } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addSkill = (skill: string) => {
    const normalized = skill.trim();
    if (!normalized || formData.requiredSkills.includes(normalized)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      requiredSkills: [...prev.requiredSkills, normalized],
    }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((item) => item !== skill),
    }));
  };

  const validateForm = () => {
    if (formData.title.trim().length < 8) {
      showError("Thiếu tiêu đề", "Tiêu đề nên có ít nhất 8 ký tự.");
      return false;
    }
    if (formData.description.trim().length < 50) {
      showError(
        "Thiếu mô tả",
        "Mô tả nên có ít nhất 50 ký tự để ứng viên hiểu đầu việc cần làm.",
      );
      return false;
    }
    if (formData.requiredSkills.length === 0) {
      showError("Thiếu kỹ năng", "Hãy thêm ít nhất 1 kỹ năng quan trọng.");
      return false;
    }
    if (!formData.deadline) {
      showError("Thiếu hạn nhận việc", "Vui lòng chọn hạn nhận đơn.");
      return false;
    }
    if (!formData.estimatedDuration.trim()) {
      showError("Thiếu thời lượng", "Hãy nhập thời gian ước tính hoàn thành.");
      return false;
    }
    if (Number(formData.budget) < 100000) {
      showError(
        "Ngân sách chưa hợp lệ",
        "Ngân sách tối thiểu cho việc ngắn hạn là 100.000 VNĐ.",
      );
      return false;
    }
    if (
      formData.workDeadline &&
      formData.deadline &&
      new Date(formData.workDeadline) < new Date(formData.deadline)
    ) {
      showError(
        "Mốc thời gian chưa hợp lý",
        "Hạn hoàn thành nên sau hoặc bằng hạn nhận đơn.",
      );
      return false;
    }
    return true;
  };

  const submitJob = async (publish: boolean) => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const freshInfo = await checkSubscriptionStatus();
    const currentHasSub = freshInfo?.hasSubscription ?? false;
    const currentUnlimited =
      freshInfo?.shortTermJobPostingUnlimited ?? false;
    const currentRemaining =
      freshInfo?.shortTermJobPostingRemaining ?? 0;

    const confirmMessage = publish
      ? currentHasSub && (currentUnlimited || currentRemaining > 0)
        ? currentUnlimited
          ? "Bạn đang dùng gói recruiter không giới hạn tin ngắn hạn. Xuất bản ngay?"
          : `Bạn còn ${currentRemaining} lượt đăng việc ngắn hạn. Xác nhận xuất bản?`
        : currentHasSub && currentRemaining <= 0
          ? ""
          : "Tin ngắn hạn sẽ trừ 30.000 VNĐ từ ví recruiter. Bạn có muốn xuất bản ngay?"
      : "Lưu nháp để hoàn thiện và xuất bản sau?";

    if (
      publish &&
      currentHasSub &&
      !currentUnlimited &&
      currentRemaining <= 0
    ) {
      showError(
        "Đã hết lượt đăng",
        "Bạn đã dùng hết quota việc ngắn hạn trong tháng này.",
      );
      setIsSubmitting(false);
      return;
    }

    if (!(await confirmAction(confirmMessage))) {
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: CreateShortTermJobRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim() || undefined,
        budget: Number(formData.budget),
        deadline: `${formData.deadline}T23:59:59`,
        workDeadline: formData.workDeadline
          ? `${formData.workDeadline}T23:59:59`
          : undefined,
        estimatedDuration: formData.estimatedDuration.trim(),
        urgency: formData.urgency,
        isRemote: true,
        maxApplicants: Number(formData.maxApplicants) || 10,
        subCategory: formData.subCategory,
        requiredSkills: formData.requiredSkills,
      };

      const created = await shortTermJobService.createJob(payload);
      if (publish && created?.id) {
        await shortTermJobService.publishJob(created.id);
      }

      showSuccess(
        publish ? "Đã gửi duyệt" : "Đã lưu nháp",
        publish
          ? "Tin việc ngắn hạn đã được gửi để hiển thị cho ứng viên."
          : "Bản nháp đã được lưu. Bạn có thể chỉnh sửa tiếp bất cứ lúc nào.",
      );

      setFormData(createInitialFormData());
      setSkillInput("");
      setShowAdvanced(false);
      onJobCreated?.();
    } catch (error) {
      console.error("Short-term job creation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // Detect wallet insufficient balance errors
      if (
        errorMessage.includes("Số dư ví không đủ") ||
        errorMessage.includes("ký quỹ")
      ) {
        // Extract amount from error message e.g. "5000000.00"
        const amountMatch = errorMessage.match(/([\d,]+\.?\d*)\s*VND?/);
        const amount = amountMatch
          ? parseFloat(amountMatch[1].replace(/,/g, ""))
          : Number(formData.budget) || 0;
        setWalletModalAmount(amount);
        setWalletModalType("escrow");
        setShowWalletModal(true);
        return;
      }
      if (errorMessage.includes("phí đăng tin")) {
        setWalletModalAmount(30000);
        setWalletModalType("posting");
        setShowWalletModal(true);
        return;
      }
      showError(
        "Không thể tạo việc ngắn hạn",
        "Có lỗi xảy ra khi lưu công việc. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const budgetPreview = Number(formData.budget) > 0
      ? currencyFormatter.format(Number(formData.budget))
      : "Chưa nhập ngân sách";

  const quotaPreview = hasSubscription
    ? shortTermUnlimited
      ? "Premium recruiter: không giới hạn tin ngắn hạn"
      : shortTermRemaining > 0
        ? `Premium recruiter: còn ${shortTermRemaining} lượt`
        : "Premium recruiter: đã hết quota tháng này"
    : "Đăng lẻ: 30.000 VNĐ mỗi tin";

  const completedEssentials = [
    formData.title.trim(),
    formData.description.trim(),
    formData.requiredSkills.length > 0 ? "skills" : "",
    formData.deadline,
    formData.estimatedDuration.trim(),
    formData.budget ? "budget" : "",
  ].filter(Boolean).length;

  const previewMetrics = [
    { label: "Ngân sách", value: budgetPreview },
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
    <div className="sjf-shell">
      {/* Hero Banner */}
      <div className="sjf-hero">
        <div className="sjf-hero__content">
          {/* Badge row */}
          <div className="sjf-hero__badges">
            <span className="sjf-badge sjf-badge--teal">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Short-term Gig
            </span>
            <span className="sjf-badge sjf-badge--ghost">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Đăng nhanh
            </span>
          </div>

          {/* Headline */}
          <h2 className="sjf-hero__title">
            Tuyển freelancer cho
            <br />
            <span className="sjf-hero__title--accent">công việc ngắn hạn</span>
          </h2>

          {/* Description */}
          <p className="sjf-hero__desc">
            Đăng việc ngắn hạn với mục tiêu rõ ràng, ngân sách minh bạch và thời hạn cụ thể
            để thu hút freelancer chất lượng cao nhất. Mọi thứ chỉ mất vài phút để hoàn tất.
          </p>

          {/* 3 pillars */}
          <div className="sjf-hero__pillars">
            <div className="sjf-pillar">
              <div className="sjf-pillar__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className="sjf-pillar__text">
                <strong>Phản hồi nhanh</strong>
                <span>Freelancer nhận việc và bắt đầu trong vài giờ đến vài ngày</span>
              </div>
            </div>
            <div className="sjf-pillar">
              <div className="sjf-pillar__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className="sjf-pillar__text">
                <strong>Thanh toán linh hoạt</strong>
                <span>Trả một lần, theo cột mốc hoặc theo giờ — tùy độ phức tạp</span>
              </div>
            </div>
            <div className="sjf-pillar">
              <div className="sjf-pillar__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="sjf-pillar__text">
                <strong>Kết nối chuyên gia</strong>
                <span>Tìm đúng người với kỹ năng cụ thể cho từng hạng mục</span>
              </div>
            </div>
          </div>

          {/* Meta chips */}
          <div className="sjf-hero__meta">
            <span className="sjf-meta-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {quotaPreview}
            </span>
            <span className="sjf-meta-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Hoàn thiện {completedEssentials}/6 mục cốt lõi
            </span>
          </div>
        </div>

        {/* Aside panel */}
        <div className="sjf-hero__aside">
          {/* Tip card */}
          <div className="sjf-tip-card">
            <div className="sjf-tip-card__header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Mẹo đăng việc hiệu quả
            </div>
            <ul className="sjf-tip-card__list">
              <li>Tiêu đề càng cụ thể, ứng viên càng đúng — tránh tiêu đề chung chung</li>
              <li>Ngân sách rõ ràng giúp freelancer tự đánh giá phù hợp trước khi ứng tuyển</li>
              <li>Deadline hợp lý: quá gấp khó tuyển, quá xa freelancer sẽ trễ</li>
              <li>3-5 kỹ năng chính là đủ — danh sách quá dài sẽ không ai nhìn</li>
            </ul>
          </div>

          {/* Quick stats */}
          <div className="sjf-quick-stats">
            <div className="sjf-quick-stat">
              <span className="sjf-quick-stat__val">24h</span>
              <span className="sjf-quick-stat__lbl">Thời gian đăng trung bình</span>
            </div>
            <div className="sjf-quick-stat">
              <span className="sjf-quick-stat__val">3</span>
              <span className="sjf-quick-stat__lbl">Bước để hoàn tất đăng tin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sjf-grid">
        <form
          className="sjf-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitJob(true);
          }}
        >
          {/* Section 1: Core Description */}
          <div className="sjf-step-card">
            <div className="sjf-step-card__header sjf-step-card__header--teal">
              <div className="sjf-step-card__num">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div>
                <h3 className="sjf-step-card__title">Mô tả công việc</h3>
                <p className="sjf-step-card__desc">Viết để ứng viên hiểu ngay đầu ra — không phải đoán việc.</p>
              </div>
            </div>

            <div className="sjf-field-grid">
              <div className="sjf-field sjf-field--full">
                <label className="sjf-label">
                  Tiêu đề công việc
                  <span className="sjf-label__required">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  className="sjf-input"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ví dụ: Thiết kế landing page bán hàng 5 section"
                  required
                />
              </div>

              <div className="sjf-field sjf-field--full">
                <label className="sjf-label">
                  Mô tả công việc
                  <span className="sjf-label__required">*</span>
                </label>
                <RichMarkdownEditor
                  value={formData.description}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, description: v }))
                  }
                  placeholder="Viết mô tả đầu ra cần bàn giao, phạm vi công việc và tiêu chí hoàn thành..."
                  minHeight={240}
                />
              </div>

              <div className="sjf-field sjf-field--full">
                <label className="sjf-label">
                  Kỹ năng quan trọng
                  <span className="sjf-label__required">*</span>
                </label>
                <div className="sjf-inline-input">
                  <input
                    type="text"
                    className="sjf-input"
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addSkill(skillInput);
                      }
                    }}
                    placeholder="Nhập kỹ năng rồi nhấn Enter"
                  />
                  <button
                    type="button"
                    className="sjf-button sjf-button--secondary"
                    onClick={() => addSkill(skillInput)}
                  >
                    Thêm
                  </button>
                </div>

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
                      <span key={skill} className="sjf-chip sjf-chip--active sjf-chip--teal">
                        {skill}
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
                      Chưa có kỹ năng nào.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Budget & Timeline */}
          <div className="sjf-step-card">
            <div className="sjf-step-card__header sjf-step-card__header--teal">
              <div className="sjf-step-card__num">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div>
                <h3 className="sjf-step-card__title">Ngân sách & Thời hạn</h3>
                <p className="sjf-step-card__desc">Ứng viên cần biết giá trị công việc và tốc độ cần hoàn thành.</p>
              </div>
            </div>

            <div className="sjf-field-grid">
              <div className="sjf-field">
                <label className="sjf-label">
                  Ngân sách (VNĐ)
                  <span className="sjf-label__required">*</span>
                </label>
                <input
                  type="number"
                  name="budget"
                  className="sjf-input"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="1000000"
                />
              </div>


              <div className="sjf-field sjf-field--full">
                <span className="sjf-label">Ngân sách nhanh</span>
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
                          budget: String(preset.value),
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
                  type="date"
                  name="deadline"
                  className="sjf-input"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="sjf-field">
                <label className="sjf-label">
                  Thời lượng ước tính
                  <span className="sjf-label__required">*</span>
                </label>
                <input
                  type="text"
                  name="estimatedDuration"
                  className="sjf-input"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  placeholder="Ví dụ: 3 ngày, 8 giờ"
                  required
                />
              </div>

              <div className="sjf-field sjf-field--full">
                <span className="sjf-label">Thời lượng nhanh</span>
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
          </div>

          {/* Section 3: Collaboration */}
          <div className="sjf-step-card">
            <div className="sjf-step-card__header sjf-step-card__header--teal">
              <div className="sjf-step-card__num">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h3 className="sjf-step-card__title">Danh mục & Cách làm việc</h3>
                <p className="sjf-step-card__desc">Chọn danh mục và cách phối hợp để ứng viên hình dung công việc.</p>
              </div>
            </div>

            <div className="sjf-field-grid">
              <div className="sjf-field sjf-field--full">
                <label className="sjf-label">Danh mục công việc</label>
                <div className="sjf-segment">
                  {SUBCATEGORY_OPTIONS.slice(0, 6).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`sjf-segment__button sjf-segment__button--teal ${
                        formData.subCategory === option.value
                          ? "sjf-segment__button--active"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          subCategory: option.value,
                        }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {showAdvanced && (
              <div className="sjf-advanced">
                <div className="sjf-field-grid">
                  <div className="sjf-field sjf-field--full">
                    <div className="sjf-label-row">
                      <label className="sjf-label">Yêu cầu ứng viên</label>
                      <button
                        type="button"
                        className="sjf-link-button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            requirements: appendBlock(
                              prev.requirements,
                              REQUIREMENTS_TEMPLATE,
                            ),
                          }))
                        }
                      >
                        Chèn mẫu
                      </button>
                    </div>
                    <textarea
                      name="requirements"
                      className="sjf-textarea"
                      value={formData.requirements}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Nêu rõ kỳ vọng về kinh nghiệm, kỹ năng mềm hoặc công cụ cần dùng."
                    />
                  </div>

                  <div className="sjf-field">
                    <label className="sjf-label">Độ gấp</label>
                    <select
                      name="urgency"
                      className="sjf-select"
                      value={formData.urgency}
                      onChange={handleChange}
                    >
                      {URGENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sjf-field">
                    <label className="sjf-label">Số ứng viên tối đa</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      name="maxApplicants"
                      className="sjf-input"
                      value={formData.maxApplicants}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sjf-field">
                    <label className="sjf-label">Hạn hoàn thành</label>
                    <input
                      type="date"
                      name="workDeadline"
                      className="sjf-input"
                      value={formData.workDeadline}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sjf-actions">
            <button
              type="button"
              className="sjf-button sjf-button--secondary"
              disabled={isSubmitting}
              onClick={() => void submitJob(false)}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu nháp"}
            </button>
            <button
              type="submit"
              className="sjf-button sjf-button--primary sjf-button--teal"
              disabled={
                isSubmitting ||
                (hasSubscription &&
                  !shortTermUnlimited &&
                  shortTermRemaining <= 0)
              }
            >
              {isSubmitting
                ? "Đang xử lý..."
                : hasSubscription &&
                    (shortTermUnlimited || shortTermRemaining > 0)
                  ? shortTermUnlimited
                    ? "Xuất bản bằng gói Premium"
                    : `Xuất bản • còn ${shortTermRemaining} lượt`
                  : hasSubscription && shortTermRemaining <= 0
                    ? "Đã hết lượt đăng tháng này"
                    : "Xuất bản • phí 30.000 VNĐ"}
            </button>
          </div>
        </form>

        <aside className="sjf-card sjf-card--sticky">
          <div className="sjf-preview">
            <div className="sjf-preview__header">
              <div className="sjf-preview__header-icon sjf-preview__header-icon--teal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div>
                <h3 className="sjf-card__title">Xem trước việc ngắn hạn</h3>
                <p className="sjf-card__desc">Cách tin đăng sẽ hiển thị với ứng viên.</p>
              </div>
            </div>

            <div className="sjf-progress sjf-progress--teal" aria-hidden="true">
              <div
                className="sjf-progress__bar sjf-progress__bar--teal"
                style={{ width: `${(completedEssentials / 6) * 100}%` }}
              />
            </div>

            <div className="sjf-preview__hero sjf-preview__hero--teal">
              <h4 className="sjf-preview__title">
                {formData.title || "Tiêu đề việc ngắn hạn sẽ hiển thị ở đây"}
              </h4>
              <JobMarkdownSurface
                content={formData.description}
                className="sjf-preview__body"
                density="preview"
                theme="teal"
                maxHeight={220}
                placeholder="Mô tả rõ đầu ra, cách bàn giao và tiêu chí hoàn thành để freelancer tự đánh giá phù hợp."
              />
            </div>

            <div className="sjf-preview__grid">
              {previewMetrics.map((metric) => (
                <div key={metric.label} className="sjf-preview__metric sjf-preview__metric--teal">
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
              <div className="sjf-preview__list-item sjf-preview__list-item--teal">
                <span className="sjf-preview__list-label">Kỹ năng yêu cầu</span>
                <div className="sjf-chip-row">
                  {formData.requiredSkills.length > 0 ? (
                    formData.requiredSkills.map((skill) => (
                      <span key={skill} className="sjf-chip sjf-chip--active sjf-chip--teal">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="sjf-empty">
                      Chưa có kỹ năng nào.
                    </span>
                  )}
                </div>
              </div>

              <div className="sjf-preview__list-item sjf-preview__list-item--teal">
                <span className="sjf-preview__list-label">Tiến độ</span>
                <span className="sjf-preview__list-value">
                  {`Nhận đơn đến ${formData.deadline || "..."} • Ước tính ${
                    formData.estimatedDuration || "..."
                  }`}
                </span>
              </div>

              <div className="sjf-preview__list-item sjf-preview__list-item--teal">
                <span className="sjf-preview__list-label">
                  Yêu cầu hỗ trợ
                </span>
                <span className="sjf-preview__list-value">
                  {formData.requirements ? (
                    formData.requirements
                  ) : (
                    <span className="sjf-empty">
                      Có thể thêm yêu cầu chi tiết trong phần nâng cao.
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <InsufficientWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        requiredAmount={walletModalAmount}
        type={walletModalType}
      />
    </div>
  );
};

export default ShortTermLaunchPad;
