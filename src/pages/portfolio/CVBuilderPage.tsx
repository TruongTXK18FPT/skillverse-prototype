// CV Builder Page - Manual CV editing with AI enhancement for specific sections
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Sparkles,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader,
} from "lucide-react";
import CVTemplateRenderer from "../../components/cv-templates/CVTemplateRenderer";
import AIEnhanceDialog from "../../components/cv-builder/AIEnhanceDialog";
import {
  CVStructuredData,
  CVTemplateName,
  EMPTY_CV_DATA,
  parseCVJson,
  CVExperience,
  CVProject,
  CVEducation,
} from "../../data/cvTemplateTypes";
import {
  GeneratedCV,
  updateCV,
  enhanceCVSection,
} from "../../data/cvBuilderApi";
import { showAppSuccess, showAppError } from "../../context/ToastContext";
import "../../styles/cv-builder.css";

interface CVBuilderPageProps {
  initialCV?: GeneratedCV;
}

const CVBuilderPage: React.FC<CVBuilderPageProps> = ({ initialCV }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialCvData = (location.state?.cv as GeneratedCV) || initialCV;

  const [cv] = useState<GeneratedCV | null>(initialCvData || null);
  const [cvData, setCvData] = useState<CVStructuredData>(EMPTY_CV_DATA);
  const [selectedTemplate, setSelectedTemplate] =
    useState<CVTemplateName>("PROFESSIONAL");
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "personalInfo",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [enhanceDialogOpen, setEnhanceDialogOpen] = useState(false);
  const [enhanceSection, setEnhanceSection] = useState<string>("");
  const [enhanceItemId, setEnhanceItemId] = useState<string | undefined>(
    undefined,
  );
  const [enhanceContent, setEnhanceContent] = useState<string>("");
  const [enhanceContext, setEnhanceContext] = useState<Record<string, string>>(
    {},
  );

  // Parse CV JSON on load
  useEffect(() => {
    if (cv?.cvJson) {
      const parsed = parseCVJson(cv.cvJson);
      if (parsed) {
        setCvData(parsed);
      }
    }
    if (cv?.templateName) {
      setSelectedTemplate(cv.templateName as CVTemplateName);
    }
  }, [cv]);

  const handleSave = useCallback(async () => {
    if (!cv) return;

    setIsSaving(true);
    try {
      const cvJson = JSON.stringify(cvData);
      await updateCV(cv.id, { cvJson });
      setHasChanges(false);
      showAppSuccess("Đã lưu CV", "Thay đổi của bạn đã được lưu.");
    } catch (error) {
      console.error("Error saving CV:", error);
      showAppError("Lỗi lưu CV", "Không thể lưu CV. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }, [cv, cvData]);

  // Auto-save after 30 seconds
  useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        handleSave();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [hasChanges, cvData, handleSave]);

  const handleEnhance = async (section: string, instruction: string) => {
    if (!cv) return;

    try {
      const response = await enhanceCVSection({
        section: section as any,
        itemId: enhanceItemId,
        instruction,
        currentContent: enhanceContent,
        contextData: enhanceContext,
      });

      if (response.success && response.data) {
        const updatedData = { ...cvData };

        switch (section) {
          case "summary":
            updatedData.summary = response.data.enhancedContent;
            break;
          case "experience":
            if (enhanceItemId) {
              const expIndex = updatedData.experience.findIndex(
                (exp: CVExperience) => exp.id === enhanceItemId,
              );
              if (expIndex >= 0) {
                updatedData.experience[expIndex].description =
                  response.data.enhancedContent;
              }
            }
            break;
          case "project":
            if (enhanceItemId) {
              const projIndex = updatedData.projects.findIndex(
                (proj: CVProject) => proj.id === enhanceItemId,
              );
              if (projIndex >= 0) {
                updatedData.projects[projIndex].description =
                  response.data.enhancedContent;
              }
            }
            break;
        }

        setCvData(updatedData);
        setHasChanges(true);
        setEnhanceDialogOpen(false);
        showAppSuccess(
          "Đã cải thiện",
          "AI đã giúp cải thiện nội dung của bạn.",
        );
      }
    } catch (error) {
      console.error("Error enhancing section:", error);
      showAppError("Lỗi AI", "Không thể cải thiện nội dung. Vui lòng thử lại.");
    }
  };

  const openEnhanceDialog = (
    section: string,
    content: string,
    itemId?: string,
    context?: Record<string, string>,
  ) => {
    setEnhanceSection(section);
    setEnhanceItemId(itemId);
    setEnhanceContent(content);
    setEnhanceContext(context || {});
    setEnhanceDialogOpen(true);
  };

  const updatePersonalInfo = (
    field: keyof typeof cvData.personalInfo,
    value: string,
  ) => {
    setCvData((prev: CVStructuredData) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateSummary = (value: string) => {
    setCvData((prev: CVStructuredData) => ({ ...prev, summary: value }));
    setHasChanges(true);
  };

  const updateExperience = (
    id: string,
    field: keyof CVExperience,
    value: any,
  ) => {
    setCvData((prev: CVStructuredData) => ({
      ...prev,
      experience: prev.experience.map((e: CVExperience) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    }));
    setHasChanges(true);
  };

  const addExperience = () => {
    const newId = `exp_${Date.now()}`;
    setCvData((prev: CVStructuredData) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: newId,
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          description: "",
          achievements: [],
          technologies: [],
        },
      ],
    }));
    setHasChanges(true);
  };

  const removeExperience = (id: string) => {
    setCvData((prev: CVStructuredData) => ({
      ...prev,
      experience: prev.experience.filter((exp: CVExperience) => exp.id !== id),
    }));
    setHasChanges(true);
  };

  const updateProject = (id: string, field: keyof CVProject, value: any) => {
    setCvData((prev: CVStructuredData) => ({
      ...prev,
      projects: prev.projects.map((p: CVProject) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    }));
    setHasChanges(true);
  };

  const updateEducation = (
    id: string,
    field: keyof CVEducation,
    value: any,
  ) => {
    setCvData((prev: CVStructuredData) => ({
      ...prev,
      education: prev.education.map((edu: CVEducation) =>
        edu.id === id ? { ...edu, [field]: value } : edu,
      ),
    }));
    setHasChanges(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!cv) {
    return (
      <div className="cv-builder-empty">
        <FileText size={48} />
        <h2>Không tìm thấy CV</h2>
        <p>Vui lòng tạo CV từ Portfolio trước.</p>
        <button
          onClick={() => navigate("/portfolio")}
          className="cv-btn-primary"
        >
          Quay lại Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="cv-builder-page">
      {/* Header */}
      <div className="cv-builder-header">
        <div className="cv-builder-header-left">
          <button
            onClick={() => navigate("/portfolio")}
            className="cv-btn-icon"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Chỉnh Sửa CV</h1>
            <p className="cv-version">
              Version {cv.version}{" "}
              {cv.generatedByAi ? "(AI Generated)" : "(Manual Export)"}
            </p>
          </div>
        </div>
        <div className="cv-builder-header-right">
          {hasChanges && (
            <span className="cv-unsaved-indicator">
              <span className="cv-dot"></span>
              Chưa lưu
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="cv-btn-primary"
          >
            {isSaving ? (
              <Loader size={18} className="cv-spinner" />
            ) : (
              <Save size={18} />
            )}
            Lưu
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="cv-builder-content">
        {/* Left Panel - Editor */}
        <div className="cv-builder-editor">
          {/* Template Selector */}
          <div className="cv-section">
            <div
              className="cv-section-header"
              onClick={() => toggleSection("template")}
            >
              <h3>Mẫu CV</h3>
              {expandedSection === "template" ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>
            {expandedSection === "template" && (
              <div className="cv-section-content">
                <div className="cv-template-selector">
                  {(
                    [
                      "PROFESSIONAL",
                      "MODERN",
                      "MINIMAL",
                      "CREATIVE",
                    ] as CVTemplateName[]
                  ).map((template) => (
                    <button
                      key={template}
                      className={`cv-template-option ${selectedTemplate === template ? "active" : ""}`}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setHasChanges(true);
                      }}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Personal Info */}
          <div className="cv-section">
            <div
              className="cv-section-header"
              onClick={() => toggleSection("personalInfo")}
            >
              <h3>Thông Tin Cá Nhân</h3>
              {expandedSection === "personalInfo" ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>
            {expandedSection === "personalInfo" && (
              <div className="cv-section-content">
                <div className="cv-form-grid">
                  <div className="cv-form-group">
                    <label>Họ và tên</label>
                    <input
                      type="text"
                      value={cvData.personalInfo.fullName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updatePersonalInfo("fullName", e.target.value)
                      }
                    />
                  </div>
                  <div className="cv-form-group">
                    <label>Vị trí ứng tuyển</label>
                    <input
                      type="text"
                      value={cvData.personalInfo.professionalTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updatePersonalInfo("professionalTitle", e.target.value)
                      }
                    />
                  </div>
                  <div className="cv-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={cvData.personalInfo.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updatePersonalInfo("email", e.target.value)
                      }
                    />
                  </div>
                  <div className="cv-form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      value={cvData.personalInfo.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updatePersonalInfo("phone", e.target.value)
                      }
                    />
                  </div>
                  <div className="cv-form-group cv-form-full">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      value={cvData.personalInfo.location}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updatePersonalInfo("location", e.target.value)
                      }
                    />
                  </div>
                  <div className="cv-form-group">
                    <label>LinkedIn</label>
                    <input
                      type="url"
                      value={cvData.personalInfo.linkedinUrl || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updatePersonalInfo("linkedinUrl", e.target.value)
                      }
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="cv-form-group">
                    <label>GitHub</label>
                    <input
                      type="url"
                      value={cvData.personalInfo.githubUrl || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updatePersonalInfo("githubUrl", e.target.value)
                      }
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary with AI Enhance */}
          <div className="cv-section">
            <div
              className="cv-section-header"
              onClick={() => toggleSection("summary")}
            >
              <h3>Tóm Tắt (Summary)</h3>
              <div className="cv-section-actions">
                <button
                  className="cv-btn-ai-enhance"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    openEnhanceDialog("summary", cvData.summary, undefined, {
                      fullName: cvData.personalInfo.fullName,
                      professionalTitle: cvData.personalInfo.professionalTitle,
                    });
                  }}
                >
                  <Sparkles size={14} />
                  Viết với AI
                </button>
                {expandedSection === "summary" ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </div>
            </div>
            {expandedSection === "summary" && (
              <div className="cv-section-content">
                <textarea
                  className="cv-textarea"
                  rows={4}
                  value={cvData.summary}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateSummary(e.target.value)
                  }
                  placeholder="Viết tóm tắt ngắn gọn về bản thân (2-4 câu)..."
                />
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="cv-section">
            <div
              className="cv-section-header"
              onClick={() => toggleSection("experience")}
            >
              <h3>Kinh Nghiệm Làm Việc</h3>
              <div className="cv-section-actions">
                <button
                  className="cv-btn-add"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    addExperience();
                  }}
                >
                  <Plus size={14} />
                </button>
                {expandedSection === "experience" ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </div>
            </div>
            {expandedSection === "experience" && (
              <div className="cv-section-content">
                {cvData.experience.length === 0 ? (
                  <p className="cv-empty">
                    Chưa có kinh nghiệm. Nhấn + để thêm.
                  </p>
                ) : (
                  cvData.experience.map((exp: CVExperience, index: number) => (
                    <div key={exp.id} className="cv-item-card">
                      <div className="cv-item-header">
                        <span>Kinh nghiệm #{index + 1}</span>
                        <div className="cv-item-actions">
                          <button
                            className="cv-btn-ai-enhance-sm"
                            onClick={() =>
                              openEnhanceDialog(
                                "experience",
                                exp.description,
                                exp.id,
                                {
                                  title: exp.title,
                                  company: exp.company,
                                },
                              )
                            }
                          >
                            <Sparkles size={12} />
                            AI
                          </button>
                          <button
                            className="cv-btn-remove"
                            onClick={() => removeExperience(exp.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="cv-form-grid">
                        <div className="cv-form-group">
                          <label>Vị trí</label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateExperience(exp.id, "title", e.target.value)
                            }
                          />
                        </div>
                        <div className="cv-form-group">
                          <label>Công ty</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateExperience(
                                exp.id,
                                "company",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="cv-form-group cv-form-full">
                          <label>
                            Mô tả công việc{" "}
                            <span className="cv-label-hint">
                              hỗ trợ Markdown: **bold**, - list, ## heading, |
                              table |
                            </span>
                          </label>
                          <textarea
                            rows={5}
                            value={exp.description}
                            onChange={(
                              e: React.ChangeEvent<HTMLTextAreaElement>,
                            ) =>
                              updateExperience(
                                exp.id,
                                "description",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="cv-section">
            <div
              className="cv-section-header"
              onClick={() => toggleSection("projects")}
            >
              <h3>Dự Án</h3>
              {expandedSection === "projects" ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>
            {expandedSection === "projects" && (
              <div className="cv-section-content">
                {cvData.projects.length === 0 ? (
                  <p className="cv-empty">Chưa có dự án nào được thêm.</p>
                ) : (
                  cvData.projects.map((proj: CVProject, index: number) => (
                    <div key={proj.id} className="cv-item-card">
                      <div className="cv-item-header">
                        <span>{proj.title || `Dự án #${index + 1}`}</span>
                        <div className="cv-item-actions">
                          <button
                            className="cv-btn-ai-enhance-sm"
                            onClick={() =>
                              openEnhanceDialog(
                                "project",
                                proj.description,
                                proj.id,
                                {
                                  title: proj.title,
                                  technologies:
                                    proj.technologies?.join(", ") || "",
                                },
                              )
                            }
                          >
                            <Sparkles size={12} />
                            AI
                          </button>
                        </div>
                      </div>
                      <div className="cv-form-group">
                        <label>
                          Mô tả{" "}
                          <span className="cv-label-hint">
                            hỗ trợ Markdown: **bold**, - list, ## heading
                          </span>
                        </label>
                        <textarea
                          rows={4}
                          value={proj.description}
                          onChange={(
                            e: React.ChangeEvent<HTMLTextAreaElement>,
                          ) =>
                            updateProject(
                              proj.id,
                              "description",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="cv-section">
            <div
              className="cv-section-header"
              onClick={() => toggleSection("education")}
            >
              <h3>Học Vấn</h3>
              {expandedSection === "education" ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>
            {expandedSection === "education" && (
              <div className="cv-section-content">
                {cvData.education.length === 0 ? (
                  <p className="cv-empty">Chưa có thông tin học vấn.</p>
                ) : (
                  cvData.education.map((edu: CVEducation) => (
                    <div key={edu.id} className="cv-item-card">
                      <div className="cv-form-grid">
                        <div className="cv-form-group">
                          <label>Bằng cấp</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateEducation(edu.id, "degree", e.target.value)
                            }
                          />
                        </div>
                        <div className="cv-form-group">
                          <label>Trường</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateEducation(
                                edu.id,
                                "institution",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="cv-builder-preview">
          <div className="cv-preview-header">
            <h3>Xem trước</h3>
            <span className="cv-template-badge">{selectedTemplate}</span>
          </div>
          <div className="cv-preview-content">
            <CVTemplateRenderer data={cvData} template={selectedTemplate} />
          </div>
        </div>
      </div>

      {/* AI Enhance Dialog */}
      <AIEnhanceDialog
        isOpen={enhanceDialogOpen}
        onClose={() => setEnhanceDialogOpen(false)}
        onEnhance={handleEnhance}
        section={enhanceSection}
        currentContent={enhanceContent}
      />
    </div>
  );
};

export default CVBuilderPage;
