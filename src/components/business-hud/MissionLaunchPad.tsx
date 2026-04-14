import React, { useEffect, useState } from "react";
import jobService from "../../services/jobService";
import { useAppToast } from "../../context/ToastContext";
import { recruiterSubscriptionService } from "../../services/recruiterSubscriptionService";
import { premiumService } from "../../services/premiumService";
import { RichMarkdownEditor } from "../short-term-job/RichMarkdownEditor";
import { JobMarkdownSurface } from "../shared/JobMarkdownSurface";
import "./streamlined-job-forms.css";

interface MissionLaunchPadProps {
  onMissionLaunched?: () => void;
}

interface PostingQuota {
  hasSubscription: boolean;
  jobPostingRemaining: number;
  jobPostingUnlimited: boolean;
}

interface MissionFormState {
  title: string;
  description: string;
  skills: string[];
  minBudget: string;
  maxBudget: string;
  deadline: string;
  isRemote: boolean;
  location: string;
  experienceLevel: string;
  jobType: string;
  hiringQuantity: string;
  benefits: string;
  isNegotiable: boolean;
}

const EXPERIENCE_OPTIONS = [
  { value: "Intern", label: "Thực tập" },
  { value: "Fresher", label: "Fresher" },
  { value: "Junior", label: "Junior" },
  { value: "Middle", label: "Middle" },
  { value: "Senior", label: "Senior" },
  { value: "Lead", label: "Lead / Manager" },
];

const JOB_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Toàn thời gian" },
  { value: "PART_TIME", label: "Bán thời gian" },
  { value: "CONTRACT", label: "Hợp đồng" },
  { value: "HYBRID", label: "Hybrid" },
];

const FULL_TIME_SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Node.js",
  "Spring Boot",
  "Java",
  "Python",
  "SQL",
  "QA Testing",
  "UI/UX",
  "Project Management",
];

const SALARY_PRESETS = [
  { label: "12-18 triệu", min: 12000000, max: 18000000 },
  { label: "18-25 triệu", min: 18000000, max: 25000000 },
  { label: "25-35 triệu", min: 25000000, max: 35000000 },
  { label: "35-50 triệu", min: 35000000, max: 50000000 },
];

const BENEFIT_SUGGESTIONS = [
  "Lương tháng 13",
  "Bảo hiểm đầy đủ",
  "Linh hoạt thời gian làm việc",
  "Thiết bị làm việc riêng",
  "Review lương định kỳ",
];

const createInitialFormData = (): MissionFormState => ({
  title: "",
  description: "",
  skills: [],
  minBudget: "",
  maxBudget: "",
  deadline: "",
  isRemote: true,
  location: "",
  experienceLevel: "Junior",
  jobType: "FULL_TIME",
  hiringQuantity: "1",
  benefits: "",
  isNegotiable: false,
});

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatCurrency = (value?: string | number) => {
  const amount = Number(value || 0);
  return amount > 0 ? currencyFormatter.format(amount) : "Chưa thiết lập";
};

const appendUniqueLine = (current: string, line: string) => {
  const lines = current
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (lines.includes(`- ${line}`) || lines.includes(line)) {
    return current;
  }

  return current.trim() ? `${current.trim()}\n- ${line}` : `- ${line}`;
};

const MissionLaunchPad: React.FC<MissionLaunchPadProps> = ({
  onMissionLaunched,
}) => {
  const { showSuccess, showError } = useAppToast();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [jobPostingRemaining, setJobPostingRemaining] = useState(0);
  const [jobPostingUnlimited, setJobPostingUnlimited] = useState(false);
  const [formData, setFormData] = useState<MissionFormState>(
    createInitialFormData(),
  );
  const [skillInput, setSkillInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setJobPostingUnlimited(info.jobPostingUnlimited);
        setJobPostingRemaining(info.jobPostingRemaining);
      } else {
        try {
          const generalSub = await premiumService.getCurrentSubscription();
          if (generalSub?.status === "ACTIVE") {
            const planType = generalSub.plan?.planType || "";
            const isPremium =
              planType === "PREMIUM_PLUS" || planType === "RECRUITER_PRO";
            if (isPremium) {
              const quota: PostingQuota = {
                hasSubscription: true,
                jobPostingUnlimited: planType === "RECRUITER_PRO",
                jobPostingRemaining:
                  planType === "RECRUITER_PRO" ? 9999 : 30,
              };
              setHasSubscription(true);
              setJobPostingUnlimited(quota.jobPostingUnlimited);
              setJobPostingRemaining(quota.jobPostingRemaining);
              return quota;
            }
          }
        } catch (error) {
          console.log("General premium check failed:", error);
        }
      }

      return {
        hasSubscription: info.hasSubscription,
        jobPostingRemaining: info.jobPostingRemaining,
        jobPostingUnlimited: info.jobPostingUnlimited,
      };
    } catch (error) {
      console.log("Subscription check error:", error);
      try {
        const generalSub = await premiumService.getCurrentSubscription();
        if (generalSub?.status === "ACTIVE") {
          const planType = generalSub.plan?.planType || "";
          const isPremium =
            planType === "PREMIUM_PLUS" || planType === "RECRUITER_PRO";
          if (isPremium) {
            const quota: PostingQuota = {
              hasSubscription: true,
              jobPostingUnlimited: planType === "RECRUITER_PRO",
              jobPostingRemaining: planType === "RECRUITER_PRO" ? 9999 : 30,
            };
            setHasSubscription(true);
            setJobPostingUnlimited(quota.jobPostingUnlimited);
            setJobPostingRemaining(quota.jobPostingRemaining);
            return quota;
          }
        }
      } catch (fallbackError) {
        console.log("Fallback premium check failed:", fallbackError);
      }

      setHasSubscription(false);
      setJobPostingUnlimited(false);
      setJobPostingRemaining(0);
      return null;
    }
  };

  const handleInputChange = (
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
    if (!normalized || formData.skills.includes(normalized)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, normalized],
    }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (formData.title.trim().length < 8) {
      errors.push("Tiêu đề: cần ít nhất 8 ký tự");
    }

    if (formData.description.trim().length < 40) {
      errors.push("Mô tả: cần ít nhất 40 ký tự để ứng viên hiểu đúng nhu cầu");
    }

    if (formData.skills.length === 0) {
      errors.push("Kỹ năng: hãy thêm ít nhất 1 kỹ năng quan trọng");
    }

    if (!formData.deadline) {
      errors.push("Hạn nhận hồ sơ: vui lòng chọn ngày kết thúc nhận hồ sơ");
    }

    if (!formData.isRemote && !formData.location.trim()) {
      errors.push("Địa điểm: hãy nhập nơi làm việc nếu vị trí không remote");
    }

    if (!formData.isNegotiable) {
      const minBudget = Number(formData.minBudget);
      const maxBudget = Number(formData.maxBudget);

      if (!minBudget || !maxBudget) {
        errors.push("Lương: vui lòng nhập khoảng lương hoặc bật chế độ thỏa thuận");
      } else if (minBudget <= 0 || maxBudget <= 0 || maxBudget < minBudget) {
        errors.push("Lương: mức tối đa cần lớn hơn hoặc bằng mức tối thiểu");
      }
    }

    if (errors.length === 0) {
      return true;
    }

    const errorsList =
      errors.length === 1
        ? errors[0]
        : errors.map((e, i) => `${i + 1}. ${e}`).join("\n");

    showError(
      errors.length === 1 ? "Vui lòng kiểm tra lại" : `${errors.length} trường chưa hoàn thiện`,
      errorsList,
    );
    return false;
  };

  const submitJob = async (publish: boolean) => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const freshInfo = await checkSubscriptionStatus();
    const currentHasSub = freshInfo?.hasSubscription ?? false;
    const currentUnlimited = freshInfo?.jobPostingUnlimited ?? false;
    const currentRemaining = freshInfo?.jobPostingRemaining ?? 0;

    const confirmMessage = publish
      ? currentHasSub && (currentUnlimited || currentRemaining > 0)
        ? currentUnlimited
          ? "Bạn đang dùng gói recruiter không giới hạn lượt đăng. Gửi duyệt ngay?"
          : `Bạn còn ${currentRemaining} lượt đăng trong gói hiện tại. Xác nhận gửi duyệt?`
        : currentHasSub && currentRemaining <= 0
          ? null
          : "Tin tuyển dụng này sẽ trừ 50.000 VNĐ từ ví recruiter. Bạn có muốn gửi duyệt ngay?"
      : "Lưu dưới dạng bản nháp để hoàn thiện thêm trước khi gửi duyệt?";

    if (publish && currentHasSub && !currentUnlimited && currentRemaining <= 0) {
      showError(
        "Đã hết lượt đăng",
        "Bạn đã dùng hết quota tuyển dụng trong tháng này. Vui lòng chờ kỳ tiếp theo hoặc nâng cấp gói.",
      );
      setIsSubmitting(false);
      return;
    }

    if (
      confirmMessage !== null &&
      !(await confirmAction(confirmMessage))
    ) {
      setIsSubmitting(false);
      return;
    }

    try {
      const jobPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requiredSkills: formData.skills,
        minBudget: formData.isNegotiable ? 0 : Number(formData.minBudget),
        maxBudget: formData.isNegotiable ? 0 : Number(formData.maxBudget),
        deadline: formData.deadline,
        isRemote: formData.isRemote,
        location: formData.isRemote ? "" : formData.location.trim(),
        experienceLevel: formData.experienceLevel,
        jobType: formData.jobType,
        hiringQuantity: Number(formData.hiringQuantity) || 1,
        benefits: formData.benefits.trim(),
        genderRequirement: "ANY",
        isNegotiable: formData.isNegotiable,
      };

      const created = await jobService.createJob(jobPayload);

      // If publish=true: submit for admin approval (charges fee)
      if (publish && created?.id) {
        await jobService.submitForApproval(created.id);
      }

      showSuccess(
        publish ? "Đã gửi duyệt" : "Đã lưu nháp",
        publish
          ? "Tin tuyển dụng đã được gửi và đang chờ admin duyệt. Bạn sẽ được thông báo khi có kết quả."
          : "Bản nháp đã được lưu lại. Bạn có thể chỉnh sửa và gửi duyệt bất cứ lúc nào.",
      );

      setFormData(createInitialFormData());
      setSkillInput("");
      setShowAdvanced(false);
      onMissionLaunched?.();
    } catch (error) {
      console.error("Mission launch failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("Số dư ví không đủ") ||
        errorMessage.includes("không đủ")
      ) {
        showError(
          "Số dư ví không đủ",
          "Bạn cần ít nhất 50.000 VNĐ trong ví để đăng tin. Vui lòng nạp thêm.",
        );
      } else {
        showError(
          "Không thể đăng tin",
          "Có lỗi xảy ra khi tạo tin tuyển dụng. Vui lòng thử lại.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const salaryPreview = formData.isNegotiable
    ? "Thỏa thuận khi trao đổi"
    : formData.minBudget && formData.maxBudget
      ? `${formatCurrency(formData.minBudget)} - ${formatCurrency(formData.maxBudget)}`
      : "Chưa thiết lập khoảng lương";

  const quotaPreview = hasSubscription
    ? jobPostingUnlimited
      ? "Premium recruiter: không giới hạn lượt đăng"
      : jobPostingRemaining > 0
        ? `Premium recruiter: còn ${jobPostingRemaining} lượt đăng`
        : "Premium recruiter: đã hết quota tháng này"
    : "Đăng lẻ: 50.000 VNĐ mỗi tin";

  const completedEssentials = [
    formData.title.trim(),
    formData.description.trim(),
    formData.skills.length > 0 ? "skills" : "",
    formData.deadline,
    formData.isNegotiable || (formData.minBudget && formData.maxBudget)
      ? "salary"
      : "",
    formData.isRemote || formData.location.trim() ? "location" : "",
  ].filter(Boolean).length;

  const previewMetrics = [
    { label: "Khoảng lương", value: salaryPreview },
    {
      label: "Hình thức",
      value:
        JOB_TYPE_OPTIONS.find((option) => option.value === formData.jobType)
          ?.label || formData.jobType,
    },
    {
      label: "Kinh nghiệm",
      value:
        EXPERIENCE_OPTIONS.find(
          (option) => option.value === formData.experienceLevel,
        )?.label || formData.experienceLevel,
    },
    {
      label: "Làm việc",
      value: formData.isRemote
        ? "Remote / linh hoạt"
        : formData.location || "Onsite",
    },
  ];

  const benefitButtons = BENEFIT_SUGGESTIONS.map((benefit) => (
    <button
      key={benefit}
      type="button"
      className="sjf-preset"
      onClick={() =>
        setFormData((prev) => ({
          ...prev,
          benefits: appendUniqueLine(prev.benefits, benefit),
        }))
      }
    >
      + {benefit}
    </button>
  ));

  return (
    <div className="sjf-shell">
      {/* Hero Banner */}
      <div className="sjf-hero sjf-hero--mission">
        <div className="sjf-hero__content">
          {/* Badge row */}
          <div className="sjf-hero__badges">
            <span className="sjf-badge sjf-badge--gold">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Full-time Recruiter
            </span>
            <span className="sjf-badge sjf-badge--ghost">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
              Dài hạn
            </span>
          </div>

          {/* Headline */}
          <h2 className="sjf-hero__title">
            Đăng tin tuyển dụng
            <br />
            <span className="sjf-hero__title--accent">dài hạn chuyên nghiệp</span>
          </h2>

          {/* Description */}
          <p className="sjf-hero__desc">
            Thu hút ứng viên chất lượng bằng tin đăng rõ ràng: mục tiêu vị trí cụ thể,
            khoảng lương minh bạch, kỹ năng thực sự cần thiết. Các trường phụ như phúc lợi
            và yêu cầu chi tiết luôn sẵn sàng trong phần mở rộng khi bạn cần.
          </p>

          {/* 3 pillars */}
          <div className="sjf-hero__pillars">
            <div className="sjf-pillar">
              <div className="sjf-pillar__icon sjf-pillar__icon--gold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <div className="sjf-pillar__text">
                <strong>Mô tả đúng vị trí</strong>
                <span>Nêu rõ vai trò, đầu việc và kết quả mong đợi trong 3 tháng đầu</span>
              </div>
            </div>
            <div className="sjf-pillar">
              <div className="sjf-pillar__icon sjf-pillar__icon--gold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className="sjf-pillar__text">
                <strong>Lương minh bạch</strong>
                <span>Khoảng lương rõ ràng giúp ứng viên tự sàng lọc phù hợp ngay từ đầu</span>
              </div>
            </div>
            <div className="sjf-pillar">
              <div className="sjf-pillar__icon sjf-pillar__icon--gold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div className="sjf-pillar__text">
                <strong>Tuyển đúng người</strong>
                <span>3-5 kỹ năng cốt lõi hiệu quả hơn danh sách dài không ai đọc hết</span>
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
          <div className="sjf-tip-card sjf-tip-card--gold">
            <div className="sjf-tip-card__header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Tin tuyển dụng hiệu quả
            </div>
            <ul className="sjf-tip-card__list">
              <li>Tiêu đề nêu rõ vị trí + cấp kinh nghiệm: "Lập trình viên React — Senior"</li>
              <li>Khoảng lương cụ thể giúp ứng viên quyết định nhanh, giảm inbox rác</li>
              <li>Mô tả mục tiêu vị trí trong 3 tháng đầu giúp ứng viên hình dung công việc</li>
              <li>Phúc lợi là điểm cộng — điền càng đầy, tin càng nổi bật</li>
            </ul>
          </div>

          {/* Quick stats */}
          <div className="sjf-quick-stats sjf-quick-stats--gold">
            <div className="sjf-quick-stat">
              <span className="sjf-quick-stat__val">14 ngày</span>
              <span className="sjf-quick-stat__lbl">Thời gian tuyển trung bình</span>
            </div>
            <div className="sjf-quick-stat">
              <span className="sjf-quick-stat__val">5</span>
              <span className="sjf-quick-stat__lbl">Trường cốt lõi cần điền</span>
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
          {/* Section 1: Core Info */}
          <div className="sjf-step-card">
            <div className="sjf-step-card__header sjf-step-card__header--gold">
              <div className="sjf-step-card__num">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div>
                <h3 className="sjf-step-card__title">Thông tin cốt lõi</h3>
                <p className="sjf-step-card__desc">Tiêu đề, mô tả và kỹ năng — đây là phần ứng viên đọc trước tiên.</p>
              </div>
            </div>

            <div className="sjf-field-grid">
              <div className="sjf-field sjf-field--full">
                <label className="sjf-label">
                  Tiêu đề vị trí
                  <span className="sjf-label__required">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  className="sjf-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Frontend React Developer — Senior cho SaaS product"
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
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, description: value }))
                  }
                  placeholder="Nêu rõ: mục tiêu vị trí trong 3 tháng đầu, đầu việc chính và kết quả mong đợi."
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
                  {FULL_TIME_SKILL_SUGGESTIONS.filter(
                    (skill) => !formData.skills.includes(skill),
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
                  {formData.skills.length > 0 ? (
                    formData.skills.map((skill) => (
                      <span key={skill} className="sjf-chip sjf-chip--active sjf-chip--gold">
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

          {/* Section 2: Salary & Location */}
          <div className="sjf-step-card">
            <div className="sjf-step-card__header sjf-step-card__header--gold">
              <div className="sjf-step-card__num">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div>
                <h3 className="sjf-step-card__title">Lương, thời hạn & địa điểm</h3>
                <p className="sjf-step-card__desc">Những thông tin quyết định chất lượng ứng viên phù hợp.</p>
              </div>
            </div>

            <div className="sjf-field-grid">
              <div className="sjf-field">
                <label className="sjf-label">
                  Lương tối thiểu
                  {!formData.isNegotiable && (
                    <span className="sjf-label__required">*</span>
                  )}
                </label>
                <input
                  type="number"
                  name="minBudget"
                  className="sjf-input"
                  value={formData.minBudget}
                  onChange={handleInputChange}
                  disabled={formData.isNegotiable}
                  placeholder="12000000"
                />
              </div>

              <div className="sjf-field">
                <label className="sjf-label">
                  Lương tối đa
                  {!formData.isNegotiable && (
                    <span className="sjf-label__required">*</span>
                  )}
                </label>
                <input
                  type="number"
                  name="maxBudget"
                  className="sjf-input"
                  value={formData.maxBudget}
                  onChange={handleInputChange}
                  disabled={formData.isNegotiable}
                  placeholder="25000000"
                />
              </div>

              <div className="sjf-field sjf-field--full">
                <span className="sjf-label">Khoảng lương nhanh</span>
                <div className="sjf-pill-row">
                  {SALARY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`sjf-preset ${
                        Number(formData.minBudget) === preset.min &&
                        Number(formData.maxBudget) === preset.max
                          ? "sjf-preset--active"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          minBudget: String(preset.min),
                          maxBudget: String(preset.max),
                          isNegotiable: false,
                        }))
                      }
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sjf-field sjf-field--full">
                <div className="sjf-toggle-card sjf-toggle-card--gold">
                  <div className="sjf-toggle-card__content">
                    <span className="sjf-toggle-card__title">
                      Cho phép thỏa thuận lương
                    </span>
                    <span className="sjf-note">
                      Bật khi muốn linh hoạt mức lương ở giai đoạn đầu tuyển dụng.
                    </span>
                  </div>
                  <label className="sjf-switch sjf-switch--gold">
                    <input
                      type="checkbox"
                      name="isNegotiable"
                      checked={formData.isNegotiable}
                      onChange={handleInputChange}
                    />
                    <span className="sjf-switch__track" />
                  </label>
                </div>
              </div>

              <div className="sjf-field">
                <label className="sjf-label">
                  Hạn nhận hồ sơ
                  <span className="sjf-label__required">*</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  className="sjf-input"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="sjf-field">
                <label className="sjf-label">Địa điểm làm việc</label>
                <input
                  type="text"
                  name="location"
                  className="sjf-input"
                  value={formData.location}
                  onChange={handleInputChange}
                  disabled={formData.isRemote}
                  placeholder="Quận 1, TP.HCM"
                />
              </div>

              <div className="sjf-field sjf-field--full">
                <div className="sjf-toggle-card sjf-toggle-card--gold">
                  <div className="sjf-toggle-card__content">
                    <span className="sjf-toggle-card__title">
                      Làm việc từ xa / Remote
                    </span>
                    <span className="sjf-note">
                      Tắt nếu yêu cầu onsite hoặc hybrid cố định tại văn phòng.
                    </span>
                  </div>
                  <label className="sjf-switch sjf-switch--gold">
                    <input
                      type="checkbox"
                      name="isRemote"
                      checked={formData.isRemote}
                      onChange={handleInputChange}
                    />
                    <span className="sjf-switch__track" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Context */}
          <div className="sjf-step-card">
            <div className="sjf-step-card__header sjf-step-card__header--gold">
              <div className="sjf-step-card__num">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h3 className="sjf-step-card__title">Bối cảnh tuyển dụng</h3>
                <p className="sjf-step-card__desc">Cấp độ và hình thức giúp ứng viên tự đánh giá phù hợp.</p>
              </div>
            </div>

            <div className="sjf-field-grid">
              <div className="sjf-field sjf-field--full">
                <label className="sjf-label">Cấp độ kinh nghiệm</label>
                <div className="sjf-segment">
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`sjf-segment__button sjf-segment__button--gold ${
                        formData.experienceLevel === option.value
                          ? "sjf-segment__button--active"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          experienceLevel: option.value,
                        }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sjf-field sjf-field--full">
                <label className="sjf-label">Hình thức tuyển dụng</label>
                <div className="sjf-segment">
                  {JOB_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`sjf-segment__button sjf-segment__button--gold ${
                        formData.jobType === option.value
                          ? "sjf-segment__button--active"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          jobType: option.value,
                        }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="sjf-advanced-toggle sjf-advanced-toggle--gold"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              <span>Thông tin bổ sung: phúc lợi, số lượng tuyển...</span>
              <span>{showAdvanced ? "Thu gọn" : "Mở rộng"}</span>
            </button>

            {showAdvanced && (
              <div className="sjf-advanced">
                <div className="sjf-field-grid">
                  <div className="sjf-field">
                    <label className="sjf-label">Số lượng cần tuyển</label>
                    <input
                      type="number"
                      min="1"
                      name="hiringQuantity"
                      className="sjf-input"
                      value={formData.hiringQuantity}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="sjf-field">
                    <label className="sjf-label">Phúc lợi nổi bật</label>
                    <div className="sjf-pill-row">{benefitButtons}</div>
                  </div>

                  <div className="sjf-field sjf-field--full">
                    <textarea
                      name="benefits"
                      className="sjf-textarea"
                      value={formData.benefits}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="- Laptop làm việc&#10;- Lương tháng 13&#10;- Review lương 2 lần/năm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sjf-actions sjf-actions--gold">
            <button
              type="button"
              className="sjf-button sjf-button--secondary sjf-button--gold"
              onClick={() => void submitJob(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Lưu nháp"}
            </button>
            <button
              type="submit"
              className="sjf-button sjf-button--primary sjf-button--gold"
              disabled={
                isSubmitting ||
                (hasSubscription &&
                  !jobPostingUnlimited &&
                  jobPostingRemaining <= 0)
              }
            >
              {isSubmitting
                ? "Đang xử lý..."
                : hasSubscription &&
                    (jobPostingUnlimited || jobPostingRemaining > 0)
                  ? jobPostingUnlimited
                    ? "Gửi duyệt bằng gói Premium"
                    : `Gửi duyệt • còn ${jobPostingRemaining} lượt`
                  : hasSubscription && jobPostingRemaining <= 0
                    ? "Đã hết lượt đăng trong tháng"
                    : "Gửi duyệt • phí 50.000 VNĐ"}
            </button>
          </div>
        </form>

        <aside className="sjf-card sjf-card--sticky">
          <div className="sjf-preview">
            <div className="sjf-preview__header">
              <div className="sjf-preview__header-icon sjf-preview__header-icon--gold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div>
                <h3 className="sjf-card__title">Xem trước tin tuyển dụng</h3>
                <p className="sjf-card__desc">Nội dung ứng viên sẽ nhìn thấy đầu tiên.</p>
              </div>
            </div>

            <div className="sjf-progress sjf-progress--gold" aria-hidden="true">
              <div
                className="sjf-progress__bar sjf-progress__bar--gold"
                style={{ width: `${(completedEssentials / 6) * 100}%` }}
              />
            </div>

            <div className="sjf-preview__hero sjf-preview__hero--gold">
              <h4 className="sjf-preview__title">
                {formData.title || "Tiêu đề vị trí sẽ hiển thị ở đây"}
              </h4>
              <JobMarkdownSurface
                content={formData.description}
                className="sjf-preview__body"
                density="preview"
                theme="gold"
                maxHeight={220}
                placeholder="Mô tả rõ đầu việc và kết quả mong đợi giúp ứng viên quyết định nhanh hơn."
              />
            </div>

            <div className="sjf-preview__grid">
              {previewMetrics.map((metric) => (
                <div key={metric.label} className="sjf-preview__metric sjf-preview__metric--gold">
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
              <div className="sjf-preview__list-item sjf-preview__list-item--gold">
                <span className="sjf-preview__list-label">Kỹ năng chính</span>
                <div className="sjf-chip-row">
                  {formData.skills.length > 0 ? (
                    formData.skills.map((skill) => (
                      <span key={skill} className="sjf-chip sjf-chip--active sjf-chip--gold">
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

              <div className="sjf-preview__list-item sjf-preview__list-item--gold">
                <span className="sjf-preview__list-label">
                  Ghi chú cho ứng viên
                </span>
                <span className="sjf-preview__list-value">
                  {`Nhận hồ sơ đến ${formData.deadline || "..."} • ${
                    Number(formData.hiringQuantity) || 1
                  } vị trí đang mở`}
                </span>
              </div>

              <div className="sjf-preview__list-item sjf-preview__list-item--gold">
                <span className="sjf-preview__list-label">Phúc lợi</span>
                <span className="sjf-preview__list-value">
                  {formData.benefits ? (
                    formData.benefits
                  ) : (
                    <span className="sjf-empty">
                      Có thể bổ sung phúc lợi ở phần mở rộng để tăng tỉ lệ ứng
                      tuyển.
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

export default MissionLaunchPad;
