// DATA COMPILER PREVIEW - CV Preview & Edit Page
// Uses structured JSON + React template rendering
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Download,
  Printer,
  Share2,
  Edit,
  Eye,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Check,
  Languages,
  Globe,
  AlertTriangle,
  Briefcase,
  FolderOpen,
  Palette,
} from "lucide-react";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./data-compiler-preview.css";
import "../../styles/cv-templates.css";
import portfolioService from "../../services/portfolioService";
import {
  CompletedMissionDTO,
  GeneratedCVDTO,
  PortfolioEducationDTO,
  PortfolioWorkExperienceDTO,
  UserProfileDTO,
  CVGenerationRequest,
} from "../../data/portfolioDTOs";
import { useScrollLock } from "./useScrollLock";
import SystemAlertModal from "./SystemAlertModal";
import CVTemplateRenderer from "../cv-templates/CVTemplateRenderer";
import {
  CVStructuredData,
  CVTemplateName,
  CVExperience,
  CVEducation,
  CVSkillCategory,
  CVProject,
  CVCertificate,
  parseCVJson,
  generateItemId,
  CV_TEMPLATES,
  EMPTY_CV_DATA,
} from "../../data/cvTemplateTypes";

// ==================== COMPONENT ====================

const DataCompilerPreview = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Core states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCV, setActiveCV] = useState<GeneratedCVDTO | null>(null);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [cvData, setCvData] = useState<CVStructuredData | null>(null);
  const [completedMissions, setCompletedMissions] = useState<
    CompletedMissionDTO[]
  >([]);
  const cvPreviewRef = useRef<HTMLDivElement>(null);

  // UI states
  const [activeTab, setActiveTab] = useState<
    "preview" | "edit" | "generate"
  >("preview");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({ show: false, message: "", type: "info" });

  // Generation options
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [templateName, setTemplateName] =
    useState<CVTemplateName>("PROFESSIONAL");
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [includeCompletedMissions, setIncludeCompletedMissions] =
    useState(true);

  // Collapsible sections in edit form
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    personal: true,
    imports: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: false,
    certificates: false,
    languages: false,
  });

  useScrollLock(false);

  // ==================== HELPERS ====================

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getActiveTemplateName = (): CVTemplateName => {
    const name = activeCV?.templateName?.toUpperCase() as CVTemplateName;
    if (["PROFESSIONAL", "CREATIVE", "MINIMAL", "MODERN"].includes(name))
      return name;
    return templateName || "PROFESSIONAL";
  };

  const renderTemplateIcon = (name: CVTemplateName, size = 16) => {
    switch (name) {
      case "PROFESSIONAL":
        return <Briefcase size={size} />;
      case "MODERN":
        return <Sparkles size={size} />;
      case "MINIMAL":
        return <FileText size={size} />;
      case "CREATIVE":
        return <Palette size={size} />;
      default:
        return <FileText size={size} />;
    }
  };

  const normalizeValue = (value?: string | null) =>
    (value || "").trim().toLowerCase();

  const buildPortfolioUrl = (currentProfile?: UserProfileDTO | null) => {
    if (currentProfile?.portfolioWebsiteUrl) {
      return currentProfile.portfolioWebsiteUrl;
    }
    if (
      typeof window !== "undefined" &&
      currentProfile?.customUrlSlug
    ) {
      return `${window.location.origin}/portfolio/${currentProfile.customUrlSlug}`;
    }
    return "";
  };

  const createBaseCvData = useCallback((): CVStructuredData => {
    const parsedLanguages =
      profile?.languagesSpoken && profile.languagesSpoken.trim()
        ? (() => {
            try {
              return JSON.parse(profile.languagesSpoken) as string[];
            } catch {
              return [];
            }
          })()
        : [];

    return {
      ...EMPTY_CV_DATA,
      personalInfo: {
        ...EMPTY_CV_DATA.personalInfo,
        fullName: profile?.fullName || "",
        professionalTitle: profile?.professionalTitle || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        location: profile?.location || "",
        linkedinUrl: profile?.linkedinUrl || "",
        githubUrl: profile?.githubUrl || "",
        portfolioUrl: buildPortfolioUrl(profile),
        behanceUrl: profile?.behanceUrl || "",
        dribbbleUrl: profile?.dribbbleUrl || "",
        avatarUrl: profile?.portfolioAvatarUrl || profile?.basicAvatarUrl || "",
      },
      languages: parsedLanguages.map((language) => ({
        name: language,
        proficiency: "Intermediate" as const,
      })),
    };
  }, [profile]);

  const withCvData = (
    updater: (current: CVStructuredData) => CVStructuredData,
  ) => {
    setCvData((current) => updater(current || createBaseCvData()));
  };

  const syncPersonalInfoFromProfile = () => {
    if (!profile) {
      showToast("Chưa có dữ liệu profile để đồng bộ");
      return;
    }

    setContactEmail(profile.email || "");
    setContactPhone(profile.phone || "");

    withCvData((current) => ({
      ...current,
      personalInfo: {
        ...current.personalInfo,
        fullName: profile.fullName || current.personalInfo.fullName,
        professionalTitle:
          profile.professionalTitle || current.personalInfo.professionalTitle,
        email: profile.email || current.personalInfo.email,
        phone: profile.phone || current.personalInfo.phone,
        location: profile.location || current.personalInfo.location,
        linkedinUrl: profile.linkedinUrl || current.personalInfo.linkedinUrl,
        githubUrl: profile.githubUrl || current.personalInfo.githubUrl,
        portfolioUrl:
          buildPortfolioUrl(profile) || current.personalInfo.portfolioUrl,
        behanceUrl: profile.behanceUrl || current.personalInfo.behanceUrl,
        dribbbleUrl: profile.dribbbleUrl || current.personalInfo.dribbbleUrl,
        avatarUrl:
          profile.portfolioAvatarUrl ||
          profile.basicAvatarUrl ||
          current.personalInfo.avatarUrl,
      },
    }));
    showToast("Đã đồng bộ thông tin liên hệ từ profile");
  };

  const importWorkExperience = (experience: PortfolioWorkExperienceDTO) => {
    withCvData((current) => {
      const duplicate = current.experience.some(
        (item) =>
          normalizeValue(item.title) === normalizeValue(experience.position) &&
          normalizeValue(item.company) === normalizeValue(experience.companyName),
      );
      if (duplicate) {
        return current;
      }

      return {
        ...current,
        experience: [
          ...current.experience,
          {
            id: experience.id || generateItemId(),
            title: experience.position || "Kinh nghiệm làm việc",
            company: experience.companyName || "Doanh nghiệp",
            location: experience.location || "",
            startDate: experience.startDate || "",
            endDate: experience.currentJob ? undefined : experience.endDate || "",
            isCurrent: Boolean(experience.currentJob),
            description: experience.description || "",
            achievements: [],
            technologies: [],
          },
        ],
      };
    });
  };

  const importEducationItem = (education: PortfolioEducationDTO) => {
    withCvData((current) => {
      const duplicate = current.education.some(
        (item) =>
          normalizeValue(item.degree) === normalizeValue(education.degree) &&
          normalizeValue(item.institution) === normalizeValue(education.institution),
      );
      if (duplicate) {
        return current;
      }

      return {
        ...current,
        education: [
          ...current.education,
          {
            id: education.id || generateItemId(),
            degree: education.degree || "Học vấn",
            institution: education.institution || "Cơ sở đào tạo",
            location: education.location || "",
            startDate: education.startDate || "",
            endDate: education.endDate || "",
            relevantCourses: education.fieldOfStudy
              ? [education.fieldOfStudy]
              : [],
          },
        ],
      };
    });
  };

  const importMissionAsExperience = (mission: CompletedMissionDTO) => {
    withCvData((current) => {
      const duplicate = current.experience.some(
        (item) =>
          normalizeValue(item.title) === normalizeValue(mission.jobTitle) &&
          normalizeValue(item.company) ===
            normalizeValue(mission.recruiterCompanyName || mission.recruiterName),
      );
      if (duplicate) {
        return current;
      }

      const missionDate = mission.completedAt
        ? new Date(mission.completedAt).toLocaleDateString("vi-VN", {
            month: "2-digit",
            year: "numeric",
          })
        : "";

      const achievements = [
        mission.reviewComment,
        mission.deliverables?.length
          ? `Deliverables: ${mission.deliverables
              .map((item) => item.fileName)
              .filter(Boolean)
              .join(", ")}`
          : "",
        mission.budget
          ? `Ngân sách: ${mission.budget.toLocaleString("vi-VN")} ${mission.currency || "VND"}`
          : "",
      ].filter(Boolean) as string[];

      return {
        ...current,
        experience: [
          ...current.experience,
          {
            id: `mission-exp-${mission.applicationId}`,
            title: mission.jobTitle,
            company:
              mission.recruiterCompanyName ||
              mission.recruiterName ||
              "SkillVerse Mission",
            location:
              mission.location || (mission.isRemote ? "Remote" : "SkillVerse"),
            startDate: missionDate,
            endDate: missionDate,
            isCurrent: false,
            description: mission.workNote || mission.jobDescription || "",
            achievements,
            technologies: mission.requiredSkills || [],
          },
        ],
      };
    });
  };

  const importMissionAsProject = (mission: CompletedMissionDTO) => {
    withCvData((current) => {
      const duplicate = current.projects.some(
        (item) => normalizeValue(item.title) === normalizeValue(mission.jobTitle),
      );
      if (duplicate) {
        return current;
      }

      const outcomes = [
        mission.reviewComment,
        mission.deliverables?.length
          ? `Deliverables: ${mission.deliverables
              .map((item) => item.fileName)
              .filter(Boolean)
              .join(", ")}`
          : "",
        mission.budget
          ? `Budget: ${mission.budget.toLocaleString("vi-VN")} ${mission.currency || "VND"}`
          : "",
      ].filter(Boolean) as string[];

      return {
        ...current,
        projects: [
          ...current.projects,
          {
            id: `mission-proj-${mission.applicationId}`,
            title: mission.jobTitle,
            description: mission.jobDescription || mission.workNote || "",
            role: "System Mission",
            technologies: mission.requiredSkills || [],
            outcomes,
            duration: mission.estimatedDuration || "",
            clientName: mission.recruiterCompanyName || mission.recruiterName,
            rating: mission.rating,
          },
        ],
      };
    });
  };

  // ==================== CV UPDATE HELPERS ====================

  const updatePersonalInfo = (field: string, value: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      personalInfo: { ...cvData.personalInfo, [field]: value },
    });
  };

  const updateExperience = (idx: number, field: string, value: any) => {
    if (!cvData) return;
    const updated = [...cvData.experience];
    updated[idx] = { ...updated[idx], [field]: value };
    setCvData({ ...cvData, experience: updated });
  };

  const removeExperience = (idx: number) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      experience: cvData.experience.filter((_, i) => i !== idx),
    });
  };

  const addExperience = () => {
    if (!cvData) return;
    const newExp: CVExperience = {
      id: generateItemId(),
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
      achievements: [],
      technologies: [],
    };
    setCvData({ ...cvData, experience: [...cvData.experience, newExp] });
  };

  const updateEducation = (idx: number, field: string, value: any) => {
    if (!cvData) return;
    const updated = [...cvData.education];
    updated[idx] = { ...updated[idx], [field]: value };
    setCvData({ ...cvData, education: updated });
  };

  const removeEducation = (idx: number) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      education: cvData.education.filter((_, i) => i !== idx),
    });
  };

  const addEducation = () => {
    if (!cvData) return;
    const newEdu: CVEducation = {
      id: generateItemId(),
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
      relevantCourses: [],
    };
    setCvData({ ...cvData, education: [...cvData.education, newEdu] });
  };

  const updateSkillCategory = (idx: number, field: string, value: any) => {
    if (!cvData) return;
    const updated = [...cvData.skills];
    updated[idx] = { ...updated[idx], [field]: value };
    setCvData({ ...cvData, skills: updated });
  };

  const removeSkillCategory = (idx: number) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      skills: cvData.skills.filter((_, i) => i !== idx),
    });
  };

  const addSkillCategory = () => {
    if (!cvData) return;
    const newCat: CVSkillCategory = { category: "", skills: [] };
    setCvData({ ...cvData, skills: [...cvData.skills, newCat] });
  };

  const updateProject = (idx: number, field: string, value: any) => {
    if (!cvData) return;
    const updated = [...cvData.projects];
    updated[idx] = { ...updated[idx], [field]: value };
    setCvData({ ...cvData, projects: updated });
  };

  const removeProject = (idx: number) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      projects: cvData.projects.filter((_, i) => i !== idx),
    });
  };

  const addProject = () => {
    if (!cvData) return;
    const newProj: CVProject = {
      id: generateItemId(),
      title: "",
      description: "",
      role: "",
      technologies: [],
      outcomes: [],
      url: "",
    };
    setCvData({ ...cvData, projects: [...cvData.projects, newProj] });
  };

  const updateCertificate = (idx: number, field: string, value: any) => {
    if (!cvData) return;
    const updated = [...cvData.certificates];
    updated[idx] = { ...updated[idx], [field]: value };
    setCvData({ ...cvData, certificates: updated });
  };

  const removeCertificate = (idx: number) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      certificates: cvData.certificates.filter((_, i) => i !== idx),
    });
  };

  const addCertificate = () => {
    if (!cvData) return;
    const newCert: CVCertificate = {
      id: generateItemId(),
      title: "",
      issuingOrganization: "",
      issueDate: "",
    };
    setCvData({
      ...cvData,
      certificates: [...cvData.certificates, newCert],
    });
  };

  // ==================== ACTIONS ====================

  const saveEditedCV = async () => {
    if (!activeCV?.id || !cvData) return;
    try {
      setSaving(true);
      const cvJsonStr = JSON.stringify(cvData);
      await portfolioService.updateCV(activeCV.id, "", cvJsonStr);
      showToast("Lưu CV thành công!");
      const cv = await portfolioService.getActiveCV();
      setActiveCV(cv);
      const parsed = parseCVJson(cv.cvJson);
      if (parsed) setCvData(parsed);
      setActiveTab("preview");
    } catch (e: any) {
      showToast(e?.message || "Không thể lưu CV");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const composedInstructions = [
        additionalInstructions,
        `Hãy tạo CV bằng ${language === "vi" ? "tiếng Việt" : "tiếng Anh"}.`,
        contactEmail ? `Email: ${contactEmail}.` : "",
        contactPhone ? `Phone: ${contactPhone}.` : "",
      ]
        .filter(Boolean)
        .join("\n")
        .trim();

      const req: CVGenerationRequest = {
        templateName,
        targetRole: targetRole || undefined,
        targetIndustry: targetIndustry || undefined,
        additionalInstructions: composedInstructions,
        includeProjects: true,
        includeCertificates: true,
        includeReviews: true,
        includeCompletedMissions,
      };
      const newCv = await portfolioService.generateCV(req);
      setActiveCV(newCv);
      const parsed = parseCVJson(newCv.cvJson);
      if (parsed) setCvData(parsed);
      setActiveTab("preview");
      showToast("Đã tạo CV mới thành công!");
    } catch (e: any) {
      setError(e?.message || "Không thể tạo CV. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cvData) return;
    try {
      const printWindow = globalThis.open("", "_blank");
      if (!printWindow) {
        setAlertModal({
          show: true,
          message: "Không thể mở cửa sổ in. Vui lòng cho phép popup.",
          type: "error",
        });
        return;
      }
      const cvHtml = cvPreviewRef.current?.innerHTML || "";
      const printHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>CV - ${cvData.personalInfo?.fullName || "CV"}</title><link rel="stylesheet" href="${window.location.origin}/src/styles/cv-templates.css"><style>body{margin:0;padding:0;background:white}@media print{body{margin:0;padding:0}@page{margin:1cm}}</style></head><body>${cvHtml}</body></html>`;
      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.onload = () =>
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      showToast("Đang tạo PDF...");
    } catch {
      setAlertModal({
        show: true,
        message: "Không thể tạo PDF.",
        type: "error",
      });
    }
  };

  const handleShare = () => {
    const url = globalThis.location?.href || "";
    if (globalThis.navigator && (navigator as any).share) {
      (navigator as any).share({ title: "CV", text: "Xem CV của tôi", url });
    } else {
      globalThis.navigator?.clipboard?.writeText?.(url);
      setAlertModal({
        show: true,
        message: "Đã copy link CV!",
        type: "success",
      });
    }
  };

  const switchTemplate = (name: CVTemplateName) => {
    setTemplateName(name);
    if (activeCV) {
      setActiveCV({ ...activeCV, templateName: name });
    }
  };

  // ==================== LOAD DATA ====================

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const editCvId = searchParams.get("edit");
        if (editCvId) {
          const [allCvs, pf, missions] = await Promise.all([
            portfolioService.getAllCVs(),
            portfolioService.getProfile().catch(() => null),
            portfolioService.getCompletedMissions().catch(() => []),
          ]);
          const cvToEdit = allCvs.find(
            (cv) => cv.id === Number.parseInt(editCvId, 10),
          );
          if (cvToEdit) {
            setActiveCV(cvToEdit);
            const parsed = parseCVJson(cvToEdit.cvJson);
            if (parsed) setCvData(parsed);
            if (pf) {
              setProfile(pf);
              setContactEmail(parsed?.personalInfo?.email || pf.email || "");
              setContactPhone(parsed?.personalInfo?.phone || pf.phone || "");
            } else if (parsed) {
              setContactEmail(parsed.personalInfo?.email || "");
              setContactPhone(parsed.personalInfo?.phone || "");
            }
            setCompletedMissions(missions);
            setActiveTab("edit");
          } else {
            setError("Không tìm thấy CV để chỉnh sửa.");
          }
        } else {
          const [cv, pf, missions] = await Promise.all([
            portfolioService.getActiveCV().catch(() => null),
            portfolioService.getProfile().catch(() => null),
            portfolioService.getCompletedMissions().catch(() => []),
          ]);
          if (cv) {
            setActiveCV(cv);
            const parsed = parseCVJson(cv.cvJson);
            if (parsed) setCvData(parsed);
            if (cv.templateName)
              setTemplateName(cv.templateName.toUpperCase() as CVTemplateName);
            setContactEmail(parsed?.personalInfo?.email || pf?.email || "");
            setContactPhone(parsed?.personalInfo?.phone || pf?.phone || "");
          } else if (pf) {
            setContactEmail(pf.email || "");
            setContactPhone(pf.phone || "");
          }
          if (pf) setProfile(pf);
          setCompletedMissions(missions);
          if (!cv) {
            setActiveTab("generate");
          }
        }
      } catch (e: any) {
        setError(e?.message || "Lỗi tải dữ liệu CV.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  // ==================== RENDER: SECTION HEADER ====================

  const renderSectionHeader = (
    key: string,
    title: string,
    count?: number,
    onAdd?: () => void,
  ) => (
    <div className="cv-edit-section-header" onClick={() => toggleSection(key)}>
      <div className="cv-edit-section-header-left">
        {expandedSections[key] ? (
          <ChevronUp size={16} />
        ) : (
          <ChevronDown size={16} />
        )}
        <span className="cv-edit-section-title">{title}</span>
        {count !== undefined && (
          <span className="cv-edit-section-count">{count}</span>
        )}
      </div>
      {onAdd && (
        <button
          type="button"
          className="cv-edit-btn-add"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
        >
          <Plus size={14} /> Thêm
        </button>
      )}
    </div>
  );

  // ==================== RENDER: EDIT PANEL ====================

  const renderEditPanel = () => {
    if (!cvData)
      return (
        <div className="cv-edit-empty">Chưa có dữ liệu CV để chỉnh sửa</div>
      );

    return (
      <div className="cv-edit-panel">
        <div className="cv-edit-template-panel">
          <div className="cv-edit-template-panel-title">
            <Palette size={16} />
            Đổi template preview nhanh
          </div>
          <div className="cv-edit-template-quick-grid">
            {CV_TEMPLATES.map((tpl) => (
              <button
                key={`edit-${tpl.name}`}
                type="button"
                className={`cv-edit-template-quick-btn ${getActiveTemplateName() === tpl.name ? "active" : ""}`}
                onClick={() => switchTemplate(tpl.name)}
              >
                <span className="cv-edit-template-quick-icon">
                  {renderTemplateIcon(tpl.name, 14)}
                </span>
                <span>{tpl.displayName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== PERSONAL INFO ===== */}
        {renderSectionHeader("personal", "Thông Tin Cá Nhân")}
        {expandedSections.personal && (
          <div className="cv-edit-section-body">
            <div className="cv-edit-row">
              <div className="cv-edit-field">
                <label>Họ và tên</label>
                <input
                  type="text"
                  value={cvData.personalInfo.fullName}
                  onChange={(e) =>
                    updatePersonalInfo("fullName", e.target.value)
                  }
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="cv-edit-field">
                <label>Chức danh</label>
                <input
                  type="text"
                  value={cvData.personalInfo.professionalTitle}
                  onChange={(e) =>
                    updatePersonalInfo("professionalTitle", e.target.value)
                  }
                  placeholder="Frontend Developer"
                />
              </div>
            </div>
            <div className="cv-edit-row cv-edit-row--3">
              <div className="cv-edit-field">
                <label>Email</label>
                <input
                  type="email"
                  value={cvData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo("email", e.target.value)}
                />
              </div>
              <div className="cv-edit-field">
                <label>Điện thoại</label>
                <input
                  type="tel"
                  value={cvData.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                />
              </div>
              <div className="cv-edit-field">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  value={cvData.personalInfo.location}
                  onChange={(e) =>
                    updatePersonalInfo("location", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="cv-edit-row cv-edit-row--3">
              <div className="cv-edit-field">
                <label>LinkedIn</label>
                <input
                  type="url"
                  value={cvData.personalInfo.linkedinUrl || ""}
                  onChange={(e) =>
                    updatePersonalInfo("linkedinUrl", e.target.value)
                  }
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="cv-edit-field">
                <label>GitHub</label>
                <input
                  type="url"
                  value={cvData.personalInfo.githubUrl || ""}
                  onChange={(e) =>
                    updatePersonalInfo("githubUrl", e.target.value)
                  }
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="cv-edit-field">
                <label>Portfolio</label>
                <input
                  type="url"
                  value={cvData.personalInfo.portfolioUrl || ""}
                  onChange={(e) =>
                    updatePersonalInfo("portfolioUrl", e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== IMPORT SOURCES ===== */}
        {renderSectionHeader("imports", "Nguồn Import CV")}
        {expandedSections.imports && (
          <div className="cv-edit-section-body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <button
                type="button"
                className="cv-edit-btn-add"
                onClick={syncPersonalInfoFromProfile}
                disabled={!profile}
              >
                Đồng bộ liên hệ
              </button>
              <button
                type="button"
                className="cv-edit-btn-add"
                onClick={() =>
                  (profile?.workExperiences || []).forEach(importWorkExperience)
                }
                disabled={!profile?.workExperiences?.length}
              >
                Import kinh nghiệm
              </button>
              <button
                type="button"
                className="cv-edit-btn-add"
                onClick={() =>
                  (profile?.educationHistory || []).forEach(importEducationItem)
                }
                disabled={!profile?.educationHistory?.length}
              >
                Import học vấn
              </button>
              <button
                type="button"
                className="cv-edit-btn-add cv-edit-btn-import-mission"
                onClick={() => completedMissions.forEach(importMissionAsExperience)}
                disabled={!completedMissions.length}
              >
                <Briefcase size={14} />
                Mission sang kinh nghiệm
              </button>
              <button
                type="button"
                className="cv-edit-btn-add cv-edit-btn-import-mission"
                onClick={() => completedMissions.forEach(importMissionAsProject)}
                disabled={!completedMissions.length}
              >
                <FolderOpen size={14} />
                Mission sang dự án
              </button>
            </div>

            {profile && (
              <div className="cv-edit-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>Profile hiện tại</strong>
                    <div style={{ opacity: 0.8, marginTop: "0.25rem" }}>
                      {profile.fullName || "Chưa có tên"} |{" "}
                      {profile.email || "Chưa có email"} |{" "}
                      {profile.phone || "Chưa có số điện thoại"}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cv-edit-btn-add"
                    onClick={syncPersonalInfoFromProfile}
                  >
                    Dùng cho CV
                  </button>
                </div>
              </div>
            )}

            {!!profile?.workExperiences?.length && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
                  Kinh nghiệm từ portfolio
                </div>
                {(profile?.workExperiences || []).map((experience, idx) => (
                  <div key={experience.id || idx} className="cv-edit-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <strong>
                          {experience.position || "Kinh nghiệm làm việc"}
                        </strong>
                        <div style={{ opacity: 0.8, marginTop: "0.25rem" }}>
                          {experience.companyName || "Chưa có công ty"}
                          {experience.location ? ` | ${experience.location}` : ""}
                        </div>
                        <div style={{ opacity: 0.7, marginTop: "0.25rem" }}>
                          {experience.startDate || "?"} -{" "}
                          {experience.currentJob
                            ? "Hiện tại"
                            : experience.endDate || "?"}
                        </div>
                        {experience.description && (
                          <div style={{ marginTop: "0.5rem", opacity: 0.85 }}>
                            {experience.description}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="cv-edit-btn-add"
                        onClick={() => importWorkExperience(experience)}
                      >
                        Import
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!!profile?.educationHistory?.length && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
                  Học vấn từ portfolio
                </div>
                {(profile?.educationHistory || []).map((education, idx) => (
                  <div key={education.id || idx} className="cv-edit-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <strong>{education.degree || "Học vấn"}</strong>
                        <div style={{ opacity: 0.8, marginTop: "0.25rem" }}>
                          {education.institution || "Chưa có trường"}
                          {education.fieldOfStudy
                            ? ` | ${education.fieldOfStudy}`
                            : ""}
                        </div>
                        <div style={{ opacity: 0.7, marginTop: "0.25rem" }}>
                          {education.startDate || "?"} - {education.endDate || "?"}
                          {education.status ? ` | ${education.status}` : ""}
                        </div>
                        {education.description && (
                          <div style={{ marginTop: "0.5rem", opacity: 0.85 }}>
                            {education.description}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="cv-edit-btn-add"
                        onClick={() => importEducationItem(education)}
                      >
                        Import
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!!completedMissions.length && (
              <div>
                <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
                  Mission đã hoàn thành trong hệ thống
                </div>
                {completedMissions.map((mission) => (
                  <div key={mission.applicationId} className="cv-edit-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <strong>{mission.jobTitle}</strong>
                        <div style={{ opacity: 0.8, marginTop: "0.25rem" }}>
                          {mission.recruiterCompanyName ||
                            mission.recruiterName ||
                            "SkillVerse"}
                        </div>
                        <div style={{ opacity: 0.7, marginTop: "0.25rem" }}>
                          {mission.completedAt
                            ? new Date(mission.completedAt).toLocaleDateString(
                                "vi-VN",
                              )
                            : "Chưa có ngày hoàn thành"}
                          {mission.rating ? ` | ${mission.rating}/5` : ""}
                        </div>
                        {!!mission.requiredSkills?.length && (
                          <div style={{ marginTop: "0.5rem", opacity: 0.85 }}>
                            {mission.requiredSkills.join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="cv-edit-mission-actions">
                        <button
                          type="button"
                          className="cv-edit-btn-add cv-edit-btn-import-mission"
                          onClick={() => importMissionAsExperience(mission)}
                        >
                          <Briefcase size={14} />
                          Import kinh nghiệm
                        </button>
                        <button
                          type="button"
                          className="cv-edit-btn-add cv-edit-btn-import-mission"
                          onClick={() => importMissionAsProject(mission)}
                        >
                          <FolderOpen size={14} />
                          Import dự án
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!profile?.workExperiences?.length &&
              !profile?.educationHistory?.length &&
              !completedMissions.length && (
                <div className="cv-edit-empty-hint">
                  Chưa có nguồn dữ liệu để import vào CV.
                </div>
              )}
          </div>
        )}

        {/* ===== SUMMARY ===== */}
        {renderSectionHeader("summary", "Tóm Tắt")}
        {expandedSections.summary && (
          <div className="cv-edit-section-body">
            <div className="cv-edit-field">
              <textarea
                value={cvData.summary || ""}
                onChange={(e) =>
                  setCvData({ ...cvData, summary: e.target.value })
                }
                placeholder="Mô tả bản thân và mục tiêu nghề nghiệp..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* ===== EXPERIENCE ===== */}
        {renderSectionHeader(
          "experience",
          "Kinh Nghiệm",
          cvData.experience.length,
          addExperience,
        )}
        {expandedSections.experience && (
          <div className="cv-edit-section-body">
            {cvData.experience.map((exp, idx) => (
              <div key={exp.id || idx} className="cv-edit-card">
                <button
                  type="button"
                  className="cv-edit-card-remove"
                  onClick={() => removeExperience(idx)}
                >
                  <Trash2 size={14} />
                </button>
                <div className="cv-edit-row">
                  <div className="cv-edit-field">
                    <label>Vị trí</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) =>
                        updateExperience(idx, "title", e.target.value)
                      }
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>Công ty</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) =>
                        updateExperience(idx, "company", e.target.value)
                      }
                      placeholder="Công ty ABC"
                    />
                  </div>
                </div>
                <div className="cv-edit-row cv-edit-row--3">
                  <div className="cv-edit-field">
                    <label>Bắt đầu</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) =>
                        updateExperience(idx, "startDate", e.target.value)
                      }
                      placeholder="01/2024"
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>Kết thúc</label>
                    <input
                      type="text"
                      value={exp.isCurrent ? "Hiện tại" : exp.endDate || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Hiện tại") {
                          updateExperience(idx, "endDate", "");
                          updateExperience(idx, "isCurrent", true);
                        } else {
                          updateExperience(idx, "endDate", val);
                          updateExperience(idx, "isCurrent", false);
                        }
                      }}
                      placeholder="12/2024 hoặc Hiện tại"
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>Địa điểm</label>
                    <input
                      type="text"
                      value={exp.location || ""}
                      onChange={(e) =>
                        updateExperience(idx, "location", e.target.value)
                      }
                      placeholder="TP. HCM"
                    />
                  </div>
                </div>
                <div className="cv-edit-field">
                  <label>Mô tả</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) =>
                      updateExperience(idx, "description", e.target.value)
                    }
                    rows={2}
                  />
                </div>
                <div className="cv-edit-field">
                  <label>Thành tựu (mỗi dòng 1 mục)</label>
                  <textarea
                    value={(exp.achievements || []).join("\n")}
                    onChange={(e) =>
                      updateExperience(
                        idx,
                        "achievements",
                        e.target.value.split("\n").filter((l) => l.trim()),
                      )
                    }
                    rows={3}
                    placeholder="Tăng hiệu suất 30%..."
                  />
                </div>
                <div className="cv-edit-field">
                  <label>Công nghệ (phân cách dấu phẩy)</label>
                  <input
                    type="text"
                    value={(exp.technologies || []).join(", ")}
                    onChange={(e) =>
                      updateExperience(
                        idx,
                        "technologies",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="React, TypeScript, Node.js"
                  />
                </div>
              </div>
            ))}
            {cvData.experience.length === 0 && (
              <div className="cv-edit-empty-hint">
                Chưa có kinh nghiệm. Nhấn &quot;Thêm&quot; để bắt đầu.
              </div>
            )}
          </div>
        )}

        {/* ===== EDUCATION ===== */}
        {renderSectionHeader(
          "education",
          "Học Vấn",
          cvData.education.length,
          addEducation,
        )}
        {expandedSections.education && (
          <div className="cv-edit-section-body">
            {cvData.education.map((edu, idx) => (
              <div key={edu.id || idx} className="cv-edit-card">
                <button
                  type="button"
                  className="cv-edit-card-remove"
                  onClick={() => removeEducation(idx)}
                >
                  <Trash2 size={14} />
                </button>
                <div className="cv-edit-row">
                  <div className="cv-edit-field">
                    <label>Bằng cấp</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(idx, "degree", e.target.value)
                      }
                      placeholder="Cử nhân CNTT"
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>Trường</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) =>
                        updateEducation(idx, "institution", e.target.value)
                      }
                      placeholder="Đại học ABC"
                    />
                  </div>
                </div>
                <div className="cv-edit-row cv-edit-row--3">
                  <div className="cv-edit-field">
                    <label>Bắt đầu</label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) =>
                        updateEducation(idx, "startDate", e.target.value)
                      }
                      placeholder="2020"
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>Kết thúc</label>
                    <input
                      type="text"
                      value={edu.endDate || ""}
                      onChange={(e) =>
                        updateEducation(idx, "endDate", e.target.value)
                      }
                      placeholder="2024"
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>GPA</label>
                    <input
                      type="text"
                      value={edu.gpa || ""}
                      onChange={(e) =>
                        updateEducation(idx, "gpa", e.target.value)
                      }
                      placeholder="3.5/4.0"
                    />
                  </div>
                </div>
              </div>
            ))}
            {cvData.education.length === 0 && (
              <div className="cv-edit-empty-hint">
                Chưa có học vấn. Nhấn &quot;Thêm&quot; để bắt đầu.
              </div>
            )}
          </div>
        )}

        {/* ===== SKILLS ===== */}
        {renderSectionHeader(
          "skills",
          "Kỹ Năng",
          cvData.skills.length,
          addSkillCategory,
        )}
        {expandedSections.skills && (
          <div className="cv-edit-section-body">
            {cvData.skills.map((cat, idx) => (
              <div key={idx} className="cv-edit-card">
                <button
                  type="button"
                  className="cv-edit-card-remove"
                  onClick={() => removeSkillCategory(idx)}
                >
                  <Trash2 size={14} />
                </button>
                <div className="cv-edit-field">
                  <label>Nhóm kỹ năng</label>
                  <input
                    type="text"
                    value={cat.category}
                    onChange={(e) =>
                      updateSkillCategory(idx, "category", e.target.value)
                    }
                    placeholder="Frontend, Backend, DevOps..."
                  />
                </div>
                <div className="cv-edit-field">
                  <label>Kỹ năng (phân cách dấu phẩy)</label>
                  <input
                    type="text"
                    value={cat.skills.map((s) => s.name).join(", ")}
                    onChange={(e) => {
                      updateSkillCategory(
                        idx,
                        "skills",
                        e.target.value
                          .split(",")
                          .map((s) => ({
                            name: s.trim(),
                            level: 4,
                          }))
                          .filter((s) => s.name),
                      );
                    }}
                    placeholder="React, TypeScript, Node.js..."
                  />
                </div>
              </div>
            ))}
            {cvData.skills.length === 0 && (
              <div className="cv-edit-empty-hint">
                Chưa có kỹ năng. Nhấn &quot;Thêm&quot; để bắt đầu.
              </div>
            )}
          </div>
        )}

        {/* ===== PROJECTS ===== */}
        {renderSectionHeader(
          "projects",
          "Dự Án",
          cvData.projects.length,
          addProject,
        )}
        {expandedSections.projects && (
          <div className="cv-edit-section-body">
            {cvData.projects.map((proj, idx) => (
              <div key={proj.id || idx} className="cv-edit-card">
                <button
                  type="button"
                  className="cv-edit-card-remove"
                  onClick={() => removeProject(idx)}
                >
                  <Trash2 size={14} />
                </button>
                <div className="cv-edit-row">
                  <div className="cv-edit-field">
                    <label>Tên dự án</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) =>
                        updateProject(idx, "title", e.target.value)
                      }
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>Vai trò</label>
                    <input
                      type="text"
                      value={proj.role || ""}
                      onChange={(e) =>
                        updateProject(idx, "role", e.target.value)
                      }
                      placeholder="Team Lead"
                    />
                  </div>
                </div>
                <div className="cv-edit-field">
                  <label>Mô tả</label>
                  <textarea
                    value={proj.description}
                    onChange={(e) =>
                      updateProject(idx, "description", e.target.value)
                    }
                    rows={2}
                  />
                </div>
                <div className="cv-edit-row">
                  <div className="cv-edit-field">
                    <label>Công nghệ (phân cách dấu phẩy)</label>
                    <input
                      type="text"
                      value={proj.technologies.join(", ")}
                      onChange={(e) =>
                        updateProject(
                          idx,
                          "technologies",
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>URL</label>
                    <input
                      type="url"
                      value={proj.url || ""}
                      onChange={(e) =>
                        updateProject(idx, "url", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="cv-edit-field">
                  <label>Kết quả (mỗi dòng 1 mục)</label>
                  <textarea
                    value={(proj.outcomes || []).join("\n")}
                    onChange={(e) =>
                      updateProject(
                        idx,
                        "outcomes",
                        e.target.value.split("\n").filter((l) => l.trim()),
                      )
                    }
                    rows={2}
                  />
                </div>
              </div>
            ))}
            {cvData.projects.length === 0 && (
              <div className="cv-edit-empty-hint">Chưa có dự án.</div>
            )}
          </div>
        )}

        {/* ===== CERTIFICATES ===== */}
        {renderSectionHeader(
          "certificates",
          "Chứng Chỉ",
          cvData.certificates.length,
          addCertificate,
        )}
        {expandedSections.certificates && (
          <div className="cv-edit-section-body">
            {cvData.certificates.map((cert, idx) => (
              <div key={cert.id || idx} className="cv-edit-card">
                <button
                  type="button"
                  className="cv-edit-card-remove"
                  onClick={() => removeCertificate(idx)}
                >
                  <Trash2 size={14} />
                </button>
                <div className="cv-edit-row cv-edit-row--3">
                  <div className="cv-edit-field">
                    <label>Tên chứng chỉ</label>
                    <input
                      type="text"
                      value={cert.title}
                      onChange={(e) =>
                        updateCertificate(idx, "title", e.target.value)
                      }
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>Tổ chức cấp</label>
                    <input
                      type="text"
                      value={cert.issuingOrganization}
                      onChange={(e) =>
                        updateCertificate(
                          idx,
                          "issuingOrganization",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>Ngày cấp</label>
                    <input
                      type="text"
                      value={cert.issueDate}
                      onChange={(e) =>
                        updateCertificate(idx, "issueDate", e.target.value)
                      }
                      placeholder="01/2024"
                    />
                  </div>
                </div>
              </div>
            ))}
            {cvData.certificates.length === 0 && (
              <div className="cv-edit-empty-hint">Chưa có chứng chỉ.</div>
            )}
          </div>
        )}

        {/* ===== LANGUAGES ===== */}
        {renderSectionHeader(
          "languages",
          "Ngôn Ngữ",
          cvData.languages?.length || 0,
          () => {
            setCvData({
              ...cvData,
              languages: [
                ...(cvData.languages || []),
                { name: "", proficiency: "Intermediate" },
              ],
            });
          },
        )}
        {expandedSections.languages && (
          <div className="cv-edit-section-body">
            {(cvData.languages || []).map((lang, idx) => (
              <div key={idx} className="cv-edit-card cv-edit-card--compact">
                <button
                  type="button"
                  className="cv-edit-card-remove"
                  onClick={() => {
                    setCvData({
                      ...cvData,
                      languages: cvData.languages.filter((_, i) => i !== idx),
                    });
                  }}
                >
                  <Trash2 size={14} />
                </button>
                <div className="cv-edit-row">
                  <div className="cv-edit-field">
                    <label>Ngôn ngữ</label>
                    <input
                      type="text"
                      value={lang.name}
                      onChange={(e) => {
                        const updated = [...cvData.languages];
                        updated[idx] = {
                          ...lang,
                          name: e.target.value,
                        };
                        setCvData({
                          ...cvData,
                          languages: updated,
                        });
                      }}
                    />
                  </div>
                  <div className="cv-edit-field">
                    <label>Trình độ</label>
                    <select
                      value={lang.proficiency}
                      onChange={(e) => {
                        const updated = [...cvData.languages];
                        updated[idx] = {
                          ...lang,
                          proficiency: e.target.value as any,
                        };
                        setCvData({
                          ...cvData,
                          languages: updated,
                        });
                      }}
                    >
                      <option value="Native">Native</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Basic">Basic</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <div className="cv-edit-actions">
          <button
            type="button"
            className="cv-edit-btn-save"
            onClick={saveEditedCV}
            disabled={saving}
          >
            {saving ? (
              <>
                <MeowlKuruLoader size="tiny" text="" /> Đang lưu...
              </>
            ) : (
              <>
                <Check size={16} /> Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ==================== RENDER: GENERATE PANEL ====================

  const renderGeneratePanel = () => (
    <div className="cv-generate-panel">
      <div className="cv-generate-header">
        <Sparkles size={24} />
        <div>
          <h3>{activeCV ? "Tạo lại CV với AI" : "Tạo CV mới với AI"}</h3>
          <p>AI sẽ tổng hợp dữ liệu portfolio và tạo CV chuyên nghiệp</p>
        </div>
      </div>

      {/* Template Selection */}
      <div className="cv-generate-section">
        <label className="cv-generate-label">Chọn Template</label>
        <div className="cv-template-grid">
          {CV_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              className={`cv-template-card ${templateName === tpl.name ? "cv-template-card--active" : ""}`}
              onClick={() => switchTemplate(tpl.name)}
            >
              <div className="cv-template-card-icon">
                {renderTemplateIcon(tpl.name, 20)}
              </div>
              <div className="cv-template-card-name">{tpl.displayName}</div>
              <div className="cv-template-card-desc">{tpl.descriptionVi}</div>
              <div className="cv-template-card-colors">
                {Object.values(tpl.previewColors)
                  .slice(0, 3)
                  .map((c, i) => (
                    <span
                      key={i}
                      className="cv-template-color-dot"
                      style={{ background: c }}
                    />
                  ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="cv-generate-section">
        <label className="cv-generate-label">Ngôn ngữ</label>
        <div className="cv-generate-toggle-group">
          <button
            className={`cv-generate-toggle ${language === "vi" ? "active" : ""}`}
            onClick={() => setLanguage("vi")}
          >
            <Languages size={14} /> Tiếng Việt
          </button>
          <button
            className={`cv-generate-toggle ${language === "en" ? "active" : ""}`}
            onClick={() => setLanguage("en")}
          >
            <Globe size={14} /> English
          </button>
        </div>
      </div>

      {/* Contact Info Override */}
      <div className="cv-generate-section">
        <label className="cv-generate-label">
          Thông tin liên hệ (tùy chọn)
        </label>
        <div className="cv-edit-row">
          <div className="cv-edit-field">
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Email liên hệ"
            />
          </div>
          <div className="cv-edit-field">
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Số điện thoại"
            />
          </div>
        </div>
      </div>

      <div className="cv-generate-section">
        <label className="cv-generate-label">Nguồn dữ liệu hệ thống</label>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={includeCompletedMissions}
            onChange={(e) => setIncludeCompletedMissions(e.target.checked)}
            style={{ marginTop: "0.2rem" }}
          />
          <div>
            <div>Bao gồm mission đã hoàn thành</div>
            <small style={{ opacity: 0.75 }}>
              AI có thể dùng mission đã làm trong SkillVerse để bổ sung
              kinh nghiệm và dự án.
            </small>
          </div>
        </label>
      </div>

      {/* Target Optimization */}
      <div className="cv-generate-section">
        <label className="cv-generate-label">Tối ưu cho vị trí</label>
        <div className="cv-edit-row">
          <div className="cv-edit-field">
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="VD: Frontend Developer"
            />
          </div>
        </div>
      </div>

      {/* Additional Instructions */}
      <div className="cv-generate-section">
        <label className="cv-generate-label">Yêu cầu thêm cho AI</label>
        <div className="cv-edit-field">
          <textarea
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="VD: Nhấn mạnh kinh nghiệm về React, sử dụng giọng văn chuyên nghiệp..."
            rows={3}
          />
        </div>
      </div>

      <button
        className="cv-generate-btn"
        onClick={handleRegenerate}
        disabled={loading}
      >
        {loading ? (
          <>
            <MeowlKuruLoader size="tiny" text="" /> Đang tạo CV...
          </>
        ) : (
          <>
            <Sparkles size={18} /> {activeCV ? "Tạo lại CV" : "Tạo CV mới"}
          </>
        )}
      </button>
    </div>
  );

  // ==================== RENDER: MAIN ====================

  return (
    <div className={`compiler-container ${theme}`}>
      {/* Background */}
      <div className="compiler__space-bg">
        <div className="compiler-stars">
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className="compiler-star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <motion.div
        className="compiler-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="compiler-header__left">
          <button
            className="compiler-btn compiler-btn--ghost"
            onClick={() => navigate("/portfolio")}
          >
            <ArrowLeft size={18} />
            <span className="compiler-btn-text">PORTFOLIO</span>
          </button>
          <div className="compiler-header__title-group">
            <h1 className="compiler-header__title">
              <FileText size={20} />
              DATA COMPILER
            </h1>
          </div>
        </div>

        <div className="compiler-header__center">
          {/* Tab Navigation */}
          <div className="compiler-tabs">
            <button
              className={`compiler-tab ${activeTab === "preview" ? "compiler-tab--active" : ""}`}
              onClick={() => setActiveTab("preview")}
            >
              <Eye size={16} />
              <span>Xem CV</span>
            </button>
            <button
              className={`compiler-tab ${activeTab === "edit" ? "compiler-tab--active" : ""}`}
              onClick={() => setActiveTab("edit")}
            >
              <Edit size={16} />
              <span>Chỉnh sửa</span>
            </button>
            <button
              className={`compiler-tab ${activeTab === "generate" ? "compiler-tab--active" : ""}`}
              onClick={() => setActiveTab("generate")}
            >
              <Sparkles size={16} />
              <span>{activeCV ? "Tạo lại AI" : "Tạo mới AI"}</span>
            </button>
          </div>
        </div>

        <div className="compiler-header__right">
          <div className="compiler-header__actions">
            {cvData && (
              <>
                <button
                  className="compiler-btn compiler-btn--outline compiler-btn--sm"
                  onClick={() => globalThis.print?.()}
                  title="In CV"
                >
                  <Printer size={16} />
                </button>
                <button
                  className="compiler-btn compiler-btn--outline compiler-btn--sm"
                  onClick={handleShare}
                  title="Chia sẻ"
                >
                  <Share2 size={16} />
                </button>
                <button
                  className="compiler-btn compiler-btn--primary compiler-btn--sm"
                  onClick={handleDownloadPDF}
                  title="Tải PDF"
                >
                  <Download size={16} />
                  <span className="compiler-btn-text">PDF</span>
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            className="compiler-toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MAIN CONTENT ===== */}
      <div
        className={`compiler-content ${activeTab !== "preview" ? "compiler-content--split" : ""}`}
      >
        {/* LEFT: Edit / Generate Panel */}
        <AnimatePresence mode="wait">
          {activeTab !== "preview" && (
            <motion.div
              className="compiler-sidebar"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              key={activeTab}
            >
              {activeTab === "edit" && renderEditPanel()}
              {activeTab === "generate" && renderGeneratePanel()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT: CV Preview */}
        <motion.div
          className={`compiler-preview ${activeTab === "preview" ? "compiler-preview--full" : ""}`}
          layout
          transition={{ duration: 0.3 }}
        >
          <div className="compiler-document">
            {loading && (
              <div className="compiler-loading">
                <MeowlKuruLoader size="medium" text="ĐANG TẢI DỮ LIỆU CV..." />
              </div>
            )}

            {!loading && error && (
              <div className="compiler-error">
                <div className="compiler-error-icon">
                  <AlertTriangle size={40} />
                </div>
                <div className="compiler-error-text">{error}</div>
                <button
                  className="compiler-btn compiler-btn--primary"
                  onClick={() => setActiveTab("generate")}
                >
                  <Sparkles size={16} /> Tạo CV mới
                </button>
              </div>
            )}

            {!loading && !error && cvData && (
              <div
                ref={cvPreviewRef}
                className="cv-generated"
                style={{ background: "white" }}
              >
                <CVTemplateRenderer
                  data={cvData}
                  template={getActiveTemplateName()}
                />
              </div>
            )}

            {!loading && !error && !cvData && !activeCV && (
              <div className="compiler-empty">
                <div className="compiler-empty-icon">
                  <FileText size={44} />
                </div>
                <h3>Chưa có CV</h3>
                <p>Tạo CV chuyên nghiệp từ dữ liệu portfolio của bạn</p>
                <button
                  className="compiler-btn compiler-btn--primary"
                  onClick={() => setActiveTab("generate")}
                >
                  <Sparkles size={16} /> Tạo CV với AI
                </button>
              </div>
            )}

            {!loading && !error && activeCV && (
              <div className="compiler-metadata">
                <span>Version {activeCV.version}</span>
                <span>•</span>
                <span>{getActiveTemplateName()}</span>
                {activeCV.generatedByAi && (
                  <span className="compiler-metadata-badge">AI Generated</span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <SystemAlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default DataCompilerPreview;
