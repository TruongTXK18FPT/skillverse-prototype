import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Sparkles, Upload, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Cropper, { type Area } from "react-easy-crop";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import LoginRequiredModal from "../auth/LoginRequiredModal";
import SystemAlertModal from "./SystemAlertModal";
// MeowlGuide intentionally not imported — hidden on this page
import portfolioService from "../../services/portfolioService";
import userService from "../../services/userService";
import { validateImage } from "../../services/fileUploadService";
import getCroppedImg from "../../utils/cropImage";
import { UserProfileDTO } from "../../data/portfolioDTOs";
import "./dossier-portfolio-styles.css";
import "./dossier-create-portfolio-styles.css";

const RESERVED_PORTFOLIO_SLUGS = new Set(["create"]);
const QUICK_SKILL_SUGGESTIONS = [
  "Giao tiếp",
  "Làm việc nhóm",
  "Giải quyết vấn đề",
  "Quản lý thời gian",
  "React",
  "Node.js",
];
const QUICK_LANGUAGE_SUGGESTIONS = ["Tiếng Việt", "English", "日本語", "한국어"];

const buildSlugFromName = (input?: string) => {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
};

const DossierCreatePortfolioPage = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileCheckError, setProfileCheckError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    show: false,
    message: "",
    type: "info",
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [formData, setFormData] = useState<Partial<UserProfileDTO>>({
    fullName: "",
    professionalTitle: "",
    careerGoals: "",
    yearsOfExperience: 0,
    tagline: "",
    location: "",
    availabilityStatus: "AVAILABLE",
    hourlyRate: 0,
    preferredCurrency: "VND",
    linkedinUrl: "",
    githubUrl: "",
    portfolioWebsiteUrl: "",
    behanceUrl: "",
    dribbbleUrl: "",
    topSkills: "[]",
    languagesSpoken: "[]",
    isPublic: true,
    showContactInfo: true,
    allowJobOffers: true,
    customUrlSlug: "",
    metaDescription: "",
  });

  const [avatar, setAvatar] = useState<File | undefined>();
  const [video, setVideo] = useState<File | undefined>();
  const [coverImage, setCoverImage] = useState<File | undefined>();

  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarCropTempUrl, setAvatarCropTempUrl] = useState<string | null>(null);
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] =
    useState<Area | null>(null);

  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [loadingSmartFill, setLoadingSmartFill] = useState(false);
  const [manualSlugEdited, setManualSlugEdited] = useState(false);

  useEffect(() => {
    const checkProfileState = async () => {
      if (!isAuthenticated) {
        setCheckingProfile(false);
        return;
      }

      try {
        const checkResult = await portfolioService.checkExtendedProfile();
        if (checkResult.hasExtendedProfile) {
          navigate("/portfolio", { replace: true });
          return;
        }
        setProfileCheckError(null);
      } catch (error) {
        console.error("Failed to check profile state before create page:", error);
        setProfileCheckError("Không thể kiểm tra trạng thái Portfolio. Vui lòng thử lại.");
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfileState();
  }, [isAuthenticated, navigate]);

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
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
      if (type === "avatar") {
        setAvatar(file);
        setAvatarPreview(preview);
      } else if (type === "video") {
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
      console.error("Failed to crop dossier avatar:", error);
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
    const next = skillInput.trim();
    if (next && !skills.includes(next)) {
      setSkills([...skills, next]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((item) => item !== skill));
  };

  const handleAddLanguage = () => {
    const next = languageInput.trim();
    if (next && !languages.includes(next)) {
      setLanguages([...languages, next]);
      setLanguageInput("");
    }
  };

  const handleRemoveLanguage = (language: string) => {
    setLanguages(languages.filter((item) => item !== language));
  };

  const handleQuickAddSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const handleQuickAddLanguage = (language: string) => {
    if (!languages.includes(language)) {
      setLanguages([...languages, language]);
    }
  };

  const handleApplyStarterPreset = () => {
    setFormData((prev) => ({
      ...prev,
      professionalTitle: prev.professionalTitle || "Freelancer",
      availabilityStatus: prev.availabilityStatus || "AVAILABLE",
      yearsOfExperience: prev.yearsOfExperience ?? 0,
      hourlyRate: prev.hourlyRate ?? 0,
      preferredCurrency: "VND",
    }));

    if (languages.length === 0) {
      setLanguages(["Tiếng Việt"]);
    }
    if (skills.length === 0) {
      setSkills(["Giao tiếp", "Giải quyết vấn đề"]);
    }
  };

  const handleSmartFillFromAccount = async () => {
    if (loadingSmartFill) return;
    setLoadingSmartFill(true);

    try {
      const [profileResult, skillsResult] = await Promise.allSettled([
        userService.getMyProfile(),
        userService.getMySkills(),
      ]);

      const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
      const profileSkills = skillsResult.status === "fulfilled" ? skillsResult.value : [];

      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName?.trim() ? prev.fullName : profile?.fullName || user?.fullName || "",
        professionalTitle: prev.professionalTitle?.trim()
          ? prev.professionalTitle
          : "Freelancer",
        location: prev.location?.trim()
          ? prev.location
          : profile?.region || "",
        careerGoals: prev.careerGoals?.trim()
          ? prev.careerGoals
          : profile?.bio || "",
        preferredCurrency: "VND",
      }));

      if (!avatarPreview) {
        const avatarUrl = profile?.avatarMediaUrl || user?.avatarMediaUrl || user?.avatarUrl;
        if (avatarUrl) {
          setAvatarPreview(avatarUrl);
        }
      }

      if (skills.length === 0 && profileSkills.length > 0) {
        setSkills(profileSkills.map((item) => item.skillName).filter(Boolean).slice(0, 8));
      }

      if (languages.length === 0) {
        setLanguages(["Tiếng Việt"]);
      }

      setAlertModal({
        show: true,
        message: "Đã tự điền dữ liệu từ hồ sơ tài khoản. Bạn chỉ cần rà và chỉnh các mục cần thiết.",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to smart fill portfolio form:", error);
      setAlertModal({
        show: true,
        message: "Không thể tự điền từ hồ sơ tài khoản. Vui lòng nhập thủ công các mục cần thiết.",
        type: "warning",
      });
    } finally {
      setLoadingSmartFill(false);
    }
  };

  const handleRegenerateSlug = () => {
    const generated = buildSlugFromName(formData.fullName);
    setManualSlugEdited(false);
    setFormData((prev) => ({
      ...prev,
      customUrlSlug: generated,
    }));
  };

  useEffect(() => {
    if (manualSlugEdited) return;
    const generated = buildSlugFromName(formData.fullName);
    setFormData((prev) => {
      if ((prev.customUrlSlug || "") === generated) return prev;
      return {
        ...prev,
        customUrlSlug: generated,
      };
    });
  }, [formData.fullName, manualSlugEdited]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const maxImageSize = 10 * 1024 * 1024;
      const maxVideoSize = 50 * 1024 * 1024;

      if (avatar && avatar.size > maxImageSize) {
        setAlertModal({
          show: true,
          message: `Ảnh đại diện vượt giới hạn (${(avatar.size / 1024 / 1024).toFixed(2)}MB). Tối đa 10MB.`,
          type: "warning",
        });
        setSubmitting(false);
        return;
      }

      if (video && video.size > maxVideoSize) {
        setAlertModal({
          show: true,
          message: `Video vượt giới hạn (${(video.size / 1024 / 1024).toFixed(2)}MB). Tối đa 50MB.`,
          type: "warning",
        });
        setSubmitting(false);
        return;
      }

      if (coverImage && coverImage.size > maxImageSize) {
        setAlertModal({
          show: true,
          message: `Ảnh bìa vượt giới hạn (${(coverImage.size / 1024 / 1024).toFixed(2)}MB). Tối đa 10MB.`,
          type: "warning",
        });
        setSubmitting(false);
        return;
      }

      const normalizedSlug = (formData.customUrlSlug || "").trim().toLowerCase();
      if (normalizedSlug && RESERVED_PORTFOLIO_SLUGS.has(normalizedSlug)) {
        setAlertModal({
          show: true,
          message: `"${normalizedSlug}" là slug hệ thống, vui lòng chọn slug khác.`,
          type: "warning",
        });
        setSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        preferredCurrency: "VND",
        topSkills: JSON.stringify(skills),
        languagesSpoken: JSON.stringify(languages),
      };

      await portfolioService.createExtendedProfile(payload, avatar, video, coverImage);
      navigate("/portfolio", { replace: true });
    } catch (error) {
      console.error("Error creating portfolio profile:", error);
      if (error instanceof Error) {
        setAlertModal({
          show: true,
          message: `Không thể tạo hồ sơ: ${error.message}`,
          type: "error",
        });
      } else {
        setAlertModal({
          show: true,
          message: "Không thể tạo hồ sơ. Vui lòng thử lại.",
          type: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="dossier-portfolio-container" data-theme={theme}>
        <div className="dossier-create-loading-wrap">
          <MeowlKuruLoader text="Đang khởi tạo trang tạo Portfolio..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="dossier-portfolio-container" data-theme={theme}>
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Đăng nhập để tạo Portfolio"
          message="Bạn cần đăng nhập để tạo hồ sơ portfolio"
          feature="Tạo Portfolio"
        />

        <div className="dossier-create-auth-panel dossier-panel-frame">
          <h2 className="dossier-modal-title dossier-create-auth-title">Cần đăng nhập</h2>
          <p className="dossier-create-auth-desc">
            Bạn cần đăng nhập để tạo Portfolio.
          </p>
          <div className="dossier-create-auth-actions">
            <button onClick={() => setShowLoginModal(true)} className="dossier-btn-primary">
              Đăng nhập
            </button>
            <button
              onClick={() => navigate("/register")}
              className="dossier-btn-secondary"
            >
              Tạo tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (profileCheckError) {
    return (
      <div className="dossier-portfolio-container" data-theme={theme}>
        <div className="dossier-create-auth-panel dossier-panel-frame">
          <h2 className="dossier-modal-title dossier-create-auth-title">Không thể khởi tạo trang</h2>
          <p className="dossier-create-auth-desc">{profileCheckError}</p>
          <div className="dossier-create-auth-actions">
            <button onClick={() => navigate(0)} className="dossier-btn-primary">
              Thử lại
            </button>
            <button onClick={() => navigate("/portfolio")} className="dossier-btn-secondary">
              Quay lại Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dossier-portfolio-container dossier-create-shell" data-theme={theme}>
      {avatarCropOpen && avatarCropTempUrl && (
        <div className="dossier-avatar-crop-overlay" onClick={closeAvatarCropModal}>
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
              <label htmlFor="dossier-avatar-horizontal-position">
                Vị trí trái / phải
              </label>
              <input
                id="dossier-avatar-horizontal-position"
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
              <label htmlFor="dossier-avatar-zoom-level">Zoom</label>
              <input
                id="dossier-avatar-zoom-level"
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

      <div className="dossier-create-topbar">
        <button
          type="button"
          className="dossier-btn-secondary dossier-create-back-btn"
          onClick={() => navigate("/portfolio")}
        >
          <ArrowLeft size={16} />
          Quay lại Portfolio
        </button>
      </div>

      <div className="dossier-create-hero dossier-panel-frame">
        <h1 className="dossier-create-title">Khởi Tạo Hồ Sơ Portfolio</h1>
        <p className="dossier-create-subtitle">
          Hoàn tất thông tin cơ bản để kích hoạt trang Portfolio cá nhân.
        </p>
      </div>

      <div className="dossier-create-smart-panel dossier-panel-frame">
        <div className="dossier-create-smart-head">
          <h3 className="dossier-create-smart-title">
            <Sparkles size={16} />
            Gợi ý nhập nhanh
          </h3>
          <p className="dossier-create-smart-desc">
            Tự điền dữ liệu có sẵn để giảm thao tác nhập tay.
          </p>
        </div>
        <div className="dossier-create-smart-actions">
          <button
            type="button"
            className="dossier-btn-primary dossier-create-smart-btn"
            onClick={handleSmartFillFromAccount}
            disabled={loadingSmartFill}
          >
            <Wand2 size={16} />
            {loadingSmartFill ? "Đang lấy dữ liệu..." : "Tự điền từ tài khoản"}
          </button>
          <button
            type="button"
            className="dossier-btn-secondary dossier-create-smart-btn"
            onClick={handleApplyStarterPreset}
            disabled={submitting}
          >
            Điền mẫu cơ bản
          </button>
          <button
            type="button"
            className="dossier-btn-secondary dossier-create-smart-btn"
            onClick={() => setShowAdvancedFields((prev) => !prev)}
          >
            {showAdvancedFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showAdvancedFields ? "Ẩn mục nâng cao" : "Hiện mục nâng cao"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="dossier-create-form dossier-panel-frame">
        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Thông tin cá nhân</h3>

          <div className="dossier-form-group">
            <label className="dossier-form-label">Họ và tên *</label>
            <input
              type="text"
              className="dossier-input"
              value={formData.fullName || ""}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Ví dụ: Xây dựng sản phẩm số thực tế"
              maxLength={100}
            />
          </div>

          <div className="dossier-form-row">
            <div className="dossier-form-group">
              <label className="dossier-form-label">Số năm kinh nghiệm</label>
              <input
                type="number"
                className="dossier-input"
                value={formData.yearsOfExperience || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    yearsOfExperience: Number.parseInt(e.target.value, 10) || 0,
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
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ví dụ: TP.HCM, Việt Nam"
              />
            </div>
          </div>

          <div className="dossier-form-group">
            <label className="dossier-form-label">Mục tiêu nghề nghiệp</label>
            <textarea
              className="dossier-textarea"
              value={formData.careerGoals || ""}
              onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
              placeholder="Mô tả ngắn gọn mục tiêu nghề nghiệp..."
              rows={4}
            />
          </div>
        </div>

        {showAdvancedFields && (
          <>
            <div className="dossier-form-section">
              <h3 className="dossier-form-section-title">Tài nguyên phương tiện</h3>

          <div className="dossier-form-row">
            <div className="dossier-form-group">
              <label className="dossier-form-label">Ảnh đại diện</label>
              <div className="dossier-create-upload-box">
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt="Xem trước ảnh đại diện"
                    className="dossier-create-avatar-preview"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "avatar")}
                  id="dossier-create-avatar-upload"
                  className="dossier-create-file-input"
                />
                <label
                  htmlFor="dossier-create-avatar-upload"
                  className="dossier-btn-primary dossier-create-upload-btn"
                >
                  <Upload size={18} />
                  Tải ảnh đại diện
                </label>
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Ảnh bìa</label>
              <div className="dossier-create-upload-box">
                {coverPreview && (
                  <img
                    src={coverPreview}
                    alt="Xem trước ảnh bìa"
                    className="dossier-create-cover-preview"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "cover")}
                  id="dossier-create-cover-upload"
                  className="dossier-create-file-input"
                />
                <label
                  htmlFor="dossier-create-cover-upload"
                  className="dossier-btn-primary dossier-create-upload-btn"
                >
                  <Upload size={18} />
                  Tải ảnh bìa
                </label>
              </div>
            </div>
          </div>

          <div className="dossier-form-group">
            <label className="dossier-form-label">Video giới thiệu</label>
            <div className="dossier-create-upload-box">
              {videoPreview && (
                <video
                  src={videoPreview}
                  controls
                  className="dossier-create-video-preview"
                />
              )}
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e, "video")}
                id="dossier-create-video-upload"
                className="dossier-create-file-input"
              />
              <label
                htmlFor="dossier-create-video-upload"
                className="dossier-btn-primary dossier-create-upload-btn"
              >
                <Upload size={18} />
                Tải video
              </label>
            </div>
          </div>
            </div>

            <div className="dossier-form-section">
              <h3 className="dossier-form-section-title">Liên kết bên ngoài</h3>

          <div className="dossier-form-group">
            <label className="dossier-form-label">LinkedIn</label>
            <input
              type="url"
              className="dossier-input"
              value={formData.linkedinUrl || ""}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/ten-cua-ban"
            />
          </div>

          <div className="dossier-form-group">
            <label className="dossier-form-label">GitHub</label>
            <input
              type="url"
              className="dossier-input"
              value={formData.githubUrl || ""}
              onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              placeholder="https://github.com/ten-cua-ban"
            />
          </div>

          <div className="dossier-form-row">
            <div className="dossier-form-group">
              <label className="dossier-form-label">Website cá nhân</label>
              <input
                type="url"
                className="dossier-input"
                value={formData.portfolioWebsiteUrl || ""}
                onChange={(e) =>
                  setFormData({ ...formData, portfolioWebsiteUrl: e.target.value })
                }
                placeholder="https://portfolio-cua-ban.com"
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Behance</label>
              <input
                type="url"
                className="dossier-input"
                value={formData.behanceUrl || ""}
                onChange={(e) => setFormData({ ...formData, behanceUrl: e.target.value })}
                placeholder="https://behance.net/ten-cua-ban"
              />
            </div>
            </div>
            </div>
          </>
        )}

        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Kỹ năng và ngôn ngữ</h3>

          <div className="dossier-form-group">
            <label className="dossier-form-label">Kỹ năng cốt lõi</label>
            <div className="dossier-create-chip-box">
              <div className="dossier-module-tags dossier-create-chip-list">
                {skills.map((skill, idx) => (
                  <span key={idx} className="dossier-module-tag">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="dossier-create-chip-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="dossier-create-chip-input-row">
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
                  placeholder="Nhập kỹ năng và nhấn Enter"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="dossier-btn-primary"
                >
                  +
                </button>
              </div>
              <div className="dossier-create-suggestion-row">
                {QUICK_SKILL_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="dossier-create-suggestion-chip"
                    onClick={() => handleQuickAddSkill(item)}
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="dossier-form-group">
            <label className="dossier-form-label">Ngôn ngữ</label>
            <div className="dossier-create-chip-box">
              <div className="dossier-module-tags dossier-create-chip-list">
                {languages.map((language, idx) => (
                  <span key={idx} className="dossier-module-tag">
                    {language}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(language)}
                      className="dossier-create-chip-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="dossier-create-chip-input-row">
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
                  placeholder="Nhập ngôn ngữ và nhấn Enter"
                />
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="dossier-btn-primary"
                >
                  +
                </button>
              </div>
              <div className="dossier-create-suggestion-row">
                {QUICK_LANGUAGE_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="dossier-create-suggestion-chip"
                    onClick={() => handleQuickAddLanguage(item)}
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Khả dụng và mức giá</h3>

          <div className="dossier-form-row">
            <div className="dossier-form-group">
              <label className="dossier-form-label">Trạng thái</label>
              <select
                className="dossier-select"
                value={formData.availabilityStatus || "AVAILABLE"}
                onChange={(e) =>
                  setFormData({ ...formData, availabilityStatus: e.target.value })
                }
              >
                <option value="AVAILABLE">Sẵn sàng</option>
                <option value="BUSY">Bận</option>
                <option value="NOT_AVAILABLE">Chưa sẵn sàng</option>
              </select>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Mức giá theo giờ</label>
              <input
                type="number"
                className="dossier-input"
                value={formData.hourlyRate || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hourlyRate: Number.parseFloat(e.target.value) || 0,
                  })
                }
                min="0"
                step="1000"
              />
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Đơn vị tiền tệ</label>
              <div className="dossier-create-static-field">VND</div>
            </div>
          </div>
        </div>

        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Quyền riêng tư</h3>

          <div className="dossier-create-checkboxes">
            <label className="dossier-create-checkbox-card">
              <input
                type="checkbox"
                className="dossier-create-checkbox-input"
                checked={Boolean(formData.isPublic)}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              <div className="dossier-create-checkbox-content">
                <span className="dossier-create-checkbox-title">Công khai Portfolio</span>
                <span className="dossier-create-checkbox-desc">
                  Cho phép người khác xem hồ sơ của bạn qua liên kết Portfolio.
                </span>
              </div>
            </label>

            <label className="dossier-create-checkbox-card">
              <input
                type="checkbox"
                className="dossier-create-checkbox-input"
                checked={Boolean(formData.showContactInfo)}
                onChange={(e) =>
                  setFormData({ ...formData, showContactInfo: e.target.checked })
                }
              />
              <div className="dossier-create-checkbox-content">
                <span className="dossier-create-checkbox-title">
                  Hiển thị thông tin liên hệ
                </span>
                <span className="dossier-create-checkbox-desc">
                  Số điện thoại và các liên kết mạng xã hội sẽ được hiển thị công khai.
                </span>
              </div>
            </label>

            <label className="dossier-create-checkbox-card">
              <input
                type="checkbox"
                className="dossier-create-checkbox-input"
                checked={Boolean(formData.allowJobOffers)}
                onChange={(e) =>
                  setFormData({ ...formData, allowJobOffers: e.target.checked })
                }
              />
              <div className="dossier-create-checkbox-content">
                <span className="dossier-create-checkbox-title">Nhận đề nghị việc làm</span>
                <span className="dossier-create-checkbox-desc">
                  Cho phép nhà tuyển dụng gửi lời mời hoặc liên hệ hợp tác.
                </span>
              </div>
            </label>
          </div>

          <div className="dossier-form-group dossier-create-slug-wrap">
            <label className="dossier-form-label">Đường dẫn tùy chỉnh (slug)</label>
            <input
              type="text"
              className="dossier-input"
              value={formData.customUrlSlug || ""}
              onChange={(e) =>
                {
                  setManualSlugEdited(true);
                  setFormData({
                    ...formData,
                    customUrlSlug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, ""),
                  });
                }
              }
              placeholder="vi-du: nguyen-van-a"
            />
            <small className="dossier-create-slug-note">
              Liên kết: /portfolio/{formData.customUrlSlug || "duong-dan-cua-ban"}
            </small>
            <button
              type="button"
              className="dossier-create-slug-helper"
              onClick={handleRegenerateSlug}
            >
              Tạo slug từ họ tên
            </button>
          </div>
        </div>

        <div className="dossier-create-footer">
          <button
            type="button"
            onClick={() => navigate("/portfolio")}
            className="dossier-btn-secondary"
            disabled={submitting}
          >
            Hủy
          </button>
          <button type="submit" className="dossier-btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <MeowlKuruLoader size="tiny" text="" />
                Đang tạo...
              </>
            ) : (
              "Tạo Portfolio"
            )}
          </button>
        </div>
      </form>

      <SystemAlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default DossierCreatePortfolioPage;
