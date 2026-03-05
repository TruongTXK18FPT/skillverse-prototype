import React, { useState, useEffect } from "react";
import jobService from "../../services/jobService";
import { useToast } from "../../hooks/useToast";
import { recruiterSubscriptionService } from "../../services/recruiterSubscriptionService";
import { premiumService } from "../../services/premiumService";
import "./fleet-styles.css";

interface MissionLaunchPadProps {
  onMissionLaunched?: () => void;
}

const MissionLaunchPad: React.FC<MissionLaunchPadProps> = ({
  onMissionLaunched,
}) => {
  const { showSuccess, showError } = useToast();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [jobPostingRemaining, setJobPostingRemaining] = useState(0);
  const [jobPostingUnlimited, setJobPostingUnlimited] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
    // Re-check subscription when tab becomes visible (returning from premium page)
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
      // Try recruiter-specific endpoint first
      const info = await recruiterSubscriptionService.getSubscriptionInfo();
      setHasSubscription(info.hasSubscription);
      if (info.hasSubscription) {
        setJobPostingUnlimited(info.jobPostingUnlimited);
        setJobPostingRemaining(info.jobPostingRemaining);
      } else {
        // Check if user has general premium subscription
        try {
          const generalSub = await premiumService.getCurrentSubscription();
          if (generalSub && generalSub.status === "ACTIVE") {
            const planType = generalSub.plan?.planType || "";
            const isPlusOrHigher = planType === "PREMIUM_PLUS" || planType === "RECRUITER_PRO";
            setHasSubscription(true);
            setJobPostingUnlimited(planType === "RECRUITER_PRO");
            setJobPostingRemaining(isPlusOrHigher ? 30 : 10);
            return {
              hasSubscription: true,
              jobPostingUnlimited: planType === "RECRUITER_PRO",
              jobPostingRemaining: isPlusOrHigher ? 30 : 10
            };
          }
        } catch (e) {
          console.log("General premium check failed:", e);
        }
      }
      return info;
    } catch (e) {
      console.log("Subscription check error:", e);
      // Try general premium as fallback
      try {
        const generalSub = await premiumService.getCurrentSubscription();
        if (generalSub && generalSub.status === "ACTIVE") {
          const planType = generalSub.plan?.planType || "";
          const isPlusOrHigher = planType === "PREMIUM_PLUS" || planType === "RECRUITER_PRO";
          setHasSubscription(true);
          setJobPostingUnlimited(planType === "RECRUITER_PRO");
          setJobPostingRemaining(isPlusOrHigher ? 30 : 10);
          return {
            hasSubscription: true,
            jobPostingUnlimited: planType === "RECRUITER_PRO",
            jobPostingRemaining: isPlusOrHigher ? 30 : 10
          };
        }
      } catch (e2) {
        console.log("Fallback premium check also failed:", e2);
      }
      // Not subscribed or error - keep defaults (no subscription)
      return null;
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills: [] as string[],
    minBudget: "",
    maxBudget: "",
    deadline: "",
    isRemote: true,
    location: "",
    experienceLevel: "Junior",
    jobType: "FULL_TIME",
    hiringQuantity: "1",
    genderRequirement: "ANY",
    benefits: "",
    isNegotiable: false,
  });
  const [skillInput, setSkillInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    // Handle checkbox manually since type narrowing can be tricky
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSkillAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          skills: [...prev.skills, skillInput.trim()],
        }));
        setSkillInput("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Re-fetch subscription status right before submitting to avoid stale data
    const freshInfo = await checkSubscriptionStatus();
    const currentHasSub = freshInfo?.hasSubscription ?? false;
    const currentUnlimited = freshInfo?.jobPostingUnlimited ?? false;
    const currentRemaining = freshInfo?.jobPostingRemaining ?? 0;

    // Check subscription status and show appropriate message
    let confirmMsg: string;
    if (currentHasSub && (currentUnlimited || currentRemaining > 0)) {
      const remainingText = currentUnlimited
        ? "không giới hạn"
        : `${currentRemaining}`;
      confirmMsg = `Bạn còn ${remainingText} lượt đăng tin trong gói. Bạn có muốn đăng tin không?`;
    } else if (currentHasSub && currentRemaining <= 0) {
      showError(
        "Hết quota",
        "Bạn đã hết lượt đăng tin trong tháng này. Vui lòng chờ kỳ tiếp theo hoặc nâng cấp gói.",
      );
      setIsSubmitting(false);
      return;
    } else {
      confirmMsg =
        "Lưu ý: Việc đăng tuyển dụng sẽ trừ 50.000 VNĐ vào ví của bạn. Bạn có chắc chắn muốn tiếp tục?";
    }
    if (!window.confirm(confirmMsg)) {
      setIsSubmitting(false);
      return;
    }

    try {
      await jobService.createJob({
        title: formData.title,
        description: formData.description,
        requiredSkills: formData.skills,
        minBudget: formData.isNegotiable ? 0 : Number(formData.minBudget),
        maxBudget: formData.isNegotiable ? 0 : Number(formData.maxBudget),
        deadline: formData.deadline,
        isRemote: formData.isRemote,
        location: formData.location,
        experienceLevel: formData.experienceLevel,
        jobType: formData.jobType,
        hiringQuantity: Number(formData.hiringQuantity),
        benefits: formData.benefits,
        genderRequirement: formData.genderRequirement,
        isNegotiable: formData.isNegotiable,
      });

      showSuccess(
        "Mission Initialized",
        "Operation has been successfully launched.",
      );

      // Reset form
      setFormData({
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
        genderRequirement: "ANY",
        benefits: "",
        isNegotiable: false,
      });

      if (onMissionLaunched) {
        onMissionLaunched();
      }
    } catch (error) {
      console.error("Mission Launch Failed:", error);
      showError("Launch Aborted", "Failed to initialize mission protocol.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fleet-panel">
      <div className="fleet-title">
        <i className="fas fa-rocket"></i>
        Đăng Tin Tuyển Dụng
      </div>

      <div className="fleet-form-layout">
        {/* Left: Input Fields */}
        <form onSubmit={handleSubmit}>
          <div className="fleet-input-group">
            <label className="fleet-label">Tiêu Đề Công Việc</label>
            <input
              type="text"
              name="title"
              className="fleet-input"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Ví dụ: Nâng cấp Frontend React"
              required
            />
          </div>

          <div className="fleet-input-group">
            <label className="fleet-label">Mô Tả Công Việc</label>
            <textarea
              name="description"
              className="fleet-input"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Mô tả mục tiêu..."
              rows={4}
              required
            />
          </div>

          <div className="fleet-input-group">
            <label className="fleet-label">
              Mô-đun Yêu Cầu (Kỹ Năng) - Nhấn Enter
            </label>
            <input
              type="text"
              className="fleet-input"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillAdd}
              placeholder="Nhập kỹ năng và nhấn Enter"
            />
            <div className="fleet-merc-skills" style={{ marginTop: "10px" }}>
              {formData.skills.map((skill) => (
                <span key={skill} className="fleet-chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div className="fleet-input-group">
              <label className="fleet-label">
                Cấp Bậc & Phân Bổ (Nhập tự do)
              </label>
              <input
                list="experienceLevels"
                name="experienceLevel"
                className="fleet-input"
                value={formData.experienceLevel}
                onChange={handleInputChange}
                placeholder="Ví dụ: 3 Fresher, 2 Junior..."
                title="Bạn có thể nhập nhiều cấp bậc và số lượng cụ thể (VD: 3 Junior, 1 Senior)"
              />
              <datalist id="experienceLevels">
                <option value="Intern">Thực tập sinh (Intern)</option>
                <option value="Fresher">Mới tốt nghiệp (Fresher)</option>
                <option value="Junior">Nhân viên (Junior)</option>
                <option value="Middle">Chuyên viên (Middle)</option>
                <option value="Senior">Trưởng nhóm (Senior)</option>
                <option value="Manager">Trưởng phòng (Manager)</option>
                <option value="Director">Giám đốc (Director)</option>
                <option value="Cộng tác viên">Cộng tác viên</option>
                <option value="Trưởng ca">Trưởng ca</option>
                <option value="Quản lý cửa hàng">Quản lý cửa hàng</option>
                <option value="Chuyên gia">Chuyên gia</option>
                <option value="Tư vấn viên">Tư vấn viên</option>
              </datalist>
            </div>
            <div className="fleet-input-group">
              <label className="fleet-label">
                Hình Thức Làm Việc (Nhập tự do)
              </label>
              <input
                list="jobTypes"
                name="jobType"
                className="fleet-input"
                value={formData.jobType}
                onChange={handleInputChange}
                placeholder="Ví dụ: Full-time, Remote..."
              />
              <datalist id="jobTypes">
                <option value="FULL_TIME">Toàn thời gian</option>
                <option value="PART_TIME">Bán thời gian</option>
                <option value="CONTRACT">Hợp đồng</option>
                <option value="FREELANCE">Freelance</option>
                <option value="INTERNSHIP">Thực tập</option>
                <option value="REMOTE">Làm việc từ xa (Remote)</option>
                <option value="HYBRID">Linh hoạt (Hybrid)</option>
                <option value="SEASONAL">Thời vụ</option>
              </datalist>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div className="fleet-input-group">
              <label className="fleet-label">Số Lượng Tuyển</label>
              <input
                type="number"
                name="hiringQuantity"
                className="fleet-input"
                value={formData.hiringQuantity}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
            <div className="fleet-input-group">
              <label className="fleet-label">Yêu Cầu Giới Tính</label>
              <select
                name="genderRequirement"
                className="fleet-input"
                value={formData.genderRequirement}
                onChange={handleInputChange as any}
              >
                <option value="ANY">Không yêu cầu</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
          </div>

          <div className="fleet-input-group">
            <label className="fleet-label">Quyền Lợi / Phúc Lợi</label>
            <textarea
              name="benefits"
              className="fleet-input"
              value={formData.benefits}
              onChange={handleInputChange}
              placeholder="- Lương tháng 13&#10;- Bảo hiểm đầy đủ&#10;- Laptop làm việc"
              rows={4}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div className="fleet-input-group">
              <label className="fleet-label">Ngân Sách Tối Thiểu (VND)</label>
              <input
                type="number"
                name="minBudget"
                className="fleet-input"
                value={formData.minBudget}
                onChange={handleInputChange}
                disabled={formData.isNegotiable}
                required={!formData.isNegotiable}
              />
            </div>
            <div className="fleet-input-group">
              <label className="fleet-label">Ngân Sách Tối Đa (VND)</label>
              <input
                type="number"
                name="maxBudget"
                className="fleet-input"
                value={formData.maxBudget}
                onChange={handleInputChange}
                disabled={formData.isNegotiable}
                required={!formData.isNegotiable}
              />
            </div>
          </div>

          <div
            className="fleet-input-group"
            style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}
          >
            <input
              type="checkbox"
              name="isRemote"
              checked={formData.isRemote}
              onChange={handleInputChange}
              id="remote-check"
            />
            <label
              htmlFor="remote-check"
              style={{ color: "var(--fleet-text)", cursor: "pointer" }}
            >
              Công việc từ xa (Remote)
            </label>
          </div>

          <div
            className="fleet-input-group"
            style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}
          >
            <input
              type="checkbox"
              name="isNegotiable"
              checked={formData.isNegotiable}
              onChange={handleInputChange}
              id="negotiable-check"
            />
            <label
              htmlFor="negotiable-check"
              style={{ color: "var(--fleet-text)", cursor: "pointer" }}
            >
              Thỏa thuận (Ẩn mức lương)
            </label>
          </div>

          <div className="fleet-input-group">
            <label className="fleet-label">Địa Điểm Làm Việc</label>
            <input
              type="text"
              name="location"
              className="fleet-input"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Nhập địa chỉ văn phòng..."
              disabled={formData.isRemote}
              required={!formData.isRemote}
            />
          </div>

          <div className="fleet-input-group">
            <label className="fleet-label">Hạn Chót</label>
            <input
              type="date"
              name="deadline"
              className="fleet-input"
              value={formData.deadline}
              onChange={handleInputChange}
              required
            />
          </div>

          <button
            type="submit"
            className="fleet-btn-primary"
            disabled={
              isSubmitting ||
              (hasSubscription &&
                !jobPostingUnlimited &&
                jobPostingRemaining <= 0)
            }
          >
            {isSubmitting
              ? "Đang Xử Lý..."
              : hasSubscription &&
                  (jobPostingUnlimited || jobPostingRemaining > 0)
                ? `Đăng Tin Tuyển Dụng (Gói Premium${!jobPostingUnlimited ? ` - còn ${jobPostingRemaining} lượt` : ""})`
                : hasSubscription && jobPostingRemaining <= 0
                  ? "Đã hết lượt đăng tin trong tháng"
                  : "Đăng Tin Tuyển Dụng (Phí: 50.000 VNĐ)"}
          </button>
        </form>

        {/* Right: Preview */}
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div className="fleet-label" style={{ marginBottom: "10px" }}>
            Xem Trước Tin Tuyển Dụng
          </div>

          <div
            className="fleet-panel"
            style={{ border: "1px dashed var(--fleet-cyan)" }}
          >
            <h3 style={{ color: "#fff", margin: "0 0 10px 0" }}>
              {formData.title || "Tiêu đề công việc"}
            </h3>
            <p style={{ color: "var(--fleet-text-muted)", fontSize: "0.9rem" }}>
              {formData.description || "Mô tả công việc sẽ xuất hiện ở đây..."}
            </p>

            <div style={{ marginTop: "15px" }}>
              <div className="fleet-label">Phân Bổ Ngân Sách</div>
              <div
                style={{ color: "var(--fleet-success)", fontWeight: "bold" }}
              >
                {formData.isNegotiable ? (
                  "Thỏa thuận"
                ) : (
                  <>
                    {formData.minBudget
                      ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(Number(formData.minBudget))
                      : "0"}{" "}
                    -
                    {formData.maxBudget
                      ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(Number(formData.maxBudget))
                      : "0"}
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: "15px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <div className="fleet-label">Cấp Bậc</div>
                <div style={{ color: "#fff" }}>{formData.experienceLevel}</div>
              </div>
              <div>
                <div className="fleet-label">Hình Thức</div>
                <div style={{ color: "#fff" }}>{formData.jobType}</div>
              </div>
            </div>

            <div style={{ marginTop: "15px" }}>
              <div className="fleet-label">Công Nghệ Yêu Cầu</div>
              <div className="fleet-merc-skills">
                {formData.skills.length > 0 ? (
                  formData.skills.map((s) => (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionLaunchPad;
