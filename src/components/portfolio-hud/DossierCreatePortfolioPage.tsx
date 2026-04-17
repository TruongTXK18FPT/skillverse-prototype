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
import {
  PortfolioEducationDTO,
  PortfolioWorkExperienceDTO,
  UserProfileDTO,
} from "../../data/portfolioDTOs";
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

// Quick-fill templates
const QUICK_CAREER_GOALS = [
  "Tìm kiếm cơ hội phát triển trong lĩnh vực Frontend Development, mong muốn đóng góp vào các dự án có ý nghĩa và mang lại giá trị thực tiễn.",
  "Theo đuổi sự nghiệp Full Stack Developer, không ngừng học hỏi công nghệ mới và xây dựng sản phẩm chất lượng cao.",
  "Phát triển kỹ năng UI/UX Design, hướng đến tạo ra trải nghiệm người dùng tối ưu và giao diện hiện đại.",
  "Xây dựng sự nghiệp trong lĩnh vực Mobile Development, thành thạo React Native và Flutter.",
  "Trở thành Backend Developer chuyên sâu, thiết kế hệ thống scalable và hiệu quả.",
  "Theo đuổi vai trò DevOps Engineer, tối ưu CI/CD pipeline và infrastructure automation.",
];

const QUICK_PROFESSIONAL_TITLES = [
  "Frontend Developer",
  "Full Stack Developer",
  "Backend Developer",
  "UI/UX Designer",
  "Mobile Developer",
  "DevOps Engineer",
  "Data Analyst",
  "Project Manager",
  "Freelancer",
];

const COMMON_LOCATIONS = [
  "TP.HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng",
  "Buôn Ma Thuột", "Nha Trang", "Vinh", "Remote / Toàn quốc",
];

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = [
  { value: "01", label: "Tháng 1" }, { value: "02", label: "Tháng 2" },
  { value: "03", label: "Tháng 3" }, { value: "04", label: "Tháng 4" },
  { value: "05", label: "Tháng 5" }, { value: "06", label: "Tháng 6" },
  { value: "07", label: "Tháng 7" }, { value: "08", label: "Tháng 8" },
  { value: "09", label: "Tháng 9" }, { value: "10", label: "Tháng 10" },
  { value: "11", label: "Tháng 11" }, { value: "12", label: "Tháng 12" },
];

const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i);

const COMMON_INSTITUTIONS = [
  "Đại học FPT", "Đại học Bách Khoa TP.HCM", "Đại học KHTN TP.HCM",
  "Đại học Kinh tế TP.HCM", "Đại học RMIT", "VNU University of Science",
  "Đại học Bách Khoa Hà Nội", "FPT Polytechnic", "Cao đẳng FPT",
];

const COMMON_DEGREES = [
  "Cử nhân", "Kỹ sư", "Cử nhân Kinh tế", "Thạc sĩ", "Kỹ sư phần mềm",
  "Cử nhân Quản trị Kinh doanh", "Cử nhân CNTT", "Cử nhân Thiết kế",
];

const COMMON_FIELD_OF_STUDY = [
  "Kỹ thuật phần mềm", "Công nghệ thông tin", "Khoa học máy tính",
  "Thiết kế đồ họa", "Quản trị kinh doanh", "Marketing",
  "Kinh tế", "Luật", "Ngôn ngữ Anh", "Toán tin",
];

const COMMON_COMPANIES = [
  "FPT Software", "Viettel", "VNPT", "CMC Corporation", "NashTech",
  "Enouvo", "Orient Software", "VNG", "MoMo", "Shopee", "TikTok",
];

const COMMON_POSITIONS = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "UI/UX Designer", "Mobile Developer", "QA Engineer",
  "DevOps Engineer", "Data Analyst", "Business Analyst",
  "Project Manager", "Product Owner", "Tech Lead",
];

const parseDateStr = (val?: string) => {
  if (!val) return { month: "", year: "" };
  const parts = val.split("/");
  if (parts.length === 2) return { month: parts[0], year: parts[1] };
  if (val.length === 4) return { month: "", year: val };
  return { month: "", year: "" };
};

const formatDateVal = (month: string, year: string) =>
  month ? `${month}/${year}` : year;

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

const applyTimePreset = (
  currentJob: boolean,
  startDate: string,
  endDate: string,
  field: "start" | "end",
): { month: string; year: string } => {
  if (field === "start") {
    const parsed = parseDateStr(startDate);
    return { month: parsed.month || "01", year: parsed.year || String(CURRENT_YEAR) };
  }
  if (currentJob) return { month: "", year: "" };
  const parsed = parseDateStr(endDate);
  return { month: parsed.month || "", year: parsed.year || String(CURRENT_YEAR) };
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
    phone: "",
    professionalTitle: "",
    careerGoals: "",
    yearsOfExperience: 0,
    workExperiences: [createEmptyWorkExperience()],
    educationHistory: [createEmptyEducation()],
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
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [locationListIdx, setLocationListIdx] = useState(-1);

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
      if (type === "video") {
        setVideo(file);
        setVideoPreview(preview);
      } else if (type === "cover") {
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

  const handleAddWorkExperience = () => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: [...(prev.workExperiences || []), createEmptyWorkExperience()],
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
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleWorkStartTimeChange = (index: number, month: string, year: string) => {
    handleUpdateWorkExperience(index, "startDate", formatDateVal(month, year));
  };

  const handleWorkEndTimeChange = (index: number, month: string, year: string) => {
    handleUpdateWorkExperience(index, "endDate", formatDateVal(month, year));
  };

  const handleWorkStartNow = (index: number) => {
    handleUpdateWorkExperience(index, "startDate", `01/${CURRENT_YEAR}`);
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
      educationHistory: [...(prev.educationHistory || []), createEmptyEducation()],
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

  const handleEduStartTimeChange = (index: number, year: string) => {
    handleUpdateEducation(index, "startDate", year);
  };

  const handleEduEndTimeChange = (index: number, year: string) => {
    handleUpdateEducation(index, "endDate", year);
  };

  const handleRemoveEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      educationHistory: (prev.educationHistory || []).filter(
        (_item, itemIndex) => itemIndex !== index,
      ),
    }));
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
        phone: prev.phone?.trim() ? prev.phone : profile?.phone || "",
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

  const handleLocationChange = (val: string) => {
    setFormData((prev) => ({ ...prev, location: val }));
    setLocationListIdx(-1);
    if (val.trim().length < 1) {
      setLocationDropdownOpen(false);
      setFilteredLocations([]);
      return;
    }
    const lower = val.toLowerCase();
    const matches = COMMON_LOCATIONS.filter((l) => l.toLowerCase().includes(lower));
    setFilteredLocations(matches.slice(0, 6));
    setLocationDropdownOpen(matches.length > 0);
  };

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!locationDropdownOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setLocationListIdx((i) => Math.min(i + 1, filteredLocations.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setLocationListIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && locationListIdx >= 0) {
      e.preventDefault();
      const selected = filteredLocations[locationListIdx];
      setFormData((prev) => ({ ...prev, location: selected }));
      setLocationDropdownOpen(false);
      setFilteredLocations([]);
      setLocationListIdx(-1);
    } else if (e.key === "Escape") {
      setLocationDropdownOpen(false);
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
            <div className="dossier-create-quick-fill-row">
              {QUICK_PROFESSIONAL_TITLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="dossier-create-quick-fill-chip"
                  onClick={() => setFormData((p) => ({ ...p, professionalTitle: t }))}
                >
                  + {t}
                </button>
              ))}
            </div>
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
              <div className="dossier-create-quick-fill-row">
                {[0, 1, 2, 3, 5, 7, 10].map((y) => (
                  <button
                    key={y}
                    type="button"
                    className="dossier-create-quick-fill-chip"
                    onClick={() =>
                      setFormData((p) => ({ ...p, yearsOfExperience: y }))
                    }
                  >
                    {y === 0 ? "Mới" : `${y} năm`}
                  </button>
                ))}
              </div>
            </div>

            <div className="dossier-form-group dossier-create-location-wrap">
              <label className="dossier-form-label">Địa điểm</label>
              <input
                type="text"
                className="dossier-input"
                value={formData.location || ""}
                onChange={(e) => handleLocationChange(e.target.value)}
                onKeyDown={handleLocationKeyDown}
                onBlur={() => setTimeout(() => setLocationDropdownOpen(false), 150)}
                placeholder="TP.HCM / Remote / Hà Nội..."
              />
              {locationDropdownOpen && filteredLocations.length > 0 && (
                <div className="dossier-create-location-list">
                  {filteredLocations.map((loc, i) => (
                    <div
                      key={loc}
                      className={`dossier-create-location-option${locationListIdx === i ? " active" : ""}`}
                      onMouseDown={() => {
                        setFormData((p) => ({ ...p, location: loc }));
                        setLocationDropdownOpen(false);
                        setFilteredLocations([]);
                      }}
                    >
                      {loc}
                    </div>
                  ))}
                </div>
              )}
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
            <div className="dossier-create-quick-fill-row">
              {QUICK_CAREER_GOALS.map((goal, i) => (
                <button
                  key={i}
                  type="button"
                  className="dossier-create-quick-fill-chip"
                  onClick={() =>
                    setFormData((p) => ({ ...p, careerGoals: goal }))
                  }
                  title={goal}
                >
                  Mẫu {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="dossier-form-section">
          <h3 className="dossier-form-section-title">Liên hệ</h3>
          <div className="dossier-form-group" style={{ marginBottom: 0 }}>
            <label className="dossier-form-label">Số điện thoại</label>
            <input
              type="tel"
              className="dossier-input"
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ví dụ: 0901234567"
            />
          </div>
        </div>

        <div className="dossier-form-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <h3 className="dossier-form-section-title" style={{ marginBottom: 0 }}>
              Kinh nghiệm làm việc
            </h3>
            <button
              type="button"
              className="dossier-btn-secondary"
              onClick={handleAddWorkExperience}
            >
              + Thêm kinh nghiệm
            </button>
          </div>

          {(formData.workExperiences || []).map((experience, index) => (
            <div
              key={experience.id || index}
              style={{
                border: "1px solid var(--dossier-border-silver)",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <strong>Kinh nghiệm #{index + 1}</strong>
                {(formData.workExperiences || []).length > 1 && (
                  <button
                    type="button"
                    className="dossier-btn-secondary"
                    onClick={() => handleRemoveWorkExperience(index)}
                  >
                    Xóa
                  </button>
                )}
              </div>

              <div className="dossier-form-row">
                <div className="dossier-form-group">
                  <label className="dossier-form-label">Công ty</label>
                  <input
                    type="text"
                    className="dossier-input"
                    value={experience.companyName || ""}
                    onChange={(e) =>
                      handleUpdateWorkExperience(index, "companyName", e.target.value)
                    }
                    placeholder="FPT Software"
                  />
                  <div className="dossier-create-quick-fill-row">
                    {COMMON_COMPANIES.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="dossier-create-quick-fill-chip"
                        onClick={() => handleUpdateWorkExperience(index, "companyName", c)}
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="dossier-form-group">
                  <label className="dossier-form-label">Vị trí</label>
                  <input
                    type="text"
                    className="dossier-input"
                    value={experience.position || ""}
                    onChange={(e) =>
                      handleUpdateWorkExperience(index, "position", e.target.value)
                    }
                    placeholder="Frontend Developer"
                  />
                  <div className="dossier-create-quick-fill-row">
                    {COMMON_POSITIONS.slice(0, 5).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="dossier-create-quick-fill-chip"
                        onClick={() => handleUpdateWorkExperience(index, "position", p)}
                      >
                        + {p}
                      </button>
                    ))}
                  </div>
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
                      handleUpdateWorkExperience(index, "location", e.target.value)
                    }
                    placeholder="TP.HCM / Remote"
                  />
                  <div className="dossier-create-quick-fill-row">
                    {COMMON_LOCATIONS.slice(0, 5).map((l) => (
                      <button
                        key={l}
                        type="button"
                        className="dossier-create-quick-fill-chip"
                        onClick={() => handleUpdateWorkExperience(index, "location", l)}
                      >
                        + {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="dossier-create-time-card">
                    <div className="dossier-create-time-group">
                      <div className="dossier-form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label className="dossier-form-label" style={{ fontSize: "0.78rem" }}>Bắt đầu</label>
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          <select
                            className="dossier-select dossier-create-month-select"
                            value={parseDateStr(experience.startDate).month}
                            onChange={(e) =>
                              handleWorkStartTimeChange(index, e.target.value, parseDateStr(experience.startDate).year || String(CURRENT_YEAR))
                            }
                          >
                            <option value="">Tháng</option>
                            {MONTHS.map((m) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                          <select
                            className="dossier-select dossier-create-year-select"
                            value={parseDateStr(experience.startDate).year}
                            onChange={(e) =>
                              handleWorkStartTimeChange(index, parseDateStr(experience.startDate).month || "01", e.target.value)
                            }
                          >
                            <option value="">Năm</option>
                            {YEAR_OPTIONS.map((y) => (
                              <option key={y} value={String(y)}>{y}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="dossier-create-time-preset-btn"
                            onClick={() => handleWorkStartNow(index)}
                            title="Đặt về tháng hiện tại"
                          >
                            Nay
                          </button>
                        </div>
                      </div>

                      <span className="dossier-create-time-separator">→</span>

                      <div className="dossier-form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label className="dossier-form-label" style={{ fontSize: "0.78rem" }}>Kết thúc</label>
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          <select
                            className="dossier-select dossier-create-month-select"
                            value={parseDateStr(experience.endDate).month}
                            onChange={(e) =>
                              handleWorkEndTimeChange(index, e.target.value, parseDateStr(experience.endDate).year || String(CURRENT_YEAR))
                            }
                            disabled={Boolean(experience.currentJob)}
                          >
                            <option value="">Tháng</option>
                            {MONTHS.map((m) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                          <select
                            className="dossier-select dossier-create-year-select"
                            value={parseDateStr(experience.endDate).year}
                            onChange={(e) =>
                              handleWorkEndTimeChange(index, parseDateStr(experience.endDate).month || "01", e.target.value)
                            }
                            disabled={Boolean(experience.currentJob)}
                          >
                            <option value="">Năm</option>
                            {YEAR_OPTIONS.map((y) => (
                              <option key={y} value={String(y)}>{y}</option>
                            ))}
                          </select>
                          {experience.currentJob && (
                            <span style={{ fontSize: "0.7rem", color: "#22d3ee" }}>Đang làm</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                  color: "var(--dossier-silver)",
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(experience.currentJob)}
                  onChange={(e) =>
                    handleUpdateWorkExperience(index, "currentJob", e.target.checked)
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
                    handleUpdateWorkExperience(index, "description", e.target.value)
                  }
                  rows={3}
                  placeholder="Mô tả vai trò, phạm vi công việc hoặc thành tựu chính"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="dossier-form-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <h3 className="dossier-form-section-title" style={{ marginBottom: 0 }}>
              Học vấn
            </h3>
            <button
              type="button"
              className="dossier-btn-secondary"
              onClick={handleAddEducation}
            >
              + Thêm học vấn
            </button>
          </div>

          {(formData.educationHistory || []).map((education, index) => (
            <div
              key={education.id || index}
              style={{
                border: "1px solid var(--dossier-border-silver)",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <strong>Học vấn #{index + 1}</strong>
                {(formData.educationHistory || []).length > 1 && (
                  <button
                    type="button"
                    className="dossier-btn-secondary"
                    onClick={() => handleRemoveEducation(index)}
                  >
                    Xóa
                  </button>
                )}
              </div>

              <div className="dossier-form-row">
                <div className="dossier-form-group">
                  <label className="dossier-form-label">Trường / tổ chức đào tạo</label>
                  <input
                    type="text"
                    className="dossier-input"
                    value={education.institution || ""}
                    onChange={(e) =>
                      handleUpdateEducation(index, "institution", e.target.value)
                    }
                    placeholder="Đại học FPT"
                  />
                  <div className="dossier-create-quick-fill-row">
                    {COMMON_INSTITUTIONS.slice(0, 5).map((inst) => (
                      <button
                        key={inst}
                        type="button"
                        className="dossier-create-quick-fill-chip"
                        onClick={() => handleUpdateEducation(index, "institution", inst)}
                      >
                        + {inst}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="dossier-form-group">
                  <label className="dossier-form-label">Bằng cấp / chương trình</label>
                  <input
                    type="text"
                    className="dossier-input"
                    value={education.degree || ""}
                    onChange={(e) =>
                      handleUpdateEducation(index, "degree", e.target.value)
                    }
                    placeholder="Cử nhân CNTT"
                  />
                  <div className="dossier-create-quick-fill-row">
                    {COMMON_DEGREES.slice(0, 5).map((d) => (
                      <button
                        key={d}
                        type="button"
                        className="dossier-create-quick-fill-chip"
                        onClick={() => handleUpdateEducation(index, "degree", d)}
                      >
                        + {d}
                      </button>
                    ))}
                  </div>
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
                      handleUpdateEducation(index, "fieldOfStudy", e.target.value)
                    }
                    placeholder="Kỹ thuật phần mềm"
                  />
                  <div className="dossier-create-quick-fill-row">
                    {COMMON_FIELD_OF_STUDY.slice(0, 5).map((f) => (
                      <button
                        key={f}
                        type="button"
                        className="dossier-create-quick-fill-chip"
                        onClick={() => handleUpdateEducation(index, "fieldOfStudy", f)}
                      >
                        + {f}
                      </button>
                    ))}
                  </div>
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
                  <div className="dossier-create-quick-fill-row">
                    {COMMON_LOCATIONS.slice(0, 5).map((l) => (
                      <button
                        key={l}
                        type="button"
                        className="dossier-create-quick-fill-chip"
                        onClick={() => handleUpdateEducation(index, "location", l)}
                      >
                        + {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dossier-form-row">
                <div className="dossier-form-group">
                  <label className="dossier-form-label">Bắt đầu</label>
                  <select
                    className="dossier-select dossier-create-year-select"
                    value={education.startDate || ""}
                    onChange={(e) => handleEduStartTimeChange(index, e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="">Chọn năm</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="dossier-form-group">
                  <label className="dossier-form-label">Kết thúc</label>
                  <select
                    className="dossier-select dossier-create-year-select"
                    value={education.endDate || ""}
                    onChange={(e) => handleEduEndTimeChange(index, e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="">Chọn năm</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
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
                    handleUpdateEducation(index, "description", e.target.value)
                  }
                  rows={3}
                  placeholder="Thêm thông tin về chương trình, thành tích hoặc ghi chú khác"
                />
              </div>
            </div>
          ))}
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
              <div className="dossier-create-quick-fill-row">
                {[
                  { val: "AVAILABLE", label: "Sẵn sàng" },
                  { val: "BUSY", label: "Bận" },
                  { val: "NOT_AVAILABLE", label: "Chưa sẵn sàng" },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    className={`dossier-create-quick-fill-chip${formData.availabilityStatus === s.val ? " active" : ""}`}
                    style={
                      formData.availabilityStatus === s.val
                        ? { borderColor: "#22d3ee", background: "rgba(6,182,212,0.22)", color: "#ecfeff" }
                        : {}
                    }
                    onClick={() => setFormData((p) => ({ ...p, availabilityStatus: s.val }))}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="dossier-form-group">
              <label className="dossier-form-label">Mức giá theo giờ (VND)</label>
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
                step="10000"
              />
              <div className="dossier-create-quick-fill-row">
                {[50000, 100000, 150000, 200000, 300000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="dossier-create-quick-fill-chip"
                    onClick={() => setFormData((p) => ({ ...p, hourlyRate: amt }))}
                  >
                    {amt >= 1000 ? `${(amt / 1000).toFixed(0)}K` : amt}/h
                  </button>
                ))}
              </div>
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
