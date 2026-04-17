// PILOT ID MODAL - Profile Creation/Edit with Mothership Theme
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import Cropper, { Area } from "react-easy-crop";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import {
  PortfolioEducationDTO,
  PortfolioWorkExperienceDTO,
  UserProfileDTO,
} from "../../data/portfolioDTOs";
import { validateImage } from "../../services/fileUploadService";
import getCroppedImg from "../../utils/cropImage";
import { useScrollLock } from "./useScrollLock";
import SystemAlertModal from "./SystemAlertModal";
import "./dossier-portfolio-styles.css";

const RESERVED_PORTFOLIO_SLUGS = new Set(["create"]);

const createPortfolioItemId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyWorkExperience = (): PortfolioWorkExperienceDTO => ({
  id: createPortfolioItemId("work"),
  companyName: "",
  position: "",
  location: "",
  startDate: "",
  endDate: "",
  currentJob: false,
  description: "",
});

const createEmptyEducation = (): PortfolioEducationDTO => ({
  id: createPortfolioItemId("edu"),
  institution: "",
  degree: "",
  fieldOfStudy: "",
  location: "",
  startDate: "",
  endDate: "",
  status: "STUDYING",
  description: "",
});

const normalizeWorkExperienceForForm = (
  item: PortfolioWorkExperienceDTO,
): PortfolioWorkExperienceDTO => ({
  id: item.id || createPortfolioItemId("work"),
  companyName: item.companyName || "",
  position: item.position || "",
  location: item.location || "",
  startDate: item.startDate || "",
  endDate: item.endDate || "",
  currentJob: Boolean(item.currentJob),
  description: item.description || "",
});

const normalizeEducationForForm = (
  item: PortfolioEducationDTO,
): PortfolioEducationDTO => ({
  id: item.id || createPortfolioItemId("edu"),
  institution: item.institution || "",
  degree: item.degree || "",
  fieldOfStudy: item.fieldOfStudy || "",
  location: item.location || "",
  startDate: item.startDate || "",
  endDate: item.endDate || "",
  status: item.status || "STUDYING",
  description: item.description || "",
});

const parseJsonArray = (json?: string): string[] => {
  if (!json) {
    return [];
  }

  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

const hasWorkExperienceData = (item: PortfolioWorkExperienceDTO): boolean =>
  Boolean(
    item.companyName?.trim() ||
    item.position?.trim() ||
    item.location?.trim() ||
    item.startDate?.trim() ||
    item.endDate?.trim() ||
    item.description?.trim() ||
    item.currentJob,
  );

const hasEducationData = (item: PortfolioEducationDTO): boolean =>
  Boolean(
    item.institution?.trim() ||
    item.degree?.trim() ||
    item.fieldOfStudy?.trim() ||
    item.location?.trim() ||
    item.startDate?.trim() ||
    item.endDate?.trim() ||
    item.description?.trim() ||
    item.status?.trim(),
  );

const buildFormState = (source?: UserProfileDTO): Partial<UserProfileDTO> => ({
  ...source,
  fullName: source?.fullName || "",
  professionalTitle: source?.professionalTitle || "",
  careerGoals: source?.careerGoals || "",
  yearsOfExperience: source?.yearsOfExperience || 0,
  workExperiences: (source?.workExperiences || []).map(
    normalizeWorkExperienceForForm,
  ),
  educationHistory: (source?.educationHistory || []).map(
    normalizeEducationForForm,
  ),
  tagline: source?.tagline || "",
  location: source?.location || "",
  availabilityStatus: source?.availabilityStatus || "AVAILABLE",
  hourlyRate: source?.hourlyRate || 0,
  preferredCurrency: "VND",
  linkedinUrl: source?.linkedinUrl || "",
  githubUrl: source?.githubUrl || "",
  portfolioWebsiteUrl: source?.portfolioWebsiteUrl || "",
  behanceUrl: source?.behanceUrl || "",
  dribbbleUrl: source?.dribbbleUrl || "",
  topSkills: source?.topSkills || "[]",
  languagesSpoken: source?.languagesSpoken || "[]",
  achievements: source?.achievements || "",
  isPublic: source?.isPublic ?? true,
  showContactInfo: source?.showContactInfo ?? true,
  allowJobOffers: source?.allowJobOffers ?? true,
  customUrlSlug: source?.customUrlSlug || "",
  metaDescription: source?.metaDescription || "",
});

interface PilotIDModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    profile: Partial<UserProfileDTO>,
    avatar?: File,
    video?: File,
    coverImage?: File,
  ) => Promise<void>;
  initialData?: UserProfileDTO;
  mode: "create" | "edit";
  layout?: "modal" | "inline";
}

export const PilotIDModal: React.FC<PilotIDModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  layout = "modal",
}) => {
  const isInline = layout === "inline";
  useScrollLock(!isInline && isOpen);

  const inputIdPrefix = useMemo(
    () => (isInline ? "pilot-inline" : "pilot-modal"),
    [isInline],
  );

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfileDTO>>(
    buildFormState(initialData),
  );

  const [avatar, setAvatar] = useState<File | undefined>();
  const [video, setVideo] = useState<File | undefined>();
  const [coverImage, setCoverImage] = useState<File | undefined>();

  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarCropTempUrl, setAvatarCropTempUrl] = useState<string | null>(
    null,
  );
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] =
    useState<Area | null>(null);

  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    show: false,
    message: "",
    type: "info",
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(buildFormState(initialData));
    setAvatar(undefined);
    setVideo(undefined);
    setCoverImage(undefined);
    setAvatarPreview(initialData?.portfolioAvatarUrl || "");
    setVideoPreview(initialData?.videoIntroUrl || "");
    setCoverPreview(initialData?.coverImageUrl || "");
    setSkills(parseJsonArray(initialData?.topSkills));
    setLanguages(parseJsonArray(initialData?.languagesSpoken));
    setSkillInput("");
    setLanguageInput("");
  }, [isOpen, initialData]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "video" | "cover",
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (type === "avatar") {
      const validation = validateImage(file);
      if (!validation.valid) {
        setAlertModal({
          show: true,
          message: validation.error || "Ảnh đại diện không hợp lệ.",
          type: "warning",
        });
        return;
      }

      if (avatarCropTempUrl) {
        URL.revokeObjectURL(avatarCropTempUrl);
      }

      setAvatarCropTempUrl(URL.createObjectURL(file));
      setAvatarCrop({ x: 0, y: 0 });
      setAvatarZoom(1);
      setAvatarCroppedAreaPixels(null);
      setAvatarCropOpen(true);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (type === "video") {
        setVideo(file);
        setVideoPreview(preview);
      } else {
        setCoverImage(file);
        setCoverPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setAvatarCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const closeAvatarCropModal = useCallback(() => {
    setAvatarCropOpen(false);
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarZoom(1);
    setAvatarCroppedAreaPixels(null);

    if (avatarCropTempUrl) {
      URL.revokeObjectURL(avatarCropTempUrl);
    }
    setAvatarCropTempUrl(null);
  }, [avatarCropTempUrl]);

  const handleAvatarCropConfirm = async () => {
    if (!avatarCropTempUrl || !avatarCroppedAreaPixels) {
      setAlertModal({
        show: true,
        message: "Không thể xử lý ảnh đại diện. Vui lòng thử lại.",
        type: "warning",
      });
      return;
    }

    try {
      const croppedAvatar = await getCroppedImg(
        avatarCropTempUrl,
        avatarCroppedAreaPixels,
      );

      if (!croppedAvatar) {
        throw new Error("Không thể cắt ảnh đại diện.");
      }

      setAvatar(croppedAvatar);
      setAvatarPreview(URL.createObjectURL(croppedAvatar));
      closeAvatarCropModal();
    } catch (error) {
      console.error("Failed to crop pilot avatar:", error);
      setAlertModal({
        show: true,
        message: "Cắt ảnh đại diện thất bại. Vui lòng thử lại.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (avatarCropTempUrl) {
        URL.revokeObjectURL(avatarCropTempUrl);
      }
    };
  }, [avatarCropTempUrl]);

  const handleAddSkill = () => {
    const value = skillInput.trim();
    if (value && !skills.includes(value)) {
      setSkills((prev) => [...prev, value]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((item) => item !== skill));
  };

  const handleAddLanguage = () => {
    const value = languageInput.trim();
    if (value && !languages.includes(value)) {
      setLanguages((prev) => [...prev, value]);
      setLanguageInput("");
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages((prev) => prev.filter((item) => item !== lang));
  };

  const handleAddWorkExperience = () => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: [
        ...(prev.workExperiences || []),
        createEmptyWorkExperience(),
      ],
    }));
  };

  const handleUpdateWorkExperience = (
    index: number,
    field: keyof PortfolioWorkExperienceDTO,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: (prev.workExperiences || []).map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
              ...(field === "currentJob" && value === true
                ? { endDate: "" }
                : {}),
            }
          : item,
      ),
    }));
  };

  const handleRemoveWorkExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: (prev.workExperiences || []).filter(
        (_item, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const handleAddEducation = () => {
    setFormData((prev) => ({
      ...prev,
      educationHistory: [
        ...(prev.educationHistory || []),
        createEmptyEducation(),
      ],
    }));
  };

  const handleUpdateEducation = (
    index: number,
    field: keyof PortfolioEducationDTO,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      educationHistory: (prev.educationHistory || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      educationHistory: (prev.educationHistory || []).filter(
        (_item, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const maxFileSize = 10 * 1024 * 1024;
      const maxVideoSize = 50 * 1024 * 1024;

      if (avatar && avatar.size > maxFileSize) {
        setAlertModal({
          show: true,
          message: `Ảnh đại diện quá lớn (${(avatar.size / 1024 / 1024).toFixed(2)}MB). Tối đa 10MB.`,
          type: "warning",
        });
        setLoading(false);
        return;
      }

      if (video && video.size > maxVideoSize) {
        setAlertModal({
          show: true,
          message: `Video quá lớn (${(video.size / 1024 / 1024).toFixed(2)}MB). Tối đa 50MB.`,
          type: "warning",
        });
        setLoading(false);
        return;
      }

      if (coverImage && coverImage.size > maxFileSize) {
        setAlertModal({
          show: true,
          message: `Ảnh bìa quá lớn (${(coverImage.size / 1024 / 1024).toFixed(2)}MB). Tối đa 10MB.`,
          type: "warning",
        });
        setLoading(false);
        return;
      }

      const normalizedSlug = (formData.customUrlSlug || "")
        .trim()
        .toLowerCase();
      if (normalizedSlug && RESERVED_PORTFOLIO_SLUGS.has(normalizedSlug)) {
        setAlertModal({
          show: true,
          message: `"${normalizedSlug}" là slug dự trữ hệ thống. Vui lòng chọn slug khác.`,
          type: "warning",
        });
        setLoading(false);
        return;
      }

      const workExperiences = (formData.workExperiences || [])
        .map(normalizeWorkExperienceForForm)
        .filter(hasWorkExperienceData);
      const educationHistory = (formData.educationHistory || [])
        .map(normalizeEducationForForm)
        .filter(hasEducationData);

      const profileData: Partial<UserProfileDTO> = {
        ...formData,
        preferredCurrency: "VND",
        customUrlSlug: normalizedSlug,
        topSkills: JSON.stringify(skills),
        languagesSpoken: JSON.stringify(languages),
        workExperiences,
        educationHistory,
      };

      await onSubmit(profileData, avatar, video, coverImage);
      onClose();
    } catch (error: any) {
      console.error("Error submitting profile:", error);
      console.error("Error response:", error?.response?.data);
      console.error("Error status:", error?.response?.status);
      let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại.";
      if (error?.response?.data?.message) {
        errorMessage = `Lỗi: ${error.response.data.message}`;
      } else if (error instanceof Error) {
        errorMessage = `Lỗi: ${error.message}`;
      }
      setAlertModal({
        show: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const shellClassName = isInline
    ? "dossier-inline-editor-shell"
    : "dossier-modal-container";

  const modalContent = (
    <div
      className={shellClassName}
      onClick={(event) => {
        if (!isInline) {
          event.stopPropagation();
        }
      }}
    >
      {avatarCropOpen && avatarCropTempUrl && (
        <div
          className="dossier-avatar-crop-overlay"
          onClick={closeAvatarCropModal}
        >
          <div
            className="dossier-avatar-crop-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dossier-avatar-crop-modal__header">
              <h3>Chỉnh ảnh đại diện Portfolio</h3>
              <button
                type="button"
                className="dossier-avatar-crop-modal__close"
                onClick={closeAvatarCropModal}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <p className="dossier-avatar-crop-modal__hint">
              Kéo ảnh để căn khung tròn, sau đó chỉnh vị trí trái/phải và zoom.
            </p>

            <div className="dossier-avatar-crop-stage">
              <Cropper
                image={avatarCropTempUrl}
                crop={avatarCrop}
                zoom={avatarZoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                objectFit="horizontal-cover"
                onCropChange={setAvatarCrop}
                onCropComplete={handleAvatarCropComplete}
                onZoomChange={setAvatarZoom}
              />
            </div>

            <div className="dossier-avatar-crop-control">
              <label htmlFor={`${inputIdPrefix}-avatar-horizontal-position`}>
                Vị trí trái / phải
              </label>
              <input
                id={`${inputIdPrefix}-avatar-horizontal-position`}
                type="range"
                min={-200}
                max={200}
                step={1}
                value={avatarCrop.x}
                onChange={(event) =>
                  setAvatarCrop((prev) => ({
                    ...prev,
                    x: Number(event.target.value),
                  }))
                }
              />
            </div>

            <div className="dossier-avatar-crop-control">
              <label htmlFor={`${inputIdPrefix}-avatar-zoom-level`}>Zoom</label>
              <input
                id={`${inputIdPrefix}-avatar-zoom-level`}
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={avatarZoom}
                onChange={(event) => setAvatarZoom(Number(event.target.value))}
              />
            </div>

            <div className="dossier-avatar-crop-modal__actions">
              <button
                type="button"
                className="dossier-btn-secondary"
                onClick={closeAvatarCropModal}
              >
                Hủy
              </button>
              <button
                type="button"
                className="dossier-btn-primary"
                onClick={handleAvatarCropConfirm}
              >
                Lưu ảnh đại diện
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dossier-modal-header">
        <div>
          <h2 className="dossier-modal-title">
            {mode === "create"
              ? "Tạo hồ sơ cá nhân"
              : "Chỉnh sửa hồ sơ cá nhân"}
          </h2>
          <p className="dossier-modal-subtitle">
            {isInline
              ? "Cập nhật nhanh ngay trong trang Portfolio."
              : "Cấu hình thông tin hồ sơ nghề nghiệp"}
          </p>
        </div>
        <button className="dossier-modal-close" onClick={onClose} type="button">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="dossier-modal-body">
        {/* Professional Info */}
        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Thông tin cá nhân</h3>

          <div className="dossier-form-group">
            <label className="dossier-form-label">Họ và tên *</label>
            <input
              type="text"
              className="dossier-input"
              value={formData.fullName || ""}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="Ví dụ: Nguyễn Văn A"
              required
            />
          </div>

          <div className="dossier-form-group">
            <label className="dossier-form-label">Chức danh *</label>
            <input
              type="text"
              className="dossier-input"
              value={formData.professionalTitle || ""}
              onChange={(e) =>
                setFormData({ ...formData, professionalTitle: e.target.value })
              }
              placeholder="Ví dụ: Lập trình viên Full Stack"
              required
            />
          </div>

          <div className="dossier-form-group">
            <label className="dossier-form-label">Khẩu hiệu</label>
            <input
              type="text"
              className="dossier-input"
              value={formData.tagline || ""}
              onChange={(e) =>
                setFormData({ ...formData, tagline: e.target.value })
              }
              placeholder="Ví dụ: Xây dựng trải nghiệm web tuyệt vời"
              maxLength={100}
            />
          </div>

          <div className="dossier-form-row">
            <div className="dossier-form-group">
              <label className="dossier-form-label">Kinh nghiệm (năm)</label>
              <input
                type="number"
                className="dossier-input"
                value={formData.yearsOfExperience || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    yearsOfExperience: parseInt(e.target.value, 10) || 0,
                  })
                }
                min="0"
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Địa điểm</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.location || ""}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Ví dụ: TP.HCM, Việt Nam"
              />
            </div>
          </div>

          <div className="dossier-form-group" style={{ marginBottom: 0 }}>
            <label className="dossier-form-label">Mục tiêu nghề nghiệp</label>
            <textarea
              className="dossier-textarea"
              value={formData.careerGoals || ""}
              onChange={(e) =>
                setFormData({ ...formData, careerGoals: e.target.value })
              }
              placeholder="Mô tả mục tiêu nghề nghiệp..."
              rows={4}
            />
          </div>
        </div>

        {/* Work Experience */}
        <div className="dossier-form-section">
          <div className="dossier-inline-section-heading">
            <h3
              className="dossier-form-section-title"
              style={{ marginBottom: 0 }}
            >
              Kinh nghiệm làm việc
            </h3>
            <button
              type="button"
              className="dossier-btn-secondary"
              onClick={handleAddWorkExperience}
            >
              <Plus size={14} />
              Thêm kinh nghiệm
            </button>
          </div>

          {(formData.workExperiences || []).length === 0 ? (
            <p className="dossier-inline-helper-text">
              Chưa có kinh nghiệm làm việc. Bạn có thể thêm ngay để làm hồ sơ rõ
              ràng hơn.
            </p>
          ) : (
            (formData.workExperiences || []).map((experience, index) => (
              <div
                key={experience.id || index}
                className="dossier-inline-record-card"
              >
                <div className="dossier-inline-record-head">
                  <span className="dossier-inline-record-title">
                    Kinh nghiệm #{index + 1}
                  </span>
                  <button
                    type="button"
                    className="dossier-inline-record-remove"
                    onClick={() => handleRemoveWorkExperience(index)}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>

                <div className="dossier-form-row">
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Công ty</label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={experience.companyName || ""}
                      onChange={(e) =>
                        handleUpdateWorkExperience(
                          index,
                          "companyName",
                          e.target.value,
                        )
                      }
                      placeholder="Ví dụ: FPT Software"
                    />
                  </div>
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Vị trí</label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={experience.position || ""}
                      onChange={(e) =>
                        handleUpdateWorkExperience(
                          index,
                          "position",
                          e.target.value,
                        )
                      }
                      placeholder="Ví dụ: Frontend Developer"
                    />
                  </div>
                </div>

                <div className="dossier-form-row">
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Địa điểm</label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={experience.location || ""}
                      onChange={(e) =>
                        handleUpdateWorkExperience(
                          index,
                          "location",
                          e.target.value,
                        )
                      }
                      placeholder="TP.HCM / Remote"
                    />
                  </div>
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Bắt đầu</label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={experience.startDate || ""}
                      onChange={(e) =>
                        handleUpdateWorkExperience(
                          index,
                          "startDate",
                          e.target.value,
                        )
                      }
                      placeholder="01/2023"
                    />
                  </div>
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Kết thúc</label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={experience.endDate || ""}
                      onChange={(e) =>
                        handleUpdateWorkExperience(
                          index,
                          "endDate",
                          e.target.value,
                        )
                      }
                      placeholder="12/2024"
                      disabled={Boolean(experience.currentJob)}
                    />
                  </div>
                </div>

                <label className="dossier-inline-checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(experience.currentJob)}
                    onChange={(e) =>
                      handleUpdateWorkExperience(
                        index,
                        "currentJob",
                        e.target.checked,
                      )
                    }
                  />
                  Đang làm việc tại đây
                </label>

                <div className="dossier-form-group" style={{ marginBottom: 0 }}>
                  <label className="dossier-form-label">Mô tả</label>
                  <textarea
                    className="dossier-textarea"
                    value={experience.description || ""}
                    onChange={(e) =>
                      handleUpdateWorkExperience(
                        index,
                        "description",
                        e.target.value,
                      )
                    }
                    rows={3}
                    placeholder="Mô tả vai trò, phạm vi công việc hoặc thành tựu chính"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Education */}
        <div className="dossier-form-section">
          <div className="dossier-inline-section-heading">
            <h3
              className="dossier-form-section-title"
              style={{ marginBottom: 0 }}
            >
              Học vấn
            </h3>
            <button
              type="button"
              className="dossier-btn-secondary"
              onClick={handleAddEducation}
            >
              <Plus size={14} />
              Thêm học vấn
            </button>
          </div>

          {(formData.educationHistory || []).length === 0 ? (
            <p className="dossier-inline-helper-text">
              Chưa có thông tin học vấn. Bạn có thể bổ sung để hoàn thiện
              Portfolio.
            </p>
          ) : (
            (formData.educationHistory || []).map((education, index) => (
              <div
                key={education.id || index}
                className="dossier-inline-record-card"
              >
                <div className="dossier-inline-record-head">
                  <span className="dossier-inline-record-title">
                    Học vấn #{index + 1}
                  </span>
                  <button
                    type="button"
                    className="dossier-inline-record-remove"
                    onClick={() => handleRemoveEducation(index)}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>

                <div className="dossier-form-row">
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">
                      Trường / tổ chức đào tạo
                    </label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={education.institution || ""}
                      onChange={(e) =>
                        handleUpdateEducation(
                          index,
                          "institution",
                          e.target.value,
                        )
                      }
                      placeholder="Ví dụ: Đại học FPT"
                    />
                  </div>
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">
                      Bằng cấp / chương trình
                    </label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={education.degree || ""}
                      onChange={(e) =>
                        handleUpdateEducation(index, "degree", e.target.value)
                      }
                      placeholder="Ví dụ: Cử nhân CNTT"
                    />
                  </div>
                </div>

                <div className="dossier-form-row">
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Chuyên ngành</label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={education.fieldOfStudy || ""}
                      onChange={(e) =>
                        handleUpdateEducation(
                          index,
                          "fieldOfStudy",
                          e.target.value,
                        )
                      }
                      placeholder="Ví dụ: Kỹ thuật phần mềm"
                    />
                  </div>
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Địa điểm</label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={education.location || ""}
                      onChange={(e) =>
                        handleUpdateEducation(index, "location", e.target.value)
                      }
                      placeholder="TP.HCM"
                    />
                  </div>
                </div>

                <div className="dossier-form-row">
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Bắt đầu</label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={education.startDate || ""}
                      onChange={(e) =>
                        handleUpdateEducation(
                          index,
                          "startDate",
                          e.target.value,
                        )
                      }
                      placeholder="2020"
                    />
                  </div>
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Kết thúc</label>
                    <input
                      type="text"
                      className="dossier-input"
                      value={education.endDate || ""}
                      onChange={(e) =>
                        handleUpdateEducation(index, "endDate", e.target.value)
                      }
                      placeholder="2024"
                    />
                  </div>
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Trạng thái</label>
                    <select
                      className="dossier-select"
                      value={education.status || "STUDYING"}
                      onChange={(e) =>
                        handleUpdateEducation(index, "status", e.target.value)
                      }
                    >
                      <option value="STUDYING">Đang học</option>
                      <option value="GRADUATED">Đã tốt nghiệp</option>
                    </select>
                  </div>
                </div>

                <div className="dossier-form-group" style={{ marginBottom: 0 }}>
                  <label className="dossier-form-label">Ghi chú</label>
                  <textarea
                    className="dossier-textarea"
                    value={education.description || ""}
                    onChange={(e) =>
                      handleUpdateEducation(
                        index,
                        "description",
                        e.target.value,
                      )
                    }
                    rows={3}
                    placeholder="Thêm thông tin về chương trình, thành tích hoặc ghi chú khác"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Media Uploads */}
        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Tài nguyên phương tiện</h3>

          <div className="dossier-form-row">
            <div className="dossier-form-group">
              <label className="dossier-form-label">Ảnh đại diện</label>
              <div
                style={{
                  border: "1px solid var(--dossier-border-silver)",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt="Ảnh đại diện"
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                      marginBottom: "1rem",
                      clipPath:
                        "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                    }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "avatar")}
                  id={`${inputIdPrefix}-avatar-upload`}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor={`${inputIdPrefix}-avatar-upload`}
                  className="dossier-btn-primary"
                  style={{ cursor: "pointer" }}
                >
                  <Upload size={18} />
                  Tải ảnh đại diện
                </label>
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Ảnh bìa</label>
              <div
                style={{
                  border: "1px solid var(--dossier-border-silver)",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                {coverPreview && (
                  <img
                    src={coverPreview}
                    alt="Ảnh bìa"
                    style={{
                      width: "100%",
                      height: "100px",
                      objectFit: "cover",
                      marginBottom: "1rem",
                    }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "cover")}
                  id={`${inputIdPrefix}-cover-upload`}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor={`${inputIdPrefix}-cover-upload`}
                  className="dossier-btn-primary"
                  style={{ cursor: "pointer" }}
                >
                  <Upload size={18} />
                  Tải ảnh bìa
                </label>
              </div>
            </div>
          </div>

          <div className="dossier-form-group" style={{ marginBottom: 0 }}>
            <label className="dossier-form-label">Video giới thiệu</label>
            <div
              style={{
                border: "1px solid var(--dossier-border-silver)",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              {videoPreview && (
                <video
                  src={videoPreview}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    marginBottom: "1rem",
                  }}
                />
              )}
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e, "video")}
                id={`${inputIdPrefix}-video-upload`}
                style={{ display: "none" }}
              />
              <label
                htmlFor={`${inputIdPrefix}-video-upload`}
                className="dossier-btn-primary"
                style={{ cursor: "pointer" }}
              >
                <Upload size={18} />
                Tải video
              </label>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Liên kết ngoài</h3>

          <div className="dossier-form-group">
            <label className="dossier-form-label">LinkedIn</label>
            <input
              type="url"
              className="dossier-input"
              value={formData.linkedinUrl || ""}
              onChange={(e) =>
                setFormData({ ...formData, linkedinUrl: e.target.value })
              }
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="dossier-form-group">
            <label className="dossier-form-label">GitHub</label>
            <input
              type="url"
              className="dossier-input"
              value={formData.githubUrl || ""}
              onChange={(e) =>
                setFormData({ ...formData, githubUrl: e.target.value })
              }
              placeholder="https://github.com/yourusername"
            />
          </div>

          <div className="dossier-form-row">
            <div className="dossier-form-group">
              <label className="dossier-form-label">Trang Portfolio</label>
              <input
                type="url"
                className="dossier-input"
                value={formData.portfolioWebsiteUrl || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    portfolioWebsiteUrl: e.target.value,
                  })
                }
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Behance</label>
              <input
                type="url"
                className="dossier-input"
                value={formData.behanceUrl || ""}
                onChange={(e) =>
                  setFormData({ ...formData, behanceUrl: e.target.value })
                }
                placeholder="https://behance.net/you"
              />
            </div>
          </div>
        </div>

        {/* Skills & Languages */}
        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Kỹ năng & Ngôn ngữ</h3>

          <div className="dossier-form-group">
            <label className="dossier-form-label">Kỹ năng cốt lõi</label>
            <div
              style={{
                border: "1px solid var(--dossier-border-silver)",
                padding: "0.75rem",
              }}
            >
              <div
                className="dossier-module-tags"
                style={{ marginBottom: "0.75rem" }}
              >
                {skills.map((skill, idx) => (
                  <span key={idx} className="dossier-module-tag">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{
                        marginLeft: "0.5rem",
                        background: "none",
                        border: "none",
                        color: "var(--dossier-cyan)",
                        cursor: "pointer",
                        fontSize: "1.25rem",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  className="dossier-input"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Thêm kỹ năng và nhấn Enter"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="dossier-btn-primary"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="dossier-form-group" style={{ marginBottom: 0 }}>
            <label className="dossier-form-label">Ngôn ngữ</label>
            <div
              style={{
                border: "1px solid var(--dossier-border-silver)",
                padding: "0.75rem",
              }}
            >
              <div
                className="dossier-module-tags"
                style={{ marginBottom: "0.75rem" }}
              >
                {languages.map((lang, idx) => (
                  <span key={idx} className="dossier-module-tag">
                    {lang}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      style={{
                        marginLeft: "0.5rem",
                        background: "none",
                        border: "none",
                        color: "var(--dossier-cyan)",
                        cursor: "pointer",
                        fontSize: "1.25rem",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  className="dossier-input"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLanguage();
                    }
                  }}
                  placeholder="Thêm ngôn ngữ và nhấn Enter"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="dossier-btn-primary"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rate & Availability */}
        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Khả dụng & giá</h3>

          <div className="dossier-form-row">
            <div className="dossier-form-group">
              <label className="dossier-form-label">Trạng thái</label>
              <select
                className="dossier-select"
                value={formData.availabilityStatus || "AVAILABLE"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availabilityStatus: e.target.value,
                  })
                }
              >
                <option value="AVAILABLE">Sẵn sàng</option>
                <option value="BUSY">Bận</option>
                <option value="NOT_AVAILABLE">Không sẵn sàng</option>
              </select>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Giá theo giờ</label>
              <input
                type="number"
                className="dossier-input"
                value={formData.hourlyRate || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hourlyRate: parseFloat(e.target.value) || 0,
                  })
                }
                min="0"
                step="1000"
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Đơn vị tiền tệ</label>
              <div className="dossier-static-field">VND</div>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Cài đặt quyền riêng tư</h3>

          <div className="dossier-toggle-list">
            <label className="dossier-toggle-card">
              <input
                type="checkbox"
                className="dossier-toggle-input"
                checked={formData.isPublic || false}
                onChange={(e) =>
                  setFormData({ ...formData, isPublic: e.target.checked })
                }
              />
              <div className="dossier-toggle-content">
                <span className="dossier-toggle-title">
                  Công khai Portfolio
                </span>
                <span className="dossier-toggle-desc">
                  Cho phép người khác xem hồ sơ của bạn qua liên kết Portfolio.
                </span>
              </div>
            </label>

            <label className="dossier-toggle-card">
              <input
                type="checkbox"
                className="dossier-toggle-input"
                checked={formData.showContactInfo || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    showContactInfo: e.target.checked,
                  })
                }
              />
              <div className="dossier-toggle-content">
                <span className="dossier-toggle-title">
                  Hiển thị thông tin liên hệ
                </span>
                <span className="dossier-toggle-desc">
                  Hiển thị số điện thoại và các liên kết mạng xã hội trên hồ sơ
                  công khai.
                </span>
              </div>
            </label>

            <label className="dossier-toggle-card">
              <input
                type="checkbox"
                className="dossier-toggle-input"
                checked={formData.allowJobOffers || false}
                onChange={(e) =>
                  setFormData({ ...formData, allowJobOffers: e.target.checked })
                }
              />
              <div className="dossier-toggle-content">
                <span className="dossier-toggle-title">
                  Nhận đề nghị việc làm
                </span>
                <span className="dossier-toggle-desc">
                  Cho phép nhà tuyển dụng hoặc đối tác gửi lời mời hợp tác.
                </span>
              </div>
            </label>
          </div>

          <div
            className="dossier-form-group"
            style={{ marginTop: "1rem", marginBottom: 0 }}
          >
            <label className="dossier-form-label">
              Đường dẫn tùy chỉnh (slug)
            </label>
            <input
              type="text"
              className="dossier-input"
              value={formData.customUrlSlug || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customUrlSlug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, ""),
                })
              }
              placeholder="Ví dụ: john-doe-developer"
            />
            <small
              style={{
                color: "var(--dossier-silver-dark)",
                fontSize: "0.75rem",
                marginTop: "0.25rem",
                display: "block",
              }}
            >
              Liên kết: /portfolio/
              {formData.customUrlSlug || "duong-dan-cua-ban"}
            </small>
          </div>
        </div>

        <div
          className="dossier-modal-footer"
          style={{ borderTop: "none", paddingTop: 0 }}
        >
          <button
            type="button"
            onClick={onClose}
            className="dossier-btn-secondary"
            disabled={loading}
          >
            {isInline ? "Đóng" : "Hủy"}
          </button>
          <button
            type="submit"
            className="dossier-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <MeowlKuruLoader size="tiny" text="" />
                Đang lưu...
              </>
            ) : mode === "create" ? (
              "Tạo ID"
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      {isInline ? (
        <div className="dossier-inline-editor-wrap">{modalContent}</div>
      ) : (
        <div className="dossier-modal-overlay" onClick={onClose}>
          {modalContent}
        </div>
      )}

      <SystemAlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        message={alertModal.message}
        type={alertModal.type}
      />
    </>
  );
};

export default PilotIDModal;
